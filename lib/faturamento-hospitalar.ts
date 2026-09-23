export interface ItemFaturamentoTuss {
  codigoTuss: string
  descricao: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  grauParticipacao?: string // Cirurgião, 1º Auxiliar, Anestesista
}

export interface GuiaTissInternacao {
  numeroGuiaPrestador: string
  registroAns: string
  numeroCarteiraBeneficiario: string
  nomeBeneficiario: string
  dataAutorizacao: string
  tipoInternacao: 'CLINICA' | 'CIRURGICA' | 'OBSTETRICA' | 'PEDIATRICA'
  caraterAtendimento: 'ELETIVA' | 'URGENCIA_EMERGENCIA'
  regimeInternacao: 'HOSPITALAR' | 'HOSPITAL_DIA'
  cidPrincipal: string
  dataHoraInternacao: string
  dataHoraAlta?: string | null
  motivoEncerramento?: 'ALTA_CURADA' | 'ALTA_MELHORADA' | 'TRANSFERENCIA' | 'OBITO' | null
  itens: ItemFaturamentoTuss[]
  valorTotalGeral: number
}

export interface EspelhoAihSus {
  numeroAih: string
  cnesHospital: string
  cnsPaciente: string
  nomePaciente: string
  dataInternacao: string
  dataAlta?: string | null
  procedimentoPrincipalCodigo: string
  procedimentoPrincipalDescricao: string
  cidPrincipal: string
  cidSecundario?: string | null
  diariasUti: number
  diariasEnfermaria: number
  valorTotalSus: number
}

export function gerarXmlTissGuiaInternacao(guia: GuiaTissInternacao): string {
  const itensXml = guia.itens
    .map(
      (it) => `
        <ans:itemProcedimento>
          <ans:codigoProcedimento>${it.codigoTuss}</ans:codigoProcedimento>
          <ans:descricao>${it.descricao}</ans:descricao>
          <ans:quantidadeExecutada>${it.quantidade}</ans:quantidadeExecutada>
          <ans:valorUnitario>${it.valorUnitario.toFixed(2)}</ans:valorUnitario>
          <ans:valorTotal>${it.valorTotal.toFixed(2)}</ans:valorTotal>
        </ans:itemProcedimento>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
      <ans:numeroLote>${guia.numeroGuiaPrestador}</ans:numeroLote>
      <ans:dataRegistroTransacao>${guia.dataAutorizacao.split('T')[0]}</ans:dataRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem>
      <ans:registroANS>${guia.registroAns}</ans:registroANS>
    </ans:origem>
  </ans:cabecalho>
  <ans:corpoMensagem>
    <ans:guiaResumoInternacao>
      <ans:dadosBeneficiario>
        <ans:numeroCarteira>${guia.numeroCarteiraBeneficiario}</ans:numeroCarteira>
        <ans:nomeBeneficiario>${guia.nomeBeneficiario}</ans:nomeBeneficiario>
      </ans:dadosBeneficiario>
      <ans:dadosInternacao>
        <ans:caraterAtendimento>${guia.caraterAtendimento}</ans:caraterAtendimento>
        <ans:tipoInternacao>${guia.tipoInternacao}</ans:tipoInternacao>
        <ans:diagnosticoPrincipal>${guia.cidPrincipal}</ans:diagnosticoPrincipal>
        <ans:dataHoraInternacao>${guia.dataHoraInternacao}</ans:dataHoraInternacao>
      </ans:dadosInternacao>
      <ans:procedimentosExecutados>
        ${itensXml}
      </ans:procedimentosExecutados>
      <ans:valorTotalGuia>${guia.valorTotalGeral.toFixed(2)}</ans:valorTotalGuia>
    </ans:guiaResumoInternacao>
  </ans:corpoMensagem>
</ans:mensagemTISS>`.trim()
}
