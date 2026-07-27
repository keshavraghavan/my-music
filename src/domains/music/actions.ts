'use server';

import { and, eq } from 'drizzle-orm';
import { currentUser } from '@/core/auth/session';
import { getDatabase } from '@/core/db/client';
import { serviceConnections } from './db/schema/music';

export async function disconnectMusicService(provider: 'spotify' | 'apple') {
  const user = await currentUser();
  if (!user) return { ok: false as const, error: 'Sign in to change music services.' };
  const database = getDatabase();
  if (!database) return { ok: true as const };
  await database
    .delete(serviceConnections)
    .where(and(eq(serviceConnections.userId, user.id), eq(serviceConnections.provider, provider)));
  return { ok: true as const };
}
