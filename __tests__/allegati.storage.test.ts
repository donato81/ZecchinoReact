/**
 * Placeholder spec for DESIGN 016 and PLAN 016.
 * Implementation is intentionally deferred; only TODO scenarios are tracked here.
 */
import '../src/lib/supabase/storage';

describe('allegati.storage', () => {
  it.todo('sanitizeFilename produce un path sicuro per nomi file pericolosi');
  it.todo('validateAttachmentFile rifiuta MIME spoofing quando estensione e MIME sono incoerenti');
  it.todo('validateAttachmentFile rifiuta file oltre MAX_ATTACHMENT_SIZE_BYTES');
  it.todo('uploadAttachment genera path fisico nel formato {user_id}/{transazione_id}/{uuid}-{safe_filename}');
});