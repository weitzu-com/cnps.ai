// Business details are private company-scoped records, not identity grants.
const invalid = message => { const error = new Error(message); error.status = 400; throw error; };
const allowed = (value, keys) => { if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) invalid('客户档案字段无效。'); };
function value(input, max = 300) { if (input === undefined) return ''; if (typeof input !== 'string' || input.length > max || /[\u0000-\u001f\u007f]/.test(input)) invalid('客户档案文本格式无效。'); return input.trim(); }
const email = input => { const result = value(input, 254); if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) invalid('电子邮箱格式无效。'); return result; };
const phone = input => { const result = value(input, 80).normalize('NFKC').replace(/[\s()-]/g, ''); if (result && !/^\+?\d{6,20}$/.test(result)) invalid('联系电话格式无效。'); return result; };
export function normalizeCustomerProfile(input) {
  allowed(input, ['legalName','creditCode','registeredAddress','businessPhone','website','invoice','addresses']);
  const result = { legalName:value(input.legalName), creditCode:value(input.creditCode,40).normalize('NFKC').toUpperCase().replace(/\s/g,''), registeredAddress:value(input.registeredAddress,500), businessPhone:phone(input.businessPhone), website:value(input.website), invoice:{}, addresses:[] };
  if (result.creditCode && !/^[0-9A-HJ-NP-RTUWXY]{18}$/.test(result.creditCode)) invalid('统一社会信用代码应为18位有效字符。');
  if(result.website){try{const url=new URL(/^https?:\/\//i.test(result.website)?result.website:'https://'+result.website);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error();result.website=url.href;}catch{invalid('公司网站格式无效。');}}
  const bill=input.invoice||{};allowed(bill,['type','title','taxId','address','phone','bankName','bankAccount','email']);
  result.invoice={type:value(bill.type,30)||'digital_general',title:value(bill.title),taxId:value(bill.taxId,40).normalize('NFKC').toUpperCase().replace(/\s/g,''),address:value(bill.address,500),phone:phone(bill.phone),bankName:value(bill.bankName),bankAccount:value(bill.bankAccount,80).normalize('NFKC').replace(/[\s-]/g,''),email:email(bill.email)};
  if(!['digital_general','digital_special','paper_general','paper_special'].includes(result.invoice.type))invalid('发票类型无效。');
  if(result.invoice.taxId&&!/^[A-Z0-9]{15,20}$/.test(result.invoice.taxId))invalid('纳税人识别号格式无效。');
  if(result.invoice.bankAccount&&!/^\d{6,40}$/.test(result.invoice.bankAccount))invalid('银行账号格式无效。');
  if(input.addresses!==undefined&&(!Array.isArray(input.addresses)||input.addresses.length>20))invalid('最多维护20个收件地址。');
  for(const item of input.addresses||[]){allowed(item,['id','label','recipient','phone','province','city','district','detail','postalCode','isDefault']);const address={};for(const key of ['id','label','recipient','province','city','district','detail','postalCode'])address[key]=value(item[key],key==='detail'?500:100);address.phone=phone(item.phone);if(typeof item.isDefault!=='boolean')invalid('默认地址设置无效。');address.isDefault=item.isDefault;if(!/^[a-zA-Z0-9-]{1,80}$/.test(address.id)||!address.recipient||!address.phone||!address.detail)invalid('收件地址需填写收件人、电话和详细地址。');if(address.postalCode&&!/^\d{6}$/.test(address.postalCode))invalid('邮政编码应为6位数字。');result.addresses.push(address);}
  if(new Set(result.addresses.map(item=>item.id)).size!==result.addresses.length)invalid('收件地址标识重复。');
  const addressKeys=result.addresses.map(item=>[item.recipient,item.phone,item.province,item.city,item.district,item.detail].join('|'));
  if(new Set(addressKeys).size!==addressKeys.length)invalid('收件人、电话和地址重复，请核对后保存。');
  if(result.addresses.length&&result.addresses.filter(item=>item.isDefault).length!==1)invalid('请设置且仅设置一个默认收件地址。');
  return result;
}
export function customerProfileIssues(profile) {
 const issues=[];if(!profile.legalName)issues.push('企业全称待补充');if(!profile.creditCode)issues.push('统一社会信用代码待补充');if(!profile.invoice.title||!profile.invoice.taxId)issues.push('开票抬头或税号待补充');if(!profile.invoice.email)issues.push('发票接收邮箱待补充');if(profile.invoice.type==='paper_special'&&(!profile.invoice.address||!profile.invoice.phone||!profile.invoice.bankName||!profile.invoice.bankAccount))issues.push('纸质专票地址电话、开户行及账号待补充');if(!profile.addresses.length)issues.push('收件地址待补充');return issues;
}
const aliases={公司名称:'legalName',企业名称:'legalName',企业全称:'legalName',统一社会信用代码:'creditCode',信用代码:'creditCode',注册地址:'registeredAddress',公司电话:'businessPhone',公司网站:'website',发票抬头:'invoice.title',开票名称:'invoice.title',税号:'invoice.taxId',纳税人识别号:'invoice.taxId',开票地址:'invoice.address',开票电话:'invoice.phone',开户行:'invoice.bankName',开户银行:'invoice.bankName',银行账号:'invoice.bankAccount',开户账号:'invoice.bankAccount',发票邮箱:'invoice.email',收票邮箱:'invoice.email',收件人:'recipient',收件电话:'recipientPhone',收件地址:'shippingDetail'};
export function parseCustomerProfileText(source) {
 if(typeof source!=='string'||source.length>12000)invalid('请粘贴不超过12000字的客户资料。');
 const fields={},conflicts=new Set();let ignored=0;
 for(const line of source.split(/\r?\n/)){if(!line.trim())continue;const match=line.match(/^\s*([^:：]{1,30})[:：]\s*(.+?)\s*$/);const key=match&&aliases[match[1].normalize('NFKC').trim()];if(!key){ignored++;continue;}if(Object.hasOwn(fields,key)&&fields[key]!==match[2]){delete fields[key];conflicts.add(key);}else if(!conflicts.has(key))fields[key]=match[2];}
 for(const key of ['creditCode','invoice.taxId','invoice.bankAccount','businessPhone','invoice.phone','recipientPhone'])if(fields[key])fields[key]=fields[key].normalize('NFKC');
 return {fields,conflicts:[...conflicts],ignored,notice:'识别结果仅为草稿；保存前请与客户确认。未识别内容不会写入档案。'};
}
