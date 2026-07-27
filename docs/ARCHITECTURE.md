# Architecture

MyMusic is one Next.js application with deliberately strong internal seams. It
is not a monorepo: forks keep one deployment, one database, and one contribution
workflow.

## Boundaries

- `src/core/` contains reusable social-template infrastructure: identity,
  sessions, authorization, follows, notifications, realtime delivery,
  page-building, persistence, and UI primitives.
- `src/domains/music/` owns music-specific providers, ingestion, analytics,
  modules, recommendations, and playlists.
- `src/app/` composes those pieces into routes. Route handlers authenticate at
  the boundary; repositories and Server Actions enforce policy again.
- `src/state/client-store.tsx` holds transient and optimistic UI state. Postgres
  remains authoritative.

## Request and event flow

1. Auth.js resolves a database session.
2. Server Components load a read model through `core/db`.
3. Client actions optimistically update the interface and invoke Server Actions.
4. Domain events create persisted notifications.
5. `/api/stream` publishes notifications and Now Playing over one authenticated
   SSE connection.

Drizzle schema is split between `core/db/schema/core.ts` and
`domains/music/db/schema/music.ts`. `core/graph/authorization.ts` is the policy
boundary for privacy, accepted follows, and two-way blocks.

Music-service authorization is separate from identity sign-in. Spotify listening
access uses PKCE and encrypted rotating tokens; Spotify identity login retains
email-only scope.

The mock provider needs no keys. Resend, Spotify, and S3-compatible avatar
storage are optional adapters activated by environment variables.
