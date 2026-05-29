---
tipo: DESIGN
titolo: "DESIGN 019 — Notifiche Budget e Orchestrazione"
versione: "0.1.0"
data: "2026-05-28"
stato: REVIEWED
sorgente:
  - docs/2-projects/017-DESIGN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
  - docs/2-projects/015-DESIGN_repository-notifiche-notification-service_v0.1.0.md
  - src/lib/supabase/repositories/budget.ts
  - src/lib/supabase/repositories/transazioni.ts
  - src/lib/types.ts
  - src/lib/supabase/types.ts
  - src/context/AppDataContext.tsx
  - src/lib/helpers.ts
  - src/locales/it.ts
  - src/lib/budget-alerts.ts
  - src/lib/notification-service.ts
  - src/lib/supabase/repositories/notifiche.ts
perimetro: "Riallineamento architetturale delle notifiche budget su tre layer con orchestrazione estratta da AppDataContext, persistenza dedicata e bootstrap secondario non bloccante."
---

# DESIGN 019 — Notifiche Budget e Orchestrazione

## Sezione 2 — Contesto e motivazione

Questo design non definisce il sistema notifiche budget da zero. Il codice reale letto mostra che src/lib/budget-alerts.ts esiste già come layer di calcolo, che src/lib/notification-service.ts esiste già come orchestratore parziale e che src/lib/supabase/repositories/notifiche.ts esiste già come layer di persistenza. Inoltre AppDataContext importa già createNotificationService, mantiene notificationsHydrated e invoca processBudgetNotifications dopo il salvataggio di uscite.

La motivazione architetturale è quindi estrarre e consolidare in modo completo la logica di orchestrazione che storicamente apparteneva a AppDataContext, definire il contratto finale dei tre layer e introdurre uno schema database che persista chiavi di localizzazione e metadati sufficienti per deduplicazione, escalation e cleanup senza bloccare il bootstrap core.

## Sezione 3 — Perimetro

In scope:
- Formalizzazione dell'architettura a tre layer per notifiche budget.
- Estrazione della logica di orchestrazione da AppDataContext in notification-service.
- Deduplicazione ibrida runtime più persistenza.
- Metadata obbligatori per le notifiche budget.
- Escalation replace tra livelli warning, critical ed exceeded.
- Secondary hydration delle notifiche separata dal bootstrap core.
- Cleanup notifiche soltanto in stato READY.
- Persistenza della tabella notifiche con policy RLS, indici e trigger documentati.

Fuori scope:
- Riscrittura del motore di calcolo budget-alerts.ts da zero.
- Push native Android o consegna esterna della notifica.
- Notifiche, promemoria o alert relativi al dominio prestiti, mutui e rimborsi restano fuori scope nella versione 1, in allineamento con DESIGN 017 Sezione 3.
- Estensione immediata al confronto mensile.
- Nuova UI notifiche.

## Sezione 4 — Decisioni architetturali

### Decisione 1 — Estrazione da AppDataContext
Testo: la funzione checkBudgetNotifications e lo stato budgetPercentages vengono estratti da AppDataContext.tsx e consolidati in src/lib/notification-service.ts. Il Context invoca il service dopo ogni mutazione che impatta i budget, senza contenere più logica di orchestrazione.

Motivazione: il codice reale mostra che AppDataContext conserva ancora il punto di invocazione e la responsabilità di emettere feedback UX. Separare orchestrazione e state bootstrap mantiene il Context focalizzato su idratazione, cache e coordinamento dei repository.

### Decisione 2 — Deduplicazione ibrida a due livelli
Testo: la deduplicazione usa due livelli obbligatori. A runtime shouldShowBudgetNotification confronta la percentuale precedente con quella attuale tramite la mappa budgetPercentages e segnala solo il passaggio delle soglie configurate BUDGET_ALERT_THRESHOLD_WARNING e BUDGET_ALERT_THRESHOLD_CRITICAL. Le due costanti risiedono in un file di configurazione dedicato del dominio notifiche budget e possono diventare configurabili dall'utente in una versione futura. In persistenza il repository espone existsUnreadForEntityLevel(entityId, type, level) per verificare se esiste già una notifica non letta per la stessa entità e lo stesso livello.

Motivazione: il service reale e il repository reale espongono già questi due meccanismi in forma compatibile. Formalizzarli come coppia obbligatoria evita duplicati sia nella singola sessione sia dopo riavvii o su bootstrap successivi, senza propagare letterali numerici nel contratto architetturale.

### Decisione 3 — Metadata obbligatori alla creazione
Testo: ogni notifica budget include nei metadata i campi level, percentage, threshold e budgetPeriodKey. budgetPeriodKey è obbligatorio e nel design finale usa il formato YYYY-MM per distinguere, ad esempio, un warning di maggio da uno di giugno sullo stesso budget.

Comportamento di fallback per metadata assenti o parziali: se una notifica viene letta dal database con il campo metadata assente, null o privo di uno o più dei quattro campi obbligatori level, percentage, threshold e budgetPeriodKey, l'orchestratore e il renderer devono trattare quella notifica come notifica generica priva di livello semantico specifico. Non deve mai verificarsi un crash runtime, un errore UI visibile o un rendering fallito per metadata mancanti. I campi assenti vengono sostituiti con valori neutri: level viene trattato come info, percentage come null, threshold come null, budgetPeriodKey come non disponibile. Questa specifica protegge da rollback parziali, bug di scrittura e migrazioni future.

Motivazione: il repository reale filtra già sui metadata con contains. Rendere obbligatori questi campi permette query di deduplicazione e cleanup semanticamente corrette senza introdurre colonne specialistiche per ogni caso.

### Decisione 4 — Escalation replace obbligatoria
Testo: quando notification-service genera una notifica di livello superiore per un budget, marca automaticamente come letta la precedente notifica di livello inferiore ancora non letta prima di creare la nuova. Esempio: se esiste un warning non letto e scatta un critical, il warning viene marcato come letto prima di creare il critical.

Motivazione: il service reale usa già getUnreadByEntity e markAllAsRead per sostituire notifiche precedenti. Formalizzare l'escalation replace evita pile di notifiche obsolete e mantiene una sola rappresentazione dello stato più severo.

### Decisione 5 — Notifiche come secondary hydration
Testo: le notifiche non partecipano al bootstrap core. Il nucleo vitale resta auth, preferences, accounts, transactions, categories, budgets e savingsGoals. Le notifiche vengono caricate in modo asincrono e indipendente dopo che il bootstrap raggiunge READY o CACHE-READY. notificationsHydrated resta un flag separato da isDataReady e un errore nel caricamento notifiche non blocca mai il bootstrap core.

Motivazione: AppDataContext mostra già questo pattern con hydrateUnreadNotifications, cache fail-soft e flag notificationsHydrated. Il design lo rende vincolo architetturale esplicito e non comportamento incidentale.

### Decisione 6 — Cleanup solo post-hydration stabile
Testo: removeExpired e cleanupReadExpiredBefore vengono chiamati solo quando bootstrapState è READY, mai durante HYDRATING o CACHE-READY.

Motivazione: il cleanup è un'attività best effort e non deve contendere con bootstrap, cache o stato offline. Spostarlo fuori dalla fase critica evita effetti collaterali su transizioni iniziali e tempi di avvio.

### Decisione 7 — Idempotenza mensile persistita localmente
Testo: ogni notifica budget è identificata da una chiave univoca composta da budgetId, soglia superata e mese di riferimento nel formato YYYY-MM. La soglia superata è espressa tramite BUDGET_ALERT_THRESHOLD_WARNING oppure BUDGET_ALERT_THRESHOLD_CRITICAL. La chiave viene persistita localmente. Prima di inviare una notifica, notification-service verifica se la chiave esiste già; se esiste, la notifica viene scartata silenziosamente. Al cambio di mese, le chiavi del mese precedente vengono invalidate automaticamente.

Motivazione: la deduplicazione su record non letti copre il canale persistito, ma non sostituisce una garanzia di idempotenza locale sul ciclo di emissione. Formalizzare la chiave mensile evita duplicati generati da riavvii, retry o riesecuzioni ravvicinate dell'orchestratore.

### Decisione 8 — Budget mancante: discard silenzioso
Testo: se al momento dell'esecuzione dell'orchestratore il budget referenziato da una notifica pending non esiste più, la notifica viene scartata silenziosamente senza errori runtime. L'orchestratore non entra in stato di errore per l'assenza del budget e prosegue l'elaborazione delle altre entità.

Motivazione: la cancellazione di un budget è un caso legittimo del dominio. Trattarlo come errore infrastrutturale introdurrebbe falsi negativi nel bootstrap secondario e degraderebbe l'affidabilità del service in presenza di dati rimossi dall'utente.

## Sezione 5 — Invariante: nessuna stringa hardcoded

Nessun titolo, messaggio, toast, annuncio screen reader, testo di errore o conferma può essere hardcoded nel codice di budget-alerts.ts, notification-service.ts, repositories/notifiche.ts o AppDataContext.tsx. Tutto deve transitare da src/locales/it.ts.

Questo vale in modo esplicito per:
- messaggi di warning, critical ed exceeded del budget;
- annunci NVDA, TalkBack e VoiceOver relativi alla creazione o sostituzione di notifiche;
- errori repository come loadFailed, createFailed e cleanupFailed;
- messaggi futuri di anomalie di confronto mensile o categoria eliminata, quando il sistema verrà esteso ad altri segnali applicativi.

## Sezione 6 — Schema dei tipi TypeScript

Tipi da aggiungere o riallineare in src/lib/types.ts:

- NotificationLevel: unione letterale con i valori info, warning, critical, exceeded.
- NotificationMetadata: struttura base con level, percentage, threshold e budgetPeriodKey come campi opzionali condivisi.
- BudgetNotificationMetadata: specializzazione di NotificationMetadata con i quattro campi obbligatori per notifiche budget.
- Notification: entità applicativa delle notifiche persistite.
- NotificationHydrationState: tipo esplicito dello stato di idratazione notifiche, usato per modellare il layer secondario senza sovraccaricare isDataReady.

Tipi da aggiungere o riallineare in src/lib/supabase/types.ts:

- DbNotification con colonne coerenti con il nuovo schema notifiche.

Contratti dei tre layer:

Layer 1, src/lib/budget-alerts.ts:
- getBudgetAlertLevel
- getBudgetAlertMessage
- generateBudgetAlerts
- shouldShowBudgetNotification
- getBudgetNotificationTitle

Layer 2, src/lib/notification-service.ts:
- createNotificationService
- reset
- hydrateUnreadNotifications
- cleanupReadyNotifications
- processBudgetNotifications

Layer 3, src/lib/supabase/repositories/notifiche.ts:
- getAll
- getUnreadCount
- getUnreadByEntity
- existsUnreadForEntityLevel
- markAsRead
- markAllAsRead
- create
- remove
- removeExpired
- cleanupReadExpiredBefore

Nota di tracciabilità: questi nomi di funzione esistono realmente nei file letti. Il design ne riallinea la semantica finale, ma non li inventa.

## Sezione 7 — Schema database

Tabella notifiche:

- id: UUID, chiave primaria, default generato automaticamente.
- user_id: UUID, obbligatorio, riferimento a auth.users, RLS attiva.
- tipo: TEXT, obbligatorio.
- entity_id: TEXT, obbligatorio, identificatore dell'entità correlata, per esempio id del budget.
- livello: TEXT, obbligatorio, valori ammessi info, warning, critical, exceeded.
- titolo_key: TEXT, obbligatorio, chiave di localizzazione del titolo.
- messaggio_key: TEXT, obbligatorio, chiave di localizzazione del messaggio.
- metadata: JSONB, facoltativo, contenente level, percentage, threshold e budgetPeriodKey.
- letta: BOOLEAN, obbligatorio, default false.
- scadenza: TIMESTAMPTZ, facoltativo.
- created_at: TIMESTAMPTZ, obbligatorio, default now().

Vincoli e note di riallineamento:

- titolo_key e messaggio_key sostituiscono la persistenza di testo localizzato lato record; il rendering finale ricava il testo da src/locales/it.ts.
- livello replica il dato semantico principale anche a colonna per consentire indici e query più efficienti, senza rinunciare al metadata JSONB.
- budgetPeriodKey in metadata è obbligatorio per notifiche budget.
- Le soglie di attivazione warning e critical referenziano BUDGET_ALERT_THRESHOLD_WARNING e BUDGET_ALERT_THRESHOLD_CRITICAL, definite in un file di configurazione dedicato e predisposte a futura configurabilità utente.

Indici obbligatori:

- indice su user_id.
- indice composito su user_id, tipo, livello.
- indice su entity_id.
- indice parziale su notifiche non lette per user_id ed entity_id.
- indice GIN su metadata per query contains sui campi level e budgetPeriodKey.

Trigger e policy:

- trigger updated_at non richiesto nella versione minima, perché la tabella non prevede updated_at. La scelta è intenzionale e motivata dall'architettura del dominio. La tabella notifiche è append-heavy: le notifiche vengono create e poi lette, con l'unica mutazione possibile rappresentata dalla marcatura come letta tramite markAsRead. Questa singola mutazione non richiede auditing storico completo. Il campo created_at è sufficiente per il ciclo di vita della notifica. Aggiungere updated_at per simmetria con le tabelle mutabili del progetto creerebbe l'impressione errata che le notifiche siano modificabili in modo generico, il che contraddirebbe il contratto architetturale del service.
- policy RLS SELECT, INSERT, UPDATE, DELETE limitate a user_id uguale a auth.uid().

## Sezione 8 — File da creare e file da modificare

Target architetturali già esistenti nel codice reale ma da riallineare al design:

- src/lib/notification-service.ts — modifica dell'orchestratore esistente per completare estrazione, deduplicazione, escalation replace, idempotenza mensile locale, scarto silenzioso dei budget mancanti e lifecycle conforme a READY-only cleanup.
- src/lib/supabase/repositories/notifiche.ts — modifica del repository esistente per aderire allo schema persistito finale basato su chiavi di localizzazione, livello e metadata obbligatori.
- __tests__/notification-service.test.ts — aggiornamento della suite esistente per coprire secondary hydration, deduplicazione, idempotenza mensile, budget mancanti ed escalation.
- __tests__/notifiche.repository.test.ts — aggiornamento della suite esistente per CRUD, query, unread count e cleanup coerente con il nuovo schema.

File da creare:

- docs/6-sql/P55-notifiche.sql — nuova migrazione SQL per tabella notifiche, indici e policy RLS.

File da modificare:

- src/context/AppDataContext.tsx — rimozione definitiva della logica residua di orchestrazione budget dal Context, mantenendo solo invocazione del service, flag notificationsHydrated separato e comportamento fail-soft.
- src/lib/types.ts — aggiunta o riallineamento di Notification, NotificationMetadata, BudgetNotificationMetadata, NotificationLevel e NotificationHydrationState.
- src/lib/supabase/types.ts — aggiunta o riallineamento di DbNotification.
- src/locales/it.ts — aggiunta di tutte le chiavi titolo e messaggio richieste dal sistema notifiche budget.

## Sezione 9 — Scenari di test obbligatori

1. Deduplicazione runtime: una stessa soglia attraversata una sola volta nella sessione produce una sola notifica.
2. Deduplicazione persistenza: se esiste una notifica non letta per entità e livello, il service non ne crea una duplicata.
3. Idempotenza mensile locale: se la chiave composta da budgetId, soglia superata e YYYY-MM è già presente nello store locale, il service scarta silenziosamente la notifica.
4. Invalidazione cambio mese: al passaggio a un nuovo mese le chiavi di idempotenza del mese precedente vengono invalidate automaticamente.
5. Escalation replace: warning non letto sostituito da critical con marcatura automatica del warning come letto.
6. Secondary hydration non blocca bootstrap: errore nel caricamento notifiche non altera isDataReady del bootstrap core.
7. Cleanup solo in stato READY: removeExpired e cleanupReadExpiredBefore non vengono invocati in HYDRATING o CACHE-READY.
8. Budget mancante: se il budget referenziato non esiste più, la notifica pending viene scartata senza errori runtime e senza portare il service in stato di errore.
9. budgetPeriodKey separa mesi diversi: due warning sullo stesso budget ma in mesi diversi restano distinguibili.
10. Metadata obbligatori: ogni notifica budget contiene level, percentage, threshold e budgetPeriodKey.
11. Isolamento utente: repository e policy RLS impediscono accesso a notifiche di altri utenti.
12. Mark all read filtrato per entità: l'escalation non marca come lette notifiche di budget diversi.
13. Persistenza con chiavi di localizzazione: il record salva titolo_key e messaggio_key, non testo renderizzato finale.

## Sezione 10 — Dipendenze da altri design

Precondizioni obbligatorie:

- Disponibilità di budget-alerts.ts come layer di calcolo puro esistente.
- Disponibilità del repository notifiche e del service notifiche già presenti nel codice reale.
- Disponibilità di src/locales/it.ts per tutte le chiavi di localizzazione.

Indipendenze confermate:

- Il sistema notifiche budget non richiede dipendenze cross-domain nella versione corrente.
- Il bootstrap core resta indipendente dal successo dell'idratazione notifiche.

Confini con altri design:

- È coerente con l'architettura a tre layer già espressa in docs/2-projects/015-DESIGN_repository-notifiche-notification-service_v0.1.0.md e ne porta a termine il riallineamento sul codice reale.
- Predispone estensioni per confronto mensile anomalo senza introdurre oggi accoppiamenti cross-domain.
- Non modifica il comportamento del confronto mese su mese definito da DESIGN 018, ma ne consente un riuso futuro come sorgente semantica.

## Sezione 11 — Debiti tecnici aperti

- DT-019-01 — Notification batching e accessibility throttling. Futuro batching di notifiche ravvicinate, debounce per evitare spam, throttling degli annunci per screen reader come NVDA e TalkBack per ridurre il carico vocale e gestione della priorità delle announcement parlate. Questo debito non blocca la transizione a REVIEWED, ma viene tracciato formalmente per la roadmap futura. Priorità: media. Stato: aperto.
- DT-019-02 — Refactoring futuro di src/lib/budget-alerts.ts per produrre dati semantici grezzi invece di testo formattato finale. Priorità: bassa. Stato: aperto.
- DT-019-03 — Notifiche push native su Android con canale di consegna separato dal motore interno. Priorità: media. Stato: aperto.
- DT-019-04 — Gestione multi-dispositivo e sincronizzazione dello stato letto tra sessioni diverse. Priorità: bassa. Stato: aperto.