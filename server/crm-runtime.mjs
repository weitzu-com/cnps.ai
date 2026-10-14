import { createAccessService } from './crm-access-service.mjs';
import { createDeliveryChannels } from './crm-delivery-channels.mjs';
import { createDeliverySms } from './crm-delivery-sms.mjs';
import { createCrmAuthHandler } from './crm-auth-handler.mjs';
import { createCrmStore } from './crm-auth-store.mjs';
import { createCrmSms } from './crm-auth-sms.mjs';
import { createBusinessStore } from './crm-business-store.mjs';
import { createBusinessService } from './crm-business-service.mjs';
import { createTwentyAdapter } from './crm-twenty-adapter.mjs';
import { createDocumentsAdapter } from './crm-documents-adapter.mjs';

export function createCrmRuntime(env, options = {}) {
  const store = options.store || createBusinessStore(env);
  const twenty = options.twenty || createTwentyAdapter(env);
  const documents = options.documents || createDocumentsAdapter(env);
  const base = createBusinessService({ env, store, twenty, documents, notifications: options.notifications || createDeliverySms(env), channels: options.channels || createDeliveryChannels(env) });
  const service = createAccessService({base,store,twenty,documents,env});
  const auth = createCrmAuthHandler({ env, storeFactory: options.authStoreFactory || createCrmStore, smsFactory: options.smsFactory || createCrmSms, loadMemberships: phone => service.loadMemberships(phone), loadAccess: phone => service.loadIdentityAccess(phone) });
  return { auth, service, twenty, documents, store };
}
let runtime;
export const getCrmRuntime = () => runtime ??= createCrmRuntime(process.env);
