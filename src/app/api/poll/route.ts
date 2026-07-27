import { desc, eq } from 'drizzle-orm';
import { currentUser } from '@/core/auth/session';
import { getDatabase } from '@/core/db/client';
import { notifications } from '@/core/db/schema';
import { providerForUser } from '@/domains/music/provider-service';
import type { AppNotification, NotificationKind, NowPlaying } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [notificationResult, nowPlayingResult] = await Promise.allSettled([
    notificationSnapshot(user.id),
    nowPlayingSnapshot(user.id),
  ]);

  return Response.json(
    {
      notifications:
        notificationResult.status === 'fulfilled' ? notificationResult.value : undefined,
      nowPlaying: nowPlayingResult.status === 'fulfilled' ? nowPlayingResult.value : undefined,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
