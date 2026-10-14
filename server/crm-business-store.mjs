import { Redis } from '@upstash/redis';

const PREFIX = 'cnps:crm:business:v1:';
export const emptyDirectory = () => ({ revision: 0, companies: {}, managerAssignments: {}, memberGrants: {}, events: [] });
export const emptyCompany = companyId => ({ revision: 0, companyId, projects: {}, records: {}, documents: {}, events: [] });
const CAS_DIRECTORY = `
local raw=redis.call('GET',KEYS[1]); local revision=0
if raw then revision=cjson.decode(raw).revision end
local next=cjson.decode(ARGV[2])
if revision~=tonumber(ARGV[1]) or next.revision~=revision+1 then return 0 end
redis.call('SET',KEYS[1],ARGV[2]); return 1`;
const CAS_COMPANY = `
local directory=redis.call('GET',KEYS[1]); local directoryRevision=0
if directory then directoryRevision=cjson.decode(directory).revision end
local raw=redis.call('GET',KEYS[2]); local revision=0
if raw then revision=cjson.decode(raw).revision end
local next=cjson.decode(ARGV[3])
if directoryRevision~=tonumber(ARGV[1]) or revision~=tonumber(ARGV[2]) or next.revision~=revision+1 then return 0 end
redis.call('SET',KEYS[2],ARGV[3]); return 1`;

// Grants do not expire in storage: explicit revocation and company ownership
// must survive restarts and reused phone identities. Sessions have separate TTLs.
export function createBusinessStore(env, { redis: injectedRedis } = {}) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!injectedRedis && (!url || !token)) throw new Error('Business storage not configured');
  const redis = injectedRedis || new Redis({ url, token, retry: { retries: 1 } });
  const directoryKey = PREFIX + 'directory';
  const companyKey = companyId => PREFIX + 'company:' + Buffer.from(companyId).toString('base64url');
  return {
    async recordAccess(event) { await redis.set('cnps:crm:audit:v1:event:' + event.at + ':' + event.id, event); },
    async getDirectory() { return await redis.get(directoryKey) || emptyDirectory(); },
    async getCompany(companyId) { return await redis.get(companyKey(companyId)) || emptyCompany(companyId); },
    async commitDirectory(revision, next) {
      return Number(await redis.eval(CAS_DIRECTORY, [directoryKey], [revision, JSON.stringify(next)])) === 1;
    },
    async commitCompany(companyId, directoryRevision, revision, next) {
      if (next.companyId !== companyId) throw new Error('Immutable company ownership');
      return Number(await redis.eval(CAS_COMPANY, [directoryKey, companyKey(companyId)], [directoryRevision, revision, JSON.stringify(next)])) === 1;
    }
  };
}
