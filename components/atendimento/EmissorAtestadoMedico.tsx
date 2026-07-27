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

export function EmissorAtestadoMedico({
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

  const [dias, setDias] = useState<number>(1)
  const [cid, setCid] = useState('')
  const [observacoes, setObservacoes] = useState('')

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white py-6 print:py-0">
      <div className="max-w-[210mm] mx-auto px-4 print:px-0 print:max-w-none">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <BotaoImprimirFicha />
        </div>

        <div className="bg-card border border-border rounded-xl p-4 mb-4 print:hidden">
          <p className="text-sm font-semibold">Emitir atestado médico</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Dias de afastamento</label>
              <input
                type="number"
                min={1}
                max={365}
                value={dias}
                onChange={(e) => setDias(Number(e.target.value || 1))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">CID (opcional)</label>
              <input
                value={cid}
                onChange={(e) => setCid(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="sm:col-span-3">
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
          <CabecalhoInstituicaoImpressao instituicao={instituicao} subtitulo="Atestado Médico" />

          <div className="text-sm text-slate-900 leading-relaxed">
            <p className="font-semibold">IDENTIFICAÇÃO</p>
            <p className="mt-2">
              Atesto para os devidos fins que o(a) paciente <span className="font-semibold">{atendimento.pacienteNome}</span>{' '}
              esteve sob cuidados médicos, necessitando de afastamento por <span className="font-semibold">{dias}</span>{' '}
              {dias === 1 ? 'dia' : 'dias'}, a contar desta data.
            </p>
            {cid.trim() ? (
              <p className="mt-2">
                CID: <span className="font-mono font-semibold">{cid.trim()}</span>
              </p>
            ) : null}
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
