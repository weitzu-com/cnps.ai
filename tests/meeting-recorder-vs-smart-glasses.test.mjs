import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'meeting-recorder-vs-smart-glasses-bilingual-notes';
const source = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const arSource = fs.readFileSync(path.join('content/i18n/guides/ar', slug + '.md'), 'utf8');
const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
const arWords = arSource.trim().split(/\s+/);
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((g) => g.slug === slug);
const journal = JSON.parse(fs.readFileSync('content/i18n/blogs.json', 'utf8'));
const meetingPost = journal.posts.find((p) => p.slug === 'meeting-ai-measure-the-finished-note');
const glassesPost = journal.posts.find((p) => p.slug === 'smart-glasses-one-field-task');

test('recorder vs glasses guide stays a method compare', () => {
  assert.ok(words.length >= 1000 && words.length <= 1500, 'word count ' + words.length);
  assert.ok(meta, 'guides.json entry');
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.title.en, 'Meeting recorder vs smart glasses for bilingual meeting notes');
  assert.equal(meta.h1.en, 'Meeting recorder vs smart glasses for bilingual meeting notes');
  assert.match(meta.description.en, /Choose by form and consent optics first/);
  assert.match(source, /^# Meeting recorder vs smart glasses for bilingual meeting notes/m);
  assert.match(source, /Choose by form and consent optics first: a visible table or open-ear recorder/);
  assert.match(source, /Bilingual quality is proven on a scorecard, not by form factor/);
  assert.match(source, /Run the Gulf meeting-notes pilot before bulk buy/);
  for (const heading of [
    'What both must do (consent → capture → note → actions)',
    'Decision matrix: visibility, hands-free, guests, lectures, on-the-go',
    'Bilingual and code-switch: form is not quality',
    'Consent optics: table device versus wearable',
    'When to pilot which form first',
    'FAQ',
    'Next step: Equip my team or run the Gulf pilot'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(source, /\*\*Consent\.\*\*/);
  assert.match(source, /\*\*Capture\.\*\*/);
  assert.match(source, /\*\*Note\.\*\*/);
  assert.match(source, /\*\*Actions\.\*\*/);
  assert.match(source, /Internal stand-up/);
  assert.match(source, /Customer or partner guests/);
  assert.match(source, /Lecture or one main speaker/);
  assert.match(source, /On-the-go between rooms/);
  assert.match(source, /Hands-free at a board or site/);
  assert.match(source, /Mixed Gulf Arabic–English/);
  assert.match(source, /form is not quality|Form does not decide quality/i);
  assert.match(source, /www\.cnps\.ai\/en\/guides\/gulf-arabic-english-meeting-notes-pilot/);
  assert.match(source, /www\.cnps\.ai\/en\/guides\/gulf-meeting-consent-and-privacy-test/);
  assert.match(source, /shop\.cnps\.ai\/collections\/all-ticnote-products/);
  assert.match(source, /\[Equip my team\]\(\/products\)/);
  assert.match(source, /\[contact CNPS\]\(\/contact\)/);
  assert.match(source, /\[request a quotation\]\(\/request-quote\?solution=meeting-ai\)/);
  assert.match(source, /does not run checkout|does not take payment/);
  assert.match(source, /not a brand league table/);
  assert.match(source, /does not invent microphone or battery scores/);
  assert.match(source, /not legal counsel and not an opinion on PDPL/);
  assert.match(source, /category level/);
  assert.doesNotMatch(source, /#1 in (the )?Gulf|market share|WER\s*\d|word-error rate of \d/i);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.doesNotMatch(source, /battery of \d|pickup of \d+\s*m|mic score/i);
  assert.doesNotMatch(source, /Munsit|MeetriX|CallScribe|Voiquyr|Spinach|Fellow|#1|best Arabic/i);
  assert.match(meetingPost.locales.en.body, /\/en\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes/);
  assert.match(meetingPost.locales.zh.body, /\/en\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes/);
  assert.match(meetingPost.locales.ar.body, /\/ar\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes/);
  assert.match(glassesPost.locales.en.body, /\/en\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes/);
  assert.match(glassesPost.locales.ar.body, /\/ar\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes/);
});

test('recorder vs glasses Arabic twin is MSA and mirrors EN structure', () => {
  assert.ok(arWords.length >= 700, 'arabic word count ' + arWords.length);
  assert.match(arSource, /[\u0600-\u06FF]/);
  assert.match(arSource, /^# مسجّل الاجتماعات مقابل النظارات الذكية لمحاضر ثنائية اللغة/m);
  assert.equal(meta.h1.ar, 'مسجّل الاجتماعات مقابل النظارات الذكية لمحاضر ثنائية اللغة');
  for (const heading of [
    'ما يجب أن يؤديه كلا الشكلين (الموافقة → الالتقاط → المحضر → الإجراءات)',
    'مصفوفة القرار: الظهور، وتحرير اليدين، والضيوف، والمحاضرات، والتنقّل',
    'الثنائية اللغوية والتبديل داخل الجملة: الشكل ليس الجودة',
    'مظهر الموافقة: جهاز الطاولة مقابل الجهاز القابل للارتداء',
    'متى تجرّب أي شكل أولاً',
    'أسئلة شائعة',
    'الخطوة التالية: جهّز فريقي أو أدر التجربة الخليجية'
  ]) assert.match(arSource, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(arSource, /\*\*الموافقة\.\*\*/);
  assert.match(arSource, /\*\*الالتقاط\.\*\*/);
  assert.match(arSource, /\*\*المحضر\.\*\*/);
  assert.match(arSource, /\*\*الإجراءات\.\*\*/);
  assert.match(arSource, /وليست كتالوجاً، ولا جدولاً لترتيب العلامات، ولا مسار دفع/);
  assert.match(arSource, /ولا تخترع درجات للميكروفون أو البطارية/);
  assert.match(arSource, /\[تجربة محاضر اجتماعات عربية خليجية–إنجليزية\]\(\/guides\/gulf-arabic-english-meeting-notes-pilot\)/);
  assert.match(arSource, /\[اختبار الموافقة والخصوصية\]\(\/guides\/gulf-meeting-consent-and-privacy-test\)/);
  assert.match(arSource, /shop\.cnps\.ai\/collections\/all-ticnote-products/);
  assert.match(arSource, /\[تجهيز فريقي\]\(\/products\)/);
  assert.match(arSource, /\[تواصل مع CNPS\]\(\/contact\)/);
  assert.match(arSource, /\[اطلب عرض سعر\]\(\/request-quote\?solution=meeting-ai\)/);
  assert.match(arSource, /لا يدير الدفع|لا يأخذ دفعاً/);
  assert.doesNotMatch(arSource, /add to cart|buy now/i);
  assert.doesNotMatch(arSource, /Choose by form and consent optics first: a visible table/);
  assert.doesNotMatch(arSource, /WER\s*\d/);
});

test('built English and Arabic recorder vs glasses guides are in the sitemap with hreflang', () => {
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
  assert.match(html, /<h1 class="wide">Meeting recorder vs smart glasses for bilingual meeting notes<\/h1>/);
  assert.match(html, /role="note"/);
  assert.match(html, /Choose by form and consent optics first/);
  assert.match(html, /shop\.cnps\.ai\/collections\/all-ticnote-products/);
  assert.match(html, /href="\/en\/products"/);
  assert.match(html, /href="\/en\/contact"/);
  assert.match(html, /href="\/en\/request-quote\?solution=meeting-ai"/);
  assert.match(html, /lang="en"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes">/);
  assert.match(html, /hreflang="ar" href="https:\/\/www\.cnps\.ai\/ar\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes"/);
  assert.match(html, /hreflang="en" href="https:\/\/www\.cnps\.ai\/en\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes"/);
  assert.doesNotMatch(html, /rel="alternate" hreflang="zh/);
  assert.match(arHtml, /lang="ar"/);
  assert.match(arHtml, /dir="rtl"/);
  assert.doesNotMatch(arHtml, /http-equiv="refresh"/);
  assert.match(arHtml, /<h1 class="wide">مسجّل الاجتماعات مقابل النظارات الذكية لمحاضر ثنائية اللغة<\/h1>/);
  assert.match(arHtml, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/ar\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes">/);
  assert.doesNotMatch(arHtml, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/en\//);
  assert.match(arHtml, /hreflang="en" href="https:\/\/www\.cnps\.ai\/en\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes"/);
  assert.match(arHtml, /hreflang="ar" href="https:\/\/www\.cnps\.ai\/ar\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes"/);
  assert.match(arHtml, /href="\/ar\/products"/);
  assert.match(arHtml, /href="\/ar\/contact"/);
  assert.match(arHtml, /href="\/ar\/request-quote\?solution=meeting-ai"/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/en\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/ar\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/zh\/guides\/meeting-recorder-vs-smart-glasses-bilingual-notes/);
  assert.ok(fs.existsSync(zhPath) && /http-equiv="refresh"/.test(fs.readFileSync(zhPath, 'utf8')));
  assert.doesNotMatch(html, /add to cart|buy now/i);
  assert.doesNotMatch(html, /WER\s*\d/);
});
