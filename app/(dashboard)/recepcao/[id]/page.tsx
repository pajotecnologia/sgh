// app/(dashboard)/recepcao/[id]/page.tsx — Página de ficha do paciente
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { descriptografar, mascararCpf } from '@/lib/encryption';
import { FichaPacienteClient } from '@/components/recepcao/FichaPacienteClient';

export const metadata: Metadata = { title: 'Ficha do Paciente' };

export default async function PaginaFichaPaciente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessao = await getServerSession(authOptions);

  const paciente = await prisma.paciente.findFirst({
    where: { id, deletedAt: null },
    include: {
      endereco: true,
      alergias: { orderBy: { createdAt: 'asc' } },
      medicamentosCont: { orderBy: { createdAt: 'asc' } },
      atendimentos: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true, numeroAtendimento: true, status: true,
          setor: true, sala: true, createdAt: true,
          triagem: { select: { corClassificacao: true, queixaPrincipal: true, classificadoEm: true } },
        },
      },
    },
  });

  if (!paciente) notFound();

  let cpf = '', nomeCompleto = paciente.nomeExibicao, rg = '', telefone = '';
  try { cpf = descriptografar(paciente.cpfCriptografado); } catch {}
  try { nomeCompleto = descriptografar(paciente.nomeCriptografado); } catch {}
  try { rg = paciente.rgCriptografado ? descriptografar(paciente.rgCriptografado) : ''; } catch {}
  try { telefone = paciente.telefoneCriptografado ? descriptografar(paciente.telefoneCriptografado) : ''; } catch {}

  const dados = {
    id: paciente.id,
    nomeCompleto, nomeExibicao: paciente.nomeExibicao,
    cpf, cpfMascarado: mascararCpf(cpf), rg, telefone,
    dataNascimento: paciente.dataNascimento.toISOString(),
    sexoBiologico: paciente.sexoBiologico,
    genero: paciente.genero,
    tipoSanguineo: paciente.tipoSanguineo,
    convenio: paciente.convenio,
    numeroCarteirinha: paciente.numeroCarteirinha,
    observacoesIniciais: paciente.observacoesIniciais,
    endereco: paciente.endereco ? {
      cep: paciente.endereco.cep, logradouro: paciente.endereco.logradouro,
      numero: paciente.endereco.numero, complemento: paciente.endereco.complemento,
      bairro: paciente.endereco.bairro, cidade: paciente.endereco.cidade,
      estado: paciente.endereco.estado,
    } : null,
    alergias: paciente.alergias.map(a => ({ descricao: a.descricao, gravidade: a.gravidade })),
    medicamentosContinuos: paciente.medicamentosCont.map(m => ({
      nome: m.nome, dose: m.dose, frequencia: m.frequencia, observacoes: m.observacoes,
    })),
    atendimentos: paciente.atendimentos.map(a => ({
      ...a, createdAt: a.createdAt.toISOString(),
      triagem: a.triagem ? { ...a.triagem, classificadoEm: a.triagem.classificadoEm?.toISOString() ?? null } : null,
    })),
    createdAt: paciente.createdAt.toISOString(),
    isAdmin: sessao?.usuario.role === 'ADMIN',
    canEdit: ['ADMIN', 'RECEPCIONISTA'].includes(sessao?.usuario.role ?? ''),
  };

  return <FichaPacienteClient dados={dados} />;
}
