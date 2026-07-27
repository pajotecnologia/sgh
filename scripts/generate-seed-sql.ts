/**
 * Gera database/sgh_dados_demo.sql — dados demo para todas as tabelas principais.
 * Uso: npm run db:seed:sql
 *
 * Requer .env com ENCRYPTION_KEY e NEXTAUTH_SECRET (mesmos da aplicação em produção).
 */
import 'dotenv/config'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { hash } from 'bcryptjs'
import { criptografar, hashCpf } from '../lib/encryption'
import {
  ATENDIMENTOS_DEMO,
  ORIGENS_DEMO,
  PACIENTES_DEMO,
} from '../prisma/seed-demo-data'

const AGORA = new Date()

function formatSqlTs(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

const TS = formatSqlTs(AGORA)

const PREFIXO_NUMERO = `${AGORA.getFullYear()}${String(AGORA.getMonth() + 1).padStart(2, '0')}${String(AGORA.getDate()).padStart(2, '0')}`

/** Prefixos UUID — apenas caracteres hexadecimais (0-9, a-f) */
const ID = {
  usuario: 'a0000000',
  origem: '0b000000',
  paciente: '0c000000',
  endereco: '0d000000',
  alergia: '0e000000',
  medicamento: '0f000000',
  documento: '10000000',
  atendimento: '11000000',
  triagem: '12000000',
  sinaisVitais: '13000000',
  prontuario: '14000000',
  anamnese: '15000000',
  diagnostico: '16000000',
  prescricao: '17000000',
  itemPrescricao: '18000000',
  requisicao: '19000000',
  itemRequisicao: '1a000000',
  evolucao: '1b000000',
  aplicacao: '1c000000',
  encaminhamento: '1d000000',
  chamada: '1e000000',
  log: '1f000000',
} as const

function sqlStr(v: string | null | undefined): string {
  if (v == null) return 'NULL'
  return `'${v.replace(/'/g, "''")}'`
}

function uid(prefix8: string, n: number): string {
  return `${prefix8}-0000-4000-8000-${String(n).padStart(12, '0')}`
}

function nomeExibicao(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  if (partes.length > 1) return `${partes[0]} ${partes[partes.length - 1].charAt(0)}.`
  return partes[0]
}

function horasAtras(h: number): string {
  return formatSqlTs(new Date(Date.now() - h * 60 * 60 * 1000))
}

async function main() {
  const lines: string[] = []

  lines.push(`-- =============================================================================
-- SGH — Dados de demonstração (INSERT completo)
-- Gerado em: ${new Date().toISOString()}
--
-- PRÉ-REQUISITO: executar database/sgh_schema_completo.sql antes
--
-- IMPORTANTE — chaves no .env da aplicação DEVEM ser iguais às usadas na geração:
--   ENCRYPTION_KEY (64 hex) — descriptografia de CPF/nome/telefone
--   NEXTAUTH_SECRET — hash de busca por CPF (cpfHash)
--
-- DATAS: atendimentos/triagens usam timestamps relativos à geração (${TS.slice(0, 10)}).
-- O dashboard filtra por 30/90 dias — se importou SQL antigo, rode database/ajustar_datas_demo.sql
--
-- Login demo: admin@hospital.com / Sgh@2024!
--
-- Uso:
--   psql "$DATABASE_URL" -f database/sgh_dados_demo.sql
--
-- Para banco já populado, comente o bloco TRUNCATE ou use banco vazio.
-- =============================================================================

BEGIN;

-- Limpar dados demo (opcional — descomente se quiser recarregar do zero)
-- TRUNCATE TABLE
--   logs_auditoria, aplicacoes_medicamentos, itens_requisicao, requisicoes_exames,
--   itens_prescricao, prescricoes, evolucoes_medicas, encaminhamentos, diagnosticos,
--   anamneses, prontuarios_medicos, chamadas_painel, sinais_vitais, triagens,
--   atendimentos, documentos_pacientes, medicamentos_continuos, alergias, enderecos,
--   pacientes, origens_pacientes, config_smtp, config_painel, instituicoes,
--   tokens_redefinicao_senha, usuarios
-- CASCADE;

`)

  // --- Usuários ---
  const usuarios = [
    { id: uid(ID.usuario, 1), email: 'admin@hospital.com', nome: 'Administrador Sistema', role: 'ADMIN', crm: null, coren: null },
    { id: uid(ID.usuario, 2), email: 'medico@hospital.com', nome: 'Dr. Carlos Mendes', role: 'MEDICO', crm: '123456-SP', coren: null },
    { id: uid(ID.usuario, 3), email: 'enfermeiro@hospital.com', nome: 'Enf. Ana Beatriz Lima', role: 'ENFERMEIRO', crm: null, coren: 'COREN-SP 654321' },
    { id: uid(ID.usuario, 4), email: 'recepcao@hospital.com', nome: 'Joana Silva Santos', role: 'RECEPCIONISTA', crm: null, coren: null },
    { id: uid(ID.usuario, 5), email: 'diretor@hospital.com', nome: 'Dr. Roberto Faria', role: 'DIRETOR_CLINICO', crm: '789012-SP', coren: null },
    { id: uid(ID.usuario, 6), email: 'tecnico@hospital.com', nome: 'Téc. Enf. Paulo Rocha', role: 'TECNICO_ENFERMAGEM', crm: null, coren: null },
  ]

  const senhaHash = await hash('Sgh@2024!', 12)

  lines.push('-- Usuários')
  for (const u of usuarios) {
    lines.push(`INSERT INTO usuarios (id, email, "senhaHash", nome, role, crm, coren, ativo, "mfaAtivo", "createdAt", "updatedAt")
VALUES (${sqlStr(u.id)}, ${sqlStr(u.email)}, ${sqlStr(senhaHash)}, ${sqlStr(u.nome)}, ${sqlStr(u.role)}::"Role", ${sqlStr(u.crm)}, ${sqlStr(u.coren)}, TRUE, FALSE, '${TS}', '${TS}')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;`)
  }

  // --- Instituição / configs ---
  lines.push(`
-- Instituição e configurações
INSERT INTO instituicoes (id, "nomeMunicipio", "nomeInstituicao", endereco, bairro, cidade, estado, cep, "updatedAt")
VALUES ('b0000000-0000-4000-8000-000000000001', 'Município Demo', 'Hospital Municipal Central', 'Av. Principal, 1000', 'Centro', 'São Paulo', 'SP', '01001000', '${TS}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO config_painel (id, "vozAtiva", "tipoVoz", "corPrimaria", "corSecundaria", "corTexto", "mensagemPadrao", "velocidadeVoz", "updatedAt")
VALUES ('c0000000-0000-4000-8000-000000000001', TRUE, 'feminina', '#2563eb', '#f8fafc', '#1e293b', 'Comparecer ao consultório', 1.0, '${TS}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO config_smtp (id, host, porta, secure, usuario, "senhaCriptografada", "emailRemetente", ativo, "createdAt", "updatedAt")
VALUES ('default', '', 587, FALSE, '', '', '', FALSE, '${TS}', '${TS}')
ON CONFLICT (id) DO NOTHING;
`)

  // --- Origens ---
  lines.push('\n-- Origens de paciente')
  const origemIds: string[] = []
  ORIGENS_DEMO.forEach((o, i) => {
    const id = uid(ID.origem, i + 1)
    origemIds.push(id)
    lines.push(`INSERT INTO origens_pacientes (id, descricao, ativo, "createdAt", "procedenciaFicha")
VALUES (${sqlStr(id)}, ${sqlStr(o.descricao)}, TRUE, '${TS}', ${sqlStr(o.procedenciaFicha)})
ON CONFLICT (descricao) DO NOTHING;`)
  })

  // --- Pacientes ---
  lines.push('\n-- Pacientes, endereços, alergias, medicamentos')
  const pacienteIds: string[] = []

  for (let i = 0; i < PACIENTES_DEMO.length; i++) {
    const p = PACIENTES_DEMO[i]
    const id = uid(ID.paciente, i + 1)
    pacienteIds.push(id)
    const cpfCript = criptografar(p.cpf)
    const cpfH = hashCpf(p.cpf)
    const nomeCript = criptografar(p.nomeCompleto)
    const telCript = criptografar(p.telefone)
    const exib = nomeExibicao(p.nomeCompleto)
    const endId = uid(ID.endereco, i + 1)

    lines.push(`INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES (${sqlStr(id)}, ${sqlStr(cpfCript)}, ${sqlStr(cpfH)}, ${sqlStr(nomeCript)}, ${sqlStr(exib)}, '${p.dataNascimento}', ${sqlStr(p.sexoBiologico)}::"SexoBiologico", ${sqlStr(telCript)}, ${sqlStr(p.tipoSanguineo)}::"TipoSanguineo", ${sqlStr(p.convenio)}, ${sqlStr(p.nomeMae)}, ${sqlStr(p.profissao)}, ${sqlStr(`${p.endereco.cidade}/${p.endereco.estado}`)}, '${TS}', '${TS}')
ON CONFLICT ("cpfHash") DO NOTHING;`)

    lines.push(`INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES (${sqlStr(endId)}, ${sqlStr(id)}, ${sqlStr(p.endereco.cep)}, ${sqlStr(p.endereco.logradouro)}, ${sqlStr(p.endereco.numero)}, ${sqlStr(p.endereco.bairro)}, ${sqlStr(p.endereco.cidade)}, ${sqlStr(p.endereco.estado)}, '${TS}', '${TS}')
ON CONFLICT ("pacienteId") DO NOTHING;`)

    p.alergias.forEach((a, j) => {
      const alId = uid(ID.alergia, i * 10 + j + 1)
      lines.push(`INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES (${sqlStr(alId)}, ${sqlStr(id)}, ${sqlStr(a.descricao)}, ${sqlStr(a.gravidade)}, '${TS}')
ON CONFLICT (id) DO NOTHING;`)
    })

    p.medicamentos.forEach((m, j) => {
      const medId = uid(ID.medicamento, i * 10 + j + 1)
      lines.push(`INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES (${sqlStr(medId)}, ${sqlStr(id)}, ${sqlStr(m.nome)}, ${sqlStr(m.dose)}, ${sqlStr(m.frequencia)}, '${TS}', '${TS}')
ON CONFLICT (id) DO NOTHING;`)
    })

    if (i < 3) {
      const docId = uid(ID.documento, i + 1)
      lines.push(`INSERT INTO documentos_pacientes (id, "pacienteId", tipo, "nomeArquivo", "mimeType", "tamanhoBytes", "caminhoArquivo", "createdAt")
VALUES (${sqlStr(docId)}, ${sqlStr(id)}, 'RG', 'rg_demo.pdf', 'application/pdf', 1024, ${sqlStr(`uploads/demo/rg_${i + 1}.pdf`)}, '${TS}')
ON CONFLICT (id) DO NOTHING;`)
    }
  }

  const medicoId = usuarios[1].id
  const enfermeiroId = usuarios[2].id
  const recepcaoId = usuarios[3].id

  // --- Atendimentos e fluxo clínico ---
  lines.push('\n-- Atendimentos, triagens, prontuários, exames, chamadas, auditoria')

  ATENDIMENTOS_DEMO.forEach((a, idx) => {
    const attId = uid(ID.atendimento, idx + 1)
    const pacienteId = pacienteIds[a.pacienteIdx]
    const origemId = origemIds[a.origemIdx]
    const created = horasAtras(a.horasAtras)
    const numero = `${PREFIXO_NUMERO}-${String(idx + 1).padStart(4, '0')}DEMO`
    const precisaMedico = ['EM_ATENDIMENTO', 'CONCLUIDO', 'ALTA', 'INTERNADO'].includes(a.status)
    const medIdAtt = precisaMedico ? medicoId : null

    lines.push(`INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES (${sqlStr(attId)}, ${sqlStr(numero)}, ${sqlStr(pacienteId)}, ${medIdAtt ? sqlStr(medIdAtt) : 'NULL'}, ${sqlStr(a.status)}::"StatusAtendimento", ${sqlStr(a.setor)}, ${precisaMedico ? sqlStr('Consultório 01') : 'NULL'}, ${sqlStr(origemId)}, '${created}', '${created}')
ON CONFLICT ("numeroAtendimento") DO NOTHING;`)

    if (a.triagem) {
      const triId = uid(ID.triagem, idx + 1)
      const svId = uid(ID.sinaisVitais, idx + 1)
      const t = a.triagem
      const classif = horasAtras(Math.max(0, a.horasAtras - 0.25))

      lines.push(`INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES (${sqlStr(triId)}, ${sqlStr(attId)}, ${sqlStr(enfermeiroId)}, ${sqlStr(t.cor)}::"CorTriagem", ${sqlStr(t.queixa)}, ${sqlStr(t.categoria)}, '${created}', '${classif}', 'HAS, DM (DEMO)', 'CONFORME FICHA', ${sqlStr(`ESCALA DE DOR: ${t.dor}/10`)}, '${created}', '${created}')
ON CONFLICT ("atendimentoId") DO NOTHING;`)

      lines.push(`INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES (${sqlStr(svId)}, ${sqlStr(triId)}, ${t.paSistolica}, ${t.paDiastolica}, ${t.fc}, ${t.fr}, ${t.spo2}, ${t.temp}, ${t.dor}, 70, 170, 24.22, '${classif}', '${classif}')
ON CONFLICT ("triagemId") DO NOTHING;`)
    }

    if (a.prontuario) {
      const pr = a.prontuario
      const prontId = uid(ID.prontuario, idx + 1)
      const anamId = uid(ID.anamnese, idx + 1)
      const diagId = uid(ID.diagnostico, idx + 1)
      const prescId = uid(ID.prescricao, idx + 1)
      const itemPrescId = uid(ID.itemPrescricao, idx + 1)
      const reqId = uid(ID.requisicao, idx + 1)
      const itemReqId = uid(ID.itemRequisicao, idx + 1)
      const evolId = uid(ID.evolucao, idx + 1)

      lines.push(`INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES (${sqlStr(prontId)}, ${sqlStr(attId)}, '${created}', '${created}')
ON CONFLICT ("atendimentoId") DO NOTHING;`)

      lines.push(`INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES (${sqlStr(anamId)}, ${sqlStr(prontId)}, ${sqlStr(a.triagem?.queixa ?? 'QUEIXA DEMO')}, 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '${created}', '${created}')
ON CONFLICT ("prontuarioId") DO NOTHING;`)

      lines.push(`INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES (${sqlStr(diagId)}, ${sqlStr(prontId)}, ${sqlStr(pr.cid)}, ${sqlStr(pr.cidDesc)}, ${sqlStr(pr.cidDesc)}, TRUE, '${created}', '${created}')
ON CONFLICT (id) DO NOTHING;`)

      lines.push(`INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES (${sqlStr(prescId)}, ${sqlStr(prontId)}, 1, '${created}', 'Prescrição demo', '${created}', '${created}')
ON CONFLICT (id) DO NOTHING;`)

      const itemStatus = a.status === 'INTERNADO' ? 'PENDENTE' : 'APLICADO'
      lines.push(`INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES (${sqlStr(itemPrescId)}, ${sqlStr(prescId)}, ${sqlStr(pr.medicamento)}, '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, ${sqlStr(itemStatus)}::"StatusPrescricaoItem", '${created}', '${created}')
ON CONFLICT (id) DO NOTHING;`)

      if (itemStatus === 'APLICADO') {
        const aplId = uid(ID.aplicacao, idx + 1)
        lines.push(`INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES (${sqlStr(aplId)}, ${sqlStr(itemPrescId)}, ${sqlStr(enfermeiroId)}, '500MG', 'ORAL'::"ViaAdministracao", '${created}', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '${created}')
ON CONFLICT (id) DO NOTHING;`)
      }

      const urg = a.triagem?.cor === 'VERMELHO' ? 'EMERGENCIAL' : 'ROTINA'
      lines.push(`INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES (${sqlStr(reqId)}, ${sqlStr(prontId)}, 'LABORATORIO'::"CategoriaExame", ${sqlStr(urg)}::"UrgenciaExame", 'Investigação clínica demo', '${created}', '${created}')
ON CONFLICT (id) DO NOTHING;`)

      lines.push(`INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES (${sqlStr(itemReqId)}, ${sqlStr(reqId)}, ${sqlStr(pr.exame)}, 'Item demo SQL', '${created}', '${created}')
ON CONFLICT (id) DO NOTHING;`)

      lines.push(`INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES (${sqlStr(evolId)}, ${sqlStr(prontId)}, ${sqlStr(medicoId)}, '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '${created}')
ON CONFLICT (id) DO NOTHING;`)

      if (a.status === 'INTERNADO') {
        const encId = uid(ID.encaminhamento, idx + 1)
        lines.push(`INSERT INTO encaminhamentos (id, "prontuarioId", tipo, especialidade, prioridade, "resumoClinco", "createdAt", "updatedAt")
VALUES (${sqlStr(encId)}, ${sqlStr(prontId)}, 'INTERNACAO'::"TipoEncaminhamento", 'Clínica Médica', 'Alta', 'Internação para observação.', '${created}', '${created}')
ON CONFLICT (id) DO NOTHING;`)
      }
    }

    if (['EM_ATENDIMENTO', 'AGUARDANDO_ATENDIMENTO'].includes(a.status) && a.triagem) {
      const chId = uid(ID.chamada, idx + 1)
      lines.push(`INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES (${sqlStr(chId)}, ${sqlStr(attId)}, ${sqlStr(enfermeiroId)}, 'Consultório 02', 'GERAL', '${horasAtras(Math.max(0, a.horasAtras - 0.5))}')
ON CONFLICT (id) DO NOTHING;`)
    }

    const logId = uid(ID.log, idx + 1)
    lines.push(`INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES (${sqlStr(logId)}, ${sqlStr(recepcaoId)}, 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', ${sqlStr(attId)}, ${sqlStr(a.status)}, '127.0.0.1', '${created}')
ON CONFLICT (id) DO NOTHING;`)
  })

  lines.push(`
COMMIT;

-- Fim — ${PACIENTES_DEMO.length} pacientes, ${ATENDIMENTOS_DEMO.length} atendimentos demo
`)

  const outPath = join(process.cwd(), 'database', 'sgh_dados_demo.sql')
  writeFileSync(outPath, lines.join('\n'), 'utf8')
  console.log(`✅ SQL gerado: ${outPath}`)
  console.log(`   Pacientes: ${PACIENTES_DEMO.length} | Atendimentos: ${ATENDIMENTOS_DEMO.length}`)
  console.log('   Execute: psql "$DATABASE_URL" -f database/sgh_dados_demo.sql')
  console.log('   Login: admin@hospital.com / Sgh@2024!')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
