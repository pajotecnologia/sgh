'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Loader2, RotateCcw, ShieldCheck, UserCog, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { MENU_PERMISSOES, chavesPorGrupo, type ChavePermissao } from '@/lib/permissoes-menu'

interface Usuario {
  id: string
  nome: string
  email: string
  role: string
  ativo: boolean
}

const ROTULOS_ROLE: Record<string, string> = {
  ADMIN: 'Administrador',
  MEDICO: 'Médico',
  ENFERMEIRO: 'Enfermeiro',
  TECNICO_ENFERMAGEM: 'Téc. Enfermagem',
  RECEPCIONISTA: 'Recepcionista',
  DIRETOR_CLINICO: 'Diretor Clínico',
  FARMACEUTICO: 'Farmacêutico',
}

export function PermissoesUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuarioId, setUsuarioId] = useState('')
  const [permissoes, setPermissoes] = useState<Record<string, boolean>>({})
  const [padroes, setPadroes] = useState<Record<string, boolean>>({})
  const [bloqueioAdmin, setBloqueioAdmin] = useState(false)
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true)
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const usuarioSelecionado = usuarios.find((u) => u.id === usuarioId)

  useEffect(() => {
    let ativo = true
    fetch('/api/configuracoes/usuarios')
      .then((res) => res.json())
      .then((json) => {
        if (!ativo) return
        if (!json.sucesso) throw new Error(json.erro)
        const lista = (json.dados ?? []) as Usuario[]
        setUsuarios(lista)
        const primeiro = lista.find((u) => u.ativo && u.role !== 'ADMIN') ?? lista.find((u) => u.ativo)
        if (primeiro) setUsuarioId(primeiro.id)
      })
      .catch((erro) => {
        if (ativo) toast.error(erro instanceof Error ? erro.message : 'Erro ao carregar usuários.')
      })
      .finally(() => {
        if (ativo) setCarregandoUsuarios(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    if (!usuarioId) return
    let ativo = true
    setCarregandoPermissoes(true)
    fetch(`/api/configuracoes/permissoes?usuarioId=${encodeURIComponent(usuarioId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ativo) return
        if (!json.sucesso) throw new Error(json.erro)
        setPermissoes(json.dados.permissoes ?? {})
        const mapaPadrao = Object.fromEntries(
          (json.dados.itens ?? []).map((item: { chave: string; padrao: boolean }) => [item.chave, item.padrao])
        )
        setPadroes(mapaPadrao)
        setBloqueioAdmin(Boolean(json.dados.bloqueioAdmin))
      })
      .catch((erro) => {
        if (ativo) toast.error(erro instanceof Error ? erro.message : 'Erro ao carregar permissões.')
      })
      .finally(() => {
        if (ativo) setCarregandoPermissoes(false)
      })
    return () => {
      ativo = false
    }
  }, [usuarioId])

  const grupos = useMemo(() => chavesPorGrupo(), [])
  const total = MENU_PERMISSOES.length
  const liberados = MENU_PERMISSOES.filter((item) => permissoes[item.chave]).length

  function alterar(chave: ChavePermissao, permitido: boolean) {
    if (bloqueioAdmin) return
    setPermissoes((atual) => ({ ...atual, [chave]: permitido }))
  }

  function restaurarPadroes() {
    if (bloqueioAdmin) return
    setPermissoes({ ...padroes })
  }

  function marcarGrupo(grupo: string, permitido: boolean) {
    if (bloqueioAdmin) return
    const grupoItens = MENU_PERMISSOES.filter((item) => item.grupo === grupo)
    setPermissoes((atual) => ({
      ...atual,
      ...Object.fromEntries(grupoItens.map((item) => [item.chave, permitido])),
    }))
  }

  async function salvar() {
    if (!usuarioId || bloqueioAdmin) return
    setSalvando(true)
    try {
      const res = await fetch('/api/configuracoes/permissoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, permissoes }),
      })
      const json = await res.json()
      if (!json.sucesso) throw new Error(json.erro)
      if (json.dados) {
        setPermissoes(json.dados)
      }
      toast.success(json.mensagem ?? 'Permissões salvas com sucesso!')
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : 'Erro ao salvar permissões.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregandoUsuarios) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Carregando usuários e perfis...</p>
      </div>
    )
  }

  if (usuarios.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
        <UserCog className="h-10 w-10 text-muted-foreground mx-auto" />
        <h3 className="text-base font-semibold">Nenhum usuário cadastrado</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Cadastre novos usuários na aba &quot;Usuários do Sistema&quot; para configurar permissões individuais.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Permissões por usuário
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Selecione o usuário e marque exatamente quais módulos e itens do menu ele pode acessar.
              O sistema começa com o padrão do cargo e permite ajustes individuais.
            </p>
          </div>
          <div className="w-full lg:w-[360px] shrink-0">
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Usuário</label>
            <div className="relative">
              <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                disabled={carregandoUsuarios}
                className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-lg border border-input bg-background text-sm cursor-pointer"
              >
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome} — {ROTULOS_ROLE[usuario.role] ?? usuario.role}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {usuarioSelecionado ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3">
          <div className="text-xs">
            <span className="font-semibold">{usuarioSelecionado.nome}</span>
            <span className="text-muted-foreground"> · {ROTULOS_ROLE[usuarioSelecionado.role] ?? usuarioSelecionado.role}</span>
            {bloqueioAdmin ? (
              <span className="ml-2 inline-flex rounded-full bg-primary/10 text-primary px-2 py-0.5 font-semibold">Acesso total</span>
            ) : null}
          </div>
          <div className="text-xs text-muted-foreground">
            {liberados}/{total} itens liberados
          </div>
        </div>
      ) : null}

      {bloqueioAdmin ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <strong>Administrador:</strong> o perfil ADMIN possui acesso total ao sistema e não recebe restrições por menu.
        </div>
      ) : null}

      {carregandoPermissoes ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => {
            const grupoItens = grupo.itens
            const todos = grupoItens.every((item) => permissoes[item.chave])
            const nenhum = grupoItens.every((item) => !permissoes[item.chave])
            return (
              <section key={grupo.grupo} className="rounded-xl border border-border bg-background overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide">{grupo.grupo}</h3>
                    <p className="text-[11px] text-muted-foreground">{grupoItens.length} itens configuráveis</p>
                  </div>
                  {!bloqueioAdmin ? (
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => marcarGrupo(grupo.grupo, true)} className="px-2.5 py-1.5 rounded-md border border-border text-[11px] font-semibold hover:bg-muted">
                        Liberar grupo
                      </button>
                      <button type="button" onClick={() => marcarGrupo(grupo.grupo, false)} className="px-2.5 py-1.5 rounded-md border border-border text-[11px] font-semibold hover:bg-muted">
                        Bloquear grupo
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="divide-y divide-border">
                  {grupoItens.map((item) => {
                    const permitido = Boolean(permissoes[item.chave])
                    const padrao = Boolean(padroes[item.chave])
                    return (
                      <label
                        key={item.chave}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                          permitido ? 'hover:bg-primary/5' : 'hover:bg-muted/40',
                          item.parent && 'pl-9'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={permitido}
                          disabled={bloqueioAdmin}
                          onChange={(e) => alterar(item.chave, e.target.checked)}
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                            permitido ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background text-transparent'
                          )}
                          aria-hidden
                        >
                          {permitido ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{item.label}</span>
                          <span className="block text-[11px] text-muted-foreground truncate">{item.href}</span>
                        </span>
                        <span className={cn(
                          'hidden sm:inline-flex text-[10px] font-semibold px-2 py-1 rounded-full',
                          permitido === padrao ? 'bg-muted text-muted-foreground' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        )}>
                          {permitido === padrao ? 'Padrão do cargo' : 'Personalizado'}
                        </span>
                      </label>
                    )
                  })}
                </div>

                {!bloqueioAdmin && todos ? <div className="px-4 py-2 text-[11px] text-emerald-700 bg-emerald-500/5">Todos os itens deste grupo estão liberados.</div> : null}
                {!bloqueioAdmin && nenhum ? <div className="px-4 py-2 text-[11px] text-muted-foreground bg-muted/20">Todos os itens deste grupo estão bloqueados.</div> : null}
              </section>
            )
          })}
        </div>
      )}

      {!bloqueioAdmin && usuarioSelecionado ? (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 backdrop-blur p-3 shadow-lg">
          <button
            type="button"
            onClick={restaurarPadroes}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar padrões do cargo
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60"
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Salvar permissões
          </button>
        </div>
      ) : null}
    </div>
  )
}
