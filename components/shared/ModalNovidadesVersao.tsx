'use client'

import React from 'react'
import Link from 'next/link'
import { VERSAO_SGH, BUILD_SGH, NOME_VERSAO } from '@/lib/versao'
import {
  Sparkles,
  BedDouble,
  Clock,
  FlaskConical,
  HeartPulse,
  FileCheck2,
  AlertTriangle,
  Network,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  X,
  CheckCircle2,
} from 'lucide-react'

interface ModalNovidadesVersaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const NOVIDADES = [
  {
    icone: BedDouble,
    cor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    titulo: 'Mapa Visual de Leitos & Ocupação Hospitalar',
    descricao:
      'Painel em grade com status visual (Disponível, Ocupado, Interditado), contadores de UTI/Enfermaria, transferências atômicas e tempo de permanência.',
  },
  {
    icone: Clock,
    cor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    titulo: 'Central de Tarefas & Pendências Clínicas',
    descricao:
      'Ações prioritárias em tempo real por perfil: fila Manchester, medicações com horário vencendo, triagens pendentes e admissões.',
  },
  {
    icone: FlaskConical,
    cor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    titulo: 'Exames Laboratoriais Estruturados',
    descricao:
      'Resultados com valores de referência, detecção de níveis normais, alterados e críticos ⚠️ com visualização direta no prontuário.',
  },
  {
    icone: HeartPulse,
    cor: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    titulo: 'Prontuário Eletrônico Longitudinal (PEP)',
    descricao:
      'Linha do tempo unificada de todo o histórico do paciente através dos múltiplos atendimentos e internações.',
  },
  {
    icone: FileCheck2,
    cor: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
    titulo: 'Assinatura Digital ICP-Brasil & Termos TCLE',
    descricao:
      'Metadados PAdES, hash SHA-256 e código de validação pública com termos eletrônicos assináveis na tela.',
  },
  {
    icone: AlertTriangle,
    cor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    titulo: 'Protocolos Clínicos Gerenciados (Sepse, AVC, IAM)',
    descricao:
      'Alertas automáticos para Sepse (qSOFA), AVC com janela trombolítica e Dor Torácica com tempo porta-ECG.',
  },
  {
    icone: Network,
    cor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    titulo: 'Interoperabilidade HL7 FHIR R4',
    descricao:
      'Exportação e integração em conformidade com padrões internacionais de saúde (Patient, Observation LOINC, Encounter).',
  },
  {
    icone: ShieldCheck,
    cor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    titulo: 'Segurança Avançada, MFA & Gestão de Sessões',
    descricao:
      'Autenticação em dois fatores TOTP, criptografia AES-256-GCM em repouso e monitoramento de dispositivos conectados.',
  },
]

export function ModalNovidadesVersao({ open, onOpenChange }: ModalNovidadesVersaoProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Novidades & Atualizações</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {VERSAO_SGH}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {BUILD_SGH} • {NOME_VERSAO}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-foreground/90 space-y-1">
              <p className="font-semibold text-primary">Plataforma Atualizada com Sucesso!</p>
              <p className="text-muted-foreground leading-relaxed">
                Esta versão consolida a evolução completa do ciclo do paciente, integrando atendimento, segurança clínica, governança assistencial e faturamento.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pt-2">
            {NOVIDADES.map((item, idx) => {
              const Icon = item.icone
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-background/60 hover:bg-muted/40 transition-colors"
                >
                  <div className={`p-2 rounded-lg border shrink-0 ${item.cor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground">{item.titulo}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.descricao}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rodapé com CTA para o Manual Completo */}
        <div className="p-4 border-t border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href="/ajuda"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-all group"
            onClick={() => onOpenChange(false)}
          >
            <BookOpen className="h-4 w-4" />
            <span>Abrir Manual Completo do Sistema</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
