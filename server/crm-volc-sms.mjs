import {createHash,createHmac} from 'node:crypto';
import {Redis} from '@upstash/redis';
import {digest} from './proposal-crypto.mjs';
export const DELIVERY_SMS_TEXT='您合作的网站建设与AI应用项目交付资料已更新，请登录客户工作台查看并验收。如有疑问，请联系项目负责人。';
const hash=s=>createHash('sha256').update(s).digest('hex');
const hmac=(k,s)=>createHmac('sha256',k).update(s).digest();
// Fixed host/action allowlist; no credentials or provider response bodies are logged.
export function signVolcSms(env,action,payload,time=Date.now()) {
 if(!['SendSmsForAgent','ListSmsSendLogForAgent'].includes(action))throw Error('Unsupported SMS action');
 const body=JSON.stringify(payload),date=new Date(time).toISOString().replace(/[:-]|\.\d{3}/g,''),region='cn-beijing',service='volcsms';
 const query='Action='+action+'&Version=2026-01-01';
 const headers={'host':'sms.volcengineapi.com','x-date':date,'x-content-sha256':hash(body)};
 const keys=Object.keys(headers).sort(),signed=keys.join(';');
 const canonical=['POST','/',query,keys.map(k=>k+':'+headers[k]).join('\n')+'\n',signed,hash(body)].join('\n');
 const scope=[date.slice(0,8),region,service,'request'].join('/');
 const key=hmac(hmac(hmac(hmac(env.CRM_VOLC_SMS_SECRET_KEY,date.slice(0,8)),region),service),'request');
 headers.authorization='HMAC-SHA256 Credential='+env.CRM_VOLC_SMS_ACCESS_KEY+'/'+scope+', SignedHeaders='+signed+', Signature='+hmac(key,['HMAC-SHA256',date,scope,hash(canonical)].join('\n')).toString('hex');
 headers['content-type']='application/json';
 return {url:'https://sms.volcengineapi.com/?'+query,body,headers};
}
export function createVolcDeliverySms(env,{fetchImpl=globalThis.fetch,redis,now=Date.now}={}) {
 const configured=env.CRM_VOLC_SMS_ENABLED==='true'&&['CRM_VOLC_SMS_ACCESS_KEY','CRM_VOLC_SMS_SECRET_KEY','CRM_VOLC_SMS_SUB_ACCOUNT','CRM_VOLC_SMS_SIGN','CRM_VOLC_SMS_TEMPLATE_ID','CNPS_PROPOSAL_SECRET'].every(k=>!!env[k])&&env.CRM_VOLC_SMS_APPROVED_TEXT===DELIVERY_SMS_TEXT;
 if(!configured)return {configured:false};
 const segments=('【'+env.CRM_VOLC_SMS_SIGN+'】'+DELIVERY_SMS_TEXT).length<=70?1:Math.ceil(('【'+env.CRM_VOLC_SMS_SIGN+'】'+DELIVERY_SMS_TEXT).length/67);
 let storage=redis;
 async function api(action,payload){
  const request=signVolcSms(env,action,payload,now());
  const response=await fetchImpl(request.url,{method:'POST',headers:request.headers,body:request.body,redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('SMS transport unavailable');
  const result=await response.json();
  if(result.ResponseMetadata?.Error)throw Error('SMS provider rejected request');
  return result.Result;
 }
 return {configured:true,provider:'volcengine',segments,async send(phone){
  if(!/^1[3-9]\d{9}$/.test(phone))return {status:'failed'};
  storage ||= new Redis({url:env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token:env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN,retry:{retries:0}});
  const date=new Date(now()+8*3600000).toISOString(),pid=digest(env.CNPS_PROPOSAL_SECRET,'phone',phone);
  const limits=[['month:'+date.slice(0,7),100,segments,32*86400],['day:'+date.slice(0,10),20,segments,172800],['phone-day:'+date.slice(0,10)+':'+pid,5,1,172800],['cooldown:'+pid,1,1,60]];
  const ok=await storage.eval("for i=1,#KEYS do if tonumber(redis.call('GET',KEYS[i]) or '0')+tonumber(ARGV[(i-1)*3+2])>tonumber(ARGV[(i-1)*3+1]) then return 0 end end;for i=1,#KEYS do local n=redis.call('INCRBY',KEYS[i],ARGV[(i-1)*3+2]);if n==tonumber(ARGV[(i-1)*3+2]) then redis.call('EXPIRE',KEYS[i],ARGV[(i-1)*3+3]) end end;return 1",limits.map(x=>'cnps:crm:volc-sms:v1:'+x[0]),limits.flatMap(x=>x.slice(1)));
  if(Number(ok)!==1)return {status:'failed',reason:'monthly_limit'};
  // Reserve before IO, never refund ambiguous calls or retry automatically.
  const result=await api('SendSmsForAgent',{SubAccount:env.CRM_VOLC_SMS_SUB_ACCOUNT,Signature:env.CRM_VOLC_SMS_SIGN,TemplateId:env.CRM_VOLC_SMS_TEMPLATE_ID,Mobiles:phone});
  const ids=result?.MessageId ?? result?.MessageID ?? result?.MessageIds;
  if(!Array.isArray(ids)||ids.length!==1||typeof ids[0]!=='string'||!ids[0])return {status:'unknown'};
  return {status:'submitted',provider:'volcengine',providerId:ids[0],segments,subAccount:env.CRM_VOLC_SMS_SUB_ACCOUNT,signature:env.CRM_VOLC_SMS_SIGN,templateId:env.CRM_VOLC_SMS_TEMPLATE_ID};
 },async receipt({target,record}){
  if(record.provider!=='volcengine'||!record.providerId||record.subAccount!==env.CRM_VOLC_SMS_SUB_ACCOUNT)throw Error('SMS receipt provider mismatch');
  const result=await api('ListSmsSendLogForAgent',{SubAccount:record.subAccount,MessageId:record.providerId,Mobile:target,TemplateId:record.templateId,Signature:record.signature,FromTime:Math.floor((record.attemptedAt||now()-86400000)/1000)-300,ToTime:Math.floor(now()/1000),Page:1,PageSize:100});
  const rows=(result?.List||[]).filter(r=>r.MessageId===record.providerId&&(r.Mobile===target||r.Mobile===target.slice(0,3)+'****'+target.slice(-4))&&(!r.SubAccount||r.SubAccount===record.subAccount)&&r.TemplateId===record.templateId&&r.Signature===record.signature&&r.ChannelType==='CN_NTC');
  if(rows.length!==1||Number(result.Total)!==1)return {status:'submitted'};
  const row=rows[0];
  if(/^(?:SY|NE|CR|CE|UN):\d{4}$/.test(row.ErrorCode||''))return {status:'delivery_failed',receiptCode:row.ErrorCode,checkedAt:now()};
  if(!Number.isFinite(row.ReceiptTime)||row.ReceiptTime<=0||typeof row.ErrorCode!=='string'||!row.ErrorCode)return {status:'submitted'};
  // Live logs use milliseconds; older SDK schemas describe seconds. Normalize both.
  if(row.ErrorCode!=='0')return {status:'submitted',receiptCode:row.ErrorCode.slice(0,60)};
  return {status:'delivered',receiptAt:row.ReceiptTime>1e12?row.ReceiptTime:row.ReceiptTime*1000,billedSegments:Number.isInteger(row.Count)&&row.Count>0?row.Count:undefined};
 }};
}
