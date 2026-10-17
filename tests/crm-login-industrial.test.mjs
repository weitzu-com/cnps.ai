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
// Preserve the original visual-regression baseline apart from the intentional
// browser timeout increase beyond the auth function's 30s execution budget.
const originalBudget = value => value.replace('controller.abort(), 35000', 'controller.abort(), 15000');
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const clientScript = html => {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1, 'the visual change must not add another client script');
  return scripts[0][1];
};

// Captured from the unmodified 825d74a renderer, before the Industrial login
// decoration. Fixed byte lengths and SHA-256 retain the complete original JS,
// including whitespace, rather than restating selected implementation lines.
const scriptBaselines = [
  [{ returnTo: '/demo/wasion' }, 10027, '9dc653ba2904e9ee92327ebcbe6d80f33cb2db72341e353868a7170be67cb7ff'],
  [{ returnTo: '/demo/wasion/search?q=I-110+%26+AMI#results' }, 10058, '3128d40d38c50c47c609f97209dc70bba3170ac41d7c16bf0e69f91c1f651e9c'],
  [{ returnTo: '/demo/wasion/styles/classic/search?q=I-110+%26+AMI' }, 10065, '44d296fffc817eb315befce91d13566c5fc2b859fa20cec6e26656554ce763ab'],
  [{ returnTo: '/demo/wasion/styles/atmospheric/search?q=I-110+%26+AMI' }, 10069, '723f4b264ab246c8ab83292c828c940b429326db6b8a1fc4ddad41e68404850d'],
  [{ returnTo: '/demo/wasion/styles/planhat/search?q=I-110+%26+AMI' }, 10065, 'bba6b48e47ff8579e08ff28d008f6365f01b0a506f2ffc8c215915b4de6cdbf4'],
  [{ returnTo: '/demo/wasion/styles/orderful/search?q=I-110+%26+AMI' }, 10066, 'e542a00608351877869ce306061d82ab22747b96f5c8106a4503369ca4f49d45'],
  [{ returnTo: '/demo/wasion/styles/industrial/search?q=I-110+%26+AMI' }, 10068, 'd96dab664e72054fd28084a416f134bb3fd9a643a4081bd8f850e4594d2fb859'],
  [{ returnTo: '/demo/wasion/search', resumeQuestion: '客户询问 I-110 <script> & protocols' }, 10033, '9ff1d516955dd8794e42cc415b9251fab347b442f09236d9e34674c1ac63e051'],
  [{ returnTo: '/demo/wasion/styles/orderful/search', resumeQuestion: 'aMeter300 <script> & IDIS 2.0' }, 10049, '711a8fbdd9e73c9c36febda3592dad6f1f7592773138c3325f319d97a8b85cb4']
];
const genericBaselines = [
  [undefined, 19574, 'f8c7d0ef96c990e5a72b7ca668432520242913e3885f3d392c0513927810b1bb'],
  ['/workspace', 19582, '3906aa6bdcd638ad28b8a537fd641fd5222bf9b0413893005571b7adfbfdf17a'],
  ['/w', 19574, 'b6663459e26727b064a39637bc162633c25ce70a01386ba9a463acfa6bb51323']
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

test('Industrial login decoration preserves every original client-script byte for canonical, styled, query and POST targets', () => {
  for (const [options, bytes, digest] of scriptBaselines) {
    const script = originalBudget(clientScript(crmLoginPage(nonce, options)));
    assert.equal(Buffer.byteLength(script), bytes, options.returnTo);
    assert.equal(hash(script), digest, options.returnTo);
    assert.doesNotThrow(() => new Script(script), options.returnTo);
  }
});

test('generic CRM and proposal login HTML remain byte-identical to the original renderer', () => {
  for (const [returnTo, bytes, digest] of genericBaselines) {
    const html = originalBudget(crmLoginPage(nonce, { returnTo }));
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
