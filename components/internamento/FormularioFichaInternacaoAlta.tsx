'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Activity,
  BedDouble,
  ChevronDown,
  ClipboardList,
  FileText,
  HeartPulse,
  Loader2,
  Save,
  Stethoscope,
  UserCheck,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { textoCadastroMaiusculo } from '@/lib/cadastro-maiusculo'
import { camposPosInternacaoVazios, type FichaInternacaoAltaPrefill } from '@/lib/ficha-internacao-alta'
import type { FichaInternacaoAltaForm } from '@/lib/validations/ficha-internacao-alta'
import { CampoIdentificacaoLeitura } from '@/components/internamento/CampoIdentificacaoLeitura'

type Leito = {
  id: string
  ala: string
  quarto: string | null
  codigo: string
  tipo: string
  status: string
}

const inputCls =
  'mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors'
const labelCls = 'text-xs font-semibold text-muted-foreground uppercase tracking-wide'
const checkCls = 'rounded border-input text-primary focus:ring-primary/30'

function Campo({
  label,
  children,
  col,
}: {
  label: string
  children: React.ReactNode
  col?: string
}) {
  return (
    <div className={cn('space-y-1', col)}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

function Secao({
  titulo,
  icone,
  cor,
  children,
  colapsavel,
}: {
  titulo: string
  icone?: React.ReactNode
  cor?: string
  children: React.ReactNode
  colapsavel?: boolean
}) {
  const [aberto, setAberto] = useState(true)
  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => colapsavel && setAberto((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-5 py-3.5 text-left',
          cor ?? 'bg-muted/40',
          colapsavel && 'cursor-pointer hover:bg-muted/60 transition-colors'
        )}
      >
        <div className="flex items-center gap-2">
          {icone}
          <span className="text-sm font-semibold text-foreground">{titulo}</span>
        </div>
        {colapsavel && (
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              !aberto && '-rotate-90'
            )}
            aria-hidden
          />
        )}
      </button>
      {aberto && <div className="p-5 space-y-4">{children}</div>}
    </section>
  )
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={checkCls}
      />
      {label}
    </label>
  )
}

export function FormularioFichaInternacaoAlta({
  atendimentoId,
  numeroAtendimento,
  prefill,
  fichaStatusInicial,
  statusAtendimento,
  modoAdmissao,
  leitos,
  leitoId,
  onLeitoChange,
  carregandoLeitos,
  onConfirmar,
  confirmando,
  voltarAposConcluir,
}: {
  atendimentoId: string
  numeroAtendimento: string
  prefill: FichaInternacaoAltaPrefill
  fichaStatusInicial?: string
  statusAtendimento?: string
  modoAdmissao?: boolean
  leitos?: Leito[]
  leitoId?: string
  onLeitoChange?: (id: string) => void
  carregandoLeitos?: boolean
  onConfirmar?: () => void
  confirmando?: boolean
  voltarAposConcluir?: boolean
}) {
  const router = useRouter()
  const [status, setStatus] = useState(fichaStatusInicial ?? prefill.status ?? 'RASCUNHO')
  const [registroNumero, setRegistroNumero] = useState(prefill.registroNumero)
  const [dataInternacao, setDataInternacao] = useState(prefill.dataInternacao)
  const [horaInternacao, setHoraInternacao] = useState(prefill.horaInternacao)
  const [unidadeSaude, setUnidadeSaude] = useState(prefill.unidadeSaude)
  const [nome, setNome] = useState(prefill.nome)
  const [categoria, setCategoria] = useState(prefill.categoria)
  const [sexo, setSexo] = useState(prefill.sexo)
  const [idade, setIdade] = useState(prefill.idade)
  const [cor, setCor] = useState(prefill.cor)
  const [estadoCivil, setEstadoCivil] = useState(prefill.estadoCivil)
  const [naturalidade, setNaturalidade] = useState(prefill.naturalidade)
  const [profissao, setProfissao] = useState(prefill.profissao)
  const [endereco, setEndereco] = useState(prefill.endereco)
  const [procedencia, setProcedencia] = useState(prefill.procedencia)
  const [responsavelPessoaDependente, setResponsavelPessoaDependente] = useState(
    prefill.responsavelPessoaDependente
  )
  const [responsavelParentesco, setResponsavelParentesco] = useState(prefill.responsavelParentesco)
  const [responsavelEndereco, setResponsavelEndereco] = useState(prefill.responsavelEndereco)
  const [responsavelFone, setResponsavelFone] = useState(prefill.responsavelFone)
  const [trazidoPor, setTrazidoPor] = useState(prefill.trazidoPor)
  const [trazidoEndereco, setTrazidoEndereco] = useState(prefill.trazidoEndereco)
  const [trazidoFone, setTrazidoFone] = useState(prefill.trazidoFone)
  const [localAcidente, setLocalAcidente] = useState(prefill.localAcidente)
  const [dataAcidente, setDataAcidente] = useState(prefill.dataAcidente)
  const [horaAcidente, setHoraAcidente] = useState(prefill.horaAcidente)
  const [natureza, setNatureza] = useState(prefill.naturezaAcidente ?? {})
  const [atendimentoClinico, setAtendimentoClinico] = useState(prefill.atendimentoClinico ?? false)
  const [atendimentoCirurgico, setAtendimentoCirurgico] = useState(
    prefill.atendimentoCirurgico ?? false
  )
  const [historiaDoencaAtual, setHistoriaDoencaAtual] = useState(prefill.historiaDoencaAtual)
  const [pressaoArterial, setPressaoArterial] = useState(prefill.pressaoArterial)
  const [pulso, setPulso] = useState(prefill.pulso)
  const [temperatura, setTemperatura] = useState(prefill.temperatura)
  const [peso, setPeso] = useState(prefill.peso)
  const [exameFisico, setExameFisico] = useState(prefill.exameFisico)
  const [diagnosticoProvisorio, setDiagnosticoProvisorio] = useState(prefill.diagnosticoProvisorio)
  const [recepcionista, setRecepcionista] = useState(prefill.recepcionista)
  const [medicoCremepe, setMedicoCremepe] = useState(prefill.medicoCremepe)
  const [observacoesEnfermagem, setObservacoesEnfermagem] = useState(prefill.observacoesEnfermagem)
  const [enviando, setEnviando] = useState(false)

  function montarPayload(statusSalvar: FichaInternacaoAltaForm['status']): FichaInternacaoAltaForm & {
    secaoSalvar: 'ADMISSAO'
  } {
    return {
      secaoSalvar: 'ADMISSAO',
      status: statusSalvar,
      registroNumero,
      dataInternacao,
      horaInternacao,
      unidadeSaude,
      nome,
      categoria,
      sexo,
      idade,
      cor,
      estadoCivil,
      naturalidade,
      profissao,
      endereco,
      procedencia,
      responsavelPessoaDependente,
      responsavelParentesco,
      responsavelEndereco,
      responsavelFone,
      trazidoPor,
      trazidoEndereco,
      trazidoFone,
      localAcidente,
      dataAcidente,
      horaAcidente,
      naturezaAcidente: natureza,
      atendimentoClinico,
      atendimentoCirurgico,
      historiaDoencaAtual,
      pressaoArterial,
      pulso,
      temperatura,
      peso,
      exameFisico,
      diagnosticoProvisorio,
      recepcionista,
      medicoCremepe,
      observacoesEnfermagem,
      ...camposPosInternacaoVazios(),
    }
  }

  async function salvarFicha(
    statusSalvar: FichaInternacaoAltaForm['status'],
    opcoes?: { voltarListagem?: boolean }
  ) {
    setEnviando(true)
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/ficha-internacao-alta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(montarPayload(statusSalvar)),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar ficha.')
        return false
      }
      setStatus(statusSalvar)
      toast.success(
        statusSalvar === 'CONCLUIDA'
          ? 'Ficha de internação e alta salva.'
          : statusSalvar === 'EM_ANDAMENTO'
            ? 'Ficha registrada em andamento.'
            : 'Rascunho salvo com sucesso.'
      )
      if (opcoes?.voltarListagem) {
        router.push('/internamento/admissoes')
        router.refresh()
      }
      return true
    } catch {
      toast.error('Erro de conexão ao salvar ficha.')
      return false
    } finally {
      setEnviando(false)
    }
  }

  const statusLabel =
    status === 'CONCLUIDA' ? 'Concluída' : status === 'EM_ANDAMENTO' ? 'Em andamento' : 'Rascunho'

  const jaInternado = statusAtendimento === 'INTERNADO'
  const leitoSelecionado = Boolean(leitoId?.trim())

  async function handleConfirmarInternacao() {
    if (!leitoSelecionado) {
      toast.error('Selecione o leito antes de confirmar a internação.')
      return
    }
    const ok = await salvarFicha('CONCLUIDA')
    if (ok && onConfirmar) onConfirmar()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Folha de Internação e Alta Hospitalar
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atendimento {numeroAtendimento} — campos pré-preenchidos com dados do cadastro e triagem.
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 text-xs font-bold px-2.5 py-1 rounded-full',
            status === 'CONCLUIDA'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : status === 'EM_ANDAMENTO'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          )}
        >
          {statusLabel}
        </span>
      </div>

      {modoAdmissao && leitos && onLeitoChange ? (
        <Secao
          titulo="Leito / Apartamento"
          icone={<BedDouble className="h-4 w-4 text-primary" aria-hidden />}
          cor="bg-primary/5 border-b border-primary/20"
        >
          <p className="text-sm text-muted-foreground">
            Selecione o leito (único registro no sistema). O leito aparece nas listagens e fichas a
            partir desta admissão.
          </p>
          {carregandoLeitos ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Carregando leitos…
            </p>
          ) : (
            <Campo label="Selecionar leito *">
              <select
                value={leitoId ?? ''}
                onChange={(e) => onLeitoChange(e.target.value)}
                className={inputCls}
                aria-label="Selecionar leito"
              >
                <option value="">— Selecione o leito —</option>
                {leitos
                  .slice()
                  .sort((a, b) => {
                    if (a.status === 'DISPONIVEL' && b.status !== 'DISPONIVEL') return -1
                    if (a.status !== 'DISPONIVEL' && b.status === 'DISPONIVEL') return 1
                    return a.ala.localeCompare(b.ala)
                  })
                  .map((l) => (
                    <option key={l.id} value={l.id} disabled={l.status !== 'DISPONIVEL'}>
                      {l.ala} • {l.codigo}
                      {l.quarto ? ` — Quarto ${l.quarto}` : ''} — {l.tipo.replace(/_/g, ' ')}
                      {l.status !== 'DISPONIVEL' ? ` (${l.status})` : ' ✓'}
                    </option>
                  ))}
              </select>
            </Campo>
          )}
        </Secao>
      ) : null}

      <Secao titulo="Cabeçalho" icone={<ClipboardList className="h-4 w-4 text-slate-500" aria-hidden />}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <CampoIdentificacaoLeitura label="Registro nº" value={registroNumero ?? ''} mono />
          <Campo label="Data">
            <input type="date" value={dataInternacao} onChange={(e) => setDataInternacao(e.target.value)} className={inputCls} aria-label="Data internação" />
          </Campo>
          <Campo label="Hora">
            <input type="time" value={horaInternacao} onChange={(e) => setHoraInternacao(e.target.value)} className={inputCls} aria-label="Hora internação" />
          </Campo>
          <CampoIdentificacaoLeitura label="Unidade de saúde" value={unidadeSaude ?? ''} />
        </div>
      </Secao>

      <Secao titulo="Paciente" icone={<UserCheck className="h-4 w-4 text-indigo-500" aria-hidden />} colapsavel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CampoIdentificacaoLeitura label="Nome *" value={nome ?? ''} col="sm:col-span-3" />
          <CampoIdentificacaoLeitura label="Categoria" value={categoria ?? ''} />
          <CampoIdentificacaoLeitura label="Sexo" value={sexo ?? ''} />
          <CampoIdentificacaoLeitura label="Idade" value={idade ?? ''} />
          <CampoIdentificacaoLeitura label="Cor" value={cor ?? ''} />
          <CampoIdentificacaoLeitura label="Estado civil" value={estadoCivil ?? ''} />
          <CampoIdentificacaoLeitura label="Naturalidade" value={naturalidade ?? ''} />
          <CampoIdentificacaoLeitura label="Profissão" value={profissao ?? ''} />
          <CampoIdentificacaoLeitura label="Endereço" value={endereco ?? ''} col="sm:col-span-3" />
          <Campo label="Procedência" col="sm:col-span-3">
            <input type="text" value={procedencia} onChange={(e) => setProcedencia(e.target.value)} className={inputCls} aria-label="Procedência" />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Responsável" icone={<UserCheck className="h-4 w-4 text-purple-500" aria-hidden />} colapsavel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Pessoa de que depende">
            <input type="text" value={responsavelPessoaDependente} onChange={(e) => setResponsavelPessoaDependente(e.target.value)} className={inputCls} aria-label="Responsável" />
          </Campo>
          <Campo label="Parentesco">
            <input type="text" value={responsavelParentesco} onChange={(e) => setResponsavelParentesco(e.target.value)} className={inputCls} aria-label="Parentesco" />
          </Campo>
          <Campo label="Endereço do responsável" col="sm:col-span-2">
            <input type="text" value={responsavelEndereco} onChange={(e) => setResponsavelEndereco(e.target.value)} className={inputCls} aria-label="Endereço responsável" />
          </Campo>
          <Campo label="Fone responsável">
            <input type="text" value={responsavelFone} onChange={(e) => setResponsavelFone(e.target.value)} className={inputCls} aria-label="Fone responsável" />
          </Campo>
          <Campo label="Trazido por">
            <input type="text" value={trazidoPor} onChange={(e) => setTrazidoPor(e.target.value)} className={inputCls} aria-label="Trazido por" />
          </Campo>
          <Campo label="Endereço (quem trouxe)" col="sm:col-span-2">
            <input type="text" value={trazidoEndereco} onChange={(e) => setTrazidoEndereco(e.target.value)} className={inputCls} aria-label="Endereço quem trouxe" />
          </Campo>
          <Campo label="Fone (quem trouxe)">
            <input type="text" value={trazidoFone} onChange={(e) => setTrazidoFone(e.target.value)} className={inputCls} aria-label="Fone quem trouxe" />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Ocorrência" icone={<Activity className="h-4 w-4 text-orange-500" aria-hidden />} colapsavel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Campo label="Local do acidente" col="sm:col-span-3">
            <input type="text" value={localAcidente} onChange={(e) => setLocalAcidente(e.target.value)} className={inputCls} aria-label="Local acidente" />
          </Campo>
          <Campo label="Data do acidente">
            <input type="date" value={dataAcidente} onChange={(e) => setDataAcidente(e.target.value)} className={inputCls} aria-label="Data acidente" />
          </Campo>
          <Campo label="Hora do acidente">
            <input type="time" value={horaAcidente} onChange={(e) => setHoraAcidente(e.target.value)} className={inputCls} aria-label="Hora acidente" />
          </Campo>
        </div>
        <div>
          <p className={labelCls}>Natureza do acidente</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            <CheckField label="Casual" checked={Boolean(natureza.casual)} onChange={(v) => setNatureza((n) => ({ ...n, casual: v }))} />
            <CheckField label="Queda" checked={Boolean(natureza.queda)} onChange={(v) => setNatureza((n) => ({ ...n, queda: v }))} />
            <CheckField label="Acidente do trabalho" checked={Boolean(natureza.acidenteTrabalho)} onChange={(v) => setNatureza((n) => ({ ...n, acidenteTrabalho: v }))} />
            <CheckField label="Acidente de trânsito" checked={Boolean(natureza.acidenteTransito)} onChange={(v) => setNatureza((n) => ({ ...n, acidenteTransito: v }))} />
            <CheckField label="Intoxicação" checked={Boolean(natureza.intoxicacao)} onChange={(v) => setNatureza((n) => ({ ...n, intoxicacao: v }))} />
            <CheckField label="Agressão" checked={Boolean(natureza.agressao)} onChange={(v) => setNatureza((n) => ({ ...n, agressao: v }))} />
            <CheckField label="Tentativa de suicídio" checked={Boolean(natureza.tentativaSuicidio)} onChange={(v) => setNatureza((n) => ({ ...n, tentativaSuicidio: v }))} />
            <CheckField label="Outras causas" checked={Boolean(natureza.outrasCausas)} onChange={(v) => setNatureza((n) => ({ ...n, outrasCausas: v }))} />
          </div>
          {natureza.outrasCausas ? (
            <input
              type="text"
              value={natureza.outrasCausasTexto ?? ''}
              onChange={(e) => setNatureza((n) => ({ ...n, outrasCausasTexto: e.target.value }))}
              placeholder="Descreva outras causas…"
              className={cn(inputCls, 'mt-2')}
              aria-label="Outras causas texto"
            />
          ) : null}
        </div>
      </Secao>

      <Secao titulo="Atenção médica" icone={<Stethoscope className="h-4 w-4 text-emerald-500" aria-hidden />} colapsavel>
        <div className="flex flex-wrap gap-4">
          <CheckField label="Atendimento clínico" checked={atendimentoClinico} onChange={setAtendimentoClinico} />
          <CheckField label="Atendimento cirúrgico" checked={atendimentoCirurgico} onChange={setAtendimentoCirurgico} />
        </div>
        <Campo label="História da doença atual">
          <textarea rows={4} value={historiaDoencaAtual} onChange={(e) => setHistoriaDoencaAtual(textoCadastroMaiusculo(e.target.value))} className={cn(inputCls, 'resize-y')} aria-label="HDA" />
        </Campo>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Campo label="Pressão arterial">
            <input type="text" value={pressaoArterial} onChange={(e) => setPressaoArterial(e.target.value)} className={inputCls} aria-label="PA" />
          </Campo>
          <Campo label="Pulso">
            <input type="text" value={pulso} onChange={(e) => setPulso(e.target.value)} className={inputCls} aria-label="Pulso" />
          </Campo>
          <Campo label="Temperatura">
            <input type="text" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} className={inputCls} aria-label="Temperatura" />
          </Campo>
          <Campo label="Peso">
            <input type="text" value={peso} onChange={(e) => setPeso(e.target.value)} className={inputCls} aria-label="Peso" />
          </Campo>
        </div>
        <Campo label="Exame físico">
          <textarea rows={4} value={exameFisico} onChange={(e) => setExameFisico(textoCadastroMaiusculo(e.target.value))} className={cn(inputCls, 'resize-y')} aria-label="Exame físico" />
        </Campo>
        <Campo label="Diagnóstico provisório">
          <textarea rows={2} value={diagnosticoProvisorio} onChange={(e) => setDiagnosticoProvisorio(e.target.value)} className={cn(inputCls, 'resize-y')} aria-label="Diagnóstico provisório" />
        </Campo>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Recepcionista">
            <input type="text" value={recepcionista} onChange={(e) => setRecepcionista(e.target.value)} className={inputCls} aria-label="Recepcionista" />
          </Campo>
          <Campo label="Médico — CREMEPE">
            <input type="text" value={medicoCremepe} onChange={(e) => setMedicoCremepe(e.target.value)} className={inputCls} aria-label="Médico CREMEPE" />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Observações de enfermagem (admissão)" icone={<HeartPulse className="h-4 w-4 text-rose-500" aria-hidden />} colapsavel>
        <textarea rows={3} value={observacoesEnfermagem} onChange={(e) => setObservacoesEnfermagem(e.target.value)} className={cn(inputCls, 'resize-y')} placeholder="Registro da enfermagem na recepção…" aria-label="Observações enfermagem" />
      </Secao>

      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-5 py-4 text-sm">
        <p className="font-medium text-foreground">Evolução clínica, enfermagem e alta</p>
        <p className="mt-1 text-muted-foreground">
          Após a internação, registre evoluções e relatórios de enfermagem em{' '}
          <strong className="text-foreground">Prontuário Enfermagem</strong>:
        </p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          <li>
            <Link
              href={`/evolucoes/${atendimentoId}?aba=EVOLUCAO_DIURNA_NOTURNA`}
              className="text-primary font-medium hover:underline"
            >
              Evolução Noite/Dia
            </Link>
            {' — evolução clínica e relatório de enfermagem por turno'}
          </li>
          <li>
            <Link
              href={`/evolucoes/${atendimentoId}?aba=INSTRUCOES_ENFERMAGEM`}
              className="text-primary font-medium hover:underline"
            >
              Enfermagem
            </Link>
            {' — medicações, cuidados e evoluções de enfermagem'}
          </li>
          <li>
            <Link
              href={`/evolucoes/${atendimentoId}?aba=CONDICOES_ALTA`}
              className="text-primary font-medium hover:underline"
            >
              Condições de alta
            </Link>
            {' — encerramento e dados da alta hospitalar'}
          </li>
        </ul>
      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border py-4 space-y-3 -mx-1 px-1">
        {modoAdmissao && !jaInternado ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm space-y-2">
            <p className="font-medium text-foreground">Como internar o paciente</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-0.5 text-xs sm:text-sm">
              <li>Preencha a folha de internação abaixo (pode salvar rascunho para continuar depois)</li>
              <li>Selecione o leito na seção &quot;Leito / Apartamento&quot;</li>
              <li>
                Clique em <strong className="text-foreground">Confirmar internação</strong> — isso conclui a
                ficha e muda o status para <strong className="text-foreground">Internado</strong>
              </li>
            </ol>
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium',
                  leitoSelecionado
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                )}
              >
                {leitoSelecionado ? '✓' : '○'} Leito selecionado
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium',
                  status === 'CONCLUIDA'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {status === 'CONCLUIDA' ? '✓' : '○'} Ficha concluída (será ao confirmar)
              </span>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={enviando}
          onClick={() => void salvarFicha('RASCUNHO')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
          aria-label="Salvar rascunho"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Salvar rascunho
        </button>
        {modoAdmissao && !jaInternado && onConfirmar ? (
          <button
            type="button"
            disabled={confirmando || !leitoSelecionado || enviando}
            onClick={() => void handleConfirmarInternacao()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors ml-auto"
            aria-label="Confirmar internação"
            title={leitoSelecionado ? 'Salva a ficha e interna o paciente no leito selecionado' : 'Selecione um leito disponível'}
          >
            {confirmando || enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <UserCheck className="h-4 w-4" aria-hidden />
            )}
            Confirmar internação
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={enviando}
              onClick={() => void salvarFicha('EM_ANDAMENTO')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 disabled:opacity-50 transition-colors"
              aria-label="Salvar ficha em andamento"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
              Salvar ficha
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => void salvarFicha('CONCLUIDA', { voltarListagem: !!voltarAposConcluir })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors ml-auto"
              aria-label="Concluir ficha"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserCheck className="h-4 w-4" aria-hidden />}
              Concluir ficha
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  )
}
