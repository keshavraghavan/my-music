// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { encodeServerEvent } from '@/core/realtime/sse';
import {
  isOwnedAvatarUrl,
  presignAvatarPut,
  type AvatarStorageConfig,
} from '@/core/identity/avatar-storage';
import { renderNotificationDigest } from '@/core/notifications/digest';
import { canMutatePlaylist } from '@/domains/music/playlists/authorization';

const storage: AvatarStorageConfig = {
  bucket: 'avatars',
  region: 'auto',
  accessKeyId: 'test-key',
  secretAccessKey: 'test-secret',
  endpoint: 'https://storage.example.test',
  publicBaseUrl: 'https://cdn.example.test',
};

describe('Phase 7 realtime and infrastructure seams', () => {
  it('encodes named SSE events with reconnect and event IDs', () => {
    expect(
      encodeServerEvent({
        id: 'notification-42',
        retry: 5_000,
        event: 'notifications',
        data: [{ id: '42', text: 'New track' }],
      }),
    ).toBe(
      'id: notification-42\nretry: 5000\nevent: notifications\ndata: [{"id":"42","text":"New track"}]\n\n',
    );
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
