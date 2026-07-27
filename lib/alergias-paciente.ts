export type AlergiaPacienteResumo = {
  descricao: string
  gravidade?: string | null
}

/** Remove alergias repetidas (mesma descrição + gravidade, ignorando maiúsculas). */
export const deduplicarAlergiasPaciente = (
  alergias: AlergiaPacienteResumo[]
): AlergiaPacienteResumo[] => {
  const vistos = new Set<string>()
  return alergias.filter((a) => {
    const descricao = a.descricao?.trim() ?? ''
    if (!descricao) return false
    const chave = `${descricao.toLowerCase()}|${(a.gravidade ?? '').trim().toLowerCase()}`
    if (vistos.has(chave)) return false
    vistos.add(chave)
    return true
  })
}
