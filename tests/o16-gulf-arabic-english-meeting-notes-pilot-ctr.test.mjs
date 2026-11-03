import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'gulf-arabic-english-meeting-notes-pilot';
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((x) => x.slug === slug);
const en = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const ar = fs.readFileSync(path.join('content/i18n/guides/ar', slug + '.md'), 'utf8');
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));

const META = {
  en: 'Gulf Arabic–English meeting-notes pilot method: Consent Week 0, capture design, AR·EN·switch scorecard, owned actions, hardware after pass. As of 3 Nov 2026.',
  ar: 'منهج تجربة محاضر عربية خليجية–إنجليزية (حتى 3 نوفمبر 2026): موافقة الأسبوع 0، تصميم التقاط، بطاقة AR·EN·تبديل، إجراءات بمالكين، أجهزة بعد الاجتياز.',
};

const EN_LINKS = [
  ['/resources/meeting-device-pilot', 'Plan an AI meeting device pilot'],
  ['/guides/gulf-meeting-consent-and-privacy-test', 'Consent and privacy test before a Gulf meeting-recorder rollout'],
  ['https://shop.cnps.ai/collections/all-ticnote-products', 'Collection: All TicNote Products'],
  ['/guides/meeting-recorder-vs-smart-glasses-bilingual-notes', 'Meeting recorder vs smart glasses for bilingual meeting notes'],
  ['/guides/china-to-gulf-ai-recording-sourcing', 'Source China AI recording hardware for UAE/KSA without skipping the pilot'],
  ['/wholesale', 'Ask about wholesale'],
  ['/request-quote?solution=meeting-ai', 'Request a quotation for devices or a pilot.'],
];

const AR_LINKS = [
  ['/resources/meeting-device-pilot', 'خطط لتجربة أجهزة الاجتماعات بالذكاء الاصطناعي'],
  ['/guides/gulf-meeting-consent-and-privacy-test', 'اختبار الموافقة والخصوصية قبل طرح مسجّل اجتماعات في الخليج'],
  ['https://shop.cnps.ai/collections/all-ticnote-products', 'Collection: All TicNote Products'],
  ['/guides/meeting-recorder-vs-smart-glasses-bilingual-notes', 'مسجّل الاجتماعات مقابل النظارات الذكية لمحاضر ثنائية اللغة'],
  ['/guides/china-to-gulf-ai-recording-sourcing', 'استورد أجهزة تسجيل بالذكاء الاصطناعي من الصين إلى الإمارات/السعودية دون تخطي التجربة'],
  ['/wholesale', 'استفسر عن البيع بالجملة'],
  ['/request-quote?solution=meeting-ai', 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.'],
];

function mdHrefs(src) {
  return [...src.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
    .map((m) => [m[2], m[1]])
    .filter(([href]) => !href.startsWith('/assets/') && !/\.(webp|png|jpe?g|svg)$/i.test(href) && !/^mailto:/i.test(href));
}

test('O16 meta dated and ≤160; H1/title/slug/locales unchanged', () => {
  assert.ok(meta);
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.h1.en, 'Run a Gulf Arabic–English meeting-notes pilot in two weeks');
  assert.equal(meta.h1.ar, 'أدر تجربة محاضر اجتماعات عربية خليجية–إنجليزية في أسبوعين');
  assert.equal(meta.title.en, 'Gulf Arabic–English meeting-notes pilot: consent, quality, action items');
  assert.equal(meta.description.en, META.en);
  assert.equal(meta.description.ar, META.ar);
  assert.ok(META.en.length <= 160 && META.ar.length <= 160);
  assert.match(en, /^# Run a Gulf Arabic–English meeting-notes pilot in two weeks/m);
  assert.match(ar, /^# أدر تجربة محاضر اجتماعات عربية خليجية–إنجليزية في أسبوعين/m);
});

test('O16 every EN/AR body internal/shop anchor = live H1 and each href once', () => {
  assert.deepEqual(mdHrefs(en), EN_LINKS);
  assert.deepEqual(mdHrefs(ar), AR_LINKS);
  for (const pairs of [EN_LINKS, AR_LINKS]) {
    assert.equal(new Set(pairs.map((x) => x[0])).size, pairs.length);
  }
  assert.doesNotMatch(en, /\/contact/);
  assert.doesNotMatch(ar, /\/contact/);
});

test('O16 method glance + editorial assets on disk; build wires og', () => {
  assert.match(en, /## Gulf Arabic–English pilot method glance/);
  assert.match(ar, /## لمحة طريقة التجربة العربية الخليجية–الإنجليزية/);
  assert.match(en, /gulf-arabic-english-meeting-notes-pilot-method-glance\.webp/);
  assert.match(ar, /gulf-arabic-english-meeting-notes-pilot-method-glance\.webp/);
  assert.ok(
    build.includes("editorial.socialImage('gulf-arabic-english-meeting-notes-pilot')") ||
      build.includes('editorial.socialImage("gulf-arabic-english-meeting-notes-pilot")'),
    'guide socialImage must be wired in build-trilingual.mjs',
  );
  assert.ok(assets['gulf-arabic-english-meeting-notes-pilot']);
  for (const f of [
    'web/assets/editorial/gulf-arabic-english-meeting-notes-pilot-1280.webp',
    'web/assets/editorial/gulf-arabic-english-meeting-notes-pilot-640.webp',
    'web/assets/resources/gulf-arabic-english-meeting-notes-pilot-method-glance.webp',
  ]) {
    assert.ok(fs.existsSync(f), f);
    assert.ok(fs.statSync(f).size > 1000, f + ' too small');
  }
});

test('O16 glance facts already appear in the EN body (no invented specs)', () => {
  for (const s of [
    'Consent Week 0',
    'Capture design',
    'Scorecard AR·EN·switch',
    'Actions with owners',
    'Hardware only after pass',
    'meaning-critical',
    'not legal counsel',
  ]) {
    assert.match(en, new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.doesNotMatch(en, /duty rate of \d|lead time of \d|WER\s*\d|accuracy of \d|inquiry count/i);
});

test('O16 existing section titles preserved; method glance is first new H2', () => {
  const h2s = [...en.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.equal(h2s[0], 'Gulf Arabic–English pilot method glance');
  for (const heading of [
    'What “done” looks like',
    'Week 0 — Consent and privacy gate',
    'Week 1 — Capture design',
    'Scorecard: Arabic, English, and mid-sentence switches',
    'Notes become action items',
    'Gulf-specific checks',
    'Copy-paste checklist',
    'FAQ',
    'Request a scoped next step',
  ]) {
    assert.ok(h2s.includes(heading), heading);
  }
});

test('O16 no zh body invented; locales stay en+ar', () => {
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(fs.existsSync(path.join('content/i18n/guides/zh', slug + '.md')), false);
});
