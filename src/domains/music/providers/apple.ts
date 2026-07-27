import type { MusicProvider, ProviderPage, ProviderPlay, ProviderTrack } from './types';

/**
 * Apple Music needs a signed developer token from a paid Apple Developer
 * account. The seam is intentionally complete while credentials and MusicKit
 * user-token acquisition remain application-owned.
 */
export class AppleMusicProvider implements MusicProvider {
  readonly key = 'apple' as const;
  readonly available = false;

  private unsupported(): never {
    throw new Error(
      'Apple Music is not configured. Bring an Apple developer account and implement MusicKit user-token acquisition.',
    );
  }

  async search(): Promise<ProviderPage<ProviderTrack>> {
    return this.unsupported();
  }
  async nowPlaying() {
    return this.unsupported();
  }
  async recentPlays(): Promise<ProviderPage<ProviderPlay>> {
    return this.unsupported();
  }
  async topItems(): Promise<ProviderTrack[]> {
    return this.unsupported();
  }
}
