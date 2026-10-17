import {randomInt,createHmac} from 'node:crypto';
import {Redis} from '@upstash/redis';
import {signVolcSms} from './crm-volc-sms.mjs';
import {CrmSmsFailure} from './crm-sms-failure.mjs';
const ATTEMPT=`local v=redis.call('GET',KEYS[1]);if not v then return 0 end;local c=cjson.decode(v);if c.attempts>=5 then return 0 end;c.attempts=c.attempts+1;local ttl=redis.call('TTL',KEYS[1]);if ttl<1 then return 0 end;if c.digest==ARGV[1] then redis.call('DEL',KEYS[1]);return 1 end;redis.call('SET',KEYS[1],cjson.encode(c),'EX',ttl);return 0`;
// A keyed digest binds code to phone, purpose, provider and browser challenge.
// No plaintext code is persisted or returned. The outer auth flow owns ACL,
// cookie binding, global quotas, per-IP quotas and atomic challenge consumption.
export function createVolcOtpSms(env,{purpose='crm',redis,fetchImpl=globalThis.fetch,now=Date.now,generateCode=()=>String(randomInt(100000,1000000)),reportFailure=event=>console.warn('CNPS_VOLC_OTP_REJECTED',JSON.stringify(event))}={}){
 if(!['crm','proposal'].includes(purpose))throw Error('Invalid SMS purpose');
 for(const key of ['CRM_VOLC_SMS_ACCESS_KEY','CRM_VOLC_SMS_SECRET_KEY','CRM_VOLC_SMS_SUB_ACCOUNT','CRM_VOLC_OTP_SIGN','CRM_VOLC_OTP_TEMPLATE_ID','CNPS_PROPOSAL_SECRET'])if(!env[key])throw Error('Volc OTP not configured');
 if(!/^[a-f0-9]{64}$/i.test(env.CNPS_PROPOSAL_SECRET))throw Error('Invalid OTP secret');
 const mac=value=>createHmac('sha256',Buffer.from(env.CNPS_PROPOSAL_SECRET,'hex')).update(JSON.stringify(value)).digest('hex');
 const key=(phone,id)=>'cnps:volc:otp:v1:'+mac([purpose,phone,id]);
 const digest=(phone,id,code)=>mac(['volc-otp-v1',purpose,phone,id,code]);
 const storage=()=>redis||=new Redis({url:env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token:env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN,retry:{retries:0}});
 function valid(phone,id){if(!/^1[3-9]\d{9}$/.test(phone)||! /^[A-Za-z0-9_-]{43}$/.test(id))throw Error('Invalid OTP request');}
 return {provider:'volcengine',async send(phone,id){
  valid(phone,id);const code=generateCode();if(!/^\d{6}$/.test(code))throw Error('Invalid OTP generator');
  const record={digest:digest(phone,id,code),attempts:0};
  // Persist before IO. A provider timeout is ambiguous: never retry or fail over.
  if(await storage().set(key(phone,id),record,{ex:300,nx:true})!=='OK')throw Error('OTP challenge already exists');
  try{
   const request=signVolcSms(env,'SendSmsForAgent',{SubAccount:env.CRM_VOLC_SMS_SUB_ACCOUNT,Signature:env.CRM_VOLC_OTP_SIGN,TemplateId:env.CRM_VOLC_OTP_TEMPLATE_ID,Mobiles:phone,TemplateParam:JSON.stringify({code})},now());
   const response=await fetchImpl(request.url,{method:'POST',headers:request.headers,body:request.body,redirect:'error',signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw new CrmSmsFailure(undefined,'transport-unavailable');
   const result=await response.json();const ids=result?.Result?.MessageId??result?.Result?.MessageID??result?.Result?.MessageIds;
   if(result.ResponseMetadata?.Error||!Array.isArray(ids)||ids.length!==1||typeof ids[0]!=='string'||!ids[0]){
    const meta=result.ResponseMetadata||{},rawCode=String(meta.Error?.Code||'');
    const knownCodes=new Set(['AccessDenied','Forbidden','InvalidAccessKeyId','SignatureDoesNotMatch','InvalidParameter','MissingParameter','InvalidAction','InvalidVersion']);
    const code=/^\d{1,6}$/.test(rawCode)||knownCodes.has(rawCode)?rawCode:'unclassified';
    const requestId=/^[A-Z0-9]{20,64}$/.test(meta.RequestId||'')?meta.RequestId:undefined;
    const fields=['MessageId','MessageID','MessageIds','Code','code','Error','ErrorCode','Message','ResponseMetadata','Result'];
    reportFailure({code,requestId,invalidMessageId:!meta.Error,rootFields:fields.filter(k=>Object.hasOwn(result,k)),resultFields:fields.filter(k=>result.Result&&Object.hasOwn(result.Result,k))});
    throw new CrmSmsFailure();
   }
  }catch(error){await storage().del(key(phone,id)).catch(()=>{});throw error instanceof CrmSmsFailure?error:new CrmSmsFailure(['TimeoutError','AbortError'].includes(error?.name)?'ETIMEDOUT':undefined,'transport-unavailable');}
 },async verify(phone,code,id){valid(phone,id);if(!/^\d{6}$/.test(code))return false;return Number(await storage().eval(ATTEMPT,[key(phone,id)],[digest(phone,id,code)]))===1;}};
}
