import { Redis } from '@upstash/redis';
import { digest } from './proposal-crypto.mjs';
import { createVolcClient } from './volc-sms.mjs';

// Separate notification template; never use the OTP template. Notify keys are
// optional and fall back to the verification access key.
export function createDeliverySms(env, { client: injectedClient, redis: injectedRedis } = {}) {
  const accessKey = env.VOLC_NOTIFY_ACCESSKEY || env.VOLC_ACCESSKEY;
  const secretKey = env.VOLC_NOTIFY_SECRETKEY || env.VOLC_SECRETKEY;
  const template = String(env.VOLC_SMS_TEMPLATE_ID_NOTIFY || '').trim();
  const configured = Boolean(accessKey && secretKey && env.VOLC_SMS_ACCOUNT && env.VOLC_SMS_SIGN && template)
    && template !== String(env.VOLC_SMS_TEMPLATE_ID_VERIFY || '').trim();
  if (!configured) return { configured: false };
  let client = injectedClient;
  let redis = injectedRedis;
  return { configured: true, async send(phone, deliveryId) {
    client ||= createVolcClient({ accessKey, secretKey });
    redis ||= new Redis({ url: env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL, token: env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN, retry: { retries: 0 } });
    const date = new Date().toISOString(), pid = digest(env.CNPS_PROPOSAL_SECRET, 'phone', phone);
    const limits = [{ name: 'cooldown:' + pid, max: 1, ttl: 60 }, { name: 'phone-day:' + date.slice(0, 10) + ':' + pid, max: 5, ttl: 172800 }, { name: 'send-day:' + date.slice(0, 10), max: 20, ttl: 172800 }, { name: 'send-month:' + date.slice(0, 7), max: 100, ttl: 32 * 86400 }];
    const count = await redis.eval("for i=1,#KEYS do if tonumber(redis.call('GET',KEYS[i]) or '0')>=tonumber(ARGV[(i-1)*2+1]) then return 0 end end;for i=1,#KEYS do local n=redis.call('INCR',KEYS[i]);if n==1 then redis.call('EXPIRE',KEYS[i],ARGV[(i-1)*2+2]) end end;return 1", limits.map(x => 'cnps:proposal:v1:' + x.name), limits.flatMap(x => [x.max, x.ttl]));
    if (Number(count) !== 1) return { status: 'failed', reason: 'monthly_limit' };
    // Template must have fixed portal URL; no file names or confidential contents in SMS.
    const body = await client.sendSms({
      SmsAccount: env.VOLC_SMS_ACCOUNT,
      Sign: env.VOLC_SMS_SIGN,
      TemplateID: template,
      TemplateParam: '{}',
      PhoneNumbers: phone,
      Tag: deliveryId
    });
    const messageId = body?.Result?.MessageID;
    const providerId = Array.isArray(messageId) ? messageId[0] : '';
    return !body?.ResponseMetadata?.Error && providerId ? { status: 'submitted', providerId } : { status: 'failed' };
  } };
}
