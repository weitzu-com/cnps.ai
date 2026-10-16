import test from 'node:test';import assert from 'node:assert/strict';
import {PRODUCTS} from '../server/wasion-requirements/data.mjs';
import {getWasionParameterWarning} from '../server/wasion-parameter-warnings.mjs';
import {answerWasionQuestion} from '../server/wasion-demo.mjs';
import {wasionDemoPage} from '../server/wasion-demo-page.mjs';
const examples=[
 ['product-zw32-12-outdoor-high-voltage-smart-vacuum-circuit-breaker','What is the rated voltage unit for ZW32-12?','ZW32-12的额定电压单位是什么？','The rated voltage is12kV.'],
 ['product-zw20-12-outdoor-high-voltage-smart-vacuum-circuit-breaker','What is the rated voltage for ZW20-12?','ZW20-12的额定电压是什么？','The rated voltage is12kV.'],
 ['product-ws-fl-12-sf6-gas-insulated-ring-main-unit','What current ratings apply to WS-FL-12?','WS-FL-12的电流额定值是什么？','The current rating is20kV.'],
 ['product-kyn28-12-high-voltage-metal-clad-switchgear','What is the withstand current for KYN28-12?','KYN28-12的耐受电流是多少？','The peak withstand current is40kV.'],
 ['product-jyl-60-fault-indicator-distribution-line-fault-detectors-technology','What metering precision applies to JYL-60?','JYL-60的计量精度是多少？','The metering precision is an insufficient gas warning.']
];
for(const [id,en,zh,bad] of examples){
 const p=PRODUCTS.find(p=>p.id===id);
 test('source-bound warning is visible without changing any quoted parameter: '+id,()=>{
  const note=getWasionParameterWarning(p);assert.ok(note);assert.equal(note.sourceURL,p.url);
  assert.ok(wasionDemoPage('warning-fixture',{slug:id}).includes('aria-label="Published table wording to confirm"'));
  assert.equal(getWasionParameterWarning({...p,url:'https://example.invalid/'}),null);
  const copy=structuredClone(p);copy.parameterTables[0].officialBodySha256='0'.repeat(64);assert.equal(getWasionParameterWarning(copy),null);
 });
 for(const [language,question] of [['en',en],['zh',zh]])test('uncertain unit or field is clarified before provider request: '+language+' '+id,async()=>{
  let requests=0;const result=await answerWasionQuestion({question,language,env:{CRM_AI_API_KEY:'test-key'},fetchImpl:async()=>{requests++;throw Error('No request expected');}});
  assert.equal(requests,0);assert.equal(result.data.ai.generated,false);assert.equal(result.data.ai.status,'source_clarification');assert.equal(result.data.ai.generationRequestAttempted,false);
  assert.equal(result.data.sources[0].id,id);assert.equal(result.data.sources[0].url,p.url);
  for(const row of getWasionParameterWarning(p).rows)assert.ok(result.data.answer.includes(row.cells.join(' | ')));
  assert.match(result.data.answer,language==='zh'?/不推定或改写正确单位和数值/:/no corrected units or values are inferred/);
 });
 test('a model overview cannot turn uncertain original wording into a generated rating: '+id,async()=>{
  let requests=0;const result=await answerWasionQuestion({question:'Describe '+p.title,env:{CRM_AI_API_KEY:'test-key'},fetchImpl:async(_url,options)=>{
   requests++;const source=JSON.parse(JSON.parse(options.body).messages[1].content).officialSources.find(source=>source.id===id);assert.ok(source.sourceWarnings);return {ok:true,text:async()=>JSON.stringify({choices:[{message:{content:JSON.stringify({supported:true,answer:bad+' ['+source.citation+']'})}}]})};
  }});
  assert.equal(requests,1);assert.equal(result.data.ai.generated,false);assert.equal(result.data.ai.generationRequestAttempted,true);assert.ok(!result.data.answer.includes(bad));
 });
}
for(const [question,language,bad] of [
 ['ZW32-12','en','ZW32-12 operates at12kV.'],
 ['ZW32-12','zh','ZW32-12可在12千伏下工作。'],
 ['WS-FL-12','en','Its gas vessel operates at0.04MPa.'],
 ['WS-FL-12','zh','其气室在0.04兆帕下运行。']
])test('a cited disputed value cannot bypass clarification by omitting its field noun: '+language+' '+question,async()=>{
 let requests=0;const result=await answerWasionQuestion({question:'Describe '+question,language,env:{CRM_AI_API_KEY:'test-key'},fetchImpl:async(_url,options)=>{
  requests++;const sources=JSON.parse(JSON.parse(options.body).messages[1].content).officialSources;
  return {ok:true,text:async()=>JSON.stringify({choices:[{message:{content:JSON.stringify({supported:true,language,answer:bad+' ['+sources[0].citation+']'})}}]})};
 }});
 assert.equal(requests,1);assert.equal(result.data.ai.generated,false);assert.equal(result.data.ai.status,'source_clarification');assert.equal(result.data.ai.generationRequestAttempted,true);assert.ok(!result.data.answer.includes(bad));
});
test('unambiguous model capability survives the bounded disputed-value guard',async()=>{
 const result=await answerWasionQuestion({question:'Describe ZW32-12 features',env:{CRM_AI_API_KEY:'test-key'},fetchImpl:async(_url,options)=>{
  const sources=JSON.parse(JSON.parse(options.body).messages[1].content).officialSources;
  return {ok:true,text:async()=>JSON.stringify({choices:[{message:{content:JSON.stringify({supported:true,answer:'It provides manual and automatic energy storage. ['+sources[0].citation+']'})}}]})};
 }});
 assert.equal(result.data.ai.generated,true);
});
