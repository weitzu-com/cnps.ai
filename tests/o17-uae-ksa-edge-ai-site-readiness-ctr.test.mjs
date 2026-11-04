import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'uae-ksa-edge-ai-site-readiness';
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((x) => x.slug === slug);
const en = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const ar = fs.readFileSync(path.join('content/i18n/guides/ar', slug + '.md'), 'utf8');
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));

const META = {
  en: 'UAE/KSA edge site method: lighting/FOV, network, power, latency budget, exception review on the real site before you pick a box. As of 4 Nov 2026.',
  ar: 'منهج جاهزية موقع طرفي إمارات/سعودية (حتى 4 نوفمبر 2026): إضاءة/FOV، شبكة، طاقة، ميزانية كمون، مراجعة استثناءات على الموقع الفعلي قبل اختيار الصندوق.',
};

const EN_LINKS = [
  ['/resources/edge-ai-survey', 'The edge AI site survey'],
  ['/privacy', 'Privacy policy'],
  ['/blogs/edge-ai-start-with-the-site', 'Edge AI starts with the site, not the box'],
  ['/solutions/edge-vision', 'Edge AI for a defined camera task'],
  ['/wholesale', 'Ask about wholesale'],
  ['/request-quote?solution=edge-vision', 'Request a quotation for devices or a pilot.'],
];

const AR_LINKS = [
  ['/resources/edge-ai-survey', 'استبيان موقع الذكاء الاصطناعي الطرفي'],
  ['/privacy', 'سياسة الخصوصية'],
  ['/blogs/edge-ai-start-with-the-site', 'الذكاء الاصطناعي الطرفي يبدأ بالموقع'],
  ['/solutions/edge-vision', 'ذكاء اصطناعي طرفي لمهمة كاميرا محددة'],
  ['/wholesale', 'استفسر عن البيع بالجملة'],
  ['/request-quote?solution=edge-vision', 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.'],
];

function mdHrefs(src) {
  return [...src.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
    .map((m) => [m[2], m[1]])
    .filter(([href]) => !href.startsWith('/assets/') && !/\.(webp|png|jpe?g|svg)$/i.test(href) && !/^mailto:/i.test(href));
}

test('O17 meta dated and ≤160; H1/title/slug/locales unchanged', () => {
  assert.ok(meta);
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.h1.en, 'UAE/KSA edge AI site readiness before you pick a box');
  assert.equal(meta.h1.ar, 'جاهزية موقع الذكاء الاصطناعي الطرفي في الإمارات/السعودية قبل اختيار الصندوق');
  assert.equal(meta.title.en, 'UAE/KSA edge AI site readiness before you pick a box');
  assert.equal(meta.description.en, META.en);
  assert.equal(meta.description.ar, META.ar);
  assert.ok(META.en.length <= 160 && META.ar.length <= 160);
  assert.match(en, /^# UAE\/KSA edge AI site readiness before you pick a box/m);
  assert.match(ar, /^# جاهزية موقع الذكاء الاصطناعي الطرفي في الإمارات\/السعودية قبل اختيار الصندوق/m);
});

test('O17 every EN/AR body internal anchor = live H1 and each href once', () => {
  assert.deepEqual(mdHrefs(en), EN_LINKS);
  assert.deepEqual(mdHrefs(ar), AR_LINKS);
  for (const pairs of [EN_LINKS, AR_LINKS]) {
    assert.equal(new Set(pairs.map((x) => x[0])).size, pairs.length);
  }
  assert.doesNotMatch(en, /\/contact/);
  assert.doesNotMatch(ar, /\/contact/);
});

test('O17 method glance + editorial assets on disk; build wires og', () => {
  assert.match(en, /## UAE\/KSA edge site method glance/);
  assert.match(ar, /## لمحة طريقة جاهزية موقع الإمارات\/السعودية الطرفي/);
  assert.match(en, /uae-ksa-edge-ai-site-readiness-method-glance\.webp/);
  assert.match(ar, /uae-ksa-edge-ai-site-readiness-method-glance\.webp/);
  assert.ok(
    build.includes("editorial.socialImage('uae-ksa-edge-ai-site-readiness')") ||
      build.includes('editorial.socialImage("uae-ksa-edge-ai-site-readiness")'),
    'guide socialImage must be wired in build-trilingual.mjs',
  );
  assert.ok(assets['uae-ksa-edge-ai-site-readiness']);
  for (const f of [
    'web/assets/editorial/uae-ksa-edge-ai-site-readiness-1280.webp',
    'web/assets/editorial/uae-ksa-edge-ai-site-readiness-640.webp',
    'web/assets/resources/uae-ksa-edge-ai-site-readiness-method-glance.webp',
  ]) {
    assert.ok(fs.existsSync(f), f);
    assert.ok(fs.statSync(f).size > 1000, f + ' too small');
  }
});

test('O17 glance facts already appear in the EN body (no invented specs)', () => {
  for (const s of [
    'Lighting / FOV',
    'Latency budget',
    'Exception review',
    'will not invent a latency number',
    'not a PDPL opinion',
  ]) {
    assert.match(en, new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.doesNotMatch(en, /duty rate of \d|lead time of \d|accuracy of \d|inquiry count|latency of \d/i);
});

test('O17 existing section titles preserved; method glance is first new H2', () => {
  const h2s = [...en.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.equal(h2s[0], 'UAE/KSA edge site method glance');
  for (const heading of [
    'Why the site beats the model brochure',
    'Checklist: lighting, FOV, network, power, latency budget',
    'Privacy and exception review',
    'Acceptance test on the real site',
    'When to stop / rescope',
    'Related reading and next conversation',
  ]) {
    assert.ok(h2s.includes(heading), heading);
  }
});

test('O17 no zh body invented; locales stay en+ar', () => {
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(fs.existsSync(path.join('content/i18n/guides/zh', slug + '.md')), false);
});
