import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'fastgpt-vs-chatgpt-enterprise';
const compares = JSON.parse(fs.readFileSync('content/i18n/fastgpt-compare.json', 'utf8')).compares;
const meta = compares.find((x) => x.slug === slug);
const en = fs.readFileSync(path.join('content/i18n/fastgpt-compare/en', slug + '.md'), 'utf8');
const ar = fs.readFileSync(path.join('content/i18n/fastgpt-compare/ar', slug + '.md'), 'utf8');
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));

const META = {
  en: 'Compare FastGPT vs ChatGPT as methods: permissions, citations, human review, two-week evaluate, when each fits. As of 28 Oct 2026.',
  ar: 'قارن FastGPT وChatGPT منهجاً (حتى 28 أكتوبر 2026): صلاحيات، استشهادات، مراجعة بشرية، تقييم لأسبوعين، ومتى يكفي كل منهما.',
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

test('O14 meta dated and ≤160; H1/title/slug/locales unchanged', () => {
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
  assert.match(en, /^# FastGPT vs ChatGPT for permissioned enterprise knowledge/m);
  assert.match(ar, /^# FastGPT مقابل ChatGPT لمعرفة مؤسسية ذات صلاحيات/m);
});

test('O14 every EN/AR body internal anchor = live H1 and each href once', () => {
  assert.deepEqual(mdHrefs(en), EN_LINKS);
  assert.deepEqual(mdHrefs(ar), AR_LINKS);
  for (const pairs of [EN_LINKS, AR_LINKS]) {
    assert.equal(new Set(pairs.map((x) => x[0])).size, pairs.length);
  }
  assert.doesNotMatch(en, /\/fastgpt\/contact/);
  assert.doesNotMatch(ar, /\/fastgpt\/contact/);
});

test('O14 method glance + editorial assets on disk; build wires og', () => {
  assert.match(en, /## Enterprise compare method glance/);
  assert.match(ar, /## لمحة طريقة المقارنة المؤسسية/);
  assert.match(en, /fastgpt-vs-chatgpt-enterprise-method-glance\.webp/);
  assert.match(ar, /fastgpt-vs-chatgpt-enterprise-method-glance\.webp/);
  assert.ok(
    build.includes("editorial.socialImage('fastgpt-vs-chatgpt-enterprise')") ||
      build.includes('editorial.socialImage("fastgpt-vs-chatgpt-enterprise")'),
    'compare socialImage must be wired in build-trilingual.mjs',
  );
  assert.ok(assets['fastgpt-vs-chatgpt-enterprise']);
  for (const f of [
    'web/assets/editorial/fastgpt-vs-chatgpt-enterprise-1280.webp',
    'web/assets/editorial/fastgpt-vs-chatgpt-enterprise-640.webp',
    'web/assets/resources/fastgpt-vs-chatgpt-enterprise-method-glance.webp',
  ]) {
    assert.ok(fs.existsSync(f), f);
    assert.ok(fs.statSync(f).size > 1000, f + ' too small');
  }
});

test('O14 glance facts already appear in the EN body (no invented specs)', () => {
  for (const s of [
    'permissions',
    'citation',
    'Human review',
    'two-week',
    'not “always FastGPT',
    'not independently audited',
  ]) {
    assert.match(en, new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.doesNotMatch(en, /win rate|win-rate of|accuracy of \d|latency of \d|inquiry count/i);
});

test('O14 existing section titles preserved; method glance is first new H2', () => {
  const h2s = [...en.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.equal(h2s[0], 'Enterprise compare method glance');
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
  ]) {
    assert.ok(h2s.includes(heading), heading);
  }
});

test('O14 no zh body invented; locales stay en+ar', () => {
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(fs.existsSync(path.join('content/i18n/fastgpt-compare/zh', slug + '.md')), false);
});
