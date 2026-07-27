'use client';
// components/recepcao/FormularioCadastroPaciente.tsx
// Formulário multi-step de cadastro de paciente (4 etapas)

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Check, ChevronRight, ChevronLeft, Plus, X, Search, Tag } from 'lucide-react';
import { schemaCriarPaciente, type CriarPacienteForm } from '@/lib/validations/paciente';
import { buscarCep } from '@/lib/cep';
import { cn } from '@/lib/utils';
import { notificarFilaAtualizada } from '@/lib/fila-triagem-sync';

const ETAPAS = [
  { id: 1, label: 'Dados Pessoais' },
  { id: 2, label: 'Endereço' },
  { id: 3, label: 'Saúde' },
  { id: 4, label: 'Revisão' },
];

const TIPO_SANGUINEO_OPTIONS = [
  { value: 'DESCONHECIDO', label: 'Não sabe' },
  { value: 'A_POSITIVO', label: 'A+' },
  { value: 'A_NEGATIVO', label: 'A-' },
  { value: 'B_POSITIVO', label: 'B+' },
  { value: 'B_NEGATIVO', label: 'B-' },
  { value: 'AB_POSITIVO', label: 'AB+' },
  { value: 'AB_NEGATIVO', label: 'AB-' },
  { value: 'O_POSITIVO', label: 'O+' },
  { value: 'O_NEGATIVO', label: 'O-' },
];

// Helper: aplicar máscara de CPF
function mascaraCpf(valor: string) {
  return valor.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
}

// Helper: aplicar máscara de telefone
function mascaraTelefone(valor: string) {
  return valor.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
}

// Helper: aplicar máscara de CEP
function mascaraCep(valor: string) {
  return valor.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').slice(0, 9);
}

// Campo de texto reutilizável
const Campo = ({ id, label, obrigatorio, erro, children }: {
  id: string; label: string; obrigatorio?: boolean; erro?: string; children: React.ReactNode;
}) => (
  <div className="form-field">
    <label htmlFor={id} className="text-xs font-medium">
      {label}{obrigatorio && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {children}
    {erro && <p className="text-xs text-destructive">{erro}</p>}
  </div>
);

export function FormularioCadastroPaciente({ pacienteId }: { pacienteId?: string }) {
  const router = useRouter();
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [novaAlergia, setNovaAlergia] = useState('');
  const [carregandoEdicao, setCarregandoEdicao] = useState(!!pacienteId);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [origens, setOrigens] = useState<{ id: string; descricao: string }[]>([]);
  const [origemId, setOrigemId] = useState('');
  const [encaminharTriagem, setEncaminharTriagem] = useState(true);
  const [obstetrico, setObstetrico] = useState(false);
  const [vaiInternar, setVaiInternar] = useState(false);
  const [carregandoOrigens, setCarregandoOrigens] = useState(false);

  const form = useForm<CriarPacienteForm>({
    resolver: zodResolver(schemaCriarPaciente),
    defaultValues: {
      dadosPessoais: { nome: '', cpf: '', dataNascimento: '', sexoBiologico: 'MASCULINO' },
      endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' },
      dadosSaude: { tipoSanguineo: 'DESCONHECIDO', alergias: [], medicamentosContinuos: [] },
      observacoesIniciais: '',
    },
  });

  const cpfValue = form.watch('dadosPessoais.cpf');

  useEffect(() => {
    if (pacienteId) return;

    async function carregarOrigens() {
      setCarregandoOrigens(true);
      try {
        const res = await fetch('/api/configuracoes/origens');
        const json = await res.json();
        if (json.sucesso && json.dados?.length) {
          setOrigens(json.dados);
          setOrigemId(json.dados[0].id);
        }
      } catch {
        /* ignora — usuário pode abrir atendimento depois na recepção */
      } finally {
        setCarregandoOrigens(false);
      }
    }

    carregarOrigens();
  }, [pacienteId]);

  // Carregar dados se for edição
  useEffect(() => {
    if (!pacienteId) return

    async function carregar() {
      setCarregandoEdicao(true)
      setErroCarregamento(null)
      try {
        const res = await fetch(`/api/pacientes/${pacienteId}`)
        const json = await res.json()
        if (!json.sucesso || !json.dados) {
          setErroCarregamento(json.erro ?? 'Não foi possível carregar os dados do paciente.')
          return
        }
        const p = json.dados
        form.reset({
          dadosPessoais: {
            nome: p.nomeExibicao ?? '',
            cpf: p.cpfCriptografado ? mascaraCpf(p.cpfCriptografado) : '',
            dataNascimento: new Date(p.dataNascimento).toISOString().split('T')[0],
            sexoBiologico: p.sexoBiologico,
            rg: p.rgCriptografado ?? '',
            telefone: p.telefoneCriptografado ? mascaraTelefone(String(p.telefoneCriptografado)) : '',
            genero: p.genero || '',
            naturalidade: p.naturalidade || '',
            nomeMae: p.nomeMae || '',
            escolaridade: p.escolaridade || '',
            racaCor: p.racaCor || '',
            cns: p.cns || '',
            profissao: p.profissao || '',
            acompanhanteNome: p.acompanhanteNome || '',
            acompanhanteTelefone: p.acompanhanteTelefone || '',
          },
          endereco: {
            cep: p.endereco?.cep ? mascaraCep(p.endereco.cep) : '',
            logradouro: p.endereco?.logradouro || '',
            numero: p.endereco?.numero || '',
            bairro: p.endereco?.bairro || '',
            cidade: p.endereco?.cidade || '',
            estado: p.endereco?.estado || '',
            complemento: p.endereco?.complemento || '',
          },
          dadosSaude: {
            tipoSanguineo: p.tipoSanguineo || 'DESCONHECIDO',
            convenio: p.convenio || '',
            numeroCarteirinha: p.numeroCarteirinha || '',
            alergias: [],
            medicamentosContinuos: p.medicamentosCont?.map((m: { nome: string; dose: string; frequencia: string; observacoes?: string }) => ({
              nome: m.nome, dose: m.dose, frequencia: m.frequencia, observacoes: m.observacoes || ''
            })) || [],
          },
          observacoesIniciais: p.observacoesIniciais || '',
        })
      } catch {
        setErroCarregamento('Erro de conexão ao carregar o paciente.')
      } finally {
        setCarregandoEdicao(false)
      }
    }

    carregar()
  }, [pacienteId, form])

  // Validação de CPF em tempo real (duplicidade)
  useEffect(() => {
    if (cpfValue?.length === 14) {
      async function validarCpfExistente() {
        try {
          const res = await fetch(`/api/pacientes?cpf=${cpfValue}`);
          const json = await res.json();
          if (json.sucesso && json.dados) {
            form.setError('dadosPessoais.cpf', {
              type: 'manual',
              message: 'CPF já cadastrado (Paciente: ' + json.dados.nomeExibicao + ')'
            });
          }
        } catch (e) {
          // ignora erro silenciosamente
        }
      }
      validarCpfExistente();
    }
  }, [cpfValue, form]);



  const { fields: medicamentos, append: addMedicamento, remove: removeMedicamento } = useFieldArray({
    control: form.control,
    name: 'dadosSaude.medicamentosContinuos',
  });

  // Autopreenchimento de endereço via ViaCEP
  const handleBuscarCep = useCallback(async () => {
    const cep = form.getValues('endereco.cep');
    setBuscandoCep(true);
    try {
      const dados = await buscarCep(cep);
      form.setValue('endereco.logradouro', dados.logradouro);
      form.setValue('endereco.bairro', dados.bairro);
      form.setValue('endereco.cidade', dados.cidade);
      form.setValue('endereco.estado', dados.estado);
      form.setFocus('endereco.numero');
      toast.success('Endereço preenchido automaticamente!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'CEP não encontrado.');
    } finally {
      setBuscandoCep(false);
    }
  }, [form]);

  async function onSubmit(dados: CriarPacienteForm) {
    if (!pacienteId && encaminharTriagem && !origemId) {
      toast.error('Selecione a origem do paciente para encaminhar à triagem.');
      setEtapaAtual(4);
      return;
    }

    try {
      const url = pacienteId ? `/api/pacientes/${pacienteId}` : '/api/pacientes';
      const method = pacienteId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const json = await res.json();
      if (!json.sucesso) {
        toast.error(json.erro ?? `Erro ao ${pacienteId ? 'atualizar' : 'cadastrar'} paciente.`);
        return;
      }

      const idPaciente = pacienteId ?? json.dados?.id;
      let encaminhado = false;

      if (!pacienteId && encaminharTriagem && idPaciente && origemId) {
        const resAt = await fetch('/api/atendimentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pacienteId: idPaciente, origemId, obstetrico, vaiInternar }),
        });
        const jsonAt = await resAt.json();
        if (!jsonAt.sucesso) {
          toast.warning('Paciente cadastrado, mas não foi possível abrir atendimento.', {
            description: jsonAt.erro ?? 'Use + Atendimento na recepção.',
          });
          router.push('/recepcao?cadastrado=1');
          router.refresh();
          return;
        }
        encaminhado = true;
        notificarFilaAtualizada('NOVO_ATENDIMENTO');
      }

      toast.success(`Paciente ${pacienteId ? 'atualizado' : 'cadastrado'} com sucesso!`);
      if (encaminhado) {
        router.push('/recepcao?cadastrado=triagem');
      } else {
        router.push(pacienteId ? '/recepcao' : '/recepcao?cadastrado=1');
      }
      router.refresh();
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    }
  }

  const { isSubmitting, errors } = form.formState;

  const inputClass = (erro?: string) => cn(
    'w-full px-3 py-2 rounded-lg border bg-background text-xs outline-none transition-all',
    'focus:ring-2 focus:ring-primary/30 focus:border-primary',
    erro ? 'border-destructive' : 'border-input'
  );

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {carregandoEdicao ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Carregando dados do paciente…
        </div>
      ) : erroCarregamento ? (
        <div className="p-8 text-center space-y-3">
          <p className="text-sm text-destructive font-medium">{erroCarregamento}</p>
          <p className="text-xs text-muted-foreground">
            Se o erro mencionar ENCRYPTION_KEY, configure-a no .env da VPS e reinicie o PM2.
          </p>
        </div>
      ) : (
        <>
      {/* Stepper */}
      <div className="flex border-b border-border bg-muted/30">
        {ETAPAS.map((etapa, idx) => (
          <div key={etapa.id} className="flex-1 flex items-center justify-center py-4 gap-2 relative">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
              etapaAtual > etapa.id ? 'bg-green-500 text-white' :
              etapaAtual === etapa.id ? 'bg-primary text-white' :
              'bg-muted text-muted-foreground border border-border'
            )}>
              {etapaAtual > etapa.id ? <Check className="h-3.5 w-3.5" /> : etapa.id}
            </div>
            <span className={cn('text-xs font-medium hidden sm:block', etapaAtual === etapa.id ? 'text-foreground' : 'text-muted-foreground')}>
              {etapa.label}
            </span>
            {idx < ETAPAS.length - 1 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 bg-border" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="p-8">
        {/* ===================== ETAPA 1: DADOS PESSOAIS ===================== */}
        {etapaAtual === 1 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Campo id="nome" label="Nome Completo" obrigatorio erro={errors.dadosPessoais?.nome?.message}>
                  <input id="nome" {...form.register('dadosPessoais.nome')} className={inputClass(errors.dadosPessoais?.nome?.message)} placeholder="Maria Aparecida Santos" />
                </Campo>
              </div>
              <Campo id="cpf" label="CPF" obrigatorio erro={errors.dadosPessoais?.cpf?.message}>
                <input id="cpf" {...form.register('dadosPessoais.cpf')} className={inputClass(errors.dadosPessoais?.cpf?.message)} placeholder="000.000.000-00"
                  onChange={e => form.setValue('dadosPessoais.cpf', mascaraCpf(e.target.value))} maxLength={14} />
              </Campo>
              <Campo id="rg" label="RG" erro={errors.dadosPessoais?.rg?.message}>
                <input id="rg" {...form.register('dadosPessoais.rg')} className={inputClass()} placeholder="00.000.000-0" />
              </Campo>
              <Campo id="dataNascimento" label="Data de Nascimento" obrigatorio erro={errors.dadosPessoais?.dataNascimento?.message}>
                <input id="dataNascimento" type="date" {...form.register('dadosPessoais.dataNascimento')} className={inputClass(errors.dadosPessoais?.dataNascimento?.message)} />
              </Campo>
              <Campo id="telefone" label="Telefone" erro={errors.dadosPessoais?.telefone?.message}>
                <input id="telefone" {...form.register('dadosPessoais.telefone')} className={inputClass()} placeholder="(11) 99999-9999"
                  onChange={e => form.setValue('dadosPessoais.telefone', mascaraTelefone(e.target.value))} maxLength={15} />
              </Campo>
              <Campo id="sexoBiologico" label="Sexo Biológico" obrigatorio erro={errors.dadosPessoais?.sexoBiologico?.message}>
                <select id="sexoBiologico" {...form.register('dadosPessoais.sexoBiologico')} className={inputClass()}>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                  <option value="INTERSEXO">Intersexo</option>
                </select>
              </Campo>
              <Campo id="genero" label="Gênero (campo livre)">
                <input id="genero" {...form.register('dadosPessoais.genero')} className={inputClass()} placeholder="Como o paciente se identifica" />
              </Campo>

              <Campo id="naturalidade" label="Naturalidade">
                <input id="naturalidade" {...form.register('dadosPessoais.naturalidade')} className={inputClass()} placeholder="Ex: São Paulo - SP" />
              </Campo>
              <Campo id="nomeMae" label="Nome da Mãe">
                <input id="nomeMae" {...form.register('dadosPessoais.nomeMae')} className={inputClass()} placeholder="Nome completo da mãe" />
              </Campo>
              <Campo id="escolaridade" label="Escolaridade">
                <select id="escolaridade" {...form.register('dadosPessoais.escolaridade')} className={inputClass()}>
                  <option value="">Selecione...</option>
                  <option value="ANALFABETO">Analfabeto</option>
                  <option value="FUNDAMENTAL_INCOMPLETO">Ensino Fundamental Incompleto</option>
                  <option value="FUNDAMENTAL_COMPLETO">Ensino Fundamental Completo</option>
                  <option value="MEDIO_INCOMPLETO">Ensino Médio Incompleto</option>
                  <option value="MEDIO_COMPLETO">Ensino Médio Completo</option>
                  <option value="SUPERIOR_INCOMPLETO">Ensino Superior Incompleto</option>
                  <option value="SUPERIOR_COMPLETO">Ensino Superior Completo</option>
                </select>
              </Campo>
              <Campo id="racaCor" label="Raça / Cor">
                <select id="racaCor" {...form.register('dadosPessoais.racaCor')} className={inputClass()}>
                  <option value="">Selecione...</option>
                  <option value="BRANCA">Branca</option>
                  <option value="PRETA">Preta</option>
                  <option value="PARDA">Parda</option>
                  <option value="AMARELA">Amarela</option>
                  <option value="INDIGENA">Indígena</option>
                </select>
              </Campo>
              <Campo id="cns" label="Cartão Nacional de Saúde (CNS)">
                <input id="cns" {...form.register('dadosPessoais.cns')} className={inputClass()} placeholder="000.0000.0000.0000" />
              </Campo>
              <Campo id="profissao" label="Profissão">
                <input id="profissao" {...form.register('dadosPessoais.profissao')} className={inputClass()} placeholder="Ex: Professor, Pedreiro..." />
              </Campo>

              <div className="md:col-span-2 pt-2 pb-1 border-t border-border mt-2">
                <h4 className="text-sm font-semibold">Dados do Acompanhante / Responsável</h4>
              </div>
              <Campo id="acompanhanteNome" label="Nome do Acompanhante">
                <input id="acompanhanteNome" {...form.register('dadosPessoais.acompanhanteNome')} className={inputClass()} placeholder="Nome do responsável" />
              </Campo>
              <Campo id="acompanhanteTelefone" label="Telefone do Acompanhante">
                <input id="acompanhanteTelefone" {...form.register('dadosPessoais.acompanhanteTelefone')} className={inputClass()} placeholder="(11) 99999-9999" 
                  onChange={e => form.setValue('dadosPessoais.acompanhanteTelefone', mascaraTelefone(e.target.value))} maxLength={15} />
              </Campo>
            </div>
          </div>
        )}

        {/* ===================== ETAPA 2: ENDEREÇO ===================== */}
        {etapaAtual === 2 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Campo id="cep" label="CEP" obrigatorio erro={errors.endereco?.cep?.message}>
                <div className="flex gap-2">
                  <input id="cep" {...form.register('endereco.cep')} className={cn(inputClass(errors.endereco?.cep?.message), 'flex-1')} placeholder="00000-000"
                    onChange={e => form.setValue('endereco.cep', mascaraCep(e.target.value))} maxLength={9} />
                  <button type="button" onClick={handleBuscarCep} disabled={buscandoCep}
                    className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 shrink-0">
                    {buscandoCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </button>
                </div>
              </Campo>
              <div className="md:col-span-2">
                <Campo id="logradouro" label="Logradouro" obrigatorio erro={errors.endereco?.logradouro?.message}>
                  <input id="logradouro" {...form.register('endereco.logradouro')} className={inputClass(errors.endereco?.logradouro?.message)} placeholder="Rua, Avenida..." />
                </Campo>
              </div>
              <Campo id="numero" label="Número" obrigatorio erro={errors.endereco?.numero?.message}>
                <input id="numero" {...form.register('endereco.numero')} className={inputClass(errors.endereco?.numero?.message)} placeholder="123" />
              </Campo>
              <Campo id="complemento" label="Complemento">
                <input id="complemento" {...form.register('endereco.complemento')} className={inputClass()} placeholder="Apto, Bloco..." />
              </Campo>
              <Campo id="bairro" label="Bairro" obrigatorio erro={errors.endereco?.bairro?.message}>
                <input id="bairro" {...form.register('endereco.bairro')} className={inputClass(errors.endereco?.bairro?.message)} />
              </Campo>
              <Campo id="cidade" label="Cidade" obrigatorio erro={errors.endereco?.cidade?.message}>
                <input id="cidade" {...form.register('endereco.cidade')} className={inputClass(errors.endereco?.cidade?.message)} />
              </Campo>
              <Campo id="estado" label="Estado" obrigatorio erro={errors.endereco?.estado?.message}>
                <input id="estado" {...form.register('endereco.estado')} className={inputClass(errors.endereco?.estado?.message)} placeholder="SP" maxLength={2}
                  onChange={e => form.setValue('endereco.estado', e.target.value.toUpperCase())} />
              </Campo>
            </div>
          </div>
        )}

        {/* ===================== ETAPA 3: SAÚDE ===================== */}
        {etapaAtual === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Dados de Saúde</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <Campo id="tipoSanguineo" label="Tipo Sanguíneo" obrigatorio>
                <select id="tipoSanguineo" {...form.register('dadosSaude.tipoSanguineo')} className={inputClass()}>
                  {TIPO_SANGUINEO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Campo>
              <Campo id="convenio" label="Convênio / Plano">
                <input id="convenio" {...form.register('dadosSaude.convenio')} className={inputClass()} placeholder="Unimed, Bradesco... (vazio = particular)" />
              </Campo>
              <Campo id="numeroCarteirinha" label="Nº Carteirinha">
                <input id="numeroCarteirinha" {...form.register('dadosSaude.numeroCarteirinha')} className={inputClass()} />
              </Campo>
            </div>

            {/* Medicamentos contínuos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Medicamentos de uso contínuo</label>
                <button type="button" onClick={() => addMedicamento({ nome: '', dose: '', frequencia: '' })}
                  className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
              </div>
              {medicamentos.map((m, i) => (
                <div key={m.id} className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <input {...form.register(`dadosSaude.medicamentosContinuos.${i}.nome`)} placeholder="Nome do medicamento" className={inputClass()} />
                  <input {...form.register(`dadosSaude.medicamentosContinuos.${i}.dose`)} placeholder="Dose (ex: 500mg)" className={inputClass()} />
                  <div className="flex gap-2">
                    <input {...form.register(`dadosSaude.medicamentosContinuos.${i}.frequencia`)} placeholder="Frequência (ex: 1x ao dia)" className={cn(inputClass(), 'flex-1')} />
                    <button type="button" onClick={() => removeMedicamento(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Observações iniciais */}
            <Campo id="observacoes" label="Observações iniciais">
              <textarea id="observacoes" {...form.register('observacoesIniciais')} rows={3}
                className={cn(inputClass(), 'resize-none')} placeholder="Informações relevantes coletadas na recepção..." />
            </Campo>
          </div>
        )}

        {/* ===================== ETAPA 4: REVISÃO ===================== */}
        {etapaAtual === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Revisão dos dados</h3>
            <div className="grid gap-3">
              {[
                { titulo: 'Dados Pessoais', itens: [
                  ['Nome', form.getValues('dadosPessoais.nome')],
                  ['CPF', form.getValues('dadosPessoais.cpf')],
                  ['Nascimento', form.getValues('dadosPessoais.dataNascimento')],
                  ['Sexo', form.getValues('dadosPessoais.sexoBiologico')],
                ]},
                { titulo: 'Endereço', itens: [
                  ['Logradouro', `${form.getValues('endereco.logradouro')}, ${form.getValues('endereco.numero')}`],
                  ['Bairro', form.getValues('endereco.bairro')],
                  ['Cidade/UF', `${form.getValues('endereco.cidade')} — ${form.getValues('endereco.estado')}`],
                  ['CEP', form.getValues('endereco.cep')],
                ]},
              ].map(secao => (
                <div key={secao.titulo} className="bg-muted/30 rounded-lg border border-border p-3">
                  <h4 className="font-semibold mb-2 text-[10px] text-muted-foreground uppercase tracking-wide">{secao.titulo}</h4>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {secao.itens.map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[10px] text-muted-foreground">{k}</dt>
                        <dd className="text-xs font-medium text-foreground">{v || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}

              {!pacienteId && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800 p-3 space-y-3">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={encaminharTriagem}
                      onChange={(e) => setEncaminharTriagem(e.target.checked)}
                      className="mt-0.5 rounded border-input"
                    />
                    <span className="text-xs font-medium text-emerald-950 dark:text-emerald-50">
                      Encaminhar para triagem após cadastro
                    </span>
                  </label>

                  {encaminharTriagem && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" /> Origem do paciente *
                      </label>
                      {carregandoOrigens ? (
                        <div className="p-2 text-xs text-muted-foreground bg-muted/30 rounded-lg flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando origens...
                        </div>
                      ) : origens.length === 0 ? (
                        <p className="text-[10px] text-amber-700 dark:text-amber-400">
                          Nenhuma origem cadastrada. Configure em Configurações ou use + Atendimento depois.
                        </p>
                      ) : (
                        <select
                          value={origemId}
                          onChange={(e) => setOrigemId(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="">Selecione a origem...</option>
                          {origens.map((o) => (
                            <option key={o.id} value={o.id}>{o.descricao}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={obstetrico}
                        onChange={(e) => setObstetrico(e.target.checked)}
                        className="rounded border-input"
                      />
                      <span className="font-medium text-emerald-950 dark:text-emerald-50">
                        Atendimento obstétrico (gestante/puérpera)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vaiInternar}
                        onChange={(e) => setVaiInternar(e.target.checked)}
                        className="rounded border-input"
                      />
                      <span className="font-medium text-emerald-950 dark:text-emerald-50">
                        Indicação de internação
                      </span>
                    </label>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Navegação entre etapas */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button type="button" onClick={() => setEtapaAtual(e => e - 1)} disabled={etapaAtual === 1}
            className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </button>

          {etapaAtual < ETAPAS.length ? (
            <button type="button" onClick={() => setEtapaAtual(e => e + 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
              Próximo <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting} id="btn-cadastrar-paciente"
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60">
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</> : <><Check className="h-4 w-4" />Cadastrar Paciente</>}
            </button>
          )}
        </div>
      </form>
        </>
      )}
    </div>
  );
}
