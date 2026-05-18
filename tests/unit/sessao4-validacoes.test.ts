import { describe, it, expect } from 'vitest';
import { schemaAplicacaoMedicamento, schemaChecklistCincoCertos, schemaCriarRequisicaoExame } from '@/lib/validations/atendimento';

describe('Sessão 4 — validações', () => {
  it('checklist 5 certos exige todos true', () => {
    expect(schemaChecklistCincoCertos.safeParse({}).success).toBe(false);
    expect(
      schemaChecklistCincoCertos.safeParse({
        pacienteCerto: true,
        medicamentoCerto: true,
        doseCerta: true,
        viaCerta: true,
        horarioCerto: true,
      }).success
    ).toBe(true);
  });

  it('aplicação com checklist válido', () => {
    const r = schemaAplicacaoMedicamento.safeParse({
      itemPrescricaoId: '550e8400-e29b-41d4-a716-446655440000',
      doseAplicada: '500mg',
      via: 'ORAL',
      checklistConfirmado: {
        pacienteCerto: true,
        medicamentoCerto: true,
        doseCerta: true,
        viaCerta: true,
        horarioCerto: true,
      },
    });
    expect(r.success).toBe(true);
  });

  it('requisição de exame exige indicacao e itens', () => {
    expect(
      schemaCriarRequisicaoExame.safeParse({
        prontuarioId: '550e8400-e29b-41d4-a716-446655440001',
        categoria: 'LABORATORIO',
        urgencia: 'ROTINA',
        indicacao: 'avaliar',
        itens: [{ nomeExame: 'Hemograma' }],
      }).success
    ).toBe(true);
  });
});
