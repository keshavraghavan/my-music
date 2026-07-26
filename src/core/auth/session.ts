import 'server-only';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getDatabase } from '@/core/db/client';
import { profiles } from '@/core/db/schema';
import { routes } from '@/core/routes';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  name: string | null;
}

export async function currentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}

async function onboardingCompleted(userId: string): Promise<boolean> {
  const database = getDatabase();
  if (!database) return false;
  const [profile] = await database
    .select({ completedAt: profiles.onboardingCompletedAt })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return profile?.completedAt != null;
}

export async function requireOnboardedUser(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (!(await onboardingCompleted(user.id))) redirect(routes.onboarding(1));
  return user;
}

export async function requireOnboardingUser(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (await onboardingCompleted(user.id)) redirect(routes.home);
  return user;
}

export async function authenticatedDestination(): Promise<string | null> {
  const user = await currentUser();
  if (!user) return null;
  return (await onboardingCompleted(user.id)) ? routes.home : routes.onboarding(1);
}
