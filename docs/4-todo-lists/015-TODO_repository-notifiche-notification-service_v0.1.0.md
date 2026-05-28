---
titolo: TODO 015 - Repository Notifiche e Notification Service
versione: 0.1.0
data: 2026-05-28
stato: PENDING
piano_riferimento: docs/3-coding-plans/015-PLAN_repository-notifiche-notification-service_v0.1.0.md
design_riferimento: docs/2-projects/015-DESIGN_repository-notifiche-notification-service_v0.1.0.md
autore: Agent-Orchestrator
---

# TODO 015 - Repository Notifiche e Notification Service

## 1. Stato e Gate Bloccante

- Gate bloccante: PLAN 013 e PLAN 014 completati e convalidati.
- Stato corrente: PENDING

## 2. Stato Task (panoramica)

| ID task | Titolo | Stato | Note |
| --- | --- | --- | --- |
| T1 | Aggiungere DbNotification | TODO | Tipo DB notifiche |
| T2 | Aggiungere tipi notifiche lato app | TODO | AppNotification e hydration flag |
| T3 | Estendere cache notifiche | TODO | Solo non lette, TTL 1 ora |
| T4 | Migrare stringhe in budget-alerts | TODO | Nessun testo inline |
| T5 | Aggiungere chiavi locali notifiche | TODO | Service e repository |
| T6 | Creare repository notifiche | TODO | Query, mark-read, cleanup |
| T7 | Creare notification-service | TODO | Dedup, escalation, lifecycle |
| T8 | Rifattorizzare AppDataContext | TODO | Secondary hydration |
| T9 | Creare test repository notifiche | TODO | Tutte le API pubbliche |

## 3. Task Atomici

### T1
- Azione: Aggiungere DbNotification al layer Supabase.
- File target: src/lib/supabase/types.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit compila DbNotification senza errori di tipo.
- Task Status: [ ] TODO
- Note operative: DbNotification deve mappare tutti i campi della tabella notifiche dello schema reale Supabase, inclusi canale (valori: inapp, email, push) e schedulata_per (TIMESTAMPTZ nullable).

### T2
- Azione: Aggiungere NotificationType, AppNotification, notifications in AppState e flag notificationsHydrated.
- File target: src/lib/types.ts
- Dipende da: T1
- Metrica di successo: npx tsc --noEmit accetta i nuovi tipi e lo stato applicativo senza regressioni sugli altri slice.
- Task Status: [ ] TODO

### T3
- Azione: Estendere la cache Supabase aggiungendo notifiche con TTL di 1 ora e caching delle sole non lette.
- File target: src/lib/supabase/cache.ts
- Dipende da: T2
- Metrica di successo: i controlli di cache riconoscono notifiche con policy dedicata a TTL 1 ora e senza includere notifiche lette.
- Task Status: [ ] TODO

### T4
- Azione: Migrare le stringhe hardcoded di budget-alerts.ts verso src/locales/it.ts.
- File target: src/lib/budget-alerts.ts
- Dipende da: nessuno
- Metrica di successo: verifica manuale su src/lib/budget-alerts.ts conferma assenza di stringhe utente inline e npx tsc --noEmit passa.
- Task Status: [ ] TODO

### T5
- Azione: Aggiungere tutte le stringhe notifiche richieste dal service e dal repository.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per notifiche budget e lifecycle.
- Task Status: [ ] TODO
- Note operative: le chiavi da definire in src/locales/it.ts includono come minimo: errors.notifiche.loadFailed, errors.notifiche.createFailed, errors.notifiche.markReadFailed, errors.notifiche.markAllReadFailed, errors.notifiche.removeFailed, errors.notifiche.cleanupFailed, confirm.notifiche.marked, confirm.notifiche.allMarked, confirm.notifiche.removed, notifiche.budget.soglia, notifiche.budget.superato, notifiche.budget.titolo. I nomi esatti devono rispettare il namespace i18n gia usato nel progetto in src/locales/it.ts.

### T6
- Azione: Creare il repository notifiche con query, mark-read e cleanup expiration.
- File target: src/lib/supabase/repositories/notifiche.ts
- Dipende da: T1, T2, T3
- Metrica di successo: npx jest __tests__/notifiche.repository.test.ts --runInBand copre le API pubbliche del repository con esito verde quando implementato.
- Task Status: [ ] TODO

### T7
- Azione: Creare notification-service come layer di orchestrazione per deduplicazione, escalation, metadata e cleanup coordinato.
- File target: src/lib/notification-service.ts
- Dipende da: T4, T5, T6
- Metrica di successo: i test di integrazione o le verifiche del context dimostrano estrazione di checkBudgetNotifications, deduplicazione per soglia e replace della notifica precedente a livello superiore.
- Task Status: [ ] TODO

### T8
- Azione: Refactor di AppDataContext per rimuovere checkBudgetNotifications e budgetPercentages, usare notification-service, caricare notifiche fail-soft dopo READY e resettare lo stato al logout.
- File target: src/context/AppDataContext.tsx
- Dipende da: T2, T3, T5, T6, T7
- Metrica di successo: npx tsc --noEmit e i test del provider confermano che notificationsHydrated viene aggiornato dopo READY, il cleanup avviene post-hydration e il logout resetta notifications.
- Task Status: [ ] TODO

### T9
- Azione: Creare la suite di test del repository notifiche.
- File target: __tests__/notifiche.repository.test.ts
- Dipende da: T1, T2, T6
- Metrica di successo: npx jest __tests__/notifiche.repository.test.ts --runInBand termina con exit code 0 quando il repository e implementato.
- Task Status: [ ] TODO

## 4. Note Operative

- notification-service deve essere l'unico punto di coordinamento cross-domain tra budget-alerts e repository notifiche.
- La deduplicazione e ibrida: attraversamento soglie a runtime piu controllo existsUnreadForEntityLevel in persistenza.
- Una notifica di livello superiore deve marcare come letta la precedente non letta prima di crearne una nuova.
- hydration e cleanup notifiche sono ammessi solo dopo bootstrapState === READY.
- Nessuna stringa utente puo restare inline in budget-alerts.ts, notification-service o AppDataContext.

## 5. Log di Validazione

| Data | Task ID | Validato Da | Risultato | Note |
| --- | --- | --- | --- | --- |

## 6. Gate di Chiusura

- G-015-1 | Verifica: tipi, cache e migrazione stringhe compilano senza errori. | Comando: npx tsc --noEmit | Gate Status: [ ] OPEN
- G-015-2 | Verifica: la suite repository notifiche copre tutte le API pubbliche e i casi negativi o boundary. | Comando: npx jest __tests__/notifiche.repository.test.ts --runInBand | Gate Status: [ ] OPEN
- G-015-3 | Verifica: notification-service applica deduplicazione, metadata obbligatori ed escalation replace. | Comando: verifica manuale su src/lib/notification-service.ts | Gate Status: [ ] OPEN
- G-015-4 | Verifica: AppDataContext esegue hydration secondaria solo dopo READY e aggiorna notificationsHydrated in fail-soft. | Comando: npx jest __tests__/AppDataContext.spec.ts --runInBand | Gate Status: [ ] OPEN
- G-015-5 | Verifica: cleanup ed expiration delle notifiche avvengono solo dopo READY. | Comando: verifica manuale su src/context/AppDataContext.tsx e src/lib/notification-service.ts | Gate Status: [ ] OPEN
- G-015-6 | Verifica: cache notifiche conserva solo non lette con TTL 1 ora. | Comando: verifica manuale su src/lib/supabase/cache.ts | Gate Status: [ ] OPEN

## 7. Riferimenti

- docs/3-coding-plans/015-PLAN_repository-notifiche-notification-service_v0.1.0.md
- docs/2-projects/015-DESIGN_repository-notifiche-notification-service_v0.1.0.md
- docs/3-coding-plans/013-PLAN_repository-ricorrenze_v0.1.0.md
- docs/3-coding-plans/014-PLAN_repository-tag-transazioni-tag_v0.1.0.md
- src/lib/budget-alerts.ts
- src/lib/notification-service.ts
- src/lib/supabase/repositories/notifiche.ts
- src/context/AppDataContext.tsx
- src/lib/supabase/cache.ts
- src/locales/it.ts
- __tests__/notifiche.repository.test.ts