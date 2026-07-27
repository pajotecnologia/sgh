'use client'

import Link from 'next/link'
import { BadgeManchester } from '@/components/triagem/BadgeManchester'
import { BotaoChamarPainel } from '@/components/atendimento/BotaoChamarPainel'
import { EnvoltorioListaPaginada } from '@/components/shared/EnvoltorioListaPaginada'
import type { CorTriagem } from '@/types'

type ItemEmAtendimento = {
  id: string
  numeroAtendimento: string
  nomeLista: string
  corTriagem: CorTriagem | null | undefined
}

export function ListaEmAtendimentoPaginada({
  itens,
  titulo,
}: {
  itens: ItemEmAtendimento[]
  titulo: string
}) {
  if (itens.length === 0) return null

  return (
    <section>
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {titulo}
      </h3>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <EnvoltorioListaPaginada items={itens} compacto className="border-t-0">
          {(fatia) => (
            <div className="grid gap-2 p-2">
              {fatia.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-card border border-blue-200/80 dark:border-blue-900 rounded-lg"
                >
                  <Link href={`/atendimento/${a.id}`} className="flex items-center gap-2.5 min-w-0 flex-1 group">
                    <div className="h-8 w-8 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {(a.nomeLista.trim().charAt(0) || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-foreground group-hover:text-blue-600 truncate">
                        {a.nomeLista}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">{a.numeroAtendimento}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {a.corTriagem ? <BadgeManchester cor={a.corTriagem} size="sm" /> : null}
                    <BotaoChamarPainel atendimentoId={a.id} label="Chamar" className="text-[10px] px-2 py-1.5" />
                    <Link
                      href={`/atendimento/${a.id}`}
                      className="px-2.5 py-1.5 bg-blue-600 text-white text-[10px] font-semibold rounded-md hover:bg-blue-700 whitespace-nowrap"
                    >
                      Continuar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </EnvoltorioListaPaginada>
      </div>
    </section>
  )
}
