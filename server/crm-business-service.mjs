import { randomUUID } from 'node:crypto';
import { digest, keyBytes } from './proposal-crypto.mjs';
import { normalizePhone } from './proposal-handler.mjs';

export const PMP_RECORD_TYPES = ['task', 'milestone', 'risk', 'issue', 'change', 'acceptance'];
export const PMP_PROCESS_GROUPS = ['initiating', 'planning', 'executing', 'monitoring_controlling', 'closing'];
const RECORD_STATUSES = {
  task: ['todo', 'in_progress', 'blocked', 'done'], milestone: ['planned', 'achieved', 'delayed'],
  risk: ['identified', 'mitigating', 'closed'], issue: ['open', 'resolving', 'closed'],
  change: ['draft', 'requested', 'approved', 'rejected', 'implemented'],
  acceptance: ['draft', 'requested', 'approved', 'rejected']
};
export const PMP_DOCUMENT_MIME_TYPES = Object.freeze(['application/pdf', 'application/msword', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg', 'text/plain', 'text/csv']);
export const PMP_MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MIME_TYPES = new Set(PMP_DOCUMENT_MIME_TYPES);
const validId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value) && !['__proto__', 'prototype', 'constructor'].includes(value);
const own = (object, key) => Object.hasOwn(object, key) ? object[key] : undefined;
const clone = value => structuredClone(value);
const internal = a => ['admin','sales_manager'].includes(a?.role);
const pick = (value, fields) => Object.fromEntries(fields.filter(key => value[key] !== undefined).map(key => [key, clone(value[key])]));
export class BusinessError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new BusinessError(status, message); };
const missing = () => fail(404, '资料不存在或未获授权。');
function id(value) { if (!validId(value)) fail(400, '标识格式无效。'); return value; }
function text(value, max = 2000) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail(400, '文本格式无效。');
  return value.trim();
}
function ids(value) {
  if (!Array.isArray(value) || value.length > 200) fail(400, '授权范围无效。');
  return [...new Set(value.map(id))];
}
function expectedDocumentVersions(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 200) fail(400, '审批资料版本格式无效。');
  const seen = new Set();
  return value.map(item => {
    object(item); rejectFields(item, ['documentId', 'versionId']);
    const documentId = id(item.documentId), versionId = id(item.versionId);
    if (seen.has(documentId)) fail(400, '审批资料不能包含重复标识。');
    seen.add(documentId); return { documentId, versionId };
  });
}
function date(value) { if (value === null || value === '') return null; if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) fail(400, '日期格式无效。'); return value; }
function number(value, max = 1e10) { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) fail(400, '数值格式无效。'); return value; }
function object(value) { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, '请求格式无效。'); return value; }
function rejectFields(input, allowed) { for (const key of Object.keys(input)) if (!allowed.includes(key)) fail(400, '存在不支持的字段。'); }
function projectFields(input, creating = false) {
  object(input);
  rejectFields(input, ['title', 'objective', 'scope', 'deliverables', 'processGroup', 'status', 'plannedStart', 'plannedEnd', 'budget', 'currency']);
  const out = {};
  for (const key of ['title', 'objective', 'scope']) if (input[key] !== undefined) out[key] = text(input[key], key === 'title' ? 200 : 4000);
  if (creating && !out.title) fail(400, '请填写项目名称。');
  if (input.deliverables !== undefined) { if (!Array.isArray(input.deliverables) || input.deliverables.length > 100) fail(400, '交付物格式无效。'); out.deliverables = input.deliverables.map(item => text(item, 500)); }
  if (input.processGroup !== undefined) { if (!PMP_PROCESS_GROUPS.includes(input.processGroup)) fail(400, '项目过程组无效。'); out.processGroup = input.processGroup; }
  if (input.status !== undefined) { if (!['proposed', 'planning', 'active', 'on_hold', 'completed', 'cancelled'].includes(input.status)) fail(400, '项目状态无效。'); out.status = input.status; }
  for (const key of ['plannedStart', 'plannedEnd']) if (input[key] !== undefined) out[key] = date(input[key]);
  if (input.budget !== undefined) out.budget = number(input.budget);
  if (input.currency !== undefined) { if (typeof input.currency !== 'string' || !/^[A-Z]{3}$/.test(input.currency)) fail(400, '货币格式无效。'); out.currency = input.currency; }
  return out;
}
function recordFields(type, input, creating = false) {
  object(input);
  const allowed = ['title', 'description', 'status', 'clientVisible', 'dueDate', 'owner', 'ownerId', 'startDate', 'wbsCode', 'parentTaskId', 'dependencyIds', 'probability', 'impact', 'response', 'severity', 'reason', 'requestedScope', 'costImpact', 'scheduleImpactDays', 'criteria', 'deliverableDocumentIds'];
  rejectFields(input, allowed);
  const out = {};
  for (const key of ['title', 'description', 'response', 'requestedScope', 'criteria', 'reason', 'owner', 'wbsCode']) if (input[key] !== undefined) out[key] = text(input[key], ['title', 'owner', 'wbsCode'].includes(key) ? 200 : 4000);
  if (creating && !out.title) fail(400, '请填写事项名称。');
  if (input.status !== undefined) { if (!RECORD_STATUSES[type].includes(input.status)) fail(400, '事项状态无效。'); out.status = input.status; }
  if (input.clientVisible !== undefined) { if (typeof input.clientVisible !== 'boolean') fail(400, '可见性格式无效。'); out.clientVisible = input.clientVisible; }
  for (const key of ['dueDate', 'startDate']) if (input[key] !== undefined) out[key] = date(input[key]);
  for (const key of ['ownerId', 'parentTaskId']) if (input[key] !== undefined) out[key] = input[key] === null ? null : id(input[key]);
  for (const key of ['dependencyIds', 'deliverableDocumentIds']) if (input[key] !== undefined) out[key] = ids(input[key]);
  if (input.probability !== undefined) out.probability = number(input.probability, 5);
  if (input.impact !== undefined) out.impact = type === 'change' ? text(input.impact, 4000) : number(input.impact, 5);
  if (input.severity !== undefined) { if (!['low', 'medium', 'high', 'critical'].includes(input.severity)) fail(400, '严重程度无效。'); out.severity = input.severity; }
  for (const key of ['costImpact', 'scheduleImpactDays']) if (input[key] !== undefined) out[key] = number(input[key]);
  return out;
}
function companyFields(input) {
  object(input); rejectFields(input, ['name', 'domain']);
  const name = text(input.name, 300); if (!name) fail(400, '请填写公司名称。');
  const out = { name };
  if (input.domain !== undefined) {
    out.domain = text(input.domain, 253).toLowerCase();
    if (out.domain && !/^(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(out.domain)) fail(400, '公司域名格式无效。');
  }
  return out;
}
function contactFields(input, creating = false) {
  object(input); rejectFields(input, ['firstName', 'lastName', 'email', 'phone', 'phoneCountryCode', 'jobTitle']);
  const out = {};
  for (const key of ['firstName', 'lastName', 'jobTitle']) if (input[key] !== undefined) out[key] = text(input[key], 200);
  if (creating && !out.firstName && !out.lastName) fail(400, '请填写联系人姓名。');
  if (input.email !== undefined) { out.email = text(input.email, 254); if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) fail(400, '邮箱格式无效。'); }
  if (input.phone !== undefined) { out.phone = text(input.phone, 30); if (out.phone && !/^\+?[\d ()-]{5,30}$/.test(out.phone)) fail(400, '电话号码格式无效。'); }
  if (input.phoneCountryCode !== undefined) { out.phoneCountryCode = text(input.phoneCountryCode, 4).replace(/^\+/, ''); if (out.phoneCountryCode && !/^\d{1,3}$/.test(out.phoneCountryCode)) fail(400, '电话区号格式无效。'); }
  return out;
}
function viewContact(contact) {
  const result = { id: id(contact.id), companyId: id(contact.companyId), canLogin: contact.active === true && validId(contact.identityId) };
  for (const field of ['name', 'firstName', 'lastName', 'email', 'phone', 'phoneCountryCode', 'jobTitle']) if (typeof contact[field] === 'string') result[field] = contact[field];
  return result;
}

// Twenty owns companies and contacts. These adapters read authoritative IDs and
// return an opaque HMAC identityId, not client-supplied phone/email inference:
// twenty.getCompany(id)->{id,name}; getContact(id)->{id,companyId,identityId,active}
// getManager(id)->{id,identityId,active}. Documents use a separate private adapter:
// documents.getObject(id,context)->{id,companyId,projectId,mimeType,size,filename};
// documents.readObject(id,context)->Buffer. Missing adapters fail closed.
export function createBusinessService({ env, store, twenty, documents, notifications, channels, now = () => Date.now(), newId = randomUUID }) {
  const authEpoch = record => {
    const value = record?.authEpoch === undefined ? 0 : record.authEpoch;
    if (!Number.isSafeInteger(value) || value < 0) fail(503, '访问授权暂不可用。');
    return value;
  };
  const nextAuthEpoch = record => {
    const value = authEpoch(record) + 1;
    if (!Number.isSafeInteger(value)) fail(503, '访问授权暂不可用。');
    return value;
  };
  const authorizationView = record => {
    const { authEpoch: internalEpoch, ...visible } = clone(record);
    return visible;
  };
  const subjectForPhone = phone => { keyBytes(env.CNPS_PROPOSAL_SECRET); const normalized = normalizePhone(phone); if (!normalized) fail(400, '手机号格式无效。'); return digest(env.CNPS_PROPOSAL_SECRET, 'phone', normalized); };
  const isAdmin = principal => principal?.identity?.role === 'admin' && validId(principal.identityId);
  function subject(principal) { if (!validId(principal?.identityId)) fail(401, '请先登录。'); return principal.identityId; }
  function companyEntry(directory, companyId) { return own(directory.companies, id(companyId)); }
  function access(directory, principal, companyId) {
    subject(principal);
    if (principal.identityVersion !== undefined && principal.identityVersion !== (directory.identities?.[principal.identityId]?.version || 0)) return null;
    if (directory.identities?.[principal.identityId]?.disabled || !['admin','sales_manager','customer'].includes(principal.identity?.role)) return null;
    if (!companyEntry(directory, companyId)) return null;
    if (isAdmin(principal)) return { role: 'admin' };
    const assignment = own(directory.managerAssignments, principal.identityId);
    if (assignment?.active && assignment.companyIds.includes(companyId)) {
      if (principal.authEpoch !== undefined && principal.authEpoch !== authEpoch(assignment)) return null;
      return { role: 'sales_manager' };
    }
    const grant = own(directory.memberGrants, principal.identityId);
    if (grant && principal.authEpoch !== undefined && principal.authEpoch !== authEpoch(grant)) return null;
    return grant?.active && grant.companyId === companyId ? { role: 'customer', grant } : null;
  }
  function manage(directory, principal, companyId) { const a = access(directory, principal, companyId); if (!internal(a)) missing(); return a; }
  function projectAccess(state, a, projectId) {
    const project = own(state.projects, id(projectId));
    if (!project || !a) missing();
    if (internal(a)) return project;
    if (a.role !== 'customer') missing();
    if (!project.publication || (a.grant.projectScope !== 'all' && !a.grant.projectIds.includes(projectId))) missing();
    return project;
  }
  function requireOpenProject(project) {
    if (project.status === 'completed') fail(409, '项目已结项，请先由项目负责人重新开启项目，再修改或审批事项。');
  }
  function docAccess(state, a, documentId, versionId) {
    const doc = own(state.documents, id(documentId));
    if (!doc || !a) missing();
    projectAccess(state, a, doc.projectId);
    if (a.role === 'customer' && (a.grant.documentScope !== 'all' && !a.grant.documentIds.includes(documentId))) missing();
    const requestedVersion = internal(a) && versionId ? id(versionId) : doc.activeVersionId;
    const version = doc.versions.find(item => item.id === requestedVersion && item.withdrawnAt == null && (internal(a) || Number.isFinite(item.publishedAt)));
    if (!version) missing();
    return { doc, version };
  }
  function viewProject(project, a) { return a.role === 'customer' ? pick(project.publication.project, ['id','companyId','title','objective','scope','deliverables','processGroup','status','plannedStart','plannedEnd','budget','currency','version','createdAt','updatedAt']) : { ...clone(project), publication: project.publication ? { version: project.publication.version, at: project.publication.at } : null }; }
  function customerRecord(record) {
    const result = pick(record, ['id','companyId','projectId','type','title','description','status','clientVisible','dueDate','startDate','wbsCode','criteria','deliverableDocumentIds','probability','impact','response','severity','reason','requestedScope','costImpact','scheduleImpactDays','version','createdAt','updatedAt']);
    if(record.decision)result.decision=pick(record.decision,['decision','comment','at','decidedVersion','deliverableVersions']);
    return result;
  }
  function viewDocument(doc, version) { return { id: doc.id, companyId: doc.companyId, projectId: doc.projectId, title: version.title, versionId: version.id, version: version.version, mimeType: version.mimeType, size: version.size, filename: version.filename, publishedAt: version.publishedAt, status: version.withdrawnAt != null ? 'withdrawn' : version.id === doc.activeVersionId ? 'published' : Number.isFinite(version.publishedAt) ? 'archived' : 'draft' }; }
  function managerDocument(doc) {
    const version = doc.versions.at(-1); if (!version) missing();
    return { ...viewDocument(doc, version), classification: doc.classification || 'internal', activeVersionId: doc.activeVersionId, versions: doc.versions.map(item => viewDocument(doc, item)) };
  }
  const event = (principal, action, extra = {}) => ({ id: newId(), actorId: subject(principal), action, at: now(), ...extra });
  async function snapshot(companyId, principal) {
    id(companyId);
    for (let retry = 0; retry < 3; retry++) {
      const directory = await store.getDirectory(), a = access(directory, principal, companyId);
      if (!a) missing();
      const state = await store.getCompany(companyId), latest = await store.getDirectory();
      if (latest.revision === directory.revision) return { directory, state, a };
    }
    fail(409, '权限已变更，请刷新后重试。');
  }
  async function directoryWrite(principal, transform) {
    const directory = await store.getDirectory(), next = clone(directory);
    if (directory.identities?.[subject(principal)]?.disabled || (principal.identityVersion!==undefined&&principal.identityVersion!==(directory.identities?.[principal.identityId]?.version||0))) missing();
    const result = await transform(next, directory);
    next.revision = directory.revision + 1;
    if (!await store.commitDirectory(directory.revision, next)) fail(409, '权限已变更，请刷新后重试。');
    return result;
  }
  async function companyWrite(principal, companyId, transform, { customer = false, expectedDirectoryRevision, expectedCompanyRevision } = {}) {
    const { directory, state, a } = await snapshot(companyId, principal);
    if (!customer) manage(directory, principal, companyId);
    if ((expectedDirectoryRevision !== undefined && directory.revision !== expectedDirectoryRevision) || (expectedCompanyRevision !== undefined && state.revision !== expectedCompanyRevision)) fail(409, '数据或权限已变更，请刷新后重试。');
    const next = clone(state), result = await transform(next, a, directory);
    next.revision = state.revision + 1;
    if (!await store.commitCompany(companyId, directory.revision, state.revision, next)) fail(409, '数据或权限已变更，请刷新后重试。');
    return result;
  }
  async function authoritative(method, resourceId) {
    if (!twenty || typeof twenty[method] !== 'function') fail(503, 'CRM资料接口尚未连接。');
    const resource = await twenty[method](id(resourceId));
    if (!resource || resource.id !== resourceId) missing();
    return resource;
  }
  async function activeCompany(companyId) {
    if (typeof twenty?.getCompany !== 'function') fail(503, 'CRM资料接口尚未连接。');
    const company = await twenty.getCompany(id(companyId));
    return Boolean(company && company.id === companyId && company.active !== false);
  }
  function checkReferences(state, projectId, recordId, record) {
    if (record.startDate && record.dueDate && record.startDate > record.dueDate) fail(400, '事项开始日期不能晚于截止日期。');
    for (const targetId of [...(record.dependencyIds || []), ...(record.parentTaskId ? [record.parentTaskId] : [])]) {
      const target = own(state.records, targetId);
      if (!target || target.projectId !== projectId || target.type !== 'task' || target.id === recordId) fail(400, '任务引用超出项目范围。');
    }
    for (const docId of record.deliverableDocumentIds || []) if (own(state.documents, docId)?.projectId !== projectId) fail(400, '交付物引用超出项目范围。');
    if (record.ownerId !== undefined && record.ownerId !== null) {
      // Owner is an opaque staff/contact identifier, not a membership grant.
      id(record.ownerId);
    }
    const graph = new Map(Object.values(state.records).filter(item => item.type === 'task' && item.projectId === projectId).map(item => [item.id, [...(item.dependencyIds || []), ...(item.parentTaskId ? [item.parentTaskId] : [])]]));
    if (record.type === 'task') graph.set(recordId, [...(record.dependencyIds || []), ...(record.parentTaskId ? [record.parentTaskId] : [])]);
    const visited = new Set(), visiting = new Set();
    function walk(key) {
      if (visiting.has(key)) fail(400, '任务依赖不能形成循环。');
      if (visited.has(key)) return;
      visiting.add(key); for (const target of graph.get(key) || []) walk(target); visiting.delete(key); visited.add(key);
    }
    for (const key of graph.keys()) walk(key);
  }
  function recipientAccess(directory, contact, companyId) {
    const grant = own(directory.memberGrants, contact.identityId || '');
    if (!contact.active || contact.companyId !== companyId || !grant?.active || grant.companyId !== companyId || grant.contactId !== contact.id) missing();
    return { role: 'customer', grant };
  }
  function deliveryAccess(state, a, deliveryId, principal) {
    const delivery = own(state.deliveries || {}, id(deliveryId));
    if (!delivery || (a.role === 'customer' && delivery.recipientId !== subject(principal))) missing();
    projectAccess(state, a, delivery.projectId);
    for (const source of delivery.documents) {
      const resolved = docAccess(state, a, source.documentId, source.versionId);
      if (resolved.version.id !== source.versionId || resolved.doc.activeVersionId !== source.versionId || !Number.isFinite(resolved.version.publishedAt)) missing();
    }
    return delivery;
  }
  function deliveryView(delivery, a) {
    const { recipientId, contactId, requestId, actorId, ...result } = clone(delivery);
    for(const channel of ['sms','email','wecom'])if(result[channel]){const {attempt,providerId,targetDigest,tag,subject,binding,subAccount,signature,templateId,receiptCode,...visible}=result[channel];result[channel]=visible;}
    return a.role === 'customer' ? result : { ...result, contactId };
  }
  const service = {
    subjectForPhone,
    async proposalAccess(phone, binding) {
      const identityId = subjectForPhone(phone);
      const principal = { identityId, identity: { role: phone === normalizePhone(env.CNPS_CRM_ADMIN_PHONE) ? 'admin' : 'customer' } };
      if (!isAdmin(principal)) {
        const memberships = await service.loadMemberships(phone);
        if (!memberships.some(m => m.companyId === binding.companyId)) missing();
      }
      const { state, a } = await snapshot(binding.companyId, principal);
      projectAccess(state, a, binding.projectId);
      for (const source of Object.values(binding.documents)) {
        const resolved = docAccess(state, a, source.documentId, source.versionId);
        if (resolved.doc.projectId !== binding.projectId || resolved.version.id !== source.versionId || resolved.doc.activeVersionId !== source.versionId || !Number.isFinite(resolved.version.publishedAt)) missing();
      }
      return { principal, customer: a.role === 'customer', contactId: a.grant?.contactId };
    },
    async recordProposalActivity(phone, binding, kind, eventId, assetId, metadata = {}) {
      if (!['login','view','download'].includes(kind)) fail(400,'事件类型无效。');
      id(eventId);
      const contentHash=metadata.contentHash ? text(metadata.contentHash,64) : null;
      if(contentHash && !/^[a-f0-9]{64}$/.test(contentHash)) fail(400,'版本指纹无效。');
      const filename=metadata.filename ? text(metadata.filename,300) : null;
      if (kind === 'download' && !Object.hasOwn(binding.documents, assetId || '')) missing();
      const verified = await service.proposalAccess(phone, binding);
      if (!verified.customer) return; // Staff previews never become customer views.
      return companyWrite(verified.principal, binding.companyId, (next, a) => {
        if (a.role !== 'customer' || a.grant.contactId !== verified.contactId) missing();
        projectAccess(next,a,binding.projectId);
        for (const source of Object.values(binding.documents)) {
          const current=docAccess(next,a,source.documentId,source.versionId);
          if(current.version.id!==source.versionId || current.doc.activeVersionId!==source.versionId) missing();
        }
        next.proposalActivity ||= {};
        const key=binding.id+':'+verified.principal.identityId;
        const row=next.proposalActivity[key] ||= {proposalId:binding.id,projectId:binding.projectId,contactId:verified.contactId,recipientId:verified.principal.identityId,phoneMasked:phone.slice(0,3)+'****'+phone.slice(-4),loginCount:0,viewCount:0,downloads:[],eventIds:[]};
        if(row.eventIds.includes(eventId))return;
        row.eventIds.push(eventId);
        if(kind==='login'){row.loginCount++;row.lastLoginAt=now();}
        if(kind==='view'){row.viewCount++;row.viewedAt ||= now();row.lastViewedAt=now();row.contentHash=contentHash;}
        if(kind==='download'){row.downloads.push({assetId,filename,contentHash,at:now()});}
        next.events.push(event(verified.principal,'proposal.'+kind,{companyId:binding.companyId,projectId:binding.projectId,contactId:verified.contactId,phoneMasked:row.phoneMasked,proposalId:binding.id,contentHash,...(kind==='download'?{assetId,filename}:{})}));
      },{customer:true});
    },
    async loadMemberships(phone) {
      const pid = subjectForPhone(phone), directory = await store.getDirectory();
      if (directory.identities?.[pid]?.disabled) return [];
      const assignment = own(directory.managerAssignments, pid);
      if (assignment?.active) {
        const staff = await authoritative('getManager', assignment.staffId);
        if (!staff.active || staff.identityId !== pid) return [];
        const memberships = [];
        for (const companyId of assignment.companyIds) {
          if (own(directory.companies, companyId) && await activeCompany(companyId)) memberships.push({ companyId, active: true, role: 'sales_manager', authEpoch: authEpoch(assignment), permissions: ['projects:read', 'documents:read', 'members:manage', 'projects:manage', 'documents:manage'] });
        }
        return memberships;
      }
      const grant = own(directory.memberGrants, pid);
      if (!grant?.active || !own(directory.companies, grant.companyId)) return [];
      // Also revalidate native contact ownership and current phone identity. A
      // direct phone/company edit in Twenty must not preserve a stale login grant.
      const contact = await authoritative('getContact', grant.contactId);
      if (!contact.active || contact.identityId !== pid || contact.companyId !== grant.companyId) return [];
      // A Twenty company can be soft-deleted while its contacts keep the old
      // relation ID. Such a tombstone must not preserve an old portal grant.
      if (!await activeCompany(grant.companyId)) return [];
      return [{ companyId: grant.companyId, active: true, role: 'customer', authEpoch:authEpoch(grant), permissions: ['projects:read', 'documents:read', ...((grant.operations || ['view','download']).includes('download') ? ['documents:download'] : []), ...(grant.allowApprovals ? ['approvals:submit'] : [])], ...(grant.projectScope === 'selected' ? { projectIds: clone(grant.projectIds) } : {}), ...(grant.documentScope === 'selected' ? { documentIds: clone(grant.documentIds) } : {}) }];
    },
    async registerCompany(principal, companyId) {
      if (!isAdmin(principal)) missing();
      const company = await authoritative('getCompany', companyId);
      return directoryWrite(principal, next => {
        const previous = own(next.companies, companyId);
        if (previous) return clone(previous);
        const entry = { companyId, nativeCompanyId: companyId, name: text(company.name, 300), registeredAt: now() };
        next.companies[companyId] = entry; next.events.push(event(principal, 'company.register', { companyId })); return clone(entry);
      });
    },
    async listCompanies(principal) {
      const directory = await store.getDirectory(); subject(principal);
      if (directory.identities?.[principal.identityId]?.disabled) missing();
      if (isAdmin(principal) && typeof twenty?.listCompanies === 'function') {
        const native = await twenty.listCompanies();
        if (!Array.isArray(native)) fail(503, 'CRM资料暂不可用。');
        return native.filter(company => validId(company?.id)).map(company => ({ companyId: company.id, nativeCompanyId: company.id, name: text(company.name, 300), registered: Boolean(own(directory.companies, company.id)), registeredAt: own(directory.companies, company.id)?.registeredAt || null }));
      }
      const result = [];
      for (const entry of Object.values(directory.companies).filter(item => access(directory, principal, item.companyId))) {
        const native = await authoritative('getCompany', entry.companyId);
        result.push({ ...clone(entry), name: text(native.name, 300), registered: true });
      }
      return result;
    },
    async createCompany(principal, input) {
      if (!isAdmin(principal)) missing();
      if (typeof twenty?.createCompany !== 'function') fail(503, 'CRM资料接口尚未连接。');
      const native = await twenty.createCompany(companyFields(input));
      if (!validId(native?.id)) fail(503, 'CRM资料暂不可用。');
      // Only this explicitly authenticated admin action registers a tenant.
      // Public inquiry ingestion must never call this portal registration path.
      return service.registerCompany(principal, native.id);
    },
    async listContacts(principal, companyId) {
      const directory = await store.getDirectory(); manage(directory, principal, companyId);
      await authoritative('getCompany', companyId);
      if (typeof twenty?.listContacts !== 'function') fail(503, 'CRM资料接口尚未连接。');
      const contacts = await twenty.listContacts(companyId);
      if (!Array.isArray(contacts)) fail(503, 'CRM资料暂不可用。');
      const latest = await store.getDirectory(); manage(latest, principal, companyId);
      return contacts.filter(contact => contact?.companyId === companyId && validId(contact.id)).map(viewContact);
    },
    async listStaff(principal) {
      if (!isAdmin(principal)) missing();
      const companyId = env.CNPS_INTERNAL_COMPANY_ID;
      if (!validId(companyId)) fail(503, '内部职员目录尚未配置。');
      if (!await activeCompany(companyId)) missing();
      if (typeof twenty?.listContacts !== 'function') fail(503, 'CRM资料接口尚未连接。');
      const contacts = await twenty.listContacts(companyId);
      if (!Array.isArray(contacts)) fail(503, 'CRM资料暂不可用。');
      // Company selection is exclusively server configuration. Never accept a
      // browser company/role parameter for the internal manager candidate list.
      return contacts.filter(contact => contact?.companyId === companyId && contact.active === true && validId(contact.id) && validId(contact.identityId)).map(viewContact);
    },
    async createContact(principal, companyId, input) {
      const directory = await store.getDirectory(); manage(directory, principal, companyId);
      await authoritative('getCompany', companyId);
      if (typeof twenty?.createContact !== 'function') fail(503, 'CRM资料接口尚未连接。');
      const fields = contactFields(input, true);
      manage(await store.getDirectory(), principal, companyId);
      const contact = await twenty.createContact(companyId, fields);
      if (!validId(contact?.id) || contact.companyId !== companyId) fail(503, 'CRM资料暂不可用。');
      manage(await store.getDirectory(), principal, companyId);
      return viewContact(contact);
    },
    async updateContact(principal, companyId, contactId, input) {
      const directory = await store.getDirectory(); manage(directory, principal, companyId);
      const contact = await authoritative('getContact', contactId);
      if (contact.companyId !== companyId) missing();
      if (typeof twenty?.updateContact !== 'function') fail(503, 'CRM资料接口尚未连接。');
      const fields = contactFields(input);
      const changedPhone = ['phone', 'phoneCountryCode'].some(field => fields[field] !== undefined && fields[field] !== (contact[field] || ''));
      if (changedPhone && validId(contact.identityId)) {
        // Revoke first, before a non-transactional external phone change. A failed
        // Twenty update can be retried, but an old number never retains access.
        const grant = own(directory.memberGrants, contact.identityId);
        if (grant) await service.revokeMember(principal, companyId, contactId);
        if (own(directory.managerAssignments, contact.identityId)) {
          if (!isAdmin(principal)) missing();
          await directoryWrite(principal, next => {
            const assignment = own(next.managerAssignments, contact.identityId);
            if (assignment) { assignment.authEpoch = nextAuthEpoch(assignment); assignment.active = false; assignment.version++; assignment.updatedAt = now(); next.events.push(event(principal, 'manager.revoke-phone-change', { identityId: contact.identityId, version: assignment.version })); }
          });
        }
      }
      manage(await store.getDirectory(), principal, companyId);
      const updated = await twenty.updateContact(companyId, contactId, fields);
      if (updated?.id !== contactId || updated.companyId !== companyId) fail(503, 'CRM资料暂不可用。');
      manage(await store.getDirectory(), principal, companyId);
      return viewContact(updated);
    },
    async assignManager(principal, staffId, companyIds, active = true) {
      if (!isAdmin(principal)) missing();
      const staff = await authoritative('getManager', staffId), selected = ids(companyIds);
      if (!staff.active || !validId(staff.identityId) || typeof active !== 'boolean') fail(400, '经理资料无效。');
      return directoryWrite(principal, next => {
        for (const companyId of selected) if (!companyEntry(next, companyId)) missing();
        if (own(next.memberGrants, staff.identityId)) fail(409, '客户身份不能同时设为跨公司经理。');
        const previous = own(next.managerAssignments, staff.identityId);
        const assignment = { identityId: staff.identityId, staffId, companyIds: selected, active, authEpoch: previous?.active && !active ? nextAuthEpoch(previous) : authEpoch(previous), version: (previous?.version || 0) + 1, updatedAt: now() };
        next.managerAssignments[staff.identityId] = assignment;
        next.events.push(event(principal, 'manager.assign', { staffId, companyIds: selected, active, version: assignment.version })); return authorizationView(assignment);
      });
    },
    async listManagers(principal, companyId) {
      if (!isAdmin(principal)) missing();
      const directory = await store.getDirectory();
      if (!companyEntry(directory, companyId)) missing();
      // Include inactive/other-company assignments so the editor has the current
      // version without exposing identity HMACs or unrelated client scopes.
      return Object.values(directory.managerAssignments).map(a => ({
        staffId: a.staffId, active: a.active && a.companyIds.includes(companyId), version: a.version
      }));
    },
    async setCompanyManager(principal, companyId, staffId, active, expectedVersion) {
      if (!isAdmin(principal)) missing();
      if (typeof active !== 'boolean' || !Number.isSafeInteger(expectedVersion) || expectedVersion < 0) fail(400, '经理授权参数无效。');
      const staff = await authoritative('getManager', staffId);
      if (!staff.active || !validId(staff.identityId)) fail(400, '经理资料无效。');
      await authoritative('getCompany', companyId);
      return directoryWrite(principal, next => {
        if (!companyEntry(next, companyId)) missing();
        if (own(next.memberGrants, staff.identityId)) fail(409, '客户身份不能同时设为跨公司经理。');
        const previous = own(next.managerAssignments, staff.identityId);
        if ((previous?.version || 0) !== expectedVersion) fail(409, '权限已变更，请刷新后重试。');
        // Only this edge changes. Globally revoked legacy assignments must not
        // regain access to their other companies when one edge is enabled.
        const selected = new Set(previous?.active ? previous.companyIds : []);
        if (active) selected.add(companyId); else selected.delete(companyId);
        const assignment = { identityId: staff.identityId, staffId, companyIds: [...selected], active: selected.size > 0, authEpoch: previous?.active && selected.size === 0 ? nextAuthEpoch(previous) : authEpoch(previous), version: expectedVersion + 1, updatedAt: now() };
        next.managerAssignments[staff.identityId] = assignment;
        next.events.push(event(principal, active ? 'manager.company-grant' : 'manager.company-revoke', { companyId, staffId, version: assignment.version }));
        return { staffId, active, version: assignment.version };
      });
    },
    async grantMember(principal, companyId, input) {
      object(input); rejectFields(input, ['contactId', 'projectScope', 'projectIds', 'documentScope', 'documentIds', 'allowApprovals', 'operations', 'includeFuture']);
      const { directory, state } = await snapshot(companyId, principal); manage(directory, principal, companyId);
      const contact = await authoritative('getContact', input.contactId);
      if (!contact.active || contact.companyId !== companyId || !validId(contact.identityId)) missing();
      const projectScope = input.projectScope || 'selected', documentScope = input.documentScope || 'selected';
      if ((projectScope === 'all' || documentScope === 'all') && input.includeFuture !== true) fail(400, '包含未来新增内容必须明确确认。');
      const operations = input.operations === undefined ? ['view'] : ids(input.operations);
      if (!operations.includes('view') || operations.some(op => !['view','download'].includes(op))) fail(400, '操作权限无效。');
      if (!['all', 'selected'].includes(projectScope) || !['all', 'selected'].includes(documentScope)) fail(400, '请指定资料授权范围。');
      const projectIds = projectScope === 'all' ? [] : ids(input.projectIds || []), documentIds = documentScope === 'all' ? [] : ids(input.documentIds || []);
      for (const projectId of projectIds) if (!own(state.projects, projectId)) missing();
      for (const documentId of documentIds) { const doc = own(state.documents, documentId); if (!doc || (projectScope === 'selected' && !projectIds.includes(doc.projectId))) missing(); }
      if (input.allowApprovals !== undefined && typeof input.allowApprovals !== 'boolean') fail(400, '审批权限格式无效。');
      return directoryWrite(principal, next => {
        manage(next, principal, companyId);
        const previous = own(next.memberGrants, contact.identityId);
        if (previous && previous.companyId !== companyId) fail(409, '客户所属公司不可更改。');
        if (own(next.managerAssignments, contact.identityId)) fail(409, '经理身份不能同时设为客户身份。');
        const grant = { identityId: contact.identityId, contactId: input.contactId, companyId, active: true, projectScope, projectIds, documentScope, documentIds, authEpoch:authEpoch(previous), operations, grantedBy: subject(principal), allowApprovals: input.allowApprovals === true, version: (previous?.version || 0) + 1, updatedAt: now() };
        next.memberGrants[contact.identityId] = grant;
        next.events.push(event(principal, 'member.grant', { companyId, identityId: contact.identityId, version: grant.version })); return authorizationView(grant);
      });
    },
    async revokeMember(principal, companyId, contactId) {
      manage(await store.getDirectory(), principal, companyId);
      const contact = await authoritative('getContact', contactId);
      if (contact.companyId !== companyId || !validId(contact.identityId)) missing();
      return directoryWrite(principal, next => {
        manage(next, principal, companyId);
        const grant = own(next.memberGrants, contact.identityId);
        if (!grant || grant.companyId !== companyId) missing();
        grant.authEpoch = nextAuthEpoch(grant); grant.active = false; grant.version++; grant.updatedAt = now();
        next.events.push(event(principal, 'member.revoke', { companyId, identityId: contact.identityId, version: grant.version })); return { ok: true, version: grant.version };
      });
    },
    async listMembers(principal, companyId) {
      const directory = await store.getDirectory(); manage(directory, principal, companyId);
      return Object.values(directory.memberGrants).filter(grant => grant.companyId === companyId).map(authorizationView);
    },
    async createProject(principal, companyId, input) {
      const fields = projectFields(input, true);
      if (fields.status === 'completed') fail(400, '新项目不能跳过验收直接结项。');
      return companyWrite(principal, companyId, next => {
        const projectId = id(newId());
        const project = { id: projectId, companyId, title: fields.title, objective: '', scope: '', deliverables: [], processGroup: 'initiating', status: 'proposed', ...fields, version: 1, publicationVersion: 0, createdAt: now(), updatedAt: now(), publication: null };
        if (project.plannedStart && project.plannedEnd && project.plannedStart > project.plannedEnd) fail(400, '项目开始日期不能晚于结束日期。');
        next.projects[projectId] = project; next.events.push(event(principal, 'project.create', { companyId, projectId })); return viewProject(project, { role: 'admin' });
      });
    },
    async updateProject(principal, companyId, projectId, input) {
      const fields = projectFields(input);
      return companyWrite(principal, companyId, next => {
        const project = projectAccess(next, { role: 'admin' }, projectId);
        if (project.status === 'completed' && fields.status !== undefined && !['completed', 'active', 'planning'].includes(fields.status)) fail(409, '已结项项目如需继续工作，请明确重新开启为进行中或规划中。');
        if (fields.status === 'completed') {
          const records = Object.values(next.records).filter(record => record.projectId === projectId), acceptance = records.filter(record => record.type === 'acceptance');
          if (!acceptance.length || acceptance.some(record => record.status !== 'approved') || records.some(record => record.type === 'task' && record.status !== 'done')) fail(409, '项目任务完成且验收通过后才能完成结项。');
          // Closing approves the materials that are current at this transition.
          // A previously completed project's later archive changes do not rewrite
          // its historical closure when it remains in the completed state.
          if (project.status !== 'completed') for (const record of acceptance) {
            const decision = record.decision, refs = record.deliverableDocumentIds || [], versions = decision?.deliverableVersions;
            if (decision?.decision !== 'approved' || decision.decidedVersion !== record.version || (refs.length && !Array.isArray(versions)) || (versions?.length || 0) !== refs.length) fail(409, '验收审批未绑定当前事项和资料版本，请修订并重新审批后结项。');
            const seen = new Set();
            for (const documentId of refs) {
              const doc = own(next.documents, documentId), version = doc?.versions.find(item => item.id === doc.activeVersionId && item.withdrawnAt == null && Number.isFinite(item.publishedAt));
              const binding = versions.find(item => item.documentId === documentId);
              if (!version || doc.projectId !== record.projectId || !binding || seen.has(binding.documentId) || binding.versionId !== version.id || binding.version !== version.version) fail(409, '验收资料已更换版本或撤回，请修订并重新审批后结项。');
              seen.add(binding.documentId);
            }
          }
        }
        Object.assign(project, fields, { version: project.version + 1, updatedAt: now() });
        if (project.plannedStart && project.plannedEnd && project.plannedStart > project.plannedEnd) fail(400, '项目开始日期不能晚于结束日期。');
        next.events.push(event(principal, 'project.update', { companyId, projectId, version: project.version })); return viewProject(project, { role: 'admin' });
      });
    },
    async publishProject(principal, companyId, projectId) {
      return companyWrite(principal, companyId, next => {
        const project = projectAccess(next, { role: 'admin' }, projectId);
        project.publicationVersion = (project.publicationVersion || 0) + 1;
        const { publication, ...publicProject } = clone(project);
        const records = Object.fromEntries(Object.values(next.records).filter(record => record.projectId === projectId && record.clientVisible === true).map(record => [record.id, customerRecord(record)]));
        project.publication = { version: project.publicationVersion, at: now(), project: publicProject, records };
        next.events.push(event(principal, 'project.publish', { companyId, projectId, publicationVersion: project.publication.version })); return { ok: true, publicationVersion: project.publication.version };
      });
    },
    async unpublishProject(principal, companyId, projectId) {
      return companyWrite(principal, companyId, next => { const project = projectAccess(next, { role: 'admin' }, projectId); project.publication = null; next.events.push(event(principal, 'project.unpublish', { companyId, projectId })); return { ok: true }; });
    },
    async listProjects(principal, companyId) {
      const { state, a } = await snapshot(companyId, principal);
      return Object.values(state.projects).filter(project => internal(a) || (project.publication && (a.grant.projectScope === 'all' || a.grant.projectIds.includes(project.id)))).map(project => viewProject(project, a));
    },
    async getProject(principal, companyId, projectId) {
      const { state, a } = await snapshot(companyId, principal); return viewProject(projectAccess(state, a, projectId), a);
    },
    async createRecord(principal, companyId, projectId, type, input) {
      if (!PMP_RECORD_TYPES.includes(type)) fail(400, '事项类型无效。');
      const fields = recordFields(type, input, true);
      if (['change', 'acceptance'].includes(type) && ['approved', 'rejected', 'implemented'].includes(fields.status)) fail(400, '审批事项必须通过决策流程。');
      return companyWrite(principal, companyId, next => {
        requireOpenProject(projectAccess(next, { role: 'admin' }, projectId));
        const recordId = id(newId()), record = { id: recordId, companyId, projectId, type, title: fields.title, description: '', status: RECORD_STATUSES[type][0], clientVisible: false, ...fields, version: 1, createdAt: now(), updatedAt: now() };
        checkReferences(next, projectId, recordId, record);
        next.records[recordId] = record; next.events.push(event(principal, `${type}.create`, { companyId, projectId, recordId })); return clone(record);
      });
    },
    async updateRecords(principal, companyId, updates) {
      if (!Array.isArray(updates) || !updates.length || updates.length > 100) fail(400, '批量事项格式无效。');
      return companyWrite(principal, companyId, next => {
        const prepared = [], seen = new Set();
        for (const update of updates) {
          object(update); rejectFields(update, ['id', 'fields']);
          const recordId = id(update.id);
          if (seen.has(recordId)) fail(400, '批量事项不能包含重复标识。');
          seen.add(recordId);
          const record = own(next.records, recordId); if (!record) missing();
          requireOpenProject(projectAccess(next, { role: 'admin' }, record.projectId));
          object(update.fields);
          const decided = ['change', 'acceptance'].includes(record.type) && (record.decision || ['approved', 'rejected', 'implemented'].includes(record.status));
          // A decision belongs to its approved/rejected content. Only an isolated
          // implementation status transition may follow an approved change.
          const implementOnly = record.type === 'change' && record.status === 'approved' && Object.keys(update.fields).length === 1 && update.fields.status === 'implemented';
          const revise = decided && record.status !== 'implemented' && ['draft', 'requested'].includes(update.fields.status);
          if (decided && !implementOnly && !revise) fail(409, '已决事项如需修改，请显式修订为草稿或待审批状态并重新申请；已实施变更不可修改。');
          const fields = recordFields(record.type, update.fields);
          if (['change', 'acceptance'].includes(record.type) && ['approved', 'rejected'].includes(fields.status)) fail(400, '请使用专用决策接口。');
          if (record.type === 'change' && fields.status === 'implemented' && record.status !== 'approved') fail(409, '变更审批通过后才能实施。');
          prepared.push({ record, fields, revise, implementOnly });
        }
        // Apply only after every scope, lifecycle and approval guard passes; then
        // validate the complete candidate graph before its one atomic commit.
        for (const { record, fields, revise, implementOnly } of prepared) {
          if (revise) {
            const { decisionHistory, ...snapshot } = clone(record);
            record.decisionHistory = [...(decisionHistory || []), { recordVersion: record.version, snapshot, decision: clone(record.decision || null), revisedAt: now(), revisedBy: subject(principal) }];
            delete record.decision;
          }
          // Legacy approvals may predate explicit version binding. Their current
          // approved content is still unchanged here, before the status version.
          if (implementOnly && record.decision && record.decision.decidedVersion === undefined) record.decision.decidedVersion = record.version;
          Object.assign(record, fields, { version: record.version + 1, updatedAt: now() });
        }
        for (const { record } of prepared) checkReferences(next, record.projectId, record.id, record);
        const changed = prepared.map(({ record }) => clone(record));
        next.events.push(event(principal, 'records.update', { companyId, recordIds: changed.map(record => record.id), recordVersions: changed.map(record => ({ recordId: record.id, version: record.version, status: record.status, ...(record.decision?.decidedVersion !== undefined ? { decidedVersion: record.decision.decidedVersion } : {}) })), revisedRecordIds: prepared.filter(item => item.revise).map(item => item.record.id) })); return changed;
      });
    },
    async listRecords(principal, companyId, projectId, type) {
      if (type !== undefined && !PMP_RECORD_TYPES.includes(type)) fail(400, '事项类型无效。');
      const { state, a } = await snapshot(companyId, principal), project = projectAccess(state, a, projectId);
      const records = a.role === 'customer' ? Object.values(project.publication.records) : Object.values(state.records).filter(record => record.projectId === projectId);
      return records.filter(record => !type || record.type === type).map(record => a.role === 'customer' ? customerRecord(record) : clone(record));
    },
    async getRecord(principal, companyId, recordId) {
      const { state, a } = await snapshot(companyId, principal), record = own(state.records, id(recordId)); if (!record) missing();
      const project = projectAccess(state, a, record.projectId);
      if (a.role === 'customer') { const published = own(project.publication.records, recordId); if (!published) missing(); return customerRecord(published); }
      return clone(record);
    },
    async listEvents(principal, companyId) {
      const { directory, state } = await snapshot(companyId, principal); manage(directory, principal, companyId);
      const permissionEvents = directory.events.filter(item => item.companyId === companyId || item.companyIds?.includes(companyId)).map(item => ({ ...clone(item), ...(item.companyIds ? { companyIds: [companyId] } : {}) }));
      return [...clone(state.events), ...permissionEvents].sort((a, b) => a.at - b.at);
    },
    async decide(principal, companyId, recordId, input) {
      object(input); rejectFields(input, ['decision', 'comment', 'expectedVersion', 'expectedDocumentVersions']);
      if (!['approved', 'rejected'].includes(input.decision) || !Number.isInteger(input.expectedVersion)) fail(400, '决策格式无效。');
      const comment = text(input.comment || '', 2000), expectedDocuments = expectedDocumentVersions(input.expectedDocumentVersions);
      return companyWrite(principal, companyId, (next, a) => {
        const record = own(next.records, id(recordId)); if (!record || !['change', 'acceptance'].includes(record.type)) missing();
        const project = projectAccess(next, a, record.projectId);
        if (a.role === 'customer') {
          const published = own(project.publication.records, recordId);
          if (!a.grant.allowApprovals || !published || published.version !== input.expectedVersion) missing();
        }
        requireOpenProject(project);
        if (record.decision) fail(409, '该事项已有审批决定，请先显式修订为草稿并重新提交审批。');
        if (record.status !== 'requested' || record.version !== input.expectedVersion) fail(409, '该事项已变更，请刷新后重试。');
        const refs = record.deliverableDocumentIds || [];
        const deliverableVersions = refs.map(documentId => {
          const { version } = docAccess(next, a, documentId);
          return { documentId, versionId: version.id, version: version.version };
        });
        if (expectedDocuments.length !== refs.length || expectedDocuments.some(item => !refs.includes(item.documentId))) fail(400, '请提供全部审批资料的准确版本，再提交审批。');
        for (const binding of deliverableVersions) if (expectedDocuments.find(item => item.documentId === binding.documentId)?.versionId !== binding.versionId) fail(409, '审批资料已更换版本，请刷新并核对资料后重新提交。');
        record.status = input.decision; record.version++; record.updatedAt = now();
        record.decision = { decision: input.decision, comment, actorId: subject(principal), at: now(), decidedVersion: record.version, deliverableVersions };
        if (project.publication && own(project.publication.records, recordId)) project.publication.records[recordId] = customerRecord(record);
        next.events.push(event(principal, `${record.type}.decision`, { companyId, projectId: record.projectId, recordId, decision: input.decision, version: record.version })); return a.role === 'customer' ? customerRecord(record) : clone(record);
      }, { customer: true });
    },
    async uploadDocument(principal, companyId, projectId, input) {
      object(input); rejectFields(input, ['title', 'filename', 'mimeType', 'base64', 'documentId']);
      const initial = await snapshot(companyId, principal); manage(initial.directory, principal, companyId); projectAccess(initial.state, initial.a, projectId);
      if (input.documentId !== undefined) { const previous = own(initial.state.documents, id(input.documentId)); if (!previous || previous.projectId !== projectId) missing(); }
      const title = text(input.title, 200), filename = text(input.filename, 200);
      if (!title || !filename || /[\r\n/\\]/.test(filename) || ['.', '..'].includes(filename)) fail(400, '文件名称无效。');
      if (!MIME_TYPES.has(input.mimeType)) fail(400, '文件类型不支持。');
      if (typeof input.base64 !== 'string' || input.base64.length > Math.ceil(PMP_MAX_UPLOAD_BYTES / 3) * 4) fail(413, '单个文件不能超过 3MB。');
      if (!input.base64 || input.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64)) fail(400, '文件编码无效。');
      const bytes = Buffer.from(input.base64, 'base64');
      if (!bytes.length || bytes.toString('base64') !== input.base64) fail(400, '文件编码无效。');
      if (bytes.length > PMP_MAX_UPLOAD_BYTES) fail(413, '单个文件不能超过 3MB。');
      if (typeof documents?.createObject !== 'function') fail(503, '私有资料上传接口尚未连接。');
      const metadata = await documents.createObject({ companyId, projectId, filename, mimeType: input.mimeType, base64: input.base64 });
      if (!validId(metadata?.id) || metadata.companyId !== companyId || metadata.projectId !== projectId || metadata.size !== bytes.length || metadata.mimeType !== input.mimeType) fail(503, '私有资料上传结果无效。');
      // Native file IO is outside Redis transactions. The immutable private
      // object may remain an orphan on conflict; no URL or ACL is exposed.
      return service.registerDocument(principal, companyId, projectId, { objectId: metadata.id, title, ...(input.documentId !== undefined ? { documentId: input.documentId } : {}) }, {
        expectedDirectoryRevision: initial.directory.revision, expectedCompanyRevision: initial.state.revision
      });
    },
    async registerDocument(principal, companyId, projectId, input, expected = {}) {
      object(input); rejectFields(input, ['objectId', 'title', 'documentId']);
      const initial = await snapshot(companyId, principal); manage(initial.directory, principal, companyId); projectAccess(initial.state, initial.a, projectId);
      if ((expected.expectedDirectoryRevision !== undefined && initial.directory.revision !== expected.expectedDirectoryRevision) || (expected.expectedCompanyRevision !== undefined && initial.state.revision !== expected.expectedCompanyRevision)) fail(409, '数据或权限已变更，请刷新后重试。');
      if (!documents || typeof documents.getObject !== 'function') fail(503, '私有资料接口尚未连接。');
      const metadata = await documents.getObject(id(input.objectId), { companyId, projectId });
      if (!metadata || metadata.id !== input.objectId || metadata.companyId !== companyId || metadata.projectId !== projectId) missing();
      if (!MIME_TYPES.has(metadata.mimeType)) fail(400, '文件类型不支持。');
      const title = text(input.title, 200), filename = text(metadata.filename, 200).replace(/[\r\n/\\]/g, '-'), size = number(metadata.size, 50 * 1024 * 1024);
      if (!title || !filename || !Number.isInteger(size)) fail(400, '文件资料无效。');
      return companyWrite(principal, companyId, next => {
        projectAccess(next, { role: 'admin' }, projectId);
        const documentId = input.documentId ? id(input.documentId) : id(newId());
        let doc = own(next.documents, documentId);
        if (input.documentId && (!doc || doc.projectId !== projectId)) missing();
        if (!doc) doc = { id: documentId, companyId, projectId, title, versions: [], activeVersionId: null };
        const version = { id: id(newId()), version: doc.versions.length + 1, title, objectId: metadata.id, mimeType: metadata.mimeType, size, filename, createdAt: now(), publishedAt: null, withdrawnAt: null };
        doc.title = title; doc.versions.push(version); next.documents[documentId] = doc;
        next.events.push(event(principal, 'document.register', { companyId, projectId, documentId, versionId: version.id })); return { documentId, versionId: version.id, version: version.version };
      }, expected);
    },
    async publishDocument(principal, companyId, documentId, versionId) {
      return companyWrite(principal, companyId, next => {
        const doc = own(next.documents, id(documentId)), version = doc?.versions.find(item => item.id === id(versionId)); if (!doc || !version || version.withdrawnAt != null) missing();
        doc.activeVersionId = version.id; version.publishedAt = now();
        next.events.push(event(principal, 'document.publish', { companyId, projectId: doc.projectId, documentId, versionId })); return viewDocument(doc, version);
      });
    },
    async withdrawDocument(principal, companyId, documentId, versionId) {
      return companyWrite(principal, companyId, next => {
        const doc = own(next.documents, id(documentId)), version = doc?.versions.find(item => item.id === id(versionId)); if (!doc || !version) missing();
        version.withdrawnAt = now(); if (doc.activeVersionId === versionId) doc.activeVersionId = null;
        next.events.push(event(principal, 'document.withdraw', { companyId, projectId: doc.projectId, documentId, versionId })); return { ok: true };
      });
    },
    async listDocuments(principal, companyId, projectId) {
      const { state, a } = await snapshot(companyId, principal); projectAccess(state, a, projectId);
      const result = [];
      for (const doc of Object.values(state.documents).filter(item => item.projectId === projectId)) {
        if (internal(a)) { result.push(managerDocument(doc)); continue; }
        try { const resolved = docAccess(state, a, doc.id); result.push(viewDocument(resolved.doc, resolved.version)); } catch (error) { if (!(error instanceof BusinessError) || error.status !== 404) throw error; }
      }
      return result;
    },
    async getDocument(principal, companyId, documentId) {
      const { state, a } = await snapshot(companyId, principal);
      if (internal(a)) { const doc = own(state.documents, id(documentId)); if (!doc) missing(); projectAccess(state, a, doc.projectId); return managerDocument(doc); }
      const { doc, version } = docAccess(state, a, documentId); return viewDocument(doc, version);
    },
    async validateKnowledgeSources(principal, companyId, projectId, sources) {
      if(!Array.isArray(sources)||sources.length>20) fail(400,'引用资料范围无效。');
      const {state,a,directory}=await snapshot(companyId,principal);projectAccess(state,a,projectId);
      // Validate every citation against one consistent grant/document snapshot,
      // rather than yielding between documents while a partial grant changes.
      for(const source of sources){
        const {doc,version}=docAccess(state,a,id(source.documentId),id(source.versionId));
        if(doc.projectId!==projectId||version.id!==source.versionId||doc.activeVersionId!==source.versionId||!Number.isFinite(version.publishedAt)) fail(409,'引用资料已换版或撤回，请刷新后重新提问。');
      }
      return {companyRevision:state.revision,directoryRevision:directory.revision};
    },
    async documentText(principal, companyId, documentId, versionId) {
      const {state,a}=await snapshot(companyId,principal), {doc,version}=docAccess(state,a,documentId,versionId);
      // Knowledge answers use only current published versions, even for staff.
      if(version.id!==id(versionId)||version.id!==doc.activeVersionId||!Number.isFinite(version.publishedAt)) missing();
      if(typeof documents?.extractObject!=='function') fail(503,'正文解析接口暂不可用。');
      const result=await documents.extractObject(version.objectId,{companyId,projectId:doc.projectId});
      const latest=await snapshot(companyId,principal), current=docAccess(latest.state,latest.a,documentId,versionId);
      if(current.version.id!==versionId||current.doc.activeVersionId!==versionId||current.version.withdrawnAt!=null) missing();
      if(!result||!['ready','no_text','unsupported','parse_error'].includes(result.status)||!Array.isArray(result.segments)||result.segments.length>3000) fail(503,'正文解析结果无效。');
      const segments=result.segments.map(item=>{
        if(typeof item.text!=='string'||item.text.length>1600||!item.location||!['page','slide','paragraph','line','image','converted_page'].includes(item.location.kind)||!Number.isSafeInteger(item.location.number)||item.location.number<1||!Number.isSafeInteger(item.location.part)||item.location.part<1) fail(503,'正文解析结果无效。');
        return {text:item.text,location:clone(item.location)};
      });
      return {metadata:viewDocument(current.doc,current.version),status:result.status,segments};
    },
    async download(principal, companyId, documentId, versionId) {
      const { state, a } = await snapshot(companyId, principal), { doc, version } = docAccess(state, a, documentId, versionId);
      if (a.role === 'customer' && !(a.grant.operations || ['view','download']).includes('download')) missing();
      if (version.id !== id(versionId)) missing();
      if (!documents || typeof documents.readObject !== 'function') fail(503, '私有资料接口尚未连接。');
      const bytes = await documents.readObject(version.objectId, { companyId, projectId: doc.projectId, documentId, versionId });
      if (!Buffer.isBuffer(bytes) || bytes.length !== version.size) fail(503, '资料暂不可用。');
      // Re-check grant, project publication and active document version after IO.
      const latest = await snapshot(companyId, principal), current = docAccess(latest.state, latest.a, documentId, versionId);
      if (latest.a.role === 'customer' && !(latest.a.grant.operations || ['view','download']).includes('download')) missing();
      if (current.version.id !== versionId) missing();
      return { metadata: viewDocument(current.doc, current.version), bytes };
    },
    async createDelivery(principal, companyId, projectId, input) {
      object(input); rejectFields(input, ['contactId', 'documents', 'requestId']);
      const contact = await authoritative('getContact', id(input.contactId));
      const selected = expectedDocumentVersions(input.documents);
      if (!selected.length || selected.length > 20) fail(400, '请选择1至20份已发布资料。');
      const requestId = id(input.requestId);
      return companyWrite(principal, companyId, (next, a, directory) => {
        const customer = recipientAccess(directory, contact, companyId);
        const project = projectAccess(next, customer, projectId);
        const documents = selected.map(source => {
          const { doc, version } = docAccess(next, customer, source.documentId, source.versionId);
          if (doc.projectId !== projectId || version.id !== source.versionId || doc.activeVersionId !== source.versionId) fail(409, '资料版本已变更或客户未获授权，请刷新重试。');
          return { documentId: doc.id, versionId: version.id, filename: version.filename, title: version.title, version: version.version };
        });
        next.deliveries ||= {};
        const existing = Object.values(next.deliveries).find(item => item.requestId === requestId && item.actorId === subject(principal));
        if (existing) {
          if (existing.contactId !== contact.id || existing.projectId !== projectId || JSON.stringify(existing.documents.map(({documentId,versionId})=>({documentId,versionId}))) !== JSON.stringify(selected)) fail(409, '交付请求标识已使用。');
          return deliveryView(deliveryAccess(next, customer, existing.id, {identityId:contact.identityId}), a);
        }
        if (Object.keys(next.deliveries).length >= 1000) fail(409, '交付记录已达上限，请联系管理员归档。');
        const deliveryId = id(newId());
        const link = 'https://crm.cnps.ai/crm/workspace?companyId=' + encodeURIComponent(companyId) + '&deliveryId=' + encodeURIComponent(deliveryId);
        const message = '您好，贵司项目「' + project.publication.project.title + '」交付资料已更新，共' + documents.length + '份。\n' + documents.map(item => '• ' + item.filename + '（v' + item.version + '）').join('\n') + '\n请访问：' + link + '\n使用您已获授权的手机号获取验证码登录查看。';
        const delivery = { id:deliveryId, companyId, projectId, contactId:contact.id, recipientId:contact.identityId, actorId:subject(principal), requestId, createdAt:now(), documents, link, message, copiedAt:null, viewedAt:null, lastViewedAt:null, viewCount:0, downloads:[], sms:{status:'not_sent'} };
        next.deliveries[deliveryId] = delivery;
        next.events.push(event(principal, 'delivery.create', {companyId, projectId, deliveryId, contactId:contact.id}));
        return deliveryView(delivery, a);
      });
    },
    async listDeliveries(principal, companyId, projectId) {
      const {state,a} = await snapshot(companyId, principal); projectAccess(state,a,projectId);
      return Object.values(state.deliveries || {}).filter(item => item.projectId === projectId).flatMap(item => {
        if(internal(a)) {const activity=Object.values(state.proposalActivity||{}).filter(r=>r.projectId===projectId&&r.recipientId===item.recipientId).map(({recipientId,eventIds,...r})=>clone(r));return [{...deliveryView(item,a),proposalActivity:activity}];}
        try {return [deliveryView(deliveryAccess(state,a,item.id,principal),a)];} catch(error) {if(error instanceof BusinessError && error.status === 404)return [];throw error;}
      }).sort((a,b)=>b.createdAt-a.createdAt);
    },
    async getDelivery(principal, companyId, deliveryId) {
      const {state,a}=await snapshot(companyId,principal);
      return deliveryView(deliveryAccess(state,a,deliveryId,principal),a);
    },
    async recordDelivery(principal, companyId, deliveryId, kind, documentId, versionId) {
      if(!['view','copy','download'].includes(kind)) fail(400,'记录类型无效。');
      return companyWrite(principal,companyId,(next,a)=>{
        const delivery=deliveryAccess(next,a,deliveryId,principal);
        if(kind==='copy'){if(!internal(a))missing();delivery.copiedAt=now();}
        else if(a.role==='customer'){
          if(kind==='view'){delivery.viewedAt ||= now();delivery.lastViewedAt=now();delivery.viewCount++;}
          else {if(!delivery.documents.some(d=>d.documentId===documentId&&d.versionId===versionId))missing();if(!delivery.downloads.some(d=>d.documentId===documentId&&d.versionId===versionId))delivery.downloads.push({documentId,versionId,at:now()});}
        }
        return deliveryView(delivery,a);
      },{customer:kind!=='copy'});
    },
    async bindDeliveryWecom(principal,companyId,contactId,input){
      object(input);rejectFields(input,['externalUserId','senderUserId']);
      const initial=await snapshot(companyId,principal);manage(initial.directory,principal,companyId);
      const contact=await authoritative('getContact',id(contactId));recipientAccess(initial.directory,contact,companyId);
      if(!channels?.wecom?.configured)fail(503,'企业微信客户联系应用尚未授权。');
      const binding={externalUserId:id(input.externalUserId),senderUserId:id(input.senderUserId),recipientId:contact.identityId};
      const phone=normalizePhone(contact.phone);if(!phone||!await channels.wecom.verifyBinding(binding,phone))fail(409,'企业微信客户手机号备注或跟进成员与CRM联系人不匹配，不能建立通知绑定。');
      return companyWrite(principal,companyId,(next,a,directory)=>{
        recipientAccess(directory,contact,companyId);next.notificationBindings ||= {};next.notificationBindings[contact.id]=binding;
        next.events.push(event(principal,'delivery.wecom-bind',{companyId,contactId}));return {ok:true};
      },{expectedDirectoryRevision:initial.directory.revision,expectedCompanyRevision:initial.state.revision});
    },
    async sendDeliveryNotification(principal,companyId,deliveryId,channel){
      if(!['email','wecom'].includes(channel))fail(400,'通知渠道无效。');
      const initial=await snapshot(companyId,principal);manage(initial.directory,principal,companyId);
      const delivery=deliveryAccess(initial.state,initial.a,deliveryId,principal);
      const contact=await authoritative('getContact',delivery.contactId);
      if(contact.identityId!==delivery.recipientId)missing();
      deliveryAccess(initial.state,recipientAccess(initial.directory,contact,companyId),deliveryId,{identityId:contact.identityId});
      if(!channels?.[channel]?.configured)return {status:'unavailable',message:channel==='email'?'邮件通道尚未配置。':'企业微信客户联系应用尚未授权。'};
      const binding=initial.state.notificationBindings?.[contact.id];
      if(channel==='wecom'&&(!binding||binding.recipientId!==contact.identityId))fail(409,'请先为该客户绑定并核验企业微信客户ID与跟进成员。');
      const target=channel==='email'?String(contact.email||'').trim().toLowerCase():normalizePhone(contact.phone);
      if(channel==='email'&&!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(target))fail(400,'该联系人尚未填写有效邮箱；请先核实并保存到CRM。');
      if(!target)fail(400,'客户联系方式无效。');
      const targetDigest=digest(env.CNPS_PROPOSAL_SECRET,'delivery-'+channel,target),attempt=id(newId());
      const blocked=['sending','submitted','unknown','delivered','sent','pending_member'];
      const reservation=await companyWrite(principal,companyId,(next,a,directory)=>{
        const current=deliveryAccess(next,recipientAccess(directory,contact,companyId),deliveryId,{identityId:contact.identityId});
        if(blocked.includes(current[channel]?.status))return false;
        if(current[channel]?.attemptedAt&&now()-current[channel].attemptedAt<60000)fail(429,'重试通知间隔至少60秒。');
        current[channel]={status:'sending',attempt,attemptedAt:now(),targetDigest,...(binding?{binding:clone(binding)}:{})};return true;
      },{expectedDirectoryRevision:initial.directory.revision,expectedCompanyRevision:initial.state.revision});
      if(!reservation)return {status:delivery[channel].status,message:'此渠道已提交或结果待核实，未重复发送。'};
      let result;
      try{
        const latest=await snapshot(companyId,principal);manage(latest.directory,principal,companyId);
        const fresh=await authoritative('getContact',contact.id);if(fresh.identityId!==delivery.recipientId)missing();
        const freshTarget=channel==='email'?String(fresh.email||'').trim().toLowerCase():normalizePhone(fresh.phone);
        if(freshTarget!==target)fail(409,'联系人信息已变更。');
        deliveryAccess(latest.state,recipientAccess(latest.directory,fresh,companyId),deliveryId,{identityId:fresh.identityId});
        if(channel==='wecom'&&JSON.stringify(latest.state.notificationBindings?.[contact.id])!==JSON.stringify(binding))fail(409,'企业微信绑定已变更。');
        result=await channels[channel].send({target,phone:target,binding,link:delivery.link,deliveryId,attempt});
      }catch(error){result={status:error instanceof BusinessError?'cancelled':'unknown'};}
      if(!['submitted','pending_member','failed','cancelled','unknown'].includes(result?.status))result={status:'unknown'};
      await companyWrite(principal,companyId,next=>{const current=own(next.deliveries,deliveryId);if(current?.[channel]?.attempt===attempt){current[channel]={...current[channel],...result,updatedAt:now()};next.events.push(event(principal,'delivery.'+channel,{companyId,deliveryId,status:result.status}));}});
      return {status:result.status,message:result.status==='submitted'?'邮件已被供应商接受；需查询回执确认投递。':result.status==='pending_member'?'企业微信任务已创建，等待跟进成员在企业微信中确认发送。':result.status==='unknown'?'通知结果待核实，未自动重试。':'通知未提交，请检查联系方式、授权和通道。'};
    },
    async syncDeliveryNotification(principal,companyId,deliveryId,channel){
      if(!['email','wecom','sms'].includes(channel))fail(400,'通知渠道无效。');
      const adapter=channel==='sms'?notifications:channels?.[channel];
      const initial=await snapshot(companyId,principal);manage(initial.directory,principal,companyId);
      const delivery=deliveryAccess(initial.state,initial.a,deliveryId,principal),record=delivery[channel];
      if(!record||!['submitted','pending_member'].includes(record.status)||!adapter?.configured||typeof adapter?.receipt!=='function')return {status:record?.status||'not_sent',message:'当前没有可查询的通知回执。'};
      if(record.checkedAt&&now()-record.checkedAt<30000)fail(429,'回执查询间隔至少30秒。');
      const contact=await authoritative('getContact',delivery.contactId);if(contact.identityId!==delivery.recipientId)missing();
      deliveryAccess(initial.state,recipientAccess(initial.directory,contact,companyId),deliveryId,{identityId:contact.identityId});
      const target=channel==='email'?String(contact.email||'').trim().toLowerCase():normalizePhone(contact.phone);
      if(digest(env.CNPS_PROPOSAL_SECRET,'delivery-'+channel,target)!==record.targetDigest)fail(409,'联系人信息已变更，不能归属原通知回执。');
      if(channel==='wecom'&&JSON.stringify(initial.state.notificationBindings?.[contact.id])!==JSON.stringify(record.binding))fail(409,'企业微信绑定已变更。');
      const result=await adapter.receipt({target,binding:record.binding,record});
      const fresh=await authoritative('getContact',contact.id);const freshTarget=channel==='email'?String(fresh.email||'').trim().toLowerCase():normalizePhone(fresh.phone);if(fresh.identityId!==contact.identityId||fresh.companyId!==companyId||freshTarget!==target)fail(409,'联系人信息已变更，回执未归属。');
      const allowed=channel!=='wecom'?['submitted','delivered','delivery_failed']:['pending_member','sent','delivery_failed'];if(!allowed.includes(result?.status))fail(503,'回执结果无效。');
      await companyWrite(principal,companyId,(next,a,directory)=>{
        deliveryAccess(next,recipientAccess(directory,contact,companyId),deliveryId,{identityId:contact.identityId});const current=next.deliveries[deliveryId];
        if(current[channel]?.attempt!==record.attempt)fail(409,'通知已变更。');current[channel]={...current[channel],...result,checkedAt:now()};next.events.push(event(principal,'delivery.'+channel+'-receipt',{companyId,deliveryId,status:result.status}));
      },{expectedDirectoryRevision:initial.directory.revision,expectedCompanyRevision:initial.state.revision});
      return {status:result.status,message:result.status==='delivered'?(channel==='sms'?'运营商回执确认手机送达，不代表客户已查看资料。':'收件邮件服务器已接受，不代表客户已阅读。'):result.status==='sent'?'企业微信成员已执行发送，不代表客户已阅读。':result.status==='delivery_failed'?'供应商回执显示投递失败。':'仍在等待投递或成员发送回执。'};
    },
    async sendDeliverySms(principal, companyId, deliveryId) {
      const initial=await snapshot(companyId,principal);manage(initial.directory,principal,companyId);
      const delivery=deliveryAccess(initial.state,initial.a,deliveryId,principal);
      const contact=await authoritative('getContact',delivery.contactId);
      if(contact.identityId!==delivery.recipientId)missing();
      deliveryAccess(initial.state,recipientAccess(initial.directory,contact,companyId),deliveryId,{identityId:contact.identityId});
      if(!notifications?.configured) return {status:'unavailable',message:'交付通知短信尚未配置已审核的通知模板及发送权限；微信文案和链接可正常使用。'};
      const phone=normalizePhone(contact.phone);if(!phone)fail(400,'客户没有有效的中国手机号。');
      const attempt=id(newId());
      const reservation=await companyWrite(principal,companyId,(next,a,directory)=>{
        const current=deliveryAccess(next,recipientAccess(directory,contact,companyId),deliveryId,{identityId:contact.identityId});
        if(['submitted','sending','unknown','delivered'].includes(current.sms.status)) return null;
        const month=new Date(now()+8*3600000).toISOString().slice(0,7);next.deliverySmsUsage ||= {};
        if((next.deliverySmsUsage[month]||0)>=100)fail(429,'本公司每月交付短信限额100条。');
        const last=Object.values(next.deliveries||{}).filter(d=>d.contactId===contact.id&&d.sms?.attemptedAt).reduce((m,d)=>Math.max(m,d.sms.attemptedAt),0);
        if(now()-last<60000)fail(429,'同一客户通知间隔至少60秒。');
        next.deliverySmsUsage[month]=(next.deliverySmsUsage[month]||0)+1;
        current.sms={status:'sending',attempt,attemptedAt:now(),targetDigest:digest(env.CNPS_PROPOSAL_SECRET,'delivery-sms',phone)};return true;
      },{expectedDirectoryRevision:initial.directory.revision,expectedCompanyRevision:initial.state.revision});
      if(!reservation)return {status:delivery.sms.status,message:'此交付已提交或结果待核实，未重复发送。'};
      let result;
      try {
        // Revalidate the complete recipient and fixed versions immediately before external IO.
        const latest=await snapshot(companyId,principal);manage(latest.directory,principal,companyId);
        const fresh=await authoritative('getContact',contact.id);if(fresh.identityId!==delivery.recipientId||normalizePhone(fresh.phone)!==phone)missing();
        deliveryAccess(latest.state,recipientAccess(latest.directory,fresh,companyId),deliveryId,{identityId:fresh.identityId});
        result=await notifications.send(phone,deliveryId);
      } catch(error) {result={status:error instanceof BusinessError?'cancelled':'unknown'};}
      if(!['submitted','failed','cancelled','unknown'].includes(result?.status))result={status:'unknown'};
      await companyWrite(principal,companyId,next=>{const current=own(next.deliveries,deliveryId);if(current?.sms.attempt===attempt){current.sms={...current.sms,...result,updatedAt:now()};next.events.push(event(principal,'delivery.sms',{companyId,deliveryId,status:result.status}));}});
      return {status:result.status,message:result.status==='submitted'?'短信已提交至供应商（不代表手机已送达）。':result.status==='unknown'?'短信结果待核实，为避免重复通知不自动重试。':'短信未提交，请检查通道或客户授权。'};
    },
    async search(principal, companyId, query) {
      const needle = text(query, 200).toLocaleLowerCase(); if (needle.length < 2) fail(400, '搜索内容至少需要两个字符。');
      const initial = await snapshot(companyId, principal);
      const projects = await service.listProjects(principal, companyId), results = [];
      for (const project of projects) {
        if (`${project.title} ${project.objective} ${project.scope}`.toLocaleLowerCase().includes(needle)) results.push({ type: 'project', id: project.id, projectId: project.id, title: project.title });
        const records = await service.listRecords(principal, companyId, project.id);
        for (const record of records) if (`${record.title} ${record.description}`.toLocaleLowerCase().includes(needle)) results.push({ type: record.type, id: record.id, projectId: project.id, title: record.title });
        const docs = await service.listDocuments(principal, companyId, project.id);
        for (const doc of docs) if(`${doc.title} ${doc.filename}`.toLocaleLowerCase().includes(needle)) results.push({ type: 'document', id: doc.id, projectId: project.id, title: doc.title });
      }
      // If revoked during search, the final identity/company check fails closed.
      const latest = await snapshot(companyId, principal);
      if (latest.directory.revision !== initial.directory.revision || latest.state.revision !== initial.state.revision) fail(409, '资料或权限已变更，请刷新后重试。');
      return results.slice(0, 200);
    }
  };
  return service;
}
