'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Building2, MapPin, Upload, Image as ImageIcon, Loader2, Plus, Trash2, Tag, Volume2, Palette, Settings2, Mail, Pencil } from 'lucide-react';
import { textoCadastroMaiusculo } from '@/lib/cadastro-maiusculo';
import { cn } from '@/lib/utils';

interface Instituicao {
  nomeMunicipio: string;
  nomeInstituicao: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  logomarcaUrl: string;
}

interface Origem {
  id: string;
  descricao: string;
  procedenciaFicha?: string | null;
}

type ProcedenciaFichaVal = 'RESIDENCIA' | 'VIA_PUBLICA' | 'TRABALHO' | 'UNIDADE_SAUDE';

const ROTULOS_PROCEDENCIA_FICHA: { value: ProcedenciaFichaVal; label: string }[] = [
  { value: 'RESIDENCIA', label: 'Residência (ficha)' },
  { value: 'VIA_PUBLICA', label: 'Via pública (ficha)' },
  { value: 'TRABALHO', label: 'Trabalho (ficha)' },
  { value: 'UNIDADE_SAUDE', label: 'Unidade de saúde (ficha)' },
];

export function ConfiguracoesClient() {
  const [abaAtiva, setAbaAtiva] = useState<
    'INSTITUICAO' | 'ORIGENS' | 'USUARIOS' | 'PAINEL' | 'SMTP'
  >('INSTITUICAO');
  
  const [instituicao, setInstituicao] = useState<Instituicao>({
    nomeMunicipio: '', nomeInstituicao: '', endereco: '', bairro: '', cidade: '', estado: '', cep: '', logomarcaUrl: ''
  });
  const [carregandoInst, setCarregandoInst] = useState(true);
  const [salvandoInst, setSalvandoInst] = useState(false);
  const [fazendoUpload, setFazendoUpload] = useState(false);

  const [origens, setOrigens] = useState<Origem[]>([]);
  const [novaOrigem, setNovaOrigem] = useState('');
  const [carregandoOrigens, setCarregandoOrigens] = useState(true);
  const [salvandoOrigem, setSalvandoOrigem] = useState(false);

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);
  const [modalUsuario, setModalUsuario] = useState(false);
  const [novoUser, setNovoUser] = useState({ nome: '', email: '', senha: '', role: 'RECEPCIONISTA', crm: '', coren: '' });
  const [salvandoUser, setSalvandoUser] = useState(false);

  const [configPainel, setConfigPainel] = useState({
    vozAtiva: true, tipoVoz: 'feminina', corPrimaria: '#2563eb', corSecundaria: '#f8fafc', corTexto: '#1e293b', mensagemPadrao: 'Comparecer ao consultório', velocidadeVoz: 1.0
  });
  const [carregandoPainel, setCarregandoPainel] = useState(true);
  const [salvandoPainel, setSalvandoPainel] = useState(false);

  const [smtp, setSmtp] = useState({
    host: '',
    porta: 587,
    secure: false,
    usuario: '',
    senha: '',
    emailRemetente: '',
    nomeRemetente: '',
    ativo: true,
  });
  const [senhaSmtpPreenchida, setSenhaSmtpPreenchida] = useState(false);
  const [carregandoSmtp, setCarregandoSmtp] = useState(true);
  const [salvandoSmtp, setSalvandoSmtp] = useState(false);

  const [modalEditarUsuario, setModalEditarUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<{ id: string; nome: string; email: string; role: string; ativo: boolean; crm?: string | null; coren?: string | null } | null>(null);
  const [formUsuarioEdicao, setFormUsuarioEdicao] = useState({
    nome: '',
    email: '',
    role: 'RECEPCIONISTA',
    ativo: true,
    senha: '',
    crm: '',
    coren: '',
  });
  const [salvandoUsuarioEdicao, setSalvandoUsuarioEdicao] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregandoInst(true);
    setCarregandoOrigens(true);
    setCarregandoUsuarios(true);
    setCarregandoPainel(true);
    setCarregandoSmtp(true);
    try {
      const [resInst, resOrigens, resUsers, resPainel, resSmtp] = await Promise.all([
        fetch('/api/configuracoes/instituicao'),
        fetch('/api/configuracoes/origens'),
        fetch('/api/configuracoes/usuarios'),
        fetch('/api/configuracoes/painel'),
        fetch('/api/configuracoes/smtp'),
      ]);
      const jsonInst = await resInst.json();
      const jsonOrigens = await resOrigens.json();
      const jsonUsers = await resUsers.json();
      const jsonPainel = await resPainel.json();
      const jsonSmtp = await resSmtp.json();
      
      if (jsonInst.sucesso && jsonInst.dados) setInstituicao(jsonInst.dados);
      if (jsonOrigens.sucesso) setOrigens(jsonOrigens.dados);
      if (jsonUsers.sucesso) setUsuarios(jsonUsers.dados);
      if (jsonPainel.sucesso && jsonPainel.dados) setConfigPainel(jsonPainel.dados);
      if (jsonSmtp.sucesso && jsonSmtp.dados) {
        const d = jsonSmtp.dados as {
          host?: string;
          porta?: number;
          secure?: boolean;
          usuario?: string;
          emailRemetente?: string;
          nomeRemetente?: string | null;
          ativo?: boolean;
          senhaPreenchida?: boolean;
        };
        setSmtp((prev) => ({
          ...prev,
          host: d.host ?? '',
          porta: typeof d.porta === 'number' ? d.porta : 587,
          secure: Boolean(d.secure),
          usuario: d.usuario ?? '',
          emailRemetente: d.emailRemetente ?? '',
          nomeRemetente: d.nomeRemetente ?? '',
          ativo: d.ativo !== false,
          senha: '',
        }));
        setSenhaSmtpPreenchida(Boolean(d.senhaPreenchida));
      }
    } catch {
      toast.error('Erro ao carregar configurações.');
    } finally {
      setCarregandoInst(false);
      setCarregandoOrigens(false);
      setCarregandoUsuarios(false);
      setCarregandoPainel(false);
      setCarregandoSmtp(false);
    }
  }

  async function salvarSmtp(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoSmtp(true);
    try {
      const body: Record<string, unknown> = {
        host: smtp.host,
        porta: Number(smtp.porta) || 587,
        secure: smtp.secure,
        usuario: smtp.usuario,
        emailRemetente: smtp.emailRemetente,
        nomeRemetente: smtp.nomeRemetente || null,
        ativo: smtp.ativo,
      };
      if (smtp.senha.trim()) body.senha = smtp.senha.trim();
      const res = await fetch('/api/configuracoes/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.sucesso) {
        toast.success(json.mensagem ?? 'SMTP salvo.');
        setSmtp((s) => ({ ...s, senha: '' }));
        setSenhaSmtpPreenchida(true);
      } else {
        toast.error(json.erro ?? 'Erro ao salvar SMTP.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSalvandoSmtp(false);
    }
  }

  async function salvarProcedenciaOrigem(o: Origem, value: string) {
    try {
      const res = await fetch(`/api/configuracoes/origens/${o.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedenciaFicha: value === '' ? null : value,
        }),
      });
      const json = await res.json();
      if (json.sucesso && json.dados) {
        setOrigens((lista) =>
          lista.map((x) =>
            x.id === o.id ? { ...x, procedenciaFicha: json.dados.procedenciaFicha } : x
          )
        );
        toast.success('Procedência na ficha atualizada.');
      } else {
        toast.error(json.erro ?? 'Erro ao atualizar.');
      }
    } catch {
      toast.error('Erro de conexão.');
    }
  }

  function abrirEdicaoUsuario(u: (typeof usuarios)[0]) {
    setUsuarioEditando(u);
    setFormUsuarioEdicao({
      nome: u.nome,
      email: u.email,
      role: u.role,
      ativo: u.ativo,
      senha: '',
      crm: u.crm ?? '',
      coren: u.coren ?? '',
    });
    setModalEditarUsuario(true);
  }

  async function salvarUsuarioEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioEditando) return;
    setSalvandoUsuarioEdicao(true);
    try {
      const body: Record<string, unknown> = {
        nome: textoCadastroMaiusculo(formUsuarioEdicao.nome.trim()),
        email: formUsuarioEdicao.email.trim().toLowerCase(),
        role: formUsuarioEdicao.role,
        ativo: formUsuarioEdicao.ativo,
      };
      if (formUsuarioEdicao.senha.trim()) body.senha = formUsuarioEdicao.senha;
      if (formUsuarioEdicao.role === 'MEDICO') body.crm = formUsuarioEdicao.crm.trim() || null;
      if (['ENFERMEIRO', 'TECNICO_ENFERMAGEM'].includes(formUsuarioEdicao.role))
        body.coren = formUsuarioEdicao.coren.trim() || null;

      const res = await fetch(`/api/configuracoes/usuarios/${usuarioEditando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.sucesso) {
        toast.success(json.mensagem ?? 'Usuário atualizado.');
        setModalEditarUsuario(false);
        setUsuarioEditando(null);
        carregarDados();
      } else {
        toast.error(json.erro ?? 'Erro ao atualizar.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSalvandoUsuarioEdicao(false);
    }
  }

  // --- USUARIOS ---
  async function addUsuario(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoUser(true);
    try {
      const res = await fetch('/api/configuracoes/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoUser),
      });
      const json = await res.json();
      if (json.sucesso) {
        toast.success('Usuário criado com sucesso!');
        setModalUsuario(false);
        setNovoUser({ nome: '', email: '', senha: '', role: 'RECEPCIONISTA', crm: '', coren: '' });
        carregarDados();
      } else {
        toast.error(json.erro || 'Erro ao criar usuário.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSalvandoUser(false);
    }
  }

  // --- PAINEL ---
  async function salvarPainel(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoPainel(true);
    try {
      const res = await fetch('/api/configuracoes/painel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configPainel),
      });
      const json = await res.json();
      if (json.sucesso) {
        toast.success('Configurações do painel salvas!');
      } else {
        toast.error(json.erro || 'Erro ao salvar.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSalvandoPainel(false);
    }
  }

  function testarVoz() {
    if (!window.speechSynthesis) {
      toast.error('Seu navegador não suporta síntese de voz.');
      return;
    }
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance("Atenção, Maria da Silva, comparecer ao consultório 2.");
    
    // Tenta configurar a voz
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) msg.voice = ptVoice;
    
    msg.pitch = configPainel.tipoVoz === 'feminina' ? 1.2 : 0.8;
    msg.rate = configPainel.velocidadeVoz;
    window.speechSynthesis.speak(msg);
  }

  const ROLES = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'MEDICO', label: 'Médico' },
    { value: 'ENFERMEIRO', label: 'Enfermeiro' },
    { value: 'TECNICO_ENFERMAGEM', label: 'Técnico de Enfermagem' },
    { value: 'RECEPCIONISTA', label: 'Recepcionista' },
    { value: 'DIRETOR_CLINICO', label: 'Diretor Clínico' },
  ];

  // --- INSTITUICAO ---
  async function salvarInstituicao(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoInst(true);
    try {
      const res = await fetch('/api/configuracoes/instituicao', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instituicao),
      });
      const json = await res.json();
      if (json.sucesso) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        toast.error(json.erro || 'Erro ao salvar.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSalvandoInst(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFazendoUpload(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.sucesso) {
        setInstituicao(prev => ({ ...prev, logomarcaUrl: json.url }));
        toast.success('Logo enviada!');
      } else {
        toast.error(json.erro || 'Erro no upload.');
      }
    } catch {
      toast.error('Erro ao enviar imagem.');
    } finally {
      setFazendoUpload(false);
    }
  }

  // --- ORIGENS ---
  async function addOrigem(e: React.FormEvent) {
    e.preventDefault();
    if (!novaOrigem.trim()) return;
    setSalvandoOrigem(true);
    try {
      const res = await fetch('/api/configuracoes/origens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: textoCadastroMaiusculo(novaOrigem.trim()) }),
      });
      const json = await res.json();
      if (json.sucesso) {
        setOrigens([...origens, json.dados]);
        setNovaOrigem('');
        toast.success('Origem cadastrada!');
      } else {
        toast.error(json.erro || 'Erro ao cadastrar.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSalvandoOrigem(false);
    }
  }

  async function removerOrigem(id: string) {
    if (!confirm('Deseja excluir esta origem?')) return;
    try {
      const res = await fetch(`/api/configuracoes/origens/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.sucesso) {
        setOrigens(origens.filter(o => o.id !== id));
        toast.success('Excluída com sucesso.');
      } else {
        toast.error(json.erro || 'Erro ao excluir.');
      }
    } catch {
      toast.error('Erro de conexão.');
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
      
      {/* Menu Lateral */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-muted/20 p-4 space-y-2">
        <button
          onClick={() => setAbaAtiva('INSTITUICAO')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
            abaAtiva === 'INSTITUICAO' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-foreground"
          )}
        >
          <Building2 className="h-4 w-4" /> Instituição
        </button>
        <button
          onClick={() => setAbaAtiva('ORIGENS')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
            abaAtiva === 'ORIGENS' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-foreground"
          )}
        >
          <Tag className="h-4 w-4" /> Origens do Paciente
        </button>
        <button
          onClick={() => setAbaAtiva('USUARIOS')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
            abaAtiva === 'USUARIOS' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-foreground"
          )}
        >
          <Plus className="h-4 w-4" /> Usuários do Sistema
        </button>
        <button
          onClick={() => setAbaAtiva('PAINEL')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
            abaAtiva === 'PAINEL' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-foreground"
          )}
        >
          <Settings2 className="h-4 w-4" /> Painel de Chamadas
        </button>
        <button
          onClick={() => setAbaAtiva('SMTP')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
            abaAtiva === 'SMTP' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-foreground"
          )}
        >
          <Mail className="h-4 w-4" /> E-mail (SMTP)
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        
        {/* ABA: INSTITUICAO */}
        {abaAtiva === 'INSTITUICAO' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Dados do Município / Instituição
            </h2>
            <hr />
            {carregandoInst ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : (
              <form onSubmit={salvarInstituicao} className="space-y-8">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="shrink-0">
                    <div className="w-32 h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-muted/50 relative overflow-hidden group">
                      {instituicao.logomarcaUrl ? <img src={instituicao.logomarcaUrl} alt="Logo" className="absolute inset-0 w-full h-full object-contain p-2" /> : <ImageIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />}
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload className="h-6 w-6 text-white mb-1" />
                        <span className="text-[10px] text-white font-medium">Trocar Logo</span>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} disabled={fazendoUpload} />
                      </div>
                      {fazendoUpload && <div className="absolute inset-0 bg-background/80 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                    </div>
                  </div>
                  <div><h3 className="font-medium">Logomarca</h3><p className="text-xs text-muted-foreground mb-3">Recomendado: imagem PNG transparente, máx 2MB.</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1"><label className="text-sm font-medium">Município (Prefeitura)</label><input value={instituicao.nomeMunicipio} onChange={e => setInstituicao({ ...instituicao, nomeMunicipio: textoCadastroMaiusculo(e.target.value) })} className={inputClass} required /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Nome da Instituição</label><input value={instituicao.nomeInstituicao} onChange={e => setInstituicao({ ...instituicao, nomeInstituicao: textoCadastroMaiusculo(e.target.value) })} className={inputClass} required /></div>
                  <div className="md:col-span-2 space-y-1"><label className="text-sm font-medium">Endereço</label><input value={instituicao.endereco} onChange={e => setInstituicao({ ...instituicao, endereco: textoCadastroMaiusculo(e.target.value) })} className={inputClass} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Bairro</label><input value={instituicao.bairro} onChange={e => setInstituicao({ ...instituicao, bairro: textoCadastroMaiusculo(e.target.value) })} className={inputClass} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Cidade</label><input value={instituicao.cidade} onChange={e => setInstituicao({ ...instituicao, cidade: textoCadastroMaiusculo(e.target.value) })} className={inputClass} /></div>
                </div>
                <div className="flex justify-end pt-4 border-t border-border"><button type="submit" disabled={salvandoInst} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70">{salvandoInst ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Configurações'}</button></div>
              </form>
            )}
          </div>
        )}

        {/* ABA: ORIGENS */}
        {abaAtiva === 'ORIGENS' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Origens do Paciente</h2>
            <form onSubmit={addOrigem} className="flex gap-3"><input value={novaOrigem} onChange={e => setNovaOrigem(textoCadastroMaiusculo(e.target.value))} className={inputClass} placeholder="NOVA ORIGEM..." /><button type="submit" disabled={salvandoOrigem || !novaOrigem.trim()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-70 shrink-0">{salvandoOrigem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar</button></form>
            {carregandoOrigens ? <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
               <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                 {origens.map((o) => (
                   <div
                     key={o.id}
                     className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 bg-card hover:bg-muted/30 transition-colors"
                   >
                     <span className="text-sm font-medium flex-1 min-w-0">{o.descricao}</span>
                     <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                       <label className="text-xs text-muted-foreground whitespace-nowrap sm:hidden">
                         Caixa na ficha de urgência
                       </label>
                       <select
                         value={o.procedenciaFicha ?? ''}
                         onChange={(e) => salvarProcedenciaOrigem(o, e.target.value)}
                         className={cn(inputClass, 'max-w-full sm:max-w-[240px] text-xs')}
                         title="Qual caixa de procedência marcar na ficha impressa"
                       >
                         <option value="">— (não marcar automaticamente)</option>
                         {ROTULOS_PROCEDENCIA_FICHA.map((p) => (
                           <option key={p.value} value={p.value}>
                             {p.label}
                           </option>
                         ))}
                       </select>
                       <button
                         type="button"
                         onClick={() => removerOrigem(o.id)}
                         className="p-2 text-destructive hover:bg-red-50 rounded-lg transition-colors self-end sm:self-auto"
                         title="Excluir origem"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {/* ABA: USUARIOS */}
        {abaAtiva === 'USUARIOS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-xl font-semibold flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Usuários</h2><button onClick={() => setModalUsuario(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm"><Plus className="h-4 w-4" /> Novo Usuário</button></div>
            {carregandoUsuarios ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : (
              <div className="border border-border rounded-xl overflow-hidden bg-background">
                <table className="w-full text-sm"><thead className="bg-muted/50 border-b border-border"><tr><th className="text-left px-4 py-3 font-semibold">Nome</th><th className="text-left px-4 py-3 font-semibold">Papel</th><th className="text-left px-4 py-3 font-semibold">Status</th><th className="text-right px-4 py-3 font-semibold">Ações</th></tr></thead><tbody className="divide-y divide-border">{usuarios.map(u => (<tr key={u.id} className="hover:bg-muted/20"><td className="px-4 py-3 font-medium">{u.nome}</td><td className="px-4 py-3"><span className="px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full uppercase">{ROLES.find(r => r.value === u.role)?.label || u.role}</span></td><td className="px-4 py-3">{u.ativo ? 'Ativo' : 'Inativo'}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => abrirEdicaoUsuario(u)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:bg-muted text-xs font-semibold"><Pencil className="h-3.5 w-3.5" /> Editar</button></td></tr>))}</tbody></table>
              </div>
            )}
            {modalUsuario && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center"><h3 className="text-lg font-bold">Cadastrar Profissional</h3><button onClick={() => setModalUsuario(false)} className="p-1 rotate-45"><Plus className="h-5 w-5" /></button></div>
                  <form onSubmit={addUsuario} className="p-6 space-y-4">
                    <input value={novoUser.nome} onChange={e => setNovoUser({ ...novoUser, nome: textoCadastroMaiusculo(e.target.value) })} className={inputClass} placeholder="NOME COMPLETO" required />
                    <input type="email" value={novoUser.email} onChange={e => setNovoUser({...novoUser, email: e.target.value})} className={inputClass} placeholder="E-mail" required />
                    <input type="password" value={novoUser.senha} onChange={e => setNovoUser({...novoUser, senha: e.target.value})} className={inputClass} placeholder="Senha" required />
                    <select value={novoUser.role} onChange={e => setNovoUser({...novoUser, role: e.target.value})} className={inputClass}>{ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select>
                    {novoUser.role === 'MEDICO' && <input value={novoUser.crm} onChange={e => setNovoUser({ ...novoUser, crm: e.target.value })} className={inputClass} placeholder="CRM" />}
                    {['ENFERMEIRO', 'TECNICO_ENFERMAGEM'].includes(novoUser.role) && <input value={novoUser.coren} onChange={e => setNovoUser({ ...novoUser, coren: e.target.value })} className={inputClass} placeholder="COREN" />}
                    <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setModalUsuario(false)} className="px-4 py-2">Cancelar</button><button type="submit" disabled={salvandoUser} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md">{salvandoUser ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Usuário'}</button></div>
                  </form>
                </div>
              </div>
            )}
            {modalEditarUsuario && usuarioEditando && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
                    <h3 className="text-lg font-bold">Editar usuário</h3>
                    <button type="button" onClick={() => { setModalEditarUsuario(false); setUsuarioEditando(null); }} className="p-1 rotate-45"><Plus className="h-5 w-5" /></button>
                  </div>
                  <form onSubmit={salvarUsuarioEdicao} className="p-6 space-y-4">
                    <input value={formUsuarioEdicao.nome} onChange={(e) => setFormUsuarioEdicao({ ...formUsuarioEdicao, nome: textoCadastroMaiusculo(e.target.value) })} className={inputClass} placeholder="NOME COMPLETO" required />
                    <input type="email" value={formUsuarioEdicao.email} onChange={(e) => setFormUsuarioEdicao({ ...formUsuarioEdicao, email: e.target.value })} className={inputClass} placeholder="E-mail" required />
                    <input type="password" value={formUsuarioEdicao.senha} onChange={(e) => setFormUsuarioEdicao({ ...formUsuarioEdicao, senha: e.target.value })} className={inputClass} placeholder="Nova senha (deixe em branco para manter)" autoComplete="new-password" />
                    <select value={formUsuarioEdicao.role} onChange={(e) => setFormUsuarioEdicao({ ...formUsuarioEdicao, role: e.target.value })} className={inputClass}>{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formUsuarioEdicao.ativo} onChange={(e) => setFormUsuarioEdicao({ ...formUsuarioEdicao, ativo: e.target.checked })} className="w-4 h-4 rounded" />
                      <span className="text-sm font-medium">Usuário ativo</span>
                    </label>
                    {formUsuarioEdicao.role === 'MEDICO' && (
                      <input value={formUsuarioEdicao.crm} onChange={(e) => setFormUsuarioEdicao({ ...formUsuarioEdicao, crm: e.target.value })} className={inputClass} placeholder="CRM" />
                    )}
                    {['ENFERMEIRO', 'TECNICO_ENFERMAGEM'].includes(formUsuarioEdicao.role) && (
                      <input value={formUsuarioEdicao.coren} onChange={(e) => setFormUsuarioEdicao({ ...formUsuarioEdicao, coren: e.target.value })} className={inputClass} placeholder="COREN" />
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => { setModalEditarUsuario(false); setUsuarioEditando(null); }} className="px-4 py-2">Cancelar</button>
                      <button type="submit" disabled={salvandoUsuarioEdicao} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md">
                        {salvandoUsuarioEdicao ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar alterações'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA: PAINEL */}
        {abaAtiva === 'PAINEL' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" /> Configurações do Painel
            </h2>
            <p className="text-sm text-muted-foreground">Personalize a voz, cores e comportamento do painel de espera.</p>
            <hr />

            {carregandoPainel ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : (
              <form onSubmit={salvarPainel} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Seção de Voz */}
                  <div className="space-y-4 p-5 bg-muted/20 rounded-xl border border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold flex items-center gap-2"><Volume2 className="h-4 w-4" /> Síntese de Voz</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={configPainel.vozAtiva} onChange={e => setConfigPainel({...configPainel, vozAtiva: e.target.checked})} className="sr-only peer" />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium block">Tipo de Voz</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setConfigPainel({...configPainel, tipoVoz: 'feminina'})} className={cn("py-2 rounded-lg border text-sm font-medium transition-all", configPainel.tipoVoz === 'feminina' ? "bg-primary text-white border-primary" : "bg-card hover:bg-muted")}>Feminina</button>
                        <button type="button" onClick={() => setConfigPainel({...configPainel, tipoVoz: 'masculina'})} className={cn("py-2 rounded-lg border text-sm font-medium transition-all", configPainel.tipoVoz === 'masculina' ? "bg-primary text-white border-primary" : "bg-card hover:bg-muted")}>Masculina</button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium block">Velocidade da Voz</label>
                      <input type="range" min="0.5" max="1.5" step="0.1" value={configPainel.velocidadeVoz} onChange={e => setConfigPainel({...configPainel, velocidadeVoz: parseFloat(e.target.value)})} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                      <div className="flex justify-between text-[10px] text-muted-foreground"><span>Lenta</span><span>Normal</span><span>Rápida</span></div>
                    </div>

                    <button type="button" onClick={testarVoz} className="w-full flex items-center justify-center gap-2 py-3 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all font-bold text-sm">
                      <Volume2 className="h-4 w-4" /> TESTAR VOZ AGORA
                    </button>
                  </div>

                  {/* Seção de Cores */}
                  <div className="space-y-4 p-5 bg-muted/20 rounded-xl border border-border">
                    <h3 className="font-bold flex items-center gap-2"><Palette className="h-4 w-4" /> Cores do Painel</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-sm font-medium">Cor Primária (Destaque)</label>
                        <input type="color" value={configPainel.corPrimaria} onChange={e => setConfigPainel({...configPainel, corPrimaria: e.target.value})} className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent" />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-sm font-medium">Cor de Fundo (Painel)</label>
                        <input type="color" value={configPainel.corSecundaria} onChange={e => setConfigPainel({...configPainel, corSecundaria: e.target.value})} className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent" />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-sm font-medium">Cor do Texto</label>
                        <input type="color" value={configPainel.corTexto} onChange={e => setConfigPainel({...configPainel, corTexto: e.target.value})} className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent" />
                      </div>
                    </div>
                    {/* Preview do Painel */}
                    <div className="mt-4 p-4 rounded-lg border border-border space-y-2" style={{ backgroundColor: configPainel.corSecundaria }}>
                      <div className="h-8 rounded flex items-center px-3 text-xs font-black shadow-sm" style={{ backgroundColor: configPainel.corPrimaria, color: '#fff' }}>
                        PREVIEW DO CHAMADO
                      </div>
                      <div className="text-xl font-black text-center py-2" style={{ color: configPainel.corTexto }}>
                        MÁRCIO SILVA
                      </div>
                      <div className="text-[10px] text-center uppercase font-bold" style={{ color: configPainel.corTexto, opacity: 0.7 }}>
                        Consultório 04
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button type="submit" disabled={salvandoPainel} className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                    {salvandoPainel ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Personalização'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ABA: SMTP */}
        {abaAtiva === 'SMTP' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Servidor SMTP (e-mail)
            </h2>
            <p className="text-sm text-muted-foreground">
              Usado para enviar o link de recuperação de senha. Defina também a variável de ambiente{' '}
              <code className="text-xs bg-muted px-1 rounded">NEXTAUTH_URL</code> com a URL pública do sistema.
            </p>
            <hr />
            {carregandoSmtp ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <form onSubmit={salvarSmtp} className="space-y-5 max-w-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smtp.ativo}
                    onChange={(e) => setSmtp({ ...smtp, ativo: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">Envio de e-mail ativo</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium">Host SMTP</label>
                    <input
                      value={smtp.host}
                      onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                      className={inputClass}
                      placeholder="smtp.seuprovedor.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Porta</label>
                    <input
                      type="number"
                      value={smtp.porta}
                      onChange={(e) => setSmtp({ ...smtp, porta: parseInt(e.target.value, 10) || 587 })}
                      className={inputClass}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-6">
                    <input
                      type="checkbox"
                      checked={smtp.secure}
                      onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">TLS/SSL (ex.: porta 465)</span>
                  </label>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium">Usuário SMTP</label>
                    <input
                      value={smtp.usuario}
                      onChange={(e) => setSmtp({ ...smtp, usuario: e.target.value })}
                      className={inputClass}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium">Senha SMTP</label>
                    <input
                      type="password"
                      value={smtp.senha}
                      onChange={(e) => setSmtp({ ...smtp, senha: e.target.value })}
                      className={inputClass}
                      placeholder={senhaSmtpPreenchida ? '•••••••• (deixe em branco para manter)' : 'Senha'}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium">E-mail remetente</label>
                    <input
                      type="email"
                      value={smtp.emailRemetente}
                      onChange={(e) => setSmtp({ ...smtp, emailRemetente: e.target.value })}
                      className={inputClass}
                      placeholder="naoresponda@hospital.gov.br"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium">Nome do remetente (opcional)</label>
                    <input
                      value={smtp.nomeRemetente}
                      onChange={(e) => setSmtp({ ...smtp, nomeRemetente: e.target.value })}
                      className={inputClass}
                      placeholder="PS Municipal"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={salvandoSmtp}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-70"
                  >
                    {salvandoSmtp ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Salvar SMTP
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
