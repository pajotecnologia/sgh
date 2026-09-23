/**
 * Mapeamento de Recursos HL7 FHIR R4 para o SGH
 */

export interface FhirPatient {
  resourceType: 'Patient'
  id: string
  identifier: {
    system: string
    value: string
  }[]
  name: {
    use: 'official'
    text: string
  }[]
  gender: 'male' | 'female' | 'other' | 'unknown'
  birthDate: string
  telecom?: { system: string; value: string }[]
  address?: {
    text?: string
    city?: string
    state?: string
    postalCode?: string
  }[]
}

export interface FhirObservation {
  resourceType: 'Observation'
  id: string
  status: 'final' | 'preliminary'
  category?: {
    coding: { system: string; code: string; display: string }[]
  }[]
  code: {
    coding: { system: string; code: string; display: string }[]
    text: string
  }
  subject: {
    reference: string
    display?: string
  }
  effectiveDateTime: string
  valueQuantity?: {
    value: number
    unit: string
    system: string
    code: string
  }
  valueString?: string
  referenceRange?: {
    low?: { value: number; unit: string }
    high?: { value: number; unit: string }
    text?: string
  }[]
}

export interface FhirEncounter {
  resourceType: 'Encounter'
  id: string
  status: 'in-progress' | 'finished' | 'planned'
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode'
    code: 'EMER' | 'IMP' | 'AMB'
    display: string
  }
  subject: {
    reference: string
    display: string
  }
  period: {
    start: string
    end?: string
  }
  reasonCode?: {
    text: string
  }[]
}

export function converterPacienteParaFhir(paciente: {
  id: string
  nome: string
  cpf: string
  cns?: string | null
  dataNascimento: Date | string
  sexo: string
  telefone?: string | null
}): FhirPatient {
  const birthDateStr =
    paciente.dataNascimento instanceof Date
      ? paciente.dataNascimento.toISOString().split('T')[0]
      : String(paciente.dataNascimento).split('T')[0]

  const genderMap: Record<string, FhirPatient['gender']> = {
    MASCULINO: 'male',
    FEMININO: 'female',
    INTERSEXO: 'other',
  }

  const identifiers = [
    { system: 'https://saude.gov.br/cpf', value: paciente.cpf },
  ]
  if (paciente.cns) {
    identifiers.push({ system: 'https://saude.gov.br/cns', value: paciente.cns })
  }

  return {
    resourceType: 'Patient',
    id: paciente.id,
    identifier: identifiers,
    name: [{ use: 'official', text: paciente.nome }],
    gender: genderMap[paciente.sexo] || 'unknown',
    birthDate: birthDateStr,
    telecom: paciente.telefone ? [{ system: 'phone', value: paciente.telefone }] : undefined,
  }
}

export function converterSinaisVitaisParaFhir(
  observacaoId: string,
  pacienteId: string,
  tipo: 'PA_SISTOLICA' | 'FC' | 'FR' | 'SPO2' | 'TEMP' | 'GLICEMIA',
  valor: number,
  dataHora: Date | string
): FhirObservation {
  const loincMap: Record<string, { code: string; display: string; unit: string; ucum: string }> = {
    PA_SISTOLICA: { code: '8480-6', display: 'Systolic blood pressure', unit: 'mmHg', ucum: 'mm[Hg]' },
    FC: { code: '8867-4', display: 'Heart rate', unit: 'beats/min', ucum: '/min' },
    FR: { code: '9279-1', display: 'Respiratory rate', unit: 'breaths/min', ucum: '/min' },
    SPO2: { code: '2708-6', display: 'Oxygen saturation', unit: '%', ucum: '%' },
    TEMP: { code: '8310-5', display: 'Body temperature', unit: 'Cel', ucum: 'Cel' },
    GLICEMIA: { code: '2339-0', display: 'Glucose [Mass/volume] in Blood', unit: 'mg/dL', ucum: 'mg/dL' },
  }

  const loinc = loincMap[tipo] || { code: 'custom', display: tipo, unit: '', ucum: '' }
  const dataIso = dataHora instanceof Date ? dataHora.toISOString() : dataHora

  return {
    resourceType: 'Observation',
    id: observacaoId,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: loinc.code,
          display: loinc.display,
        },
      ],
      text: loinc.display,
    },
    subject: {
      reference: `Patient/${pacienteId}`,
    },
    effectiveDateTime: dataIso,
    valueQuantity: {
      value: valor,
      unit: loinc.unit,
      system: 'http://unitsofmeasure.org',
      code: loinc.ucum,
    },
  }
}
