import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PRODUCTS} from '../server/wasion-requirements/data.mjs';
import {WASION_SOURCES,retrieveWasionSources,rankRequirementsSearchPages} from '../server/wasion-demo-sources.mjs';
import {answerWasionQuestion} from '../server/wasion-demo.mjs';

// Local deterministic retrieval evidence only. No credentials, provider request,
// mocked model answer, external write or claim of production AI acceptance.
export const AUDIT_QUESTIONS=Object.freeze([
  {id:'model-en',kind:'model',language:'en',question:'What communication options does I110 support?',expectedFirst:'i-110-series-smart-water-meter',expectedEvidence:['LoRaWAN','M-BUS']},
  {id:'model-zh',kind:'model',language:'zh',question:'I110支持哪些通信方式？',expectedFirst:'i-110-series-smart-water-meter',expectedEvidence:['LoRaWAN','M-BUS']},
  {id:'standard-en',kind:'standard',language:'en',question:'Which published sources cover IEC 62052-11?',expectedFirst:'wasion-metering-cabinet-large-power-unit',expectedEvidence:['IEC62052-11']},
  {id:'standard-zh',kind:'standard',language:'zh',question:'有哪些资料提到IEC 62052-11标准？',expectedFirst:'wasion-metering-cabinet-large-power-unit',expectedEvidence:['IEC62052-11']},
  {id:'certification-en',kind:'certification',language:'en',question:'Is DDS102 certified to MID?',expectedFirst:'product-dds102-single-phase-energy-meter',mustNotClaimCertification:true},
  {id:'certification-zh',kind:'certification',language:'zh',question:'DDS102是否有MID认证？',expectedFirst:'product-dds102-single-phase-energy-meter',mustNotClaimCertification:true},
  {id:'solution-en',kind:'solution',language:'en',question:'Which AMI solutions reduce energy loss?',expectedFirst:'energy-loss-reduction-solutions',expectedEvidence:['technical losses','smart meters']},
  {id:'solution-zh',kind:'solution',language:'zh',question:'有哪些降低线损的AMI方案？',expectedFirst:'energy-loss-reduction-solutions',expectedEvidence:['technical losses','smart meters']},
  {id:'resource-en',kind:'resource',language:'en',question:'Where can I download the Wasion Electricity Meters catalogue?',expectedFirst:'resources',expectedDocument:'Electricity Meters'},
  {id:'resource-zh',kind:'resource',language:'zh',question:'威胜电表目录在哪里下载？',expectedFirst:'resources',expectedDocument:'Electricity Meters'},
  {id:'unknown-en',kind:'unknown',language:'en',question:'Does Wasion model I999999 support LoRaWAN?',expectedCount:0},
  {id:'unknown-zh',kind:'unknown',language:'zh',question:'威胜I999999型号支持LoRaWAN吗？',expectedCount:0}
]);
export const CERTIFICATION_CHECKS=Object.freeze([
  {id:'ul-meters-en',question:'Do you have UL certified meters?',expectedCount:0},
  {id:'ul-meters-zh',question:'你们有UL认证的电表吗？',expectedCount:0},
  {id:'ul-listed-meters',question:'UL listed meters',expectedCount:0},
  {id:'ul-approved-meters',question:'UL approved three phase energy meters',expectedCount:0},
  {id:'ul-compliant-meters',question:'UL compliant meters',expectedCount:0},
  {id:'ul-approved-meters-zh',question:'通过UL的三相电表',expectedCount:0},
  {id:'ul-available-meters',question:'Which UL meters are available?',expectedCount:0},
  {id:'ul-safety-meters',question:'UL safety meters',expectedCount:0},
  {id:'atex-unknown',question:'ATEX certification',expectedCount:0},
  {id:'ukca-unknown',question:'UKCA certification',expectedCount:0},
  {id:'ul-storage-en',question:'UL certified energy storage systems',expectedCount:6,expectedEvidence:['UL 9540A']},
  {id:'ul-storage-zh',question:'有哪些UL9540A储能资料？',expectedCount:6,expectedEvidence:['UL 9540A']},
  {id:'ul-specific-model-unknown',question:'Is DDS102 UL certified?',expectedCount:1,expectedFirst:'product-dds102-single-phase-energy-meter',mustNotClaimCertification:true},
  {id:'uplink-data-rate',question:'NB-IoT DL/UL data rate',expectedFirst:'nb-iot-gprs-network-interface-module',expectedEvidence:['DL/UL']}
]);
const project=source=>({id:source.id,title:source.title,url:source.url,href:source.href,score:source.score,excerpt:source.excerpt,downloads:source.downloads});
const verify=(fixture,retrieval)=>(fixture.expectedCount===undefined||retrieval.resultCount===fixture.expectedCount)&&(!fixture.expectedFirst||retrieval.results[0]?.id===fixture.expectedFirst)&&(fixture.expectedEvidence||[]).every(term=>retrieval.results[0]?.excerpt.replace(/\s+/g,'').toLowerCase().includes(term.replace(/\s+/g,'').toLowerCase()))&&(!fixture.expectedDocument||retrieval.results[0]?.downloads.some(document=>document.title===fixture.expectedDocument));

export async function auditWasionModels(){
  const exactModels=PRODUCTS.map(product=>{
    const retrieval=retrieveWasionSources(product.title,{limit:WASION_SOURCES.length});
    const browser=rankRequirementsSearchPages(WASION_SOURCES,product.title);
    return {slug:product.slug,title:product.title,query:product.title,pass:retrieval.results[0]?.id===product.slug&&browser[0]?.id===product.slug,resultCount:retrieval.resultCount,rank:retrieval.results.findIndex(source=>source.id===product.slug)+1,clientFirst:browser[0]?.id||null,results:retrieval.results.map(project)};
  });
  const questions=[];
  for(const fixture of AUDIT_QUESTIONS){
    const retrieval=retrieveWasionSources(fixture.question,{limit:WASION_SOURCES.length});
    const browser=rankRequirementsSearchPages(WASION_SOURCES,fixture.question);
    // An explicitly empty environment exercises the real no-provider fallback.
    const fallback=await answerWasionQuestion({env:{},question:fixture.question,language:'auto'});
    questions.push({...fixture,pass:verify(fixture,retrieval)&&browser[0]?.id===retrieval.results[0]?.id,resultCount:retrieval.resultCount,clientFirst:browser[0]?.id||null,results:retrieval.results.map(project),localFallback:{status:fallback.status,language:fallback.data?.language,answer:fallback.data?.answer,ai:fallback.data?.ai}});
  }
  const certificationChecks=[];
  for(const fixture of CERTIFICATION_CHECKS){
    const retrieval=retrieveWasionSources(fixture.question,{limit:WASION_SOURCES.length}),browser=rankRequirementsSearchPages(WASION_SOURCES,fixture.question),fallback=await answerWasionQuestion({env:{},question:fixture.question,language:'auto'});
    certificationChecks.push({...fixture,pass:verify(fixture,retrieval)&&browser[0]?.id===retrieval.results[0]?.id,resultCount:retrieval.resultCount,clientFirst:browser[0]?.id||null,results:retrieval.results.map(project),localFallback:{status:fallback.status,language:fallback.data?.language,answer:fallback.data?.answer,ai:fallback.data?.ai}});
  }
  return {schemaVersion:1,generatedAt:new Date().toISOString(),environment:'local node deterministic retrieval; provider not configured',scope:'English source pages; English and Chinese questions',sourceCount:WASION_SOURCES.length,modelCount:PRODUCTS.length,modelProviderCalls:0,productionAIValidated:false,certificationBoundary:'Published model statements are search evidence; a standards reference or company certificate does not establish model-specific certification.',summary:{exactModels:{passed:exactModels.filter(item=>item.pass).length,total:exactModels.length},questions:{passed:questions.filter(item=>item.pass).length,total:questions.length},certificationChecks:{passed:certificationChecks.filter(item=>item.pass).length,total:certificationChecks.length}},exactModels,questions,certificationChecks};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),index=args.indexOf('--output');
  if(args.length&&(args.length!==2||args[0]!=='--output'||!args[1]))throw new Error('Usage: node scripts/audit-wasion-models.mjs [--output path.json]');
  const report=await auditWasionModels();
  if(index>=0){const destination=resolve(args[index+1]);await mkdir(dirname(destination),{recursive:true});await writeFile(destination,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:destination,...report.summary,environment:report.environment,productionAIValidated:false}));}
  else console.log(JSON.stringify(report,null,2));
  if(Object.values(report.summary).some(group=>group.passed!==group.total))process.exitCode=1;
}
