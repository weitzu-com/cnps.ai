import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await cp('site', 'dist', { recursive: true });
console.log('CNPS FastGPT static content ready.');
