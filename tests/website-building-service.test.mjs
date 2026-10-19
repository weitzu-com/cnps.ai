import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToRegexp} from 'path-to-regexp';
import {enforcePlaceholderGuard, findPlaceholders, PLACEHOLDER_MARKER} from '../scripts/placeholder-guard.mjs';

// Website-building service page skeleton at /en/services/websites (plan-v0 §5–§8 and the JEV ruling of 2026-10-19).
// The skeleton carries no portfolio works, attribution or delivery scope. "What we build" and FAQ answers are
// [[PLACEHOLDER: ...]] markers that block a production build. The page is noindex and outside the sitemap until #work
// shows at least three works with written permission. These checks read the content file and the built dist/ output.
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
const workDomains = ['carblon.com', 'heatexoil.com', 'gpepump.com', 'hdysecurity.com', 'bonbbytubes.com', 'sdkmss.com', 'raizi.eu', 'rigrs.com', 'zschemi.com', 'renonpower.com', 'kowint.com', 'besen-group.com', 'bopctrl.com', 'cnps.ru', 'ifgs.ru', 'xnbeast.com', 'rits.ru', 'sgpe.com'];
const workNames = /\b(?:carblon|heatex(?:oil)?|gpe(?:pump)?|hdy ?security|bonbby|sdkm(?:ss)?|raizi|rigrs|zschemi|renon(?: ?power)?|kowint|besen|bopctrl|dongsu|ifgs|xn ?digital|xndigi|xnbeast|rits|sun tzu|sgpe)\b/i;
// Attribution, delivery scope, prices, reviews, numeric promises and tech-stack claims are out of scope for the skeleton.
const forbidden = [
  /testimonial/i, /\breviews?\b/i, /\brated\b/i, /\bstars?\b/i, /aggregaterating/i, /trusted by/i, /clients? include/i, /case stud/i,
  /\bprices?\b/i, /\bpricing\b/i, /\bquote[sd]? from\b/i, /[$€£¥]/, /\b(?:usd|eur|rmb|cny)\b/i, /\bper (?:month|year|page)\b/i, /\bpackages?\b/i,
  /guarantee/i, /#\s?1\b/, /\bnumber one\b/i, /\bfirst page\b/i, /\btop (?:\d+|ten|three|rank)/i,
  /\d+\s*(?:%|percent|x\b|×|days?|weeks?|months?|hours?|leads?|inquiries|visitors|clicks|pages|languages|sites|websites|projects|clients|customers|years)/i,
  /\b(?:double|triple|increase|boost)s?\b.*\b(?:traffic|leads|inquiries|sales|rankings?)\b/i,
  /same (?:ai[- ]first )?stack/i, /\bstack\b/i, /wordpress/i, /elementor/i, /woocommerce/i, /\bwpml\b/i, /gtranslate/i, /pbootcms/i, /siteground/i, /\bavada\b/i,
  /\bvercel\b/i, /\breact\b/i, /next\.js/i, /\bnode(?:\.js)?\b/i, /shopify/i, /\bai[- ]first\b/i, /\bai[- ](?:written|generated|powered)\b/i,
  /designed by/i, /built by cnps/i, /delivered by/i, /our (?:work|portfolio|clients)/i, /selected work/i, /portfolio/i,
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

test('indexing gate: meta robots noindex, absent from sitemap.xml, opens only with at least three authorized works', () => {
  assert.match(html, /<meta name="robots" content="noindex">/);
  const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
  assert.ok(!sitemap.includes('/services/'), 'service page must stay out of the sitemap');
  assert.ok(sitemap.includes('https://www.cnps.ai/en/about'), 'sitemap still lists indexable pages');
  assert.ok(data.indexing.minAuthorizedWorks >= 3);
  assert.match(buildSource, /INDEXING GATE \(JEV D6\)/);
  assert.match(buildSource, /const WEB_SERVICES_WORKS_RENDERED=false;/);
  assert.match(buildSource, /webServicesIndexable=WEB_SERVICES_WORKS_RENDERED&&works\.length>=minWorks/);
  // Only noindex pages are dropped from the sitemap; no other page gained a robots meta.
  const robotsPages = shellPages().filter((p) => /<meta name="robots"/.test(fs.readFileSync(p.file, 'utf8'))).map((p) => p.file);
  assert.deepEqual(robotsPages, [pageFile]);
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

test('skeleton carries no works: empty works list, no #work section, no site or operator names anywhere on the page', () => {
  assert.deepEqual(data.works, []);
  assert.ok(!/id="work"/.test(html));
  for (const domain of workDomains) assert.ok(!html.toLowerCase().includes(domain), domain);
  assert.doesNotMatch(mainText, workNames);
  for (const entry of data.works) assert.equal(entry.permission, true);
});

test('page copy contains no attribution, delivery scope, prices, reviews, numeric promises or tech-stack claims', () => {
  const ldText = JSON.stringify(ld);
  for (const pattern of forbidden) {
    assert.doesNotMatch(mainText, pattern, 'main copy matched ' + pattern);
    assert.doesNotMatch(ldText, pattern, 'JSON-LD matched ' + pattern);
  }
});

test('real copy covers Hero, Who this is for, How we work and What we don\'t promise; What we build and FAQ answers are placeholders', () => {
  const section = (id) => data.sections.find((s) => s.id === id);
  assert.ok(data.h1 && data.lead && !data.h1.includes(PLACEHOLDER_MARKER) && !data.lead.includes(PLACEHOLDER_MARKER));
  for (const id of ['who-this-is-for', 'how-we-work', 'what-we-dont-promise']) {
    const s = section(id);
    assert.ok(s, id);
    assert.ok(!JSON.stringify(s).includes(PLACEHOLDER_MARKER), id + ' must be real copy');
    assert.ok((s.items || s.steps).length >= 3, id);
    assert.ok(main.includes(`<h2 id="${id}">`), id + ' rendered');
  }
  assert.match(section('what-we-build').placeholder, /^\[\[PLACEHOLDER: .+\]\]$/);
  assert.equal(section('what-we-build').items, undefined);
  assert.ok(data.faq.length >= 3);
  for (const f of data.faq) { assert.match(f.answer, /^\[\[PLACEHOLDER: .+\]\]$/); assert.ok(mainText.includes(f.question)); }
  assert.equal((main.match(/\[\[PLACEHOLDER/g) || []).length, data.faq.length + 1);
  assert.match(main, /href="\/en\/request-quote\?workflow=website-building"/);
});

test('JSON-LD: Service with provider Organization CNPS.AI, no offers/price/areaServed, no Review, no FAQPage while placeholders remain', () => {
  const service = ld.find((x) => x['@type'] === 'Service');
  assert.ok(service, 'Service schema');
  assert.deepEqual(service.provider, {'@type': 'Organization', name: 'CNPS.AI', url: 'https://www.cnps.ai'});
  assert.equal(service.url, 'https://www.cnps.ai/en/services/websites');
  const keys = allKeys(ld);
  for (const key of ['offers', 'price', 'priceCurrency', 'priceRange', 'areaServed', 'review', 'aggregateRating', 'creator', 'author']) assert.ok(!keys.includes(key), key);
  const types = allTypes(ld);
  for (const type of ['FAQPage', 'Review', 'AggregateRating', 'Offer', 'AggregateOffer', 'ItemList', 'CreativeWork']) assert.ok(!types.includes(type), type);
  assert.ok(!html.includes('"FAQPage"'));
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
  // The real build output still carries the skeleton placeholders, so a production build of this branch is blocked.
  assert.equal(spawnSync(process.execPath, ['scripts/placeholder-guard.mjs', '--dir', 'dist'], {env: {...process.env, VERCEL_ENV: 'production'}}).status, 1);
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
