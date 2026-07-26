// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { canViewProfile, type ProfileAccessFacts } from '@/core/graph/authorization';

const ownerId = 'owner';

describe('profile authorization policy', () => {
  const cases: Array<[string, Omit<ProfileAccessFacts, 'ownerId'>, boolean]> = [
    [
      'allows an owner to see their own profile',
      {
        viewerId: ownerId,
        isPrivate: true,
        isAcceptedFollower: false,
        isBlockedEitherWay: true,
      },
      true,
    ],
    [
      'allows an authenticated viewer to see an unblocked public profile',
      {
        viewerId: 'viewer',
        isPrivate: false,
        isAcceptedFollower: false,
        isBlockedEitherWay: false,
      },
      true,
    ],
    [
      'allows an anonymous viewer to see an unblocked public profile',
      {
        viewerId: null,
        isPrivate: false,
        isAcceptedFollower: false,
        isBlockedEitherWay: false,
      },
      true,
    ],
    [
      'allows an accepted follower to see a private profile',
      {
        viewerId: 'viewer',
        isPrivate: true,
        isAcceptedFollower: true,
        isBlockedEitherWay: false,
      },
      true,
    ],
    [
      'denies a non-follower access to a private profile',
      {
        viewerId: 'viewer',
        isPrivate: true,
        isAcceptedFollower: false,
        isBlockedEitherWay: false,
      },
      false,
    ],
    [
      'denies anonymous access to a private profile',
      {
        viewerId: null,
        isPrivate: true,
        isAcceptedFollower: false,
        isBlockedEitherWay: false,
      },
      false,
    ],
    [
      'lets a block override a public profile',
      {
        viewerId: 'viewer',
        isPrivate: false,
        isAcceptedFollower: true,
        isBlockedEitherWay: true,
      },
      false,
    ],
    [
      'lets a block override an accepted private follow',
      {
        viewerId: 'viewer',
        isPrivate: true,
        isAcceptedFollower: true,
        isBlockedEitherWay: true,
      },
      false,
    ],
  ];

  it.each(cases)('%s', (_name, facts, expected) => {
    expect(canViewProfile({ ...facts, ownerId })).toBe(expected);
  });
});
