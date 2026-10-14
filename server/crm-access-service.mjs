import { randomUUID } from 'node:crypto';
import { BusinessError, PMP_DOCUMENT_MIME_TYPES, PMP_MAX_UPLOAD_BYTES } from './crm-business-service.mjs';
const fail = (status, message = '资料不存在或未获授权。') => { throw new BusinessError(status, message); };
const own = (map, key) => map && Object.hasOwn(map,key) ? map[key] : undefined;
const copy = value => structuredClone(value);
const validId = v => typeof v==='string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v) && !['__proto__','constructor','prototype'].includes(v);
const id = v => { if(!validId(v)) fail(400,'标识格式无效。'); return v; };
const ids = v => { if(!Array.isArray(v)||v.length>200||new Set(v).size!==v.length)fail(400,'授权范围无效。'); return v.map(id); };
const text = (v,max=2000) => { if(typeof v!=='string'||!v.trim()||v.length>max||/[\u0000-\u001f]/.test(v))fail(400,'文本格式无效。');return v.trim(); };
const fields = (v,keys) => { if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))fail(400,'请求字段无效。'); };
const pick = (v,keys) => Object.fromEntries(keys.filter(k=>v[k]!==undefined).map(k=>[k,copy(v[k])]));
const partnerOps = ['view','download','submit','progress'];
const live = (g,now) => g?.active===true && (g.expiresAt==null||Number.isFinite(g.expiresAt)&&g.expiresAt>now);
const projectDTO = p => pick(p,['id','companyId','title','status','plannedStart','plannedEnd']);
const taskDTO = (t,g,state) => ({...pick(t,['id','projectId','type','title','description','dueDate','version']),progress:copy(state.partnerProgress?.[g.id]?.[t.id]||null)});
const docDTO = (d,v) => ({id:d.id,projectId:d.projectId,title:v.title,versionId:v.id,version:v.version,filename:v.filename,mimeType:v.mimeType,size:v.size,status:'published'});
const submissionDTO = s => pick(s,['id','projectId','title','filename','mimeType','size','status','createdAt','reviewedAt','reviewComment','documentId','versionId']);
export function createAccessService({base,store,twenty,documents,env,now=()=>Date.now(),newId=randomUUID}) {
  const actor = p => id(p?.identityId);
  function enabled(d,p) { if(!p?.identity || !['admin','sales_manager','customer','partner','proposal_viewer','unassigned'].includes(p.identity.role))fail(404);if(d.identities?.[actor(p)]?.disabled)fail(404); }
  const admin = (d,p) => {enabled(d,p);if(p.identity.role!=='admin'||p.contextId?.startsWith('partner:'))fail(404);};
  function manager(d,p,companyId) {
    enabled(d,p); id(companyId);
    if(!own(d.companies,companyId)||p.contextId?.startsWith('partner:'))fail(404);
    if(p.contextId?.startsWith('member:')&&p.contextId!==`member:${companyId}:sales_manager`)fail(404);
    if(p.identity.role==='admin')return;
    const g=own(d.managerAssignments,actor(p));
    if(p.identity.role!=='sales_manager'||!g?.active||!g.companyIds.includes(companyId))fail(404);
  }
  function audit(d,p,action,extra={}){d.events.push({id:newId(),actorId:actor(p),action,at:now(),...extra});}
  async function directoryWrite(p,transform) {
    const d=await store.getDirectory();enabled(d,p);const next=copy(d);const result=await transform(next);
    next.revision=d.revision+1;
    if(!await store.commitDirectory(d.revision,next))fail(409,'权限已变更，请刷新后重试。');return copy(result);
  }
  async function contact(g) {
    if(typeof twenty?.getContact!=='function'||typeof twenty?.getCompany!=='function')fail(503,'人员目录暂不可用。');
    const c=await twenty.getContact(g.contactId);
    if(!c?.active||c.identityId!==g.identityId||c.companyId!==g.organizationId)fail(404);
    const org=await twenty.getCompany(g.organizationId),company=await twenty.getCompany(g.companyId);
    if(!org||org.active===false||!company||company.active===false)fail(404);
    return c;
  }
  async function partnerSnapshot(p,companyId,operation='view') {
    const d=await store.getDirectory();enabled(d,p);
    const gs=Object.values(d.partnerGrants||{}).filter(g=>g.identityId===actor(p)&&live(g,now())&&(!companyId||g.companyId===companyId));
    const selected=p.contextId?.startsWith('partner:')?gs.find(g=>`partner:${g.id}`===p.contextId):gs.length===1?gs[0]:null;
    if(!selected||!selected.operations.includes(operation))fail(404);
    await contact(selected);
    const state=await store.getCompany(selected.companyId);
    if(!own(d.companies,selected.companyId)||!state.projects[selected.projectId])fail(404);
    if((await store.getDirectory()).revision!==d.revision)fail(409,'权限已变更，请刷新后重试。');
    return {d,g:selected,state};
  }
  async function partnerWrite(p,companyId,operation,transform) {
    const {d,g,state}=await partnerSnapshot(p,companyId,operation);
    if(state.projects[g.projectId].status==='completed')fail(409,'项目已结项。');
    const next=copy(state),result=await transform(next,g,d);
    await contact(g);next.revision=state.revision+1;
    if(!await store.commitCompany(companyId,d.revision,state.revision,next))fail(409,'数据或权限已变更，请刷新后重试。');return copy(result);
  }
  function partnerDocument(state,g,documentId,versionId) {
    const doc=own(state.documents,id(documentId));
    if(!doc||doc.projectId!==g.projectId||!g.documentIds.includes(doc.id))fail(404);
    const v=doc.versions.find(v=>v.id===doc.activeVersionId&&v.withdrawnAt==null&&Number.isFinite(v.publishedAt));
    if(!v||(versionId&&versionId!==v.id))fail(404);
    if(doc.classification!=='collaboration') {
      const approval=own(g.approvals,doc.id);
      if(!approval?.active||approval.versionId!==v.id||approval.grantVersion!==g.version)fail(404);
    }
    return {doc,v};
  }
  const api = {
    async authorizeAi(p,companyId) { const d=await store.getDirectory();enabled(d,p);if(!['admin','sales_manager','customer'].includes(p.identity.role))fail(404);return {ok:true}; },
    async loadIdentityAccess(phone) {
      const identityId=base.subjectForPhone(phone),d=await store.getDirectory();
      if(d.identities?.[identityId]?.disabled)return {disabled:true,memberships:[],contexts:[],proposals:[]};
      const memberships=await base.loadMemberships(phone);
      const contexts=memberships.map(m=>({id:`member:${m.companyId}:${m.role}`,companyId:m.companyId,role:m.role,permissions:m.permissions}));
      for(const g of Object.values(d.partnerGrants||{}).filter(g=>g.identityId===identityId&&live(g,now()))) {
        try{await contact(g);contexts.push({id:`partner:${g.id}`,companyId:g.companyId,projectId:g.projectId,role:'partner',permissions:copy(g.operations)});}catch(e){if(!(e instanceof BusinessError)||e.status!==404)throw e;}
      }
      const proposals=Object.values(d.proposalGrants||{}).filter(g=>g.identityId===identityId&&live(g,now())).map(g=>({id:g.proposalId,permissions:copy(g.operations)}));
      if((await store.getDirectory()).revision!==d.revision)fail(409,'权限已变更，请重新确认身份。');
      return {memberships,contexts,proposals,authVersion:d.identities?.[identityId]?.version||0};
    },
    async setIdentityStatus(p,identityId,disabled) {
      id(identityId);if(typeof disabled!=='boolean'||identityId===actor(p))fail(400,'身份状态无效，不能停用当前管理员。');
      return directoryWrite(p,d=>{admin(d,p);d.identities||={};const old=own(d.identities,identityId);d.identities[identityId]={disabled,version:(old?.version||0)+1,updatedAt:now()};audit(d,p,'identity.status',{identityId,disabled});return {ok:true};});
    },
    async grantProposal(p,input) {
      fields(input,['phone','proposalId','assetIds','operations','expiresAt']);
      const identityId=base.subjectForPhone(input.phone),proposalId=id(input.proposalId),assetIds=ids(input.assetIds||[]),operations=ids(input.operations||['view']);
      if(proposalId!=='wasion-web-v1'||assetIds.some(v=>!['pdf','pptx'].includes(v))||!operations.includes('view')||operations.some(v=>!['view','download'].includes(v)))fail(400,'方案授权无效。');
      if(input.expiresAt!=null&&(!Number.isFinite(input.expiresAt)||input.expiresAt<=now()))fail(400,'有效期无效。');
      return directoryWrite(p,d=>{admin(d,p);d.proposalGrants||={};const key=base.subjectForPhone(input.phone),old=own(d.proposalGrants,key);const g={id:key,identityId,proposalId,phoneMasked:input.phone.slice(0,3)+'****'+input.phone.slice(-4),assetIds,operations,active:true,expiresAt:input.expiresAt||null,version:(old?.version||0)+1,grantedBy:actor(p),updatedAt:now(),legacyRestricted:false};d.proposalGrants[key]=g;audit(d,p,'proposal.grant',{proposalId,identityId,version:g.version});return pick(g,['id','proposalId','assetIds','operations','active','version','expiresAt']);});
    },
    async revokeProposal(p,grantId){return directoryWrite(p,d=>{admin(d,p);const g=own(d.proposalGrants,id(grantId));if(!g)fail(404);g.active=false;g.version++;audit(d,p,'proposal.revoke',{proposalId:g.proposalId,identityId:g.identityId,version:g.version});return {ok:true};});},
    async listAccessGrants(p,companyId) {
      const d=await store.getDirectory();if(companyId)manager(d,p,companyId);else admin(d,p);
      const state=companyId?await store.getCompany(companyId):null;
      return {partners:Object.values(d.partnerGrants||{}).filter(g=>!companyId||g.companyId===companyId).map(g=>({...copy(g),projectTitle:state?.projects[g.projectId]?.title||'协作项目'})),proposals:p.identity.role==='admin'?Object.values(d.proposalGrants||{}).map(copy):[],identities:p.identity.role==='admin'?copy(d.identities||{}):{}};
    },
    async authorizeProposal(p,binding,assetId) {
      const d=await store.getDirectory();enabled(d,p);
      if(p.identity.role==='admin'&&!p.contextId)return {grantId:null,version:d.revision,assetIds:Object.keys(binding.documents),operations:['view','download']};
      const gs=Object.values(d.proposalGrants||{}).filter(g=>g.identityId===actor(p)&&g.proposalId===binding.id&&live(g,now()));
      if(!gs.length)fail(404);
      const g=gs[0];if(!g.operations.includes('view')||(assetId&&Object.hasOwn(binding.documents,assetId)&&(!g.operations.includes('download')||!g.assetIds.includes(assetId))))fail(404);
      if(g.legacyRestricted) {
        const phones=new Set(String(env.CNPS_PROPOSAL_ALLOWED_PHONES||'').split(',').map(v=>v.trim().replace(/^\+86/,'')));
        if(!phones.has(p.phone))fail(404);
        await base.proposalAccess(p.phone,binding);
        if(assetId&&Object.hasOwn(binding.documents,assetId))await base.download(p,binding.companyId,binding.documents[assetId].documentId,binding.documents[assetId].versionId);
      }
      return {grantId:g.id,version:g.version,assetIds:copy(g.assetIds),operations:copy(g.operations)};
    },
    async recordProposalAccess(p,binding,kind,eventId,assetId,metadata={}) {
      if(!['view','download'].includes(kind))fail(400);
      const allowed=await api.authorizeProposal(p,binding,assetId);
      if(!/^[a-f0-9]{64}$/.test(metadata.contentHash||''))fail(400);
      await directoryWrite(p,d=>{const g=own(d.proposalGrants,allowed.grantId);if(allowed.grantId&&(!live(g,now())||g.version!==allowed.version))fail(404);audit(d,p,'proposal.'+kind,{proposalId:binding.id,...(assetId?{assetId:id(assetId)}:{}),contentHash:metadata.contentHash,eventId:id(eventId)});return {ok:true};});
    },
    async setDocumentClassification(p,companyId,documentId,classification) {
      if(!['internal','collaboration','commercial'].includes(classification))fail(400,'资料分类无效。');
      const d=await store.getDirectory();admin(d,p);const state=await store.getCompany(id(companyId));const doc=own(state.documents,id(documentId));if(!doc)fail(404);
      doc.classification=classification;state.revision++;state.events.push({id:newId(),actorId:actor(p),action:'document.classify',documentId,classification,at:now()});
      if(!await store.commitCompany(companyId,d.revision,state.revision-1,state))fail(409,'数据或权限已变更。');return {ok:true};
    },
    async grantPartner(p,companyId,input) {
      fields(input,['contactId','projectId','taskIds','documentIds','operations','expiresAt']);
      const d=await store.getDirectory();manager(d,p,companyId);
      const c=await twenty.getContact(id(input.contactId));
      if(!c?.active||!validId(c.identityId)||!validId(c.companyId)||c.companyId===companyId||!own(d.partnerOrganizations,c.companyId)?.active)fail(400,'请选择独立伙伴组织的有效联系人。');
      const state=await store.getCompany(companyId),projectId=id(input.projectId),taskIds=ids(input.taskIds||[]),documentIds=ids(input.documentIds||[]),operations=ids(input.operations||['view']);
      if(!state.projects[projectId]||!operations.includes('view')||operations.some(v=>!partnerOps.includes(v)))fail(400,'协作范围无效。');
      for(const taskId of taskIds){const t=own(state.records,taskId);if(t?.projectId!==projectId||t.type!=='task')fail(404);}
      for(const documentId of documentIds){const doc=own(state.documents,documentId);if(doc?.projectId!==projectId||doc.classification!=='collaboration')fail(400,'普通协作授权只能包含已标记为协作资料的文件；其他文件须申请管理员批准。');}
      if(input.expiresAt!=null&&(!Number.isFinite(input.expiresAt)||input.expiresAt<=now()))fail(400,'有效期无效。');
      const grant={id:newId(),identityId:c.identityId,contactId:c.id,contactLabel:c.name||[c.firstName,c.lastName].filter(Boolean).join(' ')||'伙伴联系人',organizationId:c.companyId,companyId,projectId,taskIds,documentIds,operations,active:true,expiresAt:input.expiresAt||null,version:1,grantedBy:actor(p),updatedAt:now(),approvals:{}};
      await contact(grant);
      return directoryWrite(p,next=>{manager(next,p,companyId);next.partnerGrants||={};next.partnerGrants[grant.id]=grant;audit(next,p,'partner.grant',{companyId,projectId,grantId:grant.id,identityId:grant.identityId});return grant;});
    },
    async revokePartner(p,companyId,grantId){return directoryWrite(p,d=>{manager(d,p,companyId);const g=own(d.partnerGrants,id(grantId));if(g?.companyId!==companyId)fail(404);g.active=false;g.version++;audit(d,p,'partner.revoke',{companyId,grantId:g.id});return {ok:true};});},
    async requestSensitiveAccess(p,companyId,input) {
      fields(input,['grantId','documentId','reason']);const d=await store.getDirectory();manager(d,p,companyId);
      const g=own(d.partnerGrants,id(input.grantId)),state=await store.getCompany(companyId),doc=own(state.documents,id(input.documentId));
      if(g?.companyId!==companyId||!live(g,now())||doc?.projectId!==g.projectId||!doc.activeVersionId)fail(404);
      const reason=text(input.reason),request={id:newId(),companyId,grantId:g.id,grantVersion:g.version,documentId:doc.id,versionId:doc.activeVersionId,reason,status:'requested',requestedBy:actor(p),createdAt:now()};
      return directoryWrite(p,next=>{manager(next,p,companyId);if(own(next.partnerGrants,g.id)?.version!==g.version)fail(409);next.sensitiveRequests||={};next.sensitiveRequests[request.id]=request;audit(next,p,'sensitive.request',{companyId,requestId:request.id});return request;});
    },
    async listSensitiveRequests(p,companyId){const d=await store.getDirectory();manager(d,p,companyId);const state=await store.getCompany(companyId);return Object.values(d.sensitiveRequests||{}).filter(r=>r.companyId===companyId).map(r=>({...copy(r),documentTitle:state.documents[r.documentId]?.title||'指定资料',partnerLabel:d.partnerGrants?.[r.grantId]?.contactLabel||'伙伴联系人'}));},
    async decideSensitiveAccess(p,companyId,requestId,decision) {
      if(!['approve','reject','revoke'].includes(decision))fail(400,'审批动作无效。');
      const d=await store.getDirectory();admin(d,p);const r=own(d.sensitiveRequests,id(requestId));if(r?.companyId!==companyId)fail(404);
      const state=await store.getCompany(companyId),doc=own(state.documents,r.documentId);
      return directoryWrite(p,next=>{admin(next,p);const request=own(next.sensitiveRequests,requestId),g=own(next.partnerGrants,request.grantId);
        if(decision==='revoke'){if(request.status!=='approved')fail(409);if(g?.approvals?.[request.documentId]?.requestId===request.id)g.approvals[request.documentId].active=false;request.status='revoked';}
        else {if(request.status!=='requested'||!live(g,now())||g.version!==request.grantVersion||doc?.activeVersionId!==request.versionId)fail(409,'授权或资料版本已变化，请重新申请。');request.status=decision==='approve'?'approved':'rejected';if(decision==='approve'){g.approvals||={};g.approvals[request.documentId]={active:true,versionId:request.versionId,grantVersion:g.version,requestId:request.id,approvedBy:actor(p),at:now()};if(!g.documentIds.includes(request.documentId))g.documentIds.push(request.documentId);}}
        request.decidedBy=actor(p);request.decidedAt=now();audit(next,p,'sensitive.'+decision,{companyId,requestId});return request;});
    },
    async registerPartnerOrganization(p,organizationId) {const org=await twenty.getCompany(id(organizationId));if(!org||org.active===false)fail(404);return directoryWrite(p,d=>{admin(d,p);d.partnerOrganizations||={};d.partnerOrganizations[organizationId]={id:organizationId,active:true,registeredBy:actor(p),at:now()};audit(d,p,'partner.organization-register',{organizationId});return {ok:true};});},
    async listPartnerOrganizations(p,companyId){const d=await store.getDirectory();manager(d,p,companyId);const result=[];for(const entry of Object.values(d.partnerOrganizations||{}).filter(o=>o.active&&o.id!==companyId)){const org=await twenty.getCompany(entry.id);if(!org||org.active===false)continue;const contacts=await twenty.listContacts(org.id);const eligible=contacts.filter(c=>c.active&&validId(c.identityId));if(eligible.length)result.push({id:org.id,name:org.name,contacts:eligible.map(c=>pick(c,['id','name','firstName','lastName','jobTitle']))});}manager(await store.getDirectory(),p,companyId);return result;},
    async partnerUpdateProgress(p,companyId,taskId,input) {
      fields(input,['status','comment']);if(!['todo','in_progress','blocked','done'].includes(input.status))fail(400,'任务进展无效。');
      const comment=input.comment?text(input.comment):'';
      return partnerWrite(p,companyId,'progress',(state,g)=>{const task=own(state.records,id(taskId));if(!g.taskIds.includes(taskId)||task?.projectId!==g.projectId||task.type!=='task')fail(404);state.partnerProgress||={};state.partnerProgress[g.id]||={};state.partnerProgress[g.id][taskId]={status:input.status,comment,updatedAt:now()};state.events.push({id:newId(),actorId:actor(p),action:'partner.progress',projectId:g.projectId,taskId,at:now()});return {ok:true};});
    },
    async submitPartnerDelivery(p,companyId,input) {
      fields(input,['title','filename','mimeType','base64']);const start=await partnerSnapshot(p,companyId,'submit');
      const title=text(input.title,300),filename=text(input.filename,180);if(/[\\/]/.test(filename)||!PMP_DOCUMENT_MIME_TYPES.includes(input.mimeType)||typeof input.base64!=='string'||input.base64.length>Math.ceil(PMP_MAX_UPLOAD_BYTES/3)*4)fail(400,'文件格式或大小无效。');
      const bytes=Buffer.from(input.base64,'base64');if(!bytes.length||bytes.length>PMP_MAX_UPLOAD_BYTES||bytes.toString('base64')!==input.base64)fail(400,'文件格式或大小无效。');
      if(start.state.projects[start.g.projectId].status==='completed')fail(409,'项目已结项。');
      const object=await documents.createObject({companyId,projectId:start.g.projectId,filename,mimeType:input.mimeType,base64:input.base64});
      if(!validId(object?.id)||object.companyId!==companyId||object.projectId!==start.g.projectId||object.size!==bytes.length||object.mimeType!==input.mimeType)fail(503,'文件上传结果无效。');
      return partnerWrite(p,companyId,'submit',(state,g,d)=>{if(g.id!==start.g.id||g.version!==start.g.version||d.revision!==start.d.revision||state.revision!==start.state.revision)fail(409,'数据或权限已变化，请刷新后重试。');const submission={id:newId(),grantId:g.id,identityId:actor(p),projectId:g.projectId,objectId:object.id,title,filename,mimeType:input.mimeType,size:bytes.length,status:'pending',createdAt:now()};state.partnerSubmissions||={};state.partnerSubmissions[submission.id]=submission;state.events.push({id:newId(),actorId:actor(p),action:'partner.submit',projectId:g.projectId,submissionId:submission.id,at:now()});return submissionDTO(submission);});
    },
    async listPartnerSubmissions(p,companyId,projectId){const d=await store.getDirectory();manager(d,p,companyId);const state=await store.getCompany(companyId);return Object.values(state.partnerSubmissions||{}).filter(s=>s.projectId===projectId).map(s=>({...submissionDTO(s),grantId:s.grantId}));},
    async reviewPartnerSubmission(p,companyId,submissionId,input) {
      fields(input,['decision','comment']);if(!['approve','reject'].includes(input.decision))fail(400,'审核动作无效。');
      const comment=input.comment?text(input.comment):'',d=await store.getDirectory();manager(d,p,companyId);const state=await store.getCompany(companyId),s=own(state.partnerSubmissions,id(submissionId));
      if(!s)fail(404);if(s.status!=='pending'||state.projects[s.projectId]?.status==='completed')fail(409,'交付物已审核或项目已结项。');
      s.status=input.decision==='approve'?'approved':'rejected';s.reviewedAt=now();s.reviewedBy=actor(p);s.reviewComment=comment;
      if(s.status==='approved'){const documentId='partner-doc-'+s.id,versionId='partner-version-'+s.id;s.documentId=documentId;s.versionId=versionId;state.documents[documentId]={id:documentId,companyId,projectId:s.projectId,title:s.title,classification:'internal',activeVersionId:null,versions:[{id:versionId,version:1,objectId:s.objectId,title:s.title,filename:s.filename,mimeType:s.mimeType,size:s.size,createdAt:now()}]};}
      state.events.push({id:newId(),actorId:actor(p),action:'partner.review',submissionId,decision:input.decision,at:now()});state.revision++;
      if(!await store.commitCompany(companyId,d.revision,state.revision-1,state))fail(409,'数据或权限已变更。');return submissionDTO(s);
    },
    async downloadSubmission(p,companyId,submissionId) {
      const before=await store.getDirectory();manager(before,p,companyId);const state=await store.getCompany(companyId),s=own(state.partnerSubmissions,id(submissionId));if(!s)fail(404);
      const bytes=await documents.readObject(s.objectId,{companyId,projectId:s.projectId});manager(await store.getDirectory(),p,companyId);
      return {metadata:{mimeType:s.mimeType,filename:s.filename},bytes};
    },
    async auditAccess(p,action,companyId,status) {
      if(typeof store.recordAccess!=='function')fail(503,'访问审计暂不可用。');
      await store.recordAccess({id:newId(),actorId:actor(p),action:'access.'+String(action).slice(0,80),at:now(),...(validId(companyId)?{companyId}:{}),status});return {ok:true};
    }
  };
  const partnerMethods = {
    async listCompanies(p){const {g,state}=await partnerSnapshot(p);return [{companyId:g.companyId,name:state.projects[g.projectId].title,registered:true}];},
    async listProjects(p,c){const {g,state}=await partnerSnapshot(p,c);return [projectDTO(state.projects[g.projectId])];},
    async getProject(p,c,projectId){const {g,state}=await partnerSnapshot(p,c);if(g.projectId!==projectId)fail(404);return projectDTO(state.projects[projectId]);},
    async listRecords(p,c,projectId,type){const {g,state}=await partnerSnapshot(p,c);if(g.projectId!==projectId||(type&&type!=='task'))fail(404);return g.taskIds.flatMap(i=>{const t=own(state.records,i);return t?.projectId===g.projectId&&t.type==='task'?[taskDTO(t,g,state)]:[];});},
    async getRecord(p,c,recordId){const {g,state}=await partnerSnapshot(p,c),t=own(state.records,id(recordId));if(!g.taskIds.includes(recordId)||t?.projectId!==g.projectId||t.type!=='task')fail(404);return taskDTO(t,g,state);},
    async listDocuments(p,c,projectId){const {g,state}=await partnerSnapshot(p,c);if(g.projectId!==projectId)fail(404);const result=[];for(const i of g.documentIds){try{const {doc,v}=partnerDocument(state,g,i);result.push(docDTO(doc,v));}catch(e){if(!(e instanceof BusinessError)||e.status!==404)throw e;}}return result;},
    async getDocument(p,c,documentId){const {g,state}=await partnerSnapshot(p,c),{doc,v}=partnerDocument(state,g,documentId);return docDTO(doc,v);},
    async download(p,c,documentId,versionId){const {g,state}=await partnerSnapshot(p,c,'download'),{doc,v}=partnerDocument(state,g,documentId,versionId);const bytes=await documents.readObject(v.objectId,{companyId:c,projectId:g.projectId,documentId,versionId});const current=await partnerSnapshot(p,c,'download'),after=partnerDocument(current.state,current.g,documentId,versionId);if(after.v.objectId!==v.objectId)fail(409);return {metadata:docDTO(doc,v),bytes};},
    async listPartnerSubmissions(p,c,projectId){const {g,state}=await partnerSnapshot(p,c);if(g.projectId!==projectId)fail(404);return Object.values(state.partnerSubmissions||{}).filter(s=>s.grantId===g.id&&s.identityId===actor(p)).map(submissionDTO);},
    async search(p,c,q){const query=text(q,200).toLowerCase(),{g}=await partnerSnapshot(p,c);const tasks=await partnerMethods.listRecords(p,c,g.projectId),docs=await partnerMethods.listDocuments(p,c,g.projectId);return [...tasks.map(t=>({type:'task',id:t.id,title:t.title,projectId:g.projectId})),...docs.map(t=>({type:'document',id:t.id,title:t.title,projectId:g.projectId}))].filter(t=>t.title.toLowerCase().includes(query));}
  };
  const partnerWrites=new Set(['partnerUpdateProgress','submitPartnerDelivery']);
  return new Proxy({...base,...api},{get(target,key){
    if(key==='subjectForPhone'||key==='loadMemberships'||key==='loadIdentityAccess'||typeof target[key]!=='function')return target[key];
    return async(p,...args)=>{
      const d=await store.getDirectory();enabled(d,p);
      if(['authorizeProposal','recordProposalAccess'].includes(key)&&!p.contextId)return target[key](p,...args);
      let partner=false;
      if(p.contextId?.startsWith('partner:'))partner=true;
      else if(p.contextId){const match=/^member:([A-Za-z0-9._-]+):(sales_manager|customer)$/.exec(p.contextId);const requestedCompany=key==='auditAccess'?args[1]:args[0];if(!match||requestedCompany&&typeof requestedCompany==='string'&&requestedCompany!==match[1])fail(404);if(match[2]==='sales_manager'){const a=own(d.managerAssignments,actor(p));if(!a?.active||!a.companyIds.includes(match[1]))fail(404);}else{const g=own(d.memberGrants,actor(p));if(!g?.active||g.companyId!==match[1])fail(404);}p={...p,identity:{...p.identity,role:match[2]}};}
      else if(p.identity.role==='partner')partner=true;
      if(partner){if(partnerWrites.has(key))return api[key](p,...args);if(partnerMethods[key])return partnerMethods[key](p,...args);if(key==='auditAccess')return api[key](p,...args);fail(404);}
      if(partnerWrites.has(key))fail(404);
      const result=await target[key](p,...args);
      return key==='listCompanies'&&p.contextId?.startsWith('member:')?result.filter(c=>p.contextId.startsWith('member:'+c.companyId+':')):result;
    };
  }});
}
