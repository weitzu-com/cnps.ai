import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {crmWorkspacePage} from '../server/crm-workspace-page.mjs';

function harness({role = 'customer', authenticated = true, approvals = false, registered = true, projectTitle = 'Synthetic project', projectStatus = 'active', records = [], override} = {}) {
  const html = crmWorkspacePage('test-nonce'), ids = new Map(), roots = [], calls = [], timers = new Map();
  let timerId = 0;
  class Element {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.listeners = new Map(); this.attributes = {}; this._text = ''; this._id = ''; this.value = ''; this.hidden = false; this.disabled = false; this.checked = false; }
    set id(value) { this._id = value; ids.set(value, this); }
    get id() { return this._id; }
    set textContent(value) { this._text = String(value); this.children = []; }
    get textContent() { return this._text + this.children.map(item => item.textContent).join(''); }
    get childNodes() { return this.children; }
    get innerHTML() { throw Error('HTML injection is prohibited.'); }
    set innerHTML(_) { throw Error('HTML injection is prohibited.'); }
    appendChild(element) { this.children.push(element); return element; }
    replaceChildren(...children) { const remove = item => { if (item.id && ids.get(item.id) === item) ids.delete(item.id); item.children.forEach(remove); }; this.children.forEach(remove); this.children = children; this._text = ''; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    addEventListener(name, handler) { this.listeners.set(name, handler); }
    focus() { this.focused = true; }
    reset() {}
    showModal() { this.open = true; }
    close() { this.open = false; }
    checkValidity() { return this.id !== 'action-form' || walk(ids.get('dialog-fields')).every(item => (!item.required || !!item.value || item.type === 'checkbox' && item.checked) && (!item.pattern || new RegExp('^(?:'+item.pattern+')$').test(item.value))); }
    reportValidity() { this.invalidReported = true; return this.checkValidity(); }
  }
  function walk(node) { return node ? [node, ...node.children.flatMap(walk)] : []; }
  for (const match of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
    const element = new Element(match[1]); element.id = match[2]; element.hidden = /\bhidden\b/.test(match[0]); roots.push(element);
  }
  const company = {companyId: 'company-A', name: 'Synthetic company', registered};
  const project = {id: 'project-A', companyId: company.companyId, title: projectTitle, objective: 'A real project goal', scope: 'Authorized scope', deliverables: ['Technical document'], processGroup: 'planning', status: projectStatus, version: 3, publication: {version: 1}};
  const documentRow = {id: 'document-A', title: 'Authorized file', projectId: project.id, companyId: company.companyId, versionId: 'version-A', version: 2, filename: 'delivery.pdf', publishedAt: '2026-10-13', status: 'published'};
  const contacts = [{id: 'contact-A', companyId: company.companyId, name: 'Synthetic contact', firstName: 'Synthetic', lastName: 'Contact', email: 'contact@example.test', phone: '18700001111', canLogin: true}, {id: 'contact-no-phone', companyId: company.companyId, name: 'Email-only contact', email: 'only-email@example.test', canLogin: false}];
  const staff = [{id: '00000000-0000-4000-8000-000000000001', companyId: 'internal-company', name: 'Synthetic internal staff', phone: '18700002222', canLogin: true}];
  const state = {company, project, records: structuredClone(records), document: documentRow, contacts};
  const document = {
    getElementById: id => ids.get(id), createElement: tag => new Element(tag),
    querySelectorAll(selector) { const match = selector.match(/^input\[name="([^"]+)"\]:checked$/); if (!match) throw Error('Unsupported selector.'); return walk(ids.get('dialog-fields')).filter(element => element.tagName === 'INPUT' && element.name === match[1] && element.checked); }
  };
  const forbidden = new Proxy({}, {get() { throw Error('Secrets must not be logged or persisted in browser storage.'); }});
  vm.runInNewContext(html.match(/<script nonce="test-nonce">([\s\S]*?)<\/script>/)[1], {
    document, URLSearchParams, AbortController, console: forbidden, localStorage: forbidden, sessionStorage: forbidden,
    FileReader: class { readAsDataURL(file) { this.result = 'data:' + file.type + ';base64,' + file.base64; this.onload(); } },
    location: {replace(value) { state.navigation = value; }},
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); },
    async fetch(url, options = {}) {
      const parsed = new URL(url, 'https://crm.example.test');
      const call = {url, options, view: parsed.searchParams.get('view'), companyId: parsed.searchParams.get('companyId'), projectId: parsed.searchParams.get('projectId'), body: options.body ? JSON.parse(options.body) : undefined}; calls.push(call);
      let response = override ? await override(call, state) : undefined;
      if (!response && parsed.pathname === '/api/crm') response = call.body ? {body: {ok: true}} : !authenticated ? {status: 401, body: {authenticated: false}} : {body: {authenticated: true, identity: {role, phoneMasked: '187****1111', memberships: [{companyId: company.companyId, permissions: approvals ? ['approvals:submit'] : []}]}}};
      if (!response && call.body) {
        if (call.body.action === 'registerCompany') company.registered = true;
        if (call.body.action === 'updateProject') Object.assign(project, call.body.fields);
        if (call.body.action === 'decide') state.records.find(row => row.id === call.body.recordId).status = call.body.fields.decision;
        response = {body: {ok: true, data: {companyId: company.companyId}}};
      }
      if (!response) {
        const data = ({companies: [company], projects: [project], project, records: state.records, documents: [state.document], contacts, staff, members: [], events: []})[call.view];
        if (data === undefined) throw Error('Unexpected request: ' + url);
        response = {body: {ok: true, data}};
      }
      const status = response.status || 200;
      return {status, ok: status >= 200 && status < 300, async json() { return response.body; }};
    }
  });
  return {
    html, state, calls, get: id => ids.get(id), walk,
    async flush() { for (let n = 0; n < 6; n++) await new Promise(resolve => setImmediate(resolve)); },
    async event(id, name) { await ids.get(id).listeners.get(name)?.({preventDefault() {}}); },
    async click(label, root = 'content') { const target = walk(ids.get(root)).find(item => item.tagName === 'BUTTON' && item.textContent === label); assert.ok(target, 'Missing button: ' + label); await target.listeners.get('click')?.({preventDefault() {}}); },
    async openProject() { const target = walk(ids.get('content')).find(item => item.className === 'project-card'); assert.ok(target); await target.listeners.get('click')(); },
    check(name, value) { const target = walk(ids.get('dialog-fields')).find(item => item.tagName === 'INPUT' && item.name === name && item.value === value); assert.ok(target); target.checked = true; },
    pendingTimers: () => timers.size
  };
}

test('workspace markup binds inline assets to CSP nonce and has no hardcoded customer data or unsafe insertion', () => {
  const html = crmWorkspacePage('nonce"<unsafe&');
  assert.match(html, /nonce="nonce&quot;&lt;unsafe&amp;"/);
  assert.match(html, /@media\(min-width:768px\)/);
  assert.match(html, /@media\(min-width:1024px\)/);
  assert.doesNotMatch(html, /innerHTML|localStorage|sessionStorage|console\.|onclick=|<script[^>]*src=/);
  assert.doesNotMatch(html, /(?:^|[^\d])1[3-9]\d{9}(?:[^\d]|$)/);
});

test('anonymous entry requests identity only and never fetches private business information', async () => {
  const h = harness({authenticated: false}); await h.flush();
  assert.equal(h.calls.length, 1);
  assert.equal(h.get('workspace').hidden, true);
  assert.equal(h.get('login-needed').hidden, false);
  assert.equal(h.pendingTimers(), 0);
});

test('customer sees only API-returned company/project data and downloads the exact authorized version', async () => {
  const malicious = '<img src=x onerror=alert(1)>';
  const h = harness({projectTitle: malicious}); await h.flush();
  assert.equal(h.get('show-members').hidden, true);
  assert.equal(h.get('create-company').hidden, true);
  assert.equal(h.get('assign-manager').hidden, true);
  assert.equal(h.get('view-actions').childNodes.length, 0);
  assert.equal(h.get('content').textContent.includes(malicious), true);
  assert.equal(h.walk(h.get('content')).some(element => element.tagName === 'IMG'), false);
  await h.openProject(); await h.click('交付资料');
  const link = h.walk(h.get('content')).find(element => element.tagName === 'A');
  assert.equal(link.href, '/api/crm-workspace?view=download&companyId=company-A&documentId=document-A&versionId=version-A');
  const businessCalls = h.calls.filter(call => call.url.startsWith('/api/crm-workspace') && call.view !== 'companies');
  assert.ok(businessCalls.every(call => call.companyId === 'company-A'));
  assert.equal(h.pendingTimers(), 0);
});

test('customer decision controls require explicit approval permission and submit record version', async () => {
  const records = [{id: 'change-A', type: 'change', title: 'Synthetic change', status: 'requested', clientVisible: true, version: 7}];
  const readOnly = harness({records}); await readOnly.flush(); await readOnly.openProject(); await readOnly.click('变更与验收');
  assert.equal(readOnly.walk(readOnly.get('content')).some(element => element.tagName === 'BUTTON' && element.textContent === '批准'), false);
  const h = harness({records, approvals: true}); await h.flush(); await h.openProject(); await h.click('变更与验收'); await h.click('批准');
  assert.equal(h.get('field-comment').maxLength, 2000);
  h.get('field-comment').value = 'Approved after checking authorized material.';
  await h.event('action-form', 'submit');
  const call = h.calls.find(call => call.body?.action === 'decide');
  assert.deepEqual(call.body, {action: 'decide', companyId: 'company-A', recordId: 'change-A', fields: {decision: 'approved', comment: 'Approved after checking authorized material.', expectedVersion: 7}});
  assert.equal(call.options.headers['X-CNPS-CRM'], '1');
  assert.equal(call.options.credentials, 'same-origin');
});

test('customer approval and rejection bind exactly to the displayed published document versions', async () => {
  for(const [label,decision] of [['批准','approved'],['拒绝','rejected']]){
    const records=[{id:'acceptance-A',type:'acceptance',title:'Review delivery',status:'requested',clientVisible:true,version:4,deliverableDocumentIds:['document-A']}];
    const h=harness({records,approvals:true});await h.flush();await h.openProject();await h.click('变更与验收');await h.click(label);
    assert.match(h.get('dialog-fields').textContent,/本次审批材料版本来自页面中已发布资料/);assert.match(h.get('dialog-fields').textContent,/Authorized file · v2/);
    const material=h.walk(h.get('dialog-fields')).find(item=>item.tagName==='A');assert.match(material.href,/documentId=document-A&versionId=version-A/);
    h.get('field-comment').value='Reviewed this material version.';await h.event('action-form','submit');
    assert.deepEqual(h.calls.find(call=>call.body?.action==='decide').body.fields,{decision,comment:'Reviewed this material version.',expectedVersion:4,expectedDocumentVersions:[{documentId:'document-A',versionId:'version-A'}]});
  }
});

test('manager decision uses active published material and never the latest draft version', async () => {
  const records=[{id:'change-A',type:'change',title:'Review change',status:'requested',version:6,deliverableDocumentIds:['document-A']}];
  const h=harness({role:'sales_manager',records,override(call,state){if(call.view==='documents')return{body:{ok:true,data:[{...state.document,title:'Latest draft title',versionId:'version-draft',version:3,status:'draft',activeVersionId:'version-A',versions:[{...state.document,title:'Reviewed published title'},{...state.document,title:'Latest draft title',versionId:'version-draft',version:3,status:'draft'}]}]}};}});
  await h.flush();await h.openProject();await h.click('变更与验收');await h.click('批准');assert.match(h.get('dialog-fields').textContent,/Reviewed published title · v2/);assert.equal(h.get('dialog-fields').textContent.includes('Latest draft title'),false);
  h.get('field-comment').value='Reviewed published delivery.';await h.event('action-form','submit');assert.deepEqual(h.calls.find(call=>call.body?.action==='decide').body.fields.expectedDocumentVersions,[{documentId:'document-A',versionId:'version-A'}]);
});

test('missing, withdrawn or unpublished linked materials block decisions and ask for a refresh or publication', async () => {
  const records=[{id:'acceptance-A',type:'acceptance',title:'Review material',status:'requested',clientVisible:true,version:5,deliverableDocumentIds:['document-A']}];
  for(const [role,documents] of [['customer',[]],['customer',[{id:'document-A',versionId:'version-A',status:'withdrawn'}]],['sales_manager',[{id:'document-A',versionId:'version-draft',status:'draft',versions:[{versionId:'version-draft',status:'draft'}]}]]]){
    const h=harness({role,records,approvals:true,override:call=>call.view==='documents'?{body:{ok:true,data:documents}}:undefined});await h.flush();await h.openProject();await h.click('变更与验收');await h.click('批准');assert.notEqual(h.get('action-dialog').open,true);assert.match(h.get('message').textContent,/材料缺失或尚未发布.*刷新/);assert.equal(h.calls.some(call=>call.body?.action==='decide'),false);
  }
});

test('a document version change after opening approval keeps the reviewed binding and surfaces server conflict without claiming success', async () => {
  const records=[{id:'acceptance-A',type:'acceptance',title:'Review version',status:'requested',clientVisible:true,version:8,deliverableDocumentIds:['document-A']}];
  const h=harness({records,approvals:true,override:call=>call.body?.action==='decide'?{status:409,body:{error:'审批材料版本已变化，请刷新资料后重新审阅。'}}:undefined});await h.flush();await h.openProject();await h.click('变更与验收');await h.click('批准');
  h.state.document.versionId='version-new';h.state.document.version=3;h.get('field-comment').value='Reviewed version two.';await h.event('action-form','submit');
  assert.deepEqual(h.calls.find(call=>call.body?.action==='decide').body.fields.expectedDocumentVersions,[{documentId:'document-A',versionId:'version-A'}]);assert.match(h.get('dialog-message').textContent,/版本已变化.*刷新/);assert.equal(h.get('action-dialog').open,true);assert.equal(h.get('dialog-submit').disabled,false);assert.equal(h.get('message').textContent.includes('操作已保存'),false);
});

test('assigned manager creates a task with the backend status contract and customer visibility choice', async () => {
  const h = harness({role: 'sales_manager'}); await h.flush(); await h.openProject(); await h.click('WBS与里程碑'); await h.click('新增');
  h.get('field-title').value = 'Synthetic WBS task'; h.get('field-owner').value = 'Synthetic owner'; h.get('field-wbsCode').value = '1.1'; h.get('field-dueDate').value = '2026-11-01'; h.get('field-clientVisible').checked = true;
  await h.event('action-form', 'submit');
  const call = h.calls.find(call => call.body?.action === 'createRecord');
  assert.equal(call.body.type, 'task'); assert.equal(call.body.companyId, 'company-A'); assert.equal(call.body.projectId, 'project-A');
  assert.equal(call.body.fields.status, 'todo'); assert.equal(call.body.fields.wbsCode, '1.1'); assert.equal(call.body.fields.clientVisible, true);
});

test('company member grant uses selected native contact, project and document IDs; email-only contacts cannot log in', async () => {
  const h = harness({role: 'sales_manager'}); await h.flush(); await h.event('show-members', 'click');
  assert.equal(h.get('content').textContent.includes('only-email@example.test'), true);
  assert.equal(h.walk(h.get('content')).filter(element => element.tagName === 'BUTTON' && element.textContent === '开通访问').length, 1);
  await h.click('开通访问');
  const approvalLabels = h.walk(h.get('dialog-fields')).filter(element => element.tagName === 'LABEL' && element.htmlFor === 'field-allowApprovals');
  assert.equal(approvalLabels[0].textContent, '允许对有权查看的变更与验收提交审批决定');
  assert.equal(h.get('field-projectScope').value, 'selected');
  assert.equal(h.get('field-documentScope').value, 'selected');
  h.check('projectIds', 'project-A'); h.check('documentIds', 'document-A');
  await h.event('action-form', 'submit');
  const call = h.calls.find(call => call.body?.action === 'grantMember');
  assert.deepEqual(call.body, {action: 'grantMember', companyId: 'company-A', grant: {contactId: 'contact-A', projectScope: 'selected', projectIds: ['project-A'], documentScope: 'selected', documentIds: ['document-A'], allowApprovals: false}});
});

test('existing native company requires explicit project registration before project APIs are requested', async () => {
  const h = harness({role: 'admin', registered: false}); await h.flush();
  assert.equal(h.calls.some(call => call.view === 'projects'), false);
  await h.click('开通项目管理', 'view-actions'); await h.event('action-form', 'submit');
  assert.ok(h.calls.some(call => call.body?.action === 'registerCompany' && call.body.companyId === 'company-A'));
  assert.ok(h.calls.some(call => call.view === 'projects'));
});

test('business authorization errors show no cached private data and remain recoverable', async () => {
  const h = harness({override: call => call.view === 'projects' ? {status: 403, body: {error: 'Denied'}} : undefined}); await h.flush();
  assert.match(h.get('message').textContent, /没有查看或操作/);
  assert.equal(h.get('content').childNodes.length, 0);
  assert.equal(h.get('refresh').disabled, false);
});

test('decided changes and acceptances expose no content edit; approved changes retain only the explicit implementation action', async () => {
  const h = harness({role: 'sales_manager', records: [{id: 'change-A', type: 'change', title: 'Approved change', status: 'approved', version: 4}]});
  await h.flush(); await h.openProject(); await h.click('变更与验收');
  assert.equal(h.walk(h.get('content')).some(item=>item.tagName==='BUTTON'&&item.textContent==='编辑'),false);
  await h.click('标记已实施'); await h.event('action-form', 'submit');
  const call = h.calls.find(call => call.body?.action === 'updateRecords');
  assert.deepEqual(call.body.updates, [{id: 'change-A', fields: {status: 'implemented'}}]);
  const terminal=harness({role:'sales_manager',records:[['change','rejected'],['change','implemented'],['acceptance','approved'],['acceptance','rejected']].map(([type,status],n)=>({id:'terminal-'+n,type,title:'Decided item '+n,status,version:2}))});await terminal.flush();await terminal.openProject();await terminal.click('变更与验收');
  assert.equal(terminal.walk(terminal.get('content')).some(item=>item.tagName==='BUTTON'&&['编辑','批准','拒绝','标记已实施'].includes(item.textContent)),false);
});

test('completed projects show read-only record controls until an explicit active or planning reopen, while files remain manageable', async () => {
  const records=[{id:'task-A',type:'task',title:'Existing task',status:'done',version:2},{id:'change-A',type:'change',title:'Existing request',status:'requested',clientVisible:true,version:3},{id:'change-approved',type:'change',title:'Decided change',status:'approved',version:4}];
  const h=harness({role:'sales_manager',projectStatus:'completed',records});await h.flush();await h.openProject();await h.click('WBS与里程碑');
  assert.match(h.get('content').textContent,/项目已结项/);assert.match(h.get('content').textContent,/编辑项目.*重新开启/);
  const recordControls=()=>h.walk(h.get('content')).filter(item=>item.tagName==='BUTTON'&&['新增','编辑','批准','拒绝','标记已实施','修订并重新送审'].includes(item.textContent));
  assert.equal(recordControls().length,0);await h.click('变更与验收');assert.equal(recordControls().length,0);
  await h.click('交付资料');assert.ok(h.walk(h.get('content')).some(item=>item.tagName==='BUTTON'&&item.textContent==='上传资料'));
  await h.click('编辑项目');assert.deepEqual(h.get('field-status').children.map(item=>item.value),['planning','active','completed']);
  h.get('field-status').value='active';await h.event('action-form','submit');assert.equal(h.calls.find(call=>call.body?.action==='updateProject').body.fields.status,'active');
  await h.click('变更与验收');assert.ok(recordControls().some(item=>item.textContent==='新增'));assert.ok(recordControls().some(item=>item.textContent==='批准'));assert.ok(recordControls().some(item=>item.textContent==='标记已实施'));
  const customer=harness({projectStatus:'completed',records,approvals:true});await customer.flush();await customer.openProject();await customer.click('变更与验收');
  assert.equal(customer.walk(customer.get('content')).some(item=>item.tagName==='BUTTON'&&['编辑项目','新增','编辑','批准','拒绝'].includes(item.textContent)),false);assert.match(customer.get('content').textContent,/如需重新开启，请联系项目对接人/);
});

test('explicit revision of approved or rejected decision saves new content only as draft and cannot preserve approval', async () => {
  for(const [type,status] of [['change','approved'],['change','rejected'],['acceptance','approved'],['acceptance','rejected']]){
    const h=harness({role:'sales_manager',records:[{id:'decision-A',type,title:'Prior decision',description:'Original content',status,version:5,decision:{comment:'Original decision'}}]});await h.flush();await h.openProject();await h.click('变更与验收');await h.click('修订并重新送审');
    assert.match(h.get('dialog-fields').textContent,/原决定保留在记录中，修订后需重新审批/);assert.equal(h.get('field-status').value,'draft');assert.deepEqual(h.get('field-status').children.map(item=>item.value),['draft']);
    h.get('field-title').value='Revised proposal';h.get('field-description').value='New content for separate approval';h.get('field-status').value='approved';await h.event('action-form','submit');
    const call=h.calls.find(call=>call.body?.action==='updateRecords');assert.equal(call.body.updates[0].id,'decision-A');assert.equal(call.body.updates[0].fields.status,'draft');assert.equal(call.body.updates[0].fields.title,'Revised proposal');assert.equal(Object.hasOwn(call.body.updates[0].fields,'decision'),false);
  }
  const implemented=harness({role:'sales_manager',records:[{id:'implemented-A',type:'change',title:'Implemented change',status:'implemented',version:6}]});await implemented.flush();await implemented.openProject();await implemented.click('变更与验收');assert.equal(implemented.walk(implemented.get('content')).some(item=>item.tagName==='BUTTON'&&item.textContent==='修订并重新送审'),false);
});

test('file upload creates a draft, then requires a separate version publication and withdrawal action', async () => {
  const h = harness({role: 'sales_manager', override(call, state) {
    if (call.body?.action === 'uploadDocument') {
      const previous = {...state.document, status: 'published'};
      const draft = {...state.document, versionId: 'version-new', version: 3, title: call.body.fields.title, filename: call.body.fields.filename, publishedAt: null, status: 'draft'};
      state.document = {...draft, activeVersionId: previous.versionId, versions: [previous, draft]};
      return {body: {ok: true, data: {documentId: draft.id, versionId: draft.versionId, version: draft.version}}};
    }
    if (call.body?.action === 'publishDocument') {
      state.document.versions.forEach(row => row.status = row.versionId === call.body.versionId ? 'published' : 'archived');
      state.document.activeVersionId = call.body.versionId;
      return {body: {ok: true, data: {}}};
    }
  }});
  await h.flush(); await h.openProject(); await h.click('交付资料'); await h.click('上传资料');
  h.get('field-title').value = 'Synthetic reviewed document';
  h.get('field-file').files = [{name: 'synthetic.pdf', type: 'application/pdf', size: 12, base64: Buffer.from('%PDF-test').toString('base64')}];
  h.get('field-file').value = '/fakepath/synthetic.pdf';
  await h.event('action-form', 'submit');
  const upload = h.calls.find(call => call.body?.action === 'uploadDocument');
  assert.equal(upload.body.projectId, 'project-A'); assert.equal(upload.body.companyId, 'company-A');
  assert.deepEqual(upload.body.fields, {title: 'Synthetic reviewed document', filename: 'synthetic.pdf', mimeType: 'application/pdf', base64: Buffer.from('%PDF-test').toString('base64')});
  assert.equal(h.calls.some(call => call.body?.action === 'publishDocument'), false);
  assert.match(h.get('content').textContent, /草稿 · 客户不可见/);
  await h.click('发布此版本'); await h.event('action-form', 'submit');
  const publish = h.calls.find(call => call.body?.action === 'publishDocument');
  assert.deepEqual(publish.body, {action: 'publishDocument', companyId: 'company-A', documentId: 'document-A', versionId: 'version-new'});
  const versionArticle = h.walk(h.get('content')).find(item => item.tagName === 'ARTICLE' && item.textContent.includes('版本 3'));
  const withdraw = h.walk(versionArticle).find(item => item.tagName === 'BUTTON' && item.textContent === '撤回此版本');
  assert.ok(withdraw); await withdraw.listeners.get('click')(); await h.event('action-form', 'submit');
  assert.ok(h.calls.some(call => call.body?.action === 'withdrawDocument' && call.body.versionId === 'version-new'));
});

test('file size guard rejects oversized uploads before transmitting any file content', async () => {
  const h = harness({role: 'sales_manager'}); await h.flush(); await h.openProject(); await h.click('交付资料'); await h.click('上传资料');
  h.get('field-title').value = 'Oversized file'; h.get('field-file').value = '/fakepath/large.pdf';
  h.get('field-file').files = [{name: 'large.pdf', type: 'application/pdf', size: 3 * 1024 * 1024 + 1, base64: 'test'}];
  await h.event('action-form', 'submit');
  assert.equal(h.calls.some(call => call.body?.action === 'uploadDocument'), false);
  assert.match(h.get('dialog-message').textContent, /不超过3MB/);
  assert.equal(h.get('action-dialog').open, true);
});

test('administrator selects verified native internal staff and assigns only selected registered companies', async () => {
  const h=harness({role:'admin'});await h.flush();assert.equal(h.get('assign-manager').hidden,false);await h.event('assign-manager','click');
  const directory=h.calls.find(call=>call.view==='staff');assert.ok(directory);assert.equal(directory.companyId,null);
  assert.equal(h.get('field-staffId').tagName,'SELECT');assert.equal(h.get('field-staffId').children[0].textContent,'Synthetic internal staff · 18700002222');
  h.get('field-staffId').value='18700001111';await h.event('action-form','submit');assert.equal(h.calls.some(call=>call.body?.action==='assignManager'),false);
  h.get('field-staffId').value='00000000-0000-4000-8000-000000000001';await h.event('action-form','submit');
  const call=h.calls.find(call=>call.body?.action==='assignManager');assert.deepEqual(call.body,{action:'assignManager',staffId:'00000000-0000-4000-8000-000000000001',companyIds:['company-A'],active:true});
  const manager=harness({role:'sales_manager'});await manager.flush();assert.equal(manager.get('assign-manager').hidden,true);await manager.event('assign-manager','click');assert.equal(manager.calls.some(call=>call.body?.action==='assignManager'||call.view==='staff'),false);
});

test('empty verified staff directory explains internal contact setup and offers a real contact management entry', async () => {
  const h=harness({role:'admin',override:call=>call.view==='staff'?{body:{ok:true,data:[]}}:undefined});await h.flush();await h.event('assign-manager','click');
  assert.match(h.get('content').textContent,/暂无可分配的内部职员/);assert.match(h.get('content').textContent,/CNPS内部公司/);assert.notEqual(h.get('action-dialog').open,true);
  assert.equal(h.calls.some(call=>call.body?.action==='assignManager'),false);await h.click('前往联系人管理','view-actions');assert.equal(h.calls.some(call=>call.view==='contacts'),true);
});


test('AI output stays visible after dialog closes and never reports a project write',async()=>{
 const h=harness({override:call=>call.body?.action==='projectAi'?{body:{ok:true,data:{answer:'Synthetic AI advice'}}}:undefined});await h.flush();await h.openProject();await h.click('AI 项目助手');h.get('field-question').value='Summarize';await h.event('action-form','submit');
 assert.match(h.get('content').textContent,/Synthetic AI advice/);assert.match(h.get('message').textContent,/AI分析完成/);assert.equal(h.get('action-dialog').open,false);assert.equal(h.calls.some(c=>c.body?.action==='updateProject'),false);
});
test('AI errors stay in dialog without claiming analysis succeeded',async()=>{
 const h=harness({override:call=>call.body?.action==='projectAi'?{status:409,body:{error:'资料或授权已变化'}}:undefined});await h.flush();await h.openProject();await h.click('AI 项目助手');h.get('field-question').value='Summarize';await h.event('action-form','submit');assert.equal(h.get('action-dialog').open,true);assert.match(h.get('dialog-message').textContent,/授权已变化/);
});
