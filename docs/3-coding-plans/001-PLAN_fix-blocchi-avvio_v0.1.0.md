---
tipo: coding-plan
titolo: Fix blocchi di avvio — Gruppo 1 (B1–B6)
versione: 0.1.0
data: 2026-05-13
stato: IMPLEMENTED
sorgente: docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md
branch-suggerito: fix/blocchi-avvio-b1-b6
---

# PLAN — Fix blocchi di avvio (v0.1.0)

> **Fonte di verità**: ogni decisione tecnica di questo piano è derivata
> direttamente da
> [docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md](../2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md).
> In caso di discrepanza, il documento di design prevale.

---

## Executive Summary

| Campo | Valore |
|-------|--------|
| Tipo di intervento | Configurazione Babel/Metro e correzione dipendenze npm |
| Priorità | **CRITICA** — sblocca tutto il resto (build, avvio app, ogni altra fase) |
| Versione target | 0.1.0 |
| UI introdotta | Nessuna |
| Componenti definitivi | Nessuno (solo placeholder strutturali) |
| Numero di commit | 3 |
| File modificati | 5 (MODIFY) + 2 (CREATE) = 7 totali |

L'app React Native non è avviabile nello stato attuale a causa di sei
problemi bloccanti (B1–B6) nei file di configurazione e nelle dipendenze.
Questo piano risolve tutti e sei in tre commit sequenziali. Al termine,
Metro può avviare il bundle e l'app è compilabile. I provider in
`src/context/` **non devono essere montati in `App.tsx`** durante questa
fase: farlo esporrebbe i problemi del Gruppo 2, affrontati nel documento
di design successivo.

---

## File coinvolti

| File | Operazione | Blocco/i |
|------|-----------|----------|
| `babel.config.js` | MODIFY — aggiungere plugin `module-resolver` e `react-native-dotenv` | B1, B2, B6 |
| `package.json` | MODIFY — aggiungere `babel-plugin-module-resolver` a devDeps; fix versione AsyncStorage | B1, B5 |
| `src/lib/supabase/client.ts` | MODIFY — da `process.env.*` a `import from '@env'` (fuori perimetro originale, indispensabile per B2) | B2 |
| `src/env.d.ts` | CREATE — dichiarazione modulo `@env` per TypeScript | B2 |
| `src/context/AuthContext.tsx` | MODIFY — rimuovere import `sonner`; aggiungere shim locale (Fase 2) | B3 |
| `src/context/AuthContext.tsx` | MODIFY — rimuovere import `Button` DOM; convertire dialog JSX da DOM a RN (Fase 3) | B4 |
| `src/context/AppDataContext.tsx` | MODIFY — rimuovere import `sonner`; aggiungere shim locale | B3 |
| `src/components/ui/button.tsx` | CREATE — placeholder `Button` con `TouchableOpacity` | B4 |

---

## Grafo delle dipendenze (dall'DESIGN §1)

```
B1 ──┐
     ├──► [Metro risolve i moduli] ──► B3 ──► App avviabile
B2 ──┘                            ──► B4 ──┘
          │
B5 ──────► [npm install completo, node_modules coerente]
```

**B6 è risolto da B2** — non richiede azione aggiuntiva.
B5 deve essere applicato prima di `npm install`.
B3 e B4 richiedono B1 come precondizione.

---

## Fase 1 — B1 + B2 + B5 (commit unico)

**Suggerimento commit**: `fix(config): risolvi B1 B2 B5 blocchi avvio`

### File toccati

1. `babel.config.js`
2. `package.json`
3. `src/lib/supabase/client.ts`
4. `src/env.d.ts` *(CREATE)*

### Modifiche

#### `babel.config.js` — stato finale atteso (B1 + B2)

Aggiungere due plugin. Ordine obbligatorio: `react-native-dotenv` prima
di `module-resolver`.

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

#### `package.json` — delta atteso (B1 + B5)

```diff
   "dependencies": {
-    "@react-native-async-storage/async-storage": "^3.0.2",
+    "@react-native-async-storage/async-storage": "^2.1.2",
```

```diff
   "devDependencies": {
     "@babel/core": "^7.25.2",
+    "babel-plugin-module-resolver": "^5.0.3",
```

#### `src/lib/supabase/client.ts` — cambio pattern env (B2)

```ts
// Prima
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

// Dopo
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'
const supabaseUrl = SUPABASE_URL
const supabaseAnonKey = SUPABASE_ANON_KEY
```

#### `src/env.d.ts` — contenuto completo (B2)

```ts
declare module '@env' {
  export const SUPABASE_URL: string
  export const SUPABASE_ANON_KEY: string
}
```

Prima di eseguire `npm start` creare `.env` nella root con:

```
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_ANON_KEY=placeholder_key
```

### Gate di verifica — Fase 1

> **Se un gate fallisce:** tenta di correggerti autonomamente solo se l'errore riguarda un file già nel perimetro di questa fase (vedere i file elencati nell'intestazione della fase). Se l'errore riguarda un file fuori perimetro, fermati, riporta il testo esatto dell'errore e attendi istruzioni. Non modificare file non elencati nel perimetro della fase corrente.

**Gate B1:**
```bash
npm start
```
Metro non deve produrre errori `Unable to resolve module '@/...'`.
Ogni import con prefisso `@/` deve risolvere correttamente nel bundle log.

**Gate B2/B6:**
```bash
npm start
```
`client.ts` non deve più lanciare `Error: SUPABASE_URL mancante`.
Il log Metro non deve contenere errori relativi a variabili env undefined.

**Gate B5:**
```bash
npm install
```
Il comando deve terminare con codice di uscita 0, senza `ETARGET` o
`No matching version found`. La directory `node_modules/@react-native-async-storage/`
deve esistere e contenere `async-storage/`.

---

## Fase 2 — B3 (commit unico)

**Suggerimento commit**: `fix(context): rimuovi import sonner (B3)`

### File toccati

1. `src/context/AuthContext.tsx`
2. `src/context/AppDataContext.tsx`

### Modifiche

#### `src/context/AuthContext.tsx` (B3)

Rimuovere la riga 13:
```ts
import { toast as sonnerNotify } from 'sonner'
```

Aggiungere, prima della definizione del context, lo shim locale:
```ts
// Shim temporaneo — rimpiazzare con react-native-toast-message nella fase UI
const sonnerNotify = {
  success: (message: string) => console.log('[toast:success]', message),
  error: (message: string) => console.error('[toast:error]', message),
}
```

I 6 call site esistenti (`sonnerNotify.success(...)`, `sonnerNotify.error(...)`)
rimangono invariati. Zero modifiche alla logica.

#### `src/context/AppDataContext.tsx` (B3)

Rimuovere la riga 8:
```ts
import { toast } from 'sonner'
```

Aggiungere, prima della definizione del context, lo shim locale:
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

I 20+ call site esistenti rimangono invariati. Zero modifiche alla logica.

### Gate di verifica — Fase 2

> **Se un gate fallisce:** tenta di correggerti autonomamente solo se l'errore riguarda un file già nel perimetro di questa fase (vedere i file elencati nell'intestazione della fase). Se l'errore riguarda un file fuori perimetro, fermati, riporta il testo esatto dell'errore e attendi istruzioni. Non modificare file non elencati nel perimetro della fase corrente.

**Gate B3:**
```bash
npm start
```
Il log Metro non deve contenere `Unable to resolve module 'sonner'`.
Nessun errore TypeScript relativo a `sonner`.

---

## Fase 3 — B4 (commit unico)

**Suggerimento commit**: `fix(context): crea Button placeholder, converti dialog RN (B4)`

### File toccati

1. `src/components/ui/button.tsx` *(CREATE)*
2. `src/context/AuthContext.tsx`

### Modifiche

#### `src/components/ui/button.tsx` — contenuto completo (B4-A)

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

> ⚠️ `onClick` è un alias **transitorio**: non usare in nuovo codice RN.
> Sostituire ogni occorrenza di `onClick={...}` in `AuthContext.tsx` con
> `onPress={...}` nello stesso commit. Al termine non devono esistere
> `onClick` su componenti React Native nel file.

#### `src/context/AuthContext.tsx` — conversione dialog (B4-B)

**Rimuovere** la riga 10:
```ts
import { Button } from '@/components/ui/button'
```
Mantenere l'import (punta ora al file appena creato). Non è necessario
rimuovere e ri-aggiungere: il file risolto sarà quello nuovo.

**Aggiungere** `View` e `Text` alle import `react-native` esistenti:
```ts
import { View, Text } from 'react-native'
```

**Sostituire** il blocco JSX del dialog inattività (righe 320–338 circa)
da struttura DOM a struttura React Native:

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

Nota: `accessibilityRole="alert"` — usare esattamente `"alert"`, non
`"alertdialog"`. Il valore `"alertdialog"` è DOM valido ma non è incluso
nell'enum `AccessibilityRole` di React Native e produce errore TypeScript.

### Gate di verifica — Fase 3

> **Se un gate fallisce:** tenta di correggerti autonomamente solo se l'errore riguarda un file già nel perimetro di questa fase (vedere i file elencati nell'intestazione della fase). Se l'errore riguarda un file fuori perimetro, fermati, riporta il testo esatto dell'errore e attendi istruzioni. Non modificare file non elencati nel perimetro della fase corrente.

**Gate B4:**
```bash
npm start
```
Il log Metro non deve contenere `Unable to resolve module '@/components/ui/button'`.

```bash
npx tsc --noEmit
```
Non deve segnalare errori relativi a `<div>`, `<p>`, `className`,
`onClick` in `AuthContext.tsx`. Non deve segnalare errori su
`accessibilityRole="alert"` in `AuthContext.tsx`.

---

## Gate di verifica globale

> **Se un gate fallisce:** tenta di correggerti autonomamente solo se l'errore riguarda un file già nel perimetro di questa fase (vedere i file elencati nell'intestazione della fase). Se l'errore riguarda un file fuori perimetro, fermati, riporta il testo esatto dell'errore e attendi istruzioni. Non modificare file non elencati nel perimetro della fase corrente.

Dopo l'applicazione di tutti e 6 i fix, eseguire in sequenza:

```bash
# 1. Installazione dipendenze
npm install

# 2. Verifica TypeScript
npx tsc --noEmit

# 3. Avvio Metro
npm start

# 4. Build Android
npm run android
```

**Criteri di accettazione:**

- `npm install` → codice uscita 0, `node_modules/@react-native-async-storage/async-storage` presente
- `npx tsc --noEmit` → nessun errore `TS2307 Cannot find module 'sonner'`, `TS2307 Cannot find module '@/components/ui/button'`, errori `<div>` / `className`; nessun errore su `accessibilityRole` in `AuthContext.tsx` (verificare che il valore usato sia `"alert"` e non `"alertdialog"`)
- `npm start` → Metro avvia senza errori di risoluzione moduli
- `npm run android` (o `npm run ios`) → bundle generato, app avviabile sul simulatore

> ⚠️ **Perimetro del gate**: i provider in `src/context/` **non devono
> essere montati in `App.tsx` durante questa fase**. Farlo esporrebbe i
> problemi del Gruppo 2 (in particolare N6 in `useInactivityTimer` e N8
> in `AuthContext.tsx`) che saranno affrontati nel documento di design
> successivo. Il gate verifica la correttezza della configurazione, non
> il funzionamento dei provider.

---

## Prossimo passo dopo B1–B6

Dopo il completamento di questa fase, il **primo problema da affrontare
nel Gruppo 2 è N6** (`useInactivityTimer` — usa `document.addEventListener`,
classificato come non bloccante nel report di diagnosi ma che diventa
bloccante de facto al primo mount di `AuthProvider` in `App.tsx`).

L'app sarà compilabile dopo questi tre commit, ma presenterà un crash
immediato nel momento in cui `AuthProvider` verrà montato. N6 deve essere
la prima voce affrontata nel documento di design del Gruppo 2.
