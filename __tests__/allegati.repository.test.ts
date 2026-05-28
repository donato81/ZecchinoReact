/**
 * Placeholder spec for DESIGN 016 and PLAN 016.
 * Implementation is intentionally deferred; only TODO scenarios are tracked here.
 */
import '../src/lib/supabase/repositories/allegati';

describe('allegati.repository', () => {
  it.todo('rollback upload con Storage OK, DB FAIL e tentativo di delete su Storage');
  it.todo('ordine cancellazione con Storage FAIL e DB non toccato');
  it.todo("isolamento utenti, utente A non puo accedere ai file dell'utente B");
});