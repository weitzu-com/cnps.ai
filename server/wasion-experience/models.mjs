// Match whole model/standard tokens. A space is a model separator only for a
// known prefix, so prose such as "supports 24 V" is not a fictitious model.
// Kept self-contained because the offline search client embeds this function.
export function wasionModelTokens(value, prefixes = new Set()) {
  const text = String(value || '').toLowerCase().replace(/[‐‑–—]/g, '-');
  const tokens = [...text.matchAll(/\b([a-z]{1,12})([- ]?)(\d{2,6}[a-z\d-]*)\b/g)];
  return [...new Set(tokens.filter(match => match[2] !== ' ' || prefixes.has(match[1]))
    .map(match => (match[1] + match[3]).replace(/-/g, '')))];
}
