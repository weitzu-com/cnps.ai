import corpus from './wasion-demo-content.json' with { type: 'json' };
import { PRODUCTS } from './wasion-requirements/data.mjs';
import { DTECH } from './wasion-experience/content-data.mjs';

// Public pages captured from the official English site. Stable page slugs are
// also the only citation identifiers the AI may use.
const clean = value => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
const textLeaves = value => Array.isArray(value) ? value.flatMap(textLeaves)
  : value && typeof value === 'object' ? Object.values(value).flatMap(textLeaves)
    : typeof value === 'string' ? [clean(value)].filter(Boolean) : [];
const unique = values => [...new Set(values.filter(Boolean))];
const isOfficial = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'en.wasion.com'; }
  catch { return false; }
};
const isContent = text => text && !/^(?:subscribe|read more|learn more|make it your own|download|features?|specifications?|technical parameters?)$/i.test(text);
const normalize = text => clean(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[‐‑–—-]/g, ' ').replace(/[^a-z0-9\p{Script=Han}]+/gu, ' ').trim();
const compact = text => normalize(text).replace(/\s/g, '');

export const WASION_SOURCES = [...(corpus.pages || []).filter(page => page.slug !== DTECH.slug), DTECH,...PRODUCTS.filter(p=>!(corpus.pages||[]).some(old=>old.slug===p.slug))].filter(page => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug || '') && isOfficial(page.url || page.sourceUrl)).map(page => {
  const tableValues = new Set(textLeaves(page.tables));
  const paragraphs = unique(textLeaves(page.paragraphs)).filter(text => isContent(text) && !tableValues.has(text));
  const features = unique(textLeaves(page.features)).filter(isContent);
  const rows = (Array.isArray(page.tables) ? page.tables : []).flatMap(table => Array.isArray(table) ? table.map(row => textLeaves(row).join(': ')) : textLeaves(table)).filter(isContent);
  const resourceTitles = (Array.isArray(page.resourceItems) ? page.resourceItems : []).map(item => clean(item?.title)).filter(Boolean);
  const downloads = (Array.isArray(page.downloads) ? page.downloads : []).filter(item => isOfficial(item?.url)).map(item => ({ title: clean(item.title), url: item.url }));
  const passages = unique([...paragraphs, ...features, ...rows, ...resourceTitles]);
  const descriptor = clean(page.subtitle) || paragraphs.find(text => text.toLowerCase() !== clean(page.title).toLowerCase()) || '';
  // A product's short descriptor and an actual feature are more useful than a
  // crawler summary that might start at an arbitrary event-log table row.
  const summary = descriptor.length >= 55 ? descriptor
    : unique([descriptor, features.find(text => text.length > 35)]).join(' · ')
      || clean(page.summary) || clean(page.title);
  const images = unique(textLeaves(page.images).filter(isOfficial)).filter(url => !/x-pro-info\d|(?:icon|logo)\./i.test(url)).sort((a, b) => Number(b.includes('/uploads/')) - Number(a.includes('/uploads/')));
  return {
    id: page.slug, slug: page.slug, title: clean(page.title), category: clean(page.category || page.group),
    url: page.url || page.sourceUrl, href: `/demo/wasion/${page.slug}`,
    summary: summary.slice(0, 340), images: images.slice(0, 4), image: images[0] || null, downloads,
    excerpt: passages.join('\n').slice(0, 7000), passages, descriptor,
    searchText: [page.title, ...passages].join(' ')
  };
});

const stopWords = new Set('a an and are as at be by can could do does for from has have how i in into is it me of on or our please tell that the their this to us use was what when where which who with would you your about find show need want suitable support supports product products solution solutions meter meters metering wasion'.split(' '));
const concepts = [
  { terms: ['three phase', 'threephase', 'poly phase', 'polyphase', '三相'], keys: ['three phase', 'poly phase'], boost: 40 },
  { terms: ['single phase', 'singlephase', '单相'], keys: ['single phase'], boost: 40 },
  { terms: ['smart meter', 'smart meters', 'electricity meter', 'electricity meters', 'electric meter', '电表', '智能电表'], keys: ['electricity meters', 'smart meter', 'energy meter'], boost: 45 },
  { terms: ['prepayment', 'prepaid', 'pay as you go', '预付费', '预付'], keys: ['prepayment', 'prepaid'], boost: 45 },
  { terms: ['ami', 'advanced metering infrastructure', '智能抄表', '高级计量'], keys: ['ami', 'advanced metering'], boost: 35 },
  { terms: ['wi sun', 'wisun'], keys: ['wi sun', 'wisun'], boost: 55 },
  { terms: ['g3 plc', 'g3plc', 'g3 plc rf', 'g3'], keys: ['g3 plc', 'g3plc'], boost: 55 },
  { terms: ['water', '水表'], keys: ['water'], boost: 40 },
  { terms: ['gas', '燃气', '气表'], keys: ['gas'], boost: 40 },
  { terms: ['communication', 'communications', 'telecommunications', '通信', '通讯'], keys: ['communication', 'telecommunication'], boost: 25 },
  { terms: ['company', 'about wasion', '威胜', '公司', '成立', '研发'], keys: ['about wasion', 'company', 'establishment', 'r d'], boost: 35 },
  { terms: ['energy pro', 'meter to cash', '营收'], keys: ['energy pro', 'meter to cash'], boost: 55 }
];

function queryDetails(question) {
  const normalized = normalize(question);
  const active = concepts.filter(concept => concept.terms.some(term => (` ${normalized} `).includes(` ${normalize(term)} `) || normalized.includes(term) && /\p{Script=Han}/u.test(term)));
  const tokens = unique(normalized.split(' ').filter(term => term.length > 1 && !stopWords.has(term)));
  const models = unique((question.toLowerCase().match(/\b[a-z]{1,12}[ -]?\d{2,6}[a-z\d-]*\b/g) || []).map(compact));
  return { normalized, active, tokens, models };
}

const containsTerm = (text, term) => (` ${text} `).includes(` ${term} `) || /\p{Script=Han}/u.test(term) && text.includes(term);

function scoreSource(source, query, frequencies) {
  const title = normalize(`${source.title} ${source.descriptor}`), body = normalize(source.searchText);
  const titleCompact = compact(source.title), bodyCompact = compact(source.searchText);
  // A requested model or standard must actually occur in the captured page.
  if (query.models.length && !query.models.some(model => bodyCompact.includes(model))) return 0;
  let score = 0;
  for (const model of query.models) {
    if (titleCompact === model) score += 260;
    else if (titleCompact.includes(model)) score += 190;
    else if (bodyCompact.includes(model)) score += 60;
  }
  if (query.models.length) score += query.tokens.filter(token => !query.models.includes(compact(token)) && containsTerm(normalize(source.title), token)).length * 90;
  for (const token of query.tokens) {
    const weight = Math.log(1 + WASION_SOURCES.length / (frequencies.get(token) || 1));
    if (containsTerm(title, token)) score += 14 * weight;
    else if (containsTerm(body, token)) score += 3 * weight;
  }
  for (const concept of query.active) {
    if (concept.keys.some(key => title.includes(key))) score += concept.boost;
    else if (concept.keys.some(key => body.includes(key))) score += concept.boost / 3;
  }
  if (score > 0 && !query.models.length && query.active.length && source.category === 'Solutions') score += 5;
  if (query.normalized.length > 3 && title === query.normalized) score += 140;
  return score;
}

function relevantExcerpt(source, query) {
  // Short product pages must retain complete tables: an optional protocol may
  // sit on the row after its heading and contain none of the question's words.
  const complete = source.passages.join('\n');
  if (complete.length <= 4200) return complete || source.summary;
  const ranked = source.passages.map((text, index) => {
    const normalized = normalize(text);
    let score = query.tokens.filter(token => containsTerm(normalized, token)).length * 3;
    score += query.active.filter(concept => concept.keys.some(key => normalized.includes(key))).length * 5;
    score += query.models.filter(model => compact(text).includes(model)).length * 15;
    return { text, index, score };
  }).sort((a, b) => b.score - a.score || a.index - b.index);
  // Preserve a little neighbouring context for long source rows, without
  // allowing an unrelated long article to consume the inference context.
  const selected = new Set();
  let size = 0;
  for (const item of ranked) {
    if (item.score <= 0 && selected.size) continue;
    for (const index of [item.index, item.index + 1, item.index - 1]) {
      if (index < 0 || index >= source.passages.length || selected.has(index)) continue;
      const length = source.passages[index].length + 1;
      if (size + length > 4200) continue;
      selected.add(index); size += length;
    }
    if (size >= 4000) break;
  }
  return [...selected].sort((a, b) => a - b).map(index => source.passages[index]).join('\n').slice(0, 4200) || complete.slice(0, 4200) || source.summary;
}

// Retained designs keep their existing source ordering and browser fallback.
function retrieveLegacyWasionSources(question, { limit = 12 } = {}) {
  const query = queryDetails(question);
  if (query.models.some(model => !WASION_SOURCES.some(source => compact(source.searchText).includes(model)))) return { resultCount: 0, results: [] };
  const frequencies = new Map(query.tokens.map(token => [token, WASION_SOURCES.filter(source => containsTerm(normalize(source.searchText), token)).length]));
  const matches = WASION_SOURCES.map(source => ({ source, score: scoreSource(source, query, frequencies) }))
    .filter(match => match.score >= 6).sort((a, b) => b.score - a.score || a.source.id.localeCompare(b.source.id));
  return {
    resultCount: matches.length,
    results: matches.slice(0, limit).map(({ source, score }) => ({
      id: source.id, slug: source.slug, title: source.title, category: source.category,
      url: source.url, href: source.href, summary: source.summary, images: source.images,
      image: source.image, downloads: source.downloads, excerpt: relevantExcerpt(source, query), score: Math.round(score * 10) / 10
    }))
  };
}

// This self-contained ranker is also embedded in the requirements browser
// fallback. Its translations describe search intent, never product facts.
export function rankRequirementsSearchPages(pages, question) {
  const normal = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[‐‑–—-]/g, ' ').replace(/([a-z0-9])([\p{Script=Han}])/gu, '$1 $2').replace(/([\p{Script=Han}])([a-z0-9])/gu, '$1 $2').replace(/[^a-z0-9\p{Script=Han}]+/gu, ' ').trim().replace(/\s+/g, ' ');
  const compact = value => normal(value).replace(/\s/g, '');
  const modelTokens = value => [...String(value || '').toLowerCase().matchAll(/\b[a-z]{1,12}[ -]?\d{2,6}[a-z\d]*(?:[-/.][a-z\d]+)*\b/g)].map(match => compact(match[0]));
  const terms = (text, value) => (' ' + text + ' ').includes(' ' + normal(value) + ' ');
  const groups = [
    { words: ['three phase','threephase','poly phase','polyphase','三相'], keys: ['three phase','poly phase'], boost: 40 },
    { words: ['single phase','singlephase','单相'], keys: ['single phase'], boost: 40 },
    { words: ['electricity meter','electricity meters','electric meter','smart meter','smart meters','电表','智能电表'], keys: ['electricity meters','smart meter','energy meter'], boost: 45 },
    { words: ['prepaid','prepayment','pay as you go','预付费','预付'], keys: ['prepayment','prepaid'], boost: 45 },
    { words: ['ami','advanced metering infrastructure','智能抄表','高级计量'], keys: ['ami','advanced metering'], boost: 35 },
    { words: ['wi sun','wisun'], keys: ['wi sun','wisun'], boost: 55 },
    { words: ['g3 plc','g3plc','g3'], keys: ['g3 plc','g3plc'], boost: 55 },
    { words: ['water','水表','水计量'], keys: ['water'], boost: 40 },
    { words: ['gas','燃气','气表'], keys: ['gas'], boost: 40 },
    { words: ['communication','communications','telecommunications','通信','通讯'], keys: ['communication','telecommunication'], boost: 25 },
    { words: ['energy loss','line loss','loss reduction','线损','降损','窃电'], keys: ['energy loss','loss reduction'], boost: 150 },
    { words: ['energy pro','meter to cash','营收','营收保证','收入保证'], keys: ['energy pro','meter to cash'], boost: 65 },
    { words: ['company','about wasion','公司','成立','研发'], keys: ['about wasion','company','establishment','r d'], boost: 35 }
  ];
  const query = normal(question);
  if (!query) return [];
  const active = groups.filter(group => group.words.some(word => /\p{Script=Han}/u.test(word) ? query.includes(word) : terms(query, word)));
  const stop = new Set('a an and are as at be by can could do does for from has have how i in into is it me of on or our please tell that the their this to us use was what when where which who with would you your about find show need want suitable support supports product products solution solutions meter meters metering wasion options available published sources cover'.split(' '));
  const tokens = [...new Set(query.split(' ').filter(token => token.length > 1 && !stop.has(token) && !/\p{Script=Han}/u.test(token)))];
  const requested = [...new Set(modelTokens(question))];
  const sourceText = source => [source.title, source.text, source.searchText, source.excerpt, source.summary].filter(Boolean).join(' ');
  const available = new Map(pages.map(source => [source.id, [...new Set(modelTokens(sourceText(source)))]]));
  if (requested.some(model => ![...available.values()].some(models => models.includes(model)))) return [];
  const resourceIntent = /\b(download|catalog(?:ue)?|datasheet|manual|documents?)\b|下载|目录|资料|规格书|手册/i.test(question);
  const solutionIntent = /\bsolutions?\b|方案/.test(query);
  const certificateIntent = /certif|\b(?:listed|listing|approved|approval|compliant|compliance|conforms?|conformity|conformant|recognized|recognised|accredited|rated)\b|认证|证书|资质|通过|符合|获证|列名|获批|合规/i.test(question);
  const requestedProtocols = tokens.filter(token => ['sts','lorawan','dlms','cosem'].includes(token));
  const categoryIds = new Set(['products','electricity-meters','telecommunications','system-software','water-gas-meters','intelligent-power-distribution','renewable-energy']);
  const namedProducts = pages.filter(source => source.category === 'Products' && !categoryIds.has(source.id) && normal(source.title).length >= 3 && terms(query, normal(source.title)));
  const longestName = Math.max(0, ...namedProducts.map(source => normal(source.title).length));
  const namedIds = new Set(namedProducts.filter(source => normal(source.title).length === longestName).map(source => source.id));
  const asksMeters = /\bmeters?\b|\bmetering\b|电表|电能表|水表|气表/.test(query);
  const asksStorage = /\b(?:energy storage|battery|batteries|bess)\b|储能|电池/.test(query);
  const uplinkIntent = /\bDL\s*\/\s*UL\b|\buplink\b|\bdata\s+rate\b/i.test(question);
  const certificateCodes = [...query.matchAll(/\b(ul|mid|ce|inmetro|iso|iec|ansi|sts|atex|ukca|csa|tuv|vde|enec)(?:\s*(\d{3,6}[a-z]?))?\b/g)].filter(match => certificateIntent || match[2] || !uplinkIntent && (asksMeters || asksStorage) && ['ul','mid','atex','ukca','csa','tuv','vde','enec'].includes(match[1])).map(match => ({code:match[1],number:match[2]||''}));
  const certificateSubjectTokens = tokens.filter(token => !/^(?:certif\w*|listed|listing|approved|approval|compliant|compliance|conforms?|conformity|conformant|recognized|recognised|accredited|rated|safety)$/.test(token));
  const certificateEvidence = (source, request) => {
    const passages = Array.isArray(source.passages) ? source.passages : String(source.excerpt || source.text || '').split('\n');
    return passages.some(passage => {
      // In modem specifications UL means uplink. Remove those rate labels
      // before looking for an actual UL standard or certification context.
      const cleaned = request.code === 'ul' ? String(passage).replace(/\bDL\s*\/\s*UL(?:\s*(?:ST|MT))?/gi,'').replace(/\/\s*UL\s*(?:ST|MT)\b/gi,'').replace(/\bUL\s+(?:data\s+)?rate\b/gi,'') : passage;
      const text = normal(cleaned);
      if (request.number) return new RegExp('\\b'+request.code+'\\s*'+request.number+'\\b','i').test(text);
      if (new RegExp('\\b'+request.code+'\\s*\\d{3,6}[a-z]?\\b','i').test(text)) return true;
      return new RegExp('\\b'+request.code+'\\b','i').test(text) && /certif|\blisted\b|\blisting\b|\bsafety\b|\bstandards?\b|\bcomply\b|\bconform|认证|证书|列名|安全/.test(text);
    });
  };
  const frequency = new Map(tokens.map(token => [token, pages.filter(source => terms(normal(sourceText(source)), token)).length]));
  return pages.filter(source => source.id !== 'home').map(source => {
    const title = normal(source.title), body = normal(sourceText(source)), models = available.get(source.id);
    if (requested.length && !requested.every(model => models.includes(model))) return { source, score: 0 };
    if (!requested.length && requestedProtocols.some(protocol => !terms(body, protocol))) return { source, score: 0 };
    const titleModels = modelTokens(source.title);
    const specificProduct = source.category === 'Products' && (namedIds.has(source.id) || requested.some(model => !/^(?:ul|iec|iso|ansi|en|din)\d/.test(model) && titleModels.includes(model)));
    if (certificateIntent && !specificProduct && !certificateCodes.length && certificateSubjectTokens.length && !certificateSubjectTokens.some(token => terms(body, token))) return { source, score: 0 };
    if (certificateCodes.length && !specificProduct) {
      if (certificateCodes.some(request => !certificateEvidence(source, request))) return { source, score: 0 };
      const productScope = normal([source.title,source.descriptor,source.summary].filter(Boolean).join(' '));
      if (asksMeters && !/\bmeter(?:s|ing)?\b|电表|电能表|水表|气表/.test(productScope)) return { source, score: 0 };
      if (asksStorage && !/\b(?:storage|battery|batteries|bess)\b/.test(body)) return { source, score: 0 };
    }
    let score = requested.reduce((sum, model) => sum + (titleModels.includes(model) ? 260 : 60), 0);
    for (const token of tokens) {
      const weight = Math.log(1 + pages.length / Math.max(1, frequency.get(token)));
      score += (terms(title, token) ? 14 : terms(body, token) ? 3 : 0) * weight;
    }
    for (const group of active) score += group.keys.some(key => terms(title, key)) ? group.boost : group.keys.some(key => terms(body, key)) ? group.boost / 3 : 0;
    if (!requested.length && active.length && source.category === 'Solutions' && score > 0) score += 5;
    if (title === query) score += 2000;
    else if (namedIds.has(source.id)) score += 500;
    if (solutionIntent && source.category === 'Solutions' && score > 0) score += 70;
    if (resourceIntent && (source.category === 'Resources' || source.downloads?.length)) {
      score += 180;
      const downloads = normal((source.downloads || []).map(item => item.title).join(' '));
      for (const group of active) if (group.keys.some(key => terms(downloads, key))) score += 100;
    }
    if (certificateIntent && !requested.length && source.category === 'Resources') score += 90;
    return { source, score };
  }).filter(item => item.score >= 6).sort((a, b) => b.score - a.score || String(a.source.id).localeCompare(String(b.source.id))).map(({ source, score }) => ({ ...source, score: Math.round(score * 10) / 10 }));
}

// Deterministic retrieval remains usable even when the AI gateway is offline.
export function retrieveWasionSources(question, { limit = 12, legacy = false } = {}) {
  if (legacy) return retrieveLegacyWasionSources(question, { limit });
  const query = queryDetails(question);
  const matches = rankRequirementsSearchPages(WASION_SOURCES, question);
  return {
    resultCount: matches.length,
    results: matches.slice(0, limit).map(source => ({
      id: source.id, slug: source.slug, title: source.title, category: source.category,
      url: source.url, href: source.href, summary: source.summary, images: source.images,
      image: source.image, downloads: source.downloads, excerpt: relevantExcerpt(source, query), score: source.score
    }))
  };
}
