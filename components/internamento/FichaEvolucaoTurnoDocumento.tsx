// components/internamento/FichaEvolucaoTurnoDocumento.tsx

import type { FichaEvolucaoTurnoImpressaoDados } from '@/lib/montar-dados-evolucao-turno-impressao'
import { CabecalhoInstituicaoImpressao } from '@/components/print/CabecalhoInstituicaoImpressao'
import { BotaoImprimirFicha } from '@/components/recepcao/BotaoImprimirFicha'

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid grid-cols-[minmax(8rem,30%)_1fr] gap-2 text-sm py-1 border-b border-slate-100">
      <span className="font-medium text-slate-600">{rotulo}</span>
      <span className="text-slate-900 whitespace-pre-wrap">{valor || '—'}</span>
    </div>
  )
}

function TextoBloco({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mb-3 break-inside-avoid">
      <p className="text-xs font-bold uppercase text-slate-700 mb-1">{titulo}</p>
      <p className="text-sm text-slate-900 whitespace-pre-wrap border border-slate-200 rounded p-2 min-h-[2.5rem] bg-slate-50/50">
        {texto || '—'}
      </p>
    </div>
  )
}

export function FichaEvolucaoTurnoDocumento({ dados }: { dados: FichaEvolucaoTurnoImpressaoDados }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 print:p-4 max-w-[210mm] mx-auto">
      <div className="print:hidden mb-4 flex justify-end">
        <BotaoImprimirFicha />
      </div>

      <CabecalhoInstituicaoImpressao
        instituicao={dados.instituicao}
        subtitulo="Ficha de Evolução — Internação"
        direita={
          <div className="text-right text-xs">
            <p className="font-bold text-base">{dados.turno}</p>
            <p className="mt-1">Data: {dados.dataReferencia}</p>
            <p className="font-mono mt-1">{dados.numeroAtendimento}</p>
            <p className="mt-1">Status: {dados.status}</p>
          </div>
        }
      />

      <section className="mb-4">
        <h2 className="text-xs font-bold uppercase border-b border-slate-300 pb-1 mb-2">Identificação</h2>
        <Linha rotulo="Paciente" valor={dados.nomePaciente} />
        <Linha rotulo="Prontuário" valor={dados.numeroProntuario} />
        <Linha rotulo="Setor" valor={dados.setorUnidade} />
        <Linha rotulo="Leito" valor={dados.leitoDescricao} />
      </section>

      <TextoBloco titulo="Estado geral" texto={dados.estadoGeral} />

      {dados.avaliacaoSistemas.length > 0 ? (
        <section className="mb-3 break-inside-avoid">
          <p className="text-xs font-bold uppercase text-slate-700 mb-1">Avaliação de enfermagem</p>
          <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
            {dados.avaliacaoSistemas.map((item) => (
              <Linha key={item.titulo} rotulo={item.titulo} valor={item.texto} />
            ))}
          </div>
        </section>
      ) : null}

      <Linha rotulo="Sinais vitais" valor={dados.sinaisVitais} />
      <TextoBloco titulo="Intervenções de enfermagem" texto={dados.evolucaoClinica} />
      <TextoBloco titulo="Intercorrências" texto={dados.intercorrencias} />

      <section className="mt-6 pt-4 border-t border-slate-300">
        <Linha rotulo="Profissional" valor={dados.nomeProfissional} />
        <Linha rotulo="Função" valor={dados.funcaoProfissional} />
        <Linha rotulo="Conselho" valor={dados.conselhoProfissional} />
        <Linha rotulo="Registrado em" valor={dados.registradoEm} />
      </section>

      <footer className="mt-8 pt-4 border-t border-slate-300">
        <div className="border-t border-slate-400 pt-2 text-center text-xs text-slate-600 max-w-xs mx-auto">
          Assinatura e carimbo do profissional
        </div>
      </footer>
    </div>
  )
}
