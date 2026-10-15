import { getProductCatalog, renderProductCatalogFilters, WASION_PRODUCT_GROUPS, renderTrustMetrics } from './wasion-experience/content.mjs';
import verifiedImages from './wasion-catalog-images.json' with { type: 'json' };

export const INDUSTRIAL_CATALOG_ROUTES = Object.freeze(['products','our-offering','electricity-metering-data-management','electricity-meters','telecommunications','system-software','water-gas-meters','digital-grid-distribution-monitoring','intelligent-power-distribution','energy-storage','renewable-energy']);
const families = [
  ['electricity-meters','Electricity meters'],['telecommunications','Communication'],['system-software','Software'],
  ['water-gas-meters','Water & gas'],['digital-grid-distribution-monitoring','Digital grid'],['energy-storage','Energy storage']
];
const canonical = slug => ({'intelligent-power-distribution':'digital-grid-distribution-monitoring','renewable-energy':'energy-storage'})[slug] || slug;
const preview = value => { const text = String(value || '').replace(/\s+/g, ' ').trim(); return text.length > 220 ? `${text.slice(0,217).trimEnd()}…` : text; };

export function renderIndustrialCatalog(slug, ctx) {
  if (!INDUSTRIAL_CATALOG_ROUTES.includes(slug)) return null;
  const { pages, helpers: h, base } = ctx, e = h.escape;
  const find = key => pages.find(p => p.slug === key);
  const arrow = '<span aria-hidden="true">↗</span>';
  const imageFor = item => item?.image || verifiedImages[item?.url] || '';
  const catalogFor = key => getProductCatalog(key, ctx);
  const categoryImage = key => {
    const data = catalogFor(key === 'electricity-metering-data-management' ? 'electricity-meters' : key);
    return data?.items.map(imageFor).find(Boolean);
  };
  const sourceLinks = urls => `<details class="we-sources"><summary>Information sources</summary>${[...new Set(urls.filter(Boolean))].map(u => h.external(u,'Official Wasion information')).join('')}</details>`;
  const categoryNav = `<nav class="wic-category-nav wd-container" aria-label="Product categories"><a href="${base}/products" ${['products','our-offering'].includes(slug) ? 'aria-current="page"' : ''}>All categories</a>${families.map(([key,label]) => `<a href="${base}/${key}" ${canonical(slug) === key ? 'aria-current="page"' : ''}>${e(label)}</a>`).join('')}</nav>`;
  const breadcrumb = `<nav class="wd-container wd-breadcrumb" aria-label="Breadcrumb"><a href="${base}">Home</a><span aria-hidden="true">/</span>${['products','our-offering'].includes(slug) ? '<span>Our Offering</span>' : `<a href="${base}/products">Products</a><span aria-hidden="true">/</span><span>${e(catalogFor(slug)?.name || 'Electricity Metering & Data Management')}</span>`}</nav>`;
  const aiLink = name => `<a class="wic-ai-link" href="${base}/search?q=${encodeURIComponent(`Help me explore Wasion ${name}`)}">Need help finding a product? Ask Wasion AI ${arrow}</a>`;
  const categoryCard = (key, name, description) => `<a class="wic-category-card" href="${base}/${key}"><div class="wic-category-image">${h.img(categoryImage(key), name)}</div><div class="wic-category-copy"><h3>${e(name)}</h3><p>${e(description)}</p><span>Explore ${arrow}</span></div></a>`;
  const overview = ['products','our-offering'].includes(slug), hub = slug === 'electricity-metering-data-management';
  let body;
  if (overview || hub) {
    const name = overview ? 'A connected portfolio for your utility.' : WASION_PRODUCT_GROUPS[0][1];
    const description = overview ? 'Explore products and solutions through your application, or go directly to published technical information.' : WASION_PRODUCT_GROUPS[0][2];
    const stageSlugs = overview ? ['ameter300-three-phase-smart-energy-meter','i-110-series-smart-water-meter','wir-3000-rf-communication-router'] : ['ameter300-three-phase-smart-energy-meter','wir-3000-rf-communication-router','field-deployment-manager'];
    const stage = `<div class="wic-portfolio-stage" aria-label="${overview ? 'Wasion electricity, water and communication products' : 'Wasion metering, communication and software products'}">${stageSlugs.map(key => { const p=find(key); return p ? `<a href="${h.href(p)}">${h.img(h.image(p),h.title(p),'',false)}<span>${e(h.title(p))} ${arrow}</span></a>` : ''; }).join('')}</div>`;
    const cards = overview ? WASION_PRODUCT_GROUPS.map(([key,title,desc]) => categoryCard(key,title,desc)) : [['electricity-meters','Electricity products'],['telecommunications','Communication'],['system-software','Software']].map(([key,title]) => categoryCard(key,title,find(key)?.summary || ''));
    const resources = hub ? `<section class="wic-trust">${renderTrustMetrics(ctx)}<div class="wic-resource-links"><div><h2>Published certifications</h2><p>Review the entity, product and regional scope in the official documentation.</p><a href="${base}/certifications">Explore certificates ${arrow}</a></div><div><h2>Resources</h2><a href="${base}/collateral-videos">Product catalogs and explained video ${arrow}</a></div></div></section>` : '';
    const sources = overview ? [find('products')?.url] : [find('electricity-meters')?.url,find('about')?.url,find('resources')?.url];
    body = `<section class="wic-intro wd-container wic-overview"><div><span class="wic-label">WASION / OUR OFFERING</span><h1>${e(name)}</h1><p>${e(description)}</p>${aiLink(overview?'products':name)}</div>${stage}</section>${categoryNav}<div class="wd-container wic-content"><section class="wic-families" aria-labelledby="wic-family-title"><div class="wic-section-heading"><span class="wic-label">PRODUCT PORTFOLIO</span><h2 id="wic-family-title">${overview?'Start with your application.':'Find your starting point'}</h2></div><div class="wic-category-grid${hub ? ' wic-hub-grid' : ''}">${cards.join('')}</div></section>${resources}${sourceLinks(sources)}</div>`;
  } else {
    const { name, owner, items } = catalogFor(slug);
    const card = item => {
      const internal = Boolean(item.slug), url = internal ? h.href(item) : encodeURI(item.url), image = imageFor(item);
      const attrs = internal ? '' : ' target="_blank" rel="noopener noreferrer"';
      return `<div class="wic-product-card"><a class="wic-card-image${image?'':' wic-no-image'}" href="${e(url)}"${attrs} aria-label="${e(`${internal?'Explore':'View official product'} ${item.title}`)}">${image ? h.img(image,item.title) : '<span>OFFICIAL PORTFOLIO<small>View the published product on Wasion</small></span>'}</a><div class="wic-card-body"><span class="wic-label">${e(item.type)}</span><h3><a href="${e(url)}"${attrs}>${e(item.title)} ${arrow}</a></h3><p>${e(preview(item.description))}</p><div class="wic-card-links"><a href="${e(url)}"${attrs}>${internal?'Product details':'View on Wasion'} ${arrow}</a>${internal ? h.external(item.url,'Official source') : ''}</div></div></div>`;
    };
    let filters = renderProductCatalogFilters(items,ctx,card);
    filters = filters.replace(/<select data-filter="(type|standard|region)"/g, (tag,key) => `<select aria-label="${({type:"Application",standard:"Listed standard",region:"Region"})[key]}" data-filter="${key}"`);
    filters = filters.replace(/<label>Region<select[\s\S]*?<\/select><\/label>/, region => `__WIC_REGION__${region}__WIC_END__`);
    const region = filters.match(/__WIC_REGION__([\s\S]*?)__WIC_END__/);
    if (region) filters = filters.replace(region[0],'').replace('</form>',`</form><details class="wic-region"><summary>Regional information</summary>${region[1]}<p>Regional availability is not specified in this catalog. Confirm current availability with Wasion.</p></details>`);
    body = `<section class="wic-intro wd-container"><span class="wic-label">WASION / PRODUCT PORTFOLIO</span><h1>${e(name)}</h1><p>${e(owner?.summary || 'Explore product information published by Wasion.')}</p>${aiLink(name)}</section>${categoryNav}<div class="wd-container wic-content"><section class="wic-selection" aria-labelledby="wic-selection-title"><div class="wic-section-heading"><h2 id="wic-selection-title">Find your product.</h2><p>Filter by name, application or a standard listed in the published information.</p></div>${filters}</section><p class="wic-availability">Select a product to inspect its published information. Confirm current regional availability and project requirements with Wasion.</p>${sourceLinks([owner?.url])}</div>`;
  }
  return `<div class="wic-catalog">${breadcrumb}${body}</div>`;
}

export const INDUSTRIAL_CATALOG_CSS = `
.wic-catalog{--wic-control:#827e76;overflow-wrap:anywhere}
.wic-catalog :is(section,div,article,form,label,details){min-width:0}
.wic-catalog :is(a,button,input,select,summary):focus-visible{outline:3px solid var(--red);outline-offset:4px}
.wic-label{display:block;font:400 .75rem/1.6 var(--wi-tech);letter-spacing:.08em;color:var(--muted);margin-bottom:1rem}
.wic-catalog .wd-breadcrumb{flex-wrap:wrap;gap:.5rem;padding-block:1rem;font-size:.8125rem}
.wic-catalog .wd-breadcrumb a{display:flex;align-items:center;min-height:2.75rem}
.wic-intro{padding-block:1rem 2.5rem}
.wic-intro h1{font:300 clamp(2.5rem,5.5vw,5.75rem)/1.05 var(--wi-display);letter-spacing:-.055em;max-width:62rem;margin-bottom:1.5rem}
.wic-intro>p,.wic-intro>div>p{max-width:47rem;color:var(--muted);font-size:1.0625rem;line-height:1.8;margin-bottom:1rem}
.wic-ai-link{display:inline-flex;align-items:center;gap:.75rem;font-size:.875rem;min-height:2.75rem;color:var(--red);max-width:100%}
.wic-overview{display:grid;gap:2rem}
.wic-portfolio-stage{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:#fff;border-radius:var(--wi-radius);overflow:hidden;padding:1rem}
.wic-portfolio-stage>a{display:flex;flex-direction:column;justify-content:space-between;align-items:center;gap:1rem;padding:.5rem;min-width:0;border-right:1px solid var(--line)}
.wic-portfolio-stage>a:last-child{border-right:0}
.wic-portfolio-stage img{object-fit:contain;width:100%;height:10rem}
.wic-portfolio-stage span{font:400 .75rem/1.6 var(--wi-tech);overflow-wrap:anywhere}
.wic-category-nav{display:flex;flex-wrap:wrap;gap:.5rem;padding-block:1.25rem;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.wic-category-nav>a{display:inline-flex;align-items:center;justify-content:center;min-height:2.75rem;max-width:100%;padding:.625rem .875rem;border:1px solid var(--wic-control);border-radius:.875rem;font-size:.875rem;line-height:1.6;text-align:center}
.wic-category-nav>a[aria-current]{background:var(--wi-dark);color:#fff;border-color:var(--wi-dark)}
.wic-category-nav>a:hover{border-color:var(--red);color:var(--red)}
.wic-category-nav>a[aria-current]:hover{background:var(--red);color:#fff}
.wic-content{padding-block:2.5rem 4rem}
.wic-section-heading{margin-bottom:1.5rem}
.wic-catalog .wic-section-heading h2,.wic-resource-links h2{font:300 clamp(1.875rem,3vw,3rem)/1.15 var(--wi-display);letter-spacing:-.035em;margin-bottom:1rem}
.wic-section-heading p{color:var(--muted);font-size:1rem;line-height:1.8;max-width:48rem;margin:0}
.wic-category-grid{display:grid;gap:1.5rem}
.wic-category-card{display:flex;flex-direction:column;min-width:0;border:1px solid var(--line);border-radius:var(--wi-radius);overflow:hidden;background:#fff}
.wic-category-image{height:18rem;padding:1.75rem;display:flex;align-items:center;justify-content:center}
.wic-category-image img{width:100%;height:100%;object-fit:contain}
.wic-category-copy{border-top:1px solid var(--line);padding:1.5rem;flex:1;display:flex;flex-direction:column}
.wic-category-copy h3{font:300 1.75rem/1.2 var(--wi-display);letter-spacing:-.035em;margin-bottom:1rem}
.wic-category-copy p{color:var(--muted);font-size:1rem;line-height:1.7;margin-bottom:1.5rem}
.wic-category-copy>span{margin-top:auto;display:flex;justify-content:space-between;gap:1rem;font-size:.875rem}
.wic-catalog .we-filters{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem;background:#fff;border:1px solid var(--line);border-radius:1.5rem;padding:1.25rem;margin:0}
.wic-catalog .we-filters label{display:flex;flex-direction:column;gap:.5rem;font-size:.8125rem;font-weight:400;color:var(--ink);min-width:0;flex:initial}
.wic-catalog :is(.we-filters,.wic-region) :is(input,select){width:100%;max-width:100%;min-width:0;min-height:3.25rem;padding:.75rem;border:1px solid var(--wic-control);border-radius:.75rem;color:var(--ink);background:#fff;font-size:1rem;line-height:1.5}
.wic-catalog .we-filter-reset,.wic-catalog .we-filter-more{min-height:3.25rem;background:var(--wi-dark);color:#fff;border:1px solid var(--wi-dark);border-radius:.875rem;padding:.75rem 1.25rem;font-size:.875rem;white-space:normal}
.wic-catalog .we-filter-reset:hover,.wic-catalog .we-filter-more:hover{background:var(--red);border-color:var(--red)}
.wic-region{border-bottom:1px solid var(--line);padding:.5rem 0 1rem;font-size:.875rem;color:var(--muted)}
.wic-region summary{cursor:pointer;min-height:2.75rem;line-height:1.7;padding:.625rem 0}
.wic-region label{display:block;max-width:24rem;color:var(--ink)}
.wic-region select{display:block;margin-top:.5rem}
.wic-region p{max-width:40rem;line-height:1.7;margin:1rem 0 0}
.wic-catalog .we-filter-count{font:400 .8125rem/1.7 var(--wi-tech);color:var(--muted);margin:1.25rem 0}
.wic-catalog .we-filter-list{display:grid;grid-template-columns:minmax(0,1fr);gap:1.5rem}
.wic-catalog .we-filter-item{border:0;padding:0;background:transparent;min-width:0}
.wic-product-card{height:100%;display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:1.5rem;overflow:hidden}
.wic-card-image{display:flex;align-items:center;justify-content:center;height:18rem;padding:1.5rem;flex:none;border-bottom:1px solid var(--line);background:#fff}
.wic-card-image img{width:100%;height:100%;object-fit:contain}
.wic-no-image{background:#e8e7e1;color:var(--muted);padding:2rem;font:400 .875rem/1.7 var(--wi-tech)}
.wic-no-image>span{max-width:20rem}
.wic-no-image small{display:block;font:400 .875rem/1.7 var(--wi-display);margin-top:1rem}
.wic-card-body{padding:1.5rem;display:flex;flex-direction:column;flex:1}
.wic-catalog .wic-card-body h3{font:400 1.5rem/1.25 var(--wi-tech);letter-spacing:-.045em;margin-bottom:1rem}
.wic-card-body h3>a{display:flex;align-items:baseline;justify-content:space-between;gap:.75rem;min-height:2.75rem}
.wic-card-body p{font-size:1rem;line-height:1.7;color:var(--muted);margin-bottom:1.5rem}
.wic-card-links{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem 1rem;margin-top:auto;border-top:1px solid var(--line);padding-top:.75rem}
.wic-card-links>a{display:inline-flex;align-items:center;gap:.5rem;min-height:2.75rem;font-size:.8125rem;color:var(--red)}
.wic-catalog .we-filter-more{width:100%;margin-top:1.5rem}
.wic-catalog .we-filter-empty{border:1px solid var(--wic-control);border-radius:1.5rem;padding:1.5rem;background:#e8e7e1;color:var(--ink);font-size:1rem;line-height:1.8}
.wic-availability{font-size:.875rem;line-height:1.8;color:var(--muted);margin:2rem 0}
.wic-catalog .we-sources{border:1px solid var(--wic-control);border-radius:1rem;padding:1rem 1.25rem;background:transparent;margin-top:2rem}
.wic-catalog .we-sources summary{min-height:2.75rem;line-height:1.7;font-size:.9375rem;cursor:pointer;padding:.5rem 0}
.wic-catalog .we-sources a{display:flex;align-items:center;gap:.75rem;min-height:2.75rem;font-size:.875rem;color:var(--red);padding:.5rem 0}
.wic-trust{margin-top:3rem;padding-top:3rem;border-top:1px solid var(--line)}
.wic-catalog .we-metrics{gap:1.5rem;grid-template-columns:repeat(2,minmax(0,1fr))}
.wic-catalog .we-metrics strong{font:400 clamp(2rem,4vw,3.5rem)/1.2 var(--wi-tech)}
.wic-catalog .we-metrics span,.wic-catalog .we-note{font-size:.875rem;color:var(--muted);line-height:1.8}
.wic-resource-links{display:grid;gap:2rem;margin-top:3rem}
.wic-resource-links p{color:var(--muted);line-height:1.8}
.wic-resource-links a{display:inline-flex;align-items:center;min-height:2.75rem;color:var(--red);font-size:.9375rem}
.wd-style-industrial:has(.wic-catalog) .wd-header{container-type:inline-size}
.wd-style-industrial:has(.wic-catalog) .wd-nav{flex-wrap:wrap}
.wd-style-industrial:has(.wic-catalog) .wd-nav nav{min-width:0;max-width:100%;flex-wrap:wrap}
.wd-style-industrial:has(.wic-catalog) :is(.wd-contact-band h2,.wd-contact-band .wd-container>div,.wd-footer-top>div){min-width:0;max-width:100%;overflow-wrap:anywhere}
.wd-style-industrial:has(.wic-catalog) .wd-contact-band .wd-button{max-width:100%;white-space:normal}
@container (width < 64rem){.wd-style-industrial:has(.wic-catalog) .wd-nav{min-height:5rem;gap:.75rem}.wd-style-industrial:has(.wic-catalog) .wd-nav>.wd-brand{margin-right:auto;max-width:100%}.wd-style-industrial:has(.wic-catalog) .wd-menu{display:flex}.wd-style-industrial:has(.wic-catalog) .wd-nav>nav{display:none;order:5;flex-direction:column;align-items:stretch;width:100%;margin:0;padding:1rem;max-height:calc(100svh - 6rem);overflow-y:auto}.wd-style-industrial:has(.wic-catalog) .wd-nav>nav.wd-open{display:flex;max-height:calc(100svh - 6rem)}.wd-style-industrial:has(.wic-catalog) .wx-mega-panel{position:static;display:block;padding:1rem;box-shadow:none}.wd-style-industrial:has(.wic-catalog) .wx-mega-links{grid-template-columns:1fr}}
@media(max-width:639px){.wd-style-industrial:has(.wic-catalog) .wx-utility nav{flex-wrap:wrap}.wd-style-industrial:has(.wic-catalog) .wx-footer .wd-footer-top{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:640px){.wic-category-grid,.wic-catalog .we-filter-list{grid-template-columns:repeat(2,minmax(0,1fr))}.wic-catalog .we-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.wic-catalog .we-filter-reset{align-self:end}.wic-portfolio-stage img{height:15rem}}
@media(min-width:768px){.wic-intro{padding-bottom:3.5rem}.wic-overview{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:2.5rem;align-items:center}.wic-overview h1{font-size:clamp(2.75rem,4.5vw,5rem)}.wic-portfolio-stage{padding:1.5rem}.wic-portfolio-stage img{height:16rem}.wic-category-image{height:23rem;padding:2rem}.wic-category-copy{padding:2rem}.wic-content{padding-top:3rem}.wic-resource-links{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:1024px){.wic-catalog .we-filters{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) auto;align-items:end;padding:1.5rem}.wic-portfolio-stage img{height:21rem}.wic-catalog .we-metrics{grid-template-columns:repeat(4,minmax(0,1fr))}.wic-card-image{height:20rem}}
@media(min-width:1280px){.wic-hub-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.wic-catalog .we-filter-list{grid-template-columns:repeat(3,minmax(0,1fr))}}
`;
