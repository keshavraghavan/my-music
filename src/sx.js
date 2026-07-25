// sx(): parse a CSS declaration string into a React style object.
//
// The design was authored with inline `style="..."` strings. Rather than
// hand-translate every rule into a camelCased object (and risk drift from the
// original), we keep the strings verbatim and parse them at render time — the
// same approach the dc-runtime used. Results are memoized since most style
// strings are static and re-passed on every render.
const cache = new Map();

function kebabToCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function parse(css) {
  const o = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    if (!prop) continue;
    // Preserve CSS custom properties (--foo) as-is; camelCase the rest.
    o[prop.startsWith('--') ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim();
  }
  return o;
}

export default function sx(css) {
  if (css == null) return undefined;
  const key = String(css);
  let hit = cache.get(key);
  if (hit === undefined) {
    hit = parse(key);
    cache.set(key, hit);
  }
  return hit;
}
