import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// GSC + competitor gap analysis of 2026-10-18. Three pages: /en/products/inmo-go3 ("inmo go 3", "smart glasses with display",
// "translation glasses"), /en/blogs/ticnote-card-vs-lite-vs-pods ("ticnote card", pos 5.2 with 0 clicks) and /en/products/ticnote
// ("mobvoi ticnote", "voice recorder with transcription"). The bare /products/inmo-go3 URL was still indexed as its own canonical
// while the /en page sat in "Discovered – currently not indexed", so the redirect, sitemap, canonical and hreflang rules are pinned here.
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const pages = JSON.parse(fs.readFileSync('content/i18n/legacy-pages.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('content/i18n/product-assets.json', 'utf8'));
const journal = JSON.parse(fs.readFileSync('content/i18n/blogs.json', 'utf8'));
const locales = ['en', 'zh', 'ar'];
const root = 'https://www.cnps.ai';
const page = (p) => pages.find((x) => x.path === p);
const inmo = page('/products/inmo-go3');
const ticnote = page('/products/ticnote');
const post = journal.posts.find((p) => p.slug === 'ticnote-card-vs-lite-vs-pods');
const redirects = vercel.redirects;
const redirect = (source) => redirects.find((r) => r.source === source);
const sources = new Set(redirects.map((r) => r.source));
const built = fs.existsSync('dist/sitemap.xml');
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('bare /products/inmo-go3 and its shop-handle variant reach /en/products/inmo-go3 in one permanent hop', () => {
  const shopHandle = products.find((p) => p.slug === 'inmo-go3').shop.replace('https://shop.cnps.ai/products/', '');
  const catchAll = redirect('/products/:path*');
  assert.ok(catchAll && catchAll.permanent && catchAll.destination === '/en/products/:path*', 'the PR #25 catch-all must stay in place');
  for (const source of ['/products/inmo-go3', '/products/' + shopHandle]) {
    const r = redirect(source);
    assert.ok(r, 'missing explicit redirect for ' + source);
    assert.equal(r.destination, '/en/products/inmo-go3');
    assert.equal(r.permanent, true, source + ' must be permanent (308)');
    assert.ok(!sources.has(r.destination), source + ' chains into another redirect');
    assert.ok(redirects.indexOf(r) < redirects.indexOf(catchAll), source + ' must precede the catch-all');
  }
  // No redirect may take a localized product page anywhere else.
  for (const l of locales) assert.ok(!sources.has(`/${l}/products/inmo-go3`), `/${l}/products/inmo-go3 must not be a redirect source`);
  assert.equal(vercel.trailingSlash, false, 'trailing-slash variants normalize to the clean URL');
});

test('INMO GO3 title, meta and new H2 sections target the display and translation queries with listing facts only', () => {
  assert.equal(inmo.seoTitle.en, 'INMO GO3 AI Smart Glasses – MicroLED Display, Translator, Price');
  assert.match(inmo.description.en, /\(\$699\)/);
  assert.match(inmo.description.en, /translation glasses/);
  assert.match(inmo.guide.en, /^## Smart glasses with display$/m);
  assert.match(inmo.guide.en, /^## Translation glasses$/m);
  assert.match(inmo.guide.zh, /^## 带显示屏的智能眼镜$/m);
  assert.match(inmo.guide.zh, /^## 翻译眼镜$/m);
  assert.match(inmo.guide.ar, /^## نظارات ذكية بشاشة عرض$/m);
  assert.match(inmo.guide.ar, /^## نظارات الترجمة$/m);
  // The two sections reuse only figures the shop listing publishes (body "From the shop listing").
  const section = inmo.guide.en.split('## Smart glasses with display')[1].split('## How it differs')[0];
  const facts = { '640 × 480': '640 × 480', '1500 nits': '1500 nits', '30° field of view': '30°', '≈58 g': '≈58 g', '78 source': '78 source', '98+ target': '98+ target', '9 languages': '9 languages', 'Bluetooth 5.4': 'Bluetooth 5.4', '2.4G Wi-Fi': 'Wi-Fi 2.4G' };
  for (const [phrase, listing] of Object.entries(facts)) {
    assert.ok(section.includes(phrase), 'section should carry listing fact ' + phrase);
    assert.ok(inmo.body.en.includes(listing), 'fact must come from the listing: ' + listing);
  }
  assert.doesNotMatch(section, /\d+\s*(hours|h)\b\s*(of )?(battery|use)/i, 'no battery hours: the listing publishes capacities only');
  assert.deepEqual(inmo.schema, { brand: 'INMO', sku: 'IMG301', mpn: 'IMG301', offers: { price: '699.00', priceCurrency: 'USD' } });
});

test('TicNote card page names Mobvoi in title and hero, adds the transcription section and a verifiable Plaud table', () => {
  assert.equal(ticnote.seoTitle.en, 'Mobvoi TicNote AI Voice Recorder with Transcription – Specs & Price');
  assert.match(ticnote.body.en.split('\n\n')[1], /^The Mobvoi TicNote card/, 'the first paragraph under the H1 names Mobvoi TicNote');
  assert.match(ticnote.guide.en, /^## Voice recorder with transcription$/m);
  assert.match(ticnote.guide.en, /^## TicNote vs Plaud NotePin and Plaud Note$/m);
  const table = ticnote.guide.en.split('## TicNote vs Plaud NotePin and Plaud Note')[1].split('## What to verify')[0];
  // Plaud cells are limited to figures read from plaud.ai product pages on 2026-10-18; TicNote cells to the shop listing figures.
  assert.match(table, /\| Listed price \(USD\) \| From \$139\.99 \(was \$179\.99\); \$189\.99–\$199\.99 with 1-Year Pro Plan \| \$159\.00 regular price \| \$159\.00 regular price \|/);
  assert.match(table, /\| Storage \| 64GB \(about 434 hours\) \| 64 GB \| 64 GB \|/);
  assert.match(table, /\| Transcription languages \| 120\+ \| 112 \| 112 \|/);
  assert.match(table, /\| Weight \| Not published \| 0\.59 oz \(about 17 g\) \| 1\.06 oz \(about 30 g\) \|/);
  assert.match(table, /300 on the free Starter plan; 1,200 on Pro/);
  assert.match(table, /plaud\.ai product pages on 18 October 2026/);
  const rows = table.split('\n').filter((line) => line.startsWith('|'));
  assert.ok(rows.length >= 9, 'comparison table should have a header and at least seven rows');
  for (const row of rows) assert.doesNotMatch(row, /battery|accuracy|%/i, 'no battery or accuracy claims in the comparison rows: ' + row);
  for (const l of ['zh', 'ar']) assert.match(ticnote.guide[l], /Plaud NotePin/);
  assert.deepEqual(ticnote.schema, { brand: 'TicNote', manufacturer: 'Mobvoi', offers: { lowPrice: '139.99', highPrice: '199.99', priceCurrency: 'USD', offerCount: 6 } });
  // The low/high prices must be the ones the "Listed variants" table already shows.
  assert.match(ticnote.body.en, /\| \$139\.99 \|/);
  assert.match(ticnote.body.en, /\| \$199\.99 \|/);
});

test('TicNote card vs Lite vs Pods: 2026 title, verdict meta, direct definition first and a 3–5 question FAQ in every locale', () => {
  assert.equal(post.locales.en.title, 'TicNote Card vs Lite vs Pods (2026): Which AI Recorder to Buy');
  assert.match(post.locales.en.description, /Verdict:/);
  assert.match(post.locales.en.description, /\$139\.99/);
  assert.match(post.locales.en.description, /\$99\.99/);
  assert.match(post.locales.en.body, /^TicNote Card is the card-sized TicNote AI Voice Recorder/);
  assert.match(post.locales.zh.title, /2026/);
  assert.match(post.locales.ar.title, /2026/);
  assert.match(post.locales.zh.description, /结论/);
  assert.match(post.locales.ar.description, /الخلاصة/);
  for (const l of locales) {
    const v = post.locales[l];
    assert.ok(v.title.length <= 70, l + ' title length ' + v.title.length);
    assert.ok(v.description.length <= 170, l + ' meta length ' + v.description.length);
    assert.ok(Array.isArray(v.faq) && v.faq.length >= 3 && v.faq.length <= 5, l + ' FAQ should carry 3–5 questions');
    for (const q of v.faq) {
      assert.ok(q.question.trim() && q.answer.trim(), l + ' empty FAQ entry');
      assert.doesNotMatch(q.answer, /\d+\s*(hours|小时|ساعة|ساعات)\s*(of )?(battery|电池|续航|بطارية)/i, l + ' FAQ states battery hours');
      assert.doesNotMatch(q.question + q.answer, /mobvoi/i);
    }
  }
  // Each FAQ answer rests on a fact the article body already states.
  const en = post.locales.en;
  assert.match(en.body, /64GB \(about 434 hours\)/);
  assert.match(en.body, /without Wi-Fi/);
  assert.match(en.body, /600 minutes per month/);
  assert.match(en.body, /30 days only while unused and unactivated/);
});

test('titles and metas stay unique across the three pages and their siblings', () => {
  const titles = new Set(), metas = new Set();
  for (const l of locales) {
    for (const p of products) { titles.add(page('/products/' + p.slug).seoTitle[l]); metas.add(page('/products/' + p.slug).description[l]); }
    for (const p of journal.posts) { titles.add(p.locales[l].title); metas.add(p.locales[l].description); }
  }
  const expected = (products.length + journal.posts.length) * locales.length;
  assert.equal(titles.size, expected, 'title collision');
  assert.equal(metas.size, expected, 'meta collision');
});

test('built output: sitemap lists only locale-prefixed URLs with reciprocal hreflang, pages self-canonicalize, schema is present', { skip: !built && 'build output not present' }, () => {
  const xml = fs.readFileSync('dist/sitemap.xml', 'utf8');
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  const locs = entries.map((e) => e.match(/<loc>([^<]+)<\/loc>/)[1]);
  assert.deepEqual(locs.filter((u) => !/^https:\/\/www\.cnps\.ai\/(en|zh|ar|ru|kk)(\/|$)/.test(u)), [], 'sitemap contains locale-less URLs');
  assert.ok(!locs.includes(root + '/products/inmo-go3'), 'bare /products/inmo-go3 must not be in the sitemap');
  // Beachhead (ru/kk) adds product hreflang; blogs stay parity-only (en/zh/ar).
  const routeLocales = {
    '/products/inmo-go3': ['en', 'zh', 'ar', 'ru', 'kk'],
    '/products/ticnote': ['en', 'zh', 'ar', 'ru', 'kk'],
    '/blogs/ticnote-card-vs-lite-vs-pods': ['en', 'zh', 'ar'],
  };
  const hreflangTags = { en: 'en', zh: 'zh-CN', ar: 'ar', ru: 'ru', kk: 'kk' };
  for (const [route, routeLocs] of Object.entries(routeLocales)) {
    const wanted = routeLocs.map((l) => `${root}/${l}${route}`);
    const expectedTags = [...routeLocs.map((l) => hreflangTags[l]), 'x-default'].sort();
    for (const l of locales) {
      const loc = `${root}/${l}${route}`;
      const entry = entries.find((e) => e.includes(`<loc>${loc}</loc>`));
      assert.ok(entry, 'sitemap entry missing for ' + loc);
      const alternates = [...entry.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]);
      assert.deepEqual(alternates.map((a) => a[0]).sort(), expectedTags);
      assert.deepEqual(alternates.filter((a) => a[0] !== 'x-default').map((a) => a[1]).sort(), [...wanted].sort(), loc + ' hreflang set differs');
      assert.equal(alternates.find((a) => a[0] === 'x-default')[1], `${root}/en${route}`);

      const html = fs.readFileSync(path.join('dist', l, route + '.html'), 'utf8');
      assert.match(html, new RegExp(`<link rel="canonical" href="${escapeRe(loc)}">`), loc + ' canonical must be self-referencing');
      const links = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]);
      assert.deepEqual(links.map((a) => a[0]).sort(), expectedTags, loc + ' head hreflang set');
      assert.deepEqual(links.filter((a) => a[0] !== 'x-default').map((a) => a[1]).sort(), [...wanted].sort(), loc + ' head hreflang targets');
      assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/);
    }
  }

  const go3 = fs.readFileSync('dist/en/products/inmo-go3.html', 'utf8');
  assert.match(go3, /<title>INMO GO3 AI Smart Glasses – MicroLED Display, Translator, Price \| CNPS\.AI<\/title>/);
  assert.match(go3, /<h2 id="section-\d+">Smart glasses with display<\/h2>/);
  assert.match(go3, /<h2 id="section-\d+">Translation glasses<\/h2>/);
  const go3Product = jsonLd(go3).find((x) => x['@type'] === 'Product');
  assert.ok(go3Product, 'INMO GO3 Product JSON-LD');
  assert.equal(go3Product.name, 'INMO GO3 AI Smart Glasses');
  assert.equal(go3Product.url, root + '/en/products/inmo-go3');
  assert.equal(go3Product.brand.name, 'INMO');
  assert.equal(go3Product.sku, 'IMG301');
  assert.deepEqual([go3Product.offers['@type'], go3Product.offers.price, go3Product.offers.priceCurrency], ['Offer', '699.00', 'USD']);
  assert.match(go3Product.offers.url, /^https:\/\/shop\.cnps\.ai\/products\//);
  assert.ok(Array.isArray(go3Product.image) && go3Product.image.every((u) => u.startsWith(root + '/assets/products/inmo-go3')));
  assert.ok(jsonLd(go3).some((x) => x['@type'] === 'FAQPage'), 'existing FAQPage must stay');

  const tic = fs.readFileSync('dist/en/products/ticnote.html', 'utf8');
  assert.match(tic, /<title>Mobvoi TicNote AI Voice Recorder with Transcription – Specs &amp; Price \| CNPS\.AI<\/title>/);
  assert.match(tic, /<h1>TicNote AI Voice Recorder<\/h1><div class="prose"><p>The Mobvoi TicNote card/);
  assert.match(tic, /<h2 id="section-\d+">Voice recorder with transcription<\/h2>/);
  assert.match(tic, /<h2 id="section-\d+">TicNote vs Plaud NotePin and Plaud Note<\/h2>/);
  const ticBlocks = jsonLd(tic);
  const ticProduct = ticBlocks.find((x) => x['@type'] === 'Product');
  assert.ok(ticProduct, 'TicNote Product JSON-LD');
  assert.equal(ticProduct.brand.name, 'TicNote');
  assert.equal(ticProduct.manufacturer.name, 'Mobvoi');
  assert.deepEqual([ticProduct.offers['@type'], ticProduct.offers.lowPrice, ticProduct.offers.highPrice, ticProduct.offers.priceCurrency, ticProduct.offers.offerCount], ['AggregateOffer', '139.99', '199.99', 'USD', 6]);
  assert.ok(ticBlocks.find((x) => x['@type'] === 'FAQPage')?.mainEntity.length >= 5, 'existing TicNote FAQPage must stay intact');
  assert.ok(ticBlocks.find((x) => x['@type'] === 'WebPage'), 'WebPage schema must stay');

  for (const l of locales) {
    const html = fs.readFileSync(path.join('dist', l, 'blogs', 'ticnote-card-vs-lite-vs-pods.html'), 'utf8');
    const blocks = jsonLd(html);
    const faq = blocks.find((x) => x['@type'] === 'FAQPage');
    assert.ok(faq, l + ' blog FAQPage');
    assert.equal(faq.mainEntity.length, post.locales[l].faq.length);
    for (const q of post.locales[l].faq) {
      assert.ok(faq.mainEntity.some((x) => x.name === q.question && x.acceptedAnswer.text === q.answer), l + ' FAQ entry missing from schema: ' + q.question);
      const visible = q.question.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      assert.ok(html.includes(`">${visible}</h3>`), l + ' FAQ question must be visible on the page: ' + q.question);
    }
    assert.ok(blocks.find((x) => x['@type'] === 'BlogPosting'), l + ' BlogPosting schema must stay');
    assert.match(html, new RegExp(`<title>${escapeRe(post.locales[l].title)} \\| CNPS\\.AI</title>`));
  }

  // Internal links: EN home and the products listing both point at the /en INMO GO3 page.
  assert.match(fs.readFileSync('dist/en.html', 'utf8'), /href="\/en\/products\/inmo-go3"/);
  assert.match(fs.readFileSync('dist/en/products.html', 'utf8'), /href="\/en\/products\/inmo-go3"/);
  // The static stub for the bare path only exists as a meta-refresh fallback behind the Vercel 308 and canonicalizes to /en.
  const stub = fs.readFileSync('dist/products/inmo-go3.html', 'utf8');
  assert.match(stub, /url=\/en\/products\/inmo-go3"/);
  assert.match(stub, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\/products\/inmo-go3">/);
});
