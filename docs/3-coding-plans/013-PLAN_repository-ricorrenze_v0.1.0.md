---
titolo: PLAN 013 - Repository Ricorrenze
versione: 0.1.0
data: 2026-05-28
stato: DRAFT
design_riferimento: docs/2-projects/013-DESIGN_repository-ricorrenze_v0.1.0.md
autore: Agent-Orchestrator
dipendenze: nessuna
---

# PLAN 013 - Repository Ricorrenze

## 1. Obiettivo del Piano

Introdurre il repository Supabase per la tabella ricorrenze, integrando tipi, caching applicativo, localizzazione errori/conferme e copertura test minima richiesta dal design 013.

## 2. Perimetro (Scope)

File sorgente da creare o modificare:
- src/lib/supabase/types.ts
- src/lib/types.ts
- src/lib/supabase/repositories/ricorrenze.ts
- src/locales/it.ts
- src/context/AppDataContext.tsx
- __tests__/ricorrenze.repository.test.ts

Fuori perimetro:
- calcolo della prossima data di generazione delle ricorrenze
- cancellazione fisica delle ricorrenze tramite remove()
- supporto a RecurrenceType = trasferimento
- filtri post-query in JavaScript per data_fine dentro getDue
- UI dedicate per gestione ricorrenze [DA VERIFICARE]

## 3. Prerequisiti Bloccanti

- Nessuno. Il design 013 dichiara prerequisiti: nessuno.
- La tabella ricorrenze deve esistere nello schema Supabase descritto in docs/6-sql/schema-database-supabase.md.

## 4. Architettura e Decisioni Chiave

 - Decisione - DESIGN 013, sezione 3: tutte le stringhe utente o screen reader devono passare da src/locales/it.ts. Conseguenza pratica: nessun messaggio inline nel repository o nel context.
 - Decisione - DESIGN 013, sezione 3: RecurrenceType e limitato a entrata | uscita. Conseguenza pratica: i tipi client non devono ammettere trasferimento.
 - Decisione - DESIGN 013, sezione 3: il repository non espone remove() e l'unica eliminazione consentita e deactivate(id) con attiva = false. Conseguenza pratica: CRUD limitato a create/get/update/deactivate.
 - Decisione - DESIGN 013, sezione 3: il repository non calcola la prossima_generazione. Conseguenza pratica: update/create persistono valori ricevuti dal layer superiore senza logica calendario.
 - Decisione - DESIGN 013, sezione 3: il filtro data_fine di getDue deve stare nella query Supabase lato database. Conseguenza pratica: la funzione getDue non puo caricare record extra e filtrare dopo in JavaScript.
 - Decisione - DESIGN 013, sezione 7: mapping approvato categoriaId in toClient usa row.categoria_id ?? undefined e in toDb usa null quando categoriaId e presente ma nullo. Conseguenza pratica: il repository deve allinearsi ai mapping espliciti del design.
 - Decisione - DESIGN 013, sezione 7: la data locale per getDue usa formato YYYY-MM-DD derivato da getFullYear(), getMonth()+1 e getDate() con padding a due cifre. Conseguenza pratica: il repository deve costruire la data di riferimento con questo formato.

## 5. Task Atomici

### T1
- Azione: Aggiungere l'interfaccia DbRecurrence con campi snake_case della tabella ricorrenze.
- File target: src/lib/supabase/types.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non riporta errori di tipo sulle nuove definizioni DbRecurrence.
- Note operative: addizione pura; mantenere Db* confinati al layer src/lib/supabase/.

### T2
- Azione: Aggiungere RecurrenceType, interfaccia Recurrence in camelCase e campo ricorrenze in AppState.
- File target: src/lib/types.ts
- Dipende da: T1
- Metrica di successo: npx tsc --noEmit accetta RecurrenceType solo come entrata | uscita e AppState espone ricorrenze senza errori.
- Note operative: riutilizzare RecurrenceFrequency esistente come richiesto dal design.

### T3
- Azione: Creare il repository ricorrenze con getAll, getById, getDue, create, update e deactivate, inclusi mapping approvati e filtro data_fine lato database.
- File target: src/lib/supabase/repositories/ricorrenze.ts
- Dipende da: T1, T2
- Metrica di successo: la suite mirata del repository passa e i test dimostrano che deactivate imposta attiva = false senza cancellazione fisica.
- Note operative: getAll accetta filtri opzionali attiva e contoId; getDue usa prossima_generazione, attiva = true e data_fine IS NULL oppure >= dataRiferimento.

### T4
- Azione: Aggiungere le chiavi di localizzazione per errori, notFound e conferme delle ricorrenze.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per il namespace errors.ricorrenze e confirm.ricorrenze.
- Note operative: chiavi obbligatorie: loadFailed, createFailed, updateFailed, deactivateFailed, notFound, created, updated, deactivated.

### T5
- Azione: Integrare ricorrenze nel caricamento snapshot, nel reset al logout e nella pipeline writeCache.
- File target: src/context/AppDataContext.tsx
- Dipende da: T2, T3, T4
- Metrica di successo: npx tsc --noEmit e i test del provider interessati confermano che loadDomainSnapshot include una quinta voce Promise.all, il reset azzera ricorrenze e writeCache serializza il nuovo slice.
- Note operative: non introdurre stringhe hardcoded nel context.

### T6
- Azione: Creare la suite di test del repository ricorrenze con scenari obbligatori di successo, filtri ed error handling.
- File target: __tests__/ricorrenze.repository.test.ts
- Dipende da: T1, T2, T3
- Metrica di successo: npx jest __tests__/ricorrenze.repository.test.ts --runInBand termina con exit code 0 quando il repository e implementato.
- Note operative: coprire getAll, getById, getDue, create, update, deactivate ed error handling come indicato nel design.
- Note operative: la suite deve coprire almeno 8 scenari unitari sul repository e almeno 2 scenari di integrazione su AppDataContext per uniformità con i moduli successivi.

## 6. Test Obbligatori

- File spec: __tests__/ricorrenze.repository.test.ts | Scenario: getAll restituisce tutte le ricorrenze dell'utente autenticato senza filtri. | Tipo: unit
- File spec: __tests__/ricorrenze.repository.test.ts | Scenario: getAll applica il filtro attiva quando fornito. | Tipo: unit
- File spec: __tests__/ricorrenze.repository.test.ts | Scenario: getAll applica il filtro contoId quando fornito. | Tipo: unit
- File spec: __tests__/ricorrenze.repository.test.ts | Scenario: getById restituisce la ricorrenza richiesta quando presente. | Tipo: unit
- File spec: __tests__/ricorrenze.repository.test.ts | Scenario: getById gestisce il caso not found con chiave errors.ricorrenze.notFound. | Tipo: unit
- File spec: __tests__/ricorrenze.repository.test.ts | Scenario: getDue usa la data locale YYYY-MM-DD e filtra in query per prossima_generazione, attiva = true e data_fine valida. | Tipo: unit
- File spec: __tests__/ricorrenze.repository.test.ts | Scenario: create inietta automaticamente user_id e salva categoriaId secondo il mapping approvato. | Tipo: unit
- File spec: __tests__/ricorrenze.repository.test.ts | Scenario: update applica modifiche parziali senza calcolare prossima_generazione. | Tipo: unit
- File spec: __tests__/ricorrenze.repository.test.ts | Scenario: deactivate imposta attiva = false senza rimuovere fisicamente il record. | Tipo: unit
- File spec: __tests__/ricorrenze.repository.test.ts | Scenario: il repository propaga gli errori di lettura o scrittura con handling coerente per getAll, create, update e deactivate. | Tipo: unit
- File spec: __tests__/AppDataContext.spec.ts | Scenario: loadDomainSnapshot integra ricorrenze nel Promise.all e writeCache include il nuovo slice. | Tipo: integration

## 7. Gate di Chiusura

- G-013-1 | Verifica: i nuovi tipi DbRecurrence e Recurrence sono compilabili e coerenti con i vincoli del design. | Comando: npx tsc --noEmit | Stato iniziale: OPEN
- G-013-2 | Verifica: la suite del repository copre filtri getAll/getDue, create, update, deactivate e notFound. | Comando: npx jest __tests__/ricorrenze.repository.test.ts --runInBand | Stato iniziale: OPEN
- G-013-3 | Verifica: il filtro data_fine in getDue e espresso nella query Supabase e non in un filtro JavaScript post-load. | Comando: verifica manuale su src/lib/supabase/repositories/ricorrenze.ts | Stato iniziale: OPEN
- G-013-4 | Verifica: deactivate e l'unica operazione di eliminazione esposta dal repository. | Comando: verifica manuale su src/lib/supabase/repositories/ricorrenze.ts | Stato iniziale: OPEN
- G-013-5 | Verifica: AppDataContext carica, resetta e cachea ricorrenze nel flusso dati esistente. | Comando: npx jest __tests__/AppDataContext.spec.ts --runInBand | Stato iniziale: OPEN

## 8. Rollback

- src/lib/supabase/types.ts: ripristinare la versione precedente rimuovendo DbRecurrence.
- src/lib/types.ts: ripristinare la versione precedente rimuovendo RecurrenceType, Recurrence e il campo ricorrenze da AppState.
- src/lib/supabase/repositories/ricorrenze.ts: eliminare il file se il repository non supera i gate.
- src/locales/it.ts: rimuovere le chiavi errors.ricorrenze e confirm.ricorrenze aggiunte dal piano.
- src/context/AppDataContext.tsx: ripristinare loadDomainSnapshot, reset logout e writeCache allo stato pre-ricorrenze.
- __tests__/ricorrenze.repository.test.ts: eliminare il file spec se la feature viene rimandata.

## 9. Riferimenti

- docs/2-projects/013-DESIGN_repository-ricorrenze_v0.1.0.md
- docs/4-todo-lists/013-TODO_repository-ricorrenze_v0.1.0.md
- src/lib/supabase/types.ts
- src/lib/types.ts
- src/lib/supabase/repositories/ricorrenze.ts
- src/context/AppDataContext.tsx
- src/locales/it.ts
- __tests__/ricorrenze.repository.test.ts