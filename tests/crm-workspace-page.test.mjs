import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {crmWorkspacePage} from '../server/crm-workspace-page.mjs';

function harness({role = 'customer', authenticated = true, approvals = false, registered = true, projectTitle = 'Synthetic project', records = [], override} = {}) {
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
  const project = {id: 'project-A', companyId: company.companyId, title: projectTitle, objective: 'A real project goal', scope: 'Authorized scope', deliverables: ['Technical document'], processGroup: 'planning', status: 'active', version: 3, publication: {version: 1}};
  const documentRow = {id: 'document-A', title: 'Authorized file', projectId: project.id, companyId: company.companyId, versionId: 'version-A', version: 2, filename: 'delivery.pdf', publishedAt: '2026-10-13'};
  const contacts = [{id: 'contact-A', companyId: company.companyId, name: 'Synthetic contact', firstName: 'Synthetic', lastName: 'Contact', email: 'contact@example.test', phone: '18700001111', canLogin: true}, {id: 'contact-no-phone', companyId: company.companyId, name: 'Email-only contact', email: 'only-email@example.test', canLogin: false}];
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
        if (call.body.action === 'decide') state.records.find(row => row.id === call.body.recordId).status = call.body.fields.decision;
        response = {body: {ok: true, data: {companyId: company.companyId}}};
      }
      if (!response) {
        const data = ({companies: [company], projects: [project], project, records: state.records, documents: [state.document], contacts, members: [], events: []})[call.view];
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

test('approved changes cannot be changed through a draft approval dropdown and have an explicit implementation action', async () => {
  const h = harness({role: 'sales_manager', records: [{id: 'change-A', type: 'change', title: 'Approved change', status: 'approved', version: 4}]});
  await h.flush(); await h.openProject(); await h.click('变更与验收'); await h.click('编辑');
  assert.equal(h.get('field-status'), undefined);
  await h.event('dialog-cancel', 'click'); await h.click('标记已实施'); await h.event('action-form', 'submit');
  const call = h.calls.find(call => call.body?.action === 'updateRecords');
  assert.deepEqual(call.body.updates, [{id: 'change-A', fields: {status: 'implemented'}}]);
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

test('administrator explicitly assigns native internal staff UUID to selected registered companies; phone never grants manager access', async () => {
  const h=harness({role:'admin'});await h.flush();assert.equal(h.get('assign-manager').hidden,false);await h.event('assign-manager','click');
  h.get('field-staffId').value='18700001111';await h.event('action-form','submit');assert.equal(h.calls.some(call=>call.body?.action==='assignManager'),false);
  h.get('field-staffId').value='00000000-0000-4000-8000-000000000001';await h.event('action-form','submit');
  const call=h.calls.find(call=>call.body?.action==='assignManager');assert.deepEqual(call.body,{action:'assignManager',staffId:'00000000-0000-4000-8000-000000000001',companyIds:['company-A'],active:true});
  const manager=harness({role:'sales_manager'});await manager.flush();assert.equal(manager.get('assign-manager').hidden,true);await manager.event('assign-manager','click');assert.equal(manager.calls.some(call=>call.body?.action==='assignManager'),false);
});
