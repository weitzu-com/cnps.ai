const buttons=[...document.querySelectorAll('[data-mode]')];
const status=document.getElementById('reading-status');
const messages={both:'中英对照 / Chinese and English',zh:'当前仅显示中文',en:'Showing English only'};
buttons.forEach(button=>button.addEventListener('click',()=>{
  const mode=button.dataset.mode;
  document.body.dataset.readingMode=mode;
  document.documentElement.lang=mode==='en'?'en':'zh-CN';
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  status.textContent=messages[mode];
}));
document.getElementById('chapter-jump')?.addEventListener('change',event=>{
  const target=document.getElementById(event.target.value);
  if(target){location.hash=target.id;target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
});
