import test from 'node:test';
import assert from 'node:assert/strict';
import {projectPreviews,wasionPreviewBinding,wasionWorkspaceHref} from '../server/crm-project-previews.mjs';
import {createBusinessHandler} from '../server/crm-business-handler.mjs';
import {BusinessError} from '../server/crm-business-service.mjs';
import {wasionDemoPage,WASION_DEMO_ROUTES} from '../server/wasion-demo-page.mjs';
test('preview attaches only after authorization of the exact bound project',async()=>{
 const {companyId,projectId}=wasionPreviewBinding;
 assert.equal(projectPreviews(companyId,projectId).length,1);
 assert.deepEqual(projectPreviews(companyId,'other'),[]);assert.deepEqual(projectPreviews('other',projectId),[]);
 for(const allowed of [true,false]){
  const handler=createBusinessHandler({env:{},authHandler:{loadSession:async()=>({identity:{role:'customer'}})},service:{getProject:async()=>{if(!allowed)throw new BusinessError(404,'Denied');return {id:projectId};}}});
  let body;const res={setHeader(){},end(value){body=JSON.parse(value);}};
  await handler({url:'/api/crm-workspace?view=project&'+new URLSearchParams({companyId,projectId}),method:'GET',headers:{}},res);
  assert.equal(res.statusCode,allowed?200:404);if(allowed)assert.equal(body.data.previews[0].href,'/demo/wasion');else assert.equal(body.data,undefined);
 }
});
test('demo links back to its exact CRM project on every page',()=>{
 for(const slug of WASION_DEMO_ROUTES){const html=wasionDemoPage('test',{slug});assert.ok(html.includes('Client workspace'));assert.ok(html.includes('class="wd-workspace-return"'));assert.ok(html.includes('.wx-utility nav>a.wd-workspace-return{display:block'));
 assert.ok(html.includes(wasionWorkspaceHref.replaceAll('&','&amp;')));}
});
