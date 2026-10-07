'use client'

import { useEffect, useState } from 'react'
import { Command, Search, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

const ATALHOS = [
  { titulo: 'Minha Fila', descricao: 'Pendências e próximas ações', href: '/minha-fila', keywords: 'fila tarefas pendencias' },
  { titulo: 'Recepção', descricao: 'Buscar e cadastrar pacientes', href: '/recepcao', keywords: 'paciente cadastro recepcao' },
  { titulo: 'Prontuário Médico', descricao: 'Pesquisar pacientes e prontuários', href: '/prontuario', keywords: 'prontuario paciente histórico' },
  { titulo: 'Triagem', descricao: 'Fila do Protocolo de Manchester', href: '/triagem', keywords: 'triagem manchester enfermagem' },
  { titulo: 'Atendimento Médico', descricao: 'Fila de atendimento clínico', href: '/atendimento', keywords: 'medico consulta atendimento' },
  { titulo: 'Internação', descricao: 'Admissões e leitos', href: '/internamento/admissoes', keywords: 'internacao leito admissao' },
  { titulo: 'Farmácia', descricao: 'Dispensação e prescrições', href: '/farmacia', keywords: 'farmacia medicamento prescricao' },
  { titulo: 'Relatórios', descricao: 'Indicadores e relatórios', href: '/relatorios/prontuario-medico', keywords: 'relatorio indicadores gestao' },
]

export function BuscaGlobal() {
  const router = useRouter()
  const [aberta, setAberta] = useState(false)
  const [termo, setTermo] = useState('')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setAberta(true)
      }
      if (event.key === 'Escape') setAberta(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const resultados = ATALHOS.filter((item) => {
    const q = termo.trim().toLowerCase()
    if (!q) return true
    return \`\${item.titulo} \${item.descricao} \${item.keywords}\`.includes(q)
  })

  const navegar = (href: string) => {
    setAberta(false)
    setTermo('')
    router.push(href)
  }

  return (
    <>
      <button type="button" onClick={() => setAberta(true)} className="hidden sm:flex items-center gap-2 min-w-36 lg:min-w-56 max-w-72 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-xs text-muted-foreground" aria-label="Busca global (Ctrl K)">
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Buscar no SGH...</span>
        <kbd className="ml-auto hidden lg:inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border border-border bg-background"><Command className="h-2.5 w-2.5" />K</kbd>
      </button>

      {aberta && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm p-3 sm:p-6 flex items-start justify-center" role="dialog" aria-modal="true" aria-label="Busca global">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Fechar busca" onClick={() => setAberta(false)} />
          <div className="relative w-full max-w-2xl mt-8 sm:mt-16 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input autoFocus value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Digite uma área ou ação..." className="w-full h-12 bg-transparent outline-none text-sm" />
              <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">Esc</kbd>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {resultados.map((item) => (
                <button key={item.href} type="button" onClick={() => navegar(item.href)} className="w-full flex items-center gap-3 text-left p-3 rounded-lg hover:bg-muted transition-colors group">
                  <div className="min-w-0 flex-1"><p className="text-xs font-semibold">{item.titulo}</p><p className="text-[11px] text-muted-foreground mt-0.5">{item.descricao}</p></div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </button>
              ))}
              {resultados.length === 0 && <p className="p-6 text-center text-xs text-muted-foreground">Nenhum atalho encontrado.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
