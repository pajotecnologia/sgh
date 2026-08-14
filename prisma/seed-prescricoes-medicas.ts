import type { PrismaClient } from '@prisma/client'
import { MODELO_ALA_OBSTETRICA, MODELO_ENFERMARIA_GERAL } from '../lib/prescricao-modelo-hospitalar'

export const PRESCRICOES_MEDICAS_DEMO = [
  {
    nome: 'Prescrição Médica Ala Obstétrica - Enfermaria',
    descricao: 'Modelo padrão oficial para internação de obstetrícia e maternidade (Hospital Municipal).',
    observacoesPadrao: 'Observar sangramento vaginal e tónus uterino. Monitorar SSVV a cada 6 horas.',
    itens: MODELO_ALA_OBSTETRICA,
  },
  {
    nome: 'Prescrição Médica - Enfermaria Geral',
    descricao: 'Modelo padrão oficial para internação de enfermaria clínica e cirúrgica (Hospital Municipal).',
    observacoesPadrao: 'CCGG + SSVV de rotina.',
    itens: MODELO_ENFERMARIA_GERAL,
  },
]

export async function seedPrescricoesMedicasPadrao(prisma: PrismaClient) {
  let inseridas = 0

  for (const modelo of PRESCRICOES_MEDICAS_DEMO) {
    const existente = await prisma.prescricaoMedicaPadrao.findFirst({
      where: { nome: modelo.nome },
    })

    if (existente) {
      console.log(`⏭️  Prescrição padrão já existe: ${modelo.nome}`)
      continue
    }

    await prisma.prescricaoMedicaPadrao.create({
      data: {
        nome: modelo.nome,
        descricao: modelo.descricao,
        observacoesPadrao: modelo.observacoesPadrao ?? null,
        ativo: true,
        itens: {
          create: modelo.itens.map((item, ordem) => ({
            ordem,
            tipoItem: 'LINHA_DUPLA',
            nomeMedicamento: item.nomeMedicamento,
            principioAtivo: null,
            dose: 'LINHA_DUPLA',
            unidadeMedida: null,
            via: 'ORAL',
            frequencia: 'Conforme prescrição',
            quantidadeSolicitada: 1,
            duracaoDias: null,
            observacoes: item.observacoes || null,
          })),
        },
      },
    })

    inseridas++
    console.log(`✅ Prescrição padrão inserida: ${modelo.nome} (${modelo.itens.length} itens)`)
  }

  return inseridas
}
