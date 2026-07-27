# Seed de demonstração — SGH

## SQL completo (`sgh_dados_demo.sql`)

Popula **todas as tabelas principais** com dados fictícios (25 pacientes, 25 atendimentos, triagens, prontuários, exames, etc.).

### Executar (PostgreSQL)

```bash
# 1. Schema vazio
psql "$DATABASE_URL" -f database/sgh_schema_completo.sql

# 2. Dados demo
psql "$DATABASE_URL" -f database/sgh_dados_demo.sql
```

**Dashboard vazio?** O SQL demo antigo usava datas fixas (jan/2026). O dashboard filtra **30 ou 90 dias**. Rode:

```bash
psql "$DATABASE_URL" -f database/ajustar_datas_demo.sql
```

Ou regenere o SQL com datas atuais: `npm run db:seed:sql` e reimporte.

**Importante:** `ENCRYPTION_KEY` e `NEXTAUTH_SECRET` no `.env` da aplicação devem ser **idênticos** aos usados na geração do arquivo. Regere com `npm run db:seed:sql` se mudar a chave.

Para recarregar do zero, descomente o bloco `TRUNCATE` no início do SQL.

### Regenerar o arquivo

```bash
npm run db:seed:sql
```

O instalador VPS inclui `database/sgh_dados_demo.sql` quando presente.

## SQL parcial (`seed_usuarios_iniciais.sql`)

Apenas **6 usuários** com senha `Sgh@2024!`. Use após importar o schema.

## Seed completo (`npm run db:seed`)

Popula **toda a base** com dados fictícios:

| Entidade | Quantidade |
|----------|------------|
| Pacientes | 25 |
| Atendimentos | 25 |
| Origens | 5 |
| Usuários | 6 |

Inclui: endereços, alergias, medicamentos contínuos, triagens Manchester, sinais vitais, prontuários, anamneses, diagnósticos CID-10, prescrições, requisição de exames, evoluções, chamadas de painel e logs de auditoria.

### Executar

```bash
npm run db:seed
```

Para VPS remota:

```bash
DATABASE_URL="postgresql://..." npm run db:seed
```

**Importante:** `ENCRYPTION_KEY` no `.env` deve ser a mesma do ambiente de destino.

### Login

- `admin@hospital.com` / `Sgh@2024!`
- `medico@hospital.com` / `Sgh@2024!`
- `enfermeiro@hospital.com` / `Sgh@2024!`

Reexecutar o seed **não duplica** pacientes (CPF único) nem atendimentos já existentes com o mesmo número.
