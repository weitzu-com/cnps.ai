import https from 'node:https';
import { isIP } from 'node:net';
import { AsyncLocalStorage } from 'node:async_hooks';
import { channel } from 'node:diagnostics_channel';
import httpx from 'httpx';
import Dypnsapi from '@alicloud/dypnsapi20170525';
import { $OpenApiUtil } from '@alicloud/openapi-core';
import * as Dara from '@darabonba/typescript';
import { observeCrmSmsTransport, crmSmsTransportFailure } from '../server/crm-sms-transport.mjs';

// TEMPORARY PREVIEW DIAGNOSTIC. Fixed anonymous endpoint only: no SMS Action,
// signing, environment credentials, phone number, response body or header log.
const HOST = 'dypnsapi.aliyuncs.com';
const safeCode = code => ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'EPIPE', 'ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_HAS_EXPIRED'].includes(code) ? code : 'network';
const probeScope = new AsyncLocalStorage();
const created = channel('http.client.request.created');

// Applies to every request, including those made inside the installed SDK.
// The scoped deadline destroys requests; it does not merely stop awaiting them.
async function withinDeadline(callback) {
  const pending = new Set(), cleanups = [];
  const scope = { deadlineExceeded: false };
  const observe = ({ request }) => {
    if (probeScope.getStore() !== scope || request.host !== HOST) return;
    pending.add(request);
    const closed = () => pending.delete(request);
    request.once('close', closed);
    cleanups.push(() => request.removeListener('close', closed));
  };
  created.subscribe(observe);
  const deadline = setTimeout(() => {
    scope.deadlineExceeded = true;
    for (const request of pending) request.destroy();
  }, 10500);
  try { return { results: await probeScope.run(scope, callback), deadlineExceeded: scope.deadlineExceeded }; }
  finally {
    clearTimeout(deadline);
    created.unsubscribe(observe);
    for (const request of pending) request.destroy();
    for (const cleanup of cleanups) cleanup();
  }
}

function native(method, family) {
  return new Promise(resolve => {
    const started = performance.now(), phases = {};
    let lastPhase = 'created', settled = false;
    const elapsed = () => Math.round(performance.now() - started);
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      resolve({ phases, lastPhase, elapsedMs: elapsed(), ...result });
    };
    const request = https.request({ host: HOST, path: '/', method, family, agent: false, timeout: 10000 }, response => {
      lastPhase = 'response-headers'; phases.responseHeadersMs = elapsed();
      response.on('error', () => {}); // Header receipt remains an observed fact.
      response.resume();
      finish({ httpStatus: response.statusCode });
    });
    const deadline = setTimeout(() => { finish({ error: 'absolute-deadline' }); request.destroy(); }, 10500);
    request.on('socket', socket => {
      socket.once('lookup', (error, address, addressFamily) => {
        if (error) { lastPhase = 'dns-error'; return; }
        lastPhase = 'dns'; phases.dnsMs = elapsed();
        if (addressFamily === 4 || addressFamily === 6) phases.family = addressFamily;
        if (isIP(address)) phases.resolvedAddress = address;
      });
      socket.once('connect', () => {
        lastPhase = 'tcp'; phases.tcpMs = elapsed();
        if (isIP(socket.remoteAddress)) phases.destinationAddress = socket.remoteAddress;
        if (socket.remoteFamily === 'IPv4' || socket.remoteFamily === 'IPv6') phases.destinationFamily = socket.remoteFamily;
      });
      socket.once('secureConnect', () => { lastPhase = 'tls'; phases.tlsMs = elapsed(); phases.tlsAuthorized = socket.authorized === true; });
    });
    request.once('error', error => finish({ error: safeCode(error.code) }));
    request.once('timeout', () => { finish({ error: 'socket-timeout' }); request.destroy(); });
    request.end();
  });
}

async function sdkTransport(method) {
  const started = performance.now();
  try {
    const response = await httpx.request(`https://${HOST}/`, { method, connectTimeout: 10000, readTimeout: 10000 });
    await httpx.read(response);
    return { httpStatus: response.statusCode, elapsedMs: Math.round(performance.now() - started) };
  } catch (error) {
    return { error: error?.name === 'RequestTimeoutError' ? 'socket-timeout' : safeCode(error?.code), elapsedMs: Math.round(performance.now() - started) };
  }
}

async function anonymousSdk() {
  const started = performance.now();
  const Client = Dypnsapi.default || Dypnsapi;
  // No credential object or credential-bearing environment is consulted.
  // Anonymous + a deliberately nonexistent Action cannot dispatch an SMS API.
  const client = new Client(new $OpenApiUtil.Config({ endpoint: HOST,
    protocol: 'HTTPS', userAgent: 'cnps-anonymous-transport-preview',
    connectTimeout: 10000, readTimeout: 10000,
    retryOptions: new Dara.RetryOptions({ retryable: false }) }));
  try {
    const result = await observeCrmSmsTransport(() => client.callApi(new $OpenApiUtil.Params({
      action: 'CnpsTransportProbeNoSuchAction', version: '2017-05-25', protocol: 'HTTPS',
      pathname: '/', method: 'POST', authType: 'Anonymous', style: 'RPC',
      reqBodyType: 'formData', bodyType: 'json'
    }), new $OpenApiUtil.OpenApiRequest({ query: {} }), new Dara.RuntimeOptions({})));
    const status = result?.statusCode;
    return { completed: true, ...(Number.isInteger(status) && status >= 100 && status <= 599 ? { httpStatus: status } : {}),
      elapsedMs: Math.round(performance.now() - started) };
  } catch (error) {
    const transport = crmSmsTransportFailure(error);
    const status = transport?.httpStatus ?? error?.statusCode;
    return { ...(Number.isInteger(status) && status >= 100 && status <= 599 ? { httpStatus: status } : {}),
      error: Number.isInteger(status) && status >= 100 && status <= 599 ? 'anonymous-http-response'
        : error?.name === 'RequestTimeoutError' ? 'socket-timeout' : safeCode(error?.code),
      elapsedMs: Math.round(performance.now() - started), transport };
  }
}

export function makeProbe(expectedRegion) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (process.env.VERCEL_ENV !== 'preview' || req.method !== 'GET') {
      res.statusCode = 404;
      return res.end();
    }
    const { results, deadlineExceeded } = await withinDeadline(() => Promise.all([
      native('GET'), native('POST'), sdkTransport('GET'), sdkTransport('POST'), native('GET', 4), anonymousSdk()
    ]));
    const [nativeGet, nativePost, transportGet, transportPost, ipv4, sdkAnonymous] = results;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ probeVersion: '20261016-v1', observedAt: new Date().toISOString(), expectedRegion,
      actualRegion: /^(?:sin1|sfo1|iad1)$/.test(process.env.VERCEL_REGION || '') ? process.env.VERCEL_REGION : 'unexpected-or-unknown', node: process.version,
      commit: /^[a-f0-9]{40}$/.test(process.env.VERCEL_GIT_COMMIT_SHA || '') ? process.env.VERCEL_GIT_COMMIT_SHA : 'unknown',
      nativeGet, nativePost, transportGet, transportPost, ipv4, sdkAnonymous, deadlineExceeded }));
  };
}
export default makeProbe('sin1');
