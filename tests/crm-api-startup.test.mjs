import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('missing CRM runtime configuration returns private JSON rather than a platform function crash', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import handler from './api/crm.js';
    const results = [];
    for (const method of ['GET', 'POST', 'HEAD']) {
      const headers = {}; let output;
      const res = { setHeader(name, value) { headers[name.toLowerCase()] = value; }, end(body) { output = body; } };
      await handler({ method, url: '/api/crm?view=session', headers: {} }, res);
      results.push({ method, status: res.statusCode, headers, output });
    }
    process.stdout.write(JSON.stringify(results));
  `], { cwd: new URL('..', import.meta.url), env: {}, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  for (const response of JSON.parse(result.stdout)) {
    assert.equal(response.status, 503);
    assert.match(response.headers['cache-control'], /private, no-store/);
    assert.match(response.headers['cdn-cache-control'], /no-store/);
    assert.match(response.headers['content-type'], /application\/json/);
    assert.match(response.headers['x-robots-tag'], /noindex/);
    assert.equal(response.headers['set-cookie'], undefined);
    if (response.method === 'HEAD') assert.equal(response.output, undefined);
    else assert.deepEqual(JSON.parse(response.output), { error: '访问服务暂不可用，请稍后重试或联系项目对接人。' });
  }
});
