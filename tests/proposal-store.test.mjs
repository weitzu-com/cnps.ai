import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../server/proposal-store.mjs';

const limits = [
  { name: 'cooldown:opaque-phone', max: 1, ttl: 60 },
  { name: 'phone-day:2026-10-13:opaque-phone', max: 5, ttl: 172800 },
  { name: 'send-month:2026-10', max: 100, ttl: 32 * 86400 }
];

test('shared reservation returns all atomic blocked counters and their actual TTLs', async () => {
  let calls = 0;
  const store = createStore({}, { redis: { async eval(script, keys, args) {
    calls++;
    assert.deepEqual(keys, limits.map(limit => 'cnps:proposal:v1:' + limit.name));
    assert.deepEqual(args, limits.flatMap(limit => [limit.max, limit.ttl]));
    assert.ok(script.indexOf('if #blocked>0') < script.indexOf("redis.call('INCR'"));
    assert.match(script, /redis.call\('TTL',KEYS\[i\]\)/);
    return [0, 1, 43, 3, 1800000];
  } } });
  assert.deepEqual(await store.reserveDetailed(limits), { allowed: false, blocked: [
    { name: limits[0].name, kind: 'cooldown', ttl: 43 },
    { name: limits[2].name, kind: 'send-month', ttl: 1800000 }
  ] });
  assert.equal(calls, 1);
});

test('legacy proposal boolean reservation uses the same atomic decision once', async () => {
  let result = [1], calls = 0;
  const store = createStore({}, { redis: { async eval() { calls++; return result; } } });
  assert.deepEqual(await store.reserveDetailed(limits), { allowed: true, blocked: [] });
  assert.equal(await store.reserve(limits), true);
  result = [0, 2, 90000];
  assert.equal(await store.reserve(limits), false);
  assert.equal(calls, 3);
});

test('malformed storage diagnostics fail closed instead of allowing an SMS send', async () => {
  for (const result of [null, 1, [], [2], [1, 2], [0], [0, 9, 1], [0, 1, 0], [0, 1, 2.5], [0, 1, 60, 2]]) {
    const store = createStore({}, { redis: { async eval() { return result; } } });
    await assert.rejects(store.reserveDetailed(limits), /Invalid quota result/);
  }
});
