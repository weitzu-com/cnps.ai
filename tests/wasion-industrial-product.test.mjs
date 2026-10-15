import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';
import { wasionDemoPage as renderWasionDemoPage, WASION_PAGES, WASION_LEGACY_ROUTES as WASION_DEMO_ROUTES } from '../server/wasion-demo-page.mjs';
import { WASION_STYLES as ALL_WASION_STYLES } from '../server/wasion-demo-styles.mjs';
import { INDUSTRIAL_PRODUCT_CSS } from '../server/wasion-industrial-product.mjs';
import { INDUSTRIAL_CATALOG_ROUTES } from '../server/wasion-industrial-catalog.mjs';
import { isIndustrialStoryPage } from '../server/wasion-industrial-stories.mjs';
import { INDUSTRIAL_COMPANY_RESOURCE_ROUTES } from '../server/wasion-industrial-company-resources.mjs';
import { isIndustrialNewsPage } from '../server/wasion-industrial-news-events.mjs';

// Retained Industrial coverage is pinned explicitly now that 09/16 is canonical.
const WASION_STYLES = Object.fromEntries(Object.entries(ALL_WASION_STYLES).filter(([style]) => style !== 'requirements'));
const wasionDemoPage = (nonce, options = {}) => renderWasionDemoPage(nonce, { style: 'industrial', ...options });

const nonce = 'industrial-product-fixture';
const hash = value => createHash('sha256').update(value).digest('hex');
const targets = WASION_PAGES.filter(page => page.category === 'Products' && page.pageType === 'detail');
const targetSlugs = new Set(targets.map(page => page.slug));
const main = html => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
const script = html => [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].find(([, attributes]) => !attributes.includes('application/ld+json'))[2];
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const text = markup => markup.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, entity => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }[entity]));
const section = (markup, id) => {
  const found = markup.match(new RegExp('<section\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/section>'));
  assert.ok(found, id + ' section remains available');
  return found[1];
};
const title = page => page.title.replace(/ - (Content Page|Content|Relevant Product|Newsroom|IEC Smart Meters|IEC Prepaid Meters|ANSI Meters|Cellular Communication|Wi-SUN RF Mesh)$/, '');

// Frozen before the product presentation change, at a8fcdb5cecad8b300241e8fbd9e3fc5daa273ebe.
// The record hash prevents content assertions from silently accepting changed input.
// HTML fingerprints were refreshed for the intentional 09/16 default and retained
// Industrial route relocation. They cover complete outputs; client fingerprints include the catalog,
// permissions/session behavior, citations, tabs and all other emitted handlers.
const baselines = {
  classic: {
    html: 'adfb311180bb2c266f35162e60ab3313d6b8f87185fe7f9d14c5b246c1a0d952',
    scripts: '36de6b1c42adcba33742d6d7c8dbd4a993524654ecae671a6dfd7f95095ab32b',
    scriptTags: '31dc3569bfbac695bfbbd91ddde7e7acdde5540fe7f3ded1d915548115429f1c'
  },
  atmospheric: {
    html: 'e5de55bfe96f027def95e4419415370b96713198e656c709f704f92308a8816b',
    scripts: '2efab370509d7cf1cda2ca9649cac02d9fa18a171e55d91f0f51359d3a520b5f',
    scriptTags: 'd10474b733b4fc9e5d1d78e0b8ddf14328bcc61dca20b5c3b166ad27ff90714a'
  },
  planhat: {
    html: '6dbcb09fc035398870d292fd1219cf19f1122e097544f9afae53db3a34fee485',
    scripts: '09fdf69e89e21828f363e17b2c0eca6978c1f83b0576a6360e26b03a79e011f3',
    scriptTags: 'b66faf3825927078e1739864381295cb43bb2d3e269b90f184bd696cfc9dc73c'
  },
  orderful: {
    html: '20293164c95e5564950e6ba59f2897b8c4f22daa0231fec33b30d7de0afe61a7',
    scripts: '3cb5ee07cfe9ca874de40046142a4e8bd42f5602355d3887334d4a9f98a79dca',
    scriptTags: '37bfc1b206618237406befe0d35d62ba5c6358a1e6e4b5359e1481cb438a7e91'
  },
  industrial: {
    nonTargetHtml: '169defab235f6227891613a8c480dca986aabbc3b22db8ca10097239d2591e19',
    scripts: '4c799bf668e6e331d4eca1b4ba0c1832accde71cfa0487637ae3d0d7f70eeafc',
    scriptTags: '871b915c72de781a325f8bc671eacc40e8614f6e39b212785ec3e21152763e51'
  }
};

test('the product presentation uses the same 29 complete official product records', () => {
  assert.equal(targets.length, 29);
  assert.equal(targetSlugs.size, 29);
  assert.equal(hash(JSON.stringify(targets)), '7515c3e5aa92241c91ab0990b9619a325bdc17ce177bd783a192f82499604559');
});

for (const page of targets) test('Industrial preserves every official title, image, feature and technical row: ' + page.slug, () => {
  const markup = main(wasionDemoPage(nonce, { style: 'industrial', slug: page.slug }));
  const headings = [...markup.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(([, heading]) => text(heading));
  assert.deepEqual(headings, [title(page)], 'one unchanged product heading');
  for (const url of page.images) {
    const source = escape(encodeURI(url));
    const image = [...markup.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag).find(tag => tag.includes('src="' + source + '"'));
    assert.ok(image, 'original product image ' + url);
    assert.ok(image.includes('alt="' + escape(title(page)) + '"'), 'image retains the model name');
  }

  const overview = section(markup, 'overview');
  const tableText = new Set((page.tables || []).flat(2));
  const paragraphs = [...new Set(page.paragraphs || [])].filter(paragraph => !tableText.has(paragraph) && !(page.features || []).includes(paragraph));
  for (const paragraph of paragraphs) assert.ok(overview.includes(escape(paragraph)), 'complete overview paragraph: ' + paragraph);
  const features = [...section(markup, 'features').matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(([, feature]) => text(feature));
  assert.deepEqual(features, page.features, 'feature order, wording and count remain intact');

  const specifications = section(markup, 'specifications');
  const tables = [...specifications.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)].map(([, table]) => {
    assert.ok(table.includes('<caption>' + escape(title(page)) + ' — official technical information</caption>'));
    return [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(([, row]) => [...row.matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/g)].map(([, cell]) => text(cell)));
  });
  assert.deepEqual(tables, page.tables, 'every cell, repeated value, row and table retains its order');
  assert.match(specifications, /class="wd-tables" tabindex="0" role="region" aria-label="Scrollable official technical information"/);
  assert.match(specifications, /Swipe the table to see all columns, or focus it and use the arrow keys/);

  const documents = section(markup, 'documents');
  assert.ok(documents.includes('href="' + escape(encodeURI(page.url)) + '"'));
  assert.match(documents, /target="_blank" rel="noopener noreferrer"/);
  for (const document of page.downloads) assert.ok(documents.includes('href="' + escape(encodeURI(document.url)) + '"'));
  if (!page.downloads.length) assert.ok(documents.includes(escape(page.downloadNotice || 'No downloadable document was provided on this source page. Contact Wasion for current documentation.')), 'missing downloads retain an honest notice');
  assert.ok(markup.includes('href="/demo/wasion/styles/industrial/contact"'));
  assert.ok(markup.includes('href="/demo/wasion/styles/industrial/search?q=' + encodeURIComponent('Tell me about ' + title(page)) + '"'), 'AI remains contextual auxiliary navigation');
  assert.doesNotMatch(markup, /<form\b[^>]*role="search"/);
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(ids.length, new Set(ids).size, 'no duplicate control or section IDs');
  for (const [, fragment] of markup.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(fragment), 'resolving section link: ' + fragment);
});

test('all 29 product clients remain byte-identical in every style', () => {
  assert.deepEqual(Object.keys(WASION_STYLES), Object.keys(baselines));
  for (const style of Object.keys(WASION_STYLES)) {
    const tags = [];
    const rows = WASION_DEMO_ROUTES.filter(slug => targetSlugs.has(slug)).map(slug => {
      const html = wasionDemoPage(nonce, { style, slug });
      const client = script(html);
      assert.doesNotThrow(() => new Script(client), style + ' ' + slug);
      tags.push([slug, hash(JSON.stringify(html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g)))]);
      return [slug, hash(client)];
    });
    assert.equal(rows.length, 29);
    assert.equal(hash(JSON.stringify(rows)), baselines[style].scripts, style + ' product clients');
    assert.equal(hash(JSON.stringify(tags)), baselines[style].scriptTags, style + ' complete script tags, including structured data and nonce attributes');
  }
});

test('the other four styles retain their complete HTML on all 90 routes', () => {
  for (const style of Object.keys(WASION_STYLES).filter(style => style !== 'industrial')) {
    const rows = WASION_DEMO_ROUTES.map(slug => [slug, hash(wasionDemoPage(nonce, { style, slug }))]);
    assert.equal(rows.length, 90);
    assert.equal(hash(JSON.stringify(rows)), baselines[style].html, style + ' complete output');
  }
});

test('all 11 remaining Industrial routes remain byte-identical, including search', () => {
  // Other presentation modules have independent content and isolation tests.
  // This subset comes from clean 60f2db5 HTML, remapping only the fixture nonce.
  const stories = new Set(WASION_DEMO_ROUTES.filter(slug => isIndustrialStoryPage(WASION_PAGES.find(page => page.slug === slug) || { slug })));
  const news = new Set(WASION_DEMO_ROUTES.filter(slug => isIndustrialNewsPage(WASION_PAGES.find(page => page.slug === slug) || { slug })));
  const rows = WASION_DEMO_ROUTES.filter(slug => !targetSlugs.has(slug) && !INDUSTRIAL_CATALOG_ROUTES.includes(slug) && !stories.has(slug) && !INDUSTRIAL_COMPANY_RESOURCE_ROUTES.includes(slug) && !news.has(slug)).map(slug => [slug, hash(wasionDemoPage(nonce, { style: 'industrial', slug }))]);
  assert.equal(INDUSTRIAL_CATALOG_ROUTES.length, 11);
  assert.equal(stories.size, 25);
  assert.equal(INDUSTRIAL_COMPANY_RESOURCE_ROUTES.length, 8);
  assert.equal(news.size, 6);
  assert.equal(rows.length, 11);
  assert.equal(hash(JSON.stringify(rows)), baselines.industrial.nonTargetHtml);
  for (const [query, expected] of [
    ['I110', '97a66b53a7b265bee3f1a2d6ffb46c1d1aebbb00f5e7b15833a9cbfa2ce94ade'],
    ['aMeter300 </script><script>alert(1)</script> & IDIS', '389ce2c043b26b1323e7cd8f799c4f92fe2d83d22e509f2585be661b2137ab80']
  ]) assert.equal(hash(wasionDemoPage(nonce, { style: 'industrial', slug: 'search', query })), expected, 'unchanged query output: ' + query);
});

test('the new product presentation and stylesheet are emitted only for Industrial product details', () => {
  for (const style of Object.keys(WASION_STYLES)) for (const slug of WASION_DEMO_ROUTES) {
    const html = wasionDemoPage(nonce, { style, slug });
    const expected = style === 'industrial' && targetSlugs.has(slug);
    assert.equal(html.includes(INDUSTRIAL_PRODUCT_CSS), expected, style + ' ' + slug + ' stylesheet scope');
    assert.equal(main(html).includes('class="wip-product"'), expected, style + ' ' + slug + ' layout scope');
    if (expected) {
      assert.ok(html.indexOf('id="wd-protected"') < html.indexOf('class="wip-product"'), 'presentation stays inside protected content');
      assert.equal((html.match(/<style\b/g) || []).length, 1);
      assert.match(html, /<style nonce="industrial-product-fixture">/);
    }
  }
});

test('the product stage, technical navigation and sources have accessible names and auxiliary AI discovery', () => {
  for (const page of targets) {
    const markup = main(wasionDemoPage(nonce, { style: 'industrial', slug: page.slug }));
    assert.match(markup, /<nav\b[^>]*class="[^"]*wd-breadcrumb[^"]*"[^>]*aria-label="Breadcrumb"/);
    assert.match(markup, /<section class="wip-hero wd-container" aria-labelledby="wip-title">/);
    assert.match(markup, /<h1 id="wip-title">/);
    const stage = markup.match(/<figure class="wip-stage">([\s\S]*?)<\/figure>/)[1];
    assert.match(stage, /<figcaption>/);
    assert.ok(stage.includes(escape(title(page))));
    assert.match(stage, /Official product image/);
    const actions = markup.match(/<div class="wip-actions">([\s\S]*?)<\/div>/)[1];
    assert.match(actions, /^<a class="wd-button" href="#specifications">/);
    assert.ok(actions.includes('href="/demo/wasion/styles/industrial/contact"'));
    assert.doesNotMatch(actions, /\/search(?:\?|"|#)|<form\b/);
    assert.match(markup, /<nav class="wip-section-nav wd-container" aria-label="Page sections">/);
    assert.match(section(markup, 'specifications'), /id="wip-table-help"/);
    assert.match(section(markup, 'specifications'), /role="region" aria-label="Scrollable official technical information" aria-describedby="wip-table-help"/);
    assert.match(markup, /<section class="wip-related" aria-labelledby="wip-related-title">/);
    assert.match(markup, /<h2 id="wip-related-title">/);
    assert.doesNotMatch(markup, /<script\b|<style\b|\b(?:onclick|onerror|onload)=/);
    const family = new URL(page.url).pathname.split('/')[1];
    const others = targets.filter(candidate => candidate.slug !== page.slug);
    const siblings = others.filter(candidate => new URL(candidate.url).pathname.split('/')[1] === family);
    for (const related of (siblings.length ? siblings : others).slice(0, 3)) assert.ok(markup.includes('href="/demo/wasion/styles/industrial/' + related.slug + '"'), 'related product uses the shared catalog');
  }
});

test('the isolated product CSS supplies visible keyboard focus without external assets or new motion', () => {
  assert.doesNotMatch(INDUSTRIAL_PRODUCT_CSS, /@import|url\s*\(|:root|\b(?:animation|transition)\s*:/i);
  assert.match(INDUSTRIAL_PRODUCT_CSS, /\.wip-product :is\(a,button\):focus-visible,\.wip-product \.wd-tables:focus-visible\{outline:/);
  // Split selector lists only at outer commas, preserving :is() and :has().
  for (const [, rule] of INDUSTRIAL_PRODUCT_CSS.matchAll(/([^{}]+)\{/g)) {
    if (/^@(?:media|container)\b/.test(rule.trim())) continue;
    const selectors = [];
    let depth = 0, start = 0;
    for (let index = 0; index < rule.length; index++) {
      if ('(['.includes(rule[index])) depth++;
      if (')]'.includes(rule[index])) depth--;
      if (rule[index] === ',' && depth === 0) { selectors.push(rule.slice(start, index)); start = index + 1; }
    }
    selectors.push(rule.slice(start));
    for (const selector of selectors) assert.match(selector.trim(), /^(?:\.wip-[\w-]+|\.wd-style-industrial:has\(\.wip-product\))(?=[\s.:>+~#\[]|$)/, 'scoped selector: ' + selector);
  }
});
