// prisma/seed.ts — Usuários, configuração institucional e 25+ cadastros demo
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { criptografar, hashCpf } from '../lib/encryption'
import { gerarNumeroAtendimento } from '../lib/attendance'
import {
  ATENDIMENTOS_DEMO,
  ORIGENS_DEMO,
  PACIENTES_DEMO,
} from './seed-demo-data'
import { seedPrescricoesMedicasPadrao } from './seed-prescricoes-medicas'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function nomeExibicaoDe(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/)
  if (partes.length > 1) {
    return `${partes[0]} ${partes[partes.length - 1].charAt(0)}.`
  }
  return partes[0]
}

function horasAtras(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000)
}

async function seedUsuarios() {
  const senhaPadrao = await hash('Sgh@2024!', 12)
  const usuarios = [
    { email: 'admin@hospital.com', nome: 'Administrador Sistema', role: 'ADMIN' as const },
    { email: 'medico@hospital.com', nome: 'Dr. Carlos Mendes', role: 'MEDICO' as const, crm: '123456-SP' },
    { email: 'enfermeiro@hospital.com', nome: 'Enf. Ana Beatriz Lima', role: 'ENFERMEIRO' as const, coren: 'COREN-SP 654321' },
    { email: 'recepcao@hospital.com', nome: 'Joana Silva Santos', role: 'RECEPCIONISTA' as const },
    { email: 'diretor@hospital.com', nome: 'Dr. Roberto Faria', role: 'DIRETOR_CLINICO' as const, crm: '789012-SP' },
    { email: 'tecnico@hospital.com', nome: 'Téc. Enf. Paulo Rocha', role: 'TECNICO_ENFERMAGEM' as const },
    { email: 'farmacia@hospital.com', nome: 'Farmacêutico(a) — Triagem', role: 'FARMACEUTICO' as const },
  ]

  const map = new Map<string, string>()
  for (const u of usuarios) {
    const row = await prisma.usuario.upsert({
      where: { email: u.email },
      update: { senhaHash: senhaPadrao, ativo: true },
      create: { ...u, senhaHash: senhaPadrao, ativo: true },
    })
    map.set(u.email, row.id)
    console.log(`✅ Usuário: ${u.email}`)
  }
  return map
}

async function seedFarmacia() {
  // Se já existe movimentação, não duplicar seed (idempotência)
  const [jaTemEntrada, jaTemSaida, jaTemPrescricaoIntegrada] = await Promise.all([
    prisma.tbFarmaciaEntradaNf.count(),
    prisma.tbFarmaciaSaida.count(),
    prisma.tbPrescricaoCabecalho.count(),
  ])

  // Catálogo mínimo
  const meds = [
    { nome: 'Varfarina', principioAtivo: 'varfarina', saldoAtual: 120 },
    { nome: 'AAS', principioAtivo: 'ácido acetilsalicílico', saldoAtual: 200 },
    { nome: 'Ibuprofeno', principioAtivo: 'ibuprofeno', saldoAtual: 180 },
    { nome: 'Digoxina', principioAtivo: 'digoxina', saldoAtual: 40 },
    { nome: 'Amiodarona', principioAtivo: 'amiodarona', saldoAtual: 25 },
  ] as const

  const idsPorPrincipio = new Map<string, string>()

  for (const m of meds) {
    const ja = await prisma.tbMedicamento.findFirst({ where: { principioAtivo: m.principioAtivo } })
    const row = ja
      ? await prisma.tbMedicamento.update({
          where: { id: ja.id },
          data: { nome: m.nome, saldoAtual: m.saldoAtual, ativo: true },
        })
      : await prisma.tbMedicamento.create({
          data: {
            nome: m.nome,
            principioAtivo: m.principioAtivo,
            saldoAtual: m.saldoAtual,
            saldoReservado: 0,
            ativo: true,
          },
        })

    idsPorPrincipio.set(m.principioAtivo, row.id)
  }

  // Sinônimos iniciais (editáveis via UI em /farmacia/sinonimos)
  const sinonimos = [
    { principioAtivo: 'ácido acetilsalicílico', sinonimos: ['AAS', 'ácido acetilsalicilico', 'acido acetilsalicilico'] },
    { principioAtivo: 'varfarina', sinonimos: ['coumadin', 'warfarin'] },
    { principioAtivo: 'digoxina', sinonimos: ['digoxin'] },
    { principioAtivo: 'amiodarona', sinonimos: ['amiodarone'] },
    { principioAtivo: 'ibuprofeno', sinonimos: ['ibuprofen'] },
  ] as const

  const norm = (raw: string) =>
    raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')

  for (const s of sinonimos) {
    const medId = idsPorPrincipio.get(s.principioAtivo)
    if (!medId) continue
    for (const syn of s.sinonimos) {
      const sinonimoNorm = norm(syn)
      if (!sinonimoNorm) continue
      const existe = await prisma.tbMedicamentoSinonimo.findFirst({
        where: { medicamentoId: medId, sinonimoNorm },
      })
      if (existe) continue
      await prisma.tbMedicamentoSinonimo.create({
        data: { medicamentoId: medId, sinonimo: syn, sinonimoNorm, ativo: true },
      })
    }
  }

  const matriz = [
    {
      a: 'varfarina',
      b: 'ácido acetilsalicílico',
      risco: 'CRITICO' as const,
      efeitoClinico: 'Risco aumentado de sangramento.',
      sugestao: 'Evitar associação; se inevitável, monitorar INR e sangramentos.',
    },
    {
      a: 'digoxina',
      b: 'amiodarona',
      risco: 'CRITICO' as const,
      efeitoClinico: 'Aumento dos níveis de digoxina e risco de toxicidade digitálica.',
      sugestao: 'Considerar ajuste de dose e monitorar níveis/sintomas.',
    },
  ] as const

  for (const r of matriz) {
    const existe = await prisma.tbInteracaoMatriz.findFirst({
      where: {
        OR: [
          { principioAtivoA: r.a, principioAtivoB: r.b },
          { principioAtivoA: r.b, principioAtivoB: r.a },
        ],
      },
    })
    if (existe) continue
    await prisma.tbInteracaoMatriz.create({
      data: {
        principioAtivoA: r.a,
        principioAtivoB: r.b,
        risco: r.risco,
        efeitoClinico: r.efeitoClinico,
        sugestaoSistema: r.sugestao,
      },
    })
  }
  console.log('✅ Farmácia: catálogo + matriz de interações')

  // ==========================================================================
  // Movimentações de estoque (entrada NF + saídas) e prescrição integrada
  // ==========================================================================
  if (jaTemEntrada === 0) {
    const itensEntrada1 = [
      { principioAtivo: 'ibuprofeno', quantidade: 60, custoUnitario: '0.45' },
      { principioAtivo: 'ácido acetilsalicílico', quantidade: 120, custoUnitario: '0.12' },
    ] as const
    const itensEntrada2 = [
      { principioAtivo: 'varfarina', quantidade: 30, custoUnitario: '1.90' },
      { principioAtivo: 'digoxina', quantidade: 10, custoUnitario: '2.50' },
    ] as const

    const criarEntrada = async (nf: {
      numeroNota: string
      serie?: string
      fornecedorNome?: string
      fornecedorCnpj?: string
      recebidaEm: Date
      itens: readonly { principioAtivo: string; quantidade: number; custoUnitario: string }[]
    }) => {
      const entrada = await prisma.tbFarmaciaEntradaNf.create({
        data: {
          numeroNota: nf.numeroNota,
          serie: nf.serie ?? null,
          fornecedorNome: nf.fornecedorNome ?? null,
          fornecedorCnpj: nf.fornecedorCnpj ?? null,
          recebidaEm: nf.recebidaEm,
          observacoes: 'Seed demo — entrada de estoque',
          criadoPorId: null,
          itens: {
            create: nf.itens.map((it) => ({
              medicamentoId: idsPorPrincipio.get(it.principioAtivo)!,
              quantidade: it.quantidade,
              custoUnitario: it.custoUnitario as any,
              lote: `L-${Math.floor(Math.random() * 9000 + 1000)}`,
              validade: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            })),
          },
        },
        include: { itens: true },
      })

      // Atualizar saldo
      for (const it of entrada.itens) {
        await prisma.tbMedicamento.update({
          where: { id: it.medicamentoId },
          data: { saldoAtual: { increment: it.quantidade } },
        })
      }

      await prisma.tbAuditoriaLog.create({
        data: {
          usuarioId: null,
          role: null,
          atendimentoId: null,
          acao: 'CRIACAO',
          entidade: 'TbFarmaciaEntradaNf',
          entidadeId: entrada.id,
          detalhes: { seed: true, numeroNota: nf.numeroNota, totalQuantidade: nf.itens.reduce((a, x) => a + x.quantidade, 0) } as any,
        },
      })

      return entrada.id
    }

    await criarEntrada({
      numeroNota: '000123',
      serie: '1',
      fornecedorNome: 'Distribuidora Demo LTDA',
      fornecedorCnpj: '12.345.678/0001-00',
      recebidaEm: horasAtras(48),
      itens: itensEntrada1,
    })

    await criarEntrada({
      numeroNota: '000124',
      serie: '1',
      fornecedorNome: 'Farmacorp Demo SA',
      fornecedorCnpj: '98.765.432/0001-00',
      recebidaEm: horasAtras(12),
      itens: itensEntrada2,
    })

    console.log('✅ Farmácia: entradas NF (seed)')
  }

  if (jaTemSaida === 0) {
    const saida = await prisma.tbFarmaciaSaida.create({
      data: {
        tipo: 'BAIXA_MANUAL',
        observacoes: 'Seed demo — ajuste de perdas/avarias',
        criadoPorId: null,
        itens: {
          create: [
            {
              medicamentoId: idsPorPrincipio.get('ibuprofeno')!,
              quantidade: 5,
              motivo: 'Avaria',
            },
          ],
        },
      },
      include: { itens: true },
    })

    // Debitar saldo manual
    await prisma.tbMedicamento.update({
      where: { id: idsPorPrincipio.get('ibuprofeno')! },
      data: { saldoAtual: { decrement: 5 } },
    })

    await prisma.tbAuditoriaLog.create({
      data: {
        usuarioId: null,
        role: null,
        atendimentoId: null,
        acao: 'CRIACAO',
        entidade: 'TbFarmaciaSaida',
        entidadeId: saida.id,
        detalhes: { seed: true, tipo: 'BAIXA_MANUAL' } as any,
      },
    })

    console.log('✅ Farmácia: saída manual (seed)')
  }

  if (jaTemPrescricaoIntegrada === 0) {
    const atendimentos = await prisma.atendimento.findMany({
      where: { deletedAt: null },
      orderBy: [{ updatedAt: 'desc' }],
      take: 3,
    })

    // Usuário médico default do seed (se existir)
    const medico = await prisma.usuario.findUnique({ where: { email: 'medico@hospital.com' } })
    const farmaceutico = await prisma.usuario.findUnique({ where: { email: 'farmacia@hospital.com' } })

    for (const a of atendimentos) {
      const cab = await prisma.tbPrescricaoCabecalho.create({
        data: {
          atendimentoId: a.id,
          criadoPorId: medico?.id ?? farmaceutico?.id ?? (await prisma.usuario.findFirstOrThrow()).id,
          observacoes: 'Seed demo — prescrição integrada à farmácia',
          ativa: true,
          itens: {
            create: [
              {
                medicamentoId: idsPorPrincipio.get('ácido acetilsalicílico')!,
                medicamentoNome: 'AAS',
                principioAtivo: 'ácido acetilsalicílico',
                quantidadeSolicitada: 2,
                dose: '100mg',
                via: 'ORAL',
                frequencia: '1x ao dia',
                duracaoDias: 5,
                observacoes: 'Seed demo',
                alertasInteracao: { criticas: [] } as any,
              },
              {
                medicamentoId: idsPorPrincipio.get('varfarina')!,
                medicamentoNome: 'Varfarina',
                principioAtivo: 'varfarina',
                quantidadeSolicitada: 1,
                dose: '5mg',
                via: 'ORAL',
                frequencia: '1x ao dia',
                duracaoDias: 5,
                observacoes: 'Seed demo',
                alertasInteracao: {
                  criticas: [
                    {
                      risco: 'CRITICO',
                      principioAtivoNovo: 'varfarina',
                      principioAtivoExistente: 'ácido acetilsalicílico',
                      efeitoClinico: 'Risco aumentado de sangramento.',
                      sugestaoSistema: 'Evitar associação; se inevitável, monitorar INR e sangramentos.',
                    },
                  ],
                } as any,
              },
            ],
          },
        },
        include: { itens: true },
      })

      // Criar dispensação (triagem)
      for (const it of cab.itens) {
        await prisma.tbFarmaciaDispensacao.create({
          data: { itemId: it.id, status: 'AGUARDANDO_TRIAGEM' },
        })
      }

      // Aprovar o 1º item e rejeitar o 2º para variar visualização
      const disp1 = await prisma.tbFarmaciaDispensacao.update({
        where: { itemId: cab.itens[0].id },
        data: {
          status: 'APROVADO',
          validadoEm: horasAtras(1),
          validadoPorId: farmaceutico?.id ?? null,
          motivoRejeicao: null,
        },
      })

      // Registrar saída vinculada (log) — sem debitar estoque (débito ocorre na aprovação via trigger)
      await prisma.tbFarmaciaSaida.create({
        data: {
          tipo: 'DISPENSACAO_PRESCRICAO',
          atendimentoId: a.id,
          observacoes: 'Seed demo — saída vinculada à aprovação farmacêutica',
          criadoPorId: farmaceutico?.id ?? null,
          itens: {
            create: [
              {
                medicamentoId: cab.itens[0].medicamentoId!,
                quantidade: cab.itens[0].quantidadeSolicitada,
                dispensacaoId: disp1.id,
                prescricaoItemId: cab.itens[0].id,
              },
            ],
          },
        },
      })

      await prisma.tbFarmaciaDispensacao.update({
        where: { itemId: cab.itens[1].id },
        data: {
          status: 'REJEITADO',
          validadoEm: horasAtras(1),
          validadoPorId: farmaceutico?.id ?? null,
          motivoRejeicao: 'Seed demo — item com interação crítica precisa de revisão.',
        },
      })

      await prisma.tbAuditoriaLog.create({
        data: {
          usuarioId: farmaceutico?.id ?? null,
          role: farmaceutico?.role ?? null,
          atendimentoId: a.id,
          acao: 'CRIACAO',
          entidade: 'TbPrescricaoCabecalho',
          entidadeId: cab.id,
          detalhes: { seed: true, itens: cab.itens.length } as any,
        },
      })
    }

    console.log('✅ Farmácia: prescrição integrada + triagem + saída (seed)')
  }
}

async function seedConfiguracao() {
  await prisma.instituicao.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nomeMunicipio: 'Município Demo',
      nomeInstituicao: 'Hospital Municipal Central',
      endereco: 'Av. Principal, 1000',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01001000',
    },
  })

  const painel = await prisma.configPainel.findFirst()
  if (!painel) {
    await prisma.configPainel.create({ data: {} })
  }

  await prisma.configSmtp.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  })

  const origensIds: string[] = []
  for (const o of ORIGENS_DEMO) {
    const row = await prisma.origemPaciente.upsert({
      where: { descricao: o.descricao },
      update: { procedenciaFicha: o.procedenciaFicha, ativo: true },
      create: { ...o, ativo: true },
    })
    origensIds.push(row.id)
  }
  console.log(`✅ ${ORIGENS_DEMO.length} origens de paciente`)
  return origensIds
}

async function seedPacientes(): Promise<string[]> {
  const ids: string[] = []
  for (const p of PACIENTES_DEMO) {
    const cpfHash = hashCpf(p.cpf)
    const existente = await prisma.paciente.findUnique({ where: { cpfHash } })

    if (existente) {
      ids.push(existente.id)
      continue
    }

    const paciente = await prisma.paciente.create({
      data: {
        cpfCriptografado: criptografar(p.cpf),
        cpfHash,
        nomeCriptografado: criptografar(p.nomeCompleto),
        nomeExibicao: nomeExibicaoDe(p.nomeCompleto),
        dataNascimento: new Date(p.dataNascimento),
        sexoBiologico: p.sexoBiologico,
        tipoSanguineo: p.tipoSanguineo,
        convenio: p.convenio,
        nomeMae: p.nomeMae,
        profissao: p.profissao,
        telefoneCriptografado: criptografar(p.telefone),
        naturalidade: `${p.endereco.cidade}/${p.endereco.estado}`,
        endereco: {
          create: {
            cep: p.endereco.cep,
            logradouro: p.endereco.logradouro,
            numero: p.endereco.numero,
            bairro: p.endereco.bairro,
            cidade: p.endereco.cidade,
            estado: p.endereco.estado,
          },
        },
        alergias: {
          create: p.alergias.map((a) => ({
            descricao: a.descricao,
            gravidade: a.gravidade,
          })),
        },
        medicamentosCont: {
          create: p.medicamentos.map((m) => ({
            nome: m.nome,
            dose: m.dose,
            frequencia: m.frequencia,
          })),
        },
      },
    })
    ids.push(paciente.id)
  }
  console.log(`✅ ${PACIENTES_DEMO.length} pacientes`)
  return ids
}

async function seedAtendimentos(
  pacienteIds: string[],
  origemIds: string[],
  usuarios: Map<string, string>
) {
  const medicoId = usuarios.get('medico@hospital.com')!
  const enfermeiroId = usuarios.get('enfermeiro@hospital.com')!
  const recepcaoId = usuarios.get('recepcao@hospital.com')!

  let criados = 0
  for (const a of ATENDIMENTOS_DEMO) {
    const pacienteId = pacienteIds[a.pacienteIdx]
    const createdAt = horasAtras(a.horasAtras)
    const numeroAtendimento = gerarNumeroAtendimento(createdAt)

    const jaExiste = await prisma.atendimento.findUnique({ where: { numeroAtendimento } })
    if (jaExiste) continue

    const precisaMedico = ['EM_ATENDIMENTO', 'CONCLUIDO', 'ALTA', 'INTERNADO'].includes(a.status)
    const medicoAtend = precisaMedico ? medicoId : null

    const atendimento = await prisma.atendimento.create({
      data: {
        numeroAtendimento,
        pacienteId,
        medicoId: medicoAtend,
        status: a.status,
        setor: a.setor,
        sala: precisaMedico ? 'Consultório 01' : null,
        origemId: origemIds[a.origemIdx],
        createdAt,
        updatedAt: createdAt,
      },
    })

    if (a.triagem) {
      const t = a.triagem
      const classificadoEm = new Date(createdAt.getTime() + 15 * 60 * 1000)
      await prisma.triagem.create({
        data: {
          atendimentoId: atendimento.id,
          triadorId: enfermeiroId,
          corClassificacao: t.cor,
          queixaPrincipal: t.queixa,
          categoriaQueixa: t.categoria,
          classificadoEm,
          entradaTriagem: createdAt,
          doencasPreexistentes: 'HAS, DM (DEMO)',
          medicacoes: 'CONFORME FICHA',
          regraDor: `ESCALA DE DOR: ${t.dor}/10`,
          sinaisVitais: {
            create: {
              paSistolica: t.paSistolica,
              paDiastolica: t.paDiastolica,
              frequenciaCardiaca: t.fc,
              frequenciaResp: t.fr,
              spo2: t.spo2,
              temperatura: t.temp,
              escalaDor: t.dor,
              peso: 70,
              altura: 170,
              imc: 24.2,
            },
          },
        },
      })
    }

    if (a.prontuario) {
      const pr = a.prontuario
      const prontuario = await prisma.prontuarioMedico.create({
        data: {
          atendimentoId: atendimento.id,
          anamnese: {
            create: {
              queixaPrincipal: a.triagem?.queixa ?? 'QUEIXA DEMO',
              hda: 'História da doença atual — dados fictícios para demonstração do sistema.',
              antecedentesP: 'Sem antecedentes relevantes além dos registrados na triagem.',
              exameFisico: { geral: 'BEG, corado, hidratado, acianótico.' },
            },
          },
          diagnosticos: {
            create: {
              codigoCid: pr.cid,
              descricaoCid: pr.cidDesc,
              hipotese: pr.cidDesc,
              principal: true,
            },
          },
          prescricoes: {
            create: {
              numeroPrescricao: 1,
              observacoes: 'Prescrição demo',
              itens: {
                create: {
                  nomeMedicamento: pr.medicamento,
                  dose: '500MG',
                  via: 'ORAL',
                  frequencia: '8/8H',
                  duracaoDias: 5,
                  status: a.status === 'INTERNADO' ? 'PENDENTE' : 'APLICADO',
                },
              },
            },
          },
          requisicoes: {
            create: {
              categoria: 'LABORATORIO',
              urgencia: a.triagem?.cor === 'VERMELHO' ? 'EMERGENCIAL' : 'ROTINA',
              indicacao: 'Investigação clínica — seed demo',
              itens: {
                create: {
                  nomeExame: pr.exame,
                  observacoes: 'Solicitação gerada pelo seed',
                },
              },
            },
          },
          evolucoes: {
            create: {
              autorId: medicoId,
              conteudo: '<p>Paciente em acompanhamento. Evolução registrada automaticamente pelo seed de demonstração.</p>',
              template: 'SOAP',
            },
          },
        },
      })

      if (a.status === 'INTERNADO') {
        await prisma.encaminhamento.create({
          data: {
            prontuarioId: prontuario.id,
            tipo: 'INTERNACAO',
            especialidade: 'Clínica Médica',
            prioridade: 'Alta',
            resumoClinco: 'Internação para observação e suporte hemodinâmico.',
          },
        })
      }
    }

    if (['EM_ATENDIMENTO', 'AGUARDANDO_ATENDIMENTO'].includes(a.status) && a.triagem) {
      await prisma.chamadaPainel.create({
        data: {
          atendimentoId: atendimento.id,
          chamadoPorId: enfermeiroId,
          salaDestino: 'Consultório 02',
          setorPainel: 'GERAL',
          chamadoEm: horasAtras(Math.max(0, a.horasAtras - 0.5)),
        },
      })
    }

    await prisma.logAuditoria.create({
      data: {
        usuarioId: recepcaoId,
        acao: 'CRIACAO',
        entidade: 'Atendimento',
        entidadeId: atendimento.id,
        valorNovo: a.status,
        ipOrigem: '127.0.0.1',
      },
    })

    criados++
  }
  console.log(`✅ ${criados} atendimentos (triagens, prontuários e chamadas incluídos)`)
}

async function main() {
  console.log('🌱 Iniciando seed completo do SGH...\n')

  const usuarios = await seedUsuarios()
  const origemIds = await seedConfiguracao()
  const pacienteIds = await seedPacientes()
  await seedAtendimentos(pacienteIds, origemIds, usuarios)
  await seedFarmacia()
  await seedPrescricoesMedicasPadrao(prisma)

  console.log('\n✨ Seed concluído!')
  console.log('📊 Resumo:')
  console.log(`   • ${PACIENTES_DEMO.length} pacientes com endereço, alergias e medicamentos`)
  console.log(`   • ${ATENDIMENTOS_DEMO.length} atendimentos em todos os status`)
  console.log('   • Triagens Manchester, sinais vitais, prontuários, prescrições e exames')
  console.log('\n📧 Login: admin@hospital.com / Sgh@2024!')
  console.log('⚠️  Troque as senhas em produção!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
