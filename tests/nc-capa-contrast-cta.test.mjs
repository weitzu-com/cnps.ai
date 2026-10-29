import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ui} from '../web/ui.mjs';

function channel(hex, i) {
  const c = parseInt(hex.slice(i, i + 2), 16) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function contrast(fg, bg) {
  const lum = hex => 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
  const a = lum(fg);
  const b = lum(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const site = fs.readFileSync('web/assets/site.css', 'utf8');
const experience = fs.readFileSync('web/assets/experience.css', 'utf8');
const visuals = fs.readFileSync('web/assets/semantic-visuals.css', 'utf8');
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const inquiry = JSON.parse(fs.readFileSync('content/i18n/inquiry-pages.json', 'utf8'));

test('NC-01 muted token meets WCAG 2 AA on the sampled surfaces', () => {
  const match = site.match(/--muted:(#[0-9a-fA-F]{6})/);
  assert.ok(match, 'site.css defines --muted');
  const fg = match[1].toLowerCase();
  assert.equal(fg, '#506a78');
  const surfaces = {
    'page-hero / journal #e6eef1': '#e6eef1',
    'experience section #e7eff2': '#e7eff2',
    'semantic visual #edf3f4': '#edf3f4',
    'document #e9eff1': '#e9eff1',
    'document global #dae9ed': '#dae9ed',
    'document robot #e5eaf0': '#e5eaf0',
    'paper #f3f7f8': '#f3f7f8',
    'white': '#ffffff',
  };
  for (const [name, bg] of Object.entries(surfaces)) {
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= 4.5, `${name} ratio ${ratio.toFixed(3)} is below 4.5`);
  }
  assert.match(site, /\.step-number\{[^}]*color:var\(--muted\)/);
  assert.match(experience, /\.workflow-steps span\{[^}]*color:var\(--muted\)/);
  assert.match(visuals, /\.sv-heading\{[^}]*color:var\(--muted\)/);
  assert.match(visuals, /\.sv-document-top\{[^}]*color:var\(--muted\)/);
  assert.match(visuals, /\.sv-document-kind\{[^}]*color:var\(--muted\)!important/);
  assert.doesNotMatch(site + experience + visuals, /#56707e|#77a3af|#488192|#557986|#577681|#526f7c/i);
});

test('NC-07 quote chrome matches the request-quote H1; contact copy stays on contact', () => {
  for (const loc of ['en', 'zh', 'ar', 'ru', 'kk']) {
    assert.equal(ui(loc).quote, inquiry['/request-quote'].h1[loc]);
  }
  assert.equal(ui('en').contact, 'Start a conversation');
  assert.match(build, /link\(l,'\/request-quote',t\.quote,'btn aqua header-cta'\)/);
  assert.match(build, /function cta\(l\)\{[\s\S]*link\(l,'\/request-quote',t\.quote\)/);
  assert.match(build, /aria-label="\$\{t\.language\}: \$\{languageNames\[l\]\}"/);
  assert.match(build, /\['\/contact',t\.contact\]/);
  assert.doesNotMatch(build, /request-quote[^'\n]{0,90}t\.contact/);
  assert.doesNotMatch(build, /t\.contact[^'\n]{0,40}request-quote/);
});

test('NC-07 English checklist and playbook quote links use the live H1', () => {
  const checklist = fs.readFileSync('content/i18n/resources/en/ai-procurement-checklist.md', 'utf8');
  const mirror = fs.readFileSync('content/resources/ai-procurement-checklist.md', 'utf8');
  const playbook = fs.readFileSync('content/i18n/reports/china-ai-export-playbook.en.md', 'utf8');
  const anchor = '[Request a quotation for devices or a pilot.](https://www.cnps.ai/en/request-quote)';
  assert.equal(checklist, mirror);
  assert.match(checklist, new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(playbook, new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(checklist, /\[Start a conversation\]/);
  assert.doesNotMatch(playbook, /\[Start a conversation\]/);
});
