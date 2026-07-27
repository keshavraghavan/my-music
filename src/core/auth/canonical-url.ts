/**
 * OAuth redirect URIs must match what is registered with the provider
 * byte-for-byte. Deriving them from the incoming request works locally and
 * breaks the moment a proxy, a preview deployment, or a second custom domain
 * puts a different host on the wire — the provider rejects the exchange with an
 * invalid-redirect error. `AUTH_URL` already names the canonical origin for
 * metadata and digest links, so OAuth uses the same answer.
 */
export function canonicalOrigin(requestUrl: string, authUrl = process.env.AUTH_URL): string {
  if (authUrl) {
    try {
      return new URL(authUrl).origin;
    } catch {
      // A malformed AUTH_URL should not take the flow down; fall through to the
      // request origin, which is at least reachable.
    }
  }
  return new URL(requestUrl).origin;
}

/** Absolute URL for `path` on the canonical origin. */
export function canonicalUrl(path: string, requestUrl: string, authUrl = process.env.AUTH_URL) {
  return new URL(path, `${canonicalOrigin(requestUrl, authUrl)}/`).toString();
}
