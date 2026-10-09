import type { Role } from '@prisma/client'

export type ChavePermissao =
  | 'dashboard'
  | 'minha-fila'
  | 'recepcao'
  | 'triagem'
  | 'atendimento-medico'
  | 'medicacao-ps'
  | 'admissoes'
  | 'mapa-leitos'
  | 'prontuario-medico'
  | 'prontuario-enfermagem'
  | 'farmacia'
  | 'farmacia-entradas'
  | 'farmacia-saidas'
  | 'painel'
  | 'cadastros'
  | 'cadastros-clinicas'
  | 'cadastros-leitos'
  | 'cadastros-prescricoes'
  | 'cadastros-usuarios'
  | 'cadastros-medicamentos'
  | 'cadastros-kits'
  | 'cadastros-fornecedores'
  | 'cadastros-sinonimos'
  | 'relatorios'
  | 'relatorios-clinicos'
  | 'relatorios-operacoes'
  | 'auditoria'
  | 'configuracoes'

export interface ItemPermissao {
  chave: ChavePermissao
  label: string
  href: string
  grupo: string
  parent?: ChavePermissao
  rolesPadrao: Role[]
}

const TODAS_ROLES: Role[] = [
  'ADMIN',
  'MEDICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'RECEPCIONISTA',
  'DIRETOR_CLINICO',
  'FARMACEUTICO',
]

const PRONTUARIO: Role[] = [
  'ADMIN',
  'MEDICO',
  'DIRETOR_CLINICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'RECEPCIONISTA',
]

const RELATORIOS: Role[] = [
  'ADMIN',
  'DIRETOR_CLINICO',
  'MEDICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'FARMACEUTICO',
  'RECEPCIONISTA',
]

export const MENU_PERMISSOES: ItemPermissao[] = [
  { chave: 'dashboard', label: 'Dashboard', href: '/dashboard', grupo: 'Atendimento & Clínica', rolesPadrao: TODAS_ROLES },
  { chave: 'minha-fila', label: 'Minha Fila', href: '/minha-fila', grupo: 'Atendimento & Clínica', rolesPadrao: TODAS_ROLES },
  { chave: 'recepcao', label: 'Recepção', href: '/recepcao', grupo: 'Atendimento & Clínica', rolesPadrao: ['ADMIN', 'RECEPCIONISTA', 'ENFERMEIRO', 'MEDICO', 'DIRETOR_CLINICO'] },
  { chave: 'triagem', label: 'Triagem (Manchester)', href: '/triagem', grupo: 'Atendimento & Clínica', rolesPadrao: ['ADMIN', 'ENFERMEIRO', 'MEDICO'] },
  { chave: 'atendimento-medico', label: 'Atendimento Médico', href: '/atendimento', grupo: 'Atendimento & Clínica', rolesPadrao: ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO'] },
  { chave: 'medicacao-ps', label: 'Medicação (PS)', href: '/medicacao', grupo: 'Atendimento & Clínica', rolesPadrao: ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM'] },
  { chave: 'admissoes', label: 'Admissões', href: '/internamento/admissoes', grupo: 'Atendimento & Clínica', rolesPadrao: ['ADMIN', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA', 'MEDICO', 'DIRETOR_CLINICO'] },
  { chave: 'mapa-leitos', label: 'Mapa de Leitos', href: '/internamento/mapa-leitos', grupo: 'Atendimento & Clínica', rolesPadrao: ['ADMIN', 'MEDICO', 'DIRETOR_CLINICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'RECEPCIONISTA', 'FARMACEUTICO'] },
  { chave: 'prontuario-medico', label: 'Prontuário Médico', href: '/prontuario', grupo: 'Atendimento & Clínica', rolesPadrao: PRONTUARIO },
  { chave: 'prontuario-enfermagem', label: 'Prontuário Enfermagem', href: '/evolucoes', grupo: 'Atendimento & Clínica', rolesPadrao: PRONTUARIO },

  { chave: 'farmacia', label: 'Farmácia & Dispensação', href: '/farmacia', grupo: 'Farmácia & Suprimentos', rolesPadrao: ['ADMIN', 'FARMACEUTICO'] },
  { chave: 'farmacia-entradas', label: 'Entradas de NF', href: '/farmacia/entradas', grupo: 'Farmácia & Suprimentos', parent: 'farmacia', rolesPadrao: ['ADMIN', 'FARMACEUTICO'] },
  { chave: 'farmacia-saidas', label: 'Saídas de Estoque', href: '/farmacia/saidas', grupo: 'Farmácia & Suprimentos', parent: 'farmacia', rolesPadrao: ['ADMIN', 'FARMACEUTICO'] },

  { chave: 'painel', label: 'Painel TV (Chamada)', href: '/painel', grupo: 'Gestão & Consultas', rolesPadrao: ['ADMIN', 'ENFERMEIRO', 'MEDICO'] },
  { chave: 'cadastros', label: 'Cadastros', href: '/cadastros/clinicas', grupo: 'Gestão & Consultas', rolesPadrao: ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO'] },
  { chave: 'cadastros-clinicas', label: 'Clínicas', href: '/cadastros/clinicas', grupo: 'Gestão & Consultas', parent: 'cadastros', rolesPadrao: ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO'] },
  { chave: 'cadastros-leitos', label: 'Leitos', href: '/cadastros/leitos', grupo: 'Gestão & Consultas', parent: 'cadastros', rolesPadrao: ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO'] },
  { chave: 'cadastros-prescricoes', label: 'Prescrições Médicas', href: '/cadastros/prescricoes-medicas', grupo: 'Gestão & Consultas', parent: 'cadastros', rolesPadrao: ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO'] },
  { chave: 'cadastros-usuarios', label: 'Profissionais / Usuários', href: '/cadastros/profissionais', grupo: 'Gestão & Consultas', parent: 'cadastros', rolesPadrao: ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO'] },
  { chave: 'cadastros-medicamentos', label: 'Medicamentos e Materiais', href: '/cadastros/medicamentos', grupo: 'Gestão & Consultas', parent: 'cadastros', rolesPadrao: ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO'] },
  { chave: 'cadastros-kits', label: 'Kits Automáticos (Insumos)', href: '/cadastros/kits', grupo: 'Gestão & Consultas', parent: 'cadastros', rolesPadrao: ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO', 'ENFERMEIRO'] },
  { chave: 'cadastros-fornecedores', label: 'Fornecedores', href: '/cadastros/fornecedores', grupo: 'Gestão & Consultas', parent: 'cadastros', rolesPadrao: ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO'] },
  { chave: 'cadastros-sinonimos', label: 'Sinônimos (Farmácia)', href: '/cadastros/sinonimos', grupo: 'Gestão & Consultas', parent: 'cadastros', rolesPadrao: ['ADMIN', 'FARMACEUTICO', 'DIRETOR_CLINICO'] },
  { chave: 'relatorios', label: 'Relatórios & Indicadores', href: '/relatorios/prontuario-medico', grupo: 'Gestão & Consultas', rolesPadrao: RELATORIOS },
  { chave: 'relatorios-clinicos', label: 'Relatórios Clínicos', href: '/relatorios/prontuario-medico', grupo: 'Gestão & Consultas', parent: 'relatorios', rolesPadrao: RELATORIOS },
  { chave: 'relatorios-operacoes', label: 'Cadastros & Operações', href: '/relatorios/atendimentos', grupo: 'Gestão & Consultas', parent: 'relatorios', rolesPadrao: RELATORIOS },

  { chave: 'auditoria', label: 'Auditoria LGPD', href: '/auditoria', grupo: 'Sistema & Segurança', rolesPadrao: ['ADMIN'] },
  { chave: 'configuracoes', label: 'Configurações', href: '/configuracoes', grupo: 'Sistema & Segurança', rolesPadrao: ['ADMIN'] },
]

export function permissaoPadrao(chave: ChavePermissao, role: Role): boolean {
  const item = MENU_PERMISSOES.find((x) => x.chave === chave)
  return item?.rolesPadrao.includes(role) ?? false
}

export function itemPermissaoPorHref(href: string): ItemPermissao | undefined {
  return MENU_PERMISSOES.find((x) => x.href === href)
}

export function chavesPorGrupo(): { grupo: string; itens: ItemPermissao[] }[] {
  const grupos = new Map<string, ItemPermissao[]>()
  for (const item of MENU_PERMISSOES) {
    const atual = grupos.get(item.grupo) ?? []
    atual.push(item)
    grupos.set(item.grupo, atual)
  }
  return Array.from(grupos, ([grupo, itens]) => ({ grupo, itens }))
}
