// components/internamento/FichaMultidisciplinarDocumento.tsx

import type { FichaMultidisciplinarImpressaoDados } from '@/lib/montar-dados-multidisciplinar-impressao'
import { CabecalhoInstituicaoImpressao } from '@/components/print/CabecalhoInstituicaoImpressao'
import { BotaoImprimirFicha } from '@/components/recepcao/BotaoImprimirFicha'

function BlocoTexto({ titulo, texto }: { titulo: string; texto: string }) {
  if (!texto?.trim()) return null
  return (
    <section className="mb-4 break-inside-avoid">
      <h2 className="text-xs font-bold uppercase border-b border-slate-300 pb-1 mb-2 text-slate-800">
        {titulo}
      </h2>
      <pre className="text-sm text-slate-900 whitespace-pre-wrap font-sans leading-relaxed border border-slate-200 rounded p-2 bg-slate-50/50">
        {texto}
      </pre>
    </section>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid grid-cols-[minmax(8rem,32%)_1fr] gap-2 text-sm py-1 border-b border-slate-100">
      <span className="font-medium text-slate-600">{rotulo}</span>
      <span className="text-slate-900">{valor || '—'}</span>
    </div>
  )
}

export function FichaMultidisciplinarDocumento({ dados }: { dados: FichaMultidisciplinarImpressaoDados }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 print:p-4 max-w-[210mm] mx-auto">
      <div className="print:hidden mb-4 flex justify-end">
        <BotaoImprimirFicha />
      </div>

      <CabecalhoInstituicaoImpressao
        instituicao={dados.instituicao}
        subtitulo="Ficha Multidisciplinar de Internação"
        direita={
          <div className="text-right text-xs">
            <p className="font-bold">Status: {dados.status}</p>
            <p className="font-mono mt-1">{dados.numeroAtendimento}</p>
          </div>
        }
      />

      <section className="mb-4">
        <h2 className="text-xs font-bold uppercase border-b border-slate-300 pb-1 mb-2">Identificação</h2>
        <Linha rotulo="Paciente" valor={dados.nomePaciente} />
        <Linha rotulo="Prontuário" valor={dados.numeroProntuario} />
        <Linha rotulo="Nascimento" valor={dados.dataNascimento} />
        <Linha rotulo="Sexo" valor={dados.sexo} />
        <Linha rotulo="Setor" valor={dados.setorUnidade} />
        <Linha rotulo="Leito" valor={dados.leitoDescricao} />
        <Linha rotulo="Internação desde" valor={dados.dataInternacao} />
        <Linha rotulo="Tempo de internação" valor={dados.diasInternacao} />
        <Linha rotulo="Diagnóstico" valor={dados.diagnosticoPrincipal} />
        <Linha rotulo="CID" valor={dados.cidPrincipal} />
      </section>

      <BlocoTexto titulo="Avaliação médica" texto={dados.textoMedico} />
      <BlocoTexto titulo="Avaliação de enfermagem" texto={dados.textoEnfermagem} />
      <BlocoTexto titulo="Nutrição" texto={dados.textoNutricao} />
      <BlocoTexto titulo="Fisioterapia" texto={dados.textoFisioterapia} />
      <BlocoTexto titulo="Psicologia / Serviço social" texto={dados.textoPsicologia} />
      <BlocoTexto titulo="Farmácia clínica" texto={dados.textoFarmacia} />
      <BlocoTexto titulo="Plano conjunto da equipe" texto={dados.textoPlanoConjunto} />

      <footer className="mt-8 pt-4 border-t border-slate-300 text-xs text-slate-500">
        <p className="text-center">Documento gerado pelo SGH — reunião multidisciplinar de internação</p>
      </footer>
    </div>
  )
}
