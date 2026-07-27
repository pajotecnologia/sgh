'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Copy, FlaskConical } from 'lucide-react'
import {
  FormularioExames,
  type PrefillExamesForm,
} from '@/components/atendimento/FormularioExames'

type RequisicaoExame = {
  id: string
  categoria: string
  urgencia: string
  indicacao: string
  createdAt: string
  itens?: {
    id: string
    nomeExame: string
    codigoTuss?: string | null
    observacoes?: string | null
    resultado?: string | null
    resultadoPdf?: string | null
    realizadoEm?: string | null
  }[]
}

type AbaExamesInternacaoProps = {
  atendimentoId: string
  prontuarioId: string
  requisicoes?: RequisicaoExame[]
  somenteLeitura?: boolean
  onAtualizar: () => void
}

function copiarRequisicaoComoPrefill(r: RequisicaoExame): PrefillExamesForm {
  const linhas = (r.itens ?? [])
    .filter((item) => item.nomeExame?.trim())
    .map((item) => ({
      nomeExame: item.nomeExame.trim(),
      codigoTuss: item.codigoTuss?.trim() ?? '',
      observacoes: item.observacoes?.trim() ?? '',
    }))

  return {
    categoria: r.categoria,
    urgencia: r.urgencia,
    indicacao: r.indicacao?.trim() ?? '',
    linhas: linhas.length ? linhas : [{ nomeExame: '', codigoTuss: '', observacoes: '' }],
  }
}

export function AbaExamesInternacao({
  atendimentoId,
  prontuarioId,
  requisicoes = [],
  somenteLeitura = false,
  onAtualizar,
}: AbaExamesInternacaoProps) {
  const requisicoesOrdenadas = useMemo(
    () =>
      [...requisicoes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [requisicoes]
  )
  const ultimaRequisicao = requisicoesOrdenadas[0] ?? null

  const [prefill, setPrefill] = useState<PrefillExamesForm | undefined>(undefined)
  const [formKey, setFormKey] = useState(0)
  const [mostrarUltimaRequisicao, setMostrarUltimaRequisicao] = useState(false)

  const carregarRequisicao = (r: RequisicaoExame) => {
    setPrefill(copiarRequisicaoComoPrefill(r))
    setFormKey((k) => k + 1)
    setMostrarUltimaRequisicao(false)
  }

  const limparFormulario = () => {
    setPrefill(undefined)
    setFormKey((k) => k + 1)
  }

  const handleSalvo = () => {
    limparFormulario()
    onAtualizar()
  }

  return (
    <div className="space-y-6">
      <section className="bg-card border border-primary/20 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-5 py-4 border-b border-border bg-primary/5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" aria-hidden />
              Exames e resultados
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Formulário inicia vazio. Consulte requisições anteriores e carregue como nova solicitação.
            </p>
          </div>
          {!somenteLeitura ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMostrarUltimaRequisicao((v) => !v)}
                disabled={!ultimaRequisicao}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50 transition-colors disabled:opacity-40"
              >
                <FlaskConical className="h-3.5 w-3.5" aria-hidden />
                {mostrarUltimaRequisicao ? 'Ocultar última requisição' : 'Ler última requisição'}
              </button>
              {ultimaRequisicao ? (
                <button
                  type="button"
                  onClick={() => carregarRequisicao(ultimaRequisicao)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  Repetir última requisição
                </button>
              ) : null}
              <button
                type="button"
                onClick={limparFormulario}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Limpar formulário
              </button>
            </div>
          ) : null}
        </div>

        {mostrarUltimaRequisicao && ultimaRequisicao ? (
          <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">
                Última requisição — {ultimaRequisicao.categoria}
              </span>
              <span>{format(new Date(ultimaRequisicao.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap text-foreground border-l-2 border-primary/30 pl-2 mb-2">
              {ultimaRequisicao.indicacao}
            </p>
            <ul className="space-y-1.5">
              {(ultimaRequisicao.itens ?? []).map((i) => (
                <li key={i.id} className="text-sm flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-medium">{i.nomeExame}</span>
                  {i.codigoTuss ? (
                    <span className="text-muted-foreground text-xs font-mono">({i.codigoTuss})</span>
                  ) : null}
                  {i.observacoes?.trim() ? (
                    <span className="text-muted-foreground text-xs">— {i.observacoes}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            {!somenteLeitura ? (
              <button
                type="button"
                onClick={() => carregarRequisicao(ultimaRequisicao)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                Carregar como nova requisição
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="p-4 sm:p-5">
          {somenteLeitura ? (
            <FormularioExames
              atendimentoId={atendimentoId}
              prontuarioId={prontuarioId}
              requisicoesIniciais={requisicoesOrdenadas}
              ocultarFormularioNova
              onSalvo={onAtualizar}
            />
          ) : (
            <FormularioExames
              key={formKey}
              atendimentoId={atendimentoId}
              prontuarioId={prontuarioId}
              requisicoesIniciais={requisicoesOrdenadas}
              prefill={prefill}
              onRepetirRequisicao={carregarRequisicao}
              onSalvo={handleSalvo}
            />
          )}
        </div>
      </section>
    </div>
  )
}
