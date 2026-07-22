-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoLeitoHospitalar" AS ENUM ('UTI', 'ENFERMARIA', 'ISOLAMENTO', 'OBSERVACAO');

-- CreateEnum
CREATE TYPE "StatusLeitoHospitalar" AS ENUM ('DISPONIVEL', 'OCUPADO', 'INTERDITADO');

-- CreateEnum
CREATE TYPE "TipoPrescricao" AS ENUM ('PS', 'RECEITA_ALTA');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEDICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA', 'DIRETOR_CLINICO', 'FARMACEUTICO');

-- CreateEnum
CREATE TYPE "TipoMovimentacaoFarmacia" AS ENUM ('ENTRADA_NF', 'ENTRADA_MANUAL', 'SAIDA_DISPENSACAO', 'SAIDA_MANUAL', 'AJUSTE');

-- CreateEnum
CREATE TYPE "TipoSaidaFarmacia" AS ENUM ('DISPENSACAO_PRESCRICAO', 'BAIXA_MANUAL');

-- CreateEnum
CREATE TYPE "RiscoInteracao" AS ENUM ('LEVE', 'MODERADO', 'CRITICO');

-- CreateEnum
CREATE TYPE "StatusValidacaoFarmacia" AS ENUM ('AGUARDANDO_TRIAGEM', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "CorTriagem" AS ENUM ('VERMELHO', 'LARANJA', 'AMARELO', 'VERDE', 'AZUL', 'CINZA');

-- CreateEnum
CREATE TYPE "StatusAtendimento" AS ENUM ('AGUARDANDO_TRIAGEM', 'EM_TRIAGEM', 'AGUARDANDO_ATENDIMENTO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'AGUARDANDO_INTERNACAO', 'INTERNADO', 'TRANSFERIDO', 'ALTA', 'OBITO');

-- CreateEnum
CREATE TYPE "TipoSanguineo" AS ENUM ('A_POSITIVO', 'A_NEGATIVO', 'B_POSITIVO', 'B_NEGATIVO', 'AB_POSITIVO', 'AB_NEGATIVO', 'O_POSITIVO', 'O_NEGATIVO', 'DESCONHECIDO');

-- CreateEnum
CREATE TYPE "SexoBiologico" AS ENUM ('MASCULINO', 'FEMININO', 'INTERSEXO');

-- CreateEnum
CREATE TYPE "ViaAdministracao" AS ENUM ('ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA', 'TOPICA', 'INALATORIA', 'SUBLINGUAL', 'RETAL', 'OFTALMICA', 'OTOLOGICA', 'NASAL');

-- CreateEnum
CREATE TYPE "StatusPrescricaoItem" AS ENUM ('PENDENTE', 'APLICADO', 'RECUSADO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "UrgenciaExame" AS ENUM ('ROTINA', 'URGENTE', 'EMERGENCIAL');

-- CreateEnum
CREATE TYPE "CategoriaExame" AS ENUM ('LABORATORIO', 'IMAGEM', 'CARDIOLOGIA', 'PROCEDIMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoEncaminhamento" AS ENUM ('EXTERNO', 'INTERNACAO');

-- CreateEnum
CREATE TYPE "StatusLaudoInternacao" AS ENUM ('RASCUNHO', 'SOLICITADO', 'AUTORIZADO');

-- CreateEnum
CREATE TYPE "StatusFichaInternacaoAlta" AS ENUM ('RASCUNHO', 'EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "StatusFichaCcih" AS ENUM ('RASCUNHO', 'NOTIFICADO', 'EM_ANALISE', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "TipoInfeccaoCcih" AS ENUM ('ITU', 'PNEUMONIA_VENTILACAO', 'ISC', 'ICS', 'BACTERIEMIA_PRIMARIA', 'MENINGITE', 'INFECCAO_CATETER', 'OUTRA');

-- CreateEnum
CREATE TYPE "StatusFichaMultidisciplinar" AS ENUM ('RASCUNHO', 'EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "TurnoEvolucaoInternacao" AS ENUM ('DIURNA', 'NOTURNA');

-- CreateEnum
CREATE TYPE "StatusFichaEvolucaoTurno" AS ENUM ('RASCUNHO', 'REGISTRADA');

-- CreateEnum
CREATE TYPE "TipoAcaoAuditoria" AS ENUM ('CRIACAO', 'ATUALIZACAO', 'EXCLUSAO', 'VISUALIZACAO', 'LOGIN', 'LOGOUT', 'CHAMADA_PAINEL');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "crm" TEXT,
    "coren" TEXT,
    "cpf" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "mfaSecret" TEXT,
    "mfaAtivo" BOOLEAN NOT NULL DEFAULT false,
    "ultimoAcesso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_redefinicao_senha" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_redefinicao_senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "cpfCriptografado" TEXT NOT NULL,
    "cpfHash" TEXT NOT NULL,
    "nomeCriptografado" TEXT NOT NULL,
    "nomeExibicao" TEXT NOT NULL,
    "rgCriptografado" TEXT,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "sexoBiologico" "SexoBiologico" NOT NULL,
    "genero" TEXT,
    "telefoneCriptografado" TEXT,
    "tipoSanguineo" "TipoSanguineo" NOT NULL DEFAULT 'DESCONHECIDO',
    "convenio" TEXT,
    "numeroCarteirinha" TEXT,
    "observacoesIniciais" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "acompanhanteNome" TEXT,
    "acompanhanteTelefone" TEXT,
    "cns" TEXT,
    "escolaridade" TEXT,
    "naturalidade" TEXT,
    "nomeMae" TEXT,
    "profissao" TEXT,
    "racaCor" TEXT,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alergias" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "gravidade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alergias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicamentos_continuos" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "frequencia" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicamentos_continuos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_pacientes" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimentos" (
    "id" TEXT NOT NULL,
    "numeroAtendimento" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT,
    "status" "StatusAtendimento" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    "setor" TEXT,
    "sala" TEXT,
    "leitoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "origemId" TEXT,
    "obstetrico" BOOLEAN NOT NULL DEFAULT false,
    "vaiInternar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "atendimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinicas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leitos" (
    "id" TEXT NOT NULL,
    "clinica" TEXT,
    "clinicaId" TEXT,
    "ala" TEXT NOT NULL,
    "quarto" TEXT,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoLeitoHospitalar" NOT NULL DEFAULT 'ENFERMARIA',
    "status" "StatusLeitoHospitalar" NOT NULL DEFAULT 'DISPONIVEL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescricoes_medicas_padrao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "observacoesPadrao" TEXT,
    "nomeColunaEsquerda" TEXT NOT NULL DEFAULT 'Prescrição médica',
    "nomeColunaDireita" TEXT NOT NULL DEFAULT 'Prescrição de medicamentos / enfermagem',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescricoes_medicas_padrao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_prescricao_medica_padrao" (
    "id" TEXT NOT NULL,
    "prescricaoMedicaPadraoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "tipoItem" TEXT NOT NULL DEFAULT 'LINHA_DUPLA',
    "nomeMedicamento" TEXT NOT NULL,
    "principioAtivo" TEXT,
    "dose" TEXT NOT NULL,
    "unidadeMedida" TEXT,
    "via" TEXT NOT NULL,
    "frequencia" TEXT NOT NULL,
    "quantidadeSolicitada" INTEGER NOT NULL DEFAULT 1,
    "duracaoDias" INTEGER,
    "observacoes" TEXT,

    CONSTRAINT "itens_prescricao_medica_padrao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triagens" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "triadorId" TEXT NOT NULL,
    "corClassificacao" "CorTriagem" NOT NULL,
    "queixaPrincipal" TEXT NOT NULL,
    "categoriaQueixa" TEXT,
    "entradaTriagem" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classificadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acidenteTrabalho" BOOLEAN NOT NULL DEFAULT false,
    "alergias" TEXT,
    "discriminador" TEXT,
    "doencasPreexistentes" TEXT,
    "especialidade" TEXT,
    "fluxograma" TEXT,
    "irradiacao" TEXT,
    "medicacoes" TEXT,
    "nivelConsciencia" TEXT,
    "regraDor" TEXT,
    "ritmo" TEXT,
    "tempoQueixa" TEXT,
    "tipoDorToracica" TEXT,
    "duracaoDor" TEXT,
    "localizacaoDor" TEXT,
    "irradiacaoDorSites" TEXT,
    "estadoConscienciaSinais" TEXT,

    CONSTRAINT "triagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sinais_vitais" (
    "id" TEXT NOT NULL,
    "triagemId" TEXT NOT NULL,
    "paSistolica" INTEGER,
    "paDiastolica" INTEGER,
    "frequenciaCardiaca" INTEGER,
    "frequenciaResp" INTEGER,
    "spo2" DECIMAL(5,2),
    "temperatura" DECIMAL(4,1),
    "glicemia" INTEGER,
    "escalaDor" INTEGER,
    "peso" DECIMAL(5,2),
    "altura" INTEGER,
    "imc" DECIMAL(4,2),
    "coletadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sinais_vitais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamadas_painel" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "chamadoPorId" TEXT NOT NULL,
    "salaDestino" TEXT NOT NULL,
    "setorPainel" TEXT NOT NULL DEFAULT 'GERAL',
    "chamadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chamadas_painel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prontuarios_medicos" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "encerradoEm" TIMESTAMP(3),
    "encerradoPorId" TEXT,

    CONSTRAINT "prontuarios_medicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamneses" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "queixaPrincipal" TEXT NOT NULL,
    "hda" TEXT,
    "antecedentesP" TEXT,
    "antecedentesF" TEXT,
    "antecedentesC" TEXT,
    "habitosVida" JSONB,
    "revisaoSistemas" JSONB,
    "exameFisico" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anamneses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "codigoCid" TEXT NOT NULL,
    "descricaoCid" TEXT NOT NULL,
    "hipotese" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnosticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescricoes" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "tipo" "TipoPrescricao" NOT NULL DEFAULT 'PS',
    "numeroPrescricao" INTEGER NOT NULL DEFAULT 1,
    "emitidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validaAte" TIMESTAMP(3),
    "observacoes" TEXT,
    "pdfCaminho" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_prescricao" (
    "id" TEXT NOT NULL,
    "prescricaoId" TEXT NOT NULL,
    "nomeMedicamento" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "unidadeMedida" TEXT,
    "via" "ViaAdministracao" NOT NULL,
    "frequencia" TEXT NOT NULL,
    "duracaoDias" INTEGER,
    "observacoes" TEXT,
    "status" "StatusPrescricaoItem" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_prescricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aplicacoes_medicamentos" (
    "id" TEXT NOT NULL,
    "itemPrescricaoId" TEXT NOT NULL,
    "aplicadoPorId" TEXT NOT NULL,
    "doseAplicada" TEXT NOT NULL,
    "via" "ViaAdministracao" NOT NULL,
    "aplicadoEm" TIMESTAMP(3) NOT NULL,
    "checklistConfirmado" JSONB NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aplicacoes_medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisicoes_exames" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "categoria" "CategoriaExame" NOT NULL,
    "urgencia" "UrgenciaExame" NOT NULL DEFAULT 'ROTINA',
    "indicacao" TEXT NOT NULL,
    "pdfCaminho" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisicoes_exames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_requisicao" (
    "id" TEXT NOT NULL,
    "requisicaoId" TEXT NOT NULL,
    "nomeExame" TEXT NOT NULL,
    "codigoTuss" TEXT,
    "observacoes" TEXT,
    "resultado" TEXT,
    "resultadoPdf" TEXT,
    "realizadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_requisicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolucoes_medicas" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "template" TEXT,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evolucoes_medicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laudos_internacao" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "status" "StatusLaudoInternacao" NOT NULL DEFAULT 'RASCUNHO',
    "nomeEstabelecimentoSolicitante" TEXT,
    "cnesSolicitante" TEXT,
    "nomeEstabelecimentoExecutante" TEXT,
    "cnesExecutante" TEXT,
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "cns" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "sexoCodigo" TEXT,
    "nomeMae" TEXT,
    "telefoneDdd" TEXT,
    "telefoneNumero" TEXT,
    "enderecoCompleto" TEXT,
    "municipioResidencia" TEXT,
    "codigoIbgeMunicipio" TEXT,
    "uf" CHAR(2),
    "cep" TEXT,
    "sinaisSintomas" TEXT,
    "condicoesJustificativa" TEXT,
    "resultadosDiagnosticos" TEXT,
    "diagnosticoInicial" TEXT,
    "cidPrincipal" TEXT,
    "cidSecundario" TEXT,
    "cidAssociadas" TEXT,
    "descricaoProcedimento" TEXT,
    "codigoProcedimento" TEXT,
    "clinica" TEXT,
    "caraterInternacao" TEXT,
    "documentoProfissionalTipo" TEXT,
    "documentoProfissionalNumero" TEXT,
    "nomeProfissionalSolicitante" TEXT,
    "dataSolicitacao" TIMESTAMP(3),
    "registroConselho" TEXT,
    "causasExternas" JSONB,
    "autorizacao" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laudos_internacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_internacao_alta" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "status" "StatusFichaInternacaoAlta" NOT NULL DEFAULT 'RASCUNHO',
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "dadosFormulario" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_internacao_alta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_ccih" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "status" "StatusFichaCcih" NOT NULL DEFAULT 'RASCUNHO',
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "sexo" TEXT,
    "setorUnidade" TEXT,
    "leitoDescricao" TEXT,
    "dataInternacao" TIMESTAMP(3),
    "diagnosticoPrincipal" TEXT,
    "cidPrincipal" TEXT,
    "procedimentoRelacionado" TEXT,
    "tipoInfeccao" "TipoInfeccaoCcih",
    "tipoInfeccaoOutro" TEXT,
    "topografia" TEXT,
    "dataInicioSinais" TIMESTAMP(3),
    "sinaisSintomas" TEXT,
    "resultadosLaboratorio" TEXT,
    "microorganismoIdentificado" TEXT,
    "sensibilidadeAntimicrobianos" TEXT,
    "fatoresRisco" JSONB,
    "dispositivos" JSONB,
    "antibioticoterapiaEmUso" TEXT,
    "antibioticoterapiaPrevio" TEXT,
    "dataNotificacao" TIMESTAMP(3),
    "nomeProfissionalNotificador" TEXT,
    "conselhoProfissional" TEXT,
    "funcaoProfissional" TEXT,
    "observacoesEquipe" TEXT,
    "parecerCcih" TEXT,
    "dadosFormulario" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_ccih_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_multidisciplinares" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "status" "StatusFichaMultidisciplinar" NOT NULL DEFAULT 'RASCUNHO',
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "sexo" TEXT,
    "setorUnidade" TEXT,
    "leitoDescricao" TEXT,
    "dataInternacao" TIMESTAMP(3),
    "diagnosticoPrincipal" TEXT,
    "cidPrincipal" TEXT,
    "medico" JSONB,
    "enfermagem" JSONB,
    "nutricao" JSONB,
    "fisioterapia" JSONB,
    "psicologia" JSONB,
    "farmacia" JSONB,
    "planoConjunto" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_multidisciplinares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_evolucao_turno" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "turno" "TurnoEvolucaoInternacao" NOT NULL,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "status" "StatusFichaEvolucaoTurno" NOT NULL DEFAULT 'RASCUNHO',
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "setorUnidade" TEXT,
    "leitoDescricao" TEXT,
    "estadoGeral" TEXT,
    "evolucaoClinica" TEXT,
    "exameFisico" TEXT,
    "sinaisVitais" JSONB,
    "avaliacaoSistemas" JSONB,
    "dietaEliminacoes" TEXT,
    "medicamentosProcedimentos" TEXT,
    "intercorrencias" TEXT,
    "condutaProximoTurno" TEXT,
    "nomeProfissional" TEXT,
    "conselhoProfissional" TEXT,
    "funcaoProfissional" TEXT,
    "preenchidoPorId" TEXT,
    "registradoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_evolucao_turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_sinais_vitais" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "leitoDescricao" TEXT,
    "controleHorario" JSONB,
    "balancoHidrico" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_sinais_vitais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_sae" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "leitoDescricao" TEXT,
    "selecoes" JSONB,
    "textos" JSONB,
    "diagnosticos" JSONB,
    "prescricoes" JSONB,
    "registroDiurno" TEXT,
    "registroNoturno" TEXT,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_sae_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolucoes_multiprofissional" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "evolucao" TEXT NOT NULL,
    "categoria" TEXT,
    "nomeProfissional" TEXT,
    "conselho" TEXT,
    "registradoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evolucoes_multiprofissional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_internacao_obstetrica" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "leitoDescricao" TEXT,
    "campos" JSONB,
    "trabalhoParto" JSONB,
    "puerperio" JSONB,
    "recemNascido" JSONB,
    "condicoesAlta" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_internacao_obstetrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_bercario" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "nomePaciente" TEXT,
    "numeroProntuario" TEXT,
    "leitoDescricao" TEXT,
    "campos" JSONB,
    "evolucao" JSONB,
    "preenchidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_bercario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encaminhamentos" (
    "id" TEXT NOT NULL,
    "prontuarioId" TEXT NOT NULL,
    "tipo" "TipoEncaminhamento" NOT NULL,
    "especialidade" TEXT NOT NULL,
    "medicoDestinoId" TEXT,
    "prioridade" TEXT,
    "resumoClinco" TEXT,
    "justificativa" TEXT,
    "cidInternacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encaminhamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "acao" "TipoAcaoAuditoria" NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "campo" TEXT,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "ipOrigem" TEXT,
    "userAgent" TEXT,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instituicoes" (
    "id" TEXT NOT NULL,
    "nomeMunicipio" TEXT NOT NULL,
    "nomeInstituicao" TEXT NOT NULL,
    "cnes" TEXT,
    "codigoIbgeMunicipio" TEXT,
    "endereco" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" CHAR(2),
    "cep" TEXT,
    "logomarcaUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instituicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_painel" (
    "id" TEXT NOT NULL,
    "vozAtiva" BOOLEAN NOT NULL DEFAULT true,
    "tipoVoz" TEXT NOT NULL DEFAULT 'feminina',
    "corPrimaria" TEXT NOT NULL DEFAULT '#2563eb',
    "corSecundaria" TEXT NOT NULL DEFAULT '#f8fafc',
    "corTexto" TEXT NOT NULL DEFAULT '#1e293b',
    "mensagemPadrao" TEXT NOT NULL DEFAULT 'Comparecer ao consultório',
    "velocidadeVoz" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "layoutDividido" BOOLEAN NOT NULL DEFAULT false,
    "intervaloRotacaoSegundos" INTEGER NOT NULL DEFAULT 8,
    "posicaoMidia" TEXT NOT NULL DEFAULT 'esquerda',
    "imagensRotativas" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_painel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_smtp" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL DEFAULT '',
    "porta" INTEGER NOT NULL DEFAULT 587,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "usuario" TEXT NOT NULL DEFAULT '',
    "senhaCriptografada" TEXT NOT NULL DEFAULT '',
    "emailRemetente" TEXT NOT NULL DEFAULT '',
    "nomeRemetente" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_smtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "origens_pacientes" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procedenciaFicha" TEXT,

    CONSTRAINT "origens_pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_medicamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "principioAtivo" TEXT NOT NULL,
    "forma" TEXT,
    "concentracao" TEXT,
    "unidade" TEXT,
    "saldoAtual" INTEGER NOT NULL DEFAULT 0,
    "saldoReservado" INTEGER NOT NULL DEFAULT 0,
    "estoqueMinimo" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_medicamento_lote" (
    "id" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "validade" TIMESTAMP(3),
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_medicamento_lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_farmacia_movimentacao" (
    "id" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "loteId" TEXT,
    "tipo" "TipoMovimentacaoFarmacia" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "saldoAnterior" INTEGER NOT NULL,
    "saldoPosterior" INTEGER NOT NULL,
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "usuarioId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_farmacia_movimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_medicamento_sinonimo" (
    "id" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "sinonimo" TEXT NOT NULL,
    "sinonimoNorm" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_medicamento_sinonimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_interacao_matriz" (
    "id" TEXT NOT NULL,
    "principioAtivoA" TEXT NOT NULL,
    "principioAtivoB" TEXT NOT NULL,
    "risco" "RiscoInteracao" NOT NULL,
    "efeitoClinico" TEXT NOT NULL,
    "sugestaoSistema" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_interacao_matriz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_prescricao_cabecalho" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "statusValidacao" "StatusValidacaoFarmacia" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    "observacoes" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_prescricao_cabecalho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_prescricao_item" (
    "id" TEXT NOT NULL,
    "prescricaoId" TEXT NOT NULL,
    "medicamentoId" TEXT,
    "medicamentoNome" TEXT NOT NULL,
    "principioAtivo" TEXT NOT NULL,
    "quantidadeSolicitada" INTEGER NOT NULL DEFAULT 1,
    "dose" TEXT NOT NULL,
    "via" "ViaAdministracao" NOT NULL,
    "frequencia" TEXT NOT NULL,
    "duracaoDias" INTEGER,
    "observacoes" TEXT,
    "justificativaMedica" TEXT,
    "alertasInteracao" JSONB,
    "statusValidacao" "StatusValidacaoFarmacia" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_prescricao_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_farmacia_dispensacao" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "validadoPorId" TEXT,
    "status" "StatusValidacaoFarmacia" NOT NULL DEFAULT 'AGUARDANDO_TRIAGEM',
    "motivoRejeicao" TEXT,
    "validadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_farmacia_dispensacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_farmacia_entrada_nf" (
    "id" TEXT NOT NULL,
    "numeroNota" TEXT NOT NULL,
    "serie" TEXT,
    "fornecedorNome" TEXT,
    "fornecedorCnpj" TEXT,
    "emitidaEm" TIMESTAMP(3),
    "recebidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importadaXml" BOOLEAN NOT NULL DEFAULT false,
    "chaveNfe" TEXT,
    "observacoes" TEXT,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_farmacia_entrada_nf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_farmacia_entrada_nf_item" (
    "id" TEXT NOT NULL,
    "entradaId" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "loteId" TEXT,
    "quantidade" INTEGER NOT NULL,
    "custoUnitario" DECIMAL(12,2),
    "lote" TEXT,
    "validade" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_farmacia_entrada_nf_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_farmacia_saida" (
    "id" TEXT NOT NULL,
    "tipo" "TipoSaidaFarmacia" NOT NULL,
    "atendimentoId" TEXT,
    "observacoes" TEXT,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_farmacia_saida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_farmacia_saida_item" (
    "id" TEXT NOT NULL,
    "saidaId" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "loteId" TEXT,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT,
    "dispensacaoId" TEXT,
    "prescricaoItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_farmacia_saida_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_auditoria_log" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "role" "Role",
    "atendimentoId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "ipOrigem" TEXT,
    "userAgent" TEXT,
    "detalhes" JSONB,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_auditoria_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cpf_key" ON "usuarios"("cpf");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_redefinicao_senha_tokenHash_key" ON "tokens_redefinicao_senha"("tokenHash");

-- CreateIndex
CREATE INDEX "tokens_redefinicao_senha_usuarioId_idx" ON "tokens_redefinicao_senha"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_cpfCriptografado_key" ON "pacientes"("cpfCriptografado");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_cpfHash_key" ON "pacientes"("cpfHash");

-- CreateIndex
CREATE INDEX "pacientes_cpfHash_idx" ON "pacientes"("cpfHash");

-- CreateIndex
CREATE INDEX "pacientes_nomeExibicao_idx" ON "pacientes"("nomeExibicao");

-- CreateIndex
CREATE INDEX "pacientes_createdAt_idx" ON "pacientes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "enderecos_pacienteId_key" ON "enderecos"("pacienteId");

-- CreateIndex
CREATE INDEX "alergias_pacienteId_idx" ON "alergias"("pacienteId");

-- CreateIndex
CREATE INDEX "medicamentos_continuos_pacienteId_idx" ON "medicamentos_continuos"("pacienteId");

-- CreateIndex
CREATE INDEX "documentos_pacientes_pacienteId_idx" ON "documentos_pacientes"("pacienteId");

-- CreateIndex
CREATE UNIQUE INDEX "atendimentos_numeroAtendimento_key" ON "atendimentos"("numeroAtendimento");

-- CreateIndex
CREATE INDEX "atendimentos_pacienteId_idx" ON "atendimentos"("pacienteId");

-- CreateIndex
CREATE INDEX "atendimentos_numeroAtendimento_idx" ON "atendimentos"("numeroAtendimento");

-- CreateIndex
CREATE INDEX "atendimentos_status_idx" ON "atendimentos"("status");

-- CreateIndex
CREATE INDEX "atendimentos_leitoId_idx" ON "atendimentos"("leitoId");

-- CreateIndex
CREATE INDEX "atendimentos_createdAt_idx" ON "atendimentos"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "clinicas_nome_key" ON "clinicas"("nome");

-- CreateIndex
CREATE INDEX "clinicas_ativo_idx" ON "clinicas"("ativo");

-- CreateIndex
CREATE INDEX "leitos_ala_idx" ON "leitos"("ala");

-- CreateIndex
CREATE INDEX "leitos_tipo_idx" ON "leitos"("tipo");

-- CreateIndex
CREATE INDEX "leitos_status_idx" ON "leitos"("status");

-- CreateIndex
CREATE INDEX "leitos_ativo_idx" ON "leitos"("ativo");

-- CreateIndex
CREATE INDEX "leitos_clinicaId_idx" ON "leitos"("clinicaId");

-- CreateIndex
CREATE UNIQUE INDEX "leitos_ala_codigo_key" ON "leitos"("ala", "codigo");

-- CreateIndex
CREATE INDEX "prescricoes_medicas_padrao_ativo_idx" ON "prescricoes_medicas_padrao"("ativo");

-- CreateIndex
CREATE INDEX "prescricoes_medicas_padrao_nome_idx" ON "prescricoes_medicas_padrao"("nome");

-- CreateIndex
CREATE INDEX "itens_prescricao_medica_padrao_prescricaoMedicaPadraoId_idx" ON "itens_prescricao_medica_padrao"("prescricaoMedicaPadraoId");

-- CreateIndex
CREATE UNIQUE INDEX "triagens_atendimentoId_key" ON "triagens"("atendimentoId");

-- CreateIndex
CREATE INDEX "triagens_corClassificacao_idx" ON "triagens"("corClassificacao");

-- CreateIndex
CREATE INDEX "triagens_createdAt_idx" ON "triagens"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sinais_vitais_triagemId_key" ON "sinais_vitais"("triagemId");

-- CreateIndex
CREATE INDEX "chamadas_painel_setorPainel_idx" ON "chamadas_painel"("setorPainel");

-- CreateIndex
CREATE INDEX "chamadas_painel_chamadoEm_idx" ON "chamadas_painel"("chamadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "prontuarios_medicos_atendimentoId_key" ON "prontuarios_medicos"("atendimentoId");

-- CreateIndex
CREATE INDEX "prontuarios_medicos_atendimentoId_idx" ON "prontuarios_medicos"("atendimentoId");

-- CreateIndex
CREATE INDEX "prontuarios_medicos_encerradoEm_idx" ON "prontuarios_medicos"("encerradoEm");

-- CreateIndex
CREATE UNIQUE INDEX "anamneses_prontuarioId_key" ON "anamneses"("prontuarioId");

-- CreateIndex
CREATE INDEX "diagnosticos_prontuarioId_idx" ON "diagnosticos"("prontuarioId");

-- CreateIndex
CREATE INDEX "diagnosticos_codigoCid_idx" ON "diagnosticos"("codigoCid");

-- CreateIndex
CREATE INDEX "prescricoes_prontuarioId_idx" ON "prescricoes"("prontuarioId");

-- CreateIndex
CREATE INDEX "prescricoes_prontuarioId_tipo_idx" ON "prescricoes"("prontuarioId", "tipo");

-- CreateIndex
CREATE INDEX "itens_prescricao_prescricaoId_idx" ON "itens_prescricao"("prescricaoId");

-- CreateIndex
CREATE INDEX "aplicacoes_medicamentos_itemPrescricaoId_idx" ON "aplicacoes_medicamentos"("itemPrescricaoId");

-- CreateIndex
CREATE INDEX "aplicacoes_medicamentos_aplicadoEm_idx" ON "aplicacoes_medicamentos"("aplicadoEm");

-- CreateIndex
CREATE INDEX "requisicoes_exames_prontuarioId_idx" ON "requisicoes_exames"("prontuarioId");

-- CreateIndex
CREATE INDEX "itens_requisicao_requisicaoId_idx" ON "itens_requisicao"("requisicaoId");

-- CreateIndex
CREATE INDEX "evolucoes_medicas_prontuarioId_idx" ON "evolucoes_medicas"("prontuarioId");

-- CreateIndex
CREATE INDEX "evolucoes_medicas_registradoEm_idx" ON "evolucoes_medicas"("registradoEm");

-- CreateIndex
CREATE UNIQUE INDEX "laudos_internacao_atendimentoId_key" ON "laudos_internacao"("atendimentoId");

-- CreateIndex
CREATE INDEX "laudos_internacao_status_idx" ON "laudos_internacao"("status");

-- CreateIndex
CREATE INDEX "laudos_internacao_createdAt_idx" ON "laudos_internacao"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_internacao_alta_atendimentoId_key" ON "fichas_internacao_alta"("atendimentoId");

-- CreateIndex
CREATE INDEX "fichas_internacao_alta_status_idx" ON "fichas_internacao_alta"("status");

-- CreateIndex
CREATE INDEX "fichas_internacao_alta_createdAt_idx" ON "fichas_internacao_alta"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_ccih_atendimentoId_key" ON "fichas_ccih"("atendimentoId");

-- CreateIndex
CREATE INDEX "fichas_ccih_status_idx" ON "fichas_ccih"("status");

-- CreateIndex
CREATE INDEX "fichas_ccih_createdAt_idx" ON "fichas_ccih"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_multidisciplinares_atendimentoId_key" ON "fichas_multidisciplinares"("atendimentoId");

-- CreateIndex
CREATE INDEX "fichas_multidisciplinares_status_idx" ON "fichas_multidisciplinares"("status");

-- CreateIndex
CREATE INDEX "fichas_multidisciplinares_createdAt_idx" ON "fichas_multidisciplinares"("createdAt");

-- CreateIndex
CREATE INDEX "fichas_evolucao_turno_atendimentoId_idx" ON "fichas_evolucao_turno"("atendimentoId");

-- CreateIndex
CREATE INDEX "fichas_evolucao_turno_turno_idx" ON "fichas_evolucao_turno"("turno");

-- CreateIndex
CREATE INDEX "fichas_evolucao_turno_dataReferencia_idx" ON "fichas_evolucao_turno"("dataReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_evolucao_turno_atendimentoId_dataReferencia_turno_key" ON "fichas_evolucao_turno"("atendimentoId", "dataReferencia", "turno");

-- CreateIndex
CREATE INDEX "fichas_sinais_vitais_atendimentoId_idx" ON "fichas_sinais_vitais"("atendimentoId");

-- CreateIndex
CREATE INDEX "fichas_sinais_vitais_dataReferencia_idx" ON "fichas_sinais_vitais"("dataReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_sinais_vitais_atendimentoId_dataReferencia_key" ON "fichas_sinais_vitais"("atendimentoId", "dataReferencia");

-- CreateIndex
CREATE INDEX "fichas_sae_atendimentoId_idx" ON "fichas_sae"("atendimentoId");

-- CreateIndex
CREATE INDEX "fichas_sae_dataReferencia_idx" ON "fichas_sae"("dataReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_sae_atendimentoId_dataReferencia_key" ON "fichas_sae"("atendimentoId", "dataReferencia");

-- CreateIndex
CREATE INDEX "evolucoes_multiprofissional_atendimentoId_idx" ON "evolucoes_multiprofissional"("atendimentoId");

-- CreateIndex
CREATE INDEX "evolucoes_multiprofissional_dataHora_idx" ON "evolucoes_multiprofissional"("dataHora");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_internacao_obstetrica_atendimentoId_key" ON "fichas_internacao_obstetrica"("atendimentoId");

-- CreateIndex
CREATE INDEX "fichas_internacao_obstetrica_atendimentoId_idx" ON "fichas_internacao_obstetrica"("atendimentoId");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_bercario_atendimentoId_key" ON "fichas_bercario"("atendimentoId");

-- CreateIndex
CREATE INDEX "fichas_bercario_atendimentoId_idx" ON "fichas_bercario"("atendimentoId");

-- CreateIndex
CREATE INDEX "encaminhamentos_prontuarioId_idx" ON "encaminhamentos"("prontuarioId");

-- CreateIndex
CREATE INDEX "logs_auditoria_usuarioId_idx" ON "logs_auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "logs_auditoria_entidade_entidadeId_idx" ON "logs_auditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "logs_auditoria_registradoEm_idx" ON "logs_auditoria"("registradoEm");

-- CreateIndex
CREATE UNIQUE INDEX "origens_pacientes_descricao_key" ON "origens_pacientes"("descricao");

-- CreateIndex
CREATE INDEX "tb_medicamento_principioAtivo_idx" ON "tb_medicamento"("principioAtivo");

-- CreateIndex
CREATE INDEX "tb_medicamento_nome_idx" ON "tb_medicamento"("nome");

-- CreateIndex
CREATE INDEX "tb_medicamento_lote_medicamentoId_idx" ON "tb_medicamento_lote"("medicamentoId");

-- CreateIndex
CREATE INDEX "tb_medicamento_lote_validade_idx" ON "tb_medicamento_lote"("validade");

-- CreateIndex
CREATE UNIQUE INDEX "tb_medicamento_lote_medicamentoId_lote_key" ON "tb_medicamento_lote"("medicamentoId", "lote");

-- CreateIndex
CREATE INDEX "tb_farmacia_movimentacao_medicamentoId_idx" ON "tb_farmacia_movimentacao"("medicamentoId");

-- CreateIndex
CREATE INDEX "tb_farmacia_movimentacao_loteId_idx" ON "tb_farmacia_movimentacao"("loteId");

-- CreateIndex
CREATE INDEX "tb_farmacia_movimentacao_tipo_idx" ON "tb_farmacia_movimentacao"("tipo");

-- CreateIndex
CREATE INDEX "tb_farmacia_movimentacao_createdAt_idx" ON "tb_farmacia_movimentacao"("createdAt");

-- CreateIndex
CREATE INDEX "tb_medicamento_sinonimo_sinonimoNorm_idx" ON "tb_medicamento_sinonimo"("sinonimoNorm");

-- CreateIndex
CREATE INDEX "tb_medicamento_sinonimo_medicamentoId_idx" ON "tb_medicamento_sinonimo"("medicamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "tb_medicamento_sinonimo_medicamentoId_sinonimoNorm_key" ON "tb_medicamento_sinonimo"("medicamentoId", "sinonimoNorm");

-- CreateIndex
CREATE INDEX "tb_interacao_matriz_principioAtivoA_principioAtivoB_idx" ON "tb_interacao_matriz"("principioAtivoA", "principioAtivoB");

-- CreateIndex
CREATE INDEX "tb_interacao_matriz_risco_idx" ON "tb_interacao_matriz"("risco");

-- CreateIndex
CREATE INDEX "tb_prescricao_cabecalho_atendimentoId_idx" ON "tb_prescricao_cabecalho"("atendimentoId");

-- CreateIndex
CREATE INDEX "tb_prescricao_cabecalho_statusValidacao_idx" ON "tb_prescricao_cabecalho"("statusValidacao");

-- CreateIndex
CREATE INDEX "tb_prescricao_item_prescricaoId_idx" ON "tb_prescricao_item"("prescricaoId");

-- CreateIndex
CREATE INDEX "tb_prescricao_item_principioAtivo_idx" ON "tb_prescricao_item"("principioAtivo");

-- CreateIndex
CREATE INDEX "tb_prescricao_item_statusValidacao_idx" ON "tb_prescricao_item"("statusValidacao");

-- CreateIndex
CREATE UNIQUE INDEX "tb_farmacia_dispensacao_itemId_key" ON "tb_farmacia_dispensacao"("itemId");

-- CreateIndex
CREATE INDEX "tb_farmacia_dispensacao_status_idx" ON "tb_farmacia_dispensacao"("status");

-- CreateIndex
CREATE INDEX "tb_farmacia_dispensacao_validadoEm_idx" ON "tb_farmacia_dispensacao"("validadoEm");

-- CreateIndex
CREATE INDEX "tb_farmacia_entrada_nf_numeroNota_idx" ON "tb_farmacia_entrada_nf"("numeroNota");

-- CreateIndex
CREATE INDEX "tb_farmacia_entrada_nf_recebidaEm_idx" ON "tb_farmacia_entrada_nf"("recebidaEm");

-- CreateIndex
CREATE INDEX "tb_farmacia_entrada_nf_item_entradaId_idx" ON "tb_farmacia_entrada_nf_item"("entradaId");

-- CreateIndex
CREATE INDEX "tb_farmacia_entrada_nf_item_medicamentoId_idx" ON "tb_farmacia_entrada_nf_item"("medicamentoId");

-- CreateIndex
CREATE INDEX "tb_farmacia_entrada_nf_item_loteId_idx" ON "tb_farmacia_entrada_nf_item"("loteId");

-- CreateIndex
CREATE INDEX "tb_farmacia_saida_tipo_idx" ON "tb_farmacia_saida"("tipo");

-- CreateIndex
CREATE INDEX "tb_farmacia_saida_createdAt_idx" ON "tb_farmacia_saida"("createdAt");

-- CreateIndex
CREATE INDEX "tb_farmacia_saida_atendimentoId_idx" ON "tb_farmacia_saida"("atendimentoId");

-- CreateIndex
CREATE INDEX "tb_farmacia_saida_item_saidaId_idx" ON "tb_farmacia_saida_item"("saidaId");

-- CreateIndex
CREATE INDEX "tb_farmacia_saida_item_medicamentoId_idx" ON "tb_farmacia_saida_item"("medicamentoId");

-- CreateIndex
CREATE INDEX "tb_farmacia_saida_item_loteId_idx" ON "tb_farmacia_saida_item"("loteId");

-- CreateIndex
CREATE INDEX "tb_farmacia_saida_item_dispensacaoId_idx" ON "tb_farmacia_saida_item"("dispensacaoId");

-- CreateIndex
CREATE INDEX "tb_farmacia_saida_item_prescricaoItemId_idx" ON "tb_farmacia_saida_item"("prescricaoItemId");

-- CreateIndex
CREATE INDEX "tb_auditoria_log_usuarioId_idx" ON "tb_auditoria_log"("usuarioId");

-- CreateIndex
CREATE INDEX "tb_auditoria_log_atendimentoId_idx" ON "tb_auditoria_log"("atendimentoId");

-- CreateIndex
CREATE INDEX "tb_auditoria_log_entidade_entidadeId_idx" ON "tb_auditoria_log"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "tb_auditoria_log_registradoEm_idx" ON "tb_auditoria_log"("registradoEm");

-- AddForeignKey
ALTER TABLE "tokens_redefinicao_senha" ADD CONSTRAINT "tokens_redefinicao_senha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alergias" ADD CONSTRAINT "alergias_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicamentos_continuos" ADD CONSTRAINT "medicamentos_continuos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_pacientes" ADD CONSTRAINT "documentos_pacientes_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_origemId_fkey" FOREIGN KEY ("origemId") REFERENCES "origens_pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_leitoId_fkey" FOREIGN KEY ("leitoId") REFERENCES "leitos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leitos" ADD CONSTRAINT "leitos_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "clinicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_prescricao_medica_padrao" ADD CONSTRAINT "itens_prescricao_medica_padrao_prescricaoMedicaPadraoId_fkey" FOREIGN KEY ("prescricaoMedicaPadraoId") REFERENCES "prescricoes_medicas_padrao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triagens" ADD CONSTRAINT "triagens_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triagens" ADD CONSTRAINT "triagens_triadorId_fkey" FOREIGN KEY ("triadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sinais_vitais" ADD CONSTRAINT "sinais_vitais_triagemId_fkey" FOREIGN KEY ("triagemId") REFERENCES "triagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamadas_painel" ADD CONSTRAINT "chamadas_painel_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamadas_painel" ADD CONSTRAINT "chamadas_painel_chamadoPorId_fkey" FOREIGN KEY ("chamadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prontuarios_medicos" ADD CONSTRAINT "prontuarios_medicos_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prontuarios_medicos" ADD CONSTRAINT "prontuarios_medicos_encerradoPorId_fkey" FOREIGN KEY ("encerradoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamneses" ADD CONSTRAINT "anamneses_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricoes" ADD CONSTRAINT "prescricoes_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_prescricao" ADD CONSTRAINT "itens_prescricao_prescricaoId_fkey" FOREIGN KEY ("prescricaoId") REFERENCES "prescricoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicacoes_medicamentos" ADD CONSTRAINT "aplicacoes_medicamentos_aplicadoPorId_fkey" FOREIGN KEY ("aplicadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicacoes_medicamentos" ADD CONSTRAINT "aplicacoes_medicamentos_itemPrescricaoId_fkey" FOREIGN KEY ("itemPrescricaoId") REFERENCES "itens_prescricao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisicoes_exames" ADD CONSTRAINT "requisicoes_exames_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_requisicao" ADD CONSTRAINT "itens_requisicao_requisicaoId_fkey" FOREIGN KEY ("requisicaoId") REFERENCES "requisicoes_exames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolucoes_medicas" ADD CONSTRAINT "evolucoes_medicas_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolucoes_medicas" ADD CONSTRAINT "evolucoes_medicas_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laudos_internacao" ADD CONSTRAINT "laudos_internacao_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_internacao_alta" ADD CONSTRAINT "fichas_internacao_alta_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_ccih" ADD CONSTRAINT "fichas_ccih_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_multidisciplinares" ADD CONSTRAINT "fichas_multidisciplinares_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_evolucao_turno" ADD CONSTRAINT "fichas_evolucao_turno_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_sinais_vitais" ADD CONSTRAINT "fichas_sinais_vitais_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_sae" ADD CONSTRAINT "fichas_sae_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolucoes_multiprofissional" ADD CONSTRAINT "evolucoes_multiprofissional_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_internacao_obstetrica" ADD CONSTRAINT "fichas_internacao_obstetrica_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_bercario" ADD CONSTRAINT "fichas_bercario_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encaminhamentos" ADD CONSTRAINT "encaminhamentos_prontuarioId_fkey" FOREIGN KEY ("prontuarioId") REFERENCES "prontuarios_medicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_medicamento_lote" ADD CONSTRAINT "tb_medicamento_lote_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_movimentacao" ADD CONSTRAINT "tb_farmacia_movimentacao_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_movimentacao" ADD CONSTRAINT "tb_farmacia_movimentacao_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "tb_medicamento_lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_medicamento_sinonimo" ADD CONSTRAINT "tb_medicamento_sinonimo_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_prescricao_cabecalho" ADD CONSTRAINT "tb_prescricao_cabecalho_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_prescricao_cabecalho" ADD CONSTRAINT "tb_prescricao_cabecalho_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_prescricao_item" ADD CONSTRAINT "tb_prescricao_item_prescricaoId_fkey" FOREIGN KEY ("prescricaoId") REFERENCES "tb_prescricao_cabecalho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_prescricao_item" ADD CONSTRAINT "tb_prescricao_item_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_dispensacao" ADD CONSTRAINT "tb_farmacia_dispensacao_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "tb_prescricao_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_dispensacao" ADD CONSTRAINT "tb_farmacia_dispensacao_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_entrada_nf" ADD CONSTRAINT "tb_farmacia_entrada_nf_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD CONSTRAINT "tb_farmacia_entrada_nf_item_entradaId_fkey" FOREIGN KEY ("entradaId") REFERENCES "tb_farmacia_entrada_nf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD CONSTRAINT "tb_farmacia_entrada_nf_item_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_entrada_nf_item" ADD CONSTRAINT "tb_farmacia_entrada_nf_item_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "tb_medicamento_lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_saida" ADD CONSTRAINT "tb_farmacia_saida_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_saida" ADD CONSTRAINT "tb_farmacia_saida_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_saida_item" ADD CONSTRAINT "tb_farmacia_saida_item_saidaId_fkey" FOREIGN KEY ("saidaId") REFERENCES "tb_farmacia_saida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_saida_item" ADD CONSTRAINT "tb_farmacia_saida_item_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "tb_medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_saida_item" ADD CONSTRAINT "tb_farmacia_saida_item_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "tb_medicamento_lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_saida_item" ADD CONSTRAINT "tb_farmacia_saida_item_dispensacaoId_fkey" FOREIGN KEY ("dispensacaoId") REFERENCES "tb_farmacia_dispensacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_farmacia_saida_item" ADD CONSTRAINT "tb_farmacia_saida_item_prescricaoItemId_fkey" FOREIGN KEY ("prescricaoItemId") REFERENCES "tb_prescricao_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_auditoria_log" ADD CONSTRAINT "tb_auditoria_log_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_auditoria_log" ADD CONSTRAINT "tb_auditoria_log_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
