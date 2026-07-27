import 'server-only';

import { and, eq, or } from 'drizzle-orm';
import { blocks, follows, profiles } from '@/core/db/schema';
import { getDatabase } from '@/core/db/client';

export interface ProfileAccessFacts {
  viewerId: string | null;
  ownerId: string;
  isPrivate: boolean;
  isAcceptedFollower: boolean;
  isBlockedEitherWay: boolean;
}

/** The one policy used by every profile/content read path. */
export function canViewProfile(facts: ProfileAccessFacts): boolean {
  if (facts.viewerId === facts.ownerId) return true;
  if (facts.isBlockedEitherWay) return false;
  if (!facts.isPrivate) return true;
  return facts.viewerId !== null && facts.isAcceptedFollower;
}

export async function canUserViewProfile(
  viewerId: string | null,
  ownerId: string,
): Promise<boolean> {
  if (viewerId === ownerId) return true;
  const database = getDatabase();
  if (!database) return false;

  const [[profile], [block], [follow]] = await Promise.all([
    database
      .select({ isPrivate: profiles.isPrivate })
      .from(profiles)
      .where(eq(profiles.userId, ownerId))
      .limit(1),
    viewerId
      ? database
          .select({ blockerId: blocks.blockerId })
          .from(blocks)
          .where(
            or(
              and(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, ownerId)),
              and(eq(blocks.blockerId, ownerId), eq(blocks.blockedId, viewerId)),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
    viewerId
      ? database
          .select({ status: follows.status })
          .from(follows)
          .where(and(eq(follows.followerId, viewerId), eq(follows.followeeId, ownerId)))
          .limit(1)
      : Promise.resolve([]),
  ]);

  if (!profile) return false;
  return canViewProfile({
    viewerId,
    ownerId,
    isPrivate: profile.isPrivate,
    isBlockedEitherWay: Boolean(block),
    isAcceptedFollower: follow?.status === 'accepted',
  });
}

/** Basic profile identity may render as a locked shell. Blocks still make the
 * account undiscoverable; private content uses `canUserViewProfile` separately. */
export async function canUserAccessProfileShell(viewerId: string | null, ownerId: string) {
  if (viewerId === ownerId) return true;
  const database = getDatabase();
  if (!database || !viewerId) return true;
  const [block] = await database
    .select({ blockerId: blocks.blockerId })
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, ownerId)),
        and(eq(blocks.blockerId, ownerId), eq(blocks.blockedId, viewerId)),
      ),
    )
    .limit(1);
  return !block;
}
