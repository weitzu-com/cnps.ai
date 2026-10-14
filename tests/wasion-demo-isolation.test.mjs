import test from 'node:test';
import assert from 'node:assert/strict';
import { isolationFixture } from './fixtures/wasion-isolation.mjs';
import { WASION_PAGES } from '../server/wasion-demo-page.mjs';
import { createWasionSearchHandler } from '../server/wasion-demo.mjs';
const businessUrl=h=>'/api/crm-workspace?view=project&'+new URLSearchParams(h.binding);
const searchRequest=cookie=>({method:'POST',cookie,body:{question:'Wi-SUN',language:'en'}});

test('verified Wasion customer session receives the workspace entry and can read all demo pages plus search',async()=>{
 const h=isolationFixture(),cookie=await h.login('wasion');
 const session=await h.request(h.auth,'/api/crm?view=session',{cookie});assert.equal(session.json().identity.role,'customer');
 for(const view of ['records','documents'])assert.equal((await h.request(h.business,'/api/crm-workspace?'+new URLSearchParams({view,...h.binding}),{cookie})).status,200);
 const project=await h.request(h.business,businessUrl(h),{cookie});assert.equal(project.status,200);assert.equal(project.json().data.previews[0].href,'/demo/wasion');
 for(const page of WASION_PAGES){const result=await h.request(h.page,'/api/crm-wasion-demo-page?slug='+page.slug,{cookie});assert.equal(result.status,200,page.slug);assert.ok(result.text.includes('<html'));}
 assert.equal((await h.request(h.page,'/api/crm-wasion-demo-page?slug=search',{cookie,method:'HEAD'})).status,200);
 const search=await h.request(h.search,'/api/crm-wasion-demo-search',searchRequest(cookie));assert.equal(search.status,200);assert.ok(search.json().data.results.length>0);
});
test('other-company customers and unassigned same-company customers cannot access project, any demo route, direct API, HEAD or search',async()=>{
 for(const actor of ['other','unassigned','otherManager']){
  const h=isolationFixture(),cookie=await h.login(actor);
  assert.equal((await h.request(h.auth,'/api/crm?view=session',{cookie})).status,200); // Valid login is insufficient.
  assert.equal((await h.request(h.business,businessUrl(h),{cookie})).status,404,actor);
  for(const slug of [...WASION_PAGES.map(p=>p.slug),'search'])for(const method of ['GET','HEAD']){
   const r=await h.request(h.page,'/api/crm-wasion-demo-page?slug='+slug,{cookie,method});assert.equal(r.status,404,actor+':'+slug);assert.ok(!r.text.includes('<html'));
  }
  const denied=await h.request(h.search,'/api/crm-wasion-demo-search',{...searchRequest(cookie),body:{question:'Wi-SUN',companyId:h.binding.companyId,projectId:h.binding.projectId,identity:{role:'admin'}}});
  assert.equal(denied.status,404);assert.equal(denied.json().data,undefined);assert.equal(h.counts().modelCalls,0);
 }
});
test('existing session loses all preview access when project scope, publication or membership is revoked',async()=>{
 for(const change of ['removeProjectGrant','unpublish','revoke']){
  const h=isolationFixture(),cookie=await h.login('wasion');assert.equal((await h.request(h.page,'/api/crm-wasion-demo-page?slug=home',{cookie})).status,200);
  h[change]('wasion');
  const project=await h.request(h.business,businessUrl(h),{cookie});assert.ok([401,404].includes(project.status));
  assert.equal((await h.request(h.page,'/api/crm-wasion-demo-page?slug=home',{cookie})).status,change==='revoke'?302:404);
  assert.equal((await h.request(h.search,'/api/crm-wasion-demo-search',searchRequest(cookie))).status,404);
 }
});
test('project revocation during AI inference or fallback prevents result and source disclosure',async()=>{
 for(const fallback of [true,false]){
  const h=isolationFixture(),cookie=await h.login('wasion');let checks=0;
  const service={getProject:async(...args)=>{const result=await h.service.getProject(...args);if(++checks===1&&fallback)h.removeProjectGrant();return result;}};
  const handler=createWasionSearchHandler({auth:h.auth,service,env:fallback?{}:{CRM_AI_API_KEY:'fixture-key'},rateLimit:async()=>true,fetchImpl:async()=>{h.removeProjectGrant();return {ok:true,text:async()=>JSON.stringify({choices:[{message:{content:JSON.stringify({answer:'Wi-SUN is listed. [wisun-solutions]',supported:true})}}]})};}});
  const r=await h.request(handler,'/api/crm-wasion-demo-search',searchRequest(cookie));assert.equal(r.status,404);assert.equal(r.json().data,undefined);
 }
});
test('assigned Wasion manager and system administrator retain project preview access',async()=>{
 for(const actor of ['manager','admin']){const h=isolationFixture(),cookie=await h.login(actor);assert.equal((await h.request(h.page,'/api/crm-wasion-demo-page?slug=home',{cookie})).status,200);}
});
test('project authorization outages fail closed without excerpts or rendered HTML',async()=>{
 const h=isolationFixture(),cookie=await h.login('wasion');const service={getProject:async()=>{throw Error('Private datastore diagnostics');}};
 const {createWasionPageHandler}=await import('../api/crm-wasion-demo-page.js');
 const page=createWasionPageHandler({getRuntime:()=>({auth:h.auth,projectAccessService:service})});
 const search=createWasionSearchHandler({env:{},auth:h.auth,service});
 for(const [handler,url,options] of [[page,'/demo/wasion',{cookie}],[search,'/api/crm-wasion-demo-search',searchRequest(cookie)]]){
  const r=await h.request(handler,url,options);assert.equal(r.status,503);assert.ok(!r.text.includes('<html'));assert.ok(!r.text.includes('Private datastore diagnostics'));assert.ok(!r.text.includes('wisun-solutions'));
 }
});
