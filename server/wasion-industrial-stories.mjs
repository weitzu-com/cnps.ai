import { CHALLENGES, EXPERIENCE_ROUTES, EXPERIENCE_RELATIONSHIPS, getCaseStudies, renderCaseStudyFilters } from './wasion-experience/content.mjs';
import covers from './wasion-story-covers.json' with { type: 'json' };

const ARROW = '<span aria-hidden="true">↗</span>';
const INDEXES = ['solutions', 'your-challenges', 'case-studies', 'success-stories', 'next-gen-ami'];
export const INDUSTRIAL_STORY_ROUTES = Object.freeze([...INDEXES, ...CHALLENGES.map(c => c.slug)]);
export const isIndustrialStoryPage = page => !!page && (INDUSTRIAL_STORY_ROUTES.includes(page.slug) || (['Solutions', 'Success Stories'].includes(page.category) && page.pageType === 'detail'));

// These phrases are extracted from the shared case record. Capacity remains
// capacity; an estimated generation figure is never presented as a result.
export function projectHighlights(page) {
  const text = (page.paragraphs || []).join(' ');
  const meters = text.match(/((?:over )?\d[\d,.]*(?: million)?) ((?:Single-phase and Three-phase |Single-phase |single-phase |Three-phase )(?:Smart Prepaid Meters|Smart Meters|prepaid meters))/i);
  const period = text.match(/(?:Since \d{4}|From \d{4} to \d{4})/)?.[0];
  if (meters) return [{ value: meters[1], label: `${meters[2]}${period ? ` · ${period}` : ''}` }];
  const pv = text.match(/installed photovoltaic capacity is (\d+ MW)/);
  const storage = text.match(/new energy storage capacity is ([\d.]+ MW\/[\d.]+ MWh)/);
  if (pv) return [{ value: pv[1], label: 'Installed photovoltaic capacity' }, ...(storage ? [{ value: storage[1], label: 'New energy storage capacity' }] : [])];
  const station = text.match(/Each energy station has a (\d+ kW) (PV capacity)/);
  return station ? [{ value: station[1], label: `${station[2]} · each energy station` }] : [];
}

export function renderIndustrialStory(page, ctx, originalBody) {
  if (!isIndustrialStoryPage(page)) return originalBody;
  const { helpers: h, pages, base, generatedAt } = ctx;
  const e = h.escape, name = h.title(page), get = slug => pages.find(p => p.slug === slug);
  const href = slug => `${base}/${slug}`;
  const link = (slug, label, cls = '') => `<a class="${cls}" href="${href(slug)}">${e(label)} ${ARROW}</a>`;
  const source = (p, label = 'View official source') => h.external(p.url, label);
  const isCase = page.category === 'Success Stories';
  const caseDetail = isCase && page.pageType === 'detail';
  const solutionDetail = page.category === 'Solutions' && page.pageType === 'detail';
  const cases = getCaseStudies(ctx);
  const cover = p => covers[p.slug] || h.image(p);
  const ai = `<a class="wis-ai" href="${href('search')}?q=${encodeURIComponent(`Tell me about ${name}`)}">Questions about this ${isCase ? 'project' : 'application'}? Ask Wasion AI ${ARROW}</a>`;
  const nav = `<nav class="wis-nav wd-container" aria-label="Applications and project experience">${[['solutions','All solutions'],...CHALLENGES.map(c=>[c.slug,c.title]),['case-studies','Case studies']].map(([slug,label])=>`<a href="${href(slug)}"${slug===page.slug || (isCase && slug==='case-studies') || (page.slug==='your-challenges' && slug==='solutions') ? ' aria-current="page"' : ''}>${e(label)}</a>`).join('')}</nav>`;
  const parent = isCase ? 'case-studies' : 'solutions';
  const breadcrumb = `<nav class="wd-container wd-breadcrumb" aria-label="Breadcrumb"><a href="${base}">Home</a><span aria-hidden="true">/</span>${page.slug === parent ? `<span>${e(name)}</span>` : `<a href="${href(parent)}">${isCase ? 'Case studies' : 'Solutions'}</a><span aria-hidden="true">/</span><span>${e(name)}</span>`}</nav>`;
  const projectFacts = p => (p.paragraphs || []).filter(t=>/^(Client|Country or Region)\s*:/i.test(t)).map(t=>{ const i=t.indexOf(':'); return `<div><dt>${e(t.slice(0,i).trim())}</dt><dd>${e(t.slice(i+1).trim())}</dd></div>`; }).join('');
  const highlights = (p, cls = '') => { const values=projectHighlights(p); return values.length ? `<div class="wis-highlights ${cls}">${values.map(({value,label})=>`<div><strong>${e(value)}</strong><span>${e(label)}</span></div>`).join('')}</div>` : ''; };
  const caseCard = p => `<div class="wis-case-card"><a class="wis-case-media" href="${href(p.slug)}" aria-label="Explore ${e(h.title(p))}">${h.img(cover(p), h.title(p))}</a><div class="wis-case-copy"><span class="wis-label">${e(p.region || cases.find(c=>c.slug===p.slug)?.region || 'PROJECT EXPERIENCE')}</span><h3>${link(p.slug,h.title(p))}</h3>${highlights(p,'wis-card-scale')}<p>${e(String(p.summary || '').slice(0,260))}${p.summary?.length>260?'…':''}</p><div class="wis-card-links">${link(p.slug,'Read project story')}${source(p,'Official source')}</div></div></div>`;
  const scene = (p, caption, kind = 'cover') => `<figure class="wis-scene wis-scene-${kind}"><a class="wis-scene-image" href="${e(encodeURI(p.url))}" target="_blank" rel="noopener noreferrer" aria-label="Open official Wasion page: ${e(h.title(p))}">${h.img(kind==='cover'?cover(p):h.image(p),h.title(p),'',false)}</a><figcaption><span>${e(caption)}</span>${source(p,'Official Wasion page')}</figcaption></figure>`;
  const contextPage = CHALLENGES.find(c=>c.slug===page.slug);
  const heroProject = get(contextPage?.cases[0] || (contextPage?.layout==='reliability' ? 'tms-transformer-monitoring-system' : contextPage?.layout==='multiutility' ? 'i-110-series-smart-water-meter' : 'metering-solutions-for-cfe-in-mexico'));
  let heroImage = caseDetail || solutionDetail ? scene(page,caseDetail?'Official project image':'Official solution preview','contain') : scene(isCase ? get('agricultural-pv-and-energy-storage-complementary-project') : heroProject, isCase ? 'Project experience · Hainan, China' : heroProject.category==='Success Stories' ? `Project experience · ${h.title(heroProject)}` : `Related published information · ${h.title(heroProject)}`, isCase || heroProject.category==='Success Stories'?'cover':'contain');
  let headline = name, description = page.summary || page.description || EXPERIENCE_ROUTES.find(r=>r.slug===page.slug)?.summary;
  if (['solutions','your-challenges'].includes(page.slug)) { headline='From your challenge.\nTo a connected solution.'; description='Explore products and solutions through your application, or go directly to published technical information.'; }
  if (['case-studies','success-stories'].includes(page.slug)) { headline='Engineering in the field.\nExperience around the world.'; description='Explore documented utility and energy projects.'; }
  const hero = `<section class="wis-hero wd-container" aria-labelledby="wis-title"><div class="wis-intro"><span class="wis-label">WASION / ${caseDetail?'PROJECT EXPERIENCE':isCase?'CASE STUDIES':'SOLUTIONS & APPLICATIONS'}</span><h1 id="wis-title">${e(headline).replace(/\n/g,'<br>')}</h1><p class="wis-description">${e(caseDetail ? 'Published project experience from Wasion International.' : description)}</p>${caseDetail?`<dl class="wis-facts">${projectFacts(page)}</dl>${highlights(page)}`:''}<div class="wis-actions">${link(caseDetail?'contact':isCase?'case-studies#wis-cases':solutionDetail?`${page.slug}#overview`:'solutions#wis-solutions',caseDetail?'Discuss your project':isCase?'Explore the projects':solutionDetail?'Explore this solution':'Explore published solutions','wd-button')}${source(page.url?page:get(isCase?'success-stories':'solutions'))}</div>${ai}</div>${heroImage}</section>`;
  let body;
  if (caseDetail) {
    const tableText = new Set((page.tables || []).flat(2));
    const paragraphs = [...new Set(page.paragraphs || [])].filter(p=>!tableText.has(p) && !(page.features || []).includes(p));
    const related = cases.filter(p=>p.slug!==page.slug).slice(0,3);
    body = `<nav class="wis-sections wd-container" aria-label="Page sections"><a href="#overview">Project story</a><a href="#documents">Documents & sources</a><a href="#wis-related">More projects</a></nav><div class="wd-container wis-project-content"><section id="overview" class="wis-story"><div><span class="wis-label">PROJECT CONTEXT & REPORTED RESULTS</span><h2>The project.<br>The difference it makes.</h2><p class="wis-note">Project scale and results as published by Wasion. Read the full context and source.</p></div><div class="wis-story-copy">${paragraphs.map(t=>`<p>${e(t)}</p>`).join('')}</div></section><section id="documents" class="wis-documents"><div><span class="wis-label">DOCUMENTS & SOURCES</span><h2>Go to the source.</h2></div><div class="wd-source-box"><span class="wis-label">OFFICIAL SOURCE / EN.WASION.COM</span>${source(page,name)}<p>Content reproduced from Wasion International, ${e(generatedAt?.slice(0,10)||'2026-10-14')}. Confirm specifications, availability and project suitability with Wasion.</p>${page.downloads?.length ? `<div class="wd-downloads">${page.downloads.map(d=>h.external(d.url,d.title||'Open document')).join('')}</div>` : `<p>${e(page.downloadNotice || 'No downloadable document was provided on this source page. Contact Wasion for current documentation.')}</p>`}</div></section><section class="wis-related" id="wis-related"><div class="wis-heading"><div><span class="wis-label">WASION IN THE WORLD</span><h2>Explore more projects.</h2></div>${link('case-studies','All case studies')}</div><div class="wis-case-grid">${related.map(caseCard).join('')}</div></section></div>`;
  } else if (isCase) {
    body = `<section class="wd-container wis-case-list" id="wis-cases" aria-labelledby="wis-cases-title"><div class="wis-heading"><div><span class="wis-label">DOCUMENTED DEPLOYMENTS</span><h2 id="wis-cases-title">Find relevant project experience.</h2></div><p>Explore documented utility and energy projects.</p></div>${renderCaseStudyFilters(cases,ctx,caseCard).replace(/<select data-filter="(region|topic)"/g,(_,key)=>`<select aria-label="${key==='region'?'Region':'Topic'}" data-filter="${key}"`)}<details class="we-sources"><summary>Information sources</summary>${source(get('success-stories'),'Official Wasion information')}</details></section>`;
  } else {
    // Reuse every existing scenario, source, capability, relationship and native
    // discovery tab. Only replace the generic opening with this brand composition.
    const start=originalBody.indexOf('<div class="wd-container we-content');
    body=start>=0?originalBody.slice(start):originalBody;
    if (['solutions','your-challenges'].includes(page.slug)) {
      const challengeMarkup=CHALLENGES.map((c,i)=>{ const p=get(c.cases[0] || c.solutions[0] || 'i-110-series-smart-water-meter'); return `<a class="wis-application" href="${href(c.slug)}"><div class="wis-application-image${p.category==='Success Stories'?'':' wis-image-contain'}">${h.img(p.category==='Success Stories'?cover(p):h.image(p),h.title(p))}</div><div><span class="wis-label">0${i+1} / APPLICATION</span><h3>${e(c.title)}</h3><p>${e(c.intro)}</p><span class="wis-application-link">Explore the challenge ${ARROW}</span></div></a>`; }).join('');
      body=body.replace(/<div class="we-challenge-grid">[\s\S]*?<\/div>/,`<section class="wis-applications" aria-labelledby="wis-applications-title"><div class="wis-heading"><div><span class="wis-label">START WITH YOUR APPLICATION</span><h2 id="wis-applications-title">The connections that matter.</h2></div></div><div class="wis-application-grid">${challengeMarkup}</div></section>`);
    }
    body=body.replace('<h2>Published solutions</h2>','<h2 id="wis-solutions">Published solutions.</h2>');
    if (!solutionDetail) body=body.replace('<div class="wd-container we-content','<div class="wis-experience wd-container we-content');
  }
  return `<div class="wis-experience-page${caseDetail?' wis-is-project':''}${solutionDetail?' wis-is-solution':''}">${breadcrumb}${hero}${nav}${body}</div>`;
}

export const INDUSTRIAL_STORIES_CSS = `
.wis-experience-page{overflow-wrap:anywhere;color:var(--ink)}
.wis-experience-page :is(section,div,figure,article,aside){min-width:0}
.wis-experience-page :is(a,button,input,select,summary):focus-visible{outline:3px solid var(--red);outline-offset:4px}
.wis-experience-page :is(h1,h2,h3){color:var(--ink)}
.wis-experience-page .wis-label{display:block;font:400 .75rem/1.6 var(--wi-tech);letter-spacing:.08em;color:var(--muted);margin-bottom:1rem}
.wis-experience-page .wd-breadcrumb{font-size:.8125rem;gap:.5rem;padding-block:1rem 1.5rem}
.wis-hero{display:grid;gap:1.75rem;padding-block:.5rem 2.5rem}
.wis-intro{align-self:center}
.wis-experience-page .wis-intro h1{font:300 clamp(2.25rem,4.5vw,4.75rem)/1.06 var(--wi-display);letter-spacing:-.05em;margin:0 0 1.5rem;white-space:normal}
.wis-description{font-size:1.0625rem;line-height:1.7;color:var(--muted);max-width:39rem;margin-bottom:1.5rem}
.wis-actions{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem 1.5rem}
.wis-actions>a{min-height:2.75rem;display:inline-flex;align-items:center;gap:1rem;font-size:.875rem}
.wis-experience-page .wis-actions .wd-button{font-size:.9375rem;min-height:3.25rem;white-space:normal;border-radius:1rem}
.wis-experience-page .wis-ai{display:inline-flex;gap:.75rem;align-items:center;min-height:2.75rem;color:var(--red);font-size:.8125rem;margin-top:1rem;max-width:100%}
.wis-scene{margin:0;background:#fff;border-radius:var(--wi-radius);overflow:hidden;display:flex;flex-direction:column}
.wis-scene-image{display:flex;flex:1;min-height:0}
.wis-scene-image img{width:100%;height:17rem;object-fit:cover;flex:1}
.wis-scene-contain .wis-scene-image img{object-fit:contain;background:#fff;min-height:0;padding:.5rem}
.wis-scene figcaption{display:flex;flex-wrap:wrap;gap:.5rem 1rem;justify-content:space-between;border-top:1px solid var(--line);padding:.75rem 1.25rem;font:400 .75rem/1.6 var(--wi-tech);color:var(--muted)}
.wis-scene figcaption a{display:inline-flex;align-items:center;gap:.5rem;min-height:2.75rem}
.wis-nav,.wis-sections{display:flex;flex-wrap:wrap;gap:.5rem 1rem;padding-block:1rem;border-block:1px solid var(--line)}
.wis-nav>a,.wis-sections>a{display:inline-flex;align-items:center;min-height:2.75rem;padding:.5rem .875rem;font-size:.8125rem;line-height:1.5;border-radius:1rem;border:1px solid #827e76}
.wis-nav>a[aria-current]{background:var(--ink);border-color:var(--ink);color:#fff}
.wis-nav>a:hover,.wis-sections>a:hover{border-color:var(--red);text-decoration:underline;text-underline-offset:.25rem}
.wis-experience-page h2{font:300 clamp(1.875rem,3.2vw,3.125rem)/1.12 var(--wi-display);letter-spacing:-.04em}
.wis-experience-page h3{font-weight:400;letter-spacing:-.025em;line-height:1.3}
.wis-experience-page .we-content{padding-block:2.5rem 4rem}
.wis-heading{display:flex;flex-direction:column;gap:1rem;margin-bottom:1.75rem}
.wis-heading h2{margin:0}
.wis-heading p{max-width:30rem;color:var(--muted);margin:0}
.wis-heading>a{min-height:2.75rem;display:inline-flex;align-items:center;font-size:.875rem;gap:1rem}
.wis-application-grid{display:grid;gap:1.25rem}
.wis-application{display:flex;flex-direction:column;background:#fff;border-radius:var(--wi-radius);overflow:hidden}
.wis-application-image{height:13rem;overflow:hidden}
.wis-application-image img{width:100%;height:100%;object-fit:cover}
.wis-image-contain img{object-fit:contain;padding:1rem}
.wis-application>div:last-child{padding:1.5rem}
.wis-application h3{font-size:1.5rem;margin-bottom:1rem}
.wis-application p{color:var(--muted);font-size:1rem;line-height:1.7;margin-bottom:1.25rem}
.wis-application-link{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:2.75rem;color:var(--red);font-size:.875rem}
.wis-experience-page .we-block{margin-block:0;padding-block:2.5rem;border-bottom:1px solid var(--line)}
.wis-experience-page .we-block>h2{margin-bottom:1.75rem}
.wis-experience-page .wd-card{border:0;border-radius:var(--wi-radius);box-shadow:none;min-width:0}
.wis-experience-page .wd-card-image{height:15rem;background:#fff}
.wis-experience-page .wd-card-image img{object-fit:contain;padding:.75rem;transform:none}
.wis-experience-page .wd-card-body{padding:1.5rem}
.wis-experience-page .wd-card .wd-overline{color:var(--muted);font:400 .75rem/1.6 var(--wi-tech)}
.wis-experience-page .wd-card h3{font-size:1.5rem;color:var(--ink)}
.wis-experience-page .wd-card p{color:var(--muted);font-size:1rem}
.wis-experience-page .wd-card-link{min-height:2.75rem;align-items:center;color:var(--red);gap:1rem}
.wis-experience-page .wd-grid{grid-template-columns:minmax(0,1fr)}
.wis-experience-page .we-feature-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:0;list-style:none;padding:0;border-top:1px solid var(--line)}
.wis-experience-page .we-feature-grid li{display:flex;align-items:flex-start;gap:1rem;border:0;border-radius:0;border-bottom:1px solid var(--line);background:transparent;color:var(--ink);padding:1.25rem 0;font-size:1rem}
.wis-experience-page .we-feature-icon{color:var(--red);background:transparent;flex-shrink:0}
.wis-experience-page .wd-reading p,.wis-experience-page .we-block p{color:var(--muted);font-size:1rem;line-height:1.8}
.wis-experience-page .we-block>a,.wis-experience-page .we-block>p>a{display:inline-flex;align-items:center;min-height:2.75rem;gap:.75rem;color:var(--red);font-size:.875rem;margin-right:1.25rem}
.wis-experience-page .we-discovery{background:#fff;border:1px solid var(--line);border-radius:var(--wi-radius);overflow:hidden}
.wis-experience-page .we-discovery-tabs{display:flex;flex-wrap:wrap;gap:.5rem;padding:1rem;border-color:var(--line);background:#fff}
.wis-experience-page .we-discovery-tabs button{color:var(--ink);background:var(--paper);border:1px solid #827e76;border-radius:1rem;min-height:3rem;padding:.75rem 1rem;text-align:left;font-size:.875rem;line-height:1.5;white-space:normal;max-width:100%;min-width:0}
.wis-experience-page .we-discovery-tabs button[aria-selected=true]{background:var(--ink);color:#fff;border-color:var(--ink)}
.wis-experience-page .we-discovery-tabs button span{color:inherit;margin-right:.5rem}
.wis-experience-page .we-discovery-panel{padding:1.5rem;background:#fff;border:0;min-height:0}
.wis-experience-page .we-discovery-panel h3{color:var(--ink);font-size:1.5rem}
.wis-experience-page .we-discovery-panel :is(p,a){color:var(--muted);font-size:1rem}
.wis-experience-page .we-discovery-panel a{min-height:2.75rem;display:inline-flex;align-items:center;gap:.5rem;color:var(--red)}
.wis-experience-page :is(.we-note,.wis-note){font-size:.8125rem;line-height:1.7;color:var(--muted)}
.wis-experience-page .we-sources{margin-top:1.5rem;border-color:var(--line)}
.wis-experience-page .we-sources summary{min-height:2.75rem;padding-block:.75rem;color:var(--muted)}
.wis-experience-page .we-sources a{display:inline-flex;align-items:center;min-height:2.75rem;color:var(--red);margin-right:1rem;font-size:.875rem}
.wis-facts{display:grid;gap:1rem;margin:1.5rem 0;padding-block:1.25rem;border-block:1px solid var(--line)}
.wis-facts dt{font:400 .75rem/1.6 var(--wi-tech);color:var(--muted);margin-bottom:.375rem}
.wis-facts dd{margin:0;font-size:1rem;line-height:1.6}
.wis-highlights{display:grid;gap:1.5rem;margin-block:1.5rem}
.wis-highlights:not(:has(>div:nth-child(2))){grid-template-columns:minmax(0,1fr)}
.wis-highlights>div{display:flex;flex-direction:column;gap:.5rem}
.wis-highlights strong{font:400 clamp(2rem,3.5vw,3.75rem)/1.1 var(--wi-tech);letter-spacing:-.06em;color:var(--ink)}
.wis-highlights span{font-size:.8125rem;color:var(--muted);line-height:1.6}
.wis-case-list{padding-block:2.5rem 4rem;scroll-margin-top:8rem}
.wis-case-grid,.wis-experience-page .we-case-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:1.5rem}
.wis-case-card{height:100%;background:#fff;border-radius:var(--wi-radius);overflow:hidden;display:flex;flex-direction:column}
.wis-case-media{display:block;aspect-ratio:1.66;background:#e8e7e1;overflow:hidden}
.wis-case-media img{height:100%;width:100%;object-fit:cover}
.wis-case-copy{display:flex;flex-direction:column;padding:1.5rem;flex:1}
.wis-case-copy h3{font-size:1.5rem;margin:0 0 1rem}
.wis-case-copy h3 a{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
.wis-case-copy p{font-size:1rem;line-height:1.75;color:var(--muted)}
.wis-card-scale{margin:0 0 1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--line)}
.wis-card-scale strong{font-size:2rem}
.wis-card-links{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem 1rem;margin-top:auto}
.wis-card-links>a{display:inline-flex;align-items:center;gap:.5rem;min-height:2.75rem;color:var(--red);font-size:.8125rem}
.wis-experience-page .we-filters{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem;padding:1.25rem;background:#fff;border:1px solid var(--line);border-radius:var(--wi-radius);margin-bottom:1rem}
.wis-experience-page .we-filters label{display:flex;flex-direction:column;gap:.75rem;font-size:.8125rem;color:var(--ink);min-width:0}
.wis-experience-page .we-filters :is(input,select){width:100%;min-width:0;min-height:3.25rem;border:1px solid #827e76;border-radius:.875rem;padding:.75rem;font-size:1rem;background:#fff;color:var(--ink)}
.wis-experience-page .we-filter-reset,.wis-experience-page .we-filter-more{border:1px solid var(--ink);border-radius:1rem;min-height:3.25rem;background:var(--ink);color:#fff;font-size:.875rem;padding:.75rem 1.25rem}
.wis-experience-page .we-filter-count{font:400 .8125rem/1.6 var(--wi-tech);color:var(--muted);padding-block:1rem;border-top:1px solid var(--line);margin-top:1.5rem}
.wis-experience-page .we-filter-empty{padding:1.5rem;background:#fff;border-radius:1rem;font-size:1rem;color:var(--muted)}
.wis-experience-page .we-filter-more{display:block;margin:2rem auto 0}
.wis-project-content>section{padding-block:3rem;border-bottom:1px solid var(--line);scroll-margin-top:8rem}
.wis-story,.wis-documents{display:grid;gap:1rem}
.wis-story-copy p{font-size:1.0625rem;line-height:1.85;color:var(--muted);margin-bottom:1.5rem}
.wis-project-content .wd-source-box{margin:0;background:#fff;border:0;border-radius:var(--wi-radius);padding:1.5rem}
.wis-project-content .wd-source-box>a{display:inline-flex;gap:.5rem;min-height:2.75rem;align-items:center;color:var(--red);font-size:1rem}
.wis-project-content .wd-source-box p{font-size:.875rem;line-height:1.8;color:var(--muted)}
.wis-experience-page :is(.we-split,.we-utility-pair){grid-template-columns:minmax(0,1fr);gap:1.5rem}
.wis-experience-page :is(.we-equation,.we-path){display:flex;flex-wrap:wrap;gap:.75rem;background:#fff;border-radius:1rem;color:var(--ink)}
.wis-experience-page :is(.we-equation,.we-path)>span{min-width:0;white-space:normal;color:var(--ink);background:transparent}
.wis-experience-page section[id],.wis-experience-page h2[id]{scroll-margin-top:8rem}
.wd-style-industrial:has(.wis-experience-page) .wd-header{container-type:inline-size}
.wd-style-industrial:has(.wis-experience-page) :is(.wd-contact-band h2,.wd-contact-band .wd-container>div,.wd-footer-top>div){min-width:0;max-width:100%;overflow-wrap:anywhere}
@container (width < 64rem){.wd-style-industrial:has(.wis-experience-page) .wd-nav{min-height:5rem;gap:.75rem;flex-wrap:wrap}.wd-style-industrial:has(.wis-experience-page) .wd-nav>.wd-brand{margin-right:auto;max-width:100%}.wd-style-industrial:has(.wis-experience-page) .wd-menu{display:flex}.wd-style-industrial:has(.wis-experience-page) .wd-nav>nav{display:none;order:5;flex-direction:column;align-items:stretch;width:100%;margin:0;padding:1rem;max-height:calc(100svh - 6rem);overflow-y:auto}.wd-style-industrial:has(.wis-experience-page) .wd-nav>nav.wd-open{display:flex;max-height:calc(100svh - 6rem)}.wd-style-industrial:has(.wis-experience-page) .wx-mega-panel{position:static;display:block;padding:1rem;box-shadow:none}.wd-style-industrial:has(.wis-experience-page) .wx-mega-links{grid-template-columns:1fr}}
.wd-style-industrial:has(.wis-experience-page) .wd-contact-band .wd-button{max-width:100%;white-space:normal}
@media(min-width:640px){.wis-application-grid,.wis-case-grid,.wis-experience-page .we-case-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wis-highlights{grid-template-columns:repeat(2,minmax(0,1fr))}.wis-experience-page .wd-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:768px){.wis-hero{gap:2rem;padding-block:1rem 3rem}.wis-scene-image img{height:24rem}.wis-heading{flex-direction:row;justify-content:space-between;align-items:flex-end}.wis-experience-page .we-filters{grid-template-columns:minmax(0,2fr) repeat(2,minmax(0,1fr));align-items:end}.wis-experience-page .we-filter-reset{grid-column:1/-1;justify-self:start}.wis-facts{grid-template-columns:1fr 1fr}.wis-experience-page .we-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:2rem}}
@media(min-width:1024px){.wis-hero{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:3rem;min-height:35rem;padding-bottom:3.5rem}.wis-scene-image img{height:25rem}.wis-is-project .wis-scene-image img{height:30rem}.wis-scene-contain .wis-scene-image img{max-height:35rem}.wis-application{flex-direction:row}.wis-application-image{width:40%;height:auto;min-height:18rem;flex-shrink:0}.wis-application>div:last-child{align-self:center}.wis-story,.wis-documents{grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:4rem}.wis-project-content>section{padding-block:4rem}.wis-experience-page .we-filters{grid-template-columns:minmax(0,2fr) repeat(2,minmax(0,1fr)) auto}.wis-experience-page .we-filter-reset{grid-column:auto}.wis-experience-page :is(.we-split,.we-utility-pair){grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:1280px){.wis-experience-page .wd-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.wis-case-grid,.wis-experience-page .we-case-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:639px){.wd-style-industrial:has(.wis-experience-page) .wx-utility nav{flex-wrap:wrap}.wd-style-industrial:has(.wis-experience-page) .wx-footer .wd-footer-top{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
