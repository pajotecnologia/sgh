// tests/unit/atendimento.test.ts
// Testes do Módulo 4: Atendimento Médico (Interações, Alergias, CID-10)

import { describe, it, expect } from 'vitest';

describe('Base CID-10 e Busca', () => {
  it('deve buscar CID por código exato', async () => {
    const { buscarCid10 } = await import('@/lib/cid10');
    const resultado = buscarCid10('J18.1');
    expect(resultado).toHaveLength(1);
    expect(resultado[0].codigo).toBe('J18.1');
  });

  it('deve buscar CID por descrição ignorando case', async () => {
    const { buscarCid10 } = await import('@/lib/cid10');
    const resultado = buscarCid10('INFARTO');
    // Deve achar infarto do miocárdio e cerebral
    expect(resultado.length).toBeGreaterThanOrEqual(2);
    expect(resultado.some(c => c.codigo === 'I21')).toBe(true);
  });

  it('deve retornar vazio se query tiver menos de 2 caracteres', async () => {
    const { buscarCid10 } = await import('@/lib/cid10');
    expect(buscarCid10('A')).toHaveLength(0);
    expect(buscarCid10('')).toHaveLength(0);
  });
});

describe('Verificação de Alergias', () => {
  it('deve detectar conflito exato', async () => {
    const { verificarAlergiaMedicamento } = await import('@/lib/interacoes-medicamentosas');
    const alergias = ['Dipirona', 'Penicilina'];
    const conflitos = verificarAlergiaMedicamento('Dipirona', alergias);
    expect(conflitos).toContain('Dipirona');
  });

  it('deve detectar conflito por substring (case-insensitive)', async () => {
    const { verificarAlergiaMedicamento } = await import('@/lib/interacoes-medicamentosas');
    const alergias = ['Amoxicilina']; // que é uma penicilina na prática, mas testando string match
    // Se a alergia for "Derivados de Penicilina" e a prescrição for "Penicilina G", deve bater.
    const alergias2 = ['Penicilina'];
    expect(verificarAlergiaMedicamento('Penicilina G Benzatina', alergias2)).toContain('Penicilina');
    expect(verificarAlergiaMedicamento('amoxicilina 500mg', alergias)).toContain('Amoxicilina');
  });

  it('não deve retornar conflitos se não houver match', async () => {
    const { verificarAlergiaMedicamento } = await import('@/lib/interacoes-medicamentosas');
    const alergias = ['Ibuprofeno'];
    expect(verificarAlergiaMedicamento('Paracetamol', alergias)).toHaveLength(0);
  });
});

describe('Interações Medicamentosas', () => {
  it('deve detectar interação Grave (Varfarina + AAS)', async () => {
    const { verificarInteracoes } = await import('@/lib/interacoes-medicamentosas');
    const { temInteracoes, interacoes } = verificarInteracoes(['Varfarina', 'AAS 100mg']);
    expect(temInteracoes).toBe(true);
    expect(interacoes[0].gravidade).toBe('Grave');
  });

  it('deve detectar interação Moderada (Lítio + Ibuprofeno)', async () => {
    const { verificarInteracoes } = await import('@/lib/interacoes-medicamentosas');
    const { temInteracoes, interacoes } = verificarInteracoes(['Lítio 300mg', 'Ibuprofeno 600mg']);
    expect(temInteracoes).toBe(true);
    expect(interacoes[0].gravidade).toBe('Moderada');
  });

  it('não deve detectar interações para medicamentos seguros entre si', async () => {
    const { verificarInteracoes } = await import('@/lib/interacoes-medicamentosas');
    const { temInteracoes } = verificarInteracoes(['Paracetamol', 'Dipirona']); // (na base simplificada)
    expect(temInteracoes).toBe(false);
  });

  it('deve lidar com 1 ou 0 medicamentos sem falhar', async () => {
    const { verificarInteracoes } = await import('@/lib/interacoes-medicamentosas');
    expect(verificarInteracoes(['Paracetamol']).temInteracoes).toBe(false);
    expect(verificarInteracoes([]).temInteracoes).toBe(false);
  });
});
