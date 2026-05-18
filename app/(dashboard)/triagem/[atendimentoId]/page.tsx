// app/(dashboard)/triagem/[atendimentoId]/page.tsx — Formulário de triagem de um paciente
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FormularioTriagem } from '@/components/triagem/FormularioTriagem';
import { parseEstadoConscienciaSinaisCsv } from '@/lib/triagem-estado-consciencia-sinais';
import { descriptografar } from '@/lib/encryption';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = { title: 'Realizar Triagem' };

export default async function PaginaRealizarTriagem({
  params,
}: {
  params: Promise<{ atendimentoId: string }>;
}) {
  const { atendimentoId } = await params;
  const sessao = await getServerSession(authOptions);

  if (!['ADMIN', 'ENFERMEIRO'].includes(sessao?.usuario.role ?? '')) {
    redirect('/triagem');
  }

  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, deletedAt: null },
    include: {
      origem: { select: { id: true, descricao: true } },
      paciente: {
        include: {
          alergias: { select: { descricao: true, gravidade: true } },
          medicamentosCont: { select: { nome: true, dose: true, frequencia: true } },
        },
      },
      triagem: {
        include: {
          sinaisVitais: true,
        },
      },
    },
  });

  if (!atendimento) notFound();

  // Se o atendimento estiver aguardando triagem, mudar para EM_TRIAGEM
  if (atendimento.status === 'AGUARDANDO_TRIAGEM') {
    await prisma.atendimento.update({
      where: { id: atendimentoId },
      data: { status: 'EM_TRIAGEM' }
    });
  }

  // Descriptografar nome completo para exibição no formulário (contexto clínico)
  let nomeCompleto = atendimento.paciente.nomeExibicao;
  try {
    nomeCompleto = descriptografar(atendimento.paciente.nomeCriptografado);
  } catch {}

  const procedenciaTexto = atendimento.origem?.descricao?.trim() || null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/triagem" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Triagem
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Realizar Triagem</span>
      </div>

      {/* Alertas de segurança clínica */}
      {atendimento.paciente.alergias.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 dark:bg-red-950/20">
          <p className="text-sm font-semibold text-red-700 mb-1">
            ⚠️ Alergias registradas:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {atendimento.paciente.alergias.map((a, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs"
              >
                {a.descricao}
                {a.gravidade && ` (${a.gravidade})`}
              </span>
            ))}
          </div>
        </div>
      )}

      {atendimento.paciente.medicamentosCont.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 dark:bg-blue-950/20">
          <p className="text-sm font-semibold text-blue-700 mb-2">
            💊 Medicamentos de uso contínuo:
          </p>
          <div className="space-y-1">
            {atendimento.paciente.medicamentosCont.map((m, i) => (
              <p key={i} className="text-xs text-blue-700">
                {m.nome} — {m.dose} — {m.frequencia}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Formulário principal */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <FormularioTriagem
          atendimentoId={atendimento.id}
          nomePaciente={nomeCompleto}
          numeroAtendimento={atendimento.numeroAtendimento}
          procedenciaTexto={procedenciaTexto}
          triagemInicial={
            atendimento.triagem
              ? {
                  corClassificacao: atendimento.triagem.corClassificacao,
                  queixaPrincipal: atendimento.triagem.queixaPrincipal,
                  categoriaQueixa: atendimento.triagem.categoriaQueixa ?? undefined,
                  tempoQueixa: atendimento.triagem.tempoQueixa ?? undefined,
                  doencasPreexistentes: atendimento.triagem.doencasPreexistentes ?? undefined,
                  medicacoes: atendimento.triagem.medicacoes ?? undefined,
                  alergias: atendimento.triagem.alergias ?? undefined,
                  acidenteTrabalho: atendimento.triagem.acidenteTrabalho ?? false,
                  regraDor: atendimento.triagem.regraDor ?? undefined,
                  tipoDorToracica: (atendimento.triagem.tipoDorToracica ?? '') as any,
                  irradiacao: (atendimento.triagem.irradiacao ?? '') as any,
                  duracaoDor: atendimento.triagem.duracaoDor ?? undefined,
                  localizacaoDor: atendimento.triagem.localizacaoDor ?? undefined,
                  irradiacaoDorSites: atendimento.triagem.irradiacaoDorSites
                    ? (atendimento.triagem.irradiacaoDorSites
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean) as any)
                    : [],
                  estadoConscienciaSinais: atendimento.triagem.estadoConscienciaSinais
                    ? [...parseEstadoConscienciaSinaisCsv(atendimento.triagem.estadoConscienciaSinais)]
                    : [],
                  fluxograma: atendimento.triagem.fluxograma ?? undefined,
                  discriminador: atendimento.triagem.discriminador ?? undefined,
                  especialidade: atendimento.triagem.especialidade ?? undefined,
                  sinaisVitais: atendimento.triagem.sinaisVitais
                    ? {
                        paSistolica: atendimento.triagem.sinaisVitais.paSistolica ?? undefined,
                        paDiastolica: atendimento.triagem.sinaisVitais.paDiastolica ?? undefined,
                        frequenciaCardiaca:
                          atendimento.triagem.sinaisVitais.frequenciaCardiaca ?? undefined,
                        frequenciaResp: atendimento.triagem.sinaisVitais.frequenciaResp ?? undefined,
                        spo2: atendimento.triagem.sinaisVitais.spo2
                          ? Number(atendimento.triagem.sinaisVitais.spo2)
                          : undefined,
                        temperatura: atendimento.triagem.sinaisVitais.temperatura
                          ? Number(atendimento.triagem.sinaisVitais.temperatura)
                          : undefined,
                        glicemia: atendimento.triagem.sinaisVitais.glicemia ?? undefined,
                        escalaDor: atendimento.triagem.sinaisVitais.escalaDor ?? 0,
                        peso: atendimento.triagem.sinaisVitais.peso
                          ? Number(atendimento.triagem.sinaisVitais.peso)
                          : undefined,
                        altura: atendimento.triagem.sinaisVitais.altura ?? undefined,
                      }
                    : { escalaDor: 0 },
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
