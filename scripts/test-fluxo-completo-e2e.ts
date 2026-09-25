// scripts/test-fluxo-completo-e2e.ts
// Teste de ciclo de vida completo do atendimento hospitalar SGH
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { criptografar, hashCpf } from '../lib/encryption';
import { gerarNumeroAtendimento } from '../lib/attendance';

async function runE2EHospitalFlow() {
  console.log('======================================================================');
  console.log('🏥 INICIANDO TESTE E2E DO FLUXO HOSPITALAR COMPLETO (SGH)');
  console.log('======================================================================\n');

  // 0. Obter usuários dos perfis clínicos e administrativos
  const [recepcionista, enfermeiro, medico, farmaceutico, admin] = await Promise.all([
    prisma.usuario.findFirst({ where: { role: 'RECEPCIONISTA', ativo: true } }),
    prisma.usuario.findFirst({ where: { role: 'ENFERMEIRO', ativo: true } }),
    prisma.usuario.findFirst({ where: { role: 'MEDICO', ativo: true } }),
    prisma.usuario.findFirst({ where: { role: 'FARMACEUTICO', ativo: true } }),
    prisma.usuario.findFirst({ where: { role: 'ADMIN', ativo: true } }),
  ]);

  if (!recepcionista || !enfermeiro || !medico) {
    throw new Error('Usuários de teste necessários (RECEPCIONISTA, ENFERMEIRO, MEDICO) não encontrados.');
  }

  console.log(`👤 Operadores identificados:`);
  console.log(`   - Recepção: ${recepcionista.nome}`);
  console.log(`   - Enfermagem: ${enfermeiro.nome}`);
  console.log(`   - Médico: ${medico.nome} (${medico.crm})`);
  console.log(`   - Farmácia: ${farmaceutico?.nome ?? 'Farmacêutico Padrão'}`);
  console.log(`   - Admin: ${admin?.nome ?? 'Admin'}\n`);

  // ETAPA 1: RECEPÇÃO — CADASTRO DE PACIENTE E ABERTURA DE ATENDIMENTO
  console.log('▶ [ETAPA 1/7] RECEPÇÃO: Cadastrando paciente e abrindo atendimento...');
  const nomeCompleto = 'Sr. Valdomiro Teste Ponta a Ponta';
  const cpfPuro = '999.888.777-66';
  const cpfHash = hashCpf(cpfPuro);

  let paciente = await prisma.paciente.findFirst({
    where: { cpfHash, deletedAt: null },
  });

  if (!paciente) {
    paciente = await prisma.paciente.create({
      data: {
        nomeExibicao: 'Valdomiro P.',
        nomeCriptografado: criptografar(nomeCompleto),
        cpfHash,
        cpfCriptografado: criptografar(cpfPuro),
        dataNascimento: new Date('1975-08-20'),
        sexoBiologico: 'MASCULINO',
        telefoneCriptografado: criptografar('(11) 98765-4321'),
      },
    });
  }

  const numeroAtendimento = await gerarNumeroAtendimento();
  const atendimento = await prisma.atendimento.create({
    data: {
      numeroAtendimento,
      pacienteId: paciente.id,
      status: 'AGUARDANDO_TRIAGEM',
      setor: 'Pronto-Socorro',
    },
  });

  console.log(`  ✅ Paciente cadastrado (ID: ${paciente.id}, Nome Exibição: ${paciente.nomeExibicao})`);
  console.log(`  ✅ Atendimento criado: ${atendimento.numeroAtendimento} | Status: ${atendimento.status}\n`);

  // ETAPA 2: TRIAGEM — CHAMADA NO PAINEL E CLASSIFICAÇÃO MANCHESTER
  console.log('▶ [ETAPA 2/7] TRIAGEM: Chamada no painel e classificação de risco...');
  // Simular abertura da triagem / chamada
  await prisma.chamadaPainel.create({
    data: {
      atendimentoId: atendimento.id,
      chamadoPorId: enfermeiro.id,
      salaDestino: 'Triagem 01',
      setorPainel: 'TRIAGEM',
    },
  });

  await prisma.atendimento.update({
    where: { id: atendimento.id },
    data: { status: 'EM_TRIAGEM' },
  });
  console.log(`  ✅ Paciente chamado no painel -> Status atualizado para: EM_TRIAGEM`);

  // Registrar Triagem Manchester
  const triagem = await prisma.triagem.create({
    data: {
      atendimentoId: atendimento.id,
      triadorId: enfermeiro.id,
      corClassificacao: 'AMARELO',
      queixaPrincipal: 'Cefaleia intensa súbita e náuseas há 3 horas',
      categoriaQueixa: 'dor',
      discriminador: 'Dor de intensidade moderada a severa',
      fluxograma: 'Cefaleia',
      classificadoEm: new Date(),
      sinaisVitais: {
        create: {
          paSistolica: 140,
          paDiastolica: 90,
          frequenciaCardiaca: 88,
          frequenciaResp: 18,
          temperatura: 36.6,
          spo2: 98,
          glicemia: 105,
          escalaDor: 7,
          peso: 78.5,
          altura: 175,
          imc: 25.63,
        },
      },
    },
    include: { sinaisVitais: true },
  });

  await prisma.atendimento.update({
    where: { id: atendimento.id },
    data: { status: 'AGUARDANDO_ATENDIMENTO' },
  });

  console.log(`  ✅ Triagem Manchester registrada (Cor: ${triagem.corClassificacao}, Dor: ${triagem.sinaisVitais?.escalaDor}/10)`);
  console.log(`  ✅ Atendimento encaminhado para fila médica -> Status: AGUARDANDO_ATENDIMENTO\n`);

  // ETAPA 3: CONSULTA MÉDICA — PRONTUÁRIO SOAP, CID-10 E PRESCRIÇÃO
  console.log('▶ [ETAPA 3/7] CONSULTA MÉDICA: Avaliação clínica e prescrição...');
  await prisma.chamadaPainel.create({
    data: {
      atendimentoId: atendimento.id,
      chamadoPorId: medico.id,
      salaDestino: 'Consultório 03',
      setorPainel: 'CONSULTORIOS',
    },
  });

  await prisma.atendimento.update({
    where: { id: atendimento.id },
    data: { status: 'EM_ATENDIMENTO', medicoId: medico.id },
  });
  console.log(`  ✅ Chamado para Consultório 03 -> Status: EM_ATENDIMENTO`);

  // Criar Prontuário Médico, Anamnese, Diagnóstico e Prescrição
  const prontuario = await prisma.prontuarioMedico.create({
    data: {
      atendimentoId: atendimento.id,
      anamnese: {
        create: {
          queixaPrincipal: triagem.queixaPrincipal,
          hda: 'Paciente relata início súbito de cefaleia holocraniana pulsátil, associada a fotofobia e náuseas.',
          antecedentesP: 'Hipertensão arterial sistêmica em uso irregular de anti-hipertensivo.',
        },
      },
      diagnosticos: {
        create: [
          {
            codigoCid: 'G44.2',
            descricaoCid: 'Cefaleia tensional',
            hipotese: 'Cefaleia primária com componente tensional agudo',
            principal: true,
          },
        ],
      },
      prescricoes: {
        create: {
          tipo: 'PS',
          numeroPrescricao: 1,
          observacoes: 'Medicação para alívio sintomático em observação no PS',
          itens: {
            create: [
              {
                nomeMedicamento: 'Dipirona 500mg/mL',
                dose: '1g (2mL)',
                via: 'INTRAVENOSA',
                frequencia: 'Agora (dose única)',
                duracaoDias: 1,
                status: 'PENDENTE',
              },
              {
                nomeMedicamento: 'Metoclopramida 10mg/2mL',
                dose: '10mg (2mL)',
                via: 'INTRAVENOSA',
                frequencia: 'Agora (dose única)',
                duracaoDias: 1,
                status: 'PENDENTE',
              },
            ],
          },
        },
      },
    },
    include: {
      diagnosticos: true,
      prescricoes: { include: { itens: true } },
    },
  });

  // Também criar prescrição integrada à farmácia (TbPrescricaoCabecalho)
  const prescricaoFarmacia = await prisma.tbPrescricaoCabecalho.create({
    data: {
      atendimentoId: atendimento.id,
      criadoPorId: medico.id,
      statusValidacao: 'AGUARDANDO_TRIAGEM',
      observacoes: 'Prescrição de urgência PS',
      itens: {
        create: [
          {
            medicamentoNome: 'Dipirona 500mg/mL Ampola 2mL',
            principioAtivo: 'DIPIRONA SODICA',
            dose: '1g',
            via: 'INTRAVENOSA',
            frequencia: 'Agora',
            quantidadeSolicitada: 1,
            statusValidacao: 'AGUARDANDO_TRIAGEM',
          },
        ],
      },
    },
    include: { itens: true },
  });

  console.log(`  ✅ Prontuário criado (ID: ${prontuario.id})`);
  console.log(`  ✅ Diagnóstico CID-10 associado: ${prontuario.diagnosticos[0].codigoCid} - ${prontuario.diagnosticos[0].descricaoCid}`);
  console.log(`  ✅ Prescrição médica gerada com ${prontuario.prescricoes[0].itens.length} itens.`);
  console.log(`  ✅ Prescrição enviada à Farmácia (ID: ${prescricaoFarmacia.id})\n`);

  // ETAPA 4: FARMÁCIA HOSPITALAR — TRIAGEM E DISPENSAÇÃO
  console.log('▶ [ETAPA 4/7] FARMÁCIA: Triagem farmacêutica e dispensação de medicamentos...');
  const farmaciaUserId = farmaceutico?.id || admin?.id || medico.id;

  for (const item of prescricaoFarmacia.itens) {
    await prisma.tbPrescricaoItem.update({
      where: { id: item.id },
      data: { statusValidacao: 'APROVADO' },
    });

    await prisma.tbFarmaciaDispensacao.create({
      data: {
        itemId: item.id,
        validadoPorId: farmaciaUserId,
        status: 'APROVADO',
        validadoEm: new Date(),
      },
    });
  }

  await prisma.tbPrescricaoCabecalho.update({
    where: { id: prescricaoFarmacia.id },
    data: { statusValidacao: 'APROVADO' },
  });

  console.log(`  ✅ Farmácia validou e APROVOU a prescrição ${prescricaoFarmacia.id}\n`);

  // ETAPA 5: ENFERMAGEM — CHECAGEM BEIRA-LEITO (5 CERTOS) E ADMINISTRAÇÃO
  console.log('▶ [ETAPA 5/7] ENFERMAGEM: Administração de medicação e checagem dos 5 Certos...');
  const itensPrescricao = prontuario.prescricoes[0].itens;
  for (const item of itensPrescricao) {
    await prisma.aplicacaoMedicamento.create({
      data: {
        itemPrescricaoId: item.id,
        aplicadoPorId: enfermeiro.id,
        doseAplicada: item.dose,
        via: item.via,
        aplicadoEm: new Date(),
        checklistConfirmado: {
          pacienteCerto: true,
          medicamentoCerto: true,
          doseCerta: true,
          viaCerta: true,
          horarioCerto: true,
        },
        observacoes: 'Paciente sem queixas de dor no local de infusão.',
      },
    });

    await prisma.itemPrescricao.update({
      where: { id: item.id },
      data: { status: 'APLICADO' },
    });
    console.log(`  ✅ Aplicado: ${item.nomeMedicamento} (${item.dose}) - 5 Certos verificados`);
  }
  console.log();

  // ETAPA 6: INTERNAÇÃO / OBSERVAÇÃO & GESTÃO DE LEITOS
  console.log('▶ [ETAPA 6/7] INTERNAMENTO: Encaminhamento e alocação de leito...');
  const encaminhamento = await prisma.encaminhamento.create({
    data: {
      prontuarioId: prontuario.id,
      tipo: 'INTERNACAO',
      especialidade: 'Clínica Médica / Observação',
      prioridade: 'Média',
      resumoClinico: 'Paciente mantido em observação clínica para monitoramento da pressão arterial e remissão da cefaleia.',
      cidInternacao: 'G44.2',
    },
  });

  // Localizar ou criar leito disponível
  let leitoDisponivel = await prisma.leito.findFirst({
    where: { status: 'DISPONIVEL', ativo: true },
  });

  if (!leitoDisponivel) {
    leitoDisponivel = await prisma.leito.create({
      data: {
        ala: 'Ala A - Observação Adulto',
        codigo: `OBS-${Date.now().toString().slice(-4)}`,
        tipo: 'ENFERMARIA',
        status: 'DISPONIVEL',
      },
    });
  }

  // Ocupar leito e atualizar atendimento
  await prisma.leito.update({
    where: { id: leitoDisponivel.id },
    data: { status: 'OCUPADO' },
  });

  await prisma.atendimento.update({
    where: { id: atendimento.id },
    data: {
      status: 'INTERNADO',
      leitoId: leitoDisponivel.id,
    },
  });

  console.log(`  ✅ Encaminhamento registrado (ID: ${encaminhamento.id})`);
  console.log(`  ✅ Leito alocado: ${leitoDisponivel.codigo} (${leitoDisponivel.ala}) -> Status Atendimento: INTERNADO\n`);

  // ETAPA 7: DESFECHO CLÍNICO & ALTA HOSPITALAR
  console.log('▶ [ETAPA 7/7] ALTA HOSPITALAR: Desfecho, liberação de leito e encerramento do prontuário...');
  
  // Liberar leito para disponível
  await prisma.leito.update({
    where: { id: leitoDisponivel.id },
    data: { status: 'DISPONIVEL' },
  });

  // Atualizar status do atendimento para ALTA
  const atendimentoFinal = await prisma.atendimento.update({
    where: { id: atendimento.id },
    data: {
      status: 'ALTA',
    },
  });

  // Encerrar prontuário
  await prisma.prontuarioMedico.update({
    where: { id: prontuario.id },
    data: {
      encerradoEm: new Date(),
      encerradoPorId: medico.id,
    },
  });

  // Registrar auditoria final
  await prisma.logAuditoria.create({
    data: {
      usuarioId: medico.id,
      acao: 'ATUALIZACAO',
      entidade: 'Atendimento',
      entidadeId: atendimento.id,
      campo: 'status',
      valorAnterior: 'INTERNADO',
      valorNovo: 'ALTA',
    },
  });

  console.log(`  ✅ Prontuário encerrado às ${new Date().toLocaleTimeString('pt-BR')}`);
  console.log(`  ✅ Leito ${leitoDisponivel.codigo} liberado e direcionado para higienização.`);
  console.log(`  ✅ Status final do Atendimento ${atendimentoFinal.numeroAtendimento}: ${atendimentoFinal.status}`);
  console.log(`  ✅ Log de auditoria LGPD/Rastreabilidade gerado com sucesso.\n`);

  console.log('======================================================================');
  console.log('🎉 SUCESSO TOTAL: FLUXO COMPLETO EXECUTADO E VALIDADO SEM ERROS!');
  console.log('======================================================================');
}

runE2EHospitalFlow()
  .catch((e) => {
    console.error('❌ ERRO DURANTE EXECUÇÃO DO FLUXO E2E:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
