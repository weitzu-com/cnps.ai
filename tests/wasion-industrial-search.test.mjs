import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';
import { wasionDemoPage, WASION_PAGES, WASION_DEMO_ROUTES } from '../server/wasion-demo-page.mjs';
import { WASION_STYLES, wasionStyleBase } from '../server/wasion-demo-styles.mjs';
import { renderSearch, SEARCH_CLIENT } from '../server/wasion-experience/search.mjs';
import { decorateIndustrialSearch, INDUSTRIAL_SEARCH_CSS } from '../server/wasion-industrial-search.mjs';
import { isolationFixture } from './fixtures/wasion-isolation.mjs';

const nonce = 'industrial-search-fixture';
const queries = ['', 'I110', 'aMeter300 </script><script>alert(1)</script> & AMI'];
const hash = value => createHash('sha256').update(value).digest('hex');
const main = html => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const script = html => [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].find(([, attributes]) => !attributes.includes('application/ld+json'))[2];

// Captured at be633ec before this presentation change. Script fingerprints
// cover the complete emitted client, including the search trust catalog and
// citation/tab/session handlers; non-Industrial HTML must remain byte-identical.
const baselines = {
  classic: [
    ['e73bc6798c6a117c5cb51da4d8ef70dc8bc2444991d8f480b070c70c13ed0ff7', 'c938a28273fa5ea3029ca3571271d10295e5339951c9e25ba435148d1be12b11'],
    ['fc3fb8bdcbd35cb3663e58715e6caa357921e742997e814c4a1b06093d96ee92', 'ae9f34f9241079cbd260b10c5f8f73873adcaa358717d6dabe9af01215e54798'],
    ['62ecfa9dd6893446cb635cf999a926b41215c01927a308f8b50c2c1492abd3f1', 'dd5d5e866c6f0faeae06c5dba94a8da8299a2cdbac4af4b400da1fdb1bdba77b']
  ],
  atmospheric: [
    ['c82b13b6c17686a18cf08ec0e34be15d85fe73eda58f2fcbd647e932311a8e77', '80c918d0ef93bdf2838dad5e3218220b149f308a742427e7dd62a81ba5d2f63f'],
    ['b220fb7748004692864f39daff020a86fb719eff7997955084a9cf283d9a50cb', 'c1fad7c32e8b49011f5d3ff72587573e38758f8c0339054ab66b94f22caa7f4a'],
    ['85cdd6a632b36ce7b98d69faccee8f4df67bcc01111f8e0d7d150e405fcb82fe', '79dc8a434f46465884a7709f351bba439ae830718f370915903ce20e42eadcc3']
  ],
  planhat: [
    ['d0318d4ff113b3a443faa7035a43072ff19980bb8d4dec27628a7fe3f9770c28', 'a0d145c21c902f144a682575dfe5e9e82d4e837dec7daabd0339211bbbf2685f'],
    ['9dd33ecd6a4acfe0bfaa6b1b17980ec6e762d293bee0ceca630dc5044d58daed', '42346074197b4d6c19e862f8f3b661fbec746a1d3184f808d8d3e19c6a41c05f'],
    ['53a50044d5fd1f4edb0c828f50cc3caefd08ecf3317e839558ab91af25c48344', '217e9c60c450add387c721c7693930c271c535586e53610396db032d0b334af8']
  ],
  orderful: [
    ['5a49feb21e508cb35d46a24355f755718b480521abc6378b1246528326c718b6', '080f3e12af325134a2850a017104cbb978da325bbf70a77efc59a8fc3b443361'],
    ['66c881f195be1a358e5eff1b186f618937d944a02530125802b205091a9e74fd', 'd25f58a9291b689bd9276ca4c2b14cd3e67f8e0a69684d8c89b81061f57eb600'],
    ['90b220b65b2e3e81fedb111cc958441f95f9da1fd2c8475e072385fbe3a8a152', 'a2c939329fafa838aa23c82c5725fd26b986395538110439f79bd45548459042']
  ],
  industrial: [
    ['db9fd4dc5b412946ae11d8a54854e699fcadd4e6dbb2785b4f3f8607a33de0ae'],
    ['4f75f8ec8709c65876505162fb20fcc02ccf41ae5384c5b20bd48d016a662eb2'],
    ['20cc9f7565552a88ade1ce097ee7013247ced1691bcb71483bf567b60243e938']
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

test('the search treatment leaves all 89 other Industrial routes byte-identical', () => {
  const rows = WASION_DEMO_ROUTES.filter(slug => slug !== 'search').map(slug => {
    const html = wasionDemoPage(nonce, { style: 'industrial', slug });
    assert.ok(!html.includes(INDUSTRIAL_SEARCH_CSS), slug);
    return [slug, hash(html)];
  });
  assert.equal(rows.length, 89);
  assert.equal(hash(JSON.stringify(rows)), 'eede3452641ab05ffa0d477675f24d5d3e05c38a52bf957fd06b6e09c6f8189e');
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
    assert.ok(stage.includes('href="/demo/wasion/' + product.slug + '"'));
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
  assert.ok(results.includes('href="/demo/wasion/' + i110.slug + '"'));
  assert.ok(results.includes('href="' + i110.url + '"'));
});

test('the visual decorator preserves native POST, search controls, category semantics and honest hidden states', () => {
  for (const query of ['', 'I110', 'Unknown I999999 meter']) {
    const markup = main(wasionDemoPage(nonce, { slug: 'search', query }));
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size);
    for (const id of ['ws-search', 'ws-form', 'ws-search-label', 'ws-query', 'ws-search-privacy', 'ws-query-title', 'ws-result-count', 'ws-examples', 'ws-tab-all', 'ws-tab-Products', 'ws-tab-Solutions', 'ws-tab-Resources', 'ws-ai', 'ws-ai-title', 'ws-ai-state', 'ws-answer', 'ws-answer-more', 'ws-sources', 'ws-announcement', 'ws-results', 'ws-products-section', 'ws-products', 'ws-products-more', 'ws-pages-section', 'ws-pages-title', 'ws-pages', 'ws-pages-more', 'ws-empty']) assert.ok(ids.includes(id), id);
    assert.match(markup, /id="ws-search" data-base="\/demo\/wasion"/);
    assert.match(markup, /<form\b[^>]*id="ws-form"[^>]*action="\/demo\/wasion\/search" method="post" role="search"/);
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
    assert.match(markup, /href="\/demo\/wasion\/ai-search-terms"/);
    assert.match(markup, /href="\/demo\/wasion\/privacy"/);
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
  const ctx = { pages: [], base: '/demo/wasion', helpers: {} };
  const decorated = decorateIndustrialSearch(renderSearch('I110'), ctx);
  assert.match(decorated, /class="ws-container wis-hero-grid"/);
  assert.doesNotMatch(decorated, /wis-product-stage/);
  assert.match(decorated, /action="\/demo\/wasion\/search" method="post"/);
});

test('the new protected search remains authorized before rendering for GET, HEAD, POST and expired-session recovery', async () => {
  const h = isolationFixture();
  for (const actor of ['wasion', 'other', 'unassigned']) {
    const cookie = await h.login(actor);
    for (const method of ['GET', 'HEAD', 'POST']) {
      const res = await h.request(h.page, '/api/crm-wasion-demo-page?slug=search', { method, cookie, ...(method === 'POST' ? { body: { q: 'I110' } } : {}) });
      assert.equal(res.status, actor === 'wasion' ? 200 : 404, actor + ' ' + method);
      assert.match(res.headers['cache-control'], /private, no-store/);
      if (actor === 'wasion' && method !== 'HEAD') {
        assert.match(res.text, /wis-hero-grid/);
        assert.match(main(res.text), /action="\/demo\/wasion\/search" method="post"/);
        if (method === 'POST') assert.match(main(res.text), /value="I110"/);
      } else assert.ok(!res.text.includes('<html'));
    }
  }
  const anonymous = await h.request(h.page, '/api/crm-wasion-demo-page?slug=search');
  assert.equal(anonymous.status, 302);
  assert.equal(new URL(anonymous.headers.location, 'https://crm.cnps.ai').searchParams.get('returnTo'), '/demo/wasion/search');
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
