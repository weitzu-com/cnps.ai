'use strict';
const filterButtons = [...document.querySelectorAll('[data-filter]')];
for (const button of filterButtons) {
  button.addEventListener('click', () => {
    for (const other of filterButtons) other.setAttribute('aria-pressed', String(other === button));
    let visible = 0;
    for (const card of document.querySelectorAll('.all-cases [data-category]')) {
      card.hidden = button.dataset.filter !== 'All' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) visible++;
    }
    document.getElementById('case-count').textContent = `${visible} reference ${visible === 1 ? 'case' : 'cases'}`;
  });
}
const form = document.getElementById('inquiry-form');
if (form) form.addEventListener('submit', event => event.preventDefault());
if (form) initializeInquiry().catch(() => {
  document.getElementById('inquiry-status').textContent = 'The inquiry form could not load. Please email sales@cnps.ai directly.';
});
async function initializeInquiry() {
  const {clean, workflows, buildBrief, buildSubmission, submitInquiry, validateConfig} = await import('./inquiry.mjs');
  const fieldset = form.querySelector('fieldset');
  const submitButton = document.getElementById('submit-inquiry');
  const status = document.getElementById('inquiry-status');
  const output = document.getElementById('brief-output');
  const briefStatus = document.getElementById('brief-status');
  const params = new URLSearchParams(location.search);
  if (Object.hasOwn(workflows, params.get('workflow'))) form.elements.workflow.value = params.get('workflow');
  let brief = '', pending = false, submitted = false, config = null;
  // Fetch only public configuration; loading the page never submits a lead.
  const configReady = fetch('/fastgpt-assets/hubspot-config.json', {signal: AbortSignal.timeout(5000)})
    .then(response => { if (!response.ok) throw new Error('configuration-unavailable'); return response.json(); })
    .then(value => { config = validateConfig(value); if (!pending && !submitted) submitButton.textContent = 'Send pilot inquiry ↗'; })
    .catch(() => {
      status.textContent = 'Online submission is currently unavailable. You can prepare an email draft below.';
      submitButton.textContent = 'Prepare inquiry email ↗';
    });
  const tracking = () => window.cnpsFastgptAttribution?.getTracking() || Object.fromEntries(params);
  const values = () => ({...Object.fromEntries(new FormData(form)), consent: form.elements.consent.checked});
  function showDraft(details, message) {
    brief = buildBrief(details, tracking());
    document.getElementById('brief-text').value = brief;
    document.getElementById('email-draft').href = `mailto:sales@cnps.ai?subject=${encodeURIComponent(`FastGPT pilot inquiry — ${clean(details.company, 100)}`)}&body=${encodeURIComponent(brief)}`;
    output.hidden = false;
    briefStatus.textContent = message;
    document.getElementById('brief-text').focus();
  }
  function validBrief() {
    // Preparing a local email does not require consent to HubSpot processing.
    return [...form.querySelectorAll('input:not([type="checkbox"]), select, textarea:not([readonly])')].every(field => field.reportValidity());
  }
  document.getElementById('prepare-email').addEventListener('click', () => {
    if (pending || !validBrief()) return;
    showDraft(values(), submitted ? 'This inquiry was already submitted. Send another email only if you need to follow up.' : 'Brief prepared locally. No email has been sent.');
  });
  form.addEventListener('input', () => {
    if (pending) return;
    submitted = false; submitButton.disabled = false;
    submitButton.textContent = config ? 'Send pilot inquiry ↗' : 'Prepare inquiry email ↗';
    output.hidden = true; status.textContent = '';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || submitted || !form.reportValidity()) return;
    const details = values();
    pending = true; fieldset.disabled = true; form.setAttribute('aria-busy', 'true');
    output.hidden = true; status.textContent = 'Sending your inquiry…'; submitButton.textContent = 'Sending…';
    let fallbackMessage = '';
    try {
      await configReady;
      if (!config) throw new Error('unconfigured');
      const payload = buildSubmission(details, tracking(), {pageUri: location.href, pageName: document.title}, config);
      await submitInquiry(config, payload);
      submitted = true;
      status.textContent = 'Thank you. Your pilot inquiry has been submitted to CNPS. We will follow up using your work email.';
      submitButton.textContent = 'Inquiry submitted';
    } catch (error) {
      const unavailable = error.message === 'unconfigured';
      status.textContent = unavailable ? 'Online submission is currently unavailable. Your inquiry has not been submitted. Please review and send the email draft below.' : 'We could not confirm your submission. Your details are preserved below. You can send an email draft instead; if the request reached us, we will treat it as the same inquiry.';
      fallbackMessage = unavailable ? 'Brief prepared locally. No inquiry has been submitted.' : 'Submission was not confirmed. No fallback email has been sent.';
      submitButton.textContent = config ? 'Retry submission ↗' : 'Prepare inquiry email ↗';
    } finally {
      pending = false; fieldset.disabled = false; submitButton.disabled = submitted; form.removeAttribute('aria-busy');
      if (fallbackMessage) showDraft(details, fallbackMessage);
      else status.focus();
    }
  });
  document.getElementById('copy-brief').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(brief);
      briefStatus.textContent = 'Copied. Paste into your email and send to sales@cnps.ai.';
    } catch {
      document.getElementById('brief-text').select();
      briefStatus.textContent = 'Select and copy the inquiry text above.';
    }
  });
  document.getElementById('download-brief').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([brief], {type: 'text/plain;charset=utf-8'}));
    const a = document.createElement('a');
    a.href = url; a.download = 'cnps-fastgpt-inquiry.txt'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    briefStatus.textContent = 'Brief downloaded. No email has been sent.';
  });
  fieldset.disabled = false;
}
