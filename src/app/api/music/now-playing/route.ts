import { currentUser } from '@/core/auth/session';
import { providerForUser } from '@/domains/music/provider-service';
import { MusicProviderAuthError } from '@/domains/music/providers';

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const provider = await providerForUser(user.id);
    const current = await provider.nowPlaying();
    return Response.json(
      current
        ? {
            provider: provider.key,
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
          }
        : { provider: provider.key, current: null },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    if (error instanceof MusicProviderAuthError) {
      return Response.json(
        { error: 'Reconnect your music service to resume Now Playing.', reconnect: true },
        { status: 409 },
      );
    }
    return Response.json({ error: 'Now Playing is unavailable.' }, { status: 502 });
  }
}
