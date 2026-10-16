import test from 'node:test';
import assert from 'node:assert/strict';
import {answerWasionQuestion} from '../server/wasion-demo.mjs';
import {PRODUCTS} from '../server/wasion-requirements/data.mjs';

for (const id of [
  'product-intelligent-charging-cabinet',
  'product-hybrid-communication-module',
  'product-ws-fl-12-sf6-gas-insulated-ring-main-unit'
]) test('AI context preserves exact published parameter grid and parent groups: '+id,async()=>{
  const product=PRODUCTS.find(product=>product.id===id);assert.ok(product?.parameterTables.length);
  let requests=0;
  const response=await answerWasionQuestion({question:'Describe '+product.title,env:{CRM_AI_API_KEY:'test-key'},fetchImpl:async(_url,options)=>{
    requests++;
    const sent=JSON.parse(options.body),sources=JSON.parse(sent.messages[1].content).officialSources;
    const source=sources.find(source=>source.id===id);assert.ok(source);
    assert.equal(source.url,product.url);
    assert.deepEqual(source.publishedTables,product.parameterTables);
    assert.ok(source.publishedTables.some(table=>table.rows.some(row=>row.cells.some(cell=>cell.rowspan>1))));
    assert.ok(source.publishedTables.every(table=>table.sourceURL===source.url&&/^[0-9a-f]{64}$/.test(table.officialBodySha256)));
    assert.match(sent.messages[0].content,/preserve the original cell rowspans, colspans, parent parameter groups and model-specific column headers/);
    for(const candidate of sources){
      const own=PRODUCTS.find(product=>product.id===candidate.id&&product.url===candidate.url);
      if(candidate.publishedTables)assert.deepEqual(candidate.publishedTables,own.parameterTables);
      if(!own)assert.equal(candidate.publishedTables,undefined);
    }
    return {ok:true,text:async()=>JSON.stringify({choices:[{message:{content:JSON.stringify({supported:true,answer:`The official page provides the product information. [${source.citation}]`})}}]})};
  }});
  assert.equal(requests,1);assert.equal(response.status,200);assert.equal(response.data.ai.generated,true);
});
