// components/internamento/LaudoSolicitacaoDocumento.tsx
'use client'

import { BotaoImprimirFicha } from '@/components/recepcao/BotaoImprimirFicha'
import type { LaudoSolicitacaoPrefill } from '@/lib/laudo-solicitacao'

function CheckBoxItem({ marcado, label }: { marcado: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="h-5 w-5 border-2 border-black flex items-center justify-center text-xs font-black shrink-0 bg-white">
        {marcado ? 'X' : ''}
      </div>
      <span className="text-xs sm:text-sm font-semibold text-black uppercase tracking-tight">
        {label}
      </span>
    </div>
  )
}

function formatarData(dataStr?: string | null): string {
  if (!dataStr) return '___/___/______'
  const partes = dataStr.split('T')[0].split('-')
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }
  return dataStr
}

export function LaudoSolicitacaoDocumento({
  dados,
  instituicao,
}: {
  dados?: Partial<LaudoSolicitacaoPrefill> | null
  instituicao?: {
    nomeInstituicao?: string | null
    cnes?: string | null
    cnpj?: string | null
    endereco?: string | null
    logomarcaUrl?: string | null
  } | null
}) {
  const d = dados ?? ({} as Partial<LaudoSolicitacaoPrefill>)
  const inst = instituicao ?? {}

  return (
    <div className="min-h-screen bg-white text-black p-4 sm:p-8 print:p-0 max-w-[210mm] mx-auto font-sans leading-tight">
      {/* BOTÃO NÃO IMPRESSO */}
      <div className="print:hidden mb-4 flex justify-end gap-2">
        <BotaoImprimirFicha />
      </div>

      <div className="border border-black p-4 sm:p-6 space-y-4 print:border-none print:p-2">
        {/* 1. CABEÇALHO INSTITUCIONAL */}
        <header className="flex items-center justify-between gap-4 border-b-2 border-black pb-3">
          <div className="flex items-center gap-3">
            {inst.logomarcaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={inst.logomarcaUrl}
                alt="Logo"
                className="h-16 w-auto object-contain max-w-[140px]"
              />
            ) : (
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600">
                  Prefeitura Municipal
                </p>
                <h2 className="text-sm font-black uppercase tracking-wider text-black">
                  Secretaria Municipal de Saúde
                </h2>
              </div>
            )}
          </div>

          <div className="text-right">
            <h1 className="text-sm font-black uppercase tracking-wider text-black">
              SECRETARIA MUNICIPAL DE SAÚDE
            </h1>
            <h2 className="text-xs font-bold uppercase text-slate-800">
              {inst.nomeInstituicao || 'Hospital Municipal Quiteria Alves Vilela'}
            </h2>
          </div>
        </header>

        {/* 2. TÍTULO PRINCIPAL */}
        <div className="text-center py-1.5 border-2 border-black bg-slate-100 font-black text-sm uppercase tracking-wider">
          LAUDO MÉDICO PARA SOLICITAÇÃO:
        </div>

        {/* 3. QUADRO DE OPÇÕES DE SOLICITAÇÃO (MEIO) */}
        <div className="border-2 border-black p-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <CheckBoxItem marcado={Boolean(d.mudancaProcedimento)} label="Mudança de Procedimento" />
              <CheckBoxItem marcado={Boolean(d.diariaUti)} label="Diário de UTI" />
              <CheckBoxItem marcado={Boolean(d.diariaAcompanhante)} label="Diária de Acompanhante" />
              <CheckBoxItem marcado={Boolean(d.vacinaAntiRh)} label="Vacina Anti Rh" />
            </div>
            <div>
              <CheckBoxItem marcado={Boolean(d.usoProteseOtica)} label="Uso de Prótese Ótica" />
              <CheckBoxItem marcado={Boolean(d.usoFatoresCoagulacao)} label="Uso de Fatores de Coagulação" />
              <CheckBoxItem marcado={Boolean(d.usoOrdenadores)} label="Uso de ordenadores" />
              <CheckBoxItem marcado={Boolean(d.nutricaoParenteral)} label="Nutrição Parenteral" />
            </div>
          </div>
        </div>

        {/* 4. QUADRO DE IDENTIFICAÇÃO (HOSPITAL, PACIENTE, PROCEDIMENTOS, MÉDICO) */}
        <div className="border-2 border-black p-3 space-y-2.5 text-xs sm:text-sm font-medium">
          <div className="grid grid-cols-[1fr_auto] gap-4 items-baseline">
            <div>
              <span className="font-bold">Hospital:</span>{' '}
              <span className="border-b border-black inline-block min-w-[200px] font-semibold">
                {d.nomeHospital || inst.nomeInstituicao || 'Hospital Municipal'}
              </span>
            </div>
            <div>
              <span className="font-bold">CNPJ:</span>{' '}
              <span className="border-b border-black inline-block min-w-[140px] font-mono">
                {d.cnpjHospital || inst.cnpj || '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-4 items-baseline">
            <div>
              <span className="font-bold">Paciente:</span>{' '}
              <span className="border-b border-black inline-block min-w-[240px] font-bold uppercase">
                {d.nomePaciente || '—'}
              </span>
            </div>
            <div>
              <span className="font-bold">Nº AIH:</span>{' '}
              <span className="border-b border-black inline-block min-w-[120px] font-mono">
                {d.numeroAih || d.numeroAtendimento || '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-baseline">
            <div>
              <span className="font-bold">Procedimento Anterior:</span>{' '}
              <span className="border-b border-black inline-block min-w-[150px]">
                {d.procedimentoAnterior || '—'}
              </span>
            </div>
            <div>
              <span className="font-bold">Procedimento Solicitado:</span>{' '}
              <span className="border-b border-black inline-block min-w-[150px]">
                {d.procedimentoSolicitado || '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-baseline">
            <div>
              <span className="font-bold">Médico Solicitante:</span>{' '}
              <span className="border-b border-black inline-block min-w-[180px] font-bold uppercase">
                {d.nomeMedicoSolicitante || '—'}
              </span>
            </div>
            <div>
              <span className="font-bold">CRM:</span>{' '}
              <span className="border-b border-black inline-block min-w-[70px] font-mono">
                {d.crmMedicoSolicitante || '—'}
              </span>
            </div>
            <div>
              <span className="font-bold">CPF:</span>{' '}
              <span className="border-b border-black inline-block min-w-[100px] font-mono">
                {d.cpfMedicoSolicitante || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 5. JUSTIFICATIVA MÉDICA ABERTA */}
        <div className="border-2 border-black p-4 space-y-3">
          <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider">
            JUSTIFICATIVA:
          </h3>

          <div className="min-h-[140px] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {d.justificativa || (
              <span className="text-slate-400 italic">
                Declaro para os devidos fins que estive acompanhando o paciente acima identificando, durante a sua internação neste hospital. Aprovo a cobrança do acompanhante junto ao HMAD.
              </span>
            )}
          </div>

          {/* LINHAS DE ASSINATURA DA JUSTIFICATIVA */}
          <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-end pt-8 text-center text-xs font-bold">
            <div className="text-left whitespace-nowrap">
              <span>Data: </span>
              <span className="font-mono border-b border-black px-2 pb-0.5">
                {formatarData(d.dataSolicitacao)}
              </span>
            </div>

            <div className="space-y-1">
              <div className="border-t border-black pt-1">
                <p className="text-[11px] uppercase">Ass. Acompanhante</p>
                {d.nomeAcompanhante && (
                  <p className="text-[10px] font-normal text-slate-700">({d.nomeAcompanhante})</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="border-t border-black pt-1">
                <p className="text-[11px] uppercase">Ass. do Médico Solicitante</p>
                <p className="text-[10px] font-normal text-slate-700">
                  {d.nomeMedicoSolicitante ? `${d.nomeMedicoSolicitante} • CRM ${d.crmMedicoSolicitante || ''}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 6. AUDITOR */}
        <div className="border-2 border-black p-4 space-y-4">
          <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider">
            AUDITOR
          </h3>

          {d.parecerAuditor && (
            <p className="text-xs text-slate-800 leading-relaxed">
              <span className="font-bold">Parecer:</span> {d.parecerAuditor}
            </p>
          )}

          <div className="grid grid-cols-[auto_1fr] gap-8 items-end pt-4 text-xs font-bold">
            <div className="text-left whitespace-nowrap">
              <span>Data: </span>
              <span className="font-mono border-b border-black px-2 pb-0.5">
                {formatarData(d.dataAuditoria)}
              </span>
            </div>

            <div className="text-center space-y-1">
              <div className="border-t border-black pt-1 max-w-sm mx-auto">
                <p className="text-[11px] uppercase">Assinatura CRM</p>
                {d.nomeAuditor && (
                  <p className="text-[10px] font-normal text-slate-700">
                    {d.nomeAuditor} {d.crmAuditor ? `• CRM ${d.crmAuditor}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
