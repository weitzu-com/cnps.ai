import { getCrmRuntime } from '../server/crm-runtime.mjs';
import { createBusinessHandler } from '../server/crm-business-handler.mjs';
export default function handler(req, res) {
  const { auth, service } = getCrmRuntime();
  return createBusinessHandler({ env: process.env, authHandler: auth, service })(req, res);
}
