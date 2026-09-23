export type StatusParametroExame = 'NORMAL' | 'ABAIXO' | 'ACIMA' | 'CRITICO'

export interface ParametroExame {
  nome: string
  valor: string
  valorNumerico?: number | null
  unidade: string
  referenciaTexto?: string | null
  referenciaMin?: number | null
  referenciaMax?: number | null
  status: StatusParametroExame
  observacao?: string | null
}

export interface ResultadoExameEstruturado {
  textoLaudo?: string | null
  parametros?: ParametroExame[]
  metodo?: string | null
  responsavelTecnico?: string | null
  liberadoEm?: string | null
  temParametroCritico?: boolean
}

export function determinarStatusParametro(
  valorNum: number | null | undefined,
  min?: number | null,
  max?: number | null
): StatusParametroExame {
  if (valorNum === null || valorNum === undefined || Number.isNaN(valorNum)) {
    return 'NORMAL'
  }

  if (min !== null && min !== undefined && valorNum < min) {
    // Se estiver 30% abaixo do mínimo, considerar crítico
    if (min > 0 && valorNum < min * 0.7) {
      return 'CRITICO'
    }
    return 'ABAIXO'
  }

  if (max !== null && max !== undefined && valorNum > max) {
    // Se estiver 50% acima do máximo, considerar crítico
    if (max > 0 && valorNum > max * 1.5) {
      return 'CRITICO'
    }
    return 'ACIMA'
  }

  return 'NORMAL'
}

export function parseResultadoExame(raw: string | null | undefined): ResultadoExameEstruturado {
  if (!raw || !raw.trim()) {
    return { textoLaudo: null, parametros: [] }
  }

  const texto = raw.trim()

  // Se o conteúdo for um JSON estruturado:
  if (texto.startsWith('{') && texto.endsWith('}')) {
    try {
      const parsed = JSON.parse(texto)
      if (parsed && typeof parsed === 'object') {
        const parametros: ParametroExame[] = Array.isArray(parsed.parametros)
          ? parsed.parametros.map((p: any) => {
              const valorNum =
                typeof p.valorNumerico === 'number'
                  ? p.valorNumerico
                  : parseFloat(String(p.valor).replace(',', '.'))

              const status =
                p.status ||
                determinarStatusParametro(
                  !Number.isNaN(valorNum) ? valorNum : null,
                  p.referenciaMin,
                  p.referenciaMax
                )

              return {
                nome: p.nome || 'Parâmetro',
                valor: String(p.valor ?? ''),
                valorNumerico: !Number.isNaN(valorNum) ? valorNum : null,
                unidade: p.unidade || '',
                referenciaTexto: p.referenciaTexto || (p.referenciaMin !== undefined && p.referenciaMax !== undefined ? `${p.referenciaMin} a ${p.referenciaMax} ${p.unidade || ''}` : null),
                referenciaMin: p.referenciaMin ?? null,
                referenciaMax: p.referenciaMax ?? null,
                status,
                observacao: p.observacao ?? null,
              }
            })
          : []

        const temCritico = parametros.some((p) => p.status === 'CRITICO' || p.status === 'ABAIXO' || p.status === 'ACIMA')

        return {
          textoLaudo: parsed.textoLaudo || null,
          parametros,
          metodo: parsed.metodo || null,
          responsavelTecnico: parsed.responsavelTecnico || null,
          liberadoEm: parsed.liberadoEm || null,
          temParametroCritico: temCritico,
        }
      }
    } catch {
      // Falha no JSON -> fallback para texto puro
    }
  }

  // Fallback: resultado é texto livre
  return {
    textoLaudo: texto,
    parametros: [],
    temParametroCritico: false,
  }
}

export function serializarResultadoExame(resultado: ResultadoExameEstruturado): string {
  if (!resultado.parametros || resultado.parametros.length === 0) {
    return resultado.textoLaudo || ''
  }
  return JSON.stringify(resultado)
}
