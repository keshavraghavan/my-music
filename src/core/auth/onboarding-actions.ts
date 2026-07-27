'use server';

import { eq } from 'drizzle-orm';
import { getDatabase } from '@/core/db/client';
import { notificationPrefs, pageModules, profiles, userPrefs } from '@/core/db/schema';
import type { ModuleKey, ProfileForm } from '@/types';
import { initialsFor, isHandleAvailable, isValidHandle, normalizeHandle } from './profile';
import { isLocalE2E, requireUser } from './session';

const MODULE_KEYS = [
  'feed',
  'nowPlaying',
  'chart',
  'recs',
  'monthly',
  'receipt',
  'friendsList',
] satisfies ModuleKey[];

export async function saveOnboardingProfile(profile: ProfileForm) {
  if (isLocalE2E()) return;
  const user = await requireUser();
  const database = getDatabase();
  if (!database) throw new Error('Database configuration is required for onboarding');

  const displayName = profile.name.trim();
  const handle = normalizeHandle(profile.handle);
  if (displayName.length < 1 || displayName.length > 80) throw new Error('Enter your name');
  if (!isValidHandle(handle)) throw new Error('Use 3–24 letters, numbers, or underscores');
  if (!(await isHandleAvailable(handle, user.id))) throw new Error(`@${handle} is already taken`);

  await database
    .update(profiles)
    .set({
      displayName,
      handle,
      bio: profile.bio.trim().slice(0, 280),
      initials: initialsFor(displayName),
    })
    .where(eq(profiles.userId, user.id));
}

export async function saveOnboardingModules(enabledKeys: ModuleKey[]) {
  if (isLocalE2E()) return;
  const user = await requireUser();
  const database = getDatabase();
  if (!database) throw new Error('Database configuration is required for onboarding');
  const selected = new Set(enabledKeys.filter((key) => MODULE_KEYS.includes(key)));

  await database.transaction(async (transaction) => {
    for (const [position, moduleKey] of MODULE_KEYS.entries()) {
      await transaction
        .insert(pageModules)
        .values({
          userId: user.id,
          moduleKey,
          enabled: selected.has(moduleKey),
          position,
          span: moduleKey === 'nowPlaying' || moduleKey === 'chart' ? 2 : 1,
        })
        .onConflictDoUpdate({
          target: [pageModules.userId, pageModules.moduleKey],
          set: { enabled: selected.has(moduleKey), position },
        });
    }
  });
}

export async function completeOnboarding() {
  if (isLocalE2E()) return;
  const user = await requireUser();
  const database = getDatabase();
  if (!database) throw new Error('Database configuration is required for onboarding');

  await database.transaction(async (transaction) => {
    await transaction
      .update(profiles)
      .set({ onboardingCompletedAt: new Date() })
      .where(eq(profiles.userId, user.id));
    await transaction.insert(userPrefs).values({ userId: user.id }).onConflictDoNothing();
    await transaction.insert(notificationPrefs).values({ userId: user.id }).onConflictDoNothing();
  });
}
