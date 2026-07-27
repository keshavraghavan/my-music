// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canonicalOrigin, canonicalUrl } from '@/core/auth/canonical-url';
import { cronAuthorizationError } from '@/core/cron';
import { MusicProviderAuthError } from '@/domains/music/providers';

/**
 * A stand-in for the Drizzle query builder: every chain method returns the same
 * thenable, so awaiting at any point yields the configured rows.
 */
function fakeDatabase(rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  for (const method of ['select', 'selectDistinct', 'from', 'where', 'limit', 'orderBy']) {
    chain[method] = () => chain;
  }
  chain.then = (resolve: (value: unknown) => unknown) => resolve(rows);
  return chain;
}

const databaseHolder: { current: unknown } = { current: null };

vi.mock('@/core/db/client', () => ({
  getDatabase: () => databaseHolder.current,
}));

const { providerForUser, syncAllConnectedUsers } = await import('@/domains/music/provider-service');

beforeEach(() => {
  databaseHolder.current = null;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('canonical OAuth redirect URIs', () => {
  it('prefers AUTH_URL over the incoming request host', () => {
    expect(
      canonicalUrl(
        '/api/music/callback/spotify',
        'https://internal.vercel.app/x',
        'https://mymusic.example',
      ),
    ).toBe('https://mymusic.example/api/music/callback/spotify');
  });

  it('ignores the AUTH_URL path so only the origin is used', () => {
    expect(canonicalOrigin('http://localhost:3000/y', 'https://mymusic.example/app/')).toBe(
      'https://mymusic.example',
    );
  });

  it('falls back to the request origin when AUTH_URL is absent or malformed', () => {
    expect(canonicalOrigin('http://localhost:3000/y', undefined)).toBe('http://localhost:3000');
    expect(canonicalOrigin('http://localhost:3000/y', 'not-a-url')).toBe('http://localhost:3000');
  });
});

describe('scheduled job authorization', () => {
  const request = (authorization?: string) =>
    new Request('https://mymusic.example/api/cron/music-sync', {
      headers: authorization ? { authorization } : {},
    });

  it('refuses to run when no CRON_SECRET is configured', () => {
    vi.stubEnv('CRON_SECRET', '');
    expect(cronAuthorizationError(request('Bearer anything'))?.status).toBe(503);
  });

  it('rejects a missing or wrong bearer token and admits the right one', () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret');
    expect(cronAuthorizationError(request())?.status).toBe(401);
    expect(cronAuthorizationError(request('Bearer wrong'))?.status).toBe(401);
    expect(cronAuthorizationError(request('Bearer correct-secret'))).toBeNull();
  });
});

describe('providerForUser', () => {
  it('uses the mock provider when the viewer has never connected a service', async () => {
    databaseHolder.current = fakeDatabase([]);
    await expect(providerForUser('juno')).resolves.toMatchObject({ key: 'mock' });
  });

  it('uses the mock provider when there is no database at all', async () => {
    databaseHolder.current = null;
    await expect(providerForUser('juno')).resolves.toMatchObject({ key: 'mock' });
  });

  it('demands a reconnect rather than passing mock plays off as real listening', async () => {
    databaseHolder.current = fakeDatabase([
      {
        userId: 'juno',
        provider: 'spotify',
        accessTokenEncrypted: 'v1.dead',
        refreshTokenEncrypted: null,
        expiresAt: null,
        scopes: [],
        reconnectRequired: true,
      },
    ]);

    await expect(providerForUser('juno')).rejects.toBeInstanceOf(MusicProviderAuthError);
  });
});

describe('syncAllConnectedUsers', () => {
  it('is a no-op without a database instead of throwing', async () => {
    databaseHolder.current = null;
    await expect(syncAllConnectedUsers()).resolves.toEqual({ synced: 0, inserted: 0, failed: 0 });
  });

  it('counts a failing connection as failed and keeps walking the batch', async () => {
    // Both rows resolve to a reconnect-required connection, so every per-user
    // sync throws. The batch must still finish and report the failures.
    databaseHolder.current = fakeDatabase([
      { userId: 'juno', provider: 'spotify', reconnectRequired: true },
      { userId: 'theo', provider: 'spotify', reconnectRequired: true },
    ]);

    await expect(syncAllConnectedUsers()).resolves.toEqual({
      synced: 0,
      inserted: 0,
      failed: 2,
    });
  });
});
