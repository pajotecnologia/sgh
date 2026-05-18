import { describe, it, expect } from 'vitest';
import {
  schemaAplicacaoMedicamento,
  schemaChecklistCincoCertos,
  schemaAtualizarItemExame,
} from '@/lib/validations/atendimento';

describe('Sessão 4 — aplicação de medicamento', () => {
  it('exige os 5 certos como true', () => {
    const r = schemaChecklistCincoCertos.safeParse({
      pacienteCerto: true,
      medicamentoCerto: true,
      doseCerta: true,
      viaCerta: true,
      horarioCerto: true,
    });
    expect(r.success).toBe(true);
  });

  it('rejeita checklist incompleto', () => {
    const r = schemaChecklistCincoCertos.safeParse({
      pacienteCerto: true,
      medicamentoCerto: true,
      doseCerta: false,
      viaCerta: true,
      horarioCerto: true,
    });
    expect(r.success).toBe(false);
  });

  it('aceita atualização de item de exame com resultado', () => {
    const r = schemaAtualizarItemExame.safeParse({
      resultado: 'Hemoglobina 14 g/dL',
      realizadoEm: '',
    });
    expect(r.success).toBe(true);
  });

  it('aceita payload completo de aplicação', () => {
    const r = schemaAplicacaoMedicamento.safeParse({
      itemPrescricaoId: '123e4567-e89b-12d3-a456-426614174000',
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
});
