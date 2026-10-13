import {createVolcDeliverySms} from './crm-volc-sms.mjs';
import Dysmsapi from '@alicloud/dysmsapi20170525';
import OpenApi from '@alicloud/openapi-client';
import { digest } from './proposal-crypto.mjs';
import { Redis } from '@upstash/redis';
const Client = Dysmsapi.default || Dysmsapi;
// Separate notification credentials and template; never use the OTP template.
export function createDeliverySms(env, {client: injectedClient, redis: injectedRedis, fetchImpl, now} = {}) {
  if(env.CRM_NOTIFY_PROVIDER==='volcengine')return createVolcDeliverySms(env,{redis:injectedRedis,fetchImpl,now});
  const configured = ['CRM_NOTIFY_ACCESS_KEY_ID','CRM_NOTIFY_ACCESS_KEY_SECRET','CRM_NOTIFY_SIGN_NAME','CRM_NOTIFY_TEMPLATE_CODE'].every(key=>Boolean(env[key])) && /^SMS_\d+$/.test(env.CRM_NOTIFY_TEMPLATE_CODE||'');
  if(!configured) return {configured:false};
  const client=injectedClient || new Client(new OpenApi.Config({accessKeyId:env.CRM_NOTIFY_ACCESS_KEY_ID,accessKeySecret:env.CRM_NOTIFY_ACCESS_KEY_SECRET,endpoint:'dysmsapi.aliyuncs.com',connectTimeout:5000,readTimeout:10000}));
  const redis=injectedRedis || new Redis({url:env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token:env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN,retry:{retries:0}});
  return {configured:true,async send(phone,deliveryId){
    const date=new Date().toISOString(),pid=digest(env.CNPS_PROPOSAL_SECRET,'phone',phone);
    const limits=[{name:'cooldown:'+pid,max:1,ttl:60},{name:'phone-day:'+date.slice(0,10)+':'+pid,max:5,ttl:172800},{name:'send-day:'+date.slice(0,10),max:20,ttl:172800},{name:'send-month:'+date.slice(0,7),max:100,ttl:32*86400}];
    const count=await redis.eval("for i=1,#KEYS do if tonumber(redis.call('GET',KEYS[i]) or '0')>=tonumber(ARGV[(i-1)*2+1]) then return 0 end end;for i=1,#KEYS do local n=redis.call('INCR',KEYS[i]);if n==1 then redis.call('EXPIRE',KEYS[i],ARGV[(i-1)*2+2]) end end;return 1",limits.map(x=>'cnps:proposal:v1:'+x.name),limits.flatMap(x=>[x.max,x.ttl]));
    if(Number(count)!==1)return {status:'failed',reason:'monthly_limit'};
    // Template must have fixed portal URL; no file names or confidential contents in SMS.
    const {body}=await client.sendSms(new Dysmsapi.SendSmsRequest({phoneNumbers:phone,signName:env.CRM_NOTIFY_SIGN_NAME,templateCode:env.CRM_NOTIFY_TEMPLATE_CODE,outId:deliveryId}));
    return body?.code==='OK'&&body.bizId ? {status:'submitted',providerId:body.bizId} : {status:'failed'};
  }};
}
