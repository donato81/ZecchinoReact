---
tipo: report-analisi
titolo: Analisi di Coerenza e Validazione — DESIGN 001 + DESIGN 002
versione: 1.0.0
data: 2026-05-20
stato: DRAFT
autore: Copilot Agent (Analyzer)
revisore: donny-81
file-analizzati:
  - docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md
  - docs/3-coding-plans/001-PLAN_fix-blocchi-avvio_v0.1.0.md
  - docs/4-todo-lists/001-TODO_fix-blocchi-avvio_v0.1.0.md
  - docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md
  - docs/3-coding-plans/002-PLAN_fix-provider-bootstrap_v0.2.0.md
  - docs/4-todo-lists/002-TODO_fix-provider-bootstrap_v0.2.0.md
---

# REPORT ANALISI COERENZA — DESIGN 001 + DESIGN 002

---

## EXECUTIVE SUMMARY

DESIGN 001 e DESIGN 002 sono complessivamente coerenti, completi e pronti per
avviare l'implementazione. Sono state rilevate sei incoerenze minori, nessuna
bloccante per la correttezza tecnica: un riferimento stale alla "sezione 10
DESIGN" in PLAN 001 (la sezione non esiste nel design attuale dopo il cleanup
del 2026-05-19); un'inversione dell'ordine di implementazione nel titolo del
frontmatter di DESIGN 002; un offset di 2 righe nei riferimenti al codice
sorgente in DESIGN 002 e TODO 002; una nota di perimetro non allineata tra
frontmatter e corpo in DESIGN 001; l'assenza di autore/revisore dichiarati in
entrambi i design; e il Risk R5 (screen-reader.ts) classificato come probabilità
"Bassa" che l'analisi del codice sorgente ridefinisce come probabilità
"Media" se qualsiasi metodo `announce*()` viene invocato prima del fix N6.
Il gap più critico è l'assenza totale di test per i contratti introdotti da
entrambi i design, in particolare la necessità di mock per `App.test.tsx` dopo
l'implementazione di DESIGN 002.

---

## VERDETTO COMPLESSIVO

### DESIGN 001 — Fix blocchi avvio

| Campo | Stato |
|-------|-------|
| Stato documento | REVIEWED |
| Coding Plan | PRESENTE |
| Todo | PRESENTE — ALLINEATO |
| Precondizioni | Tutte soddisfatte |
| Readiness Coding Plan | **PRONTO** |
| Criticità aperte | 4 — vedi dettaglio |

**Criticità aperte:**
1. Riferimento stale `## Gate di verifica globale (sezione 10 DESIGN)` in
   PLAN 001: la sezione 10 è stata rimossa nel cleanup del 2026-05-19 e
   il DESIGN 001 attuale conta solo 7 sezioni. Il contenuto del gate nel
   PLAN è autonomo e corretto, ma il riferimento è stale.
2. Nota di perimetro in DESIGN 001 §3 non allineata con il frontmatter:
   il corpo descrive `src/lib/supabase/client.ts` come "fuori perimetro
   originale, indispensabile per B2", ma il frontmatter già include il
   file nel perimetro. Inconsistenza documentale minore.
3. Autore e revisore non dichiarati nel frontmatter.
4. Versione `^5.0.3` di `babel-plugin-module-resolver` dichiarata nel
   PLAN ma non nel DESIGN — non verificabile dalla sola lettura del DESIGN.

### DESIGN 002 — Fix provider bootstrap

| Campo | Stato |
|-------|-------|
| Stato documento | REVIEWED |
| Coding Plan | PRESENTE |
| Todo | PRESENTE — ALLINEATO |
| Precondizioni | 1 aperta — DESIGN 001 non implementato |
| Readiness Coding Plan | **BLOCCATO** — precondizione DESIGN 001 non implementata |
| Criticità aperte | 5 — vedi dettaglio |

**Criticità aperte:**
1. Inversione ordine nel frontmatter titolo: "N6, N8, N11" vs ordine
   corretto di implementazione N11 → N8 → N6 dichiarato nel corpo del
   documento. Il PLAN 002 usa l'ordine corretto.
2. Offset di 2 righe nei riferimenti al codice sorgente: DESIGN 002 §3
   e TODO 002 N8-3 citano "righe 63–65" per il blocco `isScreenReaderActive`
   in `AuthContext.tsx`, ma la verifica diretta del file indica che il
   codice si trova alle righe 61–63 (offset di 2 righe).
3. Risk R5 sottovalutato: `src/lib/screen-reader.ts` ha guard nel
   costruttore (`typeof document !== 'undefined'`) ma il metodo
   `initializeLiveRegions()` è privo di guard. Se qualsiasi metodo
   `announce*()` del hook viene invocato in React Native, si genera
   `ReferenceError: document is not defined`. La probabilità effettiva
   è "Media" (non "Bassa" come classificato nel DESIGN 002), condizionata
   all'invocazione di un metodo di annuncio prima che N6 sia completato.
4. PLAN 002 marcato stato "READY" con precondizione (DESIGN 001) ancora
   non implementata. Non è incoerenza tecnica ma può generare confusione
   operativa.
5. Autore e revisore non dichiarati nel frontmatter.

---

## ANALISI DESIGN 001

### 1.1 — Scheda di stato documento

| Campo | Valore |
|-------|--------|
| ID e titolo | DESIGN 001 — Fix blocchi di avvio – Gruppo 1 (B1–B6) |
| Versione | 0.1.0 |
| Data | 2026-05-13 |
| Stato frontmatter | REVIEWED |
| Stato interno Sezione Metadata | Non presente — il documento non ha una sezione esplicita "Metadata". La Sezione 1 del documento è "Grafo delle dipendenze e ordine obbligatorio". |
| Autore dichiarato | Non dichiarato nel frontmatter |
| Revisore dichiarato | Non dichiarato nel frontmatter |
| Coerenza frontmatter/corpo | **Parziale** — il perimetro nel frontmatter include `src/lib/supabase/client.ts`, ma la nota §3 del corpo lo descrive come "fuori perimetro originale, indispensabile per B2". Il frontmatter è stato probabilmente aggiornato senza allineare la nota nel corpo. |

### 1.2 — Perimetro e scope

**Descrizione sintetica**: il DESIGN 001 descrive e risolve sei blocchi tecnici
(B1–B6) che impediscono il bundle Metro e l'avvio dell'app React Native. Lo
scope è limitato a configurazione e dipendenze; nessuna UI definitiva.

**In scope (dichiarato nel frontmatter e confermato in §7):**
- `babel.config.js` (B1, B2, B6)
- `package.json` (B1, B5)
- `src/context/AuthContext.tsx` (B3, B4)
- `src/context/AppDataContext.tsx` (B3)
- `src/lib/supabase/client.ts` (B2 — vedi nota §3)
- `src/components/ui/button.tsx` (B4 — CREATE)
- `src/env.d.ts` (B2 — CREATE)

**Fuori scope (dichiarato nell'intro):** Nessuna UI definitiva, nessun
componente definitivo, nessuna schermata.

**Coerenza scope/contenuto**: il perimetro del frontmatter corrisponde
esattamente ai file elencati nella sezione §7 "Riepilogo modifiche per file".
Tutti gli elementi trattati nel corpo del documento ricadono nei file dichiarati.
**Evidenza diretta**: tabella §7 riporta gli stessi 7 file con le stesse
operazioni (MODIFY/CREATE) del frontmatter. ✓

**Elemento fuori perimetro dichiarato rilevato nel corpo**: in §3 la modifica
a `src/lib/supabase/client.ts` è descritta come "fuori perimetro originale,
indispensabile per B2." Questo è coerente con la nota stessa, ma genera
l'inconsistenza documentale con il frontmatter già citata in 1.1.

### 1.3 — Precondizioni formali

| Precondizione | Stato |
|---------------|-------|
| Leggere `docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md` prima di procedere (dichiarata nell'intro e nel frontmatter campo `sorgente`) | **SODDISFATTA** — il file esiste nel repository. Verificato tramite ricerca file. |
| B5 applicato prima di `npm install` (dichiarata in §1: "B5 è necessario prima di qualsiasi installazione npm") | **SODDISFATTA** — il PLAN raggruppa B5 nella Fase 1 (stesso commit di B1 e B2); il gate di Fase 1 esegue `npm install` dopo le modifiche ai file, garantendo che B5 sia nel commit prima dell'installazione. |
| B3 e B4 richiedono B1 come precondizione (dichiarata in §1: "B3 dipende da B1", "B4 richiede B1 per la risoluzione degli alias") | **SODDISFATTA** — il PLAN struttura B3 in Fase 2 e B4 in Fase 3, entrambe successive alla Fase 1 che include B1. |
| B6 risolto da B2 — non richiede azione aggiuntiva (dichiarata in §1) | **SODDISFATTA** — nessun task aggiuntivo per B6 nel PLAN e nel TODO, coerente con la dichiarazione. |

### 1.4 — Analisi del Coding Plan

**Copertura del perimetro**: il PLAN 001 elenca nella tabella "File coinvolti"
gli stessi 7 file del DESIGN (5 MODIFY + 2 CREATE), con la stessa mappatura
blocco–file. Copertura completa. **Evidenza**: tabella "File coinvolti" in
PLAN 001 è identica alla tabella §7 del DESIGN 001. ✓

**Ordine rispetto alle dipendenze**: la struttura in 3 fasi del PLAN rispecchia
il grafo di dipendenze dichiarato nel DESIGN §1:
- Fase 1 (B1 + B2 + B5) → unico commit, nessuna dipendenza incrociata tra questi tre
- Fase 2 (B3) → dipende da B1 completato in Fase 1 ✓
- Fase 3 (B4) → dipende da B1 completato in Fase 1 ✓

**Passi del PLAN non supportati dal DESIGN**: nessuno rilevato. ✓

**Elementi del DESIGN non coperti dal PLAN**: nessuno rilevato. ✓

**Incoerenza trovata (I1)**: il PLAN include l'intestazione
`## Gate di verifica globale (sezione 10 DESIGN)`. Il DESIGN 001 attuale
conta 7 sezioni (§1–§7). La "sezione 10" era presente in una versione
precedente del DESIGN che includeva sezioni implementative, rimosse nel
cleanup del 2026-05-19 (documentato nel CHANGELOG: "rimosso contenuto
tecnico-implementativo (code block, bash, gate di verifica)"). Il riferimento
è stale. Il contenuto del gate nel PLAN è autonomo e corretto — non pregiudica
l'implementazione, ma può disorientare l'implementatore che cerca la sezione
nel DESIGN.

**Versioni dipendenze**: il PLAN specifica versioni esatte — `babel-plugin-module-resolver: ^5.0.3` e `@react-native-async-storage/async-storage: ^2.1.2`. Il DESIGN descrive solo "la serie 2.x stabile" per AsyncStorage (coerente) ma non specifica la versione di `babel-plugin-module-resolver`. [DA VERIFICARE] la compatibilità di `^5.0.3` con la versione di `@babel/core: ^7.25.2` dichiarata in `package.json`.

### 1.5 — Analisi del Todo

**Allineamento con il Coding Plan**: il TODO 001 è strutturato in 3 fasi
corrispondenti alle 3 fasi del PLAN, con task derivati direttamente dagli step
del PLAN. **Evidenza diretta**: la Fase 1 del TODO lista 9 task che corrispondono
esattamente alle 4 modifiche di file (babel.config.js, package.json, client.ts)
e alla creazione di env.d.ts descritte nel PLAN Fase 1. ✓

**Task aperti vs precondizioni**: tutte le checkbox sono `[ ]` — nessun task
completato. Lo stato ACTIVE è coerente con l'assenza di implementazione.
Nessuna precondizione bloccante per i task individuali (design REVIEWED, plan
DRAFT con contenuto completo).

**Task già risolti marcati aperti / task aperti già risolti**: nessuno rilevato.
Il repository è nello stato pre-implementazione, confermato dalla verifica
diretta: `babel.config.js` non ha ancora i plugin `module-resolver` e
`react-native-dotenv`; `src/components/ui/button.tsx` non esiste. ✓

**Next Action**: il TODO non ha un campo esplicito "Next Action" nel frontmatter,
ma la struttura sequenziale rende implicita l'azione: avvio della Fase 1 (B1
+ B2 + B5, primo commit). La nota finale del TODO lo conferma esplicitamente.

### 1.6 — Invarianti architetturali

**Invarianti dichiarate (con riferimento esplicito alla sezione):**

| Invariante | Sezione |
|-----------|---------|
| Scope limitato a configurazione e dipendenze. Nessuna UI, nessun componente definitivo, nessuna schermata. | Intro DESIGN 001 |
| `accessibilityRole` deve essere `"alert"` (non `"alertdialog"`) per il dialog inattività in React Native | §6 (B4) |
| `onClick` è un alias transitorio di `onPress` — ogni occorrenza deve essere sostituita con `onPress` nello stesso commit B4 | §6 (B4-A) |
| La modifica a `src/lib/supabase/client.ts` deve essere inclusa nello stesso commit di B2 | §3 (nota di perimetro) |
| Lo shim toast è temporaneo — da sostituire nella fase UI | §5 (B3) |
| Ordine obbligatorio plugin Babel: `react-native-dotenv` prima di `module-resolver` | Confermato nel PLAN Fase 1 |

**Contraddizioni interne**: nessuna contraddizione rilevata tra sezioni diverse
del documento. La nota di perimetro in §3 genera un'inconsistenza con il
frontmatter (vedi 1.1) ma non è una contraddizione logica nel contenuto.

### 1.7 — Dipendenze da altri design

| Riferimento | File esiste? | Stato frontmatter corrispondente |
|-------------|-------------|----------------------------------|
| `docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md` (frontmatter campo `sorgente`, citato anche nell'intro) | **SÌ** | Non applicabile (è un report, non un design) |

Il documento non contiene riferimenti espliciti ad altri design numerati
(DESIGN 002, 003, ecc.). La nota finale del PLAN 001 menziona "il documento
di design successivo" per il Gruppo 2, ma senza citazione diretta di un file.

---

## ANALISI DESIGN 002

### 1.1 — Scheda di stato documento

| Campo | Valore |
|-------|--------|
| ID e titolo | DESIGN 002 — Fix provider bootstrap — Gruppo 2 (N6, N8, N11) |
| Versione | 0.2.0 |
| Data | 2026-05-14 |
| Stato frontmatter | REVIEWED |
| Stato interno Sezione Metadata | Non presente — il documento non ha una sezione esplicita "Metadata". La Sezione 1 è "Grafo delle dipendenze e ordine obbligatorio". |
| Autore dichiarato | Non dichiarato nel frontmatter |
| Revisore dichiarato | Non dichiarato nel frontmatter |
| Coerenza frontmatter/corpo | **Parziale** — il frontmatter elenca i problemi come "(N6, N8, N11)" ma l'ordine di implementazione dichiarato nel corpo del documento (§1) è N11 → N8 → N6. L'inversione è presente solo nel campo titolo del frontmatter. |

### 1.2 — Perimetro e scope

**Descrizione sintetica**: il DESIGN 002 risolve tre problemi tecnici (N11, N8,
N6) che impediscono il montaggio di `AuthProvider` senza crash in React Native.
Lo scope è limitato ai fix minimi sull'ambiente TypeScript e sulle API DOM
incompatibili con React Native.

**In scope (dichiarato nel frontmatter e confermato in §1–§4):**
- `tsconfig.json` (N11 — MODIFY)
- `src/context/AuthContext.tsx` (N8, N6 — MODIFY)
- `src/hooks/use-inactivity-timer.ts` (N6 — MODIFY)
- `src/components/ActivityDetectorView.tsx` (N6 — CREATE, dichiarato come
  "fuori perimetro originale, indispensabile per N6")

**Fuori scope (dichiarato nell'intro):** Nessuna UI definitiva, nessun sistema
di accessibilità completo, nessuna schermata.

**Coerenza scope/contenuto**: il perimetro dichiarato nel frontmatter
corrisponde ai 4 file elencati nella tabella "File coinvolti" del PLAN 002.
Il corpo del documento tratta esclusivamente N11, N8 e N6 — tutti dentro il
perimetro. **Evidenza**: tabella §5 "Rischi e dipendenze" cita esplicitamente
"Sistema screen reader completo", "sistema haptic e audio (N1, N2)" e
"`AppDataContext` cache asincrona (N9)" come elementi FUORI perimetro. ✓

### 1.3 — Precondizioni formali

| Precondizione | Stato |
|---------------|-------|
| Gruppo 1 (DESIGN 001) completamente implementato — dichiarata nell'intro e in §5 "Precondizioni da rispettare" | **APERTA** — il TODO 001 ha tutte le checkbox `[ ]`. Nessun task del Gruppo 1 è stato implementato. Verificato tramite lettura integrale del TODO 001. |
| `npm install` completato senza errori (dichiarata in §5) | **DA VERIFICARE** — dipende dal completamento del Gruppo 1 (B5 che corregge la versione AsyncStorage). Non verificabile in assenza di DESIGN 001 implementato. |
| `App.tsx` deve montare `AuthProvider` prima di eseguire i gate N8 e N6 (dichiarata in §5) | **DA VERIFICARE** — la verifica richiede l'esecuzione del piano, non è determinabile in analisi statica. |
| Leggere `docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md` (frontmatter `sorgente`) | **SODDISFATTA** — il file esiste nel repository. ✓ |

### 1.4 — Analisi del Coding Plan

**Copertura del perimetro**: il PLAN 002 elenca nella tabella "File coinvolti"
gli stessi 4 file del DESIGN (3 MODIFY + 1 CREATE), con la stessa mappatura
problema–file. Copertura completa. **Evidenza**: tabella "File coinvolti" in
PLAN 002 corrisponde esattamente al perimetro del frontmatter di DESIGN 002. ✓

**Ordine rispetto alle dipendenze**: la struttura in 3 commit del PLAN rispecchia
il grafo dichiarato nel DESIGN §1:
- Commit 1 (N11: tsconfig) → prerequisito che rende visibili N8 e N6 al type-checker ✓
- Commit 2 (N8: screen reader) → dipende da N11 completato ✓
- Commit 3 (N6: inactivity timer) → dipende da N8 completato (commit separati obbligatori) ✓

**Passi del PLAN non supportati dal DESIGN**: nessuno rilevato. Il PLAN è
derivato interamente dal DESIGN (dichiarato esplicitamente nella sezione
"Fonte di verità" del PLAN). ✓

**Elementi del DESIGN non coperti dal PLAN**: nessuno rilevato. ✓

**Vincolo separazione N8/N6**: entrambi i documenti (DESIGN §1 e PLAN
Executive Summary) dichiarano il vincolo commit separati per N8 e N6 come
"vincolo obbligatorio" e "non una raccomandazione". Coerente. ✓

**Versioni dipendenze**: il PLAN non introduce nuove dipendenze npm. Le
modifiche sono a file esistenti. Le API di React Native usate (`AccessibilityInfo`,
`Platform`, `View`, `StyleSheet`) sono parte del core React Native 0.82
dichiarato nel progetto — nessuna dipendenza aggiuntiva. ✓

**Nota**: il PLAN descrive l'assenza intenzionale di `onResponderGrant`
in `ActivityDetectorView.tsx` con motivazione esplicita ("dead code: poiché
`onStartShouldSetResponder` restituisce `false`, il componente non acquisisce
il responder"). Questa è una decisione architetturale documentata. ✓

### 1.5 — Analisi del Todo

**Allineamento con il Coding Plan**: il TODO 002 è strutturato in 3 commit
corrispondenti ai 3 commit del PLAN, con task atomici (N11-1, N8-1 – N8-4,
N6-1 – N6-7) e gate esplicitati per ciascun commit. **Evidenza**: la suddivisione
commit/gate del TODO corrisponde punto per punto alla struttura del PLAN. ✓

**Precondizioni esplicite**: il TODO 002 ha una sezione "Precondizioni" con
tre task (PRE-1, PRE-2, PRE-3) che corrispondono alle 3 precondizioni del
§5 del DESIGN 002 e alle "Precondizioni da verificare prima di iniziare"
del PLAN 002. ✓

**Task aperti vs precondizioni**: tutte le checkbox sono `[ ]` incluse le
precondizioni. Coerente con l'assenza di implementazione del Gruppo 1.

**Incoerenza trovata (I4)**: il TODO 002 task N8-3 cita "righe 63–65" per
la rimozione del blocco `isScreenReaderActive` in `AuthContext.tsx`. Il DESIGN
002 §3 cita le stesse "righe 63–65". La verifica diretta del file rivela che
il codice è alle righe 61–63 (offset di 2 righe). Il codice è identificabile
dal pattern testuale (`typeof document !== 'undefined' && document.querySelector`)
in modo non ambiguo, quindi l'offset non blocca l'implementazione, ma
l'implementatore cercherebbe le righe sbagliate se segue i numeri di riga
letteralmente.

**Next Action**: il TODO non ha un campo esplicito "Next Action", ma l'ordine
sequenziale è implicito: soddisfare PRE-1 (completamento Gruppo 1) prima
di avviare il Commit 1 N11.

### 1.6 — Invarianti architetturali

**Invarianti dichiarate (con riferimento esplicito alla sezione):**

| Invariante | Sezione |
|-----------|---------|
| N8 e N6 devono essere in commit separati — vincolo obbligatorio (non raccomandazione) | §1, R4 in §5 |
| L'interfaccia pubblica di `useInactivityTimer` rimane invariata: `resetTimer: () => void`, `showWarning: boolean` | §4 |
| `isScreenReaderActive` rimane di tipo `boolean` — nessun call site esterno cambia firma | §3 |
| `ActivityDetectorView` usa `onStartShouldSetResponder` con `return false` — rileva il tocco senza consumarlo | §4 |
| `onResponderGrant` assente da `ActivityDetectorView` — dead code in questo contesto | §4 |
| `onKeyDown` in `ActivityDetectorView` wrappato nella guard `Platform.OS === 'windows'` | §4 |
| `subscription.remove()` — non usare `AccessibilityInfo.removeEventListener` (deprecato da RN 0.65) | §3 |
| Il wrapper `ActivityDetectorView` avvolge solo la parte autenticata (Opzione B, non Opzione A) | §4 |
| N11 (tsconfig) deve precedere N8 e N6 per rendere visibili gli errori DOM al type-checker | §1 |
| `App.tsx` deve montare `AuthProvider` prima di eseguire i gate N8 e N6 | §5 |

**Contraddizioni interne**: nessuna contraddizione logica rilevata. L'inversione
ordine N6/N8/N11 nel titolo del frontmatter vs N11→N8→N6 nel corpo (già citata
in 1.1) non genera contraddizioni nel contenuto tecnico perché tutti i requisiti
d'ordine sono dichiarati nel corpo e nel PLAN in forma coerente.

### 1.7 — Dipendenze da altri design

| Riferimento | File esiste? | Stato dichiarato | Stato reale (frontmatter) |
|-------------|-------------|-----------------|--------------------------|
| `docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md` (dichiarata nell'intro come precondizione, con link diretto) | **SÌ** | "completamente implementato" (precondizione da soddisfare) | REVIEWED — non ancora implementato (TODO 001 tutto aperto) |
| `docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md` (frontmatter `sorgente`) | **SÌ** | Non applicabile | Non applicabile |
| Sistema screen reader completo (design dedicato, citato in §5) | [DA VERIFICARE] — non è stato trovato un DESIGN dedicato esclusivamente al sistema screen reader. DESIGN 003 copre l'accessibility engine, che include `screen-reader.ts`. | DESIGN 003 trovato | DESIGN 003 stato: REVIEWED |
| Sistema haptic e audio N1, N2 (citati in §5 come "indipendenti") | [DA VERIFICARE] — inclusi in DESIGN 003 e 004 che coprono l'accessibility engine e gli annunci. Non esiste un design specifico per soli N1/N2. | Non identificato un design separato | — |
| `AppDataContext` cache asincrona N9 (citata in §5 come "indipendente") | **SÌ** | DRAFT (DESIGN 007 `007-DESIGN_async-cache-hydration_v0.1.0.md`) | DRAFT |

---

## ANALISI DI COERENZA TRASVERSALE

### 2.1 — Dipendenza dichiarata

DESIGN 002 dichiara esplicitamente la dipendenza da DESIGN 001 in tre punti:

1. **Intro del documento**: "questo documento presuppone che il Gruppo 1
   ([001-DESIGN_fix-blocchi-avvio_v0.1.0.md]) sia stato completamente
   implementato. Bundle Metro deve funzionare, dipendenze installate, alias
   `@/*` risolto." **Evidenza**: blocco intro del documento DESIGN 002.

2. **§5 "Precondizioni da rispettare"**: "Il Gruppo 1 deve essere completamente
   implementato e verificato prima di iniziare questo gruppo." **Evidenza**:
   prima voce di §5.

3. **TODO 002 "Precondizioni"**: "PRE-1 — Verificare che tutti i gate del
   Gruppo 1 (B1–B6) siano superati." **Evidenza**: prima voce della sezione
   Precondizioni del TODO 002.

**Coerenza con la logica architetturale**: la dipendenza è corretta. Senza B1
(alias `@/*`), l'import `import { ActivityDetectorView } from
'@/components/ActivityDetectorView'` (introdotto da N6) non si risolverebbe
in Metro. Senza B2 (react-native-dotenv), il client Supabase fallirebbe
all'avvio. Senza B5, `npm install` non completa. ✓

### 2.2 — Coerenza dei contratti condivisi

Entrambi i design modificano `src/context/AuthContext.tsx` ma toccano sezioni
diverse:

| Design | Modifica in AuthContext.tsx | Righe coinvolte |
|--------|----------------------------|----------------|
| DESIGN 001 (B3) | Rimozione `import { toast as sonnerNotify } from 'sonner'` → shim locale | Riga 13 (import da rimuovere) |
| DESIGN 001 (B4) | Rimozione `import { Button } from '@/components/ui/button'` + conversione dialog JSX DOM → RN | Riga 10 + blocco dialog (righe 320–338 circa) |
| DESIGN 002 (N8) | Aggiunta `AccessibilityInfo`, stato `isScreenReaderActive`, `useEffect` detection | Riga 61–63 (da rimuovere), nuovi useState e useEffect |
| DESIGN 002 (N6) | Import `ActivityDetectorView` + wrapper condizionale nel render del provider | Nuove righe: import section + return JSX |

Le modifiche non sono in conflitto — toccano righe diverse e sezioni
diverse del file. L'ordine di implementazione (DESIGN 001 prima, DESIGN 002
poi) garantisce che ogni commit parta da uno stato coerente. ✓

**Nessun contratto condiviso tra i due design**: i tipi e le interfacce
introdotti da DESIGN 001 (`Button`, shim toast) non sono referenziati da
DESIGN 002. I tipi introdotti da DESIGN 002 (`ActivityDetectorView`,
`isScreenReaderActive` come state) non dipendono da DESIGN 001. I due
design sono ortogonali rispetto ai contratti. ✓

**Reference incrociati che assumono stati non raggiunti**: l'unico reference
incrociato è la precondizione di DESIGN 002 su DESIGN 001 — già dichiarata
e verificata in 2.1. ✓

### 2.3 — Ordine di implementazione

**Ordine dichiarato**: B1+B2+B5 → B3 → B4 → N11 → N8 → N6

**Correttezza rispetto alle dipendenze reali**:

| Dipendenza | Soddisfatta dall'ordine? |
|-----------|--------------------------|
| B1 prima di B3 (risoluzione alias `@/*` prima di rimuovere `sonner`) | ✓ |
| B1 prima di B4 (risoluzione alias prima di creare `button.tsx`) | ✓ |
| B5 prima di `npm install` | ✓ |
| DESIGN 001 completamente implementato prima di N11 | ✓ — precondizione esplicita in DESIGN 002 |
| N11 prima di N8 (visibilità errori DOM) | ✓ |
| N11 prima di N6 (visibilità errori DOM) | ✓ |
| N8 prima di N6 (commit separati per bisezione) | ✓ |

**Un implementatore può procedere con 001 poi 002 senza blocchi tecnici?**
Sì, l'ordine è logicamente coerente. Non ci sono dipendenze circolari né
contraddizioni. ✓

**Rischi tecnici nell'ordine**:
- Il TODO 001 include la creazione di `.env` nella root con valori placeholder
  (richiesta dal gate B2). Questo file non è tracciato in git (`.gitignore`
  tipicamente esclude `.env`). L'implementatore deve crearlo manualmente in
  ogni clone del repository. Non è un rischio di ordine ma di configurazione
  locale. [DA VERIFICARE] se `.env` è già in `.gitignore`.
- `AuthContext.tsx` viene modificato sia in DESIGN 001 (B3, B4) che in DESIGN
  002 (N8, N6). Conflitti di merge non si verificano se l'ordine è rispettato,
  ma un backout di DESIGN 002 richiederebbe attenzione alle modifiche
  parziali del file.

### 2.4 — Compatibilità con i design successivi

| Design successivo | Contratti attesi da 001/002 | Compatibilità |
|-------------------|-----------------------------|---------------|
| DESIGN 003 (accessibility engine) — accessibility-engine in `lib/` | Nessun contratto diretto. DESIGN 003 è in P1, successivo alla P0 che contiene DESIGN 001/002. | **Compatibile** — DESIGN 001 introduce uno shim toast temporaneo (§5 B3) che sarà sostituito nella fase UI, non da DESIGN 003. DESIGN 002 non interferisce con `screen-reader.ts`. |
| DESIGN 004 (announcements layer) | Dipende da DESIGN 003. Nessun contratto diretto da DESIGN 001/002. | **Compatibile** — il sistema annunci di DESIGN 004 è indipendente. |
| DESIGN 007 (async-cache-hydration) — `AppDataContext` | Dichiarato esplicitamente in DESIGN 002 §5 come "indipendente, può essere parallelizzato con il Gruppo 2". | **Compatibile** — nessuna dipendenza diretta. |
| DESIGN 008 (network-connectivity) | Dichiarato in DESIGN 002 §5 come "indipendente". | **Compatibile** — nessuna dipendenza diretta. |
| DESIGN 009 (export-nativo) | Nessun contratto da DESIGN 001/002. | **Compatibile** — ExportService è indipendente. |

**Punto da segnalare (critico)**: DESIGN 003 deve affrontare la migrazione di
`src/lib/screen-reader.ts` a React Native. Il metodo `initializeLiveRegions()`
di `ScreenReaderAnnouncer` è privo di guard DOM (`document.createElement` senza
`typeof document !== 'undefined'`). Se qualsiasi metodo `announce*()` viene
invocato da `AuthContext.tsx` (attraverso il hook `useScreenReader` già
importato alla riga 12) prima che DESIGN 003 sia implementato, si verifica
un `ReferenceError: document is not defined` in React Native. DESIGN 002 §5
classifica questo come Risk R5 con probabilità "Bassa", ma l'analisi del
codice sorgente mostra che il metodo `announce()` chiama `initializeLiveRegions()`
incondizionatamente se `!this.initialized`. La probabilità effettiva dipende
dall'esistenza di path di codice che chiamino `screenReader.announceXxx()`
durante il mount di `AuthProvider`. **Evidenza**: `src/lib/screen-reader.ts`
righe 40–44 (`announce` chiama `initializeLiveRegions` se `!initialized`)
e righe 18–37 (`initializeLiveRegions` usa `document.createElement` senza
guard).

---

## ANALISI TEST

### File di test trovati pertinenti a DESIGN 001 e 002

**`__tests__/App.test.tsx`** — l'unico test attivo nel repository che potrebbe
essere impattato dall'implementazione di DESIGN 001 e 002:

```ts
test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
```

**`__tests__/ExportService.test.ts`** — placeholder per DESIGN 009. Nessun
contenuto rilevante per DESIGN 001 e 002. Non analizzato ulteriormente.

### Allineamento test con il design aggiornato

Il test `App.test.tsx` attuale è minimale e non importa né mocka alcuna
dipendenza nativa (AccessibilityInfo, Supabase, InactivityTimer).

Dopo l'implementazione di DESIGN 002 (che richiede come PRE-3 il montaggio
di `AuthProvider` in `App.tsx`), il test `App.test.tsx` sarà esposto ai
seguenti crash potenziali:
- `ReferenceError: document is not defined` da `useInactivityTimer` (N6 non
  ancora fixato al momento del test — risolto solo dopo DESIGN 002 completo)
- `AccessibilityInfo.isScreenReaderEnabled is not a function` da N8 (richiede
  mock di `react-native/AccessibilityInfo` nel test)
- Crash da `src/lib/supabase/client.ts` se non esiste il mock del modulo
  `@env` (introdotto da DESIGN 001 B2)
- Crash da `src/lib/screen-reader.ts` (Risk R5 descritto in 2.4)

### Gap di copertura

| Gap | Contratto non coperto | Riferimento design |
|-----|----------------------|-------------------|
| G1 | Nessun test per il contratto di `AccessibilityInfo` detection in `AuthContext.tsx` | DESIGN 002 §3 (N8) |
| G2 | Nessun test per il contratto di `useInactivityTimer` con API RN (timer globale, senza `window.*`) | DESIGN 002 §4 (N6) |
| G3 | Nessun test per `ActivityDetectorView` — `onStartShouldSetResponder` restituisce `false`, `onKeyDown` guard Windows | DESIGN 002 §4 (N6) |
| G4 | Nessun test per `src/components/ui/button.tsx` (placeholder da creare) | DESIGN 001 §6 (B4-A) |
| G5 | Nessun test per lo shim toast in `AuthContext.tsx` e `AppDataContext.tsx` | DESIGN 001 §5 (B3) |
| G6 | `App.test.tsx` non ha mock per `@env`, `AccessibilityInfo`, `useInactivityTimer` — il test fallirà dopo l'implementazione di DESIGN 001+002 se `AuthProvider` è montato in `App.tsx` senza aggiornare il test | DESIGN 001 B2 + DESIGN 002 PRE-3 |
| G7 | Nessun file placeholder di test per DESIGN 001 e 002, a differenza di `ExportService.test.ts` per DESIGN 009 | — |

**Nota**: nessun test esistente copre contratti non più validi — i test sono
troppo minimali per farlo. Il rischio è opposto: i test esistenti non coprono
i contratti introdotti e potrebbero fallire dopo l'implementazione. ✓

---

## LISTA PUNTI APERTI E AZIONI RACCOMANDATE

### Priorità CRITICA (blocca implementazione o introduce rischio di regressione)

**C1 — `App.test.tsx` richiede aggiornamento prima di procedere con
DESIGN 002 PRE-3**
- File: `__tests__/App.test.tsx`
- Sezione di riferimento: DESIGN 002 §5 precondizione PRE-3 ("App.tsx deve
  montare AuthProvider")
- Azione raccomandata: aggiungere mock per `@env`, `AccessibilityInfo`,
  e `useInactivityTimer` (o mockare l'intero `AuthProvider`) prima di
  procedere con l'implementazione di DESIGN 002, in modo che il test
  esistente non fallisca dopo il montaggio di `AuthProvider` in `App.tsx`.

**C2 — Risk R5: `screen-reader.ts` privo di guard in `initializeLiveRegions`**
- File: `src/lib/screen-reader.ts` righe 18–37
- Sezione di riferimento: DESIGN 002 §5 Risk R5
- Azione raccomandata: rivalutare la probabilità di Risk R5 da "Bassa" a
  "Media". Aggiungere una guard `if (typeof document === 'undefined') return`
  all'inizio di `initializeLiveRegions()` come misura preventiva, oppure
  documentare esplicitamente il path di codice che garantisce che nessuna
  chiamata `announce*()` raggiunga il metodo prima che DESIGN 003 sia
  implementato. La decisione di quando correggere è a discrezione
  dell'architetto ma va documentata.

### Priorità ALTA (incoerenza documentale che può disorientare l'implementatore)

**A1 — Riferimento stale "sezione 10 DESIGN" in PLAN 001**
- File: `docs/3-coding-plans/001-PLAN_fix-blocchi-avvio_v0.1.0.md`
- Sezione: `## Gate di verifica globale (sezione 10 DESIGN)`
- Azione raccomandata: aggiornare l'intestazione rimuovendo il riferimento
  alla sezione 10, che non esiste nel DESIGN 001 attuale dopo il cleanup
  del 2026-05-19. Suggerito: `## Gate di verifica globale`.

**A2 — Offset 2 righe riferimento `isScreenReaderActive` in DESIGN 002 e
TODO 002**
- File: `docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md` §3
  e `docs/4-todo-lists/002-TODO_fix-provider-bootstrap_v0.2.0.md` task N8-3
- Evidenza: codice alle righe 61–63 di `AuthContext.tsx`, non 63–65
- Azione raccomandata: aggiornare i riferimenti da "righe 63–65" a
  "righe 61–63" in entrambi i documenti. Il codice è identificabile
  dal pattern testuale (`typeof document !== 'undefined' && document.querySelector`),
  ma la correttezza documentale è preferibile.

**A3 — Inversione ordine N6/N8/N11 nel titolo frontmatter di DESIGN 002**
- File: `docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md`
  frontmatter campo `titolo`
- Azione raccomandata: aggiornare il titolo da "Gruppo 2 (N6, N8, N11)"
  a "Gruppo 2 (N11, N8, N6)" per allinearlo all'ordine di implementazione
  dichiarato nel corpo del documento e nel PLAN 002.

### Priorità MEDIA (gap documentale che non blocca ma riduce la qualità)

**M1 — Autore e revisore non dichiarati in DESIGN 001 e DESIGN 002**
- File: entrambi i documenti di design
- Azione raccomandata: aggiungere i campi `autore` e `revisore` al
  frontmatter di entrambi i documenti.

**M2 — Nota di perimetro in DESIGN 001 §3 non allineata con il frontmatter**
- File: `docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md` §3
- Azione raccomandata: aggiornare la nota da "la modifica al client Supabase
  non era nel perimetro dichiarato" a "la modifica al client Supabase è
  inclusa nel perimetro come indispensabile per B2", o aggiornare il
  frontmatter con una nota sul perimetro originale vs perimetro esteso.

**M3 — Versione `babel-plugin-module-resolver ^5.0.3` non verificabile
nel DESIGN**
- File: `docs/3-coding-plans/001-PLAN_fix-blocchi-avvio_v0.1.0.md` Fase 1
- Azione raccomandata: [DA VERIFICARE] compatibilità di `babel-plugin-module-resolver
  ^5.0.3` con `@babel/core ^7.25.2` prima dell'implementazione.

**M4 — PLAN 002 marcato READY con precondizione non soddisfatta**
- File: `docs/3-coding-plans/002-PLAN_fix-provider-bootstrap_v0.2.0.md`
  frontmatter `stato: READY`
- Azione raccomandata: valutare se aggiungere una nota nel PLAN che chiarisca
  la semantica di "READY" (piano tecnicamente completo, pronto per esecuzione
  non appena la precondizione sarà soddisfatta) vs "IN ATTESA" (bloccato). Non
  necessariamente un cambio di stato, ma una nota documentale.

**M5 — Gap test: nessun placeholder per DESIGN 001 e 002 (a differenza
di DESIGN 009)**
- File: `__tests__/` (nuovi file da creare)
- Azione raccomandata: creare file placeholder di test per DESIGN 001
  (`__tests__/AuthContextBootstrap.test.tsx`) e DESIGN 002
  (`__tests__/InactivityTimer.test.ts` e `__tests__/ActivityDetectorView.test.tsx`)
  con casi `it.todo` corrispondenti ai contratti dichiarati nei design.
  Seguire il pattern di `ExportService.test.ts`.

---

## REPORT DIAGNOSTICI ACCODATI

Nessuno. Tutti i cicli di revisione hanno superato la validazione entro
il limite di tentativi. Il ciclo di revisione del report ha rilevato
un'omissione iniziale nell'analisi di `src/lib/screen-reader.ts` per
Risk R5, corretta nel punto C2 della lista azioni raccomandate.
