import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const origin = 'https://www.cnps.ai';
const validId = /^[a-zA-Z0-9_.-]{1,80}$/;
const trackingKeys = ['source', 'content', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 10);
const decode = value => value.replace(/&(?:amp|#38|#x26);/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'");
const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const slug = value => value.toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '');
const identifier = value => slug(value).length <= 80 && slug(value) ? slug(value) : `${slug(value).slice(0, 69) || 'cta'}-${hash(value)}`;

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? decode(match[1] ?? match[2] ?? match[3]) : '';
}

function setAttribute(tag, name, value) {
  const pattern = new RegExp(`(\\s${name}\\s*=\\s*)(?:"[^"]*"|'[^']*'|[^\\s>]+)`, 'i');
  const replacement = ` ${name}="${escape(value)}"`;
  return pattern.test(tag) ? tag.replace(pattern, () => replacement) : tag.replace(/\s*\/?>(?=$)/, ending => `${replacement}${ending}`);
}

export function isFastgptPath(pathname) {
  return /^\/fastgpt(?:\/|$)/.test(pathname) || /^\/resources\/fastgpt-/.test(pathname);
}

function internalTarget(href, route) {
  if (!href || /^(?:#|mailto:|tel:|javascript:|data:)/i.test(href)) return null;
  try {
    const url = new URL(href, origin + route);
    return ['cnps.ai', 'www.cnps.ai'].includes(url.hostname) && ['http:', 'https:'].includes(url.protocol) && isFastgptPath(url.pathname) ? url : null;
  } catch { return null; }
}

function cleanTarget(href, route) {
  try {
    const url = new URL(href, origin + route);
    for (const key of trackingKeys) url.searchParams.delete(key);
    return url.pathname + url.search + url.hash;
  } catch { return href; }
}

/** Apply attribution to the finished HTML so both page generators share one rule. */
export function transformFastgptHtml(html, { route }) {
  const specialist = isFastgptPath(route);
  const source = identifier(route === '/' ? 'cnps-home' : route.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/^\//, '').replace(/\/$/, '') || 'fastgpt-home');
  const contexts = [];
  const counts = new Map();
  let relevant = specialist;
  const transformed = html.replace(/<!--[\s\S]*?-->|<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)\s*>|<\/?[a-zA-Z][^>]*>/g, (tag, offset) => {
    if (/^<!--|^<(?:script|style)\b/i.test(tag)) return tag;
    const match = tag.match(/^<(\/)?([a-zA-Z][\w:-]*)/);
    if (!match) return tag;
    const [, closing, rawName] = match;
    const name = rawName.toLowerCase();
    if (closing) {
      const index = contexts.map(item => item.name).lastIndexOf(name);
      if (index !== -1) contexts.splice(index);
      return tag;
    }
    if (['header', 'nav', 'main', 'section', 'article', 'aside', 'footer', 'form'].includes(name)) {
      contexts.push({ name, label: attribute(tag, 'id') || attribute(tag, 'class').split(/\s+/)[0] || name });
    }
    if (!['a', 'button'].includes(name)) return tag;
    const href = attribute(tag, 'href');
    const target = name === 'a' ? internalTarget(href, route) : null;
    if (!specialist && !target) return tag;
    relevant = true;
    const placement = contexts.filter(item => !['main', 'article'].includes(item.name)).slice(-1)[0]?.label || 'page';
    const closingAt = html.indexOf(`</${name}>`, offset + tag.length);
    const label = closingAt === -1 ? name : decode(html.slice(offset + tag.length, closingAt).replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
    const semantic = `${placement}-${slug(label).slice(0, 36) || slug(cleanTarget(href, route)).slice(-36) || name}`;
    const baseContent = identifier(`${semantic}-${hash(`${placement}|${cleanTarget(href, route)}|${label}`)}`);
    const count = (counts.get(baseContent) || 0) + 1;
    counts.set(baseContent, count);
    const ownSource = validId.test(attribute(tag, 'data-cta-source')) ? attribute(tag, 'data-cta-source') : source;
    const content = validId.test(attribute(tag, 'data-cta-content')) ? attribute(tag, 'data-cta-content') : identifier(baseContent + (count > 1 ? `-${count}` : ''));
    tag = setAttribute(setAttribute(tag, 'data-cta-source', ownSource), 'data-cta-content', content);
    if (target) {
      target.searchParams.set('source', ownSource);
      target.searchParams.set('content', content);
      for (const [key, value] of Object.entries({ utm_source: 'cnps.ai', utm_medium: 'website', utm_campaign: 'fastgpt', utm_content: content })) {
        if (!target.searchParams.has(key)) target.searchParams.set(key, value);
      }
      const outputHref = /^https?:\/\//i.test(href) ? target.href : target.pathname + target.search + target.hash;
      tag = setAttribute(tag, 'href', outputHref);
    }
    return tag;
  });
  if (!relevant) return transformed;
  const script = '<script defer src="/fastgpt-assets/attribution.js"></script>';
  let result = transformed.replace(/<script\b[^>]*\bsrc=["']\/fastgpt-assets\/attribution\.js["'][^>]*>\s*<\/script>/gi, '');
  result = result.replace(/<body\b[^>]*>/i, tag => setAttribute(tag, 'data-fastgpt-source', source));
  if (/<script\b[^>]*\bsrc=["']\/fastgpt-assets\/site\.js["']/i.test(result)) {
    result = result.replace(/<script\b[^>]*\bsrc=["']\/fastgpt-assets\/site\.js["']/i, match => script + match);
  } else result = result.replace(/<\/head>/i, script + '</head>');
  return result;
}

export function applyFastgptAttribution(directory) {
  let pages = 0;
  const walk = folder => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.html')) {
        const relative = path.relative(directory, file).split(path.sep).join('/');
        const route = '/' + relative.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
        const before = fs.readFileSync(file, 'utf8');
        const after = transformFastgptHtml(before, { route });
        if (after !== before) { fs.writeFileSync(file, after); pages++; }
      }
    }
  };
  walk(directory);
  return { attributedPages: pages };
}
