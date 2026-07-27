import { TOP_ALBUMS, TOP_SONGS } from '@/domains/music/data/listening';
import { TRACK_POOL } from '@/domains/music/data/tracks';
import type { MusicProvider, NowPlaying, ProviderPage, ProviderPlay, ProviderTrack } from './types';

function slug(value: string) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '');
}

function track(value: { title: string; artist: string }, index = 0): ProviderTrack {
  return {
    providerId: `mock-${slug(value.artist)}-${slug(value.title)}`,
    title: value.title,
    artist: value.artist,
    album: index % 2 ? 'Night Service' : 'City Lines',
    durationMs: 180_000 + index * 11_000,
  };
}

const CATALOG = TRACK_POOL.map(track);
const NOW = new Date('2026-07-20T20:57:00-04:00');

export class MockMusicProvider implements MusicProvider {
  readonly key = 'mock' as const;
  readonly available = true;

  async search(query: string, cursor?: string): Promise<ProviderPage<ProviderTrack>> {
    const start = Number(cursor ?? 0);
    const needle = query.trim().toLowerCase();
    const matches = CATALOG.filter(
      (item) =>
        !needle ||
        item.title.toLowerCase().includes(needle) ||
        item.artist.toLowerCase().includes(needle),
    );
    const items = matches.slice(start, start + 5);
    return {
      items,
      ...(start + items.length < matches.length ? { nextCursor: String(start + 5) } : {}),
    };
  }

  async nowPlaying(): Promise<NowPlaying> {
    return {
      track: CATALOG[0]!,
      progressMs: 103_200,
      isPlaying: true,
      observedAt: NOW,
    };
  }

  async recentPlays(after?: Date, cursor?: string): Promise<ProviderPage<ProviderPlay>> {
    const start = Number(cursor ?? 0);
    const plays = Array.from({ length: 24 }, (_, index) => {
      const item = CATALOG[index % CATALOG.length]!;
      const playedAt = new Date(NOW.getTime() - index * 6 * 60 * 60 * 1000);
      return {
        id: `mock-play-${playedAt.toISOString()}-${item.providerId}`,
        track: item,
        playedAt,
        msPlayed: item.durationMs,
      };
    }).filter((play) => !after || play.playedAt > after);
    const items = plays.slice(start, start + 10);
    return {
      items,
      ...(start + items.length < plays.length ? { nextCursor: String(start + 10) } : {}),
    };
  }

  async topItems(kind: 'tracks' | 'albums'): Promise<ProviderTrack[]> {
    return (kind === 'tracks' ? TOP_SONGS : TOP_ALBUMS).map(track);
  }
}
