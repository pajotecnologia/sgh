import { cn } from '@/lib/utils'

export function NomePacienteComProntuario({
  nome,
  numeroProntuario,
  className,
  nomeClassName,
  prontuarioClassName,
}: {
  nome: string
  numeroProntuario: string
  className?: string
  nomeClassName?: string
  prontuarioClassName?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 min-w-0 max-w-full', className)}>
      <span className={cn('truncate font-semibold text-foreground', nomeClassName)}>{nome}</span>
      <span
        className={cn(
          'shrink-0 text-[10px] font-mono font-medium text-muted-foreground',
          prontuarioClassName
        )}
        title="Número do prontuário (atendimento)"
      >
        Pront. {numeroProntuario}
      </span>
    </span>
  )
}
