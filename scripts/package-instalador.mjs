/**
 * Monta instalador/ plano — copiar conteúdo para a raiz do site (wwwroot).
 * Estrutura: server.js, index.html, index.js na raiz (sem subpasta app/).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const releaseApp = path.join(root, 'release', 'app')
const instaladorRoot = path.join(root, 'instalador')
const templatesDir = path.join(__dirname, 'instalador')

const SKIP_FILES = new Set(['.env', '.env.local'])

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function copyReleaseFlat(src, dst) {
  const entries = await fs.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    if (SKIP_FILES.has(entry.name)) continue
    const from = path.join(src, entry.name)
    const to = path.join(dst, entry.name)
    if (entry.isDirectory()) {
      await fs.cp(from, to, { recursive: true, dereference: true })
    } else {
      await fs.copyFile(from, to)
    }
  }
}

async function patchPackageJson(dir) {
  const pkgPath = path.join(dir, 'package.json')
  if (!(await exists(pkgPath))) return
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'))
  pkg.scripts = pkg.scripts || {}
  pkg.scripts.start = 'node index.js'
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2))
}

async function main() {
  if (!(await exists(releaseApp))) {
    console.error('ERRO: release/app não encontrada. Execute: npm run build:release')
    process.exit(1)
  }

  const sqlSchema = path.join(root, 'database', 'sgh_schema_completo.sql')
  if (!(await exists(sqlSchema))) {
    console.error('ERRO: database/sgh_schema_completo.sql não encontrado.')
    process.exit(1)
  }

  await fs.rm(instaladorRoot, { recursive: true, force: true })
  await fs.mkdir(instaladorRoot, { recursive: true })

  // App compilada na raiz do instalador
  await copyReleaseFlat(releaseApp, instaladorRoot)

  // index.html também em public/ (Next.js serve em /index.html)
  const indexHtml = path.join(templatesDir, 'index.html')
  await fs.copyFile(indexHtml, path.join(instaladorRoot, 'index.html'))
  const publicDir = path.join(instaladorRoot, 'public')
  await fs.mkdir(publicDir, { recursive: true })
  await fs.copyFile(indexHtml, path.join(publicDir, 'index.html'))

  // Binários nativos específicos de Windows não servem numa VPS Linux.
  // Se `sharp` for para o servidor com o .node de win32, o require() falha em runtime.
  // Sem sharp, o Next.js usa o otimizador de imagem embutido.
  for (const dir of ['sharp', '@img']) {
    await fs.rm(path.join(instaladorRoot, 'node_modules', dir), { recursive: true, force: true })
  }

  // Templates de entrada e arranque
  const rootTemplates = [
    'index.js',
    'ecosystem.config.cjs',
    'nginx.example.conf',
    'nginx-aapanel-CORRIGIR-404.conf',
    'sgh.service.example',
    '.env.example',
    'instalar.sh',
    'atualizar.sh',
    'verificar.sh',
    'LEIA-ME.md',
    'ATUALIZAR-VPS.md',
  ]
  for (const file of rootTemplates) {
    await fs.copyFile(path.join(templatesDir, file), path.join(instaladorRoot, file))
  }

  await fs.mkdir(path.join(instaladorRoot, 'database'), { recursive: true })

  // Schema "from empty" — só serve para servidor novo (instalar.sh)
  await fs.copyFile(sqlSchema, path.join(instaladorRoot, 'database', 'sgh_schema_completo.sql'))

  // Schema idempotente — é o que atualizar.sh aplica numa VPS com dados
  const sqlUpdate = path.join(root, 'database', 'sgh_update_schema.sql')
  if (!(await exists(sqlUpdate))) {
    console.error('ERRO: database/sgh_update_schema.sql não encontrado. Execute: node scripts/generate-update-sql.mjs')
    process.exit(1)
  }
  await fs.copyFile(sqlUpdate, path.join(instaladorRoot, 'database', 'sgh_update_schema.sql'))

  const sqlConstraints = path.join(root, 'database', 'sgh_update_constraints.sql')
  if (!(await exists(sqlConstraints))) {
    console.error('ERRO: database/sgh_update_constraints.sql não encontrado.')
    process.exit(1)
  }
  await fs.copyFile(sqlConstraints, path.join(instaladorRoot, 'database', 'sgh_update_constraints.sql'))

  await fs.copyFile(
    path.join(templatesDir, 'database', 'seed_usuarios_iniciais.sql'),
    path.join(instaladorRoot, 'database', 'seed_usuarios_iniciais.sql')
  )

  await patchPackageJson(instaladorRoot)

  console.log('')
  console.log('==============================================')
  console.log('  Pacote instalador pronto (wwwroot)')
  console.log('==============================================')
  console.log(`  Pasta: ${instaladorRoot}`)
  console.log('')
  console.log('  Copie TODO o conteúdo para:')
  console.log('    /www/wwwroot/sgh.pajotech.com.br/')
  console.log('')
  console.log('  Depois: cp .env.example .env  (editar DATABASE_URL)')
  console.log('          chmod +x instalar.sh && ./instalar.sh')
  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
