# ZecchinoReact

App di finanza personale per **Android**, **iOS** e **Windows** (react-native-windows).  
Il dominio â€” nomi variabili, tipi, label UI â€” Ã¨ interamente in italiano.

Versione progetto: **0.16.0**.

> **Stato attuale**: migrazione da web (React + shadcn) a React Native in corso.  
> L'app **non Ã¨ avviabile** fino alla risoluzione dei 6 blocchi di build documentati in  
> [`docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md`](docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md).

Stato rilascio: la release `0.16.0` integra i blocchi 017 (Prestiti), 018 (Confronto Mese su Mese per Categoria), 019 (Notifiche Budget e Orchestrazione) e 020 (Centralizzazione design tokens).

Aggiornamento 2026-06-26: i blocchi 017, 018, 019 e 020 sono stati completati e validati. I blocchi critici di build Android BC-01, BC-02 e BC-03 sono stati risolti e chiusi. La versione è stata avanzata a `0.16.0` in conformità con la chiusura delle funzionalità e la centralizzazione del design system.

## Funzionalità implementate

- Blocco 013 completato: repository `ricorrenze` con tipi dedicati, query `getDue`, integrazione in `AppDataContext` e cache offline del nuovo slice.
- Blocco 014 completato: repository `tag` e `transazioni-tag`, bootstrap bulk delle associazioni, fallback cache offline per `transactionTagMap` e trigger SQL per mantenere coerente `usato_n_volte`.
- Blocco 015 completato: repository `notifiche`, `notification-service`, hydration secondaria delle notifiche dopo `READY` e deduplicazione/escalation per periodo reale del budget.
- Blocco 016 completato: repository `allegati`, storage Supabase privato con validazione file lato client, path sicuro per upload e rollback best-effort su fallimento DB.
- Blocco 016-bis completato: cleanup automatico e silenzioso dei file orfani Storage con trigger su login, logout, delete transazione e rollback allegati.
- Blocco 016-ter completato: hardening allegati con magic bytes validation su JPEG, PNG e PDF prima dell'upload.
- Blocco 017 completato: modulo prestiti e mutui con tipi PrestitoMutuo e RimborsoPrestitoMutuo, repository prestiti.ts e prestiti-rimborsi.ts con operazioni CRUD complete, calcolo piano di ammortamento in loan-calculator.ts con metodo francese e italiano, integrazione nel domain object globale di AppDataContext.
- Blocco 018 completato: modulo confronto mese su mese per categoria in monthly-comparison.ts, calcolo delta percentuale e assoluto tra mese corrente e mese precedente per categoria di spesa, aggiunta del tipo MonthlyComparison a types.ts.
- Blocco 019 completato: orchestrazione notifiche budget con budget-notification-config.ts, riallineamento repository notifiche con campi titolo_key e messaggio_key per localizzazione a runtime, introduzione tipo NotificationLevel e BudgetNotificationMetadata, chiavi di localizzazione warning, critical ed exceeded in it.ts, mappatura nel notification-service e nel context orchestrator.
- Blocco 020 completato: centralizzazione design tokens per colori e chiavi icone in colors.ts, refactoring constants.ts e budget-templates.ts per rimuovere la dipendenza da @phosphor-icons/react.

---

## Stack tecnologico

| Tecnologia                | Versione | Ruolo                                      |
| ------------------------- | -------- | ------------------------------------------ |
| React Native (bare)       | 0.82.1   | UI framework â€” Android, iOS              |
| React                     | 19.1.1   |                                            |
| react-native-windows      | ^0.82.5  | Target Windows (UWP)                       |
| Supabase JS               | ^2.105.4 | Backend: auth, DB PostgreSQL, RLS          |
| AsyncStorage              | ^2.x     | Cache locale (24h TTL)                     |
| bcryptjs                  | ^3.0.3   | Hashing PIN privato                        |
| react-native-quick-crypto | 1.1.5    | PBKDF2-SHA256 nativa (OpenSSL) per KDF PIN |
| TypeScript                | â€”      | Tipizzazione completa                      |

---

## Requisiti

- **Node.js** >= 20
- Android: Android Studio + SDK (seguire [guida ufficiale](https://reactnative.dev/docs/set-up-your-environment))
- iOS: Xcode + CocoaPods; dopo `npm install` eseguire `bundle exec pod install`
- Windows: Visual Studio 2022 con workload C++ e Windows SDK

---

## Configurazione ambiente

Creare un file `.env` (o `.env.local`) nella root del progetto:

```
SUPABASE_URL=https://<progetto>.supabase.co
SUPABASE_ANON_KEY=<chiave-anonima>
```

Le variabili vengono iniettate da `react-native-dotenv` (plugin configurato in `babel.config.js`) e lette tramite `import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'` in `src/lib/supabase/client.ts`.

---

## Installazione

```bash
npm install
```

---

## Comandi

```bash
npm start              # Avvia Metro bundler
npm run android        # Build ed esegui su emulatore/dispositivo Android
npm run ios            # Build ed esegui su simulatore iOS
npm run windows        # Build ed esegui su Windows (react-native-windows)
npm run lint           # ESLint
npm test               # Jest (tutte le piattaforme)
npm run test:windows   # Jest con config Windows
```

---

## Struttura del progetto

```
src/
  lib/
    types.ts                  # Tipi dominio client (camelCase)
    constants.ts              # Label, icone, mappe tipo→categoria
    helpers.ts                # Calcoli puri (saldo, formattazione, CSV)
    budget-alerts.ts          # Alert budget
    budget-forecasting.ts     # Previsione spesa con livello confidence
    budget-history.ts         # Storico periodi budget
    budget-templates.ts       # Template predefiniti (✅ icone RN)
    crypto.ts                 # Hash PIN, AES-GCM legacy e payload PIN versionato
    kdf-provider.ts           # Boundary PBKDF2-SHA256 verso react-native-quick-crypto
    haptic-system.ts          # Feedback aptico (❌ navigator.vibrate)
    sound-system.ts           # Audio (❌ Web Audio API)
    supabase/
      client.ts               # Singleton Supabase
      types.ts                # Tipi DB row (interni) + UserSettings + RepositoryError
      cache.ts                # Cache AsyncStorage 24h
      repositories/           # CRUD per conti, transazioni, categorie, budget,
                              # obiettivi-risparmio, impostazioni-utente
  context/
    AuthContext.tsx           # Auth, PIN privato, timeout inattivitÃ  (âš ï¸ blocchi B3/B4)
    AppDataContext.tsx        # Tutti i dati di dominio (bug N9 risolto in v0.2.0)
    app-data-cache.ts         # readCachedDomainSnapshotPure isolata (PLAN 007)
    UserSettingsContext.tsx   # Preferenze utente
    VisibleDataContext.tsx    # Dati filtrati per lock privato
  hooks/
    use-user-settings.ts      # Preferenze da Supabase
    use-visible-data.ts       # Filtro conti/transazioni per stato privato
    use-display-preferences.ts
    use-haptic.ts             # (❌ dipende da haptic-system)
    use-inactivity-timer.ts   # (❌ document.addEventListener)
    use-online-status.ts      # (âŒ navigator.onLine)
    use-talkback.ts           # (âŒ matchMedia/sessionStorage)
  screens/                    # (vuoto — da implementare)
  components/                 # (vuoto — da implementare)
  accessibility/              # Engine + detection (DESIGN 003)
    types.ts  engine.ts  detection.ts
  announcements/              # Layer semantico annunci (DESIGN 004)
    index.ts                  # Dispatcher announce() — unico import di engine
    types.ts  ui.ts  auth.ts  accounts.ts  budgets.ts
    _utils/                   # t, currency, dates, plurals
docs/
  api.md                      # Riferimento API completo
  architettura.md             # Architettura layer e piano migrazione
  1-reports/                  # Report diagnostici
  3-coding-plans/             # Piani di implementazione
  6-sql/                      # Script SQL Supabase
```

---

## Database

Tutti i file SQL si trovano in `docs/6-sql/`.

- Row Level Security attiva: `auth.uid() = user_id` su tutte le tabelle
- Preferenze utente in colonna JSONB `preferences` su `impostazioni_utente`
- RPC `update_impostazioni_preference(p_chiave, p_valore)` per merge atomico

---

## Documentazione tecnica

| Documento                                                                                                                  | Contenuto                                                   |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`docs/api.md`](docs/api.md)                                                                                               | Riferimento completo di tutti i moduli pubblici in `src/`   |
| [`docs/architettura.md`](docs/architettura.md)                                                                             | Layer diagram, compatibilitÃ  RN per file, piano migrazione |
| [`docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md`](docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md)   | Diagnosi completa: 6 BLOCCANTI, 11 NON BLOCCANTI            |
| [`docs/1-reports/1-report-analisi-migrazione-react-native.md`](docs/1-reports/1-report-analisi-migrazione-react-native.md) | Classificazione TIENI/VALUTA/ELIMINA per ogni file `src/`   |

---

## Problemi noti

Vedere [`docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md`](docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md) per la lista completa.

Riepilogo blocchi che impediscono l'avvio:

1. `babel.config.js` mancano `babel-plugin-module-resolver` e `react-native-dotenv`
2. `sonner` non Ã¨ installato ed Ã¨ una libreria DOM-only
3. `src/components/ui/button` non esiste
4. `@react-native-async-storage` pinned a versione `^3.x` non pubblicata
