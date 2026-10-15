import https from 'node:https';
import httpx from 'httpx';

// Temporary preview-only, credential-free probe. Never invokes an SMS action.
const endpoint = 'dypnsapi.aliyuncs.com';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (process.env.VERCEL_ENV !== 'preview' || req.method !== 'GET') {
    res.statusCode = 404;
    return res.end();
  }
  const started = Date.now();
  const native = () => new Promise(resolve => {
    const phases = {};
    const elapsed = () => Date.now() - started;
    const request = https.get({ host: endpoint, path: '/', agent: false, timeout: 10000 }, response => {
      response.resume();
      resolve({ phases, status: response.statusCode, elapsed: elapsed() });
    });
    request.on('socket', socket => {
      socket.once('lookup', () => { phases.dns = elapsed(); });
      socket.once('connect', () => { phases.tcp = elapsed(); });
      socket.once('secureConnect', () => { phases.tls = elapsed(); });
    });
    request.once('error', error => resolve({ phases, error: ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN'].includes(error.code) ? error.code : 'network', elapsed: elapsed() }));
    request.once('timeout', () => { request.destroy(); resolve({ phases, error: 'timeout', elapsed: elapsed() }); });
  });
  const sdkTransport = async () => {
    try {
      const response = await httpx.request(`https://${endpoint}/`, { connectTimeout: 10000, readTimeout: 10000 });
      await httpx.read(response);
      return { status: response.statusCode, elapsed: Date.now() - started };
    } catch { return { error: 'transport', elapsed: Date.now() - started }; }
  };
  const [direct, transport] = await Promise.all([native(), sdkTransport()]);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ region: process.env.VERCEL_REGION, direct, transport }));
}
