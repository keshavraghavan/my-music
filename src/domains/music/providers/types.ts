export type MusicProviderKey = 'mock' | 'spotify' | 'apple';

export interface ProviderTrack {
  providerId: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  artworkUrl?: string;
}

export interface ProviderPlay {
  id: string;
  track: ProviderTrack;
  playedAt: Date;
  msPlayed: number;
}

export interface NowPlaying {
  track: ProviderTrack;
  progressMs: number;
  isPlaying: boolean;
  observedAt: Date;
}

export interface ProviderPage<T> {
  items: T[];
  nextCursor?: string;
}

export interface ProviderTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
}

export interface MusicProvider {
  readonly key: MusicProviderKey;
  readonly available: boolean;
  readonly authorizationUrl?: string;
  search(query: string, cursor?: string): Promise<ProviderPage<ProviderTrack>>;
  nowPlaying(): Promise<NowPlaying | null>;
  recentPlays(after?: Date, cursor?: string): Promise<ProviderPage<ProviderPlay>>;
  topItems(kind: 'tracks' | 'albums', period: '7d' | '30d' | 'all'): Promise<ProviderTrack[]>;
}

export class MusicProviderAuthError extends Error {
  constructor(message = 'The music service must be reconnected.') {
    super(message);
    this.name = 'MusicProviderAuthError';
  }
}
