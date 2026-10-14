import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCustomerProfile,parseCustomerProfileText,customerProfileIssues} from '../server/crm-customer-profile.mjs';
const bad=error=>error.status===400;
test('full width text normalizes without dropping leading account digits or requiring optional banking data',()=>{
 const profile=normalizeCustomerProfile({legalName:'　Synthetic　',creditCode:'９１３１００００１３２２６３４８２Ｘ',invoice:{title:'Synthetic',taxId:'123456789012345',bankAccount:'００１２３４５６７８９０'}});assert.equal(profile.creditCode,'91310000132263482X');assert.equal(profile.invoice.bankAccount,'001234567890');assert.ok(!customerProfileIssues(profile).some(item=>item.includes('开户行')));
});
test('address defaults, foreign fields, invalid mail and account strings fail validation',()=>{
 const address={id:'A',recipient:'Synthetic',phone:'18700001111',detail:'Synthetic address',isDefault:true};
 for(const input of [{identity:'admin'},{invoice:{email:'bad'}},{invoice:{bankAccount:'123abc'}},{creditCode:'invalid'},{addresses:[{...address,isDefault:false}]},{addresses:[address,{...address,id:'B'}]},{addresses:[address,address]},{addresses:[{...address,postalCode:'12'}]}])assert.throws(()=>normalizeCustomerProfile(input),bad);
});
test('paste extraction marks conflicting values and does not guess unlabeled text',()=>{
 const result=parseCustomerProfileText('企业名称：First\n企业名称：Second\n公司名称：First\n开户行：Bank\n银行账号：001234567890\n未知内容：Do not import\nRandom words');assert.equal(result.fields.legalName,undefined);assert.deepEqual(result.conflicts,['legalName']);assert.equal(result.fields['invoice.bankAccount'],'001234567890');assert.equal(result.ignored,2);
});
