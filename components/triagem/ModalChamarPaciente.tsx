'use client';
// components/triagem/ModalChamarPaciente.tsx
// Modal para selecionar sala e chamar paciente para o painel

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, X, Monitor } from 'lucide-react';
import { registerTextoCadastro, textoCadastroMaiusculo } from '@/lib/cadastro-maiusculo';
import { schemaChamarPaciente, type ChamarPacienteForm } from '@/lib/validations/triagem';
import { cn } from '@/lib/utils';

// Salas pré-configuradas — em produção viriam do banco (tabela configurável pelo admin)
const SALAS_DISPONIVEIS = [
  'Consultório 01', 'Consultório 02', 'Consultório 03', 'Consultório 04',
  'Sala de Procedimentos', 'Sala de Emergência', 'Sala de Observação',
  'Raio-X', 'Laboratório',
];

const SETORES_PAINEL = [
  { valor: 'GERAL', label: 'Geral (padrão)' },
  { valor: 'EMERGENCIA', label: 'Emergência' },
  { valor: 'AMBULATORIO', label: 'Ambulatório' },
];

interface ModalChamarPacienteProps {
  atendimentoId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalChamarPaciente({ atendimentoId, onClose, onSuccess }: ModalChamarPacienteProps) {
  const [salaCustomizada, setSalaCustomizada] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChamarPacienteForm>({
    resolver: zodResolver(schemaChamarPaciente),
    defaultValues: {
      atendimentoId,
      salaDestino: '',
      setorPainel: 'GERAL',
    },
  });

  const salaAtual = watch('salaDestino');

  async function onSubmit(dados: ChamarPacienteForm) {
    try {
      const res = await fetch('/api/painel/chamar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const json = await res.json();
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao chamar paciente.');
        return;
      }
      toast.success('Paciente chamado!', {
        description: `Sala: ${dados.salaDestino}`,
        icon: '📢',
      });
      onSuccess();
    } catch {
      toast.error('Erro de conexão.');
    }
  }

  const inputClass = (erro?: string) => cn(
    'w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm outline-none transition-all',
    'focus:ring-2 focus:ring-primary/30 focus:border-primary',
    erro ? 'border-destructive' : 'border-input'
  );

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-chamar-titulo"
    >
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border m-4 animate-fade-in-up">
        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 id="modal-chamar-titulo" className="font-semibold text-foreground">
                Chamar paciente
              </h2>
              <p className="text-xs text-muted-foreground">Nome e sala no painel de chamadas; pode anunciar por voz na TV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Sala de destino */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Sala / Consultório <span className="text-destructive">*</span>
            </label>

            {/* Grade de salas rápidas */}
            {!salaCustomizada && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {SALAS_DISPONIVEIS.map((sala) => (
                  <button
                    key={sala}
                    type="button"
                    onClick={() => setValue('salaDestino', textoCadastroMaiusculo(sala))}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all',
                      salaAtual === textoCadastroMaiusculo(sala)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {sala}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setSalaCustomizada(true); setValue('salaDestino', ''); }}
                  className="px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  + Outra sala...
                </button>
              </div>
            )}

            {/* Campo customizado */}
            {salaCustomizada && (
              <div className="flex gap-2">
                <input
                  {...register('salaDestino', registerTextoCadastro)}
                  placeholder="DIGITE O NOME DA SALA"
                  className={cn(inputClass(errors.salaDestino?.message), 'flex-1')}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setSalaCustomizada(false); setValue('salaDestino', ''); }}
                  className="px-3 py-2 text-xs border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Voltar
                </button>
              </div>
            )}

            {errors.salaDestino && (
              <p className="text-xs text-destructive">{errors.salaDestino.message}</p>
            )}
          </div>

          {/* Setor do painel */}
          <div className="space-y-1.5">
            <label htmlFor="setorPainel" className="text-sm font-medium">Painel de destino</label>
            <select id="setorPainel" {...register('setorPainel')} className={inputClass()}>
              {SETORES_PAINEL.map((s) => (
                <option key={s.valor} value={s.valor}>{s.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              O painel deve estar aberto em <code className="bg-muted px-1 rounded">/painel?setor=GERAL</code>
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !salaAtual}
              id="btn-confirmar-chamada"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Chamando...</>
              ) : (
                <><Monitor className="h-4 w-4" /> Chamar agora</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
