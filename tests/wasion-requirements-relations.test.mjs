import test from 'node:test';
import assert from 'node:assert/strict';
import {PRODUCTS,LEAF_CATEGORIES,SOLUTIONS,ROUTES,PAGES,SOLUTION_SOURCE_RELATIONS} from '../server/wasion-requirements/data.mjs';
import {PRODUCT_ASSIGNMENTS,PRODUCT_FAMILIES,PRODUCT_COMPARISONS} from '../server/wasion-requirements/product-relations.mjs';
import officialEvidence from '../server/wasion-requirements/official-evidence.json' with {type:'json'};
import {renderBusiness} from '../server/wasion-requirements/business.mjs';
import {createContext} from '../server/wasion-requirements/shared.mjs';

const c=createContext();
const product=id=>PRODUCTS.find(p=>p.id===id);
const leaf=id=>LEAF_CATEGORIES.find(p=>p.slug===id);
const solution=id=>SOLUTIONS.find(p=>p.slug===id);
const module=(html,id)=>html.match(new RegExp('<section[^>]*data-module="'+id+'"[^>]*>([\\s\\S]*?)</section>'))?.[1]||'';
const modules=html=>[...html.matchAll(/<section[^>]+data-module="([^"]+)"/g)].map(m=>m[1]);
const recordURLs=html=>[...html.matchAll(/class="wr-b-product-row" href="([^"]+)"/g)].map(m=>m[1]);

test('all 86 stable IDs have one reviewed family; all 39 leaf IDs use explicit model lists, preserving 198 routes',()=>{
 assert.equal(PRODUCTS.length,86);assert.equal(Object.keys(PRODUCT_ASSIGNMENTS).length,86);assert.equal(LEAF_CATEGORIES.length,39);assert.equal(SOLUTIONS.length,14);assert.equal(ROUTES.length,198);
 assert.deepEqual(new Set(Object.keys(PRODUCT_ASSIGNMENTS)),new Set(PRODUCTS.map(p=>p.id)));
 for(const p of PRODUCTS){
  assert.equal(p.id,p.slug);assert.ok(PRODUCT_FAMILIES[p.familyId],p.id);assert.equal(PRODUCT_FAMILIES[p.familyId].catalog,p.catalog,p.id);assert.equal(p.familyEvidence.url,p.url);assert.ok(p.familyEvidence.statement);
  for(const id of p.leafIds){assert.ok(leaf(id),p.id+': '+id);assert.equal(leaf(id).catalog,p.catalog);assert.ok(leaf(id).productIds.includes(p.id));}
 }
 for(const category of LEAF_CATEGORIES){
  assert.equal(category.match,undefined,category.slug+' must not use display-text regex');
  for(const id of category.productIds){assert.ok(product(id),id);assert.ok(product(id).leafIds.includes(category.slug));}
  if(!category.productIds.length&&!category.externalModels.length){assert.equal(category.status,'request-information');assert.ok(category.contentGap);}
 }
});

test('G3-PLC, BPLC and G3-Hybrid module categories are mutually exclusive, including misleading feature terms',()=>{
 const expected={
  'category-g3-plc':['product-g3-plc-network-interface-card-module'],
  'category-bplc':['product-bplc-network-interface-card-module'],
  'category-g3-hybrid':['product-hybrid-communication-module']
 };
 for(const [id,ids] of Object.entries(expected)){
  assert.deepEqual(leaf(id).productIds,ids);
  assert.deepEqual(recordURLs(renderBusiness(id,c)),ids.map(id=>c.h(id)));
 }
 // WID2000 and Hybrid both mention G3-PLC in their real feature text, but are
 // different device families and cannot enter the G3-PLC module listing.
 assert.ok(product('product-wid-2000-data-concentrator').features.some(s=>s.includes('G3-PLC')));
 assert.ok(!leaf('category-g3-plc').productIds.includes('product-wid-2000-data-concentrator'));
 assert.ok(!leaf('category-g3-plc').productIds.includes('product-hybrid-communication-module'));
 const changed={...c,products:c.products.map(p=>({...p,title:p.title+' BPLC G3-PLC Hybrid Libra',features:[...p.features,'G3-PLC BPLC Hybrid']}))};
 for(const [id,ids] of Object.entries(expected))assert.deepEqual(recordURLs(renderBusiness(id,changed)),ids.map(id=>c.h(id)),id+' stable under incidental display words');
});

test('Libra, DDSD101 and software leaves do not swallow similarly named models or neighboring roles',()=>{
 assert.deepEqual(leaf('category-libra-1a-ansi').productIds,['product-libra-1a-ansi-standard-conventional-meter']);
 assert.deepEqual(new Set(leaf('category-libra-1c-3c-ansi').productIds),new Set(['libra-1c-single-phase-energy-meter','libra-3c-multi-function-energy-meter']));
 assert.deepEqual(leaf('category-ddsd101-j6').productIds,['product-ddsd101-j6']);
 assert.deepEqual(leaf('category-head-end-system').productIds,['universal-device-integration-system','meter-data-reading']);
 assert.deepEqual(leaf('category-smart-network-management-system').productIds,['product-snms-smart-network-management-system']);
 assert.deepEqual(leaf('category-wi-sun').productIds,['product-wi-sun-rf-mesh-network-interface-card-module']);
 assert.ok(!leaf('category-gprs').productIds.includes('product-dc201-standalone-cellular-modem'),'standalone modem is not a communication module');
 assert.deepEqual(leaf('category-cat-1-4-m').productIds,[],'generic LTE is not evidence of the requested LTE category');
});

test('requested but undocumented model families retain accurate empty states; DT uses two verified external models without route inflation',()=>{
 for(const id of ['category-ameter100-300-eu-iec','category-wid4000-data-concentrator','category-burit100','category-wimc300','category-distribution-transformers','category-distribution-rtu-iot-edge','category-transformer-monitoring','category-pcs-booster-integrated-equipment']){
  const item=leaf(id),html=renderBusiness(id,c);assert.deepEqual(item.productIds,[],id);assert.equal(item.status,'request-information');assert.match(html,/Request family information/);assert.equal(recordURLs(html).length,0);
 }
 const dt=leaf('category-ameter100-dt-iec'),html=renderBusiness(dt.slug,c);
 assert.equal(dt.status,'official-external-models');assert.equal(dt.externalModels.length,2);assert.equal(recordURLs(html).length,2);
 for(const model of dt.externalModels){assert.ok(html.includes(model.sourceURL));assert.ok(!PRODUCTS.some(p=>p.url===model.sourceURL));}
 assert.ok(!leaf('category-wimc300').productIds.includes('product-smc100-wasion-cabinet-meters'));
 assert.ok(!leaf('category-wimc300').productIds.includes('wasion-metering-cabinet-large-power-unit'));
 assert.ok(!leaf('category-battery-container').productIds.includes('product-r-series-rectangular-stack-alkaline-pro-hydrogen-generation-systems'),'containerised hydrogen delivery is not a battery container');
 assert.ok(!leaf('category-battery-cabinet').productIds.includes('product-intelligent-charging-cabinet'),'battery-swap charger is not stationary BESS');
});

test('all 14 solution → product links and inverse product → solution links share one evidence graph',()=>{
 for(const s of SOLUTIONS){
  assert.deepEqual(s.products,s.productRelations.map(r=>r.id),s.slug);
  assert.deepEqual(s.cases,s.caseRelations.map(r=>r.id),s.slug);
  const html=renderBusiness(s.slug,c);
  assert.deepEqual(modules(html),['hero','challenge','approach','features','cases',...(s.challenge===0?['next-gen']:[]),'related-products','cta']);
  if(!s.products.length&&!s.externalProductRelations.length){assert.ok(s.productGap);assert.match(module(html,'related-products'),/Request the correct model selection/);}
  for(const edge of s.productRelations){
   assert.ok(product(edge.id));assert.ok(['selection-relevance','official-related-product'].includes(edge.kind));assert.ok(edge.reason);assert.ok(edge.evidence.length>=2);
   assert.ok(html.includes('href="'+c.h(edge.id)+'"'),s.slug+' → '+edge.id);
   assert.ok(module(renderBusiness(edge.id,c),'solutions').includes('href="'+c.h(s.slug)+'"'),edge.id+' → '+s.slug);
   for(const evidence of edge.evidence){assert.equal(new URL(evidence.url).hostname,'en.wasion.com');assert.ok(evidence.quote);}
  }
 }
 for(const p of PRODUCTS){
  const body=module(renderBusiness(p.id,c),'solutions');
  for(const s of SOLUTIONS)assert.equal(body.includes('href="'+c.h(s.slug)+'"'),s.productRelations.some(r=>r.id===p.id),p.id+' ↔ '+s.slug);
 }
});

test('gas selects only the real ZG-D; TMS uses its exact official CT-meter/MDR links, never generic breakers',()=>{
 assert.deepEqual(leaf('category-smart-gas-meters').productIds,['product-zg-d-1-6-4-smart-residential-gas-meter']);
 assert.deepEqual(solution('smart-gas-metering-solutions').products,['product-zg-d-1-6-4-smart-residential-gas-meter']);
 assert.ok(solution('smart-water-metering-solutions').products.every(id=>product(id).familyId!=='residential-gas'));
 assert.deepEqual(solution('tms-transformer-monitoring-system').products,['product-ameter300-ct-three-phase-smart-energy-meter','meter-data-reading']);
 assert.ok(solution('tms-transformer-monitoring-system').productRelations.every(r=>r.kind==='official-related-product'));
 assert.ok(!solution('smart-mv-distribution-solution').products.some(id=>product(id).familyId==='miniature-circuit-breakers'));
 assert.deepEqual(solution('power-grid-side-solution').products,[]);assert.deepEqual(solution('power-grid-side-solution').cases,[]);
 assert.deepEqual(solution('ci-bess-solutions').cases,[],'PV plant must not become a C&I BESS case');
});

test('official Related Products blocks are retained with provenance, excluding the shared Success Stories carousel',()=>{
 let count=0;
 for(const module of officialEvidence.solutionRelatedProducts){
  const edges=SOLUTION_SOURCE_RELATIONS[module.sourceURL];assert.equal(edges.length,module.relatedProducts.length);
  for(const edge of edges){count++;assert.equal(edge.kind,'official-related-product');assert.equal(edge.evidence[0].sourceHTMLSha256,module.sourceHTMLSha256);assert.ok(module.relatedProducts.some(r=>r.sourceURL===edge.url));}
 }
 assert.equal(count,29);
 const central=solution('centralised-metering');assert.equal(central.productRelations.length,5);assert.equal(central.externalProductRelations.length,2);
 assert.ok(!central.products.includes('product-smc100-wasion-cabinet-meters'),'SMC100 must not be inferred as the official cluster enclosure');
});

test('case relations preserve actual application context and never propagate unspecified model installation',()=>{
 assert.equal(SOLUTIONS.flatMap(s=>s.caseRelations).length,8);
 for(const s of SOLUTIONS){
  if(!s.cases.length)assert.ok(s.caseGap,s.slug+' explicit missing case');
  for(const relation of s.caseRelations){const item=PAGES.find(p=>p.slug===relation.id);assert.equal(relation.kind,'published-application-case');assert.equal(relation.evidence[0].url,item.url);assert.ok(item.paragraphs.includes(relation.evidence[0].quote));}
 }
 for(const p of PRODUCTS){
  assert.deepEqual(p.caseRelations,[],p.id+' no exact-model evidence');
  const html=module(renderBusiness(p.id,c),'solutions');assert.match(html,/data-case-evidence="not-established"/);assert.match(html,/Request a model-specific project reference/);
 }
});

test('recommendations compare explicitly reviewed families; singletons never borrow the first products of a top-level portfolio',()=>{
 for(const [id,comparison] of Object.entries(PRODUCT_COMPARISONS)){
  const p=product(id);assert.ok(comparison.reason);assert.ok(comparison.ids.length);
  for(const other of comparison.ids){assert.equal(product(other).familyId,p.familyId,id+' / '+other);assert.ok(PRODUCT_COMPARISONS[other].ids.includes(id));}
 }
 for(const id of ['product-zg-d-1-6-4-smart-residential-gas-meter','product-r-series-rectangular-stack-alkaline-pro-hydrogen-generation-systems','product-ws-fl-12-sf6-gas-insulated-ring-main-unit','product-libra-1a-ansi-standard-conventional-meter']){
  assert.equal(product(id).comparison,null);assert.match(module(renderBusiness(id,c),'related'),/Request a suitable comparison/);
 }
});

test('all product-detail facts and prototype modules survive the relationship audit',()=>{
 for(const p of PRODUCTS){const html=renderBusiness(p.id,c);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.deepEqual(modules(html),['hero','features','parameters','certifications','documents','solutions','related','cta']);for(const fact of [...p.features,...p.tables.flat(2)])assert.ok(html.includes(c.e(fact)),p.id+': '+fact);}
});
