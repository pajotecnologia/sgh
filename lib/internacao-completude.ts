// lib/internacao-completude.ts — regras de fichas SUS + hospitalar para internação efetiva

export type StatusLaudoSus = 'RASCUNHO' | 'SOLICITADO' | 'AUTORIZADO' | string | null | undefined
export type StatusFichaHospitalar = 'RASCUNHO' | 'EM_ANDAMENTO' | 'CONCLUIDA' | string | null | undefined

/** Ficha SUS considerada preenchida quando salva (não rascunho). */
export function fichaSusPreenchida(status: StatusLaudoSus): boolean {
  return status === 'SOLICITADO' || status === 'AUTORIZADO'
}

/** Ficha hospitalar considerada preenchida quando concluída. */
export function fichaHospitalarPreenchida(status: StatusFichaHospitalar): boolean {
  return status === 'CONCLUIDA'
}

export function internacaoDocumentacaoCompleta(
  statusLaudoSus: StatusLaudoSus,
  statusFichaHospitalar: StatusFichaHospitalar
): boolean {
  return fichaSusPreenchida(statusLaudoSus) && fichaHospitalarPreenchida(statusFichaHospitalar)
}

export function mensagemInternacaoIncompleta(
  statusLaudoSus: StatusLaudoSus,
  statusFichaHospitalar: StatusFichaHospitalar
): string | null {
  const faltaSus = !fichaSusPreenchida(statusLaudoSus)
  const faltaHospitalar = !fichaHospitalarPreenchida(statusFichaHospitalar)
  if (!faltaSus && !faltaHospitalar) return null
  if (faltaSus && faltaHospitalar) return 'Pendente: Ficha SUS e Ficha Hospitalar'
  if (faltaSus) return 'Pendente: Ficha SUS'
  return 'Pendente: Ficha Hospitalar'
}
