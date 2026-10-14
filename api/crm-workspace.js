import { guardPrivateRequest } from '../server/crm-boundary.mjs';
import { getCrmRuntime } from '../server/crm-runtime.mjs';
import { createBusinessHandler } from '../server/crm-business-handler.mjs';
export default async function handler(req, res) {
  if (guardPrivateRequest(req, res)) return;
  try {
    const { auth, service } = getCrmRuntime();
    return await createBusinessHandler({ env: process.env, authHandler: auth, service })(req, res);
  } catch {res.statusCode=503;res.setHeader('Content-Type','application/json; charset=utf-8');return res.end(req.method==='HEAD'?undefined:JSON.stringify({error:'客户工作台暂不可用，请稍后重试。'}));}
}
