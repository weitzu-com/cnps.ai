import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const slug = 'china-ai-export-playbook';
const title = 'China AI export playbook for overseas buyers';
const description =
  'China AI export playbook: freeze the job, pick a pilot package, demand SKU-matched evidence, then enquire — CNPS.AI buyer map to the full research edition.';
const enSource = fs.readFileSync(`content/i18n/reports/${slug}.en.md`, 'utf8');
const zhSource = fs.readFileSync(`content/i18n/reports/${slug}.zh.md`, 'utf8');
const arSource = fs.readFileSync(`content/i18n/reports/${slug}.ar.md`, 'utf8');
const catalog = JSON.parse(fs.readFileSync('content/i18n/catalog.json', 'utf8'));
const enMeta = catalog.en.resources.find((r) => r.slug === slug);
const zhMeta = catalog.zh.resources.find((r) => r.slug === slug);
const arMeta = catalog.ar.resources.find((r) => r.slug === slug);

function htmlH1s(html) {
  return [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) =>
    m[1].replace(/<[^>]+>/g, '').trim()
  );
}

test('EN playbook catalog ships buyer-intent title and meta, not translated-edition copy', () => {
  assert.equal(enMeta.title, title);
  assert.equal(enMeta.description, description);
  assert.doesNotMatch(enMeta.title, /\| CNPS\.AI/);
  assert.doesNotMatch(enMeta.description, /Complete translated edition/i);
  assert.equal(zhMeta.title, '中国 AI：CNPS 全球拓展行动方案');
  assert.equal(arMeta.title, 'الذكاء الاصطناعي الصيني: خطة CNPS للتوسع العالمي');
});

test('EN first-screen module sits above retained V22 long report', () => {
  const v22 = enSource.indexOf('# CNPS.AI Global Expansion Plan for Chinese AI Applications and Hardware');
  const firstScreen = enSource.indexOf('## Start here (first screen)');
  assert.ok(firstScreen >= 0, 'first-screen heading');
  assert.ok(v22 > firstScreen, 'V22 H1 after first screen');
  assert.match(enSource.slice(0, v22), /^Use this playbook to turn a China-origin AI interest/);
  assert.match(enSource, /## Page 01 \| First principles: why buyers place orders/);
  assert.match(enSource, /## Page 32 \| Decision checklist, publishing, and maintenance/);
  assert.equal((enSource.match(/<!-- pagebreak -->/g) || []).length, 31);
  for (let n = 1; n <= 32; n++) {
    const id = String(n).padStart(2, '0');
    assert.match(enSource, new RegExp(`<a id="page-${id}"></a>`));
  }
  const h1s = [...enSource.matchAll(/^# .+$/gm)].map((m) => m[0]);
  assert.deepEqual(h1s, ['# CNPS.AI Global Expansion Plan for Chinese AI Applications and Hardware']);
  assert.match(enSource, /https:\/\/www\.cnps\.ai\/en\/resources\/ai-procurement-checklist/);
  assert.match(enSource, /https:\/\/www\.cnps\.ai\/en\/guides\/china-to-gulf-ai-recording-sourcing/);
  assert.match(enSource, /https:\/\/www\.cnps\.ai\//);
  assert.match(enSource, /https:\/\/shop\.cnps\.ai\/collections\/all-ticnote-products/);
  assert.match(enSource, /https:\/\/www\.cnps\.ai\/en\/request-quote/);
  assert.doesNotMatch(enSource, /#1 in (the )?Gulf|market share|WER\s*\d|word-error rate of \d/i);
  assert.doesNotMatch(enSource.slice(0, v22), /\b\d{2,}\s*%\s*(accuracy|win rate)/i);
});

test('ZH and AR retain V22 bodies without invented first-screen translations', () => {
  assert.match(zhSource, /^# CNPS\.AI 中国 AI 应用与硬件出海方案/m);
  assert.match(arSource, /^# خطة CNPS\.AI للتوسع الدولي في تطبيقات الذكاء الاصطناعي الصينية وأجهزتها/m);
  assert.doesNotMatch(zhSource, /## Start here \(first screen\)/);
  assert.doesNotMatch(arSource, /## Start here \(first screen\)/);
  assert.match(zhSource, /## 第 01 页/);
  assert.match(arSource, /## الصفحة 01 /);
  assert.equal((zhSource.match(/<!-- pagebreak -->/g) || []).length, 31);
  assert.equal((arSource.match(/<!-- pagebreak -->/g) || []).length, 31);
});

test('built EN playbook uses new title/meta, first screen, single H1, and chapter TOC', () => {
  const en = path.join('dist/en/resources', slug + '.html');
  const zh = path.join('dist/zh/resources', slug + '.html');
  const ar = path.join('dist/ar/resources', slug + '.html');
  if (![en, zh, ar].every((p) => fs.existsSync(p))) {
    assert.ok(true, 'build output not present; source checks already ran');
    return;
  }
  const html = fs.readFileSync(en, 'utf8');
  const zhHtml = fs.readFileSync(zh, 'utf8');
  const arHtml = fs.readFileSync(ar, 'utf8');
  assert.match(html, new RegExp(`<title>${title} \\| CNPS\\.AI</title>`));
  assert.match(html, new RegExp(`<meta name="description" content="${description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<meta property="og:title" content="${title} \\| CNPS\\.AI">`));
  assert.match(html, new RegExp(`<meta property="og:description" content="${description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.doesNotMatch(html, /Complete translated edition/i);
  const h1s = htmlH1s(html);
  assert.deepEqual(h1s, [title]);
  assert.match(html, /<h2 id="[^"]+">Start here \(first screen\)<\/h2>/);
  assert.match(html, /href="https:\/\/www\.cnps\.ai\/en\/resources\/ai-procurement-checklist"/);
  assert.match(html, /href="https:\/\/www\.cnps\.ai\/en\/guides\/china-to-gulf-ai-recording-sourcing"/);
  assert.match(html, /href="\/en"/);
  assert.match(html, /href="https:\/\/shop\.cnps\.ai\/collections\/all-ticnote-products"/);
  assert.match(html, /href="https:\/\/www\.cnps\.ai\/en\/request-quote"/);
  assert.match(html, /class="report-toolbar"/);
  assert.match(html, /href="\/downloads\/en\/china-ai-export-playbook\.md"/);
  assert.match(html, /href="\/en\/resources\/cnps-ai-revisions"/);
  assert.match(html, /id="page-01"/);
  assert.match(html, /id="page-32"/);
  assert.match(html, />Page 01 \| First principles: why buyers place orders</);
  const toc = html.match(/<nav aria-label="Chapters">([\s\S]*?)<\/nav>/)?.[1] || '';
  assert.match(toc, /Page 01 \|/);
  assert.match(toc, /Page 32 \|/);
  assert.doesNotMatch(toc, /Start here \(first screen\)/);
  assert.doesNotMatch(html, /CNPS\.AI Global Expansion Plan for Chinese AI Applications and Hardware/);
  assert.equal(htmlH1s(zhHtml).length, 1);
  assert.equal(htmlH1s(arHtml).length, 1);
  assert.doesNotMatch(zhHtml, /Start here \(first screen\)/);
  assert.doesNotMatch(arHtml, /Start here \(first screen\)/);
  assert.match(zhHtml, /id="page-01"/);
  assert.match(arHtml, /id="page-01"/);
});
