'use strict';
const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
const currentQuery = new URLSearchParams(location.search);
let tracking = {};
try {
  const saved = JSON.parse(sessionStorage.getItem('cnps-fastgpt-attribution') || '{}');
  for (const key of trackingKeys) if (/^[a-zA-Z0-9_.-]{1,80}$/.test(saved[key] || '')) tracking[key] = saved[key];
  for (const key of trackingKeys) if (/^[a-zA-Z0-9_.-]{1,80}$/.test(currentQuery.get(key) || '')) tracking[key] = currentQuery.get(key);
  sessionStorage.setItem('cnps-fastgpt-attribution', JSON.stringify(tracking));
} catch {
  for (const key of trackingKeys) if (/^[a-zA-Z0-9_.-]{1,80}$/.test(currentQuery.get(key) || '')) tracking[key] = currentQuery.get(key);
}
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
if (form) {
  form.querySelector('fieldset').disabled = false;
  const params = new URLSearchParams(location.search);
  const workflows = ['technical-knowledge', 'support-triage', 'rfq-intake', 'another-workflow'];
  if (workflows.includes(params.get('workflow'))) form.elements.workflow.value = params.get('workflow');
  let brief = '';
  const clean = (value, max = 300) => String(value || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, max).trim();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    const selected = form.elements.workflow.selectedOptions[0].textContent;
    const attribution = [...trackingKeys, 'case']
      .map(key => [key, key === 'case' ? params.get(key) : tracking[key]])
      .filter(([, value]) => value && /^[a-zA-Z0-9_.-]{1,80}$/.test(value))
      .map(([key, value]) => `${key}: ${value}`).join('\n');
    brief = `Hello CNPS,\n\nI would like to discuss a FastGPT implementation pilot.\n\nName: ${clean(values.name, 100)}\nWork email: ${clean(values.email, 254)}\nCompany: ${clean(values.company, 150)}\nCountry / region: ${clean(values.region, 100)}\nWorkflow: ${selected}\n\nWhat we would like to improve:\n${clean(values.need, 1600)}\n\nSystems and preferred timeline:\n${clean(values.systems) || 'To discuss'}\n\nPlease contact me to discuss scope, data requirements and an acceptance plan.\n\nPrepared at https://www.cnps.ai/fastgpt/contact/\n${attribution}`;
    document.getElementById('brief-text').value = brief;
    const subject = `FastGPT pilot inquiry — ${clean(values.company, 100)}`;
    document.getElementById('email-draft').href = `mailto:sales@cnps.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(brief)}`;
    document.getElementById('brief-output').hidden = false;
    document.getElementById('brief-status').textContent = 'Brief prepared locally. No inquiry has been sent.';
    document.getElementById('brief-text').focus();
  });
  document.getElementById('copy-brief').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(brief);
      document.getElementById('brief-status').textContent = 'Copied. Paste into your email and send to sales@cnps.ai.';
    } catch {
      document.getElementById('brief-text').select();
      document.getElementById('brief-status').textContent = 'Select and copy the inquiry text above.';
    }
  });
  document.getElementById('download-brief').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'cnps-fastgpt-inquiry.txt'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.getElementById('brief-status').textContent = 'Brief downloaded. It has not been sent to CNPS.';
  });
}
