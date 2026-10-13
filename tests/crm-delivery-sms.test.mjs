import test from 'node:test';import assert from 'node:assert/strict';import {createDeliverySms} from '../server/crm-delivery-sms.mjs';
test('notification template and key are separate from login OTP and fail closed',()=>{assert.equal(createDeliverySms({ALIYUN_SMS_TEMPLATE_CODE:'100001',ALIYUN_ACCESS_KEY_ID:'login-only'}).configured,false);});
test('notification has global quota, fixed approved content, no OTP or confidential text, no blind retries',async()=>{
 let sent;const env={CNPS_PROPOSAL_SECRET:'0123456789abcdef'.repeat(4),CRM_NOTIFY_ACCESS_KEY_ID:'synthetic-key',CRM_NOTIFY_ACCESS_KEY_SECRET:'synthetic-secret',CRM_NOTIFY_SIGN_NAME:'Synthetic',CRM_NOTIFY_TEMPLATE_CODE:'SMS_12345'};
 const client={async sendSms(request){sent=request;return {body:{code:'OK',bizId:'synthetic-biz'}};}};
 const sms=createDeliverySms(env,{client,redis:{async eval(){return 1;}}});const result=await sms.send('18700001111','delivery-one');assert.equal(result.status,'submitted');assert.equal(sent.templateParam,undefined);assert.equal(sent.phoneNumbers,'18700001111');assert.equal(sent.outId,'delivery-one');
 const blocked=createDeliverySms(env,{client:{async sendSms(){throw Error('must not send');}},redis:{async eval(){return 0;}}});assert.equal((await blocked.send('18700001111','delivery-one')).reason,'monthly_limit');
});
