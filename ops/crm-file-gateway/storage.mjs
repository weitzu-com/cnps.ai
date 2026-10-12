import { constants } from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import { GatewayError, requireValue } from './errors.mjs';
import { MIME_EXTENSIONS, uuid, sanitizeFilename } from './validation.mjs';

const MAGIC = Buffer.from('CNPSDOC1');
const MAX_HEADER_BYTES = 4096;
const MAX_METADATA_BYTES = 4096;
const TAG_BYTES = 16;

async function noSymlinkParents(directory) {
  let cursor = path.parse(directory).root;
  for (const part of directory.slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    try {
      const stat = await fs.lstat(cursor);
      requireValue(stat.isDirectory() && !stat.isSymbolicLink(), 403, 'unsafe_storage_path');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

export async function createStorage({ dataDir, encryptionKey, maxFileBytes }) {
  const directory = path.resolve(dataDir);
  await noSymlinkParents(directory);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  await noSymlinkParents(directory);
  await fs.chmod(directory, 0o700);
  const directoryIdentity = await fs.stat(directory);
  const key = Buffer.from(encryptionKey, 'hex');

  async function checkDirectory() {
    await noSymlinkParents(directory);
    const stat = await fs.lstat(directory);
    requireValue(stat.isDirectory() && !stat.isSymbolicLink()
      && stat.ino === directoryIdentity.ino && stat.dev === directoryIdentity.dev
      && (stat.mode & 0o077) === 0, 403, 'unsafe_storage_path');
  }

  async function put({ companyId, projectId, filename, mimeType }, content) {
    await checkDirectory();
    const id = randomUUID();
    const meta = {
      id, companyId: uuid(companyId), projectId: uuid(projectId),
      filename: sanitizeFilename(filename, mimeType), mimeType, size: content.length,
    };
    const iv = randomBytes(12);
    const metadata = Buffer.from(JSON.stringify(meta));
    requireValue(metadata.length <= MAX_METADATA_BYTES, 400, 'invalid_metadata');
    const metadataLength = Buffer.alloc(4);
    metadataLength.writeUInt32BE(metadata.length);
    // Titles and tenant/project metadata are encrypted alongside document bytes.
    const payload = Buffer.concat([metadataLength, metadata, content]);
    const header = Buffer.from(JSON.stringify({ version: 1, id, iv: iv.toString('base64') }));
    requireValue(header.length <= MAX_HEADER_BYTES, 400, 'invalid_metadata');
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(header);
    const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
    const prefix = Buffer.alloc(12);
    MAGIC.copy(prefix);
    prefix.writeUInt32BE(header.length, 8);
    const packed = Buffer.concat([prefix, header, cipher.getAuthTag(), ciphertext]);
    const temporary = path.join(directory, `.upload-${randomUUID()}.tmp`);
    const target = path.join(directory, `${id}.enc`);
    let handle;
    try {
      handle = await fs.open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
      await handle.chmod(0o600);
      await handle.writeFile(packed);
      await handle.sync();
      await handle.close();
      handle = undefined;
      // A hard link publishes the completed object atomically without replacing any existing ID.
      await fs.link(temporary, target);
    } finally {
      if (handle) await handle.close().catch(() => {});
      await fs.unlink(temporary).catch(() => {});
    }
    return meta;
  }

  async function get(id, { companyId, projectId }) {
    uuid(id);
    uuid(companyId);
    uuid(projectId);
    await checkDirectory();
    const file = path.join(directory, `${id}.enc`);
    let handle;
    try {
      const pathStat = await fs.lstat(file);
      requireValue(pathStat.isFile() && !pathStat.isSymbolicLink(), 403, 'unsafe_storage_path');
      handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
      const stat = await handle.stat();
      requireValue(stat.isFile() && stat.ino === pathStat.ino && stat.dev === pathStat.dev
        && (stat.mode & 0o077) === 0, 403, 'unsafe_storage_path');
      requireValue(stat.size >= 12 + TAG_BYTES
        && stat.size <= 12 + MAX_HEADER_BYTES + TAG_BYTES + 4 + MAX_METADATA_BYTES + maxFileBytes,
        500, 'stored_object_invalid');
      const packed = Buffer.alloc(stat.size);
      let offset = 0;
      while (offset < packed.length) {
        const { bytesRead } = await handle.read(packed, offset, packed.length - offset, offset);
        requireValue(bytesRead > 0, 500, 'stored_object_invalid');
        offset += bytesRead;
      }
      const extra = await handle.read(Buffer.alloc(1), 0, 1, stat.size);
      requireValue(extra.bytesRead === 0 && packed.subarray(0, 8).equals(MAGIC), 500, 'stored_object_invalid');
      const headerLength = packed.readUInt32BE(8);
      requireValue(headerLength > 0 && headerLength <= MAX_HEADER_BYTES
        && packed.length >= 12 + headerLength + TAG_BYTES, 500, 'stored_object_invalid');
      const header = packed.subarray(12, 12 + headerLength);
      let envelope;
      try { envelope = JSON.parse(header.toString('utf8')); }
      catch { throw new GatewayError(500, 'stored_object_invalid'); }
      const tagStart = 12 + headerLength;
      const iv = Buffer.from(typeof envelope?.iv === 'string' ? envelope.iv : '', 'base64');
      requireValue(envelope?.version === 1 && envelope.id === id && iv.length === 12, 500, 'stored_object_invalid');
      let payload;
      try {
        const decipher = createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAAD(header);
        decipher.setAuthTag(packed.subarray(tagStart, tagStart + TAG_BYTES));
        payload = Buffer.concat([decipher.update(packed.subarray(tagStart + TAG_BYTES)), decipher.final()]);
      } catch { throw new GatewayError(500, 'stored_object_invalid'); }
      requireValue(payload.length > 4, 500, 'stored_object_invalid');
      const metadataLength = payload.readUInt32BE(0);
      requireValue(metadataLength > 0 && metadataLength <= MAX_METADATA_BYTES
        && payload.length > 4 + metadataLength, 500, 'stored_object_invalid');
      let meta;
      try { meta = JSON.parse(payload.subarray(4, 4 + metadataLength).toString('utf8')); }
      catch { throw new GatewayError(500, 'stored_object_invalid'); }
      requireValue(meta?.id === id && UUIDSafe(meta.companyId) && UUIDSafe(meta.projectId)
        && Object.hasOwn(MIME_EXTENSIONS, meta.mimeType)
        && typeof meta.filename === 'string' && meta.filename === sanitizeFilename(meta.filename, meta.mimeType)
        && Number.isSafeInteger(meta.size) && meta.size > 0 && meta.size <= maxFileBytes,
        500, 'stored_object_invalid');
      const content = payload.subarray(4 + metadataLength);
      requireValue(content.length === meta.size, 500, 'stored_object_invalid');
      requireValue(meta.companyId === companyId && meta.projectId === projectId, 403, 'object_context_mismatch');
      return {
        meta: { id: meta.id, companyId: meta.companyId, projectId: meta.projectId,
          mimeType: meta.mimeType, size: meta.size, filename: meta.filename },
        content,
      };
    } catch (error) {
      if (error.code === 'ENOENT') throw new GatewayError(404, 'object_not_found');
      if (error.code === 'ELOOP') throw new GatewayError(403, 'unsafe_storage_path');
      throw error;
    } finally {
      if (handle) await handle.close().catch(() => {});
    }
  }

  return { put, get };
}

function UUIDSafe(value) {
  try { uuid(value); return true; }
  catch { return false; }
}
