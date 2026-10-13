import test from 'node:test';import assert from 'node:assert/strict';import {createHash,createHmac} from 'node:crypto';import {createDeliveryChannels} from '../server/crm-delivery-channels.mjs';
const base={CNPS_PROPOSAL_SECRET:'0123456789abcdef'.repeat(4),CRM_MAIL_ACCESS_KEY_ID:'synthetic',CRM_MAIL_ACCESS_KEY_SECRET:'synthetic',CRM_MAIL_FROM:'crm@example.test'};
test('email and enterprise WeCom remain unavailable unless separate credentials exist',()=>{const channels=createDeliveryChannels({});assert.equal(channels.email.configured,false);assert.equal(channels.wecom.configured,false);});
test('email sends one fixed protected link, and matching receipt means recipient server acceptance only',async()=>{
 const calls=[];const channels=createDeliveryChannels(base,{redis:{async eval(){return 1;}},mailClient:{async callApi(params,request,runtime){calls.push({params,query:request.query,runtime});if(params.action==='SingleSendMail')return {body:{EnvId:'mail-one'}};return {body:{data:{mailDetail:[{AccountName:base.CRM_MAIL_FROM,ToAddress:'recipient@example.test',Subject:calls[0].query.Subject,Status:0}]}}};}}});
 const record=await channels.email.send({target:'recipient@example.test',link:'https://crm.cnps.ai/crm/workspace?deliveryId=one',deliveryId:'one',attempt:'attempt-one'});assert.equal(record.status,'submitted');assert.equal(calls[0].query.ToAddress,'recipient@example.test');assert.match(calls[0].query.TextBody,/链接转发不新增访问权限/);assert.equal(calls[0].runtime.autoretry,false);
 assert.equal((await channels.email.receipt({target:'recipient@example.test',record})).status,'delivered');assert.equal((await channels.email.receipt({target:'another@example.test',record})).status,'submitted');
});
test('email quotas stop send before external IO',async()=>{const channels=createDeliveryChannels(base,{redis:{async eval(){return 0;}},mailClient:{async callApi(){throw Error('Must not call');}}});assert.equal((await channels.email.send({target:'a@example.test',link:'https://crm.cnps.ai',deliveryId:'one',attempt:'one'})).status,'failed');});
test('direct mail signs ACS3 requests without the Aliyun OpenAPI SDK',async()=>{
 const calls=[];const channels=createDeliveryChannels(base,{redis:{async eval(){return 1;}},async fetchImpl(url,options){calls.push({url,options});return {ok:true,async json(){return {EnvId:'mail-native'};}};}});
 const record=await channels.email.send({target:'recipient@example.test',link:'https://crm.cnps.ai/crm/workspace?deliveryId=one',deliveryId:'one',attempt:'attempt-one'});
 assert.equal(record.status,'submitted');assert.equal(record.providerId,'mail-native');
 const url=new URL(calls[0].url),headers=calls[0].options.headers;
 assert.equal(url.host,'dm.aliyuncs.com');assert.equal(headers['x-acs-action'],'SingleSendMail');assert.equal(headers['x-acs-version'],'2015-11-23');
 assert.equal(url.searchParams.get('ToAddress'),'recipient@example.test');assert.equal(url.search.includes(base.CRM_MAIL_ACCESS_KEY_SECRET),false);
 assert.equal(calls[0].options.body,undefined);assert.equal(calls[0].options.signal instanceof AbortSignal,true);
 const encode=value=>encodeURIComponent(value).replace(/!/g,'%21').replace(/'/g,'%27').replace(/\(/g,'%28').replace(/\)/g,'%29').replace(/\*/g,'%2A');
 const query=[...url.searchParams.keys()].sort().map(key=>key+'='+encode(url.searchParams.get(key))).join('&');
 const signed=['host','x-acs-action','x-acs-content-sha256','x-acs-date','x-acs-signature-nonce','x-acs-version'];
 const canonicalHeaders=signed.map(key=>key+':'+headers[key]).join('\n');
 const payloadHash=createHash('sha256').update('').digest('hex');
 const canonical=['POST','/',query,canonicalHeaders,'',signed.join(';'),payloadHash].join('\n');
 const signature=createHmac('sha256',base.CRM_MAIL_ACCESS_KEY_SECRET).update('ACS3-HMAC-SHA256\n'+createHash('sha256').update(canonical).digest('hex')).digest('hex');
 assert.equal(headers.Authorization,`ACS3-HMAC-SHA256 Credential=${base.CRM_MAIL_ACCESS_KEY_ID},SignedHeaders=${signed.join(';')},Signature=${signature}`);
 const failed=createDeliveryChannels(base,{redis:{async eval(){return 1;}},async fetchImpl(){return {ok:false,async json(){return {Message:'secret mailbox'};}};}});
 await assert.rejects(()=>failed.email.send({target:'recipient@example.test',link:'https://crm.cnps.ai',deliveryId:'one',attempt:'two'}),{message:'Mail unavailable'});
});
test('WeCom only selects the verified external contact and waits for member execution',async()=>{
 const calls=[];const channels=createDeliveryChannels({...base,CRM_WECOM_CORP_ID:'corp-one',CRM_WECOM_CUSTOMER_SECRET:'synthetic-secret'},{redis:{async eval(){return 1;}},async fetchImpl(url,options){calls.push({url,options});let value;if(url.includes('gettoken'))value={errcode:0,access_token:'synthetic-token'};else if(url.includes('externalcontact/get?'))value={errcode:0,external_contact:{external_userid:'external-one'},follow_user:[{userid:'sender-one',remark_mobiles:['18700001111']}]};else if(url.includes('add_msg_template'))value={errcode:0,msgid:'message-one',fail_list:[]};else value={errcode:0,send_list:[{external_userid:'external-one',status:1}]};return{ok:true,async json(){return value;}};}});
 const binding={externalUserId:'external-one',senderUserId:'sender-one'};const result=await channels.wecom.send({binding,phone:'18700001111',link:'https://crm.cnps.ai'});assert.equal(result.status,'pending_member');
 const body=JSON.parse(calls.find(c=>c.url.includes('add_msg_template')).options.body);assert.deepEqual(body.external_userid,['external-one']);assert.equal(body.allow_select,false);
 assert.equal((await channels.wecom.receipt({binding,record:result})).status,'sent');assert.equal(await channels.wecom.verifyBinding(binding,'18700002222'),false);
});
