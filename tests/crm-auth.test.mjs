import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createCrmAuthHandler, CRM_SESSION_COOKIE, CRM_CHALLENGE_COOKIE } from '../server/crm-auth-handler.mjs';
import { CrmSmsFailure } from '../server/crm-sms-failure.mjs';
import { createCrmStore } from '../server/crm-auth-store.mjs';
import { createCrmSms, CRM_SMS_SCHEME } from '../server/crm-auth-sms.mjs';
import { createHandler as createProposalHandler } from '../server/proposal-handler.mjs';

const adminPhone = '18700001111';
const customerPhone = '18800002222';
function harness({ memberDirectory = new Map(), accessDirectory, detailedQuotas = true, startTime = Date.UTC(2026, 9, 13) } = {}) {
  let time = startTime, sends = 0, verifications = 0, smsFailure = false, verifyFailure = false;
  let onVerify, onSessionWrite, onVisit, directoryFailure = false, storeFailure = false;
  const env = { CNPS_PROPOSAL_SECRET: randomBytes(32).toString('hex'), CNPS_PROPOSAL_ALLOWED_PHONES: adminPhone, CNPS_CRM_ADMIN_PHONE: adminPhone };
  const limits = new Map(), values = new Map(), visits = [], failures = [];
  const reserve = async items => {
    for (const item of items) {
      const entry = limits.get(item.name);
      if (entry?.expiry > time && entry.count >= item.max) return false;
    }
    for (const item of items) {
      let entry = limits.get(item.name);
      if (!entry || entry.expiry <= time) entry = { count: 0, expiry: time + item.ttl * 1000 };
      entry.count++;
      limits.set(item.name, entry);
    }
    return true;
  };
  const reserveDetailed = async items => {
    const blocked = items.flatMap(item => {
      const entry = limits.get(item.name);
      return entry?.expiry > time && entry.count >= item.max
        ? [{ name: item.name, kind: item.name.split(':')[0], ttl: Math.ceil((entry.expiry - time) / 1000) }] : [];
    });
    return blocked.length ? { allowed: false, blocked } : { allowed: await reserve(items), blocked: [] };
  };
  const memoryStore = prefix => {
    const get = name => {
      const entry = values.get(prefix + name);
      return entry?.expiry > time ? structuredClone(entry.value) : null;
    };
    return {
      reserve,
      ...(detailedQuotas ? { reserveDetailed } : {}),
      async set(name, value, ttl) {
        values.set(prefix + name, { value: structuredClone(value), expiry: time + ttl * 1000 });
        if (prefix === 'crm:' && name.startsWith('session:') && onSessionWrite) { const callback = onSessionWrite; onSessionWrite = null; await callback(); }
      },
      async get(name) { if (storeFailure) throw new Error('fixture storage outage'); return get(name); },
      async del(name) { values.delete(prefix + name); },
      async attempt(id, binding) {
        const value = get('challenge:' + id);
        if (!value || value.binding !== binding || value.attempts >= 5) return null;
        values.get(prefix + 'challenge:' + id).value.attempts++;
        return value;
      },
      async consume(id, binding) {
        const value = get('challenge:' + id);
        if (!value || value.binding !== binding) return false;
        values.delete(prefix + 'challenge:' + id);
        return true;
      }
    };
  };
  const crmStore = memoryStore('crm:'), proposalStore = memoryStore('proposal:');
  const smsFactory = () => ({
    async send() { if (smsFailure) throw smsFailure instanceof Error ? smsFailure : new Error('secret provider diagnostics'); sends++; },
    async verify(phone, code) { if (verifyFailure) throw new Error('private provider error'); verifications++; if (onVerify) { const callback = onVerify; onVerify = null; await callback(); } return [adminPhone, customerPhone].includes(phone) && code === '123456'; }
  });
  const handler = createCrmAuthHandler({ env, loadAccess: accessDirectory ? async phone => accessDirectory.get(phone) || {memberships:[],contexts:[],proposals:[]} : undefined, reportFailure: event => failures.push(event), storeFactory: () => crmStore, smsFactory,
    loadMemberships: async phone => { if (directoryFailure) throw new Error('fixture directory outage'); return memberDirectory.get(phone) || []; }, now: () => time,
    recordVisit: async visit => { visits.push(visit); if (onVisit) { const callback = onVisit; onVisit = null; await callback(); } } });
  const proposalHandler = createProposalHandler({ env, storeFactory: () => proposalStore, smsFactory,
    now: () => time, loadBundle: async () => ({ html: 'private proposal', assets: {} }) });
  async function request(url = '/api/crm', { method = 'GET', body, cookie = '', origin, extra = {} } = {}, target = handler) {
    const headers = {}; let output;
    const res = { setHeader(name, value) { headers[name.toLowerCase()] = value; }, end(value) { output = value; } };
    await target({ url, method, body, headers: { origin:origin||(target===handler?'https://crm.cnps.ai':'https://www.cnps.ai'), 'content-type': 'application/json', 'x-cnps-crm': '1', 'x-proposal-request': '1', cookie, 'x-real-ip': '192.0.2.1', ...extra } }, res);
    return { status: res.statusCode, headers, text: String(output || ''), json() { return JSON.parse(output); } };
  }
  async function send(phone = adminPhone) {
    const response = await request('/api/crm', { method: 'POST', body: { action: 'send', phone, consent: true } });
    assert.equal(response.status, 200, response.text);
    return { id: response.json().challenge, cookie: response.headers['set-cookie'].split(';')[0], response };
  }
  async function login(phone = adminPhone) {
    const challenge = await send(phone);
    const response = await request('/api/crm', { method: 'POST', body: { action: 'verify', challenge: challenge.id, code: '123456' }, cookie: challenge.cookie });
    assert.equal(response.status, 200, response.text);
    return { challenge, cookie: response.headers['set-cookie'][0].split(';')[0], response };
  }
  return { env, handler, request, send, login, visits, values, limits, failures, memberDirectory, advance: ms => time += ms,
    sends: () => sends, verifications: () => verifications, failSms: (error = true) => smsFailure = error, failVerify: () => verifyFailure = true,
    duringVerify: callback => onVerify = callback, duringSessionWrite: callback => onSessionWrite = callback, duringVisit: callback => onVisit = callback,
    failDirectory: () => directoryFailure = true, failStore: () => storeFailure = true,
    proposalRequest: (url, input) => request(url, input, proposalHandler) };
}
const member = (role = 'customer', companyId = 'company-A') => ({ companyId, active: true, role, permissions: ['projects:read', 'documents:read'], projectIds: ['project-A'], documentIds: ['document-A'] });
const storedSession = h => [...h.values].find(([name]) => name.startsWith('crm:session:'))?.[1];

test('provider outages identify the failing step without logging credentials, codes or granting a session', async () => {
  const sending = harness(); sending.failSms();
  const failedSend = await sending.request('/api/crm', {method:'POST',body:{action:'send',phone:adminPhone,consent:true}});
  assert.equal(failedSend.status,503); assert.equal(failedSend.json().stage,'sms-send');
  assert.deepEqual(sending.failures,[{stage:'sms-send'}]);
  const checking = harness(); const challenge = await checking.send(); checking.failVerify();
  const failedVerify = await checking.request('/api/crm', {method:'POST',cookie:challenge.cookie,body:{action:'verify',challenge:challenge.id,code:'123456'}});
  assert.equal(failedVerify.status,503); assert.equal(failedVerify.json().stage,'sms-verify');
  assert.equal(failedVerify.headers['set-cookie'],undefined);
  assert.deepEqual(checking.failures,[{stage:'sms-verify'}]);
  const output = JSON.stringify([sending.failures,checking.failures,failedSend.json(),failedVerify.json()]);
  for (const value of [adminPhone,'123456',challenge.id,'private provider error']) assert.ok(!output.includes(value));
  assert.equal((await checking.request('/api/crm?view=session')).status,401);
});

test('only explicitly approved admin bypasses directory; original proposal allowlist is not CRM authorization', async () => {
  const h = harness();
  const requests = [customerPhone, '18900003333', '18500004444', '18300005555'];
  for (const phone of requests) assert.equal((await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone, consent: true, role: 'admin' } })).status, 403);
  assert.equal(h.sends(), 0);
  const login = await h.login();
  const response = await h.request('/api/crm?view=session', { cookie: login.cookie });
  assert.equal(response.json().identity.role, 'admin');
  assert.equal(response.json().identity.phoneMasked, '187****1111');
  assert.deepEqual(response.json().identity.memberships, []);
});
test('missing or invalid server admin setting disables authentication without any default grant', async () => {
  for (const setting of [undefined, '', 'not-a-phone', `${adminPhone},${customerPhone}`]) {
    const h = harness({ memberDirectory: new Map([[customerPhone, [member()]]]) });
    h.env.CNPS_CRM_ADMIN_PHONE = setting;
    for (const phone of [adminPhone, customerPhone]) {
      const response = await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone, consent: true, CNPS_CRM_ADMIN_PHONE: phone, role: 'admin' } });
      assert.equal(response.status, 503);
      assert.ok(!response.text.includes(phone));
    }
    assert.equal((await h.request('/api/crm?view=session')).status, 503);
    assert.equal(h.sends(), 0);
  }
});
test('request fields and a directory admin role cannot change the server configured administrator', async () => {
  const h = harness({ memberDirectory: new Map([[customerPhone, [{ ...member(), role: 'admin' }, member()]]]) });
  const c = await h.send(customerPhone);
  const verified = await h.request('/api/crm', { method: 'POST', cookie: c.cookie, body: {
    action: 'verify', challenge: c.id, code: '123456', role: 'admin', adminPhone: customerPhone, CNPS_CRM_ADMIN_PHONE: customerPhone
  } });
  assert.equal(verified.status, 200);
  const session = await h.request('/api/crm?view=session', { cookie: verified.headers['set-cookie'][0].split(';')[0] });
  assert.equal(session.json().identity.role, 'customer');
  assert.equal(session.json().identity.memberships.length, 1);
  assert.equal(h.env.CNPS_CRM_ADMIN_PHONE, adminPhone);
});
test('changing server admin setting revokes an old administrator session immediately', async () => {
  const h = harness(), login = await h.login();
  h.env.CNPS_CRM_ADMIN_PHONE = '18900003333';
  assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 401);
});
test('customer identity contains only server directory companies and scoped documents', async () => {
  const h = harness({ memberDirectory: new Map([[customerPhone, [member()]]]) });
  const c = await h.send(customerPhone);
  const response = await h.request('/api/crm', { method: 'POST', cookie: c.cookie, body: { action: 'verify', challenge: c.id, code: '123456', role: 'admin', companyId: 'company-B', permissions: ['all'] } });
  assert.equal(response.status, 200);
  const session = await h.request('/api/crm?view=session', { cookie: response.headers['set-cookie'][0].split(';')[0] });
  assert.deepEqual(session.json().identity, { role: 'customer', phoneMasked: '188****2222', memberships: [{ companyId: 'company-A', role: 'customer', permissions: ['projects:read', 'documents:read'], projectIds: ['project-A'], documentIds: ['document-A'] }] });
  assert.equal(h.visits.length, 1);
  assert.deepEqual(h.visits[0].companyIds, ['company-A']);
  assert.equal(h.visits[0].purpose, 'crm-sms-login');
  assert.ok(!JSON.stringify([...h.values.values()]).includes(customerPhone));
  assert.ok(!JSON.stringify([...h.values.values()]).includes('123456'));
});
test('untrusted member admin role, inactive records and invalid company IDs never grant access', async () => {
  for (const entry of [{ ...member(), role: 'admin' }, { ...member(), active: false }, { ...member(), companyId: '../company-B' }]) {
    const h = harness({ memberDirectory: new Map([[customerPhone, [entry]]]) });
    assert.equal((await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: customerPhone, consent: true } })).status, 403);
    assert.equal(h.sends(), 0);
  }
});
test('membership revocation between send and verification blocks provider verification and session', async () => {
  const h = harness({ memberDirectory: new Map([[customerPhone, [member()]]]) }), c = await h.send(customerPhone);
  h.memberDirectory.delete(customerPhone);
  assert.equal((await h.request('/api/crm', { method: 'POST', cookie: c.cookie, body: { action: 'verify', challenge: c.id, code: '123456' } })).status, 403);
  assert.equal(h.verifications(), 0);
});
test('membership and role are refreshed on every session read, preventing stale grants', async () => {
  const h = harness({ memberDirectory: new Map([[customerPhone, [member('sales_manager')]]]) }), login = await h.login(customerPhone);
  assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).json().identity.role, 'sales_manager');
  h.memberDirectory.set(customerPhone, [member('customer')]);
  assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).json().identity.role, 'customer');
  h.memberDirectory.delete(customerPhone);
  assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 401);
});
test('consent, same-origin and CSRF header are required before any SMS', async () => {
  const h = harness();
  const inputs = [{ body: { action: 'send', phone: adminPhone } }, { origin: 'https://evil.example' }, { extra: { 'x-cnps-crm': '' } }];
  for (const input of inputs) assert.ok((await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: adminPhone, consent: true }, ...input })).status >= 400);
  assert.equal(h.sends(), 0);
});
test('challenge binds to initiating browser and phone; five provider attempts maximum', async () => {
  const h = harness(), c = await h.send();
  const body = { action: 'verify', challenge: c.id, code: '123456' };
  assert.equal((await h.request('/api/crm', { method: 'POST', body })).status, 400);
  assert.equal((await h.request('/api/crm', { method: 'POST', cookie: c.cookie, body: { ...body, phone: customerPhone } })).status, 400);
  for (let i = 0; i < 5; i++) assert.equal((await h.request('/api/crm', { method: 'POST', cookie: c.cookie, body: { ...body, code: '000000' } })).status, 400);
  assert.equal(h.verifications(), 4); // mismatched phone consumed one allowed attempt
  const h2 = harness(), c2 = await h2.send();
  for (let i = 0; i < 6; i++) assert.equal((await h2.request('/api/crm', { method: 'POST', cookie: c2.cookie, body: { action: 'verify', challenge: c2.id, code: '000000' } })).status, 400);
  assert.equal(h2.verifications(), 5);
});
test('challenge success is consumed once across concurrent requests and cannot replay', async () => {
  const h = harness(), c = await h.send();
  const request = () => h.request('/api/crm', { method: 'POST', cookie: c.cookie, body: { action: 'verify', challenge: c.id, code: '123456' } });
  const responses = await Promise.all([request(), request()]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 400]);
  assert.equal((await request()).status, 400);
  assert.equal(h.visits.length, 1);
});
test('CRM and proposal challenges and sessions cannot authorize one another', async () => {
  const h = harness();
  const p = await h.proposalRequest('/w/send', { method: 'POST', body: { phone: adminPhone, consent: true } });
  const proposalChallenge = p.json().challenge, proposalCookie = p.headers['set-cookie'].split(';')[0];
  assert.equal((await h.request('/api/crm', { method: 'POST', cookie: proposalCookie, body: { action: 'verify', challenge: proposalChallenge, code: '123456' } })).status, 400);
  const fakeCrmCookie = `${CRM_CHALLENGE_COOKIE}=${proposalCookie.split('=')[1]}`;
  assert.equal((await h.request('/api/crm', { method: 'POST', cookie: fakeCrmCookie, body: { action: 'verify', challenge: proposalChallenge, code: '123456' } })).status, 400);
  const verified = await h.proposalRequest('/w/verify', { method: 'POST', cookie: proposalCookie, body: { challenge: proposalChallenge, code: '123456' } });
  const proposalSession = verified.headers['set-cookie'][0].split(';')[0];
  assert.equal((await h.request('/api/crm?view=session', { cookie: proposalSession })).status, 401);
  assert.equal((await h.request('/api/crm?view=session', { cookie: `${CRM_SESSION_COOKIE}=${proposalSession.split('=')[1]}` })).status, 401);
  h.advance(61000);
  const crm = await h.login();
  assert.equal((await h.proposalRequest('/w/asset/pdf', { cookie: crm.cookie })).status, 401);
});
test('shared proposal and CRM cooldown and 3000 per month budget apply before provider send', async () => {
  const h = harness();
  const proposal = await h.proposalRequest('/w/send', { method: 'POST', body: { phone: adminPhone, consent: true } });
  assert.equal(proposal.status, 200);
  const crmSend = () => h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: adminPhone, consent: true } });
  assert.equal((await crmSend()).status, 429);
  h.advance(61000);
  assert.equal((await crmSend()).status, 200);
  const month = [...h.limits.entries()].find(([key]) => key.startsWith('send-month:'));
  assert.equal(month[1].count, 2);
  month[1].count = 3000;
  h.advance(61000);
  assert.equal((await crmSend()).status, 429);
  assert.equal((await h.proposalRequest('/w/send', { method: 'POST', body: { phone: adminPhone, consent: true } })).status, 429);
  assert.equal(h.sends(), 2);
});
test('existing old global limits permit new CRM and proposal requests without resetting usage', async () => {
  const h = harness();
  await h.send();
  const day = [...h.limits].find(([key]) => key.startsWith('send-day:'))[1];
  const month = [...h.limits].find(([key]) => key.startsWith('send-month:'))[1];
  day.count = 20; month.count = 100;
  h.advance(61000);
  await h.send();
  h.advance(61000);
  assert.equal((await h.proposalRequest('/w/send', { method: 'POST', body: { phone: adminPhone, consent: true } })).status, 200);
  assert.equal(day.count, 22);
  assert.equal(month.count, 102);
  assert.equal(h.sends(), 3);
  // Phone-level protection remains enforced even with account capacity.
  [...h.limits].find(([key]) => key.startsWith('phone-day:'))[1].count = 20;
  h.advance(61000);
  assert.equal((await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: adminPhone, consent: true } })).json().code, 'SMS_PHONE_DAILY_LIMIT');
  assert.equal(day.count, 22);
  assert.equal(month.count, 102);
});
test('cooldown explains the exact remaining wait without changing counters or exposing identifiers', async () => {
  const h = harness();
  await h.send();
  h.advance(17000);
  const before = structuredClone([...h.limits]);
  const response = await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: adminPhone, consent: true } });
  assert.equal(response.status, 429);
  assert.deepEqual(response.json(), { code: 'SMS_COOLDOWN', error: '请等待43秒后重新获取验证码。', retryAfterSeconds: 43 });
  assert.equal(response.headers['retry-after'], '43');
  assert.deepEqual([...h.limits], before);
  assert.equal(h.sends(), 1);
  assert.ok(!response.text.includes(adminPhone));
  assert.ok(!response.text.includes('cooldown:'));
});
test('existing five-send counters allow further CRM and proposal sends under the shared twenty-send allowance', async () => {
  const h = harness();
  await h.send();
  const phoneDay = [...h.limits].find(([key]) => key.startsWith('phone-day:'))[1];
  phoneDay.count = 5;
  h.advance(61000);
  await h.send();
  assert.equal(phoneDay.count, 6);
  h.advance(61000);
  const response = await h.proposalRequest('/w/send', { method: 'POST', body: { phone: adminPhone, consent: true } });
  assert.equal(response.status, 200);
  assert.equal(phoneDay.count, 7);
  assert.equal([...h.limits].find(([key]) => key.startsWith('send-month:'))[1].count, 3);
  phoneDay.count = 20;
  h.advance(61000);
  assert.equal((await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: adminPhone, consent: true } })).json().code, 'SMS_PHONE_DAILY_LIMIT');
  assert.equal((await h.proposalRequest('/w/send', { method: 'POST', body: { phone: adminPhone, consent: true } })).status, 429);
  assert.equal(h.sends(), 3);
});
test('simultaneous limits report the longest effective wait and dated day limits reset at China midnight', async () => {
  const h = harness({ startTime: Date.UTC(2026, 9, 13, 15, 59, 30) });
  await h.send();
  const phoneDay = [...h.limits].find(([key]) => key.startsWith('phone-day:'));
  phoneDay[1].count = 20;
  // The daily key changes in 30 seconds, but the current cooldown lasts 60.
  let response = await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: adminPhone, consent: true } });
  assert.equal(response.json().code, 'SMS_COOLDOWN');
  assert.equal(response.json().retryAfterSeconds, 60);
  h.advance(31000);
  response = await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: adminPhone, consent: true } });
  assert.equal(response.json().retryAfterSeconds, 29);
  h.advance(29000);
  assert.equal((await h.send()).response.status, 200);
});
test('daily and monthly errors cap Redis retention at their China calendar boundary', async () => {
  for (const [kind, cap, code, startTime, seconds, expectedTime] of [
    ['phone-day', 20, 'SMS_PHONE_DAILY_LIMIT', Date.UTC(2026, 9, 13, 15, 57), 180, '10月14日00:00'],
    ['send-day', 200, 'SMS_DAILY_LIMIT', Date.UTC(2026, 9, 13, 15, 57), 180, '10月14日00:00'],
    ['send-month', 3000, 'SMS_MONTHLY_LIMIT', Date.UTC(2026, 9, 31, 15, 57), 180, '11月1日00:00']
  ]) {
    const h = harness({ startTime });
    await h.send();
    const entry = [...h.limits].find(([key]) => key.startsWith(kind + ':'));
    entry[1].count = cap;
    const response = await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: adminPhone, consent: true } });
    assert.equal(response.status, 429);
    assert.equal(response.json().code, code);
    assert.equal(response.json().retryAfterSeconds, seconds);
    assert.equal(response.headers['retry-after'], String(seconds));
    assert.ok(response.json().error.includes(expectedTime));
    assert.equal(h.sends(), 1);
    h.advance(seconds * 1000);
    assert.equal((await h.send()).response.status, 200);
  }
});
test('an hourly network limit remains longer than a daily boundary and cannot be hidden by cooldown', async () => {
  const h = harness({ startTime: Date.UTC(2026, 9, 13, 15, 57) });
  await h.send();
  [...h.limits].find(([key]) => key.startsWith('ip-hour:'))[1].count = 10;
  [...h.limits].find(([key]) => key.startsWith('send-day:'))[1].count = 200;
  const response = await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: adminPhone, consent: true } });
  assert.equal(response.json().code, 'SMS_IP_HOURLY_LIMIT');
  assert.equal(response.json().retryAfterSeconds, 3600);
  assert.equal(response.headers['retry-after'], '3600');
  assert.equal(h.sends(), 1);
});
test('legacy boolean quota stores still enforce limits without inventing a retry time', async () => {
  const h = harness({ detailedQuotas: false });
  await h.send();
  const response = await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: adminPhone, consent: true } });
  assert.equal(response.status, 429);
  assert.equal(response.json().code, 'SMS_RATE_LIMIT');
  assert.equal(response.json().retryAfterSeconds, undefined);
  assert.equal(response.headers['retry-after'], undefined);
  assert.equal(h.sends(), 1);
});
test('administrator sessions are secure, expire after eight hours, and logout revokes them', async () => {
  const h = harness(), login = await h.login();
  assert.match(login.response.headers['set-cookie'][0], /^__Host-cnps_crm=.*; Path=\/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800$/);
  const response = await h.request('/api/crm?view=session', { cookie: login.cookie });
  assert.match(response.headers['cache-control'], /no-store/);
  assert.match(response.headers['x-robots-tag'], /noindex/);
  h.advance(8 * 3600e3 + 1);
  assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 401);
  const h2 = harness(), login2 = await h2.login();
  assert.equal((await h2.request('/api/crm', { method: 'POST', cookie: login2.cookie, body: { action: 'logout' } })).status, 200);
  assert.equal((await h2.request('/api/crm?view=session', { cookie: login2.cookie })).status, 401);
});
test('customer sessions persist for a fixed thirty days without additional SMS or renewal', async () => {
  const h = harness({ memberDirectory: new Map([[customerPhone, [member()]]]) }), login = await h.login(customerPhone);
  const entry = storedSession(h), issuedAt = Date.UTC(2026, 9, 13), expires = issuedAt + 30 * 86400e3;
  assert.match(login.response.headers['set-cookie'][0], /^__Host-cnps_crm=.*; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000$/);
  assert.match(login.challenge.response.headers['set-cookie'], /SameSite=Strict; Max-Age=300$/);
  assert.equal(entry.value.issuedAt, issuedAt);
  assert.equal(entry.value.roleAtVerification, 'customer');
  assert.equal(entry.value.authEpoch, 0);
  assert.equal(entry.value.expires, expires);
  assert.equal(entry.expiry, expires);
  for (const elapsed of [8 * 3600e3, 21 * 86400e3, 9 * 86400e3 - 8 * 3600e3 - 1]) {
    h.advance(elapsed);
    const response = await h.request('/api/crm?view=session', { cookie: login.cookie });
    assert.equal(response.status, 200);
    assert.equal(response.json().authenticatedAt, issuedAt);
    assert.equal(response.json().expiresAt, expires);
    assert.equal(response.headers['set-cookie'], undefined);
    assert.ok(!response.text.includes('authEpoch'));
    assert.ok(!response.text.includes('roleAtVerification'));
    assert.equal(entry.value.expires, expires);
    assert.equal(entry.expiry, expires);
  }
  assert.equal(h.sends(), 1);
  assert.equal(h.verifications(), 1);
  h.advance(1);
  assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 401);
});
test('sales manager sessions retain their strict eight-hour lifetime even after a role downgrade', async () => {
  const h = harness({ memberDirectory: new Map([[customerPhone, [member('sales_manager')]]]) }), login = await h.login(customerPhone);
  assert.match(login.response.headers['set-cookie'][0], /SameSite=Strict; Max-Age=28800$/);
  assert.equal(storedSession(h).value.expires - storedSession(h).value.issuedAt, 8 * 3600e3);
  h.memberDirectory.set(customerPhone, [member()]);
  h.advance(8 * 3600e3 - 1);
  assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 200);
  h.advance(1);
  assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 401);
});
test('customer sessions cannot acquire privileged roles without a new verification', async () => {
  for (const role of ['sales_manager', 'admin']) {
    const h = harness({ memberDirectory: new Map([[customerPhone, [member()]]]) }), login = await h.login(customerPhone);
    if (role === 'admin') h.env.CNPS_CRM_ADMIN_PHONE = customerPhone;
    else h.memberDirectory.set(customerPhone, [member(role)]);
    assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 401);
    h.advance(61000);
    const next = await h.login(customerPhone);
    assert.match(next.response.headers['set-cookie'][0], /SameSite=Strict; Max-Age=28800$/);
    assert.equal((await h.request('/api/crm?view=session', { cookie: next.cookie })).json().identity.role, role);
  }
});
test('scope changes remain live while revoke and regrant never reactivate an old customer session', async () => {
  const h = harness({ memberDirectory: new Map([[customerPhone, [member()]]]) }), login = await h.login(customerPhone);
  h.memberDirectory.set(customerPhone, [{ ...member(), documentIds: [], permissions: ['projects:read'], authEpoch: 0 }]);
  const scoped = await h.request('/api/crm?view=session', { cookie: login.cookie });
  assert.equal(scoped.status, 200);
  assert.deepEqual(scoped.json().identity.memberships[0].documentIds, []);
  h.memberDirectory.set(customerPhone, [{ ...member(), active: false, authEpoch: 1 }]);
  assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 401);
  h.memberDirectory.set(customerPhone, [{ ...member(), authEpoch: 1 }]);
  assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 401);
  h.advance(61000);
  const fresh = await h.login(customerPhone);
  assert.equal((await h.request('/api/crm?view=session', { cookie: fresh.cookie })).status, 200);
  assert.equal(storedSession(h).value.authEpoch, 0); // The retained old credential was not silently upgraded.
});
test('legacy sessions keep the original eight-hour deadline and default generation zero', async () => {
  for (const role of ['admin', 'customer', 'sales_manager']) {
    const h = harness({ memberDirectory: new Map([[customerPhone, [member(role)]]]) }), login = await h.login(role === 'admin' ? adminPhone : customerPhone);
    const entry = storedSession(h), expires = entry.value.issuedAt + 8 * 3600e3;
    for (const field of ['issuedAt', 'roleAtVerification', 'authEpoch']) delete entry.value[field];
    entry.value.expires = expires; entry.expiry = expires;
    const response = await h.request('/api/crm?view=session', { cookie: login.cookie });
    assert.equal(response.status, 200);
    assert.equal(response.json().expiresAt, expires);
    assert.equal(response.json().authenticatedAt, expires - 8 * 3600e3);
    h.advance(8 * 3600e3);
    assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 401);
  }
  const h = harness({ memberDirectory: new Map([[customerPhone, [member()]]]) }), login = await h.login(customerPhone), entry = storedSession(h);
  for (const field of ['issuedAt', 'roleAtVerification', 'authEpoch']) delete entry.value[field];
  entry.value.expires = Date.UTC(2026, 9, 13) + 8 * 3600e3;
  h.memberDirectory.set(customerPhone, [{ ...member(), authEpoch: 1 }]);
  assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 401);
});
test('malformed session metadata or invalid directory generations never authorize a session', async () => {
  for (const mutation of [
    entry => delete entry.value.authEpoch,
    entry => entry.value.roleAtVerification = 'invented',
    entry => entry.value.authEpoch = -1,
    entry => entry.value.issuedAt += 1,
    entry => entry.value.expires += 1
  ]) {
    const h = harness({ memberDirectory: new Map([[customerPhone, [member()]]]) }), login = await h.login(customerPhone);
    mutation(storedSession(h));
    assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 401);
  }
  for (const authEpoch of [-1, null, '0', 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    const h = harness({ memberDirectory: new Map([[customerPhone, [{ ...member(), authEpoch }]]]) });
    assert.equal((await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: customerPhone, consent: true } })).status, 503);
    assert.equal(h.sends(), 0);
  }
});
test('verification rejects revocation and restore during provider checks, session writes and audit writes', async () => {
  for (const hook of ['duringVerify', 'duringSessionWrite', 'duringVisit']) {
    const h = harness({ memberDirectory: new Map([[customerPhone, [member()]]]) }), challenge = await h.send(customerPhone);
    h[hook](async () => { h.memberDirectory.set(customerPhone, [{ ...member(), authEpoch: 1 }]); });
    const response = await h.request('/api/crm', { method: 'POST', cookie: challenge.cookie, body: { action: 'verify', challenge: challenge.id, code: '123456' } });
    assert.equal(response.status, 403, hook);
    assert.equal(response.headers['set-cookie'], undefined);
    assert.equal(storedSession(h), undefined);
  }
});
test('revocation and regrant after SMS send invalidate the old challenge before provider verification', async () => {
  const h = harness({ memberDirectory: new Map([[customerPhone, [member()]]]) }), challenge = await h.send(customerPhone);
  h.memberDirectory.set(customerPhone, [{ ...member(), authEpoch: 1 }]);
  const response = await h.request('/api/crm', { method: 'POST', cookie: challenge.cookie, body: { action: 'verify', challenge: challenge.id, code: '123456' } });
  assert.equal(response.status, 403);
  assert.equal(h.verifications(), 0);
  assert.equal(storedSession(h), undefined);
  h.advance(61000);
  const fresh = await h.login(customerPhone);
  assert.equal((await h.request('/api/crm?view=session', { cookie: fresh.cookie })).status, 200);
});
test('authentication outages fail closed and revoked customer logout tokens cannot be replayed', async () => {
  for (const failure of ['failStore', 'failDirectory']) {
    const h = harness({ memberDirectory: new Map([[customerPhone, [member()]]]) }), login = await h.login(customerPhone);
    h[failure]();
    const response = await h.request('/api/crm?view=session', { cookie: login.cookie });
    assert.equal(response.status, 503);
    assert.ok(!response.text.includes(customerPhone));
    assert.equal(h.sends(), 1);
  }
  const h = harness({ memberDirectory: new Map([[customerPhone, [member()]]]) }), login = await h.login(customerPhone);
  const response = await h.request('/api/crm', { method: 'POST', cookie: login.cookie, body: { action: 'logout' } });
  assert.equal(response.status, 200);
  assert.match(response.headers['set-cookie'][0], /SameSite=Lax; Max-Age=0$/);
  assert.equal((await h.request('/api/crm?view=session', { cookie: login.cookie })).status, 401);
  assert.equal((await h.request('/api/crm?view=session')).status, 401);
});
test('expired challenges, forged sessions, malformed requests and provider errors fail safely', async () => {
  const h = harness(), c = await h.send();
  h.advance(300001);
  assert.equal((await h.request('/api/crm', { method: 'POST', cookie: c.cookie, body: { action: 'verify', challenge: c.id, code: '123456' } })).status, 400);
  assert.equal((await h.request('/api/crm?view=session', { cookie: `${CRM_SESSION_COOKIE}=${randomBytes(32).toString('base64url')}` })).status, 401);
  for (const body of ['{', null, [], { action: 'send', payload: 'x'.repeat(2100) }]) assert.equal((await h.request('/api/crm', { method: 'POST', body })).status, 400);
  assert.equal((await h.request('/api/crm', { method: 'DELETE' })).status, 405);
  assert.equal((await h.request('/api/crm?view=customers')).status, 404);
  h.failSms();
  const failed = await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: adminPhone, consent: true } });
  assert.equal(failed.status, 503);
  assert.ok(!failed.text.includes('provider'));
  assert.ok(!failed.text.includes(adminPhone));
});
test('Redis adapter keeps challenge keys independent and delegates unchanged quota keys to proposal store', async () => {
  const seen = [], quotas = [];
  const redis = {
    async set(...args) { seen.push(['set', ...args]); }, async get(key) { seen.push(['get', key]); return null; },
    async del(key) { seen.push(['del', key]); }, async eval(script, keys, args) { seen.push(['eval', keys, args]); return 0; }
  };
  const store = createCrmStore({}, { redis, sharedStore: { async reserve(items) { quotas.push(items); return true; } } });
  const limits = [{ name: 'send-month:2026-10', max: 100, ttl: 32 * 86400 }];
  assert.equal(await store.reserve(limits), true);
  assert.deepEqual(quotas, [limits]);
  assert.deepEqual(await store.reserveDetailed(limits), { allowed: true, blocked: [] });
  await store.set('challenge:id', { purpose: 'crm-auth-v1' }, 300);
  await store.get('session:hash'); await store.del('session:hash');
  await store.attempt('id', 'binding'); await store.consume('id', 'binding');
  assert.equal(seen[0][1], 'cnps:crm:auth:v1:challenge:id');
  assert.equal(seen[1][1], 'cnps:crm:auth:v1:session:hash');
  assert.equal(seen[3][1][0], 'cnps:crm:auth:v1:challenge:id');
  assert.equal(seen[4][1][0], 'cnps:crm:auth:v1:challenge:id');
});
test('CRM forwards shared atomic quota diagnostics without using its private auth namespace', async () => {
  const limits = [{ name: 'phone-day:2026-10-13:opaque', max: 5, ttl: 172800 }];
  const expected = { allowed: false, blocked: [{ name: limits[0].name, kind: 'phone-day', ttl: 90000 }] };
  let calls = 0;
  const store = createCrmStore({}, { redis: {}, sharedStore: {
    async reserve() { throw new Error('Must use detailed reservation'); },
    async reserveDetailed(items) { calls++; assert.equal(items, limits); return expected; }
  } });
  assert.equal(await store.reserveDetailed(limits), expected);
  assert.equal(calls, 1);
});
test('Aliyun factory reuses approved channel settings but isolates provider SchemeName, never returning an OTP', async () => {
  const requests = [];
  const env = { ALIYUN_ACCESS_KEY_ID: 'not-a-live-key', ALIYUN_ACCESS_KEY_SECRET: 'not-a-live-secret', ALIYUN_SMS_SIGN_NAME: 'approved-sign', ALIYUN_SMS_TEMPLATE_CODE: 'approved-template' };
  const client = {
    async sendSmsVerifyCode(request) { requests.push(request); return { body: { code: 'OK', success: true, model: { verifyCode: '123456' } } }; },
    async checkSmsVerifyCode(request) { requests.push(request); return { body: { code: 'OK', success: true, model: { verifyResult: 'PASS' } } }; }
  };
  const sms = createCrmSms(env, { client });
  assert.equal(await sms.send(adminPhone, 'challenge-id'), undefined);
  assert.equal(await sms.verify(adminPhone, '123456', 'challenge-id'), true);
  assert.equal(CRM_SMS_SCHEME, 'cnpscrm');
  assert.equal(requests[0].schemeName, CRM_SMS_SCHEME);
  assert.equal(requests[1].schemeName, CRM_SMS_SCHEME);
  assert.equal(requests[0].signName, env.ALIYUN_SMS_SIGN_NAME);
  assert.equal(requests[0].templateCode, env.ALIYUN_SMS_TEMPLATE_CODE);
  assert.equal(requests[0].returnVerifyCode, false);
  assert.equal(requests[0].autoRetry, 0);
  assert.equal(requests[0].outId, 'crm-challenge-id');
});

test('long customer cookies cannot become partner contexts or bypass the eight-hour policy',async()=>{
 const customer={memberships:[{companyId:'company-A',active:true,role:'customer'}],contexts:[{id:'member:company-A:customer',companyId:'company-A',role:'customer'}],proposals:[]},directory=new Map([[customerPhone,customer]]),h=harness({accessDirectory:directory});
 const old=await h.login(customerPhone);assert.match(old.response.headers['set-cookie'][0],/Max-Age=2592000/);
 h.advance(9*3600*1000);assert.equal((await h.request('/api/crm?view=session',{cookie:old.cookie})).status,200);
 directory.set(customerPhone,{...customer,contexts:[...customer.contexts,{id:'partner:grant-A',companyId:'company-B',role:'partner'}]});
 assert.equal((await h.request('/api/crm?view=session',{cookie:old.cookie})).status,401);
 const fresh=await h.login(customerPhone);assert.match(fresh.response.headers['set-cookie'][0],/SameSite=Strict; Max-Age=28800/);
 h.advance(8*3600*1000);assert.equal((await h.request('/api/crm?view=session',{cookie:fresh.cookie})).status,401);
});
test('proposal-only promotion cannot reuse a thirty-day customer authentication',async()=>{
 const customer={memberships:[{companyId:'company-A',active:true,role:'customer'}],contexts:[{id:'member:company-A:customer',companyId:'company-A',role:'customer'}],proposals:[]},directory=new Map([[customerPhone,customer]]),h=harness({accessDirectory:directory});
 const old=await h.login(customerPhone);h.advance(61000);directory.set(customerPhone,{memberships:[],contexts:[],proposals:[{id:'wasion-web-v1'}]});
 assert.equal((await h.request('/api/crm?view=session',{cookie:old.cookie})).status,401);
 const fresh=await h.login(customerPhone);assert.match(fresh.response.headers['set-cookie'][0],/Max-Age=28800/);
});

test('provider diagnostics retain only fixed reason and never mint a session on send failure', async()=>{
 const h=harness();h.failSms(new CrmSmsFailure('isv.BUSINESS_LIMIT_CONTROL'));
 const response=await h.request('/api/crm',{method:'POST',body:{action:'send',phone:adminPhone,consent:true}});
 assert.equal(response.status,503);assert.equal(response.headers['set-cookie'],undefined);
 assert.deepEqual(h.failures,[{stage:'sms-send',reason:'isv.BUSINESS_LIMIT_CONTROL'}]);
 assert.ok(!response.text.includes('BUSINESS_LIMIT_CONTROL'));
 assert.equal((await h.request('/api/crm?view=session')).status,401);
 const blocked=await h.request('/api/crm',{method:'POST',body:{action:'send',phone:adminPhone,consent:true}});
 assert.equal(blocked.status,429);
});

test('SMS failures discard untrusted provider payloads and do not retry sends',async()=>{
 const env={ALIYUN_ACCESS_KEY_ID:'fixture',ALIYUN_ACCESS_KEY_SECRET:'fixture',ALIYUN_SMS_SIGN_NAME:'fixture',ALIYUN_SMS_TEMPLATE_CODE:'fixture'};
 for(const [kind,reason]of [['response','provider-rejected'],['transport','transport-unavailable'],['known','isv.OUT_OF_SERVICE']]){
  let calls=0;const client={async sendSmsVerifyCode(){calls++;if(kind==='transport')throw Object.assign(Error('private payload'),{code:'phone-18700001111'});return{body:{code:kind==='known'?'isv.OUT_OF_SERVICE':'123456',success:false,message:'private payload',model:{verifyCode:'123456'}}};}};
  const sms=createCrmSms(env,{client});await assert.rejects(()=>sms.send(adminPhone,'challenge-id'),e=>{assert.ok(e instanceof CrmSmsFailure);assert.equal(e.reason,reason);assert.ok(!JSON.stringify(e).includes('123456'));assert.ok(!JSON.stringify(e).includes('18700001111'));return true;});assert.equal(calls,1);
 }
 assert.equal(new CrmSmsFailure('unknown','private fallback').reason,'provider-rejected');
});
