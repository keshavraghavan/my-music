import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  activityEvents,
  albums,
  artists,
  chartSnapshots,
  follows,
  monthlyPicks,
  notificationPrefs,
  notifications,
  pageModules,
  playlistMembers,
  playlists,
  playlistTrackContributors,
  playlistTracks,
  plays,
  profiles,
  recommendations,
  tracks,
  userPrefs,
  users,
  wallPosts,
} from './schema';
import { FEED_ITEMS, TOP_ALBUMS, TOP_SONGS } from '@/domains/music/data/listening';
import { ME, PEOPLE } from '@/domains/music/data/people';
import { TRACK_POOL } from '@/domains/music/data/tracks';
import type { ModuleKey, PersonId } from '@/types';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://mymusic:mymusic@localhost:5432/mymusic';
const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

const personIds = Object.keys(PEOPLE) as PersonId[];
const acceptedFriendIds: PersonId[] = ['theok', 'marisolv', 'priyad', 'devonp', 'irisn', 'cassr'];
const moduleOrder: ModuleKey[] = [
  'feed',
  'nowPlaying',
  'chart',
  'recs',
  'monthly',
  'receipt',
  'friendsList',
];
const expandedModules = new Set<ModuleKey>(['nowPlaying', 'chart']);
const artistIdByName = new Map(
  TRACK_POOL.map((track) => [
    track.artist,
    `artist-${track.artist.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
  ]),
);
const trackIdByTitle = new Map(
  TRACK_POOL.map((track) => [
    track.title,
    `track-${track.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
  ]),
);
const albumIdByTitle = new Map(
  TOP_ALBUMS.map((album) => [
    album.title,
    `album-${album.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
  ]),
);
const at = (value: string) => new Date(value);

async function seed() {
  await db
    .insert(users)
    .values([
      { id: 'juno', name: ME.name },
      ...personIds.map((id) => ({ id, name: PEOPLE[id].name })),
    ])
    .onConflictDoNothing();

  await db
    .insert(profiles)
    .values([
      {
        userId: 'juno',
        handle: ME.handle,
        displayName: ME.name,
        bio: ME.bio,
        initials: ME.initials,
        color: ME.color,
        city: ME.city,
        isPrivate: false,
        timezone: 'America/New_York',
        onboardingCompletedAt: at('2026-07-01T12:00:00Z'),
      },
      ...personIds.map((id) => ({
        userId: id,
        handle: PEOPLE[id].handle,
        displayName: PEOPLE[id].name,
        bio: '',
        initials: PEOPLE[id].initials,
        color: PEOPLE[id].color,
        city: PEOPLE[id].city,
        isPrivate: PEOPLE[id].private,
        timezone: 'America/New_York',
        onboardingCompletedAt: at('2026-07-01T12:00:00Z'),
      })),
    ])
    .onConflictDoNothing();

  await db
    .insert(follows)
    .values(
      acceptedFriendIds.flatMap((id) => [
        { followerId: 'juno', followeeId: id, status: 'accepted' as const },
        { followerId: id, followeeId: 'juno', status: 'accepted' as const },
      ]),
    )
    .onConflictDoNothing();

  await db
    .insert(notificationPrefs)
    .values({
      userId: 'juno',
      recommendations: true,
      friendActivity: true,
      chartUpdates: false,
    })
    .onConflictDoNothing();

  await db
    .insert(userPrefs)
    .values({ userId: 'juno', gridDensity: 'comfortable', nowPlayingSource: 'spotify' })
    .onConflictDoNothing();

  await db
    .insert(pageModules)
    .values(
      moduleOrder.map((moduleKey, position) => ({
        userId: 'juno',
        moduleKey,
        enabled: true,
        position,
        span: expandedModules.has(moduleKey) ? 2 : 1,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(artists)
    .values(
      [...artistIdByName].map(([name, id]) => ({
        id,
        name,
        providerIds: { mock: id },
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(albums)
    .values(
      TOP_ALBUMS.map((album) => ({
        id: albumIdByTitle.get(album.title) as string,
        artistId: artistIdByName.get(album.artist),
        title: album.title,
        providerIds: { mock: albumIdByTitle.get(album.title) as string },
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(tracks)
    .values(
      TRACK_POOL.map((track) => ({
        id: trackIdByTitle.get(track.title) as string,
        artistId: artistIdByName.get(track.artist),
        albumId: track.title === 'Terracotta' ? albumIdByTitle.get('Sundial') : undefined,
        title: track.title,
        durationMs: 240_000,
        providerIds: { mock: trackIdByTitle.get(track.title) as string },
      })),
    )
    .onConflictDoNothing();

  const capturedAt = at('2026-07-20T20:00:00-04:00');
  await db
    .insert(chartSnapshots)
    .values([
      ...TOP_SONGS.map((track, index) => ({
        id: `chart-track-${index + 1}`,
        userId: 'juno',
        period: '30d',
        itemType: 'track',
        trackId: trackIdByTitle.get(track.title),
        rank: index + 1,
        prevRank: index + 1,
        capturedAt,
      })),
      ...TOP_ALBUMS.map((album, index) => ({
        id: `chart-album-${index + 1}`,
        userId: 'juno',
        period: '30d',
        itemType: 'album',
        albumId: albumIdByTitle.get(album.title),
        rank: index + 1,
        prevRank: index + 1,
        capturedAt,
      })),
    ])
    .onConflictDoNothing();

  await db
    .insert(monthlyPicks)
    .values(
      ['Amber Line', 'Slow Fade', 'Rooftop Static', 'Terracotta', 'Last Train Home'].map(
        (title, position) => ({
          userId: 'juno',
          month: '2026-07',
          trackId: trackIdByTitle.get(title) as string,
          position,
        }),
      ),
    )
    .onConflictDoNothing();

  await db
    .insert(plays)
    .values({
      id: 'play-now',
      userId: 'juno',
      trackId: trackIdByTitle.get('Terracotta') as string,
      playedAt: at('2026-07-20T20:57:00-04:00'),
      msPlayed: 103_200,
      source: 'mock',
    })
    .onConflictDoNothing();

  await db
    .insert(recommendations)
    .values([
      {
        id: 'r1',
        senderId: 'marisolv',
        recipientId: 'juno',
        trackId: trackIdByTitle.get('Amber Line') as string,
        text: "This one's been on repeat since the block party, you need it on your page.",
      },
      {
        id: 'r2',
        senderId: 'theok',
        recipientId: 'juno',
        trackId: trackIdByTitle.get('Slow Fade') as string,
        text: 'Sunday morning energy, thought of you immediately.',
      },
      {
        id: 'r3',
        senderId: 'priyad',
        recipientId: 'juno',
        trackId: trackIdByTitle.get('Rooftop Static') as string,
        text: 'For the commute home when the light hits just right.',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(notifications)
    .values([
      {
        id: 'n1',
        userId: 'juno',
        type: 'rec',
        text: 'Theo K. left you a recommendation — Low Tide Radio.',
        createdAt: at('2026-07-20T18:57:00-04:00'),
      },
      {
        id: 'n2',
        userId: 'juno',
        type: 'chart',
        text: 'Your July chart updated — Terracotta jumped to #4.',
        createdAt: at('2026-07-18T20:57:00-04:00'),
      },
      {
        id: 'n3',
        userId: 'juno',
        type: 'friend',
        text: 'You and Priya D. became friends.',
        readAt: at('2026-07-19T21:00:00-04:00'),
        createdAt: at('2026-07-19T20:57:00-04:00'),
      },
      {
        id: 'n4',
        userId: 'juno',
        type: 'playlist',
        text: 'Marisol V. added a track to Rooftop Party 2026.',
        readAt: at('2026-07-17T21:00:00-04:00'),
        createdAt: at('2026-07-17T20:57:00-04:00'),
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(wallPosts)
    .values([
      {
        id: 'w1',
        authorId: 'marisolv',
        wallOwnerId: 'theok',
        trackId: trackIdByTitle.get('Amber Line'),
        text: "This one's been on repeat since the block party.",
        createdAt: at('2026-07-18T20:57:00-04:00'),
      },
      {
        id: 'w2',
        authorId: 'priyad',
        wallOwnerId: 'theok',
        trackId: trackIdByTitle.get('Rooftop Static'),
        text: 'For the commute home when the light hits just right.',
        createdAt: at('2026-07-16T20:57:00-04:00'),
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(playlists)
    .values({
      id: 'rooftop-party-2026',
      ownerId: 'juno',
      name: 'Rooftop Party 2026',
      description: 'The shared summer playlist.',
      visibility: 'private',
    })
    .onConflictDoNothing();

  await db
    .insert(playlistMembers)
    .values([
      {
        playlistId: 'rooftop-party-2026',
        userId: 'juno',
        role: 'owner',
        status: 'accepted',
        respondedAt: at('2026-07-01T12:00:00Z'),
      },
      {
        playlistId: 'rooftop-party-2026',
        userId: 'theok',
        role: 'collaborator',
        status: 'accepted',
        invitedBy: 'juno',
        respondedAt: at('2026-07-02T12:00:00Z'),
      },
      {
        playlistId: 'rooftop-party-2026',
        userId: 'marisolv',
        role: 'collaborator',
        status: 'accepted',
        invitedBy: 'juno',
        respondedAt: at('2026-07-02T12:00:00Z'),
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(playlistTracks)
    .values([
      {
        id: 't1',
        playlistId: 'rooftop-party-2026',
        trackId: trackIdByTitle.get('Terracotta') as string,
        position: 0,
      },
      {
        id: 't2',
        playlistId: 'rooftop-party-2026',
        trackId: trackIdByTitle.get('Amber Line') as string,
        position: 1,
      },
      {
        id: 't3',
        playlistId: 'rooftop-party-2026',
        trackId: trackIdByTitle.get('Honeycomb') as string,
        position: 2,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(playlistTrackContributors)
    .values([
      { playlistTrackId: 't1', userId: 'juno' },
      { playlistTrackId: 't1', userId: 'theok' },
      { playlistTrackId: 't2', userId: 'marisolv' },
      { playlistTrackId: 't3', userId: 'juno' },
    ])
    .onConflictDoNothing();

  await db
    .insert(activityEvents)
    .values(
      FEED_ITEMS.map((item, index) => ({
        id: `feed-${index + 1}`,
        actorId: index === 0 ? 'theok' : index === 1 ? 'marisolv' : 'juno',
        verb: 'fixture',
        objectType: 'fixture',
        objectId: `feed-${index + 1}`,
        metadata: { text: item.text, color: item.color },
        occurredAt: [
          at('2026-07-20T18:57:00-04:00'),
          at('2026-07-20T15:57:00-04:00'),
          at('2026-07-19T20:57:00-04:00'),
          at('2026-07-18T20:57:00-04:00'),
        ][index] as Date,
      })),
    )
    .onConflictDoNothing();
}

seed()
  .then(() => {
    console.log('Seeded MyMusic fixtures.');
  })
  .finally(async () => {
    await client.end();
  });
