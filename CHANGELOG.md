# CHANGELOG

## [Unreleased]

### DESIGN 001 — 2026-05-22 (Fix Blocchi di Avvio React Native / Expo)

Risolti i sei blocchi di build documentati in
`docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md`
(B1 babel alias `@/`, B2 variabili ambiente `@env`, B3 import `sonner`,
B4 dialog DOM in AuthContext, B5 versione AsyncStorage fantasma,
B6 plugin `react-native-dotenv` non configurato). Applicato lo scope
definito da `docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md`
e dal coding plan `docs/3-coding-plans/001-PLAN_fix-blocchi-avvio_v0.1.0.md`.

#### Aggiunto
- `src/env.d.ts` (CREATO) — dichiarazione modulo `@env` con
  `SUPABASE_URL` e `SUPABASE_ANON_KEY` tipizzate come `string`.
  Sblocca l'import tipato in `src/lib/supabase/client.ts`.
- `src/components/ui/button.tsx` (CREATO) — placeholder RN del
  componente `Button` (wrapper su `TouchableOpacity`/`Text`) con alias
  `onClick → onPress` per compatibilita' con il codice web superstite.
  Soddisfa l'import gia' presente in `src/context/AuthContext.tsx`.

#### Modificato
- `babel.config.js` (MODIFICATO) — aggiunti due plugin all'array
  `plugins`: `react-native-dotenv` (moduleName `@env`, allowlist
  `SUPABASE_URL`/`SUPABASE_ANON_KEY`, `allowUndefined: false`) e
  `module-resolver` (root `./src`, alias `@ → ./src`, estensioni RN
  multi-piattaforma). Ordine obbligatorio: dotenv prima del resolver.
- `package.json` (MODIFICATO) — `@react-native-async-storage/async-storage`
  da `^3.0.2` (versione fantasma non pubblicata su npm) a `^2.1.2`;
  aggiunto `babel-plugin-module-resolver: ^5.0.3` alle devDependencies.
- `src/lib/supabase/client.ts` (MODIFICATO) — sostituito
  `process.env.SUPABASE_URL`/`SUPABASE_ANON_KEY` (non risolto da Metro)
  con `import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'`.
  Mantenuti i throw di validazione e l'export di `supabase` invariati.
- `src/context/AuthContext.tsx` (MODIFICATO) — rimosso import
  `from 'sonner'` (pacchetto DOM-only non installato); sostituito da
  shim locale `sonnerNotify` con `success`/`error` che inoltrano a
  `console`. Convertito il dialog di scadenza sessione: `<div>` →
  `<View>`, `<p>` → `<Text>`, `role="alertdialog"` →
  `accessibilityRole="alert"`, `aria-label` → `accessibilityLabel`,
  `onClick` → `onPress`. Aggiunti import `View, Text` da `react-native`.
  La chiamata `screenReader.announceSuccess('Sessione mantenuta attiva.')`
  e' stata commentata come TODO (sara' ripristinata quando il layer
  screen reader sara' migrato a RN in DESIGN 002).
- `src/context/AppDataContext.tsx` (MODIFICATO) — rimosso import
  `from 'sonner'`; sostituito da shim locale `toast` **callable**
  (la firma estende il PLAN per supportare la call site
  `toast(title, { description, duration })` presente in
  `checkBudgetNotifications`, oltre ai metodi `success`/`error`/`warning`).
  Tutti i 23+ call site preesistenti restano invariati.

#### Fixed
- App ora bundlable: Metro risolve l'alias `@/` (B1) e le variabili
  `@env` (B2+B6); `npm install` completa senza errori 404 su
  AsyncStorage (B5); `tsc --noEmit` non segnala piu' import irrisolti
  `sonner` (B3); il dialog di scadenza sessione non monta piu' tag DOM
  incompatibili con Hermes/React Native (B4).

#### Note operative
- Validazione runtime ancora da eseguire: `npm install`, `npx tsc --noEmit`,
  `npm start` (osservare 30s di log Metro). Test E2E platform-specific
  rimandati alla fase di montaggio provider (DESIGN 002).
- Le chiamate `document.querySelector` superstiti in
  `src/context/AuthContext.tsx` (rilevamento screen reader) appartengono
  al perimetro di DESIGN 002 (N8) e non sono toccate in questa fase.

### DESIGN 003 — 2026-05-21 (implementazione accessibility engine)

#### Aggiunto
- `src/accessibility/types.ts` (CREATO) — Tipi condivisi tra i layer
  accessibility: `AnnouncementPriority`, `Announcement`, `TalkBackState`,
  `TalkBackAdaptations`. Entry point dei contratti pubblici per engine.ts,
  detection.ts e il futuro layer announcements/ (DESIGN 004).
- `src/accessibility/engine.ts` (CREATO) — Singleton `engine` che incapsula
  `AccessibilityInfo.announceForAccessibility`. Stateless, fire-and-forget,
  zero dipendenze DOM. Unico punto di chiamata per tutti gli annunci screen
  reader (sarà invocato da `announcements/index.ts` in DESIGN 004, mai
  direttamente dall'app). Guard `__DEV__` per fallback logging su piattaforme
  senza `announceForAccessibility`.
- `src/accessibility/detection.ts` (CREATO) — Hook `useAccessibilityDetection()`
  che sostituisce `src/hooks/use-talkback.ts`. Usa esclusivamente
  `AccessibilityInfo.isScreenReaderEnabled()` e
  `AccessibilityInfo.addEventListener('screenReaderChanged', ...)` — zero API
  DOM/browser. Persiste adattazioni in Supabase tramite `useUserSettings()`.
  Esporta `DEFAULT_ADAPTATIONS` e il contratto pubblico completo documentato
  in DESIGN 003 §5.7.
- `src/locales/it.ts` (CREATO) — Scaffolding localizzazione italiano.
  Struttura `as const` vuota, predisposta per espansione in DESIGN 004+.
  Esporta i tipi `Strings` e `StringKey`.
- `src/locales/index.ts` (CREATO) — Entry point del sistema di localizzazione.
  Esporta `{ strings }` e `type { Strings, StringKey }`.

#### Rimosso
- `src/hooks/use-talkback.ts` (ELIMINATO) — Rimosso dopo conferma assenza
  consumatori (T6: 0 import nel codebase). Sostituito da
  `src/accessibility/detection.ts`. Eliminava 5 errori tsc pre-esistenti
  legati ad API DOM (`window`, `navigator.maxTouchPoints`, `sessionStorage`).

### Docs — 2026-05-21 (correzioni documentali DESIGN 003 e ADR_001 — sette fix validati)

#### Modificato
- `docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md`
  (MODIFICATO) — applicate sette correzioni validate dal Consiglio AI
  (Perplexity, Claude, ChatGPT, DeepSeek, Gemini):
  - C1: frontmatter integrato con `autore: donny-81`, `revisore: Consiglio AI`,
    `governance-version: 1.0.0`, `stato-revisione: VALIDATO`. Stato bump:
    `REVIEWED` → `CORRETTO — IN ATTESA DI IMPLEMENTAZIONE`,
    `data-ultima-revisione: 2026-05-21`.
  - C2: `src/context/AuthContext.tsx` inserito esplicitamente nel perimetro
    frontmatter (PATCH minimale: solo riga di import). §9 e §11 riformulate:
    rimossa classificazione "fuori perimetro engine" per il singolo import;
    confermata fuori perimetro solo l'integrazione architetturale completa.
  - C3: §10 risk matrix integrata con R7 — `screen-reader.ts` senza guard DOM
    (probabilità Alta, impatto Alto, nota operativa attiva PIN/sblocco privato).
  - C4: §2 grafo dipendenze formalizza esplicitamente T6 → T3 (e T7 → T6),
    STEP 4 spezzato in 4a (PATCH AuthContext) e 4b (DELETE use-talkback).
  - C5: nuova sottosezione §5.7 con il contratto pubblico di
    `useAccessibilityDetection()` (firma, tipo del ritorno, comportamento
    atteso, regole di stabilità per DESIGN 004).
  - C6: frontmatter integrato con `dipendenze-a-monte` (DESIGN 002 + DESIGN 001
    transitiva) e `dipendenze-a-valle` (DESIGN 004).
- `docs/0-architecture/ADR_001_sistema-annunci-accessibili.md`
  (MODIFICATO) — C7: bump versione `1.2.0` → `1.3.0`,
  `data: 2026-05-21`. Aggiunta eccezione 1.bis alla Regola 1 di dipendenza
  (`announcements/types.ts` può importare da `accessibility/types.ts`
  esclusivamente come `import type`). Aggiornata riga 003-DESIGN nella
  tabella "Impatto sui documenti esistenti". Aggiunta sezione "Storia del
  documento" con changelog di versione.

Report di convalida di riferimento:
`docs/1-reports/REPORT_analisi-coerenza_DESIGN-003_v1.0.0.md`.

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
