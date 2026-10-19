import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToRegexp} from 'path-to-regexp';
import {enforcePlaceholderGuard, findPlaceholders, PLACEHOLDER_MARKER} from '../scripts/placeholder-guard.mjs';
import {webServicesGate, validateWorks, MIN_AUTHORIZED_WORKS, EXCLUDED_WORK_DOMAINS} from '../scripts/web-services-gate.mjs';

// Website-building service page skeleton at /en/services/websites (plan-v0 §5–§8 and the JEV ruling of 2026-10-19).
// The page carries no delivery scope list, prices, reviews or FAQ. "What we build" is one neutral sentence and no
// [[PLACEHOLDER: ...]] marker remains; the placeholder guard still blocks any future marker. #work lists 13 works the
// owner confirmed (2026-10-19 14:44 UTC+8) as CNPS.AI or partner projects; cnps.ru and ifgs.ru are labelled as CNPS
// group companies. Per JEV D6 the page is indexable and in the sitemap because at least three authorized works render. These checks read the content file and the built dist/ output.
const data = JSON.parse(fs.readFileSync('content/i18n/web-services.json', 'utf8'));
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const buildSource = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const pageFile = 'dist/en/services/websites.html';
const html = fs.readFileSync(pageFile, 'utf8');
const main = html.match(/<main id="main">([\s\S]*?)<\/main>/)[1];
const jsonLd = (doc) => [...doc.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const ld = jsonLd(html);
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const visible = (fragment) => decode(fragment.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const mainText = visible(main);
const allKeys = (value, out = []) => {
  if (Array.isArray(value)) value.forEach((v) => allKeys(v, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) { out.push(k); allKeys(v, out); }
  return out;
};
const allTypes = (value, out = []) => {
  if (Array.isArray(value)) value.forEach((v) => allTypes(v, out));
  else if (value && typeof value === 'object') { if (value['@type']) out.push(value['@type']); Object.values(value).forEach((v) => allTypes(v, out)); }
  return out;
};
function shellPages() {
  const files = [];
  const walk = (dir) => { for (const x of fs.readdirSync(dir, {withFileTypes: true})) { const p = path.join(dir, x.name); if (x.isDirectory()) walk(p); else if (p.endsWith('.html')) files.push(p); } };
  for (const l of ['en', 'zh', 'ar']) walk(path.join('dist', l));
  for (const l of ['en', 'zh', 'ar']) if (fs.existsSync(`dist/${l}.html`)) files.push(`dist/${l}.html`);
  return files.map((file) => {
    const doc = fs.readFileSync(file, 'utf8');
    const title = doc.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const description = doc.match(/<meta name="description" content="([^"]*)"/)?.[1];
    return {file, title: title && decode(title), description: description && decode(description)};
  }).filter((p) => p.description !== undefined && !/\/404\.html$/.test(p.file));
}

// Sites and operators named in plan-v0 §2 (portfolio-facts.csv). None may appear while no work is authorized.
const shownDomains = ['heatexoil.com', 'gpepump.com', 'hdysecurity.com', 'bonbbytubes.com', 'sdkmss.com', 'raizi.eu', 'rigrs.com', 'renonpower.com', 'kowint.com', 'besen-group.com', 'bopctrl.com', 'cnps.ru', 'ifgs.ru'];
const groupDomains = ['cnps.ru', 'ifgs.ru'];
// Never shown: down (zschemi), theme demo (carblon), and third-party footer credits / contact domains.
const neverShown = ['zschemi', 'carblon', 'xnbeast.com', 'rits.ru', 'sgpe.com', 'sun tzu'];
const workCards = [...main.matchAll(/<article class="catalog-card work-card" data-domain="([^"]+)">([\s\S]*?)<\/article>/g)].map((m) => ({domain: m[1], html: m[2]}));
// Attribution, delivery scope, prices, reviews, numeric promises and tech-stack claims are out of scope for the skeleton.
const forbidden = [
  /testimonial/i, /\breviews?\b/i, /\brated\b/i, /\bstars?\b/i, /aggregaterating/i, /trusted by/i, /clients? include/i, /case stud/i,
  /\bprices?\b/i, /\bpricing\b/i, /\bquote[sd]? from\b/i, /[$€£¥]/, /\b(?:usd|eur|rmb|cny)\b/i, /\bper (?:month|year|page)\b/i, /\bpackages?\b/i,
  /guarantee/i, /#\s?1\b/, /\bnumber one\b/i, /\bfirst page\b/i, /\btop (?:\d+|ten|three|rank)/i,
  /\d+\s*(?:%|percent|x\b|×|days?|weeks?|months?|hours?|leads?|inquiries|visitors|clicks|pages|languages|sites|websites|projects|clients|customers|years)/i,
  /\b(?:double|triple|increase|boost)s?\b.*\b(?:traffic|leads|inquiries|sales|rankings?)\b/i,
  /same (?:ai[- ]first )?stack/i, /\bstack\b/i, /wordpress/i, /elementor/i, /woocommerce/i, /\bwpml\b/i, /gtranslate/i, /pbootcms/i, /siteground/i, /\bavada\b/i,
  /\bvercel\b/i, /\breact\b/i, /next\.js/i, /\bnode(?:\.js)?\b/i, /shopify/i, /\bai[- ]first\b/i, /\bai[- ](?:written|generated|powered)\b/i,
  /designed by/i, /built by cnps/i, /our clients/i, /\blaunch(?:ed)? in\b/i,
];

test('page exists as an English-only shell page with its own title and a description of at most 160 characters', () => {
  assert.ok(fs.existsSync(pageFile));
  for (const l of ['zh', 'ar']) assert.ok(!fs.existsSync(`dist/${l}/services/websites.html`), l + ' version must not be built');
  assert.deepEqual(data.locales, ['en']);
  assert.match(buildSource, /save\(l,p,w\.title,w\.description,hero\(/, 'built through save()/shell() in build-trilingual.mjs');
  assert.match(html, /<title>Export B2B Website Building for Manufacturers \| CNPS\.AI<\/title>/);
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)[1]);
  assert.equal(description, data.description);
  assert.ok([...description].length <= 160, 'description length ' + [...description].length);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\/services\/websites">/);
});

test('every built page title and meta description is unique across the site', () => {
  const pages = shellPages();
  assert.ok(pages.length > 200, 'expected the full trilingual build, found ' + pages.length);
  for (const field of ['title', 'description']) {
    const seen = new Map();
    for (const p of pages) { if (!seen.has(p[field])) seen.set(p[field], []); seen.get(p[field]).push(p.file); }
    const dups = [...seen].filter(([, files]) => files.length > 1);
    assert.deepEqual(dups, [], 'duplicate ' + field);
  }
});

test('hreflang declares only en and x-default; the language switcher falls back through the 307 redirects', () => {
  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(alternates, [['en', 'https://www.cnps.ai/en/services/websites'], ['x-default', 'https://www.cnps.ai/en/services/websites']]);
});

test('indexing gate (JEV D6): with at least three authorized works the page is indexable, in the sitemap (en only) and in llms.txt', () => {
  assert.doesNotMatch(html, /<meta name="robots"/);
  const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
  const entry = sitemap.split('\n').filter((line) => line.includes('/services/'));
  assert.deepEqual(entry, ['<url><loc>https://www.cnps.ai/en/services/websites</loc><xhtml:link rel="alternate" hreflang="en" href="https://www.cnps.ai/en/services/websites"/><xhtml:link rel="alternate" hreflang="x-default" href="https://www.cnps.ai/en/services/websites"/></url>']);
  assert.ok(!/\/(?:zh|ar)\/services\//.test(sitemap), 'only the English URL is listed');
  const llms = fs.readFileSync('dist/llms.txt', 'utf8');
  assert.equal(llms.split('\n').filter((line) => line.includes('/services/websites')).length, 1, 'one llms.txt line');
  assert.equal(data.indexing.minAuthorizedWorks, 3);
  assert.equal(MIN_AUTHORIZED_WORKS, 3);
  assert.match(buildSource, /INDEXING GATE \(JEV D6\)/);
  assert.match(buildSource, /const gate=webServicesGate\(works,webServices\.indexing\?\.minAuthorizedWorks\);/);
  assert.match(buildSource, /WEB_SERVICES_WORKS_RENDERED=gate\.worksRendered;/);
  assert.match(buildSource, /webServicesIndexable=gate\.indexable;/);
  assert.doesNotMatch(buildSource, /const WEB_SERVICES_WORKS_RENDERED=|WEB_SERVICES_WORKS_RENDERED=true/, 'no hand-set flag');
  assert.match(buildSource, /robots:webServicesIndexable\?null:'noindex'/);
  const robotsPages = shellPages().filter((p) => /<meta name="robots"/.test(fs.readFileSync(p.file, 'utf8'))).map((p) => p.file);
  assert.deepEqual(robotsPages, []);
});

test('gate switches on the actual work count: fewer than three authorized works means noindex, threshold stays 3', () => {
  const work = (n, extra = {}) => ({name: 'W' + n, url: `https://w${n}.example/`, permission: true, source: 'fixture', checkedAt: '2026-10-19', deliveredBy: 'fixture', permissionSource: 'fixture', ...extra});
  assert.deepEqual(webServicesGate([], 3), {rendered: [], worksRendered: false, indexable: false});
  assert.equal(webServicesGate([work(1), work(2)], 3).indexable, false);
  assert.equal(webServicesGate([work(1), work(2)], 3).worksRendered, true);
  assert.equal(webServicesGate([work(1), work(2), work(3, {permission: false})], 3).indexable, false, 'unauthorized works do not count');
  assert.equal(webServicesGate([work(1), work(2), work(3, {checkedAt: ''})], 3).indexable, false, 'works without checkedAt do not count');
  assert.equal(webServicesGate([work(1), work(2), work(3)], 3).indexable, true);
  assert.throws(() => webServicesGate([work(1), work(2), work(3)], 2), /minAuthorizedWorks >= 3/);
  assert.throws(() => validateWorks([work(1, {source: ''})]), /source, checkedAt/);
  assert.throws(() => validateWorks([work(1, {permissionSource: ''})]), /permissionSource/);
  assert.equal(webServicesGate([work(1), work(2), work(3, {permissionSource: undefined})], 3).indexable, false, 'works without permissionSource do not count');
  for (const d of ['zschemi.com', 'carblon.com']) assert.throws(() => validateWorks([work(1, {url: `https://${d}/`})]), /Excluded site/);
  assert.deepEqual(EXCLUDED_WORK_DOMAINS, ['zschemi.com', 'carblon.com']);
  assert.equal(webServicesGate(data.works, data.indexing.minAuthorizedWorks).indexable, true);
});

test('vercel.json sends /zh/services/* and /ar/services/* to /en/services/* with a temporary (307) redirect', () => {
  for (const loc of ['zh', 'ar']) {
    const rule = vercel.redirects.find((r) => r.source === `/${loc}/services/:path*`);
    assert.ok(rule, loc + ' rule');
    assert.equal(rule.destination, '/en/services/:path*');
    assert.equal(rule.permanent, false);
    assert.equal(rule.statusCode, undefined);
    // Vercel applies the first matching redirect; nothing earlier may capture the path.
    const first = vercel.redirects.find((r) => pathToRegexp(r.source).test(`/${loc}/services/websites`));
    assert.equal(first, rule);
  }
  assert.ok(!vercel.redirects.some((r) => /^\/en\/services/.test(r.source)), 'the English page itself is never redirected');
});

test('#work lists the 13 confirmed works; zschemi and carblon never appear; every work carries source and checkedAt', () => {
  assert.deepEqual(data.works.map((w) => w.domain), shownDomains);
  assert.deepEqual(workCards.map((c) => c.domain), shownDomains);
  assert.match(main, /<h2 id="work">/);
  const lower = html.toLowerCase();
  for (const bad of neverShown) assert.ok(!lower.includes(bad), bad + ' must never appear on the page');
  for (const bad of ['zschemi', 'carblon']) assert.ok(!JSON.stringify(data).toLowerCase().includes(bad), bad + ' in content');
  for (const w of data.works) {
    for (const key of ['name', 'domain', 'url', 'industry', 'source', 'checkedAt', 'deliveredBy', 'permissionSource']) assert.ok(w[key] && String(w[key]).trim(), w.domain + ' ' + key);
    assert.equal(w.permission, true, w.domain);
    assert.match(w.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(w.source.includes(w.url), w.domain + ' source names the live URL');
    assert.ok(new URL(w.url).hostname.replace(/^www\./, '') === w.domain, w.domain + ' url');
    // No delivery-scope or launch-year fields on the record or the card.
    for (const key of ['scope', 'deliveryScope', 'launchYear', 'launched', 'year', 'price', 'review', 'testimonial']) assert.equal(w[key], undefined, w.domain + ' ' + key);
    if (w.languages) assert.ok(w.languagesSource && /Live homepage check/.test(w.languagesSource), w.domain + ' languages verified live');
  }
});

test('owner rulings 2026-10-19: deliveredBy per site, permissionSource on every record, no "written" on the page', () => {
  const xnFooter = ['heatexoil.com', 'gpepump.com', 'hdysecurity.com', 'bonbbytubes.com', 'rigrs.com', 'bopctrl.com'];
  const noCredit = ['sdkmss.com', 'raizi.eu', 'renonpower.com', 'kowint.com', 'besen-group.com'];
  for (const w of data.works) {
    const expected = groupDomains.includes(w.domain) ? 'CNPS.AI (group company)' : xnFooter.includes(w.domain) ? 'CNPS.AI with partner XN Digital Marketing' : 'CNPS.AI or partner';
    assert.equal(w.deliveredBy, expected, w.domain);
    assert.equal(w.permissionSource, 'owner confirmation in chat 2026-10-19', w.domain);
  }
  assert.equal(xnFooter.length + noCredit.length + groupDomains.length, data.works.length);
  // deliveredBy and permissionSource are internal: never rendered.
  assert.ok(!html.includes('XN Digital Marketing') && !html.includes('owner confirmation'));
  assert.ok(mainText.includes("We do not show another company's website on this page without the site owner's permission."));
  assert.doesNotMatch(html, /\bwritten\b/i);
  assert.doesNotMatch(JSON.stringify(data), /\bwritten\b/i);
});

test('work cards: external link rel="nofollow noopener" target=_blank, industry, languages, dated screenshot; group companies disclosed', () => {
  assert.equal(workCards.length, 13);
  for (const card of workCards) {
    const w = data.works.find((x) => x.domain === card.domain);
    const links = [...card.html.matchAll(/<a ([^>]*)>/g)].map((m) => m[1]);
    assert.equal(links.length, 1, card.domain + ' one external link');
    assert.match(links[0], new RegExp(`^class="text-link" href="${w.url.replace(/[.]/g, '\\.')}" rel="nofollow noopener" target="_blank"$`), card.domain);
    assert.ok(card.html.includes(`<h3>${w.name}</h3>`), card.domain + ' name');
    assert.ok(card.html.includes(`<p>${w.industry}</p>`), card.domain + ' industry');
    assert.match(card.html, /Screenshot captured <time datetime="2026-10-19">19 October 2026<\/time>/);
    if (w.languages?.length) assert.match(card.html, /Site languages:/); else assert.doesNotMatch(card.html, /Site languages:/);
    const isGroup = groupDomains.includes(card.domain);
    assert.equal(w.label === 'CNPS group company', isGroup, card.domain + ' label');
    assert.equal(card.html.includes('<span class="tag">CNPS group company</span>'), isGroup, card.domain + ' disclosure');
  }
  assert.equal((main.match(/Works delivered by CNPS\.AI and partners\./g) || []).length, 1, 'one overall delivery note');
});

test('screenshots: 1280w and 640w webp at most 120 KB each; img tags carry width, height, loading=lazy and alt', () => {
  const imgs = [...main.matchAll(/<img ([^>]+)>/g)].map((m) => m[1]);
  assert.equal(imgs.length, 13);
  for (const w of data.works) {
    for (const size of [640, 1280]) {
      const file = `web/assets/portfolio/${w.screenshot.file}-${size}.webp`;
      const buf = fs.readFileSync(file);
      assert.ok(buf.length <= 120 * 1024, `${file} is ${buf.length} bytes`);
      assert.equal(buf.toString('ascii', 0, 4), 'RIFF'); assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
      // VP8 (lossy) frame header carries the pixel size at offset 26.
      if (buf.toString('ascii', 12, 16) === 'VP8 ') assert.deepEqual([buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff], [size, size * 5 / 8], file);
      assert.ok(fs.existsSync(`dist/assets/portfolio/${w.screenshot.file}-${size}.webp`), 'copied to dist');
    }
    assert.equal(w.screenshot.viewport, '1440x900');
    const img = imgs.find((x) => x.includes(`/assets/portfolio/${w.screenshot.file}-1280.webp"`));
    assert.ok(img, w.domain + ' img');
    assert.match(img, /width="1280" height="800"/);
    assert.match(img, /loading="lazy"/);
    assert.match(img, new RegExp(`alt="Homepage of ${w.domain.replace('.', '\\.')} \\([^"]+\\), screenshot captured 19 October 2026"`));
    assert.match(img, /srcset="[^"]+-640\.webp 640w, [^"]+-1280\.webp 1280w"/);
  }
});

test('hero offers "See selected work" linking to #work next to the inquiry button', () => {
  const actions = html.match(/<section class="page-hero[\s\S]*?<div class="actions">([\s\S]*?)<\/div>/)[1];
  assert.match(actions, /href="\/en\/request-quote\?workflow=website-building"/);
  assert.match(actions, /<a class="btn ghost" href="#work">See selected work<\/a>/);
});

test('page copy contains no attribution, delivery scope, prices, reviews, numeric promises or tech-stack claims', () => {
  const ldText = JSON.stringify(ld);
  for (const pattern of forbidden) {
    assert.doesNotMatch(mainText, pattern, 'main copy matched ' + pattern);
    assert.doesNotMatch(ldText, pattern, 'JSON-LD matched ' + pattern);
  }
});

test('real copy covers Hero, Who this is for, What we build, How we work and What we don\'t promise; no FAQ section', () => {
  const section = (id) => data.sections.find((s) => s.id === id);
  assert.ok(data.h1 && data.lead && !data.h1.includes(PLACEHOLDER_MARKER) && !data.lead.includes(PLACEHOLDER_MARKER));
  for (const id of ['who-this-is-for', 'how-we-work', 'what-we-dont-promise']) {
    const s = section(id);
    assert.ok(s, id);
    assert.ok(!JSON.stringify(s).includes(PLACEHOLDER_MARKER), id + ' must be real copy');
    assert.ok((s.items || s.steps).length >= 3, id);
    assert.ok(main.includes(`<h2 id="${id}">`), id + ' rendered');
  }
  // "What we build" is a single neutral sentence: no capability list, no steps, no placeholder.
  const build = section('what-we-build');
  assert.deepEqual(Object.keys(build).sort(), ['id', 'intro', 'title']);
  assert.equal(build.intro, 'We build corporate websites for export manufacturers; the scope, including pages, languages, hosting and ongoing support, is agreed for each project, so send us an inquiry describing what you need.');
  assert.equal(build.intro.split(/[.!?](?:\s|$)/).filter(Boolean).length, 1, 'exactly one sentence');
  const buildHtml = main.match(/<h2 id="what-we-build">[\s\S]*?(?=<h2 |<\/article>)/)[0];
  assert.ok(buildHtml.includes(`<p>${build.intro}</p>`), 'sentence rendered');
  assert.doesNotMatch(buildHtml, /<(?:ul|ol|li)\b/, 'no capability list');
  // FAQ removed entirely.
  assert.equal(data.faq, undefined);
  assert.equal(data.faqTitle, undefined);
  assert.ok(!main.includes('id="common-questions"'));
  assert.doesNotMatch(main.match(/<article class="prose">([\s\S]*?)<\/article>/)[1], /<h3>/, 'no FAQ questions in the copy');
  assert.match(main, /href="\/en\/request-quote\?workflow=website-building"/);
});

test('no [[PLACEHOLDER]] and no FAQPage remain in the content file, the rendered page or the dist output', () => {
  assert.ok(!JSON.stringify(data).includes(PLACEHOLDER_MARKER), 'content/i18n/web-services.json');
  assert.ok(!html.includes(PLACEHOLDER_MARKER), pageFile);
  assert.ok(!html.includes('data-placeholder'), 'no placeholder notice element');
  assert.ok(!html.includes('FAQPage'), 'no FAQPage on the page');
  assert.deepEqual(ld.map((x) => x['@type']).filter((t) => t !== 'WebPage'), ['Service', 'ItemList'], 'Service and ItemList are the only page-specific structured data');
  assert.deepEqual(findPlaceholders('dist'), [], 'dist/ is free of placeholder markers');
});

test('JSON-LD: Service plus ItemList of CreativeWork (creator CNPS.AI); no offers/price/areaServed, no Review, no FAQPage', () => {
  const service = ld.find((x) => x['@type'] === 'Service');
  assert.ok(service, 'Service schema');
  assert.deepEqual(service.provider, {'@type': 'Organization', name: 'CNPS.AI', url: 'https://www.cnps.ai'});
  assert.equal(service.url, 'https://www.cnps.ai/en/services/websites');
  const list = ld.find((x) => x['@type'] === 'ItemList');
  assert.ok(list, 'ItemList schema');
  assert.equal(list.itemListElement.length, data.works.length);
  list.itemListElement.forEach((el, i) => {
    const w = data.works[i];
    assert.equal(el['@type'], 'ListItem'); assert.equal(el.position, i + 1);
    assert.deepEqual(el.item, {'@type': 'CreativeWork', name: w.name, url: w.url, about: w.industry, creator: {'@type': 'Organization', name: 'CNPS.AI', url: 'https://www.cnps.ai'}});
  });
  const keys = allKeys(ld);
  for (const key of ['offers', 'price', 'priceCurrency', 'priceRange', 'areaServed', 'review', 'aggregateRating', 'author', 'datePublished']) assert.ok(!keys.includes(key), key);
  const types = allTypes(ld);
  for (const type of ['FAQPage', 'Review', 'AggregateRating', 'Offer', 'AggregateOffer']) assert.ok(!types.includes(type), type);
  assert.ok(!/"(?:FAQPage|Review|AggregateRating)"/.test(html));
});

test('placeholder guard: production build fails while a marker remains, preview and local builds pass', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'placeholder-guard-'));
  try {
    fs.mkdirSync(path.join(dir, 'en'), {recursive: true});
    fs.writeFileSync(path.join(dir, 'en', 'clean.html'), '<p>Ready copy</p>');
    assert.deepEqual(findPlaceholders(dir), []);
    assert.equal(enforcePlaceholderGuard({dir, env: {VERCEL_ENV: 'production'}}).placeholders, 0);
    fs.writeFileSync(path.join(dir, 'en', 'draft.html'), '<p>[[PLACEHOLDER: owner answer]]</p>');
    assert.throws(() => enforcePlaceholderGuard({dir, env: {VERCEL_ENV: 'production'}}), /production build blocked/);
    assert.equal(enforcePlaceholderGuard({dir, env: {VERCEL_ENV: 'preview'}}).placeholders, 1);
    assert.equal(enforcePlaceholderGuard({dir, env: {}}).placeholders, 1);
    const cli = (env) => spawnSync(process.execPath, ['scripts/placeholder-guard.mjs', '--dir', dir], {env: {...process.env, VERCEL_ENV: '', ...env}, encoding: 'utf8'});
    const prod = cli({VERCEL_ENV: 'production'});
    assert.equal(prod.status, 1);
    assert.match(prod.stderr, /production build blocked/);
    assert.equal(cli({VERCEL_ENV: 'preview'}).status, 0);
    assert.equal(cli({VERCEL_ENV: 'development'}).status, 0);
    assert.equal(cli({}).status, 0);
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
  // The real build output carries no placeholder markers, so the guard lets a production build of this branch through.
  assert.equal(spawnSync(process.execPath, ['scripts/placeholder-guard.mjs', '--dir', 'dist'], {env: {...process.env, VERCEL_ENV: 'production'}}).status, 0);
  assert.equal(spawnSync(process.execPath, ['scripts/placeholder-guard.mjs', '--dir', 'dist'], {env: {...process.env, VERCEL_ENV: 'preview'}}).status, 0);
  assert.match(JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts.build, /&& node scripts\/placeholder-guard\.mjs$/);
});

test('entry links: footer on every locale and the About page; main nav, homepage title and Organization unchanged', () => {
  for (const l of ['en', 'zh', 'ar']) {
    for (const file of [`dist/${l}.html`, `dist/${l}/about.html`, `dist/${l}/products.html`]) {
      const footer = fs.readFileSync(file, 'utf8').match(/<footer[\s\S]*?<\/footer>/)[0];
      assert.match(footer, l === 'en' ? /<a href="\/en\/services\/websites">Website building<\/a>/ : /<a href="\/en\/services\/websites" hreflang="en">[^<]+<\/a>/, file);
    }
    const about = fs.readFileSync(`dist/${l}/about.html`, 'utf8').match(/<article class="prose">([\s\S]*?)<\/article>/)[1];
    assert.match(about, /<a href="\/en\/services\/websites">/, l + ' about body link');
    const home = fs.readFileSync(`dist/${l}.html`, 'utf8');
    const nav = home.match(/<nav class="main-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
    assert.deepEqual([...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1]), ['/products', '/solutions', '/case-studies', '/resources', '/guides', '/blogs'].map((p) => '/' + l + p));
    const mobile = home.match(/<nav class="mobile-nav[^>]*>([\s\S]*?)<\/nav>/)[1];
    assert.ok(!mobile.includes('/services/'), l + ' mobile nav');
    const homeLd = jsonLd(home)[0];
    assert.deepEqual(homeLd.publisher, {'@type': 'Organization', name: 'CNPS.AI', url: 'https://www.cnps.ai'});
  }
  assert.match(fs.readFileSync('dist/en.html', 'utf8'), /<title>AI with purpose\. Built for people\. \| CNPS\.AI<\/title>/);
});
