import { describe, it, expect, vi } from 'vitest'
import { obterPendenciasUsuario } from '@/lib/central-tarefas'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    atendimento: {
      findMany: vi.fn(),
    },
    itemPrescricao: {
      findMany: vi.fn(),
    },
    tbPrescricaoCabecalho: {
      findMany: vi.fn(),
    },
    itemRequisicao: {
      findMany: vi.fn(),
    },
  },
}))

describe('Central de Tarefas & Pendências Clínicas', () => {
  it('deve priorizar e agrupar pendências conforme o perfil do médico', async () => {
    vi.mocked(prisma.atendimento.findMany)
      // 1ª chamada: aguardandoTriagem
      .mockResolvedValueOnce([])
      // 2ª chamada: aguardandoMedico
      .mockResolvedValueOnce([
        {
          id: 'atend-1',
          createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 min
          paciente: { id: 'pac-1', nomeExibicao: 'João Silva' },
          triagem: { corClassificacao: 'VERMELHO', queixaPrincipal: 'Dor precordial' },
        },
        {
          id: 'atend-2',
          createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 min
          paciente: { id: 'pac-2', nomeExibicao: 'Maria Souza' },
          triagem: { corClassificacao: 'VERDE', queixaPrincipal: 'Coriza' },
        },
      ] as any)
      // 4ª chamada: admissoesPendentes
      .mockResolvedValueOnce([])

    vi.mocked(prisma.itemPrescricao.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.tbPrescricaoCabecalho.findMany).mockResolvedValueOnce([])
    vi.mocked(prisma.itemRequisicao.findMany).mockResolvedValueOnce([
      {
        id: 'exame-1',
        nomeExame: 'Hemograma completo',
        resultado: 'Hb: 14.2 g/dL',
        requisicao: {
          prontuario: {
            atendimento: {
              id: 'atend-3',
              paciente: { id: 'pac-3', nomeExibicao: 'Pedro Lima' },
            },
          },
        },
      },
    ] as any)

    const resultado = await obterPendenciasUsuario('med-1', 'MEDICO')

    expect(resultado.role).toBe('MEDICO')
    expect(resultado.totalPendencias).toBe(3) // 2 aguardando médico + 1 exame
    expect(resultado.criticas).toBe(1) // O paciente VERMELHO é classificado como CRITICA

    // O primeiro item deve ser a emergência crítica (João Silva)
    expect(resultado.itens[0].titulo).toBe('João Silva')
    expect(resultado.itens[0].prioridade).toBe('CRITICA')
    expect(resultado.itens[0].corTriagem).toBe('VERMELHO')
  })
})
