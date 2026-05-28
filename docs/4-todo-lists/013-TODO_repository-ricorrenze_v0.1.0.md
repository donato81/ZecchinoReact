---
titolo: TODO 013 - Repository Ricorrenze
versione: 0.1.0
data: 2026-05-28
stato: PENDING
piano_riferimento: docs/3-coding-plans/013-PLAN_repository-ricorrenze_v0.1.0.md
design_riferimento: docs/2-projects/013-DESIGN_repository-ricorrenze_v0.1.0.md
autore: Agent-Orchestrator
---

# TODO 013 - Repository Ricorrenze

## 1. Stato e Gate Bloccante

- Gate bloccante: nessuno. Il design 013 non ha prerequisiti bloccanti.
- Stato corrente: PENDING

## 2. Stato Task (panoramica)

| ID task | Titolo | Stato | Note |
| --- | --- | --- | --- |
| T1 | Aggiungere DbRecurrence | TODO | Tipi DB in snake_case |
| T2 | Aggiungere RecurrenceType e Recurrence | TODO | Include AppState.ricorrenze |
| T3 | Creare repository ricorrenze | TODO | CRUD senza remove() |
| T4 | Aggiungere chiavi locali ricorrenze | TODO | Errori, notFound, conferme |
| T5 | Integrare ricorrenze in AppDataContext | TODO | Load, reset, cache |
| T6 | Creare test repository ricorrenze | TODO | Scenari obbligatori del design |

## 3. Task Atomici

### T1
- Azione: Aggiungere l'interfaccia DbRecurrence con campi snake_case della tabella ricorrenze.
- File target: src/lib/supabase/types.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non riporta errori di tipo sulle nuove definizioni DbRecurrence.
- Task Status: [ ] TODO

### T2
- Azione: Aggiungere RecurrenceType, interfaccia Recurrence in camelCase e campo ricorrenze in AppState.
- File target: src/lib/types.ts
- Dipende da: T1
- Metrica di successo: npx tsc --noEmit accetta RecurrenceType solo come entrata | uscita e AppState espone ricorrenze senza errori.
- Task Status: [ ] TODO

### T3
- Azione: Creare il repository ricorrenze con getAll, getById, getDue, create, update e deactivate, inclusi mapping approvati e filtro data_fine lato database.
- File target: src/lib/supabase/repositories/ricorrenze.ts
- Dipende da: T1, T2
- Metrica di successo: la suite mirata del repository passa e i test dimostrano che deactivate imposta attiva = false senza cancellazione fisica.
- Task Status: [ ] TODO

### T4
- Azione: Aggiungere le chiavi di localizzazione per errori, notFound e conferme delle ricorrenze.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per il namespace errors.ricorrenze e confirm.ricorrenze.
- Task Status: [ ] TODO

### T5
- Azione: Integrare ricorrenze nel caricamento snapshot, nel reset al logout e nella pipeline writeCache.
- File target: src/context/AppDataContext.tsx
- Dipende da: T2, T3, T4
- Metrica di successo: npx tsc --noEmit e i test del provider interessati confermano che loadDomainSnapshot include una quinta voce Promise.all, il reset azzera ricorrenze e writeCache serializza il nuovo slice.
- Task Status: [ ] TODO

### T6
- Azione: Creare la suite di test del repository ricorrenze con scenari obbligatori di successo, filtri ed error handling.
- File target: __tests__/ricorrenze.repository.test.ts
- Dipende da: T1, T2, T3
- Metrica di successo: npx jest __tests__/ricorrenze.repository.test.ts --runInBand termina con exit code 0 quando il repository e implementato.
- Task Status: [ ] TODO
- Note operative: la suite deve coprire almeno 8 scenari unitari sul repository e almeno 2 scenari di integrazione su AppDataContext per uniformità con i moduli successivi.

## 4. Note Operative

- Non introdurre stringhe utente inline: tutte le chiavi devono transitare da src/locales/it.ts.
- Il repository non puo esporre remove(); l'unica eliminazione ammessa e deactivate(id).
- getDue deve applicare il filtro data_fine nella query Supabase, non dopo il caricamento in JavaScript.
- Il calcolo di prossima_generazione resta fuori dal repository e deve essere ricevuto dal layer superiore.
- I mapping categoriaId devono seguire esattamente le regole approvate nella sezione 7 del design 013.

## 5. Log di Validazione

| Data | Task ID | Validato Da | Risultato | Note |
| --- | --- | --- | --- | --- |

## 6. Gate di Chiusura

- G-013-1 | Verifica: i nuovi tipi DbRecurrence e Recurrence sono compilabili e coerenti con i vincoli del design. | Comando: npx tsc --noEmit | Gate Status: [ ] OPEN
- G-013-2 | Verifica: la suite del repository copre filtri getAll/getDue, create, update, deactivate e notFound. | Comando: npx jest __tests__/ricorrenze.repository.test.ts --runInBand | Gate Status: [ ] OPEN
- G-013-3 | Verifica: il filtro data_fine in getDue e espresso nella query Supabase e non in un filtro JavaScript post-load. | Comando: verifica manuale su src/lib/supabase/repositories/ricorrenze.ts | Gate Status: [ ] OPEN
- G-013-4 | Verifica: deactivate e l'unica operazione di eliminazione esposta dal repository. | Comando: verifica manuale su src/lib/supabase/repositories/ricorrenze.ts | Gate Status: [ ] OPEN
- G-013-5 | Verifica: AppDataContext carica, resetta e cachea ricorrenze nel flusso dati esistente. | Comando: npx jest __tests__/AppDataContext.spec.ts --runInBand | Gate Status: [ ] OPEN

## 7. Riferimenti

- docs/3-coding-plans/013-PLAN_repository-ricorrenze_v0.1.0.md
- docs/2-projects/013-DESIGN_repository-ricorrenze_v0.1.0.md
- src/lib/supabase/types.ts
- src/lib/types.ts
- src/lib/supabase/repositories/ricorrenze.ts
- src/locales/it.ts
- src/context/AppDataContext.tsx
- __tests__/ricorrenze.repository.test.ts