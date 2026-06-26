# API Reference — ZecchinoReact

> Aggiornato al: 2026-06-26 (v0.16.1)  
> Branch: main  
> Copertura: tutti i file pubblici in `src/` presenti nel branch corrente.

## Legenda compatibilità

| Simbolo | Significato                                              |
| ------- | -------------------------------------------------------- |
| ✅      | Compatibile React Native senza modifiche                 |
| ⚠️      | Richiede refactoring parziale (sostituzione API browser) |
| ❌      | Incompatibile — va riscritto o rimosso per RN            |

---

## `src/lib/types.ts` ✅

Tipi di dominio client-side. Nessuna dipendenza esterna.

### Tipi esportati

| Nome                        | Tipo        | Descrizione                                                                                                                                                                                   |
| --------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AccountType`               | `type`      | Unione: `'bancario' \| 'prepagata' \| 'contanti' \| 'salvadanaio' \| 'privato' \| 'investimenti' \| 'credito' \| 'paypal' \| 'crypto' \| 'pensione'`                                          |
| `TransactionType`           | `type`      | `'entrata' \| 'uscita' \| 'trasferimento'`                                                                                                                                                    |
| `RecurrenceType`            | `type`      | `'entrata' \| 'uscita'`                                                                                                                                                                       |
| `RecurrenceFrequency`       | `type`      | `'giornaliero' \| 'settimanale' \| 'mensile' \| 'annuale'`                                                                                                                                    |
| `CategoryType`              | `type`      | `'entrata' \| 'uscita'`                                                                                                                                                                       |
| `BudgetPeriod`              | `type`      | `'mensile' \| 'trimestrale' \| 'annuale'`                                                                                                                                                     |
| `Account`                   | `interface` | Conto finanziario: `id`, `nome`, `tipo`, `saldoIniziale`, `valuta`, `isPrivato`, `dataCreazione`, `archiviato`                                                                                |
| `Transaction`               | `interface` | Transazione: `id`, `data`, `importo`, `tipo`, `contoId`, `contoDestinazioneId?`, `categoriaId`, `descrizione`, `ricorrente`, `frequenzaRicorrenza?`, `cifrato`                                |
| `TransactionInput`          | `type`      | `Omit<Transaction, 'id' \| 'cifrato'> & { id?: string }` — input per create/update                                                                                                            |
| `Recurrence`                | `interface` | Ricorrenza: `id`, `contoId`, `categoriaId?`, `tipo`, `importo`, `descrizione`, `frequenza`, `dataInizio`, `dataFine?`, `ultimaGenerazione?`, `prossimaGenerazione`, `attiva`                  |
| `Tag`                       | `interface` | Tag utente: `id`, `nome`, `colore?`, `icona?`, `usatoNVolte`                                                                                                                                  |
| `NotificationType`          | `type`      | `'budget_soglia' \| 'budget_superato' \| 'obiettivo_raggiunto' \| 'sistema'`                                                                                                                  |
| `NotificationChannel`       | `type`      | `'inapp' \| 'email' \| 'push'`                                                                                                                                                                |
| `NotificationEntityType`    | `type`      | `'budget' \| 'obiettivo' \| 'conto' \| 'transazione'`                                                                                                                                         |
| `AppNotification`           | `interface` | Notifica app: `id`, `tipo`, `titolo`, `messaggio?`, `letta`, `canale`, `schedulataPer?`, `entitaTipo?`, `entitaId?`, `metadata?`, `createdAt`                                                 |
| `AttachmentMimeType`        | `type`      | `'image/jpeg' \| 'image/png' \| 'application/pdf'`                                                                                                                                            |
| `AttachmentFileInput`       | `interface` | File allegato in input: `uri`, `name`, `type`, `size`                                                                                                                                         |
| `AttachmentValidationError` | `interface` | Esito validazione allegato: `code`, `message`                                                                                                                                                 |
| `AttachmentUploadResult`    | `interface` | Esito upload storage: `storagePath`, `fileName`, `mimeType`, `sizeBytes`                                                                                                                      |
| `Allegato`                  | `interface` | Allegato transazione: `id`, `transazioneId`, `nomeFile`, `storagePath`, `mimeType?`, `dimensioneBytes?`, `descrizione?`, `miniaturaPath?`, `createdAt`                                        |
| `Category`                  | `interface` | Categoria: `id`, `nome`, `tipo`, `predefinita`                                                                                                                                                |
| `Budget`                    | `interface` | Budget: `id`, `nome`, `importoTarget`, `periodo`, `categoriaId?`, `contoId?`, `dataInizio`, `dataFine`, `attivo`                                                                              |
| `SavingsGoal`               | `interface` | Obiettivo risparmio: `id`, `nome`, `descrizione`, `importoTarget`, `importoCorrente`, `dataInizio`, `dataScadenza?`, `contoAssociato?`, `colore`, `icona`, `completato`, `dataCompletamento?` |
| `AccountGroup`              | `type`      | `{ id, label, accounts: Account[] }`                                                                                                                                                          |
| `FullAccountGroup`          | `type`      | `AccountCategoryInfo & { accounts: Account[] }`                                                                                                                                               |
| `AppState`                  | `interface` | Snapshot globale dell'app (auth + dati di dominio, inclusi `ricorrenze`, `tags`, `transactionTagMap`, `notifications`, `notificationsHydrated`)                                               |

---

## `src/lib/constants.ts` ✅

Costanti di dominio. Dipendenza interna: `./types`.

> **Nota migrazione**: `badgeVariant` in `AccountCategoryInfo` usa una variante web — da sostituire per componenti nativi. Il campo `color` usa token centralizzati RN-compatibili.

### Tipi esportati

| Nome                  | Tipo        | Descrizione                                                                               |
| --------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `AccountCategory`     | `type`      | `'banking' \| 'digital' \| 'savings' \| 'investments' \| 'private'`                       |
| `AccountCategoryInfo` | `interface` | Metadati di una categoria: `id`, `label`, `description`, `types`, `color`, `badgeVariant` |

### Costanti esportate

| Nome                        | Tipo                                   | Descrizione                                           | RN                                           |
| --------------------------- | -------------------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| `ACCOUNT_TYPE_LABELS`       | `Record<string, string>`               | Etichette per tipo conto                              | ✅                                           |
| `ACCOUNT_TYPE_DESCRIPTIONS` | `Record<AccountType, string>`          | Descrizioni per tipo conto                            | ✅                                           |
| `ACCOUNT_TYPE_ICONS`        | `Record<AccountType, string>`          | Identificatori icona stringa (es. `'bank'`, `'lock'`) | ✅                                           |
| `TRANSACTION_TYPE_LABELS`   | `Record<string, string>`               | Etichette per tipo transazione                        | ✅                                           |
| `RECURRENCE_LABELS`         | `Record<string, string>`               | Etichette per frequenza ricorrenza                    | ✅                                           |
| `ACCOUNT_CATEGORIES`        | `AccountCategoryInfo[]`                | Definizione delle 5 categorie di conto                | ⚠️ (`badgeVariant` web)                      |
| `ACCOUNT_TYPE_TO_CATEGORY`  | `Record<AccountType, AccountCategory>` | Mappa tipo → categoria                                | ✅                                           |

---

## `src/lib/design-tokens/colors.ts` ✅

Token di design centralizzati per colori hex e icone per ZecchinoReact. Tutti i valori sono compatibili con React Native.

### Costanti esportate

| Nome | Tipo | Descrizione |
| --- | --- | --- |
| `DESIGN_COLORS` | `object` | Oggetto contenente i colori semantici per `budget` (groceries, dining, transport, housing, entertainment, health, subscriptions, clothing, education, pets, overallBudget) e `accountCategory` (banking, digital, savings, investments, private). |

### Tipi esportati

- `BudgetColorToken`: Unione delle chiavi di `DESIGN_COLORS.budget`
- `AccountCategoryColorToken`: Unione delle chiavi di `DESIGN_COLORS.accountCategory`
- `BudgetTemplateIconKey`: Unione di 11 identificatori icona (`'groceries' | 'dining' | 'transport' | 'housing' | 'entertainment' | 'health' | 'subscriptions' | 'clothing' | 'education' | 'pets' | 'overall-budget'`)

---

## `src/lib/helpers.ts` ⚠️

Calcoli e utilità. Dipendenze interne: `./types`.  
Tutte le funzioni esportate sono compatibili React Native. La generazione
CSV resta confinata a `exportToCSV`; il delivery nativo del file è stato
spostato in `src/lib/export-service.ts`.

### Funzioni esportate

| Funzione                                                    | Parametri                                                                     | Ritorna                                                          | RN  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- | --- |
| `calculateAccountBalance(account, transactions)`            | `Account`, `Transaction[]`                                                    | `number`                                                         | ✅  |
| `formatCurrency(amount, currency?)`                         | `number`, `string = 'EUR'`                                                    | `string` (formato `it-IT`)                                       | ✅  |
| `formatDate(dateString)`                                    | `string` (ISO)                                                                | `string` (formato `it-IT`)                                       | ✅  |
| `formatDateShort(dateString)`                               | `string` (ISO)                                                                | `string` (`dd/mm/yy`)                                            | ✅  |
| `generateId()`                                              | —                                                                             | `string` (timestamp + random)                                    | ✅  |
| `getTotalBalance(accounts, transactions)`                   | `Account[]`, `Transaction[]`                                                  | `number`                                                         | ✅  |
| `getTransactionsInPeriod(transactions, startDate, endDate)` | `Transaction[]`, `string`, `string`                                           | `Transaction[]`                                                  | ✅  |
| `getTotalByType(transactions, tipo)`                        | `Transaction[]`, `'entrata' \| 'uscita'`                                      | `number`                                                         | ✅  |
| `groupTransactionsByCategory(transactions, categories)`     | `Transaction[]`, `{id,nome}[]`                                                | `{categoria, totale}[]` ordinato per totale desc                 | ✅  |
| `exportToCSV(transactions, accounts, categories)`           | `Transaction[]`, `Account[]`, `{id,nome}[]`                                   | `string` (CSV)                                                   | ✅  |
| `getBudgetProgress(budget, transactions)`                   | `Budget`, `Transaction[]`                                                     | `{spent, percentage, remaining, isOverBudget}`                   | ✅  |
| `getActiveBudgets(budgets)`                                 | `Budget[]`                                                                    | `Budget[]` (attivi e non scaduti)                                | ✅  |
| `getBudgetPeriodDates(periodo, startDate?)`                 | `BudgetPeriod`, `Date?`                                                       | `{dataInizio, dataFine}` (ISO string)                            | ✅  |
| `getSavingsGoalProgress(goal)`                              | oggetto con `importoTarget`, `importoCorrente`, `dataInizio`, `dataScadenza?` | `{percentage, remaining, daysRemaining?, isComplete, isOverdue}` | ✅  |
| `calculateSavingsProjection(goal)`                          | analogo a `getSavingsGoalProgress`                                            | proiezione di risparmio                                          | ✅  |

---

## `src/lib/budget-alerts.ts` ✅

Alert sui budget. Dipendenze interne: `./types`, `./helpers`.

### Tipi esportati

| Nome               | Tipo        | Descrizione                                                                                             |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------------------- |
| `BudgetAlertLevel` | `type`      | `'info' \| 'warning' \| 'critical' \| 'exceeded'`                                                       |
| `BudgetAlert`      | `interface` | `budgetId`, `budgetName`, `level`, `percentage`, `spent`, `target`, `remaining`, `message`, `timestamp` |

### Funzioni esportate

| Funzione                                                                         | Parametri                             | Ritorna                                                                | RN  |
| -------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- | --- |
| `getBudgetAlertLevel(percentage, isOverBudget)`                                  | `number`, `boolean`                   | `BudgetAlertLevel`                                                     | ✅  |
| `getBudgetAlertMessage(budgetName, level, percentage, remaining, spent, target)` | vedi firma                            | `string`                                                               | ✅  |
| `generateBudgetAlerts(budgets, transactions)`                                    | `Budget[]`, `Transaction[]`           | `BudgetAlert[]` (solo warning/critical/exceeded, ordinati per livello) | ✅  |
| `shouldShowBudgetNotification(budget, transactions, dismissedIds)`               | `Budget`, `Transaction[]`, `string[]` | `boolean`                                                              | ✅  |
| `getBudgetNotificationTitle(alert)`                                              | `BudgetAlert`                         | `string`                                                               | ✅  |

---

## `src/lib/budget-forecasting.ts` ✅

Previsione di spesa. Dipendenze interne: `./types`, `./budget-history`.

### Tipi esportati

| Nome             | Tipo        | Descrizione                                                                                                                                                                                                                                            |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BudgetForecast` | `interface` | `projectedSpending`, `projectedPercentage`, `projectedRemaining`, `willExceedBudget`, `confidence: 'high'\|'medium'\|'low'`, `daysElapsed`, `daysRemaining`, `currentDailyAverage`, `historicalDailyAverage`, `forecastMethod`, `historicalComparison` |

### Funzioni esportate

| Funzione                                                            | Parametri                               | Ritorna          | RN  |
| ------------------------------------------------------------------- | --------------------------------------- | ---------------- | --- |
| `calculateBudgetForecast(budget, transactions, historicalPeriods?)` | `Budget`, `Transaction[]`, `number = 6` | `BudgetForecast` | ✅  |

---

## `src/lib/budget-history.ts` ✅

Storico periodi budget. Dipendenze interne: `./types`.

### Tipi esportati

| Nome               | Tipo        | Descrizione                                                                                                   |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------------------------- |
| `BudgetPeriodData` | `interface` | `periodLabel`, `startDate`, `endDate`, `spent`, `percentage`, `remaining`, `isOverBudget`, `transactionCount` |

### Funzioni esportate

| Funzione                                                      | Parametri                               | Ritorna                                                                   | RN  |
| ------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- | --- |
| `getBudgetHistoricalData(budget, transactions, periodsBack?)` | `Budget`, `Transaction[]`, `number = 6` | `BudgetPeriodData[]`                                                      | ✅  |
| `calculateBudgetTrend(historicalData)`                        | `BudgetPeriodData[]`                    | `{ trend: 'improving'\|'worsening'\|'stable', changePercentage: number }` | ✅  |

---

## `src/lib/budget-templates.ts` ✅

Template predefiniti. Nessuna dipendenza web, usa `iconKey` semantiche e colori centralizzati.

### Tipi esportati

| Nome             | Tipo        | Descrizione                                                                                                                                                                             |
| ---------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BudgetTemplate` | `interface` | `id`, `nome`, `descrizione`, `importoSuggerito`, `periodo: BudgetPeriod`, `categorieTarget: string[]`, `iconKey: BudgetTemplateIconKey`, `color: string` (token) |

### Costanti esportate

| Nome               | Tipo               | Descrizione                                                                                                                  | RN                                  |
| ------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `BUDGET_TEMPLATES` | `BudgetTemplate[]` | 11 template predefiniti (spesa, ristoranti, trasporti, casa, svago, salute, abbonamenti, abbigliamento, elettronica, viaggi, budget totale) | ✅                                   |

---

## `src/lib/crypto.ts` ✅

Hashing PIN e cifratura dati. Dipendenze esterne: `bcryptjs`,
`@noble/ciphers`, `react-native-quick-crypto` (via `src/lib/kdf-provider.ts`).

| Funzione                                                                      | Parametri                                                | Ritorna                                                      | RN            |
| ----------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ | ------------- | -------------- | ------------- | -------------- | --- |
| `hashPin(pin)`                                                                | `string`                                                 | `Promise<string>` (bcrypt hash, salt 12)                     | ✅            |
| `verifyPin(pin, hash)`                                                        | `string`, `string`                                       | `Promise<boolean>`                                           | ✅            |
| `derivePinKey(pin, salt)`                                                     | `string`, `Uint8Array`                                   | `Uint8Array` (32 byte PBKDF2-SHA256, 600.000 iterazioni)     | ✅            |
| `generatePinSalt()`                                                           | —                                                        | `Uint8Array` (16 byte random)                                | ✅            |
| `generateMasterKey()`                                                         | —                                                        | `Uint8Array` (32 byte random)                                | ✅            |
| `encodeBase64(data)`                                                          | `Uint8Array`                                             | `string`                                                     | ✅            |
| `decodeBase64(data)`                                                          | `string`                                                 | `Uint8Array`                                                 | ✅            |
| `serializeWrappedMasterKeyPayload(payload)`                                   | `WrappedMasterKeyPayload`                                | `string` (JSON versionato)                                   | ✅            |
| `deserializeWrappedMasterKeyPayload(serialized)`                              | `string \| null`                                         | `WrappedMasterKeyPayload \| null`                            | ✅            |
| `wrapMasterKeyWithPin(masterKey, pin, salt)`                                  | `Uint8Array`, `string`, `Uint8Array`                     | `WrappedMasterKeyPayload`                                    | ✅            |
| `unwrapMasterKeyWithPin(serializedPayload, pin, salt)`                        | `string \| null`, `string`, `Uint8Array`                 | `Uint8Array`                                                 | ✅            |
| `rewrapMasterKeyWithPin(serializedPayload, oldPin, oldSalt, newPin, newSalt)` | `string`, `string`, `Uint8Array`, `string`, `Uint8Array` | `string`                                                     | ✅            |
| `encryptData(data, key)`                                                      | `string`, `string`                                       | `Promise<string>` (AES-GCM legacy: `Base64(IV[12]            | Ciphertext[N] | AuthTag[16])`) | ✅            |
| `decryptData(encryptedData, key)`                                             | `string`, `string`                                       | `Promise<string>`                                            | ✅            |
| `encryptDataPin(data, pin)`                                                   | `string`, `string`                                       | `Promise<string>` (payload versionato `Base64(KDF_VERSION[1] | SALT[16]      | IV[12]         | Ciphertext[N] | AuthTag[16])`) | ✅  |
| `decryptDataPin(encryptedData, pin)`                                          | `string`, `string`                                       | `Promise<string>`                                            | ✅            |

### Tipi esportati

| Nome                           | Tipo                  | Descrizione                                                                          |
| ------------------------------ | --------------------- | ------------------------------------------------------------------------------------ |
| `WrappedMasterKeyPayload`      | `type`                | Payload JSON `{ version, iv, ciphertext, tag }` della master key cifrata con il PIN  |
| `WrappedMasterKeyPayloadError` | `class extends Error` | Errore business per payload master key non configurato, malformato o non decifrabile |

---

## `src/lib/haptic-system.ts` ✅

Feedback aptico nativo basato su `expo-haptics` per Android e iOS, con no-op stub per Windows e persistenza preferenze in `AsyncStorage`.

### Tipi esportati

| Nome | Tipo | Descrizione |
| --- | --- | --- |
| `HapticFeedbackType` | `type` | Unione: `'success' \| 'error' \| 'warning' \| 'selection' \| 'impactLight' \| 'impactMedium' \| 'impactHeavy'` |
| `HapticSettings` | `interface` | `{ enabled: boolean }` |
| `IHapticSystem` | `interface` | Contratto dell'haptic system |

### Metodi pubblici della classe `HapticSystem` (implementa `IHapticSystem`)

| Metodo | Parametri | Ritorna | Descrizione |
| --- | --- | --- | --- |
| `isEnabled()` | — | `boolean` | Ritorna `true` se l'haptic è abilitato e supportato |
| `setEnabled(enabled)` | `boolean` | `Promise<void>` | Imposta e persiste la preferenza dell'haptic |
| `getSettings()` | — | `HapticSettings` | Ritorna le impostazioni correnti |
| `isSupported()` | — | `boolean` | Ritorna `true` se la piattaforma supporta la vibrazione (`Platform.OS !== 'windows'`) |
| `success()` | — | `Promise<void>` | Trigger feedback di notifica Success |
| `error()` | — | `Promise<void>` | Trigger feedback di notifica Error |
| `warning()` | — | `Promise<void>` | Trigger feedback di notifica Warning |
| `selection()` | — | `Promise<void>` | Trigger feedback di selezione |
| `impactLight()` | — | `Promise<void>` | Trigger feedback di impatto leggero |
| `impactMedium()` | — | `Promise<void>` | Trigger feedback di impatto medio |
| `impactHeavy()` | — | `Promise<void>` | Trigger feedback di impatto pesante |

### Compatibilità e metodi deprecati (Shim)

Il modulo espone 33 metodi legacy marcati come `@deprecated` per retrocompatibilità, mappati internamente sui nuovi feedback nativi (es. `click()`, `buttonPress()`, `pinSuccess()`, `pinError()`, `dialogOpen()`, ecc.).

**Singleton esportato**: `hapticSystem: HapticSystem`

---

## `src/lib/sound-system.ts` ❌

Sistema audio. Nessuna dipendenza esterna, usa Web Audio API (`AudioContext`).

### Tipo esportato

| Nome        | Tipo                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SoundType` | `type` — 48 valori (click, success, error, warning, notification, unlock/lock, income/expense/transfer, pin-error/success, private-unlock/lock, ...) |

### Classe `SoundSystem` — metodi pubblici

| Metodo                              | Parametri               | Ritorna   | RN                                            |
| ----------------------------------- | ----------------------- | --------- | --------------------------------------------- |
| `initFromSettings(enabled, volume)` | `boolean`, `number`     | `void`    | ⚠️ (logica pura ma presuppone `AudioContext`) |
| `configure(callbacks)`              | `AudioPersistCallbacks` | `void`    | ✅                                            |
| `play(soundType)`                   | `SoundType`             | `void`    | ❌ (`AudioContext`)                           |
| `setEnabled(enabled)`               | `boolean`               | `void`    | ✅                                            |
| `setVolume(volume)`                 | `number`                | `void`    | ⚠️                                            |
| `isEnabled()`                       | —                       | `boolean` | ✅                                            |
| `getVolume()`                       | —                       | `number`  | ✅                                            |

**Singleton esportato**: `soundSystem: SoundSystem`

> Interfaccia pubblica portabile. Implementazione da riscrivere con `expo-av` o `react-native-sound`.

---

## `src/lib/screen-reader.ts` — RIMOSSO

File rimosso (DESIGN 004). Sostituito dal layer semantico
`src/announcements/` che dispatcha verso `src/accessibility/engine.ts`
tramite `AccessibilityInfo.announceForAccessibility()` di React Native.

Vedi `src/announcements/index.ts` per la nuova API: `announce()`,
`ui.*`, `auth.*`, `accounts.*`, `budgets.*`.

---

## `src/lib/export-service.ts` ⚠️

API pubblica di export file multi-piattaforma (DESIGN 009, DESIGN
009-native).

```typescript
type ExportFailureReason =
  | 'ALREADY_IN_PROGRESS'
  | 'CANCELLED'
  | 'PERMISSION_DENIED'
  | 'FILESYSTEM_ERROR'
  | 'UNSUPPORTED_PLATFORM'
  | 'INVALID_PATH'
  | 'INSUFFICIENT_SPACE'
  | 'UNKNOWN';

type ExportResult =
  | { success: true }
  | { success: false; reason: ExportFailureReason };

export async function exportFile(
  content: string,
  fileName: string,
  mimeType: string,
): Promise<ExportResult>;
```

- **iOS / Android**: share sheet nativa via `react-native-share`
  (data URL base64).
- **Windows**: `WinRTSavePicker.pickSavePath` (vedi `src/native/`) +
  scrittura via `@react-native-windows/fs` (opzionale, fallback
  `UNSUPPORTED_PLATFORM` se assente).
- **Default**: `{ success: false, reason: 'UNSUPPORTED_PLATFORM' }`.
- **Guardia concorrente**: se un export è già in corso, `exportFile()`
  ritorna subito `{ success:false, reason:'ALREADY_IN_PROGRESS' }`.

INV-2: nessun side effect UX (toast, sound, haptic). INV-4: nessun
throw non catturato. INV-CANCEL: cancellazione utente → reason
`CANCELLED`, mai `success: true`. INV-CA-4: il flag interno di guardia
è sempre rilasciato nel blocco `finally`, anche per errori non-`Error`.

Stato: ramo Windows validato via test mock-based; build Windows
runtime bloccata da [DT-009-N-01](todo-master.md#dt-009-n-01--blocker-build-windows-netinfo--windows-app-sdk-18x).

---

## `src/native/WinRTSavePicker/` ⚠️ (Windows-only runtime)

Contratto TypeScript del modulo TurboModule nativo per il WinRT
`FileSavePicker` (DESIGN 009-native).

```typescript
interface FileTypeChoice {
  description: string;
  extensions: string[]; // es. ['.csv', '.txt']
}

interface PickSavePathOptions {
  fileTypeChoices: FileTypeChoice[];
  suggestedFileName?: string;
  defaultExtension?: string;
}

type PickSavePathResult =
  | { status: 'SUCCESS'; path: string }
  | { status: 'USER_CANCELLED' }
  | { status: 'PICKER_UNAVAILABLE' }
  | { status: 'INVALID_ARGUMENT'; code: 'EMPTY_CHOICES' | 'INVALID_EXT' }
  | {
      status: 'INTERNAL_ERROR';
      code:
        | 'DISPATCHER_DETACHED'
        | 'INVALID_FILENAME'
        | 'HRESULT_E_FAIL'
        | 'STD_EXCEPTION'
        | 'UNKNOWN_EXCEPTION';
    };

interface WinRTSavePickerSpec {
  pickSavePath(options: PickSavePathOptions): Promise<PickSavePathResult>;
}
```

- **Export**: `import { WinRTSavePicker, type FileTypeChoice, type
PickSavePathOptions, type PickSavePathResult } from '@/native'`.
- **Variant Metro**: `WinRTSavePicker.windows.ts` carica il
  TurboModule nativo. `WinRTSavePicker.macos.ts` /
  `WinRTSavePicker.stub.ts` ritornano sempre `{ status:
'PICKER_UNAVAILABLE' }`.
- **Invarianti**: INV-L10 (nessuna stringa localizzata sul bridge),
  INV-CANCEL (`USER_CANCELLED` ≠ failure), INV-THREAD (chiamabile
  da JS thread; il bridge nativo marshalla su UI thread via
  `ReactContext.UIDispatcher().Post()`), INV-FILENAME
  (`suggestedFileName` pass-through opaco; sanitization a carico
  del chiamante).
- **Bridge nativo**: `windows/ZecchinoReact/WinRTSavePickerModule
.{h,cpp}` (TurboModule attribute-based, registrato via
  `AddAttributedModules(builder, true)`).

Stato: contratto TS completo. Bridge nativo completo, runtime
non validato (vedi
[DT-009-N-01](todo-master.md#dt-009-n-01--blocker-build-windows-netinfo--windows-app-sdk-18x)).

---

## `src/lib/supabase/types.ts` ✅

Tipi DB e di settings. Uso interno al layer `src/lib/supabase/`.

### Classi e tipi esportati

| Nome                                                                                                                                                                                            | Tipo                  | Descrizione                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `RepositoryError`                                                                                                                                                                               | `class extends Error` | Wrapper errori Supabase/PostgREST. Proprietà: `code`, `details`, `hint`, `pgError?`. Costruttore: `(cause: DbError \| string)` |
| `TalkBackAdaptations`                                                                                                                                                                           | `interface`           | 8 flag booleani per adattamenti TalkBack                                                                                       |
| `UserPreferences`                                                                                                                                                                               | `interface`           | 32 chiavi JSONB: display (12), sr (12), audio (2), talkback (2), session (2), onboarding (1), alert (1)                        |
| `UserSettings`                                                                                                                                                                                  | `interface`           | `nomeVisualizzato`, `valutaDefault`, `pinPrivatoHash`, `pinKdfSalt`, `pinMasterKeyEncrypted`, `preferences: UserPreferences`   |
| `DbAccount`, `DbTransaction`, `DbCategory`, `DbBudget`, `DbSavingsGoal`, `DbSavingsGoalProgress`, `DbRecurrence`, `DbTag`, `DbTransactionTag`, `DbNotification`, `DbAllegato`, `DbUserSettings` | `interface`           | Row types snake_case — **uso interno** al layer supabase                                                                       |

---

## `src/lib/supabase/client.ts` ✅\*

Singleton Supabase. Dipendenza: `@supabase/supabase-js`.

> ✅ **DESIGN 001 risolto**: il client importa `SUPABASE_URL` e `SUPABASE_ANON_KEY` dal modulo `@env` (plugin Babel `react-native-dotenv` configurato in `babel.config.js`). Mantenuto il `throw` immediato come guardia.

### Esportazioni

| Nome       | Tipo             | Descrizione                            |
| ---------- | ---------------- | -------------------------------------- |
| `supabase` | `SupabaseClient` | Client singleton — autenticato con RLS |

---

## `src/lib/supabase/cache.ts` ✅

Cache locale basata su `AsyncStorage`. Dipendenza esterna: `@react-native-async-storage/async-storage`.

### Tipi esportati

| Nome            | Tipo                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `CacheTable`    | `'conti' \| 'transazioni' \| 'categorie' \| 'budget' \| 'obiettivi_risparmio' \| 'ricorrenze' \| 'tag' \| 'transazioni_tag' \| 'notifiche'` |
| `CacheEntry<T>` | `{ data: T, cachedAt: string, version: number }`                                                                                            |

### Costanti

| Nome           | Valore                |
| -------------- | --------------------- |
| `CACHE_TTL_MS` | `86_400_000` (24 ore) |

### Funzioni esportate

| Funzione                              | Parametri                         | Ritorna                          | RN  |
| ------------------------------------- | --------------------------------- | -------------------------------- | --- |
| `writeCache<T>(userId, table, data)`  | `string`, `CacheTable`, `T`       | `Promise<void>`                  | ✅  |
| `readCache<T>(userId, table)`         | `string`, `CacheTable`            | `Promise<CacheEntry<T> \| null>` | ✅  |
| `isCacheStale(userId, table, ttlMs?)` | `string`, `CacheTable`, `number?` | `Promise<boolean>`               | ✅  |
| `getCacheTtlMs(table)`                | `CacheTable`                      | `number`                         | ✅  |
| `invalidateCache(userId)`             | `string`                          | `Promise<void>`                  | ✅  |

---

## `src/lib/supabase/repositories/conti.ts` ✅

CRUD conti correnti. Dipendenza: `@supabase/supabase-js`, `../client`, `../types`.

| Funzione            | Parametri                                | Ritorna              |
| ------------------- | ---------------------------------------- | -------------------- |
| `getAll()`          | —                                        | `Promise<Account[]>` |
| `getById(id)`       | `string`                                 | `Promise<Account>`   |
| `create(input)`     | `Omit<Account, 'id'>`                    | `Promise<Account>`   |
| `update(id, input)` | `string`, `Partial<Omit<Account, 'id'>>` | `Promise<Account>`   |
| `remove(id)`        | `string`                                 | `Promise<void>`      |

---

## `src/lib/supabase/repositories/transazioni.ts` ✅

CRUD transazioni. Dipendenza: `@supabase/supabase-js`, `../client`, `../types`.

> Supporta filtri opzionali `TransactionFilters` (tipo, contoId, categoriaId, dateRange).

| Funzione            | Parametri                                                 | Ritorna                  |
| ------------------- | --------------------------------------------------------- | ------------------------ |
| `getAll(filtri?)`   | `TransactionFilters?`                                     | `Promise<Transaction[]>` |
| `getById(id)`       | `string`                                                  | `Promise<Transaction>`   |
| `create(input)`     | `Omit<Transaction, 'id' \| 'cifrato'>`                    | `Promise<Transaction>`   |
| `update(id, input)` | `string`, `Partial<Omit<Transaction, 'id' \| 'cifrato'>>` | `Promise<Transaction>`   |
| `remove(id)`        | `string`                                                  | `Promise<void>`          |

---

## `src/lib/supabase/repositories/categorie.ts` ✅

CRUD categorie. Dipendenza: `@supabase/supabase-js`.

| Funzione                  | Parametri                                 | Ritorna               |
| ------------------------- | ----------------------------------------- | --------------------- |
| `getAll()`                | —                                         | `Promise<Category[]>` |
| `create(input)`           | `Omit<Category, 'id'>`                    | `Promise<Category>`   |
| `update(id, input)`       | `string`, `Partial<Omit<Category, 'id'>>` | `Promise<Category>`   |
| `remove(id)`              | `string`                                  | `Promise<void>`       |
| `seedDefaultCategories()` | —                                         | `Promise<void>`       |

---

## `src/lib/supabase/repositories/budget.ts` ✅

CRUD budget. Dipendenza: `@supabase/supabase-js`.

| Funzione            | Parametri                               | Ritorna                                               |
| ------------------- | --------------------------------------- | ----------------------------------------------------- |
| `getAll()`          | —                                       | `Promise<Budget[]>` (ordinati per `data_inizio` desc) |
| `getById(id)`       | `string`                                | `Promise<Budget>`                                     |
| `create(input)`     | `Omit<Budget, 'id'>`                    | `Promise<Budget>`                                     |
| `update(id, input)` | `string`, `Partial<Omit<Budget, 'id'>>` | `Promise<Budget>`                                     |
| `remove(id)`        | `string`                                | `Promise<void>`                                       |

---

## `src/lib/supabase/repositories/obiettivi-risparmio.ts` ✅

CRUD obiettivi di risparmio. Dipendenza: `@supabase/supabase-js`.

| Funzione                              | Parametri                                    | Ritorna                              |
| ------------------------------------- | -------------------------------------------- | ------------------------------------ |
| `getAll()`                            | —                                            | `Promise<SavingsGoal[]>`             |
| `getById(id)`                         | `string`                                     | `Promise<SavingsGoal>`               |
| `create(input)`                       | `Omit<SavingsGoal, 'id'>`                    | `Promise<SavingsGoal>`               |
| `update(id, input)`                   | `string`, `Partial<Omit<SavingsGoal, 'id'>>` | `Promise<SavingsGoal>`               |
| `updateProgress(id, importoCorrente)` | `string`, `number`                           | `Promise<SavingsGoal>` (RPC atomica) |
| `remove(id)`                          | `string`                                     | `Promise<void>`                      |

---

## `src/lib/supabase/repositories/impostazioni-utente.ts` ✅

Lettura/scrittura preferenze utente. Dipendenza: `@supabase/supabase-js`.

| Funzione                              | Parametri                                                                | Ritorna                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `getOrCreate()`                       | —                                                                        | `Promise<UserSettings>` (insert idempotente, gestisce race condition 23505)            |
| `updateField(campo, valore)`          | `keyof Omit<UserSettings,'preferences'>`, `string \| null`               | `Promise<UserSettings>`                                                                |
| `updatePreference(chiave, valore)`    | `keyof UserPreferences`, `boolean \| number \| string \| object \| null` | `Promise<UserSettings>` (merge JSONB atomico via RPC)                                  |
| `updatePinHash(hash)`                 | `string \| null`                                                         | `Promise<void>`                                                                        |
| `updatePinSalt(salt)`                 | `string \| null`                                                         | `Promise<void>`                                                                        |
| `updatePinHashAndSalt(hash, salt)`    | `string \| null`, `string \| null`                                       | `Promise<void>` (legacy reset-only; i flussi attivi usano `updatePinSecurityMaterial`) |
| `updatePinSecurityMaterial(material)` | `{ hash, salt, encryptedMasterKey }`                                     | `Promise<void>` (update atomico dei tre campi PIN; rifiuta stati parziali)             |

---

## `src/lib/supabase/repositories/ricorrenze.ts` ✅

Repository delle ricorrenze pianificate. Dipendenze: `@supabase/supabase-js`, `../client`, `../types`, `@/locales`.

> Espone solo delete logico tramite `deactivate(id)`. `getDue()` applica i filtri su `prossima_generazione`, `attiva` e `data_fine` direttamente nella query Supabase.

| Funzione                   | Parametri                                   | Ritorna                 |
| -------------------------- | ------------------------------------------- | ----------------------- |
| `getAll(filters?)`         | `RecurrenceFilters?`                        | `Promise<Recurrence[]>` |
| `getById(id)`              | `string`                                    | `Promise<Recurrence>`   |
| `getDue(dataRiferimento?)` | `string?`                                   | `Promise<Recurrence[]>` |
| `create(input)`            | `Omit<Recurrence, 'id'>`                    | `Promise<Recurrence>`   |
| `update(id, input)`        | `string`, `Partial<Omit<Recurrence, 'id'>>` | `Promise<Recurrence>`   |
| `deactivate(id)`           | `string`                                    | `Promise<Recurrence>`   |

---

## `src/lib/supabase/repositories/tag.ts` ✅

Repository CRUD dei tag utente. Dipendenze: `@supabase/supabase-js`, `../client`, `../types`, `@/locales`.

| Funzione            | Parametri                                             | Ritorna          |
| ------------------- | ----------------------------------------------------- | ---------------- |
| `getAll()`          | —                                                     | `Promise<Tag[]>` |
| `getById(id)`       | `string`                                              | `Promise<Tag>`   |
| `create(input)`     | `Omit<Tag, 'id' \| 'usatoNVolte'>`                    | `Promise<Tag>`   |
| `update(id, input)` | `string`, `Partial<Omit<Tag, 'id' \| 'usatoNVolte'>>` | `Promise<Tag>`   |
| `remove(id)`        | `string`                                              | `Promise<void>`  |

---

## `src/lib/supabase/repositories/transazioni-tag.ts` ✅

Repository delle associazioni tag-transazione. Dipendenze: `@supabase/supabase-js`, `../client`, `../types`, `@/locales`.

| Funzione                                       | Parametri            | Ritorna                             |
| ---------------------------------------------- | -------------------- | ----------------------------------- |
| `getTagsForTransaction(transactionId)`         | `string`             | `Promise<string[]>`                 |
| `getTagMapForTransactions(transactionIds)`     | `string[]`           | `Promise<Record<string, string[]>>` |
| `setTagsForTransaction(transactionId, tagIds)` | `string`, `string[]` | `Promise<void>`                     |
| `addTag(transactionId, tagId)`                 | `string`, `string`   | `Promise<void>`                     |
| `removeTag(transactionId, tagId)`              | `string`, `string`   | `Promise<void>`                     |

---

## `src/lib/supabase/repositories/notifiche.ts` ✅

Repository delle notifiche persistite. Dipendenze: `@supabase/supabase-js`, `../client`, `../types`, `@/locales`.

> **Nota sui campi**: i campi `titolo_key` e `messaggio_key` memorizzano chiavi di localizzazione, non testo renderizzato. Il campo `livello` accetta i valori del tipo `NotificationLevel`: `warning`, `critical`, `exceeded`. La funzione `existsUnreadForEntityLevel` accetta il parametro `level` di tipo `NotificationLevel`.

| Funzione                               | Parametri                                                  | Ritorna                      |
| -------------------------------------- | ---------------------------------------------------------- | ---------------------------- |
| `getAll()`                             | —                                                          | `Promise<AppNotification[]>` |
| `getUnreadCount()`                     | —                                                          | `Promise<number>`            |
| `getUnreadByEntity(filters)`           | `NotificationEntityFilters`                                | `Promise<AppNotification[]>` |
| `existsUnreadForEntityLevel(filters)`  | `NotificationEntityFilters & { level: NotificationLevel }` | `Promise<boolean>`           |
| `markAsRead(id)`                       | `string`                                                   | `Promise<AppNotification>`   |
| `markAllAsRead(filters?)`              | `Partial<NotificationEntityFilters>`                       | `Promise<void>`              |
| `create(input)`                        | `NotificationCreateInput`                                  | `Promise<AppNotification>`   |
| `remove(id)`                           | `string`                                                   | `Promise<void>`              |
| `removeExpired(referenceDate?)`        | `string?`                                                  | `Promise<void>`              |
| `cleanupReadExpiredBefore(cutoffDate)` | `string`                                                   | `Promise<void>`              |

---

## `src/lib/supabase/storage.ts` ✅

Boundary storage per allegati transazioni. Valida MIME/estensione, genera path fisico sicuro, carica su bucket privato e produce signed URL temporanee.

| Funzione                                        | Parametri                                 | Ritorna                             |
| ----------------------------------------------- | ----------------------------------------- | ----------------------------------- |
| `validateAttachmentFile(file)`                  | `AttachmentFileInput`                     | `AttachmentValidationError \| null` |
| `uploadAttachment(userId, transazioneId, file)` | `string`, `string`, `AttachmentFileInput` | `Promise<AttachmentUploadResult>`   |
| `deleteAttachment(storagePath)`                 | `string`                                  | `Promise<void>`                     |
| `getAttachmentSignedUrl(storagePath)`           | `string`                                  | `Promise<string>`                   |

---

## `src/lib/supabase/repositories/allegati.ts` ✅

Repository cross-system per allegati transazioni. Coordina upload Storage e record DB con rollback best-effort.

| Funzione                | Parametri             | Ritorna               |
| ----------------------- | --------------------- | --------------------- |
| `getAll(transazioneId)` | `string`              | `Promise<Allegato[]>` |
| `getById(id)`           | `string`              | `Promise<Allegato>`   |
| `create(input)`         | `AllegatoCreateInput` | `Promise<Allegato>`   |
| `remove(id)`            | `string`              | `Promise<void>`       |

---

## `src/lib/storage-cleanup-service.ts` ✅

Service di cleanup automatico dei file orfani nello storage allegati. Nessun side effect UI; logging solo tecnico.

| Nome                        | Tipo    | Descrizione                                 |
| --------------------------- | ------- | ------------------------------------------- |
| `CLEANUP_RECENCY_HOURS`     | `const` | `48`                                        |
| `MAX_FILES_PER_SCAN`        | `const` | `100`                                       |
| `MIN_CLEANUP_INTERVAL_MS`   | `const` | `900000`                                    |
| `CLEANUP_SAFETY_WINDOW_MS`  | `const` | `180000`                                    |
| `CLEANUP_LOGOUT_TIMEOUT_MS` | `const` | `1500`                                      |
| `CleanupResult`             | `type`  | `{ scanned, orphanFound, deleted, failed }` |

| Funzione                                   | Parametri                      | Ritorna                                                                                                     |
| ------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `createStorageCleanupService(customDeps?)` | `Partial<StorageCleanupDeps>?` | service con `cleanupSpecificOrphan`, `cleanupRecentOrphans`, `cleanupTransactionOrphans`, `cleanupOnLogout` |

---

## `src/lib/file-system/magic-bytes-reader.ts` ✅

Reader base fail-closed per piattaforme non supportate e helper di confronto firme.

| Funzione                              | Parametri                | Ritorna               |
| ------------------------------------- | ------------------------ | --------------------- |
| `matchesSignature(header, signature)` | `Uint8Array`, `number[]` | `boolean`             |
| `readFileHeader(uri)`                 | `string`                 | `Promise<Uint8Array>` |

---

## `src/lib/notification-service.ts` ✅

Layer di orchestrazione notifiche. Coordina deduplicazione, escalation replace, hydration unread e cleanup post-READY.

| Funzione                      | Parametri | Ritorna                                                                                                              |
| ----------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------- |
| `createNotificationService()` | —         | oggetto service con `reset`, `hydrateUnreadNotifications`, `cleanupReadyNotifications`, `processBudgetNotifications` |

## `src/context/AuthContext.tsx` ⚠️

Provider auth + gestione PIN privato.  
**Import problematici risolti (DESIGN 001)**: `sonner` sostituito da shim locale `sonnerNotify`; `@/components/ui/button` ora esiste come placeholder RN (`src/components/ui/button.tsx`). PLAN 010 estende `setPin`, `changePin` e `removePin` con wrapped master key, persistenza atomica dei tre campi PIN e reset distruttivo con logout globale.

### Hook esportato

`useAuth(): AuthContextValue`

### `AuthContextValue` — campi principali

| Campo                           | Tipo                   | Descrizione                                                                 |
| ------------------------------- | ---------------------- | --------------------------------------------------------------------------- |
| `user`                          | `User \| null`         | Utente Supabase Auth                                                        |
| `session`                       | `Session \| null`      | Sessione corrente                                                           |
| `isAuthReady`                   | `boolean`              | Auth inizializzata                                                          |
| `isAuthenticated`               | `boolean`              |                                                                             |
| `needsOnboarding`               | `boolean`              | Primo accesso senza `nomeVisualizzato`                                      |
| `userSettings`                  | `UserSettings \| null` | Settings letti da Supabase                                                  |
| `isPrivateEnabled`              | `boolean`              | PIN privato configurato con hash, salt e wrapped master key coerenti        |
| `isPrivateUnlocked`             | `boolean`              | Sezione privata sbloccata                                                   |
| `inactivityTimeout`             | `number`               | Minuti di inattività                                                        |
| `signIn(email, password)`       | `async`                | `Promise<void>`                                                             |
| `signUp(email, password)`       | `async`                | `Promise<void>`                                                             |
| `signOut()`                     | `async`                | `Promise<void>` (invalida cache)                                            |
| `resetPassword(email)`          | `async`                | `Promise<void>`                                                             |
| `unlockPrivate(pin)`            | `async`                | `Promise<void>`                                                             |
| `lockPrivate()`                 | —                      | `void`                                                                      |
| `setPin(pin)`                   | `async`                | `Promise<void>`                                                             |
| `changePin(oldPin, newPin)`     | `async`                | `Promise<void>`                                                             |
| `removePin(pin)`                | `async`                | `Promise<void>` (azzera i tre campi PIN e richiede logout globale Supabase) |
| `setInactivityTimeout(minutes)` | `async`                | `Promise<void>`                                                             |
| `completeOnboarding()`          | —                      | `void`                                                                      |

### Provider esportato

`AuthProvider({ children })` — avvolge il grafo componenti nell'albero.

---

## `src/context/AppDataContext.tsx` ⚠️

Provider CRUD dati di dominio + gestione dialog.  
**Import problematici risolti (DESIGN 001)**: `sonner` sostituito da shim locale `toast` callable con metodi `success`/`error`/`warning`.  
**Bug N9 RISOLTO (PLAN 007 v0.2.0)**: hydration cache ora completamente
asincrona con `await Promise.all([...])` su tutte le 5 tabelle e
validazione strutturale (`Array.isArray && !Promise`). Aggiunti:
state machine bootstrap a 6 stati (`IDLE | HYDRATING | CACHE-READY |
REMOTE-SYNC | READY | ERROR`), generation counter contro hydration
concorrenti, `writeCache` fail-soft per-tabella.  
**PLAN 011**: bootstrap separato in tre casi (`offline`, `online`, `NetInfo init`), timeout remoto nominato a 10 secondi e codici interni `ERROR_NETWORK` / `ERROR_DATA` confinati al modulo; la UI riceve solo messaggi localizzati.

### Hook esportato

`useAppData(): AppDataContextValue`

### `AppDataContextValue` — campi principali

| Campo                                                                                                                 | Tipo                                                 | RN                                                                 |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `accounts`, `transactions`, `categories`, `budgets`, `savingsGoals`, `ricorrenze`, `tags`                             | array di dominio                                     | ✅                                                                 |
| `transactionTagMap`                                                                                                   | `Record<string, string[]>`                           | ✅                                                                 |
| `safeAccounts`, `safeTransactions`, `safeCategories`, `safeBudgets`, `safeSavingsGoals`, `safeRicorrenze`, `safeTags` | memo delle stesse                                    | ✅                                                                 |
| `safeTransactionTagMap`                                                                                               | `Record<string, string[]>`                           | ✅                                                                 |
| `isLoading`, `error`, `isDataReady`                                                                                   | `boolean`, `string\|null`, `boolean`                 | ✅ (PLAN 007: aggiornati atomicamente da `transitionTo()`)         |
| `addAccount`, `updateAccount`, `removeAccount`                                                                        | `async`                                              | ✅                                                                 |
| `addTransaction`, `updateTransaction`, `removeTransaction`                                                            | `async`                                              | ✅                                                                 |
| `addCategory`, `updateCategory`, `removeCategory`                                                                     | `async`                                              | ✅                                                                 |
| `addBudget`, `updateBudget`, `removeBudget`                                                                           | `async`                                              | ✅                                                                 |
| `addSavingsGoal`, `updateSavingsGoal`, `updateSavingsGoalProgress`, `removeSavingsGoal`                               | `async`                                              | ✅                                                                 |
| `addTag`, `updateTag`, `removeTag`                                                                                    | `async`                                              | ✅                                                                 |
| `addTagToTransaction`, `removeTagFromTransaction`, `setTagsForTransaction`                                            | `async`                                              | ✅                                                                 |
| `refreshAll()`                                                                                                        | `void` (no-op se `HYDRATING`/`REMOTE-SYNC` in corso) | ✅                                                                 |
| `handleExportCSV(visibleTransactions, visibleAccounts)`                                                               | `Promise<void>`                                      | ✅ (usa `exportToCSV` + `exportFile`, branching su `ExportResult`) |
| Dialog state/setters (`editingTransaction`, `showTransactionDialog`, ecc.)                                            | vari                                                 | ✅                                                                 |

### Provider esportato

`AppDataProvider({ children })` — richiede `AuthProvider` come antenato.

---

## `src/context/app-data-cache.ts` ✅

Modulo isolato per testabilità (PLAN 007 T7). Nessuna dipendenza React.

### Esporti

- `type DomainSnapshot` — shape `{ accounts, transactions, categories, budgets, savingsGoals }`.
- `async function readCachedDomainSnapshotPure(userId: string): Promise<{ snapshot: DomainSnapshot; isStale: boolean } | null>` —
  legge le 5 cache con `await Promise.all`, valida struttura
  (`Array.isArray && !Promise`), restituisce `null` su qualunque miss
  o snapshot corrotto. Ri-esportata da `AppDataContext` per back-compat.

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

| Campo                                      | Tipo                                  |
| ------------------------------------------ | ------------------------------------- |
| `visibleCategories`                        | `string[]`                            |
| `dismissedBudgetAlerts`                    | `string[]`                            |
| `isSettingsReady`, `isSettingsLoading`     | `boolean`                             |
| `settingsError`                            | `string \| null`                      |
| `audioEnabled`                             | `boolean`                             |
| `audioVolume`                              | `number` (0–1)                        |
| `displayPreferences`                       | `DisplayPreferences` (12 chiavi)      |
| `screenReaderPreferences`                  | `ScreenReaderPreferences` (12 chiavi) |
| `talkBackAdaptations`                      | `TalkBackAdaptations`                 |
| `talkBackManualOverride`                   | `boolean \| null`                     |
| `setVisibleCategories(ids)`                | `async`                               |
| `dismissBudgetAlert(budgetId)`             | `async`                               |
| `resetDismissedAlerts()`                   | `async`                               |
| `setAudioEnabled(v)`                       | `async`                               |
| `setAudioVolume(v)`                        | `async`                               |
| `setDisplayPreference<K>(key, value)`      | `async`                               |
| `setScreenReaderPreference<K>(key, value)` | `async`                               |
| `setTalkBackAdaptations(adaptations)`      | `async`                               |
| `setTalkBackManualOverride(v)`             | `async`                               |
| `resetScreenReaderPreferences()`           | `async`                               |

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

## `src/hooks/use-haptic.ts` ✅

Wrapper hook su `hapticSystem`. Consente di leggere le impostazioni correnti dell'haptic ed abilitarlo/disabilitarlo con reattività React.

---

## `src/hooks/use-screen-reader.ts` — RIMOSSO

File rimosso (DESIGN 004). Sostituito dalle funzioni builder esposte da
`src/announcements/{ui,auth,accounts,budgets}.ts` e dal dispatcher
`announce()` di `src/announcements/index.ts`.

---

## `src/hooks/use-network-status.ts` ✅

Hook pubblico per il consumo dello stato di connettività di rete centralizzato (`NetworkStatusProvider`). Sostituisce `useOnlineStatus` (rimosso in PLAN 008).

```ts
export type NetworkStatus = {
  isOffline: boolean;
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string;
  isInitialized: boolean;
};

export function useNetworkStatus(): NetworkStatus;
```

**Semantica `isOffline`** (DESIGN 008 §5, INV-7):
`isOffline === true` se `isConnected === false | null` **oppure** `isInternetReachable === false`. Il caso captive portal (`isConnected === true && isInternetReachable === false`) è trattato come offline. Il caso `isInternetReachable === null` è online-first (non determinato → consuma come online).

**Errori**: lancia `Error('useNetworkStatus must be used within NetworkStatusProvider')` se invocato fuori dal provider.

> Provider associato: `NetworkStatusProvider`, esposto da `src/context/NetworkStatusContext.tsx` ed inserito in `App.tsx` come antenato di `AuthProvider`.

---

## `src/hooks/use-inactivity-timer.ts` ✅

Timer inattività su API RN native. Le sottoscrizioni agli eventi di
attività utente non sono più qui: vivono in `ActivityDetectorView`
(montato da `AuthProvider` quando l'utente è autenticato) che invoca
`resetTimer()` al touch/keydown.

```ts
useInactivityTimer({ timeoutMinutes, onTimeout }): { resetTimer(), showWarning: boolean }
```

> DESIGN 002 (STEP 002, commit N6): rimossi `window.setTimeout`/`window.clearTimeout`
> e il blocco `document.addEventListener` nell'`useEffect` (delegato a `ActivityDetectorView`).
> I ref restano `useRef<number | null>` perché `setTimeout` RN restituisce `number`.

---

## `src/components/ActivityDetectorView.tsx` ✅

View RN che intercetta gli eventi di attività utente per resettare il timer
di inattività, senza catturare il responder (gli eventi proseguono ai figli).

```ts
ActivityDetectorView({ onActivity: () => void, children: ReactNode }): JSX.Element
```

- `onStartShouldSetResponder` → chiama `onActivity` e restituisce `false`
- `onMoveShouldSetResponder` → `false`
- `onKeyDown` aggiunto solo su `Platform.OS === 'windows'` (navigazione Narrator da tastiera)

> Creato in DESIGN 002 (STEP 002, commit N6) per disaccoppiare la detection
> dell'attività dal hook `useInactivityTimer`.

---

## `src/accessibility/types.ts` ✅

Tipi condivisi tra engine.ts, detection.ts e il futuro layer announcements/ (DESIGN 004).
Nessuna dipendenza esterna.

| Nome                   | Tipo        | Descrizione                                                                                                                                                                       |
| ---------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AnnouncementPriority` | `type`      | `'polite' \| 'assertive'`                                                                                                                                                         |
| `Announcement`         | `interface` | `{ text: string; priority: AnnouncementPriority }`                                                                                                                                |
| `TalkBackState`        | `interface` | `{ isEnabled, isDetected, confidenceLevel: 'high'\|'low', adaptationsActive: boolean }`                                                                                           |
| `TalkBackAdaptations`  | `interface` | 8 booleani: `enhancedTouchTargets`, `simplifiedNavigation`, `extendedTimeouts`, `verboseDescriptions`, `highContrastMode`, `reducedMotion`, `autoFocusManagement`, `spatialAudio` |

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

## `src/announcements/` ✅ (DESIGN 004)

Layer semantico per annunci accessibili. Unico path autorizzato a
importare `@/accessibility/engine` (invariante architetturale ADR_001).

### `src/announcements/index.ts`

```ts
import { engine } from '@/accessibility/engine';
import type { Announcement } from './types';

export type { Announcement, AnnouncementPriority, ActionType } from './types';
export { actionKeyMap } from './types';

export function announce(announcement: Announcement): void;

export * as ui from './ui';
export * as auth from './auth';
export * as accounts from './accounts';
export * as budgets from './budgets';
```

`announce()` delega a `engine.announce()` (fire-and-forget,
`AccessibilityInfo.announceForAccessibility`).

### `src/announcements/types.ts`

Re-esporta `Announcement` e `AnnouncementPriority` da
`@/accessibility/types` via `import type`. Definisce `ActionType`
(`'modifica' | 'elimina' | 'crea' | 'aggiunge' | 'salva'`) e
`actionKeyMap: Record<ActionType, StringKey>`.

### Builder per dominio

Ogni modulo espone funzioni pure che ritornano `Announcement`
`{ text, priority }`. Nessuno importa l'engine.

| Modulo        | Funzioni | Note                                                                                                                                                                   |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui.ts`       | 26       | builder generici (focus, navigazione, dialog, filtri, ordinamenti, conteggi)                                                                                           |
| `auth.ts`     | 8        | `pinNotConfigured`, `pinInvalid`, `privateUnlocked`, `privateAccountLocked`, `pinSet`, `pinChanged`, `pinRemoved`, `sessionKept` — priority `assertive` per errori PIN |
| `accounts.ts` | 14       | `announceAccountCreated/Modified/Deleted`, `announceTransaction*`, `announceExportCSV`, ecc.                                                                           |
| `budgets.ts`  | 12       | `announceBudgetCreated/Modified/Deleted/Status`, `announceSavingsGoal*` — soglie `assertive` a >=100/90                                                                |

### Utility private (`_utils/`)

`t.ts`, `currency.ts`, `dates.ts`, `plurals.ts` — pure, nessuna
dipendenza da engine.

---

## ~~`src/hooks/use-talkback.ts`~~ ❌ (ELIMINATO — DESIGN 003)

File rimosso. Sostituito da `src/accessibility/detection.ts`.
Usava API browser incompatibili con React Native (`window.matchMedia`, `sessionStorage`, `speechSynthesis`, `navigator.userAgent`).

---

## `src/lib/loan-calculator.ts` ✅

Calcolo piano di ammortamento per prestiti e mutui.

| Funzione                      | Parametri            | Ritorna              |
| ----------------------------- | -------------------- | -------------------- |
| `calcolaAmmortamento(config)` | `config: LoanConfig` | `RataAmmortamento[]` |

### Dettagli implementazione

Supporta il metodo francese (rata costante) e il metodo italiano (quota capitale costante). Restituisce un array di rate con i campi: `numero`, `dataScadenza`, `quotaCapitale`, `quotaInteressi`, `rata`, `capitaleResiduo`.

---

## `src/lib/monthly-comparison.ts` ✅

Confronto spese mese su mese per categoria.

| Funzione                                        | Parametri                                                          | Ritorna               |
| ----------------------------------------------- | ------------------------------------------------------------------ | --------------------- |
| `calcolaConfrontoMensile(corrente, precedente)` | `corrente: SpesaPerCategoria[]`, `precedente: SpesaPerCategoria[]` | `MonthlyComparison[]` |

### Dettagli implementazione

Ogni elemento restituito contiene: `categoriaId`, `nomeMese`, `totaleCorrente`, `totalePrecedente`, `deltaAssoluto`, `deltaPercentuale`.

---

## `src/lib/budget-notification-config.ts` ✅

Costanti di configurazione per le soglie di notifica budget.

### Costanti e Tipi Esportati

| Nome                             | Tipo / Valore                                     | Descrizione                |
| -------------------------------- | ------------------------------------------------- | -------------------------- |
| `BUDGET_NOTIFICATION_THRESHOLDS` | `{ warning: 0.8, critical: 0.95, exceeded: 1.0 }` | Soglie di notifica budget  |
| `NotificationLevel`              | `'warning' \| 'critical' \| 'exceeded'`           | Livello di notifica budget |

---

## `src/lib/supabase/repositories/prestiti.ts` ✅

Repository Supabase per la tabella `prestiti_mutui`. Utilizza il tipo `PrestitoMutuo` da `src/lib/types.ts`.

| Funzione                   | Parametri                                      | Ritorna                    |
| -------------------------- | ---------------------------------------------- | -------------------------- |
| `getAllPrestiti(userId)`   | `string`                                       | `Promise<PrestitoMutuo[]>` |
| `addPrestito(data)`        | `Omit<PrestitoMutuo, 'id'>`                    | `Promise<PrestitoMutuo>`   |
| `updatePrestito(id, data)` | `string`, `Partial<Omit<PrestitoMutuo, 'id'>>` | `Promise<PrestitoMutuo>`   |
| `deletePrestito(id)`       | `string`                                       | `Promise<void>`            |

---

## `src/lib/supabase/repositories/prestiti-rimborsi.ts` ✅

Repository Supabase per la tabella `storico_rimborsi_prestiti`. Utilizza il tipo `RimborsoPrestitoMutuo` da `src/lib/types.ts`.

| Funzione                            | Parametri                           | Ritorna                            |
| ----------------------------------- | ----------------------------------- | ---------------------------------- |
| `getRimborsiByPrestito(prestitoId)` | `string`                            | `Promise<RimborsoPrestitoMutuo[]>` |
| `addRimborso(data)`                 | `Omit<RimborsoPrestitoMutuo, 'id'>` | `Promise<RimborsoPrestitoMutuo>`   |
| `deleteRimborso(id)`                | `string`                            | `Promise<void>`                    |
