import { guardPrivateRequest } from '../server/crm-boundary.mjs';
import { getCrmRuntime } from '../server/crm-runtime.mjs';
import { createWasionSearchHandler } from '../server/wasion-demo.mjs';

// Resolve credentials only during the guarded authorization step. A preview
// without production CRM bindings must still import and fail closed cleanly.
const search = createWasionSearchHandler({ env: process.env,
  auth: { loadSession: req => getCrmRuntime().auth.loadSession(req) },
  service: { getProject: (...args) => getCrmRuntime().projectAccessService.getProject(...args) }
});

export default function handler(req,res){if(guardPrivateRequest(req,res))return;return search(req,res);}
