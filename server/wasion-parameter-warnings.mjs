import warnings from './wasion-requirements/parameter-warnings.json' with {type:'json'};

const rules=[
 ['product-zw32-12-outdoor-high-voltage-smart-vacuum-circuit-breaker',/\bZW32[ -]?12\b(?![-a-z0-9])/iu,/\b(?:voltage|insulation|units?|ratings?|specifications?|parameters?)\b|电压|绝缘|单位|参数|规格|额定/iu],
 ['product-zw20-12-outdoor-high-voltage-smart-vacuum-circuit-breaker',/\bZW20[ -]?12\b(?![-a-z0-9])/iu,/\b(?:voltage|insulation|units?|ratings?|specifications?|parameters?)\b|电压|绝缘|单位|参数|规格|额定/iu],
 ['product-ws-fl-12-sf6-gas-insulated-ring-main-unit',/\bWS[ -]FL[ -]12\b(?![-a-z0-9])/iu,/\b(?:current|endurance|arc|pressure|units?|ratings?|specifications?|parameters?)\b|电流|寿命|燃弧|压力|单位|参数|规格|额定/iu],
 ['product-kyn28-12-high-voltage-metal-clad-switchgear',/\bKYN28[ -]?12\b(?![-a-z0-9])/iu,/\b(?:current|units?|ratings?|specifications?|parameters?)\b|电流|单位|参数|规格|额定/iu],
 ['product-jyl-60-fault-indicator-distribution-line-fault-detectors-technology',/\bJYL[ -]?60\b/iu,/metering\s+precision|\baccuracy\b|gas\s+warning|计量精度|测量精度|燃气.*预警/iu]
];
// Bounded source-row values also identify claims whose prose omits the field
// noun (for example "operates at12kV"). These are ambiguity signals, not
// replacement specifications or a general semantic validator.
const disputedValueClaims={
 'product-zw32-12-outdoor-high-voltage-smart-vacuum-circuit-breaker':/(?<![\d.])(?:12|42|75)\s*(?:k[va]\b|kilovolts?\b|kiloamperes?\b|千伏|千安)/iu,
 'product-zw20-12-outdoor-high-voltage-smart-vacuum-circuit-breaker':/(?<![\d.])(?:12|42|75)\s*(?:k[va]\b|kilovolts?\b|kiloamperes?\b|千伏|千安)/iu,
 'product-ws-fl-12-sf6-gas-insulated-ring-main-unit':/(?<![\d.])(?:0[.,]04\s*(?:mpa\b|megapascals?\b|兆帕)|(?:20|25|50|63|100)\s*(?:k[va]\b|kiloamperes?\b|kilovolts?\b|千安|千伏)|(?:5000|10000)\s*(?:cycles?\b|operations?\b|次))/iu,
 'product-kyn28-12-high-voltage-metal-clad-switchgear':/(?<![\d.])(?:16|20|25|31[.,]5|40|50|63|80|100|125)\s*(?:k[va]\b|kiloamperes?\b|kilovolts?\b|千安|千伏)/iu,
 'product-jyl-60-fault-indicator-distribution-line-fault-detectors-technology':/\bclass\s*\d|\d+(?:\.\d+)?\s*[%％]|\d+(?:\.\d+)?\s*级/iu
};
export function getWasionParameterWarning(product){
 const record=warnings.products[product?.id];
 if(!record||record.sourceURL!==product.url)return null;
 const valid=record.rows.every(row=>{
  const table=product.parameterTables?.find(table=>table.sourceTableIndex===row.sourceTableIndex&&table.sourceURL===record.sourceURL&&table.officialBodySha256===record.officialBodySha256);
  const source=table?.rows.find(item=>item.sourceRowIndex===row.sourceRowIndex);
  return source&&JSON.stringify(source.cells.map(cell=>cell.text))===JSON.stringify(row.cells);
 });
 return valid?JSON.parse(JSON.stringify(record)):null;
}
function matchRule(question){
 if(typeof question!=='string')return null;
 const q=question.normalize('NFKC').replace(/[‐‑–—−]/g,'-'),matches=rules.filter(rule=>rule[1].test(q));
 return matches.length===1?{rule:matches[0],q}:null;
}
export function getWasionParameterClarification({question,answer,citedSourceIds=[],language='en',products=[],sourceCatalog=[],context=[]}={}){
 const matched=matchRule(question);if(!matched)return null;
 const [id,,field]=matched.rule;
 const product=products.find(product=>product.id===id);if(!product)return null;
 let body=typeof answer==='string'?answer.replace(/\[[^\]\r\n]+\]/g,''):matched.q;
 const title=product.title.normalize('NFKC').replace(/[‐‑–—−]/g,'-'),at=body.toLowerCase().indexOf(title.toLowerCase());
 if(at>=0)body=body.slice(0,at)+body.slice(at+title.length);
 if(answer===undefined)body=body.replace(matched.rule[1],'');
 if(!field.test(body)&&!disputedValueClaims[id]?.test(body))return null;
 if((answer===undefined&&context[0]?.id!==id)||(answer!==undefined&&!citedSourceIds.includes(id)))return null;
 const record=getWasionParameterWarning(product);
 const source=sourceCatalog.find(source=>source.id===id&&source.url===record?.sourceURL);
 if(!record||!source)return null;
 const intro=language==='zh'?'官方资料澄清：以下原始表格单元格表述尚待厂方确认（按来源列序排列）。':'Official-source clarification: these original table cell statements require manufacturer confirmation (shown in source column order).';
 const ending=language==='zh'?'现有资料尚不能确定上述字段适用的单位、额定指标或含义。选型前请威胜确认；此处不推定或改写正确单位和数值。':'The available source does not establish the intended units, ratings or meaning of the rows above. Confirm them with Wasion before selection; no corrected units or values are inferred here.';
 return {source,answer:[intro,...record.rows.map(row=>row.cells.join(' | ')),ending].join('\n\n')};
}
