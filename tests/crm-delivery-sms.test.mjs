import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeliverySms } from '../server/crm-delivery-sms.mjs';
import { digest } from '../server/proposal-crypto.mjs';

const secret = '0123456789abcdef'.repeat(4);
const verifyEnv = { VOLC_ACCESSKEY: 'login-only', VOLC_SECRETKEY: 'login-secret', VOLC_SMS_ACCOUNT: 'account', VOLC_SMS_SIGN: 'sign', VOLC_SMS_TEMPLATE_ID_VERIFY: 'ST_verify' };
const notifyEnv = { ...verifyEnv, CNPS_PROPOSAL_SECRET: secret, VOLC_SMS_TEMPLATE_ID_NOTIFY: 'ST_notify' };

test('notification template and key are separate from login OTP and fail closed', () => {
  assert.equal(createDeliverySms({ VOLC_SMS_TEMPLATE_ID_VERIFY: 'ST_verify', VOLC_ACCESSKEY: 'login-only' }).configured, false);
  assert.equal(createDeliverySms(verifyEnv).configured, false);
  assert.equal(createDeliverySms({ ...verifyEnv, VOLC_SMS_TEMPLATE_ID_NOTIFY: 'ST_verify' }).configured, false);
  assert.equal(createDeliverySms(notifyEnv).configured, true);
  assert.equal(createDeliverySms({ ...notifyEnv, VOLC_NOTIFY_ACCESSKEY: 'notify-ak' }).configured, true);
});

test('notification has global quota, fixed approved content, no OTP or confidential text, no blind retries', async () => {
  let sent;
  const evals = [];
  const client = { async sendSms(request) { sent = request; return { Result: { MessageID: ['synthetic-biz'] } }; } };
  const sms = createDeliverySms(notifyEnv, { client, redis: { async eval(script, keys, args) { evals.push({ script, keys, args }); return 1; } } });
  const result = await sms.send('18700001111', 'delivery-one');
  assert.equal(result.status, 'submitted');
  assert.equal(result.providerId, 'synthetic-biz');
  assert.equal(sent.TemplateParam, '{}');
  assert.equal(sent.PhoneNumbers, '18700001111');
  assert.equal(sent.Tag, 'delivery-one');
  assert.equal(sent.TemplateID, 'ST_notify');
  assert.equal(sent.Sign, 'sign');
  assert.equal(JSON.stringify(sent).includes('code'), false);
  const pid = digest(secret, 'phone', '18700001111');
  const date = evals[0].keys[2].slice('cnps:proposal:v1:send-day:'.length);
  assert.equal(evals[0].script, "for i=1,#KEYS do if tonumber(redis.call('GET',KEYS[i]) or '0')>=tonumber(ARGV[(i-1)*2+1]) then return 0 end end;for i=1,#KEYS do local n=redis.call('INCR',KEYS[i]);if n==1 then redis.call('EXPIRE',KEYS[i],ARGV[(i-1)*2+2]) end end;return 1");
  assert.deepEqual(evals[0].keys, ['cnps:proposal:v1:cooldown:' + pid, 'cnps:proposal:v1:phone-day:' + date + ':' + pid, 'cnps:proposal:v1:send-day:' + date, 'cnps:proposal:v1:send-month:' + date.slice(0, 7)]);
  assert.deepEqual(evals[0].args, [1, 60, 5, 172800, 20, 172800, 100, 32 * 86400]);
  const blocked = createDeliverySms(notifyEnv, { client: { async sendSms() { throw Error('must not send'); } }, redis: { async eval() { return 0; } } });
  assert.equal((await blocked.send('18700001111', 'delivery-one')).reason, 'monthly_limit');
  const rejected = createDeliverySms(notifyEnv, { client: { async sendSms() { return { ResponseMetadata: { Error: { Code: 'RE:0005' } } }; } }, redis: { async eval() { return 1; } } });
  assert.deepEqual(await rejected.send('18700001111', 'delivery-two'), { status: 'failed' });
  await assert.rejects(() => createDeliverySms(notifyEnv, { client: { async sendSms() { throw Error('timeout'); } }, redis: { async eval() { return 1; } } }).send('18700001111', 'delivery-three'));
});
