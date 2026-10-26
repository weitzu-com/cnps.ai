import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'meeting-device-pilot';
const catalog = JSON.parse(fs.readFileSync('content/i18n/catalog.json', 'utf8'));
const en = fs.readFileSync(path.join('content/i18n/resources/en', slug + '.md'), 'utf8');
const zh = fs.readFileSync(path.join('content/i18n/resources/zh', slug + '.md'), 'utf8');
const ar = fs.readFileSync(path.join('content/i18n/resources/ar', slug + '.md'), 'utf8');
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));

const META = {
  en: 'Plan an AI meeting-device pilot: representative trial, record results, team ownership, then a quotation brief. As of 26 Oct 2026.',
  zh: 'AI 会议设备试点方法（截至 2026 年 10 月 26 日）：代表性试用、记录结果、团队归属、再写报价摘要。',
  ar: 'طريقة تجربة جهاز الاجتماعات (حتى 26 أكتوبر 2026): تجربة ممثلة، تسجيل النتائج، ملكية الفريق، ثم موجز عرض السعر.',
};

const EN_LINKS = [
  ['/guides/gulf-arabic-english-meeting-notes-pilot', 'Run a Gulf Arabic–English meeting-notes pilot in two weeks'],
  ['/guides/meeting-recorder-vs-smart-glasses-bilingual-notes', 'Meeting recorder vs smart glasses for bilingual meeting notes'],
  ['/products/compare', 'TicNote models side by side'],
  ['/request-quote?solution=meeting-ai', 'Request a quotation for devices or a pilot.'],
];

const ZH_LINKS = [
  ['/en/guides/gulf-arabic-english-meeting-notes-pilot', 'Run a Gulf Arabic–English meeting-notes pilot in two weeks'],
  ['/en/guides/meeting-recorder-vs-smart-glasses-bilingual-notes', 'Meeting recorder vs smart glasses for bilingual meeting notes'],
  ['/products/compare', 'TicNote 型号并排对比'],
  ['/request-quote?solution=meeting-ai', '为设备或试点索取报价。'],
];

const AR_LINKS = [
  ['/guides/gulf-arabic-english-meeting-notes-pilot', 'أدر تجربة محاضر اجتماعات عربية خليجية–إنجليزية في أسبوعين'],
  ['/guides/meeting-recorder-vs-smart-glasses-bilingual-notes', 'مسجّل الاجتماعات مقابل النظارات الذكية لمحاضر ثنائية اللغة'],
  ['/products/compare', 'مقارنة طرازات TicNote جنبًا إلى جنب'],
  ['/request-quote?solution=meeting-ai', 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.'],
];

function mdHrefs(src) {
  return [...src.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
    .map((m) => [m[2], m[1]])
    .filter(([href]) => !href.startsWith('/assets/') && !/\.(webp|png|jpe?g|svg)$/i.test(href));
}

function resource(loc) {
  return catalog[loc].resources.find((r) => r.slug === slug);
}

test('O12 meta dated and ≤160; H1/slug/locales unchanged', () => {
  assert.equal(resource('en').title, 'Plan an AI meeting device pilot');
  assert.equal(resource('zh').title, '规划 AI 会议设备试点');
  assert.equal(resource('ar').title, 'خطط لتجربة أجهزة الاجتماعات بالذكاء الاصطناعي');
  assert.equal(resource('en').description, META.en);
  assert.equal(resource('zh').description, META.zh);
  assert.equal(resource('ar').description, META.ar);
  assert.ok(META.en.length <= 160 && META.zh.length <= 160 && META.ar.length <= 160);
  assert.match(en, /^# Plan an AI meeting device pilot/m);
  assert.match(zh, /^# 规划 AI 会议设备试点/m);
  assert.match(ar, /^# خطط لتجربة أجهزة الاجتماعات بالذكاء الاصطناعي/m);
});

test('O12 every EN/ZH/AR body anchor = live H1 and each href once', () => {
  assert.deepEqual(mdHrefs(en), EN_LINKS);
  assert.deepEqual(mdHrefs(zh), ZH_LINKS);
  assert.deepEqual(mdHrefs(ar), AR_LINKS);
  for (const pairs of [EN_LINKS, ZH_LINKS, AR_LINKS]) {
    assert.equal(new Set(pairs.map((x) => x[0])).size, pairs.length);
  }
});

test('O12 method glance + editorial assets on disk; build wires og', () => {
  assert.match(en, /## Meeting-device pilot method glance/);
  assert.match(zh, /## 会议设备试点方法速览/);
  assert.match(ar, /## لمحة طريقة تجربة جهاز الاجتماعات/);
  assert.match(en, /meeting-device-pilot-method-glance\.webp/);
  assert.match(build, /meeting-device-pilot/);
  assert.ok(
    build.includes("'meeting-device-pilot'].includes(x.slug)") ||
      build.includes('"meeting-device-pilot"].includes(x.slug)') ||
      /ai-procurement-checklist-public-sector','meeting-device-pilot'/.test(build) ||
      /ai-procurement-checklist-public-sector","meeting-device-pilot"/.test(build),
    'meeting-device-pilot must be in resource socialImage includes list',
  );
  assert.ok(assets['meeting-device-pilot']);
  for (const f of [
    'web/assets/editorial/meeting-device-pilot-1280.webp',
    'web/assets/editorial/meeting-device-pilot-640.webp',
    'web/assets/resources/meeting-device-pilot-method-glance.webp',
  ]) {
    assert.ok(fs.existsSync(f), f);
    assert.ok(fs.statSync(f).size > 1000, f + ' too small');
  }
});

test('O12 glance facts already appear in the EN body (no invented specs)', () => {
  for (const s of [
    'representative',
    'authorized recordings',
    'team administration',
    'quotation',
    'destination',
    'samples',
  ]) assert.match(en, new RegExp(s, 'i'));
  assert.doesNotMatch(en, /WER\s*\d|accuracy of \d|battery of \d|#1 in|inquiry count/i);
});

test('O12 existing section H2 titles preserved', () => {
  for (const h of [
    '## Choose a representative trial',
    '## Record the results',
    '## Check team ownership',
    '## Your quotation brief',
  ]) assert.match(en, new RegExp(h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('O12 built HTML (when dist present) shows glance, og, anchors once', () => {
  const htmlPath = path.join('dist/en/resources', slug + '.html');
  if (!fs.existsSync(htmlPath)) {
    assert.ok(true, 'dist not built yet');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const zhHtml = fs.readFileSync(path.join('dist/zh/resources', slug + '.html'), 'utf8');
  const arHtml = fs.readFileSync(path.join('dist/ar/resources', slug + '.html'), 'utf8');
  assert.match(html, new RegExp(`content="${META.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/meeting-device-pilot-1280\.webp"/);
  assert.doesNotMatch(html, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/social\.png"/);
  assert.match(html, /Meeting-device pilot method glance/);
  assert.match(html, /meeting-device-pilot-method-glance\.webp/);
  const i = html.indexOf('<article');
  const j = html.indexOf('</article>', i);
  const art = html.slice(i, j);
  const g = art.indexOf('Meeting-device pilot method glance');
  const s1 = art.indexOf('Choose a representative trial');
  assert.ok(g >= 0 && s1 > g);
  assert.match(zhHtml, /会议设备试点方法速览/);
  assert.match(arHtml, /لمحة طريقة تجربة جهاز الاجتماعات/);
  for (const [href, text] of [
    ['/en/guides/gulf-arabic-english-meeting-notes-pilot', 'Run a Gulf Arabic–English meeting-notes pilot in two weeks'],
    ['/en/products/compare', 'TicNote models side by side'],
    ['/en/request-quote?solution=meeting-ai', 'Request a quotation for devices or a pilot.'],
  ]) {
    const n = [...art.matchAll(new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'))].length;
    assert.equal(n, 1, href);
    assert.ok(art.includes(`>${text}</a>`) || art.includes(`>${text.replace(/\./g, '')}`), text);
  }
});
