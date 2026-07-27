'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Loader2, Save, Baby, Plus, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SECOES_BERCARIO, type SecaoCampos } from '@/lib/obstetricia-campos'

const inputCls =
  'mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30'
const labelCls = 'text-sm font-medium text-foreground'
const sectionCls = 'bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4'

type Campos = Record<string, string>
type EvolItem = { dataHora: string; tipo?: string; texto: string; nomeProfissional?: string }

const TIPOS_EVOLUCAO = ['Prescrição', 'Medicação', 'Enfermagem', 'Evolução'] as const

export function FormularioBercario({ atendimentoId }: { atendimentoId: string }) {
  const { data: session } = useSession()
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [identificacao, setIdentificacao] = useState({ nome: '', prontuario: '', leito: '' })
  const [campos, setCampos] = useState<Campos>({})
  const [evolucao, setEvolucao] = useState<EvolItem[]>([])

  const [novoTipo, setNovoTipo] = useState<string>('Evolução')
  const [novoTexto, setNovoTexto] = useState('')

  const agoraLocal = () => {
    const d = new Date()
    const off = d.getTimezoneOffset()
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
  }

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/bercario`)
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao carregar ficha de berçário.')
        return
      }
      const p = json.dados.prefill
      setIdentificacao({ nome: p.nomePaciente ?? '', prontuario: p.numeroProntuario ?? '', leito: p.leitoDescricao ?? '' })
      setCampos((p.campos ?? {}) as Campos)
      setEvolucao((p.evolucao ?? []) as EvolItem[])
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setCarregando(false)
    }
  }, [atendimentoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const setCampo = (key: string, valor: string) => setCampos((p) => ({ ...p, [key]: valor }))

  const persistir = async (proximaEvolucao: EvolItem[]) => {
    setSalvando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/bercario`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campos, evolucao: proximaEvolucao }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar ficha de berçário.')
        return false
      }
      return true
    } catch {
      toast.error('Erro de conexão ao salvar.')
      return false
    } finally {
      setSalvando(false)
    }
  }

  const handleSalvar = async () => {
    if (await persistir(evolucao)) toast.success('Ficha de berçário salva.')
  }

  const handleAdicionarEvolucao = async () => {
    if (novoTexto.trim().length < 3) {
      toast.error('Descreva o registro.')
      return
    }
    const item: EvolItem = {
      dataHora: new Date(agoraLocal()).toISOString(),
      tipo: novoTipo,
      texto: novoTexto.trim(),
      nomeProfissional: session?.usuario?.nome ?? '',
    }
    const proxima = [item, ...evolucao]
    if (await persistir(proxima)) {
      setEvolucao(proxima)
      setNovoTexto('')
      toast.success('Registro adicionado.')
    }
  }

  const renderSecao = (secao: SecaoCampos) => (
    <section key={secao.titulo} className={sectionCls}>
      <h3 className="text-base font-semibold border-b border-border pb-2">{secao.titulo}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {secao.campos.map((campo) => (
          <div key={campo.key} className={campo.tipo === 'area' ? 'sm:col-span-2' : ''}>
            <label className={labelCls}>{campo.label}</label>
            {campo.tipo === 'area' ? (
              <textarea
                rows={3}
                value={campos[campo.key] ?? ''}
                onChange={(e) => setCampo(campo.key, e.target.value)}
                className={inputCls}
                aria-label={campo.label}
              />
            ) : (
              <input
                type={campo.tipo === 'data' ? 'date' : 'text'}
                value={campos[campo.key] ?? ''}
                onChange={(e) => setCampo(campo.key, e.target.value)}
                className={inputCls}
                aria-label={campo.label}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  )

  if (carregando) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-pink-500/30 bg-pink-500/5 px-4 py-3 text-sm">
        <Baby className="h-5 w-5 text-pink-600 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Ficha Médica de Berçário</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {identificacao.nome}
            {identificacao.leito ? ` · Leito ${identificacao.leito}` : ''}
            {identificacao.prontuario ? ` · Prontuário ${identificacao.prontuario}` : ''}
          </p>
        </div>
      </div>

      {SECOES_BERCARIO.map(renderSecao)}

      <button
        type="button"
        disabled={salvando}
        onClick={handleSalvar}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        aria-label="Salvar ficha de berçário"
      >
        {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar ficha
      </button>

      <section className={sectionCls}>
        <h3 className="text-base font-semibold border-b border-border pb-2">
          Evolução / Prescrição / Enfermagem
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Tipo</label>
            <select
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value)}
              className={inputCls}
              aria-label="Tipo do registro"
            >
              {TIPOS_EVOLUCAO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className={labelCls}>Registro</label>
            <textarea
              rows={3}
              value={novoTexto}
              onChange={(e) => setNovoTexto(e.target.value)}
              className={inputCls}
              placeholder="Sintomas, medicação, ração, etc."
              aria-label="Texto do registro"
            />
          </div>
        </div>
        <button
          type="button"
          disabled={salvando}
          onClick={handleAdicionarEvolucao}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar registro
        </button>

        {evolucao.length > 0 ? (
          <ul className="space-y-3 pt-2">
            {evolucao.map((r, idx) => (
              <li key={idx} className="border border-border rounded-lg p-3 bg-muted/10">
                <div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden />
                    {format(new Date(r.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {r.tipo ? (
                    <span className="font-semibold px-2 py-0.5 rounded bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200">
                      {r.tipo}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{r.texto}</p>
                {r.nomeProfissional ? (
                  <p className="text-xs text-muted-foreground mt-1.5">{r.nomeProfissional}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  )
}
