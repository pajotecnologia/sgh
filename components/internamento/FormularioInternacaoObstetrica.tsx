'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Loader2, Save, Baby, Plus, Trash2, BedDouble } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SECOES_INTERNACAO_OBSTETRICA,
  COLUNAS_TRABALHO_PARTO,
  COLUNAS_PUERPERIO,
  type SecaoObst,
  type CampoObst,
} from '@/lib/obstetricia-campos'

const inputCls =
  'mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30'
const inputMenorCls =
  'mt-1 w-full border border-input rounded-lg px-2.5 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/30'
const labelCls = 'text-sm font-medium text-foreground'
const labelMenorCls = 'text-xs font-medium text-muted-foreground'
const sectionCls = 'bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4'

type Campos = Record<string, string>
type Linha = Record<string, string>

const COLS_CLASS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}

type LeitoOpcao = { id: string; ala: string; quarto: string | null; codigo: string; tipo: string; status: string }

export function FormularioInternacaoObstetrica({
  atendimentoId,
  onSalvo,
  modoAdmissao,
  leitos,
  leitoId,
  onLeitoChange,
  carregandoLeitos,
  onConfirmarInternacao,
}: {
  atendimentoId: string
  onSalvo?: () => void
  modoAdmissao?: boolean
  leitos?: LeitoOpcao[]
  leitoId?: string
  onLeitoChange?: (id: string) => void
  carregandoLeitos?: boolean
  onConfirmarInternacao?: () => Promise<void>
}) {
  const { data: session } = useSession()
  const rubricaUsuario = session?.usuario?.nome ?? ''
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [identificacao, setIdentificacao] = useState({ nome: '', prontuario: '', leito: '' })
  const [campos, setCampos] = useState<Campos>({})
  const [trabalhoParto, setTrabalhoParto] = useState<Linha[]>([])
  const [puerperio, setPuerperio] = useState<Linha[]>([])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/internacao-obstetrica`)
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao carregar ficha.')
        return
      }
      const p = json.dados.prefill
      setIdentificacao({ nome: p.nomePaciente ?? '', prontuario: p.numeroProntuario ?? '', leito: p.leitoDescricao ?? '' })
      // Responsável da recepção entra como base, mas o que já foi salvo na ficha prevalece
      const camposSalvos = { ...(p.campos ?? {}), ...(p.recemNascido ?? {}), ...(p.condicoesAlta ?? {}) }
      const resp = (p.responsavel ?? {}) as Campos
      const merged: Campos = { ...camposSalvos }
      for (const [k, v] of Object.entries(resp)) {
        if (v && !merged[k]?.trim()) merged[k] = v
      }
      setCampos(merged)
      setTrabalhoParto((p.trabalhoParto ?? []) as Linha[])
      setPuerperio((p.puerperio ?? []) as Linha[])
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

  const handleSalvar = async () => {
    if (modoAdmissao && onConfirmarInternacao && !leitoId?.trim()) {
      toast.error('Selecione o leito antes de confirmar a internação.')
      return
    }
    setSalvando(true)
    try {
      const recemNascido: Campos = {}
      const condicoesAlta: Campos = {}
      const camposGerais: Campos = {}
      for (const [k, v] of Object.entries(campos)) {
        if (k.startsWith('rn_')) recemNascido[k] = v
        else if (k.startsWith('alta_')) condicoesAlta[k] = v
        else camposGerais[k] = v
      }
      const res = await fetch(`/api/atendimento/${atendimentoId}/internacao-obstetrica`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campos: camposGerais, trabalhoParto, puerperio, recemNascido, condicoesAlta }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar ficha.')
        return
      }
      // Modo admissão: confirma a internação (muda status p/ INTERNADO e navega)
      if (modoAdmissao && onConfirmarInternacao) {
        await onConfirmarInternacao()
        return
      }
      toast.success('Ficha de internação obstétrica salva.')
      onSalvo?.()
    } catch {
      toast.error('Erro de conexão ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const renderCampo = (campo: CampoObst, menor: boolean) => {
    const lbl = menor ? labelMenorCls : labelCls
    const inp = menor ? inputMenorCls : inputCls
    const valor = campos[campo.key] ?? ''

    if (campo.tipo === 'radio') {
      return (
        <div key={campo.key}>
          <label className={lbl}>{campo.label}</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {(campo.opcoes ?? []).map((op) => {
              const ativo = valor === op
              return (
                <button
                  key={op}
                  type="button"
                  onClick={() => setCampo(campo.key, ativo ? '' : op)}
                  aria-pressed={ativo}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                    ativo ? 'border-pink-500 bg-pink-500/15 text-pink-900 dark:text-pink-100' : 'border-border hover:bg-muted/50'
                  )}
                >
                  {op}
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <div key={campo.key} className={campo.tipo === 'area' ? 'sm:col-span-full' : ''}>
        <label className={lbl}>{campo.label}</label>
        {campo.tipo === 'area' ? (
          <textarea rows={3} value={valor} onChange={(e) => setCampo(campo.key, e.target.value)} className={inp} aria-label={campo.label} />
        ) : (
          <input
            type={campo.tipo === 'data' ? 'date' : 'text'}
            value={valor}
            onChange={(e) => setCampo(campo.key, e.target.value)}
            className={inp}
            aria-label={campo.label}
          />
        )}
      </div>
    )
  }

  const renderSecao = (secao: SecaoObst) => (
    <section key={secao.titulo} className={sectionCls}>
      <h3 className="text-base font-semibold border-b border-border pb-2">{secao.titulo}</h3>
      <div className="space-y-3">
        {secao.linhas.map((linha, i) => (
          <div key={i} className={cn('grid grid-cols-1 gap-3', COLS_CLASS[linha.length] ?? 'sm:grid-cols-3')}>
            {linha.map((campo) => renderCampo(campo, Boolean(secao.fonteMenor)))}
          </div>
        ))}
      </div>
    </section>
  )

  const renderTabela = (
    titulo: string,
    colunas: readonly { key: string; label: string }[],
    linhas: Linha[],
    setLinhas: React.Dispatch<React.SetStateAction<Linha[]>>
  ) => (
    <section className={sectionCls}>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-base font-semibold">{titulo}</h3>
        <button
          type="button"
          onClick={() => setLinhas((l) => [...l, { rubrica: rubricaUsuario }])}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar linha
        </button>
      </div>
      {linhas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma linha. Clique em adicionar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {colunas.map((col) => (
                  <th key={col.key} className="border border-border px-3 py-2 font-semibold text-left text-xs uppercase tracking-wide text-muted-foreground">
                    {col.label}
                  </th>
                ))}
                <th className="border border-border px-2 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha, idx) => (
                <tr key={idx}>
                  {colunas.map((col) => (
                    <td key={col.key} className="border border-border p-0">
                      <input
                        type="text"
                        value={linha[col.key] ?? ''}
                        onChange={(e) =>
                          setLinhas((l) => l.map((r, i) => (i === idx ? { ...r, [col.key]: e.target.value } : r)))
                        }
                        className="w-full px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:bg-primary/5 min-w-[7rem]"
                        aria-label={`${col.label} linha ${idx + 1}`}
                      />
                    </td>
                  ))}
                  <td className="border border-border text-center">
                    <button
                      type="button"
                      onClick={() => setLinhas((l) => l.filter((_, i) => i !== idx))}
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                      aria-label={`Remover linha ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )

  if (carregando) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      </div>
    )
  }

  // Ordem: responsável → atenção médica → exame físico → diagnóstico →
  // trabalho de parto (tabela) → parto → intervenção → recém-nascido → puerpério (tabela) → condições de alta
  const [resp, atencao, exame, dx, parto, intervencao, rn, alta] = SECOES_INTERNACAO_OBSTETRICA

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-pink-500/30 bg-pink-500/5 px-4 py-3 text-sm">
        <Baby className="h-5 w-5 text-pink-600 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Folha de Internação e Alta Hospitalar em Obstetrícia</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {identificacao.nome}
            {identificacao.leito ? ` · Leito ${identificacao.leito}` : ''}
            {identificacao.prontuario ? ` · Prontuário ${identificacao.prontuario}` : ''}
          </p>
        </div>
      </div>

      {renderSecao(resp)}
      {renderSecao(atencao)}
      {renderSecao(exame)}
      {renderSecao(dx)}
      {renderTabela('Evolução do trabalho de parto', COLUNAS_TRABALHO_PARTO, trabalhoParto, setTrabalhoParto)}
      {renderSecao(parto)}
      {renderSecao(intervencao)}
      {renderSecao(rn)}
      {renderTabela('Evolução do puerpério', COLUNAS_PUERPERIO, puerperio, setPuerperio)}
      {renderSecao(alta)}

      {modoAdmissao && onLeitoChange ? (
        <section className="bg-card border border-primary/20 rounded-xl p-5 sm:p-6 space-y-3">
          <h3 className="text-base font-semibold border-b border-border pb-2 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-primary" aria-hidden />
            Leito / Apartamento
          </h3>
          {carregandoLeitos ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Carregando leitos…
            </p>
          ) : (
            <div>
              <label className="text-sm font-medium text-foreground">Selecionar leito *</label>
              <select
                value={leitoId ?? ''}
                onChange={(e) => onLeitoChange(e.target.value)}
                className={inputCls}
                aria-label="Selecionar leito"
              >
                <option value="">— Selecione o leito —</option>
                {(leitos ?? [])
                  .slice()
                  .sort((a, b) => {
                    if (a.status === 'DISPONIVEL' && b.status !== 'DISPONIVEL') return -1
                    if (a.status !== 'DISPONIVEL' && b.status === 'DISPONIVEL') return 1
                    return a.ala.localeCompare(b.ala)
                  })
                  .map((l) => (
                    <option key={l.id} value={l.id} disabled={l.status !== 'DISPONIVEL'}>
                      {l.ala} • {l.codigo}
                      {l.quarto ? ` — Quarto ${l.quarto}` : ''} — {l.tipo.replace(/_/g, ' ')}
                      {l.status !== 'DISPONIVEL' ? ` (${l.status})` : ' ✓'}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </section>
      ) : null}

      <button
        type="button"
        disabled={salvando}
        onClick={handleSalvar}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        aria-label={modoAdmissao ? 'Salvar e internar' : 'Salvar ficha'}
      >
        {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {modoAdmissao ? 'Salvar e confirmar internação' : 'Salvar ficha'}
      </button>
    </div>
  )
}
