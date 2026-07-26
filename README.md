# MyMusic.

A retro music-social platform — your page, your charts, your friends' picks.

Build a personal listening page out of draggable modules, chart what you play,
swap recommendations with friends, and keep a shared playlist running. Styled
after transit-system print ephemera: cream paper, rule lines, and a monthly
"fare receipt" of what you listened to.

Implemented from the `Retro Music Social` design as a standalone Next.js app.

## Running it

```bash
npm install
npm run dev      # dev server with fast refresh, on :3000
npm run build    # static export to out/
npm run preview  # serve the exported build
```

## Screens

| Screen | What it does |
| --- | --- |
| **Landing** | Entry point into the five-step setup. |
| **Onboarding** | Welcome → connect a service → name/handle/bio → pick modules → done. Handles are checked against the directory; a taken handle blocks the step. |
| **Home** | Your page. Toggle modules on/off, drag cards to reorder, expand a card to full width, and switch grid density (compact / comfortable / spacious). |
| **Friends** | Search the directory, add friends, request to follow private accounts, remove or block from the row menu. |
| **Friend page** | A friend's public wall — or a locked page with a follow request if they're private. |
| **Notifications** | Unread badge in the nav; rows deep-link to the relevant screen. |
| **Settings** | Account (with a delete-account danger zone), service connections, privacy, and notification preferences. |
| **Playlist** | The shared *Rooftop Party 2026* playlist, including duplicate-add conflicts. |

## Home modules

`Line Updates` · `Now Playing` · `Top 50 Chart` · `This Month's Top 10` ·
`Transit Receipt` · `Friend Recommendations` · `Friends List`

Each can be toggled, reordered by drag-and-drop, and expanded to span both
columns. Layout state lives in the app, so rearranging is immediate.

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

- **No backend.** All data is seeded in component state; actions mutate it in
  memory, so a refresh resets the demo.
- **Next.js App Router**, configured for static export (`output: 'export'`), so
  `npm run build` emits a prerendered site to `out/` that any static host can
  serve with no Node runtime. Unlike the previous Vite `base: './'`, Next emits
  absolute asset paths — to serve from a sub-path, set `basePath` and
  `assetPrefix` in `next.config.mjs`.
- **Layout.** `src/app/layout.jsx` holds the document shell, `metadata`, and the
  font links; `src/app/page.jsx` is the single route and renders `<App />`.
- **One client component.** `src/App.jsx` carries `'use client'` — the whole app
  is interactive, so it hydrates as a unit. It has no browser-only APIs, so the
  landing screen still prerenders to static HTML at build time.
- **State** lives in a single `App` class component. `renderVals()` derives every
  display value (labels, colors, toggle positions) from state in one place,
  keeping the JSX free of branching logic.
- **Styling** is inline, carried over verbatim from the design. `src/sx.js`
  parses those CSS strings into React style objects and memoizes the result, so
  the styling stays byte-for-byte comparable to the source rather than being
  hand-translated.
- **Fonts** are Tinos, JetBrains Mono, and Arimo, loaded from Google Fonts via a
  stylesheet link rather than `next/font`: the design's inline styles name the
  families literally, and `next/font` would rename them to generated
  identifiers. They are metric-compatible with Times New Roman, Courier, and
  Arial, so the layout holds if the fonts fail to load.
