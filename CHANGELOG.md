# CHANGELOG

## [0.18.0] — 2026-06-28 — Copertura Test Unitari Moduli Core (Fase B & C)

### Added
- test(budget-forecasting): suite completa di 18 test unitari per previsioni budget.
- test(budget-history): suite di 12 test unitari per periodi, trend e confronti.
- test(budget-templates): suite di 7 test unitari per template standard e mappatura.
- test(kdf-provider): suite di 8 test unitari per derivazione chiave nativa/Node.
- test(helpers): suite di 13 test unitari per calcoli saldi, proiezioni e CSV.
- test(accessibility-engine): suite di 5 test unitari per sintesi annunci fire-and-forget.
- test(accessibility-detection): suite di 14 test unitari per hook rilevamento TalkBack e adattamenti UI.
- test(AppDataContext): implementati i 12 test todo per la macchina a stati, gestione concorrenza (generation counter) e cache fail-soft in `__tests__/AppDataContext.spec.ts`.

### Fixed
- fix(kdf-provider): aggiunto early return per `keyLength === 0` per evitare crash crittografici nativi Node.
- fix(helpers): allineamento tipi con campo obbligatorio `cifrato` per conformità TypeScript compiler.
- fix(kdf-provider-test): corretto il mock di `react-native-quick-crypto` tramite getters dinamici evitando conflitti di cache tra i test.
- fix(accessibility-engine-test): risolti errori preesistenti TypeScript relativi a global e `__DEV__`.
- fix(AppDataContext-test): allineato riferimento `process` a `globalThis.process` per la corretta compilazione del modulo di test.

## [2026-06-27] — Correzione bug moduli core
- fix(helpers): corregge escaping virgolette in exportToCSV — src/lib/helpers.ts
- fix(budget-history): corregge roll-over date setMonth su giorni > 28 — src/lib/budget-history.ts
- fix(budget-forecasting): rimuove chiamata morta a calculateBudgetTrend — src/lib/budget-forecasting.ts
- fix(budget-templates): rende confronto categorie case-insensitive — src/lib/budget-templates.ts

## [2026-06-27] — Piano di test moduli core (Fase A)
### docs/1-reports/REPORT-piano-test-moduli-core_v1.0.0.md
- Creato il report con il piano di test dettagliato per i sette moduli core del progetto.
- Analisi approfondita dei flussi normali, casi limite, scenari di errore e note architetturali per i moduli:
  - `src/lib/budget-forecasting.ts`
  - `src/lib/budget-history.ts`
  - `src/lib/budget-templates.ts`
  - `src/lib/kdf-provider.ts`
  - `src/lib/helpers.ts`
  - `src/accessibility/engine.ts`
  - `src/accessibility/detection.ts`
- Documento impostato in attesa di revisione da parte dell'architetto.

## [2026-06-27] — Todo list 022 Sound System
### docs/4-todo-lists/022-TODO_sound-system_v0.1.0.md
- Creato file todo-list per PLAN 022 Sound System
- Organizzazione per sistema operativo:
  trasversale, Android, Windows
- 4 task con subtask verificabili
- 20 test T01-T20 con caselle singole
- Gate G-022-WIN con comandi operativi
- 5 debiti tecnici e 4 invarianti registrati

## [2026-06-27] — Correzione PLAN 022
### docs/3-coding-plans/022-PLAN_sound-system_v0.1.0.md
- Chiusura delibera PA-01:
  lock e private-lock mappano a navigation,
  unlock mappa a success
- Subtask 4.6: lista legacy portata da 14 a 16 suoni
  (aggiunti budget-created e goal-created)
- Gate G-022-WIN: aggiunto comando di verifica
  operativo grep e Node cross-platform
- Aggiunta sezione Precedente metodologico
  con riferimento a PLAN 021 haptic-system
- Stato frontmatter: bozza -> approvato

## [0.1.1] — 2026-06-27

### PLAN 022 — Sound System
- Aggiunto coding plan 022-PLAN_sound-system_v0.1.0.md
- Riferimento: DESIGN 022 versione 0.1.1
- Blocco AN-02

### DESIGN 022 — Sound System
- Corretto conteggio union SoundType: 91 totali (non 87)
- Rimossa affermazione errata "nessun consumer reale"
- Introdotti CanonicalSoundType e LegacySoundType
- Aggiunta normalizeSoundType() con tabella mapping legacy
- Rimossi tutti i link file:/// non portabili
- Aggiunta nota esplicita: initialize() va rimosso
- Aggiunta nota: playSequence() deve usare currentTime
- warning: forma d'onda resa deterministica (square)
- navigation: ADSR completato con valori reali dal sorgente
- Chiarito: enabled=false dopo errore e' solo runtime
- Aggiunta nota compatibilita' RN 0.82 / New Architecture
- Platform.OS === 'windows' dichiarato come fallback temporaneo
- LaTeX sostituito con testo piano per accessibilita' NVDA
- Test T11 rafforzato, aggiunti T18, T19, T20
- Aggiunto DT-022-05: rimozione progressiva legacy e nota architetturale su suoni nei context come temporanei

## [0.13.9] — 2026-05-28 — Reallineamento versione

### Versioning

- Versione riallineata da 0.4.0 a 0.13.9 per coerenza con lo stato reale del progetto. La versione precedente rifletteva i passi tecnici della migrazione da web a React Native, non la maturita funzionale effettiva.
- Criteri applicati: primo numero fermo a 0 per assenza di UI completa e navigabile su una piattaforma reale; secondo numero portato a 13 per le aree funzionali implementate e validate; terzo numero portato a 9 per i blocchi tecnici validati aggiuntivi non gia contati come aree funzionali.
- Aree funzionali conteggiate: autenticazione e sessione Supabase, sicurezza PIN e crittografia avanzata, gestione conti, gestione transazioni, gestione categorie, gestione budget con soglie di allerta, gestione obiettivi di risparmio, export, ricorrenze, tag, notifiche, allegati, accessibilita e layer annunci per screen reader.

## [0.16.0] — 2026-06-26 — Prestiti, confronto mensile e orchestrazione notifiche

### Added

- Modulo 017: tipi PrestitoMutuo e RimborsoPrestitoMutuo in types.ts, repository prestiti.ts e prestiti-rimborsi.ts, calcolo ammortamento loan-calculator.ts con metodo francese e italiano, integrazione domain object in AppDataContext, suite test loan-calculator.test.ts, prestiti.repository.test.ts, prestiti-rimborsi.repository.test.ts (2026-06-25).
- Modulo 018: monthly-comparison.ts con calcolo delta mese su mese per categoria, tipo MonthlyComparison in types.ts, suite test monthly-comparison.test.ts (2026-06-25).
- Modulo 019: budget-notification-config.ts con soglie e tipo NotificationLevel, tipo BudgetNotificationMetadata in types.ts, riallineamento repository notifiche con titolo_key, messaggio_key e livello, aggiornamento notification-service con mappatura chiavi, chiavi di localizzazione warning, critical, exceeded in it.ts, migration SQL P55-notifiche-riallineamento.sql eseguita in Supabase (2026-06-25).
- Modulo 020: Centralizzazione design tokens (DESIGN 020, PLAN 020, TODO 020). Creato `src/lib/design-tokens/colors.ts` con colori semantici e chiavi icone centralizzate. Refactoring di `src/lib/budget-templates.ts` e `src/lib/constants.ts` (2026-06-26).

### Changed

- AppDataContext aggiornato con slice prestiti e rimborsi nel domain object globale.
- Suite test AppDataContext.spec.ts estesa con mock per i nuovi repository.
- Formatter Prettier applicato su tutti i file src e tests modificati nella sequenza 017-019.

### Fixed

- Risolti blocchi build Android: BC-01 (rimossa dipendenza da `@phosphor-icons/react` in budget-templates.ts), BC-02 (rimosso `@phosphor-icons/react` da package.json), BC-03 (verificato `react-dom` assente da package.json).

### Removed

- Rimossa la dipendenza `@phosphor-icons/react` da dependencies in package.json (2026-06-26).

### Open Threads

- AN-01: src/lib/haptic-system.ts, riscrittura con Vibration RN (TODO P1.B1).
- AN-02: src/lib/sound-system.ts, riscrittura con API RN (TODO P1.B2).
- AN-03: oklch colori, da verificare per compatibilità Android (da DESIGN 020).

## [0.16.1] — 2026-06-26 — Haptic System nativo (AN-01)

### Added
- feat(haptic): implementa haptic-system nativo con expo-haptics — rimozione navigator.vibrate(), persistenza AsyncStorage, shim @deprecated 33 metodi legacy, supporto Platform.OS Windows no-op, sincronizzazione Supabase UserPreferences haptic_enabled. Chiude AN-01.
- docs(design): aggiunto documento di design 021 — refactor haptic-system AN-01
- docs: micro-correzioni pre-codifica PLAN 021 e TODO 021 — mapping shim vincolante, dipendenze test, bootstrap fail-closed, aggiornamento frontmatter PLAN 021 da DRAFT a REVIEWED.
- Redazione Coding Plan AN-01: docs/3-coding-plans/021-PLAN_haptic-system_v0.1.0.md
- Redazione Todo Specifico AN-01: docs/4-todo-lists/021-TODO_haptic-system_v0.1.0.md

### Fixed
- AN-01: rimosso navigator.vibrate(), sostituito con expo-haptics.
  Chiude il debito tecnico AN-01 identificato nel REPORT compatibilità Android v1.0.0.

### Open Threads aggiornati
- AN-01: CLOSED
- AN-02: src/lib/sound-system.ts, riscrittura con API RN (TODO P1.B2) — APERTO
- AN-03: oklch colori, compatibilità Android — APERTO

## [0.17.0] — 2026-06-27 — Sound System nativo (AN-02)

### Added
- feat(allegati): aggiunge supporto magic bytes per formati HEIC e WEBP
- feat(sound): implementa sound-system nativo con `react-native-audio-api` — riscrittura di `src/lib/sound-system.ts`, temporizzazione nativa via `audioContext.currentTime`, normalizzazione 86 suoni legacy in 5 canonici, lazy initialization del contesto nativo, early return Windows no-op, integrazione `AppState` per suspend/resume del contesto, sincronizzazione preferenze con Supabase. Chiude AN-02.
- docs(design/plan/todo): creati documenti di design, piano e todo specifici per il refactoring del Sound System (AN-02).
- docs(api/architettura): aggiornate le API reference e l'architettura per riflettere la compatibilità del Sound System nativo.

### Fixed
- fix(android): aggiunto permesso VIBRATE in AndroidManifest.xml per expo-haptics
- AN-02: rimosso l'utilizzo delle Web Audio API del browser, sostituito con `react-native-audio-api`.
  Chiude il debito tecnico AN-02 identificato nel REPORT compatibilità Android v1.0.0.

### Open Threads aggiornati
- AN-01: CLOSED
- AN-02: CLOSED
- AN-03: oklch colori, compatibilità Android — APERTO


## [0.4.0-docs.2] — 2026-05-28 — Pianificazione

### Added

- PLAN 013: coding plan Repository Ricorrenze (stato DRAFT) — docs/3-coding-plans/013-PLAN_repository-ricorrenze_v0.1.0.md
- TODO 013: todo list Repository Ricorrenze (stato PENDING) — docs/4-todo-lists/013-TODO_repository-ricorrenze_v0.1.0.md
- PLAN 014: coding plan Repository Tag e Transazioni-Tag (stato DRAFT, prereq: PLAN 013) — docs/3-coding-plans/014-PLAN_repository-tag-transazioni-tag_v0.1.0.md
- TODO 014: todo list Repository Tag e Transazioni-Tag (stato PENDING) — docs/4-todo-lists/014-TODO_repository-tag-transazioni-tag_v0.1.0.md
- PLAN 015: coding plan Repository Notifiche e Notification Service (stato DRAFT, prereq: PLAN 013, 014) — docs/3-coding-plans/015-PLAN_repository-notifiche-notification-service_v0.1.0.md
- TODO 015: todo list Repository Notifiche e Notification Service (stato PENDING) — docs/4-todo-lists/015-TODO_repository-notifiche-notification-service_v0.1.0.md
- PLAN 016: coding plan Allegati Transazioni (stato DRAFT) — docs/3-coding-plans/016-PLAN_allegati-transazioni_v0.1.0.md
- TODO 016: todo list Allegati Transazioni (stato PENDING) — docs/4-todo-lists/016-TODO_allegati-transazioni_v0.1.0.md
- PLAN 016-bis: coding plan Cleanup Orfani Storage (stato DRAFT, prereq: PLAN 016) — docs/3-coding-plans/016-bis-PLAN_cleanup-orfani-storage_v0.1.0.md
- TODO 016-bis: todo list Cleanup Orfani Storage (stato PENDING) — docs/4-todo-lists/016-bis-TODO_cleanup-orfani-storage_v0.1.0.md
- PLAN 016-ter: coding plan Magic Bytes Validation (stato DRAFT, prereq: PLAN 016) — docs/3-coding-plans/016-ter-PLAN_magic-bytes-validation_v0.1.0.md
- TODO 016-ter: todo list Magic Bytes Validation (stato PENDING) — docs/4-todo-lists/016-ter-TODO_magic-bytes-validation_v0.1.0.md

## [0.4.0] — 2026-05-28 — Documentazione

### Added

- DESIGN 013: Repository Ricorrenze — approvato
  e validato. Introduce il repository per
  transazioni programmate ricorrenti con
  operazioni CRUD e deactivate (no delete fisico).
- DESIGN 014: Repository Tag e Transazioni-Tag —
  approvato e validato. Introduce gestione etichette
  e associazione tag-transazioni con RPC atomiche.
- DESIGN 015: Repository Notifiche e Notification
  Service — approvato e validato. Estrae e potenzia
  la logica di notifica budget esistente introducendo
  persistenza e service dedicato.
- DESIGN 016: Repository Allegati Transazioni —
  approvato e validato. Primo dominio con storage
  cloud Supabase, strategia compensating transaction
  e 17 decisioni architetturali.
- DESIGN 016-bis: Cleanup Orfani Storage — approvato
  e validato. Utility automatica fire-and-forget con
  4 trigger, guardia concorrente e throttle temporale.
- DESIGN 016-ter: Magic Bytes Validation — approvato
  e validato. Validazione fisica dei file allegati
  per JPEG, PNG, PDF su Android e Windows.

### Technical Debt Registered

- DT-016-01: magic bytes validation (soluzione in 016-ter)
- DT-016-02: cleanup orfani storage (soluzione in 016-bis)
- DT-016-bis-01: script CLI manutenzione
- DT-016-bis-02: Edge Functions server-side cleanup
- DT-016-bis-03: log opt-in utenti avanzati
- DT-016-ter-01: supporto HEIC e WEBP
- DT-016-ter-02: supporto iOS magic bytes
- DT-016-ter-03: bridge nativo Windows magic bytes

### DUSU-ANALYZER — Analisi statica compatibilità Android v0.4.0 (2025-07-25)

#### Added

- **Report compatibilità Android**
  ([docs/1-reports/REPORT-compatibilita-android-v1.0.0.md](docs/1-reports/REPORT-compatibilita-android-v1.0.0.md)).
  Analisi statica completa del codebase v0.4.0. 5 fasi (FASE 0:
  documentazione, FASE 1: scansione sorgente, FASE 2: classificazione,
  FASE 3: test review, FASE 4: report). Identifica:
  — 3 Blocchi Critici BC-01/02/03: `@phosphor-icons/react` e `react-dom`
  in `budget-templates.ts` e `package.json` (impediscono build Android);
  — 4 Adattamenti Necessari AN-01/02/03/04: `haptic-system.ts` (Web
  Vibration API), `sound-system.ts` (Web Audio API), colori `oklch(...)`
  in `constants.ts` e `budget-templates.ts` (non supportati da RN);
  — 3 Discrepanze DD-01/02/03: patch netinfo 12.0.1 orfana, stale
  reference a `use-online-status.ts` in architettura.md, descrizione
  errata della cache in CLAUDE.md.

#### Verified Compatible (FASE 1)

- Layer crittografico PLAN 006: `crypto.ts` + `kdf-provider.ts` —
  `PBKDF2_ITERATIONS=600_000`, `KDF_VERSION=0x01`, `@noble/ciphers`,
  `bcryptjs`, lazy-require `react-native-quick-crypto`. ✅
- Layer connettività DESIGN 008: `NetworkStatusContext.tsx` +
  `use-network-status.ts` — NetInfo, debounce, fail-safe. ✅
- Layer export DESIGN 009: `export-service.ts` — ramo Android via
  `react-native-share`, stub `PICKER_UNAVAILABLE` per Windows. ✅
- Layer accessibilità DESIGN 003/004: `accessibility/engine.ts`,
  `detection.ts`, `src/announcements/` — solo `AccessibilityInfo` RN. ✅
- Cache Supabase: `supabase/cache.ts` — usa `AsyncStorage` (non
  localStorage). ✅
- `AuthContext.tsx`, `AppDataContext.tsx` — sonner rimosso, shim
  locale; `navigator.onLine` rimosso, `useNetworkStatus()` attivo. ✅

---

### Documentation

- **Corretti quattro documenti DESIGN**:
  - `docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md`: aggiunta sezione di presidio architetturale per nuovi formati (CSV coperto; PDF/XLSX/DOCX/XML non autorizzati senza DESIGN dedicato).
  - `docs/2-projects/010-DESIGN_wrapped-master-key-PIN_v0.1.0.md`: rafforzamento prerequisiti migration (applicazione congiunta) e criterio di accettazione CA-2 esteso per la verifica di atomicità e comportamento su errori di Supabase.
  - `docs/2-projects/011-DESIGN_resilienza-bootstrap_v0.1.0.md`: vincolo timeout bootstrap a 10s, sottosezione per gestione NetInfo tardivo e chiarimento scope dei codici ERROR_NETWORK/ERROR_DATA.
  - `docs/2-projects/012-DESIGN_export-nativo-debiti_v0.1.0.md`: aggiunta criterio CA-4 sul rilascio di `inProgress` tramite `finally` e nota obbligatoria sul Test 13 che verifica il reset definitivo del flag.

### Planning — 2026-05-27

- Promossi a **REVIEWED** i documenti
  `docs/2-projects/010-DESIGN_wrapped-master-key-PIN_v0.1.0.md`,
  `docs/2-projects/011-DESIGN_resilienza-bootstrap_v0.1.0.md` e
  `docs/2-projects/012-DESIGN_export-nativo-debiti_v0.1.0.md` come
  completamento formale del ciclo di revisione architetturale approvato dal
  Consiglio AI.
- Creati i nuovi documenti di pianificazione:
  `docs/3-coding-plans/010-PLAN_wrapped-master-key-pin_v0.1.0.md`,
  `docs/3-coding-plans/011-PLAN_resilienza-bootstrap_v0.1.0.md`,
  `docs/3-coding-plans/012-PLAN_export-nativo-debiti_v0.1.0.md`,
  `docs/4-todo-lists/010-TODO_wrapped-master-key-pin_v0.1.0.md`,
  `docs/4-todo-lists/011-TODO_resilienza-bootstrap_v0.1.0.md` e
  `docs/4-todo-lists/012-TODO_export-nativo-debiti_v0.1.0.md`.
- Aggiornato `docs/todo-master.md` con i riferimenti ai sei nuovi documenti,
  lo stato iniziale APERTO e il riepilogo operativo dei task principali per i
  design 010, 011 e 012.

### PLAN 009-native — WinRT Save Picker bridge (2026-05-25)

#### Added

- **Modulo nativo TypeScript `@/native/WinRTSavePicker`**
  ([src/native/WinRTSavePicker/](src/native/WinRTSavePicker/)).
  Dispatcher multi-piattaforma con contratti tipizzati
  (`FileTypeChoice`, `PickSavePathOptions`, `PickSavePathResult`)
  e variant Metro per `.windows.ts`, `.macos.ts`, `.stub.ts`.
  Le piattaforme non-Windows ritornano sempre
  `{ status: 'PICKER_UNAVAILABLE' }` mantenendo il contratto
  uniforme (DESIGN 009-native §5).

- **Bridge nativo C++/WinRT `WinRTSavePickerModule`**
  ([windows/ZecchinoReact/WinRTSavePickerModule.h](windows/ZecchinoReact/WinRTSavePickerModule.h),
  [windows/ZecchinoReact/WinRTSavePickerModule.cpp](windows/ZecchinoReact/WinRTSavePickerModule.cpp)).
  TurboModule attribute-based (`REACT_MODULE` + `REACT_METHOD`)
  registrato via `AddAttributedModules(builder, true)`. Espone
  `pickSavePath(options): Promise<PickSavePathResult>` che
  apre `Windows.Storage.Pickers.FileSavePicker` sullo HWND
  della finestra attiva (`IInitializeWithWindow`) e marshalla
  il risultato sull'UI thread via `ReactContext.UIDispatcher()
.Post()`. Eccezioni C++/WinRT (`hresult_canceled`,
  `E_INVALIDARG`, `E_FAIL`, std::exception) sono mappate in
  modo esaustivo su `status`/`code` JSValueObject (DESIGN
  009-native §6, §8).

- **Integrazione `ExportService.exportFile` ramo Windows**
  ([src/lib/export-service.ts](src/lib/export-service.ts)).
  Su `Platform.OS === 'windows'` il flusso usa
  `WinRTSavePicker.pickSavePath` + caricamento opzionale di
  `react-native-fs` (`require()` difensivo che ritorna `null`
  se assente → reason `UNSUPPORTED_PLATFORM`). La mappatura
  `PickSavePathResult → ExportResult` segue la tabella DESIGN
  009-native §8 con switch esaustivo, narrowing TypeScript e
  cintura difensiva sul reject del bridge.

- **Test mock-based ramo Windows**
  ([**tests**/ExportService.test.ts](__tests__/ExportService.test.ts)).
  10 test eseguibili che coprono SUCCESS, USER_CANCELLED,
  PICKER_UNAVAILABLE, INVALID_ARGUMENT, INTERNAL_ERROR (con e
  senza `code=INVALID_FILENAME`), bridge throw, write
  EACCES, e l'assemblaggio di `PickSavePathOptions` (file
  con/senza estensione). Suite globale: 7 suite PASS,
  36 passed + 39 todo.

#### Stato

- ⚠️ **Fuori dalla release 0.3.0** fino a sblocco T3-N5 (validazione build
  Windows). Causa: blocker upstream
  `@react-native-community/netinfo@12.0.1` +
  Windows App SDK 1.8.x — `RNCNetInfoCPP.vcxproj` non
  dichiara come `PackageReference` le 9 sub-deps split di
  WAS 1.8 (AI/Base/DWrite/Foundation/InteractiveExperiences
  /ML/Runtime/Widgets/WinUI). Il restore NuGet aborta prima
  della compilazione del nostro bridge nativo. Codice nostro
  review-grade, in attesa di sblocco esterno o workaround
  maintainer. Vedi tech debt
  [DT-009-N-01](docs/todo-master.md#dt-009-n-01--blocker-build-windows-netinfo--windows-app-sdk-18x).

- Validazione non-regressione Android rimandata
  ([DT-009-N-02](docs/todo-master.md#dt-009-n-02--ambiente-android-non-configurato)):
  ambiente Android non configurato sulla macchina
  maintainer. Mitigazione: i test Jest mock-based coprono il
  fallback `PICKER_UNAVAILABLE` del dispatcher.

## [0.4.0] - 2026-05-26

### Security

- Completato PLAN 006 con KDF PIN basata su `PBKDF2-SHA256` via
  `react-native-quick-crypto` `1.1.5`, 600.000 iterazioni e backend
  OpenSSL nativo.
- Introdotto il payload PIN versionato
  `KDF_VERSION[1] | SALT[16] | IV[12] | Ciphertext[N] | AuthTag[16]`
  con `KDF_VERSION = 0x01`.
- Aggiunta la migration
  `docs/6-sql/P40-add-pin-kdf-salt.sql` per la colonna nullable
  `pin_kdf_salt` in `impostazioni_utente`.
- Implementata la Strategia C di atomicità applicativa per PIN hash e salt
  tramite `updateFields` e `updatePinHashAndSalt`.
- Aggiunti i golden vectors K1, K2 e K3 per KDF e pipeline PIN; confermata
  la non regressione dei golden G1, G2 e G3 del PLAN 005.

### Changed

- Bump versione da `0.3.0` a `0.4.0`: motivato dal completamento del layer
  crittografico privato con KDF PIN + AES-GCM versionata, non da semplice
  manutenzione incrementale.

## [0.3.0] - 2026-05-26

### Rollup release

- Promossi in release i piani 001, 002, 003, 004, 005, 007, 008 e 009
  padre. Il sotto-piano `009-native` resta in `Unreleased` perché manca
  ancora la validazione runtime T3-N5 su Windows e Android.
- Baseline TypeScript migliorata da 3 a 2 errori residui, entrambi
  esterni al perimetro release in `src/lib/budget-templates.ts` su
  `@phosphor-icons/react`.
- Suite completa verde: 7 suite PASS, 50 test PASS, 16 `todo`.

### Documentation

- **PLAN 009-native: aggiunto documento**
  [docs/3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md](docs/3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md).
  Piano di coding dettagliato per il bridge C++/WinRT del modulo
  nativo WinRT Save Picker. Specifica T3-N1..T3-N5 (struttura
  TypeScript multi-piattaforma, bridge C++/WinRT, integrazione
  `ExportService`, gate G0-N/G1-N TypeScript, verifica build
  Windows manuale). Sostituisce la specifica della task T3 del
  PLAN 009 padre. Stato: DRAFT.

- **TODO 009-native: aggiunto documento**
  [docs/4-todo-lists/009-native-TODO_winrt-save-picker_v0.1.0.md](docs/4-todo-lists/009-native-TODO_winrt-save-picker_v0.1.0.md).
  Checklist operativa con precondizioni P-N1..P-N6 + P-B1,
  gate G0-N/G1-N, task T3-N1..T3-N5, cicli di revisione (max 10
  tentativi per task, post-task e post-implementazione/test) e
  aggiornamenti documentali post-implementazione. Stato: PENDING.

- **DESIGN 009-native §11 Validation Log: aggiornato**
  ([docs/2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md](docs/2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md)).
  Aggiunta riga 2026-05-25 per stesura PLAN/TODO 009-native.

- **PLAN 009 padre §6 T3: aggiornato riferimento**
  ([docs/3-coding-plans/009-PLAN_export-nativo_v0.1.0.md](docs/3-coding-plans/009-PLAN_export-nativo_v0.1.0.md)).
  Nota additiva che rimanda al PLAN dettagliato 009-native come
  fonte di specifica per la task T3.

- PLAN 009: firma `pickSavePath` allineata al contratto `PickSavePathOptions` definito in
  DESIGN 009-native (A-DOC-009-001).

- **DESIGN 009-native: aggiunto documento**
  [docs/2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md](docs/2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md).
  Architettura del modulo nativo WinRT FileSavePicker.
  Approvato dal Consiglio AI il 25 maggio 2026.
  Dipendenza dal bloccante B1 PLAN 009 dichiarata formalmente.
  Non codificabile finché le versioni librerie non sono congelate.

### PLAN 008 — Network connectivity via NetInfo (2026-05-25)

#### Added

- **Provider e hook di connettività dedicati**
  ([src/context/NetworkStatusContext.tsx](src/context/NetworkStatusContext.tsx),
  [src/hooks/use-network-status.ts](src/hooks/use-network-status.ts)).
  Nuovo `NetworkStatusProvider` basato su `@react-native-community/netinfo`
  che espone il contratto `NetworkStatus = { isOffline, isConnected,
isInternetReachable, connectionType, isInitialized }`. Semantica
  `isOffline` conforme a DESIGN 008 §5 (INV-7): captive portal
  trattato come offline, `isInternetReachable === null` interpretato
  come online-first. Debounce di 1000 ms applicato SOLO sulla
  transizione online → offline (offline → online immediato, INV-3).
  Fail-Safe Online-First (INV-4): se `NetInfo.addEventListener` lancia
  o non riceve eventi entro 1500 ms, lo stato viene forzato a
  `{ isOffline:false, isConnected:true, isInternetReachable:true,
connectionType:'unknown', isInitialized:true }` con warning su
  `console.warn`. Cleanup completo (`unsubscribe` + clear di tutti i
  timer + `isMountedRef` guard) all'unmount.
- **Test dedicati per il provider rete**
  ([**tests**/use-network-status.spec.ts](__tests__/use-network-status.spec.ts)).
  7 test verdi (PLAN 008 T6): Online, Offline confermato, Captive
  portal, Flapping con debounce (4a online→offline 1000 ms, 4b
  offline→online immediato), Fail-Safe su timeout init, Cleanup
  con `unsubscribe` verificato. Mock di `@react-native-community/netinfo`
  con utility `triggerNetInfo()` e `jest.useFakeTimers()`.

#### Changed

- **`AppDataContext` ora usa `useNetworkStatus`**
  ([src/context/AppDataContext.tsx](src/context/AppDataContext.tsx)).
  Sostituiti i due controlli inline `typeof navigator !== 'undefined'
&& navigator.onLine === false` (righe 354 e 415) con la lettura di
  `isOffline` proveniente da `useNetworkStatus()`. Aggiunto early
  return `if (!isNetworkInitialized) return` nel primo `useEffect`
  bootstrap per evitare di consumare uno stato di rete indeterminato
  prima che il provider abbia emesso l'esito iniziale. Boundary
  DESIGN 007 (INV-6) preservato: nessuna delle 5 keyword PLAN 007
  (`transitionTo`, `hydrationGen`, `applyDomainSnapshot`,
  `readCachedDomainSnapshot`, `writeCache`) è stata rimossa o
  rinominata.
- **`App.tsx` monta `NetworkStatusProvider`**
  ([App.tsx](App.tsx)). `<NetworkStatusProvider>` inserito come
  ancestor di `<AuthProvider>` (INV-5).
- **`package.json`**: aggiunta dipendenza
  `@react-native-community/netinfo ^12.0.1`.
- **`jest.config.js`**: aggiunto `moduleNameMapper` su
  `@react-native-community/netinfo` puntato al mock ufficiale
  `node_modules/.../jest/netinfo-mock.js`. Necessario perché
  `__tests__/App.test.tsx` ora monta `NetworkStatusProvider`. Il
  test dedicato sovrascrive il mock con un `jest.mock` locale per
  esporre `triggerNetInfo`.

#### Removed

- **`src/hooks/use-online-status.ts`** (24 righe). Vecchio hook
  basato su `navigator.onLine` + `window.addEventListener('online'/
'offline')` non funzionante in React Native. Nessun consumer
  esterno restava attivo prima della rimozione.

#### Notes

- **iOS**: il maintainer deve eseguire `cd ios && bundle exec pod
install && cd ..` prima del primo `npm run ios` (macOS non
  disponibile in sessione, comando non eseguito).
- Gate G1-G8 (PLAN 008 §7) tutti PASS. Baseline TypeScript = 3
  errori, invariata pre/post-PLAN. Suite Jest: 7/7 suite verdi,
  26 test passanti, 39 `it.todo` preservati.

### PLAN 009 — Pre-flight corrections (2026-05-25)

- Fissata versione react-native-share@12.3.1 (P9)
- Fissata versione @react-native-windows/fs@0.82.0 (P10)
- Reso obbligatorio il test UNKNOWN in T6
- Aggiunta nota di governance su P4/P5 (verifica pre-codifica)
- Corretti comandi di install in T2

### PLAN 009 — Export File Nativo (2026-05-26)

- **Wiring runtime completato in `AppDataContext`**
  ([src/context/AppDataContext.tsx](src/context/AppDataContext.tsx)).
  `handleExportCSV` passa da `void` a `Promise<void>`, rimuove il
  riferimento rotto a `downloadFile`, usa `exportFile(...)`, gestisce i
  7 reason di `ExportResult` e delega gli annunci a
  `announce(accounts.announceExportFile(...))` /
  `announce(accounts.exportError(...))`.
- **Nuove chiavi localizzazione export**
  ([src/locales/it.ts](src/locales/it.ts)).
  Aggiunte 14 chiavi per toast e annunci screen reader di export
  (`export_success_*`, `export_permission_denied_*`,
  `export_filesystem_error_*`, `export_unsupported_platform_*`,
  `export_invalid_path_*`, `export_insufficient_space_*`,
  `export_unknown_error_*`).
- **Announcements export allineati al piano**
  ([src/announcements/accounts.ts](src/announcements/accounts.ts)).
  Aggiunti `announceExportFile()` ed `exportError()` per il routing
  accessibile del risultato export.
- **Test eseguibili export**
  ([**tests**/ExportService.test.ts](__tests__/ExportService.test.ts),
  [**tests**/AppDataContext.spec.ts](__tests__/AppDataContext.spec.ts)).
  Coperti 11 scenari contrattuali + no-throw per `ExportService` e 12
  scenari per il branching async di `handleExportCSV`.

### Documentation

- PLAN 009 / TODO 009: annunci screen reader per export delegati ad
  `accounts.ts` — decisione del 25 maggio 2026 (coerenza DESIGN 004 §11)
- PLAN 009: aggiunto Task T1-bis — registrazione 14 chiavi di
  localizzazione export in `src/locales/it.ts` (rimozione stringhe
  hardcoded da Task T4)
- TODO 009: aggiunta voce T1-bis nella checklist
- Correzione architetturale: il codice di esempio di `handleExportCSV`
  (T4) ora usa `t('chiave')` invece di stringhe letterali, in conformità
  con il pattern di localizzazione del progetto

### Added — 2026-05-25

- **PLAN 009 / TODO 009 — Export File Nativo (DRAFT)**
  ([docs/3-coding-plans/009-PLAN_export-nativo_v0.1.0.md](docs/3-coding-plans/009-PLAN_export-nativo_v0.1.0.md),
  [docs/4-todo-lists/009-TODO_export-nativo_v0.1.0.md](docs/4-todo-lists/009-TODO_export-nativo_v0.1.0.md)).
  Piano operativo derivato da DESIGN 009 (REVIEWED+, P1/P2/P3 SODDISFATTE)
  per costruire ex novo il delivery layer di export file in
  `src/context/AppDataContext.tsx`, eliminando l'import rotto di
  `downloadFile` (riga 3) e introducendo l'architettura a tre layer:
  L1 `exportToCSV` (invariante in `helpers.ts`), L2 `ExportService` nuovo
  in `src/lib/export-service.ts` (asincrono, multi-formato, disaccoppiato
  dalla UI), L3 `handleExportCSV` riscritto come `async` con branching
  sui 7 reason di `ExportResult`. Strategia di delivery condizionale per
  piattaforma: iOS/Android share sheet via `react-native-share`; Windows
  via `@react-native-windows/fs` (Layer A scrittura) + modulo nativo
  custom in `src/native/WinRTSavePicker/` con bridge C++/WinRT su
  `Windows.Storage.Pickers.FileSavePicker` (Layer B selezione path —
  decisione P1 DESIGN 009 §10). 8 task atomici T1-T8, 10 gate di chiusura
  G1-G10, 8 invarianti normative (INV-1..INV-6 + INV-B1/B2 di boundary
  PLAN 007/008), 4 debiti tecnici registrati DT-009-01..04. Baseline
  TypeScript di partenza = 3 errori (verificata 2026-05-25 su `main`,
  working tree pulito, DESIGN 009 mergiato). Versioni esatte di
  `react-native-share` e `@react-native-windows/fs` marcate come
  **DATO NON DISPONIBILE** in stesura (DT-009-01, DT-009-02): T2 bloccato
  finché il maintainer non le fissa nelle precondizioni P9/P10 del TODO.
  Breaking change pianificato sulla firma di `handleExportCSV`:
  `() => void` → `() => Promise<void>` (DESIGN 009 §7, ammesso in
  pre-release 0.x.x). Censimento consumer P3 conferma 9 occorrenze in 8
  file, nessun consumer runtime esterno a `AppDataContext.tsx`.

### Changed — 2026-05-25

- **PLAN 008 / TODO 008**: compilato log pre-flight precondizioni P1-P7
  con esiti verificati da utente in data 2026-05-25. Stato operativo:
  tutte le precondizioni soddisfatte, PLAN 008 pronto all'esecuzione.
- **PLAN 008 / TODO 008**: aggiornata baseline TypeScript da 8 a 3 errori
  (valore reale verificato il 2026-05-25; la stima precedente di 8 era
  derivata da PLAN 007 NOTA 1, non da misurazione diretta).
- **TODO 008**: corretti refusi minori — uniformato conteggio scenari di
  test nel perimetro (da "4 scenari" a "6 scenari" nella tabella §4.1 di
  PLAN 008 e nel messaggio di commit T6); aggiunta nota esito da compilare
  per task T7.
- **DESIGN 009**: registrata decisione formale Precondizione P1 —
  strategia Windows per selezione cartella di salvataggio.
  Scelta: modulo nativo custom in `src/native/` tramite WinRT
  `FileSavePicker` via C++/WinRT bridge (decisione 2026-05-23,
  confermata 2026-05-25). Precondizione P1 promossa da APERTA
  a SODDISFATTA. Aggiornati Sezione 10 (P1) e Sezione 9
  (TurboModule WinRT Save Picker) di
  [docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md](docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md).

### Documentation

- **PLAN 008 — Network connectivity (DRAFT)**
  ([docs/3-coding-plans/008-PLAN_network-connectivity_v0.1.0.md](docs/3-coding-plans/008-PLAN_network-connectivity_v0.1.0.md),
  [docs/4-todo-lists/008-TODO_network-connectivity_v0.1.0.md](docs/4-todo-lists/008-TODO_network-connectivity_v0.1.0.md)).
  Piano operativo derivato da DESIGN 008 (REVIEWED) per sostituire il
  rilevamento di connettività basato su `navigator.onLine` /
  `window.addEventListener('online'|'offline')` — non funzionante in
  React Native — con un _connectivity contract_ centralizzato basato su
  `@react-native-community/netinfo`. Strategia adottata: **Strategia A
  (migrazione completa)** — eliminazione di `src/hooks/use-online-status.ts`
  (zero consumer verificati nel codebase). 8 task atomici T1-T8,
  8 gate di chiusura G1-G8, 7 invarianti normative, 3 debiti tecnici
  registrati. Boundary con DESIGN 007 preservato (INV-6): nessuna
  modifica alla state machine bootstrap, generation counter, `writeCache`,
  `applyDomainSnapshot` o validazioni snapshot. Aggiornata la sezione
  `src/hooks/use-online-status.ts` di `docs/api.md` per riflettere la
  rimozione pianificata e introdurre il contratto del nuovo hook
  `useNetworkStatus()` e del provider `NetworkStatusProvider`.

### Planned (non ancora implementato)

- **Network connectivity contract** (PLAN 008): nuovo
  `NetworkStatusProvider` (`src/context/NetworkStatusContext.tsx`) e
  hook pubblico `useNetworkStatus()` (`src/hooks/use-network-status.ts`)
  con contratto `{ isOffline, isConnected, isInternetReachable, connectionType, isInitialized }`.
  Semantica captive portal trattato come offline (INV-7). Debounce
  direzionale 1000 ms (solo online → offline; offline → online
  immediato, INV-3). Fail-Safe Online-First su fallimento NetInfo o
  timeout di inizializzazione (INV-4). Rimozione dei due check inline
  `navigator.onLine === false` in `src/context/AppDataContext.tsx`
  (righe 354 e 415) sostituiti dal consumo di
  `useNetworkStatus().isOffline`. Eliminazione di
  `src/hooks/use-online-status.ts` (breaking change ammessa in
  pre-release 0.x.x; nessun consumer interno).

> Nota versionamento: la rimozione di `useOnlineStatus` è una breaking
> change formale dell'API pubblica del modulo `src/hooks/`, ma il
> simbolo non ha consumer nel codebase e la versione corrente è
> `0.2.0` (pre-release SemVer 0.x.x), che ammette breaking change
> senza bump major. La versione di `package.json` resta `0.2.0`.

## [0.2.0] - 2026-05-25

### Fixed

- **Bug N9 — false-positive hydration con collezioni `undefined`**
  (`src/context/AppDataContext.tsx`, PLAN 007 T1).
  Aggiunti i 10 `await` mancanti su `readCache`/`isCacheStale` tramite
  `Promise.all` e introdotta validazione strutturale obbligatoria
  (`Array.isArray && !Promise`). Bug risolto: il flag `isDataReady = true`
  non può più convivere con collezioni non-Array.

### Added

- **State machine bootstrap esplicita a 6 stati** in `AppDataContext`
  (PLAN 007 T3): `IDLE | HYDRATING | CACHE-READY | REMOTE-SYNC | READY |
ERROR`. Tutte le transizioni passano per `transitionTo()` che aggiorna
  in modo atomico `bootstrapState`, `isLoading`, `isDataReady`, `error`.
  Matrice `ALLOWED_TRANSITIONS` blocca salti illegali con `console.warn`.
- **Generation counter `hydrationGen`** (PLAN 007 T4):
  invalidazione hydration concorrenti/stale. Incrementato a
  logout/login/refreshAll; checkato prima di ogni `applyDomainSnapshot`
  e `transitionTo`. Protegge da React 18 Strict Mode double-invoke e
  da race fra refresh concorrenti (INVARIANTE 3).
- **`writeCache` fail-soft** (PLAN 007 T5, INVARIANTE 4):
  try/catch per-tabella con `console.warn`, nessuna propagazione di
  errori di persistenza allo stato React. Le scritture restanti
  proseguono anche se una tabella fallisce.
- **Modulo isolato `src/context/app-data-cache.ts`** (PLAN 007 T7):
  estratta `readCachedDomainSnapshotPure` come funzione pura
  esportata, indipendente dal Provider e dalla catena React Native.
  `AppDataContext` ri-esporta per back-compat.
- **Suite di test eseguibili** `__tests__/AppDataContext.spec.ts`
  (PLAN 007 T7/T8): 7 test verdi per Bug N9, INV1, INV2, INV5
  (await su tutte e 5 le cache; Caso A vuoto-valido; Caso B miss;
  payload Promise non risolta; payload non-array; isStale propagato/no).
  16 `it.todo` documentati per scenari che richiedono mount del
  Provider (state machine completa, concorrenza refreshAll React 18
  Strict Mode, writeCache fail-soft end-to-end): l'abilitazione
  richiede `@testing-library/react` o harness equivalente, fuori
  scope di PLAN 007.

### Changed

- `hydrateFromCache` ora è asincrona e accetta un `gen: number`
  per la validazione di ownership (PLAN 007 T2).
- `refreshAll` blocca esecuzioni concorrenti se lo stato corrente è
  `HYDRATING` o `REMOTE-SYNC` e usa generation counter per scartare
  esiti out-of-order.

### Documentation

- `docs/architettura.md`: tabella file aggiornata — `AppDataContext.tsx`
  marcato con bug N9 RISOLTO (PLAN 007 v0.2.0); aggiunta riga per
  `context/app-data-cache.ts`. Roadmap aggiornata.
- `docs/todo-master.md`: versione bumped a 0.2.0; PLAN 007 spostato
  da PENDING a COMPLETATO; Snapshot di Ripresa aggiornato.

## [Pre-0.2.0]

### Documentation

- Pre-flight Patch 007 (2026-05-24) — Allineamento documentale di
  PLAN 007 v0.1.0 e TODO 007 v0.1.0 senza modifiche al codice
  sorgente né ai file di test. Operazioni eseguite:

  - **TODO 007 §6 Log Validazione**: aggiunte 4 righe pre-flight
    datate 2026-05-24 (verifica DESIGN 001 implementato, DESIGN 002
    implementato, AsyncStorage dipendenza presente, compilazione
    TypeScript baseline reale).
  - **Baseline TypeScript aggiornata da 47 a 8 errori** in 10
    occorrenze nel TODO 007 (tabella precondizioni §2, gate ogni
    task T1-T5, NOTA 1 riscritta con cronologia, G1 §7 + checkbox,
    T8 checkbox) e in 2 occorrenze nel PLAN 007 (Gate G1 §5 +
    blocco NOTA di aggiornamento). Baseline ufficiale per la
    chiusura di PLAN 007 ora 8 errori, verificata con
    `npx tsc --noEmit 2>&1 | grep -c "error TS"`.
  - **PLAN 007 §8 Debiti tecnici registrati** (nuova sezione,
    rinumerato Riferimenti a §9): registrato DT-007-01 "Assenza
    di timeout/watchdog sulla hydration AsyncStorage" come debito
    tecnico noto, non gestito in PLAN 007, rinviato a PLAN futuro.
    Riferimento incrociato a TODO 007 §5 NOTA 7.
  - **PLAN 007 §4 Task T7 e T8 espliciti** (Strategia A): aggiunti
    T7 (conversione 23 `it.todo` in test eseguibili con distinzione
    storage vuoto valido / hydration fallita / snapshot corrotto)
    e T8 (esecuzione full suite con verifica regressioni). I
    criteri di accettazione dettagliati restano nel TODO 007 §4.
    Aggiunta nota di chiusura su G4 nel PLAN 007 §5.
  - **TODO 007 §4 T7 — Direttiva QA "vuoto vs errore" (INVARIANTE 5)**: aggiunta direttiva obbligatoria con Caso A (storage vuoto
    ma valido → `READY`, asserzione esplicita `expect(...).toEqual([])`
    e `expect(...).not.toBeUndefined()`) e Caso B (hydration fallita
    / snapshot corrotto → `ERROR`). Nota di chiusura: G4 non chiuso
    finché Caso A/B non sono eseguibili e passanti.
  - **TODO 007 §4 T7 — Direttiva QA Scenario React 18 Strict Mode**:
    aggiunta direttiva obbligatoria per il gruppo "Concorrenza
    refreshAll": scenario doppia invocazione `useEffect` con due
    generazioni concorrenti (gen 1 e gen 2), completamento
    out-of-order, applicazione solo dei dati di gen 2 via guard
    `myGen !== hydrationGen.current`, nessuna race, `READY`
    raggiunto una sola volta. Nota di chiusura su G4.
  - **`docs/todo-master.md`**: aggiornata baseline TypeScript da
    ~47 a 8 errori (Active Phase + Open Threads) per coerenza con
    lo stato reale del workspace al 2026-05-24.
  - Nessuna modifica a `src/`, `__tests__/`, `package.json`,
    file `.github/` o configurazioni build. Lavoro su branch `main`.

- PLAN 006 v1.1.0 e TODO 006 v1.1.0 allineati a
  `docs/2-projects/006-DESIGN_kdf-pin_v0.4.0.md` (2026-05-24).
  Stato PLAN: REVIEWED → UPDATED. Stato TODO: PENDING → IN PROGRESS.
  T1 (benchmark Fase 0) marcato completato: su Windows con
  `react-native-quick-crypto` (OpenSSL nativo) la mediana di 600.000
  iterazioni PBKDF2-SHA256 risulta 86 ms; valore scelto
  `PBKDF2_ITERATIONS = 600_000` (≥ floor OWASP 100.000, target
  operativo corrente). Sostituzione libreria KDF `@noble/hashes` →
  `react-native-quick-crypto` propagata a PLAN §2 (benchmark Fase 0),
  §3 (dipendenza con versione pinnata e Dependency Governance
  DESIGN §14), §7.2 (import via modulo `KdfProvider` e costante
  immutabile `PBKDF2_ITERATIONS = 600_000`) e §11 V4 (vincolo
  pure-JavaScript rilassato: vietato solo codice nativo custom
  interno). Propagata anche a TODO T1, T2, T6, sequenza calcolo
  vettori K e NOTA 5 (tradeoff aggiornato). Aggiunta riga 2026-05-24
  al §6 Log Validazione. Aggiornati riferimenti incrociati al DESIGN
  da v0.3.0 a v0.4.0 (frontmatter PLAN/TODO, intestazioni di
  riferimento e commento SQL P40). Il codice `src/lib/crypto.ts` non
  è stato toccato in questa sessione: il placeholder
  `/* valore da Fase 0 */` sarà rimosso dal Coding Plan 006 nella
  Fase 5 implementativa.

### Changed

- DESIGN/PLAN/TODO 005 — Sostituito `crypto.subtle` in `src/lib/crypto.ts`
  con AES-256-GCM via `@noble/ciphers` (pure-JS, Hermes-compatible).
  IV 96-bit generato con `crypto.getRandomValues` (polyfill
  `react-native-get-random-values` caricato come prima riga di `index.js`).
  Formato payload `Base64(IV[12] ‖ ciphertext ‖ authTag[16])` INVARIATO:
  retrocompatibile con i dati cifrati esistenti su Supabase.
  Firma API `encryptData(data, key): Promise<string>` e
  `decryptData(encryptedData, key): Promise<string>` INVARIATE.
  `hashPin`/`verifyPin` (bcryptjs) NON toccati.
  Errori di decifratura normalizzati a `'Decryption failed: authentication
tag mismatch'` (chiave errata, payload manomesso o troncato).

[Unreleased]: https://github.com/donato81/ZecchinoReact/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/donato81/ZecchinoReact/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/donato81/ZecchinoReact/compare/v0.2.0...v0.3.0

### Added

- `__tests__/crypto/golden.test.ts` — 3 vettori bit-perfect (G1, G2, G3).
- `__tests__/crypto/encrypt-decrypt.test.ts` — 6 test (R1, E1, E2, E3, A1, S1).
- `__tests__/crypto/pin.test.ts` — 2 test bcryptjs round-trip.
- Dipendenze: `@noble/ciphers@^1.0.0`, `react-native-get-random-values@^1.11.0`.

### Refactor

- DESIGN 004 — Implementato il layer semantico `src/announcements/`
  conforme ad ADR_001 v1.3.0. Tutti gli annunci accessibili passano ora
  per `announce()` esposto da `@/announcements`, unico punto autorizzato
  a importare `@/accessibility/engine`. Migrati `src/context/AuthContext.tsx`
  (7 chiamate `screenReader.*` sostituite con `auth.*` builders) e
  `src/context/AppDataContext.tsx` (16 chiamate sostituite con
  `accounts.*` e `budgets.*` builders).
- Aggiunte stringhe di dominio in `src/locales/it.ts` (72 chiavi in 6
  sezioni). Tipi `Strings` e `StringKey` esportati per type-safety.
- Aggiunti moduli di dominio: `ui.ts` (26 fn), `auth.ts` (8 fn),
  `accounts.ts` (14 fn), `budgets.ts` (12 fn) con annunci composti per
  soglie budget (>=100/90/75) e progressi obiettivi (>=100/75).
- Eliminati i file legacy `src/hooks/use-screen-reader.ts` e
  `src/lib/screen-reader.ts`. Baseline TypeScript ridotta da 89 a 47
  errori (eliminati ~42 errori legati ai file rimossi).

### Documentation

- docs/4-todo-lists/007-TODO_async-cache-hydration_v0.1.0.md: CREATO.
  Documento operativo derivato dal PLAN 007 v0.1.0 (2026-05-23).
  Copre T1 (readCachedDomainSnapshot async), T2 (hydrateFromCache async),
  T3 (state machine `BootstrapState` + `transitionTo`), T4 (generation counter
  anti-concorrenza), T5 (writeCache fail-soft per tabella), T6 (censimento
  consumer), T7 (conversione spec `it.todo` → test eseguibili), T8 (suite
  completa). Gate di chiusura G1-G5 allineati al PLAN 007 §5. Stato: PENDING.
  Avvio subordinato a DESIGN 001 e DESIGN 002 implementati su `main`.
- docs/todo-master.md: aggiunto riferimento a TODO 007 nel campo
  `Pending Plans` e nota sessione 2026-05-23 (stesura TODO 007).
- docs/3-coding-plans/007-PLAN_async-cache-hydration_v0.1.0.md: CREATO.
  Stesura PLAN 007 — Async cache hydration bootstrap lifecycle
  `AppDataContext` (DRAFT, v0.1.0, 2026-05-23). Derivato da DESIGN 007
  (`docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md`). Copre i
  sei stati della state machine bootstrap (IDLE, HYDRATING, CACHE-READY,
  REMOTE-SYNC, READY, ERROR), le cinque invarianti (matrice di copertura
  task↔gate in §5) e il contratto di concorrenza `refreshAll` risolto
  via generation counter (motivato anche per React 18 Strict Mode).
  Perimetro: `src/context/AppDataContext.tsx`. Esclusioni esplicite
  (§7): rimozione di `navigator.onLine` rinviata a DESIGN 008,
  nessuna modifica a `src/lib/supabase/cache.ts` e ai repository.
- **tests**/AppDataContext.spec.ts: CREATO. File spec con `it.todo`
  che documenta i quattro scenari obbligatori di accettazione di
  PLAN 007 (hydration N9 con `await`, transizioni della state machine,
  concorrenza `refreshAll`, `writeCache` fail-soft, vuoto legittimo
  vs hydration fallita). Da convertire in test eseguibili durante
  l'implementazione del PLAN (Gate G4). Nessuna modifica al codice
  sorgente.
- docs/todo-master.md: aggiunto campo `Pending Plans` con riferimento
  a PLAN 007 e nota sessione 2026-05-23.

- docs/4-todo-lists/004-TODO_announcements-layer_v1.0.0.md: ciclo validazione Consiglio AI completato. Log Validazione popolato. Next Action aggiornato a T1.
- docs/3-coding-plans/004-PLAN_announcements-layer_v1_0_0.md: nota operativa baseline TypeScript aggiunta. Task T12 reso condizionale su verifica grep.

- docs/todo-master.md: allineamento stato post-implementazione
  DESIGN 001, 002, 003. Registro di Stato aggiornato.
  Snapshot di Ripresa aggiornato. Log di Validazione popolato.
  Sezione 1 metadati aggiornati.
- docs/3-coding-plans/004-PLAN_announcements-layer_v1_0_0.md:
  revisione documentale completata. Verifica precondizioni
  (DESIGN 003 outputs su filesystem) ed allineamento frontmatter
  alla convenzione PLAN 003 confermati: nessuna correzione
  chirurgica necessaria. Documento confermato READY per validazione
  Consiglio AI.
- docs/4-todo-lists/004-TODO_announcements-layer_v1.0.0.md: CREATO.
  Documento operativo derivato dai 14 task del PLAN 004 (T1–T14)
  con id `T4.Bx.Ny`, gate 1–7, snapshot, note operative e log
  validazione. Stato iniziale: PENDING.
- docs/todo-master.md: stato avanzamento DESIGN 004. Blocco in
  Carico aggiornato a "documentazione completata in attesa
  validazione". Active Phase, Next Action, riga ledger P1.B4 e
  log di validazione 2026-05-21 aggiunti.
- docs/2-projects/005-DESIGN_crypto-subtle: correzioni
  C005-1..5 applicate. Nomenclatura vettori uniformata,
  sezioni payload/KDF separate, nota operativa versione
  lib aggiunta, path test e golden vectors documentati.
  Versione aggiornata a v0.5.0.
- docs/2-projects/006-DESIGN_kdf-pin: correzioni
  C006-2, C006-3, C006-4, C006-6, C006-7 applicate.
  Vincoli raccolti in sezione dedicata, Fase 0 benchmark
  Hermes aggiunta, tabella file coinvolti inserita,
  gate precondizione DESIGN 005 formalizzato, divieto
  Math.random() esplicitato. Versione aggiornata a v0.3.0.
- docs/3-coding-plans/005-PLAN_sostituzione-crypto-N4_v1.0.0.md:
  Coding Plan 005 creato. Copre: golden test G1–G3,
  sostituzione encryptData/decryptData con @noble/ciphers,
  polyfill react-native-get-random-values, test suite.
- docs/3-coding-plans/006-PLAN_kdf-pin_v1.0.0.md:
  Coding Plan 006 creato. Copre: benchmark Hermes Fase 0,
  PBKDF2-SHA256 via @noble/hashes, migration SQL
  pin_kdf_salt, golden vectors K1–K3, atomicità PIN.
- docs/3-coding-plans/006-PLAN_kdf-pin_v1.0.0.md:
  aggiornato a v1.1.0 stato REVIEWED. Integrate 5 prescrizioni
  obbligatorie post-validazione Consiglio AI: divieto commit
  crypto.ts prima Fase 0 (§2.4.1), contratto errore esplicito
  updateFields (§8.2.1), freeze preventivo offline vettori
  K1/K2/K3 (§9.2), serializzazione KDF_VERSION come UInt8
  (§7.3), scope migration DOWN dichiarato (§4.2).
- docs/scripts/generate-golden-vectors.js: creato. Script offline
  CommonJS per il calcolo dei golden vectors K1/K2/K3 (PLAN 006
  §9.2). PBKDF2_ITERATIONS bloccante fino al completamento Fase 0,
  indipendente da src/lib/crypto.ts (no falsi positivi
  crittografici), confronto K2 via bytesToHex, check lunghezze
  post-conversione hex→bytes, output solo in console.
- docs/4-todo-lists/005-TODO_sostituzione-crypto-N4_v1.0.0.md: creato.
  TODO operativo per PLAN 005 (sostituzione crypto.subtle). 8 task
  atomici T1–T8 con gate bash verificabili. NOTA FASE 0: fallimento
  iniziale golden test atteso e metodologicamente corretto. NOTA V8:
  check anti-Math.random. NOTA DIAGNOSTICA: report delta byte-per-byte
  su fallimento post-migrazione. Checklist chiusura 11 punti da PLAN §9.
- docs/4-todo-lists/006-TODO_kdf-pin_v1.1.0.md: creato.
  TODO operativo per PLAN 006 v1.1.0 (KDF PIN). 9 task atomici
  con gate bash verificabili. Nota critica Fase 0: divieto commit
  con placeholder. Nota caso critico: floor 100.000 non negoziabile.
  Nota sequenza calcolo vettori K1/K2/K3 in 6 passi. Nota contratto
  errore updateFields (no swallow). Gate bloccante: dipendenza da
  PLAN 005 implementato. Checklist chiusura 12 punti da PLAN §10.

### DESIGN 002 — STEP 002 (Fix Provider Bootstrap — useInactivityTimer & detection SR)

Implementati i 3 fix di compatibilita' RN su provider e hook documentati in
`docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md` e pianificati
in `docs/3-coding-plans/002-PLAN_fix-provider-bootstrap_v0.2.0.md`. Eliminate
le ultime dipendenze DOM nei file del bootstrap auth (N6, N8) e rimosso
l'override dei tipi `node` che mascherava gli errori (N11). Gate runtime
(`npm start`) **differiti**: AuthProvider non e' ancora montato in `App.tsx`
(D3 — fuori perimetro STEP 002).

#### Modificato

- `tsconfig.json` (MODIFICATO) — N11. Rimossa la riga
  `"types": ["node"]` da `compilerOptions`. Permette a `tsc --noEmit`
  di segnalare gli usi residui di `window`/`document`/`navigator` nel
  codice RN, evitando falsi positivi di compatibilita'.
- `src/context/AuthContext.tsx` (MODIFICATO) — N8. Sostituita la
  detection screen reader DOM-based (`document.querySelector('[aria-live]')`
  - `document.documentElement.getAttribute('data-sr-active')`) con
    `AccessibilityInfo.isScreenReaderEnabled()` di React Native e
    sottoscrizione `addEventListener('screenReaderChanged', ...)` con
    cleanup tramite `subscription.remove()`. Aggiunto import
    `AccessibilityInfo` da `react-native`, aggiunto state
    `isScreenReaderActive` (boolean) gestito da nuovo `useEffect`
    dedicato. N6 (parte): aggiunto import
    `ActivityDetectorView` e wrap condizionale dei `children` quando
    `isAuthenticated === true` (Opzione B del PLAN) per propagare gli
    eventi di attivita' utente al timer di inattivita'.
- `src/hooks/use-inactivity-timer.ts` (MODIFICATO) — N6. Riscritto
  su API RN native: rimossa la costante `ACTIVITY_EVENTS` e il blocco
  `document.addEventListener`/`removeEventListener` nell'`useEffect`
  (responsabilita' ora delegata a `ActivityDetectorView`); sostituiti
  `window.setTimeout`/`window.clearTimeout` con i globali RN
  `setTimeout`/`clearTimeout`. Public API `{ resetTimer, showWarning }`
  invariata.

#### Aggiunto

- `src/components/ActivityDetectorView.tsx` (CREATO) — N6. Componente
  View RN che cattura gli eventi di attivita' utente tramite
  `onStartShouldSetResponder` (touch/click) senza acquisire il
  responder (`return false`), permettendo agli eventi di proseguire
  ai componenti figli. Su Windows aggiunge `onKeyDown` per coprire
  la navigazione da tastiera Narrator. Espone interfaccia
  `{ onActivity: () => void; children: ReactNode }`.

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

- `docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md` (CREATO) — documento di design per il _delivery layer_ di export file nativo multi-formato e multi-piattaforma. Architettura a tre layer: `exportToCSV` in `src/lib/helpers.ts` (generazione contenuto, invariata) / nuovo `ExportService` in `src/lib/export-service.ts` (delivery infrastrutturale asincrono, nessuna dipendenza React, nessun side effect UX) / `AppDataContext.tsx` (orchestrazione + side effect UX). Contratto `ExportResult` con sette classi di errore OS-native (`CANCELLED`, `PERMISSION_DENIED`, `FILESYSTEM_ERROR`, `UNSUPPORTED_PLATFORM`, `INVALID_PATH`, `INSUFFICIENT_SPACE`, `UNKNOWN`). Strategia multi-piattaforma: share sheet nativa su iOS/Android (`react-native-share`), save file dialog su Windows (`react-native-fs` o alternativa, soggetta a verifica di compatibilità con RNW 0.82.x). Struttura future-proof per formati multipli (CSV implementato; PDF/XLSX/altri rimandati). Breaking change documentato: firma `handleExportCSV` da `void` a `Promise<void>`. Risolve il punto N10 del report di diagnosi compatibilità React Native. Stato DRAFT.
- `docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md` (CREATO) — definisce il _connectivity contract_ dell'applicazione, sostituendo il rilevamento di rete basato su `navigator.onLine` e `window.addEventListener('online'|'offline')` (non funzionante in React Native) con un produttore centralizzato basato su NetInfo (`NetworkStatusProvider` + hook pubblico `useNetworkStatus`). Formalizza la semantica offline con distinzione `isConnected`/`isInternetReachable` (inclusa captive portal), il debounce direzionale 1000ms sul flapping online→offline, la strategia Fail-Safe Online-First per il fallback Windows, la posizione del provider nell'albero e il boundary producer-consumer con DESIGN 007. Perimetro: `src/hooks/use-online-status.ts`, `src/context/AppDataContext.tsx`. Risolve il punto N5 del report di diagnosi compatibilità React Native. Stato DRAFT.
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

## [0.4.0] — 2026-05-24

### DESIGN 006 — KDF PIN

- Libreria KDF: sostituita @noble/hashes con
  react-native-quick-crypto (benchmark: 75s → 86ms)
- Iterazioni PBKDF2: fissate a 600.000 (target Windows)
- Vincolo dipendenze: aggiornato da pure-JS a nativo consolidato
- Nota architetturale futura: Wrapped Master Key (§13)
- Dependency Governance prescritta (§14)

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
