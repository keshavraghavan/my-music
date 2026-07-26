import { describe, expect, it } from 'vitest';
import sx from '@/sx';

describe('sx()', () => {
  it('parses a single declaration', () => {
    expect(sx('color:red')).toEqual({ color: 'red' });
  });

  it('parses multiple declarations', () => {
    expect(sx('color:red;display:flex')).toEqual({ color: 'red', display: 'flex' });
  });

  it('camelCases kebab-cased properties', () => {
    expect(sx('background-color:#fff;border-bottom-width:1px')).toEqual({
      backgroundColor: '#fff',
      borderBottomWidth: '1px',
    });
  });

  it('preserves CSS custom properties verbatim', () => {
    expect(sx('--accent-color:#B7472A')).toEqual({ '--accent-color': '#B7472A' });
  });

  it('keeps colons inside values', () => {
    // Splitting on the *first* colon matters: url() values contain their own.
    expect(sx('background:url(https://example.test/a.png)')).toEqual({
      background: 'url(https://example.test/a.png)',
    });
  });

  it('keeps quoted font shorthand intact', () => {
    expect(sx("font:700 22px 'Tinos'")).toEqual({ font: "700 22px 'Tinos'" });
  });

  it('trims whitespace around properties and values', () => {
    expect(sx('  color : red ;  display:flex  ')).toEqual({ color: 'red', display: 'flex' });
  });

  it('skips empty segments and declarations with no colon', () => {
    expect(sx('color:red;;garbage;')).toEqual({ color: 'red' });
  });

  it('returns undefined for null and undefined', () => {
    expect(sx(null)).toBeUndefined();
    expect(sx(undefined)).toBeUndefined();
  });

  it('returns an empty object for an empty string', () => {
    expect(sx('')).toEqual({});
  });

  it('memoizes, returning the identical object for the same input', () => {
    // React re-passes these strings on every render, so identity matters:
    // a fresh object each time would defeat style diffing.
    const a = sx('color:red;display:flex');
    const b = sx('color:red;display:flex');
    expect(a).toBe(b);
  });

  it('does not conflate different inputs', () => {
    expect(sx('color:red')).not.toBe(sx('color:blue'));
  });
});
