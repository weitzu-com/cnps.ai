import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Neutral buying guide at /en/guides/translation-glasses. Every comparison-table cell carries a manufacturer source URL
// (checked 2026-10-19); figures a manufacturer does not publish read "Unknown". The guide links to /en/products/inmo-go3
// rather than competing with it for the brand query, and discloses that CNPS.AI sells INMO.
const slug = 'translation-glasses';
const source = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((g) => g.slug === slug);
const pages = JSON.parse(fs.readFileSync('content/i18n/legacy-pages.json', 'utf8'));
const inmo = pages.find((x) => x.path === '/products/inmo-go3');
const officialHosts = ['www.inmoxr.com', 'www.evenrealities.com', 'support.evenrealities.com', 'www.meta.com', 'solosglasses.com'];
const section = (heading) => source.split('\n## ' + heading)[1].split('\n## ')[0];
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

test('translation glasses guide metadata: title and H1 lead with the query, own meta under 160 chars, no brand query', () => {
  assert.ok(meta, 'guides.json entry');
  assert.deepEqual(meta.locales, ['en']);
  assert.equal(meta.faqSchema, true);
  assert.match(meta.title.en, /^Translation glasses/);
  assert.match(meta.h1.en, /^Translation glasses/);
  assert.match(source, new RegExp('^# ' + meta.h1.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'm'));
  assert.ok(meta.description.en.length <= 160, 'meta description length ' + meta.description.en.length);
  assert.notEqual(meta.description.en, inmo.description.en);
  for (const field of [meta.title.en, meta.h1.en, meta.description.en]) assert.doesNotMatch(field, /inmo|go ?3/i, 'guide metadata must not target the INMO GO3 brand query: ' + field);
});

test('guide body covers the query family naturally and stays neutral', () => {
  for (const phrase of ['translator glasses', 'translating glasses', 'glasses that translate languages', 'ai translation glasses', 'best translation glasses']) {
    const count = (source.toLowerCase().match(new RegExp(phrase, 'g')) || []).length;
    assert.ok(count >= 1 && count <= 3, phrase + ' appears ' + count + ' times');
  }
  assert.match(source, /\*\*Disclosure:\*\* CNPS\.AI sells INMO GO3/);
  assert.match(source, /\[INMO GO3\]\(\/products\/inmo-go3\)/);
  assert.doesNotMatch(source, /\b(worst|terrible|inferior|overpriced|#1)\b/i);
  const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
  assert.ok(words.length >= 1200, 'word count ' + words.length);
});

test('comparison table: four products, six columns, every cell sourced from a manufacturer page', () => {
  const table = section('Comparison table (checked 19 October 2026)');
  const rows = table.split('\n').filter((line) => line.startsWith('|'));
  assert.equal(rows[0], '| Product | Languages supported | Offline or online | How translation is shown | Battery life | Weight | Price (USD, checked 2026-10-19) |');
  const body = rows.slice(2);
  assert.equal(body.length, 4);
  const names = ['INMO GO3', 'Even Realities Even G1', 'Ray-Ban Meta (Gen 3)', 'solos AirGo V2 (Prime 2)'];
  body.forEach((row, i) => {
    const cells = row.split(' | ').map((c) => c.replace(/^\| ?| ?\|$/g, ''));
    assert.equal(cells.length, 7, 'cell count in row ' + i);
    assert.ok(cells[0].includes(names[i]), 'row ' + i + ' is ' + names[i]);
    for (const cell of cells.slice(1)) {
      const urls = [...cell.matchAll(/\((https:\/\/[^)\s]+)\)/g)].map((m) => new URL(m[1]));
      assert.ok(urls.length >= 1, 'cell has no source URL: ' + cell);
      for (const u of urls) assert.ok(officialHosts.includes(u.host), 'non-manufacturer source ' + u.href);
    }
  });
  // Figures the manufacturers do not publish are marked Unknown, never estimated.
  assert.match(body[1], /\| Unknown \(\[source checked\]\(https:\/\/www\.evenrealities\.com\/g1\)\) \|/);
  assert.match(body[3], /\| Unknown \(\[source checked\]\(https:\/\/solosglasses\.com\/pages\/general-frequently-asked-questions\)\) \|/);
  assert.match(body[3], /\| Unknown \(\[source checked\]\(https:\/\/solosglasses\.com\/products\/prime-2-smartglasses-solos-airgo%E2%84%A2-v2\)\) \|/);
  assert.match(body[0], /\$699\.00 regular, \$509\.00 sale price/);
  assert.match(body[2], /\$449 \(Wayfarer\)/);
  assert.match(table, /US dollars \(USD\)/);
});

test('FAQ answers cite their source and the INMO GO3 product page links back to the guide', () => {
  const faq = section('Common questions');
  assert.ok((faq.match(/^### /gm) || []).length >= 3);
  assert.match(faq, /Meta Help Center/);
  assert.match(faq, /Even Support Center/);
  assert.match(inmo.guide.en, /\[translation glasses buying guide\]\(\/guides\/translation-glasses\)/);
  assert.match(inmo.guide.zh, /\(\/en\/guides\/translation-glasses\)/);
  assert.match(inmo.guide.ar, /\(\/en\/guides\/translation-glasses\)/);
});

test('built guide: H1, canonical, FAQPage JSON-LD, sitemap entry, zh/ar redirect to English', () => {
  const htmlPath = path.join('dist/en/guides', slug + '.html');
  if (!fs.existsSync(htmlPath) || !fs.existsSync('dist/sitemap.xml')) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, new RegExp('<title>' + meta.title.en + ' \\| CNPS\\.AI</title>'));
  assert.match(html, /<h1 class="wide">Translation glasses: how to choose, with a sourced comparison<\/h1>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\/guides\/translation-glasses">/);
  assert.match(html, /href="\/en\/products\/inmo-go3"/);
  assert.match(html, /href="\/en\/request-quote\?product=inmo-go3"/);
  assert.match(html, /<div class="table-scroll" tabindex="0"><table>/);
  const ld = jsonLd(html);
  const faq = ld.find((x) => x['@type'] === 'FAQPage');
  assert.ok(faq, 'FAQPage JSON-LD');
  assert.ok(faq.mainEntity.length >= 3);
  for (const q of faq.mainEntity) assert.ok(q.name && q.acceptedAnswer.text.length > 40);
  assert.ok(ld.some((x) => x['@type'] === 'Article'));
  const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
  assert.match(sitemap, /<loc>https:\/\/www\.cnps\.ai\/en\/guides\/translation-glasses<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/www\.cnps\.ai\/(zh|ar)\/guides\/translation-glasses<\/loc>/);
  for (const l of ['zh', 'ar']) assert.match(fs.readFileSync(path.join('dist', l, 'guides', slug + '.html'), 'utf8'), /url=\/en\/guides\/translation-glasses/);
  assert.match(fs.readFileSync('dist/en/guides.html', 'utf8'), /href="\/en\/guides\/translation-glasses"/);
  assert.match(fs.readFileSync('dist/en/products/inmo-go3.html', 'utf8'), /href="\/en\/guides\/translation-glasses"/);
});
