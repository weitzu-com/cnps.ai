import test from 'node:test';
import assert from 'node:assert/strict';
import {PRODUCTS} from '../server/wasion-requirements/data.mjs';
import {createContext} from '../server/wasion-requirements/shared.mjs';
import {renderBusiness} from '../server/wasion-requirements/business.mjs';

const context=createContext();
const decode=text=>text.replace(/&(?:amp|lt|gt|quot|#39);/g,entity=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[entity]));
const product=id=>{const p=PRODUCTS.find(p=>p.id===id);assert.ok(p,id);return p;};
const rendered=p=>renderBusiness(p.slug,{...context,products:[p]});
const tables=html=>[...html.matchAll(/<table\b[^>]*data-parameter-table="source-grid"[^>]*>([\s\S]*?)<\/table>/g)].map(match=>match[1]);
function rows(table){
 let group=null;
 const found=[];
 for(const match of table.matchAll(/<\/?(?:thead|tbody|tfoot)\b[^>]*>|<tr\b[^>]*>[\s\S]*?<\/tr>/g)){
  const token=match[0];
  if(!token.startsWith('<tr')){group=token.startsWith('</')?null:token.match(/^<(\w+)/)[1];continue;}
  const cells=[...token.matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/g)].map(cell=>({
   text:decode(cell[3]),tag:cell[1],
   rowspan:Number(cell[2].match(/\browspan="(\d+)"/)?.[1]||1),
   colspan:Number(cell[2].match(/\bcolspan="(\d+)"/)?.[1]||1)
  }));
  found.push({group,cells});
 }
 return found;
}
function grid(table){
 const result=[];
 rows(table).forEach((row,r)=>{
  result[r]??=[];let column=0;
  for(const cell of row.cells){
   while(result[r][column]!==undefined)column++;
   for(let y=0;y<cell.rowspan;y++)for(let x=0;x<cell.colspan;x++){
    result[r+y]??=[];
    assert.equal(result[r+y][column+x],undefined,'An emitted span must not overlap another cell.');
    result[r+y][column+x]=cell.text;
   }
   column+=cell.colspan;
  }
 });
 return result;
}
const tableFor=id=>tables(rendered(product(id)))[0];

test('all 86 source parameter tables retain every original cell, row group and span without invented column headers',()=>{
 assert.equal(PRODUCTS.length,86);
 let tableCount=0,rowCount=0,cellCount=0,legacyRows=0;
 for(const p of PRODUCTS){
  assert.ok(p.parameterTables?.length,p.id);
  const html=rendered(p),actual=tables(html);
  assert.equal(actual.length,p.parameterTables.length,p.id);
  p.parameterTables.forEach((table,index)=>{
   assert.equal(table.sourceURL,p.url,p.id+' exact model source');
   assert.match(table.officialBodySha256,/^[a-f0-9]{64}$/);
   const expected=table.rows.map(row=>({group:row.group,cells:row.cells.map(({text,tag,rowspan,colspan})=>({text,tag,rowspan,colspan}))}));
   assert.deepEqual(rows(actual[index]),expected,p.id);
   assert.ok(actual[index].includes('href="'+table.sourceURL+'"'),p.id+' official source caption');
   assert.doesNotMatch(actual[index],/scope="(?:row|col)"/,'No header scope is inferred from a TD cell.');
   assert.doesNotMatch(actual[index],/<th[^>]*>Parameter<\/th>/);
   tableCount++;rowCount+=expected.length;cellCount+=expected.reduce((n,row)=>n+row.cells.length,0);
   legacyRows+=table.rows.filter(row=>row.legacyRowIndex!==null).length;
  });
 }
 assert.deepEqual({tableCount,rowCount,cellCount,legacyRows},{tableCount:86,rowCount:1499,cellCount:2606,legacyRows:1495});
});

test('charging-cabinet series columns retain all four fan continuation values under their original parent',()=>{
 const table=tableFor('product-intelligent-charging-cabinet'),g=grid(table);
 assert.deepEqual(g[0],['Item','W Series','E Series','S Series']);
 assert.deepEqual(g[14],['AC220V High-speed Silent Fan','2600 With protective net','-','-']);
 assert.deepEqual(g[15],['AC220V High-speed Silent Fan','Speed 2600','-','-']);
 assert.deepEqual(g[20],['DC blower','60*60*15mm','60*60*15mm','-']);
 assert.deepEqual(g[21],['DC blower','Speed 2000','Speed 2000','-']);
 assert.deepEqual(g[17],['DC 12V High-speed Silent Fan','2600 With protective net','2600 With protective net','2600 With protective net']);
 assert.equal(g[22][0],'S-Type Aerosol Fire Extinguisher','Fan row spans end at the original row boundary.');
 assert.doesNotMatch(table,/<th[^>]*>(?:60\*60\*15mm|Speed 2000|2600 With protective net)<\/th>/);
});

test('Hybrid PLC and RF field groups remain distinct through all eight continuation subfields',()=>{
 const g=grid(tableFor('product-hybrid-communication-module'));
 for(let row=3;row<=6;row++)assert.deepEqual(g[row].slice(0,2),['PLC','PLC']);
 for(let row=7;row<=12;row++)assert.deepEqual(g[row].slice(0,2),['RF','RF']);
 assert.deepEqual(g[4].slice(2),['Support Frequency band','CENELECA(32 to 95 kHZ, FCC(154 to 487 kHz)']);
 assert.deepEqual(g[6].slice(2),['Maximum Transmission rate','280 kbps']);
 assert.deepEqual(g[8].slice(2),['Support ISM','315,433,490,868,915,920 MHz']);
 assert.deepEqual(g[10].slice(2),['Maximum Transmission Rate','400 kbps']);
 assert.deepEqual(g[12].slice(2),['Receiving Sensitivity','-109dBm at 50Kbps']);
});

for(const model of ['zw32','zw20'])test(model+' insulation parent, item, unit and data remain separate original cells',()=>{
 const id=`product-${model}-12-outdoor-high-voltage-smart-vacuum-circuit-breaker`,g=grid(tableFor(id));
 assert.deepEqual(g[0],['Item','Item','Unit','Data']);
 assert.deepEqual(g[2],['Rated insulation level','1 min power frequency withstand voltage','kA','42']);
 assert.deepEqual(g[3],['Rated insulation level','Lighting impulse withstand voltage(peak)','kA','75']);
 assert.equal(g[1][2],'kA','The published unit is retained without silently correcting manufacturer text.');
});

test('SF6 C/F/V columns preserve both insulation groups and their between-contact subfields',()=>{
 const g=grid(tableFor('product-ws-fl-12-sf6-gas-insulated-ring-main-unit'));
 assert.deepEqual(g[0],['Item','Item','Unit','Data','Data','Data']);
 assert.deepEqual(g[1],['','','','C','F','V']);
 assert.deepEqual(g[4],['1 min power frequency withstand voltage','Between contacts','kV','48/60/110','48/60/110','48/60/110']);
 assert.deepEqual(g[6],['Lighting impulse withstand voltage(peak)','Between contacts','kV','85/115/215','85/115/215','85/115/215']);
});

test('KYN insulation and protection-level continuations inherit the correct separate parents',()=>{
 const g=grid(tableFor('product-kyn28-12-high-voltage-metal-clad-switchgear'));
 assert.deepEqual(g[3],['1 min power frequency withstand voltage','Between contacts','kV','48']);
 assert.deepEqual(g[5],['Lighting impulse withstand voltage(peak)','Between contacts','kV','85']);
 assert.deepEqual(g[14],['Protection level','Protection level','','Circuit breaker door open: IP2X']);
});

test('source grids remain keyboard-focusable scroll regions with their model-specific accessible name',()=>{
 const p=product('product-intelligent-charging-cabinet'),html=rendered(p);
 assert.match(html,/<div class="wr-b-table-wrap wr-b-wide-table" role="region" tabindex="0" aria-label="Intelligent Charging Cabinet published parameter table 1">/);
 assert.match(html,/On narrow screens, scroll horizontally to view every column\./);
 assert.ok(html.includes('<caption>Intelligent Charging Cabinet — Published specifications · <a'));
 const ordinary=rendered(product('product-jyl-60-fault-indicator-distribution-line-fault-detectors-technology'));
 assert.match(ordinary,/<div class="wr-b-table-wrap" role="region" tabindex="0"/,'Two visible cell columns are not widened merely because each spans two source grid tracks.');
});

test('source table text and attributes cannot inject executable markup, fabricated tags or URLs',()=>{
 const p={...product('product-intelligent-charging-cabinet'),parameterTables:[{sourceURL:'javascript:alert(1)',rows:[
  {group:'tbody onclick="alert(1)"',groupIndex:0,cells:[{tag:'th onclick="alert(1)"',text:'<img src=x onerror="alert(1)"> & <script>bad</script>',rowspan:'2" onmouseover="alert(1)',colspan:-1}]}
 ]}]};
 const table=tables(rendered(p))[0];
 assert.doesNotMatch(table,/<(?:img|script)\b|javascript:|<[^>]+\son(?:click|mouseover|error)=/);
 assert.ok(table.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &lt;script&gt;bad&lt;/script&gt;'));
 assert.deepEqual(rows(table),[{group:null,cells:[{tag:'td',text:'<img src=x onerror="alert(1)"> & <script>bad</script>',rowspan:1,colspan:1}]}]);
});

test('actual TH cells and distinct source row groups survive without inventing column or row scope',()=>{
 const cell=(text,tag='td')=>({text,tag,rowspan:1,colspan:1});
 const p={...product('product-intelligent-charging-cabinet'),tables:[],parameterTables:[{sourceURL:'https://en.wasion.com/example.html',rows:[
  {group:'thead',groupIndex:0,cells:[cell('Published header','th')]},
  {group:'tbody',groupIndex:1,cells:[]},
  {group:'tbody',groupIndex:1,cells:[cell('First original group')]},
  {group:'tbody',groupIndex:2,cells:[cell('Second original group')]},
  {group:'tfoot',groupIndex:3,cells:[cell('Published footnote')]}
 ]}]};
 const table=tables(rendered(p))[0];
 assert.match(table,/<thead><tr><th>Published header<\/th><\/tr><\/thead>/);
 assert.equal((table.match(/<tbody>/g)||[]).length,2);
 assert.match(table,/<tbody><tr><\/tr><tr><td>First original group<\/td><\/tr><\/tbody>/);
 assert.match(table,/<tfoot><tr><td>Published footnote<\/td><\/tr><\/tfoot>/);
 assert.doesNotMatch(table,/scope=/);
});

test('legacy table fallback is used only when no source grid metadata is available',()=>{
 const p={...product('product-intelligent-charging-cabinet'),parameterTables:undefined,tables:[[['Legacy field','Legacy value'],['Legacy continuation']]]};
 const html=rendered(p);
 assert.equal(tables(html).length,0);
 assert.ok(html.includes('<th scope="row">Legacy field</th><td>Legacy value</td>'));
 assert.ok(html.includes('Legacy continuation'));
 const empty=rendered({...p,tables:[]});
 assert.ok(empty.includes('A model-specific parameter table is not present'));
});
