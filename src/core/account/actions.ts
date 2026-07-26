'use server';

import { eq } from 'drizzle-orm';
import { signOut } from '@/auth';
import { getDatabase } from '@/core/db/client';
import { users } from '@/core/db/schema';
import { requireUser } from '@/core/auth/session';
import { assertRateLimit } from '@/core/auth/rate-limit';

export async function deleteMyAccount() {
  const user = await requireUser();
  assertRateLimit(`delete-account:${user.id}`, { limit: 2, windowMs: 60 * 60_000 });
  const database = getDatabase();
  if (!database) throw new Error('Database configuration is required');

  // Every user-owned table has an ON DELETE CASCADE foreign key. Deleting this
  // root row removes the session as well as the user's content in one database
  // transaction.
  await database.delete(users).where(eq(users.id, user.id));
  await signOut({ redirectTo: '/' });
}
