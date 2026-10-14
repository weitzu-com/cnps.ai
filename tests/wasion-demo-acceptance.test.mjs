import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { answerWasionQuestion } from '../server/wasion-demo.mjs';
import { WASION_SOURCES, retrieveWasionSources } from '../server/wasion-demo-sources.mjs';
import { SEARCH_CLIENT, rankSearchPages } from '../server/wasion-experience/search.mjs';

const reply = answer => ({ ok: true, text: async () => JSON.stringify({ choices: [{ message: { content: JSON.stringify({ answer, supported: true }) } }] }) });

test('unknown model prefixes do not become real model recommendations', () => {
  for (const query of ['I11', 'aMeter30', 'WFCT-96', 'I 99999']) {
    assert.equal(retrieveWasionSources(query).resultCount, 0, query);
    assert.equal(rankSearchPages(WASION_SOURCES, query).length, 0, query);
  }
  for (const query of ['I110', 'I-110', 'I 110', 'Does I-110 support 24 V?']) {
    assert.equal(retrieveWasionSources(query).results[0]?.id, 'i-110-series-smart-water-meter', query);
    assert.equal(rankSearchPages(WASION_SOURCES, query)[0]?.id, 'i-110-series-smart-water-meter', query);
  }
  assert.ok(!retrieveWasionSources('aMeter300').results.some(p => /-GT|-KT/.test(p.title)));
});

test('valid citation IDs cannot launder numeric values absent from their cited source', async () => {
  for (const answer of ['WFCT-960 uses DC 999 V. [s1]', 'WFCT-960 uses DC 24 V. [s1]', 'The gateway is described. [s1] Its supply is 999 V.']) {
    const result = await answerWasionQuestion({ env: { CRM_AI_API_KEY: 'fixture' }, question: 'WFCT-960 supply voltage', fetchImpl: async () => reply(answer) });
    assert.equal(result.data.ai.generated, false);
    assert.equal(result.data.ai.reason, 'unsupported_numeric_claim');
    assert.ok(!result.data.answer.includes('999'));
    assert.equal(result.data.results[0].id, 'wfct-960-wisun-gateway');
  }
  for (const answer of ['WFCT-960 uses DC 12 V and has IP65 protection. [s1]', 'WFCT-960 has a 902 to 928 MHz frequency range. [s1]', 'WFCT-960 supports up to 1,000 smart meters. [s1]']) {
    const result = await answerWasionQuestion({ env: { CRM_AI_API_KEY: 'fixture' }, question: 'WFCT-960 supply voltage', fetchImpl: async () => reply(answer) });
    assert.equal(result.data.ai.generated, true, answer);
  }
});

test('numeric evidence must belong to the cited source, not another retrieved page', async () => {
  const result = await answerWasionQuestion({ env: { CRM_AI_API_KEY: 'fixture' }, question: 'WFCT-960 and I110', fetchImpl: async (_url, options) => {
    const sources = JSON.parse(JSON.parse(options.body).messages[1].content).officialSources;
    const water = sources.find(p => p.id === 'i-110-series-smart-water-meter');
    assert.ok(sources.some(p => p.id === 'wfct-960-wisun-gateway'));
    return reply(`I-110 uses DC 12 V. [${water.citation}]`);
  } });
  assert.equal(result.data.ai.generated, false);
  assert.equal(result.data.ai.reason, 'unsupported_numeric_claim');
});

class Element {
  constructor() { this.listeners = new Map(); this.dataset = {}; this.value = ''; this.hidden = false; this.children = []; this.attributes = {}; this.classList = { add() {}, remove() {}, toggle() {} }; }
  addEventListener(type, callback) { this.listeners.set(type, callback); }
  emit(type, event = {}) { return this.listeners.get(type)?.(event); }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name]; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  querySelector() { return new Element(); }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { bottom: 100 }; }
  reportValidity() { return true; }
}
const pending = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function searchHarness(respond) {
  const elements = new Map();
  const element = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const root = element('ws-search'); root.dataset.base = '/demo/wasion/styles/classic';
  const tab = new Element(); tab.dataset.wsFilter = 'all'; tab.id = 'ws-tab-all'; root.querySelectorAll = () => [tab];
  const posts = [], requests = [], form = element('ws-form');
  form.action = root.dataset.base + '/search'; form.method = 'post';
  form.submit = () => posts.push({ action: form.action, method: form.method, q: element('ws-query').value, hidden: element('wd-protected').hidden });
  const forbidden = new Proxy({}, { get() { throw Error('Question must not use URL, storage or logging'); } });
  vm.runInNewContext(SEARCH_CLIENT, {
    document: { getElementById: element, createElement: () => new Element(), createTextNode: text => text, querySelector: () => new Element(), addEventListener() {} },
    window: { addEventListener() {} }, AbortController, URL,
    localStorage: forbidden, sessionStorage: forbidden, location: forbidden, history: forbidden, console: forbidden,
    WASION_DATA: WASION_SOURCES, SEARCH_QUERY: '', requestAnimationFrame: callback => callback(),
    fetch: async (url, options) => { const question = JSON.parse(options.body).question; requests.push({ url, question }); const r = await respond(question); return { status: r.status, ok: r.status >= 200 && r.status < 300, json: async () => r.body }; }
  });
  return { element, posts, requests, submit: value => { element('ws-query').value = value; form.emit('submit', { preventDefault() {} }); }, flush: () => new Promise(r => setImmediate(r)) };
}

test('in-page authorization denial uses native POST recovery with the original question and chosen style', async () => {
  for (const status of [401, 403, 404]) {
    const h = searchHarness(async () => ({ status, body: { error: 'Unavailable' } }));
    const q = 'I110 通信选项 & "参数" <check>';
    h.submit(q); await h.flush();
    assert.deepEqual(h.posts, [{ action: '/demo/wasion/styles/classic/search', method: 'post', q, hidden: true }]);
    assert.equal(h.requests.length, 1);
  }
});

test('provider and transport failures retain ordinary page recommendations without a login POST', async () => {
  for (const respond of [async () => ({ status: 502, body: {} }), async () => { throw Error('offline'); }, async () => ({ status: 200, body: { data: { answer: 'AI unavailable', results: retrieveWasionSources('I110').results, sources: [], ai: { generated: false } } } })]) {
    const h = searchHarness(respond); h.submit('I110'); await h.flush();
    assert.equal(h.posts.length, 0);
    assert.equal(h.element('wd-protected').hidden, false);
    assert.ok(h.element('ws-products').children.length > 0);
  }
});

test('a stale authorization failure cannot submit over a newer search', async () => {
  const old = pending();
  const h = searchHarness(q => q === 'I110' ? old.promise : Promise.resolve({ status: 200, body: { data: { answer: 'Matches', results: retrieveWasionSources(q).results, sources: [], ai: { generated: false } } } }));
  h.submit('I110'); h.submit('WFCT-960'); await h.flush(); old.resolve({ status: 404, body: {} }); await h.flush();
  assert.equal(h.posts.length, 0);
  assert.equal(h.element('ws-query').value, 'WFCT-960');
});
