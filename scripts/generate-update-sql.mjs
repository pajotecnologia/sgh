/**
 * Gera database/sgh_update_schema.sql — versão IDEMPOTENTE do schema completo,
 * segura para aplicar num banco JÁ EXISTENTE (VPS em produção).
 *
 * O sgh_schema_completo.sql é "from empty": falha num banco com tabelas.
 * Este script converte-o em:
 *   - CREATE TYPE            -> DO block (ignora duplicate_object)
 *   - valores de enum        -> ALTER TYPE ... ADD VALUE IF NOT EXISTS
 *   - CREATE TABLE           -> CREATE TABLE IF NOT EXISTS
 *   - colunas de cada tabela -> ALTER TABLE ... ADD COLUMN IF NOT EXISTS
 *   - CREATE INDEX           -> CREATE INDEX IF NOT EXISTS
 *   - FOREIGN KEY            -> DO block (ignora duplicate_object)
 *
 * Nunca faz DROP. Nunca altera tipo de coluna existente.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const IN = path.join(root, 'database', 'sgh_schema_completo.sql')
const OUT = path.join(root, 'database', 'sgh_update_schema.sql')

const sql = await fs.readFile(IN, 'utf8')

const out = []
const avisos = []

out.push('-- =============================================================================')
out.push('-- SGH — ATUALIZACAO DE SCHEMA (idempotente)')
out.push('--')
out.push('-- Gerado por scripts/generate-update-sql.mjs a partir de')
out.push('-- database/sgh_schema_completo.sql (que por sua vez vem de prisma/schema.prisma).')
out.push('--')
out.push('-- Seguro para rodar num banco JA EXISTENTE e com dados. Pode ser reexecutado.')
out.push('-- Apenas CRIA o que falta (tipos, tabelas, colunas, indices, chaves).')
out.push('-- NUNCA remove nem altera colunas/tabelas existentes.')
out.push('--')
out.push('-- Uso:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sgh_update_schema.sql')
out.push('-- =============================================================================')
out.push('')
out.push('CREATE SCHEMA IF NOT EXISTS "public";')
out.push('')

// ---------------------------------------------------------------------------
// 1. Enums
// ---------------------------------------------------------------------------
out.push('-- ------------------------------------------------------------------')
out.push('-- 1. Tipos enumerados')
out.push('-- ------------------------------------------------------------------')
out.push('')

const reEnum = /CREATE TYPE "([^"]+)" AS ENUM \(([^)]*)\);/g
let m
let nEnums = 0
while ((m = reEnum.exec(sql)) !== null) {
  const [, nome, valoresRaw] = m
  nEnums++
  out.push(`DO $$ BEGIN`)
  out.push(`  CREATE TYPE "${nome}" AS ENUM (${valoresRaw});`)
  out.push(`EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
  // Enum já existente pode estar sem valores novos (ex.: AGUARDANDO_INTERNACAO)
  const valores = valoresRaw.split(',').map((v) => v.trim()).filter(Boolean)
  for (const v of valores) {
    out.push(`ALTER TYPE "${nome}" ADD VALUE IF NOT EXISTS ${v};`)
  }
  out.push('')
}

// ---------------------------------------------------------------------------
// 2. Tabelas + colunas
// ---------------------------------------------------------------------------
out.push('-- ------------------------------------------------------------------')
out.push('-- 2. Tabelas (cria as que faltam) e colunas (adiciona as que faltam)')
out.push('-- ------------------------------------------------------------------')
out.push('')

const reTable = /CREATE TABLE "([^"]+)" \(\n([\s\S]*?)\n\);/g
let nTables = 0
let nCols = 0
while ((m = reTable.exec(sql)) !== null) {
  const [, tabela, corpo] = m
  nTables++

  out.push(`-- ${tabela}`)
  out.push(`CREATE TABLE IF NOT EXISTS "${tabela}" (`)
  out.push(corpo)
  out.push(`);`)

  // Colunas individuais — cobre tabelas que já existiam mas ganharam campos
  for (const linhaRaw of corpo.split('\n')) {
    const linha = linhaRaw.trim().replace(/,$/, '')
    if (!linha.startsWith('"')) continue // pula CONSTRAINT ... PRIMARY KEY

    const sep = linha.indexOf('" ')
    if (sep === -1) continue
    const coluna = linha.slice(1, sep)
    let def = linha.slice(sep + 2).trim()

    const notNull = /\bNOT NULL\b/.test(def)
    const temDefault = /\bDEFAULT\b/.test(def)

    if (notNull && !temDefault) {
      if (/^TIMESTAMP/i.test(def)) {
        // updatedAt & afins: default permite adicionar em tabela com dados
        def += ' DEFAULT CURRENT_TIMESTAMP'
      } else {
        // NOT NULL sem default falharia se a tabela já tiver linhas.
        // Adiciona como nullable; o Prisma continua validando na aplicação.
        def = def.replace(/\s*\bNOT NULL\b/, '')
        avisos.push(`${tabela}.${coluna} — adicionada como NULL (NOT NULL sem DEFAULT)`)
      }
    }

    nCols++
    out.push(`ALTER TABLE "${tabela}" ADD COLUMN IF NOT EXISTS "${coluna}" ${def};`)
  }
  out.push('')
}

// ---------------------------------------------------------------------------
// 3. Índices
// ---------------------------------------------------------------------------
out.push('-- ------------------------------------------------------------------')
out.push('-- 3. Indices e restricoes de unicidade')
out.push('-- ------------------------------------------------------------------')
out.push('')

const reIndex = /CREATE (UNIQUE )?INDEX "([^"]+)" ON (.+?);\n/g
let nIdx = 0
while ((m = reIndex.exec(sql)) !== null) {
  const [, unique, nome, resto] = m
  nIdx++
  out.push(`CREATE ${unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS "${nome}" ON ${resto};`)
}
out.push('')

// ---------------------------------------------------------------------------
// 4. Foreign keys
// ---------------------------------------------------------------------------
out.push('-- ------------------------------------------------------------------')
out.push('-- 4. Chaves estrangeiras')
out.push('-- ------------------------------------------------------------------')
out.push('')

const reFk = /ALTER TABLE "([^"]+)" ADD CONSTRAINT "([^"]+)" (FOREIGN KEY .+?);\n/g
let nFk = 0
while ((m = reFk.exec(sql)) !== null) {
  const [, tabela, nome, corpo] = m
  nFk++
  out.push(`DO $$ BEGIN`)
  out.push(`  ALTER TABLE "${tabela}" ADD CONSTRAINT "${nome}" ${corpo};`)
  out.push(`EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
}
out.push('')

if (avisos.length) {
  out.push('-- ------------------------------------------------------------------')
  out.push('-- AVISOS (colunas relaxadas para permitir aplicacao em tabela com dados)')
  for (const a of avisos) out.push(`--   ${a}`)
  out.push('-- ------------------------------------------------------------------')
  out.push('')
}

await fs.writeFile(OUT, out.join('\n'), 'utf8')

console.log(`Gerado: ${path.relative(root, OUT)}`)
console.log(`  enums: ${nEnums}  tabelas: ${nTables}  colunas: ${nCols}  indices: ${nIdx}  FKs: ${nFk}`)
if (avisos.length) {
  console.log(`  avisos: ${avisos.length}`)
  for (const a of avisos) console.log(`    - ${a}`)
}
