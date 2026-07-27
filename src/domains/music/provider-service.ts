import 'server-only';

import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { decryptToken, encryptToken } from '@/core/auth/token-crypto';
import { getDatabase, type Database } from '@/core/db/client';
import {
  artists,
  albums,
  chartSnapshots,
  plays,
  serviceConnections,
  tracks,
} from '@/domains/music/db/schema/music';
import {
  MockMusicProvider,
  MusicProviderAuthError,
  SpotifyMusicProvider,
  type MusicProvider,
  type ProviderPlay,
  type ProviderTokens,
  type ProviderTrack,
} from './providers';
import { rankTracks } from './analytics';

function entityId(kind: string, provider: string, providerId: string) {
  return `${kind}-${provider}-${providerId}`.replaceAll(/[^a-zA-Z0-9_-]/g, '-');
}

async function persistSpotifyTokens(database: Database, userId: string, tokens: ProviderTokens) {
  await database
    .update(serviceConnections)
    .set({
      accessTokenEncrypted: encryptToken(tokens.accessToken),
      ...(tokens.refreshToken ? { refreshTokenEncrypted: encryptToken(tokens.refreshToken) } : {}),
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
      reconnectRequired: false,
      updatedAt: new Date(),
    })
    .where(and(eq(serviceConnections.userId, userId), eq(serviceConnections.provider, 'spotify')));
}

/**
 * The mock provider is the zero-config fallback for someone who has never
 * connected a service. It is *not* a fallback for a connection whose tokens
 * were revoked — serving invented plays to someone who linked a real account
 * presents fiction as their listening history. That case raises
 * `MusicProviderAuthError` so callers can ask for a reconnect instead.
 */
export async function providerForUser(userId: string): Promise<MusicProvider> {
  const database = getDatabase();
  if (!database) return new MockMusicProvider();
  const [connection] = await database
    .select()
    .from(serviceConnections)
    .where(and(eq(serviceConnections.userId, userId), eq(serviceConnections.provider, 'spotify')))
    .limit(1);
  if (!connection) return new MockMusicProvider();
  if (connection.reconnectRequired) throw new MusicProviderAuthError();
  return new SpotifyMusicProvider(
    {
      accessToken: decryptToken(connection.accessTokenEncrypted),
      ...(connection.refreshTokenEncrypted
        ? { refreshToken: decryptToken(connection.refreshTokenEncrypted) }
        : {}),
      ...(connection.expiresAt ? { expiresAt: connection.expiresAt } : {}),
      scopes: connection.scopes,
    },
    (tokens) => persistSpotifyTokens(database, userId, tokens),
  );
}

async function storeTrack(
  database: Database,
  provider: string,
  item: ProviderTrack,
): Promise<string> {
  const artistId = entityId('artist', provider, item.artist.toLowerCase());
  const albumId = entityId('album', provider, `${item.artist}-${item.album}`.toLowerCase());
  const trackId = entityId('track', provider, item.providerId);
  await database
    .insert(artists)
    .values({ id: artistId, name: item.artist, providerIds: { [provider]: item.artist } })
    .onConflictDoUpdate({
      target: artists.id,
      set: { name: item.artist, providerIds: { [provider]: item.artist } },
    });
  await database
    .insert(albums)
    .values({
      id: albumId,
      artistId,
      title: item.album,
      providerIds: { [provider]: `${item.artist}:${item.album}` },
    })
    .onConflictDoUpdate({
      target: albums.id,
      set: {
        artistId,
        title: item.album,
        providerIds: { [provider]: `${item.artist}:${item.album}` },
      },
    });
  await database
    .insert(tracks)
    .values({
      id: trackId,
      artistId,
      albumId,
      title: item.title,
      durationMs: item.durationMs,
      providerIds: { [provider]: item.providerId },
    })
    .onConflictDoUpdate({
      target: tracks.id,
      set: {
        artistId,
        albumId,
        title: item.title,
        durationMs: item.durationMs,
        providerIds: { [provider]: item.providerId },
      },
    });
  return trackId;
}

export async function ingestPlays(
  database: Database,
  userId: string,
  provider: string,
  history: ProviderPlay[],
) {
  let inserted = 0;
  for (const play of history) {
    const trackId = await storeTrack(database, provider, play.track);
    const result = await database
      .insert(plays)
      .values({
        id: entityId('play', provider, play.id),
        userId,
        trackId,
        playedAt: play.playedAt,
        msPlayed: play.msPlayed,
        source: provider,
        providerPlayId: play.id,
      })
      .onConflictDoNothing()
      .returning({ id: plays.id });
    inserted += result.length;
  }
  return inserted;
}

async function rebuildTrackCharts(database: Database, userId: string) {
  const history = await database
    .select({
      id: plays.id,
      playedAt: plays.playedAt,
      msPlayed: plays.msPlayed,
      providerIds: tracks.providerIds,
      trackId: tracks.id,
      title: tracks.title,
      artist: artists.name,
      albumId: albums.id,
      albumTitle: albums.title,
      durationMs: tracks.durationMs,
    })
    .from(plays)
    .innerJoin(tracks, eq(tracks.id, plays.trackId))
    .innerJoin(artists, eq(artists.id, tracks.artistId))
    .leftJoin(albums, eq(albums.id, tracks.albumId))
    .where(eq(plays.userId, userId));
  const now = new Date();
  for (const period of ['7d', '30d', 'all'] as const) {
    const duration =
      period === '7d' ? 7 * 86_400_000 : period === '30d' ? 30 * 86_400_000 : Infinity;
    const currentStart = now.getTime() - duration;
    const previousStart = now.getTime() - duration * 2;
    const asPlay = (row: (typeof history)[number]): ProviderPlay => ({
      id: row.id,
      track: {
        providerId: Object.values(row.providerIds)[0] ?? row.trackId,
        title: row.title,
        artist: row.artist,
        album: '',
        durationMs: row.durationMs ?? row.msPlayed,
      },
      playedAt: row.playedAt,
      msPlayed: row.msPlayed,
    });
    const current = history.filter((row) => row.playedAt.getTime() >= currentStart).map(asPlay);
    const previous =
      period === 'all'
        ? []
        : history
            .filter((row) => {
              const time = row.playedAt.getTime();
              return time >= previousStart && time < currentStart;
            })
            .map(asPlay);
    const trackIdByProviderId = new Map(
      history.map((row) => [Object.values(row.providerIds)[0] ?? row.trackId, row.trackId]),
    );
    const ranked = rankTracks(current, previous).slice(0, 50);
    if (ranked.length) {
      await database.insert(chartSnapshots).values(
        ranked.map((item) => ({
          id: randomUUID(),
          userId,
          period,
          itemType: 'track',
          trackId: trackIdByProviderId.get(item.providerId),
          rank: item.rank,
          prevRank: item.previousRank,
          capturedAt: now,
        })),
      );
    }
    const asAlbumPlay = (row: (typeof history)[number]): ProviderPlay | null =>
      row.albumId && row.albumTitle
        ? {
            id: row.id,
            track: {
              providerId: row.albumId,
              title: row.albumTitle,
              artist: row.artist,
              album: row.albumTitle,
              durationMs: row.msPlayed,
            },
            playedAt: row.playedAt,
            msPlayed: row.msPlayed,
          }
        : null;
    const currentAlbums = history
      .filter((row) => row.playedAt.getTime() >= currentStart)
      .map(asAlbumPlay)
      .filter((play): play is ProviderPlay => play !== null);
    const previousAlbums =
      period === 'all'
        ? []
        : history
            .filter((row) => {
              const time = row.playedAt.getTime();
              return time >= previousStart && time < currentStart;
            })
            .map(asAlbumPlay)
            .filter((play): play is ProviderPlay => play !== null);
    const rankedAlbums = rankTracks(currentAlbums, previousAlbums).slice(0, 50);
    if (rankedAlbums.length) {
      await database.insert(chartSnapshots).values(
        rankedAlbums.map((item) => ({
          id: randomUUID(),
          userId,
          period,
          itemType: 'album',
          albumId: item.providerId,
          rank: item.rank,
          prevRank: item.previousRank,
          capturedAt: now,
        })),
      );
    }
  }
}

export async function syncListeningHistory(userId: string, backfill = false) {
  const database = getDatabase();
  if (!database) return { provider: 'mock', inserted: 0 };
  const provider = await providerForUser(userId);
  const [latest] = await database
    .select({ playedAt: plays.playedAt })
    .from(plays)
    .where(and(eq(plays.userId, userId), eq(plays.source, provider.key)))
    .orderBy(desc(plays.playedAt))
    .limit(1);
  const after = backfill ? undefined : latest?.playedAt;
  let cursor: string | undefined;
  let inserted = 0;
  let pages = 0;
  try {
    do {
      const page = await provider.recentPlays(after, cursor);
      inserted += await ingestPlays(database, userId, provider.key, page.items);
      cursor = page.nextCursor;
      pages += 1;
    } while (cursor && pages < (backfill ? 10 : 2));
    await rebuildTrackCharts(database, userId);
    if (provider.key !== 'mock') {
      await database
        .update(serviceConnections)
        .set({ lastSyncedAt: new Date(), reconnectRequired: false, updatedAt: new Date() })
        .where(
          and(eq(serviceConnections.userId, userId), eq(serviceConnections.provider, provider.key)),
        );
    }
    return { provider: provider.key, inserted };
  } catch (error) {
    if (error instanceof MusicProviderAuthError && provider.key !== 'mock') {
      await database
        .update(serviceConnections)
        .set({ reconnectRequired: true, updatedAt: new Date() })
        .where(
          and(eq(serviceConnections.userId, userId), eq(serviceConnections.provider, provider.key)),
        );
    }
    throw error;
  }
}

/** How many connections one scheduled run will walk before yielding. */
export const MUSIC_SYNC_BATCH_LIMIT = 200;

export interface MusicSyncBatchResult {
  synced: number;
  inserted: number;
  failed: number;
}

/**
 * Connect-time backfill only fills the page once. Without a scheduled pass,
 * charts, the receipt, and Now Playing freeze at whatever the connect import
 * captured, so this walks every healthy connection. One user's failure is that
 * user's failure — an expired token marks itself for reconnection inside
 * `syncListeningHistory` and the batch keeps going.
 */
export async function syncAllConnectedUsers(
  limit = MUSIC_SYNC_BATCH_LIMIT,
): Promise<MusicSyncBatchResult> {
  const database = getDatabase();
  if (!database) return { synced: 0, inserted: 0, failed: 0 };
  const connections = await database
    .selectDistinct({ userId: serviceConnections.userId })
    .from(serviceConnections)
    .where(eq(serviceConnections.reconnectRequired, false))
    .limit(limit);

  let synced = 0;
  let inserted = 0;
  let failed = 0;
  for (const { userId } of connections) {
    try {
      const result = await syncListeningHistory(userId);
      synced += 1;
      inserted += result.inserted;
    } catch {
      // Already recorded as reconnect-required when the cause was auth; any
      // other cause is transient and the next run retries it.
      failed += 1;
    }
  }
  return { synced, inserted, failed };
}
