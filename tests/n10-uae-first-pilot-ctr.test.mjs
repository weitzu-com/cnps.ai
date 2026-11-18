import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';

const slug = 'uae-first-pilot-documents-and-workflow';
const enDesc = 'UAE FastGPT first-pilot method (checked 18 Nov 2026): one approved corpus, one measurable workflow, hard-question set; measure checked answers, not first drafts.';
const arDesc = 'طريقة تجربة FastGPT الأولى في الإمارات (رُوجعت في 18 نوفمبر 2026): مجموعة معتمدة، سير عمل قابل للقياس، أسئلة صعبة — قِس الإجابات المراجعة لا المسودات الأولى.';
const source = fs.readFileSync(path.join('content/i18n/fastgpt-guides/en', slug + '.md'), 'utf8');
const arSource = fs.readFileSync(path.join('content/i18n/fastgpt-guides/ar', slug + '.md'), 'utf8');
const guides = JSON.parse(fs.readFileSync('content/i18n/fastgpt-guides.json', 'utf8')).guides;
const meta = guides.find((g) => g.slug === slug);
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');

test('N10 UAE first-pilot CTR keeps H1/title/slug and dated method metas', () => {
  assert.equal(enDesc.length, 161);
  assert.equal(arDesc.length, 157);
  assert.ok(meta);
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.title.en, 'Pick documents and one workflow for a UAE FastGPT first pilot');
  assert.equal(meta.h1.en, 'Pick documents and one workflow for a UAE FastGPT first pilot');
  assert.equal(meta.title.ar, 'اختر المستندات وسير عمل واحداً لتجربة FastGPT أولى في الإمارات');
  assert.equal(meta.h1.ar, 'اختر المستندات وسير عمل واحداً لتجربة FastGPT أولى في الإمارات');
  assert.equal(meta.description.en, enDesc);
  assert.equal(meta.description.ar, arDesc);
  assert.match(source, /^# Pick documents and one workflow for a UAE FastGPT first pilot/m);
  assert.match(arSource, /^# اختر المستندات وسير عمل واحداً لتجربة FastGPT أولى في الإمارات/m);
  assert.match(source, /Re-checked on 18 November 2026; the guidance on this URL is unchanged\./);
  assert.match(arSource, /أُعيد فحص الطريقة في 18 نوفمبر 2026؛ والإرشاد المنشور على هذا الرابط دون تغيير\./);
});

test('N10 article-body anchors are exact live H1s, each href once, one money CTA, no contact', () => {
  assert.equal((source.match(/\/resources\/knowledge-pilot/g) || []).length, 1);
  assert.match(source, /\[Scope a document-grounded AI assistant\]\(\/resources\/knowledge-pilot\)/);
  assert.match(source, /\[Find answers in technical documents\.\]\(\/fastgpt\/solutions\/technical-knowledge\)/);
  assert.match(source, /\[Route support requests with context\.\]\(\/fastgpt\/solutions\/support-triage\)/);
  assert.match(source, /\[Turn RFQs into reviewable briefs\.\]\(\/fastgpt\/solutions\/rfq-intake\)/);
  assert.match(source, /\[FastGPT vs ChatGPT for permissioned enterprise knowledge\]\(\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise\)/);
  assert.match(source, /\[Put your business knowledge to work\.\]\(\/fastgpt\)/);
  assert.match(source, /\[Request a quotation for devices or a pilot\.\]\(\/request-quote\?solution=knowledge-assistants\)/);
  assert.doesNotMatch(source, /\/fastgpt\/contact/);
  assert.equal((source.match(/\/request-quote/g) || []).length, 1);
  assert.equal((arSource.match(/\/resources\/knowledge-pilot/g) || []).length, 1);
  assert.match(arSource, /\[حدد نطاق مساعد ذكاء اصطناعي يستند إلى المستندات\]\(\/resources\/knowledge-pilot\)/);
  assert.match(arSource, /\[اعثر على الإجابات في المستندات التقنية\.\]\(\/fastgpt\/solutions\/technical-knowledge\)/);
  assert.match(arSource, /\[وجّه طلبات الدعم مع سياقها\.\]\(\/fastgpt\/solutions\/support-triage\)/);
  assert.match(arSource, /\[حوّل طلبات الأسعار إلى موجزات قابلة للمراجعة\.\]\(\/fastgpt\/solutions\/rfq-intake\)/);
  assert.match(arSource, /\[FastGPT مقابل ChatGPT لمعرفة مؤسسية ذات صلاحيات\]\(\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise\)/);
  assert.match(arSource, /\[ضع معرفة مؤسستك في خدمة العمل\.\]\(\/fastgpt\)/);
  assert.match(arSource, /\[اطلب عرض سعر للأجهزة أو لتجربة تجريبية\.\]\(\/request-quote\?solution=knowledge-assistants\)/);
  assert.doesNotMatch(arSource, /\/fastgpt\/contact/);
  assert.doesNotMatch(source, /win rate of \d|accuracy of \d/i);
  assert.doesNotMatch(arSource, /win rate of \d|accuracy of \d/i);
});

test('N10 cover, method glance and FastGPT guide wiring are in the repo', () => {
  assert.equal(assets[slug].file, slug);
  assert.match(assets[slug].alt.en, /UAE FastGPT first-pilot hero/);
  assert.ok(fs.existsSync(`web/assets/editorial/${slug}-1280.webp`));
  assert.ok(fs.existsSync(`web/assets/editorial/${slug}-640.webp`));
  assert.ok(fs.existsSync(`web/assets/resources/${slug}-method-glance.webp`));
  assert.match(build, /if\(x\.slug==='uae-first-pilot-documents-and-workflow'\)\{const glanceTitle=/);
  assert.match(build, /guideOpts\.socialImage=editorial\.socialImage\('uae-first-pilot-documents-and-workflow'\)/);
  assert.match(build, /UAE FastGPT first-pilot method glance/);
  assert.match(build, /لمحة طريقة تجربة FastGPT الأولى في الإمارات/);
});

test('built N10 EN/AR pages include glance, editorial og, re-check, and no ZH body', () => {
  const htmlPath = path.join('dist/en/fastgpt/guides', slug + '.html');
  const arPath = path.join('dist/ar/fastgpt/guides', slug + '.html');
  const zhPath = path.join('dist/zh/fastgpt/guides', slug + '.html');
  if (!fs.existsSync(htmlPath) || !fs.existsSync(arPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const arHtml = fs.readFileSync(arPath, 'utf8');
  assert.match(html, /<h1 class="wide">Pick documents and one workflow for a UAE FastGPT first pilot<\/h1>/);
  assert.match(html, /UAE FastGPT first-pilot method glance/);
  assert.match(html, /uae-first-pilot-documents-and-workflow-method-glance\.webp/);
  assert.match(html, /Re-checked on 18 November 2026/);
  assert.match(html, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/uae-first-pilot-documents-and-workflow-1280\.webp"/);
  assert.doesNotMatch(html, /assets\/social\.png/);
  const article = html.match(/<article class="prose">([\s\S]*?)<\/article>/)[1];
  assert.doesNotMatch(article, /\/en\/fastgpt\/contact/);
  assert.match(arHtml, /لمحة طريقة تجربة FastGPT الأولى في الإمارات/);
  assert.match(arHtml, /أُعيد فحص الطريقة في 18 نوفمبر 2026/);
  assert.match(arHtml, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/uae-first-pilot-documents-and-workflow-1280\.webp"/);
  assert.ok(fs.existsSync(zhPath) && /http-equiv="refresh"/.test(fs.readFileSync(zhPath, 'utf8')));
});
