import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { renderHome, renderHeader, renderFooter, WASION_FILM, SHELL_CLIENT } from '../server/wasion-experience/shell.mjs';
import { renderContact, CONTACT_CLIENT } from '../server/wasion-experience/contact.mjs';
import { DISCOVERY_CLIENT } from '../server/wasion-experience/discovery.mjs';
import { wasionDemoPage } from '../server/wasion-demo-page.mjs';
import { getCrmRuntime } from '../server/crm-runtime.mjs';
import {createWasionPageHandler} from '../api/crm-wasion-demo-page.js';

const pages = JSON.parse(readFileSync(new URL('../server/wasion-demo-content.json', import.meta.url), 'utf8')).pages;
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const helpers = {
  escape, image: page => page?.images?.find(value => value.includes('/uploads/images/')) || '',
  img: (url, alt) => `<img src="${escape(url)}" alt="${escape(alt)}">`,
  card: page => `<a href="/demo/wasion/${page.slug}">${escape(page.title)}</a>`
};

class Element {
  constructor(dataset = {}) { this.dataset = dataset; this.attributes = {}; this.listeners = new Map(); this.textContent = ''; this.hidden = false; this.open = false; }
  addEventListener(type, callback, options = {}) {
    const listeners = this.listeners.get(type) || []; listeners.push({ callback, once: options.once }); this.listeners.set(type, listeners);
  }
  emit(type, event = {}) {
    for (const listener of [...(this.listeners.get(type) || [])]) {
      listener.callback({ target: this, ...event });
      if (listener.once) this.listeners.set(type, this.listeners.get(type).filter(item => item !== listener));
    }
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name]; }
  focus() { this.focused = true; }
  querySelector(selector) { return selector === 'summary' ? this.summary : null; }
}

function filmHarness({ reduced = false, rejectPlay = false, saveData = false } = {}) {
  const film = new Element({ source: WASION_FILM });
  Object.assign(film, { paused: true, src: '', readyState: 1, currentTime: 0, loads: 0, plays: 0, pauses: 0 });
  film.load = () => { film.loads += 1; };
  film.play = async () => { film.plays += 1; if (rejectPlay) throw new Error('Autoplay denied'); film.paused = false; film.emit('play'); };
  film.pause = () => { film.pauses += 1; film.paused = true; film.emit('pause'); };
  const toggle = new Element(), label = new Element(), segments = Array.from({ length: 7 }, (_, index) => new Element({ filmSegment: String(index) }));
  const menus = Array.from({ length: 3 }, () => { const menu = new Element(); menu.summary = new Element(); return menu; });
  const document = new Element(); document.hidden = false;
  const mobileMenu = new Element(), mobileNav = new Element(), classes = new Set();
  mobileMenu.attributes['aria-expanded'] = 'false';
  mobileNav.classList = { contains: name => classes.has(name), remove: name => classes.delete(name), toggle: (name, active) => active ? classes.add(name) : classes.delete(name) };
  for (const element of [mobileMenu, ...menus.map(menu => menu.summary)]) element.focus = () => { document.activeElement = element; element.focused = true; };
  document.querySelector = selector => ({ '#wx-film': film, '#wx-film-toggle': toggle, '#wx-film-scene': label, '.wd-menu': mobileMenu, '#wd-navigation': mobileNav })[selector] || null;
  document.querySelectorAll = selector => selector === '[data-film-segment]' ? segments : selector === '.wx-mega,.wx-sites,.wd-language' ? menus : [];
  const preference = new Element(); preference.matches = reduced;
  let observer;
  class Observer {
    constructor(callback) { this.callback = callback; observer = this; }
    observe(element) { assert.equal(element, film); }
  }
  new Script(SHELL_CLIENT).runInNewContext({ document, navigator: { connection: { saveData } }, matchMedia: () => preference, IntersectionObserver: Observer });
  return { film, toggle, label, segments, menus, mobileMenu, mobileNav, document, preference, visible: value => observer.callback([{ isIntersecting: value }]) };
}

const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

test('official film loads only after visibility and user pause survives visibility changes', async () => {
  const h = filmHarness();
  assert.equal(h.film.src, '');
  assert.equal(h.film.plays, 0);
  h.visible(true); await settle();
  assert.equal(h.film.src, WASION_FILM);
  assert.equal(h.film.loads, 1);
  assert.equal(h.film.paused, false);
  assert.equal(h.toggle.textContent, 'Pause animation');
  assert.equal(h.toggle.attributes['aria-pressed'], 'true');
  h.toggle.emit('click');
  assert.equal(h.film.paused, true);
  assert.equal(h.toggle.textContent, 'Play animation');
  const plays = h.film.plays;
  h.visible(false); h.visible(true);
  h.document.hidden = true; h.document.emit('visibilitychange');
  h.document.hidden = false; h.document.emit('visibilitychange'); await settle();
  assert.equal(h.film.plays, plays, 'an explicit pause must not be overwritten by automatic resume');
  h.toggle.emit('click'); await settle();
  assert.equal(h.film.paused, false);
  assert.equal(h.film.loads, 1, 'resume must reuse the loaded official film');
});

test('reduced motion avoids automatic video requests and allows an explicit play choice', async () => {
  const h = filmHarness({ reduced: true });
  h.visible(true); await settle();
  assert.equal(h.film.src, '');
  assert.equal(h.film.loads, 0);
  assert.equal(h.film.plays, 0);
  assert.match(h.label.textContent, /Reduced motion/);
  h.toggle.emit('click'); await settle();
  assert.equal(h.film.src, WASION_FILM);
  assert.equal(h.film.plays, 1);
  h.preference.emit('change');
  assert.equal(h.film.paused, true);
  h.visible(false); h.visible(true); await settle();
  assert.equal(h.film.plays, 1, 'reduced motion must prevent automatic resume');
});

test('Save-Data avoids automatic film loading even when motion preferences change', async () => {
  const h = filmHarness({ reduced: true, saveData: true });
  h.visible(true);
  h.preference.matches = false; h.preference.emit('change'); await settle();
  assert.equal(h.film.src, '');
  assert.equal(h.film.plays, 0);
  h.toggle.emit('click'); await settle();
  assert.equal(h.film.plays, 1, 'the viewer may choose to play despite data saving');
});

test('film failures retain readable page content and chapters stay user-controlled', async () => {
  const h = filmHarness({ rejectPlay: true });
  h.visible(true); await settle();
  assert.equal(h.film.paused, true);
  assert.match(h.label.textContent, /Select Play/);
  h.film.emit('error');
  assert.equal(h.toggle.hidden, true);
  assert.match(h.label.textContent, /Explore the portfolio below/);
  const chapters = filmHarness({ reduced: true });
  chapters.segments[3].emit('click'); await settle();
  assert.equal(chapters.film.currentTime, 3 * 4.28);
  assert.equal(chapters.film.plays, 1);
  chapters.film.emit('timeupdate');
  assert.equal(chapters.segments[3].attributes['aria-current'], 'true');
  assert.equal(chapters.label.textContent, 'Water meters');
});

test('mega navigation closes other menus and Escape returns focus to its summary', () => {
  const h = filmHarness();
  h.menus[0].open = true; h.menus[1].open = true; h.menus[1].emit('toggle');
  assert.equal(h.menus[0].open, false);
  h.document.emit('keydown', { key: 'Escape' });
  assert.equal(h.menus[1].open, false);
  assert.equal(h.menus[1].summary.focused, true);
});

test('Escape returns mobile navigation focus to its visible opener', () => {
  const h = filmHarness();
  h.mobileMenu.emit('click');
  assert.equal(h.mobileNav.classList.contains('wd-open'), true);
  h.menus[0].open = true;
  h.document.emit('keydown', { key: 'Escape' });
  assert.equal(h.mobileNav.classList.contains('wd-open'), false);
  assert.equal(h.mobileMenu.getAttribute('aria-expanded'), 'false');
  assert.equal(h.menus[0].open, false);
  assert.equal(h.document.activeElement, h.mobileMenu, 'focus must not land in the collapsed mobile navigation');
});

test('home uses the requested official assets, a poster and accessible controls without embedded trackers', () => {
  const home = renderHome({ pages, helpers });
  const header = renderHeader('home', { pages, helpers });
  const footer = renderFooter({ helpers });
  assert.equal(new URL(WASION_FILM).origin, 'https://en.wasion.com');
  assert.match(home, /<video[^>]+muted loop playsinline preload="none" poster="https:\/\/en\.wasion\.com/);
  assert.ok(!/<video[^>]+\bsrc=|<video[^>]+\bautoplay/.test(home), 'the client controls lazy motion loading');
  assert.match(home, /id="wx-film-toggle"[^>]+aria-pressed="false"/);
  assert.match(home, /<form[^>]+method="post" action="\/demo\/wasion\/search"/);
  assert.match(header, /ad428c0c9f42220db4e310a71131810b\.png/);
  assert.match(header, /Skip to content/);
  assert.match(footer, /mailto:sales@wasion\.com/);
  assert.ok(!/<iframe|<script\s+src|googletagmanager|google-analytics|facebook\.com\/tr|hotjar/i.test(home + header + footer));
});

function enquiryHarness({ valid = true, intent = '' } = {}) {
  const form = new Element();
  form.elements = Object.fromEntries(Object.entries({ name: 'Ada Example', email: 'ada@example.invalid', company: 'Utility Example', country: 'Example region', interest: 'Electricity metering & AMI', message: 'RF mesh & <specs>\nNext line' }).map(([key, value]) => [key, { value }]));
  form.reportValidity = () => valid;
  const status = new Element(), location = { search: intent ? `?intent=${intent}` : '', href: '' };
  const document = { querySelector: selector => selector === '#wx-enquiry' ? form : selector === '#wx-enquiry-status' ? status : null };
  class Data { constructor(value) { this.form = value; } get(name) { return this.form.elements[name].value; } }
  let networkCalls = 0;
  new Script(CONTACT_CLIENT).runInNewContext({ document, location, FormData: Data, URLSearchParams, fetch: () => { networkCalls += 1; throw new Error('Enquiry must not contact a server'); } });
  return { form, status, location, networkCalls: () => networkCalls };
}

test('enquiry only prepares an encoded email draft after valid user submission', () => {
  const h = enquiryHarness({ intent: 'newsletter' });
  assert.equal(h.form.elements.interest.value, 'News updates');
  assert.equal(h.location.href, '', 'initializing contact must not send or open a draft');
  let prevented = false;
  h.form.emit('submit', { preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.ok(h.location.href.startsWith('mailto:sales@wasion.com?subject='));
  const query = new URLSearchParams(h.location.href.split('?')[1]);
  assert.equal(query.get('subject'), 'Wasion enquiry — News updates');
  assert.ok(query.get('body').includes('RF mesh & <specs>\nNext line'));
  assert.equal(query.has('bcc'), false);
  assert.match(h.status.textContent, /Review it in your email application and choose Send/);
  assert.equal(h.networkCalls(), 0);
  const invalid = enquiryHarness({ valid: false });
  invalid.form.emit('submit', { preventDefault() {} });
  assert.equal(invalid.location.href, '');
  assert.equal(invalid.status.textContent, '');
});

test('native enquiry fallback cannot put personal fields into a demo GET URL', () => {
  const html = renderContact({ pages });
  const form = html.match(/<form\b[^>]*id="wx-enquiry"[^>]*>/)[0];
  assert.match(form, /method="post"/);
  assert.match(form, /action="mailto:sales@wasion\.com"/);
  assert.match(form, /enctype="text\/plain"/);
  assert.match(html, /message is sent only when you choose Send/);
  assert.match(html, /id="wx-enquiry-status" role="status" aria-live="polite"/);
});

test('privacy dialog reports GPC and reduced motion, closes and returns focus without storing consent', () => {
  const opener = new Element(), closer = new Element(), dialog = new Element(), gpcStatus = new Element(), motionStatus = new Element();
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.emit('close'); };
  dialog.querySelectorAll = () => [closer];
  const document = {
    getElementById: id => id === 'wd-privacy-dialog' ? dialog : null,
    querySelectorAll: selector => ({ '[data-wd-gpc-status]': [gpcStatus], '[data-wd-motion-status]': [motionStatus], '[data-wd-open-privacy]': [opener] })[selector] || []
  };
  const preference = new Element(); preference.matches = true;
  const forbidden = () => { throw new Error('Privacy status must not add tracking or consent storage'); };
  new Script(DISCOVERY_CLIENT).runInNewContext({ document, navigator: { globalPrivacyControl: true }, matchMedia: () => preference, localStorage: { setItem: forbidden }, sessionStorage: { setItem: forbidden }, fetch: forbidden });
  assert.match(gpcStatus.textContent, /Global Privacy Control is enabled/);
  assert.match(gpcStatus.textContent, /Optional tracking remains off/);
  assert.match(motionStatus.textContent, /requests reduced motion/);
  opener.emit('click'); assert.equal(dialog.open, true);
  closer.emit('click'); assert.equal(dialog.open, false);
  assert.equal(opener.focused, true);
  preference.matches = false; preference.emit('change');
  assert.match(motionStatus.textContent, /You can pause/);
});

test('integrated page scripts and structured data remain valid for search, home, product and legal routes', () => {
  for (const slug of ['home', 'search', 'contact', 'privacy', 'cookies', 'ai-search-terms', 'accessibility', 'ameter300-three-phase-smart-energy-meter']) {
    const html = wasionDemoPage('fixture-nonce', { slug, query: '</script><script>alert("x")</script>' });
    assert.ok(html, slug);
    assert.match(html, /name="robots" content="noindex,nofollow,noarchive,nosnippet"/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, slug);
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.filter(([, attributes]) => attributes.includes('application/ld+json')).length, 1, slug);
    for (const [, attributes, script] of scripts) {
      assert.ok(attributes.includes('nonce="fixture-nonce"'), slug);
      if (attributes.includes('application/ld+json')) assert.doesNotThrow(() => JSON.parse(script), slug);
      else assert.doesNotThrow(() => new Script(script), slug);
    }
    assert.ok(!html.includes('<script>alert("x")'), slug);
  }
});

test('authenticated POST search retains private caching and restricts media to the official host', async () => {
  const runtime={auth:{loadSession:async()=>({identityId:'test-viewer',identity:{role:'admin'}})},projectAccessService:{getProject:async()=>({id:'fixture-project'})}};
  const rawHandler=createWasionPageHandler({getRuntime:()=>runtime});const pageHandler=(req,res)=>rawHandler({...req,headers:{host:'crm.cnps.ai',...req.headers}},res);
  const originalSession=runtime.auth.loadSession;
  const response = () => ({ headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(body) { this.body = body; } });
  try {
    const res = response();
    await pageHandler({ method: 'POST', url: '/demo/wasion/search', query: { slug: 'search' }, headers: { origin: 'https://crm.cnps.ai', 'content-type': 'application/x-www-form-urlencoded' }, body: 'q=Three-phase+smart+meters' }, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.includes('Three-phase smart meters'));
    assert.match(res.headers['Content-Security-Policy'], /media-src https:\/\/en\.wasion\.com;/);
    assert.match(res.headers['Content-Security-Policy'], /img-src https:\/\/en\.wasion\.com;/);
    assert.match(res.headers['Content-Security-Policy'], /connect-src 'self';/);
    assert.match(res.headers['Content-Security-Policy'], /form-action 'self' mailto:;/);
    assert.match(res.headers['Cache-Control'], /private, no-store/);
    assert.match(res.headers['X-Robots-Tag'], /noindex/);
    const blocked = response();
    await pageHandler({ method: 'POST', url: '/demo/wasion/search', query: { slug: 'search' }, headers: { origin: 'https://attacker.invalid' }, body: 'q=Meter' }, blocked);
    assert.equal(blocked.statusCode, 403);
    runtime.auth.loadSession = async () => null;
    const anonymous = response();
    await pageHandler({ method: 'GET', url: '/demo/wasion/privacy', query: { slug: 'privacy' } }, anonymous);
    assert.equal(anonymous.statusCode, 302);
    assert.equal(anonymous.headers.Location, '/crm?returnTo=%2Fdemo%2Fwasion%2Fprivacy');
  } finally { runtime.auth.loadSession = originalSession; }
});
