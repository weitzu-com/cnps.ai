import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createBusinessService } from "../../server/crm-business-service.mjs";
import { createAccessService } from "../../server/crm-access-service.mjs";
import {
  emptyDirectory,
  emptyCompany,
} from "../../server/crm-business-store.mjs";
const copy = (v) => structuredClone(v);
export async function fixture() {
  let d = emptyDirectory(),
    seq = 0,
    time = Date.UTC(2026, 9, 14),
    raceCommit,
    raceRead,
    raceCreate;
  const states = new Map(),
    audit = [],
    objects = new Map();
  const store = {
    async getDirectory() {
      return copy(d);
    },
    async getCompany(c) {
      return copy(states.get(c) || emptyCompany(c));
    },
    async commitDirectory(r, n) {
      if (d.revision !== r) return false;
      d = copy(n);
      return true;
    },
    async commitCompany(c, dr, r, n) {
      if (raceCommit) {
        const f = raceCommit;
        raceCommit = null;
        await f();
      }
      if (d.revision !== dr || (states.get(c)?.revision || 0) !== r)
        return false;
      states.set(c, copy(n));
      return true;
    },
    async recordAccess(e) {
      audit.push(copy(e));
    },
  };
  const companies = new Map(
      ["company-A", "company-B", "partner-org", "other-org"].map((id) => [
        id,
        { id, name: id, active: true },
      ]),
    ),
    contacts = new Map(),
    staff = new Map();
  const twenty = {
    async getCompany(i) {
      return copy(companies.get(i));
    },
    async listCompanies() {
      return [...companies.values()].map(copy);
    },
    async getContact(i) {
      return copy(contacts.get(i));
    },
    async getManager(i) {
      return copy(staff.get(i));
    },
    async listContacts(c) {
      return [...contacts.values()].filter((v) => v.companyId === c).map(copy);
    },
  };
  const documents = {
    async createObject(input) {
      const o = {
        id: "object-" + ++seq,
        companyId: input.companyId,
        projectId: input.projectId,
        mimeType: input.mimeType,
        filename: input.filename,
        size: Buffer.from(input.base64, "base64").length,
      };
      objects.set(o.id, { ...o, bytes: Buffer.from(input.base64, "base64") });
      if (raceCreate) {
        const f = raceCreate;
        raceCreate = null;
        await f();
      }
      return copy(o);
    },
    async getObject(i) {
      const o = objects.get(i);
      return o ? { ...o, bytes: undefined } : null;
    },
    async readObject(i, c) {
      const o = objects.get(i);
      assert.equal(o.companyId, c.companyId);
      assert.equal(o.projectId, c.projectId);
      if (raceRead) {
        const f = raceRead;
        raceRead = null;
        await f();
      }
      return Buffer.from(o.bytes);
    },
  };
  const env = {
    CNPS_PROPOSAL_SECRET: randomBytes(32).toString("hex"),
    CNPS_CRM_ADMIN_PHONE: "18700001111",
  };
  const base = createBusinessService({
    env,
    store,
    twenty,
    documents,
    now: () => time,
    newId: () => "id-" + ++seq,
  });
  const service = createAccessService({
    base,
    store,
    twenty,
    documents,
    env,
    now: () => time,
    newId: () => "id-" + ++seq,
  });
  const actor = (phone, role) => ({
    identityId: base.subjectForPhone(phone),
    phone,
    identity: { role },
  });
  const admin = actor(env.CNPS_CRM_ADMIN_PHONE, "admin"),
    manager = actor("18800002222", "sales_manager"),
    customer = actor("18900003333", "customer"),
    partner = actor("18600004444", "partner"),
    outsider = actor("18500005555", "partner");
  staff.set("staff", {
    id: "staff",
    identityId: manager.identityId,
    active: true,
  });
  contacts.set("client", {
    id: "client",
    identityId: customer.identityId,
    companyId: "company-A",
    active: true,
  });
  contacts.set("partner", {
    id: "partner",
    identityId: partner.identityId,
    companyId: "partner-org",
    active: true,
  });
  contacts.set("other", {
    id: "other",
    identityId: outsider.identityId,
    companyId: "other-org",
    active: true,
  });
  await service.registerCompany(admin, "company-A");
  await service.registerCompany(admin, "company-B");
  await service.assignManager(admin, "staff", ["company-A"]);
  const p = await service.createProject(manager, "company-A", {
      title: "Authorized project",
      budget: 9000,
    }),
    otherProject = await service.createProject(admin, "company-B", {
      title: "Other project",
    });
  const task = await service.createRecord(manager, "company-A", p.id, "task", {
      title: "Assigned task",
      description: "Task brief",
      clientVisible: true,
    }),
    privateTask = await service.createRecord(
      manager,
      "company-A",
      p.id,
      "task",
      { title: "Private task" },
    );
  await service.publishProject(manager, "company-A", p.id);
  async function addDoc(title) {
    const doc = await service.uploadDocument(manager, "company-A", p.id, {
      title,
      filename: "file.txt",
      mimeType: "text/plain",
      base64: Buffer.from(title).toString("base64"),
    });
    await service.publishDocument(
      manager,
      "company-A",
      doc.documentId,
      doc.versionId,
    );
    return doc;
  }
  const doc = await addDoc("Collaboration file"),
    sensitive = await addDoc("Private quote");
  await service.setDocumentClassification(
    admin,
    "company-A",
    doc.documentId,
    "collaboration",
  );
  await service.setDocumentClassification(
    admin,
    "company-A",
    sensitive.documentId,
    "commercial",
  );
  await service.grantMember(manager, "company-A", {
    contactId: "client",
    projectIds: [p.id],
    documentIds: [doc.documentId],
    operations: ["view", "download"],
  });
  await service.registerPartnerOrganization(admin, "partner-org");
  const g = await service.grantPartner(manager, "company-A", {
    contactId: "partner",
    projectId: p.id,
    taskIds: [task.id],
    documentIds: [doc.documentId],
    operations: ["view", "download", "submit", "progress"],
  });
  partner.contextId = "partner:" + g.id;
  return {
    store,
    states,
    service,
    base,
    env,
    admin,
    manager,
    customer,
    partner,
    outsider,
    twenty,
    documents,
    companies,
    contacts,
    staff,
    p,
    task,
    privateTask,
    doc,
    sensitive,
    g,
    otherProject,
    audit,
    addDoc,
    advance: (ms) => (time += ms),
    onRead: (f) => (raceRead = f),
    onCreate: (f) => (raceCreate = f),
    onCommit: (f) => (raceCommit = f),
    mutateDirectory: (f) => f(d),
  };
}
