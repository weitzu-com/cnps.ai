import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocumentsAdapter } from '../server/crm-documents-adapter.mjs';
const env={CRM_FILE_GATEWAY_URL:'https://files.example.invalid',CRM_FILE_GATEWAY_KEY:'a'.repeat(64)};
const context={companyId:'11111111-1111-4111-8111-111111111111',projectId:'22222222-2222-4222-8222-222222222222'};
const objectId='33333333-3333-4333-8333-333333333333';
const data={id:objectId,...context,mimeType:'text/plain',size:4,filename:'file.txt'};
test('private file reads carry server credentials and bound company/project scope',async()=>{
 const calls=[];const adapter=createDocumentsAdapter(env,{fetch:async(url,options)=>{calls.push([url,options]);return new Response(JSON.stringify(data));}});
 assert.deepEqual(await adapter.getObject(objectId,context),data);
 assert.equal(calls[0][0].searchParams.get('companyId'),context.companyId);
 assert.equal(calls[0][0].searchParams.get('projectId'),context.projectId);
 assert.equal(calls[0][1].headers.authorization,'Bearer '+env.CRM_FILE_GATEWAY_KEY);
 assert.equal(calls[0][1].redirect,'manual');
});
test('bad or absent scope fails before private network requests',async()=>{
 let calls=0;const adapter=createDocumentsAdapter(env,{fetch:async()=>{calls++;}});
 await assert.rejects(adapter.getObject(objectId),e=>e.status===400);
 await assert.rejects(adapter.readObject('../etc/passwd',context),e=>e.status===400);
 assert.equal(calls,0);
});
test('scope mismatch and credential redirects fail closed without upstream content',async()=>{
 for(const response of [new Response(JSON.stringify({...data,companyId:context.projectId})),new Response('upstream-private-token',{status:302,headers:{location:'https://other.invalid'}})]){
  const adapter=createDocumentsAdapter(env,{fetch:async()=>response});
  await assert.rejects(adapter.getObject(objectId,context),e=>e.status===503&&!e.message.includes('upstream'));
 }
});
test('only verified HTTPS or local loopback endpoints can receive file credentials',()=>{
 assert.throws(()=>createDocumentsAdapter({...env,CRM_FILE_GATEWAY_URL:'http://public.invalid'}));
 assert.throws(()=>createDocumentsAdapter({...env,CRM_FILE_GATEWAY_URL:'https://user:password@files.invalid'}));
});
test('file contents remain bytes and uploads verify returned ownership',async()=>{
 const adapter=createDocumentsAdapter(env,{fetch:async(url,options)=>options.method==='POST'?new Response(JSON.stringify(data),{status:201}):new Response(Buffer.from('file'))});
 assert.equal((await adapter.readObject(objectId,context)).toString(),'file');
 assert.deepEqual(await adapter.createObject({...context,filename:'file.txt',mimeType:'text/plain',base64:Buffer.from('file').toString('base64')}),data);
});
