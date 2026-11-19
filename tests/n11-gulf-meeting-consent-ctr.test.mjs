import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';

const slug = 'gulf-meeting-consent-and-privacy-test';
const enDesc = 'Gulf meeting-recorder consent method (checked 19 Nov 2026): freeze invite disclosure, start script, stop-on-objection, access and retention, and vendor residency questions.';
const arDesc = 'طريقة موافقة مسجّل اجتماعات الخليج (رُوجعت في 19 نوفمبر 2026): ثبّت الإفصاح في الدعوة، ونص البدء، والتوقف عند الاعتراض، والوصول والاحتفاظ، وأسئلة إقامة البيانات قبل الطرح.';
const source = fs.readFileSync(path.join('content/i18n/guides/en', slug + '.md'), 'utf8');
const arSource = fs.readFileSync(path.join('content/i18n/guides/ar', slug + '.md'), 'utf8');
const guides = JSON.parse(fs.readFileSync('content/i18n/guides.json', 'utf8')).guides;
const meta = guides.find((g) => g.slug === slug);
const assets = JSON.parse(fs.readFileSync('content/i18n/editorial-assets.json', 'utf8'));
const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');

test('N11 Gulf meeting-consent CTR keeps H1/title/slug and dated method metas', () => {
  assert.equal(enDesc.length, 172);
  assert.equal(arDesc.length, 171);
  assert.ok(meta);
  assert.deepEqual(meta.locales, ['en', 'ar']);
  assert.equal(meta.title.en, 'Consent and privacy test before a Gulf meeting-recorder rollout');
  assert.equal(meta.h1.en, 'Consent and privacy test before a Gulf meeting-recorder rollout');
  assert.equal(meta.title.ar, 'اختبار الموافقة والخصوصية قبل طرح مسجّل اجتماعات في الخليج');
  assert.equal(meta.h1.ar, 'اختبار الموافقة والخصوصية قبل طرح مسجّل اجتماعات في الخليج');
  assert.equal(meta.description.en, enDesc);
  assert.equal(meta.description.ar, arDesc);
  assert.match(source, /^# Consent and privacy test before a Gulf meeting-recorder rollout/m);
  assert.match(arSource, /^# اختبار الموافقة والخصوصية قبل طرح مسجّل اجتماعات في الخليج/m);
  assert.match(source, /Re-checked on 19 November 2026; the guidance on this URL is unchanged\./);
  assert.match(arSource, /أُعيد فحص الطريقة في 19 نوفمبر 2026؛ والإرشاد المنشور على هذا الرابط دون تغيير\./);
  const words = source.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
  assert.ok(words.length >= 1000 && words.length <= 1600, 'word count ' + words.length);
});

test('N11 article-body anchors are exact live H1s, each href once, one money CTA', () => {
  assert.equal((source.match(/\/privacy(?![-\w])/g) || []).length, 1);
  assert.match(source, /\[Privacy policy\]\(\/privacy\)/);
  assert.doesNotMatch(source, /\[www\.cnps\.ai\]\(/);
  assert.match(source, /\[TicNote Lite vs Pods WiFi for UAE meetings and lectures\]\(https:\/\/shop\.cnps\.ai\/blogs\/news\/ticnote-lite-vs-pods-wifi-uae-meetings-lectures\)/);
  assert.equal((source.match(/\/solutions\/meeting-ai/g) || []).length, 1);
  assert.match(source, /\[AI meeting devices for teams\]\(\/solutions\/meeting-ai\)/);
  assert.equal((source.match(/\]\(\/products\)/g) || []).length, 1);
  assert.match(source, /\[Meet your next intelligent tool\.\]\(\/products\)/);
  assert.doesNotMatch(source, /\[Equip my team\]\(\/products\)/);
  assert.match(source, /\[Run a Gulf Arabic–English meeting-notes pilot in two weeks\]\(https:\/\/www\.cnps\.ai\/en\/guides\/gulf-arabic-english-meeting-notes-pilot\)/);
  assert.equal((source.match(/\/contact/g) || []).length, 1);
  assert.match(source, /\[Start a conversation with CNPS\.AI\.\]\(\/contact\)/);
  assert.equal((source.match(/\/request-quote/g) || []).length, 1);
  assert.match(source, /\[Request a quotation for devices or a pilot\.\]\(\/request-quote\?solution=meeting-ai\)/);

  assert.equal((arSource.match(/\/privacy(?![-\w])/g) || []).length, 1);
  assert.match(arSource, /\[سياسة الخصوصية\]\(\/privacy\)/);
  assert.doesNotMatch(arSource, /\[www\.cnps\.ai\]\(/);
  assert.match(arSource, /\[TicNote Lite vs Pods WiFi for UAE meetings and lectures\]\(https:\/\/shop\.cnps\.ai\/blogs\/news\/ticnote-lite-vs-pods-wifi-uae-meetings-lectures\)/);
  assert.equal((arSource.match(/\/solutions\/meeting-ai/g) || []).length, 1);
  assert.match(arSource, /\[أجهزة اجتماعات بالذكاء الاصطناعي للفرق\]\(\/solutions\/meeting-ai\)/);
  assert.equal((arSource.match(/\]\(\/products\)/g) || []).length, 1);
  assert.match(arSource, /\[تعرّف إلى أداتك الذكية القادمة\.\]\(\/products\)/);
  assert.doesNotMatch(arSource, /\[تجهيز فريقي\]\(\/products\)/);
  assert.match(arSource, /\[أدر تجربة محاضر اجتماعات عربية خليجية–إنجليزية في أسبوعين\]\(\/guides\/gulf-arabic-english-meeting-notes-pilot\)/);
  assert.equal((arSource.match(/\/contact/g) || []).length, 1);
  assert.match(arSource, /\[ابدأ محادثة مع CNPS\.AI\.\]\(\/contact\)/);
  assert.equal((arSource.match(/\/request-quote/g) || []).length, 1);
  assert.match(arSource, /\[اطلب عرض سعر للأجهزة أو لتجربة تجريبية\.\]\(\/request-quote\?solution=meeting-ai\)/);

  assert.doesNotMatch(source, /PDPL (requires|mandates|prohibits|applies)|complies with PDPL|PDPL-compliant/i);
  assert.doesNotMatch(arSource, /PDPL (requires|mandates|prohibits|applies)|complies with PDPL|PDPL-compliant/i);
  assert.doesNotMatch(source, /accuracy of \d|inquiry count|WER\s*\d/i);
  assert.doesNotMatch(arSource, /accuracy of \d|inquiry count|WER\s*\d/i);
});

test('N11 nine section titles stay unchanged in the markdown (glance is build-injected)', () => {
  const enH2 = [...source.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  const arH2 = [...arSource.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(enH2, [
    'Why hardware needs the same bar as meeting bots',
    'Test pack to freeze before first recording',
    'Invite language and start-of-meeting script',
    'Objection and late-join handling',
    'Access, retention, and deletion proof',
    'Vendor questions before you capture',
    'Open-ear devices are a special case',
    'Pass or fail: ready to roll out devices',
    'After the privacy test',
  ]);
  assert.deepEqual(arH2, [
    'لماذا تحتاج الأجهزة إلى المعيار نفسه لمسجّلات الاجتماعات البرمجية',
    'حزمة الاختبار التي تُثبَّت قبل أول تسجيل',
    'لغة الدعوة ونص بداية الاجتماع',
    'التعامل مع الاعتراض والانضمام المتأخر',
    'الوصول والاحتفاظ وإثبات الحذف',
    'أسئلة المورّد قبل الالتقاط',
    'الأجهزة المفتوحة الأذن حالة خاصة',
    'ناجح أو راسب: الجاهزية لطرح الأجهزة',
    'بعد اختبار الخصوصية',
  ]);
});

test('N11 cover, method glance and guides wiring are in the repo', () => {
  assert.equal(assets[slug].file, slug);
  assert.match(assets[slug].alt.en, /Gulf meeting consent hero/);
  assert.ok(fs.existsSync(`web/assets/editorial/${slug}-1280.webp`));
  assert.ok(fs.existsSync(`web/assets/editorial/${slug}-640.webp`));
  assert.ok(fs.existsSync(`web/assets/resources/${slug}-method-glance.webp`));
  assert.match(build, /if\(g\.slug==='gulf-meeting-consent-and-privacy-test'\)\{const glanceTitle=/);
  assert.match(build, /guideOpts\.socialImage=editorial\.socialImage\('gulf-meeting-consent-and-privacy-test'\)/);
  assert.match(build, /Gulf meeting consent method glance/);
  assert.match(build, /لمحة طريقة موافقة اجتماعات الخليج/);
});

test('built N11 EN/AR pages include glance, editorial og, re-check, and no ZH body', () => {
  const htmlPath = path.join('dist/en/guides', slug + '.html');
  const arPath = path.join('dist/ar/guides', slug + '.html');
  const zhPath = path.join('dist/zh/guides', slug + '.html');
  if (!fs.existsSync(htmlPath) || !fs.existsSync(arPath)) {
    assert.ok(true, 'build output not present; content checks already ran');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const arHtml = fs.readFileSync(arPath, 'utf8');
  assert.match(html, /<h1 class="wide">Consent and privacy test before a Gulf meeting-recorder rollout<\/h1>/);
  assert.match(html, /Gulf meeting consent method glance/);
  assert.match(html, /gulf-meeting-consent-and-privacy-test-method-glance\.webp/);
  assert.match(html, /Re-checked on 19 November 2026/);
  assert.match(html, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/gulf-meeting-consent-and-privacy-test-1280\.webp"/);
  assert.doesNotMatch(html, /assets\/social\.png/);
  const article = html.match(/<article class="prose[^"]*">([\s\S]*?)<\/article>/)[1];
  assert.equal((article.match(/href="\/en\/request-quote/g) || []).length, 1);
  assert.match(arHtml, /لمحة طريقة موافقة اجتماعات الخليج/);
  assert.match(arHtml, /أُعيد فحص الطريقة في 19 نوفمبر 2026/);
  assert.match(arHtml, /og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/gulf-meeting-consent-and-privacy-test-1280\.webp"/);
  assert.ok(fs.existsSync(zhPath) && /http-equiv="refresh"/.test(fs.readFileSync(zhPath, 'utf8')));
  assert.equal(fs.existsSync(path.join('content/i18n/guides/zh', slug + '.md')), false);
});
