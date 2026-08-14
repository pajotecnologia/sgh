import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const schemaPath = path.join(root, 'database', 'sgh_schema_completo.sql')
const constraintsPath = path.join(root, 'database', 'sgh_update_constraints.sql')
const seedPath = path.join(root, 'database', 'sgh_dados_demo.sql')
const outputPath = path.join(root, 'database', 'sgh_banco_completo.sql')

const schemaSql = await fs.readFile(schemaPath, 'utf8')
const constraintsSql = await fs.readFile(constraintsPath, 'utf8')
const seedSql = await fs.readFile(seedPath, 'utf8')

const content = []

content.push('-- =============================================================================')
content.push('-- SGH (Sistema de Gestão Hospitalar) — BANCO DE DADOS COMPLETO')
content.push('--')
content.push('-- Este arquivo contém:')
content.push('--   1. DDL Completa (Schemas, Enums, Tabelas, Índices e Foreign Keys)')
content.push('--   2. Regras de Negócio, Constraints e Triggers Farmacêuticos')
content.push('--   3. Carga Inicial de Dados Demo (Usuários, Pacientes, Atendimentos, etc.)')
content.push('--')
content.push('-- Banco de Dados: PostgreSQL (>= 14)')
content.push('-- Como importar:')
content.push('--   psql "$DATABASE_URL" -f database/sgh_banco_completo.sql')
content.push('-- =============================================================================')
content.push('')
content.push('-- =============================================================================')
content.push('-- PARTE 1: ESTRUTURA DO BANCO (SCHEMA, ENUMS, TABELAS E FKs)')
content.push('-- =============================================================================')
content.push('')
content.push(schemaSql)
content.push('')
content.push('-- =============================================================================')
content.push('-- PARTE 2: CONSTRAINTS, ÍNDICES ADICIONAIS E TRIGGERS')
content.push('-- =============================================================================')
content.push('')
content.push(constraintsSql)
content.push('')
content.push('-- =============================================================================')
content.push('-- PARTE 3: DADOS INICIAIS E DEMONSTRAÇÃO')
content.push('-- =============================================================================')
content.push('')
content.push(seedSql)

await fs.writeFile(outputPath, content.join('\n'), 'utf8')
console.log(`✅ Banco SQL completo gerado com sucesso: ${outputPath}`)
