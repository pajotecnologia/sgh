import { prisma } from '@/lib/prisma';
import { descriptografar } from '@/lib/encryption';
import { CID10_BASE } from '@/lib/cid10';

export interface PassagemHistoricoDTO {
  atendimentoId: string;
  numeroAtendimento: string;
  dataHoraEntrada: string;
  status: string;
  setor: string;
  leito?: string | null;
  medicoResponsavel?: string | null;
  medicoCrm?: string | null;
  triagem?: {
    prioridade: string;
    queixaPrincipal?: string | null;
    discriminador?: string | null;
    sinaisVitais?: {
      pressaoArterial?: string | null;
      frequenciaCardiaca?: number | null;
      temperatura?: number | string | null;
      spo2?: number | string | null;
      glicemia?: number | null;
      escalaDor?: number | null;
    } | null;
  } | null;
  anamnese?: {
    queixaPrincipal: string;
    hda?: string | null;
    antecedentesPessoais?: string | null;
  } | null;
  diagnosticos: Array<{
    id: string;
    codigoCid: string;
    descricaoCid: string;
  }>;
  prescricoes: Array<{
    id: string;
    criadoEm: string;
    itens: Array<{
      id: string;
      medicamento: string;
      dose: string;
      via: string;
      frequencia: string;
      status?: string;
    }>;
  }>;
  aplicacoesMedicamentos: Array<{
    id: string;
    medicamento: string;
    aplicadoEm: string;
    dose: string;
    via: string;
  }>;
  exames: Array<{
    id: string;
    categoria: string;
    itens: Array<{
      id: string;
      nomeExame: string;
      urgente: boolean;
      resultado?: string | null;
      resultadoPdf?: string | null;
    }>;
  }>;
  evolucoes: Array<{
    id: string;
    criadoEm: string;
    texto: string;
  }>;
  encaminhamentos: Array<{
    id: string;
    especialidade: string;
    motivo: string;
  }>;
  alta?: {
    dataAlta?: string | null;
    motivoAlta?: string | null;
    conduta?: string | null;
  } | null;
}

export interface HistoricoLongitudinalPacienteDTO {
  paciente: {
    id: string;
    nome: string;
    cpf: string;
    dataNascimento: string;
    idadeAnos: number;
    sexoBiologico: string;
    tipoSanguineo: string;
    alergias: Array<{ id: string; descricao: string; gravidade?: string | null }>;
    medicamentosContinuos: Array<{ id: string; nome: string; dose: string; frequencia: string }>;
  };
  totalAtendimentos: number;
  primeiroAtendimento?: string | null;
  ultimoAtendimento?: string | null;
  diagnosticosRecorrentes: Array<{ codigoCid: string; descricao: string; ocorrencias: number }>;
  passagens: PassagemHistoricoDTO[];
}

function calcularIdade(dataNasc: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNasc.getFullYear();
  const m = hoje.getMonth() - dataNasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) {
    idade--;
  }
  return Math.max(0, idade);
}

function buscarDescricaoCid(codigo: string): string {
  const item = CID10_BASE.find(
    (c) => c.codigo.toLowerCase().trim() === codigo.toLowerCase().trim()
  );
  return item?.descricao || 'Descrição CID-10 não listada';
}

/**
 * Carrega a linha do tempo clínica longitudinal completa do paciente
 */
export async function carregarHistoricoLongitudinal(
  pacienteId: string
): Promise<HistoricoLongitudinalPacienteDTO | null> {
  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, deletedAt: null },
    include: {
      alergias: true,
      medicamentosCont: true,
      atendimentos: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          medico: { select: { nome: true, crm: true } },
          leito: { select: { codigo: true, ala: true, tipo: true } },
          triagem: {
            include: { sinaisVitais: true },
          },
          prontuario: {
            include: {
              anamnese: true,
              diagnosticos: true,
              prescricoes: {
                include: {
                  itens: {
                    include: {
                      aplicacoes: true,
                    },
                  },
                },
                orderBy: { createdAt: 'desc' },
              },
              requisicoes: {
                include: { itens: true },
                orderBy: { createdAt: 'desc' },
              },
              evolucoes: {
                orderBy: { registradoEm: 'desc' },
              },
              encaminhamentos: true,
            },
          },
          fichaInternacaoAlta: true,
        },
      },
    },
  });

  if (!paciente) return null;

  // Descriptografa nome e CPF se necessário
  let nomeDec = paciente.nomeExibicao;
  let cpfDec = '***.***.***-**';

  try {
    if (paciente.nomeCriptografado) {
      nomeDec = descriptografar(paciente.nomeCriptografado);
    }
  } catch {
    nomeDec = paciente.nomeExibicao;
  }

  try {
    if (paciente.cpfCriptografado) {
      const rawCpf = descriptografar(paciente.cpfCriptografado);
      if (rawCpf && rawCpf.length === 11) {
        cpfDec = `${rawCpf.slice(0, 3)}.${rawCpf.slice(3, 6)}.${rawCpf.slice(6, 9)}-${rawCpf.slice(9)}`;
      }
    }
  } catch {
    cpfDec = '***.***.***-**';
  }

  const mapaCids: Record<string, { codigo: string; descricao: string; count: number }> = {};

  const passagens: PassagemHistoricoDTO[] = paciente.atendimentos.map((at) => {
    // Diagnósticos
    const diagnosticos = (at.prontuario?.diagnosticos || []).map((d) => {
      const desc = buscarDescricaoCid(d.codigoCid);
      if (!mapaCids[d.codigoCid]) {
        mapaCids[d.codigoCid] = { codigo: d.codigoCid, descricao: desc, count: 0 };
      }
      mapaCids[d.codigoCid].count++;
      return {
        id: d.id,
        codigoCid: d.codigoCid,
        descricaoCid: desc,
      };
    });

    // Prescrições
    const prescricoes = (at.prontuario?.prescricoes || []).map((p) => ({
      id: p.id,
      criadoEm: p.createdAt.toISOString(),
      itens: p.itens.map((i) => ({
        id: i.id,
        medicamento: i.nomeMedicamento,
        dose: i.dose,
        via: i.via,
        frequencia: i.frequencia,
        status: i.status,
      })),
    }));

    // Aplicações
    const aplicacoesMedicamentos = (at.prontuario?.prescricoes || []).flatMap((p) =>
      p.itens.flatMap((item) =>
        item.aplicacoes.map((app) => ({
          id: app.id,
          medicamento: item.nomeMedicamento || 'Medicamento',
          aplicadoEm: app.aplicadoEm.toISOString(),
          dose: item.dose || app.doseAplicada || '-',
          via: item.via || app.via || '-',
        }))
      )
    );

    // Exames
    const exames = (at.prontuario?.requisicoes || []).map((req) => ({
      id: req.id,
      categoria: req.categoria,
      itens: req.itens.map((item) => ({
        id: item.id,
        nomeExame: item.nomeExame,
        urgente: req.urgencia === 'URGENTE' || req.urgencia === 'EMERGENCIAL',
        resultado: item.resultado,
        resultadoPdf: item.resultadoPdf,
      })),
    }));

    // Evoluções
    const evolucoes = (at.prontuario?.evolucoes || []).map((evo) => ({
      id: evo.id,
      criadoEm: evo.registradoEm.toISOString(),
      texto: evo.conteudo,
    }));

    // Encaminhamentos
    const encaminhamentos = (at.prontuario?.encaminhamentos || []).map((enc) => ({
      id: enc.id,
      especialidade: enc.especialidade,
      motivo: enc.resumoClinico || enc.justificativa || '',
    }));

    const sv = at.triagem?.sinaisVitais;

    return {
      atendimentoId: at.id,
      numeroAtendimento: at.numeroAtendimento,
      dataHoraEntrada: at.createdAt.toISOString(),
      status: at.status,
      setor: at.setor || 'Geral',
      leito: at.leito ? `${at.leito.ala} - Leito ${at.leito.codigo} (${at.leito.tipo})` : null,
      medicoResponsavel: at.medico?.nome || null,
      medicoCrm: at.medico?.crm || null,
      triagem: at.triagem
        ? {
            prioridade: at.triagem.corClassificacao,
            queixaPrincipal: at.triagem.queixaPrincipal,
            discriminador: at.triagem.categoriaQueixa || at.triagem.queixaPrincipal,
            sinaisVitais: sv
              ? {
                  pressaoArterial: sv.paSistolica && sv.paDiastolica ? `${sv.paSistolica}x${sv.paDiastolica} mmHg` : null,
                  frequenciaCardiaca: sv.frequenciaCardiaca,
                  temperatura: sv.temperatura ? Number(sv.temperatura) : null,
                  spo2: sv.spo2 ? Number(sv.spo2) : null,
                  glicemia: sv.glicemia,
                  escalaDor: sv.escalaDor,
                }
              : null,
          }
        : null,
      anamnese: at.prontuario?.anamnese
        ? {
            queixaPrincipal: at.prontuario.anamnese.queixaPrincipal,
            hda: at.prontuario.anamnese.hda,
            antecedentesPessoais: at.prontuario.anamnese.antecedentesP,
          }
        : null,
      diagnosticos,
      prescricoes,
      aplicacoesMedicamentos,
      exames,
      evolucoes,
      encaminhamentos,
      alta: at.fichaInternacaoAlta
        ? {
            dataAlta: at.fichaInternacaoAlta.updatedAt?.toISOString() || null,
            motivoAlta: at.fichaInternacaoAlta.status,
            conduta: null,
          }
        : null,
    };
  });

  const diagnosticosRecorrentes = Object.values(mapaCids)
    .sort((a, b) => b.count - a.count)
    .map((d) => ({
      codigoCid: d.codigo,
      descricao: d.descricao,
      ocorrencias: d.count,
    }));

  return {
    paciente: {
      id: paciente.id,
      nome: nomeDec,
      cpf: cpfDec,
      dataNascimento: paciente.dataNascimento.toISOString(),
      idadeAnos: calcularIdade(paciente.dataNascimento),
      sexoBiologico: paciente.sexoBiologico,
      tipoSanguineo: paciente.tipoSanguineo,
      alergias: paciente.alergias.map((a) => ({
        id: a.id,
        descricao: a.descricao,
        gravidade: a.gravidade,
      })),
      medicamentosContinuos: paciente.medicamentosCont.map((m) => ({
        id: m.id,
        nome: m.nome,
        dose: m.dose,
        frequencia: m.frequencia,
      })),
    },
    totalAtendimentos: passagens.length,
    primeiroAtendimento: passagens.length > 0 ? passagens[passagens.length - 1].dataHoraEntrada : null,
    ultimoAtendimento: passagens.length > 0 ? passagens[0].dataHoraEntrada : null,
    diagnosticosRecorrentes,
    passagens,
  };
}
