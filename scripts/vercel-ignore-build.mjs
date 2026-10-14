#!/usr/bin/env node
// Vercel Ignored Build Step (vercel.json "ignoreCommand").
// Exit 1 = BUILD, exit 0 = SKIP.
// Rules: main always builds. Other branches skip only when every changed file
// is under docs/** or is a root-level *.md. content/** always builds. Never
// skips by author. Missing/ambiguous diff base => build.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function isSkippablePath(file) {
  const f = String(file).trim().replace(/^\.\//, '');
  if (!f) return false;
  if (f.startsWith('docs/')) return true;
  if (!f.includes('/') && f.toLowerCase().endsWith('.md')) return true;
  return false;
}

// Returns true when the build should be skipped.
export function shouldSkip({ ref, changedFiles }) {
  if (!ref || ref === 'main') return false;
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) return false;
  return changedFiles.every(isSkippablePath);
}

function changedFilesFromGit(env) {
  const base = env.VERCEL_GIT_PREVIOUS_SHA;
  const head = env.VERCEL_GIT_COMMIT_SHA || 'HEAD';
  if (!base) return null;
  try {
    execFileSync('git', ['cat-file', '-e', `${base}^{commit}`], { stdio: 'ignore' });
    const out = execFileSync('git', ['diff', '--name-only', base, head], { encoding: 'utf8' });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const env = process.env;
  const ref = env.VERCEL_GIT_COMMIT_REF || '';
  const files = ref && ref !== 'main' ? changedFilesFromGit(env) : null;
  const skip = shouldSkip({ ref, changedFiles: files });
  console.log(`[ignore-build] ref=${ref || '(none)'} files=${files ? files.length : 'unknown'} -> ${skip ? 'SKIP' : 'BUILD'}`);
  process.exit(skip ? 0 : 1);
}
