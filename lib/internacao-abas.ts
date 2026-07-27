// lib/internacao-abas.ts — abas do workspace de internação



import type { ElementType } from 'react'

import {
  Activity,
  Baby,
  ClipboardList,
  FileText,
  FlaskConical,
  LogIn,
  LogOut,
  NotebookPen,
  Pill,
  Shield,
  Stethoscope,
  SunMoon,
  Syringe,
  Users,
} from 'lucide-react'



export type ModoWorkspaceInternacao = 'prontuario' | 'evolucoes'



export type AbaInternacaoId =

  | 'LAUDO'

  | 'INTERNACAO_ALTA'

  | 'CCIH'

  | 'MULTIDISCIPLINAR'

  | 'LAUDO_MEDICO'

  | 'FICHA_EVOLUCAO'

  | 'INSTRUCOES_ENFERMAGEM'

  | 'PRESCRICAO_ENFERMARIA'

  | 'EXAMES'

  | 'SINAIS_VITAIS'

  | 'EVOLUCAO_DIURNA_NOTURNA'

  | 'CONDICOES_ALTA'

  | 'SAE'

  | 'INTERNACAO_OBSTETRICA'

  | 'MEDICACAO_BERCARIO'



const ABAS_VALIDAS = new Set<string>([

  'LAUDO',

  'INTERNACAO_ALTA',

  'CCIH',

  'MULTIDISCIPLINAR',

  'LAUDO_MEDICO',

  'FICHA_EVOLUCAO',

  'INSTRUCOES_ENFERMAGEM',

  'PRESCRICAO_ENFERMARIA',

  'EXAMES',

  'SINAIS_VITAIS',

  'EVOLUCAO_DIURNA_NOTURNA',

  'CONDICOES_ALTA',

  'SAE',

  'INTERNACAO_OBSTETRICA',

  'MEDICACAO_BERCARIO',

])



export type AbaConfig = { id: AbaInternacaoId; label: string; icon: ElementType }



export const ABAS_PRONTUARIO: AbaConfig[] = [
  { id: 'FICHA_EVOLUCAO', label: 'Evolução Médica', icon: NotebookPen },
  { id: 'PRESCRICAO_ENFERMARIA', label: 'Prescrições', icon: Pill },
  { id: 'EXAMES', label: 'Exames', icon: FlaskConical },
  { id: 'LAUDO_MEDICO', label: 'Laudo Médico', icon: Stethoscope },
]

export const ABA_INTERNACAO_OBSTETRICA: AbaConfig = {
  id: 'INTERNACAO_OBSTETRICA',
  label: 'Internação Obstétrica',
  icon: Baby,
}

export const ABA_MEDICACAO_BERCARIO: AbaConfig = {
  id: 'MEDICACAO_BERCARIO',
  label: 'Medicação Berçário',
  icon: Baby,
}



export const ABAS_EVOLUCOES: AbaConfig[] = [

  { id: 'INTERNACAO_ALTA', label: 'Internação', icon: LogIn },

  { id: 'INSTRUCOES_ENFERMAGEM', label: 'Medicamentos', icon: Syringe },

  { id: 'CCIH', label: 'CCIH', icon: Shield },

  { id: 'SINAIS_VITAIS', label: 'Ficha Sinais Vitais', icon: Activity },

  { id: 'EVOLUCAO_DIURNA_NOTURNA', label: 'Evolução Noite/Dia', icon: SunMoon },

  { id: 'CONDICOES_ALTA', label: 'Condições de alta', icon: LogOut },

  { id: 'SAE', label: 'SAE', icon: ClipboardList },

  { id: 'MULTIDISCIPLINAR', label: 'Multidisciplinar', icon: Users },

]

export const parseAbaInternacao = (valor?: string | null): AbaInternacaoId | null => {

  if (!valor?.trim()) return null

  const v = valor.trim().toUpperCase()

  return ABAS_VALIDAS.has(v) ? (v as AbaInternacaoId) : null

}

export const labelAbaInternacao = (
  aba: AbaInternacaoId | null | undefined,
  modo: ModoWorkspaceInternacao = 'evolucoes',
  obstetrico = false
): string | null => {
  if (!aba) return null
  return abasPorModo(modo, obstetrico).find((item) => item.id === aba)?.label ?? null
}



const ROLES_ENFERMAGEM = new Set(['ENFERMEIRO', 'TECNICO_ENFERMAGEM'])



export const isRoleEnfermagem = (role: string): boolean => ROLES_ENFERMAGEM.has(role)



export const abasPorModo = (
  modo: ModoWorkspaceInternacao,
  obstetrico = false
): AbaConfig[] => {
  const base = modo === 'prontuario' ? [...ABAS_PRONTUARIO] : [...ABAS_EVOLUCOES]
  if (!obstetrico) return base
  // Internação obstétrica aparece nos dois modos; berçário só na enfermagem
  base.push(ABA_INTERNACAO_OBSTETRICA)
  if (modo === 'evolucoes') base.push(ABA_MEDICACAO_BERCARIO)
  return base
}



export const abaValidaNoModo = (
  modo: ModoWorkspaceInternacao,
  aba: AbaInternacaoId,
  obstetrico = false
): boolean => abasPorModo(modo, obstetrico).some((a) => a.id === aba)



export const abaPadraoPorModo = (modo: ModoWorkspaceInternacao, role: string): AbaInternacaoId => {

  if (modo === 'prontuario') return 'FICHA_EVOLUCAO'

  if (isRoleEnfermagem(role)) return 'INSTRUCOES_ENFERMAGEM'

  return 'INTERNACAO_ALTA'

}



export const linkEvolucoesPaciente = (atendimentoId: string, aba?: AbaInternacaoId) => {

  const base = `/evolucoes/${atendimentoId}`

  return aba ? `${base}?aba=${aba}` : base

}



export const linkProntuarioPaciente = (atendimentoId: string, aba?: AbaInternacaoId) => {

  const base = `/prontuario/${atendimentoId}`

  return aba ? `${base}?aba=${aba}` : base

}
