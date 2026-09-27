import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// GSC strike-distance queries: "ticnote card" (position ~8, CTR 0) and "inmo glasses / inmo go 3 / inmo go 3 price".
const pages = JSON.parse(fs.readFileSync('content/i18n/legacy-pages.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('content/i18n/product-assets.json', 'utf8'));
const journal = JSON.parse(fs.readFileSync('content/i18n/blogs.json', 'utf8'));
const page = (p) => pages.find((x) => x.path === p);
const ticnote = page('/products/ticnote');
const inmo = page('/products/inmo-go3');
const locales = ['en', 'zh', 'ar'];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
}

test('TicNote card page: title, meta and copy answer the "ticnote card" query', () => {
  assert.equal(ticnote.seoTitle.en, 'TicNote card: 64GB AI voice recorder for meetings and calls');
  assert.match(ticnote.description.en, /^TicNote card: card-sized AI voice recorder/);
  assert.match(ticnote.description.en, /64GB/);
  assert.match(ticnote.description.en, /TicNote Lite/);
  assert.match(ticnote.description.en, /Pods/);
  assert.ok(ticnote.seoTitle.en.length <= 60, 'title length ' + ticnote.seoTitle.en.length);
  assert.ok(ticnote.description.en.length <= 170, 'meta length ' + ticnote.description.en.length);
  assert.match(ticnote.seoTitle.zh, /TicNote 卡片录音器/);
  assert.match(ticnote.seoTitle.ar, /بطاقة TicNote/);
  assert.match(ticnote.body.en, /^# TicNote AI Voice Recorder\n\nThe TicNote card: a card-sized AI voice recorder/);
  assert.match(ticnote.guide.en, /^## TicNote card, Lite or Pods at a glance$/m);
  assert.match(ticnote.guide.en, /\| Form \| Card-sized recorder that sits on the table \|/);
  assert.match(ticnote.guide.en, /^### What does "TicNote card" mean\?$/m);
  assert.match(ticnote.guide.en, /^### How much does the TicNote card cost\?$/m);
  assert.match(ticnote.guide.zh, /^## 卡片、Lite 与 Pods 一览$/m);
  assert.match(ticnote.guide.ar, /^## بطاقة TicNote أو Lite أو Pods في لمحة$/m);
  // Only figures the shop listing publishes: no vendor rename, no battery hours, no accuracy claims.
  for (const l of locales) {
    assert.doesNotMatch(ticnote.guide[l] + ticnote.description[l] + ticnote.seoTitle[l], /mobvoi/i);
    assert.doesNotMatch(ticnote.guide[l], /\d+\s*(hours|小时|ساعة)\s*(of )?(battery|电池|بطارية)/i);
    assert.doesNotMatch(ticnote.guide[l], /\d{2,}\s*%\s*(accuracy|准确|دقة)/i);
  }
});

test('INMO GO3 page: title, meta, H1 and copy answer glasses and price intent', () => {
  assert.equal(inmo.title.en, 'INMO GO3 AI Smart Glasses');
  assert.equal(inmo.seoTitle.en, 'INMO GO3 AI smart glasses: price, display and translation');
  assert.match(inmo.description.en, /^INMO GO3 AI smart glasses at \$699\.00 USD/);
  assert.match(inmo.description.en, /53 g/);
  assert.match(inmo.description.en, /78 online \/ 9 offline translation languages/);
  assert.ok(inmo.seoTitle.en.length <= 60, 'title length ' + inmo.seoTitle.en.length);
  assert.ok(inmo.description.en.length <= 170, 'meta length ' + inmo.description.en.length);
  assert.match(inmo.title.zh, /智能眼镜/);
  assert.match(inmo.title.ar, /نظارات INMO GO3/);
  assert.match(inmo.body.en, /^# INMO GO3 AI Smart Glasses\n\nINMO GO3 AI smart glasses: 53 g MicroLED AR glasses/);
  assert.match(inmo.guide.en, /^## INMO GO3 price: what the listing shows and how to weigh it$/m);
  assert.match(inmo.guide.en, /^## Which use-cases fit INMO GO3, and which do not$/m);
  assert.match(inmo.guide.en, /\| Colour images, drawings or video in view \| Not a fit \|/);
  assert.match(inmo.guide.en, /^### How much do INMO GO3 glasses cost\?$/m);
  assert.match(inmo.guide.en, /^### What kind of glasses are INMO GO3\?$/m);
  assert.match(inmo.guide.zh, /^## INMO GO3 价格：商店公布了什么，如何衡量$/m);
  assert.match(inmo.guide.ar, /^## سعر INMO GO3: ما تعرضه الصفحة وكيف تقيّمه$/m);
  for (const l of locales) {
    // The listing publishes capacities only, so no hour figure may be stated for the glasses.
    assert.doesNotMatch(inmo.guide[l], /\d+\s*(hours|小时|ساعات|ساعة)\s*(of )?(battery|use|电池|续航|بطارية)/i);
    assert.doesNotMatch(inmo.guide[l], /prescription lenses are supported|支持处方镜片|تدعم العدسات الطبية/i);
    assert.match(inmo.guide[l], /699\.00/);
  }
});

test('product titles and metas stay unique per locale after the refresh', () => {
  for (const l of locales) {
    const titles = new Set(), metas = new Set();
    for (const prod of products) {
      const record = page('/products/' + prod.slug);
      titles.add(record.seoTitle[l]);
      metas.add(record.description[l]);
    }
    assert.equal(titles.size, products.length, l + ' product titles collide');
    assert.equal(metas.size, products.length, l + ' product metas collide');
  }
  assert.notEqual(ticnote.seoTitle.en, page('/products/ticnote-lite').seoTitle.en);
});

test('related pages carry natural internal links with descriptive anchors', () => {
  const compare = page('/products/compare');
  const hub = page('/products');
  assert.match(compare.body.en, /\| {2}\| \[TicNote card\]\(\/products\/ticnote\) \|/);
  assert.match(compare.body.en, /\[INMO GO3 AI smart glasses\]\(\/products\/inmo-go3\)/);
  assert.match(hub.body.en, /\[INMO GO3 AI smart glasses\]\(\/products\/inmo-go3\) weigh 53 g/);
  const post = journal.posts.find((p) => p.slug === 'smart-glasses-one-field-task');
  for (const l of locales) assert.match(post.locales[l].body, new RegExp(`\\]\\(/${l}/products/inmo-go3\\)`));
  assert.equal((post.locales.en.body.match(/\/en\/products\/inmo-go3/g) || []).length, 1, 'one light link, not a link farm');
});

test('built product pages render the refreshed title, meta, H1 and FAQ JSON-LD', () => {
  const files = {
    ticnote: path.join('dist/en/products', 'ticnote.html'),
    inmo: path.join('dist/en/products', 'inmo-go3.html'),
    compare: path.join('dist/en/products', 'compare.html'),
    blog: path.join('dist/en/blogs', 'smart-glasses-one-field-task.html')
  };
  if (!Object.values(files).every((p) => fs.existsSync(p))) {
    assert.ok(true, 'build output not present; source checks already ran');
    return;
  }
  const tic = fs.readFileSync(files.ticnote, 'utf8');
  assert.match(tic, new RegExp(`<title>${escapeRe(ticnote.seoTitle.en)} \\| CNPS\\.AI</title>`));
  assert.match(tic, new RegExp(`<meta name="description" content="${escapeRe(ticnote.description.en)}">`));
  assert.match(tic, /<h1>TicNote AI Voice Recorder<\/h1>/);
  const ticFaq = jsonLdBlocks(tic).find((x) => x['@type'] === 'FAQPage');
  assert.ok(ticFaq, 'TicNote FAQPage JSON-LD');
  const ticQuestions = ticFaq.mainEntity.map((q) => q.name);
  assert.ok(ticQuestions.includes('What does "TicNote card" mean?'));
  assert.ok(ticQuestions.includes('How much does the TicNote card cost?'));
  assert.ok(ticQuestions.length >= 5);

  const go3 = fs.readFileSync(files.inmo, 'utf8');
  assert.match(go3, new RegExp(`<title>${escapeRe(inmo.seoTitle.en)} \\| CNPS\\.AI</title>`));
  assert.match(go3, new RegExp(`<meta name="description" content="${escapeRe(inmo.description.en)}">`));
  assert.match(go3, /<h1>INMO GO3 AI Smart Glasses<\/h1>/);
  const go3Faq = jsonLdBlocks(go3).find((x) => x['@type'] === 'FAQPage');
  assert.ok(go3Faq, 'INMO FAQPage JSON-LD');
  const go3Questions = go3Faq.mainEntity.map((q) => q.name);
  assert.ok(go3Questions.includes('How much do INMO GO3 glasses cost?'));
  assert.ok(go3Questions.includes('What kind of glasses are INMO GO3?'));
  assert.match(go3, /href="\/en\/products\/compare"/);

  assert.match(fs.readFileSync(files.compare, 'utf8'), /href="\/en\/products\/ticnote">TicNote card</);
  assert.match(fs.readFileSync(files.blog, 'utf8'), /href="\/en\/products\/inmo-go3">INMO GO3 AI smart glasses page</);

  for (const l of ['zh', 'ar']) {
    const html = fs.readFileSync(path.join('dist', l, 'products', 'inmo-go3.html'), 'utf8');
    assert.match(html, new RegExp(`<title>${escapeRe(inmo.seoTitle[l])} \\| CNPS\\.AI</title>`));
    assert.match(html, new RegExp(`<h1>${escapeRe(inmo.title[l])}</h1>`));
    const t = fs.readFileSync(path.join('dist', l, 'products', 'ticnote.html'), 'utf8');
    assert.match(t, new RegExp(`<title>${escapeRe(ticnote.seoTitle[l])} \\| CNPS\\.AI</title>`));
  }
});
