# Interface direction — three proposals

Round 1 of a visual redesign. The brief: a clearer, more minimalist look, drawing
on Vercel's Geist, the shadcn/ui token conventions, Luma, and Apple's Liquid
Glass — **without losing any module or workflow already shipped**.

Nothing in this document has been implemented. It is a proposal, plus the one
piece of prerequisite work all three options share.

- Visual comparison with live specimens of the real components:
  <https://claude.ai/code/artifact/ef50cadf-f0ef-43c1-8c2a-681d1a016c70>

---

## 0. The blocker — the theme is not in the theme file

`src/core/styles/tokens.css` is a real token layer, and the CSS Modules under
`core/ui/` and `core/page-builder/` honour it almost perfectly — five stray
`rgba()` literals across every module file combined.

The **screens** are the problem. They still carry the original design's inline
`style="…"` strings through `src/sx.ts`, and those strings hardcode both the
palette and the typefaces.

| Measure                         | Count |
| ------------------------------- | ----: |
| `sx()` call sites               |   119 |
| Files carrying them             |    17 |
| Hardcoded hex literals in `tsx` |   102 |
| Hardcoded font names in `tsx`   |    89 |
| Hardcoded values in CSS Modules |     5 |

```ts
// src/domains/music/modules/ReceiptModule.tsx
const CARD_CSS =
  "background:#F2ECDF;padding:20px 22px 16px;max-width:320px;margin:0 auto;font-family:'JetBrains Mono'";

// src/core/styles/accents.ts
export const ACCENTS = ['#B7472A', '#3F6B4F', '#C9A227', '#2F5673'] as const;
// "They match --accent-* in tokens.css; change both."
```

Heaviest offenders: `NowPlayingModule.tsx` and `OnboardingScreen.tsx` (21 each),
`ReceiptModule.tsx` and `ComposeModal.tsx` (14 each), `ProfileScreen.tsx` (12).

**Consequence:** editing `tokens.css` today reskins roughly half the app. Every
direction below is a token-file edit _after_ this migration and a 17-file rewrite
before it — so the migration is the work and the direction is the cheap part.
`ROADMAP.md` Phase 2 already scoped this; it landed for the primitives and
stopped short of the screens.

---

## A · Interchange — Geist-grade reduction

**Reference:** Vercel Geist. **Nature:** a look. **Effort:** low.

Keep the transit soul, drop the paper. Geist is mostly subtraction — an
achromatic scale where every border and disabled state sits on a deliberate step,
a border-first elevation model (1px hairlines everywhere, `box-shadow` reserved
for popovers and modals), radii limited to 4px / 6px / pill, and `#171717`
instead of pure black. That is close to what MyMusic already is — rules and mono
labels — minus the cream and minus four decorative accents.

| Token      | Now       | Proposed  |
| ---------- | --------- | --------- |
| `--paper`  | `#F2ECDF` | `#FBFBFA` |
| `--ink`    | `#1E1B18` | `#171717` |
| `--muted`  | `#6B6156` | `#6B6B6B` |
| `--rule`   | 4 weights | `#E6E6E4` |
| `--radius` | 0         | 6 / 4 / ∞ |

**Changes:** cream out; the four accents demoted from decoration to semantic
(green = live, red = destructive, nothing else); Tinos and Arimo retire in favour
of one tight neo-grotesque with negative tracking; JetBrains Mono stays, because
the mono label is the brand.

**Survives untouched:** every module, the drag-to-arrange grid, expand/collapse
spans, edit mode, rule lines, and the receipt's dashed tape.

**Risk:** lowest of the three. No new dependency, no workflow can break.

---

## B · Platform — adopt the shadcn token contract

**Reference:** shadcn/ui. **Nature:** a foundation. **Effort:** medium.

The development-side answer rather than the visual one. shadcn's real export
isn't its components — it's a naming contract: `background`/`foreground` pairs,
`card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`,
`border`, `input`, `ring`, `chart-1…5`, `--radius`, declared in OKLCH under
`:root` and redeclared under `.dark`.

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
  /* --chart-1 … --chart-5: the ramp accents.ts hand-rolls today */
}
.dark {
  /* the same names, different values — that is all dark mode costs */
}
```

**Gains:** dark mode for the price of one token block; `--chart-1…5` retires
`accents.ts` and its "change both" comment; any published shadcn theme or preset
becomes a paste-in reskin, which is exactly the promise a forkable template wants
to make; OKLCH lets a fork shift hue without re-picking every value by eye.

**Costs:** every `var(--ink)` / `--paper` / `--rule` reference gets renamed —
mechanical, but it is all of them. Dark mode needs real QA on avatars, the
receipt tape, and empty states. `src/app/(app)/[handle]/opengraph-image.tsx`
renders server-side and can't read CSS variables, so it keeps its own literals
regardless.

**Not a rival to A or C** — it is the layer they sit on. No new dependency:
you borrow the vocabulary, not the toolchain. CSS Modules stay.

---

## C · Night Line — Liquid Glass + Luma

**Reference:** Apple Liquid Glass, Luma. **Nature:** a look and a material.
**Effort:** high.

Near-black ground, translucent rather than painted surfaces, 16–18px radii, a
specular hairline on each card's top edge, and the part that matters — album art
blooming through the surface behind it. Liquid Glass is about lensing: the
material takes its colour from what is behind it, and a music app is one of the
few products that always has something worth refracting.

**Where glass earns its cost:**

- `AppShell` — already `position: sticky`; content scrolls under it.
- `Modal`, `ConfirmDialog`, `RowMenu`, `Toast` — floating layers by definition.
- `NowPlayingModule` — the only card with real art; tint the surface from the
  cover.

**What to watch:**

- **Contrast.** Text over an art-derived tint needs a floor. Ship a solid-surface
  path behind `prefers-contrast: more` and `prefers-reduced-transparency`.
- **Support.** True refraction needs an SVG `feDisplacementMap` fed into
  `backdrop-filter`, which is Chromium-only today. Safari and Firefox get blur
  with no lensing; anything without `backdrop-filter` gets an opaque panel.
- **Performance.** Blur is GPU-rasterised per layer. `contain: strict` on each
  glass surface, and cap the count — the home grid is seven cards, and blurring
  all of them is where the frame budget goes.
- **Identity.** This is the direction that walks away from transit print. Worth
  doing only if that is intended.

**Recommendation within C:** apply glass to the chrome, not the content. Leave
the chart, feed and receipt as opaque cards. That also matches Apple's own
guidance — glass belongs to the layer above the content, not the content.

---

## Comparison

|                           | A · Interchange | B · Platform       | C · Night Line          |
| ------------------------- | --------------- | ------------------ | ----------------------- |
| Reference                 | Vercel Geist    | shadcn/ui contract | Liquid Glass · Luma     |
| Nature                    | A look          | A foundation       | A look + a material     |
| Keeps transit identity    | Yes — sharpens  | Neutral            | No — replaces it        |
| Dark mode                 | Hand-built      | Free               | Native                  |
| New dependencies          | None            | None               | None (hand-written SVG) |
| Accessibility risk        | Low             | Low                | Needs work              |
| Browser risk              | None            | None               | Chromium-only lensing   |
| Blocked on `sx()` removal | Yes             | Yes                | Yes                     |

---

## Recommended sequence

B is plumbing, A is a theme, C is a material — they stack rather than compete.

| Step  | Work                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **0** | Finish retiring `sx()`. 17 files onto CSS Modules and tokens; delete `sx.ts` and `accents.ts`. Nothing visual changes.                |
| **1** | Rewrite `tokens.css` on the shadcn semantic contract in OKLCH, with a `.dark` block. Dark mode and a real chart ramp arrive with it.  |
| **2** | Ship A as the default theme: Geist-grade values into those tokens. Cream out, semantic accents, one tight sans, borders over shadows. |
| **3** | Optional — add a `--surface-glass` material used only by shell, modal, menu and toast, behind `@supports`, with an opaque fallback.   |

Step 0 is the only one that must happen. Steps 1–3 are each independently
shippable afterwards, and each leaves the app running.

---

## References

- [Vercel design system breakdown — colours, typography, tokens](https://seedflip.co/blog/vercel-design-system)
- [Geist (Vercel) on DesignSystems.one](https://www.designsystems.one/design-systems/vercel-geist)
- [shadcn/ui — Theming](https://ui.shadcn.com/docs/theming)
- [Getting clarity on Apple's Liquid Glass — CSS-Tricks](https://css-tricks.com/getting-clarity-on-apples-liquid-glass/)
- [Liquid Glass in the browser: refraction with CSS and SVG](https://kube.io/blog/liquid-glass-css-svg/)
