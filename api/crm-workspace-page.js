import { guardPrivateRequest } from '../server/crm-boundary.mjs';
import { randomBytes } from 'node:crypto';
import { getCrmRuntime } from '../server/crm-runtime.mjs';
import { crmWorkspacePage } from '../server/crm-workspace-page.mjs';

export default async function handler(req, res) {
  if (guardPrivateRequest(req, res)) return;
  for (const name of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) res.setHeader(name, 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  if (!['GET', 'HEAD'].includes(req.method)) { res.statusCode = 405; return res.end(); }
  try {
    if (!await getCrmRuntime().auth.loadSession(req)) { res.statusCode = 302; const incoming=new URL(req.url,'https://crm.cnps.ai');const params=new URLSearchParams();for(const key of ['companyId','deliveryId']){const value=incoming.searchParams.get(key);if(value&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value))params.set(key,value);}res.setHeader('Location', '/crm'+(params.size?'?'+params.toString():'')); return res.end(); }
    const nonce = randomBytes(18).toString('base64');
    res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 200; return res.end(req.method === 'HEAD' ? undefined : crmWorkspacePage(nonce));
  } catch { res.statusCode = 503; return res.end('客户工作台暂不可用，请稍后重试。'); }
}
