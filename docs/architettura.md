# Architettura — ZecchinoReact

> Aggiornato al: 2026-05-13  
> Stato: Migrazione Web → React Native in corso — app non avviabile fino alla risoluzione dei 6 blocchi (vedi [REPORT_diagnosi-compatibilita-RN_v0.1.0.md](1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md))

---

## 1. Stack tecnologico

| Livello | Tecnologia | Versione | Stato RN |
|---------|-----------|---------|----------|
| Runtime JS | Hermes | bundled con RN 0.82 | ✅ |
| UI Framework | React Native (bare) | 0.82.1 | ✅ |
| React | React | 19.1.1 | ✅ |
| Multi-platform | react-native-windows | ^0.82.5 | ✅ |
| Backend | Supabase JS | ^2.105.4 | ✅ |
| Auth | Supabase Auth | — | ✅ |
| Storage locale | AsyncStorage | ^2.1.2 | ✅ allineato (DESIGN 001) |
| Hashing PIN | bcryptjs | ^3.0.3 | ✅ |
| Cifratura dati | @noble/ciphers (AES-256-GCM, pure-JS) | ^1.0.0 | ✅ Hermes-compatible (PLAN 005) |
| CSPRNG | react-native-get-random-values (polyfill `crypto.getRandomValues`) | ^1.11.0 | ✅ |
| Env vars | react-native-dotenv | ^3.4.11 | ✅ configurato in babel.config.js (DESIGN 001) |
| Alias path | babel-plugin-module-resolver | ^5.0.3 | ✅ configurato in babel.config.js (DESIGN 001) |

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
│  use-online-status                                             │
├─────────────────────────────────────────────────────────────┤
│                      lib/ (dominio)                            │  ← Logica pura + utility
│  types  constants  helpers  budget-alerts  budget-forecasting  │
│  budget-history  budget-templates  crypto                      │
│  haptic-system  sound-system                                   │
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
│               obiettivi-risparmio  impostazioni-utente         │
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

---

## 3. Flusso dati principale

```
App.tsx
  └── AuthProvider (AuthContext.tsx)
        ├── legge sessione da Supabase Auth
        ├── carica UserSettings da repository
        └── UserSettingsProvider
              └── VisibleDataContext
                    └── AppDataProvider
                          ├── legge conti/transazioni/categorie/budget/obiettivi
                          │    └── controlla cache AsyncStorage (24h TTL)
                          │    └── fallback Supabase se cache stale
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

| Tabella | File SQL | Note |
|---------|---------|------|
| `conti` | schema P25 | RLS: `user_id = auth.uid()` |
| `transazioni` | schema P25 | RLS; trigger: cifratura automatica |
| `categorie` | schema P25 | seed in P35 |
| `budget` | schema P25 | |
| `obiettivi_risparmio` | schema P25 | |
| `impostazioni_utente` | P25 | JSONB `preferences` (32 chiavi), hash PIN |

### RPC Supabase

| Funzione | Firma | Uso |
|----------|-------|-----|
| `update_impostazioni_preference` | `(p_chiave text, p_valore jsonb) → impostazioni_utente` | Merge atomico JSONB singola chiave |

---

## 5. Compatibilità React Native — tabella per file

| File | Layer | Stato | Blocco build? | Note |
|------|-------|-------|--------------|------|
| `lib/types.ts` | lib | ✅ Compatibile | No | — |
| `lib/constants.ts` | lib | ✅ Compatibile | No | `color` oklch / `badgeVariant` da adattare per RN |
| `lib/helpers.ts` | lib | ✅ Compatibile | No | Layer 1 invariato: contiene `exportToCSV`, nessun delivery file DOM residuo |
| `lib/export-service.ts` | lib | ✅ Compatibile | No | Delivery export multi-piattaforma: iOS/Android via `react-native-share`, Windows via `@react-native-windows/fs` + `@/native` |
| `lib/budget-alerts.ts` | lib | ✅ Compatibile | No | — |
| `lib/budget-forecasting.ts` | lib | ✅ Compatibile | No | — |
| `lib/budget-history.ts` | lib | ✅ Compatibile | No | — |
| `lib/budget-templates.ts` | lib | ⚠️ Valuta | No | `@phosphor-icons/react` da sostituire con stringhe o componenti RN |
| `lib/crypto.ts` | lib | ✅ OK | Sì | `hashPin`/`verifyPin` (bcryptjs) + `encryptData`/`decryptData` (@noble/ciphers AES-GCM) — PLAN 005 implementato |
| `lib/haptic-system.ts` | lib | ❌ Incompatibile | No | `localStorage` + `navigator.vibrate` — da riscrivere |
| `lib/sound-system.ts` | lib | ❌ Incompatibile | No | Web Audio API — da riscrivere |
| `lib/screen-reader.ts` | lib | **ELIMINATO (DESIGN 004)** | — | Sostituito da `src/announcements/` |
| `lib/supabase/client.ts` | supabase | ⚠️ Richiede config | **Sì (B2/B6)** | OK struttura; bloccato senza `react-native-dotenv` in Babel |
| `lib/supabase/cache.ts` | supabase | ✅ Compatibile | No | Già su AsyncStorage |
| `lib/supabase/types.ts` | supabase | ✅ Compatibile | No | — |
| `lib/supabase/repositories/conti.ts` | supabase | ✅ Compatibile | No | — |
| `lib/supabase/repositories/transazioni.ts` | supabase | ✅ Compatibile | No | — |
| `lib/supabase/repositories/categorie.ts` | supabase | ✅ Compatibile | No | — |
| `lib/supabase/repositories/budget.ts` | supabase | ✅ Compatibile | No | — |
| `lib/supabase/repositories/obiettivi-risparmio.ts` | supabase | ✅ Compatibile | No | — |
| `lib/supabase/repositories/impostazioni-utente.ts` | supabase | ✅ Compatibile | No | — |
| `context/AuthContext.tsx` | context | ❌ Rottura | **Sì (B3, B4)** | `sonner` + `@/components/ui/button` mancanti; `document.*` |
| `context/AppDataContext.tsx` | context | ⚠️ Rottura residua (B3 shim) | **Sì (B3)** | `sonner` shim attivo; bug N9 RISOLTO (PLAN 007) e export nativo padre RISOLTO (PLAN 009): `handleExportCSV` ora usa `exportFile` e firma `Promise<void>` |
| `context/app-data-cache.ts` | context | ✅ Compatibile | No | Modulo isolato (PLAN 007 T7): `readCachedDomainSnapshotPure` testabile direttamente |
| `context/UserSettingsContext.tsx` | context | ✅ Compatibile | No | — |
| `context/VisibleDataContext.tsx` | context | ✅ Compatibile | No | — |
| `hooks/use-user-settings.ts` | hooks | ✅ Compatibile | No | — |
| `hooks/use-visible-data.ts` | hooks | ✅ Compatibile | No | — |
| `hooks/use-display-preferences.ts` | hooks | ✅ Compatibile | No | — |
| `hooks/use-haptic.ts` | hooks | ⚠️ Struttura OK | No | Inutile finché `haptic-system.ts` non è riscritto |
| `hooks/use-screen-reader.ts` | hooks | **ELIMINATO (DESIGN 004)** | — | Sostituito da `src/announcements/` builders |
| `hooks/use-inactivity-timer.ts` | hooks | ✅ Compatibile | Sì | DESIGN 002 STEP 002 (N6): migrato a `setTimeout` RN; detection eventi delegata a `ActivityDetectorView` |
| `components/ActivityDetectorView.tsx` | components | ✅ Compatibile | Sì | DESIGN 002 STEP 002 (N6): View RN che invoca `onActivity` su touch e (Windows) keydown senza catturare il responder |
| `hooks/use-online-status.ts` | hooks | ❌ Incompatibile | No | `navigator.onLine` — da riscrivere con `NetInfo` |
| ~~`hooks/use-talkback.ts`~~ | hooks | **ELIMINATO** | — | Rimosso in DESIGN 003. Sostituito da `accessibility/detection.ts` |

### Nuovi file aggiunti (DESIGN 003)

| File | Layer | Stato RN | Blocco? | Note |
|------|-------|----------|---------|------|
| `accessibility/types.ts` | accessibility | ✅ Compatibile | No | Tipi condivisi tra engine e detection |
| `accessibility/engine.ts` | accessibility | ✅ Compatibile | No | Singleton announce — importabile **solo** da `src/announcements/index.ts` (invariante ADR_001) |
| `accessibility/detection.ts` | accessibility | ✅ Compatibile | No | Sostituisce use-talkback.ts |
| `locales/it.ts` | locales | ✅ Compatibile | No | Scaffolding stringhe IT (vuoto) |
| `locales/index.ts` | locales | ✅ Compatibile | No | Entry point localizzazione |

### Nuovi file aggiunti (DESIGN 004)

| File | Layer | Stato RN | Blocco? | Note |
|------|-------|----------|---------|------|
| `announcements/index.ts` | announcements | ✅ Compatibile | No | Dispatcher `announce()` + re-export builder. Unico path che importa `@/accessibility/engine` |
| `announcements/types.ts` | announcements | ✅ Compatibile | No | Re-export `Announcement`/`AnnouncementPriority` + `ActionType` + `actionKeyMap` |
| `announcements/ui.ts` | announcements | ✅ Compatibile | No | 26 builder generici (focus, dialog, navigazione, filtri) |
| `announcements/auth.ts` | announcements | ✅ Compatibile | No | 8 builder per stati PIN/sessione |
| `announcements/accounts.ts` | announcements | ✅ Compatibile | No | 14 builder per conti, transazioni, export |
| `announcements/budgets.ts` | announcements | ✅ Compatibile | No | 12 builder per budget/obiettivi con soglie semantiche |
| `announcements/_utils/*.ts` | announcements | ✅ Compatibile | No | Utility pure: `t`, `currency`, `dates`, `plurals` |

---

## 6. Blocchi di build correnti

Per la lista completa con descrizione e priorità, vedi:  
→ [docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md](1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md)

### Riepilogo blocchi critici (impediscono qualsiasi avvio)

| ID | Causa | File | Fix |
|----|-------|------|-----|
| B1 | `@/*` alias non risolto da Metro | `babel.config.js` | Aggiungere `babel-plugin-module-resolver` |
| B2 | `process.env.SUPABASE_*` undefined → throw in client.ts | `babel.config.js` | Aggiungere plugin `react-native-dotenv` |
| B3 | `sonner` non installato (DOM-only) | `AuthContext`, `AppDataContext` | Rimuovere; sostituire con toast nativo RN |
| B4 | `@/components/ui/button` non esiste | `AuthContext.tsx` | Creare componente o rimuovere import |
| B5 | `@react-native-async-storage ^3.0.2` non esiste su npm | `package.json` | Cambio versione a `^2.x` |
| B6 | correlato a B2 | `babel.config.js` | Risolto con B2 |

---

## 7. Piano di migrazione consigliato (bottom-up)

```
Fase 0 — Config (pre-requisito globale)
  ├── B5: fix package.json (async-storage ^2.x)
  ├── B1: aggiungere babel-plugin-module-resolver
  └── B2/B6: aggiungere react-native-dotenv plugin

Fase 1 — Rimpiazza dipendenze DOM in lib/
  ├── haptic-system.ts → react-native Vibration / expo-haptics
  ├── sound-system.ts → expo-av
  └── screen-reader.ts → ✅ COMPLETATO (DESIGN 004)
      Sostituito da src/announcements/ → accessibility/engine →
      AccessibilityInfo.announceForAccessibility

Fase 2 — Rimpiazza hook web-only
  ├── use-inactivity-timer.ts → AppState + setTimeout RN
  ├── use-online-status.ts → @react-native-community/netinfo
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
  ['module-resolver', { root: ['./src'], alias: { '@': './src' } }]
]
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

| Piattaforma | Entry | Note |
|-------------|-------|------|
| Android | `android/` | Compilazione Gradle |
| iOS | `ios/` | Richiede `bundle exec pod install` |
| Windows | `windows/` | react-native-windows; blocklist Metro attiva |

---

## 10. Convenzioni codice

- Nomi variabili, tipi, label UI: **italiano**  
- Tipi client-side: **camelCase** (`nomeVisualizzato`, `importoTarget`)  
- Tipi DB row: **snake_case** (`nome_visualizzato`, `importo_target`) — interni a `lib/supabase/`  
- Errori DB: sempre wrappati in `RepositoryError`  
- Scritture settings: **non ottimistiche** — stato locale aggiornato solo dopo conferma Supabase  
- Cache: invalidare sempre con `invalidateCache(userId)` al sign-out
