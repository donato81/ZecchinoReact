# REPORT: Analisi Debiti Tecnici e Compatibilità Android v1.0.0

## SEZIONE 1 — RIEPILOGO ESECUTIVO
Il presente report fornisce un'analisi dettagliata dello stato dei debiti tecnici e della compatibilità della piattaforma Android per il progetto ZecchinoReact. Sono stati analizzati un totale di 10 debiti tecnici presenti nella sezione 7.1 del master TODO. Di questi, 3 risultano CHIUSI e 7 risultano APERTI (suddivisi in: 1 APERTO-ESTERNO, 1 APERTO-MULTIPIATTAFORMA, 1 APERTO-IOS e 4 APERTO-BASSA-PRIORITÀ). Inoltre, sono stati individuati 3 nuovi problemi legati alla compatibilità Android e alla qualità del codice. La prossima azione raccomandata è la risoluzione del problema critico di build/runtime relativo al permesso di vibrazione mancante su Android e l'implementazione del supporto HEIC/WEBP per i magic bytes.

---

## SEZIONE 2 — DEBITI TECNICI ANALIZZATI

### DT-009-N-01 — Blocker build Windows: netinfo + Windows App SDK 1.8.x
- **Stato assegnato:** APERTO-ESTERNO
- **Motivazione:** Errore di restore delle dipendenze transitive di WAS 1.8.x causato dal modulo esterno `@react-native-community/netinfo`.
- **File verificati:** [package.json](file:///c:/Sviluppo/ZecchinoReact/package.json), [ZecchinoReact.vcxproj](file:///c:/Sviluppo/ZecchinoReact/windows/ZecchinoReact/ZecchinoReact.vcxproj)
- **Priorità:** MEDIA

### DT-009-N-02 — Ambiente Android non configurato
- **Stato assegnato:** CHIUSO
- **Motivazione:** L'ambiente Android e l'emulatore sulla macchina dell'architetto sono ora configurati e pienamente funzionanti.
- **File verificati:** [build.gradle](file:///c:/Sviluppo/ZecchinoReact/android/build.gradle), [app/build.gradle](file:///c:/Sviluppo/ZecchinoReact/android/app/build.gradle)
- **Priorità:** ALTA

### DT-016-01 — Magic bytes validation allegati
- **Stato assegnato:** CHIUSO
- **Motivazione:** La scansione fisica delle firme dei file (jpeg, png, pdf) è stata implementata e integrata nel processo di validazione degli allegati.
- **File verificati:** [magic-bytes-reader.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/file-system/magic-bytes-reader.ts), [magic-bytes-validation.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/magic-bytes-validation.test.ts)
- **Priorità:** MEDIA

### DT-016-02 — Cleanup automatico file orfani Storage
- **Stato assegnato:** CHIUSO
- **Motivazione:** Il servizio di pulizia automatica fire-and-forget è implementato, coperto da test e integrato negli eventi di autenticazione e rimozione transazioni.
- **File verificati:** [storage-cleanup-service.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/storage-cleanup-service.ts), [storage-cleanup-service.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/storage-cleanup-service.test.ts)
- **Priorità:** MEDIA

### DT-016-bis-01 — Script CLI manutenzione storage
- **Stato assegnato:** APERTO-BASSA-PRIORITÀ
- **Motivazione:** Non è presente uno strumento CLI a riga di comando per consentire agli amministratori di attivare il cleanup manuale dello storage in modo controllato.
- **File verificati:** [storage-cleanup-service.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/storage-cleanup-service.ts)
- **Priorità:** BASSA

### DT-016-bis-02 — Edge Functions server-side cleanup
- **Stato assegnato:** APERTO-BASSA-PRIORITÀ
- **Motivazione:** Il cleanup è gestito lato client ed eseguito solo ad app aperta. Manca l'implementazione di una Supabase Edge Function dedicata per il server.
- **File verificati:** Nessuno (funzionalità mancante)
- **Priorità:** BASSA

### DT-016-bis-03 — Log opt-in per utenti avanzati
- **Stato assegnato:** APERTO-BASSA-PRIORITÀ
- **Motivazione:** Le segnalazioni delle attività di cleanup avvengono solo tramite console di sviluppo. Manca una memorizzazione persistente consultabile a UI.
- **File verificati:** [storage-cleanup-service.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/storage-cleanup-service.ts)
- **Priorità:** BASSA

### DT-016-ter-01 — Supporto HEIC e WEBP magic bytes
- **Stato assegnato:** APERTO-MULTIPIATTAFORMA
- **Motivazione:** Le firme fisiche verificate si limitano a jpeg, png e pdf. I formati HEIC (nativo iOS) e WEBP (diffuso sul web) non sono supportati.
- **File verificati:** [storage.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/supabase/storage.ts)
- **Priorità:** MEDIA

### DT-016-ter-02 — Supporto iOS magic bytes validation
- **Stato assegnato:** APERTO-IOS
- **Motivazione:** La lettura dell'header dei file non è implementata su iOS (ritorna uno stub vuoto), causando il rifiuto di tutti gli allegati su questa piattaforma.
- **File verificati:** [magic-bytes-reader.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/file-system/magic-bytes-reader.ts)
- **Priorità:** ALTA

### DT-016-ter-03 — Bridge nativo Windows per magic bytes
- **Stato assegnato:** APERTO-BASSA-PRIORITÀ
- **Motivazione:** Su Windows viene usato JavaScript puro tramite il modulo filesystem. Un modulo nativo WinRT migliorerebbe le performance sui file grandi.
- **File verificati:** [magic-bytes-reader.windows.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/file-system/magic-bytes-reader.windows.ts)
- **Priorità:** BASSA

---

## SEZIONE 3 — PROBLEMI ANDROID NUOVI

### 1. Mancanza del permesso VIBRATE in AndroidManifest.xml
- **Descrizione:** Il sistema aptico nativo (`haptic-system.ts`) utilizza le funzionalità di vibrazione hardware tramite `expo-haptics`. Tuttavia, il permesso per la vibrazione non è dichiarato nel file manifest di Android.
- **File coinvolto:** [AndroidManifest.xml](file:///c:/Sviluppo/ZecchinoReact/android/app/src/main/AndroidManifest.xml)
- **Impatto su build o runtime Android:** A runtime, le chiamate al feedback aptico falliranno silenziosamente o produrranno eccezioni di sicurezza su vari dispositivi Android.
- **Priorità:** CHIUSO
- **Suggerimento di risoluzione:** Aggiungere la riga `<uses-permission android:name="android.permission.VIBRATE" />` a [AndroidManifest.xml](file:///c:/Sviluppo/ZecchinoReact/android/app/src/main/AndroidManifest.xml).

  Risolto il 2026-06-27.
  Fix applicato: aggiunto VIBRATE in AndroidManifest.xml.

### 2. Dipendenze in package.json non censite in architettura.md o api.md
- **Descrizione:** Le librerie `@noble/hashes`, `react-native-nitro-modules` e `react-native-fs` sono incluse in `package.json` ma non compaiono in alcuna tabella di compatibilità all'interno della documentazione tecnica.
- **File coinvolto:** [package.json](file:///c:/Sviluppo/ZecchinoReact/package.json), [architettura.md](file:///c:/Sviluppo/ZecchinoReact/docs/architettura.md), [api.md](file:///c:/Sviluppo/ZecchinoReact/docs/api.md)
- **Impatto su build o runtime Android:** Nessun impatto a runtime, ma costituisce un debito documentale importante che compromette la chiarezza dell'architettura.
- **Priorità:** BASSA
- **Suggerimento di risoluzione:** Aggiornare la sezione delle dipendenze in [architettura.md](file:///c:/Sviluppo/ZecchinoReact/docs/architettura.md) e [api.md](file:///c:/Sviluppo/ZecchinoReact/docs/api.md) inserendo queste librerie e dichiarando la loro compatibilità.

### 3. Assenza di copertura test unitari dedicati per moduli chiave del motore
- **Descrizione:** Vari file logici critici (come `budget-forecasting.ts`, `budget-history.ts`, `budget-templates.ts`, `kdf-provider.ts`, `helpers.ts`) ed i moduli di accessibilità (`detection.ts`, `engine.ts`) non dispongono di test unitari dedicati nella directory `__tests__/` o sono coperti solo indirettamente / mockati.
- **File coinvolto:** Directory [__tests__](file:///c:/Sviluppo/ZecchinoReact/__tests__)
- **Impatto su build o runtime Android:** Rischio elevato di regressioni logiche silenziose sul motore finanziario e di accessibilità a seguito di futuri refactoring.
- **Priorità:** MEDIA
- **Suggerimento di risoluzione:** Scrivere file `.test.ts` specifici in [__tests__](file:///c:/Sviluppo/ZecchinoReact/__tests__) per ciascun modulo logico non coperto.

---

## SEZIONE 4 — LISTA LAVORI PRIORITIZZATA

### 1. [Priorità ALTA] — Configurazione del permesso di vibrazione su Android
- **Descrizione:** Dichiarazione del permesso nativo di vibrazione per garantire il corretto funzionamento di `expo-haptics`.
- **Eseguibile senza UI:** Sì (modifica di configurazione nativa).
- **Target:** Android.

### 2. [Priorità MEDIA] — Estensione dei magic bytes per formati HEIC e WEBP
- **Descrizione:** Aggiunta delle firme fisiche per HEIC e WEBP nella validazione degli allegati all'interno di `storage.ts`.
- **Eseguibile senza UI:** Sì (modifica logica e allineamento test unitari).
- **Target:** Multi-piattaforma (incluso Android).

### 3. [Priorità MEDIA] — Creazione suite di test per i moduli logici privi di copertura
- **Descrizione:** Scrittura dei test unitari mancanti per `budget-forecasting`, `budget-history`, `budget-templates`, `kdf-provider`, `helpers`, `detection` ed `engine`.
- **Eseguibile senza UI:** Sì.
- **Target:** Multi-piattaforma.

### 4. [Priorità BASSA] — Script CLI per il cleanup manuale dello storage
- **Descrizione:** Sviluppo di uno script a linea di comando per consentire l'esecuzione on-demand del cleanup dello storage.
- **Eseguibile senza UI:** Sì.
- **Target:** Sviluppo/Infrastruttura.

### 5. [Priorità BASSA] — Implementazione log opt-in per utenti esperti
- **Descrizione:** Creazione del registro persistente locale in `storage-cleanup-service.ts` per raccogliere le attività di pulizia.
- **Eseguibile senza UI:** Sì (solo parte logica/motore, la UI associata è differita).
- **Target:** Multi-piattaforma.

---

## SEZIONE 5 — COPERTURA TEST

| Modulo | File Test | Stato Copertura |
| :--- | :--- | :--- |
| `src/lib/types.ts` | — | Non richiesto (Solo Tipi) |
| `src/lib/constants.ts` | — | Non coperto |
| `src/lib/design-tokens/colors.ts` | — | Non coperto |
| `src/lib/helpers.ts` | — | Non coperto |
| `src/lib/export-service.ts` | `__tests__/ExportService.test.ts` | Coperto (13 test) |
| `src/lib/budget-alerts.ts` | — | Non coperto |
| `src/lib/budget-forecasting.ts` | — | Non coperto |
| `src/lib/budget-history.ts` | — | Non coperto |
| `src/lib/budget-templates.ts` | — | Non coperto |
| `src/lib/loan-calculator.ts` | `__tests__/loan-calculator.test.ts` | Coperto |
| `src/lib/monthly-comparison.ts` | `__tests__/monthly-comparison.test.ts` | Coperto |
| `src/lib/budget-notification-config.ts` | — | Non richiesto (Solo Costanti/Tipi) |
| `src/lib/crypto.ts` | `__tests__/crypto/` | Coperto (Pin, Kdf, Encrypt/Decrypt, WrappedKey) |
| `src/lib/kdf-provider.ts` | — | Non coperto |
| `src/lib/haptic-system.ts` | `__tests__/haptic-system.test.tsx` | Coperto |
| `src/lib/sound-system.ts` | `__tests__/sound-system.spec.ts` | Coperto |
| `src/lib/supabase/types.ts` | — | Non richiesto (Solo Tipi) |
| `src/lib/supabase/client.ts` | — | Mockato nei test |
| `src/lib/supabase/cache.ts` | `__tests__/AppDataContext.spec.ts` | Coperto indirettamente |
| `src/lib/supabase/storage.ts` | `__tests__/allegati.storage.test.ts` | Coperto |
| `src/lib/supabase/repositories/*.ts` | `__tests__/*repository.test.ts` | Tutti i repository coperti |
| `src/lib/storage-cleanup-service.ts` | `__tests__/storage-cleanup-service.test.ts` | Coperto |
| `src/lib/file-system/magic-bytes-reader.ts` | `__tests__/magic-bytes-validation.test.ts` | Coperto |
| `src/lib/notification-service.ts` | `__tests__/notification-service.test.ts` | Coperto |
| `src/context/AuthContext.tsx` | `__tests__/AuthContext.pin.test.tsx` | Coperto |
| `src/context/AppDataContext.tsx` | `__tests__/AppDataContext.spec.ts` | Coperto |
| `src/context/NetworkStatusContext.tsx` | `__tests__/use-network-status.spec.ts` | Coperto |
| `src/context/app-data-cache.ts` | `__tests__/AppDataContext.spec.ts` | Coperto indirettamente |
| `src/context/UserSettingsContext.tsx` | — | Non coperto |
| `src/context/VisibleDataContext.tsx` | — | Non coperto |
| `src/hooks/use-display-preferences.ts` | — | Non coperto |
| `src/hooks/use-haptic.ts` | — | Coperto indirettamente |
| `src/hooks/use-inactivity-timer.ts` | — | Non coperto |
| `src/hooks/use-network-status.ts` | `__tests__/use-network-status.spec.ts` | Coperto |
| `src/hooks/use-user-settings.ts` | — | Non coperto |
| `src/hooks/use-visible-data.ts` | — | Non coperto |
| `src/accessibility/types.ts` | — | Non richiesto (Solo Tipi) |
| `src/accessibility/engine.ts` | — | Mockato nei test |
| `src/accessibility/detection.ts` | — | Mockato nei test |

---

## SEZIONE 6 — NOTE OPERATIVE
1. **expo-haptics su Android:** Si conferma che l'utilizzo di `expo-haptics` garantisce un eccellente supporto e stabilità su Android rispetto all'API legacy di vibrazione del browser, purché venga dichiarato il corretto permesso nativo.
2. **react-native-audio-api su Android:** L'integrazione con `react-native-audio-api` (PLAN 022) è stata validata ed è fully-compatible con la New Architecture e il runtime Hermes su Android.
3. **MIME type e Magic Bytes:** Nel momento in cui si estenderà il supporto dei magic bytes a HEIC e WEBP, si consiglia di aggiornare sia le definizioni dei tipi MIME sia la lista delle firme fisiche per prevenire anomalie nei controlli di caricamento degli allegati.
