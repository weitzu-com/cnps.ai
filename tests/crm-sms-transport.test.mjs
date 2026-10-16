import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { channel } from 'node:diagnostics_channel';
import { observeCrmSmsTransport, crmSmsTransportFailure } from '../server/crm-sms-transport.mjs';
import { createCrmSms } from '../server/crm-auth-sms.mjs';

const providerHost = 'dypnsapi.aliyuncs.com';
const lookup = (_hostname, _options, callback) => setImmediate(() => callback(null, '127.0.0.1', 4));
async function listen(t, server) {
  const sockets = new Set();
  server.on('connection', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(async () => { for (const socket of sockets) socket.destroy(); server.closeAllConnections?.(); await new Promise(resolve => server.close(resolve)); });
  return server.address().port;
}
function request(port, { hostname = providerHost, agent = false, timeout, secure = false, onRequest = () => {}, ...options } = {}) {
  return new Promise((resolve, reject) => {
    const req = (secure ? https : http).request({ hostname, port, lookup, family: 4, autoSelectFamily: false, agent, timeout, ...options }, response => {
      response.resume(); response.once('end', resolve);
    });
    req.once('error', reject);
    req.once('timeout', () => req.destroy(Object.assign(new Error('loopback timeout'), { code: 'ETIMEDOUT' })));
    onRequest(req);
    req.end();
  });
}
async function observeFailure(callback, error = new Error('local sentinel')) {
  try { await observeCrmSmsTransport(async () => { await callback(); throw error; }); }
  catch (caught) { assert.equal(caught, error); return crmSmsTransportFailure(caught); }
  assert.fail('the local sentinel must be thrown');
}
function assertSummary(summary) {
  const allowed = new Set(['observed', 'requestCount', 'elapsedMs', 'lastStage', 'requestMs', 'socketMs', 'lookupMs', 'connectMs', 'secureConnectMs', 'responseMs', 'timeoutMs', 'reusedSocket', 'httpStatus', 'family', 'dnsResolved']);
  for (const [key, value] of Object.entries(summary)) {
    assert.ok(allowed.has(key), key);
    if (key.endsWith('Ms')) assert.ok(Number.isInteger(value) && value >= 0 && value <= 120000, key);
  }
  assert.equal(Object.isFrozen(summary), true);
}

test('real loopback requests distinguish first and reused sockets and clean listeners', async t => {
  const port = await listen(t, http.createServer((_req, res) => res.end('ok')));
  const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
  t.after(() => agent.destroy());
  let firstRequest, secondRequest;
  const first = await observeFailure(() => request(port, { agent, onRequest: req => { firstRequest = req; } }));
  const second = await observeFailure(() => request(port, { agent, onRequest: req => { secondRequest = req; } }));
  for (const summary of [first, second]) {
    assertSummary(summary);
    assert.equal(summary.observed, true);
    assert.equal(summary.requestCount, 1);
    assert.equal(summary.httpStatus, 200);
    assert.equal(summary.lastStage, 'response');
    assert.equal(summary.secureConnectMs, undefined, 'plain HTTP is not a TLS success');
  }
  assert.equal(first.reusedSocket, false);
  assert.equal(first.family, 4);
  assert.equal(first.dnsResolved, true);
  assert.equal(typeof first.lookupMs, 'number');
  assert.equal(typeof first.connectMs, 'number');
  assert.equal(second.reusedSocket, true);
  for (const name of ['lookupMs', 'connectMs', 'secureConnectMs', 'family', 'dnsResolved']) assert.equal(second[name], undefined);
  assert.equal(firstRequest.socket, secondRequest.socket);
  for (const req of [firstRequest, secondRequest]) {
    assert.equal(req.listenerCount('socket'), 0);
    assert.equal(req.listenerCount('response'), 0);
    assert.equal(req.listenerCount('timeout'), 1, 'only the test timeout handler remains');
    for (const event of ['lookup', 'connect', 'secureConnect', 'timeout']) {
      assert.ok(!req.socket.listeners(event).some(listener => listener.name === 'guarded'), `observer socket ${event} listener removed`);
    }
  }
});

test('real idle response and TLS handshake timeouts preserve the last observed phase', async t => {
  const httpPort = await listen(t, http.createServer(() => {}));
  let requestFailure;
  try { await observeCrmSmsTransport(() => request(httpPort, { timeout: 40 })); } catch (error) { requestFailure = error; }
  const responseTimeout = crmSmsTransportFailure(requestFailure);
  assertSummary(responseTimeout);
  assert.equal(responseTimeout.lastStage, 'tcp-connected');
  assert.equal(responseTimeout.httpStatus, undefined);
  assert.equal(typeof responseTimeout.timeoutMs, 'number');
  assert.equal(responseTimeout.secureConnectMs, undefined);

  const sockets = new Set();
  const tlsPort = await listen(t, net.createServer(socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); }));
  t.after(() => { for (const socket of sockets) socket.destroy(); });
  let tlsFailure;
  try { await observeCrmSmsTransport(() => request(tlsPort, { secure: true, timeout: 40 })); } catch (error) { tlsFailure = error; }
  const tlsTimeout = crmSmsTransportFailure(tlsFailure);
  assertSummary(tlsTimeout);
  assert.equal(tlsTimeout.lastStage, 'tcp-connected');
  assert.equal(tlsTimeout.secureConnectMs, undefined, 'TCP acceptance does not prove TLS completion');
  assert.equal(typeof tlsTimeout.timeoutMs, 'number');
});

test('a failed lookup does not claim TCP or TLS completion, and missed lookup events are not inferred', async t => {
  const port = await listen(t, http.createServer((_req, res) => res.end('ok')));
  let lookupFailure;
  try {
    await observeCrmSmsTransport(() => request(port, { lookup: (_hostname, _options, callback) => {
      setImmediate(() => callback(Object.assign(new Error('local lookup failure'), { code: 'ENOTFOUND' })));
    } }));
  } catch (error) { lookupFailure = error; }
  const failed = crmSmsTransportFailure(lookupFailure);
  assert.equal(failed.lastStage, 'dns-lookup');
  assert.equal(failed.dnsResolved, false);
  assert.equal(typeof failed.lookupMs, 'number');
  for (const name of ['family', 'connectMs', 'secureConnectMs', 'responseMs', 'httpStatus']) assert.equal(failed[name], undefined);

  const synchronous = await observeFailure(() => request(port, {
    lookup: (_hostname, _options, callback) => callback(null, '127.0.0.1', 4)
  }));
  assert.equal(synchronous.lastStage, 'response');
  assert.equal(typeof synchronous.connectMs, 'number');
  assert.equal(synchronous.lookupMs, undefined, 'the synchronous event happened before the socket listener existed');
  assert.equal(synchronous.family, 4, 'the connected socket supplies the actual family even without a lookup event');
  assert.equal(synchronous.dnsResolved, undefined);
});

test('concurrent provider contexts ignore other hosts and requests outside their context', async t => {
  const port = await listen(t, http.createServer((req, res) => {
    const delayed = req.url === '/delayed';
    setTimeout(() => { res.statusCode = delayed ? 503 : 201; res.end('ok'); }, delayed ? 30 : 1);
  }));
  const [slow, fast, ignored] = await Promise.all([
    observeFailure(async () => { await request(port, { path: '/delayed' }); await request(port, { hostname: '127.0.0.1' }); }),
    observeFailure(() => request(port)),
    observeFailure(() => request(port, { hostname: '127.0.0.1' })),
    request(port)
  ]);
  assert.equal(slow.requestCount, 1);
  assert.equal(slow.httpStatus, 503);
  assert.equal(fast.requestCount, 1);
  assert.equal(fast.httpStatus, 201);
  assert.equal(ignored.observed, false);
  assert.equal(ignored.requestCount, 0);
  assert.equal(ignored.lastStage, 'unknown');
});

test('missing channel events stay unknown and hostile provider diagnostics are never read', async () => {
  let privateReads = 0;
  const hostile = new Proxy({}, { get() { privateReads++; throw new Error('must not inspect'); } });
  let caught;
  try { await observeCrmSmsTransport(() => { throw hostile; }); } catch (error) { caught = error; }
  assert.equal(caught, hostile);
  const unknown = crmSmsTransportFailure(hostile);
  assert.equal(privateReads, 0);
  assert.deepEqual({ ...unknown, elapsedMs: 0 }, { observed: false, requestCount: 0, elapsedMs: 0, lastStage: 'unknown' });
  const forged = { transport: unknown, diagnostic: unknown };
  assert.equal(crmSmsTransportFailure(forged), undefined);
  assert.equal(crmSmsTransportFailure(null), undefined);
  assert.equal(crmSmsTransportFailure('error'), undefined);

  const env = { ALIYUN_ACCESS_KEY_ID: 'fixture', ALIYUN_ACCESS_KEY_SECRET: 'fixture', ALIYUN_SMS_SIGN_NAME: 'fixture', ALIYUN_SMS_TEMPLATE_CODE: 'fixture' };
  let allowedReads = 0;
  const source = new Proxy({}, { get(_target, key) {
    if (key === 'code' || key === 'name') { allowedReads++; return key === 'code' ? 'ETIMEDOUT' : 'Error'; }
    privateReads++; throw new Error('private provider data');
  } });
  const sms = createCrmSms(env, { client: { async sendSmsVerifyCode() { throw source; } } });
  await assert.rejects(() => sms.send('18700001111', 'local-fixture'), error => {
    assert.equal(error.reason, 'ETIMEDOUT');
    assert.equal(crmSmsTransportFailure(error).lastStage, 'unknown');
    assert.deepEqual(Object.keys(error), []);
    return true;
  });
  assert.equal(privateReads, 0);
  assert.ok(allowedReads > 0);
});

test('subscriptions and socket listeners are removed when provider callbacks fail before response', async t => {
  const dc = channel('http.client.request.created');
  const initialSubscribers = dc.hasSubscribers;
  const port = await listen(t, http.createServer(() => {}));
  let pending;
  await observeFailure(() => { pending = http.request({ hostname: providerHost, port, lookup, family: 4, autoSelectFamily: false }); });
  assert.equal(pending.listenerCount('socket'), 0);
  assert.equal(pending.listenerCount('response'), 0);
  assert.equal(pending.listenerCount('timeout'), 0);
  pending.once('error', () => {});
  pending.destroy();
  assert.equal(dc.hasSubscribers, initialSubscribers);
});

test('unexpected channel messages and private request fields cannot affect provider control flow', async () => {
  let reads = 0;
  const dc = channel('http.client.request.created');
  const unexpected = new Proxy({}, { get() { reads++; throw new Error('unknown channel payload'); } });
  assert.equal(await observeCrmSmsTransport(() => { dc.publish(unexpected); return 'unchanged'; }), 'unchanged');
  const ignored = new Proxy({ host: 'other-provider.invalid' }, { get(target, key) {
    if (key === 'host') return target.host;
    throw new Error('private request field');
  } });
  const summary = await observeFailure(() => dc.publish({ request: ignored }));
  assert.equal(summary.observed, false);
  assert.equal(reads, 1);
});
