import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'china-to-gulf-ai-recording-sourcing';
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((x) => x.slug === slug);
const en = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const ar = fs.readFileSync(path.join('content/i18n/guides/ar', slug + '.md'), 'utf8');
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));

const META = {
  en: 'China→Gulf AI recording sourcing method: workflow, consent Week 0, written vendor stack, bilingual scorecard sample, roles before PO. As of 30 Oct 2026.',
  ar: 'منهج توريد تسجيل من الصين إلى الخليج (حتى 30 أكتوبر 2026): مسار العمل، موافقة، ركام مورّد مكتوب، عينة ببطاقة ثنائية اللغة، أدوار قبل أمر الشراء.',
};

const EN_LINKS = [
  ['/guides/gulf-arabic-english-meeting-notes-pilot', 'Run a Gulf Arabic–English meeting-notes pilot in two weeks'],
  ['/guides/gulf-meeting-consent-and-privacy-test', 'Consent and privacy test before a Gulf meeting-recorder rollout'],
  ['/resources/ai-procurement-checklist', 'AI procurement checklist for enterprise buyers'],
  ['/resources/china-ai-export-playbook', 'China AI export playbook for overseas buyers'],
  ['https://shop.cnps.ai/collections/all-ticnote-products', 'Collection: All TicNote Products'],
  ['/wholesale', 'Ask about wholesale'],
  ['/request-quote?solution=meeting-ai', 'Request a quotation for devices or a pilot.'],
];

const AR_LINKS = [
  ['/guides/gulf-arabic-english-meeting-notes-pilot', 'أدر تجربة محاضر اجتماعات عربية خليجية–إنجليزية في أسبوعين'],
  ['/guides/gulf-meeting-consent-and-privacy-test', 'اختبار الموافقة والخصوصية قبل طرح مسجّل اجتماعات في الخليج'],
  ['/resources/ai-procurement-checklist', 'قائمة شراء الذكاء الاصطناعي للمشتري المؤسسي'],
  ['/resources/china-ai-export-playbook', 'الذكاء الاصطناعي الصيني: خطة CNPS للتوسع العالمي'],
  ['https://shop.cnps.ai/collections/all-ticnote-products', 'Collection: All TicNote Products'],
  ['/wholesale', 'استفسر عن البيع بالجملة'],
  ['/request-quote?solution=meeting-ai', 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.'],
];

function mdHrefs(src) {
  return [...src.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
    .map((m) => [m[2], m[1]])
    .filter(([href]) => !href.startsWith('/assets/') && !/\.(webp|png|jpe?g|svg)$/i.test(href) && !/^mailto:/i.test(href));
}

test('O15 meta dated and ≤160; H1/title/slug/locales unchanged', () => {
  assert.ok(meta);
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.h1.en, 'Source China AI recording hardware for UAE/KSA without skipping the pilot');
  assert.equal(meta.h1.ar, 'استورد أجهزة تسجيل بالذكاء الاصطناعي من الصين إلى الإمارات/السعودية دون تخطي التجربة');
  assert.equal(meta.title.en, 'Source China AI recording hardware for UAE/KSA without skipping the pilot');
  assert.equal(meta.description.en, META.en);
  assert.equal(meta.description.ar, META.ar);
  assert.ok(META.en.length <= 160 && META.ar.length <= 160);
  assert.match(en, /^# Source China AI recording hardware for UAE\/KSA without skipping the pilot/m);
  assert.match(ar, /^# استورد أجهزة تسجيل بالذكاء الاصطناعي من الصين إلى الإمارات\/السعودية دون تخطي التجربة/m);
});

test('O15 every EN/AR body internal/shop anchor = live H1 and each href once', () => {
  assert.deepEqual(mdHrefs(en), EN_LINKS);
  assert.deepEqual(mdHrefs(ar), AR_LINKS);
  for (const pairs of [EN_LINKS, AR_LINKS]) {
    assert.equal(new Set(pairs.map((x) => x[0])).size, pairs.length);
  }
  assert.doesNotMatch(en, /\/contact/);
  assert.doesNotMatch(ar, /\/contact/);
});

test('O15 method glance + editorial assets on disk; build wires og', () => {
  assert.match(en, /## China→Gulf sourcing method glance/);
  assert.match(ar, /## لمحة طريقة التوريد من الصين إلى الخليج/);
  assert.match(en, /china-to-gulf-ai-recording-sourcing-method-glance\.webp/);
  assert.match(ar, /china-to-gulf-ai-recording-sourcing-method-glance\.webp/);
  assert.ok(
    build.includes("editorial.socialImage('china-to-gulf-ai-recording-sourcing')") ||
      build.includes('editorial.socialImage("china-to-gulf-ai-recording-sourcing")'),
    'guide socialImage must be wired in build-trilingual.mjs',
  );
  assert.ok(assets['china-to-gulf-ai-recording-sourcing']);
  for (const f of [
    'web/assets/editorial/china-to-gulf-ai-recording-sourcing-1280.webp',
    'web/assets/editorial/china-to-gulf-ai-recording-sourcing-640.webp',
    'web/assets/resources/china-to-gulf-ai-recording-sourcing-method-glance.webp',
  ]) {
    assert.ok(fs.existsSync(f), f);
    assert.ok(fs.statSync(f).size > 1000, f + ' too small');
  }
});

test('O15 glance facts already appear in the EN body (no invented specs)', () => {
  for (const s of [
    'Workflow brief',
    'Consent Week 0',
    'Vendor written stack',
    'Sample on scorecard',
    'Roles before PO',
    'Processing location',
    'will not invent a number',
  ]) {
    assert.match(en, new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.doesNotMatch(en, /duty rate of \d|lead time of \d|WER\s*\d|accuracy of \d|inquiry count/i);
});

test('O15 existing section titles preserved; method glance is first new H2', () => {
  const h2s = [...en.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.equal(h2s[0], 'China→Gulf sourcing method glance');
  for (const heading of [
    'Define the job before the PO',
    'Vendor evaluation checklist',
    'Sample before scale',
    'Delivery responsibilities',
    'Retail shop vs sourcing conversation',
    'FAQ',
    'Explore a partnership',
  ]) {
    assert.ok(h2s.includes(heading), heading);
  }
});

test('O15 no zh body invented; locales stay en+ar', () => {
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(fs.existsSync(path.join('content/i18n/guides/zh', slug + '.md')), false);
});
