import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'uae-ksa-edge-ai-site-readiness';
const source = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((g) => g.slug === slug);
const vercel = fs.readFileSync('vercel.json', 'utf8');
const survey = fs.readFileSync('content/i18n/resources/en/edge-ai-survey.md', 'utf8');
const checklist = fs.readFileSync('content/i18n/resources/en/ai-procurement-checklist.md', 'utf8');

test('UAE/KSA edge AI site readiness guide stays a method page', () => {
  assert.ok(words.length >= 1000 && words.length <= 1500, 'word count ' + words.length);
  assert.ok(meta, 'guides.json entry');
  assert.deepEqual(meta.locales, ['en']);
  assert.equal(meta.title.en, 'UAE/KSA edge AI site readiness before you pick a box');
  assert.equal(meta.h1.en, 'UAE/KSA edge AI site readiness before you pick a box');
  assert.match(meta.description.en, /Map lighting, FOV, network, power, latency budget, and who reviews exceptions/);
  assert.match(source, /^# UAE\/KSA edge AI site readiness before you pick a box/m);
  assert.match(source, /Map scene, connectivity, power, and who reviews exceptions on the real UAE\/KSA site before selecting edge hardware or signing acceptance\./);
  assert.match(source, /Gulf-named readiness checklist/);
  assert.match(source, /not legal advice/);
  assert.match(source, /not a PDPL opinion/);
  for (const heading of [
    'Why the site beats the model brochure',
    'Checklist: lighting, FOV, network, power, latency budget',
    'Privacy and exception review',
    'Acceptance test on the real site',
    'When to stop / rescope',
    'Related reading and next conversation'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(source, /\*\*Lighting\.\*\*/);
  assert.match(source, /\*\*FOV\.\*\*/);
  assert.match(source, /\*\*Network\.\*\*/);
  assert.match(source, /\*\*Power\.\*\*/);
  assert.match(source, /\*\*Latency budget\.\*\*/);
  assert.match(source, /will not invent a latency number/);
  assert.match(source, /who sees alerts/);
  assert.match(source, /Inference location/);
  assert.match(source, /Escalate answers to counsel/);
  assert.match(source, /\/resources\/edge-ai-survey/);
  assert.match(source, /\/blogs\/edge-ai-start-with-the-site/);
  assert.match(source, /\[explore a partnership\]\(\/wholesale\)/);
  assert.match(source, /\[request a quotation\]\(\/request-quote\?solution=edge-vision\)/);
  assert.match(source, /\[contact CNPS\]\(\/contact\)/);
  assert.match(source, /does not run checkout/);
  assert.match(survey, /\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.match(checklist, /\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.match(vercel, /"source": "\/zh\/guides\/:path\*"/);
  assert.match(vercel, /"destination": "\/en\/guides\/:path\*"/);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.doesNotMatch(source, /latency of \d|within \d+\s*ms|#1 in (the )?Gulf|market share/i);
  assert.doesNotMatch(source, /PDPL (requires|mandates|prohibits|applies)|complies with PDPL|PDPL-compliant/i);
  assert.doesNotMatch(source, /Hailo|Jetson league|best edge box|NVIDIA ranking/i);
});

test('built English edge readiness guide is in the sitemap and has no Arabic twin', () => {
  const htmlPath = path.join('dist/en/guides', slug + '.html');
  const sitemapPath = 'dist/sitemap.xml';
  if (!fs.existsSync(htmlPath) || !fs.existsSync(sitemapPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert.match(html, /<h1 class="wide">UAE\/KSA edge AI site readiness before you pick a box<\/h1>/);
  assert.match(html, /role="note"/);
  assert.match(html, /Map lighting, FOV, network, power, latency budget, and who reviews exceptions/);
  assert.match(html, /href="\/en\/resources\/edge-ai-survey"/);
  assert.match(html, /href="\/en\/blogs\/edge-ai-start-with-the-site"/);
  assert.match(html, /href="\/en\/wholesale"/);
  assert.match(html, /href="\/en\/request-quote\?solution=edge-vision"/);
  assert.match(html, /href="\/en\/contact"/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/en\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/ar\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/zh\/guides\/uae-ksa-edge-ai-site-readiness/);
  const arPath = path.join('dist/ar/guides', slug + '.html');
  const zhPath = path.join('dist/zh/guides', slug + '.html');
  assert.ok(fs.existsSync(arPath) && /http-equiv="refresh"/.test(fs.readFileSync(arPath, 'utf8')));
  assert.ok(fs.existsSync(zhPath) && /http-equiv="refresh"/.test(fs.readFileSync(zhPath, 'utf8')));
  assert.doesNotMatch(html, /add to cart|buy now/i);
  assert.doesNotMatch(html, /latency of \d|within \d+\s*ms/i);
});
