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
      ? 'brightness-0 invert'
      : variant === 'dark'
      ? ''
      : 'dark:brightness-0 dark:invert'

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
