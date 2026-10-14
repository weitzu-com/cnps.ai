import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createDevFixtures, DEV_ACCOUNTS, DEV_OTP } from './dev-crm-fixtures.mjs';
import { createBusinessHandler } from '../server/crm-business-handler.mjs';
import { crmLoginPage } from '../server/crm-login.mjs';
import { crmWorkspacePage } from '../server/crm-workspace-page.mjs';

// Exported for tests. Host/Origin checks happen before authentication or bodies.
export function isDevRequestAllowed(req, port) {
  if (!['127.0.0.1', '::ffff:127.0.0.1'].includes(req.socket?.remoteAddress)) return false;
  const host = req.headers.host;
  if (![`localhost:${port}`, `127.0.0.1:${port}`].includes(host)) return false;
  if (['x-forwarded-host', 'x-forwarded-for', 'x-real-ip', 'forwarded'].some(header => req.headers[header] !== undefined)) return false;
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  if (req.headers.origin !== undefined && req.headers.origin !== `http://${host}`) return false;
  if (req.method === 'POST' && req.headers.origin !== `http://${host}`) return false;
  return true;
}

function page(res, req, render) {
  const nonce = randomBytes(18).toString('base64');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'`);
  const banner = `<aside class="dev-banner">本地开发演示 · 所有数据在内存中，重启清空。验证码 ${DEV_OTP}，不发送真实短信。<br>管理员 ${DEV_ACCOUNTS.admin} · 经理 ${DEV_ACCOUNTS.manager} · 客户 ${DEV_ACCOUNTS.customer} · Beta 客户 ${DEV_ACCOUNTS.otherCustomer}<br>云数据库、AI、邮件和通知通道均未连接。</aside>`;
  const html = render(nonce).replaceAll('href="https://www.cnps.ai/w"', 'href="/__dev/proposal"').replaceAll('验证码已发送，请查看短信并输入6位验证码。', `本地演示：请输入固定验证码 ${DEV_OTP}；未发送短信。`).replace('</head>', `<style nonce="${nonce}">.dev-banner{padding:12px 20px;background:#fff4cf;color:#493d10;font:14px/1.6 system-ui;border-bottom:1px solid #dec981}</style></head>`).replace(/<body[^>]*>/, match => match + banner);
  res.statusCode = 200; res.end(req.method === 'HEAD' ? undefined : html);
}

export async function createDevCrmServer() {
  const fixtures = await createDevFixtures();
  const { env, runtime } = fixtures;
  const business = createBusinessHandler({ env, authHandler: runtime.auth, service: runtime.service });
  const server = http.createServer(async (req, res) => {
    for (const [header, value] of Object.entries({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY' })) res.setHeader(header, value);
    const port = server.address()?.port;
    if (!isDevRequestAllowed(req, port)) { res.statusCode = 403; return res.end('Local development origin required.'); }
    const origin = `http://${req.headers.host}`;
    // Safari does not accept Secure __Host cookies over HTTP localhost. Use
    // distinct host-only dev cookies for synthetic sessions, then translate
    // only those names for the unchanged production authentication handler.
    req.headers.cookie = String(req.headers.cookie || '').split(';').map(item => item.trim()).filter(item => !/^__Host-cnps_crm(?:_challenge)?=/.test(item)).map(item => item.replace(/^cnps_dev_crm(_challenge)?=/, '__Host-cnps_crm$1=')).join('; ');
    const setHeader = res.setHeader.bind(res);
    res.setHeader = (name, value) => {
      if (name.toLowerCase() === 'set-cookie') {
        const translate = cookie => cookie.replace(/^__Host-cnps_crm(_challenge)?=/, 'cnps_dev_crm$1=').replace(/; Secure(?=;|$)/, '');
        value = Array.isArray(value) ? value.map(translate) : translate(value);
      }
      return setHeader(name, value);
    };
    // Production handlers keep their HTTPS origin rules. This translation is
    // confined to a request already proven to be local and exactly same origin.
    env.VERCEL_URL = `localhost:${port}`;
    if (req.headers.origin) req.headers.origin = `https://localhost:${port}`;
    const end = res.end.bind(res);
    res.end = (value, ...args) => end(typeof value === 'string' && String(res.getHeader('Content-Type')).startsWith('application/json') ? value.replaceAll('https://crm.cnps.ai/crm/workspace', origin + '/crm/workspace') : value, ...args);
    try {
      const url = new URL(req.url, origin);
      if (url.pathname === '/api/crm') return await runtime.auth(req, res);
      if (url.pathname === '/api/crm-workspace') return await business(req, res);
      if (url.pathname === '/__dev/health' && req.method === 'GET') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ ok: true, mode: 'isolated-memory-demo', externalServices: false })); }
      if (!['GET', 'HEAD'].includes(req.method)) { res.statusCode = 405; return res.end('Method not supported.'); }
      if (url.pathname === '/__dev/proposal') { res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.statusCode = 200; return res.end(req.method === 'HEAD' ? undefined : '客户方案未载入本地 CRM 演示。请返回 /crm/workspace 继续开发；此链接不会访问生产环境。'); }
      if (url.pathname === '/') { res.statusCode = 302; res.setHeader('Location', '/crm'); return res.end(); }
      if (url.pathname === '/crm') return page(res, req, crmLoginPage);
      if (url.pathname === '/crm/workspace') {
        if (!await runtime.auth.loadSession(req)) { res.statusCode = 302; res.setHeader('Location', '/crm'); return res.end(); }
        return page(res, req, crmWorkspacePage);
      }
      res.statusCode = 404; res.end('Not found.');
    } catch { res.statusCode = 500; res.end('Local development request failed.'); }
  });
  server.requestTimeout = 15000; server.headersTimeout = 10000;
  return { server, ...fixtures };
}

export async function startDevCrmServer(port = 4174) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Invalid development port.');
  const result = await createDevCrmServer();
  await new Promise((resolve, reject) => { result.server.once('error', reject); result.server.listen(port, '127.0.0.1', resolve); });
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--port' || !/^\d+$/.test(args[1]))) throw Error('Usage: npm run dev:crm -- [--port 4174]');
  const { server } = await startDevCrmServer(args.length ? Number(args[1]) : 4174);
  console.log(`CRM 本地开发演示：http://localhost:${server.address().port}/crm`);
  console.log(`仅监听 127.0.0.1；纯内存数据，重启清空；固定验证码 ${DEV_OTP}，不发送真实短信。`);
  console.log(`管理员 ${DEV_ACCOUNTS.admin}；经理 ${DEV_ACCOUNTS.manager}；客户 ${DEV_ACCOUNTS.customer}；Beta 客户 ${DEV_ACCOUNTS.otherCustomer}`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
}
