import Dypnsapi from '@alicloud/dypnsapi20170525';
import OpenApi from '@alicloud/openapi-client';
const Client = Dypnsapi.default || Dypnsapi;
export function createSms(env) {
  for (const name of ['ALIYUN_ACCESS_KEY_ID','ALIYUN_ACCESS_KEY_SECRET','ALIYUN_SMS_SIGN_NAME','ALIYUN_SMS_TEMPLATE_CODE']) {
    if (!env[name]) throw new Error('SMS not configured');
  }
  const client = new Client(new OpenApi.Config({ accessKeyId:env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret:env.ALIYUN_ACCESS_KEY_SECRET, endpoint:'dypnsapi.aliyuncs.com',
    connectTimeout:5000, readTimeout:10000 }));
  const base = phone => ({ countryCode:'86', phoneNumber:phone, schemeName:'cnpsproposal' });
  return {
    async send(phone,id) {
      const {body} = await client.sendSmsVerifyCode(new Dypnsapi.SendSmsVerifyCodeRequest({
        ...base(phone), signName:env.ALIYUN_SMS_SIGN_NAME, templateCode:env.ALIYUN_SMS_TEMPLATE_CODE,
        templateParam:JSON.stringify({code:'##code##',min:'5'}), codeLength:6, validTime:300,
        duplicatePolicy:1, interval:60, codeType:1, returnVerifyCode:false, autoRetry:0, outId:id
      }));
      if (body?.code!=='OK' || body.success!==true) throw new Error('SMS send failed');
    },
    async verify(phone,code,id) {
      const {body} = await client.checkSmsVerifyCode(new Dypnsapi.CheckSmsVerifyCodeRequest({
        ...base(phone), verifyCode:code, outId:id
      }));
      return body?.code==='OK' && body.success===true && body.model?.verifyResult==='PASS';
    }
  };
}
