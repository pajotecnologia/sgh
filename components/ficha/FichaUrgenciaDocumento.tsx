// components/ficha/FichaUrgenciaDocumento.tsx
// Ficha SETOR URGÊNCIA/EMERGÊNCIA — mesma diagramação da recepção; triagem e médico opcionais (vazio vs preenchido).

import type { ReactNode } from 'react';
import { BotaoImprimirFicha } from '@/components/recepcao/BotaoImprimirFicha';
import {
  IRRADIACAO_DOR_SITE_KEYS,
  IRRADIACAO_DOR_SITE_LABELS,
  parseIrradiacaoDorSitesCsv,
  type IrradiacaoDorSiteKey,
} from '@/lib/ficha-dor-irradiacao';
import {
  PARAMETROS_CLINICOS_ESTADO_KEYS,
  PARAMETROS_CLINICOS_CIRCULATORY_KEYS,
  ESTADO_CONSCIENCIA_SINAIS_LABELS,
  parseEstadoConscienciaSinaisCsv,
} from '@/lib/triagem-estado-consciencia-sinais';

export function labelSexo(s: string) {
  const m: Record<string, string> = {
    MASCULINO: 'Masculino',
    FEMININO: 'Feminino',
    INTERSEXO: 'Intersexo',
  };
  return m[s] ?? s;
}

export function LinhaPaciente({
  titulo,
  valor,
  className = '',
  mono = false,
}: {
  titulo: string;
  valor: ReactNode;
  className?: string;
  mono?: boolean;
}) {
  const vazio =
    valor == null || (typeof valor === 'string' && valor.trim() === '');
  return (
    <div
      className={`flex flex-row items-baseline gap-1 border border-black px-1 py-0.5 min-h-[1.05rem] box-border bg-white ${className}`}
    >
      <span className="text-[7px] font-bold uppercase tracking-tight shrink-0 leading-none">
        {titulo}
      </span>
      <span
        className={`text-[8.5px] leading-tight flex-1 min-w-0 break-words ${mono ? 'font-mono' : ''}`}
      >
        {vazio ? '\u00A0' : valor}
      </span>
    </div>
  );
}

export function Caixinha({ texto, destaque }: { texto: string; destaque?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center border border-black px-0.5 py-0.5 text-[6.5px] leading-tight text-center min-h-[1.15rem] min-w-0 ${
        destaque ? 'ring-2 ring-black font-bold bg-amber-100 print:bg-amber-100' : ''
      }`}
      style={destaque ? { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } : undefined}
    >
      {texto}
    </span>
  );
}

export function LinhasEscrita({ n }: { n: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-[0.95rem] border-b border-black w-full" />
      ))}
    </div>
  );
}

const CORES_MANCHESTER: { key: string; label: string; className: string }[] = [
  { key: 'VERMELHO', label: 'Vermelho', className: 'bg-[#dc2626] text-white' },
  { key: 'LARANJA', label: 'Laranja', className: 'bg-[#f97316] text-white' },
  { key: 'AMARELO', label: 'Amarelo', className: 'bg-[#eab308] text-black' },
  { key: 'VERDE', label: 'Verde', className: 'bg-[#16a34a] text-white' },
  { key: 'AZUL', label: 'Azul', className: 'bg-[#2563eb] text-white' },
  { key: 'CINZA', label: 'Cinza', className: 'bg-gray-500 text-white' },
];

export type PacienteFichaCabecalho = {
  nomeCompleto: string;
  idadeFmt: string;
  sexoBiologico: string;
  nascFmt: string;
  cpf: string;
  naturalidade: string;
  nomeMae: string;
  telefoneFmt: string;
  cns: string;
  escolaridade: string;
  profissao: string;
  racaCor: string;
  convenio: string;
  acompanhanteNome: string;
  acompanhanteTelefone: string;
  enderecoFmt: string;
};

export type TriagemFichaDados = {
  corClassificacao: string;
  queixaPrincipal: string;
  doencasPreexistentes?: string | null;
  medicacoes?: string | null;
  alergias?: string | null;
  acidenteTrabalho?: boolean | null;
  sinaisVitais?: {
    paSistolica?: number | null;
    paDiastolica?: number | null;
    frequenciaCardiaca?: number | null;
    frequenciaResp?: number | null;
    temperatura?: unknown;
    spo2?: unknown;
    glicemia?: number | null;
    peso?: unknown;
  } | null;
  nivelConsciencia?: string | null;
  regraDor?: string | null;
  tipoDorToracica?: string | null;
  fluxograma?: string | null;
  discriminador?: string | null;
  irradiacao?: string | null;
  tempoQueixa?: string | null;
  ritmo?: string | null;
  duracaoDor?: string | null;
  localizacaoDor?: string | null;
  irradiacaoDorSites?: string | null;
  estadoConscienciaSinais?: string | null;
};

export type MedicoFichaDados = {
  hda: string;
  exameClinico: string;
  hipoteses: string;
  prescricoes: { conduta: string; horario: string }[];
  medicoNome?: string | null;
};

type InstituicaoFicha = {
  nomeInstituicao?: string | null;
  nomeMunicipio?: string | null;
  logomarcaUrl?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  cnes?: string | null;
  codigoIbgeMunicipio?: string | null;
} | null;

function fmtNum(v: unknown): string {
  if (v == null || v === '') return '';
  if (typeof v === 'object' && v !== null && 'toString' in v) return String(v);
  return String(v);
}

function BlocoCampoMedico({
  titulo,
  texto,
  linhasVazio,
}: {
  titulo: string;
  texto: string;
  linhasVazio: number;
}) {
  const t = texto?.trim();
  return (
    <div className="border border-black p-1 mb-1.5">
      <p className="font-bold text-[8.5px] uppercase mb-0.5">{titulo}</p>
      {t ? (
        <p className="text-[7.5px] whitespace-pre-wrap leading-snug">{t}</p>
      ) : (
        <LinhasEscrita n={linhasVazio} />
      )}
    </div>
  );
}

export function FichaUrgenciaDocumento({
  instituicao,
  numeroAtendimento,
  dataAberturaFmt,
  paciente,
  triagem,
  medico,
  procedencia,
}: {
  instituicao: InstituicaoFicha;
  numeroAtendimento: string;
  dataAberturaFmt: string;
  paciente: PacienteFichaCabecalho;
  triagem: TriagemFichaDados | null;
  medico: MedicoFichaDados | null;
  procedencia?: {
    descricao: string;
    mapaFicha: 'RESIDENCIA' | 'VIA_PUBLICA' | 'TRABALHO' | 'UNIDADE_SAUDE' | null;
  } | null;
}) {
  const p = paciente;
  const unidadeResumo =
    [instituicao?.nomeInstituicao, instituicao?.nomeMunicipio].filter(Boolean).join(' — ') || '';
  const cnes = instituicao?.cnes?.replace(/\D/g, '').slice(0, 7) || '';
  const ibge = instituicao?.codigoIbgeMunicipio?.replace(/\D/g, '').slice(0, 7) || '';

  const sv = triagem?.sinaisVitais;
  const pa =
    sv?.paSistolica != null && sv?.paDiastolica != null
      ? `${sv.paSistolica}×${sv.paDiastolica} mmHg`
      : '';
  const pulso = sv?.frequenciaCardiaca != null ? `${sv.frequenciaCardiaca} bpm` : '';
  const fr = sv?.frequenciaResp != null ? `${sv.frequenciaResp} irpm` : '';
  const temp = sv?.temperatura != null ? `${fmtNum(sv.temperatura)} °C` : '';
  const spo2 = sv?.spo2 != null ? `${fmtNum(sv.spo2)} %` : '';
  const glic = sv?.glicemia != null ? `${sv.glicemia} mg/dL` : '';
  const peso = sv?.peso != null ? `${fmtNum(sv.peso)} kg` : '';

  const nivel = triagem?.nivelConsciencia?.trim() ?? '';
  const estadoConscienciaSel = parseEstadoConscienciaSinaisCsv(triagem?.estadoConscienciaSinais);
  const rotulosGradeConsciencia = new Set(Object.values(ESTADO_CONSCIENCIA_SINAIS_LABELS));

  const tipoDor = triagem?.tipoDorToracica?.trim() ?? '';
  const dorMarcada = (rotulo: string) =>
    tipoDor && tipoDor.toLowerCase().includes(rotulo.toLowerCase());

  const textoFluxo = [
    triagem?.fluxograma,
    triagem?.discriminador,
    triagem?.ritmo,
    triagem?.irradiacao,
    triagem?.tempoQueixa,
  ]
    .filter((x) => x && String(x).trim())
    .join('\n');

  const irradiacaoSitesMarcados = parseIrradiacaoDorSitesCsv(triagem?.irradiacaoDorSites);
  const irradMarcada = (k: IrradiacaoDorSiteKey) => irradiacaoSitesMarcados.includes(k);

  const numPrescRows = 8;
  const prescRows: { conduta: string; horario: string }[] = Array.from({ length: numPrescRows }, (_, i) => {
    const row = medico?.prescricoes[i];
    return row ?? { conduta: '', horario: '' };
  });

  return (
    <div className="ficha-urgencia bg-white text-black max-w-[210mm] mx-auto print:max-w-none shadow-lg my-4 px-3 py-3 print:p-0 print:m-0 print:shadow-none text-[9px] leading-tight [&_strong]:font-bold">
      <div className="flex justify-end mb-2 print:hidden">
        <BotaoImprimirFicha />
      </div>

      {/* Página 1 */}
      <section className="ficha-pagina ficha-print-page-1">
        <div className="flex items-start gap-3 border-b-2 border-black pb-2 mb-1.5">
          {instituicao?.logomarcaUrl ? (
            <img
              src={instituicao.logomarcaUrl}
              alt=""
              className="w-16 h-16 shrink-0 object-contain border border-black bg-white print:block"
            />
          ) : (
            <div className="w-16 h-16 shrink-0 border border-black bg-gray-100 flex items-center justify-center text-[6.5px] text-center uppercase p-1">
              Sem logomarca
            </div>
          )}
          <div className="flex-1 min-w-0 text-center px-1">
            <p className="text-xs font-bold uppercase leading-tight">
              {instituicao?.nomeMunicipio ?? 'Município / Secretaria não configurados'}
            </p>
            <p className="text-[11px] font-semibold uppercase leading-tight mt-0.5">
              {instituicao?.nomeInstituicao ?? 'Instituição não configurada'}
            </p>
            <p className="text-[8px] leading-snug mt-0.5 text-black">
              {[
                instituicao?.endereco,
                instituicao?.bairro,
                [instituicao?.cidade, instituicao?.estado].filter(Boolean).join('/') || null,
                instituicao?.cep ? `CEP ${instituicao.cep}` : null,
              ]
                .filter(Boolean)
                .join(' — ') || 'Endereço da unidade não cadastrado em Configurações.'}
            </p>
            {cnes || ibge ? (
              <p className="text-[7.5px] mt-0.5 text-black">
                {cnes ? (
                  <span>
                    <span className="font-semibold">CNES:</span> <span className="font-mono">{cnes}</span>
                  </span>
                ) : null}
                {cnes && ibge ? <span className="mx-2">•</span> : null}
                {ibge ? (
                  <span>
                    <span className="font-semibold">IBGE:</span> <span className="font-mono">{ibge}</span>
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
          <div className="w-[6rem] shrink-0 text-right">
            <div className="border-2 border-black p-1 text-center bg-gray-100">
              <p className="text-[7.5px] font-bold uppercase tracking-tighter">Atendimento</p>
              <p className="text-[11px] font-mono font-bold mt-0.5 break-all leading-tight">{numeroAtendimento}</p>
            </div>
            <p className="text-[7.5px] mt-0.5 text-right">
              <span className="font-semibold">Abertura:</span> {dataAberturaFmt}
            </p>
          </div>
        </div>

        <div
          className="border-2 border-black text-center uppercase font-bold tracking-wide py-0.5 text-[10px] mb-1 bg-gray-200 print:bg-gray-200"
          style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
        >
          Setor de urgência/emergência
        </div>

        <p className="text-[8px] font-semibold uppercase tracking-wide px-1 py-0.25 mt-1 mb-0 border-x-2 border-t-2 border-black bg-gray-300">
          Dados do paciente (recepção)
        </p>
        <div className="grid grid-cols-2 border-x-2 border-b-2 border-black gap-0">
          <LinhaPaciente className="border-r border-b" titulo="Nome" valor={p.nomeCompleto} />
          <LinhaPaciente className="border-b" titulo="Idade" valor={p.idadeFmt} />
          <LinhaPaciente className="border-r border-b" titulo="Sexo" valor={labelSexo(p.sexoBiologico)} />
          <LinhaPaciente className="border-b" titulo="Nascimento" valor={p.nascFmt} />
          <LinhaPaciente className="border-r border-b" titulo="CPF" valor={p.cpf} mono />
          <LinhaPaciente className="border-b" titulo="Naturalidade" valor={p.naturalidade ?? ''} />
          <LinhaPaciente className="border-r border-b" titulo="Mãe" valor={p.nomeMae ?? ''} />
          <LinhaPaciente className="border-b" titulo="Telefone" valor={p.telefoneFmt} mono />
          <LinhaPaciente className="border-r border-b" titulo="CNS" valor={p.cns ?? ''} mono />
          <LinhaPaciente className="border-b" titulo="Escolaridade" valor={p.escolaridade ?? ''} />
          <LinhaPaciente className="border-r border-b" titulo="Profissão" valor={p.profissao ?? ''} />
          <LinhaPaciente className="border-b" titulo="Raça/Cor" valor={p.racaCor ?? ''} />
          <LinhaPaciente className="border-r border-b" titulo="Convênio" valor={p.convenio ?? ''} />
          <LinhaPaciente className="border-b" titulo="Acompanhante" valor={p.acompanhanteNome ?? ''} />
          <div className="col-span-2 border-b border-black">
            <LinhaPaciente titulo="Tel. acompanhante" valor={p.acompanhanteTelefone ?? ''} mono />
          </div>
          <div className="col-span-2">
            <LinhaPaciente titulo="Endereço" valor={p.enderecoFmt} />
          </div>
        </div>

        <p className="mt-1 mb-0 text-[8px] font-semibold bg-gray-300 border border-black border-b-0 px-1 py-0.25 uppercase tracking-tight">
          Classificação de risco / atendimento de enfermagem
        </p>
        <div className="border border-black border-t-0 p-1 space-y-1">
          <p className="font-semibold text-[8px]">Situação / Queixa principal</p>
          <div className="flex flex-wrap gap-0.5 text-[7.5px] font-bold uppercase">
            {CORES_MANCHESTER.map(({ key, label, className }) => (
              <span
                key={key}
                className={`px-1.5 py-0.25 ${className} ${
                  triagem?.corClassificacao === key ? 'ring-2 ring-black ring-offset-1' : ''
                }`}
                style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
              >
                {triagem?.corClassificacao === key ? '● ' : ''}
                {label}
              </span>
            ))}
          </div>
          <div
            className={`min-h-[1.4rem] text-[7.5px] whitespace-pre-wrap leading-tight ${
              triagem?.queixaPrincipal?.trim()
                ? 'border border-black p-0.5'
                : 'border border-dotted border-gray-600'
            }`}
          >
            {triagem?.queixaPrincipal?.trim() ? triagem.queixaPrincipal : null}
          </div>

          <p className="font-semibold uppercase text-[7.5px] pt-0.5">Procedência</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[7.5px]">
            <span>
              ({procedencia?.mapaFicha === 'RESIDENCIA' ? 'X' : ' '}) Residência
            </span>
            <span>
              ({procedencia?.mapaFicha === 'VIA_PUBLICA' ? 'X' : ' '}) Via pública
            </span>
            <span>
              ({procedencia?.mapaFicha === 'TRABALHO' ? 'X' : ' '}) Trabalho
            </span>
            <span>
              ({procedencia?.mapaFicha === 'UNIDADE_SAUDE' ? 'X' : ' '}) Unidade de saúde
            </span>
          </div>
          {procedencia?.descricao ? (
            <p className="text-[7.5px] pt-0.25">
              <span className="font-semibold">Origem / procedência:</span> {procedencia.descricao}
            </p>
          ) : null}

          <div className="pt-0.5 space-y-0.25 text-[7.5px]">
            <p>
              <span className="font-semibold">Doença preexistente:</span>{' '}
              {triagem?.doencasPreexistentes?.trim() || '\u00A0'}
            </p>
            <p>
              <span className="font-semibold">Medicações em uso:</span>{' '}
              {triagem?.medicacoes?.trim() || '\u00A0'}
            </p>
            <p>
              <span className="font-semibold">Intolerância / Alergias:</span>{' '}
              {triagem?.alergias?.trim() || '\u00A0'}
            </p>
          </div>
          <p className="text-[7.5px] pt-0.25">
            <span className="font-semibold">Acidente de trabalho:</span>{' '}
            {triagem?.acidenteTrabalho === true ? '(X) Sim ( ) Não' : triagem?.acidenteTrabalho === false ? '( ) Sim (X) Não' : '( ) Sim ( ) Não'}
          </p>
        </div>

        <p className="mt-1 mb-0 text-[8px] font-semibold bg-gray-300 border border-black border-b-0 px-1 py-0.25 uppercase tracking-tight">
          Parâmetros
        </p>
        <div className="border border-black border-t-0 px-1 py-0.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[7.5px] mb-1">
          <span>
            <strong>PA</strong> {pa || '___________'}
          </span>
          <span>
            <strong>P</strong> {pulso || '___________'}
          </span>
          <span>
            <strong>R</strong> {fr || '___________'}
          </span>
          <span>
            <strong>T</strong> {temp || '___________'}
          </span>
          <span>
            <strong>SpO₂</strong> {spo2 || '_________'}
          </span>
          <span>
            <strong>Glicemia</strong> {glic || '_______'}
          </span>
          <span>
            <strong>Peso</strong> {peso || '_________'}
          </span>
          <span>
            <strong>ECG</strong> _________
          </span>
        </div>

        <p className="mt-1 mb-0 text-[8px] font-semibold bg-gray-300 border border-black border-b-0 px-1 py-0.25 uppercase tracking-tight">
          Avaliação clínica (enfermagem)
        </p>
        <div className="border border-black border-t-0 p-1 space-y-1">
          <div>
            <p className="font-semibold text-[7.5px] uppercase mb-0.25">Régua de dor</p>
            <div className="flex justify-center gap-4 border border-black py-0.5 text-[7.5px] font-bold uppercase bg-gray-50">
              <span>Leve</span>
              <span>Moderada</span>
              <span>Grave</span>
            </div>
            {triagem?.regraDor?.trim() ? (
              <p className="text-[7.5px] mt-0.5 whitespace-pre-wrap">{triagem.regraDor}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-[7.5px] uppercase mb-0.25">Parâmetros clínicos</p>
            <div>
              <p className="text-[6.5px] font-bold uppercase mb-0.25 px-0.5">
                Estado de consciência e comportamento
              </p>
              <div className="grid grid-cols-5 gap-0.5 border border-black p-0.5 bg-white">
                {PARAMETROS_CLINICOS_ESTADO_KEYS.map((key) => (
                  <Caixinha
                    key={key}
                    texto={ESTADO_CONSCIENCIA_SINAIS_LABELS[key]}
                    destaque={estadoConscienciaSel.has(key)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[6.5px] font-bold uppercase mb-0.25 px-0.5">
                Sinais circulatórios e respiratórios
              </p>
              <div className="grid grid-cols-5 gap-0.5 border border-black p-0.5 bg-white">
                {PARAMETROS_CLINICOS_CIRCULATORY_KEYS.map((key) => (
                  <Caixinha
                    key={key}
                    texto={ESTADO_CONSCIENCIA_SINAIS_LABELS[key]}
                    destaque={estadoConscienciaSel.has(key)}
                  />
                ))}
              </div>
            </div>
            {nivel && !rotulosGradeConsciencia.has(nivel) ? (
              <p className="text-[7.5px] mt-0.5 whitespace-pre-wrap">
                <span className="font-semibold">Obs.:</span> {nivel}
              </p>
            ) : null}
          </div>

          <div>
            <p className="font-bold uppercase text-[7.5px] mb-0.25">Dor torácica</p>
            <div className="flex flex-wrap gap-2 text-[7.5px] font-semibold border border-black px-1 py-0.25 justify-center">
              <span className={dorMarcada('Intensa') ? 'ring-1 ring-black px-1' : ''}>Intensa</span>
              <span className={dorMarcada('Moderada') ? 'ring-1 ring-black px-1' : ''}>Moderada</span>
              <span className={dorMarcada('Leve') ? 'ring-1 ring-black px-1' : ''}>Leve</span>
              {tipoDor && !dorMarcada('Intensa') && !dorMarcada('Moderada') && !dorMarcada('Leve') ? (
                <span className="font-normal">— {tipoDor}</span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <div>
              <p className="font-bold uppercase text-[7px] mb-0.25">Duração da dor</p>
              <div className="min-h-[1.05rem] border border-black px-1 py-0.25 text-[7px] leading-tight">
                {triagem?.duracaoDor?.trim() ? triagem.duracaoDor : '\u00A0'}
              </div>
            </div>
            <div>
              <p className="font-bold uppercase text-[7px] mb-0.25">Localização da dor</p>
              <div className="min-h-[1.05rem] border border-black px-1 py-0.25 text-[7px] leading-tight">
                {triagem?.localizacaoDor?.trim() ? triagem.localizacaoDor : '\u00A0'}
              </div>
            </div>
          </div>

          <div>
            <p className="font-bold uppercase text-[7px] mb-0.5 tracking-wide">Irradiação da dor</p>
            <div className="flex flex-wrap justify-between gap-x-1.5 gap-y-0.5 border border-black px-1 py-0.5 text-[7px] font-semibold uppercase">
              {IRRADIACAO_DOR_SITE_KEYS.map((key) => (
                <span key={key}>
                  (<span className="inline-block w-2 text-center">{irradMarcada(key) ? 'X' : '\u00A0'}</span>){' '}
                  {IRRADIACAO_DOR_SITE_LABELS[key]}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="font-bold text-[7px] uppercase mb-0.25">Dor presente</p>
            <div className="flex gap-1">
              <div className="flex-1 border border-black px-1 py-0.25 text-[7px] text-center leading-tight">
                ( ) Em repouso
              </div>
              <div className="flex-1 border border-black px-1 py-0.25 text-[7px] text-center leading-tight">
                ( ) Aos esforços
              </div>
              <div className="flex-1 border border-black px-1 py-0.25 text-[7px] text-center leading-tight">
                ( ) Ao respirar
              </div>
            </div>
          </div>

          <div>
            <p className="font-semibold text-[7.5px] uppercase mb-0.25">Fluxograma / observações</p>
            <div
              className={`min-h-[2.2rem] text-[7.5px] whitespace-pre-wrap leading-tight ${
                textoFluxo.trim()
                  ? 'border border-black p-0.5'
                  : 'border border-dotted border-gray-600'
              }`}
            >
              {textoFluxo.trim() ? textoFluxo : null}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-black text-center text-[7.5px]">
              <div>Assinatura e carimbo — enfermeiro(a)</div>
              <div>Assinatura e carimbo — médico(a)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Página 2 */}
      <section className="ficha-pagina ficha-print-page-2 mt-6 print:mt-0 pt-2 print:pt-0">
        <p
          className="text-center font-bold uppercase tracking-wide border-2 border-black py-0.5 text-[10px] mb-1 bg-gray-200 print:bg-gray-200"
          style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
        >
          Setor de urgência/emergência
        </p>

        <div className="grid grid-cols-2 gap-0 border-2 border-black border-t-0 mb-1">
          <div className="border-r border-black p-0.5 min-h-[2rem]">
            <p className="text-[7.5px] font-bold uppercase mb-0.25">Unidade</p>
            <p className="text-[7.5px] leading-tight break-words">{unidadeResumo || '\u00A0'}</p>
          </div>
          <div className="p-0.5 text-right">
            <p className="text-[7.5px] font-bold uppercase mb-0.25">Atendimento</p>
            <p className="text-xs font-mono font-bold">{numeroAtendimento}</p>
          </div>
        </div>

        <table className="w-full border-collapse border-2 border-black text-[7.5px] mb-1">
          <tbody>
            <tr>
              <td className="border border-black p-0.5 align-top w-[58%]">
                <strong>PACIENTE:</strong> {p.nomeCompleto}
              </td>
              <td className="border border-black p-0.5 align-top">
                <strong>IDADE:</strong> {p.idadeFmt}
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-0.5">
                <strong>ENDEREÇO:</strong> {p.enderecoFmt || '\u00A0'}
              </td>
            </tr>
            <tr>
              <td className="border border-black p-0.5">
                <strong>DATA NASCIMENTO:</strong> {p.nascFmt}
              </td>
              <td className="border border-black p-0.5">
                <strong>NATURALIDADE:</strong> {p.naturalidade || '\u00A0'}
              </td>
            </tr>
            <tr>
              <td className="border border-black p-0.5">
                <strong>MÃE:</strong> {p.nomeMae || '\u00A0'}
              </td>
              <td className="border border-black p-0.5">
                <strong>DATA ATENDIMENTO:</strong> {dataAberturaFmt}
              </td>
            </tr>
            <tr>
              <td className="border border-black p-0.5 font-mono">
                <strong>CNS:</strong> {p.cns || '\u00A0'}
              </td>
              <td className="border border-black p-0.5">
                <strong>ESCOLARIDADE:</strong> {p.escolaridade || '\u00A0'}
              </td>
            </tr>
            <tr>
              <td className="border border-black p-0.5">
                <strong>PROFISSÃO:</strong> {p.profissao || '\u00A0'}
              </td>
              <td className="border border-black p-0.5">
                <strong>RAÇA/COR:</strong> {p.racaCor || '\u00A0'}
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-0.5">
                <strong>ACOMPANHANTE:</strong> {p.acompanhanteNome || '\u00A0'}
                {p.acompanhanteTelefone ? (
                  <span className="font-mono"> — Tel.: {p.acompanhanteTelefone}</span>
                ) : null}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex items-center gap-2 mb-1 mt-1.5">
          <div className="flex-1 h-px bg-black" />
          <p className="shrink-0 text-[9px] font-bold uppercase tracking-wide px-1">Atendimento médico</p>
          <div className="flex-1 h-px bg-black" />
        </div>

        <BlocoCampoMedico titulo="HDA — História da doença atual" texto={medico?.hda ?? ''} linhasVazio={3} />
        <BlocoCampoMedico titulo="Exame clínico" texto={medico?.exameClinico ?? ''} linhasVazio={5} />
        <BlocoCampoMedico titulo="HD — Hipótese diagnóstica" texto={medico?.hipoteses ?? ''} linhasVazio={2} />

        <table className="w-full border-collapse border-2 border-black text-[7.5px] mb-2">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-0.5 text-left font-bold uppercase w-[78%]">
                Conduta / prescrição médica
              </th>
              <th className="border border-black p-0.5 text-center font-bold uppercase w-[22%]">
                Horário da medicação
              </th>
            </tr>
          </thead>
          <tbody>
            {prescRows.map((row, i) => (
              <tr key={i}>
                <td className="border border-black p-0.5 align-top text-[7.5px] whitespace-pre-wrap min-h-[1.1rem]">
                  {row.conduta.trim() ? row.conduta : '\u00A0'}
                </td>
                <td className="border border-black p-0.5 align-top text-[7.5px] whitespace-pre-wrap min-h-[1.1rem]">
                  {row.horario.trim() ? row.horario : '\u00A0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 border-t border-black pt-1 text-center text-[7.5px]">
          Assinatura e carimbo — médico(a)
          {medico?.medicoNome ? (
            <p className="text-[7px] font-normal mt-0.5">{medico.medicoNome}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
