import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, runInNewContext } from 'node:vm';
import { WASION_PAGES, wasionDemoPage } from '../server/wasion-demo-page.mjs';
import { getCrmRuntime } from '../server/crm-runtime.mjs';
import pageHandler from '../api/crm-wasion-demo-page.js';

const content = JSON.parse(readFileSync(new URL('../server/wasion-demo-content.json', import.meta.url), 'utf8'));
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const logo = 'https://en.wasion.com/public/uploads/images/20220517/ad428c0c9f42220db4e310a71131810b.png';
const encode = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const markup = html => html.slice(0, html.indexOf('<script'));
const route = page => page.slug === 'home' ? '/demo/wasion' : `/demo/wasion/${page.slug}`;

function sessionHarness({ slug='home', override }={}) {
  const html=wasionDemoPage('fixture-nonce',{slug}),elements=new Map(),listeners=new Map(),calls=[],state={};
  class Element {
    constructor(){this.hidden=false;this.disabled=false;this.textContent='';this.attributes={};this.listeners=new Map();this.classList={toggle(){},remove(){}};}
    addEventListener(name,handler){this.listeners.set(name,handler);}
    getAttribute(name){return this.attributes[name];}
    setAttribute(name,value){this.attributes[name]=String(value);}
    removeAttribute(name){delete this.attributes[name];}
  }
  for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))elements.set(id,new Element());
  const menu=new Element(),navigation=new Element();
  const document={getElementById:id=>elements.get(id),querySelector:selector=>selector==='.wd-menu'?menu:selector==='#wd-navigation'?navigation:null,addEventListener(){}};
  const script=html.match(/<script nonce="fixture-nonce">([\s\S]*)<\/script>/)[1];
  runInNewContext(script,{document,window:{addEventListener(name,handler){listeners.set(name,handler);}},AbortController,setTimeout,clearTimeout,
    location:{replace(value){state.navigation=value;}},async fetch(url,options){const call={url,options,body:options.body?JSON.parse(options.body):undefined};calls.push(call);const response=await override?.(call,state)||{status:200,body:call.body?{ok:true}:{authenticated:true,identity:{role:'customer'}}};return{status:response.status??200,type:response.type,ok:(response.status??200)>=200&&(response.status??200)<300,async json(){return response.body;}};}});
  return{html,state,calls,get:id=>elements.get(id),async click(id){await elements.get(id).listeners.get('click')();},async event(name,event={}){await listeners.get(name)?.(event);},async flush(){for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));}};
}

test('demo sign out confirms server revocation before hiding the page and preserves its original route',async()=>{
  const h=sessionHarness({slug:'products'});assert.match(h.html,/id="wd-logout"[^>]*>Sign out/);await h.click('wd-logout');
  assert.equal(h.get('wd-protected').hidden,true);assert.equal(new URL(h.state.navigation,'https://crm.example.test').searchParams.get('returnTo'),'/demo/wasion/products');
  assert.equal(h.calls[0].url,'/api/crm');assert.deepEqual(h.calls[0].body,{action:'logout'});assert.equal(h.calls[0].options.credentials,'same-origin');assert.equal(h.calls[0].options.cache,'no-store');
});

test('demo failed sign out remains visible and never reports successful logout',async()=>{
  for(const response of [{status:503,body:{error:'Unavailable'}},{status:200,body:{ok:false}}]){
    const h=sessionHarness({override:()=>response});await h.click('wd-logout');assert.equal(h.get('wd-protected').hidden,false);assert.equal(h.state.navigation,undefined);assert.equal(h.get('wd-logout').disabled,false);assert.match(h.get('wd-session-heading').textContent,/not completed/);
  }
});

test('demo history restore hides cached content before verifying current access',async()=>{
  const h=sessionHarness({override:()=>({status:401,body:{authenticated:false}})});await h.event('pagehide');assert.equal(h.get('wd-protected').hidden,true);
  await h.event('pageshow',{persisted:true});await h.flush();assert.equal(h.get('wd-protected').hidden,true);assert.equal(h.get('wd-session-login').hidden,false);assert.equal(h.get('wd-session-retry').hidden,true);
  assert.equal(h.calls.length,1);assert.equal(h.calls[0].url,'/api/crm?view=session');assert.equal(h.calls[0].options.cache,'no-store');assert.equal(h.calls[0].body,undefined);
});

test('demo access outages offer a retry while keeping cached content hidden and never sending SMS',async()=>{
  const h=sessionHarness({override:(_call,state)=>state.recovered?undefined:{status:503,body:{error:'Unavailable'}}});await h.event('pagehide');await h.event('pageshow',{persisted:true});await h.flush();
  assert.equal(h.get('wd-protected').hidden,true);assert.equal(h.get('wd-session-login').hidden,true);assert.equal(h.get('wd-session-retry').hidden,false);assert.equal(h.get('wd-session-retry').disabled,false);
  h.state.recovered=true;await h.click('wd-session-retry');assert.equal(h.get('wd-protected').hidden,false);assert.equal(h.get('wd-session-notice').hidden,true);
  assert.equal(h.calls.length,3);assert.equal(h.calls[2].url,'/demo/wasion');assert.equal(h.calls[2].options.method,'HEAD');assert.equal(h.calls[2].options.redirect,'manual');assert.ok(h.calls.every(call=>!call.body));
});

test('demo history restore rechecks the exact resource and refuses denied or unavailable HEAD responses',async()=>{
  for(const status of [0,302,401,403,404,503]){
    const h=sessionHarness({slug:'products',override:call=>call.options.method==='HEAD'?{status,type:status===0?'opaqueredirect':undefined,body:{}}:undefined});await h.event('pagehide');await h.event('pageshow',{persisted:true});await h.flush();
    assert.equal(h.get('wd-protected').hidden,true,String(status));assert.equal(h.calls.length,2);assert.equal(h.calls[1].url,'/demo/wasion/products');assert.equal(h.calls[1].options.method,'HEAD');assert.equal(h.calls[1].options.credentials,'same-origin');assert.equal(h.calls[1].options.cache,'no-store');assert.equal(h.calls[1].options.redirect,'manual');
    assert.equal(h.get('wd-session-login').hidden,![0,302,401].includes(status));assert.equal(h.get('wd-session-retry').hidden,status!==503);
    assert.ok(h.calls.every(call=>!call.body));
  }
});

test('a delayed resource check cannot reveal a demo snapshot after navigation away',async()=>{
  let completeHead;
  const h=sessionHarness({override:call=>call.options.method==='HEAD'?new Promise(resolve=>{completeHead=resolve;}):undefined});
  await h.event('pagehide');await h.event('pageshow',{persisted:true});await h.flush();assert.equal(typeof completeHead,'function');
  await h.event('pagehide');completeHead({status:200,body:{}});await h.flush();assert.equal(h.get('wd-protected').hidden,true);
});

test('64 distinct official English pages render complete navigation with the requested logo', () => {
  assert.equal(WASION_PAGES.length, 64);
  assert.equal(new Set(WASION_PAGES.map(page => page.slug)).size, WASION_PAGES.length);
  assert.equal(new Set(WASION_PAGES.map(page => page.url)).size, WASION_PAGES.length);
  assert.equal(content.logoUrl, logo);
  const validRoutes = new Set([...WASION_PAGES.map(route), '/demo/wasion/search']);
  for (const page of WASION_PAGES) {
    assert.match(page.slug, /^[a-z0-9-]+$/);
    assert.equal(new URL(page.url).origin, 'https://en.wasion.com');
    const html = wasionDemoPage('fixture-nonce', { slug: page.slug });
    assert.ok(html, page.slug);
    assert.match(html, /^<!doctype html><html lang="en">/, page.slug);
    assert.equal((markup(html).match(/<h1\b/g) || []).length, 1, page.slug);
    assert.ok(markup(html).includes(`src="${logo}"`), page.slug);
    assert.match(html, /aria-label="Main navigation"/, page.slug);
    assert.ok(html.includes('href="/demo/wasion/search"'), `Missing AI search entry on ${page.slug}`);
    assert.match(html, /<a class="wd-skip" href="#main">Skip to content<\/a>/, page.slug);
    for (const [, href] of markup(html).matchAll(/href="(\/demo\/wasion[^"?#]*)/g)) {
      assert.ok(validRoutes.has(href), `${page.slug} links to unknown route ${href}`);
    }
  }
});

test('every reproduced page exposes its own official source link', () => {
  for (const page of WASION_PAGES) {
    const html = markup(wasionDemoPage('fixture-nonce', { slug: page.slug }));
    assert.ok(html.includes(`href="${encode(encodeURI(page.url))}"`), `Missing source link on ${page.slug}`);
  }
});

test('product and solution details preserve their published features and technical table cells', () => {
  const details = WASION_PAGES.filter(page => page.pageType === 'detail' && ['Products', 'Solutions'].includes(page.category));
  assert.ok(details.length > 20);
  for (const page of details) {
    const html = markup(wasionDemoPage('fixture-nonce', { slug: page.slug }));
    for (const feature of page.features || []) assert.ok(html.includes(encode(feature)), `${page.slug}: ${feature}`);
    if (page.features?.length) assert.match(html, /id="features"/, page.slug);
    if (page.tables?.length) {
      assert.match(html, /id="specifications"/, page.slug);
      assert.match(html, /<caption>.*official technical information<\/caption>/, page.slug);
      for (const rows of page.tables) for (const row of rows) for (const cell of row) {
        assert.ok(html.includes(encode(cell)), `${page.slug}: ${cell}`);
      }
    }
  }
});

test('software category reaches its reproduced products and resources retain all official download links', () => {
  const software = markup(wasionDemoPage('fixture-nonce', { slug: 'system-software' }));
  const softwarePages = WASION_PAGES.filter(page => new URL(page.url).pathname.startsWith('/RelevantProduct/'));
  assert.ok(softwarePages.length >= 8);
  for (const page of softwarePages) assert.ok(software.includes(`href="${route(page)}"`), page.slug);
  const resources = WASION_PAGES.find(page => page.slug === 'resources');
  assert.ok(resources.downloads.length >= 6);
  const html = markup(wasionDemoPage('fixture-nonce', { slug: 'resources' }));
  for (const document of resources.downloads) {
    assert.equal(new URL(document.url).origin, 'https://en.wasion.com');
    assert.ok(html.includes(`href="${encode(encodeURI(document.url))}"`), document.title);
    assert.ok(html.includes(encode(document.title)), document.title);
  }
  assert.match(html, /current validity are determined by the official source/);
});

test('search queries are escaped in HTML attributes and cannot terminate the nonce script', () => {
  for (const query of ['</script><script>alert("x")</script>', '\"><img src=x onerror=alert(1)>', '& q="a" <b>\u2028\u2029']) {
    const html = wasionDemoPage('fixture-nonce', { slug: 'search', query });
    assert.equal((html.match(/<script\b/g) || []).length, 1);
    assert.equal((html.match(/<\/script>/g) || []).length, 1);
    assert.ok(html.includes(`value="${encode(query)}"`));
    const script = html.match(/<script nonce="fixture-nonce">([\s\S]*)<\/script>/)[1];
    assert.doesNotThrow(() => new Script(script));
    assert.ok(script.includes(`const SEARCH_QUERY=${JSON.stringify(query).replace(/</g, '\\u003c')};`));
    assert.match(script, /question:SEARCH_QUERY,language:'en'/);
  }
  assert.match(wasionDemoPage('fixture-nonce', { slug: 'search' }), /What would you like to know\?/);
  for (const slug of ['not-a-page', '../about', 'ABOUT', 'search/extra', '<script>']) assert.equal(wasionDemoPage('fixture-nonce', { slug }), null);
});

test('Vercel preserves the existing CRM entry and maps every demo child to the authenticated page API', () => {
  assert.deepEqual(vercel.rewrites.find(item => item.source === '/demo/wasion'), { source: '/demo/wasion', destination: '/api/crm-wasion-demo-page' });
  assert.deepEqual(vercel.rewrites.find(item => item.source === '/demo/wasion/:slug'), { source: '/demo/wasion/:slug', destination: '/api/crm-wasion-demo-page?slug=:slug' });
  assert.equal(vercel.rewrites.find(item => item.source === '/crm')?.destination, '/api/crm-page');
  assert.equal(vercel.redirects.find(item => item.source === '/crm/wasion-demo')?.destination, '/demo/wasion');
  for (const name of ['api/crm-wasion-demo-page.js', 'api/crm-wasion-demo-search.js']) {
    assert.equal(vercel.functions[name].includeFiles, 'server/wasion-demo-content.json');
    assert.equal(vercel.functions[name].maxDuration, 30);
  }
});

test('page API enforces live CRM authentication, route bounds, private caching, HEAD and nonce CSP', async t => {
  // Initialize only with synthetic endpoints; session loading is replaced before
  // any handler invocation, so this test never contacts a service or real account.
  const fixtureEnv = {
    UPSTASH_REDIS_REST_URL: 'https://example.invalid', UPSTASH_REDIS_REST_TOKEN: 'test-token',
    TWENTY_API_URL: 'https://example.invalid', TWENTY_API_KEY: 'test-token', CNPS_PROPOSAL_SECRET: '1'.repeat(64),
    CRM_FILE_GATEWAY_URL: 'https://example.invalid', CRM_FILE_GATEWAY_KEY: '2'.repeat(64)
  };
  const originals = Object.fromEntries(Object.keys(fixtureEnv).map(key => [key, process.env[key]]));
  Object.assign(process.env, fixtureEnv);
  let runtime, acl;
  try { runtime = getCrmRuntime(); acl = runtime.projectAccessService; }
  finally { for (const [key, value] of Object.entries(originals)) value === undefined ? delete process.env[key] : process.env[key] = value; }
  const originalSession = runtime.auth.loadSession;
  const originalProject = acl.getProject;
  acl.getProject = async () => ({id:"fixture-project"});
  const response = () => ({ headers: {}, setHeader(name, value) { this.headers[name] = value; }, end(body) { this.body = body; } });
  let session = null;
  runtime.auth.loadSession = async () => session;
  try {
    await t.test('anonymous and inactive viewers cannot read any demo page', async () => {
      const anonymous = response();
      await pageHandler({ method: 'GET', url: '/api/crm-wasion-demo-page?slug=products' }, anonymous);
      assert.equal(anonymous.statusCode, 302);
      assert.equal(new URL(anonymous.headers.Location, 'https://crm.example.test').searchParams.get('returnTo'), '/demo/wasion/products');
      assert.equal(anonymous.body, undefined);
      const search = response();
      await pageHandler({method:'GET',url:'/demo/wasion/search',query:{slug:'search',q:'AMI & smart meters',returnTo:'https://evil.example/'}},search);
      assert.equal(new URL(search.headers.Location,'https://crm.example.test').searchParams.get('returnTo'),'/demo/wasion/search?q=AMI+%26+smart+meters');
      session = { identity: { role: 'customer', memberships: [{ role: 'customer', companyId: 'fixture', active: false }] } };
      const revoked = response();
      await pageHandler({ method: 'GET', url: '/api/crm-wasion-demo-page?slug=products' }, revoked);
      assert.equal(revoked.statusCode, 404);
      assert.ok(!revoked.body.includes('<html'));
    });
    session = { identityId: 'fixture-admin', identity: { role: 'admin' } };
    await t.test('all 64 rewritten routes resolve for an authorized viewer with source content', async () => {
      for (const page of WASION_PAGES) {
        const res = response();
        await pageHandler({ method: 'GET', url: route(page), query: { slug: page.slug } }, res);
        assert.equal(res.statusCode, 200, page.slug);
        assert.match(res.body, /<html lang="en">/, page.slug);
        for (const name of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) assert.match(res.headers[name], /private, no-store/, page.slug);
        assert.match(res.headers['X-Robots-Tag'], /noindex, nofollow/);
        const nonce = res.body.match(/<script nonce="([^"]+)">/)[1];
        assert.ok(res.headers['Content-Security-Policy'].includes(`script-src 'nonce-${nonce}'`));
        assert.ok(res.headers['Content-Security-Policy'].includes(`style-src 'nonce-${nonce}'`));
        assert.ok(res.headers['Content-Security-Policy'].includes('img-src https://en.wasion.com;'));
        assert.ok(res.headers['Content-Security-Policy'].includes("frame-ancestors 'none'"));
        assert.equal(res.headers['X-Frame-Options'], 'DENY');
      }
    });
    await t.test('HEAD uses the same authorization and routing while omitting the page body', async () => {
      const res = response();
      await pageHandler({ method: 'HEAD', url: '/api/crm-wasion-demo-page?slug=products' }, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body, undefined);
      assert.equal(res.headers['Content-Type'], 'text/html; charset=utf-8');
    });
    await t.test('rewritten and direct API requests preserve the search query without allowing script injection', async () => {
      const query = 'aMeter300 </script><script>alert(1)</script> & AMI';
      for (const req of [
        { method: 'GET', url: `/api/crm-wasion-demo-page?slug=search&q=${encodeURIComponent(query)}` },
        { method: 'GET', url: '/demo/wasion/search', query: { slug: 'search', q: query } }
      ]) {
        const res = response();
        await pageHandler(req, res);
        assert.equal(res.statusCode, 200);
        assert.ok(res.body.includes(`value="${encode(query)}"`));
        assert.equal((res.body.match(/<script\b/g) || []).length, 1);
      }
      const maximum = response();
      await pageHandler({ method: 'GET', url: '/demo/wasion/search', query: { slug: 'search', q: 'x'.repeat(500) } }, maximum);
      assert.equal(maximum.statusCode, 200);
    });
    await t.test('invalid routes, oversized queries and unsupported methods do not render a page', async () => {
      for (const slug of ['not-a-page', '../about', 'ABOUT', 'search/extra', '<script>']) {
        const res = response();
        await pageHandler({ method: 'GET', url: '/api/crm-wasion-demo-page', query: { slug } }, res);
        assert.equal(res.statusCode, 404, slug);
      }
      const oversized = response();
      await pageHandler({ method: 'GET', url: '/api/crm-wasion-demo-page', query: { slug: 'search', q: 'x'.repeat(501) } }, oversized);
      assert.equal(oversized.statusCode, 400);
      const post = response();
      await pageHandler({ method: 'POST', url: '/api/crm-wasion-demo-page' }, post);
      assert.equal(post.statusCode, 405);
    });
    await t.test('authentication outages fail closed', async () => {
      runtime.auth.loadSession = async () => { throw new Error('fixture authentication outage'); };
      const res = response();
      await pageHandler({ method: 'GET', url: '/api/crm-wasion-demo-page' }, res);
      assert.equal(res.statusCode, 503);
      assert.ok(!res.body.includes('<html'));
    });
  } finally { runtime.auth.loadSession = originalSession; acl.getProject=originalProject; }
});
