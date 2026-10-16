import { BusinessError } from '../server/crm-business-service.mjs';
import { wasionPreviewBinding } from '../server/crm-project-previews.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { authorizeWasionCustomer, answerWasionQuestion, createWasionSearchHandler } from '../server/wasion-demo.mjs';
import { WASION_SOURCES, retrieveWasionSources } from '../server/wasion-demo-sources.mjs';
import corpus from '../server/wasion-demo-content.json' with { type: 'json' };
import { PRODUCTS } from '../server/wasion-requirements/data.mjs';
import { rankSearchPages } from '../server/wasion-experience/search.mjs';
import { wasionDemoPage } from '../server/wasion-demo-page.mjs';

const identity = { role: 'customer', memberships: [{ companyId: wasionPreviewBinding.companyId, role: 'customer' }] };
const service = { async getProject(principal, companyId, projectId) { assert.equal(companyId,wasionPreviewBinding.companyId);assert.equal(projectId,wasionPreviewBinding.projectId);if(principal.identity.role!=='admin'&&!principal.identity.memberships?.some(m=>m.companyId===companyId&&m.active!==false))throw new BusinessError(404,'Denied');return {id:projectId}; } };
const principal = { identity, identityId: 'subject-1' };
const makeAuth = viewer => ({ loadSession: async () => viewer ? { identity: viewer, identityId: 'subject-1' } : null });
const request = (body = { question: 'Prepayment solutions', language: 'en' }, headers = {}) => ({
  method: 'POST', headers: { origin: 'https://crm.cnps.ai', 'x-cnps-crm': '1', 'content-type': 'application/json', ...headers }, body
});
const response = () => ({ headers: {}, setHeader(name, value) { this.headers[name] = value; }, end(value) { this.body = value; } });
const modelResponse = (answer, supported = true, language) => ({ ok: true, text: async () => JSON.stringify({ choices: [{ message: { content: JSON.stringify({ answer, supported, ...(language ? { language } : {}) }) } }] }) });
const config = { env: { CRM_AI_API_KEY: 'test-key' } };
const modelForContext = async (_url, options) => {
  const sent = JSON.parse(options.body), source = JSON.parse(sent.messages[1].content).officialSources[0];
  return modelResponse(`The official page describes ${source.title}. [${source.id}]`);
};
// Local provider fixtures use the actual supplied excerpts and short-code map;
// none of these regression cases calls a provider or replaces a live answer.
const scopedSolutionAnswer = (build, language = 'en') => answerWasionQuestion({
  ...config, language, question: '有哪些降低线损的AMI方案？',
  fetchImpl: async (_url, options) => {
    const sources = JSON.parse(JSON.parse(options.body).messages[1].content).officialSources;
    const cite = id => {
      const source = sources.find(source => source.id === id);
      assert.ok(source, `Regression source must be in the actual retrieval context: ${id}`);
      return `[${source.citation}]`;
    };
    return modelResponse(build(cite));
  }
});
const solutionIds = {
  loss: 'energy-loss-reduction-solutions', cell: 'cellular-based-ami-solutions',
  prepay: 'prepayment-solutions', wisun: 'wisun-solutions'
};

test('captured corpus provides 122 official sources including every model with stable internal citation links', () => {
  assert.equal(WASION_SOURCES.length,122);
  assert.equal(PRODUCTS.length,86);
  const modelIds=new Set(PRODUCTS.map(product=>product.slug));
  assert.equal(WASION_SOURCES.filter(source=>source.category==='Products'&&modelIds.has(source.id)).length,86);
  for(const product of PRODUCTS)assert.equal(WASION_SOURCES.find(source=>source.id===product.slug)?.url,product.url,product.title);
  assert.equal(new Set(WASION_SOURCES.map(source => source.id)).size, WASION_SOURCES.length);
  for (const source of WASION_SOURCES) {
    assert.equal(new URL(source.url).hostname, 'en.wasion.com');
    assert.equal(source.href, `/demo/wasion/${source.id}`);
    assert.ok(source.title && source.category);
    assert.ok(source.images.every(url => new URL(url).hostname === 'en.wasion.com'));
  }
});

test('exact model queries rank specific product pages and retrieve real technical values', () => {
  const meter = retrieveWasionSources('What is the aMeter300 CTVT?').results[0];
  assert.equal(meter.id, 'ameter300-ctvt-three-phase-smart-energy-meter');
  assert.match(meter.excerpt, /Three Phase Smart Energy Meter/);
  assert.match(meter.summary, /WAN communication/);
  assert.ok(meter.images[0].includes('/uploads/'));
  assert.ok(!meter.summary.includes('Standard event log'));
  const gateway = retrieveWasionSources('WFCT-960 supply voltage and ingress protection').results[0];
  assert.equal(gateway.id, 'wfct-960-wisun-gateway');
  assert.match(gateway.excerpt, /DC 12 V/);
  assert.match(gateway.excerpt, /IP65/);
  assert.equal(retrieveWasionSources('aMeter99999').resultCount, 0);
  assert.equal(retrieveWasionSources('aMeter300 and IEC99999').resultCount, 0);
});

test('short product excerpts retain complete communication rows and their protocols', () => {
  const source = WASION_SOURCES.find(page => page.id === 'i-110-series-smart-water-meter');
  const retrieval = retrieveWasionSources('What communication options does I110 support?', { limit: 64 });
  assert.equal(retrieval.resultCount, 1);
  assert.equal(retrieval.results[0].excerpt, source.passages.join('\n'));
  for (const fact of ['LoRaWAN', 'Wired M-BUS/RS485', 'Wireless M-BUS (EN13757.4)', 'EN13757.3, DLMS/COSEM,MODBUS-RTU']) {
    assert.ok(retrieval.results[0].excerpt.includes(fact), `Missing communication evidence: ${fact}`);
  }
});

test('new captured DTECH source has a stable route and supports AMI 2.0 discovery', () => {
  const legacyIds=new Set([...corpus.pages.map(page=>page.slug),'dtech-2026']);
  assert.equal(corpus.pages.length,64);
  assert.equal(WASION_SOURCES.filter(source=>legacyIds.has(source.id)).length,65,'original page and DTECH source subset remains intact');
  assert.equal(WASION_SOURCES.filter(source=>!legacyIds.has(source.id)).length,57,'previously uncaptured official model sources are now searchable');
  const source = WASION_SOURCES.find(page => page.id === 'dtech-2026');
  assert.equal(source.href, '/demo/wasion/dtech-2026');
  assert.equal(source.url, 'https://en.wasion.com/news/120.html');
  const found = retrieveWasionSources('DTECH Aventa AMI 2.0');
  assert.equal(found.results[0].id, source.id);
  assert.match(found.results[0].excerpt, /Aventa/);
  assert.match(found.results[0].excerpt, /AMI 2\.0/);
});

test('new official models resolve once in backend retrieval, client ranking and the canonical search result before AI', () => {
  for(const [query,id]of [['DDSD101-J6','product-ddsd101-j6'],['DTSD341','product-dtsd341-three-phase-energy-meter'],['DDS102','product-dds102-single-phase-energy-meter'],['DTSY341','product-dtsy341-three-phase-smart-prepayment-meter']]){
    const retrieval=retrieveWasionSources(query);
    assert.equal(retrieval.resultCount,1,query);
    assert.deepEqual(retrieval.results.map(source=>source.id),[id]);
    assert.deepEqual(rankSearchPages(WASION_SOURCES,query).map(source=>source.id),[id]);
    const html=wasionDemoPage('model-source-test',{slug:'search',query});
    assert.ok(html.includes('href="/demo/wasion/'+id+'"'),query+' real model destination');
    const embedded=JSON.parse(html.match(/const WASION_DATA=([\s\S]*?);const SEARCH_QUERY=/)[1]);
    assert.equal(embedded.length,122);
    assert.deepEqual(rankSearchPages(embedded,query).map(source=>source.id),[id]);
  }
});

test('application and communication searches prioritize their matching official solutions', () => {
  for (const [query, slug] of [
    ['Prepayment solutions', 'prepayment-solutions'], ['AMI Wi-SUN', 'wisun-solutions'],
    ['G3-PLC RF hybrid', 'wasion-g3-plc-rf-hybrid-solutions']
  ]) assert.equal(retrieveWasionSources(query).results[0].id, slug);
  const phases = retrieveWasionSources('three-phase smart meters').results.slice(0, 4);
  assert.ok(phases.length >= 3);
  assert.ok(phases.every(source => /three phase|poly.phase/i.test(source.excerpt)));
  assert.ok(retrieveWasionSources('有哪些三相智能电表？').results.length > 0);
});

test('auth allows only active CRM customers or designated internal preview roles', async () => {
  const check = viewer => authorizeWasionCustomer({ req: {}, auth: makeAuth(viewer), service });
  assert.ok(await check(identity));
  assert.ok(await check({ role: 'sales_manager', memberships: [{ companyId: wasionPreviewBinding.companyId, role: 'sales_manager' }] }));
  assert.ok(await check({ role: 'admin', memberships: [] }));
  for (const viewer of [null, { role: 'guest' }, {role:'customer',memberships:[{companyId:'other-company',role:'customer'}]}, {role:'sales_manager',memberships:[{companyId:'other-company',role:'sales_manager'}]}, { role: 'customer', memberships: [] },
    { role: 'sales_manager', memberships: [{ role: 'sales_manager', active: false }] },
    { role: 'customer', memberships: [{ role: 'customer', active: false }] }
  ]) assert.equal(await check(viewer), null);
});

test('AI prompt defaults to English even for a Chinese question, and only supplied IDs become citations', async () => {
  let sent;
  const result = await answerWasionQuestion({ ...config, question: '有哪些三相智能电表？', fetchImpl: async (_url, options) => {
    sent = JSON.parse(options.body);
    const context = JSON.parse(sent.messages[1].content).officialSources;
    return modelResponse(`The page lists a three-phase meter. [${context[0].id}]`);
  } });
  assert.equal(result.status, 200);
  assert.equal(result.data.ai.generated, true);
  assert.equal(result.data.language, 'en');
  assert.match(sent.messages[0].content, /Answer in English/);
  assert.equal(result.data.sources.length, 1);
  assert.ok(result.data.results.length >= result.data.sources.length);
  assert.ok(JSON.parse(sent.messages[1].content).officialSources.every(source => WASION_SOURCES.some(official => official.id === source.id)));
  let zhPrompt;
  const zh = await answerWasionQuestion({ ...config, question: 'Wi-SUN', language: 'zh', fetchImpl: async (_url, options) => {
    zhPrompt = JSON.parse(options.body).messages[0].content;
    return modelResponse('官网提供 Wi-SUN RF Mesh 方案。[wisun-solutions]');
  } });
  assert.match(zhPrompt, /Answer in Chinese/);
  assert.equal(zh.data.language, 'zh');
  assert.equal(zh.data.ai.generated, true);
});

test('short citation codes resolve only to the supplied source and return canonical IDs', async () => {
  let context, prompt;
  const result = await answerWasionQuestion({ ...config, question: 'AMI', fetchImpl: async (_url, options) => {
    const sent = JSON.parse(options.body); prompt = sent.messages[0].content;
    context = JSON.parse(sent.messages[1].content).officialSources;
    return modelResponse('The official pages describe utility AMI applications. [s1] A related page offers further information. [ s2 ]');
  } });
  assert.equal(result.data.ai.generated, true);
  assert.match(prompt, /short citation code/);
  assert.deepEqual(context.map(source => source.citation), ['s1', 's2', 's3', 's4', 's5', 's6']);
  assert.ok(result.data.answer.includes(`[${context[0].id}]`));
  assert.ok(result.data.answer.includes(`[${context[1].id}]`));
  assert.ok(!result.data.answer.includes('[s1]'));
  assert.deepEqual(result.data.sources.map(source => source.id), context.slice(0, 2).map(source => source.id));
  for (const citation of ['s7', 's0', '1', 'source-1', 'invented-page']) {
    const rejected = await answerWasionQuestion({ ...config, question: 'I110', fetchImpl: async () => modelResponse(`A claim. [${citation}]`) });
    assert.equal(rejected.data.ai.generated, false);
    assert.equal(rejected.data.ai.reason, 'invalid_citations');
  }
  for (const answer of ['Claim [s1](https://evil.example/)', 'Claim [s1] (javascript:alert(1))', 'Claim https://evil.example/ [s1]']) {
    const rejected = await answerWasionQuestion({ ...config, question: 'I110', fetchImpl: async () => modelResponse(answer) });
    assert.equal(rejected.data.ai.generated, false);
    assert.equal(rejected.data.ai.reason, 'invalid_citations');
  }
});

test('automatic mode follows question language while enforcing model-specific evidence', async () => {
  let prompt, sentSource;
  const result = await answerWasionQuestion({ ...config, question: '¿Qué comunicaciones admite I110?', language: 'auto', fetchImpl: async (_url, options) => {
    const sent = JSON.parse(options.body); prompt = sent.messages[0].content;
    sentSource = JSON.parse(sent.messages[1].content).officialSources[0];
    return modelResponse('La página oficial incluye LoRaWAN y M-BUS. [s1]', true, 'es');
  } });
  assert.equal(result.status, 200);
  assert.equal(result.data.ai.generated, true);
  assert.equal(result.data.language, 'es');
  assert.ok(result.data.answer.includes('[i-110-series-smart-water-meter]'));
  assert.match(prompt, /Detect the question's natural language and answer in that same language/);
  assert.match(prompt, /company logo is not evidence/);
  assert.match(prompt, /exact model\/configuration/);
  assert.match(sentSource.excerpt, /LoRaWAN/);
  const fallback = await answerWasionQuestion({ env: {}, question: 'I110 有哪些通信方式？', language: 'auto' });
  assert.equal(fallback.status, 200);
  assert.equal(fallback.data.language, 'zh');
  assert.equal(fallback.data.ai.generated, false);
});

test('source scope prompt requires per-solution capability evidence without dropping certification and option boundaries', async () => {
  let prompt;
  await answerWasionQuestion({ ...config, question: 'AMI', fetchImpl: async (_url, options) => {
    prompt = JSON.parse(options.body).messages[0].content;
    return modelForContext(_url, options);
  } });
  assert.match(prompt, /each capability to the specific solution/);
  assert.match(prompt, /every solution covered by the claim/);
  assert.match(prompt, /partial\/full implementation and customization/);
  assert.match(prompt, /exact model\/configuration/);
  assert.match(prompt, /Preserve optional\/configuration qualifiers/);
});

test('captured Chinese cross-solution generalization is rejected against its real four sources', async () => {
  const result = await scopedSolutionAnswer(cite => '降低线损的AMI方案包括：基于智能电表的数据采集和主站复杂处理的能量损耗减少解决方案，能够定位和分类多种技术性和非技术性损耗，包括电表篡改和未授权操作；基于蜂窝网络的AMI方案，提供高速、安全、全球覆盖的通信，便于快速连接智能电表；Wi-SUN RF Mesh方案，适用于AMI和物联网，具备高通信稳定性和大范围覆盖；以及集成预付费解决方案，结合智能电表和通信技术，实现自动测量和管理能源数据。这些方案均可根据客户需求定制，支持部分或全系统实施，提升线损检测和管理能力，带来明显的经济效益和安全保障' + [solutionIds.loss, solutionIds.cell, solutionIds.prepay, solutionIds.wisun].map(cite).join('') + '。', 'zh');
  assert.equal(result.data.ai.generated, false);
  assert.equal(result.data.ai.status, 'invalid_response');
  assert.equal(result.data.ai.reason, 'unsupported_source_scope');
  assert.match(result.data.answer, /可靠来源/);
  assert.ok(result.data.results.some(source => source.id === solutionIds.loss));
  assert.ok(result.data.sources.every(source => source.excerpt));
  assert.ok(!result.data.answer.includes('这些方案均可'));
});

test('partial/full implementation and customization need support in every cited source', async () => {
  const cases = [
    cite => `All these solutions support partial or full implementation. ${cite(solutionIds.loss)}${cite(solutionIds.wisun)}`,
    cite => `Both solutions can be customized to each client's requirements. ${cite(solutionIds.loss)}${cite(solutionIds.cell)}`,
    cite => `Wi-SUN supports full deployment. ${cite(solutionIds.wisun)}`,
    cite => `Cellular-based AMI can be implemented in part or in full. ${cite(solutionIds.cell)}`,
    cite => `Prepayment can be customised to client requirements. ${cite(solutionIds.prepay)}`,
    cite => `这些方案均可定制。${cite(solutionIds.loss)}${cite(solutionIds.prepay)}`,
    cite => `Wi-SUN方案支持部分或全系统实施。${cite(solutionIds.wisun)}`
  ];
  for (const build of cases) {
    const result = await scopedSolutionAnswer(build);
    assert.equal(result.data.ai.generated, false, build(id => `[${id}]`));
    assert.equal(result.data.ai.reason, 'unsupported_source_scope');
  }
});

test('a single supporting citation cannot hide a blanket capability for other discussed solutions', async () => {
  for (const blanket of [
    'All of these solutions support partial or full implementation.',
    'All can be customized to client requirements.',
    'They can be customized to client requirements.',
    'The other solutions can be tailored to client requirements.',
    'These solutions all support full deployment.',
    '这些方案均支持部分或全系统实施。',
    '两者均可定制。',
    '上述方案都可定制。'
  ]) {
    const result = await scopedSolutionAnswer(cite => `Cellular AMI offers global coverage ${cite(solutionIds.cell)}. Wi-SUN is an RF mesh solution ${cite(solutionIds.wisun)}. ${blanket} ${cite(solutionIds.loss)}`);
    assert.equal(result.data.ai.generated, false, blanket);
    assert.equal(result.data.ai.reason, 'unsupported_source_scope');
  }
});

test('an uncertainty disclaimer or prior citation cannot excuse a later unsupported positive capability', async () => {
  for (const build of [
    cite => `Cannot confirm customization for Cellular, but these solutions can be customized ${cite(solutionIds.cell)}${cite(solutionIds.loss)}.`,
    cite => `Cannot confirm customization for Cellular but these solutions can be customized ${cite(solutionIds.cell)}${cite(solutionIds.loss)}.`,
    cite => `未确认定制能力，但这些方案均可定制${cite(solutionIds.cell)}${cite(solutionIds.loss)}。`,
    cite => `Cellular AMI offers global coverage ${cite(solutionIds.cell)}. These solutions support partial or full implementation.`
  ]) {
    const result = await scopedSolutionAnswer(build);
    assert.equal(result.data.ai.generated, false);
    assert.equal(result.data.ai.reason, 'unsupported_source_scope');
  }
});

test('one solution keeps its actual partial/full and custom capabilities', async () => {
  for (const build of [
    cite => `Energy Loss Reduction offers partial or full implementation and can be customized to each client's requirements ${cite(solutionIds.loss)}.`,
    cite => `Energy Loss Reduction can be implemented in part or in full ${cite(solutionIds.loss)}.`,
    cite => `线损治理方案可根据客户需求定制，提供部分或全系统实施选项${cite(solutionIds.loss)}。`
  ]) {
    const result = await scopedSolutionAnswer(build);
    assert.equal(result.data.ai.generated, true, result.data.ai.reason);
    assert.deepEqual(result.data.sources.map(source => source.id), [solutionIds.loss]);
  }
});

test('multiple solutions retain separately attributed capabilities and genuinely shared customization', async () => {
  for (const build of [
    cite => `Energy Loss Reduction offers partial or full implementation ${cite(solutionIds.loss)}; Wi-SUN is customized to client requirements ${cite(solutionIds.wisun)}; Cellular AMI offers global coverage ${cite(solutionIds.cell)}.`,
    cite => `线损治理方案支持部分或全系统实施${cite(solutionIds.loss)}，Wi-SUN方案可定制${cite(solutionIds.wisun)}，预付费方案自动管理能源数据${cite(solutionIds.prepay)}。`,
    cite => `Both solutions can be customized to client requirements ${cite(solutionIds.loss)}${cite(solutionIds.wisun)}.`,
    cite => `这两种方案均可定制${cite(solutionIds.loss)}${cite(solutionIds.wisun)}。`,
    cite => `Cellular AMI offers global coverage ${cite(solutionIds.cell)}. Energy Loss Reduction can be customized to client requirements ${cite(solutionIds.loss)}.`,
    cite => `Cannot confirm customization or partial/full implementation for Cellular from this excerpt ${cite(solutionIds.cell)}. Energy Loss Reduction offers partial or full implementation ${cite(solutionIds.loss)}.`,
    cite => `无法确认蜂窝方案支持定制或部分实施${cite(solutionIds.cell)}。线损治理方案可定制${cite(solutionIds.loss)}。`
  ]) {
    const result = await scopedSolutionAnswer(build);
    assert.equal(result.data.ai.generated, true, `${build(id => `[${id}]`)} => ${result.data.ai.reason}`);
    assert.ok(result.data.sources.length >= 2);
  }
});

test('retrieval remains available without an AI key or when inference fails', async () => {
  for (const [extra, reason] of [
    [{ env: {} }, 'not_configured'],
    [{ fetchImpl: async () => { throw new Error('gateway down'); } }, 'gateway_unavailable']
  ]) {
    let modelCalls = 0;
    const provider = extra.fetchImpl || modelForContext;
    const result = await answerWasionQuestion({ ...config, ...extra, question: 'Prepayment solutions', fetchImpl: async (...args) => { modelCalls++; return provider(...args); } });
    assert.equal(result.status, 200);
    assert.equal(result.data.ai.generated, false);
    assert.equal(result.data.ai.status, 'unavailable');
    assert.equal(result.data.ai.reason, reason);
    assert.equal(modelCalls, reason === 'not_configured' ? 0 : 1);
    assert.ok(result.data.results.length > 0);
    assert.equal(result.data.results[0].id, 'prepayment-solutions');
    assert.ok(result.data.sources[0].excerpt);
    assert.match(result.data.answer, /AI|official/i);
  }
});

test('no matching source avoids inference, and an unsupported model answer falls back honestly', async () => {
  let calls = 0;
  const absent = await answerWasionQuestion({ ...config, question: 'banana telescope universe', fetchImpl: async () => { calls++; } });
  assert.equal(calls, 0);
  assert.equal(absent.data.ai.status, 'no_match');
  assert.deepEqual(absent.data.results, []);
  const unsupported = await answerWasionQuestion({ ...config, question: 'aMeter300 pricing', fetchImpl: async () => modelResponse('Not provided.', false) });
  assert.equal(unsupported.data.ai.generated, false);
  assert.equal(unsupported.data.ai.reason, 'sources_do_not_answer');
  assert.ok(unsupported.data.results.length > 0);
});

test('invented, missing or out-of-context citations never disclose model output', async () => {
  for (const text of ['Claim [invented-page]', 'An uncited claim.', 'Claim [wisun-solutions]', 'Claim [prepayment-solutions](https://evil.example/)']) {
    const result = await answerWasionQuestion({ ...config, question: 'WFCT-960', fetchImpl: async () => modelResponse(text) });
    assert.equal(result.data.ai.generated, false);
    assert.equal(result.data.ai.status, 'invalid_response');
    assert.ok(!result.data.answer.includes(text));
    assert.equal(result.data.results[0].id, 'wfct-960-wisun-gateway');
  }
});

test('invalid questions and unsupported language are rejected before inference', async () => {
  let calls = 0;
  for (const question of ['', '  ', null, 42, 'x'.repeat(501), 'smart\u0000meter']) {
    const result = await answerWasionQuestion({ ...config, question, fetchImpl: async () => { calls++; } });
    assert.equal(result.status, 400);
  }
  assert.equal((await answerWasionQuestion({ ...config, question: 'smart meter', language: 'fr', fetchImpl: async () => { calls++; } })).status, 400);
  assert.equal(calls, 0);
});

test('handler rejects missing auth, unapproved origins and missing CRM request marker before inference', async () => {
  let modelCalled = false;
  for (const [auth, headers, status] of [
    [makeAuth(null), {}, 404], [makeAuth(identity), { origin: 'https://evil.example' }, 403],
    [makeAuth(identity), { origin: undefined }, 403], [makeAuth(identity), { 'x-cnps-crm': undefined }, 403]
  ]) {
    const res = response();
    await createWasionSearchHandler({ service, env: config.env, auth, fetchImpl: async () => { modelCalled = true; } })(request(undefined, headers), res);
    assert.equal(res.statusCode, status);
    assert.match(res.headers['Cache-Control'], /no-store/);
    assert.match(res.headers['X-Robots-Tag'], /noindex/);
    assert.equal(res.headers['X-Frame-Options'], 'DENY');
  }
  assert.equal(modelCalled, false);
});

test('handler rechecks revocation and principal identity before disclosing generated or fallback results', async () => {
  for (const mode of ['revoked', 'identity_changed', 'lookup_failed', 'fallback_revoked']) {
    let reads = 0, called = false;
    const auth = { loadSession: async () => {
      reads++;
      if (reads === 1) return principal;
      if (mode === 'lookup_failed') throw new Error('auth down');
      return mode === 'identity_changed' ? { ...principal, identityId: 'other-subject' } : null;
    } };
    const res = response();
    await createWasionSearchHandler({ service, env: mode === 'fallback_revoked' ? {} : config.env, auth,
      fetchImpl: async (...args) => { called = true; return modelForContext(...args); }
    })(request(), res);
    assert.equal(reads, 2);
    assert.equal(called, mode !== 'fallback_revoked');
    assert.equal(res.statusCode, mode === 'lookup_failed' ? 503 : 404);
    assert.ok(!JSON.parse(res.body).data);
  }
});

test('handler accepts the canonical CRM origin and returns fallback results with a rechecked grant', async () => {
  let reads = 0;
  const res = response();
  await createWasionSearchHandler({ service, env: { VERCEL_URL: 'wasion-preview.vercel.app' }, auth: { loadSession: async () => { reads++; return principal; } } })(request({ question: 'Wi-SUN', language: 'en' }, { origin: 'https://crm.cnps.ai' }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(reads, 2);
  const { data } = JSON.parse(res.body);
  assert.equal(data.ai.generated, false);
  assert.equal(data.results[0].id, 'wisun-solutions');
});

test('handler rejects malformed or oversized bodies, including an oversized request stream', async () => {
  const handler = createWasionSearchHandler({ service, env: {}, auth: makeAuth(identity) });
  for (const body of ['{bad', [], { question: 'smart meter', extra: 'x'.repeat(2100) }]) {
    const res = response(); await handler(request(body), res); assert.equal(res.statusCode, 400);
  }
  const req = new EventEmitter(); Object.assign(req, { method: 'POST', headers: request().headers });
  const res = response(), pending = handler(req, res);
  await new Promise(resolve => setImmediate(resolve));
  req.emit('data', 'x'.repeat(2500)); req.emit('end');
  await pending;
  assert.equal(res.statusCode, 400);
});

test('authenticated searches continue beyond the former 200-call allowance without a Redis configuration', async () => {
  let providerCalls = 0, sessionReads = 0, projectReads = 0;
  const handler = createWasionSearchHandler({
    env: config.env,
    auth: { loadSession: async () => { sessionReads++; return principal; } },
    service: { getProject: async (...args) => { projectReads++; return service.getProject(...args); } },
    fetchImpl: async (...args) => { providerCalls++; return modelForContext(...args); }
  });
  // Local, deterministic provider responses only. This crosses both previous
  // 20/200 boundaries while keeping the same authenticated identity throughout.
  for (let attempt = 1; attempt <= 205; attempt++) {
    const res = response(); await handler(request({ question: 'AMI meters', language: 'en' }), res);
    assert.equal(res.statusCode, 200, 'attempt ' + attempt);
    const { data } = JSON.parse(res.body);
    assert.equal(data.ai.generated, true, 'attempt ' + attempt);
    assert.ok(data.sources.length > 0);
    assert.ok(data.sources.every(source => WASION_SOURCES.some(official => official.id === source.id && official.url === source.url)));
    assert.ok(data.sources.every(source => data.answer.includes('[' + source.id + ']')));
  }
  assert.equal(providerCalls, 205);
  assert.equal(sessionReads, 410); assert.equal(projectReads, 410);
});

test('demo search does not read legacy quota storage bindings while generating an officially cited answer', async () => {
  const searchEnv = { CRM_AI_API_KEY: 'test-key' };
  for (const name of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN']) {
    Object.defineProperty(searchEnv, name, { get() { throw new Error('Demo AI search must not read quota storage bindings.'); } });
  }
  let providerCalls = 0;
  const res = response();
  await createWasionSearchHandler({
    service, env: searchEnv, auth: makeAuth(identity),
    fetchImpl: async (...args) => { providerCalls++; return modelForContext(...args); }
  })(request({ question: 'I110 communication', language: 'en' }), res);
  assert.equal(res.statusCode, 200); assert.equal(providerCalls, 1);
  const { data } = JSON.parse(res.body);
  assert.equal(data.ai.generated, true);
  const official = WASION_SOURCES.find(source => source.id === 'i-110-series-smart-water-meter');
  assert.equal(data.sources[0].url, official.url);
  assert.ok(data.answer.includes('[' + data.sources[0].id + ']'));
});
