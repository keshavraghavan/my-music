import { randomUUID } from 'node:crypto';
import { currentUser } from '@/core/auth/session';
import { assertRateLimit, RateLimitError } from '@/core/auth/rate-limit';
import { avatarStorageConfig, presignAvatarPut } from '@/core/identity/avatar-storage';

const extensions = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    assertRateLimit(`avatar-presign:${user.id}`, { limit: 10, windowMs: 60 * 60_000 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }
  const body = (await request.json()) as { contentType?: string; size?: number };
  const extension = body.contentType ? extensions.get(body.contentType) : undefined;
  if (!extension || !body.size || body.size > 5 * 1024 * 1024) {
    return Response.json(
      { error: 'Choose a JPEG, PNG, or WebP image no larger than 5 MB.' },
      { status: 400 },
    );
  }
  const config = avatarStorageConfig();
  if (!config) {
    return Response.json(
      { error: 'Avatar storage is not configured for this deployment.' },
      { status: 503 },
    );
  }
  return Response.json(
    presignAvatarPut({
      config,
      key: `avatars/${user.id}/${randomUUID()}.${extension}`,
      contentType: body.contentType!,
    }),
  );
}
