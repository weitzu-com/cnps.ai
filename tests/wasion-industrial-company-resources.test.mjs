import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { wasionDemoPage as renderWasionDemoPage, WASION_PAGES, WASION_LEGACY_ROUTES as WASION_DEMO_ROUTES } from '../server/wasion-demo-page.mjs';
import { WASION_STYLES as ALL_WASION_STYLES } from '../server/wasion-demo-styles.mjs';
import { EXPERIENCE_ROUTES, CONTENT_CLIENT } from '../server/wasion-experience/content.mjs';
import { FACTORIES } from '../server/wasion-experience/content-data.mjs';
import { INDUSTRIAL_COMPANY_RESOURCE_ROUTES, renderIndustrialCompanyResources, INDUSTRIAL_COMPANY_RESOURCES_CSS, INDUSTRIAL_COMPANY_RESOURCES_CLIENT } from '../server/wasion-industrial-company-resources.mjs';
import { isIndustrialNewsPage } from '../server/wasion-industrial-news-events.mjs';

// The retained presentation is explicit now that 09/16 is the canonical demo.
const WASION_STYLES = Object.fromEntries(Object.entries(ALL_WASION_STYLES).filter(([style]) => style !== 'requirements'));
const wasionDemoPage = (nonce, options = {}) => renderWasionDemoPage(nonce, { style: 'industrial', ...options });
const base = '/demo/wasion/styles/industrial';
const nonce = 'industrial-company-resources-fixture';
const hash = value => createHash('sha256').update(value).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const text = markup => markup.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, entity => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }[entity]));
const attributes = tag => Object.fromEntries([...tag.matchAll(/\b([a-z-]+)="([^"]*)"/g)].map(([, key, value]) => [key, text(value)]));
const main = html => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
const scripts = html => html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g);
const rendered = slug => main(wasionDemoPage(nonce, { slug }));
const targets = ['company', 'about', 'innovation', 'global-presence', 'resources', 'certifications', 'collateral-videos', 'media-kit'];
const companySlugs = targets.slice(0, 4);
const resources = WASION_PAGES.find(page => page.slug === 'resources');
const articles = markup => [...markup.matchAll(/<article class="we-filter-item"([^>]*)>([\s\S]*?)<\/article>/g)].map(([, attrs, body]) => ({ attrs, body }));
// The cover fallback is an extra visual layer. Remove only that explicitly
// named wrapper and its original img's added hidden flag for the old-body lock.
const originalImages = markup => markup.replace(/<div class="wic-resource-cover">[\s\S]*?(<img hidden [^>]*>)<\/div>/g, (_, img) => img.replace('<img hidden ', '<img '));
// Content locks retain main's original bodies; only the intentional legacy
// route relocation is normalized. Actual navigation is checked below.
const originalPaths = markup => markup.replaceAll(base, '/demo/wasion');

// Captured from main 744ab9ac937b494c46109108ec1c0bf30bda8de1 before this
// presentation change. Full target bodies, rows and carousel markup are fixed
// independently of the renderer; no acceptance artifacts are read by tests.
const originalTails = {
  company: '676a138777a3f90eccb10bb417074a9f1777bcb08c2aa9836f5658b7fa21369e',
  about: '676a138777a3f90eccb10bb417074a9f1777bcb08c2aa9836f5658b7fa21369e',
  innovation: '9f86ac3e6c1223f9141bb435f95a880e0c6e3e3a9ce35a6a899ecc8d0f9f2bc4',
  'global-presence': '8724234465795fd7478d759a1f69e7e0191b2c41edecac50f893eb1180994405',
  resources: 'b35c1c1a111ed04e25932118de9087bb1d7e9ab9502969eb554ed9e7d7839fee',
  certifications: '604c71f94404ba355f141f6b84c6c68853623f73892df53c8a070d8096249bed',
  'collateral-videos': '33b50a85dd68f0dcafec10094f5107672e88b9ccc111442278e63d15a06d0723',
  'media-kit': '70b90a204f56a234a6ac4e975b5a8926509af9add38e1154e28340a00415c459'
};
const rowBaselines = {
  resources: [12, '6272878207f591370dc93c0e64bad4cc71e68d24060b493ba5a702ace7d7b26e', 'd31bf693171357b46736a5ac744396b92944129de64f10c450a479ce85d3d2e8'],
  certifications: [4, '1b8cf20341bd4a8e62c08596ca84ae9d68961967d1a2f48341b4de0c1f04d942', '9a5b49eaeb3dbe1567fff81887027ae2d0eb05f7bab44938d5e4aa3d4271322f'],
  'collateral-videos': [6, 'e35e740e0ae2dcf0703e9230d5b5b00f2178fdcdf0d8a45ed926e08e4c376824', 'cc84fda840f33630702f015c9e8d26da73a49f8c56539a8f099d5f91e88a5cae'],
  'media-kit': [6, 'e35e740e0ae2dcf0703e9230d5b5b00f2178fdcdf0d8a45ed926e08e4c376824', 'cc84fda840f33630702f015c9e8d26da73a49f8c56539a8f099d5f91e88a5cae'],
  'global-presence': [7, '1568d3a9c22713e6eac43a0f08757f13d46f0abb1af1b09871217322751e6417', '76f4e74015f742388c379d9b8d618e3c4261ced65be1c1cbcd70a571e48e0b3a']
};

test('the eight-page presentation retains all official records and the documented four factories', () => {
  assert.deepEqual(INDUSTRIAL_COMPANY_RESOURCE_ROUTES, targets);
  assert.equal(hash(JSON.stringify(WASION_PAGES)), 'f7b21c05fa46f70bfed0eb9584501cff0deb37fdf47edec10b5b07670a2b4691');
  assert.equal(hash(JSON.stringify(EXPERIENCE_ROUTES)), '4d82b874da7579626967c0a7a9530a4810539a74d5452c29a51548302d1d9a6b');
  assert.equal(hash(JSON.stringify(FACTORIES)), '48c88dfcb90ddf653c56af32d76a7c0e840efcf332e8f2d71d22cd6770756d32');
  assert.equal(hash(JSON.stringify(resources.resourceItems)), '23108cbcca37743b470f56236465871dffadf642493d59e4e42b9f47c45ecef6');
  assert.equal(renderIndustrialCompanyResources('search', {}, '<p>Original content</p>'), '<p>Original content</p>');
});

test('all 450 shared script sets and 436 remaining HTML pages remain byte-identical, with only eight exact image-client suffixes', () => {
  const clients = [], unaffected = [];
  for (const style of Object.keys(WASION_STYLES)) for (const slug of WASION_DEMO_ROUTES) {
    const html = wasionDemoPage(nonce, { style, slug });
    const expected = style === 'industrial' && targets.includes(slug);
    assert.equal(html.includes(INDUSTRIAL_COMPANY_RESOURCES_CSS), expected, style + ' ' + slug + ' CSS scope');
    assert.equal(main(html).includes('class="wic-page '), expected, style + ' ' + slug + ' layout scope');
    const tags = scripts(html);
    assert.equal(html.split(INDUSTRIAL_COMPANY_RESOURCES_CLIENT).length - 1, Number(expected), style + ' ' + slug + ' image-client boundary');
    if (expected) {
      const suffix = INDUSTRIAL_COMPANY_RESOURCES_CLIENT + '</script>';
      assert.ok(tags.at(-1).endsWith(suffix), 'the only added client is an exact suffix');
      tags[tags.length - 1] = tags.at(-1).slice(0, -suffix.length) + '</script>';
    }
    clients.push([style, slug, hash(JSON.stringify(tags))]);
    const news = style === 'industrial' && isIndustrialNewsPage(WASION_PAGES.find(page => page.slug === slug) || { slug });
    if (!expected && !news) unaffected.push([style, slug, hash(html)]);
    else if (expected) {
      assert.ok(html.indexOf('id="wd-protected"') < html.indexOf('class="wic-page '));
      assert.equal((html.match(/<style\b/g) || []).length, 1);
      assert.match(html, /<style nonce="industrial-company-resources-fixture">/);
    }
  }
  assert.equal(clients.length, 450);
  assert.equal(unaffected.length, 436);
  // Frozen 1fd2731 output already contains the approved 09/16 default and
  // retained Industrial relocation; all unaffected bytes were compared to it.
  assert.equal(hash(JSON.stringify(clients)), 'bb89ed6298ca96a0d194ac5bed70a621270ef89ef1d389b13c5471112c1bbbd7');
  // Six news/event pages have their own presentation coverage. This subset
  // comes from clean 60f2db5 HTML, remapping only the fixture nonce.
  assert.equal(hash(JSON.stringify(unaffected)), '12d7e919b7813c1b0c1e64b351af32553daddb17220b98cedfb4e823ae644c0d');
});

for (const slug of targets) test('complete original content, widgets and sources remain intact: ' + slug, () => {
  const markup = rendered(slug);
  const start = markup.indexOf('<div class="wd-container we-content wic-content"');
  assert.ok(start >= 0);
  // Only the named container, explicit select names and moving the original
  // carousel out of the body are permitted differences from the old content.
  const tail = originalImages(markup.slice(start, markup.lastIndexOf('</div>')))
    .replace('<div class="wd-container we-content wic-content" id="wic-content">', '<div class="wd-container we-content">')
    .replace(/<select aria-label="(?:Region|Topic|Content type)" data-filter=/g, '<select data-filter=');
  assert.equal(hash(originalPaths(tail)), originalTails[slug]);
  const route = EXPERIENCE_ROUTES.find(page => page.slug === slug) || WASION_PAGES.find(page => page.slug === slug);
  for (const url of [...(route.sourceUrls || []), route.url].filter(Boolean)) assert.ok(markup.includes('href="' + escape(encodeURI(url)) + '"'), url);
});

test('all resource and project rows preserve their original order, previews, facet attributes and options', () => {
  for (const [slug, [count, rowsHash, optionsHash]] of Object.entries(rowBaselines)) {
    const markup = rendered(slug), rows = articles(markup);
    assert.equal(rows.length, count, slug);
    assert.equal(hash(JSON.stringify(rows.map(row => ({ attrs: row.attrs, body: originalPaths(originalImages(row.body)) })))), rowsHash, slug + ' complete original rows');
    const selects = [...markup.matchAll(/<select\b[^>]*>[\s\S]*?<\/select>/g)].map(([select]) => select.replace(/ aria-label="[^"]+"/, ''));
    assert.equal(hash(JSON.stringify(selects)), optionsHash, slug + ' original facets and values');
    for (const [, select] of markup.matchAll(/(<select\b[^>]*>)/g)) assert.match(select, /aria-label="(?:Region|Topic|Content type)"/);
    assert.match(markup, /class="we-filter-scope" data-page-size="6"/);
    assert.match(markup, /<label>Search (?:resources|case studies)<input type="search" data-filter="q" maxlength="160"/);
    assert.match(markup, /class="we-filter-count" aria-live="polite"/);
    assert.match(markup, /class="we-filter-empty" hidden/);
    assert.match(markup, /class="we-filter-reset">Reset filters/);
  }
});

test('all twelve publications keep official covers, ten real URLs and two honest missing-file notices', () => {
  const rows = articles(rendered('resources'));
  assert.equal(resources.resourceItems.filter(item => item.url).length, 10);
  assert.equal(resources.resourceItems.filter(item => !item.url).length, 2);
  for (const [index, item] of resources.resourceItems.entries()) {
    const row = rows[index].body;
    assert.ok(row.includes('<h3>'));
    assert.ok(row.includes(escape(item.title)));
    assert.ok(row.includes('src="' + escape(encodeURI(item.image)) + '"'));
    assert.ok(row.includes('alt="' + escape(item.title) + '"'));
    if (item.url) {
      assert.ok(row.includes('href="' + escape(encodeURI(item.url)) + '"'));
      assert.match(row, /target="_blank" rel="noopener noreferrer"/);
      assert.doesNotMatch(row, /downloadable file is not linked/);
    } else {
      assert.match(row, /A downloadable file is not linked by the publisher\./);
      assert.doesNotMatch(row, /Open document|Watch video|href="[^"]+\.pdf"/);
      assert.ok(row.includes('href="' + resources.url + '"'));
    }
  }
  assert.match(rendered('certifications'), /Wasion Hungary Kft\. publication\. Check the document for its exact entity, scope and validity\./);
  assert.doesNotMatch(rendered('certifications'), /All products are certified|universally certified/i);
});

test('typographic covers remain readable without images or JavaScript and reuse only original official image URLs', () => {
  const rows = articles(rendered('resources'));
  for (const [index, item] of resources.resourceItems.entries()) {
    const row = rows[index].body, cover = row.match(/<div class="wic-cover"[^>]*>[\s\S]*?<img class="wic-cover-image"[^>]*><\/div>/)[0];
    assert.ok(cover.includes('data-wic-cover="' + index + '" role="img" aria-label="' + escape(item.title) + '"'));
    assert.ok(cover.includes('<strong>' + escape(item.title) + '</strong>'));
    assert.match(cover, /WASION/);
    assert.match(cover, /PUBLICATION/);
    const image = attributes(cover.match(/<img\b[^>]*>/)[0]);
    assert.equal(image.src, encodeURI(item.image));
    assert.equal(new URL(image.src).origin, 'https://en.wasion.com');
    assert.equal(image.alt, '');
    assert.equal(image['aria-hidden'], 'true');
    assert.equal(image.loading, 'lazy');
    assert.doesNotMatch(cover, /wic-cover-loaded|\bon(?:load|error)=/);
    assert.match(row, /<img hidden src=/);
    assert.equal((row.match(/role="img"/g) || []).length, 1);
  }
  assert.match(INDUSTRIAL_COMPANY_RESOURCES_CSS, /\.wic-page \.wic-cover-image\{[^}]*opacity:0/);
  assert.match(INDUSTRIAL_COMPANY_RESOURCES_CSS, /\.wic-cover-loaded>\.wic-cover-type\{visibility:hidden\}/);
  assert.match(INDUSTRIAL_COMPANY_RESOURCES_CSS, /\.wic-page \.wic-cover-loaded>\.wic-cover-image\{opacity:1\}/);
});

test('the isolated image client handles cached success, pending load and failure without changing shared clients or making API calls', () => {
  const states = [{ complete: true, naturalWidth: 400 }, { complete: false, naturalWidth: 0 }, { complete: true, naturalWidth: 0 }];
  const images = states.map(state => Object.assign(eventNode('IMG'), state));
  const classes = images.map(() => new Set());
  const covers = images.map((image, index) => ({ querySelector: selector => selector === '.wic-cover-image' ? image : null,
    classList: { toggle(name, active) { if (active) classes[index].add(name); else classes[index].delete(name); } } }));
  // No fetch, storage, network or auth API is provided to this context.
  runInNewContext(INDUSTRIAL_COMPANY_RESOURCES_CLIENT, { document: { querySelectorAll: selector => {
    assert.equal(selector, '.wic-cover'); return [...covers, { querySelector: () => null }];
  } } }, { timeout: 1000 });
  const loaded = index => classes[index].has('wic-cover-loaded');
  assert.deepEqual(images.map((_, index) => loaded(index)), [true, false, false]);
  Object.assign(images[1], { complete: true, naturalWidth: 600 }); images[1].fire('load');
  assert.equal(loaded(1), true);
  Object.assign(images[1], { complete: true, naturalWidth: 0 }); images[1].fire('error');
  assert.equal(loaded(1), false, 'failure restores the visible text cover');
  images[2].fire('error'); assert.equal(loaded(2), false);
  Object.assign(images[2], { complete: true, naturalWidth: 200 }); images[2].fire('load');
  assert.equal(loaded(2), true, 'later successful retry can display the original cover');
});

test('both company openings move the original three-slide carousel once, with every source and accessible control', () => {
  for (const slug of ['company', 'about']) {
    const markup = rendered(slug), carousels = markup.match(/<section class="we-company-carousel"[\s\S]*?<\/section>/g);
    assert.equal(carousels.length, 1);
    assert.equal(hash(carousels[0]), 'a18923595ace6eb8d63f529bde6ede45837fe6567f78ad000810b6055f4d5cce');
    assert.ok(markup.indexOf(carousels[0]) < markup.indexOf('id="wic-content"'));
    assert.match(carousels[0], /aria-roledescription="carousel" aria-label="Wasion company images" tabindex="0"/);
    assert.equal((carousels[0].match(/class="we-company-slide"/g) || []).length, 3);
    assert.equal((carousels[0].match(/ hidden>/g) || []).length, 2);
    assert.match(carousels[0], /aria-label="Previous company image"/);
    assert.match(carousels[0], /aria-label="Next company image"/);
    assert.match(carousels[0], /aria-live="polite">1 of 3/);
  }
});

test('company facts retain source scope, accessible schematic locations and lifecycle navigation', () => {
  for (const slug of companySlugs) {
    const markup = rendered(slug);
    assert.match(markup, /Schematic map\. Mexico, Brazil, Tanzania and Hungary/);
    assert.match(markup, /aria-labelledby="we-map-title we-map-desc"/);
    for (const factory of FACTORIES) {
      assert.ok(markup.includes('<summary>' + factory.country + '<span>' + factory.region + '</span></summary>'));
      assert.ok(markup.includes(escape(factory.description)));
      assert.ok(markup.includes('href="' + base + '/' + (factory.caseSlug || 'certifications') + '"'));
    }
    if (slug !== 'global-presence') for (const value of ['1,200+', '9.4%', '100M+', '50+']) assert.ok(markup.includes(value));
    if (['company', 'about'].includes(slug)) for (const value of ['2000', '2005', 'Technical consultation', 'Installation', 'Training', 'Maintenance', 'Troubleshooting']) assert.ok(markup.includes(value));
  }
});

test('media kit keeps the official logo, native video source, fallback link and user-controlled playback', () => {
  const markup = rendered('media-kit'), video = resources.resourceItems.find(item => item.type === 'Explained Video');
  assert.match(markup, /<div class="we-logo-preview"><img src="https:\/\/en\.wasion\.com\/public\/uploads\/images\/20220517\/ad428c0c9f42220db4e310a71131810b\.png" alt="Wasion official logo"/);
  const player = markup.match(/<video\b[\s\S]*?<\/video>/)[0];
  assert.ok(player.startsWith('<video controls preload="none" poster="' + escape(encodeURI(video.image)) + '">'));
  assert.ok(player.includes('<source src="' + escape(encodeURI(video.url)) + '" type="video/mp4">'));
  assert.ok(player.includes('href="' + escape(encodeURI(video.url)) + '" target="_blank" rel="noopener noreferrer"'));
  assert.doesNotMatch(player, /autoplay|loop|muted|<iframe/);
});

test('the new hierarchy has named navigation, resolving anchors and auxiliary AI without adding client code', () => {
  for (const slug of targets) {
    const markup = rendered(slug), company = companySlugs.includes(slug);
    assert.equal((markup.match(/<h1\b/g) || []).length, 1);
    assert.match(markup, /<h1 id="wic-title">/);
    assert.match(markup, /aria-labelledby="wic-title"/);
    assert.match(markup, /aria-label="Breadcrumb"/);
    const nav = markup.match(/<nav class="wic-nav[^>]*>[\s\S]*?<\/nav>/)[0];
    assert.ok(nav.includes('aria-label="' + (company ? 'Company' : 'Resource') + ' navigation"'));
    assert.equal((nav.match(/<a\b/g) || []).length, 5);
    assert.equal((nav.match(/aria-current="page"/g) || []).length, 1);
    assert.ok(nav.includes('href="' + base + '/' + slug + '" aria-current="page"'));
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
    assert.equal(ids.length, new Set(ids).size, slug + ' unique IDs');
    for (const [, fragment] of markup.matchAll(/href="#([^\"]+)"/g)) assert.ok(ids.includes(fragment), slug + ' anchor ' + fragment);
    const ai = attributes(markup.match(/<a class="wic-ai"[^>]*>/)[0]);
    assert.equal(new URL(ai.href, 'https://crm.cnps.ai').pathname, base + '/search');
    assert.ok(new URL(ai.href, 'https://crm.cnps.ai').searchParams.get('q'));
    assert.doesNotMatch(markup, /<script\b|\b(?:onclick|onerror|onload)=|<form\b[^>]*action=[^>]*search/);
    for (const [, tag] of markup.matchAll(/(<a\b[^>]*target="_blank"[^>]*>)/g)) {
      const link = attributes(tag);
      assert.equal(link.rel, 'noopener noreferrer');
      assert.equal(new URL(link.href).origin, 'https://en.wasion.com');
    }
  }
  assert.match(INDUSTRIAL_COMPANY_RESOURCES_CSS, /\.wic-page :is\(a,button,input,select,summary\):focus-visible\{outline:/);
  assert.doesNotMatch(INDUSTRIAL_COMPANY_RESOURCES_CSS, /@import|url\s*\(|:root|\banimation\s*:/i);
  // Inspect group contents too: @media/@container are not blanket exceptions.
  for (const [, rule] of INDUSTRIAL_COMPANY_RESOURCES_CSS.matchAll(/([^{}]+)\{/g)) {
    if (/^@(?:media|container)\b/.test(rule.trim())) continue;
    assert.match(rule.trim(), /^(?:\.wic-|\.wd-style-industrial:has\(\.wic-page\))/);
  }
});

function eventNode(tagName = 'DIV', dataset = {}) {
  const listeners = new Map();
  return { tagName, dataset, value: '', hidden: false, textContent: '',
    addEventListener(type, callback) { const callbacks = listeners.get(type) || []; callbacks.push(callback); listeners.set(type, callbacks); },
    fire(type, fields = {}) {
      const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...fields };
      for (const callback of listeners.get(type) || []) callback(event);
      return event;
    }
  };
}

test('the real resource client retains 6-to-12 pagination, intersecting search/facets, empty state, submit and reset', () => {
  const markup = rendered('resources');
  const controls = Object.fromEntries(['q', 'type', 'topic'].map(key => [key, eventNode(key === 'q' ? 'INPUT' : 'SELECT', { filter: key })]));
  const items = articles(markup).map((row, id) => Object.assign(eventNode('ARTICLE', Object.fromEntries(Object.entries(attributes(row.attrs)).map(([key, value]) => [key.replace('data-', ''), value]))), { id }));
  const more = eventNode('BUTTON'), reset = eventNode('BUTTON'), count = eventNode(), empty = eventNode(), form = eventNode('FORM');
  const elements = { '.we-filter-more': more, '.we-filter-reset': reset, '.we-filter-count': count, '.we-filter-empty': empty, form };
  const scope = { dataset: { pageSize: markup.match(/data-page-size="(\d+)"/)[1] },
    querySelectorAll: selector => selector === '[data-filter]' ? Object.values(controls) : selector === '.we-filter-item' ? items : [],
    querySelector: selector => elements[selector] || null };
  runInNewContext(CONTENT_CLIENT, { document: { querySelectorAll: selector => selector === '.we-filter-scope' ? [scope] : [] } }, { timeout: 1000 });
  const visible = () => items.filter(item => !item.hidden).map(item => item.id);
  const set = (key, value) => { controls[key].value = value; controls[key].fire(key === 'q' ? 'input' : 'change'); };
  assert.equal(items.length, 12);
  assert.deepEqual(visible(), [0, 1, 2, 3, 4, 5]);
  assert.equal(count.textContent, '12 results · showing 6');
  assert.equal(more.hidden, false); assert.equal(empty.hidden, true);
  more.fire('click'); assert.deepEqual(visible(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal(count.textContent, '12 results'); assert.equal(more.hidden, true);
  set('q', 'HUNGARY'); assert.deepEqual(visible(), [0, 1, 2, 4, 5]);
  set('q', ''); assert.deepEqual(visible(), [0, 1, 2, 3, 4, 5]);
  set('type', 'Product Catalog'); assert.deepEqual(visible(), [6, 9, 11]);
  set('topic', 'Communications'); assert.deepEqual(visible(), [11]);
  set('q', 'TELECOM'); assert.deepEqual(visible(), [11]);
  set('q', 'electricity'); assert.deepEqual(visible(), []);
  assert.equal(count.textContent, '0 results'); assert.equal(empty.hidden, false); assert.equal(more.hidden, true);
  set('topic', 'Metering'); assert.deepEqual(visible(), [9]);
  reset.fire('click'); assert.deepEqual(Object.values(controls).map(control => control.value), ['', '', '']);
  assert.deepEqual(visible(), [0, 1, 2, 3, 4, 5]); assert.equal(empty.hidden, true); assert.equal(more.hidden, false);
  set('type', 'Explained Video'); set('topic', 'Communications'); set('q', 'g3-plc'); assert.deepEqual(visible(), [7]);
  reset.fire('click'); controls.q.value = 'iso';
  assert.equal(form.fire('submit').defaultPrevented, true); assert.deepEqual(visible(), [1, 2]);
});

test('the moved company carousel keeps click and arrow-key wraparound, live status and normal Tab navigation', () => {
  const markup = rendered('company').match(/<section class="we-company-carousel"[\s\S]*?<\/section>/)[0];
  const slides = [...markup.matchAll(/<figure class="we-company-slide"([^>]*)>/g)].map(([, attrs], id) => ({ id, hidden: /\bhidden\b/.test(attrs) }));
  const status = eventNode(); status.textContent = text(markup.match(/<span class="we-carousel-status"[^>]*>([^<]*)<\/span>/)[1]);
  const buttons = [...markup.matchAll(/<button[^>]*data-we-slide="(-?\d+)"[^>]*>/g)].map(([, value]) => eventNode('BUTTON', { weSlide: value }));
  const scope = Object.assign(eventNode('SECTION'), {
    querySelectorAll: selector => selector === '.we-company-slide' ? slides : selector === '[data-we-slide]' ? buttons : [],
    querySelector: selector => selector === '.we-carousel-status' ? status : null });
  runInNewContext(CONTENT_CLIENT, { document: { querySelectorAll: selector => selector === '.we-company-carousel' ? [scope] : [] } }, { timeout: 1000 });
  const expect = index => { assert.deepEqual(slides.filter(slide => !slide.hidden).map(slide => slide.id), [index]); assert.equal(status.textContent, `${index + 1} of 3`); };
  const previous = buttons.find(button => button.dataset.weSlide === '-1'), next = buttons.find(button => button.dataset.weSlide === '1');
  assert.equal(slides.length, 3); expect(0);
  previous.fire('click'); expect(2); next.fire('click'); expect(0);
  next.fire('click'); expect(1); next.fire('click'); expect(2); next.fire('click'); expect(0);
  assert.equal(scope.fire('keydown', { key: 'ArrowLeft' }).defaultPrevented, true); expect(2);
  assert.equal(scope.fire('keydown', { key: 'ArrowRight' }).defaultPrevented, true); expect(0);
  assert.equal(scope.fire('keydown', { key: 'Tab' }).defaultPrevented, false); expect(0);
});
