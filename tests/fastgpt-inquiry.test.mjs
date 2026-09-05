import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBrief,
  buildSubmission,
  clean,
  consentText,
  sanitizeTracking,
  submitInquiry,
  validateConfig,
} from '../site/fastgpt-assets/inquiry.mjs';

const config = {
  portalId: '123456',
  formId: '12345678-1234-1234-1234-123456789abc',
  fields: {name: 'firstname', email: 'email', company: 'company', region: 'country', subject: 'subject', message: 'message'},
};
const values = {
  name: 'Alex Example',
  email: 'alex@example.com',
  company: 'Example Manufacturing',
  region: 'United Kingdom',
  workflow: 'technical-knowledge',
  need: 'Find reliable answers in approved maintenance manuals.',
  systems: 'Document store and CRM; pilot next quarter',
  consent: true,
};
const tracking = {
  utm_source: 'newsletter',
  utm_medium: 'email',
  utm_campaign: 'fastgpt-pilot',
  utm_content: 'autumn',
  utm_term: 'knowledge',
  source: 'fastgpt-solution',
  content: 'technical-knowledge-hero',
  case: 'reference-example',
};
const page = {pageUri: 'https://www.cnps.ai/fastgpt/contact/', pageName: 'Discuss a FastGPT pilot'};
const submission = (overrides = {}, attribution = tracking, context = page) => buildSubmission({...values, ...overrides}, attribution, context, config);

test('the HubSpot payload retains every existing inquiry field and attribution', () => {
  const payload = submission();
  const fields = Object.fromEntries(payload.fields.map(field => [field.name, field.value]));
  assert.deepEqual(Object.keys(fields).sort(), ['company', 'country', 'email', 'firstname', 'message', 'subject']);
  assert.equal(fields.firstname, values.name);
  assert.equal(fields.email, values.email);
  assert.equal(fields.company, values.company);
  assert.equal(fields.country, values.region);
  assert.equal(fields.subject, `FastGPT pilot inquiry — ${values.company}`);
  for (const text of [values.name, values.email, values.company, values.region, 'Technical knowledge', values.need, values.systems]) {
    assert.ok(fields.message.includes(text), `The brief must retain ${text}`);
  }
  for (const [key, value] of Object.entries(tracking)) {
    assert.ok(fields.message.includes(`${key}: ${value}`));
    assert.equal(new URL(payload.context.pageUri).searchParams.get(key), value);
  }
});

test('the email fallback brief is complete and supports an omitted optional field', () => {
  const brief = buildBrief({...values, systems: ''}, tracking);
  assert.ok(brief.includes(values.need));
  assert.ok(brief.includes('Systems and preferred timeline:\nTo discuss'));
  assert.ok(brief.includes('Prepared at https://www.cnps.ai/fastgpt/contact/'));
  assert.ok(brief.includes('content: technical-knowledge-hero'));
});

test('submission requires explicit processing consent and never enrolls in marketing', () => {
  for (const consent of [false, undefined, 'true', 'on', 1]) {
    assert.throws(() => submission({consent}), /invalid-inquiry/);
  }
  const consent = submission().legalConsentOptions.consent;
  assert.equal(consent.consentToProcess, true);
  assert.equal(consent.text, consentText);
  assert.match(consent.text, /HubSpot/);
  assert.match(consent.text, /does not subscribe me to marketing/);
  assert.deepEqual(consent.communications, []);
});

test('missing required data, malformed emails and unsupported workflows are rejected', () => {
  for (const field of ['name', 'email', 'company', 'region', 'need', 'workflow']) {
    assert.throws(() => submission({[field]: ' '}), /invalid-inquiry/, `${field} must be required`);
  }
  for (const email of ['alex', 'alex@', 'alex @example.com', 'alex@example']) {
    assert.throws(() => submission({email}), /invalid-inquiry/);
  }
  assert.throws(() => submission({need: 'too short'}), /invalid-inquiry/);
  for (const workflow of ['unsupported', 'toString', '__proto__', 'constructor']) {
    assert.throws(() => submission({workflow}), /invalid-inquiry/, `${workflow} is not a workflow`);
  }
});

test('all four original workflow choices can be submitted', () => {
  const labels = {
    'technical-knowledge': 'Technical knowledge',
    'support-triage': 'Support and ticket triage',
    'rfq-intake': 'RFQ intake',
    'another-workflow': 'Another business workflow',
  };
  for (const [workflow, label] of Object.entries(labels)) {
    const payload = submission({workflow});
    assert.ok(payload.fields.find(field => field.name === 'message').value.includes(`Workflow: ${label}`));
  }
});

test('arbitrary query parameters and fragments never enter HubSpot page context', () => {
  const payload = submission({credentials: 'private-extra-value'}, {
    ...tracking,
    email: 'person@example.com',
    source: 'person@example.com',
    content: 'https://example.com/private',
    access_token: 'query-secret',
  }, {
    pageUri: 'https://www.cnps.ai/fastgpt/contact/?email=person%40example.com&token=query-secret&workflow=rfq-intake#private-fragment',
    pageName: page.pageName,
  });
  const uri = new URL(payload.context.pageUri);
  assert.equal(uri.origin, 'https://www.cnps.ai');
  assert.equal(uri.pathname, '/fastgpt/contact/');
  assert.equal(uri.hash, '');
  for (const key of ['email', 'token', 'workflow', 'access_token', 'source', 'content']) assert.equal(uri.searchParams.has(key), false);
  assert.equal(uri.searchParams.get('utm_campaign'), tracking.utm_campaign);
  assert.equal('hutk' in payload.context, false);
  assert.equal('ipAddress' in payload.context, false);
  const serialized = JSON.stringify(payload);
  for (const secret of ['person@example.com', 'query-secret', 'private-fragment', 'private-extra-value']) assert.equal(serialized.includes(secret), false);
});

test('tracking is allowlisted, bounded and rejects control characters or URLs', () => {
  assert.deepEqual(sanitizeTracking({
    ...tracking,
    utm_source: 'bad\nsource',
    utm_medium: 'a'.repeat(81),
    utm_campaign: 'https://example.com',
    source: 'person@example.com',
    arbitrary: 'not-allowed',
  }), {
    utm_content: tracking.utm_content,
    utm_term: tracking.utm_term,
    content: tracking.content,
    case: tracking.case,
  });
});

test('field size limits and control-character cleaning also apply before transmission', () => {
  assert.equal(clean(' \u0000A\u0007\r\nB\u007f '), 'A\nB');
  const payload = submission({
    name: 'N'.repeat(120),
    company: 'C'.repeat(160),
    region: 'R'.repeat(120),
    need: 'D'.repeat(1700),
    systems: 'S'.repeat(350),
  });
  const fields = Object.fromEntries(payload.fields.map(field => [field.name, field.value]));
  assert.equal(fields.firstname.length, 100);
  assert.equal(fields.company.length, 150);
  assert.equal(fields.country.length, 100);
  assert.ok(fields.message.includes('D'.repeat(1600)));
  assert.equal(fields.message.includes('D'.repeat(1601)), false);
  assert.ok(fields.message.includes('S'.repeat(300)));
  assert.equal(fields.message.includes('S'.repeat(301)), false);
});

test('missing identifiers or unsafe and duplicate CRM field mappings are rejected', () => {
  assert.equal(validateConfig(config), config);
  for (const invalid of [
    undefined,
    {},
    {...config, portalId: ''},
    {...config, portalId: '123/other'},
    {...config, formId: 'replace-me'},
    {...config, fields: {...config.fields, message: 'Unsafe Field'}},
    {...config, fields: {...config.fields, message: 'email'}},
  ]) assert.throws(() => validateConfig(invalid));
});

test('submission uses the public Forms endpoint with only the prepared JSON payload', async () => {
  const payload = submission();
  let request;
  const result = await submitInquiry(config, payload, {fetchImpl: async (url, options) => {
    request = {url, options};
    return new Response('<p>External response HTML is not needed.</p>', {status: 200});
  }});
  assert.deepEqual(result, {submitted: true});
  assert.equal(request.url, `https://api.hsforms.com/submissions/v3/integration/submit/${config.portalId}/${config.formId}`);
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.options.referrerPolicy, 'no-referrer');
  assert.deepEqual(request.options.headers, {'Content-Type': 'application/json'});
  assert.deepEqual(JSON.parse(request.options.body), payload);
  assert.ok(request.options.signal instanceof AbortSignal);
});

test('HTTP success is limited to 2xx responses; HTTP and network failures reject', async () => {
  for (const status of [200, 201, 204, 299]) {
    assert.deepEqual(await submitInquiry(config, submission(), {
      fetchImpl: async () => new Response(null, {status}),
    }), {submitted: true});
  }
  for (const status of [300, 400, 403, 429, 500, 503]) {
    await assert.rejects(submitInquiry(config, submission(), {
      fetchImpl: async () => new Response(null, {status}),
    }), new RegExp(`hubspot-${status}`));
  }
  await assert.rejects(submitInquiry(config, submission(), {
    fetchImpl: async () => Response.error(),
  }), /hubspot-0/);
  await assert.rejects(submitInquiry(config, submission(), {
    fetchImpl: async () => { throw new TypeError('Network unavailable'); },
  }), /Network unavailable/);
});

test('a stalled request rejects on timeout and aborts the fetch', async () => {
  let signal;
  await assert.rejects(submitInquiry(config, submission(), {
    fetchImpl: async (_url, options) => {
      signal = options.signal;
      return new Promise(() => {});
    },
    timeoutMs: 15,
  }), /timeout/);
  assert.equal(signal.aborted, true);
});

test('unconfigured forms fail before making any network request', async () => {
  let called = false;
  await assert.rejects(submitInquiry({...config, formId: ''}, {}, {
    fetchImpl: async () => { called = true; return new Response(null, {status: 200}); },
  }), /unconfigured/);
  assert.equal(called, false);
});
