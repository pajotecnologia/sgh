import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FormularioCadastroPaciente } from '@/components/recepcao/FormularioCadastroPaciente'
import { AlertTriangle } from 'lucide-react'

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const sessao = await getServerSession(authOptions)
  if (!sessao) return notFound()

  const { id } = await params

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id, deletedAt: null },
    })

    if (!paciente) notFound()

    const nomeTitulo = nomeCompletoParaExibicao(paciente.nomeExibicao, paciente.nomeCriptografado)

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Editar Cadastro: {nomeTitulo}</h2>
        </div>

        <FormularioCadastroPaciente pacienteId={id} />
      </div>
    )
  } catch (erro) {
    console.error('[recepcao/editar]', erro)
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" aria-hidden />
        <h2 className="text-xl font-bold">Erro ao carregar edição</h2>
        <p className="text-sm text-muted-foreground">
          Não foi possível conectar ao banco de dados. Verifique{' '}
          <code className="text-xs bg-muted px-1 rounded">DATABASE_URL</code> no .env da VPS e reinicie o PM2.
        </p>
        <Link href="/recepcao" className="inline-block text-sm text-primary hover:underline">
          Voltar à recepção
        </Link>
      </div>
    )
  }
}
