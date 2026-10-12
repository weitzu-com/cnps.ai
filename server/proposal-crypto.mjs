import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
export function keyBytes(secret) {
  if (!/^[a-f0-9]{64}$/i.test(secret || '')) throw new Error('Invalid proposal secret');
  return Buffer.from(secret, 'hex');
}
export function digest(secret, purpose, value) {
  return createHmac('sha256', keyBytes(secret)).update(`${purpose}\0${value}`).digest('hex');
}
export function encrypt(bytes, secret) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', keyBytes(secret), iv);
  const encrypted = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}
export function decrypt(bytes, secret) {
  const decipher = createDecipheriv('aes-256-gcm', keyBytes(secret), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
}
