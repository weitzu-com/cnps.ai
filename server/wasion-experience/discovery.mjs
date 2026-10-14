const DEMO_ORIGIN = 'https://crm.cnps.ai';
const DEFAULT_BASE = '/demo/wasion';
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const text = value => typeof value === 'string' ? value.trim() : '';
const demoBase = value => typeof value === 'string' && /^\/[a-zA-Z0-9/_-]+$/.test(value) && !value.includes('//') ? value.replace(/\/+$/, '') : DEFAULT_BASE;
const demoSlug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : 'home';
const route = (slug, base) => slug === 'home' ? base : `${base}/${slug}`;
function officialURL(value) {
  try {
    const url = new URL(value);
    return url.origin === 'https://en.wasion.com' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
const jsonForHTML = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

export const LEGAL_ROUTES = Object.freeze([
  { slug: 'privacy', title: 'Privacy notice', description: 'How the private Wasion demo handles account access, AI questions, media and enquiries.' },
  { slug: 'cookies', title: 'Cookies & privacy choices', description: 'Essential login cookies and privacy choices in the private Wasion demo.' },
  { slug: 'ai-search-terms', title: 'About AI search', description: 'How Wasion AI search uses official sources, with citations and ordinary search fallback.' },
  { slug: 'accessibility', title: 'Accessibility', description: 'Keyboard access, readable content and motion controls in the private Wasion demo.' }
].map(item => Object.freeze(item)));

// Only source facts already displayed by the product renderer are included.
// Unknown prices, offers, ratings, certifications and publication dates are not
// inferred from source URL names, copied metadata or the content capture date.
function visibleProductProperties(page) {
  const properties = [];
  for (const rows of Array.isArray(page.tables) ? page.tables : []) {
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (Array.isArray(row) && row.length === 2 && text(row[0]) && text(row[1])) {
        properties.push({ '@type': 'PropertyValue', name: text(row[0]), value: text(row[1]) });
      }
    }
  }
  for (const feature of Array.isArray(page.features) ? page.features : []) {
    if (text(feature)) properties.push({ '@type': 'PropertyValue', name: 'Published feature', value: text(feature) });
  }
  return properties;
}

export function buildDemoMetadata({ slug = 'home', title, description, page, nonce = '', base = DEFAULT_BASE } = {}) {
  const safeBase = demoBase(base), safeSlug = demoSlug(slug);
  const legal = LEGAL_ROUTES.find(item => item.slug === safeSlug);
  const heading = text(title) || text(page?.title) || legal?.title || (safeSlug === 'search' ? 'AI search' : 'Wasion International');
  const fullTitle = `${heading} | Wasion International demo`;
  const summary = text(description) || legal?.description || `Explore ${heading} in the private Wasion International demo.`;
  const pageURL = `${DEMO_ORIGIN}${route(safeSlug, safeBase)}`;
  const sourceURL = officialURL(page?.url);
  const primaryImage = (Array.isArray(page?.images) ? page.images : []).find(value => officialURL(value) && value.includes('/uploads/images/'));
  const webPage = {
    '@type': 'WebPage', '@id': `${pageURL}#webpage`, url: pageURL,
    name: heading, description: summary, inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', '@id': `${DEMO_ORIGIN}${safeBase}#website`, name: 'Wasion International private demo', url: `${DEMO_ORIGIN}${safeBase}` },
    ...(sourceURL ? { isBasedOn: { '@type': 'WebPage', url: sourceURL } } : {})
  };
  const breadcrumbItems = [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${DEMO_ORIGIN}${safeBase}` }];
  if (safeSlug !== 'home') breadcrumbItems.push({ '@type': 'ListItem', position: 2, name: heading, item: pageURL });
  const graph = [webPage, { '@type': 'BreadcrumbList', '@id': `${pageURL}#breadcrumb`, itemListElement: breadcrumbItems }];
  if (page?.category === 'Products' && page?.pageType === 'detail' && sourceURL) {
    const properties = visibleProductProperties(page);
    graph.push({
      '@type': 'Product', '@id': `${pageURL}#product`, name: heading,
      url: pageURL, description: summary, brand: { '@type': 'Brand', name: 'Wasion' },
      mainEntityOfPage: { '@id': `${pageURL}#webpage` },
      subjectOf: { '@type': 'WebPage', url: sourceURL },
      ...(primaryImage ? { image: officialURL(primaryImage) } : {}),
      ...(properties.length ? { additionalProperty: properties } : {})
    });
    webPage.mainEntity = { '@id': `${pageURL}#product` };
  }
  return `<title>${escape(fullTitle)}</title><meta name="description" content="${escape(summary)}"><meta name="robots" content="noindex,nofollow,noarchive,nosnippet"><link rel="canonical" href="${escape(sourceURL || pageURL)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Wasion International private demo"><meta property="og:title" content="${escape(fullTitle)}"><meta property="og:description" content="${escape(summary)}"><meta property="og:url" content="${escape(pageURL)}">${primaryImage ? `<meta property="og:image" content="${escape(officialURL(primaryImage))}">` : ''}<script type="application/ld+json" nonce="${escape(nonce)}">${jsonForHTML({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

export function renderAIDisclosure(base = DEFAULT_BASE) {
  return `<p class="wd-ai-disclosure">AI search sends your question and relevant public Wasion information to an external AI service. Use public product questions and keep personal or confidential information out. <a href="${demoBase(base)}/ai-search-terms">How AI search works</a></p>`;
}

function preferencesButton(label = 'Privacy choices') {
  return `<button class="wd-privacy-trigger" type="button" data-wd-open-privacy aria-haspopup="dialog" aria-controls="wd-privacy-dialog">${escape(label)}</button>`;
}

export function renderCookiePreferences(base = DEFAULT_BASE, { showTrigger = true } = {}) {
  const safeBase = demoBase(base);
  return `${showTrigger ? preferencesButton() : ''}<dialog class="wd-privacy-dialog" id="wd-privacy-dialog" aria-labelledby="wd-privacy-title"><div class="wd-privacy-dialog-heading"><h2 id="wd-privacy-title">Your privacy choices</h2><button class="wd-privacy-close" type="button" data-wd-close-privacy aria-label="Close privacy choices">×</button></div><p class="wd-privacy-state">Essential cookies only</p><p>This demo adds no analytics or advertising trackers. Login and security cookies keep the private preview available to authorised viewers.</p><dl class="wd-privacy-cookie-list"><div><dt>Customer login</dt><dd>Up to 30 days</dd></div><div><dt>Staff login</dt><dd>Up to 8 hours</dd></div><div><dt>Login verification</dt><dd>Expires after 5 minutes</dd></div></dl><p>Signing out or a change in your access can end the session earlier.</p><p data-wd-gpc-status>Optional tracking stays off. Your browser’s privacy signal does not enable tracking.</p><p data-wd-motion-status>Homepage motion respects your browser’s reduced-motion setting. You can also pause the homepage animation.</p><div class="wd-privacy-actions"><a href="${safeBase}/cookies">Cookie details</a><button class="wd-button" type="button" data-wd-close-privacy>Done</button></div></dialog>`;
}

const emailLink = '<a href="mailto:sales@wasion.com">sales@wasion.com</a>';
const legalSections = {
  privacy: [
    ['About this demo', '<p>CNPS operates this private website concept for authorised review. Wasion branding and public content come from the official international website. This notice describes the demo; Wasion’s own website and services have their own policies.</p>'],
    ['Account access and essential cookies', '<p>The demo uses your existing CNPS account access to check that you can view the preview. Secure login cookies support authentication. Customer sessions last up to 30 days and staff sessions up to 8 hours. The verification cookie expires after 5 minutes. Signing out or a change in your access can end the session earlier.</p><p>A security counter limits AI requests and expires after one day. Existing account and access records are managed through the CNPS service.</p>'],
    ['AI search', '<p>When you ask AI search a question, the question and relevant public Wasion excerpts are sent through Vercel AI Gateway to an external AI model. Your CRM phone number and account identity are not included in that model request.</p><p>Ask public product questions. Please keep personal information and confidential project details out of the search box. Hosting and AI providers may process service or security records under their service settings.</p>'],
    ['Official media and external links', '<p>Official images and the homepage video are loaded from en.wasion.com. Your browser contacts that website to load them. Following an external link takes you to a service with its own privacy practices.</p><p>No analytics or advertising trackers are added to this demo.</p>'],
    ['Your enquiry', `<p>Preparing an enquiry opens an email draft addressed to ${emailLink}. It is sent only when you choose Send in your email application. The demo does not store or send the enquiry. Your email provider and Wasion handle the email you send.</p>`],
    ['Questions about privacy', `<p>For questions about account access or privacy in this demo, contact your CNPS project contact. For Wasion product enquiries, write to ${emailLink}.</p>`]
  ],
  cookies: [
    ['Essential cookies', '<p>The private demo uses the existing CNPS login service. These cookies allow authentication and verification; they are used for that function rather than advertising.</p><div class="wd-legal-table"><table><caption>Cookies used by the existing login service</caption><thead><tr><th scope="col">Cookie</th><th scope="col">Purpose</th><th scope="col">Lifetime</th></tr></thead><tbody><tr><th scope="row">__Host-cnps_crm</th><td>Authenticated private access</td><td>Up to 30 days for customers; 8 hours for staff</td></tr><tr><th scope="row">__Host-cnps_crm_challenge</th><td>Login verification</td><td>5 minutes</td></tr></tbody></table></div><p>Both cookies use Secure, HttpOnly and SameSite protection. Customer sessions use SameSite=Lax; staff sessions and verification use SameSite=Strict. Blocking essential cookies prevents the authenticated preview from working. Signing out or a change in access can end a session before its maximum lifetime.</p>'],
    ['Optional tracking stays off', '<p>This demo adds no analytics, advertising or cross-site tracking tools. There are no optional trackers to switch on. The privacy panel shows the current essential-only state and detects Global Privacy Control when your browser provides it.</p><p>A Global Privacy Control signal does not switch off authentication or enable optional tracking.</p>'],
    ['Review your settings', `<p>Use your browser settings to remove cookies or change privacy preferences. Removing the login cookie signs you out of the private preview.</p>${preferencesButton('View privacy choices')}`]
  ],
  'ai-search-terms': [
    ['Search official information', '<p>Wasion AI search helps you explore the public products, solutions, cases and documents reproduced in this demo. It first finds relevant official source pages, then may generate a concise summary of those excerpts.</p>'],
    ['Your question', '<p>Your question and matching public Wasion excerpts are processed by an external AI service through Vercel AI Gateway. Your CRM phone number and account identity are not included in the model request. Ask about public product information and keep personal or confidential information out.</p>'],
    ['Read the sources', '<p>Generated summaries are labelled as AI-generated and include source links. AI can make mistakes. Use the linked official information and confirm technical specifications, availability and suitability with Wasion before making a project decision.</p><p>The copied pages are a demo collection, not a guarantee of the complete or current Wasion catalogue.</p>'],
    ['When an answer is unavailable', '<p>If the available sources do not support an answer, or AI is unavailable, the demo shows matching pages or explains the limitation. You can continue browsing the source material and contact Wasion for guidance.</p>'],
    ['Talk to Wasion', `<p>Discuss requirements with Wasion at ${emailLink}. An enquiry is prepared as an email draft; it is sent only when you send it from your email application.</p>`]
  ],
  accessibility: [
    ['Using the demo', '<p>The demo is designed around readable content, keyboard access and responsive layouts, with WCAG 2.2 AA as the design target. This statement describes the demo features; it is not a claim of a completed accessibility certification.</p>'],
    ['Navigation and search', '<p>A skip link takes you to the main content. Navigation and search controls have labels and visible keyboard focus. Product information uses headings and technical tables so that details are available as text.</p>'],
    ['Motion and media', '<p>The homepage animation has a pause control and a static cover when motion is reduced or video cannot load. It respects your browser’s reduced-motion preference and does not autoplay sound. Page information and navigation remain available while media loads.</p>'],
    ['Tell us about a problem', '<p>If you have difficulty using this private demo, contact your CNPS project contact with the page, the action you were trying to take and the browser or assistive technology you use. This helps us reproduce and address the issue.</p>']
  ]
};

export function renderLegalPage(slug, base = DEFAULT_BASE) {
  const meta = LEGAL_ROUTES.find(item => item.slug === slug);
  if (!meta) return null;
  const safeBase = demoBase(base);
  const intros = {
    privacy: 'Understand how this private preview handles access, AI questions and enquiries.',
    cookies: 'Essential access cookies, with optional tracking kept off.',
    'ai-search-terms': 'Find useful information, understand the summary and check its sources.',
    accessibility: 'Readable pages, keyboard access and control over homepage motion.'
  };
  return `<div class="wd-container wd-breadcrumb"><a href="${safeBase}">Home</a><span aria-hidden="true">/</span><span>${escape(meta.title)}</span></div><section class="wd-container wd-page-intro"><span class="wd-overline">DEMO INFORMATION</span><h1>${escape(meta.title)}</h1><p>${escape(intros[slug])}</p></section><div class="wd-container wd-legal-layout"><article class="wd-legal-content">${legalSections[slug].map(([heading, body]) => `<section><h2>${escape(heading)}</h2>${body}</section>`).join('')}<p class="wd-legal-updated">Private demo notice · Updated 14 October 2026</p></article><nav class="wd-legal-nav" aria-label="Demo information">${LEGAL_ROUTES.map(item => `<a href="${safeBase}/${item.slug}" ${item.slug === slug ? 'aria-current="page"' : ''}>${escape(item.title)}</a>`).join('')}<a href="${safeBase}/contact">Contact Wasion</a></nav></div>`;
}

export const DISCOVERY_CSS = `
.wd-ai-disclosure{font-size:.75rem;line-height:1.65;margin:.9rem 0 0;color:inherit;max-width:68rem}.wd-ai-disclosure a{text-decoration:underline;text-underline-offset:.18em}.wd-legal-layout{display:grid;gap:2rem;padding-bottom:4rem}.wd-legal-content{min-width:0;max-width:50rem}.wd-legal-content section{margin-bottom:2.2rem}.wd-legal-content h2{font-size:1.4rem;letter-spacing:-.015em;margin-bottom:.85rem}.wd-legal-content p{color:var(--muted,#40566f);line-height:1.8;overflow-wrap:anywhere}.wd-legal-content a{text-decoration:underline;text-underline-offset:.18em;color:var(--red,#bd2031)}.wd-legal-updated{border-top:1px solid var(--line,#d5dee7);padding-top:1.25rem;font-size:.75rem}.wd-legal-nav{align-self:start;border-top:3px solid var(--red,#bd2031);background:var(--paper,#f1f4f7);padding:1.5rem}.wd-legal-nav a{display:block;min-height:2.75rem;padding:.75rem 0;border-bottom:1px solid var(--line,#d5dee7);font-size:.875rem}.wd-legal-nav a[aria-current]{font-weight:700}.wd-legal-table{overflow-x:auto;margin:1rem 0}.wd-legal-table table{border-collapse:collapse;width:100%;font-size:.8rem}.wd-legal-table caption{text-align:left;font-weight:600;padding:.6rem 0}.wd-legal-table th,.wd-legal-table td{padding:.8rem;border:1px solid var(--line,#d5dee7);text-align:left;vertical-align:top}.wd-legal-table th{background:var(--paper,#f1f4f7)}.wd-privacy-trigger{font:inherit;text-align:left;min-height:2.75rem;background:transparent;border:0;color:inherit;padding:.35rem 0;text-decoration:underline;text-underline-offset:.2em;cursor:pointer}.wd-privacy-dialog{border:1px solid var(--line,#d5dee7);width:min(34rem,calc(100% - 2rem));max-height:calc(100dvh - 2rem);overflow:auto;margin:auto;padding:1.5rem;color:var(--ink,#162c45);background:#fff;box-shadow:0 1rem 4rem #12284c33}.wd-privacy-dialog::backdrop{background:#12284ca3}.wd-privacy-dialog-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}.wd-privacy-dialog h2{font-size:1.5rem;line-height:1.3;letter-spacing:-.025em;margin:0 0 1rem}.wd-privacy-close{width:2.75rem;height:2.75rem;flex-shrink:0;border:1px solid var(--line,#d5dee7);background:#fff;color:var(--ink,#162c45);font-size:1.5rem;cursor:pointer}.wd-privacy-dialog p{font-size:.875rem;line-height:1.65;color:var(--muted,#40566f)}.wd-privacy-dialog .wd-privacy-state{font-weight:700;color:var(--ink,#162c45)}.wd-privacy-cookie-list{font-size:.875rem;margin:1rem 0}.wd-privacy-cookie-list>div{display:flex;justify-content:space-between;gap:1rem;border-top:1px solid var(--line,#d5dee7);padding:.7rem 0}.wd-privacy-cookie-list dt{font-weight:600}.wd-privacy-cookie-list dd{margin:0;text-align:right}.wd-privacy-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:1.5rem}.wd-privacy-actions>a{min-height:2.75rem;display:flex;align-items:center;font-size:.875rem;text-decoration:underline;text-underline-offset:.2em}.wd-privacy-dialog button:focus-visible,.wd-privacy-trigger:focus-visible,.wd-legal-nav a:focus-visible{outline:3px solid var(--navy,#12284c);outline-offset:3px}@media(min-width:768px){.wd-legal-layout{grid-template-columns:minmax(0,1fr) 17rem;gap:3.5rem}}
`;

// This panel reports the actual essential-only state; it stores no consent,
// adds no optional tracking and does not alter authentication cookies.
export const DISCOVERY_CLIENT = `
(()=>{
 const wdPrivacyDialog=document.getElementById('wd-privacy-dialog');
 const wdGpcEnabled=navigator.globalPrivacyControl===true;
 document.querySelectorAll('[data-wd-gpc-status]').forEach(node=>{node.textContent=wdGpcEnabled?'Global Privacy Control is enabled in your browser. Optional tracking remains off.':'Optional tracking remains off. No advertising or analytics trackers are added by this demo.'});
 const wdMotionPreference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
 const wdReportMotion=()=>document.querySelectorAll('[data-wd-motion-status]').forEach(node=>{node.textContent=wdMotionPreference?.matches?'Your browser requests reduced motion. The homepage uses a static cover.':'Your browser allows motion. You can pause the homepage animation at any time.'});
 wdReportMotion();wdMotionPreference?.addEventListener?.('change',wdReportMotion);
 if(!wdPrivacyDialog)return;
 let wdPrivacyInvoker=null;
 document.querySelectorAll('[data-wd-open-privacy]').forEach(button=>button.addEventListener('click',()=>{if(typeof wdPrivacyDialog.showModal==='function'){wdPrivacyInvoker=button;wdPrivacyDialog.showModal();}else{location.href=wdPrivacyDialog.querySelector('a').href;}}));
 wdPrivacyDialog.querySelectorAll('[data-wd-close-privacy]').forEach(button=>button.addEventListener('click',()=>wdPrivacyDialog.close()));
 wdPrivacyDialog.addEventListener('click',event=>{if(event.target===wdPrivacyDialog)wdPrivacyDialog.close();});
 wdPrivacyDialog.addEventListener('close',()=>wdPrivacyInvoker?.focus());
})();
`;
