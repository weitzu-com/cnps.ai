import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'ai-procurement-checklist';
const source = fs.readFileSync(path.join('content/i18n/resources/en', slug + '.md'), 'utf8');
const zhSource = fs.readFileSync(path.join('content/i18n/resources/zh', slug + '.md'), 'utf8');
const arSource = fs.readFileSync(path.join('content/i18n/resources/ar', slug + '.md'), 'utf8');
const catalog = JSON.parse(fs.readFileSync('content/i18n/catalog.json', 'utf8'));
const enMeta = catalog.en.resources.find((r) => r.slug === slug);
const zhMeta = catalog.zh.resources.find((r) => r.slug === slug);
const arMeta = catalog.ar.resources.find((r) => r.slug === slug);
const title = 'AI procurement checklist for enterprise buyers';
const description = 'China→buyer AI procurement checklist: freeze the job, match evidence to SKU and region, price TCO, pilot with acceptance, then enquire — CNPS.AI method.';

test('EN AI procurement checklist uses GSC title, meta, and China→buyer body', () => {
  assert.ok(enMeta, 'EN catalog entry');
  assert.equal(enMeta.title, title);
  assert.equal(enMeta.description, description);
  assert.doesNotMatch(enMeta.title, /CNPS\.AI/);
  assert.doesNotMatch(source, /^# /m);
  assert.match(source, /^Define the business task, the evidence you will trust/);
  for (const heading of [
    'Who this checklist is for',
    'The eight China → buyer steps',
    'China-origin supplier vs generic AI checklist',
    'FAQ',
    'Next step'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  for (const heading of [
    '1. Freeze the job — not the model name',
    '2. Ask for evidence that matches the decision',
    '3. Lock SKU, region, version, and subscription ownership',
    '4. Compare the whole quotation (TCO), not the device line',
    '5. Name compliance and trust documents early',
    '6. Agree a small, useful pilot before a bulk PO',
    '7. Map support, repair, and delivery responsibilities',
    '8. Send an enquiry that sales can quote'
  ]) assert.match(source, new RegExp('^### ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(source, /www\.cnps\.ai\/en\/guides\/china-to-gulf-ai-recording-sourcing/);
  assert.match(source, /www\.cnps\.ai\/en\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.match(source, /www\.cnps\.ai\/en\/resources\/china-ai-export-playbook/);
  assert.match(source, /shop\.cnps\.ai\/collections\/all-ticnote-products/);
  assert.match(source, /www\.cnps\.ai\/en\/request-quote/);
  assert.match(source, /\[CNPS\.AI\]\(https:\/\/www\.cnps\.ai\/\)/);
  assert.match(source, /sales@cnps\.ai/);
  assert.match(source, /\+86 183 5463 9099/);
  assert.doesNotMatch(source, /enquiry volumes|accuracy %|word-error rate of \d/i);
  assert.doesNotMatch(source, /ISO 27001 certified|we hold FCC|we hold CE/i);
  assert.doesNotMatch(source, /The business buyer’s AI procurement checklist/);
});

test('ZH/AR procurement checklist twins stay on prior copy until a later locale pass', () => {
  assert.equal(zhMeta.title, '企业买家的 AI 采购清单');
  assert.equal(arMeta.title, 'قائمة شراء الذكاء الاصطناعي للمشتري المؤسسي');
  assert.match(zhSource, /^# 企业买家的 AI 采购清单/m);
  assert.match(arSource, /^# قائمة شراء الذكاء الاصطناعي للمشتري المؤسسي/m);
  assert.doesNotMatch(zhSource, /Define the business task, the evidence you will trust/);
  assert.doesNotMatch(arSource, /Define the business task, the evidence you will trust/);
});

test('built EN checklist has a single H1, shipped title/meta, and required links', () => {
  const htmlPath = path.join('dist/en/resources', slug + '.html');
  const sitemapPath = 'dist/sitemap.xml';
  if (!fs.existsSync(htmlPath) || !fs.existsSync(sitemapPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) =>
    m[1].replace(/<[^>]+>/g, '').trim()
  );
  assert.equal(h1s.length, 1, 'h1 count ' + JSON.stringify(h1s));
  assert.equal(h1s[0], title);
  assert.match(html, /<title>AI procurement checklist for enterprise buyers \| CNPS\.AI<\/title>/);
  assert.doesNotMatch(html, /<title>[^<]*\| CNPS\.AI \| CNPS\.AI<\/title>/);
  assert.match(html, new RegExp('<meta name="description" content="' + description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '">'));
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\/resources\/ai-procurement-checklist">/);
  assert.match(html, /www\.cnps\.ai\/en\/guides\/china-to-gulf-ai-recording-sourcing/);
  assert.match(html, /www\.cnps\.ai\/en\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.match(html, /www\.cnps\.ai\/en\/resources\/china-ai-export-playbook/);
  assert.match(html, /shop\.cnps\.ai\/collections\/all-ticnote-products/);
  assert.match(html, /www\.cnps\.ai\/en\/request-quote/);
  assert.match(html, /href="\/en"/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/en\/resources\/ai-procurement-checklist/);
  assert.doesNotMatch(html, /The business buyer’s AI procurement checklist/);
  assert.doesNotMatch(html, /add to cart|buy now/i);
});
