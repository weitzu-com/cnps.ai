import { inflateRawSync } from 'node:zlib';
import { requireValue } from './errors.mjs';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const MIME_EXTENSIONS = Object.freeze({
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'text/plain': '.txt',
  'text/csv': '.csv',
});
const utf8 = new TextDecoder('utf-8', { fatal: true });
const pngMagic = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function uuid(value) {
  requireValue(typeof value === 'string' && UUID_RE.test(value), 400, 'invalid_uuid');
  return value;
}

export function sanitizeFilename(value, mimeType) {
  requireValue(typeof value === 'string' && value.length <= 1000, 400, 'invalid_filename');
  let clean = value.normalize('NFKC')
    .replace(/[\x00-\x1f\x7f\/\\<>:"|?*\u202a-\u202e\u2066-\u2069]/gu, '_')
    .replace(/^[.\s]+|[.\s]+$/gu, '');
  clean = Array.from(clean).slice(0, 180).join('');
  requireValue(clean.length > 0, 400, 'invalid_filename');
  const extension = MIME_EXTENSIONS[mimeType];
  if (!clean.toLowerCase().endsWith(extension)) clean += extension;
  return clean;
}

export function decodeBase64(value, maxFileBytes) {
  requireValue(typeof value === 'string' && value.length > 0 && value.length % 4 === 0
    && /^[A-Za-z0-9+/]*={0,2}$/.test(value), 400, 'invalid_base64');
  requireValue(value.length <= Math.ceil(maxFileBytes / 3) * 4, 413, 'file_too_large');
  const bytes = Buffer.from(value, 'base64');
  requireValue(bytes.length <= maxFileBytes, 413, 'file_too_large');
  requireValue(bytes.toString('base64') === value, 400, 'invalid_base64');
  return bytes;
}

function zipEntries(bytes) {
  // Read ZIP's directory only; never extract paths or inflate arbitrary entries.
  requireValue(bytes.length >= 22 && bytes.readUInt32LE(0) === 0x04034b50, 415, 'file_magic_mismatch');
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (bytes.readUInt32LE(i) === 0x06054b50 && i + 22 + bytes.readUInt16LE(i + 20) === bytes.length) {
      end = i;
      break;
    }
  }
  requireValue(end >= 0, 415, 'invalid_office_file');
  const count = bytes.readUInt16LE(end + 10);
  const length = bytes.readUInt32LE(end + 12);
  let cursor = bytes.readUInt32LE(end + 16);
  requireValue(bytes.readUInt16LE(end + 4) === 0 && bytes.readUInt16LE(end + 6) === 0
    && count === bytes.readUInt16LE(end + 8) && count > 0 && count <= 4096
    && cursor + length === end, 415, 'unsupported_office_archive');
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    requireValue(cursor + 46 <= end && bytes.readUInt32LE(cursor) === 0x02014b50, 415, 'invalid_office_file');
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const next = cursor + 46 + nameLength + extraLength + commentLength;
    requireValue(next <= end && nameLength > 0, 415, 'invalid_office_file');
    let name;
    try { name = utf8.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength)); }
    catch { requireValue(false, 415, 'invalid_office_file'); }
    const flags = bytes.readUInt16LE(cursor + 8);
    const method = bytes.readUInt16LE(cursor + 10);
    const mode = bytes.readUInt32LE(cursor + 38) >>> 16;
    requireValue(!name.startsWith('/') && !name.includes('\\') && !name.includes('\0')
      && !name.split('/').some(part => part === '..') && !entries.has(name)
      && (mode & 0xf000) !== 0xa000 && (flags & 1) === 0 && [0, 8].includes(method), 415, 'unsafe_office_archive');
    entries.set(name, {
      flags, method,
      compressedSize: bytes.readUInt32LE(cursor + 20),
      size: bytes.readUInt32LE(cursor + 24),
      offset: bytes.readUInt32LE(cursor + 42),
      directoryStart: end - length,
    });
    cursor = next;
  }
  requireValue(cursor === end, 415, 'invalid_office_file');
  return entries;
}

function zipEntryBytes(bytes, entry, expectedName) {
  requireValue(entry && entry.size > 0, 415, 'invalid_office_file');
  const offset = entry.offset;
  requireValue(offset + 30 <= entry.directoryStart && bytes.readUInt32LE(offset) === 0x04034b50
    && bytes.readUInt16LE(offset + 6) === entry.flags
    && bytes.readUInt16LE(offset + 8) === entry.method, 415, 'invalid_office_file');
  const nameLength = bytes.readUInt16LE(offset + 26);
  const extraLength = bytes.readUInt16LE(offset + 28);
  const start = offset + 30 + nameLength + extraLength;
  requireValue(start + entry.compressedSize <= entry.directoryStart
    && bytes.subarray(offset + 30, offset + 30 + nameLength).toString('utf8') === expectedName, 415, 'invalid_office_file');
  return bytes.subarray(start, start + entry.compressedSize);
}

function smallZipEntry(bytes, entry, expectedName) {
  requireValue(entry && entry.size <= 262144, 415, 'invalid_office_file');
  const compressed = zipEntryBytes(bytes, entry, expectedName);
  let content;
  try {
    content = entry.method === 0 ? compressed : inflateRawSync(compressed, { maxOutputLength: 262144 });
  } catch { requireValue(false, 415, 'invalid_office_file'); }
  requireValue(content.length === entry.size, 415, 'invalid_office_file');
  return content;
}

export function checkMagic(bytes, mimeType) {
  requireValue(Object.hasOwn(MIME_EXTENSIONS, mimeType), 415, 'unsupported_mime_type');
  let valid = false;
  if (mimeType === 'application/pdf') {
    valid = bytes.length >= 8 && /^%PDF-[12]\.\d/.test(bytes.subarray(0, 8).toString('ascii'));
  } else if (['application/msword','application/vnd.ms-powerpoint'].includes(mimeType)) {
    valid = bytes.length >= 512 && bytes.subarray(0,8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]));
  } else if (mimeType === 'image/png') {
    valid = bytes.length >= 24 && bytes.subarray(0, 8).equals(pngMagic)
      && bytes.subarray(12, 16).toString('ascii') === 'IHDR';
  } else if (mimeType === 'image/jpeg') {
    valid = bytes.length >= 5 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  } else if (mimeType === 'text/plain' || mimeType === 'text/csv') {
    try { valid = bytes.length > 0 && !bytes.includes(0) && utf8.decode(bytes).length > 0; }
    catch { valid = false; }
  } else {
    const isWord = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isSheet = mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const entries = zipEntries(bytes);
    const main = isWord ? 'word/document.xml' : isSheet ? 'xl/workbook.xml' : 'ppt/presentation.xml';
    const contentType = isWord
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'
      : isSheet ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml'
      : 'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml';
    requireValue(entries.has(main) && !Array.from(entries.keys()).some(name => /(?:^|\/)vbaProject\.bin$/i.test(name)), 415, 'file_magic_mismatch');
    const types = smallZipEntry(bytes, entries.get('[Content_Types].xml'), '[Content_Types].xml').toString('utf8');
    zipEntryBytes(bytes, entries.get(main), main);
    valid = types.includes(contentType);
  }
  requireValue(valid, 415, 'file_magic_mismatch');
}
