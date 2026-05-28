---
Titolo: DESIGN 016 — Repository Allegati Transazioni
Versione: 0.1.0
Data: 2026-05-27
Stato: APPROVATO E VALIDATO
Prerequisiti: nessuno
DebitiTecniciOriginati: DT-016-01, DT-016-02
---

# DESIGN 016 — Repository Allegati Transazioni

Sezione 1 — Intestazione e metadati
- Titolo: DESIGN 016 — Repository Allegati Transazioni
- Versione: 0.1.0
- Data: 2026-05-27
- Stato: APPROVATO E VALIDATO
- Prerequisiti: nessuno
- Debiti tecnici originati: DT-016-01, DT-016-02

Sezione 2 — Premessa architetturale
Primo dominio che coinvolge simultaneamente database relazionale e Storage cloud Supabase.
I due sistemi non condividono una transazione atomica nativa; la strategia di orchestrazione
e gestione dei fallimenti parziali è il cuore di questo design.
Sezione 3 — Invarianti architetturali
- Nessuna stringa visibile all'utente o annunciata dallo
	screen reader può essere scritta direttamente nel codice.
	Ogni testo passa obbligatoriamente da src/locales/it.ts.
	Le 12 chiavi obbligatorie sono elencate nella sezione File da modificare.

Sezione 4 — Decisioni architetturali (17 decisioni)
Decisione 1 — Perimetro: repository allegati, modulo storage, tipi TS, localizzazioni, validazioni core, orchestrazione cross-system.
Decisione 2 — Struttura DB: la tabella `allegati_transazioni` esiste già (verificare in `docs/6-sql/schema database supabase.md`).
Decisione 3 — Bucket Storage: `allegati-transazioni` (private).
Decisione 4 — Path storage: `{user_id}/{transazione_id}/{uuid}-{safe_filename}`. Il nome originale non è usato come path fisico.
Decisione 5 — Sicurezza Storage: RLS, accesso solo a file con path che iniziano con `auth.uid()/`.
Decisione 6 — Dimensione massima: 10 MB, `MAX_ATTACHMENT_SIZE_BYTES` in TS, validazione client.
Decisione 7 — Whitelist tipi: `image/jpeg`, `image/png`, `application/pdf`. Vietati `image/svg+xml`, `text/html`, `application/zip`, `video/*`, `audio/*`, `application/octet-stream`.
Decisione 8 — Validazione MIME e estensione coerenti; magic bytes validation rimandata a DT-016-01.
Decisione 9 — Sanitizzazione nome file: `sanitizeFilename()` obbligatoria (lowercase, rimozione caratteri pericolosi, limit length, preservare estensione).
Decisione 10 — Strategia upload: compensating transaction best-effort (STEP1 upload Storage → STEP2 insert DB → STEP3 su DB fail tentare delete Storage).
Decisione 11 — Strategia cancellazione: prima cancella file su Storage, poi record DB.
Decisione 12 — Numero allegati: nessun limite applicativo (1:N).
Decisione 13 — API storage: `src/lib/supabase/storage.ts` espone solo `uploadAttachment()`, `deleteAttachment()`, `getAttachmentSignedUrl()`, `validateAttachmentFile()`.
Decisione 14 — Tipi TS: `DbAllegato` (interno), `Allegato` (client), `AttachmentUploadResult`, `AttachmentValidationError`.
Decisione 15 — `getAll` richiede `transazione_id` obbligatorio.
Decisione 16 — Chiavi di localizzazione obbligatorie (12 chiavi da aggiungere a `src/locales/it.ts`).
Decisione 17 — File da creare: `src/lib/supabase/repositories/allegati.ts`, `src/lib/supabase/storage.ts`, aggiornamento `src/lib/supabase/types.ts`, aggiornamento `src/locales/it.ts`.

Sezione 5 — Debiti tecnici aperti
DT-016-01 — Magic bytes validation (design 016-ter dedicato)
DT-016-02 — Utility cleanup file orfani Storage (design 016-bis dedicato)
Sezione 6 — Test architetturali obbligatori
TEST 1 — Rollback upload: Storage OK, DB FAIL, delete tentato.
TEST 2 — Ordine cancellazione: Storage FAIL, DB NON toccato.
TEST 3 — Sanitizzazione path sicuro per nomi pericolosi.
TEST 4 — MIME spoofing: rifiuto se estensione/mime incoerenti.
TEST 5 — Isolamento utenti: utente A non accede ai file di utente B.
