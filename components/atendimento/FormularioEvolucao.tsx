'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
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

const MODELOS_OBSTETRICOS = [
  {
    titulo: 'Trabalho de Parto (Fase Ativa)',
    badge: 'Parto Ativo',
    texto:
      'GESTAÇÃO A TERMO EM TRABALHO DE PARTO ATIVO. BOM ESTADO GERAL, EUPNEICA, CORADA. PA: 110/70 MMHG, FC: 78 BPM, TAX: 36.4°C. BCF: 140 BPM, RÍTMICO, SEM DESACELERAÇÕES. DU: 3 CONTRAÇÕES DE 40 SEGUNDOS EM 10 MINUTOS (3/10\' 40"). AU: 33 CM. TOQUE VAGINAL: COLO CENTRALIZADO, 100% APAGADO, DILATAÇÃO DE 6 CM, APRESENTAÇÃO CEFÁLICA EM PLANO 0 DE DE LEE. BOLSA ÍNTEGRA. MOVIMENTAÇÃO FETAL PRESENTE. CONDUTA: PARTOGRAMA ABERTO, MÉTODOS NÃO FARMACOLÓGICOS DE ALÍVIO DA DOR, DEAMBULAÇÃO ESTIMULADA, MONITORIZAÇÃO INTERMITENTE DE BCF E DU A CADA 30 MINUTOS.',
  },
  {
    titulo: 'Fase Latente / Admissão',
    badge: 'Fase Latente',
    texto:
      'GESTAÇÃO A TERMO EM FASE LATENTE DE TRABALHO DE PARTO. CONSCIENTE, ORIENTADA, SINAIS VITAIS ESTÁVEIS. BCF: 138 BPM RÍTMICO. DU: 1-2 CONTRAÇÕES DE 25" EM 10 MINUTOS (IRREGULARES). AU: 32 CM. TOQUE: COLO POSTERIOR, PARCIALMENTE APAGADO (50%), DILATAÇÃO DE 2-3 CM, APRESENTAÇÃO CEFÁLICA ALTA E MÓVEL (DE LEE -2). BOLSA ÍNTEGRA, SEM PERDAS VAGINAIS SUSPEITAS. CONDUTA: ORIENTADA SOBRE SINAIS DE ALARME E FASE ATIVA, HIDRATAÇÃO ORAL, REAVALIAÇÃO CLÍNICO-OBSTÉTRICA EM 2 HORAS.',
  },
  {
    titulo: 'Rotura Prematura (RUPREME)',
    badge: 'Bolsa Rota',
    texto:
      'GESTANTE ADMITIDA COM HISTÓRIA DE PERDA SÚBITA DE LÍQUIDO VIA VAGINAL. EXAME ESPECULAR: SAÍDA DE LÍQUIDO AMNIÓTICO CLARO COM GRUMOS PELO ORIFÍCIO EXTERNO DO COLO À MANOBRA DE VALSALVA (+). AUSÊNCIA DE SINAIS DE CORIOAMNIONITE (AFEBRIL, TAX 36.6°C, SEM TAQUICARDIA FETAL/MATERNA, SEM ODOR FÉTIDO). BCF: 142 BPM REGULAR. DU AUSENTE. CONDUTA: INTERNAÇÃO EM ENFERMARIA OBSTÉTRICA, REPOUSO RELATIVO, CONTROLE TÉRMICO E DE SINAIS VITAIS 4/4H, AVALIAR PROFILAXIA PARA GBS E INDUÇÃO/RESOLUÇÃO CONFORME PROTOCOLO.',
  },
  {
    titulo: 'Pré-Eclâmpsia / Síndrome Hipertensiva',
    badge: 'Hipertensão / DHEG',
    texto:
      'GESTANTE COM QUADRO HIPERTENSIVO ADMITIDA PARA MONITORIZAÇÃO. PA: 150/95 MMHG (CONFIRMADA APÓS REPOUSO). NEGA CEFALEIA, ESCOtOMAS CINTILANTES OU EPIGASTRALGIA. BCF: 144 BPM RÍTMICO. DU AUSENTE. EDEMA MMII (+/4+). REFLEXOS OSTEOTENDINOSOS NORMAIS. CONDUTA: REPOUSO NO LEITO EM DLE, SOLICITADA ROTINA LABORATORIAL DE PRÉ-ECLÂMPSIA (HEMOGRAMA, PLAQUETAS, TGO/TGP, LDH, ÁCIDO ÚRICO, CREATININA, PROTEINÚRIA EM AMOSTRA ISOLADA), MONITORIZAÇÃO PRESSÓRICA HORÁRIA E AVALIAÇÃO DE SINAIS PREMONITÓRIOS.',
  },
  {
    titulo: 'Puérpera - Pós-Parto Vaginal (D1/D2)',
    badge: 'Pós-Parto Vaginal',
    texto:
      'PUÉRPERA EM 1º DPO DE PARTO VAGINAL SEM INTERCORRÊNCIAS. BOM ESTADO GERAL, CORADA, HIDRATADA, AFEBRIL. PA: 115/75 MMHG. MAMAS TÚRGIDAS, SECRETANTES (COLOSTRO PRESENTE), MAMILOS ÍNTEGROS, BOA PEGA. ABDOME FLÁCIDO, INDOLOR À PALPAÇÃO. ÚTERO CONTRAÍDO, GLOBO DE SEGURANÇA DE PINARD PALPÁVEL 2 CM ABAIXO DA CICATRIZ UMBILICAL. LÓQUIOS RUBROS EM QUANTIDADE FISIOLÓGICA E SEM ODOR. PERÍNEO ÍNTEGRO / SUTURA SEM SINAIS FLOGÍSTICOS OU HEMATOMAS. DIURESE E EVACUAÇÕES PRESENTES. CONDUTA: MANTER ANALGESIA CONFORME DEMANDA, ESTIMULAR ALEITAMENTO MATERNO EXCLUSIVO E ORIENTAÇÕES PARA ALTA CONFORME PROTOCOLO.',
  },
  {
    titulo: 'Puérpera - Pós-Cesariana (D1/D2)',
    badge: 'Pós-Cesárea',
    texto:
      'PUÉRPERA EM 1º DPO DE CESARIANA POR INDICAÇÃO OBSTÉTRICA. LÚCIDA, ORIENTADA, CORADA, EUPNEICA, AFEBRIL. PA: 120/80 MMHG, FC: 74 BPM. MAMAS SIMÉTRICAS, LACTAÇÃO INICIADA, SEM INGURGITAMENTO PATOLÓGICO. ABDOME FLÁCIDO, RUÍDOS HIDROAÉREOS PRESENTES. ÚTERO FIRME E CONTRAÍDO NA ALTURA DA CICATRIZ UMBILICAL. FERIDA OPERATÓRIA COM CURATIVO LIMPO E SECO, SEM SINAIS FLOGÍSTICOS, DEISCÊNCIAS OU HEMATOMAS. LÓQUIOS RUBROS FISIOLÓGICOS. DIURESE LIVRE E CLARA. CONDUTA: DIETA GERAL, ANALGESIA PROGRAMADA, DEAMBULAÇÃO PRECOCE ESTIMULADA, CUIDADOS COM A FO E APOIO À AMAMENTAÇÃO.',
  },
  {
    titulo: 'Avaliação de Vitalidade Fetal',
    badge: 'Vitalidade Fetal',
    texto:
      'AVALIAÇÃO DE ROTINA DA VITALIDADE FETAL. GESTANTE REFERE BOA MOVIMENTAÇÃO FETAL NAS ÚLTIMAS 24H. AUSCULTA CARDIATOCOGRÁFICA / SONAR: BCF BASAL DE 144 BPM, PRESENÇA DE ACELERAÇÕES TRANSITÓRIAS À MOVIMENTAÇÃO FETAL, AUSÊNCIA DE DESACELERAÇÕES. DINÂMICA UTERINA AUSENTE. SINAIS VITAIS MATERNOS NORMAIS (PA 110/70 MMHG). CONDUTA: SEGUIMENTO DO PRÉ-NATAL/INTERNAÇÃO.',
  },
]

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

  // Assistente de Parâmetros Obstétricos Rápidos
  const [dumData, setDumData] = useState('')
  const [igCalculada, setIgCalculada] = useState('')
  const [duInput, setDuInput] = useState('3/10\' 40"')
  const [bcfInput, setBcfInput] = useState('140')
  const [auInput, setAuInput] = useState('33')
  const [dilatacaoInput, setDilatacaoInput] = useState('6')
  const [apagamentoInput, setApagamentoInput] = useState('80%')
  const [deLeeInput, setDeLeeInput] = useState('Plano 0')
  const [bolsaInput, setBolsaInput] = useState('Íntegra')
  const [movFetalInput, setMovFetalInput] = useState('Presente')
  const [uteroPuerperio, setUteroPuerperio] = useState('Contraído (Globo de Pinard)')
  const [loquiosInput, setLoquiosInput] = useState('Rubros fisiológicos')
  const [foInput, setFoInput] = useState('Sem sinais flogísticos')

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
  useEffect(() => {
    if (!dumData) return
    try {
      const dtDum = new Date(dumData)
      if (!isNaN(dtDum.getTime())) {
        const dias = differenceInDays(new Date(), dtDum)
        if (dias > 0 && dias < 320) {
          const semanas = Math.floor(dias / 7)
          const diasRest = dias % 7
          setIgCalculada(`${semanas} semanas e ${diasRest} dias`)
        }
      }
    } catch {
      // ignore
    }
  }, [dumData])

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

  function gerarSinteseObstetrica() {
    const partes: string[] = []
    if (igCalculada) partes.push(`IG (DUM): ${igCalculada.toUpperCase()}`)
    if (bcfInput) partes.push(`BCF: ${bcfInput} BPM (${alertaBcf ? 'ALERTA DE FREQUÊNCIA' : 'RÍTMICO'})`)
    if (duInput) partes.push(`DU: ${duInput.toUpperCase()}`)
    if (auInput) partes.push(`AU: ${auInput} CM`)
    if (dilatacaoInput || apagamentoInput || deLeeInput || bolsaInput) {
      partes.push(
        `TOQUE: COLO ${dilatacaoInput} CM, APAGAMENTO ${apagamentoInput}, DE LEE ${deLeeInput.toUpperCase()}, BOLSA ${bolsaInput.toUpperCase()}`
      )
    }
    if (movFetalInput) partes.push(`MOVIMENTAÇÃO FETAL: ${movFetalInput.toUpperCase()}`)
    if (uteroPuerperio) partes.push(`ÚTERO: ${uteroPuerperio.toUpperCase()}`)
    if (loquiosInput) partes.push(`LÓQUIOS: ${loquiosInput.toUpperCase()}`)
    if (foInput) partes.push(`FERIDA/PERÍNEO: ${foInput.toUpperCase()}`)

    const textoGerado = `[AVALIAÇÃO OBSTÉTRICA]\n${partes.join(' | ')}`
    setConteudo((prev) => (prev ? `${prev}\n\n${textoGerado}` : textoGerado))
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

        {/* MÓDULO ESPECIALIZADO OBSTÉTRICO */}
        {modoObstetricoAtivo && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-rose-500" />
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">
                  Modelos Rápidos e Assistente Obstétrico
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMostrarAssistenteObstetrico((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                <Activity className="h-3.5 w-3.5" />
                {mostrarAssistenteObstetrico ? 'Ocultar Parâmetros' : 'Preencher Parâmetros Rápidos'}
                {mostrarAssistenteObstetrico ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {/* BOTÕES DE 1-CLIQUE DE MODELOS OBSTÉTRICOS */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-medium mr-1">Inserir Modelo:</span>
              {MODELOS_OBSTETRICOS.map((mod) => (
                <button
                  key={mod.titulo}
                  type="button"
                  onClick={() => {
                    setConteudo(mod.texto)
                    toast.success(`Modelo "${mod.titulo}" carregado!`)
                  }}
                  className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-rose-500/10 hover:border-rose-500/30 text-[11px] font-semibold text-foreground transition-colors"
                >
                  + {mod.badge}
                </button>
              ))}
            </div>

            {/* PAINEL DE PARÂMETROS RÁPIDOS */}
            {mostrarAssistenteObstetrico && (
              <div className="pt-2 border-t border-rose-500/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">DUM / IG</label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="date"
                      value={dumData}
                      onChange={(e) => setDumData(e.target.value)}
                      className="w-full border border-input rounded-md px-2 py-1 text-xs bg-background"
                    />
                  </div>
                  {igCalculada && (
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5 block">
                      IG: {igCalculada}
                    </span>
                  )}
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
                    placeholder="Cefálica / Plano 0"
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

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={gerarSinteseObstetrica}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Inserir Parâmetros
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

