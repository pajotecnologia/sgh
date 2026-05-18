// lib/interacoes-medicamentosas.ts
// Verificação local de interações medicamentosas (base simplificada)
// Em produção: integrar com API DrugBank ou RxNorm

export interface InteracaoMedicamentosa {
  medicamento1: string;
  medicamento2: string;
  gravidade: 'Leve' | 'Moderada' | 'Grave';
  descricao: string;
}

// Base local de interações conhecidas (substrings dos nomes — case-insensitive)
const BASE_INTERACOES: Array<{
  drug1: string[];
  drug2: string[];
  gravidade: 'Leve' | 'Moderada' | 'Grave';
  descricao: string;
}> = [
  {
    drug1: ['varfarina', 'warfarina'],
    drug2: ['aspirina', 'ácido acetilsalicílico', 'aas'],
    gravidade: 'Grave',
    descricao: 'Risco aumentado de sangramento. Monitorar INR.',
  },
  {
    drug1: ['varfarina', 'warfarina'],
    drug2: ['ibuprofeno', 'diclofenaco', 'naproxeno'],
    gravidade: 'Grave',
    descricao: 'AINEs aumentam risco hemorrágico com anticoagulantes.',
  },
  {
    drug1: ['captopril', 'enalapril', 'lisinopril', 'ramipril'],
    drug2: ['espironolactona', 'amilorida'],
    gravidade: 'Moderada',
    descricao: 'Risco de hipercalemia. Monitorar eletrólitos.',
  },
  {
    drug1: ['metformina'],
    drug2: ['contraste iodado', 'iobitridol'],
    gravidade: 'Grave',
    descricao: 'Suspender metformina 48h antes de contraste iodado. Risco de acidose lática.',
  },
  {
    drug1: ['digoxina'],
    drug2: ['amiodarona', 'verapamil', 'diltiazem'],
    gravidade: 'Grave',
    descricao: 'Aumento dos níveis de digoxina. Risco de toxicidade digitálica.',
  },
  {
    drug1: ['inibidor de monoaminoxidase', 'iproniazida', 'tranilcipromina', 'fenelzina'],
    drug2: ['tramadol', 'meperidina', 'petidina'],
    gravidade: 'Grave',
    descricao: 'Síndrome serotoninérgica potencialmente fatal. Contraindicado.',
  },
  {
    drug1: ['sildenafila', 'tadalafila', 'vardenafila'],
    drug2: ['nitrato', 'nitroglicerina', 'isossorbida'],
    gravidade: 'Grave',
    descricao: 'Hipotensão grave potencialmente fatal. Contraindicado.',
  },
  {
    drug1: ['estatina', 'sinvastatina', 'atorvastatina', 'rosuvastatina'],
    drug2: ['fluconazol', 'itraconazol', 'cetoconazol'],
    gravidade: 'Moderada',
    descricao: 'Aumento do risco de miopatia e rabdomiólise.',
  },
  {
    drug1: ['lítio'],
    drug2: ['ibuprofeno', 'diclofenaco', 'naproxeno', 'aine'],
    gravidade: 'Moderada',
    descricao: 'AINEs reduzem excreção renal do lítio. Risco de toxicidade.',
  },
  {
    drug1: ['ciprofloxacino', 'norfloxacino', 'levofloxacino'],
    drug2: ['teofilina'],
    gravidade: 'Moderada',
    descricao: 'Quinolonas inibem metabolismo da teofilina. Monitorar níveis.',
  },
];

export interface ResultadoVerificacaoInteracoes {
  temInteracoes: boolean;
  interacoes: InteracaoMedicamentosa[];
}

/**
 * Verifica interações entre uma lista de medicamentos.
 * Compara todos os pares possíveis contra a base local.
 */
export function verificarInteracoes(
  medicamentos: string[]
): ResultadoVerificacaoInteracoes {
  const interacoesEncontradas: InteracaoMedicamentosa[] = [];

  if (medicamentos.length < 2) {
    return { temInteracoes: false, interacoes: [] };
  }

  for (let i = 0; i < medicamentos.length; i++) {
    for (let j = i + 1; j < medicamentos.length; j++) {
      const med1 = medicamentos[i].toLowerCase();
      const med2 = medicamentos[j].toLowerCase();

      for (const regra of BASE_INTERACOES) {
        const match1e2 =
          regra.drug1.some((d) => med1.includes(d)) &&
          regra.drug2.some((d) => med2.includes(d));
        const match2e1 =
          regra.drug1.some((d) => med2.includes(d)) &&
          regra.drug2.some((d) => med1.includes(d));

        if (match1e2 || match2e1) {
          interacoesEncontradas.push({
            medicamento1: medicamentos[i],
            medicamento2: medicamentos[j],
            gravidade: regra.gravidade,
            descricao: regra.descricao,
          });
        }
      }
    }
  }

  return {
    temInteracoes: interacoesEncontradas.length > 0,
    interacoes: interacoesEncontradas,
  };
}

/**
 * Verifica se um medicamento é compatível com as alergias do paciente.
 * Retorna lista de conflitos encontrados.
 */
export function verificarAlergiaMedicamento(
  nomeMedicamento: string,
  alergias: string[]
): string[] {
  const med = nomeMedicamento.toLowerCase();
  return alergias.filter((alergia) => {
    const a = alergia.toLowerCase();
    // Verificar se o nome do medicamento ou a alergia contém um do outro
    return med.includes(a) || a.includes(med);
  });
}
