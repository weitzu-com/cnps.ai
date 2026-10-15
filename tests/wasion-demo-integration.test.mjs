import { WASION_STYLES, wasionStyleBase } from '../server/wasion-demo-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { WASION_DEMO_ROUTES, WASION_PAGES, wasionDemoPage } from '../server/wasion-demo-page.mjs';
import { EXPERIENCE_ROUTES } from '../server/wasion-experience/content.mjs';
import { WASION_SOURCES } from '../server/wasion-demo-sources.mjs';

const routes = [...new Set(WASION_DEMO_ROUTES)];
const encode = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const main = html => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || '';
const body = html => html.match(/<body\b[^>]*>([\s\S]*?)<script nonce=/)?.[1] || '';

test('every integrated route renders with one headline, unique IDs and resolving local links/fragments', () => {
  assert.ok(routes.length >= 88);
  assert.equal(routes.length, WASION_DEMO_ROUTES.length);
  for (const slug of routes) {
    const rendered = wasionDemoPage('integration-nonce', { slug });
    assert.ok(rendered, slug);
    assert.equal((main(rendered).match(/<h1\b/g) || []).length, 1, slug);
    const markup = body(rendered);
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${slug}: duplicate element ID`);
    for (const [, link] of markup.matchAll(/href="([^"]+)"/g)) {
      if (link.startsWith('/demo/wasion')) {
        const path = link.split(/[?#]/)[0];
        const variant = Object.keys(WASION_STYLES).map(wasionStyleBase).find(base => base !== '/demo/wasion' && (path === base || path.startsWith(base + '/')));
        const root = variant || '/demo/wasion';
        const target = path === root ? 'home' : path.slice(root.length + 1);
        assert.ok(routes.includes(target), `${slug}: unknown/canonical-invalid path ${path}`);
      }
      if (link.startsWith('#')) assert.ok(ids.includes(link.slice(1)), `${slug}: missing fragment ${link}`);
    }
  }
});

test('all original pages retain official source anchors and visible product/solution facts', () => {
  for (const page of WASION_PAGES) {
    const rendered = wasionDemoPage('integration-nonce', { slug: page.slug });
    assert.ok(body(rendered).includes(`href="${encode(encodeURI(page.url))}"`), `${page.slug}: official source anchor`);
    if (page.pageType !== 'detail' || !['Products', 'Solutions'].includes(page.category)) continue;
    for (const feature of page.features || []) assert.ok(main(rendered).includes(encode(feature)), `${page.slug}: missing feature ${feature}`);
    for (const cell of (page.tables || []).flat(2)) assert.ok(main(rendered).includes(encode(cell)), `${page.slug}: missing table cell ${cell}`);
  }
  for (const page of EXPERIENCE_ROUTES) {
    const rendered = body(wasionDemoPage('integration-nonce', { slug: page.slug }));
    for (const source of page.sourceUrls) assert.ok(rendered.includes(`href="${encode(encodeURI(source))}"`), `${page.slug}: official source ${source}`);
  }
});

test('integrated nonce scripts parse and malicious questions cannot escape markup', () => {
  for (const slug of routes) {
    const rendered = wasionDemoPage('integration-nonce', { slug });
    for (const [, attributes, script] of rendered.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      assert.match(attributes, /nonce="integration-nonce"/, slug);
      if (attributes.includes('application/ld+json')) assert.doesNotThrow(() => JSON.parse(script), slug);
      else assert.doesNotThrow(() => new Script(script), slug);
    }
  }
  for (const query of ['</script><script>alert(1)</script>', '"><img src=x onerror=alert(1)>', '\u2028\u2029 & "quotes"']) {
    const rendered = wasionDemoPage('integration-nonce', { slug: 'search', query });
    assert.ok(main(rendered).includes(`value="${encode(query.trim())}"`));
    assert.ok(!main(rendered).includes('<script>alert(1)</script>'));
    assert.ok(!main(rendered).includes('<img src=x onerror=alert(1)>'));
    assert.ok(rendered.includes(`const SEARCH_QUERY=${JSON.stringify(query).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')};`));
  }
});

test('integrated shell preserves PDF navigation, English default and demo boundaries', () => {
  const html = wasionDemoPage('integration-nonce');
  assert.match(html, /<html lang="en">/);
  const primary = body(html).match(/<nav class="wr-main-nav" id="wr-navigation"[\s\S]*?<\/nav>/)?.[0];
  for (const label of ['Our Offering', 'Your Challenges', 'Company', 'Resources', 'Contact']) assert.ok(primary.includes(label), label);
  for (const label of ['Investors', 'Newsroom', 'Careers', 'International Sites', 'English']) assert.ok(body(html).includes(label), label);
  assert.ok(body(html).includes('mailto:marketing@wasion.com'));
  assert.ok(body(html).includes('Private customer preview'));
  assert.match(html, /<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">/);
});

test('client trust catalog includes every server source and each source resolves to a demo route', () => {
  const html = wasionDemoPage('integration-nonce');
  const embedded = JSON.parse(html.match(/const WASION_DATA=([\s\S]*?);const SEARCH_QUERY=/)[1]);
  const byId = new Map(embedded.map(item => [item.id, item]));
  for (const item of WASION_SOURCES) {
    assert.ok(byId.has(item.id), `${item.id}: API result would be discarded by the client trust allowlist`);
    assert.equal(byId.get(item.id).url, item.url, `${item.id}: official source mismatch`);
    assert.ok(routes.includes(item.id), `${item.id}: no detail route`);
  }
});

test('case studies keep seven image cards, source routes and original facet metadata in all five styles', () => {
  const cases = WASION_PAGES.filter(page => page.category === 'Success Stories' && page.pageType === 'detail');
  for (const style of Object.keys(WASION_STYLES).filter(style => style !== 'requirements')) {
    const html = main(wasionDemoPage('integration-nonce', { style, slug: 'case-studies' }));
    const rows = [...html.matchAll(/<article class="we-filter-item"([^>]*)>([\s\S]*?)<\/article>/g)];
    const prefix = style === 'industrial' ? 'wis' : 'we';
    assert.match(html, /class="we-filter-list we-case-grid"/);
    assert.match(html, /class="we-filter-scope" data-page-size="6" aria-label="case studies"/);
    assert.equal(rows.length, 7, style + ' complete case records');
    assert.equal((html.match(new RegExp('class="' + prefix + '-case-card"', 'g')) || []).length, 7, style + ' card treatment');
    assert.equal((html.match(new RegExp('class="' + prefix + '-case-media"', 'g')) || []).length, 7, style + ' image links');
    for (const [index, page] of cases.entries()) {
      const [, attrs, card] = rows[index];
      const region = page.paragraphs.find(value => /^Country or Region\s*:/i.test(value)).replace(/^Country or Region\s*:\s*/i, '');
      const topic = ['agricultural-pv-and-energy-storage-complementary-project', 'the-intelligent-microgrid-energy-station-project'].includes(page.slug) ? 'Energy storage & microgrids' : 'Metering';
      assert.ok(card.includes(`href="${wasionStyleBase(style)}/${page.slug}"`), style + ' ' + page.slug);
      assert.ok(attrs.includes(`data-q="${encode((page.title + ' ' + page.summary).toLowerCase())}"`));
      assert.ok(attrs.includes(`data-region="${encode(region)}"`));
      assert.ok(attrs.includes(`data-topic="${encode(topic)}"`));
    }
    for (const facet of ['q', 'region', 'topic']) assert.ok(html.includes(`data-filter="${facet}"`), style + ' ' + facet);
  }
});

test('solution content retains canonical detail fragment anchors and technical table captions', () => {
  for (const page of WASION_PAGES.filter(p => p.category === 'Solutions' && p.pageType === 'detail')) {
    const html = main(wasionDemoPage('integration-nonce', { slug: page.slug, style: 'industrial' }));
    assert.ok(html.includes('id="overview"'), page.slug);
    assert.ok(html.includes('id="documents"'), page.slug);
    if (page.features?.length) assert.ok(html.includes('id="features"'), page.slug);
    if (page.tables?.length) {
      assert.ok(html.includes('id="specifications"'), page.slug);
      assert.match(html, /<caption>.*official technical information<\/caption>/, page.slug);
    }
  }
});
