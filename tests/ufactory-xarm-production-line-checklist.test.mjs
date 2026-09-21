import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'ufactory-xarm-production-line-checklist';
const source = fs.readFileSync(path.join('content/i18n/resources/en', slug + '.md'), 'utf8');
const catalog = JSON.parse(fs.readFileSync('content/i18n/catalog.json', 'utf8'));
const enMeta = catalog.en.resources.find((r) => r.slug === slug);
const zhMeta = catalog.zh.resources.find((r) => r.slug === slug);
const arMeta = catalog.ar.resources.find((r) => r.slug === slug);
const title = 'UFACTORY xArm production line checklist for overseas teams';
const description =
  'Overseas xArm production-line checklist: freeze workcell, mounting, workspace, payload/reach fields, SDK path, site safety — not a lab certificate.';

test('EN xArm production-line checklist uses locked title, meta, and no body H1', () => {
  assert.ok(enMeta, 'EN catalog entry');
  assert.equal(enMeta.title, title);
  assert.equal(enMeta.description, description);
  assert.equal(enMeta.category, 'Hardware');
  assert.doesNotMatch(enMeta.title, /CNPS\.AI/);
  assert.doesNotMatch(source, /^# /m);
  assert.match(source, /^You are preparing a UFACTORY xArm for an overseas production line/);
  for (const heading of [
    'Who this checklist is for',
    '1. Freeze the line task and the workcell — not only the arm',
    '2. Mounting surface and base fix',
    '3. Define working space for the station',
    '4. Payload, reach and tooling — fields to confirm',
    '5. SDK and permissions — point to the parent path',
    '6. Safety assessment — site owner, not a lab certificate',
    '7. Supervised acceptance before you call the cell line-ready',
    'What this page will not invent',
    'FAQ'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(source, /www\.cnps\.ai\/en\/case-studies\/ufactory-xarm/);
  assert.match(source, /www\.cnps\.ai\/en\/resources\/robotics-procurement/);
  assert.match(source, /www\.cnps\.ai\/en\/request-quote/);
  assert.equal((source.match(/www\.cnps\.ai\/en\/case-studies\/ufactory-xarm/g) || []).length, 1);
  assert.equal((source.match(/www\.cnps\.ai\/en\/resources\/robotics-procurement/g) || []).length, 1);
  assert.equal((source.match(/www\.cnps\.ai\/en\/request-quote/g) || []).length, 1);
  assert.match(source, /\[UFACTORY xArm: specify the workcell, not just the arm\]/);
  assert.match(source, /\[Robotics procurement: configuration and SDK access\]/);
  assert.match(source, /\[Start a conversation\]/);
  assert.match(
    source,
    /!\[Four-step readiness strip — mount \/ workspace \/ confirm \/ safety — no fake seals\]\(\/assets\/resources\/ufactory-xarm-production-line-checklist-steps\.webp\)/
  );
  assert.match(
    source,
    /!\[Supply vs Site ownership — method diagram\]\(\/assets\/resources\/ufactory-xarm-production-line-checklist-owners\.webp\)/
  );
  assert.doesNotMatch(source, /\b\d+\s*kg\b|\b\d+\s*mm\b|\b\d+\s*%\b/i);
  assert.doesNotMatch(source, /GSC|impressions|clicks/i);
  assert.doesNotMatch(source, /CNPS(?:'s| is| are)? UFACTORY|UFACTORY partner|official partner/i);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.doesNotMatch(source, /^#{2,3} .*\bbuy/im);
});

test('editorial assets and inline binaries are in the published layout', () => {
  const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));
  const cover = assets[slug];
  assert.equal(cover.file, slug);
  assert.match(cover.alt.en, /production-line freeze method, no certificates/);
  const files = [
    'web/assets/editorial/originals/ufactory-xarm-production-line-checklist.jpg',
    'web/assets/editorial/originals/ufactory-xarm-production-line-checklist.webp',
    'web/assets/editorial/ufactory-xarm-production-line-checklist.webp',
    'web/assets/editorial/ufactory-xarm-production-line-checklist-640.webp',
    'web/assets/editorial/ufactory-xarm-production-line-checklist-1280.webp',
    'web/assets/resources/ufactory-xarm-production-line-checklist-steps.webp',
    'web/assets/resources/ufactory-xarm-production-line-checklist-owners.webp'
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
  assert.match(html, /<title>UFACTORY xArm production line checklist for overseas teams \| CNPS\.AI<\/title>/);
  assert.doesNotMatch(html, /<title>[^<]*\| CNPS\.AI \| CNPS\.AI<\/title>/);
  assert.match(
    html,
    new RegExp('<meta name="description" content="' + description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '">')
  );
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\/resources\/ufactory-xarm-production-line-checklist">/);
  assert.match(html, /www\.cnps\.ai\/en\/case-studies\/ufactory-xarm/);
  assert.match(html, /www\.cnps\.ai\/en\/resources\/robotics-procurement/);
  assert.match(html, /www\.cnps\.ai\/en\/request-quote/);
  assert.match(
    html,
    /property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/ufactory-xarm-production-line-checklist-1280\.webp"/
  );
  assert.match(html, /src="\/assets\/resources\/ufactory-xarm-production-line-checklist-steps\.webp"/);
  assert.match(html, /src="\/assets\/resources\/ufactory-xarm-production-line-checklist-owners\.webp"/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/en\/resources\/ufactory-xarm-production-line-checklist/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/zh\/resources\/ufactory-xarm-production-line-checklist/);
  assert.doesNotMatch(html, /add to cart|buy now/i);
  const zhRedirect = 'dist/zh/resources/' + slug + '.html';
  const arRedirect = 'dist/ar/resources/' + slug + '.html';
  assert.ok(fs.existsSync(zhRedirect), 'ZH stub redirect');
  assert.ok(fs.existsSync(arRedirect), 'AR stub redirect');
  assert.match(fs.readFileSync(zhRedirect, 'utf8'), /url=\/en\/resources\/ufactory-xarm-production-line-checklist/);
  assert.match(fs.readFileSync(arRedirect, 'utf8'), /url=\/en\/resources\/ufactory-xarm-production-line-checklist/);
});
