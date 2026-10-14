import test from 'node:test';
import assert from 'node:assert/strict';
import { WASION_PAGES, WASION_DEMO_ROUTES, wasionDemoPage } from '../server/wasion-demo-page.mjs';
import { HOME_OFFERINGS } from '../server/wasion-experience/shell.mjs';

const base = '/demo/wasion';
const body = html => html.match(/<body\b[^>]*>([\s\S]*?)<script nonce=/)[1];
const main = html => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
const escape = value => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

test('the default homepage leads with Wasion and four linked official product families', () => {
  const html = wasionDemoPage('n'), content = main(html);
  const hero = content.slice(0, content.indexOf('<section class="wv-proof'));
  assert.match(html, /<body class="wd-style-orderful wd-is-home">/);
  assert.match(hero, /WASION INTERNATIONAL/);
  assert.match(hero, /<h1>Smart metering\.<br>Connected utilities\.<\/h1>/);
  assert.ok(hero.includes('href="' + base + '/products">Browse all products'));
  assert.ok(hero.includes('href="' + base + '/contact">Discuss your project'));
  assert.doesNotMatch(hero, /<form\b|type="search"|\/search(?:\?|"|#)/, 'product discovery is the hero action');
  const tiles = [...hero.matchAll(/<a\b[^>]*class="wv-mosaic-tile[^>]*>([\s\S]*?)<\/a>/g)];
  assert.equal(tiles.length, HOME_OFFERINGS.length);
  const featured = ['ameter300-three-phase-smart-energy-meter', 'i-110-series-smart-water-meter', 'wir-3000-rf-communication-router'];
  for (const [index, [slug, label, source]] of HOME_OFFERINGS.entries()) {
    const tile = tiles.find(([markup]) => markup.includes('href="' + base + '/' + slug + '"'));
    assert.ok(tile, slug + ' has a direct family destination');
    assert.ok(tile[0].includes('aria-label="Explore ' + escape(label) + '"'));
    const image = tile[1].match(/<img\b[^>]*src="([^"]+)"[^>]*>/);
    assert.ok(image, slug + ' has product imagery');
    const sourcePage = WASION_PAGES.find(page => page.slug === (featured[index] || source));
    assert.ok(sourcePage.images.some(url => new URL(url).href === image[1]), slug + ' reuses the shared official image');
    assert.equal(new URL(image[1]).origin, 'https://en.wasion.com');
    assert.ok(image[0].includes('alt="' + escape(featured[index] ? sourcePage.title : label) + '"'));
  }
});

test('default homepage search stays accessible after brand and project content without a search form', () => {
  const markup = body(wasionDemoPage('n')), content = main(wasionDemoPage('n'));
  assert.match(markup, /class="wd-search-trigger" href="\/demo\/wasion\/search" aria-label="Open AI search"/);
  assert.doesNotMatch(markup, /<form\b[^>]*role="search"|wv-quick-search/);
  const assistance = content.slice(content.indexOf('<aside class="wv-assistance'));
  assert.ok(content.indexOf('<aside class="wv-assistance') > content.indexOf('<section class="wv-stories'), 'the assistant follows the project content');
  assert.match(assistance, /aria-labelledby="wv-assistance-title"/);
  assert.match(assistance, /<h2 id="wv-assistance-title">Looking for a specific answer\?<\/h2>/);
  assert.match(assistance, /href="\/demo\/wasion\/search">Open AI search/);
});

test('canonical content pages omit automatic search strips while retaining navigation and product questions', () => {
  for (const slug of WASION_DEMO_ROUTES.filter(slug => !['home', 'search', 'styles'].includes(slug))) {
    const markup = body(wasionDemoPage('n', { slug }));
    assert.doesNotMatch(markup, /class="wd-mini-search|<form\b[^>]*action="\/demo\/wasion\/search"/, slug);
    assert.match(markup, /class="wd-search-trigger" href="\/demo\/wasion\/search" aria-label="Open AI search"/, slug);
  }
  const product = WASION_PAGES.find(page => page.slug === 'i-110-series-smart-water-meter');
  const content = main(wasionDemoPage('n', { slug: product.slug }));
  assert.ok(content.includes('href="' + base + '/contact">Discuss this product'));
  assert.ok(content.includes('href="' + base + '/search?q=' + encodeURIComponent('Tell me about ' + product.title) + '">Ask Wasion AI'));
  assert.match(content, /role="region" aria-label="Scrollable official technical information"/);
  assert.ok(content.includes('href="' + product.url + '"'), 'official technical source remains reachable');
});

test('the dedicated default search retains native POST, published model results and the shared AI service', () => {
  const content = main(wasionDemoPage('n', { slug: 'search', query: 'I110' }));
  assert.match(content, /id="ws-form"[^>]*action="\/demo\/wasion\/search" method="post"/);
  assert.match(content, /name="q" value="I110"/);
  assert.match(content, /data-base="\/demo\/wasion"/);
  assert.match(content, /href="\/demo\/wasion\/i-110-series-smart-water-meter"/);
  assert.match(content, /href="\/demo\/wasion\/ai-search-terms"/);
  assert.match(content, /href="\/demo\/wasion\/privacy"/);
  assert.match(wasionDemoPage('n', { slug: 'search' }), /\/api\/crm-wasion-demo-search/);
});
