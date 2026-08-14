-- =============================================================================
-- SGH — Dados de demonstração (INSERT completo)
-- Gerado em: 2026-08-03T23:58:26.586Z
--
-- PRÉ-REQUISITO: executar database/sgh_schema_completo.sql antes
--
-- IMPORTANTE — chaves no .env da aplicação DEVEM ser iguais às usadas na geração:
--   ENCRYPTION_KEY (64 hex) — descriptografia de CPF/nome/telefone
--   NEXTAUTH_SECRET — hash de busca por CPF (cpfHash)
--
-- DATAS: atendimentos/triagens usam timestamps relativos à geração (2026-08-03).
-- O dashboard filtra por 30/90 dias — se importou SQL antigo, rode database/ajustar_datas_demo.sql
--
-- Login demo: admin@hospital.com / Sgh@2024!
--
-- Uso:
--   psql "$DATABASE_URL" -f database/sgh_dados_demo.sql
--
-- Para banco já populado, comente o bloco TRUNCATE ou use banco vazio.
-- =============================================================================

BEGIN;

-- Limpar dados demo (opcional — descomente se quiser recarregar do zero)
-- TRUNCATE TABLE
--   logs_auditoria, aplicacoes_medicamentos, itens_requisicao, requisicoes_exames,
--   itens_prescricao, prescricoes, evolucoes_medicas, encaminhamentos, diagnosticos,
--   anamneses, prontuarios_medicos, chamadas_painel, sinais_vitais, triagens,
--   atendimentos, documentos_pacientes, medicamentos_continuos, alergias, enderecos,
--   pacientes, origens_pacientes, config_smtp, config_painel, instituicoes,
--   tokens_redefinicao_senha, usuarios
-- CASCADE;


-- Usuários
INSERT INTO usuarios (id, email, "senhaHash", nome, role, crm, coren, ativo, "mfaAtivo", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000001', 'admin@hospital.com', '$2b$12$yboEUcbTJidkOvZtIdS3RuLijBolmLslkcfaHBHxGFaoqFoncWLd6', 'Administrador Sistema', 'ADMIN'::"Role", NULL, NULL, TRUE, FALSE, '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;
INSERT INTO usuarios (id, email, "senhaHash", nome, role, crm, coren, ativo, "mfaAtivo", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000002', 'medico@hospital.com', '$2b$12$yboEUcbTJidkOvZtIdS3RuLijBolmLslkcfaHBHxGFaoqFoncWLd6', 'Dr. Carlos Mendes', 'MEDICO'::"Role", '123456-SP', NULL, TRUE, FALSE, '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;
INSERT INTO usuarios (id, email, "senhaHash", nome, role, crm, coren, ativo, "mfaAtivo", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000003', 'enfermeiro@hospital.com', '$2b$12$yboEUcbTJidkOvZtIdS3RuLijBolmLslkcfaHBHxGFaoqFoncWLd6', 'Enf. Ana Beatriz Lima', 'ENFERMEIRO'::"Role", NULL, 'COREN-SP 654321', TRUE, FALSE, '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;
INSERT INTO usuarios (id, email, "senhaHash", nome, role, crm, coren, ativo, "mfaAtivo", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000004', 'recepcao@hospital.com', '$2b$12$yboEUcbTJidkOvZtIdS3RuLijBolmLslkcfaHBHxGFaoqFoncWLd6', 'Joana Silva Santos', 'RECEPCIONISTA'::"Role", NULL, NULL, TRUE, FALSE, '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;
INSERT INTO usuarios (id, email, "senhaHash", nome, role, crm, coren, ativo, "mfaAtivo", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000005', 'diretor@hospital.com', '$2b$12$yboEUcbTJidkOvZtIdS3RuLijBolmLslkcfaHBHxGFaoqFoncWLd6', 'Dr. Roberto Faria', 'DIRETOR_CLINICO'::"Role", '789012-SP', NULL, TRUE, FALSE, '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;
INSERT INTO usuarios (id, email, "senhaHash", nome, role, crm, coren, ativo, "mfaAtivo", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000006', 'tecnico@hospital.com', '$2b$12$yboEUcbTJidkOvZtIdS3RuLijBolmLslkcfaHBHxGFaoqFoncWLd6', 'Téc. Enf. Paulo Rocha', 'TECNICO_ENFERMAGEM'::"Role", NULL, NULL, TRUE, FALSE, '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;

-- Instituição e configurações
INSERT INTO instituicoes (id, "nomeMunicipio", "nomeInstituicao", endereco, bairro, cidade, estado, cep, "updatedAt")
VALUES ('b0000000-0000-4000-8000-000000000001', 'Município Demo', 'Hospital Municipal Central', 'Av. Principal, 1000', 'Centro', 'São Paulo', 'SP', '01001000', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;

INSERT INTO config_painel (id, "vozAtiva", "tipoVoz", "corPrimaria", "corSecundaria", "corTexto", "mensagemPadrao", "velocidadeVoz", "updatedAt")
VALUES ('c0000000-0000-4000-8000-000000000001', TRUE, 'feminina', '#2563eb', '#f8fafc', '#1e293b', 'Comparecer ao consultório', 1.0, '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;

INSERT INTO config_smtp (id, host, porta, secure, usuario, "senhaCriptografada", "emailRemetente", ativo, "createdAt", "updatedAt")
VALUES ('default', '', 587, FALSE, '', '', '', FALSE, '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;


-- Origens de paciente
INSERT INTO origens_pacientes (id, descricao, ativo, "createdAt", "procedenciaFicha")
VALUES ('0b000000-0000-4000-8000-000000000001', 'Demanda espontânea', TRUE, '2026-08-03 23:58:26', 'ESPONTÂNEA')
ON CONFLICT (descricao) DO NOTHING;
INSERT INTO origens_pacientes (id, descricao, ativo, "createdAt", "procedenciaFicha")
VALUES ('0b000000-0000-4000-8000-000000000002', 'SAMU', TRUE, '2026-08-03 23:58:26', 'SAMU')
ON CONFLICT (descricao) DO NOTHING;
INSERT INTO origens_pacientes (id, descricao, ativo, "createdAt", "procedenciaFicha")
VALUES ('0b000000-0000-4000-8000-000000000003', 'UPA referenciada', TRUE, '2026-08-03 23:58:26', 'TRANSFERÊNCIA UPA')
ON CONFLICT (descricao) DO NOTHING;
INSERT INTO origens_pacientes (id, descricao, ativo, "createdAt", "procedenciaFicha")
VALUES ('0b000000-0000-4000-8000-000000000004', 'UBS referenciada', TRUE, '2026-08-03 23:58:26', 'UBS')
ON CONFLICT (descricao) DO NOTHING;
INSERT INTO origens_pacientes (id, descricao, ativo, "createdAt", "procedenciaFicha")
VALUES ('0b000000-0000-4000-8000-000000000005', 'Polícia / resgate', TRUE, '2026-08-03 23:58:26', 'RESGATE')
ON CONFLICT (descricao) DO NOTHING;

-- Pacientes, endereços, alergias, medicamentos
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000001', '656c623631b8d9e7f6ddb971:f0a6d114e798fc687e932a8d2c854a07:38ec7687f2a640df48dd15', '0a16899e5186fd130ad50dc351cd17352439dc0b166a4dff598da8fcb7a7994e', 'f6aca63b2aa1a08d166747d3:d6e2412f18b04de0ed01f4fc775b372d:4dc0b276676f03970da4ab48f66d9583c59bc6bc3dae', 'Maria S.', '1985-03-12', 'FEMININO'::"SexoBiologico", 'bd815a1d529d746e49e0354b:4b6a009421ba12181ddcc6342f85006c:14994d309f526e3e3051b3', 'O_POSITIVO'::"TipoSanguineo", 'SUS', 'Helena Santos', 'Doméstica', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000001', '0c000000-0000-4000-8000-000000000001', '01310100', 'Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000001', '0c000000-0000-4000-8000-000000000001', 'DIPIRONA', 'Moderada', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000001', '0c000000-0000-4000-8000-000000000001', 'LOSARTANA', '50MG', '1X AO DIA', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO documentos_pacientes (id, "pacienteId", tipo, "nomeArquivo", "mimeType", "tamanhoBytes", "caminhoArquivo", "createdAt")
VALUES ('10000000-0000-4000-8000-000000000001', '0c000000-0000-4000-8000-000000000001', 'RG', 'rg_demo.pdf', 'application/pdf', 1024, 'uploads/demo/rg_1.pdf', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000002', '9a4114a73e1166e6dbd80fe3:03e30559c13584ee2912e07bb0af2044:56b50f023c92eaf932abcf', '9d1ebbd0e89af702228df5eeb73104ab4f43be2859910b9f05c3e828df31d936', 'cf270568db1e5bfbaf333aa9:a407a732d5fe06e73f8dfc366d268b5f:5d16e8989d01945916e2da1507f4264f40481e2ec1', 'João O.', '1972-07-22', 'MASCULINO'::"SexoBiologico", 'fa16d09edb3ce6ea350c36fe:841e56eeb7c035b63ce848ca4e2b4db1:a17d4e2021b65c9157e65f', 'A_POSITIVO'::"TipoSanguineo", NULL, 'Rosa Oliveira', 'Motorista', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000002', '0c000000-0000-4000-8000-000000000002', '04038001', 'Rua Vergueiro', '250', 'Vila Mariana', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000011', '0c000000-0000-4000-8000-000000000002', 'METFORMINA', '850MG', '2X AO DIA', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO documentos_pacientes (id, "pacienteId", tipo, "nomeArquivo", "mimeType", "tamanhoBytes", "caminhoArquivo", "createdAt")
VALUES ('10000000-0000-4000-8000-000000000002', '0c000000-0000-4000-8000-000000000002', 'RG', 'rg_demo.pdf', 'application/pdf', 1024, 'uploads/demo/rg_2.pdf', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000003', 'a1fac9692455b1f344e3a454:d345578c8e9fed12ec9c0f47903579c0:d9135403c19692b843dad7', '374001bc19d794f8fe42068bdecdc3105953b8054c6e4f137593bb83d49c4267', 'd1f7c858ac796cec7e1ad239:a91b78d89fc33ac9e10db0382f0d07f6:8d8b478ac2854c1b693a739282d3b9517a5023f3dc9087188c', 'Ana L.', '1998-11-05', 'FEMININO'::"SexoBiologico", 'ffad747d4645bef5f2a23ed7:ebb95135daa56697a53f8a29ce32a8a1:73c577ef3200e206cb69a6', 'B_NEGATIVO'::"TipoSanguineo", 'UNIMED', 'Cláudia Lima', 'Estudante', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000003', '0c000000-0000-4000-8000-000000000003', '04543011', 'Av. Brigadeiro Faria Lima', '1500', 'Itaim Bibi', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000021', '0c000000-0000-4000-8000-000000000003', 'PENICILINA', 'Grave', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO documentos_pacientes (id, "pacienteId", tipo, "nomeArquivo", "mimeType", "tamanhoBytes", "caminhoArquivo", "createdAt")
VALUES ('10000000-0000-4000-8000-000000000003', '0c000000-0000-4000-8000-000000000003', 'RG', 'rg_demo.pdf', 'application/pdf', 1024, 'uploads/demo/rg_3.pdf', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000004', 'fcce00587ec5449fa321a20d:7bbec5fd6351bff593da921be8fce374:73384ae784db2e5fdfd366', 'b7a84b2e1edeaf6b4399f3a3a514215a2c1cb7dd40cb74acc97679d137d1ecb0', '5065c4690d34aaf74e0c4d8e:f7247bfd042396be30ec6384b810ee25:bdc45cbb2c84fcfa22f60b9de459b3ce469d711a', 'Pedro S.', '1960-01-18', 'MASCULINO'::"SexoBiologico", '3e2b41482059d6af001ff8fd:0e2a9345effcdfa1122ec3523af16168:f0833378eef917f0f2db5a', 'AB_POSITIVO'::"TipoSanguineo", 'SUS', 'Francisca Souza', 'Aposentado', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000004', '0c000000-0000-4000-8000-000000000004', '03015000', 'Rua do Gasômetro', '88', 'Brás', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000031', '0c000000-0000-4000-8000-000000000004', 'LÁTEX', 'Leve', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000031', '0c000000-0000-4000-8000-000000000004', 'AAS', '100MG', '1X AO DIA', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000032', '0c000000-0000-4000-8000-000000000004', 'SINVASTATINA', '20MG', '1X À NOITE', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000005', '5d6371c59f7716d579b907ec:adec28993049bd7d4b9f12989a457a38:4eee29a361ed1ebfbbe14f', '1e884eb8f4f0284de70f0498f933757c4f777bef4415109ff89826d961ec4f6e', '269fd793acf9334830ee3a47:b81ae266a42e3b3e3b0f0de67bd3a879:7add7f4e86f42079b2e41f60fdaaea100868', 'Lucia C.', '1990-09-30', 'FEMININO'::"SexoBiologico", 'a676fde95f11a285c8d2ac70:a13022606c7d8f05a1921788a893b117:d4c0730f52e8f6d3344488', 'A_NEGATIVO'::"TipoSanguineo", NULL, 'Teresa Costa', 'Enfermeira', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000005', '0c000000-0000-4000-8000-000000000005', '05001000', 'Rua da Consolação', '420', 'Consolação', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000006', 'aee7ca1aa45dcd6bf36f803e:e2dd45c02b2b343c362ebf4c3b77f1d9:4d30ee86c313b3959e9758', 'aeded3d4cbf890f644e237e98eb9cfc26af7e0e7693e4913ca570e7197e569e5', 'f7cffd7c2623c5cbff8ce4ce:2272eaa53715e8747f2a565eb92fe8ef:189d4e846c6a6541df3a182abcef893610b37faa292fa9', 'Roberto P.', '1955-04-08', 'MASCULINO'::"SexoBiologico", '0339f3e09a0a362c187a1e4e:7d729f4bb9759f377ee4228d9075cff5:7a2ce558241a4aeec945b9', 'O_NEGATIVO'::"TipoSanguineo", 'Bradesco Saúde', 'Maria Pereira', 'Comerciante', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000006', '0c000000-0000-4000-8000-000000000006', '02012000', 'Av. Cel. Sezefredo Fagundes', '1200', 'Tucuruvi', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000051', '0c000000-0000-4000-8000-000000000006', 'DIPIRONA', 'Leve', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000051', '0c000000-0000-4000-8000-000000000006', 'ENALAPRIL', '10MG', '2X AO DIA', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000007', '8d171f4a334c065938afefe2:929c386fd2a0f6b374dd5987ea72c41b:3efb38b3301cdcff24c2c4', '77847fa3b242898314eb8bf1772a68642b12ba84aba5a74a77b6f11041636357', 'e9ff652d7e95ca6435e0cd68:76f7f1c03ef543ef00a83263f04c785c:6cc838c26144b5e299e0437b80703ecc264632979cac819670ab', 'Fernanda M.', '2001-06-14', 'FEMININO'::"SexoBiologico", 'e56d1343b5784787e059480e:ba64000da3ceeb3ea9f79eb5b3474d0f:a775191ed7a7bb64a79b91', 'O_POSITIVO'::"TipoSanguineo", 'SUS', 'Sandra Martins', 'Auxiliar administrativo', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000007', '0c000000-0000-4000-8000-000000000007', '03102001', 'Rua do Orfanato', '555', 'Vila Prudente', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000008', '4480728e875ab10662d01ef1:67d74233e5f7927b4c4e2153805e71d5:9521bd91e218b12df19a0e', '5407e17d0714cf29074ef5248e44ecc53bb861baf917c0d1466d2a4231a9fc63', '6049346d0ce3d978d0541def:0d7fe5d8efb95b736b7462b3fbdcea0f:508fef21359fc7bef608f5df5dfbefb7e8e6123c4adc4f', 'Marcos R.', '1988-12-25', 'MASCULINO'::"SexoBiologico", '6d916588029c6d11448587dc:3fbaa08ea4dad69e998ec12d5b4db74d:d1d851fd496be0766c083e', 'B_POSITIVO'::"TipoSanguineo", NULL, 'Aparecida Ribeiro', 'Pedreiro', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000008', '0c000000-0000-4000-8000-000000000008', '08010000', 'Av. Marechal Tito', '3000', 'São Miguel', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000071', '0c000000-0000-4000-8000-000000000008', 'IBUPROFENO', 'Moderada', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000009', '04986e9a0ba1fe2bea2e20d9:a508b314a1d1c3e689c6702af35de109:2fdb0eba271a0645441977', 'f8d638d382becb34aa7232e2ad26b6e8ca916248bea8b9b6f8486e86cbd7ddad', '308c6ff40c675c6ae56b3492:12a49d86e0f71f8dcefb6e064a41d1e3:949d978e56a26ba09be0aef1204379cee118e0f0b451', 'Juliana N.', '1978-02-17', 'FEMININO'::"SexoBiologico", '330cbc41ec67218a3f9bb163:9c01e33a6e59be5bc13882d920d5bd3e:0da4d0f9716ecde9eba621', 'A_POSITIVO'::"TipoSanguineo", 'Amil', 'Neuza Nunes', 'Professora', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000009', '0c000000-0000-4000-8000-000000000009', '05508000', 'Rua Capote Valente', '90', 'Pinheiros', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000081', '0c000000-0000-4000-8000-000000000009', 'LEVOTIROXINA', '75MCG', '1X EM JEJUM', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000010', '0fce634a4a55f52f8a8f2694:111166a94acdab7760a1e228c5743c70:8bdb4c7170cb342cee8d14', 'd70c1171c915867c0a05418a9c8021e61069757e6189726eedfc2bb88e53147f', '040b8ddde9ecf0ccbedc0921:47f8b3c5a077701a439a7277a7a2282d:2f6219999bdf16592f816bc884158be8f967c3fc71', 'Antonio B.', '1948-08-03', 'MASCULINO'::"SexoBiologico", '2328a20e2633a7770f9d0d84:d2c9feb5565a6922ee43cd4feb867be4:a51c6752b11e35bb7700f8', 'DESCONHECIDO'::"TipoSanguineo", 'SUS', 'Josefina Barbosa', 'Aposentado', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000010', '0c000000-0000-4000-8000-000000000010', '01001000', 'Praça da Sé', '50', 'Sé', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000091', '0c000000-0000-4000-8000-000000000010', 'CONTRASTE IODADO', 'Grave', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000091', '0c000000-0000-4000-8000-000000000010', 'FUROSEMIDA', '40MG', '1X AO DIA', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000092', '0c000000-0000-4000-8000-000000000010', 'CARVEDILOL', '6,25MG', '2X AO DIA', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000011', '81de84a079c29878b042ed54:ba59570d612753b152a9dbf5d9d4a39e:2f4116219d90fbc0af32e4', '3d725e547128e4f3508e320e397f3d9819bd0c023229ac42e6e968b767af805b', 'a2c2b01421e9c8268bdd80e6:abe724d20ae3bbbd2f180a6424ab0e64:23d16196b4b6ff51c5ee761ec33fcf122abf638a700d', 'Camila S.', '1995-05-20', 'FEMININO'::"SexoBiologico", '18cc815e3260432decb8b896:a5b716446cd13f80b5a80666e82ca40f:05b751e58c67ffd3628ce1', 'O_POSITIVO'::"TipoSanguineo", NULL, 'Eliane Silveira', 'Designer', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000011', '0c000000-0000-4000-8000-000000000011', '05407002', 'Rua Fradique Coutinho', '700', 'Pinheiros', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000012', '29a7ceceeb999603fcd9fa72:9c447dcff42ce1ea893f209a1c615556:970999e8e7c16c340ef37a', 'e4c93824edea44416f5863200ee2f755b6aeed543eadc0a58fb13425b199debd', '4c5138efa558cd3f4c34c7d0:dad550b30fdb8e76dd80a78a7bb9d9f2:4427a4a0fbb2aa8f24a1bc33c68f8d309809b123', 'Ricardo G.', '1982-10-11', 'MASCULINO'::"SexoBiologico", '7a425d3306c0318f110ca403:a0b10da3781043fef4de6a114b97e32b:28ec0fab75a5f9f897d063', 'A_POSITIVO'::"TipoSanguineo", 'SUS', 'Lúcia Gomes', 'Técnico de enfermagem', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000012', '0c000000-0000-4000-8000-000000000012', '04101000', 'Rua Domingos de Morais', '1800', 'Vila Mariana', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000111', '0c000000-0000-4000-8000-000000000012', 'SULFA', 'Moderada', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000013', '52faf02ee531971f0f0cd4ab:42d0c367d61ed5e06b12a018be12efe9:1ff7bb3760ac56668198bb', '2f0ed6329bd3cb3b13158b9b855cbd05fd29e2b9a0e495ad5e0eff08a1c7a236', '7622d7140466de9633918ab1:b9fc076086221d9b1d43b4561c3703c0:e5ff8d2dc0cde09100dbab7414b7894b163373cd12abf6', 'Patricia C.', '1970-03-28', 'FEMININO'::"SexoBiologico", '4ec54f9c5ce299bbcf83e2db:ac40fb8810ede5683c675e708808a311:d854cacab5fe3657ad0ee6', 'B_POSITIVO'::"TipoSanguineo", 'NotreDame', 'Ivone Carvalho', 'Contadora', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000013', '0c000000-0000-4000-8000-000000000013', '01452000', 'Av. Rebouças', '2000', 'Pinheiros', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000121', '0c000000-0000-4000-8000-000000000013', 'OMEPRAZOL', '20MG', '1X EM JEJUM', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000014', '43f6509bf6bad19d68fbded7:70e3aae9f943a229e89647d250ea2221:d9aa58f30d40801fbe7dcc', 'd68b112c31490e6b40ab2b6ed618bab6a08213475549a8922301ceb42c92b6d7', '401e439a2b241666734f7d38:e8e93e1527a9b93359011c3d6b39616c:93a48c11c023b2e13ce477e31204df5ef71488', 'Eduardo R.', '1992-07-07', 'MASCULINO'::"SexoBiologico", '87f26228c53dd52992352fb8:d08ffc2da0ad8a6630c323f9f8705c97:bf0023732a5a8fee9e0aaf', 'O_NEGATIVO'::"TipoSanguineo", NULL, 'Marta Rocha', 'Programador', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000014', '0c000000-0000-4000-8000-000000000014', '04571010', 'Av. Eng. Luís Carlos Berrini', '500', 'Brooklin', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000015', '3f8c514780bb3146268e31a1:d38433e41b8ab61dbaded34194e4a75b:95b60cfc71f7b796ec2ca6', '1a46458d80dd8ed516e6f48dc3bfcb3c5a19445def25ed6853dd1338259e49f4', 'cad54274d6a3e065e91193a3:826ef91ff415b6c1baa20399d0b4e2c6:a4786e2e0158fb3dcfdddfe4b730a67735c6faec39d6', 'Silvia T.', '1965-11-19', 'FEMININO'::"SexoBiologico", '984baa5bec5b1655d083b293:ccafbe7a6390f9421345f87184fd5a81:806e88e36fe3c9e3c2dc67', 'A_NEGATIVO'::"TipoSanguineo", 'SUS', 'Regina Teixeira', 'Auxiliar de limpeza', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000015', '0c000000-0000-4000-8000-000000000015', '03308050', 'Rua Taquari', '150', 'Tatuapé', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000141', '0c000000-0000-4000-8000-000000000015', 'POLEN', 'Leve', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000141', '0c000000-0000-4000-8000-000000000015', 'BUDESONIDA', '200MCG', '2X AO DIA', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000016', 'd220662b5720832eb20a8496:4f52d0f528e62990a36d1727cafebd4b:babfbb3c13d2c2b3721664', 'ac85f9c93befadb10db8d66037fb6e99cba12cd7b37d2e0f772ab11812d2d7d6', '42e7769f13a4f37d432fec7b:629a46b06093ddb5686de9c0828ce1fa:7494d8f27f68b178378a6adb6cddafa007d1a3da', 'Felipe M.', '2005-01-02', 'MASCULINO'::"SexoBiologico", '757ec5c87c2aa9da0fe02201:896f8a93359cb928ff18e44b42bdbd09:89209366997a8bef4854cf', 'O_POSITIVO'::"TipoSanguineo", 'SUS', 'Adriana Moura', 'Estudante', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000016', '0c000000-0000-4000-8000-000000000016', '02265000', 'Av. Águas de São Pedro', '45', 'Tucuruvi', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000017', '265fd961eab297bbc8864310:cf8741ae048c5b8530067fe24f693992:8aca29ad361c626487fde1', '4ce5729eb2913ee8ca27458c934fc9da14b6b02e740cc064c28217e537ae598f', '5417642c4971fef8dd3e2d81:d5a208946c0954d4fb971b911f8c7879:e7a4a5748a7e48dfcf0609e150fc5cf899aaed97f6c26d4be829', 'Renata C.', '1987-04-15', 'FEMININO'::"SexoBiologico", 'ba7fbdb5e1c5dc5715640521:0be82e0f5bdbe5dce9769c61fe5b7349:269c55c7befbdb75269667', 'AB_NEGATIVO'::"TipoSanguineo", 'Porto Seguro', 'Olívia Cavalcanti', 'Farmacêutica', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000017', '0c000000-0000-4000-8000-000000000017', '05615070', 'Av. Giovanni Gronchi', '3200', 'Morumbi', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000018', 'df6c3f6897ca8aa94cfc5b37:a943c7e235765ddb04a818e19ed2e6eb:7fb0bd58c52c380aa15c0b', 'e01a379fc5eea1ab9af510e1b824a0ac7b21e8e86e49e5040c678f5808076809', '3779342ab35da87ce7bbf8c0:994f9a95ad96b3282c23839d1f5d750f:f7e12eec617e9ca6a94abda4c0090d20218eab863bc6', 'Geraldo D.', '1950-06-30', 'MASCULINO'::"SexoBiologico", 'dfcce1240a5601263882c6b1:dfcbf7fb7a7f67ded7c5bd9fdd37fb93:438d063d7029e105fdd51e', 'A_POSITIVO'::"TipoSanguineo", 'SUS', 'Francisca Dias', 'Aposentado', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000018', '0c000000-0000-4000-8000-000000000018', '02309000', 'Av. Nova Cantareira', '1800', 'Tucuruvi', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000171', '0c000000-0000-4000-8000-000000000018', 'MORFINA', 'Grave', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000171', '0c000000-0000-4000-8000-000000000018', 'WARFARINA', '5MG', 'CONFORME INR', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000019', 'bac098d04693c9ad7dddbaa7:f298af7b3a51cc702a5ee3b5c92d9389:feb8e43eeea30e11399200', '7a49f83dd8da7423886d7cb268b82bcb0c5d7dd18ed85075dfc36ca3240012e9', 'aacaa776db6adfcf965678f0:4236c153153906a1f392a0f89e4a8053:b1d6be3662163893c98d3f9a53e1306bbdfac913', 'Vanessa C.', '1993-09-09', 'FEMININO'::"SexoBiologico", '9ffd5982c068fd54744b265b:dce6cbc9c2b3b8554b28da56ec88f89e:368894eac966606c9eebe7', 'B_NEGATIVO'::"TipoSanguineo", NULL, 'Vera Cardoso', 'Recepcionista', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000019', '0c000000-0000-4000-8000-000000000019', '03401000', 'Av. Cel. Sezefredo Fagundes', '800', 'Vila Carrão', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000020', 'e92d77f292e748b81f356fe6:51a4a97407c266569c2df6635a655416:2c07049f150cee840ee387', '23bc42feb15783c7d5b19805023aa4d073d4c79f6faf53c8b082445b8fc7e918', '0236b0df5debf1fc68453318:fcc4fbe63b93d840bc5ca20b94eadd30:f1d4fe3ee63c2f06b1d0d20e311e9801c6bd5c15ce', 'Paulo M.', '1975-12-12', 'MASCULINO'::"SexoBiologico", 'b1eb81b824ae4886b709fe69:60c6c7341f7e47fd6a319b30ba7f8a84:94c76eebd8d4643b5c67ef', 'O_POSITIVO'::"TipoSanguineo", 'SUS', 'Sonia Monteiro', 'Eletricista', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000020', '0c000000-0000-4000-8000-000000000020', '04286000', 'Av. do Cursino', '1200', 'Cursino', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000191', '0c000000-0000-4000-8000-000000000020', 'ASPIRINA', 'Moderada', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000021', '46cdf6bc2128f4c19543c333:9c81d4b40087d16cfc7fa6eea3f05e22:de3b89c73ecc23155994f6', '4ad19032be5c43b64a9c5e47fa1db54a236d2ab7c18426fc4c3229760335b22a', 'ade4168af439fcb023d36e9a:56ce416bf1cefe6ab39c10b684209833:9d43c6531686ee19197bbe272c2495de1e3e56077cdb41', 'Amanda F.', '2000-02-28', 'FEMININO'::"SexoBiologico", 'bc97465fb8e84a48d33c62f6:ee2850f8d30e18dbba294e1dfcd7b4ba:116a63da2c4587d35860e0', 'A_POSITIVO'::"TipoSanguineo", 'SUS', 'Cristina Freitas', 'Estagiária', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000021', '0c000000-0000-4000-8000-000000000021', '04635000', 'Rua Verbo Divino', '900', 'Chácara Santo Antônio', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000022', '65d5ca8b09cd69500b9e41f5:780ae752d7ec79de1e3632d3b15b3aae:4c944f5775c90d7e422985', '1d621efc9ab800dce54abc31e8134f5fa4bfbc1c4c325432bdc77880bdeece44', '521d3a0432a4d9de8d9e3b5f:eb9052f2a244c6f6731aa564a1ec7b4f:7d8634c7ca731a2f7dc0606514d815325a77a18a', 'Sérgio A.', '1968-08-21', 'MASCULINO'::"SexoBiologico", '7f1e9617fe8cf1854a3e9358:213e7c33e5e4e67a297fcc3d42c11a21:27d9609d535098628c4a6c', 'B_POSITIVO'::"TipoSanguineo", 'Golden Cross', 'Luiza Azevedo', 'Gerente comercial', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000022', '0c000000-0000-4000-8000-000000000022', '04711030', 'Av. das Nações Unidas', '14000', 'Vila Gertrudes', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000211', '0c000000-0000-4000-8000-000000000022', 'ATENOLOL', '50MG', '1X AO DIA', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000023', '18817a3a2bc2633fa071ff78:a57f6e7fc8902c6c06562e608424dc06:fd473c329d5b248274bcea', '4df03f0b0062a12cb1a9a247ca6053ede3852a13bf03b4e53db9b7e436124269', 'd3bbb9f84e39212240696276:27cf23939cc3cce750629f713cb1fcfe:a521d0bef107c4def8edcc889a49e3e211761b914ef0cef7', 'Helena V.', '1945-03-03', 'FEMININO'::"SexoBiologico", '5462121510432b3cd09f71f7:995775df48f84c5750a49550db18668e:bccd9cafc7c039dd464779', 'O_POSITIVO'::"TipoSanguineo", 'SUS', 'Moura Vasconcelos', 'Aposentada', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000023', '0c000000-0000-4000-8000-000000000023', '01222000', 'Rua da Consolação', '2000', 'Consolação', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000221', '0c000000-0000-4000-8000-000000000023', 'FRUTOS DO MAR', 'Grave', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000221', '0c000000-0000-4000-8000-000000000023', 'INSULINA NPH', '20UI', '2X AO DIA', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000222', '0c000000-0000-4000-8000-000000000023', 'METFORMINA', '850MG', '2X AO DIA', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000024', '5472376007c67f7773aab20f:8e3474f8f030e4aa5a15f34da902e036:d9aaf7fea1e41e1be2d62f', 'ff4a9f1da816b555f79298913d38d0a100b271548fb1588e89c466a7f658dd90', 'c9d1110e45c99c86a141477a:ab11af08e81f254836944c44f4ccbd71:468346f5c5b6b883965e85287c72a73a30ba243e', 'Bruno L.', '1997-06-06', 'MASCULINO'::"SexoBiologico", 'a9cbf745c4ffd0f17fa45e84:f195efe7fd4c554f2969f90eff2deedd:0ca71eecf10ca2c79eacf7', 'A_POSITIVO'::"TipoSanguineo", NULL, 'Henrique Lopes', 'Entregador', 'São Paulo/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000024', '0c000000-0000-4000-8000-000000000024', '05805000', 'Estrada de Itapecerica', '4000', 'Capão Redondo', 'São Paulo', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000025', '9512532b21dc887be87b628b:d0e60ab1329cffd567cca99049131ce7:9f87238775f215eb862e75', '087a6b8cfbac07278217e96a6fc4199406ae683210c3288b8c9822f552e998ea', 'afe9f4299e906e1d9e161577:0e99c6f0794601fd3e55628020a1d72a:3d742afccc75a0281e0193e3d3a31b9864f3dcdb920cc0', 'Carla M.', '1983-10-10', 'FEMININO'::"SexoBiologico", '45d82cd59e5fb5cabf7db091:781ada9310aa2d286310adf7534eac93:34674ec655faba4540a51f', 'AB_POSITIVO'::"TipoSanguineo", 'SUS', 'Beatriz Mendonça', 'Fisioterapeuta', 'Osasco/SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000025', '0c000000-0000-4000-8000-000000000025', '06020000', 'Av. dos Autonomistas', '2500', 'Vila Yara', 'Osasco', 'SP', '2026-08-03 23:58:26', '2026-08-03 23:58:26')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000241', '0c000000-0000-4000-8000-000000000025', 'LATEX', 'Moderada', '2026-08-03 23:58:26')
ON CONFLICT (id) DO NOTHING;

-- Atendimentos, triagens, prontuários, exames, chamadas, auditoria
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000001', '20260803-0001DEMO', '0c000000-0000-4000-8000-000000000001', NULL, 'AGUARDANDO_TRIAGEM'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000001', '2026-08-03 22:58:27', '2026-08-03 22:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000001', 'AGUARDANDO_TRIAGEM', '127.0.0.1', '2026-08-03 22:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000002', '20260803-0002DEMO', '0c000000-0000-4000-8000-000000000002', NULL, 'AGUARDANDO_TRIAGEM'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000002', '2026-08-03 21:58:27', '2026-08-03 21:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000002', 'AGUARDANDO_TRIAGEM', '127.0.0.1', '2026-08-03 21:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000003', '20260803-0003DEMO', '0c000000-0000-4000-8000-000000000003', NULL, 'EM_TRIAGEM'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000001', '2026-08-03 20:58:27', '2026-08-03 20:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000003', 'EM_TRIAGEM', '127.0.0.1', '2026-08-03 20:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000004', '20260803-0004DEMO', '0c000000-0000-4000-8000-000000000004', NULL, 'EM_TRIAGEM'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000003', '2026-08-03 19:58:27', '2026-08-03 19:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000004', 'EM_TRIAGEM', '127.0.0.1', '2026-08-03 19:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000005', '20260803-0005DEMO', '0c000000-0000-4000-8000-000000000005', NULL, 'AGUARDANDO_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000001', '2026-08-03 18:58:27', '2026-08-03 18:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000005', '11000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003', 'AMARELO'::"CorTriagem", 'CEFALEIA INTENSA HÁ 6 HORAS', 'dor', '2026-08-03 18:58:27', '2026-08-03 19:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 7/10', '2026-08-03 18:58:27', '2026-08-03 18:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000005', '12000000-0000-4000-8000-000000000005', 140, 90, 88, 18, 98, 36.8, 7, 70, 170, 24.22, '2026-08-03 19:13:27', '2026-08-03 19:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000005', '11000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-08-03 19:28:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000005', 'AGUARDANDO_ATENDIMENTO', '127.0.0.1', '2026-08-03 18:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000006', '20260803-0006DEMO', '0c000000-0000-4000-8000-000000000006', NULL, 'AGUARDANDO_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000002', '2026-08-03 17:58:27', '2026-08-03 17:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000006', '11000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003', 'LARANJA'::"CorTriagem", 'DISPNEIA E SIBILÂNCIA', 'dispneia', '2026-08-03 17:58:27', '2026-08-03 18:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 3/10', '2026-08-03 17:58:27', '2026-08-03 17:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000006', '12000000-0000-4000-8000-000000000006', 130, 85, 110, 28, 91, 37.2, 3, 70, 170, 24.22, '2026-08-03 18:13:27', '2026-08-03 18:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000006', '11000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-08-03 18:28:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000006', 'AGUARDANDO_ATENDIMENTO', '127.0.0.1', '2026-08-03 17:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000007', '20260803-0007DEMO', '0c000000-0000-4000-8000-000000000007', NULL, 'AGUARDANDO_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000001', '2026-08-03 21:58:27', '2026-08-03 21:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000007', '11000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 'VERDE'::"CorTriagem", 'LACERAÇÃO EM MÃO DIREITA', 'trauma', '2026-08-03 21:58:27', '2026-08-03 22:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 4/10', '2026-08-03 21:58:27', '2026-08-03 21:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000007', '12000000-0000-4000-8000-000000000007', 120, 78, 76, 16, 99, 36.5, 4, 70, 170, 24.22, '2026-08-03 22:13:27', '2026-08-03 22:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000007', '11000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-08-03 22:28:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000007', 'AGUARDANDO_ATENDIMENTO', '127.0.0.1', '2026-08-03 21:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000008', '20260803-0008DEMO', '0c000000-0000-4000-8000-000000000008', NULL, 'AGUARDANDO_ATENDIMENTO'::"StatusAtendimento", 'Ambulatório', NULL, '0b000000-0000-4000-8000-000000000004', '2026-08-03 15:58:27', '2026-08-03 15:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000008', '11000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000003', 'AZUL'::"CorTriagem", 'RENOVAÇÃO DE RECEITUÁRIO', 'outro', '2026-08-03 15:58:27', '2026-08-03 16:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 0/10', '2026-08-03 15:58:27', '2026-08-03 15:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000008', '12000000-0000-4000-8000-000000000008', 118, 76, 72, 14, 99, 36.4, 0, 70, 170, 24.22, '2026-08-03 16:13:27', '2026-08-03 16:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000008', '11000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-08-03 16:28:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000008', 'AGUARDANDO_ATENDIMENTO', '127.0.0.1', '2026-08-03 15:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000009', '20260803-0009DEMO', '0c000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000002', 'EM_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-08-03 19:58:27', '2026-08-03 19:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000009', '11000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'VERMELHO'::"CorTriagem", 'DOR TORÁCICA SÚBITA COM IRRADIAÇÃO', 'dor', '2026-08-03 19:58:27', '2026-08-03 20:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 9/10', '2026-08-03 19:58:27', '2026-08-03 19:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000009', '12000000-0000-4000-8000-000000000009', 90, 60, 120, 24, 94, 36.9, 9, 70, 170, 24.22, '2026-08-03 20:13:27', '2026-08-03 20:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000009', '11000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-08-03 20:28:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000009', 'EM_ATENDIMENTO', '127.0.0.1', '2026-08-03 19:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000010', '20260803-0010DEMO', '0c000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000002', 'EM_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000002', '2026-08-03 20:58:27', '2026-08-03 20:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000010', '11000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000003', 'AMARELO'::"CorTriagem", 'FEBRE E MIALGIA HÁ 2 DIAS', 'febre', '2026-08-03 20:58:27', '2026-08-03 21:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 5/10', '2026-08-03 20:58:27', '2026-08-03 20:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000010', '12000000-0000-4000-8000-000000000010', 125, 80, 98, 20, 97, 38.5, 5, 70, 170, 24.22, '2026-08-03 21:13:27', '2026-08-03 21:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000010', '11000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-08-03 21:28:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000010', 'EM_ATENDIMENTO', '127.0.0.1', '2026-08-03 20:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000011', '20260803-0011DEMO', '0c000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000002', 'EM_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-08-03 21:58:27', '2026-08-03 21:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000011', '11000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000003', 'LARANJA'::"CorTriagem", 'VÔMITOS PERSISTENTES', 'vomito', '2026-08-03 21:58:27', '2026-08-03 22:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 6/10', '2026-08-03 21:58:27', '2026-08-03 21:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000011', '12000000-0000-4000-8000-000000000011', 100, 65, 105, 22, 96, 37, 6, 70, 170, 24.22, '2026-08-03 22:13:27', '2026-08-03 22:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000011', '11000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-08-03 22:28:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000011', 'EM_ATENDIMENTO', '127.0.0.1', '2026-08-03 21:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000012', '20260803-0012DEMO', '0c000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-08-02 23:58:27', '2026-08-02 23:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000012', '11000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000003', 'VERDE'::"CorTriagem", 'ENTORSE DE TORNOZELO', 'trauma', '2026-08-02 23:58:27', '2026-08-03 00:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 5/10', '2026-08-02 23:58:27', '2026-08-02 23:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000012', '12000000-0000-4000-8000-000000000012', 122, 78, 80, 16, 99, 36.6, 5, 70, 170, 24.22, '2026-08-03 00:13:27', '2026-08-03 00:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000012', '11000000-0000-4000-8000-000000000012', '2026-08-02 23:58:27', '2026-08-02 23:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000012', '14000000-0000-4000-8000-000000000012', 'ENTORSE DE TORNOZELO', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-08-02 23:58:27', '2026-08-02 23:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000012', '14000000-0000-4000-8000-000000000012', 'S93.4', 'Entorse e distensão do tornozelo', 'Entorse e distensão do tornozelo', TRUE, '2026-08-02 23:58:27', '2026-08-02 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000012', '14000000-0000-4000-8000-000000000012', 1, '2026-08-02 23:58:27', 'Prescrição demo', '2026-08-02 23:58:27', '2026-08-02 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000012', '17000000-0000-4000-8000-000000000012', 'DIPIRONA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-08-02 23:58:27', '2026-08-02 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000012', '18000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-08-02 23:58:27', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-08-02 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000012', '14000000-0000-4000-8000-000000000012', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-08-02 23:58:27', '2026-08-02 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000012', '19000000-0000-4000-8000-000000000012', 'Raio-X tornozelo', 'Item demo SQL', '2026-08-02 23:58:27', '2026-08-02 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000012', '14000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-08-02 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000012', 'CONCLUIDO', '127.0.0.1', '2026-08-02 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000013', '20260803-0013DEMO', '0c000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000003', '2026-08-02 21:58:27', '2026-08-02 21:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000013', '11000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000003', 'AMARELO'::"CorTriagem", 'DOR ABDOMINAL DIFUSA', 'dor', '2026-08-02 21:58:27', '2026-08-02 22:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 7/10', '2026-08-02 21:58:27', '2026-08-02 21:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000013', '12000000-0000-4000-8000-000000000013', 128, 82, 92, 18, 98, 37.1, 7, 70, 170, 24.22, '2026-08-02 22:13:27', '2026-08-02 22:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000013', '11000000-0000-4000-8000-000000000013', '2026-08-02 21:58:27', '2026-08-02 21:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000013', '14000000-0000-4000-8000-000000000013', 'DOR ABDOMINAL DIFUSA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-08-02 21:58:27', '2026-08-02 21:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000013', '14000000-0000-4000-8000-000000000013', 'K52.9', 'Gastroenterite não especificada', 'Gastroenterite não especificada', TRUE, '2026-08-02 21:58:27', '2026-08-02 21:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000013', '14000000-0000-4000-8000-000000000013', 1, '2026-08-02 21:58:27', 'Prescrição demo', '2026-08-02 21:58:27', '2026-08-02 21:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000013', '17000000-0000-4000-8000-000000000013', 'BUSCOPAN', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-08-02 21:58:27', '2026-08-02 21:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000013', '18000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-08-02 21:58:27', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-08-02 21:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000013', '14000000-0000-4000-8000-000000000013', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-08-02 21:58:27', '2026-08-02 21:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000013', '19000000-0000-4000-8000-000000000013', 'Hemograma completo', 'Item demo SQL', '2026-08-02 21:58:27', '2026-08-02 21:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000013', '14000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-08-02 21:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000013', 'CONCLUIDO', '127.0.0.1', '2026-08-02 21:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000014', '20260803-0014DEMO', '0c000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-08-02 17:58:27', '2026-08-02 17:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000014', '11000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000003', 'VERDE'::"CorTriagem", 'CISTITE — DISÚRIA', 'outro', '2026-08-02 17:58:27', '2026-08-02 18:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 4/10', '2026-08-02 17:58:27', '2026-08-02 17:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000014', '12000000-0000-4000-8000-000000000014', 115, 75, 78, 16, 99, 36.7, 4, 70, 170, 24.22, '2026-08-02 18:13:27', '2026-08-02 18:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000014', '11000000-0000-4000-8000-000000000014', '2026-08-02 17:58:27', '2026-08-02 17:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000014', '14000000-0000-4000-8000-000000000014', 'CISTITE — DISÚRIA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-08-02 17:58:27', '2026-08-02 17:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000014', '14000000-0000-4000-8000-000000000014', 'N39.0', 'Infecção do trato urinário', 'Infecção do trato urinário', TRUE, '2026-08-02 17:58:27', '2026-08-02 17:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000014', '14000000-0000-4000-8000-000000000014', 1, '2026-08-02 17:58:27', 'Prescrição demo', '2026-08-02 17:58:27', '2026-08-02 17:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000014', '17000000-0000-4000-8000-000000000014', 'CIPROFLOXACINO', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-08-02 17:58:27', '2026-08-02 17:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000014', '18000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-08-02 17:58:27', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-08-02 17:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000014', '14000000-0000-4000-8000-000000000014', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-08-02 17:58:27', '2026-08-02 17:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000014', '19000000-0000-4000-8000-000000000014', 'EAS / Urina tipo I', 'Item demo SQL', '2026-08-02 17:58:27', '2026-08-02 17:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000014', '14000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-08-02 17:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000014', 'CONCLUIDO', '127.0.0.1', '2026-08-02 17:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000015', '20260803-0015DEMO', '0c000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Ambulatório', 'Consultório 01', '0b000000-0000-4000-8000-000000000004', '2026-08-01 23:58:27', '2026-08-01 23:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000015', '11000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000003', 'AZUL'::"CorTriagem", 'CONSULTA DE ROTINA — HAS', 'outro', '2026-08-01 23:58:27', '2026-08-02 00:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 0/10', '2026-08-01 23:58:27', '2026-08-01 23:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000015', '12000000-0000-4000-8000-000000000015', 135, 88, 74, 14, 99, 36.5, 0, 70, 170, 24.22, '2026-08-02 00:13:27', '2026-08-02 00:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000015', '11000000-0000-4000-8000-000000000015', '2026-08-01 23:58:27', '2026-08-01 23:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000015', '14000000-0000-4000-8000-000000000015', 'CONSULTA DE ROTINA — HAS', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-08-01 23:58:27', '2026-08-01 23:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000015', '14000000-0000-4000-8000-000000000015', 'I10', 'Hipertensão essencial', 'Hipertensão essencial', TRUE, '2026-08-01 23:58:27', '2026-08-01 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000015', '14000000-0000-4000-8000-000000000015', 1, '2026-08-01 23:58:27', 'Prescrição demo', '2026-08-01 23:58:27', '2026-08-01 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000015', '17000000-0000-4000-8000-000000000015', 'LOSARTANA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-08-01 23:58:27', '2026-08-01 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000015', '18000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-08-01 23:58:27', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-08-01 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000015', '14000000-0000-4000-8000-000000000015', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-08-01 23:58:27', '2026-08-01 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000015', '19000000-0000-4000-8000-000000000015', 'Creatinina / Ureia', 'Item demo SQL', '2026-08-01 23:58:27', '2026-08-01 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000015', '14000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-08-01 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000015', 'CONCLUIDO', '127.0.0.1', '2026-08-01 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000016', '20260803-0016DEMO', '0c000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-08-02 11:58:27', '2026-08-02 11:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000016', '11000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000003', 'AMARELO'::"CorTriagem", 'CORTE PROFUNDO EM ANTEBRAÇO', 'sangramento', '2026-08-02 11:58:27', '2026-08-02 12:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 6/10', '2026-08-02 11:58:27', '2026-08-02 11:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000016', '12000000-0000-4000-8000-000000000016', 118, 72, 95, 18, 98, 36.8, 6, 70, 170, 24.22, '2026-08-02 12:13:27', '2026-08-02 12:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000016', '11000000-0000-4000-8000-000000000016', '2026-08-02 11:58:27', '2026-08-02 11:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000016', '14000000-0000-4000-8000-000000000016', 'CORTE PROFUNDO EM ANTEBRAÇO', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-08-02 11:58:27', '2026-08-02 11:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000016', '14000000-0000-4000-8000-000000000016', 'S51.0', 'Ferimento do antebraço', 'Ferimento do antebraço', TRUE, '2026-08-02 11:58:27', '2026-08-02 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000016', '14000000-0000-4000-8000-000000000016', 1, '2026-08-02 11:58:27', 'Prescrição demo', '2026-08-02 11:58:27', '2026-08-02 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000016', '17000000-0000-4000-8000-000000000016', 'AMOXICILINA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-08-02 11:58:27', '2026-08-02 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000016', '18000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-08-02 11:58:27', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-08-02 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000016', '14000000-0000-4000-8000-000000000016', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-08-02 11:58:27', '2026-08-02 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000016', '19000000-0000-4000-8000-000000000016', 'Raio-X antebraço', 'Item demo SQL', '2026-08-02 11:58:27', '2026-08-02 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000016', '14000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-08-02 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000016', 'CONCLUIDO', '127.0.0.1', '2026-08-02 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000017', '20260803-0017DEMO', '0c000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000002', '2026-08-02 07:58:27', '2026-08-02 07:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000017', '11000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000003', 'LARANJA'::"CorTriagem", 'REBAIXAMENTO DO NÍVEL DE CONSCIÊNCIA', 'alteracao_consciencia', '2026-08-02 07:58:27', '2026-08-02 08:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 0/10', '2026-08-02 07:58:27', '2026-08-02 07:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000017', '12000000-0000-4000-8000-000000000017', 160, 100, 58, 12, 95, 36.2, 0, 70, 170, 24.22, '2026-08-02 08:13:27', '2026-08-02 08:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000017', '11000000-0000-4000-8000-000000000017', '2026-08-02 07:58:27', '2026-08-02 07:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000017', '14000000-0000-4000-8000-000000000017', 'REBAIXAMENTO DO NÍVEL DE CONSCIÊNCIA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-08-02 07:58:27', '2026-08-02 07:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000017', '14000000-0000-4000-8000-000000000017', 'I63.9', 'Infarto cerebral', 'Infarto cerebral', TRUE, '2026-08-02 07:58:27', '2026-08-02 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000017', '14000000-0000-4000-8000-000000000017', 1, '2026-08-02 07:58:27', 'Prescrição demo', '2026-08-02 07:58:27', '2026-08-02 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000017', '17000000-0000-4000-8000-000000000017', 'MANITOL', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-08-02 07:58:27', '2026-08-02 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000017', '18000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-08-02 07:58:27', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-08-02 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000017', '14000000-0000-4000-8000-000000000017', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-08-02 07:58:27', '2026-08-02 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000017', '19000000-0000-4000-8000-000000000017', 'TC crânio', 'Item demo SQL', '2026-08-02 07:58:27', '2026-08-02 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000017', '14000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-08-02 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000017', 'CONCLUIDO', '127.0.0.1', '2026-08-02 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000018', '20260803-0018DEMO', '0c000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-08-01 19:58:27', '2026-08-01 19:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000018', '11000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000003', 'VERDE'::"CorTriagem", 'FEBRE E TOSSE PRODUTIVA', 'febre', '2026-08-01 19:58:27', '2026-08-01 20:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 2/10', '2026-08-01 19:58:27', '2026-08-01 19:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000018', '12000000-0000-4000-8000-000000000018', 120, 78, 88, 20, 97, 38.2, 2, 70, 170, 24.22, '2026-08-01 20:13:27', '2026-08-01 20:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000018', '11000000-0000-4000-8000-000000000018', '2026-08-01 19:58:27', '2026-08-01 19:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000018', '14000000-0000-4000-8000-000000000018', 'FEBRE E TOSSE PRODUTIVA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-08-01 19:58:27', '2026-08-01 19:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000018', '14000000-0000-4000-8000-000000000018', 'J18.9', 'Pneumonia não especificada', 'Pneumonia não especificada', TRUE, '2026-08-01 19:58:27', '2026-08-01 19:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000018', '14000000-0000-4000-8000-000000000018', 1, '2026-08-01 19:58:27', 'Prescrição demo', '2026-08-01 19:58:27', '2026-08-01 19:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000018', '17000000-0000-4000-8000-000000000018', 'AZITROMICINA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-08-01 19:58:27', '2026-08-01 19:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000018', '18000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-08-01 19:58:27', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-08-01 19:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000018', '14000000-0000-4000-8000-000000000018', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-08-01 19:58:27', '2026-08-01 19:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000018', '19000000-0000-4000-8000-000000000018', 'Raio-X tórax PA', 'Item demo SQL', '2026-08-01 19:58:27', '2026-08-01 19:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000018', '14000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-08-01 19:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000018', 'CONCLUIDO', '127.0.0.1', '2026-08-01 19:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000019', '20260803-0019DEMO', '0c000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000002', 'ALTA'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-07-31 23:58:27', '2026-07-31 23:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000019', '11000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000003', 'VERDE'::"CorTriagem", 'CRISE DE ENXAQUECA', 'dor', '2026-07-31 23:58:27', '2026-08-01 00:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 8/10', '2026-07-31 23:58:27', '2026-07-31 23:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000019', '12000000-0000-4000-8000-000000000019', 125, 80, 82, 16, 99, 36.6, 8, 70, 170, 24.22, '2026-08-01 00:13:27', '2026-08-01 00:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000019', '11000000-0000-4000-8000-000000000019', '2026-07-31 23:58:27', '2026-07-31 23:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000019', '14000000-0000-4000-8000-000000000019', 'CRISE DE ENXAQUECA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-07-31 23:58:27', '2026-07-31 23:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000019', '14000000-0000-4000-8000-000000000019', 'G43.9', 'Enxaqueca', 'Enxaqueca', TRUE, '2026-07-31 23:58:27', '2026-07-31 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000019', '14000000-0000-4000-8000-000000000019', 1, '2026-07-31 23:58:27', 'Prescrição demo', '2026-07-31 23:58:27', '2026-07-31 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000019', '17000000-0000-4000-8000-000000000019', 'SUMATRIPTANO', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-07-31 23:58:27', '2026-07-31 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000019', '18000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-07-31 23:58:27', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-07-31 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000019', '14000000-0000-4000-8000-000000000019', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-07-31 23:58:27', '2026-07-31 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000019', '19000000-0000-4000-8000-000000000019', 'Nenhum', 'Item demo SQL', '2026-07-31 23:58:27', '2026-07-31 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000019', '14000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-07-31 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000019', 'ALTA', '127.0.0.1', '2026-07-31 23:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000020', '20260803-0020DEMO', '0c000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000002', 'ALTA'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000003', '2026-07-31 15:58:27', '2026-07-31 15:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000020', '11000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000003', 'AMARELO'::"CorTriagem", 'QUEIMADURA DE 1º GRAU', 'trauma', '2026-07-31 15:58:27', '2026-07-31 16:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 5/10', '2026-07-31 15:58:27', '2026-07-31 15:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000020', '12000000-0000-4000-8000-000000000020', 122, 78, 84, 16, 99, 36.5, 5, 70, 170, 24.22, '2026-07-31 16:13:27', '2026-07-31 16:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000020', '11000000-0000-4000-8000-000000000020', '2026-07-31 15:58:27', '2026-07-31 15:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000020', '14000000-0000-4000-8000-000000000020', 'QUEIMADURA DE 1º GRAU', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-07-31 15:58:27', '2026-07-31 15:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000020', '14000000-0000-4000-8000-000000000020', 'T30.1', 'Queimadura de primeiro grau', 'Queimadura de primeiro grau', TRUE, '2026-07-31 15:58:27', '2026-07-31 15:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000020', '14000000-0000-4000-8000-000000000020', 1, '2026-07-31 15:58:27', 'Prescrição demo', '2026-07-31 15:58:27', '2026-07-31 15:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000020', '17000000-0000-4000-8000-000000000020', 'DIPIRONA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-07-31 15:58:27', '2026-07-31 15:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000020', '18000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-07-31 15:58:27', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-07-31 15:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000020', '14000000-0000-4000-8000-000000000020', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-07-31 15:58:27', '2026-07-31 15:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000020', '19000000-0000-4000-8000-000000000020', 'Curativo local', 'Item demo SQL', '2026-07-31 15:58:27', '2026-07-31 15:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000020', '14000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-07-31 15:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000020', 'ALTA', '127.0.0.1', '2026-07-31 15:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000021', '20260803-0021DEMO', '0c000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000002', 'INTERNADO'::"StatusAtendimento", 'Emergência', 'Consultório 01', '0b000000-0000-4000-8000-000000000002', '2026-08-03 11:58:27', '2026-08-03 11:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000021', '11000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000003', 'VERMELHO'::"CorTriagem", 'PCR REVERTIDA — INSTABILIDADE HEMODINÂMICA', 'alteracao_consciencia', '2026-08-03 11:58:27', '2026-08-03 12:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 0/10', '2026-08-03 11:58:27', '2026-08-03 11:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000021', '12000000-0000-4000-8000-000000000021', 85, 55, 130, 26, 88, 35.8, 0, 70, 170, 24.22, '2026-08-03 12:13:27', '2026-08-03 12:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000021', '11000000-0000-4000-8000-000000000021', '2026-08-03 11:58:27', '2026-08-03 11:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000021', '14000000-0000-4000-8000-000000000021', 'PCR REVERTIDA — INSTABILIDADE HEMODINÂMICA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-08-03 11:58:27', '2026-08-03 11:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000021', '14000000-0000-4000-8000-000000000021', 'I46.9', 'Parada cardíaca', 'Parada cardíaca', TRUE, '2026-08-03 11:58:27', '2026-08-03 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000021', '14000000-0000-4000-8000-000000000021', 1, '2026-08-03 11:58:27', 'Prescrição demo', '2026-08-03 11:58:27', '2026-08-03 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000021', '17000000-0000-4000-8000-000000000021', 'ADRENALINA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'PENDENTE'::"StatusPrescricaoItem", '2026-08-03 11:58:27', '2026-08-03 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000021', '14000000-0000-4000-8000-000000000021', 'LABORATORIO'::"CategoriaExame", 'EMERGENCIAL'::"UrgenciaExame", 'Investigação clínica demo', '2026-08-03 11:58:27', '2026-08-03 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000021', '19000000-0000-4000-8000-000000000021', 'ECG 12 derivações', 'Item demo SQL', '2026-08-03 11:58:27', '2026-08-03 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000021', '14000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-08-03 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO encaminhamentos (id, "prontuarioId", tipo, especialidade, prioridade, "resumoClinco", "createdAt", "updatedAt")
VALUES ('1d000000-0000-4000-8000-000000000021', '14000000-0000-4000-8000-000000000021', 'INTERNACAO'::"TipoEncaminhamento", 'Clínica Médica', 'Alta', 'Internação para observação.', '2026-08-03 11:58:27', '2026-08-03 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000021', 'INTERNADO', '127.0.0.1', '2026-08-03 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000022', '20260803-0022DEMO', '0c000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-08-03 03:58:27', '2026-08-03 03:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000022', '11000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000003', 'CINZA'::"CorTriagem", 'OBSERVAÇÃO PÓS-PROCEDIMENTO', 'outro', '2026-08-03 03:58:27', '2026-08-03 04:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 1/10', '2026-08-03 03:58:27', '2026-08-03 03:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000022', '12000000-0000-4000-8000-000000000022', 118, 76, 70, 14, 99, 36.4, 1, 70, 170, 24.22, '2026-08-03 04:13:27', '2026-08-03 04:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000022', '11000000-0000-4000-8000-000000000022', '2026-08-03 03:58:27', '2026-08-03 03:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000022', '14000000-0000-4000-8000-000000000022', 'OBSERVAÇÃO PÓS-PROCEDIMENTO', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-08-03 03:58:27', '2026-08-03 03:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000022', '14000000-0000-4000-8000-000000000022', 'Z09', 'Seguimento pós-tratamento', 'Seguimento pós-tratamento', TRUE, '2026-08-03 03:58:27', '2026-08-03 03:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000022', '14000000-0000-4000-8000-000000000022', 1, '2026-08-03 03:58:27', 'Prescrição demo', '2026-08-03 03:58:27', '2026-08-03 03:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000022', '17000000-0000-4000-8000-000000000022', 'PARACETAMOL', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-08-03 03:58:27', '2026-08-03 03:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000022', '18000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-08-03 03:58:27', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-08-03 03:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000022', '14000000-0000-4000-8000-000000000022', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-08-03 03:58:27', '2026-08-03 03:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000022', '19000000-0000-4000-8000-000000000022', 'Observação clínica', 'Item demo SQL', '2026-08-03 03:58:27', '2026-08-03 03:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000022', '14000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-08-03 03:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000022', 'CONCLUIDO', '127.0.0.1', '2026-08-03 03:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000023', '20260803-0023DEMO', '0c000000-0000-4000-8000-000000000023', NULL, 'AGUARDANDO_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000005', '2026-08-03 22:58:27', '2026-08-03 22:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000023', '11000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000003', 'LARANJA'::"CorTriagem", 'AGRESSÃO FÍSICA — TRAUMA FACIAL', 'trauma', '2026-08-03 22:58:27', '2026-08-03 23:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 8/10', '2026-08-03 22:58:27', '2026-08-03 22:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000023', '12000000-0000-4000-8000-000000000023', 145, 92, 102, 20, 97, 36.9, 8, 70, 170, 24.22, '2026-08-03 23:13:27', '2026-08-03 23:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000023', '11000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-08-03 23:28:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000023', 'AGUARDANDO_ATENDIMENTO', '127.0.0.1', '2026-08-03 22:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000024', '20260803-0024DEMO', '0c000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-08-03 07:58:27', '2026-08-03 07:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000024', '11000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000003', 'VERDE'::"CorTriagem", 'CORPO ESTRANHO NO OLHO', 'outro', '2026-08-03 07:58:27', '2026-08-03 08:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 3/10', '2026-08-03 07:58:27', '2026-08-03 07:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000024', '12000000-0000-4000-8000-000000000024', 120, 78, 76, 16, 99, 36.5, 3, 70, 170, 24.22, '2026-08-03 08:13:27', '2026-08-03 08:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000024', '11000000-0000-4000-8000-000000000024', '2026-08-03 07:58:27', '2026-08-03 07:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000024', '14000000-0000-4000-8000-000000000024', 'CORPO ESTRANHO NO OLHO', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-08-03 07:58:27', '2026-08-03 07:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000024', '14000000-0000-4000-8000-000000000024', 'T15.0', 'Corpo estranho na córnea', 'Corpo estranho na córnea', TRUE, '2026-08-03 07:58:27', '2026-08-03 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000024', '14000000-0000-4000-8000-000000000024', 1, '2026-08-03 07:58:27', 'Prescrição demo', '2026-08-03 07:58:27', '2026-08-03 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000024', '17000000-0000-4000-8000-000000000024', 'TOBRAMICINA COLÍRIO', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-08-03 07:58:27', '2026-08-03 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000024', '18000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-08-03 07:58:27', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-08-03 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000024', '14000000-0000-4000-8000-000000000024', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-08-03 07:58:27', '2026-08-03 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000024', '19000000-0000-4000-8000-000000000024', 'Exame oftalmológico', 'Item demo SQL', '2026-08-03 07:58:27', '2026-08-03 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000024', '14000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-08-03 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000024', 'CONCLUIDO', '127.0.0.1', '2026-08-03 07:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000025', '20260803-0025DEMO', '0c000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Ambulatório', 'Consultório 01', '0b000000-0000-4000-8000-000000000004', '2026-08-01 11:58:27', '2026-08-01 11:58:27')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000025', '11000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000003', 'AZUL'::"CorTriagem", 'DOR LOMBAR CRÔNICA AGUDIZADA', 'dor', '2026-08-01 11:58:27', '2026-08-01 12:13:27', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 6/10', '2026-08-01 11:58:27', '2026-08-01 11:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000025', '12000000-0000-4000-8000-000000000025', 128, 84, 80, 16, 99, 36.6, 6, 70, 170, 24.22, '2026-08-01 12:13:27', '2026-08-01 12:13:27')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000025', '11000000-0000-4000-8000-000000000025', '2026-08-01 11:58:27', '2026-08-01 11:58:27')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000025', '14000000-0000-4000-8000-000000000025', 'DOR LOMBAR CRÔNICA AGUDIZADA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-08-01 11:58:27', '2026-08-01 11:58:27')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000025', '14000000-0000-4000-8000-000000000025', 'M54.5', 'Dor lombar baixa', 'Dor lombar baixa', TRUE, '2026-08-01 11:58:27', '2026-08-01 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000025', '14000000-0000-4000-8000-000000000025', 1, '2026-08-01 11:58:27', 'Prescrição demo', '2026-08-01 11:58:27', '2026-08-01 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000025', '17000000-0000-4000-8000-000000000025', 'CICLOBENZAPRINA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-08-01 11:58:27', '2026-08-01 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000025', '18000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-08-01 11:58:27', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-08-01 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000025', '14000000-0000-4000-8000-000000000025', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-08-01 11:58:27', '2026-08-01 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000025', '19000000-0000-4000-8000-000000000025', 'Raio-X coluna lombar', 'Item demo SQL', '2026-08-01 11:58:27', '2026-08-01 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000025', '14000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-08-01 11:58:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000025', 'CONCLUIDO', '127.0.0.1', '2026-08-01 11:58:27')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Fim — 25 pacientes, 25 atendimentos demo
