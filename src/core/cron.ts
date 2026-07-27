/**
 * Scheduled routes are public URLs, so every one of them is gated on the same
 * shared secret. Kept in one place so the check cannot drift between jobs.
 */
export function cronAuthorizationError(request: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret)
    return Response.json({ error: 'Scheduled jobs are not configured.' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
