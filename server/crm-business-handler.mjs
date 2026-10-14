import { completedResponseAudit } from './crm-response-audit.mjs';
import { projectPreviews } from './crm-project-previews.mjs';
import { knowledgeAnswer } from './crm-knowledge.mjs';
import { projectAi } from './crm-ai.mjs';
import { BusinessError } from './crm-business-service.mjs';

function policy(res) {
  for (const name of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) res.setHeader(name, 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
}
async function readJson(req) {
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new BusinessError(400, '请求格式无效。');
  const maximumUploadBody = Math.floor(4.3 * 1024 * 1024);
  let value, bodyBytes;
  if (req.body !== undefined) {
    bodyBytes = Buffer.byteLength(typeof req.body === 'string' ? req.body : JSON.stringify(req.body) || '');
    if (bodyBytes > maximumUploadBody) throw new BusinessError(413, '请求内容过大。');
    value = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } else {
    const chunks = []; bodyBytes = 0;
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bodyBytes += bytes.length;
      if (bodyBytes > maximumUploadBody) throw new BusinessError(413, '请求内容过大。');
      chunks.push(bytes);
    }
    value = JSON.parse(Buffer.concat(chunks, bodyBytes).toString('utf8'));
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BusinessError(400, '请求格式无效。');
  if (!['uploadDocument','submitPartnerDelivery'].includes(value.action) && bodyBytes > 65536) throw new BusinessError(413, '请求内容过大。');
  return value;
}
// authHandler must be the server's createCrmAuthHandler instance. This handler
// never accepts a body-supplied identity, role, subject or native CRM API token.
export function createBusinessHandler({ env, authHandler, service }) {
  return async (req, res) => {
    policy(res);
    const json = (status, payload) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(req.method === 'HEAD' ? undefined : JSON.stringify(payload)); };
    let principal;
    function recordFileResponse(action, companyId, resourceId, versionId) {
      return completedResponseAudit(req, res, () => service.auditCompletedResponse(principal, action, companyId, 200,
        { resourceId, ...(versionId ? { versionId } : {}) }));
    }
    async function finalFileAccess(kind, companyId, resourceId, versionId) {
      const current = await authHandler.loadSession(req);
      if (!current) throw new BusinessError(401, '请先通过短信验证登录。');
      principal = { ...current, ...(principal.contextId ? { contextId: principal.contextId } : {}) };
      const authorize = kind === 'submission' ? service.authorizeSubmissionDownload : service.authorizeDownload;
      if (typeof authorize !== 'function') throw new BusinessError(503, '资料访问校验暂不可用。');
      await authorize(principal, companyId, resourceId, versionId);
    }
    try {
      const url = new URL(req.url, 'https://www.cnps.ai');
      if (url.pathname !== '/api/crm-workspace') return json(404, { error: '接口不存在。' });
      if (!['GET', 'HEAD', 'POST'].includes(req.method)) return json(405, { error: '请求方式不支持。' });
      principal = await authHandler.loadSession(req);
      if (!principal) return json(401, { error: '请先通过短信验证登录。' });
      const query = name => url.searchParams.get(name) || undefined;
      let result, responseVersion, responseCompany;
      if (req.method === 'GET' || req.method === 'HEAD') {
        const companyId = query('companyId'), projectId = query('projectId');
        if(query('contextId'))principal={...principal,contextId:query('contextId')};
        if (!['download','submissionDownload'].includes(query('view')) && service.captureResponseVersion) {
          responseCompany = companyId;
          responseVersion = await service.captureResponseVersion(principal, companyId);
        }
        switch (query('view')) {
          case 'accessGrants': result=await service.listAccessGrants(principal,companyId);break;
          case 'partnerOrganizations': result=await service.listPartnerOrganizations(principal,companyId);break;
          case 'sensitiveRequests': result=await service.listSensitiveRequests(principal,companyId);break;
          case 'partnerSubmissions': result=await service.listPartnerSubmissions(principal,companyId,projectId);break;
          case 'submissionDownload': {const file=await service.downloadSubmission(principal,companyId,query('submissionId'));if(service.auditAccess&&req.method==='GET')await service.auditAccess(principal,'submission-download-prepared',companyId,200);await finalFileAccess('submission',companyId,query('submissionId'));const responseAudit=recordFileResponse('submission-download-response',companyId,query('submissionId'));res.statusCode=200;res.setHeader('Content-Type',file.metadata.mimeType);res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(file.metadata.filename)}`);res.end(req.method==='HEAD'?undefined:file.bytes);await responseAudit;return;}
          case 'deliveries': result = await service.listDeliveries(principal, companyId, projectId); break;
          case 'delivery': result = await service.getDelivery(principal, companyId, query('deliveryId')); break;
          case 'companies': result = await service.listCompanies(principal); break;
          case 'managers': result = await service.listManagers(principal, companyId); break;
          case 'staff': result = await service.listStaff(principal); break;
          case 'customerProfile': result = await service.getCustomerProfile(principal, companyId); break;
          case 'contacts': result = await service.listContacts(principal, companyId); break;
          case 'projects': result = await service.listProjects(principal, companyId); break;
          case 'project': {
            const project = await service.getProject(principal, companyId, projectId);
            result = { ...project, previews: principal.contextId?.startsWith('partner:')||principal.identity.role==='partner'?[]:projectPreviews(companyId, project.id) };
            break;
          }
          case 'records': result = await service.listRecords(principal, companyId, projectId, query('type')); break;
          case 'record': result = await service.getRecord(principal, companyId, query('recordId')); break;
          case 'documents': result = await service.listDocuments(principal, companyId, projectId); break;
          case 'document': result = await service.getDocument(principal, companyId, query('documentId')); break;
          case 'members': result = await service.listMembers(principal, companyId); break;
          case 'events': result = await service.listEvents(principal, companyId); break;
          case 'search': result = await service.search(principal, companyId, query('q')); break;
          case 'download': {
            if(query('deliveryId')) await service.getDelivery(principal,companyId,query('deliveryId'));
            const file = await service.download(principal, companyId, query('documentId'), query('versionId'));
            if(req.method==='GET' && query('deliveryId')) await service.recordDelivery(principal,companyId,query('deliveryId'),'download',query('documentId'),query('versionId'));
            if(service.auditAccess&&req.method==='GET')await service.auditAccess(principal,'download-prepared',companyId,200);
            await finalFileAccess('document',companyId,query('documentId'),query('versionId'));
            const responseAudit = recordFileResponse('download-response',companyId,query('documentId'),query('versionId'));
            res.statusCode = 200;
            res.setHeader('Content-Type', file.metadata.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.metadata.filename)}`);
            res.setHeader('Content-Length', file.bytes.length);
            res.end(req.method === 'HEAD' ? undefined : file.bytes);
            await responseAudit;
            return;
          }
          default: return json(404, { error: '接口不存在。' });
        }
      } else {
        const origins = new Set(['https://crm.cnps.ai']);

        if (!origins.has(req.headers.origin) || req.headers['x-cnps-crm'] !== '1') throw new BusinessError(403,'请求来源无效。');
        let data;
        try { data = await readJson(req); } catch (error) { if (error instanceof BusinessError || error?.status === 400) throw error; throw new BusinessError(400, '请求格式无效。'); }
        const companyId = data.companyId, projectId = data.projectId;
        if(data.contextId)principal={...principal,contextId:data.contextId};
        if(['knowledgeAnswer','projectAi'].includes(data.action)&&service.captureResponseVersion){responseCompany=companyId;responseVersion=await service.captureResponseVersion(principal,companyId);}
        if(['knowledgeAnswer','projectAi'].includes(data.action)&&service.authorizeAi)await service.authorizeAi(principal,companyId);
        switch (data.action) {
          case 'grantProposal':result=await service.grantProposal(principal,data.fields);break;
          case 'revokeProposal':result=await service.revokeProposal(principal,data.grantId);break;
          case 'setIdentityStatus':result=await service.setIdentityStatus(principal,data.identityId,data.disabled);break;
          case 'registerPartnerOrganization':result=await service.registerPartnerOrganization(principal,data.organizationId);break;
          case 'grantPartner':result=await service.grantPartner(principal,companyId,data.fields);break;
          case 'revokePartner':result=await service.revokePartner(principal,companyId,data.grantId);break;
          case 'setDocumentClassification':result=await service.setDocumentClassification(principal,companyId,data.documentId,data.classification);break;
          case 'requestSensitiveAccess':result=await service.requestSensitiveAccess(principal,companyId,data.fields);break;
          case 'decideSensitiveAccess':result=await service.decideSensitiveAccess(principal,companyId,data.requestId,data.decision);break;
          case 'partnerUpdateProgress':result=await service.partnerUpdateProgress(principal,companyId,data.taskId,data.fields);break;
          case 'submitPartnerDelivery':result=await service.submitPartnerDelivery(principal,companyId,data.fields);break;
          case 'reviewPartnerSubmission':result=await service.reviewPartnerSubmission(principal,companyId,data.submissionId,data.fields);break;
          case 'createDelivery': result = await service.createDelivery(principal,companyId,projectId,data.fields); break;
          case 'recordDelivery': result = await service.recordDelivery(principal,companyId,data.deliveryId,data.kind); break;
          case 'bindDeliveryWecom': result=await service.bindDeliveryWecom(principal,companyId,data.contactId,data.fields);break;
          case 'sendDeliveryNotification': result=await service.sendDeliveryNotification(principal,companyId,data.deliveryId,data.channel);break;
          case 'syncDeliveryNotification': result=await service.syncDeliveryNotification(principal,companyId,data.deliveryId,data.channel);break;
          case 'sendDeliverySms': result = await service.sendDeliverySms(principal,companyId,data.deliveryId); break;
          case 'knowledgeAnswer': result = await knowledgeAnswer({env,service,principal,companyId,projectId,question:data.question,documentIds:data.documentIds}); break;
          case 'projectAi': result = await projectAi({env,service,principal,companyId,projectId,question:data.question}); break;
          case 'registerCompany': result = await service.registerCompany(principal, companyId); break;
          case 'saveCustomerProfile': result = await service.saveCustomerProfile(principal,companyId,data.fields,data.expectedVersion); break;
          case 'previewCustomerProfile': result = await service.previewCustomerProfile(principal,companyId,data.source); break;
          case 'createCompany': result = await service.createCompany(principal, data.fields); break;
          case 'createContact': result = await service.createContact(principal, companyId, data.fields); break;
          case 'updateContact': result = await service.updateContact(principal, companyId, data.contactId, data.fields); break;
          case 'setCompanyManager': result = await service.setCompanyManager(principal, companyId, data.staffId, data.active, data.expectedVersion); break;
          case 'assignManager': result = await service.assignManager(principal, data.staffId, data.companyIds, data.active); break;
          case 'grantMember': result = await service.grantMember(principal, companyId, data.grant); break;
          case 'revokeMember': result = await service.revokeMember(principal, companyId, data.contactId); break;
          case 'createProject': result = await service.createProject(principal, companyId, data.fields); break;
          case 'updateProject': result = await service.updateProject(principal, companyId, projectId, data.fields); break;
          case 'publishProject': result = await service.publishProject(principal, companyId, projectId); break;
          case 'unpublishProject': result = await service.unpublishProject(principal, companyId, projectId); break;
          case 'createRecord': result = await service.createRecord(principal, companyId, projectId, data.type, data.fields); break;
          case 'updateRecords': result = await service.updateRecords(principal, companyId, data.updates); break;
          case 'decide': result = await service.decide(principal, companyId, data.recordId, data.fields); break;
          case 'registerDocument': result = await service.registerDocument(principal, companyId, projectId, data.fields); break;
          case 'uploadDocument': result = await service.uploadDocument(principal, companyId, projectId, data.fields); break;
          case 'publishDocument': result = await service.publishDocument(principal, companyId, data.documentId, data.versionId); break;
          case 'withdrawDocument': result = await service.withdrawDocument(principal, companyId, data.documentId, data.versionId); break;
          default: return json(400, { error: '请求操作无效。' });
        }
      }
      if(service.auditAccess)await service.auditAccess(principal,req.method==='POST'?'operation':'read',req.method==='POST'?req.body?.companyId:query('companyId'),200);
      if (responseVersion) {
        const current = await authHandler.loadSession(req);
        if (!current) throw new BusinessError(401, '请先通过短信验证登录。');
        if (current.identity.role !== principal.identity.role ||
            (principal.contextId && !current.identity.contexts?.some(c => c.id === principal.contextId)))
          throw new BusinessError(404, '资料不存在或未获授权。');
        await service.assertResponseVersion(current, responseCompany, responseVersion);
      }
      return json(200, { ok: true, data: result });
    } catch (error) {
      if (error instanceof BusinessError || error?.status===400) {
        if([403,404].includes(error.status)&&service.auditDeniedAccess){try{await service.auditDeniedAccess(principal,error.status);}catch{}}
        return json(error.status, { error: error.message });
      }
      // Provider diagnostics, private contact fields and credentials stay server-only.
      return json(503, { error: '客户工作台暂不可用，请稍后重试。' });
    }
  };
}
