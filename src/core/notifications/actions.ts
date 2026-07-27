'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { requireUser } from '@/core/auth/session';
import { getDatabase } from '@/core/db/client';
import { notificationPrefs } from '@/core/db/schema';
import { notifications } from '@/core/db/schema';
import type { NotifPrefKey } from '@/types';

const columns = {
  recs: 'recommendations',
  friendActivity: 'friendActivity',
  chart: 'chartUpdates',
  emailDigest: 'emailDigest',
} as const;

export async function updateNotificationPreference(key: NotifPrefKey, enabled: boolean) {
  const user = await requireUser();
  const database = getDatabase();
  if (!database) return { ok: false as const, error: 'Database configuration is required.' };
  await database
    .insert(notificationPrefs)
    .values({ userId: user.id, [columns[key]]: enabled })
    .onConflictDoUpdate({
      target: notificationPrefs.userId,
      set: { [columns[key]]: enabled },
    });
  return { ok: true as const };
}

export async function markNotificationRead(notificationId: string) {
  const user = await requireUser();
  const database = getDatabase();
  if (!database) return { ok: false as const, error: 'Database configuration is required.' };
  await database
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)));
  return { ok: true as const };
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  const database = getDatabase();
  if (!database) return { ok: false as const, error: 'Database configuration is required.' };
  await database
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  return { ok: true as const };
}
