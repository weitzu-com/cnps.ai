import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'uae-ksa-edge-ai-site-readiness';
const source = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const arSource = fs.readFileSync(path.join('content/i18n/guides/ar', slug + '.md'), 'utf8');
const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
const arWords = arSource.trim().split(/\s+/);
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((g) => g.slug === slug);
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const survey = fs.readFileSync('content/i18n/resources/en/edge-ai-survey.md', 'utf8');
const checklist = fs.readFileSync('content/i18n/resources/en/ai-procurement-checklist.md', 'utf8');
const arSurvey = fs.readFileSync('content/i18n/resources/ar/edge-ai-survey.md', 'utf8');
const arChecklist = fs.readFileSync('content/i18n/resources/ar/ai-procurement-checklist.md', 'utf8');

function vercelDest(sourcePath) {
  return vercel.redirects.find((r) => r.source === sourcePath)?.destination;
}

test('UAE/KSA edge AI site readiness guide stays a method page', () => {
  assert.ok(words.length >= 1000 && words.length <= 1500, 'word count ' + words.length);
  assert.ok(meta, 'guides.json entry');
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.title.en, 'UAE/KSA edge AI site readiness before you pick a box');
  assert.equal(meta.h1.en, 'UAE/KSA edge AI site readiness before you pick a box');
  assert.match(meta.description.en, /Map lighting, FOV, network, power, latency budget, and who reviews exceptions/);
  assert.match(source, /^# UAE\/KSA edge AI site readiness before you pick a box/m);
  assert.match(source, /Map scene, connectivity, power, and who reviews exceptions on the real UAE\/KSA site before selecting edge hardware or signing acceptance\./);
  assert.match(source, /Gulf-named readiness checklist/);
  assert.match(source, /not legal advice/);
  assert.match(source, /not a PDPL opinion/);
  for (const heading of [
    'Why the site beats the model brochure',
    'Checklist: lighting, FOV, network, power, latency budget',
    'Privacy and exception review',
    'Acceptance test on the real site',
    'When to stop / rescope',
    'Related reading and next conversation'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(source, /\*\*Lighting\.\*\*/);
  assert.match(source, /\*\*FOV\.\*\*/);
  assert.match(source, /\*\*Network\.\*\*/);
  assert.match(source, /\*\*Power\.\*\*/);
  assert.match(source, /\*\*Latency budget\.\*\*/);
  assert.match(source, /will not invent a latency number/);
  assert.match(source, /who sees alerts/);
  assert.match(source, /Inference location/);
  assert.match(source, /Escalate answers to counsel/);
  assert.match(source, /\/resources\/edge-ai-survey/);
  assert.match(source, /\/blogs\/edge-ai-start-with-the-site/);
  assert.match(source, /\[explore a partnership\]\(\/wholesale\)/);
  assert.match(source, /\[request a quotation\]\(\/request-quote\?solution=edge-vision\)/);
  assert.match(source, /\[contact CNPS\]\(\/contact\)/);
  assert.match(source, /does not run checkout/);
  assert.match(survey, /\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.match(checklist, /\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.match(arSurvey, /\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.match(arChecklist, /\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.doesNotMatch(arSurvey, /\/en\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.doesNotMatch(arChecklist, /\/en\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.equal(vercelDest('/zh/guides/:slug'), '/en/guides/:slug');
  assert.equal(vercelDest('/zh/guides/:path*'), undefined);
  assert.equal(vercelDest('/zh/guides'), undefined);
  assert.equal(vercelDest('/ar/guides/:path*'), undefined);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.doesNotMatch(source, /latency of \d|within \d+\s*ms|#1 in (the )?Gulf|market share/i);
  assert.doesNotMatch(source, /PDPL (requires|mandates|prohibits|applies)|complies with PDPL|PDPL-compliant/i);
  assert.doesNotMatch(source, /Hailo|Jetson league|best edge box|NVIDIA ranking/i);
});

test('UAE/KSA edge readiness Arabic twin is MSA and mirrors EN structure', () => {
  assert.ok(arWords.length >= 700, 'arabic word count ' + arWords.length);
  assert.match(arSource, /[\u0600-\u06FF]/);
  assert.match(arSource, /^# جاهزية موقع الذكاء الاصطناعي الطرفي في الإمارات\/السعودية قبل اختيار الصندوق/m);
  assert.equal(meta.h1.ar, 'جاهزية موقع الذكاء الاصطناعي الطرفي في الإمارات/السعودية قبل اختيار الصندوق');
  for (const heading of [
    'لماذا يتفوّق الموقع على كتيّب النموذج',
    'قائمة: الإضاءة وFOV والشبكة والطاقة وميزانية الكمون',
    'الخصوصية ومراجعة الاستثناءات',
    'اختبار القبول على الموقع الفعلي',
    'متى تتوقف / تعيد النطاق',
    'قراءة ذات صلة والمحادثة التالية'
  ]) assert.match(arSource, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(arSource, /\*\*الإضاءة\.\*\*/);
  assert.match(arSource, /\*\*FOV\.\*\*/);
  assert.match(arSource, /\*\*الشبكة\.\*\*/);
  assert.match(arSource, /\*\*الطاقة\.\*\*/);
  assert.match(arSource, /\*\*ميزانية الكمون\.\*\*/);
  assert.match(arSource, /لن تخترع هذه الصفحة رقم كمون/);
  assert.match(arSource, /موقع الاستدلال/);
  assert.match(arSource, /ارفع الإجابات إلى المستشار/);
  assert.match(arSource, /ليست استشارة قانونية وليست رأياً في PDPL/);
  assert.match(arSource, /\[مسح موقع الذكاء الاصطناعي الطرفي\]\(\/resources\/edge-ai-survey\)/);
  assert.match(arSource, /\[استكشف شراكة\]\(\/wholesale\)/);
  assert.match(arSource, /\[اطلب عرض سعر\]\(\/request-quote\?solution=edge-vision\)/);
  assert.match(arSource, /\[تواصل مع CNPS\]\(\/contact\)/);
  assert.match(arSource, /ولا يوجد دفع على هذا الموقع/);
  assert.doesNotMatch(arSource, /add to cart|buy now/i);
  assert.doesNotMatch(arSource, /Map scene, connectivity, power/);
  assert.doesNotMatch(arSource, /latency of \d|within \d+\s*ms/);
});

test('built English and Arabic edge readiness pages have self-canonicals and reciprocal hreflang', () => {
  const htmlPath = path.join('dist/en/guides', slug + '.html');
  const sitemapPath = 'dist/sitemap.xml';
  if (!fs.existsSync(htmlPath) || !fs.existsSync(sitemapPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const arPath = path.join('dist/ar/guides', slug + '.html');
  const zhPath = path.join('dist/zh/guides', slug + '.html');
  const arHtml = fs.readFileSync(arPath, 'utf8');
  assert.match(html, /<h1 class="wide">UAE\/KSA edge AI site readiness before you pick a box<\/h1>/);
  assert.match(html, /role="note"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\/guides\/uae-ksa-edge-ai-site-readiness">/);
  assert.match(html, /hreflang="ar" href="https:\/\/www\.cnps\.ai\/ar\/guides\/uae-ksa-edge-ai-site-readiness"/);
  assert.match(html, /hreflang="en" href="https:\/\/www\.cnps\.ai\/en\/guides\/uae-ksa-edge-ai-site-readiness"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/www\.cnps\.ai\/en\/guides\/uae-ksa-edge-ai-site-readiness"/);
  assert.doesNotMatch(html, /rel="alternate" hreflang="zh/);
  assert.match(arHtml, /lang="ar"/);
  assert.match(arHtml, /dir="rtl"/);
  assert.doesNotMatch(arHtml, /http-equiv="refresh"/);
  assert.match(arHtml, /<h1 class="wide">جاهزية موقع الذكاء الاصطناعي الطرفي في الإمارات\/السعودية قبل اختيار الصندوق<\/h1>/);
  assert.match(arHtml, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/ar\/guides\/uae-ksa-edge-ai-site-readiness">/);
  assert.doesNotMatch(arHtml, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\//);
  assert.match(arHtml, /hreflang="en" href="https:\/\/www\.cnps\.ai\/en\/guides\/uae-ksa-edge-ai-site-readiness"/);
  assert.match(arHtml, /hreflang="ar" href="https:\/\/www\.cnps\.ai\/ar\/guides\/uae-ksa-edge-ai-site-readiness"/);
  assert.match(arHtml, /hreflang="x-default" href="https:\/\/www\.cnps\.ai\/en\/guides\/uae-ksa-edge-ai-site-readiness"/);
  assert.match(arHtml, /href="\/ar\/resources\/edge-ai-survey"/);
  assert.match(arHtml, /href="\/ar\/wholesale"/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/en\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/ar\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/zh\/guides\/uae-ksa-edge-ai-site-readiness/);
  assert.ok(fs.existsSync(zhPath) && /http-equiv="refresh"/.test(fs.readFileSync(zhPath, 'utf8')));
  assert.doesNotMatch(html, /add to cart|buy now/i);
  assert.doesNotMatch(html, /latency of \d|within \d+\s*ms/i);
});

test('resources hub lists edge readiness on EN and AR', () => {
  const enPath = 'dist/en/resources.html';
  const arPath = 'dist/ar/resources.html';
  if (!fs.existsSync(enPath) || !fs.existsSync(arPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const en = fs.readFileSync(enPath, 'utf8');
  const ar = fs.readFileSync(arPath, 'utf8');
  assert.match(en, /href="\/en\/guides\/uae-ksa-edge-ai-site-readiness"/);
  assert.match(en, /UAE\/KSA edge AI site readiness before you pick a box/);
  assert.match(ar, /href="\/ar\/guides\/uae-ksa-edge-ai-site-readiness"/);
  assert.match(ar, /جاهزية موقع الذكاء الاصطناعي الطرفي في الإمارات\/السعودية قبل اختيار الصندوق/);
});

test('Vercel ZH guide catch-all requires a slug and does not match the hub', () => {
  // Vercel :path* is zero-or-more segments, so /zh/guides/:path* also matches /zh/guides.
  // :slug is exactly one segment, so the inventory hub is served and only missing ZH articles 307 to EN.
  function vercelMatches(source, pathname) {
    const regex = new RegExp('^' + source
      .replace(/\/:([A-Za-z0-9_]+)\*/g, '(?:/.*)?')
      .replace(/\/:([A-Za-z0-9_]+)\+/g, '/.+')
      .replace(/\/:([A-Za-z0-9_]+)/g, '/[^/]+')
      + '$');
    return regex.test(pathname);
  }
  assert.equal(vercelMatches('/zh/guides/:path*', '/zh/guides'), true);
  assert.equal(vercelMatches('/zh/guides/:slug', '/zh/guides'), false);
  assert.equal(vercelMatches('/zh/guides/:slug', '/zh/guides/uae-ksa-edge-ai-site-readiness'), true);
  const rule = vercel.redirects.find((r) => r.source === '/zh/guides/:slug');
  assert.ok(rule, 'slug-only ZH article redirect');
  assert.equal(rule.destination, '/en/guides/:slug');
  assert.equal(rule.permanent, false);
  assert.equal(vercelMatches(rule.source, '/zh/guides'), false);
  assert.equal(vercelMatches(rule.source, '/zh/guides/uae-ksa-edge-ai-site-readiness'), true);
});

test('Chinese guides hub is a real inventory page, not a redirect to EN', () => {
  const zhPath = 'dist/zh/guides.html';
  const enPath = 'dist/en/guides.html';
  const sitemapPath = 'dist/sitemap.xml';
  if (!fs.existsSync(zhPath) || !fs.existsSync(enPath) || !fs.existsSync(sitemapPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const zh = fs.readFileSync(zhPath, 'utf8');
  const en = fs.readFileSync(enPath, 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert.match(zh, /lang="zh-CN"/);
  assert.doesNotMatch(zh, /http-equiv="refresh"/);
  assert.match(zh, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/zh\/guides">/);
  assert.doesNotMatch(zh, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\/guides">/);
  assert.match(zh, /hreflang="en" href="https:\/\/www\.cnps\.ai\/en\/guides"/);
  assert.match(zh, /hreflang="ar" href="https:\/\/www\.cnps\.ai\/ar\/guides"/);
  assert.match(zh, /hreflang="zh-CN" href="https:\/\/www\.cnps\.ai\/zh\/guides"/);
  assert.match(en, /hreflang="zh-CN" href="https:\/\/www\.cnps\.ai\/zh\/guides"/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/zh\/guides</);
  assert.match(zh, /href="\/en\/guides\/uae-ksa-edge-ai-site-readiness"/);
  assert.match(zh, /UAE\/KSA edge AI site readiness before you pick a box/);
});
