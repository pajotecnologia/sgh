// components/internamento/FichaInternacaoAltaDocumento.tsx
// Documento de Impressão — Folha de Internação e Alta Hospitalar (Ficha Hospitalar)

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit3, Printer } from 'lucide-react'
import type { DadosFichaInternacaoAlta } from '@/lib/carregar-dados-ficha-internacao-alta'
import { CabecalhoInstituicaoImpressao } from '@/components/print/CabecalhoInstituicaoImpressao'
import { BotaoImprimirFicha } from '@/components/recepcao/BotaoImprimirFicha'

function SecaoDocumento({
  titulo,
  numero,
  children,
  className = '',
}: {
  titulo: string
  numero?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`border border-slate-300 bg-white mb-3 rounded-sm overflow-hidden break-inside-avoid ${className}`}>
      <div className="bg-slate-100/90 border-b border-slate-300 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
        {numero ? <span className="text-slate-500 font-mono font-semibold">{numero}.</span> : null}
        <span>{titulo}</span>
      </div>
      <div className="p-2.5 text-xs text-slate-800 leading-normal">{children}</div>
    </section>
  )
}

function ItemDado({
  rotulo,
  valor,
  destaque = false,
  className = '',
}: {
  rotulo: string
  valor?: string | number | null
  destaque?: boolean
  className?: string
}) {
  return (
    <div className={`space-y-0.5 ${className}`}>
      <span className="block text-[9.5px] font-bold uppercase tracking-wide text-slate-600">
        {rotulo}
      </span>
      <span
        className={`block text-xs text-slate-900 ${
          destaque ? 'font-semibold text-slate-950' : 'font-normal'
        }`}
      >
        {valor || '—'}
      </span>
    </div>
  )
}

function AreaTextoDocumento({
  rotulo,
  texto,
  linhasMinimas = 2,
}: {
  rotulo: string
  texto?: string | null
  linhasMinimas?: number
}) {
  return (
    <div className="space-y-1">
      <span className="block text-[9.5px] font-bold uppercase tracking-wide text-slate-600">
        {rotulo}
      </span>
      <p
        className="text-xs text-slate-900 whitespace-pre-wrap border border-slate-200 rounded p-2 bg-slate-50/40"
        style={{ minHeight: `${linhasMinimas * 1.3}rem` }}
      >
        {texto?.trim() || '—'}
      </p>
    </div>
  )
}

function CheckItem({ marcado, label }: { marcado?: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-800 mr-3 mb-1">
      <span
        className={`inline-flex w-3.5 h-3.5 border rounded-xs items-center justify-center text-[9px] font-bold leading-none ${
          marcado
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-400 bg-white text-transparent'
        }`}
      >
        {marcado ? '✓' : ''}
      </span>
      <span className={marcado ? 'font-semibold text-slate-950' : 'text-slate-700'}>{label}</span>
    </span>
  )
}

export function FichaInternacaoAltaDocumento({ dados }: { dados: DadosFichaInternacaoAlta }) {
  const f = dados.prefill
  const nat = f.naturezaAcidente || {}
  const evolucoes = f.evolucoes && f.evolucoes.length > 0 ? f.evolucoes : []

  const temNaturezaAcidente =
    nat.casual ||
    nat.queda ||
    nat.acidenteTrabalho ||
    nat.acidenteTransito ||
    nat.intoxicacao ||
    nat.agressao ||
    nat.tentativaSuicidio ||
    nat.outrasCausas ||
    Boolean(f.localAcidente || f.dataAcidente)

  return (
    <div className="ficha-hospitalar-print min-h-screen bg-slate-100 print:bg-white py-6 print:py-0">
      <div className="max-w-[210mm] mx-auto px-4 print:px-0 print:max-w-none">
        {/* Barra superior de ações (Oculta na Impressão) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden bg-card border border-border rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <Link
              href="/internamento/admissoes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar às Admissões
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/internamento/ficha-alta/${dados.atendimentoId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Editar Ficha
            </Link>
            <BotaoImprimirFicha />
          </div>
        </div>

        {/* Folha Oficial A4 */}
        <article className="bg-white text-slate-900 border border-slate-300 print:border-none p-6 print:p-0 shadow-sm rounded-lg print:rounded-none">
          {/* Cabeçalho Institucional Padrão */}
          <CabecalhoInstituicaoImpressao
            instituicao={dados.instituicao ?? null}
            subtitulo="Folha de Internação e Alta Hospitalar — Ficha Clínica de Admissão"
            direita={
              <div className="text-right text-xs space-y-1">
                <div className="inline-block px-2 py-0.5 rounded border border-slate-300 bg-slate-50 font-bold text-slate-800">
                  Nº {dados.paciente.numeroAtendimento}
                </div>
                {dados.leito?.codigo ? (
                  <p className="font-semibold text-slate-900">
                    Leito: <span className="font-mono">{dados.leito.codigo}</span> ({dados.leito.ala})
                  </p>
                ) : null}
                <p className="text-[11px] text-slate-600">
                  Status Ficha:{' '}
                  <span className="font-semibold">
                    {dados.ficha?.status === 'CONCLUIDA'
                      ? 'Concluída'
                      : dados.ficha?.status === 'EM_ANDAMENTO'
                      ? 'Em Andamento'
                      : 'Rascunho'}
                  </span>
                </p>
              </div>
            }
          />

          {/* 1. Identificação do Paciente */}
          <SecaoDocumento titulo="Identificação do Paciente" numero="1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ItemDado rotulo="Nome do Paciente" valor={f.nome || dados.paciente.nomeExibicao} destaque className="col-span-2" />
              <ItemDado rotulo="Nº Registro / Prontuário" valor={f.registroNumero || dados.paciente.numeroAtendimento} />
              <ItemDado rotulo="Categoria / Convênio" valor={f.categoria || 'SUS'} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-2.5 pt-2 border-t border-slate-100">
              <ItemDado rotulo="Idade" valor={f.idade ? `${f.idade} anos` : null} />
              <ItemDado rotulo="Sexo" valor={f.sexo} />
              <ItemDado rotulo="Cor / Etnia" valor={f.cor} />
              <ItemDado rotulo="Estado Civil" valor={f.estadoCivil} />
              <ItemDado rotulo="Profissão" valor={f.profissao} />
              <ItemDado rotulo="Naturalidade" valor={f.naturalidade} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2.5 pt-2 border-t border-slate-100">
              <ItemDado rotulo="Endereço Residencial" valor={f.endereco} className="col-span-2" />
              <ItemDado rotulo="Procedência / Origem" valor={f.procedencia} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2.5 pt-2 border-t border-slate-100">
              <ItemDado rotulo="Responsável pelo Paciente" valor={f.responsavelPessoaDependente} className="col-span-2" />
              <ItemDado rotulo="Parentesco" valor={f.responsavelParentesco} />
              <ItemDado rotulo="Telefone Responsável" valor={f.responsavelFone} />
            </div>

            {(f.trazidoPor || f.trazidoFone) ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2.5 pt-2 border-t border-slate-100">
                <ItemDado rotulo="Trazido Por (Acompanhante / Socorro)" valor={f.trazidoPor} className="col-span-2" />
                <ItemDado rotulo="Endereço Acompanhante" valor={f.trazidoEndereco} />
                <ItemDado rotulo="Telefone Acompanhante" valor={f.trazidoFone} />
              </div>
            ) : null}
          </SecaoDocumento>

          {/* 2. Natureza do Acidente / Causa Externa (Se houver preenchimento) */}
          {temNaturezaAcidente ? (
            <SecaoDocumento titulo="Natureza do Acidente / Causa Externa" numero="2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                <CheckItem marcado={nat.casual} label="Casual" />
                <CheckItem marcado={nat.queda} label="Queda" />
                <CheckItem marcado={nat.acidenteTrabalho} label="Acidente de Trabalho" />
                <CheckItem marcado={nat.acidenteTransito} label="Acidente de Trânsito" />
                <CheckItem marcado={nat.intoxicacao} label="Intoxicação" />
                <CheckItem marcado={nat.agressao} label="Agressão" />
                <CheckItem marcado={nat.tentativaSuicidio} label="Tentativa de Suicídio" />
                <CheckItem marcado={nat.outrasCausas} label="Outras Causas" />
              </div>

              {nat.outrasCausasTexto ? (
                <p className="text-xs text-slate-800 mb-2">
                  <span className="font-semibold">Especificação das Causas:</span> {nat.outrasCausasTexto}
                </p>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <ItemDado rotulo="Local do Acidente" valor={f.localAcidente} />
                <ItemDado rotulo="Data do Acidente" valor={f.dataAcidente} />
                <ItemDado rotulo="Hora do Acidente" valor={f.horaAcidente} />
              </div>
            </SecaoDocumento>
          ) : null}

          {/* 3. Admissão Clínica & Atendimento Inicial */}
          <SecaoDocumento titulo="Admissão Clínica & Exame Inicial" numero={temNaturezaAcidente ? '3' : '2'}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2.5">
              <ItemDado rotulo="Data da Internação" valor={f.dataInternacao} destaque />
              <ItemDado rotulo="Hora da Internação" valor={f.horaInternacao} destaque />
              <div className="col-span-2 flex items-center gap-3 pt-3">
                <CheckItem marcado={f.atendimentoClinico} label="Atendimento Clínico" />
                <CheckItem marcado={f.atendimentoCirurgico} label="Atendimento Cirúrgico" />
              </div>
            </div>

            {/* Sinais Vitais de Entrada */}
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5 mb-3">
              <span className="block text-[9.5px] font-bold uppercase tracking-wide text-slate-600 mb-1.5">
                Sinais Vitais de Entrada
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ItemDado rotulo="Pressão Arterial (PA)" valor={f.pressaoArterial} destaque />
                <ItemDado rotulo="Pulso / FC" valor={f.pulso} destaque />
                <ItemDado rotulo="Temperatura" valor={f.temperatura} destaque />
                <ItemDado rotulo="Peso" valor={f.peso} destaque />
              </div>
            </div>

            <div className="space-y-2.5">
              <AreaTextoDocumento rotulo="História da Doença Atual (HDA) / Queixa Principal" texto={f.historiaDoencaAtual} linhasMinimas={3} />
              <AreaTextoDocumento rotulo="Exame Físico Inicial" texto={f.exameFisico} linhasMinimas={3} />
              <AreaTextoDocumento rotulo="Diagnóstico Provisório / Hipótese Diagnóstica" texto={f.diagnosticoProvisorio} linhasMinimas={2} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-2 border-t border-slate-100">
              <ItemDado rotulo="Recepcionista / Responsável Admissão" valor={f.recepcionista} />
              <ItemDado rotulo="Médico Assistente Admissão (CREMEPE / CRM)" valor={f.medicoCremepe} destaque />
            </div>
          </SecaoDocumento>

          {/* 4. Evoluções Clínicas e Relatórios de Enfermagem */}
          {evolucoes.length > 0 || f.observacoesEnfermagem ? (
            <SecaoDocumento titulo="Evolução Clínica & Relatório da Enfermagem" numero={temNaturezaAcidente ? '4' : '3'}>
              {evolucoes.length > 0 ? (
                <div className="border border-slate-200 rounded overflow-hidden mb-3">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-28 border-r border-slate-200">Data / Hora</th>
                        <th className="p-2 border-r border-slate-200">Evolução Clínica Médica</th>
                        <th className="p-2">Relatório de Enfermagem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {evolucoes.map((ev, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2 align-top font-mono font-medium text-slate-700 border-r border-slate-200">
                            {ev.data || '—'} {ev.hora ? `às ${ev.hora}` : ''}
                          </td>
                          <td className="p-2 align-top whitespace-pre-wrap text-slate-900 border-r border-slate-200">
                            {ev.evolucaoClinica || '—'}
                          </td>
                          <td className="p-2 align-top whitespace-pre-wrap text-slate-900">
                            {ev.relatorioEnfermagem || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {f.observacoesEnfermagem ? (
                <AreaTextoDocumento rotulo="Observações Gerais da Enfermagem" texto={f.observacoesEnfermagem} linhasMinimas={2} />
              ) : null}
            </SecaoDocumento>
          ) : null}

          {/* 5. Condições de Alta e Desfecho Hospitalar */}
          <SecaoDocumento titulo="Condições de Alta & Desfecho Hospitalar" numero={temNaturezaAcidente ? '5' : '4'}>
            <div className="mb-2">
              <span className="block text-[9.5px] font-bold uppercase tracking-wide text-slate-600 mb-1">
                Condição na Alta
              </span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <CheckItem marcado={f.altaCurado} label="Curado" />
                <CheckItem marcado={f.altaMelhorado} label="Melhorado" />
                <CheckItem marcado={f.altaInternado} label="Permanece Internado" />
                <CheckItem marcado={f.altaPiorado} label="Inalterado / Piorado" />
                <CheckItem marcado={f.obito} label="Óbito" />
              </div>
            </div>

            {f.obito ? (
              <div className="bg-rose-50/70 border border-rose-200 rounded p-2.5 mb-2.5 text-xs text-rose-950">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-bold">Registro de Óbito:</span>
                  <span>Data: {f.obitoData || '—'}</span>
                  <span>Hora: {f.obitoHora || '—'}</span>
                  <CheckItem marcado={f.obitoMenos48h} label="Menos de 48 horas de internação" />
                  <CheckItem marcado={f.obitoMais48h} label="Mais de 48 horas de internação" />
                </div>
              </div>
            ) : null}

            <div className="mb-2.5 pt-2 border-t border-slate-100">
              <span className="block text-[9.5px] font-bold uppercase tracking-wide text-slate-600 mb-1">
                Motivo da Alta
              </span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <CheckItem marcado={f.motivoDecisaoMedica} label="Decisão Médica (Clínica)" />
                <CheckItem marcado={f.motivoAltaPedida} label="Alta a Pedido" />
                <CheckItem marcado={f.motivoTransferencia} label="Transferência Hospitalar" />
                <CheckItem marcado={f.motivoIndisciplina} label="Indisciplina" />
              </div>
              {f.transferenciaPara ? (
                <p className="text-xs text-slate-800 mt-1">
                  <span className="font-semibold">Transferido para:</span> {f.transferenciaPara}
                </p>
              ) : null}
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <AreaTextoDocumento rotulo="Diagnóstico Definitivo / Síntese Clínica de Alta" texto={f.diagnosticoDefinitivo} linhasMinimas={2} />
              <AreaTextoDocumento rotulo="Observações e Orientações Pós-Alta" texto={f.observacaoAlta} linhasMinimas={2} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-2 border-t border-slate-100">
              <ItemDado rotulo="Data da Alta Hospitalar" valor={f.dataAlta} destaque />
              <ItemDado rotulo="Médico Responsável pela Alta (CREMEPE / CRM)" valor={f.medicoCremepeAlta} destaque />
            </div>
          </SecaoDocumento>

          {/* 6. Termo e Assinaturas */}
          <section className="mt-8 pt-4 border-t-2 border-slate-300 break-inside-avoid">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-xs">
              <div className="pt-8 border-t border-slate-400">
                <p className="font-semibold text-slate-900">{f.medicoCremepe || 'Médico Assistente'}</p>
                <p className="text-[10px] text-slate-600 uppercase">Médico Admissão (CREMEPE / CRM)</p>
              </div>

              <div className="pt-8 border-t border-slate-400">
                <p className="font-semibold text-slate-900">{f.medicoCremepeAlta || 'Médico Responsável Alta'}</p>
                <p className="text-[10px] text-slate-600 uppercase">Médico da Alta (CREMEPE / CRM)</p>
              </div>

              <div className="pt-8 border-t border-slate-400">
                <p className="font-semibold text-slate-900">{f.nome || dados.paciente.nomeExibicao}</p>
                <p className="text-[10px] text-slate-600 uppercase">Paciente ou Responsável Legal</p>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  )
}
