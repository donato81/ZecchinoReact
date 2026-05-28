---
titolo: PLAN 015 - Repository Notifiche e Notification Service
versione: 0.1.0
data: 2026-05-28
stato: DRAFT
design_riferimento: docs/2-projects/015-DESIGN_repository-notifiche-notification-service_v0.1.0.md
autore: Agent-Orchestrator
dipendenze: PLAN 013, PLAN 014
---

# PLAN 015 - Repository Notifiche e Notification Service

## 1. Obiettivo del Piano

Estrarre la logica notifiche budget da AppDataContext verso un notification-service dedicato, aggiungere persistenza Supabase con cache mirata e introdurre hydration secondaria delle notifiche non lette senza regressioni sul bootstrap.

## 2. Perimetro (Scope)

File sorgente da creare o modificare:
- src/lib/supabase/types.ts
- src/lib/types.ts
- src/lib/supabase/cache.ts
- src/lib/budget-alerts.ts
- src/locales/it.ts
- src/lib/notification-service.ts
- src/lib/supabase/repositories/notifiche.ts
- src/context/AppDataContext.tsx
- __tests__/notifiche.repository.test.ts

Fuori perimetro:
- modificare la responsabilita di calcolo puro di src/lib/budget-alerts.ts oltre la migrazione stringhe
- introdurre canali push o notifiche native [DA VERIFICARE]
- formattazione UI avanzata dei valori numerici nelle notifiche
- notifiche ricorrenza dipendenti da implementazioni successive al PLAN 013 [DA VERIFICARE]

## 3. Prerequisiti Bloccanti

- PLAN 013 completato e convalidato.
- PLAN 014 completato e convalidato.
- Il bootstrap del provider deve poter raggiungere lo stato READY prima della hydration secondaria delle notifiche.

## 4. Architettura e Decisioni Chiave

- Decisione 1 - Estrazione da AppDataContext. Conseguenza pratica: checkBudgetNotifications e budgetPercentages escono dal context e vengono orchestrati dal notification-service.
- Decisione 2 - Deduplicazione ibrida. Conseguenza pratica: il runtime controlla l'attraversamento soglie e la persistenza usa existsUnreadForEntityLevel per prevenire duplicati non letti.
- Decisione 3 - Metadata obbligatori. Conseguenza pratica: le notifiche budget devono includere level, percentage, threshold e budgetPeriodKey.
- Decisione 4 - Escalation replace obbligatoria. Conseguenza pratica: una notifica di livello superiore marca come letta la precedente non letta prima di crearne una nuova.
- Decisione 5 - Secondary hydration. Conseguenza pratica: le notifiche sono caricate asincronamente dopo READY e lo stato espone notificationsHydrated.
- Decisione 6 - Cleanup post-hydration. Conseguenza pratica: removeExpired e cleanupReadExpiredBefore sono ammessi solo quando bootstrapState === READY.
- Decisione 7 - Cache notifiche: solo non lette, TTL 1 ora. Conseguenza pratica: cache.ts deve trattare notifiche con politica dedicata.
- Decisione 8 - Migrazione stringhe hardcoded inclusa. Conseguenza pratica: budget-alerts.ts e notification-service non possono contenere testo utente inline.

## 5. Task Atomici

### T1
- Azione: Aggiungere DbNotification al layer Supabase.
- File target: src/lib/supabase/types.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit compila DbNotification senza errori di tipo.
- Note operative: mantenere il naming in snake_case e la separazione dei tipi Db*.

### T2
- Azione: Aggiungere NotificationType, AppNotification, notifications in AppState e flag notificationsHydrated.
- File target: src/lib/types.ts
- Dipende da: T1
- Metrica di successo: npx tsc --noEmit accetta i nuovi tipi e lo stato applicativo senza regressioni sugli altri slice.
- Note operative: il flag notificationsHydrated serve alla hydration secondaria dopo READY.

### T3
- Azione: Estendere la cache Supabase aggiungendo notifiche con TTL di 1 ora e caching delle sole non lette.
- File target: src/lib/supabase/cache.ts
- Dipende da: T2
- Metrica di successo: i controlli di cache riconoscono notifiche con policy dedicata a TTL 1 ora e senza includere notifiche lette.
- Note operative: la policy cache deve restare coerente con la Decisione 7.

### T4
- Azione: Migrare le stringhe hardcoded di budget-alerts.ts verso src/locales/it.ts.
- File target: src/lib/budget-alerts.ts
- Dipende da: nessuno
- Metrica di successo: verifica manuale su src/lib/budget-alerts.ts conferma assenza di stringhe utente inline e npx tsc --noEmit passa.
- Note operative: il layer di calcolo puro non deve acquisire responsabilita di orchestrazione.

### T5
- Azione: Aggiungere tutte le stringhe notifiche richieste dal service e dal repository.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per notifiche budget e lifecycle.
- Note operative: includere le stringhe migrate da budget-alerts.ts e quelle necessarie al nuovo service.

### T6
- Azione: Creare il repository notifiche con query, mark-read e cleanup expiration.
- File target: src/lib/supabase/repositories/notifiche.ts
- Dipende da: T1, T2, T3
- Metrica di successo: npx jest __tests__/notifiche.repository.test.ts --runInBand copre le API pubbliche del repository con esito verde quando implementato.
- Note operative: funzioni pubbliche obbligatorie: getAll, getUnreadCount, getUnreadByEntity, existsUnreadForEntityLevel, markAsRead, markAllAsRead, create, remove, removeExpired, cleanupReadExpiredBefore.

### T7
- Azione: Creare notification-service come layer di orchestrazione per deduplicazione, escalation, metadata e cleanup coordinato.
- File target: src/lib/notification-service.ts
- Dipende da: T4, T5, T6
- Metrica di successo: i test di integrazione o le verifiche del context dimostrano estrazione di checkBudgetNotifications, deduplicazione per soglia e replace della notifica precedente a livello superiore.
- Note operative: il service deve essere l'unico punto di coordinamento cross-domain tra budget-alerts e repository notifiche.

### T8
- Azione: Refactor di AppDataContext per rimuovere checkBudgetNotifications e budgetPercentages, usare notification-service, caricare notifiche fail-soft dopo READY e resettare lo stato al logout.
- File target: src/context/AppDataContext.tsx
- Dipende da: T2, T3, T5, T6, T7
- Metrica di successo: npx tsc --noEmit e i test del provider confermano che notificationsHydrated viene aggiornato dopo READY, il cleanup avviene post-hydration e il logout resetta notifications.
- Note operative: removeExpired e cleanupReadExpiredBefore vanno chiamati solo quando bootstrapState === READY.

### T9
- Azione: Creare la suite di test del repository notifiche.
- File target: __tests__/notifiche.repository.test.ts
- Dipende da: T1, T2, T6
- Metrica di successo: npx jest __tests__/notifiche.repository.test.ts --runInBand termina con exit code 0 quando il repository e implementato.
- Note operative: includere casi positivi e negativi o boundary per ogni API pubblica del repository.

## 6. Test Obbligatori

- File spec: __tests__/notifiche.repository.test.ts | Scenario: getAll restituisce le notifiche disponibili ordinate secondo il contratto del repository. | Tipo: unit
- File spec: __tests__/notifiche.repository.test.ts | Scenario: getUnreadCount conta solo notifiche non lette. | Tipo: unit
- File spec: __tests__/notifiche.repository.test.ts | Scenario: getUnreadByEntity restituisce solo notifiche non lette per entity e period key richiesti. | Tipo: unit
- File spec: __tests__/notifiche.repository.test.ts | Scenario: existsUnreadForEntityLevel distingue correttamente presenza e assenza di duplicati non letti. | Tipo: unit
- File spec: __tests__/notifiche.repository.test.ts | Scenario: markAsRead marca una singola notifica come letta. | Tipo: unit
- File spec: __tests__/notifiche.repository.test.ts | Scenario: markAllAsRead marca come lette tutte le notifiche pertinenti. | Tipo: unit
- File spec: __tests__/notifiche.repository.test.ts | Scenario: create salva metadata obbligatori level, percentage, threshold e budgetPeriodKey. | Tipo: unit
- File spec: __tests__/notifiche.repository.test.ts | Scenario: remove elimina la notifica richiesta. | Tipo: unit
- File spec: __tests__/notifiche.repository.test.ts | Scenario: removeExpired elimina le notifiche scadute solo quando richiesto dal lifecycle. | Tipo: unit
- File spec: __tests__/notifiche.repository.test.ts | Scenario: cleanupReadExpiredBefore elimina o pulisce notifiche lette antecedenti alla soglia. | Tipo: unit
- File spec: __tests__/AppDataContext.spec.ts | Scenario: hydration secondaria carica notifiche dopo READY con flag notificationsHydrated e modalita fail-soft. | Tipo: integration
- File spec: __tests__/AppDataContext.spec.ts | Scenario: escalation replace marca come letta la notifica precedente non letta prima di crearne una di livello superiore. | Tipo: integration

## 7. Gate di Chiusura

- G-015-1 | Verifica: tipi, cache e migrazione stringhe compilano senza errori. | Comando: npx tsc --noEmit | Stato iniziale: OPEN
- G-015-2 | Verifica: la suite repository notifiche copre tutte le API pubbliche e i casi negativi o boundary. | Comando: npx jest __tests__/notifiche.repository.test.ts --runInBand | Stato iniziale: OPEN
- G-015-3 | Verifica: notification-service applica deduplicazione, metadata obbligatori ed escalation replace. | Comando: verifica manuale su src/lib/notification-service.ts | Stato iniziale: OPEN
- G-015-4 | Verifica: AppDataContext esegue hydration secondaria solo dopo READY e aggiorna notificationsHydrated in fail-soft. | Comando: npx jest __tests__/AppDataContext.spec.ts --runInBand | Stato iniziale: OPEN
- G-015-5 | Verifica: cleanup ed expiration delle notifiche avvengono solo dopo READY. | Comando: verifica manuale su src/context/AppDataContext.tsx e src/lib/notification-service.ts | Stato iniziale: OPEN
- G-015-6 | Verifica: cache notifiche conserva solo non lette con TTL 1 ora. | Comando: verifica manuale su src/lib/supabase/cache.ts | Stato iniziale: OPEN

## 8. Rollback

- src/lib/supabase/types.ts: ripristinare la versione precedente rimuovendo DbNotification.
- src/lib/types.ts: rimuovere NotificationType, AppNotification, notifications e notificationsHydrated se il piano viene annullato.
- src/lib/supabase/cache.ts: rimuovere notifiche dalla cache o riportare la policy precedente.
- src/lib/budget-alerts.ts: ripristinare la versione precedente della migrazione stringhe se necessario.
- src/locales/it.ts: rimuovere le chiavi notifiche aggiunte dal piano.
- src/lib/notification-service.ts: eliminare il file se l'orchestrazione non supera i gate.
- src/lib/supabase/repositories/notifiche.ts: eliminare il file se il repository non supera i gate.
- src/context/AppDataContext.tsx: ripristinare checkBudgetNotifications, budgetPercentages e il flusso pre-service.
- __tests__/notifiche.repository.test.ts: eliminare la spec placeholder o implementata se il piano viene sospeso.

## 9. Riferimenti

- docs/2-projects/015-DESIGN_repository-notifiche-notification-service_v0.1.0.md
- docs/4-todo-lists/015-TODO_repository-notifiche-notification-service_v0.1.0.md
- docs/3-coding-plans/013-PLAN_repository-ricorrenze_v0.1.0.md
- docs/3-coding-plans/014-PLAN_repository-tag-transazioni-tag_v0.1.0.md
- src/lib/budget-alerts.ts
- src/lib/notification-service.ts
- src/lib/supabase/repositories/notifiche.ts
- src/context/AppDataContext.tsx
- src/lib/supabase/cache.ts
- src/locales/it.ts
- __tests__/notifiche.repository.test.ts