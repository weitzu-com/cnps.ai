import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { EXPERIENCE_ROUTES, CHALLENGES, renderExperiencePage, renderRelatedExperience, renderSolutionExperience, CONTENT_CLIENT } from '../server/wasion-experience/content.mjs';
import { NEWS_METADATA, FACTORIES, DTECH } from '../server/wasion-experience/content-data.mjs';

const { pages } = JSON.parse(await readFile(new URL('../server/wasion-demo-content.json', import.meta.url), 'utf8'));
const ctx = { pages, base: '/demo/wasion' };
const html = slug => renderExperiencePage(slug, ctx);
const unescape = s => s.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");

test('new experience pages resolve with one headline and retain every declared official source', () => {
  const known = new Set([...pages.map(p => p.slug), ...EXPERIENCE_ROUTES.map(p => p.slug), 'search']);
  assert.equal(new Set(EXPERIENCE_ROUTES.map(p => p.slug)).size, EXPERIENCE_ROUTES.length);
  for (const route of EXPERIENCE_ROUTES) {
    const rendered = html(route.slug);
    assert.ok(rendered, route.slug);
    assert.equal((rendered.match(/<h1>/g) || []).length, 1, route.slug);
    for (const url of route.sourceUrls) assert.ok(rendered.includes(encodeURI(url)), `${route.slug}: ${url}`);
    for (const [, target] of rendered.matchAll(/href="\/demo\/wasion\/([^"?#]*)/g)) assert.ok(known.has(target) || !target, `${route.slug}: unresolved ${target}`);
  }
  assert.equal(html('unprovided-product-model'), null);
});

test('the four business challenges use distinct compositions and actual source routes', () => {
  assert.equal(CHALLENGES.length, 4);
  const layouts = CHALLENGES.map(c => html(c.slug));
  assert.ok(layouts[0].includes('we-equation'));
  assert.ok(layouts[1].includes('we-path'));
  assert.ok(layouts[2].includes('See the application in context'));
  assert.ok(layouts[3].includes('we-utility-pair'));
  assert.ok(!layouts.slice(1).some(s => s.includes('we-equation')));
  assert.ok(layouts[0].includes('/demo/wasion/energy-pro'));
});

test('resource certificates preserve exact entity scope and never fabricate unlinked downloads', () => {
  const rendered = html('certifications');
  const items = pages.find(p => p.slug === 'resources').resourceItems.filter(r => /ISO|Certificate|MID/i.test(r.title));
  for (const item of items) {
    assert.ok(rendered.includes(item.title), item.title);
    if (item.url) assert.ok(rendered.includes(encodeURI(item.url)));
  }
  assert.ok(rendered.includes('Wasion Hungary Kft.'));
  assert.ok(rendered.includes('A downloadable file is not linked by the publisher.'));
  assert.ok(!rendered.includes('All products are certified'));
});

test('news publication dates come from official text labels and expose all requested facets', () => {
  const rendered = html('newsroom');
  for (const key of ['topic', 'region', 'type', 'year', 'q']) assert.ok(rendered.includes(`data-filter="${key}"`));
  for (const meta of Object.values(NEWS_METADATA)) assert.ok(rendered.includes(`datetime="${meta.date}"`));
  assert.equal(NEWS_METADATA['wasion-international-2025-annual-summary-commendation-conference'].date, '2026-02-11');
  assert.ok(rendered.includes('/demo/wasion/dtech-2026'));
});

test('catalog lists expose source-backed filters and keep external uncaptured products on official URLs', () => {
  for (const slug of ['electricity-meters', 'telecommunications', 'system-software', 'water-gas-meters', 'digital-grid-distribution-monitoring', 'energy-storage']) {
    const rendered = html(slug);
    for (const key of ['type', 'standard', 'region', 'q']) assert.ok(rendered.includes(`data-filter="${key}"`), `${slug}: ${key}`);
    for (const [, u] of rendered.matchAll(/href="(https:[^"]+)"/g)) assert.equal(new URL(unescape(u)).host, 'en.wasion.com');
  }
  assert.ok(html('energy-storage').includes('WE NODE'));
  assert.ok(html('digital-grid-distribution-monitoring').includes('WE-CHZ-27/630'));
  assert.ok(!html('water-gas-meters').includes('Universal certification'));
});

test('the company map uses four documented factory countries with an accessible list alternative', () => {
  const rendered = html('about');
  assert.deepEqual(FACTORIES.map(f => f.country), ['Mexico', 'Brazil', 'Tanzania', 'Hungary']);
  assert.ok(rendered.includes('Schematic map.'));
  for (const f of FACTORIES) assert.ok(rendered.includes(`<summary>${f.country}`));
  assert.ok(rendered.includes('<strong>2000</strong>'));
  assert.ok(rendered.includes('<strong>2005</strong>'));
});

test('events retain verified historical dates, no expired registration or invented upcoming event', () => {
  const rendered = html('events');
  assert.ok(rendered.includes('2–5 February 2026'));
  assert.ok(rendered.includes('San Diego Convention Center'));
  assert.ok(rendered.includes('Ask about upcoming events'));
  assert.ok(!/Register|registration|2027/.test(rendered));
  assert.ok(html('next-gen-ami').includes('North American AMI 2.0'));
  assert.ok(html('next-gen-ami').includes(DTECH.url));
});

test('solution templates retain source paragraphs, technical cells, downloads and source anchor', () => {
  for (const p of pages.filter(p => p.category === 'Solutions' && p.pageType === 'detail')) {
    const rendered = renderSolutionExperience(p, ctx);
    assert.ok(rendered.includes(p.url), p.slug);
    for (const cell of (p.tables || []).flat(2)) assert.ok(unescape(rendered).includes(cell), `${p.slug}: ${cell}`);
    for (const d of p.downloads || []) assert.ok(rendered.includes(encodeURI(d.url)));
    assert.match(rendered, /project experience/i);
  }
});

test('related discovery preserves product-to-solution paths without claiming certified compatibility', () => {
  const p = pages.find(p => p.slug === 'prepayment-vending-management-system');
  const rendered = renderRelatedExperience(p, ctx);
  assert.ok(rendered.includes('/demo/wasion/prepayment-solutions'));
  assert.ok(rendered.includes('Confirm configuration and compatibility'));
  assert.ok(!rendered.includes('certified compatible'));
});

test('source text and facet attributes are escaped; client filters use safe DOM state updates', () => {
  const bad = { ...DTECH, slug: 'bad-news', title: '<script>alert(1)</script>', summary: '" autofocus onfocus="alert(1)' };
  const rendered = renderExperiencePage('newsroom', { pages: [...pages, bad] });
  assert.ok(!rendered.includes('<script>alert(1)</script>'));
  assert.ok(rendered.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(rendered.includes('&quot; autofocus onfocus=&quot;alert(1)'));
  assert.ok(!CONTENT_CLIENT.includes('innerHTML'));
  assert.ok(CONTENT_CLIENT.includes('item.hidden='));
});

test('listed-standard facets consolidate publisher spacing variants without changing technical facts', () => {
  const original = pages.find(p => p.slug === 'ameter300-three-phase-smart-energy-meter');
  const fixture = { ...original, slug: 'spacing-fixture', url: 'https://en.wasion.com/IEC-Smart-Meters/spacing-fixture.html', features: ['ANSI C12.18; ANSIC12.18; IEC62052-11; IEC 62052-11'], tables: [[['Standard', 'ANSIC12.18 / IEC62052-11']]] };
  const snapshot = JSON.stringify(fixture);
  const rendered = renderExperiencePage('electricity-meters', { pages: [...pages, fixture] });
  assert.equal((rendered.match(/<option value="ANSI C12\.18">/g) || []).length, 1);
  assert.equal((rendered.match(/<option value="IEC 62052-11">/g) || []).length, 1);
  assert.ok(!rendered.includes('<option value="ANSIC12.18">'));
  assert.ok(!rendered.includes('<option value="IEC62052-11">'));
  assert.equal(JSON.stringify(fixture), snapshot);
  const detail = renderSolutionExperience({ ...fixture, category: 'Solutions' }, { pages });
  assert.ok(detail.includes('ANSIC12.18 / IEC62052-11'));
});

test('news row previews are concise while their full detail source text is retained', () => {
  const original = pages.find(p => p.slug === 'hungarian-ambassador-visit-wasion');
  const sourceText = `${'Public source description '.repeat(35)}END OF FULL SOURCE`;
  const fixture = { ...original, summary: sourceText, paragraphs: [sourceText] };
  const rendered = renderExperiencePage('newsroom', { pages: pages.map(p => p.slug === original.slug ? fixture : p) });
  const excerpt = [...rendered.matchAll(/<p>([^<]*)<\/p>/g)].map(m => m[1]).find(t => t.startsWith('Public source description'));
  assert.ok(excerpt);
  assert.ok(excerpt.length <= 220);
  assert.ok(excerpt.endsWith('…'));
  assert.ok(!excerpt.includes('END OF FULL SOURCE'));
  assert.equal(fixture.paragraphs[0], sourceText);
  assert.equal(fixture.summary, sourceText);
});

test('every solution offers keyboard-accessible published-topic discovery with exact source links', () => {
  for (const page of pages.filter(p => p.category === 'Solutions' && p.pageType === 'detail')) {
    const rendered = renderSolutionExperience(page, ctx);
    assert.ok(rendered.includes('role="tablist"'), page.slug);
    assert.ok(rendered.includes('role="tabpanel"'), page.slug);
    assert.ok(rendered.includes('aria-selected="true"'), page.slug);
    assert.ok(rendered.includes('data-we-discovery="0"'), page.slug);
    assert.ok(rendered.includes(page.url), page.slug);
    assert.ok(rendered.includes('does not establish a certified architecture'));
  }
  assert.ok(CONTENT_CLIENT.includes("['ArrowLeft','ArrowRight','Home','End']"));
  assert.ok(CONTENT_CLIENT.includes('panels[n].hidden=n!==i'));
});

test('About has a manual official-image carousel with usable previous/next controls', () => {
  const rendered = html('about');
  assert.ok(rendered.includes('aria-roledescription="carousel"'));
  assert.equal((rendered.match(/class="we-company-slide"/g) || []).length, 3);
  assert.ok(rendered.includes('Previous company image'));
  assert.ok(rendered.includes('Next company image'));
  assert.ok(rendered.includes('picabout.jpg'));
  const carousel = rendered.match(/<section class="we-company-carousel"[\s\S]*?<\/section>/)[0];
  assert.ok(!/\.gif|autoplay|setInterval/.test(carousel));
  assert.ok(CONTENT_CLIENT.includes("slides.forEach((slide,i)=>slide.hidden=i!==index)"));
});
