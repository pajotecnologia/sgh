import { describe, it, expect } from 'vitest'
import {
  converterPacienteParaFhir,
  converterSinaisVitaisParaFhir,
} from '@/lib/fhir-r4'

describe('Fase 5 — Interoperabilidade HL7 FHIR R4', () => {
  it('deve converter paciente do SGH para o recurso FHIR R4 Patient', () => {
    const fhirPatient = converterPacienteParaFhir({
      id: 'pac-12345',
      nome: 'Gabriel Arcanjo',
      cpf: '000.111.222-33',
      cns: '700000000000001',
      dataNascimento: new Date('1990-08-15'),
      sexo: 'MASCULINO',
      telefone: '(11) 98888-7777',
    })

    expect(fhirPatient.resourceType).toBe('Patient')
    expect(fhirPatient.id).toBe('pac-12345')
    expect(fhirPatient.name[0].text).toBe('Gabriel Arcanjo')
    expect(fhirPatient.gender).toBe('male')
    expect(fhirPatient.birthDate).toBe('1990-08-15')
    expect(fhirPatient.identifier).toHaveLength(2)
    expect(fhirPatient.identifier[0].value).toBe('000.111.222-33')
  })

  it('deve converter sinais vitais para o recurso FHIR R4 Observation com LOINC e UCUM', () => {
    const fhirObs = converterSinaisVitaisParaFhir(
      'obs-999',
      'pac-12345',
      'PA_SISTOLICA',
      120,
      '2026-09-23T16:00:00Z'
    )

    expect(fhirObs.resourceType).toBe('Observation')
    expect(fhirObs.code.coding[0].system).toBe('http://loinc.org')
    expect(fhirObs.code.coding[0].code).toBe('8480-6') // LOINC da PA Sistólica
    expect(fhirObs.valueQuantity?.value).toBe(120)
    expect(fhirObs.valueQuantity?.unit).toBe('mmHg')
    expect(fhirObs.subject.reference).toBe('Patient/pac-12345')
  })
})
