// The visual spans are aria-hidden; the shell retains the exact source figures
// separately for assistive technology and as the server-rendered fallback.
export const METRICS_CLIENT = `
(()=>{
 const nodes=[...document.querySelectorAll('[data-wx-counter]')];
 if(!nodes.length)return;
 const motion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
 const states=nodes.map((node,index)=>({node,index,target:Number(node.dataset.wxCounterTarget),decimals:Number(node.dataset.wxCounterDecimals||0),suffix:node.dataset.wxCounterSuffix||'',finalText:node.textContent,started:false,done:false,elapsed:0,last:null})).filter(s=>Number.isFinite(s.target)&&s.target>=0&&[0,1].includes(s.decimals));
 if(!states.length)return;
 const byNode=new Map(states.map(s=>[s.node,s]));
 let frame=null,observer=null;
 const format=(s,value)=>value.toLocaleString('en-US',{minimumFractionDigits:s.decimals,maximumFractionDigits:s.decimals})+s.suffix;
 function finish(s){s.node.textContent=s.finalText;s.done=true;s.last=null;observer?.unobserve(s.node)}
 function stop(){if(frame!==null){cancelAnimationFrame(frame);frame=null}states.forEach(s=>s.last=null)}
 function finishAll(){stop();states.forEach(finish);observer?.disconnect()}
 function schedule(){if(frame===null&&!document.hidden&&!motion.matches&&states.some(s=>s.started&&!s.done)){if(typeof requestAnimationFrame==='function')frame=requestAnimationFrame(tick);else finishAll()}}
 function tick(timestamp){frame=null;if(motion.matches){finishAll();return}if(document.hidden){states.forEach(s=>s.last=null);return}for(const s of states){if(!s.started||s.done)continue;if(s.last!==null)s.elapsed+=Math.max(0,timestamp-s.last);s.last=timestamp;const progress=Math.max(0,Math.min(1,(s.elapsed-s.index*120)/1800));if(progress===1){finish(s);continue}s.node.textContent=format(s,s.target*(1-Math.pow(1-progress,3)))}schedule()}
 function start(s){if(!s||s.started||s.done)return;s.started=true;observer?.unobserve(s.node);schedule()}
 if(motion.matches){finishAll();return}
 if(typeof IntersectionObserver==='function'){try{observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)start(byNode.get(entry.target))},{threshold:.25});states.forEach(s=>observer.observe(s.node))}catch{states.forEach(start)}}else states.forEach(start);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else schedule()});
 const change=()=>{if(motion.matches)finishAll();else schedule()};
 if(typeof motion.addEventListener==='function')motion.addEventListener('change',change);else motion.addListener?.(change);
})();
`;
