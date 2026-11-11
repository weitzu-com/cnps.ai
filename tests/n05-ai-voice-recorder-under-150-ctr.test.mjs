import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// N05 (2026-11-11 Asia/Shanghai): first www CTR refresh of
// ai-voice-recorder-under-150-ticnote-lineup. H1/title/slug/date/cover and
// six ## section titles stay unchanged. New method glance, dated meta,
// body re-check 11 November 2026 (prices unchanged), live-H1 anchors,
// N02 sister added once, no shop News near-dupe link.
const slug = 'ai-voice-recorder-under-150-ticnote-lineup';
const journal = JSON.parse(fs.readFileSync('content/i18n/blogs.json', 'utf8'));
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const post = journal.posts.find((p) => p.slug === slug);
const locales = ['en', 'zh', 'ar'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const links = (body) => [...body.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({ text: m[1], href: m[2] }));
const htmlH1s = (html) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
const SHOP_LITE = 'https://shop.cnps.ai/products/ticnote-lite-ai-voice-recorder';
const SHOP_CARD = 'https://shop.cnps.ai/products/ticnote-ai-voice-recorder';
const IMG = 'ticnote-under-150-method-glance.webp';
const SHOP_NEWS = 'shop.cnps.ai/blogs/news/best-ai-voice-recorder-under-150-ticnote-lineup';

const title = {
  en: 'AI voice recorder under $150: the TicNote lineup, mapped',
  zh: '150 美元以内的 AI 录音笔：TicNote 产品线地图',
  ar: 'مسجّل صوت ذكي بأقل من 150 دولاراً: خريطة مجموعة TicNote',
};
const description = {
  en: 'Under-$150 TicNote method: fix the $150 line, see what lists, Card vs Lite in-band, when Pods is a step-up, then prove with one unit. Checked 11 Nov 2026.',
  zh: '150 美元以内 TicNote 方法：先定预算线，看哪些列表价低于 150 美元，价位内选卡片还是 Lite，何时升级 Pods，再用一台验证。复核于 2026 年 11 月 11 日。',
  ar: 'طريقة TicNote بأقل من 150 دولاراً: ثبّت الخط، ما يُدرج، البطاقة أو Lite، ومتى تكون Pods خطوة أعلى، ثم أثبت بوحدة واحدة. رُوجعت 11 نوفمبر 2026.',
};
// Live H1s fetched 2026-11-11 (Asia/Shanghai).
const anchors = {
  en: {
    '/en/products/ticnote': 'TicNote AI Voice Recorder',
    '/en/products/ticnote-lite': 'TicNote Lite',
    '/en/products/ticnote-pods-wifi': 'TicNote Pods WiFi',
    '/en/products/ticnote-pods-4g': 'TicNote Pods 4G',
    '/en/pro-plan': 'A year of extra minutes and features, sold as a bundle on specific SKUs.',
    '/en/shipping': 'Ships internationally from China',
    '/en/returns': 'Refunds and cancellations',
    '/en/resources/meeting-device-pilot': 'Plan an AI meeting device pilot',
    '/en/blogs/ticnote-card-vs-lite-vs-pods': 'TicNote Card vs Lite vs Pods (2026): Which AI Recorder to Buy',
    '/en/request-quote?product=ticnote-lite': 'Request a quotation for devices or a pilot.',
  },
  zh: {
    '/zh/products/ticnote': 'TicNote AI 录音器',
    '/zh/products/ticnote-lite': 'TicNote Lite',
    '/zh/products/ticnote-pods-wifi': 'TicNote Pods WiFi',
    '/zh/products/ticnote-pods-4g': 'TicNote Pods 4G',
    '/zh/pro-plan': '指定产品组合提供一年额外转写时长与功能。',
    '/zh/shipping': '从中国发往国际目的地',
    '/zh/returns': '退款与取消',
    '/zh/resources/meeting-device-pilot': '规划 AI 会议设备试点',
    '/zh/blogs/ticnote-card-vs-lite-vs-pods': 'TicNote 卡片 vs Lite vs Pods（2026）：该买哪款 AI 录音器',
    '/zh/request-quote?product=ticnote-lite': '为设备或试点索取报价。',
  },
  ar: {
    '/ar/products/ticnote': 'مسجّل الصوت بالذكاء الاصطناعي TicNote',
    '/ar/products/ticnote-lite': 'TicNote Lite',
    '/ar/products/ticnote-pods-wifi': 'TicNote Pods WiFi',
    '/ar/products/ticnote-pods-4g': 'TicNote Pods 4G',
    '/ar/pro-plan': 'سنة من الدقائق والميزات الإضافية ضمن باقات لمنتجات محددة.',
    '/ar/shipping': 'شحن دولي من الصين',
    '/ar/returns': 'الاسترداد والإلغاء',
    '/ar/resources/meeting-device-pilot': 'خطط لتجربة أجهزة الاجتماعات بالذكاء الاصطناعي',
    '/ar/blogs/ticnote-card-vs-lite-vs-pods': 'بطاقة TicNote أو Lite أو Pods (2026): أي مسجّل ذكي تشتري',
    '/ar/request-quote?product=ticnote-lite': 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.',
  },
};
const external = {
  [SHOP_LITE]: 'TicNote Lite AI Voice Recorder',
  [SHOP_CARD]: 'TicNote AI Voice Recorder',
};

test('N05: title (= H1), cover and date unchanged; six ## kept', () => {
  assert.equal(post.image, 'ticnote-budget-lineup');
  assert.equal(post.date, '2026-09-27');
  for (const l of locales) {
    assert.equal(post.locales[l].title, title[l]);
    assert.equal((post.locales[l].body.match(/^## /gm) || []).length, 6);
  }
  assert.match(post.locales.en.body, /^## 1\. Fix the budget line before the shortlist/m);
  assert.match(post.locales.en.body, /^## 2\. What lists under \$150/m);
  assert.match(post.locales.en.body, /^## 3\. Card or Lite inside the band/m);
  assert.match(post.locales.en.body, /^## 4\. When the step up to Pods is justified/m);
  assert.match(post.locales.en.body, /^## 5\. Plans, minutes and refunds/m);
  assert.match(post.locales.en.body, /^## 6\. Prove the choice with one unit/m);
});

test('N05: method meta dated 11 Nov 2026, ≤160, no Buy wording', () => {
  for (const l of locales) {
    const d = post.locales[l].description;
    assert.equal(d, description[l]);
    assert.ok(d.length <= 160, l + ' meta ' + d.length);
    assert.doesNotMatch(d, /\bbuy(ing|er|ers)?\b/i);
  }
  assert.equal(description.en.length, 154);
  assert.match(description.en, /Checked 11 Nov 2026/);
  assert.match(description.en, /Under-\$150 TicNote method/);
  assert.doesNotMatch(description.en, /as of September|Sep 2026/);
});

test('N05: every body anchor = live H1 fetched 2026-11-11; each href once; re-check 11 Nov', () => {
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
    assert.ok(hrefs.includes(SHOP_LITE), l + ' missing shop Lite');
    assert.ok(hrefs.includes(SHOP_CARD), l + ' missing shop Card');
    assert.equal(hrefs.filter((h) => h.includes('shop.cnps.ai')).length, 2, l + ' exactly two shop PDP links');
    assert.doesNotMatch(body, /shop\.cnps\.ai\/blogs\//, l + ' must not link the shop News near-dupe');
    assert.equal(hrefs.filter((h) => h.includes('/request-quote')).length, 1, l + ' one money CTA');
  }
  assert.match(post.locales.en.body, /re-checked 11 November 2026, prices unchanged/);
  assert.doesNotMatch(post.locales.en.body, /as read in September 2026\./);
  assert.match(post.locales.zh.body, /并于 2026 年 11 月 11 日复核未变/);
  assert.doesNotMatch(post.locales.zh.body, /以上是 2026 年 9 月读取时低于该线/);
  assert.match(post.locales.ar.body, /رُوجعت دون تغيير في 11 نوفمبر 2026/);
  assert.match(post.locales.en.body, /\$99\.99/);
  assert.match(post.locales.en.body, /\$139\.99/);
  assert.match(post.locales.en.body, /\$219\.99/);
  assert.match(post.locales.en.body, /\$239\.99/);
});

test('N05: glance branch — 5 checks, re-check 11 Nov, no invented %', () => {
  const branchStart = build.indexOf("post.slug==='ai-voice-recorder-under-150-ticnote-lineup'");
  assert.ok(branchStart >= 0);
  const glance = build.slice(branchStart, build.indexOf('\n', branchStart));
  assert.match(glance, /TicNote under \$150 method glance/);
  assert.match(glance, /150 美元以内选型方法速览/);
  assert.match(glance, /لمحة طريقة الاختيار بأقل من 150 دولاراً/);
  assert.match(glance, /re-checked 11 November 2026, prices unchanged/);
  assert.match(glance, /2026 年 11 月 11 日复核，价格未变/);
  assert.match(glance, /رُوجعت في 11 نوفمبر 2026، والأسعار دون تغيير/);
  assert.match(glance, /'Budget line'/);
  assert.match(glance, /'What lists'/);
  assert.match(glance, /'Card or Lite'/);
  assert.match(glance, /'Pods step-up'/);
  assert.match(glance, /'Prove \/ refunds'/);
  assert.match(glance, /ticnote-under-150-method-glance\.webp/);
  assert.doesNotMatch(glance, /\d{2,}\s*%/);
  assert.doesNotMatch(glance, /shop\.cnps\.ai\/blogs\/news\/best-ai-voice-recorder-under-150/);
});

test('N05: method-glance asset on disk; editorial cover kept', () => {
  const f = 'web/assets/resources/' + IMG;
  assert.ok(fs.existsSync(f) && fs.statSync(f).size > 1000, f);
  for (const size of [640, 1280]) {
    const cover = `web/assets/editorial/ticnote-budget-lineup-${size}.webp`;
    assert.ok(fs.existsSync(cover) && fs.statSync(cover).size > 1000, cover);
  }
});

test('N05 built pages: H1 unchanged, new meta, glance, live-H1 anchors, no shop News', () => {
  const file = path.join('dist/en/blogs', slug + '.html');
  if (!fs.existsSync(file)) {
    assert.ok(true, 'no build output');
    return;
  }
  const html = fs.readFileSync(file, 'utf8');
  assert.deepEqual(htmlH1s(html), [title.en]);
  assert.match(html, new RegExp(`<meta name="description" content="${esc(description.en)}">`));
  assert.match(html, /re-checked 11 November 2026, prices unchanged/);
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/ticnote-budget-lineup-1280\.webp">/);
  const g = html.indexOf('<h2 id="method-glance">TicNote under $150 method glance</h2>');
  const s1 = html.indexOf('<h2 id="section-');
  assert.ok(g > 0 && s1 > g, 'glance renders before the first numbered section');
  assert.match(html, /href="#method-glance"/);
  assert.match(html, /ticnote-under-150-method-glance\.webp/);
  const artStart = html.indexOf('<article');
  const artEnd = html.indexOf('</article>', artStart);
  const art = html.slice(artStart, artEnd);
  for (const [href, text] of Object.entries(anchors.en)) {
    assert.match(art, new RegExp(`href="${esc(href)}"[^>]*>${esc(text)}</a>`));
    const n = [...art.matchAll(new RegExp(`href="${esc(href)}"`, 'g'))].length;
    assert.equal(n, 1, 'href once ' + href);
  }
  assert.doesNotMatch(art, new RegExp(esc(SHOP_NEWS)));
  for (const l of ['zh', 'ar']) {
    const f = path.join('dist', l, 'blogs', slug + '.html');
    const h = fs.readFileSync(f, 'utf8');
    assert.match(h, new RegExp(`<meta name="description" content="${esc(description[l])}">`));
    assert.match(h, /id="method-glance"/);
  }
});
