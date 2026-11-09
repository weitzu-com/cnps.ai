import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// N03 (2026-11-09 Asia/Shanghai): second CTR refresh after O03 — EN page-summary
// date 12 October 2026 → 9 November 2026. H1/title/slug, O03 meta (research Sep 2026),
// 28-chapter translated body, ZH/AR files, editorial cover + method images, and
// live-H1 sister anchors stay unchanged.
const slug = 'fastgpt-cnps-global-growth';
const title = 'FastGPT × CNPS: Global growth and delivery';
const description =
  'FastGPT × CNPS global growth playbook (research Sep 2026): 28 chapters on buyer decisions, pilot acceptance, licensing and data checks, budgets, 90-day gates.';
const enSource = fs.readFileSync(`content/i18n/reports/${slug}.en.md`, 'utf8');
const zhSource = fs.readFileSync(`content/i18n/reports/${slug}.zh.md`, 'utf8');
const arSource = fs.readFileSync(`content/i18n/reports/${slug}.ar.md`, 'utf8');
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const editorialAssets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const htmlH1s = (html) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
const REPORT_H1 = '# FastGPT × CNPS.AI: Global Growth and Delivery Playbook';

// Live H1s re-fetched 2026-11-09 (Asia/Shanghai) — identical to O03 anchors.
const sisters = {
  'https://www.cnps.ai/en/fastgpt/guides/uae-first-pilot-documents-and-workflow':
    'Pick documents and one workflow for a UAE FastGPT first pilot',
  'https://www.cnps.ai/en/resources/knowledge-pilot':
    'Scope a document-grounded AI assistant',
  'https://www.cnps.ai/en/fastgpt/compare/fastgpt-vs-chatgpt-enterprise':
    'FastGPT vs ChatGPT for permissioned enterprise knowledge',
  'https://www.cnps.ai/en/fastgpt/contact':
    'Plan a FastGPT knowledge-base pilot.',
};

test('N03: H1/title contract and O03 meta kept (research Sep 2026, ≤160)', () => {
  assert.ok(description.length <= 160);
  assert.match(description, /research Sep 2026/);
  assert.doesNotMatch(description, /Nov 2026|November 2026|as of Nov/);
  assert.match(build, new RegExp(esc(description)));
  assert.match(build, /description=playbook\?playbook\.description:reportDescription/);
  assert.match(build, /socialImage:editorial\.socialImage\(name\)/);
  const cover = editorialAssets[slug];
  assert.equal(cover.file, slug);
  assert.match(cover.alt.en, /no fake certificates/);
  assert.ok(cover.alt.zh && cover.alt.ar);
});

test('N03: EN first-screen summary dated 9 November 2026; report body untouched', () => {
  const h1 = enSource.indexOf(REPORT_H1);
  const start = enSource.indexOf('## Start here: what this playbook gives you');
  assert.ok(start >= 0 && h1 > start);
  const prefix = enSource.slice(0, h1);
  const body = enSource.slice(h1);
  assert.match(prefix, /Page summary as of 9 November 2026/);
  assert.doesNotMatch(prefix, /12 October 2026/);
  assert.doesNotMatch(body, /Page summary as of/);
  assert.doesNotMatch(enSource, /12 October 2026/);
  assert.match(prefix, /research dated 2026-09-03/);
  assert.match(enSource, /translation is not new research/);
  assert.match(enSource, /This localization is not new research/);
  assert.deepEqual([...enSource.matchAll(/^# .+$/gm)].map((m) => m[0]), [REPORT_H1]);
  for (let n = 1; n <= 28; n++) assert.match(enSource, new RegExp(`<a id="chapter-${String(n).padStart(2, '0')}"></a>`));
  assert.equal((prefix.match(/\]\(#chapter-01\)/g) || []).length, 1);
  assert.doesNotMatch(prefix, /\b\d{2,}\s*%/);
});

test('N03: sister anchors = live H1s re-fetched 2026-11-09; each href once', () => {
  const h1 = enSource.indexOf(REPORT_H1);
  const prefix = enSource.slice(0, h1);
  for (const [href, text] of Object.entries(sisters)) {
    assert.equal(enSource.split(`](${href})`).length - 1, 1, href);
    assert.match(prefix, new RegExp(esc(`[${text}](${href})`)));
  }
  assert.match(enSource, /\(\/assets\/resources\/fastgpt-cnps-global-growth-pilot-acceptance\.webp\)/);
  assert.match(enSource, /\(\/assets\/resources\/fastgpt-cnps-global-growth-release-gates\.webp\)/);
});

test('N03: ZH and AR bodies stay unchanged (no EN first screen, no summary date)', () => {
  for (const [label, src] of [['zh', zhSource], ['ar', arSource]]) {
    assert.doesNotMatch(src, /Start here: what this playbook gives you/, label);
    assert.doesNotMatch(src, /fastgpt-cnps-global-growth-release-gates/, label);
    assert.doesNotMatch(src, /Page summary as of/, label);
    assert.doesNotMatch(src, /9 November 2026/, label);
    assert.doesNotMatch(src, /12 October 2026/, label);
  }
});

test('N03: editorial cover + method images still on disk', () => {
  for (const size of [640, 1280]) {
    const f = `web/assets/editorial/${slug}-${size}.webp`;
    assert.ok(fs.existsSync(f) && fs.statSync(f).size > 1000, f);
  }
  for (const name of ['pilot-acceptance', 'release-gates']) {
    const f = `web/assets/resources/${slug}-${name}.webp`;
    assert.ok(fs.existsSync(f) && fs.statSync(f).size > 1000, f);
  }
});

test('N03 built EN page: H1 unchanged, kept meta, new summary date, editorial og', () => {
  const file = path.join('dist/en/resources', slug + '.html');
  if (!fs.existsSync(file)) {
    assert.ok(true, 'no build output');
    return;
  }
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, new RegExp(`<title>${esc(title)} \\| CNPS\\.AI</title>`));
  assert.match(html, new RegExp(`<meta name="description" content="${esc(description)}">`));
  assert.doesNotMatch(html, /<meta name="description" content="Complete translated edition/);
  assert.deepEqual(htmlH1s(html), [title]);
  assert.match(html, /Page summary as of 9 November 2026/);
  assert.doesNotMatch(html, /Page summary as of 12 October 2026/);
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/fastgpt-cnps-global-growth-1280\.webp">/);
  assert.match(html, /id="chapter-01"/);
  assert.match(html, /id="chapter-28"/);
  for (const [href, text] of Object.entries(sisters)) {
    assert.match(html, new RegExp(`href="${esc(href)}"[^>]*>${esc(text)}</a>`));
  }
});
