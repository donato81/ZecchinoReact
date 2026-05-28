---
titolo: TODO 016 - Allegati Transazioni
versione: 0.1.0
data: 2026-05-28
stato: PENDING
piano_riferimento: docs/3-coding-plans/016-PLAN_allegati-transazioni_v0.1.0.md
design_riferimento: docs/2-projects/016-DESIGN_allegati-transazioni_v0.1.0.md
autore: Agent-Orchestrator
---

# TODO 016 - Allegati Transazioni

## 1. Stato e Gate Bloccante

- Gate bloccante: nessuno. Il design 016 non ha prerequisiti bloccanti.
- Stato corrente: PENDING

## 2. Stato Task (panoramica)

| ID task | Titolo | Stato | Note |
| --- | --- | --- | --- |
| T1 | Aggiungere DbAllegato | TODO | Tipo DB allegati |
| T2 | Aggiungere tipi client allegati | TODO | Path client da confermare |
| T3 | Creare modulo storage allegati | TODO | Validazione e path sicuro |
| T4 | Creare repository allegati | TODO | Strategia cross-system |
| T5 | Aggiungere localizzazioni allegati | TODO | 12 chiavi obbligatorie |
| T6 | Creare test repository allegati | TODO | Rollback, delete order, isolamento |
| T7 | Creare test storage allegati | TODO | MIME, size, sanitizzazione |

## 3. Task Atomici

### T1
- Azione: Aggiungere DbAllegato al layer Supabase.
- File target: src/lib/supabase/types.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit compila DbAllegato senza errori di tipo.
- Task Status: [ ] TODO

### T2
- Azione: Aggiungere i tipi client Allegato, AttachmentUploadResult e AttachmentValidationError. Percorso client types da confermare con convenzione esistente.
- File target: src/lib/types.ts [DA VERIFICARE]
- Dipende da: T1
- Metrica di successo: npx tsc --noEmit accetta i nuovi tipi client senza violare la separazione tra layer DB e client.
- Task Status: [ ] TODO

### T3
- Azione: Creare il modulo storage con validateAttachmentFile, sanitizeFilename, uploadAttachment, deleteAttachment e getAttachmentSignedUrl nel perimetro API consentito.
- File target: src/lib/supabase/storage.ts
- Dipende da: T1, T2
- Metrica di successo: i test storage verificano size limit 10 MB, whitelist MIME, sanitizzazione e path {user_id}/{transazione_id}/{uuid}-{safe_filename}.
- Task Status: [ ] TODO

### T4
- Azione: Creare il repository allegati con getAll vincolato a transazione_id e orchestrazione upload/delete coerente con le strategie cross-system.
- File target: src/lib/supabase/repositories/allegati.ts
- Dipende da: T1, T2, T3
- Metrica di successo: i test repository dimostrano rollback best-effort su DB fail e ordine di cancellazione Storage prima di DB.
- Task Status: [ ] TODO

### T5
- Azione: Aggiungere le 12 chiavi di localizzazione obbligatorie per allegati transazioni.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per validazioni, upload, delete e accesso allegati.
- Task Status: [ ] TODO

### T6
- Azione: Creare la suite di test del repository allegati sui flussi cross-system e isolamento utente.
- File target: __tests__/allegati.repository.test.ts
- Dipende da: T1, T3, T4
- Metrica di successo: npx jest __tests__/allegati.repository.test.ts --runInBand termina con exit code 0 quando il repository e implementato.
- Task Status: [ ] TODO

### T7
- Azione: Creare la suite di test del modulo storage per validazioni, sanitizzazione e coerenza MIME-estensione.
- File target: __tests__/allegati.storage.test.ts
- Dipende da: T2, T3
- Metrica di successo: npx jest __tests__/allegati.storage.test.ts --runInBand termina con exit code 0 quando il modulo storage e implementato.
- Task Status: [ ] TODO

## 4. Note Operative

- Il bucket e privato e il path fisico deve iniziare con auth.uid()/ attraverso la composizione {user_id}/{transazione_id}/{uuid}-{safe_filename}.
- validateAttachmentFile deve applicare size limit 10 MB, whitelist MIME e coerenza MIME-estensione, ma non magic bytes validation.
- In caso di DB FAIL dopo upload Storage bisogna tentare delete compensativa su Storage.
- In caso di delete Storage fallita il record DB non deve essere toccato.
- DT-016-01 e DT-016-02 restano fuori dal perimetro di questo piano.

## 5. Log di Validazione

| Data | Task ID | Validato Da | Risultato | Note |
| --- | --- | --- | --- | --- |

## 6. Gate di Chiusura

- G-016-1 | Verifica: tipi, storage e repository compilano senza errori. | Comando: npx tsc --noEmit | Gate Status: [ ] OPEN
- G-016-2 | Verifica: i test repository coprono rollback upload, ordine cancellazione e isolamento utenti. | Comando: npx jest __tests__/allegati.repository.test.ts --runInBand | Gate Status: [ ] OPEN
- G-016-3 | Verifica: i test storage coprono size limit, whitelist MIME, sanitizzazione e formato path. | Comando: npx jest __tests__/allegati.storage.test.ts --runInBand | Gate Status: [ ] OPEN
- G-016-4 | Verifica: src/lib/supabase/storage.ts espone solo uploadAttachment, deleteAttachment, getAttachmentSignedUrl, validateAttachmentFile. | Comando: verifica manuale su src/lib/supabase/storage.ts | Gate Status: [ ] OPEN
- G-016-5 | Verifica: DT-016-01 e DT-016-02 restano esplicitamente fuori dall'implementazione iniziale. | Comando: verifica manuale su src/lib/supabase/storage.ts e src/lib/supabase/repositories/allegati.ts | Gate Status: [ ] OPEN

## 7. Riferimenti

- docs/3-coding-plans/016-PLAN_allegati-transazioni_v0.1.0.md
- docs/2-projects/016-DESIGN_allegati-transazioni_v0.1.0.md
- src/lib/supabase/types.ts
- src/lib/types.ts
- src/lib/supabase/storage.ts
- src/lib/supabase/repositories/allegati.ts
- src/locales/it.ts
- __tests__/allegati.repository.test.ts
- __tests__/allegati.storage.test.ts