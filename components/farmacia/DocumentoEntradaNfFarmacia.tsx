import { BotaoImprimirFicha } from '@/components/recepcao/BotaoImprimirFicha'
import { CabecalhoInstituicaoImpressao } from '@/components/print/CabecalhoInstituicaoImpressao'

export function DocumentoEntradaNfFarmacia({ instituicao, entrada }: { instituicao: any; entrada: any }) {
  const totalItens = (entrada.itens ?? []).length
  const totalQtd = (entrada.itens ?? []).reduce((acc: number, x: any) => acc + (x.quantidade ?? 0), 0)
  const custoTotal = (entrada.itens ?? []).reduce((acc: number, x: any) => {
    const unit = x.custoUnitario ? Number(x.custoUnitario) : 0
    return acc + unit * (x.quantidade ?? 0)
  }, 0)

  const TIPO_LABEL: Record<string, string> = {
    ENTRADA_NF: 'Nota Fiscal (NF-e)',
    ENTRADA_SEM_NOTA: 'Entrada sem Nota (Avulsa)',
    EMPRESTIMO_ENTRADA: 'Empréstimo Recebido',
    DEVOLUCAO_PACIENTE: 'Devolução de Paciente',
    OUTRAS_ENTRADAS: 'Outras Entradas',
  }

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white py-6 print:py-0">
      <div className="max-w-[210mm] mx-auto px-4 print:px-0 print:max-w-none">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <BotaoImprimirFicha />
        </div>

        <article className="bg-white border border-slate-200 shadow-lg print:shadow-none rounded-xl p-5 print:p-0 print:border-0 print:rounded-none print-section">
          <CabecalhoInstituicaoImpressao
            instituicao={instituicao}
            subtitulo={`Farmácia — Entrada de Estoque (${TIPO_LABEL[entrada.tipo] ?? 'NF-e'})`}
            direita={
              <div className="text-right">
                <p className="text-xs text-slate-600">
                  Recebida em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(entrada.recebidaEm))}
                </p>
                {entrada.criadoPor?.nome ? (
                  <p className="text-xs text-slate-600">Registrado por {entrada.criadoPor.nome}</p>
                ) : null}
              </div>
            }
          />

          <h1 className="text-lg font-bold text-slate-900 mb-3">
            {entrada.numeroNota !== 'SEM-NF' ? `NF ${entrada.numeroNota}` : 'Comprovante de Entrada de Estoque'}
            {entrada.serie ? ` • Série ${entrada.serie}` : ''}
          </h1>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fornecedor / Origem</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">{entrada.fornecedorNome ?? '—'}</p>
              <p className="text-xs text-slate-600 mt-1">CNPJ: {entrada.fornecedorCnpj ?? 'Não informado'}</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Totais da Entrada</p>
              <p className="text-xs text-slate-700 mt-1">
                Itens: <span className="font-mono font-bold">{totalItens}</span> • Total creditado:{' '}
                <span className="font-mono font-bold text-green-700">+{totalQtd} un</span>
              </p>

              {custoTotal > 0 ? (
                <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                  Valor Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotal)}
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Identificação / Obs</p>
              {entrada.chaveNfe ? (
                <p className="text-[10px] font-mono text-slate-600 truncate mt-1">Chave: {entrada.chaveNfe}</p>
              ) : null}
              <p className="text-xs text-slate-600 mt-1">Obs: {entrada.observacoes ?? 'Sem observações.'}</p>
            </div>
          </section>

          <section className="mt-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Detalhamento dos Itens Creditados no Estoque
            </p>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-slate-700">
                    <th className="px-3 py-2 font-semibold">Medicamento / Princípio Ativo</th>
                    <th className="px-3 py-2 font-semibold text-center">Qtde Entrada</th>
                    <th className="px-3 py-2 font-semibold">Lote</th>
                    <th className="px-3 py-2 font-semibold">Validade</th>
                    <th className="px-3 py-2 font-semibold text-right">Custo Unit.</th>
                    <th className="px-3 py-2 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(entrada.itens ?? []).map((it: any) => {
                    const unit = it.custoUnitario ? Number(it.custoUnitario) : 0
                    const subtotal = unit * (it.quantidade ?? 0)
                    return (
                      <tr key={it.id}>
                        <td className="px-3 py-2">
                          <span className="font-semibold text-slate-900">{it.medicamento?.nome ?? '—'}</span>
                          <span className="text-slate-500 text-[11px] block">{it.medicamento?.principioAtivo}</span>
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-green-700">
                          +{it.quantidade}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-800">{it.lote ?? 'SEM-LOTE'}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {it.validade ? new Intl.DateTimeFormat('pt-BR').format(new Date(it.validade)) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                          {unit > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unit) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                          {subtotal > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="mt-5 flex justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-3">
            <span>SGH — Sistema de Gestão Hospitalar</span>
            <span>Impresso em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}</span>
          </footer>
        </article>
      </div>
    </div>
  )
}
