import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Script,runInNewContext} from 'node:vm';
import {PRODUCTS} from '../server/wasion-requirements/data.mjs';
import {WASION_SOURCES,retrieveWasionSources,rankRequirementsSearchPages} from '../server/wasion-demo-sources.mjs';
import {answerWasionQuestion} from '../server/wasion-demo.mjs';
import {wasionDemoPage,WASION_PAGES,WASION_LEGACY_ROUTES} from '../server/wasion-demo-page.mjs';
import {SEARCH_CLIENT,rankSearchPages} from '../server/wasion-experience/search.mjs';
import {AUDIT_QUESTIONS} from '../scripts/audit-wasion-models.mjs';

const stripScripts=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
const embedded=html=>JSON.parse(html.match(/const WASION_DATA=([\s\S]*?);const SEARCH_QUERY=/)[1]);
const sourceById=new Map(WASION_SOURCES.map(source=>[source.id,source]));

test('all 86 exact official product titles rank first in backend, embedded browser fallback and server-rendered search',()=>{
  assert.equal(PRODUCTS.length,86);
  const base=wasionDemoPage('search-fixture',{slug:'search'}),catalog=embedded(base);
  assert.equal(catalog.length,122);
  assert.ok(base.includes('const rank='+rankRequirementsSearchPages.toString()+';'));
  const context={};runInNewContext('const rank='+rankRequirementsSearchPages.toString()+';globalThis.ranker=rank;',context);
  for(const product of PRODUCTS){
    const backend=retrieveWasionSources(product.title,{limit:122});
    const browser=context.ranker(catalog,product.title);
    assert.equal(backend.results[0]?.id,product.slug,product.title+' backend');
    assert.equal(browser[0]?.id,product.slug,product.title+' browser');
    const html=wasionDemoPage('search-fixture',{slug:'search',query:product.title});
    assert.ok(stripScripts(html).includes('href="/demo/wasion/'+product.slug+'"'),product.title+' rendered destination');
    for(const source of backend.results){assert.equal(source.url,sourceById.get(source.id)?.url);assert.equal(new URL(source.url).origin,'https://en.wasion.com');}
  }
});

for(const fixture of AUDIT_QUESTIONS)test('local retrieval evidence / '+fixture.id+' / '+fixture.question,async()=>{
  const retrieval=retrieveWasionSources(fixture.question,{limit:122});
  const browser=rankRequirementsSearchPages(embedded(wasionDemoPage('search-fixture',{slug:'search'})),fixture.question);
  assert.equal(browser[0]?.id,retrieval.results[0]?.id,'same browser and server intent');
  if(fixture.expectedCount===0)assert.equal(retrieval.resultCount,0);
  else {
    assert.equal(retrieval.results[0]?.id,fixture.expectedFirst);
    for(const term of fixture.expectedEvidence||[])assert.ok(retrieval.results[0].excerpt.replace(/\s+/g,'').toLowerCase().includes(term.replace(/\s+/g,'').toLowerCase()),term+' real excerpt');
    if(fixture.expectedDocument){const document=retrieval.results[0].downloads.find(document=>document.title===fixture.expectedDocument);assert.ok(document);assert.match(document.url,/Electricity Meters Catalog 2023\.pdf$/);}
    const html=stripScripts(wasionDemoPage('search-fixture',{slug:'search',query:fixture.question}));
    assert.ok(html.includes('href="/demo/wasion/'+fixture.expectedFirst+'"'));
  }
  const fallback=await answerWasionQuestion({env:{},question:fixture.question,language:'auto'});
  assert.equal(fallback.status,200);
  assert.equal(fallback.data.language,fixture.language);
  assert.equal(fallback.data.ai.generated,false,'local deterministic fallback is not production AI validation');
  assert.equal(fallback.data.ai.status,fixture.expectedCount===0?'no_match':fixture.expectedFirst==='i-110-series-smart-water-meter'?'source_clarification':'unavailable');
  if(fixture.mustNotClaimCertification){
    assert.equal(retrieval.results[0].id,'product-dds102-single-phase-energy-meter');
    assert.doesNotMatch(retrieval.results[0].excerpt,/\bMID\b|certified|certificate/i,'the actual DDS102 source does not establish MID certification');
    assert.doesNotMatch(fallback.data.answer,/MID certified|通过.*MID|已获.*MID|具有.*MID/i);
  }
});

test('known and unknown model boundaries separate J6/J7, I110/I1100 and LXC/LXC-D without swallowing a model suffix',()=>{
  for(const [query,wanted,excluded]of [
    ['DDSD101-J6','product-ddsd101-j6','product-ddsd101-j7'],
    ['DDSD101-J7','product-ddsd101-j7','product-ddsd101-j6'],
    ['aMeter100-GT','ameter100-gt-single-phase-smart-meter','ameter100-kt-single-phase-smart-meter'],
    ['aMeter300 (CTVT)','ameter300-ctvt-three-phase-smart-energy-meter','product-ameter300-ct-three-phase-smart-energy-meter'],
    ['Libra 3','libra-3c-multi-function-energy-meter','libra-1c-single-phase-energy-meter'],
    ['LXC','lxc-ultrasonic-water-meter','lxc-d-ultrasonic-bulk-water-meter'],
    ['LXC支持哪些通信方式？','lxc-ultrasonic-water-meter','lxc-d-ultrasonic-bulk-water-meter'],
    ['LXC-D communication parameters','lxc-d-ultrasonic-bulk-water-meter','lxc-ultrasonic-water-meter'],
    ['Libra 3 ANSI parameters','libra-3c-multi-function-energy-meter','libra-1c-single-phase-energy-meter']
  ]){
    const result=retrieveWasionSources(query,{limit:122});
    assert.equal(result.results[0]?.id,wanted,query);
    assert.notEqual(result.results[0]?.id,excluded);
    if(/J[67]|-GT/.test(query))assert.ok(!result.results.some(source=>source.id===excluded),query+' excludes another model suffix');
  }
  for(const query of ['I1100','I999999','DDSD101-J699','aMeter300-GT999','aMeter300 and IEC99999','威胜I999999型号支持LoRaWAN吗？']){
    assert.equal(retrieveWasionSources(query).resultCount,0,query);
    assert.equal(rankRequirementsSearchPages(WASION_SOURCES,query).length,0,query+' browser');
  }
});

test('Chinese protocol constraints use actual source text rather than returning a model with an unrelated phase feature',()=>{
  const result=retrieveWasionSources('需要支持STS的单相预付费电表',{limit:122});
  assert.ok(result.results.length>0);
  for(const source of result.results)assert.match(sourceById.get(source.id).searchText,/\bSTS\b/i,source.id);
  assert.ok(!result.results.some(source=>source.id==='product-dds102-single-phase-energy-meter'));
});

test('UL meter certification questions do not substitute uplink data rates, company ISO or storage certificates',async()=>{
  const catalog=embedded(wasionDemoPage('search-fixture',{slug:'search'}));
  for(const question of ['Do you have UL certified meters?','你们有UL认证的电表吗？','UL listed meters','UL approved three phase energy meters','UL compliant meters','通过UL的三相电表','符合UL要求的电表','Which UL meters are available?','UL safety meters','ATEX certification','UKCA certification','XYZQ certification']){
    const result=retrieveWasionSources(question,{limit:122});
    assert.equal(result.resultCount,0,question);
    assert.deepEqual(result.results,[]);
    assert.equal(rankRequirementsSearchPages(catalog,question).length,0,'same evidence and product scope in browser');
    const response=await answerWasionQuestion({env:{},question,language:'auto'});
    assert.equal(response.data.ai.generated,false);
    assert.equal(response.data.ai.status,'no_match');
    assert.equal(response.data.ai.reason,'no_relevant_source');
    assert.deepEqual(response.data.sources,[]);
    assert.match(response.data.answer,/No matching information|未找到相关资料/);
  }
  const module=sourceById.get('nb-iot-gprs-network-interface-module');
  assert.match(module.excerpt,/DL\/UL/,'actual modem uplink field reproduced');
  assert.equal(rankRequirementsSearchPages([module],'UL certified products').length,0);
  const standardUplink={...module,passages:['Standard data rate: 125 Kbps / 150 Kbps (DL/UL)'],searchText:'Standard data rate: 125 Kbps / 150 Kbps (DL/UL)',excerpt:'Standard data rate: 125 Kbps / 150 Kbps (DL/UL)'};
  assert.equal(rankRequirementsSearchPages([standardUplink],'UL certified products').length,0,'the word standard does not turn uplink into certification');
  assert.equal(retrieveWasionSources('NB-IoT DL/UL data rate').results[0].id,module.id,'ordinary data-rate lookup remains usable');
});

test('UL storage sources remain discoverable while an exact meter without UL evidence remains an unknown model-specific enquiry',async()=>{
  const catalog=embedded(wasionDemoPage('search-fixture',{slug:'search'}));
  for(const question of ['UL certified energy storage systems','有哪些UL9540A储能资料？']){
    const result=retrieveWasionSources(question,{limit:122});
    assert.equal(result.resultCount,6,question);
    assert.deepEqual(rankRequirementsSearchPages(catalog,question).map(source=>source.id),result.results.map(source=>source.id));
    for(const source of result.results){
      assert.match(source.id,/product-we-(?:mobile|farm|node|cube)/);
      assert.match(source.excerpt,/Certificates: UL\s*9540A/i,'actual published product statement, with certificate scope still requiring verification');
      assert.ok(!['resources','nb-iot-gprs-network-interface-module'].includes(source.id));
    }
  }
  for(const question of ['Is DDS102 UL certified?','DDS102有UL认证吗？']){
    const result=retrieveWasionSources(question,{limit:122});
    assert.equal(result.resultCount,1);
    assert.equal(result.results[0].id,'product-dds102-single-phase-energy-meter');
    assert.doesNotMatch(result.results[0].excerpt,/\bUL\s*(?:\d|certif|listed)/i,'no UL evidence is manufactured');
    const fallback=await answerWasionQuestion({env:{},question,language:'auto'});
    assert.equal(fallback.data.ai.generated,false);
    assert.doesNotMatch(fallback.data.answer,/UL certified|通过.*UL|已获.*UL|具有.*UL/i);
  }
});

test('requirements-only ranking preserves the original browser client and legacy 65-source route isolation',()=>{
  assert.equal(createHash('sha256').update(SEARCH_CLIENT).digest('hex'),'7e8bd3bf61007b83ea5194a94032eb3fbbfa6ef36eaae443a136dd8967a5ee41');
  assert.equal(WASION_PAGES.length,64);
  for(const style of ['classic','atmospheric','planhat','orderful','industrial']){
    const html=wasionDemoPage('search-fixture',{style,slug:'search',query:'DDS102'}),catalog=embedded(html);
    assert.equal(catalog.length,65,style);
    assert.ok(html.includes('const rank='+rankSearchPages.toString()+';'),style+' unchanged browser algorithm');
    assert.ok(!html.includes('const rank='+rankRequirementsSearchPages.toString()+';'));
    assert.ok(!stripScripts(html).includes('/product-dds102-single-phase-energy-meter'),style+' no unresolved new-model path');
    for(const source of catalog)assert.ok(WASION_LEGACY_ROUTES.includes(source.id));
  }
  for(const query of ['I110','aMeter300','Prepayment solutions','DTECH Aventa AMI 2.0']){
    const result=retrieveWasionSources(query,{legacy:true,limit:122});
    assert.ok(result.results.length>0);
    for(const source of result.results)assert.equal(source.url,sourceById.get(source.id).url);
  }
});

test('embedded improved search remains nonce-scoped and parses when the question includes a script terminator',()=>{
  const html=wasionDemoPage('search-fixture',{slug:'search',query:'有哪些降低线损的AMI方案？ </script><script>alert(1)</script>'});
  assert.ok(!html.includes('<script>alert(1)</script>'));
  for(const [,attributes,script]of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
    assert.match(attributes,/nonce="search-fixture"/);
    if(!attributes.includes('application/ld+json'))assert.doesNotThrow(()=>new Script(script));
  }
});
