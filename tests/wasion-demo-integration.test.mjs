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
    assert.ok(rendered.includes(`const SEARCH_QUERY=${JSON.stringify(query).replace(/</g, '\\u003c')};`));
  }
});

test('integrated shell preserves PDF navigation, English default and demo boundaries', () => {
  const html = wasionDemoPage('integration-nonce');
  assert.match(html, /<html lang="en">/);
  const primary = body(html).match(/<nav id="wd-navigation"[\s\S]*?<\/nav>/)?.[0];
  for (const label of ['Our Offering', 'Your Challenges', 'Company', 'Resources', 'Contact']) assert.ok(primary.includes(label), label);
  for (const label of ['Investors', 'Newsroom', 'Careers', 'International sites', 'English']) assert.ok(body(html).includes(label), label);
  assert.ok(body(html).includes('mailto:sales@wasion.com'));
  assert.ok(body(html).includes('Private customer demo'));
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

test('case studies use the PDF image-card grid with every source case route and working facet metadata', () => {
  const html = main(wasionDemoPage('integration-nonce', { slug: 'case-studies' }));
  assert.match(html, /class="we-filter-list we-case-grid"/);
  for (const page of WASION_PAGES.filter(p => p.category === 'Success Stories' && p.pageType === 'detail')) {
    assert.ok(html.includes(`href="/demo/wasion/${page.slug}"`), page.slug);
  }
  assert.equal((html.match(/class="we-case-media"/g) || []).length, 7);
  assert.ok(html.includes('data-filter="region"'));
  assert.ok(html.includes('data-filter="topic"'));
});

test('solution content retains canonical detail fragment anchors and technical table captions', () => {
  for (const page of WASION_PAGES.filter(p => p.category === 'Solutions' && p.pageType === 'detail')) {
    const html = main(wasionDemoPage('integration-nonce', { slug: page.slug }));
    assert.ok(html.includes('id="overview"'), page.slug);
    assert.ok(html.includes('id="documents"'), page.slug);
    if (page.features?.length) assert.ok(html.includes('id="features"'), page.slug);
    if (page.tables?.length) {
      assert.ok(html.includes('id="specifications"'), page.slug);
      assert.match(html, /<caption>.*official technical information<\/caption>/, page.slug);
    }
  }
});
