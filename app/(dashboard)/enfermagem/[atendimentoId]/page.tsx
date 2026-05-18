'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormularioAplicacaoMedicamento } from '@/components/enfermagem/FormularioAplicacaoMedicamento';

export default function PaginaEnfermagemAtendimento({
  params,
}: {
  params: Promise<{ atendimentoId: string }>;
}) {
  const { atendimentoId } = use(params);
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch(`/api/atendimento/${atendimentoId}/prontuario`);
      const json = await res.json();
      if (!json.sucesso) {
        toast.error(json.erro ?? 'Erro ao carregar dados.');
        setDados(null);
        return;
      }
      setDados(json.dados);
    } catch {
      toast.error('Erro de conexão.');
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [atendimentoId]);

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Carregando…</p>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <Link href="/enfermagem" className="text-sm text-primary hover:underline">
          ← Voltar
        </Link>
        <p className="mt-4 text-muted-foreground">Não foi possível carregar o atendimento.</p>
      </div>
    );
  }

  const { atendimento, prontuario } = dados;
  const itensPendentes = (prontuario.prescricoes ?? []).flatMap((pr: any) =>
    (pr.itens ?? []).filter((it: any) => it.status === 'PENDENTE')
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <Link href="/enfermagem" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div>
        <h1 className="text-xl font-bold">{atendimento.paciente.nomeExibicao}</h1>
        <p className="text-sm font-mono text-muted-foreground">{atendimento.numeroAtendimento}</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
          Aplicar medicação (pendentes)
        </h2>
        {itensPendentes.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-6 text-center">
            Nenhum medicamento pendente de aplicação.
          </p>
        ) : (
          itensPendentes.map((it: any) => (
            <FormularioAplicacaoMedicamento
              key={it.id}
              atendimentoId={atendimentoId}
              item={it}
              onAplicado={carregar}
            />
          ))
        )}
      </section>
    </div>
  );
}
