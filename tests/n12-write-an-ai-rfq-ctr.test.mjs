import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// N12 (2026-11-20 Asia/Shanghai): first www CTR refresh of
// write-an-ai-rfq-suppliers-can-answer. H1/title/slug/date/cover and
// six ## section titles stay unchanged. New method glance, dated meta,
// body re-check 20 November 2026 (5 September 2026 article date kept),
// live-H1 anchors, no shop News, one money CTA.
const slug = 'write-an-ai-rfq-suppliers-can-answer';
const journal = JSON.parse(fs.readFileSync('content/i18n/blogs.json', 'utf8'));
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const post = journal.posts.find((p) => p.slug === slug);
const locales = ['en', 'zh', 'ar'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const links = (body) => [...body.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({ text: m[1], href: m[2] }));
const htmlH1s = (html) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
const IMG = 'write-an-ai-rfq-suppliers-can-answer-method-glance.webp';
const SHOP_NEWS = 'shop.cnps.ai/blogs/';

const title = {
  en: 'Write an AI RFQ suppliers can actually answer',
  zh: '写一份供应商能够有效回答的 AI 询价单',
  ar: 'اكتب طلب عرض سعر للذكاء الاصطناعي يمكن الإجابة عنه',
};
const description = {
  en: 'AI RFQ method (checked 20 Nov 2026): open with the business task, give a minimum useful brief, separate requirements from preferences, then ask for a comparable response.',
  zh: 'AI 询价方法（2026年11月20日复核）：用业务任务开场，给出最少但有用的需求，区分必要要求与偏好，并要求可比较的供应商回复。',
  ar: 'طريقة طلب عرض سعر للذكاء الاصطناعي (رُوجعت في 20 نوفمبر 2026): افتتح بمهمة العمل، وقدّم الحد الأدنى المفيد، وافصل المتطلبات عن التفضيلات، واطلب ردًا قابلًا للمقارنة.',
};
const headings = {
  en: [
    '## 1. Open with the business task',
    '## 2. Provide the minimum useful brief',
    '## 3. Separate requirements from preferences',
    '## 4. Ask for a comparable response',
    '## 5. Explain how you will decide',
    '## 6. Close with a specific next step',
  ],
  zh: [
    '## 1. 用业务任务开场',
    '## 2. 提供最少但有用的需求',
    '## 3. 区分必要要求与偏好',
    '## 4. 要求供应商提供可比较的回复',
    '## 5. 说明如何做出决定',
    '## 6. 以明确的下一步结束',
  ],
  ar: [
    '## 1. افتتح بمهمة العمل',
    '## 2. قدّم الحد الأدنى المفيد من المتطلبات',
    '## 3. افصل المتطلبات عن التفضيلات',
    '## 4. اطلب ردًا قابلًا للمقارنة',
    '## 5. وضّح كيف ستتخذ القرار',
    '## 6. اختم بخطوة تالية محددة',
  ],
};
// Live H1s fetched 2026-11-20 (Asia/Shanghai).
const anchors = {
  en: {
    '/en/resources/rfq-template': 'A practical B2B request for quotation',
    '/en/request-quote': 'Request a quotation for devices or a pilot.',
  },
  zh: {
    '/zh/resources/rfq-template': '实用 B2B 询价模板',
    '/zh/request-quote': '为设备或试点索取报价。',
  },
  ar: {
    '/ar/resources/rfq-template': 'طلب عملي لعرض سعر بين الشركات',
    '/ar/request-quote': 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.',
  },
};
const glanceTitle = {
  en: 'AI RFQ method glance',
  zh: 'AI 询价方法速览',
  ar: 'لمحة طريقة طلب عرض سعر للذكاء الاصطناعي',
};
const recheck = {
  en: 're-checked on 20 November 2026; the 5 September 2026 article date is unchanged',
  zh: '方法已于 2026 年 11 月 20 日复核；文章日期仍为 2026 年 9 月 5 日，未改',
  ar: 'أُعيد فحص الطريقة في 20 نوفمبر 2026؛ وتاريخ المقالة 5 سبتمبر 2026 دون تغيير',
};

function proseArticle(html) {
  const start = html.search(/<article\b[^>]*class="[^"]*\bprose\b[^"]*\breport-prose\b[^"]*"[^>]*>/i);
  if (start < 0) {
    const i = html.indexOf('<article');
    const j = html.indexOf('</article>', i);
    return i >= 0 && j > i ? html.slice(i, j) : html;
  }
  const openEnd = html.indexOf('>', start) + 1;
  let depth = 1;
  const re = /<article\b[^>]*>|<\/article>/gi;
  re.lastIndex = openEnd;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].toLowerCase().startsWith('</')) {
      depth -= 1;
      if (depth === 0) return html.slice(openEnd, m.index);
    } else {
      depth += 1;
    }
  }
  return html.slice(openEnd);
}

test('N12: title (= H1), cover and date unchanged; six ## kept', () => {
  assert.ok(post);
  assert.equal(post.image, 'rfq-desk');
  assert.equal(post.date, '2026-09-05');
  assert.equal(journal.posts.filter((p) => p.image === 'rfq-desk').length, 1);
  for (const l of locales) {
    assert.equal(post.locales[l].title, title[l]);
    const got = post.locales[l].body.match(/^## .+$/gm) || [];
    assert.deepEqual(got, headings[l]);
  }
});

test('N12: method meta dated 20 Nov 2026; exact approved lengths', () => {
  for (const l of locales) {
    const d = post.locales[l].description;
    assert.equal(d, description[l]);
  }
  assert.equal(description.en.length, 170);
  assert.equal(description.zh.length, 65);
  assert.equal(description.ar.length, 165);
  assert.match(description.en, /checked 20 Nov 2026/);
  assert.match(description.zh, /2026年11月20日复核/);
  assert.match(description.ar, /رُوجعت في 20 نوفمبر 2026/);
  assert.doesNotMatch(description.en, /Prepare a concise request for quotation/);
});

test('N12: every body anchor = live H1 fetched 2026-11-20; each href once; re-check 20 Nov; 5 Sep kept', () => {
  for (const l of locales) {
    const body = post.locales[l].body;
    const all = links(body);
    const hrefs = all.map((x) => x.href);
    assert.equal(new Set(hrefs).size, hrefs.length, l + ' duplicate href in body');
    for (const { text, href } of all) {
      const want = anchors[l][href];
      assert.ok(want, l + ' unexpected link ' + href);
      assert.equal(text, want, l + ' anchor for ' + href);
    }
    for (const href of Object.keys(anchors[l])) assert.ok(hrefs.includes(href), l + ' missing ' + href);
    assert.doesNotMatch(body, /shop\.cnps\.ai\/blogs\//, l + ' must not link shop News');
    assert.equal(hrefs.filter((h) => h.includes('/request-quote')).length, 1, l + ' one money CTA');
    assert.doesNotMatch(body, /\/fastgpt\/contact/, l + ' no /fastgpt\/contact');
    assert.match(body, new RegExp(esc(recheck[l])));
  }
  assert.match(post.locales.en.body, /illustrative example rather than a live order/);
  assert.doesNotMatch(post.locales.en.body, /copyable RFQ template/);
  assert.doesNotMatch(post.locales.zh.body, /可复制的询价模板/);
  assert.doesNotMatch(post.locales.ar.body, /نموذج طلب عرض السعر القابل للنسخ/);
});

test('N12: glance branch — 6 checks, re-check 20 Nov, 5 Sep date unchanged, no invented %', () => {
  const branchStart = build.indexOf("post.slug==='write-an-ai-rfq-suppliers-can-answer'");
  assert.ok(branchStart >= 0);
  const next = build.indexOf('if(post.slug===', branchStart + 1);
  const headingsAt = build.indexOf('\n  const headings=[...html.matchAll', branchStart);
  const end = Math.min(...[next, headingsAt].filter((i) => i >= 0));
  const glance = build.slice(branchStart, end);
  assert.match(glance, /AI RFQ method glance/);
  assert.match(glance, /AI 询价方法速览/);
  assert.match(glance, /لمحة طريقة طلب عرض سعر للذكاء الاصطناعي/);
  assert.match(glance, /re-checked 20 November 2026/);
  assert.match(glance, /5 September 2026 article date is unchanged/);
  assert.match(glance, /2026 年 11 月 20 日复核/);
  assert.match(glance, /2026 年 9 月 5 日，未改/);
  assert.match(glance, /رُوجعت في 20 نوفمبر 2026/);
  assert.match(glance, /5 سبتمبر 2026 دون تغيير/);
  assert.match(glance, /'Business task'/);
  assert.match(glance, /'Minimum brief'/);
  assert.match(glance, /'Requirements vs preferences'/);
  assert.match(glance, /'Comparable response'/);
  assert.match(glance, /'Decision method'/);
  assert.match(glance, /'Specific next step'/);
  assert.match(glance, /write-an-ai-rfq-suppliers-can-answer-method-glance\.webp/);
  assert.match(glance, /width="1600" height="900"/);
  assert.doesNotMatch(glance, /\d{2,}\s*%/);
  assert.doesNotMatch(glance, /shop\.cnps\.ai\/blogs\//);
});

test('N12: method-glance asset on disk; editorial cover kept', () => {
  const f = 'web/assets/resources/' + IMG;
  assert.ok(fs.existsSync(f) && fs.statSync(f).size > 1000, f);
  const cover1280 = 'web/assets/editorial/rfq-desk-1280.webp';
  assert.ok(fs.existsSync(cover1280) && fs.statSync(cover1280).size > 1000, cover1280);
  const cover640 = 'web/assets/editorial/rfq-desk-640.webp';
  if (fs.existsSync(cover640)) {
    assert.ok(fs.statSync(cover640).size > 1000, cover640);
  }
});

test('N12 built pages: H1 unchanged, new meta, glance, live-H1 anchors, no shop News', () => {
  const file = path.join('dist/en/blogs', slug + '.html');
  if (!fs.existsSync(file)) {
    assert.ok(true, 'no build output');
    return;
  }
  for (const l of locales) {
    const f = path.join('dist', l, 'blogs', slug + '.html');
    const html = fs.readFileSync(f, 'utf8');
    assert.deepEqual(htmlH1s(html), [title[l]]);
    assert.match(html, new RegExp(`<meta name="description" content="${esc(description[l])}">`));
    assert.match(html, new RegExp(esc(recheck[l])));
    assert.match(
      html,
      /<meta property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/rfq-desk-1280\.webp">/,
    );
    assert.match(html, /datetime="2026-09-05"/);
    assert.match(html, /"datePublished":"2026-09-05"/);
    assert.match(html, /"dateModified":"2026-09-05"/);
    const g = html.indexOf(`<h2 id="method-glance">${glanceTitle[l]}</h2>`);
    const s1 = html.indexOf('<h2 id="section-');
    assert.ok(g > 0 && s1 > g, l + ' glance renders before the first numbered section');
    assert.match(html, /href="#method-glance"/);
    assert.match(html, /write-an-ai-rfq-suppliers-can-answer-method-glance\.webp/);
    const art = proseArticle(html);
    for (const [href, text] of Object.entries(anchors[l])) {
      assert.match(art, new RegExp(`href="${esc(href)}"[^>]*>${esc(text)}</a>`));
      const n = [...art.matchAll(new RegExp(`href="${esc(href)}"`, 'g'))].length;
      assert.equal(n, 1, l + ' href once ' + href);
    }
    assert.equal((art.match(/\/request-quote/g) || []).length, 1, l + ' one money CTA');
    assert.doesNotMatch(art, /\/fastgpt\/contact/);
    assert.doesNotMatch(art, new RegExp(esc(SHOP_NEWS)));
  }
});
