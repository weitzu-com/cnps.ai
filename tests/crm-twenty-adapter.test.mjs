import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { createTwentyAdapter } from '../server/crm-twenty-adapter.mjs';
import { BusinessError } from '../server/crm-business-service.mjs';
import { digest } from '../server/proposal-crypto.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const rejected = expected => error => error instanceof BusinessError && error.status === expected;
function dynamicPhone() { return '13' + String(randomInt(0, 1_000_000_000)).padStart(9, '0'); }
function dynamicEmail() { return randomBytes(8).toString('hex') + '@' + 'example.invalid'; }
function harness(options = {}) {
  const companyId = randomUUID(), otherCompanyId = randomUUID(), internalCompanyId = randomUUID(), contactId = randomUUID(), staffId = randomUUID();
  const phone = dynamicPhone(), mail = dynamicEmail();
  const env = { TWENTY_API_URL: 'https://crm.example.test/native', TWENTY_API_KEY: 'test-token-with-no-real-access', CNPS_PROPOSAL_SECRET: randomBytes(32).toString('hex'), CNPS_INTERNAL_COMPANY_ID: internalCompanyId };
  const companies = new Map([[companyId, { id: companyId, name: 'Company Alpha', deletedAt: null }], [otherCompanyId, { id: otherCompanyId, name: 'Company Beta', deletedAt: null }], [internalCompanyId, { id: internalCompanyId, name: 'Internal Team', deletedAt: null }]]);
  const nativeContact = (recordId, nativeCompanyId, firstName = 'Contact', number = phone) => ({ id: recordId, companyId: nativeCompanyId, name: { firstName, lastName: 'Alpha' }, emails: { primaryEmail: mail, additionalEmails: [] }, phones: { primaryPhoneNumber: number, primaryPhoneCountryCode: 'CN', primaryPhoneCallingCode: '+86', additionalPhones: [] }, jobTitle: 'Coordinator', deletedAt: null });
  const contacts = new Map([[contactId, nativeContact(contactId, companyId)], [staffId, nativeContact(staffId, internalCompanyId, 'Internal')]]);
  const requests = [], cursors = new Map(); let override;
  async function fetchImpl(address, init) {
    const url = new URL(address), body = init.body ? JSON.parse(init.body) : undefined;
    requests.push({ url, init, body });
    assert.equal(url.origin, 'https://crm.example.test');
    assert.equal(init.redirect, 'manual'); assert.equal(init.cache, 'no-store');
    assert.equal(init.headers.Authorization, 'Bearer ' + env.TWENTY_API_KEY);
    assert.ok(init.signal instanceof AbortSignal);
    if (override) return override(url, init, body);
    const parts = url.pathname.split('/').filter(Boolean), resource = parts.at(-2) === 'rest' ? parts.at(-1) : parts.at(-2), recordId = parts.at(-2) === 'rest' ? undefined : parts.at(-1);
    assert.ok(['companies', 'people'].includes(resource));
    const dataset = resource === 'companies' ? companies : contacts;
    if (init.method === 'GET' && recordId) return dataset.has(recordId) ? json({ data: { [resource === 'companies' ? 'company' : 'person']: dataset.get(recordId) } }) : json({ errors: ['not found'] }, 404);
    if (init.method === 'GET') {
      let rows = [...dataset.values()].sort((a, b) => a.id.localeCompare(b.id));
      if (url.searchParams.get('filter')) { const nativeCompanyId = url.searchParams.get('filter').split(':')[1]; rows = rows.filter(record => record.companyId === nativeCompanyId); }
      const offset = cursors.get(url.searchParams.get('starting_after')) || 0, limit = Number(url.searchParams.get('limit')), selected = rows.slice(offset, offset + limit);
      const endCursor = `cursor+/${offset + selected.length}=`; cursors.set(endCursor, offset + selected.length);
      return json({ data: { [resource]: selected }, totalCount: rows.length, pageInfo: { hasNextPage: offset + selected.length < rows.length, hasPreviousPage: offset > 0, endCursor } });
    }
    if (init.method === 'POST') {
      const record = { ...body, id: body.id || randomUUID(), deletedAt: null };
      if (dataset.has(record.id)) return json({ errors: ['private conflict details'] }, 409);
      dataset.set(record.id, record); return json({ data: { [resource === 'companies' ? 'createCompany' : 'createPerson']: record } }, 201);
    }
    if (init.method === 'PATCH') { const record = dataset.get(recordId); Object.assign(record, body); return json({ data: { updatePerson: record } }); }
    throw Error('unsupported test method');
  }
  const adapter = createTwentyAdapter(env, { fetchImpl, ...options });
  return { adapter, env, companyId, otherCompanyId, internalCompanyId, contactId, staffId, phone, mail, companies, contacts, nativeContact, requests, override: handler => override = handler, fetchImpl };
}

test('native adapter uses verified v2.46 GET response envelopes and composite phone identity', async () => {
  const h = harness();
  const company = await h.adapter.getCompany(h.companyId), person = await h.adapter.getContact(h.contactId);
  assert.equal(company.name, 'Company Alpha'); assert.equal(person.companyId, h.companyId); assert.equal(person.email, h.mail);
  assert.equal(person.identityId, digest(h.env.CNPS_PROPOSAL_SECRET, 'phone', h.phone));
  assert.equal(person.phoneCountryCode, '86');
  assert.equal(h.requests[1].url.pathname, `/native/rest/people/${h.contactId}`);
  assert.ok(h.requests[1].url.searchParams.get('fields').split(',').includes('company'));
  assert.ok(!h.requests[1].url.searchParams.get('fields').split(',').includes('companyId'));
  assert.equal(h.requests[1].url.searchParams.get('depth'), '0');
  assert.ok(!Object.hasOwn(person, 'raw')); assert.ok(!JSON.stringify(person).includes(h.env.TWENTY_API_KEY));
});
test('full company/contact lists follow starting_after cursors without truncation or foreign-company rows', async () => {
  const h = harness({ pageSize: 2 });
  for (let i = 0; i < 5; i++) { const companyId = randomUUID(); h.companies.set(companyId, { id: companyId, name: `Additional Company ${i}` }); const personId = randomUUID(); h.contacts.set(personId, h.nativeContact(personId, h.companyId)); }
  assert.equal((await h.adapter.listCompanies()).length, h.companies.size);
  const rows = await h.adapter.listContacts(h.companyId);
  assert.equal(rows.length, 6); assert.ok(rows.every(person => person.companyId === h.companyId));
  const contactCalls = h.requests.filter(request => request.url.pathname.endsWith('/people'));
  assert.ok(contactCalls.every(request => request.url.searchParams.get('filter') === `companyId[eq]:${h.companyId}`));
  assert.ok(contactCalls.slice(1).every(request => request.url.searchParams.get('starting_after')));
  assert.ok(h.requests.some(request => request.url.href.includes('starting_after=cursor%2B%2F')));
});
test('default native list limit is 60 and values above the confirmed API maximum are rejected', async () => {
  const h = harness(); await h.adapter.listCompanies();
  assert.equal(h.requests[0].url.searchParams.get('limit'), '60');
  assert.throws(() => createTwentyAdapter(h.env, { fetchImpl: h.fetchImpl, pageSize: 61 }), rejected(503));
});
test('native paging fails closed on missing metadata, duplicates, repeated cursors and maximum page exhaustion', async () => {
  const badMetadata = harness(); badMetadata.override(() => json({ data: { companies: [] } }));
  await assert.rejects(badMetadata.adapter.listCompanies(), rejected(503));
  const duplicates = harness(); duplicates.override(() => json({ data: { companies: [duplicates.companies.get(duplicates.companyId), duplicates.companies.get(duplicates.companyId)] }, pageInfo: { hasNextPage: false } }));
  await assert.rejects(duplicates.adapter.listCompanies(), rejected(503));
  const repeated = harness(); let step = 0;
  repeated.override(() => json({ data: { companies: [{ id: step++ ? repeated.otherCompanyId : repeated.companyId, name: 'Company' }] }, pageInfo: { hasNextPage: true, endCursor: 'same-cursor' } }));
  await assert.rejects(repeated.adapter.listCompanies(), rejected(503)); assert.equal(repeated.requests.length, 2);
  const exhausted = harness({ pageSize: 1, maxPages: 1 }); await assert.rejects(exhausted.adapter.listCompanies(), rejected(503));
});
test('a filter-violating native contact response is not leaked as a partial directory', async () => {
  const h = harness(); h.override(() => json({ data: { people: [h.contacts.get(h.staffId)] }, pageInfo: { hasNextPage: false } }));
  await assert.rejects(h.adapter.listContacts(h.companyId), rejected(503));
});
test('create company/contact maps canonical fields into official native composite fields and envelopes', async () => {
  const h = harness(), email = dynamicEmail(), phone = dynamicPhone();
  const company = await h.adapter.createCompany({ name: 'New Company', domain: 'example.test' });
  assert.equal(company.name, 'New Company');
  const companyBody = h.requests.find(request => request.init.method === 'POST').body;
  assert.equal(companyBody.domainName.primaryLinkUrl, 'https://example.test');
  assert.deepEqual(companyBody.domainName.secondaryLinks, []);
  const person = await h.adapter.createContact(h.companyId, { firstName: 'New', lastName: 'Contact', email, phone: '+86' + phone, phoneCountryCode: '86', jobTitle: 'Project owner' });
  assert.equal(person.identityId, digest(h.env.CNPS_PROPOSAL_SECRET, 'phone', phone));
  const body = h.requests.at(-1).body;
  assert.deepEqual(body.name, { firstName: 'New', lastName: 'Contact' });
  assert.equal(body.emails.primaryEmail, email);
  assert.equal(body.phones.primaryPhoneCallingCode, '+86'); assert.equal(body.phones.primaryPhoneCountryCode, 'CN'); assert.equal(body.phones.primaryPhoneNumber, phone);
  assert.equal(body.companyId, h.companyId); assert.ok(!Object.hasOwn(body, 'role'));
});
test('contact patch verifies ownership, preserves other name/composite entries and cannot change company or role', async () => {
  const h = harness(), previous = h.contacts.get(h.contactId), extra = dynamicEmail();
  previous.emails.additionalEmails = [extra];
  const result = await h.adapter.updateContact(h.companyId, h.contactId, { firstName: 'Updated', email: dynamicEmail() });
  assert.equal(result.firstName, 'Updated'); assert.equal(result.lastName, 'Alpha');
  const body = h.requests.at(-1).body;
  assert.equal(body.name.lastName, 'Alpha'); assert.deepEqual(body.emails.additionalEmails, [extra]);
  assert.ok(!Object.hasOwn(body, 'companyId'));
  const before = h.requests.filter(request => request.init.method === 'PATCH').length;
  await assert.rejects(h.adapter.updateContact(h.otherCompanyId, h.contactId, { firstName: 'Unauthorized' }), rejected(404));
  await assert.rejects(h.adapter.updateContact(h.companyId, h.contactId, { companyId: h.otherCompanyId }), rejected(400));
  await assert.rejects(h.adapter.updateContact(h.companyId, h.contactId, { role: 'admin' }), rejected(400));
  assert.equal(h.requests.filter(request => request.init.method === 'PATCH').length, before);
});
test('only internal-company staff with an explicit CN phone identity can become manager candidates', async () => {
  const h = harness();
  assert.equal((await h.adapter.getManager(h.staffId)).identityId, digest(h.env.CNPS_PROPOSAL_SECRET, 'phone', h.phone));
  assert.equal(await h.adapter.getManager(h.contactId), null);
  h.contacts.get(h.staffId).phones.primaryPhoneCallingCode = '+1'; h.contacts.get(h.staffId).phones.primaryPhoneCountryCode = 'US';
  assert.equal(await h.adapter.getManager(h.staffId), null);
  delete h.env.CNPS_INTERNAL_COMPANY_ID;
  await assert.rejects(h.adapter.getManager(h.staffId), rejected(503));
});
test('soft-deleting the internal company prevents otherwise active contacts from acting as manager candidates', async () => {
  const h = harness();
  assert.ok(await h.adapter.getManager(h.staffId));
  h.companies.get(h.internalCompanyId).deletedAt = new Date().toISOString();
  assert.equal(await h.adapter.getManager(h.staffId), null);
});
test('foreign and ambiguous phone numbers never gain a CN SMS identity and email-only contacts remain available', async () => {
  const h = harness(), previous = h.contacts.get(h.contactId);
  previous.phones.primaryPhoneCallingCode = '+1'; previous.phones.primaryPhoneCountryCode = 'US';
  assert.ok(!Object.hasOwn(await h.adapter.getContact(h.contactId), 'identityId'));
  previous.phones = { primaryPhoneNumber: h.phone, primaryPhoneCallingCode: '', primaryPhoneCountryCode: '' };
  assert.ok(!Object.hasOwn(await h.adapter.getContact(h.contactId), 'identityId'));
  previous.phones = { primaryPhoneNumber: '', primaryPhoneCallingCode: '', primaryPhoneCountryCode: '' };
  const person = await h.adapter.getContact(h.contactId);
  assert.equal(person.email, h.mail); assert.ok(!person.identityId);
});
test('strict UUIDs block path/query injection before any native request', async () => {
  const h = harness();
  for (const recordId of ['../people', h.contactId + '?fields=all', 'company-alpha', '00000000-0000-0000-0000-000000000000']) await assert.rejects(h.adapter.getContact(recordId), rejected(400));
  assert.equal(h.requests.length, 0);
  assert.equal(await h.adapter.getContact(randomUUID()), null);
});
test('HTTPS base URLs, server credential requirements and internal native prefixes are enforced', () => {
  const h = harness();
  for (const TWENTY_API_URL of ['http://crm.example.test', 'https://user:password@crm.example.test', 'https://crm.example.test?secret=value', 'https://crm.example.test/#fragment']) assert.throws(() => createTwentyAdapter({ ...h.env, TWENTY_API_URL }, { fetchImpl: h.fetchImpl }), rejected(503));
  assert.throws(() => createTwentyAdapter({ ...h.env, TWENTY_API_KEY: '' }, { fetchImpl: h.fetchImpl }), rejected(503));
  assert.throws(() => createTwentyAdapter({ ...h.env, CNPS_PROPOSAL_SECRET: '' }, { fetchImpl: h.fetchImpl }), rejected(503));
});
test('redirects, provider errors and malformed/oversized responses expose no private diagnostics or key', async () => {
  const factories = [
    () => new Response('private redirect', { status: 302, headers: { Location: 'https://untrusted.example.test' } }),
    () => json({ errors: ['provider credential details'] }, 403),
    () => new Response('{ private malformed', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    () => json({ data: {}, errors: ['private provider failures'] })
  ];
  for (const factory of factories) {
    const h = harness(); h.override(factory);
    await assert.rejects(h.adapter.getCompany(h.companyId), error => rejected(503)(error) && !error.message.includes('private') && !error.message.includes(h.env.TWENTY_API_KEY));
    assert.equal(h.requests.length, 1);
  }
  const large = harness({ maximumResponseBytes: 128 }); large.override(() => json({ data: { company: { id: large.companyId, name: 'x'.repeat(200) } } }));
  await assert.rejects(large.adapter.getCompany(large.companyId), rejected(503));
});
test('native request timeout is bounded and converted to a safe unavailable error', async () => {
  const h = harness();
  const adapter = createTwentyAdapter(h.env, { timeoutMs: 5, fetchImpl: async (url, init) => new Promise((resolve, reject) => {
    const hold = setTimeout(() => reject(Error('unexpected missing abort')), 100);
    init.signal.addEventListener('abort', () => { clearTimeout(hold); reject(Error('private timeout provider details')); }, { once: true });
  }) });
  await assert.rejects(adapter.getCompany(h.companyId), error => rejected(503)(error) && !error.message.includes('private'));
});
test('soft-deleted records and a returned wrong record UUID cannot become active data', async () => {
  const h = harness(); h.contacts.get(h.contactId).deletedAt = new Date().toISOString();
  assert.equal(await h.adapter.getContact(h.contactId), null);
  h.override(() => json({ data: { company: h.companies.get(h.otherCompanyId) } }));
  await assert.rejects(h.adapter.getCompany(h.companyId), rejected(503));
});
test('inquiry fixed UUID upsert creates pending native leads and repeated calls only verify existing records', async () => {
  const h = harness(), input = { companyId: randomUUID(), contactId: randomUUID(), companyName: 'Claimed Company', name: 'Submitted Name', email: dynamicEmail(), phone: dynamicPhone(), region: 'Claimed Region' };
  const result = await h.adapter.upsertInquiryLead(input);
  assert.deepEqual(result, { companyId: input.companyId, contactId: input.contactId, sourceTag: 'cnps-web-inquiry', awaitingVerification: true });
  assert.equal(h.companies.get(input.companyId).name, '待核验 · Claimed Company');
  assert.equal(h.companies.get(input.companyId).address.addressCountry, input.region);
  assert.equal(h.contacts.get(input.contactId).companyId, input.companyId);
  const posts = h.requests.filter(request => request.init.method === 'POST').length;
  await h.adapter.upsertInquiryLead(input);
  assert.equal(h.requests.filter(request => request.init.method === 'POST').length, posts);
  assert.equal(h.requests.filter(request => request.init.method === 'PATCH').length, 0);
});
test('inquiry upsert rejects cross-company existing records and altered identities without modifying anybody', async () => {
  const h = harness(), companyId = randomUUID(), contactId = randomUUID(), input = { companyId, contactId, companyName: 'Claimed Company', name: 'Submitted Name', email: dynamicEmail() };
  h.companies.set(companyId, { id: companyId, name: '待核验 · Claimed Company' });
  h.contacts.set(contactId, { id: contactId, companyId: h.otherCompanyId, name: { firstName: input.name, lastName: '' }, emails: { primaryEmail: input.email } });
  await assert.rejects(h.adapter.upsertInquiryLead(input), rejected(409));
  assert.equal(h.requests.filter(request => request.init.method !== 'GET').length, 0);
  h.contacts.get(contactId).companyId = companyId; h.contacts.get(contactId).name.firstName = 'Changed Name';
  await assert.rejects(h.adapter.upsertInquiryLead(input), rejected(409));
  h.companies.get(companyId).name = 'Existing Verified Company';
  await assert.rejects(h.adapter.upsertInquiryLead(input), rejected(409));
  assert.equal(h.requests.filter(request => request.init.method !== 'GET').length, 0);
});
test('inquiry recovery after an uncertain native POST uses the same UUID and never creates a second company', async () => {
  const h = harness(), input = { companyId: randomUUID(), contactId: randomUUID(), companyName: 'Claimed Company', name: 'Submitted Name', email: dynamicEmail() };
  const baseFetch = h.fetchImpl; let failed = false;
  const adapter = createTwentyAdapter(h.env, { fetchImpl: async (url, init) => {
    const response = await baseFetch(url, init);
    if (!failed && init.method === 'POST' && new URL(url).pathname.endsWith('/companies')) { failed = true; throw Error('private uncertain write response'); }
    return response;
  } });
  await assert.rejects(adapter.upsertInquiryLead(input), rejected(503));
  assert.ok(h.companies.has(input.companyId));
  await adapter.upsertInquiryLead(input);
  assert.equal(h.requests.filter(request => request.init.method === 'POST' && request.url.pathname.endsWith('/companies')).length, 1);
  assert.equal(h.requests.filter(request => request.init.method === 'POST' && request.url.pathname.endsWith('/people')).length, 1);
});
test('international inquiry phone prefix is preserved and never silently rewritten to China', async () => {
  const h = harness(), prefix = '+1', number = String(randomInt(2_000_000_000, 9_000_000_000)), input = { companyId: randomUUID(), contactId: randomUUID(), companyName: 'Claimed Company', name: 'Submitted Name', email: dynamicEmail(), phone: prefix + number };
  await h.adapter.upsertInquiryLead(input);
  const person = await h.adapter.getContact(input.contactId);
  assert.equal(person.phone, input.phone); assert.equal(person.phoneCountryCode, ''); assert.ok(!person.identityId);
});
