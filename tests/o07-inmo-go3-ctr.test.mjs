import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'inmo-go3';
const title = 'INMO GO3 AI Smart Glasses';
const description =
  'INMO GO3 AI smart glasses ($699): ≈58 g MicroLED translation glasses, per the INMO spec page—check the language list and one field task before you pilot.';
const inmoSpec = 'https://www.inmo.com/pages/inmo-go3-ai-glasses';
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
  assert.doesNotMatch(record.description.en, /53 g/);
  assert.match(record.description.en, /≈58 g/);
});

test('ZH and AR descriptions parallel EN meaning (INMO weight + pilot path)', () => {
  for (const l of ['zh', 'ar']) {
    assert.doesNotMatch(record.description[l], /53/);
    assert.match(record.description[l], /58 g/);
  }
});

test('guide uses INMO\'s ≈58 g with the official source, plus exact sister / quote anchors', () => {
  const g = record.guide.en;
  assert.match(g, /≈58 g/);
  assert.ok(g.includes(`](${inmoSpec})`), 'weight links to the INMO spec page');
  for (const l of ['en', 'zh', 'ar']) {
    assert.ok(record.body[l].includes(`](${inmoSpec})`), l + ' body links the INMO spec page');
    assert.doesNotMatch(record.body[l], /^- \*\*(Weight|重量|الوزن)\*\*[:：] 53/m);
    assert.doesNotMatch(record.guide[l], /(Shop and www list|商店与 www 标|يسرد المتجر وwww) 53/);
    assert.doesNotMatch(record.body[l], /\*\*(Weight note|重量说明|ملاحظة الوزن)\*\*/);
    assert.doesNotMatch(record.body[l], /earlier (version|53)|早前写的 53|نسخة سابقة.*53/);
    assert.doesNotMatch(record.guide[l], /earlier 53|早前写的 53|53 g الذي ظهر سابقاً/);
    const stripShop = (s) => s.replace(/https:\/\/shop\.cnps\.ai\/products\/[^\s)]+/g, '');
    assert.doesNotMatch(stripShop(record.body[l]), /53\s*g|53g/);
    assert.doesNotMatch(stripShop(record.guide[l]), /53\s*g|53g/);
  }
  assert.match(record.body.en, /≈58 g \(manufacturer claimed\)/);
  assert.match(record.body.zh, /约 58 g（厂商标称）/);
  assert.match(record.body.ar, /≈58 g \(حسب ادعاء الشركة المصنعة\)/);
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
  assert.match(html, /≈58 g/);
  assert.ok(html.includes(`href="${inmoSpec}"`), 'built page links the INMO spec page');
});
