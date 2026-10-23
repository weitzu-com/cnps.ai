import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const slug = 'meeting-recorder-vs-smart-glasses-bilingual-notes';
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((g) => g.slug === slug);
const en = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const ar = fs.readFileSync(path.join('content/i18n/guides/ar', slug + '.md'), 'utf8');
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));

const META = {
  en: 'Choose by form and consent optics first — meeting recorder vs smart glasses — then bilingual scorecard. Checked 23 Oct 2026.',
  ar: 'اختر حسب الشكل ومظهر الموافقة أولاً — مسجّل مقابل نظارات ذكية — ثم بطاقة تقييم ثنائية اللغة. رُوجعت 23 أكتوبر 2026.',
};

const EN_LINKS = [
  ['https://www.cnps.ai/en/guides/gulf-meeting-consent-and-privacy-test', 'Consent and privacy test before a Gulf meeting-recorder rollout'],
  ['https://www.cnps.ai/en/guides/gulf-arabic-english-meeting-notes-pilot', 'Run a Gulf Arabic–English meeting-notes pilot in two weeks'],
  ['/blogs/smart-glasses-one-field-task', 'Smart glasses: choose one field task first'],
  ['https://shop.cnps.ai/collections/all-ticnote-products', 'Collection: All TicNote Products'],
  ['/products', 'Meet your next intelligent tool.'],
  ['/solutions/meeting-ai', 'AI meeting devices for teams'],
  ['/contact', 'Start a conversation with CNPS.AI.'],
  ['/request-quote?solution=meeting-ai', 'Request a quotation for devices or a pilot.'],
];

const AR_LINKS = [
  ['/guides/gulf-meeting-consent-and-privacy-test', 'اختبار الموافقة والخصوصية قبل طرح مسجّل اجتماعات في الخليج'],
  ['/guides/gulf-arabic-english-meeting-notes-pilot', 'أدر تجربة محاضر اجتماعات عربية خليجية–إنجليزية في أسبوعين'],
  ['/blogs/smart-glasses-one-field-task', 'النظارات الذكية: ابدأ بمهمة ميدانية واحدة'],
  ['https://shop.cnps.ai/collections/all-ticnote-products', 'Collection: All TicNote Products'],
  ['/products', 'تعرّف إلى أداتك الذكية القادمة.'],
  ['/solutions/meeting-ai', 'أجهزة اجتماعات بالذكاء الاصطناعي للفرق'],
  ['/contact', 'ابدأ محادثة مع CNPS.AI.'],
  ['/request-quote?solution=meeting-ai', 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.'],
];

function mdHrefs(src) {
  return [...src.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => [m[2], m[1]]);
}

test('O11 meta dated and ≤160; H1/slug/locales unchanged', () => {
  assert.equal(meta.h1.en, 'Meeting recorder vs smart glasses for bilingual meeting notes');
  assert.equal(meta.title.en, meta.h1.en);
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.description.en, META.en);
  assert.equal(meta.description.ar, META.ar);
  assert.ok(META.en.length <= 160 && META.ar.length <= 160);
  assert.match(en, /^# Meeting recorder vs smart glasses for bilingual meeting notes/m);
});

test('O11 every EN/AR body anchor = live H1 and each href once', () => {
  const enPairs = mdHrefs(en);
  const arPairs = mdHrefs(ar);
  assert.equal(enPairs.length, EN_LINKS.length);
  assert.equal(arPairs.length, AR_LINKS.length);
  assert.deepEqual(enPairs, EN_LINKS);
  assert.deepEqual(arPairs, AR_LINKS);
  assert.equal(new Set(enPairs.map((x) => x[0])).size, enPairs.length);
  assert.equal(new Set(arPairs.map((x) => x[0])).size, arPairs.length);
});

test('O11 build inserts method glance + editorial og; assets on disk', () => {
  assert.match(build, /meeting-recorder-vs-smart-glasses-bilingual-notes/);
  assert.match(build, /Recorder vs glasses method glance/);
  assert.match(build, /meeting-recorder-vs-smart-glasses-method-glance\.webp/);
  assert.match(build, /editorial\.socialImage\('meeting-recorder-vs-smart-glasses'\)/);
  assert.ok(assets['meeting-recorder-vs-smart-glasses']);
  for (const f of [
    'web/assets/editorial/meeting-recorder-vs-smart-glasses-1280.webp',
    'web/assets/editorial/meeting-recorder-vs-smart-glasses-640.webp',
    'web/assets/resources/meeting-recorder-vs-smart-glasses-method-glance.webp',
  ]) {
    assert.ok(fs.existsSync(f), f);
    assert.ok(fs.statSync(f).size > 1000, f + ' too small');
  }
});

test('O11 glance facts already appear in the EN body (no invented specs)', () => {
  // restatements only
  for (const s of [
    'table or open-ear',
    'scorecard',
    'stop if anyone objects',
    'mid-sentence switches',
    'next two weeks',
    'bulk buy',
  ]) assert.match(en, new RegExp(s, 'i'));
  assert.doesNotMatch(en, /WER\s*\d|battery of \d|pickup of \d|mic score|#1 in/i);
});

test('O11 built HTML (when dist present) shows glance, og, anchors once', () => {
  const htmlPath = path.join('dist/en/guides', slug + '.html');
  if (!fs.existsSync(htmlPath)) {
    assert.ok(true, 'dist not built yet');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const arHtml = fs.readFileSync(path.join('dist/ar/guides', slug + '.html'), 'utf8');
  assert.match(html, /<meta name="description" content="Choose by form and consent optics first — meeting recorder vs smart glasses — then bilingual scorecard\. Checked 23 Oct 2026\.">/);
  assert.match(html, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/meeting-recorder-vs-smart-glasses-1280\.webp"/);
  assert.doesNotMatch(html, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/social\.png"/);
  assert.match(html, /<h2 id="method-glance">Recorder vs glasses method glance<\/h2>/);
  assert.match(html, /meeting-recorder-vs-smart-glasses-method-glance\.webp/);
  const i = html.indexOf('<article');
  const j = html.indexOf('</article>', i);
  const art = html.slice(i, j);
  // glance before first original section (search inside article only — TOC also names the H2)
  const g = art.indexOf('id="method-glance"');
  const s1 = art.indexOf('What both must do');
  assert.ok(g >= 0 && s1 > g);
  for (const [href, text] of [
    ['https://www.cnps.ai/en/guides/gulf-meeting-consent-and-privacy-test', 'Consent and privacy test before a Gulf meeting-recorder rollout'],
    ['https://shop.cnps.ai/collections/all-ticnote-products', 'Collection: All TicNote Products'],
    ['/en/products', 'Meet your next intelligent tool.'],
    ['/en/contact', 'Start a conversation with CNPS.AI.'],
    ['/en/request-quote?solution=meeting-ai', 'Request a quotation for devices or a pilot.'],
  ]) {
    const n = [...art.matchAll(new RegExp('href="' + href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"', 'g'))].length;
    assert.equal(n, 1, href + ' count ' + n);
    assert.match(art, new RegExp('href="' + href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*>' + text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</a>'));
  }
  assert.match(arHtml, /<h2 id="method-glance">لمحة طريقة المسجّل مقابل النظارات<\/h2>/);
  assert.match(arHtml, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/meeting-recorder-vs-smart-glasses-1280\.webp"/);
});
