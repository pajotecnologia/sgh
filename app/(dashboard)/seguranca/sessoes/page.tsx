'use client';

import { useCallback, useEffect, useState } from 'react';
import { Monitor, Smartphone, Tablet, ShieldCheck, LogOut, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type Sessao = {
  id: string;
  atual: boolean;
  ipOrigem: string | null;
  userAgent: string | null;
  dispositivo: string | null;
  criadoEm: string;
  ultimoAcesso: string;
  expiraEm: string;
};

function IconeDispositivo({ texto }: { texto: string | null }) {
  const valor = (texto ?? '').toLowerCase();
  if (valor.includes('android') || valor.includes('ios')) return <Smartphone className="h-5 w-5" />;
  if (valor.includes('ipad') || valor.includes('tablet')) return <Tablet className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor));
}

export default function SessoesSegurancaPage() {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resposta = await fetch('/api/seguranca/sessoes', { cache: 'no-store' });
      const dados = await resposta.json();
      if (!resposta.ok || !dados.sucesso) throw new Error(dados.erro ?? 'Falha ao carregar sessões.');
      setSessoes(dados.dados);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : 'Falha ao carregar sessões.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function revogar(id: string) {
    setProcessando(id);
    try {
      const resposta = await fetch(`/api/seguranca/sessoes/${id}`, { method: 'DELETE' });
      const dados = await resposta.json();
      if (!resposta.ok || !dados.sucesso) throw new Error(dados.erro ?? 'Não foi possível revogar a sessão.');
      toast.success('Sessão revogada.');
      await carregar();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : 'Falha ao revogar sessão.');
    } finally {
      setProcessando(null);
    }
  }

  async function revogarOutras() {
    setProcessando('outras');
    try {
      const resposta = await fetch('/api/seguranca/sessoes/revogar-outras', { method: 'POST' });
      const dados = await resposta.json();
      if (!resposta.ok || !dados.sucesso) throw new Error(dados.erro ?? 'Não foi possível revogar as sessões.');
      toast.success(`${dados.revogadas} sessão(ões) revogada(s).`);
      await carregar();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : 'Falha ao revogar sessões.');
    } finally {
      setProcessando(null);
    }
  }

  const outras = sessoes.filter((sessao) => !sessao.atual);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Segurança da conta</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Sessões e dispositivos</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Consulte onde sua conta está autenticada e encerre acessos que você não reconhece.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void carregar()}
          disabled={carregando}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-semibold">Controle de acesso ativo</p>
            <p className="mt-1 text-muted-foreground">
              As sessões são vinculadas ao dispositivo, IP e horário de acesso. Uma sessão revogada deixa de ser aceita pelo servidor.
            </p>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">Carregando sessões…</div>
      ) : (
        <>
          {sessoes.filter((sessao) => sessao.atual).map((sessao) => (
            <section key={sessao.id} className="rounded-xl border border-primary/30 bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><IconeDispositivo texto={sessao.dispositivo} /></div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">Este dispositivo</h2>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Sessão atual</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{sessao.dispositivo ?? 'Dispositivo desconhecido'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">IP {sessao.ipOrigem ?? 'não identificado'} · Último acesso {formatarData(sessao.ultimoAcesso)}</p>
                  </div>
                </div>
                <div className="text-left text-xs text-muted-foreground sm:text-right">
                  <p>Criada em {formatarData(sessao.criadoEm)}</p>
                  <p>Expira em {formatarData(sessao.expiraEm)}</p>
                </div>
              </div>
            </section>
          ))}

          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">Outras sessões</h2>
                <p className="text-sm text-muted-foreground">{outras.length} acesso(s) ativo(s) em outros dispositivos.</p>
              </div>
              {outras.length > 0 && (
                <button
                  type="button"
                  onClick={() => void revogarOutras()}
                  disabled={processando !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  Encerrar outras sessões
                </button>
              )}
            </div>

            <div className="divide-y divide-border">
              {outras.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma outra sessão ativa.</div>
              ) : (
                outras.map((sessao) => (
                  <div key={sessao.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-muted p-2.5"><IconeDispositivo texto={sessao.dispositivo} /></div>
                      <div>
                        <p className="font-medium">{sessao.dispositivo ?? 'Dispositivo desconhecido'}</p>
                        <p className="mt-1 text-xs text-muted-foreground">IP {sessao.ipOrigem ?? 'não identificado'}</p>
                        <p className="text-xs text-muted-foreground">Último acesso {formatarData(sessao.ultimoAcesso)} · Expira {formatarData(sessao.expiraEm)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void revogar(sessao.id)}
                      disabled={processando !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Encerrar
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
