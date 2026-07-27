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
import { users } from '@/core/db/schema/core';

export const playlistVisibility = pgEnum('playlist_visibility', ['public', 'private']);
export const playlistRole = pgEnum('playlist_role', ['owner', 'collaborator']);
export const playlistMemberStatus = pgEnum('playlist_member_status', [
  'invited',
  'accepted',
  'declined',
]);
export const recommendationStatus = pgEnum('recommendation_status', [
  'active',
  'hidden',
  'reported',
]);

export const serviceConnections = pgTable(
  'service_connections',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    refreshTokenEncrypted: text('refresh_token_encrypted'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    scopes: text('scopes').array().default([]).notNull(),
    reconnectRequired: boolean('reconnect_required').default(false).notNull(),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.provider] })],
);

export const artists = pgTable('artists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  providerIds: jsonb('provider_ids').$type<Record<string, string>>().default({}).notNull(),
});

export const albums = pgTable('albums', {
  id: text('id').primaryKey(),
  artistId: text('artist_id').references(() => artists.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  providerIds: jsonb('provider_ids').$type<Record<string, string>>().default({}).notNull(),
});

export const tracks = pgTable(
  'tracks',
  {
    id: text('id').primaryKey(),
    artistId: text('artist_id').references(() => artists.id, { onDelete: 'set null' }),
    albumId: text('album_id').references(() => albums.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    durationMs: integer('duration_ms'),
    providerIds: jsonb('provider_ids').$type<Record<string, string>>().default({}).notNull(),
  },
  (table) => [index('tracks_title_idx').on(table.title)],
);

export const plays = pgTable(
  'plays',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    trackId: text('track_id')
      .notNull()
      .references(() => tracks.id, { onDelete: 'cascade' }),
    playedAt: timestamp('played_at', { withTimezone: true }).notNull(),
    msPlayed: integer('ms_played').notNull(),
    source: text('source').notNull(),
    providerPlayId: text('provider_play_id'),
  },
  (table) => [
    index('plays_user_time_idx').on(table.userId, table.playedAt),
    uniqueIndex('plays_user_source_provider_id_unique').on(
      table.userId,
      table.source,
      table.providerPlayId,
    ),
  ],
);

export const chartSnapshots = pgTable(
  'chart_snapshots',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    period: text('period').notNull(),
    itemType: text('item_type').notNull(),
    trackId: text('track_id').references(() => tracks.id, { onDelete: 'cascade' }),
    albumId: text('album_id').references(() => albums.id, { onDelete: 'cascade' }),
    rank: integer('rank').notNull(),
    prevRank: integer('prev_rank'),
    capturedAt: timestamp('captured_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('chart_snapshots_item_rank_unique').on(
      table.userId,
      table.period,
      table.itemType,
      table.capturedAt,
      table.rank,
    ),
  ],
);

export const monthlyPicks = pgTable(
  'monthly_picks',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    month: text('month').notNull(),
    trackId: text('track_id')
      .notNull()
      .references(() => tracks.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.month, table.trackId] }),
    uniqueIndex('monthly_picks_position_unique').on(table.userId, table.month, table.position),
  ],
);

export const playlists = pgTable('playlists', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').default('').notNull(),
  visibility: playlistVisibility('visibility').default('private').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const playlistMembers = pgTable(
  'playlist_members',
  {
    playlistId: text('playlist_id')
      .notNull()
      .references(() => playlists.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: playlistRole('role').notNull(),
    status: playlistMemberStatus('status').notNull(),
    invitedBy: text('invited_by').references(() => users.id, { onDelete: 'set null' }),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.playlistId, table.userId] })],
);

export const playlistTracks = pgTable(
  'playlist_tracks',
  {
    id: text('id').primaryKey(),
    playlistId: text('playlist_id')
      .notNull()
      .references(() => playlists.id, { onDelete: 'cascade' }),
    trackId: text('track_id')
      .notNull()
      .references(() => tracks.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('playlist_tracks_position_unique').on(table.playlistId, table.position)],
);

export const playlistTrackContributors = pgTable(
  'playlist_track_contributors',
  {
    playlistTrackId: text('playlist_track_id')
      .notNull()
      .references(() => playlistTracks.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contributedAt: timestamp('contributed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.playlistTrackId, table.userId] })],
);

export const wallPosts = pgTable(
  'wall_posts',
  {
    id: text('id').primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    wallOwnerId: text('wall_owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    trackId: text('track_id').references(() => tracks.id, { onDelete: 'set null' }),
    text: text('text').default('').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('wall_posts_owner_time_idx').on(table.wallOwnerId, table.createdAt)],
);

export const recommendations = pgTable(
  'recommendations',
  {
    id: text('id').primaryKey(),
    senderId: text('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    trackId: text('track_id')
      .notNull()
      .references(() => tracks.id, { onDelete: 'cascade' }),
    text: text('text').default('').notNull(),
    status: recommendationStatus('status').default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('recommendations_recipient_time_idx').on(table.recipientId, table.createdAt)],
);
