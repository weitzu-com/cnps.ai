import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'china-to-gulf-ai-recording-sourcing';
const source = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((g) => g.slug === slug);
const vercel = fs.readFileSync('vercel.json', 'utf8');
const checklist = fs.readFileSync('content/i18n/resources/en/ai-procurement-checklist.md', 'utf8');
const wholesale = JSON.parse(fs.readFileSync('content/i18n/legacy-pages.json', 'utf8')).find((p) => p.path === '/wholesale');
const playbook = fs.readFileSync('content/i18n/reports/china-ai-export-playbook.en.md', 'utf8');

test('China→Gulf AI recording sourcing guide stays a method page', () => {
  assert.ok(words.length >= 1200 && words.length <= 1800, 'word count ' + words.length);
  assert.ok(meta, 'guides.json entry');
  assert.deepEqual(meta.locales, ['en']);
  assert.equal(meta.title, 'Source China AI recording hardware for UAE/KSA without skipping the pilot');
  assert.equal(meta.h1, 'Source China AI recording hardware for UAE/KSA without skipping the pilot');
  assert.match(meta.description, /Define the workflow, score China vendors on processing location and Gulf support/);
  assert.match(source, /^# Source China AI recording hardware for UAE\/KSA without skipping the pilot/m);
  assert.match(source, /A Gulf team sourcing China AI recording hardware for UAE\/KSA should lock the workflow/);
  assert.match(source, /Retail TicNote pages are for single-unit shoppers/);
  for (const heading of [
    'Define the job before the PO',
    'Vendor evaluation checklist',
    'Sample before scale',
    'Delivery responsibilities',
    'Retail shop vs sourcing conversation',
    'FAQ',
    'Explore a partnership'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(source, /Box vs app vs cloud/);
  assert.match(source, /Processing location/);
  assert.match(source, /Residency option/);
  assert.match(source, /Training opt-out/);
  assert.match(source, /test, do not trust the brochure/);
  assert.match(source, /Support, spares, warranty, RMA into the Gulf/);
  assert.match(source, /Firmware and account admin/);
  assert.match(source, /www\.cnps\.ai\/en\/guides\/gulf-arabic-english-meeting-notes-pilot/);
  assert.match(source, /www\.cnps\.ai\/en\/guides\/gulf-meeting-consent-and-privacy-test/);
  assert.match(source, /shop\.cnps\.ai\/collections\/all-ticnote-products/);
  assert.match(source, /\[explore a partnership\]\(\/wholesale\)/);
  assert.match(source, /\[request a quotation\]\(\/request-quote\?solution=meeting-ai\)/);
  assert.match(source, /\[contact CNPS\]\(\/contact\)/);
  assert.match(source, /partnership sourcing method, not a product catalog/);
  assert.match(source, /does not run checkout/);
  assert.match(source, /will not invent a number/);
  assert.doesNotMatch(source, /#1 in (the )?Gulf|market share|WER\s*\d|word-error rate of \d/i);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.doesNotMatch(source, /duty rate of \d|tariff of \d|lead time of \d|ships in \d+ (days|weeks)/i);
  assert.doesNotMatch(source, /Munsit|MeetriX|CallScribe|Voiquyr|Spinach|Fellow|#1|best Arabic/i);
  assert.match(checklist, /\/guides\/china-to-gulf-ai-recording-sourcing/);
  assert.match(wholesale.body.en, /\/guides\/china-to-gulf-ai-recording-sourcing/);
  assert.match(playbook, /china-to-gulf-ai-recording-sourcing/);
  assert.match(vercel, /"source": "\/zh\/guides\/:path\*"/);
  assert.match(vercel, /"destination": "\/en\/guides\/:path\*"/);
  assert.match(vercel, /"source": "\/ar\/guides\/:path\*"/);
});

test('built English sourcing guide is in the sitemap and has no Arabic twin', () => {
  const htmlPath = path.join('dist/en/guides', slug + '.html');
  const sitemapPath = 'dist/sitemap.xml';
  if (!fs.existsSync(htmlPath) || !fs.existsSync(sitemapPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert.match(html, /<h1 class="wide">Source China AI recording hardware for UAE\/KSA without skipping the pilot<\/h1>/);
  assert.match(html, /role="note"/);
  assert.match(html, /Define the workflow, score China vendors on processing location and Gulf support/);
  assert.match(html, /shop\.cnps\.ai\/collections\/all-ticnote-products/);
  assert.match(html, /href="\/en\/wholesale"/);
  assert.match(html, /href="\/en\/request-quote\?solution=meeting-ai"/);
  assert.match(html, /href="\/en\/contact"/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/en\/guides\/china-to-gulf-ai-recording-sourcing/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/ar\/guides\/china-to-gulf-ai-recording-sourcing/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/zh\/guides\/china-to-gulf-ai-recording-sourcing/);
  const arPath = path.join('dist/ar/guides', slug + '.html');
  const zhPath = path.join('dist/zh/guides', slug + '.html');
  assert.ok(!fs.existsSync(arPath) || /http-equiv="refresh"/.test(fs.readFileSync(arPath, 'utf8')));
  assert.ok(!fs.existsSync(zhPath) || /http-equiv="refresh"/.test(fs.readFileSync(zhPath, 'utf8')));
  assert.doesNotMatch(html, /add to cart|buy now/i);
  assert.doesNotMatch(html, /WER\s*\d/);
});
