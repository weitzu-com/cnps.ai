import {randomBytes} from 'node:crypto';
import {digest, encrypt, decrypt, keyBytes} from './proposal-crypto.mjs';
import {sanitizeTracking, submitInquiry, validateConfig} from '../site/fastgpt-assets/inquiry.mjs';
import {crmInquiryConsent, crmInquiryConsentVersion} from '../web/crm-inquiry.mjs';

const RECORD_TTL_NOTE = 'Encrypted intake state expires after 30 days; native CRM contacts follow the customer retention policy.';
const WORKFLOWS = new Set(['technical-knowledge','support-triage','rfq-intake','another-workflow','distribution','other','knowledge-assistants','meeting-ai','edge-vision','voice-prototypes','robotics-research']);
const allowedValues = ['name','email','company','phone','region','workflow','need','systems','consent'];
const keys = (value, allowed) => Object.keys(value).every(key => allowed.includes(key));
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
function string(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u001f\u007f]/.test(value.replace(/[\r\n\t]/g,''))) throw new Error('invalid-input');
  const result = value.trim().normalize('NFC');
  if (required && !result) throw new Error('invalid-input');
  return result;
}
function fixedUuid(hash) {
  const bytes = Buffer.from(hash.slice(0,32),'hex');bytes[6]=(bytes[6]&0x0f)|0x40;bytes[8]=(bytes[8]&0x3f)|0x80;
  const hex = bytes.toString('hex');return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}
export function normalizeInquiry(data, origins) {
  if (!object(data) || !keys(data,['values','tracking','context','locale','kind','consentVersion']) || !object(data.values) || !keys(data.values,allowedValues) || !object(data.context) || !keys(data.context,['pageUri','pageName']) || data.values.consent !== true || data.consentVersion !== crmInquiryConsentVersion || !Object.hasOwn(crmInquiryConsent,data.locale)) throw new Error('invalid-input');
  if (!['fastgpt','general'].includes(data.kind)) throw new Error('invalid-input');
  const values = {};
  for (const [name,max,required] of [['name',100,true],['email',254,true],['company',150,true],['region',100,true],['workflow',100,true],['need',1600,true],['systems',600,false],['phone',40,false]]) values[name] = string(data.values[name] ?? '',max,required);
  if(['name','email','company','region','workflow','phone'].some(name=>/[\r\n\t]/.test(values[name])))throw new Error('invalid-input');
  values.email = values.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || !WORKFLOWS.has(values.workflow) || values.need.length<15) throw new Error('invalid-input');
  values.phone=values.phone.replace(/[ ()-]/g,'');
  if (values.phone && !/^\+?\d{5,20}$/.test(values.phone)) throw new Error('invalid-input');
  values.consent = true;
  const page = new URL(string(data.context.pageUri,2000,true));
  if (!origins.has(page.origin) || page.username || page.password || !/^\/(?:en\/|zh\/|ar\/)?(?:request-quote|contact|fastgpt\/contact)\/?$/.test(page.pathname)) throw new Error('invalid-input');
  page.search='';page.hash='';
  const tracking = sanitizeTracking(object(data.tracking) ? data.tracking : {});
  for (const key of Object.keys(tracking).sort()) page.searchParams.set(key,tracking[key]);
  return {values,tracking,context:{pageUri:page.href,pageName:string(data.context.pageName??'',200)},locale:data.locale,kind:data.kind,consentVersion:crmInquiryConsentVersion};
}
export function inquiryHubSpotPayload(inquiry, config) {
  validateConfig(config);
  const v = inquiry.values, consent = crmInquiryConsent[inquiry.locale];
  // Preserve the configured six form fields. A new field must first exist in
  // HubSpot's form definition, so optional phone is retained in the full brief.
  // https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v3-legacy/submit-data-unauthenticated
  const brief = `CNPS inquiry\n\nName: ${v.name}\nEmail: ${v.email}\nCompany (unverified): ${v.company}\nPhone: ${v.phone||'Not provided'}\nCountry / region: ${v.region}\nWorkflow: ${v.workflow}\n\nRequirement:\n${v.need}\n\nSystems and timeline:\n${v.systems||'To discuss'}\n\n${Object.entries(inquiry.tracking).map(([key,value])=>key+': '+value).join('\n')}\n\nPrivacy acknowledgment: ${consent}`;
  const fields = {name:v.name,email:v.email,company:v.company,region:v.region,subject:(inquiry.kind==='fastgpt'?'FastGPT pilot inquiry':'CNPS.AI inquiry')+' — '+v.company,message:brief};
  return {fields:Object.entries(fields).map(([key,value])=>({objectTypeId:'0-1',name:config.fields[key],value})),context:inquiry.context,legalConsentOptions:{consent:{consentToProcess:true,text:consent,communications:[]}}};
}
async function readJson(req) {
  if (!String(req.headers['content-type']||'').startsWith('application/json')) throw new Error('invalid-input');
  let value;
  if (req.body!==undefined) {if(Buffer.byteLength(typeof req.body==='string'?req.body:JSON.stringify(req.body)||'')>16384)throw new Error('invalid-input');value=typeof req.body==='string'?JSON.parse(req.body):req.body;}
  else {let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>16384)throw new Error('invalid-input');}value=JSON.parse(raw);}
  return value;
}
function policy(res) {
  for(const name of ['Cache-Control','CDN-Cache-Control','Vercel-CDN-Cache-Control'])res.setHeader(name,'private, no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
}

// Native adapter contract: upsertInquiryLead receives fixed server UUIDs and
// creates an isolated, explicitly unverified lead company/contact. It must GET
// those IDs before a retry, verify ownership, and never grant portal membership.
// HubSpot and Twenty cannot share a transaction. The encrypted atomic outbox
// prevents concurrent duplicate sends and fails closed after an ambiguous send.
export function createCrmInquiryHandler({env, config, storeFactory, getNative, forward = (payload) => submitInquiry(config,payload), now = () => Date.now()}) {
  let store;
  const storage = () => store ??= storeFactory(env);
  const hash = (purpose,value) => digest(env.CNPS_PROPOSAL_SECRET,purpose,value);
  const encryptionKey = () => hash('crm-inquiry-encryption','v1');
  return async (req,res) => {
    policy(res);
    const json = (status,data) => {res.statusCode=status;res.end(req.method==='HEAD'?undefined:JSON.stringify(data));};
    let recordId,owner,phase;
    try {
      const url = new URL(req.url,'https://www.cnps.ai');
      if(url.pathname!=='/api/crm-inquiry')return json(404,{ok:false,code:'not-found'});
      if(req.method!=='POST'){res.setHeader('Allow','POST');return json(405,{ok:false,code:'method-not-allowed'});}
      const origins=new Set(['https://www.cnps.ai','https://cnps.ai']);if(env.VERCEL_URL)origins.add('https://'+env.VERCEL_URL);
      if(!origins.has(req.headers.origin)||req.headers['x-cnps-crm']!=='1')return json(403,{ok:false,code:'invalid-origin'});
      let inquiry;try{inquiry=normalizeInquiry(await readJson(req),origins);}catch{return json(400,{ok:false,code:'invalid-input'});}
      keyBytes(env.CNPS_PROPOSAL_SECRET);validateConfig(config);
      const ip=String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
      if(!await storage().reserve([{name:'request-ip-hour:'+hash('crm-inquiry-ip',ip),max:30,ttl:3600}]))return json(429,{ok:false,code:'rate-limited'});
      const canonical={...inquiry,tracking:Object.fromEntries(Object.entries(inquiry.tracking).sort(([a],[b])=>a.localeCompare(b)))};
      recordId=hash('crm-inquiry-submission',JSON.stringify(canonical));owner=randomBytes(24).toString('base64url');
      const identityKey=JSON.stringify([inquiry.values.email,inquiry.values.company]);
      const nativeIds={companyId:fixedUuid(hash('crm-inquiry-company',identityKey)),contactId:fixedUuid(hash('crm-inquiry-contact',identityKey))};
      const envelope=encrypt(Buffer.from(JSON.stringify({inquiry,nativeIds})),encryptionKey()).toString('base64url');
      const claim=await storage().claim(recordId,owner,{phase:'crm-pending',sourceTag:'website-inquiry',verification:'unverified',envelope,createdAt:now(),updatedAt:now()},now());
            if(claim.kind==='complete')return json(200,{ok:true,submitted:true});
      if(claim.kind==='pending')return json(202,{ok:true,pending:true});
      if(claim.kind!=='owned')throw new Error('storage-unavailable');
      phase=claim.record.phase;
      const date=new Date(now()+8*3600e3).toISOString();
      const limits=[{name:'ip-hour:'+hash('crm-inquiry-ip',ip),max:5,ttl:3600},{name:'email-day:'+date.slice(0,10)+':'+hash('crm-inquiry-email',inquiry.values.email),max:3,ttl:172800},{name:'global-day:'+date.slice(0,10),max:50,ttl:172800},{name:'global-month:'+date.slice(0,7),max:1000,ttl:32*86400}];
      if(!await storage().reserve(limits)){await storage().advance(recordId,owner,phase,phase,now(),true);return json(429,{ok:false,code:'rate-limited'});}
      const saved=JSON.parse(decrypt(Buffer.from(claim.record.envelope,'base64url'),encryptionKey()).toString());
      if(phase==='crm-pending') {
        const native=await getNative();if(typeof native?.upsertInquiryLead!=='function')throw new Error('crm-unavailable');
        const created=await native.upsertInquiryLead({...saved.nativeIds,companyName:saved.inquiry.values.company,name:saved.inquiry.values.name,email:saved.inquiry.values.email,phone:saved.inquiry.values.phone,region:saved.inquiry.values.region});
        if(created?.companyId!==saved.nativeIds.companyId||created?.contactId!==saved.nativeIds.contactId)throw new Error('crm-unconfirmed');
        if(!await storage().advance(recordId,owner,'crm-pending','hubspot-ready',now()))throw new Error('storage-unavailable');phase='hubspot-ready';
      }
      if(phase!=='hubspot-ready')throw new Error('storage-unavailable');
      if(!await storage().advance(recordId,owner,'hubspot-ready','hubspot-sending',now()))throw new Error('storage-unavailable');phase='hubspot-sending';
      try {await forward(inquiryHubSpotPayload(saved.inquiry,config));}
      catch(error) {
        const safeRejection=/^hubspot-(400|403|404|429)$/.test(error?.message||'');
        await storage().advance(recordId,owner,'hubspot-sending',safeRejection?'hubspot-ready':'uncertain',now(),true);
        phase=safeRejection?'hubspot-ready':'uncertain';
        if(!safeRejection)return json(202,{ok:true,pending:true});
        return json(503,{ok:false,code:'delivery-unavailable'});
      }
      if(!await storage().advance(recordId,owner,'hubspot-sending','complete',now(),true))throw new Error('storage-unavailable');
      return json(200,{ok:true,submitted:true});
    } catch {
      if(recordId&&owner&&phase&&['crm-pending','hubspot-ready'].includes(phase)){try{await storage().advance(recordId,owner,phase,phase,now(),true);}catch{}}
      // Do not disclose native IDs, private contact fields, keys, upstream
      // responses or exceptions. No logs and no public inquiry status lookup.
      return json(503,{ok:false,code:'unavailable'});
    }
  };
}
export {RECORD_TTL_NOTE};
