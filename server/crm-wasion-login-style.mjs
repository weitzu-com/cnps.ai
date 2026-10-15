// The Wasion access screen shares Industrial's visual language. Keep this
// presentation layer separate from the authentication script and generic CRM.
const INDUSTRIAL_LOGIN_CSS = `
.wasion-access{--brand:#001489;--ink:#322d2a;--muted:#65615d;--paper:#f0efe9;--line:#d4d2cc;--control-line:#827e76;position:relative;background:var(--paper);color:var(--ink);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;min-height:100svh;padding:1.5rem 1.25rem 2rem;display:grid;grid-template-columns:minmax(0,1fr);gap:1.75rem;align-content:start}
.wasion-access .intro{display:block;padding:0;background:transparent;color:var(--ink);overflow:visible;min-width:0}
.wasion-access .brand{gap:1rem;font-weight:400;letter-spacing:0;row-gap:.75rem}
.wasion-access .brand .brand-logo{width:11.5625rem;max-width:100%;height:auto;filter:none}
.wasion-access .brand span{display:none;border-color:var(--line);color:var(--muted);font-size:.875rem;opacity:1}
.wasion-access .intro-content,.wasion-access .intro footer{display:none}
.wasion-access .form-side{display:block;padding:0;min-width:0}
.wasion-access .card{width:100%;max-width:30rem;margin-inline:auto}
.wasion-access .form-title{font-family:inherit;font-size:clamp(2rem,3.3vw,2.75rem);font-weight:300;line-height:1.1;letter-spacing:-.04em;margin:0 0 1rem}
.wasion-access .sub{font-size:1rem;line-height:1.6;color:var(--muted);margin:0 0 1.5rem;max-width:28rem}
.wasion-access .field{margin:1.25rem 0}
.wasion-access label{font-size:.875rem;font-weight:500;line-height:1.5;margin-bottom:.5rem}
.wasion-access .input-wrap{border:1px solid var(--control-line);border-radius:1rem;background:#fff}
.wasion-access .prefix{padding:.85rem 1rem;color:var(--muted);border-right-color:var(--line)}
.wasion-access input:not([type="checkbox"]){font:400 1rem/1.4 'Helvetica Neue',Helvetica,Arial,sans-serif;min-height:3.25rem;padding:.85rem 1rem;color:var(--ink)}
.wasion-access input:focus{box-shadow:inset 0 0 0 2px var(--brand)}
.wasion-access .code-row{display:flex;flex-wrap:wrap;gap:.75rem}
.wasion-access .code-row input{flex:1 1 9rem;border:1px solid var(--control-line);border-radius:1rem}
.wasion-access .hint{font-size:.875rem;line-height:1.5;color:var(--muted);margin-top:.5rem}
.wasion-access button,.wasion-access .button-link{min-height:3.25rem;border:1px solid #242426;border-radius:1rem;padding:.85rem 1.15rem;font-size:.9375rem;line-height:1.4;font-weight:400;background:#242426;color:#fff;box-shadow:none}
.wasion-access button:hover:not(:disabled),.wasion-access .button-link:hover{background:var(--brand);border-color:var(--brand);color:#fff}
.wasion-access .secondary{background:transparent;border-color:var(--control-line);color:var(--ink)}
.wasion-access #send{min-width:6rem;max-width:100%;flex:0 1 auto}
.wasion-access button:disabled{opacity:1;background:#dedcd6;border-color:#dedcd6;color:#65615d;cursor:default}
.wasion-access .submit{width:100%;margin-top:1.25rem}
.wasion-access .consent{font-size:.875rem;line-height:1.5;font-weight:400;color:var(--muted);gap:.75rem;margin:1.5rem 0 0;padding:.25rem 0;min-height:2.75rem}
.wasion-access .consent input{width:1.125rem;height:1.125rem;margin:.1rem 0 0;accent-color:var(--brand)}
.wasion-access .status{font-size:.875rem;line-height:1.5;min-height:1.5rem;margin:1rem 0;overflow-wrap:anywhere}
.wasion-access .access-policy{border-top:1px solid var(--line);margin-top:1.25rem;font-size:.875rem;line-height:1.6;color:var(--muted)}
.wasion-access .access-policy summary{min-height:2.75rem;padding:.65rem 0;display:flex;align-items:center;justify-content:space-between;gap:1rem;cursor:pointer;color:var(--ink);list-style:none}
.wasion-access .access-policy summary::-webkit-details-marker{display:none}
.wasion-access .access-policy summary:after{content:'+';font:400 1.25rem/1 ui-monospace,SFMono-Regular,Consolas,monospace}
.wasion-access .access-policy[open] summary:after{content:'−'}
.wasion-access .access-policy p{font-size:.875rem;line-height:1.6;max-width:none;margin:.5rem 0 1rem;color:var(--muted)}
.wasion-access .access-policy .privacy{border:0;padding:0}
.wasion-access .text-button{background:transparent;color:var(--ink);border:0;padding:.5rem 0;min-height:2.75rem;text-underline-offset:.25rem}
.wasion-access .session-tag{background:#e2e7de;border-radius:.75rem;font-weight:400}
.wasion-access .session-note,.wasion-access .loading,.wasion-access noscript{font-size:.875rem}
.wasion-access :focus-visible{outline:2px solid var(--brand);outline-offset:4px}
@media(min-width:640px){.wasion-access{padding:2rem;gap:2.5rem}.wasion-access .brand span{display:block}}
@media(min-width:1024px){
  .wasion-access{grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:2.5rem;padding:7rem 2.5rem 2.5rem;align-items:stretch;align-content:stretch}
  .wasion-access .intro{display:flex;flex-direction:column;justify-content:space-between;background:#242426;color:#fff;padding:clamp(2rem,3.4vw,4rem);border-radius:2rem;min-height:calc(100svh - 9.5rem)}
  .wasion-access .brand{position:absolute;top:2rem;left:2.5rem;color:var(--ink)}
  .wasion-access .intro-content{display:block;margin:2rem 0}
  .wasion-access .eyebrow{font:400 .875rem/1.45 'SFMono-Regular',Consolas,'Liberation Mono',monospace;letter-spacing:.025em;opacity:1;color:#e2e1dc}
  .wasion-access .intro-content .access-title{font-size:clamp(3.5rem,5.25vw,6rem);font-weight:300;line-height:1.02;letter-spacing:-.045em;max-width:none;color:#fff;margin:1.5rem 0}
  .wasion-access .access-title span{display:block}
  .wasion-access .intro-content>p:not(.access-title){font-size:1rem;line-height:1.6;color:#e2e1dc;max-width:27rem;margin:1.5rem 0 0}
  .wasion-access .scope{max-width:none;border-top-color:#ffffff35;margin-top:2.5rem}
  .wasion-access .scope li{font-size:.875rem;color:#e2e1dc;padding:1rem 0}
  .wasion-access .scope li+li{padding-left:1rem;border-left-color:#ffffff35}
  .wasion-access .intro footer{display:block;font-size:.875rem;line-height:1.5;color:#e2e1dc}
  .wasion-access .form-side{display:flex;align-items:center;padding:1.5rem clamp(.5rem,2.2vw,3rem)}
}
`;

export function applyWasionIndustrialLogin(html) {
  // Move the existing translated policy, rather than duplicating time periods
  // or authorization copy that could drift from the shared login renderer.
  const headingAndPolicy = /<h2>Verify your mobile number<\/h2>\s*(<p class="sub">[\s\S]*?<\/p>)/;
  const policy = html.match(headingAndPolicy)?.[1];
  if (!policy) return html;
  return html
    .replace('<main class="shell">', '<main class="shell wasion-access">')
    .replace('WASION DEMO · VERIFIED ACCESS', 'WASION INTERNATIONAL')
    .replace('<h1 id="intro-title">Verify once.<span>Explore the Wasion demo.</span></h1>', '<p class="access-title" id="intro-title">Intelligence for<span>the energy ahead.</span></p>')
    .replace(headingAndPolicy, '<h1 class="form-title">Verify your mobile number</h1><p class="sub">Use your mobile number and SMS code to continue.</p>')
    .replace(/<p class="privacy">[\s\S]*?<\/p>/, privacy => `<details class="access-policy"><summary>Session and access details</summary><div>${policy}${privacy}</div></details>`)
    .replace('</style>', `${INDUSTRIAL_LOGIN_CSS}</style>`);
}
