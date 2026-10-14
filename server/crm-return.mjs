const ORIGIN = 'https://crm.cnps.ai';

// Only authenticated portal pages may be a destination. Neither an external
// host nor the login page itself can become an open redirect or a login loop.
export function safeCrmReturnTo(value) {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/')
      || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return null;
  // Historical return targets remain usable but always produce canonical URLs.
  value = value.replace(/^\/crm\/workspace(?=[?#]|$)/, '/workspace');
  const path = value.split(/[?#]/, 1)[0];
  if (path !== '/w' && path !== '/workspace' && !/^\/demo\/wasion(?:\/[a-z0-9-]+)?$/.test(path)) return null;
  try {
    const url = new URL(value, ORIGIN);
    if (url.origin !== ORIGIN || url.pathname !== path || /%(?:00|0a|0d|5c)/i.test(url.search + url.hash)) return null;
    const params = new URLSearchParams();
    if (path === '/workspace') {
      for (const key of ['companyId', 'deliveryId', 'projectId', 'contextId']) {
        const id = url.searchParams.get(key);
        if (id && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id)) params.set(key, id);
      }
    } else if (path === '/demo/wasion/search') {
      const query = url.searchParams.get('q');
      if (query && query.length <= 500 && !/[\u0000-\u001f\u007f]/.test(query)) params.set('q', query);
    }
    const hash = /^#[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(url.hash) ? url.hash : '';
    return path + (params.size ? '?' + params.toString() : '') + hash;
  } catch { return null; }
}

export function crmLoginUrl(returnTo) {
  const target = safeCrmReturnTo(returnTo);
  return '/' + (target ? '?returnTo=' + encodeURIComponent(target) : '');
}

export function crmPageReturnTo(requestUrl) {
  const url = new URL(requestUrl, ORIGIN);
  const next = url.searchParams.get('next');
  const explicit = safeCrmReturnTo(url.searchParams.get('returnTo')) || (next === '/w' || /^\/demo\/wasion(?:\/[a-z0-9-]+)?$/.test(next || '') ? safeCrmReturnTo(next) : null);
  if (explicit) return explicit;
  const params = new URLSearchParams();
  for (const name of ['companyId', 'deliveryId', 'projectId', 'contextId']) {
    const value = url.searchParams.get(name);
    if (value && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) params.set(name, value);
  }
  return params.size ? safeCrmReturnTo('/workspace?' + params.toString()) : null;
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
