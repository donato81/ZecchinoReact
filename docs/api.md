# API Reference — ZecchinoReact

> Aggiornato al: 2026-05-13  
> Branch: main  
> Copertura: tutti i file pubblici in `src/` presenti nel branch corrente.

## Legenda compatibilità

| Simbolo | Significato |
|---------|-------------|
| ✅ | Compatibile React Native senza modifiche |
| ⚠️ | Richiede refactoring parziale (sostituzione API browser) |
| ❌ | Incompatibile — va riscritto o rimosso per RN |

---

## `src/lib/types.ts` ✅

Tipi di dominio client-side. Nessuna dipendenza esterna.

### Tipi esportati

| Nome | Tipo | Descrizione |
|------|------|-------------|
| `AccountType` | `type` | Unione: `'bancario' \| 'prepagata' \| 'contanti' \| 'salvadanaio' \| 'privato' \| 'investimenti' \| 'credito' \| 'paypal' \| 'crypto' \| 'pensione'` |
| `TransactionType` | `type` | `'entrata' \| 'uscita' \| 'trasferimento'` |
| `RecurrenceFrequency` | `type` | `'giornaliero' \| 'settimanale' \| 'mensile' \| 'annuale'` |
| `CategoryType` | `type` | `'entrata' \| 'uscita'` |
| `BudgetPeriod` | `type` | `'mensile' \| 'trimestrale' \| 'annuale'` |
| `Account` | `interface` | Conto finanziario: `id`, `nome`, `tipo`, `saldoIniziale`, `valuta`, `isPrivato`, `dataCreazione`, `archiviato` |
| `Transaction` | `interface` | Transazione: `id`, `data`, `importo`, `tipo`, `contoId`, `contoDestinazioneId?`, `categoriaId`, `descrizione`, `ricorrente`, `frequenzaRicorrenza?`, `cifrato` |
| `TransactionInput` | `type` | `Omit<Transaction, 'id' \| 'cifrato'> & { id?: string }` — input per create/update |
| `Category` | `interface` | Categoria: `id`, `nome`, `tipo`, `predefinita` |
| `Budget` | `interface` | Budget: `id`, `nome`, `importoTarget`, `periodo`, `categoriaId?`, `contoId?`, `dataInizio`, `dataFine`, `attivo` |
| `SavingsGoal` | `interface` | Obiettivo risparmio: `id`, `nome`, `descrizione`, `importoTarget`, `importoCorrente`, `dataInizio`, `dataScadenza?`, `contoAssociato?`, `colore`, `icona`, `completato`, `dataCompletamento?` |
| `AccountGroup` | `type` | `{ id, label, accounts: Account[] }` |
| `FullAccountGroup` | `type` | `AccountCategoryInfo & { accounts: Account[] }` |
| `AppState` | `interface` | Snapshot globale dell'app (auth + dati di dominio) |

---

## `src/lib/constants.ts` ✅

Costanti di dominio. Dipendenza interna: `./types`.

> **Nota migrazione**: `badgeVariant` e `color` in `AccountCategoryInfo` usano notazione oklch (CSS) — da sostituire con token colore RN prima di usarli in componenti nativi.

### Tipi esportati

| Nome | Tipo | Descrizione |
|------|------|-------------|
| `AccountCategory` | `type` | `'banking' \| 'digital' \| 'savings' \| 'investments' \| 'private'` |
| `AccountCategoryInfo` | `interface` | Metadati di una categoria: `id`, `label`, `description`, `types`, `color`, `badgeVariant` |

### Costanti esportate

| Nome | Tipo | Descrizione | RN |
|------|------|-------------|-----|
| `ACCOUNT_TYPE_LABELS` | `Record<string, string>` | Etichette per tipo conto | ✅ |
| `ACCOUNT_TYPE_DESCRIPTIONS` | `Record<AccountType, string>` | Descrizioni per tipo conto | ✅ |
| `ACCOUNT_TYPE_ICONS` | `Record<AccountType, string>` | Identificatori icona stringa (es. `'bank'`, `'lock'`) | ✅ |
| `TRANSACTION_TYPE_LABELS` | `Record<string, string>` | Etichette per tipo transazione | ✅ |
| `RECURRENCE_LABELS` | `Record<string, string>` | Etichette per frequenza ricorrenza | ✅ |
| `ACCOUNT_CATEGORIES` | `AccountCategoryInfo[]` | Definizione delle 5 categorie di conto | ⚠️ (campo `color` oklch, `badgeVariant` web) |
| `ACCOUNT_TYPE_TO_CATEGORY` | `Record<AccountType, AccountCategory>` | Mappa tipo → categoria | ✅ |

---

## `src/lib/helpers.ts` ⚠️

Calcoli e utilità. Dipendenze interne: `./types`.  
Tutte le funzioni sono compatibili RN tranne `downloadFile` (non definita nel file corrente ma referenziata da `AppDataContext`).

### Funzioni esportate

| Funzione | Parametri | Ritorna | RN |
|----------|-----------|---------|-----|
| `calculateAccountBalance(account, transactions)` | `Account`, `Transaction[]` | `number` | ✅ |
| `formatCurrency(amount, currency?)` | `number`, `string = 'EUR'` | `string` (formato `it-IT`) | ✅ |
| `formatDate(dateString)` | `string` (ISO) | `string` (formato `it-IT`) | ✅ |
| `formatDateShort(dateString)` | `string` (ISO) | `string` (`dd/mm/yy`) | ✅ |
| `generateId()` | — | `string` (timestamp + random) | ✅ |
| `getTotalBalance(accounts, transactions)` | `Account[]`, `Transaction[]` | `number` | ✅ |
| `getTransactionsInPeriod(transactions, startDate, endDate)` | `Transaction[]`, `string`, `string` | `Transaction[]` | ✅ |
| `getTotalByType(transactions, tipo)` | `Transaction[]`, `'entrata' \| 'uscita'` | `number` | ✅ |
| `groupTransactionsByCategory(transactions, categories)` | `Transaction[]`, `{id,nome}[]` | `{categoria, totale}[]` ordinato per totale desc | ✅ |
| `exportToCSV(transactions, accounts, categories)` | `Transaction[]`, `Account[]`, `{id,nome}[]` | `string` (CSV) | ✅ |
| `getBudgetProgress(budget, transactions)` | `Budget`, `Transaction[]` | `{spent, percentage, remaining, isOverBudget}` | ✅ |
| `getActiveBudgets(budgets)` | `Budget[]` | `Budget[]` (attivi e non scaduti) | ✅ |
| `getBudgetPeriodDates(periodo, startDate?)` | `BudgetPeriod`, `Date?` | `{dataInizio, dataFine}` (ISO string) | ✅ |
| `getSavingsGoalProgress(goal)` | oggetto con `importoTarget`, `importoCorrente`, `dataInizio`, `dataScadenza?` | `{percentage, remaining, daysRemaining?, isComplete, isOverdue}` | ✅ |
| `calculateSavingsProjection(goal)` | analogo a `getSavingsGoalProgress` | proiezione di risparmio | ✅ |

---

## `src/lib/budget-alerts.ts` ✅

Alert sui budget. Dipendenze interne: `./types`, `./helpers`.

### Tipi esportati

| Nome | Tipo | Descrizione |
|------|------|-------------|
| `BudgetAlertLevel` | `type` | `'info' \| 'warning' \| 'critical' \| 'exceeded'` |
| `BudgetAlert` | `interface` | `budgetId`, `budgetName`, `level`, `percentage`, `spent`, `target`, `remaining`, `message`, `timestamp` |

### Funzioni esportate

| Funzione | Parametri | Ritorna | RN |
|----------|-----------|---------|-----|
| `getBudgetAlertLevel(percentage, isOverBudget)` | `number`, `boolean` | `BudgetAlertLevel` | ✅ |
| `getBudgetAlertMessage(budgetName, level, percentage, remaining, spent, target)` | vedi firma | `string` | ✅ |
| `generateBudgetAlerts(budgets, transactions)` | `Budget[]`, `Transaction[]` | `BudgetAlert[]` (solo warning/critical/exceeded, ordinati per livello) | ✅ |
| `shouldShowBudgetNotification(budget, transactions, dismissedIds)` | `Budget`, `Transaction[]`, `string[]` | `boolean` | ✅ |
| `getBudgetNotificationTitle(alert)` | `BudgetAlert` | `string` | ✅ |

---

## `src/lib/budget-forecasting.ts` ✅

Previsione di spesa. Dipendenze interne: `./types`, `./budget-history`.

### Tipi esportati

| Nome | Tipo | Descrizione |
|------|------|-------------|
| `BudgetForecast` | `interface` | `projectedSpending`, `projectedPercentage`, `projectedRemaining`, `willExceedBudget`, `confidence: 'high'\|'medium'\|'low'`, `daysElapsed`, `daysRemaining`, `currentDailyAverage`, `historicalDailyAverage`, `forecastMethod`, `historicalComparison` |

### Funzioni esportate

| Funzione | Parametri | Ritorna | RN |
|----------|-----------|---------|-----|
| `calculateBudgetForecast(budget, transactions, historicalPeriods?)` | `Budget`, `Transaction[]`, `number = 6` | `BudgetForecast` | ✅ |

---

## `src/lib/budget-history.ts` ✅

Storico periodi budget. Dipendenze interne: `./types`.

### Tipi esportati

| Nome | Tipo | Descrizione |
|------|------|-------------|
| `BudgetPeriodData` | `interface` | `periodLabel`, `startDate`, `endDate`, `spent`, `percentage`, `remaining`, `isOverBudget`, `transactionCount` |

### Funzioni esportate

| Funzione | Parametri | Ritorna | RN |
|----------|-----------|---------|-----|
| `getBudgetHistoricalData(budget, transactions, periodsBack?)` | `Budget`, `Transaction[]`, `number = 6` | `BudgetPeriodData[]` | ✅ |
| `calculateBudgetTrend(historicalData)` | `BudgetPeriodData[]` | `{ trend: 'improving'\|'worsening'\|'stable', changePercentage: number }` | ✅ |

---

## `src/lib/budget-templates.ts` ⚠️

Template predefiniti. Dipendenza esterna: `@phosphor-icons/react` (icone web — da rimuovere per RN).

### Tipi esportati

| Nome | Tipo | Descrizione |
|------|------|-------------|
| `BudgetTemplate` | `interface` | `id`, `nome`, `descrizione`, `importoSuggerito`, `periodo: BudgetPeriod`, `categorieTarget: string[]`, `icon: Icon` (phosphor — da sostituire), `color: string` (oklch — da sostituire) |

### Costanti esportate

| Nome | Tipo | Descrizione | RN |
|------|------|-------------|-----|
| `BUDGET_TEMPLATES` | `BudgetTemplate[]` | 10 template predefiniti (spesa, ristoranti, trasporti, casa, svago, salute, abbonamenti, abbigliamento, elettronica, viaggi) | ⚠️ (`icon` phosphor, `color` oklch) |

---

## `src/lib/crypto.ts` ⚠️

Hashing PIN e cifratura dati. Dipendenza esterna: `bcryptjs`.

| Funzione | Parametri | Ritorna | RN |
|----------|-----------|---------|-----|
| `hashPin(pin)` | `string` | `Promise<string>` (bcrypt hash, salt 12) | ✅ |
| `verifyPin(pin, hash)` | `string`, `string` | `Promise<boolean>` | ✅ |
| `encryptData(data, key)` | `string`, `string` | `Promise<string>` (AES-GCM + btoa) | ❌ (`crypto.subtle` non disponibile in Hermes — sostituire con `expo-crypto`) |
| `decryptData(encryptedData, key)` | `string`, `string` | `Promise<string>` | ❌ (stesso problema) |

---

## `src/lib/haptic-system.ts` ❌

Feedback aptico. Nessuna dipendenza esterna, ma usa `localStorage` e `navigator.vibrate`.

### Tipo esportato

| Nome | Tipo |
|------|------|
| `HapticPattern` | `type` — 15 valori: `'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error' \| 'selection' \| 'impact-*' \| 'notification-*' \| 'rigid' \| 'soft'` |

### Classe `HapticSystem` — metodi pubblici

| Metodo | Parametri | Ritorna | Funziona in RN |
|--------|-----------|---------|----------------|
| `isEnabled()` | — | `boolean` | ❌ (dipende da `navigator.vibrate`) |
| `isSupported()` | — | `boolean` | ❌ (`'vibrate' in navigator`) |
| `setEnabled(enabled)` | `boolean` | `void` | ❌ (`localStorage`) |
| `getIntensity()` | — | `number` | ✅ |
| `setIntensity(intensity)` | `number` (0–1) | `void` | ❌ (`localStorage`) |
| `getSettings()` | — | `HapticSettings` | ✅ |
| `play(pattern)` | `HapticPattern` | `void` | ❌ (`navigator.vibrate`) |
| `click()`, `buttonPress()`, `success()`, `error()`, `warning()`, `selection()`, `impact(type)`, `notification(type)` | vari | `void` | ❌ |
| `pinError()`, `pinSuccess()`, `privateUnlock()`, `privateLock()` | — | `void` | ❌ |

**Singleton esportato**: `hapticSystem: HapticSystem`

> Da riscrivere con `react-native` `Vibration` API o `expo-haptics`. Storage da migrare ad `AsyncStorage`.

---

## `src/lib/sound-system.ts` ❌

Sistema audio. Nessuna dipendenza esterna, usa Web Audio API (`AudioContext`).

### Tipo esportato

| Nome | Tipo |
|------|------|
| `SoundType` | `type` — 48 valori (click, success, error, warning, notification, unlock/lock, income/expense/transfer, pin-error/success, private-unlock/lock, ...) |

### Classe `SoundSystem` — metodi pubblici

| Metodo | Parametri | Ritorna | RN |
|--------|-----------|---------|-----|
| `initFromSettings(enabled, volume)` | `boolean`, `number` | `void` | ⚠️ (logica pura ma presuppone `AudioContext`) |
| `configure(callbacks)` | `AudioPersistCallbacks` | `void` | ✅ |
| `play(soundType)` | `SoundType` | `void` | ❌ (`AudioContext`) |
| `setEnabled(enabled)` | `boolean` | `void` | ✅ |
| `setVolume(volume)` | `number` | `void` | ⚠️ |
| `isEnabled()` | — | `boolean` | ✅ |
| `getVolume()` | — | `number` | ✅ |

**Singleton esportato**: `soundSystem: SoundSystem`

> Interfaccia pubblica portabile. Implementazione da riscrivere con `expo-av` o `react-native-sound`.

---

## `src/lib/screen-reader.ts` ❌

Annunci per screen reader. Nessuna dipendenza esterna, usa DOM live regions.

### Tipo esportato

| Nome | Tipo |
|------|------|
| `AnnouncementPriority` | `type` — `'polite' \| 'assertive'` |

### Classe `ScreenReaderAnnouncer` — metodi pubblici

| Metodo | Parametri | Ritorna | RN |
|--------|-----------|---------|-----|
| `announce(message, priority?)` | `string`, `AnnouncementPriority?` | `void` | ❌ (DOM `aria-live`) |
| `announceNavigation(destination)` | `string` | `void` | ❌ |
| `announceAction(action)` | `string` | `void` | ❌ |
| `announceError(error)` | `string` | `void` | ❌ |
| `announceSuccess(message)` | `string` | `void` | ❌ |
| `announceCount(items, count)` | `string`, `number` | `void` | ❌ |
| `announceBalance(accountName, balance, currency?)` | `string`, `number`, `string?` | `void` | ❌ |
| `announceTransaction(type, amount, account, category?)` | … | `void` | ❌ |
| `announceDialogOpen(title)` | `string` | `void` | ❌ |
| `announceDialogClose()` | — | `void` | ❌ |
| `announceProgress(current, total, label)` | `number`, `number`, `string` | `void` | ❌ |
| `announceBudgetStatus(name, spent, target, percentage)` | … | `void` | ❌ |
| `announceFocus(elementDescription)` | `string` | `void` | ❌ |
| `announceListNavigation(position, total, itemDescription)` | … | `void` | ❌ |
| `announceFilter(filterName, active)` | `string`, `boolean` | `void` | ❌ |
| `announceSort(columnName, direction)` | `string`, `'ascending'\|'descending'` | `void` | ❌ |
| `announceAccountCreated/Deleted(…)` | … | `void` | ❌ |
| `announceBudgetCreated/Deleted(…)` | … | `void` | ❌ |

**Singleton esportato**: `screenReader: ScreenReaderAnnouncer`

> Da riscrivere interamente usando `AccessibilityInfo.announceForAccessibility()`.

---

## `src/lib/supabase/types.ts` ✅

Tipi DB e di settings. Uso interno al layer `src/lib/supabase/`.

### Classi e tipi esportati

| Nome | Tipo | Descrizione |
|------|------|-------------|
| `RepositoryError` | `class extends Error` | Wrapper errori Supabase/PostgREST. Proprietà: `code`, `details`, `hint`, `pgError?`. Costruttore: `(cause: DbError \| string)` |
| `TalkBackAdaptations` | `interface` | 8 flag booleani per adattamenti TalkBack |
| `UserPreferences` | `interface` | 32 chiavi JSONB: display (12), sr (12), audio (2), talkback (2), session (2), onboarding (1), alert (1) |
| `UserSettings` | `interface` | `nomeVisualizzato`, `valutaDefault`, `pinPrivatoHash`, `preferences: UserPreferences` |
| `DbAccount`, `DbTransaction`, `DbCategory`, `DbBudget`, `DbSavingsGoal`, `DbSavingsGoalProgress`, `DbUserSettings` | `interface` | Row types snake_case — **uso interno** al layer supabase |

---

## `src/lib/supabase/client.ts` ✅*

Singleton Supabase. Dipendenza: `@supabase/supabase-js`.

> ✅ **DESIGN 001 risolto**: il client importa `SUPABASE_URL` e `SUPABASE_ANON_KEY` dal modulo `@env` (plugin Babel `react-native-dotenv` configurato in `babel.config.js`). Mantenuto il `throw` immediato come guardia.

### Esportazioni

| Nome | Tipo | Descrizione |
|------|------|-------------|
| `supabase` | `SupabaseClient` | Client singleton — autenticato con RLS |

---

## `src/lib/supabase/cache.ts` ✅

Cache locale basata su `AsyncStorage`. Dipendenza esterna: `@react-native-async-storage/async-storage`.

### Tipi esportati

| Nome | Tipo |
|------|------|
| `CacheTable` | `'conti' \| 'transazioni' \| 'categorie' \| 'budget' \| 'obiettivi_risparmio'` |
| `CacheEntry<T>` | `{ data: T, cachedAt: string, version: number }` |

### Costanti

| Nome | Valore |
|------|--------|
| `CACHE_TTL_MS` | `86_400_000` (24 ore) |

### Funzioni esportate

| Funzione | Parametri | Ritorna | RN |
|----------|-----------|---------|-----|
| `writeCache<T>(userId, table, data)` | `string`, `CacheTable`, `T` | `Promise<void>` | ✅ |
| `readCache<T>(userId, table)` | `string`, `CacheTable` | `Promise<CacheEntry<T> \| null>` | ✅ |
| `isCacheStale(userId, table, ttlMs?)` | `string`, `CacheTable`, `number?` | `Promise<boolean>` | ✅ |
| `invalidateCache(userId)` | `string` | `Promise<void>` | ✅ |

---

## `src/lib/supabase/repositories/conti.ts` ✅

CRUD conti correnti. Dipendenza: `@supabase/supabase-js`, `../client`, `../types`.

| Funzione | Parametri | Ritorna |
|----------|-----------|---------|
| `getAll()` | — | `Promise<Account[]>` |
| `getById(id)` | `string` | `Promise<Account>` |
| `create(input)` | `Omit<Account, 'id'>` | `Promise<Account>` |
| `update(id, input)` | `string`, `Partial<Omit<Account, 'id'>>` | `Promise<Account>` |
| `remove(id)` | `string` | `Promise<void>` |

---

## `src/lib/supabase/repositories/transazioni.ts` ✅

CRUD transazioni. Dipendenza: `@supabase/supabase-js`, `../client`, `../types`.

> Supporta filtri opzionali `TransactionFilters` (tipo, contoId, categoriaId, dateRange).

| Funzione | Parametri | Ritorna |
|----------|-----------|---------|
| `getAll(filtri?)` | `TransactionFilters?` | `Promise<Transaction[]>` |
| `getById(id)` | `string` | `Promise<Transaction>` |
| `create(input)` | `Omit<Transaction, 'id' \| 'cifrato'>` | `Promise<Transaction>` |
| `update(id, input)` | `string`, `Partial<Omit<Transaction, 'id' \| 'cifrato'>>` | `Promise<Transaction>` |
| `remove(id)` | `string` | `Promise<void>` |

---

## `src/lib/supabase/repositories/categorie.ts` ✅

CRUD categorie. Dipendenza: `@supabase/supabase-js`.

| Funzione | Parametri | Ritorna |
|----------|-----------|---------|
| `getAll()` | — | `Promise<Category[]>` |
| `create(input)` | `Omit<Category, 'id'>` | `Promise<Category>` |
| `update(id, input)` | `string`, `Partial<Omit<Category, 'id'>>` | `Promise<Category>` |
| `remove(id)` | `string` | `Promise<void>` |
| `seedDefaultCategories()` | — | `Promise<void>` |

---

## `src/lib/supabase/repositories/budget.ts` ✅

CRUD budget. Dipendenza: `@supabase/supabase-js`.

| Funzione | Parametri | Ritorna |
|----------|-----------|---------|
| `getAll()` | — | `Promise<Budget[]>` (ordinati per `data_inizio` desc) |
| `getById(id)` | `string` | `Promise<Budget>` |
| `create(input)` | `Omit<Budget, 'id'>` | `Promise<Budget>` |
| `update(id, input)` | `string`, `Partial<Omit<Budget, 'id'>>` | `Promise<Budget>` |
| `remove(id)` | `string` | `Promise<void>` |

---

## `src/lib/supabase/repositories/obiettivi-risparmio.ts` ✅

CRUD obiettivi di risparmio. Dipendenza: `@supabase/supabase-js`.

| Funzione | Parametri | Ritorna |
|----------|-----------|---------|
| `getAll()` | — | `Promise<SavingsGoal[]>` |
| `getById(id)` | `string` | `Promise<SavingsGoal>` |
| `create(input)` | `Omit<SavingsGoal, 'id'>` | `Promise<SavingsGoal>` |
| `update(id, input)` | `string`, `Partial<Omit<SavingsGoal, 'id'>>` | `Promise<SavingsGoal>` |
| `updateProgress(id, importoCorrente)` | `string`, `number` | `Promise<SavingsGoal>` (RPC atomica) |
| `remove(id)` | `string` | `Promise<void>` |

---

## `src/lib/supabase/repositories/impostazioni-utente.ts` ✅

Lettura/scrittura preferenze utente. Dipendenza: `@supabase/supabase-js`.

| Funzione | Parametri | Ritorna |
|----------|-----------|---------|
| `getOrCreate()` | — | `Promise<UserSettings>` (insert idempotente, gestisce race condition 23505) |
| `updateField(campo, valore)` | `keyof Omit<UserSettings,'preferences'>`, `string \| null` | `Promise<UserSettings>` |
| `updatePreference(chiave, valore)` | `keyof UserPreferences`, `boolean \| number \| string \| object \| null` | `Promise<UserSettings>` (merge JSONB atomico via RPC) |
| `updatePinHash(hash)` | `string \| null` | `Promise<void>` |

---

## `src/context/AuthContext.tsx` ⚠️

Provider auth + gestione PIN privato.  
**Import problematici risolti (DESIGN 001)**: `sonner` sostituito da shim locale `sonnerNotify`; `@/components/ui/button` ora esiste come placeholder RN (`src/components/ui/button.tsx`); le chiamate residue `document.querySelector` per screen reader detection appartengono al perimetro DESIGN 002.

### Hook esportato

`useAuth(): AuthContextValue`

### `AuthContextValue` — campi principali

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `user` | `User \| null` | Utente Supabase Auth |
| `session` | `Session \| null` | Sessione corrente |
| `isAuthReady` | `boolean` | Auth inizializzata |
| `isAuthenticated` | `boolean` | |
| `needsOnboarding` | `boolean` | Primo accesso senza `nomeVisualizzato` |
| `userSettings` | `UserSettings \| null` | Settings letti da Supabase |
| `isPrivateEnabled` | `boolean` | PIN privato configurato |
| `isPrivateUnlocked` | `boolean` | Sezione privata sbloccata |
| `inactivityTimeout` | `number` | Minuti di inattività |
| `signIn(email, password)` | `async` | `Promise<void>` |
| `signUp(email, password)` | `async` | `Promise<void>` |
| `signOut()` | `async` | `Promise<void>` (invalida cache) |
| `resetPassword(email)` | `async` | `Promise<void>` |
| `unlockPrivate(pin)` | `async` | `Promise<void>` |
| `lockPrivate()` | — | `void` |
| `setPin(pin)` | `async` | `Promise<void>` |
| `changePin(oldPin, newPin)` | `async` | `Promise<void>` |
| `removePin(pin)` | `async` | `Promise<void>` |
| `setInactivityTimeout(minutes)` | `async` | `Promise<void>` |
| `completeOnboarding()` | — | `void` |

### Provider esportato

`AuthProvider({ children })` — avvolge il grafo componenti nell'albero.

---

## `src/context/AppDataContext.tsx` ⚠️

Provider CRUD dati di dominio + gestione dialog.  
**Import problematici risolti (DESIGN 001)**: `sonner` sostituito da shim locale `toast` callable con metodi `success`/`error`/`warning`.  
**Bug noto**: `readCache`/`isCacheStale` invocate come sincrone invece di `await`.

### Hook esportato

`useAppData(): AppDataContextValue`

### `AppDataContextValue` — campi principali

| Campo | Tipo | RN |
|-------|------|----|
| `accounts`, `transactions`, `categories`, `budgets`, `savingsGoals` | array di dominio | ✅ |
| `safeAccounts`, `safeTransactions`, `safeCategories`, `safeBudgets`, `safeSavingsGoals` | memo delle stesse | ✅ |
| `isLoading`, `error`, `isDataReady` | `boolean`, `string\|null`, `boolean` | ✅ |
| `addAccount`, `updateAccount`, `removeAccount` | `async` | ✅ |
| `addTransaction`, `updateTransaction`, `removeTransaction` | `async` | ✅ |
| `addCategory`, `updateCategory`, `removeCategory` | `async` | ✅ |
| `addBudget`, `updateBudget`, `removeBudget` | `async` | ✅ |
| `addSavingsGoal`, `updateSavingsGoal`, `updateSavingsGoalProgress`, `removeSavingsGoal` | `async` | ✅ |
| `refreshAll()` | `void` | ✅ |
| `handleExportCSV(visibleTransactions, visibleAccounts)` | `void` | ⚠️ (chiama `downloadFile` DOM) |
| Dialog state/setters (`editingTransaction`, `showTransactionDialog`, ecc.) | vari | ✅ |

### Provider esportato

`AppDataProvider({ children })` — richiede `AuthProvider` come antenato.

---

## `src/context/UserSettingsContext.tsx` ✅

Thin context wrapper su `useUserSettings`.

### Hook esportato

`useUserSettings(): UserSettingsState`

Delega completamente a `src/hooks/use-user-settings.ts`. Vedi sezione hook per i campi.

### Provider esportato

`UserSettingsProvider({ children })` — richiede `AuthProvider`.

---

## `src/context/VisibleDataContext.tsx` ✅

Thin context wrapper su `useVisibleData`.

### Hook esportato

`useVisibleData(): VisibleDataResult`

### Provider esportato

`VisibleDataProvider({ children })` — richiede `AppDataProvider`, `AuthProvider`, `UserSettingsProvider`.

---

## `src/hooks/use-user-settings.ts` ✅

Hook raw per impostazioni utente. Dipendenze: `AuthContext`, repository `impostazioni-utente`.

### Tipi esportati

`DisplayPreferences`, `ScreenReaderPreferences`, `UserSettingsState`

### `UserSettingsState` — campi principali

| Campo | Tipo |
|-------|------|
| `visibleCategories` | `string[]` |
| `dismissedBudgetAlerts` | `string[]` |
| `isSettingsReady`, `isSettingsLoading` | `boolean` |
| `settingsError` | `string \| null` |
| `audioEnabled` | `boolean` |
| `audioVolume` | `number` (0–1) |
| `displayPreferences` | `DisplayPreferences` (12 chiavi) |
| `screenReaderPreferences` | `ScreenReaderPreferences` (12 chiavi) |
| `talkBackAdaptations` | `TalkBackAdaptations` |
| `talkBackManualOverride` | `boolean \| null` |
| `setVisibleCategories(ids)` | `async` |
| `dismissBudgetAlert(budgetId)` | `async` |
| `resetDismissedAlerts()` | `async` |
| `setAudioEnabled(v)` | `async` |
| `setAudioVolume(v)` | `async` |
| `setDisplayPreference<K>(key, value)` | `async` |
| `setScreenReaderPreference<K>(key, value)` | `async` |
| `setTalkBackAdaptations(adaptations)` | `async` |
| `setTalkBackManualOverride(v)` | `async` |
| `resetScreenReaderPreferences()` | `async` |

---

## `src/hooks/use-visible-data.ts` ✅

Filtraggio dati visibili in base a `isPrivateUnlocked`.

### Tipo esportato

`VisibleDataResult` — `visibleAccounts`, `visibleTransactions`, `hasPrivateAccount`, `privateAccount`, `totalBalance`, `recentTransactions`, `groupedAccounts`, `filteredGroupedAccounts`, `allCategoriesVisible`, `budgetAlerts`

---

## `src/hooks/use-display-preferences.ts` ✅

Thin wrapper su `useUserSettings().displayPreferences`.

```ts
useDisplayPreferences(): DisplayPreferences
```

---

## `src/hooks/use-haptic.ts` ⚠️

Wrapper hook su `hapticSystem`. Compatibile in sé (solo useState/useEffect), ma inutile finché `haptic-system.ts` non è riscritto per RN.

---

## `src/hooks/use-screen-reader.ts` ⚠️

Wrapper hook su `screenReader`. Compatibile in sé, ma inutile finché `screen-reader.ts` non è riscritto per RN.

---

## `src/hooks/use-online-status.ts` ❌

Hook stato connessione. Usa `navigator.onLine` e `window.addEventListener('online'/'offline')`.

```ts
useOnlineStatus(): { isOffline: boolean }
```

> Da riscrivere con `@react-native-community/netinfo`.

---

## `src/hooks/use-inactivity-timer.ts` ❌

Timer inattività. Usa `document.addEventListener` e `window.setTimeout`.

```ts
useInactivityTimer({ timeoutMinutes, onTimeout }): { resetTimer(), showWarning: boolean }
```

> `document.addEventListener` causa `ReferenceError` al mount in RN. Da riscrivere con `AppState` di React Native.

---

## `src/accessibility/types.ts` ✅

Tipi condivisi tra engine.ts, detection.ts e il futuro layer announcements/ (DESIGN 004).
Nessuna dipendenza esterna.

| Nome | Tipo | Descrizione |
|------|------|-------------|
| `AnnouncementPriority` | `type` | `'polite' \| 'assertive'` |
| `Announcement` | `interface` | `{ text: string; priority: AnnouncementPriority }` |
| `TalkBackState` | `interface` | `{ isEnabled, isDetected, confidenceLevel: 'high'\|'low', adaptationsActive: boolean }` |
| `TalkBackAdaptations` | `interface` | 8 booleani: `enhancedTouchTargets`, `simplifiedNavigation`, `extendedTimeouts`, `verboseDescriptions`, `highContrastMode`, `reducedMotion`, `autoFocusManagement`, `spatialAudio` |

---

## `src/accessibility/engine.ts` ✅

Singleton per l'invio di annunci allo screen reader. Stateless, zero dipendenze DOM.
**Non chiamare direttamente dall'app** — sarà invocato solo da `announcements/index.ts` (DESIGN 004).

```ts
engine.announce(announcement: Announcement): void
```

---

## `src/accessibility/detection.ts` ✅

Hook che sostituisce `src/hooks/use-talkback.ts` (eliminato). Usa esclusivamente API React Native.

```ts
useAccessibilityDetection(): {
  talkBackState: TalkBackState
  adaptations: TalkBackAdaptations
  enableTalkBack(manual?: boolean): void
  disableTalkBack(manual?: boolean): void
  resetDetection(): Promise<void>
  updateAdaptation(key: keyof TalkBackAdaptations, value: boolean): void
  resetAdaptations(): void
  getTouchTargetSize(): number            // 44px base, 56px enhanced
  getAnimationDuration(baseMs: number): number
  getTimeout(baseMs: number): number
  shouldUseVerboseDescriptions(): boolean
  shouldSimplifyNavigation(): boolean
  shouldAutoManageFocus(): boolean
  getAriaDescription(brief: string, verbose: string): string
}
```

Esporta anche `DEFAULT_ADAPTATIONS: TalkBackAdaptations` (costante, tutte le adattazioni a true eccetto highContrastMode).

> Sostituisce `useTalkBack()` da `src/hooks/use-talkback.ts` (eliminato in DESIGN 003).

---

## `src/locales/index.ts` ✅

Entry point localizzazione. Importare sempre da qui, mai da `src/locales/it.ts` direttamente.

```ts
strings: Strings      // oggetto stringhe italiano
type Strings          // shape dell'oggetto stringhe
type StringKey        // keyof Strings
```

---

## ~~`src/hooks/use-talkback.ts`~~ ❌ (ELIMINATO — DESIGN 003)

File rimosso. Sostituito da `src/accessibility/detection.ts`.
Usava API browser incompatibili con React Native (`window.matchMedia`, `sessionStorage`, `speechSynthesis`, `navigator.userAgent`).

