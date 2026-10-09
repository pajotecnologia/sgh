'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Loader2,
  NotebookPen,
  Save,
  Baby,
  Sparkles,
  HeartPulse,
  Activity,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Clock,
  ShieldAlert,
  RotateCw,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { textoCadastroMaiusculo } from '@/lib/cadastro-maiusculo'
import { cn } from '@/lib/utils'

interface EvolucaoItem {
  id: string
  conteudo: string
  template: string | null
  registradoEm: string
  autor: { nome: string; crm: string | null }
}

interface ContextoObstetricoDinamico {
  gpa: string
  dumData: string
  igTexto: string
  pa: string
  fc: string
  tax: string
  bcf: string
  alertaBcf: boolean
  du: string
  au: string
  dilatacao: string
  apagamento: string
  deLee: string
  bolsa: string
  movFetal: string
  uteroPuerperio: string
  loquios: string
  fo: string
  mamas: string
}

const MODELOS_OBSTETRICOS_CONFIG: {
  id: string
  titulo: string
  badge: string
  tipo: 'gestante' | 'puerpera' | 'geral'
  gerar: (c: ContextoObstetricoDinamico) => string
}[] = [
  {
    id: 'parto_ativo',
    titulo: 'Trabalho de Parto (Fase Ativa)',
    badge: 'Parto Ativo',
    tipo: 'gestante',
    gerar: (c) => {
      const gpaStr = c.gpa ? `${c.gpa}, ` : ''
      const igStr = c.igTexto ? `IG (DUM): ${c.igTexto}, ` : ''
      const svStr = [
        c.pa ? `PA: ${c.pa} MMHG` : '',
        c.fc ? `FC: ${c.fc} BPM` : '',
        c.tax ? `TAX: ${c.tax}°C` : '',
      ]
        .filter(Boolean)
        .join(', ')

      const toqueStr = [
        c.dilatacao ? `DILATAÇÃO ${c.dilatacao} CM` : 'DILATAÇÃO 6 CM',
        c.apagamento ? `APAGAMENTO ${c.apagamento}` : 'APAGAMENTO 80-100%',
        c.deLee ? `APRESENTAÇÃO ${c.deLee}` : 'CEFÁLICA EM PLANO 0',
        c.bolsa ? `BOLSA ${c.bolsa.toUpperCase()}` : 'BOLSA ÍNTEGRA',
      ].join(', ')

      return (
        `GESTANTE ${gpaStr}${igStr}EM TRABALHO DE PARTO ATIVO (FASE ATIVA). BOM ESTADO GERAL, LÚCIDA, ORIENTADA, EUPNEICA, CORADA.\n` +
        `SINAIS VITAIS: ${svStr || 'ESTÁVEIS'}.\n` +
        `BCF: ${c.bcf || '140'} BPM (${c.alertaBcf ? '⚠️ ALERTA DE FREQUÊNCIA' : 'RÍTMICO, SEM DESACELERAÇÕES'}).\n` +
        `DINÂMICA UTERINA (DU): ${c.du || '3 CONTRAÇÕES DE 40" EM 10 MIN'}.\n` +
        `ALTURA UTERINA (AU): ${c.au ? `${c.au} CM` : 'COMPATÍVEL COM A IG'}.\n` +
        `TOQUE VAGINAL: COLO CENTRALIZADO, ${toqueStr}.\n` +
        `MOVIMENTAÇÃO FETAL: ${c.movFetal.toUpperCase()}.\n` +
        `CONDUTA: PARTOGRAMA ATIVO, MÉTODOS NÃO FARMACOLÓGICOS DE ALÍVIO DA DOR, DEAMBULAÇÃO ESTIMULADA, MONITORIZAÇÃO INTERMITENTE DE BCF E DU A CADA 30 MINUTOS.`
      )
    },
  },
  {
    id: 'fase_latente',
    titulo: 'Fase Latente / Admissão',
    badge: 'Fase Latente',
    tipo: 'gestante',
    gerar: (c) => {
      const gpaStr = c.gpa ? `${c.gpa}, ` : ''
      const igStr = c.igTexto ? `IG (DUM): ${c.igTexto}, ` : ''
      const svStr = [
        c.pa ? `PA: ${c.pa} MMHG` : '',
        c.fc ? `FC: ${c.fc} BPM` : '',
      ]
        .filter(Boolean)
        .join(', ')

      return (
        `GESTANTE ${gpaStr}${igStr}EM FASE LATENTE DE TRABALHO DE PARTO. CONSCIENTE, ORIENTADA, SINAIS VITAIS: ${svStr || 'ESTÁVEIS'}.\n` +
        `BCF: ${c.bcf || '138'} BPM RÍTMICO.\n` +
        `DU: ${c.du || '1-2 CONTRAÇÕES DE 25" EM 10 MIN (IRREGULARES)'}. AU: ${c.au ? `${c.au} CM` : 'COMPATÍVEL COM IG'}.\n` +
        `TOQUE VAGINAL: COLO POSTERIOR/INTERMEDIÁRIO, APAGAMENTO ${c.apagamento || '50%'}, DILATAÇÃO DE ${c.dilatacao ? `${c.dilatacao} CM` : '2-3 CM'}, APRESENTAÇÃO ${c.deLee || 'CEFÁLICA ALTA E MÓVEL (DE LEE -2)'}, BOLSA ${c.bolsa.toUpperCase()}.\n` +
        `SEM PERDAS VAGINAIS SUSPEITAS. MOVIMENTAÇÃO FETAL: ${c.movFetal.toUpperCase()}.\n` +
        `CONDUTA: ORIENTADA SOBRE SINAIS DE ALARME E FASE ATIVA, HIDRATAÇÃO ORAL, ESTIMULADA DEAMBULAÇÃO, REAVALIAÇÃO CLÍNICO-OBSTÉTRICA EM 2 HORAS.`
      )
    },
  },
  {
    id: 'rupreme',
    titulo: 'Rotura Prematura (RUPREME)',
    badge: 'Bolsa Rota',
    tipo: 'gestante',
    gerar: (c) => {
      const gpaStr = c.gpa ? `${c.gpa}, ` : ''
      const igStr = c.igTexto ? `IG (DUM): ${c.igTexto}, ` : ''
      const svStr = [
        c.pa ? `PA: ${c.pa} MMHG` : '',
        c.fc ? `FC: ${c.fc} BPM` : '',
        c.tax ? `TAX: ${c.tax}°C` : '',
      ]
        .filter(Boolean)
        .join(', ')

      return (
        `GESTANTE ${gpaStr}${igStr}ADMITIDA COM HISTÓRIA DE PERDA SÚBITA DE LÍQUIDO VIA VAGINAL. SINAIS VITAIS: ${svStr || 'ESTÁVEIS'}.\n` +
        `EXAME ESPECULAR: SAÍDA DE LÍQUIDO AMNIÓTICO CLARO COM GRUMOS PELO ORIFÍCIO EXTERNO DO COLO À MANOBRA DE VALSALVA (+).\n` +
        `AUSÊNCIA DE SINAIS DE CORIOAMNIONITE (AFEBRIL, SEM TAQUICARDIA FETAL OU MATERNA, SEM ODOR FÉTIDO).\n` +
        `BCF: ${c.bcf || '142'} BPM RÍTMICO. DU: ${c.du || 'AUSENTE'}. BOLSA: ROTA.\n` +
        `CONDUTA: INTERNAÇÃO EM ENFERMARIA OBSTÉTRICA, REPOUSO RELATIVO, CONTROLE TÉRMICO E DE SINAIS VITAIS 4/4H, AVALIAR PROFILAXIA PARA GBS E INDUÇÃO/CONDUTA CONFORME IDADE GESTACIONAL E PROTOCOLO.`
      )
    },
  },
  {
    id: 'dheg',
    titulo: 'Pré-Eclâmpsia / Síndrome Hipertensiva',
    badge: 'Hipertensão / DHEG',
    tipo: 'gestante',
    gerar: (c) => {
      const gpaStr = c.gpa ? `${c.gpa}, ` : ''
      const igStr = c.igTexto ? `IG (DUM): ${c.igTexto}, ` : ''
      return (
        `GESTANTE ${gpaStr}${igStr}COM QUADRO HIPERTENSIVO ADMITIDA PARA MONITORIZAÇÃO E CONDUTA.\n` +
        `PA: ${c.pa || '150/95'} MMHG (CONFIRMADA APÓS REPOUSO). NEGA CEFALEIA EM PRESSÃO, ESCOTOMAS CINTILANTES OU EPIGASTRALGIA (SINAIS PREMONITÓRIOS NEGATIVOS).\n` +
        `BCF: ${c.bcf || '144'} BPM RÍTMICO. DU: ${c.du || 'AUSENTE'}. EDEMA DE MMII (+/4+). REFLEXOS PROFUNDOS NORMAIS.\n` +
        `CONDUTA: REPOUSO NO LEITO EM DECÚBITO LATERAL ESQUERDO (DLE), ROTINA LABORATORIAL DE PRÉ-ECLÂMPSIA (HEMOGRAMA, PLAQUETAS, TGO/TGP, LDH, ÁCIDO ÚRICO, CREATININA, PROTEINÚRIA EM AMOSTRA ISOLADA), MONITORIZAÇÃO PRESSÓRICA HORÁRIA E AVALIAÇÃO DE SINAIS PREMONITÓRIOS.`
      )
    },
  },
  {
    id: 'vitalidade_fetal',
    titulo: 'Avaliação de Vitalidade Fetal',
    badge: 'Vitalidade Fetal',
    tipo: 'gestante',
    gerar: (c) => {
      const gpaStr = c.gpa ? `${c.gpa}, ` : ''
      const igStr = c.igTexto ? `IG (DUM): ${c.igTexto}, ` : ''
      const svStr = [c.pa ? `PA ${c.pa} MMHG` : '', c.fc ? `FC ${c.fc} BPM` : '']
        .filter(Boolean)
        .join(', ')

      return (
        `AVALIAÇÃO DE ROTINA DA VITALIDADE FETAL. GESTANTE ${gpaStr}${igStr}REFERE BOA MOVIMENTAÇÃO FETAL NAS ÚLTIMAS 24H.\n` +
        `SINAIS VITAIS MATERNOS: ${svStr || 'ESTÁVEIS'}.\n` +
        `AUSCULTA CARDIATOCOGRÁFICA / SONAR: BCF BASAL DE ${c.bcf || '144'} BPM (${c.alertaBcf ? '⚠️ ALERTA DE FREQUÊNCIA' : 'RÍTMICO, PRESENÇA DE ACELERAÇÕES TRANSITÓRIAS, AUSÊNCIA DE DESACELERAÇÕES'}).\n` +
        `DINÂMICA UTERINA (DU): ${c.du || 'AUSENTE'}. MOVIMENTAÇÃO FETAL: ${c.movFetal.toUpperCase()}.\n` +
        `CONDUTA: VITALIDADE FETAL PRESERVADA, SEGUIMENTO DO PLANO ASSISTENCIAL OBSTÉTRICO.`
      )
    },
  },
  {
    id: 'puerpera_vaginal',
    titulo: 'Puérpera - Pós-Parto Vaginal (D1/D2)',
    badge: 'Pós-Parto Vaginal',
    tipo: 'puerpera',
    gerar: (c) => {
      const gpaStr = c.gpa ? `(${c.gpa}) ` : ''
      const svStr = [
        c.pa ? `PA: ${c.pa} MMHG` : '',
        c.fc ? `FC: ${c.fc} BPM` : '',
        c.tax ? `TAX: ${c.tax}°C` : '',
      ]
        .filter(Boolean)
        .join(', ')

      return (
        `PUÉRPERA ${gpaStr}EM PÓS-PARTO VAGINAL SEM INTERCORRÊNCIAS. BOM ESTADO GERAL, CORADA, HIDRATADA, AFEBRIL. SINAIS VITAIS: ${svStr || 'ESTÁVEIS'}.\n` +
        `MAMAS: ${c.mamas || 'TÚRGIDAS, SECRETANTES (COLOSTRO PRESENTE), MAMILOS ÍNTEGROS, BOA PEGA'}.\n` +
        `ABDOME: FLÁCIDO, INDOLOR À PALPAÇÃO. ÚTERO: ${c.uteroPuerperio.toUpperCase()} (GLOBO DE PINARD PALPÁVEL ABAIXO DA CICATRIZ UMBILICAL).\n` +
        `LÓQUIOS: ${c.loquios.toUpperCase()}.\n` +
        `PERÍNEO: ${c.fo.toUpperCase()} (SEM HEMATOMAS OU SINAIS FLOGÍSTICOS). DIURESE E EVACUAÇÕES PRESENTES.\n` +
        `CONDUTA: MANTER ANALGESIA CONFORME DEMANDA, ESTIMULAR ALEITAMENTO MATERNO EXCLUSIVO E ORIENTAÇÕES PARA ALTA CONFORME PROTOCOLO.`
      )
    },
  },
  {
    id: 'puerpera_cesaria',
    titulo: 'Puérpera - Pós-Cesariana (D1/D2)',
    badge: 'Pós-Cesárea',
    tipo: 'puerpera',
    gerar: (c) => {
      const gpaStr = c.gpa ? `(${c.gpa}) ` : ''
      const svStr = [
        c.pa ? `PA: ${c.pa} MMHG` : '',
        c.fc ? `FC: ${c.fc} BPM` : '',
        c.tax ? `TAX: ${c.tax}°C` : '',
      ]
        .filter(Boolean)
        .join(', ')

      return (
        `PUÉRPERA ${gpaStr}EM PÓS-OPERATÓRIO DE CESARIANA POR INDICAÇÃO OBSTÉTRICA. LÚCIDA, ORIENTADA, CORADA, EUPNEICA, AFEBRIL. SINAIS VITAIS: ${svStr || 'ESTÁVEIS'}.\n` +
        `MAMAS: ${c.mamas || 'SIMÉTRICAS, LACTAÇÃO INICIADA, SEM INGURGITAMENTO PATOLÓGICO'}.\n` +
        `ABDOME: FLÁCIDO, RUÍDOS HIDROAÉREOS PRESENTES. ÚTERO: ${c.uteroPuerperio.toUpperCase()}.\n` +
        `FERIDA OPERATÓRIA (FO): ${c.fo.toUpperCase()} (CURATIVO LIMPO E SECO, SEM SINAIS FLOGÍSTICOS OU DEISCÊNCIA).\n` +
        `LÓQUIOS: ${c.loquios.toUpperCase()}. DIURESE LIVRE E CLARA.\n` +
        `CONDUTA: DIETA GERAL, ANALGESIA PROGRAMADA, DEAMBULAÇÃO PRECOCE ESTIMULADA, CUIDADOS COM A FO E APOIO À AMAMENTAÇÃO.`
      )
    },
  },
]

function extrairDataIso(dataStr?: string | null): string {
  if (!dataStr?.trim()) return ''
  const s = dataStr.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/')
    return `${y}-${m}-${d}`
  }
  try {
    const d = parseISO(s)
    if (!isNaN(d.getTime())) return format(d, 'yyyy-MM-dd')
  } catch {
    // ignore
  }
  return ''
}

export function FormularioEvolucao({
  atendimentoId,
  prontuarioId,
  evolucoesIniciais,
  onSalvo,
  textoSugerido,
  preencherAutomaticamente = false,
  variant = 'default',
  obstetrico = false,
}: {
  atendimentoId: string
  prontuarioId: string
  evolucoesIniciais: EvolucaoItem[]
  onSalvo: () => void
  textoSugerido?: string
  /** Quando true, preenche o campo com o contexto clínico ao abrir (internação). */
  preencherAutomaticamente?: boolean
  /** prontuario: botão Salvar só após preencher; histórico atualiza na hora abaixo do formulário */
  variant?: 'default' | 'prontuario'
  /** Habilita templates e assistente obstétrico quando verdadeiro */
  obstetrico?: boolean
}) {
  const textoInicial =
    preencherAutomaticamente && textoSugerido?.trim()
      ? textoCadastroMaiusculo(textoSugerido.trim())
      : ''

  const [conteudo, setConteudo] = useState(textoInicial)
  const [template, setTemplate] = useState<'LIVRE' | 'SOAP'>('LIVRE')
  const [enviando, setEnviando] = useState(false)
  const [mostrarUltimaEvolucao, setMostrarUltimaEvolucao] = useState(false)
  const [evolucoes, setEvolucoes] = useState<EvolucaoItem[]>(evolucoesIniciais)
  const [evolucaoRecemSalvaId, setEvolucaoRecemSalvaId] = useState<string | null>(null)
  const [modoObstetricoAtivo, setModoObstetricoAtivo] = useState(obstetrico)
  const [mostrarAssistenteObstetrico, setMostrarAssistenteObstetrico] = useState(false)
  const [carregandoDadosObstetricos, setCarregandoDadosObstetricos] = useState(false)
  const [dadosSincronizadosEm, setDadosSincronizadosEm] = useState<Date | null>(null)
  const [ehPuerperaDetectada, setEhPuerperaDetectada] = useState(false)

  // Assistente de Parâmetros Obstétricos Rápidos (Single Source of Truth)
  const [gpaInput, setGpaInput] = useState('')
  const [dumData, setDumData] = useState('')
  const [igCalculada, setIgCalculada] = useState('')
  const [paInput, setPaInput] = useState('')
  const [fcInput, setFcInput] = useState('')
  const [taxInput, setTaxInput] = useState('')
  const [duInput, setDuInput] = useState('3/10\' 40"')
  const [bcfInput, setBcfInput] = useState('140')
  const [auInput, setAuInput] = useState('33')
  const [dilatacaoInput, setDilatacaoInput] = useState('6')
  const [apagamentoInput, setApagamentoInput] = useState('80%')
  const [deLeeInput, setDeLeeInput] = useState('Cefálica em Plano 0')
  const [bolsaInput, setBolsaInput] = useState('Íntegra')
  const [movFetalInput, setMovFetalInput] = useState('Presente')
  const [uteroPuerperio, setUteroPuerperio] = useState('Contraído (Globo de Pinard)')
  const [loquiosInput, setLoquiosInput] = useState('Rubros fisiológicos')
  const [foInput, setFoInput] = useState('Sem sinais flogísticos')
  const [mamasInput, setMamasInput] = useState('Túrgidas, secretantes, boa pega')

  const historicoRef = useRef<HTMLDivElement>(null)

  const conteudoValido = conteudo.trim().length >= 10
  const modoProntuario = variant === 'prontuario'

  useEffect(() => {
    setEvolucoes(evolucoesIniciais)
  }, [evolucoesIniciais])

  useEffect(() => {
    setModoObstetricoAtivo(obstetrico)
  }, [obstetrico])

  useEffect(() => {
    if (!evolucaoRecemSalvaId) return
    const timer = setTimeout(() => setEvolucaoRecemSalvaId(null), 4000)
    return () => clearTimeout(timer)
  }, [evolucaoRecemSalvaId])

  useEffect(() => {
    if (!preencherAutomaticamente || !textoSugerido?.trim()) return
    setConteudo((atual) => {
      if (atual.trim()) return atual
      return textoCadastroMaiusculo(textoSugerido.trim())
    })
  }, [preencherAutomaticamente, textoSugerido])

  // Cálculo de Idade Gestacional por DUM
  const calcularIdadeGestacional = useCallback((dataIso: string) => {
    if (!dataIso) return ''
    try {
      const dtDum = parseISO(dataIso)
      if (!isNaN(dtDum.getTime())) {
        const dias = differenceInDays(new Date(), dtDum)
        if (dias > 0 && dias < 320) {
          const semanas = Math.floor(dias / 7)
          const diasRest = dias % 7
          return `${semanas} semanas e ${diasRest} dias`
        }
      }
    } catch {
      // ignore
    }
    return ''
  }, [])

  useEffect(() => {
    if (dumData) {
      const ig = calcularIdadeGestacional(dumData)
      setIgCalculada(ig)
    }
  }, [dumData, calcularIdadeGestacional])

  // =========================================================================
  // CARREGAR DADOS DO SISTEMA SEM REDUNDÂNCIA (Single Source of Truth)
  // =========================================================================
  const carregarContextoObstetricoAutomatico = useCallback(
    async (silencioso = false) => {
      if (!atendimentoId) return
      if (!silencioso) setCarregandoDadosObstetricos(true)
      try {
        const [resObst, resProntuario] = await Promise.allSettled([
          fetch(`/api/atendimento/${atendimentoId}/internacao-obstetrica`),
          fetch(`/api/atendimento/${atendimentoId}/prontuario`),
        ])

        let dadosObst: any = null
        if (resObst.status === 'fulfilled' && resObst.value.ok) {
          const jsonO = await resObst.value.json()
          if (jsonO.sucesso) dadosObst = jsonO.dados?.prefill
        }

        let dadosPront: any = null
        if (resProntuario.status === 'fulfilled' && resProntuario.value.ok) {
          const jsonP = await resProntuario.value.json()
          if (jsonP.sucesso) dadosPront = jsonP.dados
        }

        const campos = dadosObst?.campos ?? {}
        const trabalhoParto = Array.isArray(dadosObst?.trabalhoParto) ? dadosObst.trabalhoParto : []
        const puerperio = Array.isArray(dadosObst?.puerperio) ? dadosObst.puerperio : []
        const triagemSv = dadosPront?.atendimento?.triagem?.sinaisVitais

        // 1. DUM & Idade Gestacional
        const dumOrig = extrairDataIso(campos.ef_ultimasRegras)
        if (dumOrig) {
          setDumData(dumOrig)
          const ig = calcularIdadeGestacional(dumOrig)
          if (ig) setIgCalculada(ig)
        }

        // 2. GPA
        const g = campos.am_gesta || ''
        const p = campos.am_para || ''
        const a = campos.ef_abortoProvocado === 'Sim' ? '1' : campos.am_abortos || ''
        if (g || p) {
          const gpaFormatado = `G${g || '1'}P${p || '0'}${a ? `A${a}` : ''}`
          setGpaInput(gpaFormatado)
        }

        // 3. Sinais Vitais da Triagem ou Exame
        if (triagemSv?.paSistolica != null && triagemSv?.paDiastolica != null) {
          setPaInput(`${triagemSv.paSistolica}/${triagemSv.paDiastolica}`)
        } else if (campos.ef_pa) {
          setPaInput(campos.ef_pa)
        }

        if (triagemSv?.frequenciaCardiaca != null) {
          setFcInput(String(triagemSv.frequenciaCardiaca))
        }
        if (triagemSv?.temperatura != null) {
          setTaxInput(String(triagemSv.temperatura))
        }

        // 4. Última linha do Partograma / Trabalho de Parto (se houver) ou Ficha
        const ultimaLinhaTP = trabalhoParto.length > 0 ? trabalhoParto[trabalhoParto.length - 1] : null
        if (ultimaLinhaTP?.bcp) {
          setBcfInput(ultimaLinhaTP.bcp)
        } else if (campos.ef_ausculta) {
          setBcfInput(campos.ef_ausculta)
        }

        if (ultimaLinhaTP?.dilatacao) {
          setDilatacaoInput(ultimaLinhaTP.dilatacao)
        } else if (campos.ef_dilatacaoColo) {
          setDilatacaoInput(campos.ef_dilatacaoColo)
        }

        if (ultimaLinhaTP?.bolsaDagua) {
          setBolsaInput(ultimaLinhaTP.bolsaDagua)
        } else if (campos.ef_bcfBolsaAgua) {
          setBolsaInput(campos.ef_bcfBolsaAgua)
        }

        if (ultimaLinhaTP?.apresentacao || ultimaLinhaTP?.insinuacao) {
          const parteApr = [ultimaLinhaTP.apresentacao, ultimaLinhaTP.insinuacao].filter(Boolean).join(' / ')
          if (parteApr) setDeLeeInput(parteApr)
        } else if (campos.ef_apresentacao || campos.ef_grauInsinuacao) {
          const parteApr = [campos.ef_apresentacao, campos.ef_grauInsinuacao].filter(Boolean).join(' / ')
          if (parteApr) setDeLeeInput(parteApr)
        }

        if (campos.ef_uteroAltura) {
          setAuInput(campos.ef_uteroAltura)
        }

        // 5. Puerpério / Parto Realizado
        const jaTeveParto =
          Boolean(campos.parto_hora?.trim()) ||
          campos.alta_categoria === 'Puérpera' ||
          puerperio.length > 0

        setEhPuerperaDetectada(jaTeveParto)

        const ultimaLinhaPuerp = puerperio.length > 0 ? puerperio[puerperio.length - 1] : null
        if (ultimaLinhaPuerp?.utero) {
          setUteroPuerperio(ultimaLinhaPuerp.utero)
        }
        if (ultimaLinhaPuerp?.loquios) {
          setLoquiosInput(ultimaLinhaPuerp.loquios)
        }
        if (ultimaLinhaPuerp?.mamas) {
          setMamasInput(ultimaLinhaPuerp.mamas)
        }

        setDadosSincronizadosEm(new Date())
        if (!silencioso) {
          toast.success('Dados obstétricos sincronizados da admissão!')
        }
      } catch {
        // falha silenciosa
      } finally {
        if (!silencioso) setCarregandoDadosObstetricos(false)
      }
    },
    [atendimentoId, calcularIdadeGestacional]
  )

  useEffect(() => {
    if (modoObstetricoAtivo && !dadosSincronizadosEm) {
      carregarContextoObstetricoAutomatico(true)
    }
  }, [modoObstetricoAtivo, dadosSincronizadosEm, carregarContextoObstetricoAutomatico])

  const ultimaEvolucao = useMemo(() => {
    if (evolucoes.length === 0) return null
    return [...evolucoes].sort(
      (a, b) => new Date(b.registradoEm).getTime() - new Date(a.registradoEm).getTime()
    )[0]
  }, [evolucoes])

  const evolucoesOrdenadas = useMemo(
    () =>
      [...evolucoes].sort(
        (a, b) => new Date(b.registradoEm).getTime() - new Date(a.registradoEm).getTime()
      ),
    [evolucoes]
  )

  const bcfNum = parseInt(bcfInput, 10)
  const alertaBcf = !isNaN(bcfNum) && (bcfNum < 110 || bcfNum > 160)

  const contextoObstetricoAtual = useMemo<ContextoObstetricoDinamico>(
    () => ({
      gpa: gpaInput,
      dumData,
      igTexto: igCalculada,
      pa: paInput,
      fc: fcInput,
      tax: taxInput,
      bcf: bcfInput,
      alertaBcf,
      du: duInput,
      au: auInput,
      dilatacao: dilatacaoInput,
      apagamento: apagamentoInput,
      deLee: deLeeInput,
      bolsa: bolsaInput,
      movFetal: movFetalInput,
      uteroPuerperio,
      loquios: loquiosInput,
      fo: foInput,
      mamas: mamasInput,
    }),
    [
      gpaInput,
      dumData,
      igCalculada,
      paInput,
      fcInput,
      taxInput,
      bcfInput,
      alertaBcf,
      duInput,
      auInput,
      dilatacaoInput,
      apagamentoInput,
      deLeeInput,
      bolsaInput,
      movFetalInput,
      uteroPuerperio,
      loquiosInput,
      foInput,
      mamasInput,
    ]
  )

  function aplicarModelo(mod: (typeof MODELOS_OBSTETRICOS_CONFIG)[number]) {
    const textoGerado = mod.gerar(contextoObstetricoAtual)
    setConteudo(textoCadastroMaiusculo(textoGerado))
    toast.success(`Modelo "${mod.titulo}" gerado com os dados da paciente!`)
  }

  function gerarSinteseObstetrica() {
    const partes: string[] = []
    if (gpaInput) partes.push(`GPA: ${gpaInput.toUpperCase()}`)
    if (igCalculada) partes.push(`IG (DUM): ${igCalculada.toUpperCase()}`)
    if (paInput) partes.push(`PA: ${paInput} MMHG`)
    if (bcfInput) partes.push(`BCF: ${bcfInput} BPM (${alertaBcf ? '⚠️ ALERTA' : 'RÍTMICO'})`)
    if (duInput) partes.push(`DU: ${duInput.toUpperCase()}`)
    if (auInput) partes.push(`AU: ${auInput} CM`)
    if (dilatacaoInput || apagamentoInput || deLeeInput || bolsaInput) {
      partes.push(
        `TOQUE: COLO ${dilatacaoInput || '—'} CM, APAGAMENTO ${apagamentoInput || '—'}, DE LEE ${deLeeInput.toUpperCase() || '—'}, BOLSA ${bolsaInput.toUpperCase() || '—'}`
      )
    }
    if (movFetalInput) partes.push(`MOVIMENTAÇÃO FETAL: ${movFetalInput.toUpperCase()}`)
    if (ehPuerperaDetectada || uteroPuerperio) {
      partes.push(`ÚTERO: ${uteroPuerperio.toUpperCase()}`)
      if (loquiosInput) partes.push(`LÓQUIOS: ${loquiosInput.toUpperCase()}`)
      if (foInput) partes.push(`FERIDA/PERÍNEO: ${foInput.toUpperCase()}`)
    }

    const blocoGerado = `[AVALIAÇÃO OBSTÉTRICA CONSOLIDADA]\n${partes.join(' | ')}`
    setConteudo((prev) => (prev ? `${prev}\n\n${blocoGerado}` : blocoGerado))
    toast.success('Parâmetros obstétricos inseridos na evolução!')
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!conteudoValido) {
      toast.error('Descreva a evolução (mínimo 10 caracteres).')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/evolucao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prontuarioId, conteudo: conteudo.trim(), template }),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar evolução.')
        return
      }

      const novaEvolucao: EvolucaoItem = {
        id: json.dados.id,
        conteudo: json.dados.conteudo,
        template: json.dados.template ?? null,
        registradoEm:
          typeof json.dados.registradoEm === 'string'
            ? json.dados.registradoEm
            : new Date(json.dados.registradoEm).toISOString(),
        autor: json.dados.autor,
      }

      setEvolucoes((atual) => [novaEvolucao, ...atual.filter((ev) => ev.id !== novaEvolucao.id)])
      setEvolucaoRecemSalvaId(novaEvolucao.id)
      setConteudo('')
      setMostrarUltimaEvolucao(false)
      toast.success('Evolução registrada com sucesso.')
      onSalvo()
      requestAnimationFrame(() => {
        historicoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setEnviando(false)
    }
  }

  const exibirBotaoSalvar = modoProntuario ? conteudoValido : true

  return (
    <div className={cn('space-y-4', modoProntuario && 'space-y-4')}>
      <form onSubmit={salvar} className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
        {/* CABEÇALHO DO FORMULÁRIO */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <NotebookPen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Nova Evolução Médica
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Registro clínico contínuo e acompanhamento hospitalar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TOGGLE MODO OBSTÉTRICO */}
            <button
              type="button"
              onClick={() => setModoObstetricoAtivo((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                modoObstetricoAtivo
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-2xs font-bold'
                  : 'bg-background hover:bg-muted text-muted-foreground border-border'
              )}
            >
              <Baby className="h-3.5 w-3.5" />
              <span>Modo Obstétrico</span>
              {modoObstetricoAtivo && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            <div className="flex items-center gap-1.5 text-xs bg-muted/40 px-2 py-1 rounded-lg border border-border">
              <span className="text-muted-foreground font-medium">Modelo:</span>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as 'LIVRE' | 'SOAP')}
                className="bg-transparent font-semibold text-foreground focus:outline-none cursor-pointer text-xs"
              >
                <option value="LIVRE">Texto Livre</option>
                <option value="SOAP">SOAP Estruturado</option>
              </select>
            </div>
          </div>
        </div>

        {/* MÓDULO ESPECIALIZADO OBSTÉTRICO INTELIGENTE (SEM REDUNDÂNCIA) */}
        {modoObstetricoAtivo && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-rose-500" />
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">
                  Modelos Rápidos Especializados & Assistente Obstétrico
                </span>
                {ehPuerperaDetectada && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-500/30">
                    🤱 Paciente em Puerpério
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => carregarContextoObstetricoAutomatico(false)}
                  disabled={carregandoDadosObstetricos}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-500/30 bg-background/80 hover:bg-rose-500/10 text-[11px] font-medium text-rose-600 dark:text-rose-300 transition-colors"
                  title="Sincronizar com Triagem e Ficha Obstétrica"
                >
                  <RotateCw className={cn('h-3 w-3', carregandoDadosObstetricos && 'animate-spin')} />
                  {carregandoDadosObstetricos ? 'Sincronizando...' : 'Recarregar Dados da Ficha'}
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarAssistenteObstetrico((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  <Activity className="h-3.5 w-3.5" />
                  {mostrarAssistenteObstetrico ? 'Ocultar Parâmetros' : 'Ver / Ajustar Parâmetros'}
                  {mostrarAssistenteObstetrico ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* RESUMO DOS DADOS VITAIS / IG CARREGADOS */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] bg-background/70 dark:bg-background/40 p-2 rounded-lg border border-rose-500/20">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Sincronizado:
              </span>
              {gpaInput && <span className="font-bold text-foreground">GPA: {gpaInput}</span>}
              {dumData && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" /> DUM: <strong>{format(parseISO(dumData), 'dd/MM/yyyy')}</strong>
                </span>
              )}
              {igCalculada && (
                <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  IG: {igCalculada}
                </span>
              )}
              {paInput && <span className="text-muted-foreground">PA: <strong className="text-foreground">{paInput}</strong></span>}
              {bcfInput && (
                <span className={cn('font-semibold', alertaBcf ? 'text-amber-500 font-black' : 'text-foreground')}>
                  BCF: {bcfInput} bpm {alertaBcf && '⚠️'}
                </span>
              )}
              {dilatacaoInput && (
                <span className="text-muted-foreground">
                  Colo: <strong className="text-foreground">{dilatacaoInput} cm</strong>
                </span>
              )}
            </div>

            {/* BOTÕES DE 1-CLIQUE DE MODELOS OBSTÉTRICOS (DINÂMICOS) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground font-medium mr-1">Inserir Modelo com Dados Reais:</span>
              {MODELOS_OBSTETRICOS_CONFIG.map((mod) => {
                const destaque = ehPuerperaDetectada ? mod.tipo === 'puerpera' : mod.tipo === 'gestante'
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => aplicarModelo(mod)}
                    className={cn(
                      'px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-all',
                      destaque
                        ? 'border-rose-500/40 bg-background hover:bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold shadow-2xs'
                        : 'border-border bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    + {mod.badge}
                  </button>
                )
              })}
            </div>

            {/* PAINEL DE PARÂMETROS RÁPIDOS (EDITÁVEL & SINCRONIZADO) */}
            {mostrarAssistenteObstetrico && (
              <div className="pt-2 border-t border-rose-500/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">DUM (Data)</label>
                  <input
                    type="date"
                    value={dumData}
                    onChange={(e) => setDumData(e.target.value)}
                    className="w-full border border-input rounded-md px-2 py-1 text-xs bg-background mt-0.5"
                  />
                  {igCalculada && (
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5 block">
                      IG: {igCalculada}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">G / P / A (Paridade)</label>
                  <input
                    type="text"
                    value={gpaInput}
                    onChange={(e) => setGpaInput(e.target.value)}
                    placeholder="G3P2A0"
                    className="w-full border border-input rounded-md px-2 py-1 text-xs bg-background mt-0.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                    <span>BCF (bpm)</span>
                    {alertaBcf && (
                      <span className="text-amber-500 font-black flex items-center gap-0.5">
                        <ShieldAlert className="h-3 w-3" /> Alerta
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={bcfInput}
                    onChange={(e) => setBcfInput(e.target.value)}
                    placeholder="140"
                    className={cn(
                      'w-full border rounded-md px-2 py-1 text-xs bg-background mt-0.5',
                      alertaBcf ? 'border-amber-500 text-amber-500 font-bold' : 'border-input'
                    )}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Pressão Arterial (PA)</label>
                  <input
                    type="text"
                    value={paInput}
                    onChange={(e) => setPaInput(e.target.value)}
                    placeholder="120/80"
                    className="w-full border border-input rounded-md px-2 py-1 text-xs bg-background mt-0.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Dinâmica (DU)</label>
                  <input
                    type="text"
                    value={duInput}
                    onChange={(e) => setDuInput(e.target.value)}
                    placeholder="3/10' 40'' ou Ausente"
                    className="w-full border border-input rounded-md px-2 py-1 text-xs bg-background mt-0.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Altura Uterina (AU cm)</label>
                  <input
                    type="text"
                    value={auInput}
                    onChange={(e) => setAuInput(e.target.value)}
                    placeholder="33"
                    className="w-full border border-input rounded-md px-2 py-1 text-xs bg-background mt-0.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Dilatação & Apagamento</label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="text"
                      value={dilatacaoInput}
                      onChange={(e) => setDilatacaoInput(e.target.value)}
                      placeholder="6 cm"
                      className="w-1/2 border border-input rounded-md px-2 py-1 text-xs bg-background"
                    />
                    <input
                      type="text"
                      value={apagamentoInput}
                      onChange={(e) => setApagamentoInput(e.target.value)}
                      placeholder="80%"
                      className="w-1/2 border border-input rounded-md px-2 py-1 text-xs bg-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">De Lee & Apresentação</label>
                  <input
                    type="text"
                    value={deLeeInput}
                    onChange={(e) => setDeLeeInput(e.target.value)}
                    placeholder="Cefálica em Plano 0"
                    className="w-full border border-input rounded-md px-2 py-1 text-xs bg-background mt-0.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Bolsa / Líquido Amniótico</label>
                  <input
                    type="text"
                    value={bolsaInput}
                    onChange={(e) => setBolsaInput(e.target.value)}
                    placeholder="Íntegra / Rota c/ LA claro"
                    className="w-full border border-input rounded-md px-2 py-1 text-xs bg-background mt-0.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Útero (Puerpério)</label>
                  <input
                    type="text"
                    value={uteroPuerperio}
                    onChange={(e) => setUteroPuerperio(e.target.value)}
                    placeholder="Contraído (Pinard)"
                    className="w-full border border-input rounded-md px-2 py-1 text-xs bg-background mt-0.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Lóquios & FO/Períneo</label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="text"
                      value={loquiosInput}
                      onChange={(e) => setLoquiosInput(e.target.value)}
                      placeholder="Lóquios rubros"
                      className="w-1/2 border border-input rounded-md px-2 py-1 text-xs bg-background"
                    />
                    <input
                      type="text"
                      value={foInput}
                      onChange={(e) => setFoInput(e.target.value)}
                      placeholder="FO/Períneo íntegro"
                      className="w-1/2 border border-input rounded-md px-2 py-1 text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={gerarSinteseObstetrica}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Inserir Parâmetros na Evolução
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESTAURAR CONTEXTO / ÚLTIMA EVOLUÇÃO */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {textoSugerido?.trim() ? (
            <button
              type="button"
              onClick={() => setConteudo(textoCadastroMaiusculo(textoSugerido.trim()))}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              aria-label="Restaurar contexto clínico do paciente"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Restaurar contexto clínico inicial
            </button>
          ) : <span />}

          {ultimaEvolucao ? (
            <button
              type="button"
              onClick={() => setMostrarUltimaEvolucao((v) => !v)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1"
              aria-expanded={mostrarUltimaEvolucao}
            >
              <Clock className="h-3.5 w-3.5" />
              {mostrarUltimaEvolucao ? 'Ocultar última evolução' : 'Ver última evolução registrada'}
            </button>
          ) : null}
        </div>

        {mostrarUltimaEvolucao && ultimaEvolucao ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <div className="flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {ultimaEvolucao.autor.nome}
                {ultimaEvolucao.autor.crm ? ` — CRM ${ultimaEvolucao.autor.crm}` : ''}
              </span>
              <span>{new Date(ultimaEvolucao.registradoEm).toLocaleString('pt-BR')}</span>
            </div>
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/90">
              {ultimaEvolucao.conteudo}
            </p>
          </div>
        ) : null}

        {/* TEXTAREA PRINCIPAL */}
        <div>
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(textoCadastroMaiusculo(e.target.value))}
            rows={8}
            placeholder={
              modoObstetricoAtivo
                ? "DESCREVA A EVOLUÇÃO OBSTÉTRICA / PUERPERAL (IG, DU, BCF, TOQUE, SINAIS DE ALARME, CONDUTA)..."
                : "S — O — A — P (SE SOAP) OU EVOLUÇÃO CLÍNICA DETALHADA…"
            }
            className={cn(
              'w-full rounded-xl border bg-background px-3.5 py-3 text-xs sm:text-sm outline-none leading-relaxed',
              'focus:ring-2 focus:ring-primary/30 focus:border-primary min-h-[180px] shadow-2xs'
            )}
          />
        </div>

        {/* BARRA DE AÇÃO INFERIOR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {modoProntuario && !conteudoValido ? (
            <p className="text-xs text-muted-foreground">
              Preencha a evolução (mínimo 10 caracteres) para habilitar o salvamento.
            </p>
          ) : <span />}

          {exibirBotaoSalvar && (
            <button
              type="submit"
              disabled={enviando || !conteudoValido}
              className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 active:scale-95 ml-auto"
              aria-label="Salvar evolução"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {modoProntuario ? 'Salvar Evolução Médica' : 'Registrar Evolução'}
            </button>
          )}
        </div>
      </form>

      {/* HISTÓRICO DE EVOLUÇÕES */}
      <div ref={historicoRef} className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-border">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-primary" />
            Histórico de Evoluções Médicas (Imutável)
          </h4>
          <span className="text-xs text-muted-foreground font-semibold">
            {evolucoesOrdenadas.length} registro(s)
          </span>
        </div>

        {evolucoesOrdenadas.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center text-xs text-muted-foreground">
            Nenhuma evolução médica registrada para este prontuário ainda.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {evolucoesOrdenadas.map((ev) => {
              const recemSalva = ev.id === evolucaoRecemSalvaId
              return (
                <li
                  key={ev.id}
                  className={cn(
                    'border rounded-xl p-3.5 sm:p-4 transition-all shadow-2xs',
                    recemSalva
                      ? 'border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'border-border bg-card'
                  )}
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-muted-foreground mb-2 pb-1.5 border-b border-border/50">
                    <span className="font-bold text-foreground">
                      {ev.autor.nome}
                      {ev.autor.crm ? ` — CRM ${ev.autor.crm}` : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      {ev.template ? (
                        <span className="px-2 py-0.5 bg-muted rounded-md text-[10px] font-semibold text-foreground">
                          {ev.template}
                        </span>
                      ) : null}
                      <time dateTime={ev.registradoEm} className="font-mono text-[11px]">
                        {format(new Date(ev.registradoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </time>
                      {recemSalva && (
                        <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                          ✓ Recém salva
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs sm:text-[13px] whitespace-pre-wrap leading-relaxed text-foreground/95">
                    {ev.conteudo}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

