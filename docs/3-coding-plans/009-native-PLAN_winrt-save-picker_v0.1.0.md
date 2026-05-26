---
tipo: coding-plan
titolo: PLAN 009-native — Bridge C++/WinRT WinRT Save Picker
versione: 0.1.0
data: 2026-05-25
stato: IMPLEMENTED
design-padre: docs/2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md
plan-padre: docs/3-coding-plans/009-PLAN_export-nativo_v0.1.0.md
ramo: main
fase: P3
blocco: P3.B2-EXT
baseline-typescript: 3 errori (PLAN 009 §2.3)
---

# PLAN 009-native — Bridge C++/WinRT WinRT Save Picker

> **Fonte di verità**: ogni decisione di questo piano deriva da
> [DESIGN 009-native](../2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md).
> In caso di discrepanza, il design prevale.
>
> **Governance superiore**: questo PLAN integra ma **non sostituisce**
> [PLAN 009 padre](009-PLAN_export-nativo_v0.1.0.md). Specifica
> dettagliatamente la sola T3 (modulo nativo); T1, T2, T4..T8 del
> PLAN 009 padre restano in capo a quest'ultimo.

---

## Sezione 1 — Metadata

- **Plan ID**: 009-native
- **Titolo**: Bridge C++/WinRT WinRT Save Picker
- **Versione**: v0.1.0
- **Data**: 2026-05-25
- **Stato**: DRAFT
- **Fase**: P3
- **Blocco**: P3.B2-EXT (sotto-componente di P3.B2)
- **Ramo**: `main`
- **Design padre**: [009-native-DESIGN_winrt-save-picker_v0.1.0.md](../2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md)
- **PLAN padre**: [009-PLAN_export-nativo_v0.1.0.md](009-PLAN_export-nativo_v0.1.0.md)
- **TODO operativo**: [009-native-TODO_winrt-save-picker_v0.1.0.md](../4-todo-lists/009-native-TODO_winrt-save-picker_v0.1.0.md)
- **Baseline TypeScript**: 3 errori (PLAN 009 §2.3)
- **Autore**: Copilot Agent (modalità Agent-Docs)

---

## Sezione 2 — Contesto e dipendenze

### 2.1 Ruolo nel quadro PLAN 009 padre

Il [PLAN 009 padre](009-PLAN_export-nativo_v0.1.0.md) definisce il
delivery layer multi-piattaforma dell'export file. La task **T3** del
PLAN 009 padre delega la creazione del modulo nativo Windows
(`WinRTSavePicker`) a un piano di dettaglio dedicato, in modo da
isolare i vincoli C++/WinRT, il thread model e la registrazione
TurboModule dal flusso principale TypeScript.

Questo PLAN 009-native **sostituisce e completa** la T3 del PLAN 009
padre. Il PLAN padre continua a governare:

- T1 (verifica breaking change `handleExportCSV`),
- T1-bis (chiavi di localizzazione export),
- T2 (installazione dipendenze e skeleton `ExportService`),
- T4 (integrazione Windows + riscrittura `handleExportCSV` async),
- T5..T8 (consumer, test, documentazione, gate di chiusura).

L'output di questo PLAN 009-native è l'unico input ammesso per la
parte Windows di T4 del PLAN 009 padre (DESIGN 009-native §9 P-N3).

### 2.2 Dipendenze formali

Questo PLAN dipende strettamente da:

- **DESIGN 009-native** in stato REVIEWED o superiore (vedi G0-N).
  Tutte le invarianti di contratto (INV-CONTRACT-1..5, INV-L10,
  INV-FILENAME, INV-THREAD, INV-CANCEL, INV-NVDA) e le precondizioni
  P-N1..P-N6 sono **invariantemente vincolanti** per questo PLAN.
- **PLAN 009 padre** in stato DRAFT o successivo, con T2 (installazione
  dipendenze RNW) almeno avviata. Il bridge C++/WinRT non può essere
  registrato senza che `react-native-windows` ^0.82.5 sia presente nel
  workspace.
- **Precondizione bloccante P-B1** (DESIGN 009-native §9):
  congelamento versioni `react-native-share` e
  `@react-native-windows/fs` nel TODO 009 padre (voci P9 e P10).
  Stato attuale al 2026-05-25: **SODDISFATTA**
  (`react-native-share@12.3.1`, `@react-native-windows/fs@0.82.0`).
  Qualunque regressione di P9/P10 invalida questo PLAN.

### 2.3 Cosa NON include questo PLAN

Per disciplina di confine (DESIGN 009-native §3 e §9), questo PLAN
**non** prevede né autorizza:

- Modifiche a `src/lib/helpers.ts` (INV-1 del PLAN 009 padre).
- Modifiche a `src/context/AppDataContext.tsx` salvo il consumo
  indiretto via `ExportService` (di pertinenza di T4 PLAN 009 padre).
- Annunci NVDA generati dal bridge C++/WinRT (INV-NVDA).
- Stringhe utente localizzate emesse dal modulo nativo (INV-L10).
- Validazione/sanitizzazione del nome file (INV-FILENAME).

---

## Sezione 3 — Gate di ingresso

### Gate G0-N — Precondizioni preliminari

Prima di avviare qualsiasi task T3-N*, verificare **tutte** le
seguenti condizioni. La prima violazione blocca il PLAN.

| ID | Precondizione | Verifica | Esito atteso |
|----|---------------|----------|--------------|
| G0-N.1 | DESIGN 009-native in stato REVIEWED o superiore | `Select-String -Path docs/2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md -Pattern "^stato:"` | `stato: REVIEWED` o superiore |
| G0-N.2 | P-B1 soddisfatta (P9 e P10 nel TODO 009 padre) | Lettura della tabella precondizioni in [TODO 009 padre](../4-todo-lists/009-TODO_export-nativo_v0.1.0.md) | P9 e P10 entrambe **SODDISFATTA**, versioni registrate |
| G0-N.3 | Working tree pulito su ramo `main` | `git status --short` ; `git branch --show-current` | Output vuoto ; `main` |
| G0-N.4 | Baseline TypeScript ≤ 3 errori | `npx tsc --noEmit 2>&1 \| Select-String "error TS" \| Measure-Object` | `Count` ≤ 3 |
| G0-N.5 | PLAN 009 padre T2 completata (deps `@react-native-windows/fs` e `react-native-share` installate) | `npm ls @react-native-windows/fs` ; `npm ls react-native-share` | Versioni presenti nell'albero |
| G0-N.6 | `src/native/` ancora inesistente (no collisione) | `Test-Path src/native` | `False` (o esistente solo per artefatti di lavoro non committati) |

Se anche un solo gate G0-N.* fallisce: STOP. Non avviare T3-N1.

### Gate G1-N — Gate TypeScript post-implementazione

Definito al termine di T3-N4 (vedi Sezione 4). Soglia: il PLAN
009-native **non deve introdurre nuovi errori** `tsc` rispetto alla
baseline = 3.

```bash
npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object | `
  Select-Object -ExpandProperty Count
```

Esito atteso: `Count` ≤ 3 (delta vs baseline = 0 oppure < 0).
Qualsiasi `Count` > 3 implica rientrare in T3-N1..T3-N3 e correggere
le sorgenti dei nuovi errori prima di chiudere il PLAN.

---

## Sezione 4 — Task implementative

I task sono sequenziali. Ogni task ha pre-condizioni, passi operativi,
invarianti vincolanti e criteri di completamento verificabili.

> **Nota di metodo**: questo PLAN descrive **cosa fare** e **quale
> contratto rispettare**, non **come scrivere il codice**. Lo
> scrivere effettivo dei file `.ts` e `.cpp` è di pertinenza
> dell'agente coder in sessione separata.

---

### T3-N1 — Struttura directory e file TypeScript del modulo

- **Pre-condizioni**: G0-N superato; nessun file presente in
  `src/native/WinRTSavePicker/`.
- **File da creare**:
  - `src/native/WinRTSavePicker/WinRTSavePicker.ts`
    (contratto pubblico TypeScript).
  - `src/native/WinRTSavePicker/WinRTSavePicker.windows.ts`
    (binding TurboModule lato JS).
  - `src/native/WinRTSavePicker/WinRTSavePicker.macos.ts`
    (stub `PICKER_UNAVAILABLE` per macOS — DESIGN §6).
  - `src/native/WinRTSavePicker/WinRTSavePicker.stub.ts`
    (stub `PICKER_UNAVAILABLE` per Android/iOS — DESIGN §6).
  - `src/native/index.ts`
    (dispatcher Metro: riesporta `WinRTSavePicker`).

- **Passi operativi**:
  1. Creare la directory `src/native/WinRTSavePicker/`.
  2. In `WinRTSavePicker.ts` dichiarare **esattamente** la firma
     definitiva del DESIGN 009-native §5: tipi
     `FileTypeChoice`, `PickSavePathOptions`, `PickSavePathResult`,
     interfaccia `WinRTSavePickerSpec` con il **solo** metodo
     `pickSavePath(options: PickSavePathOptions): Promise<PickSavePathResult>`,
     ed `export const WinRTSavePicker: WinRTSavePickerSpec`.
  3. In `WinRTSavePicker.windows.ts` esporre il binding al
     TurboModule registrato lato C++/WinRT (creato in T3-N2). Il
     file fa **solo da adattatore**: nessuna logica di dominio,
     nessuna trasformazione dei `status`/`code`.
  4. In `WinRTSavePicker.macos.ts` e in `WinRTSavePicker.stub.ts`
     implementare il contratto restituendo sempre
     `Promise.resolve({ status: 'PICKER_UNAVAILABLE' })` — DESIGN
     §6 (sezioni macOS, Android, iOS). I file **non lanciano mai
     eccezioni** (INV-CONTRACT-4).
  5. In `src/native/index.ts` esportare il simbolo `WinRTSavePicker`
     sfruttando la risoluzione per piattaforma del Metro bundler.
     Riesportare anche i tipi pubblici (`FileTypeChoice`,
     `PickSavePathOptions`, `PickSavePathResult`,
     `WinRTSavePickerSpec`) per consentire l'import unico
     `from '@/native'` lato `ExportService`.

- **Invarianti vincolanti**:
  - **INV-CONTRACT-1..5** (DESIGN §5): un solo metodo pubblico,
    generic `fileTypeChoices`, solo codici, mai throw, shape
    risultato stabile.
  - **INV-L10** (DESIGN §5, §7): nessuna stringa utente
    attraversa il modulo né in input né in output.
  - **INV-FILENAME** (DESIGN §5): nessuna sanitizzazione del nome
    file; pass-through opaco.
  - **INV-CANCEL** (DESIGN §8): cancellation modellata come stato
    `USER_CANCELLED`, mai come errore.
  - **INV-NVDA** (DESIGN §10): i file TypeScript del modulo non
    importano `src/announcements/`, `src/accessibility/`,
    `src/locales/`.

- **Criteri di completamento**:
  - I 5 file esistono.
  - La firma dichiarata in `WinRTSavePicker.ts` corrisponde
    **letteralmente** alla forma del DESIGN §5.
  - Gli stub macOS/Android/iOS rispondono `PICKER_UNAVAILABLE`.
  - `npx tsc --noEmit` non aumenta il conteggio errori oltre la
    baseline (3).
  - `Select-String -Path src/native/WinRTSavePicker/*.ts -Pattern "from '@/(announcements|accessibility|locales)'"`
    → 0 occorrenze (INV-NVDA, INV-L10).

---

### T3-N2 — Bridge C++/WinRT (lato nativo Windows)

- **Pre-condizioni**: T3-N1 completata; T2 PLAN 009 padre
  completata (autolinking RNW funzionante).
- **File da creare/modificare** in `windows/ZecchinoReact/`:
  - `WinRTSavePickerModule.h` (header del TurboModule).
  - `WinRTSavePickerModule.cpp` (implementazione invocazione
    `Windows::Storage::Pickers::FileSavePicker`).
  - `ReactPackageProvider.h` / `ReactPackageProvider.cpp`
    (modifica: registrazione del nuovo modulo nel package
    provider esistente; **non** introdurre un nuovo package
    provider).

- **Passi operativi**:
  1. Dichiarare nel file `.h` la classe TurboModule con un singolo
     metodo asincrono `pickSavePath` che riceve il payload
     `PickSavePathOptions` e restituisce una Promise risolta con un
     `PickSavePathResult`. La forma serializzata sul bridge JSI
     deve corrispondere esattamente al contratto §5.
  2. Nel file `.cpp` implementare il metodo seguendo il flusso
     DESIGN §6 (sezione "Windows — implementazione reale"):
     1. **Ottenere il dispatcher del main UI thread** secondo il
        modello richiesto da RNW 0.82.x (es. dispatcher associato a
        `CoreApplication.MainView.CoreWindow`).
     2. **Marshalare l'esecuzione** della costruzione del
        `FileSavePicker` e della chiamata
        `PickSaveFileAsync()` sul dispatcher di cui sopra
        (INV-THREAD). Se il bridge è già invocato sul main UI
        thread, evitare il double dispatch.
     3. Mappare `options.fileTypeChoices` in
        `FileTypeChoices` WinRT (le estensioni passate senza il
        punto iniziale come da §5).
     4. Impostare `SuggestedFileName` e `DefaultFileExtension`
        **solo se** forniti dall'opzione, **senza alterarli**.
     5. Eseguire `PickSaveFileAsync()` e attendere il risultato
        tramite `co_await` o continuazione equivalente che
        preservi il dispatcher (DESIGN §6 "Thread affinity e async
        boundary").
     6. Mappare l'esito in `PickSavePathResult` secondo la
        tabella DESIGN §8: `StorageFile` non null → `SUCCESS` +
        `path`; `nullptr` → `USER_CANCELLED`.
     7. **Catturare ogni eccezione** (`winrt::hresult_error`,
        `winrt::hresult_canceled`, `std::exception`, altre) e
        mapparla in `INTERNAL_ERROR` con `code` opaco preso dalla
        tabella DESIGN §8 (`HRESULT_E_FAIL`,
        `THREAD_AFFINITY_VIOLATION`, `DISPATCHER_DETACHED`,
        `INVALID_FILENAME`). **Nessuna eccezione attraversa il
        bridge** (INV-CONTRACT-4).
     8. Validare i parametri di input lato C++:
        `fileTypeChoices` vuoto → `INVALID_ARGUMENT` +
        `EMPTY_CHOICES`; `defaultExtension` non contenuta in
        alcuna `extensions` → `INVALID_ARGUMENT` + `INVALID_EXT`.
        Questi sono errori di programmatore e si traducono in
        `ExportResult.UNKNOWN` lato TS (DESIGN §8).
  3. Aggiornare `ReactPackageProvider.*` per registrare il
     TurboModule appena introdotto, **preservando** la
     registrazione di tutti gli altri moduli già presenti.
  4. **Nessuna stringa utente** può essere costruita nel codice
     C++: nessuna `CommitButtonText`, nessun titolo dialog,
     nessun messaggio di errore in lingua naturale (INV-L10,
     DESIGN §7).

- **Invarianti vincolanti**:
  - **INV-THREAD** (DESIGN §6): esecuzione di
    `PickSaveFileAsync()` sul main UI thread. Violazione →
    `THREAD_AFFINITY_VIOLATION` (mai crash, mai eccezione
    propagata).
  - **INV-L10** (DESIGN §5, §7): nessuna stringa localizzata o
    destinata all'utente nel codice C++.
  - **INV-CONTRACT-4** (DESIGN §5): nessuna eccezione attraversa
    il bridge; ogni esito è uno `status` enumerato.
  - **Tabella codici DESIGN §8**: mapping `StorageFile`/`nullptr`/
    eccezioni → `PickSavePathResult` rispettato alla lettera.
  - **INV-NVDA** (DESIGN §10): il bridge non chiama
    `AnnounceForAccessibility`, `LiveRegion`,
    `AutomationProperties.LiveSetting` o equivalenti
    WinRT/UWP/WinUI.

- **Nota critica thread model (RNW 0.82.x)**:
  La continuità async WinRT ↔ JS attraversa due dispatcher
  distinti: il dispatcher del main UI thread (richiesto
  dall'API `FileSavePicker`) e il dispatcher del modulo
  TurboModule per la risoluzione della Promise lato JS. Il
  bridge è responsabile di preservare il contesto del
  dispatcher di main UI fino al punto di risoluzione della
  Promise. Eventuali errori di transizione devono essere
  catturati e mappati in `INTERNAL_ERROR` + `DISPATCHER_DETACHED`
  (DESIGN §8).

- **Criteri di completamento**:
  - I tre file `.h`/`.cpp`/`ReactPackageProvider.*` sono presenti
    e modificati.
  - Il modulo è registrato nel package provider esistente
    (nessun nuovo provider).
  - Build manuale verificata in T3-N5 (questa task lascia il
    risultato pronto alla compilazione, ma non garantisce da sé
    l'esito della build).
  - Nessuna stringa user-facing nel codice C++ del modulo
    (verifica testuale del maintainer).

---

### T3-N3 — Aggiornamento `ExportService` (cliente del modulo nativo)

- **Pre-condizioni**: T3-N1 completata (i tipi pubblici sono
  disponibili lato TS); T3-N2 può essere ancora in attesa di build
  manuale (T3-N5), ma il binding TurboModule deve esistere
  almeno come dichiarazione.
- **File da modificare**:
  - `src/lib/export-service.ts` (esistente, creato da T2 PLAN 009
    padre).

- **Passi operativi**:
  1. Importare `WinRTSavePicker` e i tipi
     `PickSavePathOptions`, `PickSavePathResult` da
     `@/native` (dispatcher Metro creato in T3-N1).
  2. Nel ramo `Platform.OS === 'windows'` di `exportFile`,
     costruire l'oggetto `PickSavePathOptions` derivandolo dai
     parametri di `exportFile`:
     - `fileTypeChoices`: da derivare in modo **generico** dal
       `mimeType` ricevuto, **senza** hardcoding CSV (INV-3 del
       PLAN 009 padre, INV-CONTRACT-2 del DESIGN 009-native §5).
     - `suggestedFileName`: il `fileName` ricevuto da `exportFile`
       **già sanitizzato** dal chiamante (INV-FILENAME).
     - `defaultExtension`: estrazione dalla coda di `fileName`
       (solo se coerente con `fileTypeChoices`); in caso contrario
       omessa.
  3. Invocare `WinRTSavePicker.pickSavePath(options)` e mappare
     il `PickSavePathResult` ricevuto in un `ExportResult`
     secondo la tabella DESIGN 009-native §8:

     | `PickSavePathResult` | → `ExportResult` |
     |----------------------|------------------|
     | `SUCCESS` | prosegue alla scrittura via `@react-native-windows/fs`, poi `{ success: true }` |
     | `USER_CANCELLED` | `{ success: false, reason: 'CANCELLED' }` (INV-CANCEL) |
     | `INVALID_ARGUMENT` (qualsiasi `code`) | `{ success: false, reason: 'UNKNOWN' }` |
     | `PICKER_UNAVAILABLE` | `{ success: false, reason: 'UNSUPPORTED_PLATFORM' }` |
     | `INTERNAL_ERROR` + `code = 'INVALID_FILENAME'` | `{ success: false, reason: 'INVALID_PATH' }` |
     | `INTERNAL_ERROR` (altro `code`) | `{ success: false, reason: 'UNKNOWN' }` |

  4. Il risultato `USER_CANCELLED` **non viene loggato come errore**
     (INV-CANCEL, DESIGN §8). Massimo livello ammesso: `info`.
  5. **Vincolo di chiamante unico (P-N3 DESIGN §9)**:
     `ExportService` resta l'**unico** consumatore del modulo
     nativo. Nessun file del repository, all'infuori di
     `src/lib/export-service.ts`, può importare `WinRTSavePicker`,
     `PickSavePathOptions`, `PickSavePathResult` o
     `WinRTSavePickerSpec`.

- **Invarianti vincolanti**:
  - **INV-CANCEL** (DESIGN §8): `USER_CANCELLED` mappato a
    `CANCELLED`, mai a un reason di errore.
  - **INV-CONTRACT-2** (DESIGN §5): `fileTypeChoices` derivato dal
    `mimeType` di `exportFile`, **mai** con default CSV hardcoded.
  - **INV-2 / INV-3 / INV-4 / INV-5** (PLAN 009 padre §5):
    `ExportService` non importa `react|@/context|@/hooks|@/components`,
    accetta `mimeType: string`, non solleva eccezioni, non esegue
    side effect UX.
  - **P-N3 DESIGN §9**: chiamante unico.

- **Criteri di completamento**:
  - `Select-String -Path src/lib/export-service.ts -Pattern "WinRTSavePicker|pickSavePath"`
    → ≥ 2 occorrenze (import + invocazione).
  - `grep -RnE "WinRTSavePicker|pickSavePath" src/` **escluso**
    `src/lib/export-service.ts` e `src/native/` → 0 occorrenze
    (P-N3).
  - Tabella di mapping DESIGN §8 implementata interamente nel
    ramo Windows di `exportFile`.
  - `npx tsc --noEmit` resta entro la baseline (≤ 3).

---

### T3-N4 — Gate TypeScript e pulizia chiamanti

- **Pre-condizioni**: T3-N1, T3-N2, T3-N3 completate.
- **File controllati** (read-only): `src/**/*.ts`, `src/**/*.tsx`.

- **Passi operativi**:
  1. Eseguire `npx tsc --noEmit 2>&1 | Select-String "error TS" |
     Measure-Object | Select-Object -ExpandProperty Count`.
     Verificare `Count` ≤ 3 (baseline). Se `Count` > 3:
     classificare ciascun nuovo errore e correggerlo nei file di
     T3-N1..T3-N3 prima di proseguire.
  2. Verificare il vincolo P-N3 (chiamante unico) con ricerca
     testuale:
     ```bash
     grep -RnE "from '@/native'|from '@/native/WinRTSavePicker'" src/ `
       | grep -v "src/lib/export-service.ts"
     ```
     Esito atteso: 0 occorrenze.
  3. Verificare l'invariante INV-NVDA / INV-L10 lato TS:
     ```bash
     grep -RnE "from '@/(announcements|accessibility|locales)'" `
       src/native/
     ```
     Esito atteso: 0 occorrenze.
  4. Verificare INV-CONTRACT-1 (single-method): in
     `WinRTSavePicker.ts` la firma di `WinRTSavePickerSpec`
     contiene un **solo** metodo.

- **Invarianti vincolanti**: G1-N (Sezione 3), P-N3, INV-L10,
  INV-NVDA, INV-CONTRACT-1.

- **Criteri di completamento**:
  - Gate G1-N superato: `Count` ≤ 3.
  - Vincolo P-N3 confermato.
  - INV-NVDA / INV-L10 confermate sui file TS del modulo.

---

### T3-N5 — Verifica build Windows (intervento manuale del maintainer)

> **Nota**: questa task richiede una macchina Windows fisica con
> SDK Windows 10/11 installato. Non è automatizzabile in CI
> cross-platform (DT-009-03 del PLAN 009 padre).

- **Pre-condizioni**: T3-N2 e T3-N3 completate; T3-N4 superata
  (gate TypeScript verde).
- **Esecutore**: maintainer (donny-81) o ruolo equivalente.

- **Passi operativi**:
  1. Su macchina Windows con working tree allineato al ramo `main`
     aggiornato, eseguire:
     ```bash
     npx react-native run-windows --no-launch --no-deploy --logging
     ```
  2. Registrare nel log di validazione del TODO (Sezione 5 del
     TODO 009-native) i seguenti campi obbligatori:
     - **Esito**: PASS / FAIL.
     - **Versione SDK Windows** utilizzata (es. 10.0.22621.0).
     - **Tempo di build** (in minuti).
     - **Warning C++/WinRT** rilevanti (lista breve o "nessuno").
     - **Errori di linker** (se PASS = NO).
  3. In caso di FAIL: rientrare in T3-N2 e correggere il codice
     C++; ripetere T3-N4 + T3-N5 in ciclo.
  4. Verificare in parallelo che le build Android/iOS non
     regrediscano (lo stub Metro non deve generare reference
     errors):
     ```bash
     npx react-native run-android --variant=debug
     ```
     Su iOS la verifica è facoltativa in questa fase (richiede
     ambiente macOS); se eseguita, registrarne l'esito.

- **Criteri di completamento**:
  - Log di validazione T3-N5 compilato integralmente nel TODO.
  - Build Windows = PASS.
  - Build Android = PASS (no regressioni stub).

---

## Sezione 5 — Ciclo revisione e convalida post-task

Ogni task della Sezione 4 è soggetta a un ciclo di revisione
strutturato. La convalida produce sempre un esito esplicito
(PASS o FAIL + causa).

### 5.1 Ciclo revisione post-task (applicato a T3-N1..T3-N5)

Dopo ogni task:

1. **Analisi**: rileggere i file appena scritti o modificati.
2. **Verifica coerenza con DESIGN 009-native**: confrontare ogni
   modifica con la sezione corrispondente del design (firma §5,
   architettura §4, multi-piattaforma §6, codici §8,
   precondizioni §9, compatibilità §10).
3. **Verifica invarianti dichiarate**: per ogni invariante elencata
   nella task, eseguire la verifica testuale o concettuale
   prescritta nei "Criteri di completamento".
4. **Esito intermedio**:
   - **PASS**: registrare esito nel TODO e passare alla task
     successiva.
   - **FAIL**: registrare causa, eseguire revisione chirurgica del
     file responsabile, **ri-analizzare**, ri-verificare.
5. Ripetere fino a convalida PASS. **Massimo 10 tentativi** per
   task.
6. **Limite raggiunto (10/10 FAIL)**: NON proseguire alla task
   successiva sul ramo principale. Registrare nel TODO un
   **report diagnostico dettagliato** con:
   - File interessato e righe coinvolte.
   - Invariante violata.
   - Numero tentativi (10/10).
   - Causa probabile in linguaggio tecnico.
   - Eventuale escalation suggerita (rivedere DESIGN, contattare
     maintainer, sospendere PLAN).
   Solo dopo aver registrato il report, **saltare la task** e
   proseguire alle successive in modalità degradata, marcando
   chiaramente il PLAN come INCOMPLETO al gate finale.

### 5.2 Ciclo revisione e aggiornamento post-implementazione (dopo T3-N4)

Dopo che T3-N4 ha superato il gate TypeScript:

1. **Revisione incrociata** di tutti i file TS creati o modificati
   in T3-N1 e T3-N3.
2. **Copertura test**: aggiornare o estendere i test esistenti per
   coprire i quattro percorsi del contratto §5 / §8:
   - `SUCCESS` (mock `WinRTSavePicker.pickSavePath` con path
     valido).
   - `USER_CANCELLED` (mock con `status: 'USER_CANCELLED'`).
   - `PICKER_UNAVAILABLE` (mock con `status: 'PICKER_UNAVAILABLE'`).
   - `INTERNAL_ERROR` (mock con `status: 'INTERNAL_ERROR'` +
     `code` rappresentativo).
   L'aggiornamento test agisce su `__tests__/ExportService.test.ts`
   (già pianificato da T6 PLAN 009 padre): questo PLAN
   009-native **non duplica** la suite, ma garantisce che almeno i
   quattro path siano coperti tramite il mock corretto del
   contratto `PickSavePathResult`.
3. **Esecuzione**:
   ```bash
   npx jest __tests__/ExportService.test.ts
   ```
   Esito atteso: exit code 0, nessuna regressione.
4. **Esito intermedio**:
   - **PASS**: registrare nel TODO e proseguire alla Sezione 6.
   - **FAIL**: identificare lo scenario fallito, correggere
     mock o test, ri-eseguire.
5. **Massimo 10 tentativi**. Se il limite è raggiunto:
   registrare report diagnostico (campi come §5.1.6) e
   proseguire alla Sezione 6 marcando il PLAN come INCOMPLETO
   sul ciclo test.

---

## Sezione 6 — Aggiornamento documentazione

Dopo la convalida di entrambi i cicli (§5.1 e §5.2), eseguire i
seguenti aggiornamenti documentali. **Nessuna release** viene
generata: questa è stesura documentale, non implementazione.

### 6.1 [CHANGELOG.md](../../CHANGELOG.md)

Aggiungere sotto la voce `[Unreleased] → Documentation` una
sotto-sezione che dichiari:

- Stesura `009-native-PLAN_winrt-save-picker_v0.1.0.md`.
- Stesura `009-native-TODO_winrt-save-picker_v0.1.0.md`.
- Aggiornamento Validation Log DESIGN 009-native §11.
- Aggiornamento riferimento T3 in PLAN 009 padre §6 Task T3
  (puntatore al PLAN dettagliato 009-native).

### 6.2 [DESIGN 009-native](../2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md) §11

Aggiungere una riga alla tabella "Validation log" con:

| Data | Evento | Esito | Note |
|------|--------|-------|------|
| 2026-05-25 | Stesura PLAN 009-native + TODO 009-native | DONE | Agent-Docs. Contratto §5 propagato 1:1 nel PLAN; bloccante P-B1 confermato SODDISFATTO al momento della stesura. |

### 6.3 [PLAN 009 padre](009-PLAN_export-nativo_v0.1.0.md) §6 Task T3

Aggiungere all'inizio della descrizione di T3 una nota:

> **PLAN dettagliato**: la specifica completa di questo task è in
> [009-native-PLAN_winrt-save-picker_v0.1.0.md](009-native-PLAN_winrt-save-picker_v0.1.0.md).
> Il presente blocco T3 resta come riferimento di alto livello;
> ogni decisione tecnica del modulo nativo è governata dal PLAN
> dettagliato.

L'aggiornamento è **additivo**: non rimuovere né riscrivere le
righe esistenti di T3.

### 6.4 [docs/todo-master.md](../todo-master.md)

Se il file contiene un riferimento alla riga 009-native, aggiornare
lo stato a `PLAN DISPONIBILE` con link al PLAN dettagliato. Se non
contiene riferimenti, **non** aggiungere nuove righe in questa
sede (la presenza di voci 009-native nel todo-master è di
pertinenza del maintainer).

### 6.5 [SPARK-START.md](../../SPARK-START.md)

Nella sezione "Stato DESIGN", aggiungere due righe sotto la voce
DESIGN 009-native esistente:

- `[PLAN 009-native](docs/3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md) — v0.1.0 — DRAFT`
- `[TODO 009-native](docs/4-todo-lists/009-native-TODO_winrt-save-picker_v0.1.0.md) — v0.1.0 — PENDING`

### 6.6 Versione e release

**Nessuna modifica** a `package.json` (`version`) né tag git in
questa fase. Una nuova release è motivata solo dopo completamento
dell'implementazione effettiva del modulo (T3-N1..T3-N5 eseguiti
e mergiati su `main`).

---

## Sezione 7 — Convenzione commit (stesura documentale)

Lo storage del PLAN e del TODO genera **due commit** sul ramo `main`:

```
docs(plan-009-native): add detailed PLAN for WinRT FileSavePicker bridge
docs(todo-009-native): add operational TODO for WinRT FileSavePicker bridge
```

Aggiornamenti collaterali (CHANGELOG, DESIGN §11, PLAN 009 §6,
SPARK-START.md) possono essere accorpati in un terzo commit:

```
docs(plan-009-native): sync CHANGELOG, DESIGN validation log, parent PLAN reference
```

Le convenzioni di commit per l'**implementazione** (T3-N1..T3-N5)
sono di pertinenza di una sessione coder successiva e non sono
definite qui.

---

## Sezione 8 — Riferimenti

- DESIGN: [009-native-DESIGN_winrt-save-picker_v0.1.0.md](../2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md)
- DESIGN padre: [009-DESIGN_export-nativo_v0.1.0.md](../2-projects/009-DESIGN_export-nativo_v0.1.0.md)
- PLAN padre: [009-PLAN_export-nativo_v0.1.0.md](009-PLAN_export-nativo_v0.1.0.md)
- TODO padre: [009-TODO_export-nativo_v0.1.0.md](../4-todo-lists/009-TODO_export-nativo_v0.1.0.md)
- TODO operativo di questo PLAN: [009-native-TODO_winrt-save-picker_v0.1.0.md](../4-todo-lists/009-native-TODO_winrt-save-picker_v0.1.0.md)
- ADR_001 (annunci accessibili): [ADR_001_sistema-annunci-accessibili.md](../0-architecture/ADR_001_sistema-annunci-accessibili.md)
- CHANGELOG: [CHANGELOG.md](../../CHANGELOG.md)
- SPARK-START: [SPARK-START.md](../../SPARK-START.md)
