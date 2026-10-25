import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToRegexp} from 'path-to-regexp';

// TicNote Cloud plans hub at /en/products/ticnote-cloud (JEV freeze + 安灯 2026-10-25):
// EN-only comparison page; Inquire CTAs; no shop Buy to cloud handles; userguide list prices labelled.
const data = JSON.parse(fs.readFileSync('content/i18n/ticnote-cloud.json', 'utf8'));
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const buildSource = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const pageFile = 'dist/en/products/ticnote-cloud.html';
const html = fs.readFileSync(pageFile, 'utf8');
const main = html.match(/<main id="main">([\s\S]*?)<\/main>/)[1];
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const visible = (fragment) => decode(fragment.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const mainText = visible(main);
const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const firstRedirect = (path) => {
  for (const r of vercel.redirects || []) {
    try {
      if (pathToRegexp(r.source).test(path)) return r;
    } catch { /* ignore bad patterns */ }
  }
  return null;
};

test('EN cloud page with unique title and meta description ≤160 characters; zh/ar stay stubs', () => {
  assert.ok(fs.existsSync(pageFile));
  for (const l of ['zh', 'ar']) {
    const stub = `dist/${l}/products/ticnote-cloud.html`;
    assert.ok(!fs.existsSync(stub) || !/data-plan="pro"/.test(fs.readFileSync(stub, 'utf8')), l + ' must not be a full cloud page');
  }
  assert.ok(data.locales.includes('en') && data.locales.includes('ru') && data.locales.includes('kk'));
  assert.match(html, /<title>TicNote Cloud plans \| CNPS\.AI<\/title>/);
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)[1]);
  const enDesc = typeof data.description === 'string' ? data.description : data.description.en;
  assert.equal(description, enDesc);
  assert.ok([...description].length <= 160, 'description length ' + [...description].length);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\/products\/ticnote-cloud">/);
});

test('hreflang declares en/ru/kk and x-default (not zh/ar full pages)', () => {
  const head = html.slice(0, html.indexOf('</head>'));
  const alternates = [...head.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(alternates, [
    ['en', 'https://www.cnps.ai/en/products/ticnote-cloud'],
    ['ru', 'https://www.cnps.ai/ru/products/ticnote-cloud'],
    ['kk', 'https://www.cnps.ai/kk/products/ticnote-cloud'],
    ['x-default', 'https://www.cnps.ai/en/products/ticnote-cloud'],
  ]);
});

test('zh and ar product paths 307 to EN; bare /products/ticnote-cloud redirects to EN', () => {
  for (const loc of ['zh', 'ar']) {
    const r = firstRedirect(`/${loc}/products/ticnote-cloud`);
    assert.ok(r, loc + ' redirect missing');
    assert.equal(r.destination, '/en/products/ticnote-cloud');
    assert.equal(r.permanent, false);
  }
  const bare = firstRedirect('/products/ticnote-cloud');
  assert.ok(bare);
  assert.equal(bare.destination, '/en/products/ticnote-cloud');
});

test('comparison table covers Free / Standard / Pro / Business / Enterprise with userguide prices', () => {
  for (const id of ['free', 'standard', 'pro', 'business', 'enterprise']) {
    assert.match(main, new RegExp(`data-plan="${id}"`));
  }
  assert.match(mainText, /300 min/);
  assert.match(mainText, /600 min/);
  assert.match(mainText, /1,500/);
  assert.match(mainText, /6,000/);
  assert.match(mainText, /\$12\.99/);
  assert.match(mainText, /\$119/);
  assert.match(mainText, /\$29\.99/);
  assert.match(mainText, /\$299/);
  assert.match(mainText, /source=userguide/);
  assert.match(main, /userguide\.ticnote\.com\/subscription-plans/);
});

test('no Buy CTA to shop cloud handles; Inquire / contact / sales@cnps.ai instead', () => {
  assert.doesNotMatch(main, /shop\.cnps\.ai\/products\/ticnote-cloud-(?:pro|business)/i);
  assert.doesNotMatch(main, />(?:Buy|Shop)\b/);
  assert.doesNotMatch(mainText, /\bBuy on shop\b/i);
  assert.match(main, /href="\/en\/contact"/);
  assert.match(main, /mailto:sales@cnps\.ai/);
  assert.match(mainText, /checkout coming soon/i);
  assert.match(mainText, /CNPS\.AI shop subscription checkout coming soon/);
});

test('cross-links hardware Pro plan and product pages; no invented top-up prices', () => {
  assert.match(main, /href="\/en\/pro-plan"/);
  assert.match(main, /href="\/en\/products\/ticnote"/);
  assert.match(main, /href="\/en\/products\/ticnote-lite"/);
  assert.match(mainText, /Minutes \/ Shadow AI top-ups: inquire/i);
  assert.doesNotMatch(mainText, /top-?up.{0,40}\$\d/i);
});

test('JSON-LD is WebPage + ItemList without Product/Offer checkout', () => {
  const types = new Set();
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      if (v['@type']) types.add(v['@type']);
      Object.values(v).forEach(walk);
    }
  };
  jsonLd.forEach(walk);
  assert.ok(types.has('WebPage'));
  assert.ok(types.has('ItemList'));
  assert.ok(!types.has('Product'));
  assert.ok(!types.has('Offer'));
  assert.ok(!types.has('AggregateOffer'));
});

test('sitemap and llms.txt list cloud URLs; build wires the page through save()', () => {
  const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/en\/products\/ticnote-cloud/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/ru\/products\/ticnote-cloud/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/kk\/products\/ticnote-cloud/);
  assert.doesNotMatch(sitemap, /\/(?:zh|ar)\/products\/ticnote-cloud/);
  const llms = fs.readFileSync('dist/llms.txt', 'utf8');
  assert.ok(llms.split('\n').filter((line) => line.includes('/products/ticnote-cloud')).length >= 1);
  assert.match(buildSource, /ticnoteCloud/);
  assert.match(buildSource, /content\/i18n\/ticnote-cloud\.json/);
});

test('products hub card links to the EN cloud page; pro-plan body cross-links', () => {
  const productsHtml = fs.readFileSync('dist/en/products.html', 'utf8');
  assert.match(productsHtml, /href="\/en\/products\/ticnote-cloud"/);
  assert.match(productsHtml, /TicNote Cloud/);
  const proPlan = fs.readFileSync('dist/en/pro-plan.html', 'utf8');
  assert.match(proPlan, /href="\/en\/products\/ticnote-cloud"/);
  const legacy = JSON.parse(fs.readFileSync('content/i18n/legacy-pages.json', 'utf8'));
  const pp = legacy.find((x) => x.path === '/pro-plan');
  for (const loc of ['en', 'zh', 'ar']) assert.match(pp.body[loc], /ticnote-cloud/);
});

test('no testimonials or guarantee metrics on the cloud page', () => {
  assert.doesNotMatch(mainText, /testimonial|guarantee|trusted by|rated|stars/i);
});
