import { assertVolcVerifyConfig, createCodeSms, createVolcClient } from './volc-sms.mjs';

export const PROPOSAL_SMS_SCENE = 'cnpsproposal';

export function createSms(env, { client: injectedClient } = {}) {
  assertVolcVerifyConfig(env);
  const client = injectedClient || createVolcClient({ accessKey: env.VOLC_ACCESSKEY, secretKey: env.VOLC_SECRETKEY });
  return createCodeSms(env, PROPOSAL_SMS_SCENE, client);
}
