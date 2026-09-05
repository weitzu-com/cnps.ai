import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'gulf-arabic-english-meeting-notes-pilot';
const source = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];

test('Gulf meeting-notes guide stays a method page', () => {
  assert.ok(words.length >= 1400 && words.length <= 2000, 'word count ' + words.length);
  assert.match(source, /^# Run a Gulf Arabic–English meeting-notes pilot in two weeks/m);
  for (const heading of [
    'What “done” looks like',
    'Week 0 — Consent and privacy gate',
    'Week 1 — Capture design',
    'Scorecard: Arabic, English, and mid-sentence switches',
    'Notes become action items',
    'Gulf-specific checks',
    'Copy-paste checklist',
    'FAQ'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.doesNotMatch(source, /#1 in (the )?Gulf|market share|WER\s*\d|word-error rate of \d/i);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.match(source, /shop\.cnps\.ai\/collections\/all-ticnote-products/);
  assert.match(source, /not legal counsel|not an opinion on PDPL/i);
  assert.match(source, /runnable two-week pilot protocol, not another Arabic note-taker list/);
  assert.doesNotMatch(source, /Munsit|MeetriX|CallScribe|Voiquyr|Spinach|Fellow|#1|best Arabic/i);
  assert.match(source, /covert recording/);
  assert.match(source, /Pods or Lite/);
});

test('built English guide is in the sitemap and has no Arabic twin', () => {
  const htmlPath = path.join('dist/en/guides', slug + '.html');
  const sitemapPath = 'dist/sitemap.xml';
  if (!fs.existsSync(htmlPath) || !fs.existsSync(sitemapPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert.match(html, /<h1 class="wide">Run a Gulf Arabic–English meeting-notes pilot in two weeks<\/h1>/);
  assert.match(html, /role="note"/);
  assert.match(html, /Gulf Arabic–English meeting-notes pilot: consent, quality, action items/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/en\/guides\/gulf-arabic-english-meeting-notes-pilot/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/ar\/guides\/gulf-arabic-english-meeting-notes-pilot/);
  assert.ok(!fs.existsSync(path.join('dist/ar/guides', slug + '.html')) || /http-equiv="refresh"/.test(fs.readFileSync(path.join('dist/ar/guides', slug + '.html'), 'utf8')));
  assert.doesNotMatch(html, /WER\s*\d/);
  assert.doesNotMatch(html, /add to cart|buy now/i);
});
