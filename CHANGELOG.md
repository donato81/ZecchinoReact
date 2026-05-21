# CHANGELOG

## [Unreleased]

### Docs — 2026-05-21 (analisi coerenza DESIGN 003 + PLAN 003)

#### Aggiunto
- `docs/1-reports/REPORT_analisi-coerenza_DESIGN-003_v1.0.0.md`
  (CREATO) — Report analisi coerenza e validazione DESIGN 003 e PLAN 003.
  Quattro incoerenze documentali identificate: C1 CRITICA (contraddizione
  §9/§11 DESIGN vs Task T6 PLAN su AuthContext.tsx), A1/A2/A3 ALTE
  (eccezione ADR non formalizzata, rischio RA guard DOM non quantificato,
  autore/revisore assenti), M1–M4 MEDIE. Verdetto: PRONTO CON RISERVE
  su entrambi i documenti. Generato da Copilot Agent (Analyzer).

### Docs — 2026-05-21 (correzioni A1/A2/A3 + nota C2)

#### Modificato
- `docs/3-coding-plans/001-PLAN_fix-blocchi-avvio_v0.1.0.md`
  (MODIFICATO) — A1: rimosso riferimento stale a "sezione 10 DESIGN"
  nell'intestazione del Gate di verifica globale.
- `docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md`
  (MODIFICATO) — A3: corretto ordine N11/N8/N6 nel campo `titolo` del
  frontmatter (allineato a ordine di implementazione in corpo e PLAN 002).
  A2a saltata: `[NESSUN RIFERIMENTO TROVATO]` — il DESIGN 002 non cita
  numeri di riga espliciti per `isScreenReaderActive`.
- `docs/3-coding-plans/002-PLAN_fix-provider-bootstrap_v0.2.0.md`
  (MODIFICATO) — C2-NOTA: aggiunta sezione "Nota operativa — Risk C2
  (screen-reader.ts)" immediatamente prima di "Note per code-Agent-Code".
  La nota avvisa l'implementatore di non testare i path PIN/sblocco
  privato (unlockPrivate, setPin, changePin, removePin) fino al
  completamento di DESIGN 003, per evitare `ReferenceError: document
  is not defined` originato da `initializeLiveRegions()` privo di guard
  in `src/lib/screen-reader.ts`.
- `docs/4-todo-lists/002-TODO_fix-provider-bootstrap_v0.2.0.md`
  (MODIFICATO) — A2b: aggiornato riferimento righe nel task N8-3 da
  "righe 63–65" a "righe 62–64" (verificato direttamente in
  `src/context/AuthContext.tsx`, offset di 1 riga). Altre menzioni
  "63–65" presenti nei gate N8/GLOBAL restano fuori dal perimetro
  esplicito dell'operazione A2b (solo testo del task N8-3).

### Docs — 2026-05-20 (analisi coerenza)

#### Aggiunto
- `docs/1-reports/REPORT_analisi-coerenza_DESIGN-001-002_v1.0.0.md`
  (CREATO) — Report analisi coerenza e validazione DESIGN 001 e DESIGN 002.
  Sei incoerenze documentali identificate (nessuna bloccante per la
  correttezza tecnica), due punti di attenzione critici (App.test.tsx e
  Risk R5 screen-reader.ts), cinque gap di copertura test documentati.
  Generato da Copilot Agent (Analyzer).

### Docs — 2026-05-20 (aggiornamento)

#### Modificato
- `docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md` (REVIEWED) —
  chiuse precondizioni P2 e P3 con esito di verifica documentato.
  Marcatura stato da DRAFT a REVIEWED. Precondizione P1 residua:
  identificazione TurboModule WinRT Save Picker prima del Coding Plan 009.
- `docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md` — aggiornata
  strategia Windows nelle Sezioni 6, 9 e 10 a seguito della verifica
  delle precondizioni P1/P2/P3 da parte del consiglio AI.
  Distinzione esplicita tra scrittura file (@react-native-windows/fs)
  e selezione destinazione utente (WinRT Save Picker via TurboModule).
  P2 soddisfatta (react-native-share compatibile con RN 0.82.1).
  P3 verificata (nessun consumer runtime esterno di handleExportCSV).
  P1 ridefinita: precondizione residua identificata nel TurboModule
  WinRT picker.
- `__tests__/ExportService.test.ts` — aggiunti casi placeholder per
  la strategia Windows a due componenti (Layer A e Layer B).

### Docs — 2026-05-20

#### Aggiunto
- `docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md` (CREATO) — documento di design per il *delivery layer* di export file nativo multi-formato e multi-piattaforma. Architettura a tre layer: `exportToCSV` in `src/lib/helpers.ts` (generazione contenuto, invariata) / nuovo `ExportService` in `src/lib/export-service.ts` (delivery infrastrutturale asincrono, nessuna dipendenza React, nessun side effect UX) / `AppDataContext.tsx` (orchestrazione + side effect UX). Contratto `ExportResult` con sette classi di errore OS-native (`CANCELLED`, `PERMISSION_DENIED`, `FILESYSTEM_ERROR`, `UNSUPPORTED_PLATFORM`, `INVALID_PATH`, `INSUFFICIENT_SPACE`, `UNKNOWN`). Strategia multi-piattaforma: share sheet nativa su iOS/Android (`react-native-share`), save file dialog su Windows (`react-native-fs` o alternativa, soggetta a verifica di compatibilità con RNW 0.82.x). Struttura future-proof per formati multipli (CSV implementato; PDF/XLSX/altri rimandati). Breaking change documentato: firma `handleExportCSV` da `void` a `Promise<void>`. Risolve il punto N10 del report di diagnosi compatibilità React Native. Stato DRAFT.
- `docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md` (CREATO) — definisce il *connectivity contract* dell'applicazione, sostituendo il rilevamento di rete basato su `navigator.onLine` e `window.addEventListener('online'|'offline')` (non funzionante in React Native) con un produttore centralizzato basato su NetInfo (`NetworkStatusProvider` + hook pubblico `useNetworkStatus`). Formalizza la semantica offline con distinzione `isConnected`/`isInternetReachable` (inclusa captive portal), il debounce direzionale 1000ms sul flapping online→offline, la strategia Fail-Safe Online-First per il fallback Windows, la posizione del provider nell'albero e il boundary producer-consumer con DESIGN 007. Perimetro: `src/hooks/use-online-status.ts`, `src/context/AppDataContext.tsx`. Risolve il punto N5 del report di diagnosi compatibilità React Native. Stato DRAFT.
- `docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md` (CREATO) — definisce il bootstrap lifecycle e la state machine di hydration per `AppDataContext.tsx`. Formalizza il contratto di `isLoading`/`isDataReady`, la strategia cache-first/stale-while-revalidate, la distinzione tra vuoto legittimo ed errore, la gestione della concorrenza di `refreshAll` e la failure strategy per `writeCache`. Risolve il punto N9 del report di diagnosi compatibilità React Native. Stato DRAFT.
- `docs/design/DESIGN_006_kdf-pin.md` (CREATO) — documento di design architetturale per la Key Derivation Function del PIN privato: sostituzione della derivazione debole (padding/troncatura) con PBKDF2-SHA256 (`@noble/hashes`); salt casuale 16 byte persistito in colonna `pin_kdf_salt` su Supabase; versionamento payload `[KDF_VERSION | SALT | IV | Ciphertext | AuthTag]`; golden vectors K1–K3 (semantica); impatto su `DbUserSettings`, `UserSettings` e repository `updatePinSalt`.

#### Modificato
- **`docs/2-projects/006-DESIGN_kdf-pin_v0.2.0.md` — Correzioni pre-REVIEWED (20 maggio 2026)**
  - Sezione 4: aggiunto floor minimo invalicabile di 100.000 iterazioni PBKDF2-SHA256 con riferimento esplicito alle raccomandazioni OWASP contemporanee.
  - Sezione 7: aggiunto richiamo esplicito al floor minimo e procedura per documentare il tradeoff se non raggiungibile entro il budget 100–300 ms.
  - Sezione 10, Passo 3: rimossa ambiguità architetturale tra salt embedded nel payload e salt Supabase. Il salt embedded è ora dichiarato esplicitamente come fonte di verità per la decifratura. Il salt Supabase non è più indicato come criterio bloccante per i payload esistenti. L'integrità crittografica è delegata all'AuthTag AES-GCM.
- `docs/2-projects/006-DESIGN_kdf-pin_v0.1.0.md` (v0.1.0 → v0.2.0) — tre aggiunte dichiarative: (1) vincolo di atomicità logica tra `pin_privato_hash` e `pin_kdf_salt` nella sequenza di impostazione PIN (sezione 10); (2) garanzia di decifrabilità dei dati storici dopo cambio PIN, tramite salt incorporato nel payload (sezione 10); (3) dichiarazione esplicita di assenza di payload legacy senza version byte e obbligatorietà di `KDF_VERSION` per tutti i payload PIN (sezione 11).
- `docs/2-projects/005-DESIGN_sostituzione-crypto-N4_v0.3.0.md` (v0.3.0 → v0.4.0) — aggiunte quattro micro-correzioni documentali di chiarimento architetturale: formalizzata semantica async delle funzioni pubbliche (C1); aggiunta distinzione esplicita tra IV deterministici nei test e IV casuali in produzione (C2); chiarito scope del polyfill `react-native-get-random-values` limitato a `getRandomValues` e non a `crypto.subtle` (C3); C4 non applicata per assenza della frase target nel documento. Appendice estesa con caso **A1** (contratto asincrono) in "Casi aggiuntivi" e nuova sezione "Casi di sicurezza RNG" con caso **S1** (IV casuale in produzione).

### Docs — 2026-05-19

#### Aggiunto
- `docs/2-projects/005-DESIGN_sostituzione-crypto-N4_v0.3.0.md` (CREATED) — documento di design architetturale per N4: sostituzione di `crypto.subtle` con `@noble/ciphers` (pure-JS, compatibile con Hermes); include analisi payload, golden test vectors, tradeoff sicurezza, debolezza KDF documentata come rinviata
- `docs/3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md` (CREATED) — coding plan estratto da DESIGN 003, task T1-T8
- `docs/3-coding-plans/004-PLAN_announcements-layer_v1_0_0.md` (CREATED) — coding plan estratto da DESIGN 004, task T1-T14

#### Modificato
- `docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md` — rimosso contenuto tecnico-implementativo (code block, bash, gate di verifica); mantenuto contenuto logico-cognitivo §1–§7; PLAN 001 non richiede aggiornamenti
- `docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md` — rimosso contenuto tecnico-implementativo (code block, bash, gate di verifica); mantenuto contenuto logico-cognitivo §1–§5 incluse Opzione A/B per N6; PLAN 002 non richiede aggiornamenti
- `docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md` — sezioni implementative sostituite con riferimenti incrociati al coding plan 003
- `docs/2-projects/004-DESIGN_announcements-layer_v1_0_0.md` — sezioni implementative sostituite con riferimenti incrociati al coding plan 004
- `docs/todo-master.md` — Snapshot di Ripresa aggiornato; Reference Documents aggiunti a Fase P1 e P2


## [0.1.0] - 2026-05-13

### Origini del progetto
- App nata come applicazione web con GitHub

### Migrato
- Logica applicativa estratta dal file monolitico originale (1800+ righe)
  e suddivisa in file con responsabilità separate
- Salvataggio dati migrato da storage locale Spark a database Supabase
- Progetto migrato da applicazione web browser a React Native
- Componenti di interfaccia web rimossi; mantenuta solo la logica
  e il layer dati in preparazione alla riscrittura nativa

### Corretto
- Nessuna correzione ancora applicata in questa versione base
  (i fix B1-B6 saranno documentati nella versione 0.1.1)

### Noto
- B1: alias @/ non risolti da Metro (manca babel-plugin-module-resolver)
- B2: variabili ambiente Supabase non disponibili a runtime in RN
  (process.env non funziona in React Native, serve react-native-dotenv)
- B3: import sonner non compatibile con React Native
  (sonner è una libreria web)
- B4: componente Button importato da libreria DOM, non da React Native
- B5: versione AsyncStorage ^3.0.2 inesistente su npm
- B6: conseguenza diretta di B2, risolto quando B2 è risolto
