import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import { performance } from 'node:perf_hooks';
import { createCrmSms, crmSmsFailureCategory } from '../server/crm-auth-sms.mjs';

test('the real SMS SDK tolerates a response beyond five seconds and still sanitizes a genuine transport timeout without retries', { timeout: 15000 }, async t => {
  const env = {
    ALIYUN_ACCESS_KEY_ID: 'loopback-test-key', ALIYUN_ACCESS_KEY_SECRET: 'loopback-test-secret',
    ALIYUN_SMS_SIGN_NAME: 'loopback-test-sign', ALIYUN_SMS_TEMPLATE_CODE: 'loopback-test-template'
  };
  const phone = '18700001111';
  let received = 0, transportCalls = 0, timeoutEvents = 0, forceTimeout = false, rejectionCode, rejectionStatus;
  const sdkTimeouts = [];
  const timers = new Set();
  const server = http.createServer((request, response) => {
    received++;
    request.resume();
    if (forceTimeout) return; // Keep the real socket idle until Node emits timeout.
    if (rejectionCode) {
      response.writeHead(rejectionStatus, {'content-type': 'application/json'});
      response.end(JSON.stringify({Code: rejectionCode, Success: false, Message: `private ${phone} 123456`, RequestId: 'private-request', Model: {VerifyCode: '123456'}}));
      return;
    }
    const timer = setTimeout(() => {
      timers.delete(timer);
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ Code: 'OK', Success: true, RequestId: 'loopback-only' }));
    }, 5300);
    timers.add(timer);
    response.on('close', () => { clearTimeout(timer); timers.delete(timer); });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    for (const timer of timers) clearTimeout(timer);
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });

  const realHttpRequest = http.request;
  // httpx uses the shared CommonJS https object. Only its final transport call
  // is redirected; signing, generated SDK methods, parsing and timeout handling
  // remain real. Both exported transports are fenced off from external hosts.
  t.mock.method(http, 'request', () => { throw new Error('Unexpected HTTP transport'); });
  t.mock.method(https, 'request', (options, ...args) => {
    transportCalls++;
    assert.equal(options.host, 'dypnsapi.aliyuncs.com');
    sdkTimeouts.push(options.timeout);
    const request = realHttpRequest({
      ...options, host: '127.0.0.1', hostname: '127.0.0.1', port: server.address().port,
      protocol: 'http:', agent: false,
      // Exercise the genuine Node timeout event quickly in the failure case;
      // the successful 5.3s case above uses the production timeout unchanged.
      ...(forceTimeout ? { timeout: 75 } : {})
    }, ...args);
    request.on('timeout', () => { timeoutEvents++; });
    return request;
  });

  const sms = createCrmSms(env); // No injected provider client: use the installed SDK.
  const started = performance.now();
  await sms.send(phone, 'loopback-slow-success');
  const elapsed = performance.now() - started;
  assert.ok(elapsed >= 5200, 'a real delayed response must cross the former 5s limit');
  assert.equal(received, 1);
  assert.equal(transportCalls, 1, 'slow success must not cause a duplicate SMS request');
  assert.equal(timeoutEvents, 0);

  forceTimeout = true;
  await assert.rejects(() => sms.send(phone, 'loopback-timeout'), error => {
    assert.equal(error.message, 'SMS provider unavailable');
    assert.equal(crmSmsFailureCategory(error), 'timeout');
    assert.equal(error.cause, undefined);
    assert.deepEqual(Object.keys(error), []);
    assert.equal(JSON.stringify(error), '{}');
    for (const value of [phone, ...Object.values(env), 'dypnsapi.aliyuncs.com', 'loopback-timeout']) assert.ok(!error.message.includes(value));
    return true;
  });
  assert.equal(timeoutEvents, 1, 'the failure came from the real Node socket timer');
  assert.equal(received, 2);
  assert.equal(transportCalls, 2, 'timeout must not retry or duplicate the provider request');
  assert.deepEqual(sdkTimeouts, [10000, 10000], 'the SDK must pass the full response budget to Node');
  t.diagnostic(`Loopback response delay: 5300ms; observed success: ${Math.round(elapsed)}ms; requests: ${received}; real timeout events: ${timeoutEvents}.`);

  // Exercise both generated SDK response parsing and HTTP-error exceptions,
  // rather than assuming the injected-client shape matches the real SDK.
  forceTimeout = false;
  for (const [code, category] of [
    ['BUSINESS_LIMIT_CONTROL', 'rate-limit'], ['FREQUENCY_FAIL', 'rate-limit'],
    ['MOBILE_NUMBER_ILLEGAL', 'configuration'], ['INVALID_PARAMETERS', 'configuration'], ['FUNCTION_NOT_OPENED', 'configuration']
  ]) for (const status of [200, 400]) {
    rejectionCode = code; rejectionStatus = status;
    const before = transportCalls;
    await assert.rejects(() => sms.send(phone, 'loopback-rejection'), error => {
      assert.equal(error.reason, code);
      assert.equal(crmSmsFailureCategory(error), category);
      assert.equal(error.message, 'SMS provider unavailable');
      assert.equal(error.cause, undefined);
      assert.equal(JSON.stringify(error), '{}');
      return true;
    });
    assert.equal(transportCalls, before + 1, 'a rejected send must not retry');
    assert.equal(received, transportCalls);
  }
});
