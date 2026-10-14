import test from 'node:test';
import assert from 'node:assert/strict';
import { safeCrmReturnTo, crmLoginUrl, crmPageReturnTo, demoReturnTo } from '../server/crm-return.mjs';

test('Demo and workspace destinations preserve allowed path, query and fragment', () => {
  for (const path of ['/demo/wasion', '/demo/wasion/search?q=smart+meter#results', '/workspace?companyId=A&deliveryId=B']) {
    assert.equal(safeCrmReturnTo(path), path);
    assert.equal(crmPageReturnTo(crmLoginUrl(path)), path);
  }
  assert.equal(safeCrmReturnTo('http://crm.cnps.ai/demo/wasion'), null);
  assert.equal(crmPageReturnTo('/crm?companyId=A&projectId=P'), '/workspace?companyId=A&projectId=P');
  assert.equal(crmPageReturnTo('/crm?companyId=A&deliveryId=B'), '/workspace?companyId=A&deliveryId=B');
});
test('untrusted return destinations cannot redirect outside the portal or back to login', () => {
  for (const path of ['https://evil.example/demo/wasion', '//evil.example/demo/wasion', '//crm.cnps.ai@evil.example/demo/wasion', 'javascript:alert(1)', '/crm', '/api/crm', '/crm/../crm', '/demo/wasion/../../crm', '/demo/wasion\\evil', '/demo/wasion?q=%0d%0aLocation:evil', 'https://crm.cnps.ai:444/demo/wasion', 'https://user@crm.cnps.ai/demo/wasion']) {
    assert.equal(safeCrmReturnTo(path), null, path);
    assert.equal(crmLoginUrl(path), '/', path);
  }
});
test('Vercel rewritten and original Demo URLs both retain their destination', () => {
  assert.equal(demoReturnTo({url:'/demo/wasion/search?q=meters&slug=search',query:{slug:'search',q:'meters'}}), '/demo/wasion/search?q=meters');
  assert.equal(demoReturnTo({url:'/demo/wasion/products?category=water'}), '/demo/wasion/products');
  assert.equal(demoReturnTo({url:'/api/crm-wasion-demo-page?slug=search&q=meters',query:{slug:'search',q:'meters'}}), '/demo/wasion/search?q=meters');
  assert.equal(demoReturnTo({url:'/api/crm-wasion-demo-page',query:{slug:'home'}}), '/demo/wasion');
});
