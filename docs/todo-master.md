## 1. Metadata e Context Header
 
 - **Project Name:** ZecchinoReact
 - **Version:** 0.18.5
 - **Owner:** donny-81
 - **Core Technology Stack:** React Native 0.82.1, React 19.1.1, react-native-windows ^0.82.5, Supabase JS ^2.105.4, TypeScript
 - **Environment Sync:** Local
 - **Ultimo Agente Attivo:** Antigravity, 2026-06-30
 - **Blocco in Carico:** Pianificazione Test Sessione E2
 - **Context Refresh Threshold:** Se la sessione supera i 40 scambi di prompt o i 50.000 token, l'agente deve eseguire un riassunto dello Snapshot di Ripresa e riavviare la sessione per svuotare la memoria cache. Questo è un reset tecnico della memoria: l'agente riprende il lavoro dal punto esatto in cui si trovava senza eseguire il protocollo di apertura sessione (sezione 2b). Il protocollo 2b si applica esclusivamente all'avvio di una nuova sessione di lavoro umana, ovvero quando l'architetto riprende il progetto dopo un'interruzione.
 
 ### Stato Globale Corrente
 
 - **Active Phase:** P0/P1/P2 completate. DESIGN 022 e 021 implementati (Fase 1 completata).
 - **Active Block:** Pianificazione Test Sessione E2.
 - **Last Updated:** 2026-06-30
 - **Pending Plans:**
   - **Pianificazione Test Sessione E2 (Blocco 2 - Parte 1) — COMPLETATA** (coding plan `docs/3-coding-plans/025-PLAN_test-sessione-E2-blocco2_v1.0.0.md` e todo list `docs/4-todo-lists/025-TODO_test-sessione-E2-blocco2_v1.0.0.md` creati il 2026-06-30).
   - **Sessione E4 Test Codifica (Blocco 3) — IMPLEMENTATA** (implementati ed eseguiti con successo tutti i 116 test per i 20 moduli in data 2026-06-30).
   - **Pianificazione Test Sessione E4 (Blocco 3) — COMPLETATA** (coding plan `docs/3-coding-plans/024-PLAN_test-sessione-E4-blocco3_v1.0.0.md` e todo list `docs/4-todo-lists/024-TODO_test-sessione-E4-blocco3_v1.0.0.md` creati il 2026-06-30).
   - **Sessione E0 Bugfix — COMPLETATA** (implementati i 7 bugfix con regression test in data 2026-06-29, versione bump 0.18.3).
   - **Pianificazione Bugfix (SESSIONE E0) — COMPLETATA** (coding plan `docs/3-coding-plans/023-PLAN_bugfix-sessione-E0_v0.18.2.md` e todo list `docs/4-todo-lists/023-TODO_bugfix-sessione-E0_v0.18.2.md` creati il 2026-06-29).
   - **Analisi Copertura Test Completa (SESSIONE D) — COMPLETATA** (report `docs/1-reports/REPORT-analisi-copertura-test-completa_v1.0.0.md` creato il 2026-06-28).
   - **Piano di test moduli core (Fase A e B) — COMPLETATO E IMPLEMENTATO** (report `docs/1-reports/REPORT-piano-test-moduli-core_v1.0.0.md` aggiornato il 2026-06-27).
   - **PLAN 022 COMPLETATO** (release 0.17.0, test coverage v0.18.0) — Refactoring del Sound System in ambiente nativo completato e validato.
   - **PLAN 020 COMPLETATO** —
     `docs/3-coding-plans/020-PLAN_icone-colori-design-system_v0.2.0.md`
     e `docs/4-todo-lists/020-TODO_icone-colori-design-system_v0.2.0.md` in stato DONE. Centralizzazione design tokens implementata e testata.
  - **PLAN 007 COMPLETATO** (release 0.2.0) —
    `docs/3-coding-plans/007-PLAN_async-cache-hydration_v0.1.0.md`
    e `docs/4-todo-lists/007-TODO_async-cache-hydration_v0.1.0.md` in stato
    DONE. Implementazione T1-T8 su `src/context/AppDataContext.tsx` +
    estrazione modulo isolato `src/context/app-data-cache.ts` per
    testabilità. Bug N9 risolto. State machine bootstrap a 6 stati
    introdotta. Generation counter contro hydration concorrenti.
    writeCache fail-soft. 7 test eseguibili Bug N9/INV1/INV2/INV5 verdi;
    16 it.todo per scenari Provider-mount (richiedono
    `@testing-library/react` o equivalente, fuori scope).

### Mappa Documentale

- **Design Docs:** docs/2-projects/
- **Coding Plans:** docs/3-coding-plans/
- **Todo per Piano:** docs/4-todo-lists/
- **Test Suites:** __tests__/
- **Architecture Decisions:** docs/architettura.md

---

## 2. Snapshot di Ripresa (Session Snapshot)

> Questa sezione viene aggiornata al termine di ogni sessione di lavoro.
> Permette la ripresa immediata senza esplorazione manuale dello stato.

- **Last Completed Task:** Pianificazione Test Sessione E2 (Blocco 2 - Parte 1).
- **Last Validated Block:** Pianificazione Test Sessione E2 (2026-06-30, Antigravity).
- **Files Modified But Not Validated:** Nessuno
 - **Open Threads:**
  - AN-03: `oklch colori` — da verificare per compatibilità Android (da DESIGN 020)
  - DD-01: `patches/netinfo+12.0.1.patch` — patch orfana per versione v12 (v11.x in uso)
 - Security: aggiornare TODO e checklist per i criteri di sicurezza introdotti in DESIGN 010 (CA-2: atomicità update PIN) e DESIGN 012 (CA-4: rilascio `inProgress` tramite `finally`). Aggiungere task unit test e validazione automazione per CA-2/CA-4 in `docs/4-todo-lists/`.
  - **Next Action:** Codifica dei test per il Blocco 2 (Parte 1).

> Nota sessione pianificazione test 2026-06-30 (Antigravity):
> Completata la pianificazione della SESSIONE E2: redatti il coding plan `docs/3-coding-plans/025-PLAN_test-sessione-E2-blocco2_v1.0.0.md` e la todo list `docs/4-todo-lists/025-TODO_test-sessione-E2-blocco2_v1.0.0.md` per i 7 moduli del Blocco 2 (Contesti Base e Hook, Parte 1), per un totale di 38 nuovi test unitari pianificati in stato PENDING.

> Nota sessione coding test 2026-06-30 (Antigravity):
> Completata l'implementazione della SESSIONE E4: aggiunti tutti i 116 test unitari ed integrativi per i 20 moduli del Blocco 3 (Persistenza e Librerie).
> Tutti i test passano con successo in Jest e non si rilevano errori di compilazione TS.


> Nota sessione coding bugfix 2026-06-29 (Antigravity):
> Completata l'implementazione della SESSIONE E0: risolti chirurgicamente i 7 bug pianificati con i relativi regression test in Jest.
> Tutti i 341 test passano e npx tsc non rileva errori. package.json avanzato alla versione 0.18.3.

> Nota sessione analisi 2026-06-28 (Antigravity):
> Completata la SESSIONE D: eseguito il censimento e l'analisi completa della copertura dei test mancanti per 39 moduli del progetto.
> Redatto il report dettagliato in `docs/1-reports/REPORT-analisi-copertura-test-completa_v1.0.0.md` censendo 324 test necessari e individuando 7 potenziali bug (tra cui BUG-1 critico e BUG-2 alto).
> Proposto piano di rilascio diviso in 4 sessioni (E1, E2, E3, E4) per implementare la copertura completa.

> Nota sessione coding 2026-06-28 (Antigravity):
> Completata la SESSIONE C: implementati i 12 test unitari todo in `__tests__/AppDataContext.spec.ts` coprendo robustezza dello stato, concorrenza e resilienza della cache.
> Esposta la transizione `transitionTo` in `AppDataContextValue` per abilitare la testabilità controllata dello stato.
> Risolti errori tipi e allineato `process` con `globalThis.process` per la compilazione TypeScript.
> Tutti i 321 test del progetto sono passanti.

> Nota sessione orchestrazione 2026-05-29:
> Creati i sei documenti di pianificazione richiesti:
> `docs/3-coding-plans/017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md`,
> `docs/4-todo-lists/017-TODO_prestiti-mutui-simulazione-finanziaria_v0.1.0.md`,
> `docs/3-coding-plans/018-PLAN_confronto-mese-su-mese-categoria_v0.1.0.md`,
> `docs/4-todo-lists/018-TODO_confronto-mese-su-mese-categoria_v0.1.0.md`,
> `docs/3-coding-plans/019-PLAN_notifiche-budget-orchestrazione_v0.1.0.md` e
> `docs/4-todo-lists/019-TODO_notifiche-budget-orchestrazione_v0.1.0.md`.
> Il Ciclo-G e stato superato con esito PASS; il controllo G8 e stato corretto e richiuso nello stesso ciclo.
> Review dei test esistenti eseguita: copertura assente per 017 e 018, copertura parziale ma da riallineare per 019.
> Prossimo passo: review donny-81 e autorizzazione implementazione 017-019.

> Nota sessione review 2026-05-29:
> Review documentale completata su DESIGN 017, 018 e 019.
> Anomalie rilevate e corrette. Tutti e tre i documenti portati
> in stato REVIEWED. Titoli definitivi confermati:
> 017 = Prestiti, Mutui e Simulazione Finanziaria;
> 018 = Confronto Mese su Mese per Categoria;
> 019 = Notifiche Budget e Orchestrazione.
> Prossimo passo: coding plan e todo list per 017, 018 e 019.
> Creati i nuovi documenti `docs/2-projects/017-DESIGN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md`,
> `docs/2-projects/018-DESIGN_confronto-mese-su-mese-categoria_v0.1.0.md` e
> `docs/2-projects/019-DESIGN_notifiche-budget-orchestrazione_v0.1.0.md`.
> CHANGELOG e SPARK-START sincronizzati. Prossimo passo: coding plan e todo list per 017-019.

> Nota sessione coding 2026-05-28:
> Completato il blocco 013 — Repository Ricorrenze. Gate eseguiti con esito PASSED: `npm test -- __tests__/ricorrenze.repository.test.ts --runInBand`, `npm test -- __tests__/AppDataContext.spec.ts --runInBand`, `npx tsc --noEmit`. Aggiornati CHANGELOG, README, architettura e API. Prossimo passo: blocco 014.

> Nota sessione coding 2026-05-28:
> Completato il blocco 014 — Repository Tag e Transazioni-Tag. Gate eseguiti con esito PASSED: `npm test -- __tests__/tag.repository.test.ts --runInBand`, `npm test -- __tests__/transazioni-tag.repository.test.ts --runInBand`, `npm test -- __tests__/AppDataContext.spec.ts --runInBand`, `npx tsc --noEmit`. Review finale PASS. Aggiornati CHANGELOG, README, architettura, API e SQL P50. Prossimo passo: blocco 015.

> Nota sessione coding 2026-05-28:
> Completato il blocco 015 — Repository Notifiche e Notification Service. Gate eseguiti con esito PASSED: `npm test -- __tests__/notifiche.repository.test.ts --runInBand`, `npm test -- __tests__/notification-service.test.ts --runInBand`, `npm test -- __tests__/AppDataContext.spec.ts --runInBand`, `npx tsc --noEmit`. Review finale PASS. Aggiornati CHANGELOG, README, architettura, API e SQL P51. Prossimo passo: blocco 016.

> Nota sessione coding 2026-05-28:
> Completato il blocco 016 — Allegati Transazioni. Gate eseguiti con esito PASSED: `npm test -- __tests__/allegati.storage.test.ts --runInBand`, `npm test -- __tests__/allegati.repository.test.ts --runInBand`, `npx tsc --noEmit`. Review finale PASS dopo hardening del boundary filesystem locale. Aggiornati CHANGELOG, README, architettura e API. Prossimo passo: blocco 016-bis.

> Nota sessione coding 2026-05-28:
> Completato il blocco 016-bis — Cleanup Orfani Storage. Gate eseguiti con esito PASSED: `npm test -- __tests__/storage-cleanup-service.test.ts --runInBand`, `npm test -- __tests__/AuthContext.pin.test.tsx __tests__/AppDataContext.spec.ts --runInBand`, `npx tsc --noEmit`. Review finale PASS dopo hardening della guardia/throttle per utente e gestione fail-soft dei file senza timestamp. Prossimo passo: blocco 016-ter.

> Nota sessione coding 2026-05-28:
> Completato il blocco 016-ter — Magic Bytes Validation. Gate eseguiti con esito PASSED: `npm test -- __tests__/magic-bytes-validation.test.ts --runInBand`, `npm test -- __tests__/allegati.storage.test.ts --runInBand`, `npm test -- __tests__/allegati.repository.test.ts --runInBand`, `npx tsc --noEmit`. Review finale PASS. Sequenza 013-016-ter chiusa lato codice, test e documentazione; nessuna operazione git eseguita per policy.

> Nota sessione aggiornamento docs 2026-05-28:
> Registrati nel registro di stato i sei nuovi design approvati (013–016-ter). Aggiunti otto debiti tecnici nella sezione 7.1 (DT-016-01, DT-016-02, DT-016-bis-01, DT-016-bis-02, DT-016-bis-03, DT-016-ter-01, DT-016-ter-02, DT-016-ter-03). Snapshot di ripresa allineato. CHANGELOG e SPARK-START aggiornati. Prossimo passo: coding plan e todo 013–016-ter.

> Nota sessione orchestrazione 2026-05-28:
> Creati 12 file di pianificazione (6 coding plan
> + 6 todo list) per i DESIGN 013–016-ter.
> Tutti in stato DRAFT/PENDING su main.
> Ciclo di revisione globale CICLO-G superato.
> CHANGELOG e SPARK-START aggiornati.
> Prossimo passo: review donny-81 e
> autorizzazione implementazione.

> **Nota sessione stesura TODO 007 — 2026-05-23:** Creato
> `docs/4-todo-lists/007-TODO_async-cache-hydration_v0.1.0.md`
> (stato PENDING) derivato da PLAN 007 v0.1.0. Struttura: 8 sezioni
> (Stato, Gate bloccante, Stato task, Task atomici T1-T8, Note operative,
> Log validazione, Gate chiusura G1-G5, Riferimenti). Convalidato in
> Fase 2 (9 criteri) e Fase 3 (6 criteri) con esito positivo al primo
> tentativo. Nessuna modifica al codice sorgente. Prossimo passo: review
> PLAN 007 e TODO 007 e autorizzazione all'implementazione.

> **Nota sessione stesura PLAN 007 — 2026-05-23:** Redatto
> `docs/3-coding-plans/007-PLAN_async-cache-hydration_v0.1.0.md`
> (stato DRAFT) a partire da DESIGN 007. Copre i sei stati della
> state machine bootstrap, le cinque invarianti (matrice in §5)
> e il contratto di concorrenza `refreshAll` con generation counter.
> Perimetro vincolato a `src/context/AppDataContext.tsx`; rimozione
> `navigator.onLine` esplicitamente esclusa (competenza DESIGN 008).
> Creato file spec `__tests__/AppDataContext.spec.ts` con `it.todo`
> per i quattro scenari obbligatori (hydration N9, concorrenza,
> writeCache fail-soft, vuoto vs hydration fallita). Nessuna modifica
> a `src/`. Prossimo passo: review PLAN 007 e autorizzazione
> all'implementazione.

> **Nota sessione correzioni 2026-05-21:** Correzioni documentali A1/A2/A3 e nota operativa C2 applicate.
> PLAN 001, DESIGN 002, PLAN 002, TODO 002 aggiornati. A2a su DESIGN 002 saltata (nessun riferimento riga presente).
> Prossimo passo: analisi gruppo DESIGN 003 e DESIGN 004.

> **Nota sessione analisi 2026-05-20:** Report analisi coerenza DESIGN 001 + DESIGN 002 generato (`docs/1-reports/REPORT_analisi-coerenza_DESIGN-001-002_v1.0.0.md`). In attesa di revisione da donny-81 e consiglio AI. Prossimo passo: revisione report e identificazione azioni correttive se necessarie. Punti critici da valutare: (C1) aggiornamento `App.test.tsx` con mock prima di procedere con DESIGN 002 PRE-3; (C2) rivalutazione Risk R5 in `screen-reader.ts` e aggiunta guard in `initializeLiveRegions`. Azioni documentali raccomandate: (A1) correzione riferimento stale "sezione 10 DESIGN" in PLAN 001; (A2) correzione offset righe 63-65→61-63 in DESIGN 002 e TODO 002; (A3) correzione ordine N6/N8/N11→N11/N8/N6 nel titolo frontmatter DESIGN 002.

> **Nota sessione docs 2026-05-19:** Completata estrazione coding plan da documenti di design. Documenti pronti per l'implementazione:
> - `docs/3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md` — T1-T8 (P1 accessibility engine)
> - `docs/3-coding-plans/004-PLAN_announcements-layer_v1_0_0.md` — T1-T14 (P2/P3 announcements layer)
> - DESIGN 003 e 004 ripuliti da sezioni implementative.

---

## 2b. Protocollo di Apertura Sessione (Session Open)

> Procedura obbligatoria che l'agente deve eseguire come prima cosa all'avvio di ogni nuova sessione di lavoro umana, prima di toccare qualsiasi file. Non si applica al Context Refresh tecnico definito nella sezione 1.

1. Leggere integralmente questo TODO-MASTER dall'inizio.
2. Individuare il blocco attivo dal campo **Blocco in Carico** nella sezione 1.
3. Leggere lo **Snapshot di Ripresa** e identificare il **Next Action**.
4. Leggere il documento di design e il coding plan associati al blocco attivo.
5. Inviare all'architetto il seguente messaggio di conferma prima di eseguire qualsiasi operazione:

```
SESSIONE APERTA — [Nome Agente] — [YYYY-MM-DD HH:MM]
Blocco in carico: [Block ID — Titolo]
Ultimo task validato: [Task ID — descrizione]
Prossima azione pianificata: [Next Action dallo Snapshot]
Confermato: in attesa di "VAI" dall'architetto per procedere.
```

6. Attendere conferma esplicita dell'architetto ("VAI") prima di eseguire qualsiasi task.

---

## 3. Definizione delle Fasi

Per ogni fase del progetto compilare un blocco separato con questa struttura.

---

### Phase ID: P0

- **Phase Title:** Fase 0 — Config (pre-requisito globale)
- **Phase Objective:** Applicare fix di configurazione necessari (babel, package.json) per permettere il bundling e l'installazione coerente delle dipendenze.
- **Entry Conditions:** Dipendenze iniziali presenti nel repository
- **Exit Conditions — Global Gate:** `npm install` completa senza errori; Metro non produce errori di risoluzione alias `@/*`.
- **Estimated Blocks:** 3
- **Phase Status:** [ ] TODO

---

### Phase ID: P1

- **Phase Title:** Fase 1 — Rimpiazza dipendenze DOM in `lib/`
- **Phase Objective:** Sostituire o adattare le implementazioni web-only (`haptic-system`, `sound-system`, `screen-reader`) con equivalenti RN.
- **Entry Conditions:** Fase 0 completata
- **Exit Conditions — Global Gate:** Nessuna API DOM chiamata direttamente nei moduli critici; interfacce pubbliche mantenute.
- **Estimated Blocks:** 3
- **Phase Status:** [ ] TODO
- **Reference Documents:** docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md, docs/3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md

---

### Phase ID: P2

- **Phase Title:** Fase 2 — Rimpiazza hook web-only
- **Phase Objective:** Adattare i hook a API RN (`use-inactivity-timer`, `use-online-status`, `use-talkback`).
- **Entry Conditions:** Fase 1 completata
- **Exit Conditions — Global Gate:** I hook non usano `document`/`window` e passano `npx tsc --noEmit` senza errori relativi a API DOM.
- **Estimated Blocks:** 3
- **Phase Status:** [ ] TODO
- **Reference Documents:** docs/2-projects/004-DESIGN_announcements-layer_v1_0_0.md, docs/3-coding-plans/004-PLAN_announcements-layer_v1_0_0.md

---

### Phase ID: P3

- **Phase Title:** Fase 3 — Pulisci context
- **Phase Objective:** Rimuovere import DOM-only da `AuthContext` e `AppDataContext`, introdurre shim temporanei dove necessario.
- **Entry Conditions:** Fase 2 completata
- **Exit Conditions — Global Gate:** `AuthProvider` e `AppDataProvider` montabili senza crash.
- **Estimated Blocks:** 2
- **Phase Status:** [ ] TODO

---

### Phase ID: P4

- **Phase Title:** Fase 4 — Crea componenti UI base (src/components/)
- **Phase Objective:** Implementare placeholder RN per componenti base (Button, Toast) necessari per il bootstrap.
- **Entry Conditions:** Fase 3 completata
- **Exit Conditions — Global Gate:** Componenti placeholder esistenti e importabili da `src/context` senza errori.
- **Estimated Blocks:** 2
- **Phase Status:** [ ] TODO

---

### Phase ID: P5

- **Phase Title:** Fase 5 — Screens
- **Phase Objective:** Implementare schermate RN utilizzando i componenti nativi e le API migrate.
- **Entry Conditions:** Fase 4 completata
- **Exit Conditions — Global Gate:** Schermate principali implementate e navigabili; app eseguibile su target platform.
- **Estimated Blocks:** 5
- **Phase Status:** [ ] TODO

---

## 4. Struttura dei Blocchi Operativi

Per ogni blocco all'interno di una fase compilare un blocco separato con questa struttura.

---

### Block ID: P0.B1

- **Block Title:** Fix babel.config.js — alias e variabili ambiente
- **Parent Phase:** P0
- **Reference Documents:** docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md, docs/3-coding-plans/001-PLAN_fix-blocchi-avvio_v0.1.0.md
- **Technical Scope:** Solo babel.config.js. Nessuna modifica ad altri file.
- **Block Status:** [x] DONE — implementato 2026-05-22 (Agent-Orchestrator). Gate di validazione runtime non ancora eseguito.

#### Mappa delle Dipendenze
- **Depends On:** Nessuno — primo blocco
- **Unlocks:** P0.B3, P0.B4

#### Dry Run Check
Prima di eseguire il Task 1, verificare che babel.config.js esista nella root del progetto e sia accessibile in scrittura. Se mancante attivare immediatamente HC-2.

#### Atomic Task List

##### Task ID: T0.1.1
- **Action:** Aggiungere il plugin module-resolver al campo plugins di babel.config.js con root ['./src'] e alias { '@': './src' } seguendo docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md sezione 2.
- **Target Files:** babel.config.js
- **Depends On:** Nessuno
- **Success Metric:** npm start non produce errori "Unable to resolve module @/..." nel log Metro.
- **Task Status:** [ ] TODO

##### Task ID: T0.1.2
- **Action:** Aggiungere il plugin react-native-dotenv al campo plugins di babel.config.js con moduleName '@env' e path '.env' seguendo docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md sezione 2.
- **Target Files:** babel.config.js
- **Depends On:** T0.1.1
- **Success Metric:** Le variabili SUPABASE_URL e SUPABASE_ANON_KEY sono accessibili a runtime tramite import da @env. Nessun throw in src/lib/supabase/client.ts all'avvio.
- **Task Status:** [ ] TODO

#### Block Gate
- **Validation Steps:**
  1. Eseguire npm install
  2. Eseguire npx tsc --noEmit
  3. Eseguire npm start e osservare il log Metro per 30 secondi
- **Expected Outputs:**
  1. Exit code 0, nessun errore in node_modules
  2. Nessun errore TS2307 su moduli @/ o @env
  3. Metro avvia senza errori di risoluzione moduli per alias @/ e variabili @env
- **Gate Status:** [ ] OPEN

---

### Block ID: P0.B2

- **Block Title:** Fix package.json — versione AsyncStorage
- **Parent Phase:** P0
- **Reference Documents:** docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md, docs/3-coding-plans/001-PLAN_fix-blocchi-avvio_v0.1.0.md
- **Technical Scope:** Solo package.json. Nessuna modifica ad altri file.
- **Block Status:** [ ] TODO

#### Mappa delle Dipendenze
- **Depends On:** Nessuno — parallelo a P0.B1
- **Unlocks:** P0.B3

#### Dry Run Check
Verificare che package.json esista nella root e che la dipendenza @react-native-async-storage/async-storage sia presente con versione ^3.0.2.

#### Atomic Task List

##### Task ID: T0.2.1
- **Action:** In package.json modificare la versione di @react-native-async-storage/async-storage da ^3.0.2 a ^2.1.0 seguendo docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md.
- **Target Files:** package.json
- **Depends On:** Nessuno
- **Success Metric:** npm install completa senza errori ETARGET o 404 per async-storage.
- **Task Status:** [ ] TODO

#### Block Gate
- **Validation Steps:**
  1. Eseguire npm install
  2. Verificare che node_modules/@react-native-async-storage/async-storage esista con versione 2.x
- **Expected Outputs:**
  1. Exit code 0, nessun errore ETARGET o 404
  2. Directory presente con versione 2.x
- **Gate Status:** [ ] OPEN

---

### Block ID: P0.B3

- **Block Title:** Fix AuthContext — rimozione sonner e dipendenze DOM
- **Parent Phase:** P0
- **Reference Documents:** docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md, docs/3-coding-plans/002-PLAN_fix-provider-bootstrap_v0.2.0.md, docs/1-reports/REPORT_implementazione_STEP-002_v1.0.0.md
- **Technical Scope:** Solo src/context/AuthContext.tsx. Nessuna modifica ad altri file.
- **Block Status:** [~] IN PROGRESS (STEP 002 commit N11/N8/N6 eseguiti; gate runtime DIFFERITI per D3 — `App.tsx` non monta `AuthProvider`)

#### Mappa delle Dipendenze
- **Depends On:** P0.B1, P0.B2
- **Unlocks:** P0.B4

#### Dry Run Check
Verificare che src/context/AuthContext.tsx esista e sia accessibile in scrittura. Verificare che P0.B1 e P0.B2 siano entrambi PASSED.

#### Atomic Task List

##### Task ID: T0.3.1
- **Action:** Rimuovere l'import di sonner da AuthContext.tsx e sostituire ogni chiamata toast(...) con console.warn(...) come placeholder temporaneo, seguendo docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md.
- **Target Files:** src/context/AuthContext.tsx
- **Depends On:** Nessuno
- **Success Metric:** Nessun import di sonner in AuthContext.tsx. npx tsc --noEmit non riporta errori su sonner.
- **Task Status:** [ ] TODO

##### Task ID: T0.3.2
- **Action:** Rimuovere l'import di @/components/ui/button da AuthContext.tsx e sostituire ogni utilizzo del componente Button con TouchableOpacity di React Native, seguendo docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md.
- **Target Files:** src/context/AuthContext.tsx
- **Depends On:** T0.3.1
- **Success Metric:** Nessun import di @/components/ui/button in AuthContext.tsx. npx tsc --noEmit non riporta errori sull'import mancante.
- **Task Status:** [ ] TODO

##### Task ID: T0.3.3
- **Action:** Rimuovere tutte le occorrenze di document.addEventListener, document.removeEventListener e qualsiasi riferimento all'oggetto document in AuthContext.tsx. Sostituire con commenti TODO che indicano la sostituzione futura con AppState in P2, seguendo docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md.
- **Target Files:** src/context/AuthContext.tsx
- **Depends On:** T0.3.2
- **Success Metric:** Nessun riferimento a document. in AuthContext.tsx. npx tsc --noEmit non riporta ReferenceError su document.
- **Task Status:** [ ] TODO

#### Block Gate
- **Validation Steps:**
  1. Eseguire npx tsc --noEmit
  2. Eseguire npm start e verificare che AuthContext non produca errori al mount
- **Expected Outputs:**
  1. Nessun errore su sonner, @/components/ui/button, document in AuthContext.tsx
  2. Metro avvia e AuthContext si monta senza ReferenceError
- **Gate Status:** [ ] OPEN

---

### Block ID: P0.B4

- **Block Title:** Fix AppDataContext — rimozione sonner e fix async cache
- **Parent Phase:** P0
- **Reference Documents:** docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md, docs/3-coding-plans/002-PLAN_fix-provider-bootstrap_v0.2.0.md
- **Technical Scope:** Solo src/context/AppDataContext.tsx. Nessuna modifica ad altri file.
- **Block Status:** [ ] TODO

#### Mappa delle Dipendenze
- **Depends On:** P0.B3
- **Unlocks:** P1.B1, P1.B2, P1.B3

#### Dry Run Check
Verificare che src/context/AppDataContext.tsx esista e sia accessibile in scrittura. Verificare che P0.B3 sia PASSED.

#### Atomic Task List

##### Task ID: T0.4.1
- **Action:** Rimuovere l'import di sonner da AppDataContext.tsx e sostituire ogni chiamata toast(...) con console.warn(...) come placeholder temporaneo, seguendo docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md.
- **Target Files:** src/context/AppDataContext.tsx
- **Depends On:** Nessuno
- **Success Metric:** Nessun import di sonner in AppDataContext.tsx. npx tsc --noEmit non riporta errori su sonner.
- **Task Status:** [ ] TODO

##### Task ID: T0.4.2
- **Action:** Aggiungere await davanti a tutte le chiamate a readCache e isCacheStale in AppDataContext.tsx che attualmente le invocano come sincrone, seguendo docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md.
- **Target Files:** src/context/AppDataContext.tsx
- **Depends On:** T0.4.1
- **Success Metric:** Tutte le chiamate a readCache e isCacheStale in AppDataContext.tsx sono precedute da await. npx tsc --noEmit non riporta errori di tipo su queste chiamate.
- **Task Status:** [ ] TODO

#### Block Gate
- **Validation Steps:**
  1. Eseguire npx tsc --noEmit
  2. Eseguire npm start e verificare che AppDataContext si monti e carichi i dati senza errori
- **Expected Outputs:**
  1. Nessun errore su sonner o chiamate async in AppDataContext.tsx
  2. Metro avvia, AuthContext e AppDataContext si montano in sequenza senza crash
- **Gate Status:** [ ] OPEN

---

## 5. Protocollo di Gestione Errori

### Conflict Resolution

- **Priority Rule:** Il codice esistente validato ha precedenza assoluta. Non sovrascrivere file validati senza escalation verso l'architetto.
- **Safe Actions:** Azioni che l'agente può eseguire autonomamente per risolvere conflitti minori — es. rinominare file duplicati aggiungendo suffisso `_bak`, aggiungere commenti TODO nel codice per segnalare aree da rivedere.
- **Forbidden Actions:** Azioni che l'agente non può mai eseguire in autonomia:
  - Eliminare file o dati
  - Modificare file fuori dal Technical Scope del blocco attivo
  - Procedere al blocco successivo se il gate corrente è FAILED
  - Interpretare un requisito ambiguo senza chiedere chiarimento

### Security & Privacy Constraints

- **Data Privacy:** Mai inserire valori numerici reali, nomi utente o dati sensibili nei log di debug o nei commenti del codice.

---

## Nuovi debiti tecnici aggiunti 2026-05-27

- **DT-010-01**: Funzioni PostgreSQL per operazioni crittografiche del PIN — valutare l'introduzione di funzioni server-side per auditing e centralizzazione delle operazioni crittografiche relative al PIN. Priorità: bassa. Riferimento: `docs/2-projects/010-DESIGN_wrapped-master-key-PIN_v0.1.0.md`.

- **DT-011-01 (DT-008-02)**: Telemetria centralizzata per errori di bootstrap e differenziazione `ERROR_NETWORK`/`ERROR_DATA` — progettare servizio di raccolta e mapping degli errori di bootstrap. Priorità: bassa. Riferimento: `docs/2-projects/011-DESIGN_resilienza-bootstrap_v0.1.0.md`.

- **DT-012-01**: DESIGN per esportazione PDF — creare design dedicato prima di implementare supporto PDF in `ExportService`. Priorità: bassa. Riferimento: `docs/2-projects/012-DESIGN_export-nativo-debiti_v0.1.0.md`.

- **DT-012-02**: DESIGN per esportazione XLSX — creare design dedicato prima di implementare supporto XLSX in `ExportService`. Priorità: bassa. Riferimento: `docs/2-projects/012-DESIGN_export-nativo-debiti_v0.1.0.md`.

- **Documenti di pianificazione 010 — Wrapped Master Key per PIN privato**
  - Design di riferimento: `docs/2-projects/010-DESIGN_wrapped-master-key-PIN_v0.1.0.md` — stato REVIEWED (2026-05-27).
  - File: `docs/3-coding-plans/010-PLAN_wrapped-master-key-pin_v0.1.0.md` — stato iniziale APERTO.
  - File: `docs/4-todo-lists/010-TODO_wrapped-master-key-pin_v0.1.0.md` — stato iniziale APERTO.
  - Task principali: migration coordinate schema-first; estensione tipi/repository per `pin_master_key_encrypted`; helper crypto per wrap/unwrap Master Key; update atomico Supabase con verifica `response.error`; integrazione flussi `setPin` / `changePin` / reset PIN; localizzazione completa messaggi PIN.

- **Documenti di pianificazione 011 — Resilienza bootstrap**
  - Design di riferimento: `docs/2-projects/011-DESIGN_resilienza-bootstrap_v0.1.0.md` — stato REVIEWED (2026-05-27).
  - File: `docs/3-coding-plans/011-PLAN_resilienza-bootstrap_v0.1.0.md` — stato iniziale APERTO.
  - File: `docs/4-todo-lists/011-TODO_resilienza-bootstrap_v0.1.0.md` — stato iniziale APERTO.
  - Task principali: conferma `NetworkStatusProvider` come primo provider; costante nominata per timeout 10s; implementazione separata Caso 1, Caso 2 e Caso 3; gestione risposta tardiva di NetInfo; confinamento di `ERROR_NETWORK` / `ERROR_DATA`; localizzazione dei messaggi bootstrap.

- **Documenti di pianificazione 012 — Export nativo debiti e guard concorrente**
  - Design di riferimento: `docs/2-projects/012-DESIGN_export-nativo-debiti_v0.1.0.md` — stato REVIEWED (2026-05-27).
  - File: `docs/3-coding-plans/012-PLAN_export-nativo-debiti_v0.1.0.md` — stato iniziale APERTO.
  - File: `docs/4-todo-lists/012-TODO_export-nativo-debiti_v0.1.0.md` — stato iniziale APERTO.
  - Task principali: aggiunta reason `ALREADY_IN_PROGRESS`; guard sincrona `inProgress`; struttura `try/catch/finally` obbligatoria; allineamento chiamante export con messaggi localizzati; copertura completa dei 13 test; tracciamento debiti PDF/XLSX subordinati a design dedicato.

- **Validation Logic:** Ogni funzione di calcolo finanziario deve includere test obbligatori per la gestione dei decimali e l'arrotondamento.
- **Credential Handling:** Mai scrivere API Key o segreti direttamente nei file sorgente. Usare esclusivamente variabili d'ambiente o il modulo `@env`.
- **Database Transactionality:** Tutti i task che comportano la modifica di schemi o dati su Supabase devono essere eseguiti tramite transazioni isolate o script di migrazione controllati. È fatto divieto di eseguire mutazioni dirette sul database che non possano essere annullate in sicurezza dalle procedure di Rollback.

### Halt Conditions

1. Un task produce un output diverso dal Success Metric dopo due tentativi consecutivi.
2. Un file target non esiste e la sua creazione non è prevista nel piano.
3. Un gate fallisce per ragioni non coperte dal Conflict Resolution.
4. Emergono dipendenze non dichiarate che coinvolgono moduli fuori scope.
5. Il rollback di livello 2 non ripristina uno stato pulito dopo due tentativi.
6. Viene rilevata una contraddizione tra due documenti di riferimento.

### Escalation Format

```
HALT — [Task ID o Block ID]
Motivo: [descrizione in una riga del problema]
Halt Condition attivata: [numero della condizione — es. HC-1]
Stato al momento dell'halt: [cosa era stato completato, cosa era in corso]
File coinvolti: [lista dei file toccati prima dell'halt]
Opzioni identificate: [1-3 opzioni concrete con pro e contro]
Decisione richiesta: [domanda specifica a cui l'architetto deve rispondere per sbloccare]
```

---

## 6. Registro di Stato (State Ledger)

Panoramica dello stato globale di tutti i blocchi e task. Aggiornare dopo ogni task completato.

| ID | Titolo | Status | Gate |
|----|--------|--------|------|
| P0.B1 | Fix babel.config.js — alias e variabili ambiente | [x] DONE | [x] PASSED |
| P0.B2 | Fix package.json — versione AsyncStorage | [x] DONE | [x] PASSED |
| P0.B3 | Fix AuthContext — rimozione sonner e dipendenze DOM | [x] DONE | [x] PASSED |
| P0.B4 | Fix AppDataContext — rimozione sonner e fix async cache | [x] DONE | [x] PASSED |
| P1.B1 | Riscrittura haptic-system.ts per RN | [ ] TODO | [ ] OPEN |
| P1.B2 | Riscrittura sound-system.ts per RN | [ ] TODO | [ ] OPEN |
| P1.B3 | Riscrittura screen-reader.ts per RN | [ ] TODO | [ ] OPEN |
| P2.B1 | Riscrittura use-inactivity-timer.ts per RN | [x] DONE | [x] PASSED |
| P2.B2 | Riscrittura use-online-status.ts per RN (rif. DESIGN 008) | [x] DONE — ELIMINATO e sostituito da src/hooks/use-network-status.ts (DESIGN 008) | [x] PASSED |
| P2.B3 | Riscrittura use-talkback.ts per RN | [x] DONE — ELIMINATO e sostituito da src/accessibility/detection.ts | [x] PASSED |
| P1.B3-PARZIALE | Avvio fix accessibility engine (DESIGN 003) — creati types.ts, engine.ts, detection.ts | [x] DONE (parziale — screen-reader.ts ancora da coprire in DESIGN specifico) | [~] DEFERRED |
| P3.B1 | Pulizia AuthContext — rimozione residui DOM | [ ] TODO | [ ] OPEN |
| P3.B2 | Pulizia AppDataContext — fix completo async | [ ] TODO | [ ] OPEN |
| P3.B2-EXT | Stesura DESIGN 009 — Export File Nativo | [X] DONE | [X] PASSED |
| P3.B2-EXT-NATIVE | Stesura DESIGN 009-native — Modulo nativo WinRT Save Picker (sotto-design di DESIGN 009 §6 Layer B, approvato Consiglio AI 2026-05-25) | [X] DONE | [X] PASSED |
| P3.B2-EXT-NATIVE-PLAN | Stesura PLAN 009-native + TODO 009-native — Bridge C++/WinRT WinRT Save Picker (Agent-Docs, 2026-05-25) | [X] DONE | [X] PASSED |
| P4.B1 | Creazione componente Button nativo | [ ] TODO | [ ] OPEN |
| P4.B2 | Creazione sistema Toast/notifica nativo | [ ] TODO | [ ] OPEN |
| P5.B1 | Implementazione screens | [ ] TODO | [ ] OPEN |
| P1.B4 | Documentazione DESIGN 004 completata (PLAN + TODO creati) | [x] DONE | [x] DONE |
| P1.B5 | Documentazione DESIGN 005 — TODO 005 creato (PLAN 005 pronto per implementazione) | [x] DONE | [x] DONE |
| P1.B5-IMPL | Implementazione PLAN 005 — `@noble/ciphers` (T1–T8, 11/11 PASS, Gate §9 superato) | [x] DONE | [x] PASSED |
| P1.B6 | Documentazione DESIGN 006 — TODO 006 creato (PLAN 006 v1.1.0 pronto per implementazione a valle di PLAN 005) | [x] DONE | [x] DONE |
| P1.B6-IMPL | Implementazione PLAN 006 — KDF PIN PBKDF2-SHA256 (T2–T9 PASS, gate chiusura superato) | [x] DONE | [x] PASSED |
| DUSU-ANALYZER | Analisi statica compatibilità Android v0.4.0 — 3 BC, 4 AN, 3 DD, report prodotto | [x] DONE | [x] PASSED |
| BC-01-FIX | Rimozione @phosphor-icons/react da budget-templates.ts | [x] DONE | [x] PASSED |
| BC-02-FIX | Rimozione @phosphor-icons/react da package.json | [x] DONE | [x] PASSED |
| BC-03-FIX | Rimozione react-dom da package.json | [x] DONE — 2026-06-25 donny-81 | [x] PASSED |
| P3.B3-DOCS-010 | Documenti 010 approvati — Wrapped Master Key PIN — schema DB aggiornato | [x] DONE | [x] PASSED |
| P3.B3-DOCS-011 | Documenti 011 approvati — Resilienza Bootstrap — TODO 011 corretto Test 8 | [x] DONE | [x] PASSED |
| P3.B3-DOCS-012 | Documenti 012 approvati — Export Nativo Guard Concorrente | [x] DONE | [x] PASSED |
| P3.B4-IMPL-010 | Codifica blocco 010 — Wrapped Master Key PIN | [x] DONE — 2026-05-27 Agent-Code | [x] PASSED |
| P3.B4-IMPL-011 | Codifica blocco 011 — Resilienza Bootstrap | [x] DONE — 2026-05-27 Agent-Code | [x] PASSED |
| P3.B4-IMPL-012 | Codifica blocco 012 — Export Nativo Guard Concorrente | [x] DONE — 2026-05-27 Agent-Code | [x] PASSED |
| P3.B5-DOCS-013 | DESIGN 013 approvato — Repository Ricorrenze | [x] DONE — 2026-05-28 Agent-Docs | [x] PASSED |
| P3.B5-DOCS-014 | DESIGN 014 approvato — Repository Tag e Transazioni-Tag (prereq: 013) | [x] DONE — 2026-05-28 Agent-Docs | [x] PASSED |
| P3.B5-DOCS-015 | DESIGN 015 approvato — Repository Notifiche e Notification Service (prereq: 013, 014) | [x] DONE — 2026-05-28 Agent-Docs | [x] PASSED |
| P3.B5-DOCS-016 | DESIGN 016 approvato — Repository Allegati Transazioni | [x] DONE — 2026-05-28 Agent-Docs | [x] PASSED |
| P3.B5-DOCS-016-bis | DESIGN 016-bis approvato — Cleanup Orfani Storage (dipende da 016) | [x] DONE — 2026-05-28 Agent-Docs | [x] PASSED |
| P3.B5-DOCS-016-ter | DESIGN 016-ter approvato — Magic Bytes Validation (dipende da 016) | [x] DONE — 2026-05-28 Agent-Docs | [x] PASSED |
| P3.B6-PLAN-013 | Coding plan 013 — Repository Ricorrenze | [x] DONE — 2026-05-28 Agent-Orchestrator | [x] PASSED |
| P3.B6-TODO-013 | Todo list 013 — Repository Ricorrenze | [x] DONE — 2026-05-28 Agent-Orchestrator | [x] PASSED |
| P3.B6-PLAN-014 | Coding plan 014 — Repository Tag e Transazioni-Tag | [x] DONE — 2026-05-28 Agent-Orchestrator | [x] PASSED |
| P3.B6-TODO-014 | Todo list 014 — Repository Tag e Transazioni-Tag | [x] DONE — 2026-05-28 Agent-Orchestrator | [x] PASSED |
| P3.B6-PLAN-015 | Coding plan 015 — Repository Notifiche e Notification Service | [x] DONE — 2026-05-28 Agent-Orchestrator | [x] PASSED |
| P3.B6-TODO-015 | Todo list 015 — Repository Notifiche e Notification Service | [x] DONE — 2026-05-28 Agent-Orchestrator | [x] PASSED |
| P3.B6-PLAN-016 | Coding plan 016 — Allegati Transazioni | [x] DONE — 2026-05-28 Agent-Orchestrator | [x] PASSED |
| P3.B6-TODO-016 | Todo list 016 — Allegati Transazioni | [x] DONE — 2026-05-28 Agent-Orchestrator | [x] PASSED |
| P3.B6-PLAN-016-bis | Coding plan 016-bis — Cleanup Orfani Storage | [x] DONE — 2026-05-28 Agent-Orchestrator | [x] PASSED |
| P3.B6-TODO-016-bis | Todo list 016-bis — Cleanup Orfani Storage | [x] DONE — 2026-05-28 Agent-Orchestrator | [x] PASSED |
| P3.B6-PLAN-016-ter | Coding plan 016-ter — Magic Bytes Validation | [x] DONE — 2026-05-28 Agent-Orchestrator | [x] PASSED |
| P3.B6-TODO-016-ter | Todo list 016-ter — Magic Bytes Validation | [x] DONE — 2026-05-28 Agent-Orchestrator | [x] PASSED |
| P3.B7-DOCS-017 | DESIGN 017 — Prestiti, Mutui e Simulazione Finanziaria | [x] DONE — 2026-05-28 Agent-Docs | Stato: REVIEWED 2026-05-29 |
| P3.B7-DOCS-018 | DESIGN 018 — Confronto Mese su Mese per Categoria | [x] DONE — 2026-05-28 Agent-Docs | Stato: REVIEWED 2026-05-29 |
| P3.B7-DOCS-019 | DESIGN 019 — Notifiche Budget e Orchestrazione | [x] DONE — 2026-05-28 Agent-Docs | Stato: REVIEWED 2026-05-29 |
| P3.B7-DOCS-020 | DESIGN 020 — Centralizzazione design tokens | [x] DONE — 2026-06-26 Agent-Docs | Stato: REVIEWED 2026-06-26 |

| P3.B8-PLAN-017 | Coding plan 017 — Prestiti, Mutui e Simulazione Finanziaria | [x] DONE — 2026-05-29 Agent-Orchestrator | [x] PASSED |
| P3.B8-TODO-017 | Todo list 017 — Prestiti, Mutui e Simulazione Finanziaria | [x] DONE — 2026-05-29 Agent-Orchestrator | [x] PASSED |
| P3.B8-PLAN-018 | Coding plan 018 — Confronto Mese su Mese per Categoria | [x] DONE — 2026-05-29 Agent-Orchestrator | [x] PASSED |
| P3.B8-TODO-018 | Todo list 018 — Confronto Mese su Mese per Categoria | [x] DONE — 2026-05-29 Agent-Orchestrator | [x] PASSED |
| P3.B8-PLAN-019 | Coding plan 019 — Notifiche Budget e Orchestrazione | [x] DONE — 2026-05-29 Agent-Orchestrator | [x] PASSED |
| P3.B8-TODO-019 | Todo list 019 — Notifiche Budget e Orchestrazione | [x] DONE — 2026-05-29 Agent-Orchestrator | [x] PASSED |
| P3.B8-IMPL-017 | Codifica 017 — Prestiti, Mutui e Simulazione Finanziaria | [x] DONE — 2026-06-25 donny-81 | [x] PASSED |
| P3.B8-IMPL-018 | Codifica 018 — Confronto Mese su Mese per Categoria | [x] DONE — 2026-06-25 donny-81 | [x] PASSED |
| P3.B8-IMPL-019 | Codifica 019 — Notifiche Budget e Orchestrazione | [x] DONE — 2026-06-25 donny-81 | [x] PASSED |
| P3.B8-PLAN-020 | Coding plan 020 — Centralizzazione design tokens | [x] DONE — 2026-06-26 Agent-Orchestrator | [x] PASSED |
| P3.B8-TODO-020 | Todo list 020 — Centralizzazione design tokens | [x] DONE — 2026-06-26 Agent-Orchestrator | [x] PASSED |
| P3.B8-IMPL-020 | Codifica blocco 020 — Centralizzazione design tokens | [x] DONE — 2026-06-26 Antigravity | [x] PASSED |
| P3.B9-SQL-P55 | Migrazione P55 — tabella notifiche schema Supabase | [x] DONE — 2026-06-25 donny-81 | [x] PASSED — eseguito in Supabase |
| P3.AN-01-PLAN | Redazione Coding Plan 021 — Haptic System Refactor | [x] DONE — 2026-06-26 DUSU-FIX | [x] PASSED |
| P3.AN-01-TODO | Redazione Todo Specifico 021 — Haptic System Refactor | [x] DONE — 2026-06-26 DUSU-FIX | [x] PASSED |
| P3.B8-AN-01 | Codifica 021 — Haptic System (expo-haptics) | [x] DONE — 2026-06-26 DUSU-CODER | [x] PASSED |
| P3.B1-IMPL-021 | Haptic System nativo — expo-haptics | [x] DONE — 2026-06-26 donny-81 | [x] PASSED |
| P3.AN-02-PLAN | Redazione Coding Plan 022 — Sound System Refactor | [x] DONE — 2026-06-27 Antigravity | [x] PASSED |
| P3.AN-02-TODO | Redazione Todo Specifico 022 — Sound System Refactor | [x] DONE — 2026-06-27 Antigravity | [x] PASSED |
| P3.B8-AN-02 | Codifica 022 — Sound System (react-native-audio-api) | [x] DONE — 2026-06-27 Antigravity | [x] PASSED |
| P3.B1-IMPL-022 | Sound System nativo — react-native-audio-api | [x] DONE — 2026-06-27 Antigravity | [x] PASSED |
| CORE-TEST-PLAN-A | Piano di test moduli core (Fase A) | [x] DONE | [x] PASSED |
| CORE-TEST-IMPL-B | Implementazione test moduli core (Fase B) | [x] DONE | [x] PASSED |
| P3.E0-PLAN-023 | Redazione Coding Plan 023 — SESSIONE E0 bugfix | [x] DONE — 2026-06-29 Antigravity | [x] PASSED |
| P3.E0-TODO-023 | Redazione Todo Specifico 023 — SESSIONE E0 bugfix | [x] DONE — 2026-06-29 Antigravity | [x] PASSED |
| P3.E4-PLAN-024 | Redazione Coding Plan 024 — Test Sessione E4 | [x] DONE — 2026-06-30 Antigravity | [x] PASSED |
| P3.E4-TODO-024 | Redazione Todo Specifico 024 — Test Sessione E4 | [x] DONE — 2026-06-30 Antigravity | [x] PASSED |
| P3.E4-TEST-IMPL | Implementazione Test Sessione E4 (Blocco 3) | [x] DONE — 2026-06-30 Antigravity | [x] PASSED |
| P3.E2-PLAN-025 | Redazione Coding Plan 025 — Test Sessione E2 | [x] DONE — 2026-06-30 Antigravity | [x] PASSED |
| P3.E2-TODO-025 | Redazione Todo Specifico 025 — Test Sessione E2 | [x] DONE — 2026-06-30 Antigravity | [x] PASSED |

### Log di Validazione

| Data | Block ID | Validato Da | Risultato | Note |
|------|----------|-------------|-----------|------|
| 2026-06-30 | P3.E2-PLAN-025 / TODO-025 | Antigravity | DONE | Redatto coding plan 025 e todo list 025 per test Sessione E2 (Contesti Base e Hook) |
| 2026-06-30 | P3.E4-TEST-IMPL | Antigravity | DONE | Implementati ed eseguiti con successo i 116 test per i 20 moduli del Blocco 3 |
| 2026-06-30 | P3.E4-PLAN-024 / TODO-024 | Antigravity | DONE | Redatto coding plan 024 e todo list 024 per test Sessione E4 (Persistenza e Librerie) |
| 2026-06-29 | P3.E0-PLAN-023 / TODO-023 | Antigravity | DONE | Redatto coding plan 023 e todo list 023 per correzione dei 7 bug e regression test |
| 2026-06-27 | CORE-TEST-IMPL-B | Antigravity | DONE | Scritta e convalidata la suite completa di 39 test unitari per i 7 moduli core |
| 2026-06-27 | CORE-TEST-PLAN-A | Antigravity | DONE | Prodotto report di piano di test dettagliato per i sette moduli core |
| 2026-06-27 | P3.B8-AN-02 | Antigravity | DONE | PLAN 022 — Sound System nativo con react-native-audio-api |
| 2026-05-22 | P0.B1 | Agent-Orchestrator | DONE | DESIGN 001 — babel.config.js |
| 2026-05-22 | P0.B2 | Agent-Orchestrator | DONE | DESIGN 001 — package.json |
| 2026-05-22 | P0.B3 | Agent-Orchestrator | DONE | DESIGN 001+002 — AuthContext |
| 2026-05-22 | P0.B4 | Agent-Orchestrator | DONE | DESIGN 001+002 — AppDataContext |
| 2026-05-22 | P2.B1 | Agent-Orchestrator | DONE | DESIGN 002 — use-inactivity-timer.ts |
| 2026-05-22 | P2.B3 | Agent-Orchestrator | DONE | DESIGN 003 — use-talkback.ts eliminato |
| 2026-05-22 | P1.B3-PARZIALE | Agent-Orchestrator | DONE (parziale) | DESIGN 003 — accessibility engine |
| 2026-05-21 | P1.B4-DOC | Agent-Docs | DONE | PLAN 004 verificato (no correzioni), TODO 004 creato |
| 2026-05-22 | P1.B4-IMPL | Agent-Code | DONE | DESIGN 004 — `src/announcements/` operativo, AuthContext+AppDataContext migrati, legacy SR eliminati |
| 2026-05-22 | P1.B5-DOC | Agent-Orchestrator | DONE | PLAN 005 — TODO 005 creato. TODO operativo 8 task T1–T8 con gate bash. PLAN pronto per implementazione. |
| 2026-05-22 | P1.B6-DOC | Agent-Orchestrator | DONE | PLAN 006 v1.1.0 — TODO 006 creato. TODO operativo 9 task T1–T9 con gate bash. Note critiche: divieto commit Fase 0 con placeholder, sequenza calcolo offline vettori K1/K2/K3 (6 passi), contratto errore updateFields (no swallow), serializzazione KDF_VERSION UInt8, posizioni buffer 0/1-16/17-28/29+. Gate bloccante: dipendenza da PLAN 005 implementato e mergiato. Checklist chiusura 12 punti da PLAN §10. |
| 2026-05-27 | P3.B4-IMPL-010 | Agent-Code | DONE | PLAN 010 — wrapped master key versionata, update atomico `pin_privato_hash`/`pin_kdf_salt`/`pin_master_key_encrypted`, reset PIN distruttivo con logout globale, messaggi PIN localizzati. Gate G-010-1..G-010-5 PASS. |
| 2026-05-27 | P3.B4-IMPL-011 | Agent-Code | DONE | PLAN 011 — `NetworkStatusProvider` fail-safe a 3000 ms, `App.tsx` con provider rete primo nella catena, `AppDataContext` con bootstrap offline/online/init, timeout remoto 10000 ms e codici interni `ERROR_NETWORK`/`ERROR_DATA` non esposti alla UI. Gate G-011-1..G-011-5 PASS. |
| 2026-05-27 | P3.B4-IMPL-012 | Agent-Code | DONE | PLAN 012 — `export-service.ts` con guardia sincrona `inProgress`, nuovo reason `ALREADY_IN_PROGRESS`, rilascio del flag in `finally` e suite export riallineata a 13 casi. Gate G-012-1..G-012-5 PASS. |
| 2026-05-28 | P3.B5-DOCS-013 | Agent-Docs | DONE | DESIGN 013 — Repository Ricorrenze, stato APPROVATO E VALIDATO |
| 2026-05-28 | P3.B5-DOCS-014 | Agent-Docs | DONE | DESIGN 014 — Repository Tag e Transazioni-Tag, stato APPROVATO E VALIDATO |
| 2026-05-28 | P3.B5-DOCS-015 | Agent-Docs | DONE | DESIGN 015 — Repository Notifiche e Notification Service, stato APPROVATO E VALIDATO |
| 2026-05-28 | P3.B5-DOCS-016 | Agent-Docs | DONE | DESIGN 016 — Repository Allegati Transazioni, stato APPROVATO E VALIDATO, DT-016-01 e DT-016-02 aperti |
| 2026-05-28 | P3.B5-DOCS-016-bis | Agent-Docs | DONE | DESIGN 016-bis — Cleanup Orfani Storage, stato APPROVATO E VALIDATO, DT-016-bis-01/02/03 aperti |
| 2026-05-28 | P3.B5-DOCS-016-ter | Agent-Docs | DONE | DESIGN 016-ter — Magic Bytes Validation, stato APPROVATO E VALIDATO, DT-016-ter-01/02/03 aperti |
| 2026-05-28 | P3.B6-PLAN-013 | Agent-Orchestrator | DONE | Coding plan 013 — Repository Ricorrenze, stato DRAFT |
| 2026-05-28 | P3.B6-TODO-013 | Agent-Orchestrator | DONE | Todo list 013 — Repository Ricorrenze, stato PENDING |
| 2026-05-28 | P3.B6-PLAN-014 | Agent-Orchestrator | DONE | Coding plan 014 — Repository Tag e Transazioni-Tag, stato DRAFT |
| 2026-05-28 | P3.B6-TODO-014 | Agent-Orchestrator | DONE | Todo list 014 — Repository Tag e Transazioni-Tag, stato PENDING |
| 2026-05-28 | P3.B6-PLAN-015 | Agent-Orchestrator | DONE | Coding plan 015 — Repository Notifiche e Notification Service, stato DRAFT |
| 2026-05-28 | P3.B6-TODO-015 | Agent-Orchestrator | DONE | Todo list 015 — Repository Notifiche e Notification Service, stato PENDING |
| 2026-05-28 | P3.B6-PLAN-016 | Agent-Orchestrator | DONE | Coding plan 016 — Allegati Transazioni, stato DRAFT |
| 2026-05-28 | P3.B6-TODO-016 | Agent-Orchestrator | DONE | Todo list 016 — Allegati Transazioni, stato PENDING |
| 2026-05-28 | P3.B6-PLAN-016-bis | Agent-Orchestrator | DONE | Coding plan 016-bis — Cleanup Orfani Storage, stato DRAFT |
| 2026-05-28 | P3.B6-TODO-016-bis | Agent-Orchestrator | DONE | Todo list 016-bis — Cleanup Orfani Storage, stato PENDING |
| 2026-05-28 | P3.B6-PLAN-016-ter | Agent-Orchestrator | DONE | Coding plan 016-ter — Magic Bytes Validation, stato DRAFT |
| 2026-05-28 | P3.B6-TODO-016-ter | Agent-Orchestrator | DONE | Todo list 016-ter — Magic Bytes Validation, stato PENDING |
| 2026-05-28 | P3.B7-DOCS-017 | Agent-Docs | DONE | DESIGN 017 — Motore Ricorrenze Automatico, stato DRAFT |
| 2026-05-28 | P3.B7-DOCS-018 | Agent-Docs | DONE | DESIGN 018 — Schermata Ricorrenze UI, stato DRAFT |
| 2026-05-28 | P3.B7-DOCS-019 | Agent-Docs | DONE | DESIGN 019 — Prestiti e Mutui, stato DRAFT; il file SQL canonico è stato rimosso |
| 2026-05-26 | P1.B6-IMPL | GitHub Copilot | DONE | PLAN 006 completato su `main`: `react-native-quick-crypto` pinnata a 1.1.5, migration P40 aggiunta, `pin_kdf_salt` propagato ai tipi e al repository, Strategia A (`derivePinKey`, `encryptDataPin`, `decryptDataPin`) implementata con `PBKDF2_ITERATIONS = 600_000`, update multi-colonna `updatePinHashAndSalt`, suite K1/K2/K3 aggiunta, G1/G2/G3 e `npx tsc --noEmit` verdi. |
| 2025-07-25 | DUSU-ANALYZER | Agent-Analyze | DONE | Analisi statica Android completata (read-only). 3 blocchi critici (BC-01/02/03: @phosphor-icons/react + react-dom), 4 adattamenti necessari (AN-01/02/03/04: haptic-system, sound-system, oklch colors), 3 discrepanze doc (DD-01/02/03). Report: docs/1-reports/REPORT-compatibilita-android-v1.0.0.md. P2.B2 risolta (use-online-status.ts → use-network-status.ts). |

| 2026-05-29 | P3.B7-DOCS-017 | Agent-Docs + Consiglio AI | REVIEWED | DESIGN 017 — Prestiti, Mutui e Simulazione Finanziaria — anomalie corrette, stato REVIEWED |
| 2026-05-29 | P3.B7-DOCS-018 | Agent-Docs + Consiglio AI | REVIEWED | DESIGN 018 — Confronto Mese su Mese per Categoria — anomalie corrette, stato REVIEWED |
| 2026-05-29 | P3.B7-DOCS-019 | Agent-Docs + Consiglio AI | REVIEWED | DESIGN 019 — Notifiche Budget e Orchestrazione — anomalie corrette, stato REVIEWED |
| 2026-05-29 | P3.B8-PLAN-017 | Agent-Orchestrator | PASSED | Creato e validato `017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md`; Ciclo-G PASS |
| 2026-05-29 | P3.B8-TODO-017 | Agent-Orchestrator | PASSED | Creata e validata `017-TODO_prestiti-mutui-simulazione-finanziaria_v0.1.0.md`; Ciclo-G PASS |
| 2026-05-29 | P3.B8-PLAN-018 | Agent-Orchestrator | PASSED | Creato e validato `018-PLAN_confronto-mese-su-mese-categoria_v0.1.0.md`; Ciclo-G PASS |
| 2026-05-29 | P3.B8-TODO-018 | Agent-Orchestrator | PASSED | Creata e validata `018-TODO_confronto-mese-su-mese-categoria_v0.1.0.md`; Ciclo-G PASS |
| 2026-05-29 | P3.B8-PLAN-019 | Agent-Orchestrator | PASSED | Creato e validato `019-PLAN_notifiche-budget-orchestrazione_v0.1.0.md`; Ciclo-G PASS |
| 2026-05-29 | P3.B8-TODO-019 | Agent-Orchestrator | PASSED | Creata e validata `019-TODO_notifiche-budget-orchestrazione_v0.1.0.md`; Ciclo-G PASS |
| 2026-06-26 | P3.AN-01-PLAN | DUSU-FIX | PASSED | Applicate 10 micro-correzioni pre-codifica su PLAN 021 e TODO 021, stato portato a REVIEWED. |
| 2026-06-26 | P3.B8-AN-01 | DUSU-CODER | DONE | Implementato refactor Haptic System (AN-01) con expo-haptics e AsyncStorage. Test unitari e compilazione superati. |
| 2026-06-26 | P3.B1-IMPL-021 | donny-81 | PASSED | Haptic System nativo — expo-haptics |
| 2026-06-26 | P3.B8-IMPL-020 | Antigravity | DONE | Implementato PLAN 020: token in colors.ts, refactoring template/costanti, rimosso phosphor. Test/Build passati. |
| 2026-06-25 | P3.B9-SQL-P55 | donny-81 | DONE | P55-notifiche.sql eseguito in Supabase. Tabella notifiche creata con indici, RLS e metadata JSONB. PLAN 019 T7 e gate G-019-6 chiusi. |
| 2026-06-25 | P3.B8-IMPL-017 | donny-81 | DONE | Codifica 017 — Prestiti, Mutui e Simulazione Finanziaria: tipi, repository, calcolo ammortamento, integrato AppDataContext. Test passati. |
| 2026-06-25 | P3.B8-IMPL-018 | donny-81 | DONE | Codifica 018 — Confronto Mese su Mese per Categoria: calcolo delta, integrato AppDataContext. Test passati. |
| 2026-06-25 | P3.B8-IMPL-019 | donny-81 | DONE | Codifica 019 — Notifiche Budget e Orchestrazione: config, localizzazione runtime, notification-service aggiornato. Test passati. |
| 2026-06-25 | BC-03-FIX | donny-81 | DONE | Rimozione react-dom da package.json: verificata assenza della dipendenza (chiuso come side-effect di 017-019). |

---

## 7. Archivio Decisioni (Decision Log)

---

### Decision ID: ADR-001
- **Date:** 2026-05-13
- **Context:** L'app era un monolite web React con oltre 1800 righe in un singolo file e storage locale Spark.
- **Decision:** Estrazione della logica in file con responsabilità separate. Migrazione storage da Spark a Supabase.
- **Alternatives Discarded:** Mantenere il monolite e aggiungere React Native sopra — insostenibile a lungo termine.
- **Consequences:** Codebase modulare. Dipendenza da Supabase come backend unico.
- **Triggered By:** Decisione architettuale iniziale — donny-81

---

### Decision ID: ADR-002
- **Date:** 2026-05-13
- **Context:** L'app web usava shadcn/ui e componenti DOM non portabili in React Native.
- **Decision:** Rimozione di tutti i componenti UI web. Mantenuta solo logica e layer dati in preparazione alla riscrittura nativa.
- **Alternatives Discarded:** Wrapper per shadcn/ui — scartato perché shadcn è DOM-only.
- **Consequences:** src/screens/ e src/components/ attualmente vuoti. UI da costruire da zero in P4 e P5.
- **Triggered By:** Decisione architettuale iniziale — donny-81

---

### Decision ID: ADR-003
- **Date:** 2026-05-13
- **Context:** crypto.subtle non è disponibile nel runtime Hermes di React Native.
- **Decision:** hashPin e verifyPin con bcryptjs rimangono invariate. encryptData e decryptData da riscrivere con expo-crypto in fase successiva.
- **Alternatives Discarded:** Sostituire bcryptjs — scartato perché già compatibile RN.
- **Consequences:** Cifratura dati temporaneamente non funzionante. Da affrontare in P1.
- **Triggered By:** REPORT_diagnosi-compatibilita-RN_v0.1.0.md

---

## 7.1 Debiti Tecnici Aperti

### DT-009-N-01 — Blocker build Windows: netinfo + Windows App SDK 1.8.x

- **Data apertura:** 2026-05-25
- **Origine:** PLAN 009-native T3-N5 (validazione build Windows).
- **Sintomo:**
  `Microsoft.WindowsAppSDK.targets(19,9): error : No references
  were found for these Windows App SDK transitive dependencies
  [...] RNCNetInfoCPP.vcxproj`
- **Causa root:** `@react-native-community/netinfo@12.0.1` →
  `windows/RNCNetInfoCPP/RNCNetInfoCPP.vcxproj` non dichiara come
  `PackageReference` esplicite le 9 sub-deps split di Windows App
  SDK 1.8.x (`Microsoft.WindowsAppSDK.{AI, Base, DWrite,
  Foundation, InteractiveExperiences, ML, Runtime, Widgets,
  WinUI}`). I `.targets` di WAS 1.8 verificano la completezza e
  abortiscono il restore.
- **Impatto:** build Windows completa impossibile. Validazione
  runtime di `WinRTSavePickerModule` (PLAN 009-native) bloccata.
  Non blocca la release 0.3.0 del piano padre: blocca solo la
  chiusura del sotto-piano 009-native.
- **Codice nostro coinvolto:** **nessuno**. Il bridge nativo
  (`windows/ZecchinoReact/WinRTSavePickerModule.{h,cpp}`) è
  review-grade e conforme a DESIGN 009-native; aspetta solo
  validazione runtime.
- **Opzioni di sblocco** (ranked):
  1. Attendere PR upstream netinfo che aggiunga le sub-deps WAS
     1.8 esplicite (preferibile).
  2. `patch-package` su netinfo per pinare WAS a 1.7.x compatibile
     (rischio regressione netinfo runtime).
  3. Rimuovere temporaneamente `RNCNetInfoCPP` da
     `windows/ZecchinoReact.sln` + disabilitare init JS netinfo
     (modifica invasiva, perdita feature offline detection).
- **Owner:** maintainer (donny-81)
- **Stato:** APERTO — blocca la validazione runtime Windows del modulo nativo, non la release 0.3.0 del piano padre.

### DT-009-N-02 — Ambiente Android non configurato

- **Data apertura:** 2026-05-25
- **Origine:** PLAN 009-native T3-N5 (verifica non-regressione
  stub Android).
- **Sintomo:** impossibile eseguire
  `npx react-native run-android --variant=debug`: SDK Android /
  emulatore / NDK non installati sulla macchina maintainer.
- **Impatto:** non è possibile validare runtime che il fallback
  `WinRTSavePicker.macos.ts` / `.stub.ts` mantenga
  `{status:'PICKER_UNAVAILABLE'}` su Android. Il modulo nativo
  Windows non altera il bundle Android in alcun modo (Metro
  resolver: `WinRTSavePicker.windows.ts` non viene incluso fuori
  da target windows).
- **Mitigazione attuale:** test Jest mock-based in
  `__tests__/ExportService.test.ts` (FASE 3) coprono il fallback
  PICKER_UNAVAILABLE a livello unit.
- **Nota:** il progetto al momento non ha UI Android specifica;
  Android è target secondario.
- **Opzioni di sblocco:**
  1. Configurare Android SDK + emulatore sulla macchina maintainer
     o su CI dedicata.
  2. Mantenere validazione solo via test unit + smoke su Windows
     finché Android non diventa target primario.
- **Owner:** maintainer (donny-81)
- **Stato:** APERTO — non bloccante per release Windows.

### DT-016-01 — Magic bytes validation allegati

- **Data apertura:** 2026-05-28
- **Origine:** DESIGN 016, Decisione 8, debito DT-016-01
- **Descrizione:** La validazione del tipo di file allegato si ferma al controllo del MIME dichiarato e dell'estensione. Non legge i byte fisici del file per verificare che il contenuto corrisponda al tipo dichiarato. La soluzione è già progettata nel DESIGN 016-ter approvato.
- **Impatto:** rischio minimo di spoofing banale del tipo di file. Non blocca nessuna funzionalità.
- **Riferimento:** docs/2-projects/016-DESIGN_allegati-transazioni_v0.1.0.md
- **Design risolutivo:** docs/2-projects/016-ter-DESIGN_magic-bytes-validation_v0.1.0.md
- **Priorità:** media
- **Stato:** CHIUSO — implementazione verificata nel codice il 2026-06-27. File: src/lib/file-system/magic-bytes-reader.ts.

### DT-016-02 — Cleanup automatico file orfani Storage

- **Data apertura:** 2026-05-28
- **Origine:** DESIGN 016, Decisione 10, debito DT-016-02
- **Descrizione:** Il rollback best-effort dell'upload allegati può lasciare file nel bucket Storage di Supabase senza il record corrispondente nel database. La soluzione automatica è già progettata nel DESIGN 016-bis approvato.
- **Impatto:** accumulo di file orfani nello storage nel tempo. Non blocca funzionalità.
- **Riferimento:** docs/2-projects/016-DESIGN_allegati-transazioni_v0.1.0.md
- **Design risolutivo:** docs/2-projects/016-bis-DESIGN_cleanup-orfani-storage_v0.1.0.md
- **Priorità:** media
- **Stato:** CHIUSO — implementazione verificata nel codice il 2026-06-27. File: src/lib/storage-cleanup-service.ts.

### DT-016-bis-01 — Script CLI manutenzione storage

- **Data apertura:** 2026-05-28
- **Origine:** DESIGN 016-bis, sezione 15
- **Descrizione:** Il cleanup automatico è fire-and-forget dall'app. Non esiste uno strumento a riga di comando per eseguire una pulizia manuale controllata dallo sviluppatore o dal maintainer in autonomia.
- **Impatto:** nessuno sulla funzionalità utente. Limite operativo per manutenzione avanzata.
- **Riferimento:** docs/2-projects/016-bis-DESIGN_cleanup-orfani-storage_v0.1.0.md
- **Priorità:** bassa
- **Stato:** APERTO — espansione futura, non urgente

### DT-016-bis-02 — Edge Functions server-side cleanup

- **Data apertura:** 2026-05-28
- **Origine:** DESIGN 016-bis, sezione 15
- **Descrizione:** Il cleanup attuale è eseguito dal dispositivo dell'utente e funziona solo quando l'app è aperta. Una soluzione server-side tramite Supabase Edge Functions pulirebbe gli orfani in modo indipendente dal dispositivo.
- **Impatto:** nessuno sulla funzionalità utente corrente. Miglioria di robustezza infrastrutturale.
- **Riferimento:** docs/2-projects/016-bis-DESIGN_cleanup-orfani-storage_v0.1.0.md
- **Priorità:** bassa
- **Stato:** APERTO — espansione futura, non urgente

### DT-016-bis-03 — Log opt-in per utenti avanzati

- **Data apertura:** 2026-05-28
- **Origine:** DESIGN 016-bis, sezione 15
- **Descrizione:** Il servizio di cleanup scrive note tecniche solo nella console di sviluppo, invisibili all'utente. Questo debito prevede un registro consultabile attivabile volontariamente dagli utenti esperti.
- **Impatto:** nessuno sulla funzionalità base. Feature opzionale di trasparenza.
- **Riferimento:** docs/2-projects/016-bis-DESIGN_cleanup-orfani-storage_v0.1.0.md
- **Priorità:** bassa
- **Stato:** APERTO — espansione futura, non urgente

### DT-016-ter-01 — Supporto HEIC e WEBP magic bytes

- **Data apertura:** 2026-05-28
- **Origine:** DESIGN 016-ter, sezione 4, Decisione 11
- **Descrizione:** La validazione magic bytes copre solo JPEG, PNG e PDF. I formati HEIC (default iPhone) e WEBP (molto diffuso sul web) non sono riconosciuti e vengono rifiutati. Va aggiunta la loro firma fisica nella lista di riconoscimento.
- **Impatto:** utenti con foto iPhone o WEBP non possono allegare questi formati. Limitazione funzionale per la base utenti mobile.
- **Riferimento:** docs/2-projects/016-ter-DESIGN_magic-bytes-validation_v0.1.0.md
- **Priorità:** media
- **Stato:** CHIUSO — implementazione verificata nel codice il 2026-06-27. File: src/lib/file-system/magic-bytes-reader.ts.

### DT-016-ter-02 — Supporto iOS magic bytes validation

- **Data apertura:** 2026-05-28
- **Origine:** DESIGN 016-ter, sezione 4, Decisione 10
- **Descrizione:** La lettura dei byte fisici del file è implementata per Android (expo-file-system) e Windows (JS-first). iOS è dichiarato fuori perimetro in questo design e usa lo stub che ritorna Uint8Array(0), rifiutando tutti i file.
- **Impatto:** su iOS la validazione magic bytes non funziona. Gli allegati vengono rifiutati al controllo fisico. Richiede un approccio nativo iOS dedicato.
- **Riferimento:** docs/2-projects/016-ter-DESIGN_magic-bytes-validation_v0.1.0.md
- **Priorità:** alta (iOS è target primario)
- **Stato:** APERTO — da progettare prima del rilascio iOS

### DT-016-ter-03 — Bridge nativo Windows per magic bytes

- **Data apertura:** 2026-05-28
- **Origine:** DESIGN 016-ter, sezione 4, Decisione 11
- **Descrizione:** Su Windows la lettura dei byte usa JavaScript puro. Per scenari di file complessi o molto grandi potrebbe servire un bridge nativo scritto in C++ o WinRT per performance e affidabilità.
- **Impatto:** nessuno nelle condizioni normali di utilizzo. Rischio teorico su file limite.
- **Riferimento:** docs/2-projects/016-ter-DESIGN_magic-bytes-validation_v0.1.0.md
- **Priorità:** bassa
- **Stato:** APERTO — miglioramento opzionale

---

## 8. Protocollo di Rollback

> Esistono tre livelli di rollback. L'agente deve sempre partire dal livello più basso possibile.

### Livello 1 — Rollback di Task

Si usa quando un singolo task produce un risultato sbagliato e il problema è circoscritto al file target di quel task.

**Procedura:**
1. Annullare le modifiche al file target.
2. Segnare il task come FAILED nel registro di stato.
3. Rimanere nel blocco corrente — non retrocedere al blocco precedente.
4. Rieseguire il task da zero seguendo le istruzioni del coding plan.
5. Se il task fallisce una seconda volta, attivare HC-1 e inviare il messaggio di escalation.

**Limite di autonomia:** massimo 2 tentativi in autonomia.

---

### Livello 2 — Rollback di Blocco

Si usa quando il gate di un blocco fallisce e il danno coinvolge più file modificati durante quel blocco.

**Procedura:**
1. Documentare nello Snapshot di Ripresa tutti i file toccati durante il blocco.
2. Annullare le modifiche a tutti i file del blocco.
3. Segnare il blocco come FAILED e il gate come FAILED nel registro di stato.
4. Rileggere integralmente il documento di design e il coding plan associati.
5. Rieseguire il blocco dall'inizio, task per task.
6. Se il gate fallisce una seconda volta, attivare HC-3 e inviare il messaggio di escalation.

**Limite di autonomia:** massimo 1 tentativo in autonomia.

---

### Livello 3 — Rollback Inter-Blocco

Si usa quando il fallimento ha radici in un blocco precedente già validato.

**Procedura:**
1. Fermarsi immediatamente. Zero azioni sui file.
2. Documentare nello Snapshot: quale blocco precedente è probabilmente la causa, quale evidenza lo suggerisce, quali file sono coinvolti.
3. Segnare il blocco corrente come FAILED — BLOCKED nel registro di stato.
4. Inviare il messaggio di escalation con HC-3.
5. Attendere istruzione esplicita dell'architetto.

**Limite di autonomia:** zero. Richiede sempre intervento umano.

---

### Punto di Non Ritorno

Alcune operazioni non possono essere disfatte con sicurezza. Prima di eseguirle l'agente deve ottenere conferma esplicita dell'architetto.

La conferma è richiesta per qualsiasi operazione **non esplicitamente prevista nel coding plan attivo**, e sempre per:
- Eliminazione di file o directory
- Qualsiasi operazione su database reale (non placeholder)
- Rinomina di file importati da più moduli

La conferma **non è richiesta** per modifiche a file di configurazione (babel.config.js, package.json, tsconfig.json e simili) quando la modifica è descritta in modo esplicito nel coding plan attivo del blocco corrente.

**Formato di richiesta conferma:**

```
CONFERMA RICHIESTA — [Task ID]
Operazione: [descrizione dell'operazione irreversibile]
File o risorse coinvolte: [lista]
Motivo per cui è irreversibile: [spiegazione in una riga]
Istruzione del piano che la richiede: [riferimento al documento e sezione]
Confermare con: "PROCEDI [Task ID]"
```

---

## 9. Glossario Operativo

| Termine | Definizione |
|---------|-------------|
| **Task atomico** | Un'azione che modifica uno e un solo file e produce un risultato verificabile in modo diretto. |
| **Gate** | Procedura di verifica obbligatoria al termine di un blocco. Un blocco non è concluso finché il gate non è PASSED. |
| **Blocco validato** | Un blocco il cui gate è stato superato e che è stato marcato DONE. Non può essere modificato senza rollback di livello 3. |
| **Scope** | L'insieme esplicito di file e operazioni consentite in un blocco. Qualsiasi modifica fuori scope è una Forbidden Action. |
| **Escalation** | Comunicazione formale verso l'architetto che sospende l'autonomia dell'agente. |
| **Punto di non ritorno** | Operazione irreversibile che richiede conferma esplicita prima dell'esecuzione. |
| **Snapshot di Ripresa** | Registro dello stato aggiornato a fine sessione che permette la ripresa senza esplorazione manuale. |
| **Session Open** | Procedura obbligatoria di avvio sessione definita nella sezione 2b. Si applica solo alle sessioni di lavoro umane, non ai Context Refresh tecnici. Nessun task può essere eseguito prima che sia completata. |
| **Context Refresh** | Reset tecnico della memoria dell'agente definito nella sezione 1. Non equivale a una nuova sessione di lavoro umana e non attiva il protocollo Session Open. |

---

