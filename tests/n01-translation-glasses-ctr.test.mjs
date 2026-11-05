import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'translation-glasses';
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((x) => x.slug === slug);
const en = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));

const META_EN =
  'Translation glasses method: language pair, offline, captions vs audio, battery for a shift, reply channel. Sourced comparison as of 5 Nov 2026.';

const SHOP =
  'https://shop.cnps.ai/products/inmo-go3-ai-smart-glasses-53g-microled-ar-glasses-with-ai-translator-hot-swap-battery-camera';
const SHOP_H1 =
  'INMO GO3 AI Smart Glasses | ≈58g MicroLED AR Glasses with AI Translator, Hot-Swap Battery & Camera';

const CNPS_LINKS = [
  [SHOP, SHOP_H1],
  ['/blogs/smart-glasses-one-field-task', 'Smart glasses: choose one field task first'],
  ['/products/inmo-go3', 'INMO GO3 AI Smart Glasses'],
  ['/request-quote?product=inmo-go3', 'Request a quotation for devices or a pilot.'],
  [
    '/guides/meeting-recorder-vs-smart-glasses-bilingual-notes',
    'Meeting recorder vs smart glasses for bilingual meeting notes',
  ],
];

function mdHrefs(src) {
  return [...src.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
    .map((m) => [m[2], m[1]])
    .filter(
      ([href]) =>
        !href.startsWith('/assets/') &&
        !/\.(webp|png|jpe?g|svg)$/i.test(href) &&
        !/^mailto:/i.test(href),
    );
}

function cnpsHrefs(src) {
  return mdHrefs(src).filter(
    ([href]) => href.startsWith('/') || /cnps\.ai/i.test(href),
  );
}

test('N01 meta dated and ≤160; H1/title/slug/locales unchanged (EN-only)', () => {
  assert.ok(meta);
  assert.deepEqual(meta.locales, ['en']);
  assert.equal(meta.h1.en, 'Translation glasses: how to choose, with a sourced comparison');
  assert.equal(meta.title.en, 'Translation glasses: a neutral buying guide and comparison');
  assert.equal(meta.description.en, META_EN);
  assert.ok(META_EN.length <= 160);
  assert.match(en, /^# Translation glasses: how to choose, with a sourced comparison/m);
});

test('N01 every CNPS body anchor = live H1 and each CNPS href once', () => {
  const pairs = cnpsHrefs(en);
  assert.deepEqual(pairs, CNPS_LINKS);
  assert.equal(new Set(pairs.map((x) => x[0])).size, pairs.length);
  assert.doesNotMatch(en, /\/products\/compare/);
  assert.doesNotMatch(en, /\/contact/);
  assert.doesNotMatch(en, /\/wholesale/);
});

test('N01 method glance + editorial assets on disk; build wires og', () => {
  assert.match(en, /## Translation glasses method glance/);
  assert.match(en, /translation-glasses-method-glance\.webp/);
  assert.ok(
    build.includes("editorial.socialImage('translation-glasses')") ||
      build.includes('editorial.socialImage("translation-glasses")'),
    'guide socialImage must be wired in build-trilingual.mjs',
  );
  assert.ok(assets['translation-glasses']);
  for (const f of [
    'web/assets/editorial/translation-glasses-1280.webp',
    'web/assets/editorial/translation-glasses-640.webp',
    'web/assets/resources/translation-glasses-method-glance.webp',
  ]) {
    assert.ok(fs.existsSync(f), f);
    assert.ok(fs.statSync(f).size > 1000, f + ' too small');
  }
});

test('N01 glance facts already appear in the EN body (no invented specs)', () => {
  for (const s of [
    'Language pair',
    'Offline',
    'Caption vs audio',
    'Battery shift',
    'Reply channel',
    'checked each figure on 19 October 2026',
    'method was reviewed on 5 November 2026',
    'Disclosure',
  ]) {
    assert.match(en, new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.doesNotMatch(en, /duty rate of \d|accuracy of \d|inquiry count|GSC|0\/37/i);
});

test('N01 existing section titles preserved; method glance is first new H2', () => {
  const h2s = [...en.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.equal(h2s[0], 'Translation glasses method glance');
  for (const heading of [
    'What translating glasses actually do',
    'Comparison table (checked 19 October 2026)',
    'How to read the table',
    'Best translation glasses depends on the job',
    'A one-week test before you commit',
    'Common questions',
    'Sources',
    'Next step',
  ]) {
    assert.ok(h2s.includes(heading), heading);
  }
});

test('N01 no ar/zh body invented; locales stay en', () => {
  assert.deepEqual(meta.locales, ['en']);
  assert.equal(fs.existsSync(path.join('content/i18n/guides/ar', slug + '.md')), false);
  assert.equal(fs.existsSync(path.join('content/i18n/guides/zh', slug + '.md')), false);
});
