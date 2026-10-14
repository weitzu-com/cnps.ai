import test from 'node:test';
import assert from 'node:assert/strict';
import {createVolcDeliverySms,DELIVERY_SMS_TEXT,signVolcSms} from '../server/crm-volc-sms.mjs';
import {SMS_GLOBAL_DAILY_LIMIT,SMS_GLOBAL_MONTHLY_LIMIT,SMS_PHONE_DAILY_LIMIT} from '../server/sms-policy.mjs';
import {digest} from '../server/proposal-crypto.mjs';
const env={CRM_VOLC_SMS_ENABLED:'true',CRM_VOLC_SMS_ACCESS_KEY:'synthetic',CRM_VOLC_SMS_SECRET_KEY:'test-secret',CRM_VOLC_SMS_SUB_ACCOUNT:'test-group',CRM_VOLC_SMS_SIGN:'测试签名',CRM_VOLC_SMS_TEMPLATE_ID:'test-template',CNPS_PROPOSAL_SECRET:'0123456789abcdef'.repeat(4),CRM_VOLC_SMS_APPROVED_TEXT:DELIVERY_SMS_TEXT};
const phone='18700001111';const record={provider:'volcengine',providerId:'message-one',subAccount:'test-group',signature:'测试签名',templateId:'test-template'};
const response=Result=>({ok:true,json:async()=>({Result})});
test('Volc channel requires explicit approval activation and exact fixed text',()=>{assert.equal(createVolcDeliverySms({...env,CRM_VOLC_SMS_ENABLED:'false'}).configured,false);assert.equal(createVolcDeliverySms({...env,CRM_VOLC_SMS_APPROVED_TEXT:'changed'}).configured,false);});
test('Volc signed requests restrict destination and actions',()=>{const r=signVolcSms(env,'SendSmsForAgent',{Mobiles:phone},Date.UTC(2026,9,13));assert.equal(new URL(r.url).hostname,'sms.volcengineapi.com');assert.match(r.headers.authorization,/20261013\/cn-beijing\/volcsms\/request/);assert.throws(()=>signVolcSms(env,'CreateAccessKey',{}));});
test('Volc send reserves segment quota before single IO, accepts only one provider ID',async()=>{let calls=0,quota;const sms=createVolcDeliverySms(env,{redis:{eval:async(...args)=>{quota=args;return 1;}},fetchImpl:async(url,opts)=>{calls++;assert.equal(opts.redirect,'error');const p=JSON.parse(opts.body);assert.equal(p.Mobiles,phone);assert.equal(p.TemplateParam,undefined);return response({MessageId:['message-one']});}});assert.equal((await sms.send(phone)).status,'submitted');assert.equal(calls,1);assert.equal(quota[2][0],SMS_GLOBAL_MONTHLY_LIMIT);assert.equal(quota[2][1],1);assert.equal(quota[2][3],SMS_GLOBAL_DAILY_LIMIT);assert.equal(quota[2][6],SMS_PHONE_DAILY_LIMIT);assert.match(quota[1][0],/^cnps:crm:volc-sms:v1:month:/);});
test('Volc quota exhaustion and invalid target produce no IO; ambiguous IO is not retried',async()=>{let calls=0;const fetchImpl=async()=>{calls++;throw Error('timeout');};const blocked=createVolcDeliverySms(env,{redis:{eval:async()=>0},fetchImpl});assert.equal((await blocked.send(phone)).reason,'monthly_limit');await blocked.send('invalid');assert.equal(calls,0);const sms=createVolcDeliverySms(env,{redis:{eval:async()=>1},fetchImpl});await assert.rejects(sms.send(phone));assert.equal(calls,1);});

function quotaHarness({settings=env,time=Date.UTC(2026,9,14),preload={},transportFails=false}={}) {
 const prefix='cnps:crm:volc-sms:v1:',pid=digest(settings.CNPS_PROPOSAL_SECRET,'phone',phone);
 const counters=new Map(),requests=[];let calls=0;
 const date=()=>new Date(time+8*3600000).toISOString();
 const names=()=>({month:'month:'+date().slice(0,7),day:'day:'+date().slice(0,10),phoneDay:'phone-day:'+date().slice(0,10)+':'+pid,cooldown:'cooldown:'+pid});
 for(const [kind,count] of Object.entries(preload)) counters.set(prefix+names()[kind],{count,expires:time+32*86400000});
 const redis={async eval(script,keys,args){
  requests.push({script,keys,args});
  const entries=keys.map((key,i)=>({key,max:args[i*3],amount:args[i*3+1],ttl:args[i*3+2],current:counters.get(key)}));
  const count=entry=>entry.current?.expires>time?entry.current.count:0;
  if(entries.some(entry=>count(entry)+entry.amount>entry.max))return 0;
  for(const entry of entries)counters.set(entry.key,{count:count(entry)+entry.amount,expires:entry.current?.expires>time?entry.current.expires:time+entry.ttl*1000});
  return 1;
 }};
 const sms=createVolcDeliverySms(settings,{redis,now:()=>time,fetchImpl:async()=>{calls++;if(transportFails)throw Error('timeout');return response({MessageId:['message-'+calls]});}});
 return {sms,counters,requests,calls:()=>calls,advance:ms=>time+=ms,count:kind=>counters.get(prefix+names()[kind])?.count||0,snapshot:()=>structuredClone([...counters].filter(([,entry])=>entry.expires>time))};
}

test('existing old global and phone ceilings permit another notification under the new policy',async()=>{
 const h=quotaHarness({preload:{day:20,month:100,phoneDay:5}});
 assert.equal((await h.sms.send(phone)).status,'submitted');
 assert.equal(h.count('day'),21);assert.equal(h.count('month'),101);assert.equal(h.count('phoneDay'),6);
 assert.equal(h.calls(),1);
 assert.ok(h.requests[0].keys.every(key=>key.startsWith('cnps:crm:volc-sms:v1:')));
});

test('global ceilings account for billed segments and deny before IO without consuming other budgets',async()=>{
 const settings={...env,CRM_VOLC_SMS_SIGN:'测试签名'.repeat(10)};
 for(const [kind,cap] of [['day',SMS_GLOBAL_DAILY_LIMIT],['month',SMS_GLOBAL_MONTHLY_LIMIT]]){
  const h=quotaHarness({settings,preload:{[kind]:cap-2}});
  assert.equal(h.sms.segments,2);
  assert.equal((await h.sms.send(phone)).status,'submitted');
  assert.equal(h.count(kind),cap);
  assert.equal(h.count('phoneDay'),1);
  h.advance(61000);
  const before=h.snapshot();
  assert.equal((await h.sms.send(phone)).status,'failed');
  assert.deepEqual(h.snapshot(),before);assert.equal(h.calls(),1);
  const overflow=quotaHarness({settings,preload:{[kind]:cap-1}});
  const overflowBefore=overflow.snapshot();
  assert.equal((await overflow.sms.send(phone)).status,'failed');
  assert.deepEqual(overflow.snapshot(),overflowBefore);assert.equal(overflow.calls(),0);
 }
});

test('phone allowance remains twenty notifications and the sixty-second cooldown remains enforced',async()=>{
 const h=quotaHarness({preload:{phoneDay:SMS_PHONE_DAILY_LIMIT-1}});
 assert.equal((await h.sms.send(phone)).status,'submitted');
 assert.equal(h.count('phoneDay'),SMS_PHONE_DAILY_LIMIT);
 const before=h.snapshot();
 assert.equal((await h.sms.send(phone)).status,'failed');
 assert.deepEqual(h.snapshot(),before);assert.equal(h.calls(),1);
 h.advance(61000);
 assert.equal((await h.sms.send(phone)).status,'failed');assert.equal(h.calls(),1);
 const cooldown=quotaHarness();
 await cooldown.sms.send(phone);
 assert.equal((await cooldown.sms.send(phone)).status,'failed');assert.equal(cooldown.calls(),1);
 cooldown.advance(60000);
 assert.equal((await cooldown.sms.send(phone)).status,'submitted');assert.equal(cooldown.calls(),2);
});

test('Volc day and month keys change at China midnight while old counters retain their accounting',async()=>{
 const h=quotaHarness({time:Date.UTC(2026,9,31,15,59)});
 await h.sms.send(phone);
 assert.match(h.requests[0].keys[0],/:month:2026-10$/);
 assert.match(h.requests[0].keys[1],/:day:2026-10-31$/);
 h.advance(61000);
 assert.equal((await h.sms.send(phone)).status,'submitted');
 assert.match(h.requests[1].keys[0],/:month:2026-11$/);
 assert.match(h.requests[1].keys[1],/:day:2026-11-01$/);
 assert.equal(h.counters.get(h.requests[0].keys[0]).count,1);
 assert.equal(h.counters.get(h.requests[0].keys[1]).count,1);
 assert.equal(h.count('month'),1);assert.equal(h.count('day'),1);assert.equal(h.count('phoneDay'),1);
});

test('ambiguous provider IO retains segment reservations and never retries or refunds',async()=>{
 const h=quotaHarness({settings:{...env,CRM_VOLC_SMS_SIGN:'测试签名'.repeat(10)},transportFails:true});
 await assert.rejects(h.sms.send(phone),/timeout/);
 assert.equal(h.calls(),1);assert.equal(h.requests.length,1);
 assert.equal(h.count('day'),2);assert.equal(h.count('month'),2);assert.equal(h.count('phoneDay'),1);
 const before=h.snapshot();
 assert.equal((await h.sms.send(phone)).status,'failed');
 assert.deepEqual(h.snapshot(),before);assert.equal(h.calls(),1);
});
test('Volc receipt rejects other person/message/template and pending receipt',async()=>{const valid={MessageId:'message-one',Mobile:phone,SubAccount:'test-group',Signature:'测试签名',TemplateId:'test-template',ChannelType:'CN_NTC',ReceiptTime:1791849600,ErrorCode:'0',Count:1};for(const changed of [{Mobile:'18700002222'},{MessageId:'other'},{TemplateId:'other'},{ReceiptTime:0},{ErrorCode:''}]){const sms=createVolcDeliverySms(env,{fetchImpl:async()=>response({Total:1,List:[{...valid,...changed}]})});assert.equal((await sms.receipt({target:phone,record})).status,'submitted');}const sms=createVolcDeliverySms(env,{fetchImpl:async()=>response({Total:1,List:[valid]})});const result=await sms.receipt({target:phone,record});assert.equal(result.status,'delivered');assert.equal(result.receiptAt,1791849600000);});
test('live masked phone and omitted subaccount are accepted only with exact query filters and message ID',async()=>{const sms=createVolcDeliverySms(env,{now:()=>1791885000000,fetchImpl:async(url,opts)=>{const q=JSON.parse(opts.body);assert.equal(q.Mobile,phone);assert.equal(q.MessageId,record.providerId);assert.equal(q.SubAccount,record.subAccount);assert.ok(q.FromTime>0&&q.ToTime>q.FromTime);return response({Total:1,List:[{MessageId:record.providerId,Mobile:'187****1111',SubAccount:'',TemplateId:record.templateId,Signature:record.signature,ChannelType:'CN_NTC',ErrorCode:'SY:0500',ReceiptTime:0}]});}});assert.equal((await sms.receipt({target:phone,record:{...record,attemptedAt:1791884500000}})).status,'delivery_failed');});
