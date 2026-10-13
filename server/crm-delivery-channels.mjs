import {createHash,createHmac,randomUUID} from 'node:crypto';
import {Redis} from '@upstash/redis';
import {digest} from './proposal-crypto.mjs';
const fixedMessage=link=>'您的项目交付资料已更新。请使用已获授权的手机号登录客户工作台查看：\n'+link+'\n链接转发不新增访问权限。';
function aliEncode(value){return encodeURIComponent(value).replace(/!/g,'%21').replace(/'/g,'%27').replace(/\(/g,'%28').replace(/\)/g,'%29').replace(/\*/g,'%2A');}
function acs3Authorization(method,pathname,query,headers,accessKeyId,accessKeySecret,payloadHash){
 const canonicalQuery=Object.keys(query||{}).sort().map(key=>{const value=query[key];return key+'='+(value===undefined||value===null?'':aliEncode(String(value)));}).join('&');
 const grouped={};
 for(const [name,value] of Object.entries(headers)){const lower=name.toLowerCase();if(lower.startsWith('x-acs-')||lower==='host'||lower==='content-type')(grouped[lower]||=[]).push(String(value??'').trim());}
 const signed=Object.keys(grouped).sort();
 const canonicalHeaders=signed.map(key=>`${key}:${grouped[key].sort().join(',')}`).join('\n');
 const canonical=[method,pathname,canonicalQuery,canonicalHeaders,'',signed.join(';'),payloadHash].join('\n');
 const stringToSign='ACS3-HMAC-SHA256\n'+createHash('sha256').update(canonical).digest('hex');
 const signature=createHmac('sha256',accessKeySecret).update(stringToSign).digest('hex');
 return {canonicalQuery,authorization:`ACS3-HMAC-SHA256 Credential=${accessKeyId},SignedHeaders=${signed.join(';')},Signature=${signature}`};
}
function createMailClient(env,fetchImpl){
 const host='dm.aliyuncs.com';
 return {async callApi(params,request,runtime){
  const query=request.query||{};
  const payloadHash=createHash('sha256').update('').digest('hex');
  const headers={host,accept:'application/json','x-acs-action':params.action,'x-acs-version':params.version,'x-acs-date':new Date().toISOString().replace(/\.\d{3}Z$/,'Z'),'x-acs-signature-nonce':randomUUID(),'x-acs-content-sha256':payloadHash};
  const signed=acs3Authorization(params.method||'POST','/',query,headers,env.CRM_MAIL_ACCESS_KEY_ID,env.CRM_MAIL_ACCESS_KEY_SECRET,payloadHash);
  headers.Authorization=signed.authorization;
  const timeout=Number(runtime?.readTimeout)||10000;
  let response;try{response=await fetchImpl('https://'+host+'/?'+signed.canonicalQuery,{method:params.method||'POST',headers,redirect:'error',signal:AbortSignal.timeout(timeout)});}catch{throw Error('Mail unavailable');}
  let body;try{body=await response.json();}catch{throw Error('Mail unavailable');}
  if(!response.ok)throw Error('Mail unavailable');
  return {body};
 }};
}
export function createDeliveryChannels(env,{mailClient,redis,fetchImpl=globalThis.fetch}={}){
 const emailConfigured=['CRM_MAIL_ACCESS_KEY_ID','CRM_MAIL_ACCESS_KEY_SECRET','CRM_MAIL_FROM'].every(k=>!!env[k]);
 const wecomConfigured=['CRM_WECOM_CORP_ID','CRM_WECOM_CUSTOMER_SECRET'].every(k=>!!env[k]);
 let client=mailClient;
 if(emailConfigured&&!client)client=createMailClient(env,fetchImpl);
 let storage=redis;
 async function quota(target){
  storage ||= new Redis({url:env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token:env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN,retry:{retries:0}});
  const date=new Date().toISOString(),pid=digest(env.CNPS_PROPOSAL_SECRET,'notify-target',target);
  const limits=[{name:'cooldown:'+pid,max:1,ttl:60},{name:'day:'+date.slice(0,10),max:100,ttl:172800},{name:'month:'+date.slice(0,7),max:1000,ttl:32*86400}];
  const ok=await storage.eval("for i=1,#KEYS do if tonumber(redis.call('GET',KEYS[i]) or '0')>=tonumber(ARGV[(i-1)*2+1]) then return 0 end end;for i=1,#KEYS do local n=redis.call('INCR',KEYS[i]);if n==1 then redis.call('EXPIRE',KEYS[i],ARGV[(i-1)*2+2]) end end;return 1",limits.map(x=>'cnps:crm:notify:v1:'+x.name),limits.flatMap(x=>[x.max,x.ttl]));
  return Number(ok)===1;
 }
 async function mail(action,query){
  const result=await client.callApi({action,version:'2015-11-23',protocol:'HTTPS',pathname:'/',method:'POST',authType:'AK',style:'RPC',reqBodyType:'formData',bodyType:'json'},{query},{autoretry:false,connectTimeout:5000,readTimeout:10000});return result.body;
 }
 async function wecom(path,body){
  const auth=await fetchImpl('https://qyapi.weixin.qq.com/cgi-bin/gettoken?'+new URLSearchParams({corpid:env.CRM_WECOM_CORP_ID,corpsecret:env.CRM_WECOM_CUSTOMER_SECRET}),{redirect:'error',signal:AbortSignal.timeout(10000)});
  const token=await auth.json();if(!auth.ok||token.errcode!==0||!token.access_token)throw Error('WeCom authentication failed');
  const url='https://qyapi.weixin.qq.com/cgi-bin/'+path+(path.includes('?')?'&':'?')+new URLSearchParams({access_token:token.access_token});
  const response=await fetchImpl(url,{method:body?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(10000),...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const result=await response.json();if(!response.ok)throw Error('WeCom unavailable');return result;
 }
 async function verifyBinding(binding,phone){
  const result=await wecom('externalcontact/get?'+new URLSearchParams({external_userid:binding.externalUserId}));
  if(result.errcode!==0||result.external_contact?.external_userid!==binding.externalUserId)return false;
  return Array.isArray(result.follow_user)&&result.follow_user.some(user=>user.userid===binding.senderUserId&&Array.isArray(user.remark_mobiles)&&user.remark_mobiles.some(value=>String(value).replace(/^\+86/,'').replace(/[ ()-]/g,'')===phone));
 }
 return {
  email:{configured:emailConfigured,async send({target,link,deliveryId,attempt}){
   if(!await quota('email:'+target.toLowerCase()))return {status:'failed',reason:'limit'};
   const subject='CNPS 项目交付资料更新 · '+deliveryId+' · '+attempt;
   const result=await mail('SingleSendMail',{AccountName:env.CRM_MAIL_FROM,AddressType:'1',ReplyToAddress:'false',ToAddress:target,Subject:subject,TextBody:fixedMessage(link),FromAlias:'CNPS.AI 客户工作台',ClickTrace:'0'});
   return result?.EnvId ? {status:'submitted',providerId:result.EnvId,subject} : {status:'unknown'};
  },async receipt({target,record}){
   const result=await mail('SenderStatisticsDetailByParam',{ToAddress:target,Length:'100'});
   if(result.NextStart)return {status:'submitted'}; // No ambiguous partial match.
   const items=Array.isArray(result.data?.mailDetail)?result.data.mailDetail:[];
   const matches=items.filter(item=>item.ToAddress?.toLowerCase()===target.toLowerCase()&&item.AccountName===env.CRM_MAIL_FROM&&item.Subject===record.subject);
   if(matches.length!==1)return {status:'submitted'};
   const item=matches[0];return {status:item.Status===0?'delivered':[2,3,4].includes(item.Status)?'delivery_failed':'submitted',receiptAt:Date.now()};
  }},
  wecom:{configured:wecomConfigured,verifyBinding,async send({binding,phone,link}){
   if(!await verifyBinding(binding,phone))return {status:'cancelled'};
   if(!await quota('wecom:'+binding.externalUserId))return {status:'failed',reason:'limit'};
   const result=await wecom('externalcontact/add_msg_template',{chat_type:'single',external_userid:[binding.externalUserId],sender:binding.senderUserId,text:{content:fixedMessage(link)},allow_select:false});
   if(result.errcode!==0||result.fail_list?.includes(binding.externalUserId))return {status:'failed'};
   return result.msgid?{status:'pending_member',providerId:result.msgid}:{status:'unknown'};
  },async receipt({binding,record}){
   const result=await wecom('externalcontact/get_groupmsg_send_result',{msgid:record.providerId,userid:binding.senderUserId,limit:1000});
   if(result.errcode!==0||result.next_cursor)return {status:'pending_member'};
   const rows=(result.send_list||[]).filter(row=>row.external_userid===binding.externalUserId);
   if(rows.length!==1)return {status:'pending_member'};
   return {status:rows[0].status===1?'sent':rows[0].status===0?'pending_member':'delivery_failed',receiptAt:Date.now()};
  }}
 };
}
