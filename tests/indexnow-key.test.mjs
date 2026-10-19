import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = 'ab8aecbc192c4458854b34157e78169e';
const FILE = KEY + '.txt';
const SRC = path.join('web', FILE);

test('IndexNow key source file is exactly the key (no trailing newline)', () => {
  assert.ok(fs.existsSync(SRC), SRC + ' must exist');
  const buf = fs.readFileSync(SRC);
  assert.equal(buf.toString('utf8'), KEY);
  assert.equal(buf.length, KEY.length);
});

test('trilingual build copies the IndexNow key to dist root', () => {
  const build = fs.readFileSync('scripts/build-trilingual.mjs', 'utf8');
  assert.match(
    build,
    /fs\.copyFileSync\('web\/ab8aecbc192c4458854b34157e78169e\.txt',path\.join\(out,'ab8aecbc192c4458854b34157e78169e\.txt'\)\)/,
  );

  // Mirror the build step into a temp out/ so the copy contract is exercised without a full site build.
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'indexnow-'));
  fs.copyFileSync(SRC, path.join(out, FILE));
  assert.equal(fs.readFileSync(path.join(out, FILE), 'utf8'), KEY);
});

test('built dist root contains the IndexNow key when a build is present', () => {
  const dest = path.join('dist', FILE);
  if (!fs.existsSync('dist/robots.txt')) {
    assert.ok(true, 'build output not present; source and wiring checks already ran');
    return;
  }
  assert.ok(fs.existsSync(dest), dest + ' missing from build output');
  assert.equal(fs.readFileSync(dest, 'utf8'), KEY);
});
