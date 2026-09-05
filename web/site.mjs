import {ui} from '/assets/ui.mjs';
const locale=document.body.dataset.locale||'en',t=ui(locale);
const menu=document.querySelector('.menu-toggle'), mobile=document.getElementById('mobile-nav');
function closeMenu(){if(menu){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label',t.menu);mobile.hidden=true;}}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?t.close:t.menu);mobile.hidden=!open;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();document.querySelectorAll('.language-switch[open]').forEach(d=>d.open=false);}});
document.addEventListener('click',event=>{document.querySelectorAll('.language-switch[open]').forEach(d=>{if(!d.contains(event.target))d.open=false;});});
matchMedia('(min-width:1024px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
const query=new URLSearchParams(location.search);
const campaignKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
const trackingKeys=[...campaignKeys,'source','content','case','workflow'];
const cleanId=v=>typeof v==='string'&&/^[a-zA-Z0-9_.-]{1,80}$/.test(v)?v:'';
const pick=(obj,keys)=>Object.fromEntries(keys.filter(k=>cleanId(obj[k])).map(k=>[k,obj[k]]));
const safeQuery=pick(Object.fromEntries(query),trackingKeys),now=Date.now();let previous={};
try{const old=JSON.parse(sessionStorage.getItem('cnps-fastgpt-attribution')||'{}');if(old.version===2&&Number.isFinite(old.lastSeenAt)&&now>=old.lastSeenAt&&now-old.lastSeenAt<1800000)previous=pick(old.campaign||{},campaignKeys);}catch{}
const incoming=pick(safeQuery,campaignKeys),websiteDefault=incoming.utm_source==='cnps.ai'&&incoming.utm_medium==='website'&&['fastgpt','cnps-ai'].includes(incoming.utm_campaign);
let campaign=previous;
if(Object.keys(incoming).length&&!websiteDefault){const same=['utm_source','utm_medium','utm_campaign'].every(k=>incoming[k]===previous[k]);campaign=same&&safeQuery.source&&safeQuery.content?{...previous,...incoming}:incoming;}
try{if(Object.keys(campaign).length)sessionStorage.setItem('cnps-fastgpt-attribution',JSON.stringify({version:2,lastSeenAt:now,campaign}));else sessionStorage.removeItem('cnps-fastgpt-attribution');}catch{}
const pageSource=(document.body.dataset.route||'home').replace(/[^a-zA-Z0-9_.-]/g,'-').replace(/^-|-$/g,'')||'home';
const details={source:safeQuery.source||pageSource,content:safeQuery.content||'direct-entry',...pick(safeQuery,['case','workflow'])};
const caseMatch=location.pathname.match(/\/(?:fastgpt\/cases|case-studies)\/([^/]+)$/),workflowMatch=location.pathname.match(/\/fastgpt\/solutions\/([^/]+)$/);
if(caseMatch&&cleanId(caseMatch[1]))details.case=caseMatch[1];if(workflowMatch&&cleanId(workflowMatch[1]))details.workflow=workflowMatch[1];
for(const a of document.querySelectorAll('a[data-language]')){
 const u=new URL(a.href);for(const [key,value]of Object.entries({...campaign,...safeQuery,...pick(Object.fromEntries(query),['solution','product'])}))u.searchParams.set(key,value);u.hash=location.hash;a.href=u.pathname+u.search+u.hash;
}
let ctaCount=0;
for(const a of document.querySelectorAll('a[href]')){
 let u;try{u=new URL(a.href,location.href);}catch{continue;}if(u.origin!==location.origin||a.dataset.language||!/^\/(en|zh|ar)(\/|$)/.test(u.pathname))continue;
 for(const k of campaignKeys)u.searchParams.delete(k);for(const [k,v]of Object.entries(campaign))u.searchParams.set(k,v);
 if(u.pathname.includes('/fastgpt')||u.pathname.includes('/request-quote')){
  const source=pageSource;
  const content='cta-'+(++ctaCount);a.dataset.ctaSource=source;a.dataset.ctaContent=content;
  u.searchParams.set('source',source);u.searchParams.set('content',content);for(const k of ['case','workflow'])if(details[k]&&!u.searchParams.has(k))u.searchParams.set(k,details[k]);
  if(!u.searchParams.has('utm_source'))u.searchParams.set('utm_source','cnps.ai');
  if(!u.searchParams.has('utm_medium'))u.searchParams.set('utm_medium','website');
  if(!u.searchParams.has('utm_campaign'))u.searchParams.set('utm_campaign',u.pathname.includes('fastgpt')?'fastgpt':'cnps-ai');if(!Object.keys(campaign).length)u.searchParams.set('utm_content',content);
 }
 a.href=u.pathname+u.search+u.hash;
}
for(const collection of document.querySelectorAll('[data-collection]')){
 const input=collection.querySelector('[data-search-input]'),filters=[...collection.querySelectorAll('[data-filter]')],cards=[...collection.querySelectorAll('[data-category]')];let category='All';
 const normalize=s=>s.toLocaleLowerCase(locale).normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f]/g,'');
 function filter(){let count=0;const search=normalize(input.value.trim());for(const card of cards){card.hidden=(category!=='All'&&card.dataset.category!==category)||!normalize(card.dataset.search).includes(search);if(!card.hidden)count++;}collection.querySelector('.result-count').textContent=locale==='ar'?`عدد النتائج: ${count}`:`${count} ${t.results}`;collection.querySelector('[data-empty]').hidden=count>0;}
 input.addEventListener('input',filter);collection.querySelector('[data-clear-search]').addEventListener('click',()=>{input.value='';input.focus();filter();});
 filters.forEach(btn=>btn.addEventListener('click',()=>{category=btn.dataset.filter;filters.forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));filter();}));filter();
}
document.querySelectorAll('[data-product-image]').forEach(btn=>btn.addEventListener('click',()=>{document.getElementById('product-main').src=btn.dataset.productImage;document.querySelectorAll('[data-product-image]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));}));
document.querySelectorAll('[data-print]').forEach(btn=>btn.addEventListener('click',()=>window.print()));
const report=document.querySelector('.report-prose');
if(report){
 const toc=document.querySelector('.report-toc');if(innerWidth<1024)toc.open=false;
 const sections=[...report.querySelectorAll('h2[id]')];
 const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(!visible.length)return;const id=visible[0].target.id;toc.querySelectorAll('a').forEach(a=>{const active=a.hash==='#'+id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});},{rootMargin:'-100px 0px -65% 0px'});sections.forEach(el=>observer.observe(el));
 const progress=()=>{const rect=report.getBoundingClientRect();const n=Math.max(0,Math.min(100,100*(-rect.top+100)/(report.offsetHeight-innerHeight+100)));document.documentElement.style.setProperty('--progress',n+'%');};addEventListener('scroll',progress,{passive:true});progress();
}
const canvas=document.querySelector('.orb-canvas');
if(canvas){
 const ctx=canvas.getContext('2d'),toggle=document.querySelector('[data-orbit-toggle]'),reduced=matchMedia('(prefers-reduced-motion:reduce)');let paused=reduced.matches,visible=true,angle=.6,frame=0,last=0,width=0,height=0,dpr=1,pointer=0;
 const points=[];for(let lat=-80;lat<=80;lat+=8)for(let lon=0;lon<360;lon+=10){const la=lat*Math.PI/180,lo=lon*Math.PI/180;points.push([Math.cos(la)*Math.cos(lo),Math.sin(la),Math.cos(la)*Math.sin(lo)]);}
 function size(){const box=canvas.getBoundingClientRect();width=box.width;height=box.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;draw();}
 function project([x,y,z]){const a=angle+pointer,rx=x*Math.cos(a)-z*Math.sin(a),rz=x*Math.sin(a)+z*Math.cos(a),ry=y*.94-rz*.24,zz=y*.24+rz*.94;const f=1+zz*.1,r=width*.34;return[width/2+rx*r*f,height/2+ry*r*f,zz];}
 function draw(){if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);const glow=ctx.createRadialGradient(width*.51,height*.48,0,width*.5,height*.5,width*.47);glow.addColorStop(0,'rgba(37,159,159,.15)');glow.addColorStop(.6,'rgba(21,96,113,.09)');glow.addColorStop(1,'rgba(8,27,41,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  for(const lat of [-60,-30,0,30,60]){ctx.beginPath();for(let lon=0;lon<=360;lon+=3){const la=lat*Math.PI/180,lo=lon*Math.PI/180;const p=project([Math.cos(la)*Math.cos(lo),Math.sin(la),Math.cos(la)*Math.sin(lo)]);if(lon===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);}ctx.strokeStyle='rgba(108,229,223,.1)';ctx.lineWidth=.7;ctx.stroke();}
  for(const p of points.map(project).sort((a,b)=>a[2]-b[2])){ctx.fillStyle=`rgba(120,229,220,${.13+(p[2]+1)*.25})`;ctx.beginPath();ctx.arc(p[0],p[1],.65+(p[2]+1)*.55,0,Math.PI*2);ctx.fill();}
  for(let i=0;i<3;i++){const a=angle*1.4+i*2.094,x=width/2+Math.cos(a)*width*.45,y=height/2+Math.sin(a)*height*.29;ctx.save();ctx.translate(width/2,height/2);ctx.rotate(-.28+i*.35);ctx.beginPath();ctx.ellipse(0,0,width*.44,height*.28,0,0,Math.PI*2);ctx.strokeStyle='rgba(108,229,223,.13)';ctx.lineWidth=1;ctx.stroke();ctx.restore();ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='#9bf3e9';ctx.shadowColor='#6ce5df';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;}}
 function tick(time){frame=0;if(paused||!visible||document.hidden)return;if(time-last>40){angle+=.003;draw();last=time;}frame=requestAnimationFrame(tick);}
 function start(){if(!frame&&!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
 function state(){toggle.textContent=paused?t.resume:t.pause;toggle.setAttribute('aria-pressed',String(paused));if(paused){cancelAnimationFrame(frame);frame=0;draw();}else start();}
 toggle.addEventListener('click',()=>{paused=!paused;state();});reduced.addEventListener('change',e=>{paused=e.matches;state();});new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)start();}).observe(canvas);document.addEventListener('visibilitychange',start);canvas.parentElement.addEventListener('pointermove',e=>{if(paused)return;const box=canvas.getBoundingClientRect();pointer=((e.clientX-box.left)/box.width-.5)*.12;});new ResizeObserver(size).observe(canvas);size();state();
}
const form=document.getElementById('inquiry-form');
if(form){form.addEventListener('submit',e=>e.preventDefault());initializeForm().catch(()=>{document.getElementById('inquiry-status').textContent=t.unavailable;});}
async function initializeForm(){
 const {validateConfig,submitInquiry,sanitizeTracking,clean}=await import('/fastgpt-assets/inquiry.mjs');
 const fieldset=form.querySelector('fieldset'),submit=document.getElementById('submit-inquiry'),status=document.getElementById('inquiry-status'),output=document.getElementById('brief-output'),briefStatus=document.getElementById('brief-status'),briefText=document.getElementById('brief-text');let config=null,configResolved=false,pending=false,submitted=false,brief='';
 const param=query.get('workflow')||query.get('solution');if(param&&[...form.elements.workflow.options].some(o=>o.value===param))form.elements.workflow.value=param;
 const configReady=fetch('/fastgpt-assets/hubspot-config.json',{signal:AbortSignal.timeout(5000)}).then(r=>{if(!r.ok)throw Error('unconfigured');return r.json();}).then(c=>{config=validateConfig(c);if(!pending&&!submitted)submit.textContent=t.send;}).catch(()=>{status.textContent=t.unavailable;submit.textContent=t.draft;}).finally(()=>{configResolved=true;});
 const tracking=()=>sanitizeTracking({...campaign,...details});
 const values=()=>({...Object.fromEntries(new FormData(form)),consent:form.elements.consent.checked});
 function buildBrief(v){const subject=locale==='zh'?'CNPS 项目询盘':locale==='ar'?'استفسار مشروع CNPS':'CNPS project inquiry';const details=[[t.name,clean(v.name,100)],[t.workEmail,clean(v.email,254)],[t.company,clean(v.company,150)],[t.region,clean(v.region,100)],[t.interest,form.elements.workflow.selectedOptions[0]?.text||''],[t.need,clean(v.need,1600)],[t.systems,clean(v.systems,600)]];return subject+'\n\n'+details.map(([k,v])=>k+': '+v).join('\n\n')+'\n\nCNPS.AI — '+locale+'\n'+Object.entries(tracking()).map(([k,v])=>k+': '+v).join('\n')+(cleanId(query.get('product'))?'\nProduct: '+query.get('product'):'');}
 function showDraft(v,message){brief=buildBrief(v);briefText.value=brief;document.getElementById('email-draft').href=`mailto:sales@cnps.ai?subject=${encodeURIComponent((form.dataset.kind==='fastgpt'?'FastGPT':'CNPS.AI')+' — '+clean(v.company,100))}&body=${encodeURIComponent(brief)}`;output.hidden=false;briefStatus.textContent=message;briefText.focus();}
 function validBrief(){
  for(const name of ['name','company','region'])form.elements[name].setCustomValidity(clean(form.elements[name].value)?'':t.meaningful);
  form.elements.need.setCustomValidity(clean(form.elements.need.value,1600).length>=15?'':t.minimumNeed);
  form.elements.email.setCustomValidity(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(form.elements.email.value,254))?'':t.validEmail);
  return [...form.querySelectorAll('input:not([type=checkbox]),select,textarea')].every(f=>f.reportValidity());
 }
 document.getElementById('prepare-email').addEventListener('click',()=>{if(pending||!validBrief())return;showDraft(values(),submitted?t.alreadySent:t.draftReady);});
 form.addEventListener('input',event=>{if(pending)return;event.target.setCustomValidity?.('');submitted=false;submit.disabled=false;submit.textContent=config||!configResolved?t.send:t.draft;status.textContent='';output.hidden=true;});
 form.addEventListener('submit',async e=>{e.preventDefault();if(pending||submitted||!validBrief()||!form.reportValidity())return;const v=values();pending=true;fieldset.disabled=true;form.setAttribute('aria-busy','true');status.textContent=t.sending;status.dataset.state='';output.hidden=true;submit.textContent=t.sending;
  try{await configReady;if(!config)throw Error('unconfigured');const safe=tracking(),uri=new URL(location.href);uri.search='';uri.hash='';for(const[k,v]of Object.entries(safe))uri.searchParams.set(k,v);const fieldValues={name:clean(v.name,100),email:clean(v.email,254),company:clean(v.company,150),region:clean(v.region,100),subject:(form.dataset.kind==='fastgpt'?'FastGPT pilot inquiry':'CNPS.AI inquiry')+' — '+clean(v.company,100),message:buildBrief(v)+'\n\n'+t.consent};const payload={fields:Object.entries(fieldValues).map(([key,value])=>({objectTypeId:'0-1',name:config.fields[key],value})),context:{pageUri:uri.href,pageName:document.title},legalConsentOptions:{consent:{consentToProcess:true,text:t.consent,communications:[]}}};await submitInquiry(config,payload);submitted=true;status.textContent=t.sent;submit.textContent=t.sentButton;
  }catch(error){status.dataset.state='error';status.textContent=error.message==='unconfigured'?t.unavailable:t.failed;showDraft(v,error.message==='unconfigured'?t.draftReady:t.failed);submit.textContent=config?t.send:t.draft;
  }finally{pending=false;fieldset.disabled=false;submit.disabled=submitted;form.removeAttribute('aria-busy');if(submitted)status.focus();}}
 );
 document.getElementById('copy-brief').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(brief);briefStatus.textContent=t.copied;}catch{briefText.select();briefStatus.textContent=t.copyFailed;}});
 document.getElementById('download-brief').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([brief],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='cnps-inquiry-'+locale+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 fieldset.disabled=false;status.textContent='';await configReady;
}
