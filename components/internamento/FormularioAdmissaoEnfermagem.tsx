'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  AlertCircle,
  BedDouble,
  ChevronRight,
  Loader2,
  Printer,
  UserCheck,
} from 'lucide-react'
import type { SolicitacaoInternacaoDados } from '@/lib/carregar-solicitacao-internacao'
import type { FichaInternacaoAltaPrefill } from '@/lib/ficha-internacao-alta'
import { FormularioFichaInternacaoAlta } from '@/components/internamento/FormularioFichaInternacaoAlta'
import { FormularioInternacaoObstetrica } from '@/components/internamento/FormularioInternacaoObstetrica'

type Leito = { id: string; ala: string; quarto: string | null; codigo: string; tipo: string; status: string }

export function FormularioAdmissaoEnfermagem({
  atendimentoId,
  solicitacao,
  prefill,
  fichaStatus,
}: {
  atendimentoId: string
  solicitacao: SolicitacaoInternacaoDados
  prefill: FichaInternacaoAltaPrefill
  fichaStatus?: string
}) {
  const router = useRouter()
  const enc = solicitacao.encaminhamento
  const numeroAtendimento = solicitacao.numeroAtendimento
  const [leitos, setLeitos] = useState<Leito[]>([])
  const [carregandoLeitos, setCarregandoLeitos] = useState(true)
  const [leitoId, setLeitoId] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    async function carregar() {
      setCarregandoLeitos(true)
      try {
        const res = await fetch('/api/cadastros/leitos?ativo=true')
        const json = await res.json()
        if (!json?.sucesso) {
          toast.error(json?.erro ?? 'Erro ao carregar leitos.')
          setLeitos([])
          return
        }
        setLeitos((json.dados ?? []) as Leito[])
      } catch {
        toast.error('Erro de conexão.')
        setLeitos([])
      } finally {
        setCarregandoLeitos(false)
      }
    }
    carregar()
  }, [])

  async function confirmarInternacao() {
    if (!leitoId) {
      toast.error('Selecione o leito (apartamento) antes de confirmar a internação.')
      return
    }
    setConfirmando(true)
    try {
      const res = await fetch('/api/internamento/admitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atendimentoId, leitoId }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao confirmar internação.')
        return
      }
      toast.success('Paciente internado com sucesso!')
      router.push('/internamento/admissoes')
      router.refresh()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Solicitação médica (só exibe se houver encaminhamento formal) */}
      {solicitacao.temEncaminhamentoFormal ? (
        <section className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-primary" aria-hidden />
            Solicitação médica de internação
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tipo de clínica
              </p>
              <p className="mt-1 font-medium text-foreground">{enc.tipoClinica}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                CID / médico
              </p>
              <p className="mt-1 font-mono text-foreground">{enc.cidInternacao || '—'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {solicitacao.medico?.nome ?? '—'}
                {solicitacao.medico?.crm ? ` — CRM ${solicitacao.medico.crm}` : ''}
              </p>
            </div>
          </div>
          {enc.resumoClinico ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Resumo clínico
              </p>
              <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{enc.resumoClinico}</p>
            </div>
          ) : null}
          {enc.justificativa ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Justificativa
              </p>
              <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                {enc.justificativa}
              </p>
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Solicitado em {format(new Date(enc.solicitadoEm), 'dd/MM/yyyy HH:mm')}
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {enc.id ? (
              <Link
                href={`/atendimento/encaminhamento/imprimir/${enc.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                <Printer className="h-4 w-4" aria-hidden />
                Imprimir solicitação médica
              </Link>
            ) : null}
          </div>
        </section>
      ) : (
        /* Aviso quando não há encaminhamento formal */
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              Internação direta (sem encaminhamento médico formal)
            </p>
            <p className="text-amber-700 dark:text-amber-400 mt-1">
              Não há encaminhamento formal de internação para este atendimento. Preencha a ficha
              de internamento abaixo com os dados necessários.
            </p>
          </div>
        </div>
      )}

      {/* Ficha de internamento — obstétrica ou hospitalar conforme o tipo de atendimento */}
      {solicitacao.obstetrico ? (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-pink-600" aria-hidden />
              Folha de Internação e Alta em Obstetrícia
            </h2>
            <p className="text-sm text-muted-foreground">
              Atendimento obstétrico. Preencha a ficha, selecione o leito ao final e use{' '}
              <strong className="text-foreground">Salvar e confirmar internação</strong>. A ficha
              também fica acessível no Prontuário Médico e de Enfermagem.
            </p>
          </section>

          <FormularioInternacaoObstetrica
            atendimentoId={atendimentoId}
            modoAdmissao={solicitacao.status !== 'INTERNADO'}
            leitos={leitos}
            leitoId={leitoId}
            onLeitoChange={setLeitoId}
            carregandoLeitos={carregandoLeitos}
            onConfirmarInternacao={confirmarInternacao}
            onSalvo={() => {
              router.push('/internamento/admissoes')
              router.refresh()
            }}
          />
        </>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-primary" aria-hidden />
              Folha de Internação e Alta Hospitalar
            </h2>
            <p className="text-sm text-muted-foreground">
              Preencha a ficha conforme o formulário hospitalar (admissão e atendimento inicial).
              Evoluções, enfermagem e condições de alta ficam em Prontuário Enfermagem.
            </p>
          </section>

          <FormularioFichaInternacaoAlta
            atendimentoId={atendimentoId}
            numeroAtendimento={numeroAtendimento}
            prefill={prefill}
            fichaStatusInicial={fichaStatus}
            statusAtendimento={solicitacao.status}
            modoAdmissao
            leitos={leitos}
            leitoId={leitoId}
            onLeitoChange={setLeitoId}
            carregandoLeitos={carregandoLeitos}
            onConfirmar={confirmarInternacao}
            confirmando={confirmando}
          />
        </>
      )}
    </div>
  )
}
