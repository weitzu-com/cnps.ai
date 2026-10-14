import { guardPrivateRequest } from '../server/crm-boundary.mjs';
import { getCrmRuntime } from '../server/crm-runtime.mjs';
export default async function handler(req, res) {
  if (guardPrivateRequest(req, res)) return;
  try { return await getCrmRuntime().auth(req, res); }
  catch {
    // Preview or unavailable dependencies must still return the login API's
    // private JSON contract, without platform error pages or configuration data.
    for (const header of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) res.setHeader(header, 'private, no-store, max-age=0');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    res.statusCode = 503;
    return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ error: '访问服务暂不可用，请稍后重试或联系项目对接人。' }));
  }
}
