/**
 * Placeholder spec for DESIGN 013 and PLAN 013.
 * Implementation is intentionally deferred; only TODO scenarios are tracked here.
 */
import '../src/lib/supabase/repositories/ricorrenze';

describe('ricorrenze.repository', () => {
  it.todo("getAll restituisce tutte le ricorrenze dell'utente autenticato senza filtri");
  it.todo('getAll applica il filtro attiva quando fornito');
  it.todo('getAll applica il filtro contoId quando fornito');
  it.todo('getById restituisce la ricorrenza richiesta quando presente');
  it.todo('getById gestisce il caso not found con chiave errors.ricorrenze.notFound');
  it.todo('getDue usa la data locale YYYY-MM-DD e filtra in query per prossima_generazione, attiva = true e data_fine valida');
  it.todo('create inietta automaticamente user_id e salva categoriaId secondo il mapping approvato');
  it.todo('update applica modifiche parziali senza calcolare prossima_generazione');
  it.todo('deactivate imposta attiva = false senza rimuovere fisicamente il record');
  it.todo('il repository propaga gli errori di lettura o scrittura con handling coerente per getAll, create, update e deactivate');
});