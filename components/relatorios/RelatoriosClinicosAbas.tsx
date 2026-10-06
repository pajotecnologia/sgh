'use client'

import {
  Stethoscope,
  Users,
  Building2,
  Syringe,
  Shield,
  Activity,
  SunMoon,
  LogOut,
  ClipboardList,
  FileCheck,
  FileText,
} from 'lucide-react'
import { RelatorioClinicoGenerico } from '@/components/relatorios/RelatorioClinicoGenerico'

// 1. PRONTUÁRIO MÉDICO
export function RelatorioProntuarioMedico() {
  return (
    <RelatorioClinicoGenerico
      tipo="prontuario-medico"
      titulo="Relatório Clínico — Prontuário Médico"
      descricao="Acompanhamento de atendimentos médicos, diagnósticos CID-10, prescrições e histórico de evoluções médicas."
      icon={Stethoscope}
      linkModo="prontuario"
      metricasCards={[
        { label: 'Total Prontuários', valorKey: 'total', icon: FileText, cor: 'primary' },
        { label: 'Com Diagnóstico CID', valorKey: 'comDiagnostico', icon: Stethoscope, cor: 'emerald' },
        { label: 'Evoluções Registradas', valorKey: 'totalEvolucoes', icon: Activity, cor: 'blue' },
      ]}
      colunas={[
        { key: 'numeroAtendimento', header: 'Atendimento' },
        { key: 'nomePaciente', header: 'Paciente' },
        { key: 'medicoNome', header: 'Médico Assistente' },
        { key: 'diagnosticos', header: 'Diagnóstico Principal / CID' },
        {
          key: 'totalEvolucoes',
          header: 'Evoluções',
          render: (r) => (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {r.totalEvolucoes} registro(s)
            </span>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          render: (r) => (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {r.status}
            </span>
          ),
        },
      ]}
      csvHeaders={['Atendimento', 'Paciente', 'Médico', 'Diagnósticos', 'Total Evoluções', 'Status']}
      csvRowMapper={(r) => [r.numeroAtendimento, r.nomePaciente, r.medicoNome, r.diagnosticos, r.totalEvolucoes, r.status]}
      opcoesStatus={[
        { valor: 'ABERTO', label: 'Em Aberto' },
        { valor: 'ENCERRADO', label: 'Encerrado' },
      ]}
    />
  )
}

// 2. PRONTUÁRIO DE ENFERMAGEM
export function RelatorioProntuarioEnfermagem() {
  return (
    <RelatorioClinicoGenerico
      tipo="prontuario-enfermagem"
      titulo="Relatório — Prontuário de Enfermagem"
      descricao="Visão integrada do cuidado de enfermagem: monitoramento, passagens de plantão, sinais vitais e SAE."
      icon={Users}
      linkModo="evolucoes"
      metricasCards={[
        { label: 'Pacientes em Acompanhamento', valorKey: 'total', icon: Users, cor: 'primary' },
        { label: 'Com Sinais Vitais Registrados', valorKey: 'comSinaisVitais', icon: Activity, cor: 'emerald' },
        { label: 'Com SAE Vigente', valorKey: 'comSae', icon: ClipboardList, cor: 'violet' },
        { label: 'Evoluções de Turno', valorKey: 'totalTurnos', icon: SunMoon, cor: 'amber' },
      ]}
      colunas={[
        { key: 'numeroAtendimento', header: 'Atendimento' },
        { key: 'nomePaciente', header: 'Paciente' },
        { key: 'leito', header: 'Leito / Ala' },
        {
          key: 'totalSinaisVitais',
          header: 'Sinais Vitais 24h',
          render: (r) => (
            <span className="text-xs font-medium text-foreground">
              {r.totalSinaisVitais > 0 ? `${r.totalSinaisVitais} ficha(s)` : 'Pendente'}
            </span>
          ),
        },
        {
          key: 'totalEvolucoesTurno',
          header: 'Passagens de Plantão',
          render: (r) => (
            <span className="text-xs font-medium text-foreground">
              {r.totalEvolucoesTurno > 0 ? `${r.totalEvolucoesTurno} turno(s)` : 'Sem registro'}
            </span>
          ),
        },
        {
          key: 'possuiSae',
          header: 'SAE',
          render: (r) => (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                r.possuiSae === 'Sim'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {r.possuiSae}
            </span>
          ),
        },
      ]}
      csvHeaders={['Atendimento', 'Paciente', 'Leito', 'Sinais Vitais', 'Turnos', 'SAE']}
      csvRowMapper={(r) => [r.numeroAtendimento, r.nomePaciente, r.leito, r.totalSinaisVitais, r.totalEvolucoesTurno, r.possuiSae]}
    />
  )
}

// 3. INTERNAMENTO / FICHA HOSPITALAR
export function RelatorioInternamento() {
  return (
    <RelatorioClinicoGenerico
      tipo="internamento"
      titulo="Relatório de Internações e Fichas Hospitalares"
      descricao="Gestão de pacientes internados, ocupação de leitos, admissões hospitalares e fichas de internação."
      icon={Building2}
      linkModo="ficha-hospitalar"
      metricasCards={[
        { label: 'Total Internações', valorKey: 'total', icon: Building2, cor: 'primary' },
        { label: 'Fichas Concluídas', valorKey: 'concluidos', icon: FileCheck, cor: 'emerald' },
        { label: 'Em Preenchimento (Rascunho)', valorKey: 'rascunhos', icon: FileText, cor: 'amber' },
      ]}
      colunas={[
        { key: 'numeroAtendimento', header: 'Atendimento' },
        { key: 'nomePaciente', header: 'Paciente' },
        { key: 'leito', header: 'Leito' },
        { key: 'ala', header: 'Ala / Setor' },
        { key: 'medico', header: 'Médico Resp.' },
        {
          key: 'status',
          header: 'Status Ficha',
          render: (r) => (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                r.status === 'CONCLUIDO'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {r.status}
            </span>
          ),
        },
      ]}
      csvHeaders={['Atendimento', 'Paciente', 'Leito', 'Ala', 'Médico', 'Status']}
      csvRowMapper={(r) => [r.numeroAtendimento, r.nomePaciente, r.leito, r.ala, r.medico, r.status]}
      opcoesStatus={[
        { valor: 'CONCLUIDO', label: 'Concluído' },
        { valor: 'RASCUNHO', label: 'Rascunho' },
      ]}
    />
  )
}

// 4. MEDICAMENTOS (INSTRUÇÕES E APRAZAMENTO)
export function RelatorioMedicamentosInstrucoes() {
  return (
    <RelatorioClinicoGenerico
      tipo="medicamentos"
      titulo="Relatório de Medicamentos, Aprazamentos & Checagens"
      descricao="Controle de prescrições hospitalares, aprazamento da enfermagem, checagens de horários e administrações."
      icon={Syringe}
      linkModo="evolucoes"
      metricasCards={[
        { label: 'Total Itens Prescritos', valorKey: 'total', icon: Syringe, cor: 'primary' },
        { label: 'Doses Administradas', valorKey: 'aplicados', icon: FileCheck, cor: 'emerald' },
        { label: 'Doses Pendentes / Horário', valorKey: 'pendentes', icon: Activity, cor: 'amber' },
        { label: 'Suspensos / Recusados', valorKey: 'suspensos', icon: LogOut, cor: 'rose' },
      ]}
      colunas={[
        { key: 'numeroAtendimento', header: 'Atendimento' },
        { key: 'nomePaciente', header: 'Paciente' },
        { key: 'nomeMedicamento', header: 'Medicamento' },
        { key: 'doseVia', header: 'Dose / Via' },
        { key: 'frequencia', header: 'Frequência' },
        {
          key: 'status',
          header: 'Status Checagem',
          render: (r) => (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                r.status === 'APLICADO'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : r.status === 'PENDENTE'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {r.status}
            </span>
          ),
        },
        { key: 'aplicadoEm', header: 'Última Checagem' },
      ]}
      csvHeaders={['Atendimento', 'Paciente', 'Medicamento', 'Dose/Via', 'Frequência', 'Status', 'Checado Em']}
      csvRowMapper={(r) => [r.numeroAtendimento, r.nomePaciente, r.nomeMedicamento, r.doseVia, r.frequencia, r.status, r.aplicadoEm]}
      opcoesStatus={[
        { valor: 'PENDENTE', label: 'Pendente' },
        { valor: 'APLICADO', label: 'Aplicado / Checado' },
        { valor: 'SUSPENSO', label: 'Suspenso' },
      ]}
    />
  )
}

// 5. CCIH (CONTROLE DE INFECÇÃO HOSPITALAR)
export function RelatorioCcih() {
  return (
    <RelatorioClinicoGenerico
      tipo="ccih"
      titulo="Relatório de Notificações CCIH — IRAS & Dispositivos"
      descricao="Vigilância epidemiológica hospitalar, infecções relacionadas à assistência, culturas e tempo de dispositivos."
      icon={Shield}
      linkModo="ccih"
      metricasCards={[
        { label: 'Total Notificações', valorKey: 'total', icon: Shield, cor: 'primary' },
        { label: 'Notificações Concluídas', valorKey: 'concluidos', icon: FileCheck, cor: 'emerald' },
        { label: 'Em Investigação', valorKey: 'investigacao', icon: Activity, cor: 'amber' },
      ]}
      colunas={[
        { key: 'numeroAtendimento', header: 'Atendimento' },
        { key: 'nomePaciente', header: 'Paciente' },
        { key: 'leito', header: 'Leito' },
        { key: 'tipoInfeccao', header: 'Tipo de Infecção' },
        { key: 'topografia', header: 'Topografia' },
        { key: 'microorganismo', header: 'Microorganismo / Cultura' },
        {
          key: 'status',
          header: 'Status',
          render: (r) => (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                r.status === 'CONCLUIDO'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {r.status}
            </span>
          ),
        },
      ]}
      csvHeaders={['Atendimento', 'Paciente', 'Leito', 'Tipo Infecção', 'Topografia', 'Microorganismo', 'Status']}
      csvRowMapper={(r) => [r.numeroAtendimento, r.nomePaciente, r.leito, r.tipoInfeccao, r.topografia, r.microorganismo, r.status]}
      opcoesStatus={[
        { valor: 'CONCLUIDO', label: 'Concluído' },
        { valor: 'RASCUNHO', label: 'Rascunho' },
      ]}
    />
  )
}

// 6. SINAIS VITAIS & BALANÇO
export function RelatorioSinaisVitais() {
  return (
    <RelatorioClinicoGenerico
      tipo="sinais-vitais"
      titulo="Relatório de Sinais Vitais & Balanço Hídrico 24h"
      descricao="Controle horário de pressão arterial, pulso, temperatura, oximetria, glicemia e balanço hídrico."
      icon={Activity}
      linkModo="evolucoes"
      metricasCards={[
        { label: 'Fichas 24h Registradas', valorKey: 'total', icon: Activity, cor: 'primary' },
        { label: 'Com Controle Horário', valorKey: 'comControle', icon: FileCheck, cor: 'emerald' },
        { label: 'Com Balanço Hídrico', valorKey: 'comBalanco', icon: Activity, cor: 'blue' },
      ]}
      colunas={[
        { key: 'numeroAtendimento', header: 'Atendimento' },
        { key: 'nomePaciente', header: 'Paciente' },
        { key: 'leito', header: 'Leito' },
        {
          key: 'temControle',
          header: 'Controle Horário 24h',
          render: (r) => (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {r.temControle}
            </span>
          ),
        },
        {
          key: 'temBalanco',
          header: 'Balanço Hídrico',
          render: (r) => (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {r.temBalanco}
            </span>
          ),
        },
      ]}
      csvHeaders={['Atendimento', 'Paciente', 'Leito', 'Controle Horário', 'Balanço Hídrico']}
      csvRowMapper={(r) => [r.numeroAtendimento, r.nomePaciente, r.leito, r.temControle, r.temBalanco]}
    />
  )
}

// 7. EVOLUÇÃO DIA / NOITE
export function RelatorioEvolucaoTurno() {
  return (
    <RelatorioClinicoGenerico
      tipo="evolucao-turno"
      titulo="Relatório de Evoluções por Turno (Dia / Noite)"
      descricao="Passagens de plantão diurno e noturno, intercorrências do turno, condutas da enfermagem e evolução clínica."
      icon={SunMoon}
      linkModo="evolucoes"
      filtroTurnoDisponivel
      metricasCards={[
        { label: 'Total Passagens de Plantão', valorKey: 'total', icon: SunMoon, cor: 'primary' },
        { label: 'Plantão Diurno (☀️ Dia)', valorKey: 'diurno', icon: SunMoon, cor: 'amber' },
        { label: 'Plantão Noturno (🌙 Noite)', valorKey: 'noturno', icon: SunMoon, cor: 'violet' },
        { label: 'Evoluções Concluídas', valorKey: 'concluidos', icon: FileCheck, cor: 'emerald' },
      ]}
      colunas={[
        { key: 'numeroAtendimento', header: 'Atendimento' },
        { key: 'nomePaciente', header: 'Paciente' },
        {
          key: 'turno',
          header: 'Turno',
          render: (r) => (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                r.turno === 'DIA'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
              }`}
            >
              {r.turno === 'DIA' ? '☀️ Diurno' : '🌙 Noturno'}
            </span>
          ),
        },
        { key: 'estadoGeral', header: 'Estado Geral' },
        { key: 'profissional', header: 'Profissional Resp.' },
        {
          key: 'status',
          header: 'Status',
          render: (r) => (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {r.status}
            </span>
          ),
        },
      ]}
      csvHeaders={['Atendimento', 'Paciente', 'Turno', 'Estado Geral', 'Profissional', 'Status']}
      csvRowMapper={(r) => [r.numeroAtendimento, r.nomePaciente, r.turno, r.estadoGeral, r.profissional, r.status]}
      opcoesStatus={[
        { valor: 'CONCLUIDO', label: 'Concluído' },
        { valor: 'RASCUNHO', label: 'Rascunho' },
      ]}
    />
  )
}

// 8. CONDIÇÕES DE ALTA
export function RelatorioCondicoesAlta() {
  return (
    <RelatorioClinicoGenerico
      tipo="condicoes-alta"
      titulo="Relatório de Condições & Sumários de Alta Hospitalar"
      descricao="Acompanhamento de desfechos hospitalares, motivos de alta (curado, melhorado, transferência), transporte e orientações."
      icon={LogOut}
      linkModo="evolucoes"
      metricasCards={[
        { label: 'Total de Altas Hospitalares', valorKey: 'totalAltas', icon: LogOut, cor: 'emerald' },
      ]}
      colunas={[
        { key: 'numeroAtendimento', header: 'Atendimento' },
        { key: 'nomePaciente', header: 'Paciente' },
        { key: 'leito', header: 'Leito de Origem' },
        { key: 'medico', header: 'Médico Assistente' },
        {
          key: 'status',
          header: 'Desfecho',
          render: () => (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Alta Concluída
            </span>
          ),
        },
      ]}
      csvHeaders={['Atendimento', 'Paciente', 'Leito', 'Médico', 'Desfecho']}
      csvRowMapper={(r) => [r.numeroAtendimento, r.nomePaciente, r.leito, r.medico, 'Alta Concluída']}
    />
  )
}

// 9. SAE (SISTEMATIZAÇÃO DA ASSISTÊNCIA DE ENFERMAGEM)
export function RelatorioSae() {
  return (
    <RelatorioClinicoGenerico
      tipo="sae"
      titulo="Relatório de SAE — Sistematização da Assistência de Enfermagem"
      descricao="Diagnósticos de enfermagem (NANDA), prescrições de cuidados (NIC) e metas terapêuticas (NOC) para pacientes internados."
      icon={ClipboardList}
      linkModo="evolucoes"
      metricasCards={[
        { label: 'Total Fichas SAE', valorKey: 'total', icon: ClipboardList, cor: 'primary' },
        { label: 'Diagnósticos Mapeados (NANDA)', valorKey: 'totalDiagnosticos', icon: Stethoscope, cor: 'violet' },
        { label: 'Cuidados Prescritos (NIC)', valorKey: 'totalPrescricoes', icon: FileCheck, cor: 'emerald' },
      ]}
      colunas={[
        { key: 'numeroAtendimento', header: 'Atendimento' },
        { key: 'nomePaciente', header: 'Paciente' },
        { key: 'leito', header: 'Leito' },
        {
          key: 'totalDiagnosticos',
          header: 'Diagnósticos de Enfermagem',
          render: (r) => (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              {r.totalDiagnosticos} diagnóstico(s)
            </span>
          ),
        },
        {
          key: 'totalPrescricoes',
          header: 'Cuidados / Intervenções',
          render: (r) => (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {r.totalPrescricoes} cuidado(s)
            </span>
          ),
        },
      ]}
      csvHeaders={['Atendimento', 'Paciente', 'Leito', 'Total Diagnósticos', 'Total Cuidados']}
      csvRowMapper={(r) => [r.numeroAtendimento, r.nomePaciente, r.leito, r.totalDiagnosticos, r.totalPrescricoes]}
    />
  )
}

// 10. MULTIDISCIPLINAR
export function RelatorioMultidisciplinar() {
  return (
    <RelatorioClinicoGenerico
      tipo="multidisciplinar"
      titulo="Relatório de Avaliações & Pareceres Multidisciplinares"
      descricao="Evoluções integradas de Fisioterapia, Nutrição, Psicologia, Fonoaudiologia, Serviço Social e Farmácia Clínica."
      icon={Users}
      linkModo="evolucoes"
      metricasCards={[
        { label: 'Total Pareceres / Evoluções', valorKey: 'total', icon: Users, cor: 'primary' },
        { label: 'Fisioterapia', valorKey: 'fisioterapia', icon: Activity, cor: 'blue' },
        { label: 'Nutrição', valorKey: 'nutricao', icon: FileCheck, cor: 'emerald' },
        { label: 'Psicologia & Outros', valorKey: 'psicologia', icon: ClipboardList, cor: 'violet' },
      ]}
      colunas={[
        { key: 'numeroAtendimento', header: 'Atendimento' },
        { key: 'nomePaciente', header: 'Paciente' },
        { key: 'leito', header: 'Leito' },
        {
          key: 'categoria',
          header: 'Especialidade / Profissional',
          render: (r) => (
            <div>
              <span className="font-semibold text-foreground text-xs">{r.categoria}</span>
              <p className="text-[11px] text-muted-foreground">{r.nomeProfissional}</p>
            </div>
          ),
        },
        { key: 'evolucao', header: 'Síntese da Conduta' },
      ]}
      csvHeaders={['Atendimento', 'Paciente', 'Leito', 'Especialidade', 'Profissional', 'Evolução']}
      csvRowMapper={(r) => [r.numeroAtendimento, r.nomePaciente, r.leito, r.categoria, r.nomeProfissional, r.evolucao]}
    />
  )
}

// 11. LAUDOS MÉDICOS DE SOLICITAÇÃO
export function RelatorioLaudosMedicos() {
  return (
    <RelatorioClinicoGenerico
      tipo="laudo-solicitacao"
      titulo="Relatório de Laudos Médicos & Solicitações de Internação"
      descricao="Registro de laudos de solicitação de internação hospitalar, procedimentos autorizados e justificativas clínicas."
      icon={FileText}
      linkModo="ficha-sus"
      metricasCards={[
        { label: 'Total Laudos Emitidos', valorKey: 'total', icon: FileText, cor: 'primary' },
        { label: 'Laudos Concluídos', valorKey: 'concluidos', icon: FileCheck, cor: 'emerald' },
        { label: 'Em Análise / Rascunho', valorKey: 'rascunhos', icon: Activity, cor: 'amber' },
      ]}
      colunas={[
        { key: 'numeroLaudo', header: 'Nº Laudo' },
        { key: 'numeroAtendimento', header: 'Atendimento' },
        { key: 'nomePaciente', header: 'Paciente' },
        { key: 'procedimento', header: 'Procedimento Solicitado' },
        { key: 'cid10', header: 'CID-10' },
        { key: 'medicoSolicitante', header: 'Médico Solicitante' },
        {
          key: 'status',
          header: 'Status',
          render: (r) => (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                r.status === 'CONCLUIDO'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {r.status}
            </span>
          ),
        },
      ]}
      csvHeaders={['Nº Laudo', 'Atendimento', 'Paciente', 'Procedimento', 'CID-10', 'Médico', 'Status']}
      csvRowMapper={(r) => [r.numeroLaudo, r.numeroAtendimento, r.nomePaciente, r.procedimento, r.cid10, r.medicoSolicitante, r.status]}
      opcoesStatus={[
        { valor: 'CONCLUIDO', label: 'Concluído' },
        { valor: 'RASCUNHO', label: 'Rascunho' },
      ]}
    />
  )
}
