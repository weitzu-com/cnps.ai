import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { wasionDemoPage as renderWasionDemoPage, WASION_PAGES, WASION_LEGACY_ROUTES as WASION_DEMO_ROUTES } from '../server/wasion-demo-page.mjs';
import { WASION_STYLES as ALL_WASION_STYLES } from '../server/wasion-demo-styles.mjs';
import { CHALLENGES, EXPERIENCE_ROUTES, EXPERIENCE_RELATIONSHIPS, getCaseStudies, renderCaseStudyFilters, CONTENT_CLIENT } from '../server/wasion-experience/content.mjs';
import { isIndustrialStoryPage, renderIndustrialStory, projectHighlights, INDUSTRIAL_STORIES_CSS } from '../server/wasion-industrial-stories.mjs';
import { INDUSTRIAL_COMPANY_RESOURCE_ROUTES, INDUSTRIAL_COMPANY_RESOURCES_CLIENT } from '../server/wasion-industrial-company-resources.mjs';

// Retained Industrial coverage is pinned explicitly now that 09/16 is canonical.
const WASION_STYLES = Object.fromEntries(Object.entries(ALL_WASION_STYLES).filter(([style]) => style !== 'requirements'));
const wasionDemoPage = (nonce, options = {}) => renderWasionDemoPage(nonce, { style: 'industrial', ...options });

const nonce = 'industrial-stories-fixture';
const hash = value => createHash('sha256').update(value).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const text = markup => markup.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, entity => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }[entity]));
const main = html => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
const scripts = html => html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g).map(tag => {
  const suffix = INDUSTRIAL_COMPANY_RESOURCES_CLIENT + '</script>';
  return tag.endsWith(suffix) ? tag.slice(0, -suffix.length) + '</script>' : tag;
});
const title = page => page.title.replace(/ - (Content Page|Content|Relevant Product|Newsroom|IEC Smart Meters|IEC Prepaid Meters|ANSI Meters|Cellular Communication|Wi-SUN RF Mesh)$/, '');
const image = page => page?.images?.find(url => url.includes('/uploads/images/')) || page?.images?.find(url => !/icon|x-pro-info|searc/i.test(url));
const ctx = { pages: WASION_PAGES, base: '/demo/wasion/styles/industrial', helpers: { title, image } };
const raw = WASION_PAGES.filter(page => ['Solutions', 'Success Stories'].includes(page.category));
const solutions = raw.filter(page => page.category === 'Solutions' && page.pageType === 'detail');
const cases = raw.filter(page => page.category === 'Success Stories' && page.pageType === 'detail');
const targetSlugs = new Set([...raw, ...EXPERIENCE_ROUTES.filter(page => ['Solutions', 'Success Stories'].includes(page.category))].map(page => page.slug));
const pageInfo = slug => WASION_PAGES.find(page => page.slug === slug) || EXPERIENCE_ROUTES.find(page => page.slug === slug) || { slug };
const articles = markup => [...markup.matchAll(/<article class="we-filter-item"([^>]*)>([\s\S]*?)<\/article>/g)].map(([, attributes, body]) => ({ attributes, body }));
const attributes = tag => Object.fromEntries([...tag.matchAll(/\b([a-z-]+)="([^"]*)"/g)].map(([, key, value]) => [key, text(value)]));
const section = (markup, id) => {
  const found = markup.match(new RegExp('<section\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/section>'));
  assert.ok(found, id + ' section');
  return found[1];
};

// Frozen from main 449a5e1d242b2aabcf6e0fd10175a4596ea75624 before
// the presentation change. HTML and script fingerprints were refreshed for the
// intentional 09/16 default and retained Industrial route relocation. Solution tails cover all original
// paragraphs, capabilities, discovery panels, relationships and source links.
const solutionTails = {
  'wisun-solutions': 'e9655fe178ede3dd3c8edc623cab09a7642c2c8afc5226cf45da698a63c976e5',
  'cluster-metering-solutions': 'cff37532a0d09673cffaaa65b9ac5f0da3c7f8eaabcc71c86d78434dc1db3719',
  'cellular-based-ami-solutions': 'a1d3d91d43bb5e91f42a0599f054bd8c3d5921edf8ecf264bfef3c0034495593',
  'walk-drive-by-solutions': '90b0b0b90480a3e768fae5386a57be2db2483e9441d8ad1211b58388a2193fd7',
  'energy-loss-reduction-solutions': '45f388ab05d7980f33797e9313be37b2e24f4518d127820308ed225652f27e7d',
  'prepayment-solutions': '665299a35947e48456ee3277fa5887b32311d4ca796bebe05d7d01e68a20f564',
  'tms-transformer-monitoring-system': '5d5bf8188f8e52de07f6d272989db39816cccae0eb7222e6b400ba95fad83225',
  'energy-pro': 'fdb547388c90972eba30682b2b0d753dc95cb41c20c6c6b5f6f739363c100bea',
  'wasion-g3-plc-rf-hybrid-solutions': '698a2c9ddf4d4d9e7391c973fca74785173d0d9c0953cac1a76cdbbac36377a1'
};

test('all 18 official records and the existing challenges, relationships and experience metadata remain unchanged', () => {
  assert.equal(raw.length, 18);
  assert.equal(solutions.length, 9);
  assert.equal(cases.length, 7);
  assert.equal(targetSlugs.size, 25);
  assert.equal(hash(JSON.stringify(raw)), 'bebdec2fa16a56f011721df83ee9f18db148a4e81d872cf29b6e57428fbb3f1f');
  assert.equal(hash(JSON.stringify(WASION_PAGES)), 'f7b21c05fa46f70bfed0eb9584501cff0deb37fdf47edec10b5b07670a2b4691');
  assert.equal(hash(JSON.stringify(EXPERIENCE_ROUTES)), '4d82b874da7579626967c0a7a9530a4810539a74d5452c29a51548302d1d9a6b');
  assert.equal(hash(JSON.stringify(CHALLENGES)), '50462fc245301602ee3a3021a6e8288817b64b4dddf83fe06e56cc6d1fbd5387');
  assert.equal(hash(JSON.stringify(EXPERIENCE_RELATIONSHIPS)), '2b8e88c9574b2da72e65440f517a6a003eb361dddabbff0dad922987d860a1fe');
  assert.equal(renderIndustrialStory({ slug: 'search' }, {}, '<p>Original component</p>'), '<p>Original component</p>');
  assert.equal(isIndustrialStoryPage(null), false);
});

test('all 450 shared script sets and 417 non-story, non-company/resource HTML pages remain byte-identical', () => {
  const clients = [], unaffected = [];
  for (const style of Object.keys(WASION_STYLES)) for (const slug of WASION_DEMO_ROUTES) {
    const html = wasionDemoPage(nonce, { style, slug });
    const expected = style === 'industrial' && targetSlugs.has(slug);
    assert.equal(isIndustrialStoryPage(pageInfo(slug)), targetSlugs.has(slug), slug + ' predicate');
    assert.equal(html.includes(INDUSTRIAL_STORIES_CSS), expected, style + ' ' + slug + ' CSS scope');
    assert.equal(main(html).includes('class="wis-experience-page'), expected, style + ' ' + slug + ' markup scope');
    clients.push([style, slug, hash(JSON.stringify(scripts(html)))]);
    const companyResource = style === 'industrial' && INDUSTRIAL_COMPANY_RESOURCE_ROUTES.includes(slug);
    if (!expected && !companyResource) unaffected.push([style, slug, hash(html)]);
  }
  assert.equal(clients.length, 450);
  assert.equal(unaffected.length, 417);
  assert.equal(hash(JSON.stringify(clients)), 'fcf17ee75cfaf97c1578f050206396fab1d9b39bc88d3a2c11bbc483bce94765');
  // The eight company/resource pages have separate presentation coverage; this
  // reduced subset comes from frozen 1fd2731 HTML, retaining its 09/16 routing.
  assert.equal(hash(JSON.stringify(unaffected)), '930898e5355d888a33af73ef825557504851abc4ae86743f5d2153a989aedfed');
});

for (const page of solutions) test('solution retains its complete original body, capabilities and discovery semantics: ' + page.slug, () => {
  const markup = main(wasionDemoPage(nonce, { slug: page.slug }));
  const start = markup.indexOf('<div class="wd-container we-content');
  assert.ok(start >= 0);
  const originalBody = markup.slice(start, markup.lastIndexOf('</div>'));
  assert.equal(hash(originalBody), solutionTails[page.slug]);
  const overview = section(markup, 'overview');
  const paragraphs = [...overview.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(([, value]) => text(value));
  assert.deepEqual(paragraphs, [...new Set(page.paragraphs)].filter(value => !page.features.includes(value)));
  for (const feature of page.features) assert.ok(section(markup, 'features').includes(escape(feature)));
  assert.ok(markup.includes('href="' + escape(encodeURI(page.url)) + '"'));
  assert.ok(markup.includes('src="' + escape(encodeURI(image(page))) + '"'), 'original solution illustration');
  assert.match(markup, /does not establish a certified architecture, wiring topology or product compatibility/);
  assert.match(markup, /They do not establish a certified system configuration or model compatibility/);
  const rel = EXPERIENCE_RELATIONSHIPS[page.slug];
  if (rel) for (const slug of [rel.challenge, ...rel.products, ...rel.cases]) assert.ok(markup.includes('href="/demo/wasion/styles/industrial/' + slug + '"'));
  const tabs = [...markup.matchAll(/<button\b[^>]*role="tab"[^>]*>/g)].map(([tag]) => attributes(tag));
  const panels = [...markup.matchAll(/<div\b[^>]*role="tabpanel"[^>]*>/g)].map(([tag]) => ({ ...attributes(tag), hidden: /\shidden(?:\s|>)/.test(tag) }));
  assert.ok(tabs.length >= 2);
  assert.equal(tabs.length, panels.length);
  assert.equal(tabs.filter(tab => tab['aria-selected'] === 'true' && tab.tabindex === '0').length, 1);
  for (const [index, tab] of tabs.entries()) {
    assert.equal(tab['aria-controls'], panels[index].id);
    assert.equal(panels[index]['aria-labelledby'], tab.id);
    assert.equal(panels[index].hidden, index !== 0);
    assert.equal(panels[index].tabindex, '0');
  }
});

for (const page of cases) test('project retains complete source context, original illustration, facts and auxiliary AI: ' + page.slug, () => {
  const markup = main(wasionDemoPage(nonce, { slug: page.slug }));
  assert.deepEqual([...markup.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(([, value]) => text(value)), [title(page)]);
  const story = markup.match(/<div class="wis-story-copy">([\s\S]*?)<\/div>/)[1];
  assert.deepEqual([...story.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(([, value]) => text(value)), page.paragraphs, 'all original paragraphs, including qualifiers and reported results');
  for (const paragraph of page.paragraphs.slice(0, 2)) {
    const separator = paragraph.indexOf(':');
    assert.ok(markup.includes('<dt>' + escape(paragraph.slice(0, separator).trim()) + '</dt>'));
    assert.ok(markup.includes('<dd>' + escape(paragraph.slice(separator + 1).trim()) + '</dd>'));
  }
  const hero = markup.match(/<figure class="wis-scene wis-scene-contain">([\s\S]*?)<\/figure>/)[1];
  assert.ok(hero.includes('src="' + escape(encodeURI(image(page))) + '"'), 'detail uses its original official illustration');
  assert.ok(hero.includes('alt="' + escape(title(page)) + '"'));
  const documents = section(markup, 'documents');
  assert.ok(documents.includes('href="' + escape(encodeURI(page.url)) + '"'));
  assert.match(documents, /Confirm specifications, availability and project suitability with Wasion/);
  assert.match(documents, /target="_blank" rel="noopener noreferrer"/);
  assert.ok(markup.includes('href="/demo/wasion/styles/industrial/contact"'));
  const ai = markup.match(/<a class="wis-ai" href="([^"]+)"/)[1];
  assert.equal(new URL(ai, 'https://crm.cnps.ai').searchParams.get('q'), 'Tell me about ' + title(page));
  assert.doesNotMatch(markup, /<form\b/);
  assert.match(markup, /Project scale and results as published by Wasion/);
});

test('project highlights preserve dates, meter types and capacity context without promoting estimates into results', () => {
  const expected = [
    [{ value: '60 MW', label: 'Installed photovoltaic capacity' }, { value: '15 MW/30 MWh', label: 'New energy storage capacity' }],
    [{ value: 'over 3.5 million', label: 'Single-phase and Three-phase Smart Meters · Since 2021' }],
    [{ value: '500,000', label: 'Single-phase Smart Prepaid Meters · From 2018 to 2022' }],
    [{ value: 'over 500,000', label: 'Single-phase and Three-phase Smart Prepaid Meters · From 2020 to 2022' }],
    [{ value: '600 kW', label: 'PV capacity · each energy station' }],
    [{ value: '420,000', label: 'single-phase prepaid meters · From 2015 to 2017' }],
    [{ value: '200,000', label: 'Three-phase Smart Meters' }]
  ];
  for (const [index, page] of cases.entries()) assert.deepEqual(projectHighlights(page), expected[index], page.slug);
  const agri = main(wasionDemoPage(nonce, { slug: cases[0].slug }));
  assert.ok(section(agri, 'overview').includes('over 25 years is estimated to be approximately 2.236 billion kWh'));
  assert.doesNotMatch(JSON.stringify(projectHighlights(cases[0])), /2\.236|89\.45|generation|result/i);
  assert.ok(section(main(wasionDemoPage(nonce, { slug: cases[4].slug })), 'overview').includes('Each energy station has a 600 kW PV capacity'));
  assert.ok(cases[6].paragraphs[2].includes('Wasion helped CET of State Grid of China supply'));
  assert.deepEqual(projectHighlights({ paragraphs: [] }), []);
});

test('the case directories preserve seven source-backed rows, original filter attributes and 260-character previews', () => {
  const records = getCaseStudies(ctx);
  const projection = records.map(page => ({ slug: page.slug, title: page.title, url: page.url, description: page.description, image: page.image, region: page.region, topic: page.topic }));
  assert.equal(hash(JSON.stringify(projection)), 'eec3b665de926ea8773ff70b66f3299b92c4d8553f0327cbfda6b084d921d4b6');
  const covers = JSON.parse(readFileSync(new URL('../server/wasion-story-covers.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(covers), cases.map(page => page.slug));
  assert.equal(hash(JSON.stringify(covers)), '22cf60011c16535965a0fba7e96981b1fdd11ebb9656d95a5a979a2fbef474c0', 'the seven reviewed case-to-cover associations remain fixed');
  for (const cover of Object.values(covers)) assert.equal(new URL(cover).origin, 'https://en.wasion.com');
  for (const slug of ['case-studies', 'success-stories']) {
    const markup = main(wasionDemoPage(nonce, { slug })), rendered = articles(markup);
    assert.equal(rendered.length, 7);
    assert.match(markup, /class="we-filter-scope" data-page-size="6" aria-label="case studies"/);
    assert.match(markup, /<label>Search case studies<input type="search" data-filter="q" maxlength="160"/);
    for (const [index, item] of records.entries()) {
      const row = rendered[index], attrs = attributes(row.attributes);
      assert.deepEqual(attrs, { 'data-q': (item.title + ' ' + item.description).toLowerCase(), 'data-region': item.region, 'data-topic': item.topic });
      assert.ok(row.body.includes('<h3>'));
      assert.ok(row.body.includes(escape(item.title)));
      assert.ok(row.body.includes('href="/demo/wasion/styles/industrial/' + item.slug + '"'));
      assert.ok(row.body.includes('href="' + escape(encodeURI(item.url)) + '"'));
      assert.ok(row.body.includes('src="' + escape(encodeURI(covers[item.slug])) + '"'));
      assert.equal(text(row.body.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)[1]), item.description.slice(0, 260) + (item.description.length > 260 ? '…' : ''));
    }
    const original = renderCaseStudyFilters(records, ctx, () => '<span>Fixture</span>');
    const options = html => Object.fromEntries([...html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)].map(([, tag, body]) => [attributes(tag)['data-filter'], body]));
    assert.deepEqual(options(markup), options(original));
    for (const [, tag] of markup.matchAll(/<select\b([^>]*)>/g)) assert.match(tag, /aria-label="(?:Region|Topic)"/);
    assert.match(markup, /class="we-filter-count" aria-live="polite"/);
    assert.match(markup, /class="we-filter-empty" hidden/);
    assert.match(markup, /class="we-filter-more">Show more/);
  }
});

test('all 25 pages retain accessible navigation, unique IDs, resolving anchors and every declared source', () => {
  const pages = new Map();
  const rendered = slug => { if (!pages.has(slug)) pages.set(slug, main(wasionDemoPage(nonce, { slug }))); return pages.get(slug); };
  for (const slug of targetSlugs) {
    const page = pageInfo(slug), markup = rendered(slug);
    assert.equal((markup.match(/<h1\b/g) || []).length, 1, slug);
    assert.match(markup, /aria-label="Breadcrumb"/);
    assert.match(markup, /aria-labelledby="wis-title"/);
    const scene = attributes(markup.match(/<a class="wis-scene-image"[^>]*>/)[0]);
    assert.equal(new URL(scene.href).origin, 'https://en.wasion.com');
    assert.equal(scene.target, '_blank');
    assert.equal(scene.rel, 'noopener noreferrer');
    assert.match(scene['aria-label'], /^Open official Wasion page: /);
    const nav = markup.match(/<nav class="wis-nav[^>]*>([\s\S]*?)<\/nav>/)[1];
    assert.equal((nav.match(/<a\b/g) || []).length, 6);
    for (const path of ['solutions', ...CHALLENGES.map(challenge => challenge.slug), 'case-studies']) assert.ok(nav.includes('href="/demo/wasion/styles/industrial/' + path + '"'));
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
    assert.equal(ids.length, new Set(ids).size, slug + ' unique IDs');
    for (const [, id] of markup.matchAll(/aria-labelledby="([^"]+)"/g)) assert.ok(ids.includes(id), slug + ' named section ' + id);
    for (const [, href] of markup.matchAll(/href="(\/demo\/wasion\/styles\/industrial[^\"]*)"/g)) {
      const url = new URL(text(href), 'https://crm.cnps.ai');
      if (!url.hash) continue;
      const linkedSlug = url.pathname.slice('/demo/wasion/styles/industrial/'.length);
      assert.ok(WASION_DEMO_ROUTES.includes(linkedSlug));
      assert.ok(rendered(linkedSlug).includes('id="' + url.hash.slice(1) + '"'), slug + ' resolving anchor ' + href);
    }
    for (const url of [page.url, ...(page.sourceUrls || [])].filter(Boolean)) assert.ok(markup.includes('href="' + escape(encodeURI(url)) + '"'), slug + ' official source ' + url);
    assert.doesNotMatch(markup, /<script\b|\b(?:onclick|onerror|onload)=/);
  }
  assert.match(INDUSTRIAL_STORIES_CSS, /\.wis-experience-page :is\(a,button,input,select,summary\):focus-visible\{outline:/);
  assert.doesNotMatch(INDUSTRIAL_STORIES_CSS, /@import|url\s*\(|:root|\b(?:animation|transition)\s*:/i);
  for (const [, rule] of INDUSTRIAL_STORIES_CSS.matchAll(/([^{}]+)\{/g)) {
    if (/^@(?:media|container)\b/.test(rule.trim())) continue;
    const selectors = [];
    let depth = 0, start = 0;
    for (let index = 0; index < rule.length; index++) {
      if ('(['.includes(rule[index])) depth++;
      if (')]'.includes(rule[index])) depth--;
      if (rule[index] === ',' && depth === 0) { selectors.push(rule.slice(start, index)); start = index + 1; }
    }
    selectors.push(rule.slice(start));
    for (const selector of selectors) assert.match(selector.trim(), /^(?:\.wis-[\w-]+|\.wd-style-industrial:has\(\.wis-experience-page\))(?=[\s.:>+~#\[]|$)/, 'scoped selector: ' + selector);
  }
});

function eventNode(tagName = 'DIV', dataset = {}) {
  const listeners = new Map();
  return {
    tagName, dataset, value: '', hidden: false, textContent: '',
    addEventListener(type, callback) { const callbacks = listeners.get(type) || []; callbacks.push(callback); listeners.set(type, callbacks); },
    fire(type, fields = {}) {
      const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...fields };
      for (const callback of listeners.get(type) || []) callback(event);
      return event;
    }
  };
}

test('the original client filters the actual seven cases with paging, accent-insensitive search and intersecting facets', () => {
  const records = getCaseStudies(ctx);
  const controls = Object.fromEntries(['q', 'region', 'topic'].map(key => [key, eventNode(key === 'q' ? 'INPUT' : 'SELECT', { filter: key })]));
  const items = records.map((record, id) => Object.assign(eventNode('ARTICLE', { q: (record.title + ' ' + record.description).toLowerCase(), region: record.region, topic: record.topic }), { id }));
  const more = eventNode('BUTTON'), reset = eventNode('BUTTON'), count = eventNode(), empty = eventNode(), form = eventNode('FORM');
  const elements = { '.we-filter-more': more, '.we-filter-reset': reset, '.we-filter-count': count, '.we-filter-empty': empty, form };
  const scope = Object.assign(eventNode('SECTION', { pageSize: '6' }), {
    querySelectorAll: selector => selector === '[data-filter]' ? Object.values(controls) : selector === '.we-filter-item' ? items : [],
    querySelector: selector => elements[selector] || null
  });
  runInNewContext(CONTENT_CLIENT, { document: { querySelectorAll: selector => selector === '.we-filter-scope' ? [scope] : [] } }, { timeout: 1000 });
  const visible = () => items.filter(item => !item.hidden).map(item => item.id);
  const set = (key, value) => { controls[key].value = value; controls[key].fire(key === 'q' ? 'input' : 'change'); };
  assert.deepEqual(visible(), [0, 1, 2, 3, 4, 5]);
  assert.equal(count.textContent, '7 results · showing 6');
  assert.equal(more.hidden, false);
  more.fire('click');
  assert.deepEqual(visible(), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(count.textContent, '7 results');
  assert.equal(more.hidden, true);
  set('q', 'COTE'); assert.deepEqual(visible(), [3]);
  set('q', 'cÔtÉ'); assert.deepEqual(visible(), [3]);
  set('q', ''); assert.deepEqual(visible(), [0, 1, 2, 3, 4, 5]);
  set('topic', 'Metering'); assert.deepEqual(visible(), [1, 2, 3, 5, 6]);
  set('region', "Côte d'Ivoire"); assert.deepEqual(visible(), [3]);
  set('topic', 'Energy storage & microgrids'); assert.deepEqual(visible(), []);
  assert.equal(empty.hidden, false);
  set('region', 'Hainan, China'); assert.deepEqual(visible(), [0]);
  set('q', 'microgrid'); assert.deepEqual(visible(), []);
  reset.fire('click');
  assert.deepEqual(Object.values(controls).map(control => control.value), ['', '', '']);
  assert.deepEqual(visible(), [0, 1, 2, 3, 4, 5]);
  assert.equal(empty.hidden, true);
  set('topic', 'Energy storage & microgrids'); assert.deepEqual(visible(), [0, 4]);
  set('q', 'microgrid'); assert.deepEqual(visible(), [4]);
  set('q', 'no such model'); assert.deepEqual(visible(), []);
  assert.equal(count.textContent, '0 results');
  assert.equal(empty.hidden, false);
  assert.equal(more.hidden, true);
  reset.fire('click'); controls.q.value = 'cote';
  assert.equal(form.fire('submit').defaultPrevented, true);
  assert.deepEqual(visible(), [3]);
});

test('the original discovery client keeps keyboard selection, roving focus and one visible panel', () => {
  const markup = main(wasionDemoPage(nonce, { slug: 'wisun-solutions' }));
  let focused;
  const tabs = [...markup.matchAll(/<button\b[^>]*role="tab"[^>]*>/g)].map(([tag]) => {
    const attrs = attributes(tag);
    return Object.assign(eventNode('BUTTON'), { attrs, tabIndex: Number(attrs.tabindex), setAttribute(key, value) { attrs[key] = value; }, focus() { focused = this; } });
  });
  const panels = [...markup.matchAll(/<div\b[^>]*role="tabpanel"[^>]*>/g)].map(([tag]) => ({ hidden: /\shidden(?:\s|>)/.test(tag) }));
  const scope = { querySelectorAll: selector => selector === '[data-we-discovery]' ? tabs : selector === '.we-discovery-panel' ? panels : [] };
  runInNewContext(CONTENT_CLIENT, { document: { querySelectorAll: selector => selector === '.we-discovery' ? [scope] : [] } }, { timeout: 1000 });
  const selected = index => {
    assert.deepEqual(tabs.map(tab => tab.attrs['aria-selected']), tabs.map((_, position) => String(position === index)));
    assert.deepEqual(tabs.map(tab => tab.tabIndex), tabs.map((_, position) => position === index ? 0 : -1));
    assert.deepEqual(panels.map(panel => panel.hidden), panels.map((_, position) => position !== index));
  };
  assert.equal(tabs[0].fire('keydown', { key: 'End' }).defaultPrevented, true); selected(tabs.length - 1); assert.equal(focused, tabs.at(-1));
  tabs.at(-1).fire('keydown', { key: 'ArrowRight' }); selected(0);
  tabs[0].fire('keydown', { key: 'ArrowLeft' }); selected(tabs.length - 1);
  tabs.at(-1).fire('keydown', { key: 'Home' }); selected(0); assert.equal(focused, tabs[0]);
  tabs[1].fire('click'); selected(1);
  assert.equal(tabs[1].fire('keydown', { key: 'Tab' }).defaultPrevented, false); selected(1);
});
