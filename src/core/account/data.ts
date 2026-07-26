import 'server-only';

import { eq, or } from 'drizzle-orm';
import { getDatabase } from '@/core/db/client';
import {
  blocks,
  chartSnapshots,
  follows,
  monthlyPicks,
  notificationPrefs,
  notifications,
  pageModules,
  playlistMembers,
  playlists,
  plays,
  profiles,
  recommendations,
  reports,
  serviceConnections,
  userPrefs,
  users,
  wallPosts,
} from '@/core/db/schema';

export async function exportAccountData(userId: string) {
  const database = getDatabase();
  if (!database) throw new Error('Database configuration is required');

  const [
    [user],
    [profile],
    followRows,
    blockRows,
    notificationRows,
    [notificationPreferences],
    reportRows,
    moduleRows,
    [preferences],
    connectionRows,
    playRows,
    chartRows,
    monthlyRows,
    playlistRows,
    membershipRows,
    recommendationRows,
    wallRows,
  ] = await Promise.all([
    database.select().from(users).where(eq(users.id, userId)).limit(1),
    database.select().from(profiles).where(eq(profiles.userId, userId)).limit(1),
    database
      .select()
      .from(follows)
      .where(or(eq(follows.followerId, userId), eq(follows.followeeId, userId))),
    database
      .select()
      .from(blocks)
      .where(or(eq(blocks.blockerId, userId), eq(blocks.blockedId, userId))),
    database.select().from(notifications).where(eq(notifications.userId, userId)),
    database.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId)).limit(1),
    database.select().from(reports).where(eq(reports.reporterId, userId)),
    database.select().from(pageModules).where(eq(pageModules.userId, userId)),
    database.select().from(userPrefs).where(eq(userPrefs.userId, userId)).limit(1),
    database
      .select({
        provider: serviceConnections.provider,
        expiresAt: serviceConnections.expiresAt,
        scopes: serviceConnections.scopes,
        createdAt: serviceConnections.createdAt,
        updatedAt: serviceConnections.updatedAt,
      })
      .from(serviceConnections)
      .where(eq(serviceConnections.userId, userId)),
    database.select().from(plays).where(eq(plays.userId, userId)),
    database.select().from(chartSnapshots).where(eq(chartSnapshots.userId, userId)),
    database.select().from(monthlyPicks).where(eq(monthlyPicks.userId, userId)),
    database.select().from(playlists).where(eq(playlists.ownerId, userId)),
    database.select().from(playlistMembers).where(eq(playlistMembers.userId, userId)),
    database
      .select()
      .from(recommendations)
      .where(or(eq(recommendations.senderId, userId), eq(recommendations.recipientId, userId))),
    database
      .select()
      .from(wallPosts)
      .where(or(eq(wallPosts.authorId, userId), eq(wallPosts.wallOwnerId, userId))),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    account: user ?? null,
    profile: profile ?? null,
    follows: followRows,
    blocks: blockRows,
    notifications: notificationRows,
    notificationPreferences: notificationPreferences ?? null,
    reports: reportRows,
    pageModules: moduleRows,
    preferences: preferences ?? null,
    serviceConnections: connectionRows,
    listening: { plays: playRows, charts: chartRows, monthlyPicks: monthlyRows },
    playlists: { owned: playlistRows, memberships: membershipRows },
    recommendations: recommendationRows,
    wallPosts: wallRows,
  };
}
