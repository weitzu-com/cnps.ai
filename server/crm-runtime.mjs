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
  let twenty = options.twenty, documents = options.documents, service, membershipService;
  const getTwenty = () => twenty ??= createTwentyAdapter(env);
  const getDocuments = () => documents ??= createDocumentsAdapter(env);
  // Identity checks need the authoritative membership directory, not the file,
  // email or delivery-notification adapters. Initialize each dependency only
  // when the operation actually uses it; all business ACL checks still apply.
  const memberships = () => membershipService ??= createBusinessService({ env, store, twenty: getTwenty() });
  const auth = createCrmAuthHandler({ env, storeFactory: options.authStoreFactory || createCrmStore, smsFactory: options.smsFactory || createCrmSms, loadMemberships: phone => memberships().loadMemberships(phone) });
  return {
    auth, store,
    get projectAccessService() { return memberships(); },
    get twenty() { return getTwenty(); },
    get documents() { return getDocuments(); },
    get service() {
      return service ??= createBusinessService({ env, store, twenty: getTwenty(), documents: getDocuments(), notifications: options.notifications || createDeliverySms(env), channels: options.channels || createDeliveryChannels(env) });
    }
  };
}
let runtime;
export const getCrmRuntime = () => runtime ??= createCrmRuntime(process.env);
