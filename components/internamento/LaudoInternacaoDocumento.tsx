// components/internamento/LaudoInternacaoDocumento.tsx
// Impressão — Laudo SUS para solicitação de autorização de internação hospitalar

import type { ReactNode } from 'react'
import type { LaudoInternacaoImpressaoDados } from '@/lib/montar-dados-laudo-impressao'
import { BotaoImprimirFicha } from '@/components/recepcao/BotaoImprimirFicha'

function CaixasDigitos({ valor, quantidade }: { valor: string; quantidade: number }) {
  const digitos = valor.replace(/\D/g, '').padEnd(quantidade, ' ').slice(0, quantidade).split('')
  return (
    <span className="inline-flex gap-px flex-wrap">
      {digitos.map((d, i) => (
        <span
          key={i}
          className="inline-flex items-center justify-center w-[0.85rem] h-[1rem] border border-black text-[8px] font-mono leading-none bg-white"
        >
          {d.trim() || '\u00A0'}
        </span>
      ))}
    </span>
  )
}

function Campo({
  numero,
  titulo,
  children,
  className = '',
}: {
  numero?: string
  titulo: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`border border-black bg-white ${className}`}>
      <div className="text-[7px] font-bold uppercase leading-tight px-0.5 pt-0.5 border-b border-black">
        {numero ? <span className="mr-1">{numero}</span> : null}
        {titulo}
      </div>
      <div className="px-1 py-0.5 text-[9px] leading-snug min-h-[1.1rem]">{children}</div>
    </div>
  )
}

function AreaTexto({ numero, titulo, texto, linhas = 3 }: { numero: string; titulo: string; texto: string; linhas?: number }) {
  const linhasTexto = texto.trim() ? texto.trim().split('\n') : []
  const vazias = Math.max(0, linhas - linhasTexto.length)
  return (
    <div className="border border-black bg-white">
      <div className="text-[7px] font-bold uppercase leading-tight px-0.5 py-0.5 border-b border-black">
        <span className="mr-1">{numero}</span>
        {titulo}
      </div>
      <div className="px-1 py-0.5 text-[8px] leading-snug min-h-[2.5rem] whitespace-pre-wrap">
        {linhasTexto.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
        {Array.from({ length: vazias }).map((_, i) => (
          <div key={`e-${i}`} className="h-[1rem] border-b border-black/20 last:border-0" />
        ))}
      </div>
    </div>
  )
}

function Check({ marcado, label }: { marcado: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[8px] mr-2">
      <span className="inline-flex w-3 h-3 border border-black items-center justify-center text-[7px] font-bold leading-none">
        {marcado ? 'X' : ''}
      </span>
      {label}
    </span>
  )
}

const ROTULOS_VINCULO_PREVIDENCIA: Record<string, string> = {
  EMPREGADO: 'Empregado',
  EMPREGADOR: 'Empregador',
  AUTONOMO: 'Autônomo',
  DESEMPREGADO: 'Desempregado',
  APOSENTADO: 'Aposentado',
  NAO_SEGURADO: 'Não segurado',
}

export function LaudoInternacaoDocumento({ dados }: { dados: LaudoInternacaoImpressaoDados }) {
  const ce = dados.causasExternas
  const aut = dados.autorizacao
  const masc = dados.sexoCodigo === '1'
  const fem = dados.sexoCodigo === '3'

  return (
    <div className="laudo-internacao-print min-h-screen bg-slate-100 print:bg-white py-6 print:py-0">
      <div className="max-w-[210mm] mx-auto px-4 print:px-0 print:max-w-none">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <BotaoImprimirFicha />
        </div>

        <article
          className="bg-white text-black border border-black p-2 print:p-1.5 shadow-lg print:shadow-none"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {/* Cabeçalho */}
          <header className="border border-black mb-1">
            <div className="flex items-stretch border-b border-black">
              <div className="w-16 shrink-0 border-r border-black flex items-center justify-center text-[7px] font-bold p-1 text-center">
                SUS
              </div>
              <div className="flex-1 flex flex-col items-center justify-center py-1 px-2 text-center">
                <p className="text-[8px] font-bold leading-tight">MINISTÉRIO DA SAÚDE</p>
                <p className="text-[7px] leading-tight">{dados.instituicao.nomeMunicipio}</p>
                {dados.instituicao.logomarcaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dados.instituicao.logomarcaUrl}
                    alt=""
                    className="h-6 object-contain my-0.5"
                  />
                ) : null}
              </div>
              <div className="w-16 shrink-0 border-l border-black flex items-center justify-center text-[6px] p-1 text-center">
                {dados.instituicao.nomeInstituicao.slice(0, 40)}
              </div>
            </div>
            <h1 className="text-[9px] font-bold text-center py-1 uppercase tracking-tight">
              Laudo para Solicitação de Autorização de Internação Hospitalar
            </h1>
          </header>

          <p className="text-[7px] font-bold uppercase mb-0.5 mt-1">Identificação do estabelecimento de saúde</p>
          <div className="grid grid-cols-1 gap-px bg-black border border-black">
            <div className="grid grid-cols-2 gap-px bg-black">
              <Campo titulo="Nome do estabelecimento solicitante">
                {dados.nomeEstabelecimentoSolicitante || '\u00A0'}
              </Campo>
              <Campo titulo="CNES solicitante">
                <CaixasDigitos valor={dados.cnesSolicitante} quantidade={7} />
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-px bg-black">
              <Campo titulo="Nome do estabelecimento executante">
                {dados.nomeEstabelecimentoExecutante || '\u00A0'}
              </Campo>
              <Campo titulo="CNES executante">
                <CaixasDigitos valor={dados.cnesExecutante} quantidade={7} />
              </Campo>
            </div>
          </div>

          <p className="text-[7px] font-bold uppercase mb-0.5 mt-1.5">Identificação do paciente</p>
          <div className="grid grid-cols-3 gap-px bg-black border border-black">
            <div className="col-span-3">
              <Campo titulo="Nome do paciente">{dados.nomePaciente || '\u00A0'}</Campo>
            </div>
            <Campo titulo="Nº do prontuário">
              <span className="font-mono">{dados.numeroProntuario || '\u00A0'}</span>
            </Campo>
            <Campo titulo="Cartão Nacional de Saúde (CNS)">
              <CaixasDigitos valor={dados.cns} quantidade={15} />
            </Campo>
            <Campo titulo="Data de nascimento">{dados.dataNascimento || '\u00A0'}</Campo>
            <Campo titulo="Sexo">
              <Check marcado={masc} label="Masc. 1" />
              <Check marcado={fem} label="Fem. 3" />
            </Campo>
            <Campo titulo="Telefone (DDD + número)" className="col-span-2">
              <span className="font-mono">
                {dados.telefoneDdd ? `(${dados.telefoneDdd}) ` : ''}
                {dados.telefoneNumero || '\u00A0'}
              </span>
            </Campo>
            <div className="col-span-3">
              <Campo titulo="Nome da mãe ou responsável">{dados.nomeMae || '\u00A0'}</Campo>
            </div>
            <div className="col-span-3">
              <Campo titulo="Endereço (rua, nº, bairro)">{dados.enderecoCompleto || '\u00A0'}</Campo>
            </div>
            <Campo titulo="Município de residência">{dados.municipioResidencia || '\u00A0'}</Campo>
            <Campo titulo="Cód. IBGE município">
              <CaixasDigitos valor={dados.codigoIbgeMunicipio} quantidade={7} />
            </Campo>
            <Campo titulo="UF">
              <span className="font-mono uppercase">{dados.uf || '\u00A0'}</span>
            </Campo>
            <Campo titulo="CEP">
              <CaixasDigitos valor={dados.cep} quantidade={8} />
            </Campo>
          </div>

          <p className="text-[7px] font-bold uppercase mb-0.5 mt-1.5">Justificativa da internação</p>
          <div className="grid grid-cols-1 gap-px bg-black border border-black">
            <AreaTexto numero="17" titulo="Principais sinais e sintomas clínicos" texto={dados.sinaisSintomas} linhas={4} />
            <AreaTexto numero="18" titulo="Condições que justificam a internação" texto={dados.condicoesJustificativa} linhas={4} />
            <AreaTexto
              numero="19"
              titulo="Principais resultados de provas diagnósticas (exames realizados)"
              texto={dados.resultadosDiagnosticos}
              linhas={3}
            />
            <Campo numero="20" titulo="Diagnóstico inicial">
              {dados.diagnosticoInicial || '\u00A0'}
            </Campo>
            <div className="grid grid-cols-3 gap-px bg-black">
              <Campo numero="21" titulo="CID 10 principal">
                <span className="font-mono uppercase">{dados.cidPrincipal || '\u00A0'}</span>
              </Campo>
              <Campo numero="22" titulo="CID 10 secundário">
                <span className="font-mono uppercase">{dados.cidSecundario || '\u00A0'}</span>
              </Campo>
              <Campo numero="23" titulo="CID 10 causas associadas">
                <span className="font-mono uppercase">{dados.cidAssociadas || '\u00A0'}</span>
              </Campo>
            </div>
          </div>

          <p className="text-[7px] font-bold uppercase mb-0.5 mt-1.5">Procedimento solicitado</p>
          <div className="grid grid-cols-1 gap-px bg-black border border-black">
            <div className="grid grid-cols-2 gap-px bg-black">
              <Campo titulo="Código do procedimento">
                <span className="font-mono">{dados.codigoProcedimento || '\u00A0'}</span>
              </Campo>
              <Campo titulo="Descrição do procedimento">
                {dados.descricaoProcedimento || '\u00A0'}
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-px bg-black">
              <Campo titulo="Clínica">{dados.clinica || '\u00A0'}</Campo>
              <Campo titulo="Caráter da internação">{dados.caraterInternacao || '\u00A0'}</Campo>
            </div>
            <div className="grid grid-cols-2 gap-px bg-black">
              <Campo titulo="Documento do profissional (CNS ou CPF)">
                <Check marcado={dados.documentoProfissionalTipo === 'CNS'} label="CNS" />
                <Check marcado={dados.documentoProfissionalTipo === 'CPF'} label="CPF" />
              </Campo>
              <Campo titulo="Nº do documento">
                <span className="font-mono">{dados.documentoProfissionalNumero || '\u00A0'}</span>
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-px bg-black">
              <Campo titulo="Nome do profissional solicitante">
                {dados.nomeProfissionalSolicitante || '\u00A0'}
              </Campo>
              <Campo titulo="Data da solicitação">{dados.dataSolicitacao || '\u00A0'}</Campo>
            </div>
          </div>

          <p className="text-[7px] font-bold uppercase mb-0.5 mt-1.5">
            Preencher em caso de causas externas (acidentes ou violências)
          </p>
          <div className="grid grid-cols-1 gap-px bg-black border border-black">
            <div className="border border-black bg-white p-1 text-[8px] flex flex-wrap gap-x-3 gap-y-1">
              <Check marcado={Boolean(ce.acidenteTransito)} label="Acidente de trânsito" />
              <Check marcado={Boolean(ce.acidenteTrabalhoTipico)} label="Acidente trabalho típico" />
              <Check marcado={Boolean(ce.acidenteTrabalhoTrajeto)} label="Acidente trabalho trajeto" />
            </div>
            <div className="grid grid-cols-3 gap-px bg-black">
              <Campo titulo="CNPJ da seguradora">
                <CaixasDigitos valor={String(ce.cnpjSeguradora ?? '')} quantidade={14} />
              </Campo>
              <Campo titulo="Nº do bilhete">
                <span className="font-mono">{String(ce.numeroBilhete ?? '') || '\u00A0'}</span>
              </Campo>
              <Campo titulo="Série">
                <span className="font-mono">{String(ce.serieBilhete ?? '') || '\u00A0'}</span>
              </Campo>
            </div>
            <div className="grid grid-cols-3 gap-px bg-black">
              <Campo titulo="CNPJ da empresa">
                <CaixasDigitos valor={String(ce.cnpjEmpresa ?? '')} quantidade={14} />
              </Campo>
              <Campo titulo="CNAE da empresa">
                <span className="font-mono">{String(ce.cnaeEmpresa ?? '') || '\u00A0'}</span>
              </Campo>
              <Campo titulo="CBOR">
                <span className="font-mono">{String(ce.cbor ?? '') || '\u00A0'}</span>
              </Campo>
            </div>
            <Campo titulo="Vínculo com a previdência">
              <span className="flex flex-wrap gap-x-2 gap-y-0.5">
                {Object.entries(ROTULOS_VINCULO_PREVIDENCIA).map(([chave, rotulo]) => (
                  <Check
                    key={chave}
                    marcado={String(ce.vinculoPrevidencia ?? '') === chave}
                    label={rotulo}
                  />
                ))}
              </span>
            </Campo>
          </div>

          <p className="text-[7px] font-bold uppercase mb-0.5 mt-1.5">Autorização</p>
          <div className="grid grid-cols-1 gap-px bg-black border border-black">
            <Campo titulo="Nome do profissional autorizador">
              {String(aut.nomeProfissionalAutorizador ?? '') || '\u00A0'}
            </Campo>
            <div className="grid grid-cols-3 gap-px bg-black">
              <Campo titulo="Cod. órgão emissor">
                <span className="font-mono">{String(aut.codOrgaoEmissor ?? '') || '\u00A0'}</span>
              </Campo>
              <Campo titulo="Documento do profissional (CNS ou CPF)">
                <Check marcado={String(aut.documentoTipo ?? '') === 'CNS'} label="CNS" />
                <Check marcado={String(aut.documentoTipo ?? '') === 'CPF'} label="CPF" />
              </Campo>
              <Campo titulo="Nº do documento">
                <span className="font-mono">{String(aut.documentoNumero ?? '') || '\u00A0'}</span>
              </Campo>
            </div>
            <Campo titulo="Nº da autorização de internação hospitalar (AIH)">
              <span className="font-mono">{String(aut.numeroAutorizacao ?? '') || '\u00A0'}</span>
            </Campo>
            <div className="grid grid-cols-2 gap-px bg-black">
              <Campo titulo="Data da autorização">
                {dados.dataAutorizacaoFmt || '\u00A0'}
              </Campo>
              <Campo titulo="Carimbo e assinatura (registro do conselho)">
                <span className="font-mono">{String(aut.registroConselho ?? '') || '\u00A0'}</span>
              </Campo>
            </div>
          </div>

          <p className="text-[7px] font-bold uppercase mb-0.5 mt-1.5">Internação</p>
          <div className="grid grid-cols-1 gap-px bg-black border border-black">
            <div className="grid grid-cols-2 gap-px bg-black">
              <Campo titulo="Data da admissão">{dados.dataAdmissaoFmt || '\u00A0'}</Campo>
              <Campo titulo="Data da alta (em aberto)">{dados.dataAltaFmt || '\u00A0'}</Campo>
            </div>
            <Campo titulo="Enfermaria e leito">{dados.enfermariaLeito || '\u00A0'}</Campo>
          </div>

          <footer className="mt-2 flex justify-between text-[7px] text-muted-foreground print:text-black border-t border-black/30 pt-1">
            <span>SGH — Sistema de Gestão Hospitalar</span>
            <span>Impresso em {new Date().toLocaleString('pt-BR')}</span>
          </footer>
        </article>
      </div>
    </div>
  )
}
