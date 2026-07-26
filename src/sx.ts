import type { CSSProperties } from 'react';

// sx(): parse a CSS declaration string into a React style object.
//
// The design was authored with inline `style="..."` strings. Rather than
// hand-translate every rule into a camelCased object (and risk drift from the
// original), we keep the strings verbatim and parse them at render time — the
// same approach the dc-runtime used. Results are memoized since most style
// strings are static and re-passed on every render.
//
// NOTE: this helper is scheduled for removal. Inline styles cannot express
// media queries or `:hover` / `:focus-visible`, which blocks both responsive
// layout and accessible focus states. See docs/ROADMAP.md — Phase 2 migrates
// callers to CSS Modules over design tokens, and sx() goes away with the last
// one.
const cache = new Map<string, CSSProperties>();

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function parse(css: string): CSSProperties {
  const o: Record<string, string> = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    if (!prop) continue;
    // Preserve CSS custom properties (--foo) as-is; camelCase the rest.
    o[prop.startsWith('--') ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim();
  }
  // Keys are only known at runtime, so this is the one place a string-keyed bag
  // has to be asserted into React's style type.
  return o as CSSProperties;
}

function sx(css: string): CSSProperties;
function sx(css: string | null | undefined): CSSProperties | undefined;
function sx(css: string | null | undefined): CSSProperties | undefined {
  if (css == null) return undefined;
  const key = String(css);
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const parsed = parse(key);
  cache.set(key, parsed);
  return parsed;
}

export default sx;
