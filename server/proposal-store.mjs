import { Redis } from '@upstash/redis';
// Every decision is atomic across all serverless instances. Only HMAC identifiers
// and random challenges/sessions are stored, never phone numbers or SMS codes.
const RESERVE = `
for i=1,#KEYS do
 if tonumber(redis.call('GET',KEYS[i]) or '0') >= tonumber(ARGV[(i-1)*2+1]) then return 0 end
end
for i=1,#KEYS do
 local n=redis.call('INCR',KEYS[i]); if n==1 then redis.call('EXPIRE',KEYS[i],ARGV[(i-1)*2+2]) end
end
return 1`;
const ATTEMPT = `
local raw=redis.call('GET',KEYS[1]); if not raw then return nil end
local c=cjson.decode(raw)
if c.binding~=ARGV[1] or c.attempts>=5 then return nil end
c.attempts=c.attempts+1
local ttl=redis.call('TTL',KEYS[1]); if ttl<1 then return nil end
redis.call('SET',KEYS[1],cjson.encode(c),'EX',ttl)
return cjson.encode(c)`;
const CONSUME = `
local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end
local c=cjson.decode(raw); if c.binding~=ARGV[1] then return 0 end
redis.call('DEL',KEYS[1]); return 1`;
export function createStore(env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Missing durable authentication storage');
  const redis = new Redis({ url, token, retry: { retries: 1 } });
  const key = name => `cnps:proposal:v1:${name}`;
  return {
    async reserve(limits) {
      return Number(await redis.eval(RESERVE, limits.map(x=>key(x.name)), limits.flatMap(x=>[x.max,x.ttl]))) === 1;
    },
    async set(name,value,ttl) { await redis.set(key(name),value,{ex:ttl}); },
    async get(name) { return redis.get(key(name)); },
    async del(name) { await redis.del(key(name)); },
    async attempt(id,binding) {
      const value=await redis.eval(ATTEMPT,[key(`challenge:${id}`)],[binding]);
      return typeof value==='string'?JSON.parse(value):value;
    },
    async consume(id,binding) { return Number(await redis.eval(CONSUME,[key(`challenge:${id}`)],[binding]))===1; }
  };
}
