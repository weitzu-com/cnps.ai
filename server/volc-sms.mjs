import { createHash, createHmac } from 'node:crypto';

export const VOLC_SMS_HOST = 'sms.volcengineapi.com';
export const VOLC_SMS_REGION = 'cn-north-1';
export const VOLC_SMS_SERVICE = 'volcSMS';
export const VOLC_SMS_VERSION = '2020-01-01';
export const VOLC_SMS_TIMEOUT_MS = 10000;
// Six-digit provider code, five minutes, five checks. TryCount stays inside the
// provider range (1-10) and matches the application attempt limit.
export const VERIFY_CODE_TYPE = 6;
export const VERIFY_EXPIRE_SECONDS = 300;
export const VERIFY_TRY_COUNT = 5;

const CONTENT_TYPE = 'application/json';
const VERIFY_ENV = ['VOLC_ACCESSKEY', 'VOLC_SECRETKEY', 'VOLC_SMS_ACCOUNT', 'VOLC_SMS_SIGN', 'VOLC_SMS_TEMPLATE_ID_VERIFY'];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key, value) {
  return createHmac('sha256', key).update(value, 'utf8').digest();
}

function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function canonicalQuery(params) {
  return Object.keys(params).sort().map(key => `${encodeRfc3986(key)}=${encodeRfc3986(String(params[key]))}`).join('&');
}

export function formatVolcDate(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[:-]/g, '');
}

// HMAC-SHA256 V4. The signed header list is content-type, host, x-content-sha256, x-date.
export function signVolcRequest({ accessKey, secretKey, action, body, now }) {
  const xDate = formatVolcDate(now);
  const shortDate = xDate.slice(0, 8);
  const payloadHash = sha256(body);
  const query = canonicalQuery({ Action: action, Version: VOLC_SMS_VERSION });
  const canonicalHeaders = [
    `content-type:${CONTENT_TYPE}`,
    `host:${VOLC_SMS_HOST}`,
    `x-content-sha256:${payloadHash}`,
    `x-date:${xDate}`
  ].join('\n');
  const signedHeaders = 'content-type;host;x-content-sha256;x-date';
  const canonicalRequest = ['POST', '/', query, `${canonicalHeaders}\n`, signedHeaders, payloadHash].join('\n');
  const scope = `${shortDate}/${VOLC_SMS_REGION}/${VOLC_SMS_SERVICE}/request`;
  const stringToSign = ['HMAC-SHA256', xDate, scope, sha256(canonicalRequest)].join('\n');
  const signingKey = hmac(hmac(hmac(hmac(secretKey, shortDate), VOLC_SMS_REGION), VOLC_SMS_SERVICE), 'request');
  const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');
  return {
    url: `https://${VOLC_SMS_HOST}/?${query}`,
    headers: {
      Host: VOLC_SMS_HOST,
      'Content-Type': CONTENT_TYPE,
      'X-Content-Sha256': payloadHash,
      'X-Date': xDate,
      Authorization: `HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    },
    body
  };
}

export function createVolcClient({ accessKey, secretKey, fetchImpl = globalThis.fetch, now = () => new Date(), timeoutMs = VOLC_SMS_TIMEOUT_MS } = {}) {
  async function request(action, value) {
    const body = typeof value === 'string' ? value : JSON.stringify(value);
    const signed = signVolcRequest({ accessKey, secretKey, action, body, now: now() });
    let response;
    try {
      response = await fetchImpl(signed.url, {
        method: 'POST', headers: signed.headers, body: signed.body, redirect: 'error', signal: AbortSignal.timeout(timeoutMs)
      });
    } catch {
      throw new Error('SMS unavailable');
    }
    let parsed;
    try {
      parsed = await response.json();
    } catch {
      throw new Error('SMS unavailable');
    }
    if (!response.ok && !parsed?.ResponseMetadata) throw new Error('SMS unavailable');
    return parsed;
  }
  return {
    request,
    sendSmsVerifyCode: body => request('SendSmsVerifyCode', body),
    checkSmsVerifyCode: body => request('CheckSmsVerifyCode', body),
    sendSms: body => request('SendSms', body)
  };
}

export function assertVolcVerifyConfig(env) {
  for (const name of VERIFY_ENV) if (!env?.[name]) throw new Error('SMS not configured');
}

export function createCodeSms(env, scene, client) {
  return {
    async send(phone) {
      const body = await client.sendSmsVerifyCode({
        SmsAccount: env.VOLC_SMS_ACCOUNT,
        Sign: env.VOLC_SMS_SIGN,
        TemplateID: env.VOLC_SMS_TEMPLATE_ID_VERIFY,
        PhoneNumber: phone,
        Scene: scene,
        CodeType: VERIFY_CODE_TYPE,
        ExpireTime: VERIFY_EXPIRE_SECONDS,
        TryCount: VERIFY_TRY_COUNT
      });
      const messageId = body?.Result?.MessageID;
      if (body?.ResponseMetadata?.Error || !Array.isArray(messageId) || !messageId[0]) throw new Error('SMS send failed');
    },
    async verify(phone, code) {
      const body = await client.checkSmsVerifyCode({
        SmsAccount: env.VOLC_SMS_ACCOUNT,
        PhoneNumber: phone,
        Scene: scene,
        Code: code
      });
      return !body?.ResponseMetadata?.Error && String(body?.Result) === '0';
    }
  };
}
