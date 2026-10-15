import test from 'node:test';
import assert from 'node:assert/strict';
import { WASION_PAGES, WASION_DEMO_ROUTES, wasionDemoPage } from '../server/wasion-demo-page.mjs';
import { HOME_OFFERINGS } from '../server/wasion-experience/shell.mjs';

const base = '/demo/wasion/styles/orderful';
const orderfulPage = (nonce, options = {}) => wasionDemoPage(nonce, { ...options, style: 'orderful' });
const body = html => html.match(/<body\b[^>]*>([\s\S]*?)<script nonce=/)[1];
const main = html => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
const escape = value => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

test('canonical Industrial homepage leads with the Wasion brand and its own engineering film', () => {
  const html = wasionDemoPage('n'), content = main(html);
  const hero = content.match(/<section class="wi-hero"[\s\S]*?<\/section>/)[0];
  assert.match(html, /<body class="wd-style-industrial wd-is-home">/);
  assert.match(hero, /WASION INTERNATIONAL/);
  assert.match(hero, /<h1 id="wi-hero-title">Intelligence for<br>the energy ahead\.<\/h1>/);
  assert.match(hero, /href="\/demo\/wasion\/our-offering">Explore our portfolio/);
  assert.match(hero, /href="\/demo\/wasion\/about">Discover Wasion/);
  const about = WASION_PAGES.find(page => page.slug === 'about');
  const poster = hero.match(/<img\b[^>]*class="wi-hero-poster"[^>]*src="([^"]+)"[^>]*>/);
  assert.ok(poster, 'official engineering poster is present before video loads');
  assert.ok(about.images.includes(poster[1]));
  const film = hero.match(/<video\b[^>]*>/)[0];
  assert.match(film, /id="wi-film"/);
  assert.match(film, /preload="none"/);
  assert.match(film, /data-source="https:\/\/en\.wasion\.com\/public\/uploads\/files\/20230718\/about\.mp4"/);
  assert.doesNotMatch(film, /\ssrc=|\sautoplay(?:\s|=|>)/, 'film loading stays controlled by motion and viewport preferences');
  assert.doesNotMatch(hero, /<form\b|type="search"|\/search(?:\?|"|#)/);
  assert.doesNotMatch(body(html), /<form\b[^>]*role="search"|wv-quick-search|wd-mini-search/);
});

test('canonical Industrial product stages reuse all three official products and keep AI assistance after project stories', () => {
  const html = wasionDemoPage('n'), content = main(html);
  const featured = ['ameter300-three-phase-smart-energy-meter', 'i-110-series-smart-water-meter', 'wir-3000-rf-communication-router'];
  assert.equal((content.match(/role="tab" /g) || []).length, featured.length);
  assert.equal((content.match(/role="tabpanel"/g) || []).length, featured.length);
  for (const slug of featured) {
    const page = WASION_PAGES.find(item => item.slug === slug);
    const panel = content.match(new RegExp('<div class="wi-product-panel" id="wi-panel-' + slug + '"[\\s\\S]*?(?=<div class="wi-product-panel"|</section>)'))[0];
    const image = panel.match(/<img\b[^>]*src="([^"]+)"/)[1];
    assert.ok(page.images.some(url => new URL(url).href === image), slug + ' retains its official product image');
    assert.ok(panel.includes('href="/demo/wasion/' + slug + '"'));
    assert.ok(panel.includes('href="/demo/wasion/contact"'));
  }
  for (const [slug] of HOME_OFFERINGS) assert.ok(content.includes('href="/demo/wasion/' + slug + '"'), slug);
  assert.ok(content.indexOf('<aside class="wi-search-help') > content.indexOf('<section class="wi-projects"'), 'auxiliary search follows product and project content');
  assert.match(content, /<aside class="wi-search-help[^>]*aria-label="Product information assistance"/);
  assert.match(content, /href="\/demo\/wasion\/search">Search Wasion with AI/);
  assert.match(body(html), /class="wd-search-trigger" href="\/demo\/wasion\/search" aria-label="Open AI search"/);
});

test('the retained Orderful homepage leads with Wasion and four linked official product families', () => {
  const html = orderfulPage('n'), content = main(html);
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

test('retained Orderful homepage search stays accessible after brand and project content without a search form', () => {
  const markup = body(orderfulPage('n')), content = main(orderfulPage('n'));
  assert.ok(markup.includes('class="wd-search-trigger" href="' + base + '/search" aria-label="Open AI search"'));
  assert.doesNotMatch(markup, /<form\b[^>]*role="search"|wv-quick-search/);
  const assistance = content.slice(content.indexOf('<aside class="wv-assistance'));
  assert.ok(content.indexOf('<aside class="wv-assistance') > content.indexOf('<section class="wv-stories'), 'the assistant follows the project content');
  assert.match(assistance, /aria-labelledby="wv-assistance-title"/);
  assert.match(assistance, /<h2 id="wv-assistance-title">Looking for a specific answer\?<\/h2>/);
  assert.ok(assistance.includes('href="' + base + '/search">Open AI search'));
});

test('retained Orderful content pages omit automatic search strips while retaining navigation and product questions', () => {
  for (const slug of WASION_DEMO_ROUTES.filter(slug => !['home', 'search', 'styles'].includes(slug))) {
    const markup = body(orderfulPage('n', { slug }));
    assert.doesNotMatch(markup, /class="wd-mini-search|<form\b[^>]*action="\/demo\/wasion\/styles\/orderful\/search"/, slug);
    assert.ok(markup.includes('class="wd-search-trigger" href="' + base + '/search" aria-label="Open AI search"'), slug);
  }
  const product = WASION_PAGES.find(page => page.slug === 'i-110-series-smart-water-meter');
  const content = main(orderfulPage('n', { slug: product.slug }));
  assert.ok(content.includes('href="' + base + '/contact">Discuss this product'));
  assert.ok(content.includes('href="' + base + '/search?q=' + encodeURIComponent('Tell me about ' + product.title) + '">Ask Wasion AI'));
  assert.match(content, /role="region" aria-label="Scrollable official technical information"/);
  assert.ok(content.includes('href="' + product.url + '"'), 'official technical source remains reachable');
});

test('the dedicated Orderful search retains native POST, published model results and the shared AI service', () => {
  const content = main(orderfulPage('n', { slug: 'search', query: 'I110' }));
  assert.ok(content.includes('action="' + base + '/search" method="post"'));
  assert.match(content, /name="q" value="I110"/);
  assert.ok(content.includes('data-base="' + base + '"'));
  for (const slug of ['i-110-series-smart-water-meter', 'ai-search-terms', 'privacy']) assert.ok(content.includes('href="' + base + '/' + slug + '"'));
  assert.match(orderfulPage('n', { slug: 'search' }), /\/api\/crm-wasion-demo-search/);
});
