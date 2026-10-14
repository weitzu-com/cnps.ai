import test from 'node:test';import assert from 'node:assert/strict';import {createDeliverySms} from '../server/crm-delivery-sms.mjs';
import {digest} from '../server/proposal-crypto.mjs';
test('notification template and key are separate from login OTP and fail closed',()=>{assert.equal(createDeliverySms({ALIYUN_SMS_TEMPLATE_CODE:'100001',ALIYUN_ACCESS_KEY_ID:'login-only'}).configured,false);});
test('notification has global quota, fixed approved content, no OTP or confidential text, no blind retries',async()=>{
 let sent;const env={CNPS_PROPOSAL_SECRET:'0123456789abcdef'.repeat(4),CRM_NOTIFY_ACCESS_KEY_ID:'synthetic-key',CRM_NOTIFY_ACCESS_KEY_SECRET:'synthetic-secret',CRM_NOTIFY_SIGN_NAME:'Synthetic',CRM_NOTIFY_TEMPLATE_CODE:'SMS_12345'};
 const client={async sendSms(request){sent=request;return {body:{code:'OK',bizId:'synthetic-biz'}};}};
 const sms=createDeliverySms(env,{client,redis:{async eval(){return 1;}}});const result=await sms.send('18700001111','delivery-one');assert.equal(result.status,'submitted');assert.equal(sent.templateParam,undefined);assert.equal(sent.phoneNumbers,'18700001111');assert.equal(sent.outId,'delivery-one');
 const blocked=createDeliverySms(env,{client:{async sendSms(){throw Error('must not send');}},redis:{async eval(){return 0;}}});assert.equal((await blocked.send('18700001111','delivery-one')).reason,'monthly_limit');
});

test('Aliyun notifications share the raised login budgets and China calendar keys',async()=>{
 const env={CNPS_PROPOSAL_SECRET:'0123456789abcdef'.repeat(4),CRM_NOTIFY_ACCESS_KEY_ID:'synthetic-key',CRM_NOTIFY_ACCESS_KEY_SECRET:'synthetic-secret',CRM_NOTIFY_SIGN_NAME:'Synthetic',CRM_NOTIFY_TEMPLATE_CODE:'SMS_12345'};
 const phone='18700001111',pid=digest(env.CNPS_PROPOSAL_SECRET,'phone',phone);
 let time=Date.UTC(2026,9,31,15,59,59),sent=0;
 const values=new Map();
 const redis={async eval(script,keys,args){
  const date=new Date(time+8*3600000).toISOString();
  assert.deepEqual(keys,['cooldown:'+pid,'phone-day:'+date.slice(0,10)+':'+pid,'send-day:'+date.slice(0,10),'send-month:'+date.slice(0,7)].map(k=>'cnps:proposal:v1:'+k));
  assert.deepEqual(args,[1,60,20,172800,200,172800,3000,32*86400]);
  for(let i=0;i<keys.length;i++)if((values.get(keys[i])||0)>=args[i*2])return 0;
  for(const key of keys)values.set(key,(values.get(key)||0)+1);
  return 1;
 }};
 const client={async sendSms(){sent++;return {body:{code:'OK',bizId:'synthetic'}};}};
 const sms=createDeliverySms(env,{redis,client,now:()=>time});
 // Existing historical counts remain in place while the allowance grows.
 values.set('cnps:proposal:v1:send-day:2026-10-31',20);
 values.set('cnps:proposal:v1:send-month:2026-10',100);
 assert.equal((await sms.send(phone,'delivery-one')).status,'submitted');
 assert.equal(values.get('cnps:proposal:v1:send-day:2026-10-31'),21);
 assert.equal(values.get('cnps:proposal:v1:send-month:2026-10'),101);
 values.delete('cnps:proposal:v1:cooldown:'+pid);
 values.set('cnps:proposal:v1:send-day:2026-10-31',200);
 assert.equal((await sms.send(phone,'delivery-two')).status,'failed');
 assert.equal(sent,1);
 values.set('cnps:proposal:v1:send-day:2026-10-31',199);
 values.set('cnps:proposal:v1:send-month:2026-10',3000);
 assert.equal((await sms.send(phone,'delivery-two')).status,'failed');
 assert.equal(sent,1);
 time+=61000;
 assert.equal((await sms.send(phone,'delivery-three')).status,'submitted');
 assert.equal(values.get('cnps:proposal:v1:send-month:2026-10'),3000);
 assert.equal(values.get('cnps:proposal:v1:send-month:2026-11'),1);
});
