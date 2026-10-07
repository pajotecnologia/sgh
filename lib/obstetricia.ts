/**
 * Regras centrais de elegibilidade para dados e atendimento obstétricos.
 * Um atendimento só pode ser tratado como obstétrico quando a flag estiver ativa
 * e o sexo biológico do paciente for feminino.
 */
export function ehSexoBiologicoFeminino(sexoBiologico?: string | null): boolean {
  const sexoNorm = String(sexoBiologico ?? '').trim().toUpperCase()
  return sexoNorm === 'FEMININO' || sexoNorm === 'F'
}

export function atendimentoObstetricoPermitido(
  obstetrico?: boolean | null,
  sexoBiologico?: string | null
): boolean {
  return Boolean(obstetrico) && ehSexoBiologicoFeminino(sexoBiologico)
}
