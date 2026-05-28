---
titolo: TODO 016-bis - Cleanup Orfani Storage
versione: 0.1.0
data: 2026-05-28
stato: PENDING
piano_riferimento: docs/3-coding-plans/016-bis-PLAN_cleanup-orfani-storage_v0.1.0.md
design_riferimento: docs/2-projects/016-bis-DESIGN_cleanup-orfani-storage_v0.1.0.md
autore: Agent-Orchestrator
---

# TODO 016-bis - Cleanup Orfani Storage

## 1. Stato e Gate Bloccante

- Gate bloccante: PLAN 016 completato e convalidato.
- Stato corrente: PENDING

## 2. Stato Task (panoramica)

| ID task | Titolo | Stato | Note |
| --- | --- | --- | --- |
| T1 | Creare storage-cleanup-service | TODO | Costanti, algoritmo, CleanupResult |
| T2 | Integrare trigger login/logout | TODO | AuthContext non bloccante |
| T3 | Integrare trigger post-delete transazione | TODO | Call site da confermare |
| T4 | Integrare trigger post-upload fallito | TODO | Rollback allegati |
| T5 | Creare test cleanup architetturali | TODO | 11 scenari obbligatori |

## 3. Task Atomici

### T1
- Azione: Creare il service storage-cleanup-service con costanti obbligatorie, CleanupResult, algoritmo di scansione in tre fasi, logging tecnico e API fire-and-forget.
- File target: src/lib/storage-cleanup-service.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit compila il service e i test dimostrano scanned, orphanFound, deleted e failed coerenti con l'esito reale.
- Task Status: [ ] TODO

### T2
- Azione: Integrare in AuthContext il trigger login fire-and-forget e il trigger logout con Promise.race protetta da timeout.
- File target: src/context/AuthContext.tsx
- Dipende da: T1
- Metrica di successo: i test o le verifiche di integrazione dimostrano che login e logout non restano bloccati dal cleanup.
- Task Status: [ ] TODO

### T3
- Azione: Integrare il trigger post-cancellazione transazione con scansione limitata a {user_id}/{transazione_id}/ nel call site di rimozione transazione individuato nel codice.
- File target: src/context/AppDataContext.tsx [DA VERIFICARE]
- Dipende da: T1
- Metrica di successo: i test dimostrano che il trigger 3 scansiona solo il prefisso della transazione rimossa.
- Task Status: [ ] TODO

### T4
- Azione: Integrare il trigger post-upload fallito cleanupSpecificOrphan(storagePath) nel punto di rollback del dominio allegati.
- File target: src/lib/supabase/repositories/allegati.ts [DA VERIFICARE]
- Dipende da: T1
- Metrica di successo: i test dimostrano che Trigger 1 elimina solo il file orfano corretto e non e soggetto a guardia concorrente o throttle globale.
- Task Status: [ ] TODO

### T5
- Azione: Creare la suite di test architetturali del cleanup service e dei quattro trigger automatici.
- File target: __tests__/storage-cleanup-service.test.ts
- Dipende da: T1, T2, T3, T4
- Metrica di successo: npx jest __tests__/storage-cleanup-service.test.ts --runInBand termina con exit code 0 quando il service e i trigger sono implementati.
- Task Status: [ ] TODO

## 4. Note Operative

- Il cleanup e silenzioso e usa solo console.warn('[storage-cleanup]', ...), senza UI e senza screen reader output.
- Trigger 1 e esentato da guardia concorrente e throttle globale.
- Il database resta fonte di verita: se manca il file Storage ma esiste il record DB non si esegue nessuna cancellazione DB.
- Login, logout e operazioni utente non devono attendere il completamento della scansione.
- I debiti DT-016-bis-01, DT-016-bis-02 e DT-016-bis-03 restano fuori dal perimetro.

## 5. Log di Validazione

| Data | Task ID | Validato Da | Risultato | Note |
| --- | --- | --- | --- | --- |

## 6. Gate di Chiusura

- G-016-bis-1 | Verifica: service e trigger compilano senza errori. | Comando: npx tsc --noEmit | Gate Status: [ ] OPEN
- G-016-bis-2 | Verifica: la suite architetturale del cleanup copre tutti gli 11 scenari obbligatori. | Comando: npx jest __tests__/storage-cleanup-service.test.ts --runInBand | Gate Status: [ ] OPEN
- G-016-bis-3 | Verifica: login, logout e operazioni utente non vengono bloccati dal cleanup. | Comando: verifica manuale su src/context/AuthContext.tsx e src/context/AppDataContext.tsx | Gate Status: [ ] OPEN
- G-016-bis-4 | Verifica: guardia concorrente, throttle globale e safety window sono applicati correttamente, con esenzione del Trigger 1. | Comando: verifica manuale su src/lib/storage-cleanup-service.ts | Gate Status: [ ] OPEN
- G-016-bis-5 | Verifica: il cleanup opera solo su path che iniziano per {user_id}/ e non elimina mai record DB in assenza del file. | Comando: verifica manuale su src/lib/storage-cleanup-service.ts | Gate Status: [ ] OPEN
- G-016-bis-6 | Verifica: il service emette solo console.warn tecnico e non introduce stringhe UI. | Comando: verifica manuale su src/lib/storage-cleanup-service.ts | Gate Status: [ ] OPEN

## 7. Riferimenti

- docs/3-coding-plans/016-bis-PLAN_cleanup-orfani-storage_v0.1.0.md
- docs/2-projects/016-bis-DESIGN_cleanup-orfani-storage_v0.1.0.md
- docs/3-coding-plans/016-PLAN_allegati-transazioni_v0.1.0.md
- src/lib/storage-cleanup-service.ts
- src/context/AuthContext.tsx
- src/context/AppDataContext.tsx
- src/lib/supabase/repositories/allegati.ts
- __tests__/storage-cleanup-service.test.ts