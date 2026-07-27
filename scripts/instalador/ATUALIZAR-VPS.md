# SGH — Atualizar uma VPS que já está a funcionar

Este guia é para quem **já tem o SGH a correr** e quer enviar uma nova versão
do código e atualizar o banco de dados **sem perder dados**.

> Para uma instalação nova (servidor vazio), use `LEIA-ME.md` e `instalar.sh`.

---

## O que esta atualização faz

| Item | O que acontece |
|------|----------------|
| Aplicação (`.next/`, `server.js`, `node_modules/`) | **Substituída** pela nova versão |
| `.env` | **Preservado** — não é tocado |
| `uploads/` (documentos, PDFs de exames) | **Preservado** |
| Banco de dados | Recebe **apenas** as tabelas/colunas/índices novos |
| Dados existentes (pacientes, atendimentos, prontuários) | **Preservados** |
| Backup do banco | Criado automaticamente antes de alterar |

O script de banco (`database/sgh_update_schema.sql`) é **idempotente**: só cria o
que falta e pode ser reexecutado sem efeito colateral. Ele **nunca** apaga nem
altera tabelas ou colunas que já existem.

---

## Novidades desta versão (banco)

Tabelas novas que serão criadas:

- **Internação:** `clinicas`, `leitos`, `fichas_internacao_alta`, `fichas_ccih`,
  `fichas_multidisciplinares`, `fichas_evolucao_turno`, `fichas_sinais_vitais`,
  `fichas_sae`, `fichas_internacao_obstetrica`, `fichas_bercario`,
  `evolucoes_multiprofissional`
- **Farmácia:** `tb_medicamento_lote`, `tb_farmacia_movimentacao`,
  `tb_medicamento_sinonimo`, `tb_farmacia_entrada_nf`,
  `tb_farmacia_entrada_nf_item`, `tb_farmacia_saida`, `tb_farmacia_saida_item`
- **Cadastros:** `prescricoes_medicas_padrao`, `itens_prescricao_medica_padrao`

Colunas novas em tabelas existentes, entre outras:

- `atendimentos.leitoId`, `atendimentos.obstetrico`, `atendimentos.vaiInternar`
- `prescricoes.tipo` (PS / RECEITA_ALTA)
- `itens_prescricao.unidadeMedida`
- `prontuarios_medicos.encerradoEm`, `prontuarios_medicos.encerradoPorId`
- `tb_medicamento.estoqueMinimo`
- `config_painel`: `layoutDividido`, `intervaloRotacaoSegundos`, `posicaoMidia`, `imagensRotativas`

Valor novo no enum `StatusAtendimento`: **`AGUARDANDO_INTERNACAO`**.

---

## Pré-requisitos no servidor

```bash
psql --version
```

Se não existir, instale o cliente PostgreSQL (necessário para aplicar o SQL e
fazer o backup):

```bash
sudo apt install -y postgresql-client
```

---

## Passo 1 — Enviar os ficheiros

A partir da **sua máquina**, na raiz do projeto SGH. Envie o **conteúdo** da
pasta `instalador/` para a pasta do site.

```bash
rsync -avz --exclude '.env' --exclude 'uploads/' --exclude 'backups/' instalador/ usuario@SEU_IP:/www/wwwroot/sgh.pajotech.com.br/
```

> **Nunca use `--delete`** neste rsync. Ele apagaria `uploads/`, `.env` e os
> backups no servidor.

Alternativa sem rsync: compacte e envie por FTP / aaPanel File Manager.

```bash
cd instalador && zip -r ../sgh-atualizacao.zip . && cd ..
```

Depois descompacte **por cima** da pasta do site no painel.

---

## Passo 2 — Aplicar a atualização

No servidor:

```bash
cd /www/wwwroot/sgh.pajotech.com.br
chmod +x atualizar.sh
./atualizar.sh
```

O script executa, por esta ordem:

1. **Backup** do banco para `backups/sgh_db_<data>_<hora>.sql`
2. **Atualização do schema**, aplicando numa **única transação**:
   - `database/sgh_update_schema.sql` (tabelas, colunas, índices, chaves)
   - `database/sgh_update_constraints.sql` (checks e trigger da farmácia)
3. **Reinício** do serviço (PM2 ou systemd)

Como o passo 2 corre em transação única, se algo falhar o PostgreSQL faz
**rollback automático** e o banco fica exatamente como estava.

---

## Passo 3 — Verificar

```bash
./verificar.sh
```

Deve indicar Node a correr, porta 3000 em escuta e `/login` a responder
200/307. Depois abra o site e confirme que os módulos novos aparecem no menu
(Internamento, Farmácia, Cadastros).

---

## Reverter, se algo correr mal

Restaurar o banco a partir do backup gerado no passo 1:

```bash
psql "$DATABASE_URL" -f backups/sgh_db_<data>_<hora>.sql
```

Para a aplicação, mantenha o pacote anterior guardado antes de sobrescrever.
Uma forma simples é copiar a pasta do site antes de enviar a atualização:

```bash
cp -a /www/wwwroot/sgh.pajotech.com.br /www/wwwroot/sgh-backup-$(date +%F)
```

---

## Notas

- **PM2 continua a servir a versão antiga em memória** até reiniciar. O
  `atualizar.sh` já faz `pm2 restart sgh`; se iniciar à mão, não esqueça.
- Se o browser mostrar `ChunkLoadError` depois da atualização, é cache do
  cliente com a build antiga: force refresh (Ctrl+Shift+R).
- Este pacote **não inclui** `sharp` (binário nativo). O Next.js usa o
  otimizador de imagem embutido, o que é suficiente para o SGH.
- O `.env` não é alterado. Se a nova versão precisar de variáveis novas,
  compare com `.env.example` e acrescente manualmente as que faltarem.
