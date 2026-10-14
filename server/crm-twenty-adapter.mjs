import { digest, keyBytes } from './proposal-crypto.mjs';
import { normalizePhone } from './proposal-handler.mjs';
import { BusinessError } from './crm-business-service.mjs';

// REST contract verified against Twenty v2.46.0 / commit 9070979232c4f37165108a2eb5a4042e0cfdc3d6:
// packages/twenty-server/src/engine/api/rest/core/handlers/rest-api-{find-many,find-one,create-one,update-one}.handler.ts
// packages/twenty-server/src/modules/{person,company}/standard-objects/*.workspace-entity.ts
// packages/twenty-shared/src/types/composite-types/{phones,address}.composite-type.ts
// https://github.com/twentyhq/twenty/tree/twenty/v2.46.0
const COMPANY_FIELDS = 'id,name,domainName,address,deletedAt';
const CONTACT_FIELDS = 'id,name,emails,phones,jobTitle,company,deletedAt';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PENDING_COMPANY_PREFIX = '待核验 · ';
const unavailable = () => { throw new BusinessError(503, '原生 CRM 服务暂不可用。'); };
const invalid = () => { throw new BusinessError(400, '原生 CRM 请求格式无效。'); };
const mismatch = () => { throw new BusinessError(409, '已有询盘记录与本次资料不一致，请联系项目对接人。'); };
function uuid(value) { if (typeof value !== 'string' || !UUID.test(value)) invalid(); return value.toLowerCase(); }
function plain(value) { if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(); return value; }
function text(value, maximum = 300) { if (typeof value !== 'string' || value.length > maximum || /[\u0000-\u001f]/.test(value)) invalid(); return value.trim(); }
function validateFields(fields, allowed) { plain(fields); for (const name of Object.keys(fields)) if (!allowed.includes(name)) invalid(); }
function email(value) { const result = text(value, 254); if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) invalid(); return result; }
function phoneValue(value) { const result = text(value, 30).replace(/[ ()-]/g, ''); if (result && !/^\+?\d{5,20}$/.test(result)) invalid(); return result; }
function callingCode(value) { const result = text(value, 4).replace(/^\+/, ''); if (result && !/^[1-9]\d{0,2}$/.test(result)) invalid(); return result; }
function safeString(value) { return typeof value === 'string' ? value : ''; }

export function createTwentyAdapter(env, { fetchImpl = globalThis.fetch, timeoutMs = 10000, pageSize = 60, maxPages = 100, maximumResponseBytes = 2 * 1024 * 1024 } = {}) {
  let base;
  try {
    base = new URL(env.TWENTY_API_URL);
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) unavailable();
    const pathname = base.pathname.replace(/\/+$/, '');
    base.pathname = pathname.endsWith('/rest') ? pathname + '/' : pathname + '/rest/';
    if (!env.TWENTY_API_KEY || typeof env.TWENTY_API_KEY !== 'string' || /\s/.test(env.TWENTY_API_KEY) || env.TWENTY_API_KEY.length > 8192) unavailable();
    keyBytes(env.CNPS_PROPOSAL_SECRET);
    if (typeof fetchImpl !== 'function' || !Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 60 || !Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100 || !Number.isInteger(maximumResponseBytes) || maximumResponseBytes < 1 || maximumResponseBytes > 8 * 1024 * 1024) unavailable();
  } catch { unavailable(); }

  async function request(path, { method = 'GET', body, query = {}, missingAllowed = false } = {}) {
    const url = new URL(path, base);
    for (const [name, value] of Object.entries(query)) if (value !== undefined) url.searchParams.set(name, String(value));
    try {
      const response = await fetchImpl(url.href, {
        method, redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(timeoutMs),
        headers: { Authorization: `Bearer ${env.TWENTY_API_KEY}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      if (missingAllowed && response.status === 404) { await response.body?.cancel(); return null; }
      if (!response.ok || response.status < 200 || response.status >= 300 || !String(response.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) { await response.body?.cancel(); unavailable(); }
      const length = Number(response.headers.get('content-length'));
      if (Number.isFinite(length) && length > maximumResponseBytes) { await response.body?.cancel(); unavailable(); }
      let raw;
      if (response.body?.getReader) {
        const reader = response.body.getReader(), chunks = []; let size = 0;
        try {
          for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > maximumResponseBytes) { await reader.cancel(); unavailable(); } chunks.push(Buffer.from(value)); }
          raw = Buffer.concat(chunks, size).toString('utf8');
        } finally { reader.releaseLock(); }
      } else raw = await response.text();
      if (Buffer.byteLength(raw) > maximumResponseBytes) unavailable();
      const result = JSON.parse(raw);
      if (!result || typeof result !== 'object' || !result.data || Array.isArray(result.data) || result.errors) unavailable();
      return result;
    } catch { unavailable(); }
  }
  function rawId(record, expectedId) {
    try { const actual = uuid(record?.id); if (expectedId && actual !== expectedId) unavailable(); return actual; } catch { unavailable(); }
  }
  function company(record, expectedId) {
    if (!record || record.deletedAt) return null;
    return { id: rawId(record, expectedId), name: safeString(record.name), domain: safeString(record.domainName?.primaryLinkUrl), region: safeString(record.address?.addressCountry), active: true };
  }
  function contact(record, expectedId) {
    if (!record || record.deletedAt) return null;
    let companyId = null;
    if (record.companyId !== null && record.companyId !== undefined) { try { companyId = uuid(record.companyId); } catch { unavailable(); } }
    const number = safeString(record.phones?.primaryPhoneNumber), code = safeString(record.phones?.primaryPhoneCallingCode).replace(/^\+/, ''), country = safeString(record.phones?.primaryPhoneCountryCode).toUpperCase();
    // A foreign number must not accidentally look like an eleven-digit CN mobile.
    // Unknown/foreign calling codes do not receive a login identity.
    const explicitChina = code === '86' || (!code && country === 'CN') || (!code && number.startsWith('+86'));
    const normalized = explicitChina ? normalizePhone(number.replace(/[ ()-]/g, '')) : null;
    const firstName = safeString(record.name?.firstName), lastName = safeString(record.name?.lastName);
    return {
      id: rawId(record, expectedId), companyId, name: [firstName, lastName].filter(Boolean).join(' '), firstName, lastName,
      email: safeString(record.emails?.primaryEmail), phone: number, phoneCountryCode: code, jobTitle: safeString(record.jobTitle), active: true,
      ...(normalized ? { identityId: digest(env.CNPS_PROPOSAL_SECRET, 'phone', normalized) } : {})
    };
  }
  async function getRaw(resource, recordId) {
    recordId = uuid(recordId);
    const payload = await request(`${resource}/${recordId}`, { query: { depth: 0, fields: resource === 'people' ? CONTACT_FIELDS : COMPANY_FIELDS }, missingAllowed: true });
    const record = payload?.data?.[resource === 'people' ? 'person' : 'company'];
    if (!record) return null;
    rawId(record, recordId); return record.deletedAt ? null : record;
  }
  async function list(resource, filter) {
    const rows = [], seenIds = new Set(), seenCursors = new Set(); let cursor;
    for (let page = 0; page < maxPages; page++) {
      const payload = await request(resource, { query: { depth: 0, fields: resource === 'people' ? CONTACT_FIELDS : COMPANY_FIELDS, limit: pageSize, order_by: 'id[AscNullsLast]', filter, starting_after: cursor } });
      const records = payload.data[resource], info = payload.pageInfo;
      if (!Array.isArray(records) || !info || typeof info.hasNextPage !== 'boolean') unavailable();
      for (const record of records) { const recordId = rawId(record); if (seenIds.has(recordId)) unavailable(); seenIds.add(recordId); if (!record.deletedAt) rows.push(record); }
      if (!info.hasNextPage) return rows;
      if (!records.length || typeof info.endCursor !== 'string' || !info.endCursor || info.endCursor.length > 4096 || seenCursors.has(info.endCursor)) unavailable();
      cursor = info.endCursor; seenCursors.add(cursor);
    }
    // Never silently truncate a customer or employee directory.
    unavailable();
  }
  function personFields(fields, previous = {}) {
    validateFields(fields, ['firstName', 'lastName', 'email', 'phone', 'phoneCountryCode', 'jobTitle']);
    const result = {};
    if (fields.firstName !== undefined || fields.lastName !== undefined) result.name = { firstName: fields.firstName !== undefined ? text(fields.firstName, 200) : safeString(previous.name?.firstName), lastName: fields.lastName !== undefined ? text(fields.lastName, 200) : safeString(previous.name?.lastName) };
    if (fields.email !== undefined) result.emails = { primaryEmail: email(fields.email), additionalEmails: previous.emails?.additionalEmails || [] };
    if (fields.jobTitle !== undefined) result.jobTitle = text(fields.jobTitle, 200);
    if (fields.phone !== undefined || fields.phoneCountryCode !== undefined) {
      let number = fields.phone !== undefined ? phoneValue(fields.phone) : safeString(previous.phones?.primaryPhoneNumber);
      let code = fields.phoneCountryCode !== undefined ? callingCode(fields.phoneCountryCode) : safeString(previous.phones?.primaryPhoneCallingCode).replace(/^\+/, '');
      let country = code === safeString(previous.phones?.primaryPhoneCallingCode).replace(/^\+/, '') ? safeString(previous.phones?.primaryPhoneCountryCode) : '';
      if (!number) { code = ''; country = ''; }
      else {
        if (!code && normalizePhone(number)) code = '86';
        if (number.startsWith('+') && code) { if (!number.startsWith('+' + code)) invalid(); number = number.slice(code.length + 1); }
        if (code === '86') country = 'CN';
      }
      result.phones = { primaryPhoneNumber: number, primaryPhoneCallingCode: code ? '+' + code : '', primaryPhoneCountryCode: country, additionalPhones: previous.phones?.additionalPhones || [] };
    }
    return result;
  }
  async function createPerson(companyId, fields, recordId) {
    companyId = uuid(companyId);
    if (!await adapter.getCompany(companyId)) throw new BusinessError(404, '公司不存在或未获授权。');
    const body = { ...personFields(fields), companyId, ...(recordId ? { id: uuid(recordId) } : {}) };
    if (!body.name?.firstName && !body.name?.lastName) invalid();
    const payload = await request('people', { method: 'POST', body, query: { depth: 0, fields: CONTACT_FIELDS } });
    const result = contact(payload.data.createPerson, recordId);
    if (!result || result.companyId !== companyId) unavailable(); return result;
  }
  const adapter = {
    async getCompany(companyId) { companyId = uuid(companyId); return company(await getRaw('companies', companyId), companyId); },
    async listCompanies() { return (await list('companies')).map(record => company(record)); },
    async createCompany(fields) {
      validateFields(fields, ['name', 'domain']); const name = text(fields.name, 300); if (!name) invalid();
      const body = { name };
      if (fields.domain !== undefined) { const domain = text(fields.domain, 253).toLowerCase(); if (domain && !/^(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(domain)) invalid(); body.domainName = { primaryLinkUrl: domain ? `https://${domain}` : '', primaryLinkLabel: domain, secondaryLinks: [] }; }
      const payload = await request('companies', { method: 'POST', body, query: { depth: 0, fields: COMPANY_FIELDS } });
      const result = company(payload.data.createCompany); if (!result) unavailable(); return result;
    },
    async getContact(contactId) { contactId = uuid(contactId); return contact(await getRaw('people', contactId), contactId); },
    async listContacts(companyId) {
      companyId = uuid(companyId);
      const rows = (await list('people', `companyId[eq]:${companyId}`)).map(record => contact(record));
      if (rows.some(person => person.companyId !== companyId)) unavailable(); return rows;
    },
    createContact: (companyId, fields) => createPerson(companyId, fields),
    async updateContact(companyId, contactId, fields) {
      companyId = uuid(companyId); contactId = uuid(contactId);
      const previous = await getRaw('people', contactId);
      if (!previous || previous.companyId?.toLowerCase() !== companyId) throw new BusinessError(404, '联系人不存在或未获授权。');
      const body = personFields(fields, previous);
      const payload = await request(`people/${contactId}`, { method: 'PATCH', body, query: { depth: 0, fields: CONTACT_FIELDS } });
      const result = contact(payload.data.updatePerson, contactId);
      if (!result || result.companyId !== companyId) unavailable(); return result;
    },
    async getManager(staffId) {
      let internalCompanyId; try { internalCompanyId = uuid(env.CNPS_INTERNAL_COMPANY_ID); } catch { unavailable(); }
      const [company, person] = await Promise.all([adapter.getCompany(internalCompanyId), adapter.getContact(staffId)]);
      if (!company) return null;
      if (!person || person.companyId !== internalCompanyId || !person.identityId) return null;
      return { id: person.id, identityId: person.identityId, active: person.active };
    },
    async upsertInquiryLead(input) {
      validateFields(input, ['companyId', 'contactId', 'companyName', 'name', 'email', 'phone', 'region']);
      const companyId = uuid(input.companyId), contactId = uuid(input.contactId);
      if (companyId === contactId) invalid();
      const submittedCompany = text(input.companyName, 240), submittedName = text(input.name, 200), submittedEmail = email(input.email).toLowerCase();
      const submittedPhone = input.phone ? phoneValue(input.phone) : '', region = input.region ? text(input.region, 200) : '';
      if (!submittedCompany || !submittedName || !submittedEmail) invalid();
      const expectedName = PENDING_COMPANY_PREFIX + submittedCompany;
      let existingCompany = await adapter.getCompany(companyId);
      if (existingCompany && existingCompany.name !== expectedName) mismatch();
      let existingContact = await adapter.getContact(contactId);
      if (existingContact && (existingContact.companyId !== companyId || existingContact.email.toLowerCase() !== submittedEmail || existingContact.name !== submittedName)) mismatch();
      if (!existingCompany) {
        const payload = await request('companies', { method: 'POST', body: { id: companyId, name: expectedName, ...(region ? { address: { addressCountry: region } } : {}) }, query: { depth: 0, fields: COMPANY_FIELDS } });
        existingCompany = company(payload.data.createCompany, companyId);
        if (!existingCompany || existingCompany.name !== expectedName) unavailable();
      }
      if (!existingContact) existingContact = await createPerson(companyId, { firstName: submittedName, lastName: '', email: submittedEmail, ...(submittedPhone ? { phone: submittedPhone } : {}) }, contactId);
      if (existingContact.companyId !== companyId || existingContact.email.toLowerCase() !== submittedEmail || existingContact.name !== submittedName) mismatch();
      // No directory registration, portal membership, role promotion, merging by
      // email domain, or mutation of an existing customer's core record occurs.
      return { companyId, contactId, sourceTag: 'cnps-web-inquiry', awaitingVerification: true };
    }
  };
  return adapter;
}
