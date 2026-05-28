---
Titolo: DESIGN 015 — Repository Notifiche e Notification Service
Versione: 0.1.0
Data: 2026-05-28
Stato: APPROVATO E VALIDATO
Prerequisiti: DESIGN 013 e DESIGN 014 approvati
DebitiTecniciOriginati: vedere sezione rischi residui
---

# DESIGN 015 — Repository Notifiche e Notification Service

Sezione 1 — Intestazione e metadati
- Titolo: DESIGN 015 — Repository Notifiche e Notification Service
- Versione: 0.1.0
- Data: 2026-05-28
- Stato: APPROVATO E VALIDATO
- Prerequisiti: DESIGN 013 e DESIGN 014 approvati
- Debiti tecnici originati: vedere sezione rischi residui

Sezione 2 — Scoperta critica dal codice reale
La funzione `checkBudgetNotifications()` esiste già dentro `AppDataContext.tsx`.
È chiamata dopo ogni `handleSaveTransaction()` di tipo `uscita` e usa
`shouldShowBudgetNotification()`, calcola percentuali, mostra toast, gestisce
suoni e haptic. `budgetPercentages` esiste già come stato React.
Il DESIGN 015 estrae e potenzia il codice esistente, spostandolo in un
service dedicato e aggiungendo persistenza nel database.

Sezione 3 — Architettura a tre layer

- Nessuna stringa visibile all'utente o annunciata dallo
  screen reader può essere scritta direttamente nel codice.
  Ogni testo passa obbligatoriamente da src/locales/it.ts.
  Senza eccezioni.

Layer 1 — Calcolo puro: `src/lib/budget-alerts.ts` (esistente)
- Responsabile solo del calcolo dei livelli di gravità e valutazione soglie.

Layer 2 — Orchestrazione: `src/lib/notification-service.ts` (nuovo)
- Emissione notifiche, deduplicazione, escalation, lifecycle, coordinamento
  tra `budget-alerts.ts` e `repositories/notifiche.ts`.

Layer 3 — Persistenza: `src/lib/supabase/repositories/notifiche.ts` (nuovo)
- CRUD, query, mark-read, expiration cleanup.

Sezione 4 — Decisioni architetturali specifiche
Decisione 1 — Estrazione da `AppDataContext`.
 - Spostare `checkBudgetNotifications()` e `budgetPercentages` nel `notification-service`.

Decisione 2 — Deduplicazione ibrida.
 - Runtime confronta percentuali e genera avviso solo quando si attraversa una soglia.
 - Persistenza verifica `existsUnreadForEntityLevel()` per evitare duplicati non letti.

Decisione 3 — Metadata obbligatori.
 - Notifica budget include: `level`, `percentage`, `threshold`, `budgetPeriodKey` (YYYY-MM).

Decisione 4 — Escalation replace obbligatoria.
 - Notifica di livello superiore marca come letta la precedente non letta prima di creare la nuova.

Decisione 5 — Secondary hydration.
 - Le notifiche sono caricate asincronamente dopo `READY` con flag `notificationsHydrated`.

Decisione 6 — Cleanup post-hydration.
 - `removeExpired()` e `cleanupReadExpiredBefore()` solo quando `bootstrapState === 'READY'`.

Decisione 7 — Cache notifiche: solo non lette, TTL 1 ora.

Decisione 8 — Migrazione stringhe hardcoded inclusa.
 - Spostare stringhe hardcoded in `src/locales/it.ts`.

Sezione 5 — File da modificare
- `src/lib/supabase/types.ts` — aggiungere `DbNotification`.
- `src/lib/types.ts` — aggiungere `NotificationType`, `AppNotification`, campo `notifications` in `AppState`, flag `notificationsHydrated`.
- `src/lib/supabase/cache.ts` — aggiungere `notifiche` con TTL 1 ora.
- `src/context/AppDataContext.tsx` — rimuovere `checkBudgetNotifications` e `budgetPercentages`, chiamare il service,
  caricamento fail-soft notifiche, aggiungere `notificationsHydrated`, reset al logout.
- `src/lib/budget-alerts.ts` — migrazione stringhe hardcoded.
- `src/locales/it.ts` — aggiungere tutte le stringhe notifiche.

Sezione 6 — File da creare
- `src/lib/notification-service.ts`
- `src/lib/supabase/repositories/notifiche.ts` — funzioni pubbliche: `getAll`, `getUnreadCount`,
  `getUnreadByEntity`, `existsUnreadForEntityLevel`, `markAsRead`, `markAllAsRead`, `create`, `remove`, `removeExpired`, `cleanupReadExpiredBefore`.
- `__tests__/notifiche.repository.test.ts`.

Sezione 7 — Rischi residui
R1 — Accoppiamento cross-domain: `notification-service` deve essere unico punto di coordinamento.
R2 — Dipendenza da DESIGN 013 per notifiche ricorrenza.
R3 — Formattazione valori numerici: debito UI.
