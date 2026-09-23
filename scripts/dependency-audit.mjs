import { spawnSync } from 'node:child_process';

const result = spawnSync('npm', ['audit', '--json'], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
let report;
try { report = JSON.parse(result.stdout || '{}'); } catch { report = {}; }

const metadata = report.metadata?.vulnerabilities ?? {};
console.log('Auditoria de dependências:', JSON.stringify(metadata, null, 2));
console.log('Não use npm audit fix --force sem revisar breaking changes.');
process.exit(0);
