import { getCrmRuntime } from '../server/crm-runtime.mjs';
import { createWasionSearchHandler } from '../server/wasion-demo.mjs';

// Resolve credentials only during the guarded authorization step. A preview
// without production CRM bindings must still import and fail closed cleanly.
export default createWasionSearchHandler({ env: process.env,
  auth: { loadSession: req => getCrmRuntime().auth.loadSession(req) }
});
