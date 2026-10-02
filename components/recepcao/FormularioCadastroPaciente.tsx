// components/recepcao/FormularioCadastroPaciente.tsx
// Formulário completo de cadastro/edição de paciente em tela única (Single-Page Form)
// Padrão hospitalar moderno: visual limpo, alta densidade de informação e autopreenchimento rápido

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Loader2,
  Check,
  Plus,
  X,
  Search,
  Tag,
  User,
  MapPin,
  HeartPulse,
  Save,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Phone,
  CreditCard,
  AlertCircle,
  Stethoscope,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import { schemaCriarPaciente, type CriarPacienteForm } from '@/lib/validations/paciente';
import { buscarCep } from '@/lib/cep';
import { cn } from '@/lib/utils';
import { notificarFilaAtualizada } from '@/lib/fila-triagem-sync';

const TIPO_SANGUINEO_OPTIONS = [
  { value: 'DESCONHECIDO', label: 'Não informado' },
  { value: 'A_POSITIVO', label: 'A+' },
  { value: 'A_NEGATIVO', label: 'A-' },
  { value: 'B_POSITIVO', label: 'B+' },
  { value: 'B_NEGATIVO', label: 'B-' },
  { value: 'AB_POSITIVO', label: 'AB+' },
  { value: 'AB_NEGATIVO', label: 'AB-' },
  { value: 'O_POSITIVO', label: 'O+' },
  { value: 'O_NEGATIVO', label: 'O-' },
];

const RACA_COR_OPTIONS = [
  'Não declarada',
  'Branca',
  'Preta',
  'Parda',
  'Amarela',
  'Indígena',
];

const ESTADO_CIVIL_OPTIONS = [
  'Solteiro(a)',
  'Casado(a)',
  'União Estável',
  'Divorciado(a)',
  'Viúvo(a)',
  'Outro',
];

// Helpers de máscaras
function mascaraCpf(valor: string) {
  return valor.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
}

function mascaraTelefone(valor: string) {
  return valor.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
}

function mascaraCep(valor: string) {
  return valor.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').slice(0, 9);
}

function mascaraCns(valor: string) {
  return valor.replace(/\D/g, '').slice(0, 15);
}

function calcularIdade(dataNascStr?: string): string {
  if (!dataNascStr) return '';
  const nasc = new Date(dataNascStr);
  if (isNaN(nasc.getTime())) return '';
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    anos--;
  }
  return anos >= 0 ? `${anos} anos` : '';
}

// Componente de Campo Reutilizável
const Campo = ({
  id,
  label,
  obrigatorio,
  erro,
  dica,
  children,
  className,
}: {
  id: string;
  label: string;
  obrigatorio?: boolean;
  erro?: string;
  dica?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('space-y-1', className)}>
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-xs font-semibold text-foreground/90">
        {label}
        {obrigatorio && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {dica && <span className="text-[10px] text-muted-foreground">{dica}</span>}
    </div>
    {children}
    {erro && <p className="text-[11px] text-destructive font-medium">{erro}</p>}
  </div>
);

export function FormularioCadastroPaciente({ pacienteId }: { pacienteId?: string }) {
  const router = useRouter();
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
      dadosPessoais: {
        nome: '',
        cpf: '',
        rg: '',
        dataNascimento: '',
        sexoBiologico: 'MASCULINO',
        genero: '',
        telefone: '',
        nomeMae: '',
        cns: '',
        racaCor: 'Não declarada',
        escolaridade: '',
        profissao: '',
        naturalidade: '',
        acompanhanteNome: '',
        acompanhanteTelefone: '',
      },
      endereco: {
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        complemento: '',
      },
      dadosSaude: {
        tipoSanguineo: 'DESCONHECIDO',
        convenio: 'Particular',
        numeroCarteirinha: '',
        alergias: [],
        medicamentosContinuos: [],
      },
      observacoesIniciais: '',
    },
  });

  const cpfValue = form.watch('dadosPessoais.cpf');
  const dataNascimentoValue = form.watch('dadosPessoais.dataNascimento');
  const alergias = form.watch('dadosSaude.alergias') || [];

  const idadeCalculada = useMemo(() => calcularIdade(dataNascimentoValue), [dataNascimentoValue]);

  // Carregar lista de origens para recepção
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
        // ignora
      } finally {
        setCarregandoOrigens(false);
      }
    }

    carregarOrigens();
  }, [pacienteId]);

  // Carregar dados existentes em caso de edição
  useEffect(() => {
    if (!pacienteId) return;

    async function carregar() {
      setCarregandoEdicao(true);
      setErroCarregamento(null);
      try {
        const res = await fetch(`/api/pacientes/${pacienteId}`);
        const json = await res.json();
        if (!json.sucesso || !json.dados) {
          setErroCarregamento(json.erro ?? 'Não foi possível carregar os dados do paciente.');
          return;
        }
        const p = json.dados;
        form.reset({
          dadosPessoais: {
            nome: p.nomeExibicao ?? '',
            cpf: p.cpfCriptografado ? mascaraCpf(p.cpfCriptografado) : '',
            dataNascimento: p.dataNascimento ? new Date(p.dataNascimento).toISOString().split('T')[0] : '',
            sexoBiologico: p.sexoBiologico || 'MASCULINO',
            rg: p.rgCriptografado ?? '',
            telefone: p.telefoneCriptografado ? mascaraTelefone(String(p.telefoneCriptografado)) : '',
            genero: p.genero || '',
            naturalidade: p.naturalidade || '',
            nomeMae: p.nomeMae || '',
            escolaridade: p.escolaridade || '',
            racaCor: p.racaCor || 'Não declarada',
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
            convenio: p.convenio || 'Particular',
            numeroCarteirinha: p.numeroCarteirinha || '',
            alergias: p.alergias?.map((a: { descricao: string; gravidade?: 'Leve' | 'Moderada' | 'Grave' }) => ({
              descricao: a.descricao,
              gravidade: a.gravidade,
            })) || [],
            medicamentosContinuos:
              p.medicamentosCont?.map((m: { nome: string; dose: string; frequencia: string; observacoes?: string }) => ({
                nome: m.nome,
                dose: m.dose,
                frequencia: m.frequencia,
                observacoes: m.observacoes || '',
              })) || [],
          },
          observacoesIniciais: p.observacoesIniciais || '',
        });
      } catch {
        setErroCarregamento('Erro de conexão ao carregar o paciente.');
      } finally {
        setCarregandoEdicao(false);
      }
    }

    carregar();
  }, [pacienteId, form]);

  // Validação de CPF em tempo real (duplicidade)
  useEffect(() => {
    if (cpfValue?.length === 14 && !pacienteId) {
      async function validarCpfExistente() {
        try {
          const res = await fetch(`/api/pacientes?cpf=${cpfValue}`);
          const json = await res.json();
          if (json.sucesso && json.dados) {
            form.setError('dadosPessoais.cpf', {
              type: 'manual',
              message: `CPF já cadastrado para o paciente: ${json.dados.nomeExibicao}`,
            });
          }
        } catch {
          // ignora
        }
      }
      validarCpfExistente();
    }
  }, [cpfValue, pacienteId, form]);

  // Medicamentos de uso contínuo
  const { fields: medicamentos, append: addMedicamento, remove: removeMedicamento } = useFieldArray({
    control: form.control,
    name: 'dadosSaude.medicamentosContinuos',
  });

  // Autopreenchimento de endereço via ViaCEP
  const handleBuscarCep = useCallback(async () => {
    const cep = form.getValues('endereco.cep');
    if (!cep || cep.replace(/\D/g, '').length < 8) {
      toast.warning('Digite um CEP válido com 8 dígitos.');
      return;
    }
    setBuscandoCep(true);
    try {
      const dados = await buscarCep(cep);
      form.setValue('endereco.logradouro', dados.logradouro);
      form.setValue('endereco.bairro', dados.bairro);
      form.setValue('endereco.cidade', dados.cidade);
      form.setValue('endereco.estado', dados.estado);
      form.setFocus('endereco.numero');
      toast.success('Endereço localizado e preenchido automaticamente!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'CEP não encontrado.');
    } finally {
      setBuscandoCep(false);
    }
  }, [form]);

  // Gerenciamento de tags de alergias
  const adicionarAlergia = () => {
    const item = novaAlergia.trim();
    if (!item) return;
    const atuais = form.getValues('dadosSaude.alergias') || [];
    if (!atuais.some((a) => a.descricao.toLowerCase() === item.toLowerCase())) {
      form.setValue('dadosSaude.alergias', [...atuais, { descricao: item }]);
    }
    setNovaAlergia('');
  };

  const removerAlergia = (descricao: string) => {
    const atuais = form.getValues('dadosSaude.alergias') || [];
    form.setValue(
      'dadosSaude.alergias',
      atuais.filter((a) => a.descricao !== descricao)
    );
  };

  async function onSubmit(dados: CriarPacienteForm) {
    if (!pacienteId && encaminharTriagem && !origemId) {
      toast.error('Selecione a origem do paciente para encaminhar à triagem.');
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
            description: jsonAt.erro ?? 'Abra o atendimento manualmente na recepção.',
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
      toast.error('Erro de conexão ao salvar paciente. Tente novamente.');
    }
  }

  const { isSubmitting, errors } = form.formState;

  const inputClass = (erro?: string) =>
    cn(
      'w-full px-3 py-2 rounded-lg border bg-background text-xs outline-none transition-all',
      'focus:ring-2 focus:ring-primary/30 focus:border-primary',
      erro ? 'border-destructive ring-1 ring-destructive/40' : 'border-input hover:border-slate-400/60'
    );

  if (carregandoEdicao) {
    return (
      <div className="bg-card border border-border rounded-2xl shadow-sm p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando prontuário e ficha do paciente…</p>
      </div>
    );
  }

  if (erroCarregamento) {
    return (
      <div className="bg-card border border-destructive/30 rounded-2xl shadow-sm p-12 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-sm text-destructive font-semibold">{erroCarregamento}</p>
        <Link
          href="/recepcao"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à Recepção
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Barra de Ações Superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border/80 px-5 py-3.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/recepcao"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Voltar à Recepção"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">
              {pacienteId ? 'Edição de Cadastro de Paciente' : 'Novo Cadastro de Paciente'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Formulário unificado para admissão rápida e registro clínico seguro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/recepcao"
            className="px-4 py-2 rounded-lg border border-input text-xs font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {pacienteId ? 'Salvar Alterações' : 'Concluir Cadastro'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* BLOCO 1: IDENTIFICAÇÃO E DADOS PESSOAIS */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground">1. Identificação & Dados Pessoais</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Nome Completo */}
          <Campo
            id="nome"
            label="Nome Completo"
            obrigatorio
            erro={errors.dadosPessoais?.nome?.message}
            className="sm:col-span-2 md:col-span-3"
          >
            <input
              id="nome"
              type="text"
              placeholder="Nome completo do paciente"
              {...form.register('dadosPessoais.nome')}
              className={inputClass(errors.dadosPessoais?.nome?.message)}
            />
          </Campo>

          {/* Nome Social / Identidade de Gênero */}
          <Campo
            id="genero"
            label="Nome Social / Identidade de Gênero"
            dica="Opcional"
            erro={errors.dadosPessoais?.genero?.message}
          >
            <input
              id="genero"
              type="text"
              placeholder="Ex: Nome social ou identidade"
              {...form.register('dadosPessoais.genero')}
              className={inputClass(errors.dadosPessoais?.genero?.message)}
            />
          </Campo>

          {/* CPF */}
          <Campo
            id="cpf"
            label="CPF"
            obrigatorio
            erro={errors.dadosPessoais?.cpf?.message}
          >
            <input
              id="cpf"
              type="text"
              placeholder="000.000.000-00"
              maxLength={14}
              {...form.register('dadosPessoais.cpf', {
                onChange: (e) => {
                  e.target.value = mascaraCpf(e.target.value);
                },
              })}
              className={inputClass(errors.dadosPessoais?.cpf?.message)}
            />
          </Campo>

          {/* Data de Nascimento */}
          <Campo
            id="dataNascimento"
            label="Data de Nascimento"
            obrigatorio
            dica={idadeCalculada ? `(${idadeCalculada})` : undefined}
            erro={errors.dadosPessoais?.dataNascimento?.message}
          >
            <input
              id="dataNascimento"
              type="date"
              {...form.register('dadosPessoais.dataNascimento')}
              className={inputClass(errors.dadosPessoais?.dataNascimento?.message)}
            />
          </Campo>

          {/* Sexo Biológico */}
          <Campo
            id="sexoBiologico"
            label="Sexo Biológico"
            obrigatorio
            erro={errors.dadosPessoais?.sexoBiologico?.message}
          >
            <select
              id="sexoBiologico"
              {...form.register('dadosPessoais.sexoBiologico')}
              className={inputClass(errors.dadosPessoais?.sexoBiologico?.message)}
            >
              <option value="MASCULINO">Masculino</option>
              <option value="FEMININO">Feminino</option>
              <option value="INTERSEXO">Intersexo / Outro</option>
            </select>
          </Campo>

          {/* Telefone / WhatsApp */}
          <Campo
            id="telefone"
            label="Telefone / Celular"
            erro={errors.dadosPessoais?.telefone?.message}
          >
            <input
              id="telefone"
              type="text"
              placeholder="(00) 00000-0000"
              maxLength={15}
              {...form.register('dadosPessoais.telefone', {
                onChange: (e) => {
                  e.target.value = mascaraTelefone(e.target.value);
                },
              })}
              className={inputClass(errors.dadosPessoais?.telefone?.message)}
            />
          </Campo>

          {/* Cartão SUS (CNS) */}
          <Campo id="cns" label="Cartão SUS (CNS)" erro={errors.dadosPessoais?.cns?.message}>
            <input
              id="cns"
              type="text"
              placeholder="15 dígitos numéricos"
              maxLength={15}
              {...form.register('dadosPessoais.cns', {
                onChange: (e) => {
                  e.target.value = mascaraCns(e.target.value);
                },
              })}
              className={inputClass(errors.dadosPessoais?.cns?.message)}
            />
          </Campo>

          {/* RG / Órgão Emissor */}
          <Campo id="rg" label="RG / Doc. Identidade" erro={errors.dadosPessoais?.rg?.message}>
            <input
              id="rg"
              type="text"
              placeholder="Número do documento"
              {...form.register('dadosPessoais.rg')}
              className={inputClass(errors.dadosPessoais?.rg?.message)}
            />
          </Campo>

          {/* Nome da Mãe */}
          <Campo
            id="nomeMae"
            label="Nome da Mãe"
            erro={errors.dadosPessoais?.nomeMae?.message}
            className="sm:col-span-2"
          >
            <input
              id="nomeMae"
              type="text"
              placeholder="Filiação materna completa"
              {...form.register('dadosPessoais.nomeMae')}
              className={inputClass(errors.dadosPessoais?.nomeMae?.message)}
            />
          </Campo>

          {/* Raça / Cor */}
          <Campo id="racaCor" label="Raça / Cor" erro={errors.dadosPessoais?.racaCor?.message}>
            <select
              id="racaCor"
              {...form.register('dadosPessoais.racaCor')}
              className={inputClass(errors.dadosPessoais?.racaCor?.message)}
            >
              {RACA_COR_OPTIONS.map((rc) => (
                <option key={rc} value={rc}>
                  {rc}
                </option>
              ))}
            </select>
          </Campo>

          {/* Naturalidade */}
          <Campo id="naturalidade" label="Naturalidade" erro={errors.dadosPessoais?.naturalidade?.message}>
            <input
              id="naturalidade"
              type="text"
              placeholder="Cidade/UF de nascimento"
              {...form.register('dadosPessoais.naturalidade')}
              className={inputClass(errors.dadosPessoais?.naturalidade?.message)}
            />
          </Campo>

          {/* Profissão */}
          <Campo id="profissao" label="Profissão / Ocupação" erro={errors.dadosPessoais?.profissao?.message}>
            <input
              id="profissao"
              type="text"
              placeholder="Ex: Autônomo, Estudante, etc."
              {...form.register('dadosPessoais.profissao')}
              className={inputClass(errors.dadosPessoais?.profissao?.message)}
            />
          </Campo>

          {/* Acompanhante / Contato de Emergência */}
          <Campo
            id="acompanhanteNome"
            label="Acompanhante / Contato de Emergência"
            erro={errors.dadosPessoais?.acompanhanteNome?.message}
            className="sm:col-span-2"
          >
            <input
              id="acompanhanteNome"
              type="text"
              placeholder="Nome do responsável ou acompanhante"
              {...form.register('dadosPessoais.acompanhanteNome')}
              className={inputClass(errors.dadosPessoais?.acompanhanteNome?.message)}
            />
          </Campo>

          {/* Telefone do Acompanhante */}
          <Campo
            id="acompanhanteTelefone"
            label="Telefone do Acompanhante"
            erro={errors.dadosPessoais?.acompanhanteTelefone?.message}
          >
            <input
              id="acompanhanteTelefone"
              type="text"
              placeholder="(00) 00000-0000"
              maxLength={15}
              {...form.register('dadosPessoais.acompanhanteTelefone', {
                onChange: (e) => {
                  e.target.value = mascaraTelefone(e.target.value);
                },
              })}
              className={inputClass(errors.dadosPessoais?.acompanhanteTelefone?.message)}
            />
          </Campo>
        </div>
      </div>

      {/* BLOCO 2: ENDEREÇO RESIDENCIAL */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <MapPin className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground">2. Endereço Residencial</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* CEP com Busca */}
          <Campo
            id="cep"
            label="CEP"
            obrigatorio
            erro={errors.endereco?.cep?.message}
            className="lg:col-span-2"
          >
            <div className="flex gap-1.5">
              <input
                id="cep"
                type="text"
                placeholder="00000-000"
                maxLength={9}
                {...form.register('endereco.cep', {
                  onChange: (e) => {
                    const formatado = mascaraCep(e.target.value);
                    e.target.value = formatado;
                    if (formatado.length === 9) {
                      handleBuscarCep();
                    }
                  },
                })}
                className={inputClass(errors.endereco?.cep?.message)}
              />
              <button
                type="button"
                onClick={handleBuscarCep}
                disabled={buscandoCep}
                className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-input rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="Buscar endereço pelo CEP"
              >
                {buscandoCep ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
          </Campo>

          {/* Logradouro */}
          <Campo
            id="logradouro"
            label="Logradouro / Rua"
            obrigatorio
            erro={errors.endereco?.logradouro?.message}
            className="lg:col-span-3"
          >
            <input
              id="logradouro"
              type="text"
              placeholder="Rua, Avenida, etc."
              {...form.register('endereco.logradouro')}
              className={inputClass(errors.endereco?.logradouro?.message)}
            />
          </Campo>

          {/* Número */}
          <Campo
            id="numero"
            label="Número"
            obrigatorio
            erro={errors.endereco?.numero?.message}
            className="lg:col-span-1"
          >
            <input
              id="numero"
              type="text"
              placeholder="Nº ou S/N"
              {...form.register('endereco.numero')}
              className={inputClass(errors.endereco?.numero?.message)}
            />
          </Campo>

          {/* Complemento */}
          <Campo
            id="complemento"
            label="Complemento"
            erro={errors.endereco?.complemento?.message}
            className="lg:col-span-2"
          >
            <input
              id="complemento"
              type="text"
              placeholder="Apto, Bloco, Casa 2, etc."
              {...form.register('endereco.complemento')}
              className={inputClass(errors.endereco?.complemento?.message)}
            />
          </Campo>

          {/* Bairro */}
          <Campo
            id="bairro"
            label="Bairro"
            obrigatorio
            erro={errors.endereco?.bairro?.message}
            className="lg:col-span-2"
          >
            <input
              id="bairro"
              type="text"
              placeholder="Bairro"
              {...form.register('endereco.bairro')}
              className={inputClass(errors.endereco?.bairro?.message)}
            />
          </Campo>

          {/* Cidade */}
          <Campo
            id="cidade"
            label="Cidade"
            obrigatorio
            erro={errors.endereco?.cidade?.message}
            className="lg:col-span-1"
          >
            <input
              id="cidade"
              type="text"
              placeholder="Cidade"
              {...form.register('endereco.cidade')}
              className={inputClass(errors.endereco?.cidade?.message)}
            />
          </Campo>

          {/* Estado (UF) */}
          <Campo
            id="estado"
            label="UF"
            obrigatorio
            erro={errors.endereco?.estado?.message}
            className="lg:col-span-1"
          >
            <input
              id="estado"
              type="text"
              placeholder="SP"
              maxLength={2}
              {...form.register('endereco.estado', {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
              className={inputClass(errors.endereco?.estado?.message)}
            />
          </Campo>
        </div>
      </div>

      {/* BLOCO 3: DADOS DE SAÚDE, CONVÊNIO & ALERGIAS */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
            <HeartPulse className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground">3. Dados de Saúde, Convênio & Alergias</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Tipo Sanguíneo */}
          <Campo
            id="tipoSanguineo"
            label="Tipo Sanguíneo & Fator Rh"
            erro={errors.dadosSaude?.tipoSanguineo?.message}
          >
            <select
              id="tipoSanguineo"
              {...form.register('dadosSaude.tipoSanguineo')}
              className={inputClass(errors.dadosSaude?.tipoSanguineo?.message)}
            >
              {TIPO_SANGUINEO_OPTIONS.map((ts) => (
                <option key={ts.value} value={ts.value}>
                  {ts.label}
                </option>
              ))}
            </select>
          </Campo>

          {/* Convênio / Plano */}
          <Campo id="convenio" label="Convênio / Plano de Saúde" erro={errors.dadosSaude?.convenio?.message}>
            <input
              id="convenio"
              type="text"
              placeholder="Ex: Particular, SUS, Unimed, Bradesco..."
              {...form.register('dadosSaude.convenio')}
              className={inputClass(errors.dadosSaude?.convenio?.message)}
            />
          </Campo>

          {/* Número da Carteirinha */}
          <Campo
            id="numeroCarteirinha"
            label="Nº da Carteirinha / Matrícula"
            erro={errors.dadosSaude?.numeroCarteirinha?.message}
          >
            <input
              id="numeroCarteirinha"
              type="text"
              placeholder="Número da carteirinha do plano"
              {...form.register('dadosSaude.numeroCarteirinha')}
              className={inputClass(errors.dadosSaude?.numeroCarteirinha?.message)}
            />
          </Campo>
        </div>

        {/* Alergias Conhecidas */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-rose-500" />
            Alergias Conhecidas
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite o nome da alergia (ex: Dipirona, Penicilina, Látex, Frutos do mar) e pressione Enter ou Adicionar"
              value={novaAlergia}
              onChange={(e) => setNovaAlergia(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  adicionarAlergia();
                }
              }}
              className={inputClass()}
            />
            <button
              type="button"
              onClick={adicionarAlergia}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/30 rounded-lg flex items-center gap-1 text-xs shrink-0 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </button>
          </div>

          {alergias.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {alergias.map((al) => (
                <span
                  key={al.descricao}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-medium"
                >
                  {al.descricao}
                  <button
                    type="button"
                    onClick={() => removerAlergia(al.descricao)}
                    className="hover:text-rose-900 dark:hover:text-rose-100 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Medicamentos Contínuos */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-blue-500" />
              Medicamentos de Uso Contínuo (Opcional)
            </label>
            <button
              type="button"
              onClick={() => addMedicamento({ nome: '', dose: '', frequencia: '', observacoes: '' })}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> + Adicionar Medicamento
            </button>
          </div>

          {medicamentos.length > 0 && (
            <div className="space-y-2 border border-border/60 p-3 rounded-xl bg-muted/20">
              {medicamentos.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Nome do Medicamento (ex: Losartana)"
                      {...form.register(`dadosSaude.medicamentosContinuos.${index}.nome`)}
                      className={inputClass()}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Dose (ex: 50mg)"
                      {...form.register(`dadosSaude.medicamentosContinuos.${index}.dose`)}
                      className={inputClass()}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Frequência (ex: 1x ao dia)"
                      {...form.register(`dadosSaude.medicamentosContinuos.${index}.frequencia`)}
                      className={inputClass()}
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeMedicamento(index)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="Remover"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observações Iniciais */}
        <div className="pt-2">
          <Campo id="observacoesIniciais" label="Observações Iniciais da Recepção">
            <textarea
              id="observacoesIniciais"
              rows={2}
              placeholder="Informações relevantes observadas pela recepção no acolhimento do paciente..."
              {...form.register('observacoesIniciais')}
              className={inputClass()}
            />
          </Campo>
        </div>
      </div>

      {/* BLOCO 4: FLUXO DE ATENDIMENTO IMEDIATO (Apenas no cadastro inicial) */}
      {!pacienteId && (
        <div className="bg-gradient-to-br from-primary/5 via-card to-card border border-primary/20 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">4. Encaminhamento de Atendimento Imediato</h3>
                <p className="text-xs text-muted-foreground">
                  Gere a ficha de atendimento e envie o paciente diretamente para a fila de triagem
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-foreground select-none">
              <input
                type="checkbox"
                checked={encaminharTriagem}
                onChange={(e) => setEncaminharTriagem(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
              Abrir atendimento agora
            </label>
          </div>

          {encaminharTriagem && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              <Campo id="origemId" label="Origem / Procedência do Paciente" obrigatorio>
                <select
                  id="origemId"
                  value={origemId}
                  onChange={(e) => setOrigemId(e.target.value)}
                  className={inputClass()}
                >
                  {origens.map((origem) => (
                    <option key={origem.id} value={origem.id}>
                      {origem.descricao}
                    </option>
                  ))}
                </select>
              </Campo>

              <div className="flex items-center gap-4 sm:col-span-2 pt-6">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={obstetrico}
                    onChange={(e) => setObstetrico(e.target.checked)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  Atendimento Obstétrico
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vaiInternar}
                    onChange={(e) => setVaiInternar(e.target.checked)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  Previsão de Internação
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botões de Ação Inferiores */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-12">
        <Link
          href="/recepcao"
          className="px-5 py-2.5 rounded-xl border border-input text-xs font-medium hover:bg-muted transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando…
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {pacienteId ? 'Salvar Alterações' : 'Salvar & Concluir Cadastro'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
