import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { METRICS_CLIENT } from '../server/wasion-experience/metrics.mjs';
import { SHELL_CLIENT } from '../server/wasion-experience/shell.mjs';
import { wasionDemoPage } from '../server/wasion-demo-page.mjs';

function harness({ reduced = false, observer = true, hidden = false, client = METRICS_CLIENT } = {}) {
  const nodes = [[1200, 0, '+', '1,200+'], [9.4, 1, '%', '9.4%'], [50, 0, '+', '50+'], [100, 0, 'M+', '100M+']].map(([target, decimals, suffix, text]) => ({ dataset: { wxCounterTarget: String(target), wxCounterDecimals: String(decimals), wxCounterSuffix: suffix }, textContent: text }));
  let nextId = 1, callback;
  const raf = new Map(), documentEvents = new Map(), motionEvents = new Map(), watched = new Set();
  const document = { hidden, querySelectorAll: selector => selector === '[data-wx-counter]' ? nodes : [], querySelector: () => null, addEventListener: (name, fn) => documentEvents.set(name, fn) };
  const motion = { matches: reduced, addEventListener: (name, fn) => motionEvents.set(name, fn) };
  class Observer {
    constructor(fn, options) { callback = fn; this.options = options; }
    observe(node) { watched.add(node); }
    unobserve(node) { watched.delete(node); }
    disconnect() { watched.clear(); }
  }
  const forbidden = () => { throw new Error('Counters must not use timers, network or storage'); };
  new Script(client).runInNewContext({ document, matchMedia: () => motion, ...(observer ? { IntersectionObserver: Observer } : {}), requestAnimationFrame: fn => { const id = nextId++; raf.set(id, fn); return id; }, cancelAnimationFrame: id => raf.delete(id), fetch: forbidden, setTimeout: forbidden, setInterval: forbidden, localStorage: { setItem: forbidden }, sessionStorage: { setItem: forbidden } });
  return {
    nodes, watched, raf,
    enter: (elements = nodes, visible = true) => callback?.(elements.map(target => ({ target, isIntersecting: visible }))),
    frame(timestamp) { for (const [id, fn] of [...raf]) { raf.delete(id); fn(timestamp); } },
    visibility(value) { document.hidden = value; documentEvents.get('visibilitychange')?.(); },
    reduce(value) { motion.matches = value; motionEvents.get('change')?.({ matches: value }); }
  };
}
const final = ['1,200+', '9.4%', '50+', '100M+'];
const texts = h => h.nodes.map(node => node.textContent);

test('official server figures remain unchanged until visible and only qualifying entries start', () => {
  const h = harness();
  assert.deepEqual(texts(h), final);
  assert.equal(h.raf.size, 0);
  h.enter(h.nodes, false);
  assert.equal(h.raf.size, 0);
  h.enter([h.nodes[0]]);
  assert.equal(h.watched.size, 3);
  h.frame(0); h.frame(900);
  assert.equal(h.nodes[0].textContent, '1,050+');
  assert.deepEqual(texts(h).slice(1), final.slice(1));
  h.frame(1800);
  assert.equal(h.nodes[0].textContent, final[0]);
  assert.equal(h.raf.size, 0);
});

test('viewport count-up uses deterministic easing, stagger, English formatting and exact final values once', () => {
  const h = harness(); h.enter(); h.frame(0); h.frame(900);
  assert.deepEqual(texts(h), ['1,050+', '7.7%', '37+', '66M+']);
  h.frame(2200);
  assert.deepEqual(texts(h), final);
  assert.equal(h.raf.size, 0);
  assert.equal(h.watched.size, 0);
  h.enter(); h.frame(4000);
  assert.deepEqual(texts(h), final);
  assert.equal(h.raf.size, 0);
});

test('initial reduced motion preserves final figures without observation or animation', () => {
  const h = harness({ reduced: true });
  assert.deepEqual(texts(h), final);
  assert.equal(h.watched.size, 0);
  assert.equal(h.raf.size, 0);
});

test('switching to reduced motion stops active count-up at the exact official figures', () => {
  const h = harness(); h.enter(); h.frame(0); h.frame(400);
  assert.notDeepEqual(texts(h), final);
  h.reduce(true);
  assert.deepEqual(texts(h), final);
  assert.equal(h.raf.size, 0);
  h.reduce(false); h.enter(); h.frame(9000);
  assert.deepEqual(texts(h), final);
  assert.equal(h.raf.size, 0);
});

test('hidden documents pause animation and resume elapsed visible time without replaying or jumping', () => {
  const h = harness(); h.enter(); h.frame(0); h.frame(500);
  const paused = texts(h);
  h.visibility(true);
  assert.equal(h.raf.size, 0);
  h.frame(50000);
  assert.deepEqual(texts(h), paused);
  h.visibility(false); h.frame(50000);
  assert.deepEqual(texts(h), paused);
  h.frame(50500);
  assert.notDeepEqual(texts(h), paused);
  h.frame(52500);
  assert.deepEqual(texts(h), final);
  assert.equal(h.raf.size, 0);
});

test('IntersectionObserver fallback plays once and hidden initial documents keep the source fallback', () => {
  const h = harness({ observer: false, hidden: true });
  assert.deepEqual(texts(h), final);
  assert.equal(h.raf.size, 0);
  h.visibility(false); h.frame(0); h.frame(2400);
  assert.deepEqual(texts(h), final);
  assert.equal(h.raf.size, 0);
  h.visibility(true); h.visibility(false); h.frame(6000);
  assert.deepEqual(texts(h), final);
  assert.equal(h.raf.size, 0);
});

test('both homepage styles retain the four official SSR figures and static accessible alternatives', () => {
  for (const style of ['classic', 'atmospheric']) {
    const html = wasionDemoPage('counter-review-nonce', { style });
    const visual = [...html.matchAll(/<span data-wx-counter\b([^>]*)>([^<]+)<\/span>/g)];
    assert.equal(visual.length, 4, style);
    assert.deepEqual(visual.map(m => m[2]), final, style);
    for (const match of visual) assert.ok(match[1].includes('aria-hidden="true"'), style);
    assert.deepEqual(visual.map(m => ['target', 'decimals', 'suffix'].map(key => m[1].match(new RegExp(`data-wx-counter-${key}="([^"]*)"`))[1])), [['1200', '0', '+'], ['9.4', '1', '%'], ['50', '0', '+'], ['100', '0', 'M+']], style);
    assert.deepEqual([...html.matchAll(/<span class="wx-counter-sr">([^<]+)<\/span>/g)].map(m => m[1]), final, style);
    assert.equal(html.split(METRICS_CLIENT).length - 1, 1, style);
    assert.ok(html.includes('https://en.wasion.com/about.html'), style);
    const script = html.match(/<script nonce="counter-review-nonce">([\s\S]*)<\/script>/)[1];
    assert.doesNotThrow(() => new Script(script), style);
  }
});

test('the integrated shell starts metrics independently of its absent-film early return', () => {
  const h = harness({ client: SHELL_CLIENT });
  assert.equal(h.watched.size, 4);
  h.enter(); h.frame(0); h.frame(900);
  assert.notDeepEqual(texts(h), final);
  h.frame(2300);
  assert.deepEqual(texts(h), final);
  assert.equal(h.raf.size, 0);
});
