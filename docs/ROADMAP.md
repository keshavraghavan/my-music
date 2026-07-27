# MyMusic → Full-Stack Open-Source Social Template

## Context

`my-music` is currently a high-fidelity **demo**, not an application. The entire
product lives in one 1,251-line class component (`src/App.jsx`) with all data
seeded in memory, all nine screens switched by a `route` string in `this.state`,
and every backend interaction simulated — `connectService()` sets a boolean,
`saveAccount()` fires a toast and saves nothing, and a page refresh wipes all
state. `next.config.mjs` sets `output: 'export'`, so there is no server at all.

There is also no TypeScript, no tests, no lint, no CI, no `LICENSE`, and no
`.env.example` — the things a person needs before they can trust, fork, or
contribute to an open-source project.

The goal is two-fold, and the second one shapes the architecture:

1. Make MyMusic a genuinely functional application — real accounts, real
   persistence, real music-service data, real privacy enforcement.
2. Make it a **template** for other design-forward social sites. Most of what
   MyMusic does (identity, follows, feeds, notifications, moderation, a
   drag-to-arrange module page) is not about music at all. Those primitives get
   built as domain-agnostic `core/`, with music isolated in `domains/music/`, so
   a fork swaps one folder instead of unpicking a monolith.

**Decisions locked in:** Next.js full-stack (Route Handlers + Server Actions) on
Postgres via Drizzle, Auth.js for sessions; music services behind a
`MusicProvider` interface with a mock adapter (so the app runs with zero API
keys) plus a real Spotify adapter and a stubbed Apple Music one; single app with
strong internal seams, no monorepo; phased delivery where the app runs after
every phase.

**Product decisions** — the social model, playlist collaboration, and moderation
— are settled in [Part 7](#part-7--resolved-product-decisions); Parts 1, 3 and 4
already reflect them.

---

## Part 1 — Workflow inventory

Every workflow the product implies, with what actually exists today. This is the
scope of "fully functional."

> The "Today" column describes the demo as it stood when this was written, and
> its `App.jsx:NN` references point into the original single-file
> implementation. Phase 2 decomposed that file — the code moved, the behaviour
> did not, so every "Needed" below still stands. Section G is annotated with
> what has since been fixed.

### A. Identity & access — _does not exist in any form_

| Workflow                      | Today                                                                        | Needed                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Sign up / sign in             | None. `startOnboarding()` jumps to a form                                    | Auth.js: email magic-link + OAuth (Spotify as an identity provider)              |
| Session persistence           | None                                                                         | HTTP-only session cookie, server-side session lookup                             |
| Sign out                      | None                                                                         | Session revoke + redirect                                                        |
| Handle availability           | `DIRECTORY_HANDLES.includes()` on an 8-name array (`App.jsx:22`)             | Debounced server check + unique DB constraint (race-safe)                        |
| Onboarding completion         | `onboardStep` counter; `obNext()` at step 4 routes home                      | Persisted `onboarding_completed_at`; resumable across sessions; server-side gate |
| Account deletion              | `confirmAction()` case `delete-account` → `route: 'landing'` (`App.jsx:271`) | Real cascade delete or soft-delete + grace period, plus data export              |
| Password/email change, reauth | None                                                                         | Standard flows                                                                   |

### B. Profile & page building

| Workflow                 | Today                                                              | Needed                                                         |
| ------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| Edit name / handle / bio | `accountForm` state; `saveAccount()` shows a toast (`App.jsx:237`) | Validated server action, persisted, handle-uniqueness enforced |
| Avatar / photo           | "ADD PHOTO" is a dashed circle placeholder (`App.jsx:577`)         | Real upload: presigned S3/R2 PUT, resize, moderation hook      |
| Module on/off            | `modules` object in state                                          | `page_modules` table per user                                  |
| Drag reorder             | `dropOn()` reorders `order` array (`App.jsx:115`)                  | Persist position; optimistic update + server reconcile         |
| Expand / collapse card   | `expanded` object                                                  | Persist `span` per module                                      |
| Grid density             | `spacing` state                                                    | Persist as a user preference                                   |
| Edit mode                | `editMode` toggle                                                  | Keep client-only; fine as-is                                   |

### C. Music service integration — _entirely simulated_

| Workflow                  | Today                                                              | Needed                                                                                             |
| ------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Connect service           | `connectService()` sets `connected.spotify = true` (`App.jsx:234`) | Real OAuth 2.0 + PKCE, encrypted token storage, refresh-token rotation                             |
| Disconnect                | Confirm modal flips the boolean                                    | Token revoke at provider + local purge                                                             |
| Now Playing               | Hardcoded literal in `renderVals()` (`App.jsx:444`)                | Poll `/me/player/currently-playing`; cache; SSE or short-poll to the client                        |
| Dual-source conflict      | `bothConnected` flag renders a "which to trust" prompt             | Real precedence rule + persisted user preference                                                   |
| Charts (Top 50/100)       | Two hardcoded 6–8 item arrays (`App.jsx:310-320`)                  | Aggregate from stored play history; windowed (7d/30d/all); ranked with movement deltas             |
| Transit Receipt           | `topSongs.slice(0,5)` with fabricated minutes (`App.jsx:321`)      | Real monthly aggregate: play counts, total listening time, month boundaries in the user's timezone |
| Track search              | `TRACK_POOL.filter()` over 8 tracks (`App.jsx:224`)                | Provider catalog search, debounced, paginated                                                      |
| Backfill on connect       | None                                                               | Import recent history at connect time so the page isn't empty                                      |
| Token expiry / revocation | None                                                               | Detect 401, refresh, and surface a "reconnect" state                                               |

### D. Social graph

| Workflow                                | Today                                                                   | Needed                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Directory search                        | Filters 8 hardcoded `PEOPLE` (`App.jsx:359`)                            | Indexed search over real users, paginated, block-aware                        |
| Follow a **public** profile             | Sets `relations[id] = 'friend'` instantly (`App.jsx:148`)               | Takes effect immediately — `follows` row created `accepted`, no approval      |
| Request to follow a **private** profile | Sets `'requested'`                                                      | `follows` row created `pending`; content stays gated until approved           |
| **Accept / decline a request**          | **Missing entirely** — requests can be sent, never received or accepted | Incoming-request inbox, accept/decline, notification to the requester         |
| Cancel a sent request                   | Missing                                                                 | Requester withdraws a `pending` row                                           |
| Unfollow                                | Conflated with "remove friend"                                          | Delete own edge only; the reverse edge is untouched                           |
| Remove friend                           | Confirm → `'none'`                                                      | Delete edge both directions; revoke content access                            |
| Block                                   | Confirm → `'blocked'`                                                   | **Enforced**: hide profile, strip from feeds/search, block DMs/recs both ways |
| Unblock / blocked list                  | Missing                                                                 | Settings screen listing blocks                                                |
| Privacy enforcement                     | `isPrivateProfile` toggles a boolean; **nothing is actually gated**     | Server-side authorization on every profile/feed/wall read                     |

### E. Content & interaction

| Workflow                        | Today                                                                                                | Needed                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Recommend a track to a friend   | `postRecommendation()` prepends to `theoWall` — and **only ever Theo's wall** (`App.jsx:219`, `379`) | Real post to any user's wall, authorized by relationship                              |
| Friend wall                     | Only `theok` has one; every other friend renders empty                                               | Per-user wall, paginated                                                              |
| Receive recommendations         | Three seeded `recs`                                                                                  | Real inbox, ordered, paginated                                                        |
| Hide / report a rec             | `status: 'hidden'` / `'reported'` in memory (`App.jsx:162`)                                          | Persist; report row + email alert to the operator                                     |
| Moderation follow-up            | **Missing** — "We'll take a look" is a lie today                                                     | v1: persisted `reports` row with status + email alert. Admin queue ships later        |
| Feed ("Line Updates")           | Four hardcoded strings (`App.jsx:438`)                                                               | Real activity feed: fan-out-on-read from followees' events, paginated, block-filtered |
| Monthly Top 10                  | Add/remove in memory, cap of 10                                                                      | Persist; enforce cap and dedupe server-side                                           |
| Create a playlist               | Missing — one playlist is hardcoded                                                                  | Name, description, visibility; creator becomes owner                                  |
| **Invite friends at creation**  | **Missing**                                                                                          | Creation flow offers "add friends"; selected friends get an `INVITE`                  |
| **Accept / decline an invite**  | **Missing**                                                                                          | Invitee confirms before joining; only then may they add tracks                        |
| Invite after creation / revoke  | Missing                                                                                              | Owner invites or removes collaborators from playlist settings                         |
| Add a track                     | `postRecommendation()` playlist branch (`App.jsx:211`)                                               | Authorized: owner or **accepted** collaborator only                                   |
| Duplicate-add conflict          | Nice UX; appends `'Juno Reyes'` string to `addedBy` (`App.jsx:213`)                                  | Contributor rows keyed by user id, not display name                                   |
| Playlist reorder / remove track | Missing                                                                                              | Needed for a real playlist                                                            |
| Leave a playlist                | Missing                                                                                              | Collaborator exits; their contributions stay attributed                               |
| Delete / edit own post          | Missing                                                                                              | Table stakes                                                                          |

### F. Notifications

| Workflow                  | Today                                                  | Needed                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List + unread badge       | Four seeded rows                                       | Real per-user notification table, paginated                                                                                                                            |
| Mark read / mark all read | In-memory map (`App.jsx:168`)                          | Persisted read state                                                                                                                                                   |
| Deep link from row        | `clickNotification()` routes by `type` (`App.jsx:169`) | Route to the specific entity, not just the screen                                                                                                                      |
| Generation                | None — notifications never get created                 | Emitted by domain events: rec posted, **follow request received**, **request accepted**, **playlist invite received**, **invite accepted**, track added, chart updated |
| Actionable rows           | None — rows only navigate                              | Follow requests and playlist invites carry accept/decline inline                                                                                                       |
| Preferences               | `notifPrefs` booleans, unused                          | Respected at emit time                                                                                                                                                 |
| Email / push delivery     | Missing                                                | Email digest via Resend; **operator alert on new report**; web push optional                                                                                           |
| Realtime arrival          | Missing                                                | SSE channel per user                                                                                                                                                   |

### G. Cross-cutting gaps

- ~~**URL routing.**~~ _Fixed in Phase 2._ Every screen has a real route;
  profiles are shareable at `/[handle]`.
- ~~**Accessibility.**~~ _Fixed in Phase 2._ Real controls, keyboard
  operability throughout, focus-trapped dialogs, `aria-live` toasts, a visible
  focus ring, and a keyboard path for drag-reorder.
- ~~**Responsiveness.**~~ _Fixed in Phase 2._ Tokens plus a 720px breakpoint;
  the layout holds from 375px up. `sx()` survives only for card interiors,
  where it blocks nothing.
- **No loading, error, or offline states.** Nothing is async today, so none
  exist; every screen needs skeleton + error + retry once data is real.
- **No validation, rate limiting, CSRF, or authorization layer.**
- ~~**No tests, types, lint, CI, LICENSE, CONTRIBUTING, or `.env.example`.**~~
  _Fixed in Phase 1._

---

## Part 2 — Target architecture

`✅` marks what Phase 2 built; the rest arrives with its phase.

```
src/
  app/                        # Next.js routes — real URLs, replacing the `route` string
    page.tsx                          # ✅ landing
    (app)/layout.tsx                  # ✅ signed-in shell: nav, dialogs, toasts
    (app)/[handle]/page.tsx           # ✅ profile — public or private-locked
    (app)/home/page.tsx               # ✅
    (app)/friends/page.tsx            # ✅
    (app)/playlist/page.tsx           # ✅ → /playlists/[id] in Phase 5
    (app)/notifications/page.tsx      # ✅
    (app)/settings/[tab]/page.tsx     # ✅
    onboarding/[step]/page.tsx        # ✅
    api/auth/[...nextauth]/route.ts
    api/webhooks/…, api/stream/route.ts   # SSE

  core/                       # ← domain-agnostic. The template.
    auth/                     # Auth.js config, session helpers, requireUser()
    db/                       # Drizzle client, core schema, migrations
    identity/                 # users, profiles, handles, avatars
    graph/                    # follows, requests, blocks + authorization
    feed/                     # activity events, fan-out, pagination
    notifications/            # emit / read / preferences / delivery
    moderation/               # reports, queue, actions
    page-builder/             # ✅ module registry, drag + keyboard reorder,
                              #   grid, density — layout persistence in Phase 5
    ui/                       # ✅ accessible primitives: Button, Toggle, Modal,
                              #   ConfirmDialog, Toast, RowMenu, Field, Avatar,
                              #   SegmentedControl, EmptyState, Page, TextLink
    styles/                   # ✅ design tokens (CSS custom properties)
    routes.ts                 # ✅ every URL in the app, named once

  state/client-store.tsx      # ✅ transient UI + stub mutations; reads come from DB

  domains/music/              # ← swap this folder to build a different site
    providers/                # MusicProvider interface
      mock.ts                 #   works with no API keys — keeps the demo alive
      spotify.ts              #   real OAuth + Web API
      apple.ts                #   stub behind the same interface
    data/                     # ✅ seeded people, tracks, charts — becomes db/
    compose/                  # ✅ the search-and-send sheet
    charts/ receipts/ now-playing/ playlists/ recommendations/
    modules/                  # ✅ the seven modules, registered into page-builder
```

### The three seams that make it a template

1. **`MusicProvider` interface.** One TypeScript interface — `search`,
   `nowPlaying`, `recentPlays`, `topItems`. `mock.ts` is the reference
   implementation and the default, so `git clone && npm run dev` works with an
   empty `.env`. Real adapters are drop-in.

2. **Module registry** ✅. `core/page-builder` knows nothing about music.
   `createModuleRegistry([{ key, label, accent, Component }])` takes the list;
   `domains/music/modules/index.ts` is the whole of MyMusic's home page. A
   photo app passes a different list and inherits drag, keyboard reorder,
   toggle, expand and density unchanged. (`loadData` joins the definition in
   Phase 3, when modules stop reading seeded constants.)

3. **Design tokens** ✅. The retro-transit look (cream `#F2ECDF`, ink
   `#1E1B18`, four accents, Tinos/JetBrains Mono/Arimo) lives in
   `core/styles/tokens.css`, and everything in `core/` reads it from there.
   Retheming the shell, the primitives and the page metrics is editing that
   one file; the card interiors follow as `sx()` retires.

### On `sx()` — being replaced

`src/sx.ts` was the right call for design fidelity during the port, but inline
styles cannot express media queries, `:hover`, or `:focus-visible`, which made
it a blocker on both responsiveness and accessibility.

Phase 2 took the blocking half away: `core/ui`, `core/page-builder`, the shell
and every page container are CSS Modules over `core/styles/tokens.css`, so the
breakpoints and focus states live in CSS. What still goes through `sx()` is the
inside of the cards — verbatim declaration strings from the design — which
keeps that markup byte-comparable to the source. Those convert as each card
gains real data in Phases 5–6; `sx()` goes away with the last one.

---

## Part 3 — Data model

Drizzle schema, split core vs. domain:

**`core/db/schema/`** — `users`, `accounts`, `sessions`,
`verification_tokens` (Auth.js), `profiles` (handle unique, display_name, bio,
avatar_url, is_private, timezone), `follows` (follower/followee, status:
`pending|accepted`), `blocks`, `activity_events` (actor, verb, object_type,
object_id — polymorphic), `notifications`, `notification_prefs`, `reports`
(reporter, subject_type, subject_id, reason, status: `open|reviewed|actioned`),
`page_modules` (user_id, module_key, enabled, position, span), `user_prefs`.

**`follows` is the whole social graph.** One table serves both directions of
the decision above: following a public profile inserts `accepted` directly,
following a private one inserts `pending`. "Friends" in the UI is a derived
concept — a mutual pair of `accepted` rows — not a stored entity, so there is
no second system to keep consistent. A partial index on
`(followee_id) WHERE status = 'pending'` backs the request inbox.

**`domains/music/db/schema/`** — `service_connections` (provider,
**encrypted** access/refresh tokens, expiry, scopes), `artists`, `tracks`,
`albums` (provider-agnostic ids + provider id map), `plays` (user, track,
played_at, ms_played, source), `chart_snapshots` (user, period, rank, track,
prev_rank), `monthly_picks`, `playlists` (owner_id, name, visibility),
`playlist_members` (playlist_id, user_id, role: `owner|collaborator`, status:
`invited|accepted|declined`, invited_by, responded_at), `playlist_tracks`,
`playlist_track_contributors` (user_id — replaces today's `addedBy: string[]`),
`wall_posts`, `recommendations`.

**Playlist collaboration is invite-only.** `playlist_members` carries both
membership and the invitation lifecycle in one table, so "invited but hasn't
answered" is a first-class state rather than an absence. Write authorization is
a single predicate — `role = 'owner' OR status = 'accepted'` — checked server
side on every track mutation, which means a stale invite link cannot be used to
write. `playlist_track_contributors` stays keyed by `user_id` so the
duplicate-add credit survives a display-name change.

**Non-negotiable:** access and refresh tokens are encrypted at rest
(AES-256-GCM via a `TOKEN_ENCRYPTION_KEY` env var), never logged, and never
sent to the client.

---

## Part 4 — Phases

Each phase leaves the app runnable, and lands on its own branch and pull
request.

### Phase 1 — Foundation ✅ _done — no behavior change_

TypeScript (strict, plus `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes`) with `@/*` path aliases; `.jsx → .tsx` and the
state shape typed in `src/types.ts` · ESLint + Prettier · Vitest + Testing
Library (33 unit tests) · Playwright (5 e2e specs against the static export) ·
GitHub Actions CI · MIT `LICENSE` · `CONTRIBUTING.md` · `CODE_OF_CONDUCT.md` ·
issue/PR templates · `.env.example`.

Notes carried forward:

- **The a11y debt now has a number: 151 lint warnings.** `jsx-a11y` rules are
  set to `warn` so the backlog is visible without failing CI, and get promoted
  to `error` per screen as Phase 2 converts them.
- **`src/App.tsx` is excluded from Prettier** until Phase 2 decomposes it —
  reflowing ~800 verbatim inline style strings would make the diff against the
  original design unreviewable.
- **Known bug, pinned by a test rather than fixed:** display names already end
  in a period, and `showToast()` appends another, so friend toasts read
  "Wren L..". Fix belongs with the Phase 2 copy pass.
- **Dead state:** `compose.showDup` is written on a duplicate playlist add and
  never read — the warning is derived independently as `showDuplicateWarning`.
  Kept for now so the conversion stayed behaviour-preserving; delete in Phase 2.
- TypeScript is pinned to 6.x: Next 16 cannot use the TypeScript 7 native
  compiler without an experimental flag, which a template should not require.

**Shipped:** identical app, now with a safety net.

### Phase 2 — Routing + decomposition ✅ _done — no behavior change_

The 1,334-line `App.tsx` is gone. In its place:

- **Real URLs.** `route` in state is deleted; `src/core/routes.ts` is the only
  place a URL is named. `/`, `/onboarding/[step]`, `/home`, `/friends`,
  `/[handle]`, `/playlist`, `/notifications`, `/settings/[tab]` — 25
  prerendered pages, all deep-linkable, back button working. The two friend
  screens collapsed into one `/[handle]` with a locked state, which is what a
  profile actually is.
- **Decomposition.** Screens live with their routes; the seven music modules
  are components under `domains/music/modules/`, registered into a
  domain-agnostic `core/page-builder`. State moved to `src/state/store.tsx` — a
  context store with the same actions the class had, minus what the URL owns.
- **Accessibility.** Every control is a real control: `<button>`,
  `role="switch"` toggles, `role="menu"` row menus with arrow keys and Escape,
  focus-trapped `role="dialog"` modals that restore focus on close, an
  `aria-live` toast region, labelled inputs with `aria-invalid`/
  `aria-describedby`, `aria-current` navigation, a skip link, and one visible
  focus ring. **Drag reorder now has a keyboard path**: the ✥ handle is a
  button that moves a module with the arrow keys and announces its position.
  Phase 1's 151 `jsx-a11y` warnings are zero, and the rules are `error`.
- **Responsive.** Page containers, the shell, the module grid and both modals
  are CSS Modules over tokens with one breakpoint at 720px. The e2e suite
  asserts no horizontal overflow at 375px.
- **Design tokens.** `core/styles/tokens.css` holds the palette, the three
  typefaces and the page metrics; retheming is editing one file.

Notes carried forward:

- **`sx()` is retired, not gone.** Primitives, layout, the shell and the grid
  are CSS Modules; card interiors still pass verbatim declaration strings from
  the design through `sx()`, which keeps the port byte-comparable. Those
  convert as each card gains real behaviour in Phases 5–6. The blocker it
  represented is lifted: media queries and `:focus-visible` live in CSS now.
- **Resolved from Phase 1:** the doubled-period toast bug (`core/text.ts`'s
  `endSentence()`), the dead `compose.showDup` field, and the Prettier
  exclusion on `App.tsx`.
- **State still resets on refresh.** Navigation is client-side so state
  survives it, but a hard reload starts fresh — the store is memory. Phase 3.
- **Recommendations still only reach Theo's wall.** Phase 2 changed no
  behaviour, so the design's single seeded wall stands; Phase 5 fixes it.

**Shipped:** same features, real URLs, keyboard-navigable, works on a phone.

### Phase 3 — Data layer ✅ _done — persisted server reads_

Postgres + Drizzle, schema and migrations, `docker-compose.yml` for local dev.
Seed script that reproduces today's `PEOPLE`/`TRACK_POOL` fixtures so the demo
is byte-comparable. Repository functions with unit tests. Screens read from the
DB through server components; mutations still stubbed.
**Ships:** data survives a refresh.

### Phase 4 — Auth & authorization ✅ _done — privacy enforced server-side_

Auth.js database sessions with email magic-link (console delivery in
development, Resend in production) and optional Spotify OAuth; OAuth tokens
are AES-256-GCM encrypted at rest. Real signup/login/logout, resumable
server-backed onboarding, debounced/race-safe handle checks, `requireUser()`
and onboarding guards, Auth.js CSRF protection, and rate limits on sensitive
endpoints. `core/graph/authorization` is the single private-profile/follow/block
policy used by profile and content reads, with a table-driven policy matrix.
Account deletion cascades from the user row, and the token-safe JSON export
covers core and music-domain data.
**Ships:** multiple real users; privacy is real, not cosmetic.

### Phase 5 — Core social workflows 🟡 _in progress_

**Follow graph:** ✅ immediate follow for public profiles, request →
accept/decline for private ones (closing the missing-acceptance gap), cancel,
unfollow, plus the request inbox. Blocking now removes both follow directions
atomically and is enforced by the existing read policy; the blocked-account
settings list and unblock action remain.
**Playlists:** create with an invite-friends step, invite/accept/decline/revoke,
leave, track add/reorder/remove gated on accepted membership, duplicate-add
conflict keyed by user id.
**Everything else:** walls and recommendations against any user, feed generation
from `activity_events`, notifications emitted by domain events and respecting
prefs — with accept/decline actionable inline on requests and invites — reports
persisted with an operator email alert, page-layout persistence. Optimistic UI
with rollback; loading/error/empty states everywhere.
**Ships:** every button does what it claims.

### Phase 6 — Music integrations ✅ _done_

`MusicProvider` interface + `mock` (default) + real Spotify (OAuth/PKCE,
encrypted tokens, refresh rotation, 401 → reconnect state). Play ingestion,
chart computation with rank deltas, monthly receipt aggregation, real catalog
search, connect-time backfill. Apple Music stub documented as
"bring your own developer account."

Provider authorization is deliberately separate from identity sign-in. The
Spotify listening connection uses PKCE, encrypted access/refresh tokens, narrow
playback/history scopes, bounded backfill and idempotent ingestion. The mock
adapter remains the zero-config fallback, including paginated catalog search
and deterministic play history. Apple Music implements the same seam but stays
unavailable until a fork supplies its MusicKit developer and user tokens.
**Ships:** real listening data drives the page.

### Phase 7 — Realtime, polish, template docs ✅ _done_

SSE for notifications and Now Playing · avatar upload (presigned) · email
digests · OG images and shareable profile URLs · perf pass · `docs/`:
architecture, "fork this into your own social site", writing a module, writing
a provider, deploy guide (Vercel + Neon/Supabase Postgres) · one-click deploy
button.

One authenticated SSE connection reconciles notification and Now Playing
snapshots. Avatar uploads use short-lived S3/R2-compatible signed PUTs with
account-path validation; email digests are idempotent and scheduled behind a
cron secret. Profiles publish canonical metadata and generated OG cards. The
template guides and an explicit product-decision test command now live in-repo.
**Ships:** a template someone else can actually use.

---

## Part 5 — Open-source template concerns

- **Runs with an empty `.env`.** Mock provider + magic-link-to-console in dev.
  A template that needs three API keys before it renders is not a template.
- **Every secret documented** in `.env.example` with a comment on where to get
  it and whether it's optional.
- **Fork story is one page**: swap `domains/music/`, edit
  `core/styles/tokens.css`, register your modules.
- **Adoptable licensing** — MIT, and check the seeded fixtures for anything
  that reads as a real service's trademark.
- **Realistic CI** — CI must pass on a fork with no secrets, so e2e runs
  against the mock provider.

---

## Part 6 — Verification

- **Per phase:** `npm run typecheck && npm run lint && npm test && npm run build`
  green; CI green on the branch.
- **Unit** — repository functions, chart aggregation, receipt math, the
  authorization function (the highest-risk code in the app: table-driven tests
  for every viewer × privacy × block × relationship combination), provider
  adapters against recorded fixtures.
- **E2E (Playwright, mock provider, no secrets)** — the full journey across two
  users: sign up → onboard → connect mock service → build page → search a user →
  **follow a public profile and land immediately** → **request a private one and
  accept it as the second user** → post a recommendation → see it on the wall →
  receive the notification → **create a playlist, invite the second user, accept
  as them, add a track** → confirm a non-member is refused the same write → add
  a duplicate track and resolve the conflict → report a rec and assert the row
  persists → block → confirm content disappears → delete account.
- **Manual** — `docker compose up && npm run dev`, walk each screen at 375px
  and 1440px, navigate the entire app with only the keyboard, and hard-refresh
  on every screen to confirm state persists and deep links resolve.
- **Template check** — clone fresh into a temp dir, `npm i && npm run dev` with
  an empty `.env`, confirm the app boots on the mock provider.

---

## Part 7 — Resolved product decisions

These were open when the roadmap was drafted; they are settled and the schema
and phases above reflect them.

### 1. Asymmetric follow, gated by profile privacy

Today's model contradicts itself — `addFriend()` creates instant symmetric
friendship while `requestFollow()` implies following, and the copy says
"friends" everywhere.

**Decided:** one asymmetric follow relationship, where the target profile's
privacy decides whether approval is needed.

| Target profile | Result                                                        |
| -------------- | ------------------------------------------------------------- |
| Public         | Follow takes effect immediately; content visible at once      |
| Private        | Request created `pending`; content stays gated until accepted |

The requester can cancel a pending request; the recipient can accept or decline
from the notification row or a request inbox. Unfollowing removes only the
follower's own edge. "Friends" survives as UI vocabulary for a mutual pair, not
as a stored entity.

_Why it matters for the template:_ one `follows` table covers public-follow
(Twitter-shaped) and private-approval (Instagram-shaped) products, so a fork
picks its social model by toggling a profile flag rather than by writing a
second system.

### 2. Playlists are collaborative by invitation

**Decided:** creating a playlist offers an optional "add friends" step. Selected
friends receive an `INVITE` they must **accept** before joining — being invited
is not being a member.

Flow: creator picks friends at creation (or invites later from playlist
settings) → each invitee gets a notification with inline accept/decline →
accepting grants track-add rights. The owner can revoke an invite or remove a
collaborator; a collaborator can leave, and their past contributions stay
credited.

Every track mutation is authorized server side against
`role = 'owner' OR status = 'accepted'`, so an unanswered or declined invite
grants nothing.

### 3. Reports persist and alert; admin UI later

**Decided:** reporting writes a `reports` row (reporter, subject, reason,
status) and emails the operator. No admin surface in v1 — "we'll take a look"
becomes true because a human is actually notified, which is the part that
matters. The status column is there from day one so the admin queue is a read
model over existing data, not a migration.
