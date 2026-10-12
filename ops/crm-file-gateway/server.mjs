import http from 'node:http';
import {extractText} from './extraction.mjs';
import { createHash, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { GatewayError, requireValue } from './errors.mjs';
import { createStorage } from './storage.mjs';
import { UUID_RE, MIME_EXTENSIONS, uuid, decodeBase64, checkMagic } from './validation.mjs';

export const MAX_REQUEST_BYTES = 50 * 1024 * 1024;
export const MAX_FILE_BYTES = 37 * 1024 * 1024;
const objectPath = /^\/objects\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\/(?:content|text))?$/;

function key(value, name) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/i.test(value)) {
    throw new Error(`${name} must contain a 32-byte key encoded as 64 hexadecimal characters`);
  }
  return value.toLowerCase();
}

function headers(response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  response.setHeader('Referrer-Policy', 'no-referrer');
}

function json(response, status, body) {
  const bytes = Buffer.from(JSON.stringify(body));
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Content-Length', String(bytes.length));
  response.end(bytes);
}

function readBody(request, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    request.on('data', chunk => {
      if (settled) return;
      size += chunk.length;
      if (size > maxBytes) {
        settled = true;
        chunks.length = 0;
        reject(new GatewayError(413, 'request_too_large'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks));
      }
    });
    request.on('error', () => {
      if (!settled) { settled = true; reject(new GatewayError(400, 'invalid_request')); }
    });
    request.on('aborted', () => {
      if (!settled) { settled = true; reject(new GatewayError(400, 'invalid_request')); }
    });
  });
}

export async function createFileGateway(options) {
  const bearerKey = key(options.bearerKey, 'CRM_FILE_GATEWAY_KEY');
  const encryptionKey = key(options.encryptionKey, 'CRM_FILE_ENCRYPTION_KEY');
  if (bearerKey === encryptionKey) throw new Error('Gateway and encryption keys must be independent');
  const maxRequestBytes = options.maxRequestBytes ?? MAX_REQUEST_BYTES;
  const maxFileBytes = options.maxFileBytes ?? MAX_FILE_BYTES;
  if (!Number.isSafeInteger(maxRequestBytes) || maxRequestBytes < 1 || maxRequestBytes > MAX_REQUEST_BYTES
    || !Number.isSafeInteger(maxFileBytes) || maxFileBytes < 1 || maxFileBytes > MAX_FILE_BYTES) {
    throw new Error('Invalid gateway size limits');
  }
  const storage = await createStorage({ dataDir: options.dataDir ?? '/data', encryptionKey, maxFileBytes });
  const expected = createHash('sha256').update(bearerKey).digest();

  const server = http.createServer({ maxHeaderSize: 16384 }, async (request, response) => {
    headers(response);
    try {
      const auth = request.headers.authorization;
      const match = typeof auth === 'string' ? /^Bearer ([0-9a-f]{64})$/i.exec(auth) : null;
      const presented = createHash('sha256').update(match ? match[1].toLowerCase() : '').digest();
      // Equal-length hashes keep the secret comparison constant-time, including anonymous requests.
      const authorized = timingSafeEqual(expected, presented);
      if (!authorized || !match) {
        response.setHeader('WWW-Authenticate', 'Bearer realm="cnps-file-gateway"');
        response.setHeader('Connection', 'close');
        throw new GatewayError(401, 'unauthorized');
      }
      const rawPath = (request.url ?? '').split('?')[0];
      requireValue(!rawPath.includes('%') && !rawPath.includes('\\'), 400, 'invalid_path');
      const url = new URL(request.url, 'http://127.0.0.1');
      requireValue(url.pathname === rawPath, 400, 'invalid_path');
      if (request.method === 'GET' && rawPath === '/health') {
        requireValue(url.searchParams.size === 0, 400, 'invalid_query');
        return json(response, 200, { status: 'ok' });
      }
      if (request.method === 'POST' && rawPath === '/objects') {
        requireValue(url.searchParams.size === 0, 400, 'invalid_query');
        requireValue(/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers['content-type'] ?? ''),
          415, 'unsupported_content_type');
        const length = request.headers['content-length'];
        if (length !== undefined) {
          requireValue(/^\d+$/.test(length), 400, 'invalid_content_length');
          requireValue(Number(length) <= maxRequestBytes, 413, 'request_too_large');
        }
        const bytes = await readBody(request, maxRequestBytes);
        let body;
        try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
        catch { throw new GatewayError(400, 'invalid_json'); }
        requireValue(body !== null && typeof body === 'object' && !Array.isArray(body), 400, 'invalid_json');
        requireValue(Object.keys(body).length === 5
          && Object.keys(body).every(field => ['companyId', 'projectId', 'filename', 'mimeType', 'base64'].includes(field)),
          400, 'invalid_fields');
        uuid(body.companyId);
        uuid(body.projectId);
        requireValue(typeof body.mimeType === 'string' && Object.hasOwn(MIME_EXTENSIONS, body.mimeType), 415, 'unsupported_mime_type');
        const content = decodeBase64(body.base64, maxFileBytes);
        checkMagic(content, body.mimeType);
        const meta = await storage.put(body, content);
        return json(response, 201, meta);
      }
      const route = objectPath.exec(rawPath);
      if (request.method === 'GET' && route) {
        const entries = Array.from(url.searchParams.entries());
        requireValue(entries.length === 2 && url.searchParams.getAll('companyId').length === 1
          && url.searchParams.getAll('projectId').length === 1
          && entries.every(([name]) => name === 'companyId' || name === 'projectId'), 400, 'invalid_context');
        const context = {
          companyId: uuid(url.searchParams.get('companyId')),
          projectId: uuid(url.searchParams.get('projectId')),
        };
        const { meta, content } = await storage.get(route[1], context);
        if (!route[2]) return json(response, 200, meta);
        if (route[2] === '/text') return json(response, 200, await extractText({content,meta,dataDir:options.dataDir ?? '/data',encryptionKey}));
        response.statusCode = 200;
        response.setHeader('Content-Type', meta.mimeType);
        response.setHeader('Content-Length', String(content.length));
        response.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(meta.filename).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`);
        return response.end(content);
      }
      if (rawPath.startsWith('/objects/') && !UUID_RE.test(rawPath.slice('/objects/'.length))) {
        throw new GatewayError(400, 'invalid_object_path');
      }
      throw new GatewayError(404, 'not_found');
    } catch (error) {
      if (response.writableEnded || response.destroyed) return;
      const status = error instanceof GatewayError ? error.status : 500;
      if (status === 413) response.setHeader('Connection', 'close');
      json(response, status, { error: error instanceof GatewayError ? error.code : 'internal_error' });
    }
  });
  server.headersTimeout = 15000;
  server.requestTimeout = 120000;
  server.keepAliveTimeout = 5000;
  return server;
}

export async function startFileGateway(env = process.env) {
  const host = env.CRM_FILE_HOST ?? '127.0.0.1';
  if (!['127.0.0.1', '::1', '0.0.0.0'].includes(host)) throw new Error('Unsupported gateway host');
  const port = Number(env.CRM_FILE_PORT ?? '3200');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid gateway port');
  const server = await createFileGateway({
    bearerKey: env.CRM_FILE_GATEWAY_KEY,
    encryptionKey: env.CRM_FILE_ENCRYPTION_KEY,
    dataDir: env.CRM_FILE_DATA_DIR ?? '/data',
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await startFileGateway();
  console.log('CNPS file gateway ready');
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
