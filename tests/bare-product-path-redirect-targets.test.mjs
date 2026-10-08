import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// GSC sent live clicks to the bare URL /products/iflytek-dual-screen-translator-2-0-the-ultimate-business-translation-tool.
// The /products/:path* catch-all (PR #25) turned it into 308 -> /en/products/<slug> -> 404, because this slug never had a
// www product page: it is a shop.cnps.ai handle. The same chain applies to every other legacy shop handle under /products/.
// This file guards that every explicit /products redirect ends on a page that exists, and that no bare path reachable from
// the legacy site, the legacy sitemap or the catalog's shop handles can fall through the catch-all onto a missing /en page.
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('content/i18n/product-assets.json', 'utf8'));
const legacy = JSON.parse(fs.readFileSync('content/i18n/legacy-pages.json', 'utf8'));
const redirects = vercel.redirects;
const redirect = (source) => redirects.find((r) => r.source === source);
const catchAll = redirect('/products/:path*');
const catchAllIndex = redirects.indexOf(catchAll);

const IFLYTEK = 'iflytek-dual-screen-translator-2-0-the-ultimate-business-translation-tool';
const SHOP = 'https://shop.cnps.ai/products/';
const builtPages = fs.existsSync('dist/en/products');

// A www product page exists when the trilingual content model has a record for it (and, after a build, an EN HTML file).
function wwwProductPageExists(destination) {
  const m = destination.match(/^\/en(\/products(?:\/[a-z0-9-]+)?)$/);
  if (!m) return false;
  if (!legacy.some((x) => x.path === m[1])) return false;
  if (builtPages) {
    const file = m[1] === '/products' ? 'dist/en/products.html' : path.join('dist/en', m[1] + '.html');
    if (!fs.existsSync(file)) return false;
  }
  return true;
}

// A destination resolves when it is a www page that exists, or a shop product URL (the shop is a separate live origin).
function destinationResolves(destination) {
  if (destination.startsWith(SHOP)) return /^[a-z0-9-]+$/.test(destination.slice(SHOP.length));
  return wwwProductPageExists(destination);
}

test('the iFlytek bare path has an explicit permanent redirect to a page that exists, ahead of the catch-all', () => {
  const bare = redirect('/products/' + IFLYTEK);
  assert.ok(bare, 'missing explicit redirect for /products/' + IFLYTEK);
  assert.equal(bare.permanent, true, 'must be a permanent (308) redirect');
  assert.ok(redirects.indexOf(bare) < catchAllIndex, 'must precede /products/:path* so it takes precedence');
  assert.notEqual(bare.destination, '/en/products/' + IFLYTEK, 'must not land on the missing /en product page');
  assert.ok(destinationResolves(bare.destination), 'destination does not resolve to an existing page: ' + bare.destination);
  // The only live page for this product is the shop listing with the same handle.
  assert.equal(bare.destination, SHOP + IFLYTEK);
});

test('the /en iFlytek path Google already discovered via the old chain also leaves the 404', () => {
  const en = redirect('/en/products/' + IFLYTEK);
  assert.ok(en, 'missing redirect for /en/products/' + IFLYTEK);
  assert.equal(en.permanent, true);
  assert.equal(en.destination, redirect('/products/' + IFLYTEK).destination, 'bare and /en paths must converge on one target');
  assert.ok(!legacy.some((x) => x.path === '/products/' + IFLYTEK), 'if a real page is added, drop these redirects instead');
  if (builtPages) assert.ok(!fs.existsSync('dist/en/products/' + IFLYTEK + '.html'));
});

test('every explicit /products redirect lands on an existing page and never on another redirect source', () => {
  const sources = new Set(redirects.map((r) => r.source));
  const explicit = redirects.filter((r) => /^(\/(en|zh|ar))?\/products(\/|$)/.test(r.source) && !r.source.includes(':'));
  assert.ok(explicit.length >= 9);
  for (const r of explicit) {
    assert.ok(destinationResolves(r.destination), r.source + ' -> ' + r.destination + ' does not resolve to an existing page');
    assert.ok(!sources.has(r.destination), r.source + ' -> ' + r.destination + ' chains into another redirect');
    assert.ok(redirects.indexOf(r) < catchAllIndex || r.source.startsWith('/en/'), r.source + ' must precede the catch-all');
  }
});

test('every shop handle the catalog links to converges on its www /en product page instead of 308 -> 404', () => {
  for (const p of products) {
    assert.match(p.shop, new RegExp('^' + SHOP.replace(/[./]/g, '\\$&')), p.slug + ' shop link is not a shop product URL');
    const handle = p.shop.slice(SHOP.length);
    const r = redirect('/products/' + handle);
    assert.ok(r, 'bare /products/' + handle + ' (shop handle for ' + p.slug + ') would fall through to a missing /en page');
    assert.equal(r.destination, '/en/products/' + p.slug);
    assert.equal(r.permanent, true);
    assert.ok(redirects.indexOf(r) < catchAllIndex, '/products/' + handle + ' must precede the catch-all');
  }
});

test('every bare /products URL the legacy site or legacy sitemap published resolves through an explicit redirect', () => {
  const found = new Set();
  const sitemap = fs.readFileSync('content/legacy-sitemap.xml', 'utf8');
  for (const m of sitemap.matchAll(/<loc>https:\/\/www\.cnps\.ai(\/products[^<]*)<\/loc>/g)) found.add(m[1]);
  for (const file of fs.readdirSync('content/legacy-source')) {
    const text = fs.readFileSync(path.join('content/legacy-source', file), 'utf8');
    for (const m of text.matchAll(/"href": "(?:https:\/\/www\.cnps\.ai)?(\/products[^"]*)"/g)) found.add(m[1]);
  }
  assert.ok(found.size >= 8, 'legacy sources should reference the eight original product routes');
  for (const bare of found) {
    const r = redirect(bare);
    assert.ok(r, bare + ' has no explicit redirect and would rely on the catch-all');
    assert.ok(destinationResolves(r.destination), bare + ' -> ' + r.destination + ' does not resolve');
  }
});

// Opt-in live check: LIVE_REDIRECT_CHECK=1 npm test follows the real chain and requires a final 200.
test('live: the bare iFlytek URL ends on a 200 page', { skip: !process.env.LIVE_REDIRECT_CHECK }, async () => {
  const res = await fetch('https://www.cnps.ai/products/' + IFLYTEK, { redirect: 'follow' });
  assert.equal(res.status, 200, 'final response was ' + res.status + ' at ' + res.url);
  assert.ok(!res.url.includes('/en/products/' + IFLYTEK), 'still landing on the missing /en page: ' + res.url);
});
