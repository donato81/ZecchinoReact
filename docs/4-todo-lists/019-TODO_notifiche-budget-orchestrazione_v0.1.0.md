---
titolo: TODO 019 - Notifiche Budget e Orchestrazione
versione: 0.1.0
data: 2026-05-29
stato: PENDING
piano_riferimento: docs/3-coding-plans/019-PLAN_notifiche-budget-orchestrazione_v0.1.0.md
design_riferimento: docs/2-projects/019-DESIGN_notifiche-budget-orchestrazione_v0.1.0.md
autore: Agent-Orchestrator
---

# TODO 019 - Notifiche Budget e Orchestrazione

## 1. Stato e Gate Bloccante

- Gate bloccante: PLAN 015 completato per il layer notifiche esistente e PLAN 017 implementato per roundCurrency ed extractDatePart condivise.
- Verifica infrastrutturale obbligatoria: la migrazione P55 deve essere prodotta prima del riallineamento completo di repository e test.
- Verifica architetturale obbligatoria: le soglie warning e critical devono provenire da costanti nominate in un file dedicato, mai da valori letterali sparsi.
- Stato corrente: PENDING

## 2. Stato Task (panoramica)

| ID task | Titolo | Stato | Note |
| --- | --- | --- | --- |
| T1 | Creare costanti soglie budget | TODO | File dedicato con warning e critical |
| T2 | Riallineare tipi notifiche | TODO | Tipi client, metadata e DbNotification |
| T3 | Riallineare repository notifiche | TODO | Deduplicazione persistita e chiavi locali |
| T4 | Completare notification-service | TODO | Deduplicazione ibrida, idempotenza, cleanup READY |
| T5 | Snellire AppDataContext | TODO | Solo invocazione service e hydration secondaria |
| T6 | Aggiungere chiavi locali notifiche | TODO | Titoli, messaggi, errori e annunci |
| T7 | Produrre migrazione P55 | TODO | Tabella, indici e policy RLS |
| T8 | Aggiornare test notifiche | TODO | Service, repository e context |

## 3. Task Atomici

### T1
- Azione: Creare un file di configurazione dedicato che esporti BUDGET_ALERT_THRESHOLD_WARNING e BUDGET_ALERT_THRESHOLD_CRITICAL come uniche soglie ammesse dal dominio notifiche budget.
- File target: src/lib/budget-notification-config.ts
- Dipende da: nessuno
- Metrica di successo: notification-service, budget-alerts e i test possono importare le soglie senza usare valori letterali hardcoded.
- Task Status: [ ] TODO

### T2
- Azione: Riallineare NotificationLevel, NotificationMetadata, BudgetNotificationMetadata, Notification e NotificationHydrationState insieme a DbNotification sullo schema finale del design.
- File target: src/lib/types.ts, src/lib/supabase/types.ts
- Dipende da: T1
- Metrica di successo: npx tsc --noEmit compila tipi client e DbNotification coerenti con livello, chiavi di localizzazione e metadata JSONB.
- Task Status: [ ] TODO

### T3
- Azione: Riallineare il repository notifiche con existsUnreadForEntityLevel, query unread per entity e supporto a titolo_key, messaggio_key, livello e metadata obbligatori.
- File target: src/lib/supabase/repositories/notifiche.ts
- Dipende da: T2, T1
- Metrica di successo: __tests__/notifiche.repository.test.ts dimostra deduplicazione persistita, unread count, cleanup e isolamento utente sul nuovo schema.
- Task Status: [ ] TODO

### T4
- Azione: Completare notification-service con deduplicazione ibrida runtime piu persistenza, escalation replace, idempotenza mensile locale, cleanup solo in READY e scarto silenzioso dei budget mancanti.
- File target: src/lib/notification-service.ts
- Dipende da: T1, T2, T3, PLAN 017
- Metrica di successo: __tests__/notification-service.test.ts copre deduplicazione runtime, escalation, invalidazione cambio mese, missing budget e secondary hydration fail-soft.
- Caso limite obbligatorio: il service deve gestire il caso in cui un budget venga eliminato mentre esiste gia una notifica pendente per quel budget, senza generare errori e senza tentare la persistenza su un entity_id orfano.
- Task Status: [ ] TODO

### T5
- Azione: Rimuovere definitivamente la logica residua di orchestrazione budget da AppDataContext mantenendo solo invocazione del service, notificationsHydrated separato e comportamento fail-soft.
- File target: src/context/AppDataContext.tsx
- Dipende da: T4
- Metrica di successo: __tests__/AppDataContext.spec.ts dimostra che il bootstrap core resta indipendente dagli errori notifiche e che il cleanup non parte prima di READY.
- Task Status: [ ] TODO

### T6
- Azione: Aggiungere tutte le chiavi di localizzazione per titoli, messaggi, errori e annunci accessibilita delle notifiche budget.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per warning, critical, exceeded, loadFailed, createFailed e cleanupFailed.
- Task Status: [ ] TODO

### T7
- Azione: Produrre la migrazione P55 della tabella notifiche con indici, policy RLS, livello esplicito e metadata JSONB coerenti con il design.
- File target: docs/6-sql/P55-notifiche.sql
- Dipende da: T1, T2
- Metrica di successo: P55 documenta titolo_key, messaggio_key, livello, metadata, indici richiesti e policy RLS del dominio.
- Task Status: [ ] TODO

### T8
- Azione: Aggiornare le suite notification-service, notifiche.repository e AppDataContext per coprire il contratto finale del design 019.
- File target: __tests__/notification-service.test.ts, __tests__/notifiche.repository.test.ts, __tests__/AppDataContext.spec.ts
- Dipende da: T1, T3, T4, T5, PLAN 017
- Metrica di successo: le suite coprono deduplicazione ibrida, costanti nominate, budgetPeriodKey, metadata obbligatori, escalation replace e bootstrap secondario non bloccante.
- Task Status: [ ] TODO

## 4. Note Operative

- Le soglie budget possono apparire solo come BUDGET_ALERT_THRESHOLD_WARNING e BUDGET_ALERT_THRESHOLD_CRITICAL.
- La deduplicazione e un meccanismo dedicato a due livelli: runtime piu persistenza.
- notification-service deve riusare roundCurrency ed extractDatePart introdotte in PLAN 017 senza ridefinizione locale.
- Il cleanup notifiche non puo partire in HYDRATING o CACHE-READY.
- Nessuna stringa renderizzata finale puo essere salvata nel record notifiche o hardcoded nel codice.

## 5. Log di Validazione

| Data | Task ID | Validato Da | Risultato | Note |
| --- | --- | --- | --- | --- |
| 2026-05-29 | CORREZIONE | Agent-Copilot | APPLICATA | ripristinato comando gate G-019-1 e aggiunto caso limite T4 |

## 6. Gate di Chiusura

- G-019-1 | Verifica: soglie e costanti nominate sono centralizzate e non compaiono come letterali sparsi. | Comando: grep -RIn "0\.75\|0\.90\|0\.80\|75\|80\|90\|100" src/lib src/context __tests__ | grep -v "budget-notification-config.ts" | Gate Status: [ ] OPEN
- G-019-2 | Verifica: repository notifiche aderisce allo schema persistito finale con deduplicazione per entita/livello. | Comando: npx jest __tests__/notifiche.repository.test.ts --runInBand | Gate Status: [ ] OPEN
- G-019-3 | Verifica: notification-service copre deduplicazione ibrida, escalation replace, idempotenza mensile e budget mancanti. | Comando: npx jest __tests__/notification-service.test.ts --runInBand | Gate Status: [ ] OPEN
- G-019-4 | Verifica: AppDataContext mantiene secondary hydration fail-soft e cleanup solo in READY. | Comando: npx jest __tests__/AppDataContext.spec.ts --runInBand | Gate Status: [ ] OPEN
- G-019-5 | Verifica: roundCurrency ed extractDatePart di PLAN 017 sono riusate da 019 senza ridefinizione locale. | Comando: verifica manuale sul servizio notifiche e sulle helper condivise | Gate Status: [ ] OPEN
- G-019-6 | Verifica: la migrazione P55 documenta correttamente tabella, indici, metadata JSONB e assenza di updated_at. | Comando: verifica manuale su docs/6-sql/P55-notifiche.sql | Gate Status: [ ] OPEN

## 7. Riferimenti

- docs/3-coding-plans/019-PLAN_notifiche-budget-orchestrazione_v0.1.0.md
- docs/2-projects/019-DESIGN_notifiche-budget-orchestrazione_v0.1.0.md
- docs/3-coding-plans/015-PLAN_repository-notifiche-notification-service_v0.1.0.md
- docs/3-coding-plans/017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
- configurazione soglie notifiche budget
- servizio di orchestrazione notifiche
- repository notifiche
- docs/6-sql/P55-notifiche.sql