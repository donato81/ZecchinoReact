---
titolo: PLAN 016-bis - Cleanup Orfani Storage
versione: 0.1.0
data: 2026-05-28
stato: DRAFT
design_riferimento: docs/2-projects/016-bis-DESIGN_cleanup-orfani-storage_v0.1.0.md
autore: Agent-Orchestrator
dipendenze: PLAN 016
---

# PLAN 016-bis - Cleanup Orfani Storage

## 1. Obiettivo del Piano

Introdurre un service automatico e silenzioso di cleanup dei file orfani in Storage, attivato dai quattro trigger previsti dal design, senza bloccare bootstrap, login, logout o operazioni utente e mantenendo il database come fonte di verita.

## 2. Perimetro (Scope)

File sorgente da creare o modificare:
- src/lib/storage-cleanup-service.ts
- src/context/AuthContext.tsx
- src/context/AppDataContext.tsx [DA VERIFICARE]
- src/lib/supabase/repositories/allegati.ts [DA VERIFICARE]
- __tests__/storage-cleanup-service.test.ts

Fuori perimetro:
- esporre messaggi UI o screen reader per il cleanup
- eliminare record DB quando il file Storage manca
- bloccare login, logout, bootstrap o operazioni utente in attesa del cleanup
- script CLI di manutenzione, Edge Functions server-side e log opt-in per utenti avanzati

## 3. Prerequisiti Bloccanti

- PLAN 016 completato e convalidato.
- Il dominio allegati deve gia usare il bucket allegati-transazioni e il path {user_id}/... definito dal design 016.

## 4. Architettura e Decisioni Chiave

- Invariante 1 - Nessun testo utente. Conseguenza pratica: il service usa solo console.warn con prefisso [storage-cleanup].
- Invariante 2 - Cleanup non bloccante. Conseguenza pratica: login, logout, bootstrap e operazioni utente chiamano il cleanup in fire-and-forget o con timeout protetto.
- Invariante 3 - Database fonte di verita. Conseguenza pratica: mai eliminare record DB se manca il file storage.
- Invariante 4 - Best effort fail-soft. Conseguenza pratica: errori su singoli file non si propagano all'utente e non bloccano il resto della scansione.
- Trigger 1 - Dopo upload fallito. Conseguenza pratica: cleanupSpecificOrphan(storagePath) O(1) e esente da guardia concorrente e throttle globali.
- Trigger 2 - Login. Conseguenza pratica: scan ultime 48 ore, MAX_FILES_PER_SCAN = 100 e safety window di 3 minuti in modalita fire-and-forget.
- Trigger 3 - Dopo cancellazione transazione. Conseguenza pratica: scansione limitata al prefisso {user_id}/{transazione_id}/.
- Trigger 4 - Logout. Conseguenza pratica: Promise.race tra cleanup e timeout CLEANUP_LOGOUT_TIMEOUT_MS = 1500.
- Guardia concorrente globale. Conseguenza pratica: cleanupInProgress blocca avvii concorrenti, tranne Trigger 1.
- Throttle temporale globale. Conseguenza pratica: nessun cleanup entro 15 minuti dall'ultimo, tranne Trigger 1.
- Safety window. Conseguenza pratica: non eliminare file creati da meno di 3 minuti.
- CleanupResult obbligatorio. Conseguenza pratica: ogni esecuzione restituisce scanned, orphanFound, deleted e failed.

## 5. Task Atomici

### T1
- Azione: Creare il service storage-cleanup-service con costanti obbligatorie, CleanupResult, algoritmo di scansione in tre fasi, logging tecnico e API fire-and-forget.
- File target: src/lib/storage-cleanup-service.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit compila il service e i test dimostrano scanned, orphanFound, deleted e failed coerenti con l'esito reale.
- Note operative: costanti obbligatorie: CLEANUP_RECENCY_HOURS, MAX_FILES_PER_SCAN, MIN_CLEANUP_INTERVAL_MS, CLEANUP_SAFETY_WINDOW_MS, CLEANUP_LOGOUT_TIMEOUT_MS.

### T2
- Azione: Integrare in AuthContext il trigger login fire-and-forget e il trigger logout con Promise.race protetta da timeout.
- File target: src/context/AuthContext.tsx
- Dipende da: T1
- Metrica di successo: i test o le verifiche di integrazione dimostrano che login e logout non restano bloccati dal cleanup.
- Note operative: il logout deve usare CLEANUP_LOGOUT_TIMEOUT_MS = 1500.

### T3
- Azione: Integrare il trigger post-cancellazione transazione con scansione limitata a {user_id}/{transazione_id}/ nel call site di rimozione transazione individuato nel codice.
- File target: src/context/AppDataContext.tsx [DA VERIFICARE]
- Dipende da: T1
- Metrica di successo: i test dimostrano che il trigger 3 scansiona solo il prefisso della transazione rimossa.
- Note operative: il target e ancorato all'attuale removeTransaction del context e va confermato in implementazione.

### T4
- Azione: Integrare il trigger post-upload fallito cleanupSpecificOrphan(storagePath) nel punto di rollback del dominio allegati.
- File target: src/lib/supabase/repositories/allegati.ts [DA VERIFICARE]
- Dipende da: T1
- Metrica di successo: i test dimostrano che Trigger 1 elimina solo il file orfano corretto e non e soggetto a guardia concorrente o throttle globale.
- Note operative: il call site e dedotto dalla strategia compensativa di PLAN 016 e va confermato in implementazione.

### T5
- Azione: Creare la suite di test architetturali del cleanup service e dei quattro trigger automatici.
- File target: __tests__/storage-cleanup-service.test.ts
- Dipende da: T1, T2, T3, T4
- Metrica di successo: npx jest __tests__/storage-cleanup-service.test.ts --runInBand termina con exit code 0 quando il service e i trigger sono implementati.
- Note operative: coprire tutti gli 11 test obbligatori del design 016-bis.

## 6. Test Obbligatori

- File spec: __tests__/storage-cleanup-service.test.ts | Scenario: Trigger 1 elimina il file orfano corretto e nessun altro. | Tipo: unit
- File spec: __tests__/storage-cleanup-service.test.ts | Scenario: Trigger 2 al login scansiona solo ultime 48 ore e al massimo MAX_FILES_PER_SCAN file. | Tipo: integration
- File spec: __tests__/storage-cleanup-service.test.ts | Scenario: Trigger 3 dopo cancellazione transazione limita la scansione al path user_id/transazione_id. | Tipo: integration
- File spec: __tests__/storage-cleanup-service.test.ts | Scenario: Trigger 4 al logout rispetta CLEANUP_LOGOUT_TIMEOUT_MS e non blocca il logout. | Tipo: integration
- File spec: __tests__/storage-cleanup-service.test.ts | Scenario: cleanupInProgress blocca il secondo avvio concorrente, escluso Trigger 1. | Tipo: unit
- File spec: __tests__/storage-cleanup-service.test.ts | Scenario: il throttle temporale impedisce un cleanup entro MIN_CLEANUP_INTERVAL_MS, escluso Trigger 1. | Tipo: unit
- File spec: __tests__/storage-cleanup-service.test.ts | Scenario: i file piu recenti di CLEANUP_SAFETY_WINDOW_MS non vengono eliminati. | Tipo: unit
- File spec: __tests__/storage-cleanup-service.test.ts | Scenario: il cleanup non tocca file con path fuori dal prefisso user_id dell'utente. | Tipo: integration
- File spec: __tests__/storage-cleanup-service.test.ts | Scenario: se manca il file Storage ma esiste il record DB non viene eseguita alcuna azione distruttiva sul DB. | Tipo: unit
- File spec: __tests__/storage-cleanup-service.test.ts | Scenario: CleanupResult riflette esattamente scanned, orphanFound, deleted e failed. | Tipo: unit
- File spec: __tests__/storage-cleanup-service.test.ts | Scenario: un errore su un singolo file non blocca l'elaborazione degli altri orfani. | Tipo: unit

## 7. Gate di Chiusura

- G-016-bis-1 | Verifica: service e trigger compilano senza errori. | Comando: npx tsc --noEmit | Stato iniziale: OPEN
- G-016-bis-2 | Verifica: la suite architetturale del cleanup copre tutti gli 11 scenari obbligatori. | Comando: npx jest __tests__/storage-cleanup-service.test.ts --runInBand | Stato iniziale: OPEN
- G-016-bis-3 | Verifica: login, logout e operazioni utente non vengono bloccati dal cleanup. | Comando: verifica manuale su src/context/AuthContext.tsx e src/context/AppDataContext.tsx | Stato iniziale: OPEN
- G-016-bis-4 | Verifica: guardia concorrente, throttle globale e safety window sono applicati correttamente, con esenzione del Trigger 1. | Comando: verifica manuale su src/lib/storage-cleanup-service.ts | Stato iniziale: OPEN
- G-016-bis-5 | Verifica: il cleanup opera solo su path che iniziano per {user_id}/ e non elimina mai record DB in assenza del file. | Comando: verifica manuale su src/lib/storage-cleanup-service.ts | Stato iniziale: OPEN
- G-016-bis-6 | Verifica: il service emette solo console.warn tecnico e non introduce stringhe UI. | Comando: verifica manuale su src/lib/storage-cleanup-service.ts | Stato iniziale: OPEN

## 8. Rollback

- src/lib/storage-cleanup-service.ts: eliminare il file se il service non supera i gate.
- src/context/AuthContext.tsx: ripristinare login e logout allo stato precedente rimuovendo i trigger cleanup.
- src/context/AppDataContext.tsx: ripristinare il flusso di removeTransaction rimuovendo il trigger 3.
- src/lib/supabase/repositories/allegati.ts: ripristinare il rollback pre-cleanupSpecificOrphan per Trigger 1.
- __tests__/storage-cleanup-service.test.ts: eliminare la spec placeholder o implementata se il piano viene sospeso.

## 9. Riferimenti

- docs/2-projects/016-bis-DESIGN_cleanup-orfani-storage_v0.1.0.md
- docs/4-todo-lists/016-bis-TODO_cleanup-orfani-storage_v0.1.0.md
- docs/3-coding-plans/016-PLAN_allegati-transazioni_v0.1.0.md
- src/lib/storage-cleanup-service.ts
- src/context/AuthContext.tsx
- src/context/AppDataContext.tsx
- src/lib/supabase/repositories/allegati.ts
- __tests__/storage-cleanup-service.test.ts