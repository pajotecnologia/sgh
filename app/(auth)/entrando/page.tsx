// app/(auth)/entrando/page.tsx
// Tela intermediária de redirecionamento por perfil com garantia de carregamento de sessão
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, HeartPulse, Sparkles } from 'lucide-react'

const DESTINO_POR_ROLE: Record<string, string> = {
  FARMACEUTICO: '/farmacia',
  RECEPCIONISTA: '/recepcao',
  ENFERMEIRO: '/medicacao',
  TECNICO_ENFERMAGEM: '/medicacao',
  MEDICO: '/atendimento',
  DIRETOR_CLINICO: '/atendimento',
  ADMIN: '/dashboard',
}

export default function PaginaEntrando() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tentativas, setTentativas] = useState(0)

  useEffect(() => {
    if (status === 'authenticated' && session?.usuario?.role) {
      const destino = DESTINO_POR_ROLE[session.usuario.role] ?? '/dashboard'
      router.replace(destino)
      return
    }

    if (status === 'unauthenticated') {
      // Se não autenticou de imediato, aguarda até 3 segundos antes de voltar ao login
      if (tentativas < 3) {
        const timer = setTimeout(() => {
          setTentativas((prev) => prev + 1)
        }, 1000)
        return () => clearTimeout(timer)
      } else {
        router.replace('/login')
      }
    }
  }, [status, session, router, tentativas])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4 select-none">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5 animate-pulse">
            <HeartPulse className="h-8 w-8" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="h-5 w-5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Entrando no Sistema
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Validando suas credenciais e preparando o seu ambiente de trabalho…
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-card border border-border/80 shadow-2xs text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Carregando painel institucional</span>
        </div>
      </div>
    </div>
  )
}
