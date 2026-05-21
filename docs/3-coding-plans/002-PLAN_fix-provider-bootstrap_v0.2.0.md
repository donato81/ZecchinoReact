---
tipo: coding-plan
titolo: Fix provider bootstrap — Gruppo 2 (N11, N8, N6)
versione: 0.2.0
data: 2026-05-14
stato: READY
sorgente: docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md
branch-suggerito: fix/provider-bootstrap-n11-n8-n6
---

# PLAN — Fix provider bootstrap (v0.2.0)

> **Fonte di verità**: ogni decisione tecnica di questo piano è derivata
> direttamente da
> [docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md](../2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md).
> In caso di discrepanza, il documento di design prevale.

---

## Executive Summary

| Campo | Valore |
|-------|--------|
| Tipo di intervento | Fix API React Native: tsconfig, screen reader detection, inactivity timer |
| Priorità | **CRITICA** — sblocca il montaggio di `AuthProvider` senza crash |
| Versione target | 0.2.0 |
| UI introdotta | Nessuna |
| Componenti definitivi | Nessuno (`ActivityDetectorView` è infrastrutturale e trasparente) |
| Numero di commit | 3 (ordine vincolante: N11 → N8 → N6) |
| File modificati | 3 (MODIFY) + 1 (CREATE) = 4 totali |

`AuthProvider` monta `useInactivityTimer` al bootstrap. Il hook usa
`document.addEventListener`, che causa `ReferenceError` immediato in RN.
Parallelamente, la detection dello screen reader (righe 63–65 di
`AuthContext.tsx`) usa API DOM che non esistono in RN. `tsconfig.json`
con `"types": ["node"]` maschera entrambi i problemi al type-checker.

Questo piano risolve i tre problemi in tre commit sequenziali e atomici.
Al termine, `AuthProvider` è montabile in `App.tsx` senza crash.

**Vincolo assoluto**: N8 e N6 devono essere implementati in commit
separati. Unirli in un unico commit rende impossibile la bisezione in
caso di regressione.

**Precondizione**: il Gruppo 1 (B1–B6) deve essere completamente
implementato prima di iniziare questo gruppo.

---

## File coinvolti

| File | Operazione | Problema/i |
|------|-----------|------------|
| `tsconfig.json` | MODIFY — rimuovere `"types": ["node"]` | N11 |
| `src/context/AuthContext.tsx` | MODIFY — sostituire detection screen reader DOM con `AccessibilityInfo`; integrazione wrapper | N8, N6 |
| `src/hooks/use-inactivity-timer.ts` | MODIFY — rimuovere `window.setTimeout`, `window.clearTimeout`, `document.addEventListener/removeEventListener` | N6 |
| `src/components/ActivityDetectorView.tsx` | CREATE — wrapper `View` che intercetta tocchi e tastiera per il timer inattività | N6 |

---

## Grafo delle dipendenze (da design §1)

```
N11 (tsconfig) ──► visibilità statica errori ──► N8 (screen reader DOM)
                                              ──► N6 (inactivity timer DOM)
```

Con `"types": ["node"]` attivo, `@types/node` maschera gli errori DOM.
La rimozione di N11 è il prerequisito che rende staticamente visibili N8 e N6.
N8 e N6 possono essere fixati solo dopo N11, e **devono** atterrare in commit separati.

---

## Rischi (da design §5)

| # | Rischio | Probabilità | Impatto | Mitigazione |
|---|---------|-------------|---------|-------------|
| R1 | `onKeyDown` non disponibile sulla versione RN Windows del progetto | Media | Basso | Guard `Platform.OS === 'windows'`; timer keyboard-blind su Android/iOS è accettabile |
| R2 | Il wrapper `View` consuma eventi touch impedendo l'interazione sui figli | Media | Alta | Già mitigato: il design prescrive `onStartShouldSetResponder` con `return false`. `Pressable` e `TouchableWithoutFeedback` sono esclusi. |
| R3 | `AccessibilityInfo.addEventListener` deprecato in versioni RN recenti | Bassa | Media | Già mitigato: il design prescrive la firma `subscription.remove()` coerente con RN 0.82 |
| R4 | N8 e N6 in un unico commit producono regressioni difficili da bisecare | Bassa | Media | Già mitigato: questo piano impone commit separati come vincolo obbligatorio |
| R5 | `useScreenReader` hook (escluso dal perimetro) produce crash prima che N8 sia fixato | Bassa | Alta | Il hook è già importato ma il suo comportamento attuale è passivo; verificare prima dell'integrazione completa |

---

## Precondizioni da verificare prima di iniziare

1. **Gruppo 1 completato**: tutti i gate B1–B6 devono essere stati superati.
   `npm start` avvia Metro senza errori di risoluzione moduli.
2. **`npm install` eseguito**: `node_modules` deve essere completo e coerente.
   Nessun `ETARGET` nell'output di `npm install`.
3. **`App.tsx` deve montare `AuthProvider`**: prima di eseguire i gate N8 e N6,
   `AuthProvider` deve essere aggiunto all'albero React in `App.tsx`.
   Senza di esso, i crash dovuti a `document.addEventListener` e
   `document.querySelector` non emergono e i gate risultano falsamente superati.

---

## Commit 1 — N11: rimozione `"types": ["node"]`

**Suggerimento commit**: `fix(config): rimuovi types node da tsconfig (N11)`

### File toccati

1. `tsconfig.json` (MODIFY)

### Modifiche

#### `tsconfig.json` — stato finale atteso

Rimuovere la voce `"types": ["node"]` da `compilerOptions`.
Il file risultante deve essere:

```json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/node_modules", "**/Pods"]
}
```

L'intera riga `"types": ["node"]` va eliminata. Nessuna altra modifica.
Dopo la rimozione, verificare che la struttura sia esatta: `compilerOptions`
deve contenere solo `baseUrl` e `paths`; alla radice del file devono comparire
solo `extends`, `include` ed `exclude`. Nessun altro campo a nessun livello.

### Gate di verifica — Commit 1

> **Se un gate fallisce:** tenta di correggerti autonomamente solo se
> l'errore riguarda `tsconfig.json`. Se l'errore riguarda un file fuori
> perimetro, fermati, riporta il testo esatto dell'errore e attendi
> istruzioni.

```bash
npx tsc --noEmit
```

**Output atteso**: il comando deve produrre errori TS su
`document.addEventListener`, `window.clearTimeout`, `window.setTimeout` e
`document.querySelector` — questi sono gli errori **attesi e corretti**
che confermano che N11 ha sbloccato la visibilità di N8 e N6.
Non ci devono essere errori **nuovi** sui tipi `number` dei timer.

**Condizione di blocco**: se il comando non produce errori su `document`
o `window`, N11 non ha avuto effetto. Non procedere al Commit 2.

---

## Commit 2 — N8: detection screen reader nativa

**Suggerimento commit**: `fix(context): sostituisci detection SR DOM con AccessibilityInfo (N8)`

### File toccati

1. `src/context/AuthContext.tsx` (MODIFY)

### Modifiche

#### `src/context/AuthContext.tsx` — delta atteso

**Step 1** — Aggiungere `AccessibilityInfo` all'import da `react-native`.
La riga di import esistente andrà integrata o ne va aggiunta una nuova:

```ts
import { AccessibilityInfo } from 'react-native'
```

**Step 2** — Aggiungere lo stato per `isScreenReaderActive`.
Aggiungere insieme agli altri `useState` esistenti in `AuthProvider`:

```ts
const [isScreenReaderActive, setIsScreenReaderActive] = useState(false)
```

**Step 3** — Rimuovere le righe 63–65.

```ts
// DA RIMUOVERE (righe 64–66):
const isScreenReaderActive = typeof document !== 'undefined'
  && document.querySelector('[aria-live]') !== null
  && document.documentElement.getAttribute('data-sr-active') === 'true'
```

La variabile non è più una costante computata sincrona: il valore è
fornito dallo stato dichiarato nel Step 2.

**Step 4** — Aggiungere `useEffect` dedicato per la detection asincrona.
Aggiungere un `useEffect` separato dagli altri presenti:

```ts
useEffect(() => {
  void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
    setIsScreenReaderActive(enabled)
  })
  const subscription = AccessibilityInfo.addEventListener(
    'screenReaderChanged',
    (enabled) => {
      setIsScreenReaderActive(enabled)
    },
  )
  return () => {
    subscription.remove()
  }
}, [])
```

> **Nota firma**: `subscription.remove()` è la firma corretta per
> RN ≥ 0.65 (RN 0.82 in questo progetto). Non usare
> `AccessibilityInfo.removeEventListener`.

Nessun altro call site di `isScreenReaderActive` cambia firma o semantica.
Il valore resta `boolean`. L'hook `useScreenReader` (riga 12) non va toccato.

### Gate di verifica — Commit 2

> **Se un gate fallisce:** tenta di correggerti autonomamente solo se
> l'errore riguarda `src/context/AuthContext.tsx`. Se l'errore riguarda
> un file fuori perimetro, fermati, riporta il testo esatto dell'errore
> e attendi istruzioni.

> ⚠️ **Precondizione del gate**: `App.tsx` deve montare `AuthProvider`
> prima di eseguire questa verifica. Se `AuthProvider` non è montato,
> `npm start` non produce errori relativi a N8 e il gate risulta
> falsamente superato.

```bash
npx tsc --noEmit
```

Nessun errore sulle righe 63–65 di `src/context/AuthContext.tsx` relativo
a `document.querySelector`, `document.documentElement` o
`document is not defined`. Il tipo di `isScreenReaderActive` deve essere
inferito come `boolean` dal type-checker senza errori di tipo.

```bash
npm start
```

Il montaggio di `AuthProvider` in `App.tsx` non deve produrre
`ReferenceError` su `document.querySelector` o `document is not defined`.
Il log Metro non deve contenere errori relativi alle righe 63–65 di
`AuthContext.tsx`.

**Condizione di blocco**: se `npm start` produce ancora `ReferenceError`
su `document` originato da `AuthContext.tsx` righe 63–65, il gate N8 ha
fallito. Non procedere al Commit 3.

---

## Commit 3 — N6: riscrittura inactivity timer su API native RN

**Suggerimento commit**: `fix(hooks): riscrivi useInactivityTimer su API RN native (N6)`

### File toccati

1. `src/hooks/use-inactivity-timer.ts` (MODIFY)
2. `src/components/ActivityDetectorView.tsx` (CREATE)
3. `src/context/AuthContext.tsx` (MODIFY — integrazione wrapper, Opzione B)

### Modifiche

#### `src/hooks/use-inactivity-timer.ts` — delta atteso

**Step 1** — Rimuovere la costante `ACTIVITY_EVENTS` (riga 13):

```ts
// DA RIMUOVERE:
const ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'touchstart'] as const
```

Questo array non viene più usato dopo la rimozione dei listener DOM.

**Step 2** — Sostituire `window.clearTimeout` con `clearTimeout` globale
(righe 22–29). Ogni occorrenza di `window.clearTimeout(...)` diventa
`clearTimeout(...)`. I ref `warningTimerRef` e `timeoutTimerRef`
rimangono tipati `useRef<number | null>` — il tipo **non cambia**
(dopo la rimozione di `"types": ["node"]`, `setTimeout` globale
restituisce `number` in questo progetto, coerente con i ref esistenti).

**Step 3** — Sostituire `window.setTimeout` con `setTimeout` globale
(righe 42–51). Ogni occorrenza di `window.setTimeout(...)` diventa
`setTimeout(...)`.

**Step 4** — Rimuovere il blocco `document.addEventListener` e
`document.removeEventListener` dall'`useEffect` (righe 72–86):

```ts
// DA RIMUOVERE dal corpo dell'useEffect:
const handleActivity = () => {
  scheduleTimers()
}
ACTIVITY_EVENTS.forEach((eventName) => {
  document.addEventListener(eventName, handleActivity, { passive: true })
})

return () => {
  clearTimers()
  ACTIVITY_EVENTS.forEach((eventName) => {
    document.removeEventListener(eventName, handleActivity)
  })
}
```

Il rilevamento attività è ora delegato interamente ad
`ActivityDetectorView` tramite la prop `onActivity`. Il cleanup
dell'`useEffect` rimane, ma non contiene più listener DOM.

L'interfaccia pubblica del hook rimane invariata:
- `resetTimer: () => void`
- `showWarning: boolean`

Il chiamante (`AuthContext.tsx`) non cambia l'importazione né l'uso
del hook.

#### `src/components/ActivityDetectorView.tsx` — contenuto completo (CREATE)

Questo file non esiste. Deve essere creato con il seguente contenuto:

```ts
import React from 'react'
import { Platform, StyleSheet, View } from 'react-native'

interface ActivityDetectorViewProps {
  onActivity: () => void
  children: React.ReactNode
}

export function ActivityDetectorView({
  onActivity,
  children,
}: ActivityDetectorViewProps) {
  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => {
        onActivity()
        return false
      }}
      onMoveShouldSetResponder={() => false}
      {...(Platform.OS === 'windows' ? { onKeyDown: onActivity } : {})}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
```

**Note implementative**:
- `onStartShouldSetResponder` restituisce `false`: rileva il tocco,
  chiama `onActivity`, ma non consuma il responder chain — l'evento si
  propaga ai figli normalmente.
- `onMoveShouldSetResponder` restituisce `false`: coerente con la scelta
  di non consumare il responder chain.
- `onResponderGrant` è assente: poiché `onStartShouldSetResponder`
  restituisce `false`, il componente non acquisisce il responder attivo
  e `onResponderGrant` non verrebbe mai invocato. La detection del tocco
  è già completa in `onStartShouldSetResponder`.
- `onKeyDown` è wrappato nella guard `Platform.OS === 'windows'`:
  disponibile solo su RN Windows (Narrator), invisibile su Android e iOS.
- Il componente non importa hook e non consuma context: è riutilizzabile
  e a coupling minimo.

#### Integrazione in `AuthContext.tsx` — Opzione B (design §4)

Il wrapper avvolge **solo** la parte autenticata. Nel render del provider
aggiungere import e wrapper condizionale:

```tsx
// Aggiungere all'import section:
import { ActivityDetectorView } from '@/components/ActivityDetectorView'

// Nel render del provider — struttura target:
return (
  <AuthContext.Provider value={contextValue}>
    {isAuthenticated ? (
      <ActivityDetectorView onActivity={resetTimer}>
        {children}
      </ActivityDetectorView>
    ) : (
      children
    )}
  </AuthContext.Provider>
)
```

> **Nota**: `resetTimer` è già esposto da `useInactivityTimer` ed è
> già presente in `AuthContext.tsx`. Nessuna modifica all'interfaccia
> del hook è necessaria.

### Gate di verifica — Commit 3

> **Se un gate fallisce:** tenta di correggerti autonomamente solo se
> l'errore riguarda i file nel perimetro di questo commit
> (`use-inactivity-timer.ts`, `ActivityDetectorView.tsx`, integrazione
> in `AuthContext.tsx`). Se l'errore riguarda un file fuori perimetro,
> fermati, riporta il testo esatto dell'errore e attendi istruzioni.

```bash
npx tsc --noEmit
```

Nessun errore su `document.addEventListener`, `window.clearTimeout`,
`window.setTimeout` in `src/hooks/use-inactivity-timer.ts`.
Nessun errore di tipo su `src/context/AuthContext.tsx` relativo
all'import di `ActivityDetectorView` o all'uso di `isAuthenticated`
come condizione del wrapper.

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

**Condizione di blocco**: se `npm start` produce ancora `ReferenceError`
su `document` o `window`, il gate N6 ha fallito. Non procedere.

---

## Gate di verifica globale

*Eseguire in sequenza dopo il completamento dei tre commit:*

- `npx tsc --noEmit` → zero errori su `document` e `window` in
  `src/hooks/use-inactivity-timer.ts` e `src/context/AuthContext.tsx`;
  nessun errore su `document.querySelector` nelle righe 63–65 di
  `AuthContext.tsx`
- `npm start` → Metro avvia senza errori; `AuthProvider` montato in
  `App.tsx` non produce crash
- `npm run android` (o `npm run ios`) → bundle generato, app avviabile
  sul simulatore con `AuthProvider` attivo
- Verifica manuale inattività: timer scatta dopo `timeoutMinutes`;
  su Windows con Narrator la navigazione da tastiera resetta il timer

---

## Nota operativa — Risk C2 (screen-reader.ts)

> **NOTA OPERATIVA — Risk C2 (screen-reader.ts)**
>
> Durante l'implementazione di questo piano, non testare i path
> di codice che coinvolgono le azioni PIN o sblocco conto privato
> (unlockPrivate, setPin, changePin, removePin) fino al completamento
> di DESIGN 003.
>
> Motivo: `src/lib/screen-reader.ts` contiene il metodo
> `initializeLiveRegions()` privo di guard DOM. Il metodo viene
> chiamato da `announce()` se `!this.initialized`. In React Native,
> dove il costruttore non chiama mai `initializeLiveRegions()`,
> `initialized` rimane sempre `false`. La prima chiamata a qualsiasi
> `announce*()` causa `ReferenceError: document is not defined`.
>
> Questo file verrà completamente rimosso e riscritto da DESIGN 003,
> che implementerà il sistema screen reader nativo React Native.
> La correzione della guard è responsabilità di DESIGN 003, Step 1.

---

## Note per code-Agent-Code

> **Se un gate fallisce:** tenta di correggerti autonomamente solo se
> l'errore riguarda un file già nel perimetro del commit in corso. Se
> l'errore riguarda un file fuori perimetro, fermati, riporta il testo
> esatto dell'errore e attendi istruzioni. Non modificare file non
> elencati nel perimetro del commit corrente.

> ⚠️ **`App.tsx` deve montare `AuthProvider`** prima di eseguire i gate
> N8 e N6. Senza questo, i crash dovuti a `document.addEventListener` e
> `document.querySelector` non emergono e i gate risultano falsamente
> superati.

> ⚠️ **Perimetro N8**: non toccare `useScreenReader` né
> `src/lib/screen-reader.ts`. Il sistema screen reader completo è
> oggetto di un documento di design separato.

Al termine di questo piano, `AuthProvider` è montabile senza crash. I
problemi N1–N5, N7, N9, N10 rimangono aperti e sono indipendenti da
questo gruppo.
