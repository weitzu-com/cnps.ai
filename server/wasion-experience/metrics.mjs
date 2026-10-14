// The visual spans are aria-hidden; the shell retains the exact source figures
// separately for assistive technology and as the server-rendered fallback.
export const METRICS_CLIENT = `
(()=>{
 const nodes=[...document.querySelectorAll('[data-wx-counter]')];
 if(!nodes.length)return;
 const motion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
 const states=nodes.map((node,index)=>({node,index,target:Number(node.dataset.wxCounterTarget),decimals:Number(node.dataset.wxCounterDecimals||0),suffix:node.dataset.wxCounterSuffix||'',finalText:node.textContent})).filter(s=>Number.isFinite(s.target)&&s.target>=0&&[0,1].includes(s.decimals));
 if(!states.length)return;
 const region=document.querySelector('#wx-statistics')||document.querySelector('.wx-metrics')||states[0].node;
 const toggle=document.querySelector('#wx-counter-toggle');
 const duration=1800,stagger=120,hold=1200,cycle=duration+(states.length-1)*stagger+hold;
 let frame=null,observer=null,visible=false,elapsed=0,last=null,manualPaused=false,disabled=typeof requestAnimationFrame!=='function';
 const format=(s,value)=>value.toLocaleString('en-US',{minimumFractionDigits:s.decimals,maximumFractionDigits:s.decimals})+s.suffix;
 const running=()=>visible&&!document.hidden&&!motion.matches&&!manualPaused&&!disabled;
 function write(s,text){if(s.node.textContent!==text)s.node.textContent=text}
 function final(){states.forEach(s=>write(s,s.finalText))}
 function stop(){if(frame!==null){cancelAnimationFrame(frame);frame=null}last=null}
 function controls(){if(toggle){toggle.hidden=motion.matches||disabled;toggle.textContent=manualPaused?'Resume statistics':'Pause statistics'}}
 function schedule(){if(frame===null&&running())frame=requestAnimationFrame(tick)}
 function tick(timestamp){frame=null;if(!running()){last=null;return}if(last!==null)elapsed=(elapsed+Math.max(0,timestamp-last))%cycle;last=timestamp;for(const s of states){const progress=Math.max(0,Math.min(1,(elapsed-s.index*stagger)/duration));write(s,progress===1?s.finalText:format(s,s.target*(1-Math.pow(1-progress,3))))}schedule()}
 function visibility(value){visible=value;if(running())schedule();else stop()}
 if(typeof IntersectionObserver==='function'){try{observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.target===region)visibility(entry.isIntersecting&&entry.intersectionRatio>0)},{threshold:[0,.001]});observer.observe(region)}catch{visibility(true)}}else visibility(true);
 document.addEventListener('visibilitychange',()=>{if(running())schedule();else stop()});
 toggle?.addEventListener('click',()=>{manualPaused=!manualPaused;controls();if(running())schedule();else stop()});
 const change=()=>{stop();if(motion.matches)final();else{elapsed=0;schedule()}controls()};
 if(typeof motion.addEventListener==='function')motion.addEventListener('change',change);else motion.addListener?.(change);
 if(motion.matches||disabled)final();controls();
})();
`;
