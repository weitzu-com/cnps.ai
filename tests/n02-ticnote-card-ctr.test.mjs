import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// N02 (2026-11-06 Asia/Shanghai): second CTR refresh after O10 — dated meta / re-check → 6 Nov 2026.
// H1/title, cover, FAQ, six ##, live-H1 anchors, glance checks, decision-path path unchanged.
const slug = 'ticnote-card-vs-lite-vs-pods';
const journal = JSON.parse(fs.readFileSync('content/i18n/blogs.json', 'utf8'));
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const post = journal.posts.find((p) => p.slug === slug);
const locales = ['en', 'zh', 'ar'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const links = (body) => [...body.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({ text: m[1], href: m[2] }));
const htmlH1s = (html) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
const SHOP = 'https://shop.cnps.ai/products/ticnote-ai-voice-recorder';
const IMG = 'ticnote-card-vs-lite-vs-pods-decision-path.webp';

const title = {
  en: 'TicNote Card vs Lite vs Pods (2026): Which AI Recorder to Buy',
  zh: 'TicNote 卡片 vs Lite vs Pods（2026）：该买哪款 AI 录音器',
  ar: 'بطاقة TicNote أو Lite أو Pods (2026): أي مسجّل ذكي تشتري',
};
const description = {
  en: 'TicNote Card ($139.99, 64GB) vs Lite ($99.99) vs Pods earbuds ($219.99+), checked 6 Nov 2026. Verdict: Card for meetings, Lite on a budget, Pods on the move.',
  zh: 'TicNote 卡片（$139.99，64GB）vs Lite（$99.99）vs Pods 耳机（$219.99 起），价格复核于 2026 年 11 月 6 日。结论：会议室选卡片，预算优先选 Lite，通话与移动中选 Pods。',
  ar: 'بطاقة TicNote ($139.99، 64GB) مقابل Lite ($99.99) مقابل Pods (من $219.99)، رُوجعت 6 نوفمبر 2026. الخلاصة: البطاقة للاجتماعات، وLite للميزانية، وPods للتنقل.',
};
// Live H1s re-fetched 2026-11-06 (Asia/Shanghai) — identical to O10 anchors.
const anchors = {
  en: {
    '/en/products/ticnote': 'TicNote AI Voice Recorder',
    '/en/products/ticnote-lite': 'TicNote Lite',
    '/en/products/ticnote-pods-wifi': 'TicNote Pods WiFi',
    '/en/products/ticnote-pods-4g': 'TicNote Pods 4G',
    '/en/pro-plan': 'A year of extra minutes and features, sold as a bundle on specific SKUs.',
    '/en/resources/meeting-device-pilot': 'Plan an AI meeting device pilot',
    '/en/products/compare': 'TicNote models side by side',
    '/en/request-quote?product=ticnote': 'Request a quotation for devices or a pilot.',
  },
  zh: {
    '/zh/products/ticnote': 'TicNote AI 录音器',
    '/zh/products/ticnote-lite': 'TicNote Lite',
    '/zh/products/ticnote-pods-wifi': 'TicNote Pods WiFi',
    '/zh/products/ticnote-pods-4g': 'TicNote Pods 4G',
    '/zh/pro-plan': '指定产品组合提供一年额外转写时长与功能。',
    '/zh/resources/meeting-device-pilot': '规划 AI 会议设备试点',
    '/zh/products/compare': 'TicNote 型号并排对比',
    '/zh/request-quote?product=ticnote': '为设备或试点索取报价。',
  },
  ar: {
    '/ar/products/ticnote': 'مسجّل الصوت بالذكاء الاصطناعي TicNote',
    '/ar/products/ticnote-lite': 'TicNote Lite',
    '/ar/products/ticnote-pods-wifi': 'TicNote Pods WiFi',
    '/ar/products/ticnote-pods-4g': 'TicNote Pods 4G',
    '/ar/pro-plan': 'سنة من الدقائق والميزات الإضافية ضمن باقات لمنتجات محددة.',
    '/ar/resources/meeting-device-pilot': 'خطط لتجربة أجهزة الاجتماعات بالذكاء الاصطناعي',
    '/ar/products/compare': 'مقارنة طرازات TicNote جنبًا إلى جنب',
    '/ar/request-quote?product=ticnote': 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.',
  },
};
const external = { [SHOP]: 'TicNote AI Voice Recorder' };

test('N02: title (= H1), cover, date and FAQ unchanged', () => {
  assert.equal(post.image, 'ticnote-card-lite-pods');
  assert.equal(post.date, '2026-09-27');
  for (const l of locales) {
    assert.equal(post.locales[l].title, title[l]);
    assert.equal(post.locales[l].faq.length, 5);
    assert.equal((post.locales[l].body.match(/^## /gm) || []).length, 6);
  }
});

test('N02: meta dated 6 Nov 2026, keeps Verdict + prices, ≤160', () => {
  for (const l of locales) {
    const d = post.locales[l].description;
    assert.equal(d, description[l]);
    assert.ok(d.length <= 160, l + ' meta ' + d.length);
  }
  assert.ok(description.en.startsWith('TicNote Card'));
  assert.match(description.en, /Verdict:/);
  assert.match(description.en, /6 Nov 2026/);
  assert.match(description.en, /\$139\.99/);
  assert.match(description.en, /\$99\.99/);
});

test('N02: every body anchor = live H1, each href once, one shop link, re-check 6 Nov', () => {
  for (const l of locales) {
    const body = post.locales[l].body;
    const all = links(body);
    const hrefs = all.map((x) => x.href);
    assert.equal(new Set(hrefs).size, hrefs.length, l + ' duplicate href in body');
    for (const { text, href } of all) {
      const want = anchors[l][href] ?? external[href];
      assert.ok(want, l + ' unexpected link ' + href);
      assert.equal(text, want, l + ' anchor for ' + href);
    }
    for (const href of Object.keys(anchors[l])) assert.ok(hrefs.includes(href), l + ' missing ' + href);
    assert.equal(hrefs.filter((h) => h.includes('shop.cnps.ai')).length, 1, l + ' exactly one shop link');
    assert.ok(hrefs.includes(SHOP));
    assert.doesNotMatch(body, /shop\.cnps\.ai\/blogs\//, l + ' must not link the shop sister article');
  }
  assert.match(post.locales.en.body, /re-checked unchanged on 6 November 2026/);
  assert.match(post.locales.zh.body, /2026 年 11 月 6 日复核未变/);
  assert.match(post.locales.ar.body, /6 نوفمبر 2026/);
});

test('N02: glance intro dated 6 Nov; checks still Form·Card/Lite·WiFi/4G·Pilot', () => {
  const branch = build.slice(build.indexOf("post.slug==='ticnote-card-vs-lite-vs-pods'"));
  const glance = branch.slice(0, branch.indexOf('\n'));
  assert.match(glance, /re-checked 6 November 2026/);
  assert.match(glance, /2026 年 11 月 6 日复核/);
  assert.match(glance, /6 نوفمبر 2026/);
  assert.match(glance, /TicNote Card method glance/);
  assert.match(glance, /'Form'/);
  assert.match(glance, /'Card or Lite'/);
  assert.match(glance, /'WiFi or 4G'/);
  assert.match(glance, /'Pilot'/);
  assert.doesNotMatch(glance, /22 October 2026/);
  assert.doesNotMatch(glance, /\d{2,}\s*%/);
});

test('N02: decision-path asset path + editorial cover still wired', () => {
  assert.match(build, new RegExp(esc(IMG)));
  const f = 'web/assets/resources/' + IMG;
  assert.ok(fs.existsSync(f) && fs.statSync(f).size > 1000);
  for (const size of [640, 1280]) assert.ok(fs.existsSync(`web/assets/editorial/ticnote-card-lite-pods-${size}.webp`));
});

test('N02 built pages: H1 unchanged, new meta, glance date, anchors', () => {
  const file = path.join('dist/en/blogs', slug + '.html');
  if (!fs.existsSync(file)) {
    assert.ok(true, 'no build output');
    return;
  }
  const html = fs.readFileSync(file, 'utf8');
  assert.deepEqual(htmlH1s(html), [title.en]);
  assert.match(html, new RegExp(`<meta name="description" content="${esc(description.en)}">`));
  assert.match(html, /re-checked 6 November 2026/);
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/ticnote-card-lite-pods-1280\.webp">/);
  const g = html.indexOf('<h2 id="method-glance">TicNote Card method glance</h2>');
  const s1 = html.indexOf('<h2 id="section-');
  assert.ok(g > 0 && s1 > g);
  for (const [href, text] of Object.entries(anchors.en)) {
    assert.match(html, new RegExp(`href="${esc(href.replace(/&/g, '&amp;'))}"[^>]*>${esc(text)}</a>`));
  }
});
