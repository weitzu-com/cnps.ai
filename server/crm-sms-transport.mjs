import { AsyncLocalStorage } from 'node:async_hooks';
import { channel } from 'node:diagnostics_channel';
import { performance } from 'node:perf_hooks';

// This observes Node's actual request without altering transport, deadlines or
// retry behavior. The channel is subscribed only while provider calls exist.
const requests = channel('http.client.request.created');
const calls = new AsyncLocalStorage();
const failures = new WeakMap();
const stages = ['unknown', 'request-created', 'socket-assigned', 'dns-lookup', 'tcp-connected', 'tls-connected', 'response'];
let active = 0;
const elapsed = start => Math.min(120000, Math.max(0, Math.round(performance.now() - start)));

function observeRequest(message) {
  // Diagnostics must never turn an otherwise valid authentication call into a
  // failure, including if an unsupported publisher uses a different payload.
  try { observeNodeRequest(message?.request); } catch {}
}

function observeNodeRequest(request) {
  const call = calls.getStore();
  if (!call || call.finished) return;
  // Never inspect headers, path, payload or error objects. Only this fixed
  // provider host is eligible, even inside the async provider context.
  try { if (request?.host !== 'dypnsapi.aliyuncs.com') return; } catch { return; }
  const state = { lastStage: 'request-created', requestMs: elapsed(call.start) };
  call.count++;
  call.last = state;
  const mark = (stage, key) => {
    if (call.finished) return;
    if (state[key] === undefined) state[key] = elapsed(call.start);
    if (stages.indexOf(stage) > stages.indexOf(state.lastStage)) state.lastStage = stage;
  };
  const listen = (target, event, listener) => {
    const guarded = (...args) => { try { listener(...args); } catch {} };
    target.once(event, guarded);
    call.cleanup.push(() => { try { target.removeListener(event, guarded); } catch {} });
  };
  listen(request, 'socket', socket => {
    mark('socket-assigned', 'socketMs');
    state.reusedSocket = request.reusedSocket === true;
    // A reused connection has no new DNS/TCP/TLS phase for this request.
    if (!state.reusedSocket) {
      listen(socket, 'lookup', (_error, _address, _family) => {
        mark('dns-lookup', 'lookupMs');
        state.dnsResolved = _error == null;
      });
      listen(socket, 'connect', () => {
        mark('tcp-connected', 'connectMs');
        // DNS candidates do not prove which address family actually connected.
        if (socket.remoteFamily === 'IPv4') state.family = 4;
        else if (socket.remoteFamily === 'IPv6') state.family = 6;
      });
      listen(socket, 'secureConnect', () => mark('tls-connected', 'secureConnectMs'));
    }
    listen(socket, 'timeout', () => { if (!call.finished && state.timeoutMs === undefined) state.timeoutMs = elapsed(call.start); });
  });
  listen(request, 'timeout', () => { if (!call.finished && state.timeoutMs === undefined) state.timeoutMs = elapsed(call.start); });
  listen(request, 'response', response => {
    mark('response', 'responseMs');
    const status = response.statusCode;
    if (Number.isInteger(status) && status >= 100 && status <= 599) state.httpStatus = status;
  });
}

export async function observeCrmSmsTransport(callback) {
  const call = { start: performance.now(), count: 0, cleanup: [], finished: false };
  if (active++ === 0) requests.subscribe(observeRequest);
  try {
    return await calls.run(call, callback);
  } catch (error) {
    // Only this module can associate a summary with an error. A provider's
    // forged .transport/.diagnostic fields or getters are never consulted.
    if (error !== null && (typeof error === 'object' || typeof error === 'function')) {
      failures.set(error, Object.freeze({ observed: call.count > 0, requestCount: call.count,
        elapsedMs: elapsed(call.start), ...(call.last || { lastStage: 'unknown' }) }));
    }
    throw error;
  } finally {
    call.finished = true;
    for (const remove of call.cleanup) remove();
    call.cleanup.length = 0;
    call.last = undefined;
    if (--active === 0) requests.unsubscribe(observeRequest);
  }
}

// Missing channel events mean unknown; they do not prove a DNS/TCP/TLS phase.
export const crmSmsTransportFailure = error => failures.get(error);
