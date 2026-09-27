import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_GA_MEASUREMENT_ID, GA_MEASUREMENT_ID, analyticsSnippet, injectAnalytics, resolveMeasurementId } from '../scripts/lib/analytics.mjs';

const ID = 'G-NXTM719P1Z';
const loader = new RegExp(`<script async src="https://www\\.googletagmanager\\.com/gtag/js\\?id=${ID}"></script>`);
const config = new RegExp(`gtag\\('config','${ID}'\\)`);
const count = (html, pattern) => (html.match(new RegExp(pattern, 'g')) || []).length;

test('production measurement ID is the www.cnps.ai GA4 stream', () => {
  assert.equal(DEFAULT_GA_MEASUREMENT_ID, ID);
  assert.equal(resolveMeasurementId({}), ID);
  assert.equal(resolveMeasurementId({ GA_MEASUREMENT_ID: '' }), ID);
  assert.equal(resolveMeasurementId({ GA_MEASUREMENT_ID: ' G-TEST123456 ' }), 'G-TEST123456');
  assert.throws(() => resolveMeasurementId({ GA_MEASUREMENT_ID: 'UA-1234-5' }), /G-XXXXXXXXXX/);
  assert.throws(() => resolveMeasurementId({ GA_MEASUREMENT_ID: 'G-abc"></script>' }), /G-XXXXXXXXXX/);
  if (!process.env.GA_MEASUREMENT_ID) assert.equal(GA_MEASUREMENT_ID, ID);
});

test('snippet is the standard GA4 gtag.js block and nothing else', () => {
  const snippet = analyticsSnippet(ID);
  assert.match(snippet, loader);
  assert.match(snippet, /window\.dataLayer=window\.dataLayer\|\|\[\];function gtag\(\)\{dataLayer\.push\(arguments\);\}/);
  assert.match(snippet, /gtag\('js',new Date\(\)\)/);
  assert.match(snippet, config);
  assert.equal(count(snippet, '<script'), 2);
  assert.doesNotMatch(snippet, /AW-|googleads|doubleclick|facebook|fbq|linkedin|hotjar|clarity/i);
  assert.throws(() => analyticsSnippet('not-an-id'));
});

test('injection goes after <meta charset>, is idempotent and skips redirect stubs', () => {
  const page = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>T</title></head><body></body></html>';
  const once = injectAnalytics(page, ID);
  assert.match(once, new RegExp('<head><meta charset="utf-8"><script async src="https://www\\.googletagmanager\\.com/gtag/js\\?id=' + ID + '"></script>'));
  assert.equal(count(once, 'gtag/js'), 1);
  assert.equal(injectAnalytics(once, ID), once);

  const noCharset = '<html><head><title>T</title></head><body></body></html>';
  assert.match(injectAnalytics(noCharset, ID), /^<html><head><script async src="https:\/\/www\.googletagmanager\.com/);

  const stub = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/en"><title>CNPS.AI</title></head><body><a href="/en">CNPS.AI</a></body></html>';
  assert.equal(injectAnalytics(stub, ID), stub);
  assert.equal(injectAnalytics('plain text without a head', ID), 'plain text without a head');
});

test('built pages load gtag exactly once in every locale and page type', () => {
  const samples = [
    'dist/en.html',
    'dist/zh/solutions.html',
    'dist/ar/products/ticnote.html',
    'dist/en/blogs.html',
    'dist/zh/guides.html',
    'dist/ar/contact.html',
    'dist/en/request-quote.html',
    'dist/zh/fastgpt/contact.html',
    'dist/ar/resources/fastgpt-cnps-global-growth.html',
    'dist/404.html',
    'dist/fastgpt/index.html',
    'dist/resources/fastgpt-cnps-global-growth/index.html',
  ];
  if (!samples.every(p => fs.existsSync(p))) {
    assert.ok(true, 'build output not present; source checks already ran');
    return;
  }
  for (const file of samples) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, loader, file);
    assert.match(html, config, file);
    assert.equal(count(html, 'gtag/js\\?id='), 1, file + ' should load gtag.js once');
    assert.ok(html.indexOf('googletagmanager.com/gtag/js') < html.indexOf('</head>'), file + ' should load gtag in <head>');
  }

  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []);
  for (const file of walk('dist')) {
    const html = fs.readFileSync(file, 'utf8');
    const redirect = /http-equiv="refresh"/.test(html);
    assert.equal(count(html, 'gtag/js\\?id='), redirect ? 0 : 1, file);
  }
});
