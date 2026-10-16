import test from 'node:test';
import assert from 'node:assert/strict';
import {wasionDemoPage} from '../server/wasion-demo-page.mjs';
import {PRODUCTS,RESOURCE_ITEMS} from '../server/wasion-requirements/data.mjs';
import {getWasionSourceNotes,getWasionQuestionClarification,getWasionAnswerClarification} from '../server/wasion-source-notes.mjs';
import {answerWasionQuestion,createWasionSearchHandler} from '../server/wasion-demo.mjs';
import {WASION_SOURCES,retrieveWasionSources} from '../server/wasion-demo-sources.mjs';
import {BusinessError} from '../server/crm-business-service.mjs';

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

const clarificationCases=[
 ['Which Android version does HMPM require?','en',models[0]],
 ['HMPM 支持 Android 5.0 还是 Android 6.0？请说明来源差异。','zh',models[0]],
 ['What current ratings are published for the JYL-60 fault indicator?','en',models[1]],
 ['JYL-60 的短路电流和故障电流指标分别是多少？','zh',models[1]],
 ['Is the WE CUBE Air Cooling 500kW / 1000kWh rated capacity 1000kWh or 1075.2 kWh?','en',models[2]],
 ['WE CUBE 风冷 500kW / 1000kWh 的额定容量如何确认？','zh',models[2]]
];
for(const [question,language,id]of clarificationCases)test('disputed field uses literal source clarification instead of repeating the observed model failure: '+question,async()=>{
 let calls=0;
 const result=await answerWasionQuestion({question,language,env:{CRM_AI_API_KEY:'local-fixture'},fetchImpl:async()=>{calls++;throw new Error('A model must not resolve the disputed source field.')}});
 assert.equal(calls,0);
 assert.equal(result.status,200);
 assert.equal(result.data.ai.generated,false);
 assert.equal(result.data.ai.status,'source_clarification');
 assert.equal(result.data.ai.reason,'published_field_difference');
  assert.equal(result.data.ai.generationRequestAttempted,false);
 assert.equal(result.data.language,language);
 assert.equal(result.data.sources.length,1);
 assert.equal(result.data.sources[0].id,id);
 assert.equal(result.data.results[0].id,id);
 assert.equal(result.data.sources[0].url,getWasionSourceNotes(id)[0].sourceURL);
 for(const quote of getWasionSourceNotes(id)[0].quotes)assert.ok(result.data.answer.includes(quote),quote);
 assert.match(result.data.answer,language==='zh'?/官方资料澄清/:/Official-source clarification/);
 assert.match(result.data.answer,language==='zh'?/请威胜确认/:/Confirm .* with Wasion/);
 if(id===models[0]){
  assert.ok(result.data.answer.includes('Key Features: “Support Android 6.0 and higher versions”'));
  assert.ok(result.data.answer.includes('Main Functions / Compatibility: “Android 5.0 and above”'));
  assert.match(result.data.answer,language==='zh'?/尚不能确认.*最低操作系统/:/do not establish.*minimum OS/);
 }else if(id===models[1]){
  assert.ok(result.data.answer.includes('Key Features / Maximum short circuit current: “Maximum short circuit current: 30kA/2s”'));
  assert.ok(result.data.answer.includes('Technical Parameters / Maximum Fault Current: “20kA/2s”'));
  assert.match(result.data.answer,language==='zh'?/未证明.*同一电流限值/:/does not establish.*same current limit/);
 }else{
  assert.ok(result.data.answer.includes('Product subtitle: “Air Cooling 500kW / 1000kWh”'));
  assert.ok(result.data.answer.includes('DC Specification / Rated Capacity: “1075.2 kWh”'));
  assert.match(result.data.answer,language==='zh'?/未确认.*关系/:/relationship is not confirmed/);
 }
});

test('full trusted source supports clarification even when a query excerpt is shortened or numeric wording suppresses generic ranking',()=>{
 const source=WASION_SOURCES.find(s=>s.id===models[0]);
 const short={...source,excerpt:'HMPM'};
 assert.ok(getWasionQuestionClarification({question:clarificationCases[0][0],sourceCatalog:[short]}));
 const englishCapacity=clarificationCases[4][0];
 assert.equal(retrieveWasionSources(englishCapacity).results.length,0,'Observed connector-plus-number token regression is retained as a fixture boundary, not changed in the general ranker.');
 assert.equal(getWasionQuestionClarification({question:englishCapacity,sourceCatalog:WASION_SOURCES}).source.id,models[2]);
 for(const changed of [{...source,id:'unrelated-source'},{...source,url:'https://unrelated.example/model'},{...source,passages:['Only Android 6.0 is supplied.']}])assert.equal(getWasionQuestionClarification({question:clarificationCases[0][0],sourceCatalog:[changed]}),null);
});

test('model context, different fields, longer model names and multiple subjects cannot steal the clarification branch',()=>{
 for(const question of [
  'Which Android version is required?',
  'Does HMPM2 require Android 5.0?',
  'Does HMPM-Lite require Android 5.0?',
  'What short circuit current does JYL-600 support?',
  'What is the WE CUBE PREMIUM rated capacity?',
  'What is the WE CUBE PREMIUMX rated capacity?',
  'Which communication protocol does the HMPM Android platform support?',
  'What is the JYL-60 load current rating?',
  'What is the JYL-60 operating current rating?',
  'JYL-60 负载电流额定范围是多少？',
  'What is the WE CUBE Air Cooling 500kW / 1000kWh operating temperature?',
  'I110 communication options; HMPM Android requirements are unrelated.',
  'Does I999999 use HMPM Android 6.0?',
  'Compare HMPM Android requirements and WE CUBE capacity.'
 ])assert.equal(getWasionQuestionClarification({question,sourceCatalog:WASION_SOURCES}),null,question);
});

test('ordinary parameters still generate while no-key and unknown-model boundaries retain their actual fallback modes',async()=>{
 for(const question of ['HMPM communication protocols','What is the JYL-60 load current rating?','WE CUBE operating temperature']){
  let calls=0;
  const result=await answerWasionQuestion({question,env:{CRM_AI_API_KEY:'local-fixture'},fetchImpl:async(_url,options)=>{
   calls++;const context=JSON.parse(JSON.parse(options.body).messages[1].content).officialSources;
   return {ok:true,text:async()=>JSON.stringify({choices:[{message:{content:JSON.stringify({answer:'The published model page provides further information. ['+context[0].citation+']',supported:true})}}]})};
  }});
  assert.equal(calls,1,question);assert.equal(result.data.ai.generated,true,question);
 }
 const noKey=await answerWasionQuestion({question:'HMPM communication protocols',env:{}});
 assert.equal(noKey.data.ai.status,'unavailable');assert.equal(noKey.data.ai.reason,'not_configured');
 const clarificationWithoutKey=await answerWasionQuestion({question:clarificationCases[0][0],env:{}});
 assert.equal(clarificationWithoutKey.data.ai.status,'source_clarification');assert.equal(clarificationWithoutKey.data.ai.generated,false);
 const unknown=await answerWasionQuestion({question:'Does I999999 use HMPM Android 6.0?',env:{CRM_AI_API_KEY:'local-fixture'},fetchImpl:async()=>assert.fail('Unknown model must not invoke inference')});
 assert.equal(unknown.data.ai.status,'no_match');assert.deepEqual(unknown.data.results,[]);
});

test('deterministic source clarification still rechecks project revocation and identity before disclosing source text',async()=>{
 for(const mode of ['project-revoked','identity-changed']){
  let sessions=0,projects=0,calls=0;
  const auth={loadSession:async()=>({identity:{role:'admin'},identityId:++sessions===2&&mode==='identity-changed'?'changed':'original'})};
  const service={getProject:async()=>{if(++projects===2&&mode==='project-revoked')throw new BusinessError(404,'Denied');return {id:'fixture'};}};
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=body;}};
  const handler=createWasionSearchHandler({auth,service,env:{},fetchImpl:async()=>{calls++;assert.fail('No inference for source clarification');}});
  await handler({method:'POST',headers:{origin:'https://crm.cnps.ai','x-cnps-crm':'1'},body:{question:clarificationCases[0][0],language:'en'}},res);
  assert.equal(sessions,2);assert.equal(projects,2);assert.equal(calls,0);assert.equal(res.statusCode,404);
  assert.ok(!res.body.includes('Android 5.0'));assert.match(res.headers['Cache-Control'],/no-store/);
 }
});

test('model-overview answers cannot repeat the actually observed unsafe HMPM/JYL wordings as generated facts',async()=>{
 const observed=[
  {question:'HMPM',language:'zh',id:models[0],answer:'HMPM 支持 Android 6.0 及更高版本，同时兼容 Android 5.0 及以上版本。官方页面在“主要功能”中列出支持 Android 6.0 及更高版本，但在“兼容性”中提到支持 Android 5.0 及以上。建议在选择时向 Wasion 确认具体适用的操作系统要求和软件版本差异。[1]'},
  {question:'JYL-60',language:'en',id:models[1],answer:'The JYL-60 fault indicator has a load current rating range of 0A to 630A. It has a maximum short circuit current rating of either 30kA for 2 seconds (as per Key Features) or 20kA for 2 seconds (as per Technical Parameters). Confirmation with Wasion is recommended to clarify which maximum short circuit current rating applies. The operating value range is 2 to 630A [1].'},
  {question:'WE CUBE',language:'en',id:models[2],answer:'WE CUBE has a usable capacity of1000kWh derived from its rated capacity of1075.2kWh. [1]'}
 ];
 // The first two are actual failed UI answer texts, replayed as local provider
 // fixtures under model-only questions. Only [1] is mapped to the actual short
 // citation code. The third is a synthetic capacity-inference regression.
 for(const fixture of observed){
  let calls=0;
  const result=await answerWasionQuestion({question:fixture.question,language:fixture.language,env:{CRM_AI_API_KEY:'local-fixture'},fetchImpl:async(_url,options)=>{
   calls++;const source=JSON.parse(JSON.parse(options.body).messages[1].content).officialSources.find(s=>s.id===fixture.id);assert.ok(source);
   const answer=fixture.answer.replaceAll('[1]','['+source.citation+']');
   return {ok:true,text:async()=>JSON.stringify({choices:[{message:{content:JSON.stringify({answer,supported:true})}}]})};
  }});
  assert.equal(calls,1,'Post-inference clarification must not pretend inference was skipped.');
  assert.equal(result.data.ai.generated,false);
  assert.equal(result.data.ai.generationRequestAttempted,true);
  assert.equal(result.data.ai.reason,'published_field_difference_after_inference');
  assert.equal(result.data.sources[0].id,fixture.id);
  for(const quote of getWasionSourceNotes(fixture.id)[0].quotes)assert.ok(result.data.answer.includes(quote));
  assert.ok(!result.data.answer.includes('同时兼容'));
  assert.ok(!result.data.answer.includes('rating of either'));
  assert.ok(!result.data.answer.includes('usable capacity of1000'));
 }
});

test('post-inference clarification ignores citation ID words, uncited/incidental sources and other model questions',()=>{
 const basic={sourceCatalog:WASION_SOURCES,citedSourceIds:[models[0]],language:'en'};
 assert.equal(getWasionAnswerClarification({...basic,question:'HMPM',answer:'Local serial communication and configurable baud rate are listed. ['+models[0]+']'}),null);
 assert.equal(getWasionAnswerClarification({...basic,question:'I110 communication options',answer:'HMPM supports Android 6.0. ['+models[0]+']'}),null);
 assert.equal(getWasionAnswerClarification({...basic,question:'HMPM',citedSourceIds:['system-software'],answer:'HMPM supports Android 6.0. [system-software]'}),null);
 assert.equal(getWasionAnswerClarification({...basic,question:'HMPM-Lite',answer:'HMPM-Lite supports Android 6.0. ['+models[0]+']'}),null);
 assert.equal(getWasionAnswerClarification({sourceCatalog:WASION_SOURCES,citedSourceIds:[models[1]],question:'JYL-60',answer:'The load current rating is0A to630A. ['+models[1]+']'}),null);
});

test('ordinary generated communication/load/temperature claims stay generated and automatic Chinese clarification follows UI language',async()=>{
 for(const [question,claim]of [
  ['HMPM','HMPM supports local serial communication.'],
  ['JYL-60','JYL-60 has a load current rating of0A to630A.'],
  ['WE CUBE','The cooling method is Air Cooling.']
 ]){
  const result=await answerWasionQuestion({question,env:{CRM_AI_API_KEY:'local-fixture'},fetchImpl:async(_url,options)=>{
   const source=JSON.parse(JSON.parse(options.body).messages[1].content).officialSources[0];
   return {ok:true,text:async()=>JSON.stringify({choices:[{message:{content:JSON.stringify({answer:claim+' ['+source.citation+']',supported:true})}}]})};
  }});
  assert.equal(result.data.ai.generated,true,question);
 }
 const automatic=await answerWasionQuestion({question:clarificationCases[1][0],language:'auto',env:{}});
 assert.equal(automatic.data.language,'zh');assert.match(automatic.data.answer,/官方资料澄清/);
 const explicit=await answerWasionQuestion({question:clarificationCases[1][0],language:'en',env:{}});
 assert.equal(explicit.data.language,'en');assert.match(explicit.data.answer,/Official-source clarification/);
});

test('post-inference source clarification cannot disclose content after project revocation',async()=>{
 let sessions=0,projects=0,calls=0;
 const auth={loadSession:async()=>{sessions++;return {identity:{role:'admin'},identityId:'fixture'};}};
 const service={getProject:async()=>{if(++projects===2)throw new BusinessError(404,'Denied');return {id:'fixture'};}};
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=body;}};
 const handler=createWasionSearchHandler({auth,service,env:{CRM_AI_API_KEY:'local-fixture'},fetchImpl:async(_url,options)=>{
  calls++;const source=JSON.parse(JSON.parse(options.body).messages[1].content).officialSources.find(s=>s.id===models[0]);
  return {ok:true,text:async()=>JSON.stringify({choices:[{message:{content:JSON.stringify({answer:'HMPM supports Android 5.0 and above. ['+source.citation+']',supported:true})}}]})};
 }});
 await handler({method:'POST',headers:{origin:'https://crm.cnps.ai','x-cnps-crm':'1'},body:{question:'HMPM',language:'en'}},res);
 assert.equal(sessions,2);assert.equal(projects,2);assert.equal(calls,1);assert.equal(res.statusCode,404);assert.ok(!res.body.includes('Android'));
});
