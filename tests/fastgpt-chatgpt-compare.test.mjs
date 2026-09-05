import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'fastgpt-vs-chatgpt-enterprise';
const route = '/en/fastgpt/compare/' + slug;
const source = fs.readFileSync(path.join('content/i18n/fastgpt-compare/en', slug + '.md'), 'utf8');
const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];

test('FastGPT vs ChatGPT compare stays a method page', () => {
  assert.ok(words.length >= 1200 && words.length <= 1800, 'word count ' + words.length);
  assert.match(source, /^# FastGPT vs ChatGPT for permissioned enterprise knowledge/m);
  for (const heading of [
    'A fair baseline — what both can do',
    'Decision matrix',
    'Permissions checklist before either pilot',
    'Citations and evidence',
    'Human review',
    'A two-week evaluate design',
    'When ChatGPT is enough — and when a FastGPT-shaped workflow fits',
    'FAQ',
    'Plan a pilot'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(source, /Need \| Generic ChatGPT/);
  assert.match(source, /Connect many SaaS via OAuth/);
  assert.match(source, /Bounded approved document set/);
  assert.match(source, /Click-through to cited chunk/);
  assert.match(source, /Human review before use/);
  assert.match(source, /Self-hosted \/ residency options/);
  assert.match(source, /One measurable workflow owner/);
  assert.match(source, /not a single accuracy number/);
  assert.match(source, /This is not “always FastGPT/);
  assert.match(source, /not independently audited/);
  assert.match(source, /written proposal/);
  assert.match(source, /\[partner\]\(\/fastgpt\)/);
  assert.match(source, /\/fastgpt\/contact/);
  assert.match(source, /\/resources\/knowledge-pilot/);
  assert.match(source, /help\.openai\.com/);
  assert.match(source, /doc\.fastgpt\.io/);
  assert.match(source, /approved product manual, revision B/);
  assert.match(source, /missing-information prompts and a clear path to a person/);
  assert.doesNotMatch(source, /win rate|win-rate of|accuracy of \d|latency of \d/i);
  assert.match(source, /no checkout/);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.match(source, /not “always FastGPT/);
  assert.doesNotMatch(source, /ChatGPT is (?:bad|worse|weak)/i);
});

test('built English compare page is in the sitemap and has no Arabic twin', () => {
  const htmlPath = path.join('dist/en/fastgpt/compare', slug + '.html');
  const sitemapPath = 'dist/sitemap.xml';
  if (!fs.existsSync(htmlPath) || !fs.existsSync(sitemapPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert.match(html, /<h1 class="wide">FastGPT vs ChatGPT for permissioned enterprise knowledge<\/h1>/);
  assert.match(html, /role="note"/);
  assert.match(html, /When to use FastGPT instead of ChatGPT for cited, reviewed answers on your documents/);
  assert.match(html, /without fake benchmarks/);
  assert.match(html, /<div class="table-scroll"/);
  assert.match(html, /href="\/en\/fastgpt"/);
  assert.match(html, /href="\/en\/fastgpt\/contact"/);
  assert.match(sitemap, new RegExp('https://www\\.cnps\\.ai' + route.replace(/\//g, '\\/')));
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/ar\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/zh\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise/);
  const arPath = path.join('dist/ar/fastgpt/compare', slug + '.html');
  assert.ok(!fs.existsSync(arPath) || /http-equiv="refresh"/.test(fs.readFileSync(arPath, 'utf8')));
  assert.doesNotMatch(html, /add to cart|buy now/i);
  assert.doesNotMatch(html, /win rate of \d|accuracy of \d/i);
});
