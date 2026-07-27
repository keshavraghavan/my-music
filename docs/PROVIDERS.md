# Writing a provider

Implement `MusicProvider` from `src/domains/music/providers/types.ts`:

- `search(query, cursor)` returns a paginated normalized catalog.
- `nowPlaying()` returns the current normalized track or `null`.
- `recentPlays(after, cursor)` returns stable play IDs for idempotency.
- `topItems(kind, period)` normalizes provider-specific chart windows.

Provider code owns HTTP details and token refresh. `provider-service.ts` owns
encrypted connection loading, entity upserts, ingestion, and chart snapshots.

Authentication failures should throw `MusicProviderAuthError`. Retry at most
once after refresh. Tests should cover normalization, pagination, expiry
refresh, refresh-token rotation, the second-401 path, and stable play IDs.

Keep a zero-credential mock adapter so CI and fresh forks do not depend on an
external API. Apple Music remains a stub until a fork supplies a developer token
and MusicKit user-token acquisition from its Apple Developer account.
