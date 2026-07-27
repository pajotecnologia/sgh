-- =============================================================================
-- SGH — Dados de demonstração (INSERT completo)
-- Gerado em: 2026-05-22T21:32:34.015Z
--
-- PRÉ-REQUISITO: executar database/sgh_schema_completo.sql antes
--
-- IMPORTANTE — chaves no .env da aplicação DEVEM ser iguais às usadas na geração:
--   ENCRYPTION_KEY (64 hex) — descriptografia de CPF/nome/telefone
--   NEXTAUTH_SECRET — hash de busca por CPF (cpfHash)
--
-- DATAS: atendimentos/triagens usam timestamps relativos à geração (2026-05-22).
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
VALUES ('a0000000-0000-4000-8000-000000000001', 'admin@hospital.com', '$2b$12$QPFtKZXTT6h8xu8.kaof8u/BXLDtwIaRSfxD6ww8zPOcUWPGr2s.O', 'Administrador Sistema', 'ADMIN'::"Role", NULL, NULL, TRUE, FALSE, '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;
INSERT INTO usuarios (id, email, "senhaHash", nome, role, crm, coren, ativo, "mfaAtivo", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000002', 'medico@hospital.com', '$2b$12$QPFtKZXTT6h8xu8.kaof8u/BXLDtwIaRSfxD6ww8zPOcUWPGr2s.O', 'Dr. Carlos Mendes', 'MEDICO'::"Role", '123456-SP', NULL, TRUE, FALSE, '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;
INSERT INTO usuarios (id, email, "senhaHash", nome, role, crm, coren, ativo, "mfaAtivo", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000003', 'enfermeiro@hospital.com', '$2b$12$QPFtKZXTT6h8xu8.kaof8u/BXLDtwIaRSfxD6ww8zPOcUWPGr2s.O', 'Enf. Ana Beatriz Lima', 'ENFERMEIRO'::"Role", NULL, 'COREN-SP 654321', TRUE, FALSE, '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;
INSERT INTO usuarios (id, email, "senhaHash", nome, role, crm, coren, ativo, "mfaAtivo", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000004', 'recepcao@hospital.com', '$2b$12$QPFtKZXTT6h8xu8.kaof8u/BXLDtwIaRSfxD6ww8zPOcUWPGr2s.O', 'Joana Silva Santos', 'RECEPCIONISTA'::"Role", NULL, NULL, TRUE, FALSE, '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;
INSERT INTO usuarios (id, email, "senhaHash", nome, role, crm, coren, ativo, "mfaAtivo", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000005', 'diretor@hospital.com', '$2b$12$QPFtKZXTT6h8xu8.kaof8u/BXLDtwIaRSfxD6ww8zPOcUWPGr2s.O', 'Dr. Roberto Faria', 'DIRETOR_CLINICO'::"Role", '789012-SP', NULL, TRUE, FALSE, '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;
INSERT INTO usuarios (id, email, "senhaHash", nome, role, crm, coren, ativo, "mfaAtivo", "createdAt", "updatedAt")
VALUES ('a0000000-0000-4000-8000-000000000006', 'tecnico@hospital.com', '$2b$12$QPFtKZXTT6h8xu8.kaof8u/BXLDtwIaRSfxD6ww8zPOcUWPGr2s.O', 'Téc. Enf. Paulo Rocha', 'TECNICO_ENFERMAGEM'::"Role", NULL, NULL, TRUE, FALSE, '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = TRUE;

-- Instituição e configurações
INSERT INTO instituicoes (id, "nomeMunicipio", "nomeInstituicao", endereco, bairro, cidade, estado, cep, "updatedAt")
VALUES ('b0000000-0000-4000-8000-000000000001', 'Município Demo', 'Hospital Municipal Central', 'Av. Principal, 1000', 'Centro', 'São Paulo', 'SP', '01001000', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;

INSERT INTO config_painel (id, "vozAtiva", "tipoVoz", "corPrimaria", "corSecundaria", "corTexto", "mensagemPadrao", "velocidadeVoz", "updatedAt")
VALUES ('c0000000-0000-4000-8000-000000000001', TRUE, 'feminina', '#2563eb', '#f8fafc', '#1e293b', 'Comparecer ao consultório', 1.0, '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;

INSERT INTO config_smtp (id, host, porta, secure, usuario, "senhaCriptografada", "emailRemetente", ativo, "createdAt", "updatedAt")
VALUES ('default', '', 587, FALSE, '', '', '', FALSE, '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;


-- Origens de paciente
INSERT INTO origens_pacientes (id, descricao, ativo, "createdAt", "procedenciaFicha")
VALUES ('0b000000-0000-4000-8000-000000000001', 'Demanda espontânea', TRUE, '2026-05-22 21:32:33', 'ESPONTÂNEA')
ON CONFLICT (descricao) DO NOTHING;
INSERT INTO origens_pacientes (id, descricao, ativo, "createdAt", "procedenciaFicha")
VALUES ('0b000000-0000-4000-8000-000000000002', 'SAMU', TRUE, '2026-05-22 21:32:33', 'SAMU')
ON CONFLICT (descricao) DO NOTHING;
INSERT INTO origens_pacientes (id, descricao, ativo, "createdAt", "procedenciaFicha")
VALUES ('0b000000-0000-4000-8000-000000000003', 'UPA referenciada', TRUE, '2026-05-22 21:32:33', 'TRANSFERÊNCIA UPA')
ON CONFLICT (descricao) DO NOTHING;
INSERT INTO origens_pacientes (id, descricao, ativo, "createdAt", "procedenciaFicha")
VALUES ('0b000000-0000-4000-8000-000000000004', 'UBS referenciada', TRUE, '2026-05-22 21:32:33', 'UBS')
ON CONFLICT (descricao) DO NOTHING;
INSERT INTO origens_pacientes (id, descricao, ativo, "createdAt", "procedenciaFicha")
VALUES ('0b000000-0000-4000-8000-000000000005', 'Polícia / resgate', TRUE, '2026-05-22 21:32:33', 'RESGATE')
ON CONFLICT (descricao) DO NOTHING;

-- Pacientes, endereços, alergias, medicamentos
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000001', '5da9e3d0ad5a16fef728a8bb:61eca88a8237c34b0efc68f4bcdfd64b:de5f4f77cd54843cd4c481', '0a16899e5186fd130ad50dc351cd17352439dc0b166a4dff598da8fcb7a7994e', '383ef0d595fb3ec3ec0e20d4:8d863a82f687f0c8aec1401b28248126:eddce2ce6a5d44ef7b9fb8e0a930d4e4dbf8bec3e986', 'Maria S.', '1985-03-12', 'FEMININO'::"SexoBiologico", '6e9412a1e7040342c19ce060:1ad3bf57ba0763ccda5e80224d221206:a93c8ba5df7c977d693b8e', 'O_POSITIVO'::"TipoSanguineo", 'SUS', 'Helena Santos', 'Doméstica', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000001', '0c000000-0000-4000-8000-000000000001', '01310100', 'Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000001', '0c000000-0000-4000-8000-000000000001', 'DIPIRONA', 'Moderada', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000001', '0c000000-0000-4000-8000-000000000001', 'LOSARTANA', '50MG', '1X AO DIA', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO documentos_pacientes (id, "pacienteId", tipo, "nomeArquivo", "mimeType", "tamanhoBytes", "caminhoArquivo", "createdAt")
VALUES ('10000000-0000-4000-8000-000000000001', '0c000000-0000-4000-8000-000000000001', 'RG', 'rg_demo.pdf', 'application/pdf', 1024, 'uploads/demo/rg_1.pdf', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000002', 'd55e4360c3c799f6463f47d7:a97485482f26e88dc365d30119ea7313:b4a97ab4291c1781ee1f5d', '9d1ebbd0e89af702228df5eeb73104ab4f43be2859910b9f05c3e828df31d936', '83c9b88eb2d1c15675967ee7:eead5a8ab09de87a29034f82b515109f:23ac2858ea50768dd60321e50b316811cbdf4263bc', 'João O.', '1972-07-22', 'MASCULINO'::"SexoBiologico", 'dcfd8272d71d8a8bfbf0cd6b:aa777e4b000dba6c5048a09ca20c4517:a4f53bc9a5e3afdbf0d3a8', 'A_POSITIVO'::"TipoSanguineo", NULL, 'Rosa Oliveira', 'Motorista', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000002', '0c000000-0000-4000-8000-000000000002', '04038001', 'Rua Vergueiro', '250', 'Vila Mariana', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000011', '0c000000-0000-4000-8000-000000000002', 'METFORMINA', '850MG', '2X AO DIA', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO documentos_pacientes (id, "pacienteId", tipo, "nomeArquivo", "mimeType", "tamanhoBytes", "caminhoArquivo", "createdAt")
VALUES ('10000000-0000-4000-8000-000000000002', '0c000000-0000-4000-8000-000000000002', 'RG', 'rg_demo.pdf', 'application/pdf', 1024, 'uploads/demo/rg_2.pdf', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000003', '148a47c13e572752980f836c:7f17d239a5a293f6e35902a93fcd5293:55f3e47e4e67aa5863d23c', '374001bc19d794f8fe42068bdecdc3105953b8054c6e4f137593bb83d49c4267', 'ec17f12a619db559607fb166:9cbcdc208a69b81cc848c7c06b5e0ae5:5c44347fc9a09795bd18b92e60ab18a025f147407d4fdec96c', 'Ana L.', '1998-11-05', 'FEMININO'::"SexoBiologico", '5a37a3137473cb41fd09a89c:da7ff17d73dc0d318beed04c21d203bd:e1038f95f340fe35206475', 'B_NEGATIVO'::"TipoSanguineo", 'UNIMED', 'Cláudia Lima', 'Estudante', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000003', '0c000000-0000-4000-8000-000000000003', '04543011', 'Av. Brigadeiro Faria Lima', '1500', 'Itaim Bibi', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000021', '0c000000-0000-4000-8000-000000000003', 'PENICILINA', 'Grave', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO documentos_pacientes (id, "pacienteId", tipo, "nomeArquivo", "mimeType", "tamanhoBytes", "caminhoArquivo", "createdAt")
VALUES ('10000000-0000-4000-8000-000000000003', '0c000000-0000-4000-8000-000000000003', 'RG', 'rg_demo.pdf', 'application/pdf', 1024, 'uploads/demo/rg_3.pdf', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000004', '4bc615415bf6958028c9db6a:59674193781032eeb6d63f72d7d62e8f:f5585f49b00f8f5fb57cfc', 'b7a84b2e1edeaf6b4399f3a3a514215a2c1cb7dd40cb74acc97679d137d1ecb0', 'dc82689faae7c569b843185e:fc7a138fdca35844a64a4e4261985291:54589e49b38d82ba3a3cce9623ae7c41794e37de', 'Pedro S.', '1960-01-18', 'MASCULINO'::"SexoBiologico", '0c5da6cf9d34c3852b3d2f8e:b1a663f9481ed39bc9a4c909c690750e:f79fa998876c61344fee87', 'AB_POSITIVO'::"TipoSanguineo", 'SUS', 'Francisca Souza', 'Aposentado', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000004', '0c000000-0000-4000-8000-000000000004', '03015000', 'Rua do Gasômetro', '88', 'Brás', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000031', '0c000000-0000-4000-8000-000000000004', 'LÁTEX', 'Leve', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000031', '0c000000-0000-4000-8000-000000000004', 'AAS', '100MG', '1X AO DIA', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000032', '0c000000-0000-4000-8000-000000000004', 'SINVASTATINA', '20MG', '1X À NOITE', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000005', '55af364d84fdcbb08a9f243b:8a6431cda1abbe302d52bc6c2783eadd:e9b2480e94c8e332d8ea74', '1e884eb8f4f0284de70f0498f933757c4f777bef4415109ff89826d961ec4f6e', 'f4f7b23fa264bfa600347cf3:2f676ea526f168b2698d0f54b09552e9:9e85a2dab17b82248a06db71fbe0cd86056a', 'Lucia C.', '1990-09-30', 'FEMININO'::"SexoBiologico", '73dabb71a1c5ce1364bc0eb3:63f1459f3ae77312c8bba9197e2af3ef:c44825de8c2b13cdb2f1a8', 'A_NEGATIVO'::"TipoSanguineo", NULL, 'Teresa Costa', 'Enfermeira', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000005', '0c000000-0000-4000-8000-000000000005', '05001000', 'Rua da Consolação', '420', 'Consolação', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000006', 'eb78ff8c0bbdb66fadf10f9f:2b5bd05cc18b971c17aacaa74e913c84:1857e5804671b1bdb813eb', 'aeded3d4cbf890f644e237e98eb9cfc26af7e0e7693e4913ca570e7197e569e5', '7cf92b3d3e07a899e4518d3f:eed044a3fb3135b856dad4b59a607995:fe15a547cbc33f984a99fc78b9966223ed40796b66c49a', 'Roberto P.', '1955-04-08', 'MASCULINO'::"SexoBiologico", '0913242d8dae28a57e8805ab:46ed7efae2e3fc3eeeac21c7948cd424:cfe0c5253a43913622e840', 'O_NEGATIVO'::"TipoSanguineo", 'Bradesco Saúde', 'Maria Pereira', 'Comerciante', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000006', '0c000000-0000-4000-8000-000000000006', '02012000', 'Av. Cel. Sezefredo Fagundes', '1200', 'Tucuruvi', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000051', '0c000000-0000-4000-8000-000000000006', 'DIPIRONA', 'Leve', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000051', '0c000000-0000-4000-8000-000000000006', 'ENALAPRIL', '10MG', '2X AO DIA', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000007', '7d6787e479f372c8352f37fe:6e9b80f3042df6963d6e9a870dfad281:f70dcef709a54bd7a5d7a4', '77847fa3b242898314eb8bf1772a68642b12ba84aba5a74a77b6f11041636357', 'd17dea3db8eac5207bd2b793:3c31b997db85a0bc73218ed16b9fd7cf:9b3cadef207a6ba11ffab095bc0d46313059a43014285f0cc355', 'Fernanda M.', '2001-06-14', 'FEMININO'::"SexoBiologico", 'cbd9ad1edfe32a2dcb74f421:58d2434ebb5316f544795bd8e967c900:8b3b2b60e582d1c7fb8cab', 'O_POSITIVO'::"TipoSanguineo", 'SUS', 'Sandra Martins', 'Auxiliar administrativo', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000007', '0c000000-0000-4000-8000-000000000007', '03102001', 'Rua do Orfanato', '555', 'Vila Prudente', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000008', '735d77386864cf4631840e71:1ff5b54f703de3355d284e16e4482819:e6cd4fc941945b6dcffbff', '5407e17d0714cf29074ef5248e44ecc53bb861baf917c0d1466d2a4231a9fc63', 'd0a5021bf1011f67f7b41402:952bb87cec50979d644bc2230e260913:51ea65ec6098a87d1117727fb3c81cd82b2650035de56e', 'Marcos R.', '1988-12-25', 'MASCULINO'::"SexoBiologico", '1e1be5a4698fe6f583b73140:b0b1c63c9fa116834afb2122a21bb699:a44dbcd79c393d14a4126b', 'B_POSITIVO'::"TipoSanguineo", NULL, 'Aparecida Ribeiro', 'Pedreiro', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000008', '0c000000-0000-4000-8000-000000000008', '08010000', 'Av. Marechal Tito', '3000', 'São Miguel', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000071', '0c000000-0000-4000-8000-000000000008', 'IBUPROFENO', 'Moderada', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000009', 'e992e49ca7b36b73178fa22b:77b90df9a0903285e4b6d8c50f4e9447:54c5ec3077e126bc55e7fe', 'f8d638d382becb34aa7232e2ad26b6e8ca916248bea8b9b6f8486e86cbd7ddad', '3462ff6bde166c7b082aa17e:bbf6118f9b44e95f1acb344c0152ce01:75d774d8c5ab5c6990cd6c3f8c17e1b15e529ebc3a92', 'Juliana N.', '1978-02-17', 'FEMININO'::"SexoBiologico", 'b0b2dce3ff136ec3971cc26f:e599a1f3da2d12e9144edcc99b244a55:7aab312bd43597a2271e32', 'A_POSITIVO'::"TipoSanguineo", 'Amil', 'Neuza Nunes', 'Professora', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000009', '0c000000-0000-4000-8000-000000000009', '05508000', 'Rua Capote Valente', '90', 'Pinheiros', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000081', '0c000000-0000-4000-8000-000000000009', 'LEVOTIROXINA', '75MCG', '1X EM JEJUM', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000010', '3e59a09994a6ca90c5e05f8f:289401e2a9b2cc5cee6f1e3d62c18df9:a3b8bdca71730438b1be62', 'd70c1171c915867c0a05418a9c8021e61069757e6189726eedfc2bb88e53147f', 'b85a47c1e9848f1da6568688:c1854f11a90365ce36f2213f06dde84b:0fb7618943ebc739258910b5e4d4528914b8e2fb89', 'Antonio B.', '1948-08-03', 'MASCULINO'::"SexoBiologico", '9579145cdc4b8fe399c681d3:a323afb06337a8fe2b6e245af48a3e90:75352b3b91cfd658a02f09', 'DESCONHECIDO'::"TipoSanguineo", 'SUS', 'Josefina Barbosa', 'Aposentado', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000010', '0c000000-0000-4000-8000-000000000010', '01001000', 'Praça da Sé', '50', 'Sé', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000091', '0c000000-0000-4000-8000-000000000010', 'CONTRASTE IODADO', 'Grave', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000091', '0c000000-0000-4000-8000-000000000010', 'FUROSEMIDA', '40MG', '1X AO DIA', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000092', '0c000000-0000-4000-8000-000000000010', 'CARVEDILOL', '6,25MG', '2X AO DIA', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000011', '3e571b6eeb643a801f31102c:ab4f4a40a17fdb0bfef5b20589650612:7b15d0216c79f21e5aa9bb', '3d725e547128e4f3508e320e397f3d9819bd0c023229ac42e6e968b767af805b', '53934da124de2f6df777fd19:8d1dd44c455440c354d3a1a147ed6687:fa8741458ced9ee544f8273802837df38a5d8622e75e', 'Camila S.', '1995-05-20', 'FEMININO'::"SexoBiologico", 'baad9cf4831b689bb4a9adf6:6805120ec4a16700732b06f42443bf4b:b8cb9db15039b6fb209996', 'O_POSITIVO'::"TipoSanguineo", NULL, 'Eliane Silveira', 'Designer', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000011', '0c000000-0000-4000-8000-000000000011', '05407002', 'Rua Fradique Coutinho', '700', 'Pinheiros', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000012', '538cf2178505ea1081c26492:4cf54073a765dc9b0472876386ef008b:aa37bb01c8eeff1c7369a1', 'e4c93824edea44416f5863200ee2f755b6aeed543eadc0a58fb13425b199debd', '608625949b992c751113f659:49db7cec7f8b7b86b0fedf7f6610a242:2a1ea6a723fd359c16628fc267a2184b50c04c86', 'Ricardo G.', '1982-10-11', 'MASCULINO'::"SexoBiologico", 'e4a73dee1797ab15a48aec97:0cec97a244af2c19d24d0a71dd3fbf0a:d5f7d35319587f3ceeebaa', 'A_POSITIVO'::"TipoSanguineo", 'SUS', 'Lúcia Gomes', 'Técnico de enfermagem', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000012', '0c000000-0000-4000-8000-000000000012', '04101000', 'Rua Domingos de Morais', '1800', 'Vila Mariana', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000111', '0c000000-0000-4000-8000-000000000012', 'SULFA', 'Moderada', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000013', '791661e8d3a4566e5ec9240e:10f6f39d20db10acb9910f3b0c27e537:a67958b05ea9c8c0ad887c', '2f0ed6329bd3cb3b13158b9b855cbd05fd29e2b9a0e495ad5e0eff08a1c7a236', 'f3c7213d7d5951a75feb4f26:0815f95fa646f2754350650beb194154:fed3f932651e320b55d4a78e95f0d4322ccedd9b6d1e5c', 'Patricia C.', '1970-03-28', 'FEMININO'::"SexoBiologico", '0c57e8d8425ad83ea4a29543:e7ae0d5d157fe3a06571feb0a3992067:ac8e7180400662954f82d0', 'B_POSITIVO'::"TipoSanguineo", 'NotreDame', 'Ivone Carvalho', 'Contadora', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000013', '0c000000-0000-4000-8000-000000000013', '01452000', 'Av. Rebouças', '2000', 'Pinheiros', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000121', '0c000000-0000-4000-8000-000000000013', 'OMEPRAZOL', '20MG', '1X EM JEJUM', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000014', '841b710e76fa65749420b5e0:7bb10621ff6bae0c2c56b258a28efb2f:1c2338836e6cb9cf6f4d55', 'd68b112c31490e6b40ab2b6ed618bab6a08213475549a8922301ceb42c92b6d7', '0f67a94fab664b3bb6d09797:8cc31a573d1f2e4a4d3bee7de92a56a8:ae6ef7fc7e3281c6e5518a9fd254fd4d8d8ecc', 'Eduardo R.', '1992-07-07', 'MASCULINO'::"SexoBiologico", '86fcdff822645e1bd78b9683:88e57e373bb32e476909401711202888:1779d2b087422b41f3ed6f', 'O_NEGATIVO'::"TipoSanguineo", NULL, 'Marta Rocha', 'Programador', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000014', '0c000000-0000-4000-8000-000000000014', '04571010', 'Av. Eng. Luís Carlos Berrini', '500', 'Brooklin', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000015', 'c0bb1eecf77305a70ded5987:452f23154328d0b0e794245d3ca5376b:45123c54a17befc53f4aa9', '1a46458d80dd8ed516e6f48dc3bfcb3c5a19445def25ed6853dd1338259e49f4', 'fd37638d3fb664935e569f09:2da45a23680006d63d442b974bf6b67b:b588890d38b55cecfb90307f0e466b82864ed3d32337', 'Silvia T.', '1965-11-19', 'FEMININO'::"SexoBiologico", '47d4e5ab887c1026e7230925:7c86e202c594deb028bf7f17ffcb7143:675e1508002adfc5a2ffe6', 'A_NEGATIVO'::"TipoSanguineo", 'SUS', 'Regina Teixeira', 'Auxiliar de limpeza', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000015', '0c000000-0000-4000-8000-000000000015', '03308050', 'Rua Taquari', '150', 'Tatuapé', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000141', '0c000000-0000-4000-8000-000000000015', 'POLEN', 'Leve', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000141', '0c000000-0000-4000-8000-000000000015', 'BUDESONIDA', '200MCG', '2X AO DIA', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000016', '1047c1973ad45a40de0fc0c3:e427d9d08ed78d14b59f9ed24ccf6eec:3eccd63f941ebf8e42de99', 'ac85f9c93befadb10db8d66037fb6e99cba12cd7b37d2e0f772ab11812d2d7d6', 'e5f01290f40706bb3d330d99:d24a3af81fb6c3a95b962e7885ca01ab:d7878d138bc1ba5fa24c55bf17a688ae4e3a884d', 'Felipe M.', '2005-01-02', 'MASCULINO'::"SexoBiologico", '36888b7d89b9b4c17409d657:3ef15bd7d51c10b8474593b027ced3d4:e2ef7a621b590dc6c232fc', 'O_POSITIVO'::"TipoSanguineo", 'SUS', 'Adriana Moura', 'Estudante', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000016', '0c000000-0000-4000-8000-000000000016', '02265000', 'Av. Águas de São Pedro', '45', 'Tucuruvi', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000017', '37d6ec0c779b408dcdffd6e2:a8209878854782928b91853aeef3a6c1:aaf677ef110b485567ae7e', '4ce5729eb2913ee8ca27458c934fc9da14b6b02e740cc064c28217e537ae598f', 'f224b8664021d40aa28f0ba6:b5ba0a6d3331805cabeb82dd60fab6e1:0edc7e153494e7b5048913dae7588bc1c1cacf97e94de4b6dec2', 'Renata C.', '1987-04-15', 'FEMININO'::"SexoBiologico", 'c4d833b4afb5e70017aa90a0:f7b3b7b85eba34aec06e515448e54d69:b1019890e657a737507f8a', 'AB_NEGATIVO'::"TipoSanguineo", 'Porto Seguro', 'Olívia Cavalcanti', 'Farmacêutica', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000017', '0c000000-0000-4000-8000-000000000017', '05615070', 'Av. Giovanni Gronchi', '3200', 'Morumbi', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000018', '02ad1223da96397b7c348d14:27d66e0bb976c3cd600dc5480f720636:ecffb4a5f8763fdb2c6730', 'e01a379fc5eea1ab9af510e1b824a0ac7b21e8e86e49e5040c678f5808076809', '0e47e2d707474139b55b0870:8c7c34bb99b48483f7b6758d18d6eb2c:c66ad4fa0230910ebe186090710e1d21d440b0d387ff', 'Geraldo D.', '1950-06-30', 'MASCULINO'::"SexoBiologico", 'f9b1e5dce037d417fa46b93c:3a7bb7bd4e07c1872bf250a48e3a16ab:a4b497bbf55bef9164ab64', 'A_POSITIVO'::"TipoSanguineo", 'SUS', 'Francisca Dias', 'Aposentado', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000018', '0c000000-0000-4000-8000-000000000018', '02309000', 'Av. Nova Cantareira', '1800', 'Tucuruvi', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000171', '0c000000-0000-4000-8000-000000000018', 'MORFINA', 'Grave', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000171', '0c000000-0000-4000-8000-000000000018', 'WARFARINA', '5MG', 'CONFORME INR', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000019', '110e34926b3df48ed9f9e1e4:7c87932995be500161926c3078259f92:e0d20a843fb778d72a3f0e', '7a49f83dd8da7423886d7cb268b82bcb0c5d7dd18ed85075dfc36ca3240012e9', '94d2279f6f27e9e17f3291c7:606b0a31d31d78149467a0d0dad4c52e:ae9e3f6542e0aa840b36deb7f270be00fe191993', 'Vanessa C.', '1993-09-09', 'FEMININO'::"SexoBiologico", '443d50f3b4954d58e5785be0:3bd5d0dd2d582a9aaa308f3eb869409e:ba57c03327e7c339cb6adc', 'B_NEGATIVO'::"TipoSanguineo", NULL, 'Vera Cardoso', 'Recepcionista', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000019', '0c000000-0000-4000-8000-000000000019', '03401000', 'Av. Cel. Sezefredo Fagundes', '800', 'Vila Carrão', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000020', '200fbb45ecd6f2553be2a834:2d3a58754291f62d9d268a4ca20f5d82:e213f845373ab12bb2070c', '23bc42feb15783c7d5b19805023aa4d073d4c79f6faf53c8b082445b8fc7e918', '1d1f0accffad03171f00d60c:a9de6fc2bcf5d34ccf6e84637b6e15a6:dbfb19506d48865811da49954b50d4d8dfde88e90c', 'Paulo M.', '1975-12-12', 'MASCULINO'::"SexoBiologico", '8391278bc1c96ec9e76ae393:8f0d1c8e4f497ae7f6a6b6151cd0a59a:ab183aa111e5073f93a7b7', 'O_POSITIVO'::"TipoSanguineo", 'SUS', 'Sonia Monteiro', 'Eletricista', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000020', '0c000000-0000-4000-8000-000000000020', '04286000', 'Av. do Cursino', '1200', 'Cursino', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000191', '0c000000-0000-4000-8000-000000000020', 'ASPIRINA', 'Moderada', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000021', 'e312c916dde48e6cefbc0a64:08562a50b5b11b91cc5c7e8e5547d45a:e3e1f5f0279026154f4002', '4ad19032be5c43b64a9c5e47fa1db54a236d2ab7c18426fc4c3229760335b22a', '4e5fe75169483ca63d2f94be:40928ffca6117a74d4d5c20c7bfbfe95:8d491f6ed8a551a831b7185ed00942906be6ec07972dab', 'Amanda F.', '2000-02-28', 'FEMININO'::"SexoBiologico", '8deaf7456574004c3fa2c6c0:00240fd4895ce8692f976388f3d9ddb0:cb1d2994944f19bc986f9e', 'A_POSITIVO'::"TipoSanguineo", 'SUS', 'Cristina Freitas', 'Estagiária', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000021', '0c000000-0000-4000-8000-000000000021', '04635000', 'Rua Verbo Divino', '900', 'Chácara Santo Antônio', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000022', '044bb3a71d836f2baf861dd1:b49dc044ee1c1ea2916b18cb11dbc2a1:c198e4f9785ac962922f7c', '1d621efc9ab800dce54abc31e8134f5fa4bfbc1c4c325432bdc77880bdeece44', '8e6d8a75289e1a7102b38cb1:12b16d8a92a778f0c5ced635b1418388:f1814385ffd4291cccaa63fa9816aff383d96e6d', 'Sérgio A.', '1968-08-21', 'MASCULINO'::"SexoBiologico", '75cc7f00b2f28c3287552c00:f2efcecb910deab65d7de8f7d5f4ba59:9b6bd96aad77ccfddd115d', 'B_POSITIVO'::"TipoSanguineo", 'Golden Cross', 'Luiza Azevedo', 'Gerente comercial', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000022', '0c000000-0000-4000-8000-000000000022', '04711030', 'Av. das Nações Unidas', '14000', 'Vila Gertrudes', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000211', '0c000000-0000-4000-8000-000000000022', 'ATENOLOL', '50MG', '1X AO DIA', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000023', 'c57eca3d39368869a7dba77a:3ee2426442c3dce0dd102b47ad103cc9:3538b19576713b037053b0', '4df03f0b0062a12cb1a9a247ca6053ede3852a13bf03b4e53db9b7e436124269', '459da5a662e349227344787d:a32ae52fd85c574296af2178c10885e1:7531a6329bb103291c7db93b2e4ba2c582ef464e6c83679f', 'Helena V.', '1945-03-03', 'FEMININO'::"SexoBiologico", '7c4e28620bd533fcc54a8b04:fafe128a4d47121a5410202921d9ee42:c85306682c5e6977034dbb', 'O_POSITIVO'::"TipoSanguineo", 'SUS', 'Moura Vasconcelos', 'Aposentada', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000023', '0c000000-0000-4000-8000-000000000023', '01222000', 'Rua da Consolação', '2000', 'Consolação', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000221', '0c000000-0000-4000-8000-000000000023', 'FRUTOS DO MAR', 'Grave', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000221', '0c000000-0000-4000-8000-000000000023', 'INSULINA NPH', '20UI', '2X AO DIA', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO medicamentos_continuos (id, "pacienteId", nome, dose, frequencia, "createdAt", "updatedAt")
VALUES ('0f000000-0000-4000-8000-000000000222', '0c000000-0000-4000-8000-000000000023', 'METFORMINA', '850MG', '2X AO DIA', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000024', '21baf4b005ea801f3747b6a7:1adb56cc5410335fdce3dab12a81cb79:d8497d6b1a5c62437a2253', 'ff4a9f1da816b555f79298913d38d0a100b271548fb1588e89c466a7f658dd90', 'ad7da70299f19937d2cba013:7394a4c51208ac034b521545ab1f9dcd:18c9879f6b2521ea6637c45fd07a12568cf46075', 'Bruno L.', '1997-06-06', 'MASCULINO'::"SexoBiologico", '872f778e421b68a85cd05f5b:ee526f519cf62eba115a71d690375c5e:dcbef76bbc6d83b1b73e16', 'A_POSITIVO'::"TipoSanguineo", NULL, 'Henrique Lopes', 'Entregador', 'São Paulo/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000024', '0c000000-0000-4000-8000-000000000024', '05805000', 'Estrada de Itapecerica', '4000', 'Capão Redondo', 'São Paulo', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO pacientes (id, "cpfCriptografado", "cpfHash", "nomeCriptografado", "nomeExibicao", "dataNascimento", "sexoBiologico", "telefoneCriptografado", "tipoSanguineo", convenio, "nomeMae", profissao, naturalidade, "createdAt", "updatedAt")
VALUES ('0c000000-0000-4000-8000-000000000025', '2c14d5f7ab34191779742fff:d0d15f396392bcf0a07b80f8dfc97e74:1e5d67de847021bcf1e2c1', '087a6b8cfbac07278217e96a6fc4199406ae683210c3288b8c9822f552e998ea', 'f8644d01354c4633b3b2e365:aa3bd537673dbe05d3a39a8ccbf42a67:90aefd8c8b10c8d5d6b6dc67f218d060381080b11dbae2', 'Carla M.', '1983-10-10', 'FEMININO'::"SexoBiologico", '67808f536a87450ed4848210:5483f47fb587c7f0bc83d5480a9fdbd9:3190b8eeb18c169cd3d026', 'AB_POSITIVO'::"TipoSanguineo", 'SUS', 'Beatriz Mendonça', 'Fisioterapeuta', 'Osasco/SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("cpfHash") DO NOTHING;
INSERT INTO enderecos (id, "pacienteId", cep, logradouro, numero, bairro, cidade, estado, "createdAt", "updatedAt")
VALUES ('0d000000-0000-4000-8000-000000000025', '0c000000-0000-4000-8000-000000000025', '06020000', 'Av. dos Autonomistas', '2500', 'Vila Yara', 'Osasco', 'SP', '2026-05-22 21:32:33', '2026-05-22 21:32:33')
ON CONFLICT ("pacienteId") DO NOTHING;
INSERT INTO alergias (id, "pacienteId", descricao, gravidade, "createdAt")
VALUES ('0e000000-0000-4000-8000-000000000241', '0c000000-0000-4000-8000-000000000025', 'LATEX', 'Moderada', '2026-05-22 21:32:33')
ON CONFLICT (id) DO NOTHING;

-- Atendimentos, triagens, prontuários, exames, chamadas, auditoria
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000001', '20260522-0001DEMO', '0c000000-0000-4000-8000-000000000001', NULL, 'AGUARDANDO_TRIAGEM'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000001', '2026-05-22 20:32:34', '2026-05-22 20:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000001', 'AGUARDANDO_TRIAGEM', '127.0.0.1', '2026-05-22 20:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000002', '20260522-0002DEMO', '0c000000-0000-4000-8000-000000000002', NULL, 'AGUARDANDO_TRIAGEM'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000002', '2026-05-22 19:32:34', '2026-05-22 19:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000002', 'AGUARDANDO_TRIAGEM', '127.0.0.1', '2026-05-22 19:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000003', '20260522-0003DEMO', '0c000000-0000-4000-8000-000000000003', NULL, 'EM_TRIAGEM'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000001', '2026-05-22 18:32:34', '2026-05-22 18:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000003', 'EM_TRIAGEM', '127.0.0.1', '2026-05-22 18:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000004', '20260522-0004DEMO', '0c000000-0000-4000-8000-000000000004', NULL, 'EM_TRIAGEM'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000003', '2026-05-22 17:32:34', '2026-05-22 17:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000004', 'EM_TRIAGEM', '127.0.0.1', '2026-05-22 17:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000005', '20260522-0005DEMO', '0c000000-0000-4000-8000-000000000005', NULL, 'AGUARDANDO_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000001', '2026-05-22 16:32:34', '2026-05-22 16:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000005', '11000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003', 'AMARELO'::"CorTriagem", 'CEFALEIA INTENSA HÁ 6 HORAS', 'dor', '2026-05-22 16:32:34', '2026-05-22 16:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 7/10', '2026-05-22 16:32:34', '2026-05-22 16:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000005', '12000000-0000-4000-8000-000000000005', 140, 90, 88, 18, 98, 36.8, 7, 70, 170, 24.22, '2026-05-22 16:47:34', '2026-05-22 16:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000005', '11000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-05-22 17:02:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000005', 'AGUARDANDO_ATENDIMENTO', '127.0.0.1', '2026-05-22 16:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000006', '20260522-0006DEMO', '0c000000-0000-4000-8000-000000000006', NULL, 'AGUARDANDO_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000002', '2026-05-22 15:32:34', '2026-05-22 15:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000006', '11000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003', 'LARANJA'::"CorTriagem", 'DISPNEIA E SIBILÂNCIA', 'dispneia', '2026-05-22 15:32:34', '2026-05-22 15:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 3/10', '2026-05-22 15:32:34', '2026-05-22 15:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000006', '12000000-0000-4000-8000-000000000006', 130, 85, 110, 28, 91, 37.2, 3, 70, 170, 24.22, '2026-05-22 15:47:34', '2026-05-22 15:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000006', '11000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-05-22 16:02:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000006', 'AGUARDANDO_ATENDIMENTO', '127.0.0.1', '2026-05-22 15:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000007', '20260522-0007DEMO', '0c000000-0000-4000-8000-000000000007', NULL, 'AGUARDANDO_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000001', '2026-05-22 19:32:34', '2026-05-22 19:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000007', '11000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 'VERDE'::"CorTriagem", 'LACERAÇÃO EM MÃO DIREITA', 'trauma', '2026-05-22 19:32:34', '2026-05-22 19:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 4/10', '2026-05-22 19:32:34', '2026-05-22 19:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000007', '12000000-0000-4000-8000-000000000007', 120, 78, 76, 16, 99, 36.5, 4, 70, 170, 24.22, '2026-05-22 19:47:34', '2026-05-22 19:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000007', '11000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-05-22 20:02:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000007', 'AGUARDANDO_ATENDIMENTO', '127.0.0.1', '2026-05-22 19:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000008', '20260522-0008DEMO', '0c000000-0000-4000-8000-000000000008', NULL, 'AGUARDANDO_ATENDIMENTO'::"StatusAtendimento", 'Ambulatório', NULL, '0b000000-0000-4000-8000-000000000004', '2026-05-22 13:32:34', '2026-05-22 13:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000008', '11000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000003', 'AZUL'::"CorTriagem", 'RENOVAÇÃO DE RECEITUÁRIO', 'outro', '2026-05-22 13:32:34', '2026-05-22 13:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 0/10', '2026-05-22 13:32:34', '2026-05-22 13:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000008', '12000000-0000-4000-8000-000000000008', 118, 76, 72, 14, 99, 36.4, 0, 70, 170, 24.22, '2026-05-22 13:47:34', '2026-05-22 13:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000008', '11000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-05-22 14:02:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000008', 'AGUARDANDO_ATENDIMENTO', '127.0.0.1', '2026-05-22 13:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000009', '20260522-0009DEMO', '0c000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000002', 'EM_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-05-22 17:32:34', '2026-05-22 17:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000009', '11000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'VERMELHO'::"CorTriagem", 'DOR TORÁCICA SÚBITA COM IRRADIAÇÃO', 'dor', '2026-05-22 17:32:34', '2026-05-22 17:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 9/10', '2026-05-22 17:32:34', '2026-05-22 17:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000009', '12000000-0000-4000-8000-000000000009', 90, 60, 120, 24, 94, 36.9, 9, 70, 170, 24.22, '2026-05-22 17:47:34', '2026-05-22 17:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000009', '11000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-05-22 18:02:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000009', 'EM_ATENDIMENTO', '127.0.0.1', '2026-05-22 17:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000010', '20260522-0010DEMO', '0c000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000002', 'EM_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000002', '2026-05-22 18:32:34', '2026-05-22 18:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000010', '11000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000003', 'AMARELO'::"CorTriagem", 'FEBRE E MIALGIA HÁ 2 DIAS', 'febre', '2026-05-22 18:32:34', '2026-05-22 18:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 5/10', '2026-05-22 18:32:34', '2026-05-22 18:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000010', '12000000-0000-4000-8000-000000000010', 125, 80, 98, 20, 97, 38.5, 5, 70, 170, 24.22, '2026-05-22 18:47:34', '2026-05-22 18:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000010', '11000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-05-22 19:02:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000010', 'EM_ATENDIMENTO', '127.0.0.1', '2026-05-22 18:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000011', '20260522-0011DEMO', '0c000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000002', 'EM_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-05-22 19:32:34', '2026-05-22 19:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000011', '11000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000003', 'LARANJA'::"CorTriagem", 'VÔMITOS PERSISTENTES', 'vomito', '2026-05-22 19:32:34', '2026-05-22 19:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 6/10', '2026-05-22 19:32:34', '2026-05-22 19:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000011', '12000000-0000-4000-8000-000000000011', 100, 65, 105, 22, 96, 37, 6, 70, 170, 24.22, '2026-05-22 19:47:34', '2026-05-22 19:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000011', '11000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-05-22 20:02:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000011', 'EM_ATENDIMENTO', '127.0.0.1', '2026-05-22 19:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000012', '20260522-0012DEMO', '0c000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-05-21 21:32:34', '2026-05-21 21:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000012', '11000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000003', 'VERDE'::"CorTriagem", 'ENTORSE DE TORNOZELO', 'trauma', '2026-05-21 21:32:34', '2026-05-21 21:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 5/10', '2026-05-21 21:32:34', '2026-05-21 21:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000012', '12000000-0000-4000-8000-000000000012', 122, 78, 80, 16, 99, 36.6, 5, 70, 170, 24.22, '2026-05-21 21:47:34', '2026-05-21 21:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000012', '11000000-0000-4000-8000-000000000012', '2026-05-21 21:32:34', '2026-05-21 21:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000012', '14000000-0000-4000-8000-000000000012', 'ENTORSE DE TORNOZELO', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-21 21:32:34', '2026-05-21 21:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000012', '14000000-0000-4000-8000-000000000012', 'S93.4', 'Entorse e distensão do tornozelo', 'Entorse e distensão do tornozelo', TRUE, '2026-05-21 21:32:34', '2026-05-21 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000012', '14000000-0000-4000-8000-000000000012', 1, '2026-05-21 21:32:34', 'Prescrição demo', '2026-05-21 21:32:34', '2026-05-21 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000012', '17000000-0000-4000-8000-000000000012', 'DIPIRONA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-05-21 21:32:34', '2026-05-21 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000012', '18000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-05-21 21:32:34', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-05-21 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000012', '14000000-0000-4000-8000-000000000012', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-21 21:32:34', '2026-05-21 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000012', '19000000-0000-4000-8000-000000000012', 'Raio-X tornozelo', 'Item demo SQL', '2026-05-21 21:32:34', '2026-05-21 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000012', '14000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-21 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000012', 'CONCLUIDO', '127.0.0.1', '2026-05-21 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000013', '20260522-0013DEMO', '0c000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000003', '2026-05-21 19:32:34', '2026-05-21 19:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000013', '11000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000003', 'AMARELO'::"CorTriagem", 'DOR ABDOMINAL DIFUSA', 'dor', '2026-05-21 19:32:34', '2026-05-21 19:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 7/10', '2026-05-21 19:32:34', '2026-05-21 19:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000013', '12000000-0000-4000-8000-000000000013', 128, 82, 92, 18, 98, 37.1, 7, 70, 170, 24.22, '2026-05-21 19:47:34', '2026-05-21 19:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000013', '11000000-0000-4000-8000-000000000013', '2026-05-21 19:32:34', '2026-05-21 19:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000013', '14000000-0000-4000-8000-000000000013', 'DOR ABDOMINAL DIFUSA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-21 19:32:34', '2026-05-21 19:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000013', '14000000-0000-4000-8000-000000000013', 'K52.9', 'Gastroenterite não especificada', 'Gastroenterite não especificada', TRUE, '2026-05-21 19:32:34', '2026-05-21 19:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000013', '14000000-0000-4000-8000-000000000013', 1, '2026-05-21 19:32:34', 'Prescrição demo', '2026-05-21 19:32:34', '2026-05-21 19:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000013', '17000000-0000-4000-8000-000000000013', 'BUSCOPAN', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-05-21 19:32:34', '2026-05-21 19:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000013', '18000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-05-21 19:32:34', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-05-21 19:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000013', '14000000-0000-4000-8000-000000000013', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-21 19:32:34', '2026-05-21 19:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000013', '19000000-0000-4000-8000-000000000013', 'Hemograma completo', 'Item demo SQL', '2026-05-21 19:32:34', '2026-05-21 19:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000013', '14000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-21 19:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000013', 'CONCLUIDO', '127.0.0.1', '2026-05-21 19:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000014', '20260522-0014DEMO', '0c000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-05-21 15:32:34', '2026-05-21 15:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000014', '11000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000003', 'VERDE'::"CorTriagem", 'CISTITE — DISÚRIA', 'outro', '2026-05-21 15:32:34', '2026-05-21 15:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 4/10', '2026-05-21 15:32:34', '2026-05-21 15:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000014', '12000000-0000-4000-8000-000000000014', 115, 75, 78, 16, 99, 36.7, 4, 70, 170, 24.22, '2026-05-21 15:47:34', '2026-05-21 15:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000014', '11000000-0000-4000-8000-000000000014', '2026-05-21 15:32:34', '2026-05-21 15:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000014', '14000000-0000-4000-8000-000000000014', 'CISTITE — DISÚRIA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-21 15:32:34', '2026-05-21 15:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000014', '14000000-0000-4000-8000-000000000014', 'N39.0', 'Infecção do trato urinário', 'Infecção do trato urinário', TRUE, '2026-05-21 15:32:34', '2026-05-21 15:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000014', '14000000-0000-4000-8000-000000000014', 1, '2026-05-21 15:32:34', 'Prescrição demo', '2026-05-21 15:32:34', '2026-05-21 15:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000014', '17000000-0000-4000-8000-000000000014', 'CIPROFLOXACINO', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-05-21 15:32:34', '2026-05-21 15:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000014', '18000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-05-21 15:32:34', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-05-21 15:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000014', '14000000-0000-4000-8000-000000000014', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-21 15:32:34', '2026-05-21 15:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000014', '19000000-0000-4000-8000-000000000014', 'EAS / Urina tipo I', 'Item demo SQL', '2026-05-21 15:32:34', '2026-05-21 15:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000014', '14000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-21 15:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000014', 'CONCLUIDO', '127.0.0.1', '2026-05-21 15:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000015', '20260522-0015DEMO', '0c000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Ambulatório', 'Consultório 01', '0b000000-0000-4000-8000-000000000004', '2026-05-20 21:32:34', '2026-05-20 21:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000015', '11000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000003', 'AZUL'::"CorTriagem", 'CONSULTA DE ROTINA — HAS', 'outro', '2026-05-20 21:32:34', '2026-05-20 21:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 0/10', '2026-05-20 21:32:34', '2026-05-20 21:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000015', '12000000-0000-4000-8000-000000000015', 135, 88, 74, 14, 99, 36.5, 0, 70, 170, 24.22, '2026-05-20 21:47:34', '2026-05-20 21:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000015', '11000000-0000-4000-8000-000000000015', '2026-05-20 21:32:34', '2026-05-20 21:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000015', '14000000-0000-4000-8000-000000000015', 'CONSULTA DE ROTINA — HAS', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-20 21:32:34', '2026-05-20 21:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000015', '14000000-0000-4000-8000-000000000015', 'I10', 'Hipertensão essencial', 'Hipertensão essencial', TRUE, '2026-05-20 21:32:34', '2026-05-20 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000015', '14000000-0000-4000-8000-000000000015', 1, '2026-05-20 21:32:34', 'Prescrição demo', '2026-05-20 21:32:34', '2026-05-20 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000015', '17000000-0000-4000-8000-000000000015', 'LOSARTANA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-05-20 21:32:34', '2026-05-20 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000015', '18000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-05-20 21:32:34', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-05-20 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000015', '14000000-0000-4000-8000-000000000015', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-20 21:32:34', '2026-05-20 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000015', '19000000-0000-4000-8000-000000000015', 'Creatinina / Ureia', 'Item demo SQL', '2026-05-20 21:32:34', '2026-05-20 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000015', '14000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-20 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000015', 'CONCLUIDO', '127.0.0.1', '2026-05-20 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000016', '20260522-0016DEMO', '0c000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-05-21 09:32:34', '2026-05-21 09:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000016', '11000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000003', 'AMARELO'::"CorTriagem", 'CORTE PROFUNDO EM ANTEBRAÇO', 'sangramento', '2026-05-21 09:32:34', '2026-05-21 09:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 6/10', '2026-05-21 09:32:34', '2026-05-21 09:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000016', '12000000-0000-4000-8000-000000000016', 118, 72, 95, 18, 98, 36.8, 6, 70, 170, 24.22, '2026-05-21 09:47:34', '2026-05-21 09:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000016', '11000000-0000-4000-8000-000000000016', '2026-05-21 09:32:34', '2026-05-21 09:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000016', '14000000-0000-4000-8000-000000000016', 'CORTE PROFUNDO EM ANTEBRAÇO', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-21 09:32:34', '2026-05-21 09:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000016', '14000000-0000-4000-8000-000000000016', 'S51.0', 'Ferimento do antebraço', 'Ferimento do antebraço', TRUE, '2026-05-21 09:32:34', '2026-05-21 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000016', '14000000-0000-4000-8000-000000000016', 1, '2026-05-21 09:32:34', 'Prescrição demo', '2026-05-21 09:32:34', '2026-05-21 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000016', '17000000-0000-4000-8000-000000000016', 'AMOXICILINA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-05-21 09:32:34', '2026-05-21 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000016', '18000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-05-21 09:32:34', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-05-21 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000016', '14000000-0000-4000-8000-000000000016', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-21 09:32:34', '2026-05-21 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000016', '19000000-0000-4000-8000-000000000016', 'Raio-X antebraço', 'Item demo SQL', '2026-05-21 09:32:34', '2026-05-21 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000016', '14000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-21 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000016', 'CONCLUIDO', '127.0.0.1', '2026-05-21 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000017', '20260522-0017DEMO', '0c000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000002', '2026-05-21 05:32:34', '2026-05-21 05:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000017', '11000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000003', 'LARANJA'::"CorTriagem", 'REBAIXAMENTO DO NÍVEL DE CONSCIÊNCIA', 'alteracao_consciencia', '2026-05-21 05:32:34', '2026-05-21 05:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 0/10', '2026-05-21 05:32:34', '2026-05-21 05:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000017', '12000000-0000-4000-8000-000000000017', 160, 100, 58, 12, 95, 36.2, 0, 70, 170, 24.22, '2026-05-21 05:47:34', '2026-05-21 05:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000017', '11000000-0000-4000-8000-000000000017', '2026-05-21 05:32:34', '2026-05-21 05:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000017', '14000000-0000-4000-8000-000000000017', 'REBAIXAMENTO DO NÍVEL DE CONSCIÊNCIA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-21 05:32:34', '2026-05-21 05:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000017', '14000000-0000-4000-8000-000000000017', 'I63.9', 'Infarto cerebral', 'Infarto cerebral', TRUE, '2026-05-21 05:32:34', '2026-05-21 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000017', '14000000-0000-4000-8000-000000000017', 1, '2026-05-21 05:32:34', 'Prescrição demo', '2026-05-21 05:32:34', '2026-05-21 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000017', '17000000-0000-4000-8000-000000000017', 'MANITOL', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-05-21 05:32:34', '2026-05-21 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000017', '18000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-05-21 05:32:34', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-05-21 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000017', '14000000-0000-4000-8000-000000000017', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-21 05:32:34', '2026-05-21 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000017', '19000000-0000-4000-8000-000000000017', 'TC crânio', 'Item demo SQL', '2026-05-21 05:32:34', '2026-05-21 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000017', '14000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-21 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000017', 'CONCLUIDO', '127.0.0.1', '2026-05-21 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000018', '20260522-0018DEMO', '0c000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-05-20 17:32:34', '2026-05-20 17:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000018', '11000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000003', 'VERDE'::"CorTriagem", 'FEBRE E TOSSE PRODUTIVA', 'febre', '2026-05-20 17:32:34', '2026-05-20 17:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 2/10', '2026-05-20 17:32:34', '2026-05-20 17:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000018', '12000000-0000-4000-8000-000000000018', 120, 78, 88, 20, 97, 38.2, 2, 70, 170, 24.22, '2026-05-20 17:47:34', '2026-05-20 17:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000018', '11000000-0000-4000-8000-000000000018', '2026-05-20 17:32:34', '2026-05-20 17:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000018', '14000000-0000-4000-8000-000000000018', 'FEBRE E TOSSE PRODUTIVA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-20 17:32:34', '2026-05-20 17:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000018', '14000000-0000-4000-8000-000000000018', 'J18.9', 'Pneumonia não especificada', 'Pneumonia não especificada', TRUE, '2026-05-20 17:32:34', '2026-05-20 17:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000018', '14000000-0000-4000-8000-000000000018', 1, '2026-05-20 17:32:34', 'Prescrição demo', '2026-05-20 17:32:34', '2026-05-20 17:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000018', '17000000-0000-4000-8000-000000000018', 'AZITROMICINA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-05-20 17:32:34', '2026-05-20 17:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000018', '18000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-05-20 17:32:34', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-05-20 17:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000018', '14000000-0000-4000-8000-000000000018', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-20 17:32:34', '2026-05-20 17:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000018', '19000000-0000-4000-8000-000000000018', 'Raio-X tórax PA', 'Item demo SQL', '2026-05-20 17:32:34', '2026-05-20 17:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000018', '14000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-20 17:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000018', 'CONCLUIDO', '127.0.0.1', '2026-05-20 17:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000019', '20260522-0019DEMO', '0c000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000002', 'ALTA'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-05-19 21:32:34', '2026-05-19 21:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000019', '11000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000003', 'VERDE'::"CorTriagem", 'CRISE DE ENXAQUECA', 'dor', '2026-05-19 21:32:34', '2026-05-19 21:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 8/10', '2026-05-19 21:32:34', '2026-05-19 21:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000019', '12000000-0000-4000-8000-000000000019', 125, 80, 82, 16, 99, 36.6, 8, 70, 170, 24.22, '2026-05-19 21:47:34', '2026-05-19 21:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000019', '11000000-0000-4000-8000-000000000019', '2026-05-19 21:32:34', '2026-05-19 21:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000019', '14000000-0000-4000-8000-000000000019', 'CRISE DE ENXAQUECA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-19 21:32:34', '2026-05-19 21:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000019', '14000000-0000-4000-8000-000000000019', 'G43.9', 'Enxaqueca', 'Enxaqueca', TRUE, '2026-05-19 21:32:34', '2026-05-19 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000019', '14000000-0000-4000-8000-000000000019', 1, '2026-05-19 21:32:34', 'Prescrição demo', '2026-05-19 21:32:34', '2026-05-19 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000019', '17000000-0000-4000-8000-000000000019', 'SUMATRIPTANO', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-05-19 21:32:34', '2026-05-19 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000019', '18000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-05-19 21:32:34', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-05-19 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000019', '14000000-0000-4000-8000-000000000019', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-19 21:32:34', '2026-05-19 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000019', '19000000-0000-4000-8000-000000000019', 'Nenhum', 'Item demo SQL', '2026-05-19 21:32:34', '2026-05-19 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000019', '14000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-19 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000019', 'ALTA', '127.0.0.1', '2026-05-19 21:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000020', '20260522-0020DEMO', '0c000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000002', 'ALTA'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000003', '2026-05-19 13:32:34', '2026-05-19 13:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000020', '11000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000003', 'AMARELO'::"CorTriagem", 'QUEIMADURA DE 1º GRAU', 'trauma', '2026-05-19 13:32:34', '2026-05-19 13:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 5/10', '2026-05-19 13:32:34', '2026-05-19 13:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000020', '12000000-0000-4000-8000-000000000020', 122, 78, 84, 16, 99, 36.5, 5, 70, 170, 24.22, '2026-05-19 13:47:34', '2026-05-19 13:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000020', '11000000-0000-4000-8000-000000000020', '2026-05-19 13:32:34', '2026-05-19 13:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000020', '14000000-0000-4000-8000-000000000020', 'QUEIMADURA DE 1º GRAU', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-19 13:32:34', '2026-05-19 13:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000020', '14000000-0000-4000-8000-000000000020', 'T30.1', 'Queimadura de primeiro grau', 'Queimadura de primeiro grau', TRUE, '2026-05-19 13:32:34', '2026-05-19 13:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000020', '14000000-0000-4000-8000-000000000020', 1, '2026-05-19 13:32:34', 'Prescrição demo', '2026-05-19 13:32:34', '2026-05-19 13:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000020', '17000000-0000-4000-8000-000000000020', 'DIPIRONA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-05-19 13:32:34', '2026-05-19 13:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000020', '18000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-05-19 13:32:34', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-05-19 13:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000020', '14000000-0000-4000-8000-000000000020', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-19 13:32:34', '2026-05-19 13:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000020', '19000000-0000-4000-8000-000000000020', 'Curativo local', 'Item demo SQL', '2026-05-19 13:32:34', '2026-05-19 13:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000020', '14000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-19 13:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000020', 'ALTA', '127.0.0.1', '2026-05-19 13:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000021', '20260522-0021DEMO', '0c000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000002', 'INTERNADO'::"StatusAtendimento", 'Emergência', 'Consultório 01', '0b000000-0000-4000-8000-000000000002', '2026-05-22 09:32:34', '2026-05-22 09:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000021', '11000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000003', 'VERMELHO'::"CorTriagem", 'PCR REVERTIDA — INSTABILIDADE HEMODINÂMICA', 'alteracao_consciencia', '2026-05-22 09:32:34', '2026-05-22 09:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 0/10', '2026-05-22 09:32:34', '2026-05-22 09:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000021', '12000000-0000-4000-8000-000000000021', 85, 55, 130, 26, 88, 35.8, 0, 70, 170, 24.22, '2026-05-22 09:47:34', '2026-05-22 09:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000021', '11000000-0000-4000-8000-000000000021', '2026-05-22 09:32:34', '2026-05-22 09:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000021', '14000000-0000-4000-8000-000000000021', 'PCR REVERTIDA — INSTABILIDADE HEMODINÂMICA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-22 09:32:34', '2026-05-22 09:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000021', '14000000-0000-4000-8000-000000000021', 'I46.9', 'Parada cardíaca', 'Parada cardíaca', TRUE, '2026-05-22 09:32:34', '2026-05-22 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000021', '14000000-0000-4000-8000-000000000021', 1, '2026-05-22 09:32:34', 'Prescrição demo', '2026-05-22 09:32:34', '2026-05-22 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000021', '17000000-0000-4000-8000-000000000021', 'ADRENALINA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'PENDENTE'::"StatusPrescricaoItem", '2026-05-22 09:32:34', '2026-05-22 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000021', '14000000-0000-4000-8000-000000000021', 'LABORATORIO'::"CategoriaExame", 'EMERGENCIAL'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-22 09:32:34', '2026-05-22 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000021', '19000000-0000-4000-8000-000000000021', 'ECG 12 derivações', 'Item demo SQL', '2026-05-22 09:32:34', '2026-05-22 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000021', '14000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-22 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO encaminhamentos (id, "prontuarioId", tipo, especialidade, prioridade, "resumoClinco", "createdAt", "updatedAt")
VALUES ('1d000000-0000-4000-8000-000000000021', '14000000-0000-4000-8000-000000000021', 'INTERNACAO'::"TipoEncaminhamento", 'Clínica Médica', 'Alta', 'Internação para observação.', '2026-05-22 09:32:34', '2026-05-22 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000021', 'INTERNADO', '127.0.0.1', '2026-05-22 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000022', '20260522-0022DEMO', '0c000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-05-22 01:32:34', '2026-05-22 01:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000022', '11000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000003', 'CINZA'::"CorTriagem", 'OBSERVAÇÃO PÓS-PROCEDIMENTO', 'outro', '2026-05-22 01:32:34', '2026-05-22 01:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 1/10', '2026-05-22 01:32:34', '2026-05-22 01:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000022', '12000000-0000-4000-8000-000000000022', 118, 76, 70, 14, 99, 36.4, 1, 70, 170, 24.22, '2026-05-22 01:47:34', '2026-05-22 01:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000022', '11000000-0000-4000-8000-000000000022', '2026-05-22 01:32:34', '2026-05-22 01:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000022', '14000000-0000-4000-8000-000000000022', 'OBSERVAÇÃO PÓS-PROCEDIMENTO', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-22 01:32:34', '2026-05-22 01:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000022', '14000000-0000-4000-8000-000000000022', 'Z09', 'Seguimento pós-tratamento', 'Seguimento pós-tratamento', TRUE, '2026-05-22 01:32:34', '2026-05-22 01:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000022', '14000000-0000-4000-8000-000000000022', 1, '2026-05-22 01:32:34', 'Prescrição demo', '2026-05-22 01:32:34', '2026-05-22 01:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000022', '17000000-0000-4000-8000-000000000022', 'PARACETAMOL', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-05-22 01:32:34', '2026-05-22 01:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000022', '18000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-05-22 01:32:34', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-05-22 01:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000022', '14000000-0000-4000-8000-000000000022', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-22 01:32:34', '2026-05-22 01:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000022', '19000000-0000-4000-8000-000000000022', 'Observação clínica', 'Item demo SQL', '2026-05-22 01:32:34', '2026-05-22 01:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000022', '14000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-22 01:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000022', 'CONCLUIDO', '127.0.0.1', '2026-05-22 01:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000023', '20260522-0023DEMO', '0c000000-0000-4000-8000-000000000023', NULL, 'AGUARDANDO_ATENDIMENTO'::"StatusAtendimento", 'Pronto-Socorro', NULL, '0b000000-0000-4000-8000-000000000005', '2026-05-22 20:32:34', '2026-05-22 20:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000023', '11000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000003', 'LARANJA'::"CorTriagem", 'AGRESSÃO FÍSICA — TRAUMA FACIAL', 'trauma', '2026-05-22 20:32:34', '2026-05-22 20:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 8/10', '2026-05-22 20:32:34', '2026-05-22 20:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000023', '12000000-0000-4000-8000-000000000023', 145, 92, 102, 20, 97, 36.9, 8, 70, 170, 24.22, '2026-05-22 20:47:34', '2026-05-22 20:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO chamadas_painel (id, "atendimentoId", "chamadoPorId", "salaDestino", "setorPainel", "chamadoEm")
VALUES ('1e000000-0000-4000-8000-000000000023', '11000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000003', 'Consultório 02', 'GERAL', '2026-05-22 21:02:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000023', 'AGUARDANDO_ATENDIMENTO', '127.0.0.1', '2026-05-22 20:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000024', '20260522-0024DEMO', '0c000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Pronto-Socorro', 'Consultório 01', '0b000000-0000-4000-8000-000000000001', '2026-05-22 05:32:34', '2026-05-22 05:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000024', '11000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000003', 'VERDE'::"CorTriagem", 'CORPO ESTRANHO NO OLHO', 'outro', '2026-05-22 05:32:34', '2026-05-22 05:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 3/10', '2026-05-22 05:32:34', '2026-05-22 05:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000024', '12000000-0000-4000-8000-000000000024', 120, 78, 76, 16, 99, 36.5, 3, 70, 170, 24.22, '2026-05-22 05:47:34', '2026-05-22 05:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000024', '11000000-0000-4000-8000-000000000024', '2026-05-22 05:32:34', '2026-05-22 05:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000024', '14000000-0000-4000-8000-000000000024', 'CORPO ESTRANHO NO OLHO', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-22 05:32:34', '2026-05-22 05:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000024', '14000000-0000-4000-8000-000000000024', 'T15.0', 'Corpo estranho na córnea', 'Corpo estranho na córnea', TRUE, '2026-05-22 05:32:34', '2026-05-22 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000024', '14000000-0000-4000-8000-000000000024', 1, '2026-05-22 05:32:34', 'Prescrição demo', '2026-05-22 05:32:34', '2026-05-22 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000024', '17000000-0000-4000-8000-000000000024', 'TOBRAMICINA COLÍRIO', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-05-22 05:32:34', '2026-05-22 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000024', '18000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-05-22 05:32:34', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-05-22 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000024', '14000000-0000-4000-8000-000000000024', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-22 05:32:34', '2026-05-22 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000024', '19000000-0000-4000-8000-000000000024', 'Exame oftalmológico', 'Item demo SQL', '2026-05-22 05:32:34', '2026-05-22 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000024', '14000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-22 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000024', 'CONCLUIDO', '127.0.0.1', '2026-05-22 05:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO atendimentos (id, "numeroAtendimento", "pacienteId", "medicoId", status, setor, sala, "origemId", "createdAt", "updatedAt")
VALUES ('11000000-0000-4000-8000-000000000025', '20260522-0025DEMO', '0c000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000002', 'CONCLUIDO'::"StatusAtendimento", 'Ambulatório', 'Consultório 01', '0b000000-0000-4000-8000-000000000004', '2026-05-20 09:32:34', '2026-05-20 09:32:34')
ON CONFLICT ("numeroAtendimento") DO NOTHING;
INSERT INTO triagens (id, "atendimentoId", "triadorId", "corClassificacao", "queixaPrincipal", "categoriaQueixa", "entradaTriagem", "classificadoEm", "doencasPreexistentes", medicacoes, "regraDor", "createdAt", "updatedAt")
VALUES ('12000000-0000-4000-8000-000000000025', '11000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000003', 'AZUL'::"CorTriagem", 'DOR LOMBAR CRÔNICA AGUDIZADA', 'dor', '2026-05-20 09:32:34', '2026-05-20 09:47:34', 'HAS, DM (DEMO)', 'CONFORME FICHA', 'ESCALA DE DOR: 6/10', '2026-05-20 09:32:34', '2026-05-20 09:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO sinais_vitais (id, "triagemId", "paSistolica", "paDiastolica", "frequenciaCardiaca", "frequenciaResp", spo2, temperatura, "escalaDor", peso, altura, imc, "coletadoEm", "updatedAt")
VALUES ('13000000-0000-4000-8000-000000000025', '12000000-0000-4000-8000-000000000025', 128, 84, 80, 16, 99, 36.6, 6, 70, 170, 24.22, '2026-05-20 09:47:34', '2026-05-20 09:47:34')
ON CONFLICT ("triagemId") DO NOTHING;
INSERT INTO prontuarios_medicos (id, "atendimentoId", "createdAt", "updatedAt")
VALUES ('14000000-0000-4000-8000-000000000025', '11000000-0000-4000-8000-000000000025', '2026-05-20 09:32:34', '2026-05-20 09:32:34')
ON CONFLICT ("atendimentoId") DO NOTHING;
INSERT INTO anamneses (id, "prontuarioId", "queixaPrincipal", hda, "antecedentesP", "exameFisico", "createdAt", "updatedAt")
VALUES ('15000000-0000-4000-8000-000000000025', '14000000-0000-4000-8000-000000000025', 'DOR LOMBAR CRÔNICA AGUDIZADA', 'HDA demo gerada pelo SQL.', 'Antecedentes demo.', '{"geral":"BEG, corado, hidratado"}'::jsonb, '2026-05-20 09:32:34', '2026-05-20 09:32:34')
ON CONFLICT ("prontuarioId") DO NOTHING;
INSERT INTO diagnosticos (id, "prontuarioId", "codigoCid", "descricaoCid", hipotese, principal, "createdAt", "updatedAt")
VALUES ('16000000-0000-4000-8000-000000000025', '14000000-0000-4000-8000-000000000025', 'M54.5', 'Dor lombar baixa', 'Dor lombar baixa', TRUE, '2026-05-20 09:32:34', '2026-05-20 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO prescricoes (id, "prontuarioId", "numeroPrescricao", "emitidaEm", observacoes, "createdAt", "updatedAt")
VALUES ('17000000-0000-4000-8000-000000000025', '14000000-0000-4000-8000-000000000025', 1, '2026-05-20 09:32:34', 'Prescrição demo', '2026-05-20 09:32:34', '2026-05-20 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_prescricao (id, "prescricaoId", "nomeMedicamento", dose, via, frequencia, "duracaoDias", status, "createdAt", "updatedAt")
VALUES ('18000000-0000-4000-8000-000000000025', '17000000-0000-4000-8000-000000000025', 'CICLOBENZAPRINA', '500MG', 'ORAL'::"ViaAdministracao", '8/8H', 5, 'APLICADO'::"StatusPrescricaoItem", '2026-05-20 09:32:34', '2026-05-20 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO aplicacoes_medicamentos (id, "itemPrescricaoId", "aplicadoPorId", "doseAplicada", via, "aplicadoEm", "checklistConfirmado", "createdAt")
VALUES ('1c000000-0000-4000-8000-000000000025', '18000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000003', '500MG', 'ORAL'::"ViaAdministracao", '2026-05-20 09:32:34', '{"pacienteCerto":true,"medicamentoCerto":true,"doseCerta":true,"viaCerta":true,"horarioCerto":true}'::jsonb, '2026-05-20 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO requisicoes_exames (id, "prontuarioId", categoria, urgencia, indicacao, "createdAt", "updatedAt")
VALUES ('19000000-0000-4000-8000-000000000025', '14000000-0000-4000-8000-000000000025', 'LABORATORIO'::"CategoriaExame", 'ROTINA'::"UrgenciaExame", 'Investigação clínica demo', '2026-05-20 09:32:34', '2026-05-20 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO itens_requisicao (id, "requisicaoId", "nomeExame", observacoes, "createdAt", "updatedAt")
VALUES ('1a000000-0000-4000-8000-000000000025', '19000000-0000-4000-8000-000000000025', 'Raio-X coluna lombar', 'Item demo SQL', '2026-05-20 09:32:34', '2026-05-20 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO evolucoes_medicas (id, "prontuarioId", "autorId", conteudo, template, "registradoEm")
VALUES ('1b000000-0000-4000-8000-000000000025', '14000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000002', '<p>Evolução demo registrada via SQL.</p>', 'SOAP', '2026-05-20 09:32:34')
ON CONFLICT (id) DO NOTHING;
INSERT INTO logs_auditoria (id, "usuarioId", acao, entidade, "entidadeId", "valorNovo", "ipOrigem", "registradoEm")
VALUES ('1f000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000004', 'CRIACAO'::"TipoAcaoAuditoria", 'Atendimento', '11000000-0000-4000-8000-000000000025', 'CONCLUIDO', '127.0.0.1', '2026-05-20 09:32:34')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Fim — 25 pacientes, 25 atendimentos demo
