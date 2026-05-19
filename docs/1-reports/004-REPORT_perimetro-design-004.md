---
tipo: report
titolo: Definizione perimetro DESIGN 004 — layer announcements/ e migrazione context
versione: 1.0.0
data: 2026-05-19
stato: COMPLETATO
sorgente-1: docs/1-reports/003-REPORT_classificazione-design-003.md
sorgente-2: docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md
sorgente-3: docs/1-reports/003-REPORT_analisi-stringhe-localizzazione.md
sorgente-4: docs/1-reports/003b-REPORT_analisi-stringhe-screen-reader.md
riferimento-architetturale: docs/0-architecture/ADR_001_sistema-annunci-accessibili.md
---

# REPORT 004 — Definizione perimetro DESIGN 004

> **Precondizione**: DESIGN 003 completamente implementato e verificato.
> Tutti i gate di DESIGN 003 superati. File eliminati: `use-talkback.ts`.
> File presente ma deprecato: `use-screen-reader.ts` (deletion differita
> al gate finale del DESIGN 004 — vedi Sezione 8 P1).
> File creati: `accessibility/types.ts`, `accessibility/engine.ts`,
> `accessibility/detection.ts`, `locales/it.ts` (infrastruttura),
> `locales/index.ts`.

---

## Sezione 1 — Riepilogo perimetro 004

| # | File | Operazione | Dipendenze | Note |
|---|------|-----------|-----------|------|
| 1 | `src/locales/it.ts` | PATCH | nessuna dep interna nuova | Aggiunge 67+ stringhe di dominio all'oggetto `it` attualmente vuoto. Deve avvenire prima di `announcements/types.ts` perché quest'ultimo referenzia `StringKey`. |
| 2 | `src/announcements/types.ts` | CREATE | `@/accessibility/types`, `@/locales/index` | Primo modulo `announcements/` da creare. Importa `Announcement` e `AnnouncementPriority` come `import type` da `accessibility/types`. Definisce `ActionType` e `actionKeyMap`. |
| 3 | `src/announcements/_utils/t.ts` | CREATE | `@/locales/index` | Helper privato per sostituzione placeholder. Non esportato da `index.ts`. |
| 4 | `src/announcements/_utils/currency.ts` | CREATE | nessuna | Formattazione valuta in formato vocale italiano. Non esportato da `index.ts`. |
| 5 | `src/announcements/_utils/dates.ts` | CREATE | nessuna | Formattazione date in formato vocale italiano. Non esportato da `index.ts`. |
| 6 | `src/announcements/_utils/plurals.ts` | CREATE | nessuna | Regole plurali italiani. Sostituisce la regex inline di `screen-reader.ts`. Non esportato da `index.ts`. |
| 7 | `src/announcements/ui.ts` | CREATE | `types.ts`, `_utils/t.ts`, `_utils/plurals.ts`, `@/locales/index` | Annunci di interfaccia generici: navigazione, dialog, errori, filtri, toggle, azioni. |
| 8 | `src/announcements/auth.ts` | CREATE | `types.ts`, `_utils/t.ts`, `@/locales/index` | Annunci PIN e sessione. |
| 9 | `src/announcements/accounts.ts` | CREATE | `types.ts`, `_utils/t.ts`, `_utils/currency.ts`, `_utils/plurals.ts`, `@/locales/index` | Annunci conti, movimenti, export CSV. |
| 10 | `src/announcements/budgets.ts` | CREATE | `types.ts`, `_utils/t.ts`, `_utils/currency.ts`, `_utils/dates.ts`, `@/locales/index` | Annunci budget e obiettivi di risparmio. |
| 11 | `src/announcements/index.ts` | CREATE | tutti i moduli `announcements/`, `@/accessibility/engine` | Unico file di `announcements/` che importa `engine`. Espone `announce()` e re-export dei moduli. Creato per ultimo. |
| 12 | `src/context/AuthContext.tsx` | PATCH | `@/announcements` | Rimuove `useScreenReader`, `isScreenReaderActive` DOM. Sostituisce 7 chiamate `screenReader.*` con `announce(auth.*)`. Aggiunge `announce(auth.privateAccountLocked())` in `lockPrivate`. |
| 13 | `src/context/AppDataContext.tsx` | PATCH | `@/announcements` | Rimuove `useScreenReader`. Sostituisce 16 chiamate `screenReader.*` con `announce(accounts.*)` e `announce(budgets.*)`. |
| 14 | `src/lib/screen-reader.ts` | DELETE | nessun consumatore residuo dopo le patch | Gate finale. Può essere eliminato solo dopo che entrambi i context sono migrati. |

---

## Sezione 2 — Ordine obbligatorio di costruzione

```
STEP 0 (precondizione da DESIGN 003 — da verificare prima di iniziare):
  src/accessibility/types.ts         esiste
  src/accessibility/engine.ts        esiste
  src/accessibility/detection.ts     esiste
  src/locales/it.ts                  esiste (oggetto it vuoto)
  src/locales/index.ts               esiste
  src/hooks/use-talkback.ts          NON esiste
  src/hooks/use-screen-reader.ts     PRESENTE MA DEPRECATO
                                     (deletion differita al gate finale di questo documento — vedi Sezione 8 P1)
  
  Dipendenza critica — vedi Sezione 8 punto P1:
  src/lib/screen-reader.ts           attualmente importata da AuthContext e AppDataContext.
                                     Verificare lo stato dopo DESIGN 003 prima di iniziare.

STEP 1 (prerequisito di tutti i moduli announcements/ — nessuna dep nuova):
  src/locales/it.ts                  PATCH — aggiunge 67 stringhe di dominio.
                                     Rende StringKey un tipo concreto non vuoto.
                                     DEVE precedere types.ts che usa StringKey.

STEP 2 (prerequisito di tutti gli altri moduli announcements/):
  src/announcements/types.ts         CREATE — importa Announcement e
                                     AnnouncementPriority come `import type`
                                     da accessibility/types. Definisce
                                     ActionType e actionKeyMap.

STEP 3 (parallelizzabili tra loro, dopo STEP 2):
  src/announcements/_utils/t.ts      CREATE
  src/announcements/_utils/currency.ts  CREATE
  src/announcements/_utils/dates.ts  CREATE
  src/announcements/_utils/plurals.ts   CREATE

STEP 4 (parallelizzabili tra loro, dopo STEP 2 e STEP 3):
  src/announcements/ui.ts            CREATE
  src/announcements/auth.ts          CREATE
  src/announcements/accounts.ts      CREATE
  src/announcements/budgets.ts       CREATE

STEP 5 (dopo STEP 4 — deve essere l'ultimo modulo announcements/):
  src/announcements/index.ts         CREATE
                                     È l'unico punto che importa engine.ts.

STEP 6 (dopo STEP 5 — parallelizzabili tra loro):
  src/context/AuthContext.tsx        PATCH
  src/context/AppDataContext.tsx     PATCH

STEP 7 (gate finale — dopo STEP 6):
  Verifica grep: nessun residuo di screen-reader.ts
  src/lib/screen-reader.ts           DELETE
```

**Grafo sintetico delle dipendenze:**

```
locales/it.ts (PATCH)
      │
      ▼
announcements/types.ts  ←  accessibility/types.ts (già esiste)
      │
      ├── _utils/t.ts ──────────────────────────────────────┐
      ├── _utils/currency.ts                                 │
      ├── _utils/dates.ts                                    │
      └── _utils/plurals.ts                                  │
            │                                                │
            ▼                                                ▼
      ui.ts / auth.ts / accounts.ts / budgets.ts ←── locales/index.ts
            │
            ▼
      announcements/index.ts  ←  accessibility/engine.ts (già esiste)
            │
            ▼
      AuthContext.tsx (PATCH) + AppDataContext.tsx (PATCH)
            │
            ▼
      screen-reader.ts (DELETE)
```

---

## Sezione 3 — Contenuto di ogni modulo announcements/

---

### 3.1 `announcements/types.ts`

**Ruolo**: Contratto di tipo interno al layer `announcements/`. Primo file
da creare. Non importa da `accessibility/engine.ts` (proibito da ADR_001
regola 1, eccezione solo per `index.ts`).

**Funzioni esposte / valori esportati**:
- `import type { Announcement, AnnouncementPriority } from '@/accessibility/types'` — re-export come `import type`
- `type ActionType = 'salvataggio' | 'creazione' | 'eliminazione' | 'esportazione' | 'sblocco'`
- `const actionKeyMap: Record<ActionType, StringKey>` — mapping verso le chiavi `azione_*` di `locales/it.ts`

**Stringhe di `locales/it.ts` usate**:
- `azione_salvataggio`, `azione_creazione`, `azione_eliminazione`, `azione_esportazione`, `azione_sblocco`

**Nota architetturale**: l'eccezione al divieto di import da `accessibility/types`
è documentata nel DESIGN 003 §3.1 (C3) — solo `import type`, mai codice eseguibile.

---

### 3.2 `announcements/_utils/t.ts`

**Ruolo**: Helper privato per la sostituzione di placeholder nelle stringhe.
Sostituisce il pattern `pattern.replace(/{chiave}/g, valore)` inline.
Non esportato da `announcements/index.ts` — uso esclusivo interno ai moduli.

**Funzioni esposte** (interne al layer):
- `t(key: StringKey, params: Record<string, string>): string`
  Legge `strings[key]` da `@/locales/index`, sostituisce tutti i
  placeholder `{nome}` con i valori in `params`. Restituisce la stringa
  con placeholder sostituiti.

**Stringhe di `locales/it.ts` usate**: tutte (è il gateway per l'accesso).

**Nota**: Limitazione documentata da DESIGN 003 §8 R3 — `t()` non verifica
la presenza di tutti i placeholder nella stringa template.

---

### 3.3 `announcements/_utils/currency.ts`

**Ruolo**: Formattazione numerica per uso vocale in italiano.
Centralizza la logica attualmente inline in `screen-reader.ts`
(uso di `Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })`).

**Funzioni esposte** (interne al layer):
- `formatCurrencyVocal(amount: number): string`
  Es.: `1234.56` → `"1.234,56 euro"` (formato vocale italiano, non simbolo `€`).

**Stringhe di `locales/it.ts` usate**: nessuna (solo logica di formattazione).

---

### 3.4 `announcements/_utils/dates.ts`

**Ruolo**: Formattazione date per uso vocale in italiano.
Sostituisce `new Date(deadline).toLocaleDateString('it-IT')` usato
inline in `screen-reader.ts`.

**Funzioni esposte** (interne al layer):
- `formatDateVocal(date: Date | string): string`
  Es.: `"2026-12-31"` → `"31 dicembre 2026"` (formato vocale esteso).

**Stringhe di `locales/it.ts` usate**: nessuna (solo logica di formattazione).

---

### 3.5 `announcements/_utils/plurals.ts`

**Ruolo**: Gestione regole plurali italiani. Sostituisce la regex inline
`replace(/i$/, 'o')` in `screen-reader.ts` con una funzione esplicita.

**Funzioni esposte** (interne al layer):
- `pluralize(word: string, count: number): string`
  Applica le regole di pluralizzazione italiane per nomi comuni.
  Es.: `("elemento", 3)` → `"elementi"`, `("elemento", 1)` → `"elemento"`.

**Nota**: La limitazione della regex inline in screen-reader.ts
(`replace(/i$/, 'o')` — inverte dal plurale al singolare) è documentata
nel REPORT 003b come limitazione. Il nuovo helper deve gestire entrambe
le direzioni (singolare → plurale). Il comportamento preciso va
specificato nel DESIGN 004.

**Stringhe di `locales/it.ts` usate**: nessuna (solo logica grammaticale).

---

### 3.6 `announcements/ui.ts`

**Ruolo**: Annunci di interfaccia generici: navigazione, dialoghi, errori,
filtri, sort, azioni, form, toggle, card, audio, template, periodo, help,
cancellazione dati. Non contiene logica di dominio finanziario.

**Funzioni esposte** (build functions che restituiscono `Announcement`):

| Funzione | Chiave locales | Priorità | Note |
|---------|--------------|---------|------|
| `announceNavigation(destination: string)` | `navigation_announce` | `polite` | |
| `announceError(error: string)` | `error_prefix` | `assertive` | |
| `announceSuccess(message: string)` | `success_prefix` | `polite` | |
| `announceCount(items: string, count: number)` | `count_announce` | `polite` | Usa `_utils/plurals.ts` |
| `announceDialogOpen(title: string)` | `dialog_open` | `polite` | |
| `announceDialogClose()` | `dialog_close` | `polite` | Stringa fissa |
| `announceProgress(current: number, total: number, label: string)` | `progress_announce` | `polite` | |
| `announceFocus(elementDescription: string)` | — | `polite` | Passthrough puro: il testo è già `elementDescription` |
| `announceListNavigation(position: number, total: number, itemDescription: string)` | `list_navigation` | `polite` | |
| `announceFilter(filterName: string, active: boolean)` | `filter_announce` + `filter_active`/`filter_inactive` | `polite` | |
| `announceSort(columnName: string, direction: 'crescente' \| 'decrescente')` | `sort_announce` + `sort_ascending`/`sort_descending` | `polite` | |
| `announceAction(actionType: ActionType)` | `actionKeyMap[actionType]` | `assertive` | Usa `ActionType` da `types.ts` |
| `announceVolumeChange(level: number, muted: boolean)` | `volume_muted` / `volume_level` | `polite` | |
| `announcePresetApplied(presetName: string)` | `preset_applied` | `polite` | |
| `announceTemplateSelected(templateName: string)` | `template_selected` | `polite` | |
| `announceFormError(fieldName: string, error: string)` | `form_error` | `assertive` | |
| `announceFormFieldFilled(fieldName: string, value: string)` | `form_field_filled` | `polite` | |
| `announceToggleState(elementName: string, isEnabled: boolean)` | `toggle_state` + `toggle_enabled`/`toggle_disabled` | `polite` | |
| `announceCardAction(action: string, itemName: string)` | `card_action` | `polite` | |
| `announcePeriodChange(periodName: string)` | `period_changed` | `polite` | |
| `announceHelpOpened()` | `help_opened` | `polite` | Stringa fissa lunga |
| `announceHelpClosed()` | `help_closed` | `polite` | Stringa fissa |
| `announceDataCleared(dataType: string)` | `data_cleared` | `assertive` | |

**Helper privato usato**: `t()` da `_utils/t.ts`, `pluralize()` da `_utils/plurals.ts`.

**Nota**: `announceExport(itemCount, format)` e `announceImportComplete(itemCount, dataType)`
appartengono ad `announcements/accounts.ts` — decisione adottata in Sezione 8 P2.
Non esistono versioni generiche di queste funzioni in `ui.ts`.

---

### 3.7 `announcements/auth.ts`

**Ruolo**: Annunci legati ad autenticazione, PIN privato e sessione.

**Funzioni esposte**:

| Funzione | Chiave locales | Priorità | Note |
|---------|--------------|---------|------|
| `pinNotConfigured()` | `auth_pin_not_configured_sr` | `assertive` | Errore: stato non valido |
| `pinInvalid()` | `auth_pin_invalid_sr` | `assertive` | Errore: autenticazione fallita |
| `privateUnlocked()` | `auth_private_unlocked_sr` | `polite` | Conferma azione riuscita |
| `pinSet()` | `auth_pin_set_sr` | `polite` | Conferma configurazione |
| `pinChanged()` | `auth_pin_changed_sr` | `polite` | Conferma modifica |
| `pinRemoved()` | `auth_pin_removed_sr` | `polite` | Conferma rimozione |
| `sessionKept()` | `auth_session_kept_sr` | `polite` | Vedi Sezione 8 P3 |
| `privateAccountLocked()` | `private_locked` | `polite` | Informativo, non urgente |

**Helper privato usato**: `t()` da `_utils/t.ts` (stringhe fisse, nessun placeholder in queste chiavi).

---

### 3.8 `announcements/accounts.ts`

**Ruolo**: Annunci legati a conti, movimenti e operazioni di export CSV.
Usa formattazione valuta e plurali.

**Funzioni esposte**:

| Funzione | Chiave locales | Priorità | Note |
|---------|--------------|---------|------|
| `announceAccountCreated(name: string, type: string, initialBalance: number)` | `conto_creato_sr` | `polite` | Usa `_utils/currency.ts` per `{saldo}` |
| `accountModified(name: string)` | `conto_modificato_sr` | `polite` | |
| `announceAccountDeleted(name: string)` | `conto_eliminato_sr` | `assertive` | Eliminazione è irreversibile |
| `accountDeletedBrief()` | `conto_eliminato_breve_sr` | `assertive` | Variante breve per casi senza nome |
| `announceTransaction(type: string, amount: number, account: string, category?: string)` | `transaction_base` + `transaction_category_suffix` | `polite` | Usa `_utils/currency.ts`; suffisso opzionale se `category` presente |
| `transactionModified()` | `movimento_modificato_sr` | `polite` | |
| `transactionAdded(type: string, amount: number, account: string)` | `movimento_creato_sr` | `polite` | Usa `_utils/currency.ts` |
| `transactionDeleted()` | `movimento_eliminato_sr` | `polite` | |
| `announceBalance(accountName: string, balance: number)` | `balance_announce` | `polite` | Usa `_utils/currency.ts` |
| `announceExportCSV(count: number)` | `export_completato_sr` | `polite` | Specifico CSV — vedi Sezione 8 P2 |
| `announceExport(itemCount: number, format: string)` | `export_announce` + `export_single`/`export_plural` | `polite` | Vedi Sezione 8 P2 |
| `announceImportComplete(itemCount: number, dataType: string)` | `import_complete` | `polite` | Vedi Sezione 8 P2 |

**Helper privati usati**: `t()`, `formatCurrencyVocal()` da `_utils/currency.ts`,
`pluralize()` da `_utils/plurals.ts`.

---

### 3.9 `announcements/budgets.ts`

**Ruolo**: Annunci legati a budget e obiettivi di risparmio.
Contiene la logica composita per stato budget e progresso obiettivo
(multipli rami condizionali, estratta da `screen-reader.ts`).

**Funzioni esposte**:

| Funzione | Chiave locales | Priorità | Note |
|---------|--------------|---------|------|
| `announceBudgetStatus(name: string, spent: number, target: number, percentage: number)` | `budget_status` + uno tra `budget_status_exceeded` / `budget_status_critical` / `budget_status_warning` / `budget_status_normal` | `polite` | Logica composita: `if percentage >= 100` → exceeded; `>= 90` → critical; `>= 75` → warning; else → normal. Usa `_utils/currency.ts` |
| `budgetCreated(name: string, target: number, period: string)` | `budget_item_creato_sr` | `polite` | Usa `_utils/currency.ts` |
| `budgetModified(name: string)` | `budget_item_modificato_sr` | `polite` | |
| `announceBudgetDeleted(name: string)` | `budget_item_eliminato_sr` | `assertive` | Eliminazione irreversibile |
| `budgetDeletedBrief()` | `budget_item_eliminato_breve_sr` | `assertive` | |
| `announceSavingsGoalCreated(name: string, target: number, deadline?: string)` | `obiettivo_creato_sr` + opz. `savings_goal_created_deadline_suffix` | `polite` | Usa `_utils/currency.ts` e `_utils/dates.ts` per il suffisso scadenza |
| `announceSavingsGoalProgress(name: string, current: number, target: number, percentage: number)` | `savings_goal_progress` + uno tra `savings_goal_progress_done` / `savings_goal_progress_near` / `savings_goal_progress_normal` | `polite` | Logica composita: `>= 100` → done; `>= 75` → near; else → normal. Usa `_utils/currency.ts` |
| `savingsGoalModified(name: string)` | `obiettivo_modificato_sr` | `polite` | |
| `announceSavingsGoalDeleted(name: string)` | `obiettivo_eliminato_sr` | `assertive` | |
| `savingsGoalDeletedBrief()` | `obiettivo_eliminato_breve_sr` | `assertive` | |

**Helper privati usati**: `t()`, `formatCurrencyVocal()`, `formatDateVocal()`.

---

### 3.10 `announcements/index.ts`

**Ruolo**: Unico punto di accesso pubblico al layer `announcements/`.
È l'**unico file** di `announcements/` che importa `engine` da
`@/accessibility/engine`. Deve essere creato **per ultimo**.

**Funzioni e re-export**:
- `announce(announcement: Announcement): void` — chiama `engine.announce(announcement)`
- `export * as ui from './ui'`
- `export * as auth from './auth'`
- `export * as accounts from './accounts'`
- `export * as budgets from './budgets'`

**Invariante ADR_001**: nessun altro file di `announcements/` importa `engine`.
L'unico flusso autorizzato è: `dominio → announcements/index.ts → engine.ts`.

---

## Sezione 4 — Patch ai context

---

### 4.1 `src/context/AuthContext.tsx`

**Stato corrente rilevato** (da ispezione del codice):
- Importa `useScreenReader` da `@/hooks/use-screen-reader` (riga 12)
- `const screenReader = useScreenReader()` (riga 60)
- `const isScreenReaderActive = typeof document !== 'undefined' && document.querySelector('[aria-live]') !== null && document.documentElement.getAttribute('data-sr-active') === 'true'` (righe 61-63)

**Nota dipendenza DESIGN 003** (vedi Sezione 8 P1): DESIGN 003 elimina
`use-screen-reader.ts`. Prima della deletion, AuthContext deve avere
aggiornato l'import. Verificare lo stato intermedio lasciato da DESIGN 003
prima di procedere con le patch di DESIGN 004.

**Riferimenti a rimuovere**:
| Riga (corrente) | Codice da rimuovere | Motivazione |
|----------------|---------------------|-------------|
| 12 | `import { useScreenReader } from '@/hooks/use-screen-reader'` | `use-screen-reader.ts` eliminato in DESIGN 003 |
| 60 | `const screenReader = useScreenReader()` | non serve più |
| 61-63 | `const isScreenReaderActive = typeof document !== 'undefined' && ...` | Detection DOM: non funziona in RN; rimuovere completamente |
| 171, 182, 193, 215, 239 | `if (!isScreenReaderActive) {` guards | Rimuovere: i toast (sonner) devono sempre mostrarsi; `announce()` è fire-and-forget e sicuro da chiamare sempre |
| 196, 218, 242 | `isScreenReaderActive` dalla dependency array di `useCallback` | Rimuovere dalla deps |

**Import da aggiungere**:
```ts
import { announce, auth } from '@/announcements'
```

**Sostituzioni screenReader.* → announce(auth.*):**

| Riga (corrente) | Chiamata attuale | Sostituzione |
|----------------|-----------------|-------------|
| 170 | `screenReader.announceError('PIN privato non configurato.')` | `announce(auth.pinNotConfigured())` |
| 181 | `screenReader.announceError('PIN privato non corretto. Riprova.')` | `announce(auth.pinInvalid())` |
| 192 | `screenReader.announceSuccess('Conto privato sbloccato.')` | `announce(auth.privateUnlocked())` |
| 214 | `screenReader.announceSuccess('PIN privato configurato.')` | `announce(auth.pinSet())` |
| 238 | `screenReader.announceSuccess('PIN privato modificato.')` | `announce(auth.pinChanged())` |
| 261 | `screenReader.announceSuccess('PIN privato rimosso.')` | `announce(auth.pinRemoved())` |
| 327 (JSX) | `resetTimer(); screenReader.announceSuccess('Sessione mantenuta attiva.')` | `resetTimer(); announce(auth.sessionKept())` |

**Chiamata da aggiungere** (non presente nel codice attuale):
- In `lockPrivate` (attualmente `setIsPrivateUnlocked(false)` senza annuncio):
  Aggiungere `announce(auth.privateAccountLocked())` dopo `setIsPrivateUnlocked(false)`.

**Aggiornamento `useCallback` dependency arrays**:
- Rimuovere `screenReader` e `isScreenReaderActive` da tutte le deps list.
- Aggiungere `announce` se necessario (da verificare — `announce` è una funzione
  stabile esportata da un modulo, tipicamente non richiede essere in deps).

**Compatibilità con DESIGN 003 import `useAccessibilityDetection`**:
DESIGN 003 commit 5 aggiunge `useAccessibilityDetection` per il pattern
`getTimeout(inactivityTimeoutState * 60 * 1000)` nel timer di inattività.
Questa parte non viene toccata da DESIGN 004 — rimane invariata.

---

### 4.2 `src/context/AppDataContext.tsx`

**Stato corrente rilevato** (da ispezione del codice):
- Importa `useScreenReader` da `@/hooks/use-screen-reader` (riga 7)
- `const screenReader = useScreenReader()` (riga 190)
- NON usa `useTalkBack` o detection — nessuna `useAccessibilityDetection` da aggiungere

**Riferimenti a rimuovere**:
| Riga (corrente) | Codice da rimuovere |
|----------------|---------------------|
| 7 | `import { useScreenReader } from '@/hooks/use-screen-reader'` |
| 190 | `const screenReader = useScreenReader()` |

**Import da aggiungere**:
```ts
import { announce, accounts, budgets } from '@/announcements'
```

**Sostituzioni screenReader.* → announce(accounts.*) e announce(budgets.*):**

| Riga (corrente) | Chiamata attuale | Sostituzione | Modulo |
|----------------|-----------------|-------------|--------|
| 475 | `screenReader.announceSuccess(\`Conto ${account.nome} modificato con successo.\`)` | `announce(accounts.accountModified(account.nome))` | accounts |
| 482 | `screenReader.announceSuccess(\`Nuovo conto ${account.nome} di tipo ${account.tipo} creato con saldo iniziale di ${formatCurrency(account.saldoIniziale)}.\`)` | `announce(accounts.announceAccountCreated(account.nome, account.tipo, account.saldoIniziale))` | accounts |
| 502 | `screenReader.announceSuccess('Movimento modificato con successo.')` | `announce(accounts.transactionModified())` | accounts |
| 519-523 | `screenReader.announceTransaction(transaction.tipo, transaction.importo, account?.nome \|\| 'Conto sconosciuto', category?.nome)` | `announce(accounts.announceTransaction(transaction.tipo, transaction.importo, account?.nome ?? 'Conto sconosciuto', category?.nome))` | accounts |
| 544 | `screenReader.announceSuccess(\`Budget ${budget.nome} modificato.\`)` | `announce(budgets.budgetModified(budget.nome))` | budgets |
| 551 | `screenReader.announceSuccess(\`Nuovo budget ${budget.nome} creato. Importo target: ${formatCurrency(budget.importoTarget)} per periodo ${budget.periodo}.\`)` | `announce(budgets.budgetCreated(budget.nome, budget.importoTarget, budget.periodo))` | budgets |
| 568 | `screenReader.announceSuccess(\`Obiettivo ${goal.nome} modificato.\`)` | `announce(budgets.savingsGoalModified(goal.nome))` | budgets |
| 575 | `screenReader.announceSuccess(\`Nuovo obiettivo di risparmio ${goal.nome} creato. Target: ${formatCurrency(goal.importoTarget)}.\`)` | `announce(budgets.announceSavingsGoalCreated(goal.nome, goal.importoTarget))` | budgets |
| 595 | `screenReader.announceSuccess(\`Conto ${account.nome} eliminato. Tutti i movimenti associati sono stati rimossi.\`)` | `announce(accounts.announceAccountDeleted(account.nome))` | accounts |
| 597 | `screenReader.announceSuccess('Conto eliminato.')` | `announce(accounts.accountDeletedBrief())` | accounts |
| 602 | `screenReader.announceSuccess('Movimento eliminato.')` | `announce(accounts.transactionDeleted())` | accounts |
| 610 | `screenReader.announceSuccess(\`Budget ${budget.nome} eliminato.\`)` | `announce(budgets.announceBudgetDeleted(budget.nome))` | budgets |
| 612 | `screenReader.announceSuccess('Budget eliminato.')` | `announce(budgets.budgetDeletedBrief())` | budgets |
| 619 | `screenReader.announceSuccess(\`Obiettivo ${goal.nome} eliminato.\`)` | `announce(budgets.announceSavingsGoalDeleted(goal.nome))` | budgets |
| 621 | `screenReader.announceSuccess('Obiettivo eliminato.')` | `announce(budgets.savingsGoalDeletedBrief())` | budgets |
| 636 | `screenReader.announceSuccess(\`Dati esportati. ${visibleTransactions.length} movimenti salvati in formato CSV.\`)` | `announce(accounts.announceExportCSV(visibleTransactions.length))` | accounts |

**Nota importante — parametri numerici raw**: le nuove funzioni in `accounts.ts`
e `budgets.ts` accettano valori numerici raw (es. `account.saldoIniziale: number`),
non stringhe pre-formattate. La formattazione avviene internamente via `_utils/currency.ts`.
Le chiamate a `formatCurrency(...)` nei parametri attuali vanno rimosse — il raw
number viene passato direttamente alla funzione del modulo.

**Nota su `checkBudgetNotifications`**: questa funzione chiama internamente dei
metodi di annuncio per le notifiche di budget (linea ~435-443 di AppDataContext —
messaggi di notifica budget con `${}` template). Questi messaggi usano attualmente
sonner toast e NON screenReader calls. Non è nell'ambito delle patch di DESIGN 004,
ma potrebbe essere oggetto di un task futuro per utilizzare `announce(budgets.announceBudgetStatus(...))`.
Vedi Sezione 8 P4.

---

## Sezione 5 — Stringhe locales/it.ts

Lista completa delle stringhe da aggiungere all'oggetto `it` in `src/locales/it.ts`.
Queste stringhe estendono l'oggetto attualmente vuoto creato in DESIGN 003.
L'oggetto `it` è `as const`, quindi tutte le chiavi diventano valori di `StringKey`.

**Ordine consigliato**: aggiungere le stringhe per area funzionale, con commenti
di sezione per mantenere leggibilità.

---

### Stringhe per `announcements/ui.ts` — 30 chiavi

| Chiave | Testo italiano | Modulo consumer |
|--------|---------------|-----------------|
| `navigation_announce` | `'Navigazione a {destination}'` | ui.ts |
| `error_prefix` | `'Errore: {error}'` | ui.ts |
| `success_prefix` | `'Successo: {message}'` | ui.ts |
| `count_announce` | `'{count} {items}'` | ui.ts |
| `dialog_open` | `'Finestra di dialogo aperta: {title}'` | ui.ts |
| `dialog_close` | `'Finestra di dialogo chiusa'` | ui.ts |
| `progress_announce` | `'{label}: {percentage}%. {current} di {total}'` | ui.ts |
| `list_navigation` | `'Elemento {position} di {total}: {itemDescription}'` | ui.ts |
| `filter_active` | `'attivato'` | ui.ts |
| `filter_inactive` | `'disattivato'` | ui.ts |
| `filter_announce` | `'Filtro {filterName} {stato}'` | ui.ts |
| `sort_ascending` | `'crescente'` | ui.ts |
| `sort_descending` | `'decrescente'` | ui.ts |
| `sort_announce` | `'Ordinamento per {columnName}, ordine {direction}'` | ui.ts |
| `volume_muted` | `'Audio disattivato'` | ui.ts |
| `volume_level` | `'Volume impostato a {level}%'` | ui.ts |
| `preset_applied` | `'Preset audio {presetName} applicato'` | ui.ts |
| `template_selected` | `'Template {templateName} selezionato. Campi compilati automaticamente'` | ui.ts |
| `form_error` | `'Errore nel campo {fieldName}: {error}'` | ui.ts |
| `form_field_filled` | `'Campo {fieldName} impostato a {value}'` | ui.ts |
| `toggle_enabled` | `'attivato'` | ui.ts |
| `toggle_disabled` | `'disattivato'` | ui.ts |
| `toggle_state` | `'{elementName} {stato}'` | ui.ts |
| `card_action` | `'{action} {itemName}'` | ui.ts |
| `period_changed` | `'Periodo cambiato a {periodName}'` | ui.ts |
| `help_opened` | `'Aiuto scorciatoie da tastiera aperto. Usa Tab per navigare, Escape per chiudere'` | ui.ts |
| `help_closed` | `'Aiuto scorciatoie da tastiera chiuso'` | ui.ts |
| `data_cleared` | `'{dataType} cancellati completamente'` | ui.ts |
| `azione_salvataggio` | `'Salvato'` | ui.ts (via `actionKeyMap`) |
| `azione_creazione` | `'Creato'` | ui.ts (via `actionKeyMap`) |
| `azione_eliminazione` | `'Eliminato'` | ui.ts (via `actionKeyMap`) |
| `azione_esportazione` | `'Esportato'` | ui.ts (via `actionKeyMap`) |
| `azione_sblocco` | `'Sbloccato'` | ui.ts (via `actionKeyMap`) |
| `export_single` | `'elemento esportato'` | accounts.ts |
| `export_plural` | `'elementi esportati'` | accounts.ts |
| `export_announce` | `'{itemCount} {exportLabel} in formato {format}'` | accounts.ts |
| `import_complete` | `'Importazione completata. {itemCount} {dataType} importati'` | accounts.ts |

---

### Stringhe per `announcements/accounts.ts` — 15 chiavi

| Chiave | Testo italiano | Modulo consumer |
|--------|---------------|-----------------|
| `balance_announce` | `'{accountName}, saldo {formattedBalance}'` | accounts.ts |
| `transaction_base` | `'Movimento {type}: {formattedAmount} su {account}'` | accounts.ts |
| `transaction_category_suffix` | `', categoria {category}'` | accounts.ts |
| `conto_creato_sr` | `'Nuovo conto {nome} di tipo {tipo} creato con saldo iniziale di {saldo}.'` | accounts.ts |
| `conto_modificato_sr` | `'Conto {nome} modificato con successo.'` | accounts.ts |
| `conto_eliminato_sr` | `'Conto {nome} eliminato. Tutti i movimenti associati sono stati rimossi.'` | accounts.ts |
| `conto_eliminato_breve_sr` | `'Conto eliminato.'` | accounts.ts |
| `movimento_creato_sr` | `'Movimento {tipo} di {importo} aggiunto al conto {conto}.'` | accounts.ts |
| `movimento_modificato_sr` | `'Movimento modificato con successo.'` | accounts.ts |
| `movimento_eliminato_sr` | `'Movimento eliminato.'` | accounts.ts |
| `export_completato_sr` | `'Dati esportati. {count} movimenti salvati in formato CSV.'` | accounts.ts |
| `export_single` | `'elemento esportato'` | accounts.ts |
| `export_plural` | `'elementi esportati'` | accounts.ts |
| `export_announce` | `'{itemCount} {exportLabel} in formato {format}'` | accounts.ts |
| `import_complete` | `'Importazione completata. {itemCount} {dataType} importati'` | accounts.ts |

*Nota: le chiavi `export_single`, `export_plural`, `export_announce`, `import_complete`
appartengono ad `accounts.ts` — decisione adottata in Sezione 8 P2. Non esistono
versioni generiche in `ui.ts`.*

---

### Stringhe per `announcements/budgets.ts` — 18 chiavi

| Chiave | Testo italiano | Modulo consumer |
|--------|---------------|-----------------|
| `budget_status` | `'Budget {name}: {percentage}%, {status}'` | budgets.ts |
| `budget_status_exceeded` | `'superato di {remaining}'` | budgets.ts |
| `budget_status_critical` | `'attenzione, rimangono solo {remaining}'` | budgets.ts |
| `budget_status_warning` | `'rimangono {remaining}'` | budgets.ts |
| `budget_status_normal` | `'in corso, spesi {spent} su {target}'` | budgets.ts |
| `savings_goal_created_deadline_suffix` | `', scadenza {deadline}'` | budgets.ts |
| `savings_goal_progress` | `'Obiettivo {nome}: {stato}'` | budgets.ts |
| `savings_goal_progress_done` | `'obiettivo raggiunto!'` | budgets.ts |
| `savings_goal_progress_near` | `'quasi raggiunto, mancano {remaining}'` | budgets.ts |
| `savings_goal_progress_normal` | `'progresso {percentage}%, risparmiati {current} su {target}'` | budgets.ts |
| `budget_item_creato_sr` | `'Nuovo budget {nome} creato. Importo target: {target} per periodo {periodo}.'` | budgets.ts |
| `budget_item_modificato_sr` | `'Budget {nome} modificato.'` | budgets.ts |
| `budget_item_eliminato_sr` | `'Budget {nome} eliminato.'` | budgets.ts |
| `budget_item_eliminato_breve_sr` | `'Budget eliminato.'` | budgets.ts |
| `obiettivo_creato_sr` | `'Nuovo obiettivo di risparmio {nome} creato. Target: {target}.'` | budgets.ts |
| `obiettivo_modificato_sr` | `'Obiettivo {nome} modificato.'` | budgets.ts |
| `obiettivo_eliminato_sr` | `'Obiettivo {nome} eliminato.'` | budgets.ts |
| `obiettivo_eliminato_breve_sr` | `'Obiettivo eliminato.'` | budgets.ts |

---

### Stringhe per `announcements/auth.ts` — 8 chiavi

| Chiave | Testo italiano | Modulo consumer |
|--------|---------------|-----------------|
| `auth_pin_not_configured_sr` | `'PIN privato non configurato.'` | auth.ts |
| `auth_pin_invalid_sr` | `'PIN privato non corretto. Riprova.'` | auth.ts |
| `auth_private_unlocked_sr` | `'Conto privato sbloccato.'` | auth.ts |
| `auth_pin_set_sr` | `'PIN privato configurato.'` | auth.ts |
| `auth_pin_changed_sr` | `'PIN privato modificato.'` | auth.ts |
| `auth_pin_removed_sr` | `'PIN privato rimosso.'` | auth.ts |
| `auth_session_kept_sr` | `'Sessione mantenuta attiva.'` | auth.ts |
| `private_locked` | `'Conto privato bloccato. I dati privati non sono più visibili'` | auth.ts |

---

**Totale stringhe da aggiungere a `locales/it.ts`: 77 chiavi**
- 26 chiavi esclusive di `ui.ts` (navigazione, dialog, filtri, form, toggle, ecc.)
- 4 chiavi `azione_*` usate da `ui.ts` via `actionKeyMap`
- 15 chiavi di `accounts.ts` (conti, movimenti, export CSV)
- 4 chiavi condivise export/import (`export_single`, `export_plural`,
  `export_announce`, `import_complete`) — appartengono ad `accounts.ts`
  per decisione Sezione 8 P2
- 18 chiavi di `budgets.ts` (budget e obiettivi di risparmio)
- 8 chiavi di `auth.ts` (PIN e sessione)
- 2 chiavi di `accessibility/` già presenti in `locales/it.ts` dal DESIGN 003
  (`private_locked`, `auth_session_kept_sr`) — già contate sopra in auth.ts

Nota: le 4 chiavi export/import sono elencate fisicamente nella tabella
di ui.ts per ragioni storiche di classificazione, ma il loro modulo consumer
corretto è `accounts.ts`. Non vanno duplicate — sono 77 chiavi distinte in totale.

---

## Sezione 6 — Eliminazione screen-reader.ts

**File target**: `src/lib/screen-reader.ts`

### Consumatori attuali (da ispezione del codebase)

| File consumatore | Import attuale | Azione richiesta |
|----------------|----------------|-----------------|
| `src/hooks/use-screen-reader.ts` | `import { ScreenReaderAnnouncer } from '@/lib/screen-reader'` (o simile) | **Presente ma deprecato** — la deletion è differita al gate finale di questo documento (vedi Sezione 8 P1). Il file esiste ancora dopo DESIGN 003. |
| `src/context/AuthContext.tsx` | `import { useScreenReader } from '@/hooks/use-screen-reader'` (transitivo) | **Patchato in DESIGN 004** — dopo la patch, nessun riferimento a screen-reader.ts rimane |
| `src/context/AppDataContext.tsx` | `import { useScreenReader } from '@/hooks/use-screen-reader'` (transitivo) | **Patchato in DESIGN 004** — dopo la patch, nessun riferimento rimane |

**Nota sulla dipendenza transitiva**: AuthContext e AppDataContext non importano
`screen-reader.ts` direttamente — lo usano tramite `use-screen-reader.ts`. Poiché
`use-screen-reader.ts` è presente ma deprecato dopo DESIGN 003 (non eliminato —
vedi Sezione 8 P1), la build rimane integra fino a quando le patch di questo
documento non migrano i context al nuovo sistema. Solo dopo le patch di entrambi
i context, `use-screen-reader.ts` e `screen-reader.ts` possono essere eliminati
nel gate finale.

### Comandi di verifica pre-deletion

Eseguire nell'ordine prima di procedere con la deletion:

```bash
# 1. Verifica che nessun file importi screen-reader.ts direttamente
grep -r "from.*lib/screen-reader\|from.*screen-reader" src/ --include="*.ts" --include="*.tsx"
# Deve restituire 0 risultati

# 2. Verifica che nessun file usi la classe ScreenReaderAnnouncer o screenReader singleton
grep -r "ScreenReaderAnnouncer\|screenReader\." src/ --include="*.ts" --include="*.tsx"
# Deve restituire 0 risultati

# 3. Verifica che nessun file usi useScreenReader
grep -r "useScreenReader\|use-screen-reader" src/ --include="*.ts" --include="*.tsx"
# Deve restituire 0 risultati

# 4. Verifica build pulita prima della deletion
npx tsc --noEmit
# Deve restituire 0 errori
```

### Gate post-deletion

```bash
# Verifica che il file sia stato eliminato
test ! -f src/lib/screen-reader.ts && echo "OK" || echo "ERRORE: file ancora presente"

# Verifica finale build
npx tsc --noEmit
# Deve restituire 0 errori su tutto il progetto
```

---

## Sezione 7 — Confine esplicito del 004

Tutto ciò che segue è **fuori scope** per DESIGN 004, con motivazione.

| Area | Motivazione esclusione |
|------|----------------------|
| `src/screens/` (qualsiasi file) | Directory vuota in questa fase del progetto. Le screen useranno `@/announcements` quando verranno create, ma non è perimetro di questo documento. |
| `src/components/` (qualsiasi file) | Directory vuota. Stesso ragionamento. |
| `src/lib/haptic-system.ts` | Layer separato (haptic). Non tocca il sistema di annunci vocali. |
| `src/lib/sound-system.ts` | Layer separato (audio). Non tocca il sistema di annunci vocali. |
| Navigazione e focus management | Fuori perimetro engine. Documento futuro dedicato. |
| Supporto multilingua oltre l'italiano | Il selettore lingua dinamico in `locales/index.ts` (da `UserSettingsContext`) appartiene al passo 4. |
| Nuove funzionalità di annuncio non presenti nel codice attuale | DESIGN 004 migra e ristruttura annunci esistenti — non aggiunge domini non coperti da `screen-reader.ts`. |
| Consolidazione `TalkBackAdaptations` (da `supabase/types.ts`) | DESIGN 003 ha scelto la duplicazione temporanea (Opzione B). La consolidazione è differita a un documento futuro. |
| Test automatici Jest per `announcements/` | Fuori perimetro design. Piano separato. |
| `checkBudgetNotifications` in `AppDataContext` | I messaggi di notifica budget (toast) non usano `screenReader.*` — sono fuori scope. Candidato a task futuro. |
| `src/lib/budget-alerts.ts` | Contiene stringhe di notifica visiva, non annunci screen reader. Non tocca il layer `announcements/`. |
| Stringhe UI di `src/lib/constants.ts` | Etichette di dominio per l'interfaccia visiva. Non annunci vocali. Appartengono a un sistema i18n futuro per la UI. |

---

## Sezione 8 — Punti aperti

I seguenti punti richiedono una decisione esplicita nel DESIGN 004 prima di
procedere con la codifica. Non è stata presa nessuna decisione qui.

---

### P1 — Sequenza di eliminazione `use-screen-reader.ts` e stato intermedio di AuthContext/AppDataContext

**Problema**: DESIGN 003 elimina `use-screen-reader.ts` (§7.2) basandosi
sull'assunzione che "screens/ e components/ sono vuoti — non esistono consumatori
reali di `useScreenReader()`". Tuttavia l'ispezione del codice attuale rivela che
**`AuthContext.tsx` (riga 12) e `AppDataContext.tsx` (riga 7) importano entrambi
`useScreenReader`** da `use-screen-reader.ts`. L'eliminazione di `use-screen-reader.ts`
senza prima rimuovere questi import rompe la build.

**Ambiguità**: Il DESIGN 003 §12 C2 dice "se inaspettatamente il grep restituisce
risultati, aggiornare quegli import prima di procedere". Ma aggiornare i context
per usare `@/announcements` richiede che `announcements/` esista — e questo è
lavoro di DESIGN 004.

**Domande aperte**:
1. DESIGN 003 ha già risolto questo? In che modo? (es. import temporaneo direttamente
   da `@/lib/screen-reader` come bridge) — Verificare con grep prima di iniziare DESIGN 004.
2. Se DESIGN 003 non lo ha risolto, chi è responsabile del bridge temporaneo:
   la fase finale di DESIGN 003 o la fase iniziale di DESIGN 004?

**Azione richiesta**: prima di iniziare DESIGN 004, eseguire:
```bash
grep -r "from.*use-screen-reader\|useScreenReader" src/ --include="*.ts" --include="*.tsx"
```
Se restituisce risultati in context files, chiarire e risolvere la dipendenza
prima di procedere.

**Decisione adottata**: la deletion di `use-screen-reader.ts` è differita
al gate finale del DESIGN 004. Il file rimane fisicamente presente dopo
il DESIGN 003 perché `AuthContext.tsx` e `AppDataContext.tsx` lo importano.
La deletion avviene solo dopo che entrambi i context sono stati migrati
al layer `announcements/`. Questa decisione è già stata recepita nel
DESIGN 003 (Round 7 — Sezione 12 C2 e commit 7 aggiornati).

---

### P2 — Duplicazione `announceExport` e `announceImportComplete` tra ui.ts e accounts.ts

**Problema**: Il REPORT_classificazione-design-003 Sezione 4 elenca
`announceExport(itemCount, format)` e `announceImportComplete(itemCount, dataType)`
sia in `announcements/ui.ts` (da §3.2 di DESIGN 003 vecchio) sia in
`announcements/accounts.ts` (da §6.4 di DESIGN 003 vecchio). Lo stesso report
nota la duplicazione con "(nota: questo metodo compare anche in `ui.ts` — vedi
Punti aperti §7)". Le stringhe `export_single`, `export_plural`, `export_announce`,
`import_complete` sono tabellate sotto accounts.ts.

**Ambiguità**:
- `announceExport` in `ui.ts` sembra essere la versione generica (export di qualsiasi formato)
- `announceExportCSV` in `accounts.ts` è la versione specifica CSV (usa `export_completato_sr`)
- `announceImportComplete` potrebbe stare in ui.ts (operazione generica) o accounts.ts (dominio dati)

**Azione richiesta**: decidere prima della codifica:
- `announceExport(itemCount, format)` — in ui.ts (generico) o accounts.ts (specifico)?
- `announceImportComplete` — in ui.ts o accounts.ts?
- Le chiavi `export_single`, `export_plural`, `export_announce`, `import_complete` seguono
  la decisione sul modulo che le ospita.

**Decisione adottata**: `announceExport(count, format)` e
`announceImportComplete(count, format)` appartengono ad
`announcements/accounts.ts` — sono operazioni sui dati finanziari
dell'utente. Il formato è un parametro (CSV, PDF, Excel o altro).
Non esiste nessuna versione generica in `ui.ts`. Le chiavi
`export_single`, `export_plural`, `export_announce`, `import_complete`
appartengono ad `accounts.ts`. La porta per export e import di altri
tipi di dati non finanziari rimane aperta per documenti futuri.

---

### P3 — Priorità di `auth_session_kept_sr`

**Problema**: La classificazione di `sessionKept()` come `polite` è segnalata
con un punto interrogativo nel REPORT_classificazione-design-003 §6.2:
> "nota: rivalutare se assertive"

**Contesto**: quando l'utente clicca "Rimani connesso", la sessione viene estesa.
Questo è una conferma di azione riuscita (→ `polite`) ma avviene all'interno di
un alert dialog già pronunciato come `assertive`. L'annuncio di conferma dopo
l'azione potrebbe essere `assertive` per chiudere il ciclo di attenzione.

**Azione richiesta**: il DESIGN 004 deve documentare esplicitamente la scelta
di priorità per `sessionKept()` applicando il criterio ADR_001:
"l'utente deve sapere questa cosa subito, interrompendo quello che sta ascoltando?"

**Decisione adottata**: priorità `polite`. La conferma "Sessione mantenuta
attiva" è una risposta a un'azione volontaria dell'utente — non è urgente
e non deve interrompere quello che lo screen reader sta leggendo. Il fatto
che il dialog precedente fosse assertive non rende assertive la conferma —
sono due eventi separati. Criterio ADR_001 applicato: l'utente non deve
sapere questa cosa subito interrompendo l'ascolto.

---

### P4 — `checkBudgetNotifications` — annunci budget attivi non migrati

**Problema**: `AppDataContext` ha una funzione `checkBudgetNotifications`
(chiamata dopo ogni `addTransaction` con tipo `uscita`) che genera notifiche
di budget usando stringhe hardcoded in template literals e toast (sonner).
Queste notifiche non usano `screenReader.*` e quindi non rientrano nel perimetro
delle patch DESIGN 004. Tuttavia i messaggi budget ("Budget X superato!", ecc.)
sono candidati naturali per `announce(budgets.announceBudgetStatus(...))`.

**Ambiguità**: le notifiche attive dei budget (`checkBudgetNotifications`)
appartengono al perimetro di DESIGN 004 o a un documento futuro?
La risposta dipende da dove si fissa il confine del "motore di annunci attivo".

**Azione richiesta**: confermare esplicitamente nel DESIGN 004 se
`checkBudgetNotifications` è in scope o escluso, con motivazione.

**Decisione adottata**: `checkBudgetNotifications` è fuori scope del
DESIGN 004. Le notifiche budget rimangono solo visive per ora —
usano sonner toast e non chiamate a `screenReader.*`, quindi non
rientrano nella migrazione del 004. Rimuovere sonner da questa
funzione richiede un documento dedicato al sistema di notifiche
visive dell'app che affronti la rimozione completa di sonner in
tutti i suoi punti di utilizzo. Candidato per un documento futuro.

---

### P5 — Naming convention di `announcePrivateAccountLocked()` in auth.ts

**Problema**: le funzioni di `auth.ts` usano nomi corti e descrittivi
(`pinNotConfigured`, `pinInvalid`, `privateUnlocked`, ecc.). La funzione
`announcePrivateAccountLocked()` — nome derivato dall'originale in `screen-reader.ts`
— usa il prefisso `announce` che non compare negli altri nomi del modulo.

**Ambiguità**: il DESIGN 004 deve scegliere:
- `announcePrivateAccountLocked()` — mantiene il nome dell'originale
- `privateAccountLocked()` — coerente con la convenzione del modulo

**Azione richiesta**: il DESIGN 004 deve standardizzare la naming convention
di `auth.ts` e documentare la scelta.

**Decisione adottata**: la funzione si chiama `privateAccountLocked()` —
senza prefisso `announce`, coerente con tutte le altre funzioni di
`auth.ts` (`pinNotConfigured`, `pinInvalid`, `privateUnlocked`, ecc.).
Il nome originale `announcePrivateAccountLocked()` è abbandonato.

---

### P6 — `_utils/plurals.ts` — direzione della pluralizzazione

**Problema**: la regex inline in `screen-reader.ts` (`replace(/i$/, 'o')`) inverte
dal **plurale** al singolare (es. `"elementi"` → `"elemento"`). Questo è l'inverso
del comportamento atteso di `pluralize(word, count)` che solitamente va dal
singolare al plurale.

Dall'analisi del REPORT 003b: `announceCount()` costruisce `'{count} ${plural}'`
dove `plural` è la forma plurale già derivata dalla parola originale. Se la funzione
`pluralize()` deve andare singolare → plurale, il chiamante deve passare la forma
singolare. Se inverte il plurale → singolare, il chiamante passa la forma plurale.

**Azione richiesta**: definire nel DESIGN 004 la firma esatta di `pluralize()`:
- input: singolare o plurale?
- logica: derivazione basata su regole o lookup?
- casi limite: parole che non finiscono in `i` al plurale.

**Decisione adottata**: `pluralize(word: string, count: number): string`
riceve sempre la forma singolare italiana come primo parametro.
Restituisce il singolare quando `count === 1`, il plurale altrimenti.
La logica si basa sulle regole morfologiche italiane standard:
parole in `o` → `i`, parole in `a` → `e`, parole in `e` → `i`.
I casi irregolari sono gestiti con una lista esplicita di eccezioni.
Le regole di altre lingue appartengono a file separati — questo file
contiene solo italiano. Il chiamante passa sempre la forma singolare.
