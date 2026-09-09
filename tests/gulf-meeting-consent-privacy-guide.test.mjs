import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'gulf-meeting-consent-and-privacy-test';
const source = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const arSource = fs.readFileSync(path.join('content/i18n/guides/ar', slug + '.md'), 'utf8');
const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
const arWords = arSource.trim().split(/\s+/);
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((g) => g.slug === slug);
const vercel = fs.readFileSync('vercel.json', 'utf8');
const pilot = fs.readFileSync('content/i18n/guides/en/gulf-arabic-english-meeting-notes-pilot.md', 'utf8');

test('Gulf consent/privacy guide stays a method page', () => {
  assert.ok(words.length >= 1000 && words.length <= 1500, 'word count ' + words.length);
  assert.ok(meta, 'guides.json entry');
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.title.en, 'Consent and privacy test before a Gulf meeting-recorder rollout');
  assert.equal(meta.h1.en, 'Consent and privacy test before a Gulf meeting-recorder rollout');
  assert.match(meta.description.en, /Freeze invite disclosure, a start script, stop-on-objection/);
  assert.match(source, /^# Consent and privacy test before a Gulf meeting-recorder rollout/m);
  assert.match(source, /Before rolling out TicNote or any meeting recorder in a Gulf enterprise/);
  assert.match(source, /This is an operating protocol, not a PDPL opinion/);
  for (const heading of [
    'Why hardware needs the same bar as meeting bots',
    'Test pack to freeze before first recording',
    'Invite language and start-of-meeting script',
    'Objection and late-join handling',
    'Access, retention, and deletion proof',
    'Vendor questions before you capture',
    'Open-ear devices are a special case',
    'Pass or fail: ready to roll out devices',
    'After the privacy test'
  ]) assert.match(source, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(source, /examples?, not official translations/i);
  assert.match(source, /Invite example \(English\)/);
  assert.match(source, /Invite example \(Arabic\) — example only, not an official translation/);
  assert.match(source, /Start-of-meeting script example \(English\)/);
  assert.match(source, /Start-of-meeting script example \(Arabic\) — example only, not an official translation/);
  assert.match(source, /قد يُسجَّل هذا الاجتماع/);
  assert.match(source, /سنبدأ التسجيل لإعداد ملاحظات داخلية/);
  assert.match(source, /shop\.cnps\.ai\/blogs\/news\/ticnote-lite-vs-pods-wifi-uae-meetings-lectures/);
  assert.match(source, /www\.cnps\.ai\/en\/guides\/gulf-arabic-english-meeting-notes-pilot/);
  assert.match(source, /\[contact CNPS\]\(\/contact\)/);
  assert.match(source, /\[request a quotation\]\(\/request-quote\?solution=meeting-ai\)/);
  assert.match(source, /\[Equip my team\]\(\/products\)/);
  assert.match(source, /not legal counsel|not an opinion on PDPL/i);
  assert.match(source, /does not rank SKUs|does not rank hardware/i);
  assert.match(source, /does not run checkout|does not take payment/i);
  assert.match(source, /visible capture/);
  assert.match(source, /stop-on-objection|An objection ends capture/i);
  assert.match(source, /Residency/);
  assert.match(source, /Subprocessors/);
  assert.match(source, /Training use/);
  assert.match(source, /Export/);
  assert.doesNotMatch(source, /#1 in (the )?Gulf|market share|WER\s*\d|word-error rate of \d/i);
  assert.doesNotMatch(source, /add to cart|buy now/i);
  assert.doesNotMatch(source, /PDPL (requires|mandates|prohibits|applies)|complies with PDPL|PDPL-compliant/i);
  assert.doesNotMatch(source, /Munsit|MeetriX|CallScribe|Voiquyr|Spinach|Fellow|#1|best Arabic/i);
  assert.match(pilot, /\/guides\/gulf-meeting-consent-and-privacy-test/);
  assert.match(vercel, /"source": "\/zh\/guides\/:path\*"/);
  assert.match(vercel, /"destination": "\/en\/guides\/:path\*"/);
  assert.doesNotMatch(vercel, /"source": "\/ar\/guides\/:path\*"/);
  assert.doesNotMatch(vercel, /"source": "\/ar\/guides"/);
});

test('Gulf consent/privacy Arabic twin is MSA and mirrors EN structure', () => {
  assert.ok(arWords.length >= 700, 'arabic word count ' + arWords.length);
  assert.match(arSource, /[\u0600-\u06FF]/);
  assert.match(arSource, /^# اختبار الموافقة والخصوصية قبل طرح مسجّل اجتماعات في الخليج/m);
  assert.equal(meta.h1.ar, 'اختبار الموافقة والخصوصية قبل طرح مسجّل اجتماعات في الخليج');
  for (const heading of [
    'لماذا تحتاج الأجهزة إلى المعيار نفسه لمسجّلات الاجتماعات البرمجية',
    'حزمة الاختبار التي تُثبَّت قبل أول تسجيل',
    'لغة الدعوة ونص بداية الاجتماع',
    'التعامل مع الاعتراض والانضمام المتأخر',
    'الوصول والاحتفاظ وإثبات الحذف',
    'أسئلة المورّد قبل الالتقاط',
    'الأجهزة المفتوحة الأذن حالة خاصة',
    'ناجح أو راسب: الجاهزية لطرح الأجهزة',
    'بعد اختبار الخصوصية'
  ]) assert.match(arSource, new RegExp('^## ' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm'));
  assert.match(arSource, /بروتوكول تشغيلي، وليس رأياً في PDPL/);
  assert.match(arSource, /قد يُسجَّل هذا الاجتماع/);
  assert.match(arSource, /سنبدأ التسجيل لإعداد ملاحظات داخلية/);
  assert.match(arSource, /مثال فقط، وليست ترجمة رسمية/);
  assert.match(arSource, /shop\.cnps\.ai\/blogs\/news\/ticnote-lite-vs-pods-wifi-uae-meetings-lectures/);
  assert.match(arSource, /\[تواصل مع CNPS\]\(\/contact\)/);
  assert.match(arSource, /\[اطلب عرض سعر\]\(\/request-quote\?solution=meeting-ai\)/);
  assert.match(arSource, /\[تجهيز فريقي\]\(\/products\)/);
  assert.match(arSource, /\[تجربة محاضر اجتماعات عربية خليجية–إنجليزية\]\(\/guides\/gulf-arabic-english-meeting-notes-pilot\)/);
  assert.match(arSource, /Residency/);
  assert.match(arSource, /Subprocessors/);
  assert.doesNotMatch(arSource, /add to cart|buy now/i);
  assert.doesNotMatch(arSource, /PDPL (requires|mandates|prohibits|applies)|complies with PDPL|PDPL-compliant/i);
  assert.doesNotMatch(arSource, /Before rolling out TicNote or any meeting recorder in a Gulf enterprise/);
});

test('built English and Arabic consent/privacy guides are in the sitemap with hreflang', () => {
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
  assert.match(html, /<h1 class="wide">Consent and privacy test before a Gulf meeting-recorder rollout<\/h1>/);
  assert.match(html, /role="note"/);
  assert.match(html, /Freeze invite disclosure, a start script, stop-on-objection/);
  assert.match(html, /shop\.cnps\.ai\/blogs\/news\/ticnote-lite-vs-pods-wifi-uae-meetings-lectures/);
  assert.match(html, /href="\/en\/contact"/);
  assert.match(html, /href="\/en\/request-quote\?solution=meeting-ai"/);
  assert.match(html, /href="\/en\/products"/);
  assert.match(html, /hreflang="ar" href="https:\/\/www\.cnps\.ai\/ar\/guides\/gulf-meeting-consent-and-privacy-test"/);
  assert.match(arHtml, /lang="ar"/);
  assert.match(arHtml, /dir="rtl"/);
  assert.doesNotMatch(arHtml, /http-equiv="refresh"/);
  assert.match(arHtml, /<h1 class="wide">اختبار الموافقة والخصوصية قبل طرح مسجّل اجتماعات في الخليج<\/h1>/);
  assert.match(arHtml, /href="\/ar\/contact"/);
  assert.match(arHtml, /href="\/ar\/request-quote\?solution=meeting-ai"/);
  assert.match(arHtml, /hreflang="en" href="https:\/\/www\.cnps\.ai\/en\/guides\/gulf-meeting-consent-and-privacy-test"/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/en\/guides\/gulf-meeting-consent-and-privacy-test/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/ar\/guides\/gulf-meeting-consent-and-privacy-test/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/zh\/guides\/gulf-meeting-consent-and-privacy-test/);
  assert.ok(fs.existsSync(zhPath) && /http-equiv="refresh"/.test(fs.readFileSync(zhPath, 'utf8')));
  assert.doesNotMatch(html, /WER\s*\d/);
  assert.doesNotMatch(html, /add to cart|buy now/i);
});
