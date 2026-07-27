interface AuthHostEnvironment {
  nodeEnv?: string | undefined;
  authTrustHost?: string | undefined;
  authUrl?: string | undefined;
  e2e?: string | undefined;
}

export function shouldTrustAuthHost({
  nodeEnv,
  authTrustHost,
  authUrl,
  e2e,
}: AuthHostEnvironment): boolean {
  const localE2E = e2e === '1' && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(authUrl ?? '');

  return nodeEnv !== 'production' || authTrustHost === 'true' || localE2E;
}
