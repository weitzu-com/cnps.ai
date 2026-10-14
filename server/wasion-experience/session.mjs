const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function localLoginURL(value) {
  try {
    const url = new URL(value, 'https://crm.cnps.ai');
    if (url.origin === 'https://crm.cnps.ai' && url.pathname === '/' && !url.username && !url.password) return url.pathname + url.search;
  } catch {}
  return '/';
}

export function renderSessionNotice({ loginUrl = '/' } = {}) {
  return `<section id="wd-session-notice" class="wd-session-notice wd-container" hidden aria-live="polite"><h2 id="wd-session-heading">Confirming your access</h2><p id="wd-session-message" role="status"></p><a id="wd-session-login" class="wd-button" href="${escape(localLoginURL(loginUrl))}" hidden>Sign in again</a><button id="wd-session-retry" class="wd-button" type="button" hidden>Retry access check</button></section>`;
}

export const SESSION_CSS = `.wd-session-action{border:0;background:transparent;color:inherit;padding:.5rem 0;min-height:2.75rem;font-size:.875rem}.wd-session-action:disabled{opacity:.55;cursor:default}.wd-session-notice{margin-block:2rem;padding:1.5rem;border:1px solid var(--line);background:var(--paper)}.wd-session-notice h2{font-size:1.5rem}.wd-session-notice .wd-button{margin-right:.75rem}`;

// Shared by every demo route, including the separate AI-search client. Initial
// access is established by the authenticated server render. A BFCache restore
// must validate both the account session and this page's current authorization.
// CRM_LOGIN_URL and CRM_PAGE_URL are injected by the server's page renderer.
export const SESSION_CLIENT = `
(()=>{
const protectedPage=document.getElementById('wd-protected'),sessionNotice=document.getElementById('wd-session-notice'),sessionHeading=document.getElementById('wd-session-heading'),sessionMessage=document.getElementById('wd-session-message'),sessionLogin=document.getElementById('wd-session-login'),sessionRetry=document.getElementById('wd-session-retry'),logout=document.getElementById('wd-logout');
if(!protectedPage||!sessionNotice||!sessionHeading||!sessionMessage||!sessionLogin||!sessionRetry)return;
let sessionSequence=0,loggingOut=false;
async function sessionRequest(options={},url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{return await fetch(url||'/api/crm'+(options.method?'':'?view=session'),{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json','Content-Type':'application/json','X-CNPS-CRM':'1'},...options,signal:controller.signal});}finally{clearTimeout(timer);}}
function showSessionNotice(heading,message,{retry=false,login=false}={}){sessionNotice.hidden=false;sessionHeading.textContent=heading;sessionMessage.textContent=message;sessionRetry.hidden=!retry;sessionLogin.hidden=!login;}
function hideProtected(){protectedPage.hidden=true;document.querySelectorAll?.('dialog[open]').forEach(dialog=>{try{dialog.close?.()}catch{}});}
async function checkSession(){if(loggingOut)return;const sequence=++sessionSequence;hideProtected();sessionRetry.disabled=true;showSessionNotice('Confirming your access','Please wait while we check your current access.');try{const response=await sessionRequest();if(sequence!==sessionSequence)return;if(response.status===401){showSessionNotice('Please sign in again','Your session has ended or access has been removed.',{login:true});return;}const result=await response.json();if(sequence!==sessionSequence)return;if(!response.ok||result?.authenticated!==true)throw new Error('Your access could not be verified. Please retry.');const pageResponse=await sessionRequest({method:'HEAD',redirect:'manual'},CRM_PAGE_URL);if(sequence!==sessionSequence)return;if(pageResponse.type==='opaqueredirect'||[302,401].includes(pageResponse.status)){showSessionNotice('Please sign in again','Your session has ended or access has been removed.',{login:true});return;}if([403,404].includes(pageResponse.status)){showSessionNotice('This page is unavailable','Your current account is not authorized to view this page. Please contact your project representative.');return;}if(!pageResponse.ok||pageResponse.status!==200)throw new Error('Page access could not be verified.');protectedPage.hidden=false;sessionNotice.hidden=true;}catch{if(sequence===sessionSequence)showSessionNotice('Access could not be confirmed','Please retry the access check. No verification code has been sent.',{retry:true});}finally{if(sequence===sessionSequence)sessionRetry.disabled=false;}}
logout?.addEventListener('click',async()=>{if(loggingOut)return;loggingOut=true;sessionSequence++;logout.disabled=true;try{const response=await sessionRequest({method:'POST',body:JSON.stringify({action:'logout'})});const result=await response.json();if(!response.ok||result?.ok!==true)throw new Error('Sign out was not completed. Please try again.');hideProtected();showSessionNotice('You have signed out','Sign in again to access the customer preview.',{login:true});location.replace(CRM_LOGIN_URL);}catch{loggingOut=false;logout.disabled=false;showSessionNotice('Sign out was not completed','Please try Sign out again. Your session has not been confirmed as ended.');}});
// Native POST reuses the server's existing login recovery without putting a
// freeform question in a URL or browser storage.
sessionLogin.addEventListener('click',event=>{const form=document.getElementById('ws-form'),input=document.getElementById('ws-query');if(form&&input?.value.trim()&&input.value.length<=500){event.preventDefault();form.submit();}});
sessionRetry.addEventListener('click',checkSession);
window.addEventListener('pagehide',()=>{sessionSequence++;hideProtected();});
window.addEventListener('pageshow',event=>{if(event.persisted)checkSession();});
})();
`;
