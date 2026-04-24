import fs from 'node:fs';
import path from 'node:path';

// Runs once per `playwright test` invocation, after all workers finish.
// Removes the whole test-artifacts/ tree so the next run starts clean.
async function globalTeardown() {
  const dir = path.join(process.cwd(), 'test-artifacts');
  fs.rmSync(dir, { recursive: true, force: true });
}

export default globalTeardown;
