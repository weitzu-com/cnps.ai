// Local development only. All adapters and data live in this process; no .env,
// cloud credentials, filesystem persistence or external clients are used.
import { randomBytes, randomUUID } from 'node:crypto';
import { createCrmRuntime } from '../server/crm-runtime.mjs';
import { emptyCompany, emptyDirectory } from '../server/crm-business-store.mjs';
import { digest } from '../server/proposal-crypto.mjs';
import { normalizePhone } from '../server/proposal-handler.mjs';
import { checkMagic, sanitizeFilename } from '../ops/crm-file-gateway/validation.mjs';

export const DEV_OTP = '123456';
export const DEV_ACCOUNTS = Object.freeze({ admin: '18700001111', manager: '18800002222', customer: '18900003333', otherCustomer: '18600004444' });
const clone = value => value == null ? value : structuredClone(value);

function authStore() {
  const values = new Map(), quotas = new Map();
  const get = key => {
    const entry = values.get(key);
    if (!entry || entry.expires <= Date.now()) { values.delete(key); return null; }
    return clone(entry.value);
  };
  return {
    async reserve(limits) {
      const time = Date.now();
      if (limits.some(item => { const entry = quotas.get(item.name); return entry?.expires > time && entry.count >= item.max; })) return false;
      for (const item of limits) {
        let entry = quotas.get(item.name);
        if (!entry || entry.expires <= time) entry = { count: 0, expires: time + item.ttl * 1000 };
        entry.count++; quotas.set(item.name, entry);
      }
      return true;
    },
    async get(key) { return get(key); },
    async set(key, value, ttl) { values.set(key, { value: clone(value), expires: Date.now() + ttl * 1000 }); },
    async del(key) { values.delete(key); },
    async attempt(id, binding) {
      const key = 'challenge:' + id, value = get(key);
      if (!value || value.binding !== binding || value.attempts >= 5) return null;
      values.get(key).value.attempts++; return value;
    },
    async consume(id, binding) {
      const key = 'challenge:' + id, value = get(key);
      if (!value || value.binding !== binding) return false;
      values.delete(key); return true;
    }
  };
}

export async function createDevFixtures() {
  const env = { CNPS_PROPOSAL_SECRET: randomBytes(32).toString('hex'), CNPS_CRM_ADMIN_PHONE: DEV_ACCOUNTS.admin, CNPS_INTERNAL_COMPANY_ID: 'demo-internal' };
  let directory = emptyDirectory();
  const states = new Map(), companies = new Map([
    ['demo-alpha', { id: 'demo-alpha', name: '演示公司 Alpha' }],
    ['demo-beta', { id: 'demo-beta', name: '演示公司 Beta' }],
    ['demo-internal', { id: 'demo-internal', name: '演示内部团队' }]
  ]), contacts = new Map(), objects = new Map();
  const store = {
    async getDirectory() { return clone(directory); },
    async getCompany(companyId) { return clone(states.get(companyId) || emptyCompany(companyId)); },
    async commitDirectory(revision, next) {
      if (directory.revision !== revision || next.revision !== revision + 1) return false;
      directory = clone(next); return true;
    },
    async commitCompany(companyId, directoryRevision, revision, next) {
      if (directory.revision !== directoryRevision || (states.get(companyId)?.revision || 0) !== revision || next.revision !== revision + 1 || next.companyId !== companyId) return false;
      states.set(companyId, clone(next)); return true;
    }
  };
  const decorate = contact => {
    const out = { ...contact, active: true, name: [contact.firstName, contact.lastName].filter(Boolean).join(' ') };
    const phone = (contact.phoneCountryCode || '86') === '86' && normalizePhone(contact.phone);
    if (phone) out.identityId = digest(env.CNPS_PROPOSAL_SECRET, 'phone', phone);
    return out;
  };
  for (const [id, companyId, firstName, phone] of [
    ['demo-manager', 'demo-internal', '演示销售经理', DEV_ACCOUNTS.manager],
    ['demo-customer-alpha', 'demo-alpha', '演示客户 Alpha', DEV_ACCOUNTS.customer],
    ['demo-customer-beta', 'demo-beta', '演示客户 Beta', DEV_ACCOUNTS.otherCustomer]
  ]) contacts.set(id, decorate({ id, companyId, firstName, phone, phoneCountryCode: '86', email: id + '@example.invalid' }));
  const twenty = {
    async getCompany(id) { return clone(companies.get(id)); },
    async listCompanies() { return [...companies.values()].map(clone); },
    async createCompany(fields) { const company = { id: randomUUID(), ...fields }; companies.set(company.id, company); return clone(company); },
    async getContact(id) { return clone(contacts.get(id)); },
    async getManager(id) { const contact = contacts.get(id); return contact?.companyId === env.CNPS_INTERNAL_COMPANY_ID ? clone(contact) : null; },
    async listContacts(companyId) { return [...contacts.values()].filter(contact => contact.companyId === companyId).map(clone); },
    async createContact(companyId, fields) { const contact = decorate({ id: randomUUID(), companyId, ...fields }); contacts.set(contact.id, contact); return clone(contact); },
    async updateContact(companyId, id, fields) {
      const current = contacts.get(id); if (current?.companyId !== companyId) throw Error('Demo contact ownership mismatch');
      const contact = decorate({ ...current, ...fields });
      // Recompute phone identity instead of retaining it after an invalid phone edit.
      delete contact.identityId;
      const phone = contact.phoneCountryCode === '86' && normalizePhone(contact.phone);
      if (phone) contact.identityId = digest(env.CNPS_PROPOSAL_SECRET, 'phone', phone);
      contacts.set(id, contact); return clone(contact);
    }
  };
  const resolveObject = (id, context) => {
    const object = objects.get(id);
    if (!object || object.metadata.companyId !== context.companyId || object.metadata.projectId !== context.projectId) throw Error('Demo file ownership mismatch');
    return object;
  };
  const documents = {
    async createObject({ companyId, projectId, filename, mimeType, base64 }) {
      const bytes = Buffer.from(base64, 'base64'); checkMagic(bytes, mimeType);
      const metadata = { id: randomUUID(), companyId, projectId, filename: sanitizeFilename(filename, mimeType), mimeType, size: bytes.length };
      objects.set(metadata.id, { metadata, bytes }); return clone(metadata);
    },
    async getObject(id, context) { return clone(resolveObject(id, context).metadata); },
    async readObject(id, context) { return Buffer.from(resolveObject(id, context).bytes); },
    async extractObject(id, context) {
      const object = resolveObject(id, context);
      if (!['text/plain', 'text/csv'].includes(object.metadata.mimeType)) return { status: 'unsupported', segments: [] };
      return { status: 'ready', segments: object.bytes.toString('utf8').split('\n').filter(Boolean).slice(0, 3000).map((text, index) => ({ text: text.slice(0, 1600), location: { kind: 'line', number: index + 1, part: 1 } })) };
    }
  };
  const sessions = authStore(), challenges = new Map();
  const runtime = createCrmRuntime(env, {
    store, twenty, documents, authStoreFactory: () => sessions,
    smsFactory: () => ({
      async send(phone, id) { challenges.set(id, phone); },
      async verify(phone, code, id) { return challenges.get(id) === phone && code === DEV_OTP; }
    }),
    notifications: { configured: false }, channels: { email: { configured: false }, wecom: { configured: false } }
  });
  const admin = { identityId: runtime.service.subjectForPhone(DEV_ACCOUNTS.admin), identity: { role: 'admin' } };
  await runtime.service.registerCompany(admin, 'demo-alpha'); await runtime.service.registerCompany(admin, 'demo-beta');
  await runtime.service.assignManager(admin, 'demo-manager', ['demo-alpha']);
  const projects = {};
  for (const [companyId, contactId] of [['demo-alpha', 'demo-customer-alpha'], ['demo-beta', 'demo-customer-beta']]) {
    const project = await runtime.service.createProject(admin, companyId, { title: '本地开发演示项目 · ' + companyId, objective: '验证项目管理、授权、资料与发布流程。', scope: '仅包含内存中的合成演示数据。', deliverables: ['演示项目说明'], processGroup: 'planning', status: 'active' });
    await runtime.service.createRecord(admin, companyId, project.id, 'task', { title: '检查项目需求', description: '这是一条合成任务，可编辑状态。', status: 'todo', clientVisible: true, wbsCode: '1.1' });
    await runtime.service.createRecord(admin, companyId, project.id, 'risk', { title: '演示风险', description: '此内容仅用于本地开发。', probability: 2, impact: 3, clientVisible: true });
    const uploaded = await runtime.service.uploadDocument(admin, companyId, project.id, { title: '演示项目说明', filename: 'demo-project.txt', mimeType: 'text/plain', base64: Buffer.from('本地开发合成资料\n此文件不包含真实客户数据。\n所有更改在重启后清空。').toString('base64') });
    const document = await runtime.service.publishDocument(admin, companyId, uploaded.documentId, uploaded.versionId);
    await runtime.service.createRecord(admin, companyId, project.id, 'acceptance', { title: '演示验收', criteria: '核对演示项目说明', status: 'requested', clientVisible: true, deliverableDocumentIds: [document.id] });
    await runtime.service.publishProject(admin, companyId, project.id);
    await runtime.service.grantMember(admin, companyId, { contactId, projectScope: 'all', documentScope: 'all', allowApprovals: true });
    projects[companyId] = { projectId: project.id, documentId: document.id, versionId: document.versionId };
  }
  return { env, runtime, projects };
}
