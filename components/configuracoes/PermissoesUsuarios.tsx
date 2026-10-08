'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import {
  Check,
  ChevronDown,
  Loader2,
  RotateCcw,
  ShieldCheck,
  UserCog,
  Search,
  CheckCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { MENU_PERMISSOES, chavesPorGrupo, type ChavePermissao } from '@/lib/permissoes-menu'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

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

function PermissoesUsuariosConteudo() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuarioId, setUsuarioId] = useState('')
  const [permissoes, setPermissoes] = useState<Record<string, boolean>>({})
  const [padroes, setPadroes] = useState<Record<string, boolean>>({})
  const [bloqueioAdmin, setBloqueioAdmin] = useState(false)
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true)
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [ultimoSalvoEm, setUltimoSalvoEm] = useState<string | null>(null)
  const [termoBusca, setTermoBusca] = useState('')

  const salvandoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const permissoesRef = useRef<Record<string, boolean>>(permissoes)
  permissoesRef.current = permissoes

  const usuarioSelecionado = usuarios.find((u) => u.id === usuarioId)

  // 1. Carregar lista de usuários
  useEffect(() => {
    let ativo = true
    setCarregandoUsuarios(true)
    fetch('/api/configuracoes/usuarios')
      .then((res) => res.json())
      .then((json) => {
        if (!ativo) return
        if (!json?.sucesso) throw new Error(json?.erro || 'Erro ao obter usuários')
        const lista = Array.isArray(json?.dados) ? (json.dados as Usuario[]) : []
        setUsuarios(lista)
        const primeiro = lista.find((u) => u.ativo && u.role !== 'ADMIN') ?? lista.find((u) => u.ativo) ?? lista[0]
        if (primeiro) {
          setUsuarioId(primeiro.id)
        }
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

  // 2. Carregar permissões do usuário selecionado
  useEffect(() => {
    if (!usuarioId) return
    let ativo = true
    setCarregandoPermissoes(true)
    fetch(`/api/configuracoes/permissoes?usuarioId=${encodeURIComponent(usuarioId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ativo) return
        if (!json?.sucesso) throw new Error(json?.erro || 'Erro ao obter permissões')
        const dadosPerm = json.dados?.permissoes ?? {}
        setPermissoes(dadosPerm)
        const itens = Array.isArray(json.dados?.itens) ? json.dados.itens : []
        const mapaPadrao = Object.fromEntries(
          itens.map((item: { chave: string; padrao: boolean }) => [item.chave, item.padrao])
        )
        setPadroes(mapaPadrao)
        setBloqueioAdmin(Boolean(json.dados?.bloqueioAdmin))
        setUltimoSalvoEm(null)
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

  // Salvar no backend
  const persistirPermissoes = useCallback(
    async (novasPermissoes: Record<string, boolean>) => {
      if (!usuarioId || bloqueioAdmin) return
      setSalvando(true)
      try {
        const res = await fetch('/api/configuracoes/permissoes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioId, permissoes: novasPermissoes }),
        })
        const json = await res.json()
        if (!json?.sucesso) throw new Error(json?.erro || 'Erro ao salvar permissões.')
        if (json.dados) {
          setPermissoes(json.dados)
        }
        setUltimoSalvoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      } catch (erro) {
        toast.error(erro instanceof Error ? erro.message : 'Erro ao salvar permissões.')
      } finally {
        setSalvando(false)
      }
    },
    [usuarioId, bloqueioAdmin]
  )

  // Salvar com auto-save imediato (debounce curto)
  const salvarComDebounce = useCallback(
    (novasPermissoes: Record<string, boolean>) => {
      if (salvandoTimeoutRef.current) {
        clearTimeout(salvandoTimeoutRef.current)
      }
      salvandoTimeoutRef.current = setTimeout(() => {
        persistirPermissoes(novasPermissoes)
      }, 350)
    },
    [persistirPermissoes]
  )

  // Alternar uma permissão individual
  const alterar = useCallback(
    (chave: ChavePermissao, permitido: boolean) => {
      if (bloqueioAdmin) return
      setPermissoes((atual) => {
        const novo = { ...(atual ?? {}), [chave]: permitido }
        salvarComDebounce(novo)
        return novo
      })
    },
    [bloqueioAdmin, salvarComDebounce]
  )

  // Restaurar padrões do cargo
  const restaurarPadroes = useCallback(() => {
    if (bloqueioAdmin) return
    const novo = { ...(padroes ?? {}) }
    setPermissoes(novo)
    persistirPermissoes(novo)
    toast.success('Padrões do cargo restaurados e salvos com sucesso.')
  }, [bloqueioAdmin, padroes, persistirPermissoes])

  // Marcar/Desmarcar grupo inteiro
  const marcarGrupo = useCallback(
    (grupo: string, permitido: boolean) => {
      if (bloqueioAdmin) return
      const grupoItens = MENU_PERMISSOES.filter((item) => item.grupo === grupo)
      setPermissoes((atual) => {
        const novo = {
          ...(atual ?? {}),
          ...Object.fromEntries(grupoItens.map((item) => [item.chave, permitido])),
        }
        persistirPermissoes(novo)
        return novo
      })
      toast.success(permitido ? `Grupo "${grupo}" liberado.` : `Grupo "${grupo}" bloqueado.`)
    },
    [bloqueioAdmin, persistirPermissoes]
  )

  const grupos = useMemo(() => chavesPorGrupo(), [])
  const total = MENU_PERMISSOES.length
  const liberados = MENU_PERMISSOES.filter((item) => Boolean(permissoes?.[item.chave])).length

  // Filtrar grupos por termo de busca
  const gruposFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return grupos
    const termo = termoBusca.toLowerCase().trim()
    return grupos
      .map((g) => ({
        ...g,
        itens: (g.itens ?? []).filter(
          (item) =>
            item.label.toLowerCase().includes(termo) ||
            item.href.toLowerCase().includes(termo) ||
            g.grupo.toLowerCase().includes(termo)
        ),
      }))
      .filter((g) => g.itens.length > 0)
  }, [grupos, termoBusca])

  if (carregandoUsuarios) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando usuários e permissões...</p>
      </div>
    )
  }

  if (usuarios.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3 bg-muted/10">
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
      {/* Cabeçalho do Seletor de Usuário */}
      <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" /> Permissões por usuário
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl">
              Selecione o usuário e marque ou desmarque exatamente quais módulos ele pode acessar.
              As alterações são salvas automaticamente em tempo real.
            </p>
          </div>
          <div className="w-full lg:w-[380px] shrink-0">
            <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">
              Selecione o Usuário
            </label>
            <div className="relative">
              <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                disabled={carregandoUsuarios || salvando}
                className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-lg border border-input bg-background text-sm font-medium text-foreground cursor-pointer focus:ring-2 focus:ring-primary focus:outline-hidden transition-all"
              >
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome} — {(usuario.role && ROTULOS_ROLE[usuario.role]) ? ROTULOS_ROLE[usuario.role] : (usuario.role || 'Usuário')}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Status do Usuário + Busca */}
      {usuarioSelecionado ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0">
              {usuarioSelecionado.nome?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate text-foreground flex items-center gap-1.5">
                <span>{usuarioSelecionado.nome}</span>
                <span className="text-muted-foreground font-normal">·</span>
                <span className="text-primary font-medium">
                  {(usuarioSelecionado.role && ROTULOS_ROLE[usuarioSelecionado.role]) ? ROTULOS_ROLE[usuarioSelecionado.role] : (usuarioSelecionado.role || 'Usuário')}
                </span>
                {bloqueioAdmin ? (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                    <Sparkles className="h-3 w-3" /> Acesso Total
                  </span>
                ) : null}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                <span>{liberados} de {total} itens liberados</span>
                {salvando ? (
                  <span className="text-amber-500 font-semibold flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Salvando...
                  </span>
                ) : ultimoSalvoEm ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCheck className="h-3.5 w-3.5" /> Salvo às {ultimoSalvoEm}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar módulo ou tela..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </div>
      ) : null}

      {bloqueioAdmin ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs sm:text-sm flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground">Perfil Administrador:</strong>
            <p className="text-muted-foreground mt-0.5">
              Usuários com cargo <strong>ADMIN</strong> possuem acesso integral a todos os recursos do SGH por padrão de segurança.
            </p>
          </div>
        </div>
      ) : null}

      {/* Lista de Grupos de Permissões */}
      {carregandoPermissoes ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-medium">Carregando permissões do usuário...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {gruposFiltrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-xs">
              Nenhum módulo encontrado para o termo de busca informado.
            </div>
          ) : (
            gruposFiltrados.map((grupo) => {
              const grupoItens = grupo.itens ?? []
              const todos = grupoItens.length > 0 && grupoItens.every((item) => Boolean(permissoes?.[item.chave]))
              const nenhum = grupoItens.length > 0 && grupoItens.every((item) => !permissoes?.[item.chave])

              return (
                <section
                  key={grupo.grupo}
                  className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">
                        {grupo.grupo}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">{grupoItens.length} telas / rotas configuráveis</p>
                    </div>
                    {!bloqueioAdmin ? (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => marcarGrupo(grupo.grupo, true)}
                          className="px-2.5 py-1 rounded-md border border-border bg-background text-[11px] font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                          Liberar grupo
                        </button>
                        <button
                          type="button"
                          onClick={() => marcarGrupo(grupo.grupo, false)}
                          className="px-2.5 py-1 rounded-md border border-border bg-background text-[11px] font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                          Bloquear grupo
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="divide-y divide-border">
                    {grupoItens.map((item) => {
                      const permitido = Boolean(permissoes?.[item.chave])
                      const padrao = Boolean(padroes?.[item.chave])
                      const ehPersonalizado = permitido !== padrao

                      return (
                        <div
                          key={item.chave}
                          onClick={() => !bloqueioAdmin && alterar(item.chave, !permitido)}
                          className={cn(
                            'flex items-center justify-between gap-3 px-4 py-3 transition-colors select-none',
                            bloqueioAdmin ? 'cursor-default' : 'cursor-pointer hover:bg-muted/40',
                            item.parent && 'pl-8 sm:pl-10 bg-muted/5'
                          )}
                        >
                          {/* Switch interativo robusto */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={permitido}
                              disabled={bloqueioAdmin}
                              onClick={(e) => {
                                e.stopPropagation()
                                alterar(item.chave, !permitido)
                              }}
                              className={cn(
                                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-60 disabled:cursor-default',
                                permitido ? 'bg-primary' : 'bg-muted-foreground/30'
                              )}
                            >
                              <span
                                className={cn(
                                  'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                                  permitido ? 'translate-x-4' : 'translate-x-0'
                                )}
                              />
                            </button>

                            <div className="min-w-0 flex-1">
                              <span className="block text-xs sm:text-sm font-semibold text-foreground truncate">
                                {item.label}
                              </span>
                              <span className="block text-[11px] text-muted-foreground font-mono truncate">
                                {item.href}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={cn(
                                'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                                ehPersonalizado
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold'
                                  : 'bg-muted text-muted-foreground border-border/60'
                              )}
                            >
                              {ehPersonalizado ? 'Personalizado' : 'Padrão do cargo'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {!bloqueioAdmin && todos ? (
                    <div className="px-4 py-2 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 font-medium border-t border-border">
                      ✓ Todos os itens deste grupo estão liberados para este usuário.
                    </div>
                  ) : null}
                  {!bloqueioAdmin && nenhum ? (
                    <div className="px-4 py-2 text-[11px] text-muted-foreground bg-muted/20 font-medium border-t border-border flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3 text-muted-foreground" /> Todos os itens deste grupo estão bloqueados.
                    </div>
                  ) : null}
                </section>
              )
            })
          )}
        </div>
      )}

      {/* Barra Flutuante de Ações */}
      {!bloqueioAdmin && usuarioSelecionado ? (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 backdrop-blur-md p-3 shadow-lg">
          <button
            type="button"
            onClick={restaurarPadroes}
            disabled={salvando}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-60"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar padrões do cargo
          </button>
          
          <div className="flex items-center gap-2">
            {salvando ? (
              <span className="text-xs text-amber-500 font-semibold flex items-center gap-1.5 px-3 py-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...
              </span>
            ) : ultimoSalvoEm ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 px-3 py-1.5">
                <Check className="h-3.5 w-3.5" /> Salvo ({ultimoSalvoEm})
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => persistirPermissoes(permissoesRef.current)}
              disabled={salvando}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60 shadow-sm"
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar agora
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function PermissoesUsuarios() {
  return (
    <ErrorBoundary
      fallbackTitle="Erro ao carregar tela de permissões"
      fallbackMessage="Ocorreu uma falha ao exibir a tela de permissões de usuários. Você pode tentar recarregar."
    >
      <PermissoesUsuariosConteudo />
    </ErrorBoundary>
  )
}
