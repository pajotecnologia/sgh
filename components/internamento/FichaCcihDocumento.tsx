// components/internamento/FichaCcihDocumento.tsx

import type { ReactNode } from 'react'
import type { FichaCcihImpressaoDados } from '@/lib/montar-dados-ccih-impressao'
import { CabecalhoInstituicaoImpressao } from '@/components/print/CabecalhoInstituicaoImpressao'
import { BotaoImprimirFicha } from '@/components/recepcao/BotaoImprimirFicha'

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mb-4 break-inside-avoid">
      <h2 className="text-xs font-bold uppercase border-b border-slate-300 pb-1 mb-2 text-slate-800">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid grid-cols-[minmax(8rem,32%)_1fr] gap-2 text-sm py-1 border-b border-slate-100 last:border-0">
      <span className="font-medium text-slate-600">{rotulo}</span>
      <span className="text-slate-900 whitespace-pre-wrap">{valor || '—'}</span>
    </div>
  )
}

function TextoLivre({ texto }: { texto: string }) {
  return (
    <p className="text-sm text-slate-900 whitespace-pre-wrap border border-slate-200 rounded p-2 min-h-[3rem] bg-slate-50/50">
      {texto || '—'}
    </p>
  )
}

function fmtDataBr(s: string | undefined): string {
  if (!s?.trim()) return '—'
  const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('pt-BR')
}

function simNao(v: boolean | undefined): string {
  return v ? 'Sim' : 'Não'
}

export function FichaCcihDocumento({ dados }: { dados: FichaCcihImpressaoDados }) {
  const f = dados.formulario
  const p = f.paciente_internacao
  const cir = f.dados_cirurgicos
  const obs = f.dados_obstetricos
  const inf = f.infeccao_notificada
  const anti = f.uso_antimicrobianos
  const cult = f.dados_cultura

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 print:p-4 max-w-[210mm] mx-auto">
      <div className="print:hidden mb-4 flex justify-end">
        <BotaoImprimirFicha />
      </div>

      <CabecalhoInstituicaoImpressao
        instituicao={dados.instituicao}
        subtitulo="Ficha de Notificação à CCIH — Infecção Relacionada à Assistência à Saúde (IRAS)"
        direita={
          <div className="text-right text-xs">
            <p className="font-bold">Status: {dados.status}</p>
            <p className="font-mono mt-1">{dados.numeroAtendimento}</p>
            <p className="mt-1">{dados.diasInternacao}</p>
          </div>
        }
      />

      <Bloco titulo="Controle interno">
        <Linha rotulo="Nº controle" valor={f.controle_interno?.numero_controle ?? ''} />
        <Linha rotulo="Nº registro" valor={f.controle_interno?.numero_registro ?? ''} />
      </Bloco>

      <Bloco titulo="Hospital e notificação">
        <Linha rotulo="Hospital" valor={f.hospital ?? ''} />
        <Linha rotulo="Clínica / serviço" valor={f.hospital_unidade?.clinica_servico ?? ''} />
        <Linha rotulo="Andar / ala" valor={f.hospital_unidade?.andar_ala ?? ''} />
        <Linha rotulo="Enfermaria / leito" valor={f.hospital_unidade?.enfermaria_leito ?? ''} />
        <Linha rotulo="Data da notificação" valor={fmtDataBr(f.data_notificacao)} />
        <Linha rotulo="Médico responsável" valor={f.medico_responsavel?.nome ?? ''} />
        <Linha rotulo="CRM / carimbo" valor={f.medico_responsavel?.crm_carimbo ?? ''} />
        <Linha rotulo="Assinatura / carimbo digital" valor={f.medico_responsavel?.assinatura_carimbo_digital ?? ''} />
      </Bloco>

      <Bloco titulo="Paciente e internação">
        <Linha rotulo="Nome" valor={p.nome} />
        <Linha rotulo="Prontuário" valor={p.prontuario ?? ''} />
        <Linha rotulo="Sexo" valor={p.sexo ?? ''} />
        <Linha
          rotulo="Idade"
          valor={
            p.idade != null
              ? `${p.idade} ${p.idade_unidade?.trim() || 'anos'}`
              : ''
          }
        />
        <Linha rotulo="Nome da mãe" valor={p.nome_mae ?? ''} />
        <Linha rotulo="Prontuário da mãe" valor={p.prontuario_mae ?? ''} />
        <Linha rotulo="Clínica / setor" valor={p.clinica ?? f.hospital_unidade?.clinica_servico ?? ''} />
        <Linha rotulo="Andar / ala" valor={p.andar ?? f.hospital_unidade?.andar_ala ?? ''} />
        <Linha rotulo="Data da internação" valor={fmtDataBr(p.data_internacao)} />
        <Linha rotulo="Alta em" valor={fmtDataBr(p.alta_em)} />
        <Linha rotulo="Diagnóstico na admissão" valor={p.diagnostico ?? ''} />
        <Linha rotulo="Houve óbito" valor={simNao(p.obito?.houve_obito)} />
        <Linha rotulo="Óbito — data" valor={fmtDataBr(p.obito?.data)} />
        <Linha rotulo="Óbito — causa" valor={p.obito?.causa ?? ''} />
        <Linha rotulo="Causa relacionada à infecção" valor={simNao(p.obito?.causa_relacionada_infeccao)} />
      </Bloco>

      <Bloco titulo="Dados cirúrgicos">
        <Linha rotulo="Houve cirurgia" valor={simNao(cir?.houve_cirurgia)} />
        {cir?.houve_cirurgia ? (
          <>
            <Linha rotulo="Nome da cirurgia" valor={cir.nome_cirurgia ?? cir.descricao_cirurgia ?? ''} />
            <Linha rotulo="Data" valor={fmtDataBr(cir.data_cirurgia)} />
            <Linha rotulo="Duração (h/min)" valor={cir.duracao_horas_minutos ?? ''} />
            <Linha rotulo="Cirurgião" valor={cir.cirurgiao ?? ''} />
            <Linha rotulo="Classificação" valor={cir.classificacao_cirurgia ?? cir.tipo_cirurgia ?? ''} />
            <Linha rotulo="Anestesista" valor={cir.anestesista ?? ''} />
            <Linha rotulo="Tipo de anestesia" valor={cir.tipo_anestesia ?? ''} />
            <Linha rotulo="Implante / prótese" valor={simNao(cir.utilizou_implante_protese)} />
          </>
        ) : null}
      </Bloco>

      <Bloco titulo="Dados obstétricos">
        <Linha rotulo="Parto transpelvico" valor={simNao(obs?.parto_transpelvico)} />
        <Linha rotulo="Obstetra" valor={obs?.obstetra ?? ''} />
        <Linha rotulo="Data do parto" valor={fmtDataBr(obs?.data_parto ?? obs?.data)} />
        <Linha rotulo="Bolsa rota" valor={simNao(obs?.bolsa_rota?.apresentou)} />
        {obs?.bolsa_rota?.apresentou ? (
          <Linha
            rotulo="Horas (bolsa rota)"
            valor={
              obs.bolsa_rota.numero_horas != null
                ? String(obs.bolsa_rota.numero_horas)
                : obs.bolsa_rota.tempo_horas != null
                  ? String(obs.bolsa_rota.tempo_horas)
                  : ''
            }
          />
        ) : null}
        <Linha rotulo="Episiorrafia" valor={simNao(obs?.episiorrafia)} />
        <Linha rotulo="Placenta completa" valor={simNao(obs?.placenta_completa !== false)} />
        <Linha rotulo="Observações — placenta" valor={obs?.placenta ?? ''} />
      </Bloco>

      <Bloco titulo="Procedimentos de risco realizados">
        <TextoLivre texto={dados.procedimentosRisco} />
        <div className="mt-3">
          <Linha rotulo="Infecção" valor={dados.infeccaoOpcao} />
        </div>
      </Bloco>

      <Bloco titulo="Infecção notificada">
        <Linha rotulo="Classificação" valor={inf?.classificacao ?? ''} />
        <p className="text-xs font-medium text-slate-600 mb-1 mt-2">Localização topográfica</p>
        <TextoLivre texto={dados.topografias} />
      </Bloco>

      <Bloco titulo="Uso de antimicrobianos">
        <Linha rotulo="Houve uso" valor={simNao(anti?.houve_uso)} />
        <Linha rotulo="Uso de antimicrobiano" valor={anti?.uso_antimicrobiano ?? ''} />
        <Linha rotulo="Finalidade" valor={anti?.finalidade ?? ''} />
        <p className="text-xs font-medium text-slate-600 mb-1 mt-2">Medicamentos</p>
        <TextoLivre texto={dados.medicamentos} />
      </Bloco>

      <Bloco titulo="Dados de cultura">
        <Linha rotulo="Cultura realizada" valor={simNao(cult?.realizada ?? cult?.cultura_realizada)} />
        <Linha rotulo="Tipo / material coletado" valor={cult?.tipo_material_coletado ?? cult?.tipos ?? ''} />
        <Linha rotulo="Data da coleta" valor={fmtDataBr(cult?.data_coleta)} />
        <p className="text-xs font-medium text-slate-600 mb-1 mt-2">Resultados</p>
        <TextoLivre texto={cult?.resultados ?? ''} />
        <p className="text-xs font-medium text-slate-600 mb-1 mt-2">Observações do laboratório</p>
        <TextoLivre texto={cult?.observacoes_laboratorio ?? ''} />
        {([1, 2, 3] as const).map((n) => {
          const g = cult?.germes?.[`germe_${n}`]
          const nome = g?.nome_microorganismo?.trim()
          const ab = g?.antibiograma_sensibilidade?.trim()
          if (!nome && !ab) return null
          return (
            <div key={n} className="mt-2">
              <Linha rotulo={`Germe ${n}`} valor={nome ?? ''} />
              {ab ? <TextoLivre texto={ab} /> : null}
            </div>
          )
        })}
      </Bloco>

      <Bloco titulo="Registro da equipe CCIH">
        <p className="text-xs font-medium text-slate-600 mb-1">Observações</p>
        <TextoLivre texto={dados.observacoesEquipe} />
        <p className="text-xs font-medium text-slate-600 mb-1 mt-3">Parecer CCIH</p>
        <TextoLivre texto={dados.parecerCcih} />
      </Bloco>

      <footer className="mt-8 pt-4 border-t border-slate-300 text-xs text-slate-500 print:fixed print:bottom-4 print:left-0 print:right-0 print:px-6">
        <div className="flex justify-between gap-8">
          <div className="flex-1 border-t border-slate-400 pt-1 text-center">
            Assinatura do médico responsável
          </div>
          <div className="flex-1 border-t border-slate-400 pt-1 text-center">
            Assinatura / carimbo CCIH
          </div>
        </div>
        <p className="text-center mt-4">Documento gerado pelo SGH — uso interno / vigilância epidemiológica</p>
      </footer>
    </div>
  )
}
