import {createContext,e} from './shared.mjs';
import {ROUTES,PAGES,DTECH,cleanTitle,image,staticImage} from './data.mjs';
import {renderHeader,renderFooter,renderDialogs,renderHome,renderContact} from './shell.mjs';
import {BASE_CSS} from './styles.mjs';
import {BASE_CLIENT} from './client.mjs';
import {renderBusiness,BUSINESS_CSS,BUSINESS_CLIENT} from './business.mjs';
import {renderCompany,COMPANY_CSS,COMPANY_CLIENT} from './company.mjs';
import {WASION_SOURCES,rankRequirementsSearchPages} from '../wasion-demo-sources.mjs';
import {renderSearch,rankSearchPages,SEARCH_CSS,SEARCH_CLIENT} from '../wasion-experience/search.mjs';
import {buildDemoMetadata,renderLegalPage,renderCookiePreferences,DISCOVERY_CSS,DISCOVERY_CLIENT} from '../wasion-experience/discovery.mjs';
import {renderSessionNotice,SESSION_CSS,SESSION_CLIENT} from '../wasion-experience/session.mjs';
import {crmLoginUrl} from '../crm-navigation.mjs';
import {EXPERIENCE_ROUTES} from '../wasion-experience/content.mjs';
import {WASION_STYLES,wasionStyleBase} from '../wasion-demo-styles.mjs';
export const REQUIREMENTS_ROUTES=ROUTES;
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const REQUIREMENTS_SEARCH_CLIENT=SEARCH_CLIENT.replace(rankSearchPages.toString(),rankRequirementsSearchPages.toString()).replace('const src=official(p.image||p.images?.[0]);',"const src=String(p.image||'').startsWith('/assets/wasion-requirements/')&&catalog.some(item=>item.image===p.image)?p.image:official(p.image||p.images?.[0]);");
const UTILITY_CSS=`
.wr-legal .wd-container{width:calc(100% - 2rem);max-width:78rem;margin-inline:auto}.wr-legal .wd-breadcrumb{display:flex;gap:.8rem;padding-block:2rem;font-size:.85rem;color:var(--muted)}.wr-legal .wd-page-intro{padding-block:2rem 4rem}.wr-legal .wd-page-intro h1{font-size:clamp(2.5rem,5vw,5rem);max-width:60rem}.wr-legal .wd-page-intro p{max-width:46rem;color:var(--muted)}.wr-legal .wd-legal-nav{background:var(--surface);border-color:var(--mint)}.wr-legal .wd-legal-content a{color:var(--mint)}.wr-legal .wd-legal-table th{background:var(--surface)}.wr-legal .wd-legal-content h2{font-size:1.8rem}.wr-archive{display:grid;gap:1px;background:var(--line);border:1px solid var(--line)}.wr-archive>a{padding:2rem;background:var(--navy);display:block}.wr-archive h2{font-size:1.7rem}.wr-archive p{color:var(--muted)}
#ws-search{--ws-navy:var(--white);--ws-blue:var(--mint);--ws-mint:#a5e8cf;--ws-paper:#082e59;--ws-line:#294c70;background:var(--navy);color:var(--white)}#ws-search .ws-banner{background:#073563;padding-block:3rem}#ws-search .ws-search-controls{background:var(--navy)}#ws-search .ws-search-controls input{background:var(--navy);color:var(--white)}#ws-search .ws-search-controls button{color:var(--navy);background:var(--mint)}#ws-search .ws-tabs button{background:var(--navy);color:var(--white)}#ws-search .ws-tabs button[aria-selected=true]{color:var(--navy);background:var(--mint)}#ws-search .ws-heading p,#ws-search .ws-breadcrumb,#ws-search .ws-examples>span,#ws-search .ws-page p,#ws-search .ws-product p,#ws-search .ws-source-path,#ws-search .ws-ai-disclosure,#ws-search .ws-state{color:var(--muted)}#ws-search .ws-answer-more{background:var(--navy);color:var(--mint)}#ws-search .ws-answer-collapsed:after{background:linear-gradient(transparent,var(--navy))}#ws-search .ws-product{background:var(--surface);border-color:var(--line)}#ws-search .ws-product-image{background:#eef3f6}#ws-search .ws-contact{background:var(--surface);color:var(--white)}#ws-search .ws-contact p{color:var(--muted)}#ws-search .ws-contact>a{color:var(--navy);background:var(--mint)}#ws-search .ws-page{padding-block:1.5rem}#ws-search .ws-section-heading>a{color:var(--mint)}#ws-search .ws-source-chip{color:var(--white)}.ws-cite-panel{--ws-navy:#001e45;--ws-blue:#07529a;--ws-mint:#a5e8cf}
@media(min-width:768px){.wr-legal .wd-container{width:calc(100% - 4rem)}.wr-archive{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
function utility(slug,c){
 const legal=renderLegalPage(slug,c.base);
 if(legal)return `<div class="wr-legal">${legal.replaceAll('sales@wasion.com','marketing@wasion.com').replace('Official images and the homepage video are loaded from en.wasion.com. Your browser contacts that website to load them.','Official images and films are served with this private preview. Following official document or source links contacts the linked website.').replace('Updated 14 October 2026','Updated 15 October 2026')}</div>`;
 if(slug==='styles')return c.hero('Design archive','The 09/16 requirements rebuild is the current customer preview. Earlier explorations remain available for project reference.','',{compact:true})+c.section('design-archive',`<div class="wr-archive">${Object.entries(WASION_STYLES).map(([key,s])=>`<a href="${wasionStyleBase(key)}"><span class="wr-eyebrow">${key==='requirements'?'Current customer requirements':'Previous exploration'}</span><h2>${e(s.label)}</h2><p>${e(s.description)}</p></a>`).join('')}</div>`);
 if(slug==='terms')return c.hero('About this private preview','For authorised design and interaction review.','',{compact:true})+c.section('preview-terms','<h2>Review scope</h2><p>This preview illustrates the proposed Wasion website. Published product specifications and project facts link to official sources. Confirm availability, model applicability and current documents with Wasion. Enquiry forms prepare a request for review; they do not automatically send messages or create customer records.</p>');
 const p=c.page(slug);if(p)return c.hero(cleanTitle(p),p.summary||'',c.image(p),{compact:true})+c.section('official-information',`<div class="wr-reading">${(p.paragraphs||[]).map(t=>`<p>${e(t)}</p>`).join('')}${c.sources([p.url])}</div>`)+c.cta();
 return null;
}
export function renderRequirementsPage(nonce,{slug='home',query='',visitorRegion=''}={}){
 if(!ROUTES.includes(slug))return null;
 const c={...createContext('/demo/wasion'),visitorRegion};
 let body=slug==='home'?renderHome(c):slug==='contact'?renderContact(c):slug==='search'?renderSearch(query,c.base):renderCompany(slug,c)||renderBusiness(slug,c)||utility(slug,c);
 if(!body)return null;
 if(slug==='search')for(const p of PAGES){for(const u of p.images||[])body=body.replaceAll(e(u),e(staticImage(u)));}
 const p=PAGES.find(p=>p.slug===slug)||c.products.find(p=>p.slug===slug)||c.solutions.find(p=>p.slug===slug);
 const title=slug==='home'?'Smart metering & connected energy networks':slug==='search'?'AI search':p?cleanTitle(p):slug.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
 const pageUrl=slug==='home'?c.base:c.h(slug),loginUrl=crmLoginUrl(pageUrl);
 const metadata=buildDemoMetadata({slug,title,description:p?.summary||'Explore Wasion products, solutions and global project experience.',page:p,nonce,base:c.base});
 const data=WASION_SOURCES.map(p=>({id:p.id,title:cleanTitle(p),category:p.category,href:c.h(p.slug),url:p.url,excerpt:p.excerpt,summary:p.summary,image:staticImage(p.image),downloads:p.downloads,text:p.searchText.slice(0,18000)}));
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${metadata}<style nonce="${e(nonce)}">${BASE_CSS}${BUSINESS_CSS}${COMPANY_CSS}${SEARCH_CSS}${DISCOVERY_CSS}${SESSION_CSS}${UTILITY_CSS}</style></head><body class="wd-style-requirements wr-page-${e(slug)}">${renderSessionNotice({loginUrl})}<div id="wd-protected">${renderHeader(slug,c)}<main id="main">${body}</main>${renderFooter({...c,pageSources:[p?.url,...(EXPERIENCE_ROUTES.find(p=>p.slug===slug)?.sourceUrls||[])]})}${renderDialogs(c)}${renderCookiePreferences(c.base,{showTrigger:false})}</div><script nonce="${e(nonce)}">const WASION_BASE=${json(c.base)};const CRM_LOGIN_URL=${json(loginUrl)};const CRM_PAGE_URL=${json(pageUrl)};const WASION_DATA=${json(data)};const SEARCH_QUERY=${json(query)};(()=>{${BASE_CLIENT}${BUSINESS_CLIENT}${COMPANY_CLIENT}})();${slug==='search'?REQUIREMENTS_SEARCH_CLIENT:''}${DISCOVERY_CLIENT}${SESSION_CLIENT}</script></body></html>`;
}
