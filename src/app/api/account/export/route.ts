import { currentUser } from '@/core/auth/session';
import { assertRateLimit, RateLimitError } from '@/core/auth/rate-limit';
import { exportAccountData } from '@/core/account/data';

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    assertRateLimit(`account-export:${user.id}`, { limit: 5, windowMs: 60 * 60_000 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json(
        { error: error.message },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } },
      );
    }
    throw error;
  }

  const data = await exportAccountData(user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mymusic-account-export.json"',
      'Cache-Control': 'private, no-store',
    },
  });
}
