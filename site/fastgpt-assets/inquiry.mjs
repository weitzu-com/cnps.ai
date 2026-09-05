export const consentText = 'I agree that CNPS may store and process my details in HubSpot to respond to this pilot inquiry. This does not subscribe me to marketing.';
export const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'source', 'content', 'case'];
export const workflows = {
  'technical-knowledge': 'Technical knowledge',
  'support-triage': 'Support and ticket triage',
  'rfq-intake': 'RFQ intake',
  'another-workflow': 'Another business workflow',
};
export const clean = (value, max = 300) => String(value || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, max).trim();
export function sanitizeTracking(input = {}) {
  return Object.fromEntries(trackingKeys.filter(key => /^[a-zA-Z0-9_.-]{1,80}$/.test(input[key] || '')).map(key => [key, input[key]]));
}
export function buildBrief(values, tracking = {}) {
  const attribution = Object.entries(sanitizeTracking(tracking)).map(([key, value]) => `${key}: ${value}`).join('\n');
  return `Hello CNPS,\n\nI would like to discuss a FastGPT implementation pilot.\n\nName: ${clean(values.name, 100)}\nWork email: ${clean(values.email, 254)}\nCompany: ${clean(values.company, 150)}\nCountry / region: ${clean(values.region, 100)}\nWorkflow: ${Object.hasOwn(workflows, values.workflow) ? workflows[values.workflow] : 'Another business workflow'}\n\nWhat we would like to improve:\n${clean(values.need, 1600)}\n\nSystems and preferred timeline:\n${clean(values.systems) || 'To discuss'}\n\nPlease contact me to discuss scope, data requirements and an acceptance plan.\n\nPrepared at https://www.cnps.ai/fastgpt/contact/\n${attribution}`;
}
export function validateConfig(config) {
  if (!/^[1-9]\d*$/.test(config?.portalId || '') || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(config?.formId || '')) throw new Error('unconfigured');
  const names = ['name', 'email', 'company', 'region', 'message', 'subject'].map(key => config.fields?.[key]);
  if (names.some(name => !/^[a-z][a-z0-9_]{0,99}$/.test(name || '')) || new Set(names).size !== names.length) throw new Error('invalid-fields');
  return config;
}
export function buildSubmission(values, tracking, {pageUri, pageName}, config) {
  validateConfig(config);
  if (values.consent !== true || !Object.hasOwn(workflows, values.workflow) || !clean(values.name, 100) || !clean(values.company, 150) || !clean(values.region, 100) || clean(values.need, 1600).length < 15 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(values.email, 254))) throw new Error('invalid-inquiry');
  const safeTracking = sanitizeTracking(tracking);
  const uri = new URL(pageUri);
  uri.search = ''; uri.hash = '';
  for (const [key, value] of Object.entries(safeTracking)) uri.searchParams.set(key, value);
  const fieldValues = {name: clean(values.name, 100), email: clean(values.email, 254), company: clean(values.company, 150), region: clean(values.region, 100), subject: `FastGPT pilot inquiry — ${clean(values.company, 100)}`, message: buildBrief(values, safeTracking) + `\n\nPrivacy acknowledgment: ${consentText}`};
  return {
    fields: Object.entries(fieldValues).map(([key, value]) => ({objectTypeId: '0-1', name: config.fields[key], value})),
    context: {pageUri: uri.href, pageName: clean(pageName, 200)},
    legalConsentOptions: {consent: {consentToProcess: true, text: consentText, communications: []}},
  };
}
export async function submitInquiry(config, payload, {fetchImpl = fetch, timeoutMs = 12000} = {}) {
  validateConfig(config);
  const controller = new AbortController();
  let timer;
  try {
    const request = fetchImpl(`https://api.hsforms.com/submissions/v3/integration/submit/${config.portalId}/${config.formId}`, {
      method: 'POST', mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer',
      headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload), signal: controller.signal,
    });
    const response = await Promise.race([request, new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, timeoutMs);
    })]);
    if (!response.ok) throw new Error(`hubspot-${response.status}`);
    // HubSpot HTML / redirect instructions are never inserted into this page.
    return {submitted: true};
  } finally { clearTimeout(timer); }
}
