import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { GROUP, MEMBER, recover, controller, retireOwned } from '../scripts/crm-download-route.mjs';

function fixture(original = '') {
  const data = {
    rules: [{ type: 'Domain', payload: 'crm.cnps.ai', proxy: GROUP }, { type: 'Match', payload: '', proxy: 'Other' }],
    config: { mode: 'rule', ipv6: false },
    proxies: { [GROUP]: { type: 'Fallback', all: ['DIRECT', MEMBER], fixed: original, now: original || 'DIRECT', testUrl: 'https://example.invalid/' },
      [MEMBER]: { type: 'Vmess', alive: true, udp: true }, DIRECT: { type: 'Direct', alive: true }, Other: { type: 'Selector', all: ['DIRECT'], now: 'DIRECT' } },
  };
  const writes = [];
  const call = async (method, endpoint, body) => {
    if (method === 'GET') return structuredClone(endpoint === '/rules' ? { rules: data.rules } : endpoint === '/proxies' ? { proxies: data.proxies } : data.config);
    writes.push({ method, endpoint, body });
    assert.equal(endpoint, '/proxies/' + encodeURIComponent(GROUP));
    data.proxies[GROUP].fixed = method === 'DELETE' ? '' : body.name;
    data.proxies[GROUP].now = data.proxies[GROUP].fixed || 'DIRECT';
    return null;
  };
  return { data, writes, call };
}
async function context(t, original = '') {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'crm-route-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return { ...fixture(original), options: { statePath: path.join(directory, 'state.json'), controllerId: 'local-fixture', verifySource: () => ({ sourceBlob: 'fixture' }) } };
}

test('default check is read-only and exposes no raw controller configuration', async t => {
  const f = await context(t);
  const result = await recover({ ...f.options, call: f.call });
  assert.equal(result.mutation, false); assert.equal(f.writes.length, 0);
  assert.equal(JSON.stringify(result).includes('example.invalid'), false);
  assert.equal(Object.keys(result.before.hashes).length, 5);
});

test('apply mutates only exact existing group; repeat is idempotent; empty original restores with DELETE', async t => {
  const f = await context(t);
  const applied = await recover({ ...f.options, call: f.call, action: 'apply' });
  assert.equal(applied.after.fixed, MEMBER); assert.deepEqual(applied.before.hashes, applied.after.hashes);
  assert.deepEqual(f.writes, [{ method: 'PUT', endpoint: '/proxies/' + encodeURIComponent(GROUP), body: { name: MEMBER } }]);
  const repeat = await recover({ ...f.options, call: f.call, action: 'apply' }); assert.equal(repeat.mutation, false);
  await recover({ ...f.options, call: f.call, action: 'restore' });
  assert.equal(f.writes.at(-1).method, 'DELETE'); assert.equal(f.writes.at(-1).body, undefined);
  const restored = await recover({ ...f.options, call: f.call, action: 'restore' }); assert.equal(restored.mutation, false);
  assert.equal(JSON.parse(await readFile(f.options.statePath)).originalFixed, '');
});

test('restore uses saved original fixed member, never caller-supplied name', async t => {
  const f = await context(t, 'DIRECT');
  await recover({ ...f.options, call: f.call, action: 'apply' });
  await recover({ ...f.options, call: f.call, action: 'restore' });
  assert.deepEqual(f.writes.at(-1).body, { name: 'DIRECT' });
  const state = JSON.parse(await readFile(f.options.statePath)); state.group = 'Other';
  await writeFile(f.options.statePath, JSON.stringify(state));
  await assert.rejects(recover({ ...f.options, call: f.call, action: 'restore' }), /scope invalid/);
  assert.equal(f.writes.length, 2);
});

for (const [name, change] of [
  ['non-target rule shares group', d => d.rules.push({ type: 'Domain', payload: 'other.invalid', proxy: GROUP })],
  ['duplicate CRM rule', d => d.rules.push({ type: 'Domain', payload: 'crm.cnps.ai', proxy: 'DIRECT' })],
  ['wrong group type', d => { d.proxies[GROUP].type = 'Selector'; }],
  ['missing member', d => { d.proxies[GROUP].all = ['DIRECT']; }],
  ['dead member', d => { d.proxies[MEMBER].alive = false; }],
  ['another group references target', d => { d.proxies.Other.all.push(GROUP); }],
  ['global mode', d => { d.config.mode = 'global'; }],
  ['missing fixed field', d => { delete d.proxies[GROUP].fixed; }],
]) test('unsafe precondition fails without writes: ' + name, async t => {
  const f = await context(t); change(f.data);
  await assert.rejects(recover({ ...f.options, call: f.call, action: 'apply' })); assert.equal(f.writes.length, 0);
});

test('unmerged source and missing restore baseline fail before writes', async t => {
  const f = await context(t);
  await assert.rejects(recover({ ...f.options, call: f.call, action: 'apply', verifySource: () => { throw new Error('not merged'); } }), /not merged/);
  await assert.rejects(recover({ ...f.options, call: f.call, action: 'restore' }), /saved recovery state/);
  assert.equal(f.writes.length, 0);
});

test('readback drift fails and only target selection is rolled back', async t => {
  const f = await context(t); let first = true;
  const call = async (...args) => { const r = await f.call(...args); if (args[0] === 'PUT' && first) { first = false; f.data.proxies.Other.now = MEMBER; } return r; };
  await assert.rejects(recover({ ...f.options, call, action: 'apply' }), /verification failed/);
  assert.deepEqual(f.writes.map(x => x.method), ['PUT', 'DELETE']);
  assert.equal(f.data.proxies[GROUP].fixed, ''); assert.equal(f.data.proxies.Other.now, MEMBER);
});

test('saved protected-state drift refuses additional mutations', async t => {
  const f = await context(t); await recover({ ...f.options, call: f.call, action: 'apply' });
  f.data.config.ipv6 = true;
  await assert.rejects(recover({ ...f.options, call: f.call, action: 'restore' }), /protected controller state changed/);
  assert.equal(f.writes.length, 1);
});

test('built-in GLOBAL may contain target only while rule mode leaves it unselected and unreferenced', async t => {
  const f = await context(t);
  f.data.proxies.GLOBAL = { type: 'Selector', all: ['DIRECT', GROUP], now: 'DIRECT' };
  const result = await recover({ ...f.options, call: f.call, action: 'apply' });
  assert.deepEqual(result.before.hashes, result.after.hashes);
  assert.equal(f.data.proxies.GLOBAL.now, 'DIRECT');
  assert.deepEqual(f.data.proxies.GLOBAL.all, ['DIRECT', GROUP]);
});

for (const [name, change] of [
  ['GLOBAL selects CRM', d => { d.proxies.GLOBAL.now = GROUP; }],
  ['GLOBAL is not built-in Selector', d => { d.proxies.GLOBAL.type = 'Fallback'; }],
  ['rule routes through GLOBAL', d => { d.rules[1].proxy = 'GLOBAL'; }],
  ['GLOBAL mode active', d => { d.config.mode = 'global'; }],
]) test('unsafe GLOBAL precondition has zero writes: ' + name, async t => {
  const f = await context(t); f.data.proxies.GLOBAL = { type: 'Selector', all: ['DIRECT', GROUP], now: 'DIRECT' }; change(f.data);
  await assert.rejects(recover({ ...f.options, call: f.call, action: 'apply' })); assert.equal(f.writes.length, 0);
});

test('preexisting baseline hash mismatch fails before writes', async t => {
  const f = await context(t); await recover({ ...f.options, call: f.call, action: 'apply' });
  const state = JSON.parse(await readFile(f.options.statePath)); state.before.hashes.rules = 'mismatch';
  await writeFile(f.options.statePath, JSON.stringify(state));
  await assert.rejects(recover({ ...f.options, call: f.call, action: 'apply' }), /protected controller state changed/);
  assert.equal(f.writes.length, 1);
});

test('rollback restores only target even when concurrent mode change makes normal snapshot unsafe', async t => {
  const f = await context(t); let first = true;
  const call = async (...args) => { const r = await f.call(...args); if (args[0] === 'PUT' && first) { first = false; f.data.config.mode = 'global'; } return r; };
  await assert.rejects(recover({ ...f.options, call, action: 'apply' }), /verification failed/);
  assert.equal(f.data.config.mode, 'global'); assert.equal(f.data.proxies[GROUP].fixed, '');
  assert.deepEqual(f.writes.map(w => w.method), ['PUT', 'DELETE']);
  const state = JSON.parse(await readFile(f.options.statePath)); assert.deepEqual(state.rollback, { attempted: true, verified: true });
});

test('ambiguous HTTP failure after applied PUT compensates only targeted selection', async t => {
  const f = await context(t); let first = true;
  const call = async (...args) => { const r = await f.call(...args); if (args[0] === 'PUT' && first) { first = false; throw new Error('controller HTTP 503'); } return r; };
  await assert.rejects(recover({ ...f.options, call, action: 'apply' }), /verification failed/);
  assert.equal(f.data.proxies[GROUP].fixed, ''); assert.deepEqual(f.writes.map(w => w.method), ['PUT', 'DELETE']);
});

test('restore can clear saved empty fixed when selected LA member has become dead', async t => {
  const f = await context(t); await recover({ ...f.options, call: f.call, action: 'apply' });
  f.data.proxies[MEMBER].alive = false;
  const restored = await recover({ ...f.options, call: f.call, action: 'restore' });
  assert.equal(restored.after.fixed, ''); assert.equal(f.writes.at(-1).method, 'DELETE');
  assert.deepEqual(restored.before.hashes, restored.after.hashes);
  await assert.rejects(recover({ ...f.options, call: f.call, action: 'check' }), /not alive/);
});

test('dynamic rule traffic counters do not block restore; static disabled and unknown extra fields remain protected', async t => {
  const f = await context(t); f.data.rules[0].extra = { disabled: false, hitCount: 1, hitAt: 1, missCount: 0, missAt: 0, futurePolicy: 'protected' };
  await recover({ ...f.options, call: f.call, action: 'apply' });
  Object.assign(f.data.rules[0].extra, { hitCount: 999, hitAt: 999, missCount: 100, missAt: 100 });
  await recover({ ...f.options, call: f.call, action: 'restore' });
  assert.equal(f.writes.at(-1).method, 'DELETE');
  f.data.rules[0].extra.disabled = true;
  await assert.rejects(recover({ ...f.options, call: f.call, action: 'apply' }), /protected controller state changed/);
  f.data.rules[0].extra.disabled = false; f.data.rules[0].extra.futurePolicy = 'changed';
  await assert.rejects(recover({ ...f.options, call: f.call, action: 'apply' }), /protected controller state changed/);
  assert.equal(f.writes.length, 2);
});

test('legacy state is never migrated; fresh v2 baseline records current LA without implying original auto mode', async t => {
  const f = await context(t, MEMBER);
  const result = await recover({ ...f.options, call: f.call, action: 'apply' }); assert.equal(result.mutation, false);
  const state = JSON.parse(await readFile(f.options.statePath)); assert.equal(state.originalFixed, MEMBER); assert.equal(state.hashSchema, 'static-rules-v2');
  assert.equal((await recover({ ...f.options, call: f.call, action: 'restore' })).mutation, false);
  delete state.hashSchema; await writeFile(f.options.statePath, JSON.stringify(state));
  await assert.rejects(recover({ ...f.options, call: f.call, action: 'apply' }), /legacy route state unsupported/);
  assert.equal(JSON.parse(await readFile(f.options.statePath)).hashSchema, undefined); assert.equal(f.writes.length, 0);
});

test('real fake-controller transport preserves split Unicode and fails closed on HTTP, timeout, or disallowed writes', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'crm-socket-')), socketPath = path.join(directory, 'controller.sock');
  const server = http.createServer((request, response) => {
    assert.equal(request.headers.authorization, 'Bearer test');
    if (request.url === '/rules') { const bytes = Buffer.from(JSON.stringify({ label: MEMBER, rules: [] })); response.write(bytes.subarray(0, 13)); setImmediate(() => response.end(bytes.subarray(13))); }
    else if (request.url === '/configs') { response.writeHead(503); response.end('private diagnostic must not escape'); }
    else if (request.url === '/proxies') { /* deadline test */ }
  });
  await new Promise(resolve => server.listen(socketPath, resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); });
  const call = controller({ socketPath, secret: 'test', timeoutMs: 50 });
  assert.equal((await call('GET', '/rules')).label, MEMBER);
  await assert.rejects(call('GET', '/configs'), error => error.message === 'controller HTTP 503');
  await assert.rejects(call('GET', '/proxies'), /timeout/);
  await assert.rejects(call('PUT', '/configs', {}), /outside CRM scope/);
  await assert.rejects(call('DELETE', '/connections'), /outside CRM scope/);
});

async function retirementContext(t) {
  const f = await context(t); await recover({ ...f.options, call: f.call, action: 'apply' }); f.writes.length = 0;
  const start = new Date(Date.now() - 60000).toISOString();
  const connection = { id: '22ba4d29-fc69-48e0-a230-9520aede7bc6', start, chains: ['DIRECT', GROUP], rule: 'Domain', rulePayload: 'crm.cnps.ai',
    metadata: { network: 'tcp', type: 'HTTPS', sourceIP: '127.0.0.1', host: 'crm.cnps.ai', sourcePort: '59822', destinationPort: '443', remoteDestination: '76.76.21.21', destinationIP: '' } };
  f.connections = [connection, { id: '00000000-0000-0000-0000-000000000001', metadata: { host: 'other.invalid' } }];
  f.connectionWrites = [];
  f.proof = { ownerTask: '/root', context: 'fixture-task-context', controllerId: f.options.controllerId, reason: 'task-created-pre-switch-connection',
    ownerWindow: { start: new Date(Date.parse(start) - 1000).toISOString(), end: new Date(Date.parse(start) + 1000).toISOString() },
    connection: { id: connection.id, start, host: 'crm.cnps.ai', sourcePort: 59822, destinationPort: 443, actualDestination: '76.76.21.21', chains: ['DIRECT', GROUP], rule: 'Domain', rulePayload: 'crm.cnps.ai' } };
  f.retireOptions = { ...f.options, ownerTask: '/root', context: 'fixture-task-context' };
  f.retireCall = async (method, route, body) => {
    if (method === 'GET' && route === '/connections') return structuredClone({ connections: f.connections });
    if (method === 'DELETE' && route.startsWith('/connections/')) { f.connectionWrites.push({ method, route }); f.connections = f.connections.filter(c => c.id !== decodeURIComponent(route.slice('/connections/'.length))); return null; }
    return f.call(method, route, body);
  };
  return f;
}

test('exact owned connection retirement is narrow, persisted and idempotent', async t => {
  const f = await retirementContext(t);
  const result = await retireOwned({ ...f.retireOptions, proof: f.proof, call: f.retireCall });
  assert.equal(result.confirmedAbsent, true); assert.equal(result.alreadyAbsent, false);
  assert.deepEqual(f.connectionWrites, [{ method: 'DELETE', route: '/connections/' + f.proof.connection.id }]); assert.equal(f.writes.length, 0);
  assert.equal(f.connections[0].metadata.host, 'other.invalid');
  assert.equal((await retireOwned({ ...f.retireOptions, proof: f.proof, call: f.retireCall })).alreadyAbsent, true);
  assert.equal(f.connectionWrites.length, 1);
  const saved = JSON.parse(await readFile(f.options.statePath)); assert.deepEqual(Object.keys(saved.retiredOwnedConnections[0]).sort(), ['at', 'id']);
});

for (const [name, change] of [
  ['host', f => { f.connections[0].metadata.host = 'other.invalid'; }],
  ['port', f => { f.connections[0].metadata.sourcePort = '59823'; }],
  ['start', f => { f.connections[0].start = new Date(Date.now() - 59000).toISOString(); }],
  ['chain', f => { f.connections[0].chains = [MEMBER, GROUP]; }],
  ['Match rule', f => { f.connections[0].rule = 'Match'; }],
  ['destination', f => { f.connections[0].metadata.remoteDestination = '216.150.16.129'; }],
  ['missing proof', f => { f.proof = undefined; }],
  ['wrong owner context', f => { f.proof.context = 'other-context'; }],
  ['outside owner window', f => { f.proof.ownerWindow.end = new Date(Date.now() - 70000).toISOString(); }],
]) test('owned retirement refuses mismatch without writes: ' + name, async t => {
  const f = await retirementContext(t); change(f);
  await assert.rejects(retireOwned({ ...f.retireOptions, proof: f.proof, call: f.retireCall })); assert.equal(f.connectionWrites.length, 0); assert.equal(f.writes.length, 0);
});

test('owned retirement refuses nonmerged source and unapplied state', async t => {
  const f = await retirementContext(t);
  await assert.rejects(retireOwned({ ...f.retireOptions, proof: f.proof, call: f.retireCall, verifySource: () => { throw new Error('not merged'); } }), /not merged/);
  const state = JSON.parse(await readFile(f.options.statePath)); state.phase = 'prepared'; await writeFile(f.options.statePath, JSON.stringify(state));
  await assert.rejects(retireOwned({ ...f.retireOptions, proof: f.proof, call: f.retireCall }), /applied saved state/); assert.equal(f.connectionWrites.length, 0);
});

test('owned retirement never reports success when connection remains after DELETE', async t => {
  const f = await retirementContext(t);
  const call = (method, route, body) => method === 'DELETE' ? Promise.resolve(null) : f.retireCall(method, route, body);
  await assert.rejects(retireOwned({ ...f.retireOptions, proof: f.proof, call }), /readback failed/);
  assert.equal(JSON.parse(await readFile(f.options.statePath)).retiredOwnedConnections, undefined);
});

test('real fake-controller performs only exact connection DELETE, preserving unrelated connections', async t => {
  const f = await retirementContext(t), directory = await mkdtemp(path.join(os.tmpdir(), 'crm-retire-')), socketPath = path.join(directory, 'api.sock');
  const requests = [];
  const server = http.createServer(async (request, response) => {
    requests.push({ method: request.method, route: request.url });
    const value = await f.retireCall(request.method, request.url);
    if (value == null) { response.writeHead(204); response.end(); } else { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(value)); }
  });
  await new Promise(resolve => server.listen(socketPath, resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); });
  await retireOwned({ ...f.retireOptions, proof: f.proof, call: controller({ socketPath, secret: 'test' }) });
  assert.deepEqual(requests.filter(r => r.method !== 'GET'), [{ method: 'DELETE', route: '/connections/' + f.proof.connection.id }]);
  assert.equal(f.connections.length, 1); assert.equal(f.connections[0].metadata.host, 'other.invalid');
});
