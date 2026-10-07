-- Usuários iniciais SGH (senha padrão: Sgh@2024!)
-- Execute APÓS sgh_schema_completo.sql
-- Troque as senhas imediatamente em produção.

INSERT INTO "usuarios" (
  "id", "email", "senhaHash", "nome", "role", "crm", "coren", "ativo", "mfaAtivo", "createdAt", "updatedAt"
) VALUES
  (
    gen_random_uuid(),
    'admin@hospital.com',
    '$2b$12$RQ1l2kkph3.trODYjNmlTusntoEydkB9KKGVhAWDzM0lU5ED7G3O.',
    'Administrador Sistema',
    'ADMIN',
    NULL,
    NULL,
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'medico@hospital.com',
    '$2b$12$RQ1l2kkph3.trODYjNmlTusntoEydkB9KKGVhAWDzM0lU5ED7G3O.',
    'Dr. Carlos Mendes',
    'MEDICO',
    '123456-SP',
    NULL,
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'enfermeiro@hospital.com',
    '$2b$12$RQ1l2kkph3.trODYjNmlTusntoEydkB9KKGVhAWDzM0lU5ED7G3O.',
    'Enf. Ana Beatriz Lima',
    'ENFERMEIRO',
    NULL,
    'COREN-SP 654321',
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'recepcao@hospital.com',
    '$2b$12$RQ1l2kkph3.trODYjNmlTusntoEydkB9KKGVhAWDzM0lU5ED7G3O.',
    'Joana Silva Santos',
    'RECEPCIONISTA',
    NULL,
    NULL,
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'tecnico@hospital.com',
    '$2b$12$RQ1l2kkph3.trODYjNmlTusntoEydkB9KKGVhAWDzM0lU5ED7G3O.',
    'Tec. Marcos Oliveira',
    'TECNICO_ENFERMAGEM',
    NULL,
    'COREN-SP 789012',
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'farmacia@hospital.com',
    '$2b$12$RQ1l2kkph3.trODYjNmlTusntoEydkB9KKGVhAWDzM0lU5ED7G3O.',
    'Farm. Fernanda Alves',
    'FARMACEUTICO',
    NULL,
    NULL,
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'diretor@hospital.com',
    '$2b$12$RQ1l2kkph3.trODYjNmlTusntoEydkB9KKGVhAWDzM0lU5ED7G3O.',
    'Dr. Roberto Faria',
    'DIRETOR_CLINICO',
    '789012-SP',
    NULL,
    true,
    false,
    NOW(),
    NOW()
  )
ON CONFLICT ("email") DO UPDATE SET
  "senhaHash" = EXCLUDED."senhaHash",
  "ativo" = true,
  "updatedAt" = NOW();
