import { describe, it, expect } from 'vitest';
import { exportarAtendimentosCsv, type RelatorioAtendimentosDTO } from '@/lib/relatorios-gerenciais';

describe('Relatórios Gerenciais', () => {
  it('deve gerar CSV sanitizado com cabeçalho e linhas corretas', () => {
    const mockDados: RelatorioAtendimentosDTO = {
      total: 2,
      porStatus: { FINALIZADO: 2 },
      porPrioridade: { VERDE: 2 },
      porSetor: { 'Pronto-Socorro': 2 },
      tempoMedioEsperaMinutos: 15,
      atendimentosRecentes: [
        {
          id: '1',
          numeroAtendimento: '20260923-0001',
          pacienteNome: 'João "Silva" Santos',
          dataHora: '2026-09-23T10:00:00.000Z',
          status: 'FINALIZADO',
          prioridade: 'VERDE',
          setor: 'Pronto-Socorro',
          medicoNome: 'Dra. Maria',
        },
        {
          id: '2',
          numeroAtendimento: '20260923-0002',
          pacienteNome: 'Ana Souza',
          dataHora: '2026-09-23T11:00:00.000Z',
          status: 'FINALIZADO',
          prioridade: 'AMARELO',
          setor: 'Ambulatório',
          medicoNome: 'Dr. Carlos',
        },
      ],
    };

    const csv = exportarAtendimentosCsv(mockDados);
    expect(csv).toContain('NumeroAtendimento;DataHora;Paciente;Status;Prioridade;Setor;Medico');
    expect(csv).toContain('"20260923-0001"');
    expect(csv).toContain('"João ""Silva"" Santos"');
    expect(csv).toContain('"20260923-0002"');
  });
});
