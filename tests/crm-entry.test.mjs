import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {boundaryDecision,guardPrivateRequest} from '../server/crm-boundary.mjs';
import {safeCrmReturnTo,crmLoginUrl} from '../server/crm-return.mjs';
import middleware from '../middleware.js';

test('canonical CRM pages remain private and old routes retain only safe destinations',()=>{
 for(const path of ['/','/workspace'])assert.equal(boundaryDecision('crm.cnps.ai',path,'GET'),null);
 for(const path of ['/crm','/crm/'])assert.deepEqual(boundaryDecision('crm.cnps.ai',path,'GET',{},'?companyId=A&projectId=P&secret=drop'),{status:308,location:'/?returnTo=%2Fworkspace%3FcompanyId%3DA%26projectId%3DP'});
 for(const path of ['/crm/workspace','/crm/workspace/','/workspace/']){
  for(const method of ['GET','HEAD'])assert.deepEqual(boundaryDecision('crm.cnps.ai',path,method,{},'?companyId=A&projectId=P&contextId=member%3AA%3Asales_manager&token=drop'),{status:308,location:'/workspace?companyId=A&projectId=P&contextId=member%3AA%3Asales_manager'});
  assert.equal(boundaryDecision('crm.cnps.ai',path,'POST').status,410);
 }
 assert.equal(boundaryDecision('crm.cnps.ai','/crm','GET',{},'?returnTo=https://evil.test').location,'/');
 assert.equal(boundaryDecision('crm.cnps.ai','/crm/wasion-demo','GET').location,'/demo/wasion');
 assert.equal(safeCrmReturnTo('/crm/workspace?companyId=A&projectId=P'),'/workspace?companyId=A&projectId=P');
 assert.equal(crmLoginUrl('/crm/workspace?deliveryId=D'),'/?returnTo=%2Fworkspace%3FdeliveryId%3DD');
});

test('new page paths cannot expose private responses on website, previews or aliases',()=>{
 for(const host of ['www.cnps.ai','cnps.ai'])assert.deepEqual(boundaryDecision(host,'/workspace','GET',{},'?deliveryId=D&token=drop'),{status:307,location:'https://crm.cnps.ai/workspace?deliveryId=D'});
 for(const host of ['preview.vercel.app','cnps-ai.vercel.app']){
  assert.equal(boundaryDecision(host,'/workspace','GET').status,404);
  assert.equal(boundaryDecision(host,'/workspace','GET',{VERCEL_ENV:'preview'}).status,404);
 }
 assert.equal(boundaryDecision('crm.cnps.ai','/','GET',{VERCEL_ENV:'preview'}).status,404);
 for(const path of ['/workspace/private','/workspace%2fprivate','/crm/unknown'])assert.equal(boundaryDecision('crm.cnps.ai',path,'GET').status,404);
});

test('middleware and handler canonicalization agree and Vercel root routing is host scoped',async()=>{
 const request=new Request('https://crm.cnps.ai/crm/workspace?companyId=A&deliveryId=D&token=drop');
 const response=middleware(request);
 assert.equal(response.status,308);assert.equal(response.headers.get('location'),'https://crm.cnps.ai/workspace?companyId=A&deliveryId=D');assert.match(response.headers.get('cache-control'),/no-store/);
 const headers={},res={setHeader(k,v){headers[k]=v},end(){}};
 assert.equal(guardPrivateRequest({url:'/crm/workspace?companyId=A&deliveryId=D&token=drop',method:'HEAD',headers:{host:'crm.cnps.ai'}},res,{}),true);
 assert.equal(res.statusCode,308);assert.equal(headers.Location,'/workspace?companyId=A&deliveryId=D');
 const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url)));
 assert.deepEqual(config.rewrites.find(r=>r.source==='/'),{source:'/',destination:'/api/crm-page',has:[{type:'host',value:'crm.cnps.ai'}]});
 assert.equal(config.rewrites.find(r=>r.source==='/workspace').destination,'/api/crm-workspace-page');
 assert.ok(config.redirects.find(r=>r.source==='/'&&r.destination==='/en').has);
 assert.equal(config.redirects.some(r=>r.destination==='/crm'),false);
});
