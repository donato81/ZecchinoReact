---
tipo: design
titolo: Modulo nativo WinRT Save Picker — bridge C++/WinRT per FileSavePicker
versione: 0.1.0
data: 2026-05-25
stato: REVIEWED
sorgente: docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md (Sezione 6 Layer B + Sezione 9)
perimetro: src/native/WinRTSavePicker/ (nuovo), windows/ZecchinoReact/ (file C++/WinRT del bridge), src/native/index.ts (nuovo)
design-padre: docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md
plan-collegato: docs/3-coding-plans/009-PLAN_export-nativo_v0.1.0.md
adr-collegato: docs/0-architecture/ADR_001_sistema-annunci-accessibili.md
ramo: main
---

# DESIGN 009-native — Modulo nativo WinRT Save Picker

> **Approvazione**: documento approvato dal Consiglio AI il 25 maggio 2026.
> **Fonte di verità superiore**: in caso di conflitto, prevale
> [DESIGN 009 — Export File Nativo](009-DESIGN_export-nativo_v0.1.0.md).
> Questo documento ne specifica esclusivamente il Layer B della strategia
> Windows (Sezione 6) e formalizza il contratto del modulo nativo custom
> introdotto come decisione P1 (Sezione 10) del DESIGN padre.

---

## Sezione 1 — Metadata

- **Design ID**: 009-native
- **Titolo**: Modulo nativo WinRT Save Picker
- **Versione**: v0.1.0
- **Data**: 2026-05-25
- **Fase**: P3
- **Blocco**: P3.B2-EXT (sotto-componente di P3.B2)
- **Stato**: DRAFT
- **Autore**: Copilot Agent (modalità Agent-Docs)
- **Revisore**: donny-81
- **Design padre**: [DESIGN 009 — Export File Nativo](009-DESIGN_export-nativo_v0.1.0.md)
- **Plan operativo**: [PLAN 009 — Export File Nativo](../3-coding-plans/009-PLAN_export-nativo_v0.1.0.md)
- **ADR di riferimento**: [ADR_001 — Sistema di annunci accessibili](../0-architecture/ADR_001_sistema-annunci-accessibili.md)
- **Rapporto consiglio AI**: approvazione 2026-05-25

---

## Sezione 2 — Contesto e motivazione

### Origine del modulo

Il [DESIGN 009 — Export File Nativo](009-DESIGN_export-nativo_v0.1.0.md)
introduce a Sezione 6 una strategia di delivery per Windows organizzata in
due layer disaccoppiati:

- **Layer A** — scrittura file in directory selezionata, gestita da
  `@react-native-windows/fs`.
- **Layer B** — selezione del path di salvataggio da parte dell'utente,
  realizzata tramite la finestra nativa WinRT `FileSavePicker`.

La decisione P1 (DESIGN 009 §10) ha stabilito che Layer B sia implementato
come **modulo nativo custom** all'interno del progetto (`src/native/`),
con bridge C++/WinRT verso l'API `Windows.Storage.Pickers.FileSavePicker`.
Questo documento formalizza l'architettura, il contratto pubblico e i
vincoli invarianti di quel modulo, senza scrivere codice.

### Perché un documento separato

Il modulo nativo è un'unità architetturale autonoma con vincoli che non
sono propri del delivery layer in TypeScript:

- **Confine OS**: vive sul bridge JavaScript ↔ C++/WinRT.
- **Confine UI thread**: l'API `FileSavePicker` di WinRT richiede esecuzione
  sul main UI thread, una proprietà che non emerge a livello del Layer 2
  TypeScript.
- **Confine localizzazione**: nessuna stringa utente attraversa mai questo
  layer (vedi INV-L10 in Sezione 5).
- **Confine accessibilità**: gli annunci NVDA devono passare esclusivamente
  per il canale definito da ADR_001, mai dal modulo nativo.

Specificare il modulo nel DESIGN 009 padre lo avrebbe diluito; specificarlo
nel PLAN 009 lo avrebbe accoppiato a un piano implementativo. Questo
sotto-design isola il contratto del modulo nativo in modo che possa essere
implementato, testato e mantenuto come unità coesa.

### Effetto utente atteso

Su Windows, all'invocazione di un export, l'utente vede una finestra di
sistema standard di "Salva con nome", sceglie la cartella e il nome,
conferma o annulla. La conferma restituisce un path al chiamante;
l'annullamento restituisce un esito esplicito di cancellation che non è
trattato come errore.

---

## Sezione 3 — Perimetro

### In scope

- Definizione del contratto pubblico TypeScript del modulo
  (`WinRTSavePickerSpec`) — vedi Sezione 5.
- Architettura del bridge JS ↔ C++/WinRT — vedi Sezione 4.
- Tabella codici di stato e mapping verso `ExportResult.reason` del
  DESIGN 009 padre — vedi Sezione 8.
- Strategia multi-piattaforma con stub espliciti per ciascuna piattaforma
  non Windows — vedi Sezione 6.
- Modello di thread affinity, async boundary, ownership dispatcher —
  vedi Sezione 6 (thread model) e Sezione 9 (precondizioni).
- Dichiarazione formale di tutte le invarianti richieste dal DESIGN
  padre e dal prompt di stesura (V1-V9).

### Fuori scope (esplicito)

- **Generazione del contenuto** del file: appartiene al Layer 1 del
  DESIGN 009 padre (`exportToCSV` in `src/lib/helpers.ts`).
- **Scrittura del file** sul filesystem: appartiene al Layer A della
  strategia Windows (`@react-native-windows/fs`), non al modulo nativo.
- **Sanitizzazione del nome file**: vedi INV-FILENAME in Sezione 5;
  appartiene a `ExportService`/`AppDataContext`.
- **Side effect UX**: toast, suoni, vibrazione, annunci NVDA — restano nel
  Layer 3 del DESIGN 009 padre (`handleExportCSV` in
  `src/context/AppDataContext.tsx`).
- **Logica di mapping verso `ExportResult`**: il modulo nativo emette solo
  codici di stato; il mapping verso `ExportResult.reason` è di pertinenza
  di `ExportService` (Sezione 8 ne fornisce la tabella di riferimento).
- **Implementazione del codice C++/WinRT, dei file `.h/.cpp`, della
  registrazione `ReactPackageProvider`**: appartengono al PLAN 009 T3.
- **Aggiornamento del codice TypeScript di `ExportService`**: appartiene
  al PLAN 009 T2/T4.
- **Versioning delle dipendenze npm** (`react-native-share`,
  `@react-native-windows/fs`): di pertinenza del PLAN 009; questo design
  ne dichiara solo la dipendenza formale (Sezione 9, P-B1).

---

## Sezione 4 — Architettura del modulo

### Tre componenti, una responsabilità ciascuno

```
┌─────────────────────────────────────────────────────────────────┐
│  TypeScript (JS runtime)                                        │
│                                                                 │
│   src/native/WinRTSavePicker/                                   │
│     ├── WinRTSavePicker.ts          ← contratto pubblico        │
│     ├── WinRTSavePicker.windows.ts  ← binding TurboModule       │
│     └── WinRTSavePicker.stub.ts     ← stub no-op altre piattaf. │
│                                                                 │
│   src/native/index.ts               ← entry point dispatcher    │
└────────────────────────────┬────────────────────────────────────┘
                             │  bridge async TurboModule
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Native (C++/WinRT, solo Windows)                               │
│                                                                 │
│   windows/ZecchinoReact/                                        │
│     ├── WinRTSavePickerModule.h    ← dichiarazione TurboModule  │
│     ├── WinRTSavePickerModule.cpp  ← invocazione FileSavePicker │
│     └── ReactPackageProvider.*     ← registrazione modulo       │
└─────────────────────────────────────────────────────────────────┘
```

### Componente A — Contratto TypeScript (`WinRTSavePicker.ts`)

Dichiara il tipo del modulo. È l'unico simbolo importato da
`src/lib/export-service.ts`. Non contiene logica, solo tipi e l'export
del modulo dispatched. Per la firma esatta vedi Sezione 5.

### Componente B — Implementazione Windows (`WinRTSavePicker.windows.ts`)

Importa il TurboModule registrato lato nativo e ne espone i metodi sotto
forma di Promise. Non altera la semantica: si limita a fare da adattatore
tra il sistema di moduli RN e il contratto pubblico definito in A.

### Componente C — Stub per piattaforme non Windows (`WinRTSavePicker.stub.ts`)

Implementa il contratto restituendo sempre un esito di "non supportato"
(vedi Sezione 6 per la strategia per ciascuna piattaforma). Non lancia
mai eccezioni.

### Componente D — Bridge C++/WinRT (`windows/ZecchinoReact/`)

Implementa il TurboModule. Riceve i parametri dal lato JS, configura
un'istanza di `Windows::Storage::Pickers::FileSavePicker`, ne avvia
l'esecuzione sul main UI thread, attende l'esito (Path scelto o
annullamento) e completa la Promise lato JS con un codice di stato (vedi
Sezione 8).

### Dispatcher Metro (`src/native/index.ts`)

Riesporta il simbolo `WinRTSavePicker` sfruttando la risoluzione dei file
per piattaforma del Metro bundler (`.windows.ts` su Windows, `.stub.ts`
oppure `.ts` altrove). Il chiamante (Layer 2 TypeScript) non si accorge
della piattaforma.

### Confini invalicabili

- Il modulo nativo **non importa** mai `react`, hook, context, componenti
  UI o sistema di annunci.
- Il modulo nativo **non scrive** sul filesystem; restituisce solo un
  path (o un codice di stato).
- Il modulo nativo **non valida né normalizza** il nome file ricevuto in
  input (vedi INV-FILENAME, Sezione 5).
- Il bridge C++/WinRT **non emette** stringhe localizzate (vedi INV-L10,
  Sezione 5).

---

## Sezione 5 — Contratto pubblico

### Firma TypeScript (definitiva per questo design)

```typescript
// src/native/WinRTSavePicker/WinRTSavePicker.ts

/**
 * Singola categoria di file accettata dal save dialog.
 * Esempio: { description: 'CSV', extensions: ['csv'] }.
 */
export interface FileTypeChoice {
  description: string;
  extensions: string[]; // estensioni SENZA punto iniziale
}

/**
 * Parametri di invocazione del save picker.
 * Tutti i campi sono parte del contratto pubblico (V4).
 */
export interface PickSavePathOptions {
  /**
   * Elenco delle categorie di file proposte all'utente.
   * NON deve essere hardcoded sul formato CSV.
   * MIN: 1 elemento. MAX: nessun limite (vedi linee guida WinRT).
   */
  fileTypeChoices: FileTypeChoice[];

  /**
   * Nome file suggerito nel dialog.
   * OPZIONALE. La sanitizzazione è responsabilità del chiamante
   * (vedi INV-FILENAME).
   */
  suggestedFileName?: string;

  /**
   * Estensione di default applicata se l'utente non ne specifica una.
   * OPZIONALE. Deve coincidere con una delle estensioni dichiarate
   * in fileTypeChoices.
   */
  defaultExtension?: string;
}

/**
 * Esito dell'invocazione del save picker.
 * Solo codici, mai stringhe localizzate (INV-L10).
 */
export type PickSavePathResult =
  | { status: 'SUCCESS'; path: string }
  | { status: 'USER_CANCELLED' }
  | { status: 'INVALID_ARGUMENT'; code: 'EMPTY_CHOICES' | 'INVALID_EXT' }
  | { status: 'PICKER_UNAVAILABLE' }
  | { status: 'INTERNAL_ERROR'; code: string };

/**
 * Contratto del modulo nativo.
 * L'implementazione concreta cambia per piattaforma (vedi Sezione 6).
 */
export interface WinRTSavePickerSpec {
  pickSavePath(options: PickSavePathOptions): Promise<PickSavePathResult>;
}

export const WinRTSavePicker: WinRTSavePickerSpec;
```

### Invarianti del contratto

- **INV-CONTRACT-1 (single-method)**: il contratto espone esattamente un
  metodo pubblico, `pickSavePath`. Nessun helper, nessun side effect.
- **INV-CONTRACT-2 (generic file types)**: `fileTypeChoices` è array
  generico, mai con default CSV hardcoded (V4).
- **INV-CONTRACT-3 (only codes)**: ogni risultato è un codice; nessuna
  stringa per l'utente attraversa mai questa interfaccia (V2 / INV-L10).
- **INV-CONTRACT-4 (never throws)**: il metodo non rigetta mai la Promise
  con `Error`. Ogni esito è uno dei `status` enumerati. Le eccezioni del
  bridge nativo vengono catturate e mappate in `INTERNAL_ERROR` con un
  `code` opaco.
- **INV-CONTRACT-5 (idempotent shape)**: la forma del risultato non
  cambia tra chiamate ripetute; nessun campo opzionale aggiuntivo.

### Invariante INV-L10 (formalizzazione obbligatoria — VINCOLO V2)

> **INV-L10** — I moduli nativi non devono mai emettere stringhe
> localizzate o destinate all'utente. Sono ammessi esclusivamente codici
> di stato o errore.

Conseguenze operative:

- I file `.cpp` del bridge non includono mai stringhe di interfaccia
  (titoli dialog, messaggi di errore, etichette). Le proprietà del
  `FileSavePicker` (es. `CommitButtonText`) NON vengono impostate da
  questo modulo: se necessarie, sono passate **dal Layer 2 TypeScript**
  attraverso `PickSavePathOptions` in versioni future (extensibility
  controllata, non parte di v0.1.0).
- I `code` di `INTERNAL_ERROR` sono identificatori tecnici opachi (es.
  `HRESULT_E_FAIL`, `THREAD_AFFINITY_VIOLATION`), mai messaggi.
- Il mapping da codice tecnico a messaggio per l'utente avviene
  esclusivamente nel Layer 3 del DESIGN 009 padre (`AppDataContext`)
  tramite chiavi di `src/locales/it.ts`.

### Invariante INV-FILENAME (formalizzazione obbligatoria — VINCOLO V7)

> **INV-FILENAME** — Il modulo nativo riceve `suggestedFileName` come
> stringa **già sanitizzata** dal chiamante. Non esegue normalizzazione
> Unicode, trimming, rimozione caratteri vietati, accorciamento o
> sostituzione di estensione. La validazione e la sanitizzazione del
> nome file sono di esclusiva pertinenza di `ExportService` (Layer 2
> DESIGN 009).

Se l'OS rifiuta il nome perché contiene caratteri invalidi, il modulo
restituisce `INTERNAL_ERROR` con `code: 'INVALID_FILENAME'` (oppure il
sistema avanza con un nome sostituito da WinRT: in tal caso il path
ritornato sarà comunque valido e il contratto restituisce `SUCCESS`).

---

## Sezione 6 — Strategia multi-piattaforma

Il modulo nativo è concepito per Windows. La strategia per le altre
piattaforme è formalizzata come parte del contratto, affinché il chiamante
non debba mai ramificarsi su `Platform.OS`.

### Windows — implementazione reale

- **Tecnologia**: `Windows.Storage.Pickers.FileSavePicker` (WinRT),
  bridge C++/WinRT integrato come TurboModule RNW 0.82.x.
- **Comportamento**:
  1. Costruzione di `FileSavePicker` sul main UI thread.
  2. Mapping di `fileTypeChoices` in `FileTypeChoices` WinRT.
  3. Impostazione di `SuggestedFileName` e `DefaultFileExtension` se
     forniti.
  4. Invocazione di `PickSaveFileAsync()`.
  5. Attesa del completamento; mapping del risultato in
     `PickSavePathResult`.
- **Thread model**: vedi Sezione 6 — "Thread affinity e async boundary".

### macOS — stub architetturale predisposto (VINCOLO V5)

- **File**: `src/native/WinRTSavePicker/WinRTSavePicker.macos.ts`.
- **Stato v0.1.0**: stub no-op che restituisce
  `Promise.resolve({ status: 'PICKER_UNAVAILABLE' })`.
- **Riferimento futuro**: implementazione tramite `NSSavePanel` (AppKit),
  esposto come modulo nativo Objective-C/Swift bridged a React Native
  macOS. Quando la piattaforma macOS sarà attivata, il file `.macos.ts`
  sarà riscritto come binding al modulo nativo equivalente; il contratto
  TypeScript (Sezione 5) **non cambia**.

### Android — stub esplicito (VINCOLO V5)

- **File**: coperto da `WinRTSavePicker.stub.ts` (Metro risolve
  `.windows.ts` solo su Windows; altrove ricade sullo stub o sul file
  `.ts` di default che a sua volta esporta lo stub per le piattaforme non
  Windows).
- **Risposta**:
  ```typescript
  Promise.resolve({
    status: 'PICKER_UNAVAILABLE',
    // mappato da ExportService in:
    //   { success: false, reason: 'PLATFORM_NOT_SUPPORTED' }
  });
  ```
- **Motivazione**: su Android la strategia di delivery del DESIGN 009
  padre (§6) è la **share sheet**, non un save dialog; il save picker non
  ha equivalente idiomatico mobile. La risposta `PICKER_UNAVAILABLE` è
  semanticamente equivalente al `PLATFORM_NOT_SUPPORTED` previsto dal
  prompt (V5); il mapping è formalizzato nella tabella di Sezione 8.

### iOS — stub esplicito (VINCOLO V5)

- Risposta identica ad Android: `PICKER_UNAVAILABLE`, mappata da
  `ExportService` in `{ success: false, reason: 'PLATFORM_NOT_SUPPORTED' }`.
- Motivazione equivalente: su iOS la delivery passa per
  `react-native-share`.

> **Nota su `PLATFORM_NOT_SUPPORTED`**: la stringa esatta richiesta dal
> VINCOLO V5 (`'PLATFORM_NOT_SUPPORTED'`) è una **reason di `ExportResult`**
> nel Layer 2 del DESIGN 009 padre, non uno `status` del contratto del
> modulo nativo. Il modulo nativo emette `PICKER_UNAVAILABLE`;
> `ExportService` traduce il codice nello stesso esito utente.

### Thread affinity e async boundary (VINCOLO V6)

> **INV-THREAD** — L'invocazione di `FileSavePicker.PickSaveFileAsync()`
> deve avvenire sul **main UI thread** del processo Windows. Il bridge
> C++/WinRT è responsabile dell'esecuzione sul corretto dispatcher
> (`CoreApplication.MainView.CoreWindow.Dispatcher` o equivalente
> richiesto da RNW 0.82.x).

Conseguenze:

- **Ownership dispatcher**: appartiene al modulo nativo. Il chiamante
  TypeScript non deve mai assumere o forzare un thread context.
- **Propagazione Promise**: il TurboModule restituisce una Promise React
  Native Windows; l'attesa del completamento WinRT
  (`IAsyncOperation<StorageFile>`) viene continuata sul dispatcher di
  origine e il risultato risolto/rigettato attraverso il `Promise`
  resolver di RN, **senza** che il chiamante JS debba sapere alcunché
  dei thread sottostanti.
- **Continuità async WinRT ↔ JavaScript**: ogni `co_await` o
  `then()` lato C++/WinRT preserva il contesto del dispatcher fino al
  punto di risoluzione della Promise JS. Eventuali eccezioni durante la
  continuazione (es. dispatcher fermato durante l'attesa) sono catturate
  e mappate in `INTERNAL_ERROR` con `code` opaco (es.
  `DISPATCHER_DETACHED`).

---

## Sezione 7 — Stringhe e localizzazione

Questa sezione formalizza l'applicazione del VINCOLO V2 / INV-L10 al
modulo nativo.

### Regola generale

Nessuna stringa destinata all'utente attraversa mai questo modulo. Né in
input, né in output, né nelle proprietà del `FileSavePicker` impostate
dal bridge.

### Stringhe ammesse

- **Identificatori tecnici opachi** come valori dei campi `code` di
  `INVALID_ARGUMENT` e `INTERNAL_ERROR`. Esempi:
  `EMPTY_CHOICES`, `INVALID_EXT`, `HRESULT_E_FAIL`,
  `THREAD_AFFINITY_VIOLATION`, `DISPATCHER_DETACHED`,
  `INVALID_FILENAME`. Sono pensati per logging diagnostico, non per
  l'utente.
- **Estensioni file** in `FileTypeChoice.extensions`: stringhe tecniche
  (es. `'csv'`), non localizzabili per natura.
- **`description`** in `FileTypeChoice`: stringa localizzabile **fornita
  dal chiamante** (`ExportService`), mai costruita dal modulo nativo. Il
  modulo la propaga in modo opaco al WinRT API.

### Stringhe vietate (esempi non esaustivi)

- Titoli dialog (`PickerCommitButtonText`, `SuggestedStartLocation` come
  testo, ecc.) costruiti internamente.
- Messaggi di errore in italiano o in qualsiasi lingua.
- Etichette di categoria localizzate generate dal modulo.

### Localizzazione lato chiamante

Tutti i testi utente che l'utente vedrà come effetto di un'invocazione
del save picker (toast post-export, annunci NVDA) sono di esclusiva
pertinenza del Layer 3 del DESIGN 009 padre (`AppDataContext`), tramite
le chiavi `export_*` di `src/locales/it.ts` introdotte in PLAN 009 T1-bis.

---

## Sezione 8 — Gestione errori e codici di stato

### Tabella canonica `PickSavePathResult` ↔ `ExportResult.reason`

Il modulo nativo emette **solo** valori della colonna sinistra. Il
mapping verso `ExportResult.reason` (DESIGN 009 §5) è di pertinenza di
`ExportService`; questa tabella ne fissa il contratto.

| `PickSavePathResult.status` | `code` (se presente) | Significato semantico | Mapping `ExportResult.reason` |
|---|---|---|---|
| `SUCCESS` | — | L'utente ha confermato; `path` valorizzato. | (segue scrittura via `@react-native-windows/fs`) |
| `USER_CANCELLED` | — | L'utente ha annullato il dialog (ESC, close, cancel, dismiss). | `CANCELLED` |
| `INVALID_ARGUMENT` | `EMPTY_CHOICES` | `fileTypeChoices` vuoto. | `UNKNOWN` (errore programmatore) |
| `INVALID_ARGUMENT` | `INVALID_EXT` | `defaultExtension` non in `fileTypeChoices`. | `UNKNOWN` (errore programmatore) |
| `PICKER_UNAVAILABLE` | — | Piattaforma non Windows oppure dispatcher non disponibile. | `UNSUPPORTED_PLATFORM` |
| `INTERNAL_ERROR` | `HRESULT_E_FAIL` | Errore generico WinRT non classificato. | `UNKNOWN` |
| `INTERNAL_ERROR` | `THREAD_AFFINITY_VIOLATION` | Bridge invocato fuori dal main UI thread. | `UNKNOWN` |
| `INTERNAL_ERROR` | `DISPATCHER_DETACHED` | Dispatcher fermato durante l'attesa async. | `UNKNOWN` |
| `INTERNAL_ERROR` | `INVALID_FILENAME` | WinRT rifiuta il nome file proposto. | `INVALID_PATH` |

### Cancellation semantics (formalizzazione obbligatoria — VINCOLO V3)

> **INV-CANCEL** — La chiusura del dialog da parte dell'utente (ESC,
> close, cancel, dismiss) **non è un errore**. Si applicano le seguenti
> dichiarazioni esplicite:
>
> - `USER_CANCELLED` ≠ failure
> - `USER_CANCELLED` ≠ errore di telemetria
> - `USER_CANCELLED` ≠ condizione da annunciare come failure a NVDA

Conseguenze operative:

- **Logging**: una cancellation **non** viene loggata come errore o
  warning; al più come `info` (a discrezione di `ExportService`).
- **Telemetria**: una cancellation **non** incrementa contatori di
  errore. Se viene tracciata, è in una metrica separata di adoption
  (non oggetto di questo design).
- **Annunci NVDA**: il Layer 3 del DESIGN 009 padre, alla ricezione di
  `ExportResult.reason === 'CANCELLED'`, **non** chiama
  `accounts.exportError(...)`. Il comportamento conforme è il silenzio
  o, al più, un toast neutro (vedi PLAN 009 T4 punto B.4: branch
  `case 'CANCELLED': return`).

### Esclusione esplicita: nessuna eccezione attraversa il bridge

Il bridge C++/WinRT cattura ogni eccezione nativa (`winrt::hresult_error`,
`std::exception`, `winrt::hresult_canceled`, ecc.) e la converte in un
`PickSavePathResult`. La Promise lato JS si risolve sempre con un valore
valido; non viene mai rigettata con `Error`. Questa è una conseguenza
diretta di INV-CONTRACT-4 (Sezione 5).

---

## Sezione 9 — Precondizioni formali

Le seguenti precondizioni devono essere **soddisfatte e documentate**
prima che il **PLAN 009 T3** (implementazione del modulo nativo) possa
essere avviato.

### P-N1 — DESIGN 009 padre in stato REVIEWED o superiore

Il presente sotto-design dipende strettamente da
[DESIGN 009 — Export File Nativo](009-DESIGN_export-nativo_v0.1.0.md).
Stato verificato in FASE 0: **REVIEWED**. Soddisfatta.

### P-N2 — Decisione P1 confermata nel DESIGN padre

DESIGN 009 §10 P1 deve dichiarare esplicitamente la scelta del modulo
nativo custom in `src/native/`. Verificato in FASE 0: la voce P1 è in
stato **SODDISFATTA** (decisione 2026-05-23, confermata 2026-05-25).

### P-N3 — Boundary di responsabilità con `ExportService`

`ExportService` (DESIGN 009 §4 Layer 2) deve restare l'unico chiamante
del modulo. Non sono ammessi chiamanti diretti da componenti React, hook,
context o altri servizi. Verificabile a regime tramite ricerca testuale
su `import.*WinRTSavePicker`: il solo file ammesso è
`src/lib/export-service.ts`.

### P-N4 — Boundary di responsabilità con `AppDataContext`

Gli annunci NVDA conseguenti all'esito del save picker passano
esclusivamente dal canale ADR_001 (`announcements/` → `announce()`),
invocato dal Layer 3 (`AppDataContext.handleExportCSV`). Il modulo
nativo non importa né conosce `src/announcements/`,
`src/accessibility/`, `src/locales/`.

### P-B1 — Bloccante B1 PLAN 009: congelamento versioni dipendenze (VINCOLO V8)

> **Il documento è documentalmente completo ma non codificabile finché
> le versioni di `@react-native-windows/fs` e `react-native-share` non
> sono congelate e validate nel TODO 009.**

Stato attuale (verificato in FASE 0 — TODO 009 §Precondizioni):

- **`react-native-share`**: P9 nel TODO 009 risulta **SODDISFATTA** alla
  versione `12.3.1` (latest stabile al 2026-05-25).
- **`@react-native-windows/fs`**: P10 nel TODO 009 risulta
  **SODDISFATTA** alla versione `0.82.0` (allineata a
  `react-native-windows ^0.82.5`).

Nonostante entrambe le precondizioni siano formalmente soddisfatte alla
data di stesura, la dipendenza dal bloccante B1 **resta dichiarata in
modo invariante** in questo documento. Questo significa che:

- Qualunque futura modifica di una delle due versioni (major, minor o
  patch) **invalida** la copertura del modulo nativo fino a nuova
  validazione registrata nel TODO 009.
- L'implementazione del modulo (PLAN 009 T3) **non può iniziare** in
  uno stato in cui P9 o P10 risultino regredite a "DA VERIFICARE" o
  "NON SODDISFATTA".

### P-N5 — Compatibilità RNW 0.82.x TurboModules

Il bridge C++/WinRT deve essere realizzato secondo le convenzioni
TurboModule di React Native Windows 0.82.x. Verifica a carico del
PLAN 009 T3 (build verificata su macchina Windows reale — vedi NOTA 3
del PLAN).

### P-N6 — Working tree e baseline TypeScript

- Ramo: `main`.
- Working tree: pulito all'avvio del PLAN 009 T3.
- Baseline TypeScript: ≤ 3 errori (allineata al PLAN 009 §2.3). Il modulo
  nativo non deve introdurre nuovi errori `tsc` lato TS (i tre file
  `WinRTSavePicker.*.ts` devono essere completamente tipizzati).

---

## Sezione 10 — Note di compatibilità

### React Native Windows 0.82.x

- Il bridge C++/WinRT segue il modello TurboModule (New Architecture)
  obbligatorio in RN 0.82.x. Nessun fallback a NativeModules legacy.
- Allineamento dispatcher: la versione 0.82.x richiede esecuzione su
  `CoreDispatcher` del main view. Se nuove versioni RNW imporranno un
  diverso modello (es. `DispatcherQueue` per WinUI 3), il bridge dovrà
  essere adeguato senza che cambi il contratto pubblico in Sezione 5.

### Hermes / Intl

Il modulo nativo non utilizza API `Intl` (non costruisce stringhe, non
formatta date o numeri). La compatibilità Hermes per il delivery layer
è già coperta da DESIGN 009 §11 e non richiede precondizioni aggiuntive
qui.

### Permessi storage

Su Windows, l'uso di `FileSavePicker` **non** richiede capability di
broadFileSystemAccess: il framework concede l'accesso al singolo path
selezionato dall'utente tramite il sistema di brokered file access. Non
sono necessarie dichiarazioni aggiuntive in `Package.appxmanifest` per
questo design.

### NVDA su Windows 11 (VINCOLO V9)

> **INV-NVDA** — Tutti gli annunci verso NVDA passano esclusivamente
> attraverso il sistema di annunci esistente
> ([ADR_001](../0-architecture/ADR_001_sistema-annunci-accessibili.md)),
> consumato dal Layer 3 del DESIGN 009 padre. Il modulo nativo **non
> genera mai annunci diretti**, non chiama `AnnounceForAccessibility`,
> `LiveRegion`, `AutomationProperties.LiveSetting` o equivalenti
> WinRT/UWP/WinUI dal codice C++/WinRT.

L'unico annuncio NVDA generato in conseguenza di un save picker è
prodotto da `AppDataContext.handleExportCSV` tramite
`announce(accounts.announceExportFile(...))` (successo) o
`announce(accounts.exportError(...))` (errore non-cancellation),
secondo la decisione del 25 maggio 2026 registrata in PLAN 009 T1-bis
e T4 punto B.

### Coesistenza con `react-native-share` (iOS/Android)

Su iOS e Android la presenza dello stub `PICKER_UNAVAILABLE` garantisce
che, se un futuro refactor invocasse erroneamente il modulo su mobile,
l'esito sia un `UNSUPPORTED_PLATFORM` esplicito anziché un crash.
`react-native-share` non viene mai invocato da questo modulo.

### Coesistenza con boundary PLAN 007 e PLAN 008

Il modulo nativo non tocca alcun simbolo dei boundary INV-B1 (PLAN 007:
state machine bootstrap, `transitionTo`, `hydrationGen`,
`applyDomainSnapshot`, `readCachedDomainSnapshot`, `hydrateFromCache`,
`writeCache`) né INV-B2 (PLAN 008: `NetworkStatusContext`,
`useNetworkStatus`, `NetworkStatusProvider`). Non importa
`AppDataContext`, non importa `NetworkStatusContext`.

---

## Sezione 11 — Validation log

| Data | Evento | Esito | Note |
|------|--------|-------|------|
| 2026-05-25 | Approvazione Consiglio AI | APPROVATO | Decisione formale di estrarre il sotto-design del modulo nativo dal DESIGN 009 padre. |
| 2026-05-25 | Stesura v0.1.0 in DRAFT | DONE | Agent-Docs. Tutti i vincoli V1-V9 dichiarati. |
| 2026-05-25 | Verifica precondizione P-B1 | SODDISFATTA (con dichiarazione invariante) | P9 (`react-native-share@12.3.1`) e P10 (`@react-native-windows/fs@0.82.0`) congelate nel TODO 009 alla data di stesura. La dipendenza formale resta dichiarata per invarianza. |
| 2026-05-25 | Stesura PLAN 009-native + TODO 009-native | DONE | Agent-Docs. Contratto §5 propagato 1:1 nel PLAN; bloccante P-B1 confermato SODDISFATTO al momento della stesura. PLAN dettagliato delle T3-N1..T3-N5 disponibile in [009-native-PLAN_winrt-save-picker_v0.1.0.md](../3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md). |

### Checklist vincoli (auto-convalida iniziale)

| Vincolo | Sezione di riferimento | Stato |
|---|---|---|
| V1 — Responsabilità unica | §3 (Perimetro), §4 (3 componenti), §5 (single-method) | DICHIARATO |
| V2 — INV-L10 nessuna stringa utente | §5 (INV-L10), §7 | DICHIARATO |
| V3 — Cancellation semantics (`USER_CANCELLED` ≠ failure) | §8 (INV-CANCEL) | DICHIARATO |
| V4 — Contratto pubblico generico (`fileTypeChoices[]`, `suggestedFileName?`, `defaultExtension?`) | §5 | DICHIARATO |
| V5 — Stub espliciti macOS / Android / iOS | §6 | DICHIARATO |
| V6 — Thread affinity e async boundary | §6 (INV-THREAD) | DICHIARATO |
| V7 — Filename sanitization ownership a `ExportService` | §5 (INV-FILENAME) | DICHIARATO |
| V8 — Dipendenza esplicita dal bloccante B1 PLAN 009 | §9 (P-B1) | DICHIARATO |
| V9 — Accessibilità NVDA via canale ADR_001 | §10 (INV-NVDA) | DICHIARATO |

### Prossimi eventi attesi

- Promozione a stato REVIEWED dopo revisione del maintainer
  (donny-81).
- Allineamento PLAN 009 T3 al contratto Sezione 5 (verifica della
  firma `WinRTSavePickerSpec` rispetto agli alias usati in
  [009-PLAN_export-nativo_v0.1.0.md](../3-coding-plans/009-PLAN_export-nativo_v0.1.0.md)
  punto T3.2: il PLAN usa `pickSavePath(suggestedFileName, fileTypeChoices)`
  in stile posizionale; questo design adotta un singolo oggetto
  `PickSavePathOptions` per estendibilità — l'adeguamento del PLAN sarà
  registrato in un futuro Validation Log al passaggio di stato REVIEWED).
- Validazione P-B1 ripetuta a ogni futura modifica delle versioni di
  `@react-native-windows/fs` e `react-native-share`.
