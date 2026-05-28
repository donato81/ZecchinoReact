---
titolo: PLAN 016 - Allegati Transazioni
versione: 0.1.0
data: 2026-05-28
stato: DRAFT
design_riferimento: docs/2-projects/016-DESIGN_allegati-transazioni_v0.1.0.md
autore: Agent-Orchestrator
dipendenze: nessuna
---

# PLAN 016 - Allegati Transazioni

## 1. Obiettivo del Piano

Introdurre il dominio allegati transazioni con repository e storage Supabase coordinati tramite compensating transaction best-effort, validazione client dei file e localizzazioni complete, senza coprire ancora magic bytes validation e cleanup automatico degli orfani.

## 2. Perimetro (Scope)

File sorgente da creare o modificare:
- src/lib/supabase/types.ts
- src/lib/types.ts
- src/lib/supabase/storage.ts
- src/lib/supabase/repositories/allegati.ts
- src/locales/it.ts
- __tests__/allegati.repository.test.ts
- __tests__/allegati.storage.test.ts

Fuori perimetro:
- magic bytes validation dei contenuti file
- utility o automazione di cleanup dei file orfani in Storage
- limiti applicativi sul numero di allegati per transazione
- accesso pubblico al bucket allegati-transazioni
- UI dedicate per gestione allegati nel flusso utente [DA VERIFICARE]

## 3. Prerequisiti Bloccanti

- Nessuno. Il design 016 dichiara prerequisiti: nessuno.
- La tabella allegati_transazioni deve esistere nello schema Supabase.
- Il bucket Storage privato allegati-transazioni deve essere disponibile con policy RLS coerenti con auth.uid().

## 4. Architettura e Decisioni Chiave

- Decisione 1 - Perimetro cross-system. Conseguenza pratica: repository, storage, tipi, localizzazioni e validazioni core vanno trattati come un unico flusso operativo.
- Decisione 3 - Bucket Storage privato allegati-transazioni. Conseguenza pratica: nessun accesso pubblico o path fuori dallo scope utente autenticato.
- Decisione 4 - Path storage {user_id}/{transazione_id}/{uuid}-{safe_filename}. Conseguenza pratica: il nome originale non puo essere usato come path fisico.
- Decisione 6 - Dimensione massima 10 MB. Conseguenza pratica: introdurre MAX_ATTACHMENT_SIZE_BYTES e validazione client prima dell'upload.
- Decisione 7 - Whitelist MIME limitata a image/jpeg, image/png, application/pdf. Conseguenza pratica: rifiutare MIME vietati come svg, html, zip, video, audio e octet-stream.
- Decisione 8 - Validazione MIME piu estensione coerenti; magic bytes rinviati. Conseguenza pratica: validateAttachmentFile deve fermarsi a coerenza MIME-estensione e lasciare DT-016-01 fuori perimetro.
- Decisione 9 - sanitizeFilename obbligatoria. Conseguenza pratica: lowercase, rimozione caratteri pericolosi, limite lunghezza e preservazione estensione.
- Decisione 10 - Upload in tre step con compensating transaction best-effort. Conseguenza pratica: se l'insert DB fallisce dopo upload Storage, il sistema tenta delete su Storage.
- Decisione 11 - Cancellazione in ordine Storage poi DB. Conseguenza pratica: se la delete Storage fallisce, il record DB non va toccato.
- Decisione 13 - API storage limitate. Conseguenza pratica: src/lib/supabase/storage.ts espone solo uploadAttachment, deleteAttachment, getAttachmentSignedUrl, validateAttachmentFile.
- Decisione 15 - getAll richiede transazione_id obbligatorio. Conseguenza pratica: il repository allegati non deve supportare getAll globale.

## 5. Task Atomici

### T1
- Azione: Aggiungere DbAllegato al layer Supabase.
- File target: src/lib/supabase/types.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit compila DbAllegato senza errori di tipo.
- Note operative: mantenere DbAllegato interno al layer src/lib/supabase/.
- Note operative: DbAllegato deve mappare tutti i campi della tabella allegati_transazioni dello schema reale Supabase, incluso miniatura_path (TEXT nullable). La logica di generazione delle miniature è fuori perimetro, ma il campo deve essere presente nel tipo DbAllegato per corrispondenza con lo schema database.

### T2
- Azione: Aggiungere i tipi client Allegato, AttachmentUploadResult e AttachmentValidationError. Percorso client types da confermare con convenzione esistente.
- File target: src/lib/types.ts
- Dipende da: T1
- Metrica di successo: npx tsc --noEmit accetta i nuovi tipi client senza violare la separazione tra layer DB e client.
- Note operative: il design definisce i tipi ma non esplicita il path client; usare la convenzione progetto e confermarla in implementazione.

### T3
- Azione: Creare il modulo storage con validateAttachmentFile, sanitizeFilename, uploadAttachment, deleteAttachment e getAttachmentSignedUrl nel perimetro API consentito.
- File target: src/lib/supabase/storage.ts
- Dipende da: T1, T2
- Metrica di successo: i test storage verificano size limit 10 MB, whitelist MIME, sanitizzazione e path {user_id}/{transazione_id}/{uuid}-{safe_filename}.
- Note operative: non esporre API storage aggiuntive oltre le quattro consentite dal design.

### T4
- Azione: Creare il repository allegati con getAll vincolato a transazione_id e orchestrazione upload/delete coerente con le strategie cross-system.
- File target: src/lib/supabase/repositories/allegati.ts
- Dipende da: T1, T2, T3
- Metrica di successo: i test repository dimostrano rollback best-effort su DB fail e ordine di cancellazione Storage prima di DB.
- Note operative: la superficie pubblica del repository allegati espone obbligatoriamente: getAll(transazione_id: string), create(payload), getById(id: string), remove(id: string). Nessun getAll globale senza transazione_id è consentito come da Decisione 15.

### T5
- Azione: Aggiungere le 12 chiavi di localizzazione obbligatorie per allegati transazioni.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per validazioni, upload, delete e accesso allegati.
- Note operative: le 12 chiavi obbligatorie da definire in src/locales/it.ts sono: errors.allegati.uploadFailed, errors.allegati.deleteFailed, errors.allegati.loadFailed, errors.allegati.accessFailed, errors.allegati.sizeLimitExceeded, errors.allegati.mimeNotAllowed, errors.allegati.mimeExtensionMismatch, errors.allegati.fileNameInvalid, confirm.allegati.uploaded, confirm.allegati.deleted, allegati.upload.inProgress, allegati.upload.signedUrlFailed. I nomi devono rispettare il namespace i18n del progetto.

### T6
- Azione: Creare la suite di test del repository allegati sui flussi cross-system e isolamento utente.
- File target: __tests__/allegati.repository.test.ts
- Dipende da: T1, T3, T4
- Metrica di successo: npx jest __tests__/allegati.repository.test.ts --runInBand termina con exit code 0 quando il repository e implementato.
- Note operative: coprire rollback upload, ordine cancellazione e isolamento utenti.

### T7
- Azione: Creare la suite di test del modulo storage per validazioni, sanitizzazione e coerenza MIME-estensione.
- File target: __tests__/allegati.storage.test.ts
- Dipende da: T2, T3
- Metrica di successo: npx jest __tests__/allegati.storage.test.ts --runInBand termina con exit code 0 quando il modulo storage e implementato.
- Note operative: i test devono lasciare fuori magic bytes validation per coerenza con DT-016-01.

## 6. Test Obbligatori

- File spec: __tests__/allegati.repository.test.ts | Scenario: rollback upload con Storage OK, DB FAIL e tentativo di delete su Storage. | Tipo: integration
- File spec: __tests__/allegati.repository.test.ts | Scenario: ordine cancellazione con Storage FAIL e DB non toccato. | Tipo: integration
- File spec: __tests__/allegati.repository.test.ts | Scenario: isolamento utenti, utente A non puo accedere ai file dell'utente B. | Tipo: integration
- File spec: __tests__/allegati.storage.test.ts | Scenario: sanitizeFilename produce un path sicuro per nomi file pericolosi. | Tipo: unit
- File spec: __tests__/allegati.storage.test.ts | Scenario: validateAttachmentFile rifiuta MIME spoofing quando estensione e MIME sono incoerenti. | Tipo: unit
- File spec: __tests__/allegati.storage.test.ts | Scenario: validateAttachmentFile rifiuta file oltre MAX_ATTACHMENT_SIZE_BYTES. | Tipo: unit
- File spec: __tests__/allegati.storage.test.ts | Scenario: uploadAttachment genera path fisico nel formato {user_id}/{transazione_id}/{uuid}-{safe_filename}. | Tipo: unit

## 7. Gate di Chiusura

- G-016-1 | Verifica: tipi, storage e repository compilano senza errori. | Comando: npx tsc --noEmit | Stato iniziale: OPEN
- G-016-2 | Verifica: i test repository coprono rollback upload, ordine cancellazione e isolamento utenti. | Comando: npx jest __tests__/allegati.repository.test.ts --runInBand | Stato iniziale: OPEN
- G-016-3 | Verifica: i test storage coprono size limit, whitelist MIME, sanitizzazione e formato path. | Comando: npx jest __tests__/allegati.storage.test.ts --runInBand | Stato iniziale: OPEN
- G-016-4 | Verifica: src/lib/supabase/storage.ts espone solo uploadAttachment, deleteAttachment, getAttachmentSignedUrl, validateAttachmentFile. | Comando: verifica manuale su src/lib/supabase/storage.ts | Stato iniziale: OPEN
- G-016-5 | Verifica: DT-016-01 e DT-016-02 restano esplicitamente fuori dall'implementazione iniziale. | Comando: verifica manuale su src/lib/supabase/storage.ts e src/lib/supabase/repositories/allegati.ts | Stato iniziale: OPEN

## 8. Rollback

- src/lib/supabase/types.ts: ripristinare la versione precedente rimuovendo DbAllegato.
- src/lib/types.ts: rimuovere Allegato, AttachmentUploadResult e AttachmentValidationError se il piano viene annullato.
- src/lib/supabase/storage.ts: eliminare il file se non supera i gate di validazione.
- src/lib/supabase/repositories/allegati.ts: eliminare il file se l'orchestrazione cross-system non supera i gate.
- src/locales/it.ts: rimuovere le chiavi allegati aggiunte dal piano.
- __tests__/allegati.repository.test.ts: eliminare la spec placeholder o implementata se il piano viene sospeso.
- __tests__/allegati.storage.test.ts: eliminare la spec placeholder o implementata se il piano viene sospeso.

## 9. Riferimenti

- docs/2-projects/016-DESIGN_allegati-transazioni_v0.1.0.md
- docs/4-todo-lists/016-TODO_allegati-transazioni_v0.1.0.md
- src/lib/supabase/types.ts
- src/lib/types.ts
- src/lib/supabase/storage.ts
- src/lib/supabase/repositories/allegati.ts
- src/locales/it.ts
- __tests__/allegati.repository.test.ts
- __tests__/allegati.storage.test.ts