'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  MEDICAMENTOS_EXEMPLO_PADRAO,
  type CampoFormularioDinamico,
  type OpcaoFormularioDinamico,
} from '@/lib/cadastros/config-formulario-prescricao-medica'

const inputBase =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30'

type FormularioDinamicoProps = {
  campos: CampoFormularioDinamico[]
  valoresIniciais?: Record<string, string>
  onSubmit?: (dados: Record<string, string>) => void
  onValoresChange?: (dados: Record<string, string>) => void
  ocultarBotaoEnviar?: boolean
  textoBotaoEnviar?: string
  semWrapperForm?: boolean
  className?: string
  formKey?: string | number
  /** Prefixo nos IDs dos campos quando há mais de um formulário na mesma página */
  prefixoId?: string
  /** Oculta dicas de layout (mobile/desktop) visíveis ao usuário final */
  ocultarDicasLayout?: boolean
}

const criarEstadoInicial = (
  campos: CampoFormularioDinamico[],
  valoresIniciais?: Record<string, string>
): Record<string, string> =>
  campos.reduce<Record<string, string>>((acc, campo) => {
    acc[campo.chave] = valoresIniciais?.[campo.chave] ?? ''
    return acc
  }, {})

export function FormularioDinamico({
  campos,
  valoresIniciais,
  onSubmit,
  onValoresChange,
  ocultarBotaoEnviar = false,
  textoBotaoEnviar = 'Enviar',
  semWrapperForm = false,
  className,
  formKey,
  prefixoId = 'form',
  ocultarDicasLayout = false,
}: FormularioDinamicoProps) {
  const chavesSerializadas = useMemo(() => campos.map((c) => c.chave).join(','), [campos])
  const valoresIniciaisKey = useMemo(
    () => JSON.stringify(valoresIniciais ?? {}),
    [valoresIniciais]
  )

  const [dados, setDados] = useState<Record<string, string>>(() =>
    criarEstadoInicial(campos, valoresIniciais)
  )

  const ignorarProximaNotificacao = useRef(true)

  // Reseta apenas quando formKey ou valores iniciais serializados mudam (evita reset a cada render do pai)
  useEffect(() => {
    setDados(criarEstadoInicial(campos, valoresIniciais))
    ignorarProximaNotificacao.current = true
  }, [formKey, valoresIniciaisKey, chavesSerializadas, campos, valoresIniciais])

  // Propaga alterações ao pai fora do updater de setState (evita warning do React)
  useEffect(() => {
    if (!onValoresChange) return
    if (ignorarProximaNotificacao.current) {
      ignorarProximaNotificacao.current = false
      return
    }
    onValoresChange(dados)
  }, [dados, onValoresChange])

  const handleChange = (chave: string, valor: string) => {
    setDados((atual) => ({ ...atual, [chave]: valor }))
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (onSubmit) {
      onSubmit(dados)
      return
    }
    console.log('[FormularioDinamico] Dados enviados:', dados)
  }

  const renderizarCampo = (campo: CampoFormularioDinamico) => {
    const id = `${prefixoId}-campo-${campo.chave}`
    const valor = dados[campo.chave] ?? ''
    const obrigatorio = campo.obrigatorio ?? false

    switch (campo.tipo) {
      case 'texto_curto':
        return (
          <input
            id={id}
            type="text"
            value={valor}
            onChange={(e) => handleChange(campo.chave, e.target.value)}
            placeholder={campo.placeholder}
            required={obrigatorio}
            className={inputBase}
            aria-label={campo.rotulo}
          />
        )

      case 'texto_longo':
        return (
          <textarea
            id={id}
            rows={4}
            value={valor}
            onChange={(e) => handleChange(campo.chave, e.target.value)}
            placeholder={campo.placeholder}
            required={obrigatorio}
            className={cn(inputBase, 'resize-y min-h-[6rem]')}
            aria-label={campo.rotulo}
          />
        )

      case 'selecao': {
        const opcoes: OpcaoFormularioDinamico[] = campo.opcoes ?? []
        return (
          <select
            id={id}
            value={valor}
            onChange={(e) => handleChange(campo.chave, e.target.value)}
            required={obrigatorio}
            className={inputBase}
            aria-label={campo.rotulo}
          >
            <option value="">{campo.placeholder ?? 'Selecione…'}</option>
            {opcoes.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        )
      }

      case 'medicacao': {
        const opcoes = campo.opcoesMedicacao ?? [...MEDICAMENTOS_EXEMPLO_PADRAO]
        const listId = `${id}-sugestoes`
        return (
          <>
            <input
              id={id}
              type="text"
              list={listId}
              value={valor}
              onChange={(e) => handleChange(campo.chave, e.target.value)}
              placeholder={campo.placeholder ?? 'Digite o medicamento…'}
              required={obrigatorio}
              className={inputBase}
              aria-label={campo.rotulo}
            />
            <datalist id={listId}>
              {opcoes.map((nome) => (
                <option key={nome} value={nome} />
              ))}
            </datalist>
          </>
        )
      }

      default:
        return null
    }
  }

  const conteudo = (
    <div
      data-formulario-dinamico=""
      className={cn(
        'space-y-4 rounded-lg border border-dashed border-primary/20 bg-muted/10 p-4 sm:p-5',
        semWrapperForm ? className : undefined
      )}
    >
      {!ocultarDicasLayout ? (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 md:hidden">
            Formulário dinâmico — campos empilhados no mobile
          </p>
          <p className="hidden md:block text-[10px] font-semibold uppercase tracking-wider text-primary/70 mb-1">
            Layout 2 colunas — rótulo (1/3) · campo (2/3)
          </p>
        </>
      ) : null}

      {campos.map((campo) => (
        <div
          key={campo.chave}
          className="grid grid-cols-1 md:grid-cols-3 gap-1.5 md:gap-4 md:items-start"
        >
          <label
            htmlFor={`${prefixoId}-campo-${campo.chave}`}
            className="text-sm font-medium text-muted-foreground md:col-span-1 md:text-right md:pt-2.5"
          >
            {campo.rotulo}
            {campo.obrigatorio ? <span className="text-destructive ml-0.5">*</span> : null}
          </label>
          <div className="md:col-span-2">{renderizarCampo(campo)}</div>
        </div>
      ))}

      {!ocultarBotaoEnviar ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 md:gap-4 pt-2">
          <div className="hidden md:block md:col-span-1" aria-hidden />
          <div className="md:col-span-2">
            <button
              type={semWrapperForm ? 'button' : 'submit'}
              onClick={semWrapperForm ? () => handleSubmit() : undefined}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {textoBotaoEnviar}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )

  if (semWrapperForm) {
    return conteudo
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      {conteudo}
    </form>
  )
}
