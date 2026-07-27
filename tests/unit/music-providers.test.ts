// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { aggregateMonthlyReceipt, rankTracks } from '@/domains/music/analytics';
import {
  MockMusicProvider,
  SpotifyMusicProvider,
  type ProviderPlay,
} from '@/domains/music/providers';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function play(
  id: string,
  title: string,
  playedAt = '2026-07-15T12:00:00Z',
  msPlayed = 180_000,
): ProviderPlay {
  return {
    id,
    track: {
      providerId: title.toLowerCase(),
      title,
      artist: 'Test Artist',
      album: 'Test Album',
      durationMs: msPlayed,
    },
    playedAt: new Date(playedAt),
    msPlayed,
  };
}

describe('music analytics', () => {
  it('ranks by play count and calculates movement from the previous window', () => {
    const current = [play('1', 'Amber'), play('2', 'Amber'), play('3', 'Blue')];
    const previous = [play('4', 'Blue'), play('5', 'Blue'), play('6', 'Amber')];

    expect(rankTracks(current, previous)).toEqual([
      expect.objectContaining({ title: 'Amber', rank: 1, previousRank: 2, movement: 1 }),
      expect.objectContaining({ title: 'Blue', rank: 2, previousRank: 1, movement: -1 }),
    ]);
  });

  it('uses the profile timezone for monthly receipt boundaries', () => {
    const receipt = aggregateMonthlyReceipt(
      [
        play('1', 'Late Train', '2026-08-01T03:30:00Z'),
        play('2', 'August Song', '2026-08-01T05:30:00Z'),
      ],
      'America/New_York',
      '2026-07',
    );

    expect(receipt.playCount).toBe(1);
    expect(receipt.tracks[0]?.title).toBe('Late Train');
    expect(receipt.totalMs).toBe(180_000);
  });
});

describe('MockMusicProvider', () => {
  it('supports paginated catalog search and deterministic history without credentials', async () => {
    const provider = new MockMusicProvider();
    const search = await provider.search('line');
    const firstHistory = await provider.recentPlays();
    const secondHistory = await provider.recentPlays(undefined, firstHistory.nextCursor);

    expect(search.items).toEqual([
      expect.objectContaining({ title: 'Amber Line', providerId: expect.any(String) }),
    ]);
    expect(firstHistory.items).toHaveLength(10);
    expect(secondHistory.items[0]?.id).not.toBe(firstHistory.items[0]?.id);
    expect(provider.available).toBe(true);
  });
});

describe('SpotifyMusicProvider', () => {
  it('refreshes and persists rotated tokens before retrying one 401', async () => {
    vi.stubEnv('SPOTIFY_CLIENT_ID', 'client');
    vi.stubEnv('SPOTIFY_CLIENT_SECRET', 'secret');
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        Response.json({
          access_token: 'fresh-access',
          refresh_token: 'rotated-refresh',
          expires_in: 3600,
          scope: 'user-read-currently-playing',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const persist = vi.fn();
    const provider = new SpotifyMusicProvider(
      {
        accessToken: 'expired-access',
        refreshToken: 'old-refresh',
        scopes: [],
      },
      persist,
    );

    await expect(provider.nowPlaying()).resolves.toBeNull();
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'fresh-access',
        refreshToken: 'rotated-refresh',
      }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
