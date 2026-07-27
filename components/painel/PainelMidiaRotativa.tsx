'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { MidiaPainelRotativa } from '@/lib/painel-config'
import { inferirTipoMidiaPainel } from '@/lib/painel-config'
import { ImageIcon } from 'lucide-react'

type PainelMidiaRotativaProps = {
  imagens: MidiaPainelRotativa[]
  intervaloSegundos: number
  className?: string
}

export const PainelMidiaRotativa = ({
  imagens,
  intervaloSegundos,
  className,
}: PainelMidiaRotativaProps) => {
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [visivel, setVisivel] = useState(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const total = imagens.length
  const atual = total > 0 ? imagens[indiceAtual] : null
  const tipoAtual = atual ? inferirTipoMidiaPainel(atual.url, atual.tipo) : 'imagem'
  const intervaloMs = Math.max(3000, intervaloSegundos * 1000)

  const avancar = useCallback(() => {
    if (total <= 1) return
    setVisivel(false)
    setTimeout(() => {
      setIndiceAtual((i) => (i + 1) % total)
      setVisivel(true)
    }, 400)
  }, [total])

  // Rotação por tempo — apenas para imagens (vídeos avançam ao terminar)
  useEffect(() => {
    if (total <= 1 || tipoAtual === 'video') return
    const timer = setInterval(avancar, intervaloMs)
    return () => clearInterval(timer)
  }, [total, tipoAtual, intervaloMs, indiceAtual, avancar])

  // Reiniciar vídeo ao trocar de slide
  useEffect(() => {
    if (tipoAtual !== 'video' || !videoRef.current) return
    const el = videoRef.current
    el.currentTime = 0
    void el.play().catch(() => {})
  }, [indiceAtual, tipoAtual, atual?.id])

  if (!atual) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-slate-900/80 text-slate-500',
          className
        )}
        aria-label="Área de mídia vazia"
      >
        <ImageIcon className="h-16 w-16 opacity-30 mb-3" />
        <p className="text-sm">Nenhuma mídia configurada</p>
      </div>
    )
  }

  const legendaVisivel = Boolean(atual.titulo?.trim() || atual.legenda?.trim())

  return (
    <div
      className={cn('relative overflow-hidden bg-black', className)}
      aria-live="polite"
      aria-label="Mídias informativas rotativas"
    >
      {tipoAtual === 'video' ? (
        <video
          ref={videoRef}
          key={atual.id}
          src={atual.url}
          autoPlay
          muted
          playsInline
          loop={total === 1}
          onEnded={total > 1 ? avancar : undefined}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            visivel ? 'opacity-100' : 'opacity-0'
          )}
        />
      ) : (
        <img
          key={atual.id}
          src={atual.url}
          alt={atual.titulo?.trim() || `Mídia ${indiceAtual + 1}`}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            visivel ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {legendaVisivel ? (
        <div
          className={cn(
            'absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-8 py-6 transition-opacity duration-500 pointer-events-none',
            visivel ? 'opacity-100' : 'opacity-0'
          )}
        >
          {atual.titulo?.trim() ? (
            <p className="text-xl md:text-2xl font-bold text-white">{atual.titulo}</p>
          ) : null}
          {atual.legenda?.trim() ? (
            <p className="text-sm md:text-base text-slate-200 mt-1">{atual.legenda}</p>
          ) : null}
        </div>
      ) : null}

      {total > 1 ? (
        <div className="absolute top-4 right-4 flex gap-1.5" aria-hidden="true">
          {imagens.map((item, idx) => (
            <span
              key={item.id}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                idx === indiceAtual ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
