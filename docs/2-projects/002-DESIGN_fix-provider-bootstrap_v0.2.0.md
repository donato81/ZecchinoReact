---
tipo: design
titolo: Fix provider bootstrap — Gruppo 2 (N6, N8, N11)
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
> **Fonte primaria**: tutti i riferimenti a file, righe e descrizioni dei
> problemi provengono da
> [docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md](../1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md).

---

## 1. Grafo delle dipendenze e ordine obbligatorio

I tre problemi non sono indipendenti. L'ordine di implementazione è vincolato:

```
N11 (tsconfig) ──► visibilità statica errori ──► N8 (screen reader DOM)
                                              ──► N6 (inactivity timer DOM)
```

**Perché N11 deve precedere N8 e N6:**

Con `"types": ["node"]` attivo in `tsconfig.json`, TypeScript carica
`@types/node` v25, che ridefinisce `setTimeout`, `clearTimeout` e
fornisce polimorfismi su `global`. Questo maschera errori di portabilità:
codice che usa `window.setTimeout`, `document.addEventListener` e
`window.clearTimeout` non produce errori del type-checker perché il
contesto dei tipi Node tolera queste invocazioni in certi pattern. Rimuovendo
`"types": ["node"]`, il type-checker torna al contratto stretto di
`@react-native/typescript-config` e gli errori DOM in N8 e N6 diventano
visibili staticamente.

**Ordine implementativo consigliato:**

1. **N11** — modifica a `tsconfig.json` (una riga, nessun runtime)
2. **N8** — fix detection screen reader in `AuthContext.tsx`
3. **N6** — riscrittura `use-inactivity-timer.ts` su API native RN

> N8 e N6 atterrano entrambi in `AuthContext.tsx` (N6 tramite il hook
> `useInactivityTimer` che AuthContext monta al bootstrap). **Devono essere
> implementati in commit separati — vincolo obbligatorio.** Unirli in un
> unico commit rende impossibile la bisezione in caso di regressione.
> Vedere sezione 6 per il dettaglio.

---

## 2. N11 — Rimozione `"types": ["node"]` da `tsconfig.json`

### Stato attuale

[tsconfig.json](../../tsconfig.json) contiene:

```json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "types": ["node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Il campo `"types": ["node"]` carica esplicitamente `@types/node`,
che include le definizioni di tutti i moduli e le variabili globali Node.js
(`process`, `Buffer`, `__dirname`, `setTimeout` con firma Node,
`global`, ecc.).

### Causa del problema

In un progetto React Native l'ambiente di esecuzione è Hermes (o V8),
non Node.js. Le API Node.js non sono disponibili a runtime. Includere
`@types/node` ha due effetti negativi:

1. **Falsi negativi del type-checker**: codice che usa `process.env`,
   `window.setTimeout` con firma Node, o `Buffer` non produce errori TS
   anche se queste API non esistono identiche in Hermes.
2. **Maschera i problemi in N8 e N6**: la firma sovrabbondante di
   `setTimeout` di Node (che restituisce `NodeJS.Timeout` invece di
   `number`) silenzia warning sul tipo del ref timer che altrimenti
   segnalerebbero l'uso di API DOM.

### Soluzione

**File: `tsconfig.json`** — rimuovere la voce `"types": ["node"]`:

```json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

`@react-native/typescript-config` già include le definizioni corrette per
l'ambiente React Native. Non è necessario aggiungere tipi supplementari.

### Effetti attesi dopo il fix

- TypeScript segnala tutti gli usi DOM e Node che non funzionano in RN.
- Il tipo di ritorno di `setTimeout` globale torna a `number`
  (come in browser/Hermes), rendendo coerenti i `useRef<number | null>`
  già presenti in `use-inactivity-timer.ts`.
- Nessun impatto a runtime: `tsconfig.json` è usato solo dal type-checker
  e da Metro per la compilazione TS → JS.

### Gate di verifica N11

```bash
npx tsc --noEmit
```

Il comando deve produrre errori TS su `document.addEventListener`,
`window.clearTimeout` e `document.querySelector` — questi sono gli errori
attesi che confermano che N11 ha sbloccato la visibilità di N8 e N6.
Non ci devono essere errori nuovi sui tipi `number` dei timer.

---

## 3. N8 — Detection screen reader DOM-only in `AuthContext.tsx`

### Stato attuale

[src/context/AuthContext.tsx](../../src/context/AuthContext.tsx) righe 63–65:

```ts
const isScreenReaderActive = typeof document !== 'undefined'
  && document.querySelector('[aria-live]') !== null
  && document.documentElement.getAttribute('data-sr-active') === 'true'
```

Questa logica cerca attributi ARIA nel DOM (`[aria-live]`,
`data-sr-active`) per determinare se uno screen reader è attivo.

### Causa del problema

In React Native non esiste il DOM. `document` è `undefined`, quindi
`typeof document !== 'undefined'` restituisce `false` e l'intera
espressione valuta `false`. Il problema è duplice:

1. **`isScreenReaderActive` è sempre `false`**: la detection non funziona
   mai, indipendentemente dallo stato di TalkBack/VoiceOver/Narrator.
2. **Crash potenziale**: se un futuro refactoring rimuovesse la guard
   `typeof document !== 'undefined'` (per es. durante un merge),
   `document.querySelector` lancerebbe `ReferenceError` immediato al mount
   di `AuthProvider`.

L'approccio corretto in React Native è usare `AccessibilityInfo` del core
di React Native, che astrae TalkBack (Android), VoiceOver (iOS) e
Narrator (Windows).

### Soluzione

Sostituire il blocco DOM con la chiamata asincrona nativa. La variabile
`isScreenReaderActive` diventa uno stato React invece di una costante
computata sincrona.

**Architettura della soluzione:**

```
AuthProvider mount
       │
       ▼
AccessibilityInfo.isScreenReaderEnabled()  ──► [Promise<boolean>]
       │
       ▼
setIsScreenReaderActive(result)  ──► isScreenReaderActive: boolean
       │
AccessibilityInfo.addEventListener('screenReaderChanged', handler)
       │
       ▼
cleanup su unmount: subscription.remove()  ← firma moderna RN ≥ 0.65
```

> **Firma da usare (RN 0.82)**: `AccessibilityInfo.addEventListener` restituisce
> un oggetto `{ remove }`. Il cleanup corretto è `subscription.remove()`, non
> `AccessibilityInfo.removeEventListener(...)`. La firma con `removeEventListener`
> è deprecata da RN 0.65 e non deve essere usata in questo progetto.

**File: `src/context/AuthContext.tsx`**

1. Aggiungere `AccessibilityInfo` agli import da `react-native`
2. Aggiungere `useState` per `isScreenReaderActive`
3. Sostituire le righe 63–65 con lo stato iniziale `false`
4. Aggiungere `useEffect` dedicato per la detection asincrona

Nessun altro call site di `isScreenReaderActive` cambia firma o
semantica — il valore resta `boolean`.

### Dipendenza da `useScreenReader` (perimetro escluso)

`AuthContext.tsx` importa già `useScreenReader` da
`@/hooks/use-screen-reader` (riga 12). Quel hook è collegato a
`src/lib/screen-reader.ts` che sarà oggetto di un documento di design
separato (sistema screen reader completo). In questo fix il riferimento
a `useScreenReader` non viene modificato: si agisce solo sulle righe
63–65 che fanno detection DOM diretta, mantenendo l'architettura
del hook intatta.

### Gate di verifica N8

> ⚠️ **Precondizione del gate**: `App.tsx` deve montare `AuthProvider`
> prima di eseguire questa verifica. Se `AuthProvider` non è montato,
> `npm start` non produce errori relativi a N8 e il gate risulta
> falsamente superato. Vedere sezione 5 — Precondizioni da rispettare.

```bash
npx tsc --noEmit
```

Nessun errore sulle righe 63–65 di `src/context/AuthContext.tsx` relativo
a `document.querySelector`, `document.documentElement` o `document is not
defined`. Il tipo di `isScreenReaderActive` deve essere inferito come
`boolean` dal type-checker senza errori di tipo.

```bash
npm start
```

Il montaggio di `AuthProvider` in `App.tsx` non deve produrre
`ReferenceError` su `document.querySelector` o `document is not defined`.
Il log Metro non deve contenere errori relativi alle righe 63–65 di
`AuthContext.tsx`.

---

## 4. N6 — `useInactivityTimer` su eventi DOM browser

### Stato attuale

[src/hooks/use-inactivity-timer.ts](../../src/hooks/use-inactivity-timer.ts)
righe 13–92:

- **Riga 13**: `const ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'touchstart'] as const`
- **Righe 22–29**: `window.clearTimeout(warningTimerRef.current)` e
  `window.clearTimeout(timeoutTimerRef.current)`
- **Righe 42–51**: `window.setTimeout(...)` per scheduling dei timer
- **Righe 72–76**: `document.addEventListener(eventName, handleActivity, { passive: true })`
- **Righe 84–86**: `document.removeEventListener(eventName, handleActivity)`

### Causa del problema

In React Native:

- `document` è `undefined` → `document.addEventListener` lancia
  `ReferenceError` immediatamente nell'`useEffect` al mount.
- `window.clearTimeout` e `window.setTimeout` non sono idiomatici:
  l'equivalente corretto è il `setTimeout` e `clearTimeout` globale
  (disponibile in Hermes senza prefisso `window`).
- Gli eventi DOM (`click`, `keydown`, `scroll`) non esistono: l'interazione
  utente in RN si gestisce con componenti `Touchable*`, `Pressable`, e
  tramite `onPress` / handler di gestori nativi.

**Effetto concreto**: `AuthProvider` monta `useInactivityTimer` alla riga
89 di `AuthContext.tsx`, quindi il crash avviene immediatamente al primo
render dell'albero.

### Architettura della soluzione

Il rilevamento attività non può più essere un listener globale imperativo
(`document.addEventListener`). In React Native il punto naturale di
intercettazione è il livello del componente: un wrapper che avvolge i figli
con un `View` che intercetta i tocchi e gli eventi da tastiera tramite
`onStartShouldSetResponder` e `onKeyDown`.

#### Decisione architetturale: dove inserire il wrapper

Due opzioni valutate:

**Opzione A — Wrapper che avvolge tutta l'app in `App.tsx`**

```
App.tsx
  └─ <InactivityWrapper>
       └─ <AuthProvider>
            └─ <AppDataProvider>
                 └─ ...
```

**Opzione B — Wrapper che avvolge solo la parte autenticata**

```
AuthProvider (gestisce la logica del timer)
  └─ se isAuthenticated:
       └─ <InactivityWrapper onActivity={resetTimer}>
            └─ {children}
       altrimenti:
            └─ {children}
```

**Decisione: Opzione B — wrapper solo sulla parte autenticata**

Motivazione:

1. **Semantica corretta**: il timer di inattività ha senso solo quando
   l'utente è autenticato. Avvolgere l'intera app (inclusa la schermata
   di login) costringerebbe il wrapper a essere sempre attivo, richiedendo
   ulteriori guard per i casi non-autenticati.
2. **Posizionamento della logica**: `AuthProvider` già conosce
   `isAuthenticated` e gestisce `signOut`. Il wrapper deve essere figlio
   di `AuthProvider` per accedere al context, oppure la logica timer
   rimane nel hook e il wrapper viene reso condizionalmente da un
   componente intermedio che usa `useAuth()`.
3. **Surface di intercettazione appropriata**: intercettare solo l'albero
   autenticato significa che l'utente nella schermata di login non accumula
   attività inutile nel timer.
4. **Manutenibilità**: isolare il wrapper alla sessione autenticata rende
   più semplice rimuoverlo o sostituirlo in futuro senza toccare `App.tsx`.

**Struttura del componente wrapper** (implementazione definitiva — vedi sotto):

> ⚠️ **Nota di perimetro**: `src/components/ActivityDetectorView.tsx` non era
> incluso nel perimetro dichiarato, ma questo componente è **indispensabile**
> perché N6 abbia effetto. Agent-Plan deve includerlo come file da CREATE nello
> stesso commit di N6.

**Implementazione scelta: `View` con `onStartShouldSetResponder`**

Il wrapper usa un `View` con `onStartShouldSetResponder` che restituisce
`false`: rileva il tocco, chiama `scheduleTimers`, e restituisce `false`
per non consumare il responder chain — lasciando che l'evento si propaghi
ai figli normalmente.

Questa scelta è preferita a `Pressable` perché `Pressable` introduce
feedback visivo implicito (effetti di pressione) che richiederebbe
override di stile per essere neutralizzato, aggiungendo complessità UI
non pertinente a questa fase. `TouchableWithoutFeedback` è deprecato
nelle versioni recenti di React Native e non deve essere usato.

**Interfaccia pubblica del componente:**

```ts
interface ActivityDetectorViewProps {
  onActivity: () => void
  children: React.ReactNode
}
```

Il chiamante (`AuthContext.tsx`) passa `scheduleTimers` come prop
`onActivity`. Il componente non consuma direttamente nessun context
e non importa nessun hook: tutta la logica del timer rimane in
`use-inactivity-timer.ts`. Questo mantiene il componente riutilizzabile
e il coupling al minimo.

#### Requisito accessibilità: Narrator (Windows) e navigazione da tastiera

**Il problema**: su Windows con Narrator attivo, l'utente naviga con la
tastiera (Tab, frecce, Invio, Spazio). Se il sistema di inattività rileva
solo i tocchi e non la navigazione da tastiera, l'utente che sta leggendo
con Narrator viene disconnesso mentre il tocco è assente.

**Soluzione architetturale**: il wrapper deve anche intercettare gli eventi
da tastiera come attività valida. In React Native Windows, il componente
`View` supporta `onKeyDown` e `onKeyUp`. Qualsiasi pressione di tasto
nativo (inclusi Tab, frecce cursore, Invio) deve resettare il timer.

**Implementazione:**

```
ActivityDetectorView
  ├─ onStartShouldSetResponder: () => false  (non consuma il tocco)
  ├─ onMoveShouldSetResponder: () => false
  ├─ onResponderGrant: scheduleTimers         (tocco rilevato)
  ├─ onKeyDown: scheduleTimers                (RN Windows: Narrator navigation)
  └─ style: { flex: 1 }
```

> **Nota**: `onKeyDown` è disponibile nel core di `react-native-windows`
> ma non è nella specifica standard di React Native (iOS/Android).
> Agent-Code deve verificare la disponibilità al momento
> dell'implementazione e aggiungere la guard di piattaforma appropriata
> con `Platform.OS === 'windows'`.

#### Conversione dei timer

`window.setTimeout` e `window.clearTimeout` vanno sostituiti con le
chiamate globali `setTimeout` e `clearTimeout`, disponibili in Hermes
senza prefisso. I ref tipati rimangono `useRef<number | null>`: come
dichiarato nella sezione 2, dopo la rimozione di `"types": ["node"]`
il tipo di ritorno di `setTimeout` globale in questo progetto è `number`,
coerente con i ref già presenti in `use-inactivity-timer.ts`. Nessuna
modifica ai tipi dei ref è necessaria.

### Interfaccia pubblica del hook

L'interfaccia `UseInactivityTimerResult` rimane invariata:
- `resetTimer: () => void`
- `showWarning: boolean`

Il chiamante (`AuthContext.tsx`) non cambia. Cambia l'implementazione
interna del hook e viene introdotto il componente wrapper.

### Gate di verifica N6

**Gate N6:**

```bash
npx tsc --noEmit
```

Nessun errore su `document.addEventListener`, `window.clearTimeout`,
`window.setTimeout` in `src/hooks/use-inactivity-timer.ts`.

```bash
npm start
```

Il montaggio di `AuthProvider` in `App.tsx` non deve produrre
`ReferenceError` su `document` o `window`. Il log Metro non deve
contenere errori relativi a `use-inactivity-timer.ts`.

**Verifica funzionale** (manuale): dopo `timeoutMinutes` minuti di
inattività il timer scatta e `showWarning` diventa `true`. Su Windows
con Narrator attivo, la navigazione da tastiera resetta il timer —
verificabile aggiungendo temporaneamente un `console.log` nel callback
`scheduleTimers`.

---

## 5. Rischi e dipendenze

| # | Rischio | Probabilità | Impatto | Mitigazione |
|---|---------|-------------|---------|-------------|
| R1 | `onKeyDown` non disponibile sulla versione RN Windows del progetto | Media | Basso | Guard `Platform.OS === 'windows'`; timer keyboard-blind su Android/iOS è accettabile |
| R2 | Il wrapper `View` consuma eventi touch impedendo l'interazione sui figli | Media | Alta | Già mitigato: il documento prescrive `onStartShouldSetResponder` con `return false` come scelta definitiva. `Pressable` e `TouchableWithoutFeedback` sono esclusi. |
| R3 | `AccessibilityInfo.addEventListener` deprecato in versioni RN recenti | Bassa | Media | Già mitigato: il documento prescrive esplicitamente la firma `subscription.remove()` coerente con RN 0.82 |
| R4 | N8 e N6 in un unico commit producono regressioni difficili da bisecare | Bassa | Media | Già mitigato: la sezione 6 impone commit separati come vincolo obbligatorio, non come raccomandazione |
| R5 | `useScreenReader` hook (escluso dal perimetro) produce crash prima che N8 sia fixato | Bassa | Alta | Il hook è già importato ma il suo comportamento attuale è passivo; verificare prima dell'integrazione completa |

### Dipendenze da design futuri

- **Sistema screen reader completo** (`screen-reader.ts`, `use-talkback.ts`,
  `use-screen-reader.ts`): affrontato in un documento separato. Il fix
  N8 in questo documento è chirurgico e non anticipa né blocca quel
  documento.
- **Sistema haptic e audio** (N1, N2): indipendenti da questo gruppo.
- **`AppDataContext` cache asincrona** (N9): indipendente, può essere
  parallelizzato con il Gruppo 2.

### Precondizioni da rispettare

- Il Gruppo 1 deve essere completamente implementato e verificato prima
  di iniziare questo gruppo.
- `npm install` deve essere eseguito e completato senza errori.
- `App.tsx` deve montare `AuthProvider` — questa è la condizione che
  espone i crash N8 e N6 durante i test di avvio.

---

## 6. Note per Agent-Plan

- N11 è un singolo commit atomico su `tsconfig.json`. Nessuna dipendenza.
- N8 è un fix chirurgico di poche righe in `AuthContext.tsx`. **Commit separato da N6 — vincolo obbligatorio, non raccomandazione.** Unire N8 e N6 in un unico commit rende impossibile la bisezione in caso di regressione.
- N6 richiede: riscrittura del corpo di `use-inactivity-timer.ts` +
  creazione del file `src/components/ActivityDetectorView.tsx` (CREATE —
  come dichiarato nel perimetro del frontmatter) + eventuale gestione
  `Platform.OS` per Windows. È il task più esteso del gruppo.
- Il wrapper di N6 non è una nuova schermata né un componente UI: è
  trasparente per l'utente e non modifica l'aspetto visivo dell'app.
