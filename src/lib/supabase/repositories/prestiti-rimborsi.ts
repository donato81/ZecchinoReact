// ============================================================================
// PLAN 017 — T6: Repository Prestiti Rimborsi
// ============================================================================
// Tutte le mutazioni passano esclusivamente per le RPC atomiche
// rpc_aggiungi_rimborso e rpc_elimina_rimborso definite in
// docs/6-sql/P53-rpc-rimborsi-prestiti.sql.
// Nessun aggiornamento diretto del saldoResiduo è ammesso.

import { supabase } from '../client';
import { RepositoryError, type DbPrestitoRimborso } from '../types';
import type { PrestitoRimborso } from '../../types';

function toClient(row: DbPrestitoRimborso): PrestitoRimborso {
  return {
    id: row.id,
    prestitoId: row.prestito_id,
    importo: row.importo,
    dataRimborso: row.data_rimborso,
    quotaCapitale: row.quota_capitale ?? undefined,
    quotaInteressi: row.quota_interessi ?? undefined,
    note: row.note ?? undefined,
  };
}

/**
 * Recupera tutti i rimborsi dell'utente corrente.
 */
export async function getAll(): Promise<PrestitoRimborso[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new RepositoryError('Utente non autenticato');

  const { data, error } = await supabase
    .from('prestiti_rimborsi')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('data_rimborso', { ascending: false });
  if (error) throw new RepositoryError(error);
  return (data as DbPrestitoRimborso[]).map(toClient);
}

/**
 * Recupera tutti i rimborsi di un prestito specifico.
 */
export async function getByPrestitoId(
  prestitoId: string,
): Promise<PrestitoRimborso[]> {
  const { data, error } = await supabase
    .from('prestiti_rimborsi')
    .select('*')
    .eq('prestito_id', prestitoId)
    .order('data_rimborso', { ascending: false });
  if (error) throw new RepositoryError(error);
  return (data as DbPrestitoRimborso[]).map(toClient);
}

/**
 * Aggiunge un rimborso tramite la RPC atomica rpc_aggiungi_rimborso.
 * La RPC esegue in un'unica transazione:
 * 1. Inserimento del rimborso
 * 2. Aggiornamento del saldo residuo del prestito
 * 3. Chiusura automatica se il saldo raggiunge zero
 *
 * Riferimento SQL: docs/6-sql/P53-rpc-rimborsi-prestiti.sql — rpc_aggiungi_rimborso
 */
export async function addRimborso(params: {
  prestitoId: string;
  importo: number;
  dataRimborso: string;
  quotaCapitale?: number;
  quotaInteressi?: number;
  note?: string;
}): Promise<PrestitoRimborso> {
  const { data, error } = await supabase.rpc('rpc_aggiungi_rimborso', {
    p_prestito_id: params.prestitoId,
    p_importo: params.importo,
    p_data_rimborso: params.dataRimborso,
    p_quota_capitale: params.quotaCapitale ?? null,
    p_quota_interessi: params.quotaInteressi ?? null,
    p_note: params.note ?? null,
  });

  if (error) throw new RepositoryError(error);

  // La RPC restituisce l'id del rimborso inserito
  const rimborsoId = (data as { id: string })?.id ?? data;
  if (!rimborsoId || typeof rimborsoId !== 'string') {
    throw new RepositoryError("La RPC non ha restituito l'id del rimborso.");
  }

  // Recupera il record completo del rimborso
  const { data: rimborsoData, error: fetchError } = await supabase
    .from('prestiti_rimborsi')
    .select('*')
    .eq('id', rimborsoId)
    .single();
  if (fetchError) throw new RepositoryError(fetchError);
  return toClient(rimborsoData as DbPrestitoRimborso);
}

/**
 * Elimina un rimborso tramite la RPC atomica rpc_elimina_rimborso.
 * La RPC esegue in un'unica transazione:
 * 1. Eliminazione del rimborso
 * 2. Ripristino del saldo residuo del prestito
 * 3. Riapertura dello stato se necessario
 *
 * Riferimento SQL: docs/6-sql/P53-rpc-rimborsi-prestiti.sql — rpc_elimina_rimborso
 */
export async function deleteRimborso(rimborsoId: string): Promise<void> {
  const { error } = await supabase.rpc('rpc_elimina_rimborso', {
    p_rimborso_id: rimborsoId,
  });
  if (error) throw new RepositoryError(error);
}
