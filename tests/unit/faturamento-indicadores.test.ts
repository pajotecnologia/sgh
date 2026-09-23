import { describe, it, expect } from 'vitest'
import {
  gerarXmlTissGuiaInternacao,
  type GuiaTissInternacao,
} from '@/lib/faturamento-hospitalar'
import { calcularIndicadoresAcreditacao } from '@/lib/indicadores-acreditacao'

describe('Fase 4 — Faturamento Hospitalar (TISS/TUSS) & Indicadores ONA', () => {
  it('deve gerar XML no padrão ANS TISS com nós obrigatórios e itens TUSS', () => {
    const mockGuia: GuiaTissInternacao = {
      numeroGuiaPrestador: 'LOTE-2026-001',
      registroAns: '123456',
      numeroCarteiraBeneficiario: '987654321000',
      nomeBeneficiario: 'Juliana Mendes',
      dataAutorizacao: '2026-09-23T10:00:00Z',
      tipoInternacao: 'CIRURGICA',
      caraterAtendimento: 'URGENCIA_EMERGENCIA',
      regimeInternacao: 'HOSPITALAR',
      cidPrincipal: 'K35.8',
      dataHoraInternacao: '2026-09-23T08:00:00Z',
      itens: [
        {
          codigoTuss: '31001017',
          descricao: 'Apendicectomia',
          quantidade: 1,
          valorUnitario: 1850.0,
          valorTotal: 1850.0,
        },
        {
          codigoTuss: '60000775',
          descricao: 'Taxa de sala cirúrgica / hora',
          quantidade: 2,
          valorUnitario: 320.0,
          valorTotal: 640.0,
        },
      ],
      valorTotalGeral: 2490.0,
    }

    const xml = gerarXmlTissGuiaInternacao(mockGuia)
    expect(xml).toContain('<ans:mensagemTISS')
    expect(xml).toContain('<ans:codigoProcedimento>31001017</ans:codigoProcedimento>')
    expect(xml).toContain('<ans:valorTotalGuia>2490.00</ans:valorTotalGuia>')
    expect(xml).toContain('<ans:diagnosticoPrincipal>K35.8</ans:diagnosticoPrincipal>')
  })

  it('deve calcular métricas de Acreditação Hospitalar (Média de Permanência, Ocupação, Densidade IRAS)', () => {
    const metricas = calcularIndicadoresAcreditacao({
      leitosOperacionais: 50,
      diasPeriodo: 30, // Capacidade = 1.500 leitos-dia
      pacientesDia: 1200, // 1200 / 1500 = 80% ocupação
      altas: 230,
      obitos: 10, // Total Saídas = 240
      infeccoesIras: 6, // Densidade = (6 / 1200) * 1000 = 5.0 por mil
      readmissoes30d: 8,
      checagensHigieneMaosRealizadas: 100,
      checagensHigieneMaosConformes: 92,
    })

    expect(metricas.taxaOcupacaoPercentual).toBe(80)
    expect(metricas.mediaPermanenciaDias).toBe(5) // 1200 / 240 = 5.0 dias
    expect(metricas.densidadeInfeccaoPorMilPacientesDia).toBe(5)
    expect(metricas.taxaMortalidadeInstitucionalPercentual).toBe(4.2) // (10 / 240) * 100 = 4.16% -> 4.2%
    expect(metricas.taxaConformidadeHigieneMaosPercentual).toBe(92)
  })
})
