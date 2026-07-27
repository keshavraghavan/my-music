'use server';

import { eq } from 'drizzle-orm';
import { requireUser } from '@/core/auth/session';
import { getDatabase } from '@/core/db/client';
import { profiles } from '@/core/db/schema';
import { avatarStorageConfig, isOwnedAvatarUrl } from './avatar-storage';

export async function completeAvatarUpload(assetUrl: string) {
  const user = await requireUser();
  const database = getDatabase();
  const config = avatarStorageConfig();
  if (!database || !config) return { ok: false as const, error: 'Avatar storage is unavailable.' };
  if (!isOwnedAvatarUrl(assetUrl, user.id, config)) {
    return { ok: false as const, error: 'That avatar URL is not valid for this account.' };
  }
  await database.update(profiles).set({ avatarUrl: assetUrl }).where(eq(profiles.userId, user.id));
  return { ok: true as const };
}
