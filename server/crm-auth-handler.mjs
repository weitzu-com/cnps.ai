import { randomBytes } from 'node:crypto';
import { CrmSmsFailure } from './crm-sms-failure.mjs';
import { digest, encrypt, decrypt, keyBytes } from './proposal-crypto.mjs';
import { normalizePhone } from './proposal-handler.mjs';
import { SMS_PHONE_DAILY_LIMIT, SMS_GLOBAL_DAILY_LIMIT, SMS_GLOBAL_MONTHLY_LIMIT } from './sms-policy.mjs';
import { crmSmsFailureCategory } from './crm-auth-sms.mjs';
import { crmSmsTransportFailure } from './crm-sms-transport.mjs';

export const CRM_SESSION_COOKIE = '__Host-cnps_crm';
export const CRM_CHALLENGE_COOKIE = '__Host-cnps_crm_challenge';
const PURPOSE = 'crm-auth-v1';
const STAFF_SESSION_SECONDS = 8 * 3600;
const CUSTOMER_SESSION_SECONDS = 30 * 86400;
const CHALLENGE_SECONDS = 300;
const validToken = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
const validId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
const cookie = (name, value, age, sameSite = 'Strict') => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=${age}`;
// A long customer login cannot acquire a short-lived collaboration role.
const verificationRole = identity => identity.role==='admin'?'admin':identity.contexts?.some(c=>c.role==='sales_manager')?'sales_manager':identity.contexts?.some(c=>c.role==='partner')?'partner':identity.role;
const validEpoch = value => Number.isSafeInteger(value) && value >= 0;
const sessionSeconds = role => role === 'customer' ? CUSTOMER_SESSION_SECONDS : STAFF_SESSION_SECONDS;
const roleRank = role => ({ customer: 0, unassigned:0, partner:1, proposal_viewer:1, sales_manager: 2, admin: 3 })[role];
function sendLimitResponse(blocked, timestamp) {
  const chinaTime = new Date(timestamp + 8 * 3600e3);
  const year = chinaTime.getUTCFullYear(), month = chinaTime.getUTCMonth(), day = chinaTime.getUTCDate();
  const secondsUntil = boundary => Math.max(1, Math.ceil((boundary - 8 * 3600e3 - timestamp) / 1000));
  const daySeconds = secondsUntil(Date.UTC(year, month, day + 1));
  const monthSeconds = secondsUntil(Date.UTC(year, month + 1, 1));
  const limits = (Array.isArray(blocked) ? blocked : []).filter(item => Number.isFinite(item?.ttl) && item.ttl > 0).map(item => ({
    kind: item.kind,
    retryAfterSeconds: Math.max(1, Math.ceil(Math.min(item.ttl,
      ['phone-day', 'send-day'].includes(item.kind) ? daySeconds : item.kind === 'send-month' ? monthSeconds : item.ttl)))
  })).sort((a, b) => b.retryAfterSeconds - a.retryAfterSeconds);
  // Several budgets can be exhausted together. Advertise when all current
  // blocks clear, rather than a short cooldown that hides a daily/monthly limit.
  const limit = limits[0];
  if (!limit) return { code: 'SMS_RATE_LIMIT', error: '验证码请求次数已达限额，请稍后重试或联系项目对接人。' };
  const retryAt = new Date(timestamp + limit.retryAfterSeconds * 1000 + 8 * 3600e3);
  const retryTime = `${retryAt.getUTCMonth() + 1}月${retryAt.getUTCDate()}日${String(retryAt.getUTCHours()).padStart(2, '0')}:${String(retryAt.getUTCMinutes()).padStart(2, '0')}`;
  const messages = {
    cooldown: ['SMS_COOLDOWN', `请等待${limit.retryAfterSeconds}秒后重新获取验证码。`],
    'phone-day': ['SMS_PHONE_DAILY_LIMIT', `该手机号今日验证码请求次数已达限额，请于${retryTime}后再试。`],
    'ip-hour': ['SMS_IP_HOURLY_LIMIT', `当前网络验证码请求过于频繁，请在${Math.ceil(limit.retryAfterSeconds / 60)}分钟后重试。`],
    'send-day': ['SMS_DAILY_LIMIT', `今日验证码发送额度已用完，请联系项目对接人，或于${retryTime}后再试。`],
    'send-month': ['SMS_MONTHLY_LIMIT', `本月验证码发送额度已用完，请联系项目对接人，或于${retryTime}后再试。`]
  };
  const [code, error] = messages[limit.kind] || ['SMS_RATE_LIMIT', '验证码请求次数已达限额，请稍后重试或联系项目对接人。'];
  return { code, error, retryAfterSeconds: limit.retryAfterSeconds };
}
function parseCookies(req) {
  const result = {};
  for (const item of String(req.headers.cookie || '').split(';')) {
    const index = item.indexOf('=');
    if (index > 0) result[item.slice(0, index).trim()] = item.slice(index + 1).trim();
  }
  return result;
}
function policy(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
}
async function readJson(req) {
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new Error('Bad body');
  let data;
  if (req.body !== undefined) {
    data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (Buffer.byteLength(JSON.stringify(data) || '') > 2048) throw new Error('Bad body');
  } else {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (Buffer.byteLength(body) > 2048) throw new Error('Bad body');
    }
    data = JSON.parse(body);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Bad body');
  return data;
}

// Directory contract: loadMemberships(normalizedPhone) returns only server-side
// records: [{ companyId, active:true, role:'customer'|'sales_manager', permissions,
//             projectIds?:[], documentIds?:[], authEpoch?:number }]. authEpoch is
// an internal per-phone revocation generation, shared by all its memberships.
// Existing directory entries default to generation zero. Unsupported/inactive entries
// are ignored. Do not infer company membership from a submitted name or email.
// This handler authenticates identity only; every business API must enforce its
// own company/project/document ACL. A returned session is not a Twenty API token.
export function createCrmAuthHandler({ env, storeFactory, smsFactory, loadMemberships = async () => [], recordVisit, loadAccess, reportFailure = event => console.warn('CNPS_CRM_AUTH_FAILURE', JSON.stringify(event)), now = () => Date.now() }) {
  let store;
  const storage = () => store ??= storeFactory(env);
  const adminPhone = () => {
    const phone = normalizePhone(env.CNPS_CRM_ADMIN_PHONE);
    if (!phone) throw new Error('CRM administrator not configured');
    return phone;
  };
  const secret = () => { keyBytes(env.CNPS_PROPOSAL_SECRET); return env.CNPS_PROPOSAL_SECRET; };
  const hash = (purpose, value) => digest(secret(), purpose, value);
  const encryptionKey = () => hash('crm-auth-encryption', 'v1');
  const sealPhone = phone => encrypt(Buffer.from(phone), encryptionKey()).toString('base64url');
  const openPhone = subject => normalizePhone(decrypt(Buffer.from(subject, 'base64url'), encryptionKey()).toString());
  const arrayIds = value => Array.isArray(value) ? [...new Set(value.filter(validId))] : [];
  async function identityFor(phone) {
    const access=loadAccess?await loadAccess(phone):null;
    if(access?.disabled)return null;
    const authVersion=access?.authVersion||0;
    if(phone===adminPhone())return {identity:{role:'admin',phoneMasked:phone.slice(0,3)+'****'+phone.slice(-4),memberships:[],contexts:[],proposals:access?.proposals||[]},authEpoch:0,authVersion};
    const entries=access?.memberships||await loadMemberships(phone);
    const active=(Array.isArray(entries)?entries:[]).filter(e=>e?.active===true&&validId(e.companyId)&&['customer','sales_manager'].includes(e.role));
    if(!access&&!active.length)return null;
    const epochs=active.map(e=>e.authEpoch===undefined?0:e.authEpoch);
    if(epochs.some(e=>!validEpoch(e)||e!==epochs[0]))throw new Error('Invalid authorization generation');
    const memberships=active.map(e=>({companyId:e.companyId,role:e.role,permissions:arrayIds(e.permissions),...(Array.isArray(e.projectIds)?{projectIds:arrayIds(e.projectIds)}:{}),...(Array.isArray(e.documentIds)?{documentIds:arrayIds(e.documentIds)}:{})}));
    const contexts=access?.contexts||[],proposals=access?.proposals||[],roles=[...new Set(contexts.map(c=>c.role))];
    const role=access?(roles.length===1?roles[0]:roles.length>1?'unassigned':proposals.length?'proposal_viewer':'unassigned'):(memberships.some(e=>e.role==='sales_manager')?'sales_manager':'customer');
    return {identity:{role,phoneMasked:phone.slice(0,3)+'****'+phone.slice(-4),memberships,...(access?{contexts,proposals}:{})},authEpoch:epochs[0]||0,authVersion};
  }

  async function loadSession(req) {
    adminPhone();
    const token = parseCookies(req)[CRM_SESSION_COOKIE];
    if (!validToken(token)) return null;
    const session = await storage().get(`session:${hash('crm-session', token)}`);
    if (session?.purpose !== PURPOSE || !Number.isFinite(session.expires) || session.expires <= now() || typeof session.subject !== 'string') return null;
    const phone = openPhone(session.subject);
    if (!phone || hash('phone', phone) !== session.pid) return null;
    const current = await identityFor(phone);
    if (!current) return null;
    const legacy = ['issuedAt', 'roleAtVerification', 'authEpoch'].every(field => session[field] === undefined);
    const issuedAt = legacy ? session.expires - STAFF_SESSION_SECONDS * 1000 : session.issuedAt;
    if (!Number.isFinite(issuedAt) || issuedAt < 0 || issuedAt > now()) return null;
    if (!legacy && (!Number.isInteger(roleRank(session.roleAtVerification)) || !validEpoch(session.authEpoch)
      || session.expires !== issuedAt + sessionSeconds(session.roleAtVerification) * 1000
      || roleRank(verificationRole(current.identity)) > roleRank(session.roleAtVerification))) return null;
    if (current.authVersion !== (session.identityVersion||0) || current.authEpoch !== (legacy ? 0 : session.authEpoch)) return null;
    // Keep the generation on the server principal so a business operation can
    // reject revocation/restoration after this authentication lookup completed.
    return { identity: current.identity, phone, identityId: session.pid, sessionId:hash('crm-session',token), identityVersion:current.authVersion, authEpoch: current.authEpoch, authenticatedAt: issuedAt, expiresAt: session.expires };
  }

  // Exposed for a separately authorized business API to authenticate this cookie.
  // Re-reading the membership directory makes revocation effective immediately.
  const handler = async function handler(req, res) {
    policy(res);
    const json = (status, data) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify(data));
    };
    let failureStage = 'configuration';
    try {
      const url = new URL(req.url, 'https://www.cnps.ai');
      if (url.pathname !== '/api/crm') return json(404, { error: '接口不存在。' });
      // No default administrator and no client-controlled promotion. All CRM
      // authentication stays unavailable until a valid server setting exists.
      adminPhone();
      if (req.method === 'GET' || req.method === 'HEAD') {
        if (url.searchParams.get('view') !== 'session') return json(404, { error: '接口不存在。' });
        failureStage = 'session-read';
        const session = await loadSession(req);
        if (!session) return json(401, { authenticated: false, error: '请先通过短信验证登录。' });
        return json(200, { authenticated: true, identity: session.identity, authenticatedAt: session.authenticatedAt, expiresAt: session.expiresAt });
      }
      if (req.method !== 'POST') return json(405, { error: '请求方式不支持。' });
      const origins = new Set(['https://crm.cnps.ai']);

      if (!origins.has(req.headers.origin) || req.headers['x-cnps-crm'] !== '1') return json(403, { error: '请求来源无效。' });
      let data;
      try { data = await readJson(req); } catch { return json(400, { error: '请求格式无效。' }); }
      const cookies = parseCookies(req);
      if (data.action === 'logout') {
        const token = cookies[CRM_SESSION_COOKIE];
        if (validToken(token)) await storage().del(`session:${hash('crm-session', token)}`);
        res.setHeader('Set-Cookie', [cookie(CRM_SESSION_COOKIE, '', 0, 'Lax'), cookie(CRM_CHALLENGE_COOKIE, '', 0)]);
        return json(200, { ok: true });
      }
      const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
      const ipId = hash('ip', ip);
      if (data.action === 'send') {
        if (data.consent !== true) return json(400, { error: '请先同意身份验证说明。' });
        const phone = normalizePhone(data.phone);
        failureStage = 'authorization';
        const authorization = phone ? await identityFor(phone) : null;
        if (!authorization || authorization.identity.role==='unassigned'&&!authorization.identity.contexts?.length) return json(403, { error: '该手机号暂未获授权，请联系项目对接人。' });
        failureStage = 'sms-configuration';
        const sms = smsFactory(env), pid = hash('phone', phone);
        const sendTime = now(), date = new Date(sendTime + 8 * 3600e3).toISOString();
        const limits = [
          { name: `cooldown:${pid}`, max: 1, ttl: 60 },
          { name: `phone-day:${date.slice(0, 10)}:${pid}`, max: SMS_PHONE_DAILY_LIMIT, ttl: 172800 },
          { name: `ip-hour:${ipId}`, max: 10, ttl: 3600 },
          { name: `send-day:${date.slice(0, 10)}`, max: SMS_GLOBAL_DAILY_LIMIT, ttl: 172800 },
          { name: `send-month:${date.slice(0, 7)}`, max: SMS_GLOBAL_MONTHLY_LIMIT, ttl: 32 * 86400 }
        ];
        failureStage = 'storage';
        const quotaStore = storage();
        const quota = typeof quotaStore.reserveDetailed === 'function'
          ? await quotaStore.reserveDetailed(limits)
          : { allowed: await quotaStore.reserve(limits), blocked: [] };
        if (!quota.allowed) {
          const response = sendLimitResponse(quota.blocked, sendTime);
          if (response.retryAfterSeconds) res.setHeader('Retry-After', String(response.retryAfterSeconds));
          return json(429, response);
        }
        const id = randomBytes(32).toString('base64url'), binding = randomBytes(32).toString('base64url');
        failureStage = 'sms-send';
        await sms.send(phone, id);
        failureStage = 'storage';
        await storage().set(`challenge:${id}`, { purpose: PURPOSE, pid, subject: sealPhone(phone), binding: hash('crm-binding', binding), attempts: 0, authEpoch: authorization.authEpoch, roleAtSend: verificationRole(authorization.identity), identityVersion:authorization.authVersion }, CHALLENGE_SECONDS);
        res.setHeader('Set-Cookie', cookie(CRM_CHALLENGE_COOKIE, binding, CHALLENGE_SECONDS));
        return json(200, { challenge: id });
      }
      if (data.action === 'verify') {
        const binding = cookies[CRM_CHALLENGE_COOKIE];
        if (!validToken(data.challenge) || !validToken(binding) || typeof data.code !== 'string' || !/^\d{6}$/.test(data.code)) return json(400, { error: '验证码无效或已过期，请重新获取。' });
        failureStage = 'storage';
        if (!await storage().reserve([{ name: `verify-ip:${ipId}`, max: 30, ttl: 600 }])) return json(429, { error: '验证过于频繁，请稍后重试。' });
        const bindingId = hash('crm-binding', binding);
        const challenge = await storage().attempt(data.challenge, bindingId);
        if (challenge?.purpose !== PURPOSE || !challenge.subject) return json(400, { error: '验证码无效或已过期，请重新获取。' });
        const phone = openPhone(challenge.subject);
        if (!phone || hash('phone', phone) !== challenge.pid || (data.phone !== undefined && normalizePhone(data.phone) !== phone)) return json(400, { error: '验证码无效或已过期，请重新获取。' });
        failureStage = 'authorization';
        const authorization = await identityFor(phone);
        if (!authorization || authorization.identity.role==='unassigned'&&!authorization.identity.contexts?.length) return json(403, { error: '该手机号暂未获授权，请联系项目对接人。' });
        const challengeEpoch = challenge.authEpoch === undefined ? 0 : challenge.authEpoch;
        if (!validEpoch(challengeEpoch) || challengeEpoch !== authorization.authEpoch || (challenge.identityVersion||0)!==authorization.authVersion
          || (challenge.roleAtSend !== undefined && challenge.roleAtSend !== verificationRole(authorization.identity))) return json(403, { error: '访问授权已变更，请重新获取验证码。' });
        failureStage = 'sms-verify';
        if (!await smsFactory(env).verify(phone, data.code, data.challenge)) return json(400, { error: '验证码无效或已过期，请重新获取。' });
        failureStage = 'storage';
        if (!await storage().consume(data.challenge, bindingId)) return json(400, { error: '验证码已使用，请重新获取。' });
        const unchanged = current => current && current.authEpoch === authorization.authEpoch && current.authVersion===authorization.authVersion && verificationRole(current.identity)===verificationRole(authorization.identity);
        failureStage = 'authorization';
        const latest = await identityFor(phone);
        if (!unchanged(latest)) return json(403, { error: '访问授权已变更，请重新验证身份。' });
        const identity = latest.identity;
        const issuedAt = now(), duration = sessionSeconds(verificationRole(identity)), expires = issuedAt + duration * 1000;
        const token = randomBytes(32).toString('base64url');
        const sessionName = `session:${hash('crm-session', token)}`;
        const visit = { purpose: 'crm-sms-login', identityId: challenge.pid, role: identity.role, companyIds: identity.memberships.map(entry => entry.companyId), occurredAt: issuedAt };
        failureStage = 'storage';
        await storage().set(sessionName, { purpose: PURPOSE, pid: challenge.pid, subject: sealPhone(phone), issuedAt, roleAtVerification: verificationRole(identity), identityVersion:latest.authVersion, authEpoch: authorization.authEpoch, expires }, duration);
        try {
          // Provider checks, Redis writes and audit adapters can yield to a
          // revocation. Never mint a credential for a newer generation simply
          // because access was restored while this verification was in flight.
          failureStage = 'authorization';
          if (!unchanged(await identityFor(phone))) {
            await storage().del(sessionName);
            return json(403, { error: '访问授权已变更，请重新验证身份。' });
          }
          // This record is an access event only; it never creates a lead/company
          // or grants membership. A trusted adapter may link it to an existing CRM contact.
          failureStage = 'login-record';
          await storage().set(`visit:${data.challenge}`, visit, 30 * 86400);
          if (recordVisit) await recordVisit({ ...visit, phone });
          failureStage = 'authorization';
          if (!unchanged(await identityFor(phone))) {
            await storage().del(sessionName);
            return json(403, { error: '访问授权已变更，请重新验证身份。' });
          }
        } catch (error) {
          await storage().del(sessionName);
          throw error;
        }
        const remainingSeconds = Math.ceil((expires - now()) / 1000);
        if (remainingSeconds <= 0) { await storage().del(sessionName); return json(403, { error: '验证已过期，请重新验证身份。' }); }
        res.setHeader('Set-Cookie', [cookie(CRM_SESSION_COOKIE, token, remainingSeconds, identity.role === 'customer' ? 'Lax' : 'Strict'), cookie(CRM_CHALLENGE_COOKIE, '', 0)]);
        return json(200, { ok: true });
      }
      return json(400, { error: '请求操作无效。' });
    } catch (failure) {
      // Log only fixed stages/categories/codes, never provider messages, phone
      // numbers, credentials, cookies, challenge IDs or verification codes.
      const smsFailure = ['sms-send', 'sms-verify'].includes(failureStage);
      const transport = smsFailure ? crmSmsTransportFailure(failure) : undefined;
      try { reportFailure({ stage: failureStage, ...(smsFailure ? { category: crmSmsFailureCategory(failure) } : {}), ...(failure instanceof CrmSmsFailure ? { reason: failure.reason } : {}), ...(transport ? { transport } : {}) }); } catch {}
      const error = failureStage === 'sms-send' ? '短信发送服务暂不可用，请稍后重试。'
        : failureStage === 'sms-verify' ? '短信验证服务暂不可用，请稍后重新获取验证码。'
        : '访问服务暂不可用，请稍后重试或联系项目对接人。';
      return json(503, { error, code: 'CRM_AUTH_UNAVAILABLE', stage: failureStage });
    }
  };
  handler.loadSession = loadSession;
  return handler;
}
