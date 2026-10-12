import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

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

test('EN report meta is reader-facing, ≤160 chars, not the translated-edition note', () => {
  assert.ok(description.length <= 160);
  assert.match(build, new RegExp(esc(description)));
  assert.match(build, /description=playbook\?playbook\.description:reportDescription/);
  assert.match(build, /socialImage:editorial\.socialImage\(name\)/);
  const cover = editorialAssets[slug];
  assert.equal(cover.file, slug);
  assert.match(cover.alt.en, /no fake certificates/);
  assert.ok(cover.alt.zh && cover.alt.ar);
});

test('EN first screen sits above the unchanged translated report', () => {
  const h1 = enSource.indexOf('# FastGPT × CNPS.AI: Global Growth and Delivery Playbook');
  const start = enSource.indexOf('## Start here: what this playbook gives you');
  assert.ok(start >= 0 && h1 > start);
  assert.match(enSource.slice(0, h1), /^Use this playbook when you need to decide/);
  assert.match(enSource.slice(0, h1), /Page summary as of 12 October 2026/);
  assert.match(enSource, /translation is not new research/);
  assert.match(enSource, /This localization is not new research/);
  assert.deepEqual([...enSource.matchAll(/^# .+$/gm)].map((m) => m[0]), ['# FastGPT × CNPS.AI: Global Growth and Delivery Playbook']);
  for (let n = 1; n <= 28; n++) assert.match(enSource, new RegExp(`<a id="chapter-${String(n).padStart(2, '0')}"></a>`));
  for (const href of [
    'https://www.cnps.ai/en/fastgpt/guides/uae-first-pilot-documents-and-workflow',
    'https://www.cnps.ai/en/resources/knowledge-pilot',
    'https://www.cnps.ai/en/fastgpt/compare/fastgpt-vs-chatgpt-enterprise',
    'https://www.cnps.ai/en/fastgpt/contact'
  ]) assert.equal(enSource.split(`](${href})`).length - 1, 1, href);
  assert.match(enSource, /\(\/assets\/resources\/fastgpt-cnps-global-growth-pilot-acceptance\.webp\)/);
  assert.match(enSource, /\(\/assets\/resources\/fastgpt-cnps-global-growth-release-gates\.webp\)/);
  assert.doesNotMatch(enSource.slice(0, h1), /\b\d{2,}\s*%/);
});

test('ZH and AR bodies stay unchanged (no EN first screen)', () => {
  for (const src of [zhSource, arSource]) {
    assert.doesNotMatch(src, /Start here: what this playbook gives you/);
    assert.doesNotMatch(src, /fastgpt-cnps-global-growth-release-gates/);
  }
});

test('built EN page uses new meta, kept H1, editorial og:image', () => {
  const en = path.join('dist/en/resources', slug + '.html');
  if (!fs.existsSync(en)) { assert.ok(true, 'no build output'); return; }
  const html = fs.readFileSync(en, 'utf8');
  assert.match(html, new RegExp(`<title>${esc(title)} \\| CNPS\\.AI</title>`));
  assert.match(html, new RegExp(`<meta name="description" content="${esc(description)}">`));
  assert.doesNotMatch(html, /<meta name="description" content="Complete translated edition/);
  assert.deepEqual(htmlH1s(html), [title]);
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/fastgpt-cnps-global-growth-1280\.webp">/);
  assert.match(html, /id="chapter-01"/);
  assert.match(html, /id="chapter-28"/);
});
