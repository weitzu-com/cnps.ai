// Only fixed codes enter diagnostics; SDK messages and payloads remain private.
const SAFE_CODES = new Set([
  'isv.BUSINESS_LIMIT_CONTROL', 'isv.OUT_OF_SERVICE', 'isv.AMOUNT_NOT_ENOUGH',
  'isv.DAY_LIMIT_CONTROL', 'isv.SMS_SIGNATURE_ILLEGAL', 'isv.SMS_SIGN_ILLEGAL',
  'isv.SMS_TEMPLATE_ILLEGAL', 'isv.SMS_TEMPLATE_CODE_ILLEGAL', 'isv.INVALID_PARAMETERS',
  'isv.MOBILE_NUMBER_ILLEGAL', 'isv.ACCOUNT_NOT_EXISTS', 'isv.RAM_PERMISSION_DENY',
  'isv.SMS_TEMPLATE_NOT_EXIST', 'isp.RAM_PERMISSION_DENY', 'isp.SYSTEM_ERROR',
  'SignatureDoesNotMatch', 'InvalidAccessKeyId.NotFound', 'InvalidAccessKeyId',
  'Forbidden.RAM', 'Forbidden', 'AccessDenied', 'InvalidCredentials',
  'Throttling', 'Throttling.User', 'ETIMEDOUT', 'ESOCKETTIMEDOUT',
  'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ConnectTimeoutError', 'ReadTimeoutError'
]);
export class CrmSmsFailure extends Error {
  constructor(code, fallback = 'provider-rejected') {
    super('SMS provider unavailable');
    this.name = 'CrmSmsFailure';
    this.reason = SAFE_CODES.has(code) ? code : fallback === 'transport-unavailable' ? fallback : 'provider-rejected';
  }
}
