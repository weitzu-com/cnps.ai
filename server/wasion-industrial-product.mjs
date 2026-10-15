// Presentation only. Product records, source cells and search/session clients stay shared.
export function renderIndustrialProduct(page, { pages, helpers: h, base, generatedAt }) {
  const { escape: e, title, image, summary, img, external, card } = h;
  const name = title(page);
  const family = new URL(page.url).pathname.split('/')[1];
  const candidates = pages.filter(p => p.slug !== page.slug && p.category === 'Products' && p.pageType === 'detail');
  const sameFamily = candidates.filter(p => new URL(p.url).pathname.split('/')[1] === family);
  const related = (sameFamily.length ? sameFamily : candidates).slice(0, 3);
  const tableText = new Set((page.tables || []).flat(2));
  const paragraphs = [...new Set(page.paragraphs || [])].filter(p => !tableText.has(p) && !(page.features || []).includes(p));
  const aiHref = `${base}/search?q=${encodeURIComponent(`Tell me about ${name}`)}`;
  const arrow = '<span aria-hidden="true">↗</span>';
  return `<div class="wip-product">
  <nav class="wd-container wd-breadcrumb" aria-label="Breadcrumb"><a href="${base}">Home</a><span aria-hidden="true">/</span><a href="${base}/products">Products</a><span aria-hidden="true">/</span><span>${e(name)}</span></nav>
  <section class="wip-hero wd-container" aria-labelledby="wip-title">
    <figure class="wip-stage"><div class="wip-stage-label"><span>WASION INTERNATIONAL</span><span>PRODUCT PORTFOLIO</span></div><div class="wip-image">${img(image(page), name, '', false)}</div><figcaption><span>${e(name)}</span><span>Official product image</span></figcaption></figure>
    <div class="wip-intro"><span class="wip-label">WASION / PRODUCTS</span><h1 id="wip-title">${e(name)}</h1><p class="wip-description">${e(summary(page))}</p><div class="wip-actions"><a class="wd-button" href="#specifications">Explore technical information ${arrow}</a><a class="wip-enquire" href="${base}/contact">Discuss this product ${arrow}</a></div><div class="wip-provenance">${external(page.url, 'View official source')}<a href="${e(aiHref)}">Ask Wasion AI ${arrow}</a></div></div>
  </section>
  <nav class="wip-section-nav wd-container" aria-label="Page sections"><a href="#overview">Overview</a>${page.features?.length ? '<a href="#features">Key features</a>' : ''}${page.tables?.length ? '<a href="#specifications">Technical information</a>' : ''}<a href="#documents">Documents &amp; sources</a></nav>
  <div class="wd-container wip-content">
    <section id="overview" class="wip-overview"><div><span class="wip-label">OVERVIEW</span><h2>Product information</h2></div><div class="wip-copy">${(paragraphs.length ? paragraphs : [summary(page)]).map(p => `<p>${e(p)}</p>`).join('')}</div></section>
    ${page.features?.length ? `<section id="features" class="wip-features"><div class="wip-heading"><span class="wip-label">PRODUCT CAPABILITIES</span><h2>Key features.</h2></div><ul class="wd-feature-list">${page.features.map(f => `<li>${e(f)}</li>`).join('')}</ul></section>` : ''}
    ${page.tables?.length ? `<section id="specifications" class="wip-specifications"><div class="wip-heading"><span class="wip-label">TECHNICAL INFORMATION</span><h2>The details<br>behind the product.</h2><p>Published specifications and functionality from Wasion International.</p><a href="${e(aiHref)}">Questions about this product? Ask Wasion AI ${arrow}</a></div><div class="wip-spec-body"><p class="wd-table-hint" id="wip-table-help">Swipe the table to see all columns, or focus it and use the arrow keys.</p><div class="wd-tables" tabindex="0" role="region" aria-label="Scrollable official technical information" aria-describedby="wip-table-help">${page.tables.map(rows => `<table><caption>${e(name)} — official technical information</caption><tbody>${rows.map(row => row.length === 1 ? `<tr><td colspan="${Math.max(...rows.map(r => r.length))}">${e(row[0])}</td></tr>` : `<tr>${row.map((cell, i) => `<${i === 0 ? 'th scope="row"' : 'td'}>${e(cell)}</${i === 0 ? 'th' : 'td'}>`).join('')}</tr>`).join('')}</tbody></table>`).join('')}</div></div></section>` : ''}
    <section id="documents" class="wip-documents"><div><span class="wip-label">DOCUMENTS &amp; SOURCES</span><h2>Go to the source.</h2></div><div><div class="wd-source-box"><span class="wip-label">OFFICIAL SOURCE / EN.WASION.COM</span>${external(page.url, name)}<p>Content reproduced from Wasion International, ${e(generatedAt?.slice(0, 10) || '2026-10-14')}. Confirm specifications, availability and project suitability with Wasion.</p></div>${page.downloads?.length ? `<div class="wd-downloads">${page.downloads.map(d => external(d.url, d.title || 'Open document')).join('')}</div>` : `<p class="wip-download-note">${e(page.downloadNotice || 'No downloadable document was provided on this source page. Contact Wasion for current documentation.')}</p>`}<a class="wip-enquire" href="${base}/contact">Discuss specifications with Wasion ${arrow}</a></div></section>
    ${related.length ? `<section class="wip-related" aria-labelledby="wip-related-title"><div class="wip-heading"><span class="wip-label">PRODUCT PORTFOLIO</span><h2 id="wip-related-title">Explore more.</h2><a href="${base}/products">View all products ${arrow}</a></div><div class="wd-grid wd-grid-three">${related.map(p => card(p)).join('')}</div></section>` : ''}
  </div></div>`;
}

export const INDUSTRIAL_PRODUCT_CSS = `
.wip-product{--wip-control:#827e76;overflow-wrap:anywhere}
.wip-product :is(h1,h2,h3,p,figure){margin-top:0}
.wip-product :is(section,div,figure){min-width:0}
.wip-product :is(a,button):focus-visible,.wip-product .wd-tables:focus-visible{outline:3px solid var(--red);outline-offset:4px}
.wip-product .wip-label{display:block;font:400 .75rem/1.6 var(--wi-tech);letter-spacing:.08em;color:var(--muted);margin-bottom:1.25rem}
.wip-product .wd-breadcrumb{flex-wrap:wrap;gap:.5rem;font-size:.8125rem;padding-block:1rem 1.5rem}
.wip-hero{display:grid;gap:2rem;padding-block:.25rem 2.5rem}
.wip-stage{margin:0;border-radius:var(--wi-radius);background:#fff;overflow:hidden;display:flex;flex-direction:column}
.wip-stage-label,.wip-stage figcaption{display:flex;justify-content:space-between;flex-wrap:wrap;gap:.5rem 1rem;padding:1.25rem 1.5rem;font:400 .75rem/1.6 var(--wi-tech);letter-spacing:.06em;color:var(--muted)}
.wip-stage-label{border-bottom:1px solid var(--line)}
.wip-stage figcaption{border-top:1px solid var(--line);font-size:.75rem;letter-spacing:0}
.wip-stage figcaption>span:first-child{color:var(--ink)}
.wip-image{display:flex;align-items:center;justify-content:center;min-height:0;height:19rem;padding:1.25rem;flex:1 1 auto}
.wip-image img{width:100%;height:100%;max-height:25rem;object-fit:contain}
.wip-intro{align-self:center;padding-block:.5rem}
.wip-product .wip-intro h1{font:400 clamp(2rem,4.4vw,4.75rem)/1.08 var(--wi-tech);letter-spacing:-.065em;margin-bottom:1.5rem}
.wip-description{font-size:1.0625rem;line-height:1.7;color:var(--muted);max-width:36rem;margin-bottom:2rem}
.wip-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem 1.5rem}
.wip-product .wd-button{display:flex;justify-content:space-between;gap:1.5rem;max-width:100%;white-space:normal;min-height:3.25rem;font-size:.9375rem;padding:.875rem 1.25rem;border-radius:1rem}
.wip-product .wip-enquire,.wip-provenance>a,.wip-heading>a{display:inline-flex;align-items:center;gap:.75rem;min-height:2.75rem;font-size:.9375rem;line-height:1.6;max-width:100%}
.wip-product .wip-enquire{border-bottom:1px solid var(--wip-control)}
.wip-provenance{display:flex;flex-wrap:wrap;gap:.25rem 1.5rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--line)}
.wip-provenance>a{font-size:.8125rem;color:var(--muted)}
.wip-provenance>a:hover,.wip-product .wip-enquire:hover,.wip-heading>a:hover{color:var(--red)}
.wip-section-nav{display:flex;flex-wrap:wrap;gap:.25rem 1.5rem;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding-block:.625rem}
.wip-section-nav>a{display:flex;align-items:center;min-height:2.75rem;font-size:.875rem}
.wip-section-nav>a:hover{color:var(--red);text-decoration:underline;text-underline-offset:.4rem}
.wip-product section[id]{scroll-margin-top:8rem}
.wip-product h2{font:300 clamp(1.875rem,3.1vw,3rem)/1.1 var(--wi-display);letter-spacing:-.04em;margin-bottom:1.5rem}
.wip-overview,.wip-documents{display:grid;gap:.5rem;padding-block:3rem;border-bottom:1px solid var(--line)}
.wip-copy p{font-size:1.0625rem;line-height:1.8;color:var(--muted);max-width:53rem;margin-bottom:1rem}
.wip-copy p:last-child{margin-bottom:0}
.wip-features{padding-block:3rem}
.wip-product .wd-feature-list{list-style:none;margin:2rem 0 0;padding:0;display:grid;gap:0 2rem;border-top:1px solid var(--line)}
.wip-product .wd-feature-list li{position:relative;padding:1.25rem 0 1.25rem 1.75rem;margin:0;border-bottom:1px solid var(--line);color:var(--ink);font-size:1rem;line-height:1.7}
.wip-product .wd-feature-list li:before{content:'+';position:absolute;left:0;top:1.25rem;color:var(--red);font-family:var(--wi-tech)}
.wip-specifications{display:grid;gap:1.5rem;padding:1.5rem;border:1px solid var(--line);border-radius:var(--wi-radius);background:#e8e7e1;margin-bottom:1rem}
.wip-specifications .wip-heading p{color:var(--muted);font-size:1rem;line-height:1.7;max-width:25rem}
.wip-specifications .wip-heading>a{font-size:.8125rem;color:var(--red)}
.wip-product .wd-table-hint{margin:0 0 1rem;font-size:.8125rem;line-height:1.7;color:var(--muted)}
.wip-product .wd-tables{border:1px solid var(--wip-control);border-radius:1rem;background:#fff;max-width:100%;overflow-x:auto;overscroll-behavior-x:contain}
.wip-product .wd-tables table{width:100%;border-collapse:collapse;font-size:1rem;margin:0}
.wip-product .wd-tables caption{padding:1.25rem;text-align:left;font:400 .8125rem/1.6 var(--wi-tech);color:var(--muted);border-bottom:1px solid var(--line)}
.wip-product .wd-tables :is(td,th){padding:1rem 1.25rem;min-width:10rem;border:0;border-bottom:1px solid var(--line);font-size:.9375rem;line-height:1.7;text-align:left;vertical-align:top;overflow-wrap:normal}
.wip-product .wd-tables th{font-weight:500;width:31%;background:#f0efe9;color:var(--ink)}
.wip-product .wd-tables td{color:var(--muted)}
.wip-product .wd-tables tr:last-child>*{border-bottom:0}
.wip-product .wd-tables tr:has(th)>*{border-top:1px solid var(--wip-control)}
.wip-product .wd-source-box{padding:1.5rem;border:1px solid var(--wip-control);border-radius:1.5rem;background:transparent;max-width:100%}
.wip-product .wd-source-box>a{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:2.75rem;font-size:1.25rem;line-height:1.5;color:var(--red)}
.wip-product .wd-source-box p,.wip-download-note{font-size:.875rem;line-height:1.8;color:var(--muted);margin:1rem 0 0}
.wip-download-note{margin-bottom:1rem}
.wip-related{padding-block:3rem}
.wip-related .wip-heading{margin-bottom:2rem}
.wip-related .wd-card{background:#fff;border-radius:1.5rem;border:1px solid var(--line);overflow:hidden}
.wip-related .wd-card-image{height:15rem;background:#fff}
.wip-related .wd-card-image img{object-fit:contain;padding:1.5rem}
.wip-related .wd-card-body{padding:1.5rem;border-top:1px solid var(--line)}
.wip-related .wd-card-body h3{font:400 1.5rem/1.25 var(--wi-tech);letter-spacing:-.04em}
.wd-style-industrial:has(.wip-product) .wd-header{container-type:inline-size}
.wd-style-industrial:has(.wip-product) .wd-nav{flex-wrap:wrap}
.wd-style-industrial:has(.wip-product) .wd-nav nav{min-width:0;max-width:100%;flex-wrap:wrap}
.wd-style-industrial:has(.wip-product) .wd-contact-band h2{overflow-wrap:anywhere}
.wd-style-industrial:has(.wip-product) :is(.wd-contact-band .wd-container>div,.wd-footer-top>div){min-width:0;max-width:100%;overflow-wrap:anywhere}
.wd-style-industrial:has(.wip-product) .wd-contact-band .wd-button{max-width:100%;white-space:normal}
@media(max-width:639px){.wd-style-industrial:has(.wip-product) .wd-header{container-type:inline-size}
.wd-style-industrial:has(.wip-product) .wd-nav{flex-wrap:wrap}.wd-style-industrial:has(.wip-product) .wd-brand{max-width:100%}.wd-style-industrial:has(.wip-product) .wx-utility nav{flex-wrap:wrap}.wd-style-industrial:has(.wip-product) .wx-footer .wd-footer-top{grid-template-columns:repeat(2,minmax(0,1fr))}.wip-specifications{padding:1.5rem 0;border-inline:0;border-radius:0;background:transparent}.wip-product .wd-tables :is(td,th){min-width:10rem;padding:.875rem}.wip-product .wd-button{width:100%}}
@container (width < 64rem){
.wd-style-industrial:has(.wip-product) .wd-nav{min-height:5rem;gap:.75rem}
.wd-style-industrial:has(.wip-product) .wd-nav>.wd-brand{margin-right:auto}
.wd-style-industrial:has(.wip-product) .wd-menu{display:flex}
.wd-style-industrial:has(.wip-product) .wd-nav>nav{display:none;order:5;flex-direction:column;align-items:stretch;width:100%;margin:0;padding:1rem;max-height:calc(100svh - 6rem);overflow-y:auto}
.wd-style-industrial:has(.wip-product) .wd-nav>nav.wd-open{display:flex;max-height:calc(100svh - 6rem)}
.wd-style-industrial:has(.wip-product) .wx-mega-panel{position:static;display:block;padding:1rem;box-shadow:none}
.wd-style-industrial:has(.wip-product) .wx-mega-links{grid-template-columns:1fr}
}
@media(min-width:640px){.wip-image{height:27rem}.wip-product .wd-feature-list{grid-template-columns:repeat(2,minmax(0,1fr))}.wip-related .wd-card-image{height:18rem}}
@media(min-width:768px){.wip-hero{grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:2.5rem;padding-bottom:3rem}.wip-image{height:30rem}.wip-stage-label,.wip-stage figcaption{padding:1.25rem 1.75rem}.wip-overview,.wip-documents{grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:3rem;padding-block:4rem}.wip-features,.wip-related{padding-block:4rem}.wip-specifications{padding:2rem}.wip-related .wip-heading{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:0 2rem}.wip-related .wip-heading>.wip-label{flex-basis:100%}}
@media(min-width:1024px){.wip-hero{gap:4rem;padding-block:.75rem 4rem}.wip-image{height:31rem;padding:2rem}.wip-image img{max-height:28rem}.wip-specifications{grid-template-columns:minmax(0,.8fr) minmax(0,2fr);gap:3rem;padding:2.5rem}.wip-specifications .wip-heading{align-self:start;position:sticky;top:8rem}.wip-product .wd-feature-list{column-gap:3rem}}
`;
