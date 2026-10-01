import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.PORT = process.env.PORT || '3002';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const standaloneServer = path.join(__dirname, '..', '.next', 'standalone', 'server.js');

try {
  const { atualizarNomesCompletosPacientes } = await import('./atualizar-nomes-completos-pacientes.mjs');
  await atualizarNomesCompletosPacientes();
} catch {
  /* ignore */
}

try {
  await import(standaloneServer);
} catch (err) {
  console.log('Standalone server not found, launching next start on port', process.env.PORT);
  const { execSync } = await import('node:child_process');
  execSync(`npx next start -p ${process.env.PORT}`, { stdio: 'inherit' });
}
