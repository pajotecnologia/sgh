import { BotaoImprimirFicha } from '@/components/recepcao/BotaoImprimirFicha'
import { CabecalhoInstituicaoImpressao } from '@/components/print/CabecalhoInstituicaoImpressao'
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao'

function labelTipo(tipo: string) {
  if (tipo === 'INTERNACAO') return 'Solicitação de Internação'
  if (tipo === 'EXTERNO') return 'Relatório de Encaminhamento Externo'
  return 'Encaminhamento Interno'
}

function rotuloDestino(tipo: string) {
  if (tipo === 'INTERNACAO') return 'Destino da internação'
  if (tipo === 'EXTERNO') return 'Serviço / instituição de destino'
  return 'Especialidade / setor'
}

export function DocumentoEncaminhamento({ instituicao, encaminhamento }: { instituicao: any; encaminhamento: any }) {
  const a = encaminhamento.prontuario?.atendimento
  const p = a?.paciente
  const t = a?.triagem
  const medico = a?.medico
  const nomePaciente =
    p?.nomeCompleto ??
    nomeCompletoParaExibicao(p?.nomeExibicao ?? '—', p?.nomeCriptografado, p?.nomeCompleto)

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white py-6 print:py-0">
      <div className="max-w-[210mm] mx-auto px-4 print:px-0 print:max-w-none">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <BotaoImprimirFicha />
        </div>

        <article className="bg-white border border-slate-200 shadow-lg print:shadow-none rounded-xl p-5 print:p-0 print:border-0 print:rounded-none print-section">
          <CabecalhoInstituicaoImpressao
            instituicao={instituicao}
            subtitulo="Atendimento Médico — Encaminhamento"
            direita={
              <div className="text-right">
                <p className="text-xs text-slate-600">
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
                    new Date(encaminhamento.createdAt)
                  )}
                </p>
              </div>
            }
          />

          <div className="mb-3">
            <h1 className="text-lg font-bold text-slate-900">{labelTipo(encaminhamento.tipo)}</h1>
            {encaminhamento.tipo === 'EXTERNO' ? (
              <p className="text-xs text-slate-600 mt-1">
                Documento para continuidade do cuidado em outro serviço ou instituição.
              </p>
            ) : null}
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Paciente</p>
              <p className="text-sm font-semibold text-slate-900 mt-1 break-words">{nomePaciente}</p>
              <p className="text-xs text-slate-600 mt-1">
                Atendimento: <span className="font-mono">{a?.numeroAtendimento ?? '—'}</span>
              </p>
              {t?.corClassificacao ? (
                <p className="text-xs text-slate-600 mt-1">Manchester: {String(t.corClassificacao)}</p>
              ) : null}
              {t?.queixaPrincipal ? (
                <p className="text-xs text-slate-600 mt-1 line-clamp-3">
                  Queixa (triagem): {t.queixaPrincipal}
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {rotuloDestino(encaminhamento.tipo)}
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-1 break-words">
                {encaminhamento.especialidade}
              </p>
              <p className="text-xs text-slate-600 mt-1">Prioridade: {encaminhamento.prioridade ?? '—'}</p>
              {encaminhamento.tipo === 'INTERNACAO' ? (
                <p className="text-xs text-slate-600 mt-1">
                  CID: <span className="font-mono">{encaminhamento.cidInternacao ?? '—'}</span> • Leito/apartamento
                  definido pela enfermagem na admissão
                </p>
              ) : null}
              {medico?.nome ? (
                <p className="text-xs text-slate-600 mt-2">
                  Médico solicitante: <strong>{medico.nome}</strong>
                  {medico.crm ? ` — CRM ${medico.crm}` : ''}
                </p>
              ) : null}
            </div>
          </section>

          {encaminhamento.resumoClinco ? (
            <section className="mt-4">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Resumo clínico</p>
              <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-800 whitespace-pre-wrap">
                {encaminhamento.resumoClinco}
              </div>
            </section>
          ) : null}

          {encaminhamento.justificativa ? (
            <section className="mt-4">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {encaminhamento.tipo === 'EXTERNO' ? 'Motivo do encaminhamento' : 'Justificativa'}
              </p>
              <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-800 whitespace-pre-wrap">
                {encaminhamento.justificativa}
              </div>
            </section>
          ) : null}

          {encaminhamento.tipo === 'EXTERNO' ? (
            <section className="mt-4 rounded-lg border border-dashed border-slate-300 p-3 text-[10px] text-slate-600">
              <p>
                O paciente deve comparecer ao serviço indicado portando este relatório e documentos pessoais.
                Retorno ao pronto-socorro de origem somente se houver piora clínica ou orientação médica.
              </p>
            </section>
          ) : null}

          <footer className="mt-5 flex justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-3">
            <span>SGH — {labelTipo(encaminhamento.tipo)}</span>
            <span>
              Impresso em{' '}
              {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}
            </span>
          </footer>
        </article>
      </div>
    </div>
  )
}
