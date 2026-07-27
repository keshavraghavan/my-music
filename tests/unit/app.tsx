import { render } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/app/(app)/AppShell';
import FriendsPage from '@/app/(app)/friends/page';
import HomePage from '@/app/(app)/home/page';
import NotificationsPage from '@/app/(app)/notifications/page';
import PlaylistPage from '@/app/(app)/playlist/page';
import { ProfileScreen } from '@/app/(app)/[handle]/ProfileScreen';
import { SettingsScreen } from '@/app/(app)/settings/SettingsScreen';
import { OnboardingScreen } from '@/app/onboarding/[step]/OnboardingScreen';
import { LandingScreen } from '@/app/page';
import { personByHandle } from '@/domains/music/data/people';
import { AppStateProvider, INITIAL_STATE } from '@/state/client-store';
import type { AppState, SettingsTab } from '@/types';
import { testRouter } from '../mocks/next-navigation';

/**
 * Stands in for the App Router: maps the mock router's path to the same screen
 * the real route file would render, inside the same shell and the same store.
 *
 * The route files themselves are one-liners around these components, so what
 * this leaves untested is Next's own resolution — which the e2e suite covers
 * against the real build.
 */
function screenFor(path: string) {
  if (path === '/home') return <HomePage />;
  if (path === '/friends') return <FriendsPage />;
  if (path === '/playlist') return <PlaylistPage />;
  if (path === '/notifications') return <NotificationsPage />;

  const settings = /^\/settings(?:\/([a-z]+))?$/.exec(path);
  if (settings) return <SettingsScreen tab={(settings[1] ?? 'account') as SettingsTab} />;

  const person = personByHandle(path.slice(1));
  if (person) return <ProfileScreen person={person} />;

  throw new Error(`No route matches ${path}`);
}

function TestApp() {
  const path = usePathname();
  if (path === '/') return <LandingScreen />;
  if (path === '/login') return <main>Sign in to MyMusic.</main>;

  const onboarding = /^\/onboarding\/(\d)$/.exec(path);
  if (onboarding) return <OnboardingScreen step={Number(onboarding[1])} />;

  return <AppShell>{screenFor(path)}</AppShell>;
}

/** Renders the app at `path`, with the store fresh. */
export function renderApp(path = '/', initialState: AppState = INITIAL_STATE) {
  testRouter.reset(path);
  return render(
    <AppStateProvider initialState={initialState}>
      <TestApp />
    </AppStateProvider>,
  );
}
