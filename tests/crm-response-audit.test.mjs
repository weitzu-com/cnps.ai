import test from 'node:test';import assert from 'node:assert/strict';import{EventEmitter}from'node:events';import{completedResponseAudit}from'../server/crm-response-audit.mjs';
import http from 'node:http';
import {fixture} from './helpers/crm-access-fixture.mjs';
import {createCrmProposalHandler} from '../server/crm-proposal-handler.mjs';
import {createBusinessHandler} from '../server/crm-business-handler.mjs';
test('served-file audit waits for finish and durable recording; early disconnect never claims a file response',async()=>{
 let count=0,release;const res=new EventEmitter(),pending=completedResponseAudit({method:'GET'},res,async()=>{count++;await new Promise(r=>{release=r})});
 assert.equal(count,0);res.emit('finish');await new Promise(r=>setImmediate(r));assert.equal(count,1);
 let done=false;pending.then(()=>{done=true});await new Promise(r=>setImmediate(r));assert.equal(done,false);release();await pending;assert.equal(done,true);
 const closed=new EventEmitter(),p=completedResponseAudit({method:'GET'},closed,async()=>{count++});closed.emit('close');await p;closed.emit('finish');await new Promise(r=>setImmediate(r));assert.equal(count,1);
 await completedResponseAudit({method:'HEAD'},new EventEmitter(),async()=>{count++});assert.equal(count,1);
});

async function settlesWithin(promise, milliseconds) {
 let timer;
 try {return await Promise.race([promise.then(()=>true),new Promise(resolve=>{timer=setTimeout(()=>resolve(false),milliseconds)})]);}
 finally {clearTimeout(timer);}
}

test('an already destroyed or closed response settles without waiting for past events or claiming a file',async()=>{
 for(const property of ['destroyed','closed']){
  const res=new EventEmitter();res[property]=true;let recorded=0;
  const pending=completedResponseAudit({method:'GET'},res,async()=>{recorded++});
  assert.equal(await settlesWithin(pending,100),true,property+' response must settle immediately');
  res.emit('finish');res.emit('close');await new Promise(resolve=>setImmediate(resolve));
  assert.equal(recorded,0);assert.equal(res.listenerCount('finish'),0);assert.equal(res.listenerCount('close'),0);
 }
});

test('completion audit rejection settles after finish without escaping the response lifecycle',async t=>{
 const warnings=[];t.mock.method(console,'warn',(...values)=>warnings.push(values));
 const res=new EventEmitter();let recorded=0;
 const pending=completedResponseAudit({method:'GET'},res,async()=>{recorded++;throw new Error('offline audit failure')});
 res.emit('finish');res.emit('close');
 assert.equal(await settlesWithin(pending,100),true);assert.equal(recorded,1);
 assert.deepEqual(warnings,[['CNPS_CRM_RESPONSE_AUDIT_FAILED']]);
});

for(const route of ['proposal','workspace'])test(route+' handler settles after a client disconnects during awaited preparation',async()=>{
 const h=await fixture(),calls={auth:0,authorize:0,prepared:0,completed:0};
 let unblock,reached,closed,settled,request,handlerFailure;
 const blocked=new Promise(resolve=>{unblock=resolve});
 const preparationStarted=new Promise(resolve=>{reached=resolve});
 const responseClosed=new Promise(resolve=>{closed=resolve});
 const handlerDone=new Promise(resolve=>{settled=resolve});
 const binding={id:'wasion-web-v1',companyId:'company-A',projectId:h.p.id,documents:{pdf:{documentId:h.doc.documentId,versionId:h.doc.versionId}}};
 if(route==='proposal')await h.service.grantProposal(h.admin,{phone:h.outsider.phone,proposalId:binding.id,operations:['view','download'],assetIds:['pdf']});
 const principal=route==='proposal'?{...h.outsider,identity:{role:'proposal_viewer'},sessionId:'offline-local'}:h.admin;
 const auth={loadSession:async()=>{calls.auth++;return principal;}};
 const service=new Proxy(h.service,{get(target,key){const original=target[key];if(typeof original!=='function')return original;return async(...args)=>{
  if(key==='authorizeProposal'||key==='authorizeDownload')calls.authorize++;
  if(key==='auditCompletedResponse')calls.completed++;
  const value=await original(...args);
  if(key===(route==='proposal'?'recordProposalAccess':'download')){calls.prepared++;reached();await blocked;}
  return value;
 };}});
 const handler=route==='proposal'?createCrmProposalHandler({env:h.env,runtime:()=>({auth,service}),binding,
  loadBundle:async()=>({assets:{pdf:{filename:'offline.pdf',type:'application/pdf',data:Buffer.from('offline file bytes').toString('base64')}}})}):
  createBusinessHandler({env:h.env,authHandler:auth,service});
 const server=http.createServer((req,res)=>{
  res.once('close',closed);res.once('error',()=>{});
  handler(req,res).then(settled,error=>{handlerFailure=error;settled();});
 });
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const path=route==='proposal'?'/w/asset/pdf':'/api/crm-workspace?'+new URLSearchParams({view:'download',companyId:'company-A',documentId:h.doc.documentId,versionId:h.doc.versionId});
  request=http.get({host:'127.0.0.1',port:server.address().port,path,agent:false},res=>res.resume());
  request.on('error',()=>{});
  assert.equal(await settlesWithin(preparationStarted,1000),true,'real handler reached awaited preparation');
  request.destroy();
  assert.equal(await settlesWithin(responseClosed,1000),true,'real ServerResponse closed before preparation resumes');
  unblock();
  assert.equal(await settlesWithin(handlerDone,300),true,'handler must not await a close event that already occurred');
  assert.equal(handlerFailure,undefined);assert.equal(calls.completed,0);
  assert.equal(calls.auth,2,'initial and final session checks remain');
  assert.equal(calls.authorize,route==='proposal'?3:1,'final resource authorization remains');
  assert.equal(calls.prepared,1);
 }finally{
  unblock();request?.destroy();server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
 }
});
