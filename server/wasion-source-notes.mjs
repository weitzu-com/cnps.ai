// Exact-source clarification only. Preserve the publisher's original wording;
// different field names or nominal/rated values are not automatically errors.
const SOURCE_NOTES = new Map([
  ['i-110-series-smart-water-meter', [{
    sourceURL: 'https://en.wasion.com/proWateRel/I-110-Series-Smart-Water-Meter.html',
    field: 'Communication / Alarm and Event logs — original table row groups',
    quotes: ['Wired M-BUS/RS485', 'LoRaWAN', 'Wireless M-BUS (EN13757.4), Walk-by/Driver-by', 'Protocol: EN13757.3, DLMS/COSEM,MODBUS-RTU', 'RPMA, Cellular (2G, 3G, 4G, NB-IoT), PLC, RF and Ethernet'],
    message: 'The original Communication group spans the four rows beginning with Wired M-BUS/RS485. The RPMA/Cellular/PLC/RF/Ethernet row is instead inside the original Alarm and Event logs group. This grouping does not establish whether those items are supported communication options. Confirm their field attribution and available interfaces with Wasion; the original table has not been regrouped.'
  }]],
  ['product-hmpm-for-the-android-platform-to-set-parameters-read-copy-data-from-meters-with-hhu', [{
    sourceURL: 'https://en.wasion.com/RelevantProduct/Wasion-Meterview-APP.html',
    field: 'Key Features / Main Functions — Compatibility',
    quotes: ['Support Android 6.0 and higher versions', 'Android 5.0 and above'],
    message: 'The official page lists Android 6.0 and higher in Key Features, but Android 5.0 and above under Compatibility. Confirm the applicable OS requirement and software version with Wasion before selection.'
  }]],
  ['product-jyl-60-fault-indicator-distribution-line-fault-detectors-technology', [{
    sourceURL: 'https://en.wasion.com/proIntpRel/JYL-60-Fault-Indicator.html',
    field: 'Key Features — Maximum short circuit current / Technical Parameters — Maximum Fault Current',
    quotes: ['Maximum short circuit current: 30kA/2s', '20kA/2s'],
    message: 'Key Features lists Maximum short circuit current as 30kA/2s, while Technical Parameters lists Maximum Fault Current as 20kA/2s. These field labels differ. Ask Wasion to confirm the applicable ratings and test conditions; do not treat them as interchangeable.'
  }]],
  ['product-we-cube-air-cooling-500kw-1000kwh', [{
    sourceURL: 'https://en.wasion.com/EnergyStorageSystem/WE-CUBE.html',
    field: 'Product subtitle / DC Specification — Rated Capacity',
    quotes: ['Air Cooling 500kW / 1000kWh', '1075.2 kWh'],
    message: 'The product subtitle lists 500kW / 1000kWh, while DC Specification gives Rated Capacity as 1075.2 kWh. The headline and rated-capacity figures may use different bases. Ask Wasion to confirm the applicable capacity definition and configuration.'
  }]]
]);

export function getWasionSourceNotes(id) {
  return (SOURCE_NOTES.get(id) || []).map(note => ({ ...note, quotes: [...note.quotes] }));
}

// Reviewed field questions use literal publisher wording, not inference.
// A model appearing only in retrieval/context must never select this branch.
const QUESTION_RULES = [
  {
    id: 'i-110-series-smart-water-meter',
    model: /\bI[ -]?110\b(?!-[a-z0-9])/iu,
    field: q => /\bcommunicat\w*\b|通信|通讯|\bRPMA\b|\bCellular\b|蜂窝|\bEthernet\b|以太网|\b(?:RF|2G|3G|4G|PLC|NB-IoT)\b/iu.test(q.replace(/\bRF[\s‐‑–—−-]+card\b|RF卡|射频卡/giu, '')),
    answerField: q => /\bRPMA\b|\bCellular\b|蜂窝|\bEthernet\b|以太网|\b(?:RF|2G|3G|4G|PLC|NB-IoT)\b/iu.test(q.replace(/\bRF[\s‐‑–—−-]+card\b|RF卡|射频卡/giu, '')),
    labels: ['Communication / row 1', 'Communication / row 2', 'Communication / row 3', 'Communication / row 4', 'Alarm and Event logs / original RPMA row'],
    en: 'The original Communication group contains the first four quoted rows. The RPMA/Cellular/PLC/RF/Ethernet row is under Alarm and Event logs in the original table. Its field attribution and availability as communication interfaces need confirmation with Wasion; do not infer either support or non-support from that placement.',
    zh: '原表 Communication 分组包含前四条引文；RPMA/Cellular/PLC/RF/Ethernet 这一行则位于原表 Alarm and Event logs 分组内。该行的字段归属及这些通信接口是否可用，需向威胜确认；不能仅凭该位置推定支持或不支持。'
  },
  {
    id: 'product-hmpm-for-the-android-platform-to-set-parameters-read-copy-data-from-meters-with-hhu',
    model: /\bHMPM\b(?!-[a-z0-9])/iu,
    field: q => /\b(?:android|os)\s+(?:versions?|requirements?|compatibility)\b|\boperating[- ]system\b|\bandroid\s*\d|\b(?:requires?|supports?|runs? on|compatible with)\s+(?:android|os)\b|安卓|操作系统|系统版本/iu.test(q),
    labels: ['Key Features', 'Main Functions / Compatibility'],
    en: 'These published statements do not establish the applicable minimum OS requirement for your HMPM software version. Confirm the applicable OS requirement and software version with Wasion before selection.',
    zh: '这些原文尚不能确认当前 HMPM 软件版本适用的最低操作系统要求。选型前请威胜确认适用的操作系统要求和软件版本。'
  },
  {
    id: 'product-jyl-60-fault-indicator-distribution-line-fault-detectors-technology',
    model: /\bJYL[ -]?60\b/iu,
    field: q => /\b(?:short[- ]?circuit|fault)\s+current\b|短路电流|故障电流/iu.test(q)
      || /\b(?:current ratings?|maximum current)\b|电流(?:额定|指标)|(?:最大|额定)电流/iu.test(q)
        && !/\b(?:load|operating)\s+current\b|\boperating value\b|负载电流|工作电流|动作电流/iu.test(q),
    labels: ['Key Features / Maximum short circuit current', 'Technical Parameters / Maximum Fault Current'],
    en: 'These field labels differ. The available source does not establish that they are interchangeable measurements of the same current limit. Confirm the applicable ratings and test conditions with Wasion.',
    zh: '这两个字段名称不同，现有资料未证明它们是同一电流限值的可互换指标。请威胜确认适用的额定指标和试验条件。'
  },
  {
    id: 'product-we-cube-air-cooling-500kw-1000kwh',
    model: /\bWE[ -]+CUBE\b(?!-[a-z0-9]|[ -]+(?:PREMIUM|PLUS|PRO|LITE))/iu,
    field: q => /\bcapacit(?:y|ies)\b|\b(?:rated|nominal|usable|gross)\s+energy\b|容量|额定储能|1000\s*kwh[^。！？?\n]*1075[.]2|1075[.]2\s*kwh[^。！？?\n]*1000/iu.test(q),
    labels: ['Product subtitle', 'DC Specification / Rated Capacity'],
    en: 'The headline and rated-capacity figures may use different bases; their relationship is not confirmed by the available source. Confirm the applicable capacity definition and configuration with Wasion before selection.',
    zh: '标题标称值与额定容量可能采用不同口径，现有资料未确认它们的关系。选型前请威胜确认适用的容量定义和配置。'
  }
];

function questionRule(question) {
  if (typeof question !== 'string') return null;
  const q = question.normalize('NFKC').replace(/[‐‑–—−]/g, '-');
  const named = QUESTION_RULES.filter(rule => rule.model.test(q));
  if (named.length !== 1) return null;
  const rule = named[0];
  // Exclude another requested model/standard rather than answering its question
  // with a nearby reviewed model. Ordinary words before numbers are not models.
  const numericWords = new Set(['android','version','versions','capacity','cooling','or','and','for','of','is','as','at','to','in','from','than','with']);
  const otherCode = [...q.matchAll(/\b([a-z]{1,12})[ -]?\d{2,6}[a-z\d]*(?:[-/.][a-z\d]+)*\b/giu)]
    .some(match => {
      const namedModel = rule.model.exec(match[0]);
      return !numericWords.has(match[1].toLowerCase()) && !(namedModel && namedModel.index === 0 && namedModel[0].length === match[0].length);
    });
  if (otherCode) return null;
  return { rule, q };
}

function sourceClarification(rule, language, sourceCatalog) {
  const note = getWasionSourceNotes(rule.id)[0];
  const source = sourceCatalog.find(source => source.id === rule.id && source.url === note.sourceURL);
  // Use the full trusted source, not its potentially shortened query excerpt.
  if (!source || !note.quotes.every(quote => (source.passages || []).some(passage => passage.includes(quote)))) return null;
  const intro = language === 'zh' ? '官方资料澄清：原厂页面包含以下字段表述。' : 'Official-source clarification: the published page contains the following field statements.';
  const answer = [intro, ...note.quotes.map((quote, index) => `${rule.labels[index]}: “${quote}”`), language === 'zh' ? rule.zh : rule.en].join('\n\n');
  return { answer, source };
}

export function getWasionQuestionClarification({ question, language = 'en', sourceCatalog = [] } = {}) {
  const match = questionRule(question);
  return match && match.rule.field(match.q) ? sourceClarification(match.rule, language, sourceCatalog) : null;
}

export function getWasionAnswerClarification({ question, answer, citedSourceIds = [], language = 'en', sourceCatalog = [] } = {}) {
  const match = questionRule(question);
  if (!match || typeof answer !== 'string' || !citedSourceIds.includes(match.rule.id)) return null;
  // Citation IDs can themselves contain "android" or the capacity. They are
  // identity tokens, not a claim about a disputed field in the answer body.
  const body = answer.replace(/\[[^\]\r\n]+\]/g, '');
  return (match.rule.answerField || match.rule.field)(body) ? sourceClarification(match.rule, language, sourceCatalog) : null;
}
