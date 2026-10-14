import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { METRICS_CLIENT } from '../server/wasion-experience/metrics.mjs';
import { SHELL_CLIENT } from '../server/wasion-experience/shell.mjs';
import { wasionDemoPage } from '../server/wasion-demo-page.mjs';

const final = ['1,200+', '9.4%', '50+', '100M+'];
const zero = ['0+', '0.0%', '0+', '0M+'];
const middle = ['1,050+', '7.7%', '37+', '66M+'];
function harness({ reduced = false, observer = true, hidden = false, client = METRICS_CLIENT, withToggle = true, withMetricsClass = true } = {}) {
  class Element {
    constructor(dataset = {}, text = '') { this.dataset = dataset; this.textContent = text; this.hidden = false; this.attributes = {}; this.listeners = new Map(); }
    addEventListener(name, fn) { const list = this.listeners.get(name) || []; list.push(fn); this.listeners.set(name, list); }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name]; }
    emit(name, event = {}) { for (const fn of this.listeners.get(name) || []) fn(event); }
  }
  const nodes = [[1200, 0, '+'], [9.4, 1, '%'], [50, 0, '+'], [100, 0, 'M+']].map(([target, decimals, suffix], i) => new Element({ wxCounterTarget: String(target), wxCounterDecimals: String(decimals), wxCounterSuffix: suffix }, final[i]));
  const group = new Element(); group.id = 'wx-statistics'; group.querySelectorAll = s => s === '[data-wx-counter]' ? nodes : [];
  group.getBoundingClientRect = () => ({ top: 200, bottom: 400, height: 200 });
  nodes.forEach(node => { node.closest = s => s === '.wx-metrics' ? group : null; node.parentElement = group; });
  const toggle = withToggle ? new Element() : null; if (toggle) { toggle.hidden = true; toggle.id = 'wx-counter-toggle'; }
  let nextId = 1, callback, options; const raf = new Map(), watched = new Set(), document = new Element(); document.hidden = hidden;
  document.querySelector = s => s === '#wx-statistics' || s === '.wx-metrics' && withMetricsClass ? group : s === '#wx-counter-toggle' ? toggle : null;
  document.querySelectorAll = s => s === '[data-wx-counter]' ? nodes : [];
  document.getElementById = id => id === 'wx-counter-toggle' ? toggle : id === 'wx-statistics' ? group : null;
  const motion = new Element(); motion.matches = reduced; motion.addListener = fn => motion.addEventListener('change', fn);
  class Observer { constructor(fn, config) { callback = fn; options = config; } observe(node) { watched.add(node); } unobserve(node) { watched.delete(node); } disconnect() { watched.clear(); } }
  const forbidden = () => { throw new Error('Counters must not use timers, network or storage'); };
  new Script(client).runInNewContext({ document, innerHeight: 800, matchMedia: () => motion, ...(observer ? { IntersectionObserver: Observer } : {}), requestAnimationFrame: fn => { const id = nextId++; raf.set(id, fn); return id; }, cancelAnimationFrame: id => raf.delete(id), fetch: forbidden, setTimeout: forbidden, setInterval: forbidden, localStorage: { setItem: forbidden }, sessionStorage: { setItem: forbidden } });
  return { nodes, group, toggle, watched, raf, get options() { return options; }, enter(visible = true, ratio = visible ? 1 : 0) { callback?.([{ target: group, isIntersecting: visible, intersectionRatio: ratio }]); }, frame(timestamp) { for (const [id, fn] of [...raf]) { raf.delete(id); fn(timestamp); } }, visibility(value) { document.hidden = value; document.emit('visibilitychange'); }, reduce(value) { motion.matches = value; motion.emit('change', { matches: value }); }, click() { toggle?.emit('click'); } };
}
const texts = h => h.nodes.map(node => node.textContent);

test('SSR remains static offscreen; one observed statistics region and positive intersection start the loop', () => {
  const h = harness(); assert.deepEqual(texts(h), final); assert.deepEqual([...h.watched], [h.group]);
  assert.ok([].concat(h.options.threshold).includes(0)); assert.equal(h.raf.size, 0);
  h.enter(false); h.enter(true, 0); assert.equal(h.raf.size, 0); assert.deepEqual(texts(h), final);
  h.enter(true, .01); h.frame(0); h.frame(900); assert.deepEqual(texts(h), middle); assert.equal(h.raf.size, 1);
});
test('the shared clock repeats count-up and holds exact official targets for 1,200ms', () => {
  const h = harness(); h.enter(); h.frame(0); assert.deepEqual(texts(h), zero);
  h.frame(900); assert.deepEqual(texts(h), middle); h.frame(2160); assert.deepEqual(texts(h), final);
  h.frame(2700); assert.deepEqual(texts(h), final); h.frame(3359); assert.deepEqual(texts(h), final);
  h.frame(3360); assert.deepEqual(texts(h), zero); h.frame(4260); assert.deepEqual(texts(h), middle);
  h.frame(5520); assert.deepEqual(texts(h), final); h.frame(6719); assert.deepEqual(texts(h), final);
  h.frame(6720); assert.deepEqual(texts(h), zero); assert.equal(h.raf.size, 1); assert.deepEqual([...h.watched], [h.group]);
});
test('leaving and reentering pauses the clock without restarting or adding offscreen time', () => {
  const h = harness(); h.enter(); h.frame(0); h.frame(900); h.enter(false); assert.equal(h.raf.size, 0);
  h.frame(50000); assert.deepEqual(texts(h), middle); h.enter(); h.frame(50000); assert.deepEqual(texts(h), middle);
  h.frame(51260); assert.deepEqual(texts(h), final); h.frame(52459); assert.deepEqual(texts(h), final);
  h.frame(52460); assert.deepEqual(texts(h), zero);
});
test('document visibility pauses the same clock, including the final-target hold', () => {
  const h = harness(); h.enter(); h.frame(0); h.frame(2160); h.visibility(true); assert.equal(h.raf.size, 0);
  h.frame(50000); assert.deepEqual(texts(h), final); h.visibility(false); h.frame(50000); assert.deepEqual(texts(h), final);
  h.frame(51199); assert.deepEqual(texts(h), final); h.frame(51200); assert.deepEqual(texts(h), zero);
  h.visibility(true); h.enter(false); h.visibility(false); assert.equal(h.raf.size, 0);
});
test('reduced motion is static; normal motion restarts only in a visible statistics region', () => {
  const h = harness({ reduced: true }); h.enter(); assert.deepEqual(texts(h), final); assert.equal(h.raf.size, 0); assert.equal(h.toggle.hidden, true);
  h.reduce(false); h.enter(); h.frame(1000); assert.deepEqual(texts(h), zero); h.frame(1900); assert.deepEqual(texts(h), middle); assert.equal(h.toggle.hidden, false);
  h.reduce(true); assert.deepEqual(texts(h), final); assert.equal(h.raf.size, 0); assert.equal(h.toggle.hidden, true);
  h.enter(false); h.reduce(false); assert.equal(h.raf.size, 0); assert.deepEqual(texts(h), final);
  h.enter(); h.frame(5000); assert.deepEqual(texts(h), zero);
});
test('manual pause survives leaving and returning; Resume continues existing progress', () => {
  const h = harness(); h.enter(); h.frame(0); h.frame(900); assert.equal(h.toggle.textContent, 'Pause statistics');
  h.click(); assert.equal(h.toggle.textContent, 'Resume statistics'); assert.equal(h.raf.size, 0); assert.deepEqual(texts(h), middle);
  h.enter(false); h.enter(); h.frame(50000); assert.equal(h.raf.size, 0); assert.deepEqual(texts(h), middle);
  h.click(); assert.equal(h.toggle.textContent, 'Pause statistics'); h.frame(50000); assert.deepEqual(texts(h), middle);
  h.frame(51260); assert.deepEqual(texts(h), final);
});
test('reduced-motion changes preserve a manual pause after normal motion returns', () => {
  const h = harness(); h.enter(); h.frame(0); h.frame(900); h.click();
  h.reduce(true); assert.equal(h.toggle.hidden, true); assert.deepEqual(texts(h), final);
  h.reduce(false); assert.equal(h.toggle.hidden, false); assert.equal(h.toggle.textContent, 'Resume statistics'); assert.equal(h.raf.size, 0);
  h.click(); h.frame(4000); assert.deepEqual(texts(h), zero);
});
test('without IntersectionObserver the loop follows page visibility and still repeats', () => {
  const h = harness({ observer: false, hidden: true }); assert.deepEqual(texts(h), final); assert.equal(h.raf.size, 0);
  h.visibility(false); h.frame(0); h.frame(2160); assert.deepEqual(texts(h), final); h.frame(3360); assert.deepEqual(texts(h), zero);
  h.frame(4260); assert.deepEqual(texts(h), middle); h.visibility(true); assert.equal(h.raf.size, 0);
  h.visibility(false); h.frame(50000); assert.deepEqual(texts(h), middle);
});
test('all four themes retain official SSR/SR figures and expose an accessible statistics pause control', () => {
  for (const style of ['classic', 'atmospheric', 'planhat', 'orderful']) {
    const html = wasionDemoPage('counter-review-nonce', { style }); assert.ok(html, `${style}: homepage route must be supported`);
    const visual = [...html.matchAll(/<span data-wx-counter\b([^>]*)>([^<]+)<\/span>/g)];
    assert.equal(visual.length, 4, style); assert.deepEqual(visual.map(m => m[2]), final, style);
    for (const match of visual) assert.ok(match[1].includes('aria-hidden="true"'), style);
    assert.deepEqual(visual.map(m => ['target', 'decimals', 'suffix'].map(key => m[1].match(new RegExp(`data-wx-counter-${key}="([^"]*)"`))[1])), [['1200', '0', '+'], ['9.4', '1', '%'], ['50', '0', '+'], ['100', '0', 'M+']], style);
    assert.deepEqual([...html.matchAll(/<span class="wx-counter-sr">([^<]+)<\/span>/g)].map(m => m[1]), final, style); assert.match(html, /id="wx-statistics"/);
    assert.equal((html.match(/id="wx-statistics"/g) || []).length, 1, style);
    const toggle = html.match(/<button\b[^>]*id="wx-counter-toggle"[^>]*>/)?.[0]; assert.ok(toggle, style);
    assert.ok(toggle.includes('type="button"') && toggle.includes('hidden') && toggle.includes('aria-controls="wx-statistics"'), style);
    assert.equal(html.split(METRICS_CLIENT).length - 1, 1, style); assert.ok(html.includes('https://en.wasion.com/about.html'), style);
    assert.doesNotThrow(() => new Script(html.match(/<script nonce="counter-review-nonce">([\s\S]*)<\/script>/)[1]), style);
  }
});
test('integrated shell metrics keep looping independently of the absent-film early return', () => {
  const h = harness({ client: SHELL_CLIENT }); h.enter(); h.frame(0); h.frame(900); assert.deepEqual(texts(h), middle);
  h.frame(2160); assert.deepEqual(texts(h), final); h.frame(3360); assert.deepEqual(texts(h), zero); h.enter(false); assert.equal(h.raf.size, 0);
});

test('variant layouts observe the shared statistics ID when the Classic metrics class is absent', () => {
  const h = harness({ withMetricsClass: false });
  assert.deepEqual([...h.watched], [h.group]);
  h.enter(); h.frame(0); h.frame(900); assert.deepEqual(texts(h), middle);
  h.enter(false); assert.equal(h.raf.size, 0);
});
