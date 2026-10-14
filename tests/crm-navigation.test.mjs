import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCrmReturnTo, crmLoginUrl } from '../server/crm-navigation.mjs';
import pageHandler from '../api/crm-page.js';

test('CRM return targets preserve only supported routes and validated queries', () => {
  assert.equal(sanitizeCrmReturnTo('/crm/workspace?companyId=c1&deliveryId=d1&projectId=p1&evil=1'), '/crm/workspace?companyId=c1&deliveryId=d1&projectId=p1');
  assert.equal(sanitizeCrmReturnTo('/demo/wasion/search?q=smart%20meter&returnTo=https://evil.test'), '/demo/wasion/search?q=smart+meter');
  assert.equal(sanitizeCrmReturnTo('/demo/wasion/products?evil=1#part'), '/demo/wasion/products#part');
  assert.equal(sanitizeCrmReturnTo('/demo/wasion/search?q=' + 'x'.repeat(501)), '/demo/wasion/search');
  assert.equal(sanitizeCrmReturnTo('/demo/wasion/search?q=%00bad'), null);
  assert.equal(new URL(crmLoginUrl('/demo/wasion/search?q=smart+meter'), 'https://crm.cnps.ai').searchParams.get('returnTo'), '/demo/wasion/search?q=smart+meter');
});

test('untrusted URLs cannot escape the CRM return allowlist', () => {
  for (const value of [undefined, {}, ['x'], '/crm', 'https://crm.cnps.ai/demo/wasion', '//evil.test/demo/wasion', '/\\evil.test', '/demo/wasion/%2f%2fevil', '/demo/wasion/../crm', '/demo/wasion\n', '/demo/wasion search', '/demo/wasion?x=' + 'a'.repeat(4096)]) {
    assert.equal(sanitizeCrmReturnTo(value), null, String(value));
    assert.equal(crmLoginUrl(value), '/crm', String(value));
  }
});

test('the login page API serializes only a safe return target', async () => {
  for (const [returnTo, expected] of [['/demo/wasion/search?q=</script>', '/demo/wasion/search?q=%3C%2Fscript%3E'], ['//evil.test', null]]) {
    const headers = {};
    let html;
    const res = { setHeader: (name, value) => { headers[name] = value; }, end: value => { html = value; } };
    await pageHandler({headers:{host:'crm.cnps.ai'},method: 'GET', url: '/crm?returnTo=' + encodeURIComponent(returnTo)}, res);
    assert.equal(res.statusCode, 200);
    assert.match(headers['Cache-Control'], /no-store/);
    assert.ok(html.includes('const returnTo = ' + JSON.stringify(expected) + ';'));
    assert.equal((html.match(/<\/script>/g) || []).length, 1);
  }
});
