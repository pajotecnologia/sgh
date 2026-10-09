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

  const nomeRnSugerido = campos['rn_vinculado_nome'] || (identificacao.nome ? `RN de ${identificacao.nome}` : 'Recém-Nascido')
  const prontuarioRn = campos['rn_vinculado_prontuario'] || ''
  const atendimentoIdRn = campos['rn_vinculado_atendimento_id'] || ''
  const pesoRn = campos['rn_peso'] || campos['peso_nascimento'] || ''
  const apgar1 = campos['rn_apgar1'] || ''
  const apgar5 = campos['rn_apgar5'] || ''
  const sexoRn = campos['rn_sexo'] || 'Não informado'

  const urlCadastroRn = `/recepcao/novo?nomeMae=${encodeURIComponent(identificacao.nome)}&origem=bercario&atendimentoMaeId=${encodeURIComponent(atendimentoId)}&sexo=${encodeURIComponent(sexoRn)}&peso=${encodeURIComponent(pesoRn)}&apgar1=${encodeURIComponent(apgar1)}&apgar5=${encodeURIComponent(apgar5)}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-pink-500/30 bg-pink-500/5 px-4 py-3 text-sm">
        <Baby className="h-5 w-5 text-pink-600 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Ficha Médica de Berçário — Linha Materno-Infantil</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Mãe: <strong>{identificacao.nome || 'Não informada'}</strong>
            {identificacao.leito ? ` · Leito ${identificacao.leito}` : ''}
            {identificacao.prontuario ? ` · Prontuário Mãe ${identificacao.prontuario}` : ''}
          </p>
        </div>
      </div>

      {/* Card de Vínculo Mãe-Filho & Atalho Prontuário do Recém-Nascido */}
      <section className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 border border-pink-200 dark:border-pink-900 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-200 dark:border-pink-900/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300">
                Vínculo Materno-Infantil (RN)
              </span>
              {prontuarioRn ? (
                <span className="text-[11px] font-mono font-semibold bg-pink-100 dark:bg-pink-900/60 text-pink-800 dark:text-pink-200 px-2 py-0.5 rounded">
                  Prontuário RN: {prontuarioRn}
                </span>
              ) : null}
            </div>
            <h4 className="text-base font-bold text-foreground mt-0.5">
              {nomeRnSugerido}
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {atendimentoIdRn ? (
              <a
                href={`/evolucoes/${atendimentoIdRn}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Baby className="h-4 w-4" />
                Abrir Prontuário do RN
              </a>
            ) : null}
            <a
              href={urlCadastroRn}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-pink-600 text-white text-xs font-semibold hover:bg-pink-700 shadow-sm transition-colors"
            >
              <Baby className="h-4 w-4" />
              {prontuarioRn ? 'Atualizar Cadastro do RN' : 'Gerar Prontuário do Recém-Nascido (RN)'}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-background/80 rounded-lg p-2.5 border border-border">
            <span className="text-muted-foreground block text-[11px]">Sexo do RN</span>
            <span className="font-semibold text-foreground capitalize">{sexoRn}</span>
          </div>
          <div className="bg-background/80 rounded-lg p-2.5 border border-border">
            <span className="text-muted-foreground block text-[11px]">Peso ao Nascer</span>
            <span className="font-semibold text-foreground">{pesoRn ? `${pesoRn} g` : 'A preencher'}</span>
          </div>
          <div className="bg-background/80 rounded-lg p-2.5 border border-border">
            <span className="text-muted-foreground block text-[11px]">Índice de APGAR</span>
            <span className="font-semibold text-foreground">
              {apgar1 || apgar5 ? `1º min: ${apgar1 || '—'} / 5º min: ${apgar5 || '—'}` : 'A preencher'}
            </span>
          </div>
          <div className="bg-background/80 rounded-lg p-2.5 border border-border">
            <span className="text-muted-foreground block text-[11px]">Status do Vínculo</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {prontuarioRn ? `Vinculado & Cadastrado (${prontuarioRn})` : 'Vinculado à Mãe'}
            </span>
          </div>
        </div>
      </section>

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
