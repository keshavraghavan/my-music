import { and, eq, or } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { blocks, follows, notificationPrefs, notifications, profiles } from '@/core/db/schema';
import type * as schema from '@/core/db/schema';

type GraphDatabase = PostgresJsDatabase<typeof schema>;

export type FollowResult = 'pending' | 'accepted';

export class GraphMutationError extends Error {
  constructor(
    readonly code: 'invalid-target' | 'not-found' | 'blocked' | 'not-pending',
    message: string,
  ) {
    super(message);
    this.name = 'GraphMutationError';
  }
}

async function wantsFriendNotifications(database: GraphDatabase, userId: string) {
  const [preference] = await database
    .select({ enabled: notificationPrefs.friendActivity })
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1);
  return preference?.enabled ?? true;
}

async function displayName(database: GraphDatabase, userId: string) {
  const [profile] = await database
    .select({ name: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return profile?.name ?? 'Someone';
}

export class GraphRepository {
  constructor(private readonly database: GraphDatabase) {}

  async follow(followerId: string, followeeId: string): Promise<FollowResult> {
    if (followerId === followeeId) {
      throw new GraphMutationError('invalid-target', 'You cannot follow your own account.');
    }

    return this.database.transaction(async (transaction) => {
      const [[target], [block], [existing]] = await Promise.all([
        transaction
          .select({ isPrivate: profiles.isPrivate })
          .from(profiles)
          .where(eq(profiles.userId, followeeId))
          .limit(1),
        transaction
          .select({ blockerId: blocks.blockerId })
          .from(blocks)
          .where(
            or(
              and(eq(blocks.blockerId, followerId), eq(blocks.blockedId, followeeId)),
              and(eq(blocks.blockerId, followeeId), eq(blocks.blockedId, followerId)),
            ),
          )
          .limit(1),
        transaction
          .select({ status: follows.status })
          .from(follows)
          .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)))
          .limit(1),
      ]);

      if (!target) throw new GraphMutationError('not-found', 'That account no longer exists.');
      if (block) throw new GraphMutationError('blocked', 'This account is not available.');
      if (existing) return existing.status;

      const status: FollowResult = target.isPrivate ? 'pending' : 'accepted';
      const inserted = await transaction
        .insert(follows)
        .values({ followerId, followeeId, status })
        .onConflictDoNothing()
        .returning({ status: follows.status });
      if (!inserted.length) {
        const [concurrent] = await transaction
          .select({ status: follows.status })
          .from(follows)
          .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)))
          .limit(1);
        if (concurrent) return concurrent.status;
        throw new GraphMutationError('not-found', 'The follow could not be saved.');
      }

      if (await wantsFriendNotifications(transaction as GraphDatabase, followeeId)) {
        const followerName = await displayName(transaction as GraphDatabase, followerId);
        await transaction.insert(notifications).values({
          id: crypto.randomUUID(),
          userId: followeeId,
          type: 'friend',
          text:
            status === 'pending'
              ? `${followerName} requested to follow you.`
              : `${followerName} followed you.`,
          objectType: 'follow',
          objectId: followerId,
        });
      }
      return status;
    });
  }

  async cancelRequest(followerId: string, followeeId: string): Promise<void> {
    const removed = await this.database
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followeeId, followeeId),
          eq(follows.status, 'pending'),
        ),
      )
      .returning({ followerId: follows.followerId });
    if (!removed.length) {
      throw new GraphMutationError('not-pending', 'That follow request is no longer pending.');
    }
  }

  async acceptRequest(followeeId: string, followerId: string): Promise<void> {
    await this.database.transaction(async (transaction) => {
      const accepted = await transaction
        .update(follows)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followeeId, followeeId),
            eq(follows.status, 'pending'),
          ),
        )
        .returning({ followerId: follows.followerId });
      if (!accepted.length) {
        throw new GraphMutationError('not-pending', 'That follow request is no longer pending.');
      }

      if (await wantsFriendNotifications(transaction as GraphDatabase, followerId)) {
        const followeeName = await displayName(transaction as GraphDatabase, followeeId);
        await transaction.insert(notifications).values({
          id: crypto.randomUUID(),
          userId: followerId,
          type: 'friend',
          text: `${followeeName} accepted your follow request.`,
          objectType: 'follow',
          objectId: followeeId,
        });
      }
    });
  }

  async declineRequest(followeeId: string, followerId: string): Promise<void> {
    const removed = await this.database
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followeeId, followeeId),
          eq(follows.status, 'pending'),
        ),
      )
      .returning({ followerId: follows.followerId });
    if (!removed.length) {
      throw new GraphMutationError('not-pending', 'That follow request is no longer pending.');
    }
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    await this.database
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
  }

  async block(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new GraphMutationError('invalid-target', 'You cannot block your own account.');
    }
    await this.database.transaction(async (transaction) => {
      const [target] = await transaction
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(eq(profiles.userId, blockedId))
        .limit(1);
      if (!target) throw new GraphMutationError('not-found', 'That account no longer exists.');

      await transaction.insert(blocks).values({ blockerId, blockedId }).onConflictDoNothing();
      await transaction
        .delete(follows)
        .where(
          or(
            and(eq(follows.followerId, blockerId), eq(follows.followeeId, blockedId)),
            and(eq(follows.followerId, blockedId), eq(follows.followeeId, blockerId)),
          ),
        );
    });
  }
}
