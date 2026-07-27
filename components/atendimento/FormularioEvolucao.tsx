'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, NotebookPen, Save } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { textoCadastroMaiusculo } from '@/lib/cadastro-maiusculo'
import { cn } from '@/lib/utils'

interface EvolucaoItem {
  id: string
  conteudo: string
  template: string | null
  registradoEm: string
  autor: { nome: string; crm: string | null }
}

export function FormularioEvolucao({
  atendimentoId,
  prontuarioId,
  evolucoesIniciais,
  onSalvo,
  textoSugerido,
  preencherAutomaticamente = false,
  variant = 'default',
}: {
  atendimentoId: string
  prontuarioId: string
  evolucoesIniciais: EvolucaoItem[]
  onSalvo: () => void
  textoSugerido?: string
  /** Quando true, preenche o campo com o contexto clínico ao abrir (internação). */
  preencherAutomaticamente?: boolean
  /** prontuario: botão Salvar só após preencher; histórico atualiza na hora abaixo do formulário */
  variant?: 'default' | 'prontuario'
}) {
  const textoInicial =
    preencherAutomaticamente && textoSugerido?.trim()
      ? textoCadastroMaiusculo(textoSugerido.trim())
      : ''

  const [conteudo, setConteudo] = useState(textoInicial)
  const [template, setTemplate] = useState<'LIVRE' | 'SOAP'>('LIVRE')
  const [enviando, setEnviando] = useState(false)
  const [mostrarUltimaEvolucao, setMostrarUltimaEvolucao] = useState(false)
  const [evolucoes, setEvolucoes] = useState<EvolucaoItem[]>(evolucoesIniciais)
  const [evolucaoRecemSalvaId, setEvolucaoRecemSalvaId] = useState<string | null>(null)
  const historicoRef = useRef<HTMLDivElement>(null)

  const conteudoValido = conteudo.trim().length >= 10
  const modoProntuario = variant === 'prontuario'

  useEffect(() => {
    setEvolucoes(evolucoesIniciais)
  }, [evolucoesIniciais])

  useEffect(() => {
    if (!evolucaoRecemSalvaId) return
    const timer = setTimeout(() => setEvolucaoRecemSalvaId(null), 4000)
    return () => clearTimeout(timer)
  }, [evolucaoRecemSalvaId])

  useEffect(() => {
    if (!preencherAutomaticamente || !textoSugerido?.trim()) return
    setConteudo((atual) => {
      if (atual.trim()) return atual
      return textoCadastroMaiusculo(textoSugerido.trim())
    })
  }, [preencherAutomaticamente, textoSugerido])

  const ultimaEvolucao = useMemo(() => {
    if (evolucoes.length === 0) return null
    return [...evolucoes].sort(
      (a, b) => new Date(b.registradoEm).getTime() - new Date(a.registradoEm).getTime()
    )[0]
  }, [evolucoes])

  const evolucoesOrdenadas = useMemo(
    () =>
      [...evolucoes].sort(
        (a, b) => new Date(b.registradoEm).getTime() - new Date(a.registradoEm).getTime()
      ),
    [evolucoes]
  )

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!conteudoValido) {
      toast.error('Descreva a evolução (mínimo 10 caracteres).')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/evolucao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prontuarioId, conteudo: conteudo.trim(), template }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar evolução.')
        return
      }

      const novaEvolucao: EvolucaoItem = {
        id: json.dados.id,
        conteudo: json.dados.conteudo,
        template: json.dados.template ?? null,
        registradoEm:
          typeof json.dados.registradoEm === 'string'
            ? json.dados.registradoEm
            : new Date(json.dados.registradoEm).toISOString(),
        autor: json.dados.autor,
      }

      setEvolucoes((atual) => [novaEvolucao, ...atual.filter((ev) => ev.id !== novaEvolucao.id)])
      setEvolucaoRecemSalvaId(novaEvolucao.id)
      setConteudo('')
      setMostrarUltimaEvolucao(false)
      toast.success('Evolução registrada.')
      onSalvo()
      requestAnimationFrame(() => {
        historicoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setEnviando(false)
    }
  }

  const exibirBotaoSalvar = modoProntuario ? conteudoValido : true

  return (
    <div className={cn('space-y-6', modoProntuario && 'space-y-4')}>
      <form onSubmit={salvar} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <NotebookPen className="h-5 w-5 text-primary" />
          Nova evolução
        </h3>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">Modelo</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as 'LIVRE' | 'SOAP')}
              className="border border-input rounded-lg px-3 py-2 text-sm bg-background"
            >
              <option value="LIVRE">Texto livre</option>
              <option value="SOAP">SOAP</option>
            </select>
          </div>
          {textoSugerido?.trim() ? (
            <button
              type="button"
              onClick={() => setConteudo(textoCadastroMaiusculo(textoSugerido.trim()))}
              className="text-xs font-semibold text-primary hover:underline"
              aria-label="Restaurar contexto clínico do paciente"
            >
              Restaurar contexto clínico
            </button>
          ) : null}
        </div>
        {ultimaEvolucao ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setMostrarUltimaEvolucao((v) => !v)}
              className="text-xs font-semibold text-primary hover:underline"
              aria-expanded={mostrarUltimaEvolucao}
            >
              {mostrarUltimaEvolucao ? 'Ocultar última evolução' : 'Ler última evolução'}
            </button>
            {mostrarUltimaEvolucao ? (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground mb-1.5">
                  <span>
                    {ultimaEvolucao.autor.nome}
                    {ultimaEvolucao.autor.crm ? ` — CRM ${ultimaEvolucao.autor.crm}` : ''}
                  </span>
                  <span>{new Date(ultimaEvolucao.registradoEm).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-foreground">
                  {ultimaEvolucao.conteudo}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
        <textarea
          value={conteudo}
          onChange={(e) => setConteudo(textoCadastroMaiusculo(e.target.value))}
          rows={10}
          placeholder="S — O — A — P (SE SOAP) OU EVOLUÇÃO CLÍNICA DETALHADA…"
          className={cn(
            'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none',
            'focus:ring-2 focus:ring-primary/30 focus:border-primary min-h-[200px]'
          )}
        />
        {modoProntuario && !conteudoValido ? (
          <p className="text-xs text-muted-foreground">
            Preencha a evolução (mínimo 10 caracteres) para habilitar o botão Salvar.
          </p>
        ) : null}
        {exibirBotaoSalvar ? (
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60"
            aria-label="Salvar evolução"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {modoProntuario ? 'Salvar evolução' : 'Registrar evolução'}
          </button>
        ) : null}
      </form>

      <div ref={historicoRef}>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Histórico (imutável)
        </h4>
        {evolucoesOrdenadas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma evolução registrada ainda.</p>
        ) : (
          <ul className="space-y-3">
            {evolucoesOrdenadas.map((ev) => {
              const recemSalva = ev.id === evolucaoRecemSalvaId
              return (
                <li
                  key={ev.id}
                  className={cn(
                    'border rounded-lg p-4 transition-colors',
                    recemSalva
                      ? 'border-green-400/70 bg-green-50/80 dark:bg-green-950/30 ring-1 ring-green-400/30'
                      : 'border-border bg-muted/20'
                  )}
                >
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground mb-2">
                    <span>
                      {ev.autor.nome}
                      {ev.autor.crm ? ` — CRM ${ev.autor.crm}` : ''}
                    </span>
                    <time dateTime={ev.registradoEm}>
                      {format(new Date(ev.registradoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </time>
                    {ev.template ? (
                      <span className="font-medium text-foreground">{ev.template}</span>
                    ) : null}
                    {recemSalva ? (
                      <span className="text-green-700 dark:text-green-300 font-semibold">
                        Recém registrada
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed text-foreground/95">{ev.conteudo}</p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
