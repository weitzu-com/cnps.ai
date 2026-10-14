import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { wasionDemoPage, WASION_PAGES, WASION_DEMO_ROUTES } from '../server/wasion-demo-page.mjs';
import { INDUSTRIAL_CLIENT } from '../server/wasion-demo-industrial.mjs';
import { WASION_STYLES, WASION_DEFAULT_STYLE, wasionStyleBase } from '../server/wasion-demo-styles.mjs';
import { createWasionPageHandler } from '../api/crm-wasion-demo-page.js';
import { isolationFixture } from './fixtures/wasion-isolation.mjs';

const base='/demo/wasion/styles/industrial';
const body=html=>html.match(/<body\b[^>]*>([\s\S]*?)<script nonce=/)[1];
const main=html=>body(html).match(/<main id="main">([\s\S]*?)<\/main>/)[1];
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

test('Industrial adds a fifth selectable direction while preserving the existing default',()=>{
 assert.equal(WASION_DEFAULT_STYLE,'orderful');
 assert.deepEqual(Object.keys(WASION_STYLES),['classic','atmospheric','planhat','orderful','industrial']);
 assert.equal(wasionStyleBase('industrial'),base);
 const gallery=main(wasionDemoPage('n',{slug:'styles'}));
 assert.ok(gallery.includes('href="'+base+'"'));
 assert.match(gallery,/Industrial/);
 assert.match(wasionDemoPage('n'),/<body class="wd-style-orderful wd-is-home">/);
});

test('Industrial leads with brand and portfolio rather than an AI prompt',()=>{
 const html=wasionDemoPage('n',{style:'industrial'}),content=main(html);
 assert.match(content,/class="wi-hero"/);
 assert.match(content,/id="wi-hero-title"/);
 const hero=content.slice(content.indexOf('class="wi-hero"'),content.indexOf('</section>')+10);
 assert.match(hero,/<h1\b/);
 assert.ok(hero.includes('href="'+base+'/our-offering"')||hero.includes('href="'+base+'/products"'));
 assert.doesNotMatch(hero,/<form\b|type="search"|\/search(?:\?|"|#)/);
 assert.doesNotMatch(content,/<form\b[^>]*role="search"/);
 assert.ok(body(html).includes('href="'+base+'/search"'));
 assert.doesNotMatch(content,/wx-home-search|wv-order-hero|wx-film/);
});

test('precision product displays use the shared Wasion model routes and official imagery',()=>{
 const content=main(wasionDemoPage('n',{style:'industrial'}));
 assert.match(content,/class="wi-products(?:\s[^"]*)?"/);
 assert.match(content,/id="wi-products"/);
 for(const slug of ['ameter300-three-phase-smart-energy-meter','i-110-series-smart-water-meter']){
  const product=WASION_PAGES.find(p=>p.slug===slug);
  assert.ok(product);
  assert.ok(content.includes('href="'+base+'/'+slug+'"'),slug+' model route');
  const officialImage=product.images.find(url=>url.includes('/uploads/images/'))||product.images.find(url=>!/icon|x-pro-info|searc/i.test(url));
  assert.ok(content.includes('src="'+escape(encodeURI(officialImage))+'"'),slug+' existing source image');
 }
});

test('Industrial product details retain source specifications and auxiliary discovery',()=>{
 const page=WASION_PAGES.find(p=>p.slug==='i-110-series-smart-water-meter');
 const html=wasionDemoPage('n',{style:'industrial',slug:page.slug}),content=main(html);
 for(const cell of page.tables.flat(2))assert.ok(content.includes(escape(cell)),cell);
 assert.ok(content.includes('href="'+page.url+'"'));
 assert.ok(content.includes('href="'+base+'/search?q='));
 assert.match(content,/class="wd-tables" tabindex="0" role="region" aria-label="Scrollable official technical information"/);
 assert.doesNotMatch(body(html),/class="wd-mini-search/);
 for(const style of ['classic','atmospheric','planhat'])assert.match(body(wasionDemoPage('n',{style,slug:page.slug})),/class="wd-mini-search/);
});

test('Industrial search retains a POST form, immediate model results and the shared AI endpoint',()=>{
 const html=wasionDemoPage('n',{style:'industrial',slug:'search',query:'I110'}),content=main(html);
 assert.ok(content.includes('action="'+base+'/search" method="post"'));
 assert.ok(content.includes('href="'+base+'/i-110-series-smart-water-meter"'));
 assert.match(content,/1 matching official pages/);
 assert.match(html,/\/api\/crm-wasion-demo-search/);
 assert.ok(html.includes('data-base="'+base+'"'));
});

test('Industrial interaction code is included only in the Industrial style',()=>{
 assert.ok(INDUSTRIAL_CLIENT.trim());
 for(const style of Object.keys(WASION_STYLES)){
  const html=wasionDemoPage('n',{style});
  assert.equal(html.includes(INDUSTRIAL_CLIENT),style==='industrial',style);
 }
});

test('Industrial pages preserve unique controls and resolving in-page navigation',()=>{
 for(const slug of WASION_DEMO_ROUTES){
  const markup=body(wasionDemoPage('n',{style:'industrial',slug}));
  const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,slug+' duplicate control ID');
  for(const [,fragment] of markup.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(fragment),slug+' missing fragment '+fragment);
 }
});

test('product stage supports click and keyboard selection with one visible panel and roving focus',()=>{
 const content=main(wasionDemoPage('n',{style:'industrial'}));
 let focused;
 const tabs=[...content.matchAll(/<button\b[^>]*\bdata-wi-product="[^"]+"[^>]*>/g)].map(([markup])=>{
  const attributes=Object.fromEntries([...markup.matchAll(/([a-z-]+)="([^"]*)"/g)].map(([,name,value])=>[name,value]));
  const listeners=new Map();
  return {attributes,listeners,tabIndex:Number(attributes.tabindex),setAttribute(name,value){attributes[name]=String(value)},getAttribute(name){return attributes[name]},addEventListener(name,handler){listeners.set(name,handler)},focus(){focused=this}};
 });
 const panels=[...content.matchAll(/<(?:article|div|section)\b[^>]*class="[^"]*\bwi-product-panel\b[^"]*"[^>]*>/g)].map(([markup])=>({id:markup.match(/\bid="([^"]+)"/)[1],hidden:/\shidden(?:\s|>)/.test(markup)}));
 assert.ok(tabs.length>=2);
 assert.equal(tabs.length,panels.length);
 runInNewContext(INDUSTRIAL_CLIENT,{document:{querySelector:()=>null,querySelectorAll:selector=>selector==='[data-wi-product]'?tabs:selector==='.wi-product-panel'?panels:[],getElementById:()=>null}});
 function expectSelected(index){
  assert.equal(tabs.filter(tab=>tab.attributes['aria-selected']==='true').length,1);
  assert.equal(tabs.filter(tab=>tab.tabIndex===0).length,1);
  assert.equal(tabs[index].attributes['aria-selected'],'true');
  assert.deepEqual(panels.filter(panel=>!panel.hidden).map(panel=>panel.id),[tabs[index].getAttribute('aria-controls')]);
 }
 let prevented=0;
 const key=(tab,value)=>tab.listeners.get('keydown')({key:value,preventDefault(){prevented++}});
 key(tabs[0],'End');expectSelected(tabs.length-1);assert.equal(focused,tabs.at(-1));
 key(tabs.at(-1),'ArrowRight');expectSelected(0);assert.equal(focused,tabs[0]);
 key(tabs[0],'ArrowLeft');expectSelected(tabs.length-1);
 key(tabs.at(-1),'Home');expectSelected(0);
 tabs[1].listeners.get('click')();expectSelected(1);
 key(tabs[1],'Tab');expectSelected(1);assert.equal(prevented,4);
});

test('an authorized Industrial form POST keeps the question out of the page URL and escapes the submitted text',async()=>{
 const handler=createWasionPageHandler({getRuntime:()=>({auth:{loadSession:async()=>({identityId:'fixture-admin',identity:{role:'admin'}})},projectAccessService:{getProject:async()=>({id:'fixture'})}})});
 const question='I-110 </script><script>alert(1)</script> & AMI';
 const res={headers:{},setHeader(k,v){this.headers[k]=v},end(value){this.body=value}};
 await handler({method:'POST',url:base+'/search',headers:{host:'crm.cnps.ai',origin:'https://crm.cnps.ai'},query:{style:'industrial',slug:'search'},body:{q:question}},res);
 assert.equal(res.statusCode,200);
 assert.ok(res.body.includes('const CRM_PAGE_URL="'+base+'/search"'));
 assert.ok(main(res.body).includes(escape(question)));
 assert.ok(!res.body.includes('</script><script>alert(1)</script>'));
 assert.match(res.headers['Cache-Control'],/private, no-store/);
});

test('Industrial routes keep the project access boundary for customers and other accounts',async()=>{
 const h=isolationFixture();
 for(const actor of ['wasion','other','unassigned']){
  const cookie=await h.login(actor);
  for(const slug of ['home','products','i-110-series-smart-water-meter','search'])for(const method of ['GET','HEAD']){
   const result=await h.request(h.page,'/api/crm-wasion-demo-page?'+new URLSearchParams({style:'industrial',slug}),{cookie,method});
   assert.equal(result.status,actor==='wasion'?200:404,actor+' '+method+' '+slug);
   if(method==='GET'&&actor==='wasion')assert.match(result.text,/wd-style-industrial/);
   if(actor!=='wasion')assert.ok(!result.text.includes('<html'));
  }
 }
 assert.equal(h.counts().modelCalls,0);
});
