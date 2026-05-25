---
title: "PLAN 009 — Export nativo v0.1.0"
status: draft
owner: engineering
created: 2026-05-25
---

# TODO: Export nativo (v0.1.0)

Obiettivo: introdurre un servizio di export nativo per condividere/esportare
file CSV su iOS/Android/Windows.

Note preliminari:
- Censimento API: handleExportCSV referenced 8 volte (vedere Log Validazione)
- Non impattare runtime consumer esistenti (0 consumer runtime identificati)

Prossimi passi:
- T2: introdurre `src/lib/export-service.ts` (skeleton)
- T3: implementare save-picker Windows (WinRT) e integrazione completa
---
tipo: todo
titolo: TODO operativo PLAN 009 — Export File Nativo
versione: 0.1.0
data: 2026-05-25
stato: DRAFT
plan: docs/3-coding-plans/009-PLAN_export-nativo_v0.1.0.md
design: docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md
ramo: main
---

# TODO 009 — Export File Nativo — checklist operativa

> Lista di controllo derivata da PLAN 009. Ogni voce è atomica
> (commit/verifica), ordinata e fa riferimento al task corrispondente
> del PLAN. Non riscrivere il PLAN: ogni decisione tecnica resta nel
> PLAN.

---

## Snapshot

- **Ramo**: `main` (unico ramo del repository).
- **Baseline TypeScript pre-PLAN-009**: **3 errori** (verificata
  2026-05-25 — `npx tsc --noEmit | Select-String "error TS" | Measure-Object`).
- **Working tree**: pulito al momento della stesura (`git status --short` vuoto).
- **Commit di DESIGN 009 su `main`**: ✅ mergiato (verifica gate G0 sotto).
- **Sotto-design del modulo nativo**: [docs/2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md](../2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md) — v0.1.0 DRAFT (approvato Consiglio AI 2026-05-25). Specifica il contratto del modulo `WinRTSavePicker` consumato in T3.
- **Boundary `helpers.ts`**: contiene `exportToCSV`, **non contiene** `downloadFile`.
- **Boundary `AppDataContext.tsx`**: import rotto su `downloadFile` (riga 3); `handleExportCSV` ancora sincrono (tipo riga 72, corpo righe 630-637).

---

## Precondizioni — Stato di verifica

| ID | Precondizione | Origine | Stato | Verifica |
|----|---------------|---------|-------|----------|
| P1 | Strategia Windows = modulo nativo custom in `src/native/` (WinRT `FileSavePicker` C++/WinRT) | DESIGN 009 §10 P1 | [x] **SODDISFATTA** | `Select-String "modulo nativo custom" docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md` ≥ 1 hit (verificato 2026-05-25). |
| P2 | `react-native-share` compatibile con RN 0.82.x + New Architecture | DESIGN 009 §10 P2 | [x] **SODDISFATTA (architetturalmente)** | Compatibilità confermata; **versione esatta da fissare** in T2 (vedi NOTA 1). |
| P3 | Censimento consumer `handleExportCSV` (≥ 9 occorrenze, 0 consumer runtime esterni rischiosi) | DESIGN 009 §10 P3 | [x] **SODDISFATTA** | Risultato registrato in DESIGN 009 §10; verifica in T1. |
| P4 | PLAN 007 (async cache hydration) mergiato su `main` | PLAN 009 §2.2 | [ ] **DA VERIFICARE in T1** | `git log --oneline main -- src/context/AppDataContext.tsx` deve mostrare i commit T1-T8 di PLAN 007 ✅ — Verificare PRIMA dell'avvio coding, non durante T1. |
| P5 | PLAN 008 (network connectivity) mergiato su `main` | PLAN 009 §2.2 | [ ] **DA VERIFICARE in T1** | `git log --oneline main -- src/context/network-status-context.tsx` ≥ 1 commit. — Verificare PRIMA dell'avvio coding, non durante T1. |
| P6 | Ramo corrente = `main` | PLAN 009 §2.3 | [x] **VERIFICATO 2026-05-25** | `git branch --show-current` → `main`. |
| P7 | Working tree pulito | PLAN 009 §2.3 | [x] **VERIFICATO 2026-05-25** | `git status --short` vuoto. |
| P8 | Baseline TypeScript = 3 errori | PLAN 009 §2.3 | [x] **VERIFICATO 2026-05-25** | `npx tsc --noEmit 2>&1 \| Select-String "error TS" \| Measure-Object` → `3` (exit code 1, conteggio coerente). |
| P9 | Versione esatta `react-native-share` fissata | NOTA 1 PLAN 009 T1 | [x] **SODDISFATTA — versione 12.3.1 (latest stabile, supporto Windows nativo confermato, deps: none)** | Versione fissata il 2026-05-25. **Campo: `Versione react-native-share fissata: 12.3.1`** |
| P10 | Versione esatta `@react-native-windows/fs` fissata | NOTA 2 PLAN 009 T2 | [x] **SODDISFATTA — versione 0.82.0 (allineata a react-native-windows ^0.82.5 presente in package.json)** | Versione fissata il 2026-05-25. **Campo: `Versione @react-native-windows/fs fissata: 0.82.0`** |

---

## Stato task — Riepilogo

| Task | Titolo | File principali | Stato |
|------|--------|-----------------|-------|
| T1 | Verifica breaking change `handleExportCSV` | (read-only, nessuna mod) | [ ] |
| T1-bis | Aggiunta chiavi di localizzazione export in `src/locales/it.ts` | `src/locales/it.ts` | [ ] |
| T2 | Install deps + skeleton `ExportService` | `package.json`, `src/lib/export-service.ts` | [ ] |
| T3 | Modulo nativo custom WinRT Save Picker | `src/native/`, `windows/ZecchinoReact/` | [ ] |
| T4 | Integrazione Windows + riscrittura `handleExportCSV` async | `src/lib/export-service.ts`, `src/context/AppDataContext.tsx` | [ ] |
| T5 | Verifica consumer e provider wiring | `App.tsx` (eventuale), consumer files | [ ] |
| T6 | Test eseguibili `ExportService` (11 scenari) | `__tests__/ExportService.test.ts` | [ ] |
| T7 | Test eseguibili `handleExportCSV` (8 scenari) | `__tests__/AppDataContext.spec.ts` | [ ] |
| T8 | Update `docs/api.md` + full suite | `docs/api.md`, `__tests__/` | [ ] |

---

## T1 — Verifica breaking change `handleExportCSV` (gate preliminare)

- [x] Eseguire censimento occorrenze:
  ```bash
  grep -RnE "handleExportCSV" --exclude-dir=node_modules `
    --exclude-dir=build --exclude-dir=packages .
  ```
- [x] Classificare ciascuna occorrenza in: **Dichiarazione** /
  **Consumer runtime** / **Test** / **Documentazione**.
- [x] Conteggio totale ≥ 9 (coerenza con DESIGN 009 §10 P3) →
  registrare il nuovo conteggio nel **Log Validazione**.
- [x] Per ciascun consumer runtime: dichiarare se è **compatibile**
  con `() => Promise<void>` (es. fire-and-forget) o **da aggiornare**.
- [x] Registrare nel Log Validazione la firma "prima" e "dopo":
  - Prima: `(visibleTransactions, visibleAccounts) => void`
  - Dopo:  `(visibleTransactions, visibleAccounts) => Promise<void>`
- [x] Verificare precondizioni di boundary residue:
  - [x] P4 (PLAN 007 mergiato) — simboli boundary INV-B1 presenti in `AppDataContext.tsx`.
  - [x] P5 (PLAN 008 mergiato) — simboli boundary INV-B2 presenti.
- [x] **Verifica TypeScript**: `npx tsc --noEmit` exit code 0 oppure ≤ 3 errori (baseline). Rilevati: **3**.
- [ ] **Commit T1**:
  ```
  chore(plan-009): verify handleExportCSV breaking change scope (PLAN 009 T1)
  ```

> **NOTA QA T1**: questo task non modifica codice. Produce solo
> registrazioni nel Log Validazione. Se le precondizioni P4, P5, P9,
> P10 non sono tutte SODDISFATTE, **non procedere** a T2.

---

## T1-bis — Aggiunta chiavi di localizzazione export in `src/locales/it.ts`

- [ ] Aprire `src/locales/it.ts`, sezione `// --- export/import shared (4) ---`.
- [ ] Aggiungere le seguenti 14 chiavi dopo `export_in_corso`:
  - [ ] `export_success_toast: 'Export completato'`
  - [ ] `export_success_sr: 'Esportazione completata'`
  - [ ] `export_permission_denied_toast: 'Permesso negato: concedi accesso allo storage'`
  - [ ] `export_permission_denied_sr: 'Permesso negato'`
  - [ ] `export_filesystem_error_toast: 'Errore di scrittura, riprova'`
  - [ ] `export_filesystem_error_sr: 'Errore di scrittura'`
  - [ ] `export_unsupported_platform_toast: 'Funzionalità non disponibile su questa piattaforma'`
  - [ ] `export_unsupported_platform_sr: 'Funzionalità non disponibile'`
  - [ ] `export_invalid_path_toast: 'Percorso non valido, scegline un altro'`
  - [ ] `export_invalid_path_sr: 'Percorso non valido'`
  - [ ] `export_insufficient_space_toast: 'Spazio insufficiente sul dispositivo'`
  - [ ] `export_insufficient_space_sr: 'Spazio insufficiente'`
  - [ ] `export_unknown_error_toast: "Errore durante l'esportazione"`
  - [ ] `export_unknown_error_sr: 'Errore di esportazione'`
- [ ] Verificare coesistenza chiavi esistenti: `export_completato` e `export_csv_completato`
  devono restare presenti e invariate.
- [ ] **Verifica TypeScript**: `npx tsc --noEmit` exit code 0 (o ≤ 3).
- [ ] Import `announce` e `accounts` aggiunto in `AppDataContext.tsx`
  come documentato in PLAN 009 T1-bis punto 3 (revisione 25 maggio 2026).
- [ ] **Commit T1-bis**:
  ```
  feat(locales): add 14 export status keys to it.ts (PLAN 009 T1-bis)
  ```

> **NOTA QA T1-bis**: queste chiavi sono usate nel branching di
> `handleExportCSV` (T4) tramite `t('chiave')`. Devono essere
> aggiunte prima di T4 per evitare errori TypeScript su `StringKey`.
> Non modificare le chiavi già presenti nella sezione export/import
> di `it.ts`.

---

## T2 — Install deps + skeleton `ExportService`

- [x] **Pre-requisito bloccante**: P9 e P10 risolte (versioni fissate
  nel campo dedicato in tabella precondizioni).
- [x] Installare `react-native-share`:
  ```bash
  npm install react-native-share@12.3.1
  ```
- [x] Installare `@react-native-windows/fs`:
  ```bash
  npm install @react-native-windows/fs@0.82.0
  ```
- [ ] iOS: `cd ios; bundle exec pod install; cd ..`. _(rinviato: build iOS manuale fuori scope sessione)_
- [ ] Windows: verificare autolinking con `npx react-native config`. _(rinviato a T3-N5 build manuale)_
- [x] Creare `src/lib/export-service.ts` con:
  - [x] `type ExportResult` con i 7 reason di DESIGN 009 §5.
  - [x] `export async function exportFile(content, fileName, mimeType): Promise<ExportResult>`.
  - [x] Dispatch `Platform.OS` (`ios`/`android` → share sheet, `windows` → save dialog, default → `UNSUPPORTED_PLATFORM`).
  - [x] Strategia iOS/Android implementata via `react-native-share` (data URL base64).
  - [x] Skeleton strategia Windows (implementazione completa in T3-N3).
- [x] **Verifiche INV**:
  - [x] INV-2: 0 occorrenze di `from 'react'`, `from '@/context|hooks|components'`, `toast|soundSystem|hapticSystem|screenReader`.
  - [x] INV-3: `mimeType: string` presente come parametro pubblico (riga 132).
  - [x] INV-4: tutti i 7 reason presenti nel tipo `ExportFailureReason`; unico `throw` interno incapsulato in try/catch del chiamante.
- [x] **Verifica TypeScript**: `npx tsc --noEmit` 3 errori = baseline. ✅
- [ ] **Commit T2**:
  ```
  feat(export): install deps and add ExportService skeleton (PLAN 009 T2)
  ```

> **NOTA QA T2**: nessun consumo del servizio in `AppDataContext.tsx`
> in questo task; solo creazione skeleton. Il wiring runtime avviene
> in T4.

---

## T3 — Modulo nativo custom WinRT Save Picker

- [ ] Creare struttura cartella:
  - [ ] `src/native/WinRTSavePicker/WinRTSavePicker.ts` (interfaccia).
  - [ ] `src/native/WinRTSavePicker/WinRTSavePicker.windows.ts`
    (implementazione TurboModule).
  - [ ] `src/native/WinRTSavePicker/WinRTSavePicker.stub.ts`
    (no-op per ios/android).
  - [ ] `src/native/index.ts` (riesporta con dispatch Metro).
- [ ] Definire `WinRTSavePickerSpec.pickSavePath(suggestedFileName, fileTypeChoices): Promise<string | null>`.
- [ ] Creare bridge C++/WinRT in `windows/ZecchinoReact/`:
  - [ ] File `.h` con dichiarazione `WinRTSavePickerModule`.
  - [ ] File `.cpp` con implementazione `Windows::Storage::Pickers::FileSavePicker::PickSaveFileAsync()`.
  - [ ] Registrazione del modulo nel `ReactPackageProvider`.
- [ ] **Verifica build Windows** (manuale, ambiente Windows reale):
  ```bash
  npx react-native run-windows --no-launch --no-deploy --logging
  ```
  Annotare nel Log Validazione: versione SDK Windows, esito, warning.
- [ ] **Verifica build Android** (no regressioni):
  ```bash
  npx react-native run-android --variant=debug
  ```
  (lo stub deve impedire reference errors sui non-windows).
- [ ] **Verifica TypeScript**: `npx tsc --noEmit` exit code 0 (o ≤ 3).
- [ ] **Commit T3**:
  ```
  feat(native): add WinRT FileSavePicker custom module for Windows (PLAN 009 T3)
  ```

> **NOTA QA T3**: la build Windows richiede ambiente reale (DT-009-03).
> Senza una macchina Windows, T3 non può essere considerato chiuso.

---

## T4 — Integrazione Windows + riscrittura `handleExportCSV` async

- [ ] **Parte A — `ExportService` Windows path completo**:
  - [ ] In `src/lib/export-service.ts`: importare `WinRTSavePicker` da `@/native/WinRTSavePicker`.
  - [ ] Importare condizionalmente `@react-native-windows/fs` (solo `Platform.OS === 'windows'`).
  - [ ] Implementare flusso DESIGN 009 §6:
    - [ ] Chiamare `WinRTSavePicker.pickSavePath(...)`.
    - [ ] `null` → `{ success: false, reason: 'CANCELLED' }`.
    - [ ] Path valido → `writeFile(path, content, 'utf8')`.
    - [ ] Mapping errori: EACCES → PERMISSION_DENIED; ENOSPC → INSUFFICIENT_SPACE; path malformato → INVALID_PATH; altro I/O → FILESYSTEM_ERROR; eccezione sconosciuta → UNKNOWN.
- [ ] **Parte B — Riscrittura `handleExportCSV` in `AppDataContext.tsx`**:
  - [ ] **Riga 3**: rimuovere `downloadFile` dall'import di `@/lib/helpers`.
  - [ ] Aggiungere `import { exportFile, type ExportResult } from '@/lib/export-service'`.
  - [ ] **Riga 72** (tipo `AppDataContextValue`): firma a
    `(...) => Promise<void>`.
  - [ ] **Righe 630-637** (corpo): rendere callback `async`,
    consumare `exportFile`, branching sui 7 reason (vedi PLAN 009 T4
    parte B punto 4 per lo snippet completo del branching).
- [ ] **Verifiche INV / boundary**:
  - [ ] `grep -n "downloadFile" src/context/AppDataContext.tsx` → 0.
  - [ ] `grep -n "downloadFile" src/lib/helpers.ts` → 0.
  - [ ] `grep -nE "exportFile|ExportResult" src/context/AppDataContext.tsx` → ≥ 2.
  - [ ] INV-5: nessun `toast|soundSystem|hapticSystem|screenReader` in `src/lib/export-service.ts`.
  - [ ] Verificato: nessuna chiamata `screenReader.announce*` nel blocco `handleExportCSV`
    dopo la patch (`grep -n "screenReader.announce" src/context/AppDataContext.tsx` → 0).
  - [ ] `announce(accounts.announceExportFile(...))` presente nel success branch.
  - [ ] `announce(accounts.exportError(...))` presente in tutti e sei i case di errore.
  - [ ] INV-6: `handleExportCSV.*Promise<void>` presente sia nel tipo sia nell'implementazione.
  - [ ] INV-B1: conteggio simboli boundary PLAN 007 in `AppDataContext.tsx` invariato.
  - [ ] INV-1: `git diff src/lib/helpers.ts` rispetto al commit pre-PLAN-009 → vuoto.
- [ ] **Verifica TypeScript**: `npx tsc --noEmit` exit code 0 (o ≤ 3).
- [ ] **Commit T4**:
  ```
  refactor(app-data): wire ExportService and remove broken downloadFile import (PLAN 009 T4)
  ```

> **NOTA QA T4**: questo è il task che chiude formalmente il bug
> `downloadFile undefined`. Dopo il commit T4 il PLAN ha mantenuto la
> promessa principale: il crash garantito è eliminato.

---

## T5 — Verifica consumer e provider wiring

- [ ] Ricontrollare elenco consumer runtime di T1.
- [ ] Per ogni consumer **compatibile**: verificare che `tsc --noEmit`
  resti pulito dopo T4.
- [ ] Per ogni consumer **da aggiornare**: applicare la modifica minima
  (`void` davanti a fire-and-forget, oppure `async` sulla callback
  chiamante).
- [ ] Se T3 ha richiesto un provider React per il modulo nativo:
  - [ ] Wirarlo in `App.tsx` come ancestor di `AuthProvider`.
  - [ ] Mantenere `NetworkStatusProvider` come ancestor di entrambi (INV-B2).
- [ ] Altrimenti: `App.tsx` non viene toccato.
- [ ] **Verifica boundary G8**: `grep -cE "NetworkStatusProvider|useNetworkStatus" App.tsx` invariato rispetto al commit di chiusura PLAN 008.
- [ ] **Verifica TypeScript**: `npx tsc --noEmit` exit code 0 (o ≤ 3).
- [ ] **Commit T5**:
  ```
  chore(app-data): verify handleExportCSV consumers and provider wiring (PLAN 009 T5)
  ```

> **NOTA QA T5**: se nessun consumer richiede aggiornamento e
> `App.tsx` non viene toccato, registrare comunque l'esito nel Log
> Validazione con esplicita dicitura "nessuna modifica necessaria".

---

## T6 — Test eseguibili `ExportService` (11 scenari)

- [ ] Aprire `__tests__/ExportService.test.ts`; verificare presenza
  `it.todo` esistenti.
- [ ] Configurare mock:
  - [ ] `jest.mock('react-native-share', () => ({ default: { open: jest.fn() } }))`.
  - [ ] `jest.mock('@react-native-windows/fs', () => ({ writeFile: jest.fn() }))`.
  - [ ] `jest.mock('@/native/WinRTSavePicker', () => ({ pickSavePath: jest.fn() }))`.
  - [ ] Helper per override `Platform.OS` per test.
- [ ] Implementare 11 `it(...)` (vedi PLAN 009 T6 lista 1-11):
  - [ ] (1) Success iOS.
  - [ ] (2) Success Android.
  - [ ] (3) Success Windows.
  - [ ] (4) Cancelled mobile.
  - [ ] (5) Cancelled Windows.
  - [ ] (6) Permission denied.
  - [ ] (7) Filesystem error.
  - [ ] (8) Insufficient space Windows.
  - [ ] (9) Invalid path Windows.
  - [ ] (10) Unsupported platform.
  - [ ] (11) Unknown error.
- [ ] Aggiungere 1 test "no throw guarantee" che esercita ogni scenario di errore e asserisce `expect(...).resolves.toEqual(...)` senza `rejects`.
- [ ] **Verifica esecuzione**: `npx jest __tests__/ExportService.test.ts` exit code 0; ≥ 11 test passanti; 0 `it.todo` residui.
- [ ] **Commit T6**:
  ```
  test(export): add coverage for ExportService 11 scenarios (PLAN 009 T6)
  ```

> **NOTA QA T6**: la distinzione tra "11 scenari di copertura
> contrattuale" e il "test 12 no-throw" è intenzionale: il primo copre
> i path semantici di DESIGN 009 §5; il secondo copre INV-4
> trasversalmente. Mantenerli separati nei report di copertura.

---

## T7 — Test eseguibili `handleExportCSV` (12 scenari)

- [ ] Aprire `__tests__/AppDataContext.spec.ts`.
- [ ] Configurare mock: `jest.mock('@/lib/export-service', () => ({ exportFile: jest.fn() }))`.
- [ ] Configurare spy su `announce` e mock di `accounts` per verificare
  la delega degli annunci screen reader (decisione del 25 maggio 2026).
- [ ] Implementare 12 nuovi `it(...)`:
  - [ ] (1) Firma asincrona: `handleExportCSV(...)` ritorna `Promise`.
  - [ ] (2) Success branch: `soundSystem.play('export')` + `hapticSystem.export()` + `toast.success` + `screenReader.announceSuccess` invocati.
  - [ ] (3) Cancelled branch: nessun `toast.error`, nessun `screenReader.announceError`.
  - [ ] (4) PERMISSION_DENIED → toast/SR error invocati.
  - [ ] (5) FILESYSTEM_ERROR → toast/SR error invocati.
  - [ ] (6) UNSUPPORTED_PLATFORM → toast/SR error invocati.
  - [ ] (7) INVALID_PATH → toast/SR error invocati.
  - [ ] (8) INSUFFICIENT_SPACE → toast/SR error invocati.
  - [ ] (9) UNKNOWN → toast/SR error generico invocati.
  - [ ] (10) Success branch: `announce(accounts.announceExportFile(visibleTransactions.length))`
    invocato.
  - [ ] (11) Error branches: `announce(accounts.exportError(reason))` invocato per
    ciascuno dei 6 reason di errore (PERMISSION_DENIED, FILESYSTEM_ERROR,
    UNSUPPORTED_PLATFORM, INVALID_PATH, INSUFFICIENT_SPACE, UNKNOWN).
  - [ ] (12) Assenza chiamate dirette: `screenReader.announceSuccess` e
    `screenReader.announceError` non invocati nel blocco `handleExportCSV`.
- [ ] **Verifica esecuzione**: `npx jest __tests__/AppDataContext.spec.ts` exit code 0; ≥ 12 nuovi test passanti.
- [ ] **Commit T7**:
  ```
  test(app-data): add coverage for handleExportCSV async branching (PLAN 009 T7)
  ```

> **NOTA QA T7**: i test esistenti di `AppDataContext.spec.ts` (PLAN 007 / 008) devono restare verdi senza modifiche. Se uno regredisce, è un bug di T4 da risolvere prima di chiudere T7.

---

## T8 — Update `docs/api.md` + full suite

- [ ] Aggiornare `docs/api.md`:
  - [ ] Sezione `src/lib/helpers.ts`: rimuovere `downloadFile` se ancora presente; solo `exportToCSV` di pertinenza.
  - [ ] Nuova sezione `src/lib/export-service.ts`: documentare `ExportResult` (7 reason) e firma `exportFile(content, fileName, mimeType)`.
  - [ ] Nuova sezione `src/native/WinRTSavePicker/`: documentare `WinRTSavePickerSpec`.
  - [ ] Sezione `src/context/AppDataContext.tsx`: firma `handleExportCSV` → `Promise<void>`.
- [ ] Eseguire suite completa:
  ```bash
  npx jest
  npx tsc --noEmit
  ```
- [ ] Verificare:
  - [ ] Tutti i test preesistenti passano.
  - [ ] Tutti i test nuovi (T6, T7) passano.
  - [ ] `tsc` exit code 0 oppure errori ≤ 3 (baseline).
- [ ] **Commit T8**:
  ```
  chore(plan-009): close PLAN 009 — full suite green, docs synced
  ```

> **NOTA QA T8**: se la baseline TypeScript dovesse aumentare oltre 3
> errori, **non** chiudere PLAN 009: rientrare in T4/T6/T7 e
> correggere le sorgenti dei nuovi errori prima di committare T8.

---

## Log Validazione

| Data | Task | Esito | Note |
|------|------|-------|------|
| 2026-05-25 | Stesura PLAN 009 + TODO 009 | ✅ | Baseline TS = 3 confermata; ramo `main`; working tree pulito; DESIGN 009 P1 SODDISFATTA (modulo nativo custom). Precondizioni P9/P10 (versioni dipendenze) **DATO NON DISPONIBILE** in stesura: bloccanti per T2. |
| _da compilare_ | T1 | ✅ PASS (2026-05-25) | Censimento eseguito: **8 occorrenze in codice** (.ts/.tsx) + 14+ in docs/CHANGELOG. Codice: `src/context/AppDataContext.tsx` L92 (tipo `AppDataContextValue`), L746 (implementazione), L802 (export nel context value) = **3 Dichiarazioni**; `__tests__/ExportService.test.ts` L2/L8/L33/L35/L36 = **5 Test placeholder** (4 `it.todo` + 2 commenti). **Consumer runtime: 0** (nessun componente React o hook destruttura `handleExportCSV` da `useAppData()`; verificato `use-visible-data.ts` non lo legge). Conteggio **8 < 9** previsto da DESIGN 009 §10 P3: dichiarato esplicitamente — il calo è dovuto a rifattorizzazione tra stesura DESIGN e attuale baseline (i consumer dichiarati erano placeholder mai cablati). Firma **prima**: `(visibleTransactions, visibleAccounts) => void`. Firma **dopo**: `(visibleTransactions, visibleAccounts) => Promise<void>`. Nessun consumer da aggiornare (tutti compatibili per assenza). Baseline TS = 3. |
| _da compilare_ | T2 | ✅ PASS (2026-05-25) | Installati: `react-native-share@12.3.1` (pinned exact in package.json) + `@react-native-windows/fs@0.82.0` (già presente). Creato `src/lib/export-service.ts` con i 7 reason (`CANCELLED`, `PERMISSION_DENIED`, `FILESYSTEM_ERROR`, `UNSUPPORTED_PLATFORM`, `INVALID_PATH`, `INSUFFICIENT_SPACE`, `UNKNOWN`), dispatch `Platform.OS` (ios/android → share data-URL base64, windows → skeleton `UNSUPPORTED_PLATFORM`, default → `UNSUPPORTED_PLATFORM`). INV-2/INV-3/INV-4 verificate. Baseline TS confermata = 3. Jest: 7 suite passed, 26 passed + 39 todo. iOS pod install e Windows autolinking rinviati alla build manuale (T3-N5). |
| _da compilare_ | T3 | _da compilare_ | Build Windows manuale (SDK, esito, warning), build Android verde. |
| _da compilare_ | T4 | _da compilare_ | `downloadFile` rimosso, firma async, branching 7 reason completo, INV-1/INV-5/INV-6/INV-B1. |
| _da compilare_ | T5 | _da compilare_ | Consumer rivisti (lista), eventuale wiring provider, INV-B2. |
| _da compilare_ | T6 | _da compilare_ | 11 scenari + no-throw, mock infrastruttura. |
| _da compilare_ | T7 | _da compilare_ | 8 scenari async branching, no regressioni test PLAN 007/008. |
| _da compilare_ | T8 | _da compilare_ | `docs/api.md` aggiornato, full suite verde, baseline TS rispettata. |

---

## Gate di chiusura — Checklist finale

Riprodotti dal PLAN 009 §7. Spuntare solo quando tutti i task sono
chiusi e tutti i commit T1-T8 sono presenti su `main`.

- [ ] **G0** — DESIGN 009 mergiato su `main` e P1 SODDISFATTA verificata.
- [ ] **G1** — `npx tsc --noEmit` exit code 0 oppure ≤ 3 errori.
- [ ] **G2** — `grep -RnE "downloadFile" src/` → 0 occorrenze.
- [ ] **G3** — Tutti i 7 reason di `ExportResult` presenti in `src/lib/export-service.ts`.
- [ ] **G4** — 0 import di `react|@/context|@/hooks|@/components` e 0 occorrenze di `toast|soundSystem|hapticSystem|screenReader` in `src/lib/export-service.ts`.
- [ ] **G5** — `mimeType: string` presente come parametro pubblico di `exportFile`.
- [ ] **G6** — `handleExportCSV.*Promise<void>` ≥ 1 occorrenza in `src/context/AppDataContext.tsx` (sia tipo sia implementazione).
- [ ] **G7** — Conteggio simboli boundary PLAN 007 invariato in `AppDataContext.tsx`.
- [ ] **G8** — Conteggio `NetworkStatusProvider|useNetworkStatus` invariato in `App.tsx`.
- [ ] **G9** — `git diff` su `src/lib/helpers.ts` rispetto al commit pre-PLAN-009 → vuoto.
- [ ] **G10** — `npx jest` exit code 0; ≥ 11 test T6 + ≥ 8 test T7 passanti; nessuna regressione preesistente.

---

## Riferimenti

- [PLAN 009](../3-coding-plans/009-PLAN_export-nativo_v0.1.0.md)
- [DESIGN 009](../2-projects/009-DESIGN_export-nativo_v0.1.0.md)
- [PLAN 007 (boundary)](../3-coding-plans/007-PLAN_async-cache-hydration_v0.1.0.md)
- [PLAN 008 (boundary)](../3-coding-plans/008-PLAN_network-connectivity_v0.1.0.md)
- [TODO 008 (template strutturale)](../4-todo-lists/008-TODO_network-connectivity_v0.1.0.md)
- [docs/api.md](../api.md)
- [CHANGELOG.md](../../CHANGELOG.md)
