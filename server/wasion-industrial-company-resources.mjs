export const INDUSTRIAL_COMPANY_RESOURCE_ROUTES = Object.freeze([
  'company', 'about', 'innovation', 'global-presence',
  'resources', 'certifications', 'collateral-videos', 'media-kit'
]);

const COMPANY = ['company', 'about', 'innovation', 'global-presence'];
const ARROW = '<span aria-hidden="true">↗</span>';
const HEADINGS = {
  company: ['Engineering connections.\nAround the world.', 'Get to know Wasion through its company profile, local manufacturing and project experience.'],
  about: ['Intelligent metering.\nGlobal perspective.', 'Meet the company behind the products, technologies and services.'],
  innovation: ['From research.\nTo real-world delivery.', 'Explore published R&D, manufacturing and quality information.'],
  'global-presence': ['Global perspective.\nLocal presence.', 'Explore the local manufacturing locations and utility projects published by Wasion.'],
  resources: ['Knowledge, ready\nfor your next project.', 'Find official publications, product information and documentation.'],
  certifications: ['Confidence starts\nwith the source.', 'Review published certificates with their stated entity, product and regional scope.'],
  'collateral-videos': ['The details behind\nthe technology.', 'Explore product catalogs, company publications and explained video.'],
  'media-kit': ['A closer look\nat Wasion.', 'Official brand assets, company information and technical video, in one place.']
};

// Only the image presentation changes state. Navigation, filtering and access
// use their existing shared clients. Text covers also work without JavaScript.
export const INDUSTRIAL_COMPANY_RESOURCES_CLIENT = `
document.querySelectorAll('.wic-cover').forEach(cover=>{const image=cover.querySelector('.wic-cover-image');if(!image)return;const update=()=>cover.classList.toggle('wic-cover-loaded',image.complete&&image.naturalWidth>0);image.addEventListener('load',update);image.addEventListener('error',update);update()});
`;

// The existing experience body is the source of truth for content and widgets.
// Keep every row, facet, disclosure, source URL and client hook intact.
export function renderIndustrialCompanyResources(slug, ctx, originalBody) {
  if (!INDUSTRIAL_COMPANY_RESOURCE_ROUTES.includes(slug)) return originalBody;
  const { helpers: h, pages, base } = ctx, e = h.escape;
  const get = key => pages.find(p => p.slug === key);
  const company = COMPANY.includes(slug), overview = ['company', 'about'].includes(slug);
  const owner = get(company ? 'about' : 'resources');
  const name = { company: 'Company', about: 'About us', innovation: 'Innovation', 'global-presence': 'Global presence', resources: 'Resource library', certifications: 'Certifications', 'collateral-videos': 'Collateral & videos', 'media-kit': 'Media kit' }[slug];
  const link = (key, label, cls = '') => `<a class="${cls}" href="${base}/${key}">${e(label)} ${ARROW}</a>`;
  const source = h.external(owner.url, 'Official Wasion information');
  const marker = '<div class="wd-container we-content">';
  const resources = get('resources').resourceItems;
  const cover = r => `<div class="wic-cover" data-wic-cover="${resources.indexOf(r)}" role="img" aria-label="${e(r.title)}"><div class="wic-cover-type" aria-hidden="true"><span>WASION</span><span>${e(r.type || (/ISO|Certificate|MID/i.test(r.title) ? 'Certificate' : 'Policy'))}</span><strong>${e(r.title)}</strong><span>PUBLICATION</span></div><img class="wic-cover-image" src="${e(encodeURI(r.image))}" alt="" aria-hidden="true" loading="lazy" decoding="async"></div>`;
  const start = originalBody.indexOf(marker);
  let body = start >= 0 ? originalBody.slice(start) : originalBody;
  let visual;
  if (overview) {
    const carousel = body.match(/<section class="we-company-carousel"[\s\S]*?<\/section>/)?.[0] || '';
    body = body.replace(carousel, '');
    // Move the original, keyboard-operable carousel into the brand opening.
    visual = carousel;
  } else if (company) {
    const image = owner.images.find(url => /picabout\.jpg/.test(url));
    visual = `<figure class="wic-company-image">${h.img(image, 'Wasion International company image', '', false)}<figcaption><span>WASION INTERNATIONAL / COMPANY PROFILE</span>${source}</figcaption></figure>`;
  } else {
    const selected = slug === 'certifications'
      ? resources.filter(r => /ISO 45001|GenericCertificate/.test(r.title))
      : resources.filter(r => /Company Profile Sheet|AMI Solutions for Dtech2024/.test(r.title));
    visual = `<div class="wic-publications" aria-label="Featured official publications">${selected.map((r, i) => `<figure><a href="${e(encodeURI(r.url || owner.url))}" target="_blank" rel="noopener noreferrer" aria-label="Open official publication: ${e(r.title)}">${cover(r)}</a><figcaption><span>0${i + 1} / ${e(r.type || 'Certificate')}</span><span>${e(r.title)}</span></figcaption></figure>`).join('')}</div>`;
  }
  if (!company) body = body.replace(/<img\b[^>]*>/g, img => {
    const r = resources.find(r => img.includes(`src="${e(encodeURI(r.image))}"`));
    return r ? `<div class="wic-resource-cover">${cover(r)}${img.replace('<img ', '<img hidden ')}</div>` : img;
  });
  body = body.replace(marker, `<div class="wd-container we-content wic-content" id="wic-content">`)
    .replace(/<select data-filter="(region|topic|type)"/g, (_, key) => `<select aria-label="${{ region: 'Region', topic: 'Topic', type: 'Content type' }[key]}" data-filter="${key}"`);
  const entries = company
    ? [['company', 'Company'], ['about', 'About us'], ['innovation', 'Innovation'], ['global-presence', 'Global presence'], ['resources', 'Resources']]
    : [['resources', 'All resources'], ['certifications', 'Certifications'], ['collateral-videos', 'Collateral & videos'], ['media-kit', 'Media kit'], ['case-studies', 'Case studies']];
  const nav = `<nav class="wic-nav wd-container" aria-label="${company ? 'Company' : 'Resource'} navigation">${entries.map(([key, label]) => `<a href="${base}/${key}"${slug === key ? ' aria-current="page"' : ''}>${e(label)}</a>`).join('')}</nav>`;
  const [headline, description] = HEADINGS[slug];
  const hero = `<section class="wic-hero wd-container${company ? ' wic-company-hero' : ' wic-resource-hero'}" aria-labelledby="wic-title"><div class="wic-intro"><div><span class="wic-label">WASION / ${e(name.toUpperCase())}</span><h1 id="wic-title">${e(headline).replace(/\n/g, '<br>')}</h1></div><div class="wic-intro-copy"><p>${e(description)}</p><div class="wic-actions"><a class="wd-button" href="#wic-content">${company ? 'Explore Wasion' : 'Explore the library'} ${ARROW}</a>${source}</div>${link(`search?q=${encodeURIComponent(company ? 'Tell me about Wasion R&D and global manufacturing' : 'Find Wasion product documentation')}`, 'Need help finding information? Ask Wasion AI', 'wic-ai')}</div></div>${visual}</section>`;
  const breadcrumb = `<nav class="wd-container wd-breadcrumb" aria-label="Breadcrumb"><a href="${base}">Home</a><span aria-hidden="true">/</span>${!['company', 'resources'].includes(slug) ? `<a href="${base}/${company ? 'company' : 'resources'}">${company ? 'Company' : 'Resources'}</a><span aria-hidden="true">/</span>` : ''}<span>${e(name)}</span></nav>`;
  return `<div class="wic-page${company ? ' wic-company' : ' wic-resources'}" data-wic-page="${slug}">${breadcrumb}${hero}${nav}${body}</div>`;
}

export const INDUSTRIAL_COMPANY_RESOURCES_CSS = `
.wic-page{color:var(--ink);overflow-wrap:anywhere}
.wic-page :is(section,div,figure,article,aside,form,label){min-width:0}
.wic-page :is(a,button,input,select,summary):focus-visible{outline:3px solid var(--red);outline-offset:4px}
.wic-page .wd-breadcrumb{padding-block:1rem 1.5rem;font-size:.8125rem;gap:.5rem;display:flex;flex-wrap:wrap}
.wic-page .wd-breadcrumb a{min-height:2.75rem;display:inline-flex;align-items:center}
.wic-page .wic-label{display:block;font:400 .75rem/1.6 var(--wi-tech);letter-spacing:.08em;color:var(--muted);margin-bottom:1.25rem}
.wic-hero{padding-block:.5rem 2.5rem}
.wic-intro{display:grid;gap:1.5rem;margin-bottom:2rem}
.wic-page .wic-intro h1{font:300 clamp(2.5rem,5.4vw,5.6rem)/1.04 var(--wi-display);letter-spacing:-.055em;margin:0}
.wic-intro-copy{align-self:end}
.wic-intro-copy>p{color:var(--muted);font-size:1.0625rem;line-height:1.7;max-width:34rem;margin-bottom:1.5rem}
.wic-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem 1.5rem}
.wic-actions>a{min-height:2.75rem;display:inline-flex;align-items:center;gap:1rem;font-size:.875rem}
.wic-page .wic-actions .wd-button{min-height:3.25rem;border-radius:1rem;font-size:.9375rem;white-space:normal;flex-shrink:1;flex-wrap:wrap;max-width:100%;min-width:0;gap:.75rem;padding:.75rem 1rem}
.wic-page .wic-ai{display:inline-flex;align-items:center;gap:.75rem;min-height:2.75rem;color:var(--red);font-size:.8125rem;margin-top:1rem;max-width:100%}
.wic-page .we-company-carousel,.wic-company-image{margin:0;background:#fff;border:0;border-radius:var(--wi-radius);overflow:hidden}
.wic-page .we-company-slide{margin:0}
.wic-page .we-company-slide>img,.wic-company-image>img{width:100%;height:clamp(16rem,37vw,31rem);object-fit:cover;max-height:none}
.wic-page .we-company-slide figcaption,.wic-company-image figcaption{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.5rem 1rem;padding:.75rem 1.25rem;border-top:1px solid var(--line);font:400 .75rem/1.6 var(--wi-tech);color:var(--muted);background:#fff}
.wic-page :is(.we-company-slide,.wic-company-image) figcaption a{min-height:2.75rem;display:inline-flex;align-items:center;gap:.5rem}
.wic-page .we-carousel-controls{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;padding:.75rem 1.25rem;background:var(--wi-dark);color:#fff}
.wic-page .we-carousel-controls button{color:#fff;background:transparent;border:1px solid #95928c;border-radius:.75rem;padding:.5rem .75rem;min-height:2.75rem;font-size:.8125rem}
.wic-page .we-carousel-status{font:400 .75rem/1.6 var(--wi-tech)}
.wic-page .we-carousel-controls :focus-visible{outline-color:#fff}
.wic-publications{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;background:#e3e2db;padding:1.25rem;border-radius:var(--wi-radius)}
.wic-publications figure{margin:0;background:#fff;min-width:0;border-radius:1rem;overflow:hidden}
.wic-publications figure>a{display:flex;justify-content:center;padding:.75rem}
.wic-cover{position:relative;width:100%;min-width:0;isolation:isolate;background:#fff}
.wic-cover-type{display:flex;flex-direction:column;align-items:flex-start;gap:.625rem;min-height:12rem;height:100%;padding:1.25rem;color:var(--ink);background:#fff;border:1px solid var(--line)}
.wic-cover-type>span{font:400 .75rem/1.6 var(--wi-tech);letter-spacing:.04em;color:var(--muted)}
.wic-cover-type>span:first-child{color:var(--red);font-size:1rem;font-weight:600;letter-spacing:.02em;margin-bottom:.75rem}
.wic-cover-type>span:last-child{margin-top:auto;padding-top:1rem}
.wic-cover-type strong{font-size:clamp(.875rem,1.5vw,1.375rem);font-weight:400;line-height:1.3;letter-spacing:-.025em}
.wic-page .wic-cover-image{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0}
.wic-cover-loaded>.wic-cover-type{visibility:hidden}
.wic-page .wic-cover-loaded>.wic-cover-image{opacity:1}
.wic-publications .wic-cover{min-height:12rem}
.wic-publications figcaption{border-top:1px solid var(--line);padding:1rem;font-size:.8125rem;line-height:1.6}
.wic-publications figcaption span{display:block}
.wic-publications figcaption span:first-child{font:400 .75rem/1.6 var(--wi-tech);color:var(--muted);margin-bottom:.5rem}
.wic-nav{display:flex;flex-wrap:wrap;gap:.5rem .75rem;border-block:1px solid var(--line);padding-block:1rem}
.wic-nav>a{display:inline-flex;align-items:center;border:1px solid #827e76;border-radius:1rem;min-height:2.75rem;padding:.5rem .875rem;font-size:.8125rem;line-height:1.5}
.wic-nav>a[aria-current]{background:var(--ink);border-color:var(--ink);color:#fff}
.wic-nav>a:hover{text-decoration:underline;text-underline-offset:.25rem;border-color:var(--red)}
.wic-page .wic-content{padding-block:1rem 4rem}
.wic-page #wic-content{scroll-margin-top:8rem}
.wic-page h2{font:300 clamp(1.875rem,3.2vw,3.2rem)/1.12 var(--wi-display);letter-spacing:-.04em;color:var(--ink)}
.wic-page h3{font-weight:400;line-height:1.3;letter-spacing:-.025em;color:var(--ink)}
.wic-page p{line-height:1.8;font-size:1rem;color:var(--muted)}
.wic-page .we-block{margin:0;padding-block:2.5rem;border-bottom:1px solid var(--line)}
.wic-page .we-block>h2{margin-bottom:1.75rem}
.wic-page .we-block>a,.wic-page .we-block>p>a{min-height:2.75rem;display:inline-flex;align-items:center;gap:.75rem;color:var(--red);font-size:.875rem;margin-right:1rem}
.wic-page .we-metrics{display:grid;grid-template-columns:minmax(0,1fr);gap:0;margin-block:2rem 1rem;border-top:1px solid var(--line);background:var(--wi-dark);color:#fff;border-radius:var(--wi-radius);overflow:hidden}
.wic-page .we-metrics>div{padding:2rem;border:0;border-bottom:1px solid #67635f;background:transparent}
.wic-page .we-metrics strong{font:400 clamp(2.5rem,4.3vw,4.5rem)/1.1 var(--wi-tech);letter-spacing:-.065em;color:#fff;display:block;margin-bottom:1rem}
.wic-page .we-metrics span{font-size:.875rem;color:#dddcd5}
.wic-page .we-note{font-size:.8125rem;line-height:1.7}
.wic-page .we-note a{display:inline-flex;align-items:center;min-height:2.75rem;text-decoration:underline;text-underline-offset:.25rem}
.wic-page .we-feature-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:0;padding:0;list-style:none;border-top:1px solid var(--line)}
.wic-page .we-feature-grid li{padding:1.25rem 0;display:flex;align-items:center;gap:1rem;background:transparent;border:0;border-bottom:1px solid var(--line);border-radius:0;font-size:1.25rem;color:var(--ink)}
.wic-page .we-feature-icon{background:transparent;color:var(--red);flex-shrink:0}
.wic-page .we-timeline{display:grid;grid-template-columns:minmax(0,1fr);gap:0;list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.wic-page .we-timeline li{padding:1.5rem 0;border:0;border-bottom:1px solid var(--line);display:grid;gap:.75rem}
.wic-page .we-timeline strong{font:400 2rem/1.2 var(--wi-tech);letter-spacing:-.04em}
.wic-page .we-timeline span{font-size:1rem;color:var(--muted)}
.wic-page .we-map-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem}
.wic-page .we-map{border:0;border-radius:var(--wi-radius);background:#fff;padding:1rem;display:flex;align-items:center}
.wic-page .we-map svg{width:100%;height:auto;display:block;min-width:0}
.wic-page .we-map polygon{fill:#deddd6;stroke:#fff;stroke-width:2}
.wic-page .we-map circle{fill:var(--red)}
.wic-page .we-map text{fill:var(--ink);font:13px var(--wi-tech)}
.wic-page .we-map-countries{border:1px solid var(--line);border-radius:var(--wi-radius);background:#fff;padding:.5rem 1.25rem}
.wic-page .we-map-countries details{padding:0;border:0;border-bottom:1px solid var(--line)}
.wic-page .we-map-countries details:last-child{border-bottom:0}
.wic-page .we-map-countries summary{min-height:3.5rem;padding:.875rem 0;cursor:pointer;font-size:1rem;color:var(--ink);display:list-item}
.wic-page .we-map-countries summary span{display:block;font:400 .75rem/1.6 var(--wi-tech);color:var(--muted);margin-top:.25rem}
.wic-page .we-map-countries a{display:inline-flex;align-items:center;gap:.5rem;min-height:2.75rem;color:var(--red);font-size:.875rem;margin-bottom:.75rem}
.wic-page .we-map-countries p{font-size:.9375rem}
.wic-page .we-lifecycle{display:grid;grid-template-columns:minmax(0,1fr);gap:0;list-style:none;padding:0;margin:0 0 1.5rem}
.wic-page .we-lifecycle li{background:transparent;padding:1.25rem 0;border:0;border-top:1px solid var(--line);border-radius:0;display:flex;gap:1.5rem;align-items:baseline}
.wic-page .we-lifecycle span{font:400 .75rem/1.6 var(--wi-tech);color:var(--muted)}
.wic-page .we-lifecycle h3{font-size:1.25rem;margin:0}
.wic-page .we-filter-scope{padding-block:2rem}
.wic-page .we-filters{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem;border:1px solid var(--line);background:#fff;border-radius:var(--wi-radius);padding:1.25rem;margin:0 0 1.5rem}
.wic-page .we-filters label{display:flex;flex-direction:column;gap:.5rem;color:var(--ink);font-size:.8125rem}
.wic-page .we-filters :is(input,select){width:100%;min-width:0;max-width:100%;min-height:3.25rem;font:400 1rem/1.5 var(--wi-display);padding:.75rem;border:1px solid #827e76;background:#fff;border-radius:.75rem;color:var(--ink)}
.wic-page .we-filters button,.wic-page .we-filter-more{border:1px solid #827e76;border-radius:.75rem;background:var(--paper);color:var(--ink);font:400 .875rem/1.6 var(--wi-display);min-height:3.25rem;align-self:end;padding:.75rem 1rem;white-space:normal}
.wic-page .we-filter-more{display:block;margin-top:1.5rem;width:100%}
.wic-page .we-filter-count{font:400 .8125rem/1.6 var(--wi-tech);padding-block:1rem;border-top:1px solid var(--line);margin:0}
.wic-page .we-filter-empty{border:1px solid var(--line);padding:1.5rem;border-radius:1rem}
.wic-page .we-filter-list{display:grid;grid-template-columns:minmax(0,1fr);gap:1.25rem}
.wic-page .we-filter-item{border:0;padding:0;min-width:0}
.wic-page .we-row{display:flex;flex-direction:column;height:100%;padding:0;border:1px solid var(--line);border-radius:var(--wi-radius);background:#fff;overflow:hidden;gap:0}
.wic-page .we-row>img{height:17rem;width:100%;max-height:none;object-fit:contain;padding:1.25rem;background:#e9e8e2;border-radius:0}
.wic-page .we-row>.wic-resource-cover{height:19rem;flex:none;background:#e9e8e2;padding:1.25rem}
.wic-resource-cover .wic-cover{height:100%}
.wic-page .we-row>div:not(.wic-resource-cover){padding:1.5rem;display:flex;flex-direction:column;flex:1;align-items:flex-start}
.wic-page .we-row .wd-overline{font:400 .75rem/1.6 var(--wi-tech);color:var(--muted);margin-bottom:.75rem}
.wic-page .we-row h3{font-size:1.375rem;margin-bottom:1rem}
.wic-page .we-row h3 a{display:inline-flex;align-items:center;min-height:2.75rem}
.wic-page .we-row p{font-size:.9375rem;margin-bottom:1.25rem}
.wic-page .we-row>div:not(.wic-resource-cover)>a{display:inline-flex;align-items:center;min-height:2.75rem;gap:.75rem;color:var(--red);font-size:.875rem;margin-top:auto;text-decoration:underline;text-underline-offset:.25rem}
.wic-page .we-row .we-note{display:block;margin-top:auto;color:var(--muted)}
.wic-page .we-resource-links{display:flex;flex-wrap:wrap;gap:.5rem .75rem}
.wic-page .we-resource-links>a{border:1px solid #827e76;border-radius:1rem;display:inline-flex;align-items:center;min-height:2.75rem;padding:.5rem 1rem;gap:.75rem;font-size:.875rem}
.wic-page .we-logo-preview{display:flex;align-items:center;justify-content:center;min-height:14rem;max-width:none;border:1px solid var(--line);border-radius:var(--wi-radius);background:#fff;padding:2rem;margin-bottom:1.25rem}
.wic-page .we-logo-preview img{max-width:26rem;width:100%;height:auto;object-fit:contain}
.wic-page video{display:block;width:100%;height:auto;max-height:34rem;object-fit:contain;background:#fff;border-radius:var(--wi-radius)}
.wic-page .we-sources{padding:1rem 0;border-top:1px solid var(--line);margin-top:2rem;color:var(--muted);font-size:.875rem}
.wic-page .we-sources summary{min-height:2.75rem;cursor:pointer}
.wic-page .we-sources a{min-height:2.75rem;display:flex;align-items:center;gap:.5rem;color:var(--red)}
.wic-page .we-case-card{height:100%;background:#fff;border:0;border-radius:var(--wi-radius);overflow:hidden;display:flex;flex-direction:column}
.wic-page .we-case-media{height:15rem;border-radius:0;overflow:hidden}
.wic-page .we-case-media img{width:100%;height:100%;object-fit:contain;background:#fff}
.wic-page .we-case-card>div{padding:1.5rem}
.wic-page .we-case-card h3{font-size:1.5rem}
.wic-page .we-case-card p{font-size:1rem}
.wic-page .we-case-card .wd-overline{font:400 .75rem/1.6 var(--wi-tech);color:var(--muted)}
.wd-style-industrial:has(.wic-page) .wd-header{container-type:inline-size}
.wd-style-industrial:has(.wic-page) :is(.wd-contact-band h2,.wd-contact-band .wd-container>div,.wd-footer-top>div){min-width:0;max-width:100%;overflow-wrap:anywhere}
.wd-style-industrial:has(.wic-page) .wd-contact-band .wd-button{max-width:100%;white-space:normal}
.wd-style-industrial:has(.wic-page) .wd-language summary{min-height:2.75rem}
.wd-style-industrial:has(.wic-page) .wx-footer,.wd-style-industrial:has(.wic-page) .wx-footer :is(div,a,p){min-width:0;overflow-wrap:anywhere}
@container (width < 64rem){.wd-style-industrial:has(.wic-page) .wd-nav{min-height:5rem;gap:.75rem;flex-wrap:wrap}.wd-style-industrial:has(.wic-page) .wd-nav>.wd-brand{margin-right:auto;max-width:100%}.wd-style-industrial:has(.wic-page) .wd-menu{display:flex}.wd-style-industrial:has(.wic-page) .wd-nav>nav{display:none;order:5;flex-direction:column;align-items:stretch;width:100%;margin:0;padding:1rem;max-height:calc(100svh - 6rem);overflow-y:auto}.wd-style-industrial:has(.wic-page) .wd-nav>nav.wd-open{display:flex;max-height:calc(100svh - 6rem)}.wd-style-industrial:has(.wic-page) .wx-mega-panel{position:static;display:block;padding:1rem;box-shadow:none}.wd-style-industrial:has(.wic-page) .wx-mega-links{grid-template-columns:1fr}}
@media(min-width:640px){.wic-page .we-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.wic-page .we-metrics>div{border-right:1px solid #67635f}.wic-page .we-filter-list{grid-template-columns:repeat(2,minmax(0,1fr))}.wic-page .we-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.wic-publications{gap:1.5rem;padding:2rem}.wic-publications .wic-cover{min-height:17rem}}
@media(min-width:768px){.wic-intro{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:2.5rem;margin-bottom:2.5rem}.wic-hero{padding-block:1rem 3rem}.wic-page .we-map-layout{grid-template-columns:minmax(0,1.8fr) minmax(0,1fr)}.wic-page .we-map{padding:2rem}.wic-page .we-timeline{grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem}.wic-page .we-lifecycle{grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5rem}.wic-page .we-lifecycle li{display:block}.wic-page .we-lifecycle h3{margin-top:.75rem}.wic-page .we-block{padding-block:3.5rem}.wic-page .wic-content{padding-top:1rem}.wic-publications{max-width:54rem;margin-inline:auto}.wic-publications .wic-cover{min-height:21rem}}
@media(min-width:1024px){.wic-page .we-metrics{grid-template-columns:repeat(4,minmax(0,1fr))}.wic-page .we-metrics>div{border-bottom:0}.wic-page .we-metrics strong{font-size:clamp(2.5rem,4vw,4rem)}.wic-page .we-filter-list{grid-template-columns:repeat(3,minmax(0,1fr))}.wic-page .we-filters{grid-template-columns:minmax(0,1.5fr) repeat(2,minmax(0,1fr)) auto}.wic-resource-hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:2.5rem;align-items:center}.wic-resource-hero .wic-intro{display:block;margin:0}.wic-resource-hero .wic-intro-copy{margin-top:2rem}.wic-resource-hero h1{font-size:clamp(3rem,4.3vw,4.6rem)}.wic-resource-hero .wic-publications{gap:1rem;padding:1.25rem}.wic-resource-hero .wic-publications .wic-cover{min-height:15rem}.wic-resource-hero .wic-publications figcaption{padding:1rem}.wic-page .we-lifecycle{grid-template-columns:repeat(5,minmax(0,1fr))}}
@media(prefers-reduced-motion:reduce){.wic-page *{scroll-behavior:auto;transition:none}}
@media(max-width:479px){.wic-publications{grid-template-columns:minmax(0,1fr)}.wic-publications .wic-cover{min-height:17rem}.wic-publications .wic-cover-type strong{font-size:1.25rem}}
`;
