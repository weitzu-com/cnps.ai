import { getNewsItems, renderNewsFilters } from './wasion-experience/content.mjs';
import { DTECH, PAST_EVENTS } from './wasion-experience/content-data.mjs';

export const isIndustrialNewsPage = page => !!page && (['newsroom', 'events', 'dtech-2026'].includes(page.slug) || (page.category === 'Newsroom' && page.pageType === 'detail'));
const ARROW = '<span aria-hidden="true">↗</span>';

export function renderIndustrialNewsEvents(page, ctx, originalBody) {
  if (!isIndustrialNewsPage(page)) return originalBody;
  const { helpers: h, base } = ctx, e = h.escape;
  const records = getNewsItems(ctx), detail = !['newsroom', 'events'].includes(page.slug), event = page.slug === 'events';
  const record = records.find(p => p.slug === page.slug), featured = event ? records.find(p => p.slug === DTECH.slug) : records[0];
  const name = detail ? h.title(record) : event ? 'Events' : 'Newsroom';
  const href = slug => `${base}/${slug}`;
  const link = (slug, label, cls = '') => `<a class="${cls}" href="${href(slug)}">${e(label)} ${ARROW}</a>`;
  const date = value => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const excerpt = value => { const text = String(value || '').replace(/\s+/g, ' ').trim(); return text.length > 220 ? `${text.slice(0, 217).trimEnd()}…` : text; };
  const metadata = p => `<div class="win-meta"><span>Published <time datetime="${e(p.date)}">${e(date(p.date))}</time></span><span>${e(p.type)}</span><span>Region: ${e(p.region)}</span></div>`;
  const card = p => `<div class="win-card"><a class="win-card-image" href="${href(p.slug)}" aria-label="Read ${e(p.title)}">${h.img(p.image, p.title)}</a><div class="win-card-copy">${metadata(p)}<h3>${link(p.slug, p.title)}</h3><p>${e(excerpt(p.description))}</p><div class="win-card-actions">${link(p.slug, 'Read the report')}${h.external(p.url, 'Official source')}</div></div></div>`;
  const visual = p => `<figure class="win-visual">${h.img(p.image, p.title, '', false)}<figcaption><span>WASION INTERNATIONAL / ${e(p.type.toUpperCase())}</span>${h.external(p.url, 'Official Wasion report')}</figcaption></figure>`;
  const nav = `<nav class="win-nav wd-container" aria-label="News and events"><a href="${href('newsroom')}"${!event ? ' aria-current="page"' : ''}>Newsroom</a><a href="${href('events')}"${event ? ' aria-current="page"' : ''}>Events</a>${link('company', 'Company')}${link('resources', 'Resources')}</nav>`;
  const breadcrumb = `<nav class="wd-container wd-breadcrumb" aria-label="Breadcrumb"><a href="${base}">Home</a><span aria-hidden="true">/</span>${detail ? `<a href="${href('newsroom')}">Newsroom</a><span aria-hidden="true">/</span>` : ''}<span>${e(name)}</span></nav>`;
  const ai = link(`search?q=${encodeURIComponent(detail ? `Tell me about ${record.title}` : event ? 'What did Wasion present at DTECH 2026?' : 'Tell me about Wasion international cooperation')}`, 'Explore the context with Wasion AI', 'win-ai');
  let hero, body;
  if (detail) {
    hero = `<header class="win-article-hero wd-container"><span class="win-label">WASION / ${e(record.topic.toUpperCase())}</span>${metadata(record)}<h1 id="win-title">${e(record.title)}</h1><div class="win-article-actions"><a href="#overview">Read the report ${ARROW}</a>${h.external(record.url, 'View official source')}${ai}</div>${page.slug === DTECH.slug ? `<dl class="win-event-facts"><div><dt>Past event</dt><dd>${e(PAST_EVENTS[0].date)}</dd></div><div><dt>Venue</dt><dd>${e(PAST_EVENTS[0].location)}</dd></div></dl>` : ''}${visual(record)}</header>`;
    const originalArticle = originalBody.match(/<article class="wd-reading">[\s\S]*?<\/article>/)?.[0];
    if (originalArticle) {
      const images = page.images.slice(1);
      const gallery = images.length ? `<section class="win-gallery" aria-labelledby="win-gallery-title"><span class="win-label">FROM THE OFFICIAL REPORT</span><h2 id="win-gallery-title">In pictures.</h2><div>${images.map((url, i) => /\.gif(?:\?|$)/i.test(url) ? `<div class="win-animation-link">${h.external(url, 'Open official animated image (GIF)')}<p>Open the publisher’s animation when you choose.</p></div>` : `<figure>${h.img(url, `${record.title} — official photograph ${i + 2}`)}<figcaption>Official report photograph ${i + 2}</figcaption></figure>`).join('')}</div></section>` : '';
      body = `<div class="wd-container win-reading-layout"><div>${originalArticle}${gallery}</div><aside class="win-reading-aside"><span class="win-label">PUBLISHED BY WASION</span><h2>Go to the source.</h2><p>Read the complete official report and its original context.</p>${h.external(record.url, 'Official report')}${link('newsroom', 'Back to newsroom')}${link('events', 'Explore events')}</aside></div>`;
    } else {
      // DTECH's existing curated report, publication date, image and sources
      // remain intact. The event dates above are labelled separately.
      const start = originalBody.indexOf('<div class="wd-container we-content">');
      body = (start >= 0 ? originalBody.slice(start) : originalBody).replace('<div class="wd-container we-content">', '<div class="wd-container we-content win-event-report" id="overview">').replace(/<div class="we-story-visual">[\s\S]*?<\/div>/, '');
    }
    body += `<section class="wd-container win-related"><div class="win-section-heading"><div><span class="win-label">MORE FROM WASION</span><h2>Explore more perspectives.</h2></div>${link('newsroom', 'All news')}</div><div class="win-news-grid">${records.filter(p => p.slug !== page.slug).slice(0, 2).map(card).join('')}</div></section>`;
  } else {
    hero = `<section class="wd-container win-index-hero" aria-labelledby="win-title"><div class="win-intro"><span class="win-label">WASION / ${event ? 'GLOBAL EVENTS' : 'NEWS & PERSPECTIVES'}</span><h1 id="win-title">${event ? 'Where the industry<br>comes together.' : 'Wasion,<br>in the world.'}</h1><p>${event ? 'Explore published event reports, then contact the team for its current schedule and meeting opportunities.' : 'Company news, international cooperation and event reports. Explore the people, technologies and partnerships behind Wasion.'}</p><div class="win-actions"><a class="wd-button" href="${event ? '#win-past-events' : '#win-news'}">${event ? 'Explore past events' : 'Explore the news'} ${ARROW}</a>${h.external('https://en.wasion.com/news.html', 'Official Wasion newsroom')}</div>${ai}</div><article class="win-feature">${visual(featured)}<div class="win-feature-copy"><span class="win-label">${event ? 'PAST EVENT / DTECH 2026' : 'FEATURED REPORT'}</span>${metadata(featured)}<h2>${link(featured.slug, featured.title)}</h2>${event ? `<p>${e(PAST_EVENTS[0].date)}<br>${e(PAST_EVENTS[0].location)}</p>` : ''}${link(featured.slug, 'Read the report', 'win-feature-link')}</div></article></section>`;
    if (event) {
      const start = originalBody.indexOf('<div class="wd-container we-content">');
      body = originalBody.slice(start).replace('<div class="wd-container we-content">', '<div class="wd-container we-content win-events-content">').replace('<h2>Past events</h2>', '<h2 id="win-past-events">Past events</h2>');
      body = body.replace(h.external(DTECH.url, 'Read the official event report'), `${link(DTECH.slug, 'Read the event report')}${h.external(DTECH.url, 'Read the official event report')}`);
    } else {
      body = `<section class="wd-container win-news-list" id="win-news" aria-labelledby="win-news-title"><div class="win-section-heading"><div><span class="win-label">THE NEWSROOM</span><h2 id="win-news-title">Explore the stories.</h2></div><p>Filter the shared collection by topic, region, content type or publication year.</p></div>${renderNewsFilters(records, ctx, card).replace(/<select data-filter="(topic|region|type|year)"/g, (_, key) => `<select aria-label="${{ topic: 'Topic', region: 'Region', type: 'Content type', year: 'Year' }[key]}" data-filter="${key}"`)}<details class="we-sources"><summary>Information sources</summary>${h.external('https://en.wasion.com/news.html', 'Official Wasion information')}</details></section>`;
    }
  }
  return `<div class="win-page${detail ? ' win-detail' : ''}" data-win-page="${e(page.slug)}">${breadcrumb}${hero}${nav}${body}</div>`;
}

export const INDUSTRIAL_NEWS_EVENTS_CSS = `
.win-page{color:var(--ink);overflow-wrap:anywhere}
.win-page :is(div,section,article,aside,figure,form,label){min-width:0}
.win-page :is(a,button,input,select,summary):focus-visible{outline:3px solid var(--red);outline-offset:4px}
.win-page .wd-breadcrumb{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;padding-block:1rem 1.5rem;font-size:.8125rem}
.win-page .wd-breadcrumb a{min-height:2.75rem;display:inline-flex;align-items:center}
.win-label{display:block;font:400 .75rem/1.6 var(--wi-tech);letter-spacing:.08em;color:var(--muted);margin-bottom:1.25rem}
.win-index-hero{display:grid;gap:2rem;padding-block:.5rem 2.5rem}
.win-page .win-intro h1{font:300 clamp(2.75rem,5.8vw,6rem)/1.03 var(--wi-display);letter-spacing:-.055em;margin:0 0 1.5rem}
.win-intro>p{font-size:1.0625rem;color:var(--muted);line-height:1.75;max-width:34rem;margin-bottom:1.5rem}
.win-actions,.win-article-actions{display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;align-items:center}
.win-actions a,.win-article-actions a{display:inline-flex;align-items:center;min-height:2.75rem;gap:.75rem;font-size:.875rem;max-width:100%}
.win-page .win-actions .wd-button{border-radius:1rem;min-height:3.25rem;white-space:normal;flex-wrap:wrap;gap:.75rem;padding:.75rem 1rem;min-width:0;max-width:100%}
.win-page .win-ai{font-size:.8125rem;display:inline-flex;align-items:center;gap:.75rem;min-height:2.75rem;margin-top:1rem;color:var(--red);max-width:100%}
.win-feature{background:#fff;border-radius:var(--wi-radius);overflow:hidden;align-self:start}
.win-visual{margin:0;background:#fff;overflow:hidden}
.win-visual>img{width:100%;height:auto;max-height:32rem;object-fit:contain;background:#fff}
.win-visual figcaption{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.5rem 1rem;border-top:1px solid var(--line);padding:.75rem 1.25rem;font:400 .75rem/1.6 var(--wi-tech);color:var(--muted)}
.win-visual figcaption a{display:inline-flex;align-items:center;gap:.5rem;min-height:2.75rem}
.win-feature-copy{padding:1.5rem}
.win-page .win-feature h2{font:400 clamp(1.375rem,2.2vw,2rem)/1.3 var(--wi-display);letter-spacing:-.03em;margin-bottom:1rem}
.win-feature h2 a{display:inline-flex;gap:.75rem;min-height:2.75rem}
.win-feature p{color:var(--muted);font-size:1rem;line-height:1.75}
.win-feature-link{color:var(--red);display:inline-flex;align-items:center;gap:.75rem;min-height:2.75rem;font-size:.875rem}
.win-meta{display:flex;flex-wrap:wrap;gap:.5rem 1rem;font:400 .75rem/1.6 var(--wi-tech);color:var(--muted);margin-bottom:1rem}
.win-nav{display:flex;flex-wrap:wrap;gap:.5rem .75rem;padding-block:1rem;border-block:1px solid var(--line)}
.win-nav>a{display:inline-flex;align-items:center;gap:.75rem;border:1px solid #827e76;border-radius:1rem;min-height:2.75rem;padding:.5rem .875rem;font-size:.8125rem;line-height:1.5}
.win-nav>a[aria-current]{background:var(--ink);border-color:var(--ink);color:#fff}
.win-page h2{font:300 clamp(1.875rem,3.2vw,3.125rem)/1.12 var(--wi-display);letter-spacing:-.04em;color:var(--ink)}
.win-page h3{font-weight:400;line-height:1.3;letter-spacing:-.025em;color:var(--ink)}
.win-section-heading{display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem}
.win-section-heading h2{margin:0}
.win-section-heading p{max-width:30rem;font-size:1rem;color:var(--muted);line-height:1.75;margin:0}
.win-section-heading>a{min-height:2.75rem;display:inline-flex;align-items:center;gap:.75rem;font-size:.875rem}
.win-news-list,.win-related{padding-block:2.5rem 4rem}
.win-page :is(#overview,#win-news,#win-past-events,#documents){scroll-margin-top:8rem}
.win-news-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:1.5rem}
.win-card{display:flex;flex-direction:column;height:100%;background:#fff;border-radius:var(--wi-radius);overflow:hidden}
.win-card-image{display:flex;align-items:center;justify-content:center;min-height:12rem;background:#e6e5de}
.win-card-image img{width:100%;height:15rem;object-fit:contain}
.win-card-copy{padding:1.5rem;display:flex;flex-direction:column;flex:1;align-items:flex-start}
.win-card h3{font-size:1.375rem;margin-bottom:1rem}
.win-card h3 a{display:inline-flex;align-items:center;gap:.75rem;min-height:2.75rem}
.win-card p{font-size:1rem;line-height:1.75;color:var(--muted);margin-bottom:1.25rem}
.win-card-actions{display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;margin-top:auto}
.win-card-actions a{display:inline-flex;align-items:center;gap:.5rem;min-height:2.75rem;font-size:.875rem;color:var(--red)}
.win-page .we-filters{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem;border:1px solid var(--line);border-radius:var(--wi-radius);background:#fff;padding:1.25rem;margin:0 0 1.5rem}
.win-page .we-filters label{display:flex;flex-direction:column;gap:.5rem;color:var(--ink);font-size:.8125rem}
.win-page .we-filters :is(input,select){width:100%;min-width:0;max-width:100%;min-height:3.25rem;font:400 1rem/1.5 var(--wi-display);padding:.75rem;border:1px solid #827e76;border-radius:.75rem;background:#fff;color:var(--ink)}
.win-page .we-filter-reset,.win-page .we-filter-more{min-height:3.25rem;padding:.75rem 1rem;align-self:end;border:1px solid #827e76;border-radius:.75rem;background:var(--paper);color:var(--ink);font:400 .875rem/1.6 var(--wi-display);white-space:normal}
.win-page .we-filter-more{width:100%;margin-top:1.5rem}
.win-page .we-filter-count{font:400 .8125rem/1.6 var(--wi-tech);color:var(--muted);border-top:1px solid var(--line);padding-block:1rem;margin:0}
.win-page .we-filter-item{padding:0;border:0}
.win-page .we-filter-empty{padding:1.5rem;background:#fff;border:1px solid var(--line);border-radius:1rem}
.win-page .we-sources{border-top:1px solid var(--line);padding:1rem 0;margin-top:2rem;color:var(--muted);font-size:.875rem}
.win-page .we-sources summary{min-height:2.75rem;cursor:pointer}
.win-page .we-sources a{display:flex;align-items:center;gap:.5rem;min-height:2.75rem;color:var(--red)}
.win-article-hero{padding-block:.5rem 2.5rem}
.win-page .win-article-hero h1{font:300 clamp(2rem,4.5vw,4.5rem)/1.1 var(--wi-display);letter-spacing:-.045em;max-width:75rem;margin:1.5rem 0}
.win-article-actions{margin-bottom:2rem}
.win-article-actions .win-ai{margin:0}
.win-article-hero .win-visual{border-radius:var(--wi-radius)}
.win-reading-layout{display:grid;gap:2rem;padding-block:2.5rem 4rem;align-items:start}
.win-page .wd-reading{max-width:68ch;margin-inline:auto;width:100%}
.win-page .wd-reading p{font-size:1.0625rem;line-height:1.9;color:var(--muted);margin-bottom:1.5rem}
.win-page .wd-reading h2{font:300 clamp(1.875rem,3.2vw,2.75rem)/1.12 var(--wi-display);margin-bottom:1.75rem}
.win-page .wd-reading .wd-source-box{padding:1.5rem;background:#fff;border:1px solid var(--line);border-radius:var(--wi-radius);margin-block:2rem}
.win-page .wd-source-box>a{display:inline-flex;align-items:center;min-height:2.75rem;gap:.75rem;font-size:1rem;color:var(--red)}
.win-page .wd-reading .wd-source-box p,.win-page .wd-reading .wd-muted{font-size:.875rem;line-height:1.8}
.win-reading-aside{padding:1.5rem;background:#e6e5de;border-radius:var(--wi-radius)}
.win-reading-aside h2{font-size:1.75rem}
.win-reading-aside p{font-size:.9375rem;line-height:1.8;color:var(--muted)}
.win-reading-aside>a{display:flex;align-items:center;min-height:2.75rem;padding:.5rem 0;gap:.75rem;border-top:1px solid #aaa69f;font-size:.875rem;color:var(--red)}
.win-gallery{padding-top:2rem;max-width:68ch;margin-inline:auto}
.win-gallery>div{display:grid;gap:1.5rem}
.win-gallery figure{margin:0;border-radius:1rem;overflow:hidden;background:#fff}
.win-gallery img{width:100%;height:auto;max-height:35rem;object-fit:contain}
.win-gallery figcaption{padding:.75rem 1.25rem;font:400 .75rem/1.6 var(--wi-tech);color:var(--muted)}
.win-animation-link{padding:1.5rem;background:#fff;border:1px solid var(--line);border-radius:1rem}
.win-animation-link a{display:inline-flex;align-items:center;gap:.75rem;min-height:2.75rem;color:var(--red);font-size:.875rem}
.win-animation-link p{font-size:.875rem;color:var(--muted);line-height:1.75}
.win-page .we-content{padding-block:2.5rem 4rem}
.win-events-content .we-block{margin:0;padding-block:2.5rem;border-bottom:1px solid var(--line)}
.win-events-content .we-empty{background:#fff;border:1px solid var(--line);padding:1.5rem;border-radius:var(--wi-radius)}
.win-events-content p{font-size:1rem;line-height:1.8;color:var(--muted)}
.win-events-content a{display:inline-flex;align-items:center;gap:.75rem;min-height:2.75rem;color:var(--red);font-size:.875rem}
.win-page .we-event-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:1.5rem}
.win-page .we-event-grid article{display:grid;background:#fff;border:0;border-radius:var(--wi-radius);overflow:hidden}
.win-page .we-event-grid article>img{width:100%;height:auto;max-height:24rem;object-fit:contain;background:#e6e5de}
.win-page .we-event-grid article>div{padding:1.5rem}
.win-page .we-event-grid article h3{font-size:2rem}
.win-page .we-event-grid article .wd-overline{font:400 .75rem/1.6 var(--wi-tech);color:var(--muted)}
.win-page .we-event-grid article a{margin-right:1.5rem}
.win-event-facts{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem;border-block:1px solid var(--line);padding-block:1.25rem;margin-bottom:2rem}
.win-event-facts dt{font:400 .75rem/1.6 var(--wi-tech);color:var(--muted);margin-bottom:.5rem}
.win-event-facts dd{font-size:1rem;margin:0}
.win-event-report{max-width:68ch}
.win-event-report p{font-size:1.0625rem;line-height:1.9;color:var(--muted)}
.win-page .we-story-visual{background:#fff;border-radius:var(--wi-radius);overflow:hidden}
.win-page .we-story-visual img{width:100%;height:auto;object-fit:contain}
.wd-style-industrial:has(.win-page) .wd-header{container-type:inline-size}
.wd-style-industrial:has(.win-page) :is(.wd-contact-band h2,.wd-contact-band .wd-container>div,.wd-footer-top>div){min-width:0;max-width:100%;overflow-wrap:anywhere}
.wd-style-industrial:has(.win-page) .wd-contact-band .wd-button{max-width:100%;white-space:normal}
.wd-style-industrial:has(.win-page) .wx-footer,.wd-style-industrial:has(.win-page) .wx-footer :is(div,a,p){min-width:0;overflow-wrap:anywhere}
@container (width < 64rem){.wd-style-industrial:has(.win-page) .wd-nav{min-height:5rem;gap:.75rem;flex-wrap:wrap}.wd-style-industrial:has(.win-page) .wd-nav>.wd-brand{margin-right:auto;max-width:100%}.wd-style-industrial:has(.win-page) .wd-menu{display:flex}.wd-style-industrial:has(.win-page) .wd-nav>nav{display:none;order:5;flex-direction:column;align-items:stretch;width:100%;margin:0;padding:1rem;max-height:calc(100svh - 6rem);overflow-y:auto}.wd-style-industrial:has(.win-page) .wd-nav>nav.wd-open{display:flex;max-height:calc(100svh - 6rem)}.wd-style-industrial:has(.win-page) .wx-mega-panel{position:static;display:block;padding:1rem;box-shadow:none}.wd-style-industrial:has(.win-page) .wx-mega-links{grid-template-columns:1fr}}
@media(min-width:640px){.win-news-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.win-page .we-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.win-event-facts{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:768px){.win-index-hero{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:2.5rem;padding-block:1rem 3rem}.win-intro{align-self:center}.win-section-heading{flex-direction:row;align-items:end;justify-content:space-between}.win-feature-copy{padding:2rem}.win-page .we-event-grid article{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center}.win-page .we-filters{grid-template-columns:repeat(3,minmax(0,1fr))}.win-article-hero{padding-block:1rem 3rem}.win-reading-layout{padding-block:3.5rem 4rem;gap:3rem}}
@media(min-width:1024px){.win-reading-layout{grid-template-columns:minmax(0,1fr) minmax(0,18rem)}.win-reading-aside{position:sticky;top:8rem}.win-index-hero{gap:4rem}.win-news-list,.win-related{padding-block:3.5rem 4rem}.win-page .we-event-grid article>div{padding:2.5rem}}
@media(prefers-reduced-motion:reduce){.win-page *{scroll-behavior:auto;transition:none}}
`;
