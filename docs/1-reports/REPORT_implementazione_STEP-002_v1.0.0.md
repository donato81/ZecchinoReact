---
tipo: report
titolo: Implementazione STEP 002 — Fix provider bootstrap
versione: 1.0.0
data: 2026-05-15
stato: COMPLETATO (gate statici) / DIFFERITO (gate runtime)
design: docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md
coding-plan: docs/3-coding-plans/002-PLAN_fix-provider-bootstrap_v0.2.0.md
todo: docs/4-todo-lists/002-TODO_fix-provider-bootstrap_v0.2.0.md
---

# Report implementazione — STEP 002 (v1.0.0)

## Sintesi esecutiva

Eseguiti in autonomia i tre commit pianificati da
`002-PLAN_fix-provider-bootstrap_v0.2.0.md` nell'ordine obbligatorio
N11 → N8 → N6, con messaggi testuali identici al PLAN, in branch
`main`. Tutti i gate statici (`npx tsc --noEmit`) sono **PASS**: gli
errori `document`/`window` mirati dal DESIGN 002 sui file di perimetro
sono spariti. I gate runtime (`npm start`, `npm run android/ios/windows`,
verifica funzionale Narrator) sono **DIFFERITI** per la discrepanza D3
documentata sotto.

## Commit prodotti

| # | SHA | Messaggio | File toccati |
|---|-----|-----------|--------------|
| 1 | `dc31fda` | `fix(config): rimuovi types node da tsconfig (N11)` | `tsconfig.json` |
| 2 | `183158a` | `fix(context): sostituisci detection SR DOM con AccessibilityInfo (N8)` | `src/context/AuthContext.tsx` |
| 3 | `73a6739` | `fix(hooks): riscrivi useInactivityTimer su API RN native (N6)` | `src/hooks/use-inactivity-timer.ts`, `src/components/ActivityDetectorView.tsx` (CREATO), `src/context/AuthContext.tsx` |

Tre commit, perimetro stretto, ordine N11→N8→N6 rispettato.
Nessun rebase, nessun amend, nessun force-push.

## Perimetro modifiche (file)

- `tsconfig.json` — N11. Rimossa unica riga `"types": ["node"]` da
  `compilerOptions`. Struttura finale: solo `extends`, `compilerOptions`
  con `baseUrl`+`paths`, `include`, `exclude`.
- `src/context/AuthContext.tsx` — N8 + N6:
  - import `AccessibilityInfo` aggiunto a quello esistente `react-native`;
  - state `isScreenReaderActive` (boolean) tramite `useState(false)`;
  - rimossa la const calcolata via `document.querySelector` +
    `document.documentElement.getAttribute('data-sr-active')`;
  - aggiunto `useEffect` dedicato dopo quello della sessione Supabase
    con `AccessibilityInfo.isScreenReaderEnabled()` (Promise) +
    `addEventListener('screenReaderChanged', setIsScreenReaderActive)`
    e cleanup tramite `subscription.remove()`;
  - import `ActivityDetectorView` aggiunto;
  - wrap condizionale dei `children`: quando `isAuthenticated` vero
    `<ActivityDetectorView onActivity={resetTimer}>{children}</ActivityDetectorView>`,
    altrimenti `{children}` diretti (Opzione B PLAN §4).
- `src/hooks/use-inactivity-timer.ts` — N6:
  - rimossa costante `ACTIVITY_EVENTS`;
  - `window.setTimeout`/`window.clearTimeout` → `setTimeout`/`clearTimeout`
    (globali RN, tipizzati `number`);
  - rimosso blocco `document.addEventListener` + cleanup dall'`useEffect`
    (responsabilità delegata a `ActivityDetectorView`);
  - public API `{ resetTimer, showWarning }` invariata.
- `src/components/ActivityDetectorView.tsx` — **CREATO** in N6.
  Props `{ onActivity, children }`; `View` con
  `onStartShouldSetResponder` che invoca `onActivity` e ritorna `false`
  (non cattura responder), `onMoveShouldSetResponder: () => false`,
  `onKeyDown` aggiunto solo quando `Platform.OS === 'windows'`.
  Nessun `onResponderGrant` (dead code per PLAN N6-5).

## Gate eseguiti

### Gate statici (CLI)

| Gate | Risultato | Note |
|------|-----------|------|
| N11-GATE (`tsc --noEmit`) | ✅ PASS | Errori attesi su `document.querySelector` (AuthContext righe 67-69), `window.setTimeout`/`window.clearTimeout` (use-inactivity-timer 22-47), `document.addEventListener` (use-inactivity-timer 77,83). Nessun nuovo errore su tipi `number` dei ref timer. |
| N8-GATE-TSC | ✅ PASS | Spariti i 3 errori `document` su AuthContext.tsx 67-69. `isScreenReaderActive` inferito `boolean`. |
| N6-GATE-TSC | ✅ PASS | Zero errori `document`/`window` su `use-inactivity-timer.ts`; zero errori di tipo su `ActivityDetectorView.tsx`; import `ActivityDetectorView` correttamente risolto da AuthContext. |
| GLOBAL-1 | ✅ PASS | `grep -E 'window\|document\|navigator\|localStorage'` sui 3 file perimetro → 0 occorrenze. |
| Test suite (`jest`) | ✅ PASS | 2 suite passate (`App.test.tsx`, `ExportService.test.ts`), 1 test passed + 23 todo. |

### Gate runtime — DIFFERITI

| Gate | Stato | Motivo |
|------|-------|--------|
| N8-GATE-METRO | ⏸ DIFFERITO | D3 — `App.tsx` fuori perimetro STEP 002 e non monta `AuthProvider`. |
| N6-GATE-METRO | ⏸ DIFFERITO | Idem. |
| N6-GATE-FUNZIONALE (Narrator) | ⏸ DIFFERITO | Richiede AuthProvider montato + sessione autenticata. |
| GLOBAL-2 (`npm start`) | ⏸ DIFFERITO | Idem. |
| GLOBAL-3 (`npm run android/ios`) | ⏸ DIFFERITO | Idem. |
| GLOBAL-4 (verifica manuale inattività + Narrator) | ⏸ DIFFERITO | Idem. |

Tutti i gate runtime potranno essere eseguiti quando uno STEP successivo
(non STEP 002) monterà `<AuthProvider>` in `App.tsx`.

## Discrepanze rilevate (D1-D3)

- **D1** — DESIGN 002 §3 fa riferimento all'hook `useScreenReader`
  ancora attivo in AuthContext. Allo stato attuale del repository
  (post DESIGN 003) `AuthContext.tsx` importa già `useAccessibilityDetection`
  da `@/accessibility/detection`. Non blocca N8: il fix DOM-based era
  comunque ancora presente come const inline (righe 67-69 osservate),
  rimosso come da PLAN.
- **D2** — In `AuthContext.tsx` esistono 10 riferimenti a un simbolo
  `screenReader` non importato/definito, nei callback `unlockPrivate`,
  `setPin`, `changePin`, `removePin`. Sono **pre-esistenti** allo
  STEP 002 e coperti dalla Nota C2 del TODO che vieta interventi sui
  path PIN fino a DESIGN 003. Resteranno come errori `tsc` finché non
  verrà importato `screen-reader` (DESIGN futuro). Non attribuiti a
  STEP 002.
- **D3** — `App.tsx` non monta `AuthProvider`. Il template `NewAppScreen`
  iniziale è ancora in vigore. Poiché `App.tsx` è **fuori perimetro**
  STEP 002 ("Non modificare file fuori perimetro"), i gate runtime
  che richiedono il provider montato sono stati formalmente differiti.
  Lo STEP successivo (non STEP 002) dovrà fare il bootstrap del provider
  in `App.tsx` prima di sbloccare GLOBAL-2/3/4 e N*-GATE-METRO/FUNZIONALE.

## Vincoli rispettati

- ✅ Ordine commit N11 → N8 → N6 mandatorio.
- ✅ Messaggi commit identici a PLAN, senza variazioni.
- ✅ Perimetro stretto: solo i 4 file dichiarati nel PLAN sono stati toccati
  da Phase 1; nessun file fuori perimetro modificato in fase di codice.
- ✅ Nessuna azione su path PIN (`unlockPrivate`, `setPin`, `changePin`,
  `removePin`) — confermati intatti.
- ✅ Git eseguito tramite tool autorizzato (commit locali, nessun push);
  nessuna operazione distruttiva.
- ✅ Soglia retry: 0 retry necessari (tutti i gate passati al primo tentativo).

## Documentazione aggiornata

- `CHANGELOG.md` — aggiunta sezione `[Unreleased] DESIGN 002 — STEP 002`
  con dettaglio Modificato/Aggiunto per N11/N8/N6.
- `docs/api.md` — voce `use-inactivity-timer.ts` aggiornata da ❌ a ✅;
  aggiunta nuova sezione per `ActivityDetectorView.tsx`.
- `docs/architettura.md` — riga matrice compatibilità per
  `hooks/use-inactivity-timer.ts` aggiornata a ✅; aggiunta riga per
  `components/ActivityDetectorView.tsx`.
- `docs/4-todo-lists/002-TODO_fix-provider-bootstrap_v0.2.0.md` —
  marcati `[x]` tutti i sub-task del perimetro statico + gate tsc;
  marcati `[ ] *(DIFFERITO — D3)*` i gate runtime; stato aggiornato a
  `STATIC_GATES_PASSED`.

## Release

Nessun bump versione. Le voci restano in `[Unreleased]` fino a quando
il prossimo STEP non monterà `AuthProvider` in `App.tsx` e potranno
essere validati i gate runtime, raggiungendo lo stato `DONE` completo
per il gruppo P0.B3.
