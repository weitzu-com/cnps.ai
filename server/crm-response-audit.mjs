// Keep the handler alive until the server finishes its response and the audit
// write completes. A closed connection before finish is not a served file.
export function completedResponseAudit(req, res, record) {
  if (req.method !== 'GET' || typeof res.once !== 'function') return Promise.resolve();
  return new Promise(resolve => {
    let finished = false;
    res.once('finish', () => {
      finished = true;
      Promise.resolve().then(record).catch(() => console.warn('CNPS_CRM_RESPONSE_AUDIT_FAILED')).finally(resolve);
    });
    res.once('close', () => { if (!finished) resolve(); });
  });
}
