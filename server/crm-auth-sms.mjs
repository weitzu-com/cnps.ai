import Dypnsapi from '@alicloud/dypnsapi20170525';
import OpenApi from '@alicloud/openapi-client';

const Client = Dypnsapi.default || Dypnsapi;
export const CRM_SMS_SCHEME = 'cnpscrm';

// Provider errors can contain credentials, a phone number or the SMS content.
// Retain only a fixed category on errors created here; arbitrary error
// properties must never become log fields at the authentication boundary.
const failureCategories = new WeakMap();
const failureCodes = new Map([
  ...['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ConnectionTimeoutError', 'ResponseTimeoutError', 'TimeoutError', 'RequestTimeout'].map(code => [code, 'timeout']),
  ...['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'EPIPE', 'NetworkError'].map(code => [code, 'network']),
  ...['InvalidCredentials', 'InvalidAccessKeyId.NotFound', 'InvalidAccessKeyId.Inactive', 'SignatureDoesNotMatch', 'InvalidSecurityToken.Expired'].map(code => [code, 'authentication']),
  ...['isv.RAM_PERMISSION_DENY', 'isp.RAM_PERMISSION_DENY', 'isv.FORBIDDEN_ACTION', 'Forbidden.RAM'].map(code => [code, 'permission']),
  ...['isv.OUT_OF_SERVICE', 'isv.ACCOUNT_ABNORMAL', 'isv.ACCOUNT_NOT_EXISTS'].map(code => [code, 'account']),
  ...['biz.FREQUENCY', 'isv.BUSINESS_LIMIT_CONTROL', 'LimitExceeded.SmsCode', 'isp.QPS_LIMIT', 'Throttling', 'Throttling.User', 'Throttling.Api'].map(code => [code, 'rate-limit']),
  ...['isv.INVALID_PARAMETERS', 'isv.MOBILE_NUMBER_ILLEGAL', 'isv.PRODUCT_UNSUBSCRIBE', 'isv.PRODUCT_UN_SUBSCRIPT', 'InvalidParameter.SmsTemplateCode', 'EntityNotExist.SmsTemplateCode', 'EntityNotExist.SmsSignName'].map(code => [code, 'configuration']),
  ...['isp.SYSTEM_ERROR', 'isp.UNKNOWN', 'isp.UNKNOWN_ERR_CODE'].map(code => [code, 'provider'])
]);
const failureFor = code => {
  const error = new Error('SMS provider unavailable');
  failureCategories.set(error, typeof code === 'string' ? failureCodes.get(code) || 'unclassified' : 'unclassified');
  return error;
};
export const crmSmsFailureCategory = error => failureCategories.get(error) || 'unclassified';

async function providerCall(callback) {
  try { return await callback(); }
  catch (error) {
    // Read only exact codes/names, never stringify an SDK error or inspect its
    // request, response, message, cause or diagnostic data.
    let code;
    try { code = error?.code; } catch {}
    // The SDK's httpx transport marks connection/read timeouts by name only.
    try { if (!failureCodes.has(code) && error?.name === 'RequestTimeoutError') code = 'ETIMEDOUT'; } catch {}
    throw failureFor(code);
  }
}

// Same account, restricted RAM credentials, approved signature and template as
// proposal SMS; a separate SchemeName prevents the two verification code pools
// from authorizing one another. OutId is only a tracing identifier.
// https://help.aliyun.com/zh/pnvs/developer-reference/api-dypnsapi-2017-05-25-checksmsverifycode
export function createCrmSms(env, { client: injectedClient } = {}) {
  for (const name of ['ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'ALIYUN_SMS_SIGN_NAME', 'ALIYUN_SMS_TEMPLATE_CODE']) {
    if (!env[name]) throw new Error('SMS not configured');
  }
  const client = injectedClient || new Client(new OpenApi.Config({
    accessKeyId: env.ALIYUN_ACCESS_KEY_ID, accessKeySecret: env.ALIYUN_ACCESS_KEY_SECRET,
    endpoint: 'dypnsapi.aliyuncs.com', connectTimeout: 5000, readTimeout: 10000
  }));
  const base = (phone, id) => ({ countryCode: '86', phoneNumber: phone, schemeName: CRM_SMS_SCHEME, outId: `crm-${id}` });
  return {
    async send(phone, id) {
      const { body } = await providerCall(() => client.sendSmsVerifyCode(new Dypnsapi.SendSmsVerifyCodeRequest({
        ...base(phone, id), signName: env.ALIYUN_SMS_SIGN_NAME, templateCode: env.ALIYUN_SMS_TEMPLATE_CODE,
        templateParam: JSON.stringify({ code: '##code##', min: '5' }), codeLength: 6, validTime: 300,
        duplicatePolicy: 1, interval: 60, codeType: 1, returnVerifyCode: false, autoRetry: 0
      })));
      if (body?.code !== 'OK' || body.success !== true) throw failureFor(body?.code);
    },
    async verify(phone, code, id) {
      const { body } = await providerCall(() => client.checkSmsVerifyCode(new Dypnsapi.CheckSmsVerifyCodeRequest({
        ...base(phone, id), verifyCode: code
      })));
      return body?.code === 'OK' && body.success === true && body.model?.verifyResult === 'PASS';
    }
  };
}
