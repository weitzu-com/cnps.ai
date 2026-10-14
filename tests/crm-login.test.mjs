import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {crmLoginPage} from '../server/crm-login.mjs';

function harness(respond) {
  const html = crmLoginPage('test-nonce');
  const elements = new Map([...html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)].map(match => {
    const listeners = new Map();
    const element = {
      value: '', checked: false, disabled: /\bdisabled\b/.test(match[0]), hidden: /\bhidden\b/.test(match[0]),
      textContent: '', className: '', listeners, attributes: {}, focused: false, invalidReports: 0,
      addEventListener(name, listener) { listeners.set(name, listener); },
      setAttribute(name, value) { this.attributes[name] = value; },
      focus() { this.focused = true; },
      reportValidity() { this.invalidReports++; return this.checkValidity(); },
      checkValidity() { return true; }
    };
    return [match[1], element];
  }));
  const element = id => elements.get(id);
  element('phone').checkValidity = () => /^1[3-9][0-9]{9}$/.test(element('phone').value);
  element('code').checkValidity = () => /^[0-9]{6}$/.test(element('code').value);
  element('consent').checkValidity = () => element('consent').checked;
  element('login').checkValidity = () => ['phone', 'code', 'consent'].every(id => element(id).checkValidity());
  const calls = [], intervals = new Map(), timeouts = new Map();
  let nextTimer = 0, time = 0;
  class Clock extends Date { static now() { return time; } }
  const forbidden = new Proxy({}, {get() { throw Error('Browser storage or logging must not be used.'); }});
  const document = {getElementById: element};
  Object.defineProperty(document, 'cookie', {get() { throw Error('Cookies belong to the server.'); }, set() { throw Error('Cookies belong to the server.'); }});
  vm.runInNewContext(html.match(/<script nonce="test-nonce">([\s\S]*?)<\/script>/)[1], {
    document, URLSearchParams, location:{search:'',replace() {}}, Date: Clock, AbortController, TypeError, console: forbidden, localStorage: forbidden, sessionStorage: forbidden,
    setTimeout(callback) { const id = ++nextTimer; timeouts.set(id, callback); return id; },
    clearTimeout(id) { timeouts.delete(id); },
    setInterval(callback) { const id = ++nextTimer; intervals.set(id, callback); return id; },
    clearInterval(id) { intervals.delete(id); },
    async fetch(url, options) {
      const call = {url, options, body: options.body ? JSON.parse(options.body) : undefined};
      calls.push(call);
      const {status = 200, body, headers = {}} = await respond(call);
      return {status, ok: status >= 200 && status < 300, headers: {get: name => headers[name]}, async json() { return body; }};
    }
  });
  return {
    html, element, calls,
    flush: () => new Promise(resolve => setImmediate(resolve)),
    event: (id, name) => element(id).listeners.get(name)?.({preventDefault() {}}),
    tick: (seconds = 1) => { time += seconds * 1000; [...intervals.values()].forEach(callback => callback()); },
    remainingTimeouts: () => timeouts.size
  };
}

test('page uses only nonce-bound inline assets, accessible inputs, and safely escapes the nonce', () => {
  const html = crmLoginPage('test"<nonce&');
  assert.match(html, /<style nonce="test&quot;&lt;nonce&amp;">/);
  assert.match(html, /<script nonce="test&quot;&lt;nonce&amp;">/);
  assert.match(html, /autocomplete="one-time-code"/);
  assert.match(html, /autocomplete="tel-national"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /@media\(min-width:768px\)/);
  assert.match(html, /@media\(min-width:1024px\)/);
  assert.match(html, /href="\/w"/);
  assert.doesNotMatch(html, /innerHTML|localStorage|sessionStorage|console\.|<script[^>]+src=|<link[^>]+href=/);
});

test('existing session is checked without sending an SMS and identity values stay text', async () => {
  const malicious = '<img src=x onerror=alert(1)>';
  const h = harness(() => ({body: {authenticated: true, identity: {phoneMasked: malicious, role: 'admin', memberships: []}}}));
  await h.flush();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].url, '/api/crm?view=session');
  assert.equal(h.calls[0].options.method, 'GET');
  assert.equal(h.element('session').hidden, false);
  assert.equal(h.element('login').hidden, true);
  assert.equal(h.element('session-phone').textContent, malicious);
  assert.equal(h.element('session-role').textContent, '管理员');
  assert.equal(h.remainingTimeouts(), 0);
});

test('anonymous login sends consent, enforces cooldown, verifies identity, and logs out with server cookies', async () => {
  let authenticated = false;
  const h = harness(({body}) => {
    if (!body) return authenticated ? {body: {authenticated: true, identity: {phoneMasked: '187****1111', role: 'sales_manager', memberships: []}}} : {status: 401};
    if (body.action === 'send') return {body: {challenge: 'test-challenge'}};
    if (body.action === 'verify') { authenticated = true; return {body: {ok: true}}; }
    if (body.action === 'logout') { authenticated = false; return {body: {ok: true}}; }
    throw Error('Unexpected request.');
  });
  await h.flush();
  assert.equal(h.element('login').hidden, false);
  h.element('phone').value = '18700001111';
  h.element('consent').checked = true;
  await h.event('send', 'click');
  assert.deepEqual(h.calls[1].body, {action: 'send', phone: '18700001111', consent: true});
  assert.equal(h.element('send').disabled, true);
  assert.equal(h.element('send').textContent, '60秒后重试');
  h.tick();
  assert.equal(h.element('send').textContent, '59秒后重试');
  await h.event('send', 'click');
  assert.equal(h.calls.length, 2);
  h.element('code').value = '123456';
  h.event('code', 'input');
  assert.equal(h.element('submit').disabled, false);
  await h.event('login', 'submit');
  assert.deepEqual(h.calls[2].body, {action: 'verify', phone: '18700001111', code: '123456', challenge: 'test-challenge'});
  assert.equal(h.element('code').value, '');
  assert.equal(h.element('session').hidden, false);
  assert.equal(h.element('session-role').textContent, '销售经理');
  assert.equal(h.element('session').hidden, false);
  for (const call of h.calls) {
    assert.equal(call.options.credentials, 'same-origin');
    assert.equal(call.options.cache, 'no-store');
    assert.equal(call.options.headers['X-CNPS-CRM'], '1');
  }
  await h.event('logout', 'click');
  assert.deepEqual(h.calls.at(-1).body, {action: 'logout'});
  assert.equal(h.element('session').hidden, true);
  assert.equal(h.element('session-phone').textContent, '');
  assert.equal(h.element('consent').checked, false);
  assert.equal(h.element('login').hidden, false);
  assert.equal(h.remainingTimeouts(), 0);
});

test('invalid phone or missing consent never sends; editing a sent phone invalidates its challenge', async () => {
  const h = harness(({body}) => body ? {body: {challenge: 'test-challenge'}} : {status: 401});
  await h.flush();
  await h.event('send', 'click');
  assert.equal(h.calls.length, 1);
  h.element('phone').value = '18700001111';
  await h.event('send', 'click');
  assert.equal(h.calls.length, 1);
  h.element('consent').checked = true;
  await h.event('send', 'click');
  h.element('phone').value = '18700002222';
  h.event('phone', 'input');
  h.element('code').value = '123456';
  h.event('code', 'input');
  assert.equal(h.element('submit').disabled, true);
  await h.event('login', 'submit');
  assert.equal(h.calls.length, 2);
  assert.match(h.element('status').textContent, /当前手机号/);
  assert.equal(h.element('send').disabled, false);
});

test('verification failures clear the entered code and recover controls without revealing a session', async () => {
  const malicious = '<script>alert(1)</script>';
  const h = harness(({body}) => !body ? {status: 401} : body.action === 'send' ? {body: {challenge: 'test-challenge'}} : {status: 400, body: {error: malicious}});
  await h.flush();
  h.element('phone').value = '18700001111'; h.element('consent').checked = true;
  await h.event('send', 'click');
  h.element('code').value = '000000';
  await h.event('login', 'submit');
  assert.equal(h.element('status').textContent, malicious);
  assert.equal(h.element('code').value, '');
  assert.equal(h.element('phone').disabled, false);
  assert.equal(h.element('submit').disabled, true);
  assert.equal(h.element('session').hidden, true);
});

test('session read failures offer an actual retry and never report an authenticated identity', async () => {
  let attempts = 0;
  const h = harness(() => ++attempts === 1 ? {status: 503, body: {error: '服务暂不可用'}} : {status: 401});
  await h.flush();
  assert.equal(h.element('retry-session').hidden, false);
  assert.equal(h.element('session').hidden, true);
  assert.match(h.element('status').textContent, /登录状态暂时无法确认/);
  await h.event('retry-session', 'click');
  assert.equal(h.calls.length, 2);
  assert.equal(h.element('retry-session').hidden, true);
  assert.equal(h.element('login').hidden, false);
});

test('SMS rate limits honor the server wait and do not issue repeated sends', async () => {
  for (const response of [
    {status: 429, body: {error: '请等待45秒后重试。', retryAfterSeconds: 45}},
    {status: 429, body: {error: '该手机号今日验证码发送次数已达上限，请明日再试。'}, headers: {'Retry-After': '7200'}}
  ]) {
    const h = harness(({body}) => body ? response : {status: 401});
    await h.flush();
    h.element('phone').value = '18700001111'; h.element('consent').checked = true;
    await h.event('send', 'click');
    const seconds = response.body.retryAfterSeconds || 7200;
    assert.equal(h.element('send').disabled, true);
    assert.equal(h.element('send').textContent, seconds === 45 ? '45秒后重试' : '2小时后重试');
    assert.equal(h.element('status').textContent, response.body.error);
    await h.event('send', 'click');
    assert.equal(h.calls.length, 2);
    // A background tab may miss ticks; elapsed wall time still releases retry.
    h.tick(seconds);
    assert.equal(h.element('send').disabled, false);
    assert.equal(h.element('send').textContent, '重新发送');
    assert.equal(h.element('submit').disabled, true);
  }
});

test('uncertain SMS delivery waits a minute before another attempt', async () => {
  for (const response of [new TypeError('network unavailable'), {status: 503, body: {error: '服务暂不可用。'}}]) {
    const h = harness(({body}) => { if (!body) return {status: 401}; if (response instanceof Error) throw response; return response; });
    await h.flush();
    h.element('phone').value = '18700001111'; h.element('consent').checked = true;
    await h.event('send', 'click');
    assert.equal(h.element('send').disabled, true);
    assert.equal(h.element('send').textContent, '60秒后重试');
    h.tick(60);
    assert.equal(h.element('send').disabled, false);
    assert.equal(h.element('session').hidden, true);
  }
});

test('changing phone releases only phone-specific waits while network limits remain active', async () => {
  for (const code of ['SMS_COOLDOWN', 'SMS_PHONE_DAILY_LIMIT', 'SMS_IP_HOURLY_LIMIT', 'SMS_DAILY_LIMIT', 'SMS_MONTHLY_LIMIT']) {
    const h = harness(({body}) => body ? {status: 429, body: {error: '请稍后重试。', code, retryAfterSeconds: 7200}} : {status: 401});
    await h.flush();
    h.element('phone').value = '18700001111'; h.element('consent').checked = true;
    await h.event('send', 'click');
    h.element('phone').value = '18700002222'; h.event('phone', 'input');
    assert.equal(h.element('send').disabled, !['SMS_COOLDOWN', 'SMS_PHONE_DAILY_LIMIT'].includes(code));
    assert.equal(h.element('submit').disabled, true);
  }
});
