/**
 * Placeholder spec for DESIGN 014 and PLAN 014.
 * Implementation is intentionally deferred; only TODO scenarios are tracked here.
 */
import '../src/lib/supabase/repositories/transazioni-tag';

describe('transazioni-tag.repository', () => {
  it.todo('getTagsForTransaction restituisce gli id tag associati a una transazione');
  it.todo("setTagsForTransaction usa la RPC set_transaction_tags e sostituisce l'insieme dei tag in modo idempotente");
  it.todo('addTag usa la RPC add_tag_to_transaction e tratta input duplicati senza race condition osservabile');
  it.todo('removeTag usa la RPC remove_tag_from_transaction e non esegue DELETE diretto');
  it.todo('il test di concorrenza su addTag dimostra atomicita del contatore usatoNVolte');
});