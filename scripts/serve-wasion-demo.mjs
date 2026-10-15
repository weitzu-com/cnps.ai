import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const assetRoot=fileURLToPath(new URL('../web/assets/',import.meta.url));
import { WASION_DEFAULT_STYLE } from '../server/wasion-demo-styles.mjs';
import { randomBytes } from 'node:crypto';
import { wasionDemoPage } from '../server/wasion-demo-page.mjs';
import { retrieveWasionSources } from '../server/wasion-demo-sources.mjs';

// Loopback-only design preview; production uses the authenticated page API.
const port = Number(process.env.PORT || 4186);
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  if(url.pathname.startsWith('/assets/')){
    let file;try{file=path.resolve(assetRoot,decodeURIComponent(url.pathname.slice('/assets/'.length)));}catch{res.writeHead(400);return res.end('Invalid asset path');}
    if(!file.startsWith(assetRoot)){res.writeHead(403);return res.end();}
    try{const data=await readFile(file);const ext=path.extname(file);res.setHeader('Content-Type',({'.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.mp4':'video/mp4','.m4v':'video/mp4'})[ext]||'application/octet-stream');res.setHeader('Content-Length',data.length);return res.end(data);}catch{res.writeHead(404);return res.end('Asset not found');}
  }
  if (url.pathname === '/api/crm' && req.method === 'GET') {res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');return res.end(JSON.stringify({authenticated:true,identity:{role:'customer'}}));}
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
  const style = styled?.[1] || WASION_DEFAULT_STYLE;
  const slug = styled ? styled[2] || 'home' : url.pathname === '/demo/wasion' ? 'home' : url.pathname.slice('/demo/wasion/'.length);
  const nonce = randomBytes(18).toString('base64');
  let query=url.searchParams.get('q') || '';
  if(req.method==='POST'&&slug==='search'){let raw='';for await(const chunk of req)raw+=chunk;query=new URLSearchParams(raw).get('q')||'';}
  const html = wasionDemoPage(nonce, { slug, query, style });
  if (!html) { res.writeHead(404); return res.end('Not found'); }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; img-src 'self' https://en.wasion.com; media-src 'self' https://en.wasion.com; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self' mailto:; frame-ancestors 'none'; object-src 'none'`);
  res.end(html);
}).listen(port, '127.0.0.1', () => console.log(`Wasion preview: http://127.0.0.1:${port}/demo/wasion`));
