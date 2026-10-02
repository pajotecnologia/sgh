import './load-env.mjs';
import pg from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPrismaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

async function main() {
  const url = process.env.DATABASE_URL || 'postgresql://postgres:JwxhBE6vwcBnsyzZI9RFJ03geeh0xwiVjTdNLuNukzeAHMHzYKtNhJz8lECEiHMm@169.58.246.70:5432/sgh';
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  console.log('✅ Conectado ao PostgreSQL:', url.replace(/:[^:@]+@/, ':****@'));

  // 1. Obter todas as tabelas e colunas do PostgreSQL
  const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  const tableNames = tablesRes.rows.map(r => r.table_name);
  console.log(`\n📊 Total de tabelas públicas no PostgreSQL: ${tableNames.length}`);

  const colunasPorTabela = new Map();
  for (const t of tableNames) {
    const colRes = await client.query('SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position', [t]);
    colunasPorTabela.set(t, new Set(colRes.rows.map(r => r.column_name)));
  }

  // 2. Extrair models e campos de schema.prisma
  const schemaRaw = await fs.readFile(schemaPrismaPath, 'utf8');
  const modelRegex = /model\s+(\w+)\s+{([\s\S]*?)\n}/g;
  let match;

  const camposPrismaPorTabela = new Map();

  while ((match = modelRegex.exec(schemaRaw)) !== null) {
    const modelName = match[1];
    const body = match[2];
    
    // Obter @@map se houver
    const mapMatch = body.match(/@@map\("([^"]+)"\)/);
    const tableName = mapMatch ? mapMatch[1] : modelName;

    // Extrair campos escalares (ignorando diretivas, relatórios e relacionamentos)
    const lines = body.split('\n');
    const fields = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;
      const parts = trimmed.split(/\s+/);
      let fieldName = parts[0];
      const fieldType = parts[1]?.replace('?', '').replace('[]', '');
      
      const colMapMatch = trimmed.match(/@map\("([^"]+)"\)/);
      if (colMapMatch) {
        fieldName = colMapMatch[1];
      }
      
      // Se não for um model de relacionamento
      if (fieldName && fieldType) {
        fields.push({ fieldName, fieldType });
      }
    }
    camposPrismaPorTabela.set(tableName, { modelName, fields });
  }

  console.log(`\n📋 Models mapeados no schema.prisma: ${camposPrismaPorTabela.size}`);

  // 3. Comparar integridade
  console.log('\n🔍 Verificando integridade das tabelas e colunas...');
  let diferencas = 0;

  for (const [tableName, { modelName, fields }] of camposPrismaPorTabela.entries()) {
    if (!colunasPorTabela.has(tableName)) {
      console.warn(`❌ Tabela AUSENTE no PostgreSQL: ${tableName} (Model: ${modelName})`);
      diferencas++;
      continue;
    }

    const colsDb = colunasPorTabela.get(tableName);
    for (const f of fields) {
      // Ignorar campos de relação (que apontam para outros models)
      if (camposPrismaPorTabela.has(f.fieldType) || Array.from(camposPrismaPorTabela.values()).some(v => v.modelName === f.fieldType)) {
        continue;
      }
      // Ignorar tipos compostos/enums que não são colunas diretas se não casar
      if (!colsDb.has(f.fieldName)) {
        console.warn(`⚠️ Coluna AUSENTE na tabela "${tableName}": ${f.fieldName} (${f.fieldType})`);
        diferencas++;
      }
    }
  }

  if (diferencas === 0) {
    console.log('✨ TODAS as tabelas e colunas do Prisma estão 100% sincronizadas no PostgreSQL!');
  } else {
    console.log(`\n⚠️ Foram encontradas ${diferencas} divergências de colunas.`);
  }

  // 4. Verificar tabelas de Uploads e Imagens
  console.log('\n🖼️ Verificando tabelas de persistência de uploads e arquivos...');
  const uploadsCount = await client.query('SELECT count(*) FROM tb_uploads_sistema');
  console.log(`  • Arquivos/uploads persistidos em tb_uploads_sistema: ${uploadsCount.rows[0].count}`);

  const instRes = await client.query('SELECT id, "nomeInstituicao", "logomarcaUrl" FROM instituicoes LIMIT 1');
  if (instRes.rows[0]) {
    const inst = instRes.rows[0];
    console.log(`  • Instituição: "${inst.nomeInstituicao}"`);
    console.log(`  • Logomarca configurada: ${inst.logomarcaUrl ? (inst.logomarcaUrl.startsWith('data:') ? 'Base64 Data URL (' + inst.logomarcaUrl.length + ' chars)' : inst.logomarcaUrl) : '(Nenhuma logomarca cadastrada)'}`);
  }

  const painelRes = await client.query('SELECT * FROM config_painel LIMIT 1');
  if (painelRes.rows[0]) {
    console.log(`  • Painel TV: Voz ativa=${painelRes.rows[0].vozAtiva}, Cor Primaria=${painelRes.rows[0].corPrimaria}`);
  }

  await client.end();
}

main().catch(console.error);
