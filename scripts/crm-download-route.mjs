#!/usr/bin/env node
import http from 'node:http';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export const GROUP = 'CNPS CRM下载';
export const MEMBER = '🇺🇸LA-CF优选IP';
const endpoint = '/proxies/' + encodeURIComponent(GROUP);
const canonical = value => JSON.stringify(value, (_, v) => v && !Array.isArray(v) && typeof v === 'object' ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
const hash = value => createHash('sha256').update(canonical(value)).digest('hex');
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };

// Never log request/response bodies, configuration text, or the authorization value.
export function controller({ socketPath, secret, timeoutMs = 2000 }) {
  requireThat(typeof socketPath === 'string' && socketPath.startsWith('/'), 'absolute controller socket required');
  requireThat(typeof secret === 'string' && secret.length > 0 && !/[\r\n]/.test(secret), 'controller authorization unavailable');
  return async (method, route, body) => {
    requireThat((method === 'GET' && ['/rules', '/proxies', '/configs'].includes(route)) || (['PUT', 'DELETE'].includes(method) && route === endpoint), 'controller operation outside CRM scope');
    return new Promise((resolve, reject) => {
      let finished = false;
      const done = (error, value) => { if (finished) return; finished = true; clearTimeout(timer); error ? reject(error) : resolve(value); };
      const request = http.request({ socketPath, path: route, method, headers: { Authorization: 'Bearer ' + secret, ...(body ? { 'Content-Type': 'application/json' } : {}) } }, response => {
        const chunks = []; let size = 0;
        response.on('data', chunk => { size += chunk.length; if (size > 8 * 1024 * 1024) request.destroy(); else chunks.push(chunk); });
        response.on('error', () => done(new Error('controller response failed')));
        response.on('aborted', () => done(new Error('controller response interrupted')));
        response.on('end', () => {
          if (response.statusCode < 200 || response.statusCode >= 300) return done(new Error('controller HTTP ' + response.statusCode));
          try { const text = Buffer.concat(chunks).toString('utf8'); done(null, text ? JSON.parse(text) : null); }
          catch { done(new Error('controller JSON invalid')); }
        });
      });
      const timer = setTimeout(() => { done(new Error('controller timeout')); request.destroy(); }, timeoutMs);
      request.on('error', () => done(new Error('controller request failed')));
      request.end(body === undefined ? undefined : JSON.stringify(body));
    });
  };
}

export async function snapshot(call, { requireAlive = true } = {}) {
  const rulesResponse = await call('GET', '/rules');
  const proxyResponse = await call('GET', '/proxies');
  const config = await call('GET', '/configs');
  const rules = rulesResponse?.rules, proxies = proxyResponse?.proxies, group = proxies?.[GROUP];
  requireThat(Array.isArray(rules) && proxies && typeof proxies === 'object' && config?.mode === 'rule', 'controller rule-mode snapshot invalid');
  const references = rules.filter(r => r.proxy === GROUP);
  requireThat(references.length === 1 && references[0].type === 'Domain' && references[0].payload === 'crm.cnps.ai', 'CRM group rule scope unsafe');
  requireThat(rules.filter(r => r.payload === 'crm.cnps.ai').length === 1, 'CRM domain rule is ambiguous');
  requireThat(group?.type === 'Fallback' && Array.isArray(group.all) && group.all.includes(MEMBER) && new Set(group.all).size === group.all.length, 'existing CRM fallback/member required');
  requireThat(typeof group.fixed === 'string' && (!group.fixed || group.all.includes(group.fixed)), 'CRM fixed selection unavailable');
  requireThat(proxies[MEMBER] && typeof proxies[MEMBER].type === 'string', 'existing CRM member unavailable');
  if (requireAlive) requireThat(proxies[MEMBER].alive === true, 'existing CRM member is not alive');
  requireThat(!rules.some(rule => rule.proxy === 'GLOBAL'), 'rules must not route through GLOBAL');
  const global = proxies.GLOBAL;
  if (global?.all?.includes(GROUP)) requireThat(global.type === 'Selector' && typeof global.now === 'string' && global.now !== GROUP && global.all.includes(global.now), 'built-in GLOBAL must not select CRM group');
  requireThat(!Object.entries(proxies).some(([name, value]) => name !== GROUP && name !== 'GLOBAL' && value?.all?.includes(GROUP)), 'CRM group is referenced by another group');
  const memberProjection = Object.fromEntries(Object.entries(proxies).map(([name, value]) => [name, Object.fromEntries(Object.entries(value).filter(([key]) => !['fixed', 'now', 'alive', 'history', 'extra'].includes(key)))]));
  const otherSelections = Object.fromEntries(Object.entries(proxies).filter(([name, value]) => name !== GROUP && Array.isArray(value.all)).map(([name, value]) => [name, { now: value.now, fixed: value.fixed }]));
  const targetPolicy = Object.fromEntries(Object.entries(group).filter(([key]) => !['fixed', 'now', 'alive', 'history', 'extra'].includes(key)));
  return { fixed: group.fixed, now: group.now, hashes: { rules: hash(rules), configuration: hash(config), members: hash(memberProjection), otherSelections: hash(otherSelections), targetPolicy: hash(targetPolicy) }, members: group.all };
}

export function verifyMainSource() {
  const filename = fileURLToPath(import.meta.url), directory = path.dirname(filename);
  try {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const relative = path.relative(root, filename).split(path.sep).join('/');
    requireThat(relative === 'scripts/crm-download-route.mjs', 'unexpected source location');
    const expected = execFileSync('git', ['rev-parse', `origin/main:${relative}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const actual = execFileSync('git', ['hash-object', filename], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    requireThat(actual === expected, 'route script must match merged origin/main');
    return { sourceBlob: actual };
  } catch { throw new Error('route script must match merged origin/main; fetch main after PR merge'); }
}

function safe(value) { return { fixed: value.fixed, now: value.now, hashes: value.hashes }; }
const same = (a, b) => canonical(a.hashes) === canonical(b.hashes);
async function save(filename, value, create = false) {
  if (create) return writeFile(filename, JSON.stringify(value, null, 2), { mode: 0o600, flag: 'wx' });
  const temporary = filename + '.tmp';
  await writeFile(temporary, JSON.stringify(value, null, 2), { mode: 0o600, flag: 'wx' });
  await rename(temporary, filename);
}

export async function recover({ call, action = 'check', statePath, controllerId, verifySource = verifyMainSource }) {
  requireThat(['check', 'apply', 'restore'].includes(action), 'unknown action');
  const before = await snapshot(call, { requireAlive: action !== 'restore' });
  if (action === 'check') return { action, group: GROUP, member: MEMBER, before: safe(before), mutation: false };
  const provenance = await verifySource();
  requireThat(statePath && path.isAbsolute(statePath) && controllerId, 'absolute state path and controller identity required');
  let state;
  try { state = JSON.parse(await readFile(statePath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('recovery state unreadable'); }
  if (state) {
    requireThat(state.version === 1 && state.group === GROUP && state.member === MEMBER && state.controllerId === controllerId && typeof state.originalFixed === 'string' && (!state.originalFixed || before.members.includes(state.originalFixed)) && state.before?.fixed === state.originalFixed, 'recovery state scope invalid');
    requireThat(same(before, state.before), 'protected controller state changed');
  } else {
    requireThat(action === 'apply', 'saved recovery state required');
    state = { version: 1, group: GROUP, member: MEMBER, controllerId, originalFixed: before.fixed, before: safe(before), createdAt: new Date().toISOString(), provenance, phase: 'prepared' };
    await save(statePath, state, true);
  }
  const desired = action === 'apply' ? MEMBER : state.originalFixed;
  requireThat(action !== 'restore' || [MEMBER, desired, ''].includes(before.fixed), 'CRM selection changed externally; restore refused');
  const mutation = before.fixed !== desired;
  let after;
  try {
    if (mutation) await call(desired ? 'PUT' : 'DELETE', endpoint, desired ? { name: desired } : undefined);
    after = await snapshot(call, { requireAlive: action !== 'restore' });
    requireThat(after.fixed === desired && same(before, after), 'route readback/protected-state verification failed');
    if (action === 'apply') requireThat(after.now === MEMBER, 'selected CRM member not active');
  } catch {
    // Only undo our exact selection. Never touch other groups/config/rules/connections.
    const rollback = { attempted: false, verified: false };
    if (mutation) {
      try {
        const current = (await call('GET', '/proxies'))?.proxies?.[GROUP];
        if (current?.type === 'Fallback' && canonical(current.all) === canonical(before.members) && [desired, ''].includes(current.fixed)) {
          rollback.attempted = true;
          await call(before.fixed ? 'PUT' : 'DELETE', endpoint, before.fixed ? { name: before.fixed } : undefined);
          const restored = (await call('GET', '/proxies'))?.proxies?.[GROUP];
          rollback.verified = restored?.fixed === before.fixed;
        }
      } catch { /* The saved baseline remains available; report failure, never success. */ }
    }
    state.phase = 'verification-failed'; state.failedAt = new Date().toISOString(); state.rollback = rollback;
    try { await save(statePath, state); } catch { /* Original baseline was saved before any write. */ }
    throw new Error('route verification failed; targeted rollback attempted; inspect saved state');
  }
  state.after = safe(after); state.phase = action === 'apply' ? 'applied' : 'restored'; state.updatedAt = new Date().toISOString();
  await save(statePath, state);
  return { action, group: GROUP, member: MEMBER, mutation, before: safe(before), after: safe(after), provenance };
}

function option(argv, name, fallback) {
  const index = argv.indexOf(name); return index < 0 ? fallback : argv[index + 1];
}
export async function main(argv = process.argv.slice(2)) {
  requireThat(argv.every((value, index) => ['--apply', '--restore'].includes(value) || ['--socket', '--config', '--state'].includes(value) || (index > 0 && ['--socket', '--config', '--state'].includes(argv[index - 1]))), 'unknown argument');
  requireThat(!(argv.includes('--apply') && argv.includes('--restore')), 'choose one action');
  const socketPath = option(argv, '--socket', process.env.CNPS_CRM_CONTROLLER_SOCKET);
  const configuration = option(argv, '--config', process.env.CNPS_CRM_CONTROLLER_CONFIG);
  const statePath = option(argv, '--state', process.env.CNPS_CRM_ROUTE_STATE);
  requireThat(configuration && path.isAbsolute(configuration), 'absolute controller configuration required');
  const text = await readFile(configuration, 'utf8');
  const line = text.match(/^secret:\s*([^\r\n]*)$/m)?.[1]?.trim();
  let secret;
  try { secret = line?.startsWith('"') ? JSON.parse(line) : line?.startsWith("'") && line.endsWith("'") ? line.slice(1, -1).replaceAll("''", "'") : line && !/[#\s{}\[\]]/.test(line) ? line : undefined; } catch { /* fail closed below */ }
  const call = controller({ socketPath, secret });
  const result = await recover({ call, action: argv.includes('--apply') ? 'apply' : argv.includes('--restore') ? 'restore' : 'check', statePath, controllerId: hash({ socketPath, configuration }) });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error => {
  const reason = error.code ? 'local file operation failed (' + error.code + ')' : error.message;
  process.stderr.write('CRM route operation failed closed: ' + reason + '. No configuration or authorization values were logged.\n'); process.exitCode = 1;
});
