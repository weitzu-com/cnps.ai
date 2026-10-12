import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import fs from 'node:fs';
import {createCrmInquiryHandler, inquiryHubSpotPayload, normalizeInquiry} from '../server/crm-inquiry-handler.mjs';
import {createInquiryStore} from '../server/crm-inquiry-store.mjs';
import {crmInquiryConsent, crmInquiryConsentVersion, submitCrmInquiry} from '../web/crm-inquiry.mjs';
import {ui} from '../web/ui.mjs';

const config={portalId:'123456',formId:'12345678-1234-1234-1234-123456789abc',fields:{name:'firstname',email:'email',company:'company',region:'country',message:'message',subject:'subject'}};
const body={values:{name:'Synthetic contact',email:'contact@example.test',phone:'+1 202 555 0100',company:'Synthetic manufacturer',region:'United States',workflow:'knowledge-assistants',need:'Find approved technical product documentation.',systems:'Existing document store',consent:true},tracking:{utm_source:'organic',content:'inquiry-form'},context:{pageUri:'https://www.cnps.ai/en/request-quote?utm_source=organic',pageName:'Request quotation'},locale:'en',kind:'general',consentVersion:crmInquiryConsentVersion};
function harness(){
 let time=Date.UTC(2026,9,13),nativeCalls=0,forwards=0,nativeFail=false,forwardFail='';
 const env={CNPS_PROPOSAL_SECRET:randomBytes(32).toString('hex')},records=new Map(),counts=new Map(),createdCompanies=new Map(),createdContacts=new Map(),seen=[],payloads=[];
 const store={
  async claim(id,owner,initial,now){let record=records.get(id);if(record?.phase==='complete')return{kind:'complete',record:structuredClone(record)};if(record&&(['hubspot-sending','uncertain'].includes(record.phase)||record.leaseUntil>now))return{kind:'pending',record:structuredClone(record)};record=record||structuredClone(initial);record.owner=owner;record.leaseUntil=now+120000;records.set(id,record);return{kind:'owned',record:structuredClone(record)};},
  async advance(id,owner,from,to,now,release=false){const record=records.get(id);if(!record||record.owner!==owner||record.phase!==from)return false;record.phase=to;record.updatedAt=now;record.leaseUntil=release?now:now+120000;return true;},
  async reserve(limits){for(const item of limits){const entry=counts.get(item.name);if(entry?.expires>time&&entry.count>=item.max)return false;}for(const item of limits){let entry=counts.get(item.name);if(!entry||entry.expires<=time)entry={count:0,expires:time+item.ttl*1000};entry.count++;counts.set(item.name,entry);}return true;}
 };
 const native={async upsertInquiryLead(input){nativeCalls++;seen.push(input);createdCompanies.set(input.companyId,{id:input.companyId,name:'待核验 · '+input.companyName});if(nativeFail)throw Error('private CRM diagnostics');createdContacts.set(input.contactId,{id:input.contactId,companyId:input.companyId,email:input.email,name:input.name,phone:input.phone});return{companyId:input.companyId,contactId:input.contactId};}};
 const handler=createCrmInquiryHandler({env,config,storeFactory:()=>store,getNative:async()=>native,now:()=>time,forward:async payload=>{forwards++;payloads.push(payload);if(forwardFail)throw Error(forwardFail);}});
 async function request(input=body,{method='POST',origin='https://www.cnps.ai',extra={},url='/api/crm-inquiry'}={}){const headers={};let output;const res={setHeader(k,v){headers[k.toLowerCase()]=v;},end(v){output=v;}};await handler({url,method,body:input,headers:{origin,'content-type':'application/json','x-cnps-crm':'1','x-real-ip':'192.0.2.1',...extra}},res);return{status:res.statusCode,headers,text:String(output||''),json(){return JSON.parse(output);}};}
 return{request,env,store,records,counts,createdCompanies,createdContacts,seen,payloads,nativeCalls:()=>nativeCalls,forwards:()=>forwards,nativeFailure:value=>nativeFail=value,forwardFailure:value=>forwardFail=value,advance:ms=>time+=ms};
}

test('valid inquiry creates an isolated lead and retains all existing HubSpot fields, phone, tracking and processing consent',async()=>{
 const h=harness(),r=await h.request();assert.equal(r.status,200);assert.deepEqual(r.json(),{ok:true,submitted:true});
 assert.equal(h.createdCompanies.size,1);assert.equal(h.createdContacts.size,1);assert.equal(h.forwards(),1);
 const lead=h.seen[0];assert.match(lead.companyId,/^[a-f0-9-]{36}$/);assert.notEqual(lead.companyId,lead.contactId);assert.equal(lead.phone,'+12025550100');assert.ok([...h.createdCompanies.values()][0].name.startsWith('待核验 · '));
 const p=h.payloads[0],fields=Object.fromEntries(p.fields.map(row=>[row.name,row.value]));assert.deepEqual(Object.keys(fields).sort(),['company','country','email','firstname','message','subject']);
 for(const value of [body.values.name,body.values.email,lead.phone,body.values.need,body.values.systems,'utm_source: organic'])assert.ok(fields.message.includes(value));
 assert.equal(p.legalConsentOptions.consent.text,crmInquiryConsent.en);assert.deepEqual(p.legalConsentOptions.consent.communications,[]);
 const saved=JSON.stringify([...h.records.values()]);assert.ok(!saved.includes(body.values.email));assert.ok(!saved.includes(body.values.phone));assert.ok(!r.text.includes(lead.companyId));assert.match(r.headers['cache-control'],/no-store/);
});

test('repeat and concurrent identical requests are atomically deduplicated',async()=>{
 const h=harness(),responses=await Promise.all(Array.from({length:8},()=>h.request()));assert.equal(responses.filter(r=>r.status===200).length,1);assert.equal(responses.filter(r=>r.status===202).length,7);assert.equal(h.nativeCalls(),1);assert.equal(h.forwards(),1);assert.equal((await h.request()).status,200);assert.equal(h.nativeCalls(),1);assert.equal(h.forwards(),1);
});

test('same email domain never joins an existing company or merges unrelated people into one tenant',async()=>{
 const h=harness();await h.request();await h.request({...body,values:{...body.values,email:'another@example.test'}});assert.equal(h.createdCompanies.size,2);assert.notEqual(h.seen[0].companyId,h.seen[1].companyId);assert.equal(h.seen.some(input=>Object.hasOwn(input,'domain')),false);
 assert.ok(!JSON.stringify([...h.records.values()]).includes('memberGrants'));assert.ok(!JSON.stringify([...h.records.values()]).includes('registeredAt'));
});

test('changed requirement keeps deterministic native lead IDs without creating another contact',async()=>{
 const h=harness();await h.request();await h.request({...body,values:{...body.values,need:'A different detailed project requirement.'}});assert.equal(h.createdCompanies.size,1);assert.equal(h.createdContacts.size,1);assert.equal(h.forwards(),2);assert.equal(h.seen[0].companyId,h.seen[1].companyId);assert.equal(h.seen[0].contactId,h.seen[1].contactId);
});

test('partial native failure is safely retried with the same fixed IDs before HubSpot is attempted',async()=>{
 const h=harness();h.nativeFailure(true);assert.equal((await h.request()).status,503);assert.equal(h.createdCompanies.size,1);assert.equal(h.createdContacts.size,0);assert.equal(h.forwards(),0);h.nativeFailure(false);assert.equal((await h.request()).status,200);assert.equal(h.createdCompanies.size,1);assert.equal(h.createdContacts.size,1);assert.equal(h.seen[0].companyId,h.seen[1].companyId);
});

test('ambiguous HubSpot timeout is pending and never automatically re-sent, including after lease expiry',async()=>{
 const h=harness();h.forwardFailure('timeout');assert.deepEqual((await h.request()).json(),{ok:true,pending:true});assert.equal([...h.records.values()][0].phase,'uncertain');h.advance(180000);h.forwardFailure('');assert.equal((await h.request()).status,202);assert.equal(h.forwards(),1);assert.equal(h.createdContacts.size,1);
});

test('definite HubSpot rejection can retry delivery without re-creating native records',async()=>{
 const h=harness();h.forwardFailure('hubspot-400');assert.equal((await h.request()).status,503);h.forwardFailure('');assert.equal((await h.request()).status,200);assert.equal(h.nativeCalls(),1);assert.equal(h.forwards(),2);
});

test('missing consent, role/tenant injection, malformed fields, unknown origins and invalid page context never create or forward',async()=>{
 const h=harness();const cases=[{...body,values:{...body.values,consent:false}},{...body,consentVersion:'old'},{...body,values:{...body.values,companyId:'company-real'}},{...body,values:{...body.values,email:'not-an-email'}},{...body,values:{...body.values,phone:'<script>'}},{...body,context:{...body.context,pageUri:'https://evil.example/en/contact'}},{...body,context:{...body.context,pageUri:'https://www.cnps.ai/admin'}}];for(const item of cases)assert.equal((await h.request(item)).status,400);assert.equal((await h.request(body,{origin:'https://evil.example'})).status,403);assert.equal((await h.request(body,{extra:{'x-cnps-crm':''}})).status,403);assert.equal(h.nativeCalls(),0);assert.equal(h.forwards(),0);
});

test('server quota blocks provider and native calls atomically and repeats cannot bypass request limits',async()=>{
 const h=harness();for(let n=0;n<3;n++)assert.equal((await h.request({...body,values:{...body.values,need:body.values.need+' '+n}})).status,200);assert.equal((await h.request({...body,values:{...body.values,need:body.values.need+' fourth'}})).status,429);assert.equal(h.forwards(),3);
 const h2=harness();await h2.request();for(let n=0;n<29;n++)await h2.request();assert.equal((await h2.request()).status,429);assert.equal(h2.forwards(),1);
});

test('all currently published inquiry workflow options are accepted, with no new HubSpot form property',()=>{
 const catalog=JSON.parse(fs.readFileSync(new URL('../content/i18n/catalog.json',import.meta.url),'utf8'));
 for(const item of catalog.en.solutions)assert.doesNotThrow(()=>normalizeInquiry({...body,values:{...body.values,workflow:item.slug}},new Set(['https://www.cnps.ai'])));
 assert.doesNotThrow(()=>normalizeInquiry({...body,values:{...body.values,phone:''}},new Set(['https://www.cnps.ai'])));
 const p=inquiryHubSpotPayload(normalizeInquiry(body,new Set(['https://www.cnps.ai'])),config);assert.equal(p.fields.some(row=>row.name==='phone'),false);
 for(const locale of ['en','zh','ar'])assert.equal(ui(locale).consent,crmInquiryConsent[locale]);
});

test('public endpoint supports POST only and exposes no lookup or upstream exception text',async()=>{
 const h=harness();assert.equal((await h.request(body,{method:'GET'})).status,405);assert.equal((await h.request(body,{url:'/api/crm-inquiry/status'})).status,404);assert.equal((await h.request('{')).status,400);assert.equal((await h.request({...body,extra:'x'.repeat(17000)})).status,400);h.nativeFailure(true);const r=await h.request();assert.equal(r.status,503);assert.ok(!r.text.includes('diagnostics'));assert.ok(!r.text.includes(body.values.email));
});

test('browser submits to same-origin intake with consent version, and pending response is not reported as fully delivered',async()=>{
 let request;const result=await submitCrmInquiry(body.values,body.tracking,body.context,{locale:body.locale,kind:body.kind,fetchImpl:async(url,options)=>{request={url,options};return{ok:true,async json(){return{ok:true,pending:true};}};}});assert.equal(request.url,'/api/crm-inquiry');assert.equal(request.options.credentials,'same-origin');assert.equal(request.options.headers['X-CNPS-CRM'],'1');assert.equal(JSON.parse(request.options.body).consentVersion,crmInquiryConsentVersion);assert.deepEqual(result,{submitted:false,pending:true});
});

test('Redis adapter uses atomic Lua claims/transitions and a namespace independent of login quotas',async()=>{
 const calls=[],redis={async eval(script,keys,args){calls.push({script,keys,args});if(script.includes("kind='owned'"))return JSON.stringify({kind:'owned',record:{phase:'crm-pending'}});return 1;}};
 const store=createInquiryStore({}, {redis});assert.equal((await store.claim('opaque','owner',{phase:'crm-pending',envelope:'encrypted'},0)).kind,'owned');assert.equal(await store.advance('opaque','owner','crm-pending','hubspot-ready',1),true);assert.equal(await store.reserve([{name:'global-day',max:50,ttl:86400}]),true);assert.ok(calls.every(call=>call.keys.every(key=>key.startsWith('cnps:crm:inquiry:v1:'))));assert.match(calls[0].script,/hubspot-sending/);assert.match(calls[1].script,/record.owner~=ARGV\[1\]/);assert.match(calls[2].script,/redis.call\('INCR'/);
});
