import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// N07 (2026-11-13 Asia/Shanghai): second www CTR refresh of
// ai-procurement-checklist after O01 (2026-10-08). H1/title/slug and
// editorial + method images stay unchanged. Dated meta checked 13 Nov 2026,
// EN body re-check 13 November 2026 (8 October 2026 research date kept),
// exact live-H1 anchors, ZH/AR metas + existing-anchor fixes only
// (no first-screen / 8-steps added). No shop News. No new URL.
const slug = 'ai-procurement-checklist';
const enSource = fs.readFileSync(path.join('content/i18n/resources/en', slug + '.md'), 'utf8');
const zhSource = fs.readFileSync(path.join('content/i18n/resources/zh', slug + '.md'), 'utf8');
const arSource = fs.readFileSync(path.join('content/i18n/resources/ar', slug + '.md'), 'utf8');
const catalog = JSON.parse(fs.readFileSync('content/i18n/catalog.json', 'utf8'));
const enMeta = catalog.en.resources.find((r) => r.slug === slug);
const zhMeta = catalog.zh.resources.find((r) => r.slug === slug);
const arMeta = catalog.ar.resources.find((r) => r.slug === slug);
const editorialAssets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));

const title = {
  en: 'AI procurement checklist for enterprise buyers',
  zh: '企业买家的 AI 采购清单',
  ar: 'قائمة شراء الذكاء الاصطناعي للمشتري المؤسسي',
};
const description = {
  en: 'AI procurement checklist for enterprise buyers (checked 13 Nov 2026): freeze the job, match SKU/region evidence, price TCO, pilot with acceptance, then enquire.',
  zh: '企业买家的 AI 采购清单（2026年11月13日复核）：先冻结任务，再匹配 SKU/地区证据，核算完整成本，以验收做试点，然后询盘。',
  ar: 'قائمة شراء الذكاء الاصطناعي للمشتري المؤسسي (رُوجعت في 13 تشرين الثاني/نوفمبر 2026): جمّد المهمة، طابق أدلة الـ SKU/المنطقة، احسب التكلفة الكاملة، جرّب بقبول، ثم استفسر.',
};

const hrefOnce = (src, needle, label) => {
  assert.equal((src.match(new RegExp(needle, 'g')) || []).length, 1, label + ' href-once, got ' + (src.match(new RegExp(needle, 'g')) || []).length);
};

test('N07: EN/ZH/AR titles unchanged; dated metas; EN meta is 160 chars', () => {
  assert.equal(description.en.length, 160);
  assert.equal(enMeta.title, title.en);
  assert.equal(zhMeta.title, title.zh);
  assert.equal(arMeta.title, title.ar);
  assert.equal(enMeta.description, description.en);
  assert.equal(zhMeta.description, description.zh);
  assert.equal(arMeta.description, description.ar);
  assert.match(enMeta.title, /buyers/);
  assert.match(zhMeta.title, /买家/);
  assert.match(arMeta.title, /مشتري/);
  const cover = editorialAssets[slug];
  assert.equal(cover.file, slug);
  assert.match(cover.alt.en, /no fake certificates/);
});

test('N07: EN keeps 8 October research date, adds 13 November re-check, does not rewrite the 8 steps', () => {
  assert.doesNotMatch(enSource, /^# /m);
  assert.match(enSource, /^Define the business task, the evidence you will trust/);
  assert.match(enSource, /as of \*\*8 October 2026\*\*/);
  assert.match(enSource, /Method text last reviewed \*\*8 October 2026\*\*/);
  assert.match(enSource, /re-checked on 13 November 2026/);
  assert.match(enSource, /this refresh is not a new checklist/);
  for (const heading of [
    'Who this checklist is for',
    'The eight China → buyer steps',
    'China-origin supplier vs generic AI checklist',
    'FAQ',
    'Next step'
  ]) assert.match(enSource, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  for (const heading of [
    '1. Freeze the job — not the model name',
    '2. Ask for evidence that matches the decision',
    '3. Lock SKU, region, version, and subscription ownership',
    '4. Compare the whole quotation (TCO), not the device line',
    '5. Name compliance and trust documents early',
    '6. Agree a small, useful pilot before a bulk PO',
    '7. Map support, repair, and delivery responsibilities',
    '8. Send an enquiry that sales can quote'
  ]) assert.match(enSource, new RegExp('^### ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(enSource, /!\[Eight China-to-buyer procurement steps from job freeze to enquiry — diagram, no fake seals\]\(\/assets\/resources\/ai-procurement-checklist-8-steps\.webp\)/);
  assert.match(enSource, /!\[Two-column visual: evidence types versus total-cost lines — buyer method, no fake scores\]\(\/assets\/resources\/ai-procurement-checklist-evidence-tco\.webp\)/);
  const mirror = fs.readFileSync(path.join('content/resources', slug + '.md'), 'utf8');
  assert.equal(mirror, enSource);
  assert.doesNotMatch(enSource, /enquiry volumes|accuracy %|word-error rate of \d/i);
  assert.doesNotMatch(enSource, /ISO 27001 certified|we hold FCC|we hold CE/i);
  assert.doesNotMatch(enSource, /shop\.cnps\.ai\/blogs\/news/);
});

test('N07: EN body anchors equal live H1s fetched 2026-11-13; href-once; one money CTA', () => {
  assert.match(enSource, /\[AI procurement checklist for public sector: China-origin hardware path\]\(https:\/\/www\.cnps\.ai\/en\/resources\/ai-procurement-checklist-public-sector\)/);
  assert.match(enSource, /\[Source China AI recording hardware for UAE\/KSA without skipping the pilot\]\(https:\/\/www\.cnps\.ai\/en\/guides\/china-to-gulf-ai-recording-sourcing\)/);
  assert.match(enSource, /\[UAE\/KSA edge AI site readiness before you pick a box\]\(https:\/\/www\.cnps\.ai\/en\/guides\/uae-ksa-edge-ai-site-readiness\)/);
  assert.match(enSource, /\[China AI export playbook for overseas buyers\]\(https:\/\/www\.cnps\.ai\/en\/resources\/china-ai-export-playbook\)/);
  assert.match(enSource, /\[Collection: All TicNote Products\]\(https:\/\/shop\.cnps\.ai\/collections\/all-ticnote-products\)/);
  assert.match(enSource, /\[Request a quotation for devices or a pilot\.\]\(https:\/\/www\.cnps\.ai\/en\/request-quote\)/);
  assert.match(enSource, /\[AI with purpose\. Built for people\.\]\(https:\/\/www\.cnps\.ai\/en\)/);
  hrefOnce(enSource, 'ai-procurement-checklist-public-sector', 'EN public-sector');
  hrefOnce(enSource, 'china-to-gulf-ai-recording-sourcing', 'EN gulf');
  hrefOnce(enSource, 'uae-ksa-edge-ai-site-readiness', 'EN site readiness');
  hrefOnce(enSource, 'china-ai-export-playbook', 'EN playbook');
  hrefOnce(enSource, 'all-ticnote-products', 'EN shop collection');
  hrefOnce(enSource, 'www\\.cnps\\.ai\\/en\\/request-quote', 'EN request-quote');
  assert.doesNotMatch(enSource, /\[All TicNote Products\]/);
  assert.doesNotMatch(enSource, /\[CNPS\.AI\]\(https:\/\/www\.cnps\.ai\/?\)/);
});

test('N07: ZH/AR metas only plus existing-anchor exact-H1 fixes; no first-screen or 8-steps', () => {
  assert.match(zhSource, /^# 企业买家的 AI 采购清单/m);
  assert.match(arSource, /^# قائمة شراء الذكاء الاصطناعي للمشتري المؤسسي/m);
  assert.doesNotMatch(zhSource, /Define the business task, the evidence you will trust/);
  assert.doesNotMatch(arSource, /Define the business task, the evidence you will trust/);
  assert.doesNotMatch(zhSource, /ai-procurement-checklist-8-steps/);
  assert.doesNotMatch(arSource, /ai-procurement-checklist-8-steps/);
  assert.doesNotMatch(zhSource, /ai-procurement-checklist-evidence-tco/);
  assert.doesNotMatch(arSource, /ai-procurement-checklist-evidence-tco/);
  assert.doesNotMatch(zhSource, /Start here \(first screen\)/);
  assert.doesNotMatch(arSource, /Start here \(first screen\)/);
  assert.doesNotMatch(zhSource, /re-checked on 13 November 2026/);
  assert.doesNotMatch(arSource, /re-checked on 13 November 2026/);
  assert.match(zhSource, /\[UAE\/KSA edge AI site readiness before you pick a box\]\(\/en\/guides\/uae-ksa-edge-ai-site-readiness\)/);
  assert.match(zhSource, /\[为设备或试点索取报价。\]\(\/request-quote\)/);
  assert.match(zhSource, /\[合适的方案，始于正确的问题。\]\(\/solutions\)/);
  assert.doesNotMatch(zhSource, /\[准备询价\]/);
  assert.doesNotMatch(zhSource, /\[探索解决方案\]/);
  assert.doesNotMatch(zhSource, /ai-procurement-checklist-public-sector/);
  assert.match(arSource, /\[استورد أجهزة تسجيل بالذكاء الاصطناعي من الصين إلى الإمارات\/السعودية دون تخطي التجربة\]\(\/guides\/china-to-gulf-ai-recording-sourcing\)/);
  assert.match(arSource, /\[جاهزية موقع الذكاء الاصطناعي الطرفي في الإمارات\/السعودية قبل اختيار الصندوق\]\(\/guides\/uae-ksa-edge-ai-site-readiness\)/);
  assert.match(arSource, /\[اطلب عرض سعر للأجهزة أو لتجربة تجريبية.\]\(\/request-quote\)/);
  assert.match(arSource, /\[الحل الأنسب يبدأ بالسؤال الصحيح.\]\(\/solutions\)/);
  assert.doesNotMatch(arSource, /منهج التوريد من الصين إلى الخليج/);
  assert.doesNotMatch(arSource, /\[جهز طلب عرض سعر\]/);
  assert.doesNotMatch(arSource, /\[استكشف مسارات الحلول\]/);
  hrefOnce(zhSource, 'uae-ksa-edge-ai-site-readiness', 'ZH site readiness');
  hrefOnce(zhSource, '\\]\\(/request-quote\\)', 'ZH request-quote');
  hrefOnce(zhSource, '\\]\\(/solutions\\)', 'ZH solutions');
  hrefOnce(arSource, 'china-to-gulf-ai-recording-sourcing', 'AR gulf');
  hrefOnce(arSource, 'uae-ksa-edge-ai-site-readiness', 'AR site readiness');
  hrefOnce(arSource, '\\]\\(/request-quote\\)', 'AR request-quote');
  hrefOnce(arSource, '\\]\\(/solutions\\)', 'AR solutions');
  assert.doesNotMatch(zhSource, /shop\.cnps\.ai\/blogs\/news/);
  assert.doesNotMatch(arSource, /shop\.cnps\.ai\/blogs\/news/);
});

test('N07: shipped cover and method diagrams remain on disk', () => {
  const files = [
    'web/assets/editorial/originals/ai-procurement-checklist.png',
    'web/assets/editorial/ai-procurement-checklist-640.webp',
    'web/assets/editorial/ai-procurement-checklist-1280.webp',
    'web/assets/resources/ai-procurement-checklist-8-steps.webp',
    'web/assets/resources/ai-procurement-checklist-evidence-tco.webp'
  ];
  for (const file of files) {
    assert.ok(fs.existsSync(file), 'missing ' + file);
    assert.ok(fs.statSync(file).size > 1000, 'too small ' + file);
  }
});

test('N07: built EN/ZH/AR pages use new metas, unchanged H1s, and keep method figures only on EN', () => {
  const enHtmlPath = path.join('dist/en/resources', slug + '.html');
  const zhHtmlPath = path.join('dist/zh/resources', slug + '.html');
  const arHtmlPath = path.join('dist/ar/resources', slug + '.html');
  if (!fs.existsSync(enHtmlPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const htmlH1s = (html) =>
    [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim()
    );
  const enHtml = fs.readFileSync(enHtmlPath, 'utf8');
  const zhHtml = fs.readFileSync(zhHtmlPath, 'utf8');
  const arHtml = fs.readFileSync(arHtmlPath, 'utf8');
  assert.deepEqual(htmlH1s(enHtml), [title.en]);
  assert.deepEqual(htmlH1s(zhHtml), [title.zh]);
  assert.deepEqual(htmlH1s(arHtml), [title.ar]);
  assert.match(enHtml, new RegExp('<meta name="description" content="' + description.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '">'));
  assert.match(zhHtml, new RegExp('<meta name="description" content="' + description.zh.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '">'));
  assert.match(arHtml, new RegExp('<meta name="description" content="' + description.ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '">'));
  assert.match(enHtml, /re-checked on 13 November 2026/);
  assert.match(enHtml, /src="\/assets\/resources\/ai-procurement-checklist-8-steps\.webp"/);
  assert.match(enHtml, /src="\/assets\/resources\/ai-procurement-checklist-evidence-tco\.webp"/);
  assert.match(enHtml, /property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/ai-procurement-checklist-1280\.webp"/);
  assert.match(enHtml, /Collection: All TicNote Products/);
  assert.match(enHtml, /AI with purpose\. Built for people\./);
  assert.doesNotMatch(zhHtml, /ai-procurement-checklist-8-steps/);
  assert.doesNotMatch(arHtml, /ai-procurement-checklist-8-steps/);
  assert.doesNotMatch(enHtml, /shop\.cnps\.ai\/blogs\/news/);
});
