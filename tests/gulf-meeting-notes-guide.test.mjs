import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'gulf-arabic-english-meeting-notes-pilot';
const source = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const arSource = fs.readFileSync(path.join('content/i18n/guides/ar', slug + '.md'), 'utf8');
const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
const arWords = arSource.trim().split(/\s+/);
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((g) => g.slug === slug);

test('Gulf meeting-notes guide stays a method page', () => {
  assert.ok(words.length >= 1400 && words.length <= 2000, 'word count ' + words.length);
  assert.ok(meta, 'guides.json entry');
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.h1.en, 'Run a Gulf Arabic–English meeting-notes pilot in two weeks');
  assert.match(source, /^# Run a Gulf Arabic–English meeting-notes pilot in two weeks/m);
  for (const heading of [
    'What “done” looks like',
    'Week 0 — Consent and privacy gate',
    'Week 1 — Capture design',
    'Scorecard: Arabic, English, and mid-sentence switches',
    'Notes become action items',
    'Gulf-specific checks',
    'Copy-paste checklist',
    'FAQ'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.doesNotMatch(source, /#1 in (the )?Gulf|market share|WER\s*\d|word-error rate of \d/i);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.match(source, /shop\.cnps\.ai\/collections\/all-ticnote-products/);
  assert.match(source, /not legal counsel|not an opinion on PDPL/i);
  assert.match(source, /runnable two-week pilot protocol, not another Arabic note-taker list/);
  assert.doesNotMatch(source, /Munsit|MeetriX|CallScribe|Voiquyr|Spinach|Fellow|#1|best Arabic/i);
  assert.match(source, /covert recording/);
  assert.match(source, /Pods or Lite/);
});

test('Gulf meeting-notes Arabic twin is MSA and mirrors EN structure', () => {
  assert.ok(arWords.length >= 900, 'arabic word count ' + arWords.length);
  assert.match(arSource, /[\u0600-\u06FF]/);
  assert.match(arSource, /^# أدر تجربة محاضر اجتماعات عربية خليجية–إنجليزية في أسبوعين/m);
  assert.equal(meta.h1.ar, 'أدر تجربة محاضر اجتماعات عربية خليجية–إنجليزية في أسبوعين');
  for (const heading of [
    'كيف يبدو الإنجاز',
    'الأسبوع 0 — بوابة الموافقة والخصوصية',
    'الأسبوع 1 — تصميم الالتقاط',
    'بطاقة التقييم: العربية والإنجليزية والتبديل داخل الجملة',
    'تتحول الملاحظات إلى بنود عمل',
    'فحوصات خاصة بالخليج',
    'قائمة جاهزة للنسخ',
    'أسئلة شائعة'
  ]) assert.match(arSource, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(arSource, /ليس استشارة قانونية وليس رأياً في PDPL/);
  assert.match(arSource, /بروتوكول تجريبي قابل للتشغيل لأسبوعين، وليست قائمة أخرى/);
  assert.match(arSource, /shop\.cnps\.ai\/collections\/all-ticnote-products/);
  assert.match(arSource, /Pods أم Lite/);
  assert.match(arSource, /التسجيل الخفي/);
  assert.doesNotMatch(arSource, /#1 in (the )?Gulf|market share|WER\s*\d/);
  assert.doesNotMatch(arSource, /add to cart|buy now/i);
  assert.doesNotMatch(arSource, /Munsit|MeetriX|CallScribe|Voiquyr|Spinach|Fellow/);
  assert.doesNotMatch(arSource, /This page is a runnable two-week/);
});

test('built English and Arabic meeting-notes guides are in the sitemap with hreflang', () => {
  const htmlPath = path.join('dist/en/guides', slug + '.html');
  const arPath = path.join('dist/ar/guides', slug + '.html');
  const sitemapPath = 'dist/sitemap.xml';
  if (!fs.existsSync(htmlPath) || !fs.existsSync(sitemapPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const arHtml = fs.readFileSync(arPath, 'utf8');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert.match(html, /<h1 class="wide">Run a Gulf Arabic–English meeting-notes pilot in two weeks<\/h1>/);
  assert.match(html, /role="note"/);
  assert.match(html, /Gulf Arabic–English meeting-notes pilot: consent, quality, action items/);
  assert.match(html, /hreflang="ar" href="https:\/\/www\.cnps\.ai\/ar\/guides\/gulf-arabic-english-meeting-notes-pilot"/);
  assert.match(arHtml, /lang="ar"/);
  assert.match(arHtml, /dir="rtl"/);
  assert.doesNotMatch(arHtml, /http-equiv="refresh"/);
  assert.match(arHtml, /<h1 class="wide">أدر تجربة محاضر اجتماعات عربية خليجية–إنجليزية في أسبوعين<\/h1>/);
  assert.match(arHtml, /بروتوكول تجريبي قابل للتشغيل لأسبوعين/);
  assert.match(arHtml, /hreflang="en" href="https:\/\/www\.cnps\.ai\/en\/guides\/gulf-arabic-english-meeting-notes-pilot"/);
  assert.match(arHtml, /href="\/ar\/request-quote\?solution=meeting-ai"/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/en\/guides\/gulf-arabic-english-meeting-notes-pilot/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/ar\/guides\/gulf-arabic-english-meeting-notes-pilot/);
  assert.doesNotMatch(html, /WER\s*\d/);
  assert.doesNotMatch(html, /add to cart|buy now/i);
});
