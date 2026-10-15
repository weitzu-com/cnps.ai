// Keep the handler alive until the server finishes its response and the audit
// write completes. A closed connection before finish is not a served file.
export function completedResponseAudit(req, res, record) {
  // A client can close while the handler awaits preparation/authorization,
  // before this helper is installed. Those past events will not fire again.
  if (req.method !== 'GET' || typeof res.once !== 'function' || res.destroyed || res.closed) return Promise.resolve();
  return new Promise(resolve => {
    let finished = false, closed = false;
    res.once('finish', () => {
      if (closed) return;
      finished = true;
      Promise.resolve().then(record).catch(() => console.warn('CNPS_CRM_RESPONSE_AUDIT_FAILED')).finally(resolve);
    });
    res.once('close', () => { closed = true; if (!finished) resolve(); });
  });
}
