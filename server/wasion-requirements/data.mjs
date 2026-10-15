import corpus from '../wasion-demo-content.json' with {type:'json'};
import {getProductCatalog} from '../wasion-experience/content.mjs';
import {DTECH,NEWS_METADATA,FACTORIES} from '../wasion-experience/content-data.mjs';
import supplementalImages from '../wasion-catalog-images.json' with {type:'json'};
import assetMap from './assets-map.json' with {type:'json'};
import enriched from './enriched-products.json' with {type:'json'};

export const PAGES=corpus.pages;
export const cleanTitle=p=>String(p?.title||'').replace(/ - (Content Page|Content|Relevant Product|Newsroom|IEC Smart Meters|IEC Prepaid Meters|ANSI Meters|Cellular Communication|Wi-SUN RF Mesh)$/,'');
export const slugify=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const page=slug=>PAGES.find(p=>p.slug===slug);
export const asset=url=>assetMap[url]||url||'';
// These official video covers contain a baked-in play button. Static imagery
// uses existing clean artwork or documented company-film frames; asset() keeps
// the original cover available to actual video links and resource cards.
const media='/assets/wasion-requirements/';
const staticImages=Object.freeze({
 '9528fb29db5c-aae63a864fabdc081649bb69b8676df7.webp':'wasion-engineering-film-12s.webp',
 'aca8ae9047bf-def19dcd6e83a03b3f3fdf79442d9224.webp':'wasion-engineering-film-12s.webp',
 'ad680768d09d-g3-hybrid.webp':'7a455a925f9c-g3-hybrid.webp',
 '8415204f36dc-energypro430x340.webp':'eeab56d92746-energyprosolution800x450.webp',
 'cca4f1a3af11-91275158bf7e3769fca6a36b2d20982b.webp':'wasion-engineering-film-12s.webp',
 'fac9ed6c68df-e4ce4c1541825e05d9153c41cd39af09.webp':'wasion-engineering-film-12s.webp',
 '9830d94b0eae-6c310bece3c373e7c13a3c77b84a85ac.webp':'wasion-engineering-film-12s.webp',
 'cd400ffbbeed-2e6d51dfed2ec14a138b75411b5099d0.webp':'wasion-robotics-production-film-07s.webp',
 'a2c4ff8f79b8-5bc60336a205122cceaee36f7127b6d3.webp':'wasion-engineering-film-12s.webp'
});
export const staticImage=url=>{const local=asset(url);return local.startsWith(media)&&staticImages[local.slice(media.length)]?media+staticImages[local.slice(media.length)]:local;};
export const image=p=>p?.slug==='about'?'/assets/wasion-requirements/e82ea74f875b-picabout.webp':staticImage(p?.image||p?.images?.find(u=>u.includes('/uploads/images/'))||p?.images?.find(u=>!(/icon|x-pro-info|searc/i).test(u))||'');
export const LOGO=asset(corpus.logoUrl);
export const FILM='https://en.wasion.com/public/uploads/files/20230718/about.mp4';
export const GROUPS=[
 {slug:'electricity-metering-data-management',title:'Electricity Metering & Data Management',short:'Electricity metering',catalog:'electricity-meters',description:'From the meter to the decisions that move your utility forward.',image:image(page('electricity-meters'))},
 {slug:'water-gas-meters',title:'Smart Water & Gas Metering',short:'Water & gas',catalog:'water-gas-meters',description:'Make every resource count with connected measurement.',image:image(page('water-gas-meters'))},
 {slug:'digital-grid-distribution-monitoring',title:'Digital Grid Distribution & Monitoring',short:'Digital grid',catalog:'digital-grid-distribution-monitoring',description:'See more of your distribution network. Act with confidence.',image:image(page('intelligent-power-distribution'))},
 {slug:'energy-storage',title:'Energy Storage',short:'Energy storage',catalog:'energy-storage',description:'Connect renewable generation, storage and changing demand.',image:image(page('renewable-energy'))}
];
const catalogs=['electricity-meters','telecommunications','system-software','water-gas-meters','digital-grid-distribution-monitoring','energy-storage'];
const all=new Map();
for(const catalog of catalogs){for(const p of getProductCatalog(catalog,{pages:PAGES})?.items||[]){if(!all.has(p.url)){const slug=p.slug||'product-'+slugify(p.title);const facts=enriched[p.url]||{};all.set(p.url,{...p,...facts,slug,title:cleanTitle(p),catalog,category:'Products',pageType:'detail',summary:facts.summary||p.summary||p.description,paragraphs:facts.paragraphs||p.paragraphs||[],features:facts.features||p.features||[],tables:facts.tables||p.tables||[],downloads:facts.downloads||p.downloads||[],images:facts.images||p.images||[],image:facts.image||p.image||supplementalImages[p.url]||'',captured:!!p.slug||!!facts.sourceFetchStatus});}}}
export const PRODUCTS=[...all.values()].filter((p,i,a)=>a.findIndex(x=>x.slug===p.slug)===i);
const leaf=(label,catalog,match)=>({label,slug:'category-'+slugify(label),catalog,match});
export const LEAF_CATEGORIES=[
 leaf('aMeter100/300 IEC','electricity-meters','ameter100|ameter300'),leaf('aMeter100/300(EU) IEC','electricity-meters','ameter100|ameter300'),leaf('aMeter151/351 IEC','electricity-meters','ameter151|ameter351'),leaf('aMeter100 (DT) IEC','electricity-meters','ameter100'),leaf('Libra 1C/3C ANSI','electricity-meters','libra'),
 leaf('G3-PLC','telecommunications','g3|plc'),leaf('BPLC','telecommunications','bplc|plc'),leaf('G3-Hybrid','telecommunications','hybrid|g3'),leaf('Wi-SUN','telecommunications','wisun|wi-sun'),leaf('GPRS','telecommunications','gprs|cellular'),leaf('CAT-1 / 4 / M','telecommunications','cellular|cat-'),
 leaf('WID4000 Data Concentrator','telecommunications','wid4000'),leaf('WID2000 Data Concentrator','telecommunications','wid2000'),leaf('WIR-3000 Router','telecommunications','wir-3000'),leaf('Head End System','system-software','head.end|meter.data.reading'),leaf('Smart Network Management System','system-software','network|device.integration'),
 leaf('DTSD341','electricity-meters','dtsd341'),leaf('DDS102','electricity-meters','dds102'),leaf('DDSD101-J6','electricity-meters','ddsd101'),leaf('Libra 1A ANSI','electricity-meters','libra.1'),leaf('BURIT100','electricity-meters','burit'),leaf('WIMC300','electricity-meters','wimc|cabinet'),
 leaf('Prepayment Vending Management System','system-software','prepayment.vending'),leaf('Key Management System','system-software','key.management'),leaf('Public Key Infrastructure','system-software','pki|public.key'),
 leaf('Smart Gas Meters','water-gas-meters','gas'),leaf('Smart Ultrasonic Water Meter','water-gas-meters','ultrasonic|lxc'),leaf('Smart Mechanical Water','water-gas-meters','i-110|c-210|mechanical'),
 leaf('Distribution Transformers','digital-grid-distribution-monitoring','transformer'),leaf('Smart RMU','digital-grid-distribution-monitoring','rmu|ring'),leaf('Auto Recloser & RTU','digital-grid-distribution-monitoring','recloser|rtu'),leaf('Smart Fault Indicator (OHL / Cable)','digital-grid-distribution-monitoring','fault'),leaf('Distribution RTU / IoT Edge','digital-grid-distribution-monitoring','rtu|iot'),leaf('Transformer Monitoring','digital-grid-distribution-monitoring','transformer'),leaf('Intelligent Circuit Breakers / MCB','digital-grid-distribution-monitoring','breaker|mcb'),
 leaf('Battery Container','energy-storage','container'),leaf('Battery Cabinet','energy-storage','cabinet'),leaf('PCS-Booster Integrated Equipment','energy-storage','pcs|booster|inverter'),leaf('C&I BESS','energy-storage','commercial|industrial|storage')
];
export const CHALLENGES=[
 {slug:'revenue-assurance-energy-access',title:'Revenue Assurance & Energy Access',short:'Protect every unit of energy.',layout:'revenue',intro:'Turn accurate measurement into a stronger revenue cycle and wider access to electricity.',image:image(page('energy-loss-reduction-solutions')),solutions:['ami-solution','meter-to-cash-solutions','prepayment-solutions','energy-loss-reduction-solutions','centralised-metering','large-power-user-metering']},
 {slug:'grid-reliability-resilience',title:'Grid Reliability & Resilience',short:'Keep the power flowing.',layout:'reliability',intro:'Connect the condition of your assets to the decisions that keep the network running.',image:image(page('tms-transformer-monitoring-system')),solutions:['smart-mv-distribution-solution','tms-transformer-monitoring-system']},
 {slug:'grid-flexibility-ders',title:'Grid Flexibility & DERs',short:'Make room for a new energy mix.',layout:'flexibility',intro:'Bring generation, storage and demand into a more adaptable energy system.',image:image(page('the-intelligent-microgrid-energy-station-project')),solutions:['power-plant-side-solution','power-grid-side-solution','microgrid-solution','ci-bess-solutions']},
 {slug:'multi-utility-sustainability',title:'Multi-Utility Sustainability',short:'Every resource. One connected view.',layout:'multiutility',intro:'Explore smarter measurement for the water and gas networks your community depends on.',image:image(page('water-gas-meters')),solutions:['smart-water-metering-solutions','smart-gas-metering-solutions']}
];
const solution=(slug,title,sourceSlug,challenge,products=[],cases=[])=>({slug,title,source:page(sourceSlug),sourceSlug,challenge,products,cases,category:'Solutions',pageType:'detail',url:page(sourceSlug)?.url||'https://en.wasion.com/solutions.html',image:image(page(sourceSlug)),summary:page(sourceSlug)?.summary||''});
export const SOLUTIONS=[
 solution('ami-solution','Advanced Metering Infrastructure (AMI)','cellular-based-ami-solutions',0,['ameter100-single-phase-smart-energy-meter','ameter300-three-phase-smart-energy-meter','meter-data-reading'],['breb-epc-for-ami-project','cie-ami-project-in-cote-divoire']),
 solution('meter-to-cash-solutions','Meter-to-Cash Solutions','energy-pro',0,['utilities-customer-information-systems','prepayment-vending-management-system','meter-data-reading']),
 solution('prepayment-solutions','Prepayment Solutions','prepayment-solutions',0,['prepayment-vending-management-system','ameter100-kt-single-phase-smart-meter'],['breb-epc-for-ami-project']),
 solution('energy-loss-reduction-solutions','Energy Loss Reduction','energy-loss-reduction-solutions',0,['ameter100-single-phase-smart-energy-meter','ameter300-three-phase-smart-energy-meter'],['cie-ami-project-in-cote-divoire']),
 solution('centralised-metering','Centralised Metering','cluster-metering-solutions',0,['wasion-metering-cabinet-large-power-unit']),
 solution('large-power-user-metering','Large Power User Metering','cluster-metering-solutions',0,['ameter300-ctvt-three-phase-smart-energy-meter','wasion-metering-cabinet-large-power-unit']),
 solution('smart-mv-distribution-solution','Smart MV Distribution Solution','intelligent-power-distribution',1),
 solution('tms-transformer-monitoring-system','Transformer Monitoring Solution','tms-transformer-monitoring-system',1),
 solution('power-plant-side-solution','Power Plant-Side Solution','renewable-energy',2),solution('power-grid-side-solution','Power Grid-Side Solution','renewable-energy',2),
 solution('microgrid-solution','Microgrid Solution','renewable-energy',2,[],['the-intelligent-microgrid-energy-station-project']),solution('ci-bess-solutions','C&I BESS Solutions','renewable-energy',2,[],['agricultural-pv-and-energy-storage-complementary-project']),
 solution('smart-water-metering-solutions','Smart Water Metering Solutions','walk-drive-by-solutions',3,['lxc-ultrasonic-water-meter','i-110-series-smart-water-meter']),solution('smart-gas-metering-solutions','Smart Gas Metering Solutions','water-gas-meters',3)
];
export const CASES=PAGES.filter(p=>p.category==='Success Stories'&&p.pageType==='detail').map(p=>({...p,title:cleanTitle(p),image:image(p),region:(p.paragraphs.find(t=>/^Country or Region\s*:/i.test(t))||'').replace(/^Country or Region\s*:\s*/i,'')||'Global',topic:/storage|microgrid|photovoltaic|PV/i.test(p.title)?'Energy storage':'Electricity metering'}));
export const NEWS=[...PAGES.filter(p=>p.category==='Newsroom'&&p.pageType==='detail'),DTECH].map(p=>({...p,title:cleanTitle(p),image:image(p),...NEWS_METADATA[p.slug]})).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
export const RESOURCE_ITEMS=(page('resources')?.resourceItems||[]).map((r,i)=>({...r,id:'resource-'+i,image:asset(r.image||''),description:/Hungary/i.test(r.title)?'Wasion Hungary publication. Refer to the document for its exact entity and scope.':'Published Wasion document.',region:/Hungary|GDPR-HU/i.test(`${r.title} ${r.url}`)?'Hungary':'Global',topic:/ISO|Certificate|MID/i.test(r.title)?'Certifications':/G3|Telecom/i.test(r.title)?'Communications':/AMI|Meters/i.test(r.title)?'Metering':/Policy|Privacy|GDPR/i.test(r.title)?'Policies':'Company',type:r.type||'Document'}));
export {FACTORIES,DTECH};
export const METRICS=[{value:'1,200+',label:'R&D personnel',primary:true},{value:'9.4%',label:'Investment in R&D',primary:true},{value:'100M+',label:'Meters delivered'},{value:'50+',label:'Export countries & regions'}];
export const FACT_SOURCE='https://en.wasion.com/about.html';
export const ROUTES=[...new Set(['home','our-offering','products','your-challenges','solutions','company','about','innovation','partners','global-presence','events','media-kit','next-gen-ami','certifications','collateral-videos','case-studies','success-stories','resources','newsroom','contact','careers','search','styles','privacy','ai-search-terms','terms','cookies','accessibility','policy',...PAGES.map(p=>p.slug),...PRODUCTS.map(p=>p.slug),...LEAF_CATEGORIES.map(p=>p.slug),...SOLUTIONS.map(p=>p.slug),...CHALLENGES.map(p=>p.slug),'dtech-2026','electricity-metering-data-management','digital-grid-distribution-monitoring','energy-storage'])];
