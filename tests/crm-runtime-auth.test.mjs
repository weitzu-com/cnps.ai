import test from 'node:test';
import assert from 'node:assert/strict';
import { createCrmRuntime } from '../server/crm-runtime.mjs';
import { digest } from '../server/proposal-crypto.mjs';

const env = {CNPS_PROPOSAL_SECRET:'1'.repeat(64),CNPS_CRM_ADMIN_PHONE:'18700001111'};
const authStore = {reserve:async()=>true,reserveDetailed:async()=>({allowed:true}),set:async()=>{}};
async function send(runtime, phone) {
  const headers={};let body;
  const response={setHeader(k,v){headers[k]=v;},end(v){body=v;}};
  await runtime.auth({method:'POST',url:'/api/crm',headers:{origin:'https://crm.cnps.ai','content-type':'application/json','x-cnps-crm':'1'},body:{action:'send',phone,consent:true}},response);
  return {status:response.statusCode,headers,body:JSON.parse(body)};
}
test('administrator identity verification is independent of business adapter initialization',async()=>{
  let calls=0;
  const runtime=createCrmRuntime(env,{store:{getDirectory:async()=>({revision:0,companies:{},memberGrants:{},managerAssignments:{}})},authStoreFactory:()=>authStore,smsFactory:()=>({send:async()=>{calls++;}})});
  assert.equal((await send(runtime,env.CNPS_CRM_ADMIN_PHONE)).status,200);
  assert.equal(calls,1);
  assert.throws(()=>runtime.service); // Missing business bindings remain unavailable.
});
test('customer membership is still authoritative without initializing files or notification adapters',async()=>{
  const phone='18800002222',pid=digest(env.CNPS_PROPOSAL_SECRET,'phone',phone);let active=true,calls=0;
  const directory={companies:{A:{companyId:'A'}},managerAssignments:{},memberGrants:{[pid]:{active:true,companyId:'A',contactId:'contact-A',projectScope:'all',documentScope:'all'}}};
  const runtime=createCrmRuntime(env,{store:{getDirectory:async()=>directory},twenty:{getContact:async()=>({id:'contact-A',active,identityId:pid,companyId:'A'}),getCompany:async()=>({id:'A',active:true})},authStoreFactory:()=>authStore,smsFactory:()=>({send:async()=>{calls++;}})});
  assert.equal((await send(runtime,phone)).status,200);
  active=false;
  assert.equal((await send(runtime,phone)).status,403);
  assert.equal(calls,1);
  assert.throws(()=>runtime.documents);
});
test('project preview ACL reads do not initialize file or notification adapters',async()=>{
 const project={id:'project-A',companyId:'A',title:'Fixture project'};
 const state={revision:1,companyId:'A',projects:{'project-A':{...project,publication:{project}}}};
 const directory={revision:1,companies:{A:{companyId:'A'}},managerAssignments:{},memberGrants:{}};
 const runtime=createCrmRuntime(env,{store:{getDirectory:async()=>directory,getCompany:async()=>state},twenty:{}});
 const admin={identityId:'actor-admin',identity:{role:'admin'}};
 assert.equal((await runtime.projectAccessService.getProject(admin,'A','project-A')).id,'project-A');
 assert.throws(()=>runtime.documents);assert.throws(()=>runtime.service);
});
