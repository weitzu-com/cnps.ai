import config from '../content/integrations/fastgpt-hubspot.json' with {type:'json'};
import {createCrmInquiryHandler} from '../server/crm-inquiry-handler.mjs';
import {createInquiryStore} from '../server/crm-inquiry-store.mjs';

// Lazy import avoids initializing the privileged CRM connection for malformed
// public requests. A lead submission never registers a portal company/member.
export default createCrmInquiryHandler({
  env:process.env,config:{...config,portalId:process.env.HUBSPOT_PORTAL_ID??config.portalId,formId:process.env.HUBSPOT_FORM_ID??config.formId},storeFactory:createInquiryStore,
  getNative:async()=>{const {getCrmRuntime}=await import('../server/crm-runtime.mjs');return getCrmRuntime().twenty;},
});
