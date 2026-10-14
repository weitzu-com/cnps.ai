import { getCrmRuntime } from '../server/crm-runtime.mjs';
import { createWasionSearchHandler } from '../server/wasion-demo.mjs';

const runtime = getCrmRuntime();
export default createWasionSearchHandler({ env: process.env, auth: runtime.auth, service: runtime.service });
