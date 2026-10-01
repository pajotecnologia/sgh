/**
 * scripts/atualizar-versao.mjs
 * Script de versionamento automático do SGH.
 * Sincroniza e incrementa a versão e o código de build em `package.json` e `lib/versao.ts`.
 *
 * Modos de uso:
 * - `node scripts/atualizar-versao.mjs` (atualiza build tag com data/hora atual)
 * - `node scripts/atualizar-versao.mjs --bump` (incrementa patch version x.y.Z e gera build tag)
 * - `node scripts/atualizar-versao.mjs --minor` (incrementa minor version x.Y.0)
 * - `node scripts/atualizar-versao.mjs --set 2.7.0` (define versão específica)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const packageJsonPath = path.join(root, 'package.json');
const versaoTsPath = path.join(root, 'lib', 'versao.ts');

async function main() {
  const args = process.argv.slice(2);
  const shouldBumpPatch = args.includes('--bump') || args.includes('--patch');
  const shouldBumpMinor = args.includes('--minor');
  const setIndex = args.indexOf('--set');
  const explicitVersion = setIndex !== -1 && args[setIndex + 1] ? args[setIndex + 1] : null;

  // 1. Ler package.json
  const pkgRaw = await fs.readFile(packageJsonPath, 'utf8');
  const pkg = JSON.parse(pkgRaw);
  let [major, minor, patch] = (pkg.version || '2.6.0').split('.').map(Number);

  if (explicitVersion) {
    const parts = explicitVersion.replace(/^v/, '').split('.').map(Number);
    major = parts[0] || 2;
    minor = parts[1] || 0;
    patch = parts[2] || 0;
  } else if (shouldBumpMinor) {
    minor += 1;
    patch = 0;
  } else if (shouldBumpPatch) {
    patch += 1;
  }

  const novaVersaoNumero = `${major}.${minor}.${patch}`;
  const novaVersaoSgh = `v${novaVersaoNumero}`;

  // 2. Gerar tag de build baseada na data atual (ex: build 26.10 ou build 26.10.01)
  const agora = new Date();
  const ano2d = String(agora.getFullYear()).slice(-2);
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  
  const buildTag = `build ${ano2d}.${mes}.${dia}-${hora}${minuto}`;
  const buildSimples = `build ${ano2d}.${mes}`;

  // 3. Atualizar package.json se mudou a versão
  if (pkg.version !== novaVersaoNumero) {
    pkg.version = novaVersaoNumero;
    await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`📦 package.json atualizado para a versão: ${novaVersaoNumero}`);
  }

  // 4. Escrever lib/versao.ts
  const conteudoVersaoTs = `// lib/versao.ts
// Informações centralizadas de versão e build do sistema SGH
// Gerado automaticamente por scripts/atualizar-versao.mjs

export const VERSAO_SGH = '${novaVersaoSgh}';
export const VERSAO_NUMERO = '${novaVersaoNumero}';
export const BUILD_SGH = '${buildSimples}';
export const BUILD_COMPLETO_SGH = '${buildTag}';
export const NOME_VERSAO = 'Plataforma Hospitalar Integrada SGH';
export const COPYRIGHT_SGH = 'PAJO Tecnologia';
`;

  await fs.writeFile(versaoTsPath, conteudoVersaoTs, 'utf8');
  console.log(`✨ Versionamento atualizado: ${novaVersaoSgh} • ${buildSimples} (${buildTag})`);
}

main().catch((err) => {
  console.error('❌ Erro no script de versionamento:', err);
  process.exit(1);
});
