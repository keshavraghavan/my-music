import type { ReactNode } from 'react';
import { requireOnboardingUser } from '@/core/auth/session';
import { loadAppSnapshot } from '@/core/db/read-model';
import { AppStateProvider } from '@/state/client-store';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await requireOnboardingUser();
  const initialState = await loadAppSnapshot(user.id);
  return <AppStateProvider initialState={initialState}>{children}</AppStateProvider>;
}
