// Coarse private-response diagnostics: fixed phase names and milliseconds only.
// No identities, resource names, queries, credentials or content are included.
export function createRequestTiming(res) {
  const started = performance.now(), phases = new Map();
  return async function timed(name, fn) {
    const at = performance.now();
    try { return await fn(); }
    finally {
      phases.set(name, (phases.get(name) || 0) + performance.now() - at);
      if (!res.headersSent) res.setHeader('Server-Timing', [...phases, ['total', performance.now() - started]]
        .map(([key, ms]) => `${key};dur=${ms.toFixed(1)}`).join(', '));
    }
  };
}
