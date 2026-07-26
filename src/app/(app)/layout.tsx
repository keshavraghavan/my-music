import type { ReactNode } from 'react';
import { requireOnboardedUser } from '@/core/auth/session';
import { loadAppSnapshot } from '@/core/db/read-model';
import { AppStateProvider } from '@/state/client-store';
import { AppShell } from './AppShell';

/**
 * The authenticated boundary. Keeping the snapshot provider here prevents
 * private account data from being serialized into public pages.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireOnboardedUser();
  const initialState = await loadAppSnapshot(user.id);

  return (
    <AppStateProvider initialState={initialState}>
      <AppShell>{children}</AppShell>
    </AppStateProvider>
  );
}
