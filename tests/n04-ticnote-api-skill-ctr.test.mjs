import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// N04 (2026-11-10 Asia/Shanghai): second CTR refresh after O08 — body re-check
// 20 October 2026 → 10 November 2026 (EN/ZH/AR). H1/title/slug/date/cover, O08
// meta (no calendar date in SERP), six ## sections, Evaluation method glance,
// live-H1 sister anchors, and method-glance path stay unchanged.
const slug = 'ticnote-api-skill-claude-chatgpt-gemini';
const journal = JSON.parse(fs.readFileSync('content/i18n/blogs.json', 'utf8'));
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const post = journal.posts.find((p) => p.slug === slug);
const locales = ['en', 'zh', 'ar'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const links = (body) => [...body.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({ text: m[1], href: m[2] }));
const htmlH1s = (html) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
const shopApi = 'https://shop.cnps.ai/blogs/news/how-to-use-ticnote-api-with-claude-chatgpt-gemini';

const title = {
  en: 'Use the TicNote API with Claude, ChatGPT or Gemini',
  zh: '在 Claude、ChatGPT 或 Gemini 中使用 TicNote API',
  ar: 'استخدام TicNote API مع Claude أو ChatGPT أو Gemini',
};
const description = {
  en: 'TicNote API Skill with Claude, ChatGPT or Gemini: what the page states and omits, how to guard the Key, and six pilot tests to run before choosing hardware.',
  zh: 'TicNote API Skill 接入 Claude、ChatGPT 或 Gemini：页面写了什么、没写什么、Key 如何管理，以及选硬件前先跑的六项试点测试。',
  ar: 'TicNote API Skill مع Claude أو ChatGPT أو Gemini: ما تذكره الصفحة وما تغفله، وكيف تحمي المفتاح، وستة اختبارات تجريبية قبل اختيار الجهاز.',
};
// Live H1s re-fetched 2026-11-10 (Asia/Shanghai) — identical to O08 anchors.
const anchors = {
  en: {
    '/en/products/ticnote': 'TicNote AI Voice Recorder',
    '/en/products/ticnote-lite': 'TicNote Lite',
    '/en/products/ticnote-pods-wifi': 'TicNote Pods WiFi',
    '/en/pro-plan': 'A year of extra minutes and features, sold as a bundle on specific SKUs.',
    '/en/blogs/meeting-ai-measure-the-finished-note': 'Meeting AI: measure the finished note',
    '/en/resources/knowledge-pilot': 'Scope a document-grounded AI assistant',
    '/en/request-quote?product=ticnote': 'Request a quotation for devices or a pilot.',
  },
  zh: {
    '/zh/products/ticnote': 'TicNote AI 录音器',
    '/zh/products/ticnote-lite': 'TicNote Lite',
    '/zh/products/ticnote-pods-wifi': 'TicNote Pods WiFi',
    '/zh/pro-plan': '指定产品组合提供一年额外转写时长与功能。',
    '/zh/blogs/meeting-ai-measure-the-finished-note': '会议 AI：衡量最终可用的纪要',
    '/zh/resources/knowledge-pilot': '定义基于文档的 AI 助手',
    '/zh/request-quote?product=ticnote': '为设备或试点索取报价。',
  },
  ar: {
    '/ar/products/ticnote': 'مسجّل الصوت بالذكاء الاصطناعي TicNote',
    '/ar/products/ticnote-lite': 'TicNote Lite',
    '/ar/products/ticnote-pods-wifi': 'TicNote Pods WiFi',
    '/ar/pro-plan': 'سنة من الدقائق والميزات الإضافية ضمن باقات لمنتجات محددة.',
    '/ar/blogs/meeting-ai-measure-the-finished-note': 'ذكاء الاجتماعات: قِس المحضر الجاهز للاستخدام',
    '/ar/resources/knowledge-pilot': 'حدد نطاق مساعد ذكاء اصطناعي يستند إلى المستندات',
    '/ar/request-quote?product=ticnote': 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.',
  },
};
const external = {
  'https://ticnote.com/en/skill': 'TicNote API Skill',
  [shopApi]: 'How to use TicNote API with Claude, ChatGPT, and Gemini',
  'https://shop.cnps.ai/products/ticnote-ai-voice-recorder': 'TicNote AI Voice Recorder',
};

test('N04: title (= H1), cover and date unchanged', () => {
  assert.equal(post.image, 'ticnote-api-assistants');
  assert.equal(post.date, '2026-09-27');
  for (const l of locales) {
    assert.equal(post.locales[l].title, title[l]);
    assert.equal((post.locales[l].body.match(/^## /gm) || []).length, 6);
  }
});

test('N04: O08 method-led meta kept (no calendar date, ≤160, no buy wording)', () => {
  for (const l of locales) {
    const d = post.locales[l].description;
    assert.equal(d, description[l]);
    assert.ok(d.length <= 160, l + ' meta ' + d.length);
    assert.doesNotMatch(d, /\bbuy(ing|er|ers)?\b/i);
    assert.doesNotMatch(d, /Nov 2026|November 2026|as of Nov|11 月|نوفمبر 2026/);
  }
  assert.match(description.en, /six pilot tests/);
  assert.ok(description.en.startsWith('TicNote API Skill'));
});

test('N04: every body anchor = live H1 re-fetched 2026-11-10; each href once; re-check 10 Nov', () => {
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
    assert.ok(hrefs.includes(shopApi), l + ' missing shop install sister');
    assert.equal(hrefs.filter((h) => h.includes('shop.cnps.ai/blogs/')).length, 1, l + ' shop News once');
    assert.equal(hrefs.filter((h) => h.includes('/request-quote')).length, 1, l + ' one money CTA');
  }
  assert.match(post.locales.en.body, /re-checked on 10 November 2026/);
  assert.doesNotMatch(post.locales.en.body, /re-checked on 20 October 2026/);
  assert.match(post.locales.zh.body, /并于 2026 年 11 月 10 日复核/);
  assert.doesNotMatch(post.locales.zh.body, /并于 2026 年 10 月 20 日复核/);
  assert.match(post.locales.ar.body, /وأُعيد التحقق منها في 10 نوفمبر 2026/);
  assert.doesNotMatch(post.locales.ar.body, /وأُعيد التحقق منها في 20 أكتوبر 2026/);
  assert.match(post.locales.en.body, /the only named walkthrough is for Codex/);
  assert.match(post.locales.en.body, /four steps/);
  assert.match(post.locales.en.body, /Professional or Business plan/);
});

test('N04: glance unchanged (Evaluation method glance; Plan·Install·Key·Pilot; no date)', () => {
  const branchStart = build.indexOf("post.slug==='ticnote-api-skill-claude-chatgpt-gemini'");
  assert.ok(branchStart >= 0);
  const glance = build.slice(branchStart, build.indexOf('\n', branchStart));
  assert.match(glance, /Evaluation method glance/);
  assert.match(glance, /ticnote-api-skill-method-glance\.webp/);
  assert.match(glance, /'Plan'/);
  assert.match(glance, /'Install'/);
  assert.match(glance, /'Key'/);
  assert.match(glance, /'Pilot'/);
  assert.doesNotMatch(glance, /October 2026|November 2026|20 October|10 November/);
  assert.doesNotMatch(glance, /\d{2,}\s*%/);
});

test('N04: method-glance asset path + editorial cover still on disk', () => {
  const f = 'web/assets/resources/ticnote-api-skill-method-glance.webp';
  assert.ok(fs.existsSync(f) && fs.statSync(f).size > 1000, f);
  for (const size of [640, 1280]) {
    const cover = `web/assets/editorial/ticnote-api-assistants-${size}.webp`;
    assert.ok(fs.existsSync(cover) && fs.statSync(cover).size > 1000, cover);
  }
});

test('N04 built EN page: H1 unchanged, kept meta, new re-check date, editorial og, glance', () => {
  const file = path.join('dist/en/blogs', slug + '.html');
  if (!fs.existsSync(file)) {
    assert.ok(true, 'no build output');
    return;
  }
  const html = fs.readFileSync(file, 'utf8');
  assert.deepEqual(htmlH1s(html), [title.en]);
  assert.match(html, new RegExp(`<meta name="description" content="${esc(description.en)}">`));
  assert.doesNotMatch(html, /<meta name="description" content="[^"]*(Nov 2026|November 2026)/);
  assert.match(html, /re-checked on 10 November 2026/);
  assert.doesNotMatch(html, /re-checked on 20 October 2026/);
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/ticnote-api-assistants-1280\.webp">/);
  const g = html.indexOf('<h2 id="method-glance">Evaluation method glance</h2>');
  const s1 = html.indexOf('<h2 id="section-');
  assert.ok(g > 0 && s1 > g, 'glance renders before the first numbered section');
  assert.match(html, /href="#method-glance"/);
  assert.match(html, /ticnote-api-skill-method-glance\.webp/);
  for (const [href, text] of Object.entries(anchors.en)) {
    assert.match(html, new RegExp(`href="${esc(href)}"[^>]*>${esc(text)}</a>`));
  }
  assert.match(html, new RegExp(`href="${esc(shopApi)}"[^>]*>${esc(external[shopApi])}</a>`));
  for (const l of ['zh', 'ar']) {
    const f = path.join('dist', l, 'blogs', slug + '.html');
    const h = fs.readFileSync(f, 'utf8');
    assert.match(h, new RegExp(`<meta name="description" content="${esc(description[l])}">`));
    assert.match(h, /id="method-glance"/);
  }
});
