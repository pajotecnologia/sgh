'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Printer, Pencil, Trash2, X, Check, Loader2, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BotaoNovoAtendimento } from '@/components/recepcao/BotaoNovoAtendimento';

interface DadosPaciente {
  id: string; nomeCompleto: string; nomeExibicao: string;
  cpf: string; cpfMascarado: string; rg: string; telefone: string;
  dataNascimento: string; sexoBiologico: string; genero: string | null;
  tipoSanguineo: string; convenio: string | null; numeroCarteirinha: string | null;
  observacoesIniciais: string | null;
  endereco: { cep: string; logradouro: string; numero: string; complemento: string | null; bairro: string; cidade: string; estado: string } | null;
  alergias: { descricao: string; gravidade: string | null }[];
  medicamentosContinuos: { nome: string; dose: string; frequencia: string; observacoes: string | null }[];
  atendimentos: { id: string; numeroAtendimento: string; status: string; createdAt: string; triagem: { corClassificacao: string; queixaPrincipal: string } | null }[];
  createdAt: string; isAdmin: boolean; canEdit: boolean;
}

const LABELS_STATUS: Record<string, string> = {
  AGUARDANDO_TRIAGEM: 'Aguardando Triagem', EM_TRIAGEM: 'Em Triagem',
  AGUARDANDO_ATENDIMENTO: 'Aguardando Atend.', EM_ATENDIMENTO: 'Em Atendimento',
  CONCLUIDO: 'Concluído', ALTA: 'Alta', TRANSFERIDO: 'Transferido', OBITO: 'Óbito',
};

const LABELS_SANGUE: Record<string, string> = {
  A_POSITIVO: 'A+', A_NEGATIVO: 'A-', B_POSITIVO: 'B+', B_NEGATIVO: 'B-',
  AB_POSITIVO: 'AB+', AB_NEGATIVO: 'AB-', O_POSITIVO: 'O+', O_NEGATIVO: 'O-', DESCONHECIDO: 'Não informado',
};

const inputClass = 'w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

export function FichaPacienteClient({ dados }: { dados: DadosPaciente }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Form state para edição
  const [form, setForm] = useState({
    nome: dados.nomeCompleto, telefone: dados.telefone, rg: dados.rg,
    genero: dados.genero ?? '', dataNascimento: dados.dataNascimento.split('T')[0],
    sexoBiologico: dados.sexoBiologico, tipoSanguineo: dados.tipoSanguineo,
    convenio: dados.convenio ?? '', numeroCarteirinha: dados.numeroCarteirinha ?? '',
    observacoesIniciais: dados.observacoesIniciais ?? '',
    endereco: dados.endereco ?? { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' },
    alergias: dados.alergias.map(a => ({ ...a })),
    medicamentosContinuos: dados.medicamentosContinuos.map(m => ({ ...m })),
  });
  const [novaAlergia, setNovaAlergia] = useState('');

  const upd = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }));
  const updEnd = (field: string, value: string) => setForm(f => ({ ...f, endereco: { ...f.endereco, [field]: value } }));

  async function salvar() {
    setSalvando(true);
    try {
      const res = await fetch(`/api/pacientes/${dados.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.sucesso) { toast.error(json.erro); return; }
      toast.success('Paciente atualizado!');
      setEditando(false);
      router.refresh();
    } catch { toast.error('Erro ao salvar.'); } finally { setSalvando(false); }
  }

  async function excluir() {
    setExcluindo(true);
    try {
      const res = await fetch(`/api/pacientes/${dados.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.sucesso) { toast.error(json.erro); return; }
      toast.success('Paciente excluído.');
      router.push('/recepcao');
    } catch { toast.error('Erro ao excluir.'); } finally { setExcluindo(false); }
  }

  const Secao = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm print-section">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{titulo}</h3>
      {children}
    </div>
  );

  const Info = ({ label, valor }: { label: string; valor: string | null | undefined }) => (
    <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-sm font-medium text-foreground mt-0.5">{valor || '—'}</dd></div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header + ações */}
      <div className="flex items-center justify-between no-print">
        <Link href="/recepcao" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex gap-2">
          {(!dados.atendimentos.length || ['CONCLUIDO', 'ALTA', 'TRANSFERIDO', 'OBITO'].includes(dados.atendimentos[0].status)) && (
            <BotaoNovoAtendimento pacienteId={dados.id} />
          )}
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
            <Printer className="h-4 w-4" /> Imprimir
          </button>
          {dados.canEdit && (
            <button onClick={() => setEditando(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <Pencil className="h-4 w-4" /> Editar
            </button>
          )}
          {dados.isAdmin && (
            <button onClick={() => setConfirmandoExclusao(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
          )}
        </div>
      </div>

      {/* Cabeçalho do paciente (sempre visível, inclusive no print) */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-5 print-section">
        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
          {dados.nomeCompleto.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{dados.nomeCompleto}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
            <span>CPF: <b className="text-foreground">{dados.cpfMascarado}</b></span>
            <span>Tipo: <b className="text-foreground">{LABELS_SANGUE[dados.tipoSanguineo]}</b></span>
            <span>Cadastro: {format(new Date(dados.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
        </div>
        {/* Título no print */}
        <div className="hidden print:block text-right">
          <p className="text-xs text-muted-foreground">SGH — Sistema de Gerenciamento Hospitalar</p>
          <p className="text-xs text-muted-foreground">Impresso em: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        </div>
      </div>

      {/* Alergias (destaque) */}
      {dados.alergias.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl p-4 flex items-start gap-3 print-section">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800 dark:text-red-400">ALERGIAS REGISTRADAS</h4>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {dados.alergias.map((a, i) => (
                <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200 text-xs font-medium rounded-full">
                  {a.descricao}{a.gravidade && ` (${a.gravidade})`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dados Pessoais */}
      <Secao titulo="Dados Pessoais">
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Info label="Nome Completo" valor={dados.nomeCompleto} />
          <Info label="CPF" valor={dados.cpf} />
          <Info label="RG" valor={dados.rg} />
          <Info label="Nascimento" valor={format(new Date(dados.dataNascimento), 'dd/MM/yyyy')} />
          <Info label="Sexo Biológico" valor={dados.sexoBiologico.charAt(0) + dados.sexoBiologico.slice(1).toLowerCase()} />
          <Info label="Gênero" valor={dados.genero} />
          <Info label="Telefone" valor={dados.telefone} />
          <Info label="Convênio" valor={dados.convenio ?? 'Particular'} />
          <Info label="Nº Carteirinha" valor={dados.numeroCarteirinha} />
        </dl>
      </Secao>

      {/* Endereço */}
      {dados.endereco && (
        <Secao titulo="Endereço">
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Info label="CEP" valor={dados.endereco.cep.replace(/(\d{5})(\d{3})/, '$1-$2')} />
            <Info label="Logradouro" valor={`${dados.endereco.logradouro}, ${dados.endereco.numero}`} />
            <Info label="Complemento" valor={dados.endereco.complemento} />
            <Info label="Bairro" valor={dados.endereco.bairro} />
            <Info label="Cidade" valor={dados.endereco.cidade} />
            <Info label="Estado" valor={dados.endereco.estado} />
          </dl>
        </Secao>
      )}

      {/* Medicamentos */}
      {dados.medicamentosContinuos.length > 0 && (
        <Secao titulo="Medicamentos de Uso Contínuo">
          <div className="space-y-2">
            {dados.medicamentosContinuos.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
                <span className="font-semibold text-blue-800 dark:text-blue-300">{m.nome}</span>
                <span className="text-blue-600">— {m.dose} — {m.frequencia}</span>
              </div>
            ))}
          </div>
        </Secao>
      )}

      {/* Observações */}
      {dados.observacoesIniciais && (
        <Secao titulo="Observações da Recepção"><p className="text-sm text-foreground whitespace-pre-line">{dados.observacoesIniciais}</p></Secao>
      )}

      {/* Histórico de Atendimentos */}
      {dados.atendimentos.length > 0 && (
        <Secao titulo={`Histórico de Atendimentos (${dados.atendimentos.length})`}>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left py-2 font-medium text-muted-foreground">Nº</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Data</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Queixa</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {dados.atendimentos.map(a => (
                <tr key={a.id} className="hover:bg-muted/20">
                  <td className="py-2.5 font-mono text-xs">{a.numeroAtendimento}</td>
                  <td className="py-2.5">{format(new Date(a.createdAt), 'dd/MM/yy HH:mm')}</td>
                  <td className="py-2.5"><span className="px-2 py-0.5 bg-muted rounded-full text-xs">{LABELS_STATUS[a.status] ?? a.status}</span></td>
                  <td className="py-2.5 text-muted-foreground max-w-[200px] truncate">{a.triagem?.queixaPrincipal ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Secao>
      )}

      {/* ==================== MODAL DE EDIÇÃO ==================== */}
      {editando && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-10 overflow-y-auto no-print">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 mb-10">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold">Editar Paciente</h2>
              <button onClick={() => setEditando(false)} className="p-1 hover:bg-muted rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Dados pessoais */}
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Dados Pessoais</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="text-xs font-medium">Nome Completo *</label>
                  <input value={form.nome} onChange={e => upd('nome', e.target.value)} className={inputClass} /></div>
                <div><label className="text-xs font-medium">Telefone</label>
                  <input value={form.telefone} onChange={e => upd('telefone', e.target.value)} className={inputClass} /></div>
                <div><label className="text-xs font-medium">RG</label>
                  <input value={form.rg} onChange={e => upd('rg', e.target.value)} className={inputClass} /></div>
                <div><label className="text-xs font-medium">Nascimento *</label>
                  <input type="date" value={form.dataNascimento} onChange={e => upd('dataNascimento', e.target.value)} className={inputClass} /></div>
                <div><label className="text-xs font-medium">Sexo Biológico *</label>
                  <select value={form.sexoBiologico} onChange={e => upd('sexoBiologico', e.target.value)} className={inputClass}>
                    <option value="MASCULINO">Masculino</option><option value="FEMININO">Feminino</option><option value="INTERSEXO">Intersexo</option>
                  </select></div>
                <div><label className="text-xs font-medium">Tipo Sanguíneo</label>
                  <select value={form.tipoSanguineo} onChange={e => upd('tipoSanguineo', e.target.value)} className={inputClass}>
                    {Object.entries(LABELS_SANGUE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select></div>
                <div><label className="text-xs font-medium">Convênio</label>
                  <input value={form.convenio} onChange={e => upd('convenio', e.target.value)} className={inputClass} placeholder="Particular" /></div>
              </div>
              {/* Endereço */}
              <h4 className="text-sm font-semibold text-muted-foreground uppercase mt-4">Endereço</h4>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-xs font-medium">CEP</label><input value={form.endereco.cep} onChange={e => updEnd('cep', e.target.value)} className={inputClass} /></div>
                <div className="col-span-2"><label className="text-xs font-medium">Logradouro</label><input value={form.endereco.logradouro} onChange={e => updEnd('logradouro', e.target.value)} className={inputClass} /></div>
                <div><label className="text-xs font-medium">Número</label><input value={form.endereco.numero} onChange={e => updEnd('numero', e.target.value)} className={inputClass} /></div>
                <div><label className="text-xs font-medium">Bairro</label><input value={form.endereco.bairro} onChange={e => updEnd('bairro', e.target.value)} className={inputClass} /></div>
                <div><label className="text-xs font-medium">Cidade</label><input value={form.endereco.cidade} onChange={e => updEnd('cidade', e.target.value)} className={inputClass} /></div>
                <div><label className="text-xs font-medium">Estado</label><input value={form.endereco.estado} onChange={e => updEnd('estado', e.target.value.toUpperCase())} className={inputClass} maxLength={2} /></div>
              </div>
              {/* Alergias */}
              <h4 className="text-sm font-semibold text-muted-foreground uppercase mt-4">Alergias</h4>
              <div className="flex gap-2">
                <input value={novaAlergia} onChange={e => setNovaAlergia(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (novaAlergia.trim()) { upd('alergias', [...form.alergias, { descricao: novaAlergia.trim(), gravidade: null }]); setNovaAlergia(''); } } }}
                  className={cn(inputClass, 'flex-1')} placeholder="Adicionar alergia (Enter)" />
                <button type="button" onClick={() => { if (novaAlergia.trim()) { upd('alergias', [...form.alergias, { descricao: novaAlergia.trim(), gravidade: null }]); setNovaAlergia(''); } }}
                  className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"><Plus className="h-4 w-4" /></button>
              </div>
              {form.alergias.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.alergias.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm">
                      {a.descricao}<button type="button" onClick={() => upd('alergias', form.alergias.filter((_, j) => j !== i))} className="hover:text-red-900"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              {/* Observações */}
              <div><label className="text-xs font-medium">Observações</label>
                <textarea value={form.observacoesIniciais} onChange={e => upd('observacoesIniciais', e.target.value)} rows={3} className={cn(inputClass, 'resize-none')} /></div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setEditando(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60">
                {salvando ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</> : <><Check className="h-4 w-4" />Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL DE EXCLUSÃO ==================== */}
      {confirmandoExclusao && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center no-print">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center"><Trash2 className="h-6 w-6 text-red-600" /></div>
              <div><h3 className="font-bold text-lg">Excluir paciente?</h3><p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p></div>
            </div>
            <p className="text-sm bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-3 text-red-700">
              O paciente <b>{dados.nomeCompleto}</b> e todos os atendimentos vinculados serão desativados.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmandoExclusao(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancelar</button>
              <button onClick={excluir} disabled={excluindo} className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60">
                {excluindo ? <><Loader2 className="h-4 w-4 animate-spin" />Excluindo...</> : <><Trash2 className="h-4 w-4" />Confirmar Exclusão</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
