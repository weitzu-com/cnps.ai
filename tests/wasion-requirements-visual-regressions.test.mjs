import test from 'node:test';
import assert from 'node:assert/strict';
import {createContext,excerpt,e} from '../server/wasion-requirements/shared.mjs';
import {renderBusiness,BUSINESS_CSS} from '../server/wasion-requirements/business.mjs';
import {COMPANY_CSS} from '../server/wasion-requirements/company-styles.mjs';
import {BASE_CSS} from '../server/wasion-requirements/styles.mjs';
import {MULTI_UTILITY_PORTFOLIO,buildMultiUtilityPortfolio} from '../server/wasion-requirements/product-relations.mjs';

const c=createContext();
const modules=html=>[...html.matchAll(/<section[^>]+data-module="([^"]+)"/g)].map(m=>m[1]);
const section=(html,id)=>html.match(new RegExp('<section[^>]*data-module="'+id+'"[^>]*>([\\s\\S]*?)</section>'))?.[1]||'';
const decode=value=>value.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
const cases=html=>[...html.matchAll(/<a class="wr-b-case" href="([^"]+)">[\s\S]*?<h3>[\s\S]*?<\/h3><p>([\s\S]*?)<\/p>/g)].map(([,href,text])=>({href,text:decode(text)}));
const cards=html=>[...html.matchAll(/<a class="wr-product-card" href="([^"]+)">/g)].map(m=>m[1]);

test('card excerpts preserve short text, normalise whitespace, and indicate a word-boundary omission',()=>{
 assert.equal(excerpt(null),'');assert.equal(excerpt(' \n\t '),'');
 assert.equal(excerpt('  Published\n60\u00a0kW  system.  '),'Published 60 kW system.');
 assert.equal(excerpt('Exact limit',11),'Exact limit');
 assert.equal(excerpt('First completeword remainder',18),'First\u2026');
 assert.equal(excerpt('Power 60 kW connection',12),'Power 60 kW\u2026');
 assert.equal(excerpt('Power 60 kW connection',10),'Power 60\u2026');
 assert.equal(excerpt('Uninterruptedidentifier',8),'\u2026');
 assert.equal(excerpt('abc',1),'\u2026');
 const unicode=excerpt('Energy \ud83d\udd0b ready for service',11);
 assert.equal(unicode,'Energy \ud83d\udd0b\u2026');assert.ok(!/[\uD800-\uDBFF]$/.test(unicode));
});

test('all business case excerpts remain source prefixes, end on a word boundary, and disclose shortening',()=>{
 let seen=0;
 for(const slug of [...c.solutions.map(s=>s.slug),'grid-flexibility-ders'])for(const card of cases(renderBusiness(slug,c))){
  const source=c.cases.find(p=>c.h(p.slug)===card.href);assert.ok(source,card.href);
  const full=(source.paragraphs.find(t=>/^Description:/i.test(t))||source.summary||'').replace(/^Description:\s*/i,'').replace(/\s+/gu,' ').trim();
  assert.ok(Array.from(card.text).length<=255,source.slug);
  if(card.text.endsWith('\u2026')){
   const prefix=card.text.slice(0,-1);assert.ok(full.startsWith(prefix),source.slug);
   assert.match(full.slice(prefix.length),/^\s/u,source.slug+' next source character must begin the omitted word');
  }else assert.equal(card.text,full,source.slug+' must not silently omit source text');
  assert.ok(!/(?:Agricultur|and remot|and PL)$/.test(card.text),source.slug);seen++;
 }
 assert.ok(seen>=8,'exercise actual AMI, prepayment, storage and microgrid cards');
});

test('product cards escape the source only after forming a safe marked excerpt',()=>{
 const summary='Published <meter> & control information '.repeat(9);
 const product={...c.products[0],summary};
 const html=c.productCard(product),text=decode(html.match(/<p>([\s\S]*?)<\/p>/)[1]);
 assert.ok(text.endsWith('\u2026'));assert.ok(summary.startsWith(text.slice(0,-1)));
 assert.ok(Array.from(text).length<=170);assert.ok(!html.includes('<meter>'));
 assert.ok(html.includes('&lt;meter&gt;'));assert.equal(product.summary,summary);
});

test('caption-bearing case and manufacturing images retain intrinsic ratios without fixed-height breakpoint overrides',()=>{
 for(const [css,selector] of [[BUSINESS_CSS,'.wr-b-case>img'],[COMPANY_CSS,'.wr-case-card>img'],[COMPANY_CSS,'.wr-manufacturing-layout>img']]){
  const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([,selectors])=>selectors.split(',').map(s=>s.trim()).includes(selector));
  assert.ok(rules.length,selector);
  const declarations=Object.assign({},...rules.map(([,_,body])=>Object.fromEntries(body.split(';').filter(Boolean).map(s=>s.split(':').map(v=>v.trim())))));
  assert.equal(declarations['object-fit'],'contain',selector);
  assert.equal(declarations.height,'auto',selector+' must not restore a fixed-height crop at mobile breakpoints');
  assert.ok(!declarations['aspect-ratio']||declarations['aspect-ratio']==='auto',selector);
  assert.equal(declarations.width,'100%',selector+' scales with its layout container');
 }
});

test('visual repairs retain the exact prototype module order and 198 existing routes',()=>{
 assert.equal(c.ROUTES.length,198);
 assert.deepEqual(modules(renderBusiness('ami-solution',c)),['hero','challenge','approach','features','cases','next-gen','related-products','cta']);
 assert.deepEqual(modules(renderBusiness('grid-flexibility-ders',c)),['hero','scenario-tabs','energy-flow','configuration','evidence','cta']);
 assert.deepEqual(modules(renderBusiness('multi-utility-sustainability',c)),['hero','water-gas-layers','service-journey','utility-stories','evidence','cta']);
});

test('multi-utility explicitly offers ultrasonic water, mechanical water and the actual residential gas model',()=>{
 const expected=['lxc-ultrasonic-water-meter','i-110-series-smart-water-meter','product-zg-d-1-6-4-smart-residential-gas-meter'];
 assert.deepEqual(MULTI_UTILITY_PORTFOLIO.map(r=>r.id),expected);
 assert.deepEqual(MULTI_UTILITY_PORTFOLIO.map(r=>r.utility),['water','water','gas']);
 const normal=section(renderBusiness('multi-utility-sustainability',c),'evidence');
 const shuffled=section(renderBusiness('multi-utility-sustainability',{...c,products:[...c.products].reverse()}),'evidence');
 assert.deepEqual(cards(normal),expected.map(c.h));assert.deepEqual(cards(shuffled),cards(normal));
 for(const row of buildMultiUtilityPortfolio(c.products)){
  assert.equal(row.product.id,row.id);assert.equal(row.evidence[0].url,row.product.url);
  assert.equal(row.evidence[0].quote,row.product.features[0]);assert.ok(normal.includes(e(row.reason)));
 }
 assert.ok(!normal.includes(c.h('lxc-d-ultrasonic-bulk-water-meter')),'old first-of-catalogue result must not survive');
});

test('missing curated gas model retains its request slot, never swaps another water/gas model or image',()=>{
 const gasId='product-zg-d-1-6-4-smart-residential-gas-meter';
 const decoy={...c.products.find(p=>p.id===gasId),id:'unreviewed-gas',slug:'unreviewed-zg-d-gas',title:'Unreviewed alternative',image:'/unreviewed-gas.webp',images:['/unreviewed-gas.webp']};
 const products=[decoy,...c.products.filter(p=>p.id!==gasId)];
 const html=renderBusiness('multi-utility-sustainability',{...c,products}),body=section(html,'evidence');
 assert.deepEqual(cards(body),['lxc-ultrasonic-water-meter','i-110-series-smart-water-meter'].map(c.h));
 assert.ok(body.includes('data-utility-model="'+gasId+'"'));assert.match(body,/Request model information/);
 assert.ok(!html.includes('/unreviewed-gas.webp'));assert.ok(!body.includes('Unreviewed alternative'));
 assert.equal(buildMultiUtilityPortfolio(products).find(p=>p.id===gasId).product,null);
});

// White is the brightest possible source-image pixel. Checking every stop
// bounds the contrast across this constant-hue alpha gradient, including
// narrow layouts where descriptions and breadcrumbs reach the right edge.
test('inner-page hero text remains readable over the brightest source-image pixel',()=>{
 const rule=BASE_CSS.match(/\.wr-page-hero:after\{([^}]+)\}/)?.[1];
 const stops=[...rule.matchAll(/#([0-9a-f]{8})\b/gi)].map(m=>m[1]);
 assert.ok(stops.length>=2);
 const rgb=hex=>[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const luminance=values=>values.reduce((sum,value,i)=>sum+[.2126,.7152,.0722][i]*(value<=.04045?value/12.92:((value+.055)/1.055)**2.4),0);
 const white=BASE_CSS.match(/--white:#([0-9a-f]{6})/i)[1];
 const mint=BASE_CSS.match(/--mint:#([0-9a-f]{6})/i)[1];
 const description=BASE_CSS.match(/\.wr-hero-content>p\{[^}]*color:#([0-9a-f]{6})/i)[1];
 const breadcrumb=BASE_CSS.match(/\.wr-breadcrumb\{[^}]*color:#([0-9a-f]{6})/i)[1];
 for(const stop of stops){
  const alpha=parseInt(stop.slice(6),16)/255;
  const background=rgb(stop).map(value=>alpha*value+1-alpha);
  for(const foreground of [white,mint,description,breadcrumb]){
   const ratio=(luminance(rgb(foreground))+.05)/(luminance(background)+.05);
   assert.ok(ratio>=4.5,`hero foreground #${foreground} over #${stop} on white: ${ratio.toFixed(2)}:1`);
  }
 }
});
