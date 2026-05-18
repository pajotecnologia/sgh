// tests/unit/triagem.test.ts — Testes do Módulo 2: Triagem Manchester

import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  process.env.NEXTAUTH_SECRET = 'secret-de-teste';
});

// =============================================================================
// Validação do Schema de Triagem
// =============================================================================
describe('Schema de Triagem — Validação Zod', () => {
  it('deve aceitar triagem válida completa', async () => {
    const { schemaRegistrarTriagem } = await import('@/lib/validations/triagem');
    const dados = {
      atendimentoId: '550e8400-e29b-41d4-a716-446655440000',
      corClassificacao: 'VERMELHO',
      queixaPrincipal: 'Dor torácica intensa com irradiação para o braço esquerdo',
      categoriaQueixa: 'dor',
      sinaisVitais: {
        paSistolica: 160,
        paDiastolica: 100,
        frequenciaCardiaca: 110,
        spo2: 94,
        temperatura: 37.2,
        escalaDor: 9,
      },
    };
    expect(schemaRegistrarTriagem.safeParse(dados).success).toBe(true);
  });

  it('deve rejeitar escala de dor fora de 0-10', async () => {
    const { schemaRegistrarTriagem } = await import('@/lib/validations/triagem');
    const dados = {
      atendimentoId: '550e8400-e29b-41d4-a716-446655440000',
      corClassificacao: 'VERDE',
      queixaPrincipal: 'Dor leve',
      sinaisVitais: { escalaDor: 11 }, // inválido
    };
    const resultado = schemaRegistrarTriagem.safeParse(dados);
    expect(resultado.success).toBe(false);
  });

  it('deve rejeitar SpO2 abaixo de 50', async () => {
    const { schemaSinaisVitais } = await import('@/lib/validations/triagem');
    expect(schemaSinaisVitais.safeParse({ spo2: 30 }).success).toBe(false);
  });

  it('deve rejeitar temperatura fisiologicamente impossível', async () => {
    const { schemaSinaisVitais } = await import('@/lib/validations/triagem');
    expect(schemaSinaisVitais.safeParse({ temperatura: 55 }).success).toBe(false);
  });

  it('deve aceitar triagem sem sinais vitais (campos opcionais)', async () => {
    const { schemaRegistrarTriagem } = await import('@/lib/validations/triagem');
    const dados = {
      atendimentoId: '550e8400-e29b-41d4-a716-446655440000',
      corClassificacao: 'AZUL',
      queixaPrincipal: 'Queixa de dor de garganta há 2 dias',
      sinaisVitais: {},
    };
    expect(schemaRegistrarTriagem.safeParse(dados).success).toBe(true);
  });

  it('deve rejeitar queixa principal com menos de 5 caracteres', async () => {
    const { schemaRegistrarTriagem } = await import('@/lib/validations/triagem');
    const dados = {
      atendimentoId: '550e8400-e29b-41d4-a716-446655440000',
      corClassificacao: 'VERDE',
      queixaPrincipal: 'Dor', // muito curta
      sinaisVitais: {},
    };
    expect(schemaRegistrarTriagem.safeParse(dados).success).toBe(false);
  });
});

// =============================================================================
// Protocolo Manchester — Configuração e Tempos
// =============================================================================
describe('Protocolo Manchester — Configuração', () => {
  it('deve ter 6 cores definidas', async () => {
    const { PROTOCOLO_MANCHESTER } = await import('@/types');
    expect(PROTOCOLO_MANCHESTER).toHaveLength(6);
  });

  it('VERMELHO deve ter tempo 0 (imediato)', async () => {
    const { PROTOCOLO_MANCHESTER } = await import('@/types');
    const vermelho = PROTOCOLO_MANCHESTER.find((c) => c.cor === 'VERMELHO');
    expect(vermelho?.tempoMaximoMinutos).toBe(0);
  });

  it('CINZA deve ter tempo null (sem prazo)', async () => {
    const { PROTOCOLO_MANCHESTER } = await import('@/types');
    const cinza = PROTOCOLO_MANCHESTER.find((c) => c.cor === 'CINZA');
    expect(cinza?.tempoMaximoMinutos).toBeNull();
  });

  it('deve incluir hex de cor para cada classificação', async () => {
    const { PROTOCOLO_MANCHESTER } = await import('@/types');
    for (const config of PROTOCOLO_MANCHESTER) {
      expect(config.corHex).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});

// =============================================================================
// Cálculo de tempo de espera e alertas
// =============================================================================
describe('Alertas de Tempo Manchester', () => {
  it('deve detectar alerta para LARANJA após 10 minutos', async () => {
    const { alertaTempoManchester } = await import('@/lib/utils');
    expect(alertaTempoManchester('LARANJA', 10)).toBe(false); // exatamente no limite
    expect(alertaTempoManchester('LARANJA', 11)).toBe(true);  // passou
  });

  it('deve detectar alerta para AMARELO após 30 minutos', async () => {
    const { alertaTempoManchester } = await import('@/lib/utils');
    expect(alertaTempoManchester('AMARELO', 30)).toBe(false);
    expect(alertaTempoManchester('AMARELO', 31)).toBe(true);
  });

  it('deve detectar alerta para VERDE após 60 minutos', async () => {
    const { alertaTempoManchester } = await import('@/lib/utils');
    expect(alertaTempoManchester('VERDE', 60)).toBe(false);
    expect(alertaTempoManchester('VERDE', 61)).toBe(true);
  });

  it('deve detectar alerta para AZUL após 120 minutos', async () => {
    const { alertaTempoManchester } = await import('@/lib/utils');
    expect(alertaTempoManchester('AZUL', 120)).toBe(false);
    expect(alertaTempoManchester('AZUL', 121)).toBe(true);
  });
});

// =============================================================================
// Cálculo de IMC
// =============================================================================
describe('Cálculo de IMC', () => {
  it('deve classificar corretamente todos os intervalos', async () => {
    const { calcularImc } = await import('@/lib/utils');
    expect(calcularImc(50, 175).classificacao).toBe('Abaixo do peso');   // IMC 16.3
    expect(calcularImc(70, 175).classificacao).toBe('Peso normal');       // IMC 22.9
    expect(calcularImc(85, 175).classificacao).toBe('Sobrepeso');         // IMC 27.8
    expect(calcularImc(100, 175).classificacao).toBe('Obesidade grau I'); // IMC 32.7
    expect(calcularImc(120, 175).classificacao).toBe('Obesidade grau II');// IMC 39.2
    expect(calcularImc(140, 175).classificacao).toBe('Obesidade grau III');// IMC 45.7
  });
});
