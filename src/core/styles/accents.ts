/**
 * The four accents, as values rather than CSS variables.
 *
 * Anything that paints a swatch inline — a rank bullet, an avatar, a feed dot —
 * needs the literal. They match `--accent-*` in tokens.css; change both.
 */
export const ACCENTS = ['#B7472A', '#3F6B4F', '#C9A227', '#2F5673'] as const;

/** Accent for row `i`, cycling the palette. Wraps, so it always resolves. */
export function accent(i: number): string {
  return ACCENTS[i % ACCENTS.length] as string;
}
