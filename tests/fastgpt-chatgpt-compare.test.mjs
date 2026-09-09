import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'fastgpt-vs-chatgpt-enterprise';
const route = '/en/fastgpt/compare/' + slug;
const arRoute = '/ar/fastgpt/compare/' + slug;
const source = fs.readFileSync(path.join('content/i18n/fastgpt-compare/en', slug + '.md'), 'utf8');
const arSource = fs.readFileSync(path.join('content/i18n/fastgpt-compare/ar', slug + '.md'), 'utf8');
const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
const arWords = arSource.trim().split(/\s+/);
const compares = JSON.parse(fs.readFileSync('content/i18n/fastgpt-compare.json', 'utf8')).compares;
const meta = compares.find((x) => x.slug === slug);
const vercel = fs.readFileSync('vercel.json', 'utf8');

test('FastGPT vs ChatGPT compare stays a method page', () => {
  assert.ok(words.length >= 1200 && words.length <= 1800, 'word count ' + words.length);
  assert.ok(meta, 'fastgpt-compare.json entry');
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.h1.en, 'FastGPT vs ChatGPT for permissioned enterprise knowledge');
  assert.match(source, /^# FastGPT vs ChatGPT for permissioned enterprise knowledge/m);
  for (const heading of [
    'A fair baseline — what both can do',
    'Decision matrix',
    'Permissions checklist before either pilot',
    'Citations and evidence',
    'Human review',
    'A two-week evaluate design',
    'When ChatGPT is enough — and when a FastGPT-shaped workflow fits',
    'FAQ',
    'Plan a pilot'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(source, /Need \| Generic ChatGPT/);
  assert.match(source, /Connect many SaaS via OAuth/);
  assert.match(source, /Bounded approved document set/);
  assert.match(source, /Click-through to cited chunk/);
  assert.match(source, /Human review before use/);
  assert.match(source, /Self-hosted \/ residency options/);
  assert.match(source, /One measurable workflow owner/);
  assert.match(source, /not a single accuracy number/);
  assert.match(source, /This is not “always FastGPT/);
  assert.match(source, /not independently audited/);
  assert.match(source, /written proposal/);
  assert.match(source, /\[partner\]\(\/fastgpt\)/);
  assert.match(source, /\/fastgpt\/contact/);
  assert.match(source, /\/resources\/knowledge-pilot/);
  assert.match(source, /help\.openai\.com/);
  assert.match(source, /doc\.fastgpt\.io/);
  assert.match(source, /approved product manual, revision B/);
  assert.match(source, /missing-information prompts and a clear path to a person/);
  assert.doesNotMatch(source, /win rate|win-rate of|accuracy of \d|latency of \d/i);
  assert.match(source, /no checkout/);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.match(source, /not “always FastGPT/);
  assert.doesNotMatch(source, /ChatGPT is (?:bad|worse|weak)/i);
});

test('FastGPT vs ChatGPT Arabic twin is MSA and mirrors EN structure', () => {
  assert.ok(arWords.length >= 800, 'arabic word count ' + arWords.length);
  assert.match(arSource, /[\u0600-\u06FF]/);
  assert.match(arSource, /^# FastGPT مقابل ChatGPT لمعرفة مؤسسية ذات صلاحيات/m);
  assert.equal(meta.h1.ar, 'FastGPT مقابل ChatGPT لمعرفة مؤسسية ذات صلاحيات');
  for (const heading of [
    'خط أساس عادل — ما يستطيعه كلاهما',
    'مصفوفة القرار',
    'قائمة صلاحيات قبل أي تجربة',
    'الاستشهادات والأدلة',
    'المراجعة البشرية',
    'تصميم تقييم لأسبوعين',
    'متى يكفي ChatGPT — ومتى يناسب مسار عمل على هيئة FastGPT',
    'أسئلة شائعة',
    'خطّط لتجربة'
  ]) assert.match(arSource, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(arSource, /الاحتياج \| ChatGPT العام/);
  assert.match(arSource, /ربط كثير من SaaS عبر OAuth/);
  assert.match(arSource, /مجموعة مستندات معتمدة محدودة/);
  assert.match(arSource, /النقر إلى المقطع المستشهد به/);
  assert.match(arSource, /مراجعة بشرية قبل الاستخدام/);
  assert.match(arSource, /خيارات الاستضافة الذاتية \/ الإقامة/);
  assert.match(arSource, /مالك واحد لمسار عمل قابل للقياس/);
  assert.match(arSource, /لا رقم دقة واحد/);
  assert.match(arSource, /هذا ليس «FastGPT دائماً»/);
  assert.match(arSource, /لم تدقّقها CNPS بشكل مستقل/);
  assert.match(arSource, /مقترح مكتوب/);
  assert.match(arSource, /\[شريكاً\]\(\/fastgpt\)/);
  assert.match(arSource, /\/fastgpt\/contact/);
  assert.match(arSource, /\/resources\/knowledge-pilot/);
  assert.match(arSource, /help\.openai\.com/);
  assert.match(arSource, /doc\.fastgpt\.io/);
  assert.match(arSource, /دليل منتج معتمد، الإصدار B/);
  assert.match(arSource, /تنبيهات إلى نقص المعلومات ومسار واضح إلى شخص/);
  assert.match(arSource, /ولا يوجد دفع على هذا الموقع/);
  assert.doesNotMatch(arSource, /win rate of \d|accuracy of \d/i);
  assert.doesNotMatch(arSource, /add to cart|buy now/i);
  assert.doesNotMatch(arSource, /Compare FastGPT and ChatGPT for permissioned enterprise knowledge by/);
});

test('built English and Arabic compare pages are in the sitemap with hreflang', () => {
  const htmlPath = path.join('dist/en/fastgpt/compare', slug + '.html');
  const sitemapPath = 'dist/sitemap.xml';
  if (!fs.existsSync(htmlPath) || !fs.existsSync(sitemapPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const arPath = path.join('dist/ar/fastgpt/compare', slug + '.html');
  const zhPath = path.join('dist/zh/fastgpt/compare', slug + '.html');
  const arHtml = fs.readFileSync(arPath, 'utf8');
  assert.match(html, /<h1 class="wide">FastGPT vs ChatGPT for permissioned enterprise knowledge<\/h1>/);
  assert.match(html, /role="note"/);
  assert.match(html, /When to use FastGPT instead of ChatGPT for cited, reviewed answers on your documents/);
  assert.match(html, /without fake benchmarks/);
  assert.match(html, /<div class="table-scroll"/);
  assert.match(html, /href="\/en\/fastgpt"/);
  assert.match(html, /href="\/en\/fastgpt\/contact"/);
  assert.match(html, /hreflang="ar" href="https:\/\/www\.cnps\.ai\/ar\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise"/);
  assert.match(arHtml, /lang="ar"/);
  assert.match(arHtml, /dir="rtl"/);
  assert.doesNotMatch(arHtml, /http-equiv="refresh"/);
  assert.match(arHtml, /<h1 class="wide">FastGPT مقابل ChatGPT لمعرفة مؤسسية ذات صلاحيات<\/h1>/);
  assert.match(arHtml, /href="\/ar\/fastgpt"/);
  assert.match(arHtml, /href="\/ar\/fastgpt\/contact"/);
  assert.match(arHtml, /hreflang="en" href="https:\/\/www\.cnps\.ai\/en\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise"/);
  assert.match(sitemap, new RegExp('https://www\\.cnps\\.ai' + route.replace(/\//g, '\\/')));
  assert.match(sitemap, new RegExp('https://www\\.cnps\\.ai' + arRoute.replace(/\//g, '\\/')));
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/zh\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise/);
  assert.ok(fs.existsSync(zhPath) && /http-equiv="refresh"/.test(fs.readFileSync(zhPath, 'utf8')));
  assert.doesNotMatch(html, /add to cart|buy now/i);
  assert.doesNotMatch(html, /win rate of \d|accuracy of \d/i);
  assert.match(vercel, /"source": "\/ar\/fastgpt\/compare"/);
  assert.match(vercel, /"destination": "\/ar\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise"/);
  assert.doesNotMatch(vercel, /"source": "\/ar\/fastgpt\/compare\/:path\*"/);
});

test('resources hub lists the FastGPT vs ChatGPT compare card in EN, AR, and ZH', () => {
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
  assert.match(en, /href="\/en\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise"/);
  assert.match(en, /When to use FastGPT instead of ChatGPT for cited, reviewed answers on your documents/);
  assert.match(ar, /href="\/ar\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise"/);
  assert.match(ar, /متى تستخدم FastGPT بدل ChatGPT لإجابات موثّقة ومراجعة على مستنداتك/);
  assert.match(zh, /href="\/en\/fastgpt\/compare\/fastgpt-vs-chatgpt-enterprise"/);
  assert.match(zh, /When to use FastGPT instead of ChatGPT for cited, reviewed answers on your documents/);
});
