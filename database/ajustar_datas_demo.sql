-- =============================================================================
-- SGH — Ajustar datas do seed demo para o período recente
--
-- Use quando o dashboard aparece vazio após importar sgh_dados_demo.sql gerado
-- com datas fixas antigas (ex.: 2026-01-15). O dashboard filtra 30/90 dias.
--
-- Uso:
--   psql "$DATABASE_URL" -f database/ajustar_datas_demo.sql
-- =============================================================================

BEGIN;

DO $$
DECLARE
  ancora timestamptz := '2026-01-15 10:00:00+00';
  desloc interval := date_trunc('minute', now()) - ancora;
BEGIN
  IF desloc = interval '0' THEN
    RAISE NOTICE 'Nada a ajustar (âncora = agora).';
    RETURN;
  END IF;

  RAISE NOTICE 'Deslocando registros demo em %', desloc;

  UPDATE usuarios
  SET "createdAt" = "createdAt" + desloc, "updatedAt" = "updatedAt" + desloc
  WHERE email LIKE '%@hospital.com';

  UPDATE origens_pacientes SET "createdAt" = "createdAt" + desloc WHERE descricao IN (
    'Demanda espontânea', 'SAMU', 'UPA referenciada', 'UBS referenciada', 'Polícia / resgate'
  );

  UPDATE pacientes
  SET "createdAt" = "createdAt" + desloc, "updatedAt" = "updatedAt" + desloc
  WHERE id LIKE '0c000000-%';

  UPDATE enderecos SET "createdAt" = "createdAt" + desloc, "updatedAt" = "updatedAt" + desloc
  WHERE "pacienteId" LIKE '0c000000-%';

  UPDATE alergias SET "createdAt" = "createdAt" + desloc WHERE "pacienteId" LIKE '0c000000-%';

  UPDATE medicamentos_continuos
  SET "createdAt" = "createdAt" + desloc, "updatedAt" = "updatedAt" + desloc
  WHERE "pacienteId" LIKE '0c000000-%';

  UPDATE documentos_pacientes SET "createdAt" = "createdAt" + desloc WHERE "pacienteId" LIKE '0c000000-%';

  UPDATE atendimentos
  SET "createdAt" = "createdAt" + desloc, "updatedAt" = "updatedAt" + desloc
  WHERE "numeroAtendimento" LIKE '%DEMO';

  UPDATE triagens t
  SET
    "entradaTriagem" = t."entradaTriagem" + desloc,
    "classificadoEm" = CASE WHEN t."classificadoEm" IS NOT NULL THEN t."classificadoEm" + desloc ELSE NULL END,
    "createdAt" = t."createdAt" + desloc,
    "updatedAt" = t."updatedAt" + desloc
  FROM atendimentos a
  WHERE t."atendimentoId" = a.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE sinais_vitais sv
  SET "coletadoEm" = sv."coletadoEm" + desloc, "updatedAt" = sv."updatedAt" + desloc
  FROM triagens t
  JOIN atendimentos a ON a.id = t."atendimentoId"
  WHERE sv."triagemId" = t.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE prontuarios_medicos pm
  SET "createdAt" = pm."createdAt" + desloc, "updatedAt" = pm."updatedAt" + desloc
  FROM atendimentos a
  WHERE pm."atendimentoId" = a.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE anamneses an
  SET "createdAt" = an."createdAt" + desloc, "updatedAt" = an."updatedAt" + desloc
  FROM prontuarios_medicos pm
  JOIN atendimentos a ON a.id = pm."atendimentoId"
  WHERE an."prontuarioId" = pm.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE diagnosticos d
  SET "createdAt" = d."createdAt" + desloc, "updatedAt" = d."updatedAt" + desloc
  FROM prontuarios_medicos pm
  JOIN atendimentos a ON a.id = pm."atendimentoId"
  WHERE d."prontuarioId" = pm.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE prescricoes p
  SET "emitidaEm" = p."emitidaEm" + desloc, "createdAt" = p."createdAt" + desloc, "updatedAt" = p."updatedAt" + desloc
  FROM prontuarios_medicos pm
  JOIN atendimentos a ON a.id = pm."atendimentoId"
  WHERE p."prontuarioId" = pm.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE itens_prescricao ip
  SET "createdAt" = ip."createdAt" + desloc, "updatedAt" = ip."updatedAt" + desloc
  FROM prescricoes p
  JOIN prontuarios_medicos pm ON pm.id = p."prontuarioId"
  JOIN atendimentos a ON a.id = pm."atendimentoId"
  WHERE ip."prescricaoId" = p.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE aplicacoes_medicamentos am
  SET "aplicadoEm" = am."aplicadoEm" + desloc, "createdAt" = am."createdAt" + desloc
  FROM itens_prescricao ip
  JOIN prescricoes p ON p.id = ip."prescricaoId"
  JOIN prontuarios_medicos pm ON pm.id = p."prontuarioId"
  JOIN atendimentos a ON a.id = pm."atendimentoId"
  WHERE am."itemPrescricaoId" = ip.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE requisicoes_exames re
  SET "createdAt" = re."createdAt" + desloc, "updatedAt" = re."updatedAt" + desloc
  FROM prontuarios_medicos pm
  JOIN atendimentos a ON a.id = pm."atendimentoId"
  WHERE re."prontuarioId" = pm.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE itens_requisicao ir
  SET "createdAt" = ir."createdAt" + desloc, "updatedAt" = ir."updatedAt" + desloc
  FROM requisicoes_exames re
  JOIN prontuarios_medicos pm ON pm.id = re."prontuarioId"
  JOIN atendimentos a ON a.id = pm."atendimentoId"
  WHERE ir."requisicaoId" = re.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE evolucoes_medicas ev
  SET "registradoEm" = ev."registradoEm" + desloc
  FROM prontuarios_medicos pm
  JOIN atendimentos a ON a.id = pm."atendimentoId"
  WHERE ev."prontuarioId" = pm.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE encaminhamentos en
  SET "createdAt" = en."createdAt" + desloc, "updatedAt" = en."updatedAt" + desloc
  FROM prontuarios_medicos pm
  JOIN atendimentos a ON a.id = pm."atendimentoId"
  WHERE en."prontuarioId" = pm.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE chamadas_painel cp
  SET "chamadoEm" = cp."chamadoEm" + desloc
  FROM atendimentos a
  WHERE cp."atendimentoId" = a.id AND a."numeroAtendimento" LIKE '%DEMO';

  UPDATE logs_auditoria
  SET "registradoEm" = "registradoEm" + desloc
  WHERE entidade IN ('Atendimento', 'Paciente', 'ChamadaPainel') OR "entidadeId" LIKE '%DEMO%';
END $$;

COMMIT;

-- Recarregue /dashboard (filtro 30 dias deve exibir os gráficos)
