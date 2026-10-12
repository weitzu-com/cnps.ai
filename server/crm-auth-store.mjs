import { Redis } from '@upstash/redis';
import { createStore as createProposalStore } from './proposal-store.mjs';

const PREFIX = 'cnps:crm:auth:v1:';
const ATTEMPT = `
local raw=redis.call('GET',KEYS[1]); if not raw then return nil end
local c=cjson.decode(raw)
if c.purpose~='crm-auth-v1' or c.binding~=ARGV[1] or c.attempts>=5 then return nil end
local ttl=redis.call('TTL',KEYS[1]); if ttl<1 then return nil end
c.attempts=c.attempts+1
redis.call('SET',KEYS[1],cjson.encode(c),'EX',ttl)
return cjson.encode(c)`;
const CONSUME = `
local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end
local c=cjson.decode(raw)
if c.purpose~='crm-auth-v1' or c.binding~=ARGV[1] then return 0 end
redis.call('DEL',KEYS[1]); return 1`;

// reserve deliberately uses the existing proposal store. Both applications use
// identical quota names and phone/IP HMACs, so their limits are one atomic budget.
// Challenges, sessions and login records use a separate namespace. A phone is
// stored only as authenticated ciphertext; OTPs are never stored or returned.
export function createCrmStore(env, { sharedStore, redis } = {}) {
  const shared = sharedStore || createProposalStore(env);
  if (!redis) {
    const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
    const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error('Missing durable authentication storage');
    redis = new Redis({ url, token, retry: { retries: 1 } });
  }
  const key = name => PREFIX + name;
  return {
    reserve: limits => shared.reserve(limits),
    async set(name, value, ttl) { await redis.set(key(name), value, { ex: ttl }); },
    async get(name) { return redis.get(key(name)); },
    async del(name) { await redis.del(key(name)); },
    async attempt(id, binding) {
      const value = await redis.eval(ATTEMPT, [key(`challenge:${id}`)], [binding]);
      return typeof value === 'string' ? JSON.parse(value) : value;
    },
    async consume(id, binding) {
      return Number(await redis.eval(CONSUME, [key(`challenge:${id}`)], [binding])) === 1;
    }
  };
}
