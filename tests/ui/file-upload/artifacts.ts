import fs from 'node:fs';
import path from 'node:path';

// Feature-local artifact paths + a generator function. The paths are consumed
// by the spec; the generator is invoked once per test run by global-setup.ts.
// Cleanup is handled globally in global-teardown.ts (which removes the whole
// test-artifacts/ directory), so no per-feature cleanup is exposed here.

export const UPLOAD_ARTIFACTS_DIR = path.join(
  process.cwd(),
  'test-artifacts',
  'upload',
);

export const SMALL_TXT = path.join(UPLOAD_ARTIFACTS_DIR, 'small.txt');
export const SMALL_PNG = path.join(UPLOAD_ARTIFACTS_DIR, 'small.png');
export const KB_499 = path.join(UPLOAD_ARTIFACTS_DIR, '499kb.txt');
export const KB_500 = path.join(UPLOAD_ARTIFACTS_DIR, '500kb.txt');
export const KB_501 = path.join(UPLOAD_ARTIFACTS_DIR, '501kb.txt');

// Buffer.alloc(n) produces a file of exactly n bytes. The upload form rounds
// sizeBytes / 1024 via Math.round, so N * 1024 lands on rounded KB = N.
export function generateUploadArtifacts() {
  fs.mkdirSync(UPLOAD_ARTIFACTS_DIR, { recursive: true });
  fs.writeFileSync(SMALL_TXT, Buffer.alloc(16));
  fs.writeFileSync(SMALL_PNG, Buffer.alloc(16));
  fs.writeFileSync(KB_499, Buffer.alloc(499 * 1024));
  fs.writeFileSync(KB_500, Buffer.alloc(500 * 1024));
  fs.writeFileSync(KB_501, Buffer.alloc(501 * 1024));
}
