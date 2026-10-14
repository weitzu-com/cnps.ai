import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { shouldSkip, isSkippablePath } from '../scripts/vercel-ignore-build.mjs';

test('main always builds', () => {
  assert.equal(shouldSkip({ ref: 'main', changedFiles: ['docs/a.md'] }), false);
});
test('feature branch with only docs/root md skips', () => {
  assert.equal(shouldSkip({ ref: 'codex/x', changedFiles: ['docs/a.md', 'README.md', 'docs/s/b.json'] }), true);
});
test('content and nested md always build', () => {
  assert.equal(shouldSkip({ ref: 'codex/x', changedFiles: ['content/post.md'] }), false);
  assert.equal(shouldSkip({ ref: 'codex/x', changedFiles: ['docs/a.md', 'site/x.md'] }), false);
  assert.equal(isSkippablePath('content/a.md'), false);
});
test('missing or empty diff builds', () => {
  assert.equal(shouldSkip({ ref: 'codex/x', changedFiles: null }), false);
  assert.equal(shouldSkip({ ref: 'codex/x', changedFiles: [] }), false);
  assert.equal(shouldSkip({ ref: '', changedFiles: ['README.md'] }), false);
});

test('CLI exit codes against a real git repo', () => {
  const script = resolve('scripts/vercel-ignore-build.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'ign-'));
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' }).trim();
  git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't');
  writeFileSync(join(dir, 'a.js'), '1'); git('add', '.'); git('commit', '-qm', 'a');
  const base = git('rev-parse', 'HEAD');
  mkdirSync(join(dir, 'docs')); writeFileSync(join(dir, 'docs/x.md'), 'x'); writeFileSync(join(dir, 'NOTES.md'), 'n');
  git('add', '.'); git('commit', '-qm', 'docs');
  const run = (env) => spawnSync('node', [script], { cwd: dir, env: { ...process.env, ...env } }).status;
  assert.equal(run({ VERCEL_GIT_COMMIT_REF: 'codex/x', VERCEL_GIT_PREVIOUS_SHA: base }), 0);
  assert.equal(run({ VERCEL_GIT_COMMIT_REF: 'main', VERCEL_GIT_PREVIOUS_SHA: base }), 1);
  assert.equal(run({ VERCEL_GIT_COMMIT_REF: 'codex/x', VERCEL_GIT_PREVIOUS_SHA: '' }), 1);
  assert.equal(run({ VERCEL_GIT_COMMIT_REF: 'codex/x', VERCEL_GIT_PREVIOUS_SHA: 'deadbeef' }), 1);
  mkdirSync(join(dir, 'content')); writeFileSync(join(dir, 'content/p.md'), 'p');
  git('add', '.'); git('commit', '-qm', 'content');
  assert.equal(run({ VERCEL_GIT_COMMIT_REF: 'codex/x', VERCEL_GIT_PREVIOUS_SHA: base }), 1);
});
