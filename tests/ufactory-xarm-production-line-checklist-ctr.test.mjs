import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// O04 CTR refresh (2026-10-13): meta + first-screen "seven checks at a glance"; title/H1 unchanged.
const slug = 'ufactory-xarm-production-line-checklist';
const title = 'UFACTORY xArm production line checklist for overseas teams';
const description =
  'UFACTORY xArm in manufacturing: 7 production-line checks — workcell, mounting, workspace, payload/reach fields, SDK path, site safety, supervised acceptance.';
const oldDescription =
  'Overseas xArm production-line checklist: freeze workcell, mounting, workspace, payload/reach fields, SDK path, site safety — not a lab certificate.';
const source = fs.readFileSync(path.join('content/i18n/resources/en', slug + '.md'), 'utf8');
const mirror = fs.readFileSync(path.join('content/resources', slug + '.md'), 'utf8');
const catalogJson = JSON.parse(fs.readFileSync('content/i18n/catalog.json', 'utf8'));
const catalogMjs = fs.readFileSync('content/catalog.mjs', 'utf8');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const count = (hay, needle) => hay.split(needle).length - 1;
const steps = '/assets/resources/ufactory-xarm-production-line-checklist-steps.webp';
const owners = '/assets/resources/ufactory-xarm-production-line-checklist-owners.webp';

test('meta is reader-facing, ≤160 chars, front-loads the xArm queries, no false freshness', () => {
  assert.ok(description.length <= 160, String(description.length));
  assert.match(description, /^UFACTORY xArm in manufacturing: 7 production-line checks/);
  assert.doesNotMatch(description, /\bas of\b|20\d\d|\bbuy(er|ers)?\b/i);
  const en = catalogJson.en.resources.find((r) => r.slug === slug);
  assert.equal(en.title, title);
  assert.equal(en.description, description);
  assert.match(catalogMjs, new RegExp(`slug:'${slug}',title:'${esc(title)}',[^}]*description:'${esc(description)}'`));
  assert.equal(count(catalogMjs + JSON.stringify(catalogJson), oldDescription), 0);
  assert.equal(catalogJson.zh.resources.find((r) => r.slug === slug), undefined);
  assert.equal(catalogJson.ar.resources.find((r) => r.slug === slug), undefined);
});

test('first screen: seven-check table + steps strip sit above "Who this checklist is for"', () => {
  assert.equal(source, mirror, 'EN source and legacy mirror must stay identical');
  assert.doesNotMatch(source, /^# /m);
  const glance = source.indexOf('## The seven checks at a glance');
  const who = source.indexOf('## Who this checklist is for');
  assert.ok(glance > 0 && who > glance);
  assert.match(source.slice(0, glance), /^You are preparing a UFACTORY xArm for an overseas production line/);
  const block = source.slice(glance, who);
  const rows = [...block.matchAll(/^\| (\d) \| ([^|]+) \| ([^|]+) \|$/gm)].map((m) => m[1]);
  assert.deepEqual(rows, ['1', '2', '3', '4', '5', '6', '7']);
  for (const n of rows) assert.match(source, new RegExp(`^## ${n}\\. `, 'm'));
  assert.match(block, /read from UFACTORY Docs on 21 September 2026/);
  assert.equal(count(source, `](${steps})`), 1);
  assert.ok(block.includes(`](${steps})`), 'steps strip moved to first screen');
  assert.match(source, /!\[Four-step readiness strip — mount \/ workspace \/ fields \/ safety — no fake seals\]/);
  assert.equal(count(source, `](${owners})`), 1);
  assert.ok(source.indexOf(owners) > source.indexOf('## 6. Safety assessment'));
  assert.ok(source.indexOf(owners) < source.indexOf('## 7. Supervised acceptance'));
  assert.match(source, /That covers an xArm in manufacturing: a station on a line/);
});

test('links: each href once, anchor = live H1 (2026-10-13)', () => {
  const links = {
    'https://www.cnps.ai/en/case-studies/ufactory-xarm': 'UFACTORY xArm: specify the workcell, not just the arm',
    'https://www.cnps.ai/en/resources/robotics-procurement': 'Robotics procurement: configuration and SDK access',
    'https://www.cnps.ai/en/request-quote': 'Request a quotation for devices or a pilot.'
  };
  for (const [href, anchor] of Object.entries(links)) {
    assert.equal(count(source, `](${href})`), 1, href);
    assert.ok(source.includes(`[${anchor}](${href})`), anchor);
  }
  assert.doesNotMatch(source, /\[Start a conversation\]/);
  assert.doesNotMatch(source, /^#{2,3} .*\bbuy/im);
  assert.doesNotMatch(source, /\[[^\]]*\bbuy(er|ers)?\b[^\]]*\]\(/i);
  assert.doesNotMatch(source, /\b\d+\s*kg\b|\b\d+\s*mm\b|\b\d+\s*%/i);
  assert.doesNotMatch(source, /as of (Oct|October) 2026|GSC|impressions/i);
});

test('built EN page: unchanged H1/title, new meta + lead, editorial og:image', () => {
  const htmlPath = path.join('dist/en/resources', slug + '.html');
  if (!fs.existsSync(htmlPath)) { assert.ok(true, 'no build output'); return; }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
  assert.deepEqual(h1s, [title]);
  assert.match(html, new RegExp(`<title>${esc(title)} \\| CNPS\\.AI</title>`));
  assert.match(html, new RegExp(`<meta name="description" content="${esc(description)}">`));
  assert.match(html, new RegExp(`<meta property="og:description" content="${esc(description)}">`));
  assert.doesNotMatch(html, new RegExp(esc(oldDescription)));
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.cnps\.ai\/assets\/editorial\/ufactory-xarm-production-line-checklist-1280\.webp">/);
  assert.match(html, /<table/);
  assert.ok(html.indexOf(`src="${steps}"`) < html.indexOf('Who this checklist is for'));
});
