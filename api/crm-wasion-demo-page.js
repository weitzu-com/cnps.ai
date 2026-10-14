import { randomBytes } from 'node:crypto';
import { getCrmRuntime } from '../server/crm-runtime.mjs';
import { authorizeWasionCustomer } from '../server/wasion-demo.mjs';
import { wasionDemoPage, WASION_PAGES } from '../server/wasion-demo-page.mjs';
import { crmLoginUrl } from '../server/crm-navigation.mjs';

export default async function handler(req, res) {
  for (const name of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) res.setHeader(name, 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  if (!['GET', 'HEAD'].includes(req.method)) { res.statusCode = 405; return res.end(); }
  const url = new URL(req.url, 'https://crm.cnps.ai');
  const slug = typeof req.query?.slug === 'string' ? req.query.slug : url.searchParams.get('slug') || 'home';
  const query = typeof req.query?.q === 'string' ? req.query.q : url.searchParams.get('q') || '';
  if (!/^[a-z0-9-]+$/.test(slug) || (slug !== 'search' && !WASION_PAGES.some(page => page.slug === slug))) {
    res.statusCode = 404; return res.end('Page not found.');
  }
  if (query.length > 500) { res.statusCode = 400; return res.end('Please use a question of 500 characters or fewer.'); }
  const returnTo = (slug === 'home' ? '/demo/wasion' : '/demo/wasion/' + slug) + (slug === 'search' && query ? '?' + new URLSearchParams({ q: query }) : '');
  let access, auth;
  try {
    ({ auth } = getCrmRuntime());
    access = await authorizeWasionCustomer({ req, auth });
  }
  catch { res.statusCode = 503; return res.end('Customer access could not be verified. Please try again.'); }
  if (!access) {
    let session;
    try { session = await auth.loadSession(req); }
    catch { res.statusCode = 503; return res.end('Customer access could not be verified. Please try again.'); }
    if (!session) { res.statusCode = 302; res.setHeader('Location', crmLoginUrl(returnTo)); return res.end(); }
    res.statusCode = 404; return res.end('This page is unavailable for the current account.');
  }
  const nonce = randomBytes(18).toString('base64');
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; img-src https://en.wasion.com; connect-src 'self'; base-uri 'none'; form-action 'self' mailto:; frame-ancestors 'none'; object-src 'none'`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.statusCode = 200; return res.end(req.method === 'HEAD' ? undefined : wasionDemoPage(nonce, { slug, query }));
}
