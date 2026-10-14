import { getCrmRuntime } from './crm-runtime.mjs';
// Server-owned binding: request parameters cannot select a company or document.
export const proposalBinding = Object.freeze({id:'wasion-web-v1',companyId:'aedeea37-a4d2-4eda-83de-a700046ccabf',projectId:'61d10b7a-87a5-469d-bad7-00e8e5039f25',documents:{
 pdf:{documentId:'999b1726-95a1-4a1b-9a32-ade7a784fe2a',versionId:'636d3dbb-0901-4640-8bda-638ba2215e40'},
 pptx:{documentId:'ba7fd742-872e-4486-89cb-1a20451a5307',versionId:'4544b885-652c-457d-be8f-d750b08650b5'}
}});
export const proposalCrm = {
 authorize: phone => getCrmRuntime().service.proposalAccess(phone,proposalBinding),
 record: (phone,kind,eventId,assetId,metadata) => getCrmRuntime().service.recordProposalActivity(phone,proposalBinding,kind,eventId,assetId,metadata)
};
