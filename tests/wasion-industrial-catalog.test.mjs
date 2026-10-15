import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { wasionDemoPage, WASION_PAGES, WASION_DEMO_ROUTES } from '../server/wasion-demo-page.mjs';
import { WASION_STYLES } from '../server/wasion-demo-styles.mjs';
import { getProductCatalog, renderProductCatalogFilters, WASION_PRODUCT_GROUPS, CONTENT_CLIENT } from '../server/wasion-experience/content.mjs';
import { INDUSTRIAL_CATALOG_ROUTES, renderIndustrialCatalog, INDUSTRIAL_CATALOG_CSS } from '../server/wasion-industrial-catalog.mjs';
import { isIndustrialStoryPage } from '../server/wasion-industrial-stories.mjs';
import { INDUSTRIAL_COMPANY_RESOURCE_ROUTES, INDUSTRIAL_COMPANY_RESOURCES_CLIENT } from '../server/wasion-industrial-company-resources.mjs';

const nonce = 'industrial-catalog-fixture';
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
const ctx = { pages: WASION_PAGES, base: '/demo/wasion', helpers: { title, image } };
const preview = value => { const valueText = String(value || '').replace(/\s+/g, ' ').trim(); return valueText.length > 220 ? valueText.slice(0, 217).trimEnd() + '…' : valueText; };
const itemProjection = item => ({ title: item.title, slug: item.slug || '', url: item.url, image: item.image, description: item.description, region: item.region, standard: item.standard, type: item.type });
const articles = markup => [...markup.matchAll(/<article class="we-filter-item"([^>]*)>([\s\S]*?)<\/article>/g)].map(([, attributes, body]) => ({ attributes, body }));
const dataAttributes = attributes => Object.fromEntries([...attributes.matchAll(/\bdata-([a-z-]+)="([^"]*)"/g)].map(([, key, value]) => [key, text(value)]));
const targets = ['products', 'our-offering', 'electricity-metering-data-management', 'electricity-meters', 'telecommunications', 'system-software', 'water-gas-meters', 'digital-grid-distribution-monitoring', 'intelligent-power-distribution', 'energy-storage', 'renewable-energy'];

// Captured from main d9e856fd338f937a47f0ae5550d2b2a22b1b57ab before
// this treatment. Full HTML and script snapshots use this fixed nonce. Data
// projections come from the old private catalog builder, captured in memory.
const leaves = {
  'electricity-meters': [27, 'df7c559eab9bea781b5bf6cfefb578c0d097e1ead9403deea58475b6ba1e29cd'],
  telecommunications: [19, '96579cc1c2342a55e631c5ed4c83a65f72dce3cc203100084f2f7877c55af97c'],
  'system-software': [11, '94bdefdcb8bd682fc547a37bf8ad512d7bf1a893839691d5dca3efe1c967a555'],
  'water-gas-meters': [6, '5192be0834aa849506942d57f2339ecf7ce8e31c284b05d0ff5ba553e54ec737'],
  'digital-grid-distribution-monitoring': [10, '7fc5f926b381aeb77e59b764e3299db97625a77d1ae0f14b590d0e027fb19796'],
  'intelligent-power-distribution': [10, '7fc5f926b381aeb77e59b764e3299db97625a77d1ae0f14b590d0e027fb19796'],
  'energy-storage': [14, 'd2dd6a02812cc814a2b10ce5e076b1170072e8d5908dae1ddfc7017ca068a86e'],
  'renewable-energy': [14, 'd2dd6a02812cc814a2b10ce5e076b1170072e8d5908dae1ddfc7017ca068a86e']
};

test('the shared catalog builder retains all 111 ordered rows and 87 unique published products', () => {
  assert.deepEqual(INDUSTRIAL_CATALOG_ROUTES, targets);
  assert.equal(hash(JSON.stringify(WASION_PAGES)), 'f7b21c05fa46f70bfed0eb9584501cff0deb37fdf47edec10b5b07670a2b4691');
  const records = [];
  for (const [slug, [count, expected]] of Object.entries(leaves)) {
    const { name, owner, items } = getProductCatalog(slug, ctx);
    assert.equal(items.length, count, slug);
    assert.equal(hash(JSON.stringify({ name, owner: owner.url, items: items.map(itemProjection) })), expected, slug + ' unchanged source-derived values and order');
    records.push(...items);
  }
  assert.equal(records.length, 111);
  const distinct = [...new Map(records.map(item => [item.url, item])).values()];
  assert.equal(distinct.length, 87);
  assert.equal(distinct.filter(item => item.slug).length, 29);
  assert.equal(distinct.filter(item => !item.slug).length, 58);
  assert.deepEqual(getProductCatalog('digital-grid-distribution-monitoring', ctx), getProductCatalog('intelligent-power-distribution', ctx));
  assert.deepEqual(getProductCatalog('energy-storage', ctx), getProductCatalog('renewable-energy', ctx));
  for (const slug of ['products', 'our-offering', 'electricity-metering-data-management', 'search', 'dtech-2026', 'unknown']) assert.equal(getProductCatalog(slug, ctx), null);
  assert.equal(renderIndustrialCatalog('search', ctx), null);
  assert.equal(hash(JSON.stringify(WASION_PAGES)), 'f7b21c05fa46f70bfed0eb9584501cff0deb37fdf47edec10b5b07670a2b4691', 'builders do not mutate shared records');
});

for (const slug of Object.keys(leaves)) test('Industrial catalog preserves rows, filters, wording and source destinations: ' + slug, () => {
  const { name, owner, items } = getProductCatalog(slug, ctx);
  const markup = main(wasionDemoPage(nonce, { style: 'industrial', slug }));
  assert.deepEqual([...markup.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(([, value]) => text(value)), [name]);
  assert.ok(markup.includes(escape(owner.summary)));
  assert.ok(markup.includes('href="' + escape(encodeURI(owner.url)) + '"'));
  assert.match(markup, /Confirm current regional availability and project requirements with Wasion/);
  const rendered = articles(markup);
  assert.equal(rendered.length, items.length);
  for (const [index, item] of items.entries()) {
    const { attributes, body } = rendered[index];
    assert.deepEqual(dataAttributes(attributes), { q: (item.title + ' ' + item.description).toLowerCase(), type: item.type, standard: item.standard, region: item.region }, item.title + ' original filter attributes');
    const heading = body.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)[1];
    assert.equal(text(heading).replace(/\s*↗$/, ''), item.title);
    assert.equal(text(body.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)[1]), preview(item.description));
    const destination = item.slug ? '/demo/wasion/' + item.slug : encodeURI(item.url);
    const anchors = [...body.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag);
    assert.equal(anchors.filter(tag => tag.includes('href="' + escape(destination) + '"')).length, 3, 'image, title and action share the source-backed destination');
    assert.ok(body.includes('href="' + escape(encodeURI(item.url)) + '"'), 'official product source retained or added');
    if (!item.slug) for (const tag of anchors) {
      assert.match(tag, /target="_blank" rel="noopener noreferrer"/);
      assert.doesNotMatch(tag, /href="\/demo\/wasion\//);
    }
  }
  const originalFilters = renderProductCatalogFilters(items, ctx, item => '<span>' + escape(item.title) + '</span>');
  assert.equal(articles(originalFilters).length, items.length);
  const selects = html => Object.fromEntries([...html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)].map(([, attributes, options]) => [attributes.match(/data-filter="([^"]+)"/)[1], { attributes, options }]));
  const originalSelects = selects(originalFilters), actualSelects = selects(markup);
  assert.deepEqual(Object.keys(actualSelects).sort(), ['region', 'standard', 'type']);
  for (const key of Object.keys(originalSelects)) {
    assert.equal(actualSelects[key].options, originalSelects[key].options, 'native facet options retain original values, order and labels');
    assert.match(actualSelects[key].attributes, /aria-label="[^"]+"/);
  }
  assert.match(markup, /<label>Search products<input type="search" data-filter="q" maxlength="160"/);
  assert.match(markup, /class="we-filter-scope" data-page-size="6" aria-label="products"/);
  assert.match(markup, /class="we-filter-count" aria-live="polite"/);
  assert.match(markup, /class="we-filter-empty" hidden/);
  assert.match(markup, /type="button" class="we-filter-more">Show more/);
  assert.match(markup, /type="button" class="we-filter-reset">Reset filters/);
  assert.match(markup, /<details class="wic-region"><summary>Regional information<\/summary><label>Region<select\b[^>]*data-filter="region"/);
  assert.doesNotMatch(markup, /<form\b[^>]*action="[^\"]*\/search/);
});

test('original product images take precedence; only verified owner images supplement uncaptured official entries', () => {
  const mapping = JSON.parse(readFileSync(new URL('../server/wasion-catalog-images.json', import.meta.url), 'utf8'));
  assert.equal(Object.keys(mapping).length, 38);
  const all = [...new Map(Object.keys(leaves).flatMap(slug => getProductCatalog(slug, ctx).items).map(item => [item.url, item])).values()];
  assert.equal(all.filter(item => !item.slug && mapping[item.url]).length, 26);
  assert.equal(all.filter(item => !item.slug && !mapping[item.url]).length, 32);
  for (const [url, photo] of Object.entries(mapping)) {
    assert.ok(all.some(item => item.url === url), 'mapped URL belongs to the existing catalog');
    assert.equal(new URL(url).origin, 'https://en.wasion.com');
    assert.equal(new URL(photo).origin, 'https://en.wasion.com');
    const owners = Object.keys(leaves).map(slug => getProductCatalog(slug, ctx)).filter(catalog => catalog.items.some(item => item.url === url)).map(catalog => catalog.owner);
    assert.ok(owners.some(owner => owner.images.some(imageUrl => new URL(imageUrl).href === new URL(photo).href)), 'supplementary photo already exists in the official owner record');
  }
  for (const slug of Object.keys(leaves)) {
    const items = getProductCatalog(slug, ctx).items;
    const rendered = articles(main(wasionDemoPage(nonce, { slug })));
    for (const [index, item] of items.entries()) {
      const expected = item.image || mapping[item.url];
      const photo = rendered[index].body.match(/<img\b[^>]*>/)?.[0];
      if (expected) {
        assert.ok(photo?.includes('src="' + escape(encodeURI(expected)) + '"'), item.title + ' exact original or verified image');
        assert.ok(photo.includes('alt="' + escape(item.title) + '"'));
      } else {
        assert.equal(photo, undefined, item.title + ' no fabricated image');
        assert.match(rendered[index].body, /wic-no-image/);
        assert.match(rendered[index].body, /View the published product on Wasion/);
      }
    }
  }
});

test('the two overview pages retain four business groups and the electricity hub retains its three original paths', () => {
  assert.deepEqual(WASION_PRODUCT_GROUPS.map(group => group[0]), ['electricity-metering-data-management', 'water-gas-meters', 'digital-grid-distribution-monitoring', 'energy-storage']);
  for (const slug of ['products', 'our-offering', 'electricity-metering-data-management']) {
    const markup = main(wasionDemoPage(nonce, { slug }));
    assert.equal((markup.match(/<h1\b/g) || []).length, 1);
    const cards = [...markup.matchAll(/<a class="wic-category-card" href="([^"]+)">([\s\S]*?)<\/a>/g)];
    const groups = slug === 'electricity-metering-data-management' ? [['electricity-meters', 'Electricity products'], ['telecommunications', 'Communication'], ['system-software', 'Software']] : WASION_PRODUCT_GROUPS;
    assert.equal(cards.length, groups.length);
    for (const [index, [key, name, description]] of groups.entries()) {
      assert.equal(cards[index][1], '/demo/wasion/' + key);
      assert.ok(cards[index][2].includes('<h3>' + escape(name) + '</h3>'));
      const expectedDescription = description || WASION_PAGES.find(page => page.slug === key).summary;
      assert.ok(cards[index][2].includes(escape(expectedDescription)));
    }
    const stage = markup.match(/<div class="wic-portfolio-stage"[\s\S]*?<\/div>/)[0];
    const models = slug === 'electricity-metering-data-management'
      ? ['ameter300-three-phase-smart-energy-meter', 'wir-3000-rf-communication-router', 'field-deployment-manager']
      : ['ameter300-three-phase-smart-energy-meter', 'i-110-series-smart-water-meter', 'wir-3000-rf-communication-router'];
    for (const model of models) {
      const page = WASION_PAGES.find(item => item.slug === model);
      assert.ok(stage.includes('href="/demo/wasion/' + model + '"'));
      assert.ok(stage.includes('src="' + escape(encodeURI(image(page))) + '"'));
    }
    if (slug === 'electricity-metering-data-management') {
      for (const label of ['1,200+', '9.4%', '100M+', '50+', 'Published certifications', 'Product catalogs and explained video']) assert.ok(markup.includes(label));
      for (const path of ['about.html', 'ElectricityMeters.html', 'resources.html']) assert.ok(markup.includes('href="https://en.wasion.com/' + path + '"'));
      for (const path of ['certifications', 'collateral-videos']) assert.ok(markup.includes('href="/demo/wasion/' + path + '"'));
    } else assert.ok(markup.includes('href="https://en.wasion.com/products.html"'));
    assert.doesNotMatch(markup, /<form\b/);
  }
});

test('all 450 shared script sets and 406 remaining HTML outputs remain byte-identical', () => {
  const clients = [], unaffected = [];
  for (const style of Object.keys(WASION_STYLES)) for (const slug of WASION_DEMO_ROUTES) {
    const html = wasionDemoPage(nonce, { style, slug });
    const expected = style === 'industrial' && targets.includes(slug);
    assert.equal(html.includes(INDUSTRIAL_CATALOG_CSS), expected, style + ' ' + slug + ' CSS boundary');
    assert.equal(main(html).includes('class="wic-catalog"'), expected, style + ' ' + slug + ' renderer boundary');
    clients.push([style, slug, hash(JSON.stringify(scripts(html)))]);
    const story = style === 'industrial' && isIndustrialStoryPage(WASION_PAGES.find(page => page.slug === slug) || { slug });
    const companyResource = style === 'industrial' && INDUSTRIAL_COMPANY_RESOURCE_ROUTES.includes(slug);
    if (!expected && !story && !companyResource) unaffected.push([style, slug, hash(html)]);
  }
  assert.equal(clients.length, 450);
  assert.equal(unaffected.length, 406);
  assert.equal(hash(JSON.stringify(clients)), 'a1d7755b3fc58307899afd372813a059f5f2721dc4c99cf2f9c5200f86551810');
  // Story and company/resource pages have their own presentation tests. This
  // subset was calculated from saved 744ab9a HTML, changing only the nonce.
  assert.equal(hash(JSON.stringify(unaffected)), '5d1a15b33c95dbaa73a4acbee5d005ad6f6ef75efc2113200bd856cd8cb1875b');
});

test('populated, empty and hostile search queries keep their complete outputs in every style', () => {
  const queries = ['I110', 'aMeter300 </script><script>alert(1)</script> & AMI', 'Unknown I999999 meter'];
  const expected = {
    classic: ['3d0077567c40ce4b36b8cfa9371dec9e3dc45a176ba45f77b964a278d601c298', 'aff4e822a3a24691ab18adeb0122433f7339edab1acdf48850916c09a14d7c35', '28cbf654b1abaf61dafeb4178bd544a1347bf5f1f6094ada8c3ffd29120e3b95'],
    atmospheric: ['8ccb2ba3076ab65a7cc1652e38de8c3dc38728759831a2eb4053d72e9a504547', '711a2940b57cb8773b8f1d485cbfcb7ff32146d47e6725134d29e8b1fdbae11a', '02d68b97e1a858c84b0324ba99e61714958855ffded07e379d0856993ba96bdd'],
    planhat: ['7cb9bd83821c6ac5f2aaed61b9ecf9493f0d69c7e2fb099543a942dc53c4e80e', '878d20e0e7ebe569c11feb684de1018bb3c731b27add6e7810b42c131ccbc3d8', 'ee1f94e601972a622b412d8cd4706a1a01572bb2f9f999e4ef03e47e2803ba4a'],
    orderful: ['2a037a40b32a9d08ccdcba7aea20a723edb6243f5d390b626747bd1f48b783b8', '4661538143d95ecd85779d05faeb8281e75bcd9c2677b07aaf15bacb3178ea4f', 'b6b1ec6dcd3c3c3c085296b35052ddae1d27a6b74fc4e90d0ae5f51599d91ed5'],
    industrial: ['de112f26a1365ea12e9776b5ad3cee3b1f2ce11e7be496fa05bdccc09d5273b4', '28a3d1f765d86f9091cf745f8efdb7a7233a705bd24788450c852c46159ba08b', 'd02ae01abdc2bd30640764a225f4ab2caf0108f8a3d6669771329b45e3c90293']
  };
  for (const style of Object.keys(WASION_STYLES)) for (const [index, query] of queries.entries()) assert.equal(hash(wasionDemoPage(nonce, { style, slug: 'search', query })), expected[style][index], style + ' query ' + index);
});

test('category navigation, named native controls and keyboard focus remain available in the scoped treatment', () => {
  for (const slug of targets) {
    const markup = main(wasionDemoPage(nonce, { slug }));
    const nav = markup.match(/<nav class="wic-category-nav[^>]*>([\s\S]*?)<\/nav>/)[1];
    const links = [...nav.matchAll(/<a\b([^>]*)>/g)].map(([, attributes]) => attributes);
    assert.equal(links.length, 7);
    assert.equal(links.filter(attributes => attributes.includes('aria-current="page"')).length, slug === 'electricity-metering-data-management' ? 0 : 1);
    assert.equal((markup.match(/<h1\b/g) || []).length, 1);
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
    assert.equal(ids.length, new Set(ids).size);
    for (const [, fragment] of markup.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(fragment));
    assert.match(markup, /aria-label="Breadcrumb"/);
    assert.ok(markup.includes('/demo/wasion/search?q='), 'AI remains an auxiliary link');
    assert.doesNotMatch(markup, /<script\b|\b(?:onclick|onerror|onload)=/);
  }
  assert.match(INDUSTRIAL_CATALOG_CSS, /\.wic-catalog :is\(a,button,input,select,summary\):focus-visible\{outline:/);
  assert.doesNotMatch(INDUSTRIAL_CATALOG_CSS, /@import|url\s*\(|:root|\b(?:animation|transition)\s*:/i);
  for (const [, rule] of INDUSTRIAL_CATALOG_CSS.matchAll(/([^{}]+)\{/g)) {
    if (/^@(?:media|container)\b/.test(rule.trim())) continue;
    const selectors = [];
    let depth = 0, start = 0;
    for (let index = 0; index < rule.length; index++) {
      if ('(['.includes(rule[index])) depth++;
      if (')]'.includes(rule[index])) depth--;
      if (rule[index] === ',' && depth === 0) { selectors.push(rule.slice(start, index)); start = index + 1; }
    }
    selectors.push(rule.slice(start));
    for (const selector of selectors) assert.match(selector.trim(), /^(?:\.wic-[\w-]+|\.wd-style-industrial:has\(\.wic-catalog\))(?=[\s.:>+~#\[]|$)/, 'scoped selector: ' + selector);
  }
});

function filterHarness() {
  function node(tagName = 'DIV', dataset = {}) {
    const listeners = new Map();
    return {
      tagName, dataset, value: '', hidden: false, textContent: '',
      addEventListener(type, callback) {
        const callbacks = listeners.get(type) || [];
        callbacks.push(callback);
        listeners.set(type, callbacks);
      },
      fire(type) {
        const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
        for (const callback of listeners.get(type) || []) callback(event);
        return event;
      }
    };
  }
  const controls = Object.fromEntries(['q', 'type', 'standard', 'region'].map(key => [key, node(key === 'q' ? 'INPUT' : 'SELECT', { filter: key })]));
  const records = [
    { q: 'Café aMeter300', type: 'Smart metering', standard: 'IEC 62052|IEC 62053', region: 'Europe' },
    { q: 'CAFE prepayment', type: 'Prepayment', standard: 'IEC 62053', region: 'Europe' },
    { q: 'cafe ANSI grid', type: 'Smart metering', standard: 'ANSI C12.20', region: 'North America' },
    ...Array.from({ length: 10 }, (_, index) => ({ q: 'Product ' + index, type: 'Communication', standard: 'Not specified', region: 'Not specified' }))
  ];
  const items = records.map((record, id) => Object.assign(node('ARTICLE', record), { id }));
  const more = node('BUTTON'), reset = node('BUTTON'), count = node(), empty = node(), form = node('FORM');
  const selectors = { '.we-filter-more': more, '.we-filter-reset': reset, '.we-filter-count': count, '.we-filter-empty': empty, form };
  const scope = Object.assign(node('SECTION', { pageSize: '6' }), {
    querySelectorAll(selector) { return selector === '[data-filter]' ? Object.values(controls) : selector === '.we-filter-item' ? items : []; },
    querySelector(selector) { return selectors[selector] || null; }
  });
  runInNewContext(CONTENT_CLIENT, { document: { querySelectorAll: selector => selector === '.we-filter-scope' ? [scope] : [] } }, { timeout: 1000 });
  return {
    controls, more, reset, count, empty, form,
    visible: () => items.filter(item => !item.hidden).map(item => item.id),
    set(key, value) { controls[key].value = value; controls[key].fire(key === 'q' ? 'input' : 'change'); }
  };
}

test('the unchanged production filter client preserves paging, normalization, intersections, reset and empty states', () => {
  const h = filterHarness(), firstSix = [0, 1, 2, 3, 4, 5];
  assert.deepEqual(h.visible(), firstSix);
  assert.equal(h.count.textContent, '13 results · showing 6');
  assert.equal(h.more.hidden, false);
  assert.equal(h.empty.hidden, true);
  h.more.fire('click');
  assert.deepEqual(h.visible(), Array.from({ length: 12 }, (_, index) => index));
  assert.equal(h.count.textContent, '13 results · showing 12');
  h.more.fire('click');
  assert.equal(h.visible().length, 13);
  assert.equal(h.more.hidden, true);
  h.set('q', 'CaFÉ');
  assert.deepEqual(h.visible(), [0, 1, 2]);
  assert.equal(h.count.textContent, '3 results');
  h.set('q', '');
  assert.deepEqual(h.visible(), firstSix, 'a control change resets expanded pagination');
  h.set('q', 'CaFÉ');
  h.set('standard', 'IEC 62053');
  assert.deepEqual(h.visible(), [0, 1], 'a listed standard can match the second pipe-delimited token');
  h.set('type', 'Smart metering');
  assert.deepEqual(h.visible(), [0]);
  h.set('region', 'North America');
  assert.deepEqual(h.visible(), []);
  h.set('region', 'Europe');
  assert.deepEqual(h.visible(), [0]);
  h.set('q', 'no such model');
  assert.deepEqual(h.visible(), []);
  assert.equal(h.count.textContent, '0 results');
  assert.equal(h.empty.hidden, false);
  assert.equal(h.more.hidden, true);
  h.reset.fire('click');
  assert.deepEqual(Object.values(h.controls).map(control => control.value), ['', '', '', '']);
  assert.deepEqual(h.visible(), firstSix);
  assert.equal(h.empty.hidden, true);
  assert.equal(h.more.hidden, false);
  h.controls.q.value = 'ameter';
  assert.equal(h.form.fire('submit').defaultPrevented, true);
  assert.deepEqual(h.visible(), [0], 'native submit applies a value even without a preceding input event');
});
