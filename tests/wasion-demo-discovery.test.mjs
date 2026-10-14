import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { buildDemoMetadata, LEGAL_ROUTES, renderLegalPage, renderCookiePreferences, renderAIDisclosure, DISCOVERY_CSS, DISCOVERY_CLIENT } from '../server/wasion-experience/discovery.mjs';

const graphFrom = html => JSON.parse(html.match(/<script type="application\/ld\+json" nonce="[^"]*">([\s\S]*?)<\/script>/)[1])['@graph'];
const productPage = {
  slug: 'ameter300', title: 'aMeter300', category: 'Products', pageType: 'detail',
  url: 'https://en.wasion.com/ElectricityMeters/info_itemid_801.html',
  images: ['https://en.wasion.com/public/uploads/images/meter.png'],
  features: ['Remote connect and disconnect'], tables: [[['Communication', 'RS485'], ['Heading'], ['One', 'Two', 'Three']]],
  price: '123', ratings: 5, certifications: ['unverified'], datePublished: '2026-10-14'
};

test('metadata is page-specific, source-linked, private and free of invented product claims', () => {
  const html = buildDemoMetadata({ slug: 'ameter300', title: 'aMeter300', description: 'Three-phase smart meter.', page: productPage, nonce: 'test-nonce' });
  assert.match(html, /<title>aMeter300 \| Wasion International demo<\/title>/);
  assert.match(html, /name="description" content="Three-phase smart meter\."/);
  assert.match(html, /name="robots" content="noindex,nofollow,noarchive,nosnippet"/);
  assert.match(html, /property="og:url" content="https:\/\/crm\.cnps\.ai\/demo\/wasion\/ameter300"/);
  assert.ok(html.includes(`rel="canonical" href="${productPage.url}"`));
  const graph = graphFrom(html);
  const webPage = graph.find(item => item['@type'] === 'WebPage');
  assert.equal(webPage.isBasedOn.url, productPage.url);
  assert.equal(webPage.inLanguage, 'en');
  const product = graph.find(item => item['@type'] === 'Product');
  assert.equal(product.subjectOf.url, productPage.url);
  assert.deepEqual(product.additionalProperty, [
    { '@type': 'PropertyValue', name: 'Communication', value: 'RS485' },
    { '@type': 'PropertyValue', name: 'Published feature', value: 'Remote connect and disconnect' }
  ]);
  for (const field of ['offers', 'aggregateRating', 'review', 'price', 'certifications', 'datePublished']) assert.ok(!(field in product), field);
  const other = buildDemoMetadata({ slug: 'privacy' });
  assert.ok(!other.includes('<title>aMeter300'));
  assert.equal(graphFrom(other).some(item => item['@type'] === 'Product'), false);
});

test('untrusted headings, attributes and source facts cannot break out of metadata or JSON-LD', () => {
  const hostile = '</script><script>alert("x")</script> & <img src=x onerror="x">\u2028\u2029 end';
  const html = buildDemoMetadata({ slug: 'ameter300', title: hostile, description: hostile, nonce: '" onload="x', page: { ...productPage, features: [hostile] } });
  assert.equal((html.match(/<script\b/g) || []).length, 1);
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  assert.ok(html.includes('&lt;/script&gt;'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('nonce="&quot; onload=&quot;x"'));
  assert.equal(graphFrom(html).find(item => item['@type'] === 'Product').additionalProperty.at(-1).value, hostile);
  const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
  assert.ok(!script.includes('</script>'));
});

test('source provenance and product metadata require an approved official HTTPS URL', () => {
  for (const url of [undefined, 'javascript:alert(1)', 'https://example.com/fake', 'http://en.wasion.com/insecure', 'https://en.wasion.com:8086/page', 'https://user:pass@en.wasion.com/page']) {
    const html = buildDemoMetadata({ slug: 'ameter300', page: { ...productPage, url } });
    const graph = graphFrom(html);
    assert.equal(graph.some(item => item['@type'] === 'Product'), false, String(url));
    assert.ok(!('isBasedOn' in graph[0]), String(url));
    assert.match(html, /rel="canonical" href="https:\/\/crm\.cnps\.ai\/demo\/wasion\/ameter300"/);
  }
  const html = buildDemoMetadata({ slug: 'privacy', base: '"><script>alert(1)</script>' });
  assert.ok(!html.includes('<script>alert(1)'));
  assert.match(html, /https:\/\/crm\.cnps\.ai\/demo\/wasion\/privacy/);
});

test('legal routes accurately distinguish the demo, external AI processing and user-controlled enquiry', () => {
  assert.deepEqual(LEGAL_ROUTES.map(item => item.slug), ['privacy', 'cookies', 'ai-search-terms', 'accessibility']);
  for (const item of LEGAL_ROUTES) {
    const html = renderLegalPage(item.slug);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.ok(html.includes(`href="/demo/wasion/${item.slug}" aria-current="page"`));
    assert.ok(!/globally compliant|GDPR certified|CCPA certified|zero.retention|never retained/i.test(html));
  }
  assert.equal(renderLegalPage('not-a-policy'), null);
  const privacy = renderLegalPage('privacy');
  assert.match(privacy, /CNPS operates this private website concept/);
  assert.match(privacy, /Vercel AI Gateway/);
  assert.match(privacy, /CRM phone number and account identity are not included/);
  assert.match(privacy, /does not store or send the enquiry/);
  assert.match(privacy, /mailto:sales@wasion\.com/);
  const cookies = renderLegalPage('cookies');
  assert.match(cookies, /__Host-cnps_crm/);
  assert.match(cookies, /30 days for customers; 8 hours for staff/);
  assert.match(cookies, /8 hours/);
  assert.match(cookies, /5 minutes/);
  assert.match(cookies, /SameSite=Lax/);
  assert.match(cookies, /SameSite=Strict/);
  assert.match(privacy, /Customer sessions last up to 30 days and staff sessions up to 8 hours/);
  assert.match(renderLegalPage('accessibility'), /not a claim of a completed accessibility certification/);
});

test('privacy choices disclose the essential-only state without fake optional consent or persistence', () => {
  const html = renderCookiePreferences('/preview/wasion');
  assert.match(html, /<dialog[^>]+aria-labelledby="wd-privacy-title"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /Essential cookies only/);
  assert.match(html, /Customer login<\/dt><dd>Up to 30 days/);
  assert.match(html, /Staff login<\/dt><dd>Up to 8 hours/);
  assert.match(html, /href="\/preview\/wasion\/cookies"/);
  assert.ok(!renderCookiePreferences('/demo/wasion', { showTrigger: false }).includes('data-wd-open-privacy'));
  assert.ok(!/type="checkbox"|Accept all|Reject all/i.test(html));
  assert.match(DISCOVERY_CLIENT, /navigator\.globalPrivacyControl===true/);
  assert.match(DISCOVERY_CLIENT, /showModal/);
  assert.match(DISCOVERY_CLIENT, /wdPrivacyInvoker\?\.focus/);
  assert.ok(!/localStorage|sessionStorage|document\.cookie|fetch\(/.test(DISCOVERY_CLIENT));
  assert.doesNotThrow(() => new Script(DISCOVERY_CLIENT));
  assert.match(DISCOVERY_CSS, /focus-visible/);
  assert.match(renderAIDisclosure(), /external AI service/);
  assert.match(renderAIDisclosure(), /href="\/demo\/wasion\/ai-search-terms"/);
});
