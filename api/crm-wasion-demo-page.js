import { WASION_STYLES, WASION_DEFAULT_STYLE, wasionStyleBase } from '../server/wasion-demo-styles.mjs';
import {crmLoginPage} from '../server/crm-login.mjs';
import {guardPrivateRequest} from '../server/crm-boundary.mjs';
import { crmLoginUrl } from '../server/crm-navigation.mjs';
import { randomBytes } from 'node:crypto';
import { getCrmRuntime } from '../server/crm-runtime.mjs';
import { authorizeWasionCustomer } from '../server/wasion-demo.mjs';
import { wasionDemoPage, isWasionDemoSlug } from '../server/wasion-demo-page.mjs';

export function createWasionPageHandler({getRuntime=getCrmRuntime}={}) {
return async function handler(req,res) {
  if(guardPrivateRequest(req,res))return;
  for (const name of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) res.setHeader(name, 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  // Native same-origin form POSTs need a real Origin; cross-origin requests
  // still receive no referrer. Keep the strict POST Origin allowlist below.
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  if (!['GET', 'HEAD', 'POST'].includes(req.method)) { res.statusCode = 405; return res.end(); }
  const url = new URL(req.url, 'https://crm.cnps.ai');
  const slug = typeof req.query?.slug === 'string' ? req.query.slug : url.searchParams.get('slug') || 'home';
  const style = typeof req.query?.style === 'string' ? req.query.style : url.searchParams.get('style') || WASION_DEFAULT_STYLE;
  const base = wasionStyleBase(style);
  let query = typeof req.query?.q === 'string' ? req.query.q : url.searchParams.get('q') || '';
  if (!Object.hasOwn(WASION_STYLES, style) || !/^[a-z0-9-]+$/.test(slug) || !isWasionDemoSlug(slug)) {res.statusCode=404;return res.end('Page not found.')}
  if(query.length>500){res.statusCode=400;return res.end('Please use a question of 500 characters or fewer.')}
  if (req.method === 'POST') {
    if (slug !== 'search') { res.statusCode = 405; return res.end(); }
    const origins = new Set(['https://crm.cnps.ai']);
    if (!origins.has(req.headers?.origin)) { res.statusCode = 403; return res.end('Invalid request origin.'); }
    try {
      let body = req.body;
      if (body === undefined) {
        let raw = ''; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 8192) throw new Error(); } body = raw;
      }
      if (typeof body === 'string') body = Object.fromEntries(new URLSearchParams(body));
      if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.q !== 'string' || Buffer.byteLength(JSON.stringify(body)) > 8192) throw new Error();
      query = body.q.trim();
    } catch { res.statusCode = 400; return res.end('Invalid search request.'); }
  }
  if (query.length > 500) { res.statusCode = 400; return res.end('Please use a question of 500 characters or fewer.'); }
  let access, auth;
  try {
    const runtime=getRuntime();auth=runtime.auth;
    access = await authorizeWasionCustomer({ req, auth, service:{getProject:(...args)=>runtime.projectAccessService.getProject(...args)} });
  }
  catch { res.statusCode = 503; return res.end('Customer access could not be verified. Please try again.'); }
  if (!access) {
    let session;try{session=await auth.loadSession(req)}catch{res.statusCode=503;return res.end('Customer access could not be verified. Please try again.')}
    if (!session && req.method==='POST') {const nonce=randomBytes(18).toString('base64');res.statusCode=200;res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'`);return res.end(crmLoginPage(nonce,{returnTo:base+'/search',resumeQuestion:query}));}
    if (!session) { res.statusCode = 302; const returnTo=(slug==='home'?base:base+'/'+slug)+(slug==='search'&&query?'?'+new URLSearchParams({q:query}):'');res.setHeader('Location',crmLoginUrl(returnTo));return res.end();}
    res.statusCode = 404; return res.end('This page is unavailable for the current account.');
  }

  const nonce = randomBytes(18).toString('base64');
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; img-src https://en.wasion.com; media-src https://en.wasion.com; connect-src 'self'; base-uri 'none'; form-action 'self' mailto:; frame-ancestors 'none'; object-src 'none'`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.statusCode = 200; return res.end(req.method === 'HEAD' ? undefined : wasionDemoPage(nonce, { slug, query, style }));
}

}
export default createWasionPageHandler();
