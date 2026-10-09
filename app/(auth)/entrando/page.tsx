// app/(auth)/entrando/page.tsx
// Tela intermediária de transição com sabedoria de Confúcio e pré-carregamento (pre-warming) do sistema
'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { HeartPulse, Sparkles, ArrowRight, Quote, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const DESTINO_POR_ROLE: Record<string, string> = {
  FARMACEUTICO: '/farmacia',
  RECEPCIONISTA: '/recepcao',
  ENFERMEIRO: '/medicacao',
  TECNICO_ENFERMAGEM: '/medicacao',
  MEDICO: '/atendimento',
  DIRETOR_CLINICO: '/atendimento',
  ADMIN: '/dashboard',
}

// Coletânea curada de pensamentos e provérbios de Confúcio
const FRASES_CONFUCIO = [
  {
    texto: 'Aonde quer que vás, vai com todo o teu coração.',
    contexto: 'Dedicação e Presença Plena no Cuidado',
  },
  {
    texto: 'Transportai um punhado de terra todos os dias e fareis uma montanha.',
    contexto: 'Perseverança e Construção Contínua',
  },
  {
    texto: 'A maior glória não é nunca cair, mas levantar-se a cada queda.',
    contexto: 'Resiliência e Superação',
  },
  {
    texto: 'O homem que move montanhas começa carregando pequenas pedras.',
    contexto: 'Foco nos Primeiros Passos e Disciplina',
  },
  {
    texto: 'Saber o que é correto e não o fazer é a pior das covardias.',
    contexto: 'Ética e Integridade Profissional',
  },
  {
    texto: 'A sabedoria começa com a reflexão, que é o caminho mais nobre.',
    contexto: 'Discernimento e Decisão Clínica',
  },
  {
    texto: 'A essência do conhecimento é, tendo-o, aplicá-lo; não o tendo, confessar a ignorância.',
    contexto: 'Humildade e Excelência Técnica',
  },
  {
    texto: 'Não importa o quão devagar você vá, desde que você não pare.',
    contexto: 'Constância e Firmeza de Propósito',
  },
  {
    texto: 'Exige muito de ti mesmo e espera pouco dos outros. Assim, evitarás dissabores.',
    contexto: 'Autorresponsabilidade e Liderança',
  },
  {
    texto: 'Se queres prever o futuro, estuda o passado.',
    contexto: 'Histórico, Aprendizado e Prevenção',
  },
  {
    texto: 'Aquele que aprende mas não pensa está perdido; aquele que pensa mas não aprende está em perigo.',
    contexto: 'Pensamento Crítico e Aprendizado Contínuo',
  },
  {
    texto: 'Quando vires um homem bom, tenta imitá-lo; quando vires um homem com falhas, examina-te a ti mesmo.',
    contexto: 'Empatia e Autoavaliação',
  },
]

// Tempo total ideal para leitura confortável e pré-aquecimento do sistema (em milissegundos)
const TEMPO_LEITURA_MS = 3800

export default function PaginaEntrando() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [progresso, setProgresso] = useState(0)
  const [etapaTexto, setEtapaTexto] = useState('Autenticando sessão institucional segura…')
  const [prontoParaNavegar, setProntoParaNavegar] = useState(false)
  const navegadoRef = useRef(false)

  // Seleciona uma frase aleatória de Confúcio na montagem do componente
  const fraseSelecionada = useMemo(() => {
    const idx = Math.floor(Math.random() * FRASES_CONFUCIO.length)
    return FRASES_CONFUCIO[idx]
  }, [])

  // Destino baseado no perfil do usuário
  const destinoFinal = useMemo(() => {
    if (session?.usuario?.role) {
      return DESTINO_POR_ROLE[session.usuario.role] ?? '/dashboard'
    }
    return '/dashboard'
  }, [session])

  // Pré-aquecimento (Pre-warming & Prefetching) de rotas em segundo plano
  useEffect(() => {
    try {
      router.prefetch(destinoFinal)
      router.prefetch('/atendimento')
      router.prefetch('/dashboard')
      router.prefetch('/medicacao')
      router.prefetch('/farmacia')
      router.prefetch('/recepcao')
    } catch {
      // ignore
    }
  }, [router, destinoFinal])

  // Timer de progresso visual sincronizado com o tempo de leitura
  useEffect(() => {
    const inicio = Date.now()
    const intervalo = setInterval(() => {
      const decorrido = Date.now() - inicio
      const pct = Math.min(100, Math.round((decorrido / TEMPO_LEITURA_MS) * 100))
      setProgresso(pct)

      if (pct < 35) {
        setEtapaTexto('Validando credenciais e certificados de segurança…')
      } else if (pct < 75) {
        setEtapaTexto('Pré-carregando módulos hospitalares e bases clínicas…')
      } else if (pct < 100) {
        setEtapaTexto('Ambiente preparado com sucesso. Entrando…')
      } else {
        setEtapaTexto('Pronto!')
        setProntoParaNavegar(true)
        clearInterval(intervalo)
      }
    }, 40)

    return () => clearInterval(intervalo)
  }, [])

  // Executa a navegação assim que o tempo de leitura atinge 100% ou autenticação confirma
  useEffect(() => {
    if (prontoParaNavegar && !navegadoRef.current) {
      navegadoRef.current = true
      if (status === 'authenticated') {
        router.replace(destinoFinal)
      } else if (status === 'unauthenticated') {
        router.replace('/login')
      }
    }
  }, [prontoParaNavegar, status, destinoFinal, router])

  // Função para o usuário avançar imediatamente sem esperar o timer (caso de emergência)
  function avancarImediatamente() {
    if (!navegadoRef.current) {
      navegadoRef.current = true
      if (status === 'authenticated') {
        router.replace(destinoFinal)
      } else {
        router.replace('/login')
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 select-none relative overflow-hidden">
      {/* Luzes e Efeitos de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Topo do Splash Screen */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary backdrop-blur-md shadow-inner">
            <HeartPulse className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/90 block">
              SGH • Gestão Hospitalar
            </span>
            <span className="text-xs font-semibold text-white/80">Ambiente Clínico Integrado</span>
          </div>
        </div>

        <button
          type="button"
          onClick={avancarImediatamente}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all backdrop-blur-sm shadow-xs active:scale-95"
          aria-label="Avançar agora para o sistema"
        >
          <span>Avançar agora</span>
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
        </button>
      </header>

      {/* Centro: Card com Frase de Confúcio */}
      <main className="relative z-10 my-auto py-8 max-w-2xl w-full mx-auto text-center space-y-6">
        {/* Badge do Filósofo */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-xs animate-in fade-in duration-500">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Sabedoria de Confúcio • {fraseSelecionada.contexto}</span>
        </div>

        {/* Citação Principal */}
        <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10 backdrop-blur-xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-700">
          <Quote className="h-8 w-8 text-amber-400/40 mx-auto" />

          <blockquote className="text-xl sm:text-2xl md:text-3xl font-serif font-medium text-white/95 leading-relaxed italic text-balance">
            &ldquo;{fraseSelecionada.texto}&rdquo;
          </blockquote>

          <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-xs font-semibold text-amber-300/90 tracking-wider uppercase">
            <span>— Confúcio (551 a.C. – 479 a.C.)</span>
          </div>
        </div>

        {/* Indicador de Pré-carregamento do Sistema */}
        <div className="space-y-2.5 max-w-md mx-auto pt-2">
          <div className="flex items-center justify-between text-xs text-white/70 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              {etapaTexto}
            </span>
            <span className="font-mono font-bold text-white/90">{progresso}%</span>
          </div>

          {/* Barra de Progresso com Gradiente */}
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-100 ease-out bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 shadow-sm shadow-emerald-500/40'
              )}
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      </main>

      {/* Rodapé do Splash Screen */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Sessão autenticada e criptografada (AES-256)</span>
        </div>
        <span>Carregamento em segundo plano ativo</span>
      </footer>
    </div>
  )
}

