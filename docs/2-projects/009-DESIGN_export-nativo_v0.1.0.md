---
tipo: design
titolo: Export File Nativo — delivery layer multi-formato e multi-piattaforma
versione: 0.1.0
data: 2026-05-20
stato: REVIEWED
sorgente: docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md (punto N10)
perimetro: src/lib/export-service.ts (nuovo), src/context/AppDataContext.tsx
---

# DESIGN 009 — Export File Nativo

## Sezione 1 — Metadata

- **Design ID:** 009
- **Titolo:** Export File Nativo
- **Versione:** v0.1.0
- **Data:** 2026-05-20
- **Fase:** P3
- **Blocco:** P3.B2 (esteso)
- **Stato:** DRAFT
- **Autore:** Copilot Agent
- **Revisore:** donny-81

---

## Sezione 2 — Contesto e Motivazione

### Il problema N10

Il [report di diagnosi compatibilità React Native](../1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md)
documenta al punto **N10** che la funzione `downloadFile` — originariamente
utilizzata per il salvataggio del CSV in ambiente browser — è stata
**rimossa da `src/lib/helpers.ts` prima dell'inizio del lavoro sui
design di portabilità**. L'import in `src/context/AppDataContext.tsx`
(riga 3) e la chiamata in `handleExportCSV` (riga 632) sono però rimasti,
producendo:

- Un import non risolto a livello di modulo (`downloadFile` non è più
  esportato da `@/lib/helpers`).
- Un crash garantito a runtime alla prima invocazione di
  `handleExportCSV`, dato che il simbolo è `undefined` al momento della
  chiamata.

### Stato attuale del codice (verificato)

- `src/lib/helpers.ts` esporta `exportToCSV(transactions, accounts, categories): string`,
  funzione pura e cross-platform. Non esporta più alcun `downloadFile`.
- `src/context/AppDataContext.tsx`:
  - Riga 3: `import { formatCurrency, exportToCSV, downloadFile, getActiveBudgets, getBudgetProgress } from '@/lib/helpers'` — import rotto sul simbolo `downloadFile`.
  - Riga 72: `handleExportCSV: (visibleTransactions: Transaction[], visibleAccounts: Account[]) => void` — firma sincrona dichiarata nel tipo `AppDataContextValue`.
  - Righe 630-637: implementazione `handleExportCSV` che chiama `exportToCSV` e poi `downloadFile`, seguita dai side effect UX (`soundSystem.play('export')`, `hapticSystem.export()`, `toast.success(...)`, `screenReader.announceSuccess(...)`).

### Perché questo non è un refactor di codice browser

Il problema non è "portare codice browser su React Native". La funzione
DOM-based che eseguiva il download via `Blob` + `URL.createObjectURL` +
`document.createElement('a')` è **già stata rimossa**: ciò che rimane
non è codice da migrare, ma una **pipeline di delivery mancante**. Il
contenuto del file (CSV) viene generato correttamente da `exportToCSV`,
ma non esiste alcun layer infrastrutturale che lo consegni al filesystem
o all'utente attraverso i meccanismi nativi dell'OS.

Questo design **costruisce ex novo** quel delivery layer.

### Progressione architetturale dei design precedenti

- **DESIGN 007 — async cache hydration**: definisce il *bootstrap lifecycle* dei dati (state machine consumer).
- **DESIGN 008 — network connectivity**: definisce il *connectivity contract* (boundary producer-consumer sul segnale di rete).
- **DESIGN 009 — export nativo**: definisce il *delivery boundary* verso il sistema operativo (boundary producer-consumer sull'integrazione con le API native di share/save).

I tre design formalizzano in sequenza tre boundary architetturali
distinti, ciascuno rimpiazzando un'assunzione DOM con un contratto
esplicito cross-platform.

---

## Sezione 3 — Perimetro

### In Scope

- Creazione di **`ExportService`** come nuovo servizio infrastrutturale multi-formato in `src/lib/export-service.ts`.
- Implementazione del **tipo CSV** come primo formato concreto supportato dal servizio.
- **Strategia di delivery condizionale per piattaforma**:
  - iOS e Android: share sheet nativa.
  - Windows: save file dialog.
- Definizione del contratto **`ExportResult`** con tutte le classi di errore OS-native enumerate in Sezione 5.
- **Rimozione dell'import rotto** di `downloadFile` da `src/context/AppDataContext.tsx` (riga 3).
- **Aggiornamento di `handleExportCSV`** in `AppDataContext` perché usi `ExportService` invece di `downloadFile`.
- **Aggiornamento della firma `handleExportCSV`** nel tipo `AppDataContextValue` da `void` a `Promise<void>` (vedi Sezione 7).
- **Identificazione e aggiornamento di tutti i consumer** di `handleExportCSV` che oggi si aspettano una funzione sincrona (vedi Sezione 7 e Sezione 10).

### Fuori Scope

- La funzione `exportToCSV` in `src/lib/helpers.ts`: **rimane invariata**.
- Tutti gli altri formatter e funzioni pure di `helpers.ts`.
- La **generazione di contenuto** per formati diversi da CSV (PDF, XLSX, JSON ecc.): la struttura li prevede (vedi Sezione 8), l'implementazione è rimandata a design futuri.
- La **logica di business dei dati da esportare**: cosa esportare, quali transazioni filtrare e con quale ordinamento sono già decisi a monte dai consumer.
- I componenti UI di trigger dell'export (pulsanti, voci di menu): non vengono modificati se non per riflettere la nuova firma asincrona laddove ne dipendano.

---

## Sezione 4 — Architettura a Tre Layer

Il sistema di export viene strutturato in **tre layer disaccoppiati**,
ciascuno con una singola responsabilità.

### Layer 1 — Generazione contenuto

- **Posizione:** `src/lib/helpers.ts`, funzione `exportToCSV`.
- **Input:** `Transaction[]`, `Account[]`, `Array<{ id: string; nome: string }>` (categorie).
- **Output:** `string` (contenuto CSV).
- **Caratteristiche:** pura, sincrona, cross-platform, **invariata** rispetto allo stato attuale del codice. Nessuna dipendenza da React, da OS API o da side effect UX.

### Layer 2 — `ExportService`

- **Posizione:** `src/lib/export-service.ts` (**nuovo file da creare**).
- **Input:** contenuto (`string`), nome file (`string`), tipo MIME (`string`).
- **Output:** `Promise<ExportResult>` (vedi Sezione 5).
- **Caratteristiche:**
  - Asincrono.
  - Nessuna dipendenza da React (niente hook, niente context, niente componenti).
  - Nessun side effect UX (niente toast, niente sound, niente haptic, niente screen reader).
  - Multi-formato: il contratto è generico sul `mimeType` e non assume CSV.
  - Condizionale per piattaforma: internamente seleziona la strategia di delivery sulla base di `Platform.OS`.

### Layer 3 — Orchestrazione in `AppDataContext`

- **Posizione:** `src/context/AppDataContext.tsx`, funzione `handleExportCSV`.
- **Responsabilità:**
  1. Chiamare `exportToCSV(...)` per ottenere la stringa CSV.
  2. Passare il risultato a `ExportService` insieme a nome file e MIME type.
  3. Attendere `Promise<ExportResult>` ed eseguire branching su `result.success`.
  4. Eseguire i **side effect UX** in base al risultato: `toast`, `soundSystem`, `hapticSystem`, `screenReader`.
- **Vincolo architetturale esplicito:** i side effect UX **rimangono in questo layer** e **non migrano** in `ExportService`. Questo preserva il disaccoppiamento del servizio infrastrutturale da React/UI e ne consente il riuso, test in isolamento e futura estensione ad altri call site.

---

## Sezione 5 — Contratto `ExportResult`

### Definizione TypeScript

```typescript
export type ExportResult =
  | { success: true }
  | {
      success: false;
      reason:
        | 'CANCELLED'
        | 'PERMISSION_DENIED'
        | 'FILESYSTEM_ERROR'
        | 'UNSUPPORTED_PLATFORM'
        | 'INVALID_PATH'
        | 'INSUFFICIENT_SPACE'
        | 'UNKNOWN';
    };
```

### Semantica e responsabilità

`ExportService` **classifica** l'errore in una delle classi enumerate e
restituisce `ExportResult`. `AppDataContext` **comunica** il risultato
all'utente eseguendo i side effect UX appropriati. La separazione è
rigida: il servizio non parla con l'utente, il context non interpreta
errori grezzi.

| `reason` | Significato | Responsabilità di gestione |
|---|---|---|
| `CANCELLED` | L'utente ha annullato lo share sheet o la save dialog. | `AppDataContext`: nessun errore mostrato, eventuale toast neutro o silenzio (UX standard di annullamento). |
| `PERMISSION_DENIED` | Permesso storage o write negato dall'OS. | `AppDataContext`: toast di errore con istruzioni per concedere il permesso. |
| `FILESYSTEM_ERROR` | Errore generico di I/O durante la scrittura. | `AppDataContext`: toast di errore generico, suggerimento di ritentare. |
| `UNSUPPORTED_PLATFORM` | La piattaforma corrente non ha una strategia di delivery implementata. | `AppDataContext`: toast di errore con indicazione che la funzionalità non è disponibile. |
| `INVALID_PATH` | Path di destinazione non valido (Windows). | `AppDataContext`: toast di errore con suggerimento di scegliere un'altra cartella. |
| `INSUFFICIENT_SPACE` | Spazio insufficiente sul dispositivo. | `AppDataContext`: toast di errore con indicazione di liberare spazio. |
| `UNKNOWN` | Errore non classificabile. | `AppDataContext`: toast di errore generico, eventuale logging diagnostico. |

`ExportService` non solleva mai eccezioni: ogni esito anomalo viene
trasformato in `{ success: false, reason: ... }`. Le eventuali eccezioni
delle librerie sottostanti vengono **catturate e mappate** internamente.

---

## Sezione 6 — Strategia Multi-Piattaforma

`ExportService` rileva la piattaforma corrente tramite `Platform.OS` di
React Native e applica la strategia di delivery appropriata.

### iOS e Android

- **Modalità:** share sheet nativa dell'OS.
- **Libreria candidata:** `react-native-share`.
- **Motivazione:**
  - UX **idiomatica mobile**: l'utente sceglie la destinazione (Mail, Drive, Files, AirDrop, ecc.) attraverso il foglio di condivisione di sistema.
  - **Nessun permesso storage richiesto** per la maggior parte dei casi d'uso (il file viene scritto in directory temporanea dell'app e condiviso tramite intent/share extension).
  - **Integrazione OS nativa** senza dover gestire manualmente la scrittura su filesystem persistente.

### Windows (React Native Windows 0.82.x)

La strategia Windows adotta una separazione esplicita tra due
responsabilità distinte che su desktop non possono essere gestite
da un unico componente:

**Layer A — Scrittura del file**

- **Responsabilità:** scrivere il contenuto del file in una
  directory temporanea dell'app.
- **Tecnologia:** `@react-native-windows/fs`.
- **Motivazione:** pacchetto ufficiale mantenuto dal team
  React Native Windows, progettato per ambienti RNW con API
  Promise-based e piena compatibilità con RNW 0.82.x. Gestisce
  correttamente le condizioni transitorie del filesystem tipiche
  di Windows (es. lock antivirus).

**Layer B — Selezione destinazione da parte dell'utente**

- **Responsabilità:** esporre la finestra nativa di selezione
  del percorso di salvataggio (Windows Save File Dialog), ricevere
  il path scelto dall'utente e restituirlo a ExportService.
- **Tecnologia:** WinRT Save File Picker esposto tramite
  TurboModule o modulo nativo RNW.
- **Precondizione residua (da risolvere prima del Coding Plan 009):**
  identificare o progettare il TurboModule WinRT picker da utilizzare.
  Opzioni candidate: libreria community esistente, modulo nativo
  custom leggero, API WinRT `Windows.Storage.Pickers.FileSavePicker`
  esposta via C++/WinRT bridge.

**Flusso integrato su Windows**

1. `ExportService` riceve contenuto, nome file e MIME type.
2. Invoca il WinRT Save Picker per richiedere all'utente il path
   di destinazione.
3. Se l'utente annulla, restituisce
   `{ success: false, reason: 'CANCELLED' }` immediatamente.
4. Se l'utente conferma il path, scrive il file via
   `@react-native-windows/fs` nel path indicato.
5. Restituisce `{ success: true }` oppure il reason di errore
   appropriato in caso di I/O failure.

### Comportamento condizionale

`ExportService` espone un'unica firma pubblica. La selezione della
strategia (share sheet vs save dialog) è **interna al servizio** e
trasparente al chiamante. Se `Platform.OS` non corrisponde a una
strategia implementata, il servizio restituisce
`{ success: false, reason: 'UNSUPPORTED_PLATFORM' }`.

---

## Sezione 7 — Breaking Change Contrattuale

### Firma attuale

```typescript
// src/context/AppDataContext.tsx, riga 72
handleExportCSV: (visibleTransactions: Transaction[], visibleAccounts: Account[]) => void
```

### Nuova firma

```typescript
handleExportCSV: (visibleTransactions: Transaction[], visibleAccounts: Account[]) => Promise<void>
```

### File da aggiornare

1. **`src/context/AppDataContext.tsx`**
   - Riga 72: aggiornare il campo nel tipo `AppDataContextValue`.
   - Righe 630-637: rendere `handleExportCSV` `async`, attendere `ExportService`, eseguire branching su `ExportResult`.
   - Riga 3: rimuovere `downloadFile` dall'import di `@/lib/helpers`.
2. **Tutti i consumer di `handleExportCSV`** che oggi assumono una chiamata sincrona devono essere aggiornati ad attendere/non attendere la promise in modo coerente (in particolare componenti UI come dialog overlay, pulsanti di export ecc.). L'elenco completo dei consumer va prodotto come parte della **precondizione P3** della Sezione 10.

### Motivazione

Il delivery nativo (share sheet o save dialog) è intrinsecamente
**asincrono**: l'utente interagisce con un'interfaccia di sistema e la
risposta arriva via callback/promise. Mantenere una firma sincrona
costringerebbe a un fire-and-forget non ispezionabile, incompatibile
con la gestione di `ExportResult` e con i side effect UX condizionali.
La firma asincrona è una conseguenza diretta del contratto.

---

## Sezione 8 — Struttura Multi-Formato (future-proof)

### Decisione architetturale

`ExportService` è progettato per **supportare più formati**, non solo
CSV. Il contratto pubblico accetta `mimeType` come parametro e non
contiene assunzioni CSV-specifiche nella firma o nella logica di
delivery.

### Stato dei formati

- **CSV:** primo formato concreto implementato. La generazione del
  contenuto è già presente in `exportToCSV` (Layer 1) e non viene
  toccata.
- **PDF, XLSX, JSON, e altri formati:** aggiungibili in futuro **senza
  modificare la struttura del servizio**. Sarà sufficiente:
  1. aggiungere una nuova funzione di generazione contenuto al Layer 1
     (o in un nuovo modulo dedicato);
  2. invocare `ExportService` con il `mimeType` corrispondente.

### Giustificazione del nome

Il nome `ExportService` (anziché `CSVExportService`) riflette la
natura multi-formato della responsabilità. Rinominarlo in futuro
sarebbe un breaking change inutile, dato che il contratto è già
generico.

### Fuori scope di questo design

La generazione del contenuto per i formati futuri (PDF, XLSX, ecc.) è
**fuori scope**. Questo design definisce solo il delivery layer e
implementa l'integrazione del formato CSV come prima istanza.

---

## Sezione 9 — Nuove Dipendenze da Aggiungere

### `react-native-share`

- **Stato:** non presente in `package.json` (verificato).
- **Destinazione:** sezione `dependencies` di `package.json`.
- **Versione minima:** **[DA VERIFICARE]** alla stesura del Coding Plan 009 — identificare l'ultima major stabile compatibile con React Native 0.82.1.
- **Uso:** strategia di delivery su iOS e Android (Sezione 6).

### `@react-native-windows/fs`

- **Stato:** non presente in `package.json` (verificato).
- **Destinazione:** sezione `dependencies` di `package.json`.
- **Versione minima:** ultima stabile compatibile con
  `react-native-windows ^0.82.5` — da confermare al Coding Plan.
- **Uso:** scrittura del file in directory temporanea nella
  strategia di delivery Windows (Layer A, Sezione 6).
- **Motivazione:** pacchetto ufficiale React Native Windows,
  compatibilità RNW 0.82.x garantita dal team Microsoft.

### TurboModule WinRT Save Picker (Windows)

- **Stato:** non presente nel repository — da identificare o
  progettare.
- **Destinazione:** dipendenza nativa RNW oppure modulo interno
  in `src/native/` se realizzato custom.
- **Precondizione:** identificazione formale del componente
  (libreria community o custom) come parte della precondizione
  P1 aggiornata della Sezione 10.
- **Uso:** esposizione della finestra nativa di selezione
  percorso di salvataggio su Windows (Layer B, Sezione 6).

---

## Sezione 10 — Precondizioni Formali

Le seguenti precondizioni devono essere **soddisfatte e documentate**
prima che il **Coding Plan 009** possa essere scritto.

1. **P1 — Strategia Windows: TurboModule WinRT picker.**
   La strategia di delivery su Windows è stata definita
   architetturalmente (vedere Sezione 6): scrittura file via
   `@react-native-windows/fs` e selezione destinazione via
   WinRT Save File Picker esposto tramite TurboModule o modulo
   nativo RNW. La precondizione residua prima della stesura del
   Coding Plan 009 è l'identificazione formale del componente
   che espone il WinRT picker: libreria community esistente,
   modulo nativo custom leggero o API WinRT
   `Windows.Storage.Pickers.FileSavePicker` via C++/WinRT bridge.
   La scelta va documentata con motivazione prima che il Coding
   Plan possa essere scritto.
2. **P2 — Versione `react-native-share`.**
   Precondizione soddisfatta (verificata 2026-05-20).
   `react-native-share` è compatibile con `react-native ^0.82.1`
   e con la New Architecture obbligatoria di RN 0.82.x (TurboModules,
   Fabric). Compatibilità architetturale confermata per iOS e Android.
   Versione esatta da installare: da fissare alla stesura del Coding
   Plan 009 verificando l'ultima major stabile disponibile su npm al
   momento dell'implementazione.
3. **P3 — Censimento consumer.**
   Precondizione soddisfatta (verificata 2026-05-20).
   Censimento eseguito tramite ricerca testuale completa nel
   repository. Risultato: 9 occorrenze del termine `handleExportCSV`
   distribuite in 8 file. Tutte le occorrenze appartengono a
   documentazione, changelog, design, report o test placeholder.
   Nessun consumer runtime esterno oltre a `src/context/AppDataContext.tsx`,
   che è la dichiarazione e implementazione sorgente della funzione.
   Il breaking change da `() => void` a `() => Promise<void>` non
   genera propagation impact su consumer esterni al momento.
   Aggiornamenti da eseguire al Coding Plan: `src/context/AppDataContext.tsx`
   (firma e corpo) e `docs/api.md` (documentazione firma).

---

## Sezione 11 — Note di Compatibilità Hermes / Intl

- `exportToCSV` usa indirettamente `Intl.DateTimeFormat` e
  `Intl.NumberFormat` tramite le funzioni `formatDate` e `formatCurrency`
  esportate da `src/lib/helpers.ts` (verificate alle righe 33-43 del
  file).
- **React Native 0.82.1** utilizza una versione moderna di **Hermes** con
  pieno supporto delle API `Intl` necessarie (`DateTimeFormat`,
  `NumberFormat` con locale `it-IT` e currency `EUR`).
- La precondizione runtime di disponibilità `Intl` è quindi **soddisfatta**
  per tutte le piattaforme target dichiarate (Android, iOS, Windows via
  React Native Windows ^0.82.5).
- Nessuna polyfill `Intl` aggiuntiva è richiesta per il perimetro di
  questo design.
