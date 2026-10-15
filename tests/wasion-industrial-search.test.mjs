import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';
import { wasionDemoPage as renderWasionDemoPage, WASION_PAGES, WASION_LEGACY_ROUTES as WASION_DEMO_ROUTES } from '../server/wasion-demo-page.mjs';
import { WASION_STYLES as ALL_WASION_STYLES, wasionStyleBase } from '../server/wasion-demo-styles.mjs';
import { renderSearch, SEARCH_CLIENT } from '../server/wasion-experience/search.mjs';
import { decorateIndustrialSearch, INDUSTRIAL_SEARCH_CSS } from '../server/wasion-industrial-search.mjs';
import { INDUSTRIAL_CATALOG_ROUTES } from '../server/wasion-industrial-catalog.mjs';
import { isIndustrialStoryPage } from '../server/wasion-industrial-stories.mjs';
import { INDUSTRIAL_COMPANY_RESOURCE_ROUTES } from '../server/wasion-industrial-company-resources.mjs';
import { isolationFixture } from './fixtures/wasion-isolation.mjs';

// The retained search presentation has an explicit legacy route after the 09/16 rebuild.
const WASION_STYLES = Object.fromEntries(Object.entries(ALL_WASION_STYLES).filter(([style]) => style !== 'requirements'));
const wasionDemoPage = (nonce, options = {}) => renderWasionDemoPage(nonce, { style: 'industrial', ...options });

const nonce = 'industrial-search-fixture';
const queries = ['', 'I110', 'aMeter300 </script><script>alert(1)</script> & AMI'];
const hash = value => createHash('sha256').update(value).digest('hex');
const main = html => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const script = html => [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].find(([, attributes]) => !attributes.includes('application/ld+json'))[2];

// Captured at be633ec before this presentation change. Script fingerprints
// were refreshed for the intentional default and retained Industrial URL change. They
// cover the complete emitted client, including the search trust catalog and
// citation/tab/session handlers; non-Industrial HTML must remain byte-identical.
const baselines = {
  classic: [
    ['e73bc6798c6a117c5cb51da4d8ef70dc8bc2444991d8f480b070c70c13ed0ff7', 'a56020957785fefb0b10a8c80ec4725a1de1c1768cd3d311a1fd28fd517f8510'],
    ['fc3fb8bdcbd35cb3663e58715e6caa357921e742997e814c4a1b06093d96ee92', 'bd897e328b4a16202f62fd5bce8e5bd52682ffe9c74fdef2d377befdd4c23b75'],
    ['62ecfa9dd6893446cb635cf999a926b41215c01927a308f8b50c2c1492abd3f1', '2db0cc092e7eae43c1391f4a518e9cc4f05d04263be1bc3c3420bbb7f1a42fbc']
  ],
  atmospheric: [
    ['c82b13b6c17686a18cf08ec0e34be15d85fe73eda58f2fcbd647e932311a8e77', '906f2dae622745f6cf222648cfda852426fe7449e5dff93f1b31d414723ae5cf'],
    ['b220fb7748004692864f39daff020a86fb719eff7997955084a9cf283d9a50cb', '99f7f1f9ad65ad25dc6908e71031d9d8e16b93b1b07c9c79de1f80fb6634b51e'],
    ['85cdd6a632b36ce7b98d69faccee8f4df67bcc01111f8e0d7d150e405fcb82fe', 'b7e19c1e80c2a32ba9bcb5c6c769eba701a8be1807f5316f6c4a76fab3904856']
  ],
  planhat: [
    ['d0318d4ff113b3a443faa7035a43072ff19980bb8d4dec27628a7fe3f9770c28', 'a8a16587f57096aac88bd77389cb52a021e7ec35fa757851cf85cd91bf59a525'],
    ['9dd33ecd6a4acfe0bfaa6b1b17980ec6e762d293bee0ceca630dc5044d58daed', '8c041a2b1b21f679f5e9fc794f47e02675ee14611c51f6a0b340fa0a03a5577d'],
    ['53a50044d5fd1f4edb0c828f50cc3caefd08ecf3317e839558ab91af25c48344', '8dd8ac2378580ffd9ca750d3a69b5ac9f74827b827794af0951eca85df4b37b9']
  ],
  orderful: [
    ['5a49feb21e508cb35d46a24355f755718b480521abc6378b1246528326c718b6', 'aee0421f75acb0b3ecdfac22adee91d9dd14751ed2ecda0353199e34221a927a'],
    ['66c881f195be1a358e5eff1b186f618937d944a02530125802b205091a9e74fd', '04f283d79d9a619b83ae8425defa855bd63eef3a609dc01e477aeb89e1ea8946'],
    ['90b220b65b2e3e81fedb111cc958441f95f9da1fd2c8475e072385fbe3a8a152', '9cecc141b23209329383954b12f881f280b7b169828df65b5b68461f0760c93f']
  ],
  industrial: [
    ['5b859f10bd90bde486b41eff592a5e401d0e7542f17d1693773468129644b7de'],
    ['cc15aaf8a7f1a51e2615d23032577a2fb0769e0a94e083839e6e54fbcdc290cb'],
    ['6767fd1ad0b75e2b1b8d4cf6b4ed1973bf5d4ac96d39ca64addb84804c2a8677']
  ]
};

test('Industrial search is presentation-only: original search client and every styled page script retain their bytes', () => {
  assert.equal(Buffer.byteLength(SEARCH_CLIENT), 14333);
  assert.equal(hash(SEARCH_CLIENT), '7e8bd3bf61007b83ea5194a94032eb3fbbfa6ef36eaae443a136dd8967a5ee41');
  for (const style of Object.keys(WASION_STYLES)) for (const [index, query] of queries.entries()) {
    const html = wasionDemoPage(nonce, { style, slug: 'search', query });
    assert.equal(hash(script(html)), baselines[style][index][0], style + ' ' + index);
    assert.doesNotThrow(() => new Script(script(html)));
    if (style !== 'industrial') {
      assert.equal(hash(html), baselines[style][index][1], style + ' output is untouched');
      assert.ok(!html.includes(INDUSTRIAL_SEARCH_CSS));
      assert.doesNotMatch(main(html), /wis-hero-grid|wis-product-stage/);
    } else assert.ok(html.includes(INDUSTRIAL_SEARCH_CSS));
  }
});

test('the search treatment leaves all 16 remaining non-search Industrial routes byte-identical', () => {
  // Product details have a separate presentation treatment and all 29 are now
  // protected by wasion-industrial-product.test.mjs. Catalog pages also have
  // their own treatment; the remaining routes keep their original HTML.
  const productSlugs = new Set(WASION_PAGES.filter(page => page.category === 'Products' && page.pageType === 'detail').map(page => page.slug));
  const stories = new Set(WASION_DEMO_ROUTES.filter(slug => isIndustrialStoryPage(WASION_PAGES.find(page => page.slug === slug) || { slug })));
  const rows = WASION_DEMO_ROUTES.filter(slug => slug !== 'search' && !productSlugs.has(slug) && !INDUSTRIAL_CATALOG_ROUTES.includes(slug) && !stories.has(slug) && !INDUSTRIAL_COMPANY_RESOURCE_ROUTES.includes(slug)).map(slug => {
    const html = wasionDemoPage(nonce, { style: 'industrial', slug });
    assert.ok(!html.includes(INDUSTRIAL_SEARCH_CSS), slug);
    return [slug, hash(html)];
  });
  assert.equal(productSlugs.size, 29);
  // Catalog, story and company/resource pages have separate coverage. The
  // reduced fingerprint comes from frozen 1fd2731 HTML with its 09/16 routing.
  assert.equal(INDUSTRIAL_CATALOG_ROUTES.length, 11);
  assert.equal(stories.size, 25);
  assert.equal(INDUSTRIAL_COMPANY_RESOURCE_ROUTES.length, 8);
  assert.equal(rows.length, 16);
  assert.equal(hash(JSON.stringify(rows)), '59e64af0c187e7a575f173484e84dfee1ad6703dc4d8bb1f6ba49d085f3919ea');
});

test('Industrial search leads with its heading and one official shared product without changing query safety or result links', () => {
  const product = WASION_PAGES.find(page => page.slug === 'ameter300-three-phase-smart-energy-meter');
  for (const query of queries) {
    const html = wasionDemoPage(nonce, { slug: 'search', query }), markup = main(html);
    assert.match(html, /<body class="wd-style-industrial /);
    assert.match(markup, /class="ws-container wis-hero-grid"/);
    assert.equal((markup.match(/<h1\b/g) || []).length, 1);
    assert.ok(markup.indexOf('class="ws-breadcrumb"') < markup.indexOf('class="ws-banner"'));
    assert.ok(markup.indexOf('id="ws-query-title"') < markup.indexOf('id="ws-form"'));
    assert.match(markup, /class="ws-banner" aria-labelledby="ws-query-title"/);
    assert.ok(markup.includes('value="' + escape(query) + '"'));
    const stage = markup.match(/<a class="wis-product-stage"[\s\S]*?<\/a>/)[0];
    assert.ok(stage.includes('href="/demo/wasion/styles/industrial/' + product.slug + '"'));
    assert.ok(stage.includes('<strong>' + escape(product.title) + '</strong>'));
    const photo = stage.match(/<img\b[^>]*src="([^"]+)"/)[1];
    assert.ok(product.images.some(url => new URL(url).href === photo));
    assert.equal(new URL(photo).origin, 'https://en.wasion.com');
    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.equal((html.match(/<script\b/g) || []).length, 2);
  }
  const results = main(wasionDemoPage(nonce, { slug: 'search', query: 'I110' }));
  const i110 = WASION_PAGES.find(page => page.slug === 'i-110-series-smart-water-meter');
  assert.match(results, /1 matching official pages/);
  assert.ok(results.includes('href="/demo/wasion/styles/industrial/' + i110.slug + '"'));
  assert.ok(results.includes('href="' + i110.url + '"'));
});

test('the visual decorator preserves native POST, search controls, category semantics and honest hidden states', () => {
  for (const query of ['', 'I110', 'Unknown I999999 meter']) {
    const markup = main(wasionDemoPage(nonce, { slug: 'search', query }));
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size);
    for (const id of ['ws-search', 'ws-form', 'ws-search-label', 'ws-query', 'ws-search-privacy', 'ws-query-title', 'ws-result-count', 'ws-examples', 'ws-tab-all', 'ws-tab-Products', 'ws-tab-Solutions', 'ws-tab-Resources', 'ws-ai', 'ws-ai-title', 'ws-ai-state', 'ws-answer', 'ws-answer-more', 'ws-sources', 'ws-announcement', 'ws-results', 'ws-products-section', 'ws-products', 'ws-products-more', 'ws-pages-section', 'ws-pages-title', 'ws-pages', 'ws-pages-more', 'ws-empty']) assert.ok(ids.includes(id), id);
    assert.match(markup, /id="ws-search" data-base="\/demo\/wasion\/styles\/industrial"/);
    assert.match(markup, /<form\b[^>]*id="ws-form"[^>]*action="\/demo\/wasion\/styles\/industrial\/search" method="post" role="search"/);
    assert.match(markup, /<label id="ws-search-label" for="ws-query">/);
    assert.match(markup, /<input\b[^>]*id="ws-query"[^>]*type="search"[^>]*name="q"[^>]*maxlength="500" required autocomplete="off"[^>]*aria-describedby="ws-search-privacy"/);
    const tabs = [...markup.matchAll(/<button\b[^>]*role="tab"[^>]*>/g)].map(([tag]) => tag);
    assert.equal(tabs.length, 4);
    assert.equal(tabs.filter(tag => tag.includes('aria-selected="true"') && tag.includes('tabindex="0"')).length, 1);
    for (const tab of tabs) assert.ok(tab.includes('aria-controls="ws-results"'));
    assert.match(markup, /id="ws-results" role="tabpanel" aria-labelledby="ws-tab-all" tabindex="0"/);
    assert.match(markup, /id="ws-answer-more"[^>]*aria-expanded="false" aria-controls="ws-answer" hidden/);
    assert.match(markup, /id="ws-announcement"[^>]*role="status" aria-live="polite"/);
    assert.match(markup, /AI summaries can contain errors/);
    assert.match(markup, /href="\/demo\/wasion\/styles\/industrial\/ai-search-terms"/);
    assert.match(markup, /href="\/demo\/wasion\/styles\/industrial\/privacy"/);
    assert.equal(/id="ws-examples"[^>]* hidden/.test(markup), Boolean(query));
    assert.equal(/id="ws-ai"[^>]* hidden/.test(markup), !query);
    assert.equal(/id="ws-empty"[^>]* hidden/.test(markup), query !== 'Unknown I999999 meter');
  }
});

test('body-mounted citations keep Industrial styling and become hidden with protected content', () => {
  assert.match(INDUSTRIAL_SEARCH_CSS, /\.wd-style-industrial \.ws-cite-panel\{/);
  assert.match(INDUSTRIAL_SEARCH_CSS, /\.wd-style-industrial:has\(#wd-protected\[hidden\]\) \.ws-cite-panel\{display:none!important\}/);
  assert.match(INDUSTRIAL_SEARCH_CSS, /#ws-search:has\(#ws-examples\[hidden\]\) \.wis-product-stage\{display:none\}/);
  assert.match(INDUSTRIAL_SEARCH_CSS, /#ws-search:has\(#ws-examples:not\(\[hidden\]\)\) \.ws-tabs\{display:none\}/);
  assert.match(SEARCH_CLIENT, /document\.body\.append\(flyout\)/);
  assert.match(SEARCH_CLIENT, /setAttribute\('role','dialog'\)/);
  assert.match(SEARCH_CLIENT, /setAttribute\('aria-labelledby','ws-cite-title'\)/);
  assert.match(SEARCH_CLIENT, /\.key==='Escape'/);
});

test('the presentation decorator safely leaves unsupported markup alone', () => {
  assert.equal(decorateIndustrialSearch('<p>Different component</p>', {}), '<p>Different component</p>');
  const ctx = { pages: [], base: '/demo/wasion/styles/industrial', helpers: {} };
  const decorated = decorateIndustrialSearch(renderSearch('I110', ctx.base), ctx);
  assert.match(decorated, /class="ws-container wis-hero-grid"/);
  assert.doesNotMatch(decorated, /wis-product-stage/);
  assert.match(decorated, /action="\/demo\/wasion\/styles\/industrial\/search" method="post"/);
});

test('the new protected search remains authorized before rendering for GET, HEAD, POST and expired-session recovery', async () => {
  const h = isolationFixture();
  for (const actor of ['wasion', 'other', 'unassigned']) {
    const cookie = await h.login(actor);
    for (const method of ['GET', 'HEAD', 'POST']) {
      const res = await h.request(h.page, '/api/crm-wasion-demo-page?slug=search&style=industrial', { method, cookie, ...(method === 'POST' ? { body: { q: 'I110' } } : {}) });
      assert.equal(res.status, actor === 'wasion' ? 200 : 404, actor + ' ' + method);
      assert.match(res.headers['cache-control'], /private, no-store/);
      if (actor === 'wasion' && method !== 'HEAD') {
        assert.match(res.text, /wis-hero-grid/);
        assert.match(main(res.text), /action="\/demo\/wasion\/styles\/industrial\/search" method="post"/);
        if (method === 'POST') assert.match(main(res.text), /value="I110"/);
      } else assert.ok(!res.text.includes('<html'));
    }
  }
  const anonymous = await h.request(h.page, '/api/crm-wasion-demo-page?slug=search&style=industrial');
  assert.equal(anonymous.status, 302);
  assert.equal(new URL(anonymous.headers.location, 'https://crm.cnps.ai').searchParams.get('returnTo'), '/demo/wasion/styles/industrial/search');
  for (const style of ['industrial', 'orderful']) {
    const base = wasionStyleBase(style);
    const recovery = await h.request(h.page, '/api/crm-wasion-demo-page?slug=search&style=' + style, { method: 'POST', body: { q: 'I-110 <script> & protocols' } });
    assert.equal(recovery.status, 200);
    assert.ok(recovery.text.includes('id="demo-resume" action="' + base + '/search" method="post" hidden'));
    assert.ok(recovery.text.includes('value="I-110 &lt;script&gt; &amp; protocols"'));
    assert.doesNotMatch(recovery.text, /wis-hero-grid|wis-product-stage/);
    assert.match(recovery.headers['content-security-policy'], /default-src 'none';/);
    assert.match(recovery.headers['content-security-policy'], /connect-src 'self';/);
    assert.match(recovery.headers['content-security-policy'], /form-action 'self';/);
    assert.equal(recovery.headers.location, undefined);
  }
  assert.equal(h.counts().modelCalls, 0, 'this suite must not call a real or simulated AI service');
});
