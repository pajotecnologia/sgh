import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { Loader2 } from 'lucide-react'

const FormularioCadastroPaciente = dynamic(
  () =>
    import('@/components/recepcao/FormularioCadastroPaciente').then((m) => ({
      default: m.FormularioCadastroPaciente,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Carregando formulário…
      </div>
    ),
  }
)

export const metadata: Metadata = { title: 'Novo Paciente | Recepção' }

export default function PaginaNovoPaciente() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="page-title">Cadastro de Paciente</h2>
        <p className="page-subtitle">
          Preencha todos os dados. Campos marcados com <span className="text-destructive">*</span> são obrigatórios.
        </p>
      </div>
      <FormularioCadastroPaciente />
    </div>
  );
}
