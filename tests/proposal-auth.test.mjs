import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createHandler,normalizePhone} from '../server/proposal-handler.mjs';
import {encrypt,decrypt,digest} from '../server/proposal-crypto.mjs';
const phone='13800000000';
function harness(activity){
 let time=Date.now(),sends=0,verifications=0,failSms=false;
 const values=new Map(),limits=new Map();
 const env={CNPS_PROPOSAL_SECRET:randomBytes(32).toString('hex'),CNPS_PROPOSAL_ALLOWED_PHONES:phone};
 const get=name=>{const v=values.get(name);return v?.expiry>time?structuredClone(v.value):null};
 const store={async reserve(items){for(const item of items){const v=limits.get(item.name);if(v?.expiry>time&&v.count>=item.max)return false;}for(const item of items){let v=limits.get(item.name);if(!v||v.expiry<=time)v={count:0,expiry:time+item.ttl*1000};v.count++;limits.set(item.name,v);}return true;},async set(k,v,ttl){values.set(k,{value:structuredClone(v),expiry:time+ttl*1000});},async get(k){return get(k)},async del(k){values.delete(k)},async attempt(id,binding){const c=get('challenge:'+id);if(!c||c.binding!==binding||c.attempts>=5)return null;values.get('challenge:'+id).value.attempts++;return c},async consume(id,binding){const c=get('challenge:'+id);if(!c||c.binding!==binding)return false;values.delete('challenge:'+id);return true}};
 const handler=createHandler({activity,env,storeFactory:()=>store,smsFactory:()=>({async send(){if(failSms)throw Error('provider private error');sends++},async verify(p,c){verifications++;return p===phone&&c==='123456'}}),now:()=>time,loadBundle:async()=>({html:'<h1>Private Quote __VIEWER__</h1>',assets:{pdf:{data:Buffer.from('private document').toString('base64'),type:'application/pdf',filename:'proposal.pdf'}}})});
 async function request(url,{method='GET',body,cookie='',origin='https://www.cnps.ai',extra={}}={}){const headers={};let output;const res={setHeader(k,v){headers[k.toLowerCase()]=v},end(v){output=v}};await handler({url,method,body,headers:{origin,'content-type':'application/json','x-proposal-request':'1',cookie,'x-real-ip':'192.0.2.1',...extra}},res);return{status:res.statusCode,headers,text:String(output||''),json(){return JSON.parse(output)}};}
 async function send(){const r=await request('/w/send',{method:'POST',body:{phone,consent:true}});assert.equal(r.status,200,r.text);return{id:r.json().challenge,cookie:r.headers['set-cookie'].split(';')[0]}}
 async function login(){const c=await send();const r=await request('/w/verify',{method:'POST',body:{challenge:c.id,code:'123456'},cookie:c.cookie});assert.equal(r.status,200,r.text);return{cookie:r.headers['set-cookie'][0].split(';')[0],challenge:c,response:r};}
 return{env,store,request,send,login,advance:ms=>time+=ms,sends:()=>sends,verifications:()=>verifications,fail:()=>failSms=true,limits};
}
test('encrypted payload is authenticated and cannot decrypt with wrong key',()=>{const key=randomBytes(32).toString('hex'),plain=Buffer.from('confidential quote');const data=encrypt(plain,key);assert.equal(decrypt(data,key).toString(),plain.toString());assert.throws(()=>decrypt(data,randomBytes(32).toString('hex')));data[data.length-1]^=1;assert.throws(()=>decrypt(data,key));});
test('normalization accepts only exact mainland numbers and optional +86',()=>{assert.equal(normalizePhone('+86'+phone),phone);for(const x of ['0086'+phone,phone+'x','<script>',null,'23800000000'])assert.equal(normalizePhone(x),null)});
test('anonymous page has no quote and every asset and direct API is protected',async()=>{const h=harness();for(const path of ['/w','/api/w']){const r=await h.request(path);assert.equal(r.status,200);assert.ok(r.text.includes('验证身份'));assert.ok(!r.text.includes('Private Quote'));assert.match(r.headers['cache-control'],/no-store/);assert.match(r.headers['x-robots-tag'],/noindex/);}for(const p of ['/w/asset/pdf','/api/w?route=asset/pdf','/w/asset/logo'])assert.equal((await h.request(p)).status,401);assert.equal((await h.request('/w/asset/../../secret')).status,404)});
test('unlisted number, missing consent, cross-origin and missing request header never send',async()=>{const h=harness();const cases=[{body:{phone:'13900000000',consent:true}}, {body:{phone,consent:false}}, {body:{phone,consent:true},origin:'https://evil.example'}, {body:{phone,consent:true},extra:{'x-proposal-request':''}}];for(const input of cases)assert.ok((await h.request('/w/send',{method:'POST',...input})).status>=400);assert.equal(h.sends(),0);});
test('the CRM host supports independent proposal verification, views and logout on public and rewritten routes',async()=>{
 for(const rewritten of [false,true]){
  const events=[],h=harness({async authorize(){},async record(...args){events.push(args)}}),origin='https://crm.cnps.ai';
  const route=action=>rewritten?'/api/w?route='+action:'/w/'+action;
  assert.equal((await h.request(route('send'),{method:'POST',origin,body:{phone:'13900000000',consent:true}})).status,403);
  assert.equal(h.sends(),0);
  const sent=await h.request(route('send'),{method:'POST',origin,body:{phone,consent:true}});
  assert.equal(sent.status,200,sent.text);
  const binding=sent.headers['set-cookie'].split(';')[0];
  const verified=await h.request(route('verify'),{method:'POST',origin,cookie:binding,body:{challenge:sent.json().challenge,code:'123456'}});
  assert.equal(verified.status,200,verified.text);
  assert.match(verified.headers['set-cookie'][0],/^__Host-cnps_proposal=.*; Path=\/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800$/);
  const cookie=verified.headers['set-cookie'][0].split(';')[0];
  assert.equal((await h.request(route('asset/pdf'),{origin,cookie})).text,'private document');
  assert.equal((await h.request(route('asset/pdf'),{origin,cookie:cookie.replace('__Host-cnps_proposal=','__Host-cnps_crm=')})).status,401);
  assert.equal((await h.request(route('view'),{method:'POST',origin,cookie,body:{}})).status,200);
  assert.deepEqual(events.map(event=>event[1]),['login','download','view']);
  const loggedOut=await h.request(route('logout'),{method:'POST',origin,cookie,body:{}});
  assert.equal(loggedOut.status,200,loggedOut.text);
  assert.ok(loggedOut.headers['set-cookie'].every(value=>value.includes('Max-Age=0')));
  assert.equal((await h.request(route('view'),{method:'POST',origin,cookie,body:{}})).status,401);
  assert.equal((await h.request(route('asset/pdf'),{origin,cookie})).status,401);
  assert.equal(h.sends(),1);assert.equal(h.verifications(),1);
 }
});
test('every proposal POST still rejects unapproved origins and missing request headers before side effects',async()=>{
 const h=harness(),login=await h.login();h.advance(61000);const challenge=await h.send();
 const actions=[['send',{phone,consent:true},''],['verify',{challenge:challenge.id,code:'123456'},challenge.cookie],['view',{},login.cookie],['logout',{},login.cookie]];
 for(const [action,body,cookie] of actions){
  for(const origin of ['https://evil.example','https://crm.cnps.com','https://crm.cnps.ai.evil.example','http://crm.cnps.ai']){
   assert.equal((await h.request('/w/'+action,{method:'POST',origin,cookie,body})).status,403,action+' '+origin);
  }
  assert.equal((await h.request('/w/'+action,{method:'POST',origin:'https://crm.cnps.ai',cookie,body,extra:{'x-proposal-request':''}})).status,403,action+' missing header');
 }
 assert.equal(h.sends(),2);assert.equal(h.verifications(),1);
 assert.equal((await h.request('/w/asset/pdf',{cookie:login.cookie})).status,200);
 assert.equal((await h.request('/w/verify',{method:'POST',origin:'https://crm.cnps.ai',cookie:challenge.cookie,body:{challenge:challenge.id,code:'123456'}})).status,200);
});
test('OTP verification binds to initiating browser and limits five attempts',async()=>{const h=harness(),c=await h.send();let r=await h.request('/w/verify',{method:'POST',body:{challenge:c.id,code:'123456'}});assert.equal(r.status,400);for(let n=0;n<6;n++){r=await h.request('/w/verify',{method:'POST',cookie:c.cookie,body:{challenge:c.id,code:'000000'}});assert.equal(r.status,400);}assert.equal(h.verifications(),5);r=await h.request('/w/verify',{method:'POST',cookie:c.cookie,body:{challenge:c.id,code:'123456'}});assert.equal(r.status,400);});
test('one successful verification cannot be replayed, including concurrent requests',async()=>{const h=harness(),c=await h.send();const options={method:'POST',cookie:c.cookie,body:{challenge:c.id,code:'123456'}};const r=await Promise.all([h.request('/w/verify',options),h.request('/w/verify',options)]);assert.deepEqual(r.map(x=>x.status).sort(),[200,400]);assert.equal((await h.request('/w/verify',options)).status,400);});
test('verified session accesses private content; cookie is secure; logout revokes',async()=>{const h=harness(),l=await h.login();assert.match(l.response.headers['set-cookie'][0],/HttpOnly; Secure; SameSite=Strict/);let r=await h.request('/w',{cookie:l.cookie});assert.ok(r.text.includes('Private Quote 138****0000'));r=await h.request('/w/asset/pdf',{cookie:l.cookie});assert.equal(r.text,'private document');assert.equal(r.headers['content-type'],'application/pdf');assert.equal((await h.request('/w/logout',{method:'POST',body:{},cookie:l.cookie})).status,200);assert.equal((await h.request('/w/asset/pdf',{cookie:l.cookie})).status,401);});
test('forged, expired and removed-allowlist sessions all fail closed',async()=>{const h=harness(),l=await h.login();assert.equal((await h.request('/w/asset/pdf',{cookie:'__Host-cnps_proposal='+randomBytes(32).toString('base64url')})).status,401);h.env.CNPS_PROPOSAL_ALLOWED_PHONES='';assert.equal((await h.request('/w/asset/pdf',{cookie:l.cookie})).status,401);h.env.CNPS_PROPOSAL_ALLOWED_PHONES=phone;h.advance(8*3600e3+1);assert.equal((await h.request('/w/asset/pdf',{cookie:l.cookie})).status,401);});
test('60 second cooldown is atomic under concurrent sends, and twenty sends/day max',async()=>{
 const h=harness();const req=()=>h.request('/w/send',{method:'POST',body:{phone,consent:true}});
 const responses=await Promise.all(Array.from({length:8},req));
 assert.equal(responses.filter(x=>x.status===200).length,1);assert.equal(h.sends(),1);
 for(let i=1;i<20;i++){h.advance(i===10?3600000:61000);assert.equal((await req()).status,200);}
 h.advance(61000);assert.equal((await req()).status,429);assert.equal(h.sends(),20);
});
test('expired challenge and SMS failure reveal no secret or provider diagnostics',async()=>{const h=harness(),c=await h.send();h.advance(300001);assert.equal((await h.request('/w/verify',{method:'POST',cookie:c.cookie,body:{challenge:c.id,code:'123456'}})).status,400);h.fail();const r=await h.request('/w/send',{method:'POST',body:{phone,consent:true}});assert.equal(r.status,503);assert.ok(!r.text.includes('provider'));assert.ok(!r.text.includes(phone));});
test('bad JSON, unsupported methods and unknown paths fail safely',async()=>{const h=harness();assert.equal((await h.request('/w/send',{method:'POST',body:'{'})).status,400);assert.equal((await h.request('/w/send',{method:'POST',body:{text:'x'.repeat(2100)}})).status,400);assert.equal((await h.request('/w',{method:'DELETE'})).status,405);assert.equal((await h.request('/w/unknown')).status,404);});
for(const [prefix,cap] of [['send-day:',200],['send-month:',3000]]) {
 test(`global ${prefix} cap is enforced before any provider send`,async()=>{
  const h=harness();await h.send();h.advance(61000);
  const key=[...h.limits.keys()].find(k=>k.startsWith(prefix));
  const quota=h.limits.get(key);quota.count=cap;
  const request=()=>h.request('/w/send',{method:'POST',body:{phone,consent:true}});
  assert.equal((await request()).status,429);assert.equal(h.sends(),1);
  quota.count=cap-1;
  assert.equal((await request()).status,200);assert.equal(h.sends(),2);
  h.advance(61000);assert.equal((await request()).status,429);
  assert.equal(h.sends(),2);assert.equal(quota.count,cap);
 });
}

test('proposal tracking separates login, visible view and download; HEAD/assets do not count',async()=>{
 const events=[];let revoked=false;const h=harness({async authorize(){if(revoked)throw Object.assign(Error(),{status:404})},async record(...args){events.push(args)}});
 const {cookie}=await h.login();assert.deepEqual(events.map(e=>e[1]),['login']);
 await h.request('/w',{cookie});await h.request('/w',{cookie,method:'HEAD'});assert.equal(events.length,1);
 await h.request('/w/view',{cookie,method:'POST',body:{}});assert.equal(events.at(-1)[1],'view');
 await h.request('/w/asset/pdf',{cookie,method:'HEAD'});assert.equal(events.length,2);
 await h.request('/w/asset/pdf',{cookie});assert.equal(events.at(-1)[1],'download');
 assert.equal((await h.request('/w/view',{method:'POST',body:{}})).status,401);
 assert.equal((await h.request('/w/view',{cookie,method:'POST',body:{},origin:'https://evil.example'})).status,403);
 revoked=true;for(const path of ['/w','/w/asset/pdf'])assert.equal((await h.request(path,{cookie})).status,403);
 assert.equal(events.length,3);
});
