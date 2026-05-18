import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const prismaCli = resolve(process.cwd(), 'node_modules/prisma/build/index.js');
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [prismaCli, ...args], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd(),
});

process.exit(result.status === null ? 1 : result.status);
