import { LABEL_VIA } from '@/lib/fila-medicacao'

export const VIAS_ADMINISTRACAO = [
  'ORAL',
  'INTRAVENOSA',
  'INTRAMUSCULAR',
  'SUBCUTANEA',
  'TOPICA',
  'INALATORIA',
  'SUBLINGUAL',
  'RETAL',
  'OFTALMICA',
  'OTOLOGICA',
  'NASAL',
] as const

export type ViaAdministracao = (typeof VIAS_ADMINISTRACAO)[number]

export const labelVia = (via: string) => LABEL_VIA[via] ?? via

export const LABEL_STATUS_ITEM_PRESCRICAO: Record<string, string> = {
  PENDENTE: 'Pendente',
  APLICADO: 'Aplicado',
  CANCELADO: 'Cancelado',
  SUSPENSO: 'Suspenso',
}

export const classeStatusItemPrescricao = (status: string) => {
  switch (status) {
    case 'PENDENTE':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
    case 'APLICADO':
      return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
    case 'CANCELADO':
    case 'SUSPENSO':
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

/** Atalhos de frequência comuns na prescrição hospitalar */
export const FREQUENCIAS_RAPIDAS = [
  { label: '6/6h', valor: '6/6h' },
  { label: '8/8h', valor: '8/8h' },
  { label: '12/12h', valor: '12/12h' },
  { label: '24/24h', valor: '24/24h' },
  { label: 'Se necessário', valor: 'Se necessário (SOS)' },
  { label: 'Contínuo', valor: 'Contínuo' },
  { label: 'Agora', valor: 'Dose única — agora' },
] as const

export const UNIDADES_MEDIDA = [
  { value: 'mg', label: 'mg — miligrama' },
  { value: 'g', label: 'g — grama' },
  { value: 'mcg', label: 'mcg — micrograma' },
  { value: 'mL', label: 'mL — mililitro' },
  { value: 'L', label: 'L — litro' },
  { value: 'UI', label: 'UI — unidade internacional' },
  { value: 'cp', label: 'cp — comprimido' },
  { value: 'cap', label: 'cap — cápsula' },
  { value: 'amp', label: 'amp — ampola' },
  { value: 'fr', label: 'fr — frasco' },
  { value: 'gts', label: 'gts — gotas' },
  { value: 'ad', label: 'ad — aplicação' },
  { value: 'pct', label: 'pct — pacote' },
] as const

export const formatarDosePrescricao = (dose: string, unidadeMedida?: string | null) => {
  const qtd = dose?.trim() ?? ''
  const un = unidadeMedida?.trim() ?? ''
  if (qtd === 'LINHA_DUPLA' || qtd === '—') return un || ''
  if (qtd && un) return `${qtd} ${un}`
  return qtd || un
}

export const formatarResumoLinhaPrescricao = (item: {
  dose: string
  unidadeMedida?: string | null
  via: string
  frequencia?: string | null
  observacoes?: string | null
}) => {
  const doseFmt = formatarDosePrescricao(item.dose, item.unidadeMedida)
  const viaFmt = labelVia(item.via)
  const obsOuFreq = item.observacoes?.trim() || item.frequencia?.trim()

  if (!doseFmt || item.dose === 'LINHA_DUPLA' || item.dose === '—') {
    if (obsOuFreq && obsOuFreq !== 'Conforme prescrição' && obsOuFreq !== '—') {
      return obsOuFreq
    }
    return viaFmt && viaFmt !== 'VO' ? viaFmt : 'Orientação / Enfermagem'
  }

  const partes = [doseFmt]
  if (viaFmt) partes.push(viaFmt)
  if (obsOuFreq && obsOuFreq !== 'Conforme prescrição' && obsOuFreq !== '—' && obsOuFreq !== item.dose?.trim()) {
    partes.push(obsOuFreq)
  }
  return partes.join(' · ')
}

/** Tenta separar dose legada "500 mg" em quantidade + unidade */
export const separarDoseUnidade = (
  dose: string,
  unidadeMedida?: string | null
): { dose: string; unidadeMedida: string } => {
  if (unidadeMedida?.trim()) {
    return { dose: dose.trim(), unidadeMedida: unidadeMedida.trim() }
  }
  const t = dose.trim()
  const match = t.match(/^([\d.,]+)\s+([a-zA-Z]+(?:\/[a-zA-Z]+)?)$/)
  if (match) return { dose: match[1], unidadeMedida: match[2] }
  return { dose: t, unidadeMedida: '' }
}
