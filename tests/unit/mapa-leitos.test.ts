import { describe, it, expect, vi } from 'vitest'
import { obterDadosMapaLeitos } from '@/lib/mapa-leitos'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    leito: {
      findMany: vi.fn(),
    },
    clinica: {
      findMany: vi.fn(),
    },
  },
}))

describe('Mapa Visual de Leitos — Cálculos e Agrupamentos', () => {
  it('deve calcular corretamente a taxa de ocupação e métricas por tipo', async () => {
    const mockClinicas = [
      { id: 'clinica-1', nome: 'Clínica Médica', ativo: true },
      { id: 'clinica-2', nome: 'UTI Adulto', ativo: true },
    ]

    const mockLeitos = [
      {
        id: 'leito-1',
        codigo: '101-A',
        ala: 'Ala Norte',
        quarto: '101',
        tipo: 'ENFERMARIA',
        status: 'OCUPADO',
        ativo: true,
        observacoes: null,
        clinicaId: 'clinica-1',
        clinicaRef: { id: 'clinica-1', nome: 'Clínica Médica' },
        atendimentos: [
          {
            id: 'atend-1',
            numeroAtendimento: '20260923-0001',
            createdAt: new Date(Date.now() - 3600 * 1000 * 5), // 5h atrás
            paciente: {
              id: 'pac-1',
              nomeExibicao: 'Carlos Silva',
              dataNascimento: new Date('1985-05-12'),
              sexoBiologico: 'MASCULINO',
              tipoSanguineo: 'O_POSITIVO',
            },
            medico: { id: 'med-1', nome: 'Dr. Roberto', crm: '12345/SP' },
            triagem: { corClassificacao: 'AMARELO', queixaPrincipal: 'Cefaleia intensa' },
            prontuario: {
              diagnosticos: [{ codigoCid: 'G43', descricaoCid: 'Enxaqueca' }],
            },
          },
        ],
      },
      {
        id: 'leito-2',
        codigo: '101-B',
        ala: 'Ala Norte',
        quarto: '101',
        tipo: 'ENFERMARIA',
        status: 'DISPONIVEL',
        ativo: true,
        observacoes: null,
        clinicaId: 'clinica-1',
        clinicaRef: { id: 'clinica-1', nome: 'Clínica Médica' },
        atendimentos: [],
      },
      {
        id: 'leito-3',
        codigo: 'UTI-01',
        ala: 'UTI Geral',
        quarto: '01',
        tipo: 'UTI',
        status: 'OCUPADO',
        ativo: true,
        observacoes: null,
        clinicaId: 'clinica-2',
        clinicaRef: { id: 'clinica-2', nome: 'UTI Adulto' },
        atendimentos: [
          {
            id: 'atend-2',
            numeroAtendimento: '20260923-0002',
            createdAt: new Date(Date.now() - 3600 * 1000 * 30), // 30h atrás
            paciente: {
              id: 'pac-2',
              nomeExibicao: 'Maria Santos',
              dataNascimento: new Date('1970-01-20'),
              sexoBiologico: 'FEMININO',
              tipoSanguineo: 'A_POSITIVO',
            },
            medico: { id: 'med-2', nome: 'Dra. Beatriz', crm: '54321/SP' },
            triagem: { corClassificacao: 'VERMELHO', queixaPrincipal: 'Insuficiência respiratória' },
            prontuario: {
              diagnosticos: [{ codigoCid: 'J96', descricaoCid: 'Insuficiência respiratória' }],
            },
          },
        ],
      },
      {
        id: 'leito-4',
        codigo: 'UTI-02',
        ala: 'UTI Geral',
        quarto: '02',
        tipo: 'UTI',
        status: 'INTERDITADO',
        ativo: true,
        observacoes: 'Manutenção de respirador',
        clinicaId: 'clinica-2',
        clinicaRef: { id: 'clinica-2', nome: 'UTI Adulto' },
        atendimentos: [],
      },
    ]

    vi.mocked(prisma.clinica.findMany).mockResolvedValue(mockClinicas as any)
    vi.mocked(prisma.leito.findMany).mockResolvedValue(mockLeitos as any)

    const resultado = await obterDadosMapaLeitos()

    expect(resultado.metricas.totalLeitos).toBe(4)
    expect(resultado.metricas.leitosLivres).toBe(1)
    expect(resultado.metricas.leitosOcupados).toBe(2)
    expect(resultado.metricas.leitosInterditados).toBe(1)
    expect(resultado.metricas.taxaOcupacao).toBe(50) // 2 ocupados / 4 ativos = 50%

    // Verificação por tipo
    expect(resultado.metricas.distribuicaoTipo.ENFERMARIA.total).toBe(2)
    expect(resultado.metricas.distribuicaoTipo.ENFERMARIA.ocupados).toBe(1)
    expect(resultado.metricas.distribuicaoTipo.ENFERMARIA.livres).toBe(1)

    expect(resultado.metricas.distribuicaoTipo.UTI.total).toBe(2)
    expect(resultado.metricas.distribuicaoTipo.UTI.ocupados).toBe(1)
    expect(resultado.metricas.distribuicaoTipo.UTI.livres).toBe(0)

    // Verificação do paciente enriquecido
    const clinicaMedica = resultado.clinicas.find((c) => c.id === 'clinica-1')
    expect(clinicaMedica).toBeDefined()
    expect(clinicaMedica?.alas[0].leitos[0].pacienteAtual?.nome).toBe('Carlos Silva')
    expect(clinicaMedica?.alas[0].leitos[0].pacienteAtual?.corTriagem).toBe('AMARELO')
    expect(clinicaMedica?.alas[0].leitos[0].pacienteAtual?.tempoInternacaoFormatado).toContain('5h')
  })
})
