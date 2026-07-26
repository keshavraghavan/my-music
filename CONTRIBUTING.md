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
src/App.tsx     Every screen, all state. Being decomposed — see the roadmap.
src/types.ts    Domain types.
src/sx.ts       Inline-style parser. Scheduled for removal.
tests/unit/     Vitest + Testing Library.
tests/e2e/      Playwright.
docs/ROADMAP.md The plan, phase by phase. Read this first.
```

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
- **Prettier owns formatting.** Don't hand-format; run `npm run format`.
  `src/App.tsx` is excluded on purpose — its JSX is a verbatim port of the
  original design and reflowing it would make the diff unreviewable. That
  exclusion goes away as Phase 2 decomposes the file.
- **Tests pin behaviour, not markup.** The current DOM has no roles or labels
  to query by, so tests lean on visible text. As Phase 2 introduces real
  semantics, prefer `getByRole`.
- **Known bugs stay visible.** If you find one outside your change's scope,
  pin it in a test with a comment naming it, or file an issue — don't leave it
  silently passing.

## Accessibility

Every interactive element is currently a `<div onClick>`: not focusable, not
keyboard-operable, no roles. `npm run lint` reports this as ~150 warnings, and
that count is the honest measure of the debt. Phase 2 fixes it wholesale.

New code should not add to that number — use real `<button>` elements.

## Reporting bugs

Open an issue with what you did, what you expected, and what happened. If it is
visual, a screenshot helps. If it reproduces in the deployed demo, say so.
