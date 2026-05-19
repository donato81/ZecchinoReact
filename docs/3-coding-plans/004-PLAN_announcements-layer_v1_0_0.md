---
tipo: coding-plan
riferimento-design: docs/2-projects/004-DESIGN_announcements-layer_v1_0_0.md
versione: 1.0.0
data-estrazione: 2026-05-19
stato: READY
---

# PLAN 004 — Layer announcements/ e migrazione context

## 1. Metadata

- **Reference Design:** docs/2-projects/004-DESIGN_announcements-layer_v1_0_0.md
- **Versione:** 1.0.0
- **Fase TODO-MASTER:** P2 (conclusione — eliminazione hook web-only) e P3 (Fase 3 — Pulisci context)
- **Data estrazione:** 2026-05-19

---

## 2. Prerequisiti

- PLAN 003 completamente implementato e tutti i gate superati.
- File presenti e verificati: `src/accessibility/types.ts`, `src/accessibility/engine.ts`, `src/accessibility/detection.ts`, `src/locales/it.ts` (oggetto vuoto), `src/locales/index.ts`.
- File eliminato: `src/hooks/use-talkback.ts`.
- File presente ma deprecato: `src/hooks/use-screen-reader.ts` (deletion al gate finale di questo piano).

---

## 3. Task atomici

### Task ID: 004.T1

- **File target:** `src/locales/it.ts` (PATCH — aggiunge 72 chiavi al dizionario)
- **Azione:** Sostituire l'oggetto `it` vuoto con il dizionario completo di 72 chiavi organizzate in 6 aree funzionali. Mantenere `as const`. Non importare da nessun altro file.
- **Snippet / Codice:**

```ts
// src/locales/it.ts
//
// Dizionario italiano completo del dominio applicativo accessibile.
// Aggiunto in DESIGN 004 — fino al DESIGN 003 questo oggetto era vuoto.
//
// Regola di import invariante:
// NON importare questo file direttamente.
// Tutti i file dell'app importano SOLO da src/locales/index.ts.
//
// Sezioni:
//   1) UI generica (navigazione, dialog, errori, filtri, sort, toggle, ecc.)
//   2) Azioni (mapping ActionType → testo, usate da ui.ts via actionKeyMap)
//   3) Conti, movimenti, balance
//   4) Export e import (modulo consumer: accounts.ts — vedi REPORT 004 P2)
//   5) Budget e obiettivi di risparmio
//   6) Autenticazione, PIN, sessione

export const it = {
  // ── 1) UI generica ────────────────────────────────────────────────────
  navigation_announce: 'Navigazione a {destination}',
  error_prefix: 'Errore: {error}',
  success_prefix: 'Successo: {message}',
  count_announce: '{count} {items}',
  dialog_open: 'Finestra di dialogo aperta: {title}',
  dialog_close: 'Finestra di dialogo chiusa',
  progress_announce: '{label}: {percentage}%. {current} di {total}',
  list_navigation: 'Elemento {position} di {total}: {itemDescription}',
  filter_active: 'attivato',
  filter_inactive: 'disattivato',
  filter_announce: 'Filtro {filterName} {stato}',
  sort_ascending: 'crescente',
  sort_descending: 'decrescente',
  sort_announce: 'Ordinamento per {columnName}, ordine {direction}',
  volume_muted: 'Audio disattivato',
  volume_level: 'Volume impostato a {level}%',
  preset_applied: 'Preset audio {presetName} applicato',
  template_selected: 'Template {templateName} selezionato. Campi compilati automaticamente',
  form_error: 'Errore nel campo {fieldName}: {error}',
  form_field_filled: 'Campo {fieldName} impostato a {value}',
  toggle_enabled: 'attivato',
  toggle_disabled: 'disattivato',
  toggle_state: '{elementName} {stato}',
  card_action: '{action} {itemName}',
  period_changed: 'Periodo cambiato a {periodName}',
  help_opened: 'Aiuto scorciatoie da tastiera aperto. Usa Tab per navigare, Escape per chiudere',
  help_closed: 'Aiuto scorciatoie da tastiera chiuso',
  data_cleared: '{dataType} cancellati completamente',

  // ── 2) Azioni (consumer: ui.ts via actionKeyMap) ──────────────────────
  azione_salvataggio: 'Salvato',
  azione_creazione: 'Creato',
  azione_eliminazione: 'Eliminato',
  azione_esportazione: 'Esportato',
  azione_sblocco: 'Sbloccato',

  // ── 3) Conti, movimenti, balance ──────────────────────────────────────
  balance_announce: '{accountName}, saldo {formattedBalance}',
  transaction_base: 'Movimento {type}: {formattedAmount} su {account}',
  transaction_category_suffix: ', categoria {category}',
  conto_creato_sr: 'Nuovo conto {nome} di tipo {tipo} creato con saldo iniziale di {saldo}.',
  conto_modificato_sr: 'Conto {nome} modificato con successo.',
  conto_eliminato_sr: 'Conto {nome} eliminato. Tutti i movimenti associati sono stati rimossi.',
  conto_eliminato_breve_sr: 'Conto eliminato.',
  movimento_creato_sr: 'Movimento {tipo} di {importo} aggiunto al conto {conto}.',
  movimento_modificato_sr: 'Movimento modificato con successo.',
  movimento_eliminato_sr: 'Movimento eliminato.',
  export_completato_sr: 'Dati esportati. {count} movimenti salvati in formato CSV.',

  // ── 4) Export e import (consumer: accounts.ts) ────────────────────────
  // Decisione REPORT 004 §8 P2: appartengono ad accounts.ts.
  // Non esistono versioni generiche in ui.ts.
  export_single: 'elemento esportato',
  export_plural: 'elementi esportati',
  export_announce: '{itemCount} {exportLabel} in formato {format}',
  import_complete: 'Importazione completata. {itemCount} {dataType} importati',

  // ── 5) Budget e obiettivi di risparmio ────────────────────────────────
  budget_status: 'Budget {name}: {percentage}%, {status}',
  budget_status_exceeded: 'superato di {remaining}',
  budget_status_critical: 'attenzione, rimangono solo {remaining}',
  budget_status_warning: 'rimangono {remaining}',
  budget_status_normal: 'in corso, spesi {spent} su {target}',
  savings_goal_created_deadline_suffix: ', scadenza {deadline}',
  savings_goal_progress: 'Obiettivo {nome}: {stato}',
  savings_goal_progress_done: 'obiettivo raggiunto!',
  savings_goal_progress_near: 'quasi raggiunto, mancano {remaining}',
  savings_goal_progress_normal: 'progresso {percentage}%, risparmiati {current} su {target}',
  budget_item_creato_sr: 'Nuovo budget {nome} creato. Importo target: {target} per periodo {periodo}.',
  budget_item_modificato_sr: 'Budget {nome} modificato.',
  budget_item_eliminato_sr: 'Budget {nome} eliminato.',
  budget_item_eliminato_breve_sr: 'Budget eliminato.',
  obiettivo_creato_sr: 'Nuovo obiettivo di risparmio {nome} creato. Target: {target}.',
  obiettivo_modificato_sr: 'Obiettivo {nome} modificato.',
  obiettivo_eliminato_sr: 'Obiettivo {nome} eliminato.',
  obiettivo_eliminato_breve_sr: 'Obiettivo eliminato.',

  // ── 6) Autenticazione, PIN, sessione ──────────────────────────────────
  auth_pin_not_configured_sr: 'PIN privato non configurato.',
  auth_pin_invalid_sr: 'PIN privato non corretto. Riprova.',
  auth_private_unlocked_sr: 'Conto privato sbloccato.',
  auth_pin_set_sr: 'PIN privato configurato.',
  auth_pin_changed_sr: 'PIN privato modificato.',
  auth_pin_removed_sr: 'PIN privato rimosso.',
  auth_session_kept_sr: 'Sessione mantenuta attiva.',
  private_locked: 'Conto privato bloccato. I dati privati non sono più visibili',
} as const

export type Strings = typeof it
export type StringKey = keyof Strings
```

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -c "^  [a-z_]*:" src/locales/it.ts` restituisce 72.

---

### Task ID: 004.T2

- **File target:** `src/announcements/types.ts` (CREATE)
- **Azione:** Creare il file con il contratto di tipo del layer `announcements/`. Re-esporta `Announcement` e `AnnouncementPriority` da `@/accessibility/types` come `import type` (eccezione documentata in DESIGN 003 §3.1). Definisce `ActionType` e `actionKeyMap`.
- **Dipende da:** 004.T1 (usa `StringKey` da `@/locales/index`)
- **Snippet / Codice:**

```ts
// src/announcements/types.ts
//
// Contratto di tipo del layer announcements/.
//
// Eccezione di import: questo file (e solo questo, oltre a
// announcements/index.ts che importa `engine`) può importare da
// @/accessibility/types — esclusivamente come `import type`,
// mai codice eseguibile.
// Motivazione: i moduli announcements/ devono conoscere la shape di
// Announcement per costruirla. Vedi DESIGN 003 §3.1 e §12 C3.

import type { Announcement, AnnouncementPriority } from '@/accessibility/types'
import type { StringKey } from '@/locales/index'

// Re-export come tipi — i moduli announcements/ devono importare da qui,
// non direttamente da @/accessibility/types.
export type { Announcement, AnnouncementPriority }

/**
 * Tipo di azione generica annunciabile via `announceAction()` in ui.ts.
 * Ogni valore corrisponde a una chiave `azione_*` di locales/it.ts
 * tramite `actionKeyMap`.
 */
export type ActionType =
  | 'salvataggio'
  | 'creazione'
  | 'eliminazione'
  | 'esportazione'
  | 'sblocco'

/**
 * Mapping dichiarativo da ActionType alla chiave di stringa corrispondente.
 * Usato da `ui.announceAction(actionType)` per ottenere il testo.
 * Mantenuto come oggetto piatto per renderizzare il binding visibile e
 * verificabile dal type checker.
 */
export const actionKeyMap: Record<ActionType, StringKey> = {
  salvataggio: 'azione_salvataggio',
  creazione: 'azione_creazione',
  eliminazione: 'azione_eliminazione',
  esportazione: 'azione_esportazione',
  sblocco: 'azione_sblocco',
}
```

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -E "import \{ engine" src/announcements/types.ts` restituisce 0 risultati.

---

### Task ID: 004.T3

- **File target:** `src/announcements/_utils/t.ts` (CREATE)
- **Azione:** Creare l'helper privato per la sostituzione dei placeholder `{nome}` nelle stringhe template. Non esportato da `announcements/index.ts`.
- **Dipende da:** 004.T2
- **Snippet / Codice:**

```ts
// src/announcements/_utils/t.ts
//
// Helper privato di sostituzione placeholder.
// Non esportato da announcements/index.ts — uso interno ai moduli
// announcements/*.ts.

import { strings } from '@/locales/index'
import type { StringKey } from '@/locales/index'

/**
 * Legge la stringa template associata a `key` e sostituisce i placeholder
 * `{nome}` con i valori in `params`. Restituisce la stringa completata.
 *
 * Limitazioni note (documentate in DESIGN 004 §5.3):
 * - Nessuna verifica che tutti i placeholder della stringa template siano
 *   coperti da `params`. Un placeholder mancante rimane nel testo finale
 *   come letterale (es. `"{nome}"`).
 * - Nessuna verifica che `params` non contenga chiavi superflue —
 *   vengono semplicemente ignorate.
 *
 * @param key Chiave della stringa in locales/it.ts.
 * @param params Mappa nome placeholder → valore di sostituzione.
 */
export function t(
  key: StringKey,
  params: Record<string, string | number> = {},
): string {
  const template = strings[key]
  let result: string = template
  for (const [name, value] of Object.entries(params)) {
    result = result.split(`{${name}}`).join(String(value))
  }
  return result
}
```

- **Success Metric:** `npx tsc --noEmit` senza errori.

---

### Task ID: 004.T4

- **File target:** `src/announcements/_utils/currency.ts` (CREATE)
- **Azione:** Creare il formatter vocale di importi in euro. Output orientato alla pronuncia (`"1.234,56 euro"`), non al simbolo grafico. Non esportato da `announcements/index.ts`.
- **Snippet / Codice:**

```ts
// src/announcements/_utils/currency.ts
//
// Formattazione vocale di importi in euro per gli annunci.
// Non esportato da announcements/index.ts — uso interno ai moduli.

const formatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Formatta un importo numerico in formato vocale italiano.
 * Esempi:
 *   1234.56  → "1.234,56 euro"
 *   0        → "0,00 euro"
 *   -50      → "-50,00 euro"
 *
 * Il suffisso "euro" è in chiaro per garantire una pronuncia coerente
 * su tutti gli screen reader (Narrator, VoiceOver, TalkBack). Il simbolo
 * "€" non viene utilizzato perché Narrator su Windows può pronunciarlo
 * in modi diversi a seconda della voce installata.
 *
 * @param amount Importo in euro (può essere negativo o zero).
 */
export function formatCurrencyVocal(amount: number): string {
  return `${formatter.format(amount)} euro`
}
```

- **Success Metric:** `npx tsc --noEmit` senza errori.

---

### Task ID: 004.T5

- **File target:** `src/announcements/_utils/dates.ts` (CREATE)
- **Azione:** Creare il formatter vocale di date in italiano esteso (`"31 dicembre 2026"`). Non esportato da `announcements/index.ts`.
- **Snippet / Codice:**

```ts
// src/announcements/_utils/dates.ts
//
// Formattazione vocale di date per gli annunci.
// Non esportato da announcements/index.ts — uso interno ai moduli.

const formatter = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * Formatta una data in formato vocale italiano esteso.
 * Esempi:
 *   "2026-12-31"               → "31 dicembre 2026"
 *   new Date(2026, 4, 19)      → "19 maggio 2026"
 *
 * Input accettato:
 * - oggetto Date
 * - stringa ISO 8601 (es. "2026-12-31") o qualsiasi formato accettato
 *   dal costruttore Date.
 *
 * Per input invalido restituisce una stringa vuota — il chiamante è
 * responsabile di gestire il fallback. Non viene sollevata eccezione
 * per coerenza con il principio fire-and-forget degli annunci.
 *
 * @param date Data come oggetto Date o stringa parsabile.
 */
export function formatDateVocal(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) {
    return ''
  }
  return formatter.format(d)
}
```

- **Success Metric:** `npx tsc --noEmit` senza errori.

---

### Task ID: 004.T6

- **File target:** `src/announcements/_utils/plurals.ts` (CREATE)
- **Azione:** Creare la funzione `pluralize(word, count)` con regole morfologiche italiane e lista di eccezioni irregolari del dominio finanziario. Non esportato da `announcements/index.ts`.
- **Snippet / Codice:**

```ts
// src/announcements/_utils/plurals.ts
//
// Pluralizzazione italiana per gli annunci.
// Non esportato da announcements/index.ts — uso interno ai moduli.
//
// Regola operativa (decisione REPORT 004 §8 P6):
//   pluralize(word, count) riceve SEMPRE la forma singolare italiana.
//   Se count === 1 restituisce il singolare immutato.
//   Altrimenti restituisce il plurale derivato.

/**
 * Eccezioni italiane irregolari rilevanti per il dominio finanziario.
 * Lista esplicita: solo le forme effettivamente attese in chiamate
 * presenti nei moduli announcements/. Espandibile su nuove esigenze.
 * Chiave: singolare. Valore: plurale.
 */
const IRREGULAR: Record<string, string> = {
  euro: 'euro',
  movimento: 'movimenti',
  elemento: 'elementi',
  conto: 'conti',
  budget: 'budget',
  obiettivo: 'obiettivi',
  dato: 'dati',
  categoria: 'categorie',
}

/**
 * Restituisce la forma singolare o plurale di `word` in base a `count`.
 *
 * Regole morfologiche standard applicate quando non esiste una entry
 * in IRREGULAR:
 *   - parole terminanti in 'o' → 'i' (es. "gatto" → "gatti")
 *   - parole terminanti in 'a' → 'e' (es. "casa" → "case")
 *   - parole terminanti in 'e' → 'i' (es. "cane" → "cani")
 *   - altri suffissi: la parola viene restituita invariata
 *     (es. parole tronche, anglicismi)
 *
 * Casi limite documentati:
 * - count === 0 produce il plurale ("0 elementi"), coerente con l'uso
 *   italiano standard.
 * - count negativo è trattato come plurale.
 *
 * @param word Forma singolare italiana.
 * @param count Numero che determina singolare/plurale.
 */
export function pluralize(word: string, count: number): string {
  if (count === 1) {
    return word
  }
  if (Object.prototype.hasOwnProperty.call(IRREGULAR, word)) {
    return IRREGULAR[word]
  }
  const last = word.slice(-1)
  if (last === 'o') {
    return `${word.slice(0, -1)}i`
  }
  if (last === 'a') {
    return `${word.slice(0, -1)}e`
  }
  if (last === 'e') {
    return `${word.slice(0, -1)}i`
  }
  return word
}
```

- **Success Metric:** `npx tsc --noEmit` senza errori.

---

### Task ID: 004.T7

- **File target:** `src/announcements/ui.ts` (CREATE)
- **Azione:** Creare il modulo annunci di interfaccia generici. Nessuna logica di dominio finanziario. `announceExport` e `announceImportComplete` **non** appartengono a questo file (appartengono ad `accounts.ts`).
- **Dipende da:** 004.T2, 004.T3, 004.T6
- **Snippet / Codice:**

```ts
// src/announcements/ui.ts
//
// Annunci di interfaccia generici. Nessuna logica di dominio finanziario.
// Ogni funzione restituisce un oggetto Announcement strutturato.
//
// Esposto pubblicamente tramite `announcements/index.ts` come namespace `ui`.

import type { Announcement, ActionType } from './types'
import { actionKeyMap } from './types'
import { t } from './_utils/t'
import { pluralize } from './_utils/plurals'

export function announceNavigation(destination: string): Announcement {
  return {
    text: t('navigation_announce', { destination }),
    priority: 'polite',
  }
}

export function announceError(error: string): Announcement {
  return {
    text: t('error_prefix', { error }),
    priority: 'assertive',
  }
}

export function announceSuccess(message: string): Announcement {
  return {
    text: t('success_prefix', { message }),
    priority: 'polite',
  }
}

export function announceCount(items: string, count: number): Announcement {
  const word = pluralize(items, count)
  return {
    text: t('count_announce', { count, items: word }),
    priority: 'polite',
  }
}

export function announceDialogOpen(title: string): Announcement {
  return {
    text: t('dialog_open', { title }),
    priority: 'polite',
  }
}

export function announceDialogClose(): Announcement {
  return {
    text: t('dialog_close'),
    priority: 'polite',
  }
}

export function announceProgress(
  current: number,
  total: number,
  label: string,
): Announcement {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  return {
    text: t('progress_announce', { label, percentage, current, total }),
    priority: 'polite',
  }
}

/**
 * Passthrough puro: il testo è già la descrizione fornita dal chiamante.
 * Nessuna chiave di stringa coinvolta — `elementDescription` è già la
 * stringa finale.
 */
export function announceFocus(elementDescription: string): Announcement {
  return { text: elementDescription, priority: 'polite' }
}

export function announceListNavigation(
  position: number,
  total: number,
  itemDescription: string,
): Announcement {
  return {
    text: t('list_navigation', { position, total, itemDescription }),
    priority: 'polite',
  }
}

export function announceFilter(filterName: string, active: boolean): Announcement {
  const stato = t(active ? 'filter_active' : 'filter_inactive')
  return {
    text: t('filter_announce', { filterName, stato }),
    priority: 'polite',
  }
}

export function announceSort(
  columnName: string,
  direction: 'crescente' | 'decrescente',
): Announcement {
  const dirText = t(direction === 'crescente' ? 'sort_ascending' : 'sort_descending')
  return {
    text: t('sort_announce', { columnName, direction: dirText }),
    priority: 'polite',
  }
}

/**
 * Annuncio di un'azione completata. La chiave di stringa è risolta tramite
 * `actionKeyMap` definito in types.ts.
 *
 * ⚠️ NOTA — priorità da rivalutare: la priorità `assertive` è provvisoria.
 * Vedi DESIGN 004 §9.1 per la motivazione e le condizioni di riesame.
 */
export function announceAction(actionType: ActionType): Announcement {
  return {
    text: t(actionKeyMap[actionType]),
    priority: 'assertive',
  }
}

export function announceVolumeChange(level: number, muted: boolean): Announcement {
  if (muted) {
    return { text: t('volume_muted'), priority: 'polite' }
  }
  return {
    text: t('volume_level', { level }),
    priority: 'polite',
  }
}

export function announcePresetApplied(presetName: string): Announcement {
  return {
    text: t('preset_applied', { presetName }),
    priority: 'polite',
  }
}

export function announceTemplateSelected(templateName: string): Announcement {
  return {
    text: t('template_selected', { templateName }),
    priority: 'polite',
  }
}

export function announceFormError(fieldName: string, error: string): Announcement {
  return {
    text: t('form_error', { fieldName, error }),
    priority: 'assertive',
  }
}

export function announceFormFieldFilled(
  fieldName: string,
  value: string,
): Announcement {
  return {
    text: t('form_field_filled', { fieldName, value }),
    priority: 'polite',
  }
}

export function announceToggleState(
  elementName: string,
  isEnabled: boolean,
): Announcement {
  const stato = t(isEnabled ? 'toggle_enabled' : 'toggle_disabled')
  return {
    text: t('toggle_state', { elementName, stato }),
    priority: 'polite',
  }
}

export function announceCardAction(action: string, itemName: string): Announcement {
  return {
    text: t('card_action', { action, itemName }),
    priority: 'polite',
  }
}

export function announcePeriodChange(periodName: string): Announcement {
  return {
    text: t('period_changed', { periodName }),
    priority: 'polite',
  }
}

export function announceHelpOpened(): Announcement {
  return { text: t('help_opened'), priority: 'polite' }
}

export function announceHelpClosed(): Announcement {
  return { text: t('help_closed'), priority: 'polite' }
}

export function announceDataCleared(dataType: string): Announcement {
  return {
    text: t('data_cleared', { dataType }),
    priority: 'assertive',
  }
}
```

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -E "import \{ engine|from '@/accessibility/engine'" src/announcements/ui.ts` restituisce 0 risultati.

---

### Task ID: 004.T8

- **File target:** `src/announcements/auth.ts` (CREATE)
- **Azione:** Creare il modulo annunci di autenticazione, PIN privato e sessione. Convenzione di naming: nessun prefisso `announce` nelle funzioni. Priorità `sessionKept()` è `polite` (decisione P3 REPORT 004).
- **Dipende da:** 004.T2, 004.T3
- **Snippet / Codice:**

```ts
// src/announcements/auth.ts
//
// Annunci legati ad autenticazione, PIN privato e sessione.
//
// Convenzione di naming: nessuna funzione usa il prefisso `announce`.
// La forma esposta è il sostantivo/verbo dell'evento (decisione P5).
//
// Esposto pubblicamente tramite `announcements/index.ts` come namespace `auth`.

import type { Announcement } from './types'
import { t } from './_utils/t'

export function pinNotConfigured(): Announcement {
  return { text: t('auth_pin_not_configured_sr'), priority: 'assertive' }
}

export function pinInvalid(): Announcement {
  return { text: t('auth_pin_invalid_sr'), priority: 'assertive' }
}

export function privateUnlocked(): Announcement {
  return { text: t('auth_private_unlocked_sr'), priority: 'polite' }
}

export function pinSet(): Announcement {
  return { text: t('auth_pin_set_sr'), priority: 'polite' }
}

export function pinChanged(): Announcement {
  return { text: t('auth_pin_changed_sr'), priority: 'polite' }
}

export function pinRemoved(): Announcement {
  return { text: t('auth_pin_removed_sr'), priority: 'polite' }
}

/**
 * Conferma a seguito del click "Rimani connesso" nel dialog di scadenza
 * sessione. Priorità `polite` (decisione P3): non interrompe.
 */
export function sessionKept(): Announcement {
  return { text: t('auth_session_kept_sr'), priority: 'polite' }
}

/**
 * Annuncio emesso quando l'utente blocca manualmente l'area privata
 * (es. tramite `lockPrivate()` in AuthContext). Informativo, non urgente.
 */
export function privateAccountLocked(): Announcement {
  return { text: t('private_locked'), priority: 'polite' }
}
```

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -E "import \{ engine|from '@/accessibility/engine'" src/announcements/auth.ts` restituisce 0 risultati.

---

### Task ID: 004.T9

- **File target:** `src/announcements/accounts.ts` (CREATE)
- **Azione:** Creare il modulo annunci di conti, movimenti, export/import. I parametri numerici sono sempre raw — la formattazione avviene internamente. `announceExport` e `announceImportComplete` appartengono a questo file (decisione P2 REPORT 004).
- **Dipende da:** 004.T2, 004.T3, 004.T4, 004.T6
- **Snippet / Codice:**

```ts
// src/announcements/accounts.ts
//
// Annunci legati a conti, movimenti, export e import.
// Inclusione di announceExport/announceImportComplete per decisione P2
// del REPORT 004 — appartengono al dominio dati finanziari.
//
// Esposto pubblicamente tramite `announcements/index.ts` come namespace `accounts`.

import type { Announcement } from './types'
import { t } from './_utils/t'
import { formatCurrencyVocal } from './_utils/currency'
import { pluralize } from './_utils/plurals'

export function announceAccountCreated(
  name: string,
  type: string,
  initialBalance: number,
): Announcement {
  return {
    text: t('conto_creato_sr', {
      nome: name,
      tipo: type,
      saldo: formatCurrencyVocal(initialBalance),
    }),
    priority: 'polite',
  }
}

export function accountModified(name: string): Announcement {
  return { text: t('conto_modificato_sr', { nome: name }), priority: 'polite' }
}

export function announceAccountDeleted(name: string): Announcement {
  return {
    text: t('conto_eliminato_sr', { nome: name }),
    priority: 'assertive',
  }
}

export function accountDeletedBrief(): Announcement {
  return { text: t('conto_eliminato_breve_sr'), priority: 'assertive' }
}

/**
 * Annuncio di un movimento appena registrato. Il suffisso categoria
 * viene aggiunto solo se `category` è definito.
 */
export function announceTransaction(
  type: string,
  amount: number,
  account: string,
  category?: string,
): Announcement {
  const base = t('transaction_base', {
    type,
    formattedAmount: formatCurrencyVocal(amount),
    account,
  })
  const suffix = category ? t('transaction_category_suffix', { category }) : ''
  return { text: `${base}${suffix}`, priority: 'polite' }
}

export function transactionModified(): Announcement {
  return { text: t('movimento_modificato_sr'), priority: 'polite' }
}

export function transactionAdded(
  type: string,
  amount: number,
  account: string,
): Announcement {
  return {
    text: t('movimento_creato_sr', {
      tipo: type,
      importo: formatCurrencyVocal(amount),
      conto: account,
    }),
    priority: 'polite',
  }
}

export function transactionDeleted(): Announcement {
  return { text: t('movimento_eliminato_sr'), priority: 'polite' }
}

export function announceBalance(
  accountName: string,
  balance: number,
): Announcement {
  return {
    text: t('balance_announce', {
      accountName,
      formattedBalance: formatCurrencyVocal(balance),
    }),
    priority: 'polite',
  }
}

/**
 * Annuncio specifico per export CSV con conteggio movimenti.
 * Variante generica multi-formato: `announceExport()` più in basso.
 */
export function announceExportCSV(count: number): Announcement {
  return {
    text: t('export_completato_sr', { count }),
    priority: 'polite',
  }
}

/**
 * Annuncio generico di export multi-formato. Il formato è un parametro
 * (CSV, PDF, Excel, ...). Decisione P2 del REPORT 004: questa funzione
 * appartiene ad accounts.ts perché si applica a dati finanziari.
 *
 * Le chiavi export_single / export_plural contengono già la coppia
 * concordata singolare/plurale completa ("elemento esportato" /
 * "elementi esportati") — la selezione avviene direttamente sul count
 * senza necessità di chiamare pluralize().
 */
export function announceExport(itemCount: number, format: string): Announcement {
  const label = itemCount === 1 ? t('export_single') : t('export_plural')
  return {
    text: t('export_announce', { itemCount, exportLabel: label, format }),
    priority: 'polite',
  }
}

/**
 * Annuncio di import completato. Decisione P2 del REPORT 004: appartiene
 * ad accounts.ts.
 */
export function announceImportComplete(
  itemCount: number,
  dataType: string,
): Announcement {
  return {
    text: t('import_complete', { itemCount, dataType }),
    priority: 'polite',
  }
}
```

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -E "import \{ engine|from '@/accessibility/engine'" src/announcements/accounts.ts` restituisce 0 risultati.

---

### Task ID: 004.T10

- **File target:** `src/announcements/budgets.ts` (CREATE)
- **Azione:** Creare il modulo annunci di budget e obiettivi di risparmio. Contiene la logica composita per `announceBudgetStatus` (4 rami) e `announceSavingsGoalProgress` (3 rami).
- **Dipende da:** 004.T2, 004.T3, 004.T4, 004.T5
- **Snippet / Codice:**

```ts
// src/announcements/budgets.ts
//
// Annunci legati a budget e obiettivi di risparmio.
// Contiene logica composita per status budget e progresso obiettivo.
//
// Esposto pubblicamente tramite `announcements/index.ts` come namespace `budgets`.

import type { Announcement } from './types'
import { t } from './_utils/t'
import { formatCurrencyVocal } from './_utils/currency'
import { formatDateVocal } from './_utils/dates'

/**
 * Annuncio composito sullo stato di un budget.
 * Soglie:
 *   percentage >= 100 → exceeded
 *   percentage >=  90 → critical
 *   percentage >=  75 → warning
 *   altrimenti        → normal
 */
export function announceBudgetStatus(
  name: string,
  spent: number,
  target: number,
  percentage: number,
): Announcement {
  const remaining = Math.max(target - spent, 0)
  let status: string
  if (percentage >= 100) {
    status = t('budget_status_exceeded', {
      remaining: formatCurrencyVocal(spent - target),
    })
  } else if (percentage >= 90) {
    status = t('budget_status_critical', {
      remaining: formatCurrencyVocal(remaining),
    })
  } else if (percentage >= 75) {
    status = t('budget_status_warning', {
      remaining: formatCurrencyVocal(remaining),
    })
  } else {
    status = t('budget_status_normal', {
      spent: formatCurrencyVocal(spent),
      target: formatCurrencyVocal(target),
    })
  }
  return {
    text: t('budget_status', { name, percentage: Math.round(percentage), status }),
    priority: 'polite',
  }
}

export function budgetCreated(
  name: string,
  target: number,
  period: string,
): Announcement {
  return {
    text: t('budget_item_creato_sr', {
      nome: name,
      target: formatCurrencyVocal(target),
      periodo: period,
    }),
    priority: 'polite',
  }
}

export function budgetModified(name: string): Announcement {
  return { text: t('budget_item_modificato_sr', { nome: name }), priority: 'polite' }
}

export function announceBudgetDeleted(name: string): Announcement {
  return {
    text: t('budget_item_eliminato_sr', { nome: name }),
    priority: 'assertive',
  }
}

export function budgetDeletedBrief(): Announcement {
  return { text: t('budget_item_eliminato_breve_sr'), priority: 'assertive' }
}

/**
 * Annuncio di creazione di un obiettivo di risparmio. Se `deadline`
 * è valorizzata, viene aggiunto il suffisso con la data formattata.
 */
export function announceSavingsGoalCreated(
  name: string,
  target: number,
  deadline?: string,
): Announcement {
  const base = t('obiettivo_creato_sr', {
    nome: name,
    target: formatCurrencyVocal(target),
  })
  const suffix = deadline
    ? t('savings_goal_created_deadline_suffix', { deadline: formatDateVocal(deadline) })
    : ''
  return { text: `${base}${suffix}`, priority: 'polite' }
}

/**
 * Annuncio composito sul progresso di un obiettivo di risparmio.
 * Soglie:
 *   percentage >= 100 → done
 *   percentage >=  75 → near
 *   altrimenti        → normal
 */
export function announceSavingsGoalProgress(
  name: string,
  current: number,
  target: number,
  percentage: number,
): Announcement {
  let stato: string
  if (percentage >= 100) {
    stato = t('savings_goal_progress_done')
  } else if (percentage >= 75) {
    stato = t('savings_goal_progress_near', {
      remaining: formatCurrencyVocal(Math.max(target - current, 0)),
    })
  } else {
    stato = t('savings_goal_progress_normal', {
      percentage: Math.round(percentage),
      current: formatCurrencyVocal(current),
      target: formatCurrencyVocal(target),
    })
  }
  return {
    text: t('savings_goal_progress', { nome: name, stato }),
    priority: 'polite',
  }
}

export function savingsGoalModified(name: string): Announcement {
  return { text: t('obiettivo_modificato_sr', { nome: name }), priority: 'polite' }
}

export function announceSavingsGoalDeleted(name: string): Announcement {
  return {
    text: t('obiettivo_eliminato_sr', { nome: name }),
    priority: 'assertive',
  }
}

export function savingsGoalDeletedBrief(): Announcement {
  return { text: t('obiettivo_eliminato_breve_sr'), priority: 'assertive' }
}
```

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -E "import \{ engine|from '@/accessibility/engine'" src/announcements/budgets.ts` restituisce 0 risultati.

---

### Task ID: 004.T11

- **File target:** `src/announcements/index.ts` (CREATE — deve essere l'ultimo modulo announcements/)
- **Azione:** Creare l'unico punto di accesso pubblico al layer. **Unico file di `announcements/`** autorizzato a importare `engine` da `@/accessibility/engine`. Espone `announce()` e i re-export dei quattro namespace di dominio.
- **Dipende da:** 004.T7, 004.T8, 004.T9, 004.T10 (tutti i moduli devono esistere prima di index.ts)
- **Snippet / Codice:**

```ts
// src/announcements/index.ts
//
// Unico punto di accesso pubblico al layer announcements/.
// Unico file di announcements/ autorizzato a importare engine.
// Tutto il resto del codice dell'app importa SOLO da '@/announcements'.

import { engine } from '@/accessibility/engine'
import type { Announcement } from './types'

export type { Announcement, AnnouncementPriority, ActionType } from './types'

/**
 * Pronuncia un Announcement già costruito.
 * Pattern d'uso:
 *   import { announce, accounts } from '@/announcements'
 *   announce(accounts.accountModified(name))
 *
 * Fire-and-forget: vedi engine.announce() per il dettaglio del contratto.
 */
export function announce(announcement: Announcement): void {
  engine.announce(announcement)
}

export * as ui from './ui'
export * as auth from './auth'
export * as accounts from './accounts'
export * as budgets from './budgets'
```

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -E "from '@/accessibility/engine'" src/announcements/index.ts` restituisce **esattamente 1 risultato**; questo è l'unico file di `announcements/` che importa `engine`.

---

### Task ID: 004.T12

- **File target:** `src/context/AuthContext.tsx` (PATCH)
- **Azione:** Migrare da `useScreenReader` a `@/announcements`. Rimuovere detection DOM (`isScreenReaderActive`). Aggiungere `announce(auth.privateAccountLocked())` in `lockPrivate`.
- **Dipende da:** 004.T11
- **Nota:** Prima di applicare le sostituzioni, verificare le righe effettive con:
  ```bash
  grep -nE "useScreenReader|screenReader\.|isScreenReaderActive" src/context/AuthContext.tsx
  ```
  I numeri di riga indicati di seguito sono di riferimento e potrebbero essere variati da modifiche precedenti.

**Passo 1 — Import da rimuovere:**
```ts
// RIMUOVERE la riga:
import { useScreenReader } from '@/hooks/use-screen-reader'
```

**Passo 2 — Import da aggiungere:**
```ts
import { announce, auth } from '@/announcements'
```

**Passo 3 — Dichiarazioni da rimuovere:**
```ts
// RIMUOVERE:
const screenReader = useScreenReader()
// RIMUOVERE:
const isScreenReaderActive = typeof document !== 'undefined' && /* ... */
```

**Passo 4 — Guard da rimuovere (tutti i blocchi `if (!isScreenReaderActive)`):**
I guard che wrappano chiamate `screenReader.*` devono essere rimossi — i toast
sonner devono sempre mostrarsi; `announce()` è fire-and-forget e sicuro da
chiamare sempre.

**Passo 5 — Sostituzioni `screenReader.*` → `announce(auth.*)`:**

| Prima (testo cercato) | Dopo (testo sostitutivo) |
|---|---|
| `screenReader.announceError('PIN privato non configurato.')` | `announce(auth.pinNotConfigured())` |
| `screenReader.announceError('PIN privato non corretto. Riprova.')` | `announce(auth.pinInvalid())` |
| `screenReader.announceSuccess('Conto privato sbloccato.')` | `announce(auth.privateUnlocked())` |
| `screenReader.announceSuccess('PIN privato configurato.')` | `announce(auth.pinSet())` |
| `screenReader.announceSuccess('PIN privato modificato.')` | `announce(auth.pinChanged())` |
| `screenReader.announceSuccess('PIN privato rimosso.')` | `announce(auth.pinRemoved())` |
| `screenReader.announceSuccess('Sessione mantenuta attiva.')` | `announce(auth.sessionKept())` |

**Passo 6 — Aggiunta in `lockPrivate`:**
Nella funzione `lockPrivate`, dopo `setIsPrivateUnlocked(false)`, aggiungere:
```ts
announce(auth.privateAccountLocked())
```

**Passo 7 — Pulizia dependency array `useCallback`:**
Rimuovere `screenReader` e `isScreenReaderActive` da tutte le deps list dei `useCallback`.
`announce` e `auth.*` sono identità stabili esportate da un modulo — non vanno aggiunte nelle deps.

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -rE "useScreenReader|screenReader\.|isScreenReaderActive" src/context/AuthContext.tsx` restituisce 0 risultati.

---

### Task ID: 004.T13

- **File target:** `src/context/AppDataContext.tsx` (PATCH)
- **Azione:** Migrare da `useScreenReader` a `@/announcements`. Rimuovere detection DOM. I parametri numerici vanno passati **raw** (non pre-formattati con `formatCurrency`).
- **Dipende da:** 004.T11
- **Nota:** Prima di applicare le sostituzioni, verificare le righe effettive con:
  ```bash
  grep -nE "useScreenReader|screenReader\." src/context/AppDataContext.tsx
  ```

**Passo 1 — Import da rimuovere:**
```ts
// RIMUOVERE la riga:
import { useScreenReader } from '@/hooks/use-screen-reader'
```

**Passo 2 — Import da aggiungere:**
```ts
import { announce, accounts, budgets } from '@/announcements'
```

**Passo 3 — Dichiarazione da rimuovere:**
```ts
// RIMUOVERE:
const screenReader = useScreenReader()
```

**Passo 4 — Sostituzioni `screenReader.*` → `announce(accounts.*/budgets.*)`:**

| Prima (testo cercato) | Dopo (testo sostitutivo) |
|---|---|
| `` screenReader.announceSuccess(`Conto ${account.nome} modificato con successo.`) `` | `announce(accounts.accountModified(account.nome))` |
| `` screenReader.announceSuccess(`Nuovo conto ${account.nome} di tipo ${account.tipo} creato con saldo iniziale di ${formatCurrency(account.saldoIniziale)}.`) `` | `announce(accounts.announceAccountCreated(account.nome, account.tipo, account.saldoIniziale))` |
| `screenReader.announceSuccess('Movimento modificato con successo.')` | `announce(accounts.transactionModified())` |
| `screenReader.announceTransaction(transaction.tipo, transaction.importo, account?.nome \|\| 'Conto sconosciuto', category?.nome)` | `announce(accounts.announceTransaction(transaction.tipo, transaction.importo, account?.nome ?? 'Conto sconosciuto', category?.nome))` |
| `` screenReader.announceSuccess(`Budget ${budget.nome} modificato.`) `` | `announce(budgets.budgetModified(budget.nome))` |
| `` screenReader.announceSuccess(`Nuovo budget ${budget.nome} creato. Importo target: ${formatCurrency(budget.importoTarget)} per periodo ${budget.periodo}.`) `` | `announce(budgets.budgetCreated(budget.nome, budget.importoTarget, budget.periodo))` |
| `` screenReader.announceSuccess(`Obiettivo ${goal.nome} modificato.`) `` | `announce(budgets.savingsGoalModified(goal.nome))` |
| `` screenReader.announceSuccess(`Nuovo obiettivo di risparmio ${goal.nome} creato. Target: ${formatCurrency(goal.importoTarget)}.`) `` | `announce(budgets.announceSavingsGoalCreated(goal.nome, goal.importoTarget))` |
| `` screenReader.announceSuccess(`Conto ${account.nome} eliminato. Tutti i movimenti associati sono stati rimossi.`) `` | `announce(accounts.announceAccountDeleted(account.nome))` |
| `screenReader.announceSuccess('Conto eliminato.')` | `announce(accounts.accountDeletedBrief())` |
| `screenReader.announceSuccess('Movimento eliminato.')` | `announce(accounts.transactionDeleted())` |
| `` screenReader.announceSuccess(`Budget ${budget.nome} eliminato.`) `` | `announce(budgets.announceBudgetDeleted(budget.nome))` |
| `screenReader.announceSuccess('Budget eliminato.')` | `announce(budgets.budgetDeletedBrief())` |
| `` screenReader.announceSuccess(`Obiettivo ${goal.nome} eliminato.`) `` | `announce(budgets.announceSavingsGoalDeleted(goal.nome))` |
| `screenReader.announceSuccess('Obiettivo eliminato.')` | `announce(budgets.savingsGoalDeletedBrief())` |
| `` screenReader.announceSuccess(`Dati esportati. ${visibleTransactions.length} movimenti salvati in formato CSV.`) `` | `announce(accounts.announceExportCSV(visibleTransactions.length))` |

**Nota critica sui parametri raw:** Le funzioni `accounts.announceAccountCreated`, `budgets.budgetCreated`, `budgets.announceSavingsGoalCreated` accettano valori **numerici raw**. Le chiamate a `formatCurrency(...)` nei parametri delle righe sostituite devono essere rimosse — il numero grezzo viene passato direttamente. Dopo la patch verificare con `npx tsc --noEmit` per intercettare errori `string is not assignable to number`.

**Nota su `formatCurrency`:** Dopo la patch, verificare se `formatCurrency` è ancora importato e usato altrove nel file. Se non più necessario, rimuovere l'import per evitare warning ESLint.

**Nota su `checkBudgetNotifications`:** La funzione `checkBudgetNotifications` usa sonner toast e **non** usa `screenReader.*`. È fuori scope di questo documento (decisione P4 REPORT 004). Non modificarla.

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -rE "useScreenReader|screenReader\." src/context/AppDataContext.tsx` restituisce 0 risultati.

---

### Task ID: 004.T14

- **File target:** `src/hooks/use-screen-reader.ts` e `src/lib/screen-reader.ts` (DELETE — gate finale bloccante)
- **Azione:** Eliminare i due file legacy dopo aver verificato che nessun file li importa più.
- **Dipende da:** 004.T12, 004.T13
- **Sequenza operativa obbligatoria:**

  **Passo 1 — Verifica residui `use-screen-reader.ts`:**
  ```bash
  grep -r "from.*use-screen-reader\|useScreenReader" src/ --include="*.ts" --include="*.tsx"
  ```
  Atteso: 0 risultati. Se restituisce risultati, le patch ai context non sono complete — tornare a 004.T12 / 004.T13 e correggere.

  **Passo 2 — Elimina `use-screen-reader.ts`:**
  ```bash
  rm src/hooks/use-screen-reader.ts
  ```

  **Passo 3 — Verifica residui `screen-reader.ts`:**
  ```bash
  grep -r "from.*lib/screen-reader\|from.*screen-reader\|ScreenReaderAnnouncer\|screenReader\." src/ --include="*.ts" --include="*.tsx"
  ```
  Atteso: 0 risultati.

  **Passo 4 — Elimina `screen-reader.ts`:**
  ```bash
  rm src/lib/screen-reader.ts
  ```

  **Passo 5 — Verifica build pulita:**
  ```bash
  npx tsc --noEmit
  ```
  Atteso: 0 errori. In caso di errori, diagnosticare l'import mancante e correggere il file consumatore — NON ripristinare i file eliminati.

- **Success Metric:**
  ```bash
  test ! -f src/hooks/use-screen-reader.ts && echo "OK use-screen-reader" || echo "ERRORE: use-screen-reader.ts ancora presente"
  test ! -f src/lib/screen-reader.ts && echo "OK screen-reader" || echo "ERRORE: screen-reader.ts ancora presente"
  npx tsc --noEmit
  ```
  Tutti e tre i comandi terminano puliti.

---

## 4. Gate di validazione

### Gate 1 — `locales/it.ts` (STEP 1, post-004.T1)

```bash
npx tsc --noEmit
grep -c "^  [a-z_]*:" src/locales/it.ts
```
**Criterio:** build pulita; conteggio chiavi = 72.

---

### Gate 2 — `announcements/types.ts` (STEP 2, post-004.T2)

```bash
npx tsc --noEmit
grep -E "import \{ engine" src/announcements/types.ts
# Deve restituire 0 risultati (proibito l'import di engine qui)
```

---

### Gate 3 — `announcements/_utils/*` (STEP 3, post-004.T3/T4/T5/T6)

```bash
npx tsc --noEmit
grep -rE "import \{ engine" src/announcements/_utils/
# Deve restituire 0 risultati
```

---

### Gate 4 — `announcements/{ui,auth,accounts,budgets}.ts` (STEP 4, post-004.T7/T8/T9/T10)

```bash
npx tsc --noEmit
grep -rE "import \{ engine|from '@/accessibility/engine'" src/announcements/ui.ts src/announcements/auth.ts src/announcements/accounts.ts src/announcements/budgets.ts
# Deve restituire 0 risultati
```

---

### Gate 5 — `announcements/index.ts` (STEP 5, post-004.T11)

```bash
npx tsc --noEmit
grep -E "from '@/accessibility/engine'" src/announcements/index.ts
# Deve restituire ESATTAMENTE 1 risultato (unico punto autorizzato)
```

---

### Gate 6 — patch context (STEP 6, post-004.T12 + 004.T13)

```bash
npx tsc --noEmit
grep -rE "useScreenReader|screenReader\." src/context/
# Deve restituire 0 risultati
grep -rE "isScreenReaderActive" src/context/AuthContext.tsx
# Deve restituire 0 risultati
```

---

### Gate 7 (finale bloccante) — eliminazione legacy (STEP 7, post-004.T14)

```bash
test ! -f src/hooks/use-screen-reader.ts && echo "OK use-screen-reader" || echo "ERRORE: use-screen-reader.ts ancora presente"
test ! -f src/lib/screen-reader.ts && echo "OK screen-reader" || echo "ERRORE: screen-reader.ts ancora presente"
npx tsc --noEmit
```

---

## 5. Sequenza commit raccomandata

```
commit 1: feat(locales): aggiungi stringhe di dominio a locales/it.ts
  - src/locales/it.ts (PATCH — 72 chiavi)
  - GATE 1

commit 2: feat(announcements): aggiungi announcements/types.ts
  - src/announcements/types.ts (CREATE)
  - GATE 2

commit 3: feat(announcements): aggiungi utility privati
  - src/announcements/_utils/t.ts (CREATE)
  - src/announcements/_utils/currency.ts (CREATE)
  - src/announcements/_utils/dates.ts (CREATE)
  - src/announcements/_utils/plurals.ts (CREATE)
  - GATE 3

commit 4: feat(announcements): aggiungi moduli di dominio
  - src/announcements/ui.ts (CREATE)
  - src/announcements/auth.ts (CREATE)
  - src/announcements/accounts.ts (CREATE)
  - src/announcements/budgets.ts (CREATE)
  - GATE 4

commit 5: feat(announcements): aggiungi index.ts con re-export
  - src/announcements/index.ts (CREATE — unico import engine)
  - GATE 5

commit 6: refactor(context): migra AuthContext a @/announcements
  - src/context/AuthContext.tsx (PATCH)

commit 7: refactor(context): migra AppDataContext a @/announcements
  - src/context/AppDataContext.tsx (PATCH)
  - GATE 6 (a fine commit 7)

commit 8: chore(legacy): elimina use-screen-reader.ts e screen-reader.ts
  - src/hooks/use-screen-reader.ts (DELETE)
  - src/lib/screen-reader.ts (DELETE)
  - GATE 7 (bloccante — non procedere senza build pulita)
```
