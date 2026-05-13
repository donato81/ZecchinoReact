---
tipo: todo
titolo: Fix blocchi di avvio — Gruppo 1 (B1–B6)
versione: 0.1.0
data: 2026-05-13
stato: ACTIVE
coding-plan: docs/3-coding-plans/001-PLAN_fix-blocchi-avvio_v0.1.0.md
design: docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md
---

# TODO — Fix blocchi di avvio (v0.1.0)

> Fonte di verità: [docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md](../2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md)
> Coding plan: [docs/3-coding-plans/001-PLAN_fix-blocchi-avvio_v0.1.0.md](../3-coding-plans/001-PLAN_fix-blocchi-avvio_v0.1.0.md)

---

## Fase 1 — B1 + B2 + B5

*Commit: `fix(config): risolvi B1 B2 B5 blocchi avvio`*
*File: `babel.config.js`, `package.json`, `src/lib/supabase/client.ts`, `src/env.d.ts`*

- [ ] Aggiungere plugin `module:react-native-dotenv` in `babel.config.js` come primo elemento di `plugins` (con `moduleName: '@env'`, `path: '.env'`, `allowlist: ['SUPABASE_URL', 'SUPABASE_ANON_KEY']`, `allowUndefined: false`)
- [ ] Aggiungere plugin `module-resolver` in `babel.config.js` come secondo elemento di `plugins` (con `root: ['./src']`, `alias: { '@': './src' }`, e le estensioni previste dal DESIGN)
- [ ] Aggiungere `"babel-plugin-module-resolver": "^5.0.3"` a `devDependencies` in `package.json`
- [ ] Correggere versione AsyncStorage da `"^3.0.2"` a `"^2.1.2"` in `dependencies` di `package.json`
- [ ] Aggiornare `src/lib/supabase/client.ts`: sostituire `process.env.SUPABASE_URL` e `process.env.SUPABASE_ANON_KEY` con `import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'` e usare le costanti importate
- [ ] Creare `src/env.d.ts` con la dichiarazione `declare module '@env' { export const SUPABASE_URL: string; export const SUPABASE_ANON_KEY: string }`
- [ ] Creare `.env` nella root con valori placeholder (`SUPABASE_URL=https://placeholder.supabase.co`, `SUPABASE_ANON_KEY=placeholder_key`)
- [ ] Eseguire `npm install` e verificare gate B5: codice uscita 0, nessun `ETARGET`, `node_modules/@react-native-async-storage/async-storage` presente
- [ ] Verificare gate B1/B2: `npm start` non produce errori `Unable to resolve module '@/...'` né errori su variabili env undefined

---

## Fase 2 — B3

*Commit: `fix(context): rimuovi import sonner (B3)`*
*File: `src/context/AuthContext.tsx`, `src/context/AppDataContext.tsx`*

- [ ] In `src/context/AuthContext.tsx`: rimuovere la riga `import { toast as sonnerNotify } from 'sonner'` e aggiungere prima della definizione del context il seguente shim:
  ```ts
  // Shim temporaneo — rimpiazzare con react-native-toast-message nella fase UI
  const sonnerNotify = {
    success: (message: string) => console.log('[toast:success]', message),
    error: (message: string) => console.error('[toast:error]', message),
  }
  ```
- [ ] In `src/context/AppDataContext.tsx`: rimuovere la riga `import { toast } from 'sonner'` e aggiungere prima della definizione del context il seguente shim:
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
- [ ] Verificare gate B3: `npm start` non produce `Unable to resolve module 'sonner'`; `npx tsc --noEmit` non segnala errori TypeScript relativi a `sonner`

---

## Fase 3 — B4

*Commit: `fix(context): crea Button placeholder, converti dialog RN (B4)`*
*File: `src/components/ui/button.tsx` (CREATE), `src/context/AuthContext.tsx`*

- [ ] Creare `src/components/ui/button.tsx` con il componente placeholder `Button` basato su `TouchableOpacity` (interfaccia: `variant?`, `children?`, `onClick?` alias transitorio, `onPress` da `TouchableOpacityProps`) esattamente come descritto nella sezione 6-A del documento di design
- [ ] In `src/context/AuthContext.tsx`: aggiungere `View` e `Text` alle import da `react-native`
- [ ] In `src/context/AuthContext.tsx`: sostituire il dialog inattività da JSX DOM (`<div>`, `<p>`, `className`, `role="alertdialog"`) con JSX React Native (`<View accessibilityRole="alert">`, `<Text>`, `<Button onPress={...}>`) esattamente come da struttura target nella sezione 6-B del documento di design
- [ ] In `src/context/AuthContext.tsx`: sostituire tutti i `onClick={...}` sui `<Button>` con `onPress={...}` — al termine non devono esistere `onClick` su componenti React Native nel file
- [ ] Verificare gate B4: `npm start` non produce `Unable to resolve module '@/components/ui/button'`; `npx tsc --noEmit` non segnala errori relativi a `<div>`, `<p>`, `className`, `onClick`, né errori su `accessibilityRole="alert"` in `AuthContext.tsx`

---

## Gate di verifica globale

*Eseguire in sequenza dopo il completamento delle tre fasi:*

- [ ] `npm install` → codice uscita 0, `node_modules/@react-native-async-storage/async-storage` presente
- [ ] `npx tsc --noEmit` → nessun errore `TS2307 Cannot find module 'sonner'`, `TS2307 Cannot find module '@/components/ui/button'`, errori `<div>` / `className`; nessun errore su `accessibilityRole` in `AuthContext.tsx` (verificare che il valore usato sia `"alert"` e non `"alertdialog"`)
- [ ] `npm start` → Metro avvia senza errori di risoluzione moduli
- [ ] `npm run android` (o `npm run ios`) → bundle generato, app avviabile sul simulatore

---

## Note per code-Agent-Code

> **Se un gate fallisce:** tenta di correggerti autonomamente solo se l'errore riguarda un file già nel perimetro di questa fase (vedere i file elencati nell'intestazione della fase). Se l'errore riguarda un file fuori perimetro, fermati, riporta il testo esatto dell'errore e attendi istruzioni. Non modificare file non elencati nel perimetro della fase corrente.

> ⚠️ **I provider in `src/context/` non devono essere montati in
> `App.tsx` durante questa fase.** Farlo esporrebbe i problemi del
> Gruppo 2 (in particolare N6 in `useInactivityTimer` —
> `document.addEventListener` — e N8 in `AuthContext.tsx` —
> `document.querySelector` e `document.documentElement.getAttribute`),
> che saranno affrontati nel documento di design successivo. Il gate di
> questa fase verifica la correttezza della configurazione, non il
> funzionamento dei provider.

Dopo il completamento di B1–B6, il primo problema da affrontare nel
Gruppo 2 è **N6** (`useInactivityTimer`). L'app sarà compilabile dopo
questi tre commit, ma presenterà un crash immediato non appena
`AuthProvider` verrà montato in `App.tsx`.
