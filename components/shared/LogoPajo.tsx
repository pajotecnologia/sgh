import React from 'react'

interface LogoPajoProps {
  className?: string
  height?: number
  width?: number
}

export function LogoPajo({ className = 'h-7 w-auto text-foreground', height = 30, width = 120 }: LogoPajoProps) {
  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`} title="PAJO Tecnologia">
      <svg
        viewBox="0 0 480 120"
        width={width}
        height={height}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-auto max-w-full"
      >
        {/* P */}
        <path d="M 10 10 L 95 10 C 130 10 145 28 145 52 C 145 76 130 94 95 94 L 52 94 L 52 110 L 10 110 Z M 52 32 L 52 72 L 90 72 C 108 72 118 64 118 52 C 118 40 108 32 90 32 Z" />
        
        {/* A */}
        <path d="M 185 10 L 225 10 L 275 110 L 232 110 L 220 84 L 170 84 L 158 110 L 118 110 Z M 180 62 L 210 62 L 195 28 Z" />
        
        {/* J */}
        <path d="M 285 10 L 328 10 L 328 78 C 328 98 316 110 288 110 C 265 110 252 100 248 88 L 285 78 C 286 84 292 88 298 88 C 304 88 308 84 308 76 L 308 10 Z" />
        
        {/* O */}
        <path d="M 405 8 C 445 8 475 32 475 60 C 475 88 445 112 405 112 C 365 112 335 88 335 60 C 335 32 365 8 405 8 Z M 405 32 C 382 32 365 44 365 60 C 365 76 382 88 405 88 C 428 88 445 76 445 60 C 445 44 428 32 405 32 Z" />
      </svg>
      <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.42em] uppercase text-muted-foreground/80 pl-1 mt-0.5">
        Tecnologia
      </span>
    </div>
  )
}
