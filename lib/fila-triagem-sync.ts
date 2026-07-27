/** Sincronização da fila entre abas/módulos (recepção → triagem) sem depender só do Pusher */

const CANAL_BROADCAST = 'sgh-fila-triagem'
const EVENTO_DOM = 'sgh:fila-atualizada'

export type MotivoFilaAtualizada =
  | 'NOVO_ATENDIMENTO'
  | 'TRIAGEM_CONCLUIDA'
  | 'CHAMADA_PACIENTE'
  | 'MANUAL'

export function notificarFilaAtualizada(motivo: MotivoFilaAtualizada = 'MANUAL'): void {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent(EVENTO_DOM, { detail: { motivo, ts: Date.now() } })
  )

  try {
    const bc = new BroadcastChannel(CANAL_BROADCAST)
    bc.postMessage({ motivo, ts: Date.now() })
    bc.close()
  } catch {
    /* BroadcastChannel indisponível — CustomEvent na mesma aba ainda funciona */
  }
}

export function escutarFilaAtualizada(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handler = () => callback()
  window.addEventListener(EVENTO_DOM, handler)

  let bc: BroadcastChannel | null = null
  try {
    bc = new BroadcastChannel(CANAL_BROADCAST)
    bc.onmessage = handler
  } catch {
    /* ignora */
  }

  const onVisible = () => {
    if (document.visibilityState === 'visible') callback()
  }
  document.addEventListener('visibilitychange', onVisible)

  return () => {
    window.removeEventListener(EVENTO_DOM, handler)
    bc?.close()
    document.removeEventListener('visibilitychange', onVisible)
  }
}

/** Fetch da fila sem cache (Next.js / CDN) */
export async function fetchFilaTriagem(url: string): Promise<Response> {
  const separador = url.includes('?') ? '&' : '?'
  return fetch(`${url}${separador}_ts=${Date.now()}`, {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  })
}
