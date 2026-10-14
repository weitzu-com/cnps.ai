import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startDevCrmServer } from '../scripts/dev-crm.mjs';
import { createDevFixtures, DEV_ACCOUNTS, DEV_OTP } from '../scripts/dev-crm-fixtures.mjs';

async function harness(t) {
  const h = await startDevCrmServer(0), port = h.server.address().port;
  t.after(() => new Promise(resolve => h.server.close(resolve)));
  const request = (path, { method = 'GET', body, cookie = '', headers = {} } = {}) => new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers: {
      Host: `localhost:${port}`, ...(method === 'POST' ? { Origin: `http://localhost:${port}`, 'Content-Type': 'application/json', 'X-CNPS-CRM': '1' } : {}), Cookie: cookie, ...headers
    } }, res => {
      const chunks = []; res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => { const bytes = Buffer.concat(chunks); resolve({ status: res.statusCode, headers: res.headers, bytes, text: bytes.toString(), json: () => JSON.parse(bytes.toString()) }); });
    });
    req.on('error', reject); req.end(payload);
  });
  const login = async phone => {
    const sent = await request('/api/crm', { method: 'POST', body: { action: 'send', phone, consent: true } });
    assert.equal(sent.status, 200, sent.text);
    const challenge = sent.json().challenge, cookie = sent.headers['set-cookie'][0].split(';')[0];
    const verified = await request('/api/crm', { method: 'POST', cookie, body: { action: 'verify', challenge, code: DEV_OTP } });
    assert.equal(verified.status, 200, verified.text);
    assert.match(verified.headers['set-cookie'][0], /^cnps_dev_crm=.*;.*HttpOnly; SameSite=Strict/);
    assert.doesNotMatch(verified.headers['set-cookie'].join(';'), /__Host-|; Secure|Domain=/);
    return verified.headers['set-cookie'][0].split(';')[0];
  };
  return { ...h, port, request, login };
}

test('local server rejects DNS rebinding, foreign origins and forwarded requests before handlers', async t => {
  const h = await harness(t);
  assert.equal(h.server.address().address, '127.0.0.1');
  for (const headers of [
    { Host: 'crm.cnps.ai' }, { Host: `evil.example:${h.port}` },
    { Origin: 'https://crm.cnps.ai' }, { Origin: 'null' },
    { 'Sec-Fetch-Site': 'cross-site' }, { 'X-Forwarded-For': '127.0.0.1' }
  ]) assert.equal((await h.request('/crm', { headers })).status, 403);
  for (const origin of ['http://evil.example', '', `http://127.0.0.1:${h.port}`]) {
    const response = await h.request('/api/crm', { method: 'POST', body: { action: 'send', phone: DEV_ACCOUNTS.admin, consent: true }, headers: { Origin: origin } });
    assert.equal(response.status, 403);
    assert.equal(response.headers['set-cookie'], undefined);
  }
  assert.equal((await h.request('/__dev/health')).json().externalServices, false);
  const loginPage = await h.request('/crm');
  assert.equal(loginPage.status, 200);
  assert.match(loginPage.text, /href="\/__dev\/proposal"/);
  assert.doesNotMatch(loginPage.text, /href="https:\/\/www\.cnps\.ai\/w"/);
  assert.equal((await h.request('/crm/workspace')).status, 302);
});

test('production auth, CRM mutations, file ACL and logout work without inherited credentials or outbound fetch', async t => {
  const originals = new Map(['CNPS_PROPOSAL_SECRET', 'TWENTY_API_KEY', 'UPSTASH_REDIS_REST_URL', 'CRM_AI_API_KEY'].map(key => [key, process.env[key]]));
  for (const key of originals.keys()) process.env[key] = 'must-never-be-used';
  const fetchOriginal = globalThis.fetch; let outboundCalls = 0;
  globalThis.fetch = async () => { outboundCalls++; throw Error('External network forbidden in dev tests'); };
  t.after(() => { globalThis.fetch = fetchOriginal; for (const [key, value] of originals) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  const h = await harness(t);
  assert.notEqual(h.env.CNPS_PROPOSAL_SECRET, 'must-never-be-used');
  assert.deepEqual(Object.keys(h.env).sort(), ['CNPS_CRM_ADMIN_PHONE', 'CNPS_INTERNAL_COMPANY_ID', 'CNPS_PROPOSAL_SECRET']);
  const admin = await h.login(DEV_ACCOUNTS.admin), customer = await h.login(DEV_ACCOUNTS.customer), manager = await h.login(DEV_ACCOUNTS.manager);
  const workspace = await h.request('/crm/workspace', { cookie: admin });
  assert.equal(workspace.status, 200); assert.match(workspace.text, /本地开发演示/); assert.match(workspace.text, /项目与交付/);
  assert.equal((await h.request('/api/crm?view=session', { cookie: admin })).json().identity.role, 'admin');
  const visible = await h.request('/api/crm-workspace?view=companies', { cookie: customer });
  assert.deepEqual(visible.json().data.map(company => company.companyId), ['demo-alpha']);
  assert.equal((await h.request('/api/crm-workspace?view=projects&companyId=demo-beta', { cookie: customer })).status, 404);
  assert.equal((await h.request('/api/crm-workspace?view=contacts&companyId=demo-alpha', { cookie: customer })).status, 404);
  const changed = await h.request('/api/crm-workspace', { method: 'POST', cookie: manager, body: { action: 'createProject', companyId: 'demo-alpha', fields: { title: '开发修改项目' } } });
  assert.equal(changed.status, 200, changed.text);
  const upload = await h.request('/api/crm-workspace', { method: 'POST', cookie: manager, body: { action: 'uploadDocument', companyId: 'demo-alpha', projectId: changed.json().data.id, fields: { title: '新开发资料', filename: 'new.txt', mimeType: 'text/plain', base64: Buffer.from('local synthetic document').toString('base64') } } });
  assert.equal(upload.status, 200, upload.text);
  const fixture = h.projects['demo-alpha'];
  const download = await h.request(`/api/crm-workspace?view=download&companyId=demo-alpha&documentId=${fixture.documentId}&versionId=${fixture.versionId}`, { cookie: customer });
  assert.equal(download.status, 200, download.text); assert.match(download.text, /不包含真实客户数据/);
  assert.equal((await h.request('/api/crm-workspace', { method: 'POST', cookie: customer, body: { action: 'projectAi', companyId: 'demo-alpha', projectId: fixture.projectId, question: '项目如何' } })).status, 503);
  assert.equal((await h.request('/api/crm', { method: 'POST', cookie: customer, body: { action: 'logout' } })).status, 200);
  assert.equal((await h.request('/api/crm?view=session', { cookie: customer })).status, 401);
  assert.equal(outboundCalls, 0);
});

test('restarting the dev runtime resets changes and creates new synthetic secrets', async () => {
  const first = await createDevFixtures(), second = await createDevFixtures();
  const admin = { identityId: first.runtime.service.subjectForPhone(DEV_ACCOUNTS.admin), identity: { role: 'admin' } };
  await first.runtime.service.createCompany(admin, { name: '仅第一进程' });
  assert.notEqual(first.env.CNPS_PROPOSAL_SECRET, second.env.CNPS_PROPOSAL_SECRET);
  assert.equal((await first.runtime.twenty.listCompanies()).length, 4);
  assert.equal((await second.runtime.twenty.listCompanies()).length, 3);
});
