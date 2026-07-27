import { desc, eq } from 'drizzle-orm';
import { currentUser } from '@/core/auth/session';
import { getDatabase } from '@/core/db/client';
import { notifications } from '@/core/db/schema';
import { encodeServerEvent, waitForNextTick } from '@/core/realtime/sse';
import { providerForUser } from '@/domains/music/provider-service';
import type { AppNotification, NotificationKind, NowPlaying } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const encoder = new TextEncoder();
const notificationKinds = new Set<NotificationKind>(['rec', 'chart', 'friend', 'playlist']);

function timeAgo(createdAt: Date) {
  const minutes = Math.max(0, Math.round((Date.now() - createdAt.getTime()) / 60_000));
  if (minutes < 60) return minutes <= 1 ? 'JUST NOW' : `${minutes}M AGO`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}H AGO` : `${Math.round(hours / 24)}D AGO`;
}

async function notificationSnapshot(userId: string): Promise<AppNotification[]> {
  const database = getDatabase();
  if (!database) return [];
  const rows = await database
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  return rows.map((row) => ({
    id: row.id,
    type: notificationKinds.has(row.type as NotificationKind)
      ? (row.type as NotificationKind)
      : 'friend',
    text: row.text,
    time: timeAgo(row.createdAt),
    read: row.readAt !== null,
  }));
}

async function nowPlayingSnapshot(userId: string): Promise<NowPlaying | null> {
  const provider = await providerForUser(userId);
  const current = await provider.nowPlaying();
  if (!current) return null;
  return {
    track: current.track.title,
    artist: current.track.artist,
    album: current.track.album,
    progressPct: `${Math.min(
      100,
      Math.round((current.progressMs / current.track.durationMs) * 100),
    )}%`,
    updated: `UPDATED ${current.observedAt.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })}`,
  };
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let notificationSignature = '';
      let nowPlayingSignature = '';
      const enqueue = (value: string) => controller.enqueue(encoder.encode(value));
      enqueue(
        encodeServerEvent({
          event: 'connected',
          data: { at: new Date().toISOString() },
          retry: 5_000,
        }),
      );

      try {
        while (!request.signal.aborted) {
          const [notificationResult, nowPlayingResult] = await Promise.allSettled([
            notificationSnapshot(user.id),
            nowPlayingSnapshot(user.id),
          ]);
          if (notificationResult.status === 'fulfilled') {
            const signature = JSON.stringify(notificationResult.value);
            if (signature !== notificationSignature) {
              notificationSignature = signature;
              enqueue(
                encodeServerEvent({
                  id: `notifications-${Date.now()}`,
                  event: 'notifications',
                  data: notificationResult.value,
                }),
              );
            }
          }
          if (nowPlayingResult.status === 'fulfilled') {
            const signature = JSON.stringify(nowPlayingResult.value);
            if (signature !== nowPlayingSignature) {
              nowPlayingSignature = signature;
              enqueue(
                encodeServerEvent({
                  id: `now-playing-${Date.now()}`,
                  event: 'now-playing',
                  data: nowPlayingResult.value,
                }),
              );
            }
          }
          enqueue(': heartbeat\n\n');
          await waitForNextTick(15_000, request.signal);
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
