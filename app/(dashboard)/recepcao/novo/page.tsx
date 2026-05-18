// app/(dashboard)/recepcao/novo/page.tsx — Página de cadastro de novo paciente
import type { Metadata } from 'next';
import { FormularioCadastroPaciente } from '@/components/recepcao/FormularioCadastroPaciente';

export const metadata: Metadata = { title: 'Novo Paciente | Recepção' };

export default function PaginaNovoPaciente() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Cadastro de Paciente</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Preencha todos os dados. Campos marcados com <span className="text-destructive">*</span> são obrigatórios.
        </p>
      </div>
      <FormularioCadastroPaciente />
    </div>
  );
}
