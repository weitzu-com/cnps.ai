import test from 'node:test';
import assert from 'node:assert/strict';
import { officialSearchUrl, rankSearchPages, renderSearch, SEARCH_CLIENT } from '../server/wasion-experience/search.mjs';
import { WASION_SOURCES } from '../server/wasion-demo-sources.mjs';

test('explicit model searches exclude pages that only match question boilerplate', () => {
  for (const query of ['I110', 'I-110', 'What communication options does I110 support?']) {
    assert.deepEqual(rankSearchPages(WASION_SOURCES, query).map(page => page.id), ['i-110-series-smart-water-meter']);
  }
  assert.equal(rankSearchPages(WASION_SOURCES, 'Unknown I999999 meter').length, 0);
  assert.equal(rankSearchPages(WASION_SOURCES, 'Which products are suitable for me?').length, 0);
});

test('model retrieval preserves token boundaries rather than matching another model prefix', () => {
  const fixture = [
    { id: 'i110', title: 'I-110 Smart Water Meter', text: 'Communication options are available.' },
    { id: 'i1100', title: 'I-1100 Smart Water Meter', text: 'Communication options are available.' },
    { id: 'unrelated', title: 'Other product', text: 'Which communication options does this meter support?' }
  ];
  assert.deepEqual(rankSearchPages(fixture, 'I110 communication').map(p => p.id), ['i110']);
});

test('query is escaped into HTML and the freeform form uses POST', () => {
  const query = '\"><script>alert(1)</script><img src=x onerror=alert(2)>';
  const html = renderSearch(query);
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes(query));
  assert.match(html, /id="ws-form"[^>]*action="\/demo\/wasion\/search" method="post"/);
  assert.match(html, /name="q"/);
  assert.match(html, /href="\/demo\/wasion\/ai-search-terms"/);
  assert.match(html, /href="\/demo\/wasion\/privacy"/);
  assert.ok(!html.includes('action="javascript:'));
  assert.match(renderSearch('', '//untrusted.example'), /data-base="\/demo\/wasion"/);
});

test('only official HTTPS source URLs can become outbound citations or media', () => {
  const valid = 'https://en.wasion.com/soluPage/1.html';
  assert.equal(officialSearchUrl(valid), valid);
  assert.equal(officialSearchUrl('https://en.wasion.com:443/soluPage/1.html'), valid);
  for (const invalid of ['javascript:alert(1)', 'data:text/html,bad', 'https://en.wasion.com.evil.example/', 'https://en.wasion.com:8443/', 'https://en.wasion.com:80/', 'http://en.wasion.com/', 'https://user:secret@en.wasion.com/', '//en.wasion.com/']) {
    assert.equal(officialSearchUrl(invalid), '');
  }
});

test('search HTML exposes usable product results before AI resolves', () => {
  const html = renderSearch('I110');
  assert.match(html, /1 matching official pages/);
  assert.match(html, /href="\/demo\/wasion\/i-110-series-smart-water-meter"/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /AI summaries can contain errors/);
  assert.doesNotThrow(() => new Function(SEARCH_CLIENT));
  assert.ok(!SEARCH_CLIENT.includes('.innerHTML'));
});
