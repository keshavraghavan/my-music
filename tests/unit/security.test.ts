// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';
import { assertRateLimit, RateLimitError, resetRateLimitsForTests } from '@/core/auth/rate-limit';
import { decryptToken, encryptToken } from '@/core/auth/token-crypto';

afterEach(() => {
  resetRateLimitsForTests();
  delete process.env.TOKEN_ENCRYPTION_KEY;
});

describe('rate limiting', () => {
  it('rejects attempts beyond the configured window and permits them after reset', () => {
    const options = { limit: 2, windowMs: 1_000 };
    assertRateLimit('login:test', options, 1_000);
    assertRateLimit('login:test', options, 1_100);
    expect(() => assertRateLimit('login:test', options, 1_200)).toThrow(RateLimitError);
    expect(() => assertRateLimit('login:test', options, 2_001)).not.toThrow();
  });
});

describe('OAuth token encryption', () => {
  it('round-trips with AES-GCM and does not retain plaintext', () => {
    process.env.TOKEN_ENCRYPTION_KEY = '00'.repeat(32);
    const encrypted = encryptToken('spotify-secret-token');
    expect(encrypted).toMatch(/^v1\./);
    expect(encrypted).not.toContain('spotify-secret-token');
    expect(decryptToken(encrypted)).toBe('spotify-secret-token');
  });

  it('rejects tampered ciphertext', () => {
    process.env.TOKEN_ENCRYPTION_KEY = '11'.repeat(32);
    const encrypted = encryptToken('secret');
    expect(() => decryptToken(`${encrypted.slice(0, -1)}x`)).toThrow();
  });
});
