import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';
import { wasionDemoPage, WASION_PAGES, WASION_DEMO_ROUTES } from '../server/wasion-demo-page.mjs';
import { WASION_STYLES } from '../server/wasion-demo-styles.mjs';
import { INDUSTRIAL_PRODUCT_CSS } from '../server/wasion-industrial-product.mjs';
import { INDUSTRIAL_CATALOG_ROUTES } from '../server/wasion-industrial-catalog.mjs';

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
// HTML fingerprints cover complete outputs; client fingerprints include the catalog,
// permissions/session behavior, citations, tabs and all other emitted handlers.
const baselines = {
  classic: {
    html: 'd794d9bc17a26ed05bd9d90bebeebdd8a50f499dd563e2d3e907759f84e8df92',
    scripts: '36de6b1c42adcba33742d6d7c8dbd4a993524654ecae671a6dfd7f95095ab32b',
    scriptTags: '31dc3569bfbac695bfbbd91ddde7e7acdde5540fe7f3ded1d915548115429f1c'
  },
  atmospheric: {
    html: 'ad3f0e6d357822f1009c6da162e849c79019e1a3029c0f24acb2dc9f31fa1422',
    scripts: '2efab370509d7cf1cda2ca9649cac02d9fa18a171e55d91f0f51359d3a520b5f',
    scriptTags: 'd10474b733b4fc9e5d1d78e0b8ddf14328bcc61dca20b5c3b166ad27ff90714a'
  },
  planhat: {
    html: '7dab597e8879c264a8d9a1ab13e0f3b295ad65589cf783cf620e9fa338a2c02f',
    scripts: '09fdf69e89e21828f363e17b2c0eca6978c1f83b0576a6360e26b03a79e011f3',
    scriptTags: 'b66faf3825927078e1739864381295cb43bb2d3e269b90f184bd696cfc9dc73c'
  },
  orderful: {
    html: '7c7c0e63515628b6b618f2d44a2eb3ed2dfdff50f852afa72df455f05abaa25a',
    scripts: '3cb5ee07cfe9ca874de40046142a4e8bd42f5602355d3887334d4a9f98a79dca',
    scriptTags: '37bfc1b206618237406befe0d35d62ba5c6358a1e6e4b5359e1481cb438a7e91'
  },
  industrial: {
    nonTargetHtml: '8dadf1ab7cc6d747f0468f8d411844260bbda9cad8eb129d432902199d72154a',
    scripts: 'f33e0f1d036b145133bed3fac8ea5b81880aac82c867a6b430f0020d4bcdb7df',
    scriptTags: '9131c21e9886729e4a7b1569c9713686a40eb41ea4f16be6a3954223772168e7'
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
  assert.ok(markup.includes('href="/demo/wasion/contact"'));
  assert.ok(markup.includes('href="/demo/wasion/search?q=' + encodeURIComponent('Tell me about ' + title(page)) + '"'), 'AI remains contextual auxiliary navigation');
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

test('all 50 non-product-detail, non-catalog Industrial routes remain byte-identical, including search', () => {
  // The 11 catalog pages now have their own presentation tests. This subset was
  // calculated from the saved d9e856f baseline HTML, with only the nonce remapped.
  const rows = WASION_DEMO_ROUTES.filter(slug => !targetSlugs.has(slug) && !INDUSTRIAL_CATALOG_ROUTES.includes(slug)).map(slug => [slug, hash(wasionDemoPage(nonce, { style: 'industrial', slug }))]);
  assert.equal(INDUSTRIAL_CATALOG_ROUTES.length, 11);
  assert.equal(rows.length, 50);
  assert.equal(hash(JSON.stringify(rows)), baselines.industrial.nonTargetHtml);
  for (const [query, expected] of [
    ['I110', '2312478482985f2495a83adbaac04b3e479e6b8cc105839dd642821518c651ab'],
    ['aMeter300 </script><script>alert(1)</script> & IDIS', '3a3ef45a28b4b540bee4efa45e50acc3c35b2a383cd0a73a372a01d193879efd']
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
    assert.ok(actions.includes('href="/demo/wasion/contact"'));
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
    for (const related of (siblings.length ? siblings : others).slice(0, 3)) assert.ok(markup.includes('href="/demo/wasion/' + related.slug + '"'), 'related product uses the shared catalog');
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
