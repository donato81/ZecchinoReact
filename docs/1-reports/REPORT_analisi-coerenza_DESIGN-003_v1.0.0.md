---
tipo: report-analisi
titolo: Analisi di Coerenza e Validazione — DESIGN 003 + PLAN 003
versione: 1.0.0
data: 2026-05-21
stato: DRAFT
autore: Copilot Agent (Analyzer)
revisore: donny-81
file-analizzati:
  - docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md
  - docs/3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md
---

# REPORT ANALISI COERENZA — DESIGN 003 + PLAN 003

---

## EXECUTIVE SUMMARY

DESIGN 003 e PLAN 003 sono complessivamente ben strutturati, coerenti con
l'ADR_001 e con i design precedenti, e pronti per l'implementazione a
condizione di chiarire quattro incoerenze documentali. La più significativa
è la contraddizione interna tra §9 del DESIGN (che classifica la patch di
`AuthContext.tsx` come "documento successivo", fuori perimetro) e il Task
T6 del PLAN (che include quella stessa patch). Un implementatore che segua
il DESIGN saltrebbe T6; uno che segua il PLAN la eseguirebbe — e T7
(DELETE `use-talkback.ts`) dipende da T6 per non rompere la build. La
seconda incoerenza è l'assenza di autore e revisore nel frontmatter, comune
ai design precedenti. La terza è l'aggiunta silenziosa di una seconda
eccezione all'ADR_001 (import type da `accessibility/types` in
`announcements/types.ts`) non formalizzata nell'ADR stesso. La quarta è
un rischio tecnico — guard DOM assente in `screen-reader.ts` durante la
transizione — presente nei report precedenti ma non esplicitamente
quantificato in questo documento. Nessuna delle incoerenze è bloccante
per la correttezza tecnica della soluzione proposta.

---

## VERDETTO COMPLESSIVO

| Documento | Stato | Criticità aperte | Readiness |
|-----------|-------|-----------------|-----------|
| DESIGN 003 | REVIEWED | 4 (vedi dettaglio) | **PRONTO CON RISERVE** |
| PLAN 003 | READY | 2 (vedi dettaglio) | **PRONTO CON RISERVE** |
| Coerenza DESIGN/PLAN | — | 1 CRITICA (T6 vs §9) | **DA CHIARIRE** |

**Criticità DESIGN 003:**
1. AuthContext.tsx dichiarato "fuori perimetro — documento successivo" in §9,
   ma incluso come consumatore da aggiornare in §7.1 e coperto dal T6 del
   PLAN. Ambiguità che divide il perimetro reale tra DESIGN e PLAN.
2. Autore e revisore non dichiarati nel frontmatter.
3. Seconda eccezione alla regola 1 dell'ADR_001 introdotta in §3.1 senza
   aggiornamento formale dell'ADR.
4. Rischio guard DOM assente in `screen-reader.ts` durante la transizione
   non quantificato nel DESIGN 003 (presente nei documenti precedenti ma
   non ripreso qui).

**Criticità PLAN 003:**
1. Task T6 (patch AuthContext.tsx) presente nel PLAN ma classificato "fuori
   perimetro — documento successivo" nel DESIGN §9 e §11. Se il DESIGN è la
   fonte di verità, T6 va rimosso dal PLAN; se il PLAN è corretto, §9 e §11
   del DESIGN vanno aggiornati.
2. La dipendenza di T6 da T3 (detection.ts deve esistere prima di patchare
   l'import in AuthContext.tsx) non è dichiarata esplicitamente nel task T6
   — è inferita dalla sequenza di commit.

---

## ANALISI DESIGN 003

### 1.1 — Scheda di stato documento

| Campo | Valore |
|-------|--------|
| ID e titolo | DESIGN 003 — Fix accessibility engine — layer src/accessibility/ e locales minimale |
| Versione | 1.0.0 |
| Data | 2026-05-18 |
| Stato frontmatter | REVIEWED |
| Autore dichiarato | **Non dichiarato** — incoerenza comune ai DESIGN 001 e 002 (già segnalata nel REPORT precedente) |
| Revisore dichiarato | **Non dichiarato** |
| Campo `sorgente` | `docs/0-architecture/ADR_001_sistema-annunci-accessibili.md` — corretto, il file esiste nel repository |
| Campo `precondizione` | `002-DESIGN_fix-provider-bootstrap_v0.2.0.md completamente implementato` — corretto |
| Campo `nota-ordine` | Presente: avvisa che l'ordine nel perimetro non è l'ordine operativo. Coerente con §2 del corpo. |
| Coerenza frontmatter/corpo | **Parziale** — vedi §1.2 per il dettaglio sulla discrepanza su AuthContext.tsx |

**Evidenza diretta**: frontmatter del DESIGN 003, campo `titolo`, `versione`,
`data`, `stato`, `sorgente`, `precondizione`, `nota-ordine`.

### 1.2 — Perimetro e scope

**File dichiarati nel perimetro (frontmatter):**

| File | Operazione |
|------|-----------|
| `src/accessibility/types.ts` | CREATE |
| `src/accessibility/engine.ts` | CREATE |
| `src/accessibility/detection.ts` | CREATE |
| `src/locales/it.ts` | CREATE (stringhe motore only) |
| `src/locales/index.ts` | CREATE |
| `src/lib/screen-reader.ts` | DELETE DIFFERITO — vedi §7.3 |
| `src/hooks/use-screen-reader.ts` | DELETE DIFFERITO — vedi §7.2 e DESIGN 004 |
| `src/hooks/use-talkback.ts` | DELETE — vedi §7 |

**Copertura corpo/perimetro**: il corpo tratta tutti e 8 i file dichiarati
nel frontmatter. Le sezioni §3, §4, §5, §6, §7.1, §7.2, §7.3 corrispondono
esattamente ai file elencati. ✓

**Elemento trattato ma non dichiarato nel perimetro:**

`src/context/AuthContext.tsx` appare in §7.1 nella tabella "Consumatori che
devono aggiornare l'import prima della deletion" con la riga da sostituire
(`import { useTalkBack } from '@/hooks/use-talkback'` → aggiornato). Questo
implica una modifica al file. Tuttavia:

- **§9 (Cosa NON viene affrontato in questo documento)** dichiara
  esplicitamente: "Patch `AuthContext.tsx` (import detection) — Fuori
  perimetro engine — Documento successivo".
- **§11** conferma: "L'integrazione di `detection.ts` nei React Provider
  dell'app (in particolare `AuthContext.tsx`) avviene nel documento
  successivo destinato a `src/announcements/`."

**Contraddizione interna**: §7.1 implica che la patch di AuthContext.tsx
avvenga in questo documento; §9 e §11 la rinviano al documento successivo.
Il PLAN 003 risolve l'ambiguità includendo T6 (patch AuthContext.tsx), ma
crea una divergenza con il DESIGN come fonte di verità.

**Evidenza**: DESIGN 003 §7.1 (tabella consumatori), §9 (prima riga della
tabella), §11 (ultimo paragrafo).

### 1.3 — Precondizioni formali

| Precondizione | File esiste? | Stato |
|---------------|-------------|-------|
| `002-DESIGN_fix-provider-bootstrap_v0.2.0.md` completamente implementato | **SÌ** | **APERTA** — DESIGN 002 ha come precondizione DESIGN 001 non ancora implementato. La catena è: DESIGN 001 non implementato → DESIGN 002 bloccato → DESIGN 003 bloccato. |
| `talkBackManualOverride`, `talkBackAdaptations`, `setTalkBackAdaptations`, `setTalkBackManualOverride` esposti da `useUserSettings()` | [DA VERIFICARE — `src/` esclusa dall'analisi per policy] | **INCERTA** — il PLAN T3 include una verifica preventiva con grep. Se il grep non trova le proprietà, T3 è bloccato. |
| ADR_001 (fonte architetturale) | **SÌ** — `docs/0-architecture/ADR_001_sistema-annunci-accessibili.md`, versione 1.2.0, stato APPROVATO | **SODDISFATTA** |

**Dipendenza transitiva non dichiarata**: DESIGN 003 dichiara come precondizione
il completamento di DESIGN 002, ma DESIGN 002 dipende a sua volta da DESIGN 001.
La dipendenza transitiva DESIGN 003 → DESIGN 001 non è dichiarata esplicitamente.
Non è un errore tecnico (è implicita nella catena), ma potrebbe disorientare
un implementatore che legge solo il frontmatter di DESIGN 003.

### 1.4 — Invarianti architetturali

**Invarianti dichiarate nel DESIGN 003:**

| # | Invariante | Sezione |
|---|-----------|---------|
| I1 | `engine.ts` è stateless: nessuna queue, debounce, retry, contatore | §4.3 |
| I2 | `detection.ts` non importa `engine.ts` — invariante ADR_001 | §2, grafo |
| I3 | `locales/` non importa da `accessibility/` | §2 |
| I4 | Nessun modulo in `accessibility/` importa da `src/lib/`, `src/hooks/`, o `src/context/` tranne `detection.ts` che usa `useUserSettings` | §2 |
| I5 | `engine.ts` e `detection.ts` non si importano a vicenda | §2 |
| I6 | Import da `accessibility/types.ts` fuori da `src/accessibility/` solo come `import type` | §3.1 |
| I7 | `confidenceLevel` non ha più il valore `'medium'` | §3.3 |
| I8 | `screen-reader.ts` non viene modificato né eliminato in questo documento | §7.3 |
| I9 | `use-screen-reader.ts` non viene eliminato in questo documento | §7.2, §9 |
| I10 | Le funzioni di `detection.ts` restano pure e derivate da `TalkBackState` e `adaptations` | §5.6 |
| I11 | `TalkBackAdaptations` in `accessibility/types.ts` è duplicato temporaneo — consolidazione nel documento successivo | §11 |

**Coerenza con DESIGN 001**: nessun conflitto. Le invarianti di DESIGN 001
(`accessibilityRole: "alert"`, shim toast temporaneo, ordine plugin Babel)
riguardano file (`AuthContext.tsx`, `babel.config.js`, `button.tsx`) che
DESIGN 003 non tocca. ✓

**Coerenza con DESIGN 002**: nessun conflitto. L'invariante N8/N6 commit
separati e l'interfaccia pubblica invariata di `useInactivityTimer` non sono
toccati da DESIGN 003. Il file `AuthContext.tsx` viene toccato da DESIGN 003
(T6) solo per la sostituzione di un import (`useTalkBack` →
`useAccessibilityDetection`), che non interferisce con le modifiche di
DESIGN 002 (stato `isScreenReaderActive`, `useEffect` detection
`AccessibilityInfo`). ✓

**Contraddizioni interne**: nessuna contraddizione logica tra le sezioni
del documento. L'unica ambiguità è quella già documentata in §1.2
(AuthContext.tsx: trattato in §7.1, escluso in §9 e §11).

### 1.5 — Coerenza con ADR_001

**Regole ADR_001 verificate:**

| Regola ADR_001 | Stato in DESIGN 003 |
|----------------|---------------------|
| 1. `announcements/` non importa mai da `accessibility/` — eccezione: `announcements/index.ts` può importare `engine` | **PARZIALMENTE COERENTE** — vedi nota sotto |
| 2. Il dominio non chiama `engine.ts` direttamente | ✓ — confermato da §4.3 e §11: nessun file chiama `engine.announce()` in questo documento |
| 3. Il dominio non chiama `engine.announce()` direttamente | ✓ — §11 nota che `detection.ts` è codice orfano; nessun consumer di engine in questo documento |
| 4. Nessun file importa da file interni di `announcements/` | ✓ — il layer `announcements/` non esiste ancora |

**Nota sulla Regola 1 — seconda eccezione introdotta silenziosamente:**

Il DESIGN 003 §3.1 introduce una seconda eccezione alla Regola 1 dell'ADR:

> "Unica eccezione ammessa: `src/announcements/types.ts` potrà importare
> `Announcement` e `AnnouncementPriority` direttamente da
> `@/accessibility/types` — esclusivamente come `import type`."

L'ADR_001 (versione 1.2.0, §Regole di dipendenza — invarianti del progetto,
Regola 1) dice: "la sola eccezione è `announcements/index.ts` che importa
`engine`." Il DESIGN 003 aggiunge un secondo file autorizzato ad importare
da `accessibility/` (`announcements/types.ts` → `accessibility/types`), ma
non aggiorna l'ADR. La giustificazione tecnica è solida (i moduli
`announcements/` devono conoscere il contratto `Announcement` senza passare
da `engine.ts`), ma l'ADR rimane non aggiornato.

**Azione raccomandata**: aggiornare ADR_001 §Regole di dipendenza per
codificare formalmente questa seconda eccezione autorizzata.

### 1.6 — Dipendenze da altri design

| Riferimento | File esiste? | Dichiarato? | Stato |
|-------------|-------------|------------|-------|
| `002-DESIGN_fix-provider-bootstrap_v0.2.0.md` | **SÌ** | **SÌ** (frontmatter `precondizione`) | REVIEWED — non implementato |
| `001-DESIGN_fix-blocchi-avvio_v0.1.0.md` (dipendenza transitiva) | **SÌ** | **NO** (non dichiarata esplicitamente) | REVIEWED — non implementato |
| `ADR_001_sistema-annunci-accessibili.md` | **SÌ** | **SÌ** (frontmatter `sorgente`) | APPROVATO |
| Documento successivo (announcements/) | **SÌ** (`004-DESIGN_announcements-layer_v1_0_0.md`) | **SÌ** (citato come "documento successivo" in §7.2, §7.3, §9, §11) | Stato non verificato (cartella src/ esclusa; il file esiste in docs/2-projects/) |

**Note sulle dipendenze verso DESIGN 004:**
- La deletion di `screen-reader.ts` è un gate del DESIGN 004 (§7.3): dipendenza dichiarata ✓
- La deletion di `use-screen-reader.ts` è differita a DESIGN 004 (§7.2): dipendenza dichiarata ✓
- La migration `TalkBackAdaptations` è differita al documento successivo (§11): dipendenza dichiarata ✓
- L'integrazione di `detection.ts` in `AuthContext.tsx` è affidata al documento successivo (§11): dichiarata nel DESIGN, ma contraddetta dal PLAN T6

### 1.7 — Struttura del documento e completezza

Il DESIGN 003 è il più completo e rigoroso tra i design analizzati nel
progetto. Le sezioni sono numerate in modo coerente (§1–§11), ogni file
ha una sezione dedicata con Ruolo, Codice e Scope esplicito, il grafo
delle dipendenze è presente e corretto, i rischi sono classificati con
probabilità e impatto, le note per Agent-Plan sono dettagliate.

**Punti di forza rispetto ai DESIGN precedenti:**
- Campo `sorgente` punta all'ADR come fonte architettuale (non solo al
  report di diagnosi)
- Sezione §9 esplicitamente esclude l'out-of-scope
- Sezione §11 fornisce istruzioni operative per Agent-Plan
- I rischi R1–R6 hanno probabilità e impatto dichiarati
- Il grafo delle dipendenze (§2) è espresso in forma strutturata

---

## ANALISI PLAN 003

### 2.1 — Copertura del perimetro

**Mappatura DESIGN 003 perimetro → PLAN 003 task:**

| File (DESIGN 003 perimetro) | Task PLAN 003 | Copertura |
|---|---|---|
| `src/accessibility/types.ts` (CREATE) | 003.T1 | ✓ |
| `src/accessibility/engine.ts` (CREATE) | 003.T2 | ✓ |
| `src/accessibility/detection.ts` (CREATE) | 003.T3 | ✓ |
| `src/locales/it.ts` (CREATE) | 003.T4 | ✓ |
| `src/locales/index.ts` (CREATE) | 003.T5 | ✓ |
| `src/lib/screen-reader.ts` (DELETE DIFFERITO) | nessun task — coerente con §7.3 | ✓ |
| `src/hooks/use-screen-reader.ts` (DELETE DIFFERITO) | 003.T8 (grep di verifica, non delete) | ✓ |
| `src/hooks/use-talkback.ts` (DELETE) | 003.T7 | ✓ |

**File nel PLAN non presenti nel perimetro frontmatter del DESIGN:**

| File | Task | Giustificazione nel PLAN | Stato nel DESIGN |
|------|------|--------------------------|-----------------|
| `src/context/AuthContext.tsx` | 003.T6 (PATCH — solo import) | "Aggiornare i consumatori di useTalkBack" | §9: "Fuori perimetro engine — Documento successivo" |

**Incoerenza CRITICA**: il task T6 del PLAN patcha `AuthContext.tsx`, che
il DESIGN classifica come "fuori perimetro" in §9 e §11. Questa divergenza
crea un punto di decisione per l'implementatore:
- Seguire il DESIGN: saltare T6, non patchare AuthContext.tsx. Ma allora T7
  (DELETE `use-talkback.ts`) rompe la build perché AuthContext.tsx importa
  ancora `useTalkBack` dal file eliminato.
- Seguire il PLAN: eseguire T6. Build integra. Ma il DESIGN come documento
  è incompleto per perimetro.

La soluzione tecnicamente corretta è eseguire T6 (altrimenti T7 non è
possibile). Il DESIGN deve essere aggiornato per riflettere questa realtà.

### 2.2 — Ordine di implementazione

**Grafo dipendenze dichiarato nel DESIGN 003 §2:**

```
STEP 1: types.ts (prerequisito di tutto)
STEP 2: engine.ts, detection.ts (dipendono da types.ts, parallelizzabili tra loro)
STEP 3: locales/it.ts, locales/index.ts (indipendente, parallelizzabile con step 2)
STEP 4: DELETE use-talkback.ts (dopo step 2 + aggiornamento import in AuthContext)
STEP 5: DELETE screen-reader.ts (DIFFERITO)
```

**Sequenza commit PLAN 003 §5:**

```
commit 1: types.ts
commit 2: engine.ts
commit 3: detection.ts
commit 4: locales (it.ts + index.ts)
commit 5: patch import useTalkBack → useAccessibilityDetection (AuthContext.tsx)
commit 6: DELETE use-talkback.ts
commit 7: verifica consumatori use-screen-reader.ts (grep, nessuna modifica)
```

**Coerenza PLAN / grafo DESIGN:**

| Vincolo DESIGN | Rispettato nel PLAN? |
|---------------|---------------------|
| types.ts prima di engine.ts e detection.ts | ✓ (commit 1 precede commit 2 e 3) |
| engine.ts e detection.ts non si importano | ✓ (Gate 3 verifica `grep "from.*engine" detection.ts`) |
| locales indipendente da accessibility/ | ✓ (commit 4 parallelo, non imposta dipendenze) |
| DELETE use-talkback.ts dopo aggiornamento import | ✓ (commit 6 dopo commit 5) |
| detection.ts non è montato in questo documento | ✓ (§11 DESIGN + T6 solo patch import, non integrazione provider) |

**Dipendenza implicita non dichiarata in T6**: T6 presuppone che T3
(detection.ts) sia completato prima di aggiornare l'import in
AuthContext.tsx. Questa dipendenza non è dichiarata nel task T6 con un
campo esplicito `Dipende da`. È inferita dalla sequenza commit (commit 5
viene dopo commit 3), ma non è documentata nel task come avviene per
altri task (es. T5 dichiara `Dipende da: 003.T4`).

**Dipendenze circolari**: nessuna rilevata. ✓

### 2.3 — Versioni dipendenze

Il PLAN non introduce nuove dipendenze npm. Tutti i moduli usati sono
parte del core React Native 0.82 o del progetto:

| Dipendenza | Tipo | Origine |
|-----------|------|---------|
| `AccessibilityInfo` | React Native core API | RN 0.82 ✓ |
| `useState`, `useEffect`, `useCallback` | React core | React 18.x ✓ |
| `useUserSettings()` | Context interno | Già presente nel progetto |
| `__DEV__` | Globale RN | Disponibile in Hermes/Metro ✓ |

Nessuna dipendenza aggiuntiva richiede modifica a `package.json`. ✓

### 2.4 — Gate di verifica

**Valutazione gate per gate:**

| Gate | Post-task | Testabile? | Ambiguità? | Note |
|------|-----------|-----------|-----------|------|
| Gate 1 | T1 | ✓ (tsc + grep) | No | `grep "medium"` correttamente verifica I7 |
| Gate 2 | T2 | ✓ (tsc + grep) + manuale | **Sì** (verifica manuale) | La verifica manuale Narrator richiede hardware Windows. Documentata nel gate. |
| Gate 3 | T3 | ✓ (tsc + grep) + manuale | **Sì** (componente temporaneo non documentato nel DESIGN) | La verifica funzionale richiede "montare un componente che usa `useAccessibilityDetection()`" — non esiste ancora nessun componente che lo fa. Serve un test temporaneo. |
| Gate 4 | T4+T5 | ✓ (tsc + grep) | No | `grep "from.*locales/it"` verifica la regola di import invariante ✓ |
| Gate 5 | T7 | ✓ (file assente + grep) | No | ✓ |
| Gate 6 | T8 | ✓ (grep) | No | Esito atteso documentato: risultati in AuthContext.tsx e AppDataContext.tsx. ✓ |
| Gate finale | — | ✓ (tsc + lint) | No | ✓ |

**Riferimenti stale**: nessun riferimento a sezioni del DESIGN rimosse
o inesistenti rilevato nel PLAN. Il PLAN cita correttamente §3.1, §4.3,
§5.5, §7.1, §7.2, §7.3, §10 e §11 del DESIGN — tutte sezioni presenti
nel documento. ✓

**Gate 3 — nota critica sul componente temporaneo:**
Il gate richiede una verifica funzionale manuale con screen reader attivo
montando `useAccessibilityDetection()`. Il DESIGN §11 dice esplicitamente
che questo hook è "codice orfano" in questo documento. Il PLAN Gate 3
menziona la verifica ma non fornisce il codice del componente temporaneo
da usare. È raccomandabile aggiungere uno snippet di test nel gate (simile
al snippet `engine.announce()` nel Gate 2) per evitare che questa verifica
venga saltata.

### 2.5 — Coerenza con DESIGN 003

**Invarianti architetturali rispettate in ogni step del PLAN:**

| Invariante DESIGN | Rispettata nel PLAN? | Evidenza |
|-------------------|--------------------|----------|
| I1 (engine.ts stateless) | ✓ | Codice T2: nessuna variabile di stato, nessuna queue |
| I2 (detection.ts non importa engine.ts) | ✓ | Gate 3: `grep "from.*engine" detection.ts` |
| I3 (locales non importa accessibility) | ✓ | Codice T4 e T5: nessun import da `accessibility/` |
| I4 (accessibility non importa da lib/hooks/context tranne detection → UserSettings) | ✓ | Codice T2: nessun import esterno; codice T3: solo `useUserSettings` |
| I5 (engine e detection non si importano) | ✓ | Gate 3 + struttura dei file |
| I6 (import accessibility/types solo come import type) | ✓ | Codice T2: `import type { Announcement } from './types'` |
| I7 (nessun 'medium' in confidenceLevel) | ✓ | Gate 1: `grep "medium" types.ts` |
| I8 (screen-reader.ts invariato) | ✓ | Nessun task tocca screen-reader.ts |
| I9 (use-screen-reader.ts non eliminato) | ✓ | T8: solo verifica grep |
| I10 (funzioni detection.ts pure) | ✓ | Codice T3: funzioni derivano solo da talkBackState e adaptations |
| I11 (TalkBackAdaptations duplicato temporaneo) | ✓ | Codice T1: tipo definito con commento esplicito |

**Elementi del DESIGN non coperti dal PLAN**: nessuno. ✓

**Passi del PLAN non supportati dal DESIGN**: Task T6 — la patch di
AuthContext.tsx — non è supportata dal DESIGN che la classifica come
"fuori perimetro" (già documentato in §2.1 e §1.2). È l'unica divergenza.

---

## ANALISI TRASVERSALE

### 3.1 — Coerenza con DESIGN 001 e DESIGN 002

**File condivisi tra DESIGN 003 e DESIGN 001/002:**

| File | DESIGN 001 | DESIGN 002 | DESIGN 003 |
|------|-----------|-----------|-----------|
| `AuthContext.tsx` | MODIFY (B3, B4) | MODIFY (N8, N6) | MODIFY via T6 (solo import) |
| `use-talkback.ts` | — | — | DELETE (T7) |
| `use-screen-reader.ts` | — | — | VERIFICA grep (T8) |
| `screen-reader.ts` | — | — | DELETE DIFFERITO (§7.3) |

**Compatibilità modifiche AuthContext.tsx:**

Le tre serie di modifiche toccano sezioni diverse del file e non sono
in conflitto:

- DESIGN 001 (B3): riga import sonner → shim locale
- DESIGN 001 (B4): riga import Button + blocco dialog JSX (righe ~320–338)
- DESIGN 002 (N8): riga `typeof document...` (righe ~61–63) → nuovo
  useState + useEffect AccessibilityInfo
- DESIGN 002 (N6): import ActivityDetectorView + wrapper nel return JSX
- DESIGN 003 (T6): riga import `useTalkBack` → `useAccessibilityDetection`

Le modifiche sono ortogonali: nessun conflitto di merge se l'ordine
DESIGN 001 → 002 → 003 è rispettato. ✓

**Ordine di implementazione verificato:**

| Dipendenza | Soddisfatta? |
|-----------|-------------|
| DESIGN 001 prima di DESIGN 002 (bundle Metro + alias @/*) | ✓ — precondizione esplicita in DESIGN 002 |
| DESIGN 002 prima di DESIGN 003 (AuthProvider montabile, useUserSettings stabile) | ✓ — precondizione esplicita in DESIGN 003 |
| DESIGN 001 prima di DESIGN 003 (dipendenza transitiva) | ✓ — tramite catena, non dichiarata esplicitamente |

Nessuna dipendenza invertita. Nessuna dipendenza circolare. ✓

### 3.2 — Contratti condivisi con DESIGN 004

DESIGN 003 introduce contratti che DESIGN 004 (announcements layer) userà:

| Contratto | Definito in | Usato da DESIGN 004 | Completezza |
|-----------|------------|--------------------|----|
| `AnnouncementPriority` | `accessibility/types.ts` | `announcements/types.ts` (via import type) | ✓ — tipo completo |
| `Announcement` | `accessibility/types.ts` | Tutti i moduli `announcements/` (via import type in `announcements/types.ts`) | ✓ — interfaccia completa con `text: string` e `priority: AnnouncementPriority` |
| `engine` singleton | `accessibility/engine.ts` | `announcements/index.ts` (unico punto di chiamata) | ✓ — API `announce(announcement: Announcement): void` documentata |
| `useAccessibilityDetection()` | `accessibility/detection.ts` | `AuthContext.tsx` (via T6 o DESIGN 004) | **Parziale** — l'interfaccia pubblica del return value non è dichiarata come TypeScript interface esplicita nel DESIGN (è ricavabile dal codice T3 nel PLAN) |
| `strings`, `StringKey` | `locales/index.ts` | Moduli `announcements/` | ✓ — struttura dichiarata, `StringKey = never` atteso in questa fase |

**Contratti impliciti non documentati:**

1. **Interfaccia pubblica di `useAccessibilityDetection()` non tipata formalmente
   nel DESIGN**: il tipo del valore di ritorno (oggetto con `talkBackState`,
   `adaptations`, `enableTalkBack`, `disableTalkBack`, `resetDetection`,
   `updateAdaptation`, `resetAdaptations`, e le funzioni utilitarie) è
   derivabile solo dalla lettura del codice nel PLAN T3. Non esiste una
   sezione nel DESIGN che la dichiari come interfaccia TypeScript esplicita
   di riferimento (come sarebbe utile in §5.1 o §5.4). Il progettista di
   DESIGN 004 deve leggere il PLAN per conoscere l'API pubblica.

2. **Comportamento `detection.ts` come hook orfano**: il DESIGN §11 nota
   esplicitamente che `detection.ts` non viene montato in questo documento.
   Questo crea un contratto implicito con DESIGN 004: il documento successivo
   deve integrare il hook in `AuthContext.tsx` (o un altro provider) per
   attivare le adattazioni. Questo contratto è dichiarato in §11 ma non
   formalizzato come vincolo architetturale esplicito per DESIGN 004.

### 3.3 — Rischi tecnici

**Rischi dichiarati nel DESIGN 003 §10 con valutazione indipendente:**

| # | Rischio | Probabilità DESIGN | Probabilità Analyzer | Variazione |
|---|---------|-------------------|---------------------|-----------|
| R1 | `announceForAccessibility` non disponibile su Windows Narrator | Bassa | Bassa | Nessuna |
| R2 | `screenReaderChanged` su RN Windows potrebbe non emettere eventi | Bassa-Media | Bassa-Media | Nessuna |
| R3 | `TalkBackAdaptations` duplicata tra `accessibility/types.ts` e `supabase/types.ts` | Certa | Certa | Nessuna |
| R4 | Finestra di incertezza al primo mount (<100ms) | Certa, impatto Basso | Certa, impatto Basso | Nessuna |
| R5 | `screen-reader.ts` non eliminabile finché `announcements/` non è completo | Certa, impatto Nulla se sequenza rispettata | Certa | Nessuna |
| R6 | Consumatori imprevisti di `use-screen-reader.ts` | Molto bassa | Molto bassa | Nessuna |

**Rischi non dichiarati o sottovalutati:**

| # | Rischio | Probabilità | Impatto | Note |
|---|---------|------------|---------|------|
| RA | Guard DOM assente in `screen-reader.ts` durante la transizione: `initializeLiveRegions()` senza guard usa `document.createElement`. Se un path di codice chiama `useScreenReader().announce*()` durante DESIGN 003, si verifica `ReferenceError: document is not defined`. | **Media** | **Alta** | Già documentato nel REPORT_analisi-coerenza_DESIGN-001-002_v1.0.0.md §2.4 come risk R5 di DESIGN 002. DESIGN 003 riconosce che `screen-reader.ts` rimane invariato (§7.3) ma non quantifica il rischio derivante dal lasciarlo attivo durante la transizione. La nota operativa del progetto ("Non testare i path PIN e sblocco conto privato [...] finché DESIGN 003 è completato") è la mitigazione operativa; è corretto mantenere questa nota attiva. |
| RB | `useUserSettings()` potrebbe non esporre `talkBackManualOverride` e le proprietà associate | **Bassa** | **Alta** | Il PLAN T3 include verifica preventiva con grep. Se il grep non trova le proprietà, T3 è bloccato e richiede modifiche a `UserSettingsContext.tsx` — un file fuori perimetro di DESIGN 003. |
| RC | Gate 3 richiede un componente di test temporaneo per `useAccessibilityDetection()` non documentato nel DESIGN | **Bassa** | **Media** | Il PLAN menziona la verifica funzionale senza fornire il codice del componente. Rischio che la verifica venga saltata o eseguita in modo non riproducibile. |

### 3.4 — Sequenza implementativa complessiva (DESIGN 001 → 002 → 003)

La sequenza dichiarata (DESIGN 001 → DESIGN 002 → DESIGN 003) è
logicamente coerente. Non esistono dipendenze invertite. Non esistono
dipendenze circolari. L'unico punto non completamente dichiarato è la
dipendenza transitiva DESIGN 003 → DESIGN 001 (tramite la catena
DESIGN 002 → DESIGN 001), già evidenziata in §1.3.

---

## ANALISI TEST

### 4.1 — File di test esistenti

Nel repository esiste un solo file di test pertinente all'area di DESIGN 003:

**`__tests__/App.test.tsx`** — test `renders correctly` con
`ReactTestRenderer.create(<App />)`. Non esercita i moduli `accessibility/`
né `locales/` (non ancora montati in `App.tsx`).

**`__tests__/ExportService.test.ts`** — test per il servizio di export.
Non pertinente a DESIGN 003.

Nessun file di test trovato per:
- `accessibility/types.ts`
- `accessibility/engine.ts`
- `accessibility/detection.ts`
- `locales/it.ts` / `locales/index.ts`

Il DESIGN 003 §9 dichiara esplicitamente: "Test automatici (Jest) — Fuori
perimetro design — Piano separato." Il PLAN non include task Jest.

### 4.2 — Contratti critici da coprire (priorità)

| Priorità | Contratto | Motivo |
|----------|----------|--------|
| 1 — ALTA | `engine.announce()` con testo vuoto | Il gate stringa vuota è l'unico filtro interno; un bug qui silenzia tutti gli annunci |
| 2 — ALTA | `engine.announce()` con testo valido (mock `AccessibilityInfo`) | Verificare che `announceForAccessibility` venga chiamata con il testo corretto |
| 3 — ALTA | `useAccessibilityDetection()` — stato iniziale e aggiornamento da listener | Comportamento base del hook su cui tutto il layer announcements si appoggerà |
| 4 — MEDIA | `useAccessibilityDetection()` — override manuale | Funzionalità rilevante per sviluppo e testing in ambienti senza screen reader |
| 5 — MEDIA | `locales/index.ts` — `strings` corrisponde all'oggetto `it` | Fondamentale per la correttezza del sistema di localizzazione |
| 6 — BASSA | `accessibility/types.ts` — compilazione e shape dei tipi | Verificato implicitamente da `npx tsc --noEmit` |

---

## LISTA PUNTI APERTI E AZIONI RACCOMANDATE

### Punti di priorità CRITICA

#### C1 — Contraddizione DESIGN §9/§11 vs PLAN T6 su AuthContext.tsx

- **File**: `docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md`
- **Sezione**: §7.1 (include AuthContext.tsx), §9 (esclude), §11 (esclude)
- **File**: `docs/3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md`
- **Sezione**: Task 003.T6
- **Descrizione**: il DESIGN classifica la patch di `AuthContext.tsx`
  (sostituzione import `useTalkBack` → `useAccessibilityDetection`) come
  "fuori perimetro engine — documento successivo" in §9 e §11. Il PLAN
  include questa patch come Task T6 obbligatorio prima di T7. Senza T6,
  T7 (DELETE `use-talkback.ts`) rompe la build.
- **Azione raccomandata**: scegliere una delle due opzioni e allineare
  i documenti:
  - **Opzione A (raccomandata)**: aggiornare il DESIGN 003 aggiungendo
    `src/context/AuthContext.tsx (PATCH — solo import)` nel perimetro del
    frontmatter; rimuovere le dichiarazioni "fuori perimetro" in §9 e §11
    limitatamente a questa singola modifica di import.
  - **Opzione B**: rimuovere T6 e T7 dal PLAN 003 e spostarli nel PLAN 004.
    In questo caso DESIGN 003 non deve eliminare `use-talkback.ts` (T7
    dipende da T6). Il DELETE di `use-talkback.ts` diventa un gate del
    PLAN 004.
  - Priorità: **CRITICA** — blocca la correttezza dell'implementazione se
    non risolta prima di avviare la codifica.

### Punti di priorità ALTA

#### A1 — Eccezione ADR_001 non formalizzata (import type accessibility/types in announcements/types.ts)

- **File**: `docs/0-architecture/ADR_001_sistema-annunci-accessibili.md`
- **Sezione**: §Regole di dipendenza — invarianti del progetto, Regola 1
- **File correlato**: `docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md`, §3.1
- **Descrizione**: il DESIGN 003 §3.1 introduce una seconda eccezione alla
  Regola 1 dell'ADR (oltre a `announcements/index.ts → engine`, ora anche
  `announcements/types.ts → accessibility/types` come `import type`). L'ADR
  non è stato aggiornato per riflettere questa eccezione autorizzata. La
  giustificazione tecnica è solida ma non è codificata nella fonte di verità
  architettuale.
- **Azione raccomandata**: aggiornare ADR_001 §Regole di dipendenza aggiungendo
  una nota alla Regola 1 che autorizza esplicitamente `announcements/types.ts`
  ad importare `Announcement` e `AnnouncementPriority` da `@/accessibility/types`
  esclusivamente come `import type`. Versionare l'ADR da 1.2.0 a 1.3.0.
- **Priorità**: **ALTA** — il comportamento tecnico è corretto, ma senza
  aggiornamento dell'ADR la regola non è autocoerente per i progettisti futuri.

#### A2 — Rischio RA: guard DOM assente in screen-reader.ts durante la transizione

- **File**: `docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md`
- **Sezione**: §10 (Rischi e dipendenze) — rischio mancante
- **Descrizione**: `src/lib/screen-reader.ts` contiene `initializeLiveRegions()`
  senza guard DOM (`document.createElement` non protetto da
  `typeof document !== 'undefined'`). Durante l'esecuzione di DESIGN 003
  il file rimane invariato (§7.3). Se qualsiasi consumer di
  `useScreenReader().announce*()` viene invocato, si verifica
  `ReferenceError: document is not defined`. Probabilità: Media.
  Impatto: Alta (crash React tree).
- **Azione raccomandata**: aggiungere questo rischio nella tabella §10 del
  DESIGN 003 (oppure in un addendum) con probabilità Media e mitigazione
  esplicita: la nota operativa attiva ("Non testare i path PIN e sblocco
  conto privato [...] finché DESIGN 003 è completato") deve rimanere attiva
  per tutta la durata dell'implementazione di DESIGN 003. Aggiungere una
  riga a §9 che conferma esplicitamente: screen-reader.ts rimane non
  modificato E non deve essere invocato in questo intervallo.
- **Priorità**: **ALTA** — il rischio non è nuovo (documentato nei report
  precedenti) ma deve essere esplicitamente presidato nel documento più
  recente.

#### A3 — Autore e revisore non dichiarati nel frontmatter

- **File**: `docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md`
- **Sezione**: frontmatter
- **Descrizione**: autore e revisore assenti, come nei DESIGN 001 e 002 già
  segnalati nel REPORT precedente. La mancanza non impatta la correttezza
  tecnica ma riduce la tracciabilità del documento.
- **Azione raccomandata**: aggiungere campi `autore` e `revisore` al
  frontmatter (es. `autore: Copilot Agent`, `revisore: donny-81`).
- **Priorità**: **ALTA** (per coerenza con il processo documentale del progetto)

### Punti di priorità MEDIA

#### M1 — Dipendenza implicita T6 → T3 non dichiarata nel task T6

- **File**: `docs/3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md`
- **Sezione**: Task 003.T6
- **Descrizione**: T6 presuppone che T3 (detection.ts) sia completato per
  aggiornare l'import verso `@/accessibility/detection`. La dipendenza è
  inferita dalla sequenza commit ma non dichiarata con un campo
  `Dipende da:` nel task, come avviene per T5 (`Dipende da: 003.T4`).
- **Azione raccomandata**: aggiungere al task T6 il campo
  `Dipende da: 003.T3 (detection.ts deve esistere prima di aggiornare l'import)`.
- **Priorità**: **MEDIA** — non impatta la correttezza, migliora la leggibilità
  del PLAN.

#### M2 — Gate 3: componente di test temporaneo non fornito

- **File**: `docs/3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md`
- **Sezione**: §4 Gate 3
- **Descrizione**: la verifica funzionale manuale del Gate 3 richiede di
  "montare un componente che usa `useAccessibilityDetection()`" con screen
  reader attivo. Il DESIGN §11 dichiara che detection.ts è codice orfano
  in questo documento. Il Gate 2 fornisce uno snippet esplicito per
  `App.tsx`; il Gate 3 non fornisce il corrispondente snippet per
  `useAccessibilityDetection()`, aumentando il rischio che la verifica
  venga saltata.
- **Azione raccomandata**: aggiungere nel Gate 3 uno snippet temporaneo
  minimo (anallogo a quello del Gate 2) da inserire in `App.tsx` per
  testare il hook, con nota di rimozione obbligatoria prima del commit 3.
- **Priorità**: **MEDIA** — impatta la completezza del testing funzionale.

#### M3 — Interfaccia pubblica di useAccessibilityDetection() non tipata nel DESIGN

- **File**: `docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md`
- **Sezione**: §5.1, §5.4
- **Descrizione**: l'API pubblica del hook (valore di ritorno con tutti i
  campi e le funzioni) è documentata solo nel codice del PLAN T3, non come
  contratto TypeScript formale nel DESIGN. I progettisti di DESIGN 004 che
  leggono solo il DESIGN devono cercare il PLAN per conoscere l'interfaccia.
- **Azione raccomandata**: aggiungere in §5.1 o §5.4 del DESIGN 003 una
  tabella dell'interfaccia pubblica con i campi di ritorno e i loro tipi
  (simile a come DESIGN 002 §4 elenca i prop di `ActivityDetectorView`).
- **Priorità**: **MEDIA** — il DESIGN deve essere autosufficiente per i
  progettisti del documento successivo.

#### M4 — Dipendenza transitiva DESIGN 003 → DESIGN 001 non dichiarata

- **File**: `docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md`
- **Sezione**: frontmatter, §1 (Contesto e motivazione)
- **Descrizione**: il frontmatter dichiara solo la precondizione diretta
  (DESIGN 002). La dipendenza transitiva verso DESIGN 001 (necessaria per
  DESIGN 002) non è menzionata. Un implementatore che inizi il progetto
  da questo documento non saprebbe che deve implementare anche DESIGN 001.
- **Azione raccomandata**: aggiungere nel §1 o nelle precondizioni una nota
  sulla catena di dipendenza: DESIGN 003 → DESIGN 002 → DESIGN 001.
- **Priorità**: **MEDIA** — migliora la comprensione del ciclo implementativo
  per nuovi contributori.

---

*Report prodotto da Copilot Agent (Analyzer) — 2026-05-21*
*Revisore assegnato: donny-81*
