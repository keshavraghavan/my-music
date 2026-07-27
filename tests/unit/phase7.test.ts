// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { shouldTrustAuthHost } from '@/core/auth/trusted-host';
import { databasePoolSize } from '@/core/db/client';
import {
  isOwnedAvatarUrl,
  presignAvatarPut,
  type AvatarStorageConfig,
} from '@/core/identity/avatar-storage';
import { renderNotificationDigest } from '@/core/notifications/digest';
import { REALTIME_POLL_INTERVAL_MS, realtimePollingEnabled } from '@/core/realtime/polling';
import { canMutatePlaylist } from '@/domains/music/playlists/authorization';
import { SPOTIFY_SEARCH_LIMIT } from '@/domains/music/providers/spotify';

const storage: AvatarStorageConfig = {
  bucket: 'avatars',
  region: 'auto',
  accessKeyId: 'test-key',
  secretAccessKey: 'test-secret',
  endpoint: 'https://storage.example.test',
  publicBaseUrl: 'https://cdn.example.test',
};

describe('Phase 7 realtime and infrastructure seams', () => {
  it('polls realtime snapshots conservatively only while visible', () => {
    expect(REALTIME_POLL_INTERVAL_MS).toBe(60_000);
    expect(realtimePollingEnabled('visible')).toBe(true);
    expect(realtimePollingEnabled('hidden')).toBe(false);
  });

  it('respects the Spotify Development Mode search cap', () => {
    expect(SPOTIFY_SEARCH_LIMIT).toBe(10);
  });

  it('uses one application connection behind the production pooler', () => {
    expect(databasePoolSize('production')).toBe(1);
    expect(databasePoolSize('development')).toBe(10);
  });

  it('trusts an explicitly approved production proxy without weakening the default', () => {
    expect(shouldTrustAuthHost({ nodeEnv: 'production' })).toBe(false);
    expect(shouldTrustAuthHost({ nodeEnv: 'production', authTrustHost: 'true' })).toBe(true);
    expect(
      shouldTrustAuthHost({
        nodeEnv: 'production',
        authUrl: 'http://127.0.0.1:3100',
        e2e: '1',
      }),
    ).toBe(true);
    expect(
      shouldTrustAuthHost({
        nodeEnv: 'production',
        authUrl: 'https://untrusted.example',
        e2e: '1',
      }),
    ).toBe(false);
  });

  it('creates a short-lived signed avatar PUT owned by the current user', () => {
    const signed = presignAvatarPut({
      config: storage,
      key: 'avatars/user-1/photo.webp',
      contentType: 'image/webp',
      now: new Date('2026-07-27T00:00:00Z'),
    });
    const upload = new URL(signed.uploadUrl);
    expect(upload.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(upload.searchParams.get('X-Amz-Signature')).toMatch(/^[a-f0-9]{64}$/);
    expect(signed.headers).toEqual({ 'Content-Type': 'image/webp' });
    expect(isOwnedAvatarUrl(signed.assetUrl, 'user-1', storage)).toBe(true);
    expect(isOwnedAvatarUrl(signed.assetUrl, 'other-user', storage)).toBe(false);
  });

  it('escapes notification content in an email digest', () => {
    const digest = renderNotificationDigest(
      [{ text: '<script>alert("x")</script>', createdAt: new Date('2026-07-27T00:00:00Z') }],
      'https://music.example.test',
    );
    expect(digest.html).toContain('&lt;script&gt;');
    expect(digest.html).not.toContain('<script>');
    expect(digest.text).toContain('https://music.example.test/notifications');
  });
});

describe('playlist invitation decision contract', () => {
  it.each([
    ['owner', 'owner', undefined, true],
    ['accepted collaborator', 'guest', { role: 'collaborator', status: 'accepted' } as const, true],
    ['unanswered invite', 'guest', { role: 'collaborator', status: 'invited' } as const, false],
    ['declined invite', 'guest', { role: 'collaborator', status: 'declined' } as const, false],
    ['non-member', 'guest', undefined, false],
  ])('%s', (_label, userId, membership, expected) => {
    expect(
      canMutatePlaylist({
        userId,
        ownerId: 'owner',
        ...(membership ? { membership } : {}),
      }),
    ).toBe(expected);
  });
});
