import type { SettingsTab } from '@/types';

/**
 * Every URL in the app, in one place. Phase 1 kept the whole product on `/`
 * with a `route` string in state; these are the real thing — shareable,
 * back-button-able, and the only source of truth for which screen is showing.
 */
export const ONBOARDING_STEPS = 5;

export const routes = {
  landing: '/',
  onboarding: (step: number) => `/onboarding/${step}`,
  home: '/home',
  friends: '/friends',
  /** A person's page. The handle is the public identifier, not the id. */
  profile: (handle: string) => `/${handle}`,
  playlist: '/playlist',
  notifications: '/notifications',
  settings: (tab: SettingsTab = 'account') => `/settings/${tab}`,
} as const;
