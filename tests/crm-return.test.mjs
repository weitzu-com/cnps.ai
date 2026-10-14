import test from 'node:test';
import assert from 'node:assert/strict';
import { safeCrmReturnTo, crmLoginUrl, crmPageReturnTo, demoReturnTo } from '../server/crm-return.mjs';

test('Demo and workspace destinations preserve path, query and fragment', () => {
  for (const path of ['/demo/wasion', '/demo/wasion/search?q=smart%20meter#results', '/crm/workspace?companyId=A&deliveryId=B']) {
    assert.equal(safeCrmReturnTo(path), path);
    assert.equal(crmPageReturnTo(crmLoginUrl(path)), path);
  }
  assert.equal(safeCrmReturnTo('http://crm.cnps.ai/demo/wasion'), '/demo/wasion');
  assert.equal(crmPageReturnTo('/crm?companyId=A&deliveryId=B'), '/crm/workspace?companyId=A&deliveryId=B');
});
test('untrusted return destinations cannot redirect outside the portal or back to login', () => {
  for (const path of ['https://evil.example/demo/wasion', '//evil.example/demo/wasion', '//crm.cnps.ai@evil.example/demo/wasion', 'javascript:alert(1)', '/crm', '/api/crm', '/crm/../crm', '/demo/wasion/../../crm', '/demo/wasion\\evil', '/demo/wasion?q=%0d%0aLocation:evil', 'https://crm.cnps.ai:444/demo/wasion', 'https://user@crm.cnps.ai/demo/wasion']) {
    assert.equal(safeCrmReturnTo(path), null, path);
    assert.equal(crmLoginUrl(path), '/crm', path);
  }
});
test('Vercel rewritten and original Demo URLs both retain their destination', () => {
  assert.equal(demoReturnTo({url:'/demo/wasion/products?category=water'}), '/demo/wasion/products?category=water');
  assert.equal(demoReturnTo({url:'/api/crm-wasion-demo-page?slug=search&q=meters',query:{slug:'search',q:'meters'}}), '/demo/wasion/search?q=meters');
  assert.equal(demoReturnTo({url:'/api/crm-wasion-demo-page',query:{slug:'home'}}), '/demo/wasion');
});
