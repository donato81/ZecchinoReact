---
tipo: design
titolo: Fix blocchi di avvio — Gruppo 1 (B1–B6)
versione: 0.1.0
data: 2026-05-13
stato: REVIEWED
sorgente: docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md
perimetro: babel.config.js, package.json, src/context/AuthContext.tsx, src/context/AppDataContext.tsx, src/lib/supabase/client.ts, src/components/ui/button.tsx, src/env.d.ts
---

# DESIGN — Fix blocchi di avvio (v0.1.0)

> **Scope**: configurazione e dipendenze necessarie per rendere l'app
> avviabile. Nessuna UI, nessun componente definitivo, nessuna schermata.
>
> **Precondizione**: leggere
> [docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md](../1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md)
> prima di procedere all'implementazione.

---

## 1. Grafo delle dipendenze e ordine obbligatorio

```
B1 ──┐
     ├──► [Metro risolve i moduli] ──► B3 ──► App avviabile
B2 ──┘                            ──► B4 ──┘
          │
B5 ──────► [npm install completo, node_modules coerente]
```

**Sequenza vincolante:**

1. **B1 + B2 + B5** (possono essere eseguiti in un singolo commit perché
   toccano solo `babel.config.js` e `package.json`, non si bloccano a
   vicenda)
2. **B3** — rimozione import `sonner` (richiede B1 per non essere
   oscurata da altri errori di risoluzione moduli)
3. **B4** — creazione placeholder `Button` e fix JSX in `AuthContext`
   (richiede B1 per la risoluzione alias `@/*`)
4. **B6** è risolto da B2 — non richiede azione aggiuntiva

> B5 deve essere applicato prima di `npm install`; B3 e B4 prima di
> eseguire `npm start` / Metro.

---

## 2. B1 — Alias `@/*` non risolto da Metro

### Stato attuale

`babel.config.js` contiene esclusivamente:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
```

`tsconfig.json` definisce `paths: { "@/*": ["src/*"] }` ma questa
configurazione vale solo per il type-checker TypeScript; Metro usa Babel
come resolver a runtime e ignora `tsconfig.json`.

### Causa

Manca `babel-plugin-module-resolver` (o il plugin equivalente di
`@react-native/babel-preset`). Ogni `import ... from '@/...'` — decine
di occorrenze in `src/context/`, `src/hooks/`, `src/lib/` — produce
errore Metro `Unable to resolve module '@/...'`.

### Soluzione

**File: `babel.config.js`** — aggiungere il plugin `module-resolver`:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    /* ... altri plugin ... */
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.js', '.android.js',
          '.js', '.jsx',
          '.ts', '.tsx',
          '.json',
        ],
        alias: {
          '@': './src',
        },
      },
    ],
  ],
};
```

**File: `package.json`** — aggiungere alla sezione `devDependencies`:

```json
"babel-plugin-module-resolver": "^5.0.3"
```

> Il prefisso `babel-plugin-` è rimosso automaticamente da Babel nel
> campo `plugins`; il nome del plugin da usare in `babel.config.js` è
> quindi `'module-resolver'` (non `'babel-plugin-module-resolver'`).

### Gate di verifica B1

```bash
npm start
```

Metro non deve produrre errori `Unable to resolve module '@/...'`.
Ogni import con prefisso `@/` deve risolvere correttamente nel bundle log.

---

## 3. B2 + B6 — Variabili `.env` non iniettate

### Stato attuale

`src/lib/supabase/client.ts` (riga 3–8):

```ts
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) throw new Error('SUPABASE_URL mancante in .env.local')
if (!supabaseAnonKey) throw new Error('SUPABASE_ANON_KEY mancante in .env.local')
```

`package.json` già include `react-native-dotenv` in `dependencies`
(`^3.4.11`), ma il plugin **non è registrato** in `babel.config.js`.
Metro non esegue mai la sostituzione → `process.env.SUPABASE_URL` è
`undefined` → il throw esegue in modo sincrono al primo import del
modulo → crash a cascata di tutto il grafo (cache, repositories,
AuthContext, AppDataContext).

### Causa

B2 e B6 sono la stessa causa: `react-native-dotenv` è presente come
pacchetto npm ma non è caricato da Babel. Il pacchetto è inerte finché
non compare nel campo `plugins` di `babel.config.js`.

### Soluzione — parte Babel

**File: `babel.config.js`** — aggiungere come primo plugin (deve
precedere `module-resolver` per garantire che le variabili siano
disponibili quando gli altri plugin processano il codice):

```js
[
  'module:react-native-dotenv',
  {
    moduleName: '@env',
    path: '.env',
    allowlist: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    allowUndefined: false,
  },
],
```

Il parametro `allowUndefined: false` fa fallire la build in modo esplicito
se una variabile dichiarata non è presente nel file `.env`, evitando
errori silenziosi a runtime.

### Soluzione — dipendenza su `client.ts` (fuori perimetro)

`react-native-dotenv` con `moduleName: '@env'` trasforma le
`ImportDeclaration` che importano da `'@env'` — **non** le accessi
`process.env.VAR`. Di conseguenza `client.ts` deve essere aggiornato:

```ts
// Prima (processo env — incompatibile con react-native-dotenv default)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

// Dopo
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'
const supabaseUrl = SUPABASE_URL
const supabaseAnonKey = SUPABASE_ANON_KEY
```

> ⚠️ **Nota di perimetro**: `src/lib/supabase/client.ts` non era incluso
> nel perimetro dichiarato, ma questo cambiamento è **indispensabile**
> perché B2 abbia effetto. Agent-Plan deve includerlo nello stesso commit
> di B2.

### Soluzione — dichiarazione TypeScript per `@env`

Aggiungere (o estendere) `src/env.d.ts`:

```ts
declare module '@env' {
  export const SUPABASE_URL: string
  export const SUPABASE_ANON_KEY: string
}
```

Senza questa dichiarazione TypeScript segnala `Cannot find module '@env'`.

> **Nota su `src/env.d.ts`**: questo file non contiene logica e non
> esiste a runtime. Serve esclusivamente a informare TypeScript che il
> modulo `@env` esiste e che espone le costanti `SUPABASE_URL` e
> `SUPABASE_ANON_KEY`. Senza di esso TypeScript segnala errore su ogni
> import da `@env`, rendendo impossibile il controllo qualità del codice.

### Gate di verifica B2/B6

Creare `.env` nella root con valori placeholder:

```
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_ANON_KEY=placeholder_key
```

Poi eseguire:

```bash
npm start
```

`client.ts` non deve più lanciare `Error: SUPABASE_URL mancante`.
Il log Metro non deve contenere errori relativi a variabili env undefined.

---

## 4. B5 — Versione AsyncStorage inesistente

### Stato attuale

`package.json` contiene:

```json
"@react-native-async-storage/async-storage": "^3.0.2"
```

La major 3.x non è pubblicata su npm. La serie stabile corrente è 2.x.

### Causa

Probabile errore di pinning manuale. Con `^3.0.2`, `npm install` produce:

```
npm error notarget No matching version found for
  @react-native-async-storage/async-storage@^3.0.2
```

L'installazione fallisce → `node_modules` incompleto → impossibile
buildare qualsiasi cosa.

### Soluzione

**File: `package.json`** — correggere la versione in `dependencies`:

```json
"@react-native-async-storage/async-storage": "^2.1.2"
```

La 2.1.x è la versione stabile pubblica più recente della serie 2 ed è
compatibile con React Native 0.82.

### Gate di verifica B5

```bash
npm install
```

Il comando deve terminare con codice di uscita 0, senza `ETARGET` o
`No matching version found`. La directory `node_modules/@react-native-async-storage/`
deve esistere e contenere `async-storage/`.

---

## 5. B3 — Import `sonner` non installato e DOM-only

### Stato attuale

**`AuthContext.tsx` riga 13:**

```ts
import { toast as sonnerNotify } from 'sonner'
```

`sonnerNotify` è usato in 6 punti (righe 172, 183, 194, 216, 240, 263)
per `sonnerNotify.error(...)` e `sonnerNotify.success(...)`.

**`AppDataContext.tsx` riga 8:**

```ts
import { toast } from 'sonner'
```

`toast` è usato in circa 20 punti con tre varianti:
`toast.success(msg)`, `toast.error(msg, {description, duration})`,
`toast.warning(msg, {description, duration})`.

### Causa

`sonner` non compare in `package.json`. Metro fallisce la risoluzione →
bundle non generato. Anche se fosse installata, `sonner` richiede
`document` (DOM) e non funziona in React Native.

### Soluzione per `AuthContext.tsx`

Rimuovere la riga 13 (`import { toast as sonnerNotify } from 'sonner'`)
e aggiungere uno shim locale a livello di modulo, **prima della
definizione del context**:

```ts
// Shim temporaneo — rimpiazzare con react-native-toast-message nella fase UI
const sonnerNotify = {
  success: (message: string) => console.log('[toast:success]', message),
  error: (message: string) => console.error('[toast:error]', message),
}
```

Tutti i call site esistenti (`sonnerNotify.success(...)`,
`sonnerNotify.error(...)`) rimangono invariati. Zero modifiche alla logica.

### Soluzione per `AppDataContext.tsx`

Rimuovere la riga 8 (`import { toast } from 'sonner'`) e aggiungere uno
shim locale con la stessa firma del subset usato nel file:

```ts
// Shim temporaneo — rimpiazzare con react-native-toast-message nella fase UI
const toast = {
  success: (message: string) => console.log('[toast:success]', message),
  error: (message: string, opts?: { description?: string; duration?: number }) =>
    console.error('[toast:error]', message, opts?.description ?? ''),
  warning: (message: string, opts?: { description?: string; duration?: number }) =>
    console.warn('[toast:warning]', message, opts?.description ?? ''),
}
```

Tutti i 20+ call site rimangono invariati. Zero modifiche alla logica.

> **Perché uno shim basato su `console.*` e non su `Alert.alert`**: questa
> fase non introduce UI definitiva. `Alert.alert` è un componente nativo
> visivo e appartiene alla fase UI. Lo shim qui serve solo a mantenere il
> codice compilabile e tracciabile nei log durante il testing di avvio.

Il codice esatto dei due shim da inserire è il seguente.

**Shim per `AuthContext.tsx`** (sostituisce `import { toast as sonnerNotify } from 'sonner'`):

```ts
// Shim temporaneo — rimpiazzare con react-native-toast-message nella fase UI
const sonnerNotify = {
  success: (message: string) => console.log('[toast:success]', message),
  error: (message: string) => console.error('[toast:error]', message),
}
```

**Shim per `AppDataContext.tsx`** (sostituisce `import { toast } from 'sonner'`):

```ts
// Shim temporaneo — rimpiazzare con react-native-toast-message nella fase UI
const toast = {
  success: (message: string) => console.log('[toast:success]', message),
  error: (message: string, opts?: { description?: string; duration?: number }) =>
    console.error('[toast:error]', message, opts?.description ?? ''),
  warning: (message: string, opts?: { description?: string; duration?: number }) =>
    console.warn('[toast:warning]', message, opts?.description ?? ''),
}
```

I due shim coprono esattamente le varianti usate nei rispettivi file. Nessun call site esistente richiede modifica.

### Gate di verifica B3

```bash
npm start
```

Il log Metro non deve contenere `Unable to resolve module 'sonner'`.
Nessun errore TypeScript relativo a `sonner`.

---

## 6. B4 — Componente `Button` inesistente

### Stato attuale

**`AuthContext.tsx` riga 10:**

```ts
import { Button } from '@/components/ui/button'
```

`Button` è usato in 4 punti (righe 327, 329, 330, 332) all'interno del
blocco JSX del dialog inattività:

```tsx
<Button variant="outline" onClick={() => { ... }}>
  Rimani connesso
</Button>
<Button variant="destructive" onClick={() => { ... }}>
  Esci ora
</Button>
```

Questo blocco è racchiuso in `<div className="fixed ...">` con `<p>`
e `<div>` annidati — tutto JSX DOM-only invalido in React Native.

`src/components/` è completamente vuota.

### Causa

Due problemi sovrapposti:
1. Il file `src/components/ui/button.tsx` non esiste → errore Metro dopo
   la risoluzione dell'alias B1.
2. Il JSX del dialog inattività usa elementi DOM (`<div>`, `<p>`,
   `className`, `onClick`) che TypeScript segnala come errori in un
   progetto React Native puro.

### Soluzione — parte A: creare il placeholder `Button`

Creare **`src/components/ui/button.tsx`** con un componente minimo e
funzionante in React Native. Obiettivo: risolvere l'import senza
introdurre UI definitiva.

```tsx
import React from 'react'
import { TouchableOpacity, Text, type TouchableOpacityProps } from 'react-native'

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'outline' | 'destructive'
  children?: React.ReactNode
  /** Alias di onPress per compatibilità con il codice web esistente */
  onClick?: () => void
}

export function Button({
  variant: _variant,
  children,
  onClick,
  onPress,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress ?? onClick} {...props}>
      <Text>{children}</Text>
    </TouchableOpacity>
  )
}
```

Note di progetto:
- Il parametro `variant` è accettato ma ignorato (`_variant`) — sarà
  gestito nella fase UI.
- `onClick` è mappato su `onPress` per compatibilità con il codice
  esistente senza modifiche ai call site.
- Nessuno stile applicato: componente neutro dal punto di vista visivo.

> ⚠️ **`onClick` è un alias transitorio**: il parametro è accettato solo
> per compatibilità con il codice esistente e non deve essere usato in
> nuovo codice React Native. Agent-Plan deve sostituire ogni occorrenza
> di `onClick={...}` sui `<Button>` in `AuthContext.tsx` con
> `onPress={...}` nello stesso commit B4. Al termine del commit non
> devono esistere `onClick` su componenti React Native nel file.

### Soluzione — parte B: convertire il dialog inattività in JSX React Native

Il dialog inattività in `AuthContext.tsx` (righe 320–338 circa) usa
JSX DOM-only. Va convertito in primitivi React Native per rimuovere gli
errori TypeScript che impediscono la build.

**Struttura attuale (DOM):**

```tsx
{showWarning && isAuthenticated ? (
  <div className="fixed bottom-4 left-4 right-4 z-50 ..." role="alertdialog" aria-live="assertive" aria-label="...">
    <div className="flex flex-col gap-3 ...">
      <p className="text-sm text-foreground">La tua sessione scadrà tra 1 minuto. ...</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { resetTimer(); ... }}>
          Rimani connesso
        </Button>
        <Button variant="destructive" onClick={() => { void signOut() }}>
          Esci ora
        </Button>
      </div>
    </div>
  </div>
) : null}
```

**Struttura target (React Native — placeholder strutturale):**

```tsx
{showWarning && isAuthenticated ? (
  <View accessibilityRole="alert" accessibilityLabel="Avviso scadenza sessione">
    <Text>La tua sessione scadrà tra 1 minuto. Vuoi rimanere connesso?</Text>
    <View>
      <Button
        variant="outline"
        onPress={() => {
          resetTimer()
          // TODO: ripristinare l'annuncio screen reader quando screen-reader.ts sarà migrato a RN
          // screenReader.announceSuccess('Sessione mantenuta attiva.')
        }}
      >
        Rimani connesso
      </Button>
      <Button
        variant="destructive"
        onPress={() => { void signOut() }}
      >
        Esci ora
      </Button>
    </View>
  </View>
) : null}
```

Aggiungere alle import di `react-native` già presenti (o creare la riga):

```ts
import { View, Text } from 'react-native'
```

Note di progetto:
- `role="alertdialog"` diventa `accessibilityRole="alert"` (attributo RN).
- `aria-live` e `aria-label` diventano `accessibilityLabel` — il
  parametro `aria-live` non ha equivalente diretto: gli annunci screen
  reader saranno gestiti da `screenReader.announce*()` in una fase
  successiva, quando `screen-reader.ts` sarà migrato a React Native.
- Nessun posizionamento assoluto, nessuno stile → da definire nella
  fase UI con `StyleSheet.create`.

> ⚠️ **`screenReader.announceSuccess` rimosso temporaneamente**: la chiamata
> è commentata perché `screen-reader.ts` non è ancora migrato a React Native.
> Lasciare il codice attivo produrrebbe un errore runtime non rilevabile dal
> gate TypeScript. Quando `screen-reader.ts` sarà migrato, ripristinare la
> chiamata e aggiungere il relativo gate di verifica nel design di quella fase.

### Gate di verifica B4

```bash
npm start
```

Il log Metro non deve contenere `Unable to resolve module '@/components/ui/button'`.
Il type-checker TypeScript (`npx tsc --noEmit`) non deve segnalare errori
relativi a `<div>`, `<p>`, `className`, `onClick` in `AuthContext.tsx`.
Il type-checker non deve segnalare errori su `accessibilityRole="alert"` in `AuthContext.tsx`.
Verificare che il valore usato sia esattamente `"alert"` e non `"alertdialog"`: quest'ultimo
è un valore DOM valido ma non è incluso nell'enum `AccessibilityRole` di React Native e
produce errore TypeScript.

---

## 7. Riepilogo modifiche per file

| File | Operazione | Blocco risolto |
|------|-----------|----------------|
| `babel.config.js` | Aggiungere plugin `module-resolver` e `react-native-dotenv` | B1, B2, B6 |
| `package.json` | Aggiungere `babel-plugin-module-resolver` a devDeps; fix versione AsyncStorage | B1, B5 |
| `src/context/AuthContext.tsx` | Rimuovere import `sonner`; aggiungere shim locale; rimuovere import `Button`; convertire dialog JSX | B3, B4 |
| `src/context/AppDataContext.tsx` | Rimuovere import `sonner`; aggiungere shim locale | B3 |
| `src/components/ui/button.tsx` | **CREARE** — placeholder `Button` con `TouchableOpacity` | B4 |
| `src/lib/supabase/client.ts` | Cambio da `process.env.*` a `import from '@env'` (**fuori perimetro originale, indispensabile per B2**) | B2 |
| `src/env.d.ts` | **CREARE** — dichiarazione modulo `@env` per TypeScript | B2 |

---

## 8. `babel.config.js` — stato finale atteso

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        allowlist: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
        allowUndefined: false,
      },
    ],
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.js',
          '.android.js',
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
          '.json',
        ],
        alias: {
          '@': './src',
        },
      },
    ],
  ],
};
```

**Ordine dei plugin**: `react-native-dotenv` prima di `module-resolver`.
`react-native-dotenv` trasforma i riferimenti a `@env` prima che
`module-resolver` risolva gli alias `@/*` → nessun conflitto tra i due
plugin.

---

## 9. `package.json` — delta atteso

```diff
   "dependencies": {
-    "@react-native-async-storage/async-storage": "^3.0.2",
+    "@react-native-async-storage/async-storage": "^2.1.2",
     "@react-native/new-app-screen": "0.82.1",
```

```diff
   "devDependencies": {
     "@babel/core": "^7.25.2",
+    "babel-plugin-module-resolver": "^5.0.3",
```

---

## 10. Gate di verifica globale

Dopo l'applicazione di tutti e 6 i fix, eseguire in sequenza:

```bash
# 1. Installazione dipendenze
npm install

# 2. Verifica TypeScript (zero errori relativi ai blocchi B1–B6)
npx tsc --noEmit

# 3. Avvio Metro
npm start

# 4. Build Android (test del bundling completo)
npm run android
```

**Criteri di accettazione:**
- `npm install` → codice uscita 0, `node_modules/@react-native-async-storage/async-storage` presente
- `npx tsc --noEmit` → nessun errore `TS2307 Cannot find module 'sonner'`, `TS2307 Cannot find module '@/components/ui/button'`, errori `<div>` / `className`; nessun errore su `accessibilityRole` in `AuthContext.tsx` (verificare che il valore usato sia `"alert"` e non `"alertdialog"`)
- `npm start` → Metro avvia senza errori di risoluzione moduli
- `npm run android` (o `npm run ios`) → bundle generato, app avviabile sul simulatore

> ⚠️ **Perimetro del gate**: la verifica si considera completa se Metro non
> produce errori sui moduli B1–B6. I provider in `src/context/` **non devono
> essere montati in `App.tsx` durante questa fase**: farlo esporrebbe i
> problemi del Gruppo 2 (in particolare N6 in `useInactivityTimer` e N8 in
> `AuthContext.tsx` — `document.querySelector` e
> `document.documentElement.getAttribute`) che saranno affrontati nel
> documento di design successivo. Il gate di questa fase verifica la
> correttezza della configurazione, non il funzionamento dei provider.

---

## 11. Note per Agent-Plan

1. I fix B1, B2, B5 toccano solo `babel.config.js` e `package.json` →
   candidati a un singolo commit `fix(config): risolvi B1 B2 B5 blocchi avvio`.

2. La modifica fuori perimetro a `src/lib/supabase/client.ts` e la
   creazione di `src/env.d.ts` sono **atomicamente legate** a B2 →
   stesso commit.

3. B3 (`AppDataContext` + `AuthContext` — solo gli import `sonner`) →
   secondo commit `fix(context): rimuovi import sonner (B3)`.

4. B4 (nuovo file `Button` + fix JSX dialog in `AuthContext`) →
   terzo commit `fix(context): crea Button placeholder, converti dialog RN (B4)`.

5. **Dopo il completamento di B1–B6, il primo problema da affrontare è N6**
   (`useInactivityTimer` — usa `document.addEventListener`, classificato
   come non bloccante nel report ma che diventa bloccante de facto al primo
   mount di `AuthProvider`). L'app si avvierà correttamente dopo questi tre
   commit, ma presenterà un crash immediato non appena `AuthProvider` verrà
   montato in `App.tsx`. N6 appartiene al Gruppo 2 e deve essere la prima
   voce affrontata in quel documento di design.

6. **Non procedere** verso Agent-Plan prima della revisione di questo
   documento da parte dell'utente.
