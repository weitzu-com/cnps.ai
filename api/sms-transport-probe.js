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
  const native = (method = 'GET', family) => => new Promise(resolve => {
    const phases = {};
    const elapsed = () => Date.now() - started;
    const request = https.request({ host: endpoint, path: '/', method, family, agent: false, timeout: 10000 }, response => {
      response.resume();
      resolve({ phases, status: response.statusCode, elapsed: elapsed() });
    });
    request.on('socket', socket => {
      socket.once('lookup', (_error, _address, family) => { phases.dns = elapsed(); phases.family = family; });
      socket.once('connect', () => { phases.tcp = elapsed(); });
      socket.once('secureConnect', () => { phases.tls = elapsed(); });
    });
    request.once('error', error => resolve({ phases, error: ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN'].includes(error.code) ? error.code : 'network', elapsed: elapsed() }));
    request.once('timeout', () => { request.destroy(); resolve({ phases, error: 'timeout', elapsed: elapsed() }); });
    request.end();
  });
  const sdkTransport = async (method = 'GET') => {
    try {
      const response = await httpx.request(`https://${endpoint}/`, { method, connectTimeout: 10000, readTimeout: 10000 });
      await httpx.read(response);
      return { status: response.statusCode, elapsed: Date.now() - started };
    } catch { return { error: 'transport', elapsed: Date.now() - started }; }
  };
  const [direct, transport, directPost, transportPost, ipv4] = await Promise.all([native(), sdkTransport(), native('POST'), sdkTransport('POST'), native('GET', 4)]);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ region: process.env.VERCEL_REGION, direct, transport, directPost, transportPost, ipv4 }));
}
