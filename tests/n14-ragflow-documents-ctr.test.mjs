import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// N14 (2026-11-24 Asia/Shanghai): first www CTR refresh of
// /case-studies/ragflow-documents. H1/title/path and the five article
// H2s stay unchanged. New method glance, editorial cover, dated meta,
// 24 November 2026 body re-check, live-H1 sister + one money CTA.
const slug = 'ragflow-documents';
const coverKey = 'ragflow-documents';
const catalog = JSON.parse(fs.readFileSync('content/i18n/catalog.json', 'utf8'));
const catalogMjs = fs.readFileSync('content/catalog.mjs', 'utf8');
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
const locales = ['en', 'zh', 'ar'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const htmlH1s = (html) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
const IMG = 'ragflow-documents-method-glance.webp';
const SHOP_NEWS = 'shop.cnps.ai/blogs/';
const SOURCE = 'https://github.com/infiniflow/ragflow';

const title = {
  en: 'RAGFlow: evaluate the document layer first',
  zh: 'RAGFlow：优先评估文档处理层',
  ar: 'RAGFlow: قيّم طبقة المستندات أولاً',
};
const description = {
  en: 'Document-layer method (checked 24 Nov 2026): start from the source documents, confirm extraction quality on scans and tables, then evaluate citations, updates and access.',
  zh: '文档层方法（2026年11月24日复核）：先核来源文档，再确认扫描件与表格的提取质量，并评估引用、更新与访问边界。',
  ar: 'طريقة طبقة المستندات (رُوجعت في 24 نوفمبر 2026): ابدأ بالمستندات المصدر، وتأكد من جودة الاستخراج من المسح الضوئي والجداول، ثم قيّم الاستشهادات والتحديثات وحدود الوصول.',
};
const facts = {
  en: 'The RAGFlow repository describes document processing, retrieval and source citations, with self-hosting instructions. It is a technical source for assessing a document workflow, not evidence of a CNPS customer deployment.',
  zh: 'RAGFlow 仓库介绍了文档处理、检索、来源引用和自托管方法。它是评估文档流程的技术来源，不是 CNPS 客户部署的证据。',
  ar: 'يصف مستودع RAGFlow معالجة المستندات والاسترجاع والاستشهاد بالمصادر، مع تعليمات للاستضافة الذاتية. إنه مصدر تقني لتقييم سير عمل المستندات، وليس دليلاً على نشر لدى عميل لـCNPS.',
};
const headings = {
  en: [
    'Document-layer method glance',
    'What the source documents',
    'What this means for your project',
    'What to confirm',
    'What to evaluate',
    'Evidence & sources',
  ],
  zh: [
    '文档层方法速览',
    '来源记录的事实',
    '对项目的启示',
    '需要确认的事项',
    '如何评估',
    '证据与来源',
  ],
  ar: [
    'لمحة طريقة طبقة المستندات',
    'ما يوثقه المصدر',
    'ما يعنيه ذلك لمشروعك',
    'ما يجب التحقق منه',
    'ما يجب تقييمه',
    'الأدلة والمصادر',
  ],
};
// Live H1s fetched 2026-11-24 (Asia/Shanghai). Built hrefs are locale-prefixed.
const anchors = {
  en: {
    '/en/fastgpt/solutions/technical-knowledge': 'Find answers in technical documents.',
    '/en/request-quote?solution=knowledge-assistants': 'Request a quotation for devices or a pilot.',
  },
  zh: {
    '/zh/fastgpt/solutions/technical-knowledge': '从技术文档中找到答案。',
    '/zh/request-quote?solution=knowledge-assistants': '为设备或试点索取报价。',
  },
  ar: {
    '/ar/fastgpt/solutions/technical-knowledge': 'اعثر على الإجابات في المستندات التقنية.',
    '/ar/request-quote?solution=knowledge-assistants': 'اطلب عرض سعر للأجهزة أو لتجربة تجريبية.',
  },
};
const glanceTitle = {
  en: 'Document-layer method glance',
  zh: '文档层方法速览',
  ar: 'لمحة طريقة طبقة المستندات',
};
const recheck = {
  en: 'Re-checked 24 November 2026: this page remains a technical source for assessing a document workflow, not evidence of a CNPS customer deployment and not a CNPS-delivered RAGFlow project. The evaluation method below is unchanged.',
  zh: '2026年11月24日复核：本页仍只是评估文档流程的技术来源，不是 CNPS 客户部署的证据，也不是由 CNPS 交付的 RAGFlow 项目。以下评估方法未改。',
  ar: 'أُعيدت المراجعة في 24 نوفمبر 2026: ما تزال هذه الصفحة مصدراً تقنياً لتقييم سير عمل المستندات، وليست دليلاً على نشر لدى عميل لـCNPS ولا مشروعاً لـRAGFlow نفذته CNPS. طريقة التقييم أدناه دون تغيير.',
};
const firstSection = {
  en: 'What the source documents',
  zh: '来源记录的事实',
  ar: 'ما يوثقه المصدر',
};

function rec(loc) {
  return catalog[loc].cases.find((c) => c.slug === slug);
}

function proseArticle(html) {
  // Case-studies pages use article.prose. A greedy <article>…</article>
  // search would swallow later sibling catalog-card chrome.
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

function articleLinks(art) {
  return [...art.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({
    href: m[1],
    text: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
  }));
}

test('N14: title (= H1) and path unchanged; facts/evaluation untouched', () => {
  for (const l of locales) {
    const r = rec(l);
    assert.ok(r, l + ' missing case record');
    assert.equal(r.slug, slug);
    assert.equal(r.title, title[l]);
    assert.equal(r.facts, facts[l]);
    assert.equal(r.evaluation.length, 3);
    assert.equal(r.solution, 'knowledge-assistants');
    assert.equal(r.sources[0][1], SOURCE);
  }
});

test('N14: method meta dated 24 Nov 2026; exact approved lengths 170/57/167; catalog.mjs synced', () => {
  for (const l of locales) {
    assert.equal(rec(l).summary, description[l]);
  }
  assert.equal(description.en.length, 170);
  assert.equal(description.zh.length, 57);
  assert.equal(description.ar.length, 167);
  assert.match(description.en, /checked 24 Nov 2026/);
  assert.match(description.zh, /2026年11月24日复核/);
  assert.match(description.ar, /رُوجعت في 24 نوفمبر 2026/);
  assert.match(catalogMjs, new RegExp(esc(description.en)));
  assert.doesNotMatch(description.en, /A practical reference for retrieval workflows/);
});

test('N14: glance branch and socialImage(ragflow-documents) in build-trilingual.mjs', () => {
  const branchStart = build.indexOf("if(x.slug==='ragflow-documents')");
  assert.ok(branchStart >= 0);
  const next = build.indexOf("save(l,'/case-studies/'+x.slug", branchStart);
  assert.ok(next > branchStart);
  const glance = build.slice(branchStart, next);
  assert.match(glance, /Document-layer method glance/);
  assert.match(glance, /文档层方法速览/);
  assert.match(glance, /لمحة طريقة طبقة المستندات/);
  assert.match(glance, /re-checked 24 November 2026/);
  assert.match(glance, /2026年11月24日复核/);
  assert.match(glance, /رُوجعت في 24 نوفمبر 2026/);
  assert.match(glance, /'Source documents'/);
  assert.match(glance, /'Confirm extraction quality'/);
  assert.match(glance, /'Evaluate citations, updates and access'/);
  assert.match(glance, /ragflow-documents-method-glance\.webp/);
  assert.match(glance, /width="1600" height="900"/);
  assert.match(glance, /id="method-glance"/);
  assert.match(glance, new RegExp(esc(recheck.en)));
  assert.match(glance, new RegExp(esc(anchors.en['/en/fastgpt/solutions/technical-knowledge'])));
  assert.match(glance, new RegExp(esc(anchors.en['/en/request-quote?solution=knowledge-assistants'])));
  assert.match(glance, /route\(l,'\/fastgpt\/solutions\/technical-knowledge'\)/);
  assert.match(glance, /route\(l,'\/request-quote\?solution=knowledge-assistants'\)/);
  assert.match(build, /editorial\.socialImage\('ragflow-documents'\)/);
  assert.doesNotMatch(glance, /\d{2,}\s*%/);
  assert.doesNotMatch(glance, /shop\.cnps\.ai\/blogs\//);
  assert.ok((glance.match(/request-quote\?solution=knowledge-assistants/g) || []).length === 1);
});

test('N14: editorial asset key; cover + glance webp files exist', () => {
  const entry = assets[coverKey];
  assert.ok(entry);
  assert.equal(entry.file, coverKey);
  assert.match(entry.alt.en, /unbranded document stack/);
  assert.match(entry.alt.zh, /无品牌文档叠层/);
  assert.match(entry.alt.ar, /كومة مستندات بلا علامة/);
  for (const f of [
    'web/assets/editorial/ragflow-documents-1280.webp',
    'web/assets/editorial/ragflow-documents-640.webp',
    'web/assets/editorial/originals/ragflow-documents.png',
    'web/assets/resources/ragflow-documents-method-glance.webp',
  ]) {
    assert.ok(fs.existsSync(f), f);
  }
});

test('N14: built pages (if dist exists): H1 unchanged, dated meta, glance, re-check, live-H1 anchors, one money CTA', () => {
  for (const l of locales) {
    const file = path.join('dist', l, 'case-studies', slug + '.html');
    if (!fs.existsSync(file)) {
      assert.ok(true, 'no build output for ' + l);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    const art = proseArticle(html);
    assert.match(html, new RegExp(`<title>${esc(title[l])} \\| CNPS\\.AI</title>`));
    assert.match(html, new RegExp(`<meta name="description" content="${esc(description[l])}">`));
    assert.deepEqual(htmlH1s(html), [title[l]]);
    assert.match(
      html,
      /<meta property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/ragflow-documents-1280\.webp">/
    );
    assert.doesNotMatch(html, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/social\.png"/);
    const g = art.indexOf(glanceTitle[l]);
    const s1 = art.indexOf(firstSection[l]);
    assert.ok(g >= 0 && s1 > g, l + ' glance before first section');
    assert.match(art, /id="method-glance"/);
    assert.match(art, new RegExp(esc(IMG)));
    assert.match(art, new RegExp(esc(recheck[l])));
    assert.match(art, new RegExp(esc(facts[l])));
    const links = articleLinks(art);
    const internal = links.filter((x) => x.href.startsWith('/') && !x.href.startsWith('//'));
    const hrefs = internal.map((x) => x.href);
    assert.equal(new Set(hrefs).size, hrefs.length, l + ' duplicate internal href in article');
    for (const { text, href } of internal) {
      const want = anchors[l][href];
      assert.ok(want, l + ' unexpected internal link ' + href + ' text=' + text);
      assert.equal(text, want, l + ' anchor for ' + href);
    }
    for (const href of Object.keys(anchors[l])) {
      assert.ok(hrefs.includes(href), l + ' missing ' + href);
    }
    const money = `/${l}/request-quote?solution=knowledge-assistants`;
    assert.equal(hrefs.filter((h) => h === money).length, 1, l + ' one money CTA');
    assert.ok(links.some((x) => x.href === SOURCE), l + ' keep GitHub source link');
    assert.doesNotMatch(art, new RegExp(SHOP_NEWS));
    const h2s = [...art.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    );
    assert.deepEqual(h2s, headings[l], l + ' article H2s');
  }
});
