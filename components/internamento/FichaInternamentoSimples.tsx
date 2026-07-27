'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  BedDouble,
  ChevronDown,
  ClipboardList,
  FileText,
  Loader2,
  Save,
  UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { textoCadastroMaiusculo } from '@/lib/cadastro-maiusculo'
import type { LaudoInternacaoPrefill } from '@/lib/laudo-internacao'
import type { LaudoExtraFicha } from '@/lib/carregar-dados-ficha-internamento'

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
const fieldGroupCls = 'space-y-1'

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
    <div className={cn(fieldGroupCls, col)}>
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

export function FichaInternamentoSimples({
  atendimentoId,
  prefill,
  laudoExtra,
  leitos,
  leitoId,
  onLeitoChange,
  carregandoLeitos,
  onConfirmar,
  confirmando,
}: {
  atendimentoId: string
  prefill: LaudoInternacaoPrefill
  laudoExtra: LaudoExtraFicha
  leitos: Leito[]
  leitoId: string
  onLeitoChange: (id: string) => void
  carregandoLeitos: boolean
  onConfirmar: () => void
  confirmando: boolean
}) {
  const aut = (laudoExtra?.autorizacao ?? {}) as Record<string, unknown>
  const ctx = laudoExtra?.contextoInternacao

  // Dados do paciente
  const [nomePaciente, setNomePaciente] = useState(prefill.nomePaciente)
  const [numeroProntuario, setNumeroProntuario] = useState(prefill.numeroProntuario)
  const [cns, setCns] = useState(prefill.cns)
  const [dataNascimento, setDataNascimento] = useState(prefill.dataNascimento)
  const [sexoCodigo, setSexoCodigo] = useState(prefill.sexoCodigo)
  const [nomeMae, setNomeMae] = useState(prefill.nomeMae)
  const [telefoneDdd, setTelefoneDdd] = useState(prefill.telefoneDdd)
  const [telefoneNumero, setTelefoneNumero] = useState(prefill.telefoneNumero)
  const [enderecoCompleto, setEnderecoCompleto] = useState(prefill.enderecoCompleto)
  const [municipioResidencia, setMunicipioResidencia] = useState(prefill.municipioResidencia)
  const [uf, setUf] = useState(prefill.uf)
  const [cep, setCep] = useState(prefill.cep)

  // Dados da internação
  const [tipoClinica, setTipoClinica] = useState(prefill.clinica)
  const [caraterInternacao, setCaraterInternacao] = useState<'URGENCIA' | 'ELETIVA'>(
    prefill.caraterInternacao
  )
  const [cidPrincipal, setCidPrincipal] = useState(prefill.cidPrincipal)
  const [cidSecundario, setCidSecundario] = useState(prefill.cidSecundario)
  const [diagnosticoInicial, setDiagnosticoInicial] = useState(prefill.diagnosticoInicial)
  const [sinaisSintomas, setSinaisSintomas] = useState(prefill.sinaisSintomas)
  const [condicoes, setCondicoes] = useState(prefill.condicoesJustificativa)
  const [descricaoProcedimento, setDescricaoProcedimento] = useState(prefill.descricaoProcedimento)

  // Médico / profissional
  const [nomeProfissional, setNomeProfissional] = useState(prefill.nomeProfissionalSolicitante)
  const [registroConselho, setRegistroConselho] = useState(prefill.registroConselho)
  const [dataSolicitacao, setDataSolicitacao] = useState(prefill.dataSolicitacao)

  // Dados de internação efetiva
  const [dataAdmissao, setDataAdmissao] = useState(
    String(aut.dataAdmissao ?? ctx?.dataAdmissaoSugerida ?? format(new Date(), 'yyyy-MM-dd'))
  )
  const [enfermariaLeito, setEnfermariaLeito] = useState(
    String(aut.enfermariaLeito ?? ctx?.enfermariaLeitoSugerido ?? '')
  )
  const [observacoesEnfermagem, setObservacoesEnfermagem] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [fichaStatus, setFichaStatus] = useState(laudoExtra?.status ?? 'RASCUNHO')

  async function salvarFicha(statusSalvar: 'RASCUNHO' | 'SOLICITADO') {
    setEnviando(true)
    try {
      const payload = {
        status: statusSalvar,
        // Estabelecimento
        nomeEstabelecimentoSolicitante: prefill.nomeEstabelecimentoSolicitante,
        cnesSolicitante: laudoExtra?.cnesSolicitante ?? prefill.cnesSolicitante ?? '',
        nomeEstabelecimentoExecutante: prefill.nomeEstabelecimentoExecutante,
        cnesExecutante: laudoExtra?.cnesExecutante ?? prefill.cnesExecutante ?? '',
        // Paciente
        nomePaciente,
        numeroProntuario,
        cns,
        dataNascimento,
        sexoCodigo,
        nomeMae,
        telefoneDdd,
        telefoneNumero,
        enderecoCompleto,
        municipioResidencia,
        codigoIbgeMunicipio: laudoExtra?.codigoIbgeMunicipio ?? prefill.codigoIbgeMunicipio ?? '',
        uf,
        cep,
        // Justificativa
        sinaisSintomas,
        condicoesJustificativa: condicoes,
        resultadosDiagnosticos: prefill.resultadosDiagnosticos,
        diagnosticoInicial,
        cidPrincipal,
        cidSecundario,
        cidAssociadas: prefill.cidAssociadas,
        // Procedimento
        descricaoProcedimento,
        codigoProcedimento: laudoExtra?.codigoProcedimento ?? '',
        clinica: tipoClinica,
        caraterInternacao,
        documentoProfissionalTipo: laudoExtra?.documentoProfissionalTipo ?? null,
        documentoProfissionalNumero: laudoExtra?.documentoProfissionalNumero ?? '',
        nomeProfissionalSolicitante: nomeProfissional,
        dataSolicitacao,
        registroConselho,
        // Causas externas (vazio por padrão)
        causasExternas: laudoExtra?.causasExternas ?? {},
        // Autorização / internação efetiva
        autorizacao: {
          ...(laudoExtra?.autorizacao as Record<string, unknown> ?? {}),
          dataAdmissao,
          enfermariaLeito,
          observacoesEnfermagem,
        },
      }

      const res = await fetch(`/api/atendimento/${atendimentoId}/internamento`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao salvar ficha.')
        return
      }
      setFichaStatus(statusSalvar)
      toast.success(
        statusSalvar === 'SOLICITADO'
          ? 'Ficha de internamento salva com sucesso.'
          : 'Rascunho salvo com sucesso.'
      )
    } catch {
      toast.error('Erro de conexão ao salvar ficha.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Status da ficha */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Ficha de Internamento Hospitalar
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atendimento {prefill.numeroAtendimento} — preencha e salve a ficha antes de confirmar a internação.
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 text-xs font-bold px-2.5 py-1 rounded-full',
            fichaStatus === 'SOLICITADO'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              : fichaStatus === 'AUTORIZADO'
                ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          )}
        >
          {fichaStatus === 'SOLICITADO' ? 'Salva' : fichaStatus === 'AUTORIZADO' ? 'Autorizada' : 'Rascunho'}
        </span>
      </div>

      {/* Leito */}
      <Secao
        titulo="Leito / Apartamento"
        icone={<BedDouble className="h-4 w-4 text-primary" aria-hidden />}
        cor="bg-primary/5 border-b border-primary/20"
      >
        <p className="text-sm text-muted-foreground">
          Selecione o leito onde o paciente será internado. Obrigatório para confirmar a internação.
        </p>
        {carregandoLeitos ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Carregando leitos disponíveis…
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Campo label="Selecionar leito *">
                <select
                  value={leitoId}
                  onChange={(e) => {
                    onLeitoChange(e.target.value)
                    const leito = leitos.find((l) => l.id === e.target.value)
                    if (leito) {
                      setEnfermariaLeito(`${leito.ala} — ${leito.codigo}${leito.quarto ? ` / Quarto ${leito.quarto}` : ''}`)
                    }
                  }}
                  className={inputCls}
                  aria-label="Selecionar leito para internação"
                >
                  <option value="">— Selecione o leito / apartamento —</option>
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
                        {l.status !== 'DISPONIVEL' ? ` (${l.status})` : ' ✓ Disponível'}
                      </option>
                    ))}
                </select>
              </Campo>
            </div>
            <Campo label="Data de admissão">
              <input
                type="date"
                value={dataAdmissao}
                onChange={(e) => setDataAdmissao(e.target.value)}
                className={inputCls}
                aria-label="Data de admissão"
              />
            </Campo>
            <Campo label="Enfermaria / leito (descrição)">
              <input
                type="text"
                value={enfermariaLeito}
                onChange={(e) => setEnfermariaLeito(e.target.value)}
                className={inputCls}
                aria-label="Descrição enfermaria e leito"
              />
            </Campo>
          </div>
        )}
      </Secao>

      {/* Dados do paciente */}
      <Secao
        titulo="Identificação do Paciente"
        icone={<ClipboardList className="h-4 w-4 text-indigo-500" aria-hidden />}
        colapsavel
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Campo label="Nome do paciente *" col="sm:col-span-3">
            <input
              type="text"
              required
              value={nomePaciente}
              onChange={(e) => setNomePaciente(e.target.value)}
              className={inputCls}
              aria-label="Nome do paciente"
            />
          </Campo>
          <Campo label="Nº do prontuário / atendimento">
            <input
              type="text"
              value={numeroProntuario}
              onChange={(e) => setNumeroProntuario(e.target.value)}
              className={cn(inputCls, 'font-mono')}
              aria-label="Número do prontuário"
            />
          </Campo>
          <Campo label="CNS (Cartão Nacional de Saúde)">
            <input
              type="text"
              inputMode="numeric"
              value={cns}
              onChange={(e) => setCns(e.target.value.replace(/\D/g, ''))}
              className={cn(inputCls, 'font-mono')}
              aria-label="CNS"
            />
          </Campo>
          <Campo label="Data de nascimento *">
            <input
              type="date"
              required
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className={inputCls}
              aria-label="Data de nascimento"
            />
          </Campo>
          <Campo label="Sexo *">
            <select
              required
              value={sexoCodigo}
              onChange={(e) => setSexoCodigo(e.target.value as '1' | '3')}
              className={inputCls}
              aria-label="Sexo"
            >
              <option value="1">Masculino (1)</option>
              <option value="3">Feminino (3)</option>
            </select>
          </Campo>
          <Campo label="DDD">
            <input
              type="text"
              inputMode="numeric"
              maxLength={3}
              value={telefoneDdd}
              onChange={(e) => setTelefoneDdd(e.target.value.replace(/\D/g, ''))}
              className={inputCls}
              aria-label="DDD"
            />
          </Campo>
          <Campo label="Telefone de contato">
            <input
              type="text"
              inputMode="tel"
              value={telefoneNumero}
              onChange={(e) => setTelefoneNumero(e.target.value.replace(/\D/g, ''))}
              className={inputCls}
              aria-label="Telefone"
            />
          </Campo>
          <Campo label="Nome da mãe ou responsável" col="sm:col-span-3">
            <input
              type="text"
              value={nomeMae}
              onChange={(e) => setNomeMae(e.target.value)}
              className={inputCls}
              aria-label="Nome da mãe"
            />
          </Campo>
          <Campo label="Endereço (rua, nº, bairro)" col="sm:col-span-3">
            <input
              type="text"
              value={enderecoCompleto}
              onChange={(e) => setEnderecoCompleto(e.target.value)}
              className={inputCls}
              aria-label="Endereço"
            />
          </Campo>
          <Campo label="Município de residência">
            <input
              type="text"
              value={municipioResidencia}
              onChange={(e) => setMunicipioResidencia(e.target.value)}
              className={inputCls}
              aria-label="Município"
            />
          </Campo>
          <Campo label="UF">
            <input
              type="text"
              maxLength={2}
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
              className={cn(inputCls, 'uppercase')}
              aria-label="UF"
            />
          </Campo>
          <Campo label="CEP">
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={cep}
              onChange={(e) => setCep(e.target.value.replace(/\D/g, ''))}
              className={cn(inputCls, 'font-mono')}
              aria-label="CEP"
            />
          </Campo>
        </div>
      </Secao>

      {/* Dados clínicos da internação */}
      <Secao
        titulo="Dados Clínicos da Internação"
        icone={<FileText className="h-4 w-4 text-emerald-500" aria-hidden />}
        colapsavel
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Tipo de clínica / especialidade">
            <input
              type="text"
              value={tipoClinica}
              onChange={(e) => setTipoClinica(e.target.value)}
              className={inputCls}
              aria-label="Tipo de clínica"
            />
          </Campo>
          <Campo label="Caráter da internação *">
            <select
              required
              value={caraterInternacao}
              onChange={(e) => setCaraterInternacao(e.target.value as 'URGENCIA' | 'ELETIVA')}
              className={inputCls}
              aria-label="Caráter da internação"
            >
              <option value="URGENCIA">Urgência / Emergência</option>
              <option value="ELETIVA">Eletiva</option>
            </select>
          </Campo>
          <Campo label="CID-10 principal *">
            <input
              type="text"
              required
              value={cidPrincipal}
              onChange={(e) => setCidPrincipal(e.target.value.toUpperCase())}
              className={cn(inputCls, 'font-mono uppercase')}
              placeholder="Ex: J18.1"
              aria-label="CID principal"
            />
          </Campo>
          <Campo label="CID-10 secundário">
            <input
              type="text"
              value={cidSecundario}
              onChange={(e) => setCidSecundario(e.target.value.toUpperCase())}
              className={cn(inputCls, 'font-mono uppercase')}
              placeholder="Ex: I10"
              aria-label="CID secundário"
            />
          </Campo>
          <Campo label="Diagnóstico inicial" col="sm:col-span-2">
            <input
              type="text"
              value={diagnosticoInicial}
              onChange={(e) => setDiagnosticoInicial(e.target.value)}
              className={inputCls}
              aria-label="Diagnóstico inicial"
            />
          </Campo>
          <Campo label="Principais sinais e sintomas *" col="sm:col-span-2">
            <textarea
              required
              rows={4}
              value={sinaisSintomas}
              onChange={(e) => setSinaisSintomas(textoCadastroMaiusculo(e.target.value))}
              className={cn(inputCls, 'resize-y')}
              aria-label="Sinais e sintomas"
            />
          </Campo>
          <Campo label="Condições que justificam a internação *" col="sm:col-span-2">
            <textarea
              required
              rows={4}
              value={condicoes}
              onChange={(e) => setCondicoes(textoCadastroMaiusculo(e.target.value))}
              className={cn(inputCls, 'resize-y')}
              aria-label="Condições justificativas"
            />
          </Campo>
          <Campo label="Descrição do procedimento *" col="sm:col-span-2">
            <input
              type="text"
              required
              value={descricaoProcedimento}
              onChange={(e) => setDescricaoProcedimento(e.target.value)}
              className={inputCls}
              aria-label="Procedimento"
            />
          </Campo>
        </div>
      </Secao>

      {/* Profissional responsável */}
      <Secao
        titulo="Profissional Responsável"
        icone={<UserCheck className="h-4 w-4 text-purple-500" aria-hidden />}
        colapsavel
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome do profissional solicitante *" col="sm:col-span-2">
            <input
              type="text"
              required
              value={nomeProfissional}
              onChange={(e) => setNomeProfissional(e.target.value)}
              className={inputCls}
              aria-label="Nome do profissional"
            />
          </Campo>
          <Campo label="Registro do conselho (CRM / COREN)">
            <input
              type="text"
              value={registroConselho}
              onChange={(e) => setRegistroConselho(e.target.value)}
              className={inputCls}
              aria-label="Registro do conselho"
            />
          </Campo>
          <Campo label="Data da solicitação *">
            <input
              type="date"
              required
              value={dataSolicitacao}
              onChange={(e) => setDataSolicitacao(e.target.value)}
              className={inputCls}
              aria-label="Data da solicitação"
            />
          </Campo>
        </div>
      </Secao>

      {/* Observações de enfermagem */}
      <Secao
        titulo="Observações de Enfermagem"
        icone={<ClipboardList className="h-4 w-4 text-orange-500" aria-hidden />}
        colapsavel
      >
        <Campo label="Observações / intercorrências na admissão">
          <textarea
            rows={4}
            value={observacoesEnfermagem}
            onChange={(e) => setObservacoesEnfermagem(e.target.value)}
            className={cn(inputCls, 'resize-y')}
            placeholder="Registro de observações da enfermagem na recepção do paciente…"
            aria-label="Observações de enfermagem"
          />
        </Campo>
      </Secao>

      {/* Barra de ações */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border py-4 flex flex-wrap gap-3 -mx-1 px-1">
        <button
          type="button"
          disabled={enviando}
          onClick={() => salvarFicha('RASCUNHO')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
          aria-label="Salvar rascunho da ficha"
        >
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          Salvar rascunho
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={() => salvarFicha('SOLICITADO')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 disabled:opacity-50 transition-colors"
          aria-label="Salvar ficha de internamento"
        >
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <FileText className="h-4 w-4" aria-hidden />
          )}
          Salvar ficha de internamento
        </button>
        <button
          type="button"
          disabled={confirmando || !leitoId}
          onClick={onConfirmar}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors ml-auto"
          aria-label="Confirmar internação e receber paciente"
        >
          {confirmando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <UserCheck className="h-4 w-4" aria-hidden />
          )}
          Confirmar internação
        </button>
      </div>
    </div>
  )
}
