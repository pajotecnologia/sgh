/**
 * Após `next build` com output standalone, copia o servidor mínimo para release/app
 * (inclui .next/static e public, necessários em runtime).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const standaloneDir = path.join(root, '.next', 'standalone');
const outDir = path.join(root, 'release', 'app');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(standaloneDir))) {
    console.error(
      'ERRO: pasta .next/standalone não encontrada. Confirme output: "standalone" no next.config.js e execute npm run build.'
    );
    process.exit(1);
  }

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(outDir), { recursive: true });
  await fs.cp(standaloneDir, outDir, { recursive: true, dereference: true });

  const staticSrc = path.join(root, '.next', 'static');
  const staticDst = path.join(outDir, '.next', 'static');
  if (await exists(staticSrc)) {
    await fs.mkdir(path.dirname(staticDst), { recursive: true });
    await fs.cp(staticSrc, staticDst, { recursive: true, dereference: true });
  }

  const publicSrc = path.join(root, 'public');
  if (await exists(publicSrc)) {
    await fs.cp(publicSrc, path.join(outDir, 'public'), { recursive: true, dereference: true });
  }

  console.log(`Deploy pronto em: ${outDir}`);
  console.log('Na VPS: cd release/app && NODE_ENV=production node server.js');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
