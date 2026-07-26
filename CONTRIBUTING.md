# Contributing to MyMusic

Thanks for taking a look. MyMusic is both a working music-social app and a
template other people fork to build their own design-forward social sites, so
contributions are judged against both uses.

## Getting set up

```bash
npm install
npm run dev          # http://localhost:3000
```

That is the whole setup. No database, no API keys, no `.env` — if you ever find
yourself needing one to run the app, that is a bug worth reporting.

## Before you open a pull request

```bash
npm run check        # typecheck + lint + format + unit tests
npm run test:e2e     # end-to-end, needs `npm run build` first
```

CI runs exactly these. It must pass on a fork with no secrets configured, so
never add a check that depends on a credential.

### Scripts

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Dev server with fast refresh                  |
| `npm run build`     | Static export to `out/`                       |
| `npm run typecheck` | `tsc --noEmit`, strict                        |
| `npm run lint`      | ESLint                                        |
| `npm run format`    | Prettier, writing in place                    |
| `npm test`          | Unit tests (Vitest + Testing Library)         |
| `npm run test:e2e`  | End-to-end tests (Playwright, against `out/`) |
| `npm run check`     | Everything CI runs except the build and e2e   |

If your environment already ships a Chromium that Playwright did not install,
point at it rather than downloading another:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chromium npm run test:e2e
```

## Where things live

```
src/app/            Routes. One folder per URL; (app) is the signed-in shell.
src/core/ui/        Accessible primitives — Button, Toggle, Modal, Field, …
src/core/page-builder/  Module registry, drag/keyboard reorder, the grid.
src/core/styles/    Design tokens. Retheming is editing tokens.css.
src/domains/music/  Everything music-specific: data, modules, compose.
src/state/store.tsx In-memory store. Phase 3 replaces it with the database.
src/types.ts        Domain types.
src/sx.ts           Inline-style parser. Being retired; see the roadmap.
tests/unit/         Vitest + Testing Library.
tests/e2e/          Playwright.
docs/ROADMAP.md     The plan, phase by phase. Read this first.
```

The split between `core/` and `domains/music/` is the point: `core/` is what a
fork keeps. Anything that knows a track from a photo belongs in a domain.

## What we are working toward

[`docs/ROADMAP.md`](docs/ROADMAP.md) is the source of truth: it inventories
every workflow, states the architecture, and sequences the work into phases.
Two things it asks of every change:

1. **Keep domain-agnostic code separable.** Identity, the social graph, feeds,
   notifications, moderation and the module-grid page builder are not about
   music. They are the part other people fork. Music-specific logic should stay
   isolated from them.
2. **Keep the app runnable with an empty `.env`.** New integrations go behind
   an interface with a working mock as the default.

## Conventions

- **TypeScript is strict**, including `noUncheckedIndexedAccess`. Prefer a type
  guard over a cast; where a cast is genuinely necessary, keep it to one line
  and say why.
- **Prettier owns formatting.** Don't hand-format; run `npm run format`. The
  seeded fixture tables carry `// prettier-ignore` so they keep reading as
  tables; nothing else is exempt.
- **Tests pin behaviour, not markup.** Query by role and accessible name —
  `getByRole('button', { name: 'Add Wren L.' })`. If a control is hard to
  address that way, the control needs fixing, not the test.
- **Known bugs stay visible.** If you find one outside your change's scope,
  pin it in a test with a comment naming it, or file an issue — don't leave it
  silently passing.

## Accessibility

Phase 2 replaced every `<div onClick>` with a real control, so `jsx-a11y` rules
are **errors** now — a static element with a click handler fails CI.

What that means in practice:

- Use `core/ui` rather than restyling a `<div>`. `Button`, `Toggle`, `Modal`,
  `RowMenu` and `Field` already carry the roles, keyboard handling and focus
  management; a new primitive belongs next to them.
- Anything drag-operated needs a keyboard path too — `ModuleCard` is the
  worked example.
- Give controls an accessible name that says what they do to _what_
  ("Add Wren L.", not "+ ADD"), and keep the visible text inside it.
- Focus must be visible. The one ring lives in `core/styles/tokens.css`.

## Reporting bugs

Open an issue with what you did, what you expected, and what happened. If it is
visual, a screenshot helps. If it reproduces in the deployed demo, say so.
