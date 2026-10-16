import test from 'node:test';
import assert from 'node:assert/strict';
import {wasionDemoPage} from '../server/wasion-demo-page.mjs';
import {PRODUCTS,RESOURCE_ITEMS} from '../server/wasion-requirements/data.mjs';
import {getWasionSourceNotes} from '../server/wasion-source-notes.mjs';

const models=[
 'product-hmpm-for-the-android-platform-to-set-parameters-read-copy-data-from-meters-with-hhu',
 'product-jyl-60-fault-indicator-distribution-line-fault-detectors-technology',
 'product-we-cube-air-cooling-500kw-1000kwh'
];
for(const id of models)test('published specification differences are visible with an exact-model confirmation path: '+id,()=>{
 const product=PRODUCTS.find(p=>p.id===id),notes=getWasionSourceNotes(id);
 assert.equal(notes.length,1);
 assert.equal(notes[0].sourceURL,product.url);
 const html=wasionDemoPage('source-notes-review',{slug:id});
 assert.ok(html.includes('aria-label="Published information to confirm"'));
 assert.ok(html.indexOf('aria-label="Published information to confirm"')<html.indexOf('class="wr-b-parameter-table"'));
 const decode=v=>v.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 const body=decode(html);
 for(const quote of notes[0].quotes)assert.ok(body.includes(quote),quote);
 assert.ok(body.includes(notes[0].message));
 assert.ok(html.includes('Request a confirmed specification'));
 assert.ok(html.includes(encodeURIComponent(product.title+' — '+notes[0].field+' confirmation')));
 assert.ok(html.includes(product.url));
 assert.ok(html.includes('Specifications below reproduce the published model information.'));
});
test('unaffected product detail does not receive another model’s source note',()=>{
 const html=wasionDemoPage('source-notes-review',{slug:'i-110-series-smart-water-meter'});
 assert.ok(!html.includes('aria-label="Published information to confirm"'));
 assert.deepEqual(getWasionSourceNotes('i-110-series-smart-water-meter'),[]);
});
test('AMI publication keeps its official label and link while distinguishing an unconfirmed edition',()=>{
 const item=RESOURCE_ITEMS.find(r=>r.id==='resource-6');
 assert.equal(item.title,'Wasion AMI Solutions for Dtech2024');
 assert.equal(item.url,'https://en.wasion.com/public/uploads/files/20240224/Wasion AMI Solutions for Dtech2024.pdf');
 assert.match(item.description,/PDF metadata names North America/);
 assert.match(item.description,/Confirm the applicable edition/);
 for(const slug of ['resources','collateral-videos']){
  const html=wasionDemoPage('source-notes-review',{slug});
  assert.ok(html.includes(item.description),slug);
  assert.ok(html.includes(item.title),slug);
 }
 assert.ok(RESOURCE_ITEMS.filter(r=>r.id!=='resource-6').every(r=>!r.description.includes('Dtech2024')));
});
