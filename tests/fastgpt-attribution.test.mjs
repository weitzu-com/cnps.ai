import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { transformFastgptHtml } from '../scripts/lib/fastgpt-attribution.mjs';

const runtime = fs.readFileSync(new URL('../site/fastgpt-assets/attribution.js', import.meta.url), 'utf8');
const key = 'cnps-fastgpt-attribution';
const decode = html => html.replace(/&amp;/g, '&');
const hrefs = html => [...html.matchAll(/<a\b[^>]*>/g)].map(([tag]) => ({ tag, href: decode(tag.match(/href="([^"]*)"/)[1]) }));

function runAttribution(url, { saved, blocked = false, links = [] } = {}) {
  const storage = new Map(saved === undefined ? [] : [[key, JSON.stringify(saved)]]);
  const anchors = links.map(({ href, source = 'fastgpt-cases-parts-data', content = 'hero-plan-pilot' }) => ({
    href, dataset: { ctaSource: source, ctaContent: content },
    getAttribute(name) { return this[name]; },
    setAttribute(name, value) { this[name] = value; },
  }));
  const context = {
    location: new URL(url), URL, URLSearchParams, window: {},
    document: { body: { dataset: { fastgptSource: 'fastgpt-contact' } }, querySelectorAll: () => anchors },
    sessionStorage: {
      getItem(name) { if (blocked) throw new Error('blocked'); return storage.get(name) || null; },
      setItem(name, value) { if (blocked) throw new Error('blocked'); storage.set(name, value); },
      removeItem(name) { if (blocked) throw new Error('blocked'); storage.delete(name); },
    },
  };
  vm.runInNewContext(runtime, context);
  return { tracking: JSON.parse(JSON.stringify(context.window.cnpsFastgptAttribution.getTracking())), anchors, saved: JSON.parse(storage.get(key) || 'null') };
}

test('build gives stable unique CTA identifiers, keeps context and hashes, and is idempotent', () => {
  const html = '<html><head><script defer src="/fastgpt-assets/site.js"></script></head><body><nav><a href="/fastgpt/contact/">Plan a pilot</a></nav><main><section class="hero"><a href="/fastgpt/contact/?case=parts-data&amp;workflow=rfq-intake#brief">Plan a pilot</a><a href="/fastgpt/contact/?case=parts-data&amp;workflow=rfq-intake#brief">Plan a pilot</a><button type="submit">Submit inquiry</button></section><a href="https://solutions.fastgpt.cn/case?a=1&amp;b=2">Original source</a><a href="#main">Skip</a></main></body></html>';
  const output = transformFastgptHtml(html, { route: '/fastgpt/cases/parts-data/' });
  assert.equal(transformFastgptHtml(output, { route: '/fastgpt/cases/parts-data/' }), output);
  assert.ok(output.indexOf('/attribution.js') < output.indexOf('/site.js'));
  assert.equal((output.match(/\/attribution\.js/g) || []).length, 1);
  const identifiers = [...output.matchAll(/data-cta-content="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(identifiers).size, identifiers.length);
  assert.ok(identifiers.every(value => /^[a-zA-Z0-9_.-]{1,80}$/.test(value)));
  const links = hrefs(output);
  const pilot = new URL(links[1].href, 'https://www.cnps.ai');
  assert.equal(pilot.searchParams.get('case'), 'parts-data');
  assert.equal(pilot.searchParams.get('workflow'), 'rfq-intake');
  assert.equal(pilot.hash, '#brief');
  assert.equal(pilot.searchParams.get('utm_source'), 'cnps.ai');
  assert.equal(pilot.searchParams.get('utm_content'), pilot.searchParams.get('content'));
  assert.equal(links[3].href, 'https://solutions.fastgpt.cn/case?a=1&b=2');
  assert.equal(links[4].href, '#main');
});

test('bilingual resources, downloads and main-center entries receive attribution', () => {
  const page = '<html><head></head><body><a href="/solutions">Solutions</a><a href="/fastgpt/">FastGPT</a><a href="/resources/fastgpt-cnps-global-growth-bilingual">中英文方案</a></body></html>';
  const home = transformFastgptHtml(page, { route: '/' });
  const homeLinks = hrefs(home);
  assert.ok(!homeLinks[0].tag.includes('data-cta-content'));
  assert.ok(homeLinks[1].tag.includes('data-cta-source="cnps-home"'));
  assert.ok(homeLinks[2].href.includes('utm_campaign=fastgpt'));
  const bilingual = transformFastgptHtml('<html><head></head><body><a download href="/resources/fastgpt-cnps-global-growth-bilingual.md">下载</a><a href="/resources/fastgpt-cnps-global-growth-bilingual.pdf">PDF</a><a href="/fastgpt/contact">试点询盘</a></body></html>', { route: '/resources/fastgpt-cnps-global-growth-bilingual' });
  assert.ok(hrefs(bilingual).every(link => link.href.includes('source=') && link.href.includes('content=')));
  assert.ok(bilingual.includes('/fastgpt-assets/attribution.js'));
});

test('runtime preserves inbound campaign content while recording each latest CTA and carrying case/workflow', () => {
  const first = runAttribution('https://www.cnps.ai/fastgpt/cases/parts-data/?utm_source=linkedin&utm_medium=social&utm_campaign=launch&utm_content=original-post&utm_term=rag', { links: [{ href: '/resources/fastgpt-cnps-global-growth-bilingual?utm_source=cnps.ai&utm_medium=website&utm_campaign=fastgpt&utm_content=default#chapter-01' }] });
  const reportUrl = new URL(first.anchors[0].href, 'https://www.cnps.ai');
  assert.equal(reportUrl.searchParams.get('utm_content'), 'original-post');
  assert.equal(reportUrl.searchParams.get('content'), 'hero-plan-pilot');
  assert.equal(reportUrl.searchParams.get('case'), 'parts-data');
  assert.equal(reportUrl.hash, '#chapter-01');
  const second = runAttribution(reportUrl.href, { saved: first.saved, links: [{ href: '/fastgpt/contact?workflow=rfq-intake', source: 'bilingual-playbook', content: 'footer-inquiry' }] });
  const contact = runAttribution(new URL(second.anchors[0].href, 'https://www.cnps.ai').href, { saved: second.saved });
  assert.deepEqual(contact.tracking, { utm_source: 'linkedin', utm_medium: 'social', utm_campaign: 'launch', utm_content: 'original-post', utm_term: 'rag', source: 'bilingual-playbook', content: 'footer-inquiry', case: 'parts-data', workflow: 'rfq-intake' });
});

test('blocked storage still propagates attribution through URLs and excludes external sources', () => {
  const first = runAttribution('https://www.cnps.ai/fastgpt/?utm_source=newsletter&utm_campaign=september&utm_content=issue-7', { blocked: true, links: [{ href: '/fastgpt/contact/?workflow=support-triage' }, { href: 'https://fastgpt.io/?source=reference' }, { href: '#solutions' }] });
  const next = runAttribution(new URL(first.anchors[0].href, 'https://www.cnps.ai').href, { blocked: true });
  assert.equal(next.tracking.utm_source, 'newsletter');
  assert.equal(next.tracking.utm_content, 'issue-7');
  assert.equal(next.tracking.workflow, 'support-triage');
  assert.equal(first.anchors[1].href, 'https://fastgpt.io/?source=reference');
  assert.equal(first.anchors[2].href, '#solutions');
});

test('new and stale campaigns cannot inherit unrelated content or term, and storage contains no form data', () => {
  const saved = { version: 2, lastSeenAt: Date.now(), campaign: { utm_source: 'old-network', utm_medium: 'social', utm_campaign: 'old', utm_content: 'old-post', utm_term: 'old-term', email: 'private@example.com' }, name: 'Private' };
  const next = runAttribution('https://www.cnps.ai/fastgpt/contact/?utm_source=new-network&source=sidebar&content=contact', { saved });
  assert.equal(next.tracking.utm_source, 'new-network');
  assert.equal(next.tracking.utm_content, undefined);
  assert.equal(next.tracking.utm_medium, undefined);
  assert.deepEqual(next.saved.campaign, { utm_source: 'new-network' });
  assert.ok(!JSON.stringify(next.saved).includes('private'));
  const expired = runAttribution('https://www.cnps.ai/fastgpt/contact/', { saved: { ...saved, lastSeenAt: Date.now() - 31 * 60 * 1000 } });
  assert.equal(expired.tracking.utm_source, 'cnps.ai');
  assert.equal(expired.tracking.content, 'direct-entry');
  assert.equal(expired.saved, null);
});

test('website defaults preserve an active real campaign, validate query values and keep default content current', () => {
  const saved = { version: 2, lastSeenAt: Date.now(), campaign: { utm_source: 'search', utm_medium: 'paid', utm_campaign: 'pilot', utm_content: 'original' } };
  const active = runAttribution('https://www.cnps.ai/fastgpt/contact/?utm_source=cnps.ai&utm_medium=website&utm_campaign=fastgpt&utm_content=local-link&source=cases&content=pilot&case=%3Cscript%3E', { saved });
  assert.equal(active.tracking.utm_content, 'original');
  assert.equal(active.tracking.content, 'pilot');
  assert.equal(active.tracking.case, undefined);
  const local = runAttribution('https://www.cnps.ai/fastgpt/?utm_source=cnps.ai&utm_medium=website&utm_campaign=fastgpt&utm_content=first-link', { links: [{ href: '/fastgpt/contact/' }] });
  assert.equal(new URL(local.anchors[0].href, 'https://www.cnps.ai').searchParams.get('utm_content'), 'hero-plan-pilot');
  assert.equal(local.saved, null);
});
