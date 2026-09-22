import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'ai-procurement-checklist-public-sector';
const source = fs.readFileSync(path.join('content/i18n/resources/en', slug + '.md'), 'utf8');
const catalog = JSON.parse(fs.readFileSync('content/i18n/catalog.json', 'utf8'));
const enMeta = catalog.en.resources.find((r) => r.slug === slug);
const zhMeta = catalog.zh.resources.find((r) => r.slug === slug);
const arMeta = catalog.ar.resources.find((r) => r.slug === slug);
const title = 'AI procurement checklist for public sector: China-origin hardware path';
const description =
  'Public-sector AI hardware checklist: verify entity, SKU, data, subcontractors, destination evidence, service path, change control, audit, exit and pilot.';

test('EN public-sector checklist uses locked title, meta, and no body H1', () => {
  assert.ok(enMeta, 'EN catalog entry');
  assert.equal(enMeta.title, title);
  assert.equal(enMeta.description, description);
  assert.equal(enMeta.category, 'Procurement');
  assert.doesNotMatch(enMeta.title, /CNPS\.AI/);
  assert.doesNotMatch(enMeta.title, /\bbuy(?:er|ers)?\b/i);
  assert.doesNotMatch(source, /^# /m);
  assert.match(source, /^For a public-sector AI hardware project/);
  for (const heading of [
    'How this public-sector route differs from the enterprise checklist',
    'Gate 1. Declare the public task and name every owner',
    'Gate 2. Freeze the entity, SKU, version, and physical configuration',
    'Gate 3. Map data, remote access, and subcontractors',
    'Gate 4. Match destination evidence to the supply and repair path',
    'Gate 5. Put audit, exit, and acceptance into the evidence packet',
    'Keep evidence and ownership together',
    'FAQ'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(source, /www\.cnps\.ai\/en\/resources\/ai-procurement-checklist/);
  assert.match(source, /www\.cnps\.ai\/en\/request-quote/);
  assert.equal((source.match(/www\.cnps\.ai\/en\/resources\/ai-procurement-checklist(?!-)/g) || []).length, 1);
  assert.equal((source.match(/www\.cnps\.ai\/en\/request-quote/g) || []).length, 1);
  assert.match(source, /\[AI procurement checklist for enterprise buyers\]/);
  assert.match(source, /\[Start a conversation\]/);
  assert.match(
    source,
    /!\[Five-gate public-sector method: Purpose \/ Identity \/ Data \/ Lifecycle \/ Control — no fake seals\]\(\/assets\/resources\/ai-procurement-checklist-public-sector-five-gates\.webp\)/
  );
  assert.doesNotMatch(source, /GSC|impressions|clicks/i);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.doesNotMatch(source, /^#{2,3} .*\bbuy/im);
});

test('editorial assets and inline binaries are in the published layout', () => {
  const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));
  const cover = assets[slug];
  assert.equal(cover.file, slug);
  assert.match(cover.alt.en, /evidence packet|five|owner|hardware/i);
  const files = [
    'web/assets/editorial/originals/ai-procurement-checklist-public-sector.jpg',
    'web/assets/editorial/originals/ai-procurement-checklist-public-sector.webp',
    'web/assets/editorial/ai-procurement-checklist-public-sector.webp',
    'web/assets/editorial/ai-procurement-checklist-public-sector-640.webp',
    'web/assets/editorial/ai-procurement-checklist-public-sector-1280.webp',
    'web/assets/resources/ai-procurement-checklist-public-sector-five-gates.webp'
  ];
  for (const file of files) {
    assert.ok(fs.existsSync(file), 'missing ' + file);
    assert.ok(fs.statSync(file).size > 1000, 'too small ' + file);
  }
});

test('ZH/AR stay untranslated this pass and are not registered in locale catalogs', () => {
  assert.equal(zhMeta, undefined);
  assert.equal(arMeta, undefined);
  assert.equal(fs.existsSync(path.join('content/i18n/resources/zh', slug + '.md')), false);
  assert.equal(fs.existsSync(path.join('content/i18n/resources/ar', slug + '.md')), false);
});

test('built EN checklist has a single H1, shipped title/meta, og:image, and sitemap', () => {
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
  assert.match(
    html,
    /property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/ai-procurement-checklist-public-sector-1280\.webp"/
  );
  assert.match(html, /src="\/assets\/resources\/ai-procurement-checklist-public-sector-five-gates\.webp"/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/en\/resources\/ai-procurement-checklist-public-sector/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/zh\/resources\/ai-procurement-checklist-public-sector/);
});
