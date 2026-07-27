type InstituicaoImpressao = {
  nomeInstituicao?: string | null
  nomeMunicipio?: string | null
  endereco?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  cnes?: string | null
  codigoIbgeMunicipio?: string | null
  logomarcaUrl?: string | null
} | null

function fmtEndereco(i: Exclude<InstituicaoImpressao, null>) {
  const cidadeUf = [i.cidade, i.estado].filter(Boolean).join('/') || null
  return [i.endereco, i.bairro, cidadeUf, i.cep ? `CEP ${i.cep}` : null].filter(Boolean).join(' — ')
}

export function CabecalhoInstituicaoImpressao({
  instituicao,
  subtitulo,
  direita,
}: {
  instituicao: InstituicaoImpressao
  subtitulo?: string
  direita?: React.ReactNode
}) {
  const nome = instituicao?.nomeInstituicao?.trim() || 'Instituição não configurada'
  const municipio = instituicao?.nomeMunicipio?.trim() || 'Município não configurado'
  const endereco = instituicao ? fmtEndereco(instituicao) : ''
  const cnes = instituicao?.cnes?.replace(/\D/g, '').slice(0, 7) || null
  const ibge = instituicao?.codigoIbgeMunicipio?.replace(/\D/g, '').slice(0, 7) || null

  return (
    <header className="border-b border-slate-200 pb-3 mb-4 print:mb-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          {instituicao?.logomarcaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={instituicao.logomarcaUrl}
              alt=""
              className="w-14 h-14 object-contain border border-slate-200 rounded bg-white"
            />
          ) : (
            <div className="w-14 h-14 border border-slate-200 rounded bg-slate-50 text-[9px] text-slate-500 flex items-center justify-center text-center px-1">
              Sem logomarca
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight">{nome}</p>
          <p className="text-xs font-semibold text-slate-700 leading-tight mt-0.5">{municipio}</p>
          {subtitulo ? <p className="text-xs text-slate-600 mt-1">{subtitulo}</p> : null}
          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
            {endereco || 'Endereço não cadastrado em Configurações.'}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {cnes ? <span>CNES: <span className="font-mono">{cnes}</span></span> : null}
            {cnes && ibge ? <span className="mx-2">•</span> : null}
            {ibge ? <span>IBGE: <span className="font-mono">{ibge}</span></span> : null}
          </p>
        </div>

        {direita ? <div className="shrink-0">{direita}</div> : null}
      </div>
    </header>
  )
}
