// components/ficha/FichaAtendimentoImpressao.tsx
// Impressão da ficha de urgência — recepção (busca) e atendimento (payload já carregado).

import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { atendimentoIncludeFichaUrgencia } from '@/lib/montar-dados-ficha-atendimento';
import { montarPacienteFichaCabecalho, exameFisicoParaTexto } from '@/lib/ficha-urgencia';
import {
  FichaUrgenciaDocumento,
  type MedicoFichaDados,
  type TriagemFichaDados,
} from '@/components/ficha/FichaUrgenciaDocumento';

export type AtendimentoFichaPayload = Prisma.AtendimentoGetPayload<{
  include: typeof atendimentoIncludeFichaUrgencia;
}>;

type InstituicaoRow = Prisma.InstituicaoGetPayload<object> | null;

type OrigemComProcedencia = {
  descricao: string;
  procedenciaFicha?: string | null;
};

function montarTriagemFicha(atendimento: AtendimentoFichaPayload): TriagemFichaDados | null {
  const t = atendimento.triagem;
  if (!t) return null;

  const extra = t as typeof t & {
    duracaoDor?: string | null;
    localizacaoDor?: string | null;
    irradiacaoDorSites?: string | null;
    estadoConscienciaSinais?: string | null;
  };

  const sv = t.sinaisVitais;
  return {
    corClassificacao: t.corClassificacao,
    queixaPrincipal: t.queixaPrincipal,
    doencasPreexistentes: t.doencasPreexistentes,
    medicacoes: t.medicacoes,
    alergias: t.alergias,
    acidenteTrabalho: t.acidenteTrabalho,
    sinaisVitais: sv
      ? {
          paSistolica: sv.paSistolica,
          paDiastolica: sv.paDiastolica,
          frequenciaCardiaca: sv.frequenciaCardiaca,
          frequenciaResp: sv.frequenciaResp,
          temperatura: sv.temperatura,
          spo2: sv.spo2,
          glicemia: sv.glicemia,
          peso: sv.peso,
        }
      : null,
    nivelConsciencia: t.nivelConsciencia,
    regraDor: t.regraDor,
    tipoDorToracica: t.tipoDorToracica,
    fluxograma: t.fluxograma,
    discriminador: t.discriminador,
    irradiacao: t.irradiacao,
    tempoQueixa: t.tempoQueixa,
    ritmo: t.ritmo,
    duracaoDor: extra.duracaoDor ?? null,
    localizacaoDor: extra.localizacaoDor ?? null,
    irradiacaoDorSites: extra.irradiacaoDorSites ?? null,
    estadoConscienciaSinais: extra.estadoConscienciaSinais ?? null,
  };
}

function montarMedicoFicha(atendimento: AtendimentoFichaPayload): MedicoFichaDados | null {
  const prontuario = atendimento.prontuario;
  if (!prontuario) return null;

  const anamnese = prontuario.anamnese;
  const hda = anamnese?.hda?.trim() ?? '';
  const exameClinico = exameFisicoParaTexto(anamnese?.exameFisico);
  const hipoteses = (prontuario.diagnosticos ?? [])
    .map((d) =>
      [d.codigoCid, d.descricaoCid, d.hipotese?.trim()].filter(Boolean).join(' — ')
    )
    .filter(Boolean)
    .join('\n');

  const prescs = [...(prontuario.prescricoes ?? [])].sort(
    (a, b) =>
      new Date(a.emitidaEm ?? a.createdAt).getTime() -
      new Date(b.emitidaEm ?? b.createdAt).getTime()
  );

  const linhas: { conduta: string; horario: string }[] = [];
  for (const presc of prescs) {
    const horario = presc.emitidaEm
      ? format(new Date(presc.emitidaEm), 'dd/MM/yyyy HH:mm')
      : '';
    for (const item of presc.itens ?? []) {
      const partes = [
        item.nomeMedicamento,
        item.dose,
        item.via,
        item.frequencia,
        item.observacoes ? `Obs.: ${item.observacoes}` : '',
      ].filter(Boolean);
      linhas.push({
        conduta: partes.join(' · '),
        horario,
      });
    }
  }
  while (linhas.length < 12) linhas.push({ conduta: '', horario: '' });

  return {
    hda,
    exameClinico,
    hipoteses,
    prescricoes: linhas.slice(0, 12),
    medicoNome: atendimento.medico?.nome ?? null,
  };
}

function montarProcedencia(atendimento: AtendimentoFichaPayload) {
  const o = atendimento.origem as OrigemComProcedencia | null;
  if (!o) return null;
  const mapa = o.procedenciaFicha as
    | 'RESIDENCIA'
    | 'VIA_PUBLICA'
    | 'TRABALHO'
    | 'UNIDADE_SAUDE'
    | null
    | undefined;
  return {
    descricao: o.descricao,
    mapaFicha: mapa ?? null,
  };
}

function FichaAtendimentoView({
  atendimento,
  instituicao,
}: {
  atendimento: AtendimentoFichaPayload;
  instituicao: InstituicaoRow;
}) {
  const paciente = montarPacienteFichaCabecalho(atendimento.paciente);
  const triagem = montarTriagemFicha(atendimento);
  const medico = montarMedicoFicha(atendimento);
  const procedencia = montarProcedencia(atendimento);

  return (
    <FichaUrgenciaDocumento
      instituicao={instituicao}
      numeroAtendimento={atendimento.numeroAtendimento}
      dataAberturaFmt={format(new Date(atendimento.createdAt), 'dd/MM/yyyy HH:mm')}
      paciente={paciente}
      triagem={triagem}
      medico={medico}
      procedencia={procedencia}
    />
  );
}

/** Busca atendimento por número ou UUID e renderiza a ficha (recepção). */
export async function FichaAtendimentoImpressao({
  buscaPor,
  valor,
}: {
  buscaPor: 'numeroAtendimento' | 'id';
  valor: string;
}) {
  const atendimento = await prisma.atendimento.findFirst({
    where:
      buscaPor === 'numeroAtendimento'
        ? { numeroAtendimento: valor, deletedAt: null }
        : { id: valor, deletedAt: null },
    include: atendimentoIncludeFichaUrgencia,
  });

  if (!atendimento) notFound();

  const instituicao = await prisma.instituicao.findFirst();
  return <FichaAtendimentoView atendimento={atendimento} instituicao={instituicao} />;
}

/** Renderiza a ficha quando o atendimento já foi carregado no servidor (ex.: área médica). */
export async function FichaAtendimentoImpressaoFromPayload({
  atendimento,
}: {
  atendimento: AtendimentoFichaPayload;
}) {
  const instituicao = await prisma.instituicao.findFirst();
  return <FichaAtendimentoView atendimento={atendimento} instituicao={instituicao} />;
}
