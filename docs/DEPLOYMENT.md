# Deploy

Use the Vercel button in the README, then attach Neon or Supabase Postgres.

Required variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL` (the production origin)

Run `npm run db:migrate` and `npm run db:seed` once for a demo deployment. Do
not seed production accounts for a real community.

Optional integrations:

- Resend: `RESEND_API_KEY`, `EMAIL_FROM`, `MODERATION_ALERT_EMAIL`
- Spotify: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`,
  `TOKEN_ENCRYPTION_KEY`
- Scheduled jobs: `CRON_SECRET` gates both entries in `vercel.json` — the
  Monday email digest and the hourly listening-history sync
- S3/R2 avatars: the `AVATAR_*` variables in `.env.example`

Register both Spotify redirects:

- `<AUTH_URL>/api/auth/callback/spotify`
- `<AUTH_URL>/api/music/callback/spotify`

`AUTH_URL` is not optional once Spotify is configured: the music OAuth flow
builds its `redirect_uri` from that origin so the value matches what you
registered above, whatever host the request actually arrived on. A preview
deployment on a generated `*.vercel.app` domain therefore needs either its own
registered redirect or its own `AUTH_URL`.

Connected accounts re-import their listening history hourly. Without
`CRON_SECRET`, `/api/cron/music-sync` answers `503` and plays stop updating
after the connect-time backfill.

Before release, run `npm ci`, `npm run check`, `npm run build`, and
`npm run db:migrate`. Confirm bucket CORS permits `PUT` from `AUTH_URL` and cron
requests carry `Authorization: Bearer <CRON_SECRET>`.
