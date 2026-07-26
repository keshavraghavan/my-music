import { NextResponse } from 'next/server';
import { currentUser } from '@/core/auth/session';
import { isHandleAvailable, normalizeHandle } from '@/core/auth/profile';
import { assertRateLimit, RateLimitError } from '@/core/auth/rate-limit';

export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { handle } = await params;
  const normalized = normalizeHandle(handle);

  try {
    assertRateLimit(`handle:${user.id}`, { limit: 60, windowMs: 60_000 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } },
      );
    }
    throw error;
  }

  return NextResponse.json({
    handle: normalized,
    available: await isHandleAvailable(normalized, user.id),
  });
}
