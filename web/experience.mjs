import {ui} from './ui.mjs';
const locale=document.body.dataset.locale||'en',t=ui(locale);
// All panels and their anchor links work without JavaScript. Enhance to keyboard tabs.
for(const explorer of document.querySelectorAll('[data-explorer]')){
 const list=explorer.querySelector('[data-explorer-tabs]'),tabs=[...list.querySelectorAll('[data-explorer-tab]')],panels=[...explorer.querySelectorAll('[data-explorer-panel]')];
 list.setAttribute('role','tablist');
 function select(tab,focus=false,updateUrl=false){for(const item of tabs){const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;}for(const panel of panels){panel.hidden=panel.dataset.explorerPanel!==tab.dataset.explorerTab;}if(focus)tab.focus();if(updateUrl){history.replaceState(null,'',location.pathname+location.search+tab.hash);document.dispatchEvent(new Event('cnps:section-change'));}}
 for(const tab of tabs){tab.setAttribute('role','tab');tab.setAttribute('aria-controls','experience-'+tab.dataset.explorerTab);tab.addEventListener('click',event=>{event.preventDefault();select(tab,false,true);});tab.addEventListener('keydown',event=>{let i=tabs.indexOf(tab),direction=document.documentElement.dir==='rtl'?-1:1;if(event.key==='ArrowRight')i+=direction;else if(event.key==='ArrowLeft')i-=direction;else if(event.key==='Home')i=0;else if(event.key==='End')i=tabs.length-1;else return;event.preventDefault();select(tabs[(i+tabs.length)%tabs.length],true,true);});}
 for(const panel of panels){panel.setAttribute('role','tabpanel');panel.tabIndex=0;}
 select(tabs.find(tab=>tab.hash===location.hash)||tabs[0]);
 addEventListener('hashchange',()=>{const tab=tabs.find(tab=>tab.hash===location.hash);if(tab)select(tab);});
}
for(const btn of document.querySelectorAll('[data-copy-link]'))btn.addEventListener('click',async()=>{const status=document.querySelector('[data-copy-status]');try{await navigator.clipboard.writeText(document.querySelector('link[rel=canonical]').href);status.textContent=t.linkCopied;}catch{status.textContent=t.linkCopyFailed;}});
// Ambient cues run only while their scene is visible and the tab is foreground.
const scenes=[...document.querySelectorAll('.hero-stage,.experience-photo')];
const visibleScenes=new Set();
const sceneObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visibleScenes.add(entry.target);else visibleScenes.delete(entry.target);}updateScenes();},{threshold:.1});
function updateScenes(){for(const scene of scenes)scene.dataset.sceneActive=String(!document.hidden&&visibleScenes.has(scene));}
scenes.forEach(scene=>sceneObserver.observe(scene));document.addEventListener('visibilitychange',updateScenes);
