import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// N08 (2026-11-16 Asia/Shanghai): second www CTR refresh of
// fastgpt-vs-chatgpt-enterprise after O14 (2026-10-28). H1/title/slug
// and editorial cover + method glance stay unchanged. Dated meta checked
// 16 Nov 2026, EN+AR body re-check 16 November 2026 (28 October 2026
// research date kept), exact live-H1 anchors unchanged. ZH stays 307→EN
// (no ZH body). No shop News. No new URL. Images kept.
const slug = 'fastgpt-vs-chatgpt-enterprise';
const compares = JSON.parse(fs.readFileSync('content/i18n/fastgpt-compare.json', 'utf8')).compares;
const meta = compares.find((x) => x.slug === slug);
const en = fs.readFileSync(path.join('content/i18n/fastgpt-compare/en', slug + '.md'), 'utf8');
const ar = fs.readFileSync(path.join('content/i18n/fastgpt-compare/ar', slug + '.md'), 'utf8');
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));

const META = {
  en: 'Compare FastGPT vs ChatGPT as methods (checked 16 Nov 2026): permissions, citations, human review, two-week evaluate, when each fits.',
  ar: 'قارن FastGPT وChatGPT منهجاً (رُوجعت في 16 نوفمبر 2026): صلاحيات، استشهادات، مراجعة بشرية، تقييم لأسبوعين، ومتى يكفي كل منهما.',
};

const EN_LINKS = [
  ['/resources/knowledge-pilot', 'Scope a document-grounded AI assistant'],
  ['/fastgpt/cases', 'FastGPT reference library'],
  ['/fastgpt', 'Put your business knowledge to work.'],
  ['/request-quote?solution=knowledge-assistants', 'Request a quotation for devices or a pilot.'],
];

const AR_LINKS = [
  ['/resources/knowledge-pilot', 'حدد نطاق مساعد ذكاء اصطناعي يستند إلى المستندات'],
  ['/fastgpt/cases', 'مكتبة مراجع FastGPT'],
  ['/fastgpt', 'ضع معرفة مؤسستك في خدمة العمل.'],
  ['/request-quote?solution=knowledge-assistants', 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.'],
];

function mdHrefs(src) {
  return [...src.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
    .map((m) => [m[2], m[1]])
    .filter(([href]) => href.startsWith('/') && !href.startsWith('/assets/') && !/\.(webp|png|jpe?g|svg)$/i.test(href) && !/^mailto:/i.test(href) && !/^https?:/i.test(href));
}

test('N08 meta dated and ≤160; H1/title/slug/locales unchanged', () => {
  assert.ok(meta);
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.h1.en, 'FastGPT vs ChatGPT for permissioned enterprise knowledge');
  assert.equal(meta.h1.ar, 'FastGPT مقابل ChatGPT لمعرفة مؤسسية ذات صلاحيات');
  assert.equal(
    meta.title.en,
    'When to use FastGPT instead of ChatGPT for cited, reviewed answers on your documents',
  );
  assert.equal(meta.description.en, META.en);
  assert.equal(meta.description.ar, META.ar);
  assert.ok(META.en.length <= 160 && META.ar.length <= 160);
  assert.equal(META.en.length, 133);
  assert.equal(META.ar.length, 126);
  assert.match(en, /^# FastGPT vs ChatGPT for permissioned enterprise knowledge/m);
  assert.match(ar, /^# FastGPT مقابل ChatGPT لمعرفة مؤسسية ذات صلاحيات/m);
  assert.ok(!fs.existsSync(path.join('content/i18n/fastgpt-compare/zh', slug + '.md')));
});

test('N08 keeps 28 October research date, adds 16 November re-check, does not rewrite sections or glance', () => {
  assert.match(en, /checked 28 October 2026/);
  assert.match(ar, /رُوجعت في 28 أكتوبر 2026/);
  assert.match(en, /re-checked on 16 November 2026/);
  assert.match(en, /this refresh is not a new comparison/);
  assert.match(ar, /16 نوفمبر 2026/);
  assert.match(ar, /هذه ليست مقارنة جديدة/);
  assert.match(en, /## Enterprise compare method glance/);
  assert.match(ar, /## لمحة طريقة المقارنة المؤسسية/);
  for (const heading of [
    'A fair baseline — what both can do',
    'Decision matrix',
    'Permissions checklist before either pilot',
    'Citations and evidence',
    'Human review',
    'A two-week evaluate design',
    'When ChatGPT is enough — and when a FastGPT-shaped workflow fits',
    'FAQ',
    'Plan a pilot',
  ]) assert.match(en, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(en, /fastgpt-vs-chatgpt-enterprise-method-glance\.webp/);
  assert.match(ar, /fastgpt-vs-chatgpt-enterprise-method-glance\.webp/);
});

test('N08 every EN/AR body internal anchor = live H1 and each href once; one money CTA', () => {
  assert.deepEqual(mdHrefs(en), EN_LINKS);
  assert.deepEqual(mdHrefs(ar), AR_LINKS);
  for (const pairs of [EN_LINKS, AR_LINKS]) {
    assert.equal(new Set(pairs.map((x) => x[0])).size, pairs.length);
  }
  assert.doesNotMatch(en, /\/fastgpt\/contact/);
  assert.doesNotMatch(ar, /\/fastgpt\/contact/);
  assert.equal((en.match(/\/request-quote/g) || []).length, 1);
  assert.equal((ar.match(/\/request-quote/g) || []).length, 1);
});

test('N08 editorial assets kept on disk; no new pixels required', () => {
  assert.ok(assets['fastgpt-vs-chatgpt-enterprise']);
  for (const f of [
    'web/assets/editorial/fastgpt-vs-chatgpt-enterprise-1280.webp',
    'web/assets/editorial/fastgpt-vs-chatgpt-enterprise-640.webp',
    'web/assets/resources/fastgpt-vs-chatgpt-enterprise-method-glance.webp',
  ]) {
    assert.ok(fs.existsSync(f) && fs.statSync(f).size > 1000, f);
  }
});
