'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, Save, FileText, Printer } from 'lucide-react'
import { textoCadastroMaiusculo } from '@/lib/cadastro-maiusculo'
import { cn } from '@/lib/utils'
import { mascaraCpfInput, validarDocumentoCpfSeAplicavel } from '@/lib/validar-cpf'
import type { LaudoInternacaoPrefill } from '@/lib/laudo-internacao'
import { inputLeituraCls } from '@/components/internamento/CampoIdentificacaoLeitura'

type LaudoExtra = {
  cnesSolicitante?: string | null
  cnesExecutante?: string | null
  codigoIbgeMunicipio?: string | null
  codigoProcedimento?: string | null
  documentoProfissionalTipo?: string | null
  documentoProfissionalNumero?: string | null
  causasExternas?: Record<string, unknown> | null
  autorizacao?: Record<string, unknown> | null
  contextoInternacao?: {
    dataAdmissaoSugerida?: string
    enfermariaLeitoSugerido?: string
  }
  status?: string
} | null

const inputCls =
  'mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30'
const inputIdentificacaoCls = cn(inputCls, inputLeituraCls.replace('mt-1 ', ''))
const labelCls = 'text-sm font-medium text-foreground'
const sectionCls = 'bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4'

function SecaoTitulo({ numero, titulo }: { numero?: string; titulo: string }) {
  return (
    <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">
      {numero ? <span className="text-primary mr-2">{numero}</span> : null}
      {titulo}
    </h3>
  )
}

export function FormularioLaudoInternacao({
  atendimentoId,
  prefill,
  laudoExtra,
  variant = 'laudo',
}: {
  atendimentoId: string
  prefill: LaudoInternacaoPrefill
  laudoExtra: LaudoExtra
  /** `ficha` — cadastro dedicado; `laudo` — aba no prontuário de internação */
  variant?: 'laudo' | 'ficha'
}) {
  const ehFicha = variant === 'ficha'
  const router = useRouter()
  const ce = (laudoExtra?.causasExternas ?? {}) as Record<string, unknown>
  const aut = (laudoExtra?.autorizacao ?? {}) as Record<string, unknown>

  const [status, setStatus] = useState(laudoExtra?.status ?? 'RASCUNHO')
  const [nomeEstSol, setNomeEstSol] = useState(prefill.nomeEstabelecimentoSolicitante)
  const [cnesSol, setCnesSol] = useState(laudoExtra?.cnesSolicitante ?? prefill.cnesSolicitante ?? '')
  const [nomeEstExec, setNomeEstExec] = useState(prefill.nomeEstabelecimentoExecutante)
  const [cnesExec, setCnesExec] = useState(laudoExtra?.cnesExecutante ?? prefill.cnesExecutante ?? '')
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
  const [codigoIbge, setCodigoIbge] = useState(
    laudoExtra?.codigoIbgeMunicipio ?? prefill.codigoIbgeMunicipio ?? ''
  )
  const [uf, setUf] = useState(prefill.uf)
  const [cep, setCep] = useState(prefill.cep)
  const [sinaisSintomas, setSinaisSintomas] = useState(prefill.sinaisSintomas)
  const [condicoes, setCondicoes] = useState(prefill.condicoesJustificativa)
  const [resultados, setResultados] = useState(prefill.resultadosDiagnosticos)
  const [diagnosticoInicial, setDiagnosticoInicial] = useState(prefill.diagnosticoInicial)
  const [cidPrincipal, setCidPrincipal] = useState(prefill.cidPrincipal)
  const [cidSecundario, setCidSecundario] = useState(prefill.cidSecundario)
  const [cidAssociadas, setCidAssociadas] = useState(prefill.cidAssociadas)
  const [descricaoProcedimento, setDescricaoProcedimento] = useState(prefill.descricaoProcedimento)
  const [codigoProcedimento, setCodigoProcedimento] = useState(laudoExtra?.codigoProcedimento ?? '')
  const [clinica, setClinica] = useState(prefill.clinica)
  const [caraterInternacao, setCaraterInternacao] = useState(prefill.caraterInternacao)
  const [docTipo, setDocTipo] = useState(laudoExtra?.documentoProfissionalTipo ?? '')
  const [docNumero, setDocNumero] = useState(laudoExtra?.documentoProfissionalNumero ?? '')
  const [nomeProfissional, setNomeProfissional] = useState(prefill.nomeProfissionalSolicitante)
  const [dataSolicitacao, setDataSolicitacao] = useState(prefill.dataSolicitacao)
  const [registroConselho, setRegistroConselho] = useState(prefill.registroConselho)
  const [acidenteTransito, setAcidenteTransito] = useState(Boolean(ce.acidenteTransito))
  const [acidenteTrabTipico, setAcidenteTrabTipico] = useState(Boolean(ce.acidenteTrabalhoTipico))
  const [acidenteTrabTrajeto, setAcidenteTrabTrajeto] = useState(Boolean(ce.acidenteTrabalhoTrajeto))
  const [cnpjSeguradora, setCnpjSeguradora] = useState(String(ce.cnpjSeguradora ?? ''))
  const [numeroBilhete, setNumeroBilhete] = useState(String(ce.numeroBilhete ?? ''))
  const [serieBilhete, setSerieBilhete] = useState(String(ce.serieBilhete ?? ''))
  const [cnpjEmpresa, setCnpjEmpresa] = useState(String(ce.cnpjEmpresa ?? ''))
  const [cnaeEmpresa, setCnaeEmpresa] = useState(String(ce.cnaeEmpresa ?? ''))
  const [cbor, setCbor] = useState(String(ce.cbor ?? ''))
  const [vinculoPrevidencia, setVinculoPrevidencia] = useState(String(ce.vinculoPrevidencia ?? ''))
  const ctx = laudoExtra?.contextoInternacao
  const [nomeAutorizador, setNomeAutorizador] = useState(String(aut.nomeProfissionalAutorizador ?? ''))
  const [codOrgaoEmissor, setCodOrgaoEmissor] = useState(String(aut.codOrgaoEmissor ?? ''))
  const [docTipoAutorizador, setDocTipoAutorizador] = useState(String(aut.documentoTipo ?? ''))
  const [docNumeroAutorizador, setDocNumeroAutorizador] = useState(String(aut.documentoNumero ?? ''))
  const [numeroAutorizacao, setNumeroAutorizacao] = useState(String(aut.numeroAutorizacao ?? ''))
  const [dataAutorizacao, setDataAutorizacao] = useState(String(aut.dataAutorizacao ?? ''))
  const [registroConselhoAut, setRegistroConselhoAut] = useState(String(aut.registroConselho ?? ''))
  const [dataAdmissao, setDataAdmissao] = useState(
    String(aut.dataAdmissao ?? ctx?.dataAdmissaoSugerida ?? '')
  )
  const [dataAlta, setDataAlta] = useState(String(aut.dataAlta ?? ''))
  const [enfermariaLeito, setEnfermariaLeito] = useState(
    String(aut.enfermariaLeito ?? ctx?.enfermariaLeitoSugerido ?? '')
  )
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.FormEvent, statusEnvio: string) {
    e.preventDefault()

    if (!validarDocumentoCpfSeAplicavel(docTipo, docNumero)) {
      toast.error('CPF do profissional solicitante inválido.')
      return
    }
    if (!validarDocumentoCpfSeAplicavel(docTipoAutorizador, docNumeroAutorizador)) {
      toast.error('CPF do profissional autorizador inválido.')
      return
    }

    setEnviando(true)
    try {
      const payload = {
        status: statusEnvio,
        nomeEstabelecimentoSolicitante: nomeEstSol,
        cnesSolicitante: cnesSol,
        nomeEstabelecimentoExecutante: nomeEstExec,
        cnesExecutante: cnesExec,
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
        codigoIbgeMunicipio: codigoIbge,
        uf,
        cep,
        sinaisSintomas,
        condicoesJustificativa: condicoes,
        resultadosDiagnosticos: resultados,
        diagnosticoInicial,
        cidPrincipal,
        cidSecundario,
        cidAssociadas,
        descricaoProcedimento,
        codigoProcedimento,
        clinica,
        caraterInternacao,
        documentoProfissionalTipo: docTipo || null,
        documentoProfissionalNumero: docNumero,
        nomeProfissionalSolicitante: nomeProfissional,
        dataSolicitacao,
        registroConselho,
        causasExternas: {
          acidenteTransito,
          acidenteTrabalhoTipico: acidenteTrabTipico,
          acidenteTrabalhoTrajeto: acidenteTrabTrajeto,
          cnpjSeguradora,
          numeroBilhete,
          serieBilhete,
          cnpjEmpresa,
          cnaeEmpresa,
          cbor,
          vinculoPrevidencia: vinculoPrevidencia || null,
        },
        autorizacao: {
          nomeProfissionalAutorizador: nomeAutorizador,
          codOrgaoEmissor,
          documentoTipo: docTipoAutorizador || null,
          documentoNumero: docNumeroAutorizador,
          numeroAutorizacao,
          dataAutorizacao,
          registroConselho: registroConselhoAut,
          dataAdmissao,
          dataAlta,
          enfermariaLeito,
        },
      }

      const res = await fetch(`/api/atendimento/${atendimentoId}/internamento`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.sucesso) {
        const det = json.detalhes
          ? Object.entries(json.detalhes as Record<string, string[]>)
              .map(([k, v]) => `${k}: ${v.join(', ')}`)
              .join(' | ')
          : ''
        toast.error(det ? `${json.erro} — ${det}` : (json.erro ?? 'Erro ao salvar.'))
        return
      }
      setStatus(statusEnvio)
      toast.success(
        statusEnvio === 'SOLICITADO'
          ? ehFicha
            ? 'Ficha de internamento salva.'
            : 'Laudo de internação registrado como solicitado.'
          : 'Rascunho salvo com sucesso.'
      )
      if (ehFicha && statusEnvio === 'SOLICITADO') {
        router.push('/internamento/admissoes')
        router.refresh()
        return
      }
      router.refresh()
    } catch {
      toast.error('Erro de conexão ao salvar laudo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            {ehFicha
              ? 'Ficha de Internamento — Solicitação de Autorização de Internação Hospitalar (SUS)'
              : 'Laudo para Solicitação de Autorização de Internação Hospitalar'}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Atendimento {prefill.numeroAtendimento} — identificação, justificativa clínica, CID,
            procedimento, causas externas e autorização. Dados pré-preenchidos do paciente e do
            prontuário.
          </p>
        </div>
        <span
          className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-md shrink-0',
            status === 'AUTORIZADO'
              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
              : status === 'SOLICITADO'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
          )}
        >
          {status === 'AUTORIZADO'
            ? 'Autorizado'
            : status === 'SOLICITADO'
              ? 'Solicitado'
              : 'Rascunho'}
        </span>
      </div>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Identificação do estabelecimento de saúde" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nome do estabelecimento solicitante</label>
            <input
              type="text"
              value={nomeEstSol}
              onChange={(e) => setNomeEstSol(e.target.value)}
              className={inputCls}
              aria-label="Nome do estabelecimento solicitante"
            />
          </div>
          <div>
            <label className={labelCls}>CNES solicitante</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={7}
              value={cnesSol}
              onChange={(e) => setCnesSol(e.target.value.replace(/\D/g, ''))}
              className={cn(inputCls, 'font-mono')}
              aria-label="CNES solicitante"
            />
          </div>
          <div>
            <label className={labelCls}>Nome do estabelecimento executante</label>
            <input
              type="text"
              value={nomeEstExec}
              onChange={(e) => setNomeEstExec(e.target.value)}
              className={inputCls}
              aria-label="Nome do estabelecimento executante"
            />
          </div>
          <div>
            <label className={labelCls}>CNES executante</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={7}
              value={cnesExec}
              onChange={(e) => setCnesExec(e.target.value.replace(/\D/g, ''))}
              className={cn(inputCls, 'font-mono')}
              aria-label="CNES executante"
            />
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Identificação do paciente" />
        <p className="text-xs text-muted-foreground mb-3">
          Dados do cadastro e do atendimento — somente leitura.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <label className={labelCls}>Nome do paciente *</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={nomePaciente}
              className={inputIdentificacaoCls}
              aria-label="Nome do paciente"
            />
          </div>
          <div>
            <label className={labelCls}>Nº do prontuário</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={numeroProntuario}
              className={cn(inputIdentificacaoCls, 'font-mono')}
              aria-label="Número do prontuário"
            />
          </div>
          <div>
            <label className={labelCls}>Cartão Nacional de Saúde (CNS)</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={cns}
              className={cn(inputIdentificacaoCls, 'font-mono')}
              aria-label="CNS"
            />
          </div>
          <div>
            <label className={labelCls}>Data de nascimento *</label>
            <input
              type="date"
              readOnly
              tabIndex={-1}
              value={dataNascimento}
              className={inputIdentificacaoCls}
              aria-label="Data de nascimento"
            />
          </div>
          <div>
            <label className={labelCls}>Sexo *</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={sexoCodigo === '3' ? 'Feminino (3)' : 'Masculino (1)'}
              className={inputIdentificacaoCls}
              aria-label="Sexo"
            />
          </div>
          <div>
            <label className={labelCls}>DDD</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={telefoneDdd}
              className={inputIdentificacaoCls}
              aria-label="DDD telefone"
            />
          </div>
          <div>
            <label className={labelCls}>Telefone de contato</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={telefoneNumero}
              className={inputIdentificacaoCls}
              aria-label="Telefone"
            />
          </div>
          <div className="sm:col-span-3">
            <label className={labelCls}>Nome da mãe ou responsável</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={nomeMae}
              className={inputIdentificacaoCls}
              aria-label="Nome da mãe"
            />
          </div>
          <div className="sm:col-span-3">
            <label className={labelCls}>Endereço (rua, nº, bairro)</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={enderecoCompleto}
              className={inputIdentificacaoCls}
              aria-label="Endereço"
            />
          </div>
          <div>
            <label className={labelCls}>Município de residência</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={municipioResidencia}
              className={inputIdentificacaoCls}
              aria-label="Município"
            />
          </div>
          <div>
            <label className={labelCls}>Cód. IBGE município</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={codigoIbge}
              className={cn(inputIdentificacaoCls, 'font-mono')}
              aria-label="Código IBGE"
            />
          </div>
          <div>
            <label className={labelCls}>UF</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={uf}
              className={cn(inputIdentificacaoCls, 'uppercase')}
              aria-label="UF"
            />
          </div>
          <div>
            <label className={labelCls}>CEP</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={cep}
              className={cn(inputIdentificacaoCls, 'font-mono')}
              aria-label="CEP"
            />
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Justificativa da internação" />
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Principais sinais e sintomas clínicos *</label>
            <textarea
              required
              rows={4}
              value={sinaisSintomas}
              onChange={(e) => setSinaisSintomas(textoCadastroMaiusculo(e.target.value))}
              className={cn(inputCls, 'resize-y')}
              aria-label="Sinais e sintomas"
            />
          </div>
          <div>
            <label className={labelCls}>Condições que justificam a internação *</label>
            <textarea
              required
              rows={4}
              value={condicoes}
              onChange={(e) => setCondicoes(textoCadastroMaiusculo(e.target.value))}
              className={cn(inputCls, 'resize-y')}
              aria-label="Condições justificativas"
            />
          </div>
          <div>
            <label className={labelCls}>Principais resultados de provas diagnósticas</label>
            <textarea
              rows={3}
              value={resultados}
              onChange={(e) => setResultados(textoCadastroMaiusculo(e.target.value))}
              className={cn(inputCls, 'resize-y')}
              aria-label="Resultados de exames"
            />
          </div>
          <div>
            <label className={labelCls}>Diagnóstico inicial</label>
            <input
              type="text"
              value={diagnosticoInicial}
              onChange={(e) => setDiagnosticoInicial(e.target.value)}
              className={inputCls}
              aria-label="Diagnóstico inicial"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>CID-10 principal *</label>
              <input
                type="text"
                required
                value={cidPrincipal}
                onChange={(e) => setCidPrincipal(e.target.value.toUpperCase())}
                className={cn(inputCls, 'font-mono uppercase')}
                aria-label="CID principal"
              />
            </div>
            <div>
              <label className={labelCls}>CID-10 secundário</label>
              <input
                type="text"
                value={cidSecundario}
                onChange={(e) => setCidSecundario(e.target.value.toUpperCase())}
                className={cn(inputCls, 'font-mono uppercase')}
                aria-label="CID secundário"
              />
            </div>
            <div>
              <label className={labelCls}>CID causas associadas</label>
              <input
                type="text"
                value={cidAssociadas}
                onChange={(e) => setCidAssociadas(e.target.value.toUpperCase())}
                className={cn(inputCls, 'font-mono uppercase')}
                aria-label="CID associadas"
              />
            </div>
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Procedimento solicitado" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Código do procedimento</label>
            <input
              type="text"
              value={codigoProcedimento}
              onChange={(e) => setCodigoProcedimento(e.target.value)}
              className={cn(inputCls, 'font-mono')}
              aria-label="Código do procedimento"
            />
          </div>
          <div>
            <label className={labelCls}>Descrição do procedimento *</label>
            <input
              type="text"
              required
              value={descricaoProcedimento}
              onChange={(e) => setDescricaoProcedimento(e.target.value)}
              className={inputCls}
              aria-label="Descrição do procedimento"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelCls}>Clínica</label>
            <input
              type="text"
              value={clinica}
              onChange={(e) => setClinica(e.target.value)}
              className={inputCls}
              aria-label="Clínica"
            />
          </div>
          <div>
            <label className={labelCls}>Caráter da internação *</label>
            <select
              required
              value={caraterInternacao}
              onChange={(e) => setCaraterInternacao(e.target.value as 'URGENCIA' | 'ELETIVA')}
              className={inputCls}
              aria-label="Caráter da internação"
            >
              <option value="URGENCIA">Urgência / emergência</option>
              <option value="ELETIVA">Eletiva</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelCls}>Documento do profissional (CNS ou CPF)</label>
            <select
              value={docTipo}
              onChange={(e) => setDocTipo(e.target.value)}
              className={inputCls}
              aria-label="Tipo de documento"
            >
              <option value="">—</option>
              <option value="CNS">CNS</option>
              <option value="CPF">CPF</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Nº do documento</label>
            <input
              type="text"
              value={docNumero}
              onChange={(e) =>
                setDocNumero(
                  docTipo === 'CPF' ? mascaraCpfInput(e.target.value) : e.target.value
                )
              }
              maxLength={docTipo === 'CPF' ? 14 : 20}
              className={cn(inputCls, docTipo === 'CPF' && 'font-mono')}
              aria-label="Número do documento"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelCls}>Nome do profissional solicitante *</label>
            <input
              type="text"
              required
              value={nomeProfissional}
              onChange={(e) => setNomeProfissional(e.target.value)}
              className={inputCls}
              aria-label="Nome do profissional"
            />
          </div>
          <div>
            <label className={labelCls}>Data da solicitação *</label>
            <input
              type="date"
              required
              value={dataSolicitacao}
              onChange={(e) => setDataSolicitacao(e.target.value)}
              className={inputCls}
              aria-label="Data da solicitação"
            />
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Causas externas (acidentes ou violências)" />
        <p className="text-xs text-muted-foreground">Preencher somente quando aplicável.</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={acidenteTransito}
              onChange={(e) => setAcidenteTransito(e.target.checked)}
              className="rounded border-input"
            />
            Acidente de trânsito
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={acidenteTrabTipico}
              onChange={(e) => setAcidenteTrabTipico(e.target.checked)}
              className="rounded border-input"
            />
            Acidente trabalho típico
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={acidenteTrabTrajeto}
              onChange={(e) => setAcidenteTrabTrajeto(e.target.checked)}
              className="rounded border-input"
            />
            Acidente trabalho trajeto
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>CNPJ da seguradora</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={18}
              value={cnpjSeguradora}
              onChange={(e) => setCnpjSeguradora(e.target.value.replace(/\D/g, ''))}
              className={cn(inputCls, 'font-mono')}
              aria-label="CNPJ da seguradora"
            />
          </div>
          <div>
            <label className={labelCls}>Nº do bilhete</label>
            <input
              type="text"
              value={numeroBilhete}
              onChange={(e) => setNumeroBilhete(e.target.value)}
              className={inputCls}
              aria-label="Número do bilhete"
            />
          </div>
          <div>
            <label className={labelCls}>Série</label>
            <input
              type="text"
              value={serieBilhete}
              onChange={(e) => setSerieBilhete(e.target.value)}
              className={inputCls}
              aria-label="Série do bilhete"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>CNPJ da empresa</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={18}
              value={cnpjEmpresa}
              onChange={(e) => setCnpjEmpresa(e.target.value.replace(/\D/g, ''))}
              className={cn(inputCls, 'font-mono')}
              aria-label="CNPJ da empresa"
            />
          </div>
          <div>
            <label className={labelCls}>CNAE da empresa</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={cnaeEmpresa}
              onChange={(e) => setCnaeEmpresa(e.target.value.replace(/\D/g, ''))}
              className={cn(inputCls, 'font-mono')}
              aria-label="CNAE da empresa"
            />
          </div>
          <div>
            <label className={labelCls}>CBOR</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={cbor}
              onChange={(e) => setCbor(e.target.value.replace(/\D/g, ''))}
              className={cn(inputCls, 'font-mono')}
              aria-label="CBOR"
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Vínculo com a previdência</label>
          <select
            value={vinculoPrevidencia}
            onChange={(e) => setVinculoPrevidencia(e.target.value)}
            className={inputCls}
            aria-label="Vínculo previdência"
          >
            <option value="">—</option>
            <option value="EMPREGADO">Empregado</option>
            <option value="EMPREGADOR">Empregador</option>
            <option value="AUTONOMO">Autônomo</option>
            <option value="DESEMPREGADO">Desempregado</option>
            <option value="APOSENTADO">Aposentado</option>
            <option value="NAO_SEGURADO">Não segurado</option>
          </select>
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Autorização" />
        <p className="text-xs text-muted-foreground">Preenchido pelo autorizador após análise.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nome do profissional autorizador</label>
            <input
              type="text"
              value={nomeAutorizador}
              onChange={(e) => setNomeAutorizador(e.target.value)}
              className={inputCls}
              aria-label="Nome autorizador"
            />
          </div>
          <div>
            <label className={labelCls}>Cod. órgão emissor</label>
            <input
              type="text"
              value={codOrgaoEmissor}
              onChange={(e) => setCodOrgaoEmissor(e.target.value)}
              className={cn(inputCls, 'font-mono')}
              aria-label="Código do órgão emissor"
            />
          </div>
          <div>
            <label className={labelCls}>Documento do profissional (CNS ou CPF)</label>
            <select
              value={docTipoAutorizador}
              onChange={(e) => setDocTipoAutorizador(e.target.value)}
              className={inputCls}
              aria-label="Tipo de documento do autorizador"
            >
              <option value="">—</option>
              <option value="CNS">CNS</option>
              <option value="CPF">CPF</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Nº do documento (CNS ou CPF)</label>
            <input
              type="text"
              value={docNumeroAutorizador}
              onChange={(e) =>
                setDocNumeroAutorizador(
                  docTipoAutorizador === 'CPF' ? mascaraCpfInput(e.target.value) : e.target.value
                )
              }
              maxLength={docTipoAutorizador === 'CPF' ? 14 : 20}
              className={cn(inputCls, 'font-mono')}
              aria-label="Número do documento do autorizador"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Nº autorização de internação (AIH)</label>
            <input
              type="text"
              value={numeroAutorizacao}
              onChange={(e) => setNumeroAutorizacao(e.target.value)}
              className={cn(inputCls, 'font-mono')}
              aria-label="Número AIH"
            />
          </div>
          <div>
            <label className={labelCls}>Data da autorização</label>
            <input
              type="date"
              value={dataAutorizacao}
              onChange={(e) => setDataAutorizacao(e.target.value)}
              className={inputCls}
              aria-label="Data autorização"
            />
          </div>
          <div>
            <label className={labelCls}>Carimbo e assinatura (registro do conselho)</label>
            <input
              type="text"
              value={registroConselhoAut}
              onChange={(e) => setRegistroConselhoAut(e.target.value)}
              className={inputCls}
              aria-label="Registro do conselho do autorizador"
            />
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <SecaoTitulo titulo="Internação" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Data da admissão</label>
            <input
              type="date"
              value={dataAdmissao}
              onChange={(e) => setDataAdmissao(e.target.value)}
              className={inputCls}
              aria-label="Data da admissão"
            />
          </div>
          <div>
            <label className={labelCls}>Data da alta (em aberto)</label>
            <input
              type="date"
              value={dataAlta}
              onChange={(e) => setDataAlta(e.target.value)}
              className={inputCls}
              aria-label="Data da alta"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Enfermaria e leito</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={enfermariaLeito || 'Definido na admissão (cadastro de leitos)'}
              className={inputIdentificacaoCls}
              aria-label="Enfermaria e leito"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Leito único no sistema — atribuído na admissão enfermagem.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 sticky bottom-0 bg-background/95 backdrop-blur border-t border-border py-4 -mx-1 px-1">
        <Link
          href={`/internamento/imprimir/${atendimentoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted"
          aria-label={ehFicha ? 'Imprimir ficha de internamento' : 'Imprimir laudo de internação'}
        >
          <Printer className="h-4 w-4" aria-hidden />
          {ehFicha ? 'Imprimir ficha' : 'Imprimir laudo'}
        </Link>
        <button
          type="button"
          disabled={enviando}
          onClick={(e) => handleSubmit(e, 'RASCUNHO')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
          aria-label="Salvar rascunho"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar rascunho
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={(e) => handleSubmit(e, 'SOLICITADO')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          aria-label={ehFicha ? 'Salvar ficha de internamento' : 'Registrar solicitação de internação'}
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {ehFicha ? 'Salvar Ficha' : 'Registrar solicitação'}
        </button>
      </div>
    </form>
  )
}
