---
titolo: PLAN 019 - Notifiche Budget e Orchestrazione
versione: 0.1.0
data: 2026-05-29
stato: REVIEWED
design_riferimento: docs/2-projects/019-DESIGN_notifiche-budget-orchestrazione_v0.1.0.md
autore: Agent-Orchestrator
dipendenze: PLAN 015, PLAN 017
---

# PLAN 019 - Notifiche Budget e Orchestrazione

## 1. Obiettivo del Piano

Riallineare il dominio notifiche budget ai tre layer definiti dal design, estraendo l'orchestrazione da AppDataContext, introducendo soglie tramite costanti nominate, deduplicazione ibrida e idempotenza mensile persistita localmente senza bloccare il bootstrap core.

## 2. Perimetro (Scope)

File sorgente da creare o modificare:
- configurazione soglie notifiche budget
- tipi client notifiche
- tipi Supabase notifiche
- servizio di orchestrazione notifiche
- repository notifiche
- context dati applicativo
- registro di localizzazione italiano
- docs/6-sql/P55-notifiche.sql
- __tests__/notification-service.test.ts
- __tests__/notifiche.repository.test.ts
- __tests__/AppDataContext.spec.ts

Fuori perimetro:
- riscrittura completa di budget-alerts.ts. Il file esistente può essere modificato solo per importare le costanti centralizzate da budget-notification-config.ts al fine di rimuovere i valori numerici hardcoded. Tutta la logica di nuova orchestrazione delle notifiche è delegata esclusivamente a notification-service.ts.
- nuova UI notifiche o canali push nativi
- notifiche relative al dominio prestiti, mutui o rimborsi
- NOTA DI ALLINEAMENTO CON DESIGN 017 (versione 1): Le notifiche per le rate dei prestiti in scadenza sono escluse dalla versione 1 di questa funzionalita, in coerenza con il perimetro dichiarato in DESIGN 017 che esclude i promemoria rate dallo scope v1. Questa voce e mantenuta come riferimento per la roadmap futura ma non deve essere implementata nella versione corrente. L'agente che implementa questo DESIGN deve ignorare questa sezione fino a esplicita revisione del perimetro.
- integrazione immediata con il confronto mensile come sorgente attiva di eventi

## 3. Prerequisiti Bloccanti

- PLAN 015 completato, perche 019 riallinea un'architettura notifiche gia esistente nel codice reale.
- PLAN 017 completato per garantire la disponibilita di roundCurrency ed extractDatePart nelle helper condivise del progetto, riusate dal servizio per normalizzare percentage e costruire budgetPeriodKey senza ridefinizioni.
- Verifica infrastrutturale obbligatoria: la migrazione P55 deve essere prodotta prima di riallineare repository e test al nuovo schema persistito.

## 4. Architettura e Decisioni Chiave

- Decisione 1 - AppDataContext conserva solo invocazione e hydration secondaria. Conseguenza pratica: la logica di orchestrazione budget esce definitivamente dal context.
- Decisione 2 - Le soglie warning e critical vivono in costanti nominate. Conseguenza pratica: nessun task puo introdurre letterali numerici sparsi nel service o nei test; BUDGET_ALERT_THRESHOLD_WARNING [SOGLIA CONFIGURABILE - valore default: 75% - definire come costante nominata in src/lib/budget-notification-config.ts o equivalente. Non hardcodare nel corpo della funzione.] e BUDGET_ALERT_THRESHOLD_CRITICAL [SOGLIA CONFIGURABILE - valore default: 90% - definire come costante nominata in src/lib/budget-notification-config.ts o equivalente. Non hardcodare nel corpo della funzione.] sono l'unico punto ammesso di definizione.
- Decisione 3 - La deduplicazione e un blocco dedicato a due livelli. Conseguenza pratica: runtime state e repository devono cooperare e avere test separati.
  
	Deduplicazione notifiche:
	il sistema deve tenere in memoria locale,
	per la durata della sessione attiva,
	un registro degli eventi di notifica già emessi.
	Il registro è indicizzato per tipo di notifica
	e identificatore del budget o della categoria.
	Prima di emettere una notifica, l'orchestratore
	verifica se un evento identico è già presente
	nel registro della sessione corrente.
	Se presente, la notifica non viene emessa nuovamente.
	Il registro si azzera alla chiusura dell'app.
	Questo meccanismo vale per le notifiche di soglia
	budget. Non si applica alle notifiche di errore.
- Decisione 4 - budgetPeriodKey e una chiave mensile persistita localmente. Conseguenza pratica: il service deve invalidare il mese precedente e scartare duplicati locali.
- Decisione 5 - Metadata obbligatori e fallback robusto. Conseguenza pratica: renderer e orchestratore non devono crashare se metadata e null o parziale.
- Decisione 6 - Cleanup solo in READY. Conseguenza pratica: removeExpired e cleanupReadExpiredBefore non possono partire durante HYDRATING o CACHE-READY.
- Decisione 7 - PLAN 019 riusa roundCurrency ed extractDatePart di PLAN 017. Conseguenza pratica: percentage e budgetPeriodKey devono dipendere da helpers.ts senza ridefinizione locale.

## 5. Task Atomici

### T1
- Azione: Creare un file di configurazione dedicato che esporti BUDGET_ALERT_THRESHOLD_WARNING e BUDGET_ALERT_THRESHOLD_CRITICAL come uniche soglie ammesse dal dominio notifiche budget.
- File target: src/lib/budget-notification-config.ts
- Dipende da: nessuno
- Metrica di successo: notification-service, budget-alerts e i test possono importare le soglie senza usare valori letterali hardcoded.
- Note operative: il file deve essere predisposto a futura configurabilita utente ma in v1 espone costanti statiche; la soglia di superamento budget [SOGLIA CONFIGURABILE - valore default: 100% - definire come costante nominata in src/lib/budget-notification-config.ts o equivalente. Non hardcodare nel corpo della funzione.] non deve essere hardcodata fuori da src/lib/budget-notification-config.ts.

### T2
- Azione: Riallineare NotificationLevel, NotificationMetadata, BudgetNotificationMetadata, Notification e NotificationHydrationState insieme a DbNotification sullo schema finale del design.
- File target: src/lib/types.ts, src/lib/supabase/types.ts
- Dipende da: T1
- Metrica di successo: npx tsc --noEmit compila tipi client e DbNotification coerenti con livello, chiavi di localizzazione e metadata JSONB.
- Note operative: metadata deve supportare fallback robusto per level, percentage, threshold e budgetPeriodKey mancanti.

### T3
- Azione: Riallineare il repository notifiche con existsUnreadForEntityLevel, query unread per entity e supporto a titolo_key, messaggio_key, livello e metadata obbligatori.
- File target: src/lib/supabase/repositories/notifiche.ts
- Dipende da: T1, T2, T7
- Metrica di successo: __tests__/notifiche.repository.test.ts dimostra deduplicazione persistita, unread count, cleanup e isolamento utente sul nuovo schema.
- Note operative: il repository deve trattare metadata parziali come caso tollerato e non come crash.

### T4
- Azione: Completare notification-service con deduplicazione ibrida runtime piu persistenza, escalation replace, idempotenza mensile locale, cleanup solo in READY e scarto silenzioso dei budget mancanti.
- File target: src/lib/notification-service.ts
- Dipende da: T1, T2, T3, PLAN 017
- Metrica di successo: __tests__/notification-service.test.ts copre deduplicazione runtime, escalation, invalidazione cambio mese, missing budget e secondary hydration fail-soft.
- Note operative: il task deve usare roundCurrency di PLAN 017 per normalizzare percentage e extractDatePart di PLAN 017 per derivare in modo coerente il budgetPeriodKey mensile senza ridefinizioni locali. Deduplicazione notifiche: prima di generare una notifica, l'orchestratore verifica se una notifica dello stesso tipo e per lo stesso budget e gia stata generata nel mese corrente. La verifica avviene tramite controllo nello stato locale, non nel database. Se una notifica identica e gia presente nello stato, la nuova generazione viene soppressa silenziosamente senza errore. La chiave di deduplicazione e composta da tipo_notifica piu id_budget piu mese_anno in formato YYYY-MM. Questa logica va implementata come funzione pura e testabile separatamente dal resto dell'orchestratore.

### T5
- Azione: Rimuovere definitivamente la logica residua di orchestrazione budget da AppDataContext mantenendo solo invocazione del service, notificationsHydrated separato e comportamento fail-soft.
- File target: src/context/AppDataContext.tsx
- Dipende da: T4
- Metrica di successo: __tests__/AppDataContext.spec.ts dimostra che il bootstrap core resta indipendente dagli errori notifiche e che il cleanup non parte prima di READY.
- Note operative: il context non deve contenere piu stato budgetPercentages o logica checkBudgetNotifications duplicata.

### T6
- Azione: Aggiungere tutte le chiavi di localizzazione per titoli, messaggi, errori e annunci accessibilita delle notifiche budget.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per warning, critical, exceeded, loadFailed, createFailed e cleanupFailed.
- Note operative: nessun testo renderizzato finale deve essere persistito nel record notifiche.

### T7
- Azione: Produrre la migrazione P55 della tabella notifiche con indici, policy RLS, livello esplicito e metadata JSONB coerenti con il design.
- File target: docs/6-sql/P55-notifiche.sql
- Dipende da: T1, T2
- Metrica di successo: P55 documenta titolo_key, messaggio_key, livello, metadata, indici richiesti e policy RLS del dominio.
- Note operative: non introdurre updated_at; il file deve motivare la scelta append-heavy gia fissata dal design. Stato completamento: P55 prodotto, committato, eseguito in Supabase con successo in data 2026-06-25. La tabella notifiche esiste nello schema del database come previsto. Il file e' disponibile in docs/6-sql/P55-notifiche.sql.

### T8
- Azione: Aggiornare le suite notification-service, notifiche.repository e AppDataContext per coprire il contratto finale del design 019.
- File target: __tests__/notification-service.test.ts, __tests__/notifiche.repository.test.ts, __tests__/AppDataContext.spec.ts
- Dipende da: T1, T3, T4, T5, PLAN 017
- Metrica di successo: le suite coprono deduplicazione ibrida, costanti nominate, budgetPeriodKey, metadata obbligatori, escalation replace e bootstrap secondario non bloccante.
- Note operative: aggiungere una verifica esplicita che le soglie arrivino da costanti nominate e non da valori letterali nel service.

### Casi limite

Caso limite - budget eliminato con notifica pendente: Se un budget viene eliminato mentre e presente nello stato locale una notifica pendente riferita a quel budget, l'orchestratore deve rimuovere la notifica pendente dallo stato al momento della rilevazione dell'eliminazione del budget. Nessuna notifica riferita a un budget inesistente deve essere mostrata all'utente. La rimozione e silenziosa e non genera messaggi di errore.

## 6. Test Obbligatori

- File spec: __tests__/notification-service.test.ts | Scenario: deduplicazione runtime genera una sola notifica per la stessa soglia nella stessa sessione. | Tipo: unit
- File spec: __tests__/notification-service.test.ts | Scenario: se la chiave mensile locale esiste gia, la notifica viene scartata silenziosamente. | Tipo: unit
- File spec: __tests__/notification-service.test.ts | Scenario: al cambio mese le chiavi di idempotenza del mese precedente vengono invalidate. | Tipo: unit
- File spec: __tests__/notification-service.test.ts | Scenario: escalation replace marca come letta la notifica inferiore e crea solo quella piu severa. | Tipo: unit
- File spec: __tests__/notification-service.test.ts | Scenario: un budget mancante viene scartato senza errori runtime. | Tipo: unit
- File spec: __tests__/notification-service.test.ts | Scenario: percentage e budgetPeriodKey vengono normalizzati riusando helper da PLAN 017. | Tipo: unit
- File spec: __tests__/notifiche.repository.test.ts | Scenario: existsUnreadForEntityLevel evita la creazione di duplicati persistiti. | Tipo: integration
- File spec: __tests__/notifiche.repository.test.ts | Scenario: metadata obbligatori sono salvati con titolo_key e messaggio_key invece del testo renderizzato. | Tipo: integration
- File spec: __tests__/notifiche.repository.test.ts | Scenario: isolamento utente e cleanup rispettano RLS e filtri di entita. | Tipo: integration
- File spec: __tests__/AppDataContext.spec.ts | Scenario: errore nella hydration notifiche non altera isDataReady del bootstrap core. | Tipo: integration
- File spec: __tests__/AppDataContext.spec.ts | Scenario: cleanup notifiche parte solo quando bootstrapState e READY. | Tipo: integration

## 7. Gate di Chiusura

- G-019-1 | Verifica: soglie e costanti nominate sono centralizzate e non compaiono come letterali sparsi. | Comando: grep -RIn "0\.75\|0\.90\|0\.80\|75\|80\|90\|100" src/lib src/context __tests__ | grep -v "budget-notification-config.ts" — Esito atteso: 0 occorrenze di soglie numeriche hardcoded fuori dal file di configurazione centrale. | Stato iniziale: OPEN
- G-019-2 | Verifica: repository notifiche aderisce allo schema persistito finale con deduplicazione per entita/livello. | Comando: npx jest __tests__/notifiche.repository.test.ts --runInBand | Stato iniziale: OPEN
- G-019-3 | Verifica: notification-service copre deduplicazione ibrida, escalation replace, idempotenza mensile e budget mancanti. | Comando: npx jest __tests__/notification-service.test.ts --runInBand | Stato iniziale: OPEN
- G-019-4 | Verifica: AppDataContext mantiene secondary hydration fail-soft e cleanup solo in READY. | Comando: npx jest __tests__/AppDataContext.spec.ts --runInBand | Stato iniziale: OPEN
- G-019-5 | Verifica: roundCurrency ed extractDatePart di PLAN 017 sono riusate da 019 senza ridefinizione locale. | Comando: verifica manuale sul servizio notifiche e sulle helper condivise | Stato iniziale: OPEN
- G-019-6 | Verifica: la migrazione P55 documenta correttamente tabella, indici, metadata JSONB e assenza di updated_at. | Comando: verifica manuale su docs/6-sql/P55-notifiche.sql | Stato iniziale: CLOSED — chiuso il 2026-06-25, P55 eseguito in Supabase con successo.

## 8. Rollback

- configurazione soglie notifiche budget: eliminare il file se il riallineamento notifiche viene annullato.
- tipi notifiche client e Supabase: ripristinare il modello precedente al riallineamento.
- repository notifiche: ripristinare la versione pre-019 se il nuovo schema non supera i gate.
- servizio di orchestrazione notifiche: ripristinare la versione parziale precedente se deduplicazione o idempotenza non risultano stabili.
- context dati applicativo: ripristinare il wiring notifiche precedente se il bootstrap secondario regredisce.
- registro di localizzazione italiano: rimuovere le chiavi introdotte dal piano 019.
- docs/6-sql/P55-notifiche.sql: rimuovere la migrazione se il blocco viene sospeso.
- __tests__/notification-service.test.ts, __tests__/notifiche.repository.test.ts, __tests__/AppDataContext.spec.ts: rimuovere o ripristinare le suite al contratto precedente.

## 9. Riferimenti

- docs/2-projects/019-DESIGN_notifiche-budget-orchestrazione_v0.1.0.md
- docs/3-coding-plans/015-PLAN_repository-notifiche-notification-service_v0.1.0.md
- docs/3-coding-plans/017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
- configurazione soglie notifiche budget
- servizio di orchestrazione notifiche
- repository notifiche
- context dati applicativo
- docs/6-sql/P55-notifiche.sql
- __tests__/notification-service.test.ts
- __tests__/notifiche.repository.test.ts