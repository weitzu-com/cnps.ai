import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { marked } from 'marked';

marked.setOptions({gfm:false});
const root=process.cwd(), dir=path.join(root,'content/reports/fastgpt-bilingual');
fs.mkdirSync(path.join(root,'research'),{recursive:true});
const name='fastgpt-cnps-global-growth-bilingual', route='/resources/'+name;
const source=JSON.parse(fs.readFileSync(path.join(dir,'source-blocks.json'),'utf8'));
const original=fs.readFileSync(path.join(root,'content/reports/fastgpt-cnps-global-growth.md'));
assert.equal(crypto.createHash('sha256').update(original).digest('hex'),source.source_sha256,'Source changed: refresh translation alignment before building');
const translations=new Map();
for(const file of fs.readdirSync(dir).filter(f=>/^en-.*\.md$/.test(f)).sort()){
  for(const m of fs.readFileSync(path.join(dir,file),'utf8').matchAll(/^\[(b\d+)\]\n([\s\S]*?)(?=^\[b\d+\]\n|$(?![\s\S]))/gm)){
    assert(!translations.has(m[1]),'Duplicate translation: '+m[1]);translations.set(m[1],m[2].trim());
  }
}
const overrides=JSON.parse(fs.readFileSync(path.join(dir,'zh-overrides.json'),'utf8'));
const links=s=>[...s.matchAll(/\]\(([^)]+)\)/g)].map(m=>m[1]);
const numbers=s=>(s.replace(/https?:\/\/[^\s)]+/g,'').match(/\d+(?:[,.]\d+)*/g)||[]).sort();
const table=s=>s.split('\n').filter(l=>l.startsWith('|')).filter(l=>!/^\|[\s:|\-]+\|$/.test(l)).map(l=>l.trim().slice(1,-1).split('|').map(c=>c.trim()));
const blocks=source.blocks.map(b=>{
  if(b.zh.startsWith('<div class="page-break"'))return {...b,en:b.zh,type:'break'};
  const en=translations.get(b.id);assert(en,'Missing translation: '+b.id);
  assert.deepEqual(links(b.zh),links(en),'Link mismatch: '+b.id);
  assert.deepEqual(numbers(b.zh),numbers(en),'Number mismatch: '+b.id);
  const zh=overrides[b.id]||b.zh;
  let type='paragraph';
  if(b.zh.startsWith('#'))type='heading';
  else if(b.zh.startsWith('|')){type='table';assert.deepEqual(table(zh).map(r=>r.length),table(en).map(r=>r.length),'Table mismatch: '+b.id);}
  else if(b.zh.startsWith('```'))type='code';
  else if(b.zh.startsWith('- ')){type='list';assert.equal(zh.split('\n').length,en.split('\n').length,'List mismatch: '+b.id);}
  return {...b,zh,en,type};
});
assert.equal(translations.size,blocks.filter(b=>b.type!=='break').length);
const glossary=[
 ['有效询盘','Valid inquiry','有可回复联系方式、真实企业场景和实施意向。','An inquiry with usable contact details, a real business use case, and implementation intent.'],
 ['销售合格线索','Sales-qualified lead (SQL)','已确认负责人、问题、数据条件与下一步日期；本方案的销售漏斗中 SQL 指此概念。','A lead with a confirmed owner, problem, data conditions, and next-step date; this is the meaning of SQL in the sales funnel.'],
 ['询价／报价请求','Request for quotation (RFQ)','买方向供应方提出产品或服务报价需求。','A buyer request for a product or service quotation.'],
 ['工作说明书','Statement of work (SOW)','约定范围、交付物、验收、费用与责任的项目文件。','A project document defining scope, deliverables, acceptance, fees, and responsibilities.'],
 ['试点','Pilot','范围明确、可测量、先于生产扩展的验证阶段。','A bounded, measurable evaluation phase before production expansion.'],
 ['基线','Baseline','用来比较改善程度的原有工作表现。','Existing task performance used as the comparison point.'],
 ['验收标准','Acceptance criteria','双方预先约定、用于判断交付是否达标的规则。','Rules agreed in advance to determine whether delivery meets requirements.'],
 ['贡献毛利','Contribution margin','此方案模型中的收入减直接交付成本；并非净利润。','Revenue less direct delivery cost in this model; not net profit.'],
 ['回款','Collected payment','实际收到的款项，与签约和开票分别记录。','Payment actually received, recorded separately from signing and invoicing.'],
 ['人工转接','Human handoff','将请求和必要背景交给授权人员处理。','Transfer of a request and necessary context to authorized staff.'],
 ['检索增强生成','Retrieval-augmented generation (RAG)','将检索到的知识用于生成回答；仍需核验来源与输出。','Generation informed by retrieved knowledge; sources and outputs still require validation.'],
 ['推广行动入口','Call to action (CTA)','引导买方执行下一步的按钮或链接。','A button or link directing the buyer to the next action.']
];
const meta={edition:'Chinese–English parallel edition',source_sha256:source.source_sha256,source_revisions:23,chapters:28,paired_blocks:translations.size,english_words:[...translations.values()].join(' ').split(/\s+/).length,translated_english_source_blocks:Object.keys(overrides).length,research_date:'2026-09-03'};
fs.writeFileSync(path.join(dir,'parallel-content.json'),JSON.stringify({meta,glossary,blocks},null,2)+'\n');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inline=s=>marked.parseInline(s), strip=s=>s.replace(/^#+ /,'');
const languages=(zh,en)=>`<span class="lang-zh" lang="zh-CN">${inline(zh)}</span><span class="lang-en" lang="en">${inline(en)}</span>`;
function pair(b){
  if(b.type==='break')return '<hr class="chapter-break">';
  if(b.type==='heading'){
    const level=b.zh.match(/^#+/)[0].length;
    const id=/^## 第\d+章/.test(b.zh)?'chapter-'+String(b.chapter).padStart(2,'0'):b.id;
    return `<header class="parallel-heading" id="${id}"><h${Math.min(level,3)}>${languages(strip(b.zh),strip(b.en))}</h${Math.min(level,3)}></header>`;
  }
  if(b.type==='table'){
    const zh=table(b.zh),en=table(b.en);
    return `<div class="parallel-table" id="${b.id}" role="region" aria-label="中英文对照表 / Bilingual table" tabindex="0"><table><thead><tr>${zh[0].map((c,i)=>'<th scope="col">'+languages(c,en[0][i])+'</th>').join('')}</tr></thead><tbody>${zh.slice(1).map((row,j)=>'<tr>'+row.map((c,i)=>'<td>'+languages(c,en[j+1][i])+'</td>').join('')+'</tr>').join('')}</tbody></table></div>`;
  }
  if(b.type==='list')return `<ul class="parallel-sources" id="${b.id}">${b.zh.split('\n').map((l,i)=>'<li>'+languages(l.slice(2),b.en.split('\n')[i].slice(2))+'</li>').join('')}</ul>`;
  return `<section class="parallel-pair" id="${b.id}"><div class="lang-zh" lang="zh-CN"><span class="language-label">中文</span>${marked.parse(b.zh)}</div><div class="lang-en" lang="en"><span class="language-label">ENGLISH</span>${marked.parse(b.en)}</div></section>`;
}
let md='# FastGPT 携手 CNPS.AI 出海增长与交付方案 / FastGPT × CNPS.AI: Global Growth and Delivery Playbook\n\n**中英文对照版 / Chinese–English parallel edition**\n\n';
md+='**版本说明 / Edition note**\n\n本版完整对照原方案28章，共239个内容块。原方案已完成23轮实质修订；本版新增逐块翻译及一致性校验，不把翻译校验冒充新的23轮策略迭代。研究日期保持2026-09-03；翻译不表示重新核验外部资料。\n\nThis edition pairs all 28 chapters and 239 content blocks of the original playbook. The source completed 23 substantive revisions. This edition adds block-level translation and consistency checks; those checks are not described as another 23 strategy revisions. The research date remains 2026-09-03. Translation does not imply that external sources were reverified.\n\n';
md+='[在线对照阅读 / Read online](https://www.cnps.ai'+route+') · [中文原版 / Chinese source](https://www.cnps.ai/resources/fastgpt-cnps-global-growth) · [原方案迭代记录 / Source revision record](https://www.cnps.ai/resources/fastgpt-cnps-iterations.md)\n\n';
md+='## 术语对照 / Terminology\n\n| 中文 | English | 含义 / Meaning |\n| --- | --- | --- |\n'+glossary.map(g=>`| ${g[0]} | ${g[1]} | ${g[2]}<br>${g[3]} |`).join('\n')+'\n\n';
for(const b of blocks){
  if(b.id==='b000')continue;
  if(b.type==='break'){md+='\n<div class="page-break"></div>\n\n';continue;}
  md+=`<!-- ${b.id} -->\n\n`;
  if(b.type==='heading'){const level=b.zh.match(/^#+/)[0];md+=level+' '+strip(b.zh)+' / '+strip(b.en)+'\n\n';}
  else if(b.type==='table'){
    const zh=table(b.zh),en=table(b.en);zh.forEach((row,j)=>{md+='| '+row.map((c,i)=>c+'<br>'+en[j][i]).join(' | ')+' |\n';if(j===0)md+='| '+row.map(()=>'---').join(' | ')+' |\n';});md+='\n';
  }else if(b.type==='list'){md+=b.zh.split('\n').map((l,i)=>l+'\n\n  '+b.en.split('\n')[i].slice(2)).join('\n\n')+'\n\n';}
  else md+='**中文**\n\n'+b.zh+'\n\n**English**\n\n'+b.en+'\n\n';
}
md=md.trimEnd()+'\n';
const out=path.join(root,'site/resources');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(root,'content/reports',name+'.md'),md);
fs.writeFileSync(path.join(out,name+'.md'),md);
const pdfQA=path.join(dir,'edition.json');
const pdfPages=fs.existsSync(pdfQA)?JSON.parse(fs.readFileSync(pdfQA,'utf8')).pages:null;
const pdf=path.join(root,'output/pdf',name+'.pdf');if(fs.existsSync(pdf))fs.copyFileSync(pdf,path.join(out,name+'.pdf'));
const chapters=blocks.filter(b=>b.type==='heading'&&/^## 第\d+章/.test(b.zh));
const toc=chapters.map(b=>`<a href="#chapter-${String(b.chapter).padStart(2,'0')}"><b>${String(b.chapter).padStart(2,'0')}</b><span><span class="lang-zh" lang="zh-CN">${esc(strip(b.zh).replace(/^第\d+章：/,''))}</span><small class="lang-en" lang="en">${esc(strip(b.en).replace(/^Chapter \d+: /,''))}</small></span></a>`).join('');
const glossaryHtml='<section class="glossary"><h2><span class="lang-zh" lang="zh-CN">术语对照</span> <span class="lang-en" lang="en">Terminology</span></h2><dl>'+glossary.map(g=>'<div><dt>'+languages(g[0],g[1])+'</dt><dd>'+languages(g[2],g[3])+'</dd></div>').join('')+'</dl></section>';
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FastGPT × CNPS.AI 出海方案｜中英文对照 · Bilingual Playbook</title><meta name="description" content="FastGPT与CNPS.AI出海方案完整中英文对照：28章、239个对应内容块，包含X与GitHub研究、B2B询盘、试点验收和90天执行。Complete Chinese–English playbook."><link rel="canonical" href="https://www.cnps.ai${route}"><meta property="og:title" content="FastGPT × CNPS.AI | 中英文对照出海方案"><meta property="og:description" content="28 chapters. Chinese and English in parallel. Research, B2B acquisition, pilots and delivery."><meta property="og:url" content="https://www.cnps.ai${route}"><meta property="og:type" content="article"><meta name="theme-color" content="#12313f"><link rel="icon" href="/fastgpt-assets/favicon.svg"><link rel="stylesheet" href="/fastgpt-assets/style.css"><link rel="stylesheet" href="/fastgpt-assets/bilingual.css"><script defer src="/fastgpt-assets/bilingual.js"></script></head><body data-reading-mode="both"><a class="skip" href="#report">跳到正文 / Skip to report</a><header class="site-header"><a class="brand" href="/">CNPS<span>.AI</span></a><nav aria-label="主导航 / Main navigation"><a href="/fastgpt">FastGPT</a><a href="/fastgpt/cases">案例 / Cases</a><a href="/resources/fastgpt-cnps-global-growth">中文原版</a><a class="button small" href="/fastgpt/contact">讨论试点 / Discuss a pilot ↗</a></nav></header><main id="main"><section class="bilingual-hero wrap"><p class="eyebrow">CNPS × FASTGPT · CHINESE–ENGLISH EDITION</p><h1>${languages('FastGPT 携手 CNPS.AI<br>出海增长与交付方案','FastGPT × CNPS.AI<br>Global Growth and Delivery Playbook')}</h1><p class="lede">从买方需求到可验收试点，再到可持续订单。<br><span lang="en">From buyer needs to accepted pilots and sustainable orders.</span></p><p class="edition-meta">28章 / Chapters · 239组内容对照 / Paired blocks${pdfPages?' · '+pdfPages+'页 A4 / A4 pages':''}</p><div class="actions"><a class="button" href="${route}.md" download>中英 Markdown / Download ↓</a><a class="secondary" href="${route}.pdf">中英 PDF / Read PDF ↗</a><a class="text-link" href="/resources/fastgpt-cnps-iterations.md">原版23轮记录 / Source revisions →</a></div><details class="edition-note"><summary>版本与研究说明 / About this edition</summary><p>完整对照原方案28章；中文原版的23轮实质迭代保持可追溯。本版另做逐块翻译、数字、链接与表格校验。研究日期仍为2026-09-03，未因翻译而重新核验外部资料。原版内的英文文案已补充中文译文。</p><p lang="en">All 28 source chapters are paired. The Chinese source retains its 23 documented substantive revisions; this edition adds translation, number, link and table checks. The research date remains September 3, 2026; translation does not imply fresh external verification. English templates in the source now have Chinese translations.</p></details></section><div class="reading-toolbar wrap"><div role="group" aria-label="阅读语言 / Reading language"><button type="button" data-mode="both" aria-pressed="true">中英对照 / Both</button><button type="button" data-mode="zh" aria-pressed="false">仅中文</button><button type="button" data-mode="en" aria-pressed="false">English only</button></div><label class="chapter-picker">跳转章节 / Jump to chapter<select id="chapter-jump"><option value="">选择章节 / Select chapter</option>${chapters.map(b=>'<option value="chapter-'+String(b.chapter).padStart(2,'0')+'">'+esc(strip(b.zh))+' / '+esc(strip(b.en))+'</option>').join('')}</select></label><p id="reading-status" class="sr-only" role="status" aria-live="polite">中英对照 / Chinese and English</p></div><div class="parallel-layout wrap"><aside class="parallel-toc"><h2>章节 / Chapters</h2>${toc}</aside><article id="report" class="parallel-report">${glossaryHtml}${blocks.filter(b=>b.id!=='b000').map(pair).join('\n')}</article></div></main><footer class="site-footer"><div><a class="brand" href="/">CNPS<span>.AI</span></a><p>讨论一个工作流 / Discuss one workflow</p><a href="mailto:sales@cnps.ai">sales@cnps.ai</a></div><div><a href="/fastgpt/contact">试点询盘 / Pilot inquiry</a><a href="/fastgpt/cases">参考案例 / Reference cases</a><a href="/privacy">隐私政策 / Privacy</a></div><p class="footer-note">案例由 FastGPT 发布，CNPS 未独立审计。规划数字不构成报价或效果保证。<br><span lang="en">Cases are published by FastGPT and are not independently audited by CNPS. Planning figures are not quotations or performance guarantees.</span></p></footer></body></html>`;
fs.writeFileSync(path.join(out,name+'.html'),html);
const validation={...meta,source_blocks:blocks.length,untranslated_blocks:0,number_mismatches:0,link_mismatches:0,table_mismatches:0,markdown_sha256:crypto.createHash('sha256').update(md).digest('hex'),review_notes:['All 239 non-break source blocks have English counterparts.','All Arabic numerals and link targets match the source block by block.','Every table retains row and column parity.','English-only source templates and embedded buyer copy have Chinese counterparts.','Source-case attribution, uncertainty, licensing conditions and planning assumptions retained.','Shangluo used as a consistent identifying transliteration rather than adding an unverified legal English company name.']};
fs.writeFileSync(path.join(root,'research/fastgpt-bilingual-validation.json'),JSON.stringify(validation,null,2)+'\n');
console.log(JSON.stringify({...meta,pdf_pages:pdfPages,route}));
