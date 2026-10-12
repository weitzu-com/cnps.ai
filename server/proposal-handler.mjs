import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { digest, decrypt, keyBytes } from './proposal-crypto.mjs';
import { loginPage } from './proposal-login.mjs';
const SESSION_COOKIE='__Host-cnps_proposal';
const CHALLENGE_COOKIE='__Host-cnps_proposal_challenge';
const validToken=value=>/^[A-Za-z0-9_-]{43}$/.test(value||'');
const cookie=(name,value,age)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
const parseCookies=req=>Object.fromEntries(String(req.headers.cookie||'').split(';').map(x=>x.trim().split('=')));
export function normalizePhone(phone) {
  const value=String(phone||'').trim().replace(/^\+86/,'');
  return /^1[3-9]\d{9}$/.test(value)?value:null;
}
function policy(res,nonce) {
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control','no-store');
  res.setHeader('Vercel-CDN-Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive, nosnippet');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; img-src 'self'; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'`);
}
async function readJson(req) {
  if(!String(req.headers['content-type']||'').startsWith('application/json')) throw new Error('Bad body');
  if(req.body!==undefined){const data=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(data))>2048)throw new Error('Bad body');return data;}
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>2048)throw new Error('Bad body');}
  return JSON.parse(body);
}
export function createHandler({env,storeFactory,smsFactory,loadBundle,now=()=>Date.now()}) {
  let store;
  const storage=()=>store??=storeFactory(env);
  const secret=()=>{keyBytes(env.CNPS_PROPOSAL_SECRET);return env.CNPS_PROPOSAL_SECRET;};
  const hash=(type,value)=>digest(secret(),type,value);
  const allowed=()=>new Set(String(env.CNPS_PROPOSAL_ALLOWED_PHONES||'').split(',').map(normalizePhone).filter(Boolean));
  const phoneFor=pid=>[...allowed()].find(p=>hash('phone',p)===pid);
  return async function handler(req,res) {
    const nonce=randomBytes(18).toString('base64');policy(res,nonce);
    const json=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));};
    const html=(text)=>{res.statusCode=200;res.setHeader('Content-Type','text/html; charset=utf-8');res.end(req.method==='HEAD'?undefined:text.replaceAll('__CSP_NONCE__',nonce));};
    try {
      const url=new URL(req.url,'https://www.cnps.ai');
      const route=url.pathname==='/api/w'?('/w'+(url.searchParams.get('route')?'/'+url.searchParams.get('route'):'')):url.pathname;
      if(!/^\/w(?:\/(?:send|verify|logout|asset\/[a-z0-9-]+))?$/.test(route))return json(404,{error:'页面不存在。'});
      const cookies=parseCookies(req);
      const sid=cookies[SESSION_COOKIE];
      if(req.method==='POST'){
        const origins=new Set(['https://www.cnps.ai','https://cnps.ai']);
        if(env.VERCEL_URL)origins.add(`https://${env.VERCEL_URL}`);
        if(!origins.has(req.headers.origin)||req.headers['x-proposal-request']!=='1')return json(403,{error:'请求来源无效。'});
        let data;try{data=await readJson(req)}catch{return json(400,{error:'请求格式无效。'})}
        if(route==='/w/logout'){
          if(validToken(sid))await storage().del(`session:${hash('session',sid)}`);
          res.setHeader('Set-Cookie',[cookie(SESSION_COOKIE,'',0),cookie(CHALLENGE_COOKIE,'',0)]);
          return json(200,{ok:true});
        }
        if(!allowed().size)return json(503,{error:'访问服务正在配置，请联系项目对接人。'});
        const ip=String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
        const ipId=hash('ip',ip);
        if(route==='/w/send'){
          if(data.consent!==true)return json(400,{error:'请先同意身份验证说明。'});
          const phone=normalizePhone(data.phone);
          if(!phone||!allowed().has(phone))return json(403,{error:'该手机号暂未获授权，请联系项目对接人。'});
          // Validate the SMS configuration before reserving scarce send capacity.
          const sms=smsFactory(env),pid=hash('phone',phone);
          const date=new Date(now()+8*3600e3).toISOString();
          const limits=[{name:`cooldown:${pid}`,max:1,ttl:60},{name:`phone-day:${date.slice(0,10)}:${pid}`,max:5,ttl:172800},{name:`ip-hour:${ipId}`,max:10,ttl:3600},{name:`send-day:${date.slice(0,10)}`,max:20,ttl:172800},{name:`send-month:${date.slice(0,7)}`,max:100,ttl:32*86400}];
          if(!await storage().reserve(limits))return json(429,{error:'发送次数已达限额，请稍后或次日再试。'});
          const id=randomBytes(32).toString('base64url'),binding=randomBytes(32).toString('base64url');
          await sms.send(phone,id);
          await storage().set(`challenge:${id}`,{pid,binding:hash('binding',binding),attempts:0},300);
          res.setHeader('Set-Cookie',cookie(CHALLENGE_COOKIE,binding,300));
          return json(200,{challenge:id});
        }
        if(route==='/w/verify'){
          const binding=cookies[CHALLENGE_COOKIE];
          if(!validToken(data.challenge)||!validToken(binding)||!/^\d{6}$/.test(data.code||''))return json(400,{error:'验证码无效或已过期，请重新获取。'});
          if(!await storage().reserve([{name:`verify-ip:${ipId}`,max:30,ttl:600}]))return json(429,{error:'验证过于频繁，请稍后重试。'});
          const bindingId=hash('binding',binding),challenge=await storage().attempt(data.challenge,bindingId);
          const phone=challenge&&phoneFor(challenge.pid);
          if(!phone)return json(400,{error:'验证码无效或已过期，请重新获取。'});
          if(!await smsFactory(env).verify(phone,data.code,data.challenge))return json(400,{error:'验证码无效或已过期，请重新获取。'});
          if(!await storage().consume(data.challenge,bindingId))return json(400,{error:'验证码已使用，请重新获取。'});
          const token=randomBytes(32).toString('base64url');
          await storage().set(`session:${hash('session',token)}`,{pid:challenge.pid,expires:now()+8*3600e3},8*3600);
          res.setHeader('Set-Cookie',[cookie(SESSION_COOKIE,token,8*3600),cookie(CHALLENGE_COOKIE,'',0)]);
          return json(200,{ok:true});
        }
        return json(405,{error:'请求方式不支持。'});
      }
      if(req.method!=='GET'&&req.method!=='HEAD')return json(405,{error:'请求方式不支持。'});
      let session;
      if(validToken(sid))session=await storage().get(`session:${hash('session',sid)}`);
      const phone=session?.expires>now()?phoneFor(session.pid):null;
      if(!phone){if(route==='/w')return html(loginPage(nonce));return json(401,{error:'请先通过短信验证登录。'});}
      const bundle=await loadBundle(secret());
      if(route==='/w')return html(bundle.html.replaceAll('__VIEWER__',`${phone.slice(0,3)}****${phone.slice(-4)}`));
      if(route.startsWith('/w/asset/')){
        const asset=bundle.assets[route.slice(9)];if(!asset)return json(404,{error:'文件不存在。'});
        const bytes=Buffer.from(asset.data,'base64');res.statusCode=200;res.setHeader('Content-Type',asset.type);
        if(asset.filename)res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(asset.filename)}`);
        res.setHeader('Content-Length',bytes.length);return res.end(req.method==='HEAD'?undefined:bytes);
      }
      return json(404,{error:'页面不存在。'});
    } catch {
      // Never log provider errors, phone numbers, credentials, cookies or codes.
      return json(503,{error:'访问服务暂不可用，请稍后重试或联系项目对接人。'});
    }
  };
}
let bundle;
export async function loadEncryptedBundle(secret) {
  if(!bundle)bundle=JSON.parse(decrypt(await readFile(new URL('../private/proposal.enc',import.meta.url)),secret).toString('utf8'));
  return bundle;
}
