import { describe, it, expect } from 'vitest'
import { calcularTempoEmRegulacao } from '@/lib/nir-regulacao'
import { validarCompletudeChecklistOms, type ChecklistCirurgiaSeguraOms } from '@/lib/bloco-cirurgico'
import { validarNumeroDeclaracaoObito } from '@/lib/protocolo-obito'

describe('Fase 3 — Operação Hospitalar Avançada (NIR, Cirurgia OMS, Óbito)', () => {
  it('deve calcular o tempo em regulação e identificar tempo crítico > 24h', () => {
    const data30hAtras = new Date(Date.now() - 3600 * 1000 * 30)
    const res = calcularTempoEmRegulacao(data30hAtras)

    expect(res.horas).toBeGreaterThanOrEqual(30)
    expect(res.formatado).toContain('1d')
    expect(res.tempoCritico).toBe(true)
  })

  it('deve validar o Checklist de Cirurgia Segura da OMS e detectar itens faltantes', () => {
    const checklistIncompleto: ChecklistCirurgiaSeguraOms = {
      cirurgiaId: 'cir-001',
      atendimentoId: 'atend-001',
      pacienteNome: 'Sebastião Silva',
      procedimento: 'Apendicectomia Videolaparoscópica',
      salaCirurgica: 'Sala 03',
      signIn: {
        identificacaoConfirmada: true,
        sitioCirurgicoDemarcado: true,
        termoConsentimentoAssinado: false, // Faltando!
        oximetroPulsoInstaladoEFuncionando: true,
        alergiasConhecidasVerificadas: true,
        riscoViaAereaDificilAvaliado: true,
        riscoPerdaSanguineaAvaliado: true,
        responsavelNome: 'Enf. Carla',
      },
      timeOut: {
        apresentacaoEquipeNomeFuncao: true,
        confirmacaoVerbalPacienteProcedimentoSitio: true,
        antibioticoprofilaxiaUltimos60Min: false, // Faltando!
        cirurgiaoReviuEventosCriticosETempoEstimado: true,
        anestesistaReviuPreocupacoesEspecificas: true,
        enfermagemReviuEsterilizacaoEInstrumental: true,
        imagensEssenciaisExibidas: true,
        responsavelNome: 'Dr. Roberto',
      },
      signOut: {
        nomeProcedimentoRegistrado: true,
        contagemCompressasAgulhasInstrumentaisCorreta: true,
        amostrasBiopsiaIdentificadasERotuladas: true,
        problemasEquipamentosRegistrados: false,
        revisaoPreocupacoesPosOperatoriasSRPA: true,
        responsavelNome: 'Enf. Carla',
      },
    }

    const validacao = validarCompletudeChecklistOms(checklistIncompleto)
    expect(validacao.completo).toBe(false)
    expect(validacao.itensFaltantes).toHaveLength(2)
    expect(validacao.itensFaltantes[0]).toContain('Termo de consentimento cirúrgico')
    expect(validacao.itensFaltantes[1]).toContain('Profilaxia antibiótica')
  })

  it('deve validar o formato da Declaração de Óbito (DO)', () => {
    expect(validarNumeroDeclaracaoObito('12345678-9')).toBe(true)
    expect(validarNumeroDeclaracaoObito('1234567890')).toBe(true)
    expect(validarNumeroDeclaracaoObito('123')).toBe(false)
  })
})
