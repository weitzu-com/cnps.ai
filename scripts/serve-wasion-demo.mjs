import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { wasionDemoPage } from '../server/wasion-demo-page.mjs';
import { retrieveWasionSources } from '../server/wasion-demo-sources.mjs';

// Loopback-only design preview; production uses the authenticated page API.
const port = Number(process.env.PORT || 4186);
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  if (url.pathname === '/api/crm-wasion-demo-search' && req.method === 'POST') {
    let raw = ''; for await (const chunk of req) raw += chunk;
    let data; try { data = JSON.parse(raw); } catch { res.writeHead(400); return res.end(); }
    const { results } = retrieveWasionSources(data.question);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true, data: { answer: 'This local preview shows official page matches. Live AI summaries are available in the authenticated customer demo.', results, sources: results.slice(0, 4), resultCount: results.length, ai: { generated: false, status: 'unavailable' } } }));
  }
  if (url.pathname === '/' || url.pathname === '/crm/wasion-demo') { res.writeHead(302, { Location: '/demo/wasion' }); return res.end(); }
  if (!url.pathname.startsWith('/demo/wasion')) { res.writeHead(404); return res.end('Not found'); }
  const styled = url.pathname.match(/^\/demo\/wasion\/styles\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/);
  const style = styled?.[1] || 'classic';
  const slug = styled ? styled[2] || 'home' : url.pathname === '/demo/wasion' ? 'home' : url.pathname.slice('/demo/wasion/'.length);
  const nonce = randomBytes(18).toString('base64');
  const html = wasionDemoPage(nonce, { slug, style, query: url.searchParams.get('q') || '' });
  if (!html) { res.writeHead(404); return res.end('Not found'); }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; img-src https://en.wasion.com; connect-src 'self'; base-uri 'none'; form-action 'self' mailto:; frame-ancestors 'none'; object-src 'none'`);
  res.end(html);
}).listen(port, '127.0.0.1', () => console.log(`Wasion preview: http://127.0.0.1:${port}/demo/wasion`));
