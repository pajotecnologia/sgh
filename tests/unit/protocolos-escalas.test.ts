import { describe, it, expect } from 'vitest'
import {
  avaliarProtocoloSepse,
  avaliarProtocoloAvc,
  avaliarProtocoloDorToracica,
} from '@/lib/protocolos-clinicos'
import {
  calcularEscalaBraden,
  calcularEscalaMorse,
  gerarDadosPulseiraPaciente,
} from '@/lib/escalas-risco'

describe('Fase 2 — Protocolos Clínicos & Segurança do Paciente', () => {
  it('deve disparar Alerta de Sepse Crítico quando qSOFA >= 2', () => {
    const sinais = {
      frequenciaResp: 24, // >= 22 (1 pt)
      paSistolica: 90, // <= 100 (1 pt)
      escalaGlasgow: 15,
      temperatura: 38.5,
      frequenciaCardiaca: 110,
    }

    const alerta = avaliarProtocoloSepse(sinais, true)
    expect(alerta).not.toBeNull()
    expect(alerta?.protocolo).toBe('SEPSE')
    expect(alerta?.nivelAlerta).toBe('CRITICO')
    expect(alerta?.condutasImediatas[0]).toContain('Acionar médico assistente')
  })

  it('deve identificar Código AVC agudo dentro da janela trombolítica', () => {
    const alerta = avaliarProtocoloAvc({
      assimetriaFacial: true,
      quedaBraco: true,
      falaAnormal: false,
      inicioSintomasHoras: 2.0,
    })

    expect(alerta).not.toBeNull()
    expect(alerta?.protocolo).toBe('AVC')
    expect(alerta?.nivelAlerta).toBe('CRITICO')
    expect(alerta?.titulo).toContain('JANELA TROMBOLÍTICA')
  })

  it('deve identificar Dor Torácica típica e indicar tempo porta-ECG', () => {
    const alerta = avaliarProtocoloDorToracica({
      tipoDor: 'Dor precordial opressiva',
      irradiacao: ['BRACO_E', 'MANDIBULA'],
      sudoreseOuNausea: true,
    })

    expect(alerta).not.toBeNull()
    expect(alerta?.protocolo).toBe('DOR_TORACICA_IAM')
    expect(alerta?.condutasImediatas[0]).toContain('ECG de 12 derivações em até 10 minutos')
  })

  it('deve calcular corretamente a pontuação da Escala de Braden e Morse', () => {
    // Braden de Alto Risco (pontuação <= 12)
    const braden = calcularEscalaBraden({
      percepcaoSensorial: 2,
      umidade: 2,
      atividade: 1,
      mobilidade: 2,
      nutricao: 2,
      friccaoCisalhamento: 2,
    })
    expect(braden.pontos).toBe(11)
    expect(braden.risco).toBe('ALTO')
    expect(braden.recomendacoes).toHaveLength(3)

    // Morse de Alto Risco (pontuação >= 45)
    const morse = calcularEscalaMorse({
      historicoQuedas: true, // 25
      diagnosticoSecundario: true, // 15
      auxilioDeambulacao: 'MOBILIARIO', // 30
      terapiaEndovenosa: true, // 20
      marcha: 'COMPROMETIDA', // 20
      estadoMental: 'SUPERESTIMA_CAPACIDADE', // 15
    })
    expect(morse.pontos).toBe(125)
    expect(morse.risco).toBe('ALTO')
  })

  it('deve formatar dados da pulseira do paciente com QR Code e código de barras', () => {
    const pulseira = gerarDadosPulseiraPaciente({
      pacienteId: 'pac-999',
      atendimentoId: 'atend-888',
      numeroAtendimento: '20260923-0099',
      nomeCompleto: 'Ana Carolina Pereira',
      dataNascimento: new Date('1995-04-10'),
      sexo: 'FEMININO',
      tipoSanguineo: 'AB_POSITIVO',
      alergias: ['Dipirona', 'Penicilina'],
    })

    expect(pulseira.numeroAtendimento).toBe('20260923-0099')
    expect(pulseira.codigoBarrasValor).toBe('202609230099')
    expect(pulseira.qrCodeUrl).toContain('beira-leito/conferencia')
    expect(pulseira.alergias).toContain('Dipirona')
  })
})
