---
tipo: todo
titolo: Fix provider bootstrap — Gruppo 2 (N11, N8, N6)
versione: 0.2.0
data: 2026-05-14
stato: STATIC_GATES_PASSED
coding-plan: docs/3-coding-plans/002-PLAN_fix-provider-bootstrap_v0.2.0.md
design: docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md
---

# TODO — Fix provider bootstrap (v0.2.0)

> Fonte di verità: [docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md](../2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md)
> Coding plan: [docs/3-coding-plans/002-PLAN_fix-provider-bootstrap_v0.2.0.md](../3-coding-plans/002-PLAN_fix-provider-bootstrap_v0.2.0.md)

---

## Precondizioni

- [ ] **PRE-1** — Verificare che tutti i gate del Gruppo 1 (B1–B6) siano superati: `npm start` avvia Metro senza errori di risoluzione moduli
- [ ] **PRE-2** — Eseguire `npm install` e verificare uscita 0, nessun `ETARGET`
- [ ] **PRE-3** — Aggiungere `<AuthProvider>` in `App.tsx` prima di procedere con i gate N8 e N6

---

## Commit 1 — N11

*Commit: `fix(config): rimuovi types node da tsconfig (N11)`*
*File: `tsconfig.json`*

- [x] **N11-1** — In `tsconfig.json`: rimuovere la riga `"types": ["node"]` da `compilerOptions`; verificare che il file risultante abbia `compilerOptions` con solo
  `baseUrl` e `paths`; alla radice del file solo `extends`, `include`
  ed `exclude` — nessun altro campo a nessun livello

*Gate N11 (eseguire dopo il commit):*

- [x] **N11-GATE** — `npx tsc --noEmit` → deve produrre errori su `document.addEventListener`, `window.clearTimeout`, `window.setTimeout` e `document.querySelector` (errori **attesi** che confermano l'effetto del fix); non devono comparire errori nuovi sui tipi `number` dei timer

---

## Commit 2 — N8

*Commit: `fix(context): sostituisci detection SR DOM con AccessibilityInfo (N8)`*
*File: `src/context/AuthContext.tsx`*
*Dipendenza: N11-GATE superato*

- [x] **N8-1** — In `src/context/AuthContext.tsx`: aggiungere `AccessibilityInfo` agli import da `react-native` (aggiungere alla riga di import esistente o creare una nuova riga di import)
- [x] **N8-2** — In `src/context/AuthContext.tsx`: aggiungere `const [isScreenReaderActive, setIsScreenReaderActive] = useState(false)` insieme agli altri `useState` in `AuthProvider`
- [x] **N8-3** — In `src/context/AuthContext.tsx`: rimuovere le righe 62–64 (la costante `isScreenReaderActive` calcolata con `typeof document !== 'undefined' && document.querySelector('[aria-live]') !== null && document.documentElement.getAttribute('data-sr-active') === 'true'`)
- [x] **N8-4** — In `src/context/AuthContext.tsx`: aggiungere `useEffect` dedicato
  **dopo** il `useEffect` per la sessione Supabase già presente nel file,
  con `AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderActive)`,
  `AccessibilityInfo.addEventListener('screenReaderChanged', ...)` e
  cleanup `subscription.remove()` — non usare `AccessibilityInfo.removeEventListener`,
  che è deprecato da RN 0.65 e non supportato in questo progetto (RN 0.82)

*Gate N8 (eseguire dopo il commit — `App.tsx` deve montare `AuthProvider`):*

- [x] **N8-GATE-TSC** — `npx tsc --noEmit` → nessun errore su `document.querySelector`, `document.documentElement`, `document is not defined` nelle righe 63–65 di `AuthContext.tsx`; `isScreenReaderActive` inferito come `boolean`
- [ ] **N8-GATE-METRO** — `npm start` → `AuthProvider` montato in `App.tsx` non produce `ReferenceError` su `document.querySelector`; log Metro privo di errori relativi alle righe 63–65 di `AuthContext.tsx` *(DIFFERITO — D3: AuthProvider non montato in App.tsx)*

---

## Commit 3 — N6

*Commit: `fix(hooks): riscrivi useInactivityTimer su API RN native (N6)`*
*File: `src/hooks/use-inactivity-timer.ts` (MODIFY), `src/components/ActivityDetectorView.tsx` (CREATE), `src/context/AuthContext.tsx` (MODIFY — integrazione wrapper)*
*Dipendenza: N8-GATE-METRO superato*

- [x] **N6-1** — In `src/hooks/use-inactivity-timer.ts`: rimuovere la costante `ACTIVITY_EVENTS` (riga 13: `const ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'touchstart'] as const`)
- [x] **N6-2** — In `src/hooks/use-inactivity-timer.ts`: sostituire tutte le occorrenze di `window.clearTimeout(...)` con `clearTimeout(...)` (righe 22–29); i ref `warningTimerRef` e `timeoutTimerRef` restano `useRef<number | null>` — il tipo non cambia
- [x] **N6-3** — In `src/hooks/use-inactivity-timer.ts`: sostituire tutte le occorrenze di `window.setTimeout(...)` con `setTimeout(...)` (righe 42–51)
- [x] **N6-4** — In `src/hooks/use-inactivity-timer.ts`: rimuovere dall'`useEffect` il blocco `handleActivity`, `ACTIVITY_EVENTS.forEach(document.addEventListener)` e il corrispettivo `document.removeEventListener` nel return del cleanup (righe 72–86)
- [x] **N6-5** — Creare `src/components/ActivityDetectorView.tsx` con:
  interfaccia `ActivityDetectorViewProps { onActivity: () => void; children: React.ReactNode }`,
  `View` con `onStartShouldSetResponder` che chiama `onActivity` e restituisce `false`,
  `onMoveShouldSetResponder` che restituisce `false`,
  **senza** `onResponderGrant` (dead code: poiché `onStartShouldSetResponder` restituisce
  `false`, il componente non acquisisce il responder e `onResponderGrant` non verrebbe
  mai invocato — la detection del tocco è già completa in `onStartShouldSetResponder`),
  `onKeyDown` che chiama `onActivity` con guard `Platform.OS === 'windows'`,
  style `flex: 1`
- [x] **N6-6** — In `src/context/AuthContext.tsx`: aggiungere import `ActivityDetectorView` da `'@/components/ActivityDetectorView'`
- [x] **N6-7** — In `src/context/AuthContext.tsx`: nel render del provider, avvolgere `{children}` con `<ActivityDetectorView onActivity={resetTimer}>` condizionalmente su `isAuthenticated` (Opzione B del design §4); il ramo non-autenticato lascia passare `{children}` direttamente

*Gate N6 (eseguire dopo il commit — `App.tsx` deve montare `AuthProvider`):*

- [x] **N6-GATE-TSC** — `npx tsc --noEmit` → nessun errore su `document.addEventListener`, `window.clearTimeout`, `window.setTimeout` in `src/hooks/use-inactivity-timer.ts`; nessun errore di tipo su `src/context/AuthContext.tsx` relativo all'import di `ActivityDetectorView` o all'uso di `isAuthenticated` come condizione del wrapper
- [ ] **N6-GATE-METRO** — `npm start` → `AuthProvider` montato in `App.tsx` non produce `ReferenceError` su `document` o `window`; log Metro privo di errori relativi a `use-inactivity-timer.ts` *(DIFFERITO — D3)*
- [ ] **N6-GATE-FUNZIONALE** — Verifica manuale: dopo `timeoutMinutes` minuti di inattività `showWarning` diventa `true`; su Windows con Narrator attivo la navigazione da tastiera resetta il timer (verificabile con `console.log` temporaneo nel callback `scheduleTimers`) *(DIFFERITO — D3)*

---

## Gate di verifica globale

*Eseguire in sequenza dopo il completamento dei tre commit:*

- [x] **GLOBAL-1** — `npx tsc --noEmit` → zero errori su `document` e `window` in
  `src/hooks/use-inactivity-timer.ts` e `src/context/AuthContext.tsx`;
  nessun errore su `document.querySelector` nelle righe 63–65 di `AuthContext.tsx`
- [ ] **GLOBAL-2** — `npm start` → Metro avvia senza errori; `AuthProvider` montato in `App.tsx` non produce crash *(DIFFERITO — D3)*
- [ ] **GLOBAL-3** — `npm run android` (o `npm run ios`) → bundle generato, app avviabile sul simulatore con `AuthProvider` attivo *(DIFFERITO — D3)*
- [ ] **GLOBAL-4** — Verifica manuale inattività: timer scatta dopo `timeoutMinutes`; su Windows con Narrator la navigazione da tastiera resetta il timer *(DIFFERITO — D3)*

---

## Note per code-Agent-Code

> **Se un gate fallisce:** tenta di correggerti autonomamente solo se
> l'errore riguarda un file già nel perimetro del commit in corso. Se
> l'errore riguarda un file fuori perimetro, fermati, riporta il testo
> esatto dell'errore e attendi istruzioni. Non modificare file non
> elencati nel perimetro del commit corrente.

> ⚠️ **Perimetro N8**: non toccare `useScreenReader` né
> `src/lib/screen-reader.ts`. Il sistema screen reader completo è
> oggetto di un documento di design separato.

> ⚠️ **`App.tsx` deve montare `AuthProvider`** prima di eseguire i gate
> N8 e N6. Senza questo, i crash dovuti a `document.addEventListener` e
> `document.querySelector` non emergono e i gate risultano falsamente
> superati. Vedere precondizione PRE-3.
