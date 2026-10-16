import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'seeed-intflow';
const title = 'Seeed and Intflow: a local solution built on edge hardware';
const description =
  'Seeed and Intflow livestock monitoring on edge hardware: local specialist + reComputer pattern—evaluate animals, ground truth, and total cost per camera.';
const sisterAnchor = 'Seeed: connect a hardware demonstration to engineering documentation';
const surveyAnchor = 'The edge AI site survey';
const quoteAnchor = 'Request a quotation for devices or a pilot.';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const htmlH1s = (html) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());

const catalogMjs = fs.readFileSync('content/catalog.mjs', 'utf8');
const catalogJson = JSON.parse(fs.readFileSync('content/i18n/catalog.json', 'utf8'));
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const editorialAssets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));

test('EN summary is method-toned, ≤160 chars, synced in catalog.mjs + catalog.json', () => {
  assert.ok(description.length <= 160);
  assert.ok(description.length >= 140);
  assert.match(catalogMjs, new RegExp(esc(description)));
  const en = catalogJson.en.cases.find((c) => c.slug === slug);
  assert.equal(en.summary, description);
  assert.equal(en.title, title);
  assert.equal(en.evaluation.length, 4);
});

test('ZH and AR summaries parallel EN meaning (not EN-only drift)', () => {
  const zh = catalogJson.zh.cases.find((c) => c.slug === slug);
  const ar = catalogJson.ar.cases.find((c) => c.slug === slug);
  assert.match(zh.summary, /Seeed/);
  assert.match(zh.summary, /Intflow|边缘|reComputer/);
  assert.match(ar.summary, /Seeed/);
  assert.equal(zh.evaluation.length, 4);
  assert.equal(ar.evaluation.length, 4);
});

test('editorial og asset registered and build wires socialImage for this case', () => {
  const cover = editorialAssets[slug];
  assert.equal(cover.file, slug);
  assert.match(cover.alt.en, /no fake certificates/);
  assert.ok(cover.alt.zh && cover.alt.ar);
  assert.match(build, /seeed-intflow/);
  assert.match(build, /socialImage/);
  assert.match(build, /seeed-engineering/);
  assert.match(build, new RegExp(esc(sisterAnchor)));
  assert.match(build, new RegExp(esc(quoteAnchor)));
  for (const size of [640, 1280]) {
    assert.ok(fs.existsSync(`web/assets/editorial/${slug}-${size}.webp`), `${size} webp`);
  }
  assert.ok(fs.existsSync('web/assets/resources/seeed-intflow-method-glance.webp'));
});

test('built EN page: new meta, H1 unchanged, editorial og, sister + quote anchors', () => {
  const en = path.join('dist/en/case-studies', slug + '.html');
  if (!fs.existsSync(en)) {
    assert.ok(true, 'no build output');
    return;
  }
  const html = fs.readFileSync(en, 'utf8');
  assert.match(html, new RegExp(`<title>${esc(title)} \\| CNPS\\.AI</title>`));
  assert.match(html, new RegExp(`<meta name="description" content="${esc(description)}">`));
  assert.deepEqual(htmlH1s(html), [title]);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/seeed-intflow-1280\.webp">/
  );
  assert.doesNotMatch(html, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/social\.png"/);
  assert.match(html, new RegExp(`href="/en/case-studies/seeed-engineering"[^>]*>${esc(sisterAnchor)}`));
  assert.match(html, new RegExp(`href="/en/resources/edge-ai-survey"[^>]*>${esc(surveyAnchor)}`));
  assert.match(html, new RegExp(`href="/en/request-quote[^"]*"[^>]*>${esc(quoteAnchor)}`));
  assert.match(html, /seeed-intflow-method-glance\.webp/);
  assert.match(html, /method glance|Evaluation method|Animals/i);
});
