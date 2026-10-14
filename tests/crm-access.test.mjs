import { fixture } from "./helpers/crm-access-fixture.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  createBusinessService,
  BusinessError,
} from "../server/crm-business-service.mjs";
import { createAccessService } from "../server/crm-access-service.mjs";
import { emptyDirectory, emptyCompany } from "../server/crm-business-store.mjs";
import { createCrmAuthHandler } from "../server/crm-auth-handler.mjs";
import { createCrmProposalHandler } from "../server/crm-proposal-handler.mjs";
import { createBusinessHandler } from "../server/crm-business-handler.mjs";
import {
  boundaryDecision,
  guardPrivateRequest,
} from "../server/crm-boundary.mjs";
import middleware from "../middleware.js";
import { planProposalMigration } from "../scripts/crm-access-migration.mjs";
import { proposalBinding } from "../server/proposal-crm.mjs";
const copy = (v) => structuredClone(v);
const status = (n) => (e) => e instanceof BusinessError && e.status === n;

const upload = {
  title: "Partner delivery",
  filename: "delivery.txt",
  mimeType: "text/plain",
  base64: Buffer.from("Private submitted bytes").toString("base64"),
};
test("partner receives only explicit project/task/document DTOs and cannot discover company/other-party/internal data", async () => {
  const h = await fixture(),
    { service: s, partner: p } = h;
  assert.equal((await s.listCompanies(p)).length, 1);
  assert.deepEqual(
    (await s.listProjects(p, "company-A")).map((p) => p.id),
    [h.p.id],
  );
  const project = await s.getProject(p, "company-A", h.p.id);
  assert.equal(project.budget, undefined);
  assert.equal(project.objective, undefined);
  assert.deepEqual(
    (await s.listRecords(p, "company-A", h.p.id)).map((t) => t.id),
    [h.task.id],
  );
  assert.deepEqual(
    (await s.listDocuments(p, "company-A", h.p.id)).map((d) => d.id),
    [h.doc.documentId],
  );
  for (const call of [
    () => s.getProject(p, "company-B", h.otherProject.id),
    () => s.getRecord(p, "company-A", h.privateTask.id),
    () => s.getDocument(p, "company-A", h.sensitive.documentId),
    () => s.listContacts(p, "company-A"),
    () => s.listMembers(p, "company-A"),
    () => s.listEvents(p, "company-A"),
    () => s.listStaff(p),
    () => s.authorizeAi(p, "company-A"),
  ])
    await assert.rejects(call, status(404));
  assert.equal(
    JSON.stringify(await s.search(p, "company-A", "Private")).includes(
      "Private",
    ),
    false,
  );
  assert.equal(
    JSON.stringify(
      await s.getDocument(p, "company-A", h.doc.documentId),
    ).includes("objectId"),
    false,
  );
});
test("unknown roles and partner contexts cannot enter any internal CRUD, publication, approval, assignment or delivery path", async () => {
  const h = await fixture(),
    s = h.service,
    p = h.partner;
  const calls = [
    () => s.createProject(p, "company-A", { title: "No" }),
    () => s.updateProject(p, "company-A", h.p.id, { title: "No" }),
    () => s.updateRecords(p, "company-A", []),
    () => s.grantMember(p, "company-A", {}),
    () => s.grantPartner(p, "company-A", {}),
    () => s.assignManager(p, "staff", []),
    () => s.publishDocument(p, "company-A", h.doc.documentId, h.doc.versionId),
    () => s.publishProject(p, "company-A", h.p.id),
    () => s.decide(p, "company-A", h.task.id, {}),
    () => s.createDelivery(p, "company-A", h.p.id, {}),
    () => s.documentText(p, "company-A", h.doc.documentId, h.doc.versionId),
  ];
  for (const call of calls) await assert.rejects(call, status(404));
  await assert.rejects(
    s.getProject(
      { ...p, contextId: undefined, identity: { role: "unknown" } },
      "company-A",
      h.p.id,
    ),
    status(404),
  );
  await assert.rejects(
    h.base.getProject(
      { ...p, identity: { role: "unknown" } },
      "company-A",
      h.p.id,
    ),
    status(404),
  );
});
test("new customer grants default to selected view-only; future resources and downloads require explicit selection", async () => {
  const h = await fixture();
  await h.service.grantMember(h.manager, "company-A", {
    contactId: "client",
    projectIds: [h.p.id],
    documentIds: [h.doc.documentId],
  });
  await assert.rejects(
    h.service.download(
      h.customer,
      "company-A",
      h.doc.documentId,
      h.doc.versionId,
    ),
    status(404),
  );
  await assert.rejects(
    h.service.grantMember(h.manager, "company-A", {
      contactId: "client",
      projectScope: "all",
      documentScope: "all",
    }),
    status(400),
  );
  await h.service.grantMember(h.manager, "company-A", {
    contactId: "client",
    projectIds: [h.p.id],
    documentIds: [h.doc.documentId],
    operations: ["view", "download"],
  });
  assert.equal(
    (
      await h.service.download(
        h.customer,
        "company-A",
        h.doc.documentId,
        h.doc.versionId,
      )
    ).bytes.toString(),
    "Collaboration file",
  );
});
test("managers cannot discover arbitrary organizations or assign contacts outside the administrator partner catalog", async () => {
  const h = await fixture();
  assert.deepEqual(
    (await h.service.listPartnerOrganizations(h.manager, "company-A")).map(
      (o) => o.id,
    ),
    ["partner-org"],
  );
  await assert.rejects(
    h.service.registerPartnerOrganization(h.manager, "other-org"),
    status(404),
  );
  await assert.rejects(
    h.service.grantPartner(h.manager, "company-A", {
      contactId: "other",
      projectId: h.p.id,
    }),
    status(400),
  );
  await assert.rejects(
    h.service.grantPartner(h.manager, "company-B", {
      contactId: "partner",
      projectId: h.otherProject.id,
    }),
    status(404),
  );
  await assert.rejects(
    h.service.grantPartner(h.manager, "company-A", {
      contactId: "partner",
      projectId: h.p.id,
      documentIds: [h.sensitive.documentId],
    }),
    status(400),
  );
});
test("sensitive access requires admin approval, binds file and grant versions, and revocation takes effect for old links", async () => {
  const h = await fixture(),
    s = h.service;
  const request = await s.requestSensitiveAccess(h.manager, "company-A", {
    grantId: h.g.id,
    documentId: h.sensitive.documentId,
    reason: "Review supplier deliverable pricing",
  });
  await assert.rejects(
    s.decideSensitiveAccess(h.manager, "company-A", request.id, "approve"),
    status(404),
  );
  await assert.rejects(
    s.download(
      h.partner,
      "company-A",
      h.sensitive.documentId,
      h.sensitive.versionId,
    ),
    status(404),
  );
  await s.decideSensitiveAccess(h.admin, "company-A", request.id, "approve");
  assert.equal(
    (
      await s.download(
        h.partner,
        "company-A",
        h.sensitive.documentId,
        h.sensitive.versionId,
      )
    ).bytes.toString(),
    "Private quote",
  );
  await s.decideSensitiveAccess(h.admin, "company-A", request.id, "revoke");
  await assert.rejects(
    s.getDocument(h.partner, "company-A", h.sensitive.documentId),
    status(404),
  );
});
test("a new sensitive file version cannot reuse approval for an earlier version", async () => {
  const h = await fixture(),
    s = h.service,
    r = await s.requestSensitiveAccess(h.manager, "company-A", {
      grantId: h.g.id,
      documentId: h.sensitive.documentId,
      reason: "Review",
    });
  await s.decideSensitiveAccess(h.admin, "company-A", r.id, "approve");
  const v = await s.uploadDocument(h.manager, "company-A", h.p.id, {
    ...upload,
    documentId: h.sensitive.documentId,
  });
  await s.publishDocument(h.manager, "company-A", v.documentId, v.versionId);
  await assert.rejects(
    s.getDocument(h.partner, "company-A", v.documentId),
    status(404),
  );
  await assert.rejects(
    s.download(h.partner, "company-A", v.documentId, h.sensitive.versionId),
    status(404),
  );
});
test("partner submissions stay private and pending; review atomically creates an unpublished internal draft", async () => {
  const h = await fixture(),
    s = h.service,
    submission = await s.submitPartnerDelivery(h.partner, "company-A", upload);
  assert.equal(submission.status, "pending");
  assert.equal(submission.objectId, undefined);
  assert.equal(
    (await s.listPartnerSubmissions(h.partner, "company-A", h.p.id)).length,
    1,
  );
  assert.equal(
    (await s.listDocuments(h.customer, "company-A", h.p.id)).length,
    1,
  );
  await assert.rejects(
    s.reviewPartnerSubmission(h.partner, "company-A", submission.id, {
      decision: "approve",
    }),
    status(404),
  );
  const reviewed = await s.reviewPartnerSubmission(
    h.manager,
    "company-A",
    submission.id,
    { decision: "approve", comment: "Reviewed" },
  );
  assert.equal(reviewed.status, "approved");
  const state = await h.store.getCompany("company-A");
  assert.equal(state.documents[reviewed.documentId].activeVersionId, null);
  assert.equal(state.documents[reviewed.documentId].versions.length, 1);
  await assert.rejects(
    s.getDocument(h.customer, "company-A", reviewed.documentId),
    status(404),
  );
  await assert.rejects(
    s.getDocument(h.partner, "company-A", reviewed.documentId),
    status(404),
  );
  await assert.rejects(
    s.reviewPartnerSubmission(h.manager, "company-A", submission.id, {
      decision: "approve",
    }),
    status(409),
  );
});
test("progress belongs to the selected grant and cannot mutate the official task or another assigned scope", async () => {
  const h = await fixture();
  await h.service.partnerUpdateProgress(h.partner, "company-A", h.task.id, {
    status: "done",
    comment: "Submitted for review",
  });
  assert.equal(
    (await h.service.getRecord(h.partner, "company-A", h.task.id)).progress
      .status,
    "done",
  );
  assert.equal(
    (await h.base.getRecord(h.manager, "company-A", h.task.id)).status,
    "todo",
  );
  await assert.rejects(
    h.service.partnerUpdateProgress(h.partner, "company-A", h.privateTask.id, {
      status: "done",
    }),
    status(404),
  );
  await assert.rejects(
    h.service.partnerUpdateProgress(h.partner, "company-A", h.task.id, {
      status: "done",
      role: "admin",
    }),
    status(400),
  );
});
test("revocation during file IO, native contact changes, expiry and concurrent uploads all fail closed", async () => {
  const h = await fixture();
  h.onRead(() => h.service.revokePartner(h.manager, "company-A", h.g.id));
  await assert.rejects(
    h.service.download(
      h.partner,
      "company-A",
      h.doc.documentId,
      h.doc.versionId,
    ),
    status(404),
  );
  const h2 = await fixture();
  h2.onCreate(() => h2.service.revokePartner(h2.manager, "company-A", h2.g.id));
  await assert.rejects(
    h2.service.submitPartnerDelivery(h2.partner, "company-A", upload),
    status(404),
  );
  assert.deepEqual(
    (await h2.store.getCompany("company-A")).partnerSubmissions,
    undefined,
  );
  const h3 = await fixture();
  h3.contacts.get("partner").companyId = "other-org";
  await assert.rejects(
    h3.service.listProjects(h3.partner, "company-A"),
    status(404),
  );
  const h4 = await fixture();
  h4.mutateDirectory((d) => {
    d.partnerGrants[h4.g.id].expiresAt = 1;
  });
  await assert.rejects(
    h4.service.listProjects(h4.partner, "company-A"),
    status(404),
  );
});
test("multiple partner contexts never union resources; switching context cannot elevate partner to manager", async () => {
  const h = await fixture(),
    s = h.service;
  const second = await s.grantPartner(h.manager, "company-A", {
    contactId: "partner",
    projectId: h.p.id,
    taskIds: [h.privateTask.id],
  });
  assert.deepEqual(
    (await s.listRecords(h.partner, "company-A", h.p.id)).map((t) => t.id),
    [h.task.id],
  );
  const secondActor = { ...h.partner, contextId: "partner:" + second.id };
  assert.deepEqual(
    (await s.listRecords(secondActor, "company-A", h.p.id)).map((t) => t.id),
    [h.privateTask.id],
  );
  await assert.rejects(
    s.download(secondActor, "company-A", h.doc.documentId, h.doc.versionId),
    status(404),
  );
  await assert.rejects(
    s.getProject(
      { ...h.partner, contextId: "member:company-A:sales_manager" },
      "company-A",
      h.p.id,
    ),
    status(404),
  );
});
test("independent proposal grants do not grant company/project membership; disabled identities lose all scopes", async () => {
  const h = await fixture(),
    s = h.service;
  await s.grantProposal(h.admin, {
    phone: h.outsider.phone,
    proposalId: "wasion-web-v1",
    assetIds: ["pdf"],
    operations: ["view", "download"],
  });
  const p = { ...h.outsider, identity: { role: "proposal_viewer" } },
    binding = { id: "wasion-web-v1", documents: { pdf: {}, pptx: {} } };
  assert.equal(
    (await s.authorizeProposal(p, binding, "pdf")).operations.includes(
      "download",
    ),
    true,
  );
  await assert.rejects(s.authorizeProposal(p, binding, "pptx"), status(404));
  assert.deepEqual(await s.listCompanies(p), []);
  await assert.rejects(s.getProject(p, "company-A", h.p.id), status(404));
  await s.setIdentityStatus(h.admin, p.identityId, true);
  await assert.rejects(s.authorizeProposal(p, binding, "pdf"), status(404));
});
test("audit writes do not alter directory revisions or conflict with parallel workspace reads", async () => {
  const h = await fixture(),
    r = (await h.store.getDirectory()).revision;
  await Promise.all(
    Array.from({ length: 5 }, () =>
      h.service.auditAccess(h.customer, "read", "company-A", 200),
    ),
  );
  assert.equal((await h.store.getDirectory()).revision, r);
  assert.equal(h.audit.length, 5);
  assert.ok(
    h.audit.every((e) => !JSON.stringify(e).includes(h.customer.phone)),
  );
});
function response() {
  let output;
  const headers = {};
  return {
    headers,
    setHeader(k, v) {
      headers[k.toLowerCase()] = v;
    },
    end(b) {
      output = b;
    },
    get body() {
      return output;
    },
  };
}
test("host boundary blocks API aliases, non-CRM hosts, preview private routes and CRM public marketing routes", async () => {
  for (const host of [
    "www.cnps.ai",
    "cnps.ai",
    "cnps-ai.vercel.app",
    "evil.example",
  ])
    for (const path of [
      "/api/crm",
      "/api/crm-workspace",
      "/api/w",
      "/api/crm-workspace-page",
    ]) {
      const res = response();
      assert.equal(
        guardPrivateRequest(
          { method: "GET", url: path, headers: { host } },
          res,
          { VERCEL_ENV: "production" },
        ),
        true,
      );
      assert.equal(res.statusCode, 404);
      assert.equal(
        res.headers["cache-control"],
        "private, no-store, max-age=0",
      );
    }
  assert.equal(boundaryDecision("crm.cnps.ai", "/en", "GET").status, 404);
  assert.equal(
    boundaryDecision("crm.cnps.ai", "/api/crm-inquiry", "POST").status,
    404,
  );
  assert.equal(
    boundaryDecision("anything.vercel.app", "/w", "GET", {
      VERCEL_ENV: "preview",
    }).status,
    404,
  );
  assert.equal(boundaryDecision("crm.cnps.ai", "/api/crm", "GET"), null);
  const res = response();
  guardPrivateRequest(
    {
      method: "GET",
      url: "/api/crm",
      headers: { host: "evil.example", "x-forwarded-host": "crm.cnps.ai" },
    },
    res,
  );
  assert.equal(res.statusCode, 404);
  const edge = middleware(new Request("https://crm.cnps.ai/en"));
  assert.equal(edge.status, 404);
});
test("legacy pages and known attachments redirect without query tokens or POST body forwarding", () => {
  for (const host of ["www.cnps.ai", "cnps.ai"])
    for (const path of ["/w", "/w/asset/pdf"])
      for (const method of ["GET", "HEAD"])
        assert.deepEqual(boundaryDecision(host, path, method), {
          status: 307,
          location: "https://crm.cnps.ai" + path,
        });
  assert.equal(
    boundaryDecision("www.cnps.ai", "/w/verify", "POST").status,
    410,
  );
  assert.equal(boundaryDecision("www.cnps.ai", "/w/view", "POST").status, 410);
  assert.equal(
    boundaryDecision("crm.cnps.ai", "/w%2fasset/pdf", "GET").status,
    404,
  );
});
test("unified proposal handler uses the CRM session, checks before/after decrypt and never honors old sessions or origins", async () => {
  const h = await fixture(),
    binding = { id: "wasion-web-v1", documents: { pdf: {}, pptx: {} } };
  await h.service.grantProposal(h.admin, {
    phone: h.outsider.phone,
    proposalId: binding.id,
    assetIds: ["pdf"],
    operations: ["view", "download"],
  });
  let principal = { ...h.outsider, identity: { role: "proposal_viewer" } },
    decryptCount = 0;
  const handler = createCrmProposalHandler({
    env: h.env,
    binding,
    runtime: () => ({
      service: h.service,
      auth: {
        async loadSession() {
          return principal;
        },
      },
    }),
    loadBundle: async () => {
      decryptCount++;
      return {
        html: "<body>PRIVATE __VIEWER__</body>",
        assets: {
          pdf: {
            data: Buffer.from("PDF").toString("base64"),
            type: "application/pdf",
            filename: "quote.pdf",
          },
          pptx: { data: "", type: "x", filename: "quote.pptx" },
        },
      };
    },
  });
  let res = response();
  await handler({ method: "GET", url: "/w", headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.includes("PRIVATE"));
  assert.equal(decryptCount, 1);
  res = response();
  await handler({ method: "GET", url: "/w/asset/pptx", headers: {} }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(decryptCount, 1);
  res = response();
  await handler(
    {
      method: "POST",
      url: "/w/view",
      headers: { origin: "https://www.cnps.ai", "x-proposal-request": "1" },
    },
    res,
  );
  assert.equal(res.statusCode, 403);
  principal = null;
  res = response();
  await handler(
    {
      method: "GET",
      url: "/w",
      headers: { cookie: "__Host-cnps_proposal=legacy" },
    },
    res,
  );
  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.location, "/crm?next=%2Fw");
});
test("partner AI requests are denied before model calls and oversized submissions use the upload body contract", async () => {
  const h = await fixture(),
    handler = createBusinessHandler({
      env: h.env,
      service: h.service,
      authHandler: {
        async loadSession() {
          return h.partner;
        },
      },
    });
  for (const action of ["knowledgeAnswer", "projectAi"]) {
    const res = response();
    await handler(
      {
        method: "POST",
        url: "/api/crm-workspace",
        headers: {
          origin: "https://crm.cnps.ai",
          "content-type": "application/json",
          "x-cnps-crm": "1",
        },
        body: {
          action,
          companyId: "company-A",
          projectId: h.p.id,
          contextId: h.partner.contextId,
          question: "secret",
        },
      },
      res,
    );
    assert.equal(res.statusCode, 404);
  }
});
test("legacy migration is idempotent and preserves narrow project/document gates without creating members", () => {
  const secret = randomBytes(32).toString("hex"),
    phone = "18700001111";
  const d = emptyDirectory(),
    base = createBusinessService({
      env: { CNPS_PROPOSAL_SECRET: secret },
      store: {},
    }),
    identityId = base.subjectForPhone(phone),
    b = proposalBinding;
  d.companies[b.companyId] = { companyId: b.companyId };
  d.memberGrants[identityId] = {
    active: true,
    companyId: b.companyId,
    projectScope: "selected",
    projectIds: [b.projectId],
    documentScope: "selected",
    documentIds: Object.values(b.documents).map((v) => v.documentId),
  };
  const state = emptyCompany(b.companyId);
  state.projects[b.projectId] = { id: b.projectId, publication: {} };
  for (const source of Object.values(b.documents))
    state.documents[source.documentId] = {
      id: source.documentId,
      projectId: b.projectId,
      activeVersionId: source.versionId,
      versions: [{ id: source.versionId, publishedAt: 1 }],
    };
  const plan = planProposalMigration(
    d,
    { [b.companyId]: state },
    [phone, "18800002222"],
    secret,
  );
  assert.equal(plan.changes.length, 1);
  assert.equal(plan.changes[0].legacyRestricted, true);
  assert.deepEqual(plan.next.memberGrants, d.memberGrants);
  assert.deepEqual(plan.next.managerAssignments, d.managerAssignments);
  assert.equal(
    planProposalMigration(plan.next, { [b.companyId]: state }, [phone], secret)
      .alreadyApplied,
    true,
  );
  d.memberGrants[identityId].documentIds = [];
  assert.equal(
    planProposalMigration(d, { [b.companyId]: state }, [phone], secret).changes
      .length,
    0,
  );
});

test("proposal-only OTP uses one secure CRM session; disable and re-enable cannot revive an old session", async () => {
  const h = await fixture(),
    values = new Map();
  let sends = 0;
  await h.service.grantProposal(h.admin, {
    phone: h.outsider.phone,
    proposalId: "wasion-web-v1",
  });
  const auth = createCrmAuthHandler({
    env: h.env,
    loadAccess: (p) => h.service.loadIdentityAccess(p),
    storeFactory: () => ({
      async get(k) {
        return copy(values.get(k));
      },
      async set(k, v) {
        values.set(k, copy(v));
      },
      async del(k) {
        values.delete(k);
      },
      async reserve() {
        return true;
      },
      async attempt(i, b) {
        const c = values.get("challenge:" + i);
        return c?.binding === b ? copy(c) : null;
      },
      async consume(i, b) {
        const c = values.get("challenge:" + i);
        if (c?.binding !== b) return false;
        values.delete("challenge:" + i);
        return true;
      },
    }),
    smsFactory: () => ({
      async send() {
        sends++;
      },
      async verify() {
        return true;
      },
    }),
  });
  const call = async (body, cookie = "") => {
    const res = response();
    await auth(
      {
        method: "POST",
        url: "/api/crm",
        headers: {
          origin: "https://crm.cnps.ai",
          "content-type": "application/json",
          "x-cnps-crm": "1",
          cookie,
        },
        body,
      },
      res,
    );
    return res;
  };
  const challenge = await call({
    action: "send",
    phone: h.outsider.phone,
    consent: true,
  });
  assert.equal(challenge.statusCode, 200);
  assert.equal(sends, 1);
  const login = await call(
    {
      action: "verify",
      challenge: JSON.parse(challenge.body).challenge,
      code: "123456",
    },
    challenge.headers["set-cookie"].split(";")[0],
  );
  assert.equal(login.statusCode, 200);
  const cookie = login.headers["set-cookie"][0];
  assert.match(
    cookie,
    /__Host-cnps_crm=.*; Path=\/; HttpOnly; Secure; SameSite=Strict/,
  );
  const req = { headers: { cookie } },
    p = await auth.loadSession(req);
  assert.equal(p.identity.role, "proposal_viewer");
  assert.deepEqual(p.identity.memberships, []);
  assert.equal(p.identity.proposals[0].id, "wasion-web-v1");
  await h.service.setIdentityStatus(h.admin, h.outsider.identityId, true);
  assert.equal(await auth.loadSession(req), null);
  await h.service.setIdentityStatus(h.admin, h.outsider.identityId, false);
  assert.equal(await auth.loadSession(req), null);
});
test("proposal revocation during decrypt and sensitive approval revocation during download disclose no bytes", async () => {
  const h = await fixture(),
    binding = { id: "wasion-web-v1", documents: { pdf: {} } };
  const grant = await h.service.grantProposal(h.admin, {
    phone: h.outsider.phone,
    proposalId: binding.id,
  });
  const handler = createCrmProposalHandler({
    env: h.env,
    binding,
    runtime: () => ({
      service: h.service,
      auth: {
        async loadSession() {
          return { ...h.outsider, identity: { role: "proposal_viewer" } };
        },
      },
    }),
    loadBundle: async () => {
      await h.service.revokeProposal(h.admin, grant.id);
      return { html: "PRIVATE", assets: {} };
    },
  });
  const res = response();
  await handler({ method: "GET", url: "/w", headers: {} }, res);
  assert.equal(res.statusCode, 404);
  assert.ok(!res.body.includes("PRIVATE"));
  const r = await h.service.requestSensitiveAccess(h.manager, "company-A", {
    grantId: h.g.id,
    documentId: h.sensitive.documentId,
    reason: "Review",
  });
  await h.service.decideSensitiveAccess(h.admin, "company-A", r.id, "approve");
  h.onRead(() =>
    h.service.decideSensitiveAccess(h.admin, "company-A", r.id, "revoke"),
  );
  await assert.rejects(
    h.service.download(
      h.partner,
      "company-A",
      h.sensitive.documentId,
      h.sensitive.versionId,
    ),
    status(404),
  );
});
test("new collaborator grants exclude newly created tasks/files and cannot be extended by forged input fields", async () => {
  const h = await fixture();
  const task = await h.service.createRecord(
      h.manager,
      "company-A",
      h.p.id,
      "task",
      { title: "New task" },
    ),
    doc = await h.addDoc("New file");
  await assert.rejects(
    h.service.getRecord(h.partner, "company-A", task.id),
    status(404),
  );
  await assert.rejects(
    h.service.getDocument(h.partner, "company-A", doc.documentId),
    status(404),
  );
  await assert.rejects(
    h.service.grantPartner(h.manager, "company-A", {
      contactId: "partner",
      projectId: h.p.id,
      role: "admin",
    }),
    status(400),
  );
});

test('disable and restore during file IO invalidates the in-flight identity generation',async()=>{
 const h=await fixture(),actor={...h.partner,identityVersion:0};
 h.onRead(async()=>{await h.service.setIdentityStatus(h.admin,h.partner.identityId,true);await h.service.setIdentityStatus(h.admin,h.partner.identityId,false);});
 await assert.rejects(h.service.download(actor,'company-A',h.doc.documentId,h.doc.versionId),status(404));
});

test('legacy proposal authorization checks download rights without reading gateway bytes', async () => {
 const h=await fixture(), binding={id:'wasion-web-v1',companyId:'company-A',projectId:h.p.id,documents:{pdf:{documentId:h.doc.documentId,versionId:h.doc.versionId}}};
 const g=await h.service.grantProposal(h.admin,{phone:h.customer.phone,proposalId:binding.id,operations:['view','download'],assetIds:['pdf']});
 const d=await h.store.getDirectory();d.proposalGrants[g.id].legacyRestricted=true;await h.store.commitDirectory(d.revision,d);
 h.env.CNPS_PROPOSAL_ALLOWED_PHONES=h.customer.phone;
 h.onRead(()=>assert.fail('Authorization must not read file bytes'));
 await h.service.authorizeProposal(h.customer,binding,'pdf');
 await h.service.grantMember(h.manager,'company-A',{contactId:'client',projectIds:[h.p.id],documentIds:[h.doc.documentId],operations:['view']});
 await h.service.authorizeProposal(h.customer,binding);
 await assert.rejects(h.service.authorizeProposal(h.customer,binding,'pdf'),status(404));
});
