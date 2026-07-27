import type { PrismaClient } from '@prisma/client'

type ItemDemo = {
  nomeMedicamento: string
  principioAtivo?: string
  dose: string
  unidadeMedida: string
  via: string
  frequencia: string
  quantidadeSolicitada?: number
  duracaoDias?: number
  observacoes?: string
}

type PrescricaoDemo = {
  nome: string
  descricao: string
  observacoesPadrao?: string
  itens: ItemDemo[]
}

export const PRESCRICOES_MEDICAS_DEMO: PrescricaoDemo[] = [
  {
    nome: 'Analgesia padrão — internação',
    descricao: 'Controle álgico de rotina em enfermaria clínica.',
    observacoesPadrao: 'Avaliar escala de dor antes de cada dose. Suspender se PA < 90/60.',
    itens: [
      {
        nomeMedicamento: 'Dipirona',
        principioAtivo: 'dipirona',
        dose: '500',
        unidadeMedida: 'mg',
        via: 'ORAL',
        frequencia: '6/6h',
        duracaoDias: 5,
        observacoes: 'Preferir VO se tolerado',
      },
      {
        nomeMedicamento: 'Paracetamol',
        principioAtivo: 'paracetamol',
        dose: '750',
        unidadeMedida: 'mg',
        via: 'ORAL',
        frequencia: '8/8h se dor',
        duracaoDias: 5,
        observacoes: 'Resgate analgésico — máx. 3 g/dia',
      },
    ],
  },
  {
    nome: 'Antibioticoterapia — ITU não complicada',
    descricao: 'Esquema empírico para infecção urinária baixa em adulto.',
    observacoesPadrao: 'Manter hidratação oral. Coletar urocultura se possível antes do ATB.',
    itens: [
      {
        nomeMedicamento: 'Amoxicilina',
        principioAtivo: 'amoxicilina',
        dose: '500',
        unidadeMedida: 'mg',
        via: 'ORAL',
        frequencia: '8/8h',
        duracaoDias: 7,
      },
      {
        nomeMedicamento: 'Omeprazol',
        principioAtivo: 'omeprazol',
        dose: '20',
        unidadeMedida: 'mg',
        via: 'ORAL',
        frequencia: '24/24h',
        duracaoDias: 7,
        observacoes: 'Proteção gástrica durante ATB',
      },
    ],
  },
  {
    nome: 'Hidratação venosa + antitérmico',
    descricao: 'Reposição volêmica com controle sintomático de febre.',
    observacoesPadrao: 'Monitorar balanço hídrico e diurese. Ajustar velocidade conforme cardiopatia.',
    itens: [
      {
        nomeMedicamento: 'Soro fisiológico 0,9%',
        dose: '500',
        unidadeMedida: 'mL',
        via: 'INTRAVENOSA',
        frequencia: '8/8h',
        duracaoDias: 3,
        observacoes: 'Correr em 2 h — via exclusiva se possível',
      },
      {
        nomeMedicamento: 'Dipirona',
        principioAtivo: 'dipirona',
        dose: '1',
        unidadeMedida: 'g',
        via: 'INTRAVENOSA',
        frequencia: '6/6h se febre ou dor',
        duracaoDias: 3,
        observacoes: 'Administrar lentamente (≥ 15 min)',
      },
      {
        nomeMedicamento: 'Losartana',
        principioAtivo: 'losartana',
        dose: '50',
        unidadeMedida: 'mg',
        via: 'ORAL',
        frequencia: '24/24h',
        observacoes: 'Manter medicação de uso contínuo do paciente',
      },
    ],
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
            nomeMedicamento: item.nomeMedicamento,
            principioAtivo: item.principioAtivo ?? null,
            dose: item.dose,
            unidadeMedida: item.unidadeMedida,
            via: item.via,
            frequencia: item.frequencia,
            quantidadeSolicitada: item.quantidadeSolicitada ?? 1,
            duracaoDias: item.duracaoDias ?? null,
            observacoes: item.observacoes ?? null,
          })),
        },
      },
    })

    inseridas++
    console.log(`✅ Prescrição padrão: ${modelo.nome} (${modelo.itens.length} itens)`)
  }

  return inseridas
}
