import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// O09 (2026-10-21 Asia/Shanghai): CTR refresh of the EN-only public-sector checklist.
const slug = 'ai-procurement-checklist-public-sector';
const src = fs.readFileSync(path.join('content/i18n/resources/en', slug + '.md'), 'utf8');
const mirror = fs.readFileSync(path.join('content/resources', slug + '.md'), 'utf8');
const catalog = JSON.parse(fs.readFileSync('content/i18n/catalog.json', 'utf8'));
const meta = catalog.en.resources.find((r) => r.slug === slug);
const title = 'AI procurement checklist for public sector: China-origin hardware path';
const description =
  'AI procurement checklist for public sector: five evidence gates for China-origin hardware — owners, exact SKU, data, destination, audit, exit and pilot.';
// Live H1s fetched 2026-10-21.
const anchors = {
  'https://www.cnps.ai/en/resources/ai-procurement-checklist': 'AI procurement checklist for enterprise buyers',
  'https://www.cnps.ai/en/request-quote': 'Request a quotation for devices or a pilot.',
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const links = (md) => [...md.matchAll(/(?<!!)\[([^\]]+)\]\(([^)\s]+)\)/g)].map((m) => ({ text: m[1], href: m[2] }));

test('title unchanged; method-led meta echoes the query, ≤160, no buy wording', () => {
  assert.equal(meta.title, title);
  assert.equal(meta.description, description);
  assert.ok(description.length <= 160, 'meta ' + description.length);
  assert.ok(description.startsWith('AI procurement checklist for public sector'));
  assert.doesNotMatch(description, /\bbuy(ing|er|ers)?\b/i);
  assert.match(fs.readFileSync('content/catalog.mjs', 'utf8'), new RegExp(esc(description)));
});

test('mirror identical; glance is the first H2 with a five-gate table, review date and hold rule', () => {
  assert.equal(mirror, src);
  const h2 = [...src.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.equal(h2[0], 'Public-sector method glance');
  assert.equal(h2[1], 'How this public-sector route differs from the enterprise checklist');
  const glance = src.slice(src.indexOf('## Public-sector method glance'), src.indexOf('## How this public-sector'));
  for (const g of ['1. Purpose', '2. Identity', '3. Data', '4. Lifecycle', '5. Control']) assert.match(glance, new RegExp('\\| ' + esc(g) + ' \\|'));
  assert.match(glance, /reviewed on 21 October 2026/);
  assert.match(glance, /hold, not a pass/);
  assert.match(glance, /ai-procurement-checklist-public-sector-five-gates\.webp/);
  assert.equal((src.match(/five-gates\.webp/g) || []).length, 1);
});

test('every body anchor equals the live target H1 and each href appears once', () => {
  const all = links(src);
  const hrefs = all.map((x) => x.href);
  assert.equal(new Set(hrefs).size, hrefs.length, 'duplicate href');
  for (const { text, href } of all) {
    assert.ok(anchors[href], 'unexpected link ' + href);
    assert.equal(text, anchors[href]);
  }
  for (const h of Object.keys(anchors)) assert.ok(hrefs.includes(h), 'missing ' + h);
  assert.doesNotMatch(src, /\[Start a conversation\]/);
});

test('evidence-owners inline diagram is placed in the evidence section and exists', () => {
  const i = src.indexOf('## Keep evidence and ownership together');
  const j = src.indexOf('## FAQ');
  assert.ok(src.slice(i, j).includes('/assets/resources/ai-procurement-checklist-public-sector-evidence-owners.webp'));
  const f = 'web/assets/resources/ai-procurement-checklist-public-sector-evidence-owners.webp';
  assert.ok(fs.existsSync(f) && fs.statSync(f).size > 1000);
});

test('built EN page: H1 unchanged, new meta, editorial og, glance before Gate 1, both images', () => {
  const file = path.join('dist/en/resources', slug + '.html');
  if (!fs.existsSync(file)) return;
  const html = fs.readFileSync(file, 'utf8');
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
  assert.deepEqual(h1s, [title]);
  assert.ok(html.includes(`<meta name="description" content="${description}">`) || html.includes(description.replace(/—/g, '&mdash;')));
  assert.match(html, /property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/ai-procurement-checklist-public-sector-1280\.webp"/);
  const g = html.indexOf('Public-sector method glance</h2>');
  const g1 = html.indexOf('Gate 1. Declare the public task');
  assert.ok(g > 0 && g1 > g);
  assert.match(html, /evidence-owners\.webp/);
  assert.match(html, /five-gates\.webp/);
  assert.match(html, /<table/);
});
