import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'uae-first-pilot-documents-and-workflow';
const route = '/en/fastgpt/guides/' + slug;
const source = fs.readFileSync(path.join('content/i18n/fastgpt-guides/en', slug + '.md'), 'utf8');
const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
const guides = JSON.parse(fs.readFileSync('content/i18n/fastgpt-guides.json', 'utf8')).guides;
const meta = guides.find((g) => g.slug === slug);
const vercel = fs.readFileSync('vercel.json', 'utf8');
const hub = JSON.parse(fs.readFileSync('content/i18n/fastgpt-pages.json', 'utf8')).find((p) => p.path === '/fastgpt');
const knowledge = fs.readFileSync('content/i18n/resources/en/knowledge-pilot.md', 'utf8');

test('UAE FastGPT first-pilot guide stays a method page', () => {
  assert.ok(words.length >= 1200 && words.length <= 1600, 'word count ' + words.length);
  assert.ok(meta, 'fastgpt-guides.json entry');
  assert.deepEqual(meta.locales, ['en']);
  assert.equal(meta.title, 'Pick documents and one workflow for a UAE FastGPT first pilot');
  assert.equal(meta.h1, 'Pick documents and one workflow for a UAE FastGPT first pilot');
  assert.match(meta.description, /Choose one approved corpus, one measurable workflow, and a hard-question set/);
  assert.match(source, /^# Pick documents and one workflow for a UAE FastGPT first pilot/m);
  assert.match(source, /Name one owner, one approved corpus, one workflow, and a hard-question set before any FastGPT build; measure checked answers, not first drafts\./);
  for (const heading of [
    'What “one measurable workflow” means',
    'Document set rules',
    'Three starter workflows with pass rules',
    'Hard-question set',
    'Measures',
    'When to stay on ChatGPT company knowledge instead',
    'FAQ',
    'Plan a pilot'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(source, /### Manual lookup/);
  assert.match(source, /### Support handoff/);
  assert.match(source, /### RFQ brief/);
  assert.match(source, /\*\*Approved\.\*\*/);
  assert.match(source, /\*\*Versioned\.\*\*/);
  assert.match(source, /\*\*Permissioned\.\*\*/);
  assert.match(source, /\*\*Routine\.\*\*/);
  assert.match(source, /\*\*Missing evidence\.\*\*/);
  assert.match(source, /\*\*Access tests\.\*\*/);
  assert.match(source, /Correctness under review/);
  assert.match(source, /Review minutes/);
  assert.match(source, /Access incidents/);
  assert.match(source, /Cost drivers/);
  assert.match(source, /not independently audited/);
  assert.match(source, /no checkout/);
  assert.match(source, /written proposal/);
  assert.match(source, /\[partner\]\(\/fastgpt\)/);
  assert.match(source, /\/fastgpt\/contact/);
  assert.match(source, /\/resources\/knowledge-pilot/);
  assert.match(source, /\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise/);
  assert.match(source, /\/fastgpt\/solutions\/technical-knowledge/);
  assert.match(source, /\/fastgpt\/solutions\/support-triage/);
  assert.match(source, /\/fastgpt\/solutions\/rfq-intake/);
  assert.match(source, /This is not “always FastGPT/);
  assert.match(source, /checked answers, not first drafts/);
  assert.doesNotMatch(source, /win rate|win-rate of|accuracy of \d|latency of \d/i);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.match(hub.body.en, /\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.match(hub.body.zh, /\/en\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.match(hub.body.ar, /\/en\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.match(knowledge, /\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.match(vercel, /"source": "\/fastgpt\/guides\/:path\*"/);
  assert.match(vercel, /"destination": "\/en\/fastgpt\/guides\/:path\*"/);
  assert.match(vercel, /"source": "\/zh\/fastgpt\/guides\/:path\*"/);
  assert.match(vercel, /"source": "\/ar\/fastgpt\/guides\/:path\*"/);
});

test('built English FastGPT guide is in the sitemap and has no Arabic twin', () => {
  const htmlPath = path.join('dist/en/fastgpt/guides', slug + '.html');
  const sitemapPath = 'dist/sitemap.xml';
  if (!fs.existsSync(htmlPath) || !fs.existsSync(sitemapPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert.match(html, /<h1 class="wide">Pick documents and one workflow for a UAE FastGPT first pilot<\/h1>/);
  assert.match(html, /role="note"/);
  assert.match(html, /Choose one approved corpus, one measurable workflow, and a hard-question set/);
  assert.match(html, /href="\/en\/fastgpt"/);
  assert.match(html, /href="\/en\/fastgpt\/contact"/);
  assert.match(html, /href="\/en\/resources\/knowledge-pilot"/);
  assert.match(html, /href="\/en\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise"/);
  assert.match(sitemap, new RegExp('https://www\\.cnps\\.ai' + route.replace(/\//g, '\\/')));
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/ar\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/zh\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  const arPath = path.join('dist/ar/fastgpt/guides', slug + '.html');
  const zhPath = path.join('dist/zh/fastgpt/guides', slug + '.html');
  assert.ok(!fs.existsSync(arPath) || /http-equiv="refresh"/.test(fs.readFileSync(arPath, 'utf8')));
  assert.ok(!fs.existsSync(zhPath) || /http-equiv="refresh"/.test(fs.readFileSync(zhPath, 'utf8')));
  assert.doesNotMatch(html, /add to cart|buy now/i);
  assert.doesNotMatch(html, /win rate of \d|accuracy of \d/i);
});
