import { sql, type SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  FEED_ITEMS,
  monthlyReceipt,
  NOW_PLAYING,
  PLAYLIST_NAME,
  RECEIPT_META,
  TOP_ALBUMS,
  TOP_SONGS,
} from '@/domains/music/data/listening';
import { ME, PEOPLE } from '@/domains/music/data/people';
import { TRACK_POOL } from '@/domains/music/data/tracks';
import type {
  AppNotification,
  AppState,
  FeedItem,
  ModuleKey,
  MonthlyTrack,
  Person,
  PersonId,
  PlaylistTrack,
  Rec,
  Relation,
  Spacing,
  Track,
  WallPost,
} from '@/types';
import * as schema from '../schema';

export type DemoDatabase = Pick<PostgresJsDatabase<typeof schema>, 'execute'>;

async function rows<T extends Record<string, unknown>>(
  database: DemoDatabase,
  query: SQL,
): Promise<T[]> {
  const result = await database.execute(query);
  const resultWithRows = result as unknown as { rows?: T[] };
  if (Array.isArray(resultWithRows.rows)) return resultWithRows.rows;
  return Array.from(result) as unknown as T[];
}

function isSeedPersonId(value: string): value is PersonId {
  return Object.prototype.hasOwnProperty.call(PEOPLE, value);
}

function relativeTime(value: Date | string): string {
  const date = new Date(value);
  const now = new Date('2026-07-20T22:57:00-04:00');
  const hours = Math.max(0, Math.round((now.getTime() - date.getTime()) / 3_600_000));
  if (hours < 24) return `${hours || 1}H AGO`;
  return `${Math.round(hours / 24)}D AGO`;
}

export class DemoRepository {
  constructor(private readonly database: DemoDatabase) {}

  async listPeople(): Promise<Person[]> {
    const result = await rows<{
      id: string;
      display_name: string;
      handle: string;
      initials: string;
      color: string;
      city: string;
      is_private: boolean;
    }>(
      this.database,
      sql`select user_id as id, display_name, handle, initials, color, city, is_private
          from profiles where user_id <> 'juno' order by display_name`,
    );

    return result.flatMap((row) => {
      if (!isSeedPersonId(row.id)) return [];
      return [
        {
          id: row.id,
          name: row.display_name,
          handle: row.handle,
          initials: row.initials,
          color: row.color,
          service: PEOPLE[row.id].service,
          city: row.city,
          private: row.is_private,
        },
      ];
    });
  }

  async findPersonByHandle(handle: string): Promise<Person | undefined> {
    const result = await rows<{
      id: string;
      display_name: string;
      handle: string;
      initials: string;
      color: string;
      city: string;
      is_private: boolean;
    }>(
      this.database,
      sql`select user_id as id, display_name, handle, initials, color, city, is_private
          from profiles where lower(handle) = lower(${handle}) and user_id <> 'juno' limit 1`,
    );
    const row = result[0];
    if (!row || !isSeedPersonId(row.id)) return undefined;
    return {
      id: row.id,
      name: row.display_name,
      handle: row.handle,
      initials: row.initials,
      color: row.color,
      service: PEOPLE[row.id].service,
      city: row.city,
      private: row.is_private,
    };
  }

  async isHandleAvailable(handle: string, exceptUserId?: string): Promise<boolean> {
    const result = await rows<{ taken: boolean }>(
      this.database,
      sql`select exists(
            select 1 from profiles
            where lower(handle) = lower(${handle})
              and (${exceptUserId ?? null}::text is null or user_id <> ${exceptUserId ?? null})
          ) as taken`,
    );
    return !result[0]?.taken;
  }

  async getAppSnapshot(viewerId = 'juno'): Promise<AppState> {
    const [
      profileRows,
      peopleList,
      followRows,
      blockRows,
      moduleRows,
      prefRows,
      notificationPrefRows,
      catalogRows,
      songRows,
      albumRows,
      monthlyRows,
      recommendationRows,
      notificationRows,
      wallRows,
      playlistRows,
      playlistTrackRows,
      activityRows,
      connectionRows,
      nowPlayingRows,
    ] = await Promise.all([
      rows<{
        display_name: string;
        handle: string;
        bio: string;
        initials: string;
        color: string;
        city: string;
        is_private: boolean;
      }>(
        this.database,
        sql`select display_name, handle, bio, initials, color, city, is_private
            from profiles where user_id = ${viewerId} limit 1`,
      ),
      this.listPeople(),
      rows<{ followee_id: string; status: 'pending' | 'accepted' }>(
        this.database,
        sql`select followee_id, status from follows where follower_id = ${viewerId}`,
      ),
      rows<{ blocked_id: string }>(
        this.database,
        sql`select blocked_id from blocks where blocker_id = ${viewerId}`,
      ),
      rows<{ module_key: string; enabled: boolean; position: number; span: number }>(
        this.database,
        sql`select module_key, enabled, position, span from page_modules
            where user_id = ${viewerId} order by position`,
      ),
      rows<{ grid_density: string; now_playing_source: string }>(
        this.database,
        sql`select grid_density, now_playing_source from user_prefs where user_id = ${viewerId}`,
      ),
      rows<{ recommendations: boolean; friend_activity: boolean; chart_updates: boolean }>(
        this.database,
        sql`select recommendations, friend_activity, chart_updates
            from notification_prefs where user_id = ${viewerId}`,
      ),
      rows<{ title: string; artist: string }>(
        this.database,
        sql`select t.title, a.name as artist from tracks t
            join artists a on a.id = t.artist_id order by t.id`,
      ),
      rows<{ title: string; artist: string }>(
        this.database,
        sql`select t.title, a.name as artist from chart_snapshots c
            join tracks t on t.id = c.track_id join artists a on a.id = t.artist_id
            where c.user_id = ${viewerId} and c.item_type = 'track'
            order by c.captured_at desc, c.rank limit 8`,
      ),
      rows<{ title: string; artist: string }>(
        this.database,
        sql`select al.title, a.name as artist from chart_snapshots c
            join albums al on al.id = c.album_id join artists a on a.id = al.artist_id
            where c.user_id = ${viewerId} and c.item_type = 'album'
            order by c.captured_at desc, c.rank limit 6`,
      ),
      rows<{ id: string; title: string; artist: string }>(
        this.database,
        sql`select mp.track_id as id, t.title, a.name as artist from monthly_picks mp
            join tracks t on t.id = mp.track_id join artists a on a.id = t.artist_id
            where mp.user_id = ${viewerId} order by mp.position`,
      ),
      rows<{
        id: string;
        sender_id: string;
        text: string;
        title: string;
        artist: string;
        status: 'active' | 'hidden' | 'reported';
      }>(
        this.database,
        sql`select r.id, r.sender_id, r.text, t.title, a.name as artist, r.status
            from recommendations r join tracks t on t.id = r.track_id
            join artists a on a.id = t.artist_id
            where r.recipient_id = ${viewerId} order by r.created_at desc`,
      ),
      rows<{
        id: string;
        type: AppNotification['type'];
        text: string;
        read_at: Date | null;
        created_at: Date;
      }>(
        this.database,
        sql`select id, type, text, read_at, created_at from notifications
            where user_id = ${viewerId} order by created_at desc`,
      ),
      rows<{
        id: string;
        author_id: string;
        text: string;
        title: string;
        artist: string;
        created_at: Date;
      }>(
        this.database,
        sql`select w.id, w.author_id, w.text, t.title, a.name as artist, w.created_at
            from wall_posts w left join tracks t on t.id = w.track_id
            left join artists a on a.id = t.artist_id
            where w.wall_owner_id = 'theok' order by w.created_at desc`,
      ),
      rows<{ id: string; name: string }>(
        this.database,
        sql`select id, name from playlists where owner_id = ${viewerId} order by created_at limit 1`,
      ),
      rows<{
        id: string;
        title: string;
        artist: string;
        added_by: string[];
      }>(
        this.database,
        sql`select pt.id, t.title, a.name as artist,
              array_agg(p.display_name order by pc.contributed_at) as added_by
            from playlist_tracks pt join tracks t on t.id = pt.track_id
            join artists a on a.id = t.artist_id
            join playlist_track_contributors pc on pc.playlist_track_id = pt.id
            join profiles p on p.user_id = pc.user_id
            where pt.playlist_id = (select id from playlists where owner_id = ${viewerId}
              order by created_at limit 1)
            group by pt.id, t.title, a.name, pt.position order by pt.position`,
      ),
      rows<{ metadata: Record<string, unknown>; occurred_at: Date }>(
        this.database,
        sql`select metadata, occurred_at from activity_events
            order by occurred_at desc limit 4`,
      ),
      rows<{ provider: 'spotify' | 'apple' }>(
        this.database,
        sql`select provider from service_connections where user_id = ${viewerId}`,
      ),
      rows<{
        title: string;
        artist: string;
        album: string | null;
        played_at: Date;
        ms_played: number;
        duration_ms: number | null;
      }>(
        this.database,
        sql`select t.title, a.name as artist, al.title as album, p.played_at,
              p.ms_played, t.duration_ms
            from plays p join tracks t on t.id = p.track_id
            join artists a on a.id = t.artist_id left join albums al on al.id = t.album_id
            where p.user_id = ${viewerId} order by p.played_at desc limit 1`,
      ),
    ]);

    const profile = profileRows[0];
    if (!profile) throw new Error(`Seed profile ${viewerId} is missing`);

    const people = Object.fromEntries(peopleList.map((person) => [person.id, person])) as Record<
      PersonId,
      Person
    >;
    const relations = Object.fromEntries(Object.keys(PEOPLE).map((id) => [id, 'none'])) as Record<
      PersonId,
      Relation
    >;
    for (const follow of followRows) {
      if (isSeedPersonId(follow.followee_id)) {
        relations[follow.followee_id] = follow.status === 'accepted' ? 'friend' : 'requested';
      }
    }
    for (const block of blockRows) {
      if (isSeedPersonId(block.blocked_id)) relations[block.blocked_id] = 'blocked';
    }

    const defaultModules = [
      'feed',
      'nowPlaying',
      'chart',
      'recs',
      'monthly',
      'receipt',
      'friendsList',
    ] satisfies ModuleKey[];
    const order = moduleRows
      .map((row) => row.module_key)
      .filter((key): key is ModuleKey => defaultModules.includes(key as ModuleKey));
    const modules = Object.fromEntries(
      defaultModules.map((key) => [
        key,
        moduleRows.find((row) => row.module_key === key)?.enabled ?? true,
      ]),
    ) as Record<ModuleKey, boolean>;
    const expanded = Object.fromEntries(
      defaultModules.map((key) => [
        key,
        (moduleRows.find((row) => row.module_key === key)?.span ?? 1) > 1,
      ]),
    ) as Record<ModuleKey, boolean>;
    const connected = {
      spotify: connectionRows.some((row) => row.provider === 'spotify'),
      apple: connectionRows.some((row) => row.provider === 'apple'),
    };
    const latestPlay = nowPlayingRows[0];
    const nowPlaying = latestPlay
      ? {
          track: latestPlay.title,
          artist: latestPlay.artist,
          album: latestPlay.album ?? '',
          progressPct: `${Math.round(
            (latestPlay.ms_played / (latestPlay.duration_ms || latestPlay.ms_played)) * 100,
          )}%`,
          updated: 'UPDATED JUL 20, 8:57 PM',
        }
      : NOW_PLAYING;

    const catalog: Track[] = catalogRows;
    const topSongs: Track[] = songRows.length ? songRows : TOP_SONGS;
    const topAlbums: Track[] = albumRows.length ? albumRows : TOP_ALBUMS;
    const monthlyTracks: MonthlyTrack[] = monthlyRows;
    const recs: Rec[] = recommendationRows.flatMap((row) =>
      isSeedPersonId(row.sender_id)
        ? [
            {
              id: row.id,
              personId: row.sender_id,
              text: row.text,
              track: row.title,
              artist: row.artist,
              status: row.status,
            },
          ]
        : [],
    );
    const notifications: AppNotification[] = notificationRows.map((row) => ({
      id: row.id,
      type: row.type,
      text: row.text,
      time: relativeTime(row.created_at),
      read: row.read_at !== null,
    }));
    const theoWall: WallPost[] = wallRows.flatMap((row) => {
      const personId = row.author_id === viewerId ? 'me' : row.author_id;
      if (personId !== 'me' && !isSeedPersonId(personId)) return [];
      return [
        {
          id: row.id,
          personId,
          text: row.text,
          track: row.title,
          artist: row.artist,
          time: relativeTime(row.created_at),
        },
      ];
    });
    const playlistTracks: PlaylistTrack[] = playlistTrackRows.map((row) => ({
      id: row.id,
      title: row.title,
      artist: row.artist,
      addedBy: row.added_by,
    }));
    const feedItems: FeedItem[] = activityRows.map((row, index) => ({
      text: String(row.metadata.text ?? ''),
      time: relativeTime(row.occurred_at),
      color: String(row.metadata.color ?? FEED_ITEMS[index]?.color ?? '#3F6B4F'),
    }));
    const prefs = prefRows[0];
    const notificationPrefs = notificationPrefRows[0];

    return {
      me: {
        id: 'me',
        userId: viewerId,
        name: profile.display_name,
        handle: profile.handle,
        initials: profile.initials,
        color: profile.color,
        city: profile.city,
        bio: profile.bio,
      },
      people,
      catalog: catalog.length ? catalog : TRACK_POOL,
      topSongs,
      topAlbums,
      nowPlaying,
      receiptMeta: RECEIPT_META,
      receiptLines: topSongs.slice(0, 5).map((track, index) => ({
        ...track,
        stop: `0${index + 1}`,
        mins: `${14 - index * 2}m`,
      })),
      feedItems: feedItems.length ? feedItems : FEED_ITEMS,
      playlistName: playlistRows[0]?.name ?? PLAYLIST_NAME,
      ob: { name: profile.display_name, handle: `${profile.handle}2`, bio: '' },
      modules,
      chartTab: 'songs',
      order: order.length ? order : defaultModules,
      expanded,
      dragKey: null,
      editMode: false,
      spacing: (['compact', 'comfortable', 'spacious'].includes(prefs?.grid_density ?? '')
        ? prefs?.grid_density
        : 'comfortable') as Spacing,
      monthlyTracks,
      connected,
      nowPlayingSource: prefs?.now_playing_source === 'apple' ? 'apple' : 'spotify',
      isPrivateProfile: profile.is_private,
      relations,
      friendSearch: '',
      openFriendMenu: null,
      recs,
      openRecMenu: null,
      notifications,
      theoWall,
      playlistTracks,
      compose: {
        open: false,
        mode: 'recommend',
        targetFriendId: null,
        target: 'wall',
        query: '',
        selectedIdx: null,
        note: '',
        addAnyway: false,
      },
      confirm: {
        open: false,
        kind: '',
        title: '',
        message: '',
        confirmLabel: 'CONFIRM',
        payload: null,
      },
      toast: null,
      accountForm: {
        name: profile.display_name,
        handle: profile.handle,
        bio: profile.bio,
      },
      notifPrefs: {
        recs: notificationPrefs?.recommendations ?? true,
        friendActivity: notificationPrefs?.friend_activity ?? true,
        chart: notificationPrefs?.chart_updates ?? false,
      },
    };
  }
}

/** Fallback used by Server Components when a fresh clone has no database URL. */
export function fallbackSnapshot(): AppState {
  return {
    me: { id: 'me', userId: 'juno', ...ME },
    people: PEOPLE,
    catalog: TRACK_POOL,
    topSongs: TOP_SONGS,
    topAlbums: TOP_ALBUMS,
    nowPlaying: NOW_PLAYING,
    receiptMeta: RECEIPT_META,
    receiptLines: monthlyReceipt(),
    feedItems: FEED_ITEMS,
    playlistName: PLAYLIST_NAME,
    ob: { name: 'Juno Reyes', handle: 'junotapes2', bio: '' },
    modules: {
      feed: true,
      nowPlaying: true,
      chart: true,
      monthly: true,
      receipt: true,
      recs: true,
      friendsList: true,
    },
    chartTab: 'songs',
    order: ['feed', 'nowPlaying', 'chart', 'recs', 'monthly', 'receipt', 'friendsList'],
    expanded: {
      feed: false,
      nowPlaying: true,
      chart: true,
      recs: false,
      monthly: false,
      receipt: false,
      friendsList: false,
    },
    dragKey: null,
    editMode: false,
    spacing: 'comfortable',
    monthlyTracks: [
      { id: 'mt1', title: 'Amber Line', artist: 'Marigold Static' },
      { id: 'mt2', title: 'Slow Fade', artist: 'Hollow Coast' },
      { id: 'mt3', title: 'Rooftop Static', artist: 'The Nightbus' },
      { id: 'mt4', title: 'Terracotta', artist: 'Coral June' },
      { id: 'mt5', title: 'Last Train Home', artist: 'Wilder Sun' },
    ],
    connected: { spotify: false, apple: false },
    nowPlayingSource: 'spotify',
    isPrivateProfile: false,
    relations: {
      theok: 'friend',
      marisolv: 'friend',
      priyad: 'friend',
      devonp: 'friend',
      irisn: 'friend',
      cassr: 'friend',
      samo: 'none',
      wrenl: 'none',
    },
    friendSearch: '',
    openFriendMenu: null,
    recs: [
      {
        id: 'r1',
        personId: 'marisolv',
        text: "This one's been on repeat since the block party, you need it on your page.",
        track: 'Amber Line',
        artist: 'Marigold Static',
        status: 'active',
      },
      {
        id: 'r2',
        personId: 'theok',
        text: 'Sunday morning energy, thought of you immediately.',
        track: 'Slow Fade',
        artist: 'Hollow Coast',
        status: 'active',
      },
      {
        id: 'r3',
        personId: 'priyad',
        text: 'For the commute home when the light hits just right.',
        track: 'Rooftop Static',
        artist: 'The Nightbus',
        status: 'active',
      },
    ],
    openRecMenu: null,
    notifications: [
      {
        id: 'n1',
        type: 'rec',
        text: 'Theo K. left you a recommendation — Low Tide Radio.',
        time: '2H AGO',
        read: false,
      },
      {
        id: 'n2',
        type: 'chart',
        text: 'Your July chart updated — Terracotta jumped to #4.',
        time: '2D AGO',
        read: false,
      },
      {
        id: 'n3',
        type: 'friend',
        text: 'You and Priya D. became friends.',
        time: '1D AGO',
        read: true,
      },
      {
        id: 'n4',
        type: 'playlist',
        text: 'Marisol V. added a track to Rooftop Party 2026.',
        time: '3D AGO',
        read: true,
      },
    ],
    theoWall: [
      {
        id: 'w1',
        personId: 'marisolv',
        text: "This one's been on repeat since the block party.",
        track: 'Amber Line',
        artist: 'Marigold Static',
        time: '2D AGO',
      },
      {
        id: 'w2',
        personId: 'priyad',
        text: 'For the commute home when the light hits just right.',
        track: 'Rooftop Static',
        artist: 'The Nightbus',
        time: '4D AGO',
      },
    ],
    playlistTracks: [
      {
        id: 't1',
        title: 'Terracotta',
        artist: 'Coral June',
        addedBy: ['Juno Reyes', 'Theo K.'],
      },
      { id: 't2', title: 'Amber Line', artist: 'Marigold Static', addedBy: ['Marisol V.'] },
      { id: 't3', title: 'Honeycomb', artist: 'Peach Radio', addedBy: ['Juno Reyes'] },
    ],
    compose: {
      open: false,
      mode: 'recommend',
      targetFriendId: null,
      target: 'wall',
      query: '',
      selectedIdx: null,
      note: '',
      addAnyway: false,
    },
    confirm: {
      open: false,
      kind: '',
      title: '',
      message: '',
      confirmLabel: 'CONFIRM',
      payload: null,
    },
    toast: null,
    accountForm: { name: ME.name, handle: ME.handle, bio: ME.bio },
    notifPrefs: { recs: true, friendActivity: true, chart: false },
  };
}
