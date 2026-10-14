import { crmLoginPage } from '../server/crm-login.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { WASION_PAGES, WASION_DEMO_ROUTES, wasionDemoPage } from '../server/wasion-demo-page.mjs';
import { createWasionPageHandler } from '../api/crm-wasion-demo-page.js';
import { safeCrmReturnTo, crmLoginUrl } from '../server/crm-return.mjs';
import { boundaryDecision } from '../server/crm-boundary.mjs';
import { WASION_STYLES, wasionStyleBase } from '../server/wasion-demo-styles.mjs';

test('every published style renders the whole portfolio and keeps links within that style',()=>{
 for(const style of Object.keys(WASION_STYLES)) for(const {slug} of WASION_DEMO_ROUTES.filter(s=>s!=='styles').map(slug=>({slug}))){
  const html=wasionDemoPage('style-nonce',{slug,style,query:'I-110 & AMI'}),base=wasionStyleBase(style);
  assert.ok(html,style+' '+slug);
  assert.ok(html.includes('href="'+base+'/search"'),style+' '+slug+' keeps navigation search');
  if(style!=='industrial'||slug==='search')assert.match(html,new RegExp('action="'+base+'/search"'));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(html.includes('const WASION_BASE='+JSON.stringify(base)));
  assert.doesNotThrow(()=>new Script([...html.matchAll(/<script nonce="style-nonce">([\s\S]*?)<\/script>/g)].at(-1)[1]));
  const valid=new Set(WASION_DEMO_ROUTES.map(slug=>base+(slug==='home'?'':'/'+slug)).concat(base+'/search','/demo/wasion/styles'));
  const markup=html.match(/<body\b[^>]*>([\s\S]*?)<script nonce=/)?.[1];
  assert.ok(markup,style+' '+slug+' contains body markup');
  const switchLinks = markup.match(/<nav class="wd-style-switch"[\s\S]*?<\/nav>/)[0];
  for(const other of Object.keys(WASION_STYLES))assert.ok(switchLinks.includes(wasionStyleBase(other)));
  const contentMarkup=markup.replace(switchLinks,'');
  for(const [,path] of contentMarkup.matchAll(/href="(\/demo\/wasion[^"?#]*)/g))assert.ok(valid.has(path),path);
 }
 assert.equal(wasionDemoPage('n',{style:'unknown'}),null);
});

test('style switching preserves the selected page and query; gallery exposes only published styles',()=>{
 for(const style of Object.keys(WASION_STYLES)){
  for(const slug of ['search','products','i-110-series-smart-water-meter']){
   const html=wasionDemoPage('n',{slug,style,query:'I-110 & AMI'});
   for(const other of Object.keys(WASION_STYLES))assert.ok(html.includes('href="'+wasionStyleBase(other)+'/'+slug+(slug==='search'?'?q=I-110+%26+AMI':'')+'"'),style+' → '+other+' '+slug);
  }
 }
 const gallery=wasionDemoPage('n',{slug:'styles'});
 assert.match(gallery,/One portfolio/);assert.match(gallery,/Atmospheric/);
 for(const style of Object.keys(WASION_STYLES))assert.ok(gallery.includes('href="'+wasionStyleBase(style)+'"'));
});

test('styled pages and search queries survive sign in without allowing unknown styles or external targets',()=>{
 for(const style of Object.keys(WASION_STYLES))for(const slug of ['home','search','products','i-110-series-smart-water-meter']){
  const path=wasionStyleBase(style)+(slug==='home'?'':'/'+slug)+(slug==='search'?'?q=I-110+%26+AMI':'');
  assert.equal(safeCrmReturnTo(path),path);
  assert.equal(new URL(crmLoginUrl(path),'https://crm.cnps.ai').searchParams.get('returnTo'),path);
 }
 for(const path of ['/demo/wasion/styles/missing','/demo/wasion/styles/atmospheric/search/extra','//evil.test','/demo/wasion/styles/atmospheric/../search'])assert.equal(safeCrmReturnTo(path),null);
});

test('styled demo remains private to CRM host and unavailable on public or preview hosts',()=>{
 const paths=['/demo/wasion/styles',...Object.keys(WASION_STYLES).flatMap(style=>['','/products','/search'].map(suffix=>wasionStyleBase(style)+suffix))];
 for(const path of paths){
  assert.equal(boundaryDecision('crm.cnps.ai',path,'GET'),null);
  for(const host of ['www.cnps.ai','cnps.ai','test.vercel.app'])assert.equal(boundaryDecision(host,path,'GET').status,404);
  assert.equal(boundaryDecision('crm.cnps.ai',path,'GET',{VERCEL_ENV:'preview'}).status,404);
 }
});

test('style API uses the same authorization, HEAD guard and private response as original demo',async()=>{
 let session=null;
 const handler=createWasionPageHandler({getRuntime:()=>({auth:{loadSession:async()=>session},projectAccessService:{getProject:async()=>({id:'fixture'})}})});
 const request=async(query,method='GET')=>{const res={headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=body}};await handler({headers:{host:'crm.cnps.ai'},method,url:'/api/crm-wasion-demo-page',query},res);return res};
 for(const style of Object.keys(WASION_STYLES)){
  session=null;
  const base=wasionStyleBase(style),anon=await request({style,slug:'search',q:'AMI'});
  assert.equal(anon.statusCode,302);assert.equal(new URL(anon.headers.Location,'https://crm.cnps.ai').searchParams.get('returnTo'),base+'/search?q=AMI');
  session={identityId:'fixture-admin',identity:{role:'admin'}};
  const ok=await request({style,slug:'products'});assert.equal(ok.statusCode,200);assert.match(ok.headers['Cache-Control'],/private, no-store/);assert.ok(ok.body.includes('const WASION_BASE='+JSON.stringify(base)));
  const head=await request({style},'HEAD');assert.equal(head.statusCode,200);assert.equal(head.body,undefined);
 }
 assert.equal((await request({style:'missing'})).statusCode,404);
});

test('POST search resumes the selected design after login without exposing the question in the URL',()=>{
 for(const style of Object.keys(WASION_STYLES)){
  const html=crmLoginPage('nonce',{returnTo:wasionStyleBase(style)+'/search',resumeQuestion:'I-110 & AMI'});
  assert.ok(html.includes('id="demo-resume" action="'+wasionStyleBase(style)+'/search" method="post"'));
  assert.match(html,/name="q" value="I-110 &amp; AMI"/);
 }
 assert.ok(!crmLoginPage('n',{returnTo:'/demo/wasion/styles/missing/search',resumeQuestion:'I-110'}).includes('id="demo-resume"'));
});

test('new designs share the exact product catalog, technical data and search endpoint',()=>{
 const catalog=style=>JSON.parse(wasionDemoPage('n',{style}).match(/const WASION_DATA=([\s\S]*?);const SEARCH_QUERY=/)[1]);
 const baseline=catalog('classic').map(({href,...item})=>item);
 for(const style of ['planhat','orderful','industrial']){
  assert.deepEqual(catalog(style).map(({href,...item})=>item),baseline);
  const detail=wasionDemoPage('n',{style,slug:'i-110-series-smart-water-meter'});
  assert.match(detail,/Technical information/);
  const search=wasionDemoPage('n',{style,slug:'search',query:'I-110'});
  assert.match(search,/\/api\/crm-wasion-demo-search/);
  assert.ok(search.includes('data-base="'+wasionStyleBase(style)+'"'));
  const login=crmLoginPage('n',{returnTo:wasionStyleBase(style)+'/search',resumeQuestion:'I-110'});
  assert.ok(login.includes('action="'+wasionStyleBase(style)+'/search"'));
 }
});

test('Planhat and Orderful use different home compositions and are listed in the gallery',()=>{
 const p=wasionDemoPage('n',{style:'planhat'}),o=wasionDemoPage('n',{style:'orderful'});
 assert.match(p,/class="wv-plan-hero"/);assert.doesNotMatch(p,/class="wv-order-hero/);
 assert.match(o,/class="wv-order-hero/);assert.doesNotMatch(o,/class="wv-plan-hero"/);
 const gallery=wasionDemoPage('n',{slug:'styles'});
 for(const style of ['planhat','orderful'])assert.ok(gallery.includes('href="'+wasionStyleBase(style)+'"'));
});

test('canonical demo defaults to Orderful on every page and Classic retains its own complete route tree',()=>{
 assert.equal(wasionStyleBase(),'/demo/wasion');
 assert.equal(wasionStyleBase('orderful'),'/demo/wasion');
 assert.equal(wasionStyleBase('classic'),'/demo/wasion/styles/classic');
 for(const slug of WASION_DEMO_ROUTES){
  assert.equal(wasionDemoPage('n',{slug,query:'I-110'}),wasionDemoPage('n',{slug,query:'I-110',style:'orderful'}),slug);
 }
 const home=wasionDemoPage('n');assert.match(home,/<body class="wd-style-orderful wd-is-home">/);assert.match(home,/action="\/demo\/wasion\/search"/);
 const classic=wasionDemoPage('n',{style:'classic'});assert.match(classic,/id="wx-film"/);assert.match(classic,/action="\/demo\/wasion\/styles\/classic\/search"/);
 const query=wasionDemoPage('n',{slug:'search',query:'I-110 & AMI'});
 assert.ok(query.includes('href="/demo/wasion/styles/classic/search?q=I-110+%26+AMI"'));
 for(const style of ['classic','atmospheric','planhat','industrial'])assert.ok(home.includes('href="'+wasionStyleBase(style)+'"'));
 const gallery=wasionDemoPage('n',{slug:'styles'});assert.match(gallery,/Default · Overseas customer experience/);
});

test('page API default, Orderful alias, Classic login return and POST recovery agree on the selected design',async()=>{
 let session={identityId:'fixture-admin',identity:{role:'admin'}};
 const handler=createWasionPageHandler({getRuntime:()=>({auth:{loadSession:async()=>session},projectAccessService:{getProject:async()=>({id:'fixture'})}})});
 async function request(query,method='GET'){const res={headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=body}};await handler({headers:{host:'crm.cnps.ai',origin:'https://crm.cnps.ai'},method,url:'/api/crm-wasion-demo-page',query,body:method==='POST'?{q:'I-110 & AMI'}:undefined},res);return res;}
 for(const query of [{},{style:'orderful'}]){const res=await request(query);assert.equal(res.statusCode,200);assert.match(res.body,/<body class="wd-style-orderful wd-is-home">/);assert.ok(res.body.includes('const WASION_BASE="/demo/wasion"'));}
 const classic=await request({style:'classic'});assert.equal(classic.statusCode,200);assert.match(classic.body,/id="wx-film"/);assert.ok(classic.body.includes('const WASION_BASE="/demo/wasion/styles/classic"'));
 session=null;
 const anon=await request({style:'classic',slug:'search',q:'I-110'});assert.equal(anon.statusCode,302);assert.equal(new URL(anon.headers.Location,'https://crm.cnps.ai').searchParams.get('returnTo'),'/demo/wasion/styles/classic/search?q=I-110');
 for(const [style,base] of [[undefined,'/demo/wasion'],...Object.keys(WASION_STYLES).map(style=>[style,wasionStyleBase(style)])]){const res=await request({...(style?{style}:{}),slug:'search'},'POST');assert.equal(res.statusCode,200);assert.ok(res.body.includes('id="demo-resume" action="'+base+'/search" method="post"'));assert.match(res.headers['Cache-Control'],/private, no-store/);}
 assert.equal(safeCrmReturnTo('/demo/wasion/styles/classic/search?q=I-110'),'/demo/wasion/styles/classic/search?q=I-110');
});
