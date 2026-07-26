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

---

## Part 1 — Workflow inventory

Every workflow the product implies, with what actually exists today. This is the
scope of "fully functional."

### A. Identity & access — *does not exist in any form*

| Workflow | Today | Needed |
| --- | --- | --- |
| Sign up / sign in | None. `startOnboarding()` jumps to a form | Auth.js: email magic-link + OAuth (Spotify as an identity provider) |
| Session persistence | None | HTTP-only session cookie, server-side session lookup |
| Sign out | None | Session revoke + redirect |
| Handle availability | `DIRECTORY_HANDLES.includes()` on an 8-name array (`App.jsx:22`) | Debounced server check + unique DB constraint (race-safe) |
| Onboarding completion | `onboardStep` counter; `obNext()` at step 4 routes home | Persisted `onboarding_completed_at`; resumable across sessions; server-side gate |
| Account deletion | `confirmAction()` case `delete-account` → `route: 'landing'` (`App.jsx:271`) | Real cascade delete or soft-delete + grace period, plus data export |
| Password/email change, reauth | None | Standard flows |

### B. Profile & page building

| Workflow | Today | Needed |
| --- | --- | --- |
| Edit name / handle / bio | `accountForm` state; `saveAccount()` shows a toast (`App.jsx:237`) | Validated server action, persisted, handle-uniqueness enforced |
| Avatar / photo | "ADD PHOTO" is a dashed circle placeholder (`App.jsx:577`) | Real upload: presigned S3/R2 PUT, resize, moderation hook |
| Module on/off | `modules` object in state | `page_modules` table per user |
| Drag reorder | `dropOn()` reorders `order` array (`App.jsx:115`) | Persist position; optimistic update + server reconcile |
| Expand / collapse card | `expanded` object | Persist `span` per module |
| Grid density | `spacing` state | Persist as a user preference |
| Edit mode | `editMode` toggle | Keep client-only; fine as-is |

### C. Music service integration — *entirely simulated*

| Workflow | Today | Needed |
| --- | --- | --- |
| Connect service | `connectService()` sets `connected.spotify = true` (`App.jsx:234`) | Real OAuth 2.0 + PKCE, encrypted token storage, refresh-token rotation |
| Disconnect | Confirm modal flips the boolean | Token revoke at provider + local purge |
| Now Playing | Hardcoded literal in `renderVals()` (`App.jsx:444`) | Poll `/me/player/currently-playing`; cache; SSE or short-poll to the client |
| Dual-source conflict | `bothConnected` flag renders a "which to trust" prompt | Real precedence rule + persisted user preference |
| Charts (Top 50/100) | Two hardcoded 6–8 item arrays (`App.jsx:310-320`) | Aggregate from stored play history; windowed (7d/30d/all); ranked with movement deltas |
| Transit Receipt | `topSongs.slice(0,5)` with fabricated minutes (`App.jsx:321`) | Real monthly aggregate: play counts, total listening time, month boundaries in the user's timezone |
| Track search | `TRACK_POOL.filter()` over 8 tracks (`App.jsx:224`) | Provider catalog search, debounced, paginated |
| Backfill on connect | None | Import recent history at connect time so the page isn't empty |
| Token expiry / revocation | None | Detect 401, refresh, and surface a "reconnect" state |

### D. Social graph

| Workflow | Today | Needed |
| --- | --- | --- |
| Directory search | Filters 8 hardcoded `PEOPLE` (`App.jsx:359`) | Indexed search over real users, paginated, block-aware |
| Add friend | Sets `relations[id] = 'friend'` instantly (`App.jsx:148`) | Follow (asymmetric) or friend request (symmetric) — **see open question** |
| Request to follow (private) | Sets `'requested'` | Real request record |
| **Accept / decline a request** | **Missing entirely** — requests can be sent, never received or accepted | Incoming-request inbox, accept/decline, notification |
| Remove friend | Confirm → `'none'` | Delete edge both directions; revoke content access |
| Block | Confirm → `'blocked'` | **Enforced**: hide profile, strip from feeds/search, block DMs/recs both ways |
| Unblock / blocked list | Missing | Settings screen listing blocks |
| Privacy enforcement | `isPrivateProfile` toggles a boolean; **nothing is actually gated** | Server-side authorization on every profile/feed/wall read |

### E. Content & interaction

| Workflow | Today | Needed |
| --- | --- | --- |
| Recommend a track to a friend | `postRecommendation()` prepends to `theoWall` — and **only ever Theo's wall** (`App.jsx:219`, `379`) | Real post to any user's wall, authorized by relationship |
| Friend wall | Only `theok` has one; every other friend renders empty | Per-user wall, paginated |
| Receive recommendations | Three seeded `recs` | Real inbox, ordered, paginated |
| Hide / report a rec | `status: 'hidden'` / `'reported'` in memory (`App.jsx:162`) | Persist; reports enter a moderation queue |
| **Moderation queue** | **Missing** — "We'll take a look" is a lie today | Admin review surface, or at minimum a persisted report record with status |
| Feed ("Line Updates") | Four hardcoded strings (`App.jsx:438`) | Real activity feed: fan-out-on-read from followees' events, paginated, block-filtered |
| Monthly Top 10 | Add/remove in memory, cap of 10 | Persist; enforce cap and dedupe server-side |
| Shared playlist | One hardcoded playlist, three tracks | Playlist CRUD, membership/permissions, multiple playlists |
| Duplicate-add conflict | Nice UX; appends `'Juno Reyes'` string to `addedBy` (`App.jsx:213`) | Contributor rows keyed by user id, not display name |
| Playlist reorder / remove track | Missing | Needed for a real playlist |
| Delete / edit own post | Missing | Table stakes |

### F. Notifications

| Workflow | Today | Needed |
| --- | --- | --- |
| List + unread badge | Four seeded rows | Real per-user notification table, paginated |
| Mark read / mark all read | In-memory map (`App.jsx:168`) | Persisted read state |
| Deep link from row | `clickNotification()` routes by `type` (`App.jsx:169`) | Route to the specific entity, not just the screen |
| Generation | None — notifications never get created | Emitted by domain events (rec posted, request accepted, chart updated) |
| Preferences | `notifPrefs` booleans, unused | Respected at emit time |
| Email / push delivery | Missing | Email digest via Resend; web push optional |
| Realtime arrival | Missing | SSE channel per user |

### G. Cross-cutting gaps

- **URL routing.** One route, `/`. No deep links, no back button, no
  shareable profile URLs, no SEO. Everything is a `route` string in state.
- **Accessibility.** Every interactive element is a `<div onClick>` — no
  `<button>`, no keyboard operability, no focus management in modals, no
  `aria-*`, no visible focus ring. Drag-reorder is mouse-only.
- **Responsiveness.** Hardcoded `max-width:1200px`, `width:560px` and fixed
  pixel type throughout. `sx()` parses inline style strings and **cannot
  express media queries or `:hover`/`:focus-visible`** — this is a hard
  blocker on both responsive and accessible styling.
- **No loading, error, or offline states.** Nothing is async today, so none
  exist; every screen needs skeleton + error + retry once data is real.
- **No validation, rate limiting, CSRF, or authorization layer.**
- **No tests, types, lint, CI, LICENSE, CONTRIBUTING, or `.env.example`.**

---

## Part 2 — Target architecture

```
src/
  app/                        # Next.js routes — real URLs, replacing the `route` string
    (marketing)/page.tsx              # landing
    (app)/[handle]/page.tsx           # profile — public, private-locked, or own
    (app)/home/page.tsx
    (app)/friends/page.tsx
    (app)/playlists/[id]/page.tsx
    (app)/notifications/page.tsx
    (app)/settings/[tab]/page.tsx
    onboarding/[step]/page.tsx
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
    page-builder/             # module registry, layout persistence, drag-reorder
    ui/                       # accessible primitives: Button, Toggle, Modal,
                              #   Toast, Menu, Field, Card, EmptyState
    styles/                   # design tokens (CSS custom properties)

  domains/music/              # ← swap this folder to build a different site
    providers/                # MusicProvider interface
      mock.ts                 #   works with no API keys — keeps the demo alive
      spotify.ts              #   real OAuth + Web API
      apple.ts                #   stub behind the same interface
    charts/ receipts/ now-playing/ playlists/ recommendations/
    modules/                  # registers music modules into core/page-builder
```

### The three seams that make it a template

1. **`MusicProvider` interface.** One TypeScript interface — `search`,
   `nowPlaying`, `recentPlays`, `topItems`. `mock.ts` is the reference
   implementation and the default, so `git clone && npm run dev` works with an
   empty `.env`. Real adapters are drop-in.

2. **Module registry.** `core/page-builder` knows nothing about music. Modules
   self-register with `{ key, label, accent, defaultSpan, Component,
   loadData }`. Today's seven music modules become registry entries; a photo
   app registers different ones and the whole drag/toggle/expand/persist
   machinery is inherited unchanged.

3. **Design tokens.** The retro-transit look (cream `#F2ECDF`, ink `#1E1B18`,
   four accents, Tinos/JetBrains Mono/Arimo) moves out of ~800 inline style
   strings into CSS custom properties. Retheming becomes editing one file.

### On `sx()` — replace it

`src/sx.js` was the right call for design fidelity during the port, but it is
now the main blocker: inline styles cannot express media queries, `:hover`, or
`:focus-visible`, so **responsiveness and accessibility are both unreachable
while it stands**. Migrate to CSS Modules over tokens, component by component,
as each screen is decomposed. Keep `sx()` working until the last consumer is
gone so nothing breaks mid-migration.

---

## Part 3 — Data model

Drizzle schema, split core vs. domain:

**`core/db/schema/`** — `users`, `accounts`, `sessions`,
`verification_tokens` (Auth.js), `profiles` (handle unique, display_name, bio,
avatar_url, is_private, timezone), `follows` (follower/followee, status:
`pending|accepted`), `blocks`, `activity_events` (actor, verb, object_type,
object_id — polymorphic), `notifications`, `notification_prefs`, `reports`,
`page_modules` (user_id, module_key, enabled, position, span), `user_prefs`.

**`domains/music/db/schema/`** — `service_connections` (provider,
**encrypted** access/refresh tokens, expiry, scopes), `artists`, `tracks`,
`albums` (provider-agnostic ids + provider id map), `plays` (user, track,
played_at, ms_played, source), `chart_snapshots` (user, period, rank, track,
prev_rank), `monthly_picks`, `playlists`, `playlist_tracks`,
`playlist_contributors` (user_id — replaces today's `addedBy: string[]`),
`wall_posts`, `recommendations`.

**Non-negotiable:** access and refresh tokens are encrypted at rest
(AES-256-GCM via a `TOKEN_ENCRYPTION_KEY` env var), never logged, and never
sent to the client.

---

## Part 4 — Phases

Each phase leaves the app runnable, and lands as its own commit on
`claude/app-workflows-plan-v0cgr8`.

### Phase 1 — Foundation *(no behavior change)*
TypeScript (strict) + `tsconfig` path aliases · ESLint + Prettier · Vitest +
Testing Library · Playwright with the preinstalled Chromium
(`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`, never `playwright install`) ·
GitHub Actions CI (typecheck, lint, unit, e2e, build) · `LICENSE` (MIT) ·
`CONTRIBUTING.md` · `CODE_OF_CONDUCT.md` · issue/PR templates · `.env.example`.
Rename `.jsx → .tsx`, type the existing state shape.
**Ships:** identical app, now with a safety net.

### Phase 2 — Routing + decomposition *(no behavior change)*
Replace the `route` string with real App Router routes. Split `App.jsx` into
per-screen components and module components. Extract `core/ui` primitives —
and in doing so **fix accessibility**: real `<button>`, keyboard-operable
toggles and menus, focus-trapped modals, `aria-live` toasts, keyboard
reordering alongside drag. Introduce design tokens; begin retiring `sx()`.
Add responsive breakpoints.
**Ships:** same features, real URLs, keyboard-navigable, works on a phone.
**Highest-value phase** — everything after it is easier, and it alone fixes
two defects that would embarrass an OSS release.

### Phase 3 — Data layer
Postgres + Drizzle, schema and migrations, `docker-compose.yml` for local dev.
Seed script that reproduces today's `PEOPLE`/`TRACK_POOL` fixtures so the demo
is byte-comparable. Repository functions with unit tests. Screens read from the
DB through server components; mutations still stubbed.
**Ships:** data survives a refresh.

### Phase 4 — Auth & authorization
Auth.js: email magic-link + Spotify OAuth. Real signup/login/logout, resumable
server-backed onboarding, `requireUser()` guards, CSRF, rate limiting.
Implement `core/graph` **authorization** — the single function every read path
calls to answer "can A see B's content?", enforcing private profiles and
blocks. Account deletion and data export.
**Ships:** multiple real users; privacy is real, not cosmetic.

### Phase 5 — Core social workflows
Follow/request/**accept**/decline (closing the missing-acceptance gap), block
enforcement end-to-end, walls and recommendations against any user, feed
generation from `activity_events`, notifications emitted by domain events and
respecting prefs, reports persisted to a moderation queue, playlist CRUD +
contributors + reorder, page-layout persistence. Optimistic UI with rollback;
loading/error/empty states everywhere.
**Ships:** every button does what it claims.

### Phase 6 — Music integrations
`MusicProvider` interface + `mock` (default) + real Spotify (OAuth/PKCE,
encrypted tokens, refresh rotation, 401 → reconnect state). Play ingestion,
chart computation with rank deltas, monthly receipt aggregation, real catalog
search, connect-time backfill. Apple Music stub documented as
"bring your own developer account."
**Ships:** real listening data drives the page.

### Phase 7 — Realtime, polish, template docs
SSE for notifications and Now Playing · avatar upload (presigned) · email
digests · OG images and shareable profile URLs · perf pass · `docs/`:
architecture, "fork this into your own social site", writing a module, writing
a provider, deploy guide (Vercel + Neon/Supabase Postgres) · one-click deploy
button.
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
- **E2E (Playwright, mock provider, no secrets)** — the full journey: sign up →
  onboard → connect mock service → build page → search a user → send a follow
  request → **accept it as the second user** → post a recommendation → see it
  on the wall → receive the notification → add a duplicate playlist track and
  resolve the conflict → block → confirm content disappears → delete account.
- **Manual** — `docker compose up && npm run dev`, walk each screen at 375px
  and 1440px, navigate the entire app with only the keyboard, and hard-refresh
  on every screen to confirm state persists and deep links resolve.
- **Template check** — clone fresh into a temp dir, `npm i && npm run dev` with
  an empty `.env`, confirm the app boots on the mock provider.

---

## Open questions (answerable during Phase 4, not blocking)

1. **Follow or friendship?** The current model is contradictory: `addFriend()`
   makes a symmetric friendship instantly, `requestFollow()` implies asymmetric
   following, and copy uses "friends" throughout. **Recommendation:**
   asymmetric follow with an approval gate for private accounts (Instagram
   model), and surface "friends" in the UI as mutual follows. This is one
   `follows` table instead of two systems, and it's the primitive most other
   social sites want from the template.
2. **Playlist permissions** — open to all followers, or invite-only?
   Recommendation: per-playlist `visibility` + `contributor_policy`.
3. **Moderation** — full admin queue, or persisted reports with an email alert
   in v1? Recommendation: the latter; ship the admin surface later.
