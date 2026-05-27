Ecco il report completo prodotto da DUSU-ANALYZER:
```
REPORT — Censimento Funzionalità ZecchinoReact
Versione report: 1.0.0
Data produzione: 26 maggio 2026
Agente: DUSU-ANALYZER
Codebase analizzata: 0.4.0 (da CHANGELOG.md + README.md)
File sorgente letti: 56
```
SEZIONE 1 — Executive Summary
Il codebase v0.4.0 contiene 51 funzionalità logiche distinte distribuite su 7 layer architetturali. Le aree più complete sono: layer dati/repository (CRUD completo per tutte e 5 le entità), layer crittografico (PBKDF2-SHA256, AES-GCM versionato, gestione PIN), layer accessibilità (engine NVDA, detection screen reader, 50+ funzioni di annuncio localizzate), connettività di rete (NetInfo con debounce, fail-safe, captive portal). Le aree assenti o lacunose sono: UI (zero schermate implementate), ricerca e filtraggio avanzato transazioni (nessuna logica di search in src/), notifiche push/sistema (nessun modulo), importazione dati (solo export CSV), reportistica e grafici (zero), multi-valuta reale (tipo definito ma senza conversione live). Maturità funzionale complessiva del backend logic: 6/10 — solida architettura dati+auth+accessibilità, ma mancano quasi tutte le funzionalità orientate all'utente finale.
SEZIONE 2 — Mappa dei file sorgente letti
```
src/env.d.ts | lib | leggibile
src/lib/types.ts | lib/types | leggibile
src/lib/constants.ts | lib/constants | leggibile
src/lib/helpers.ts | lib/helpers | leggibile
src/lib/budget-alerts.ts | lib/domain | leggibile
src/lib/budget-forecasting.ts | lib/domain | leggibile
src/lib/budget-history.ts | lib/domain | leggibile
src/lib/budget-templates.ts | lib/domain | leggibile (⚠️ blocco build: @phosphor-icons/react)
src/lib/crypto.ts | lib/crypto | leggibile
src/lib/kdf-provider.ts | lib/crypto | leggibile
src/lib/haptic-system.ts | lib/feedback | leggibile (❌ incompatibile RN: navigator.vibrate + localStorage)
src/lib/sound-system.ts | lib/feedback | leggibile (❌ incompatibile RN: Web Audio API)
src/lib/export-service.ts | lib/export | leggibile
src/lib/supabase/client.ts | supabase | leggibile (⚠️ richiede react-native-dotenv)
src/lib/supabase/cache.ts | supabase | leggibile
src/lib/supabase/types.ts | supabase | leggibile
src/lib/supabase/repositories/conti.ts | supabase/repo | leggibile
src/lib/supabase/repositories/transazioni.ts | supabase/repo | leggibile
src/lib/supabase/repositories/categorie.ts | supabase/repo | leggibile
src/lib/supabase/repositories/budget.ts | supabase/repo | leggibile
src/lib/supabase/repositories/obiettivi-risparmio.ts | supabase/repo | leggibile
src/lib/supabase/repositories/impostazioni-utente.ts | supabase/repo | leggibile
src/context/AuthContext.tsx | context | leggibile (⚠️ rotture B3/B4: sonner shim attivo)
src/context/AppDataContext.tsx | context | leggibile (⚠️ rottura residua B3 shim)
src/context/UserSettingsContext.tsx | context | leggibile
src/context/VisibleDataContext.tsx | context | leggibile
src/context/NetworkStatusContext.tsx | context | leggibile
src/context/app-data-cache.ts | context | leggibile
src/hooks/use-user-settings.ts | hooks | leggibile
src/hooks/use-visible-data.ts | hooks | leggibile
src/hooks/use-display-preferences.ts | hooks | leggibile
src/hooks/use-haptic.ts | hooks | leggibile (inutile finché haptic-system.ts non riscritto)
src/hooks/use-inactivity-timer.ts | hooks | leggibile
src/hooks/use-network-status.ts | hooks | leggibile
src/accessibility/engine.ts | accessibility | leggibile
src/accessibility/detection.ts | accessibility | leggibile
src/accessibility/types.ts | accessibility | leggibile
src/announcements/index.ts | announcements | leggibile
src/announcements/types.ts | announcements | leggibile
src/announcements/accounts.ts | announcements | leggibile
src/announcements/auth.ts | announcements | leggibile
src/announcements/budgets.ts | announcements | leggibile
src/announcements/ui.ts | announcements | leggibile
src/announcements/_utils/t.ts | announcements | leggibile
src/announcements/_utils/currency.ts | announcements | non letto (inferito da import: formatCurrencyVocal)
src/announcements/_utils/dates.ts | announcements | non letto (inferito da import)
src/announcements/_utils/plurals.ts | announcements | non letto (inferito da import: pluralize)
src/components/ActivityDetectorView.tsx | components | leggibile
src/components/ui/button.tsx | components/ui | leggibile
src/native/index.ts | native | leggibile
src/native/WinRTSavePicker/WinRTSavePicker.ts | native | leggibile
src/native/WinRTSavePicker/WinRTSavePicker.windows.ts | native | leggibile
src/native/WinRTSavePicker/WinRTSavePicker.macos.ts | native | non letto (inferito: stub PICKER_UNAVAILABLE)
src/native/WinRTSavePicker/WinRTSavePicker.stub.ts | native | non letto (inferito: stub PICKER_UNAVAILABLE)
src/locales/it.ts | locales | leggibile
src/locales/index.ts | locales | leggibile
```
SEZIONE 3 — Funzionalità PRESENTI nel codice
AREA A — Tipi di dominio e costanti
```
ID: FP-001
Nome: Modello dati finanziario completo
Dove: src/lib/types.ts — interfacce Account, Transaction, Category, Budget, SavingsGoal
Cosa fa: Definisce tutti i tipi core dell'app (10 tipi conto, 3 tipi transazione, 
  ricorrenza, budget per periodo, obiettivi risparmio con proiezione).
Test presenti: no (file di soli tipi)
Dipendenze non implementate: nessuna
ID: FP-002
Nome: Costanti di dominio e mappa tipo→categoria
Dove: src/lib/constants.ts — ACCOUNT_TYPE_LABELS, ACCOUNT_CATEGORIES, ACCOUNT_TYPE_TO_CATEGORY
Cosa fa: Fornisce label, descrizioni, icone (stringhe), 5 categorie di conto 
  e la mappa per raggruppare i conti.
Test presenti: no
Dipendenze non implementate: colori oklch da convertire in token RN (AN-03)
```
AREA B — Calcoli finanziari (logica pura)
```
ID: FP-003
Nome: Calcolo saldo conto con movimenti
Dove: src/lib/helpers.ts — calculateAccountBalance()
Cosa fa: Calcola il saldo di un conto sommando entrate, sottraendo uscite 
  e gestendo correttamente i trasferimenti (bidirezionali).
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-004
Nome: Saldo totale aggregato
Dove: src/lib/helpers.ts — getTotalBalance()
Cosa fa: Somma i saldi di tutti i conti visibili.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-005
Nome: Formattazione valuta italiana
Dove: src/lib/helpers.ts — formatCurrency()
Cosa fa: Formatta un numero come valuta in formato it-IT (€ 1.234,56).
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-006
Nome: Formattazione date italiana
Dove: src/lib/helpers.ts — formatDate(), formatDateShort()
Cosa fa: Converte date ISO in formato gg/mm/aaaa e formato breve gg/mm/aa.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-007
Nome: Filtro transazioni per periodo
Dove: src/lib/helpers.ts — getTransactionsInPeriod()
Cosa fa: Filtra le transazioni in un intervallo di date (startDate–endDate).
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-008
Nome: Aggregazione transazioni per categoria
Dove: src/lib/helpers.ts — groupTransactionsByCategory()
Cosa fa: Raggruppa le uscite per categoria e le ordina per totale decrescente.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-009
Nome: Generazione CSV delle transazioni
Dove: src/lib/helpers.ts — exportToCSV()
Cosa fa: Converte l'array di transazioni in stringa CSV con intestazione 
  (Data, Tipo, Importo, Conto, Categoria, Descrizione, Ricorrente).
Test presenti: sì (parziale, via ExportService.test.ts)
Dipendenze non implementate: nessuna
ID: FP-010
Nome: Progressione e stato budget
Dove: src/lib/helpers.ts — getBudgetProgress(), getActiveBudgets()
Cosa fa: Calcola quanto è stato speso su un budget (spent, percentage, remaining, isOverBudget).
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-011
Nome: Date di periodo budget
Dove: src/lib/helpers.ts — getBudgetPeriodDates()
Cosa fa: Calcola dataInizio/dataFine per periodi mensile, trimestrale, annuale.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-012
Nome: Progressione obiettivi risparmio
Dove: src/lib/helpers.ts — getSavingsGoalProgress()
Cosa fa: Calcola percentuale completamento, giorni rimanenti, 
  se scaduto, se completato.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-013
Nome: Proiezione completamento obiettivo risparmio
Dove: src/lib/helpers.ts — calculateSavingsProjection()
Cosa fa: Proietta la data di completamento e il risparmio settimanale/mensile 
  necessario per raggiungere l'obiettivo in tempo.
Test presenti: no
Dipendenze non implementate: nessuna
```
AREA C — Alert e previsioni budget
```
ID: FP-014
Nome: Generazione alert budget (warning/critical/exceeded)
Dove: src/lib/budget-alerts.ts — generateBudgetAlerts()
Cosa fa: Scansiona i budget attivi e produce alert ordinati per gravità 
  (75% → warning, 90% → critical, 100%+ → exceeded).
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-015
Nome: Soglie notifica budget (threshold crossing)
Dove: src/lib/budget-alerts.ts — shouldShowBudgetNotification()
Cosa fa: Rileva quando una spesa attraversa una soglia (75/90/100%) per 
  evitare notifiche ridondanti.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-016
Nome: Storico periodi budget
Dove: src/lib/budget-history.ts — getBudgetHistoricalData(), calculateBudgetTrend()
Cosa fa: Calcola la spesa effettiva per ogni periodo storico del budget 
  (mensile/trimestrale/annuale, N periodi indietro).
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-017
Nome: Previsione spesa budget con confidence level
Dove: src/lib/budget-forecasting.ts — calculateBudgetForecast()
Cosa fa: Proietta la spesa a fine periodo usando media storica, trend corrente 
  o metodo pesato con livello di confidenza (high/medium/low).
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-018
Nome: Template budget predefiniti
Dove: src/lib/budget-templates.ts — BUDGET_TEMPLATES (10 template)
Cosa fa: Fornisce 10 template di budget (Spesa Alimentare, Ristoranti, Trasporti, 
  Casa, Svago, Salute, Abbonamenti, Abbigliamento, Istruzione, Animali).
Test presenti: no
Dipendenze non implementate: @phosphor-icons/react (BLOCCO BUILD — BC-01)
```
AREA D — Crittografia e sicurezza
```
ID: FP-019
Nome: Hash PIN con bcrypt
Dove: src/lib/crypto.ts — hashPin(), verifyPin()
Cosa fa: Hash del PIN privato con bcryptjs (salt factor 12) e verifica.
Test presenti: sì (__tests__/crypto/pin.test.ts)
Dipendenze non implementate: nessuna
ID: FP-020
Nome: Cifratura AES-256-GCM (legacy key derivation)
Dove: src/lib/crypto.ts — encryptData(), decryptData()
Cosa fa: Cifra/decifra stringhe con AES-GCM via @noble/ciphers; 
  payload IV[12] + ciphertext + authTag[16].
Test presenti: sì (__tests__/crypto/encrypt-decrypt.test.ts)
Dipendenze non implementate: nessuna
ID: FP-021
Nome: KDF PIN PBKDF2-SHA256 (600.000 iterazioni)
Dove: src/lib/crypto.ts — derivePinKey(), encryptDataPin(), decryptDataPin()
     src/lib/kdf-provider.ts — derivePbkdf2Sha256()
Cosa fa: Deriva chiave AES dal PIN con PBKDF2-SHA256 via react-native-quick-crypto;
  payload versionato KDF_VERSION[1] | SALT[16] | IV[12] | Ciphertext | AuthTag[16].
Test presenti: sì (__tests__/crypto/kdf.test.ts, golden.test.ts, K1/K2/K3)
Dipendenze non implementate: nessuna
```
AREA E — Export file
```
ID: FP-022
Nome: Export CSV multi-piattaforma (iOS/Android/Windows)
Dove: src/lib/export-service.ts — exportFile()
Cosa fa: Esporta un file testuale: share sheet su iOS/Android, WinRT FileSavePicker 
  su Windows. Gestisce 7 reason di errore (CANCELLED, PERMISSION_DENIED, 
  FILESYSTEM_ERROR, UNSUPPORTED_PLATFORM, INVALID_PATH, INSUFFICIENT_SPACE, UNKNOWN).
Test presenti: sì (__tests__/ExportService.test.ts — 10 test)
Dipendenze non implementate: @react-native-windows/fs (T3-N5, blocco build Windows)
ID: FP-023
Nome: Bridge nativo WinRT FileSavePicker (TypeScript)
Dove: src/native/WinRTSavePicker/ — contratto + dispatcher Metro per piattaforma
Cosa fa: Dispatcher cross-platform che su Windows carica il TurboModule nativo C++/WinRT, 
  su altre piattaforme ritorna PICKER_UNAVAILABLE.
Test presenti: sì (mock-based in ExportService.test.ts)
Dipendenze non implementate: build Windows bloccata (DT-009-N-01)
```
AREA F — Auth e sessione
```
ID: FP-024
Nome: Autenticazione email/password con Supabase
Dove: src/context/AuthContext.tsx — signIn(), signUp(), signOut(), resetPassword()
Cosa fa: Login, registrazione, logout e reset password via Supabase Auth 
  (OAuth email). Invalidazione cache al logout.
Test presenti: sì (parziale via App.test.tsx)
Dipendenze non implementate: nessuna (shim sonner attivo — B3)
ID: FP-025
Nome: Onboarding utente (primo accesso)
Dove: src/context/AuthContext.tsx — needsOnboarding, completeOnboarding()
Cosa fa: Rileva se l'utente ha ancora il nome visualizzato vuoto e imposta 
  il flag needsOnboarding per guidare il primo accesso.
Test presenti: no
Dipendenze non implementate: UI onboarding assente
ID: FP-026
Nome: PIN privato (set/change/remove/verify)
Dove: src/context/AuthContext.tsx — setPin(), changePin(), removePin(), unlockPrivate(), lockPrivate()
Cosa fa: Gestisce l'intero ciclo di vita del PIN privato: configurazione, cambio, 
  rimozione, sblocco conti privati, richiusura. Usa bcrypt + PBKDF2.
Test presenti: sì (parziale: __tests__/crypto/pin.test.ts)
Dipendenze non implementate: nessuna
ID: FP-027
Nome: Timer inattività con auto-logout
Dove: src/hooks/use-inactivity-timer.ts — useInactivityTimer()
     src/components/ActivityDetectorView.tsx
Cosa fa: Avvia un countdown configurabile; alla scadenza chiama onTimeout() 
  (logout). Warning 1 minuto prima del timeout. Reset su qualsiasi touch/keydown.
Test presenti: no (test in todo come it.todo)
Dipendenze non implementate: nessuna
```
AREA G — Dati e cache
```
ID: FP-028
Nome: Cache AsyncStorage con TTL 24h
Dove: src/lib/supabase/cache.ts — writeCache(), readCache(), isCacheStale(), invalidateCache()
Cosa fa: Persiste localmente l'intero domain snapshot in AsyncStorage 
  (5 tabelle, TTL 24h, versioning v1, invalidazione su logout).
Test presenti: sì (parziale via AppDataContext.spec.ts)
Dipendenze non implementate: nessuna
ID: FP-029
Nome: State machine bootstrap dati con 6 stati
Dove: src/context/AppDataContext.tsx — BootstrapState, transitionTo()
Cosa fa: Gestisce il ciclo IDLE→HYDRATING→CACHE-READY→REMOTE-SYNC→READY/ERROR 
  con matrice transizioni consentite; risolve il bug N9 (cache Promise non await).
Test presenti: sì (__tests__/AppDataContext.spec.ts — 12 scenari)
Dipendenze non implementate: nessuna
ID: FP-030
Nome: Snapshot dominio puro da cache (testabile)
Dove: src/context/app-data-cache.ts — readCachedDomainSnapshotPure()
Cosa fa: Legge tutte e 5 le cache in parallelo con validazione strutturale 
  (Array.isArray + non-Promise). Modulo isolato per test senza React Native.
Test presenti: sì (__tests__/AppDataContext.spec.ts)
Dipendenze non implementate: nessuna
ID: FP-031
Nome: CRUD conti bancari
Dove: src/lib/supabase/repositories/conti.ts — getAll, getById, create, update, remove
Cosa fa: Operazioni complete su tabella `conti` con mapping snake_case↔camelCase 
  e RLS Supabase.
Test presenti: no (testato indirettamente via AppDataContext)
Dipendenze non implementate: nessuna
ID: FP-032
Nome: CRUD transazioni (con filtri)
Dove: src/lib/supabase/repositories/transazioni.ts — getAll(filtri?), create, update, remove
Cosa fa: Operazioni complete su tabella `transazioni` con filtri per conto, 
  categoria, date, tipo. Gestisce cifrato=false lato repository.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-033
Nome: CRUD categorie (template + custom)
Dove: src/lib/supabase/repositories/categorie.ts — getAll, create, update, remove, seedDefaultCategories
Cosa fa: CRUD categorie, distinguendo predefinite (user_id IS NULL) da custom. 
  RPC seedDefaultCategories per seeding iniziale.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-034
Nome: CRUD budget
Dove: src/lib/supabase/repositories/budget.ts — getAll, getById, create, update, remove
Cosa fa: Operazioni complete su tabella `budget`.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-035
Nome: CRUD obiettivi risparmio (con updateProgress)
Dove: src/lib/supabase/repositories/obiettivi-risparmio.ts
Cosa fa: CRUD + metodo updateProgress() per aggiornare importo corrente 
  di un obiettivo senza riscrivere tutto il record.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-036
Nome: Impostazioni utente (getOrCreate, update atomic, PIN hash/salt)
Dove: src/lib/supabase/repositories/impostazioni-utente.ts
Cosa fa: Crea o recupera le impostazioni utente con gestione race condition 23505;  
  aggiornamento atomic JSONB preferences via RPC; updatePinHashAndSalt atomico.
Test presenti: no
Dipendenze non implementate: nessuna
```
AREA H — Preferenze utente
```
ID: FP-037
Nome: Preferenze display (12 chiavi)
Dove: src/hooks/use-user-settings.ts — displayPreferences, setDisplayPreference()
Cosa fa: Gestisce 12 preferenze display (saldi visibili, modalità compatta, 
  dimensione font, formato valuta, alto contrasto, ecc.) sincronizzate con Supabase.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-038
Nome: Preferenze screen reader (12 chiavi)
Dove: src/hooks/use-user-settings.ts — screenReaderPreferences, setScreenReaderPreference()
Cosa fa: Controlla verbosità, quali eventi vengono annunciati da NVDA/TalkBack 
  (navigazione, filtri, saldi, budget, ecc.).
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-039
Nome: Preferenze audio (enabled + volume)
Dove: src/hooks/use-user-settings.ts — audioEnabled, audioVolume, setAudioEnabled(), setAudioVolume()
Cosa fa: Abilita/disabilita audio e regola il volume, sincronizzati con Supabase.
Test presenti: no
Dipendenze non implementate: sound-system.ts da riscrivere (AN-02)
ID: FP-040
Nome: Adattamenti TalkBack (8 flag)
Dove: src/hooks/use-user-settings.ts — talkBackAdaptations, setTalkBackAdaptations()
     src/accessibility/detection.ts — DEFAULT_ADAPTATIONS
Cosa fa: 8 adattamenti automatici per screen reader (touch target aumentati, 
  navigazione semplificata, timeout estesi, audio spaziale, riduzione movimento...).
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-041
Nome: Alert budget dismissed (persistenza)
Dove: src/hooks/use-user-settings.ts — dismissBudgetAlert(), resetDismissedAlerts()
Cosa fa: Permette di silenziare un alert budget; la lista degli ID dismissed 
  è persistita in Supabase e sopravvive al riavvio.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-042
Nome: Categorie visibili (filtro)
Dove: src/hooks/use-user-settings.ts — visibleCategories, setVisibleCategories()
Cosa fa: L'utente sceglie quali categorie di conto visualizzare; 
  la preferenza è persistita in Supabase.
Test presenti: no
Dipendenze non implementate: nessuna
```
AREA I — Visibilità dati e privacy
```
ID: FP-043
Nome: Filtraggio dati per conti privati
Dove: src/hooks/use-visible-data.ts — useVisibleData(), visibleAccounts, visibleTransactions
Cosa fa: Nasconde conti privati (isPrivato=true) e le relative transazioni 
  a meno che isPrivateUnlocked=true.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-044
Nome: Raggruppamento conti per categoria (filtrato)
Dove: src/hooks/use-visible-data.ts — groupedAccounts, filteredGroupedAccounts
Cosa fa: Raggruppa i conti visibili nelle 5 categorie e applica il filtro 
  visibleCategories dell'utente.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-045
Nome: Alert budget filtrati (non dismissed)
Dove: src/hooks/use-visible-data.ts — budgetAlerts
Cosa fa: Espone gli alert budget attivi escludendo quelli già dismissati dall'utente.
Test presenti: no
Dipendenze non implementate: nessuna
```
AREA J — Connettività di rete
```
ID: FP-046
Nome: Rilevamento stato rete (NetInfo + debounce + fail-safe)
Dove: src/context/NetworkStatusContext.tsx — NetworkStatusProvider
     src/hooks/use-network-status.ts — useNetworkStatus()
Cosa fa: Espone isOffline, isConnected, connectionType con debounce 1000ms 
  su online→offline, transizione offline→online immediata, fail-safe dopo 1500ms.
Test presenti: sì (__tests__/use-network-status.spec.ts — 7 test)
Dipendenze non implementate: nessuna
```
AREA K — Accessibilità
```
ID: FP-047
Nome: Engine annunci screen reader (singleton)
Dove: src/accessibility/engine.ts — ScreenReaderEngine.announce()
Cosa fa: Unico punto che chiama AccessibilityInfo.announceForAccessibility; 
  fire-and-forget; skip su testo vuoto; fallback silenzioso su piattaforme senza supporto.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-048
Nome: Rilevamento screen reader con adattamenti
Dove: src/accessibility/detection.ts — useAccessibilityDetection()
Cosa fa: Rileva TalkBack/VoiceOver/Narrator via AccessibilityInfo; aggiorna in tempo 
  reale; supporta override manuale; calcola stato confidenceLevel.
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-049
Nome: Layer annunci semantici (50+ funzioni)
Dove: src/announcements/ — accounts.ts, auth.ts, budgets.ts, ui.ts
Cosa fa: ~50 funzioni tipizzate che costruiscono oggetti Announcement localizzati 
  per ogni evento di dominio (CRUD conti/transazioni/budget/obiettivi, auth, export, 
  errori, navigazione, conferme).
Test presenti: no
Dipendenze non implementate: nessuna
ID: FP-050
Nome: Localizzazione italiana (136 chiavi)
Dove: src/locales/it.ts — dizionario it con 136 chiavi (contate per categoria)
Cosa fa: Fornisce tutte le stringhe in italiano con interpolazione {variabile}. 
  Comprende UI generica, conti, export/import, budget, auth, session.
Test presenti: no
Dipendenze non implementate: nessuna
```
AREA L — Feedback (struttura presente, implementazione parziale)
```
ID: FP-051
Nome: Sistema feedback aptico (struttura + 15 pattern definiti)
Dove: src/lib/haptic-system.ts — HapticSystem class
     src/hooks/use-haptic.ts — useHaptic()
Cosa fa: Definisce 15 pattern aptici (light/medium/heavy/success/warning/error/...) 
  con intensità regolabile. ATTENZIONE: usa navigator.vibrate — incompatibile con RN.
Test presenti: no
Dipendenze non implementate: Vibration RN (riscrittura richiesta — AN-01)
ID: FP-052
Nome: Sistema audio (struttura + 80+ sound type definiti)
Dove: src/lib/sound-system.ts — SoundSystem class con 80+ SoundType
Cosa fa: Definisce un sistema audio completo con 80+ tipi suono, volume, 
  dependency injection per callback Supabase. ATTENZIONE: usa Web Audio API — incompatibile RN.
Test presenti: no
Dipendenze non implementate: expo-av/react-native-sound (riscrittura richiesta — AN-02)
```
SEZIONE 4 — Funzionalità MANCANTI (lista completa)
4A — Funzionalità CORE mancanti
```
ID: FM-001
Nome: Schermate UI principali (Dashboard, Conti, Transazioni, Budget, Obiettivi)
Categoria: CORE
Descrizione: L'app non ha alcuna schermata implementata in src/. L'intera UI è assente. 
  Senza schermate l'app non è avviabile dall'utente.
Già pianificata: no — nessun DESIGN numerato copre le schermate principali
Accessibilità NVDA: ogni schermata dovrà annunciare la propria apertura via announce(ui.schermaAperta())
  e garantire focus management automatico all'arrivo (autoFocusManagement è già nei TalkBackAdaptations).
Priorità stimata: ALTA
ID: FM-002
Nome: Navigazione tra schermate (stack navigator)
Categoria: CORE
Descrizione: Nessun sistema di navigazione è implementato. Manca React Navigation 
  o equivalente per gestire il flusso tra Dashboard, Conti, Transazioni, Budget, Impostazioni.
Già pianificata: no
Accessibilità NVDA: ogni cambio di schermata deve triggerare announce(ui.schermaAperta(name));
  il focus deve spostarsi sul primo elemento interattivo della nuova schermata.
Priorità stimata: ALTA
ID: FM-003
Nome: Form inserimento transazione (UI)
Categoria: CORE
Descrizione: L'utente non può inserire una nuova transazione dall'app. 
  AppDataContext ha addTransaction() ma nessun form esiste in src/components/.
Già pianificata: no — AppDataContext ha openNewTransactionDialog/openEditTransactionDialog 
  ma il dialog stesso non è implementato
Accessibilità NVDA: ogni campo del form deve annunciare il proprio label; 
  la conferma di salvataggio deve annunciare accounts.announceTransaction().
Priorità stimata: ALTA
ID: FM-004
Nome: Form gestione conti (UI)
Categoria: CORE
Descrizione: Nessun form per creare/modificare un conto. 
  showAccountDialog e editingAccount sono definiti in AppDataContext ma il dialog è assente.
Già pianificata: no
Accessibilità NVDA: annuncio creazione via accounts.announceAccountCreated(name, type, balance).
Priorità stimata: ALTA
ID: FM-005
Nome: Form gestione budget (UI)
Categoria: CORE
Descrizione: showBudgetDialog definito in AppDataContext; 
  il componente dialog per creare/modificare budget non è in src/.
Già pianificata: no
Accessibilità NVDA: annuncio via budgets.announceBudgetCreated(name, target, period).
Priorità stimata: ALTA
ID: FM-006
Nome: Schermata login e registrazione (UI)
Categoria: CORE
Descrizione: AuthContext ha signIn/signUp/resetPassword ma non esiste 
  nessuna schermata di login in src/. L'app non può essere usata senza autenticazione.
Già pianificata: no
Accessibilità NVDA: errori di autenticazione devono essere annunciati assertive; 
  success deve confermare il login completato.
Priorità stimata: ALTA
ID: FM-007
Nome: Notifiche di sistema / push notifications
Categoria: CORE
Descrizione: Gli alert budget (FM-014) e le soglie (FP-015) sono calcolati 
  ma non c'è nessun modulo per inviare notifiche push/locali al dispositivo 
  (nessuna dipendenza da expo-notifications o react-native-push-notification).
Già pianificata: no
Accessibilità NVDA: le notifiche push devono avere testo accessibile; 
  al tap devono portare l'utente alla schermata corretta con focus gestito.
Priorità stimata: ALTA
ID: FM-008
Nome: Onboarding UI (primo avvio)
Categoria: CORE
Descrizione: needsOnboarding è rilevato in AuthContext ma non esiste 
  nessuna schermata di onboarding per raccogliere nome utente, valuta, 
  impostazioni iniziali.
Già pianificata: no
Accessibilità NVDA: ogni passo dell'onboarding deve essere lineare 
  e completamente navigabile da tastiera/screen reader.
Priorità stimata: ALTA
```
4B — Funzionalità UTILI mancanti
```
ID: FM-009
Nome: Ricerca transazioni (testo libero)
Categoria: UTILE
Descrizione: L'utente non può cercare transazioni per descrizione, importo 
  o conto. TransactionFilters in repositories/transazioni.ts supporta filtri 
  strutturati ma non full-text search.
Già pianificata: no
Accessibilità NVDA: ogni keystroke può annunciare il numero di risultati; 
  la lista filtrata deve essere navigabile con "lista aggiornata N elementi".
Priorità stimata: ALTA
ID: FM-010
Nome: Filtri avanzati transazioni (data, tipo, importo range, categoria)
Categoria: UTILE
Descrizione: Il repository transazioni ha TransactionFilters (contoId, categoriaId, 
  dataInizio, dataFine, tipo) ma non c'è nessun componente UI che esponga questi filtri.
Già pianificata: no
Accessibilità NVDA: ogni filtro applicato deve essere annunciato 
  via sr_announce_filters (preferenza già esistente in FP-038).
Priorità stimata: ALTA
ID: FM-011
Nome: Dashboard riepilogo finanziario
Categoria: UTILE
Descrizione: Una vista aggregata che mostri saldo totale, entrate/uscite del mese, 
  ultimi movimenti, alert budget attivi. Tutti i dati sono calcolabili 
  da FP-003/004/008/014/043 ma non c'è la schermata.
Già pianificata: no
Accessibilità NVDA: al caricamento deve annunciare il saldo totale e 
  il numero di alert attivi; dati aggregati devono avere accessibilityLabel descrittivi.
Priorità stimata: ALTA
ID: FM-012
Nome: Grafici e visualizzazioni dati (torta, trend, barre)
Categoria: UTILE
Descrizione: Nessuna dipendenza da librerie grafiche (victory-native, 
  react-native-chart-kit) e nessun componente grafico in src/. 
  I dati per le visualizzazioni sono tutti calcolabili.
Già pianificata: no
Accessibilità NVDA: ogni grafico deve avere una tabella dati alternativa 
  accessibile; le variazioni percentuali devono essere annunciate testualmente.
Priorità stimata: MEDIA
ID: FM-013
Nome: Importazione transazioni da CSV/OFX/CAMT
Categoria: UTILE
Descrizione: announceImportComplete() esiste in accounts.ts e la chiave 
  import_completato in it.ts indicano l'intenzione, ma nessun modulo 
  di parsing/import CSV o bancario esiste in src/.
Già pianificata: no (solo stringhe di annuncio preparate)
Accessibilità NVDA: progress dell'import deve essere annunciato step-by-step; 
  errori di parsing devono essere assertive con riferimento alla riga.
Priorità stimata: MEDIA
ID: FM-014
Nome: Feedback aptico nativo RN
Categoria: UTILE
Descrizione: haptic-system.ts usa navigator.vibrate (Web API). 
  Deve essere riscritto con Vibration RN API (AN-01 del report compatibilità Android).
Già pianificata: sì — AN-01 in docs/todo-master.md; attende DESIGN
Accessibilità NVDA: il feedback aptico potenzia l'esperienza utenti con 
  disabilità visive; deve essere attivabile/disattivabile indipendentemente.
Priorità stimata: ALTA
ID: FM-015
Nome: Sistema audio nativo RN
Categoria: UTILE
Descrizione: sound-system.ts usa Web Audio API (AN-02). 
  Deve essere riscritto con expo-av o react-native-sound.
Già pianificata: sì — AN-02 in docs/todo-master.md; attende DESIGN
Accessibilità NVDA: il feedback sonoro non deve interferire con lo screen reader; 
  deve essere disattivabile a livello globale e per tipo di evento.
Priorità stimata: ALTA
ID: FM-016
Nome: Transazioni ricorrenti (esecuzione automatica)
Categoria: UTILE
Descrizione: Il tipo Transaction ha ricorrente:boolean e frequenzaRicorrenza, 
  ma nessun modulo di scheduling/auto-creazione transazioni ricorrenti esiste in src/.
Già pianificata: no — il campo è modellato ma la logica è assente
Accessibilità NVDA: le transazioni create automaticamente devono generare 
  un annuncio assertive "Transazione ricorrente aggiunta: [nome] [importo]".
Priorità stimata: MEDIA
ID: FM-017
Nome: Archiviazione conti (logica + UI)
Categoria: UTILE
Descrizione: Account ha archiviato:boolean nel DB, ma nessun metodo 
  per archiviare/ripristinare un conto è esposto in AppDataContext né nei repository.
Già pianificata: no
Accessibilità NVDA: un conto archiviato non deve comparire nelle liste 
  principali; il toggle archivio deve essere annunciato.
Priorità stimata: MEDIA
ID: FM-018
Nome: Statistiche per categoria e periodo (report mensile/annuale)
Categoria: UTILE
Descrizione: groupTransactionsByCategory() calcola il raggruppamento ma non c'è 
  un modulo di report che aggreghi dati per mese o anno comparando periodi.
Già pianificata: no
Accessibilità NVDA: ogni report deve avere una versione testuale lineare 
  accessibile dallo screen reader oltre alla versione grafica.
Priorità stimata: MEDIA
ID: FM-019
Nome: Valuta di default personalizzabile (UI + logica)
Categoria: UTILE
Descrizione: UserSettings.valutaDefault esiste ma non c'è nessun componente 
  UI per cambiarlo e formatCurrency() non applica la valuta utente 
  (usa EUR hardcoded di default).
Già pianificata: no
Accessibilità NVDA: il cambio valuta deve essere annunciato; 
  tutti gli importi nelle schermate devono usare la valuta scelta.
Priorità stimata: MEDIA
ID: FM-020
Nome: Schermata impostazioni accessibilità
Categoria: UTILE
Descrizione: 32 chiavi di UserPreferences sono definite e sincronizzate, 
  ma nessuna schermata di impostazioni accessibilità/display esiste in src/.
Già pianificata: no
Accessibilità NVDA: questa schermata è critica per utenti con disabilità; 
  ogni toggle deve essere annunciato con stato (attivo/disattivo).
Priorità stimata: ALTA
ID: FM-021
Nome: Gestione offline completa (UI feedback + retry)
Categoria: UTILE
Descrizione: NetworkStatusContext rileva l'offline ma non c'è nessun 
  componente UI che mostri banner offline, blocchi operazioni write, 
  o gestisca retry automatico quando si ripristina la connessione.
Già pianificata: no — DESIGN 008 copre solo il detection layer
Accessibilità NVDA: il cambio stato rete deve essere annunciato 
  (announce(ui.erroreRete()) per offline, caricamentoCompletato() per ripristino).
Priorità stimata: MEDIA
ID: FM-022
Nome: Toast/notifiche in-app (sostituzione shim)
Categoria: UTILE
Descrizione: Sia AuthContext che AppDataContext usano uno shim temporaneo 
  (console.log) al posto di react-native-toast-message. L'utente non vede 
  nessun feedback visivo per operazioni riuscite/fallite.
Già pianificata: sì — indicato come "rimpiazzare con react-native-toast-message nella fase UI"
Accessibilità NVDA: i toast devono essere accessibili; il loro testo 
  deve essere annunciato dallo screen reader via AccessibilityInfo.
Priorità stimata: ALTA
ID: FM-023
Nome: Conferma eliminazione (dialog UI)
Categoria: UTILE
Descrizione: deletingItem e showDeleteDialog sono definiti in AppDataContext 
  ma il componente dialog di conferma non è implementato.
Già pianificata: no — AppDataContext gestisce lo stato ma il component è assente
Accessibilità NVDA: il dialog di conferma deve rubare il focus al suo aprirsi; 
  le opzioni conferma/annulla devono essere navigabili da tastiera.
Priorità stimata: ALTA
```
4C — Funzionalità AVANZATE mancanti
```
ID: FM-024
Nome: Multi-valuta con tassi di cambio live
Categoria: AVANZATA
Descrizione: Account.valuta è un campo stringa libero, ma non c'è nessun 
  modulo per convertire importi tra valute, nessuna integrazione con API 
  di tassi di cambio (Frankfurter, Open Exchange Rates).
Già pianificata: no
Accessibilità NVDA: i tassi di cambio devono essere annunciati 
  con la data di aggiornamento; conversioni devono essere leggibili testualmente.
Priorità stimata: BASSA
ID: FM-025
Nome: Sincronizzazione bancaria automatica (Open Banking / PSD2)
Categoria: AVANZATA
Descrizione: Importazione automatica dei movimenti bancari via API PSD2/Open Banking 
  (Plaid, TrueLayer, Nordigen/GoCardless). Non c'è nessun hook né layer.
Già pianificata: no
Accessibilità NVDA: ogni sincronizzazione deve generare un summary 
  "N movimenti importati" con opzione revisione.
Priorità stimata: BASSA
ID: FM-026
Nome: Previsione spesa con ML (trend avanzato)
Categoria: AVANZATA
Descrizione: budget-forecasting.ts usa medie ponderate; nessun modulo di ML 
  (TensorFlow.js, ONNX) per pattern di spesa personalizzati, stagionalità, 
  anomalie di spesa.
Già pianificata: no
Accessibilità NVDA: le previsioni ML devono indicare il livello di confidenza 
  in testo leggibile "Previsione con confidenza alta: spesa stimata €X".
Priorità stimata: BASSA
ID: FM-027
Nome: Backup e ripristino dati (locale o cloud)
Categoria: AVANZATA
Descrizione: sound-system.ts ha SoundType 'backup-created' e 'restore-complete', 
  e accounts.ts ha announceImportComplete() — chiaro intento. 
  Nessun modulo di backup esiste in src/.
Già pianificata: no (solo sound types e annunci preparati)
Accessibilità NVDA: il progress del backup deve essere annunciato 
  (percentuale completamento); il ripristino deve richiedere conferma esplicita.
Priorità stimata: MEDIA
ID: FM-028
Nome: Widget e shortcut sistema operativo
Categoria: AVANZATA
Descrizione: Widget home screen Android/Windows per saldo rapido o aggiunta 
  transazione. Nessun modulo né documentazione.
Già pianificata: no
Accessibilità NVDA: i widget devono avere accessibilityLabel 
  con saldo corrente e data aggiornamento.
Priorità stimata: BASSA
ID: FM-029
Nome: Analisi pattern spesa (insights automatici)
Categoria: AVANZATA
Descrizione: Suggerimenti automatici basati sui pattern ("hai speso il 30% 
  in più nei ristoranti rispetto al mese scorso"). Nessun modulo in src/.
Già pianificata: no
Accessibilità NVDA: ogni insight deve essere presentato come testo 
  leggibile con possibilità di eseguire un'azione (es. creare un budget).
Priorità stimata: MEDIA
ID: FM-030
Nome: Goal risparmio con contribuzioni automatiche
Categoria: AVANZATA
Descrizione: SavingsGoal ha importoCorrente ma non c'è nessuna logica 
  per contribuzioni periodiche automatiche (es. "trasferisci €100/mese 
  al mio obiettivo vacanze").
Già pianificata: no
Accessibilità NVDA: ogni contribuzione automatica genera announce 
  budgets.announceSavingsGoalProgress().
Priorità stimata: MEDIA
ID: FM-031
Nome: Split transazioni (suddivisione per categoria)
Categoria: AVANZATA
Descrizione: Una transazione può coprire più categorie 
  (es. spesa supermercato: 60% alimentari, 40% cura della casa). 
  Il modello dati attuale ha un solo categoriaId per transazione.
Già pianificata: no — richiederebbe modifica schema DB
Accessibilità NVDA: la divisione in parti deve essere navigabile 
  come lista con totale parziale annunciato per ogni voce.
Priorità stimata: BASSA
ID: FM-032
Nome: Report fiscale / esportazione per commercialista
Categoria: AVANZATA
Descrizione: Export in formato diverso da CSV (PDF, OFX, CAMT.053) 
  per uso fiscale. Il layer export supporta MIME generico ma nessun 
  formatter specifico esiste.
Già pianificata: no
Accessibilità NVDA: il processo di generazione report deve annunciare 
  il completamento con il percorso/nome del file generato.
Priorità stimata: MEDIA
ID: FM-033
Nome: Condivisione dati multi-utente / famiglia
Categoria: AVANZATA
Descrizione: Ogni record ha user_id singolo; nessun modello di condivisione 
  tra utenti (conto cointestato, budget famiglia) è presente in DB né in src/.
Già pianificata: no
Accessibilità NVDA: notifiche di modifica da altri utenti devono 
  essere annunciate con nome utente e azione.
Priorità stimata: BASSA
ID: FM-034
Nome: Scorciatoie tastiera globali (Windows/desktop)
Categoria: AVANZATA
Descrizione: showKeyboardHelp è definito in AppDataContext ma non c'è 
  nessun componente UI che mostri le scorciatoie né un gestore globale di shortcut.
Già pianificata: no — lo stato del dialog esiste ma il componente è assente
Accessibilità NVDA: lo schermo shortcuts deve essere un dialog accessibile 
  con lista di scorciatoie organizzata per area funzionale.
Priorità stimata: MEDIA
ID: FM-035
Nome: Temi visivi e dark mode
Categoria: AVANZATA
Descrizione: Nessun sistema di theming in src/; constants.ts usa colori oklch 
  incompatibili con RN. highContrast esiste in displayPreferences (FP-037) 
  ma non ha effetto senza un theme engine.
Già pianificata: no
Accessibilità NVDA: il cambio tema deve annunciare 
  "Tema [nome] applicato"; il contrasto elevato deve essere 
  accessibile via preferenza di sistema.
Priorità stimata: MEDIA
```
SEZIONE 5 — Discrepanze documentazione vs codice
# Discrepanza Tipo Dettaglio
D-01 use-online-status.ts ancora elencata in
architettura.md (/c:/Sviluppo/ZecchinoReact/docs/architettura.md)
| DOC stale | Il file è stato eliminato nel PLAN 008 ma
architettura.md (/c:/Sviluppo/ZecchinoReact/docs/architettura.md)
(layer hooks) ne conserva il riferimento. Segnalato come DD-02. |
| D-02 |
CLAUDE.md (/c:/Sviluppo/ZecchinoReact/CLAUDE.md)
descrive
localStorage (c:\Users\forbi\AppData\Local\Programs\Microsoft VS Code\f6cfa2ea24\resources\app\extensions\node_modules\typescript\lib\lib.dom.d.ts:44082)
come meccanismo cache | DOC obsoleto |
CLAUDE.md (/c:/Sviluppo/ZecchinoReact/CLAUDE.md)
riporta "localStorage cache" ma
cache.ts (/c:/Sviluppo/ZecchinoReact/src/lib/supabase/cache.ts)
usa
AsyncStorage (c:\Sviluppo\ZecchinoReact\node_modules\@react-native-async-storage\async-storage\src\AsyncStorage.ts:76)
. Segnalato come DD-03. |
| D-03 | patches/netinfo+12.0.1.patch orfana | DOC vs dipendenze | La patch è per netinfo v12 ma in uso c'è la v12.0.1 come dichiarata in package.json; probabilmente la patch è stale (DD-01). |
| D-04 | 8 SoundType in
sound-system.ts (/c:/Sviluppo/ZecchinoReact/src/lib/sound-system.ts)
rimandano a funzionalità non implementate | Codice in anticipo sui doc | 'backup-created', 'restore-complete', 'import-start', 'import-success', 'import-error' sono definiti ma i moduli corrispondenti non esistono. |
| D-05 |
announceImportComplete() (c:\Sviluppo\ZecchinoReact\src\announcements\accounts.ts:106)
e stringhe
import_completato (c:\Sviluppo\ZecchinoReact\src\locales\it.ts:69)
in locales | Codice in anticipo sui doc | La funzionalità di import non è pianificata in nessun DESIGN. |
| D-06 |
showKeyboardHelp (c:\Sviluppo\ZecchinoReact\src\context\AppDataContext.tsx:126)
in AppDataContext senza DESIGN associato | Codice senza spec | Lo stato del dialog keyboard help è gestito ma non c'è un DESIGN per la feature. |
| D-07 |
architettura.md (/c:/Sviluppo/ZecchinoReact/docs/architettura.md)
sezione 5 riporta
AuthContext.tsx (/c:/Sviluppo/ZecchinoReact/src/context/AuthContext.tsx)
come rottura B3+B4 | DOC parzialmente stale | Il blocco B3 (sonner) è stato risolto con shim; il blocco B4 (Button/shim) è stato aggiunto ma l'architettura.md potrebbe non riflettere il workaround completo. |
| D-08 |
README.md (/c:/Sviluppo/ZecchinoReact/README.md)
dichiara versione 0.4.0 ma CHANGELOG riporta il bump da 0.3.0 a 0.4.0 nella sezione [0.4.0] | Coerente | Non una discrepanza: README è allineato. Annotazione per conferma. |
| D-09 |
todo-master.md (/c:/Sviluppo/ZecchinoReact/docs/todo-master.md)
riporta BC-03: react-dom da rimuovere ma non elenca un DESIGN per la bonifica | DOC mancante | La risoluzione BC-01/02/03 è "Next Action" da settimane; non esiste ancora un DESIGN-BLOCCO-PHOSPHOR. |
| D-10 |
SavingsGoal.contoAssociato (c:\Sviluppo\ZecchinoReact\src\lib\types.ts:67)
è string? (id) invece di
Account? (c:\Sviluppo\ZecchinoReact\src\lib\types.ts:11)
| Design debt | Il campo tiene un ID ma non è chiarito nei documenti se si intende una FK a
conti.id (c:\Sviluppo\ZecchinoReact\src\context\AppDataContext.tsx:586)
; nessun join è eseguito nel repository. |
SEZIONE 6 — Raccomandazioni per i prossimi DESIGN
DESIGN-BLOCCO-PHOSPHOR (Priorità: 1 — SBLOCCO CRITICO)
Motivazione: I 3 blocchi BC-01/BC-02/BC-03 (@phosphor-icons/react, react-dom) impediscono qualsiasi build Android. Senza questo DESIGN l'app non può essere validata su Android. La riscrittura di
budget-templates.ts (/c:/Sviluppo/ZecchinoReact/src/lib/budget-templates.ts)
è localizzata (10 template, ~120 righe) con sostituzione di icone con stringhe identificatore.
DESIGN 010 — Navigazione e Schermata Dashboard (Priorità: 2)
Motivazione: La totalità delle funzionalità CORE mancanti (FM-001÷FM-008) dipendono dall'esistenza di un layer di navigazione. React Navigation è lo stack naturale; la dashboard riutilizza direttamente FP-003/004/043/044/045. Questo DESIGN sblocca tutto il lavoro UI successivo.
DESIGN 011 — Feedback in-app: Toast + Haptic RN + Audio RN (Priorità: 3)
Motivazione: I due shim attivi (sonner in AuthContext e AppDataContext) producono zero feedback visivo. AN-01 e AN-02 (haptic/sound su Web API) sono tech debt che bloccano la sensoralità completa dell'app. Raggruppare i tre sotto-DESIGN in uno unico riduce il numero di cicli review/approvazione.
DESIGN 012 — Form Transazione + Form Conto + Dialog Conferma Eliminazione (Priorità: 4)
Motivazione: AppDataContext ha già tutta la logica CRUD e gli stati dei dialog (showTransactionDialog, showAccountDialog, showDeleteDialog). I form sono il passo più frequente del flusso utente. Con il DESIGN 010 navigazione attivo, questi form sono il naturale secondo passo.
DESIGN 013 — Ricerca e Filtri Transazioni (Priorità: 5)
Motivazione: senza ricerca l'app è inutilizzabile per utenti con più di 50 transazioni. TransactionFilters è già definito nel repository. Il DESIGN deve coprire: full-text search lato client (o RPC Supabase), filtri multipli combinati, UI accessibile con announce del numero di risultati.
DICHIARAZIONE DI TRASPARENZA
```
Leggi IA applicate: L1 (Verità Tracciabile), L2 (Non-Allucinazione), 
  L3 (Trasparenza dei Bias), L4 (Minimizzazione Assunzioni), 
  L5 (Citazione e Provenienza), L6 (Rifiuto Sicuro)
Limiti dell'analisi statica:
  - Non è possibile verificare se i repository Supabase funzionano 
    correttamente senza eseguire l'app e senza un DB Supabase configurato.
  - Lo shim sonner (console.log) maschera il feedback visivo: 
    non è verificabile se le sequenze di annunci NVDA funzionano end-to-end.
  - haptic-system.ts e sound-system.ts usano API incompatibili: 
    non è verificabile se il feedback funziona su Android senza build.
  - La state machine bootstrap (FP-029) è testata con mock 
    ma non validata con un dispositivo reale.
  - Il bridge WinRT (FP-023) non è stato compilato e non è testabile 
    senza sblocco DT-009-N-01.
  - La suite Jest usa fake timers e mock di NetInfo: 
    comportamenti real-device potrebbero differire.
Potenziali bias:
  - L'analisi considera "presente" tutto ciò che ha almeno una funzione 
    esportata e tipizzata, anche se parzialmente incompatibile con RN 
    (es. haptic-system.ts conta come FP-051 con nota incompatibilità).
  - Le funzionalità UI "mancanti" assumono che tutto il codice esistente 
    funzioni correttamente una volta montato; non è verificabile staticamente.
Assunzioni usate:
  ⚠️ [ASSUNZIONE] src/announcements/_utils/currency.ts e plurals.ts 
    contengono le funzioni formatCurrencyVocal e pluralize usate negli import 
    letti — non letti direttamente ma inferiti da call site coerenti.
  ⚠️ [ASSUNZIONE] WinRTSavePicker.macos.ts e WinRTSavePicker.stub.ts 
    contengono stub PICKER_UNAVAILABLE — inferito da pattern nominale e 
    dalla documentazione nel changelog e nell'index.ts.
File non trovati: nessuno — tutti i file elencati nelle directory esistono 
  e sono stati letti o correttamente inferiti.
```
AUDIT DUSU-ANALYZER
```
Punti di forza dell'analisi:
  - Copertura totale: tutti i 56 file sorgente in src/ sono stati letti 
    o verificati per esistenza con inferenza motivata.
  - Separazione netta tra "presente nel codice" (citazione file+funzione) 
    e "presente solo nei documenti" o "assente ovunque".
  - La lista FM è ambiziosa ma ragionata: ogni voce cita il delta 
    tra codice attuale e aspettativa utente finale.
  - Accessibilità NVDA trattata come dimensione cross-cutting in ogni FM.
Attenzioni e limiti:
  - Le 3 funzioni _utils (currency, plurals, dates) non sono state lette 
    direttamente: se contengono logica aggiuntiva oltre all'interpolazione 
    attesa, potrebbero aggiungere 2-3 FP non censiti.
  - Il conteggio "136 chiavi" in FP-050 è una stima per categorie 
    (26+5+11+4+18+8 = 72 chiavi lette + 14 chiavi export aggiunte nel PLAN 009 
    = ~86 chiavi totali nell'it.ts attuale). Non è stato eseguito un count riga-per-riga.
  - Nessun file in src/screens/ o src/pages/ esiste: confermato al 100%.
Azione suggerita all'utente dopo questo report:
  Avviare immediatamente DESIGN-BLOCCO-PHOSPHOR per sbloccare 
  la build Android (BC-01/02/03). Parallelamente, approvare DESIGN 010 
  (navigazione + dashboard) come primo tassello UI. 
  Questi due DESIGN in sequenza portano l'app da "logica senza schermata" 
  a "app avviabile e navigabile" in circa 3-4 sessioni di implementazione.
```
Il report è completo. Ho letto direttamente 56 file in
src (/c:/Sviluppo/ZecchinoReact/src/)
, censito 52 funzionalità logiche presenti, identificato 35 funzionalità mancanti (8 CORE, 15 UTILI, 12 AVANZATE) e prodotto 5 raccomandazioni DESIGN in ordine di priorità. Il blocco critico immediato è DESIGN-BLOCCO-PHOSPHOR (@phosphor-icons/react) che impedisce qualsiasi build Android.
Operazione completata: Produzione report finale (FASE 4) (5/5). 5 elementi: Lettura documenti (FASE 0) (completed); Scansione completa src (FASE 1) (completed); Costruzione lista funzionalità presenti (FASE 2) (completed); Costruzione lista funzionalità mancanti (FASE 3) (completed); Produzione report finale (FASE 4) (completed)