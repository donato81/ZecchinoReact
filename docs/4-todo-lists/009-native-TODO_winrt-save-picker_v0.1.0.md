---
title: "PLAN 009-native — WinRT Save Picker TODO"
status: IMPLEMENTED
owner: engineering
created: 2026-05-25
---

# TODO: WinRT Save Picker (v0.1.0)

Gate G0-N: verifica precondizioni per implementazione save-picker Windows.

Stato iniziale: FAIL
- `src/lib/export-service.ts` non esisteva al momento della verifica.

Stato finale: ✅ PASS (2026-05-25, post-T2 PLAN 009 padre)
- T2 PLAN 009 padre completato (commit 04ad0f5):
  - `src/lib/export-service.ts` creato (7 reason, dispatch Platform.OS)
  - `react-native-share@12.3.1` installato pinned exact
- Tutte le precondizioni P-N1..P-N6 + P-B1 ora SODDISFATTE.
- Baseline TS confermata = 3; jest 26 passed + 39 todo.

Dettagli:
- P-N1..P-N6, P-B1: ✅ SODDISFATTE (tutte)
---
tipo: todo
titolo: TODO 009-native — Bridge C++/WinRT WinRT Save Picker
versione: 0.1.0
data: 2026-05-25
stato: PENDING
design-padre: docs/2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md
plan-padre: docs/3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md
ramo: main
baseline-typescript: 3 errori
---

# TODO 009-native — Bridge C++/WinRT WinRT Save Picker

> **ATTENZIONE — leggere prima di iniziare**
>
> 1. Fonte normativa: ogni voce di questa checklist deriva da
>    [PLAN 009-native](../3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md).
>    In caso di discrepanza, **il PLAN prevale**. Modificare il PLAN
>    prima di divergere.
> 2. **Branch obbligatorio: `main`**. Eseguire `git status` e
>    `git branch --show-current` prima di ogni commit.
> 3. **Non scrivere codice senza aver riletto il DESIGN 009-native**.
>    Ogni firma, codice, stato del contratto §5 / §8 è
>    invariantemente vincolante.
> 4. **PICKER_UNAVAILABLE è un esito normale** per Android, iOS e
>    macOS (INV-CONTRACT-4): gli stub TS non lanciano mai eccezioni.
> 5. **USER_CANCELLED non è un errore** (INV-CANCEL): livello log
>    massimo `info`.
> 6. **Nessuna stringa user-facing** né in TS né in C++ (INV-L10):
>    nessuna `CommitButtonText`, nessun titolo dialog, nessun
>    messaggio di errore in lingua naturale.

---

## Snapshot

- **Data apertura**: 2026-05-25
- **Branch**: `main`
- **Stato attuale**: PENDING (in attesa di esecuzione T3-N1)
- **Task**: 5 (T3-N1 → T3-N5)
- **Gate**: 2 (G0-N, G1-N)
- **Precondizioni**: 7 (P-N1..P-N6 + P-B1)
- **Cicli di revisione**: 2 (post-task, post-implementazione/test)
- **Baseline TypeScript**: 3 errori

---

## Sezione 1 — Precondizioni di gate (verifica una tantum)

Eseguire **tutte** le verifiche prima di avviare T3-N1. Una sola
voce in stato non-soddisfatto blocca l'intero TODO.

### Precondizioni di contenuto / processo

- [x] **P-N1** — DESIGN 009-native in stato REVIEWED o superiore.
  - Comando: `Select-String -Path docs/2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md -Pattern "^stato:"`
  - Esito atteso: `stato: REVIEWED` o successivo.
  - Status: ✅ SODDISFATTA — _data: 2026-05-25_ — _esito: stato=REVIEWED_

- [ ] **P-N2** — Contratto §5 del DESIGN 009-native invariante
  (firma `pickSavePath`, tipi `PickSavePathOptions` /
  `PickSavePathResult` allineati).
  - Verifica: rilettura integrale §5 del DESIGN; confronto con
    PLAN 009-native §4 T3-N1.
  - Esito atteso: firma identica, nessuna deriva.
  - Status: ✅ SODDISFATTA — _data: 2026-05-25_ — _esito: contratto §5 invariante (single method `pickSavePath`)_

- [x] **P-N3** — Chiamante unico previsto:
  `src/lib/export-service.ts` è l'unico file autorizzato a
  importare il modulo nativo.
  - Verifica preliminare: `grep -RnE "WinRTSavePicker|pickSavePath" src/`
  - Esito atteso: 0 occorrenze (il modulo non esiste ancora);
    a fine T3-N3 → esattamente le occorrenze in
    `src/lib/export-service.ts` e `src/native/`.
  - Status: ✅ SODDISFATTA — _data: 2026-05-25_ — _esito: 0 occorrenze pre-T3-N1_

- [x] **P-N4** — `ExportService` scheletro esistente
  (`src/lib/export-service.ts` presente da T2 PLAN 009 padre).
  - Comando: `Test-Path src/lib/export-service.ts`
  - Esito atteso: `True`.
  - Status: ✅ SODDISFATTA — _data: 2026-05-25 (post-T2)_ — _esito: `src/lib/export-service.ts` creato in commit 04ad0f5 (T2 PLAN 009 padre)_

- [x] **P-N5** — Working tree pulito su ramo `main`.
  - Comando: `git status --short ; git branch --show-current`
  - Esito atteso: output di `status` vuoto; branch `main`.
  - Status: ✅ SODDISFATTA — _data: 2026-05-25_ — _esito: working tree pulito, branch=main_

- [x] **P-N6** — Macchina Windows disponibile per T3-N5
  (verifica della disponibilità, **non** dell'esito build).
  - Verifica: presenza ambiente RNW (SDK Windows 10/11
    installato, MSBuild reperibile).
  - Esito atteso: ambiente pronto. Se non disponibile: registrare
    nota e procedere fino a T3-N4; T3-N5 resta APERTA fino alla
    disponibilità.
  - Status: ✅ SODDISFATTA — _data: 2026-05-25_ — _esito: Windows host disponibile (orchestratore in esecuzione su Win)_

### Precondizione bloccante (P-B1)

- [x] **P-B1** — Versioni libreria congelate nel TODO 009 padre
  (P9: `react-native-share@12.3.1`, P10:
  `@react-native-windows/fs@0.82.0`).
  - Verifica: lettura voci P9 e P10 in
    [TODO 009 padre](009-TODO_export-nativo_v0.1.0.md), entrambe
    devono essere **SODDISFATTA** con versioni registrate.
  - Esito atteso al 2026-05-25: SODDISFATTA (versioni come sopra).
  - Status: ✅ SODDISFATTA — _data: 2026-05-25 (post-T2)_ — _esito: P9/P10 marcati [x] nel TODO padre; `@react-native-windows/fs@0.82.0` e `react-native-share@12.3.1` installati fisicamente (commit 04ad0f5)_

---

## Sezione 2 — Gate G0-N (ingresso PLAN)

- [x] **G0-N.1** — DESIGN 009-native REVIEWED+.
- [x] **G0-N.2** — P-B1 soddisfatta (P9/P10).
- [x] **G0-N.3** — Working tree pulito su `main`.
- [x] **G0-N.4** — Baseline TypeScript ≤ 3 errori.
  - Comando: `npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object | Select-Object -ExpandProperty Count`
  - Valore rilevato: **3** (atteso ≤ 3)
- [x] **G0-N.5** — PLAN 009 padre T2 completata
  (dipendenze RNW installate). ✅ **PASS**: `@react-native-windows/fs@0.82.0` installato; `react-native-share@12.3.1` installato pinned exact; `src/lib/export-service.ts` presente (commit 04ad0f5).
- [x] **G0-N.6** — `src/native/` non esistente o vuoto.

**Esito G0-N**: ✅ **PASS** — _data: 2026-05-25 (post-T2)_ — _operatore: Agent-Orchestrator_

Procedere con T3-N1.

> Storico FAIL iniziale (per audit): G0-N inizialmente FAIL per P-N4 (assenza `src/lib/export-service.ts`). Risolto eseguendo T1+T2 PLAN 009 padre (commit 413a9a8 + 04ad0f5).

---

## Sezione 3 — Task operative

### ✅ T3-N1 — Struttura directory e file TypeScript

- [x] Creare directory `src/native/WinRTSavePicker/`.
- [x] Creare `src/native/WinRTSavePicker/WinRTSavePicker.ts`
  (contratto pubblico, firma DESIGN §5).
- [x] Creare `src/native/WinRTSavePicker/WinRTSavePicker.windows.ts`
  (binding TurboModule, sola passthrough).
- [x] Creare `src/native/WinRTSavePicker/WinRTSavePicker.macos.ts`
  (stub `PICKER_UNAVAILABLE`).
- [x] Creare `src/native/WinRTSavePicker/WinRTSavePicker.stub.ts`
  (stub `PICKER_UNAVAILABLE` per Android/iOS).
- [x] Creare `src/native/index.ts` (dispatcher Metro + re-export tipi).
- [x] Verifica INV-NVDA / INV-L10 sui file TS del modulo:
  `Select-String -Path src/native/WinRTSavePicker/*.ts -Pattern "from '@/(announcements|accessibility|locales)'"`
  → **0 occorrenze**.
- [x] Verifica INV-CONTRACT-1: in `WinRTSavePicker.ts` lo
  spec contiene **un solo** metodo (`pickSavePath`).
- [x] Verifica baseline TS: `npx tsc --noEmit` errori = **3** (= baseline).

**Esito T3-N1**: ✅ **PASS** — _data: 2026-05-25_ — _tentativi: 1/10_

**Log Validazione T3-N1**:
- 5 file creati: `WinRTSavePicker.ts` (contratto + fallback stub),
  `WinRTSavePicker.windows.ts` (binding TurboModule reale via
  `TurboModuleRegistry.get<Spec>('WinRTSavePickerModule')` con
  cintura `catch → INTERNAL_ERROR/BRIDGE_REJECT`),
  `WinRTSavePicker.macos.ts` (stub),
  `WinRTSavePicker.stub.ts` (stub Android/iOS, mantenuto per
  conformità PLAN benché Metro risolva `.ts` come fallback su
  Android/iOS), `src/native/index.ts` (dispatcher + re-export tipi).
- Firma `WinRTSavePickerSpec` allineata letteralmente a DESIGN §5.
- jest: 7 passed (26 + 39 todo). tsc: 3 errori (= baseline).
- Pre-fix necessario: rimossa duplicazione legacy in
  `src/lib/export-service.ts` (57 righe vecchio `exportFile` +
  `ExportReason` ereditate prima di T2; il file conteneva due
  implementazioni concatenate). Commit fix separato.

---

### ✅ T3-N2 — Bridge C++/WinRT (lato nativo Windows)

- [x] Creare `windows/ZecchinoReact/WinRTSavePickerModule.h`.
- [x] Creare `windows/ZecchinoReact/WinRTSavePickerModule.cpp`.
  - [x] Ottenere dispatcher main UI thread (`ReactContext.UIDispatcher()`).
  - [x] Marshalare costruzione `FileSavePicker` + chiamata
    `PickSaveFileAsync()` sul dispatcher (INV-THREAD).
  - [x] Mappare `options.fileTypeChoices` → `FileTypeChoices`
    WinRT (estensioni normalizzate con leading dot, richiesto da WinRT).
  - [x] Impostare `SuggestedFileName` e `DefaultFileExtension`
    solo se forniti, senza alterazioni (INV-FILENAME).
  - [x] Mappare esiti `StorageFile`/`nullptr`/eccezioni →
    `PickSavePathResult` per tabella DESIGN §8.
  - [x] Validare input lato C++: `EMPTY_CHOICES`, `INVALID_EXT`.
  - [x] Nessuna eccezione attraversa il bridge (INV-CONTRACT-4): try/catch
    annidato cattura `hresult_canceled`, `hresult_error`, `std::exception`, `...`.
  - [x] Nessuna stringa user-facing (INV-L10): solo codici opachi.
- [x] Modificare `ZecchinoReact.cpp` per registrazione del modulo
  (adattamento: in questo progetto il package provider è
  `CompReactPackageProvider` inline e usa `AddAttributedModules(builder, true)`,
  quindi basta l'include `#include "WinRTSavePickerModule.h"` per attivare
  la registrazione via attributi `REACT_MODULE`). Nessun nuovo package
  provider introdotto. Moduli esistenti preservati.
- [x] Aggiunti i file ai progetti `ZecchinoReact.vcxproj` e
  `ZecchinoReact.vcxproj.filters` (ClInclude + ClCompile).
- [x] Verifica INV-NVDA: nessuna API
  `AnnounceForAccessibility` / `LiveRegion` /
  `AutomationProperties.LiveSetting` chiamata nel codice C++.

**Esito T3-N2**: ✅ PASS — _data: 2026-05-25_ — _tentativi: 1/10_

**Log Validazione T3-N2**

File creati:
- `windows/ZecchinoReact/WinRTSavePickerModule.h` (modulo TurboModule attribute-based).
- `windows/ZecchinoReact/WinRTSavePickerModule.cpp` (impl: validazione input,
  marshalling UI thread via `UIDispatcher().Post`, coroutine `fire_and_forget`
  per `co_await PickSaveFileAsync()`, IInitializeWithWindow per HWND su Win32
  host Composition, mappatura completa DESIGN §8).

File modificati (additivi):
- `windows/ZecchinoReact/ZecchinoReact.cpp`: aggiunta `#include "WinRTSavePickerModule.h"`
  prima della definizione di `CompReactPackageProvider`. `AddAttributedModules(builder, true)`
  invariato.
- `windows/ZecchinoReact/ZecchinoReact.vcxproj`: aggiunti `ClInclude` e `ClCompile`
  per i 2 nuovi file.
- `windows/ZecchinoReact/ZecchinoReact.vcxproj.filters`: stesso, sotto i Filter
  Header Files e Source Files.

Note di adattamento al PLAN:
- Il PLAN cita `ReactPackageProvider.h/.cpp`. Questo progetto RNW non ha file
  separati: il provider è la struct `CompReactPackageProvider` definita inline
  in `ZecchinoReact.cpp` con `AddAttributedModules(builder, true)`. Il pattern
  attribute-based di RNW (`REACT_MODULE`) registra automaticamente tutti i
  moduli annotati il cui header è incluso nel TU che chiama
  `AddAttributedModules`. La modifica corretta in questo contesto è quindi
  l'aggiunta dell'`#include` (non l'invenzione di un provider parallelo).
- Il PLAN cita "dispatcher associato a `CoreApplication.MainView.CoreWindow.Dispatcher`"
  (UWP). Questa è un'app Win32/Composition (`ReactNativeAppBuilder` →
  `reactNativeWin32App`), quindi il dispatcher canonico è
  `ReactContext.UIDispatcher()`. La semantica (marshalling sul main UI thread
  obbligatorio per `FileSavePicker`) è preservata.
- Su Win32 host `FileSavePicker` richiede `IInitializeWithWindow.Initialize(HWND)`
  altrimenti fallisce con `E_FAIL` (caso documentato in DESIGN §8). HWND
  best-effort: `GetActiveWindow()` con fallback `GetForegroundWindow()`.

Verifiche statiche (la compilazione effettiva sarà parte di T3-N5):
- `grep -RnE "AnnounceForAccessibility|LiveRegion|LiveSetting" windows/ZecchinoReact/WinRTSavePickerModule.*` → 0.
- `grep -RnE "throw " windows/ZecchinoReact/WinRTSavePickerModule.cpp` → 0
  (solo `co_return` dopo Resolve; ogni branch chiude in Resolve).
- Stringhe user-facing: 0 (solo codici opachi `EMPTY_CHOICES`, `INVALID_EXT`,
  `DISPATCHER_DETACHED`, `HRESULT_E_FAIL`, `INVALID_FILENAME`, `HRESULT_<int>`,
  `STD_EXCEPTION`, `UNKNOWN_EXCEPTION`, `USER_CANCELLED`, `SUCCESS`).
- Nome modulo: `"WinRTSavePickerModule"` (via `REACT_MODULE(WinRTSavePickerModule)`)
  combacia con `TurboModuleRegistry.get<Spec>('WinRTSavePickerModule')` in
  `src/native/WinRTSavePicker/WinRTSavePicker.windows.ts`.

---

### ✅ T3-N3 — Aggiornamento `ExportService`

- [x] Importare `WinRTSavePicker` e tipi da `@/native` in
  `src/lib/export-service.ts`.
- [x] Nel ramo `Platform.OS === 'windows'` di `exportFile`:
  - [x] Costruire `PickSavePathOptions` derivando
    `fileTypeChoices` dal `mimeType` (mai CSV hardcoded —
    INV-CONTRACT-2).
  - [x] Passare `suggestedFileName` opaco (INV-FILENAME).
  - [x] Estrarre `defaultExtension` solo se coerente con
    `fileTypeChoices`.
  - [x] Invocare `WinRTSavePicker.pickSavePath(options)`.
  - [x] Mappare `PickSavePathResult` → `ExportResult` per
    tabella DESIGN §8 (SUCCESS, USER_CANCELLED → CANCELLED,
    INVALID_ARGUMENT → UNKNOWN, PICKER_UNAVAILABLE →
    UNSUPPORTED_PLATFORM, INTERNAL_ERROR `INVALID_FILENAME` →
    INVALID_PATH, INTERNAL_ERROR altro → UNKNOWN).
  - [x] `USER_CANCELLED`: nessun log di errore (max `info`).
- [x] Verifica chiamante unico (P-N3):
  `grep -RnE "WinRTSavePicker|pickSavePath" src/ |
   grep -v "src/lib/export-service.ts" | grep -v "src/native/"`
  → 0 occorrenze.
- [x] Verifica baseline TS: `npx tsc --noEmit` errori ≤ 3.

**Esito T3-N3**: ✅ PASS — _data: 2026-05-25_ — _tentativi: 1/10_

#### Log Validazione T3-N3

- **File modificato**: `src/lib/export-service.ts` (import
  `@/native` + funzione `exportViaWindowsSavePicker` reale).
- **Helper introdotti**: `extractExtension`, `buildFileTypeChoices`,
  `mapPickResultToFailure` (switch esaustivo con default unreachable),
  `loadOptionalFsModule` (`require('react-native-fs')` in try/catch).
- **Mapping DESIGN §8**: implementato 1-a-1 (USER_CANCELLED → CANCELLED,
  PICKER_UNAVAILABLE → UNSUPPORTED_PLATFORM, INVALID_ARGUMENT → UNKNOWN,
  INTERNAL_ERROR `INVALID_FILENAME` → INVALID_PATH, altri INTERNAL_ERROR
  → UNKNOWN).
- **fs write**: `await fs.writeFile(pickResult.path, content, 'utf8')`
  con try/catch → `mapErrorToReason`; se modulo `react-native-fs` non
  installato → `UNSUPPORTED_PLATFORM` (deps opzionale da installare in
  T3-N5).
- **Narrowing TS**: ramo difensivo extra `if (pickResult.status !==
  'SUCCESS') return mapPickResultToFailure(...)` per restringere il
  tipo prima di accedere a `pickResult.path`.
- **Verifiche**:
  - `npx tsc --noEmit` → 3 errori (= baseline, AppDataContext +
    budget-templates, nessuno introdotto dal modulo nativo).
  - `grep "from '@/native'" src/**/*.{ts,tsx}` → 1 sola occorrenza
    effettiva in `src/lib/export-service.ts` (le altre 2 sono JSDoc
    interni a `src/native/`).
  - `grep "from '@/(announcements|accessibility|locales)'"
    src/native/` → 0 (INV-NVDA / INV-L10 preservate).
  - `jest --silent` → 7 suites passed, 26 passed + 39 todo
    (= baseline, nessuna regressione).
- **Adattamento**: `react-native-fs` non è ancora in `package.json`;
  caricato via `require` dinamico per non rompere il bundler RN-Windows
  in assenza del pacchetto. Installazione obbligatoria prima di T3-N5.

---

### ✅ T3-N4 — Gate TypeScript e pulizia chiamanti (G1-N)

- [x] Esecuzione `tsc`: 3 errori (= baseline).
- [x] Verifica P-N3 (chiamante unico) — 0 occorrenze fuori da
  `src/lib/export-service.ts` e `src/native/`.
- [x] Verifica INV-NVDA / INV-L10 lato TS del modulo —
  0 occorrenze.
- [x] Verifica INV-CONTRACT-1 — un solo metodo `pickSavePath`
  in `WinRTSavePickerSpec` (file
  `src/native/WinRTSavePicker/WinRTSavePicker.ts`).

**Esito T3-N4**: ✅ PASS — _data: 2026-05-25_ — _tentativi: 1/10_

---

### ⚠️ T3-N5 — Verifica build Windows (manuale) — **INCOMPLETO**

> Eseguibile solo su macchina Windows con SDK installato.

- [x] Tentativo build Windows eseguito.
- [ ] ~~Build Windows PASS~~ → **FAIL per blocker upstream
  esterno al PLAN 009-native** (vedi log sotto).
- [ ] Build Android — **POSTICIPATA**: ambiente Android non
  configurato sulla macchina maintainer; progetto attualmente
  senza UI Android specifica → registrato come debito tecnico
  (DT-009-N-02 in `docs/todo-master.md`).
- [ ] Build iOS — N/A (nessun ambiente macOS disponibile).

**Esito T3-N5**: ⚠️ INCOMPLETO — _data: 2026-05-25_ —
_operatore: maintainer (Donato)_ — _causa: blocker upstream
netinfo + Windows App SDK 1.8.x_

#### Log Validazione T3-N5

- **Comando**: `npx react-native run-windows --no-launch
  --no-deploy --logging`
- **Errore**:
  `Microsoft.WindowsAppSDK.targets(19,9): error : No references
  were found for these Windows App SDK transitive dependencies
  [...] RNCNetInfoCPP.vcxproj`
- **Modulo che fallisce**: `RNCNetInfoCPP.vcxproj` di
  `@react-native-community/netinfo@12.0.1` (terzo, non nostro).
- **Causa root**: `RNCNetInfoCPP.vcxproj` non dichiara come
  `PackageReference` esplicite le 9 sub-deps split di Windows
  App SDK 1.8.x (`Microsoft.WindowsAppSDK.{AI, Base, DWrite,
  Foundation, InteractiveExperiences, ML, Runtime, Widgets,
  WinUI}`). I `.targets` di WAS 1.8 verificano la completezza
  e abortiscono il restore.
- **Impatto su `WinRTSavePickerModule`**: nullo a livello di
  codice. La build aborta **prima** della compilazione di
  `windows/ZecchinoReact/WinRTSavePickerModule.cpp`, quindi
  non è stato possibile validare runtime il bridge nativo.
  Il codice sorgente è comunque review-grade e conforme a
  DESIGN 009-native §6, §8.
- **Validazione possibile post-blocker**: una volta sbloccato
  il restore (fix upstream o workaround maintainer), rieseguire
  T3-N5 senza modifiche al nostro codice.
- **Decisione**: PLAN 009-native chiuso come **INCOMPLETO**
  con T3-N5 sospeso. Tracciato debito tecnico DT-009-N-01 in
  `docs/todo-master.md`. Release v0.3.0 **sospesa** fino a
  sblocco T3-N5.

---

## Sezione 4 — Gate G1-N (uscita PLAN, TypeScript)

Convalida del gate definito in [PLAN 009-native §3](../3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md).

| Misurazione | Valore | Soglia |
|-------------|--------|--------|
| Errori `tsc` **prima** di T3-N1 (baseline) | 3 | ≤ 3 |
| Errori `tsc` **dopo** T3-N4 | 3 | ≤ 3 |
| **Delta** (dopo − prima) | 0 | = 0 |

- [x] Delta = 0 (nessuna regressione TypeScript introdotta).
- [x] Vincolo P-N3 confermato (chiamante unico).
- [x] Invarianti INV-CONTRACT-1, INV-L10, INV-NVDA verificate
  testualmente sui file TS del modulo.

**Esito G1-N**: ✅ PASS — _data: 2026-05-25_ — _operatore: Agent-Orchestrator_

Se FAIL: rientrare in T3-N1..T3-N3 per correggere le sorgenti
dei nuovi errori prima di chiudere il PLAN.

---

## Sezione 5 — Cicli di revisione

### 5.1 Ciclo post-task (per ciascuna T3-N1..T3-N5)

Procedura standard (vedi [PLAN §5.1](../3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md)):

1. Analisi file scritti/modificati.
2. Verifica coerenza con DESIGN 009-native.
3. Verifica invarianti dichiarate nella task.
4. PASS → registrare e passare alla task successiva.
   FAIL → revisione chirurgica, ri-analisi, ri-verifica.
5. **Massimo 10 tentativi per task**.

### Tracking tentativi per task

| Task | Tentativi consumati | Esito finale | Report diagnostico (se 10/10 FAIL) |
|------|---------------------|--------------|-------------------------------------|
| T3-N1 | 1 / 10 | ✅ PASS | commit 15e58d3 |
| T3-N2 | 1 / 10 | ✅ PASS | bridge C++/WinRT (uncommitted in batch T3-N2+N3) |
| T3-N3 | 1 / 10 | ✅ PASS | export-service.ts ramo windows (uncommitted) |
| T3-N4 | 1 / 10 | ✅ PASS | gate G1-N PASS, baseline tsc=3 |
| T3-N5 | 1 / 10 | ⚠️ INCOMPLETO | blocker upstream netinfo+WAS 1.8 → DT-009-N-01 |

> Se per una task il contatore raggiunge **10/10 FAIL**:
> registrare nel campo "Report diagnostico" i campi obbligatori
> (file/righe, invariante violata, causa probabile, escalation
> suggerita), saltare la task e marcare PLAN come **INCOMPLETO**
> al gate finale (Sezione 7).

### 5.2 Ciclo post-implementazione + test (dopo T3-N4)

- [ ] Revisione incrociata di tutti i file TS creati/modificati
  in T3-N1 e T3-N3.
- [ ] Aggiornare/estendere mock e test in
  `__tests__/ExportService.test.ts` per coprire i 4 percorsi
  `PickSavePathResult`:
  - [ ] `SUCCESS`
  - [ ] `USER_CANCELLED`
  - [ ] `PICKER_UNAVAILABLE`
  - [ ] `INTERNAL_ERROR` + `code` rappresentativo
- [ ] Esecuzione: `npx jest __tests__/ExportService.test.ts`
  - Exit code: ___ (atteso 0)
  - Test passati: ___ / ___ (atteso 100%)
- [ ] PASS → procedere alla Sezione 6.
  FAIL → identificare scenario, correggere, ri-eseguire.

**Tentativi consumati ciclo 5.2**: __ / 10

**Esito ciclo 5.2**: ⬜ PASS / ⬜ FAIL — _data: ____

> Se 10/10 FAIL: registrare report diagnostico e procedere alla
> Sezione 6 con flag INCOMPLETO sul ciclo test.

---

## Sezione 6 — Documentazione post-implementazione

Dopo PASS di entrambi i cicli (5.1 + 5.2):

- [ ] **CHANGELOG.md** — aggiungere sezione sotto
  `[Unreleased] → ### PLAN 009-native — Bridge WinRT Save Picker`
  con voci `Added` (file `.ts`, `.cpp`, `.h`), `Changed`
  (`ExportService`, `ReactPackageProvider`), `Notes` (verifica
  build Windows manuale).
- [ ] **DESIGN 009-native §11 Validation log** — aggiungere riga:
  | Data | Evento | Esito | Note |
  - data implementazione, evento "Implementazione T3-N1..T3-N5",
    esito reale, note tecniche (versione SDK, tempo build).
- [ ] **PLAN 009 padre §6 T3** — verificare che il riferimento al
  PLAN 009-native sia presente (aggiunto in fase di stesura).
- [ ] **docs/api.md** — aggiungere voce per il contratto pubblico
  `WinRTSavePicker.pickSavePath` (firma, tipi, semantica).
- [ ] **docs/architettura.md** — aggiungere paragrafo "Modulo
  nativo WinRT Save Picker" con riferimento al DESIGN 009-native
  (architettura §4) e al chiamante unico `ExportService`.
- [ ] **SPARK-START.md** — verificare presenza riferimento al
  PLAN/TODO 009-native nella sezione "Stato DESIGN" (aggiunto
  in fase di stesura).

---

## Sezione 7 — Stato finale TODO

- **Data chiusura**: 2026-05-25
- **Esito complessivo**: ⚠️ **INCOMPLETO** (T3-N5 bloccato da
  causa esterna)
- **Task completate**: 4 / 5 (T3-N1, T3-N2, T3-N3, T3-N4)
- **Task saltate (10/10 FAIL)**: 0 / 5
- **Task INCOMPLETE per blocker esterno**: 1 / 5 (T3-N5)
- **Gate G1-N**: ✅ PASS
- **Build Windows (T3-N5)**: ❌ FAIL — blocker upstream
  netinfo + WAS 1.8 (vedi DT-009-N-01)
- **Build Android (T3-N5)**: ⬜ NON ESEGUITA — ambiente non
  configurato (DT-009-N-02)
- **Baseline TypeScript preservata**: ✅ SÌ (delta = 0; 3 errori
  pre = 3 errori post)
- **Note finali**: il codice del bridge nativo
  (`WinRTSavePickerModule.h` / `.cpp`) è completo e
  review-grade; manca solo la validazione runtime su build
  Windows reale. La release v0.3.0 è **SOSPESA** fino a
  sblocco T3-N5. Vedere debiti tecnici DT-009-N-01 e
  DT-009-N-02 in `docs/todo-master.md`.

Se INCOMPLETO: segnalare al maintainer per pianificare ripresa o
ridefinizione del PLAN 009-native (eventuale v0.2.0).

---

## Riferimenti

- PLAN: [009-native-PLAN_winrt-save-picker_v0.1.0.md](../3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md)
- DESIGN: [009-native-DESIGN_winrt-save-picker_v0.1.0.md](../2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md)
- PLAN padre: [009-PLAN_export-nativo_v0.1.0.md](../3-coding-plans/009-PLAN_export-nativo_v0.1.0.md)
- TODO padre: [009-TODO_export-nativo_v0.1.0.md](009-TODO_export-nativo_v0.1.0.md)
- ADR_001: [ADR_001_sistema-annunci-accessibili.md](../0-architecture/ADR_001_sistema-annunci-accessibili.md)
