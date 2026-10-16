import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Script, runInNewContext } from 'node:vm';
import crmPage from '../api/crm-page.js';
import { createWasionPageHandler } from '../api/crm-wasion-demo-page.js';
import { crmLoginPage } from '../server/crm-login.mjs';
import { WASION_LOGIN_LOGO } from '../server/crm-wasion-brand.mjs';
import { WASION_STYLES, wasionStyleBase } from '../server/wasion-demo-styles.mjs';

const nonce = 'industrial-login-fixture';
const hash = value => createHash('sha256').update(value).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const clientScript = html => {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1, 'the visual change must not add another client script');
  return scripts[0][1];
};

// Renderer snapshots refreshed for the intentional CRM SMS deadline/body-abort
// fix (2026-10-15). Fixed byte lengths and SHA-256 still cover the full client
// script and generic HTML; behavioral timeout tests live in crm-login.test.mjs.
const scriptBaselines = [
  [{"returnTo":"/demo/wasion"}, 10671, 'd0d8279c335068aa7e8598b33c81da754524f98d2873f5d6fec93a4630b945e1'],
  [{"returnTo":"/demo/wasion/search?q=I-110+%26+AMI#results"}, 10702, '94223f7add3c55f364a096d8457338f0af68db555238d928a34070340225d0c0'],
  [{"returnTo":"/demo/wasion/styles/classic/search?q=I-110+%26+AMI"}, 10709, 'a783638af4eff7fff8b828e2ecdfe48a10ad4a691f2383a1ac03bd83171af697'],
  [{"returnTo":"/demo/wasion/styles/atmospheric/search?q=I-110+%26+AMI"}, 10713, '53ef7411bd1986eb6c74b7a1d7fc75fcb45071cf8c0cd9f6fec350636e164a47'],
  [{"returnTo":"/demo/wasion/styles/planhat/search?q=I-110+%26+AMI"}, 10709, '83c55c3404ac316f1cad8629620f6dcb18305e63c68c995a6f6ca044d104a4a2'],
  [{"returnTo":"/demo/wasion/styles/orderful/search?q=I-110+%26+AMI"}, 10710, 'b0bb0d3c25f3e321c65a1ca43165debff176146c2ee23cb8d21cc8f197a577ba'],
  [{"returnTo":"/demo/wasion/styles/industrial/search?q=I-110+%26+AMI"}, 10712, 'bdb275e80037f5b991892b8fd3f0a657a56fe0eb4f87dd1b93c19ed274e564bb'],
  [{"returnTo":"/demo/wasion/search","resumeQuestion":"客户询问 I-110 <script> & protocols"}, 10677, 'ed7c9e1c18cce266cc9770f6637ee4916f72d648811bade3a7d5c9942fc0e578'],
  [{"returnTo":"/demo/wasion/styles/orderful/search","resumeQuestion":"aMeter300 <script> & IDIS 2.0"}, 10693, '5e1228264cefa28c52740536e5162371df772a112ed972ee69358a2511c2c18e']
];
const genericBaselines = [
  [undefined, 20218, 'a5af025c923739c6a495b5b3aee73807637f50c5148bd7f80394320af82b910a'],
  ["/workspace", 20226, '2d415550d27315aaa0df568b4e415ce346aafca9d06bc1adfb125eef85c587ee'],
  ["/w", 20218, 'ba79ce3dfacbf9228ff0cee7f6890fe311f21ef6583d63a20d32f48e1bffcd4a']
];
const controlIds = ['intro-title', 'loading', 'session-check-status', 'login', 'phone', 'phone-hint', 'code', 'send', 'code-hint', 'consent', 'submit', 'status', 'session', 'session-title', 'session-phone', 'session-role', 'session-expiry', 'logout', 'session-status', 'retry-session'];

test('only valid Wasion destinations receive the scoped Industrial login theme', () => {
  for (const [options] of scriptBaselines) {
    const html = crmLoginPage(nonce, options);
    assert.match(html, /<main class="shell wasion-access">/);
    assert.match(html, /\.wasion-access\s*\{[^}]+\}/, 'the Wasion container must receive actual scoped theme rules');
    assert.match(html, /\.wasion-access\s+\.card\s*\{[^}]+\}/, 'the verification card must receive the Industrial treatment');
  }
  for (const returnTo of [undefined, '/workspace', '/w', 'https://evil.invalid/demo/wasion', '//evil.invalid/demo/wasion', '/demo/wasion/styles/missing', '/demo/wasion/../workspace']) {
    const html = crmLoginPage(nonce, { returnTo });
    assert.match(html, /<html lang="zh-CN">/);
    assert.match(html, /<main class="shell">/);
    assert.doesNotMatch(html, /wasion-access/);
  }
});

test('Industrial login client-script snapshots cover canonical, styled, query and POST targets', () => {
  for (const [options, bytes, digest] of scriptBaselines) {
    const script = clientScript(crmLoginPage(nonce, options));
    assert.equal(Buffer.byteLength(script), bytes, options.returnTo);
    assert.equal(hash(script), digest, options.returnTo);
    assert.doesNotThrow(() => new Script(script), options.returnTo);
  }
});

test('generic CRM and proposal login HTML match the reviewed renderer snapshots', () => {
  for (const [returnTo, bytes, digest] of genericBaselines) {
    const html = crmLoginPage(nonce, { returnTo });
    assert.equal(Buffer.byteLength(html), bytes, String(returnTo));
    assert.equal(hash(html), digest, String(returnTo));
  }
});

test('Wasion login retains the exact official PNG and complete accessible verification content', () => {
  const imageBytes = Buffer.from(WASION_LOGIN_LOGO.split(',')[1], 'base64');
  assert.equal(hash(imageBytes), '9f0e13d77ce36c810f7b71fedea007f47f86a2abd465963237e452dc64ab71a9');
  assert.equal(imageBytes.readUInt32BE(16), 1850);
  assert.equal(imageBytes.readUInt32BE(20), 306);
  for (const returnTo of ['/demo/wasion', ...Object.keys(WASION_STYLES).map(style => '/demo/wasion/styles/' + style)]) {
    const html = crmLoginPage(nonce, { returnTo });
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<title>Verify access \| Wasion demo<\/title>/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /<h1\b[^>]*class="form-title"[^>]*>Verify your mobile number<\/h1>/);
    assert.match(html, /<p\b[^>]*id="intro-title"[^>]*>Intelligence for<span>the energy ahead\.<\/span><\/p>/);
    assert.match(html, /<section\b[^>]*aria-labelledby="intro-title"/);
    assert.match(html, /<details class="access-policy"><summary>Session and access details<\/summary>/);
    assert.ok(html.includes('src="' + WASION_LOGIN_LOGO + '" alt="Wasion International" width="1850" height="306"'));
    assert.match(html, /Customers stay verified in this browser for 30 days\. Administrators, sales managers, partners and proposal-only guests have 8-hour sessions\. Multiple roles use the shorter session period\./);
    assert.match(html, /Browsing does not extend the expiry\. Existing company and project permissions apply\./);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, 'IDs must remain unique');
    for (const id of controlIds) assert.ok(ids.includes(id), id);
    assert.match(html, /<label for="phone">Mainland China mobile number<\/label>/);
    assert.match(html, /<label for="code">SMS verification code<\/label>/);
    assert.match(html, /<input\b[^>]*id="phone"[^>]*type="tel"[^>]*inputmode="numeric"[^>]*autocomplete="tel-national"[^>]*required[^>]*aria-describedby="phone-hint"/);
    assert.match(html, /<input\b[^>]*id="code"[^>]*inputmode="numeric"[^>]*autocomplete="one-time-code"[^>]*required[^>]*aria-describedby="code-hint"/);
    assert.match(html, /<label class="consent"><input\b[^>]*id="consent"[^>]*type="checkbox"[^>]*required>[\s\S]*?<\/label>/);
    assert.match(html, /id="submit"[^>]*type="submit"[^>]*disabled/);
    assert.match(html, /id="status" role="status" aria-live="polite" aria-atomic="true"/);
    assert.match(html, /name="viewport" content="width=device-width,initial-scale=1"/);
  }
});

async function activeSessionNavigation(options) {
  const html = crmLoginPage(nonce, options), redirects = [], resumed = [], calls = [];
  const elements = new Map([...html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)].map(([, id]) => [id, {
    value: '', checked: false, hidden: true, disabled: false, textContent: '', className: '',
    addEventListener() {}, setAttribute() {}, focus() {}, reportValidity() { return true; },
    submit() { resumed.push(options.returnTo); }
  }]));
  const forbidden = new Proxy({}, { get() { throw new Error('Login must not add browser storage or logging'); } });
  runInNewContext(clientScript(html), {
    document: { getElementById: id => elements.get(id) }, window: { addEventListener() {} },
    URLSearchParams, Date, AbortController, TypeError, setTimeout, clearTimeout, setInterval, clearInterval,
    location: { search: '', replace: value => redirects.push(value) }, console: forbidden, localStorage: forbidden, sessionStorage: forbidden,
    async fetch(url, request) {
      assert.equal(url, '/api/crm?view=session');
      assert.equal(request.method, 'GET', 'a confirmed session must not send another verification SMS');
      assert.equal(request.credentials, 'same-origin');
      assert.equal(request.cache, 'no-store');
      calls.push(url);
      return { ok: true, status: 200, async json() { return { authenticated: true, identity: { role: 'customer', phoneMasked: '187****1111' } }; } };
    }
  });
  for (let index = 0; index < 4; index++) await new Promise(resolve => setImmediate(resolve));
  return { html, redirects, resumed, calls };
}

test('Industrial login returns to canonical and all styled query targets after confirming an existing session without SMS', async () => {
  for (const [options] of scriptBaselines.filter(([options]) => !options.resumeQuestion)) {
    const result = await activeSessionNavigation(options);
    assert.deepEqual(result.redirects, [options.returnTo]);
    assert.deepEqual(result.resumed, []);
    assert.equal(result.calls.length, 1);
  }
});

test('Industrial decoration preserves hidden native POST recovery and original multilingual question for every style', async () => {
  const question = '客户询问 I-110 <script> & "protocols"';
  for (const base of new Set(['/demo/wasion', ...Object.keys(WASION_STYLES).map(wasionStyleBase), '/demo/wasion/styles/industrial'])) {
    const returnTo = base + '/search';
    const result = await activeSessionNavigation({ returnTo, resumeQuestion: question });
    assert.ok(result.html.includes('id="demo-resume" action="' + returnTo + '" method="post" hidden'));
    assert.ok(result.html.includes('name="q" value="' + escape(question) + '"'));
    assert.ok(!result.html.includes('value="Customer'));
    assert.deepEqual(result.resumed, [returnTo]);
    assert.deepEqual(result.redirects, []);
    assert.equal(result.calls.length, 1);
  }
});

const response = () => ({ headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value; }, end(body) { this.body = body; } });
function assertPrivateInlineLogin(res) {
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['cache-control'], /private, no-store/);
  assert.match(res.headers['x-robots-tag'], /noindex/);
  const nonceValue = res.body.match(/<script nonce="([^"]+)">/)[1];
  assert.equal(res.headers['content-security-policy'], `default-src 'none'; script-src 'nonce-${nonceValue}'; style-src 'nonce-${nonceValue}'; img-src data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'`);
  for (const [, , attributes] of res.body.matchAll(/<(style|script)\b([^>]*)>/g)) assert.ok(attributes.includes('nonce="' + nonceValue + '"'));
  assert.doesNotMatch(res.body, /<script\b[^>]*\bsrc=|<link\b[^>]*\bhref=|<iframe\b|@import\b|url\(\s*["']?https?:|<img\b[^>]*src="https?:/i);
}

test('both entry and expired-POST login keep the existing private nonce CSP with no new external asset permissions', async () => {
  const initial = response();
  await crmPage({ method: 'GET', headers: { host: 'crm.cnps.ai' }, url: '/?returnTo=%2Fdemo%2Fwasion' }, initial);
  assertPrivateInlineLogin(initial);
  const handler = createWasionPageHandler({ getRuntime: () => ({ auth: { loadSession: async () => null }, projectAccessService: { getProject: async () => null } }) });
  for (const style of Object.keys(WASION_STYLES)) {
    const recovery = response(), base = wasionStyleBase(style);
    await handler({ method: 'POST', url: base + '/search', query: { style, slug: 'search' }, headers: { host: 'crm.cnps.ai', origin: 'https://crm.cnps.ai' }, body: { q: 'I-110 & specifications' } }, recovery);
    assertPrivateInlineLogin(recovery);
    assert.ok(recovery.body.includes('id="demo-resume" action="' + base + '/search" method="post" hidden'));
    assert.equal(recovery.headers.location, undefined);
  }
});
