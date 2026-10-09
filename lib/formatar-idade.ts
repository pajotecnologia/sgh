// lib/formatar-idade.ts — Cálculo e formatação clínica de idade de pacientes
// Suporte a recém-nascidos, lactentes e pediátricos (< 1 ano: dias e meses)

/**
 * Calcula e formata a idade clínica detalhada de um paciente.
 * 
 * Regras:
 * - 0 dias: "Recém-nascido (0 dias)"
 * - < 30 dias: "X dias" (ex: "5 dias")
 * - < 1 ano: "X meses" ou "X meses e Y dias" (ex: "3 meses", "1 mês e 15 dias")
 * - >= 1 ano: "X anos" ou "1 ano"
 */
export function formatarIdadeExtenso(dataNascimento?: Date | string | null): string {
  if (!dataNascimento) return '';
  const nasc = typeof dataNascimento === 'string' ? new Date(dataNascimento) : dataNascimento;
  if (isNaN(nasc.getTime())) return '';

  const hoje = new Date();
  const dHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dNasc = new Date(nasc.getFullYear(), nasc.getMonth(), nasc.getDate());

  const diffMs = dHoje.getTime() - dNasc.getTime();
  if (diffMs < 0) return '';

  const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (totalDias === 0) return 'Recém-nascido (0 dias)';
  if (totalDias === 1) return '1 dia';
  if (totalDias < 30) return `${totalDias} dias`;

  let anos = hoje.getFullYear() - nasc.getFullYear();
  let meses = hoje.getMonth() - nasc.getMonth();
  let dias = hoje.getDate() - nasc.getDate();

  if (dias < 0) {
    meses--;
    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
    dias += ultimoDiaMesAnterior;
  }

  if (meses < 0) {
    anos--;
    meses += 12;
  }

  // Menor que 1 ano (< 12 meses)
  if (anos === 0) {
    if (meses === 0) {
      return totalDias === 1 ? '1 dia' : `${totalDias} dias`;
    }
    const labelMes = meses === 1 ? '1 mês' : `${meses} meses`;
    if (dias > 0) {
      const labelDia = dias === 1 ? '1 dia' : `${dias} dias`;
      return `${labelMes} e ${labelDia}`;
    }
    return labelMes;
  }

  // 1 ano ou mais
  if (anos === 1) return '1 ano';
  return `${anos} anos`;
}

/**
 * Formatação curta para badges, cards compactos e listagens
 * Exemplos: "0d", "5d", "3m", "3m 15d", "1a", "25a"
 */
export function formatarIdadeCurta(dataNascimento?: Date | string | null): string {
  if (!dataNascimento) return '';
  const nasc = typeof dataNascimento === 'string' ? new Date(dataNascimento) : dataNascimento;
  if (isNaN(nasc.getTime())) return '';

  const hoje = new Date();
  const dHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dNasc = new Date(nasc.getFullYear(), nasc.getMonth(), nasc.getDate());

  const totalDias = Math.floor((dHoje.getTime() - dNasc.getTime()) / (1000 * 60 * 60 * 24));
  if (totalDias < 0) return '';
  if (totalDias < 30) return `${totalDias}d`;

  let anos = hoje.getFullYear() - nasc.getFullYear();
  let meses = hoje.getMonth() - nasc.getMonth();
  let dias = hoje.getDate() - nasc.getDate();

  if (dias < 0) {
    meses--;
    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
    dias += ultimoDiaMesAnterior;
  }
  if (meses < 0) {
    anos--;
    meses += 12;
  }

  if (anos === 0) {
    if (dias > 0) return `${meses}m ${dias}d`;
    return `${meses}m`;
  }

  return `${anos}a`;
}
