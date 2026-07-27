import { sendPendingDigests } from '@/core/notifications/digest';

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: 'Digest cron is not configured.' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return Response.json(await sendPendingDigests());
}

export const GET = run;
export const POST = run;
