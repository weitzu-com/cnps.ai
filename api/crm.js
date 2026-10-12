import { createCrmAuthHandler } from '../server/crm-auth-handler.mjs';
import { createCrmStore } from '../server/crm-auth-store.mjs';
import { createCrmSms } from '../server/crm-auth-sms.mjs';

// Until the server-side CRM member directory is attached, only the explicitly
// approved administrator can authenticate. Proposal viewers are not CRM members.
export default createCrmAuthHandler({
  env: process.env, storeFactory: createCrmStore, smsFactory: createCrmSms
});
