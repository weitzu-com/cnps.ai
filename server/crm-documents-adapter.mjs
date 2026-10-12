import { BusinessError } from './crm-business-service.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function id(value) { if (typeof value !== 'string' || !UUID.test(value)) throw new BusinessError(400, '资料标识无效。'); return value; }
const unavailable = () => new BusinessError(503, '私有资料暂不可用。');
export function createDocumentsAdapter(env, { fetch: request = globalThis.fetch } = {}) {
  const base = new URL(env.CRM_FILE_GATEWAY_URL);
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(base.hostname))) throw unavailable();
  if (base.username || base.password || base.search || base.hash || !/^[0-9a-f]{64}$/i.test(env.CRM_FILE_GATEWAY_KEY || '')) throw unavailable();
  const limit = 38 * 1024 * 1024;
  async function call(path, { body, bytes = false } = {}) {
    try {
      const response = await request(new URL(path, base), { method: body ? 'POST' : 'GET', redirect: 'manual', signal: AbortSignal.timeout(25000), headers: { authorization: 'Bearer ' + env.CRM_FILE_GATEWAY_KEY, ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      if (!response.ok || Number(response.headers.get('content-length')) > limit) throw unavailable();
      const chunks = []; let length = 0;
      for await (const chunk of response.body) { length += chunk.length; if (length > limit) throw unavailable(); chunks.push(Buffer.from(chunk)); }
      const result = Buffer.concat(chunks, length);
      return bytes ? result : JSON.parse(result.toString('utf8'));
    } catch { throw unavailable(); }
  }
  const scope = context => new URLSearchParams({ companyId: id(context?.companyId), projectId: id(context?.projectId) }).toString();
  const metadata = (data, context) => {
    id(data?.id);
    if (data.companyId !== context.companyId || data.projectId !== context.projectId || typeof data.filename !== 'string' || typeof data.mimeType !== 'string' || !Number.isSafeInteger(data.size) || data.size < 1 || data.size > limit) throw unavailable();
    return data;
  };
  return {
    async createObject(input) { id(input.companyId); id(input.projectId); return metadata(await call('/objects', { body: input }), input); },
    async getObject(objectId, context) { return metadata(await call('/objects/' + id(objectId) + '?' + scope(context)), context); },
    async readObject(objectId, context) { return call('/objects/' + id(objectId) + '/content?' + scope(context), { bytes: true }); }
  };
}
