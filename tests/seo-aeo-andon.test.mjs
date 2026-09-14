import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
}

function onPageH2s(html) {
  const article = html.match(/<article class="prose">([\s\S]*?)<\/article>/)?.[1] || '';
  return [...article.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
    m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  );
}

function visibleText(html) {
  return html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

test('homepages and resource hubs link to the locale guides hub', () => {
  for (const loc of ['en', 'zh', 'ar']) {
    const home = path.join('dist', loc + '.html');
    const resources = path.join('dist', loc, 'resources.html');
    if (!fs.existsSync(home) || !fs.existsSync(resources)) {
      assert.ok(true, 'build output not present; skipped');
      return;
    }
    const homeHtml = fs.readFileSync(home, 'utf8');
    const resourcesHtml = fs.readFileSync(resources, 'utf8');
    const hub = `/${loc}/guides`;
    assert.match(homeHtml, new RegExp(`<nav class="main-nav"[^>]*>[\\s\\S]*?href="${hub}"[\\s\\S]*?</nav>`));
    assert.match(homeHtml, new RegExp(`href="${hub}"[^>]*>[^<]*(See all guides|查看全部方法指南|عرض كل الأدلة)`));
    assert.match(resourcesHtml, new RegExp(`href="${hub}"[^>]*>[^<]*(See all guides|查看全部方法指南|عرض كل الأدلة)`));
  }
});

test('FAQ pages emit FAQPage JSON-LD that mirrors on-page Q&As only', () => {
  for (const loc of ['en', 'zh', 'ar']) {
    const file = path.join('dist', loc, 'faq.html');
    if (!fs.existsSync(file)) {
      assert.ok(true, 'build output not present; skipped');
      return;
    }
    const html = fs.readFileSync(file, 'utf8');
    const headings = onPageH2s(html);
    assert.equal(headings.length, 5, loc + ' on-page questions');
    const faq = jsonLdBlocks(html).find((b) => b['@type'] === 'FAQPage');
    assert.ok(faq, loc + ' FAQPage');
    const names = faq.mainEntity.map((q) => q.name);
    assert.deepEqual(names, headings);
    const pageText = visibleText(html);
    for (const q of faq.mainEntity) {
      assert.equal(q['@type'], 'Question');
      assert.equal(q.acceptedAnswer['@type'], 'Answer');
      assert.ok(q.acceptedAnswer.text.length > 20, loc + ' answer too short: ' + q.name);
      assert.ok(pageText.includes(q.acceptedAnswer.text.slice(0, 40)), loc + ' invented answer: ' + q.name);
    }
  }
});

test('china-export playbook has a single H1 in EN, ZH, and AR', () => {
  for (const loc of ['en', 'zh', 'ar']) {
    const file = path.join('dist', loc, 'resources', 'china-ai-export-playbook.html');
    if (!fs.existsSync(file)) {
      assert.ok(true, 'build output not present; skipped');
      return;
    }
    const html = fs.readFileSync(file, 'utf8');
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim()
    );
    assert.equal(h1s.length, 1, loc + ' h1 count ' + JSON.stringify(h1s));
    assert.doesNotMatch(html, /CNPS\.AI Global Expansion Plan for Chinese AI Applications and Hardware/);
    assert.doesNotMatch(html, /http-equiv="refresh"/);
  }
});

test('FastGPT method pages use Article schema like other method guides', () => {
  const pages = [
    'dist/en/fastgpt/guides/uae-first-pilot-documents-and-workflow.html',
    'dist/ar/fastgpt/guides/uae-first-pilot-documents-and-workflow.html',
    'dist/en/fastgpt/compare/fastgpt-vs-chatgpt-enterprise.html',
    'dist/ar/fastgpt/compare/fastgpt-vs-chatgpt-enterprise.html',
    'dist/en/guides/gulf-arabic-english-meeting-notes-pilot.html'
  ];
  if (!pages.every((p) => fs.existsSync(p))) {
    assert.ok(true, 'build output not present; skipped');
    return;
  }
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    const blocks = jsonLdBlocks(html);
    const types = blocks.map((b) => b['@type']);
    assert.ok(types.includes('Article'), file + ' types ' + types.join(','));
    assert.equal(types.includes('WebPage'), false, file + ' still WebPage');
    if (file.includes('/ar/')) {
      assert.match(html, /hreflang="en"/);
      assert.match(html, /hreflang="x-default" href="https:\/\/www\.cnps\.ai\/en\//);
      assert.match(html, /<link rel="canonical" href="https:\/\/www\.cnps\.ai\/ar\//);
    }
  }
});
