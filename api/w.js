import { createHandler, loadEncryptedBundle } from '../server/proposal-handler.mjs';
import { createStore } from '../server/proposal-store.mjs';
import { createSms } from '../server/proposal-sms.mjs';
export default createHandler({env:process.env,storeFactory:createStore,smsFactory:createSms,loadBundle:loadEncryptedBundle});
