import test from 'node:test';import assert from 'node:assert/strict';import{fixture}from'./helpers/crm-access-fixture.mjs';
test('proposal access auditing does not mutate the authorization revision or contend with concurrent readers',async()=>{
 const h=await fixture(),binding={id:'wasion-web-v1',companyId:'company-A',projectId:h.p.id,documents:{pdf:{documentId:h.doc.documentId,versionId:h.doc.versionId}}};
 const before=await h.store.getDirectory(),n=h.audit.length;
 await Promise.all(Array.from({length:3},(_,i)=>h.service.recordProposalAccess(h.admin,binding,'download','event-'+i,'pdf',{contentHash:'a'.repeat(64)})));
 assert.equal((await h.store.getDirectory()).revision,before.revision);
 assert.equal(h.audit.length,n+3);
 assert.ok(h.audit.slice(n).every(e=>e.action==='access.proposal-download-prepared'&&e.contentHash==='a'.repeat(64)&&e.resourceId===h.doc.documentId));
});

import{proposalAssetResponse}from'../server/crm-proposal-assets.mjs';import{gunzipSync}from'node:zlib';
test('private PDF compression negotiates gzip without altering downloaded bytes or integrity evidence',async()=>{
 const raw=Buffer.from('%PDF-1.7\n'+'Synthetic private PDF bytes\n'.repeat(6000)),asset={data:raw.toString('base64')};
 const compressed=await proposalAssetResponse(asset,'br, gzip;q=0.8');assert.equal(compressed.encoding,'gzip');assert.ok(compressed.bytes.length<raw.length*.95);assert.deepEqual(gunzipSync(compressed.bytes),raw);
 for(const header of [undefined,'br','gzip;q=0','*;q=1,gzip;q=0','gzip;q=invalid']){const v=await proposalAssetResponse(asset,header);assert.equal(v.encoding,undefined);assert.deepEqual(v.bytes,raw);assert.equal(v.contentHash,compressed.contentHash);}
 assert.equal((await proposalAssetResponse(asset,'*;q=0.5')).encoding,'gzip');
 const small=await proposalAssetResponse({data:Buffer.from('small PDF').toString('base64')},'gzip');assert.equal(small.encoding,undefined);
});
test('revocation during proposal preparation auditing blocks the cached asset representation',async()=>{
 const h=await fixture(),binding={id:'wasion-web-v1',companyId:'company-A',projectId:h.p.id,documents:{pdf:{documentId:h.doc.documentId,versionId:h.doc.versionId}}};
 await h.service.grantProposal(h.admin,{phone:h.outsider.phone,proposalId:binding.id,operations:['view','download'],assetIds:['pdf']});
 const original=h.store.recordAccess;h.store.recordAccess=async e=>{await original(e);if(e.action==='access.proposal-download-prepared'){const d=await h.store.getDirectory(),g=Object.values(d.proposalGrants).find(g=>g.identityId===h.outsider.identityId&&g.active);await h.service.revokeProposal(h.admin,g.id);}};
 const{createCrmProposalHandler}=await import('../server/crm-proposal-handler.mjs');
 const res={headers:{},statusCode:200,setHeader(k,v){this.headers[k.toLowerCase()]=v},end(v){this.body=v||''}};
 const handler=createCrmProposalHandler({env:h.env,runtime:()=>({auth:{loadSession:async()=>({...h.outsider,identity:{role:'proposal_viewer'}})},service:h.service}),binding,loadBundle:async()=>({html:'test',assets:{pdf:{filename:'private.pdf',type:'application/pdf',data:Buffer.from('Private file').toString('base64')}}})});
 await handler({method:'GET',url:'/w/asset/pdf',headers:{'accept-encoding':'gzip'}},res);assert.equal(res.statusCode,404);assert.ok(!String(res.body).includes('Private file'));
});
