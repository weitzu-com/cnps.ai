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
  if (value.action !== 'uploadDocument' && bodyBytes > 65536) throw new BusinessError(413, '请求内容过大。');
  return value;
}
// authHandler must be the server's createCrmAuthHandler instance. This handler
// never accepts a body-supplied identity, role, subject or native CRM API token.
export function createBusinessHandler({ env, authHandler, service }) {
  return async (req, res) => {
    policy(res);
    const json = (status, payload) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(req.method === 'HEAD' ? undefined : JSON.stringify(payload)); };
    try {
      const url = new URL(req.url, 'https://www.cnps.ai');
      if (url.pathname !== '/api/crm-workspace') return json(404, { error: '接口不存在。' });
      if (!['GET', 'HEAD', 'POST'].includes(req.method)) return json(405, { error: '请求方式不支持。' });
      const principal = await authHandler.loadSession(req);
      if (!principal) return json(401, { error: '请先通过短信验证登录。' });
      const query = name => url.searchParams.get(name) || undefined;
      let result;
      if (req.method === 'GET' || req.method === 'HEAD') {
        const companyId = query('companyId'), projectId = query('projectId');
        switch (query('view')) {
          case 'deliveries': result = await service.listDeliveries(principal, companyId, projectId); break;
          case 'delivery': result = await service.getDelivery(principal, companyId, query('deliveryId')); break;
          case 'companies': result = await service.listCompanies(principal); break;
          case 'managers': result = await service.listManagers(principal, companyId); break;
          case 'staff': result = await service.listStaff(principal); break;
          case 'contacts': result = await service.listContacts(principal, companyId); break;
          case 'projects': result = await service.listProjects(principal, companyId); break;
          case 'project': {
            const project = await service.getProject(principal, companyId, projectId);
            result = { ...project, previews: projectPreviews(companyId, project.id) };
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
            res.statusCode = 200;
            res.setHeader('Content-Type', file.metadata.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.metadata.filename)}`);
            res.setHeader('Content-Length', file.bytes.length);
            return res.end(req.method === 'HEAD' ? undefined : file.bytes);
          }
          default: return json(404, { error: '接口不存在。' });
        }
      } else {
        const origins = new Set(['https://www.cnps.ai', 'https://cnps.ai', 'https://crm.cnps.ai']);
        if (env.VERCEL_URL) origins.add(`https://${env.VERCEL_URL}`);
        if (!origins.has(req.headers.origin) || req.headers['x-cnps-crm'] !== '1') return json(403, { error: '请求来源无效。' });
        let data;
        try { data = await readJson(req); } catch (error) { if (error instanceof BusinessError) throw error; throw new BusinessError(400, '请求格式无效。'); }
        const companyId = data.companyId, projectId = data.projectId;
        switch (data.action) {
          case 'createDelivery': result = await service.createDelivery(principal,companyId,projectId,data.fields); break;
          case 'recordDelivery': result = await service.recordDelivery(principal,companyId,data.deliveryId,data.kind); break;
          case 'bindDeliveryWecom': result=await service.bindDeliveryWecom(principal,companyId,data.contactId,data.fields);break;
          case 'sendDeliveryNotification': result=await service.sendDeliveryNotification(principal,companyId,data.deliveryId,data.channel);break;
          case 'syncDeliveryNotification': result=await service.syncDeliveryNotification(principal,companyId,data.deliveryId,data.channel);break;
          case 'sendDeliverySms': result = await service.sendDeliverySms(principal,companyId,data.deliveryId); break;
          case 'knowledgeAnswer': result = await knowledgeAnswer({env,service,principal,companyId,projectId,question:data.question,documentIds:data.documentIds}); break;
          case 'projectAi': result = await projectAi({env,service,principal,companyId,projectId,question:data.question}); break;
          case 'registerCompany': result = await service.registerCompany(principal, companyId); break;
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
      return json(200, { ok: true, data: result });
    } catch (error) {
      if (error instanceof BusinessError) return json(error.status, { error: error.message });
      // Provider diagnostics, private contact fields and credentials stay server-only.
      return json(503, { error: '客户工作台暂不可用，请稍后重试。' });
    }
  };
}
