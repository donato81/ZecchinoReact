\---

tipo: coding-plan

riferimento-design: docs/2-projects/004-DESIGN\_announcements-layer\_v1\_0\_0.md

versione: 1.0.0

data-estrazione: 2026-05-19

stato: READY

\---



\# PLAN 004 — Layer announcements/ e migrazione context



\## 1. Metadata



\- \*\*Reference Design:\*\* docs/2-projects/004-DESIGN\_announcements-layer\_v1\_0\_0.md

\- \*\*Versione:\*\* 1.0.0

\- \*\*Fase TODO-MASTER:\*\* P2 (conclusione — eliminazione hook web-only) e P3 (Fase 3 — Pulisci context)

\- \*\*Data estrazione:\*\* 2026-05-19



\---



\## 2. Prerequisiti



\- PLAN 003 completamente implementato e tutti i gate superati.

\- File presenti e verificati: `src/accessibility/types.ts`, `src/accessibility/engine.ts`, `src/accessibility/detection.ts`, `src/locales/it.ts` (oggetto vuoto), `src/locales/index.ts`.

\- File eliminato: `src/hooks/use-talkback.ts`.

\- File presente ma deprecato: `src/hooks/use-screen-reader.ts` (deletion al gate finale di questo piano).



\---



\## 3. Task atomici



\### Task ID: 004.T1



\- \*\*File target:\*\* `src/locales/it.ts` (PATCH — aggiunge 72 chiavi al dizionario)

\- \*\*Azione:\*\* Sostituire l'oggetto `it` vuoto con il dizionario completo di 72 chiavi organizzate in 6 aree funzionali. Mantenere `as const`. Non importare da nessun altro file.

\- \*\*Snippet / Codice:\*\*



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

&#x20; // ── 1) UI generica ────────────────────────────────────────────────────

&#x20; navigation\_announce: 'Navigazione a {destination}',

&#x20; error\_prefix: 'Errore: {error}',

&#x20; success\_prefix: 'Successo: {message}',

&#x20; count\_announce: '{count} {items}',

&#x20; dialog\_open: 'Finestra di dialogo aperta: {title}',

&#x20; dialog\_close: 'Finestra di dialogo chiusa',

&#x20; progress\_announce: '{label}: {percentage}%. {current} di {total}',

&#x20; list\_navigation: 'Elemento {position} di {total}: {itemDescription}',

&#x20; filter\_active: 'attivato',

&#x20; filter\_inactive: 'disattivato',

&#x20; filter\_announce: 'Filtro {filterName} {stato}',

&#x20; sort\_ascending: 'crescente',

&#x20; sort\_descending: 'decrescente',

&#x20; sort\_announce: 'Ordinamento per {columnName}, ordine {direction}',

&#x20; volume\_muted: 'Audio disattivato',

&#x20; volume\_level: 'Volume impostato a {level}%',

&#x20; preset\_applied: 'Preset audio {presetName} applicato',

&#x20; template\_selected: 'Template {templateName} selezionato. Campi compilati automaticamente',

&#x20; form\_error: 'Errore nel campo {fieldName}: {error}',

&#x20; form\_field\_filled: 'Campo {fieldName} impostato a {value}',

&#x20; toggle\_enabled: 'attivato',

&#x20; toggle\_disabled: 'disattivato',

&#x20; toggle\_state: '{elementName} {stato}',

&#x20; card\_action: '{action} {itemName}',

&#x20; period\_changed: 'Periodo cambiato a {periodName}',

&#x20; help\_opened: 'Aiuto scorciatoie da tastiera aperto. Usa Tab per navigare, Escape per chiudere',

&#x20; help\_closed: 'Aiuto scorciatoie da tastiera chiuso',

&#x20; data\_cleared: '{dataType} cancellati completamente',



&#x20; // ── 2) Azioni (consumer: ui.ts via actionKeyMap) ──────────────────────

&#x20; azione\_salvataggio: 'Salvato',

&#x20; azione\_creazione: 'Creato',

&#x20; azione\_eliminazione: 'Eliminato',

&#x20; azione\_esportazione: 'Esportato',

&#x20; azione\_sblocco: 'Sbloccato',



&#x20; // ── 3) Conti, movimenti, balance ──────────────────────────────────────

&#x20; balance\_announce: '{accountName}, saldo {formattedBalance}',

&#x20; transaction\_base: 'Movimento {type}: {formattedAmount} su {account}',

&#x20; transaction\_category\_suffix: ', categoria {category}',

&#x20; conto\_creato\_sr: 'Nuovo conto {nome} di tipo {tipo} creato con saldo iniziale di {saldo}.',

&#x20; conto\_modificato\_sr: 'Conto {nome} modificato con successo.',

&#x20; conto\_eliminato\_sr: 'Conto {nome} eliminato. Tutti i movimenti associati sono stati rimossi.',

&#x20; conto\_eliminato\_breve\_sr: 'Conto eliminato.',

&#x20; movimento\_creato\_sr: 'Movimento {tipo} di {importo} aggiunto al conto {conto}.',

&#x20; movimento\_modificato\_sr: 'Movimento modificato con successo.',

&#x20; movimento\_eliminato\_sr: 'Movimento eliminato.',

&#x20; export\_completato\_sr: 'Dati esportati. {count} movimenti salvati in formato CSV.',



&#x20; // ── 4) Export e import (consumer: accounts.ts) ────────────────────────

&#x20; // Decisione REPORT 004 §8 P2: appartengono ad accounts.ts.

&#x20; // Non esistono versioni generiche in ui.ts.

&#x20; export\_single: 'elemento esportato',

&#x20; export\_plural: 'elementi esportati',

&#x20; export\_announce: '{itemCount} {exportLabel} in formato {format}',

&#x20; import\_complete: 'Importazione completata. {itemCount} {dataType} importati',



&#x20; // ── 5) Budget e obiettivi di risparmio ────────────────────────────────

&#x20; budget\_status: 'Budget {name}: {percentage}%, {status}',

&#x20; budget\_status\_exceeded: 'superato di {remaining}',

&#x20; budget\_status\_critical: 'attenzione, rimangono solo {remaining}',

&#x20; budget\_status\_warning: 'rimangono {remaining}',

&#x20; budget\_status\_normal: 'in corso, spesi {spent} su {target}',

&#x20; savings\_goal\_created\_deadline\_suffix: ', scadenza {deadline}',

&#x20; savings\_goal\_progress: 'Obiettivo {nome}: {stato}',

&#x20; savings\_goal\_progress\_done: 'obiettivo raggiunto!',

&#x20; savings\_goal\_progress\_near: 'quasi raggiunto, mancano {remaining}',

&#x20; savings\_goal\_progress\_normal: 'progresso {percentage}%, risparmiati {current} su {target}',

&#x20; budget\_item\_creato\_sr: 'Nuovo budget {nome} creato. Importo target: {target} per periodo {periodo}.',

&#x20; budget\_item\_modificato\_sr: 'Budget {nome} modificato.',

&#x20; budget\_item\_eliminato\_sr: 'Budget {nome} eliminato.',

&#x20; budget\_item\_eliminato\_breve\_sr: 'Budget eliminato.',

&#x20; obiettivo\_creato\_sr: 'Nuovo obiettivo di risparmio {nome} creato. Target: {target}.',

&#x20; obiettivo\_modificato\_sr: 'Obiettivo {nome} modificato.',

&#x20; obiettivo\_eliminato\_sr: 'Obiettivo {nome} eliminato.',

&#x20; obiettivo\_eliminato\_breve\_sr: 'Obiettivo eliminato.',



&#x20; // ── 6) Autenticazione, PIN, sessione ──────────────────────────────────

&#x20; auth\_pin\_not\_configured\_sr: 'PIN privato non configurato.',

&#x20; auth\_pin\_invalid\_sr: 'PIN privato non corretto. Riprova.',

&#x20; auth\_private\_unlocked\_sr: 'Conto privato sbloccato.',

&#x20; auth\_pin\_set\_sr: 'PIN privato configurato.',

&#x20; auth\_pin\_changed\_sr: 'PIN privato modificato.',

&#x20; auth\_pin\_removed\_sr: 'PIN privato rimosso.',

&#x20; auth\_session\_kept\_sr: 'Sessione mantenuta attiva.',

&#x20; private\_locked: 'Conto privato bloccato. I dati privati non sono più visibili',

} as const



export type Strings = typeof it

export type StringKey = keyof Strings

```



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori; `grep -c "^  \[a-z\_]\*:" src/locales/it.ts` restituisce 72.



\---



\### Task ID: 004.T2



\- \*\*File target:\*\* `src/announcements/types.ts` (CREATE)

\- \*\*Azione:\*\* Creare il file con il contratto di tipo del layer `announcements/`. Re-esporta `Announcement` e `AnnouncementPriority` da `@/accessibility/types` come `import type` (eccezione documentata in DESIGN 003 §3.1). Definisce `ActionType` e `actionKeyMap`.

\- \*\*Dipende da:\*\* 004.T1 (usa `StringKey` da `@/locales/index`)

\- \*\*Snippet / Codice:\*\*



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



/\*\*

&#x20;\* Tipo di azione generica annunciabile via `announceAction()` in ui.ts.

&#x20;\* Ogni valore corrisponde a una chiave `azione\_\*` di locales/it.ts

&#x20;\* tramite `actionKeyMap`.

&#x20;\*/

export type ActionType =

&#x20; | 'salvataggio'

&#x20; | 'creazione'

&#x20; | 'eliminazione'

&#x20; | 'esportazione'

&#x20; | 'sblocco'



/\*\*

&#x20;\* Mapping dichiarativo da ActionType alla chiave di stringa corrispondente.

&#x20;\* Usato da `ui.announceAction(actionType)` per ottenere il testo.

&#x20;\* Mantenuto come oggetto piatto per renderizzare il binding visibile e

&#x20;\* verificabile dal type checker.

&#x20;\*/

export const actionKeyMap: Record<ActionType, StringKey> = {

&#x20; salvataggio: 'azione\_salvataggio',

&#x20; creazione: 'azione\_creazione',

&#x20; eliminazione: 'azione\_eliminazione',

&#x20; esportazione: 'azione\_esportazione',

&#x20; sblocco: 'azione\_sblocco',

}

```



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori; `grep -E "import \\{ engine" src/announcements/types.ts` restituisce 0 risultati.



\---



\### Task ID: 004.T3



\- \*\*File target:\*\* `src/announcements/\_utils/t.ts` (CREATE)

\- \*\*Azione:\*\* Creare l'helper privato per la sostituzione dei placeholder `{nome}` nelle stringhe template. Non esportato da `announcements/index.ts`.

\- \*\*Dipende da:\*\* 004.T2

\- \*\*Snippet / Codice:\*\*



```ts

// src/announcements/\_utils/t.ts

//

// Helper privato di sostituzione placeholder.

// Non esportato da announcements/index.ts — uso interno ai moduli

// announcements/\*.ts.



import { strings } from '@/locales/index'

import type { StringKey } from '@/locales/index'



/\*\*

&#x20;\* Legge la stringa template associata a `key` e sostituisce i placeholder

&#x20;\* `{nome}` con i valori in `params`. Restituisce la stringa completata.

&#x20;\*

&#x20;\* Limitazioni note (documentate in DESIGN 004 §5.3):

&#x20;\* - Nessuna verifica che tutti i placeholder della stringa template siano

&#x20;\*   coperti da `params`. Un placeholder mancante rimane nel testo finale

&#x20;\*   come letterale (es. `"{nome}"`).

&#x20;\* - Nessuna verifica che `params` non contenga chiavi superflue —

&#x20;\*   vengono semplicemente ignorate.

&#x20;\*

&#x20;\* @param key Chiave della stringa in locales/it.ts.

&#x20;\* @param params Mappa nome placeholder → valore di sostituzione.

&#x20;\*/

export function t(

&#x20; key: StringKey,

&#x20; params: Record<string, string | number> = {},

): string {

&#x20; const template = strings\[key]

&#x20; let result: string = template

&#x20; for (const \[name, value] of Object.entries(params)) {

&#x20;   result = result.split(`{${name}}`).join(String(value))

&#x20; }

&#x20; return result

}

```



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori.



\---



\### Task ID: 004.T4



\- \*\*File target:\*\* `src/announcements/\_utils/currency.ts` (CREATE)

\- \*\*Azione:\*\* Creare il formatter vocale di importi in euro. Output orientato alla pronuncia (`"1.234,56 euro"`), non al simbolo grafico. Non esportato da `announcements/index.ts`.

\- \*\*Snippet / Codice:\*\*



```ts

// src/announcements/\_utils/currency.ts

//

// Formattazione vocale di importi in euro per gli annunci.

// Non esportato da announcements/index.ts — uso interno ai moduli.



const formatter = new Intl.NumberFormat('it-IT', {

&#x20; minimumFractionDigits: 2,

&#x20; maximumFractionDigits: 2,

})



/\*\*

&#x20;\* Formatta un importo numerico in formato vocale italiano.

&#x20;\* Esempi:

&#x20;\*   1234.56  → "1.234,56 euro"

&#x20;\*   0        → "0,00 euro"

&#x20;\*   -50      → "-50,00 euro"

&#x20;\*

&#x20;\* Il suffisso "euro" è in chiaro per garantire una pronuncia coerente

&#x20;\* su tutti gli screen reader (Narrator, VoiceOver, TalkBack). Il simbolo

&#x20;\* "€" non viene utilizzato perché Narrator su Windows può pronunciarlo

&#x20;\* in modi diversi a seconda della voce installata.

&#x20;\*

&#x20;\* @param amount Importo in euro (può essere negativo o zero).

&#x20;\*/

export function formatCurrencyVocal(amount: number): string {

&#x20; return `${formatter.format(amount)} euro`

}

```



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori.



\---



\### Task ID: 004.T5



\- \*\*File target:\*\* `src/announcements/\_utils/dates.ts` (CREATE)

\- \*\*Azione:\*\* Creare il formatter vocale di date in italiano esteso (`"31 dicembre 2026"`). Non esportato da `announcements/index.ts`.

\- \*\*Snippet / Codice:\*\*



```ts

// src/announcements/\_utils/dates.ts

//

// Formattazione vocale di date per gli annunci.

// Non esportato da announcements/index.ts — uso interno ai moduli.



const formatter = new Intl.DateTimeFormat('it-IT', {

&#x20; day: 'numeric',

&#x20; month: 'long',

&#x20; year: 'numeric',

})



/\*\*

&#x20;\* Formatta una data in formato vocale italiano esteso.

&#x20;\* Esempi:

&#x20;\*   "2026-12-31"               → "31 dicembre 2026"

&#x20;\*   new Date(2026, 4, 19)      → "19 maggio 2026"

&#x20;\*

&#x20;\* Input accettato:

&#x20;\* - oggetto Date

&#x20;\* - stringa ISO 8601 (es. "2026-12-31") o qualsiasi formato accettato

&#x20;\*   dal costruttore Date.

&#x20;\*

&#x20;\* Per input invalido restituisce una stringa vuota — il chiamante è

&#x20;\* responsabile di gestire il fallback. Non viene sollevata eccezione

&#x20;\* per coerenza con il principio fire-and-forget degli annunci.

&#x20;\*

&#x20;\* @param date Data come oggetto Date o stringa parsabile.

&#x20;\*/

export function formatDateVocal(date: Date | string): string {

&#x20; const d = typeof date === 'string' ? new Date(date) : date

&#x20; if (Number.isNaN(d.getTime())) {

&#x20;   return ''

&#x20; }

&#x20; return formatter.format(d)

}

```



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori.



\---



\### Task ID: 004.T6



\- \*\*File target:\*\* `src/announcements/\_utils/plurals.ts` (CREATE)

\- \*\*Azione:\*\* Creare la funzione `pluralize(word, count)` con regole morfologiche italiane e lista di eccezioni irregolari del dominio finanziario. Non esportato da `announcements/index.ts`.

\- \*\*Snippet / Codice:\*\*



```ts

// src/announcements/\_utils/plurals.ts

//

// Pluralizzazione italiana per gli annunci.

// Non esportato da announcements/index.ts — uso interno ai moduli.

//

// Regola operativa (decisione REPORT 004 §8 P6):

//   pluralize(word, count) riceve SEMPRE la forma singolare italiana.

//   Se count === 1 restituisce il singolare immutato.

//   Altrimenti restituisce il plurale derivato.



/\*\*

&#x20;\* Eccezioni italiane irregolari rilevanti per il dominio finanziario.

&#x20;\* Lista esplicita: solo le forme effettivamente attese in chiamate

&#x20;\* presenti nei moduli announcements/. Espandibile su nuove esigenze.

&#x20;\* Chiave: singolare. Valore: plurale.

&#x20;\*/

const IRREGULAR: Record<string, string> = {

&#x20; euro: 'euro',

&#x20; movimento: 'movimenti',

&#x20; elemento: 'elementi',

&#x20; conto: 'conti',

&#x20; budget: 'budget',

&#x20; obiettivo: 'obiettivi',

&#x20; dato: 'dati',

&#x20; categoria: 'categorie',

}



/\*\*

&#x20;\* Restituisce la forma singolare o plurale di `word` in base a `count`.

&#x20;\*

&#x20;\* Regole morfologiche standard applicate quando non esiste una entry

&#x20;\* in IRREGULAR:

&#x20;\*   - parole terminanti in 'o' → 'i' (es. "gatto" → "gatti")

&#x20;\*   - parole terminanti in 'a' → 'e' (es. "casa" → "case")

&#x20;\*   - parole terminanti in 'e' → 'i' (es. "cane" → "cani")

&#x20;\*   - altri suffissi: la parola viene restituita invariata

&#x20;\*     (es. parole tronche, anglicismi)

&#x20;\*

&#x20;\* Casi limite documentati:

&#x20;\* - count === 0 produce il plurale ("0 elementi"), coerente con l'uso

&#x20;\*   italiano standard.

&#x20;\* - count negativo è trattato come plurale.

&#x20;\*

&#x20;\* @param word Forma singolare italiana.

&#x20;\* @param count Numero che determina singolare/plurale.

&#x20;\*/

export function pluralize(word: string, count: number): string {

&#x20; if (count === 1) {

&#x20;   return word

&#x20; }

&#x20; if (Object.prototype.hasOwnProperty.call(IRREGULAR, word)) {

&#x20;   return IRREGULAR\[word]

&#x20; }

&#x20; const last = word.slice(-1)

&#x20; if (last === 'o') {

&#x20;   return `${word.slice(0, -1)}i`

&#x20; }

&#x20; if (last === 'a') {

&#x20;   return `${word.slice(0, -1)}e`

&#x20; }

&#x20; if (last === 'e') {

&#x20;   return `${word.slice(0, -1)}i`

&#x20; }

&#x20; return word

}

```



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori.



\---



\### Task ID: 004.T7



\- \*\*File target:\*\* `src/announcements/ui.ts` (CREATE)

\- \*\*Azione:\*\* Creare il modulo annunci di interfaccia generici. Nessuna logica di dominio finanziario. `announceExport` e `announceImportComplete` \*\*non\*\* appartengono a questo file (appartengono ad `accounts.ts`).

\- \*\*Dipende da:\*\* 004.T2, 004.T3, 004.T6

\- \*\*Snippet / Codice:\*\*



```ts

// src/announcements/ui.ts

//

// Annunci di interfaccia generici. Nessuna logica di dominio finanziario.

// Ogni funzione restituisce un oggetto Announcement strutturato.

//

// Esposto pubblicamente tramite `announcements/index.ts` come namespace `ui`.



import type { Announcement, ActionType } from './types'

import { actionKeyMap } from './types'

import { t } from './\_utils/t'

import { pluralize } from './\_utils/plurals'



export function announceNavigation(destination: string): Announcement {

&#x20; return {

&#x20;   text: t('navigation\_announce', { destination }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announceError(error: string): Announcement {

&#x20; return {

&#x20;   text: t('error\_prefix', { error }),

&#x20;   priority: 'assertive',

&#x20; }

}



export function announceSuccess(message: string): Announcement {

&#x20; return {

&#x20;   text: t('success\_prefix', { message }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announceCount(items: string, count: number): Announcement {

&#x20; const word = pluralize(items, count)

&#x20; return {

&#x20;   text: t('count\_announce', { count, items: word }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announceDialogOpen(title: string): Announcement {

&#x20; return {

&#x20;   text: t('dialog\_open', { title }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announceDialogClose(): Announcement {

&#x20; return {

&#x20;   text: t('dialog\_close'),

&#x20;   priority: 'polite',

&#x20; }

}



export function announceProgress(

&#x20; current: number,

&#x20; total: number,

&#x20; label: string,

): Announcement {

&#x20; const percentage = total > 0 ? Math.round((current / total) \* 100) : 0

&#x20; return {

&#x20;   text: t('progress\_announce', { label, percentage, current, total }),

&#x20;   priority: 'polite',

&#x20; }

}



/\*\*

&#x20;\* Passthrough puro: il testo è già la descrizione fornita dal chiamante.

&#x20;\* Nessuna chiave di stringa coinvolta — `elementDescription` è già la

&#x20;\* stringa finale.

&#x20;\*/

export function announceFocus(elementDescription: string): Announcement {

&#x20; return { text: elementDescription, priority: 'polite' }

}



export function announceListNavigation(

&#x20; position: number,

&#x20; total: number,

&#x20; itemDescription: string,

): Announcement {

&#x20; return {

&#x20;   text: t('list\_navigation', { position, total, itemDescription }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announceFilter(filterName: string, active: boolean): Announcement {

&#x20; const stato = t(active ? 'filter\_active' : 'filter\_inactive')

&#x20; return {

&#x20;   text: t('filter\_announce', { filterName, stato }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announceSort(

&#x20; columnName: string,

&#x20; direction: 'crescente' | 'decrescente',

): Announcement {

&#x20; const dirText = t(direction === 'crescente' ? 'sort\_ascending' : 'sort\_descending')

&#x20; return {

&#x20;   text: t('sort\_announce', { columnName, direction: dirText }),

&#x20;   priority: 'polite',

&#x20; }

}



/\*\*

&#x20;\* Annuncio di un'azione completata. La chiave di stringa è risolta tramite

&#x20;\* `actionKeyMap` definito in types.ts.

&#x20;\*

&#x20;\* ⚠️ NOTA — priorità da rivalutare: la priorità `assertive` è provvisoria.

&#x20;\* Vedi DESIGN 004 §9.1 per la motivazione e le condizioni di riesame.

&#x20;\*/

export function announceAction(actionType: ActionType): Announcement {

&#x20; return {

&#x20;   text: t(actionKeyMap\[actionType]),

&#x20;   priority: 'assertive',

&#x20; }

}



export function announceVolumeChange(level: number, muted: boolean): Announcement {

&#x20; if (muted) {

&#x20;   return { text: t('volume\_muted'), priority: 'polite' }

&#x20; }

&#x20; return {

&#x20;   text: t('volume\_level', { level }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announcePresetApplied(presetName: string): Announcement {

&#x20; return {

&#x20;   text: t('preset\_applied', { presetName }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announceTemplateSelected(templateName: string): Announcement {

&#x20; return {

&#x20;   text: t('template\_selected', { templateName }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announceFormError(fieldName: string, error: string): Announcement {

&#x20; return {

&#x20;   text: t('form\_error', { fieldName, error }),

&#x20;   priority: 'assertive',

&#x20; }

}



export function announceFormFieldFilled(

&#x20; fieldName: string,

&#x20; value: string,

): Announcement {

&#x20; return {

&#x20;   text: t('form\_field\_filled', { fieldName, value }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announceToggleState(

&#x20; elementName: string,

&#x20; isEnabled: boolean,

): Announcement {

&#x20; const stato = t(isEnabled ? 'toggle\_enabled' : 'toggle\_disabled')

&#x20; return {

&#x20;   text: t('toggle\_state', { elementName, stato }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announceCardAction(action: string, itemName: string): Announcement {

&#x20; return {

&#x20;   text: t('card\_action', { action, itemName }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announcePeriodChange(periodName: string): Announcement {

&#x20; return {

&#x20;   text: t('period\_changed', { periodName }),

&#x20;   priority: 'polite',

&#x20; }

}



export function announceHelpOpened(): Announcement {

&#x20; return { text: t('help\_opened'), priority: 'polite' }

}



export function announceHelpClosed(): Announcement {

&#x20; return { text: t('help\_closed'), priority: 'polite' }

}



export function announceDataCleared(dataType: string): Announcement {

&#x20; return {

&#x20;   text: t('data\_cleared', { dataType }),

&#x20;   priority: 'assertive',

&#x20; }

}

```



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori; `grep -E "import \\{ engine|from '@/accessibility/engine'" src/announcements/ui.ts` restituisce 0 risultati.



\---



\### Task ID: 004.T8



\- \*\*File target:\*\* `src/announcements/auth.ts` (CREATE)

\- \*\*Azione:\*\* Creare il modulo annunci di autenticazione, PIN privato e sessione. Convenzione di naming: nessun prefisso `announce` nelle funzioni. Priorità `sessionKept()` è `polite` (decisione P3 REPORT 004).

\- \*\*Dipende da:\*\* 004.T2, 004.T3

\- \*\*Snippet / Codice:\*\*



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

import { t } from './\_utils/t'



export function pinNotConfigured(): Announcement {

&#x20; return { text: t('auth\_pin\_not\_configured\_sr'), priority: 'assertive' }

}



export function pinInvalid(): Announcement {

&#x20; return { text: t('auth\_pin\_invalid\_sr'), priority: 'assertive' }

}



export function privateUnlocked(): Announcement {

&#x20; return { text: t('auth\_private\_unlocked\_sr'), priority: 'polite' }

}



export function pinSet(): Announcement {

&#x20; return { text: t('auth\_pin\_set\_sr'), priority: 'polite' }

}



export function pinChanged(): Announcement {

&#x20; return { text: t('auth\_pin\_changed\_sr'), priority: 'polite' }

}



export function pinRemoved(): Announcement {

&#x20; return { text: t('auth\_pin\_removed\_sr'), priority: 'polite' }

}



/\*\*

&#x20;\* Conferma a seguito del click "Rimani connesso" nel dialog di scadenza

&#x20;\* sessione. Priorità `polite` (decisione P3): non interrompe.

&#x20;\*/

export function sessionKept(): Announcement {

&#x20; return { text: t('auth\_session\_kept\_sr'), priority: 'polite' }

}



/\*\*

&#x20;\* Annuncio emesso quando l'utente blocca manualmente l'area privata

&#x20;\* (es. tramite `lockPrivate()` in AuthContext). Informativo, non urgente.

&#x20;\*/

export function privateAccountLocked(): Announcement {

&#x20; return { text: t('private\_locked'), priority: 'polite' }

}

```



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori; `grep -E "import \\{ engine|from '@/accessibility/engine'" src/announcements/auth.ts` restituisce 0 risultati.



\---



\### Task ID: 004.T9



\- \*\*File target:\*\* `src/announcements/accounts.ts` (CREATE)

\- \*\*Azione:\*\* Creare il modulo annunci di conti, movimenti, export/import. I parametri numerici sono sempre raw — la formattazione avviene internamente. `announceExport` e `announceImportComplete` appartengono a questo file (decisione P2 REPORT 004).

\- \*\*Dipende da:\*\* 004.T2, 004.T3, 004.T4, 004.T6

\- \*\*Snippet / Codice:\*\*



```ts

// src/announcements/accounts.ts

//

// Annunci legati a conti, movimenti, export e import.

// Inclusione di announceExport/announceImportComplete per decisione P2

// del REPORT 004 — appartengono al dominio dati finanziari.

//

// Esposto pubblicamente tramite `announcements/index.ts` come namespace `accounts`.



import type { Announcement } from './types'

import { t } from './\_utils/t'

import { formatCurrencyVocal } from './\_utils/currency'

import { pluralize } from './\_utils/plurals'



export function announceAccountCreated(

&#x20; name: string,

&#x20; type: string,

&#x20; initialBalance: number,

): Announcement {

&#x20; return {

&#x20;   text: t('conto\_creato\_sr', {

&#x20;     nome: name,

&#x20;     tipo: type,

&#x20;     saldo: formatCurrencyVocal(initialBalance),

&#x20;   }),

&#x20;   priority: 'polite',

&#x20; }

}



export function accountModified(name: string): Announcement {

&#x20; return { text: t('conto\_modificato\_sr', { nome: name }), priority: 'polite' }

}



export function announceAccountDeleted(name: string): Announcement {

&#x20; return {

&#x20;   text: t('conto\_eliminato\_sr', { nome: name }),

&#x20;   priority: 'assertive',

&#x20; }

}



export function accountDeletedBrief(): Announcement {

&#x20; return { text: t('conto\_eliminato\_breve\_sr'), priority: 'assertive' }

}



/\*\*

&#x20;\* Annuncio di un movimento appena registrato. Il suffisso categoria

&#x20;\* viene aggiunto solo se `category` è definito.

&#x20;\*/

export function announceTransaction(

&#x20; type: string,

&#x20; amount: number,

&#x20; account: string,

&#x20; category?: string,

): Announcement {

&#x20; const base = t('transaction\_base', {

&#x20;   type,

&#x20;   formattedAmount: formatCurrencyVocal(amount),

&#x20;   account,

&#x20; })

&#x20; const suffix = category ? t('transaction\_category\_suffix', { category }) : ''

&#x20; return { text: `${base}${suffix}`, priority: 'polite' }

}



export function transactionModified(): Announcement {

&#x20; return { text: t('movimento\_modificato\_sr'), priority: 'polite' }

}



export function transactionAdded(

&#x20; type: string,

&#x20; amount: number,

&#x20; account: string,

): Announcement {

&#x20; return {

&#x20;   text: t('movimento\_creato\_sr', {

&#x20;     tipo: type,

&#x20;     importo: formatCurrencyVocal(amount),

&#x20;     conto: account,

&#x20;   }),

&#x20;   priority: 'polite',

&#x20; }

}



export function transactionDeleted(): Announcement {

&#x20; return { text: t('movimento\_eliminato\_sr'), priority: 'polite' }

}



export function announceBalance(

&#x20; accountName: string,

&#x20; balance: number,

): Announcement {

&#x20; return {

&#x20;   text: t('balance\_announce', {

&#x20;     accountName,

&#x20;     formattedBalance: formatCurrencyVocal(balance),

&#x20;   }),

&#x20;   priority: 'polite',

&#x20; }

}



/\*\*

&#x20;\* Annuncio specifico per export CSV con conteggio movimenti.

&#x20;\* Variante generica multi-formato: `announceExport()` più in basso.

&#x20;\*/

export function announceExportCSV(count: number): Announcement {

&#x20; return {

&#x20;   text: t('export\_completato\_sr', { count }),

&#x20;   priority: 'polite',

&#x20; }

}



/\*\*

&#x20;\* Annuncio generico di export multi-formato. Il formato è un parametro

&#x20;\* (CSV, PDF, Excel, ...). Decisione P2 del REPORT 004: questa funzione

&#x20;\* appartiene ad accounts.ts perché si applica a dati finanziari.

&#x20;\*

&#x20;\* Le chiavi export\_single / export\_plural contengono già la coppia

&#x20;\* concordata singolare/plurale completa ("elemento esportato" /

&#x20;\* "elementi esportati") — la selezione avviene direttamente sul count

&#x20;\* senza necessità di chiamare pluralize().

&#x20;\*/

export function announceExport(itemCount: number, format: string): Announcement {

&#x20; const label = itemCount === 1 ? t('export\_single') : t('export\_plural')

&#x20; return {

&#x20;   text: t('export\_announce', { itemCount, exportLabel: label, format }),

&#x20;   priority: 'polite',

&#x20; }

}



/\*\*

&#x20;\* Annuncio di import completato. Decisione P2 del REPORT 004: appartiene

&#x20;\* ad accounts.ts.

&#x20;\*/

export function announceImportComplete(

&#x20; itemCount: number,

&#x20; dataType: string,

): Announcement {

&#x20; return {

&#x20;   text: t('import\_complete', { itemCount, dataType }),

&#x20;   priority: 'polite',

&#x20; }

}

```



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori; `grep -E "import \\{ engine|from '@/accessibility/engine'" src/announcements/accounts.ts` restituisce 0 risultati.



\---



\### Task ID: 004.T10



\- \*\*File target:\*\* `src/announcements/budgets.ts` (CREATE)

\- \*\*Azione:\*\* Creare il modulo annunci di budget e obiettivi di risparmio. Contiene la logica composita per `announceBudgetStatus` (4 rami) e `announceSavingsGoalProgress` (3 rami).

\- \*\*Dipende da:\*\* 004.T2, 004.T3, 004.T4, 004.T5

\- \*\*Snippet / Codice:\*\*



```ts

// src/announcements/budgets.ts

//

// Annunci legati a budget e obiettivi di risparmio.

// Contiene logica composita per status budget e progresso obiettivo.

//

// Esposto pubblicamente tramite `announcements/index.ts` come namespace `budgets`.



import type { Announcement } from './types'

import { t } from './\_utils/t'

import { formatCurrencyVocal } from './\_utils/currency'

import { formatDateVocal } from './\_utils/dates'



/\*\*

&#x20;\* Annuncio composito sullo stato di un budget.

&#x20;\* Soglie:

&#x20;\*   percentage >= 100 → exceeded

&#x20;\*   percentage >=  90 → critical

&#x20;\*   percentage >=  75 → warning

&#x20;\*   altrimenti        → normal

&#x20;\*/

export function announceBudgetStatus(

&#x20; name: string,

&#x20; spent: number,

&#x20; target: number,

&#x20; percentage: number,

): Announcement {

&#x20; const remaining = Math.max(target - spent, 0)

&#x20; let status: string

&#x20; if (percentage >= 100) {

&#x20;   status = t('budget\_status\_exceeded', {

&#x20;     remaining: formatCurrencyVocal(spent - target),

&#x20;   })

&#x20; } else if (percentage >= 90) {

&#x20;   status = t('budget\_status\_critical', {

&#x20;     remaining: formatCurrencyVocal(remaining),

&#x20;   })

&#x20; } else if (percentage >= 75) {

&#x20;   status = t('budget\_status\_warning', {

&#x20;     remaining: formatCurrencyVocal(remaining),

&#x20;   })

&#x20; } else {

&#x20;   status = t('budget\_status\_normal', {

&#x20;     spent: formatCurrencyVocal(spent),

&#x20;     target: formatCurrencyVocal(target),

&#x20;   })

&#x20; }

&#x20; return {

&#x20;   text: t('budget\_status', { name, percentage: Math.round(percentage), status }),

&#x20;   priority: 'polite',

&#x20; }

}



export function budgetCreated(

&#x20; name: string,

&#x20; target: number,

&#x20; period: string,

): Announcement {

&#x20; return {

&#x20;   text: t('budget\_item\_creato\_sr', {

&#x20;     nome: name,

&#x20;     target: formatCurrencyVocal(target),

&#x20;     periodo: period,

&#x20;   }),

&#x20;   priority: 'polite',

&#x20; }

}



export function budgetModified(name: string): Announcement {

&#x20; return { text: t('budget\_item\_modificato\_sr', { nome: name }), priority: 'polite' }

}



export function announceBudgetDeleted(name: string): Announcement {

&#x20; return {

&#x20;   text: t('budget\_item\_eliminato\_sr', { nome: name }),

&#x20;   priority: 'assertive',

&#x20; }

}



export function budgetDeletedBrief(): Announcement {

&#x20; return { text: t('budget\_item\_eliminato\_breve\_sr'), priority: 'assertive' }

}



/\*\*

&#x20;\* Annuncio di creazione di un obiettivo di risparmio. Se `deadline`

&#x20;\* è valorizzata, viene aggiunto il suffisso con la data formattata.

&#x20;\*/

export function announceSavingsGoalCreated(

&#x20; name: string,

&#x20; target: number,

&#x20; deadline?: string,

): Announcement {

&#x20; const base = t('obiettivo\_creato\_sr', {

&#x20;   nome: name,

&#x20;   target: formatCurrencyVocal(target),

&#x20; })

&#x20; const suffix = deadline

&#x20;   ? t('savings\_goal\_created\_deadline\_suffix', { deadline: formatDateVocal(deadline) })

&#x20;   : ''

&#x20; return { text: `${base}${suffix}`, priority: 'polite' }

}



/\*\*

&#x20;\* Annuncio composito sul progresso di un obiettivo di risparmio.

&#x20;\* Soglie:

&#x20;\*   percentage >= 100 → done

&#x20;\*   percentage >=  75 → near

&#x20;\*   altrimenti        → normal

&#x20;\*/

export function announceSavingsGoalProgress(

&#x20; name: string,

&#x20; current: number,

&#x20; target: number,

&#x20; percentage: number,

): Announcement {

&#x20; let stato: string

&#x20; if (percentage >= 100) {

&#x20;   stato = t('savings\_goal\_progress\_done')

&#x20; } else if (percentage >= 75) {

&#x20;   stato = t('savings\_goal\_progress\_near', {

&#x20;     remaining: formatCurrencyVocal(Math.max(target - current, 0)),

&#x20;   })

&#x20; } else {

&#x20;   stato = t('savings\_goal\_progress\_normal', {

&#x20;     percentage: Math.round(percentage),

&#x20;     current: formatCurrencyVocal(current),

&#x20;     target: formatCurrencyVocal(target),

&#x20;   })

&#x20; }

&#x20; return {

&#x20;   text: t('savings\_goal\_progress', { nome: name, stato }),

&#x20;   priority: 'polite',

&#x20; }

}



export function savingsGoalModified(name: string): Announcement {

&#x20; return { text: t('obiettivo\_modificato\_sr', { nome: name }), priority: 'polite' }

}



export function announceSavingsGoalDeleted(name: string): Announcement {

&#x20; return {

&#x20;   text: t('obiettivo\_eliminato\_sr', { nome: name }),

&#x20;   priority: 'assertive',

&#x20; }

}



export function savingsGoalDeletedBrief(): Announcement {

&#x20; return { text: t('obiettivo\_eliminato\_breve\_sr'), priority: 'assertive' }

}

```



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori; `grep -E "import \\{ engine|from '@/accessibility/engine'" src/announcements/budgets.ts` restituisce 0 risultati.



\---



\### Task ID: 004.T11



\- \*\*File target:\*\* `src/announcements/index.ts` (CREATE — deve essere l'ultimo modulo announcements/)

\- \*\*Azione:\*\* Creare l'unico punto di accesso pubblico al layer. \*\*Unico file di `announcements/`\*\* autorizzato a importare `engine` da `@/accessibility/engine`. Espone `announce()` e i re-export dei quattro namespace di dominio.

\- \*\*Dipende da:\*\* 004.T7, 004.T8, 004.T9, 004.T10 (tutti i moduli devono esistere prima di index.ts)

\- \*\*Snippet / Codice:\*\*



```ts

// src/announcements/index.ts

//

// Unico punto di accesso pubblico al layer announcements/.

// Unico file di announcements/ autorizzato a importare engine.

// Tutto il resto del codice dell'app importa SOLO da '@/announcements'.



import { engine } from '@/accessibility/engine'

import type { Announcement } from './types'



export type { Announcement, AnnouncementPriority, ActionType } from './types'



/\*\*

&#x20;\* Pronuncia un Announcement già costruito.

&#x20;\* Pattern d'uso:

&#x20;\*   import { announce, accounts } from '@/announcements'

&#x20;\*   announce(accounts.accountModified(name))

&#x20;\*

&#x20;\* Fire-and-forget: vedi engine.announce() per il dettaglio del contratto.

&#x20;\*/

export function announce(announcement: Announcement): void {

&#x20; engine.announce(announcement)

}



export \* as ui from './ui'

export \* as auth from './auth'

export \* as accounts from './accounts'

export \* as budgets from './budgets'

```



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori; `grep -E "from '@/accessibility/engine'" src/announcements/index.ts` restituisce \*\*esattamente 1 risultato\*\*; questo è l'unico file di `announcements/` che importa `engine`.



\---



\### Task ID: 004.T12



\- \*\*File target:\*\* `src/context/AuthContext.tsx` (PATCH)

\- \*\*Azione:\*\* Migrare da `useScreenReader` a `@/announcements`. Rimuovere detection DOM (`isScreenReaderActive`). Aggiungere `announce(auth.privateAccountLocked())` in `lockPrivate`.

\- \*\*Dipende da:\*\* 004.T11

\- \*\*Nota:\*\* Prima di applicare le sostituzioni, verificare le righe effettive con:

&#x20; ```bash

&#x20; grep -nE "useScreenReader|screenReader\\.|isScreenReaderActive" src/context/AuthContext.tsx

&#x20; ```

&#x20; I numeri di riga indicati di seguito sono di riferimento e potrebbero essere variati da modifiche precedenti.



\*\*Passo 1 — Import da rimuovere:\*\*

```ts

Prima verificare se la riga esiste nel file con il comando:

grep -n "useScreenReader" src/context/AuthContext.tsx

Procedere con la rimozione solo se il grep restituisce almeno un risultato.

// RIMUOVERE la riga:

import { useScreenReader } from '@/hooks/use-screen-reader'

```



\*\*Passo 2 — Import da aggiungere:\*\*

```ts

import { announce, auth } from '@/announcements'

```



\*\*Passo 3 — Dichiarazioni da rimuovere:\*\*

```ts

// RIMUOVERE:

const screenReader = useScreenReader()

// RIMUOVERE:

const isScreenReaderActive = typeof document !== 'undefined' \&\& /\* ... \*/

```



\*\*Passo 4 — Guard da rimuovere (tutti i blocchi `if (!isScreenReaderActive)`):\*\*

I guard che wrappano chiamate `screenReader.\*` devono essere rimossi — i toast

sonner devono sempre mostrarsi; `announce()` è fire-and-forget e sicuro da

chiamare sempre.



\*\*Passo 5 — Sostituzioni `screenReader.\*` → `announce(auth.\*)`:\*\*



| Prima (testo cercato) | Dopo (testo sostitutivo) |

|---|---|

| `screenReader.announceError('PIN privato non configurato.')` | `announce(auth.pinNotConfigured())` |

| `screenReader.announceError('PIN privato non corretto. Riprova.')` | `announce(auth.pinInvalid())` |

| `screenReader.announceSuccess('Conto privato sbloccato.')` | `announce(auth.privateUnlocked())` |

| `screenReader.announceSuccess('PIN privato configurato.')` | `announce(auth.pinSet())` |

| `screenReader.announceSuccess('PIN privato modificato.')` | `announce(auth.pinChanged())` |

| `screenReader.announceSuccess('PIN privato rimosso.')` | `announce(auth.pinRemoved())` |

| `screenReader.announceSuccess('Sessione mantenuta attiva.')` | `announce(auth.sessionKept())` |



\*\*Passo 6 — Aggiunta in `lockPrivate`:\*\*

Nella funzione `lockPrivate`, dopo `setIsPrivateUnlocked(false)`, aggiungere:

```ts

announce(auth.privateAccountLocked())

```



\*\*Passo 7 — Pulizia dependency array `useCallback`:\*\*

Rimuovere `screenReader` e `isScreenReaderActive` da tutte le deps list dei `useCallback`.

`announce` e `auth.\*` sono identità stabili esportate da un modulo — non vanno aggiunte nelle deps.



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori; `grep -rE "useScreenReader|screenReader\\.|isScreenReaderActive" src/context/AuthContext.tsx` restituisce 0 risultati.



\---



\### Task ID: 004.T13



\- \*\*File target:\*\* `src/context/AppDataContext.tsx` (PATCH)

\- \*\*Azione:\*\* Migrare da `useScreenReader` a `@/announcements`. Rimuovere detection DOM. I parametri numerici vanno passati \*\*raw\*\* (non pre-formattati con `formatCurrency`).

\- \*\*Dipende da:\*\* 004.T11

\- \*\*Nota:\*\* Prima di applicare le sostituzioni, verificare le righe effettive con:

&#x20; ```bash

&#x20; grep -nE "useScreenReader|screenReader\\." src/context/AppDataContext.tsx

&#x20; ```



\*\*Passo 1 — Import da rimuovere:\*\*

```ts

// RIMUOVERE la riga:

import { useScreenReader } from '@/hooks/use-screen-reader'

```



\*\*Passo 2 — Import da aggiungere:\*\*

```ts

import { announce, accounts, budgets } from '@/announcements'

```



\*\*Passo 3 — Dichiarazione da rimuovere:\*\*

```ts

// RIMUOVERE:

const screenReader = useScreenReader()

```



\*\*Passo 4 — Sostituzioni `screenReader.\*` → `announce(accounts.\*/budgets.\*)`:\*\*



| Prima (testo cercato) | Dopo (testo sostitutivo) |

|---|---|

| `` screenReader.announceSuccess(`Conto ${account.nome} modificato con successo.`) `` | `announce(accounts.accountModified(account.nome))` |

| `` screenReader.announceSuccess(`Nuovo conto ${account.nome} di tipo ${account.tipo} creato con saldo iniziale di ${formatCurrency(account.saldoIniziale)}.`) `` | `announce(accounts.announceAccountCreated(account.nome, account.tipo, account.saldoIniziale))` |

| `screenReader.announceSuccess('Movimento modificato con successo.')` | `announce(accounts.transactionModified())` |

| `screenReader.announceTransaction(transaction.tipo, transaction.importo, account?.nome \\|\\| 'Conto sconosciuto', category?.nome)` | `announce(accounts.announceTransaction(transaction.tipo, transaction.importo, account?.nome ?? 'Conto sconosciuto', category?.nome))` |

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



\*\*Nota critica sui parametri raw:\*\* Le funzioni `accounts.announceAccountCreated`, `budgets.budgetCreated`, `budgets.announceSavingsGoalCreated` accettano valori \*\*numerici raw\*\*. Le chiamate a `formatCurrency(...)` nei parametri delle righe sostituite devono essere rimosse — il numero grezzo viene passato direttamente. Dopo la patch verificare con `npx tsc --noEmit` per intercettare errori `string is not assignable to number`.



\*\*Nota su `formatCurrency`:\*\* Dopo la patch, verificare se `formatCurrency` è ancora importato e usato altrove nel file. Se non più necessario, rimuovere l'import per evitare warning ESLint.



\*\*Nota su `checkBudgetNotifications`:\*\* La funzione `checkBudgetNotifications` usa sonner toast e \*\*non\*\* usa `screenReader.\*`. È fuori scope di questo documento (decisione P4 REPORT 004). Non modificarla.



\- \*\*Success Metric:\*\* `npx tsc --noEmit` senza errori; `grep -rE "useScreenReader|screenReader\\." src/context/AppDataContext.tsx` restituisce 0 risultati.



\---



\### Task ID: 004.T14



\- \*\*File target:\*\* `src/hooks/use-screen-reader.ts` e `src/lib/screen-reader.ts` (DELETE — gate finale bloccante)

\- \*\*Azione:\*\* Eliminare i due file legacy dopo aver verificato che nessun file li importa più.

\- \*\*Dipende da:\*\* 004.T12, 004.T13

\- \*\*Sequenza operativa obbligatoria:\*\*



&#x20; \*\*Passo 1 — Verifica residui `use-screen-reader.ts`:\*\*

&#x20; ```bash

&#x20; grep -r "from.\*use-screen-reader\\|useScreenReader" src/ --include="\*.ts" --include="\*.tsx"

&#x20; ```

&#x20; Atteso: 0 risultati. Se restituisce risultati, le patch ai context non sono complete — tornare a 004.T12 / 004.T13 e correggere.



&#x20; \*\*Passo 2 — Elimina `use-screen-reader.ts`:\*\*

&#x20; ```bash

&#x20; rm src/hooks/use-screen-reader.ts

&#x20; ```



&#x20; \*\*Passo 3 — Verifica residui `screen-reader.ts`:\*\*

&#x20; ```bash

&#x20; grep -r "from.\*lib/screen-reader\\|from.\*screen-reader\\|ScreenReaderAnnouncer\\|screenReader\\." src/ --include="\*.ts" --include="\*.tsx"

&#x20; ```

&#x20; Atteso: 0 risultati.



&#x20; \*\*Passo 4 — Elimina `screen-reader.ts`:\*\*

&#x20; ```bash

&#x20; rm src/lib/screen-reader.ts

&#x20; ```



&#x20; \*\*Passo 5 — Verifica build pulita:\*\*

&#x20; ```bash

&#x20; npx tsc --noEmit

&#x20; ```

&#x20; Atteso: 0 errori. In caso di errori, diagnosticare l'import mancante e correggere il file consumatore — NON ripristinare i file eliminati.



\- \*\*Success Metric:\*\*

&#x20; ```bash

&#x20; test ! -f src/hooks/use-screen-reader.ts \&\& echo "OK use-screen-reader" || echo "ERRORE: use-screen-reader.ts ancora presente"

&#x20; test ! -f src/lib/screen-reader.ts \&\& echo "OK screen-reader" || echo "ERRORE: screen-reader.ts ancora presente"

&#x20; npx tsc --noEmit

&#x20; ```

&#x20; Tutti e tre i comandi terminano puliti.



\---



\## 4. Gate di validazione



> NOTA OPERATIVA — Baseline TypeScript: nei gate che indicano

> "npx tsc --noEmit senza errori" si intende sempre "senza

> errori NUOVI rispetto al baseline legacy di circa 89 errori".



\### Gate 1 — `locales/it.ts` (STEP 1, post-004.T1)



```bash

npx tsc --noEmit

grep -c "^  \[a-z\_]\*:" src/locales/it.ts

```

\*\*Criterio:\*\* build pulita; conteggio chiavi = 72.



\---



\### Gate 2 — `announcements/types.ts` (STEP 2, post-004.T2)



```bash

npx tsc --noEmit

grep -E "import \\{ engine" src/announcements/types.ts

\# Deve restituire 0 risultati (proibito l'import di engine qui)

```



\---



\### Gate 3 — `announcements/\_utils/\*` (STEP 3, post-004.T3/T4/T5/T6)



```bash

npx tsc --noEmit

grep -rE "import \\{ engine" src/announcements/\_utils/

\# Deve restituire 0 risultati

```



\---



\### Gate 4 — `announcements/{ui,auth,accounts,budgets}.ts` (STEP 4, post-004.T7/T8/T9/T10)



```bash

npx tsc --noEmit

grep -rE "import \\{ engine|from '@/accessibility/engine'" src/announcements/ui.ts src/announcements/auth.ts src/announcements/accounts.ts src/announcements/budgets.ts

\# Deve restituire 0 risultati

```



\---



\### Gate 5 — `announcements/index.ts` (STEP 5, post-004.T11)



```bash

npx tsc --noEmit

grep -E "from '@/accessibility/engine'" src/announcements/index.ts

\# Deve restituire ESATTAMENTE 1 risultato (unico punto autorizzato)

```



\---



\### Gate 6 — patch context (STEP 6, post-004.T12 + 004.T13)



```bash

npx tsc --noEmit

grep -rE "useScreenReader|screenReader\\." src/context/

\# Deve restituire 0 risultati

grep -rE "isScreenReaderActive" src/context/AuthContext.tsx

\# Deve restituire 0 risultati

```



\---



\### Gate 7 (finale bloccante) — eliminazione legacy (STEP 7, post-004.T14)



```bash

test ! -f src/hooks/use-screen-reader.ts \&\& echo "OK use-screen-reader" || echo "ERRORE: use-screen-reader.ts ancora presente"

test ! -f src/lib/screen-reader.ts \&\& echo "OK screen-reader" || echo "ERRORE: screen-reader.ts ancora presente"

npx tsc --noEmit

```



\---



\## 5. Sequenza commit raccomandata



```

commit 1: feat(locales): aggiungi stringhe di dominio a locales/it.ts

&#x20; - src/locales/it.ts (PATCH — 72 chiavi)

&#x20; - GATE 1



commit 2: feat(announcements): aggiungi announcements/types.ts

&#x20; - src/announcements/types.ts (CREATE)

&#x20; - GATE 2



commit 3: feat(announcements): aggiungi utility privati

&#x20; - src/announcements/\_utils/t.ts (CREATE)

&#x20; - src/announcements/\_utils/currency.ts (CREATE)

&#x20; - src/announcements/\_utils/dates.ts (CREATE)

&#x20; - src/announcements/\_utils/plurals.ts (CREATE)

&#x20; - GATE 3



commit 4: feat(announcements): aggiungi moduli di dominio

&#x20; - src/announcements/ui.ts (CREATE)

&#x20; - src/announcements/auth.ts (CREATE)

&#x20; - src/announcements/accounts.ts (CREATE)

&#x20; - src/announcements/budgets.ts (CREATE)

&#x20; - GATE 4



commit 5: feat(announcements): aggiungi index.ts con re-export

&#x20; - src/announcements/index.ts (CREATE — unico import engine)

&#x20; - GATE 5



commit 6: refactor(context): migra AuthContext a @/announcements

&#x20; - src/context/AuthContext.tsx (PATCH)



commit 7: refactor(context): migra AppDataContext a @/announcements

&#x20; - src/context/AppDataContext.tsx (PATCH)

&#x20; - GATE 6 (a fine commit 7)



commit 8: chore(legacy): elimina use-screen-reader.ts e screen-reader.ts

&#x20; - src/hooks/use-screen-reader.ts (DELETE)

&#x20; - src/lib/screen-reader.ts (DELETE)

&#x20; - GATE 7 (bloccante — non procedere senza build pulita)

```



