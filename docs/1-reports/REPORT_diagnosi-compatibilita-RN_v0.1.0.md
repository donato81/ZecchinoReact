---
tipo: report
titolo: Diagnosi compatibilità React Native
versione: 0.1.0
data: 2026-05-13
stato: DRAFT
ambito: intero progetto (config, dipendenze, src/)
---

# REPORT — Diagnosi compatibilità React Native (v0.1.0)

## Sintesi esecutiva

L'app **non si avvia** nello stato attuale. Il bundle Metro fallisce per
moduli mancanti (`sonner`, `@/components/ui/button`) e la configurazione
Babel non sostituisce le `process.env.SUPABASE_*` né risolve l'alias `@/*`
a runtime, facendo crashare `src/lib/supabase/client.ts` al primo import.

Anche oltre i blocchi, una parte significativa di `src/lib/` e `src/hooks/`
è codice nato per il web (Web Audio API, DOM live regions, `localStorage`,
`sessionStorage`, `window.matchMedia`, `crypto.subtle`, eventi
`online`/`offline` su `window`) e non funzionerà su React Native.

---

## Risposte alle 4 domande di diagnosi

### 1. Dipendenze web in `package.json`

Le dipendenze dichiarate in [package.json](package.json) sono **tutte
compatibili RN** sulla carta (`react-native`, `react-native-windows`,
`@react-native-async-storage/async-storage`, `@supabase/supabase-js`,
`bcryptjs`, `react-native-safe-area-context`, `react-native-dotenv`).

Però:

- **`sonner` non è dichiarata** ma è **importata** in
  [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L13) e
  [src/context/AppDataContext.tsx](src/context/AppDataContext.tsx#L8).
  È una libreria di toast **DOM-only** (richiede `document` e React DOM).
  Va rimossa dal codice e sostituita con `ToastAndroid` / un equivalente
  RN (es. `react-native-toast-message`).
- **`@react-native-async-storage/async-storage` `^3.0.2`**: la major 3
  non esiste sul registry pubblico (l'ultima stabile è la 2.x).
  Probabile errore di pinning → `npm install` può fallire o risolvere a
  una versione inattesa. Da verificare e riportare a `^2.x`.
- **Mancano `react-native-vector-icons`, navigation, gesture handler,
  reanimated, ecc.**: nessuna libreria UI/navigation è dichiarata. Il
  progetto usa solo lo scaffold `NewAppScreen`. Non è bloccante per
  l'avvio attuale, ma indica che la migrazione UI non è iniziata.

### 2. File di configurazione

| File | Stato | Note |
|---|---|---|
| [babel.config.js](babel.config.js) | **Incompleto — bloccante** | Manca `module:react-native-dotenv` e `babel-plugin-module-resolver` per l'alias `@/*`. |
| [tsconfig.json](tsconfig.json) | Parzialmente coerente | `paths` per `@/*` definito, ma è solo type-checking: senza module-resolver Babel non risolve a runtime. `"types": ["node"]` è inappropriato per RN (espone API Node nelle definizioni). |
| [metro.config.js](metro.config.js) | OK | Block-list per `windows/` e build di `react-native-windows` corretti. |
| [app.json](app.json) | OK ma minimale | Contiene solo `name` e `displayName`. |
| [index.js](index.js) | OK | Registrazione standard. |
| [App.tsx](App.tsx) | OK come scaffold | Non monta `AuthProvider` / `AppDataProvider` / `UserSettingsProvider` / `VisibleDataProvider`: il codice in `src/context/*` non viene esercitato finché non viene wirato. |

### 3. API browser usate in `src/`

Riferimenti diretti ad API che **non esistono in React Native**:

- `window.AudioContext`, `AudioContext`, oscillatori Web Audio →
  [src/lib/sound-system.ts](src/lib/sound-system.ts#L104-L156).
- `localStorage`, `navigator.vibrate` →
  [src/lib/haptic-system.ts](src/lib/haptic-system.ts#L22-L76).
- `document.createElement`, `document.body.appendChild`, `HTMLDivElement`,
  `document.addEventListener('DOMContentLoaded')`, `document.createTextNode`
  → [src/lib/screen-reader.ts](src/lib/screen-reader.ts#L4-L65).
- `crypto.subtle.importKey`, `crypto.subtle.encrypt/decrypt`,
  `btoa`/`atob`, `TextEncoder`/`TextDecoder` →
  [src/lib/crypto.ts](src/lib/crypto.ts#L12-L60). `bcrypt.hash` /
  `bcrypt.compare` di `bcryptjs` funzionano in RN; le funzioni
  `encryptData`/`decryptData` invece no.
- `navigator.onLine`, `window.addEventListener('online'|'offline')` →
  [src/hooks/use-online-status.ts](src/hooks/use-online-status.ts#L4-L17),
  [src/context/AppDataContext.tsx](src/context/AppDataContext.tsx#L267).
- `window.setTimeout`, `window.clearTimeout`,
  `document.addEventListener('click'|'keydown'|'scroll'|'touchstart')` →
  [src/hooks/use-inactivity-timer.ts](src/hooks/use-inactivity-timer.ts#L17-L78).
- `window.matchMedia`, `sessionStorage.getItem/setItem`,
  `window.speechSynthesis`, `'ontouchstart' in window`,
  `navigator.maxTouchPoints` →
  [src/hooks/use-talkback.ts](src/hooks/use-talkback.ts#L42-L151).
- `document.querySelector`, `document.documentElement.getAttribute` →
  [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L63-L65).

### 4. Dipendenze problematiche tra file

- **Il client Supabase è eseguito al primo import** e legge
  `process.env.SUPABASE_URL` con `throw` immediato →
  [src/lib/supabase/client.ts](src/lib/supabase/client.ts#L3-L8).
  Senza il plugin Babel `react-native-dotenv` quelle variabili sono
  `undefined` e tutto il grafo che importa `client.ts` (cache,
  repositories, AuthContext, AppDataContext, hook settings) crasha
  a cascata appena viene caricato.
- **`AppDataContext` chiama in modo sincrono API ora asincrone**:
  [src/lib/supabase/cache.ts](src/lib/supabase/cache.ts#L31-L57)
  espone `readCache`/`isCacheStale` come `Promise` (per AsyncStorage),
  ma
  [src/context/AppDataContext.tsx](src/context/AppDataContext.tsx#L242-L271)
  le usa come se fossero sincrone (`accounts.data`, condizione
  `if (!accounts || ...)`). Il `Promise` è truthy → `accounts.data`
  è `undefined`, runtime crash o dati silenziosamente persi.
- **Import a moduli inesistenti**:
  [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L10) importa
  `Button` da `@/components/ui/button` ma la cartella
  [src/components/](src/components/) è **vuota**.
- **Nessuna dipendenza ciclica** rilevata nei file esaminati: la
  gerarchia `client → cache/repositories → context → hooks` è acyclic.

---

## GRUPPO 1 — BLOCCANTI

> Problemi che impediscono il bundle o lo startup dell'app.

### B1. `babel.config.js` non risolve l'alias `@/*`
- File: [babel.config.js](babel.config.js)
- Sezione: `presets`/`plugins` (assente)
- Problema: `tsconfig` definisce `paths: { "@/*": ["src/*"] }` ma Babel
  non ha `babel-plugin-module-resolver`. Metro non sa risolvere
  `@/lib/...`, `@/context/...`, `@/hooks/...`.
- Perché blocca: ogni `import ... from '@/...'` (decine di occorrenze in
  `src/context/`, `src/hooks/`, `src/lib/types.ts`) fallisce in fase di
  bundling Metro → l'app non parte.

### B2. `babel.config.js` non inietta le variabili `.env`
- File: [babel.config.js](babel.config.js)
- Sezione: `plugins` (assente)
- Problema: manca `['module:react-native-dotenv', { moduleName: '@env', ... }]`
  o equivalente. `process.env.SUPABASE_URL` / `SUPABASE_ANON_KEY` in
  [src/lib/supabase/client.ts](src/lib/supabase/client.ts#L3-L8)
  restano `undefined`.
- Perché blocca: `client.ts` esegue `throw new Error('SUPABASE_URL
  mancante in .env.local')` al primo import → crash sincrono prima del
  primo render appena un provider che dipende da Supabase viene
  importato.

### B3. Modulo `sonner` non installato
- File: [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L13),
  [src/context/AppDataContext.tsx](src/context/AppDataContext.tsx#L8)
- Sezione: `import { toast } from 'sonner'`
- Problema: `sonner` non compare in `dependencies`/`devDependencies` di
  [package.json](package.json) ed è inoltre una libreria DOM-only.
- Perché blocca: Metro fallisce la risoluzione del modulo → bundle non
  generato.

### B4. Modulo `@/components/ui/button` inesistente
- File: [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L10)
- Sezione: `import { Button } from '@/components/ui/button'`
- Problema: la cartella [src/components/](src/components/) è vuota; il
  componente `Button` non esiste.
- Perché blocca: anche risolvendo l'alias `@/*` (B1), il file di
  destinazione manca → errore Metro «Unable to resolve module».

### B5. Versione fantasma di AsyncStorage
- File: [package.json](package.json)
- Riga: `"@react-native-async-storage/async-storage": "^3.0.2"`
- Problema: la major **3.x non è pubblicata** sul registry npm. La
  serie corrente è `2.x` (e prima `1.x`).
- Perché blocca: `npm install` da clean fallisce con `ETARGET`/`No
  matching version found` → impossibile completare l'installazione e
  dunque buildare.

### B6. Plugin Babel `react-native-dotenv` non presente fra le devDependencies
- File: [package.json](package.json)
- Problema: il pacchetto runtime `react-native-dotenv` è dichiarato in
  `dependencies` ma **il plugin Babel** che effettua la sostituzione a
  compile time va aggiunto comunque al `babel.config.js`. Senza il
  plugin caricato (B2) il pacchetto runtime è inerte.
- Perché blocca: vedi B2 (cause concorrenti).

---

## GRUPPO 2 — NON BLOCCANTI

> Problemi che non impediscono il bundle ma producono crash o
> comportamenti errati al primo accesso ai relativi code path.

### N1. Web Audio API in `sound-system.ts`
- File: [src/lib/sound-system.ts](src/lib/sound-system.ts#L104-L160)
- Problema: usa `AudioContext`, `OscillatorNode`, `GainNode`,
  `webkitAudioContext`, accesso a `window`. In RN
  `typeof window !== 'undefined'` è vero (polyfill base), ma
  `window.AudioContext` è `undefined`: il `try` cattura l'errore e
  `enabled = false`, quindi nessun suono. Funzionalità audio del tutto
  inattiva.
- Effetto runtime: nessun feedback audio; l'oggetto `soundSystem`
  importato da `AuthContext` rimane silente ma non crasha.

### N2. `localStorage` e `navigator.vibrate` in `haptic-system.ts`
- File: [src/lib/haptic-system.ts](src/lib/haptic-system.ts#L18-L76)
- Problema: il costruttore legge `'vibrate' in navigator` (in RN
  `navigator` esiste come oggetto vuoto → `false`) e
  `localStorage.getItem('haptic-settings')` → `localStorage` non esiste
  in RN. Il `try/catch` in `loadSettings`/`saveSettings` impedisce il
  crash, ma la persistenza è muta e nessuna vibrazione viene emessa.
- Effetto runtime: feedback aptico inattivo; va riscritto su
  `react-native` `Vibration` API + `AsyncStorage`.

### N3. Live regions DOM in `screen-reader.ts`
- File: [src/lib/screen-reader.ts](src/lib/screen-reader.ts#L4-L65)
- Problema: il costruttore controlla
  `typeof document !== 'undefined'`. In RN è `undefined`, quindi le
  regions non vengono create e `announce()` esce silenziosamente
  perché `region` è `null`. Tutta la classe è da riscrivere su
  `AccessibilityInfo.announceForAccessibility` di RN.
- Effetto runtime: zero annunci screen reader → regressione totale di
  un requisito chiave dell'app.

### N4. `crypto.subtle` non disponibile in `crypto.ts`
- File: [src/lib/crypto.ts](src/lib/crypto.ts#L11-L62)
- Problema: `encryptData` / `decryptData` usano Web Crypto, `btoa`,
  `atob`. Hermes non li espone. `hashPin` / `verifyPin` (`bcryptjs`)
  funzionano.
- Effetto runtime: appena un flusso chiama `encryptData` (cifratura
  importi su transazioni private) viene sollevato `TypeError:
  undefined is not an object (evaluating 'crypto.subtle.importKey')`.

### N5. `useOnlineStatus` su API browser
- File: [src/hooks/use-online-status.ts](src/hooks/use-online-status.ts#L1-L23)
- Problema: usa `navigator.onLine` e `window.addEventListener('online'|'offline')`.
  In RN questi eventi non vengono mai emessi: lo stato resta
  `isOffline = false` perpetuamente. Va sostituito con
  `@react-native-community/netinfo`.
- Effetto runtime: la logica offline-first di `AppDataContext` non si
  attiva mai.

### N6. `useInactivityTimer` su `document` e `window`
- File: [src/hooks/use-inactivity-timer.ts](src/hooks/use-inactivity-timer.ts#L17-L78)
- Problema: `document.addEventListener('click'|'keydown'|'scroll'|'touchstart')`
  fallisce immediatamente con `ReferenceError` in RN (no `document`).
  Anche `window.setTimeout` non è idiomatico (usare il global
  `setTimeout`).
- Effetto runtime: appena `AuthProvider` invoca il hook (subito al
  mount), `useEffect` lancia `ReferenceError: document is not defined`
  → crash dell'albero React.
  - **Nota**: questo, una volta sbloccato il bundle, diventerà un
    bloccante de facto perché `AuthProvider` lo monta sempre.

### N7. `useTalkBack` su `window.matchMedia`, `sessionStorage`, `speechSynthesis`
- File: [src/hooks/use-talkback.ts](src/hooks/use-talkback.ts#L42-L160)
- Problema: tutta la detection si basa su API browser. In RN si usa
  `AccessibilityInfo.isScreenReaderEnabled()` /
  `addEventListener('screenReaderChanged', ...)`.
- Effetto runtime: detection sempre `low`, nessuna adattamento attivo;
  riferimenti a `sessionStorage` lanceranno `ReferenceError` se i
  rami `try` non li proteggono.

### N8. Detection screen reader in `AuthContext`
- File: [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L63-L65)
- Problema: `document.querySelector('[aria-live]')` e
  `document.documentElement.getAttribute('data-sr-active')` sono
  DOM-only. In RN `document` è `undefined` → `ReferenceError` al
  primo render del provider.
- Effetto runtime: crash del provider quando montato (si combina con
  N6).

### N9. `AppDataContext` usa funzioni cache come sincrone
- File: [src/context/AppDataContext.tsx](src/context/AppDataContext.tsx#L242-L283)
- Problema: `readCache` e `isCacheStale` ora sono `async`
  ([src/lib/supabase/cache.ts](src/lib/supabase/cache.ts#L31-L57)),
  ma `readCachedDomainSnapshot` le invoca come sincrone e accede a
  `accounts.data`. Il `Promise` è truthy quindi il guard non scatta;
  `.data` è `undefined`.
- Effetto runtime: `applyDomainSnapshot` viene chiamato con `undefined`
  per ogni collezione → setState con `undefined` → render successivi
  con `accounts.map` ecc. esplodono.

### N10. `downloadFile` (CSV export)
- File: [src/lib/helpers.ts](src/lib/helpers.ts) (referenziato da
  [src/context/AppDataContext.tsx](src/context/AppDataContext.tsx#L3))
- Problema: nome che rivela un'implementazione DOM
  (`Blob` + `URL.createObjectURL` + `<a>` click). Da rivedere e
  sostituire con `react-native-fs` o `react-native-share`.
- Effetto runtime: chiamata a `handleExportCSV` → crash.

### N11. `tsconfig.json` espone i tipi Node
- File: [tsconfig.json](tsconfig.json#L4)
- Problema: `"types": ["node"]` carica `@types/node` v25, mascherando
  errori di portabilità (es. `process.env`, `Buffer`, `setTimeout` di
  Node) che a runtime non esistono identici in RN.
- Effetto runtime: nessun crash diretto, ma falsi positivi del type
  checker → API web/Node usate inavvertitamente.

---

## GRUPPO 3 — COMPATIBILI

> File già corretti per React Native nello stato attuale.

- [index.js](index.js)
- [App.tsx](App.tsx)
- [app.json](app.json)
- [metro.config.js](metro.config.js)
- [src/lib/types.ts](src/lib/types.ts)
- [src/lib/constants.ts](src/lib/constants.ts)
- [src/lib/supabase/cache.ts](src/lib/supabase/cache.ts)
- [src/lib/supabase/types.ts](src/lib/supabase/types.ts)
- [src/lib/supabase/client.ts](src/lib/supabase/client.ts) *(compatibile con RN una volta risolti B2/B6; nessuna API browser)*
- [src/lib/supabase/repositories/budget.ts](src/lib/supabase/repositories/budget.ts)
- [src/lib/supabase/repositories/categorie.ts](src/lib/supabase/repositories/categorie.ts)
- [src/lib/supabase/repositories/conti.ts](src/lib/supabase/repositories/conti.ts)
- [src/lib/supabase/repositories/impostazioni-utente.ts](src/lib/supabase/repositories/impostazioni-utente.ts)
- [src/lib/supabase/repositories/obiettivi-risparmio.ts](src/lib/supabase/repositories/obiettivi-risparmio.ts)
- [src/lib/supabase/repositories/transazioni.ts](src/lib/supabase/repositories/transazioni.ts)
- [src/lib/budget-alerts.ts](src/lib/budget-alerts.ts) *(logica pura)*
- [src/lib/budget-forecasting.ts](src/lib/budget-forecasting.ts) *(logica pura)*
- [src/lib/budget-history.ts](src/lib/budget-history.ts) *(logica pura)*
- [src/lib/budget-templates.ts](src/lib/budget-templates.ts) *(logica pura)*
- [src/context/UserSettingsContext.tsx](src/context/UserSettingsContext.tsx)
- [src/context/VisibleDataContext.tsx](src/context/VisibleDataContext.tsx)
- [src/hooks/use-display-preferences.ts](src/hooks/use-display-preferences.ts)
- [src/hooks/use-visible-data.ts](src/hooks/use-visible-data.ts)
- [src/hooks/use-haptic.ts](src/hooks/use-haptic.ts) *(JS puro; depende dallo stato di N2)*
- [src/hooks/use-screen-reader.ts](src/hooks/use-screen-reader.ts) *(wrapper puro; dipende da N3)*
- [src/hooks/use-user-settings.ts](src/hooks/use-user-settings.ts)
- `package.json` *(sezione devDependencies e scripts; le criticità riguardano singole entries → B3, B5, B6)*
