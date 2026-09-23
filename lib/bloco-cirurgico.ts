export interface ChecklistCirurgiaSeguraOms {
  cirurgiaId: string
  atendimentoId: string
  pacienteNome: string
  procedimento: string
  salaCirurgica: string

  // 1. SIGN IN (Antes da indução anestésica)
  signIn: {
    identificacaoConfirmada: boolean
    sitioCirurgicoDemarcado: boolean // ou "NÃO_APLICÁVEL"
    termoConsentimentoAssinado: boolean
    oximetroPulsoInstaladoEFuncionando: boolean
    alergiasConhecidasVerificadas: boolean
    riscoViaAereaDificilAvaliado: boolean
    riscoPerdaSanguineaAvaliado: boolean // Se > 500mL, acesso IV adequado e sangue disponível
    concluidoEm?: string
    responsavelNome: string
  }

  // 2. TIME OUT (Antes da incisão cirúrgica)
  timeOut: {
    apresentacaoEquipeNomeFuncao: boolean
    confirmacaoVerbalPacienteProcedimentoSitio: boolean
    antibioticoprofilaxiaUltimos60Min: boolean
    cirurgiaoReviuEventosCriticosETempoEstimado: boolean
    anestesistaReviuPreocupacoesEspecificas: boolean
    enfermagemReviuEsterilizacaoEInstrumental: boolean
    imagensEssenciaisExibidas: boolean
    concluidoEm?: string
    responsavelNome: string
  }

  // 3. SIGN OUT (Antes do paciente sair da sala de operação)
  signOut: {
    nomeProcedimentoRegistrado: boolean
    contagemCompressasAgulhasInstrumentaisCorreta: boolean
    amostrasBiopsiaIdentificadasERotuladas: boolean
    problemasEquipamentosRegistrados: boolean
    revisaoPreocupacoesPosOperatoriasSRPA: boolean
    concluidoEm?: string
    responsavelNome: string
  }
}

export function validarCompletudeChecklistOms(checklist: ChecklistCirurgiaSeguraOms): {
  completo: boolean
  itensFaltantes: string[]
} {
  const faltantes: string[] = []

  // Validação Sign In
  if (!checklist.signIn.identificacaoConfirmada) faltantes.push('Sign In: Confirmação de identificação do paciente')
  if (!checklist.signIn.termoConsentimentoAssinado) faltantes.push('Sign In: Termo de consentimento cirúrgico')
  if (!checklist.signIn.alergiasConhecidasVerificadas) faltantes.push('Sign In: Verificação de alergias')
  if (!checklist.signIn.riscoViaAereaDificilAvaliado) faltantes.push('Sign In: Avaliação de via aérea difícil')

  // Validação Time Out
  if (!checklist.timeOut.confirmacaoVerbalPacienteProcedimentoSitio) faltantes.push('Time Out: Confirmação verbal de paciente/sítio/procedimento')
  if (!checklist.timeOut.antibioticoprofilaxiaUltimos60Min) faltantes.push('Time Out: Profilaxia antibiótica nos últimos 60 min')
  if (!checklist.timeOut.enfermagemReviuEsterilizacaoEInstrumental) faltantes.push('Time Out: Checagem de esterilização do instrumental')

  // Validação Sign Out
  if (!checklist.signOut.contagemCompressasAgulhasInstrumentaisCorreta) faltantes.push('Sign Out: Contagem de compressas e instrumentais')
  if (!checklist.signOut.revisaoPreocupacoesPosOperatoriasSRPA) faltantes.push('Sign Out: Plano de cuidados para recuperação pós-anestésica (SRPA)')

  return {
    completo: faltantes.length === 0,
    itensFaltantes: faltantes,
  }
}
