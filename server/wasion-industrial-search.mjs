// Presentation only: keep the shared search DOM hooks and client intact.
export function decorateIndustrialSearch(html, { pages, helpers: h, base }) {
  const heading = html.match(/<div class="ws-heading">[\s\S]*?<\/div>/)?.[0];
  const breadcrumb = html.match(/<nav class="ws-breadcrumb"[\s\S]*?<\/nav>/)?.[0];
  if (!heading || !breadcrumb) return html;
  const product = pages.find(page => page.slug === 'ameter300-three-phase-smart-energy-meter');
  const stage = product ? `<a class="wis-product-stage" href="${base}/${product.slug}"><span class="wi-label">ENGINEERED IN DETAIL</span><div class="wis-product-image">${h.img(h.image(product), h.title(product))}</div><div class="wis-product-caption"><div><strong>${h.escape(h.title(product))}</strong><span>${h.escape(product.summary || 'Wasion product')}</span></div><span class="wis-product-arrow" aria-hidden="true">↗</span></div></a>` : '';
  return html
    .replace(heading, '')
    .replace(breadcrumb, '')
    .replace('placeholder="Ask about a product, specification or solution…"', 'placeholder="Model or question…"')
    .replace('<section class="ws-banner" aria-labelledby="ws-search-label"><div class="ws-container"><span class="ws-eyebrow">WASION INTELLIGENT SEARCH</span>', `<div class="ws-container">${breadcrumb}</div><section class="ws-banner" aria-labelledby="ws-query-title"><div class="ws-container wis-hero-grid"><div class="wis-intro"><span class="ws-eyebrow">WASION INTERNATIONAL · PRODUCT INFORMATION</span>${heading}`)
    .replace('</p></div></section><div class="ws-container ws-shell">', `</p></div>${stage}</div></section><div class="ws-container ws-shell">`);
}

export const INDUSTRIAL_SEARCH_CSS = `
.wd-style-industrial #ws-search{--ws-navy:#322d2a;--ws-blue:#001489;--ws-mint:#e2e1dc;--ws-paper:#f0efe9;--ws-line:#d4d2cc;--wis-control:#827e76;color:var(--ink);padding-top:.5rem}
.wd-style-industrial .ws-container{width:calc(100% - 2.5rem);max-width:86rem}
.wd-style-industrial .ws-breadcrumb{padding:.75rem 0 1.5rem;font-size:.875rem;color:var(--muted);flex-wrap:wrap;gap:.75rem}
.wd-style-industrial .ws-breadcrumb a{min-height:2.75rem;display:inline-flex;align-items:center}
.wd-style-industrial .ws-banner{background:transparent;color:var(--ink);padding:0 0 1.75rem}
.wd-style-industrial .wis-hero-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:2rem}
.wd-style-industrial .wis-intro{min-width:0}
.wd-style-industrial .ws-eyebrow{font:400 .875rem/1.5 var(--wi-tech);letter-spacing:.025em;color:var(--muted);margin:0 0 1rem}
.wd-style-industrial .ws-heading{padding:0}
.wd-style-industrial .ws-heading h1{font:300 clamp(2.4rem,4.6vw,4.5rem)/1.04 var(--wi-display);letter-spacing:-.045em;max-width:16ch;margin:0 0 1.25rem;overflow-wrap:anywhere}
.wd-style-industrial .ws-heading p{font-size:1rem;line-height:1.65;color:var(--muted);max-width:35rem;margin:0 0 1.75rem}
.wd-style-industrial .ws-search-form>label{font-size:.875rem;line-height:1.5;font-weight:400;margin:0 0 .5rem}
.wd-style-industrial .ws-search-form>label>span{display:none}
.wd-style-industrial .ws-search-controls{display:flex;flex-wrap:wrap;gap:.375rem;border:1px solid var(--wis-control);border-radius:1.25rem;padding:.375rem;background:#fff}
.wd-style-industrial .ws-search-controls:focus-within{outline:2px solid var(--red);outline-offset:4px}
.wd-style-industrial .ws-search-controls input{flex:1 1 11rem;min-height:3.25rem;padding:.75rem .65rem;font:400 1rem/1.5 var(--wi-display);color:var(--ink);border-radius:.75rem}
.wd-style-industrial .ws-search-controls button{flex:0 1 auto;max-width:100%;min-height:3.25rem;border:1px solid var(--wi-dark);border-radius:.875rem;background:var(--wi-dark);color:#fff;padding:.75rem 1rem;font:400 .9375rem/1.5 var(--wi-display);white-space:normal}
.wd-style-industrial .ws-search-controls button:hover{background:var(--red);border-color:var(--red)}
.wd-style-industrial .ws-search-controls button:disabled{opacity:.65}
.wd-style-industrial .ws-banner #ws-search-privacy{font-size:.875rem;line-height:1.6;color:var(--muted);margin:1rem 0 0;max-width:42rem}
.wd-style-industrial .ws-banner #ws-search-privacy a{color:var(--ink);text-decoration:underline;text-underline-offset:.2em}
.wd-style-industrial .wis-product-stage{display:none;flex-direction:column;min-width:0;background:#fff;border:1px solid var(--line);border-radius:2rem;padding:1.5rem;color:var(--ink)}
.wd-style-industrial .wis-product-stage .wi-label{color:var(--muted)}
.wd-style-industrial .wis-product-image{height:17rem;display:flex;align-items:center;justify-content:center;padding:1rem}
.wd-style-industrial .wis-product-image img{width:100%;height:100%;object-fit:contain}
.wd-style-industrial .wis-product-caption{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding-top:1rem;border-top:1px solid var(--line)}
.wd-style-industrial .wis-product-caption strong{display:block;font:400 1.75rem/1.2 var(--wi-tech);letter-spacing:-.05em;overflow-wrap:anywhere}
.wd-style-industrial .wis-product-caption div>span{display:block;color:var(--muted);font-size:.875rem;margin-top:.4rem}
.wd-style-industrial .wis-product-arrow{border:1px solid var(--wis-control);border-radius:50%;width:2.75rem;height:2.75rem;flex:none;display:grid;place-items:center;font-size:1.25rem}
.wd-style-industrial .wis-product-stage:hover .wis-product-arrow{background:var(--wi-dark);color:#fff;border-color:var(--wi-dark)}
.wd-style-industrial #ws-search:has(#ws-examples[hidden]) .wis-product-stage{display:none}
.wd-style-industrial #ws-search:has(#ws-examples[hidden]) .wis-hero-grid{grid-template-columns:minmax(0,1fr)}
.wd-style-industrial #ws-search:has(#ws-examples[hidden]) .ws-heading h1{max-width:65rem;font-size:clamp(1.6rem,2.2vw,2rem);margin-bottom:.5rem}
.wd-style-industrial #ws-search:has(#ws-examples[hidden]) .wis-intro>.ws-eyebrow{display:none}
.wd-style-industrial #ws-search:has(#ws-examples[hidden]) .ws-heading p{font-size:.875rem;margin-bottom:1rem}
.wd-style-industrial #ws-search:has(#ws-examples[hidden]) .ws-banner{padding-bottom:1.5rem}
.wd-style-industrial #ws-search:has(#ws-examples:not([hidden])) .ws-tabs{display:none}
.wd-style-industrial .ws-examples{display:grid;grid-template-columns:minmax(0,1fr);min-width:0;gap:0;padding:0 0 2.5rem;border-bottom:1px solid var(--line);margin:0 0 2rem}
.wd-style-industrial .ws-examples>span{padding:.5rem 0 1rem;font:400 .875rem/1.5 var(--wi-tech);color:var(--muted)}
.wd-style-industrial .ws-examples>a{border:0;border-top:1px solid var(--line);padding:1rem 0;font-size:1rem;line-height:1.5;min-height:3rem;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:1.25rem;overflow-wrap:anywhere}
.wd-style-industrial .ws-examples>a>span{flex:none}
.wd-style-industrial .ws-examples>a:hover{color:var(--red);background:transparent}
.wd-style-industrial .ws-tabs{display:flex;flex-wrap:wrap;gap:.5rem;border:0;margin:0 0 1.5rem;overflow:visible}
.wd-style-industrial .ws-tabs button{flex:1 1 auto;min-height:2.75rem;padding:.65rem .8rem;border:1px solid var(--wis-control);border-radius:.875rem;background:transparent;color:var(--ink);font-size:.875rem;line-height:1.4;font-weight:400}
.wd-style-industrial .ws-tabs button[aria-selected=true]{background:var(--wi-dark);color:#fff;border-color:var(--wi-dark);font-weight:400}
.wd-style-industrial .ws-tab-count{font:400 .75rem/1.3 var(--wi-tech);opacity:1;margin-left:.5rem}
.wd-style-industrial .ws-ai{padding:1.5rem;background:#fff;border:1px solid var(--line);border-radius:1.5rem;margin:0 0 3rem;box-shadow:none}
.wd-style-industrial .ws-ai-heading{justify-content:space-between;align-items:center;gap:1rem;padding-bottom:1.25rem;border-bottom:1px solid var(--line);margin:0 0 1.5rem}
.wd-style-industrial .ws-ai .ws-ai-heading h2{font-size:1.5rem;font-weight:300;letter-spacing:-.025em;line-height:1.3}
.wd-style-industrial .ws-ai-heading h2>span{color:var(--red)}
.wd-style-industrial .ws-state{color:var(--muted);background:var(--paper);font:400 .75rem/1.5 var(--wi-tech);padding:.5rem .75rem;border:1px solid var(--line);border-radius:.75rem;overflow-wrap:anywhere}
.wd-style-industrial .ws-answer{font-size:1rem;line-height:1.8;max-width:65rem;color:var(--ink)}
.wd-style-industrial .ws-answer p{margin:0 0 1.1rem}
.wd-style-industrial .ws-answer-more,.wd-style-industrial .ws-more{border:1px solid var(--wis-control);border-radius:.875rem;background:transparent;color:var(--ink);padding:.75rem 1.25rem;min-height:2.75rem;font-size:.9375rem;font-weight:400}
.wd-style-industrial .ws-answer-more:hover,.wd-style-industrial .ws-more:hover{background:var(--wi-dark);color:#fff}
.wd-style-industrial .ws-ai-disclosure{font-size:.875rem;line-height:1.65;color:var(--muted);margin-top:1.5rem}
.wd-style-industrial .ws-ai-disclosure a{color:var(--ink)}
.wd-style-industrial .ws-sources{gap:.65rem;margin-top:1.25rem}
.wd-style-industrial .ws-source-chip{min-height:2.75rem;max-width:100%;border:1px solid var(--wis-control);border-radius:.75rem;background:var(--paper);color:var(--ink);font-size:.875rem;line-height:1.5;padding:.65rem .875rem;overflow-wrap:anywhere}
.wd-style-industrial .ws-source-chip:hover{color:var(--red);border-color:var(--red)}
.wd-style-industrial .ws-cite-button{min-width:2.75rem;min-height:2.75rem;padding:.25rem .4rem;margin:0 .2rem;border:1px solid var(--wis-control);border-radius:.625rem;background:#eef0f9;color:var(--red);font:400 .875rem/1.4 var(--wi-tech)}
.wd-style-industrial .ws-cite-button:hover{background:var(--red);border-color:var(--red);color:#fff}
.wd-style-industrial .ws-section-heading{align-items:center;margin-bottom:1.5rem}
.wd-style-industrial .ws-section-heading h2{font-size:clamp(1.75rem,3vw,2.5rem);font-weight:300;line-height:1.15}
.wd-style-industrial .ws-section-heading>a{color:var(--ink);font-size:.9375rem;font-weight:400;min-height:2.75rem;display:inline-flex;align-items:center}
.wd-style-industrial .ws-product-grid{gap:1.25rem}
.wd-style-industrial .ws-product{border:1px solid var(--line);border-radius:1.5rem;background:#fff;overflow:hidden;box-shadow:none}
.wd-style-industrial .ws-product-image{background:#fff;height:16rem;border-bottom:1px solid var(--line)}
.wd-style-industrial .ws-product-image img{object-fit:contain;padding:1.5rem}
.wd-style-industrial .ws-result-body{padding:1.5rem}
.wd-style-industrial .ws-result-body>.ws-eyebrow{font-size:.75rem;color:var(--muted)}
.wd-style-industrial .ws-result-body h3{font-size:1.75rem;font-weight:300;line-height:1.2;letter-spacing:-.03em}
.wd-style-industrial .ws-result-body p{font-size:1rem;line-height:1.7;color:var(--muted)}
.wd-style-industrial .ws-result-links{font-size:.875rem;font-weight:400;gap:.5rem 1.25rem}
.wd-style-industrial .ws-result-links>a,.wd-style-industrial .ws-result-links>a.ws-official{min-height:2.75rem;color:var(--ink)}
.wd-style-industrial .ws-result-links>a:hover{color:var(--red)}
.wd-style-industrial .ws-page-list{border-top:1px solid var(--line)}
.wd-style-industrial .ws-page{border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent;padding:1.25rem 0;box-shadow:none}
.wd-style-industrial .ws-page .ws-result-body{padding:0}
.wd-style-industrial .ws-source-path{color:var(--muted);font-size:.75rem;line-height:1.6}
.wd-style-industrial .ws-empty{background:#e8e7e1;border:1px solid var(--line);border-radius:1.5rem;padding:1.5rem}
.wd-style-industrial .ws-empty h2{font-size:1.75rem;line-height:1.2}
.wd-style-industrial .ws-empty p{font-size:1rem;line-height:1.7;color:var(--muted)}
.wd-style-industrial .ws-empty a{font-size:.9375rem;font-weight:400;color:var(--ink)}
.wd-style-industrial .ws-contact{padding:2rem;background:var(--wi-dark);border-radius:1.5rem;gap:1.5rem}
.wd-style-industrial .ws-contact .ws-eyebrow,.wd-style-industrial .ws-contact p{color:#e2e1dc}
.wd-style-industrial .ws-contact h2{font-size:2rem;font-weight:300;line-height:1.1}
.wd-style-industrial .ws-contact p{font-size:1rem;line-height:1.7}
.wd-style-industrial .ws-contact>a{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.75rem;max-width:100%;padding:.75rem 1rem;background:#fff;color:var(--ink);border:1px solid #fff;border-radius:1rem;min-height:3rem;font-size:.9375rem;font-weight:400;white-space:normal;overflow-wrap:anywhere}
.wd-style-industrial .ws-contact>a:hover{background:var(--paper)}
.wd-style-industrial #ws-search :focus-visible{outline:2px solid var(--red);outline-offset:4px}
.wd-style-industrial .ws-contact :focus-visible{outline-color:#fff}
.wd-style-industrial .ws-cite-panel{color:var(--ink);background:#fff;border:1px solid #827e76;border-radius:1.5rem;padding:1.5rem;box-shadow:0 12px 32px #2424261f;font:400 1rem/1.6 var(--wi-display)}
.wd-style-industrial .ws-cite-panel h3{font-size:1.4rem;font-weight:300;line-height:1.3;letter-spacing:-.025em;margin-right:2.25rem;overflow-wrap:anywhere}
.wd-style-industrial .ws-cite-panel a{color:var(--red);min-height:2.75rem;display:flex;align-items:center;font-size:.9375rem;padding:.75rem 0}
.wd-style-industrial .ws-cite-panel .ws-cite-close{border-radius:.75rem;color:var(--ink);top:.65rem;right:.65rem}
.wd-style-industrial .ws-cite-panel :focus-visible{outline:2px solid var(--red);outline-offset:3px}
.wd-style-industrial:has(#wd-protected[hidden]) .ws-cite-panel{display:none!important}
.wd-style-industrial:has(#ws-search) .wd-contact-band h2,.wd-style-industrial .ws-contact h2{overflow-wrap:anywhere}
.wd-style-industrial:has(#ws-search) .wd-contact-band .wd-container>div,.wd-style-industrial:has(#ws-search) .wd-footer-top>div{min-width:0;max-width:100%;overflow-wrap:anywhere}
.wd-style-industrial:has(#ws-search) .wd-contact-band .wd-button{max-width:100%;white-space:normal}
@media(max-width:639px){.wd-style-industrial .ws-search-controls button{flex-grow:1}.wd-style-industrial .ws-contact{padding:1rem}.wd-style-industrial:has(#ws-search) .wd-nav{flex-wrap:wrap}.wd-style-industrial:has(#ws-search) .wd-brand{max-width:100%}.wd-style-industrial:has(#ws-search) .wx-utility nav{flex-wrap:wrap}.wd-style-industrial:has(#ws-search) .wx-footer .wd-footer-top{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:640px){.wd-style-industrial .ws-examples{grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5rem}.wd-style-industrial .ws-examples>span{grid-column:1/-1;padding-bottom:0}.wd-style-industrial .ws-examples>a{align-items:flex-start}.wd-style-industrial .wis-product-image{height:20rem}}
@media(min-width:768px){.wd-style-industrial .ws-container{width:calc(100% - 4rem)}.wd-style-industrial .ws-banner{padding-bottom:3rem}.wd-style-industrial .ws-ai{padding:2.5rem}.wd-style-industrial .ws-answer{font-size:1.125rem}.wd-style-industrial .ws-product-image{height:20rem}.wd-style-industrial .ws-contact{padding:2.5rem}}
@media(min-width:1024px){.wd-style-industrial .wis-hero-grid{grid-template-columns:minmax(0,1.3fr) minmax(0,.9fr);align-items:center;gap:4rem;padding-block:1rem 1.5rem}.wd-style-industrial .wis-product-stage{display:flex;padding:2rem;align-self:stretch}.wd-style-industrial .wis-product-image{height:20rem;flex:0 0 20rem;min-height:0}.wd-style-industrial #ws-search:has(#ws-examples[hidden]) .wis-intro{max-width:65rem}.wd-style-industrial #ws-search:has(#ws-examples[hidden]) .wis-hero-grid{padding-block:0}.wd-style-industrial .ws-tabs{gap:.75rem}.wd-style-industrial .ws-tabs button{flex:none;padding-inline:1.25rem}}
`;
