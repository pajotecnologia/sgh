import React from 'react'

interface LogoPajoProps {
  className?: string
  width?: number
  height?: number
  variant?: 'dark' | 'light' | 'auto'
}

export function LogoPajo({
  className = '',
  width = 140,
  height = 40,
  variant = 'auto',
}: LogoPajoProps) {
  const filterClass =
    variant === 'light'
      ? 'invert mix-blend-screen'
      : variant === 'dark'
      ? 'mix-blend-multiply'
      : 'mix-blend-multiply dark:invert dark:mix-blend-screen'

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      title="PAJO Tecnologia"
    >
      <img
        src="/images/logo-pajo.png"
        alt="PAJO Tecnologia"
        width={width}
        height={height}
        className={`h-auto max-h-9 sm:max-h-10 w-auto object-contain transition-all ${filterClass}`}
      />
    </div>
  )
}
