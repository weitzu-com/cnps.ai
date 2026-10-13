import test from 'node:test';
import assert from 'node:assert/strict';
import { createCrmSms, CRM_SMS_SCHEME } from '../server/crm-auth-sms.mjs';
import { createSms, PROPOSAL_SMS_SCENE } from '../server/proposal-sms.mjs';
import { createDeliverySms } from '../server/crm-delivery-sms.mjs';
import {
  createVolcClient, signVolcRequest, VOLC_SMS_HOST, VOLC_SMS_REGION, VOLC_SMS_SERVICE, VOLC_SMS_TIMEOUT_MS, VOLC_SMS_VERSION
} from '../server/volc-sms.mjs';

let gate = Promise.resolve();
function alone(run) {
  const result = gate.then(run, run);
  gate = result.then(() => {}, () => {});
  return result;
}
const verifyEnv = {
  VOLC_ACCESSKEY: 'not-a-live-key', VOLC_SECRETKEY: 'not-a-live-secret', VOLC_SMS_ACCOUNT: 'sms-account',
  VOLC_SMS_SIGN: 'approved-sign', VOLC_SMS_TEMPLATE_ID_VERIFY: 'ST_verify'
};
const body = '{"SmsAccount":"account","Sign":"sign","TemplateID":"ST_notify","TemplateParam":"{}","PhoneNumbers":"18700001111","Tag":"delivery-one"}';
const authorization = 'HMAC-SHA256 Credential=AKEXAMPLE/20261013/cn-north-1/volcSMS/request, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature=754161cbd003f59e0dc561c395cce00fd52aac49d6334cfcc5acb92643c1711e';

test('V4 signature matches the HMAC-SHA256 canonical request for volcSMS', () => {
  const signed = signVolcRequest({
    accessKey: 'AKEXAMPLE', secretKey: 'SKEXAMPLE', action: 'SendSms', body, now: new Date('2026-10-13T06:45:00.000Z')
  });
  const url = new URL(signed.url);
  assert.equal(url.host, VOLC_SMS_HOST);
  assert.equal(url.searchParams.get('Action'), 'SendSms');
  assert.equal(url.searchParams.get('Version'), VOLC_SMS_VERSION);
  assert.equal(signed.headers['X-Date'], '20261013T064500Z');
  assert.equal(signed.headers['X-Content-Sha256'], '78458d0b8bcea245ddd8e4bd0f3d1d95932685385e6002d6f1f1c286f781cbe3');
  assert.equal(signed.headers.Authorization, authorization);
  assert.equal(signed.headers.Authorization.includes('SKEXAMPLE'), false);
  assert.equal(signed.body, body);
  assert.equal(VOLC_SMS_REGION, 'cn-north-1');
  assert.equal(VOLC_SMS_SERVICE, 'volcSMS');
  assert.equal(VOLC_SMS_TIMEOUT_MS, 10000);
});

test('client uses a 10 second timeout and maps transport and API errors like the previous SMS calls', async () => alone(async () => {
  const timeouts = [];
  const original = AbortSignal.timeout;
  AbortSignal.timeout = ms => { timeouts.push(ms); return original.call(AbortSignal, ms); };
  const calls = [];
  try {
    const client = createVolcClient({
      accessKey: 'AKEXAMPLE', secretKey: 'SKEXAMPLE', now: () => new Date('2026-10-13T06:45:00.000Z'),
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return { ok: true, async json() { return { ResponseMetadata: {}, Result: { MessageID: ['mid'] } }; } };
      }
    });
    assert.deepEqual(await client.sendSms(JSON.parse(body)), { ResponseMetadata: {}, Result: { MessageID: ['mid'] } });
    assert.equal(calls[0].init.headers.Authorization, authorization);
    assert.equal(calls[0].init.signal instanceof AbortSignal, true);
    assert.deepEqual(timeouts, [10000]);
    const broken = createVolcClient({
      accessKey: 'AKEXAMPLE', secretKey: 'SKEXAMPLE',
      fetchImpl: async () => { throw new Error('secret provider diagnostics 18700001111'); }
    });
    await assert.rejects(broken.sendSms({}), { message: 'SMS unavailable' });
    const html = createVolcClient({
      accessKey: 'AKEXAMPLE', secretKey: 'SKEXAMPLE',
      fetchImpl: async () => ({ ok: false, async json() { throw new Error('not json'); } })
    });
    await assert.rejects(html.request('SendSms', {}), { message: 'SMS unavailable' });
  } finally {
    AbortSignal.timeout = original;
  }
}));

test('proposal and CRM verification codes stay in separate scenes and only Result 0 passes', async () => {
  const requests = [];
  const client = {
    async sendSmsVerifyCode(request) { requests.push(request); return { Result: { MessageID: ['mid'] } }; },
    async checkSmsVerifyCode(request) { requests.push(['check', request]); return { Result: '0' }; }
  };
  const proposal = createSms(verifyEnv, { client });
  const crm = createCrmSms(verifyEnv, { client });
  await proposal.send('13800000000', 'proposal-challenge');
  await crm.send('18700001111', 'crm-challenge');
  assert.equal(requests[0].Scene, PROPOSAL_SMS_SCENE);
  assert.equal(requests[1].Scene, CRM_SMS_SCHEME);
  assert.equal(PROPOSAL_SMS_SCENE, 'cnpsproposal');
  assert.notEqual(requests[0].Scene, requests[1].Scene);
  assert.equal(await proposal.verify('13800000000', '123456', 'proposal-challenge'), true);
  client.checkSmsVerifyCode = async () => ({ Result: 0 });
  assert.equal(await proposal.verify('13800000000', '123456', 'proposal-challenge'), true);
  for (const result of ['1', '2', '', null]) {
    client.checkSmsVerifyCode = async () => ({ Result: result });
    assert.equal(await crm.verify('18700001111', '000000', 'crm-challenge'), false);
  }
  client.checkSmsVerifyCode = async () => ({ ResponseMetadata: { Error: { Code: 'RE:0009' } }, Result: '0' });
  assert.equal(await crm.verify('18700001111', '123456', 'crm-challenge'), false);
  client.sendSmsVerifyCode = async () => ({ ResponseMetadata: { Error: { Code: 'RE:0005', Message: 'template' } } });
  await assert.rejects(proposal.send('13800000000', 'again'), { message: 'SMS send failed' });
  assert.throws(() => createSms({ VOLC_ACCESSKEY: 'only-key' }), { message: 'SMS not configured' });
  assert.throws(() => createCrmSms({}), { message: 'SMS not configured' });
});

test('delivery SendSms uses the notify key when present and records MessageID[0]', async () => alone(async () => {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, async json() { return { ResponseMetadata: { Action: 'SendSms' }, Result: { MessageID: ['mid-1', 'ignored'] } }; } };
  };
  const redis = { async eval() { return 1; } };
  const env = { ...verifyEnv, CNPS_PROPOSAL_SECRET: '0123456789abcdef'.repeat(4), VOLC_SMS_TEMPLATE_ID_NOTIFY: 'ST_notify', VOLC_NOTIFY_ACCESSKEY: 'notify-ak', VOLC_NOTIFY_SECRETKEY: 'notify-sk' };
  try {
    const separate = await createDeliverySms(env, { redis }).send('18700001111', 'delivery-one');
    assert.equal(separate.providerId, 'mid-1');
    assert.match(calls[0].init.headers.Authorization, /Credential=notify-ak\//);
    assert.equal(calls[0].init.headers.Authorization.includes('notify-sk'), false);
    assert.equal(new URL(calls[0].url).host, 'sms.volcengineapi.com');
    assert.equal(new URL(calls[0].url).searchParams.get('Action'), 'SendSms');
    assert.equal(new URL(calls[0].url).searchParams.get('Version'), '2020-01-01');
    assert.equal(JSON.parse(calls[0].init.body).TemplateParam, '{}');
    assert.equal(JSON.parse(calls[0].init.body).Tag, 'delivery-one');
    calls.length = 0;
    await createDeliverySms({ ...env, VOLC_NOTIFY_ACCESSKEY: '', VOLC_NOTIFY_SECRETKEY: '' }, { redis }).send('18700001111', 'delivery-two');
    assert.match(calls[0].init.headers.Authorization, /Credential=not-a-live-key\//);
    globalThis.fetch = async () => ({ ok: false, async json() { return { ResponseMetadata: { Error: { Code: 'RE:0004' } } }; } });
    assert.deepEqual(await createDeliverySms(env, { redis }).send('18700001111', 'delivery-three'), { status: 'failed' });
  } finally {
    globalThis.fetch = original;
  }
}));
