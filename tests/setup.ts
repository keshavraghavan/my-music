import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Next's router only exists inside a Next runtime, so every test file gets the
// in-memory stand-in from tests/mocks instead. See tests/mocks/next-navigation.
vi.mock('next/navigation', () => import('./mocks/next-navigation'));
vi.mock('next/link', () => import('./mocks/next-link'));
vi.mock('server-only', () => ({}));
vi.mock('@/core/auth/actions', () => ({
  logout: vi.fn(),
  requestMagicLink: vi.fn(),
  signInWithSpotify: vi.fn(),
}));
vi.mock('@/core/account/actions', () => ({ deleteMyAccount: vi.fn() }));
vi.mock('@/core/graph/actions', () => ({
  followUser: vi
    .fn()
    .mockImplementation((target: string) =>
      Promise.resolve({ ok: true, data: target === 'samo' ? 'pending' : 'accepted' }),
    ),
  cancelFollowRequest: vi.fn().mockResolvedValue({ ok: true }),
  acceptFollowRequest: vi.fn().mockResolvedValue({ ok: true }),
  declineFollowRequest: vi.fn().mockResolvedValue({ ok: true }),
  unfollowUser: vi.fn().mockResolvedValue({ ok: true }),
  blockUser: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock('@/core/auth/onboarding-actions', () => ({
  completeOnboarding: vi.fn(),
  saveOnboardingModules: vi.fn(),
  saveOnboardingProfile: vi.fn(),
}));
vi.mock('@/core/auth/session', () => ({
  authenticatedDestination: vi.fn().mockResolvedValue(null),
  currentUser: vi.fn().mockResolvedValue(null),
  requireOnboardedUser: vi.fn(),
  requireOnboardingUser: vi.fn(),
  requireUser: vi.fn(),
}));
vi.stubGlobal(
  'fetch',
  vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ available: true }),
  }),
);
