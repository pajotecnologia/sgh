import { BotaoImprimirFicha } from '@/components/recepcao/BotaoImprimirFicha'
import { CabecalhoInstituicaoImpressao } from '@/components/print/CabecalhoInstituicaoImpressao'
import { nomeCompletoParaExibicao } from '@/lib/nome-paciente-exibicao'
import { LABEL_VIA } from '@/lib/fila-medicacao'

export function DocumentoReceitaAlta({
  instituicao,
  prescricao,
}: {
  instituicao: object | null
  prescricao: {
    id: string
    numeroPrescricao: number
    emitidaEm: Date | string
    validaAte?: Date | string | null
    observacoes?: string | null
    itens: {
      nomeMedicamento: string
      dose: string
      via: string
      frequencia: string
      duracaoDias?: number | null
      observacoes?: string | null
    }[]
    prontuario: {
      atendimento: {
        numeroAtendimento: string
        paciente: {
          nomeExibicao: string
          nomeCriptografado?: string | null
          nomeCompleto?: string | null
        }
        medico?: { nome: string; crm: string | null } | null
        triagem?: { queixaPrincipal?: string | null } | null
      }
    }
  }
}) {
  const a = prescricao.prontuario.atendimento
  const nomePaciente =
    a.paciente.nomeCompleto ??
    nomeCompletoParaExibicao(a.paciente.nomeExibicao, a.paciente.nomeCriptografado, a.paciente.nomeCompleto)

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white py-6 print:py-0">
      <div className="max-w-[210mm] mx-auto px-4 print:px-0 print:max-w-none">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <BotaoImprimirFicha />
        </div>

        <article className="bg-white border border-slate-200 shadow-lg print:shadow-none rounded-xl p-5 print:p-0 print:border-0 print:rounded-none print-section">
          <CabecalhoInstituicaoImpressao
            instituicao={instituicao}
            subtitulo="Atendimento Médico — Receita de Alta"
            direita={
              <div className="text-right text-xs text-slate-600">
                <p>Receita nº {prescricao.numeroPrescricao}</p>
                <p>
                  Emissão:{' '}
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
                    new Date(prescricao.emitidaEm)
                  )}
                </p>
                {prescricao.validaAte ? (
                  <p>
                    Válida até:{' '}
                    {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(
                      new Date(prescricao.validaAte)
                    )}
                  </p>
                ) : null}
              </div>
            }
          />

          <h1 className="text-lg font-bold text-slate-900 mb-4">Receita médica — alta do pronto-socorro</h1>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-4">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Paciente</p>
              <p className="text-sm font-semibold text-slate-900 mt-1 break-words">{nomePaciente}</p>
              <p className="text-xs text-slate-600 mt-1 font-mono">Atendimento: {a.numeroAtendimento}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Médico</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">{a.medico?.nome ?? '—'}</p>
              {a.medico?.crm ? (
                <p className="text-xs text-slate-600 mt-1">CRM {a.medico.crm}</p>
              ) : null}
            </div>
          </section>

          {prescricao.observacoes?.trim() ? (
            <section className="mb-4">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Orientações gerais
              </p>
              <p className="text-xs text-slate-800 whitespace-pre-wrap border border-slate-200 rounded-lg p-3">
                {prescricao.observacoes}
              </p>
            </section>
          ) : null}

          <section>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Medicamentos prescritos
            </p>
            <table className="w-full text-xs border border-slate-200">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-2 py-1.5 font-semibold">Medicamento</th>
                  <th className="text-left px-2 py-1.5 font-semibold">Posologia</th>
                </tr>
              </thead>
              <tbody>
                {prescricao.itens.map((it, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="px-2 py-2 align-top font-medium">{it.nomeMedicamento}</td>
                    <td className="px-2 py-2 align-top text-slate-700">
                      {it.dose} — {LABEL_VIA[it.via] ?? it.via} — {it.frequencia}
                      {it.duracaoDias ? ` — por ${it.duracaoDias} dia(s)` : ''}
                      {it.observacoes?.trim() ? (
                        <span className="block text-slate-500 mt-0.5">{it.observacoes}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <footer className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex justify-end">
              <div className="text-center min-w-[200px]">
                <div className="border-t border-slate-400 pt-1 mt-12" />
                <p className="text-xs font-semibold text-slate-800">{a.medico?.nome ?? 'Médico responsável'}</p>
                {a.medico?.crm ? <p className="text-[10px] text-slate-600">CRM {a.medico.crm}</p> : null}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-6">
              Documento gerado pelo SGH. Uso conforme orientação médica.
            </p>
          </footer>
        </article>
      </div>
    </div>
  )
}
