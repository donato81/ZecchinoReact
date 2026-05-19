---
tipo: report
titolo: Classificazione contenuto DESIGN 003 rispetto ad ADR_001
versione: 1.0.0
data: 2026-05-18
stato: COMPLETATO
sorgente: docs/2-projects/003-DESIGN_fix-screen-reader-accessibility_v0.3.0.md
riferimento-architetturale: docs/0-architectur/ADR_001_sistema-annunci-accessibili.md
---

# Report — Classificazione contenuto DESIGN 003 rispetto ad ADR_001

---

## Sezione 1 — Riepilogo

| # | Titolo sezione DESIGN 003 | Etichetta | Nota sintetica |
|---|--------------------------|-----------|----------------|
| 1 | Grafo delle dipendenze e ordine obbligatorio | MISTA | Sequenza operativa costruita sul vecchio schema; va ridisegnata nella nuova architettura |
| 2.1 | Motivazione architetturale del sistema locales | LOCALES | Argomentazione per la centralizzazione delle stringhe — rimane valida |
| 2.2 | Struttura proposta `src/locales/` | LOCALES | Struttura dei file `it.ts` / `index.ts` — rimane valida |
| 2.3 | Struttura proposta di `src/locales/it.ts` | LOCALES | Tutte le 67 stringhe del catalogo; la funzione `t()` che accompagna la sezione appartiene ad ANNOUNCEMENTS |
| 2.4 | Struttura proposta di `src/locales/index.ts` | LOCALES | Selettore lingua minimo — rimane invariato |
| 2.5 | Contratto di import e sintassi dei placeholder | MISTA | Regola di import → LOCALES; funzione helper `t()` → ANNOUNCEMENTS |
| 2.6 | Regole per la nomenclatura delle chiavi | LOCALES | Sei regole invarianti per le chiavi `it.ts` — rimangono tutte valide |
| 3.1 | Problema attuale N3 (API DOM in `screen-reader.ts`) | ELIMINA | Tutte le API `document.*`, `HTMLDivElement`, `aria-live` DOM, guard `typeof document` |
| 3.2 | Soluzione proposta per `screen-reader.ts` | MISTA | `announce()` + `AnnouncementPriority` → ACCESSIBILITY; tutti i metodi specializzati + `ActionType` + `actionKeyMap` → ANNOUNCEMENTS |
| 3.3 | File coinvolti (Intervento B) | MISTA | `screen-reader.ts` si spezza tra engine.ts e i moduli announcements/ |
| 3.4 | Scope esplicito (Intervento B) | MISTA | Invarianza API descritta per il vecchio schema; va ripartita tra i nuovi layer |
| 3.5 | Vincolo architetturale di `screen-reader.ts` | MISTA | Le tre responsabilità si distribuiscono: composizione testo → ANNOUNCEMENTS; priorità + API nativa → ACCESSIBILITY |
| 4.1 | Problema attuale N7 (detection browser in `use-talkback.ts`) | ELIMINA | `window.matchMedia`, `sessionStorage`, `speechSynthesis`, `navigator.*`, `document.body.*`, `detectTalkBack()`, `recheckInterval` |
| 4.2 | Soluzione proposta per `use-talkback.ts` | ACCESSIBILITY | L'intero hook diventa `accessibility/detection.ts`; `TalkBackState` → `accessibility/types.ts` |
| 4.3 | File coinvolti (Intervento C) | ACCESSIBILITY | `use-talkback.ts` → `accessibility/detection.ts` |
| 4.4 | Scope esplicito (Intervento C) | ACCESSIBILITY | Tutto il perimetro riguarda la detection della piattaforma |
| 5.1 | Problema attuale (ridondanza `useCallback` in `use-screen-reader.ts`) | ELIMINA | Il file aggregatore monolitico non ha equivalente nella nuova architettura |
| 5.2 | Soluzione proposta per `use-screen-reader.ts` | ELIMINA | Il pattern `useMemo` + `.bind()` è superato: i consumatori usano `announce()` da `announcements/index.ts` |
| 5.3 | File coinvolti (Intervento D) | ELIMINA | `use-screen-reader.ts` non ha equivalente diretto nella nuova architettura |
| 5.4 | Scope esplicito (Intervento D) | ELIMINA | Perimetro dell'Intervento D nella nuova architettura non esiste |
| 6.1 | Problema attuale in `AuthContext.tsx` | MISTA | Detection DOM residua → ELIMINA; pattern `console.warn` da rimpiazzare → ANNOUNCEMENTS |
| 6.2 | Soluzione proposta per `AuthContext.tsx` | MISTA | Metodi di annuncio PIN/sessione → ANNOUNCEMENTS (auth.ts); import `strings` → LOCALES |
| 6.3 | Integrazione timer inattività con screen reader | ACCESSIBILITY | Descrive il pattern "il dominio interroga detection.ts" previsto da ADR_001 |
| 6.4 | Soluzione proposta per `AppDataContext.tsx` | MISTA | Metodi di annuncio conti/movimenti → ANNOUNCEMENTS (accounts.ts); budget/obiettivi → ANNOUNCEMENTS (budgets.ts); import `strings` → LOCALES |
| 6.5 | File coinvolti (Intervento E) | MISTA | AuthContext + AppDataContext toccano ANNOUNCEMENTS e LOCALES |
| 6.6 | Scope esplicito (Intervento E) | MISTA | Perimetro copre ELIMINA (console.warn), ANNOUNCEMENTS (metodi) e LOCALES (strings) |
| 7 | Criteri di validazione per intervento | MISTA | Gate A → LOCALES; Gate B/C → ACCESSIBILITY + ELIMINA; Gate D/E/F → ANNOUNCEMENTS + ELIMINA |
| 8 | Rischi e dipendenze | MISTA | R1/R2 (Windows/Narrator) → ACCESSIBILITY; R3 → LOCALES; R4 → ANNOUNCEMENTS; R5/R6 → ELIMINA |
| 9 | Cosa NON cambia (invarianza API) | MISTA | Invarianza `AnnouncementPriority` → ACCESSIBILITY; invarianza nomi metodi specializzati → ANNOUNCEMENTS; `TalkBackState` → ACCESSIBILITY |
| 10 | Cosa NON viene affrontato (out of scope) | MISTA | Rimane valido come boundary document; i punti 1–5, 8–11 sono indipendenti dall'architettura |

---

## Sezione 2 — Classificazione dettagliata

---

### § 1 — Grafo delle dipendenze e ordine obbligatorio
**Etichetta: MISTA**

La sezione descrive la sequenza di creazione dei cinque interventi (A→B→C→D→E) costruita sul vecchio schema di file: `screen-reader.ts` come monolite, `use-talkback.ts`, `use-screen-reader.ts`, `AuthContext`, `AppDataContext`. Nella nuova architettura ADR_001 questi file vengono ripartiti tra layer diversi e la sequenza deve essere ridisegnata.

- Il nodo "Intervento A — locales" rimane valido come primo passo → **LOCALES**
- I nodi B, C, D corrispondono a file che vengono spezzati o eliminati → contengono logica da distribuire tra **ACCESSIBILITY** e **ANNOUNCEMENTS**
- Il nodo E (patch dei context) rimane rilevante ma i chiamanti cambiano (da `screenReader.*` a `announce(modulo.metodo(...))`) → **ANNOUNCEMENTS**
- Le note sui vincoli di commit e sulla gestione delle eccezioni durante l'implementazione sono metadati operativi indipendenti dall'architettura → non classificabili come contenuto tecnico

---

### § 2.1 — Motivazione architetturale del sistema locales
**Etichetta: LOCALES**

Argomenta perché le stringhe vanno centralizzate (non localizzabile, non testabile in isolamento). Questi due problemi esistono indipendentemente dalla nuova architettura. La motivazione rimane valida e va portata integralmente nel nuovo documento relativo al layer `locales/`.

---

### § 2.2 — Struttura proposta `src/locales/`
**Etichetta: LOCALES**

Definisce i due file `it.ts` / `index.ts` e la regola di import invariante ("nessun file importa direttamente `it.ts`"). Nella nuova architettura il layer `src/locales/` rimane identico — ADR_001 lo conferma come layer trasversale. La sezione è integralmente LOCALES.

---

### § 2.3 — Struttura proposta di `src/locales/it.ts`
**Etichetta: MISTA (prevalentemente LOCALES)**

Le 67 stringhe del catalogo (dal `navigation_announce` alle `azione_*`) appartengono tutte a **LOCALES** — sono testo applicativo italiano destinato ad essere pronunciato, classificabile per area funzionale.

La parte mista riguarda la funzione helper `t(key, params)` presentata in questa sezione come pattern B: nella nuova architettura `t()` è un helper interno ai moduli `announcements/` che costruiscono frasi, non a `locales/`. Il suo codice appartiene a **ANNOUNCEMENTS**.

Le note sulla tassonomia delle chiavi (chiavi finali / chiavi helper compositive / chiavi grammaticali), le regole sul tono degli annunci, la policy di fallback e il contratto sui placeholder appartengono tutte a **LOCALES** come documentazione del sistema di stringhe.

---

### § 2.4 — Struttura proposta di `src/locales/index.ts`
**Etichetta: LOCALES**

Il selettore lingua minimale (restituisce sempre `it`) e la sua struttura sono interamente **LOCALES**. ADR_001 conferma `locales/index.ts` come unico punto di accesso alle stringhe.

---

### § 2.5 — Contratto di import e sintassi dei placeholder
**Etichetta: MISTA**

- La regola di import (`import { strings } from '@/locales/index'`) → **LOCALES**
- Il pattern A (sostituzione inline) → **LOCALES** (regola d'uso delle stringhe)
- Il pattern B (funzione `t()` come helper locale) → **ANNOUNCEMENTS**: nella nuova architettura `t()` è l'helper privato interno ai moduli `announcements/` che costruiscono i testi
- La policy sui casi limite dei placeholder e la limitazione nota di `t()` → appartengono alla documentazione di **ANNOUNCEMENTS** (è lì che `t()` vive)

---

### § 2.6 — Regole per la nomenclatura delle chiavi
**Etichetta: LOCALES**

Le sei regole invarianti (descrivono il significato, nessun nome UI, massimo due livelli, sintassi placeholder, riusabilità, stabilità del contratto) sono tutte documentazione del sistema di stringhe → **LOCALES**. Rimangono valide nella nuova architettura senza modifiche.

---

### § 3.1 — Problema attuale N3 (API DOM in `screen-reader.ts`)
**Etichetta: ELIMINA**

Descrive interamente logica web che non ha equivalente in React Native:
`document.createElement`, `document.body.appendChild`, `HTMLDivElement`, `document.addEventListener('DOMContentLoaded')`, `document.createTextNode`, `region.replaceChildren`, attributi ARIA come stringhe su nodi DOM, la guard `typeof document !== 'undefined'`.

Nella nuova architettura non esiste nessuna forma equivalente di questi meccanismi — l'annuncio avviene tramite `AccessibilityInfo.announceForAccessibility`. Tutto il contenuto di questa sezione descrive ciò che va eliminato.

---

### § 3.2 — Soluzione proposta per `screen-reader.ts`
**Etichetta: MISTA (ACCESSIBILITY + ANNOUNCEMENTS)**

La soluzione propone ancora un monolite (`ScreenReaderAnnouncer`). Nella nuova architettura ADR_001 questo monolite si spezza in due layer:

**Parte → ACCESSIBILITY (`engine.ts`):**
- Tipo `AnnouncementPriority = 'polite' | 'assertive'`
- Metodo `announce(message: string, priority: AnnouncementPriority): void` basato su `AccessibilityInfo.announceForAccessibility`
- Gestione asincrona fire-and-forget
- Validazione minimale: skip se stringa vuota (da vincolo §3.5)
- La spiegazione sul comportamento polite/assertive in RN 0.82 e la forward compatibility

**Parte → ANNOUNCEMENTS:**
- Tipo `ActionType = 'salvataggio' | 'creazione' | 'eliminazione' | 'esportazione' | 'sblocco'`
- `actionKeyMap: Record<ActionType, StringKey>`
- Tutti i 36 metodi specializzati della classe (da `announceNavigation` ad `announceImportComplete`) con la loro logica di composizione, le chiamate a `t()`, le scelte di priorità, la logica composita (budget status, savings goal progress, singular/plural in export e count)
- La spiegazione del vincolo su `announceAction` e la sua tipizzazione su `ActionType`
- Le note sulla logica singolare/plurale di `announceCount` e `announceExport`

Il codice strutturale (classe, costruttore, singleton `screenReader`) appartiene al layer ACCESSIBILITY come struttura del motore; i metodi specializzati appartengono al layer ANNOUNCEMENTS distribuiti tra i moduli specializzati.

---

### § 3.3 — File coinvolti (Intervento B)
**Etichetta: MISTA**

`screen-reader.ts` nella nuova architettura si spezza: la parte engine → `accessibility/engine.ts`; i metodi di dominio → moduli `announcements/`. I prerequisiti `locales/it.ts` e `locales/index.ts` → **LOCALES**.

---

### § 3.4 — Scope esplicito (Intervento B)
**Etichetta: MISTA**

"Incluso" e "Escluso" sono stati scritti per il vecchio monolite. Le invarianze di API descritte si distribuiscono nella nuova architettura:
- `AnnouncementPriority` rimane invariato → **ACCESSIBILITY**
- I 36 nomi di metodo specializzati rimangono come firme delle funzioni build nei moduli `announcements/` → **ANNOUNCEMENTS**
- `ActionType` rimane invariato → **ANNOUNCEMENTS**

---

### § 3.5 — Vincolo architetturale di `screen-reader.ts`
**Etichetta: MISTA**

Le tre responsabilità descritte si distribuiscono nella nuova architettura:
1. Composizione del testo (tramite `t()`) → **ANNOUNCEMENTS**
2. Instradamento per priorità → **ACCESSIBILITY** (`engine.ts` — decide se `assertive` o `polite`)
3. Connessione all'API nativa → **ACCESSIBILITY** (`engine.ts`)

Le esclusioni esplicite ("Escluso da screen-reader.ts": logica di business, logica di decisione, formattazione, logica condizionale, validazione) diventano regole valide per `accessibility/engine.ts` e per i moduli `announcements/`. Il vincolo "nessun file di business conosce engine direttamente" è il principio centrale dell'ADR_001 — questa sezione lo anticipa correttamente.

---

### § 4.1 — Problema attuale N7 (detection browser in `use-talkback.ts`)
**Etichetta: ELIMINA**

Descrive interamente API browser senza equivalente in React Native:
`window.matchMedia`, `navigator.userAgent`, `'ontouchstart' in window`, `navigator.maxTouchPoints`, `window.speechSynthesis.getVoices()`, `sessionStorage.getItem`, `document.body.setAttribute`, `document.body.classList.add`, `window.addEventListener('focus')`, `window.addEventListener('keydown')`.
L'effetto runtime (detection restituisce sempre `{ detected: false, confidence: 'low' }`) è il problema che giustifica l'eliminazione.

---

### § 4.2 — Soluzione proposta per `use-talkback.ts`
**Etichetta: ACCESSIBILITY**

Tutto il contenuto appartiene a `accessibility/detection.ts` e `accessibility/types.ts`:
- `TalkBackState` (con `confidenceLevel: 'high' | 'low'`, eliminazione di `'medium'`) → `accessibility/types.ts`
- `DEFAULT_ADAPTATIONS` → `accessibility/detection.ts`
- `useTalkBack()` intero: lettura iniziale via `AccessibilityInfo.isScreenReaderEnabled()`, listener `screenReaderChanged`, gestione `manualOverride`, cleanup → `accessibility/detection.ts`
- Tutte le funzioni utilitarie: `getTouchTargetSize`, `getAnimationDuration`, `getTimeout`, `shouldUseVerboseDescriptions`, `shouldSimplifyNavigation`, `shouldAutoManageFocus`, `getAriaDescription` → `accessibility/detection.ts`
- `enableTalkBack`, `disableTalkBack`, `resetDetection` (nuovo comportamento), `updateAdaptation`, `resetAdaptations` → `accessibility/detection.ts`
- Spiegazione del comportamento reattivo al cambio stato screen reader durante la sessione → documentazione di `accessibility/detection.ts`
- Rimozione dei side effect DOM → conferma di cosa va ELIMINATO

---

### § 4.3 — File coinvolti (Intervento C)
**Etichetta: ACCESSIBILITY**

`src/hooks/use-talkback.ts` → `src/accessibility/detection.ts`. Nessun contenuto fuori da ACCESSIBILITY in questa sezione.

---

### § 4.4 — Scope esplicito (Intervento C)
**Etichetta: ACCESSIBILITY**

"Incluso": eliminazione detection browser, sostituzione con `AccessibilityInfo`, mantenimento interfacce e funzioni utilitarie, rimozione `recheckInterval` e `detectTalkBack()` — tutto ACCESSIBILITY.
"Escluso": `DEFAULT_ADAPTATIONS`, funzioni utilitarie (logica invariata), `TalkBackAdaptations` — rimangono in ACCESSIBILITY.

---

### § 5.1 — Problema attuale (`use-screen-reader.ts` con 35+ useCallback)
**Etichetta: ELIMINA**

Il problema descritto (ridondanza sistematica, 300+ righe, sincronizzazione manuale) è reale, ma nella nuova architettura ADR_001 il file `use-screen-reader.ts` come aggregatore di tutti i metodi di annuncio non ha equivalente. Il consumatore di React usa direttamente `announce()` importata da `@/announcements`. Il file come descritto non ha una destinazione nella nuova architettura.

---

### § 5.2 — Soluzione proposta per `use-screen-reader.ts`
**Etichetta: ELIMINA**

Il pattern `useMemo` + `.bind(screenReader)` risolve il problema del vecchio schema ma è superato dall'ADR_001: nella nuova architettura non esiste un hook che aggrega tutti i 36 metodi di annuncio. I componenti React che annunciano eventi chiamano `announce(modulo.metodo(data))` da `@/announcements` — non hanno bisogno di un hook che avvolge il motore. Il refactoring descritto in questa sezione non va implementato; il file va discusso nella sua interezza (vedi Sezione 7 — Punti aperti).

---

### § 5.3 — File coinvolti (Intervento D)
**Etichetta: ELIMINA**

`src/hooks/use-screen-reader.ts` non ha file equivalente nella struttura ADR_001. Il file è candidato alla rimozione o a una drastica ridefinizione (vedi Punti aperti).

---

### § 5.4 — Scope esplicito (Intervento D)
**Etichetta: ELIMINA**

"Incluso" e "Escluso" descrivono un intervento che nella nuova architettura non deve essere eseguito nella forma descritta. Tutto il perimetro di questa sezione appartiene al contenuto da eliminare o ridiscutere.

---

### § 6.1 — Problema attuale in `AuthContext.tsx`
**Etichetta: MISTA (ELIMINA + ANNOUNCEMENTS)**

- Detection DOM residua (`document.querySelector('[aria-live]')`, `document.documentElement.getAttribute('data-sr-active')`) → **ELIMINA**
- Guard `if (!isScreenReaderActive)` attorno ai `console.warn` → **ELIMINA**
- Pattern `console.warn(...)` placeholder per sonner → **ELIMINA**
- La necessità di sostituire i placeholder con chiamate reali allo screen reader → contesto per **ANNOUNCEMENTS** (`auth.ts`)

---

### § 6.2 — Soluzione proposta per `AuthContext.tsx`
**Etichetta: MISTA (ANNOUNCEMENTS + LOCALES)**

- I sette metodi di annuncio per PIN e sessione (pinNotConfigured, pinInvalid, privateUnlocked, pinSet, pinChanged, pinRemoved, sessionKept) con le rispettive chiavi e priorità → **ANNOUNCEMENTS** (`auth.ts`)
- `import { strings } from '@/locales/index'` → **LOCALES** (regola d'import)
- La mappa delle sostituzioni (tabella metodo → annuncio → chiave) → **ANNOUNCEMENTS** (`auth.ts`)
- La nota sulla priorità di `auth_session_kept_sr` (polite vs assertive, da rivalutare) → **ANNOUNCEMENTS** (`auth.ts`) — con ambiguità da risolvere (vedi Punti aperti)

---

### § 6.3 — Integrazione timer inattività con screen reader
**Etichetta: ACCESSIBILITY**

Descrive il pattern ADR_001 "il dominio interroga `detection.ts` per sapere lo stato, poi decide da solo cosa farne": `getTimeout(baseMs)` da `useTalkBack` (che diventerà `useDetection` o equivalente in `accessibility/detection.ts`) viene chiamato da `AuthContext` per calcolare `effectiveTimeoutMinutes`. La logica di calcolo e il codice di esempio appartengono alla documentazione del contratto tra il dominio (`AuthContext`) e `accessibility/detection.ts`.

---

### § 6.4 — Soluzione proposta per `AppDataContext.tsx`
**Etichetta: MISTA (ANNOUNCEMENTS + LOCALES + ELIMINA)**

- `console.warn` placeholder → **ELIMINA**
- Import `from 'sonner'` residui → **ELIMINA**
- I metodi di annuncio per conti: `accountCreated`, `accountModified`, `accountDeleted`, `accountDeletedBrief`, `transactionAdded`, `transactionModified`, `transactionDeleted`, `exportCompleted` → **ANNOUNCEMENTS** (`accounts.ts`)
- I metodi di annuncio per budget e obiettivi: `budgetCreated`, `budgetModified`, `budgetDeleted`, `budgetDeletedBrief`, `budgetStatus`, `savingsGoalCreated`, `savingsGoalModified`, `savingsGoalDeleted`, `savingsGoalDeletedBrief`, `savingsGoalProgress` → **ANNOUNCEMENTS** (`budgets.ts`)
- `import { strings } from '@/locales/index'` → **LOCALES**
- La mappa delle sostituzioni (tabella chiamata attuale → chiamata corretta) → **ANNOUNCEMENTS** (conti: `accounts.ts`; budget/obiettivi: `budgets.ts`)
- Regola sui parametri (nomi testuali già risolti, no ID tecnici) → regola operativa di **ANNOUNCEMENTS**
- Regola di scelta del pattern (metodo specializzato vs `announceSuccess`) → regola operativa di **ANNOUNCEMENTS**
- Limitazione nota su `checkBudgetNotifications` (annunci ripetuti) → **ANNOUNCEMENTS** come limitazione documentata

---

### § 6.5 — File coinvolti (Intervento E)
**Etichetta: MISTA**

`AuthContext.tsx` → tocca ANNOUNCEMENTS (`auth.ts`) e LOCALES; `AppDataContext.tsx` → tocca ANNOUNCEMENTS (`accounts.ts`, `budgets.ts`) e LOCALES.

---

### § 6.6 — Scope esplicito (Intervento E)
**Etichetta: MISTA**

"Incluso": rimozione `console.warn` → ELIMINA; aggiunta import `strings` → LOCALES; sostituzione stringhe hardcoded → ANNOUNCEMENTS; integrazione `getTimeout` → ACCESSIBILITY; aggiunta `announceBudgetStatus` → ANNOUNCEMENTS.
"Escluso": logica autenticazione, PIN, interfacce, metodi dei context — invariati e non classificabili.

---

### § 7 — Criteri di validazione per intervento
**Etichetta: MISTA**

I gate di validazione rimangono rilevanti nella nuova architettura ma i path dei file cambiano:
- Gate A (locales) → **LOCALES** — rimane identico
- Gate B (screen-reader.ts): la parte "assenza di document/window" → descrive risultato dell'**ELIMINA**; la verifica funzionale su Narrator → pertinente a **ACCESSIBILITY**
- Gate C (use-talkback.ts): comandi grep per assenza API browser → descrive risultato dell'**ELIMINA**; verifica `isEnabled = true` con screen reader attivo → verifica di **ACCESSIBILITY**
- Gate D (use-screen-reader.ts): interamente obsoleto nella nuova architettura → **ELIMINA**
- Gate E/F (AuthContext/AppDataContext): verifica assenza `console.warn` e `sonner` → **ELIMINA**; verifica occorrenze `strings.*` → **LOCALES** + **ANNOUNCEMENTS**

---

### § 8 — Rischi e dipendenze
**Etichetta: MISTA**

- R1 (`AccessibilityInfo.announceForAccessibility` su Windows/Narrator) → **ACCESSIBILITY** — rimane rilevante
- R2 (firma `addEventListener` su Windows) → **ACCESSIBILITY** — rimane rilevante
- R3 (helper `t()` non verifica placeholder multipli) → **ANNOUNCEMENTS** — rimane rilevante
- R4 (`.bind()` e `this` nel pattern useScreenReader) → **ELIMINA** — rischio del file che verrà rimosso
- R5 (Intervento E prima di Gruppo 1/2) → rimane rilevante come vincolo sequenziale — non classificabile
- R6 (chiave `StringKey` mancante in AuthContext) → **LOCALES** — rimane rilevante
- Dipendenze da passo 4 (localizzazione) e passo 5 (haptic/audio) → **LOCALES** — rimangono valide

---

### § 9 — Cosa NON cambia (invarianza API)
**Etichetta: MISTA**

Le invarianze descritte si ripartiscono nella nuova architettura:
- `AnnouncementPriority = 'polite' | 'assertive'` invariato → **ACCESSIBILITY** (`types.ts`)
- Export `screenReader` (singleton) → sostituito da `announce()` in `announcements/index.ts`; l'invarianza del singleton non si applica nella nuova architettura
- I 36 nomi di metodo pubblici → diventano firme delle funzioni build nei moduli `announcements/`; i nomi restano invariati → **ANNOUNCEMENTS**
- `TalkBackState` (eccetto eliminazione di `'medium'`) → **ACCESSIBILITY** (`types.ts`)
- Funzioni esportate di `useTalkBack` → **ACCESSIBILITY** (`detection.ts`)
- La clausola di invarianza comportamentale e le note sui parametri `_` → rimangono come regole per `accessibility/engine.ts`

---

### § 10 — Cosa NON viene affrontato (out of scope)
**Etichetta: MISTA / Non classificabile come contenuto tecnico**

Questa sezione definisce i confini dello scope e rimane valida come boundary document indipendentemente dall'architettura. I dieci punti si mantengono invariati:
- Punti 1–3 (navigazione, focus, design componenti) → fuori scope per qualsiasi layer
- Punto 4 (multilingua al passo 4) → **LOCALES** come dipendenza futura
- Punto 5 (revisione testi) → **LOCALES** come dipendenza futura
- Punto 6 (revisione contenuto annunci) → **LOCALES** / **ANNOUNCEMENTS** come dipendenza futura
- Punto 7 (haptic/sound) → out of scope invariato
- Punti 8–11 (coda annunci, uniformità SR, workaround piattaforma, normalizzazione placeholder) → tutte esclusioni che rimangono valide nella nuova architettura

---

## Sezione 3 — Contenuto da portare in ACCESSIBILITY

### `accessibility/types.ts`

Proviene da:
- §3.2 — Tipo `AnnouncementPriority = 'polite' | 'assertive'` (attualmente esportato da `screen-reader.ts`)
- §4.2 — Interfaccia `TalkBackState` con campi: `isEnabled: boolean`, `isDetected: boolean`, `confidenceLevel: 'high' | 'low'`, `adaptationsActive: boolean` (eliminato il valore `'medium'`)
- §4.2 (implicito) — Tipo `TalkBackAdaptations` con le sue otto proprietà booleane (presente in `src/lib/supabase/types.ts`, citato in §4.2)

### `accessibility/engine.ts`

Proviene da:
- §3.2 — Metodo `announce(message: string, priority: AnnouncementPriority): void` che chiama `AccessibilityInfo.announceForAccessibility(message)`
- §3.2 — Regola: parametro `priority` mantenuto nella firma per forward compatibility; nella semantica attuale di RN 0.82 entrambe le priorità usano la stessa chiamata
- §3.2 — Comportamento asincrono fire-and-forget (nessuna attesa di completamento, nessun retry)
- §3.5 — Validazione minimale: se il messaggio è vuoto o solo spazi, la chiamata a `AccessibilityInfo` viene saltata silenziosamente
- §3.5 — Esclusioni esplicite: no logica di business, no costruzione di frasi, no formattazione, no condizioni applicative, no cache/debounce

### `accessibility/detection.ts`

Proviene da:
- §4.2 — Lettura iniziale: `AccessibilityInfo.isScreenReaderEnabled()` → `Promise<boolean>` → aggiornamento stato
- §4.2 — Listener: `AccessibilityInfo.addEventListener('screenReaderChanged', handler)` con cleanup `subscription.remove()` (firma RN ≥ 0.65)
- §4.2 — `manualOverride` da `useUserSettings` che sovrascrive il valore nativo in `isEnabled` senza toccare `isDetected` né `confidenceLevel`
- §4.2 — `DEFAULT_ADAPTATIONS` con le otto proprietà booleane inizializzate a `true`/`false`
- §4.2 — Comportamento reattivo al cambio di stato screen reader durante la sessione
- §4.2 — Finestra di incertezza al primo mount (< 100 ms accettata, non compensare con pre-idratazione)
- §4.2 — `enableTalkBack(manual?)`, `disableTalkBack(manual?)`, `resetDetection()` (nuovo comportamento: cancella override, rilegge da `isScreenReaderEnabled()`)
- §4.2 — `updateAdaptation(key, value)`, `resetAdaptations()`
- §4.2 — Funzioni utilitarie con logica invariata: `getTouchTargetSize()`, `getAnimationDuration(baseMs)`, `getTimeout(baseMs)`, `shouldUseVerboseDescriptions()`, `shouldSimplifyNavigation()`, `shouldAutoManageFocus()`, `getAriaDescription(brief, verbose)`
- §6.3 — Pattern di utilizzo da `AuthContext`: `getTimeout(inactivityTimeoutState * 60 * 1000)` per il timeout doppio quando screen reader è attivo
- §4.4 — Esclusioni: rimozione completa di `recheckInterval` e `detectTalkBack()`; rimozione dei side effect DOM (`data-talkback`, classi CSS)

---

## Sezione 4 — Contenuto da portare in ANNOUNCEMENTS

### `announcements/types.ts`

Proviene da:
- §3.2 — Tipo `ActionType = 'salvataggio' | 'creazione' | 'eliminazione' | 'esportazione' | 'sblocco'`
- §3.2 — `actionKeyMap: Record<ActionType, StringKey>` con mapping esplicito verso le chiavi `azione_*`
- ADR_001 §Tipo Announcement — Interfaccia `Announcement { text: string, priority: AnnouncementPriority }` e tipo `AnnouncementPriority` (il tipo `AnnouncementPriority` è definito nel 003 §3.2 per `accessibility/types.ts`; `Announcement` come struttura completa è implicita nel flusso ADR_001 ma non esplicitata nel 003 — vedi Punti aperti)

### `announcements/ui.ts`

Proviene da:
- §3.2 — `announceNavigation(destination)` → testo da `navigation_announce`, priorità `polite`
- §3.2 — `announceError(error)` → testo da `error_prefix`, priorità `assertive`
- §3.2 — `announceSuccess(message)` → testo da `success_prefix`, priorità `polite`
- §3.2 — `announceCount(items, count)` → testo da `count_announce`, priorità `polite`; include logica singolare/plurale italiano (`replace(/i$/, 'o')`) con limitazione documentata
- §3.2 — `announceDialogOpen(title)` → testo da `dialog_open`, priorità `polite`
- §3.2 — `announceDialogClose()` → testo da `dialog_close`, priorità `polite`
- §3.2 — `announceProgress(current, total, label)` → testo da `progress_announce`, priorità `polite`
- §3.2 — `announceFocus(elementDescription)` → puro passthrough, priorità `polite`
- §3.2 — `announceListNavigation(position, total, itemDescription)` → testo da `list_navigation`, priorità `polite`
- §3.2 — `announceFilter(filterName, active)` → testo da `filter_announce` + selezione `filter_active`/`filter_inactive`, priorità `polite`
- §3.2 — `announceSort(columnName, direction)` → testo da `sort_announce` + selezione `sort_ascending`/`sort_descending`, priorità `polite`
- §3.2 — `announceAction(actionType: ActionType)` → testo da `actionKeyMap[actionType]`, priorità `assertive`
- §3.2 — `announceVolumeChange(level, muted)` → testi da `volume_muted`/`volume_level`, priorità `polite`
- §3.2 — `announcePresetApplied(presetName)` → testo da `preset_applied`, priorità `polite`
- §3.2 — `announceTemplateSelected(templateName)` → testo da `template_selected`, priorità `polite`
- §3.2 — `announceFormError(fieldName, error)` → testo da `form_error`, priorità `assertive`
- §3.2 — `announceFormFieldFilled(fieldName, value)` → testo da `form_field_filled`, priorità `polite`
- §3.2 — `announceToggleState(elementName, isEnabled)` → testo da `toggle_state` + `toggle_enabled`/`toggle_disabled`, priorità `polite`
- §3.2 — `announceCardAction(action, itemName)` → testo da `card_action`, priorità `polite`
- §3.2 — `announceExport(itemCount, format)` → testo da `export_announce` + logica singolare/plurale (`export_single`/`export_plural`), priorità `polite`
- §3.2 — `announcePeriodChange(periodName)` → testo da `period_changed`, priorità `polite`
- §3.2 — `announceHelpOpened()` → testo da `help_opened`, priorità `polite`
- §3.2 — `announceHelpClosed()` → testo da `help_closed`, priorità `polite`
- §3.2 — `announceDataCleared(dataType)` → testo da `data_cleared`, priorità `assertive`
- §3.2 — `announceImportComplete(itemCount, dataType)` → testo da `import_complete`, priorità `polite`
- §2.5 — Funzione helper privata `t(key: StringKey, params: Record<string, string>): string` (helper interno, non esportato)
- §3.2 — Criteri di priorità (polite/assertive) applicati a questi metodi

### `announcements/auth.ts`

Proviene da:
- §6.2 — Metodo `pinNotConfigured()` → testo da `auth_pin_not_configured_sr`, priorità `assertive`
- §6.2 — Metodo `pinInvalid()` → testo da `auth_pin_invalid_sr`, priorità `assertive`
- §6.2 — Metodo `privateUnlocked()` → testo da `auth_private_unlocked_sr`, priorità `polite`
- §6.2 — Metodo `pinSet()` → testo da `auth_pin_set_sr`, priorità `polite`
- §6.2 — Metodo `pinChanged()` → testo da `auth_pin_changed_sr`, priorità `polite`
- §6.2 — Metodo `pinRemoved()` → testo da `auth_pin_removed_sr`, priorità `polite`
- §6.2 — Metodo per sessione mantenuta (`sessionKept()`) → testo da `auth_session_kept_sr`, priorità `polite` (con nota: rivalutare se `assertive` — vedi Punti aperti)
- §3.2 — Metodo `announcePrivateAccountLocked()` → testo da `private_locked`, priorità `polite`

### `announcements/accounts.ts`

Proviene da:
- §3.2 — `announceAccountCreated(name, type, initialBalance)` → testo da `conto_creato_sr`, con formattazione `Intl.NumberFormat`, priorità `polite`
- §6.4 — `accountModified(name)` → testo da `conto_modificato_sr.replace('{nome}', name)`, priorità `polite`
- §3.2 — `announceAccountDeleted(name)` → testo da `conto_eliminato_sr`, priorità `assertive`
- §6.4 — `accountDeletedBrief()` → testo da `conto_eliminato_breve_sr`, priorità `assertive`
- §6.4 — `transactionModified()` → testo da `movimento_modificato_sr`, priorità `polite`
- §3.2 — `announceTransaction(type, amount, account, category?)` → testo da `transaction_base` + condizionale `transaction_category_suffix`, priorità `polite`; include formattazione `Intl.NumberFormat`
- §6.4 — `transactionDeleted()` → testo da `movimento_eliminato_sr`, priorità `polite`
- §3.2 — `announceBalance(accountName, balance)` → testo da `balance_announce`, con formattazione `Intl.NumberFormat`, priorità `polite`
- §3.2 — `announceExport(itemCount, format)` → testo da `export_announce` + `export_single`/`export_plural`, priorità `polite` (nota: questo metodo compare anche in `ui.ts` — vedi Punti aperti §7)
- §3.2 — `announceImportComplete(itemCount, dataType)` → testo da `import_complete`, priorità `polite`
- §6.4 — `export_completato_sr` (`announceExportCSV(count)`) → testo da `export_completato_sr`, priorità `polite`

### `announcements/budgets.ts`

Proviene da:
- §3.2 — `announceBudgetStatus(name, spent, target, percentage)` → logica composita con `budget_status` + `budget_status_exceeded`/`budget_status_critical`/`budget_status_warning`/`budget_status_normal`; formattazione `Intl.NumberFormat`; priorità `polite`
- §6.4 — `budgetCreated(name, target, period)` → testo da `budget_item_creato_sr`, con formattazione, priorità `polite`
- §6.4 — `budgetModified(name)` → testo da `budget_item_modificato_sr.replace('{nome}', name)`, priorità `polite`
- §3.2 — `announceBudgetDeleted(name)` → testo da `budget_item_eliminato_sr`, priorità `assertive`
- §6.4 — `budgetDeletedBrief()` → testo da `budget_item_eliminato_breve_sr`, priorità `assertive`
- §3.2 — `announceSavingsGoalCreated(name, target, deadline?)` → testo da `obiettivo_creato_sr` + condizionale `savings_goal_created_deadline_suffix`; formattazione; priorità `polite`
- §3.2 — `announceSavingsGoalProgress(name, current, target, percentage)` → logica composita con `savings_goal_progress` + `savings_goal_progress_done`/`savings_goal_progress_near`/`savings_goal_progress_normal`; formattazione; priorità `polite`
- §6.4 — `savingsGoalModified(name)` → testo da `obiettivo_modificato_sr.replace('{nome}', name)`, priorità `polite`
- §3.2 — `announceSavingsGoalDeleted(name)` → testo da `obiettivo_eliminato_sr`, priorità `assertive`
- §6.4 — `savingsGoalDeletedBrief()` → testo da `obiettivo_eliminato_breve_sr`, priorità `assertive`

### `announcements/index.ts`

Proviene da:
- ADR_001 §Flusso obbligatorio — Funzione `announce(announcement: Announcement): void` che chiama `engine.announce()`
- ADR_001 §Flusso obbligatorio — È l'unico file di `announcements/` che importa da `accessibility/engine.ts`
- ADR_001 §Regole di dipendenza — Re-export dei moduli: `accounts`, `auth`, `budgets`, `ui`
- ADR_001 §Esempio pattern corretto — Interfaccia d'uso: `import { announce, accounts } from '@/announcements'` → `announce(accounts.accountDeleted(data))`

---

## Sezione 5 — Contenuto da portare in LOCALES

Tutte le stringhe provengono da §2.3 (`src/locales/it.ts`). Per ciascuna è indicato il modulo di `announcements/` che la userà come consumer principale.

### Stringhe per `announcements/ui.ts`

| Chiave | Testo | Consumer |
|--------|-------|---------|
| `navigation_announce` | `'Navigazione a {destination}'` | `announcements/ui.ts` |
| `error_prefix` | `'Errore: {error}'` | `announcements/ui.ts` |
| `success_prefix` | `'Successo: {message}'` | `announcements/ui.ts` |
| `count_announce` | `'{count} {items}'` | `announcements/ui.ts` |
| `dialog_open` | `'Finestra di dialogo aperta: {title}'` | `announcements/ui.ts` |
| `dialog_close` | `'Finestra di dialogo chiusa'` | `announcements/ui.ts` |
| `progress_announce` | `'{label}: {percentage}%. {current} di {total}'` | `announcements/ui.ts` |
| `list_navigation` | `'Elemento {position} di {total}: {itemDescription}'` | `announcements/ui.ts` |
| `filter_active` | `'attivato'` | `announcements/ui.ts` |
| `filter_inactive` | `'disattivato'` | `announcements/ui.ts` |
| `filter_announce` | `'Filtro {filterName} {stato}'` | `announcements/ui.ts` |
| `sort_ascending` | `'crescente'` | `announcements/ui.ts` |
| `sort_descending` | `'decrescente'` | `announcements/ui.ts` |
| `sort_announce` | `'Ordinamento per {columnName}, ordine {direction}'` | `announcements/ui.ts` |
| `volume_muted` | `'Audio disattivato'` | `announcements/ui.ts` |
| `volume_level` | `'Volume impostato a {level}%'` | `announcements/ui.ts` |
| `preset_applied` | `'Preset audio {presetName} applicato'` | `announcements/ui.ts` |
| `template_selected` | `'Template {templateName} selezionato. Campi compilati automaticamente'` | `announcements/ui.ts` |
| `form_error` | `'Errore nel campo {fieldName}: {error}'` | `announcements/ui.ts` |
| `form_field_filled` | `'Campo {fieldName} impostato a {value}'` | `announcements/ui.ts` |
| `toggle_enabled` | `'attivato'` | `announcements/ui.ts` |
| `toggle_disabled` | `'disattivato'` | `announcements/ui.ts` |
| `toggle_state` | `'{elementName} {stato}'` | `announcements/ui.ts` |
| `card_action` | `'{action} {itemName}'` | `announcements/ui.ts` |
| `period_changed` | `'Periodo cambiato a {periodName}'` | `announcements/ui.ts` |
| `help_opened` | `'Aiuto scorciatoie da tastiera aperto. Usa Tab per navigare, Escape per chiudere'` | `announcements/ui.ts` |
| `help_closed` | `'Aiuto scorciatoie da tastiera chiuso'` | `announcements/ui.ts` |
| `data_cleared` | `'{dataType} cancellati completamente'` | `announcements/ui.ts` |
| `azione_salvataggio` | `'Salvato'` | `announcements/ui.ts` |
| `azione_creazione` | `'Creato'` | `announcements/ui.ts` |
| `azione_eliminazione` | `'Eliminato'` | `announcements/ui.ts` |
| `azione_esportazione` | `'Esportato'` | `announcements/ui.ts` |
| `azione_sblocco` | `'Sbloccato'` | `announcements/ui.ts` |

### Stringhe per `announcements/accounts.ts`

| Chiave | Testo | Consumer |
|--------|-------|---------|
| `balance_announce` | `'{accountName}, saldo {formattedBalance}'` | `announcements/accounts.ts` |
| `transaction_base` | `'Movimento {type}: {formattedAmount} su {account}'` | `announcements/accounts.ts` |
| `transaction_category_suffix` | `', categoria {category}'` | `announcements/accounts.ts` |
| `export_single` | `'elemento esportato'` | `announcements/accounts.ts` |
| `export_plural` | `'elementi esportati'` | `announcements/accounts.ts` |
| `export_announce` | `'{itemCount} {exportLabel} in formato {format}'` | `announcements/accounts.ts` |
| `import_complete` | `'Importazione completata. {itemCount} {dataType} importati'` | `announcements/accounts.ts` |
| `conto_creato_sr` | `'Nuovo conto {nome} di tipo {tipo} creato con saldo iniziale di {saldo}.'` | `announcements/accounts.ts` |
| `conto_modificato_sr` | `'Conto {nome} modificato con successo.'` | `announcements/accounts.ts` |
| `conto_eliminato_sr` | `'Conto {nome} eliminato. Tutti i movimenti associati sono stati rimossi.'` | `announcements/accounts.ts` |
| `conto_eliminato_breve_sr` | `'Conto eliminato.'` | `announcements/accounts.ts` |
| `movimento_creato_sr` | `'Movimento {tipo} di {importo} aggiunto al conto {conto}.'` | `announcements/accounts.ts` |
| `movimento_modificato_sr` | `'Movimento modificato con successo.'` | `announcements/accounts.ts` |
| `movimento_eliminato_sr` | `'Movimento eliminato.'` | `announcements/accounts.ts` |
| `export_completato_sr` | `'Dati esportati. {count} movimenti salvati in formato CSV.'` | `announcements/accounts.ts` |

### Stringhe per `announcements/budgets.ts`

| Chiave | Testo | Consumer |
|--------|-------|---------|
| `budget_status` | `'Budget {name}: {percentage}%, {status}'` | `announcements/budgets.ts` |
| `budget_status_exceeded` | `'superato di {remaining}'` | `announcements/budgets.ts` |
| `budget_status_critical` | `'attenzione, rimangono solo {remaining}'` | `announcements/budgets.ts` |
| `budget_status_warning` | `'rimangono {remaining}'` | `announcements/budgets.ts` |
| `budget_status_normal` | `'in corso, spesi {spent} su {target}'` | `announcements/budgets.ts` |
| `savings_goal_created_deadline_suffix` | `', scadenza {deadline}'` | `announcements/budgets.ts` |
| `savings_goal_progress` | `'Obiettivo {nome}: {stato}'` | `announcements/budgets.ts` |
| `savings_goal_progress_done` | `'obiettivo raggiunto!'` | `announcements/budgets.ts` |
| `savings_goal_progress_near` | `'quasi raggiunto, mancano {remaining}'` | `announcements/budgets.ts` |
| `savings_goal_progress_normal` | `'progresso {percentage}%, risparmiati {current} su {target}'` | `announcements/budgets.ts` |
| `budget_item_creato_sr` | `'Nuovo budget {nome} creato. Importo target: {target} per periodo {periodo}.'` | `announcements/budgets.ts` |
| `budget_item_modificato_sr` | `'Budget {nome} modificato.'` | `announcements/budgets.ts` |
| `budget_item_eliminato_sr` | `'Budget {nome} eliminato.'` | `announcements/budgets.ts` |
| `budget_item_eliminato_breve_sr` | `'Budget eliminato.'` | `announcements/budgets.ts` |
| `obiettivo_creato_sr` | `'Nuovo obiettivo di risparmio {nome} creato. Target: {target}.'` | `announcements/budgets.ts` |
| `obiettivo_modificato_sr` | `'Obiettivo {nome} modificato.'` | `announcements/budgets.ts` |
| `obiettivo_eliminato_sr` | `'Obiettivo {nome} eliminato.'` | `announcements/budgets.ts` |
| `obiettivo_eliminato_breve_sr` | `'Obiettivo eliminato.'` | `announcements/budgets.ts` |

### Stringhe per `announcements/auth.ts`

| Chiave | Testo | Consumer |
|--------|-------|---------|
| `auth_pin_not_configured_sr` | `'PIN privato non configurato.'` | `announcements/auth.ts` |
| `auth_pin_invalid_sr` | `'PIN privato non corretto. Riprova.'` | `announcements/auth.ts` |
| `auth_private_unlocked_sr` | `'Conto privato sbloccato.'` | `announcements/auth.ts` |
| `auth_pin_set_sr` | `'PIN privato configurato.'` | `announcements/auth.ts` |
| `auth_pin_changed_sr` | `'PIN privato modificato.'` | `announcements/auth.ts` |
| `auth_pin_removed_sr` | `'PIN privato rimosso.'` | `announcements/auth.ts` |
| `auth_session_kept_sr` | `'Sessione mantenuta attiva.'` | `announcements/auth.ts` |
| `private_locked` | `'Conto privato bloccato. I dati privati non sono più visibili'` | `announcements/auth.ts` |

---

## Sezione 6 — Contenuto da eliminare

### 1. Logica DOM in `ScreenReaderAnnouncer` (da §3.1)

Tutto il meccanismo di live region DOM:
- `document.createElement('div')` e creazione di elementi HTML
- `document.body.appendChild(...)` e `document.body` in generale
- Il tipo `HTMLDivElement` e qualsiasi riferimento ai tipi DOM
- `document.addEventListener('DOMContentLoaded', ...)` per inizializzazione ritardata
- `document.createTextNode(...)` e `region.replaceChildren(...)`
- Attributi `aria-live`, `aria-atomic`, `role` impostati come stringhe su nodi DOM tramite `element.setAttribute`
- Guard `typeof document !== 'undefined'` — il motivo per cui in React Native tutti gli annunci erano silenti
- Variabili `politeRegion` e `assertiveRegion` di tipo `HTMLDivElement | null` e la loro logica di inizializzazione

**Motivazione**: nessuno di questi meccanismi esiste in React Native. Non hanno equivalente nel nuovo sistema — `AccessibilityInfo.announceForAccessibility` sostituisce l'intero meccanismo.

### 2. Detection browser in `useTalkBack` (da §4.1)

Tutto il sistema di detection euristico:
- `window.matchMedia('(prefers-reduced-motion: reduce)')` e qualsiasi accesso a `window.matchMedia`
- `navigator.userAgent.toLowerCase()` e analisi della stringa userAgent
- `'ontouchstart' in window` come indicatore touch
- `navigator.maxTouchPoints` e logica di conteggio touch point
- `window.speechSynthesis.getVoices()` e analisi dell'elenco voci TTS
- `sessionStorage.getItem(...)` e `sessionStorage.setItem(...)` — `sessionStorage` non esiste in React Native
- `document.body.setAttribute('data-talkback', ...)` — attributo DOM diagnostico
- `document.body.classList.add('talkback-enhanced-targets')` e tutte le classi CSS aggiunte a `document.body`
- `window.addEventListener('focus', ...)` e `window.addEventListener('keydown', ...)`
- La funzione `detectTalkBack()` nella sua interezza — è il cuore della detection browser, non va copiata né commentata nel file riscritto
- Il `recheckInterval` (setInterval 30 secondi per ri-eseguire la detection periodicamente) — non ha senso con il listener nativo che reagisce in tempo reale

**Motivazione**: tutte queste euristiche restituivano sempre `{ detected: false, confidence: 'low' }` perché in React Native nessun indicatore browser è mai `true`. Il sistema nativo (`AccessibilityInfo`) fornisce una risposta binaria certa e reattiva.

### 3. File `src/hooks/use-screen-reader.ts` nella sua forma attuale (da §5)

- Il pattern di 35+ `useCallback` wrapping individuali, ciascuno che delega un singolo metodo a `screenReader`
- L'hook aggregatore `useScreenReader()` che restituisce tutti i metodi di annuncio in un unico oggetto
- Il `useMemo` con array di dipendenze massiccio (proposto in §5.2 come refactoring)
- La funzione `useAnnouncePage` (potenzialmente riusabile in altra forma, ma il file contenitore non ha equivalente)

**Motivazione**: nella nuova architettura ADR_001 i componenti React non usano un hook aggregatore di tutti i metodi. Il consumatore chiama `announce(accounts.accountDeleted(data))` importando direttamente da `@/announcements`. Non esiste un corrispondente di questo file nella struttura `src/accessibility/` + `src/announcements/`. La sua forma attuale va eliminata; la decisione su un eventuale thin hook di utilità è aperta (vedi Punti aperti).

### 4. Detection DOM residua in `AuthContext.tsx` (da §6.1)

- La costante `isScreenReaderActive` basata su `document.querySelector('[aria-live]')` e `document.documentElement.getAttribute('data-sr-active')` — se non già rimossa dal Gruppo 2
- La guard `if (!isScreenReaderActive)` attorno ai toast/console.warn — pensata per evitare duplicati con `sonner` che non esiste più
- Tutti i `console.warn('placeholder: sonner [error/success] ...')` introdotti come placeholder temporanei nel Gruppo 1

**Motivazione**: il rilevamento DOM è inaffidabile in React Native (ritorna sempre `false`). I console.warn sono placeholder temporanei che vanno sostituiti con le chiamate reali; la guard non ha più ragione di esistere.

### 5. Console.warn e import residui in `AppDataContext.tsx` (da §6.4)

- Tutti i `console.warn('placeholder: sonner ...')` in ogni handler che gestisce operazioni CRUD
- `import { toast } from 'sonner'` o qualsiasi import residuo da `'sonner'`
- Stringhe hardcoded nelle chiamate `screenReader.*` (es. `` `Conto ${account.nome} modificato con successo.` ``) — sostituite con le chiavi `strings.*` o con le funzioni specializzate

**Motivazione**: i console.warn sono placeholder temporanei (introdotti in B3 del Gruppo 1) privi di valore applicativo. Le stringhe hardcoded violano il sistema locales introdotto in questo stesso passo.

---

## Sezione 7 — Punti aperti

### P1 — Destino di `src/hooks/use-screen-reader.ts` nella nuova architettura

Il DESIGN 003 (§5) descrive un refactoring di questo file da 35+ `useCallback` a un `useMemo` unico. L'ADR_001 non menziona il file — nella nuova architettura il consumatore usa `announce()` da `@/announcements` direttamente, rendendo un hook aggregatore di tutti i metodi obsoleto.

**Dubbio**: i componenti React che attualmente dipendono da `useScreenReader()` hanno bisogno di un hook di transizione? Le opzioni sono tre:
- (a) Eliminazione completa: i consumatori migrano a `announce()` + moduli `announcements/` direttamente
- (b) Thin wrapper di compatibilità temporaneo: il file sopravvive come `useAnnounce()` che espone solo `announce()` importata da `@/announcements/index.ts`
- (c) Ridefinizione come hook per `accessibility/detection.ts`: il file diventa un hook che espone `useTalkBack` / `useDetection` per i componenti che devono interrogare lo stato della piattaforma

La scelta impatta il piano di migrazione dei consumatori esistenti. Non decido qui — il punto va portato all'attenzione di Agent-Plan.

---

### P2 — Tipo `Announcement` assente dal DESIGN 003

L'ADR_001 definisce il tipo `Announcement { text: string, priority: AnnouncementPriority }` come struttura fondamentale del contratto tra `announcements/` e `engine.ts`. Il DESIGN 003 non lo descrive — usa direttamente parametri separati `(message: string, priority: AnnouncementPriority)` nella classe.

**Dubbio**: il contenuto di `announcements/types.ts` (l'interfaccia `Announcement` come struttura) non è presente nel DESIGN 003 e dovrà essere definito ex novo nel nuovo documento di design. Non va assunta nessuna struttura specifica — la definizione richiede una decisione esplicita nella riscrittura del 003.

---

### P3 — Posizionamento della funzione helper `t()` nei moduli `announcements/`

Il DESIGN 003 (§2.5, §3.2) descrive `t()` come helper privato di `screen-reader.ts`. Nella nuova architettura la composizione dei testi è responsabilità dei moduli `announcements/`. Non è specificato nell'ADR_001 dove risiede `t()`.

**Dubbio**: le opzioni sono:
- (a) Copiata come helper privato in ogni modulo `announcements/` che ne ha bisogno
- (b) Resa un helper condiviso interno a `announcements/` (es. in un file `announcements/_utils.ts` non esportato)
- (c) Inclusa in `announcements/index.ts` come helper privato

La scelta impatta la struttura interna del layer. Non decido qui.

---

### P4 — Migrazione dei consumatori dal pattern `screenReader.*` al pattern `announce(modulo.metodo(...))`

Il DESIGN 003 descrive le patch di `AuthContext.tsx` e `AppDataContext.tsx` ancora nel vecchio pattern (`screenReader.announceError(strings.chiave)`). La nuova architettura ADR_001 prevede `announce(auth.pinNotConfigured())`.

**Dubbio**: la mappa delle sostituzioni del DESIGN 003 (§6.2 e §6.4) deve essere rimappata sul nuovo pattern. Non è chiaro se questa rimappatura debba essere esplicitata nel nuovo documento di design o risuolata implicitamente dai moduli `announcements/` che espongono le stesse funzioni con nomi equivalenti.

---

### P5 — Priorità ambigua di `auth_session_kept_sr`

Il DESIGN 003 §6.2 usa `announceSuccess(strings.auth_session_kept_sr)` (che nel vecchio schema corrisponde a priorità `polite`) con una nota che suggerisce di rivalutare in fase di test se cambiare a `announceAction('salvataggio')` (che nel vecchio schema è `assertive`).

**Dubbio**: nella nuova architettura la funzione `auth.sessionKept()` dovrà specificare una priorità definitiva. La nota non risolve il dubbio. Va portata all'attenzione di chi scriverà il modulo `announcements/auth.ts`.

---

### P6 — Duplicazione potenziale di `announceExport` tra `ui.ts` e `accounts.ts`

Il DESIGN 003 §3.2 descrive `announceExport(itemCount, format)` come metodo generico (conta elementi + formato). Il §6.4 descrive `export_completato_sr` ('Dati esportati. {count} movimenti salvati in formato CSV.') come chiave specifica per `handleExportCSV` in `AppDataContext`.

**Dubbio**: nella nuova architettura ci sono due metodi distinti (`announcements/ui.ts` per l'export generico e `announcements/accounts.ts` per l'export CSV specifico dell'app) oppure un metodo solo? Non decido qui — il sovrapposto va chiarito nel nuovo documento di design.

---

### P7 — Chiave `help_opened` con istruzioni screen-reader-specifiche

La chiave `help_opened: 'Aiuto scorciatoie da tastiera aperto. Usa Tab per navigare, Escape per chiudere'` contiene istruzioni esplicite per la navigazione da tastiera. Il §2.1 del DESIGN 003 avverte di non inserire in `it.ts` istruzioni specifiche per lo screen reader, a meno che non siano documentate come eccezioni.

**Dubbio**: questa chiave è presente in `it.ts` senza essere esplicitamente documentata come eccezione al principio. La classificazione è LOCALES, ma il tono della stringa potrebbe essere rivisto nella fase di revisione editoriale (passo 4, punto 6 del §10). Segnalo il dubbio senza riclassificare.

---

### P8 — Sezione 1 (grafo delle dipendenze) da ridisegnare integralmente

Il grafo A→B→C→D→E è costruito sul vecchio schema di file. Nella nuova architettura la sequenza sarà completamente diversa (prima `accessibility/types.ts`, poi `engine.ts`, poi `detection.ts`, poi `locales/`, poi i moduli `announcements/`). L'Intervento D (`use-screen-reader.ts`) non ha equivalente. Il documento che riscrive il 003 dovrà produrre un nuovo grafo di dipendenze coerente con i nuovi file.

---

### P9 — Gate di validazione per i nuovi file (§7) da ridefinire

I Gate B, C, D del DESIGN 003 sono specifici per `screen-reader.ts`, `use-talkback.ts` e `use-screen-reader.ts`. I nuovi file (`accessibility/engine.ts`, `accessibility/detection.ts`, moduli `announcements/`) richiederanno gate di validazione nuovi. Il Gate D è da eliminare integralmente; i Gate B e C vanno riscritti per i nuovi path. Questo non è un dubbio ma una conseguenza certa della riarchitettura — la segnalo qui perché il nuovo documento di design dovrà produrre gate coerenti con la nuova struttura.
