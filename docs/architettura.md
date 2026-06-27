# Architettura — ZecchinoReact

> Aggiornato al: 2026-06-26  
> Stato: Migrazione Web → React Native in corso — app non avviabile fino alla risoluzione dei 6 blocchi (vedi [REPORT_diagnosi-compatibilita-RN_v0.1.0.md](1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md))

---

## 1. Stack tecnologico

| Livello        | Tecnologia                                                         | Versione            | Stato RN                                       |
| -------------- | ------------------------------------------------------------------ | ------------------- | ---------------------------------------------- |
| Runtime JS     | Hermes                                                             | bundled con RN 0.82 | ✅                                             |
| UI Framework   | React Native (bare)                                                | 0.82.1              | ✅                                             |
| React          | React                                                              | 19.1.1              | ✅                                             |
| Multi-platform | react-native-windows                                               | ^0.82.5             | ✅                                             |
| Backend        | Supabase JS                                                        | ^2.105.4            | ✅                                             |
| Auth           | Supabase Auth                                                      | —                   | ✅                                             |
| Storage locale | AsyncStorage                                                       | ^2.1.2              | ✅ allineato (DESIGN 001)                      |
| Hashing PIN    | bcryptjs                                                           | ^3.0.3              | ✅                                             |
| KDF PIN        | react-native-quick-crypto                                          | 1.1.5               | ✅ backend OpenSSL nativo                      |
| Cifratura dati | @noble/ciphers (AES-256-GCM, pure-JS)                              | ^1.0.0              | ✅ Hermes-compatible (PLAN 005)                |
| CSPRNG         | react-native-get-random-values (polyfill `crypto.getRandomValues`) | ^1.11.0             | ✅                                             |
| Env vars       | react-native-dotenv                                                | ^3.4.11             | ✅ configurato in babel.config.js (DESIGN 001) |
| Alias path     | babel-plugin-module-resolver                                       | ^5.0.3              | ✅ configurato in babel.config.js (DESIGN 001) |

---

## 2. Layer architetturale

```
┌────────────────────────────────────────────────────────────────┐
│                        screens/                                │  ← UI (vuoto nel branch corrente)
├────────────────────────────────────────────────────────────────┤
│                        context/                                │  ← Provider globali
│  AuthContext  AppDataContext  UserSettingsContext  VisibleDataContext  │
├────────────────────────────────────────────────────────────────┤
│                         hooks/                                 │  ← Hook React
│  use-user-settings  use-visible-data  use-display-preferences  │
│  use-haptic  use-inactivity-timer                              │
│  use-network-status                                            │
├─────────────────────────────────────────────────────────────┤
│                      lib/ (dominio)                            │  ← Logica pura + utility
│  types  constants  helpers  budget-alerts  budget-forecasting  │
│  budget-history  budget-templates  crypto  kdf-provider        │
│  haptic-system  sound-system  notification-service             │
│  design-tokens/colors  storage-cleanup-service  file-system/*      │
├─────────────────────────────────────────────────────────────┤
│                    accessibility/                              │  ← Accessibility engine (DESIGN 003)
│  types  engine  detection                                      │
├─────────────────────────────────────────────────────────────┤
│                    announcements/                              │  ← Layer semantico annunci (DESIGN 004)
│  index (announce)  types                                       │
│  ui  auth  accounts  budgets  _utils/                          │
├────────────────────────────────────────────────────────────────┤
│                      locales/                                  │  ← Localizzazione (DESIGN 003)
│  it  index                                                     │
├────────────────────────────────────────────────────────────────┤
│                   lib/supabase/                                │  ← Data access layer
│  client  cache  types                                          │
│  repositories: conti  transazioni  categorie  budget          │
│               obiettivi-risparmio  ricorrenze  tag            │
│               transazioni-tag  notifiche  allegati            │
│               impostazioni-utente                             │
├────────────────────────────────────────────────────────────────┤
│                       native/                                  │  ← Native modules (TurboModules)
│  WinRTSavePicker (windows/macos/stub) + index                  │  ← DESIGN 009-native
└────────────────────────────────────────────────────────────────┘
```

### Regole di dipendenza tra layer

- `screens/` → può importare da qualsiasi livello inferiore
- `context/` → può importare da `hooks/`, `lib/`, `lib/supabase/`
- `hooks/` → può importare da `lib/`, `lib/supabase/`, altri hook
- `lib/` → dipendenze solo interne (`types`, `helpers`, ecc.) o npm
- `lib/supabase/` → dipendenza esterna: `@supabase/supabase-js`, `AsyncStorage`
- `native/` → ponte verso moduli nativi piattaforma-specifici;
  variant Metro `.windows.ts`/`.macos.ts`/`.stub.ts` per il dispatch.
  Esposto come `@/native`; importabile solo da `lib/`.
- **I tipi `Db*` in `lib/supabase/types.ts` sono interni** — non importare fuori da `lib/supabase/`

### Layer `native/` — moduli nativi C++/WinRT (DESIGN 009-native)

`src/native/` ospita il contratto TypeScript dei moduli TurboModule
nativi e il loro dispatcher cross-platform. Il primo modulo è
`WinRTSavePicker`:

- **`WinRTSavePicker.ts`** — contratto astratto (interfaccia
  `WinRTSavePickerSpec`, tipi `FileTypeChoice`,
  `PickSavePathOptions`, `PickSavePathResult` con discriminated
  union su `status`).
- **`WinRTSavePicker.windows.ts`** — caricamento del TurboModule
  `WinRTSavePickerModule` registrato dal bridge C++/WinRT.
- **`WinRTSavePicker.macos.ts`** / **`WinRTSavePicker.stub.ts`** —
  fallback che ritorna sempre `{ status: 'PICKER_UNAVAILABLE' }`.
- **`index.ts`** — riesporta `WinRTSavePicker` e i tipi; Metro
  resolver seleziona la variant per piattaforma.

Il bridge C++/WinRT vive in
`windows/ZecchinoReact/WinRTSavePickerModule.{h,cpp}`. Espone
un solo metodo asincrono `pickSavePath(options)` che apre
`Windows.Storage.Pickers.FileSavePicker` sull'HWND attivo
(`IInitializeWithWindow`) e marshalla il risultato sull'UI thread
via `ReactContext.UIDispatcher().Post()`. Le eccezioni
(`hresult_canceled`, `E_INVALIDARG`, `E_FAIL`) sono mappate in
modo esaustivo sul discriminated union JS.

`ExportService.exportFile` (in `src/lib/`) consuma il modulo via
`@/native` quando `Platform.OS === 'windows'` e completa il delivery
con `@react-native-windows/fs`. Su altre piattaforme usa share sheet
mobile o fallback `UNSUPPORTED_PLATFORM` senza import nativi.

### Feedback nativi: Aptico e Sonoro

ZecchinoReact centralizza il feedback sensoriale (aptico ed acustico) nel layer `src/lib/` per garantire uniformità di comportamento e supporto cross-platform:

1. **Haptic System (`src/lib/haptic-system.ts`)**:
   - Gestito tramite `expo-haptics` su Android e iOS.
   - Fornisce un fallback no-op sicuro su Windows (Platform.OS === 'windows') per prevenire crash.
   - Sincronizza lo stato delle preferenze tramite `AsyncStorage` locale ed il database Supabase.
   - Espone un'interfaccia shim deprecata per garantire la retrocompatibilità con le 33 vecchie chiamate legacy.

2. **Sound System (`src/lib/sound-system.ts`)**:
   - Gestito tramite `react-native-audio-api` su Android e iOS, fornendo un'implementazione del Web Audio API standard in ambiente nativo.
   - Esegue un early return no-op su Windows per preservare la compatibilità di build e runtime.
   - Inizializza l'audio context ed i nodi in modo lazy (`ensureContext()`) per evitare consumi di risorse o crash in fase di import.
   - Esegue una temporizzazione acustica nativa (tramite `audioContext.currentTime`) per garantire una precisione millimetrica degli attacchi e rilasci delle onde sintetizzate (oscillatori), senza delegare a `setTimeout` del runtime JS.
   - Normalizza i vecchi 86 suoni legacy in 5 suoni canonici fisici (`click`, `success`, `warning`, `error`, `navigation`).
   - Sincronizza lo stato globale tramite il ciclo di vita `AppState` (sospensione e ripresa automatica del contesto audio).

---

## 3. Flusso dati principale

```
App.tsx
  └── NetworkStatusProvider (NetworkStatusContext.tsx)
    └── AuthProvider (AuthContext.tsx)
      ├── legge sessione da Supabase Auth
      ├── carica UserSettings da repository
      └── UserSettingsProvider
        └── VisibleDataContext
          └── AppDataProvider
            ├── bootstrap a tre casi: offline / online / NetInfo init
            ├── timeout remoto nominato a 10 s
            └── (screens e componenti)
```

### Scrittura preferenze

```
componente → setDisplayPreference(chiave, valore)
           → use-user-settings → updatePreference(chiave, valore)
           → repository → RPC Supabase update_impostazioni_preference
           → stato locale aggiornato solo dopo conferma DB
```

---

## 4. Database (Supabase / PostgreSQL)

Tutti i file SQL sono in `docs/6-sql/`.

| Tabella                  | File SQL        | Note                                                                                       |
| ------------------------ | --------------- | ------------------------------------------------------------------------------------------ |
| `conti`                  | schema P25      | RLS: `user_id = auth.uid()`                                                                |
| `transazioni`            | schema P25      | RLS; trigger: cifratura automatica                                                         |
| `categorie`              | schema P25      | seed in P35                                                                                |
| `budget`                 | schema P25      |                                                                                            |
| `obiettivi_risparmio`    | schema P25      |                                                                                            |
| `impostazioni_utente`    | P25 + P40 + P41 | JSONB `preferences` (32 chiavi), hash PIN, `pin_kdf_salt` e `pin_master_key_encrypted`     |
| `tag`, `transazioni_tag` | schema + P50    | Associazioni tag-transazione con RPC dedicate e trigger `sync_tag_usage_count`             |
| `notifiche`              | schema + P51    | Notifiche persistite con metadata JSONB, query unread e cleanup lifecycle                  |
| `allegati_transazioni`   | schema          | Allegati persistiti con path storage privato, metadata file e delete coordinata Storage/DB |

### RPC Supabase

| Funzione                         | Firma                                                   | Uso                                                        |
| -------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| `update_impostazioni_preference` | `(p_chiave text, p_valore jsonb) → impostazioni_utente` | Merge atomico JSONB singola chiave                         |
| `add_tag_to_transaction`         | `(p_transaction_id uuid, p_tag_id uuid) → void`         | Associa un tag a una transazione                           |
| `set_transaction_tags`           | `(p_transaction_id uuid, p_tag_ids uuid[]) → void`      | Sostituisce l'intero set di tag di una transazione         |
| `remove_tag_from_transaction`    | `(p_transaction_id uuid, p_tag_id uuid) → void`         | Rimuove un tag da una transazione                          |
| `notifiche.metadata`             | `JSONB`                                                 | Metadata obbligatori per dedup/escalation notifiche budget |

---

## 5. Compatibilità React Native — tabella per file

| File                                               | Layer      | Stato                        | Blocco build?  | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------- | ---------- | ---------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/types.ts`                                     | lib        | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/constants.ts`                                 | lib        | ✅ Compatibile               | No             | `badgeVariant` web da adattare per RN                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/design-tokens/colors.ts`                       | lib        | ✅ Compatibile               | No             | Token di design centralizzati per colori hex e icone (DESIGN 020)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `lib/helpers.ts`                                   | lib        | ✅ Compatibile               | No             | Layer 1 invariato: contiene `exportToCSV`, nessun delivery file DOM residuo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `lib/export-service.ts`                            | lib        | ✅ Compatibile               | No             | Delivery export multi-piattaforma: iOS/Android via `react-native-share`, Windows via `@react-native-windows/fs` + `@/native`. PLAN 012 aggiunge guardia concorrente sincrona `inProgress`, reason `ALREADY_IN_PROGRESS` e rilascio del flag nel `finally`.                                                                                                                                                                                                                                                                                                       |
| `lib/budget-alerts.ts`                             | lib        | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/budget-forecasting.ts`                        | lib        | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/budget-history.ts`                            | lib        | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/budget-templates.ts`                          | lib        | ✅ Compatibile               | No             | Usa chiavi semantiche e colori centralizzati per RN                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lib/loan-calculator.ts`                           | lib        | ✅ Compatibile               | No             | calcolo ammortamento francese e italiano, nessuna dipendenza nativa.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `lib/monthly-comparison.ts`                        | lib        | ✅ Compatibile               | No             | pura logica di calcolo, zero dipendenze esterne.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `lib/budget-notification-config.ts`                | lib        | ✅ Compatibile               | No             | sole costanti e tipi, nessuna dipendenza.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `lib/crypto.ts`                                    | lib        | ✅ OK                        | Sì             | `hashPin`/`verifyPin` invariati; `derivePinKey`, `encryptDataPin` e `decryptDataPin` aggiungono PBKDF2-SHA256 (600.000 iterazioni) e payload `KDF_VERSION[1] SALT[16] IV[12] Ciphertext[N] AuthTag[16]`. PLAN 010 aggiunge `generateMasterKey`, `wrapMasterKeyWithPin`, `unwrapMasterKeyWithPin` e `rewrapMasterKeyWithPin` per la wrapped master key versionata del PIN. |
| `lib/kdf-provider.ts`                              | lib        | ✅ Compatibile               | No             | Boundary KDF verso `react-native-quick-crypto`; fallback Node/OpenSSL usato solo nei test Jest                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `lib/haptic-system.ts`                             | lib        | ✅ Compatibile               | No             | Feedback aptico centralizzato via `expo-haptics` con AsyncStorage e fallback no-op Windows (AN-01)                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `lib/sound-system.ts`                              | lib        | ✅ Compatibile               | No             | Riscrittura nativa con react-native-audio-api (PLAN 022)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `lib/screen-reader.ts`                             | lib        | **ELIMINATO (DESIGN 004)**   | —              | Sostituito da `src/announcements/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `lib/supabase/client.ts`                           | supabase   | ⚠️ Richiede config           | **Sì (B2/B6)** | OK struttura; bloccato senza `react-native-dotenv` in Babel                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `lib/supabase/cache.ts`                            | supabase   | ✅ Compatibile               | No             | AsyncStorage 24h TTL con slice `ricorrenze`, `tag` e `transazioni_tag` inclusi dai blocchi 013-014                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `lib/supabase/types.ts`                            | supabase   | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/supabase/repositories/conti.ts`               | supabase   | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/supabase/repositories/transazioni.ts`         | supabase   | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/supabase/repositories/categorie.ts`           | supabase   | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/supabase/repositories/budget.ts`              | supabase   | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/supabase/repositories/obiettivi-risparmio.ts` | supabase   | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/supabase/repositories/ricorrenze.ts`          | supabase   | ✅ Compatibile               | No             | CRUD logico ricorrenze con `getDue` e `deactivate`, senza delete fisico                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `lib/supabase/repositories/tag.ts`                 | supabase   | ✅ Compatibile               | No             | CRUD tag utente con campi opzionali `colore`/`icona` e contatore `usatoNVolte` read-only lato client                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `lib/supabase/repositories/transazioni-tag.ts`     | supabase   | ✅ Compatibile               | No             | Query bulk associazioni e delega RPC per add/set/remove tag su transazioni                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `lib/supabase/repositories/notifiche.ts`           | supabase   | ✅ Compatibile               | No             | Query unread, deduplicazione per entità/livello e API di mark-read/cleanup notifiche                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `lib/supabase/repositories/allegati.ts`            | supabase   | ✅ Compatibile               | No             | Repository cross-system per allegati con rollback best-effort su insert DB fallita e delete Storage→DB                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `lib/supabase/storage.ts`                          | supabase   | ✅ Compatibile               | No             | Validazione file allegati, path sicuro per bucket privato, signed URL temporanee e upload/delete storage                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `lib/storage-cleanup-service.ts`                   | lib        | ✅ Compatibile               | No             | Cleanup automatico e fail-soft dei file orfani storage con trigger login/logout/delete transazione e rollback allegati                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `lib/file-system/magic-bytes-reader*.ts`           | lib        | ✅ Compatibile               | No             | Lettura header a 8 byte e confronto firme JPEG/PNG/PDF per hardening pre-upload                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lib/supabase/repositories/impostazioni-utente.ts` | supabase   | ✅ Compatibile               | No             | `updatePinSecurityMaterial` garantisce update atomico di `pin_privato_hash`, `pin_kdf_salt` e `pin_master_key_encrypted`; il repository rifiuta stati parziali del materiale PIN.                                                                                                                                                                                                                                                                                                                                                                                |
| `lib/notification-service.ts`                      | lib        | ✅ Compatibile               | No             | Orchestrazione notifiche budget con deduplicazione, escalation replace, hydration unread e cleanup post-READY                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `context/AuthContext.tsx`                          | context    | ⚠️ Rottura residua           | **Sì (B4)**    | PLAN 010 completato: set/change/remove PIN ora gestiscono wrapped master key, reset distruttivo e localizzazione dei messaggi PIN. Blocco 016-bis: trigger cleanup orfani su SIGNED_IN e logout con timeout protetto. Resta il placeholder UI `Button` nel perimetro migrazione RN.                                                                                                                                                                                                                                                                              |
| `context/AppDataContext.tsx`                       | context    | ⚠️ Rottura residua (B3 shim) | **Sì (B3)**    | `sonner` shim attivo; bug N9 RISOLTO (PLAN 007), bootstrap resiliente RISOLTO (PLAN 011: casi offline/online/init, timeout 10 s, errori interni confinati), export nativo padre RISOLTO (PLAN 009): `handleExportCSV` ora usa `exportFile` e firma `Promise<void>`. Blocchi 013-016-ter: nuovi slice `ricorrenze`, `tags`, `transactionTagMap` e `notifications`; hydration secondaria fail-soft delle notifiche dopo `READY`, refresh notifiche su `refreshAll`, merge locale coerente sulle escalation budget e trigger cleanup orfani post-removeTransaction. |
| `context/NetworkStatusContext.tsx`                 | context    | ✅ Compatibile               | No             | `NetworkStatusProvider` con debounce offline e fail-safe Online-First a 3000 ms; primo provider della catena applicativa                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `context/app-data-cache.ts`                        | context    | ✅ Compatibile               | No             | Modulo isolato (PLAN 007 T7): `readCachedDomainSnapshotPure` testabile direttamente; dai blocchi 013-014 include `ricorrenze`, `tags` e `transactionTagMap`                                                                                                                                                                                                                                                                                                                                                                                                      |
| `context/UserSettingsContext.tsx`                  | context    | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `context/VisibleDataContext.tsx`                   | context    | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `hooks/use-user-settings.ts`                       | hooks      | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `hooks/use-visible-data.ts`                        | hooks      | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `hooks/use-display-preferences.ts`                 | hooks      | ✅ Compatibile               | No             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `hooks/use-haptic.ts`                              | hooks      | ✅ Compatibile               | No             | Hook per feedback aptico delegato a `hapticSystem` (AN-01 completato)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `hooks/use-inactivity-timer.ts`                    | hooks      | ✅ Compatibile               | Sì             | DESIGN 002 STEP 002 (N6): migrato a `setTimeout` RN; detection eventi delegata a `ActivityDetectorView`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `hooks/use-network-status.ts`                      | hooks      | ✅ Compatibile               | No             | Rilevamento stato di rete centralizzato via `NetInfo` (DESIGN 008)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `components/ActivityDetectorView.tsx`              | components | ✅ Compatibile               | Sì             | DESIGN 002 STEP 002 (N6): View RN che invoca `onActivity` su touch e (Windows) keydown senza catturare il responder                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ~~`hooks/use-talkback.ts`~~                        | hooks      | **ELIMINATO**                | —              | Rimosso in DESIGN 003. Sostituito da `accessibility/detection.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

### Nuovi file aggiunti (DESIGN 003)

| File                         | Layer         | Stato RN       | Blocco? | Note                                                                                           |
| ---------------------------- | ------------- | -------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `accessibility/types.ts`     | accessibility | ✅ Compatibile | No      | Tipi condivisi tra engine e detection                                                          |
| `accessibility/engine.ts`    | accessibility | ✅ Compatibile | No      | Singleton announce — importabile **solo** da `src/announcements/index.ts` (invariante ADR_001) |
| `accessibility/detection.ts` | accessibility | ✅ Compatibile | No      | Sostituisce use-talkback.ts                                                                    |
| `locales/it.ts`              | locales       | ✅ Compatibile | No      | Scaffolding stringhe IT (vuoto)                                                                |
| `locales/index.ts`           | locales       | ✅ Compatibile | No      | Entry point localizzazione                                                                     |

### Nuovi file aggiunti (DESIGN 004)

| File                        | Layer         | Stato RN       | Blocco? | Note                                                                                         |
| --------------------------- | ------------- | -------------- | ------- | -------------------------------------------------------------------------------------------- |
| `announcements/index.ts`    | announcements | ✅ Compatibile | No      | Dispatcher `announce()` + re-export builder. Unico path che importa `@/accessibility/engine` |
| `announcements/types.ts`    | announcements | ✅ Compatibile | No      | Re-export `Announcement`/`AnnouncementPriority` + `ActionType` + `actionKeyMap`              |
| `announcements/ui.ts`       | announcements | ✅ Compatibile | No      | 26 builder generici (focus, dialog, navigazione, filtri)                                     |
| `announcements/auth.ts`     | announcements | ✅ Compatibile | No      | 8 builder per stati PIN/sessione                                                             |
| `announcements/accounts.ts` | announcements | ✅ Compatibile | No      | 14 builder per conti, transazioni, export                                                    |
| `announcements/budgets.ts`  | announcements | ✅ Compatibile | No      | 12 builder per budget/obiettivi con soglie semantiche                                        |
| `announcements/_utils/*.ts` | announcements | ✅ Compatibile | No      | Utility pure: `t`, `currency`, `dates`, `plurals`                                            |

---

## 6. Blocchi di build correnti

Per la lista completa con descrizione e priorità, vedi:  
→ [docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md](1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md)

### Riepilogo blocchi critici (impediscono qualsiasi avvio)

| ID  | Causa                                                   | File                            | Fix                                       |
| --- | ------------------------------------------------------- | ------------------------------- | ----------------------------------------- |
| B1  | `@/*` alias non risolto da Metro                        | `babel.config.js`               | Aggiungere `babel-plugin-module-resolver` |
| B2  | `process.env.SUPABASE_*` undefined → throw in client.ts | `babel.config.js`               | Aggiungere plugin `react-native-dotenv`   |
| B3  | `sonner` non installato (DOM-only)                      | `AuthContext`, `AppDataContext` | Rimuovere; sostituire con toast nativo RN |
| B4  | `@/components/ui/button` non esiste                     | `AuthContext.tsx`               | Creare componente o rimuovere import      |
| B5  | `@react-native-async-storage ^3.0.2` non esiste su npm  | `package.json`                  | Cambio versione a `^2.x`                  |
| B6  | correlato a B2                                          | `babel.config.js`               | Risolto con B2                            |

---

## 7. Piano di migrazione consigliato (bottom-up)

```
Fase 0 — Config (pre-requisito globale)
  ├── B5: fix package.json (async-storage ^2.x)
  ├── B1: aggiungere babel-plugin-module-resolver
  └── B2/B6: aggiungere react-native-dotenv plugin

Fase 1 — Rimpiazza dipendenze DOM in lib/
  ├── haptic-system.ts → expo-haptics (✅ COMPLETATO)
  ├── sound-system.ts → react-native-audio-api (✅ COMPLETATO)
  ├── screen-reader.ts → ✅ COMPLETATO (DESIGN 004)
      Sostituito da src/announcements/ → accessibility/engine →
      AccessibilityInfo.announceForAccessibility

Fase 2 — Rimpiazza hook web-only
  ├── use-inactivity-timer.ts → AppState + setTimeout RN
  ├── use-network-status.ts → @react-native-community/netinfo (✅ COMPLETATO)
  └── use-talkback.ts → ✅ COMPLETATO (DESIGN 003)
      Sostituito da src/accessibility/detection.ts + engine.ts

Fase 3 — Pulisci context
  ├── AppDataContext → ✅ COMPLETATO (PLAN 007 v0.2.0) bug N9 async cache risolto + state machine
  └── AuthContext → rimuovi document.*, sonner, Button

Fase 4 — Crea componenti UI base (src/components/)
  └── Button, Toast/notification, etc.

Fase 5 — Screens
  └── Implementazione schermate con componenti RN nativi
```

---

## 8. Configurazione build (file correnti)

### `babel.config.js`

Stato attuale: solo preset `@react-native/babel-preset`.  
**Mancano** (blocco build):

```js
plugins: [
  ['module:react-native-dotenv', { moduleName: '@env', path: '.env' }],
  ['module-resolver', { root: ['./src'], alias: { '@': './src' } }],
];
```

### `tsconfig.json`

Estende `@react-native/typescript-config`. Path alias `@/*` → `src/*` configurato.  
**Problema minore**: `"types": ["node"]` — maschera errori portabilità TS.

### `metro.config.js`

Blocklist attiva per `windows/` e build output `react-native-windows`.  
Nessuna modifica richiesta.

### `package.json`

Dipendenza errata: `@react-native-async-storage/async-storage: ^3.0.2` (la major 3 non esiste).  
Correggere a `^2.x`.

---

## 9. Piattaforme target

| Piattaforma | Entry      | Note                                         |
| ----------- | ---------- | -------------------------------------------- |
| Android     | `android/` | Compilazione Gradle                          |
| iOS         | `ios/`     | Richiede `bundle exec pod install`           |
| Windows     | `windows/` | react-native-windows; blocklist Metro attiva |

---

## 10. Convenzioni codice

- Nomi variabili, tipi, label UI: **italiano**
- Tipi client-side: **camelCase** (`nomeVisualizzato`, `importoTarget`)
- Tipi DB row: **snake_case** (`nome_visualizzato`, `importo_target`) — interni a `lib/supabase/`
- Errori DB: sempre wrappati in `RepositoryError`
- Scritture settings: **non ottimistiche** — stato locale aggiornato solo dopo conferma Supabase
- Cache: invalidare sempre con `invalidateCache(userId)` al sign-out
