import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {locales, parityLocales, beachheadLocales, ui, ogLocaleFor, hreflangFor} from '../web/ui.mjs';

const P0 = [
  '',
  '/products',
  '/products/ticnote',
  '/products/ticnote-lite',
  '/products/ticnote-pods-wifi',
  '/products/ticnote-pods-4g',
  '/products/inmo-go3',
  '/products/ticnote-cloud',
  '/contact',
  '/request-quote',
  '/404',
];

const fileFor = (loc, p) => {
  if (!p || p === '/') return `dist/${loc}.html`;
  return `dist/${loc}${p}.html`;
};

test('locales expose parity vs beachhead split', () => {
  assert.deepEqual(locales, ['en', 'zh', 'ar', 'ru', 'kk']);
  assert.deepEqual(parityLocales, ['en', 'zh', 'ar']);
  assert.deepEqual(beachheadLocales, ['ru', 'kk']);
  assert.equal(ogLocaleFor.ru, 'ru_RU');
  assert.equal(ogLocaleFor.kk, 'kk_KZ');
  assert.equal(hreflangFor('kk'), 'kk');
});

test('P0 paths exist for ru and kk with LTR and correct og:locale', () => {
  for (const loc of beachheadLocales) {
    for (const p of P0) {
      const file = fileFor(loc, p);
      assert.ok(fs.existsSync(file), 'missing ' + file);
      const html = fs.readFileSync(file, 'utf8');
      assert.match(html, new RegExp(`<html lang="${loc}" dir="ltr"`));
      assert.match(html, new RegExp(`og:locale" content="${ogLocaleFor[loc]}"`));
      assert.match(html, /data-language="ru"/);
      assert.match(html, /data-language="kk"/);
    }
  }
});

test('non-P0 beachhead paths are not emitted', () => {
  for (const loc of beachheadLocales) {
    for (const p of ['/blogs', '/solutions', '/case-studies', '/resources', '/guides', '/fastgpt', '/about']) {
      assert.ok(!fs.existsSync(fileFor(loc, p)), loc + p + ' must not exist');
    }
  }
});

test('AR product page remains RTL', () => {
  const html = fs.readFileSync('dist/ar/products/ticnote.html', 'utf8');
  assert.match(html, /<html lang="ar" dir="rtl"/);
});

test('sitemap lists ru/kk only for beachhead URLs; no fake ru blogs', () => {
  const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/ru<\/loc>/);
  assert.match(sitemap, /https:\/\/www\.cnps\.ai\/kk\/products\/ticnote-cloud/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/ru\/blogs/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.cnps\.ai\/kk\/solutions/);
});

test('ticnote-cloud beachhead inquire only; no shop Buy', () => {
  for (const loc of ['en', ...beachheadLocales]) {
    const html = fs.readFileSync(fileFor(loc, '/products/ticnote-cloud'), 'utf8');
    const main = html.match(/<main id="main">([\s\S]*?)<\/main>/)[1];
    assert.doesNotMatch(main, /shop\.cnps\.ai\/products\/ticnote-cloud-(?:pro|business)/i);
    assert.match(main, new RegExp(`href="/${loc}/contact"`));
    assert.match(html, /hreflang="ru"/);
    assert.match(html, /hreflang="kk"/);
    // head alternates must not claim zh/ar full pages
    const head = html.slice(0, html.indexOf('</head>'));
    assert.doesNotMatch(head, /hreflang="zh-CN" href="https:\/\/www\.cnps\.ai\/zh\/products\/ticnote-cloud"/);
    assert.doesNotMatch(head, /hreflang="ar" href="https:\/\/www\.cnps\.ai\/ar\/products\/ticnote-cloud"/);
  }
});

test('beachhead lean nav does not point at missing solutions', () => {
  const html = fs.readFileSync('dist/ru.html', 'utf8');
  const nav = html.match(/<nav class="main-nav"[\s\S]*?<\/nav>/)[0];
  assert.match(nav, /\/ru\/products"/);
  assert.match(nav, /\/ru\/products\/ticnote-cloud"/);
  assert.match(nav, /\/ru\/contact"/);
  assert.doesNotMatch(nav, /\/ru\/solutions"/);
  assert.doesNotMatch(nav, /\/ru\/blogs"/);
});

test('ui chrome resolves for all five locales including FAQ heading', () => {
  for (const loc of locales) {
    const t = ui(loc);
    assert.ok(t.faq);
    assert.ok(t.consent);
    assert.ok(t.cloud);
  }
  assert.equal(ui('ru').faq, 'Частые вопросы');
  assert.equal(ui('kk').faq, 'Жиі қойылатын сұрақтар');
});
