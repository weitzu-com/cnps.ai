import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { renderSessionNotice, SESSION_CLIENT } from '../server/wasion-experience/session.mjs';

class Target {
  constructor() { this.listeners = new Map(); this.hidden = false; this.disabled = false; this.textContent = ''; }
  addEventListener(type, callback) { const listeners = this.listeners.get(type) || []; listeners.push(callback); this.listeners.set(type, listeners); }
  emit(type, event = {}) { return Promise.all((this.listeners.get(type) || []).map(callback => callback(event))); }
}
const pending = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

function harness(respond, question) {
  const ids = ['wd-protected', 'wd-session-notice', 'wd-session-heading', 'wd-session-message', 'wd-session-login', 'wd-session-retry', 'wd-logout'];
  const elements = new Map(ids.map(id => [id, new Target()]));
  for (const id of ['wd-session-notice', 'wd-session-login', 'wd-session-retry']) elements.get(id).hidden = true;
  const dialog = { open: true, closes: 0, close() { this.open = false; this.closes += 1; } };
  const posts = [];
  if (question !== undefined) { elements.set('ws-query', { value: question }); elements.set('ws-form', { submit() { posts.push(elements.get('ws-query').value); } }); }
  const document = { getElementById: id => elements.get(id), querySelectorAll: () => dialog.open ? [dialog] : [] };
  const forbidden = new Proxy({}, { get() { throw new Error('Session verification must not use browser storage or logging'); } });
  Object.defineProperty(document, 'cookie', { get() { throw new Error('Cookies remain server-controlled'); }, set() { throw new Error('Cookies remain server-controlled'); } });
  const window = new Target(), calls = [], redirects = [], timeouts = new Map(); let nextTimer = 0;
  const loginUrl = '/?returnTo=%2Fdemo%2Fwasion%2Fsearch';
  vm.runInNewContext(SESSION_CLIENT, {
    document, window, CRM_LOGIN_URL: loginUrl, CRM_PAGE_URL: '/demo/wasion/search', AbortController,
    location: { replace(value) { redirects.push(value); } }, localStorage: forbidden, sessionStorage: forbidden, console: forbidden,
    setTimeout(callback) { const id = ++nextTimer; timeouts.set(id, callback); return id; }, clearTimeout(id) { timeouts.delete(id); },
    async fetch(url, options) {
      const call = { url, options, method: options.method || 'GET', body: options.body ? JSON.parse(options.body) : undefined }; calls.push(call);
      const response = await respond(call);
      return { status: response.status ?? 200, ok: (response.status ?? 200) >= 200 && (response.status ?? 200) < 300, type: response.type || 'basic', async json() { if (response.jsonError) throw response.jsonError; return await response.body; } };
    }
  });
  return { posts, element: id => elements.get(id), dialog, window, calls, redirects, loginUrl, timeouts, flush: () => new Promise(resolve => setImmediate(resolve)) };
}

test('notice is initially hidden, accessible and only links to the local login page', () => {
  const html = renderSessionNotice({ loginUrl: '/?returnTo=%2Fdemo%2Fwasion&x=%22%3Cscript%3E' });
  assert.match(html, /id="wd-session-notice"[^>]+hidden aria-live="polite"/);
  assert.match(html, /id="wd-session-message" role="status"/);
  assert.match(html, /&amp;x=/);
  assert.ok(!html.includes('<script>'));
  for (const loginUrl of ['https://attacker.invalid/crm', 'javascript:alert(1)', '/crm/workspace']) assert.match(renderSessionNotice({ loginUrl }), /href="\/"/);
});

test('fresh server-rendered pages do not automatically request an SMS or run a redundant login check', async () => {
  const h = harness(() => { throw new Error('No request expected'); });
  await h.window.emit('pageshow', { persisted: false });
  assert.equal(h.calls.length, 0);
  assert.equal(h.element('wd-protected').hidden, false);
  assert.deepEqual(h.redirects, []);
});

test('BFCache restoration hides content and closes native dialogs until both session and HEAD checks succeed', async () => {
  const session = pending(), page = pending();
  const h = harness(call => call.method === 'HEAD' ? page.promise : session.promise);
  await h.window.emit('pagehide');
  assert.equal(h.element('wd-protected').hidden, true);
  assert.equal(h.dialog.open, false);
  assert.equal(h.dialog.closes, 1);
  await h.window.emit('pageshow', { persisted: true }); await h.flush();
  assert.equal(h.calls[0].url, '/api/crm?view=session');
  assert.equal(h.calls[0].method, 'GET');
  session.resolve({ body: { authenticated: true } }); await h.flush();
  assert.equal(h.calls[1].method, 'HEAD');
  assert.equal(h.calls[1].url, '/demo/wasion/search');
  assert.equal(h.calls[1].options.redirect, 'manual');
  assert.equal(h.element('wd-protected').hidden, true);
  page.resolve({ status: 200 }); await h.flush();
  assert.equal(h.element('wd-protected').hidden, false);
  assert.equal(h.element('wd-session-notice').hidden, true);
  assert.equal(h.timeouts.size, 0);
  for (const call of h.calls) { assert.equal(call.options.credentials, 'same-origin'); assert.equal(call.options.cache, 'no-store'); assert.equal(call.options.headers['X-CNPS-CRM'], '1'); assert.equal(call.body, undefined); }
});

test('expired sessions, page redirects and authorization denials never reveal protected content', async () => {
  const cases = [
    { session: { status: 401 }, expected: 'Please sign in again', login: true },
    { page: { status: 302 }, expected: 'Please sign in again', login: true },
    { page: { status: 0, type: 'opaqueredirect' }, expected: 'Please sign in again', login: true },
    { page: { status: 401 }, expected: 'Please sign in again', login: true },
    { page: { status: 403 }, expected: 'This page is unavailable', login: false },
    { page: { status: 404 }, expected: 'This page is unavailable', login: false }
  ];
  for (const item of cases) {
    const h = harness(call => call.method === 'HEAD' ? item.page : item.session || { body: { authenticated: true } });
    await h.window.emit('pageshow', { persisted: true }); await h.flush();
    assert.equal(h.element('wd-protected').hidden, true);
    assert.equal(h.element('wd-session-heading').textContent, item.expected);
    assert.equal(h.element('wd-session-login').hidden, !item.login);
    assert.equal(h.element('wd-session-retry').hidden, true);
    assert.ok(h.calls.every(call => ['GET', 'HEAD'].includes(call.method)));
    assert.deepEqual(h.redirects, []);
  }
});

test('transient access failures offer an actual retry without automatically sending a verification code', async () => {
  let first = true;
  const h = harness(call => {
    if (first) { first = false; return { status: 503, body: { authenticated: false } }; }
    return call.method === 'HEAD' ? { status: 200 } : { body: { authenticated: true } };
  });
  await h.window.emit('pageshow', { persisted: true }); await h.flush();
  assert.equal(h.element('wd-protected').hidden, true);
  assert.equal(h.element('wd-session-retry').hidden, false);
  assert.equal(h.element('wd-session-retry').disabled, false);
  assert.match(h.element('wd-session-message').textContent, /No verification code has been sent/);
  await h.element('wd-session-retry').emit('click'); await h.flush();
  assert.equal(h.element('wd-protected').hidden, false);
  assert.deepEqual(h.calls.map(call => call.method), ['GET', 'GET', 'HEAD']);
  assert.equal(h.calls.some(call => call.body?.action === 'send'), false);
});

test('a stale successful HEAD response cannot reveal a page after a newer check denies access', async () => {
  const oldHead = pending(); let sessions = 0;
  const h = harness(call => call.method === 'HEAD' ? oldHead.promise : ++sessions === 1 ? { body: { authenticated: true } } : { status: 401 });
  await h.window.emit('pageshow', { persisted: true }); await h.flush();
  assert.equal(h.calls.length, 2);
  await h.window.emit('pagehide');
  await h.window.emit('pageshow', { persisted: true }); await h.flush();
  assert.equal(h.element('wd-session-login').hidden, false);
  oldHead.resolve({ status: 200 }); await h.flush();
  assert.equal(h.element('wd-protected').hidden, true);
  assert.equal(h.element('wd-session-heading').textContent, 'Please sign in again');
});

test('logout only reports completion and redirects after confirmed server invalidation', async () => {
  const response = pending();
  const h = harness(() => response.promise);
  const attempt = h.element('wd-logout').emit('click');
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].method, 'POST');
  assert.deepEqual(h.calls[0].body, { action: 'logout' });
  assert.equal(h.element('wd-logout').disabled, true);
  assert.deepEqual(h.redirects, []);
  await h.element('wd-logout').emit('click');
  assert.equal(h.calls.length, 1, 'a pending logout must not be duplicated');
  response.resolve({ body: { ok: true } }); await attempt;
  assert.equal(h.element('wd-protected').hidden, true);
  assert.equal(h.element('wd-session-heading').textContent, 'You have signed out');
  assert.deepEqual(h.redirects, [h.loginUrl]);
  await h.window.emit('pageshow', { persisted: true }); await h.flush();
  assert.equal(h.calls.length, 1);
  assert.equal(h.element('wd-protected').hidden, true);
});

test('failed logout does not claim the server session ended or navigate away', async () => {
  for (const response of [{ status: 503, body: { ok: true } }, { status: 200, body: { ok: false } }, { status: 200, jsonError: new Error('Malformed response') }]) {
    const h = harness(() => response);
    await h.element('wd-logout').emit('click');
    assert.deepEqual(h.redirects, []);
    assert.equal(h.element('wd-logout').disabled, false);
    assert.equal(h.element('wd-session-heading').textContent, 'Sign out was not completed');
    assert.match(h.element('wd-session-message').textContent, /not been confirmed as ended/);
    assert.equal(h.element('wd-session-login').hidden, true);
  }
});


test('BFCache sign-in recovery preserves the current search through native POST', async () => {
  const question = 'I110 通信 & "参数" <check>';
  const h = harness(async () => ({ status: 401 }), question);
  await h.window.emit('pageshow', { persisted: true }); await h.flush();
  assert.equal(h.element('wd-protected').hidden, true);
  let prevented = false;
  await h.element('wd-session-login').emit('click', { preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(h.posts, [question]);
  assert.deepEqual(h.redirects, []);
});
