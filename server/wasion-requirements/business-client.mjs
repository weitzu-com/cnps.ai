export const BUSINESS_CLIENT=String.raw`
(()=>{
 const bindSwitcher=(selector,trigger,panel)=>document.querySelectorAll(selector).forEach(root=>{
   const buttons=[...root.querySelectorAll(trigger)];
   buttons.forEach(button=>button.addEventListener('click',()=>{
     const key=button.getAttribute(trigger.slice(1,-1));
     buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
     root.querySelectorAll(panel).forEach(p=>{p.hidden=p.getAttribute(panel.slice(1,-1))!==key;});
   }));
 });
 bindSwitcher('[data-architecture]','[data-arch-node]','[data-arch-panel]');
 bindSwitcher('[data-reliability]','[data-grid-point]','[data-grid-detail]');
 bindSwitcher('[data-energy-scenarios]','[data-energy-scene]','[data-energy-panel]');
 bindSwitcher('[data-utility-selector]','[data-utility-select]','[data-utility-detail]');
})();`;
