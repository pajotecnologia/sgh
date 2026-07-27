import { BotaoImprimirFicha } from '@/components/recepcao/BotaoImprimirFicha'
import { CabecalhoInstituicaoImpressao } from '@/components/print/CabecalhoInstituicaoImpressao'

const LABEL_TIPO: Record<string, string> = {
  BAIXA_MANUAL: 'Baixa manual',
  DISPENSACAO_PRESCRICAO: 'Dispensação (prescrição)',
}

export function DocumentoSaidaFarmacia({ instituicao, saida }: { instituicao: any; saida: any }) {
  const totalItens = (saida.itens ?? []).length
  const totalQtd = (saida.itens ?? []).reduce((acc: number, x: any) => acc + (x.quantidade ?? 0), 0)
  const atendimento = saida.atendimento?.numeroAtendimento
    ? `${saida.atendimento.numeroAtendimento} (${saida.atendimento.setor ?? '—'} / ${saida.atendimento.sala ?? '—'})`
    : '—'

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white py-6 print:py-0">
      <div className="max-w-[210mm] mx-auto px-4 print:px-0 print:max-w-none">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <BotaoImprimirFicha />
        </div>

        <article className="bg-white border border-slate-200 shadow-lg print:shadow-none rounded-xl p-5 print:p-0 print:border-0 print:rounded-none print-section">
          <CabecalhoInstituicaoImpressao
            instituicao={instituicao}
            subtitulo="Farmácia — Saída de estoque"
            direita={
              <div className="text-right">
                <p className="text-xs text-slate-600">
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
                    new Date(saida.createdAt)
                  )}
                </p>
                {saida.criadoPor?.nome ? <p className="text-xs text-slate-600">Registrado por {saida.criadoPor.nome}</p> : null}
              </div>
            }
          />

          <h1 className="text-lg font-bold text-slate-900">{LABEL_TIPO[saida.tipo] ?? saida.tipo}</h1>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Atendimento</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">{atendimento}</p>
              <p className="text-xs text-slate-600 mt-1">Observações: {saida.observacoes ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Resumo</p>
              <p className="text-xs text-slate-700 mt-1">
                Itens: <span className="font-mono font-bold">{totalItens}</span> • Quantidade total:{' '}
                <span className="font-mono font-bold">{totalQtd}</span>
              </p>
            </div>
          </section>

          <section className="mt-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Itens</p>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-semibold text-slate-600">Medicamento</th>
                    <th className="px-3 py-2 font-semibold text-slate-600">Princípio ativo</th>
                    <th className="px-3 py-2 font-semibold text-slate-600">Qtde</th>
                    <th className="px-3 py-2 font-semibold text-slate-600">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(saida.itens ?? []).map((it: any) => (
                    <tr key={it.id}>
                      <td className="px-3 py-2 font-semibold text-slate-900">{it.medicamento?.nome ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-slate-700">{it.medicamento?.principioAtivo ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-slate-700">{it.quantidade}</td>
                      <td className="px-3 py-2 text-slate-700">{it.motivo ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="mt-5 flex justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-3">
            <span>SGH — Farmácia</span>
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
