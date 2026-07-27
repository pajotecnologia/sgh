'use client'

import type { ReactNode } from 'react'
import { ClipboardList, Stethoscope } from 'lucide-react'
import type { ColunasPrescricaoModelo, LinhaPrescricaoDuasColunas } from '@/lib/prescricao-modelo-colunas'
import {
  NOME_COLUNA_DIREITA_PADRAO,
  NOME_COLUNA_ESQUERDA_PADRAO,
} from '@/lib/validations/prescricao-medica-padrao'
import { cn } from '@/lib/utils'

type TabelaDuasColunasPrescricaoModeloProps = {
  linhas: LinhaPrescricaoDuasColunas[]
  colunas?: ColunasPrescricaoModelo
  modo?: 'cadastro' | 'prescricao'
  renderAcoes?: (index: number, linha: LinhaPrescricaoDuasColunas) => ReactNode
  renderColunaMedico?: (index: number, linha: LinhaPrescricaoDuasColunas) => ReactNode
  className?: string
}

const ColunaCelulas = ({
  celulas,
  vazio,
}: {
  celulas: { rotulo: string; valor: string }[]
  vazio?: string
}) => {
  if (!celulas.length) {
    return <p className="text-xs text-muted-foreground italic">{vazio ?? '—'}</p>
  }

  return (
    <div className="space-y-1.5">
      {celulas.map((c, i) => (
        <div key={`${c.rotulo}-${c.valor}-${i}`} className="text-sm">
          {c.rotulo ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block">
              {c.rotulo}
            </span>
          ) : null}
          <span
            className={cn(
              'whitespace-pre-wrap',
              c.valor.includes('preenchido pelo médico') || c.valor.includes('Campo em branco')
                ? 'text-muted-foreground italic text-xs'
                : 'text-foreground'
            )}
          >
            {c.valor}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TabelaDuasColunasPrescricaoModelo({
  linhas,
  colunas,
  modo = 'cadastro',
  renderAcoes,
  renderColunaMedico,
  className,
}: TabelaDuasColunasPrescricaoModeloProps) {
  if (linhas.length === 0) return null

  const nomeEsquerda = colunas?.nomeColunaEsquerda ?? NOME_COLUNA_ESQUERDA_PADRAO
  const nomeDireita = colunas?.nomeColunaDireita ?? NOME_COLUNA_DIREITA_PADRAO

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border', className)}>
      <table className="w-full text-left border-collapse min-w-[720px]">
        <thead>
          <tr className="bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
            <th scope="col" className="p-3 w-10 text-center">
              #
            </th>
            <th scope="col" className="p-3 w-[42%]">
              <span className="inline-flex items-center gap-1.5 text-primary">
                <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                {nomeEsquerda}
              </span>
            </th>
            <th scope="col" className="p-3 w-[42%]">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                {nomeDireita}
              </span>
            </th>
            {renderAcoes ? <th scope="col" className="p-3 w-24 text-center">Ações</th> : null}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, index) => (
            <tr
              key={linha.id}
              className={cn(
                'align-top border-b border-border last:border-b-0',
                index % 2 === 0 ? 'bg-card' : 'bg-muted/10'
              )}
            >
              <td className="p-3 text-center text-xs font-bold text-muted-foreground tabular-nums">
                {linha.ordem}
              </td>
              <td className="p-3 border-r border-border/60 bg-primary/[0.03]">
                {linha.tipoItem !== 'LINHA_DUPLA' ? (
                  <div className="mb-1.5">
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
                        linha.tipoItem === 'TEXTO_LIVRE'
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          : 'bg-primary/10 text-primary'
                      )}
                    >
                      {linha.tipoItem === 'TEXTO_LIVRE' ? 'Texto livre' : 'Medicamento'}
                    </span>
                  </div>
                ) : null}
                <ColunaCelulas celulas={linha.colunaModelo} />
              </td>
              <td
                className={cn(
                  'p-3',
                  modo === 'cadastro'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/15'
                    : 'bg-emerald-50/30 dark:bg-emerald-950/10'
                )}
              >
                {renderColunaMedico ? (
                  renderColunaMedico(index, linha)
                ) : (
                  <ColunaCelulas
                    celulas={linha.colunaMedico}
                    vazio={
                      modo === 'cadastro'
                        ? 'Será preenchido pelo médico ao prescrever'
                        : '—'
                    }
                  />
                )}
              </td>
              {renderAcoes ? (
                <td className="p-3 text-center align-middle">{renderAcoes(index, linha)}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
