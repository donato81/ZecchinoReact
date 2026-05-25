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

- [ ] **P-N1** — DESIGN 009-native in stato REVIEWED o superiore.
  - Comando: `Select-String -Path docs/2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md -Pattern "^stato:"`
  - Esito atteso: `stato: REVIEWED` o successivo.
  - Status: ⬜ DA VERIFICARE — _data: ____ — _esito: ____

- [ ] **P-N2** — Contratto §5 del DESIGN 009-native invariante
  (firma `pickSavePath`, tipi `PickSavePathOptions` /
  `PickSavePathResult` allineati).
  - Verifica: rilettura integrale §5 del DESIGN; confronto con
    PLAN 009-native §4 T3-N1.
  - Esito atteso: firma identica, nessuna deriva.
  - Status: ⬜ DA VERIFICARE — _data: ____ — _esito: ____

- [ ] **P-N3** — Chiamante unico previsto:
  `src/lib/export-service.ts` è l'unico file autorizzato a
  importare il modulo nativo.
  - Verifica preliminare: `grep -RnE "WinRTSavePicker|pickSavePath" src/`
  - Esito atteso: 0 occorrenze (il modulo non esiste ancora);
    a fine T3-N3 → esattamente le occorrenze in
    `src/lib/export-service.ts` e `src/native/`.
  - Status: ⬜ DA VERIFICARE — _data: ____ — _esito: ____

- [ ] **P-N4** — `ExportService` scheletro esistente
  (`src/lib/export-service.ts` presente da T2 PLAN 009 padre).
  - Comando: `Test-Path src/lib/export-service.ts`
  - Esito atteso: `True`.
  - Status: ⬜ DA VERIFICARE — _data: ____ — _esito: ____

- [ ] **P-N5** — Working tree pulito su ramo `main`.
  - Comando: `git status --short ; git branch --show-current`
  - Esito atteso: output di `status` vuoto; branch `main`.
  - Status: ⬜ DA VERIFICARE — _data: ____ — _esito: ____

- [ ] **P-N6** — Macchina Windows disponibile per T3-N5
  (verifica della disponibilità, **non** dell'esito build).
  - Verifica: presenza ambiente RNW (SDK Windows 10/11
    installato, MSBuild reperibile).
  - Esito atteso: ambiente pronto. Se non disponibile: registrare
    nota e procedere fino a T3-N4; T3-N5 resta APERTA fino alla
    disponibilità.
  - Status: ⬜ DA VERIFICARE — _data: ____ — _esito: ____

### Precondizione bloccante (P-B1)

- [ ] **P-B1** — Versioni libreria congelate nel TODO 009 padre
  (P9: `react-native-share@12.3.1`, P10:
  `@react-native-windows/fs@0.82.0`).
  - Verifica: lettura voci P9 e P10 in
    [TODO 009 padre](009-TODO_export-nativo_v0.1.0.md), entrambe
    devono essere **SODDISFATTA** con versioni registrate.
  - Esito atteso al 2026-05-25: SODDISFATTA (versioni come sopra).
  - Status: ⬜ DA VERIFICARE — _data: ____ — _esito: ____

---

## Sezione 2 — Gate G0-N (ingresso PLAN)

- [ ] **G0-N.1** — DESIGN 009-native REVIEWED+.
- [ ] **G0-N.2** — P-B1 soddisfatta (P9/P10).
- [ ] **G0-N.3** — Working tree pulito su `main`.
- [ ] **G0-N.4** — Baseline TypeScript ≤ 3 errori.
  - Comando: `npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object | Select-Object -ExpandProperty Count`
  - Valore rilevato: ___ (atteso ≤ 3)
- [ ] **G0-N.5** — PLAN 009 padre T2 completata
  (dipendenze RNW installate).
- [ ] **G0-N.6** — `src/native/` non esistente o vuoto.

**Esito G0-N**: ⬜ PASS / ⬜ FAIL — _data: ____ — _operatore: ____

Se FAIL: **STOP**. Non avviare T3-N1. Registrare causa qui sotto.

> Causa FAIL G0-N (se applicabile): ________________

---

## Sezione 3 — Task operative

### ☐ T3-N1 — Struttura directory e file TypeScript

- [ ] Creare directory `src/native/WinRTSavePicker/`.
- [ ] Creare `src/native/WinRTSavePicker/WinRTSavePicker.ts`
  (contratto pubblico, firma DESIGN §5).
- [ ] Creare `src/native/WinRTSavePicker/WinRTSavePicker.windows.ts`
  (binding TurboModule, sola passthrough).
- [ ] Creare `src/native/WinRTSavePicker/WinRTSavePicker.macos.ts`
  (stub `PICKER_UNAVAILABLE`).
- [ ] Creare `src/native/WinRTSavePicker/WinRTSavePicker.stub.ts`
  (stub `PICKER_UNAVAILABLE` per Android/iOS).
- [ ] Creare `src/native/index.ts` (dispatcher Metro + re-export tipi).
- [ ] Verifica INV-NVDA / INV-L10 sui file TS del modulo:
  `Select-String -Path src/native/WinRTSavePicker/*.ts -Pattern "from '@/(announcements|accessibility|locales)'"`
  → 0 occorrenze.
- [ ] Verifica INV-CONTRACT-1: in `WinRTSavePicker.ts` lo
  spec contiene **un solo** metodo.
- [ ] Verifica baseline TS: `npx tsc --noEmit` errori ≤ 3.

**Esito T3-N1**: ⬜ PASS / ⬜ FAIL — _data: ____ — _tentativi: __/10

---

### ☐ T3-N2 — Bridge C++/WinRT (lato nativo Windows)

- [ ] Creare `windows/ZecchinoReact/WinRTSavePickerModule.h`.
- [ ] Creare `windows/ZecchinoReact/WinRTSavePickerModule.cpp`.
  - [ ] Ottenere dispatcher main UI thread.
  - [ ] Marshalare costruzione `FileSavePicker` + chiamata
    `PickSaveFileAsync()` sul dispatcher (INV-THREAD).
  - [ ] Mappare `options.fileTypeChoices` → `FileTypeChoices`
    WinRT (estensioni senza punto iniziale).
  - [ ] Impostare `SuggestedFileName` e `DefaultFileExtension`
    solo se forniti, senza alterazioni (INV-FILENAME).
  - [ ] Mappare esiti `StorageFile`/`nullptr`/eccezioni →
    `PickSavePathResult` per tabella DESIGN §8.
  - [ ] Validare input lato C++: `EMPTY_CHOICES`, `INVALID_EXT`.
  - [ ] Nessuna eccezione attraversa il bridge (INV-CONTRACT-4).
  - [ ] Nessuna stringa user-facing (INV-L10).
- [ ] Modificare `ReactPackageProvider.h` / `.cpp` per
  registrazione del modulo, preservando moduli esistenti.
- [ ] Verifica INV-NVDA: nessuna API
  `AnnounceForAccessibility` / `LiveRegion` /
  `AutomationProperties.LiveSetting` chiamata nel codice C++.

**Esito T3-N2**: ⬜ PASS / ⬜ FAIL — _data: ____ — _tentativi: __/10

---

### ☐ T3-N3 — Aggiornamento `ExportService`

- [ ] Importare `WinRTSavePicker` e tipi da `@/native` in
  `src/lib/export-service.ts`.
- [ ] Nel ramo `Platform.OS === 'windows'` di `exportFile`:
  - [ ] Costruire `PickSavePathOptions` derivando
    `fileTypeChoices` dal `mimeType` (mai CSV hardcoded —
    INV-CONTRACT-2).
  - [ ] Passare `suggestedFileName` opaco (INV-FILENAME).
  - [ ] Estrarre `defaultExtension` solo se coerente con
    `fileTypeChoices`.
  - [ ] Invocare `WinRTSavePicker.pickSavePath(options)`.
  - [ ] Mappare `PickSavePathResult` → `ExportResult` per
    tabella DESIGN §8 (SUCCESS, USER_CANCELLED → CANCELLED,
    INVALID_ARGUMENT → UNKNOWN, PICKER_UNAVAILABLE →
    UNSUPPORTED_PLATFORM, INTERNAL_ERROR `INVALID_FILENAME` →
    INVALID_PATH, INTERNAL_ERROR altro → UNKNOWN).
  - [ ] `USER_CANCELLED`: nessun log di errore (max `info`).
- [ ] Verifica chiamante unico (P-N3):
  `grep -RnE "WinRTSavePicker|pickSavePath" src/ |
   grep -v "src/lib/export-service.ts" | grep -v "src/native/"`
  → 0 occorrenze.
- [ ] Verifica baseline TS: `npx tsc --noEmit` errori ≤ 3.

**Esito T3-N3**: ⬜ PASS / ⬜ FAIL — _data: ____ — _tentativi: __/10

---

### ☐ T3-N4 — Gate TypeScript e pulizia chiamanti (G1-N)

- [ ] Esecuzione `tsc`:
  ```
  npx tsc --noEmit 2>&1 | Select-String "error TS" |
    Measure-Object | Select-Object -ExpandProperty Count
  ```
- [ ] Verifica P-N3 (chiamante unico) — 0 occorrenze fuori da
  `src/lib/export-service.ts` e `src/native/`.
- [ ] Verifica INV-NVDA / INV-L10 lato TS del modulo —
  0 occorrenze.
- [ ] Verifica INV-CONTRACT-1 — un solo metodo nello spec.

**Esito T3-N4**: ⬜ PASS / ⬜ FAIL — _data: ____ — _tentativi: __/10

---

### ☐ T3-N5 — Verifica build Windows (manuale)

> Eseguibile solo su macchina Windows con SDK installato.

- [ ] Eseguire:
  `npx react-native run-windows --no-launch --no-deploy --logging`
- [ ] Registrare log di validazione:
  - **Esito build Windows**: ⬜ PASS / ⬜ FAIL
  - **Versione SDK Windows**: ________
  - **Tempo di build (min)**: ________
  - **Warning C++/WinRT**: ________
  - **Errori di linker** (se FAIL): ________
- [ ] Eseguire build Android per verifica non-regressione stub:
  `npx react-native run-android --variant=debug`
  - **Esito build Android**: ⬜ PASS / ⬜ FAIL
- [ ] (Facoltativa) Build iOS, se ambiente macOS disponibile.
  - **Esito build iOS**: ⬜ PASS / ⬜ FAIL / ⬜ N/A

**Esito T3-N5**: ⬜ PASS / ⬜ FAIL — _data: ____ — _operatore: ____

---

## Sezione 4 — Gate G1-N (uscita PLAN, TypeScript)

Convalida del gate definito in [PLAN 009-native §3](../3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md).

| Misurazione | Valore | Soglia |
|-------------|--------|--------|
| Errori `tsc` **prima** di T3-N1 (baseline) | ___ | ≤ 3 |
| Errori `tsc` **dopo** T3-N4 | ___ | ≤ 3 |
| **Delta** (dopo − prima) | ___ | = 0 |

- [ ] Delta = 0 (nessuna regressione TypeScript introdotta).
- [ ] Vincolo P-N3 confermato (chiamante unico).
- [ ] Invarianti INV-CONTRACT-1, INV-L10, INV-NVDA verificate
  testualmente sui file TS del modulo.

**Esito G1-N**: ⬜ PASS / ⬜ FAIL — _data: ____ — _operatore: ____

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
| T3-N1 | __ / 10 | ⬜ PASS / ⬜ FAIL | _link o nota: ____ |
| T3-N2 | __ / 10 | ⬜ PASS / ⬜ FAIL | _link o nota: ____ |
| T3-N3 | __ / 10 | ⬜ PASS / ⬜ FAIL | _link o nota: ____ |
| T3-N4 | __ / 10 | ⬜ PASS / ⬜ FAIL | _link o nota: ____ |
| T3-N5 | __ / 10 | ⬜ PASS / ⬜ FAIL | _link o nota: ____ |

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

Compilare al termine dell'esecuzione.

- **Data chiusura**: ________
- **Esito complessivo**: ⬜ COMPLETO / ⬜ INCOMPLETO
- **Task completate**: ___ / 5
- **Task saltate (10/10 FAIL)**: ___ / 5 — elenco: ________
- **Gate G1-N**: ⬜ PASS / ⬜ FAIL
- **Build Windows (T3-N5)**: ⬜ PASS / ⬜ FAIL / ⬜ NON ESEGUITA
- **Build Android (T3-N5)**: ⬜ PASS / ⬜ FAIL / ⬜ NON ESEGUITA
- **Baseline TypeScript preservata**: ⬜ SÌ / ⬜ NO (delta = ___)
- **Note finali**: ________

Se INCOMPLETO: segnalare al maintainer per pianificare ripresa o
ridefinizione del PLAN 009-native (eventuale v0.2.0).

---

## Riferimenti

- PLAN: [009-native-PLAN_winrt-save-picker_v0.1.0.md](../3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md)
- DESIGN: [009-native-DESIGN_winrt-save-picker_v0.1.0.md](../2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md)
- PLAN padre: [009-PLAN_export-nativo_v0.1.0.md](../3-coding-plans/009-PLAN_export-nativo_v0.1.0.md)
- TODO padre: [009-TODO_export-nativo_v0.1.0.md](009-TODO_export-nativo_v0.1.0.md)
- ADR_001: [ADR_001_sistema-annunci-accessibili.md](../0-architecture/ADR_001_sistema-annunci-accessibili.md)
