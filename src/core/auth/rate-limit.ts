type Bucket = { attempts: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super('Too many attempts. Try again later.');
    this.name = 'RateLimitError';
  }
}

/**
 * Small-process limiter for auth and account endpoints. Production deployments
 * with multiple instances can replace this module with Redis without changing
 * callers.
 */
export function assertRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
  now = Date.now(),
) {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { attempts: 1, resetAt: now + options.windowMs });
    return;
  }
  if (bucket.attempts >= options.limit) {
    throw new RateLimitError(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
  }
  bucket.attempts += 1;
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
