# Protocolo de Atualização em Produção — SGH (sgh.pajotech.com.br)

Este documento descreve as diretrizes e os comandos padronizados para realizar atualizações rápidas, seguras e com **zero tempo de inatividade** no ambiente de produção do sistema **SGH (sgh.pajotech.com.br)**.

---

## 1. Diretrizes de Segurança para Atualizações

1. **Evitar Dependências Desnecessárias**:
   - Sempre prefira implementar componentes de interface com **React nativo + Tailwind CSS + Lucide Icons**.
   - Se precisar adicionar um novo pacote no `package.json`, certifique-se de testar o `npm install` antes do envio para evitar erros de compilação na VPS.

2. **Validação Local Obrigatória**:
   - NUNCA suba atualizações sem validar a compilação local: `npm run build`.
   - Se houver alterações no banco de dados, execute `npm run db:update:sql` para regenerar os arquivos `.sql` de apoio.

3. **Logomarcas e Arquivos de Mídia**:
   - A rota de uploads (`/api/uploads`) permite a leitura pública de imagens (`.png`, `.jpg`, `.webp`) para garantir que os relatórios e impressões médicas carreguem as logomarcas da instituição em produção.

---

## 2. Passo a Passo do Desenvolvimento (Local -> GitHub)

Quando terminar uma alteração no código local:

```bash
# 1. Atualiza os arquivos SQL de apoio na pasta database/
npm run db:update:sql

# 2. Testa a compilação local (deve finalizar com zero erros)
npm run build

# 3. Envia para o repositório remoto
git add .
git commit -m "feat: sua mensagem de alteracao"
git push origin main
```

---

## 3. Passo a Passo da Atualização em Produção (VPS / aaPanel)

Acesse a pasta do projeto na VPS (`/www/wwwroot/sgh.pajotech.com.br`) pelo terminal ou aaPanel e rode **este comando único**:

```bash
cd /www/wwwroot/sgh.pajotech.com.br && git pull origin main && npm run build && cp -r .next/static .next/standalone/.next/ 2>/dev/null || true && cp -r public .next/standalone/ 2>/dev/null || true
```

Depois clique em **Restart** no projeto `sgh` no aaPanel.

---

## 4. Mapeamento das Portas na VPS

| Aplicação | Porta | Proxy Nginx aaPanel |
|-----------|-------|---------------------|
| **SGH (Hospitalar)** | **`3002`** | `http://127.0.0.1:3002` |
| **Contratos** | **`3005`** | `http://127.0.0.1:3005` |
| **DNYL (Flats)** | **`3010`** | `http://127.0.0.1:3010` |

---

## 5. Referência do Banco de Dados (pgAdmin4)

Caso deseje atualizar o banco manualmente pelo **pgAdmin4**:
- Execute o script [`database/sgh_update_schema.sql`](file:///c:/Users/AdminUser/Documentos/PROJETOS_SISTEMAS/sgh/database/sgh_update_schema.sql) na ferramenta de Query Tool (F5).
