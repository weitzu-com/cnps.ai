import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// N13 (2026-11-23 Asia/Shanghai): first www CTR refresh of
// /fastgpt/cases/governed-knowledge. H1/title/path and the four section
// H2s stay unchanged. New method glance, editorial cover, dated meta,
// 23 November 2026 body re-check (September 3, 2026 review wording kept),
// live-H1 anchors, one money CTA, no /request-quote in the article body.
const pagePath = '/fastgpt/cases/governed-knowledge';
const coverKey = 'governed-knowledge';
const pages = JSON.parse(fs.readFileSync('content/i18n/fastgpt-pages.json', 'utf8'));
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const rec = pages.find((x) => x.path === pagePath);
const locales = ['en', 'zh', 'ar'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const links = (body) => [...body.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({ text: m[1], href: m[2] }));
const htmlH1s = (html) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
const IMG = 'governed-knowledge-method-glance.webp';
const SHOP_NEWS = 'shop.cnps.ai/blogs/';
const SOURCE = 'https://solutions.fastgpt.cn/customers/construction-engineering-renovation/text-sql-institution-agent';

const title = {
  en: 'Make internal knowledge easier to find within access rules',
  zh: '在访问规则内更便捷地查找内部知识',
  ar: 'تسهيل العثور على المعرفة الداخلية ضمن قواعد الوصول',
};
const description = {
  en: 'Governed knowledge method (checked 23 Nov 2026): two test roles, a limited document set, access before retrieval; then measure denials, citations and auditability.',
  zh: '权限内知识方法（2026年11月23日复核）：先用两个测试角色和有限文档集，检索前执行访问控制，并衡量授权检索、拒绝、引用与可审计性。',
  ar: 'طريقة المعرفة الخاضعة للحوكمة (رُوجعت في 23 نوفمبر 2026): ابدأ بدورين للاختبار ومجموعة مستندات محدودة، وطبّق الوصول قبل الاسترجاع، وقِس الرفض والاستشهاد وقابلية التدقيق.',
};
const headings = {
  en: [
    '## The published reference',
    '## Reference pattern',
    '## CNPS pilot concept',
    '## Discuss your workflow',
  ],
  zh: [
    '## 已发布的案例参考',
    '## 参考模式',
    '## CNPS 试点构想',
    '## 讨论您的工作流程',
  ],
  ar: [
    '## المرجع المنشور',
    '## النمط المرجعي',
    '## تصور تجربة من CNPS',
    '## ناقش سير عملك',
  ],
};
// Live H1s fetched 2026-11-23 (Asia/Shanghai). Markdown hrefs are unprefixed.
const anchors = {
  en: {
    '/fastgpt/solutions/technical-knowledge': 'Find answers in technical documents.',
    '/fastgpt/contact?case=governed-knowledge': 'Plan a FastGPT knowledge-base pilot.',
  },
  zh: {
    '/fastgpt/solutions/technical-knowledge': '从技术文档中找到答案。',
    '/fastgpt/contact?case=governed-knowledge': '规划一次 FastGPT 知识库试点。',
  },
  ar: {
    '/fastgpt/solutions/technical-knowledge': 'اعثر على الإجابات في المستندات التقنية.',
    '/fastgpt/contact?case=governed-knowledge': 'خطّط لتجربة قاعدة معرفة FastGPT.',
  },
};
const glanceTitle = {
  en: 'Governed knowledge method glance',
  zh: '权限内知识方法速览',
  ar: 'لمحة طريقة المعرفة الخاضعة للحوكمة',
};
const recheck = {
  en: 'Re-checked 23 November 2026: the published reference is still a governance requirement, not a CNPS security certification or a CNPS-delivered customer project. Reported results have not been independently audited. The evaluation method below is unchanged.',
  zh: '2026年11月23日复核：该参考仍只说明治理要求，并不构成 CNPS 安全认证，也不是由 CNPS 交付的客户项目。所报告结果仍未经独立审计。以下评估方法未改。',
  ar: 'أُعيدت المراجعة في 23 نوفمبر 2026: ما زال هذا المرجع يوضح متطلباً للحوكمة، وليس شهادة أمنية لـCNPS ولا مشروع عميل نفذته CNPS. ما زالت النتائج المعلنة دون تدقيق مستقل. طريقة التقييم أدناه دون تغيير.',
};
const reviewKept = {
  en: 'Reviewed September 3, 2026',
  zh: '来源复核日期：2026年9月3日',
  ar: 'رُوجعت المصادر في 3 سبتمبر 2026',
};
const firstSection = {
  en: 'The published reference',
  zh: '已发布的案例参考',
  ar: 'المرجع المنشور',
};

function proseArticle(html) {
  // This FastGPT case page is article.prose, not report-prose. Still use a
  // nested-balanced extract so catalog-card chrome is not swallowed.
  const start = html.search(/<article\b[^>]*class="[^"]*\bprose\b[^"]*"[^>]*>/i);
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

test('N13: title (= H1) and path unchanged; four ## kept', () => {
  assert.ok(rec);
  assert.equal(rec.path, pagePath);
  for (const l of locales) {
    assert.equal(rec.title[l], title[l]);
    const got = rec.body[l].match(/^## .+$/gm) || [];
    assert.deepEqual(got, headings[l]);
  }
});

test('N13: method meta dated 23 Nov 2026; exact approved lengths 163/67/169', () => {
  for (const l of locales) {
    const d = rec.description[l];
    assert.equal(d, description[l]);
  }
  assert.equal(description.en.length, 163);
  assert.equal(description.zh.length, 67);
  assert.equal(description.ar.length, 169);
  assert.match(description.en, /checked 23 Nov 2026/);
  assert.match(description.zh, /2026年11月23日复核/);
  assert.match(description.ar, /رُوجعت في 23 نوفمبر 2026/);
  assert.doesNotMatch(description.en, /FastGPT describes policy-document retrieval/);
});

test('N13: every listed CNPS anchor = live H1; each href once; one money CTA; no request-quote; re-check 23 Nov; Sept 3 kept', () => {
  for (const l of locales) {
    const body = rec.body[l];
    const all = links(body);
    const hrefs = all.map((x) => x.href);
    const internal = all.filter((x) => x.href.startsWith('/'));
    assert.equal(new Set(internal.map((x) => x.href)).size, internal.length, l + ' duplicate internal href in body');
    for (const { text, href } of internal) {
      const want = anchors[l][href];
      assert.ok(want, l + ' unexpected internal link ' + href);
      assert.equal(text, want, l + ' anchor for ' + href);
    }
    for (const href of Object.keys(anchors[l])) assert.ok(hrefs.includes(href), l + ' missing ' + href);
    assert.equal(hrefs.filter((h) => h.includes('?case=governed-knowledge')).length, 1, l + ' one money CTA');
    assert.doesNotMatch(body, /\/request-quote/, l + ' no /request-quote in article body');
    assert.doesNotMatch(body, /shop\.cnps\.ai\/blogs\//, l + ' must not link shop News');
    assert.match(body, new RegExp(esc(recheck[l])));
    assert.match(body, new RegExp(esc(reviewKept[l])));
    assert.ok(hrefs.includes(SOURCE), l + ' keep FastGPT Chinese source link');
  }
  const enWords = rec.body.en.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
  assert.ok(enWords.length >= 200 && enWords.length <= 350, 'EN body words ' + enWords.length);
  assert.doesNotMatch(rec.body.en, /Explore this pilot approach/);
  assert.doesNotMatch(rec.body.zh, /了解此试点方法/);
  assert.doesNotMatch(rec.body.ar, /استكشف نهج هذه التجربة/);
});

test('N13: glance branch and socialImage(governed-knowledge) in build-trilingual.mjs', () => {
  const branchStart = build.indexOf("if(x.path==='/fastgpt/cases/governed-knowledge')");
  assert.ok(branchStart >= 0);
  const saveAt = build.indexOf('save(l,x.path,title,desc', branchStart);
  assert.ok(saveAt > branchStart);
  const glance = build.slice(branchStart, saveAt);
  assert.match(glance, /Governed knowledge method glance/);
  assert.match(glance, /权限内知识方法速览/);
  assert.match(glance, /لمحة طريقة المعرفة الخاضعة للحوكمة/);
  assert.match(glance, /re-checked 23 November 2026/);
  assert.match(glance, /2026年11月23日复核/);
  assert.match(glance, /رُوجعت في 23 نوفمبر 2026/);
  assert.match(glance, /'Two test roles'/);
  assert.match(glance, /'Access before retrieval'/);
  assert.match(glance, /'Measure denials and citations'/);
  assert.match(glance, /'Agree scope first'/);
  assert.match(glance, /governed-knowledge-method-glance\.webp/);
  assert.match(glance, /width="1600" height="900"/);
  assert.match(glance, /html\.indexOf\('<h2'\)/);
  assert.match(glance, /id="method-glance"/);
  assert.match(build, /editorial\.socialImage\('governed-knowledge'\)/);
  assert.match(build, /Object\.keys\(pageOpts\)\.length\?pageOpts:undefined/);
  assert.doesNotMatch(glance, /\d{2,}\s*%/);
  assert.doesNotMatch(glance, /shop\.cnps\.ai\/blogs\//);
});

test('N13: editorial asset key; cover + glance webp files exist', () => {
  const entry = assets['governed-knowledge'];
  assert.ok(entry);
  assert.equal(entry.file, coverKey);
  assert.match(entry.alt.en, /two unbranded role tokens/);
  assert.match(entry.alt.zh, /两个无品牌角色标记/);
  assert.match(entry.alt.ar, /رمزان غير موسومين/);
  for (const f of [
    'web/assets/editorial/governed-knowledge-1280.webp',
    'web/assets/editorial/governed-knowledge-640.webp',
    'web/assets/editorial/originals/governed-knowledge.png',
    'web/assets/resources/' + IMG,
  ]) {
    assert.ok(fs.existsSync(f) && fs.statSync(f).size > 1000, f);
  }
});

test('N13 built pages: H1 unchanged, new meta, glance, live-H1 anchors, one money CTA, no request-quote', () => {
  const file = path.join('dist/en/fastgpt/cases/governed-knowledge.html');
  if (!fs.existsSync(file)) {
    assert.ok(true, 'no build output');
    return;
  }
  for (const l of locales) {
    const f = path.join('dist', l, 'fastgpt/cases/governed-knowledge.html');
    const html = fs.readFileSync(f, 'utf8');
    assert.deepEqual(htmlH1s(html), [title[l]]);
    assert.match(html, new RegExp(`<meta name="description" content="${esc(description[l])}">`));
    assert.match(html, new RegExp(esc(recheck[l])));
    assert.match(html, new RegExp(esc(reviewKept[l])));
    assert.match(
      html,
      /<meta property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/governed-knowledge-1280\.webp">/,
    );
    assert.doesNotMatch(html, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/social\.png"/);
    const g = html.indexOf(`<h2 id="method-glance">${glanceTitle[l]}</h2>`);
    const s1 = html.indexOf(firstSection[l]);
    assert.ok(g > 0 && s1 > g, l + ' glance renders before The published reference');
    assert.match(html, /governed-knowledge-method-glance\.webp/);
    const art = proseArticle(html);
    assert.doesNotMatch(art, /class="catalog-card"/, l + ' article extract must not swallow catalog-card chrome');
    for (const [href, text] of Object.entries(anchors[l])) {
      const liveHref = `/${l}${href}`;
      assert.match(art, new RegExp(`href="${esc(liveHref)}"[^>]*>${esc(text)}</a>`));
      const n = [...art.matchAll(new RegExp(`href="${esc(liveHref)}"`, 'g'))].length;
      assert.equal(n, 1, l + ' href once ' + liveHref);
    }
    assert.equal((art.match(new RegExp(`/${l}/fastgpt/contact\\?case=governed-knowledge`, 'g')) || []).length, 1, l + ' one money CTA');
    assert.doesNotMatch(art, /\/request-quote/);
    assert.doesNotMatch(art, new RegExp(esc(SHOP_NEWS)));
  }
});
