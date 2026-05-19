---
tipo: design
titolo: "Layer announcements/ e migrazione context — sistema annunci accessibili"
versione: 1.0.0
data: 2026-05-19
stato: DRAFT
riferimento-architetturale: docs/0-architecture/ADR_001_sistema-annunci-accessibili.md
sorgente-report: docs/1-reports/004-REPORT_perimetro-design-004.md
precondizione: >
  DESIGN 003 completamente implementato e verificato.
  File eliminati: use-talkback.ts.
  File presente ma deprecato: use-screen-reader.ts
  (deletion differita al gate finale di questo documento).
  File creati: accessibility/types.ts, accessibility/engine.ts,
  accessibility/detection.ts, locales/it.ts (vuoto), locales/index.ts.
perimetro: >
  src/locales/it.ts (PATCH — 72 stringhe),
  src/announcements/types.ts (CREATE),
  src/announcements/_utils/t.ts (CREATE),
  src/announcements/_utils/currency.ts (CREATE),
  src/announcements/_utils/dates.ts (CREATE),
  src/announcements/_utils/plurals.ts (CREATE),
  src/announcements/ui.ts (CREATE),
  src/announcements/auth.ts (CREATE),
  src/announcements/accounts.ts (CREATE),
  src/announcements/budgets.ts (CREATE),
  src/announcements/index.ts (CREATE — ultimo),
  src/context/AuthContext.tsx (PATCH),
  src/context/AppDataContext.tsx (PATCH),
  src/hooks/use-screen-reader.ts (DELETE — gate finale),
  src/lib/screen-reader.ts (DELETE — gate finale)
nota-ordine: >
  L'ordine dei file in questo elenco non è l'ordine di esecuzione.
  L'ordine operativo obbligatorio è definito dal grafo in Sezione 2.
---

# DESIGN 004 — Layer announcements/ e migrazione context

> **Perimetro di questo documento**: costruzione completa del layer
> `src/announcements/` (types, 4 utility privati, 4 moduli di dominio,
> 1 index), patch ai due context che ancora consumano il vecchio sistema
> (`AuthContext.tsx`, `AppDataContext.tsx`), aggiunta di 72 stringhe a
> `src/locales/it.ts`, ed eliminazione definitiva al gate finale dei
> due file legacy `use-screen-reader.ts` e `lib/screen-reader.ts`.
> Dopo questo documento il sistema di annunci accessibili è completo
> e `screen-reader.ts` non esiste più.

---

## 1. Contesto e motivazione

Il DESIGN 003 ha costruito il motore (`accessibility/engine.ts`),
il rilevamento piattaforma (`accessibility/detection.ts`) e l'infrastruttura
minimale di localizzazione (`locales/it.ts` vuoto + `locales/index.ts`).
Ha eliminato `use-talkback.ts`. Ha lasciato deliberatamente intatti
`src/lib/screen-reader.ts` e `src/hooks/use-screen-reader.ts` perché
i loro consumatori (`AuthContext`, `AppDataContext`) non potevano essere
migrati senza il layer semantico.

Questo documento chiude quella migrazione:

1. **Layer semantico**: crea i moduli di `src/announcements/` che traducono
   eventi di dominio in oggetti `Announcement` strutturati, con priorità
   esplicita, leggendo le stringhe da `src/locales/`.
2. **Stringhe di dominio**: aggiunge 72 chiavi a `locales/it.ts` —
   l'oggetto `it`, finora vuoto, diventa il dizionario completo del
   dominio applicativo accessibile.
3. **Migrazione context**: sostituisce ogni chiamata `screenReader.*` in
   `AuthContext` e `AppDataContext` con `announce(modulo.funzione(...))`,
   rimuove la detection DOM `isScreenReaderActive` (web-only, sempre `false`
   in React Native) e i guard `if (!isScreenReaderActive)` che la usavano.
4. **Eliminazione legacy**: al gate finale, dopo aver verificato con grep
   l'assenza di riferimenti residui, elimina `use-screen-reader.ts` e
   `lib/screen-reader.ts`.

Dopo l'esecuzione completa di questo documento:

- Nessun file dell'app importa più `screen-reader.ts` o `use-screen-reader.ts`.
- Il flusso di annuncio rispetta l'ADR_001:
  `dominio → @/announcements (announce + funzione build) → engine.announce()`.
- `engine` viene chiamato da un unico file: `announcements/index.ts`.
- Le stringhe vivono tutte in `locales/it.ts`.
- Il sistema è pronto per il futuro selettore multilingua (passo 4) senza
  alcuna modifica ai chiamanti.

Il source of truth architetturale è
`docs/0-architecture/ADR_001_sistema-annunci-accessibili.md` (versione 1.2.0).
In caso di conflitto fra questo documento e ADR_001 prevale ADR_001.

---

## 2. Grafo delle dipendenze e ordine obbligatorio

Il grafo è identico a quello del REPORT 004 Sezione 2.

```
STEP 0 (precondizione da DESIGN 003 — da verificare prima di iniziare):
  src/accessibility/types.ts         esiste
  src/accessibility/engine.ts        esiste
  src/accessibility/detection.ts     esiste
  src/locales/it.ts                  esiste (oggetto it vuoto)
  src/locales/index.ts               esiste
  src/hooks/use-talkback.ts          NON esiste
  src/hooks/use-screen-reader.ts     PRESENTE MA DEPRECATO
                                     (deletion differita al gate finale di questo documento)
  src/lib/screen-reader.ts           presente — importato da AuthContext e
                                     AppDataContext tramite use-screen-reader.ts

STEP 1 (prerequisito di tutti i moduli announcements/ — nessuna dep nuova):
  src/locales/it.ts                  PATCH — aggiunge 72 stringhe di dominio.
                                     Rende StringKey un tipo concreto non vuoto.
                                     DEVE precedere types.ts che usa StringKey.

STEP 2 (prerequisito di tutti gli altri moduli announcements/):
  src/announcements/types.ts         CREATE — importa Announcement e
                                     AnnouncementPriority come `import type`
                                     da accessibility/types. Definisce
                                     ActionType e actionKeyMap.

STEP 3 (parallelizzabili tra loro, dopo STEP 2):
  src/announcements/_utils/t.ts          CREATE
  src/announcements/_utils/currency.ts   CREATE
  src/announcements/_utils/dates.ts      CREATE
  src/announcements/_utils/plurals.ts    CREATE

STEP 4 (parallelizzabili tra loro, dopo STEP 2 e STEP 3):
  src/announcements/ui.ts            CREATE
  src/announcements/auth.ts          CREATE
  src/announcements/accounts.ts      CREATE
  src/announcements/budgets.ts       CREATE

STEP 5 (dopo STEP 4 — deve essere l'ultimo modulo announcements/):
  src/announcements/index.ts         CREATE — unico punto che importa engine.ts.

STEP 6 (dopo STEP 5 — parallelizzabili tra loro):
  src/context/AuthContext.tsx        PATCH
  src/context/AppDataContext.tsx     PATCH

STEP 7 (gate finale — dopo STEP 6):
  Verifica grep: nessun residuo di use-screen-reader.ts
  src/hooks/use-screen-reader.ts     DELETE
  Verifica grep: nessun residuo di screen-reader.ts
  src/lib/screen-reader.ts           DELETE
  npx tsc --noEmit                   deve restituire 0 errori
```

**Vincoli di commit**:

- STEP 1 e STEP 2 devono stare su due commit separati: senza le stringhe
  in `it.ts`, `StringKey` non contiene le chiavi e `actionKeyMap` di
  `types.ts` non compila.
- STEP 3 e STEP 4 possono coalescersi in pochi commit ma rispettando
  l'ordine: utility prima dei moduli di dominio.
- STEP 5 è obbligatoriamente un commit dedicato: `index.ts` deve esistere
  solo dopo che tutti i moduli che espone sono pronti.
- STEP 6 deve avvenire in un commit unico per ciascun context oppure in
  un singolo commit che li tocca entrambi — non importa, ma entrambi i
  context devono essere migrati prima dello STEP 7.
- STEP 7 è un gate bloccante: la deletion dei due file legacy deve
  avvenire solo dopo aver eseguito i grep di verifica e con build pulita.

**Grafo sintetico delle dipendenze**:

```
locales/it.ts (PATCH)
      │
      ▼
announcements/types.ts  ←  accessibility/types.ts (già esiste, solo import type)
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
      use-screen-reader.ts (DELETE) + screen-reader.ts (DELETE)
```

---

## 3. `src/locales/it.ts` — PATCH

### 3.1 Descrizione della patch

L'oggetto `it` viene esteso con **72 chiavi** di dominio organizzate per
area funzionale. Le 4 chiavi shared di export/import (`export_single`,
`export_plural`, `export_announce`, `import_complete`) appartengono
semanticamente ad `accounts.ts` (decisione P2 del REPORT 004) — sono
chiavi conteggiate una volta sola, ospitate fisicamente nel blocco
"export/import" subito dopo le stringhe `accounts.*`.

Il file mantiene `as const` e l'invariante "nessun import da `./it`
all'esterno di `src/locales/`". Le chiavi seguono il naming già usato in
`screen-reader.ts` quando possibile, per facilitare il diff durante la
migrazione.

### 3.2 Codice TypeScript completo

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

### 3.3 Verifica del conteggio

72 chiavi totali, ripartite come segue:

- 26 chiavi esclusive di `ui.ts` (sezione 1)
- 5 chiavi `azione_*` usate da `ui.ts` via `actionKeyMap` (sezione 2)
- 11 chiavi `accounts.ts` esclusive (sezione 3, `balance_*` → `export_completato_sr`)
- 4 chiavi shared export/import in `accounts.ts` (sezione 4)
- 18 chiavi `budgets.ts` (sezione 5)
- 8 chiavi `auth.ts` (sezione 6)

Totale: 26 + 5 + 11 + 4 + 18 + 8 = 72.

> ⚠️ **Discrepanza rilevata fra Sezione 5 del REPORT 004 e questa patch**:
> il report dichiara 30 chiavi `ui.ts` (26 esclusive + 4 export/import che
> compaiono nella tabella ui.ts) e 15 chiavi `accounts.ts` (11 esclusive
> + 4 export/import). Le 4 chiavi shared export/import sono fisicamente
> presenti una sola volta nel file `it.ts` (sezione 4), e appartengono
> semanticamente ad `accounts.ts`. Il totale fisico di chiavi distinte
> in `it.ts` è quindi **72**, non 77.
>
> Decisione: la patch contiene esattamente le **72 chiavi distinte**
> elencate nel codice sopra (nessuna duplicata). Il numero "77" della
> dicitura del report deriva dal conteggio "5 azioni + 67 stringhe
> originali del 003b". Vedi Sezione 21 per la registrazione formale
> della contraddizione.

---

## 4. `src/announcements/types.ts`

### 4.1 Ruolo

Contratto di tipo interno al layer `announcements/`. Primo file da creare
dopo la patch a `locales/it.ts`. Non importa da `accessibility/engine.ts`
(proibito dall'ADR_001 regola 1). Importa `Announcement` e
`AnnouncementPriority` da `accessibility/types` esclusivamente come
`import type` — eccezione documentata nel DESIGN 003 §3.1 e §12 C3.

### 4.2 Codice TypeScript completo

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

### 4.3 Scope esplicito

**Incluso:**
- Re-export di `Announcement` e `AnnouncementPriority` (solo tipi).
- `ActionType` e `actionKeyMap`.

**Escluso:**
- Nessun codice eseguibile *importato* da `accessibility/`.
  `actionKeyMap` è una costante prodotta localmente in questo file —
  non è importata da `accessibility/` e non viola nessuna regola.
- Nessuna funzione di costruzione — quelle vivono nei moduli di dominio.

---

## 5. `src/announcements/_utils/t.ts`

### 5.1 Ruolo

Helper privato per la sostituzione dei placeholder `{nome}` nelle stringhe
template. Centralizza il pattern `string.replace(/{key}/g, value)` finora
inline in `screen-reader.ts`. **Non esportato da `announcements/index.ts`** —
uso esclusivo interno al layer.

### 5.2 Codice TypeScript completo

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
 * Limitazioni note (documentate in DESIGN 003 §8 R3):
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

### 5.3 Note

L'uso di `split().join()` invece di `String.prototype.replaceAll` è una
scelta deliberata: `replaceAll` richiede ECMAScript 2021 e potrebbe non
essere disponibile su tutti i runtime Hermes/JSC supportati. L'alternativa
`replace(new RegExp(...), value)` richiederebbe escape dei caratteri
speciali — `split().join()` è semanticamente equivalente e immune da
problemi di escape.

**Pattern di composizione a due livelli**: in alcuni moduli `t()` viene
chiamata due volte in sequenza — prima per ottenere una parola di stato
(es. "attivato"), poi di nuovo per inserire quella parola come valore
in una frase più lunga (es. "Filtro X attivato"). Questo è il pattern
corretto e intenzionale per gestire stringhe composte. Non semplificare
queste chiamate in una sola — la separazione serve a garantire che
entrambe le stringhe siano localizzabili indipendentemente.

---

## 6. `src/announcements/_utils/currency.ts`

### 6.1 Ruolo

Formattazione vocale italiana di importi in euro. Sostituisce l'uso inline
di `Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })`
in `screen-reader.ts`. Output orientato alla pronuncia (`"1.234,56 euro"`),
**non** al simbolo grafico (`€`) che non viene pronunciato in modo
prevedibile da tutti gli screen reader.

### 6.2 Codice TypeScript completo

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

---

## 7. `src/announcements/_utils/dates.ts`

### 7.1 Ruolo

Formattazione vocale italiana di date. Sostituisce l'uso inline di
`new Date(deadline).toLocaleDateString('it-IT')` in `screen-reader.ts`,
producendo un formato esteso adatto alla pronuncia (`"31 dicembre 2026"`).

### 7.2 Codice TypeScript completo

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

---

## 8. `src/announcements/_utils/plurals.ts`

### 8.1 Ruolo

Regole di pluralizzazione italiane. Sostituisce la regex inline
`replace(/i$/, 'o')` in `screen-reader.ts` (che andava al contrario:
plurale → singolare) con una funzione esplicita singolare → plurale.
**Decisione P6 del REPORT 004**: `pluralize(word, count)` riceve sempre
la forma singolare; restituisce il singolare se `count === 1`, il plurale
altrimenti. Solo italiano — altre lingue appartengono a file separati.

### 8.2 Codice TypeScript completo

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

---

## 9. `src/announcements/ui.ts`

### 9.1 Ruolo

Annunci di interfaccia generici: navigazione, dialog, errori, conferme,
filtri, ordinamento, volume, preset, template, form, toggle, card,
periodo, help, cancellazione dati, azioni. Non contiene logica di
dominio finanziario.

> **Nota**: `announceExport(count, format)` e `announceImportComplete(count, format)`
> **non esistono in questo file**. Decisione REPORT 004 §8 P2: appartengono
> ad `accounts.ts`. Non esistono versioni generiche in `ui.ts`.

### 9.2 Codice TypeScript completo

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
 * Le azioni completate (salvataggio, creazione, sblocco) sono conferme
 * di operazioni riuscite — per il criterio ADR_001 questo suggerisce
 * `polite`. La scelta definitiva va documentata quando le schermate
 * implementeranno questa funzione e sarà chiaro il contesto d'uso.
 * Non modificare questa priorità autonomamente prima di quella fase.
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

---

## 10. `src/announcements/auth.ts`

### 10.1 Ruolo

Annunci legati ad autenticazione, PIN privato e sessione.

> **Convenzione di naming (decisione REPORT 004 §8 P5)**: tutte le
> funzioni di questo modulo usano nomi senza prefisso `announce`.
> In particolare la funzione si chiama `privateAccountLocked()` —
> il nome originale `announcePrivateAccountLocked()` di `screen-reader.ts`
> è abbandonato.
>
> **Priorità di `sessionKept()` (decisione REPORT 004 §8 P3)**:
> `polite`. La conferma "Sessione mantenuta attiva" è la risposta
> volontaria a un'azione dell'utente — non deve interrompere.

### 10.2 Codice TypeScript completo

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

---

## 11. `src/announcements/accounts.ts`

### 11.1 Ruolo

Annunci legati a conti, movimenti e operazioni di export/import.
Include `announceExport` e `announceImportComplete` (decisione P2:
appartengono al dominio dati finanziari, non a `ui.ts`).

**I parametri numerici sono sempre raw** — la formattazione avviene
internamente via `_utils/currency.ts`. Il chiamante non passa mai
stringhe pre-formattate.

### 11.2 Codice TypeScript completo

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

---

## 12. `src/announcements/budgets.ts`

### 12.1 Ruolo

Annunci legati a budget e obiettivi di risparmio. Contiene la logica
composita per `announceBudgetStatus` (4 rami: exceeded/critical/warning/normal)
e `announceSavingsGoalProgress` (3 rami: done/near/normal), estratta da
`screen-reader.ts`.

### 12.2 Codice TypeScript completo

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

---

## 13. `src/announcements/index.ts`

### 13.1 Ruolo

Unico punto di accesso pubblico al layer `announcements/`. **Unico file**
di `announcements/` che importa `engine` da `@/accessibility/engine`.
Espone la funzione `announce()` e i re-export dei quattro moduli di
dominio come namespace.

> ⚠️ **Invariante ADR_001 (regola 1)**: nessun altro file di
> `announcements/` importa `engine`. L'unico flusso autorizzato è
> `dominio → announcements/index.ts → engine.announce()`.
> Una violazione di questo invariante è un bug che deve essere corretto
> immediatamente — non un'eccezione accettabile.

### 13.2 Codice TypeScript completo

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

### 13.3 Scope esplicito

**Incluso:**
- `announce()` come unica funzione effetto.
- Re-export tipato di `Announcement`, `AnnouncementPriority`, `ActionType`.
- Re-export dei 4 namespace di dominio.

**Escluso:**
- Re-export di `_utils/*` — sono privati al layer.
- Re-export di `engine` — l'incapsulamento è invariante.

---

## 14. Patch `src/context/AuthContext.tsx`

### 14.1 Stato corrente (riferimento REPORT 004 §4.1)

- Riga 12: `import { useScreenReader } from '@/hooks/use-screen-reader'`
- Riga 60: `const screenReader = useScreenReader()`
- Righe 61–63: detection DOM `isScreenReaderActive` (web-only)
- Righe 171, 182, 193, 215, 239: guard `if (!isScreenReaderActive) {`
- Righe 196, 218, 242: `isScreenReaderActive` dentro deps di `useCallback`
- Righe 170, 181, 192, 214, 238, 261, 327: chiamate `screenReader.*`

### 14.2 Rimozioni

| Riga | Codice da rimuovere | Motivazione |
|------|---------------------|-------------|
| 12 | `import { useScreenReader } from '@/hooks/use-screen-reader'` | hook deprecato, eliminato in STEP 7 |
| 60 | `const screenReader = useScreenReader()` | non più necessario |
| 61–63 | `const isScreenReaderActive = typeof document !== 'undefined' && ...` | detection DOM non funziona in React Native, sempre `false` |
| 171, 182, 193, 215, 239 | `if (!isScreenReaderActive) { ... }` guard | i toast sonner devono sempre mostrarsi; `announce()` è fire-and-forget e sicuro da chiamare sempre |
| 196, 218, 242 | `isScreenReaderActive` dalle dep array di `useCallback` | non più definito |

### 14.3 Import da aggiungere

```ts
import { announce, auth } from '@/announcements'
```

### 14.4 Sostituzioni `screenReader.*` → `announce(auth.*)`

| Riga | Prima | Dopo |
|------|-------|------|
| 170 | `screenReader.announceError('PIN privato non configurato.')` | `announce(auth.pinNotConfigured())` |
| 181 | `screenReader.announceError('PIN privato non corretto. Riprova.')` | `announce(auth.pinInvalid())` |
| 192 | `screenReader.announceSuccess('Conto privato sbloccato.')` | `announce(auth.privateUnlocked())` |
| 214 | `screenReader.announceSuccess('PIN privato configurato.')` | `announce(auth.pinSet())` |
| 238 | `screenReader.announceSuccess('PIN privato modificato.')` | `announce(auth.pinChanged())` |
| 261 | `screenReader.announceSuccess('PIN privato rimosso.')` | `announce(auth.pinRemoved())` |
| 327 | `resetTimer(); screenReader.announceSuccess('Sessione mantenuta attiva.')` | `resetTimer(); announce(auth.sessionKept())` |

### 14.5 Chiamata da aggiungere in `lockPrivate`

In `lockPrivate` (attualmente `setIsPrivateUnlocked(false)` senza annuncio):

```ts
setIsPrivateUnlocked(false)
announce(auth.privateAccountLocked())
```

### 14.6 Aggiornamento dependency array `useCallback`

- Rimuovere `screenReader` e `isScreenReaderActive` da tutte le deps list.
- `announce`, `auth.*` sono identità stabili esportate da un modulo —
  non vanno aggiunte in deps array (ESLint react-hooks le ignora
  correttamente). In caso di warning ESLint, aggiungere `announce` alle
  deps (è una function reference stabile, l'inclusione è innocua).

### 14.7 Compatibilità con DESIGN 003

DESIGN 003 ha introdotto `useAccessibilityDetection` per il timer di
inattività adattivo. Questa parte di AuthContext **non viene toccata**
da DESIGN 004 — l'import e l'uso di `useAccessibilityDetection` rimangono
invariati.

---

## 15. Patch `src/context/AppDataContext.tsx`

### 15.1 Stato corrente (riferimento REPORT 004 §4.2)

- Riga 7: `import { useScreenReader } from '@/hooks/use-screen-reader'`
- Riga 190: `const screenReader = useScreenReader()`
- Non usa `useTalkBack` né `useAccessibilityDetection` — nessuna
  detection da aggiungere.

### 15.2 Rimozioni

| Riga | Codice da rimuovere |
|------|---------------------|
| 7 | `import { useScreenReader } from '@/hooks/use-screen-reader'` |
| 190 | `const screenReader = useScreenReader()` |

### 15.3 Import da aggiungere

```ts
import { announce, accounts, budgets } from '@/announcements'
```

### 15.4 Sostituzioni `screenReader.*` → `announce(accounts.*/budgets.*)`

| Riga | Prima | Dopo |
|------|-------|------|
| 475 | `screenReader.announceSuccess(\`Conto ${account.nome} modificato con successo.\`)` | `announce(accounts.accountModified(account.nome))` |
| 482 | `screenReader.announceSuccess(\`Nuovo conto ${account.nome} di tipo ${account.tipo} creato con saldo iniziale di ${formatCurrency(account.saldoIniziale)}.\`)` | `announce(accounts.announceAccountCreated(account.nome, account.tipo, account.saldoIniziale))` |
| 502 | `screenReader.announceSuccess('Movimento modificato con successo.')` | `announce(accounts.transactionModified())` |
| 519–523 | `screenReader.announceTransaction(transaction.tipo, transaction.importo, account?.nome \|\| 'Conto sconosciuto', category?.nome)` | `announce(accounts.announceTransaction(transaction.tipo, transaction.importo, account?.nome ?? 'Conto sconosciuto', category?.nome))` |
| 544 | `screenReader.announceSuccess(\`Budget ${budget.nome} modificato.\`)` | `announce(budgets.budgetModified(budget.nome))` |
| 551 | `screenReader.announceSuccess(\`Nuovo budget ${budget.nome} creato. Importo target: ${formatCurrency(budget.importoTarget)} per periodo ${budget.periodo}.\`)` | `announce(budgets.budgetCreated(budget.nome, budget.importoTarget, budget.periodo))` |
| 568 | `screenReader.announceSuccess(\`Obiettivo ${goal.nome} modificato.\`)` | `announce(budgets.savingsGoalModified(goal.nome))` |
| 575 | `screenReader.announceSuccess(\`Nuovo obiettivo di risparmio ${goal.nome} creato. Target: ${formatCurrency(goal.importoTarget)}.\`)` | `announce(budgets.announceSavingsGoalCreated(goal.nome, goal.importoTarget))` |
| 595 | `screenReader.announceSuccess(\`Conto ${account.nome} eliminato. Tutti i movimenti associati sono stati rimossi.\`)` | `announce(accounts.announceAccountDeleted(account.nome))` |
| 597 | `screenReader.announceSuccess('Conto eliminato.')` | `announce(accounts.accountDeletedBrief())` |
| 602 | `screenReader.announceSuccess('Movimento eliminato.')` | `announce(accounts.transactionDeleted())` |
| 610 | `screenReader.announceSuccess(\`Budget ${budget.nome} eliminato.\`)` | `announce(budgets.announceBudgetDeleted(budget.nome))` |
| 612 | `screenReader.announceSuccess('Budget eliminato.')` | `announce(budgets.budgetDeletedBrief())` |
| 619 | `screenReader.announceSuccess(\`Obiettivo ${goal.nome} eliminato.\`)` | `announce(budgets.announceSavingsGoalDeleted(goal.nome))` |
| 621 | `screenReader.announceSuccess('Obiettivo eliminato.')` | `announce(budgets.savingsGoalDeletedBrief())` |
| 636 | `screenReader.announceSuccess(\`Dati esportati. ${visibleTransactions.length} movimenti salvati in formato CSV.\`)` | `announce(accounts.announceExportCSV(visibleTransactions.length))` |

### 15.5 Nota sui parametri numerici raw

Le nuove funzioni in `accounts.ts` e `budgets.ts` accettano valori
**numerici raw** (es. `account.saldoIniziale: number`), non stringhe
pre-formattate. Le chiamate a `formatCurrency(...)` presenti nei
parametri attuali devono essere **rimosse**: il raw number viene passato
direttamente alla funzione del modulo, che si occupa internamente della
formattazione tramite `_utils/currency.ts`.

In particolare:
- riga 482 → `account.saldoIniziale` (non `formatCurrency(account.saldoIniziale)`)
- riga 551 → `budget.importoTarget` (non `formatCurrency(budget.importoTarget)`)
- riga 575 → `goal.importoTarget` (non `formatCurrency(goal.importoTarget)`)

Verificare durante la patch che l'import di `formatCurrency` rimanga
necessario per altri usi nel file. Se non più utilizzato, rimuoverlo
per evitare warning ESLint.

### 15.6 `checkBudgetNotifications` non viene toccata

La funzione `checkBudgetNotifications` (linea ~435–443 di AppDataContext)
genera notifiche budget con sonner toast e **non** usa `screenReader.*`.
È **fuori scope** di DESIGN 004 (decisione P4 del REPORT 004).
La migrazione a `announce(budgets.announceBudgetStatus(...))` è un
candidato per un documento futuro dedicato al sistema di notifiche
visive.

---

## 16. Eliminazione file legacy (gate finale)

Sequenza obbligatoria dopo le patch ai context (STEP 7 del grafo).

### 16.1 Sequenza operativa

**Passo 1 — verifica residui `use-screen-reader.ts`**:

```bash
grep -r "from.*use-screen-reader\|useScreenReader" src/ --include="*.ts" --include="*.tsx"
```

Atteso: 0 risultati. Se restituisce risultati, le patch ai context
non sono complete — tornare allo STEP 6 e correggere.

**Passo 2 — elimina `use-screen-reader.ts`**:

```bash
rm src/hooks/use-screen-reader.ts
```

**Passo 3 — verifica residui `screen-reader.ts`**:

```bash
grep -r "from.*lib/screen-reader\|from.*screen-reader\|ScreenReaderAnnouncer\|screenReader\." src/ --include="*.ts" --include="*.tsx"
```

Atteso: 0 risultati.

**Passo 4 — elimina `screen-reader.ts`**:

```bash
rm src/lib/screen-reader.ts
```

**Passo 5 — verifica build pulita**:

```bash
npx tsc --noEmit
```

Atteso: 0 errori. In caso di errori, NON ripristinare i file eliminati
con un revert distruttivo — diagnosticare l'errore (probabile import
mancato) e correggere il file consumatore.

### 16.2 Gate post-deletion

```bash
test ! -f src/hooks/use-screen-reader.ts && echo "OK use-screen-reader" || echo "ERRORE: use-screen-reader.ts ancora presente"
test ! -f src/lib/screen-reader.ts && echo "OK screen-reader" || echo "ERRORE: screen-reader.ts ancora presente"
npx tsc --noEmit
```

Tutti e tre i comandi devono terminare puliti per chiudere il documento.

---

## 17. Gate di validazione

Un gate per ogni step. Tutti i gate sono bloccanti.

### Gate 1 — `locales/it.ts` (STEP 1)

```bash
npx tsc --noEmit
grep -c "^  [a-z_]*:" src/locales/it.ts   # conteggio entry oggetto
```

**Criterio**: build pulita; il conteggio entry corrisponde al numero
di chiavi definite (72, vedi Sezione 3.3).
**Se fallisce**: errori di sintassi nell'oggetto `it` o duplicati.

### Gate 2 — `announcements/types.ts` (STEP 2)

```bash
npx tsc --noEmit
grep -E "import \{ engine" src/announcements/types.ts
# Deve restituire 0 risultati (proibito l'import di engine qui)
```

**Criterio**: build pulita; nessun import di `engine`.

### Gate 3 — `announcements/_utils/*` (STEP 3)

```bash
npx tsc --noEmit
grep -rE "import \{ engine" src/announcements/_utils/
# Deve restituire 0 risultati
```

**Criterio**: build pulita; nessun import di `engine`.

### Gate 4 — `announcements/{ui,auth,accounts,budgets}.ts` (STEP 4)

```bash
npx tsc --noEmit
grep -rE "import \{ engine|from '@/accessibility/engine'" src/announcements/ui.ts src/announcements/auth.ts src/announcements/accounts.ts src/announcements/budgets.ts
# Deve restituire 0 risultati
```

**Criterio**: build pulita; nessun modulo di dominio importa `engine`.

### Gate 5 — `announcements/index.ts` (STEP 5)

```bash
npx tsc --noEmit
grep -E "from '@/accessibility/engine'" src/announcements/index.ts
# Deve restituire ESATTAMENTE 1 risultato (qui è l'unico punto autorizzato)
```

**Criterio**: build pulita; esattamente un import di `engine` in tutto
`src/announcements/`.

### Gate 6 — patch context (STEP 6)

```bash
npx tsc --noEmit
grep -rE "useScreenReader|screenReader\." src/context/
# Deve restituire 0 risultati
grep -rE "isScreenReaderActive" src/context/AuthContext.tsx
# Deve restituire 0 risultati
```

**Criterio**: build pulita; nessun residuo di `screenReader` o
`isScreenReaderActive` nei context.

### Gate 7 (finale) — eliminazione legacy (STEP 7)

Vedi Sezione 16.2. È il gate bloccante che chiude il documento.

---

## 18. Cosa NON viene affrontato

| Ambito | Motivazione | Documento previsto |
|--------|-------------|--------------------|
| `src/screens/` (qualsiasi file) | Directory vuota in questa fase | Documenti futuri per ogni schermata |
| `src/components/` (qualsiasi file) | Directory vuota | Documenti futuri per ogni componente |
| `src/lib/haptic-system.ts` | Layer haptic separato | Documento dedicato |
| `src/lib/sound-system.ts` | Layer audio separato | Documento dedicato |
| `src/lib/crypto.ts` | Layer cifratura PIN, indipendente | Fuori perimetro accessibilità |
| `src/hooks/use-online-status.ts` | Hook stato connessione, indipendente | Fuori perimetro |
| `checkBudgetNotifications` in AppDataContext | Usa sonner toast, non `screenReader.*` (decisione P4) | Documento futuro su notifiche visive |
| Supporto multilingua oltre l'italiano | Selettore lingua dinamico in `locales/index.ts` (passo 4) | Documento dedicato |
| Navigazione e focus management | Fuori perimetro engine | Documento dedicato |
| Consolidazione `TalkBackAdaptations` | Scelta Opzione B in DESIGN 003 — duplicazione temporanea accettata | Documento futuro |
| Test automatici Jest per `announcements/` | Fuori perimetro design | Piano test separato |
| `src/lib/budget-alerts.ts` | Stringhe di notifica visiva, non annunci screen reader | Sistema i18n UI futuro |
| Stringhe UI di `src/lib/constants.ts` | Etichette interfaccia visiva | Sistema i18n UI futuro |

---

## 19. Rischi e dipendenze

### R1 — Righe dei context non corrispondono alle righe reali nel codice

**Probabilità**: Media. **Impatto**: Basso (patch fallisce in modo
visibile, non silenzioso).

Le righe esatte indicate in Sezione 14 e 15 derivano da un'ispezione
puntuale del codice durante la stesura del REPORT 004. Modifiche
intermedie (es. import riordinati da formatter) possono spostare i
numeri di linea.

**Mitigazione**: prima di applicare le sostituzioni della Sezione 14
e 15, eseguire:

```bash
grep -nE "useScreenReader|screenReader\.|isScreenReaderActive" \
  src/context/AuthContext.tsx src/context/AppDataContext.tsx
```

Confrontare con la mappa di sostituzione e adeguare le righe se
necessario. Le **sostituzioni** restano valide testualmente — è solo
la riga che può variare.

### R2 — `formatCurrency` nei parametri non rimosso

**Probabilità**: Media. **Impatto**: Alto (errori TypeScript).

`accounts.announceAccountCreated(name, type, initialBalance: number)`
si aspetta un `number`. Se la patch lascia `formatCurrency(account.saldoIniziale)`
nei parametri, TypeScript segnala l'errore `string is not assignable
to number`.

**Mitigazione**: dopo la patch eseguire `npx tsc --noEmit` e correggere
ogni errore di tipo sui parametri delle nuove funzioni. Verificare
particolarmente le righe 482, 551, 575 di AppDataContext.

### R3 — `announcements/index.ts` creato prima dei moduli che espone

**Probabilità**: Bassa (l'ordine STEP 5 è esplicito). **Impatto**: Alto
(build rotta, errori di import).

`index.ts` fa `export * as ui from './ui'`. Se `ui.ts` non esiste, la
build fallisce. Stesso vincolo per `auth`, `accounts`, `budgets`.

**Mitigazione**: rispettare rigorosamente l'ordine STEP 4 → STEP 5.
Agent-Plan deve dedicare un commit separato a `index.ts` e non
includere `index.ts` nello stesso commit dei moduli di dominio.

### R4 — Pluralizzazione di parole non in IRREGULAR

**Probabilità**: Bassa. **Impatto**: Basso (testo grammaticalmente
imperfetto, non crash).

`pluralize()` cade sulle regole morfologiche `o→i`, `a→e`, `e→i` per
parole non in IRREGULAR. Parole con plurali irregolari o invariati
(es. anglicismi, tronche) potrebbero produrre output sbagliati.

**Mitigazione**: nel dominio finanziario corrente non sono attesi casi
fuori da IRREGULAR. In caso di parola nuova non gestita, aggiungere
l'eccezione esplicita a IRREGULAR nel file `_utils/plurals.ts`.

### R5 — Detection DOM `isScreenReaderActive` produceva guard che ora spariscono

**Probabilità**: Certa (è parte della patch). **Impatto**: Nullo
(comportamento desiderato).

I guard `if (!isScreenReaderActive) { toast.error(...) }` rimossi
significano che i toast sonner verranno **sempre** mostrati, non solo
quando lo screen reader è inattivo. Questo è il comportamento corretto:
i toast sono feedback visivo per tutti gli utenti, e `announce()` è
fire-and-forget e sicuro anche quando lo screen reader è inattivo.

**Mitigazione**: nessuna richiesta — è il comportamento atteso.
Documentato qui per evitare che durante il code review venga interpretato
come bug.

---

## 20. Note per Agent-Plan

### Sequenza commit raccomandata

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
  - GATE 7 (bloccante)
```

### Regole operative

- Nessun file di `_utils/` viene esportato da `announcements/index.ts`.
- Il gate finale (STEP 7) è bloccante: non procedere senza build pulita.
- Riferimento esplicito ADR_001 (versione 1.2.0) come fonte di verità.
- `checkBudgetNotifications` non va toccata in nessun commit di
  questo documento (decisione P4).
- L'unico import di `@/accessibility/engine` nell'intero `src/announcements/`
  vive in `index.ts`. Qualunque altro punto è un bug.

### Punti di attenzione per il code review

- Verificare che `formatCurrency` rimanga importato in AppDataContext
  solo se ancora usato per scopi diversi dalle chiamate sostituite.
- Verificare che nessun `useCallback` mantenga `screenReader` o
  `isScreenReaderActive` in dep array dopo la patch.
- Verificare che `lockPrivate` includa la nuova chiamata
  `announce(auth.privateAccountLocked())`.

---

## 21. Contraddizioni rilevate

### C1 — Conteggio chiavi 77 vs 72 distinte in `locales/it.ts`

**Problema**: il prompt e il REPORT 004 Sezione 5 dichiarano un totale di
"77 chiavi da aggiungere a `locales/it.ts`". La composizione dettagliata
nel prompt è:

> 26 chiavi esclusive di `ui.ts` + 4 chiavi `azione_*` + 15 chiavi di
> `accounts.ts` + 4 chiavi shared export/import + 18 chiavi di `budgets.ts`
> + 8 chiavi di `auth.ts` + 2 chiavi `accessibility/` già presenti.

Conteggio aritmetico: 26 + 4 + 15 + 4 + 18 + 8 + 2 = **77**.

Tuttavia:
- Le "15 chiavi di `accounts.ts`" già includono le 4 chiavi shared
  export/import (sezione 4 del REPORT corretto). Sottraendo la doppia
  contabilizzazione si ottengono 15 − 4 = 11 chiavi `accounts.ts`
  esclusive + 4 shared = 15.
- Le "5 chiavi `azione_*`" non sono 4 ma 5 (`salvataggio`, `creazione`,
  `eliminazione`, `esportazione`, `sblocco` — vedi report Sezione 5
  e codice di `actionKeyMap` qui in Sezione 4).
- Le 2 chiavi "accessibility già presenti" (`private_locked`,
  `auth_session_kept_sr`) di fatto **non sono presenti** in `locales/it.ts`
  al termine del DESIGN 003: il DESIGN 003 §6.2 lascia l'oggetto `it`
  vuoto. Vengono aggiunte in **questo** documento sotto le sezioni
  `auth.ts` e quindi non vanno doppiamente contate.

**Conteggio fisico delle chiavi distinte in `locales/it.ts` dopo
questa patch**: 26 + 5 + 11 + 4 + 18 + 8 = **72**.

**Risoluzione adottata**: la patch contiene esattamente le 72 chiavi
distinte elencate nel codice della Sezione 3.2. Il numero "77" della
dicitura del REPORT 004 e del prompt è considerato un errore aritmetico
e non è replicato qui. Se Agent-FrameworkDocs o un Agent-Validate
preferisce mantenere coerenza con la dicitura del report, deve aggiornare
il REPORT 004 Sezione 5 — non questo documento.

**Segnalazione**: l'autore di questo design ha mantenuto la lista
chiavi prescritta dal REPORT senza duplicazioni; la discrepanza di
conteggio è documentata qui e **non risolta autonomamente** —
attende decisione editoriale.

### C2 — `announceExport` e `pluralize()` ridondanti

**Problema**: le chiavi `export_single` (`'elemento esportato'`) e
`export_plural` (`'elementi esportati'`) contengono già la coppia
concordata singolare/plurale completa. L'uso di `pluralize()` per
calcolare il sostantivo è superfluo in questa funzione specifica.

**Risoluzione adottata**: in `accounts.ts` §11.2 la funzione
`announceExport()` seleziona direttamente la chiave corretta in base
al `count` (`t(count === 1 ? 'export_single' : 'export_plural')`) e
non richiama `pluralize()` per il sostantivo. `pluralize()` resta
disponibile per altri usi (es. `ui.announceCount()`).

Questa non è una contraddizione architetturale ma un'asimmetria
implementativa che merita di essere documentata per evitare che venga
"corretta" in modo regressivo durante un futuro refactor.

### C3 — Conteggio chiavi `azione_*`: 4 nel prompt, 5 nel report

**Problema**: il prompt Sezione 5 (correzione Round 4) elenca
"4 chiavi `azione_*` usate da `ui.ts` via `actionKeyMap`", mentre il
REPORT 004 Sezione 5 (tabella ui.ts) e il REPORT 003b elencano 5 chiavi:
`azione_salvataggio`, `azione_creazione`, `azione_eliminazione`,
`azione_esportazione`, `azione_sblocco`.

**Risoluzione adottata**: `actionKeyMap` in Sezione 4.2 contiene tutte
e 5 le chiavi, coerente con la definizione di `ActionType` come union
di 5 letterali. La dicitura "4" del prompt è considerata refuso e non
viene replicata.

### C4 — Riga 327 di AuthContext: il prompt dice "(JSX)" ma è JS

**Problema**: il REPORT 004 §4.1 annota la riga 327 come
`(JSX)` con codice `resetTimer(); screenReader.announceSuccess(...)`.
La presenza di due statement separati con `;` suggerisce un onClick
handler inline, non JSX puro.

**Risoluzione adottata**: la sostituzione di Sezione 14.4 mantiene la
stessa forma `resetTimer(); announce(auth.sessionKept())`. Se durante
la patch l'onClick handler risulta riscritto come blocco multi-linea
(`{ resetTimer(); announce(...) }`), questo è equivalente —
nessuna decisione architetturale dipende da questo dettaglio sintattico.
