import { currentUser } from '@/core/auth/session';
import { assertRateLimit, RateLimitError } from '@/core/auth/rate-limit';
import { providerForUser } from '@/domains/music/provider-service';
import { MusicProviderAuthError } from '@/domains/music/providers';

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    assertRateLimit(`music-search:${user.id}`, { limit: 60, windowMs: 60_000 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json(
        { error: error.message },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } },
      );
    }
    throw error;
  }
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.slice(0, 200) ?? '';
  const cursor = url.searchParams.get('cursor') ?? undefined;
  try {
    const provider = await providerForUser(user.id);
    const result = await provider.search(query, cursor);
    return Response.json({ provider: provider.key, ...result });
  } catch (error) {
    if (error instanceof MusicProviderAuthError) {
      return Response.json(
        { error: 'Reconnect your music service to search its catalog.', reconnect: true },
        { status: 409 },
      );
    }
    return Response.json({ error: 'Catalog search is unavailable.' }, { status: 502 });
  }
}
