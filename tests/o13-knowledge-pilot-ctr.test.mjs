import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'knowledge-pilot';
const catalog = JSON.parse(fs.readFileSync('content/i18n/catalog.json', 'utf8'));
const en = fs.readFileSync(path.join('content/i18n/resources/en', slug + '.md'), 'utf8');
const zh = fs.readFileSync(path.join('content/i18n/resources/zh', slug + '.md'), 'utf8');
const ar = fs.readFileSync(path.join('content/i18n/resources/ar', slug + '.md'), 'utf8');
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));

const META = {
  en: 'Scope a document-grounded AI assistant: permissions, citations, human review, fixed eval set and acceptance. As of 27 Oct 2026.',
  zh: '基于文档的 AI 助手试点方法（截至 2026 年 10 月 27 日）：权限、引用、人工复核、评估题集与验收。',
  ar: 'طريقة مساعد مستندات (حتى 27 أكتوبر 2026): صلاحيات، استشهادات، مراجعة بشرية، مجموعة تقييم وقبول.',
};

const EN_LINKS = [
  ['/fastgpt/compare/fastgpt-vs-chatgpt-enterprise', 'FastGPT vs ChatGPT for permissioned enterprise knowledge'],
  ['/fastgpt/guides/uae-first-pilot-documents-and-workflow', 'Pick documents and one workflow for a UAE FastGPT first pilot'],
  ['/request-quote?solution=knowledge-assistants', 'Request a quotation for devices or a pilot.'],
];

const ZH_LINKS = [
  ['/en/fastgpt/compare/fastgpt-vs-chatgpt-enterprise', 'FastGPT vs ChatGPT for permissioned enterprise knowledge'],
  ['/en/fastgpt/guides/uae-first-pilot-documents-and-workflow', 'Pick documents and one workflow for a UAE FastGPT first pilot'],
  ['/request-quote?solution=knowledge-assistants', '为设备或试点索取报价。'],
];

const AR_LINKS = [
  ['/fastgpt/compare/fastgpt-vs-chatgpt-enterprise', 'FastGPT مقابل ChatGPT لمعرفة مؤسسية ذات صلاحيات'],
  ['/fastgpt/guides/uae-first-pilot-documents-and-workflow', 'اختر المستندات وسير عمل واحداً لتجربة FastGPT أولى في الإمارات'],
  ['/request-quote?solution=knowledge-assistants', 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.'],
];

function mdHrefs(src) {
  return [...src.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
    .map((m) => [m[2], m[1]])
    .filter(([href]) => !href.startsWith('/assets/') && !/\.(webp|png|jpe?g|svg)$/i.test(href) && !/github\.com/i.test(href));
}

function resource(loc) {
  return catalog[loc].resources.find((r) => r.slug === slug);
}

test('O13 meta dated and ≤160; H1/slug/locales unchanged', () => {
  assert.equal(resource('en').title, 'Scope a document-grounded AI assistant');
  assert.equal(resource('zh').title, '定义基于文档的 AI 助手');
  assert.equal(resource('ar').title, 'حدد نطاق مساعد ذكاء اصطناعي يستند إلى المستندات');
  assert.equal(resource('en').description, META.en);
  assert.equal(resource('zh').description, META.zh);
  assert.equal(resource('ar').description, META.ar);
  assert.ok(META.en.length <= 160 && META.zh.length <= 160 && META.ar.length <= 160);
  assert.match(en, /^# Scope a document-grounded AI assistant/m);
  assert.match(zh, /^# 定义基于文档的 AI 助手/m);
  assert.match(ar, /^# حدد نطاق مساعد ذكاء اصطناعي يستند إلى المستندات/m);
});

test('O13 every EN/ZH/AR body internal anchor = live H1 and each href once', () => {
  assert.deepEqual(mdHrefs(en), EN_LINKS);
  assert.deepEqual(mdHrefs(zh), ZH_LINKS);
  assert.deepEqual(mdHrefs(ar), AR_LINKS);
  for (const pairs of [EN_LINKS, ZH_LINKS, AR_LINKS]) {
    assert.equal(new Set(pairs.map((x) => x[0])).size, pairs.length);
  }
});

test('O13 method glance + editorial assets on disk; build wires og', () => {
  assert.match(en, /## Knowledge pilot method glance/);
  assert.match(zh, /## 知识试点方法速览/);
  assert.match(ar, /## لمحة طريقة تجربة المعرفة/);
  assert.match(en, /knowledge-pilot-method-glance\.webp/);
  assert.match(build, /knowledge-pilot/);
  assert.ok(
    build.includes("'knowledge-pilot'].includes(x.slug)") ||
      build.includes('"knowledge-pilot"].includes(x.slug)') ||
      /meeting-device-pilot','knowledge-pilot'/.test(build) ||
      /meeting-device-pilot","knowledge-pilot"/.test(build) ||
      /ai-procurement-checklist-public-sector','knowledge-pilot'/.test(build),
    'knowledge-pilot must be in resource socialImage includes list',
  );
  assert.ok(assets['knowledge-pilot']);
  for (const f of [
    'web/assets/editorial/knowledge-pilot-1280.webp',
    'web/assets/editorial/knowledge-pilot-640.webp',
    'web/assets/resources/knowledge-pilot-method-glance.webp',
  ]) {
    assert.ok(fs.existsSync(f), f);
    assert.ok(fs.statSync(f).size > 1000, f + ' too small');
  }
});

test('O13 glance facts already appear in the EN body (no invented specs)', () => {
  for (const s of [
    'permissions',
    'citations',
    'reviews incorrect answers',
    'test set before tuning',
    'holdout',
    'thresholds',
  ]) assert.match(en, new RegExp(s, 'i'));
  assert.doesNotMatch(en, /WER\s*\d|accuracy of \d|battery of \d|#1 in|inquiry count/i);
});

test('O13 existing section H2 titles preserved', () => {
  for (const h of [
    '## Prepare the inputs',
    '## Define acceptance',
    '## Plan the operating model',
    '## What to share with CNPS',
  ]) assert.match(en, new RegExp(h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('O13 built HTML (when dist present) shows glance, og, anchors once', () => {
  const htmlPath = path.join('dist/en/resources', slug + '.html');
  if (!fs.existsSync(htmlPath)) {
    assert.ok(true, 'dist not built yet');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const zhHtml = fs.readFileSync(path.join('dist/zh/resources', slug + '.html'), 'utf8');
  const arHtml = fs.readFileSync(path.join('dist/ar/resources', slug + '.html'), 'utf8');
  assert.match(html, new RegExp(`content="${META.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/knowledge-pilot-1280\.webp"/);
  assert.doesNotMatch(html, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/social\.png"/);
  assert.match(html, /Knowledge pilot method glance/);
  assert.match(html, /knowledge-pilot-method-glance\.webp/);
  const i = html.indexOf('<article');
  const j = html.indexOf('</article>', i);
  const art = html.slice(i, j);
  const g = art.indexOf('Knowledge pilot method glance');
  const s1 = art.indexOf('Prepare the inputs');
  assert.ok(g >= 0 && s1 > g);
  assert.match(zhHtml, /知识试点方法速览/);
  assert.match(arHtml, /لمحة طريقة تجربة المعرفة/);
  for (const [href, text] of [
    ['/en/fastgpt/compare/fastgpt-vs-chatgpt-enterprise', 'FastGPT vs ChatGPT for permissioned enterprise knowledge'],
    ['/en/fastgpt/guides/uae-first-pilot-documents-and-workflow', 'Pick documents and one workflow for a UAE FastGPT first pilot'],
    ['/en/request-quote?solution=knowledge-assistants', 'Request a quotation for devices or a pilot.'],
  ]) {
    const n = [...art.matchAll(new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'))].length;
    assert.equal(n, 1, href);
    assert.ok(art.includes(`>${text}</a>`), text);
  }
});
