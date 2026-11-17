import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// N09 (2026-11-17 Asia/Shanghai): first www CTR refresh of
// knowledge-ai-pilot-that-earns-trust. H1/title/slug/date/cover and
// six ## section titles stay unchanged. New method glance, dated meta,
// body re-check 17 November 2026 (5 September 2026 article date kept),
// live-H1 anchors, no shop News, one money CTA.
const slug = 'knowledge-ai-pilot-that-earns-trust';
const journal = JSON.parse(fs.readFileSync('content/i18n/blogs.json', 'utf8'));
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const post = journal.posts.find((p) => p.slug === slug);
const locales = ['en', 'zh', 'ar'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const links = (body) => [...body.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({ text: m[1], href: m[2] }));
const htmlH1s = (html) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
const IMG = 'knowledge-ai-pilot-method-glance.webp';
const SHOP_NEWS = 'shop.cnps.ai/blogs/';

const title = {
  en: 'A knowledge AI pilot that earns trust',
  zh: '让企业知识库 AI 试点值得信任',
  ar: 'تجربة لمساعد المعرفة تستحق الثقة',
};
const description = {
  en: 'Knowledge AI pilot method (checked 17 Nov 2026): one decision, accountable sources, hard questions, whole-job measure, then a buying record.',
  zh: '知识助手试点方法（2026年11月17日复核）：先定一项决策，建立可追责资料，测试困难问题，衡量完整工作，再留下负责人和采购记录。',
  ar: 'طريقة تجربة مساعد المعرفة (رُوجعت في 17 نوفمبر 2026): قرار واحد، مصادر ذات مسؤولية، أسئلة صعبة، قياس المهمة كاملة، ثم سجل شراء مع تسمية المسؤولين.',
};
const headings = {
  en: [
    '## 1. Choose one decision worth improving',
    '## 2. Give the assistant an accountable source collection',
    '## 3. Test the answers you do not want to hear',
    '## 4. Measure the whole job',
    '## 5. Name the people behind the system',
    '## 6. Turn the pilot into a buying decision',
  ],
  zh: [
    '## 1. 选择一项值得改善的业务决策',
    '## 2. 为资料集合建立责任机制',
    '## 3. 测试那些不容易回答的问题',
    '## 4. 衡量完整工作，而非只有回答速度',
    '## 5. 明确系统背后的负责人',
    '## 6. 把试点结果转化为采购决策',
  ],
  ar: [
    '## 1. اختر قرارًا واحدًا يستحق التحسين',
    '## 2. أنشئ مجموعة مصادر ذات مسؤولية واضحة',
    '## 3. اختبر الأسئلة التي يصعب الإجابة عنها',
    '## 4. قِس المهمة كاملة',
    '## 5. حدّد الأشخاص المسؤولين عن النظام',
    '## 6. حوّل التجربة إلى قرار شراء',
  ],
};
// Live H1s fetched 2026-11-17 (Asia/Shanghai).
const anchors = {
  en: {
    '/en/resources/knowledge-pilot': 'Scope a document-grounded AI assistant',
    '/en/fastgpt/guides/uae-first-pilot-documents-and-workflow':
      'Pick documents and one workflow for a UAE FastGPT first pilot',
    '/en/request-quote?solution=knowledge-assistants': 'Request a quotation for devices or a pilot.',
  },
  zh: {
    '/zh/resources/knowledge-pilot': '定义基于文档的 AI 助手',
    '/en/fastgpt/guides/uae-first-pilot-documents-and-workflow':
      'Pick documents and one workflow for a UAE FastGPT first pilot',
    '/zh/request-quote?solution=knowledge-assistants': '为设备或试点索取报价。',
  },
  ar: {
    '/ar/resources/knowledge-pilot': 'حدد نطاق مساعد ذكاء اصطناعي يستند إلى المستندات',
    '/ar/fastgpt/guides/uae-first-pilot-documents-and-workflow':
      'اختر المستندات وسير عمل واحداً لتجربة FastGPT أولى في الإمارات',
    '/ar/request-quote?solution=knowledge-assistants': 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.',
  },
};
const glanceTitle = {
  en: 'Knowledge AI pilot method glance',
  zh: '知识助手试点方法速览',
  ar: 'لمحة طريقة تجربة مساعد المعرفة',
};
const recheck = {
  en: 're-checked on 17 November 2026; the 5 September 2026 article date is unchanged',
  zh: '方法已于 2026 年 11 月 17 日复核；文章日期仍为 2026 年 9 月 5 日，未改',
  ar: 'أُعيد فحص الطريقة في 17 نوفمبر 2026؛ وتاريخ المقالة 5 سبتمبر 2026 دون تغيير',
};

test('N09: title (= H1), cover and date unchanged; six ## kept', () => {
  assert.ok(post);
  assert.equal(post.image, 'knowledge');
  assert.equal(post.date, '2026-09-05');
  assert.equal(journal.posts.filter((p) => p.image === 'knowledge').length, 1);
  for (const l of locales) {
    assert.equal(post.locales[l].title, title[l]);
    const got = (post.locales[l].body.match(/^## .+$/gm) || []);
    assert.deepEqual(got, headings[l]);
  }
});

test('N09: method meta dated 17 Nov 2026; exact approved lengths', () => {
  for (const l of locales) {
    const d = post.locales[l].description;
    assert.equal(d, description[l]);
  }
  assert.equal(description.en.length, 140);
  assert.equal(description.zh.length, 65);
  assert.equal(description.ar.length, 146);
  assert.match(description.en, /checked 17 Nov 2026/);
  assert.match(description.zh, /2026年11月17日复核/);
  assert.match(description.ar, /رُوجعت في 17 نوفمبر 2026/);
  assert.doesNotMatch(description.en, /Build a useful enterprise knowledge pilot/);
});

test('N09: every body anchor = live H1 fetched 2026-11-17; each href once; re-check 17 Nov; 5 Sep kept', () => {
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
    assert.doesNotMatch(body, /\/fastgpt\/contact/, l + ' no /fastgpt/contact');
    assert.match(body, new RegExp(esc(recheck[l])));
  }
  assert.match(post.locales.en.body, /illustrative, not a report of a CNPS customer deployment/);
  assert.doesNotMatch(post.locales.en.body, /knowledge pilot worksheet/);
  assert.doesNotMatch(post.locales.zh.body, /知识助手试点清单/);
  assert.doesNotMatch(post.locales.ar.body, /ورقة إعداد تجربة مساعد المعرفة/);
  assert.match(post.locales.en.body, /\| Test \| What the reviewer checks \|/);
});

test('N09: glance branch — 5 checks, re-check 17 Nov, 5 Sep date unchanged, no invented %', () => {
  const branchStart = build.indexOf("post.slug==='knowledge-ai-pilot-that-earns-trust'");
  assert.ok(branchStart >= 0);
  const next = build.indexOf("if(post.slug===", branchStart + 1);
  const headingsAt = build.indexOf('\n  const headings=[...html.matchAll', branchStart);
  const end = Math.min(...[next, headingsAt].filter((i) => i >= 0));
  const glance = build.slice(branchStart, end);
  assert.match(glance, /Knowledge AI pilot method glance/);
  assert.match(glance, /知识助手试点方法速览/);
  assert.match(glance, /لمحة طريقة تجربة مساعد المعرفة/);
  assert.match(glance, /re-checked 17 November 2026/);
  assert.match(glance, /5 September 2026 article date is unchanged/);
  assert.match(glance, /2026 年 11 月 17 日复核/);
  assert.match(glance, /2026 年 9 月 5 日，未改/);
  assert.match(glance, /رُوجعت في 17 نوفمبر 2026/);
  assert.match(glance, /5 سبتمبر 2026 دون تغيير/);
  assert.match(glance, /'One decision'/);
  assert.match(glance, /'Accountable sources'/);
  assert.match(glance, /'Hard questions'/);
  assert.match(glance, /'Whole-job measure'/);
  assert.match(glance, /'Named owners \/ buying record'/);
  assert.match(glance, /knowledge-ai-pilot-method-glance\.webp/);
  assert.match(glance, /width="1600" height="900"/);
  assert.doesNotMatch(glance, /\d{2,}\s*%/);
  assert.doesNotMatch(glance, /shop\.cnps\.ai\/blogs\//);
});

test('N09: method-glance asset on disk; editorial cover kept', () => {
  const f = 'web/assets/resources/' + IMG;
  assert.ok(fs.existsSync(f) && fs.statSync(f).size > 1000, f);
  const cover1280 = 'web/assets/editorial/knowledge-1280.webp';
  assert.ok(fs.existsSync(cover1280) && fs.statSync(cover1280).size > 1000, cover1280);
  const cover640 = 'web/assets/editorial/knowledge-640.webp';
  if (fs.existsSync(cover640)) {
    assert.ok(fs.statSync(cover640).size > 1000, cover640);
  }
});

test('N09 built pages: H1 unchanged, new meta, glance, live-H1 anchors, no shop News', () => {
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
      /<meta property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/knowledge-1280\.webp">/,
    );
    assert.match(html, /datetime="2026-09-05"/);
    assert.match(html, /"datePublished":"2026-09-05"/);
    assert.match(html, /"dateModified":"2026-09-05"/);
    const g = html.indexOf(`<h2 id="method-glance">${glanceTitle[l]}</h2>`);
    const s1 = html.indexOf('<h2 id="section-');
    assert.ok(g > 0 && s1 > g, l + ' glance renders before the first numbered section');
    assert.match(html, /href="#method-glance"/);
    assert.match(html, /knowledge-ai-pilot-method-glance\.webp/);
    const artStart = html.indexOf('<article');
    const artEnd = html.indexOf('</article>', artStart);
    const art = html.slice(artStart, artEnd);
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
