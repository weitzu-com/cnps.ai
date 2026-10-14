import { guardPrivateRequest } from '../server/crm-boundary.mjs';
import { getCrmRuntime } from '../server/crm-runtime.mjs';
import { randomBytes } from 'node:crypto';
import { crmLoginPage, safeDemoReturnTo } from '../server/crm-login.mjs';
import { crmPageReturnTo } from '../server/crm-return.mjs';

export default async function crmPage(req, res) {
  if (guardPrivateRequest(req, res)) return;
  const nonce = randomBytes(18).toString('base64');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'`);
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    return res.end();
  }
  try {
    const session=await getCrmRuntime().auth.loadSession(req);
    if(session){res.statusCode=302;res.setHeader('Location',crmPageReturnTo(req.url)||(session.identity.role==='proposal_viewer'?'/w':'/workspace'));return res.end();}
  }catch{}
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const url = new URL(req.url || '/', 'https://crm.cnps.ai');
  const next = typeof req.query?.next === 'string' ? req.query.next : url.searchParams.get('next');
  res.end(req.method === 'HEAD' ? undefined : crmLoginPage(nonce, { returnTo: crmPageReturnTo(req.url || '/') || safeDemoReturnTo(next) }));
}
