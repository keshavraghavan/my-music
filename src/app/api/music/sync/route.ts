import { currentUser } from '@/core/auth/session';
import { assertRateLimit, RateLimitError } from '@/core/auth/rate-limit';
import { syncListeningHistory } from '@/domains/music/provider-service';

export async function POST() {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    assertRateLimit(`music-sync:${user.id}`, { limit: 6, windowMs: 60_000 });
    return Response.json(await syncListeningHistory(user.id));
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json(
        { error: error.message },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } },
      );
    }
    return Response.json(
      { error: 'Music sync failed. Reconnect the service if this persists.' },
      { status: 502 },
    );
  }
}
