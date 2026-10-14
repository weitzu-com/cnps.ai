function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
}

export function crmLoginPage(nonce) {
  const safeNonce = escapeAttribute(nonce);
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>身份验证 · CNPS 客户工作台</title>
<style nonce="${safeNonce}">
:root{color-scheme:light;--brand:#001983;--ink:#10213f;--muted:#617088;--paper:#f4f7fb;--line:#dbe2ee;--success:#176246;--error:#a52c32}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:1rem/1.65 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}button,input{font:inherit}[hidden]{display:none!important}a{color:var(--brand)}button,a,input{touch-action:manipulation}:focus-visible{outline:3px solid #5677ed;outline-offset:4px}
.shell{min-height:100svh;display:grid;grid-template-columns:minmax(0,1fr)}.intro{background:var(--brand);color:#fff;padding:1.5rem;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}.brand{display:flex;align-items:center;gap:.8rem;font-size:1.35rem;font-weight:750;letter-spacing:.05em}.brand span{border-left:1px solid #ffffff4d;padding-left:.8rem;font-size:.8rem;font-weight:450;letter-spacing:0;opacity:.78}.intro-content{margin:2.25rem 0 1.5rem}.eyebrow{font:600 .7rem/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.13em;opacity:.67}h1{font-size:clamp(2rem,4vw,3.5rem);font-weight:650;line-height:1.25;letter-spacing:-.035em;margin:1rem 0}h1 span{display:block}.intro-content p{max-width:26rem;margin:1rem 0 0;color:#d7dff5}.scope{display:flex;gap:0;margin:1.75rem 0 0;padding:0;list-style:none;border-top:1px solid #ffffff30;max-width:26rem}.scope li{flex:1;padding:.75rem 0;font-size:.8rem;color:#d7dff5}.scope li+li{padding-left:.9rem;border-left:1px solid #ffffff30}.intro footer{font-size:.75rem;color:#b7c4ed}.form-side{padding:2rem 1.5rem 2.5rem;display:flex;align-items:center;justify-content:center}.card{width:100%;max-width:27rem}h2{font-size:1.65rem;font-weight:650;line-height:1.3;letter-spacing:-.025em;margin:0 0 .7rem}.sub{color:var(--muted);margin:0 0 1.75rem;font-size:.9rem}.field{margin:1.25rem 0}label{display:block;font-size:.9rem;font-weight:600;margin:0 0 .5rem}.input-wrap{display:flex;align-items:center;background:white;border:1px solid #bcc9dc;border-radius:.6rem;overflow:hidden}.prefix{padding:.75rem .9rem;color:var(--muted);border-right:1px solid var(--line)}input{width:100%;min-width:0;padding:.8rem .9rem;background:white;color:var(--ink);border:0;outline:none;border-radius:0}input:focus{box-shadow:inset 0 0 0 2px #476aec}input:disabled{background:#f3f6fa;color:var(--muted)}.code-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.6rem}.code-row input{border:1px solid #bcc9dc;border-radius:.6rem}.hint{display:block;color:var(--muted);font-size:.75rem;margin-top:.4rem}button,.button-link{display:inline-flex;align-items:center;justify-content:center;min-height:3rem;padding:.75rem 1rem;border-radius:.6rem;border:0;cursor:pointer;text-decoration:none;line-height:1.4;font-size:.9rem;font-weight:650;background:var(--brand);color:white}button:disabled{cursor:default;opacity:.55}.secondary{background:#e3eaf8;color:var(--brand)}.submit{width:100%;margin-top:1.2rem}.consent{display:flex;align-items:flex-start;gap:.65rem;font-size:.8rem;font-weight:400;color:var(--muted);margin:1.5rem 0 0}.consent input{width:1.15rem;height:1.15rem;flex:none;padding:0;margin:.15rem 0 0;accent-color:var(--brand)}.status{min-height:1.5rem;margin:1rem 0;font-size:.85rem;color:var(--error);overflow-wrap:anywhere}.status.ok{color:var(--success)}.privacy{border-top:1px solid var(--line);padding-top:1.2rem;margin-top:1.5rem;font-size:.75rem;color:var(--muted)}.text-button{min-height:2.75rem;padding:.4rem 0;background:none;color:var(--brand);text-decoration:underline;text-underline-offset:.25rem}.session-tag{display:inline-flex;gap:.45rem;align-items:center;background:#e5f3ed;color:var(--success);font-size:.8rem;font-weight:600;padding:.4rem .7rem;border-radius:.35rem;margin-bottom:1.2rem}.session-tag:before{content:"";width:.4rem;height:.4rem;border-radius:50%;background:currentColor}.identity{display:grid;grid-template-columns:1fr;gap:0;margin:1.8rem 0;border-top:1px solid var(--line)}.identity div{display:flex;justify-content:space-between;gap:1rem;padding:.85rem 0;border-bottom:1px solid var(--line)}dt{color:var(--muted);font-size:.85rem}dd{margin:0;font-size:.9rem;font-weight:600;text-align:right;overflow-wrap:anywhere}.session-note{color:var(--muted);font-size:.85rem}.session-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.6rem}.loading{color:var(--muted);font-size:.9rem}noscript{display:block;color:var(--error);font-size:.85rem}
@media(min-width:768px){.intro{padding:2.25rem}.intro-content{margin:3rem 0 2.5rem}.form-side{padding:3rem 2.25rem}.brand{font-size:1.5rem}}
@media(min-width:1024px){.shell{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.intro{padding:clamp(2.5rem,5vw,5rem)}.intro-content{margin:4rem 0}.form-side{padding:clamp(2.5rem,5vw,5rem)}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style>
</head>
<body>
<main class="shell">
  <section class="intro" aria-labelledby="intro-title">
    <div class="brand">CNPS.AI <span>客户工作台</span></div>
    <div class="intro-content">
      <div class="eyebrow">CLIENT ACCESS · CNPS</div>
      <h1 id="intro-title">确认身份，<span>连接每一步合作。</span></h1>
      <p>使用手机号登录。项目资料按所属公司与授权范围开放，访问权限由项目对接人管理。</p>
      <ul class="scope" aria-label="资料授权范围"><li>所属公司</li><li>关联项目</li><li>授权资料</li></ul>
    </div>
    <footer>Confidential · 项目资料仅供获授权人员查阅</footer>
  </section>
  <section class="form-side" aria-label="身份验证">
    <div class="card">
      <p class="loading" id="loading" role="status">正在确认登录状态…</p>
      <form id="login" hidden>
        <h2>手机号登录</h2>
        <p class="sub">使用短信验证码验证身份。资料权限以实际授权为准。</p>
        <div class="field">
          <label for="phone">中国大陆手机号</label>
          <div class="input-wrap"><span class="prefix" aria-hidden="true">+86</span><input id="phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="11" pattern="1[3-9][0-9]{9}" required placeholder="请输入11位手机号" aria-describedby="phone-hint"></div>
          <span class="hint" id="phone-hint">请使用您本人持有的手机号。</span>
        </div>
        <div class="field">
          <label for="code">短信验证码</label>
          <div class="code-row"><input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required placeholder="6位验证码" aria-describedby="code-hint"><button type="button" class="secondary" id="send">获取验证码</button></div>
          <span class="hint" id="code-hint">验证码仅用于本次登录，请勿提供给他人。</span>
        </div>
        <label class="consent"><input id="consent" name="consent" type="checkbox" required><span>同意为身份验证、访问授权与登录记录处理手机号，并通过短信服务发送验证码。</span></label>
        <button class="submit" id="submit" type="submit" disabled>验证并登录</button>
        <p class="status" id="status" role="status" aria-live="polite" aria-atomic="true"></p>
        <p class="privacy">手机号用于身份验证与资料访问管理。登录凭据由浏览器安全会话保存。登录不会自动开通其他公司或项目的访问权限；需要资料授权，请联系项目对接人。</p>
      </form>
      <section id="session" aria-labelledby="session-title" hidden>
        <div class="session-tag">身份已验证</div>
        <h2 id="session-title" tabindex="-1">您已登录</h2>
        <p class="sub">登录状态已生效，可继续访问获授权的资料。</p>
        <dl class="identity"><div><dt>登录手机号</dt><dd id="session-phone"></dd></div><div><dt>当前身份</dt><dd id="session-role"></dd></div></dl>
        <p class="session-note">项目资料按公司与授权范围开放。客户方案使用独立访问授权，如提示验证身份，请按该页面完成验证。</p>
        <div class="session-actions"><a class="button-link" href="/crm/workspace">进入客户工作台</a><a class="button-link secondary" href="https://www.cnps.ai/w">查看客户方案</a><button type="button" class="secondary" id="logout">退出登录</button></div>
        <p class="status" id="session-status" role="status" aria-live="polite" aria-atomic="true"></p>
      </section>
      <button type="button" class="text-button" id="retry-session" hidden>重新检查登录状态</button>
      <noscript>请启用浏览器 JavaScript 后使用短信登录。</noscript>
    </div>
  </section>
</main>
<script nonce="${safeNonce}">
(() => {
  'use strict';
const deliveryParams=new URLSearchParams(location.search||'');const deliveryQuery=new URLSearchParams();for(const key of ['companyId','deliveryId','projectId']){const value=deliveryParams.get(key);if(value&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value))deliveryQuery.set(key,value);}if(deliveryQuery.size)document.querySelector('a[href="/crm/workspace"]').href='/crm/workspace?'+deliveryQuery.toString();
  const byId = id => document.getElementById(id);
  const form = byId('login'), send = byId('send'), submit = byId('submit');
  const phone = byId('phone'), code = byId('code'), consent = byId('consent');
  const status = byId('status'), session = byId('session'), sessionStatus = byId('session-status');
  const loading = byId('loading'), retrySession = byId('retry-session'), logout = byId('logout');
  let challenge = '', sentPhone = '', busy = false, countdown = 0, countdownTimer, retryAt = 0, waitingPhone = '';
  const currentPhone = () => phone.value.trim();
  function message(element, text, ok = false) {
    element.textContent = text;
    element.className = 'status' + (ok ? ' ok' : '');
  }
  function updateControls() {
    phone.disabled = busy; code.disabled = busy; consent.disabled = busy;
    send.disabled = busy || countdown > 0;
    submit.disabled = busy || !challenge || sentPhone !== currentPhone() || !/^[0-9]{6}$/.test(code.value) || !consent.checked;
    form.setAttribute('aria-busy', String(busy));
  }
  function resetChallenge() { challenge = ''; sentPhone = ''; code.value = ''; updateControls(); }
  function startCountdown(seconds = 60, number = '') {
    clearInterval(countdownTimer);
    waitingPhone = number;
    retryAt = Date.now() + Math.max(1, Math.ceil(seconds)) * 1000;
    function refresh() {
      countdown = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
      send.textContent = !countdown ? '重新发送' : countdown < 60 ? countdown + '秒后重试' : countdown === 60 ? '60秒后重试' : countdown < 3600 ? Math.ceil(countdown / 60) + '分钟后重试' : Math.ceil(countdown / 3600) + '小时后重试';
      if (!countdown) clearInterval(countdownTimer);
      updateControls();
    }
    refresh();
    countdownTimer = setInterval(() => {
      refresh();
    }, 1000);
  }
  async function request(action, data = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const isSession = action === 'session';
      const response = await fetch(isSession ? '/api/crm?view=session' : '/api/crm', {
        method: isSession ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'X-CNPS-CRM': '1'},
        ...(isSession ? {} : {body: JSON.stringify({action, ...data})})
      });
      if (isSession && response.status === 401) return null;
      let result;
      try { result = await response.json(); } catch { throw new Error('服务暂时不可用，请稍后重试。'); }
      if (!response.ok) {
        const error = new Error(typeof result?.error === 'string' ? result.error.slice(0, 240) : '暂时无法完成，请稍后重试。');
        error.phoneLimited = result?.code === 'SMS_COOLDOWN' || result?.code === 'SMS_PHONE_DAILY_LIMIT';
        const seconds = Number(result?.retryAfterSeconds ?? response.headers?.get('Retry-After'));
        if (response.status === 429 && Number.isFinite(seconds) && seconds > 0) error.retryAfterSeconds = Math.min(Math.ceil(seconds), 32 * 86400);
        else if (action === 'send' && (response.status === 429 || response.status >= 500)) error.retryAfterSeconds = 60;
        throw error;
      }
      return result;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        const failure = new Error(error.name === 'AbortError' ? '请求超时，请检查网络后重试。' : '网络连接异常，请检查网络后重试。');
        if (action === 'send') failure.retryAfterSeconds = 60;
        throw failure;
      }
      throw error;
    } finally { clearTimeout(timeout); }
  }
  async function loadSession(announce = false) {
    retrySession.hidden = true;
    loading.hidden = false;
    try {
      const result = await request('session');
      if (result?.authenticated === true && result.identity && typeof result.identity === 'object') {
        byId('session-phone').textContent = typeof result.identity.phoneMasked === 'string' ? result.identity.phoneMasked : '已验证手机号';
        byId('session-role').textContent = ({admin: '高级管理员', customer: '客户', sales_manager: '销售经理'})[result.identity.role] || '授权用户';
        resetChallenge();
        form.hidden = true; session.hidden = false;
        message(sessionStatus, '');
        if (announce) byId('session-title').focus();
      } else {
        form.hidden = false; session.hidden = true;
        if (announce) message(status, '登录状态未生效，请重新获取验证码。');
      }
    } catch (error) {
      retrySession.hidden = false;
      message(session.hidden ? status : sessionStatus, '登录状态暂时无法确认。' + error.message);
      if (session.hidden) form.hidden = false;
    } finally { loading.hidden = true; }
  }
  phone.addEventListener('input', () => {
    if (waitingPhone && waitingPhone !== currentPhone()) {
      clearInterval(countdownTimer); countdown = 0; waitingPhone = ''; send.textContent = '获取验证码';
    }
    if (challenge && sentPhone !== currentPhone()) {
      resetChallenge(); message(status, '手机号已更改，请为当前手机号获取验证码。');
    }
    updateControls();
  });
  code.addEventListener('input', updateControls);
  consent.addEventListener('change', updateControls);
  send.addEventListener('click', async () => {
    if (busy || countdown > 0) return;
    if (!phone.checkValidity()) { phone.reportValidity(); return; }
    if (!consent.checked) { consent.reportValidity(); return; }
    const number = currentPhone();
    busy = true; updateControls(); message(status, '正在发送验证码…');
    try {
      const result = await request('send', {phone: number, consent: true});
      if (typeof result?.challenge !== 'string' || !result.challenge) throw new Error('验证码请求未完成，请稍后重试。');
      challenge = result.challenge; sentPhone = number; code.value = '';
      startCountdown(60, number); message(status, '验证码已发送，请查看短信并输入6位验证码。', true);
    } catch (error) {
      if (error.retryAfterSeconds) startCountdown(error.retryAfterSeconds, error.phoneLimited ? number : '');
      message(status, error.message);
    }
    finally { busy = false; updateControls(); if (challenge) code.focus(); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!challenge || sentPhone !== currentPhone()) { message(status, '请先为当前手机号获取验证码。'); return; }
    busy = true; updateControls(); message(status, '正在验证身份…');
    try {
      const result = await request('verify', {phone: currentPhone(), code: code.value, challenge});
      if (result?.ok !== true) throw new Error('验证未完成，请重试。');
      resetChallenge();
      await loadSession(true);
    } catch (error) { message(status, error.message); }
    finally { code.value = ''; busy = false; updateControls(); }
  });
  logout.addEventListener('click', async () => {
    if (logout.disabled) return;
    logout.disabled = true; message(sessionStatus, '正在退出登录…');
    try {
      const result = await request('logout');
      if (result?.ok !== true) throw new Error('退出未完成，请重试。');
      clearInterval(countdownTimer); countdown = 0; waitingPhone = ''; send.textContent = '获取验证码';
      resetChallenge(); code.value = ''; consent.checked = false;
      byId('session-phone').textContent = ''; byId('session-role').textContent = '';
      session.hidden = true; form.hidden = false; retrySession.hidden = true;
      message(status, '已退出登录。', true); phone.focus(); updateControls();
    } catch (error) { message(sessionStatus, error.message); }
    finally { logout.disabled = false; }
  });
  retrySession.addEventListener('click', () => loadSession(true));
  updateControls();
  loadSession();
})();
</script>
</body>
</html>`;
}
