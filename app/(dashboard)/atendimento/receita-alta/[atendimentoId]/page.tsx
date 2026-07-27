'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { FormularioReceitaAlta } from '@/components/atendimento/FormularioReceitaAlta'
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao'
import { filtrarPrescricoesReceitaAlta } from '@/lib/prescricao-tipo'

export default function PaginaReceitaAltaAtendimento({
  params,
}: {
  params: Promise<{ atendimentoId: string }>
}) {
  const { atendimentoId } = use(params)
  const [carregando, setCarregando] = useState(true)
  const [dados, setDados] = useState<{
    atendimento: {
      status: string
      numeroAtendimento: string
      paciente: { nomeExibicao: string; nomeCriptografado?: string; nomeCompleto?: string }
    }
    prontuario: { id: string; encerradoEm?: string | null; prescricoes: unknown[] }
  } | null>(null)

  async function carregar() {
    setCarregando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/prontuario`)
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao carregar dados.')
        setDados(null)
        return
      }
      setDados(json.dados)
    } catch {
      toast.error('Erro de conexão.')
      setDados(null)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [atendimentoId])

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Carregando…</p>
      </div>
    )
  }

  if (!dados?.prontuario) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <Link href="/atendimento" className="text-sm text-primary hover:underline">
          ← Voltar à fila
        </Link>
        <p className="mt-4 text-muted-foreground">Atendimento não encontrado.</p>
      </div>
    )
  }

  const nome =
    dados.atendimento.paciente.nomeCompleto ??
    nomeCompletoParaExibicao(
      dados.atendimento.paciente.nomeExibicao,
      dados.atendimento.paciente.nomeCriptografado,
      dados.atendimento.paciente.nomeCompleto
    )
  const receitas = filtrarPrescricoesReceitaAlta(dados.prontuario.prescricoes as never[])

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      <Link
        href="/atendimento"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à fila
      </Link>

      <div className="bg-card border border-border rounded-xl p-5">
        <h1 className="text-lg font-bold text-foreground">Receita de alta</h1>
        <p className="text-sm text-muted-foreground mt-1 break-words">{nome}</p>
        <p className="text-xs font-mono text-muted-foreground mt-0.5">
          {dados.atendimento.numeroAtendimento}
        </p>
      </div>

      <FormularioReceitaAlta
        atendimentoId={atendimentoId}
        prontuarioId={dados.prontuario.id}
        prescricoes={receitas as never[]}
        onSalvo={carregar}
      />
    </div>
  )
}
