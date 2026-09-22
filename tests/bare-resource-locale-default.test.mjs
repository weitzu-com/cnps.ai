import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

function vercelDest(sourcePath) {
  return vercel.redirects.find((r) => r.source === sourcePath)?.destination;
}

function refreshTarget(html) {
  const match = html.match(/http-equiv="refresh" content="0;url=([^"]+)"/);
  return match?.[1];
}

test('bare china-export playbook redirects to EN, matching sibling resources and x-default', () => {
  assert.equal(
    vercelDest('/resources/china-ai-export-playbook'),
    '/en/resources/china-ai-export-playbook'
  );
  assert.equal(
    vercelDest('/resources/ai-procurement-checklist'),
    '/en/resources/ai-procurement-checklist'
  );
  assert.equal(
    vercelDest('/resources/ufactory-xarm-production-line-checklist'),
    '/en/resources/ufactory-xarm-production-line-checklist'
  );
  assert.equal(
    vercelDest('/resources/ai-procurement-checklist-public-sector'),
    '/en/resources/ai-procurement-checklist-public-sector'
  );
});

test('no unprefixed resource path permanently redirects to ZH', () => {
  const zhBare = vercel.redirects.filter((r) =>
    !/^\/(en|zh|ar)(\/|$)/.test(r.source)
    && r.destination.startsWith('/zh/')
  );
  assert.deepEqual(zhBare, [], JSON.stringify(zhBare, null, 2));
});

test('prefixed china-export and procurement routes stay on their locale (no vercel override)', () => {
  for (const loc of ['en', 'zh', 'ar']) {
    for (const slug of ['china-ai-export-playbook', 'ai-procurement-checklist']) {
      assert.equal(vercelDest(`/${loc}/resources/${slug}`), undefined);
    }
  }
  assert.equal(vercelDest('/en/resources/ufactory-xarm-production-line-checklist'), undefined);
  assert.equal(
    vercelDest('/zh/resources/ufactory-xarm-production-line-checklist'),
    '/en/resources/ufactory-xarm-production-line-checklist'
  );
  assert.equal(
    vercelDest('/ar/resources/ufactory-xarm-production-line-checklist'),
    '/en/resources/ufactory-xarm-production-line-checklist'
  );
  assert.equal(vercelDest('/en/resources/ai-procurement-checklist-public-sector'), undefined);
  assert.equal(
    vercelDest('/zh/resources/ai-procurement-checklist-public-sector'),
    '/en/resources/ai-procurement-checklist-public-sector'
  );
  assert.equal(
    vercelDest('/ar/resources/ai-procurement-checklist-public-sector'),
    '/en/resources/ai-procurement-checklist-public-sector'
  );
});

test('built bare playbook alias points at EN; prefixed EN/ZH pages remain content', () => {
  const bare = 'dist/resources/china-ai-export-playbook.html';
  const checklist = 'dist/resources/ai-procurement-checklist.html';
  const en = path.join('dist/en/resources', 'china-ai-export-playbook.html');
  const zh = path.join('dist/zh/resources', 'china-ai-export-playbook.html');
  const ar = path.join('dist/ar/resources', 'china-ai-export-playbook.html');
  if (![bare, checklist, en, zh, ar].every((p) => fs.existsSync(p))) {
    assert.ok(true, 'build output not present; vercel checks already ran');
    return;
  }
  const bareHtml = fs.readFileSync(bare, 'utf8');
  const checklistHtml = fs.readFileSync(checklist, 'utf8');
  const enHtml = fs.readFileSync(en, 'utf8');
  const zhHtml = fs.readFileSync(zh, 'utf8');
  const arHtml = fs.readFileSync(ar, 'utf8');
  assert.equal(refreshTarget(bareHtml), '/en/resources/china-ai-export-playbook');
  assert.equal(refreshTarget(checklistHtml), '/en/resources/ai-procurement-checklist');
  assert.doesNotMatch(enHtml, /http-equiv="refresh"/);
  assert.doesNotMatch(zhHtml, /http-equiv="refresh"/);
  assert.doesNotMatch(arHtml, /http-equiv="refresh"/);
  assert.match(enHtml, /lang="en"/);
  assert.match(zhHtml, /lang="zh-CN"/);
  assert.match(arHtml, /lang="ar"/);
  assert.match(enHtml, /hreflang="x-default" href="https:\/\/www\.cnps\.ai\/en\/resources\/china-ai-export-playbook"/);
});
