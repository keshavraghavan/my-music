# MyMusic.

A retro music-social platform — your page, your charts, your friends' picks.

Build a personal listening page out of draggable modules, chart what you play,
swap recommendations with friends, and keep a shared playlist running. Styled
after transit-system print ephemera: cream paper, rule lines, and a monthly
"fare receipt" of what you listened to.

Implemented from the `Retro Music Social` design as a standalone Next.js app.

> **Status: demo becoming an app.** The read model is now persisted in
> Postgres; Phase 3 deliberately leaves mutations simulated until the social
> workflows land in Phase 5.
> [`docs/ROADMAP.md`](docs/ROADMAP.md) inventories every workflow and sequences
> the work to make it real. Phase 1 (TypeScript, tests, CI) and Phase 2 (real
> routes, accessible components, responsive layout) and Phase 3 (Postgres,
> Drizzle, repositories, server reads) are done.

## Running it

```bash
npm install
npm run dev      # dev server with fast refresh, on :3000
npm run build    # production build
npm run preview  # run the production server
```

No configuration is required to see the app: without `DATABASE_URL`, server
components use the bundled fixture snapshot. To develop against persistent
Postgres:

```bash
docker compose up -d
cp .env.example .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

## Developing

```bash
npm run check      # typecheck + lint + format + unit tests (what CI runs)
npm test           # unit tests only
npm run test:e2e   # Playwright, against the built output
```

TypeScript runs strict. Unit tests use Vitest with Testing Library; end-to-end
tests use Playwright against the static export, with no secrets, so CI passes
on a fork. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Screens

| Screen            | URL               | What it does                                                                                                                                    |
| ----------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Landing**       | `/`               | Entry point into the five-step setup.                                                                                                           |
| **Onboarding**    | `/onboarding/1…5` | Welcome → connect a service → name/handle/bio → pick modules → done. Handles are checked against the directory; a taken handle blocks the step. |
| **Home**          | `/home`           | Your page. Toggle modules on/off, reorder cards by drag or arrow keys, expand a card to full width, and switch grid density.                    |
| **Friends**       | `/friends`        | Search the directory, add friends, request to follow private accounts, remove or block from the row menu.                                       |
| **Profile**       | `/[handle]`       | Somebody's public wall — or the same URL locked behind a follow request if they're private.                                                     |
| **Notifications** | `/notifications`  | Unread badge in the nav; rows deep-link to the relevant screen.                                                                                 |
| **Settings**      | `/settings/[tab]` | Account (with a delete-account danger zone), service connections, privacy, and notification preferences — one tab per URL.                      |
| **Playlist**      | `/playlist`       | The shared _Rooftop Party 2026_ playlist, including duplicate-add conflicts.                                                                    |

## Home modules

`Line Updates` · `Now Playing` · `Top 50 Chart` · `This Month's Top 10` ·
`Transit Receipt` · `Friend Recommendations` · `Friends List`

Each can be toggled, reordered — by drag, or with the arrow keys on the card's
handle — and expanded to span both columns. Layout state lives in the app, so
rearranging is immediate.

The grid itself knows nothing about music: modules are registry entries in
`src/domains/music/modules/`, and `src/core/page-builder/` supplies the drag,
toggle, expand and density machinery. Swap the list to build a different site.

### Empty and conflict states

The app models the states a real integration hits, not just the happy path:

- **No service connected** — Now Playing, the chart, and the receipt each show
  their own empty state, plus a banner linking to Settings.
- **Both services connected** — when Spotify and Apple Music disagree on what's
  playing, the card asks which to trust.
- **Duplicate playlist add** — warns who already added the track and offers
  "add anyway", which credits both contributors.
- **Top 10 full** — capped at ten hand-picked tracks.
- No friends, no recommendations, and no search results each have a state.

## Notes on the implementation

- **Postgres + Drizzle.** Server Components hydrate the UI from repository
  queries. `src/state/client-store.tsx` holds only transient UI state and
  Phase 3's intentionally stubbed mutations.
- **Next.js App Router** with the full server runtime. Profile handles resolve
  dynamically from the database rather than a static path list.
- **Routes are the state.** Which screen you are on, which onboarding step,
  which settings tab and whose profile are all URLs;
  [`src/core/routes.ts`](src/core/routes.ts) is the only place one is named.
- **State** is a context store — `useAppState()` for values, `useAppActions()`
  for the mutations. Screens derive their own display values rather than
  reading from one central bag.
- **Accessible by construction.** Every control comes from
  [`src/core/ui/`](src/core/ui): real buttons, `role="switch"` toggles, row
  menus with arrow keys and Escape, focus-trapped dialogs, an `aria-live` toast
  region, labelled fields. `jsx-a11y` rules run as errors.
- **Styling** is CSS Modules over the design tokens in
  [`src/core/styles/tokens.css`](src/core/styles/tokens.css) for the shell,
  the primitives and the layout — that is where the breakpoints and focus
  states live. Card interiors still pass the design's verbatim inline-style
  strings through `src/sx.ts`, which keeps them byte-comparable to the source;
  they convert as later phases give those cards real data.
- **Fonts** are Tinos, JetBrains Mono, and Arimo, loaded from Google Fonts via a
  stylesheet link rather than `next/font`: the design's inline styles name the
  families literally, and `next/font` would rename them to generated
  identifiers. They are metric-compatible with Times New Roman, Courier, and
  Arial, so the layout holds if the fonts fail to load.
