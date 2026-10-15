import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { GROUP, MEMBER, recover, controller } from '../scripts/crm-download-route.mjs';

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
