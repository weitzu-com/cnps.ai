import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'uae-first-pilot-documents-and-workflow';
const route = '/en/fastgpt/guides/' + slug;
const arRoute = '/ar/fastgpt/guides/' + slug;
const source = fs.readFileSync(path.join('content/i18n/fastgpt-guides/en', slug + '.md'), 'utf8');
const arSource = fs.readFileSync(path.join('content/i18n/fastgpt-guides/ar', slug + '.md'), 'utf8');
const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
const arWords = arSource.trim().split(/\s+/);
const guides = JSON.parse(fs.readFileSync('content/i18n/fastgpt-guides.json', 'utf8')).guides;
const meta = guides.find((g) => g.slug === slug);
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const hub = JSON.parse(fs.readFileSync('content/i18n/fastgpt-pages.json', 'utf8')).find((p) => p.path === '/fastgpt');
const knowledge = fs.readFileSync('content/i18n/resources/en/knowledge-pilot.md', 'utf8');
const arKnowledge = fs.readFileSync('content/i18n/resources/ar/knowledge-pilot.md', 'utf8');

function vercelDest(sourcePath) {
  return vercel.redirects.find((r) => r.source === sourcePath)?.destination;
}

test('UAE FastGPT first-pilot guide stays a method page', () => {
  assert.ok(words.length >= 1200 && words.length <= 1600, 'word count ' + words.length);
  assert.ok(meta, 'fastgpt-guides.json entry');
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.title.en, 'Pick documents and one workflow for a UAE FastGPT first pilot');
  assert.equal(meta.h1.en, 'Pick documents and one workflow for a UAE FastGPT first pilot');
  assert.match(meta.description.en, /Choose one approved corpus, one measurable workflow, and a hard-question set/);
  assert.match(source, /^# Pick documents and one workflow for a UAE FastGPT first pilot/m);
  assert.match(source, /Name one owner, one approved corpus, one workflow, and a hard-question set before any FastGPT build; measure checked answers, not first drafts\./);
  for (const heading of [
    'What “one measurable workflow” means',
    'Document set rules',
    'Three starter workflows with pass rules',
    'Hard-question set',
    'Measures',
    'When to stay on ChatGPT company knowledge instead',
    'FAQ',
    'Plan a pilot'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(source, /### Manual lookup/);
  assert.match(source, /### Support handoff/);
  assert.match(source, /### RFQ brief/);
  assert.match(source, /\*\*Approved\.\*\*/);
  assert.match(source, /\*\*Versioned\.\*\*/);
  assert.match(source, /\*\*Permissioned\.\*\*/);
  assert.match(source, /\*\*Routine\.\*\*/);
  assert.match(source, /\*\*Missing evidence\.\*\*/);
  assert.match(source, /\*\*Access tests\.\*\*/);
  assert.match(source, /Correctness under review/);
  assert.match(source, /Review minutes/);
  assert.match(source, /Access incidents/);
  assert.match(source, /Cost drivers/);
  assert.match(source, /not independently audited/);
  assert.match(source, /no checkout/);
  assert.match(source, /written proposal/);
  assert.match(source, /\[partner\]\(\/fastgpt\)/);
  assert.match(source, /\/fastgpt\/contact/);
  assert.match(source, /\/resources\/knowledge-pilot/);
  assert.match(source, /\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise/);
  assert.match(source, /\/fastgpt\/solutions\/technical-knowledge/);
  assert.match(source, /\/fastgpt\/solutions\/support-triage/);
  assert.match(source, /\/fastgpt\/solutions\/rfq-intake/);
  assert.match(source, /This is not “always FastGPT/);
  assert.match(source, /checked answers, not first drafts/);
  assert.doesNotMatch(source, /win rate|win-rate of|accuracy of \d|latency of \d/i);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.match(hub.body.en, /\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.match(hub.body.zh, /\/en\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.match(hub.body.ar, /\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.doesNotMatch(hub.body.ar, /\/en\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.match(knowledge, /\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.match(arKnowledge, /\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.doesNotMatch(arKnowledge, /\/en\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.equal(vercelDest('/fastgpt/guides/:path*'), '/en/fastgpt/guides/:path*');
  assert.equal(vercelDest('/zh/fastgpt/guides/:path*'), '/en/fastgpt/guides/:path*');
  assert.equal(vercelDest('/ar/fastgpt/guides'), arRoute);
  assert.equal(vercelDest('/ar/fastgpt/guides/:path*'), undefined);
});

test('UAE FastGPT first-pilot Arabic twin is MSA and mirrors EN structure', () => {
  assert.ok(arWords.length >= 800, 'arabic word count ' + arWords.length);
  assert.match(arSource, /[\u0600-\u06FF]/);
  assert.match(arSource, /^# اختر المستندات وسير عمل واحداً لتجربة FastGPT أولى في الإمارات/m);
  assert.equal(meta.h1.ar, 'اختر المستندات وسير عمل واحداً لتجربة FastGPT أولى في الإمارات');
  for (const heading of [
    'ماذا يعني «سير عمل واحد قابل للقياس»',
    'قواعد مجموعة المستندات',
    'ثلاثة مسارات بداية مع قواعد الاجتياز',
    'مجموعة الأسئلة الصعبة',
    'المقاييس',
    'متى تبقى على معرفة الشركة في ChatGPT',
    'أسئلة شائعة',
    'خطّط لتجربة'
  ]) assert.match(arSource, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(arSource, /### البحث في الدليل/);
  assert.match(arSource, /### تسليم الدعم/);
  assert.match(arSource, /### موجز طلب السعر/);
  assert.match(arSource, /\*\*معتمدة\.\*\*/);
  assert.match(arSource, /\*\*ذات إصدار\.\*\*/);
  assert.match(arSource, /\*\*ذات صلاحيات\.\*\*/);
  assert.match(arSource, /الصحة تحت المراجعة/);
  assert.match(arSource, /دقائق المراجعة/);
  assert.match(arSource, /حوادث الوصول/);
  assert.match(arSource, /محركات التكلفة/);
  assert.match(arSource, /لم تدقّقها CNPS بشكل مستقل/);
  assert.match(arSource, /ولا يوجد دفع على هذا الموقع/);
  assert.match(arSource, /مقترح مكتوب/);
  assert.match(arSource, /\[شريكاً\]\(\/fastgpt\)/);
  assert.match(arSource, /\/fastgpt\/contact/);
  assert.match(arSource, /\/resources\/knowledge-pilot/);
  assert.match(arSource, /\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise/);
  assert.match(arSource, /هذا ليس «FastGPT دائماً»/);
  assert.doesNotMatch(arSource, /add to cart|buy now/i);
  assert.doesNotMatch(arSource, /Name one owner, one approved corpus, one workflow/);
  assert.doesNotMatch(arSource, /win rate of \d|accuracy of \d/i);
});

test('built English and Arabic FastGPT first-pilot pages have self-canonicals and reciprocal hreflang', () => {
  const htmlPath = path.join('dist/en/fastgpt/guides', slug + '.html');
  const sitemapPath = 'dist/sitemap.xml';
  if (!fs.existsSync(htmlPath) || !fs.existsSync(sitemapPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const arPath = path.join('dist/ar/fastgpt/guides', slug + '.html');
  const zhPath = path.join('dist/zh/fastgpt/guides', slug + '.html');
  const arHtml = fs.readFileSync(arPath, 'utf8');
  assert.match(html, /<h1 class="wide">Pick documents and one workflow for a UAE FastGPT first pilot<\/h1>/);
  assert.match(html, /role="note"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow">/);
  assert.match(html, /hreflang="ar" href="https:\/\/www\.cnps\.ai\/ar\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow"/);
  assert.match(html, /hreflang="en" href="https:\/\/www\.cnps\.ai\/en\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/www\.cnps\.ai\/en\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow"/);
  assert.doesNotMatch(html, /rel="alternate" hreflang="zh/);
  assert.match(arHtml, /lang="ar"/);
  assert.match(arHtml, /dir="rtl"/);
  assert.doesNotMatch(arHtml, /http-equiv="refresh"/);
  assert.match(arHtml, /<h1 class="wide">اختر المستندات وسير عمل واحداً لتجربة FastGPT أولى في الإمارات<\/h1>/);
  assert.match(arHtml, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/ar\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow">/);
  assert.doesNotMatch(arHtml, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\//);
  assert.match(arHtml, /hreflang="en" href="https:\/\/www\.cnps\.ai\/en\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow"/);
  assert.match(arHtml, /hreflang="ar" href="https:\/\/www\.cnps\.ai\/ar\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow"/);
  assert.match(arHtml, /hreflang="x-default" href="https:\/\/www\.cnps\.ai\/en\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow"/);
  assert.match(arHtml, /href="\/ar\/fastgpt"/);
  assert.match(arHtml, /href="\/ar\/fastgpt\/contact"/);
  assert.match(sitemap, new RegExp('https://www\\.cnps\\.ai' + route.replace(/\//g, '\\/')));
  assert.match(sitemap, new RegExp('https://www\\.cnps\\.ai' + arRoute.replace(/\//g, '\\/')));
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/zh\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow/);
  assert.ok(fs.existsSync(zhPath) && /http-equiv="refresh"/.test(fs.readFileSync(zhPath, 'utf8')));
  assert.doesNotMatch(html, /add to cart|buy now/i);
  assert.doesNotMatch(html, /win rate of \d|accuracy of \d/i);
});

test('resources hub lists the UAE FastGPT first-pilot card in EN and AR', () => {
  const enPath = 'dist/en/resources.html';
  const arPath = 'dist/ar/resources.html';
  const zhPath = 'dist/zh/resources.html';
  if (!fs.existsSync(enPath) || !fs.existsSync(arPath) || !fs.existsSync(zhPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const en = fs.readFileSync(enPath, 'utf8');
  const ar = fs.readFileSync(arPath, 'utf8');
  const zh = fs.readFileSync(zhPath, 'utf8');
  assert.match(en, /href="\/en\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow"/);
  assert.match(en, /Pick documents and one workflow for a UAE FastGPT first pilot/);
  assert.match(ar, /href="\/ar\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow"/);
  assert.match(ar, /اختر المستندات وسير عمل واحداً لتجربة FastGPT أولى في الإمارات/);
  assert.match(zh, /href="\/en\/fastgpt\/guides\/uae-first-pilot-documents-and-workflow"/);
});
