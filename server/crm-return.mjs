const ORIGIN = 'https://crm.cnps.ai';

// Only authenticated portal pages may be a destination. Neither an external
// host nor the login page itself can become an open redirect or a login loop.
export function safeCrmReturnTo(value) {
  if (typeof value !== 'string' || !value || value.length > 2048 || /[\\\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    const url = new URL(value, ORIGIN);
    if (url.hostname !== 'crm.cnps.ai' || url.port || url.username || url.password || !['https:', 'http:'].includes(url.protocol)) return null;
    if (!/^\/demo\/wasion(?:\/[a-z0-9-]+)?$/.test(url.pathname) && url.pathname !== '/crm/workspace') return null;
    if (/%(?:00|0a|0d|5c)/i.test(url.pathname + url.search + url.hash)) return null;
    return url.pathname + url.search + url.hash;
  } catch { return null; }
}

export function crmLoginUrl(returnTo) {
  const target = safeCrmReturnTo(returnTo);
  return '/crm' + (target ? '?returnTo=' + encodeURIComponent(target) : '');
}

export function crmPageReturnTo(requestUrl) {
  const url = new URL(requestUrl, ORIGIN);
  const explicit = safeCrmReturnTo(url.searchParams.get('returnTo'));
  if (explicit) return explicit;
  const params = new URLSearchParams();
  for (const name of ['companyId', 'deliveryId', 'projectId']) {
    const value = url.searchParams.get(name);
    if (value && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) params.set(name, value);
  }
  return params.size ? '/crm/workspace?' + params.toString() : null;
}

export function demoReturnTo(req) {
  const url = new URL(req.url, ORIGIN);
  const direct = safeCrmReturnTo(url.pathname + url.search);
  if (direct?.startsWith('/demo/wasion')) {
    // Vercel appends rewrite route parameters to req.url.
    url.searchParams.delete('slug');
    return safeCrmReturnTo(url.pathname + url.search);
  }
  const slug = req.query?.slug ?? url.searchParams.get('slug') ?? 'home';
  const path = '/demo/wasion' + (slug === 'home' ? '' : '/' + slug);
  const params = new URLSearchParams(url.search);
  params.delete('slug');
  if (typeof req.query?.q === 'string') params.set('q', req.query.q);
  return safeCrmReturnTo(path + (params.size ? '?' + params.toString() : '')) || '/demo/wasion';
}
