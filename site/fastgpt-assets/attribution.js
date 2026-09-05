/* Campaign attribution only. Contact details are never stored here. */
(() => {
  'use strict';
  const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const detailKeys = ['source', 'content', 'case', 'workflow'];
  const storageKey = 'cnps-fastgpt-attribution';
  const valid = value => typeof value === 'string' && /^[a-zA-Z0-9_.-]{1,80}$/.test(value);
  const pick = (input, keys) => Object.fromEntries(keys.filter(key => valid(input[key])).map(key => [key, input[key]]));
  const query = pick(Object.fromEntries(new URLSearchParams(location.search)), [...campaignKeys, ...detailKeys]);
  const now = Date.now();
  let previous = {};
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    if (saved.version === 2 && Number.isFinite(saved.lastSeenAt) && now >= saved.lastSeenAt && now - saved.lastSeenAt < 30 * 60 * 1000) {
      previous = pick(saved.campaign || {}, campaignKeys);
    }
  } catch { /* Disabled storage must not interrupt navigation or form submission. */ }
  const incoming = pick(query, campaignKeys);
  const isWebsiteDefault = incoming.utm_source === 'cnps.ai' && incoming.utm_medium === 'website' && incoming.utm_campaign === 'fastgpt';
  let campaign = previous;
  if (Object.keys(incoming).length && !isWebsiteDefault) {
    const sameCampaign = ['utm_source', 'utm_medium', 'utm_campaign'].every(key => incoming[key] === previous[key]);
    // Only marked internal navigation may inherit absent optional campaign fields.
    // A fresh campaign replaces old content/term instead of mixing two campaigns.
    campaign = sameCampaign && query.source && query.content ? { ...previous, ...incoming } : incoming;
  }
  try {
    if (Object.keys(campaign).length) sessionStorage.setItem(storageKey, JSON.stringify({ version: 2, lastSeenAt: now, campaign }));
    else sessionStorage.removeItem(storageKey);
  } catch { /* URL propagation also works when sessionStorage is unavailable. */ }

  const pageSource = valid(document.body?.dataset.fastgptSource) ? document.body.dataset.fastgptSource : 'fastgpt';
  const details = { source: query.source || pageSource, content: query.content || 'direct-entry', ...pick(query, ['case', 'workflow']) };
  const caseMatch = location.pathname.match(/^\/fastgpt\/cases\/([^/]+)\/?$/);
  const workflowMatch = location.pathname.match(/^\/fastgpt\/solutions\/([^/]+)\/?$/);
  if (caseMatch && valid(caseMatch[1])) details.case = caseMatch[1];
  if (workflowMatch && valid(workflowMatch[1])) details.workflow = workflowMatch[1];
  const hasCampaign = Object.keys(campaign).length > 0;
  const tracking = Object.freeze({ ...(hasCampaign ? campaign : { utm_source: 'cnps.ai', utm_medium: 'website', utm_campaign: 'fastgpt', utm_content: incoming.utm_content || details.content }), ...details });
  window.cnpsFastgptAttribution = Object.freeze({ tracking, getTracking: () => ({ ...tracking }) });

  for (const anchor of document.querySelectorAll('a[data-cta-source][data-cta-content]')) {
    const href = anchor.getAttribute('href');
    if (!href || /^(?:#|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    let target;
    try { target = new URL(href, location.href); } catch { continue; }
    const siteHost = ['cnps.ai', 'www.cnps.ai', location.hostname].includes(target.hostname);
    if (!siteHost || !['http:', 'https:'].includes(target.protocol) || !(/^\/fastgpt(?:\/|$)/.test(target.pathname) || /^\/resources\/fastgpt-/.test(target.pathname))) continue;
    const source = anchor.dataset.ctaSource;
    const content = anchor.dataset.ctaContent;
    if (!valid(source) || !valid(content)) continue;
    for (const key of campaignKeys) target.searchParams.delete(key);
    const linkCampaign = hasCampaign ? campaign : { utm_source: 'cnps.ai', utm_medium: 'website', utm_campaign: 'fastgpt', utm_content: content };
    for (const [key, value] of Object.entries(linkCampaign)) target.searchParams.set(key, value);
    target.searchParams.set('source', source);
    target.searchParams.set('content', content);
    for (const key of ['case', 'workflow']) if (!target.searchParams.has(key) && details[key]) target.searchParams.set(key, details[key]);
    anchor.setAttribute('href', /^https?:\/\//i.test(href) ? target.href : target.pathname + target.search + target.hash);
  }
})();
