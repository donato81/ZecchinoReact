// ============================================================================
// PLAN 017 — T5: Repository Prestiti
// ============================================================================
// Pattern modellato su src/lib/supabase/repositories/budget.ts.
// Vincolo Architetturale: invoca loan-calculator.ts per derivare
// rataMensile, totaleInteressi e dataFinePrevista. Nessuna formula
// di calcolo inline o duplicata.

import { supabase } from '../client';
import { RepositoryError, type DbPrestitoMutuo } from '../types';
import type {
  PrestitoMutuo,
  LoanType,
  LoanStatus,
  LoanDirection,
} from '../../types';
import {
  calcolaRataMensile,
  calcolaDataFinePrevista,
  calcolaSimulazione,
} from '../../loan-calculator';
import { roundCurrency } from '../../helpers';

function toClient(row: DbPrestitoMutuo): PrestitoMutuo {
  return {
    id: row.id,
    tipo: row.tipo as LoanType,
    stato: row.stato as LoanStatus,
    direzione: row.direzione as LoanDirection,
    controparteNome: row.controparte_nome,
    importoIniziale: row.importo_iniziale,
    valuta: row.valuta,
    tassoAnnuo: row.tasso_annuo ?? undefined,
    durataMesi: row.durata_mesi ?? undefined,
    rataMensile: row.rata_mensile ?? undefined,
    totaleInteressi: row.totale_interessi ?? undefined,
    dataInizio: row.data_inizio,
    dataFinePrevista: row.data_fine_prevista ?? undefined,
    saldoResiduo: row.saldo_residuo,
    note: row.note ?? undefined,
  };
}

function toDb(
  data: Partial<Omit<PrestitoMutuo, 'id'>>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.tipo !== undefined) out.tipo = data.tipo;
  if (data.stato !== undefined) out.stato = data.stato;
  if (data.direzione !== undefined) out.direzione = data.direzione;
  if (data.controparteNome !== undefined)
    out.controparte_nome = data.controparteNome;
  if (data.importoIniziale !== undefined)
    out.importo_iniziale = data.importoIniziale;
  if (data.valuta !== undefined) out.valuta = data.valuta;
  if ('tassoAnnuo' in data) out.tasso_annuo = data.tassoAnnuo ?? null;
  if ('durataMesi' in data) out.durata_mesi = data.durataMesi ?? null;
  if ('rataMensile' in data) out.rata_mensile = data.rataMensile ?? null;
  if ('totaleInteressi' in data)
    out.totale_interessi = data.totaleInteressi ?? null;
  if (data.dataInizio !== undefined) out.data_inizio = data.dataInizio;
  if ('dataFinePrevista' in data)
    out.data_fine_prevista = data.dataFinePrevista ?? null;
  if (data.saldoResiduo !== undefined) out.saldo_residuo = data.saldoResiduo;
  if ('note' in data) out.note = data.note ?? null;
  return out;
}

async function getUid(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new RepositoryError('Utente non autenticato');
  return user.id;
}

/**
 * Calcola e aggiunge campi derivati (rataMensile, totaleInteressi, dataFinePrevista)
 * al payload da salvare. Usa il motore loan-calculator.ts senza duplicare formule.
 */
function enrichWithDerivedFields(
  data: Partial<Omit<PrestitoMutuo, 'id'>>,
  base: {
    importoIniziale: number;
    tassoAnnuo?: number;
    durataMesi?: number;
    dataInizio: string;
  },
): Partial<Omit<PrestitoMutuo, 'id'>> {
  const enriched = { ...data };

  const importo = data.importoIniziale ?? base.importoIniziale;
  const tasso = data.tassoAnnuo ?? base.tassoAnnuo;
  const durata = data.durataMesi ?? base.durataMesi;
  const dataInizio = data.dataInizio ?? base.dataInizio;

  // Solo per mutuo_finanziamento con tutti i parametri disponibili
  const tipo = data.tipo ?? 'mutuo_finanziamento';
  if (
    tipo === 'mutuo_finanziamento' &&
    tasso != null &&
    durata != null &&
    durata > 0
  ) {
    const simulazione = calcolaSimulazione({
      importo,
      tassoAnnuo: tasso,
      durataMesi: durata,
      dataInizio,
    });
    enriched.rataMensile = simulazione.rataMensile;
    enriched.totaleInteressi = simulazione.totaleInteressi;
    enriched.dataFinePrevista = calcolaDataFinePrevista(dataInizio, durata);
  } else if (durata != null && durata > 0) {
    // Per prestito personale: calcola solo la data fine prevista
    enriched.dataFinePrevista = calcolaDataFinePrevista(dataInizio, durata);
  }

  return enriched;
}

export async function getAll(): Promise<PrestitoMutuo[]> {
  const { data, error } = await supabase
    .from('prestiti_mutui')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new RepositoryError(error);
  return (data as DbPrestitoMutuo[]).map(toClient);
}

export async function getById(id: string): Promise<PrestitoMutuo> {
  const { data, error } = await supabase
    .from('prestiti_mutui')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new RepositoryError(error);
  return toClient(data as DbPrestitoMutuo);
}

export async function getAttivi(): Promise<PrestitoMutuo[]> {
  const { data, error } = await supabase
    .from('prestiti_mutui')
    .select('*')
    .eq('stato', 'attivo')
    .order('data_inizio', { ascending: false });
  if (error) throw new RepositoryError(error);
  return (data as DbPrestitoMutuo[]).map(toClient);
}

export async function create(
  input: Omit<PrestitoMutuo, 'id'>,
): Promise<PrestitoMutuo> {
  const uid = await getUid();

  const enriched = enrichWithDerivedFields(input, {
    importoIniziale: input.importoIniziale,
    tassoAnnuo: input.tassoAnnuo,
    durataMesi: input.durataMesi,
    dataInizio: input.dataInizio,
  });

  const dbPayload = {
    ...toDb(enriched),
    user_id: uid,
    saldo_residuo: input.importoIniziale,
  };

  const { data, error } = await supabase
    .from('prestiti_mutui')
    .insert(dbPayload)
    .select()
    .single();
  if (error) throw new RepositoryError(error);
  return toClient(data as DbPrestitoMutuo);
}

export async function update(
  id: string,
  input: Partial<Omit<PrestitoMutuo, 'id'>>,
  existing?: PrestitoMutuo,
): Promise<PrestitoMutuo> {
  // Se non abbiamo i dati esistenti, li recuperiamo dal DB per ricalcolare i campi derivati
  const base = existing ?? (await getById(id));
  const enriched = enrichWithDerivedFields(input, {
    importoIniziale: base.importoIniziale,
    tassoAnnuo: base.tassoAnnuo,
    durataMesi: base.durataMesi,
    dataInizio: base.dataInizio,
  });

  const { data, error } = await supabase
    .from('prestiti_mutui')
    .update(toDb(enriched))
    .eq('id', id)
    .select()
    .single();
  if (error) throw new RepositoryError(error);
  return toClient(data as DbPrestitoMutuo);
}

/**
 * Promuove una simulazione a contratto attivo.
 * Il record mantiene lo stesso id (DESIGN 017, Decisione 6).
 * I parametri possono essere modificati in fase di promozione (Decisione 7).
 * I campi derivati vengono ricalcolati tramite il motore.
 */
export async function promote(
  id: string,
  overrides?: Partial<
    Pick<
      PrestitoMutuo,
      'importoIniziale' | 'tassoAnnuo' | 'durataMesi' | 'dataInizio'
    >
  >,
): Promise<PrestitoMutuo> {
  const existing = await getById(id);
  if (existing.stato !== 'simulazione') {
    throw new RepositoryError(
      'Solo le simulazioni possono essere promosse a contratto attivo.',
    );
  }

  const merged: Partial<Omit<PrestitoMutuo, 'id'>> = {
    ...overrides,
    stato: 'attivo' as const,
    saldoResiduo: overrides?.importoIniziale ?? existing.importoIniziale,
  };

  return update(id, merged, {
    ...existing,
    importoIniziale: overrides?.importoIniziale ?? existing.importoIniziale,
    tassoAnnuo: overrides?.tassoAnnuo ?? existing.tassoAnnuo,
    durataMesi: overrides?.durataMesi ?? existing.durataMesi,
    dataInizio: overrides?.dataInizio ?? existing.dataInizio,
  });
}

/**
 * Chiude un prestito manualmente (senza azzerare il saldo).
 */
export async function close(id: string): Promise<PrestitoMutuo> {
  const { data, error } = await supabase
    .from('prestiti_mutui')
    .update({ stato: 'chiuso' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new RepositoryError(error);
  return toClient(data as DbPrestitoMutuo);
}

/**
 * Elimina una simulazione. Solo i record con stato 'simulazione' possono essere eliminati.
 */
export async function deleteSimulation(id: string): Promise<void> {
  const existing = await getById(id);
  if (existing.stato !== 'simulazione') {
    throw new RepositoryError('Solo le simulazioni possono essere eliminate.');
  }

  const { error } = await supabase.from('prestiti_mutui').delete().eq('id', id);
  if (error) throw new RepositoryError(error);
}
