import test from 'node:test';import assert from 'node:assert/strict';
process.env.KV_REST_API_URL='https://isolated-fixture.upstash.io';process.env.KV_REST_API_TOKEN='fixture-only';
const {getCrmRuntime}=await import('../server/crm-runtime.mjs');const{default:page}=await import('../api/crm-workspace-page.js');
test('server redirects a proposal-only session before returning any workspace HTML',async()=>{
 const auth=getCrmRuntime().auth,original=auth.loadSession;auth.loadSession=async()=>({identity:{role:'proposal_viewer'}});
 try{const res={headers:{},setHeader(k,v){this.headers[k]=v},end(b){this.body=b}};await page({method:'GET',url:'/workspace?companyId=forged',headers:{host:'crm.cnps.ai'}},res);assert.equal(res.statusCode,302);assert.equal(res.headers.Location,'/w');assert.equal(res.body,undefined);assert.match(res.headers['Cache-Control'],/no-store/);}finally{auth.loadSession=original;}
});
