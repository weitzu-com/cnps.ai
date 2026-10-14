import test from 'node:test';
import assert from 'node:assert/strict';
import { createWasionPageHandler } from '../api/crm-wasion-demo-page.js';
import { guardPrivateRequest } from '../server/crm-boundary.mjs';
import { createWasionSearchHandler } from '../server/wasion-demo.mjs';
import { WASION_STYLES, wasionStyleBase } from '../server/wasion-demo-styles.mjs';

const CRM_ORIGIN = 'https://crm.cnps.ai';
const styles = Object.keys(WASION_STYLES);
const viewer = { identityId: 'origin-test-viewer', identity: { role: 'admin' } };
const product = 'i-110-series-smart-water-meter';
const escape = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const response = () => ({ headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value; }, end(body) { this.body = body; } });
const request = (style, slug = 'home', options = {}) => ({
  method: 'GET', url: wasionStyleBase(style) + (slug === 'home' ? '' : '/' + slug),
  query: { style, slug }, ...options, headers: { host: 'crm.cnps.ai', ...options.headers }
});
function fixture(initialSession = viewer) {
  let session = initialSession, runtimeReads = 0;
  const runtime = { auth: { loadSession: async () => session }, projectAccessService: { getProject: async () => ({ id: 'origin-test-project' }) } };
  const handler = createWasionPageHandler({ getRuntime: () => { runtimeReads++; return runtime; } });
  return { handler, setSession(value) { session = value; }, get runtimeReads() { return runtimeReads; } };
}
function assertPrivate(res, policy = 'same-origin') {
  for (const name of ['cache-control', 'cdn-cache-control', 'vercel-cdn-cache-control']) assert.match(res.headers[name], /private, no-store, max-age=0/);
  assert.match(res.headers['x-robots-tag'], /noindex, nofollow, noarchive, nosnippet/);
  assert.equal(res.headers['referrer-policy'], policy);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-frame-options'], 'DENY');
}
function assertSearchForms(html, base) {
  const forms = [...html.matchAll(/<form\b([^>]*)>/g)].map(([, attributes]) => attributes).filter(attributes => /role="search"/.test(attributes));
  assert.ok(forms.length > 0, 'a native search form is available');
  for (const attributes of forms) {
    assert.ok(attributes.includes('method="post"'));
    assert.ok(attributes.includes('action="' + base + '/search"'));
    assert.ok(!attributes.includes('?q='));
  }
}

// The response policy is part of this regression: browser navigation POSTs
// produced Origin:null under no-referrer, even with the strict guard unchanged.
test('all styles preserve native search POST and same-origin policy, with Orderful and Industrial search auxiliary on content pages', async () => {
  const { handler } = fixture();
  for (const style of styles) for (const slug of ['home', 'search', product]) {
    const res = response(); await handler(request(style, slug), res);
    assert.equal(res.statusCode, 200, style + ' ' + slug);
    assertPrivate(res);
    if (['orderful', 'industrial'].includes(style) && slug !== 'search') {
      const markup = res.body.match(/<body\b[^>]*>([\s\S]*?)<script nonce=/)[1];
      assert.ok(markup.includes('href="' + wasionStyleBase(style) + '/search"'));
      assert.doesNotMatch(markup, /<form\b[^>]*role="search"/);
    } else assertSearchForms(res.body, wasionStyleBase(style));
    assert.match(res.headers['content-security-policy'], /form-action 'self' mailto:;/);
    const head = response(); await handler(request(style, slug, { method: 'HEAD' }), head);
    assert.equal(head.statusCode, 200); assert.equal(head.body, undefined); assertPrivate(head);
  }
});

test('canonical native POST retains an escaped typed question in all styles without redirecting it into a URL', async () => {
  const { handler } = fixture();
  const question = 'I-110 & "RF" <specifications>', encoded = new URLSearchParams({ q: question }).toString();
  for (const style of styles) {
    const req = request(style, 'search', { method: 'POST', headers: { origin: CRM_ORIGIN, 'content-type': 'application/x-www-form-urlencoded' }, body: encoded });
    const res = response(); await handler(req, res);
    assert.equal(res.statusCode, 200); assertPrivate(res);
    assert.equal(req.url, wasionStyleBase(style) + '/search');
    assert.ok(!Object.hasOwn(req.query, 'q')); assert.equal(res.headers.location, undefined);
    assert.ok(res.body.includes('name="q" value="' + escape(question) + '"'));
    assert.ok(res.body.includes('Results for “' + escape(question) + '”'));
    assert.ok(res.body.includes('data-base="' + wasionStyleBase(style) + '"'));
    assertSearchForms(res.body, wasionStyleBase(style));
  }
});

test('missing, null and cross-origin native POSTs fail before runtime access despite forged same-origin metadata', async () => {
  const { handler } = fixture();
  const denied = [undefined, '', null, 'null', 'https://evil.example', 'http://crm.cnps.ai', 'https://www.cnps.ai', 'https://cnps.ai', 'https://crm.cnps.ai.evil.example', 'https://crm.cnps.ai:8443', 'https://crm.cnps.ai/path', 'https://crm.cnps.ai https://evil.example', [CRM_ORIGIN]];
  const untouched = fixture();
  for (const style of styles) for (const origin of denied) {
    const headers = { 'sec-fetch-site': 'same-origin', referer: CRM_ORIGIN + wasionStyleBase(style) };
    if (origin !== undefined) headers.origin = origin;
    const res = response(); await untouched.handler(request(style, 'search', { method: 'POST', headers, body: 'q=I-110' }), res);
    assert.equal(res.statusCode, 403, style + ': ' + String(origin));
    assert.equal(res.body, 'Invalid request origin.'); assert.equal(res.headers.location, undefined);
    assertPrivate(res); assert.equal(untouched.runtimeReads, 0);
  }
  // A canonical Origin remains sufficient for a genuine native form, which
  // cannot add the custom header required by the separate JavaScript AI API.
  const allowed = response(); await handler(request('orderful', 'search', { method: 'POST', headers: { origin: CRM_ORIGIN }, body: 'q=I-110' }), allowed);
  assert.equal(allowed.statusCode, 200);
});

test('expired native POST keeps all style login recovery pages same-origin and resumes the body question', async () => {
  const subject = fixture(null), question = 'I-110 & "mesh" <source>';
  for (const style of styles) {
    subject.setSession(null);
    const req = request(style, 'search', { method: 'POST', headers: { origin: CRM_ORIGIN }, body: new URLSearchParams({ q: question }).toString() });
    const recovery = response(); await subject.handler(req, recovery);
    assert.equal(recovery.statusCode, 200); assertPrivate(recovery);
    assert.equal(recovery.headers.location, undefined); assert.ok(!req.url.includes('?'));
    assert.ok(recovery.body.includes('id="demo-resume" action="' + wasionStyleBase(style) + '/search" method="post"'));
    assert.ok(recovery.body.includes('name="q" value="' + escape(question) + '"'));
    assert.match(recovery.headers['content-security-policy'], /form-action 'self';/);
    assert.match(recovery.body, /class="brand-logo" src="data:image\/png;base64,[^"]+" alt="Wasion International" width="1850" height="306"/);
    assert.match(recovery.headers['content-security-policy'], /img-src data:;/);
    assert.doesNotMatch(recovery.headers['content-security-policy'], /img-src[^;]*(?:https?:|\*)/);
    subject.setSession(viewer);
    const resumed = response(); await subject.handler(req, resumed);
    assert.equal(resumed.statusCode, 200); assertPrivate(resumed);
    assert.ok(resumed.body.includes('name="q" value="' + escape(question) + '"'));
    assert.equal(resumed.headers.location, undefined);
  }
});

test('the shared CRM boundary retains no-referrer and rejects noncanonical hosts before the demo policy override', async () => {
  const shared = response();
  assert.equal(guardPrivateRequest({ method: 'GET', url: '/api/crm', headers: { host: 'crm.cnps.ai' } }, shared, { VERCEL_ENV: 'production' }), false);
  assertPrivate(shared, 'no-referrer');
  const subject = fixture();
  for (const style of styles) for (const host of ['www.cnps.ai', 'cnps.ai', 'preview.vercel.app', 'evil.example']) {
    for (const method of ['GET', 'POST']) {
      const res = response(); await subject.handler(request(style, 'search', { method, headers: { host, origin: CRM_ORIGIN, 'x-forwarded-host': 'crm.cnps.ai' }, body: 'q=I-110' }), res);
      assert.equal(res.statusCode, 404); assertPrivate(res, 'no-referrer'); assert.equal(subject.runtimeReads, 0);
      assert.match(res.headers['content-security-policy'], /default-src 'none'/);
      assert.ok(!res.body.includes('Wasion International'));
    }
    const preview = response();
    assert.equal(guardPrivateRequest(request(style, 'search'), preview, { VERCEL_ENV: 'preview' }), true);
    assert.equal(preview.statusCode, 404); assertPrivate(preview, 'no-referrer');
  }
});

test('the separate AI API still rejects null/missing/cross origins and missing request markers before inference', async () => {
  let calls = 0;
  const handler = createWasionSearchHandler({
    env: { CRM_AI_API_KEY: 'test-key' }, auth: { loadSession: async () => viewer }, service: { getProject: async () => ({ id: 'fixture' }) },
    fetchImpl: async () => { calls++; throw new Error('should not call inference'); }
  });
  for (const headers of [{}, { origin: 'null', 'x-cnps-crm': '1' }, { origin: 'https://evil.example', 'x-cnps-crm': '1' }, { origin: CRM_ORIGIN }]) {
    const res = response(); await handler({ method: 'POST', headers: { ...headers, 'sec-fetch-site': 'same-origin', referer: CRM_ORIGIN }, body: { question: 'I-110', language: 'en' } }, res);
    assert.equal(res.statusCode, 403); assertPrivate(res, 'no-referrer');
    assert.equal(JSON.parse(res.body).error, 'Invalid request origin.'); assert.equal(calls, 0);
  }
});
