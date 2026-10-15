export const COMPANY_CLIENT=String.raw`
document.querySelectorAll('[data-timeline]').forEach(function(root){
 var tabs=Array.from(root.querySelectorAll('[data-timeline-tab]')),panels=Array.from(root.querySelectorAll('[data-timeline-panel]'));
 function select(index,focus){tabs.forEach(function(t,i){t.setAttribute('aria-selected',String(i===index));t.tabIndex=i===index?0:-1});panels.forEach(function(p,i){p.hidden=i!==index});if(focus)tabs[index].focus()}
 tabs.forEach(function(tab,i){tab.addEventListener('click',function(){select(i,false)});tab.addEventListener('keydown',function(event){var next=i;if(event.key==='ArrowRight')next=(i+1)%tabs.length;else if(event.key==='ArrowLeft')next=(i-1+tabs.length)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();select(next,true)})});
});
document.querySelectorAll('[data-presence]').forEach(function(root){
 var choices=Array.from(root.querySelectorAll('[data-presence-region]')),points=Array.from(root.querySelectorAll('[data-map-key]')),items=Array.from(root.querySelectorAll('[data-presence-item]')),detail=root.querySelector('[data-map-detail]');
 function show(key){var item=items.find(function(x){return x.dataset.key===key});if(!item)return;var title=item.querySelector('strong'),kind=item.querySelector('.wr-location-title>span'),body=item.querySelector('[data-location-description]');detail.innerHTML='<span class="wr-eyebrow"></span><h3></h3>'+body.innerHTML;detail.querySelector('.wr-eyebrow').textContent=kind.textContent;detail.querySelector('h3').textContent=title.textContent;points.forEach(function(p){p.classList.toggle('is-selected',p.dataset.mapKey===key)})}
 function region(value){choices.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.presenceRegion===value))});items.forEach(function(item){item.hidden=value!=='All regions'&&item.dataset.region!==value});points.forEach(function(p){p.classList.toggle('is-dimmed',value!=='All regions'&&p.dataset.mapRegion!==value)});var first=items.find(function(i){return !i.hidden});if(first)show(first.dataset.key)}
 choices.forEach(function(b){b.addEventListener('click',function(){region(b.dataset.presenceRegion)})});
 root.querySelectorAll('[data-map-select]').forEach(function(b){b.addEventListener('click',function(){show(b.dataset.mapSelect)})});
 points.forEach(function(point){function activate(){show(point.dataset.mapKey)}point.addEventListener('pointerenter',activate);point.addEventListener('focus',activate);point.addEventListener('click',activate);point.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}})});
 region(root.dataset.defaultRegion||'All regions');
});
`;
