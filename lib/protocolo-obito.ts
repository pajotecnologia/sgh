export interface DeclaracaoObitoInput {
  atendimentoId: string
  pacienteId: string
  pacienteNome: string
  numeroDeclaracaoObito: string // Número oficial da folha de DO do Ministério da Saúde
  dataHoraConstatacao: string
  medicoAtestanteId: string
  medicoAtestanteNome: string
  crmMedico: string
  causaMorteLinhaA: string // Causa direta / imediata
  causaMorteLinhaB?: string // Causa antecedente
  causaMorteLinhaC?: string // Causa antecedente
  causaMorteLinhaD?: string // Causa básica
  outrasCondicoes?: string // Estados mórbidos que contribuíram
  tipoObito: 'NATURAL' | 'EXTERNA_ACIDENTE' | 'EXTERNA_VIOLENCIA' | 'SUSPEITA_INVESTIGACAO'
  encaminhamentoCorpo: 'NECROTERIO_HOSPITALAR' | 'SVO' | 'IML' | 'LIBERADO_FAMILIA'
  observacoes?: string
}

export function validarNumeroDeclaracaoObito(numeroDO: string): boolean {
  const limpo = numeroDO.replace(/\D/g, '')
  // Número de DO geralmente possui entre 8 e 10 dígitos numéricos
  return limpo.length >= 8 && limpo.length <= 10
}
