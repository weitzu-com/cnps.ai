import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToRegexp } from 'path-to-regexp';

// GSC sent live clicks to the bare URL /products/iflytek-dual-screen-translator-2-0-the-ultimate-business-translation-tool.
// The /products/:path* catch-all (PR #25) turned it into 308 -> /en/products/<slug> -> 404, because this slug never had a
// www product page: it is a shop.cnps.ai handle. The same chain applies to every other legacy shop handle under /products/.
// This file guards that every explicit /products redirect ends on a page that exists, and that no bare path reachable from
// the legacy site, the legacy sitemap or the catalog's shop handles can fall through the catch-all onto a missing /en page.
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('content/i18n/product-assets.json', 'utf8'));
const legacy = JSON.parse(fs.readFileSync('content/i18n/legacy-pages.json', 'utf8'));
const ticnoteCloud = JSON.parse(fs.readFileSync('content/i18n/ticnote-cloud.json', 'utf8'));
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
  const known = legacy.some((x) => x.path === m[1]) || (ticnoteCloud.path === m[1]);
  if (!known) return false;
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

// Vercel compiles every redirect `source` with path-to-regexp 6 using exactly these options (@vercel/routing-utils
// sourceToRegex) and evaluates the list top to bottom, first match wins. Reproducing that here lets the tests ask
// "which redirect fires for this path?" instead of only looking entries up by literal source string.
const VERCEL_PATH_OPTIONS = { strict: true, sensitive: true, delimiter: '/' };
const compiled = redirects.map((r) => {
  const keys = [];
  return { r, re: pathToRegexp(r.source, keys, VERCEL_PATH_OPTIONS), keys };
});
function firstRedirect(pathname, host = 'www.cnps.ai') {
  for (const { r, re, keys } of compiled) {
    const m = re.exec(pathname);
    if (!m) continue;
    if (r.has && !r.has.every((h) => h.type === 'host' && new RegExp('^' + h.value + '$').test(host))) continue;
    let destination = r.destination;
    keys.forEach((k, i) => {
      destination = destination.replace(':' + k.name + '*', m[i + 1] ?? '').replace(':' + k.name, m[i + 1] ?? '');
    });
    return { ...r, resolved: destination };
  }
  return null;
}

// Truncated / shortened forms of the iFlytek shop handle. GSC and crawlers hit the full handle (PR #26); the live site
// still turned every shorter form into 308 -> /en/products/<slug> -> 404 through the catch-all (verified 2026-10-19).
// Every hyphen-boundary prefix of the full handle, plus the short brand/product slugs people actually type.
const IFLYTEK_PARTS = IFLYTEK.split('-');
const IFLYTEK_TRUNCATIONS = IFLYTEK_PARTS.map((_, i) => IFLYTEK_PARTS.slice(0, i + 1).join('-'));
const IFLYTEK_SHORT = [
  'iflytek-translator',
  'iflytek-dual-screen-translator-2-0',
  'iflytek-dual-screen-translator',
  'iflytek-translator-2-0',
  'iflytek-dual-screen-translator-2-0-the-ultimate',
  'iflytek-business-translator',
  'iflytek-translator-2-0-the-ultimate-business-translation-tool',
];
const IFLYTEK_VARIANTS = [...new Set([...IFLYTEK_TRUNCATIONS, ...IFLYTEK_SHORT])];
const IFLYTEK_PATHS = IFLYTEK_VARIANTS.flatMap((slug) => ['/products/' + slug, '/en/products/' + slug]);

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

test('the compiled matcher reproduces the live routing for the already-verified paths', () => {
  // Sanity-check the simulator against behaviour verified with curl before trusting it for the variants below.
  assert.equal(firstRedirect('/products/' + IFLYTEK)?.resolved, SHOP + IFLYTEK);
  assert.equal(firstRedirect('/products/ticnote')?.resolved, '/en/products/ticnote');
  assert.equal(firstRedirect('/products/ticnote-ai-voice-recorder')?.resolved, '/en/products/ticnote');
  assert.equal(firstRedirect('/products/some-future-sku')?.resolved, '/en/products/some-future-sku', 'catch-all still covers unknown slugs');
  assert.equal(firstRedirect('/products/a/b')?.resolved, '/en/products/a/b', 'catch-all keeps multi-segment paths intact');
  assert.equal(firstRedirect('/en/products/ticnote'), null, 'real /en product pages are served, not redirected');
  assert.equal(firstRedirect('/en/products'), null);
  assert.equal(firstRedirect('/', 'cnps.ai')?.resolved, '/en');
});

test('truncated iFlytek slugs are caught by one pattern per prefix, placed before the catch-all', () => {
  for (const source of ['/products/:slug(iflytek.*)', '/en/products/:slug(iflytek.*)']) {
    const r = redirect(source);
    assert.ok(r, 'missing pattern redirect ' + source);
    assert.equal(r.permanent, true, source + ' must be a permanent (308) redirect');
    assert.equal(r.destination, SHOP + IFLYTEK, source + ' must land on the one live page for this product');
    assert.ok(redirects.indexOf(r) < catchAllIndex, source + ' must precede /products/:path*');
    // Vercel's documented regex-parameter syntax (`:name(regex)`), not `iflytek-:rest*`, which path-to-regexp 6.3
    // rejects ("Can not repeat without a prefix and suffix") and which would miss the bare /products/iflytek anyway.
    assert.doesNotThrow(() => pathToRegexp(source, [], VERCEL_PATH_OPTIONS));
  }
});

test('every truncated iFlytek variant 308s in one hop to the full shop product URL (no chain, no 404)', () => {
  assert.ok(IFLYTEK_VARIANTS.length >= 15, 'expected the hyphen-boundary truncations plus the short slugs');
  assert.ok(IFLYTEK_VARIANTS.includes('iflytek'));
  assert.ok(IFLYTEK_VARIANTS.includes('iflytek-dual-screen-translator'));
  assert.ok(IFLYTEK_VARIANTS.includes('iflytek-dual-screen-translator-2-0'));
  assert.ok(IFLYTEK_VARIANTS.includes('iflytek-translator'));
  assert.ok(IFLYTEK_VARIANTS.includes(IFLYTEK));
  const sources = new Set(redirects.map((r) => r.source));
  for (const pathname of IFLYTEK_PATHS) {
    const hit = firstRedirect(pathname);
    assert.ok(hit, pathname + ' has no redirect and would 404');
    assert.equal(hit.permanent, true, pathname + ' must be permanent (308)');
    assert.equal(hit.resolved, SHOP + IFLYTEK, pathname + ' must reach the shop product URL in one hop, got ' + hit.resolved);
    assert.ok(!hit.resolved.startsWith('/en/products/iflytek'), pathname + ' still falls into the catch-all onto a missing /en page');
    assert.ok(!sources.has(hit.resolved), pathname + ' -> ' + hit.resolved + ' chains into another redirect');
    assert.ok(destinationResolves(hit.resolved), pathname + ' -> ' + hit.resolved + ' does not resolve to an existing page');
  }
  // Anything else iFlytek-ish under /products (deeper paths, odd suffixes) also goes to the product, never to a 404.
  for (const pathname of ['/products/iflytek-', '/products/iflytek-dual-screen-translator/specs', '/en/products/iflytek-dual-screen-translator-2-0-en', '/products/iflytek2']) {
    assert.equal(firstRedirect(pathname)?.resolved, SHOP + IFLYTEK, pathname + ' should fall back to the shop product URL');
  }
});

test('the iFlytek pattern never captures a real www product page or an unrelated slug', () => {
  // The /en pattern sits on the same prefix as live pages, so no real product may ever start with "iflytek"
  // unless an explicit redirect (or the page itself) is placed ahead of it.
  for (const p of legacy.filter((x) => x.path.startsWith('/products/'))) {
    assert.ok(!p.path.startsWith('/products/iflytek'), p.path + ' would be hijacked by the /en/products/:slug(iflytek.*) pattern');
    assert.equal(firstRedirect('/en' + p.path), null, '/en' + p.path + ' is a real page and must not redirect');
  }
  for (const p of products) assert.ok(!p.slug.startsWith('iflytek'), p.slug + ' would be hijacked by the iFlytek pattern');
  // The prefix is anchored: slugs that merely contain "iflytek" are still handled by the generic catch-all.
  assert.equal(firstRedirect('/products/xiflytek')?.resolved, '/en/products/xiflytek');
  assert.equal(firstRedirect('/products/my-iflytek-review')?.resolved, '/en/products/my-iflytek-review');
  assert.equal(firstRedirect('/en/products/xiflytek'), null);
  // PR #26's explicit full-handle entries are untouched and still fire first.
  for (const source of ['/products/' + IFLYTEK, '/en/products/' + IFLYTEK]) {
    const explicit = redirect(source);
    assert.equal(firstRedirect(source).source, source, source + ' must still be matched by its explicit entry');
    assert.equal(explicit.destination, SHOP + IFLYTEK);
  }
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

test('live: every truncated iFlytek variant is a single 308 hop onto the 200 shop page', { skip: !process.env.LIVE_REDIRECT_CHECK }, async () => {
  const target = await fetch(SHOP + IFLYTEK, { redirect: 'manual' });
  assert.equal(target.status, 200, 'shop product URL is not 200: ' + target.status);
  for (const pathname of IFLYTEK_PATHS) {
    const res = await fetch('https://www.cnps.ai' + pathname, { redirect: 'manual' });
    assert.equal(res.status, 308, pathname + ' responded ' + res.status + ' instead of 308');
    assert.equal(res.headers.get('location'), SHOP + IFLYTEK, pathname + ' redirects to ' + res.headers.get('location'));
  }
});
