import { Redis } from '@upstash/redis';

// The authenticated demo needs enough room to compare its four page styles.
// Keep this budget separate from CRM AI and preserve the existing usage keys.
export const WASION_DEMO_DAILY_AI_LIMIT = 200;
const incrementDailyUsage = "local n=redis.call('INCR',KEYS[1]);if n==1 then redis.call('EXPIRE',KEYS[1],86400) end;return n";

export function createWasionQuotaLimiter({ redisFactory = options => new Redis(options), now = () => new Date() } = {}) {
  return async function allowQuota(env, identityId) {
    const url = env?.UPSTASH_REDIS_REST_URL || env?.KV_REST_API_URL;
    const token = env?.UPSTASH_REDIS_REST_TOKEN || env?.KV_REST_API_TOKEN;
    if (!url || !token || typeof identityId !== 'string' || !identityId.trim()) throw new Error('quota unavailable');
    const date = now();
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new Error('quota unavailable');
    const redis = redisFactory({ url, token });
    const key = `cnps:crm:wasion-demo:quota:${identityId}:${date.toISOString().slice(0, 10)}`;
    const result = await redis.eval(incrementDailyUsage, [key], []);
    // A store failure is not an exhausted budget, and must never grant usage.
    const count = typeof result === 'number' ? result
      : typeof result === 'string' && /^[1-9]\d*$/.test(result) ? Number(result) : NaN;
    if (!Number.isSafeInteger(count) || count <= 0) throw new Error('quota unavailable');
    return count <= WASION_DEMO_DAILY_AI_LIMIT;
  };
}

export const allowWasionDemoQuota = createWasionQuotaLimiter();
