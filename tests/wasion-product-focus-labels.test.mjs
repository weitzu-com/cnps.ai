import test from 'node:test';
import assert from 'node:assert/strict';
import {PRODUCTS,productFocusLabel} from '../server/wasion-requirements/data.mjs';
import {createContext} from '../server/wasion-requirements/shared.mjs';
import {wasionDemoPage} from '../server/wasion-demo-page.mjs';
const c=createContext();
for(const [id,label] of [
 ['product-snms-smart-network-management-system','Network management software'],
 ['product-zw32-12-outdoor-high-voltage-smart-vacuum-circuit-breaker','Circuit breaker'],
 ['product-zw20-12-outdoor-high-voltage-smart-vacuum-circuit-breaker','Circuit breaker'],
 ['product-wpvi-tph-6000-12000-bh-us-smart-inverter-solution','Smart inverter']
])test('exact product focus is consistent in related cards and catalogue facets: '+id,()=>{
 const p=PRODUCTS.find(p=>p.id===id);assert.ok(p);assert.equal(p.type,'Smart metering');
 assert.equal(productFocusLabel(p),label);
 const card=c.productCard(p);assert.ok(card.includes('<span class="wr-eyebrow">'+label+'</span>'));assert.ok(!card.includes('Smart metering'));
 const html=wasionDemoPage('focus-fixture',{slug:p.catalog});
 const records=[...html.matchAll(/<article\b[^>]*data-record\b[\s\S]*?<\/article>/g)].map(m=>m[0]);
 const record=records.find(row=>row.includes('href="/demo/wasion/'+id+'"'));assert.ok(record,id);
 assert.ok(record.includes('data-productfocus="'+label+'"'),record.slice(0,500));
});
test('verified existing product focuses and unknown fallback remain unchanged',()=>{
 const p=PRODUCTS.find(p=>p.type==='Prepayment');assert.equal(productFocusLabel(p),'Prepayment');
 assert.equal(productFocusLabel({}),'Wasion product');
});
