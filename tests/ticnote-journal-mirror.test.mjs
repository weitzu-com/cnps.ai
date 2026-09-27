import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Journal mirrors of three high-impression shop.cnps.ai posts, rewritten in the assessment-first journal voice.
// The www product pages are the primary CTA; shop links are secondary "confirm the live price" references only.
const journal = JSON.parse(fs.readFileSync('content/i18n/blogs.json', 'utf8'));
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));
const locales = ['en', 'zh', 'ar'];
const slugs = ['ticnote-api-skill-claude-chatgpt-gemini', 'ticnote-card-vs-lite-vs-pods', 'ai-voice-recorder-under-150-ticnote-lineup'];
const post = (slug) => journal.posts.find((p) => p.slug === slug);
const links = (body) => [...body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
const stripLocale = (u) => u.replace(/^\/(en|zh|ar)(?=\/|$)/, '');
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('the three mirrored posts exist in all three locales with a distinct cover each', () => {
  for (const slug of slugs) {
    const p = post(slug);
    assert.ok(p, 'missing post ' + slug);
    assert.equal(p.date, '2026-09-27');
    assert.ok(assets[p.image], 'unmapped cover ' + p.image);
    for (const size of [640, 1280]) assert.ok(fs.existsSync(`web/assets/editorial/${assets[p.image].file}-${size}.webp`), 'missing cover file ' + p.image + ' ' + size);
    for (const l of locales) {
      const v = p.locales[l];
      assert.ok(v?.title && v?.description && v?.alt && v?.body, slug + ' incomplete in ' + l);
      assert.equal((v.body.match(/^## /gm) || []).length, 6, slug + ' ' + l + ' should carry six sections like the rest of the journal');
      assert.ok(/^\|.*\|$/m.test(v.body), slug + ' ' + l + ' needs its one practical table');
    }
  }
  assert.equal(new Set(journal.posts.map((p) => assets[p.image].file)).size, journal.posts.length, 'covers must stay distinct');
});

test('titles and metas are unique across every post and locale, and the API post carries the query terms', () => {
  const titles = new Set(), metas = new Set();
  for (const p of journal.posts) for (const l of locales) { titles.add(p.locales[l].title); metas.add(p.locales[l].description); }
  assert.equal(titles.size, journal.posts.length * locales.length, 'journal titles collide');
  assert.equal(metas.size, journal.posts.length * locales.length, 'journal metas collide');
  const api = post(slugs[0]);
  for (const l of locales) {
    assert.match(api.locales[l].title, /TicNote API/);
    assert.match(api.locales[l].title, /Claude/);
    assert.match(api.locales[l].title, /ChatGPT/);
    assert.match(api.locales[l].title, /Gemini/);
    assert.ok(api.locales[l].description.length <= 170, 'meta length ' + l + ' ' + api.locales[l].description.length);
  }
  assert.match(post(slugs[1]).locales.en.title, /^TicNote card vs Lite vs Pods/);
  assert.match(post(slugs[2]).locales.en.title, /under \$150/);
});

test('www product pages are the primary CTA; shop links are secondary and few', () => {
  for (const slug of slugs) {
    for (const l of locales) {
      const body = post(slug).locales[l].body;
      const all = links(body);
      const firstProduct = body.search(new RegExp(`\\]\\(/${l}/products/ticnote`));
      const firstShop = body.search(/shop\.cnps\.ai\/products/);
      assert.ok(firstProduct >= 0, slug + ' ' + l + ' must link the TicNote product page');
      assert.ok(firstShop < 0 || firstProduct < firstShop, slug + ' ' + l + ' links the shop before the product page');
      const productLinks = all.filter((u) => u.startsWith(`/${l}/products/`));
      const shopLinks = all.filter((u) => u.includes('shop.cnps.ai'));
      assert.ok(productLinks.length >= 3, slug + ' ' + l + ' should link at least three catalog product pages');
      assert.ok(shopLinks.length >= 1 && shopLinks.length <= 2, slug + ' ' + l + ' shop links should be one or two');
      assert.ok(all.some((u) => u.startsWith(`/${l}/request-quote`)), slug + ' ' + l + ' needs the inquiry link');
      for (const u of all.filter((u) => u.startsWith('/'))) assert.ok(u.startsWith('/' + l + '/'), slug + ' ' + l + ' unprefixed internal link ' + u);
    }
    // Same link targets in every locale once the prefix is removed.
    const ref = links(post(slug).locales.en.body).map(stripLocale).sort();
    for (const l of ['zh', 'ar']) assert.deepEqual(links(post(slug).locales[l].body).map(stripLocale).sort(), ref, slug + ' ' + l + ' link targets differ from en');
  }
  assert.match(post(slugs[1]).locales.en.body, /\]\(\/en\/products\/ticnote-pods-4g\)/);
  assert.match(post(slugs[0]).locales.en.body, /\]\(https:\/\/ticnote\.com\/en\/skill\)/);
});

test('no invented specifications: only figures the catalog product pages already publish', () => {
  for (const slug of slugs) {
    for (const l of locales) {
      const body = post(slug).locales[l].body;
      assert.doesNotMatch(body, /\d+\s*(hours|小时|ساعة|ساعات)\s*(of )?(battery|电池|续航|بطارية)/i, slug + ' ' + l + ' states battery hours');
      assert.doesNotMatch(body, /\d{2,}\s*%/, slug + ' ' + l + ' states a percentage claim');
      assert.doesNotMatch(body, /mobvoi/i);
      assert.doesNotMatch(body, /voice-recorder-cdn\.ticnote\.com/, 'do not republish the install package URL; link the Skill page instead');
    }
    const en = post(slug).locales.en.body;
    if (slug !== slugs[0]) {
      assert.match(en, /64GB \(about 434 hours\)/);
      assert.match(en, /\$139\.99/);
      assert.match(en, /\$99\.99/);
      assert.match(en, /434(-hour figure| hours) as storage capacity/, '434 hours must be framed as storage, never battery life');
    }
  }
  const api = post(slugs[0]).locales.en.body;
  assert.match(api, /Professional or Business plan/);
  assert.match(api, /does not sell or configure API access/);
  assert.match(api, /no dedicated card, connector, plugin, custom GPT or Gem/);
});

test('built journal pages carry BlogPosting schema, unique titles and locale-prefixed product links', () => {
  const first = path.join('dist/en/blogs', slugs[0] + '.html');
  if (!fs.existsSync(first)) {
    assert.ok(true, 'build output not present; source checks already ran');
    return;
  }
  const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
  for (const slug of slugs) {
    for (const l of locales) {
      const file = path.join('dist', l, 'blogs', slug + '.html');
      assert.ok(fs.existsSync(file), 'missing ' + file);
      const html = fs.readFileSync(file, 'utf8');
      const v = post(slug).locales[l];
      assert.match(html, new RegExp(`<title>${escapeRe(v.title)} \\| CNPS\\.AI</title>`));
      assert.match(html, new RegExp(`<link rel="canonical" href="https://www\\.cnps\\.ai/${l}/blogs/${slug}">`));
      const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
      const posting = blocks.find((x) => x['@type'] === 'BlogPosting');
      assert.ok(posting, file + ' BlogPosting JSON-LD');
      assert.equal(posting.datePublished, '2026-09-27');
      assert.ok(!blocks.some((x) => x['@type'] === 'FAQPage'), 'journal posts do not carry FAQPage; match the existing blog schema');
      assert.match(html, new RegExp(`href="/${l}/products/ticnote"`));
      assert.doesNotMatch(html, /href="\/products\//);
      assert.match(sitemap, new RegExp(`<loc>https://www\\.cnps\\.ai/${l}/blogs/${slug}</loc>`));
      assert.match(fs.readFileSync(path.join('dist', l, 'blogs/feed.xml'), 'utf8'), new RegExp(`/${l}/blogs/${slug}</link>`));
    }
  }
});
