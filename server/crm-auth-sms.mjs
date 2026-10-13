import { assertVolcVerifyConfig, createCodeSms, createVolcClient } from './volc-sms.mjs';

export const CRM_SMS_SCHEME = 'cnpscrm';

// Same Volcengine account, signature and OTP template as proposal SMS. Scene
// cnpscrm is a separate verification-code pool from cnpsproposal, so a code
// issued for one product cannot authorize the other.
export function createCrmSms(env, { client: injectedClient } = {}) {
  assertVolcVerifyConfig(env);
  const client = injectedClient || createVolcClient({ accessKey: env.VOLC_ACCESSKEY, secretKey: env.VOLC_SECRETKEY });
  return createCodeSms(env, CRM_SMS_SCHEME, client);
}
