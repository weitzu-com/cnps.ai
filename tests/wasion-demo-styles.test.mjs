import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { WASION_PAGES, wasionDemoPage } from '../server/wasion-demo-page.mjs';
import { createWasionPageHandler } from '../api/crm-wasion-demo-page.js';
import { safeCrmReturnTo, crmLoginUrl } from '../server/crm-return.mjs';
import { boundaryDecision } from '../server/crm-boundary.mjs';
import { WASION_STYLES, wasionStyleBase } from '../server/wasion-demo-styles.mjs';

test('every published style renders the whole portfolio and keeps links within that style',()=>{
 for(const style of Object.keys(WASION_STYLES)) for(const {slug} of [...WASION_PAGES,{slug:'search'}]){
  const html=wasionDemoPage('style-nonce',{slug,style,query:'I-110 & AMI'}),base=wasionStyleBase(style);
  assert.ok(html,style+' '+slug);
  assert.match(html,new RegExp('action="'+base+'/search"'));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(html.includes('const WASION_BASE='+JSON.stringify(base)));
  assert.doesNotThrow(()=>new Script(html.match(/<script nonce="style-nonce">([\s\S]*)<\/script>/)[1]));
  const valid=new Set(WASION_PAGES.map(p=>base+(p.slug==='home'?'':'/'+p.slug)).concat(base+'/search','/demo/wasion/styles'));
  const markup=html.slice(html.indexOf('<header'),html.indexOf('<script'));
  for(const [,path] of markup.matchAll(/href="(\/demo\/wasion[^"?#]*)/g))assert.ok(valid.has(path),path);
 }
 assert.equal(wasionDemoPage('n',{style:'unknown'}),null);
});

test('style switching preserves the selected page and query; gallery exposes only published styles',()=>{
 const html=wasionDemoPage('n',{slug:'search',style:'atmospheric',query:'I-110 & AMI'});
 assert.ok(html.includes('href="/demo/wasion/search?q=I-110+%26+AMI"'));
 assert.ok(html.includes('href="/demo/wasion/styles/atmospheric/search?q=I-110+%26+AMI"'));
 const gallery=wasionDemoPage('n',{slug:'styles'});
 assert.match(gallery,/One portfolio/);assert.match(gallery,/Atmospheric/);
});

test('styled pages and search queries survive sign in without allowing unknown styles or external targets',()=>{
 const path='/demo/wasion/styles/atmospheric/search?q=I-110+%26+AMI';
 assert.equal(safeCrmReturnTo(path),path);
 assert.equal(new URL(crmLoginUrl(path),'https://crm.cnps.ai').searchParams.get('returnTo'),path);
 for(const path of ['/demo/wasion/styles/missing','/demo/wasion/styles/atmospheric/search/extra','//evil.test','/demo/wasion/styles/atmospheric/../search'])assert.equal(safeCrmReturnTo(path),null);
});

test('styled demo remains private to CRM host and unavailable on public or preview hosts',()=>{
 for(const path of ['/demo/wasion/styles','/demo/wasion/styles/atmospheric','/demo/wasion/styles/atmospheric/products']){
  assert.equal(boundaryDecision('crm.cnps.ai',path,'GET'),null);
  for(const host of ['www.cnps.ai','cnps.ai','test.vercel.app'])assert.equal(boundaryDecision(host,path,'GET').status,404);
  assert.equal(boundaryDecision('crm.cnps.ai',path,'GET',{VERCEL_ENV:'preview'}).status,404);
 }
});

test('style API uses the same authorization, HEAD guard and private response as original demo',async()=>{
 let session=null;
 const handler=createWasionPageHandler({getRuntime:()=>({auth:{loadSession:async()=>session},projectAccessService:{getProject:async()=>({id:'fixture'})}})});
 const request=async(query,method='GET')=>{const res={headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=body}};await handler({headers:{host:'crm.cnps.ai'},method,url:'/api/crm-wasion-demo-page',query},res);return res};
 const anon=await request({style:'atmospheric',slug:'search',q:'AMI'});
 assert.equal(anon.statusCode,302);assert.equal(new URL(anon.headers.Location,'https://crm.cnps.ai').searchParams.get('returnTo'),'/demo/wasion/styles/atmospheric/search?q=AMI');
 session={identityId:'fixture-admin',identity:{role:'admin'}};
 const ok=await request({style:'atmospheric',slug:'products'});assert.equal(ok.statusCode,200);assert.match(ok.headers['Cache-Control'],/private, no-store/);assert.match(ok.body,/wd-style-atmospheric/);
 const head=await request({style:'atmospheric'},'HEAD');assert.equal(head.statusCode,200);assert.equal(head.body,undefined);
 assert.equal((await request({style:'missing'})).statusCode,404);
});
