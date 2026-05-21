---
tipo: design
titolo: Fix provider bootstrap — Gruppo 2 (N11, N8, N6)
versione: 0.2.0
data: 2026-05-14
stato: REVIEWED
sorgente: docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md
perimetro: tsconfig.json, src/context/AuthContext.tsx, src/hooks/use-inactivity-timer.ts, src/components/ActivityDetectorView.tsx (CREATE — fuori perimetro originale, indispensabile per N6)
---

# DESIGN — Fix provider bootstrap (v0.2.0)

> **Scope**: rendere `AuthProvider` montabile senza crash in React Native.
> Nessuna UI definitiva, nessun sistema di accessibilità completo, nessuna
> schermata. Solo i tre fix minimi che trasformano N11, N8 e N6 da problemi
> latenti a problemi risolti.
>
> **Precondizione**: questo documento presuppone che il Gruppo 1
> ([001-DESIGN_fix-blocchi-avvio_v0.1.0.md](001-DESIGN_fix-blocchi-avvio_v0.1.0.md))
> sia stato completamente implementato. Bundle Metro deve funzionare,
> dipendenze installate, alias `@/*` risolto.
>
> **Fonte primaria**: tutti i riferimenti a file e descrizioni dei problemi
> provengono da
> [docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md](../1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md).

---

## 1. Grafo delle dipendenze e ordine obbligatorio

I tre problemi non sono indipendenti. L'ordine di implementazione è vincolato:

N11 (tsconfig) → visibilità statica degli errori → N8 (screen reader DOM) e N6 (inactivity timer DOM)

**Perché N11 deve precedere N8 e N6:**

Con `"types": ["node"]` attivo in `tsconfig.json`, TypeScript carica le
definizioni di tipo di Node.js che ridefiniscono `setTimeout`,
`clearTimeout` e mascherano gli usi di API DOM (`window`, `document`).
Questo fa sì che codice non portabile in React Native non produca errori
del type-checker. Rimuovendo quella direttiva, il type-checker torna al
contratto stretto dell'ambiente React Native e gli errori DOM in N8 e N6
diventano visibili staticamente.

**Ordine implementativo consigliato:**

1. **N11** — modifica a `tsconfig.json` (nessun impatto a runtime)
2. **N8** — fix detection screen reader in `AuthContext.tsx`
3. **N6** — riscrittura del timer di inattività su API native React Native

N8 e N6 atterrano entrambi in `AuthContext.tsx` tramite i rispettivi
hook. **Devono essere implementati in commit separati — vincolo
obbligatorio.** Unirli in un unico commit renderebbe impossibile la
bisezione in caso di regressione.

---

## 2. N11 — Rimozione `"types": ["node"]` da `tsconfig.json`

### Stato attuale

Il file `tsconfig.json` include esplicitamente le definizioni di tipo di
Node.js, che aggiunge all'ambiente di tipo del progetto tutte le API e
le variabili globali Node.js (`process`, `Buffer`, `__dirname`,
`setTimeout` con firma Node, `global`, ecc.).

### Causa del problema

In un progetto React Native l'ambiente di esecuzione è Hermes (o V8),
non Node.js. Le API Node.js non sono disponibili a runtime. Includere le
definizioni di tipo Node ha due effetti negativi:

1. **Falsi negativi del type-checker**: codice che usa API non disponibili
   in Hermes non produce errori TypeScript, creando una falsa sicurezza.
2. **Maschera i problemi N8 e N6**: le firme di `setTimeout` di Node
   silenziamo warning che altrimenti segnalerebbero l'uso di API DOM
   incompatibili con React Native.

### Soluzione

Rimuovere la direttiva `"types": ["node"]` da `tsconfig.json`. La
configurazione base `@react-native/typescript-config` già include le
definizioni corrette per l'ambiente React Native; non è necessario
aggiungere tipi supplementari.

### Effetti attesi dopo il fix

- TypeScript segnala tutti gli usi di API DOM e Node non disponibili in
  React Native.
- Il tipo di ritorno di `setTimeout` globale torna a `number` (come in
  browser/Hermes), rendendo coerenti i ref timer già presenti nel hook
  di inattività.
- Nessun impatto a runtime: `tsconfig.json` è usato solo dal
  type-checker.

---

## 3. N8 — Detection screen reader DOM-only in `AuthContext.tsx`

### Stato attuale

`AuthContext.tsx` determina se uno screen reader è attivo cercando
attributi ARIA nel DOM del browser. In React Native il DOM non esiste:
la logica restituisce sempre `false`, rendendo la detection dello screen
reader costantemente non funzionante.

### Causa del problema

La detection usa `document.querySelector` e attributi ARIA del DOM, che
non esistono in React Native. Oltre all'assenza di funzionalità, esiste
un rischio strutturale: se la guard di sicurezza venisse rimossa in un
futuro refactoring, la chiamata a `document.querySelector` causerebbe un
`ReferenceError` immediato al mount di `AuthProvider`.

L'approccio corretto in React Native è utilizzare `AccessibilityInfo`,
l'API nativa del framework che astrae TalkBack (Android), VoiceOver
(iOS) e Narrator (Windows).

### Soluzione

Sostituire la detection DOM con una chiamata asincrona a
`AccessibilityInfo`. La variabile `isScreenReaderActive` diventa uno
stato React aggiornato al mount del provider e mantenuto sincronizzato
tramite un listener sul cambio di stato dello screen reader. Il cleanup
del listener avviene all'unmount. La firma pubblica della variabile
(booleana) rimane invariata: nessun call site esterno cambia.

La detection è separata e non interferisce con il hook `useScreenReader`
già importato in `AuthContext.tsx`, che sarà oggetto di un documento di
design dedicato al sistema screen reader completo.

---

## 4. N6 — `useInactivityTimer` su eventi DOM browser

### Stato attuale

Il hook `use-inactivity-timer.ts` usa `document.addEventListener` per
intercettare gli eventi utente (click, keydown, scroll, touchstart) e
`window.setTimeout` / `window.clearTimeout` per la gestione dei timer.
In React Native `document` è `undefined` e la chiamata a
`document.addEventListener` causa un `ReferenceError` immediato
nell'`useEffect` al mount.

**Effetto concreto**: `AuthProvider` monta `useInactivityTimer` al
bootstrap, quindi il crash avviene al primo render dell'albero React.

### Causa del problema

Gli eventi DOM (click, keydown, scroll) non esistono in React Native.
L'interazione utente si gestisce attraverso i sistemi nativi di gesture.
Anche `window.setTimeout` e `window.clearTimeout` non sono idiomatici:
l'equivalente corretto in Hermes è il `setTimeout` e `clearTimeout`
globale, disponibile senza prefisso.

### Architettura della soluzione

Il rilevamento dell'attività utente non può più essere un listener
globale imperativo. In React Native il punto naturale di intercettazione
è il livello del componente: un wrapper che avvolge i figli e intercetta
i tocchi e gli eventi da tastiera.

#### Decisione architetturale: dove inserire il wrapper

Due opzioni valutate:

**Opzione A — Wrapper che avvolge tutta l'app**

Il componente wrapper viene inserito al livello più alto dell'albero
React, sopra `AuthProvider` e tutti gli altri provider, attivo per
l'intera vita dell'applicazione.

**Opzione B — Wrapper che avvolge solo la parte autenticata**

Il wrapper viene reso condizionalmente all'interno di `AuthProvider`,
attivo solo quando l'utente è autenticato.

**Decisione: Opzione B — wrapper solo sulla parte autenticata**

Motivazione:

1. **Semantica corretta**: il timer di inattività ha senso solo quando
   l'utente è autenticato. Avvolgere l'intera app richiederebbe guard
   aggiuntive per i casi non-autenticati.
2. **Posizionamento della logica**: `AuthProvider` già conosce lo stato
   di autenticazione e gestisce il `signOut`. La logica del timer
   appartiene naturalmente a questo contesto.
3. **Surface di intercettazione appropriata**: intercettare solo l'albero
   autenticato evita di accumulare attività inutile durante la schermata
   di login.
4. **Manutenibilità**: isolare il wrapper alla sessione autenticata
   semplifica la sua futura rimozione o sostituzione senza modificare
   `App.tsx`.

#### Requisito accessibilità: Narrator (Windows) e navigazione da tastiera

Su Windows con Narrator attivo, l'utente naviga con la tastiera (Tab,
frecce, Invio, Spazio). Se il sistema di inattività rileva solo i tocchi
e non la navigazione da tastiera, l'utente viene disconnesso mentre è
impegnato nella lettura.

**Soluzione architetturale**: il wrapper deve intercettare anche gli
eventi da tastiera come attività valida. In React Native Windows, il
componente `View` supporta gli eventi da tastiera nativi. Qualsiasi
pressione di tasto — inclusi Tab, frecce cursore e Invio — deve
resettare il timer.

La disponibilità degli eventi da tastiera varia per piattaforma: è
necessaria una guard che applichi questa logica solo su Windows,
mantenendo il comportamento attuale su Android e iOS.

#### Implementazione del wrapper

Il wrapper usa un `View` configurato per rilevare i tocchi senza
consumarli: rileva il tocco, notifica il timer, e lascia che l'evento si
propaghi ai componenti figli normalmente.

Questa scelta è preferita a `Pressable` (che introduce feedback visivo
implicito non pertinente a questa fase) e a `TouchableWithoutFeedback`
(deprecato nelle versioni recenti di React Native).

L'interfaccia pubblica del componente wrapper espone un solo prop di
callback (`onActivity`) che il chiamante usa per passare la funzione di
reset del timer. Il wrapper non consuma direttamente nessun context e
non importa nessun hook: tutta la logica del timer rimane nel hook.
Questo mantiene il componente riutilizzabile e il coupling al minimo.

> **Nota di perimetro**: il componente `ActivityDetectorView` non era
> nel perimetro dichiarato, ma è indispensabile perché N6 abbia effetto.

#### Conversione dei timer

`window.setTimeout` e `window.clearTimeout` vanno sostituiti con le
chiamate globali equivalenti disponibili in Hermes senza prefisso. I
tipi dei ref rimangono invariati: dopo la rimozione di N11, il tipo di
ritorno di `setTimeout` globale in questo progetto è `number`,
coerente con i ref già presenti nel hook.

### Interfaccia pubblica del hook

L'interfaccia pubblica di `useInactivityTimer` rimane invariata:
`resetTimer` e `showWarning`. Il chiamante (`AuthContext.tsx`) non
cambia. Cambiano l'implementazione interna del hook e viene introdotto
il componente wrapper.

---

## 5. Rischi e dipendenze

| # | Rischio | Probabilità | Impatto | Mitigazione |
|---|---------|-------------|---------|-------------|
| R1 | Gli eventi da tastiera non sono disponibili sulla versione RN Windows del progetto | Media | Basso | Il wrapper applica la logica keyboard solo su Windows; il timer rimane attivo anche senza keyboard detection su Android e iOS |
| R2 | Il wrapper intercetta e consuma eventi touch impedendo l'interazione sui figli | Media | Alta | Già mitigato dalla scelta del design: il wrapper rileva il tocco senza consumarlo, escludendo le alternative che introducono feedback visivo o sono deprecate |
| R3 | L'API di ascolto dello screen reader è deprecata nelle versioni recenti di React Native | Bassa | Media | Già mitigato: il design prescrive la firma moderna compatibile con RN 0.82 |
| R4 | N8 e N6 in un unico commit producono regressioni difficili da bisecare | Bassa | Media | Già mitigato: commit separati sono un vincolo obbligatorio, non una raccomandazione |
| R5 | Il hook `useScreenReader` (escluso dal perimetro) produce crash prima che N8 sia completato | Bassa | Alta | Il hook è già importato ma ha comportamento passivo attuale; verificare prima dell'integrazione completa |

### Dipendenze da design futuri

- **Sistema screen reader completo** (`screen-reader.ts`, hook di
  accessibilità): affrontato in un documento separato. Il fix N8 in
  questo documento è chirurgico e non anticipa né blocca quel documento.
- **Sistema haptic e audio** (N1, N2): indipendente da questo gruppo,
  può essere parallelizzato.
- **`AppDataContext` cache asincrona** (N9): indipendente, può essere
  parallelizzato con il Gruppo 2.

### Precondizioni da rispettare

- Il Gruppo 1 deve essere completamente implementato e verificato prima
  di iniziare questo gruppo.
- `npm install` deve essere completato senza errori.
- `App.tsx` deve montare `AuthProvider` prima di eseguire le verifiche
  N8 e N6, altrimenti i crash dovuti alle API DOM non emergono.