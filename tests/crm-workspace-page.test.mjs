import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {crmWorkspacePage} from '../server/crm-workspace-page.mjs';

function harness({role = 'customer', authenticated = true, approvals = false, registered = true, projectTitle = 'Synthetic project', projectStatus = 'active', records = [], contexts = [], proposals = [], search = '', override, returnTo = '/workspace'} = {}) {
  const html = crmWorkspacePage('test-nonce', { returnTo }), ids = new Map(), roots = [], calls = [], timers = new Map(), windowListeners = new Map();
  let timerId = 0;
  class Element {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.listeners = new Map(); this.attributes = {}; this._text = ''; this.dataset={}; this._id = ''; this.value = ''; this.hidden = false; this.disabled = false; this.checked = false; }
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
    document, window: {addEventListener(name, handler) {windowListeners.set(name, handler);}}, URLSearchParams, crypto:{randomUUID:()=> 'synthetic-request-id'},navigator:{clipboard:{async writeText(value){state.copied=value;}}}, AbortController, console: forbidden, localStorage: forbidden, sessionStorage: forbidden,
    FileReader: class { readAsDataURL(file) { this.result = 'data:' + file.type + ';base64,' + file.base64; this.onload(); } },
    location: {search, replace(value) { state.navigation = value; }},
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); },
    async fetch(url, options = {}) {
      const parsed = new URL(url, 'https://crm.example.test');
      const call = {url, options, view: parsed.searchParams.get('view'), companyId: parsed.searchParams.get('companyId'), projectId: parsed.searchParams.get('projectId'), body: options.body ? JSON.parse(options.body) : undefined}; calls.push(call);
      let response = override ? await override(call, state) : undefined;
      if (!response && parsed.pathname === '/api/crm') response = call.body ? {body: {ok: true}} : !authenticated ? {status: 401, body: {authenticated: false}} : {body: {authenticated: true, identity: {role, contexts, proposals, phoneMasked: '187****1111', memberships: [{companyId: company.companyId, permissions: ['documents:download',...(approvals ? ['approvals:submit'] : [])]}]}}};
      if (!response && call.body) {
        if (call.body.action === 'registerCompany') company.registered = true;
        if (call.body.action === 'updateProject') Object.assign(project, call.body.fields);
        if (call.body.action === 'decide') state.records.find(row => row.id === call.body.recordId).status = call.body.fields.decision;
        response = {body: {ok: true, data: {companyId: company.companyId}}};
      }
      if (!response) {
        const data = ({companies: [company], projects: [project], project, records: state.records, documents: [state.document], contacts, staff, managers:[], members: [], events: [], deliveries: [], partnerSubmissions: [], accessGrants:{partners:[],proposals:[],identities:{}}, sensitiveRequests:[]})[call.view];
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
    async windowEvent(name, event = {}) { await windowListeners.get(name)?.(event); },
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

test('successful logout hides protected content and returns to the original safe workspace route', async () => {
  const returnTo='/workspace?companyId=company-A&deliveryId=delivery-A';
  const h=harness({returnTo});await h.flush();await h.event('logout','click');
  assert.equal(h.get('workspace').hidden,true);assert.equal(h.get('content').textContent,'');
  assert.equal(h.get('identity').textContent,'');assert.equal(h.get('action-dialog').open,false);
  assert.equal(new URL(h.state.navigation,'https://crm.example.test').searchParams.get('returnTo'),returnTo);
  const call=h.calls.find(item=>item.body?.action==='logout');assert.equal(call.options.credentials,'same-origin');assert.equal(call.options.cache,'no-store');
  const invalid=harness({returnTo:'https://evil.example/'});await invalid.flush();await invalid.event('logout','click');assert.equal(invalid.state.navigation,'/');
});

test('failed logout keeps the current page available and never claims the session ended', async () => {
  for(const response of [{status:503,body:{error:'Unavailable'}},{body:{ok:false}}]){
    const h=harness({override:call=>call.body?.action==='logout'?response:undefined});await h.flush();await h.event('logout','click');
    assert.equal(h.state.navigation,undefined);assert.equal(h.get('workspace').hidden,false);assert.equal(h.get('logout').disabled,false);assert.match(h.get('message').textContent,/退出未完成/);
  }
});

test('history restoration rechecks identity, clears revoked content and never requests an SMS', async () => {
  const h=harness({override:(call,state)=>call.view==='session'&&state.revoked?{status:401,body:{authenticated:false}}:undefined});await h.flush();await h.openProject();
  assert.match(h.get('content').textContent,/A real project goal/);await h.windowEvent('pagehide');assert.equal(h.get('workspace').hidden,true);assert.equal(h.get('content').textContent,'');
  h.state.revoked=true;await h.windowEvent('pageshow',{persisted:true});await h.flush();
  assert.equal(h.get('workspace').hidden,true);assert.equal(h.get('login-needed').hidden,false);assert.equal(h.get('login-link').hidden,false);assert.equal(h.get('retry-session').hidden,true);
  assert.equal(h.calls.filter(call=>call.view==='session').length,2);assert.equal(h.calls.some(call=>call.body?.action==='send'),false);
});

test('restored authentication outages keep content hidden until a successful explicit retry', async () => {
  const h=harness({override:(call,state)=>call.view==='session'&&state.outage?{status:503,body:{error:'Unavailable'}}:undefined});await h.flush();h.state.outage=true;
  await h.windowEvent('pagehide');await h.windowEvent('pageshow',{persisted:true});await h.flush();
  assert.equal(h.get('workspace').hidden,true);assert.equal(h.get('login-link').hidden,true);assert.equal(h.get('retry-session').hidden,false);assert.equal(h.get('retry-session').disabled,false);
  h.state.outage=false;await h.event('retry-session','click');await h.flush();assert.equal(h.get('workspace').hidden,false);assert.equal(h.get('login-needed').hidden,true);
  assert.equal(h.calls.some(call=>call.body?.action==='send'),false);assert.equal(h.pendingTimers(),0);
});

test('a delayed history session check cannot restore content after another navigation',async()=>{
  let completeSession;
  const h=harness({override:(call,state)=>call.view==='session'&&state.delay?new Promise(resolve=>{completeSession=resolve;}):undefined});await h.flush();h.state.delay=true;
  await h.windowEvent('pagehide');await h.windowEvent('pageshow',{persisted:true});await h.flush();assert.equal(typeof completeSession,'function');await h.windowEvent('pagehide');
  completeSession({status:200,body:{authenticated:true,identity:{role:'customer',phoneMasked:'187****1111',memberships:[]}}});await h.flush();
  assert.equal(h.get('workspace').hidden,true);assert.equal(h.get('identity').textContent,'');assert.equal(h.get('content').textContent,'');
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
  assert.deepEqual(call.body, {action: 'grantMember', companyId: 'company-A', grant: {operations:['view'], includeFuture:false, contactId: 'contact-A', projectScope: 'selected', projectIds: ['project-A'], documentScope: 'selected', documentIds: ['document-A'], allowApprovals: false}});
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

test('administrator edits one manager relationship for the current customer', async () => {
  const h=harness({role:'admin'});await h.flush();await h.event('assign-manager','click');
  assert.equal(h.calls.find(call=>call.view==='staff').companyId,null);
  assert.equal(h.calls.find(call=>call.view==='managers').companyId,'company-A');
  assert.match(h.get('field-staffId').children[0].textContent,/未获授权/);
  h.get('field-staffId').value='18700001111';await h.event('action-form','submit');assert.equal(h.calls.some(call=>call.body?.action==='setCompanyManager'),false);
  h.get('field-staffId').value='00000000-0000-4000-8000-000000000001';h.get('field-active').checked=true;await h.event('action-form','submit');
  assert.deepEqual(h.calls.find(call=>call.body?.action==='setCompanyManager').body,{action:'setCompanyManager',companyId:'company-A',staffId:'00000000-0000-4000-8000-000000000001',active:true,expectedVersion:0});
  const manager=harness({role:'sales_manager'});await manager.flush();await manager.event('assign-manager','click');assert.equal(manager.calls.some(call=>call.body?.action==='setCompanyManager'||call.view==='staff'),false);
});
test('existing manager authorization is shown and revoked using the loaded version', async () => {
  const h=harness({role:'admin',override:call=>call.view==='managers'?{body:{ok:true,data:[{staffId:'00000000-0000-4000-8000-000000000001',active:true,version:7}]}}:undefined});
  await h.flush();await h.event('assign-manager','click');assert.equal(h.get('field-active').checked,true);assert.match(h.get('field-staffId').children[0].textContent,/已获授权/);
  h.get('field-active').checked=false;await h.event('action-form','submit');
  const call=h.calls.find(call=>call.body?.action==='setCompanyManager');assert.equal(call.body.active,false);assert.equal(call.body.expectedVersion,7);assert.equal(call.body.companyId,'company-A');
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


test('attachment question renders exact version source links and original excerpts',async()=>{
 const h=harness({override:call=>call.body?.action==='knowledgeAnswer'?{body:{ok:true,data:{answer:'Budget evidence [1]',sources:[{sourceId:1,documentId:'document-A',versionId:'version-A',version:2,filename:'delivery.pdf',location:{kind:'page',number:9},excerpt:'Exact original budget'}],coverage:[{filename:'delivery.pdf',status:'ready'}]}}}:undefined});await h.flush();await h.openProject();await h.click('资料正文问答');h.get('field-question').value='Budget';await h.event('action-form','submit');assert.equal(h.get('action-dialog').open,false);assert.match(h.get('content').textContent,/Exact original budget/);const link=h.walk(h.get('content')).find(x=>x.tagName==='A'&&x.textContent.includes('[1]'));assert.match(link.href,/documentId=document-A&versionId=version-A/);assert.match(link.textContent,/PDF页 9/);assert.deepEqual(h.calls.find(c=>c.body?.action==='knowledgeAnswer').body.documentIds,['document-A']);
});

test('OCR citations preserve image region and confidence with protected original link',async()=>{
 const h=harness({override:call=>call.body?.action==='knowledgeAnswer'?{body:{ok:true,data:{answer:'Screenshot says 120990万 [1]',sources:[{sourceId:1,documentId:'document-A',versionId:'version-A',version:2,filename:'customer.png',location:{kind:'image',number:1,method:'ocr',confidence:94,box:[50,330,280,110]},excerpt:'注册资本 120990万人民币'}],coverage:[{filename:'customer.png',status:'ready',ocr:true}]}}}:undefined});await h.flush();await h.openProject();await h.click('资料正文问答');h.get('field-question').value='capital';await h.event('action-form','submit');assert.match(h.get('content').textContent,/OCR识别.*94%.*50,330,280,110/);const a=h.walk(h.get('content')).find(x=>x.tagName==='A'&&x.textContent.includes('[1]'));assert.match(a.href,/versionId=version-A/);assert.match(a.textContent,/图片 1/);
});

test('legacy DOC and PPT appear as supported uploads and remain unpublished drafts',async()=>{
 for(const [filename,mimeType] of [['sample.doc','application/msword'],['sample.ppt','application/vnd.ms-powerpoint']]){
 const h=harness({role:'sales_manager'});await h.flush();await h.openProject();await h.click('交付资料');await h.click('上传资料');h.get('field-title').value='Synthetic legacy';const file=h.get('field-file');assert.match(file.accept,/\.doc,/);assert.match(file.accept,/\.ppt,/);file.value=filename;file.files=[{name:filename,type:mimeType,size:8,base64:Buffer.from('mockdata').toString('base64')}];await h.event('action-form','submit');const call=h.calls.find(c=>c.body?.action==='uploadDocument');assert.equal(call.body.fields.mimeType,mimeType);assert.equal(h.calls.some(c=>c.body?.action==='publishDocument'),false);
 }
});


test('delivery UI only managers create, scopes choices, copies actual delivery text without reporting sent',async()=>{
 const delivery={id:'delivery-one',createdAt:1,documents:[{documentId:'document-one',versionId:'version-one',filename:'delivery.pdf',version:1}],message:'Synthetic delivery text',link:'https://crm.cnps.ai/workspace?companyId=company-one&deliveryId=delivery-one',downloads:[],sms:{status:'not_sent'}};
 const h=harness({role:'sales_manager',override:async call=>{
 if(call.view==='deliveries')return{body:{ok:true,data:[delivery]}};if(call.body?.action==='sendDeliverySms')return{body:{ok:true,data:{status:'unavailable',message:'通知模板尚未配置'}}};
 }});await h.flush();await h.openProject();await h.flush();await h.click('交付与通知');await h.flush();
 await h.click('复制微信文案');await h.flush();assert.equal(h.state.copied,delivery.message);
 assert.ok(h.calls.some(c=>c.body?.action==='recordDelivery'&&c.body.kind==='copy'));
 assert.match(h.get('message').textContent,/复制不代表已发送/);
 await h.click('发送短信通知');assert.equal(h.get('dialog-submit').textContent,'发送短信');await h.event('action-form','submit');await h.flush();assert.equal(h.get('message').textContent,'通知模板尚未配置');
 const customer=harness();await customer.flush();await customer.openProject();await customer.flush();
 assert.ok(!customer.walk(customer.get('content')).some(e=>e.tagName==='BUTTON'&&e.textContent==='交付并通知'));
});

test('delivery email action records provider submission and disables repeated sending without marking customer viewing',async()=>{
 const delivery={id:'delivery-mail',createdAt:1,documents:[],message:'Synthetic delivery',link:'https://crm.cnps.ai/workspace',downloads:[],sms:{status:'not_sent'},viewedAt:null};
 const h=harness({role:'sales_manager',override:async call=>{
  if(call.view==='deliveries')return{body:{ok:true,data:[delivery]}};
  if(call.body?.action==='sendDeliveryNotification'){assert.equal(call.body.channel,'email');delivery.email={status:'submitted'};return {body:{ok:true,data:{status:'submitted',message:'邮件已被供应商接受；需查询回执确认投递。'}}};}
 }});await h.flush();await h.openProject();await h.flush();await h.click('交付与通知');await h.flush();await h.click('发送邮件通知');await h.flush();
 assert.match(h.get('message').textContent,/需查询回执/);const button=h.walk(h.get('content')).find(e=>e.tagName==='BUTTON'&&e.textContent==='发送邮件通知');assert.equal(button.disabled,true);assert.equal(delivery.viewedAt,null);
 assert.ok(!h.calls.some(c=>c.body?.action==='recordDelivery'&&c.body.kind==='view'));
});

test('partner workspace exposes assigned tasks and submissions without AI, permissions or customer controls',async()=>{
 const contexts=[{id:'partner:grant-A',role:'partner',companyId:'company-A',projectId:'project-A',permissions:['view','submit','progress']}];
 const h=harness({role:'partner',contexts,records:[{id:'task-A',projectId:'project-A',type:'task',title:'Assigned delivery',description:'Approved brief'}]});await h.flush();
 assert.equal(h.get('show-access').hidden,true);assert.equal(h.get('show-members').hidden,true);await h.openProject();await h.flush();
 const controls=h.walk(h.get('content')).filter(e=>e.tagName==='BUTTON').map(e=>e.textContent);
 assert.ok(controls.includes('更新进展'));assert.ok(!controls.includes('AI 项目助手'));assert.ok(!controls.includes('资料正文问答'));
 assert.ok(!h.walk(h.get('content')).some(e=>e.tagName==='A'));assert.ok(h.get('content').textContent.includes('我的交付物'));
 for(const call of h.calls.filter(c=>c.url.startsWith('/api/crm-workspace')))assert.equal(new URL(call.url,'https://example.test').searchParams.get('contextId'),'partner:grant-A');
 await h.click('更新进展');h.get('field-status').value='in_progress';h.get('field-comment').value='Preparing';await h.event('action-form','submit');
 const sent=h.calls.find(c=>c.body?.action==='partnerUpdateProgress');assert.equal(sent.body.contextId,'partner:grant-A');assert.equal(sent.body.taskId,'task-A');assert.deepEqual(sent.body.fields,{status:'in_progress',comment:'Preparing'});
});
test('admin access page provides independent proposal grants with view-only defaults',async()=>{
 const h=harness({role:'admin'});await h.flush();await h.event('show-access','click');await h.flush();await h.click('授予方案权限','view-actions');
 assert.equal(h.get('field-download').checked,false);h.get('field-phone').value='18700001111';await h.event('action-form','submit');
 const sent=h.calls.find(c=>c.body?.action==='grantProposal');assert.deepEqual(sent.body.fields,{phone:'18700001111',proposalId:'wasion-web-v1',operations:['view'],assetIds:[],expiresAt:null});
});
test('switching an explicit access context includes the selected context in all subsequent data calls',async()=>{
 const contexts=[{id:'member:company-A:sales_manager',role:'sales_manager',companyId:'company-A',permissions:[]},{id:'partner:grant-A',role:'partner',companyId:'company-A',permissions:['view']}];
 const h=harness({role:'unassigned',contexts});await h.flush();assert.equal(h.get('show-members').hidden,false);
 h.get('context-select').value='partner:grant-A';await h.event('context-select','change');await h.flush();assert.equal(h.get('show-members').hidden,true);assert.equal(h.get('show-access').hidden,true);
 const last=h.calls.filter(c=>c.view==='projects').at(-1);assert.equal(new URL(last.url,'https://example.test').searchParams.get('contextId'),'partner:grant-A');
});

test('authorized project preview stays visible across project tabs, and unsafe destinations are ignored', async () => {
 const h=harness({override(call,state){if(call.view==='project')return {body:{ok:true,data:{...state.project,previews:[{title:'Website preview',href:'/demo/wasion',description:'Review and feedback'}, {title:'Unsafe',href:'javascript:alert(1)'}]}}};}});
 await h.flush();await h.openProject();
 for(const tab of ['项目概览','交付资料','风险与问题']){
  await h.click(tab);const links=h.walk(h.get('content')).filter(x=>x.tagName==='A'&&x.textContent==='打开演示网站');
  assert.equal(links.length,1);assert.equal(links[0].href,'/demo/wasion');assert.ok(!h.get('content').textContent.includes('Unsafe'));
 }
 const other=harness();await other.flush();await other.openProject();assert.ok(!other.get('content').textContent.includes('打开演示网站'));
});
test('project deep link selects the authorized company and opens its project; unknown company fetches no project',async()=>{
 const h=harness({search:'?companyId=company-A&projectId=project-A'});await h.flush();assert.equal(h.get('view-title').textContent,'Synthetic project');
 const denied=harness({search:'?companyId=company-B&projectId=project-B'});await denied.flush();assert.equal(denied.calls.some(c=>c.view==='project'),false);assert.equal(denied.get('login-needed').hidden,false);
});

test('company profile navigation is limited to staff and renders missing fields without inventing legal identity',async()=>{
 const profile={version:0,companyName:'Synthetic company',data:{legalName:'',creditCode:'',registeredAddress:'',businessPhone:'',website:'',invoice:{type:'digital_general',title:'',taxId:'',address:'',phone:'',bankName:'',bankAccount:'',email:''},addresses:[]},issues:['企业全称待补充']};
 const h=harness({role:'sales_manager',override:call=>call.url?.includes('view=customerProfile')?{status:200,body:{ok:true,data:profile}}:undefined});await h.flush();assert.equal(h.get('show-profile').hidden,false);await h.event('show-profile','click');await h.flush();assert.match(h.get('content').textContent,/企业基本信息/);assert.match(h.get('content').textContent,/企业全称待补充/);
 const customer=harness();await customer.flush();assert.equal(customer.get('show-profile').hidden,true);
});

test('company deep links select a matching authorized context and display company names',async()=>{
 const h=harness({role:'sales_manager',search:'?companyId=company-A&projectId=project-A',contexts:[{id:'member:B',companyId:'company-B',role:'sales_manager',companyName:'Company B'},{id:'member:A',companyId:'company-A',role:'sales_manager',companyName:'Company A'}]});
 await h.flush();
 assert.equal(h.get('context-select').value,'member:A');
 assert.match(h.get('context-select').textContent,/Company A/);
 assert.match(h.get('context-select').textContent,/Company B/);
});

test('proposal-only identities leave the company workspace without fetching company data',async()=>{
 const h=harness({role:'proposal_viewer',proposals:[{id:'wasion-web-v1'}]});await h.flush();
 assert.equal(h.state.navigation,'/w');assert.equal(h.calls.some(c=>c.view==='companies'),false);assert.equal(h.get('workspace').hidden,true);
});
