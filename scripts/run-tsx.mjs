import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const tsxCli = resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs');
const scriptArgs = process.argv.slice(2);

if (scriptArgs.length === 0) {
  console.error('Usage: node scripts/run-tsx.mjs <file.ts> [args...]');
  process.exit(1);
}

const result = spawnSync(process.execPath, [tsxCli, ...scriptArgs], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd(),
});

process.exit(result.status === null ? 1 : result.status);
