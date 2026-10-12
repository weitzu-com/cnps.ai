import {Redis} from '@upstash/redis';

const PREFIX = 'cnps:crm:inquiry:v1:';
const TTL = 30 * 86400;
const CLAIM = `
local raw=redis.call('GET',KEYS[1]); local record
if raw then record=cjson.decode(raw) else record=cjson.decode(ARGV[4]) end
if record.phase=='complete' then return cjson.encode({kind='complete',record=record}) end
if record.phase=='hubspot-sending' or record.phase=='uncertain' then return cjson.encode({kind='pending',record=record}) end
if raw and tonumber(record.leaseUntil or 0)>tonumber(ARGV[1]) then return cjson.encode({kind='pending',record=record}) end
record.owner=ARGV[2]; record.leaseUntil=tonumber(ARGV[1])+120000
redis.call('SET',KEYS[1],cjson.encode(record),'EX',ARGV[3]); return cjson.encode({kind='owned',record=record})`;
const ADVANCE = `
local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end
local record=cjson.decode(raw)
if record.owner~=ARGV[1] or record.phase~=ARGV[2] then return 0 end
record.phase=ARGV[3]; record.updatedAt=tonumber(ARGV[4]); record.leaseUntil=tonumber(ARGV[5])
redis.call('SET',KEYS[1],cjson.encode(record),'EX',ARGV[6]); return 1`;
const RESERVE = `
for i=1,#KEYS do if tonumber(redis.call('GET',KEYS[i]) or '0')>=tonumber(ARGV[(i-1)*2+1]) then return 0 end end
for i=1,#KEYS do local n=redis.call('INCR',KEYS[i]); if n==1 then redis.call('EXPIRE',KEYS[i],ARGV[(i-1)*2+2]) end end
return 1`;

// PII is supplied only as authenticated ciphertext by the handler. Delivery
// claims are atomic across serverless instances. A HubSpot send with no final
// acknowledgement is never automatically claimed for another provider send.
export function createInquiryStore(env, {redis: injectedRedis} = {}) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!injectedRedis && (!url || !token)) throw new Error('Inquiry storage not configured');
  const redis = injectedRedis || new Redis({url, token, retry: {retries: 1}});
  const recordKey = id => PREFIX + 'submission:' + id;
  return {
    async claim(id, owner, initial, now) {
      const value = await redis.eval(CLAIM, [recordKey(id)], [now, owner, TTL, JSON.stringify(initial)]);
      return typeof value === 'string' ? JSON.parse(value) : value;
    },
    async advance(id, owner, from, to, now, release = false) {
      return Number(await redis.eval(ADVANCE, [recordKey(id)], [owner, from, to, now, release ? now : now + 120000, TTL])) === 1;
    },
    async reserve(limits) {
      return Number(await redis.eval(RESERVE, limits.map(item => PREFIX + 'limit:' + item.name), limits.flatMap(item => [item.max, item.ttl]))) === 1;
    }
  };
}
