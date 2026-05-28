/**
 * Placeholder spec for DESIGN 014 and PLAN 014.
 * Implementation is intentionally deferred; only TODO scenarios are tracked here.
 */
import '../src/lib/supabase/repositories/tag';

describe('tag.repository', () => {
  it.todo("getAll restituisce tutti i tag dell'utente autenticato");
  it.todo('getById restituisce il tag richiesto quando presente');
  it.todo('create crea un tag con i campi opzionali colore e icona quando forniti');
  it.todo('update modifica parzialmente un tag esistente senza alterare i campi non presenti');
  it.todo('remove elimina fisicamente il tag e delega la rimozione dei link a ON DELETE CASCADE');
  it.todo('il repository tag propaga gli errori di lettura o scrittura con handling coerente');
});