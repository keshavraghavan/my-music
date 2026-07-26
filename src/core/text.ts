/**
 * Ends a sentence without doubling a full stop the text already carries.
 *
 * Every seeded display name ends in a period ("Wren L."), so the design's
 * `You're now friends with ${name}.` produced "Wren L..". Phase 1 pinned that
 * with a test rather than fixing it; this is the fix.
 */
export function endSentence(text: string): string {
  return /[.!?…]$/.test(text.trimEnd()) ? text : `${text}.`;
}
