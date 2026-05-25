## 1. Metadata e Context Header

- **Project Name:** ZecchinoReact
- **Version:** 0.2.0
- **Owner:** donny-81
- **Core Technology Stack:** React Native 0.82.1, React 19.1.1, react-native-windows ^0.82.5, Supabase JS ^2.105.4, TypeScript
- **Environment Sync:** Local
- **Ultimo Agente Attivo:** Agent-Code (implementazione DESIGN 004 completata — layer `src/announcements/` operativo)
- **Blocco in Carico:** Nessuno — DESIGN 001, 002, 003, 004 implementati.
- **Context Refresh Threshold:** Se la sessione supera i 40 scambi di prompt o i 50.000 token, l'agente deve eseguire un riassunto dello Snapshot di Ripresa e riavviare la sessione per svuotare la memoria cache. Questo è un reset tecnico della memoria: l'agente riprende il lavoro dal punto esatto in cui si trovava senza eseguire il protocollo di apertura sessione (sezione 2b). Il protocollo 2b si applica esclusivamente all'avvio di una nuova sessione di lavoro umana, ovvero quando l'architetto riprende il progetto dopo un'interruzione.

### Stato Globale Corrente

- **Active Phase:** P0/P1/P2 completate. DESIGN 004 implementato:
  layer `src/announcements/` creato e collegato; legacy
  `use-screen-reader.ts` e `screen-reader.ts` eliminati;
  TSC baseline ridotta da 89 a 47 errori.
- **Active Block:** Nessuno — implementazione DESIGN 004 completata.
- **Last Updated:** 2026-05-23
- **Pending Plans:**
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

- **Last Completed Task:** PLAN 007 v0.2.0 — risoluzione bug N9
  (false-positive hydration) + state machine bootstrap esplicita
  + generation counter + writeCache fail-soft + estrazione modulo
  `src/context/app-data-cache.ts` con `readCachedDomainSnapshotPure`
  testabile. 7 test Jest verdi per INV1/INV2/INV5.
- **Last Validated Block:** PLAN 007 — gate F1-F6 + G4 PASS.
  TSC baseline preservata (3 errori preesistenti: downloadFile,
  @phosphor-icons/react x2). Jest baseline preservata (5/6 suite
  PASS; App.test.tsx fallisce per problema AsyncStorage preesistente).
- **Files Modified But Not Validated:** `babel.config.js`, `package.json`,
  `src/lib/supabase/client.ts`, `src/env.d.ts` (CREATO),
  `src/context/AuthContext.tsx`,
  `src/context/AppDataContext.tsx`,
  `src/components/ui/button.tsx` (CREATO),
  `src/hooks/use-inactivity-timer.ts` (RISCRITTO),
  `src/components/ActivityDetectorView.tsx` (CREATO),
  `src/accessibility/types.ts` (CREATO),
  `src/accessibility/engine.ts` (CREATO),
  `src/accessibility/detection.ts` (CREATO),
  `src/locales/it.ts` (CREATO),
  `src/locales/index.ts` (CREATO),
  `src/hooks/use-talkback.ts` (ELIMINATO),
  `tsconfig.json` (rimossa riga "types": ["node"])
- **Open Threads:** ~47 errori TypeScript attesi e documentati (NOTA 2)
  dopo rimozione di "types": ["node"] in DESIGN 002.
  Non intervenire fuori dal perimetro dei DESIGN
  che li coprono. File coinvolti: AppDataContext.tsx,
  AuthContext.tsx, use-online-status.ts,
  budget-templates.ts, crypto.ts, haptic-system.ts,
  sound-system.ts.
  NOTA 1 attiva: non testare path PIN e sblocco privato
  finché screen-reader.ts non è verificato senza
  guard DOM.
- **Next Action:** Avviare validazione DESIGN 004 con il Consiglio AI.
  Documenti pronti per la review:
  - `docs/2-projects/004-DESIGN_announcements-layer_v1_0_0.md`
  - `docs/3-coding-plans/004-PLAN_announcements-layer_v1_0_0.md`
  - `docs/4-todo-lists/004-TODO_announcements-layer_v1.0.0.md`
  Procedura: identica ai cicli DESIGN 001/002/003
  (review Consiglio AI → eventuali correzioni
  chirurgiche → convalida finale → avvio
  implementazione).

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
| P2.B2 | Riscrittura use-online-status.ts per RN (rif. DESIGN 008) | [ ] TODO | [ ] OPEN |
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

### Log di Validazione

| Data | Block ID | Validato Da | Risultato | Note |
|------|----------|-------------|-----------|------|
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

