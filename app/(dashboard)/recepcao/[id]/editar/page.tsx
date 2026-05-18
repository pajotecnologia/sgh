import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FormularioCadastroPaciente } from '@/components/recepcao/FormularioCadastroPaciente';

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) return notFound();

  const { id } = await params;
  
  // Apenas verificar se existe, o form vai fazer o fetch via cliente
  const paciente = await prisma.paciente.findUnique({
    where: { id },
  });

  if (!paciente) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Editar Cadastro:{' '}
          {nomeCompletoParaExibicao(paciente.nomeExibicao, paciente.nomeCriptografado)}
        </h2>
      </div>
      
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <FormularioCadastroPaciente pacienteId={id} />
      </div>
    </div>
  );
}
