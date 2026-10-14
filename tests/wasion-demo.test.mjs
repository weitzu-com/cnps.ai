import { proposalBinding } from '../server/proposal-crm.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { authorizeWasionCustomer, answerWasionQuestion, createWasionSearchHandler } from '../server/wasion-demo.mjs';
import { WASION_SOURCES, retrieveWasionSources } from '../server/wasion-demo-sources.mjs';

const identity = { role: 'customer', memberships: [{ companyId: proposalBinding.companyId, role: 'customer' }] };
const principal = { identity, identityId: 'subject-1' };
const demoService={async getProject(){return {id:proposalBinding.projectId};}};
const makeAuth = viewer => ({ loadSession: async () => viewer ? { identity: viewer, identityId: 'subject-1' } : null });
const request = (body = { question: 'Prepayment solutions', language: 'en' }, headers = {}) => ({
  method: 'POST', headers: { origin: 'https://crm.cnps.ai', 'x-cnps-crm': '1', 'content-type': 'application/json', ...headers }, body
});
const response = () => ({ headers: {}, setHeader(name, value) { this.headers[name] = value; }, end(value) { this.body = value; } });
const modelResponse = (answer, supported = true) => ({ ok: true, text: async () => JSON.stringify({ choices: [{ message: { content: JSON.stringify({ answer, supported }) } }] }) });
const config = { env: { CRM_AI_API_KEY: 'test-key' }, principal, rateLimit: async () => true };
const modelForContext = async (_url, options) => {
  const sent = JSON.parse(options.body), source = JSON.parse(sent.messages[1].content).officialSources[0];
  return modelResponse(`The official page describes ${source.title}. [${source.id}]`);
};

test('captured corpus provides more than 25 canonical pages with stable internal citation links', () => {
  assert.ok(WASION_SOURCES.length > 25);
  assert.equal(new Set(WASION_SOURCES.map(source => source.id)).size, WASION_SOURCES.length);
  for (const source of WASION_SOURCES) {
    assert.equal(new URL(source.url).hostname, 'en.wasion.com');
    assert.equal(source.href, `/demo/wasion/${source.id}`);
    assert.ok(source.title && source.category);
    assert.ok(source.images.every(url => new URL(url).hostname === 'en.wasion.com'));
  }
});

test('exact model queries rank specific product pages and retrieve real technical values', () => {
  const meter = retrieveWasionSources('What is the aMeter300 CTVT?').results[0];
  assert.equal(meter.id, 'ameter300-ctvt-three-phase-smart-energy-meter');
  assert.match(meter.excerpt, /Three Phase Smart Energy Meter/);
  assert.match(meter.summary, /WAN communication/);
  assert.ok(meter.images[0].includes('/uploads/'));
  assert.ok(!meter.summary.includes('Standard event log'));
  const gateway = retrieveWasionSources('WFCT-960 supply voltage and ingress protection').results[0];
  assert.equal(gateway.id, 'wfct-960-wisun-gateway');
  assert.match(gateway.excerpt, /DC 12 V/);
  assert.match(gateway.excerpt, /IP65/);
  assert.equal(retrieveWasionSources('aMeter99999').resultCount, 0);
  assert.equal(retrieveWasionSources('aMeter300 and IEC99999').resultCount, 0);
});

test('application and communication searches prioritize their matching official solutions', () => {
  for (const [query, slug] of [
    ['Prepayment solutions', 'prepayment-solutions'], ['AMI Wi-SUN', 'wisun-solutions'],
    ['G3-PLC RF hybrid', 'wasion-g3-plc-rf-hybrid-solutions']
  ]) assert.equal(retrieveWasionSources(query).results[0].id, slug);
  const phases = retrieveWasionSources('three-phase smart meters').results.slice(0, 4);
  assert.ok(phases.length >= 3);
  assert.ok(phases.every(source => /three phase|poly.phase/i.test(source.excerpt)));
  assert.ok(retrieveWasionSources('有哪些三相智能电表？').results.length > 0);
});

test('auth allows only active CRM customers or designated internal preview roles', async () => {
  const check = viewer => authorizeWasionCustomer({ service:demoService,req: {}, auth: makeAuth(viewer) });
  assert.ok(await check(identity));
  assert.ok(await check({ role: 'sales_manager', memberships: [{ companyId: proposalBinding.companyId, role: 'sales_manager' }] }));
  assert.ok(await check({ role: 'admin', memberships: [] }));
  for (const viewer of [null, { role: 'guest' }, { role: 'customer', memberships: [] },
    { role: 'sales_manager', memberships: [{ role: 'sales_manager', active: false }] },
    { role: 'customer', memberships: [{ role: 'customer', active: false }] }
  ]) assert.equal(await check(viewer), null);
});

test('AI prompt defaults to English even for a Chinese question, and only supplied IDs become citations', async () => {
  let sent;
  const result = await answerWasionQuestion({ ...config, question: '有哪些三相智能电表？', fetchImpl: async (_url, options) => {
    sent = JSON.parse(options.body);
    const context = JSON.parse(sent.messages[1].content).officialSources;
    return modelResponse(`The page lists a three-phase meter. [${context[0].id}]`);
  } });
  assert.equal(result.status, 200);
  assert.equal(result.data.ai.generated, true);
  assert.equal(result.data.language, 'en');
  assert.match(sent.messages[0].content, /Answer in English/);
  assert.equal(result.data.sources.length, 1);
  assert.ok(result.data.results.length >= result.data.sources.length);
  assert.ok(JSON.parse(sent.messages[1].content).officialSources.every(source => WASION_SOURCES.some(official => official.id === source.id)));
  let zhPrompt;
  const zh = await answerWasionQuestion({ ...config, question: 'Wi-SUN', language: 'zh', fetchImpl: async (_url, options) => {
    zhPrompt = JSON.parse(options.body).messages[0].content;
    return modelResponse('官网提供 Wi-SUN RF Mesh 方案。[wisun-solutions]');
  } });
  assert.match(zhPrompt, /Answer in Chinese/);
  assert.equal(zh.data.language, 'zh');
  assert.equal(zh.data.ai.generated, true);
});

test('retrieval remains available without a key, when quota fails, and when inference fails', async () => {
  for (const extra of [
    { env: {} }, { rateLimit: async () => { throw new Error('quota down'); } },
    { rateLimit: async () => false }, { fetchImpl: async () => { throw new Error('gateway down'); } }
  ]) {
    const result = await answerWasionQuestion({ ...config, question: 'Prepayment solutions', fetchImpl: modelForContext, ...extra });
    assert.equal(result.status, 200);
    assert.equal(result.data.ai.generated, false);
    assert.ok(result.data.results.length > 0);
    assert.equal(result.data.results[0].id, 'prepayment-solutions');
    assert.ok(result.data.sources[0].excerpt);
    assert.match(result.data.answer, /AI|official/i);
  }
});

test('no matching source avoids inference, and an unsupported model answer falls back honestly', async () => {
  let calls = 0;
  const absent = await answerWasionQuestion({ ...config, question: 'banana telescope universe', fetchImpl: async () => { calls++; } });
  assert.equal(calls, 0);
  assert.equal(absent.data.ai.status, 'no_match');
  assert.deepEqual(absent.data.results, []);
  const unsupported = await answerWasionQuestion({ ...config, question: 'aMeter300 pricing', fetchImpl: async () => modelResponse('Not provided.', false) });
  assert.equal(unsupported.data.ai.generated, false);
  assert.equal(unsupported.data.ai.reason, 'sources_do_not_answer');
  assert.ok(unsupported.data.results.length > 0);
});

test('invented, missing or out-of-context citations never disclose model output', async () => {
  for (const text of ['Claim [invented-page]', 'An uncited claim.', 'Claim [wisun-solutions]', 'Claim [prepayment-solutions](https://evil.example/)']) {
    const result = await answerWasionQuestion({ ...config, question: 'WFCT-960', fetchImpl: async () => modelResponse(text) });
    assert.equal(result.data.ai.generated, false);
    assert.equal(result.data.ai.status, 'invalid_response');
    assert.ok(!result.data.answer.includes(text));
    assert.equal(result.data.results[0].id, 'wfct-960-wisun-gateway');
  }
});

test('invalid questions and unsupported language are rejected before quota or inference', async () => {
  let calls = 0;
  for (const question of ['', '  ', null, 42, 'x'.repeat(501), 'smart\u0000meter']) {
    const result = await answerWasionQuestion({ ...config, question, rateLimit: async () => { calls++; }, fetchImpl: async () => { calls++; } });
    assert.equal(result.status, 400);
  }
  assert.equal((await answerWasionQuestion({ ...config, question: 'smart meter', language: 'fr' })).status, 400);
  assert.equal(calls, 0);
});

test('handler rejects missing auth, unapproved origins and missing CRM request marker before inference', async () => {
  let modelCalled = false;
  for (const [auth, headers, status] of [
    [makeAuth(null), {}, 404], [makeAuth(identity), { origin: 'https://evil.example' }, 403],
    [makeAuth(identity), { origin: undefined }, 403], [makeAuth(identity), { 'x-cnps-crm': undefined }, 403]
  ]) {
    const res = response();
    await createWasionSearchHandler({service:demoService, env: config.env, auth, rateLimit: config.rateLimit, fetchImpl: async () => { modelCalled = true; } })(request(undefined, headers), res);
    assert.equal(res.statusCode, status);
    assert.match(res.headers['Cache-Control'], /no-store/);
    assert.match(res.headers['X-Robots-Tag'], /noindex/);
    assert.equal(res.headers['X-Frame-Options'], 'DENY');
  }
  assert.equal(modelCalled, false);
});

test('handler rechecks revocation and principal identity before disclosing generated or fallback results', async () => {
  for (const mode of ['revoked', 'identity_changed', 'lookup_failed', 'fallback_revoked']) {
    let reads = 0, called = false;
    const auth = { loadSession: async () => {
      reads++;
      if (reads === 1) return principal;
      if (mode === 'lookup_failed') throw new Error('auth down');
      return mode === 'identity_changed' ? { ...principal, identityId: 'other-subject' } : null;
    } };
    const res = response();
    await createWasionSearchHandler({service:demoService, env: mode === 'fallback_revoked' ? {} : config.env, auth,
      rateLimit: config.rateLimit, fetchImpl: async (...args) => { called = true; return modelForContext(...args); }
    })(request(), res);
    assert.equal(reads, 2);
    assert.equal(called, mode !== 'fallback_revoked');
    assert.equal(res.statusCode, mode === 'lookup_failed' ? 503 : 404);
    assert.ok(!JSON.parse(res.body).data);
  }
});

test('handler accepts the canonical CRM origin and returns fallback results with a rechecked grant', async () => {
  let reads = 0;
  const res = response();
  await createWasionSearchHandler({service:demoService, env: { VERCEL_URL: 'wasion-preview.vercel.app' }, auth: { loadSession: async () => { reads++; return principal; } } })(request({ question: 'Wi-SUN', language: 'en' }, { origin: 'https://crm.cnps.ai' }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(reads, 2);
  const { data } = JSON.parse(res.body);
  assert.equal(data.ai.generated, false);
  assert.equal(data.results[0].id, 'wisun-solutions');
});

test('handler rejects malformed or oversized bodies, including an oversized request stream', async () => {
  const handler = createWasionSearchHandler({service:demoService, env: {}, auth: makeAuth(identity) });
  for (const body of ['{bad', [], { question: 'smart meter', extra: 'x'.repeat(2100) }]) {
    const res = response(); await handler(request(body), res); assert.equal(res.statusCode, 400);
  }
  const req = new EventEmitter(); Object.assign(req, { method: 'POST', headers: request().headers });
  const res = response(), pending = handler(req, res);
  await new Promise(resolve => setImmediate(resolve));
  req.emit('data', 'x'.repeat(2500)); req.emit('end');
  await pending;
  assert.equal(res.statusCode, 400);
});
