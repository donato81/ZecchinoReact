// ============================================================================
// PLAN 017 — T4: Motore di calcolo puro per simulazione finanziaria
// ============================================================================
// Nessuna dipendenza da React, Supabase o AppDataContext.
// Usa roundCurrency da helpers.ts per tutti gli arrotondamenti monetari.
// Metodo francese: rata mensile costante, quota interessi e capitale variabili.

import { roundCurrency } from '@/lib/helpers';
import type { PianoAmmortamentoVoce, LoanSimulationResult } from '@/lib/types';

/**
 * Errore di validazione per input non validi al motore di calcolo.
 */
export class LoanCalculatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoanCalculatorError';
  }
}

/**
 * Parametri di input per la simulazione finanziaria.
 */
export interface LoanCalculatorInput {
  importo: number;
  tassoAnnuo: number;
  durataMesi: number;
  dataInizio: string;
}

/**
 * Valida i parametri di input per la simulazione finanziaria.
 * Lancia LoanCalculatorError se i parametri non sono validi.
 */
export function validateInput(input: LoanCalculatorInput): void {
  if (input.importo <= 0) {
    throw new LoanCalculatorError("L'importo deve essere maggiore di zero.");
  }
  if (input.tassoAnnuo < 0) {
    throw new LoanCalculatorError('Il tasso annuo non può essere negativo.');
  }
  if (input.durataMesi <= 0 || !Number.isInteger(input.durataMesi)) {
    throw new LoanCalculatorError(
      'La durata in mesi deve essere un numero intero maggiore di zero.',
    );
  }
}

/**
 * Calcola la rata mensile costante con il metodo francese.
 * Se il tasso è zero, la rata è semplicemente importo / durata.
 */
export function calcolaRataMensile(
  importo: number,
  tassoAnnuo: number,
  durataMesi: number,
): number {
  if (tassoAnnuo === 0) {
    return roundCurrency(importo / durataMesi);
  }
  const tassoMensile = tassoAnnuo / 100 / 12;
  const rata =
    (importo * (tassoMensile * Math.pow(1 + tassoMensile, durataMesi))) /
    (Math.pow(1 + tassoMensile, durataMesi) - 1);
  return roundCurrency(rata);
}

/**
 * Genera il piano di ammortamento completo con il metodo francese.
 * L'ultima rata viene aggiustata per assorbire eventuali differenze di arrotondamento,
 * garantendo che il saldo residuo finale sia esattamente zero.
 */
export function generaPianoAmmortamento(
  input: LoanCalculatorInput,
): PianoAmmortamentoVoce[] {
  validateInput(input);

  const { importo, tassoAnnuo, durataMesi, dataInizio } = input;
  const rataMensile = calcolaRataMensile(importo, tassoAnnuo, durataMesi);
  const tassoMensile = tassoAnnuo / 100 / 12;
  const piano: PianoAmmortamentoVoce[] = [];
  let saldoResiduo = roundCurrency(importo);

  for (let i = 1; i <= durataMesi; i++) {
    const quotaInteressi = roundCurrency(saldoResiduo * tassoMensile);

    let quotaCapitale: number;
    let importoRata: number;

    if (i === durataMesi) {
      // Ultima rata: assorbe la differenza di arrotondamento
      quotaCapitale = saldoResiduo;
      importoRata = roundCurrency(quotaCapitale + quotaInteressi);
    } else {
      importoRata = rataMensile;
      quotaCapitale = roundCurrency(importoRata - quotaInteressi);
    }

    saldoResiduo = roundCurrency(saldoResiduo - quotaCapitale);
    // Corregge eventuali artefatti floating point negativi
    if (saldoResiduo < 0) saldoResiduo = 0;

    // Calcola la data scadenza della rata
    const dataBase = new Date(dataInizio);
    dataBase.setMonth(dataBase.getMonth() + i);
    const dataScadenza = dataBase.toISOString().slice(0, 10);

    piano.push({
      numeroRata: i,
      dataScadenza,
      importoRata,
      quotaCapitale,
      quotaInteressi,
      saldoResiduo,
    });
  }

  return piano;
}

/**
 * Calcola la simulazione finanziaria completa.
 * Restituisce rata mensile, totale da pagare, totale interessi e piano di ammortamento.
 */
export function calcolaSimulazione(
  input: LoanCalculatorInput,
): LoanSimulationResult {
  validateInput(input);

  const piano = generaPianoAmmortamento(input);
  const rataMensile = calcolaRataMensile(
    input.importo,
    input.tassoAnnuo,
    input.durataMesi,
  );
  const totaleDaPagare = roundCurrency(
    piano.reduce((sum, voce) => sum + voce.importoRata, 0),
  );
  const totaleInteressi = roundCurrency(
    piano.reduce((sum, voce) => sum + voce.quotaInteressi, 0),
  );

  return {
    rataMensile,
    totaleDaPagare,
    totaleInteressi,
    pianoAmmortamento: piano,
  };
}

/**
 * Calcola il saldo residuo a una data specifica, basato sul piano di ammortamento.
 * Restituisce il saldo residuo alla data più recente che non supera la data indicata.
 * Se la data è precedente alla prima rata, restituisce l'importo iniziale.
 */
export function calcolaSaldoResiduoAData(
  input: LoanCalculatorInput,
  dataRiferimento: string,
): number {
  validateInput(input);

  const piano = generaPianoAmmortamento(input);
  const dataRif = dataRiferimento.slice(0, 10);

  let saldoResiduo = roundCurrency(input.importo);
  for (const voce of piano) {
    if (voce.dataScadenza <= dataRif) {
      saldoResiduo = voce.saldoResiduo;
    } else {
      break;
    }
  }

  return saldoResiduo;
}

/**
 * Calcola la data fine prevista in base a data inizio e durata in mesi.
 */
export function calcolaDataFinePrevista(
  dataInizio: string,
  durataMesi: number,
): string {
  const [year, month, day] = dataInizio.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + durataMesi, day));
  return date.toISOString().slice(0, 10);
}
