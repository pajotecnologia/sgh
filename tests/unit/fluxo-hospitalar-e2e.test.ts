import { describe, it, expect } from 'vitest';
import { schemaRegistrarTriagem } from '@/lib/validations/triagem';
import { schemaItemPrescricao, schemaAplicacaoMedicamento, schemaEncaminhamento } from '@/lib/validations/atendimento';
import { exportarAtendimentosCsv } from '@/lib/relatorios-gerenciais';
import manifest from '@/app/manifest';

describe('Suíte de Integração — Fluxo Hospitalar Completo & Conformidade SGH', () => {
  it('1. Deve validar e classificar corretamente a Triagem Manchester', () => {
    const dadosTriagem = {
      atendimentoId: '00000000-0000-0000-0000-000000000001',
      queixaPrincipal: 'Dor torácica intensa com irradiação para braço esquerdo',
      discriminador: 'Dor precordial típica',
      corClassificacao: 'VERMELHO' as const,
      sinaisVitais: {
        paSistolica: 150,
        paDiastolica: 95,
        frequenciaCardiaca: 115,
        temperatura: 36.8,
        spo2: 94,
        glicemia: 110,
        escalaDor: 9,
      },
    };

    const parsed = schemaRegistrarTriagem.safeParse(dadosTriagem);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.corClassificacao).toBe('VERMELHO');
      expect(parsed.data.sinaisVitais.frequenciaCardiaca).toBe(115);
    }
  });

  it('2. Deve validar item de prescrição médica e regras de dosagem', () => {
    const itemPrescricao = {
      nomeMedicamento: 'Morfina 10mg/mL',
      dose: '2 mg',
      via: 'INTRAVENOSA' as const,
      frequencia: 'Se dor intensa (ACM)',
      duracaoDias: 1,
      quantidadeSolicitada: 1,
    };

    const parsed = schemaItemPrescricao.safeParse(itemPrescricao);
    expect(parsed.success).toBe(true);
  });

  it('3. Deve exigir e validar os 5 certos na aplicação de enfermagem', () => {
    const aplicacao = {
      itemPrescricaoId: '11111111-1111-1111-1111-111111111111',
      doseAplicada: '2 mg',
      via: 'INTRAVENOSA',
      checklistConfirmado: {
        pacienteCerto: true,
        medicamentoCerto: true,
        doseCerta: true,
        viaCerta: true,
        horarioCerto: true,
      },
      observacoes: 'Paciente monitorizado com alívio da dor após 15 min.',
    };

    const parsed = schemaAplicacaoMedicamento.safeParse(aplicacao);
    expect(parsed.success).toBe(true);
  });

  it('4. Deve validar encaminhamento com suporte a resumoClinico', () => {
    const encaminhamento = {
      prontuarioId: '22222222-2222-2222-2222-222222222222',
      tipo: 'INTERNACAO' as const,
      especialidade: 'UTI Coronariana',
      prioridade: 'Alta' as const,
      resumoClinico: 'Síndrome Coronariana Aguda com supra de ST.',
      cidInternacao: 'I21.9',
    };

    const parsed = schemaEncaminhamento.safeParse(encaminhamento);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.resumoClinico).toBe('Síndrome Coronariana Aguda com supra de ST.');
    }
  });

  it('5. Deve validar integridade do PWA e relatórios de exportação', () => {
    const pwa = manifest();
    expect(pwa.icons?.length).toBeGreaterThanOrEqual(3);

    const csv = exportarAtendimentosCsv({
      total: 1,
      porStatus: { FINALIZADO: 1 },
      porPrioridade: { VERMELHO: 1 },
      porSetor: { Emergência: 1 },
      tempoMedioEsperaMinutos: 4,
      atendimentosRecentes: [
        {
          id: '1',
          numeroAtendimento: '20260923-9999',
          pacienteNome: 'Paciente Exemplo',
          dataHora: '2026-09-23T12:00:00.000Z',
          status: 'FINALIZADO',
          prioridade: 'VERMELHO',
          setor: 'Emergência',
          medicoNome: 'Dr. Teste',
        },
      ],
    });

    expect(csv).toContain('20260923-9999');
    expect(csv).toContain('Paciente Exemplo');
  });
});
