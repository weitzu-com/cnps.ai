import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { wasionDemoPage as renderWasionDemoPage, WASION_PAGES, WASION_LEGACY_ROUTES as WASION_DEMO_ROUTES, WASION_DEMO_ROUTES as ALL_WASION_DEMO_ROUTES } from '../server/wasion-demo-page.mjs';
import { WASION_STYLES as ALL_WASION_STYLES, wasionStyleBase } from '../server/wasion-demo-styles.mjs';
import { REQUIREMENTS_ROUTES } from '../server/wasion-requirements/index.mjs';
import { EXPERIENCE_ROUTES, CONTENT_CLIENT, getNewsItems, renderNewsFilters } from '../server/wasion-experience/content.mjs';
import { NEWS_METADATA, PAST_EVENTS, DTECH } from '../server/wasion-experience/content-data.mjs';
import { isIndustrialNewsPage, renderIndustrialNewsEvents, INDUSTRIAL_NEWS_EVENTS_CSS } from '../server/wasion-industrial-news-events.mjs';

// Industrial is retained explicitly; the upstream 09/16 rebuild stays default.
const WASION_STYLES = Object.fromEntries(Object.entries(ALL_WASION_STYLES).filter(([style]) => style !== 'requirements'));
const wasionDemoPage = (nonce, options = {}) => renderWasionDemoPage(nonce, { style: 'industrial', ...options });
const base = wasionStyleBase('industrial');
const nonce = 'industrial-news-events-fixture';
const hash = value => createHash('sha256').update(value).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const text = markup => markup.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, entity => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }[entity]));
const attributes = tag => Object.fromEntries([...tag.matchAll(/\b([a-z-]+)="([^"]*)"/g)].map(([, key, value]) => [key, text(value)]));
const main = html => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
const scripts = html => html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g);
const rendered = slug => main(wasionDemoPage(nonce, { slug }));
const rawNews = WASION_PAGES.filter(page => page.category === 'Newsroom' && page.pageType === 'detail');
const targets = ['newsroom', 'events', 'dtech-2026', 'president-daniel-francisco-chapo-republic-mozambique-visited-wasion', 'hungarian-ambassador-visit-wasion', 'wasion-international-2025-annual-summary-commendation-conference'];
const pageInfo = slug => WASION_PAGES.find(page => page.slug === slug) || EXPERIENCE_ROUTES.find(page => page.slug === slug) || { slug };
const ctx = { pages: WASION_PAGES, base };
const articles = markup => [...markup.matchAll(/<article class="we-filter-item"([^>]*)>([\s\S]*?)<\/article>/g)].map(([, attrs, body]) => ({ attrs, body }));
const preview = value => { const copy = String(value || '').replace(/\s+/g, ' ').trim(); return copy.length > 220 ? copy.slice(0, 217).trimEnd() + '…' : copy; };

// Captured from a clean git archive of main 60f2db5e1a23d34a9e733195437153ecf1518f4a
// before applying this news presentation. The earlier a9 baseline is historical.
// These fingerprints use complete old outputs and original raw records, not
// current-render snapshots or acceptance files loaded at test runtime.
const originalArticles = {
  'president-daniel-francisco-chapo-republic-mozambique-visited-wasion': '907dd50457019ede3806cf85ef21785ea0eea5083b881171a096ee33a5064f83',
  'hungarian-ambassador-visit-wasion': '2fbea1638a391b1847f24afe0a626554d37b72d8f73bba3eb84d5ecff48f57d6',
  'wasion-international-2025-annual-summary-commendation-conference': '905f7482f7f65bdf2f6ebb90b48d11db7d926b28fee7cda4567fe703362ef38e'
};

test('all original source records, news metadata, event dates and curated DTECH content remain unchanged', () => {
  assert.equal(rawNews.length, 3);
  assert.deepEqual(rawNews.map(page => page.paragraphs.length), [7, 6, 7]);
  assert.deepEqual(rawNews.map(page => page.images.length), [1, 4, 5]);
  assert.equal(hash(JSON.stringify(WASION_PAGES)), 'f7b21c05fa46f70bfed0eb9584501cff0deb37fdf47edec10b5b07670a2b4691');
  assert.equal(hash(JSON.stringify(EXPERIENCE_ROUTES)), '4d82b874da7579626967c0a7a9530a4810539a74d5452c29a51548302d1d9a6b');
  assert.equal(hash(JSON.stringify(rawNews)), '7c27157ac4cefc187d3a8b0f655cc084a4fdffb05711e167f0fe0e2ac21229db');
  assert.equal(hash(JSON.stringify(NEWS_METADATA)), 'e5d3d3e17e84c760a7e2db8c315e96d2f82fd7979baa4152937160a551ebf7ee');
  assert.equal(hash(JSON.stringify(PAST_EVENTS)), '9e416cee9b649b015aea6a173e2b3d713c13794fe690683a8967df98a7f2b6ba');
  assert.equal(hash(JSON.stringify(DTECH)), '8c6519067ee708cdc232c712e35a3ccb8e27b14c4a29b2ff979f94b6b04a963c');
  assert.equal(isIndustrialNewsPage(null), false);
  assert.equal(renderIndustrialNewsEvents({ slug: 'resources' }, {}, '<p>Original content</p>'), '<p>Original content</p>');
});

test('all 450 complete script sets and 444 non-target full HTML pages retain their bytes', () => {
  const clients = [], unaffected = [];
  for (const style of Object.keys(WASION_STYLES)) for (const slug of WASION_DEMO_ROUTES) {
    const html = wasionDemoPage(nonce, { style, slug }), target = targets.includes(slug), expected = style === 'industrial' && target;
    assert.equal(isIndustrialNewsPage(pageInfo(slug)), target, slug + ' predicate');
    assert.equal(html.includes(INDUSTRIAL_NEWS_EVENTS_CSS), expected, style + ' ' + slug + ' CSS scope');
    assert.equal(main(html).includes('class="win-page'), expected, style + ' ' + slug + ' markup scope');
    clients.push([style, slug, hash(JSON.stringify(scripts(html)))]);
    if (!expected) unaffected.push([style, slug, hash(html)]);
    else {
      assert.ok(html.indexOf('id="wd-protected"') < html.indexOf('class="win-page'));
      assert.equal((html.match(/<style\b/g) || []).length, 1);
      assert.match(html, /<style nonce="industrial-news-events-fixture">/);
    }
  }
  assert.equal(targets.length, 6);
  assert.equal(clients.length, 450);
  assert.equal(unaffected.length, 444);
  // No normalization: this includes the existing eight company-image suffixes.
  assert.equal(hash(JSON.stringify(clients)), '315bced3022193af67b8d21c85b581f56a45ebe290cc93bf6176b7c687ede33f');
  assert.equal(hash(JSON.stringify(unaffected)), '7af9be9a778af728eca51a611cef817e147028e6a1829657bfa06adfc721939f');
});

test('all 198 Requirements pages retain approved content with reviewed homepage card geometry', () => {
  assert.equal(Object.keys(ALL_WASION_STYLES).length, 6);
  assert.equal(WASION_DEMO_ROUTES.length, 90);
  assert.equal(REQUIREMENTS_ROUTES.length, 198);
  assert.deepEqual(new Set(ALL_WASION_DEMO_ROUTES), new Set(REQUIREMENTS_ROUTES));
  const priorRows = [];
  const rows = REQUIREMENTS_ROUTES.map(slug => {
    const html = renderWasionDemoPage(nonce, { slug });
    assert.equal(typeof html, 'string', slug);
    assert.match(html, /<body class="wd-style-requirements /);
    assert.ok(!html.includes(INDUSTRIAL_NEWS_EVENTS_CSS));
    assert.ok(!main(html).includes('class="win-page'));
    assert.ok(html.includes('href="https://www.wasion.cn/"'), slug);
    assert.ok(html.includes('href="http://website.wasionholdings.wisdomir.com/en/ir_ann.php"'), slug);
    assert.ok(!html.includes('href="https://www.wasion.com/"'), slug);
    assert.ok(!html.includes('href="https://website.wasionholdings.wisdomir.com/en/ir_ann.php"'), slug);
    // Retain the geometry reversal pin with the current embedded search catalog.
    // The later search change adds only download metadata and the shared ranker.
    const previousHtml = html
      .replace('linear-gradient(90deg,#001e45f7,#001e45c4 50%,#001e45c4)', 'linear-gradient(90deg,#001e45f7,#001e45c4 50%,#001e4533)')
      .replace('.wr-hero-backdrop{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:right center;', '.wr-hero-backdrop{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;')
      .replace('.wr-offering-tile-media{aspect-ratio:8/5;', '.wr-offering-tile-media{height:13rem;')
      .replace('.wr-offering-tile-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:right center;', '.wr-offering-tile-media img{width:100%;height:100%;object-fit:cover;');
    assert.notEqual(previousHtml, html, slug);
    priorRows.push([slug, hash(previousHtml)]);
    return [slug, hash(html)];
  });
  // Advanced from 9417e42f for source-preserving parameter grids, five visible
  // source-wording notices, their shared scroll/contrast styling, and four
  // exact product-ID display focus corrections. A clean f152 archive with
  // only those explicit focus helper edits matched all198 outputs after the
  // business CSS and86 parameter sections were replaced. All1499 source rows
  // and2606 cells retain their original spans and text.
  // Earlier source/keyboard/visual evidence stays separately frozen.
  // A later clean56f65a9 comparison advanced de2f41e7 only by removing the
  // unused film dialog: all198 pages lacked any opener, and the real Media
  // Kit inline video, styles, scripts and visible content remain identical.
  // The next clean955 comparison adds only I110's source-attribution notice:
  // its RPMA row remains under the original Alarm and Event logs parent.
  // The other197 complete outputs, all styles/scripts and the grids match.
  assert.equal(hash(JSON.stringify(priorRows)), 'f68b1995a5045460147f31966ac93e587fcc003df53af5300f4831791c45e79e');
  // Advanced after exact reversal against clean a721 recovered all 198 parent outputs:
  // remove embedded download fields and restore only the search-page rank function.
  // Visible unqueried markup and all styles remain identical.
  // The prior a721 full-page pin was 8659ff67d678a549cc39b198053ba3048eb725df828cd8d76e5e3e3a4a5d86c3.
  assert.equal(hash(JSON.stringify(rows)), 'b7c2b017d9ab43f94049cb315aecd119159e723aa173da678689c8ec5137f23f');
});

test('fifteen populated, empty and hostile search query outputs remain byte-identical in all five styles', () => {
  const rows = [];
  for (const style of Object.keys(WASION_STYLES)) for (const query of ['I110', 'aMeter300 </script><script>alert(1)</script> & AMI', 'Unknown I999999 meter']) {
    const html = wasionDemoPage(nonce, { style, slug: 'search', query });
    rows.push([style, query, hash(html), hash(JSON.stringify(scripts(html)))]);
  }
  assert.equal(rows.length, 15);
  assert.equal(hash(JSON.stringify(rows)), '175c84e0af452ea5e2e91c52241c495224b165a78c7b2cf281ce0b8e1c02f5a6');
});

for (const page of rawNews) test('the complete original article and every official image remain available: ' + page.slug, () => {
  const markup = rendered(page.slug), record = getNewsItems(ctx).find(item => item.slug === page.slug);
  const article = markup.match(/<article class="wd-reading">[\s\S]*?<\/article>/)[0];
  assert.equal(hash(article), originalArticles[page.slug], 'all original paragraphs, section IDs, source notices and links');
  for (const paragraph of page.paragraphs) assert.ok(article.includes(escape(paragraph)), 'complete original paragraph');
  assert.equal(text(markup.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1]), record.title);
  const hero = markup.match(/<figure class="win-visual">[\s\S]*?<\/figure>/)[0];
  assert.ok(hero.includes('src="' + escape(encodeURI(page.images[0])) + '"'));
  assert.ok(hero.includes('alt="' + escape(record.title) + '"'));
  for (const url of page.images) {
    const encoded = escape(encodeURI(url));
    if (/\.gif(?:\?|$)/i.test(url)) {
      assert.ok(markup.includes('href="' + encoded + '" target="_blank" rel="noopener noreferrer"'));
      assert.ok(!markup.includes('src="' + encoded + '"'), 'animation remains a user-controlled official link');
      assert.match(markup, /Open the publisher’s animation when you choose\./);
    } else assert.ok(markup.includes('src="' + encoded + '"'), 'all original static photographs, including previously unshown gallery images');
  }
  assert.ok(markup.includes('href="' + escape(encodeURI(page.url)) + '"'));
  assert.match(markup, new RegExp('Published <time datetime="' + NEWS_METADATA[page.slug].date + '">'));
});

test('publication dates remain distinct from visit, meeting and past exhibition dates', () => {
  const hungary = rendered('hungarian-ambassador-visit-wasion');
  assert.match(hungary, /Published <time datetime="2026-03-20">20 March 2026<\/time>/);
  assert.ok(hungary.includes('On March 19,'));
  const annual = rendered('wasion-international-2025-annual-summary-commendation-conference');
  assert.match(annual, /Published <time datetime="2026-02-11">11 February 2026<\/time>/);
  assert.ok(annual.includes('On the afternoon of February 10,'));
  assert.ok(annual.includes('2025 Annual Summary'));
  const dtech = rendered('dtech-2026');
  assert.match(dtech, /Published <time datetime="2026-02-08">8 February 2026<\/time>/);
  assert.ok(dtech.includes('<dt>Past event</dt><dd>2–5 February 2026</dd>'));
  assert.ok(dtech.includes('<dt>Venue</dt><dd>San Diego Convention Center, United States</dd>'));
  for (const item of getNewsItems(ctx)) assert.equal(item.year, '2026');
});

test('the four news rows retain full search attributes, original facets and 220-character source-backed previews', () => {
  const records = getNewsItems(ctx), markup = rendered('newsroom'), rows = articles(markup);
  assert.equal(hash(JSON.stringify(records)), 'c365a2f5c7b2db108b1aa01b389e16dc4f90c712565ca4d39846b53cb1ec3c59');
  assert.equal(rows.length, 4);
  assert.equal(hash(JSON.stringify(rows.map(row => row.attrs))), '5ede9f463be2447042378b20282665f8f40dc8db9cac90b1a4d5cae9de10677d');
  const selects = [...markup.matchAll(/<select\b[^>]*>[\s\S]*?<\/select>/g)].map(([select]) => select.replace(/ aria-label="[^"]+"/, ''));
  assert.equal(hash(JSON.stringify(selects)), '19b5232955de2aa32fbac20f457d8d64960148af48280abef38b6a5ffb7e1b69');
  const fixture = renderNewsFilters(records, ctx, () => '<span>Fixture</span>');
  assert.deepEqual(articles(fixture).map(row => row.attrs), rows.map(row => row.attrs));
  for (const [index, record] of records.entries()) {
    const row = rows[index].body, attrs = attributes(rows[index].attrs);
    assert.deepEqual(attrs, { 'data-q': (record.title + ' ' + record.description).toLowerCase(), 'data-topic': record.topic, 'data-region': record.region, 'data-type': record.type, 'data-year': record.year });
    assert.ok(row.includes('<h3>'));
    assert.ok(row.includes(escape(record.title)));
    assert.ok(row.includes('href="' + base + '/' + record.slug + '"'));
    assert.ok(row.includes('href="' + escape(encodeURI(record.url)) + '"'));
    assert.ok(row.includes('src="' + escape(encodeURI(record.image)) + '"'));
    assert.match(row, new RegExp('<time datetime="' + record.date + '">'));
    assert.equal(text(row.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)[1]), preview(record.description));
  }
  for (const [, select] of markup.matchAll(/(<select\b[^>]*>)/g)) assert.match(select, /aria-label="(?:Topic|Region|Content type|Year)"/);
  assert.match(markup, /<label>Search news<input type="search" data-filter="q" maxlength="160"/);
  assert.match(markup, /class="we-filter-count" aria-live="polite"/);
  assert.match(markup, /class="we-filter-empty" hidden/);
});

test('events retain the original honest upcoming state, past-event record and official source disclosure', () => {
  const markup = rendered('events'), start = markup.indexOf('<div class="wd-container we-content win-events-content">');
  assert.ok(start >= 0);
  const added = '<a class="" href="' + base + '/dtech-2026">Read the event report <span aria-hidden="true">↗</span></a>';
  assert.ok(markup.includes(added));
  const body = markup.slice(start, markup.lastIndexOf('</div>'))
    .replace('<div class="wd-container we-content win-events-content">', '<div class="wd-container we-content">')
    .replace('<h2 id="win-past-events">Past events</h2>', '<h2>Past events</h2>')
    .replace(added, '');
  assert.equal(hash(body), '81fdad5cf2930045708d5d3e7f2b2f19c9b7a6c7a91cf0a29bf1fcddb1e226e5');
  assert.match(markup, /Contact Wasion for its current event schedule and meeting opportunities\./);
  assert.match(markup, /href="mailto:sales@wasion\.com\?subject=Wasion%20event%20enquiry"/);
  assert.doesNotMatch(markup, /Register now|registration|upcoming DTECH|2027/i);
});

test('DTECH retains its entire curated original report after moving the one official image into its opening', () => {
  const markup = rendered('dtech-2026'), start = markup.indexOf('<div class="wd-container we-content win-event-report"');
  assert.ok(start >= 0);
  const body = markup.slice(start, markup.indexOf('<section class="wd-container win-related">'))
    .replace('<div class="wd-container we-content win-event-report" id="overview">', '<div class="wd-container we-content">');
  assert.equal(hash(body), 'ead4d34f16b712b48e83815f6799ca4cf77c0e9a24282f562709f9c665a4e11e');
  for (const paragraph of DTECH.paragraphs) assert.ok(body.includes(escape(paragraph)));
  const source = escape(encodeURI(DTECH.images[0]));
  assert.equal([...markup.matchAll(/<img\b[^>]*>/g)].filter(([img]) => img.includes('src="' + source + '"')).length, 1);
  assert.ok(body.includes('href="' + base + '/next-gen-ami"'));
  assert.ok(body.includes('href="' + DTECH.url + '"'));
});

test('all six pages retain accessible navigation, source links, resolving anchors and auxiliary AI without new handlers', () => {
  for (const slug of targets) {
    const markup = rendered(slug);
    assert.equal((markup.match(/<h1\b/g) || []).length, 1, slug);
    assert.match(markup, /<h1 id="win-title">/);
    assert.match(markup, /aria-label="Breadcrumb"/);
    const nav = markup.match(/<nav class="win-nav[^>]*>[\s\S]*?<\/nav>/)[0];
    assert.match(nav, /aria-label="News and events"/);
    assert.equal((nav.match(/<a\b/g) || []).length, 4);
    assert.equal((nav.match(/aria-current="page"/g) || []).length, 1);
    assert.ok(nav.includes('href="' + base + '/' + (slug === 'events' ? 'events' : 'newsroom') + '" aria-current="page"'));
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
    assert.equal(ids.length, new Set(ids).size, slug + ' unique IDs');
    for (const [, id] of markup.matchAll(/href="#([^\"]+)"/g)) assert.ok(ids.includes(id), slug + ' resolving anchor ' + id);
    const ai = attributes(markup.match(/<a class="win-ai"[^>]*>/)[0]);
    assert.equal(new URL(ai.href, 'https://crm.cnps.ai').pathname, base + '/search');
    assert.ok(new URL(ai.href, 'https://crm.cnps.ai').searchParams.get('q'));
    for (const [, tag] of markup.matchAll(/(<a\b[^>]*target="_blank"[^>]*>)/g)) {
      const link = attributes(tag);
      assert.equal(link.rel, 'noopener noreferrer');
      assert.equal(new URL(link.href).origin, 'https://en.wasion.com');
    }
    for (const url of [...(pageInfo(slug).sourceUrls || []), pageInfo(slug).url].filter(Boolean)) assert.ok(markup.includes('href="' + escape(encodeURI(url)) + '"'));
    assert.doesNotMatch(markup, /<script\b|\b(?:onclick|onerror|onload)=|<form\b[^>]*action=[^>]*search/);
  }
  assert.match(INDUSTRIAL_NEWS_EVENTS_CSS, /\.win-page :is\(a,button,input,select,summary\):focus-visible\{outline:/);
  assert.doesNotMatch(INDUSTRIAL_NEWS_EVENTS_CSS, /@import|url\s*\(|:root|\banimation\s*:/i);
  for (const [, value] of INDUSTRIAL_NEWS_EVENTS_CSS.matchAll(/\btransition\s*:\s*([^;}]+)/g)) assert.equal(value.trim(), 'none', 'only disabling inherited motion is permitted');
  for (const [, rule] of INDUSTRIAL_NEWS_EVENTS_CSS.matchAll(/([^{}]+)\{/g)) {
    if (/^@(?:media|container)\b/.test(rule.trim())) continue;
    assert.match(rule.trim(), /^(?:\.win-|\.wd-style-industrial:has\(\.win-page\))/);
  }
});

function eventNode(tagName = 'DIV', dataset = {}) {
  const listeners = new Map();
  return { tagName, dataset, value: '', hidden: false, textContent: '',
    addEventListener(type, callback) { const callbacks = listeners.get(type) || []; callbacks.push(callback); listeners.set(type, callbacks); },
    fire(type, fields = {}) {
      const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...fields };
      for (const callback of listeners.get(type) || []) callback(event);
      return event;
    }
  };
}

test('the real shared news client applies all five intersecting filters, accent-insensitive search, empty state and reset', () => {
  const markup = rendered('newsroom');
  const controls = Object.fromEntries(['q', 'topic', 'region', 'type', 'year'].map(key => [key, eventNode(key === 'q' ? 'INPUT' : 'SELECT', { filter: key })]));
  const items = articles(markup).map((row, id) => Object.assign(eventNode('ARTICLE', Object.fromEntries(Object.entries(attributes(row.attrs)).map(([key, value]) => [key.replace('data-', ''), value]))), { id }));
  const more = eventNode('BUTTON'), reset = eventNode('BUTTON'), count = eventNode(), empty = eventNode(), form = eventNode('FORM');
  const elements = { '.we-filter-more': more, '.we-filter-reset': reset, '.we-filter-count': count, '.we-filter-empty': empty, form };
  const scope = { dataset: { pageSize: markup.match(/data-page-size="(\d+)"/)[1] },
    querySelectorAll: selector => selector === '[data-filter]' ? Object.values(controls) : selector === '.we-filter-item' ? items : [],
    querySelector: selector => elements[selector] || null };
  runInNewContext(CONTENT_CLIENT, { document: { querySelectorAll: selector => selector === '.we-filter-scope' ? [scope] : [] } }, { timeout: 1000 });
  const visible = () => items.filter(item => !item.hidden).map(item => item.id);
  const set = (key, value) => { controls[key].value = value; controls[key].fire(key === 'q' ? 'input' : 'change'); };
  assert.deepEqual(visible(), [0, 1, 2, 3]);
  assert.equal(count.textContent, '4 results'); assert.equal(more.hidden, true); assert.equal(empty.hidden, true);
  set('q', 'MATE'); assert.deepEqual(visible(), [1]);
  set('q', 'mÁtÉ'); assert.deepEqual(visible(), [1]);
  set('topic', 'International cooperation'); set('region', 'Hungary'); set('type', 'Company news'); set('year', '2026');
  assert.deepEqual(visible(), [1]);
  set('type', 'Event report'); assert.deepEqual(visible(), []);
  assert.equal(count.textContent, '0 results'); assert.equal(empty.hidden, false); assert.equal(more.hidden, true);
  reset.fire('click'); assert.deepEqual(Object.values(controls).map(control => control.value), ['', '', '', '', '']);
  assert.deepEqual(visible(), [0, 1, 2, 3]); assert.equal(empty.hidden, true);
  set('topic', 'International cooperation'); assert.deepEqual(visible(), [0, 1]);
  reset.fire('click'); set('q', 'DTECH'); set('region', 'United States'); set('type', 'Event report'); set('topic', 'Metering & distribution'); set('year', '2026');
  assert.deepEqual(visible(), [3]);
  reset.fire('click'); set('year', '2026'); set('q', '2025'); assert.deepEqual(visible(), [2], 'summary year does not change publication-year facet');
  reset.fire('click'); controls.q.value = 'hungary';
  assert.equal(form.fire('submit').defaultPrevented, true); assert.deepEqual(visible(), [1]);
});
