/**
 * Remove a pasta .next (cache Turbopack/Webpack corrompido, builds antigos).
 * Uso: node scripts/clean-next.mjs
 */
import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), '.next');
try {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('OK: pasta .next removida.');
  } else {
    console.log('Nada a fazer: .next não existe.');
  }
} catch (e) {
  console.error('Falha ao remover .next (feche o next dev e tente de novo):', e.message);
  process.exit(1);
}
