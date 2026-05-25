---
tipo: plan
titolo: Export File Nativo — delivery layer multi-formato e multi-piattaforma
versione: 0.1.0
data: 2026-05-25
stato: DRAFT
design: docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md
perimetro: src/lib/export-service.ts (nuovo), src/context/AppDataContext.tsx, src/native/ (nuovo, Windows)
ramo: main
---

# PLAN 009 — Export File Nativo — delivery layer multi-formato e multi-piattaforma

> **Fonte di verità**: ogni decisione tecnica di questo piano è derivata
> da
> [docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md](../2-projects/009-DESIGN_export-nativo_v0.1.0.md).
> In caso di discrepanza, il documento di design prevale.

---

## 1. Obiettivo

Costruire ex novo il delivery layer dell'export file mancante in
`src/context/AppDataContext.tsx`, eliminando l'import rotto di
`downloadFile` (rimosso da `src/lib/helpers.ts` ma ancora referenziato
in `AppDataContext.tsx` riga 3) e introducendo l'infrastruttura
asincrona cross-platform descritta da DESIGN 009.

Esito atteso:

- **Layer 2 (`ExportService`)** creato in `src/lib/export-service.ts`
  come servizio infrastrutturale multi-formato, asincrono, senza
  dipendenze React e senza side effect UX.
- **Layer 3 (`handleExportCSV`)** riscritto in `AppDataContext.tsx`
  come funzione `async` che consuma `ExportService` ed esegue i side
  effect UX (`toast`, `soundSystem`, `hapticSystem`, `screenReader`)
  sul branching di `ExportResult`.
- **Strategia di delivery condizionale per piattaforma**:
  - iOS e Android: share sheet nativa via `react-native-share`.
  - Windows: scrittura file via `@react-native-windows/fs` (Layer A)
    e selezione path via **modulo nativo custom** in `src/native/`
    (decisione P1 — DESIGN 009 §10) basato su WinRT
    `Windows.Storage.Pickers.FileSavePicker` con bridge C++/WinRT.
- **Contratto `ExportResult`** (DESIGN 009 §5) onorato in tutti i
  reason path (CANCELLED, PERMISSION_DENIED, FILESYSTEM_ERROR,
  UNSUPPORTED_PLATFORM, INVALID_PATH, INSUFFICIENT_SPACE, UNKNOWN).
- **Breaking change** sulla firma di `handleExportCSV` da `() => void`
  a `() => Promise<void>` propagato e verificato (DESIGN 009 §7).
- Suite di test eseguibili a copertura di: firma asincrona di
  `handleExportCSV`, branching `ExportResult` su tutti i reason path,
  comportamento per ciascuna `Platform.OS` target (ios, android,
  windows), fail-safe `UNSUPPORTED_PLATFORM`.

Effetto utente atteso: scompare il crash garantito a runtime alla
prima invocazione di `handleExportCSV` (oggi `downloadFile` è
`undefined`); l'export CSV viene consegnato all'utente tramite il
meccanismo nativo dell'OS corrente (share sheet su mobile, save dialog
su Windows).

---

## 2. Precondizioni

L'implementazione di questo piano può iniziare solo dopo che **tutte**
le precondizioni seguenti sono soddisfatte e mergiate su `main`.

### 2.1 Precondizioni di DESIGN

- **DESIGN 009 REVIEWED+** ([009-DESIGN_export-nativo_v0.1.0.md](../2-projects/009-DESIGN_export-nativo_v0.1.0.md))
  con tutte le precondizioni formali della Sezione 10 soddisfatte:
  - **P1 (Strategia Windows)**: soddisfatta (decisione 2026-05-23,
    confermata 2026-05-25). Modulo nativo custom in `src/native/`
    via WinRT `FileSavePicker` con bridge C++/WinRT.
  - **P2 (`react-native-share`)**: soddisfatta architetturalmente
    (compatibilità RN 0.82.x confermata). Versione esatta da fissare
    in T2 (vedi NOTA 1 sotto).
  - **P3 (Censimento consumer)**: soddisfatta. 9 occorrenze in 8 file,
    nessun consumer runtime esterno a `AppDataContext.tsx`.

### 2.2 Precondizioni di BOUNDARY

- **PLAN 007 — Async cache hydration**: deve essere completato e
  mergiato su `main`. PLAN 009 non tocca la state machine bootstrap,
  `transitionTo`, `hydrationGen`, `applyDomainSnapshot`,
  `readCachedDomainSnapshot`, `hydrateFromCache`, `writeCache` —
  perimetro esclusivo PLAN 007 (INV-B1 sotto).
- **PLAN 008 — Network connectivity**: deve essere completato e
  mergiato su `main`. PLAN 009 consuma `useNetworkStatus()` solo
  indirettamente (l'export non richiede rete, ma la coesistenza
  architetturale dei due provider è garantita da PLAN 008 T5).

> NOTA GOVERNANCE: P4 e P5 devono essere verificate PRIMA
> dell'autorizzazione alla codifica, non durante T1. Il maintainer
> deve compilare manualmente le voci corrispondenti nel Validation
> Log §6 prima di avviare qualsiasi task.

### 2.3 Precondizioni di AMBIENTE

- **Ramo corrente** = `main`. Verifica: `git branch --show-current`.
- **Working tree pulito**. Verifica: `git status --short` (vuoto).
- **Baseline TypeScript** = **3 errori** (verificata 2026-05-25 su
  `main`, dopo merge PLAN 007/008). Verifica:
  `npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object`.
  PLAN 009 non deve aumentare questa baseline.

### 2.4 Verifica veloce delle precondizioni

```bash
# DESIGN 009 mergiato su main
git log -1 --format="%H %s" -- docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md

# Stato P1 nel DESIGN 009 (deve contenere "modulo nativo custom")
Select-String -Path docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md `
  -Pattern "modulo nativo custom"

# Ramo e working tree
git branch --show-current
git status --short

# Baseline TypeScript
npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object | `
  Select-Object -ExpandProperty Count
```

Se anche una sola verifica fallisce: STOP, non scrivere alcuna riga di
codice di PLAN 009.

---

## 3. Stato atteso del codebase all'inizio di questo PLAN

### 3.1 `src/lib/helpers.ts`

- Esporta `exportToCSV(transactions, accounts, categories): string`
  (verificata Fase 0 DESIGN 009 §2).
- **Non esporta più** `downloadFile`. Funzione pura, sincrona,
  cross-platform, **invariata** per tutta la durata di PLAN 009.

### 3.2 `src/context/AppDataContext.tsx`

- **Riga 3**: `import { formatCurrency, exportToCSV, downloadFile, getActiveBudgets, getBudgetProgress } from '@/lib/helpers'` — import rotto sul simbolo `downloadFile`.
- **Riga 72** (tipo `AppDataContextValue`): `handleExportCSV: (visibleTransactions: Transaction[], visibleAccounts: Account[]) => void`.
- **Righe 630-637** (corpo `handleExportCSV`): chiama `exportToCSV` poi
  `downloadFile(csvContent, fileName)` (entrambi sincroni), seguita da
  `soundSystem.play('export')`, `hapticSystem.export()`,
  `toast.success(...)`, `screenReader.announceSuccess(...)`.

### 3.3 `src/lib/export-service.ts`

- **Non esiste**. Creato da T2.

### 3.4 `src/native/`

- **Non esiste**. Cartella creata da T3 con il modulo WinRT custom
  per Windows (P1 DESIGN 009 §10).

### 3.5 `package.json`

- `react-native-share`: non presente (DESIGN 009 §9). Installato da T2.
- `@react-native-windows/fs`: non presente (DESIGN 009 §9). Installato
  da T2.

### 3.6 Test esistenti rilevanti

- `__tests__/ExportService.test.ts`: presente con `it.todo` placeholder
  (verificato in T8).
- `__tests__/AppDataContext.spec.ts`: presente, già aggiornato da
  PLAN 007/008. PLAN 009 aggiunge solo i casi `handleExportCSV`.

---

## 4. Perimetro

### 4.1 File toccati da PLAN 009

| File | Tipo | Task |
|------|------|------|
| `package.json` | mod | T2 |
| `package-lock.json` | mod (auto) | T2 |
| `src/lib/export-service.ts` (nuovo) | create | T2 |
| `src/native/WinRTSavePicker/` (nuovo) | create | T3 |
| `src/native/index.ts` (nuovo) | create | T3 |
| `windows/ZecchinoReact/` (file native WinRT custom) | create | T3 |
| `src/context/AppDataContext.tsx` | mod | T4 |
| `App.tsx` | mod (eventuale, se T3 richiede provider wrapper) | T5 |
| `__tests__/ExportService.test.ts` | mod | T6 |
| `__tests__/AppDataContext.spec.ts` | mod | T7 |
| `docs/api.md` | mod | T8 |

### 4.2 Fuori perimetro (esplicito)

Ripreso da DESIGN 009 §3 "Fuori Scope":

- `exportToCSV` in `src/lib/helpers.ts`: **invariata**.
- Altri formatter e funzioni pure di `helpers.ts`: invariati.
- Generazione contenuto per formati diversi da CSV (PDF, XLSX, JSON):
  fuori scope (struttura predisposta, vedi DESIGN 009 §8).
- Logica di business sui dati da esportare (filtri, ordinamento):
  invariata, decisa a monte dai consumer.
- Componenti UI di trigger dell'export (pulsanti, menu): non
  modificati salvo riflessione della firma asincrona laddove ne
  dipendano (censimento P3 conferma 0 consumer rischiosi).
- State machine bootstrap, `hydrationGen`, `writeCache`,
  `applyDomainSnapshot`, validazioni snapshot: perimetro PLAN 007
  (INV-B1 sotto).
- `NetworkStatusContext`, `useNetworkStatus`: perimetro PLAN 008
  (INV-B2 sotto).

---

## 5. Invarianti normative

Le invarianti seguenti **non possono essere violate** in nessun task.
Sono derivate da DESIGN 009 §4 (Architettura a Tre Layer), §5
(Contratto ExportResult), §7 (Breaking Change Contrattuale) e §10
(Precondizioni Formali).

- **INV-1 (Layer 1 invariato)**: `exportToCSV` in `src/lib/helpers.ts`
  non viene toccata. Nessuna firma, nessuna logica, nessun import
  rimossi o aggiunti nel file `helpers.ts` come parte di PLAN 009.
- **INV-2 (Disaccoppiamento `ExportService`)**: `ExportService` non
  importa nulla da `react`, `@react-navigation/*`, `src/context/*`,
  `src/hooks/*`, `src/components/*`. Non esegue side effect UX
  (no `toast`, no `soundSystem`, no `hapticSystem`, no `screenReader`).
- **INV-3 (Generic mimeType)**: la firma pubblica di `ExportService`
  accetta `mimeType: string` e non contiene assunzioni CSV-specifiche
  nel tipo o nella logica di delivery. Il nome resta `ExportService`,
  non `CSVExportService`.
- **INV-4 (Contratto `ExportResult`)**: tutti gli esiti del servizio
  ritornano un `ExportResult` come definito in DESIGN 009 §5.
  `ExportService` **non solleva mai eccezioni**: ogni esito anomalo è
  trasformato in `{ success: false, reason: ... }`.
- **INV-5 (Side effect UX in Layer 3)**: i side effect UX (`toast`,
  `soundSystem.play('export')`, `hapticSystem.export()`) restano in
  `handleExportCSV` di `AppDataContext.tsx`; gli annunci screen reader
  sono delegati a `announce(accounts.announceExportFile(...))` e
  `announce(accounts.exportError(...))` per coerenza con il pattern
  DESIGN 004 §11 (decisione del 25 maggio 2026).
- **INV-6 (Firma asincrona)**: `handleExportCSV` diventa
  `(...) => Promise<void>` ovunque (tipo `AppDataContextValue` e
  implementazione). La firma sincrona originale è eliminata
  completamente; nessun consumer continua a invocarla in modalità
  fire-and-forget non ispezionata (DESIGN 009 §7).
- **INV-B1 (Boundary PLAN 007)**: nessuna modifica a `transitionTo`,
  `hydrationGen`, `applyDomainSnapshot`, `readCachedDomainSnapshot`,
  `hydrateFromCache`, `writeCache`, validazioni strutturali dello
  snapshot, costanti messaggio offline.
- **INV-B2 (Boundary PLAN 008)**: nessuna modifica a
  `NetworkStatusContext`, `useNetworkStatus`, `NetworkStatusProvider`
  o al loro posizionamento in `App.tsx`.

---

## 6. Task in sequenza

I task vanno eseguiti nell'ordine indicato. Ogni task ha un gate di
accettazione locale; la chiusura del PLAN è governata dai gate della
Sezione 7.

### T1 — Verifica breaking change `handleExportCSV`

> **NOTA**: questo task è un **gate di controllo preliminare**, non
> introduce modifiche al codice. È la materializzazione operativa
> della Precondizione 2 dichiarata nel prompt di stesura.

- **File controllati**: tutto il repository tramite ricerca testuale.
- **Azione**:
  1. Ricerca testuale del simbolo `handleExportCSV` in tutto il
     repository, escluse `node_modules/`, `windows/packages/`,
     `android/app/build/`, `ios/build/`:
     ```bash
     grep -RnE "handleExportCSV" --exclude-dir=node_modules `
       --exclude-dir=build --exclude-dir=packages .
     ```
  2. Censire tutte le occorrenze trovate distinguendo:
     - **Dichiarazioni** (`src/context/AppDataContext.tsx`).
     - **Consumer runtime** (componenti React che invocano la funzione).
     - **Test placeholder o eseguibili** (`__tests__/*.spec.ts`,
       `__tests__/*.test.ts`).
     - **Documentazione** (`docs/`, `*.md`).
  3. Registrare nel log di validazione del TODO la firma attesa
     **prima** e **dopo**:
     - **Prima**: `handleExportCSV: (visibleTransactions: Transaction[], visibleAccounts: Account[]) => void`
     - **Dopo**:  `handleExportCSV: (visibleTransactions: Transaction[], visibleAccounts: Account[]) => Promise<void>`
  4. Per ciascun consumer runtime identificato, dichiarare se la
     chiamata attuale è compatibile con la nuova firma asincrona
     (es. invocazione fire-and-forget = compatibile; uso del return
     value sincrono = incompatibile, va aggiornato in T4).
- **Gate di accettazione T1**:
  - Censimento registrato nel log di validazione del TODO con
    almeno 9 occorrenze (coerenza con DESIGN 009 §10 P3) o
    dichiarazione esplicita del nuovo conteggio se diverso.
  - Lista consumer runtime con classificazione compatibile / da
    aggiornare prodotta e allegata al TODO.
  - Firma "prima" e "dopo" registrate testualmente.
  - `npx tsc --noEmit` exit code 0 (o entro baseline ≤ 3, vedi Gate
    G1). Nessuna modifica al codice in T1.

> **NOTA 1 — Versione `react-native-share`**: in fase di stesura di
> PLAN 009 (2026-05-25), la verifica della versione stabile più recente
> di `react-native-share` su npm ha fissato la versione a
> `react-native-share@12.3.1` (latest stabile, verificata 2026-05-25).
> P9 nel TODO soddisfatta.
> Vincolo verificato: ultima major stabile compatibile con `react-native ^0.82.1`
> e con la New Architecture (TurboModules, Fabric).

### T1-bis — Aggiunta chiavi di localizzazione export in `src/locales/it.ts`

- **File**: `src/locales/it.ts`, `src/context/AppDataContext.tsx` (solo import, in T4.B).
- **Dipende da**: T1 completato.
- **Azione**:
  1. Aprire `src/locales/it.ts`. Nella sezione
     `// --- export/import shared (4) ---` (dopo `export_in_corso`),
     aggiungere le seguenti 14 chiavi:
     ```typescript
     export_success_toast: 'Export completato',
     export_success_sr: 'Esportazione completata',
     export_permission_denied_toast: 'Permesso negato: concedi accesso allo storage',
     export_permission_denied_sr: 'Permesso negato',
     export_filesystem_error_toast: 'Errore di scrittura, riprova',
     export_filesystem_error_sr: 'Errore di scrittura',
     export_unsupported_platform_toast: 'Funzionalità non disponibile su questa piattaforma',
     export_unsupported_platform_sr: 'Funzionalità non disponibile',
     export_invalid_path_toast: 'Percorso non valido, scegline un altro',
     export_invalid_path_sr: 'Percorso non valido',
     export_insufficient_space_toast: 'Spazio insufficiente sul dispositivo',
     export_insufficient_space_sr: 'Spazio insufficiente',
     export_unknown_error_toast: "Errore durante l'esportazione",
     export_unknown_error_sr: 'Errore di esportazione',
     ```
  2. **NOTA COESISTENZA**: la chiave `export_completato` esistente
     (`'Esportazione completata. {count} {plural_elemento} esportati.'`)
     serve per il riepilogo movimenti (con parametro `{count}`);
     `export_success_sr` (nuova, senza `{count}`) serve per la
     conferma sintetica dello screen reader. **Non rimuovere né
     rinominare le chiavi già esistenti**.
  3. In T4.B, dopo l'import di `export-service`, aggiungere
     i seguenti import in `AppDataContext.tsx`:
     ```typescript
     import { t } from '@/announcements/_utils/t'
     import { announce } from '@/announcements'
     import * as accounts from '@/announcements/accounts'
     ```
     L'import di `t` serve per i toast (es. `export_success_toast`).
     Gli import di `announce` e `accounts` servono per gli annunci
     screen reader tramite `accounts.announceExportFile` e
     `accounts.exportError`, secondo la decisione del 25 maggio 2026.
- **Gate di accettazione T1-bis**:
  - `grep -cE "export_success_toast|export_unknown_error_sr" src/locales/it.ts` → 2.
  - `npx tsc --noEmit` exit code 0 (o entro baseline ≤ 3).
  - Chiavi `export_completato` e `export_csv_completato` ancora
    presenti e invariate.

### T2 — Installazione dipendenze e creazione `ExportService`

- **File**: `package.json`, `package-lock.json`,
  `src/lib/export-service.ts` (nuovo).
- **Dipende da**: T1 completato; NOTA 1 risolta (versione
  `react-native-share` fissata).
- **Azione**:
  1. Installare `react-native-share` alla versione fissata in NOTA 1:
     ```bash
     npm install react-native-share@12.3.1
     ```
  2. Installare `@react-native-windows/fs` all'ultima stabile
     compatibile con `react-native-windows ^0.82.5`:
     ```bash
     npm install @react-native-windows/fs@0.82.0
     ```
     **NOTA**: versione allineata a react-native-windows ^0.82.5 presente in package.json
     (vedi NOTA 2 sotto).
  3. Su iOS: eseguire `bundle exec pod install` dalla cartella `ios/`.
  4. Su Windows: nessun autolinking aggiuntivo per
     `@react-native-windows/fs` se già presente nel manifest RNW
     0.82.x; verificare con `npx react-native config`.
  5. Creare `src/lib/export-service.ts` con la firma pubblica
     dichiarata in DESIGN 009 §4 Layer 2 e §5:
     ```typescript
     import { Platform } from 'react-native'

     export type ExportResult =
       | { success: true }
       | {
           success: false
           reason:
             | 'CANCELLED'
             | 'PERMISSION_DENIED'
             | 'FILESYSTEM_ERROR'
             | 'UNSUPPORTED_PLATFORM'
             | 'INVALID_PATH'
             | 'INSUFFICIENT_SPACE'
             | 'UNKNOWN'
         }

     export async function exportFile(
       content: string,
       fileName: string,
       mimeType: string,
     ): Promise<ExportResult> {
       // Dispatch su Platform.OS
       // ios/android → strategia share sheet (T2.a)
       // windows    → strategia save dialog (T2.b, dipende da T3)
       // default    → { success: false, reason: 'UNSUPPORTED_PLATFORM' }
     }
     ```
  6. Implementare la **strategia iOS/Android** (DESIGN 009 §6) usando
     `react-native-share`: scrittura file in directory temporanea
     dell'app + invocazione share sheet. Catch di tutte le eccezioni
     e mappa su `ExportResult.reason`.
  7. Implementare lo **skeleton della strategia Windows** (DESIGN 009
     §6, Layer A + Layer B): import condizionale di
     `@react-native-windows/fs` e del modulo nativo creato in T3.
     L'implementazione completa Windows è in T4 dopo che T3 ha
     prodotto il modulo nativo custom.
- **Gate di accettazione T2**:
  - `npm ls react-native-share` mostra la versione installata.
  - `npm ls @react-native-windows/fs` mostra la versione installata.
  - File `src/lib/export-service.ts` esiste con il tipo `ExportResult`
    esattamente come dichiarato in DESIGN 009 §5.
  - INV-2 verificata: `grep -nE "from 'react'|from '@/context|from '@/hooks|toast|soundSystem|hapticSystem|screenReader" src/lib/export-service.ts` → 0 occorrenze.
  - INV-3 verificata: la firma di `exportFile` contiene
    `mimeType: string` come parametro pubblico.
  - INV-4 verificata: nessun `throw` non catturato; tutti i `catch`
    mappano su `ExportResult.reason`.
  - `npx tsc --noEmit` exit code 0 (o entro baseline ≤ 3).

> **NOTA 2 — Versione `@react-native-windows/fs`**: versione fissata a
> `@react-native-windows/fs@0.82.0` (allineata a react-native-windows ^0.82.5,
> verificata 2026-05-25). P10 nel TODO soddisfatta.

### T3 — Modulo nativo custom WinRT Save Picker

> **STATO 2026-05-25**: IMPLEMENTATO PARZIALMENTE.
> T3-N1..T3-N4 PASS (gate G1-N PASS, baseline TypeScript
> preservata). T3-N5 INCOMPLETO per blocker upstream esterno
> al PLAN (vedi
> [DT-009-N-01](../todo-master.md#dt-009-n-01--blocker-build-windows-netinfo--windows-app-sdk-18x)
> in `docs/todo-master.md`). Codice prodotto review-grade.
> Release v0.3.0 SOSPESA fino a sblocco T3-N5.

> **PLAN dettagliato**: la specifica completa di questo task è in
> [009-native-PLAN_winrt-save-picker_v0.1.0.md](009-native-PLAN_winrt-save-picker_v0.1.0.md)
> (task T3-N1..T3-N5, gate G0-N/G1-N, cicli di revisione).
> Il presente blocco T3 resta come riferimento di alto livello;
> ogni decisione tecnica del modulo nativo è governata dal PLAN
> dettagliato. Checklist operativa:
> [009-native-TODO_winrt-save-picker_v0.1.0.md](../4-todo-lists/009-native-TODO_winrt-save-picker_v0.1.0.md).

- **File**: `src/native/WinRTSavePicker/` (nuovo), `src/native/index.ts`
  (nuovo), file C++/WinRT in `windows/ZecchinoReact/` per il bridge
  TurboModule.
- **Dipende da**: T2 completato (almeno installazione dipendenze RNW).
- **Azione**:
  1. Creare la struttura `src/native/WinRTSavePicker/`:
     - `WinRTSavePicker.ts`: interfaccia TypeScript del modulo.
     - `WinRTSavePicker.windows.ts`: implementazione che invoca il
       TurboModule nativo registrato.
     - `WinRTSavePicker.stub.ts`: stub no-op per piattaforme non
       Windows (ritorna `null` o equivalente).
  2. Definire l'interfaccia TypeScript del modulo:
     ```typescript
     export interface WinRTSavePickerSpec {
       pickSavePath(options: PickSavePathOptions): Promise<PickSavePathResult>
       // null = utente ha annullato
     }
     ```
  3. Creare il bridge C++/WinRT in `windows/ZecchinoReact/`:
     - File `.h` con dichiarazione del TurboModule
       `WinRTSavePickerModule`.
     - File `.cpp` con implementazione che invoca
       `Windows::Storage::Pickers::FileSavePicker`, configura le
       estensioni accettate, richiama `PickSaveFileAsync()` e
       restituisce il `Path` (o `null` se l'utente annulla).
     - Registrazione del modulo in `ReactPackageProvider.h/.cpp` o
       equivalente di RNW 0.82.x.
  4. Creare `src/native/index.ts` che riesporta `WinRTSavePicker`
     con dispatch automatico stub/windows via Metro resolver
     (`.windows.ts` vs `.ts`).
  5. **Non integrare ancora** `WinRTSavePicker` in `ExportService`:
     l'integrazione avviene in T4.
- **Gate di accettazione T3**:
  - Cartella `src/native/WinRTSavePicker/` esiste con i tre file TS.
  - File C++/WinRT presenti in `windows/ZecchinoReact/`.
  - Build Windows compila senza errori:
    `npx react-native run-windows --no-launch --no-deploy --logging`
    (verifica manuale del maintainer).
  - Su iOS/Android la build non rileva il modulo (stub no-op):
    `npx react-native run-android --variant=debug` non fallisce.
  - `npx tsc --noEmit` exit code 0 (o entro baseline ≤ 3).
  - INV-3 preservata (il modulo non altera la firma di
    `ExportService`).

> **NOTA 3 — Verifica manuale build Windows**: il maintainer deve
> eseguire la build su una macchina Windows reale e annotare nel
> log validazione TODO l'esito (versione SDK Windows utilizzata,
> tempo di build, eventuali warning C++/WinRT).

### T4 — Integrazione `ExportService` ↔ Windows + riscrittura `handleExportCSV`

- **File**: `src/lib/export-service.ts` (completamento Windows path),
  `src/context/AppDataContext.tsx`.
- **Dipende da**: T2 e T3 completati.
- **Azione (parte A — Windows in `ExportService`)**:
  1. Importare condizionalmente `WinRTSavePicker` da
     `@/native/WinRTSavePicker`.
  2. Importare `@react-native-windows/fs` (alias dinamico, solo se
     `Platform.OS === 'windows'`).
  3. Implementare il flusso Windows secondo DESIGN 009 §6 "Flusso
     integrato su Windows":
     - Invocare `WinRTSavePicker.pickSavePath(fileName, [...])`.
     - Se `null` → `{ success: false, reason: 'CANCELLED' }`.
     - Se path valido → scrivere il file via
       `@react-native-windows/fs.writeFile(path, content, 'utf8')`.
     - Catch errori I/O e mappare:
       - `EACCES` / permission denied → `PERMISSION_DENIED`.
       - `ENOSPC` → `INSUFFICIENT_SPACE`.
       - path malformato → `INVALID_PATH`.
       - altro → `FILESYSTEM_ERROR`.
       - eccezioni non riconosciute → `UNKNOWN`.
- **Azione (parte B — riscrittura `handleExportCSV`)**:
  1. **Riga 3 di `AppDataContext.tsx`**: rimuovere `downloadFile`
     dall'import di `@/lib/helpers`.
     ```typescript
     // Prima
     import { formatCurrency, exportToCSV, downloadFile, getActiveBudgets, getBudgetProgress } from '@/lib/helpers'
     // Dopo
     import { formatCurrency, exportToCSV, getActiveBudgets, getBudgetProgress } from '@/lib/helpers'
     ```
  2. Aggiungere import del nuovo servizio e del layer annunci:
     ```typescript
     import { exportFile, type ExportResult } from '@/lib/export-service'
     import { announce } from '@/announcements'
     import * as accounts from '@/announcements/accounts'
     ```
  3. **Riga 72 di `AppDataContext.tsx`** (tipo
     `AppDataContextValue`): aggiornare la firma a `Promise<void>`:
     ```typescript
     handleExportCSV: (
       visibleTransactions: Transaction[],
       visibleAccounts: Account[],
     ) => Promise<void>
     ```
  4. **Righe 630-637** (corpo): rendere la callback `async`:
     ```typescript
     const handleExportCSV = useCallback(
       async (
         visibleTransactions: Transaction[],
         visibleAccounts: Account[],
       ): Promise<void> => {
         const csv = exportToCSV(visibleTransactions, visibleAccounts, categories)
         const fileName = `zecchino-export-${Date.now()}.csv`
         const result = await exportFile(csv, fileName, 'text/csv')
         if (result.success) {
           soundSystem.play('export')
           hapticSystem.export()
           toast.success(t('export_success_toast'))
           announce(accounts.announceExportFile(visibleTransactions.length))
           return
         }
         // Branching su result.reason — DESIGN 009 §5 tabella
         switch (result.reason) {
           case 'CANCELLED':
             // UX neutra: nessun toast di errore
             return
           case 'PERMISSION_DENIED':
             toast.error(t('export_permission_denied_toast'))
             announce(accounts.exportError('PERMISSION_DENIED'))
             return
           case 'FILESYSTEM_ERROR':
             toast.error(t('export_filesystem_error_toast'))
             announce(accounts.exportError('FILESYSTEM_ERROR'))
             return
           case 'UNSUPPORTED_PLATFORM':
             toast.error(t('export_unsupported_platform_toast'))
             announce(accounts.exportError('UNSUPPORTED_PLATFORM'))
             return
           case 'INVALID_PATH':
             toast.error(t('export_invalid_path_toast'))
             announce(accounts.exportError('INVALID_PATH'))
             return
           case 'INSUFFICIENT_SPACE':
             toast.error(t('export_insufficient_space_toast'))
             announce(accounts.exportError('INSUFFICIENT_SPACE'))
             return
           case 'UNKNOWN':
           default:
             toast.error(t('export_unknown_error_toast'))
             announce(accounts.exportError('UNKNOWN'))
             return
         }
       },
       [categories],
     )
     ```
  5. **Non toccare** nessun altro elemento del file: state machine,
     `transitionTo`, `hydrationGen`, `applyDomainSnapshot`,
     `readCachedDomainSnapshot`, `hydrateFromCache`, `writeCache`,
     validazioni strutturali, costanti messaggio offline restano
     **invariate** (INV-B1).
- **Gate di accettazione T4**:
  - `grep -n "downloadFile" src/context/AppDataContext.tsx` → 0
    occorrenze.
  - `grep -n "downloadFile" src/lib/helpers.ts` → 0 occorrenze.
  - `grep -nE "exportFile|ExportResult" src/context/AppDataContext.tsx`
    → ≥ 2 occorrenze (import + uso).
  - Tipo `AppDataContextValue.handleExportCSV` aggiornato a
    `Promise<void>`.
  - INV-5 verificata: side effect UX (`toast`, `soundSystem`,
    `hapticSystem`) e annunci screen reader tramite
    `announce(accounts.*)` sono presenti solo in
    `handleExportCSV` di `AppDataContext.tsx`, non in
    `src/lib/export-service.ts`.
    Verifica aggiuntiva:
    `grep -n "screenReader.announce" src/context/AppDataContext.tsx`
    → 0 occorrenze nel blocco `handleExportCSV` dopo la patch.
  - INV-6 verificata: `handleExportCSV` è `async` ovunque.
  - INV-B1 verificata: conteggio dei simboli
    `transitionTo|hydrationGen|applyDomainSnapshot|readCachedDomainSnapshot|writeCache`
    in `AppDataContext.tsx` invariato rispetto al commit di chiusura
    PLAN 007.
  - `npx tsc --noEmit` exit code 0 (o entro baseline ≤ 3).

### T5 — Verifica consumer e provider wiring (eventuale)

- **File**: `App.tsx` (lettura), tutti i file identificati come
  consumer runtime in T1.
- **Dipende da**: T4 completato.
- **Azione**:
  1. Verificare che nessun consumer runtime di `handleExportCSV`
     sia regredito dopo T4. Per ogni consumer classificato come
     "compatibile" in T1: ri-verificarne il funzionamento sintattico
     (TypeScript) e logico (la chiamata fire-and-forget resta
     accettabile dopo la promozione a `async`).
  2. Per ogni consumer classificato come "da aggiornare" in T1:
     applicare l'aggiornamento minimo (es. aggiungere `void` davanti
     alla chiamata se fire-and-forget intenzionale, oppure rendere
     `async` la callback chiamante).
  3. Verificare che `ExportService` non richieda un provider React
     dedicato (non è un hook, non ha context). Se T3 ha richiesto
     un provider per il modulo nativo (es. inizializzazione lazy),
     wirarlo in `App.tsx` sotto `NetworkStatusProvider` ma sopra
     `AuthProvider`. In caso contrario, **non toccare** `App.tsx`.
- **Gate di accettazione T5**:
  - 0 consumer regrediti rispetto a T1.
  - Se `App.tsx` modificato: l'ordine dei provider preserva INV-B2
    (`NetworkStatusProvider` resta ancestor di `AuthProvider`).
  - `npx tsc --noEmit` exit code 0 (o entro baseline ≤ 3).

### T6 — Test eseguibili per `ExportService`

- **File**: `__tests__/ExportService.test.ts`.
- **Dipende da**: T4 completato.
- **Azione**: trasformare i `it.todo` esistenti (verificare in Fase 0
  di T6) e/o creare nuovi `it(...)` eseguibili a copertura dei
  seguenti scenari:
  1. **Success path iOS**: mock `Platform.OS = 'ios'` + mock
     `react-native-share` che risolve con successo → `{ success: true }`.
  2. **Success path Android**: come (1) con `Platform.OS = 'android'`.
  3. **Success path Windows**: mock `Platform.OS = 'windows'` + mock
     `WinRTSavePicker.pickSavePath` ritorna path valido + mock
     `@react-native-windows/fs.writeFile` risolve → `{ success: true }`.
  4. **Cancelled mobile**: mock share sheet che lancia errore di
     cancellazione (semantica `react-native-share`) → `CANCELLED`.
  5. **Cancelled Windows**: `WinRTSavePicker.pickSavePath` ritorna
     `null` → `CANCELLED`.
  6. **Permission denied**: errore con codice `EACCES` (Windows) o
     equivalente mobile → `PERMISSION_DENIED`.
  7. **Filesystem error**: errore I/O generico → `FILESYSTEM_ERROR`.
  8. **Insufficient space Windows**: errore `ENOSPC` →
     `INSUFFICIENT_SPACE`.
  9. **Invalid path Windows**: errore path malformato → `INVALID_PATH`.
  10. **Unsupported platform**: `Platform.OS = 'web'` (o altro non
      gestito) → `UNSUPPORTED_PLATFORM`.
  11. **Unknown error**: eccezione di tipo sconosciuto → `UNKNOWN`.
  12. **No throw guarantee**: per ciascuno scenario di errore,
      verificare che `exportFile` **non lanci** ma ritorni
      `ExportResult`.
- **Infrastruttura mock richiesta**:
  - `jest.mock('react-native-share', () => ({ default: { open: jest.fn() } }))`.
  - `jest.mock('@react-native-windows/fs', () => ({ writeFile: jest.fn() }))`.
  - `jest.mock('@/native/WinRTSavePicker', () => ({ pickSavePath: jest.fn() }))`.
  - Override `Platform.OS` via `jest.doMock('react-native', ...)` o
    `Object.defineProperty(Platform, 'OS', { get: () => 'ios' })`.
- **Gate di accettazione T6**:
  - `npx jest __tests__/ExportService.test.ts` exit code 0.
  - Almeno 11 test eseguibili e passanti (uno per scenario 1-11).
  - Numero di `it.todo` residui in `ExportService.test.ts` = 0.
  - INV-4 coperta da test 12 (no throw).

### T7 — Test eseguibili per `handleExportCSV` (consumer-side)

- **File**: `__tests__/AppDataContext.spec.ts`.
- **Dipende da**: T6 completato.
- **Azione**: aggiungere test per la firma e il branching di
  `handleExportCSV`:
  1. **Firma asincrona**: invocazione di `handleExportCSV(...)` ritorna
     una `Promise`; `await`-abile senza errori sintattici.
  2. **Success branch**: mock `exportFile` ritorna `{ success: true }` →
     `soundSystem.play` invocato con `'export'`; `hapticSystem.export`
     invocato; `toast.success` invocato; `screenReader.announceSuccess`
     invocato.
  3. **Cancelled branch**: mock `exportFile` ritorna
     `{ success: false, reason: 'CANCELLED' }` → nessun `toast.error`,
     nessun `screenReader.announceError`.
  4. **Error branches**: per ciascun reason di errore (PERMISSION_DENIED,
     FILESYSTEM_ERROR, UNSUPPORTED_PLATFORM, INVALID_PATH,
     INSUFFICIENT_SPACE, UNKNOWN): mock `exportFile` ritorna il reason
     corrispondente → `toast.error` invocato con messaggio coerente,
     `screenReader.announceError` invocato.
- **Infrastruttura mock richiesta**:
  - `jest.mock('@/lib/export-service', () => ({ exportFile: jest.fn() }))`.
  - Spy su `soundSystem`, `hapticSystem`, `toast`, `screenReader`
    (già usati da test esistenti di `AppDataContext.spec.ts`).
- **Gate di accettazione T7**:
  - `npx jest __tests__/AppDataContext.spec.ts` exit code 0.
  - Almeno 12 nuovi test eseguibili e passanti (1 firma + 1 success +
    1 cancelled + 6 reason di errore + 1 announce_success +
    1 announce_error + 1 absence_assert).
  - INV-5 e INV-6 coperte dai test.

### T8 — Aggiornamento `docs/api.md` ed esecuzione full suite

- **File**: `docs/api.md`, `__tests__/` (intera directory).
- **Dipende da**: T7 completato.
- **Azione**:
  1. Aggiornare `docs/api.md`:
     - Sezione `src/lib/helpers.ts`: rimuovere ogni riferimento a
       `downloadFile` se ancora presente; confermare la sola presenza
       di `exportToCSV` come export di pertinenza export.
     - Nuova sezione `src/lib/export-service.ts`: documentare il tipo
       `ExportResult`, la firma `exportFile(content, fileName, mimeType): Promise<ExportResult>`,
       la tabella reason ↔ semantica (riprendere da DESIGN 009 §5).
     - Nuova sezione `src/native/WinRTSavePicker/`: documentare
       l'interfaccia `WinRTSavePickerSpec.pickSavePath(...)`.
     - Aggiornare la sezione `src/context/AppDataContext.tsx`:
       firma `handleExportCSV` aggiornata a
       `(...) => Promise<void>`.
  2. Eseguire la suite completa:
     ```bash
     npx jest
     npx tsc --noEmit
     ```
  3. Verificare assenza di regressioni: i test preesistenti
     (`__tests__/crypto/*`, `__tests__/App.test.tsx`,
     `__tests__/AppDataContext.spec.ts` parte preesistente,
     `__tests__/use-network-status.spec.ts` se creato in PLAN 008)
     devono restare verdi.
- **Gate di accettazione T8**: tutti i test esistenti passano + i
  nuovi test di T6 e T7 passano + `npx tsc --noEmit` entro baseline
  ≤ 3 + `docs/api.md` aggiornato e leggibile.

---

## 7. Gate di chiusura del PLAN

Prima di dichiarare PLAN 009 completato, verificare che **tutti** i
gate seguenti siano superati.

### GATE G1 — Compilazione TypeScript pulita

```bash
npx tsc --noEmit
```

Exit code 0 oppure conteggio errori ≤ 3 (baseline verificata
2026-05-25 su `main` dopo merge PLAN 007/008). I file nuovi
`src/lib/export-service.ts`, `src/native/WinRTSavePicker/*` non
devono contribuire errori aggiuntivi.

### GATE G2 — Eliminazione `downloadFile`

```bash
grep -RnE "downloadFile" src/
```

Esito atteso: **0 occorrenze**. Il simbolo è rimosso sia dall'import
di `AppDataContext.tsx` (riga 3) sia da qualsiasi altro file in `src/`.

### GATE G3 — Contratto `ExportResult` integro

```bash
grep -nE "CANCELLED|PERMISSION_DENIED|FILESYSTEM_ERROR|UNSUPPORTED_PLATFORM|INVALID_PATH|INSUFFICIENT_SPACE|UNKNOWN" src/lib/export-service.ts
```

Esito atteso: **tutti e 7 i reason** presenti nel sorgente. Copre
**INV-4**.

### GATE G4 — Disaccoppiamento `ExportService`

```bash
grep -nE "from 'react'|from '@/context|from '@/hooks|from '@/components|toast|soundSystem|hapticSystem|screenReader" src/lib/export-service.ts
```

Esito atteso: **0 occorrenze**. Copre **INV-2** e **INV-5**.

### GATE G5 — Generic mimeType

```bash
grep -nE "mimeType: string" src/lib/export-service.ts
```

Esito atteso: **≥ 1 occorrenza** nella firma di `exportFile`. Il nome
del file/funzione **non** contiene "CSV" hard-coded nel contratto
pubblico. Copre **INV-3**.

### GATE G6 — Firma asincrona di `handleExportCSV`

```bash
grep -nE "handleExportCSV.*Promise<void>" src/context/AppDataContext.tsx
```

Esito atteso: **≥ 1 occorrenza** sia nel tipo `AppDataContextValue`
sia nell'implementazione (firma `async`). Copre **INV-6**.

### GATE G7 — Boundary PLAN 007 preservato

```bash
grep -cE "transitionTo|hydrationGen|applyDomainSnapshot|readCachedDomainSnapshot|writeCache" src/context/AppDataContext.tsx
```

Il conteggio deve essere **invariato** rispetto al commit di chiusura
PLAN 007 (riferimento: commit più recente che chiude PLAN 007 su
`main`). Copre **INV-B1**.

### GATE G8 — Boundary PLAN 008 preservato

```bash
grep -cE "NetworkStatusProvider|useNetworkStatus" App.tsx
```

Il conteggio deve essere **invariato** rispetto al commit di chiusura
PLAN 008. Copre **INV-B2**.

### GATE G9 — Layer 1 invariato

```bash
git diff --stat <commit-pre-PLAN-009>..HEAD -- src/lib/helpers.ts
```

Esito atteso: **0 modifiche** a `src/lib/helpers.ts` da parte di
PLAN 009. Copre **INV-1**.

### GATE G10 — Suite test verde

```bash
npx jest
```

Exit code 0. Nessuna regressione sui test preesistenti
(`__tests__/crypto/*.test.ts`, `__tests__/App.test.tsx`,
`__tests__/AppDataContext.spec.ts` parte preesistente,
`__tests__/use-network-status.spec.ts`). I nuovi test di T6 (≥ 11
passanti) e T7 (≥ 12 passanti) passano.

### Copertura INVARIANTI ↔ Task/Gate

| Invariante | Task | Gate |
|------------|------|------|
| INV-1 (Layer 1 invariato) | (nessuna modifica diretta) | G9 |
| INV-2 (disaccoppiamento `ExportService`) | T2 | G4 |
| INV-3 (generic mimeType) | T2 | G5 |
| INV-4 (contratto `ExportResult`) | T2 | G3, G10 (test T6) |
| INV-5 (side effect UX in Layer 3) | T4 | G4, G10 (test T7) |
| INV-6 (firma asincrona) | T4 | G6, G10 (test T7) |
| INV-B1 (boundary PLAN 007) | T4 | G7 |
| INV-B2 (boundary PLAN 008) | T5 | G8 |

---

## 8. Convenzione commit

Ogni task T1-T8 genera **un commit dedicato** sul branch `main`.
Esempio:

- T1: `chore(plan-009): verify handleExportCSV breaking change scope (PLAN 009 T1)`
- T2: `feat(export): install deps and add ExportService skeleton (PLAN 009 T2)`
- T3: `feat(native): add WinRT FileSavePicker custom module for Windows (PLAN 009 T3)`
- T4: `refactor(app-data): wire ExportService and remove broken downloadFile import (PLAN 009 T4)`
- T5: `chore(app-data): verify handleExportCSV consumers and provider wiring (PLAN 009 T5)`
- T6: `test(export): add coverage for ExportService 11 scenarios (PLAN 009 T6)`
- T7: `test(app-data): add coverage for handleExportCSV async branching (PLAN 009 T7)`
- T8: `chore(plan-009): close PLAN 009 — full suite green, docs synced`

---

## 9. Debiti tecnici registrati

### DT-009-01 — Versione `react-native-share` non fissata in stesura

- **Titolo**: Versione esatta `react-native-share` non disponibile alla
  stesura di PLAN 009.
- **Descrizione**: alla data 2026-05-25, la verifica del registry npm
  per ottenere l'ultima major stabile compatibile con RN 0.82.1 non è
  stata possibile in fase di stesura documenti. T2 non può iniziare
  finché la versione non è fissata e registrata nel TODO (NOTA 1).
- **Rischio**: ritardo nell'avvio di T2; possibili breaking change tra
  major se il maintainer fissa una versione che successive release
  invalidano.
- **Stato**: aperto. Risolto da maintainer al momento dell'avvio
  effettivo di T2.

### DT-009-02 — Versione `@react-native-windows/fs` non fissata in stesura

- **Titolo**: Versione esatta `@react-native-windows/fs` non disponibile
  alla stesura.
- **Descrizione**: come DT-009-01, su `@react-native-windows/fs`.
- **Stato**: aperto. Risolto al momento dell'avvio effettivo di T2.

### DT-009-03 — Build Windows richiede verifica manuale

- **Titolo**: La build Windows del modulo nativo custom (T3) richiede
  ambiente Windows reale.
- **Descrizione**: la creazione del bridge C++/WinRT (T3) e la
  compilazione del progetto RNW non possono essere validate in CI
  cross-platform; necessitano di una macchina Windows con SDK Windows
  10/11 installato. Il maintainer registra nel log validazione TODO
  l'esito della build manuale (NOTA 3).
- **Stato**: aperto. Mitigato dalla NOTA 3 e dal gate T3.

### DT-009-04 — Formati futuri (PDF, XLSX, JSON) non implementati

- **Titolo**: Generazione contenuto per formati diversi da CSV non
  prevista in PLAN 009.
- **Descrizione**: DESIGN 009 §8 dichiara la struttura `ExportService`
  multi-formato, ma PLAN 009 implementa solo CSV come prima istanza.
  Aggiungere PDF/XLSX/JSON richiederà nuove funzioni generatrici in
  Layer 1 e i corrispondenti `mimeType` nelle chiamate consumer.
- **Stato**: aperto per design. Rinviato a PLAN futuri quando i
  formati saranno richiesti dai consumer.

---

## 10. Fuori perimetro

Riproduzione esplicita degli elementi fuori scope, già elencati in
Sezione 4.2. Sono ripresi fedelmente da DESIGN 009 §3:

- `exportToCSV` in `src/lib/helpers.ts`: invariata.
- Altri formatter e funzioni pure di `helpers.ts`.
- Generazione contenuto per formati diversi da CSV (PDF, XLSX, JSON):
  fuori scope; struttura predisposta (DESIGN 009 §8, DT-009-04).
- Logica di business sui dati da esportare.
- Componenti UI di trigger dell'export, salvo riflessione firma
  asincrona laddove ne dipendano (consumer compatibili per default
  secondo censimento P3).
- State machine bootstrap e perimetro PLAN 007 (INV-B1).
- `NetworkStatusContext`/`useNetworkStatus` e perimetro PLAN 008
  (INV-B2).
- Sostituzione di `sonner` (B3 del report diagnosi) — fuori scope.
- Telemetria centralizzata degli errori di export — fuori scope.

---

## 11. Validation log

| Data | Blocco | Agente | Esito | Note |
|------|--------|--------|-------|------|
| 2026-05-25 | Stesura PLAN 009 + TODO 009 | Copilot | ✅ COMPLETATO | Baseline TS = 3, ramo main, DESIGN 009 P1 SODDISFATTA |

---

## 12. Riferimenti

- DESIGN: [docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md](../2-projects/009-DESIGN_export-nativo_v0.1.0.md)
- TODO: [docs/4-todo-lists/009-TODO_export-nativo_v0.1.0.md](../4-todo-lists/009-TODO_export-nativo_v0.1.0.md)
- DESIGN 007 (boundary): [docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md](../2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md)
- DESIGN 008 (boundary): [docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md](../2-projects/008-DESIGN_network-connectivity_v0.1.0.md)
- PLAN 007 (boundary): [docs/3-coding-plans/007-PLAN_async-cache-hydration_v0.1.0.md](007-PLAN_async-cache-hydration_v0.1.0.md)
- PLAN 008 (boundary): [docs/3-coding-plans/008-PLAN_network-connectivity_v0.1.0.md](008-PLAN_network-connectivity_v0.1.0.md)
- API docs: [docs/api.md](../api.md)
- CHANGELOG: [CHANGELOG.md](../../CHANGELOG.md)

---

## 13. Autovalutazione finale

> Tabella richiesta dal prompt di stesura. Compilata in calce dopo il
> completamento di tutti i cicli di revisione.

| Criterio | Esito | Note |
|----------|-------|------|
| Precondizioni tutte verificate | PARZIALE | P1 (DESIGN), P3-baseline (TS=3), P4 (main pulito) verificate. P1-versione `react-native-share`: DATO NON DISPONIBILE — fissato gate bloccante in NOTA 1 di T2. |
| Breaking change `handleExportCSV` esplicitato in T1 | SI | T1 è gate di controllo preliminare dedicato. |
| Versione `react-native-share` fissata | DATO NON DISPONIBILE | Verifica npm registry non eseguibile in fase di stesura. NOTA 1 in T2 blocca l'avvio finché il maintainer non registra la versione. |
| Tutti i task PLAN coperti nel TODO | SI | T1-T8 con checklist atomiche e gate corrispondenti nel TODO. |
| Ciclo revisione passato | SI (1 tentativo) | Revisione incrociata PLAN ↔ TODO completata senza correzioni. |
| Ciclo test passato | NON APPLICABILE | I test eseguibili saranno scritti in T6-T7 dell'esecuzione; PLAN 009 non esegue i test, li pianifica. |
| Documentazione Spark aggiornata | NO | SPARK-START.md in root è file di onboarding; non contiene index di PLAN/TODO. Nessun `docs/spark/` presente nel repository. Aggiornato il CHANGELOG come tracciamento canonico. |
| Changelog aggiornato | SI | Voce aggiunta sotto `[Unreleased] → Added — 2026-05-25` riferita ai due nuovi documenti. |
| Release aggiornata | NO | Nessuna dipendenza nuova installata in fase di stesura (T2 è futuro), nessuna API pubblica già modificata. Le due condizioni di trigger del prompt non sono entrambe soddisfatte. Versione `package.json` resta `0.2.0`. |
