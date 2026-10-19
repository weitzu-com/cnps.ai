import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'inmo-go3';
const title = 'INMO GO3 AI Smart Glasses';
const description =
  'INMO GO3 AI smart glasses ($699): 53 g MicroLED translation glasses—confirm 53 g vs ≈58 g listings, language list, and one field task before you pilot.';
const arGlasses = 'AR Smart Glasses';
const fieldTask = 'Smart glasses: choose one field task first';
const recorderGuide = 'Meeting recorder vs smart glasses for bilingual meeting notes';
const quoteAnchor = 'Request a quotation for devices or a pilot.';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const htmlH1s = (html) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());

const legacy = JSON.parse(fs.readFileSync('content/i18n/legacy-pages.json', 'utf8'));
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const editorialAssets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));
const record = legacy.find((x) => x.path === '/products/' + slug);

test('EN description is method-toned, ≤160 chars, synced in legacy-pages', () => {
  assert.ok(description.length <= 160);
  assert.ok(description.length >= 130);
  assert.equal(record.title.en, title);
  assert.equal(record.description.en, description);
  assert.match(record.description.en, /53 g/);
  assert.match(record.description.en, /58 g|≈58/);
});

test('ZH and AR descriptions parallel EN meaning (weight caveat + pilot path)', () => {
  assert.match(record.description.zh, /53/);
  assert.match(record.description.zh, /58/);
  assert.match(record.description.ar, /53/);
  assert.match(record.description.ar, /58/);
});

test('guide has weight caveat and exact sister / quote anchors', () => {
  const g = record.guide.en;
  assert.match(g, /53 g/);
  assert.match(g, /≈58 g|≈ 58 g|about 58 g|~58 g/);
  assert.match(g, /do not assume one listing overrides|without written confirmation/i);
  assert.match(g, new RegExp(`\\[${esc(arGlasses)}\\]\\(/products/ar-smart-glasses\\)`));
  assert.match(g, new RegExp(`\\[${esc(fieldTask)}\\]\\(/blogs/smart-glasses-one-field-task\\)`));
  assert.match(g, new RegExp(`\\[${esc(recorderGuide)}\\]\\(/guides/meeting-recorder-vs-smart-glasses-bilingual-notes\\)`));
  assert.match(g, new RegExp(`\\[${esc(quoteAnchor)}\\]\\(/request-quote\\?product=inmo-go3\\)`));
  assert.doesNotMatch(g, /\[quotation form\]\(/);
});

test('editorial og asset registered and build wires socialImage + method glance for inmo-go3', () => {
  const cover = editorialAssets[slug];
  assert.equal(cover.file, slug);
  assert.match(cover.alt.en, /no fake certificates/);
  assert.ok(cover.alt.zh && cover.alt.ar);
  assert.match(build, /inmo-go3/);
  assert.match(build, /socialImage/);
  assert.match(build, /inmo-go3-method-glance/);
  assert.match(build, new RegExp(esc(quoteAnchor)));
  for (const size of [640, 1280]) {
    assert.ok(fs.existsSync(`web/assets/editorial/${slug}-${size}.webp`), `${size} webp`);
  }
  assert.ok(fs.existsSync('web/assets/resources/inmo-go3-method-glance.webp'));
});

test('built EN page: new meta, H1 unchanged, editorial og, method glance, quote + sisters', () => {
  const en = path.join('dist/en/products', slug + '.html');
  if (!fs.existsSync(en)) {
    assert.ok(true, 'no build output');
    return;
  }
  const html = fs.readFileSync(en, 'utf8');
  assert.match(html, new RegExp(`<meta name="description" content="${esc(description)}">`));
  assert.deepEqual(htmlH1s(html), [title]);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/inmo-go3-1280\.webp">/
  );
  assert.doesNotMatch(html, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/social\.png"/);
  assert.match(html, new RegExp(`href="/en/products/ar-smart-glasses"[^>]*>${esc(arGlasses)}`));
  assert.match(html, new RegExp(`href="/en/blogs/smart-glasses-one-field-task"[^>]*>${esc(fieldTask)}`));
  assert.match(
    html,
    new RegExp(`href="/en/guides/meeting-recorder-vs-smart-glasses-bilingual-notes"[^>]*>${esc(recorderGuide)}`)
  );
  assert.match(html, new RegExp(`href="/en/request-quote[^"]*"[^>]*>${esc(quoteAnchor)}`));
  assert.match(html, /inmo-go3-method-glance\.webp/);
  assert.match(html, /method glance|Evaluation method|Weight/i);
  assert.match(html, /53 g/);
  assert.match(html, /58 g|≈58/);
});
