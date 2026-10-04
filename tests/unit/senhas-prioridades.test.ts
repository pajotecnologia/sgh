import { describe, it, expect } from 'vitest';
import {
  TIPOS_ATENDIMENTO,
  calcularIdadeEmAnos,
  sugerirTipoAtendimento,
  gerarCodigoSenha,
  resolverSenhaETipo,
  calcularPontuacaoPrioridade,
  ordenarFilaHospitalar,
} from '@/lib/senhas';

describe('Módulo de Senhas e Prioridades Hospitalares (SGH)', () => {
  describe('Cálculo de Idade e Sugestão de Tipo', () => {
    it('deve calcular corretamente a idade em anos', () => {
      const hoje = new Date();
      const nascimento82Anos = new Date(hoje.getFullYear() - 82, hoje.getMonth(), hoje.getDate() - 1);
      const nascimento65Anos = new Date(hoje.getFullYear() - 65, hoje.getMonth(), hoje.getDate() - 1);
      const nascimento8Anos = new Date(hoje.getFullYear() - 8, hoje.getMonth(), hoje.getDate() - 1);
      const nascimento30Anos = new Date(hoje.getFullYear() - 30, hoje.getMonth(), hoje.getDate() - 1);

      expect(calcularIdadeEmAnos(nascimento82Anos)).toBe(82);
      expect(calcularIdadeEmAnos(nascimento65Anos)).toBe(65);
      expect(calcularIdadeEmAnos(nascimento8Anos)).toBe(8);
      expect(calcularIdadeEmAnos(nascimento30Anos)).toBe(30);
      expect(calcularIdadeEmAnos(null)).toBeNull();
    });

    it('deve sugerir Superprioridade 80+ (S8) para idosos com 80 anos ou mais', () => {
      const hoje = new Date();
      const nasc85 = new Date(hoje.getFullYear() - 85, 0, 1);
      expect(sugerirTipoAtendimento(nasc85)).toBe('S8');
    });

    it('deve sugerir Prioritário (SP) para idosos entre 60 e 79 anos', () => {
      const hoje = new Date();
      const nasc68 = new Date(hoje.getFullYear() - 68, 0, 1);
      expect(sugerirTipoAtendimento(nasc68)).toBe('SP');
    });

    it('deve sugerir Pediatria (PD) para menores de 12 anos', () => {
      const hoje = new Date();
      const nasc5 = new Date(hoje.getFullYear() - 5, 0, 1);
      expect(sugerirTipoAtendimento(nasc5)).toBe('PD');
    });

    it('deve sugerir Obstetrícia (OB) quando a flag obstétrica estiver ativa e paciente for do sexo feminino', () => {
      const hoje = new Date();
      const nasc25 = new Date(hoje.getFullYear() - 25, 0, 1);
      expect(sugerirTipoAtendimento(nasc25, { obstetrico: true, sexoBiologico: 'FEMININO' })).toBe('OB');
      expect(sugerirTipoAtendimento(nasc25, { obstetrico: true })).toBe('OB');
    });

    it('NÃO deve sugerir Obstetrícia (OB) se o paciente for do sexo masculino, mesmo com flag ativa', () => {
      const hoje = new Date();
      const nasc25 = new Date(hoje.getFullYear() - 25, 0, 1);
      expect(sugerirTipoAtendimento(nasc25, { obstetrico: true, sexoBiologico: 'MASCULINO' })).toBe('SG');
    });

    it('deve sugerir Geral (SG) para adultos sem prioridade legal', () => {
      const hoje = new Date();
      const nasc35 = new Date(hoje.getFullYear() - 35, 0, 1);
      expect(sugerirTipoAtendimento(nasc35)).toBe('SG');
    });
  });

  describe('Geração e Resolução de Códigos de Senha', () => {
    it('deve formatar o código de senha com prefixo de 2 letras e 3 dígitos sequenciais', () => {
      expect(gerarCodigoSenha('SP', 1)).toBe('SP-001');
      expect(gerarCodigoSenha('SG', 42)).toBe('SG-042');
      expect(gerarCodigoSenha('S8', 3)).toBe('S8-003');
      expect(gerarCodigoSenha('PD', 115)).toBe('PD-115');
    });

    it('deve resolver atendimento com compatibilidade retroativa e dados legados', () => {
      const hoje = new Date();
      const nasc80 = new Date(hoje.getFullYear() - 81, 0, 1);

      const res1 = resolverSenhaETipo({
        numeroAtendimento: '20261004-A1B2',
        senhaSalva: 'SP-014',
      });
      expect(res1.senha).toBe('SP-014');
      expect(res1.tipo.codigo).toBe('SP');

      const res2 = resolverSenhaETipo({
        numeroAtendimento: '20261004-0042',
        dataNascimento: nasc80,
      });
      expect(res2.senha).toBe('S8-042');
      expect(res2.tipo.codigo).toBe('S8');
      expect(res2.idade).toBe(81);
    });
  });

  describe('Ordenação Rigorosa da Fila Hospitalar', () => {
    it('deve colocar casos 🔴 VERMELHO e 🟠 LARANJA no topo absoluto, independentemente da idade', () => {
      const hoje = new Date();
      const nasc88 = new Date(hoje.getFullYear() - 88, 0, 1); // Idoso 88 anos
      const nasc30 = new Date(hoje.getFullYear() - 30, 0, 1); // Jovem 30 anos

      const fila = [
        { id: '1', nome: 'Idoso 88 anos (Amarelo)', corTriagem: 'AMARELO', dataNascimento: nasc88, tipoCodigo: 'S8' },
        { id: '2', nome: 'Jovem 30 anos (Vermelho Emergência)', corTriagem: 'VERMELHO', dataNascimento: nasc30, tipoCodigo: 'SG' },
        { id: '3', nome: 'Adulto 40 anos (Laranja Muito Urgente)', corTriagem: 'LARANJA', dataNascimento: nasc30, tipoCodigo: 'SG' },
      ];

      const ordenados = ordenarFilaHospitalar(fila);

      expect(ordenados[0].id).toBe('2'); // Vermelho em 1º
      expect(ordenados[1].id).toBe('3'); // Laranja em 2º
      expect(ordenados[2].id).toBe('1'); // Amarelo 88 anos em 3º
    });

    it('deve priorizar 🟣 Superprioridade 80+ sobre casos 🟢 Verde e 🔵 Azul', () => {
      const hoje = new Date();
      const nasc85 = new Date(hoje.getFullYear() - 85, 0, 1); // 85 anos
      const nasc65 = new Date(hoje.getFullYear() - 65, 0, 1); // 65 anos
      const nasc25 = new Date(hoje.getFullYear() - 25, 0, 1); // 25 anos

      const fila = [
        { id: 'verde_jovem', nome: 'Jovem (Verde)', corTriagem: 'VERDE', dataNascimento: nasc25, tipoCodigo: 'SG', tempoEsperaMinutos: 40 },
        { id: 'azul_jovem', nome: 'Jovem (Azul)', corTriagem: 'AZUL', dataNascimento: nasc25, tipoCodigo: 'SG', tempoEsperaMinutos: 10 },
        { id: 'idoso_80', nome: 'Idoso 85 anos (Sem Manchester)', corTriagem: null, dataNascimento: nasc85, tipoCodigo: 'S8', tempoEsperaMinutos: 5 },
        { id: 'preferencial_65', nome: 'Idoso 65 anos (Sem Manchester)', corTriagem: null, dataNascimento: nasc65, tipoCodigo: 'SP', tempoEsperaMinutos: 5 },
      ];

      const ordenados = ordenarFilaHospitalar(fila);

      // Idoso 80+ e Preferencial têm score maior que casos pouco urgentes/não urgentes
      expect(ordenados[0].id).toBe('idoso_80');
      expect(ordenados[1].id).toBe('preferencial_65');
      expect(ordenados[2].id).toBe('verde_jovem');
      expect(ordenados[3].id).toBe('azul_jovem');
    });

    it('deve ordenar corretamente com 🟡 Amarelo acima de Verde/Azul e 80+ no topo', () => {
      const hoje = new Date();
      const nasc82 = new Date(hoje.getFullYear() - 82, 0, 1);
      const nasc30 = new Date(hoje.getFullYear() - 30, 0, 1);

      const fila = [
        { id: 'verde', corTriagem: 'VERDE', dataNascimento: nasc30, tipoCodigo: 'SG' },
        { id: 'amarelo_geral', corTriagem: 'AMARELO', dataNascimento: nasc30, tipoCodigo: 'SG' },
        { id: 'amarelo_80', corTriagem: 'AMARELO', dataNascimento: nasc82, tipoCodigo: 'S8' },
        { id: 'azul', corTriagem: 'AZUL', dataNascimento: nasc30, tipoCodigo: 'SG' },
      ];

      const ordenados = ordenarFilaHospitalar(fila);

      expect(ordenados[0].id).toBe('amarelo_80');    // Amarelo + 80+
      expect(ordenados[1].id).toBe('amarelo_geral'); // Amarelo geral
      expect(ordenados[2].id).toBe('verde');         // Verde
      expect(ordenados[3].id).toBe('azul');          // Azul
    });
  });
});
