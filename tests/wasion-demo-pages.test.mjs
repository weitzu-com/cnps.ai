import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { WASION_PAGES, wasionDemoPage } from '../server/wasion-demo-page.mjs';
import { getCrmRuntime } from '../server/crm-runtime.mjs';
import pageHandler from '../api/crm-wasion-demo-page.js';

const content = JSON.parse(readFileSync(new URL('../server/wasion-demo-content.json', import.meta.url), 'utf8'));
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const logo = 'https://en.wasion.com/public/uploads/images/20220517/ad428c0c9f42220db4e310a71131810b.png';
const encode = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const markup = html => html.slice(0, html.indexOf('<script'));
const route = page => page.slug === 'home' ? '/demo/wasion' : `/demo/wasion/${page.slug}`;

test('64 distinct official English pages render complete navigation with the requested logo', () => {
  assert.equal(WASION_PAGES.length, 64);
  assert.equal(new Set(WASION_PAGES.map(page => page.slug)).size, WASION_PAGES.length);
  assert.equal(new Set(WASION_PAGES.map(page => page.url)).size, WASION_PAGES.length);
  assert.equal(content.logoUrl, logo);
  const validRoutes = new Set([...WASION_PAGES.map(route), '/demo/wasion/search']);
  for (const page of WASION_PAGES) {
    assert.match(page.slug, /^[a-z0-9-]+$/);
    assert.equal(new URL(page.url).origin, 'https://en.wasion.com');
    const html = wasionDemoPage('fixture-nonce', { slug: page.slug });
    assert.ok(html, page.slug);
    assert.match(html, /^<!doctype html><html lang="en">/, page.slug);
    assert.equal((markup(html).match(/<h1\b/g) || []).length, 1, page.slug);
    assert.ok(markup(html).includes(`src="${logo}"`), page.slug);
    assert.match(html, /aria-label="Main navigation"/, page.slug);
    assert.ok(html.includes('href="/demo/wasion/search"'), `Missing AI search entry on ${page.slug}`);
    assert.match(html, /<a class="wd-skip" href="#main">Skip to content<\/a>/, page.slug);
    for (const [, href] of markup(html).matchAll(/href="(\/demo\/wasion[^"?#]*)/g)) {
      assert.ok(validRoutes.has(href), `${page.slug} links to unknown route ${href}`);
    }
  }
});

test('every reproduced page exposes its own official source link', () => {
  for (const page of WASION_PAGES) {
    const html = markup(wasionDemoPage('fixture-nonce', { slug: page.slug }));
    assert.ok(html.includes(`href="${encode(encodeURI(page.url))}"`), `Missing source link on ${page.slug}`);
  }
});

test('product and solution details preserve their published features and technical table cells', () => {
  const details = WASION_PAGES.filter(page => page.pageType === 'detail' && ['Products', 'Solutions'].includes(page.category));
  assert.ok(details.length > 20);
  for (const page of details) {
    const html = markup(wasionDemoPage('fixture-nonce', { slug: page.slug }));
    for (const feature of page.features || []) assert.ok(html.includes(encode(feature)), `${page.slug}: ${feature}`);
    if (page.features?.length) assert.match(html, /id="features"/, page.slug);
    if (page.tables?.length) {
      assert.match(html, /id="specifications"/, page.slug);
      assert.match(html, /<caption>.*official technical information<\/caption>/, page.slug);
      for (const rows of page.tables) for (const row of rows) for (const cell of row) {
        assert.ok(html.includes(encode(cell)), `${page.slug}: ${cell}`);
      }
    }
  }
});

test('software category reaches its reproduced products and resources retain all official download links', () => {
  const software = markup(wasionDemoPage('fixture-nonce', { slug: 'system-software' }));
  const softwarePages = WASION_PAGES.filter(page => new URL(page.url).pathname.startsWith('/RelevantProduct/'));
  assert.ok(softwarePages.length >= 8);
  for (const page of softwarePages) assert.ok(software.includes(`href="${route(page)}"`), page.slug);
  const resources = WASION_PAGES.find(page => page.slug === 'resources');
  assert.ok(resources.downloads.length >= 6);
  const html = markup(wasionDemoPage('fixture-nonce', { slug: 'resources' }));
  for (const document of resources.downloads) {
    assert.equal(new URL(document.url).origin, 'https://en.wasion.com');
    assert.ok(html.includes(`href="${encode(encodeURI(document.url))}"`), document.title);
    assert.ok(html.includes(encode(document.title)), document.title);
  }
  assert.match(html, /current validity are determined by the official source/);
});

test('search queries are escaped in HTML attributes and cannot terminate the nonce script', () => {
  for (const query of ['</script><script>alert("x")</script>', '\"><img src=x onerror=alert(1)>', '& q="a" <b>\u2028\u2029']) {
    const html = wasionDemoPage('fixture-nonce', { slug: 'search', query });
    assert.equal((html.match(/<script\b/g) || []).length, 1);
    assert.equal((html.match(/<\/script>/g) || []).length, 1);
    assert.ok(html.includes(`value="${encode(query)}"`));
    const script = html.match(/<script nonce="fixture-nonce">([\s\S]*)<\/script>/)[1];
    assert.doesNotThrow(() => new Script(script));
    assert.ok(script.includes(`const SEARCH_QUERY=${JSON.stringify(query).replace(/</g, '\\u003c')};`));
    assert.match(script, /question:SEARCH_QUERY,language:'en'/);
  }
  assert.match(wasionDemoPage('fixture-nonce', { slug: 'search' }), /What would you like to know\?/);
  for (const slug of ['not-a-page', '../about', 'ABOUT', 'search/extra', '<script>']) assert.equal(wasionDemoPage('fixture-nonce', { slug }), null);
});

test('Vercel preserves the existing CRM entry and maps every demo child to the authenticated page API', () => {
  assert.deepEqual(vercel.rewrites.find(item => item.source === '/demo/wasion'), { source: '/demo/wasion', destination: '/api/crm-wasion-demo-page' });
  assert.deepEqual(vercel.rewrites.find(item => item.source === '/demo/wasion/:slug'), { source: '/demo/wasion/:slug', destination: '/api/crm-wasion-demo-page?slug=:slug' });
  assert.equal(vercel.rewrites.find(item => item.source === '/crm')?.destination, '/api/crm-page');
  assert.equal(vercel.redirects.find(item => item.source === '/crm/wasion-demo')?.destination, '/demo/wasion');
  for (const name of ['api/crm-wasion-demo-page.js', 'api/crm-wasion-demo-search.js']) {
    assert.equal(vercel.functions[name].includeFiles, 'server/wasion-demo-content.json');
    assert.equal(vercel.functions[name].maxDuration, 30);
  }
});

test('page API enforces live CRM authentication, route bounds, private caching, HEAD and nonce CSP', async t => {
  // Initialize only with synthetic endpoints; session loading is replaced before
  // any handler invocation, so this test never contacts a service or real account.
  const fixtureEnv = {
    UPSTASH_REDIS_REST_URL: 'https://example.invalid', UPSTASH_REDIS_REST_TOKEN: 'test-token',
    TWENTY_API_URL: 'https://example.invalid', TWENTY_API_KEY: 'test-token', CNPS_PROPOSAL_SECRET: '1'.repeat(64),
    CRM_FILE_GATEWAY_URL: 'https://example.invalid', CRM_FILE_GATEWAY_KEY: '2'.repeat(64)
  };
  const originals = Object.fromEntries(Object.keys(fixtureEnv).map(key => [key, process.env[key]]));
  Object.assign(process.env, fixtureEnv);
  let runtime;
  try { runtime = getCrmRuntime(); }
  finally { for (const [key, value] of Object.entries(originals)) value === undefined ? delete process.env[key] : process.env[key] = value; }
  const originalSession = runtime.auth.loadSession;
  const response = () => ({ headers: {}, setHeader(name, value) { this.headers[name] = value; }, end(body) { this.body = body; } });
  let session = null;
  runtime.auth.loadSession = async () => session;
  try {
    await t.test('anonymous and inactive viewers cannot read any demo page', async () => {
      const anonymous = response();
      await pageHandler({ method: 'GET', url: '/api/crm-wasion-demo-page?slug=products' }, anonymous);
      assert.equal(anonymous.statusCode, 302);
      assert.equal(anonymous.headers.Location, '/crm');
      assert.equal(anonymous.body, undefined);
      session = { identity: { role: 'customer', memberships: [{ role: 'customer', companyId: 'fixture', active: false }] } };
      const revoked = response();
      await pageHandler({ method: 'GET', url: '/api/crm-wasion-demo-page?slug=products' }, revoked);
      assert.equal(revoked.statusCode, 404);
      assert.ok(!revoked.body.includes('<html'));
    });
    session = { identityId: 'fixture-admin', identity: { role: 'admin' } };
    await t.test('all 64 rewritten routes resolve for an authorized viewer with source content', async () => {
      for (const page of WASION_PAGES) {
        const res = response();
        await pageHandler({ method: 'GET', url: route(page), query: { slug: page.slug } }, res);
        assert.equal(res.statusCode, 200, page.slug);
        assert.match(res.body, /<html lang="en">/, page.slug);
        for (const name of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) assert.match(res.headers[name], /private, no-store/, page.slug);
        assert.match(res.headers['X-Robots-Tag'], /noindex, nofollow/);
        const nonce = res.body.match(/<script nonce="([^"]+)">/)[1];
        assert.ok(res.headers['Content-Security-Policy'].includes(`script-src 'nonce-${nonce}'`));
        assert.ok(res.headers['Content-Security-Policy'].includes(`style-src 'nonce-${nonce}'`));
        assert.ok(res.headers['Content-Security-Policy'].includes('img-src https://en.wasion.com;'));
        assert.ok(res.headers['Content-Security-Policy'].includes("frame-ancestors 'none'"));
        assert.equal(res.headers['X-Frame-Options'], 'DENY');
      }
    });
    await t.test('HEAD uses the same authorization and routing while omitting the page body', async () => {
      const res = response();
      await pageHandler({ method: 'HEAD', url: '/api/crm-wasion-demo-page?slug=products' }, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body, undefined);
      assert.equal(res.headers['Content-Type'], 'text/html; charset=utf-8');
    });
    await t.test('rewritten and direct API requests preserve the search query without allowing script injection', async () => {
      const query = 'aMeter300 </script><script>alert(1)</script> & AMI';
      for (const req of [
        { method: 'GET', url: `/api/crm-wasion-demo-page?slug=search&q=${encodeURIComponent(query)}` },
        { method: 'GET', url: '/demo/wasion/search', query: { slug: 'search', q: query } }
      ]) {
        const res = response();
        await pageHandler(req, res);
        assert.equal(res.statusCode, 200);
        assert.ok(res.body.includes(`value="${encode(query)}"`));
        assert.equal((res.body.match(/<script\b/g) || []).length, 1);
      }
      const maximum = response();
      await pageHandler({ method: 'GET', url: '/demo/wasion/search', query: { slug: 'search', q: 'x'.repeat(500) } }, maximum);
      assert.equal(maximum.statusCode, 200);
    });
    await t.test('invalid routes, oversized queries and unsupported methods do not render a page', async () => {
      for (const slug of ['not-a-page', '../about', 'ABOUT', 'search/extra', '<script>']) {
        const res = response();
        await pageHandler({ method: 'GET', url: '/api/crm-wasion-demo-page', query: { slug } }, res);
        assert.equal(res.statusCode, 404, slug);
      }
      const oversized = response();
      await pageHandler({ method: 'GET', url: '/api/crm-wasion-demo-page', query: { slug: 'search', q: 'x'.repeat(501) } }, oversized);
      assert.equal(oversized.statusCode, 400);
      const post = response();
      await pageHandler({ method: 'POST', url: '/api/crm-wasion-demo-page' }, post);
      assert.equal(post.statusCode, 405);
    });
    await t.test('authentication outages fail closed', async () => {
      runtime.auth.loadSession = async () => { throw new Error('fixture authentication outage'); };
      const res = response();
      await pageHandler({ method: 'GET', url: '/api/crm-wasion-demo-page' }, res);
      assert.equal(res.statusCode, 503);
      assert.ok(!res.body.includes('<html'));
    });
  } finally { runtime.auth.loadSession = originalSession; }
});
