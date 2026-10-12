import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomInt } from 'node:crypto';
import { createBusinessStore, emptyDirectory, emptyCompany } from '../server/crm-business-store.mjs';
import { createBusinessService, BusinessError, PMP_RECORD_TYPES, PMP_MAX_UPLOAD_BYTES, PMP_DOCUMENT_MIME_TYPES } from '../server/crm-business-service.mjs';
import { createBusinessHandler } from '../server/crm-business-handler.mjs';

// All actors/contacts are opaque synthetic identifiers, with no real phone or
// email fixtures. The phone-HMAC lookup test generates its number at runtime.
const principal = (identityId, role) => ({ identityId, identity: { role } });
const admin = principal('actor-admin', 'admin'), manager = principal('actor-manager-A', 'sales_manager');
const customer = principal('actor-customer-A', 'customer'), otherCustomer = principal('actor-customer-B', 'customer');
const clone = value => structuredClone(value);
async function setup() {
  let directory = emptyDirectory(), sequence = 0, clock = Date.UTC(2026, 9, 13), beforeCommit, duringRead, duringCreate;
  const states = new Map(), nativeCompanies = new Map([
    ['company-A', { id: 'company-A', name: 'Company Alpha' }], ['company-B', { id: 'company-B', name: 'Company Beta' }]
  ]);
  const contacts = new Map([
    ['contact-A', { id: 'contact-A', companyId: 'company-A', name: 'Contact Alpha', firstName: 'Contact', lastName: 'Alpha', active: true, identityId: customer.identityId }],
    ['contact-A-no-login', { id: 'contact-A-no-login', companyId: 'company-A', name: 'Contact Without Login', firstName: 'Contact', lastName: 'Without Login', active: true }],
    ['contact-B', { id: 'contact-B', companyId: 'company-B', name: 'Contact Beta', firstName: 'Contact', lastName: 'Beta', active: true, identityId: otherCustomer.identityId }]
  ]);
  const managers = new Map([['staff-A', { id: 'staff-A', active: true, identityId: manager.identityId }]]);
  const store = {
    async getDirectory() { return clone(directory); }, async getCompany(companyId) { return clone(states.get(companyId) || emptyCompany(companyId)); },
    async commitDirectory(revision, next) { if (directory.revision !== revision || next.revision !== revision + 1) return false; directory = clone(next); return true; },
    async commitCompany(companyId, directoryRevision, revision, next) {
      if (beforeCommit) { const callback = beforeCommit; beforeCommit = null; await callback(); }
      if (directory.revision !== directoryRevision || (states.get(companyId)?.revision || 0) !== revision || next.revision !== revision + 1 || next.companyId !== companyId) return false;
      states.set(companyId, clone(next)); return true;
    }
  };
  const env = { CNPS_PROPOSAL_SECRET: randomBytes(32).toString('hex') }, nativeCalls = [];
  const twenty = {
    async getCompany(companyId) { nativeCalls.push(['getCompany', companyId]); return clone(nativeCompanies.get(companyId)); },
    async listCompanies() { return [...nativeCompanies.values()].map(clone); },
    async getContact(contactId) { nativeCalls.push(['getContact', contactId]); return clone(contacts.get(contactId)); },
    async getManager(staffId) { return clone(managers.get(staffId)); },
    async listContacts(companyId) { return [...contacts.values()].filter(contact => contact.companyId === companyId).map(clone); },
    async createCompany(fields) { const company = { id: `native-company-${++sequence}`, ...fields }; nativeCompanies.set(company.id, company); return clone(company); },
    async createContact(companyId, fields) { nativeCalls.push(['createContact', companyId]); const contact = { id: `native-contact-${++sequence}`, companyId, name: `${fields.firstName || ''} ${fields.lastName || ''}`.trim(), active: true, ...fields }; contacts.set(contact.id, contact); return clone(contact); },
    async updateContact(companyId, contactId, fields) { nativeCalls.push(['updateContact', companyId, contactId]); const contact = contacts.get(contactId); if (contact?.companyId !== companyId) throw Error('not owned'); Object.assign(contact, fields); return clone(contact); }
  };
  const objects = new Map(), uploads = [];
  const documents = {
    async createObject(input) {
      uploads.push({ companyId: input.companyId, projectId: input.projectId, filename: input.filename, mimeType: input.mimeType });
      const bytes = Buffer.from(input.base64, 'base64'), objectId = `uploaded-object-${++sequence}`;
      const metadata = { id: objectId, companyId: input.companyId, projectId: input.projectId, filename: input.filename, mimeType: input.mimeType, size: bytes.length };
      objects.set(objectId, { metadata, bytes });
      if (duringCreate) { const callback = duringCreate; duringCreate = null; await callback(); }
      return clone(metadata);
    },
    async getObject(objectId) { return clone(objects.get(objectId)?.metadata); },
    async readObject(objectId, context) {
      if (duringRead) { const callback = duringRead; duringRead = null; await callback(); }
      const file = objects.get(objectId);
      if (file?.metadata.companyId !== context.companyId || file?.metadata.projectId !== context.projectId) throw Error('private object ownership mismatch');
      return Buffer.from(file.bytes);
    }
  };
  const service = createBusinessService({ env, store, twenty, documents, now: () => clock, newId: () => `resource-${++sequence}` });
  await service.registerCompany(admin, 'company-A'); await service.registerCompany(admin, 'company-B');
  await service.assignManager(admin, 'staff-A', ['company-A']);
  const projectA = await service.createProject(manager, 'company-A', { title: 'Alpha Project', objective: 'Approved objective', scope: 'Alpha scope', deliverables: ['Approved delivery'] });
  const hiddenProject = await service.createProject(admin, 'company-A', { title: 'Hidden Project' });
  const projectB = await service.createProject(admin, 'company-B', { title: 'Beta Project' });
  for (const project of [projectA, hiddenProject, projectB]) await service.publishProject(admin, project.companyId, project.id);
  async function addDocument(companyId, projectId, title) {
    const objectId = `object-${++sequence}`, bytes = Buffer.from(title);
    objects.set(objectId, { metadata: { id: objectId, companyId, projectId, mimeType: 'application/pdf', size: bytes.length, filename: 'delivery.pdf' }, bytes });
    const registered = await service.registerDocument(admin, companyId, projectId, { objectId, title });
    const document = await service.publishDocument(admin, companyId, registered.documentId, registered.versionId);
    return { ...document, objectId };
  }
  const docA = await addDocument('company-A', projectA.id, 'Alpha Published Delivery');
  const privateDoc = await addDocument('company-A', projectA.id, 'Restricted Alpha Delivery');
  const docB = await addDocument('company-B', projectB.id, 'Beta Published Delivery');
  const grant = { contactId: 'contact-A', projectScope: 'selected', projectIds: [projectA.id], documentScope: 'selected', documentIds: [docA.id], allowApprovals: true };
  await service.grantMember(manager, 'company-A', grant);
  await service.grantMember(admin, 'company-B', { contactId: 'contact-B', projectScope: 'all', documentScope: 'all' });
  const handler = createBusinessHandler({ env, service, authHandler: { async loadSession(req) { const actor = req.headers.cookie; return ({ admin, manager, customer, otherCustomer })[actor] || null; } } });
  async function request(query, { actor = 'customer', method = 'GET', body, origin = 'https://www.cnps.ai', headers: extra = {} } = {}) {
    const headers = {}; let output;
    const res = { setHeader(name, value) { headers[name.toLowerCase()] = value; }, end(value) { output = value; } };
    await handler({ url: `/api/crm-workspace${query ? '?' + query : ''}`, method, body, headers: { cookie: actor, origin, 'content-type': 'application/json', 'x-cnps-crm': '1', ...extra } }, res);
    return { status: res.statusCode, headers, bytes: output, json: () => JSON.parse(output) };
  }
  return { env, store, service, twenty, documents, nativeCalls, nativeCompanies, contacts, managers, objects, uploads, projectA, projectB, hiddenProject, docA, privateDoc, docB, grant, request,
    beforeCommit: callback => beforeCommit = callback, duringRead: callback => duringRead = callback, duringCreate: callback => duringCreate = callback, advance: ms => clock += ms };
}
const status = expected => error => error instanceof BusinessError && error.status === expected;

test('customers see only their company, selected published projects and selected documents', async () => {
  const h = await setup();
  assert.deepEqual((await h.service.listCompanies(customer)).map(company => company.companyId), ['company-A']);
  assert.deepEqual((await h.service.listProjects(customer, 'company-A')).map(project => project.id), [h.projectA.id]);
  assert.deepEqual((await h.service.listDocuments(customer, 'company-A', h.projectA.id)).map(doc => doc.id), [h.docA.id]);
  await assert.rejects(h.service.getProject(customer, 'company-A', h.hiddenProject.id), status(404));
  await assert.rejects(h.service.getDocument(customer, 'company-A', h.privateDoc.id), status(404));
  await assert.rejects(h.service.getProject(customer, 'company-B', h.projectB.id), status(404));
  await assert.rejects(h.service.getDocument(customer, 'company-A', h.docB.id), status(404));
  assert.ok(!JSON.stringify(await h.service.getDocument(customer, 'company-A', h.docA.id)).includes('objectId'));
});
test('manager assignments restrict all mutations, directory grants and contact operations to their companies', async () => {
  const h = await setup();
  await assert.rejects(h.service.createProject(manager, 'company-B', { title: 'Unauthorized' }), status(404));
  await assert.rejects(h.service.grantMember(manager, 'company-B', { contactId: 'contact-B', projectScope: 'all', documentScope: 'all' }), status(404));
  await assert.rejects(h.service.grantMember(manager, 'company-A', { contactId: 'contact-B', projectScope: 'all', documentScope: 'all' }), status(404));
  await assert.rejects(h.service.assignManager(manager, 'staff-A', ['company-B']), status(404));
  await assert.rejects(h.service.createCompany(manager, { name: 'Unauthorized' }), status(404));
  await assert.rejects(h.service.createContact(manager, 'company-B', { firstName: 'Unauthorized' }), status(404));
  await assert.rejects(h.service.updateContact(manager, 'company-A', 'contact-B', { firstName: 'Unauthorized' }), status(404));
  await assert.rejects(h.service.listContacts(customer, 'company-A'), status(404));
});
test('company ownership is immutable even after revocation and a duplicate native contact appears in another company', async () => {
  const h = await setup();
  await h.service.revokeMember(manager, 'company-A', 'contact-A');
  h.contacts.set('contact-moved', { id: 'contact-moved', companyId: 'company-B', active: true, identityId: customer.identityId });
  await assert.rejects(h.service.grantMember(admin, 'company-B', { contactId: 'contact-moved', projectScope: 'all', documentScope: 'all' }), status(409));
  const directory = await h.store.getDirectory();
  assert.equal(directory.memberGrants[customer.identityId].companyId, 'company-A');
  assert.equal(directory.memberGrants[customer.identityId].active, false);
});
test('no request role or directory grant can promote a customer or reuse a manager identity as a customer', async () => {
  const h = await setup();
  await assert.rejects(h.service.grantMember(manager, 'company-A', { ...h.grant, role: 'admin' }), status(400));
  h.contacts.set('contact-manager', { id: 'contact-manager', companyId: 'company-A', active: true, identityId: manager.identityId });
  await assert.rejects(h.service.grantMember(admin, 'company-A', { ...h.grant, contactId: 'contact-manager' }), status(409));
  h.managers.set('staff-customer', { id: 'staff-customer', identityId: customer.identityId, active: true });
  await assert.rejects(h.service.assignManager(admin, 'staff-customer', ['company-B']), status(409));
});
test('grant scope rejects cross-company project/document IDs and documents outside selected projects', async () => {
  const h = await setup();
  await assert.rejects(h.service.grantMember(manager, 'company-A', { ...h.grant, projectIds: [h.projectB.id] }), status(404));
  await assert.rejects(h.service.grantMember(manager, 'company-A', { ...h.grant, documentIds: [h.docB.id] }), status(404));
  await assert.rejects(h.service.grantMember(manager, 'company-A', { ...h.grant, projectIds: [h.hiddenProject.id], documentIds: [h.docA.id] }), status(404));
});
test('revocation is immediately effective for existing principals and manager deassignment is immediate', async () => {
  const h = await setup();
  await h.service.revokeMember(manager, 'company-A', 'contact-A');
  await assert.rejects(h.service.listProjects(customer, 'company-A'), status(404));
  assert.equal((await h.service.listCompanies(customer)).length, 0);
  await h.service.assignManager(admin, 'staff-A', [], false);
  await assert.rejects(h.service.listContacts(manager, 'company-A'), status(404));
  await assert.rejects(h.service.grantMember(manager, 'company-A', h.grant), status(404));
});
test('permission changes during a company mutation cause atomic conflict with no unauthorized commit', async () => {
  const h = await setup(), before = await h.store.getCompany('company-A');
  h.beforeCommit(() => h.service.assignManager(admin, 'staff-A', [], false));
  await assert.rejects(h.service.createProject(manager, 'company-A', { title: 'Racing Unauthorized Write' }), status(409));
  assert.deepEqual(await h.store.getCompany('company-A'), before);
});
test('batch updates reject cross-company IDs before committing any item', async () => {
  const h = await setup();
  const a = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'task', { title: 'Task Alpha' });
  const b = await h.service.createRecord(admin, 'company-B', h.projectB.id, 'task', { title: 'Task Beta' });
  await assert.rejects(h.service.updateRecords(manager, 'company-A', [{ id: a.id, fields: { title: 'Must Not Save' } }, { id: b.id, fields: { title: 'Must Not Save' } }]), status(404));
  assert.equal((await h.service.getRecord(manager, 'company-A', a.id)).title, 'Task Alpha');
  assert.equal((await h.service.getRecord(admin, 'company-B', b.id)).title, 'Task Beta');
});
test('all six PMP object types persist; customer sees only published client-visible snapshots', async () => {
  const h = await setup(), created = [];
  for (const type of PMP_RECORD_TYPES) created.push(await h.service.createRecord(manager, 'company-A', h.projectA.id, type, { title: `${type} Alpha`, clientVisible: type !== 'risk' }));
  assert.equal((await h.service.listRecords(customer, 'company-A', h.projectA.id)).length, 0);
  await h.service.publishProject(manager, 'company-A', h.projectA.id);
  assert.equal((await h.service.listRecords(customer, 'company-A', h.projectA.id)).length, 5);
  const task = created.find(record => record.type === 'task'), risk = created.find(record => record.type === 'risk');
  await h.service.updateRecords(manager, 'company-A', [{ id: task.id, fields: { title: 'Draft New Title' } }]);
  assert.equal((await h.service.getRecord(customer, 'company-A', task.id)).title, 'task Alpha');
  await assert.rejects(h.service.getRecord(customer, 'company-A', risk.id), status(404));
  await h.service.publishProject(manager, 'company-A', h.projectA.id);
  assert.equal((await h.service.getRecord(customer, 'company-A', task.id)).title, 'Draft New Title');
});
test('project unpublication hides records and files and publication versions never restart', async () => {
  const h = await setup(), initial = await h.service.getProject(manager, 'company-A', h.projectA.id);
  await h.service.unpublishProject(manager, 'company-A', h.projectA.id);
  assert.equal((await h.service.listProjects(customer, 'company-A')).length, 0);
  await assert.rejects(h.service.getDocument(customer, 'company-A', h.docA.id), status(404));
  const published = await h.service.publishProject(manager, 'company-A', h.projectA.id);
  assert.equal(published.publicationVersion, initial.publication.version + 1);
});
test('document withdrawal and version replacement immediately reject stale downloads', async () => {
  const h = await setup();
  assert.equal((await h.service.download(customer, 'company-A', h.docA.id, h.docA.versionId)).bytes.toString(), 'Alpha Published Delivery');
  const bytes = Buffer.from('Version Two');
  h.objects.set('object-new-version', { metadata: { id: 'object-new-version', companyId: 'company-A', projectId: h.projectA.id, filename: 'delivery-v2.pdf', mimeType: 'application/pdf', size: bytes.length }, bytes });
  const registered = await h.service.registerDocument(manager, 'company-A', h.projectA.id, { objectId: 'object-new-version', title: 'Draft title remains private', documentId: h.docA.id });
  assert.equal((await h.service.getDocument(customer, 'company-A', h.docA.id)).title, 'Alpha Published Delivery');
  await h.service.publishDocument(manager, 'company-A', h.docA.id, registered.versionId);
  await assert.rejects(h.service.download(customer, 'company-A', h.docA.id, h.docA.versionId), status(404));
  assert.equal((await h.service.download(customer, 'company-A', h.docA.id, registered.versionId)).bytes.toString(), 'Version Two');
  await h.service.withdrawDocument(manager, 'company-A', h.docA.id, registered.versionId);
  await assert.rejects(h.service.download(customer, 'company-A', h.docA.id, registered.versionId), status(404));
});
test('download rechecks membership after private object IO and rejects revocation in flight', async () => {
  const h = await setup();
  h.duringRead(() => h.service.revokeMember(admin, 'company-A', 'contact-A'));
  await assert.rejects(h.service.download(customer, 'company-A', h.docA.id, h.docA.versionId), status(404));
});
test('private object ownership is checked before registration; no guessed object from another company is accepted', async () => {
  const h = await setup();
  await assert.rejects(h.service.registerDocument(manager, 'company-A', h.projectA.id, { objectId: h.docB.objectId, title: 'Unauthorized' }), status(404));
  await assert.rejects(h.service.registerDocument(manager, 'company-A', h.projectA.id, { objectId: 'unknown-object', title: 'Unauthorized' }), status(404));
});
test('search filters unauthorized projects, private records and documents before matching', async () => {
  const h = await setup();
  const internal = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'risk', { title: 'Restricted Alpha risk', clientVisible: false });
  await h.service.publishProject(manager, 'company-A', h.projectA.id);
  const results = await h.service.search(customer, 'company-A', 'Alpha');
  assert.ok(results.some(item => item.id === h.projectA.id));
  assert.ok(results.some(item => item.id === h.docA.id));
  for (const denied of [h.hiddenProject.id, h.privateDoc.id, h.docB.id, internal.id]) assert.ok(!results.some(item => item.id === denied));
  await assert.rejects(h.service.search(customer, 'company-B', 'Beta'), status(404));
});
test('approval requires published requested version, explicit approval grant and document access', async () => {
  const h = await setup();
  const acceptance = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'acceptance', { title: 'Acceptance Alpha', status: 'requested', criteria: 'Acceptance checklist', deliverableDocumentIds: [h.docA.id], clientVisible: true });
  await assert.rejects(h.service.decide(customer, 'company-A', acceptance.id, { decision: 'approved', expectedVersion: acceptance.version }), status(404));
  await h.service.publishProject(manager, 'company-A', h.projectA.id);
  await h.service.grantMember(manager, 'company-A', { ...h.grant, allowApprovals: false });
  await assert.rejects(h.service.decide(customer, 'company-A', acceptance.id, { decision: 'approved', expectedVersion: acceptance.version }), status(404));
  await h.service.grantMember(manager, 'company-A', h.grant);
  const approved = await h.service.decide(customer, 'company-A', acceptance.id, { decision: 'approved', comment: 'Accepted', expectedVersion: acceptance.version });
  assert.equal(approved.status, 'approved');
  assert.equal(approved.decision.actorId, customer.identityId);
  await assert.rejects(h.service.decide(customer, 'company-A', acceptance.id, { decision: 'approved', expectedVersion: acceptance.version }), status(404));
  const blocked = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'acceptance', { title: 'Restricted delivery', status: 'requested', deliverableDocumentIds: [h.privateDoc.id], clientVisible: true });
  await h.service.publishProject(manager, 'company-A', h.projectA.id);
  await assert.rejects(h.service.decide(customer, 'company-A', blocked.id, { decision: 'approved', expectedVersion: blocked.version }), status(404));
});
test('unapproved changes cannot be implemented and unfinished/unaccepted projects cannot close', async () => {
  const h = await setup();
  await assert.rejects(h.service.createProject(manager, 'company-A', { title: 'Bypass closure', status: 'completed' }), status(400));
  const task = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'task', { title: 'WBS Task', wbsCode: '1.1', owner: 'Project owner', startDate: '2026-10-13', dueDate: '2026-10-20' });
  const change = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'change', { title: 'Scope Change', status: 'requested', reason: 'Scope refinement', impact: 'Schedule review' });
  await assert.rejects(h.service.updateRecords(manager, 'company-A', [{ id: change.id, fields: { status: 'implemented' } }]), status(409));
  await assert.rejects(h.service.createRecord(manager, 'company-A', h.projectA.id, 'acceptance', { title: 'Bypass', status: 'approved' }), status(400));
  await assert.rejects(h.service.updateProject(manager, 'company-A', h.projectA.id, { status: 'completed' }), status(409));
  const acceptance = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'acceptance', { title: 'Final Acceptance', status: 'requested' });
  await h.service.decide(manager, 'company-A', acceptance.id, { decision: 'approved', expectedVersion: acceptance.version });
  await assert.rejects(h.service.updateProject(manager, 'company-A', h.projectA.id, { status: 'completed' }), status(409));
  await h.service.updateRecords(manager, 'company-A', [{ id: task.id, fields: { status: 'done' } }]);
  assert.equal((await h.service.updateProject(manager, 'company-A', h.projectA.id, { status: 'completed', processGroup: 'closing' })).status, 'completed');
});
test('approved and rejected decisions cannot retain their status while content or linked deliveries change', async () => {
  const h = await setup();
  for (const type of ['change', 'acceptance']) for (const decision of ['approved', 'rejected']) {
    const record = await h.service.createRecord(manager, 'company-A', h.projectA.id, type, { title: `${decision} ${type}`, status: 'requested', criteria: 'Agreed criteria', ...(type === 'change' ? { impact: 'Agreed impact' } : {}), deliverableDocumentIds: [h.docA.id] });
    const decided = await h.service.decide(manager, 'company-A', record.id, { decision, expectedVersion: record.version });
    assert.equal(decided.decision.decidedVersion, decided.version);
    const before = await h.store.getCompany('company-A');
    for (const fields of [{ title: 'Changed title' }, { criteria: 'Changed criteria' }, { deliverableDocumentIds: [h.privateDoc.id] }, ...(type === 'change' ? [{ impact: 'Changed impact' }] : [])]) {
      await assert.rejects(h.service.updateRecords(manager, 'company-A', [{ id: record.id, fields }]), status(409));
      assert.deepEqual(await h.store.getCompany('company-A'), before);
    }
  }
});
test('approved change implementation is an isolated status transition bound to the approved content version', async () => {
  const h = await setup();
  const change = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'change', { title: 'Approved scope', status: 'requested', impact: 'Approved impact', deliverableDocumentIds: [h.docA.id] });
  const approved = await h.service.decide(manager, 'company-A', change.id, { decision: 'approved', comment: 'Agreed scope only', expectedVersion: change.version });
  const before = await h.store.getCompany('company-A');
  await assert.rejects(h.service.updateRecords(manager, 'company-A', [{ id: change.id, fields: { status: 'implemented', impact: 'Larger scope' } }]), status(409));
  assert.deepEqual(await h.store.getCompany('company-A'), before);
  const [implemented] = await h.service.updateRecords(manager, 'company-A', [{ id: change.id, fields: { status: 'implemented' } }]);
  assert.equal(implemented.status, 'implemented');
  assert.equal(implemented.version, approved.version + 1);
  assert.equal(implemented.impact, approved.impact);
  assert.deepEqual(implemented.decision, approved.decision);
  const audit = (await h.service.listEvents(manager, 'company-A')).findLast(event => event.action === 'records.update');
  assert.deepEqual(audit.recordVersions, [{ recordId: change.id, version: implemented.version, status: 'implemented', decidedVersion: approved.version }]);
  for (const fields of [{ title: 'Changed after implementation' }, { status: 'draft' }, { status: 'requested' }, { status: 'implemented' }]) await assert.rejects(h.service.updateRecords(manager, 'company-A', [{ id: change.id, fields }]), status(409));
});
test('explicit revisions preserve immutable linear decision snapshots and require fresh approval before closure', async () => {
  const h = await setup();
  const acceptance = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'acceptance', { title: 'Final acceptance', status: 'requested', criteria: 'Original criteria', deliverableDocumentIds: [h.docA.id] });
  const rejected = await h.service.decide(manager, 'company-A', acceptance.id, { decision: 'rejected', comment: 'Delivery needs revision', expectedVersion: acceptance.version });
  const [revised] = await h.service.updateRecords(manager, 'company-A', [{ id: acceptance.id, fields: { status: 'draft', criteria: 'Revised criteria' } }]);
  assert.equal(revised.status, 'draft'); assert.ok(!Object.hasOwn(revised, 'decision'));
  assert.deepEqual(revised.decisionHistory[0].snapshot, rejected);
  assert.deepEqual(revised.decisionHistory[0].decision, rejected.decision);
  assert.equal(revised.decisionHistory[0].recordVersion, rejected.version);
  await assert.rejects(h.service.decide(manager, 'company-A', acceptance.id, { decision: 'approved', expectedVersion: revised.version }), status(409));
  await assert.rejects(h.service.updateProject(manager, 'company-A', h.projectA.id, { status: 'completed' }), status(409));
  const [requested] = await h.service.updateRecords(manager, 'company-A', [{ id: acceptance.id, fields: { status: 'requested' } }]);
  await assert.rejects(h.service.decide(manager, 'company-A', acceptance.id, { decision: 'approved', expectedVersion: acceptance.version }), status(409));
  const approved = await h.service.decide(manager, 'company-A', acceptance.id, { decision: 'approved', expectedVersion: requested.version });
  const [secondRevision] = await h.service.updateRecords(manager, 'company-A', [{ id: acceptance.id, fields: { status: 'requested', criteria: 'Final revised criteria' } }]);
  assert.equal(secondRevision.decisionHistory.length, 2);
  assert.deepEqual(secondRevision.decisionHistory[0], revised.decisionHistory[0]);
  assert.equal(secondRevision.decisionHistory[1].snapshot.criteria, approved.criteria);
  assert.equal(secondRevision.decisionHistory[1].snapshot.decision.decidedVersion, approved.version);
  assert.ok(secondRevision.decisionHistory.every(entry => !Object.hasOwn(entry.snapshot, 'decisionHistory')));
  await assert.rejects(h.service.updateProject(manager, 'company-A', h.projectA.id, { status: 'completed' }), status(409));
  await h.service.decide(manager, 'company-A', acceptance.id, { decision: 'approved', expectedVersion: secondRevision.version });
  assert.equal((await h.service.updateProject(manager, 'company-A', h.projectA.id, { status: 'completed' })).status, 'completed');
});
test('legacy decisions preserve their full approved snapshot and receive version binding on implementation', async () => {
  const h = await setup();
  const change = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'change', { title: 'Legacy approved scope', impact: 'Original impact', status: 'requested' });
  const acceptance = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'acceptance', { title: 'Legacy rejected acceptance', criteria: 'Original criteria', status: 'requested' });
  await h.service.decide(manager, 'company-A', change.id, { decision: 'approved', expectedVersion: change.version });
  await h.service.decide(manager, 'company-A', acceptance.id, { decision: 'rejected', expectedVersion: acceptance.version });
  const old = await h.store.getCompany('company-A'), next = clone(old);
  for (const recordId of [change.id, acceptance.id]) delete next.records[recordId].decision.decidedVersion;
  next.revision++;
  assert.equal(await h.store.commitCompany('company-A', (await h.store.getDirectory()).revision, old.revision, next), true);
  const [implemented] = await h.service.updateRecords(manager, 'company-A', [{ id: change.id, fields: { status: 'implemented' } }]);
  assert.equal(implemented.decision.decidedVersion, next.records[change.id].version);
  assert.equal(implemented.impact, 'Original impact');
  const [revised] = await h.service.updateRecords(manager, 'company-A', [{ id: acceptance.id, fields: { status: 'draft', criteria: 'New criteria' } }]);
  assert.deepEqual(revised.decisionHistory[0].snapshot, next.records[acceptance.id]);
  assert.deepEqual(revised.decisionHistory[0].decision, next.records[acceptance.id].decision);
});
test('private decision history never enters published records, customer results, approval responses or search', async () => {
  const h = await setup(), secret = 'PrivatePreviousApprovalDetail';
  const record = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'acceptance', { title: secret, description: secret, status: 'requested', criteria: secret, deliverableDocumentIds: [h.privateDoc.id], clientVisible: false });
  await h.service.decide(manager, 'company-A', record.id, { decision: 'approved', comment: secret, expectedVersion: record.version });
  const [revision] = await h.service.updateRecords(manager, 'company-A', [{ id: record.id, fields: { status: 'requested', title: 'Customer delivery', description: 'Public delivery description', criteria: 'Public criteria', deliverableDocumentIds: [h.docA.id], clientVisible: true } }]);
  assert.ok(JSON.stringify(await h.service.getRecord(manager, 'company-A', record.id)).includes(secret));
  await h.service.publishProject(manager, 'company-A', h.projectA.id);
  const state = await h.store.getCompany('company-A');
  assert.ok(!Object.hasOwn(state.projects[h.projectA.id].publication.records[record.id], 'decisionHistory'));
  for (const result of [await h.service.getRecord(customer, 'company-A', record.id), await h.service.listRecords(customer, 'company-A', h.projectA.id)]) {
    const value = JSON.stringify(result);
    for (const denied of [secret, 'decisionHistory', h.privateDoc.id]) assert.ok(!value.includes(denied));
  }
  assert.deepEqual(await h.service.search(customer, 'company-A', secret), []);
  const approved = await h.service.decide(customer, 'company-A', record.id, { decision: 'approved', expectedVersion: revision.version });
  assert.equal(approved.status, 'approved'); assert.ok(!Object.hasOwn(approved, 'decisionHistory'));
  assert.ok(!JSON.stringify(approved).includes(secret));
  assert.deepEqual(await h.service.search(customer, 'company-A', secret), []);
});
test('completed projects reject all record writes and approvals until explicit active or planning reopening', async () => {
  for (const reopenStatus of ['active', 'planning']) {
    const h = await setup();
    const task = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'task', { title: 'Completed task', status: 'done' });
    const acceptance = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'acceptance', { title: 'Final acceptance', status: 'requested' });
    const pendingChange = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'change', { title: 'Pending change', status: 'requested', clientVisible: true });
    const approved = await h.service.decide(manager, 'company-A', acceptance.id, { decision: 'approved', expectedVersion: acceptance.version });
    await h.service.updateProject(manager, 'company-A', h.projectA.id, { status: 'completed' });
    await h.service.publishProject(manager, 'company-A', h.projectA.id);
    const before = await h.store.getCompany('company-A');
    for (const type of PMP_RECORD_TYPES) await assert.rejects(h.service.createRecord(manager, 'company-A', h.projectA.id, type, { title: 'Forbidden new record' }), status(409));
    for (const update of [{ id: task.id, fields: { status: 'todo' } }, { id: task.id, fields: { title: 'Changed task' } }, { id: acceptance.id, fields: { status: 'draft' } }]) await assert.rejects(h.service.updateRecords(manager, 'company-A', [update]), status(409));
    for (const actor of [manager, customer]) await assert.rejects(h.service.decide(actor, 'company-A', pendingChange.id, { decision: 'approved', expectedVersion: pendingChange.version }), status(409));
    for (const statusValue of ['proposed', 'on_hold', 'cancelled']) await assert.rejects(h.service.updateProject(manager, 'company-A', h.projectA.id, { status: statusValue }), status(409));
    assert.deepEqual(await h.store.getCompany('company-A'), before);
    const response = await h.request('', { actor: 'manager', method: 'POST', body: { action: 'createRecord', companyId: 'company-A', projectId: h.projectA.id, type: 'task', fields: { title: 'HTTP bypass attempt' } } });
    assert.equal(response.status, 409); assert.ok(response.json().error.includes('重新开启'));
    assert.equal((await h.service.getRecord(manager, 'company-A', acceptance.id)).decision.decidedVersion, approved.version);
    assert.equal((await h.service.download(customer, 'company-A', h.docA.id, h.docA.versionId)).bytes.toString(), 'Alpha Published Delivery');
    // Pure project/file metadata is deliberately independent of record closure.
    assert.equal((await h.service.updateProject(manager, 'company-A', h.projectA.id, { title: 'Closed project metadata' })).status, 'completed');
    const upload = await h.service.uploadDocument(manager, 'company-A', h.projectA.id, { title: 'Post-closure archive', filename: 'archive.txt', mimeType: 'text/plain', base64: Buffer.from('Archive material').toString('base64') });
    await h.service.publishDocument(manager, 'company-A', upload.documentId, upload.versionId);
    await h.service.updateProject(manager, 'company-A', h.projectA.id, { status: reopenStatus });
    const [regressed] = await h.service.updateRecords(manager, 'company-A', [{ id: task.id, fields: { status: 'todo' } }]);
    assert.equal(regressed.status, 'todo');
    assert.equal((await h.service.createRecord(manager, 'company-A', h.projectA.id, 'issue', { title: 'Reopened issue' })).status, 'open');
    assert.equal((await h.service.decide(manager, 'company-A', pendingChange.id, { decision: 'approved', expectedVersion: pendingChange.version })).status, 'approved');
    await assert.rejects(h.service.updateProject(manager, 'company-A', h.projectA.id, { status: 'completed' }), status(409));
  }
});
test('batch decision or closure failures never persist earlier changes and duplicate IDs cannot bypass lifecycle checks', async () => {
  const h = await setup();
  const mutable = await h.service.createRecord(manager, 'company-A', h.hiddenProject.id, 'task', { title: 'Unchanged open task' });
  const task = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'task', { title: 'Done task', status: 'done' });
  const acceptance = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'acceptance', { title: 'Final acceptance', criteria: 'Original criteria', status: 'requested' });
  await h.service.decide(manager, 'company-A', acceptance.id, { decision: 'approved', expectedVersion: acceptance.version });
  let before = await h.store.getCompany('company-A');
  await assert.rejects(h.service.updateRecords(manager, 'company-A', [{ id: mutable.id, fields: { title: 'Must not persist' } }, { id: acceptance.id, fields: { criteria: 'Unapproved criteria' } }]), status(409));
  assert.deepEqual(await h.store.getCompany('company-A'), before);
  await assert.rejects(h.service.updateRecords(manager, 'company-A', [{ id: acceptance.id, fields: { status: 'draft' } }, { id: acceptance.id, fields: { status: 'approved' } }]), status(400));
  assert.deepEqual(await h.store.getCompany('company-A'), before);
  await h.service.updateProject(manager, 'company-A', h.projectA.id, { status: 'completed' });
  before = await h.store.getCompany('company-A');
  await assert.rejects(h.service.updateRecords(manager, 'company-A', [{ id: mutable.id, fields: { title: 'Must not persist' } }, { id: task.id, fields: { status: 'todo' } }]), status(409));
  assert.deepEqual(await h.store.getCompany('company-A'), before);
});
test('atomic WBS batches validate their final dependency graph rather than transient intermediate states', async () => {
  const h = await setup();
  const first = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'task', { title: 'First task' });
  const second = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'task', { title: 'Second task', dependencyIds: [first.id] });
  const changed = await h.service.updateRecords(manager, 'company-A', [{ id: first.id, fields: { dependencyIds: [second.id] } }, { id: second.id, fields: { dependencyIds: [] } }]);
  assert.deepEqual(changed.map(record => record.dependencyIds), [[second.id], []]);
  const before = await h.store.getCompany('company-A');
  await assert.rejects(h.service.updateRecords(manager, 'company-A', [{ id: second.id, fields: { dependencyIds: [first.id] } }]), status(400));
  assert.deepEqual(await h.store.getCompany('company-A'), before);
});
test('WBS references cannot cross project/company boundaries or form cycles', async () => {
  const h = await setup();
  const task = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'task', { title: 'Task One' });
  const next = await h.service.createRecord(manager, 'company-A', h.projectA.id, 'task', { title: 'Task Two', dependencyIds: [task.id] });
  await assert.rejects(h.service.updateRecords(manager, 'company-A', [{ id: task.id, fields: { dependencyIds: [next.id] } }]), status(400));
  const foreign = await h.service.createRecord(admin, 'company-B', h.projectB.id, 'task', { title: 'Foreign Task' });
  await assert.rejects(h.service.createRecord(manager, 'company-A', h.projectA.id, 'task', { title: 'Bad Reference', dependencyIds: [foreign.id] }), status(400));
  await assert.rejects(h.service.createRecord(manager, 'company-A', h.hiddenProject.id, 'task', { title: 'Wrong Project', parentTaskId: task.id }), status(400));
});
test('native company IDs must exist; core contact CRUD uses injected Twenty data and does not authorize a lead automatically', async () => {
  const h = await setup();
  await assert.rejects(h.service.registerCompany(admin, 'invented-company'), status(404));
  const company = await h.service.createCompany(admin, { name: 'New Native Company', domain: 'example.test' });
  assert.equal(h.nativeCompanies.get(company.companyId).name, 'New Native Company');
  const contact = await h.service.createContact(manager, 'company-A', { firstName: 'Synthetic', lastName: 'Contact', jobTitle: 'Coordinator' });
  assert.equal(contact.companyId, 'company-A');
  assert.equal(contact.canLogin, false);
  assert.ok(!Object.values((await h.store.getDirectory()).memberGrants).some(grant => grant.contactId === contact.id));
  const changed = await h.service.updateContact(manager, 'company-A', contact.id, { jobTitle: 'Project coordinator' });
  assert.equal(changed.jobTitle, 'Project coordinator');
  const listed = await h.service.listContacts(manager, 'company-A');
  assert.ok(listed.some(entry => entry.id === 'contact-A-no-login' && entry.canLogin === false));
  assert.ok(listed.some(entry => entry.id === 'contact-A' && entry.canLogin === true));
  assert.ok(!listed.some(entry => entry.companyId === 'company-B'));
});
test('changing an authorized contact phone revokes the old identity before external update', async () => {
  const h = await setup(), dynamicPhone = '13' + String(randomInt(0, 1_000_000_000)).padStart(9, '0');
  let checked = false;
  h.twenty.updateContact = async (companyId, contactId, fields) => {
    checked = true;
    assert.equal((await h.store.getDirectory()).memberGrants[customer.identityId].active, false);
    return { ...h.contacts.get(contactId), ...fields };
  };
  await h.service.updateContact(manager, 'company-A', 'contact-A', { phone: dynamicPhone, phoneCountryCode: '86' });
  assert.ok(checked);
  await assert.rejects(h.service.listProjects(customer, 'company-A'), status(404));
});
test('phone-HMAC directory lookup gives CRM authentication current member scopes without storing phone/email', async () => {
  const h = await setup(), dynamicPhone = '13' + String(randomInt(0, 1_000_000_000)).padStart(9, '0');
  const identityId = h.service.subjectForPhone(dynamicPhone);
  h.contacts.set('runtime-contact', { id: 'runtime-contact', companyId: 'company-A', identityId, active: true });
  await h.service.grantMember(manager, 'company-A', { ...h.grant, contactId: 'runtime-contact' });
  const memberships = await h.service.loadMemberships(dynamicPhone);
  assert.equal(memberships[0].companyId, 'company-A');
  assert.ok(memberships[0].permissions.includes('approvals:submit'));
  assert.deepEqual(memberships[0].projectIds, [h.projectA.id]);
  assert.ok(!JSON.stringify(await h.store.getDirectory()).includes(dynamicPhone));
  h.contacts.get('runtime-contact').identityId = 'changed-native-identity';
  assert.deepEqual(await h.service.loadMemberships(dynamicPhone), []);
  h.contacts.get('runtime-contact').identityId = identityId;
  await h.service.revokeMember(manager, 'company-A', 'runtime-contact');
  assert.deepEqual(await h.service.loadMemberships(dynamicPhone), []);
});
test('a native company deletion invalidates current customer grants and removes manager company scopes', async () => {
  const h = await setup(), dynamicCustomerPhone = dynamicPhoneForLookup(), dynamicManagerPhone = dynamicPhoneForLookup();
  const customerId = h.service.subjectForPhone(dynamicCustomerPhone), managerId = h.service.subjectForPhone(dynamicManagerPhone);
  h.contacts.set('native-deleted-company-contact', { id: 'native-deleted-company-contact', companyId: 'company-A', identityId: customerId, active: true });
  h.managers.set('native-delete-manager', { id: 'native-delete-manager', identityId: managerId, active: true });
  await h.service.grantMember(admin, 'company-A', { ...h.grant, contactId: 'native-deleted-company-contact' });
  await h.service.assignManager(admin, 'native-delete-manager', ['company-A', 'company-B']);
  assert.equal((await h.service.loadMemberships(dynamicCustomerPhone)).length, 1);
  assert.equal((await h.service.loadMemberships(dynamicManagerPhone)).length, 2);
  h.nativeCompanies.delete('company-A');
  assert.deepEqual(await h.service.loadMemberships(dynamicCustomerPhone), []);
  assert.deepEqual((await h.service.loadMemberships(dynamicManagerPhone)).map(entry => entry.companyId), ['company-B']);
});
test('staff candidates come only from the active server-configured internal company and require a login identity', async () => {
  const h = await setup(); h.env.CNPS_INTERNAL_COMPANY_ID = 'company-A';
  h.contacts.set('inactive-staff', { id: 'inactive-staff', companyId: 'company-A', name: 'Inactive Person', active: false, identityId: 'inactive-person' });
  h.contacts.set('unknown-identity-staff', { id: 'unknown-identity-staff', companyId: 'company-A', name: 'Missing Identity', active: true });
  const listed = await h.service.listStaff(admin);
  assert.deepEqual(listed.map(person => person.id), ['contact-A']);
  assert.equal(listed[0].canLogin, true); assert.equal(listed[0].companyId, 'company-A');
  await assert.rejects(h.service.listStaff(manager), status(404));
  await assert.rejects(h.service.listStaff(customer), status(404));
  h.nativeCompanies.delete('company-A');
  await assert.rejects(h.service.listStaff(admin), status(404));
  delete h.env.CNPS_INTERNAL_COMPANY_ID;
  await assert.rejects(h.service.listStaff(admin), status(503));
});
test('staff HTTP view is administrator-only and browser company or role parameters cannot change its scope', async () => {
  const h = await setup(); h.env.CNPS_INTERNAL_COMPANY_ID = 'company-A';
  const response = await h.request('view=staff&companyId=company-B&role=admin', { actor: 'admin' });
  assert.equal(response.status, 200);
  assert.deepEqual(response.json().data.map(person => person.id), ['contact-A']);
  for (const actor of ['manager', 'customer', 'otherCustomer']) assert.equal((await h.request('view=staff&role=admin', { actor })).status, 404);
  assert.equal((await h.request('view=staff', { actor: 'anonymous' })).status, 401);
});
function dynamicPhoneForLookup() { return '13' + String(randomInt(0, 1_000_000_000)).padStart(9, '0'); }
test('HTTP endpoints block guessed IDs, cross-company views, public contact lists and client mutations', async () => {
  const h = await setup();
  for (const view of ['projects', 'project', 'records', 'documents', 'document', 'members', 'events', 'search', 'download']) {
    const response = await h.request(`view=${view}&companyId=company-B&projectId=${h.projectB.id}&documentId=${h.docB.id}&versionId=${h.docB.versionId}&q=Beta`);
    assert.equal(response.status, 404, view);
  }
  assert.equal((await h.request('view=contacts&companyId=company-A')).status, 404);
  assert.equal((await h.request('', { method: 'POST', body: { action: 'createProject', companyId: 'company-A', fields: { title: 'Customer Cannot Write' }, role: 'admin', identityId: admin.identityId } })).status, 404);
  const document = await h.request(`view=download&companyId=company-A&documentId=${h.docA.id}&versionId=${h.docA.versionId}`);
  assert.equal(document.status, 200); assert.match(document.headers['content-disposition'], /attachment/); assert.match(document.headers['cache-control'], /no-store/);
  assert.equal(document.bytes.toString(), 'Alpha Published Delivery');
  assert.equal((await h.request('view=companies', { actor: 'anonymous' })).status, 401);
});
test('business mutations require same origin/CSRF and reject malformed or oversized input without provider diagnostics', async () => {
  const h = await setup(), body = { action: 'createProject', companyId: 'company-A', fields: { title: 'Safe' } };
  assert.equal((await h.request('', { actor: 'manager', method: 'POST', body, origin: 'https://evil.example' })).status, 403);
  assert.equal((await h.request('', { actor: 'manager', method: 'POST', body, headers: { 'x-cnps-crm': '' } })).status, 403);
  assert.equal((await h.request('', { actor: 'manager', method: 'POST', body: '{' })).status, 400);
  assert.equal((await h.request('', { actor: 'manager', method: 'POST', body: { value: 'x'.repeat(65537) } })).status, 413);
  h.twenty.getCompany = async () => { throw Error('private native token diagnostics'); };
  const failed = await h.request('view=companies', { actor: 'manager' });
  assert.equal(failed.status, 503); assert.ok(!JSON.stringify(failed.json()).includes('token'));
});
test('missing native/document adapters fail closed and never fabricate companies or private files', async () => {
  const h = await setup(), service = createBusinessService({ env: h.env, store: h.store });
  await assert.rejects(service.registerCompany(admin, 'company-A'), status(503));
  await assert.rejects(service.listContacts(manager, 'company-A'), status(503));
  await assert.rejects(service.download(customer, 'company-A', h.docA.id, h.docA.versionId), status(503));
});
test('Redis protocol uses persistent CAS revisions and atomically checks directory plus company revision for mutations', async () => {
  const calls = [], redis = { async get(key) { calls.push(['get', key]); return null; }, async eval(script, keys, args) { calls.push(['eval', script, keys, args]); return 1; } };
  const store = createBusinessStore({}, { redis });
  assert.equal((await store.getDirectory()).revision, 0);
  const state = await store.getCompany('company-A');
  assert.equal(state.companyId, 'company-A');
  const directory = emptyDirectory(); directory.revision = 1;
  assert.equal(await store.commitDirectory(0, directory), true);
  state.revision = 1;
  assert.equal(await store.commitCompany('company-A', 1, 0, state), true);
  const directoryCall = calls.find(call => call[0] === 'eval'), companyCall = calls.filter(call => call[0] === 'eval')[1];
  assert.deepEqual(directoryCall[2], ['cnps:crm:business:v1:directory']);
  assert.ok(companyCall[2][1].startsWith('cnps:crm:business:v1:company:'));
  assert.deepEqual(companyCall[3].slice(0, 2), [1, 0]);
  assert.match(companyCall[1], /directoryRevision/);
  assert.ok(!companyCall[1].includes('EXPIRE'));
  await assert.rejects(store.commitCompany('company-B', 1, 0, state), /Immutable company ownership/);
});

const uploadFields = bytes => ({ title: 'Uploaded Delivery', filename: 'delivery.txt', mimeType: 'text/plain', base64: bytes.toString('base64') });
test('adapter-backed upload creates a persisted private draft; explicit publish enables an authorized customer download', async () => {
  const h = await setup(), bytes = Buffer.from('Uploaded delivery contents');
  await h.service.grantMember(manager, 'company-A', { ...h.grant, documentScope: 'all', documentIds: [] });
  const result = await h.service.uploadDocument(manager, 'company-A', h.projectA.id, uploadFields(bytes));
  assert.equal(h.uploads.length, 1);
  const draft = await h.service.getDocument(manager, 'company-A', result.documentId);
  assert.equal(draft.status, 'draft');
  assert.equal(draft.activeVersionId, null);
  assert.equal(draft.versions[0].versionId, result.versionId);
  assert.ok(!JSON.stringify(draft).includes('objectId'));
  await assert.rejects(h.service.getDocument(customer, 'company-A', result.documentId), status(404));
  await assert.rejects(h.service.download(customer, 'company-A', result.documentId, result.versionId), status(404));
  assert.equal((await h.service.download(manager, 'company-A', result.documentId, result.versionId)).bytes.toString(), bytes.toString());
  await h.service.publishDocument(manager, 'company-A', result.documentId, result.versionId);
  assert.equal((await h.service.getDocument(customer, 'company-A', result.documentId)).status, 'published');
  assert.equal((await h.service.download(customer, 'company-A', result.documentId, result.versionId)).bytes.toString(), bytes.toString());
});
test('uploading a new version keeps the previous publication visible and the new draft survives reload', async () => {
  const h = await setup();
  const result = await h.service.uploadDocument(manager, 'company-A', h.projectA.id, { ...uploadFields(Buffer.from('New version draft')), title: 'Draft New Title', documentId: h.docA.id });
  const rows = await h.service.listDocuments(manager, 'company-A', h.projectA.id), row = rows.find(item => item.id === h.docA.id);
  assert.equal(row.versionId, result.versionId);
  assert.equal(row.status, 'draft');
  assert.equal(row.activeVersionId, h.docA.versionId);
  assert.equal(row.versions.length, 2);
  assert.equal((await h.service.getDocument(customer, 'company-A', h.docA.id)).title, 'Alpha Published Delivery');
  await assert.rejects(h.service.download(customer, 'company-A', h.docA.id, result.versionId), status(404));
});
test('uploads enforce canonical base64, approved MIME/name and decoded 3MiB maximum before external IO', async () => {
  const h = await setup(), normal = uploadFields(Buffer.from('File'));
  for (const fields of [{ ...normal, base64: '!!!!' }, { ...normal, base64: 'AB==' }, { ...normal, base64: '' }, { ...normal, base64: 'data:text/plain;base64,RmlsZQ==' }, { ...normal, filename: '../delivery.txt' }, { ...normal, mimeType: 'text/html' }]) {
    await assert.rejects(h.service.uploadDocument(manager, 'company-A', h.projectA.id, fields), status(400));
  }
  await assert.rejects(h.service.uploadDocument(manager, 'company-A', h.projectA.id, uploadFields(Buffer.alloc(PMP_MAX_UPLOAD_BYTES + 1, 65))), status(413));
  assert.equal(h.uploads.length, 0);
  assert.ok(PMP_DOCUMENT_MIME_TYPES.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
  assert.ok(PMP_DOCUMENT_MIME_TYPES.includes('text/csv'));
});
test('upload permissions and immutable project/document ownership are checked before any external IO', async () => {
  const h = await setup(), fields = uploadFields(Buffer.from('Private'));
  await assert.rejects(h.service.uploadDocument(customer, 'company-A', h.projectA.id, fields), status(404));
  await assert.rejects(h.service.uploadDocument(manager, 'company-B', h.projectB.id, fields), status(404));
  await assert.rejects(h.service.uploadDocument(manager, 'company-A', h.projectB.id, fields), status(404));
  await assert.rejects(h.service.uploadDocument(manager, 'company-A', h.projectA.id, { ...fields, documentId: h.docB.id }), status(404));
  assert.equal(h.uploads.length, 0);
});
test('upload IO followed by manager revocation or a competing project revision never registers or publishes a file', async () => {
  const revoked = await setup(), before = await revoked.store.getCompany('company-A');
  revoked.duringCreate(() => revoked.service.assignManager(admin, 'staff-A', [], false));
  await assert.rejects(revoked.service.uploadDocument(manager, 'company-A', revoked.projectA.id, uploadFields(Buffer.from('Private Orphan'))), status(404));
  assert.equal(revoked.uploads.length, 1);
  assert.deepEqual(await revoked.store.getCompany('company-A'), before);
  const conflict = await setup(), previous = await conflict.store.getCompany('company-A');
  conflict.duringCreate(() => conflict.service.updateProject(admin, 'company-A', conflict.projectA.id, { title: 'Concurrent Revision' }));
  await assert.rejects(conflict.service.uploadDocument(manager, 'company-A', conflict.projectA.id, uploadFields(Buffer.from('Conflicted Orphan'))), status(409));
  assert.equal(Object.keys((await conflict.store.getCompany('company-A')).documents).length, Object.keys(previous.documents).length);
});
test('uploads fail closed with no adapter or inconsistent private object metadata', async () => {
  const h = await setup(), unavailable = createBusinessService({ env: h.env, store: h.store, twenty: h.twenty, documents: {} });
  await assert.rejects(unavailable.uploadDocument(manager, 'company-A', h.projectA.id, uploadFields(Buffer.from('Private'))), status(503));
  h.documents.createObject = async () => ({ id: 'wrong-object', companyId: 'company-B', projectId: h.projectB.id, size: 7, mimeType: 'text/plain', filename: 'wrong.txt' });
  await assert.rejects(h.service.uploadDocument(manager, 'company-A', h.projectA.id, uploadFields(Buffer.from('Private'))), status(503));
});
test('HTTP upload accepts 3MiB files but retains the small body limit for every other action', async () => {
  const h = await setup(), bytes = Buffer.alloc(PMP_MAX_UPLOAD_BYTES, 65);
  const response = await h.request('', { actor: 'manager', method: 'POST', body: { action: 'uploadDocument', companyId: 'company-A', projectId: h.projectA.id, fields: uploadFields(bytes) } });
  assert.equal(response.status, 200);
  assert.ok(response.json().data.versionId);
  assert.equal((await h.request('', { actor: 'manager', method: 'POST', body: { action: 'createProject', companyId: 'company-A', fields: { title: 'x'.repeat(65537) } } })).status, 413);
  assert.equal((await h.request('', { actor: 'manager', method: 'POST', body: { action: 'uploadDocument', fields: { base64: 'x'.repeat(Math.floor(4.3 * 1024 * 1024)) } } })).status, 413);
});
test('HTTP business authentication precedes body access even for a large upload', async () => {
  const handler = createBusinessHandler({ env: {}, service: {}, authHandler: { async loadSession() { return null; } } });
  let read = false, payload;
  const req = { url: '/api/crm-workspace', method: 'POST', headers: {}, get body() { read = true; throw new Error('body must not be read'); } };
  const res = { setHeader() {}, end(value) { payload = value; } };
  await handler(req, res);
  assert.equal(res.statusCode, 401); assert.equal(read, false); assert.ok(payload);
});
test('HTTP streamed upload preserves UTF-8 filenames across chunk boundaries', async () => {
  let received, output;
  const handler = createBusinessHandler({ env: {}, authHandler: { async loadSession() { return manager; } }, service: {
    async uploadDocument(actor, companyId, projectId, fields) { assert.equal(actor, manager); received = fields; return { documentId: 'document-new', versionId: 'version-new', version: 1 }; }
  } });
  const fields = { ...uploadFields(Buffer.from('Document')), title: '项目交付', filename: '交付.txt' };
  const bytes = Buffer.from(JSON.stringify({ action: 'uploadDocument', companyId: 'company-A', projectId: 'project-A', fields }));
  const split = bytes.indexOf(Buffer.from('交')) + 1;
  const req = { url: '/api/crm-workspace', method: 'POST', headers: { origin: 'https://www.cnps.ai', 'content-type': 'application/json', 'x-cnps-crm': '1' },
    async *[Symbol.asyncIterator]() { yield bytes.subarray(0, split); yield bytes.subarray(split); } };
  const res = { setHeader() {}, end(value) { output = value; } };
  await handler(req, res);
  assert.equal(res.statusCode, 200, output); assert.equal(received.filename, fields.filename); assert.equal(received.title, fields.title);
});
