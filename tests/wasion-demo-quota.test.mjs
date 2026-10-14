import test from 'node:test';
import assert from 'node:assert/strict';
import { WASION_DEMO_DAILY_AI_LIMIT, createWasionQuotaLimiter, allowWasionDemoQuota } from '../server/wasion-demo-quota.mjs';
import { answerWasionQuestion } from '../server/wasion-demo.mjs';

const env = { UPSTASH_REDIS_REST_URL: 'https://quota-test.invalid', UPSTASH_REDIS_REST_TOKEN: 'test-token' };
const instant = new Date('2026-10-14T17:00:00.000Z');
const key = (identityId, date = '2026-10-14') => `cnps:crm:wasion-demo:quota:${identityId}:${date}`;
function fixture({ counts = new Map(), now = () => instant, result, failure } = {}) {
  const commands = [], configurations = [];
  const limiter = createWasionQuotaLimiter({
    now,
    redisFactory(options) {
      configurations.push(options);
      return { async eval(script, keys, arguments_) {
        commands.push({ script, keys, arguments_ });
        if (failure) throw failure;
        if (result) return result();
        const next = (counts.get(keys[0]) || 0) + 1;
        counts.set(keys[0], next); return next;
      } };
    }
  });
  return { limiter, counts, commands, configurations };
}
function assertExistingCounterCommand(command, identityId, date = '2026-10-14') {
  assert.deepEqual(command.keys, [key(identityId, date)]);
  assert.deepEqual(command.arguments_, []);
  // Preserve the existing atomic increment and first-write cleanup TTL. The
  // date in the key determines reset time; the TTL is not a rolling allowance.
  assert.match(command.script, /redis\.call\('INCR',KEYS\[1\]\)/);
  assert.match(command.script, /if n==1 then redis\.call\('EXPIRE',KEYS\[1\],86400\) end/);
}

test('private demo has an explicit finite 200-search daily limit and a production limiter', () => {
  assert.equal(WASION_DEMO_DAILY_AI_LIMIT, 200);
  assert.ok(Number.isSafeInteger(WASION_DEMO_DAILY_AI_LIMIT));
  assert.equal(typeof allowWasionDemoQuota, 'function');
});

test('the 200th attempt is allowed and subsequent attempts remain limited and counted', async () => {
  const subject = fixture({ counts: new Map([[key('viewer-a'), 199]]) });
  assert.equal(await subject.limiter(env, 'viewer-a'), true);
  assert.equal(await subject.limiter(env, 'viewer-a'), false);
  assert.equal(await subject.limiter(env, 'viewer-a'), false);
  assert.equal(subject.counts.get(key('viewer-a')), 202);
  assert.equal(subject.commands.length, 3);
  subject.commands.forEach(command => assertExistingCounterCommand(command, 'viewer-a'));
});

test('raising the limit preserves an existing 21-use counter and does not reset other stored usage', async () => {
  const otherQuota = 'cnps:crm:ai:quota:viewer-a:2026-10-14';
  const subject = fixture({ counts: new Map([[key('viewer-a'), 21], [otherQuota, 20]]) });
  assert.equal(await subject.limiter(env, 'viewer-a'), true);
  assert.equal(subject.counts.get(key('viewer-a')), 22);
  assert.equal(subject.counts.get(otherQuota), 20);
  assert.equal(subject.commands.length, 1);
  assertExistingCounterCommand(subject.commands[0], 'viewer-a');
});

test('identities have separate counters while repeated demo requests share one identity bucket', async () => {
  const subject = fixture({ counts: new Map([[key('viewer-a'), 199]]) });
  assert.equal(await subject.limiter(env, 'viewer-a'), true);
  assert.equal(await subject.limiter(env, 'viewer-b'), true);
  assert.equal(await subject.limiter(env, 'viewer-a'), false);
  assert.equal(subject.counts.get(key('viewer-a')), 201);
  assert.equal(subject.counts.get(key('viewer-b')), 1);
  assert.deepEqual(subject.commands.map(command => command.keys[0]), [key('viewer-a'), key('viewer-b'), key('viewer-a')]);
});

test('UTC midnight changes the existing daily key without clearing yesterday or using Shanghai midnight', async () => {
  let clock = new Date('2026-10-14T23:59:59.999Z');
  const subject = fixture({ now: () => clock, counts: new Map([[key('viewer-a'), 199]]) });
  assert.equal(await subject.limiter(env, 'viewer-a'), true);
  clock = new Date('2026-10-15T00:00:00.000Z');
  assert.equal(await subject.limiter(env, 'viewer-a'), true);
  assert.equal(subject.counts.get(key('viewer-a')), 200);
  assert.equal(subject.counts.get(key('viewer-a', '2026-10-15')), 1);
  assertExistingCounterCommand(subject.commands[0], 'viewer-a');
  assertExistingCounterCommand(subject.commands[1], 'viewer-a', '2026-10-15');
});

test('canonical Redis integer results support both number and positive decimal string values', async () => {
  for (const [count, allowed] of [[1, true], ['1', true], [200, true], ['200', true], [201, false], ['201', false], [Number.MAX_SAFE_INTEGER, false], [String(Number.MAX_SAFE_INTEGER), false]]) {
    const subject = fixture({ result: () => count });
    assert.equal(await subject.limiter(env, 'viewer-a'), allowed, String(count));
  }
});

test('invalid Redis counts fail closed as storage unavailability rather than a valid allowance or exhausted quota', async () => {
  for (const count of [undefined, null, '', 0, -1, 1.5, NaN, Infinity, -Infinity, true, false, {}, [], '0', '-1', '01', '1.0', '1e2', ' 20 ', '20\n', Number.MAX_SAFE_INTEGER + 1, '9007199254740992']) {
    const subject = fixture({ result: () => count });
    await assert.rejects(subject.limiter(env, 'viewer-a'), { message: 'quota unavailable' }, String(count));
    assert.equal(subject.commands.length, 1);
  }
});

test('missing storage configuration, identity or a valid clock never sends a Redis command', async () => {
  for (const settings of [undefined, null, {}, { UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL }, { UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN }, { KV_REST_API_URL: env.UPSTASH_REDIS_REST_URL }, { KV_REST_API_TOKEN: env.UPSTASH_REDIS_REST_TOKEN }]) {
    const subject = fixture();
    await assert.rejects(subject.limiter(settings, 'viewer-a'), { message: 'quota unavailable' });
    assert.equal(subject.commands.length, 0);
  }
  for (const identityId of [undefined, null, '', '   ', 123, {}]) {
    const subject = fixture();
    await assert.rejects(subject.limiter(env, identityId), { message: 'quota unavailable' });
    assert.equal(subject.commands.length, 0);
  }
  for (const date of [new Date('invalid'), undefined, null, '2026-10-14T17:00:00.000Z']) {
    const subject = fixture({ now: () => date });
    await assert.rejects(subject.limiter(env, 'viewer-a'), { message: 'quota unavailable' });
    assert.equal(subject.commands.length, 0);
  }
});

test('Redis credentials retain Upstash precedence and Marketplace KV fallback', async () => {
  const primary = fixture();
  assert.equal(await primary.limiter({ ...env, KV_REST_API_URL: 'https://other.invalid', KV_REST_API_TOKEN: 'other-token' }, 'viewer-a'), true);
  assert.equal(primary.configurations[0].url, env.UPSTASH_REDIS_REST_URL);
  assert.equal(primary.configurations[0].token, env.UPSTASH_REDIS_REST_TOKEN);
  const fallback = fixture();
  assert.equal(await fallback.limiter({ KV_REST_API_URL: env.UPSTASH_REDIS_REST_URL, KV_REST_API_TOKEN: env.UPSTASH_REDIS_REST_TOKEN }, 'viewer-a'), true);
  assert.equal(fallback.configurations[0].url, env.UPSTASH_REDIS_REST_URL);
  assert.equal(fallback.configurations[0].token, env.UPSTASH_REDIS_REST_TOKEN);
});

test('Redis transport failure rejects the limiter rather than granting an unmetered request', async () => {
  const subject = fixture({ failure: new Error('Redis unreachable') });
  await assert.rejects(subject.limiter(env, 'viewer-a'));
  assert.equal(subject.commands.length, 1);
});

test('answer fallback distinguishes actual exhaustion from failed storage and never calls inference for either', async () => {
  let providerCalls = 0;
  const cases = [
    [fixture({ result: () => 201 }), 'rate_limited', 'quota_exhausted'],
    [fixture({ result: () => null }), 'unavailable', 'quota_unavailable'],
    [fixture({ failure: new Error('Redis unreachable') }), 'unavailable', 'quota_unavailable']
  ];
  for (const [subject, status, reason] of cases) {
    const result = await answerWasionQuestion({
      env: { ...env, CRM_AI_API_KEY: 'test-key' }, principal: { identityId: 'viewer-a' }, question: 'AMI meters',
      rateLimit: subject.limiter, fetchImpl: async () => { providerCalls++; throw new Error('must not call provider'); }
    });
    assert.equal(result.status, 200);
    assert.equal(result.data.ai.generated, false);
    assert.equal(result.data.ai.status, status); assert.equal(result.data.ai.reason, reason);
    assert.ok(result.data.results.length > 0); assert.ok(result.data.sources.length > 0);
    if (status === 'unavailable') assert.doesNotMatch(result.data.answer, /limit has been reached/);
    assert.equal(providerCalls, 0); assert.equal(subject.commands.length, 1);
  }
});

test('a formerly limited 21-use identity can generate a sourced answer without clearing its counter', async () => {
  const subject = fixture({ counts: new Map([[key('viewer-a'), 21]]) });
  let providerCalls = 0;
  const result = await answerWasionQuestion({
    env: { ...env, CRM_AI_API_KEY: 'test-key' }, principal: { identityId: 'viewer-a' }, question: 'AMI meters', rateLimit: subject.limiter,
    fetchImpl: async () => { providerCalls++; return { ok: true, text: async () => JSON.stringify({ choices: [{ message: { content: JSON.stringify({ answer: 'The supplied official page describes this solution. [s1]', supported: true }) } }] }) }; }
  });
  assert.equal(result.status, 200); assert.equal(result.data.ai.generated, true);
  assert.equal(providerCalls, 1); assert.equal(subject.counts.get(key('viewer-a')), 22);
  assert.equal(subject.commands.length, 1); assert.ok(result.data.sources.length > 0);
});

test('a failed model request still consumes exactly one attempted generation from the original bucket', async () => {
  const subject = fixture(); let providerCalls = 0;
  const result = await answerWasionQuestion({
    env: { ...env, CRM_AI_API_KEY: 'test-key' }, principal: { identityId: 'viewer-a' }, question: 'AMI meters', rateLimit: subject.limiter,
    fetchImpl: async () => { providerCalls++; throw new Error('gateway unavailable'); }
  });
  assert.equal(result.data.ai.status, 'unavailable'); assert.equal(result.data.ai.reason, 'gateway_unavailable');
  assert.equal(providerCalls, 1); assert.equal(subject.commands.length, 1); assert.equal(subject.counts.get(key('viewer-a')), 1);
});
