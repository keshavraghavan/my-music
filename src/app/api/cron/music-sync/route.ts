import { cronAuthorizationError } from '@/core/cron';
import { syncAllConnectedUsers } from '@/domains/music/provider-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function run(request: Request) {
  const unauthorized = cronAuthorizationError(request);
  if (unauthorized) return unauthorized;
  return Response.json(await syncAllConnectedUsers());
}

export const GET = run;
export const POST = run;
