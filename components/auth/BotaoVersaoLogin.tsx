'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Sparkles } from 'lucide-react'
import { ModalNovidadesVersao } from '@/components/shared/ModalNovidadesVersao'
import { VERSAO_SGH, BUILD_SGH } from '@/lib/versao'

export function BotaoVersaoLogin() {
  const [modalAberto, setModalAberto] = useState(false)

  return (
    <>
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Link direto para a Landing Page / Apresentação */}
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 hover:bg-card border border-border/80 text-xs font-semibold text-foreground hover:text-primary transition-colors shadow-2xs group"
          title="Página Inicial & Apresentação dos Recursos"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
          <span>Início</span>
        </Link>

        {/* Link direto para a Central de Ajuda / Manual */}
        <Link
          href="/ajuda"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 hover:bg-card border border-border/80 text-xs font-semibold text-foreground hover:text-primary transition-colors shadow-2xs group"
          title="Manual do Usuário & Central de Ajuda"
        >
          <BookOpen className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
          <span>Manual</span>
        </Link>

        {/* Botão Interativo de Versão & Novidades */}
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted border border-border/70 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-all shadow-2xs cursor-pointer select-none group"
          title="Clique para ver as notas de atualização da versão"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground">{VERSAO_SGH}</span>
          <span className="text-muted-foreground/40">•</span>
          <span className="text-[9px] text-muted-foreground/80">{BUILD_SGH}</span>
          <Sparkles className="h-3 w-3 text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
        </button>
      </div>

      {/* Modal de Novidades da Versão */}
      <ModalNovidadesVersao open={modalAberto} onOpenChange={setModalAberto} />
    </>
  )
}
