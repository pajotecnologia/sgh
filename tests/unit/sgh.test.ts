// tests/unit/encryption.test.ts — Testes da criptografia AES-256
import { describe, it, expect, beforeAll } from 'vitest';

// Configurar variáveis de ambiente antes dos testes
beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64); // Chave fictícia para testes
  process.env.NEXTAUTH_SECRET = 'secret-de-teste';
});

describe('Módulo de Criptografia (AES-256-GCM)', () => {
  it('deve criptografar e descriptografar corretamente', async () => {
    const { criptografar, descriptografar } = await import('@/lib/encryption');
    const original = '12345678900';
    const criptografado = criptografar(original);
    expect(criptografado).not.toBe(original);
    expect(descriptografar(criptografado)).toBe(original);
  });

  it('deve gerar IVs diferentes a cada chamada (não determinístico)', async () => {
    const { criptografar } = await import('@/lib/encryption');
    const v1 = criptografar('mesmo-valor');
    const v2 = criptografar('mesmo-valor');
    expect(v1).not.toBe(v2); // IVs aleatórios garantem isso
  });

  it('deve gerar hash consistente do mesmo CPF', async () => {
    const { hashCpf } = await import('@/lib/encryption');
    expect(hashCpf('123.456.789-00')).toBe(hashCpf('12345678900'));
  });

  it('deve mascarar CPF corretamente', async () => {
    const { mascararCpf } = await import('@/lib/encryption');
    expect(mascararCpf('12345678900')).toBe('***.456.789-**');
  });
});

// tests/unit/attendance.test.ts — Testes do número de atendimento
describe('Geração de Número de Atendimento', () => {
  it('deve gerar número no formato AAAAMMDD-XXXXXXXX', async () => {
    const { gerarNumeroAtendimento } = await import('@/lib/attendance');
    const numero = gerarNumeroAtendimento(new Date('2024-03-15'));
    expect(numero).toMatch(/^20240315-[A-Z0-9]{8}$/);
  });

  it('deve gerar números únicos em chamadas consecutivas', async () => {
    const { gerarNumeroAtendimento } = await import('@/lib/attendance');
    const numeros = Array.from({ length: 100 }, () => gerarNumeroAtendimento());
    const unicos = new Set(numeros);
    expect(unicos.size).toBe(100);
  });

  it('deve validar corretamente o formato do número', async () => {
    const { validarNumeroAtendimento } = await import('@/lib/attendance');
    expect(validarNumeroAtendimento('20240315-ABCDEF12')).toBe(true);
    expect(validarNumeroAtendimento('2024-03-15-ABC')).toBe(false);
    expect(validarNumeroAtendimento('')).toBe(false);
  });
});

// tests/unit/utils.test.ts — Testes dos utilitários
describe('Utilitários', () => {
  it('deve calcular IMC corretamente', async () => {
    const { calcularImc } = await import('@/lib/utils');
    const { imc, classificacao } = calcularImc(70, 175);
    expect(imc).toBeCloseTo(22.86, 1);
    expect(classificacao).toBe('Peso normal');
  });

  it('deve classificar obesidade corretamente', async () => {
    const { calcularImc } = await import('@/lib/utils');
    expect(calcularImc(110, 170).classificacao).toBe('Obesidade grau II');
  });

  it('deve detectar alerta Manchester para VERMELHO', async () => {
    const { alertaTempoManchester } = await import('@/lib/utils');
    expect(alertaTempoManchester('VERMELHO', 1)).toBe(true); // 1 min > 0
    expect(alertaTempoManchester('VERMELHO', 0)).toBe(false);
  });

  it('deve detectar alerta Manchester para LARANJA', async () => {
    const { alertaTempoManchester } = await import('@/lib/utils');
    expect(alertaTempoManchester('LARANJA', 11)).toBe(true);
    expect(alertaTempoManchester('LARANJA', 9)).toBe(false);
  });

  it('CINZA nunca deve disparar alerta', async () => {
    const { alertaTempoManchester } = await import('@/lib/utils');
    expect(alertaTempoManchester('CINZA', 9999)).toBe(false);
  });
});

// tests/unit/validacao-cpf.test.ts — Testes da validação de CPF
describe('Validação de CPF', () => {
  it('deve aceitar CPF válido', async () => {
    const { schemaBuscaCpf } = await import('@/lib/validations/paciente');
    expect(schemaBuscaCpf.safeParse({ cpf: '529.982.247-25' }).success).toBe(true);
  });

  it('deve rejeitar CPF com todos os dígitos iguais', async () => {
    const { schemaBuscaCpf } = await import('@/lib/validations/paciente');
    expect(schemaBuscaCpf.safeParse({ cpf: '111.111.111-11' }).success).toBe(false);
  });

  it('deve rejeitar CPF com dígitos verificadores inválidos', async () => {
    const { schemaBuscaCpf } = await import('@/lib/validations/paciente');
    expect(schemaBuscaCpf.safeParse({ cpf: '123.456.789-00' }).success).toBe(false);
  });

  it('deve rejeitar CPF vazio', async () => {
    const { schemaBuscaCpf } = await import('@/lib/validations/paciente');
    expect(schemaBuscaCpf.safeParse({ cpf: '' }).success).toBe(false);
  });
});
