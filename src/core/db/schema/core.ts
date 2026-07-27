import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const followStatus = pgEnum('follow_status', ['pending', 'accepted']);
export const reportStatus = pgEnum('report_status', ['open', 'reviewed', 'actioned']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export const profiles = pgTable(
  'profiles',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    handle: text('handle').notNull(),
    displayName: text('display_name').notNull(),
    bio: text('bio').default('').notNull(),
    avatarUrl: text('avatar_url'),
    initials: text('initials').notNull(),
    color: text('color').notNull(),
    city: text('city').default('').notNull(),
    isPrivate: boolean('is_private').default(false).notNull(),
    timezone: text('timezone').default('UTC').notNull(),
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('profiles_handle_unique').on(sql`lower(${table.handle})`)],
);

export const follows = pgTable(
  'follows',
  {
    followerId: text('follower_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    followeeId: text('followee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: followStatus('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followeeId] }),
    index('follows_followee_idx').on(table.followeeId),
    index('follows_pending_followee_idx')
      .on(table.followeeId)
      .where(sql`${table.status} = 'pending'`),
  ],
);

export const blocks = pgTable(
  'blocks',
  {
    blockerId: text('blocker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedId: text('blocked_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.blockerId, table.blockedId] })],
);

export const activityEvents = pgTable(
  'activity_events',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'cascade' }),
    verb: text('verb').notNull(),
    objectType: text('object_type').notNull(),
    objectId: text('object_id').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('activity_events_actor_time_idx').on(table.actorId, table.occurredAt)],
);

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    text: text('text').notNull(),
    objectType: text('object_type'),
    objectId: text('object_id'),
    readAt: timestamp('read_at', { withTimezone: true }),
    digestSentAt: timestamp('digest_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('notifications_user_time_idx').on(table.userId, table.createdAt)],
);

export const notificationPrefs = pgTable('notification_prefs', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  recommendations: boolean('recommendations').default(true).notNull(),
  friendActivity: boolean('friend_activity').default(true).notNull(),
  chartUpdates: boolean('chart_updates').default(false).notNull(),
  emailDigest: boolean('email_digest').default(false).notNull(),
});

export const reports = pgTable(
  'reports',
  {
    id: text('id').primaryKey(),
    reporterId: text('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subjectType: text('subject_type').notNull(),
    subjectId: text('subject_id').notNull(),
    reason: text('reason').notNull(),
    status: reportStatus('status').default('open').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => [index('reports_status_time_idx').on(table.status, table.createdAt)],
);

export const pageModules = pgTable(
  'page_modules',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    moduleKey: text('module_key').notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    position: integer('position').notNull(),
    span: integer('span').default(1).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.moduleKey] }),
    uniqueIndex('page_modules_user_position_unique').on(table.userId, table.position),
  ],
);

export const userPrefs = pgTable('user_prefs', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  gridDensity: text('grid_density').default('comfortable').notNull(),
  nowPlayingSource: text('now_playing_source').default('spotify').notNull(),
});
