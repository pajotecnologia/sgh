'use client'

import { useMemo, useState } from 'react'
import { BotaoImprimirFicha } from '@/components/recepcao/BotaoImprimirFicha'
import { CabecalhoInstituicaoImpressao } from '@/components/print/CabecalhoInstituicaoImpressao'

type AtendimentoAtestado = {
  id: string
  numeroAtendimento: string
  pacienteNome: string
  medicoNome: string | null
  medicoCrm: string | null
  encerradoEmIso: string | null
}

type Instituicao = any

export function EmissorAtestadoAcompanhante({
  instituicao,
  atendimento,
}: {
  instituicao: Instituicao
  atendimento: AtendimentoAtestado
}) {
  const dataBase = useMemo(() => {
    const iso = atendimento.encerradoEmIso
    const d = iso ? new Date(iso) : new Date()
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(d)
  }, [atendimento.encerradoEmIso])

  const [acompanhanteNome, setAcompanhanteNome] = useState('')
  const [documento, setDocumento] = useState('')
  const [periodo, setPeriodo] = useState('no período da consulta')
  const [observacoes, setObservacoes] = useState('')

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white py-6 print:py-0">
      <div className="max-w-[210mm] mx-auto px-4 print:px-0 print:max-w-none">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <BotaoImprimirFicha />
        </div>

        <div className="bg-card border border-border rounded-xl p-4 mb-4 print:hidden">
          <p className="text-sm font-semibold">Emitir atestado de acompanhante</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome do acompanhante</label>
              <input
                value={acompanhanteNome}
                onChange={(e) => setAcompanhanteNome(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Documento (CPF/RG) (opcional)</label>
              <input
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Período</label>
              <input
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Observações (opcional)</label>
              <textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <article className="bg-white border border-slate-200 shadow-lg print:shadow-none rounded-xl p-5 print:p-0 print:border-0 print:rounded-none print-section">
          <CabecalhoInstituicaoImpressao instituicao={instituicao} subtitulo="Atestado de Acompanhante" />

          <div className="text-sm text-slate-900 leading-relaxed">
            <p className="font-semibold">IDENTIFICAÇÃO</p>
            <p className="mt-2">
              Atesto para os devidos fins que <span className="font-semibold">{acompanhanteNome.trim() || '________________________________'}</span>{' '}
              {documento.trim() ? (
                <span>
                  (Doc.: <span className="font-mono font-semibold">{documento.trim()}</span>)
                </span>
              ) : null}{' '}
              acompanhou o(a) paciente <span className="font-semibold">{atendimento.pacienteNome}</span> {periodo.trim() ? periodo.trim() : 'no período da consulta'}.
            </p>
            {observacoes.trim() ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{observacoes.trim()}</p>
            ) : null}
            <p className="mt-4 text-slate-700">{dataBase}</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6">
            <div className="pt-6 border-t border-slate-300 text-center">
              <p className="text-sm font-semibold text-slate-900">
                {atendimento.medicoNome ?? 'Médico responsável'}
              </p>
              <p className="text-xs text-slate-600">
                {atendimento.medicoCrm ? `CRM: ${atendimento.medicoCrm}` : 'CRM: ____________________'}
              </p>
              <p className="text-xs text-slate-500 mt-3">Assinatura e carimbo</p>
            </div>
          </div>

          <footer className="mt-5 flex justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-3">
            <span>Atendimento: {atendimento.numeroAtendimento}</span>
            <span>Impresso em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}</span>
          </footer>
        </article>
      </div>
    </div>
  )
}
