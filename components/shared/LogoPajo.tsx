import React from 'react'

interface LogoPajoProps {
  className?: string
  showSubtitle?: boolean
  variant?: 'dark' | 'light' | 'auto'
}

export function LogoPajo({
  className = '',
  showSubtitle = true,
  variant = 'auto',
}: LogoPajoProps) {
  const textColor =
    variant === 'light'
      ? 'text-white'
      : variant === 'dark'
      ? 'text-slate-900'
      : 'text-foreground'

  const subColor =
    variant === 'light'
      ? 'text-slate-300'
      : variant === 'dark'
      ? 'text-slate-500'
      : 'text-muted-foreground'

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      title="PAJO Tecnologia"
    >
      {/* Ícone estilizado PAJO */}
      <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-sm shadow-indigo-500/20 shrink-0">
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 21V3h7a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H7" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {/* Tipografia da Marca */}
      <div className="flex flex-col text-left leading-none">
        <div className="flex items-center gap-0.5">
          <span className={`text-[15px] font-black tracking-wider uppercase font-sans ${textColor}`}>
            PAJO
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 inline-block ml-0.5" />
        </div>
        {showSubtitle && (
          <span
            className={`text-[8.5px] font-bold tracking-[0.28em] uppercase ${subColor} mt-0.5`}
          >
            TECNOLOGIA
          </span>
        )}
      </div>
    </div>
  )
}

