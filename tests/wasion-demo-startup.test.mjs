import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('demo functions import without CRM secrets and fail closed instead of crashing at startup', () => {
  const script = `
    import page from './api/crm-wasion-demo-page.js';
    import search from './api/crm-wasion-demo-search.js';
    const response=()=>({headers:{host:'crm.cnps.ai'},setHeader(k,v){this.headers[k]=v},end(body){this.body=body}});
    const pageRes=response();await page({method:'GET',url:'/demo/wasion',headers:{host:'crm.cnps.ai'}},pageRes);
    const postRes=response();await search({method:'POST',url:'/api/crm-wasion-demo-search',headers:{host:'crm.cnps.ai',origin:'https://crm.cnps.ai','x-cnps-crm':'1'},body:{question:'I-110'}},postRes);
    const headRes=response();await search({method:'HEAD',url:'/api/crm-wasion-demo-search',headers:{host:'crm.cnps.ai'}},headRes);
    console.log(JSON.stringify([pageRes,postRes,headRes]));
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: fileURLToPath(new URL('..', import.meta.url)), env: { PATH: process.env.PATH }, encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);
  const responses = JSON.parse(result.stdout);
  assert.deepEqual(responses.map(res => res.statusCode), [503, 503, 405]);
  for (const res of responses) {
    assert.match(res.headers['Cache-Control'], /private, no-store/);
    assert.match(res.headers['X-Robots-Tag'], /noindex/);
    assert.ok(!res.body?.includes('<html'));
    assert.ok(!res.body?.includes('Business storage'));
  }
});
