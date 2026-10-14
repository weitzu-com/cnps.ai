import { guardPrivateRequest } from '../server/crm-boundary.mjs';
import { getCrmRuntime } from '../server/crm-runtime.mjs';
import { proposalBinding } from '../server/proposal-crm.mjs';
import { loadEncryptedBundle } from '../server/proposal-handler.mjs';
import { createCrmProposalHandler } from '../server/crm-proposal-handler.mjs';
const proposal = createCrmProposalHandler({env:process.env,runtime:getCrmRuntime,loadBundle:loadEncryptedBundle,binding:proposalBinding});
export default function handler(req,res){if(guardPrivateRequest(req,res))return;return proposal(req,res);}
