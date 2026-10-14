import crmPage from '../api/crm-page.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {crmLoginPage,safeDemoReturnTo} from '../server/crm-login.mjs';

function harness(respond, { returnTo, search = '' } = {}) {
  const html = crmLoginPage('test-nonce', { returnTo });
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
  const calls = [], intervals = new Map(), timeouts = new Map(), windowListeners = new Map(), navigations = [];
  let nextTimer = 0, time = 0;
  class Clock extends Date { static now() { return time; } }
  const forbidden = new Proxy({}, {get() { throw Error('Browser storage or logging must not be used.'); }});
  const document = {getElementById: element};
  Object.defineProperty(document, 'cookie', {get() { throw Error('Cookies belong to the server.'); }, set() { throw Error('Cookies belong to the server.'); }});
  vm.runInNewContext(html.match(/<script nonce="test-nonce">([\s\S]*?)<\/script>/)[1], {
    document, URLSearchParams, location:{search, replace: value => navigations.push(value)}, window: {addEventListener: (name, listener) => windowListeners.set(name, listener)}, Date: Clock, AbortController, TypeError, console: forbidden, localStorage: forbidden, sessionStorage: forbidden,
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
    html, element, calls, navigations, redirects: navigations,
    flush: () => new Promise(resolve => setImmediate(resolve)),
    event: (id, name) => element(id).listeners.get(name)?.({preventDefault() {}}),
    windowEvent: (name, options = {}) => windowListeners.get(name)?.(options),
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
  assert.match(html, /href="https:\/\/crm\.cnps\.ai\/w"/);
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
  assert.equal(h.element('session-role').textContent, '高级管理员');
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
  assert.deepEqual(h.redirects, ['/crm/workspace']);
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

test('a customer sees the server expiry and returns to the requested demo without sending SMS', async () => {
  const expiresAt = Date.UTC(2026, 10, 13, 12);
  const h = harness(() => ({body: {authenticated: true, authenticatedAt: Date.UTC(2026, 9, 14, 12), expiresAt,
    identity: {phoneMasked: '188****2222', role: 'customer', memberships: []}}}),
    {returnTo: '/demo/wasion/search?q=smart+meter'});
  await h.flush();
  assert.deepEqual(h.navigations, ['/demo/wasion/search?q=smart+meter']);
  assert.match(h.element('session-expiry').textContent, /13\/11\/2026, 20:00:00/);
  assert.equal(h.calls.length, 1);
  assert.ok(h.calls.every(call => call.options.method === 'GET'));
});

test('invalid return targets never redirect and ordinary CRM entry retains the logged-in screen', async () => {
  for (const returnTo of [undefined, 'https://evil.test', '//evil.test', '/demo/wasion/../../w', '/w', '/%2f%2fevil.test']) {
    const h = harness(() => ({body: {authenticated: true, identity: {role: 'customer'}}}), {returnTo});
    await h.flush();
    assert.deepEqual(h.navigations, []);
    assert.equal(h.element('session').hidden, false);
  }
});

test('history restore hides a prior identity and performs a new session check before showing login', async () => {
  let authenticated = true;
  const h = harness(() => authenticated ? {body: {authenticated: true, identity: {role: 'customer', phoneMasked: '188****2222'}}} : {status: 401});
  await h.flush();
  assert.equal(h.element('session').hidden, false);
  h.windowEvent('pagehide');
  assert.equal(h.element('session').hidden, true);
  authenticated = false;
  h.windowEvent('pageshow', {persisted: true});
  await h.flush();
  assert.equal(h.element('session').hidden, true);
  assert.equal(h.element('session-phone').textContent, '');
  assert.equal(h.element('login').hidden, false);
  assert.equal(h.calls.length, 2);
});

test('an unavailable session never enables SMS or automatically redirects to another page', async () => {
  const h = harness(() => ({status: 503, body: {error: '服务暂不可用。'}}), {returnTo: '/demo/wasion'});
  await h.flush();
  h.element('phone').value = '18800002222'; h.element('consent').checked = true;
  await h.event('send', 'click');
  assert.equal(h.calls.length, 1);
  assert.equal(h.element('login').hidden, true);
  assert.equal(h.element('send').disabled, true);
  assert.equal(h.element('retry-session').hidden, false);
  assert.deepEqual(h.navigations, []);
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
  assert.equal(h.element('login').hidden, true);
  assert.equal(h.element('send').disabled, true);
  assert.equal(h.element('session-check-status').hidden, false);
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

test('fresh SMS login returns to the original Demo URL only after session confirmation', async () => {
  let authenticated = false;
  const target = '/demo/wasion/search?q=meters#results';
  const h = harness(({body}) => {
    if (!body) return authenticated ? {body:{authenticated:true,identity:{phoneMasked:'187****1111',role:'sales_manager'}}} : {status:401};
    if (body.action === 'send') return {body:{challenge:'test-challenge'}};
    if (body.action === 'verify') { authenticated = true; return {body:{ok:true}}; }
  }, {returnTo:target});
  await h.flush();
  assert.deepEqual(h.redirects, []);
  h.element('phone').value = '18700001111'; h.element('consent').checked = true;
  await h.event('send','click'); h.element('code').value = '123456';
  await h.event('login','submit');
  assert.deepEqual(h.redirects, [target]);
});

test('existing authorized identities return directly to a valid target without another SMS', async () => {
  for (const role of ['admin','sales_manager','customer']) {
    const h = harness(() => ({body:{authenticated:true,identity:{phoneMasked:'187****1111',role}}}), {returnTo:'/demo/wasion'});
    await h.flush();
    assert.deepEqual(h.redirects, ['/demo/wasion']);
    assert.equal(h.calls.length,1);
  }
  const h = harness(() => ({body:{authenticated:true,identity:{role:'admin'}}}), {returnTo:'https://evil.example/demo/wasion'});
  await h.flush(); assert.deepEqual(h.redirects, []);
});

test('an unconfirmed session never follows the requested return destination', async () => {
  const h = harness(({body}) => !body ? {status:401} : body.action === 'send' ? {body:{challenge:'test-challenge'}} : {body:{ok:true}}, {returnTo:'/demo/wasion'});
  await h.flush(); h.element('phone').value = '18700001111'; h.element('consent').checked = true;
  await h.event('send','click'); h.element('code').value = '123456'; await h.event('login','submit');
  assert.deepEqual(h.redirects, []);
  assert.match(h.element('status').textContent, /session was not confirmed/);
});

test('demo return targets accept only bounded local preview paths', () => {
  for (const target of ['/demo/wasion', '/demo/wasion/search', '/demo/wasion/privacy', '/demo/wasion/ameter300-three-phase-smart-energy-meter']) {
    assert.equal(safeDemoReturnTo(target), target);
  }
  for (const target of [
    undefined, null, 1, {}, ['\/demo/wasion'], '',
    'https://attacker.invalid/demo/wasion', '//attacker.invalid/demo/wasion',
    'javascript:alert(1)', '/crm/workspace', '/demo/wasion-other',
    '/demo/wasion?next=https://attacker.invalid', '/demo/wasion/search?q=personal-data',
    '/demo/wasion#fragment', '/demo/wasion/../crm', '/demo/wasion/%2e%2e/crm',
    '/demo/wasion/%2F%2Fattacker.invalid', '/demo/wasion\\..\\crm',
    '/demo/wasion//search', '/demo/wasion/search/extra', '/demo/wasion/',
    '/demo/wasion\n', '/demo/wasion/search\r', '/demo/wasion\u2028',
    '/demo/wasion"><script>alert(1)</script>'
  ]) assert.equal(safeDemoReturnTo(target), '', JSON.stringify(target));
});

test('a valid existing session returns directly to the requested demo without another SMS', async () => {
  for (const target of ['/demo/wasion', '/demo/wasion/privacy']) {
    const h = harness(call => {
      assert.equal(call.url, '/api/crm?view=session');
      assert.equal(call.options.method, 'GET');
      assert.equal(call.body, undefined);
      return {body: {authenticated: true, identity: {phoneMasked: '187****1111', role: 'customer', memberships: []}}};
    }, {returnTo: target});
    await h.flush();
    assert.match(h.html, /<html lang="en">/);
    assert.deepEqual(h.redirects, [target]);
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls.some(call => call.body?.action === 'send' || call.body?.action === 'verify'), false);
    assert.equal(h.remainingTimeouts(), 0);
  }
});

test('anonymous or unconfirmed sessions never redirect into the preview or send a code automatically', async () => {
  for (const response of [{status: 401}, {status: 503, body: {error: 'Unavailable'}}]) {
    const h = harness(() => response, {returnTo: '/demo/wasion/search'});
    await h.flush();
    assert.deepEqual(h.redirects, []);
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].options.method, 'GET');
    assert.equal(h.element('session').hidden, true);
    assert.equal(h.element('consent').checked, false);
  }
});

test('invalid return targets retain the generic CRM experience even with an existing session', async () => {
  const h = harness(() => ({body: {authenticated: true, identity: {phoneMasked: '187****1111', role: 'admin', memberships: []}}}), {returnTo: '//attacker.invalid'});
  await h.flush();
  assert.deepEqual(h.redirects, []);
  assert.match(h.html, /<html lang="zh-CN">/);
  assert.equal(h.element('session').hidden, false);
  assert.equal(h.element('session-role').textContent, '高级管理员');
  assert.equal(h.calls.length, 1);
});

test('CRM page query handling preserves the local demo boundary and private page headers', () => {
  const response = () => ({headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(body) { this.body = body; }});
  for (const target of ['/demo/wasion/search', 'https://attacker.invalid', '//attacker.invalid', '/demo/wasion?x=1', '/demo/wasion/../crm', '/demo/wasion/%2e%2e/crm']) {
    const res = response();
    crmPage({method: 'GET', url: `/crm?next=${encodeURIComponent(target)}`}, res);
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['Cache-Control'], /private, no-store/);
    assert.match(res.headers['X-Robots-Tag'], /noindex/);
    const script = res.body.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)[1];
    const targetText = script.match(/const returnTo = (.*);/)[1];
    assert.equal(JSON.parse(targetText), target === '/demo/wasion/search' ? target : null);
    assert.doesNotThrow(() => new vm.Script(script));
  }
});


test('demo SMS status and cooldown remain English while the generic portal preserves its language', async () => {
  const h=harness(({body})=>!body?{status:401}: {body:{challenge:'test-challenge'}},{returnTo:'/demo/wasion'});
  await h.flush();h.element('phone').value='18700001111';h.element('consent').checked=true;
  await h.event('send','click');
  assert.match(h.element('status').textContent,/6-digit SMS code/);
  assert.match(h.element('send').textContent,/Retry in 60s/);
  h.tick();assert.match(h.element('send').textContent,/s to retry/);
  assert.equal(h.calls.filter(call=>call.body?.action==='send').length,1);
});
