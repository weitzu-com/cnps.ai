import { createAccessService } from "./crm-access-service.mjs";
import { createDeliveryChannels } from "./crm-delivery-channels.mjs";
import { createDeliverySms } from "./crm-delivery-sms.mjs";
import { createCrmAuthHandler } from "./crm-auth-handler.mjs";
import { createCrmStore } from "./crm-auth-store.mjs";
import { createCrmSms } from "./crm-auth-sms.mjs";
import { createBusinessStore } from "./crm-business-store.mjs";
import { createBusinessService } from "./crm-business-service.mjs";
import { createTwentyAdapter } from "./crm-twenty-adapter.mjs";
import { createDocumentsAdapter } from "./crm-documents-adapter.mjs";

export function createCrmRuntime(env, options = {}) {
  const store = options.store || createBusinessStore(env);
  let twenty = options.twenty,
    documents = options.documents,
    service,
    identityService;
  const getTwenty = () => (twenty ??= createTwentyAdapter(env));
  const getDocuments = () => (documents ??= createDocumentsAdapter(env));
  // Auth must remain independent of file and notification configuration. The
  // native adapter is also lazy so admin/proposal-only checks need no Twenty IO.
  const lazyTwenty = new Proxy(
    {},
    {
      get(_target, key) {
        return (...args) => getTwenty()[key](...args);
      },
    },
  );
  const identities = () =>
    (identityService ??= createAccessService({
      base: createBusinessService({ env, store, twenty: lazyTwenty }),
      store,
      twenty: lazyTwenty,
      env,
    }));
  const auth = createCrmAuthHandler({
    env,
    storeFactory: options.authStoreFactory || createCrmStore,
    smsFactory: options.smsFactory || createCrmSms,
    loadMemberships: (phone) => identities().loadMemberships(phone),
    loadAccess: (phone) => identities().loadIdentityAccess(phone),
  });
  return {
    auth,
    store,
    get projectAccessService(){return identities();},
    get twenty() {
      return getTwenty();
    },
    get documents() {
      return getDocuments();
    },
    get service() {
      return (service ??= createAccessService({
        base: createBusinessService({
          env,
          store,
          twenty: getTwenty(),
          documents: getDocuments(),
          notifications: options.notifications || createDeliverySms(env),
          channels: options.channels || createDeliveryChannels(env),
        }),
        store,
        twenty: getTwenty(),
        documents: getDocuments(),
        env,
      }));
    },
  };
}
let runtime;
export const getCrmRuntime = () => (runtime ??= createCrmRuntime(process.env));
