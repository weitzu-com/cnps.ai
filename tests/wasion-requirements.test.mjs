import test from 'node:test';
import assert from 'node:assert/strict';
import { Script, runInNewContext } from 'node:vm';
import { wasionDemoPage, WASION_DEMO_ROUTES, WASION_PAGES } from '../server/wasion-demo-page.mjs';
import { WASION_DEFAULT_STYLE, WASION_STYLES, wasionStyleBase } from '../server/wasion-demo-styles.mjs';
import { WASION_SOURCES } from '../server/wasion-demo-sources.mjs';
import { PRODUCTS, SOLUTIONS, CHALLENGES, LEAF_CATEGORIES, NEWS, RESOURCE_ITEMS } from '../server/wasion-requirements/data.mjs';
import { BASE_CLIENT } from '../server/wasion-requirements/client.mjs';
import { BUSINESS_CLIENT } from '../server/wasion-requirements/business-client.mjs';
import { COMPANY_CLIENT } from '../server/wasion-requirements/company-client.mjs';
import { visitorRegionForCountry } from '../server/wasion-requirements/visitor-region.mjs';
import { createWasionPageHandler } from '../api/crm-wasion-demo-page.js';
import { officialSearchUrl } from '../server/wasion-experience/search.mjs';

const nonce = 'requirements-acceptance-nonce';
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const page = slug => wasionDemoPage(nonce, { slug });
const stripRaw = html => html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');

// A small HTML-tree reader, rather than a section regex: nested sections and
// collection controls must not accidentally pass a top-level order check.
function tree(html) {
  const root = { tag: '#document', attrs: {}, children: [] }, stack = [root];
  const voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  for (const [, closing, tagName, raw] of stripRaw(html).matchAll(/<(\/)?([a-z][a-z0-9:-]*)\b([^>]*)>/gi)) {
    const tag = tagName.toLowerCase();
    if (closing) {
      const index = stack.findLastIndex(node => node.tag === tag);
      if (index > 0) stack.length = index;
      continue;
    }
    const attrs = Object.fromEntries([...raw.matchAll(/([^\s=\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map(([, name, quoted, single, unquoted]) => [name, decode(quoted ?? single ?? unquoted ?? '')]));
    const node = { tag, attrs, children: [], parent: stack.at(-1) };
    stack.at(-1).children.push(node);
    if (!voids.has(tag) && !/\/\s*$/.test(raw)) stack.push(node);
  }
  return root;
}
function all(root, predicate) {
  return root.children.flatMap(node => [...(predicate(node) ? [node] : []), ...all(node, predicate)]);
}
const byId = (root, id) => all(root, node => node.attrs.id === id)[0];
const hasClass = (node, name) => (node.attrs.class || '').split(/\s+/).includes(name);
const main = root => all(root, node => node.tag === 'main')[0];
const modules = html => {
  const content=main(tree(html));
  return all(content,node=>node.attrs['data-module'] && !function nested(parent){return parent===content?false:!!parent.attrs['data-module']||nested(parent.parent);}(node.parent)).map(node=>node.attrs['data-module']);
};
const scope = (html, id) => byId(tree(html), id);
const attrs = (html, name) => all(tree(html), node => Object.hasOwn(node.attrs, name));

test('static images and search catalog do not offer baked video play buttons, and alias heroes retain their own source artwork', () => {
  const videoCovers = new Set([
    '9528fb29db5c-aae63a864fabdc081649bb69b8676df7.webp','aca8ae9047bf-def19dcd6e83a03b3f3fdf79442d9224.webp',
    'ad680768d09d-g3-hybrid.webp','8415204f36dc-energypro430x340.webp','cca4f1a3af11-91275158bf7e3769fca6a36b2d20982b.webp',
    'fac9ed6c68df-e4ce4c1541825e05d9153c41cd39af09.webp','9830d94b0eae-6c310bece3c373e7c13a3c77b84a85ac.webp',
    'cd400ffbbeed-2e6d51dfed2ec14a138b75411b5099d0.webp','a2c4ff8f79b8-5bc60336a205122cceaee36f7127b6d3.webp'
  ].map(name=>'/assets/wasion-requirements/'+name));
  for(const slug of WASION_DEMO_ROUTES){
    for(const img of all(tree(page(slug)),node=>node.tag==='img'))assert.ok(!videoCovers.has(img.attrs.src),slug+': misleading static video cover');
  }
  const catalog=JSON.parse(page('search').match(/const WASION_DATA=([\s\S]*?);const SEARCH_QUERY=/)[1]);
  for(const record of catalog)assert.ok(!videoCovers.has(record.image),record.id+': static search image');
  for(const [slug,filename] of [['cellular-based-ami-solutions','wasion-engineering-film-12s.webp'],['wasion-g3-plc-rf-hybrid-solutions','7a455a925f9c-g3-hybrid.webp'],['energy-pro','eeab56d92746-energyprosolution800x450.webp']]){
    const hero=all(tree(page(slug)),node=>hasClass(node,'wr-hero-backdrop'))[0];
    assert.equal(hero.attrs.src,'/assets/wasion-requirements/'+filename,slug);
  }
  const videoLinks=[...stripRaw(page('collateral-videos')).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .filter(([, ,body])=>body.replace(/<[^>]*>/g,'').trim()==='Play video')
    .map(([,attrs])=>decode(attrs.match(/href="([^"]*)"/)[1]));
  assert.deepEqual(videoLinks.sort(),[
    'https://en.wasion.com/public/uploads/files/20230718/about.mp4',
    'https://en.wasion.com/public/uploads/files/20240206/G3-PLC%20Hybrid%20explained%20video.mp4'
  ]);
});

test('09/16 requirements is the canonical design and retained designs have explicit route bases', () => {
  assert.equal(WASION_DEFAULT_STYLE, 'requirements');
  assert.equal(wasionStyleBase(), '/demo/wasion');
  assert.equal(wasionStyleBase('requirements'), '/demo/wasion');
  for (const style of ['classic','atmospheric','planhat','orderful','industrial']) {
    assert.ok(Object.hasOwn(WASION_STYLES, style));
    assert.equal(wasionStyleBase(style), '/demo/wasion/styles/' + style);
  }
  for (const slug of ['home','ami-solution','about','search']) assert.equal(page(slug), wasionDemoPage(nonce, { slug, style: 'requirements' }));
  assert.match(page('home'), /<body\b[^>]*class="[^"]*wd-style-requirements/);
});

test('all 198 canonical routes have one headline, unique controls, valid internal targets and real fragments', () => {
  assert.equal(WASION_DEMO_ROUTES.length, 198);
  assert.equal(new Set(WASION_DEMO_ROUTES).size, 198);
  const bases = [...new Set(Object.keys(WASION_STYLES).map(wasionStyleBase))].sort((a,b) => b.length-a.length);
  for (const slug of WASION_DEMO_ROUTES) {
    const html = page(slug);
    assert.ok(html, slug);
    const root = tree(html), content = main(root);
    assert.ok(content, slug + ': main landmark');
    assert.equal(all(content, node => node.tag === 'h1').length, 1, slug + ': one h1');
    const ids = all(root, node => node.attrs.id).map(node => node.attrs.id);
    assert.equal(new Set(ids).size, ids.length, slug + ': duplicate id');
    for (const node of all(root, node => node.attrs.href)) {
      const href = node.attrs.href;
      if (href.startsWith('#')) assert.ok(ids.includes(href.slice(1)), `${slug}: missing local fragment ${href}`);
      if (!href.startsWith('/demo/wasion')) continue;
      const url = new URL(href, 'https://crm.cnps.ai');
      const base = bases.find(candidate => url.pathname === candidate || url.pathname.startsWith(candidate + '/'));
      assert.ok(base, `${slug}: unknown demo root ${href}`);
      const target = url.pathname === base ? 'home' : url.pathname.slice(base.length + 1);
      assert.ok(WASION_DEMO_ROUTES.includes(target), `${slug}: unknown route ${href}`);
      if (url.hash) {
        const targetTree = tree(wasionDemoPage(nonce, { slug: target, style: Object.keys(WASION_STYLES).find(style => wasionStyleBase(style) === base) }));
        assert.ok(byId(targetTree, decodeURIComponent(url.hash.slice(1))), `${slug}: missing destination fragment ${href}`);
      }
    }
    for (const node of all(root, node => node.attrs['aria-controls'])) for (const id of node.attrs['aria-controls'].split(/\s+/)) assert.ok(ids.includes(id), `${slug}: missing controlled element ${id}`);
  }
});

test('P10–13 primary and secondary navigation follow the customer hierarchy and offer two discovery paths', () => {
  const root = tree(page('home')), nav = byId(root, 'wr-navigation');
  assert.ok(nav);
  const top = nav.children.find(node => node.tag === 'ul').children;
  const labels = ['offering','challenges','company','resources'];
  assert.deepEqual(top.slice(0,4).map(li => li.children.find(node => node.tag === 'button')?.attrs['data-mega-toggle']), labels);
  assert.equal(top[4].children.find(node => node.tag === 'a')?.attrs.href, '/demo/wasion/contact');
  const text = stripRaw(page('home'));
  for (const label of ['Investors','Newsroom','Careers','International Sites','English']) assert.ok(text.includes(label), label);
  for (const challenge of CHALLENGES) assert.ok(all(byId(root,'wr-menu-challenges'), node => node.attrs.href === '/demo/wasion/' + challenge.slug).length, challenge.title);
  for (const leaf of LEAF_CATEGORIES.filter(leaf => ['water-gas-meters','digital-grid-distribution-monitoring','energy-storage'].includes(leaf.catalog))) assert.ok(all(byId(root,'wr-menu-offering'), node => node.attrs.href === '/demo/wasion/' + leaf.slug).length, leaf.label);
  assert.equal(attrs(page('home'),'data-mobile-menu').length,1);
  assert.equal(attrs(page('home'),'data-open-dialog').filter(node => node.attrs['data-open-dialog']==='wr-search-dialog').length,1);
});

test('P15–17 homepage preserves all six source screens and the lifecycle stays within the offering screen', () => {
  const html = page('home');
  assert.deepEqual(modules(html), ['hero','key-data','customer-challenges','solutions-and-services','whats-new','cta']);
  assert.equal(attrs(html,'data-carousel').length,1);
  assert.ok(attrs(html,'data-slide').length >= 3);
  assert.equal(attrs(html,'data-carousel-dot').length, attrs(html,'data-slide').length);
  const proof = scope(html,'key-data');
  assert.equal(all(proof, node => hasClass(node,'wr-metric-primary')).length,2, 'R&D has visual priority');
  assert.equal(all(scope(html,'customer-challenges'), node => hasClass(node,'wr-challenge-tile')).length,4);
  const offering = scope(html,'solutions-and-services');
  assert.equal(all(offering, node => hasClass(node,'wr-offering-tile')).length,4);
  assert.equal(all(offering, node => hasClass(node,'wr-lifecycle-steps'))[0].children.length,5);
  assert.equal(all(tree(html), node => node.attrs['data-module']==='footer').length,1);
});

test('P19 challenge aggregations use four different structures, dedicated journeys and the assigned solution paths', () => {
  const expected = [
    ['hero','challenge','approach','solutions','resources','cta'],
    ['hero','network-scenario','operational-path','solution-pair','evidence','cta'],
    ['hero','scenario-tabs','energy-flow','configuration','evidence','cta'],
    ['hero','water-gas-layers','service-journey','utility-stories','evidence','cta']
  ];
  for (const [index, challenge] of CHALLENGES.entries()) {
    const html = page(challenge.slug);
    assert.deepEqual(modules(html),expected[index],challenge.title);
    for (const slug of challenge.solutions) assert.ok(stripRaw(html).includes('href="/demo/wasion/' + slug + '"'), `${challenge.title}: ${slug}`);
  }
  assert.equal(new Set(expected.map(order=>order.join('/'))).size,4);
  assert.equal(attrs(page(CHALLENGES[1].slug),'data-grid-point').length,3);
  assert.equal(attrs(page(CHALLENGES[2].slug),'data-energy-scene').length,4);
  assert.deepEqual(attrs(page(CHALLENGES[3].slug),'data-utility-select').map(node=>node.attrs['data-utility-select']),['water','gas']);
  assert.equal(all(tree(page(CHALLENGES[2].slug)), node=>hasClass(node,'wr-b-energy-flow')).length,4);
  assert.equal(all(tree(page(CHALLENGES[3].slug)), node=>hasClass(node,'wr-b-utility-split'))[0].children.length,2);
});

test('P20–21 all 14 solutions follow the AMI template with an explicit conditional Next Gen module', () => {
  assert.equal(SOLUTIONS.length,14);
  for (const solution of SOLUTIONS) {
    const html = page(solution.slug);
    const order = ['hero','challenge','approach','features','cases',...(solution.challenge===0?['next-gen']:[]),'related-products','cta'];
    assert.deepEqual(modules(html),order,solution.title);
    assert.ok(attrs(html,'data-arch-node').length >= 4,solution.title+' architecture');
    assert.equal(attrs(html,'data-arch-node').length,attrs(html,'data-arch-panel').length);
    if (solution.challenge===0) assert.ok(scope(html,'next-gen') && stripRaw(html).includes('href="/demo/wasion/next-gen-ami"'));
    for (const slug of solution.products) assert.ok(stripRaw(html).includes('href="/demo/wasion/' + slug + '"'),solution.title+': '+slug);
  }
  const ami = page('ami-solution');
  assert.deepEqual(modules(ami),['hero','challenge','approach','features','cases','next-gen','related-products','cta']);
  assert.match(page('next-gen-ami'),/Aventa/);
  assert.match(page('next-gen-ami'),/href="\/demo\/wasion\/dtech-2026"/);
});

test('P23 electricity has the sole business theme; water, digital grid and storage go directly to vertical catalogues', () => {
  assert.deepEqual(modules(page('electricity-metering-data-management')),['hero','subcategories','proof','certifications','resources','cta']);
  for (const slug of ['electricity-meters','telecommunications','system-software','water-gas-meters','digital-grid-distribution-monitoring','energy-storage']) {
    const html = page(slug);
    assert.deepEqual(modules(html),['hero','catalogue','cta'],slug);
    const collection=scope(html,'catalogue');
    assert.equal(all(collection,node=>hasClass(node,'wr-product-rows')).length,1,slug+' vertical list');
    const records=all(collection,node=>Object.hasOwn(node.attrs,'data-record'));
    assert.ok(records.length>0,slug+' real model records');
    for(const row of records){
      const links=all(row,node=>hasClass(node,'wr-b-product-row'));
      assert.equal(links.length,1);
      assert.equal(all(links[0],node=>node.tag==='h2').length,1);
      assert.ok(all(links[0],node=>node.tag==='p').length);
    }
    assert.ok(all(collection,node=>node.attrs['data-facet']==='q').length);
    assert.equal(all(collection,node=>Object.hasOwn(node.attrs,'data-reset')).length,1);
  }
});

test('P22–24 every model follows the eight-screen detail order and retains all available source features and parameters', () => {
  for (const product of PRODUCTS) {
    const html = page(product.slug), visible = stripRaw(html);
    assert.deepEqual(modules(html),['hero','features','parameters','certifications','documents','solutions','related','cta'],product.slug);
    for (const feature of product.features||[]) assert.ok(visible.includes(escape(feature)),product.slug+': '+feature);
    for (const cell of (product.tables||[]).flat(2)) assert.ok(visible.includes(escape(cell)),product.slug+': '+cell);
    if(product.tables?.length) assert.ok(all(scope(html,'parameters'),node=>node.tag==='table').length,product.slug+' visible parameter table');
    assert.ok(scope(html,'solutions'));
    // P22 requires a project pathway, but a broad solution's shared carousel is
    // not proof that a case installed this model. Accept a sourced model case or
    // an actionable request for that exact model, instead of rewarding a label.
    const modelCases=all(scope(html,'solutions'),node=>Object.hasOwn(node.attrs,'data-case-evidence'));
    assert.equal(modelCases.length,1,product.slug+' explicit model-case evidence state');
    if(product.caseRelations?.length){
      assert.equal(modelCases[0].attrs['data-case-evidence'],'exact-model');
      for(const relation of product.caseRelations)assert.ok(all(modelCases[0],node=>node.attrs.href==='/demo/wasion/'+relation.id).length,product.slug+': verified case');
    }else{
      assert.equal(modelCases[0].attrs['data-case-evidence'],'not-established');
      assert.ok(all(modelCases[0],node=>node.attrs.href?.startsWith('/demo/wasion/contact?intent=')&&decodeURIComponent(node.attrs.href).includes(product.title+' model-specific project reference')).length,product.slug+': actionable exact-model reference request');
    }
    assert.ok(visible.includes('href="'+escape(encodeURI(product.url))+'"'),product.slug+' official model source');
  }
});

test('P26–33 company, news and resources preserve the prototype screen order and collection-specific layouts', () => {
  const expected = {
    about:['hero','who-we-are','who-we-serve','story-of-wasion','global-presence','esg','cta'],
    innovation:['hero','research-development','manufacturing-capability','quality-system','cta'],
    partners:['hero','partnership-description','partner-entries','cta'],
    newsroom:['newsroom-heading','newsroom-list','cta'],
    'media-kit':['hero','brand-materials','company-video','official-logo','cta'],
    events:['hero','upcoming-events','past-events','cta'],
    certifications:['hero','certificate-library','cta'],
    'collateral-videos':['hero','collateral-library','cta'],
    'case-studies':['hero','case-study-library','cta']
  };
  for(const [slug,order]of Object.entries(expected))assert.deepEqual(modules(page(slug)),order,slug);
  assert.ok(!modules(page('newsroom')).includes('hero'),'Newsroom compact heading, no image hero');
  for(const [slug,facets]of [['newsroom',['q','topic','region','type']],['certifications',['q','region','topic']],['collateral-videos',['q','type','topic']],['case-studies',['q','region','topic']]]){
    const html=page(slug),root=tree(html),collection=all(root,node=>Object.hasOwn(node.attrs,'data-collection'))[0];
    assert.ok(collection,slug);
    assert.deepEqual(all(collection,node=>Object.hasOwn(node.attrs,'data-facet')).map(node=>node.attrs['data-facet']),facets,slug+' facets');
    const ordered=all(collection,node=>node.attrs.class==='wr-filters'||Object.hasOwn(node.attrs,'data-records')||Object.hasOwn(node.attrs,'data-load-more'));
    assert.equal(ordered[0].attrs.class,'wr-filters');
    assert.ok(Object.hasOwn(ordered[1].attrs,'data-records'));
    assert.ok(Object.hasOwn(ordered[2].attrs,'data-load-more'));
    assert.ok(hasClass(ordered[1],slug==='case-studies'?'wr-case-grid':'wr-editorial'),slug+' layout');
  }
  const partner=scope(page('partners'),'partner-entries');
  const intents=all(partner,node=>node.tag==='a').map(node=>new URL(node.attrs.href,'https://crm.cnps.ai').searchParams.get('intent'));
  assert.deepEqual(intents,['Channel partnership enquiry','Technology partnership enquiry','Supplier application']);
  assert.ok(attrs(page('about'),'data-timeline-tab').length>=2);
  assert.ok(attrs(page('about'),'data-map-key').length>=4);
  assert.ok(attrs(page('about'),'data-presence-region').length>=5);
  assert.ok(all(scope(page('events'),'upcoming-events'),node=>node.tag==='h3').length);
  assert.doesNotMatch(stripRaw(page('events')),/Register now|2027/);
});

test('source catalogs, exact certificate scope and nonce scripts remain trustworthy under the new shell', () => {
  for(const slug of WASION_DEMO_ROUTES){
    const html=page(slug),scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
    assert.ok(scripts.length>=1,slug);
    for(const [,attributes,source]of scripts){assert.match(attributes,new RegExp('nonce="'+nonce+'"'),slug);if(attributes.includes('application/ld+json'))assert.doesNotThrow(()=>JSON.parse(source),slug);else assert.doesNotThrow(()=>new Script(source),slug);}
    for(const id of ['wd-protected','wd-logout','wd-session-notice'])assert.ok(byId(tree(html),id),slug+': '+id);
    assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">/);
  }
  const html=page('home'),embedded=JSON.parse(html.match(/const WASION_DATA=([\s\S]*?);const SEARCH_QUERY=/)[1]);
  assert.equal(embedded.length,122);
  assert.deepEqual(embedded.map(({id,url})=>({id,url})),WASION_SOURCES.map(({id,url})=>({id,url})));
  for(const product of PRODUCTS)assert.ok(embedded.some(source=>source.id===product.slug&&source.url===product.url),product.title+' searchable official model');
  const bySource=new Map(embedded.map(source=>[source.id,source]));
  for(const source of WASION_SOURCES){assert.equal(bySource.get(source.id)?.url,source.url,source.id);assert.ok(WASION_DEMO_ROUTES.includes(source.id),source.id);}
  const emittedSearch=page('search'),known=embedded.find(item=>item.id.startsWith('product-')&&item.category==='Products'&&item.image.startsWith('/assets/wasion-requirements/'));
  assert.ok(known,'trusted mirrored model image');
  const makeNode=(tag,className='',textContent='')=>({tag,className,textContent,children:[],attributes:{},append(...children){this.children.push(...children);},setAttribute(name,value){this.attributes[name]=value;}});
  const searchContext={catalog:embedded,byId:bySource,official:officialSearchUrl,detail:item=>'/demo/wasion/'+item.id,node:makeNode,link(label,href,className='',external=false){return Object.assign(makeNode('a',className,label),{href,external});},URL};
  runInNewContext(emittedSearch.match(/function trustedItems\(items\)\{[^\n]+\}/)[0]+'\n'+emittedSearch.match(/function card\(p,product\)\{[^\n]+\}/)[0],searchContext);
  const trusted=searchContext.trustedItems([{...known,url:'https://untrusted.example/',image:'/assets/wasion-requirements/untrusted.svg'},{id:'untrusted-id',image:known.image}]);
  assert.equal(trusted.length,1);assert.equal(trusted[0].url,known.url);assert.equal(trusted[0].image,known.image);
  const descend=(root,tag)=>root.children.flatMap(child=>[...(child.tag===tag?[child]:[]),...descend(child,tag)]);
  const trustedCard=searchContext.card(trusted[0],true);
  assert.equal(descend(trustedCard,'img')[0]?.src,known.image);
  for(const image of ['/assets/wasion-requirements/untrusted.svg','//untrusted.example/model.png','javascript:alert(1)','data:image/svg+xml,bad']){
    const untrustedCard=searchContext.card({...known,image,url:'https://untrusted.example/'},true);
    assert.equal(descend(untrustedCard,'img').length,0,image+' is not an allowed media source');
    assert.ok(!descend(untrustedCard,'a').some(anchor=>anchor.external),'untrusted citation remains blocked');
  }
  for(const query of ['</script><script>alert(1)</script>','"><img src=x onerror=alert(1)>','\u2028\u2029 & "quoted"']){
    const search=wasionDemoPage(nonce,{slug:'search',query});
    assert.ok(stripRaw(search).includes('value="'+escape(query.trim())+'"'));
    const literal=search.match(/const SEARCH_QUERY=([\s\S]*?);\(\(\)=>/)[1];
    assert.equal(JSON.parse(literal),query);
    assert.ok(!literal.includes('<'), 'script-safe JSON encoding');
    assert.ok(!search.includes('<script>alert(1)</script>'));
  }
  const certificate=stripRaw(page('certifications'));
  assert.match(certificate,/Wasion Hungary Kft\./);
  assert.match(certificate,/does not establish certification of every product/);
  assert.doesNotMatch(certificate,/All products are certified/);
  for(const resource of RESOURCE_ITEMS.filter(resource=>/ISO|Certificate|MID/i.test(resource.title)))assert.ok(certificate.includes(escape(resource.title)),resource.title);
  for(const news of NEWS)assert.ok(stripRaw(page('newsroom')).includes('datetime="'+news.date+'"'),news.title);
});

test('the requirements shell does not import the legacy layout CSS or its visual classes', () => {
  const html=page('home'),root=tree(html),css=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(([,source])=>source).join('\n');
  assert.doesNotMatch(css,/\.wd-(?:hero-grid|nav\s|footer-top|detail-layout)|\.wi-hero|\.wv-order-hero|\.wx-hero/);
  assert.doesNotMatch(stripRaw(html),/class="[^"]*\b(?:wi-hero|wv-order-hero|wx-hero|wd-nav|wd-footer)\b/);
  assert.ok(all(root,node=>hasClass(node,'wr-header')).length);
  assert.ok(all(root,node=>hasClass(node,'wr-footer')).length);
  assert.match(css,/--(?:blue|navy|ink|bg)[^;]*:|--mint:/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/@media\s*\(min-width:1024px\)/);
});

class FakeElement {
  constructor(dataset={}){this.dataset=dataset;this.listeners=new Map();this.attributes={};this.hidden=false;this.value='';this.textContent='';this.children=new Map();const classes=new Set();this.classList={contains:name=>classes.has(name),remove:name=>classes.delete(name),toggle(name,force){const add=force??!classes.has(name);if(add)classes.add(name);else classes.delete(name);return add;}};}
  addEventListener(name,listener){this.listeners.set(name,listener);}
  setAttribute(name,value){this.attributes[name]=String(value);}
  getAttribute(name){return this.attributes[name];}
  querySelector(selector){return this.children.get(selector)||null;}
  querySelectorAll(selector){return this.children.get(selector)||[];}
  focus(){this.focused=true;}
  emit(name,event={}){this.listeners.get(name)?.({currentTarget:this,preventDefault(){},...event});}
}
function clientContext(roots={}){return {document:{hidden:false,getElementById:()=>null,querySelector:()=>null,querySelectorAll:selector=>roots[selector]||[],addEventListener(){}},matchMedia:()=>({matches:true,addEventListener(){}}),URLSearchParams,location:{search:''},setTimeout,clearTimeout,setInterval,clearInterval};}

test('open dialogs wrap native Tab at both boundaries without focusing hidden or disabled controls', () => {
  const dialog=new FakeElement();dialog.open=true;
  const first=new FakeElement(),middle=new FakeElement(),last=new FakeElement(),hidden=new FakeElement(),disabled=new FakeElement();
  for(const el of [first,middle,last,hidden,disabled]){el.tabIndex=0;el.getClientRects=()=>[{}];}
  hidden.getClientRects=()=>[];disabled.disabled=true;
  dialog.children.set('a[href],button,input,select,textarea,[tabindex]',[first,middle,last,hidden,disabled]);
  const context=clientContext({dialog:[dialog]});context.getComputedStyle=()=>({visibility:'visible'});
  for(const el of [first,middle,last])el.focus=()=>{context.document.activeElement=el;};
  runInNewContext(BASE_CLIENT,context);
  let prevented=0;const tab=(shiftKey=false)=>dialog.emit('keydown',{key:'Tab',shiftKey,preventDefault(){prevented++;}});
  context.document.activeElement=last;tab();assert.equal(context.document.activeElement,first);assert.equal(prevented,1);
  tab(true);assert.equal(context.document.activeElement,last);assert.equal(prevented,2);
  context.document.activeElement=middle;tab();assert.equal(context.document.activeElement,middle);assert.equal(prevented,2);
  dialog.open=false;context.document.activeElement=last;tab();assert.equal(prevented,2);
});

test('catalogue and resource filters combine facets, expose empty recovery, reset and append fresh records', () => {
  const root=new FakeElement({limit:'2'}),form=new FakeElement(),q=new FakeElement({facet:'q'}),topic=new FakeElement({facet:'topic'}),reset=new FakeElement(),more=new FakeElement(),count=new FakeElement(),empty=new FakeElement();
  const records=[['meter a','metering'],['meter b','metering'],['meter c','metering'],['water a','water']].map(([q,topic])=>new FakeElement({q,topic}));
  root.children=new Map([['[data-record]',records],['[data-facet]',[q,topic]],['[data-result-count]',count],['[data-empty]',empty],['[data-load-more]',more],['[data-reset]',reset],['form',form]]);
  runInNewContext(BASE_CLIENT,clientContext({'[data-collection]':[root]}));
  const visible=()=>records.filter(record=>!record.hidden);
  assert.equal(visible().length,2);assert.equal(more.hidden,false);
  more.emit('click');assert.equal(visible().length,4);assert.equal(more.hidden,true);
  q.value='meter';topic.value='metering';q.emit('input');assert.equal(count.textContent,'3 results');assert.equal(visible().length,2);
  more.emit('click');assert.equal(visible().length,3);
  topic.value='water';topic.emit('change');assert.equal(visible().length,0);assert.equal(empty.hidden,false);assert.equal(more.hidden,true);
  reset.emit('click');assert.equal(q.value,'');assert.equal(topic.value,'');assert.equal(visible().length,2);assert.equal(empty.hidden,true);
});

test('the new hero carousel changes slides, supports pause and stops automatic motion on focus or reduced-motion preference', () => {
  const root=new FakeElement(),slides=[0,1,2].map(index=>new FakeElement({slideHref:'/demo/wasion/scene-'+index,slideAction:'Explore scene '+index})),dots=[0,1,2].map(()=>new FakeElement()),next=new FakeElement(),prev=new FakeElement(),pause=new FakeElement(),sceneLink=new FakeElement();sceneLink.firstChild={textContent:''};
  root.children=new Map([['[data-slide]',slides],['[data-carousel-dot]',dots],['[data-carousel-next]',next],['[data-carousel-prev]',prev],['[data-carousel-pause]',pause],['[data-carousel-link]',sceneLink]]);root.contains=()=>false;
  const context=clientContext({'[data-carousel]':[root]}),timers=new Map();let serial=0;const preference={matches:false,addEventListener(name,listener){this.listener=listener;}};
  context.matchMedia=()=>preference;context.setInterval=callback=>{timers.set(++serial,callback);return serial;};context.clearInterval=id=>timers.delete(id);
  runInNewContext(BASE_CLIENT,context);
  const selected=index=>{assert.deepEqual(slides.map(slide=>slide.hidden),slides.map((_,i)=>i!==index));assert.equal(dots[index].attributes['aria-current'],'true');assert.equal(sceneLink.href,slides[index].dataset.slideHref);assert.equal(sceneLink.firstChild.textContent,slides[index].dataset.slideAction);};
  selected(0);assert.equal(timers.size,1);
  next.emit('click');selected(1);dots[2].emit('click');selected(2);prev.emit('click');selected(1);
  pause.emit('click');assert.equal(pause.attributes['aria-pressed'],'true');assert.equal(timers.size,0);
  root.emit('mouseleave');assert.equal(timers.size,0,'paused rotation stays paused');
  pause.emit('click');assert.equal(timers.size,1);root.emit('focusin');assert.equal(timers.size,0);
  root.emit('focusout',{relatedTarget:null});assert.equal(timers.size,1);
  preference.matches=true;preference.listener();assert.equal(timers.size,0);
  prev.emit('click');selected(0);assert.equal(timers.size,0,'manual navigation works without automatic rotation');
});

test('the new main menu has exclusive panels, a working touch menu and Escape returns focus', () => {
  const nav=new FakeElement(),mobile=new FakeElement(),buttons=[0,1].map(()=>new FakeElement()),panels=[0,1].map(()=>new FakeElement()),events=new Map();
  buttons.forEach((button,index)=>{button.setAttribute('aria-controls','menu-'+index);button.setAttribute('aria-expanded','false');panels[index].hidden=true;});
  const context=clientContext({'[data-mega-toggle]':buttons});
  context.document.getElementById=id=>id==='wr-navigation'?nav:panels[Number(id.replace('menu-',''))];
  context.document.querySelector=selector=>selector==='[data-mobile-menu]'?mobile:null;
  context.document.addEventListener=(name,listener)=>events.set(name,listener);
  runInNewContext(BASE_CLIENT,context);
  buttons[0].emit('click');assert.deepEqual(panels.map(panel=>panel.hidden),[false,true]);
  buttons[1].emit('click');assert.deepEqual(panels.map(panel=>panel.hidden),[true,false]);
  events.get('keydown')({key:'Escape'});assert.deepEqual(panels.map(panel=>panel.hidden),[true,true]);assert.equal(buttons[1].focused,true);
  mobile.emit('click');assert.equal(nav.classList.contains('is-open'),true);assert.equal(mobile.attributes['aria-expanded'],'true');
  buttons[0].emit('click');events.get('keydown')({key:'Escape'});assert.equal(nav.classList.contains('is-open'),false);assert.equal(mobile.focused,true);
  buttons[0].emit('click');events.get('click')({target:{closest:()=>null}});assert.equal(panels[0].hidden,true);
});

test('the mobile drawer moves the existing utility controls and restores them on desktop without cloning the session button', () => {
  const utility=new FakeElement(),nav=new FakeElement(),mobile=new FakeElement(),logout=new FakeElement(),slot={nodes:[]};
  logout.id='wd-logout';utility.nodes=[logout];nav.nodes=[];slot.nodes=[utility,nav];utility.parentNode=slot;
  const detach=child=>{const siblings=child.parentNode.nodes;siblings.splice(siblings.indexOf(child),1);};
  nav.append=child=>{detach(child);nav.nodes.push(child);child.parentNode=nav;};
  slot.insertBefore=(child,before)=>{detach(child);const index=slot.nodes.indexOf(before);slot.nodes.splice(index<0?0:index,0,child);child.parentNode=slot;};
  Object.defineProperty(slot,'firstChild',{get(){return slot.nodes[0];}});
  const wide={matches:false,addEventListener(name,listener){this.listener=listener;}},reduce={matches:true,addEventListener(){}};
  const context=clientContext();context.matchMedia=query=>query.includes('min-width')?wide:reduce;
  context.document.getElementById=id=>id==='wr-navigation'?nav:null;
  context.document.querySelector=selector=>selector==='.wr-utility'?utility:selector==='[data-mobile-menu]'?mobile:null;
  runInNewContext(BASE_CLIENT,context);
  assert.equal(utility.parentNode,nav);assert.deepEqual(nav.nodes,[utility]);assert.equal(utility.nodes[0],logout);
  mobile.emit('click');assert.equal(nav.classList.contains('is-open'),true);
  wide.matches=true;wide.listener();assert.equal(utility.parentNode,slot);assert.equal(slot.nodes[0],utility);assert.equal(nav.nodes.length,0);assert.equal(utility.nodes[0],logout);
  wide.matches=false;wide.listener();assert.equal(utility.parentNode,nav);assert.equal(utility.nodes[0],logout);assert.equal(utility.nodes.filter(node=>node.id==='wd-logout').length,1);
});

test('architecture, network, energy and utility controls visibly change the corresponding panel', () => {
  const definitions=[['[data-architecture]','[data-arch-node]','[data-arch-panel]'],['[data-reliability]','[data-grid-point]','[data-grid-detail]'],['[data-energy-scenarios]','[data-energy-scene]','[data-energy-panel]'],['[data-utility-selector]','[data-utility-select]','[data-utility-detail]']];
  for(const [selector,trigger,panel]of definitions){
    const root=new FakeElement(),buttons=[0,1,2].map(i=>new FakeElement()),panels=[0,1,2].map(i=>new FakeElement());
    for(let i=0;i<3;i++){buttons[i].setAttribute(trigger.slice(1,-1),i);panels[i].setAttribute(panel.slice(1,-1),i);}
    root.children=new Map([[trigger,buttons],[panel,panels]]);
    runInNewContext(BUSINESS_CLIENT,clientContext({[selector]:[root]}));
    buttons[2].emit('click');assert.deepEqual(panels.map(p=>p.hidden),[true,true,false],selector);assert.equal(buttons[2].attributes['aria-pressed'],'true');
    buttons[0].emit('click');assert.deepEqual(panels.map(p=>p.hidden),[false,true,true],selector);
  }
});

test('company timeline responds to click and arrow, Home and End keys with one active panel', () => {
  const root=new FakeElement(),tabs=[0,1,2].map(()=>new FakeElement()),panels=[0,1,2].map(()=>new FakeElement());
  root.children=new Map([['[data-timeline-tab]',tabs],['[data-timeline-panel]',panels]]);
  runInNewContext(COMPANY_CLIENT,clientContext({'[data-timeline]':[root]}));
  tabs[1].emit('click');assert.deepEqual(panels.map(p=>p.hidden),[true,false,true]);assert.equal(tabs[1].tabIndex,0);
  tabs[1].emit('keydown',{key:'End'});assert.deepEqual(panels.map(p=>p.hidden),[true,true,false]);assert.equal(tabs[2].focused,true);
  tabs[2].emit('keydown',{key:'ArrowRight'});assert.deepEqual(panels.map(p=>p.hidden),[false,true,true]);
  tabs[0].emit('keydown',{key:'Home'});assert.equal(tabs[0].attributes['aria-selected'],'true');
});

test('P28 country preference selects an initial region and retains global fallback and manual access to every region', async () => {
  for(const [country,region]of [['US','Americas'],['mx','Americas'],['BR','Americas'],['HU','Europe'],['DE','Europe'],['TZ','Africa'],['CI','Africa'],['CN','Asia'],['SA','Asia']])assert.equal(visitorRegionForCountry(country),region,country);
  for(const country of [undefined,null,'','ZZ','AU','US<script>','US, CN'])assert.equal(visitorRegionForCountry(country),'',String(country));
  let session={identityId:'fixture-admin',identity:{role:'admin'}};
  const handler=createWasionPageHandler({getRuntime:()=>({auth:{loadSession:async()=>session},projectAccessService:{getProject:async()=>({id:'fixture'})}})});
  async function request(country,query={}){
    const res={headers:{},setHeader(name,value){this.headers[name]=value;},end(value){this.body=value;}};
    await handler({method:'GET',url:'/demo/wasion/about',headers:{host:'crm.cnps.ai',...(country?{'x-vercel-ip-country':country}:{})},query:{slug:'about',...query}},res);
    return res;
  }
  for(const [country,region]of [['US','Americas'],['HU','Europe'],['TZ','Africa'],['CN','Asia'],['ZZ','All regions'],[undefined,'All regions']]){
    const res=await request(country);
    assert.equal(res.statusCode,200);
    assert.ok(res.body.includes('data-default-region="'+region+'"'));
    assert.deepEqual(attrs(res.body,'data-presence-region').map(node=>node.attrs['data-presence-region']),['All regions','Americas','Europe','Africa','Asia']);
    assert.match(res.headers['Cache-Control'],/private, no-store/);
  }
  const queryOnly=await request(undefined,{country:'US',visitorRegion:'Americas',region:'Americas'});
  assert.ok(queryOnly.body.includes('data-default-region="All regions"'),'untrusted query cannot impersonate edge country preference');
  session=null;
  const anonymous=await request('US');
  assert.equal(anonymous.statusCode,302);
  assert.equal(anonymous.body,undefined,'country preference cannot bypass authentication');
});


test('published ISO originals show exact certificate metadata without attaching it to unspecified models',()=>{
 const certificates=RESOURCE_ITEMS.filter(r=>r.certificateMetadata);assert.equal(certificates.length,2);
 const html=stripRaw(page('certifications'));
 for(const r of certificates){const m=r.certificateMetadata;assert.equal(m.status,'verified-original-certificate-metadata');assert.equal(m.modelScope.length,0);assert.equal(r.date,m.issueDate);for(const value of [m.certificateNumber,m.issuer,m.scope])assert.ok(html.includes(escape(value)),value);}
 assert.match(html,/September 17, 2027/);assert.match(html,/September 22, 2028/);assert.match(html,/does not establish certification of every product/);
});
