import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// GSC still reports impressions on bare /products/<slug> URLs. Every catalog SKU must converge permanently on /en/products/<slug>,
// and nothing the site publishes (sitemap, localized pages, feeds) may point back at a bare path.
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('content/i18n/product-assets.json', 'utf8'));
const legacy = JSON.parse(fs.readFileSync('content/i18n/legacy-pages.json', 'utf8'));
const locales = ['en', 'zh', 'ar'];
const redirect = (source) => vercel.redirects.find((r) => r.source === source);

test('every catalog product slug has a permanent bare-path redirect to its /en page', () => {
  const slugs = products.map((p) => p.slug);
  assert.ok(slugs.length >= 6, 'catalog should list the six product SKUs');
  for (const slug of slugs) {
    const r = redirect('/products/' + slug);
    assert.ok(r, 'missing redirect for /products/' + slug);
    assert.equal(r.destination, '/en/products/' + slug);
    assert.equal(r.permanent, true, '/products/' + slug + ' must be permanent (308)');
  }
  for (const p of ['/products', '/products/compare']) {
    const r = redirect(p);
    assert.ok(r, 'missing redirect for ' + p);
    assert.equal(r.destination, '/en' + p);
    assert.equal(r.permanent, true);
  }
});

test('a permanent catch-all covers any future /products/<slug> and sits after the explicit entries', () => {
  const all = redirect('/products/:path*');
  assert.ok(all, 'missing /products/:path* catch-all');
  assert.equal(all.destination, '/en/products/:path*');
  assert.equal(all.permanent, true);
  const idx = vercel.redirects.indexOf(all);
  for (const slug of products.map((p) => p.slug)) {
    assert.ok(vercel.redirects.indexOf(redirect('/products/' + slug)) < idx, 'explicit ' + slug + ' redirect must precede the catch-all');
  }
});

test('every product route the build emits exists in all three locales (no locale-less orphan)', () => {
  for (const prod of products) {
    const record = legacy.find((x) => x.path === '/products/' + prod.slug);
    assert.ok(record, 'no page record for ' + prod.slug);
    for (const l of locales) assert.ok(record.title?.[l] && record.body?.[l], prod.slug + ' lacks ' + l);
  }
});

test('built output never publishes a bare /products URL', () => {
  const sitemap = 'dist/sitemap.xml';
  if (!fs.existsSync(sitemap)) {
    assert.ok(true, 'build output not present; source checks already ran');
    return;
  }
  const xml = fs.readFileSync(sitemap, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.some((u) => u === 'https://www.cnps.ai/en/products/ticnote'));
  const bare = locs.filter((u) => !/^https:\/\/www\.cnps\.ai\/(en|zh|ar)(\/|$)/.test(u));
  assert.deepEqual(bare, [], 'sitemap contains locale-less URLs');
  for (const l of locales) {
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)));
    for (const file of walk(path.join('dist', l)).filter((f) => f.endsWith('.html'))) {
      const html = fs.readFileSync(file, 'utf8');
      assert.doesNotMatch(html, /href="\/products(\/|")/, file + ' links to a bare /products path');
      assert.doesNotMatch(html, /href="https:\/\/www\.cnps\.ai\/products/, file + ' links to an absolute bare /products URL');
    }
    assert.doesNotMatch(fs.readFileSync(path.join('dist', l, 'blogs/feed.xml'), 'utf8'), /cnps\.ai\/products/);
  }
  // The static fallback stub for the bare path also points at the /en page.
  const stub = fs.readFileSync('dist/products/ticnote.html', 'utf8');
  assert.match(stub, /url=\/en\/products\/ticnote"/);
  assert.match(stub, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\/products\/ticnote">/);
});
