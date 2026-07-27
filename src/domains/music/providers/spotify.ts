import type {
  MusicProvider,
  NowPlaying,
  ProviderPage,
  ProviderPlay,
  ProviderTokens,
  ProviderTrack,
} from './types';
import { MusicProviderAuthError } from './types';

const API = 'https://api.spotify.com/v1';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

type SpotifyArtist = { name: string };
type SpotifyAlbum = { name: string; images?: { url: string }[] };
type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
};

function normalize(item: SpotifyTrack): ProviderTrack {
  return {
    providerId: item.id,
    title: item.name,
    artist: item.artists.map((artist) => artist.name).join(', '),
    album: item.album.name,
    durationMs: item.duration_ms,
    ...(item.album.images?.[0]?.url ? { artworkUrl: item.album.images[0].url } : {}),
  };
}

export class SpotifyMusicProvider implements MusicProvider {
  readonly key = 'spotify' as const;
  readonly available = true;

  constructor(
    private tokens: ProviderTokens,
    private readonly persistTokens: (tokens: ProviderTokens) => Promise<void>,
  ) {}

  private async refresh() {
    if (!this.tokens.refreshToken) throw new MusicProviderAuthError();
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new MusicProviderAuthError();
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.tokens.refreshToken,
      }),
      cache: 'no-store',
    });
    if (!response.ok) throw new MusicProviderAuthError();
    const body = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
    };
    this.tokens = {
      accessToken: body.access_token,
      refreshToken: body.refresh_token ?? this.tokens.refreshToken,
      expiresAt: new Date(Date.now() + body.expires_in * 1000),
      scopes: body.scope?.split(' ') ?? this.tokens.scopes,
    };
    await this.persistTokens(this.tokens);
  }

  private async request(path: string, retry = true): Promise<Response> {
    if (this.tokens.expiresAt && this.tokens.expiresAt.getTime() <= Date.now() + 30_000) {
      await this.refresh();
    }
    const response = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${this.tokens.accessToken}` },
      cache: 'no-store',
    });
    if (response.status === 401 && retry) {
      await this.refresh();
      return this.request(path, false);
    }
    if (response.status === 401 || response.status === 403) throw new MusicProviderAuthError();
    return response;
  }

  async search(query: string, cursor = '0'): Promise<ProviderPage<ProviderTrack>> {
    if (!query.trim()) return { items: [] };
    const response = await this.request(
      `/search?type=track&limit=20&offset=${encodeURIComponent(cursor)}&q=${encodeURIComponent(query)}`,
    );
    if (!response.ok) throw new Error(`Spotify search failed (${response.status})`);
    const body = (await response.json()) as {
      tracks: { items: SpotifyTrack[]; next: string | null };
    };
    const items = body.tracks.items.map(normalize);
    return {
      items,
      ...(body.tracks.next ? { nextCursor: String(Number(cursor) + items.length) } : {}),
    };
  }

  async nowPlaying(): Promise<NowPlaying | null> {
    const response = await this.request('/me/player/currently-playing');
    if (response.status === 204) return null;
    if (!response.ok) throw new Error(`Spotify now playing failed (${response.status})`);
    const body = (await response.json()) as {
      item: SpotifyTrack | null;
      progress_ms: number;
      is_playing: boolean;
      timestamp: number;
    };
    if (!body.item) return null;
    return {
      track: normalize(body.item),
      progressMs: body.progress_ms,
      isPlaying: body.is_playing,
      observedAt: new Date(body.timestamp),
    };
  }

  async recentPlays(after?: Date, cursor?: string): Promise<ProviderPage<ProviderPlay>> {
    const params = new URLSearchParams({ limit: '50' });
    if (cursor) params.set('before', cursor);
    else if (after) params.set('after', String(after.getTime()));
    const response = await this.request(`/me/player/recently-played?${params}`);
    if (!response.ok) throw new Error(`Spotify history failed (${response.status})`);
    const body = (await response.json()) as {
      items: { track: SpotifyTrack; played_at: string }[];
      cursors?: { before?: string };
    };
    return {
      items: body.items.map(({ track, played_at: playedAt }) => ({
        id: `spotify-${track.id}-${playedAt}`,
        track: normalize(track),
        playedAt: new Date(playedAt),
        msPlayed: track.duration_ms,
      })),
      ...(body.cursors?.before ? { nextCursor: body.cursors.before } : {}),
    };
  }

  async topItems(
    kind: 'tracks' | 'albums',
    period: '7d' | '30d' | 'all',
  ): Promise<ProviderTrack[]> {
    const range = period === '7d' ? 'short_term' : period === '30d' ? 'medium_term' : 'long_term';
    if (kind === 'albums') {
      const topTracks: ProviderTrack[] = await this.topItems('tracks', period);
      return [...new Map(topTracks.map((item) => [item.album, item])).values()];
    }
    const response = await this.request(`/me/top/tracks?limit=50&time_range=${range}`);
    if (!response.ok) throw new Error(`Spotify top items failed (${response.status})`);
    const body = (await response.json()) as { items: SpotifyTrack[] };
    return body.items.map(normalize);
  }
}
