import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { createFileGateway, MAX_REQUEST_BYTES } from '../server.mjs';

const COMPANY = '11111111-1111-4111-8111-111111111111';
const PROJECT = '22222222-2222-4222-8222-222222222222';
const OTHER = '33333333-3333-4333-8333-333333333333';
const PDF = Buffer.from('%PDF-1.7\nCNPS_TEST_CONFIDENTIAL_539797\n%%EOF\n');

async function fixture(t, options = {}) {
  const temporaryRoot = await fs.realpath(os.tmpdir());
  const directory = await fs.mkdtemp(path.join(temporaryRoot, 'cnps-file-gateway-'));
  const bearerKey = randomBytes(32).toString('hex');
  const encryptionKey = randomBytes(32).toString('hex');
  const server = await createFileGateway({ bearerKey, encryptionKey, dataDir: directory, ...options });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(directory, { recursive: true, force: true });
  });
  const headers = { authorization: `Bearer ${bearerKey}`, 'content-type': 'application/json' };
  const upload = (changes = {}, bytes = PDF) => fetch(`${origin}/objects`, {
    method: 'POST', headers,
    body: JSON.stringify({ companyId: COMPANY, projectId: PROJECT, filename: 'proposal.pdf',
      mimeType: 'application/pdf', base64: bytes.toString('base64'), ...changes }),
  });
  const query = `?companyId=${COMPANY}&projectId=${PROJECT}`;
  return { directory, origin, bearerKey, encryptionKey, headers, upload, query };
}

function rawRequest(origin, requestPath, { method = 'GET', headers = {}, body, chunks } = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request(origin, { path: requestPath, method, headers }, response => {
      const data = [];
      response.on('data', chunk => data.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, bytes: Buffer.concat(data) }));
    });
    request.on('error', reject);
    if (chunks) for (const chunk of chunks) request.write(chunk);
    request.end(body);
  });
}

test('uploads encrypt bytes at rest, enforce permissions, and read metadata/content consistently', async t => {
  const f = await fixture(t);
  const response = await f.upload();
  assert.equal(response.status, 201);
  const meta = await response.json();
  assert.deepEqual(Object.keys(meta).sort(), ['companyId', 'filename', 'id', 'mimeType', 'projectId', 'size']);
  assert.equal(meta.size, PDF.length);
  assert.equal(meta.companyId, COMPANY);
  const stored = await fs.readFile(path.join(f.directory, `${meta.id}.enc`));
  assert.equal(stored.includes(PDF), false);
  assert.equal(stored.includes('CNPS_TEST_CONFIDENTIAL_539797'), false);
  assert.equal(stored.includes('proposal.pdf'), false);
  assert.equal(stored.includes(COMPANY), false);
  assert.equal((await fs.stat(f.directory)).mode & 0o777, 0o700);
  assert.equal((await fs.stat(path.join(f.directory, `${meta.id}.enc`))).mode & 0o777, 0o600);
  const metadata = await fetch(`${f.origin}/objects/${meta.id}${f.query}`, { headers: f.headers });
  assert.equal(metadata.status, 200);
  assert.deepEqual(await metadata.json(), meta);
  const content = await fetch(`${f.origin}/objects/${meta.id}/content${f.query}`, { headers: f.headers });
  assert.equal(content.status, 200);
  assert.deepEqual(Buffer.from(await content.arrayBuffer()), PDF);
  assert.equal(content.headers.get('content-type'), 'application/pdf');
  assert.equal(content.headers.get('cache-control'), 'no-store');
  assert.match(content.headers.get('x-robots-tag'), /noindex/);
  assert.equal(content.headers.get('x-content-type-options'), 'nosniff');
  assert.match(content.headers.get('content-disposition'), /^attachment;/);
});

test('anonymous and invalid bearer requests are rejected for upload and both read endpoints', async t => {
  const f = await fixture(t);
  const meta = await (await f.upload()).json();
  for (const authorization of [undefined, 'Bearer wrong', `Bearer ${'0'.repeat(64)}`]) {
    const headers = authorization ? { authorization } : {};
    for (const route of [`/objects/${meta.id}${f.query}`, `/objects/${meta.id}/content${f.query}`]) {
      assert.equal((await fetch(f.origin + route, { headers })).status, 401);
    }
    assert.equal((await fetch(`${f.origin}/objects`, { method: 'POST', headers, body: '{}' })).status, 401);
  }
});

test('company and project contexts must both match, including content downloads', async t => {
  const f = await fixture(t);
  const meta = await (await f.upload()).json();
  for (const [companyId, projectId] of [[OTHER, PROJECT], [COMPANY, OTHER], [OTHER, OTHER]]) {
    for (const suffix of ['', '/content']) {
      const response = await fetch(`${f.origin}/objects/${meta.id}${suffix}?companyId=${companyId}&projectId=${projectId}`, { headers: f.headers });
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), { error: 'object_context_mismatch' });
    }
  }
});

test('missing, invalid, duplicated, and extra context parameters are rejected', async t => {
  const f = await fixture(t);
  const meta = await (await f.upload()).json();
  for (const query of ['', `?companyId=${COMPANY}`, '?companyId=bad&projectId=bad',
    `${f.query}&companyId=${OTHER}`, `${f.query}&foo=bar`]) {
    assert.equal((await fetch(`${f.origin}/objects/${meta.id}${query}`, { headers: f.headers })).status, 400);
  }
});

test('raw traversal, encoded traversal/separators, and non-UUID object IDs are rejected', async t => {
  const f = await fixture(t);
  const meta = await (await f.upload()).json();
  for (const route of ['/objects/../../etc/passwd', '/objects/%2e%2e%2fetc%2fpasswd',
    `/objects/../objects/${meta.id}${f.query}`, `/objects/${meta.id}%2fcontent${f.query}`,
    '/objects/not-an-id', '/objects/..\\secret']) {
    assert.equal((await rawRequest(f.origin, route, { headers: f.headers })).status, 400);
  }
});

test('a symlink object and a symlink storage directory cannot be read or followed', async t => {
  const f = await fixture(t);
  const meta = await (await f.upload()).json();
  const linkId = randomUUID();
  await fs.symlink(path.join(f.directory, `${meta.id}.enc`), path.join(f.directory, `${linkId}.enc`));
  assert.equal((await fetch(`${f.origin}/objects/${linkId}${f.query}`, { headers: f.headers })).status, 403);
  const linkDir = path.join(f.directory, 'linked-storage');
  await fs.symlink(f.directory, linkDir);
  await assert.rejects(createFileGateway({ bearerKey: f.bearerKey, encryptionKey: f.encryptionKey, dataDir: linkDir }), /unsafe_storage_path/);
});

test('upload validates file MIME, content magic, UUIDs, base64 and field schema', async t => {
  const f = await fixture(t);
  const cases = [
    [{ mimeType: 'text/html' }, PDF, 415],
    [{ mimeType: 'image/png' }, PDF, 415],
    [{}, Buffer.from('<html>invalid pdf</html>'), 415],
    [{ companyId: '../../etc' }, PDF, 400],
    [{ projectId: 'invalid' }, PDF, 400],
    [{ base64: '####' }, PDF, 400],
    [{ base64: 'AB==' }, PDF, 400],
    [{ base64: '' }, PDF, 400],
    [{ id: randomUUID() }, PDF, 400],
    [{ filename: '' }, PDF, 400],
    [{ mimeType: 'text/plain' }, Buffer.from([0xff, 0xff]), 415],
    [{ mimeType: 'text/plain' }, Buffer.from('a\0b'), 415],
  ];
  for (const [change, bytes, status] of cases) {
    assert.equal((await f.upload(change, bytes)).status, status, JSON.stringify(change));
  }
  assert.deepEqual(await fs.readdir(f.directory), []);
});

test('declared and streamed JSON body limits, and decoded file limits, are enforced', async t => {
  const f = await fixture(t, { maxRequestBytes: 1500, maxFileBytes: 512 });
  let response = await rawRequest(f.origin, '/objects', {
    method: 'POST', headers: { ...f.headers, 'content-length': '1501' }, body: '',
  });
  assert.equal(response.status, 413);
  response = await rawRequest(f.origin, '/objects', {
    method: 'POST', headers: f.headers, chunks: [Buffer.alloc(900), Buffer.alloc(900)],
  });
  assert.equal(response.status, 413);
  assert.equal((await f.upload({}, Buffer.concat([PDF, Buffer.alloc(513)]))).status, 413);
  assert.deepEqual(await fs.readdir(f.directory), []);
  assert.equal(MAX_REQUEST_BYTES, 50 * 1024 * 1024);
});

test('each upload receives an immutable new ID and sanitized filename', async t => {
  const f = await fixture(t);
  const first = await (await f.upload({ filename: '../客户/报价\\part?.pdf' })).json();
  const second = await (await f.upload()).json();
  assert.notEqual(first.id, second.id);
  assert.equal(first.filename, '_客户_报价_part_.pdf');
  assert.equal((await fetch(`${f.origin}/objects/${first.id}`, {
    method: 'POST', headers: f.headers, body: '{}',
  })).status, 404);
  assert.deepEqual(Buffer.from(await (await fetch(`${f.origin}/objects/${first.id}/content${f.query}`, { headers: f.headers })).arrayBuffer()), PDF);
  assert.notDeepEqual(await fs.readFile(path.join(f.directory, `${first.id}.enc`)),
    await fs.readFile(path.join(f.directory, `${second.id}.enc`)));
});

test('modified ciphertext or authenticated envelope fails AES-GCM authentication', async t => {
  const f = await fixture(t);
  for (const tamper of ['ciphertext', 'envelope']) {
    const meta = await (await f.upload()).json();
    const filepath = path.join(f.directory, `${meta.id}.enc`);
    const packed = await fs.readFile(filepath);
    if (tamper === 'ciphertext') packed[packed.length - 1] ^= 1;
    else {
      const offset = packed.indexOf(Buffer.from('"iv":"')) + 6;
      assert.ok(offset > 0);
      packed[offset] = packed[offset] === 65 ? 66 : 65;
    }
    await fs.writeFile(filepath, packed);
    const response = await fetch(`${f.origin}/objects/${meta.id}${f.query}`, { headers: f.headers });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'stored_object_invalid' });
  }
});

test('health is authenticated, CORS is closed and browser preflight is refused', async t => {
  const f = await fixture(t);
  assert.equal((await fetch(`${f.origin}/health`)).status, 401);
  const health = await fetch(`${f.origin}/health`, { headers: { ...f.headers, origin: 'https://untrusted.test' } });
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('access-control-allow-origin'), null);
  assert.equal((await fetch(`${f.origin}/objects`, { method: 'OPTIONS', headers: { origin: 'https://untrusted.test' } })).status, 401);
});

test('only valid configuration keys are accepted, and keys must be independent', async () => {
  await assert.rejects(createFileGateway({ bearerKey: 'short', encryptionKey: 'short' }), /32-byte/);
  await assert.rejects(createFileGateway({ bearerKey: 'f'.repeat(64), encryptionKey: 'f'.repeat(64) }), /independent/);
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(files) {
  const locals = [];
  const directory = [];
  let offset = 0;
  for (const [name, value] of Object.entries(files)) {
    const filename = Buffer.from(name);
    const bytes = Buffer.from(value);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc32(bytes), 14);
    local.writeUInt32LE(bytes.length, 18);
    local.writeUInt32LE(bytes.length, 22);
    local.writeUInt16LE(filename.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc32(bytes), 16);
    central.writeUInt32LE(bytes.length, 20);
    central.writeUInt32LE(bytes.length, 24);
    central.writeUInt16LE(filename.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, filename, bytes);
    directory.push(central, filename);
    offset += local.length + filename.length + bytes.length;
  }
  const cd = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

function office(isWord, isSheet = false) {
  const main = isWord ? 'word/document.xml' : isSheet ? 'xl/workbook.xml' : 'ppt/presentation.xml';
  const type = isWord ? 'wordprocessingml.document' : isSheet ? 'spreadsheetml.sheet' : 'presentationml.presentation';
  return zip({
    '[Content_Types].xml': `<Types><Override PartName="/${main}" ContentType="application/vnd.openxmlformats-officedocument.${type}.main+xml"/></Types>`,
    [main]: '<xml>test fixture</xml>',
  });
}

test('TXT, CSV, PNG, JPEG, DOCX, PPTX and XLSX pass format checks and download consistently', async t => {
  const f = await fixture(t);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]);
  const formats = [
    ['text/plain', Buffer.from('客户项目测试 — plain text')],
    ['text/csv', Buffer.from('name,value\n客户,123\n')],
    ['image/png', png],
    ['image/jpeg', jpg],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', office(true)],
    ['application/vnd.openxmlformats-officedocument.presentationml.presentation', office(false)],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', office(false, true)],
  ];
  for (const [mimeType, bytes] of formats) {
    const response = await f.upload({ mimeType, filename: 'test' }, bytes);
    assert.equal(response.status, 201, mimeType);
    const meta = await response.json();
    const content = await fetch(`${f.origin}/objects/${meta.id}/content${f.query}`, { headers: f.headers });
    assert.equal(content.status, 200);
    assert.deepEqual(Buffer.from(await content.arrayBuffer()), bytes);
  }
});

test('arbitrary ZIP and mismatched OOXML types are rejected', async t => {
  const f = await fixture(t);
  const docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  assert.equal((await f.upload({ mimeType: docx }, zip({ 'some-file.txt': 'hello' }))).status, 415);
  assert.equal((await f.upload({ mimeType: docx }, office(false))).status, 415);
  assert.equal((await f.upload({ mimeType: docx }, zip({
    '[Content_Types].xml': 'bad', 'word/document.xml': '<xml/>', '../traversal': 'bad',
  }))).status, 415);
});

test('text indexes stay encrypted, require bearer and enforce company/project even when cached',async t=>{
 const f=await fixture(t);const bytes=Buffer.from('CNPS_PRIVATE_INDEX_BODY_72591 Budget 288000');const uploaded=await f.upload({filename:'source.txt',mimeType:'text/plain'},bytes);const meta=await uploaded.json();
 const address=`${f.origin}/objects/${meta.id}/text`;
 assert.equal((await fetch(address+f.query)).status,401);
 assert.equal((await fetch(address+`?companyId=${OTHER}&projectId=${PROJECT}`,{headers:f.headers})).status,403);
 const response=await fetch(address+f.query,{headers:f.headers});assert.equal(response.status,200);const index=await response.json();assert.equal(index.status,'ready');assert.match(index.segments[0].text,/72591/);
 const cache=await fs.readFile(path.join(f.directory,meta.id+'.kb2.enc'));assert.equal(cache.includes(Buffer.from('72591')),false);assert.equal(cache.includes(Buffer.from(COMPANY)),false);assert.equal((await fs.stat(path.join(f.directory,meta.id+'.kb2.enc'))).mode&0o777,0o600);
 const cached=await fetch(address+f.query,{headers:f.headers});assert.deepEqual(await cached.json(),index);assert.equal((await fetch(address+`?companyId=${COMPANY}&projectId=${OTHER}`,{headers:f.headers})).status,403);
 cache[cache.length-1]^=1;await fs.writeFile(path.join(f.directory,meta.id+'.kb2.enc'),cache);assert.equal((await fetch(address+f.query,{headers:f.headers})).status,503);
});
