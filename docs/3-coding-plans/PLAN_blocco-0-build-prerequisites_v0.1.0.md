---
title: "PLAN — blocco-0-build-prerequisites"
version: "v0.1.0"
status: READY
priority: critical
branch: fix/blocco-0-build-prerequisites
created: 2026-05-12
author: Agent-Plan
---

# PLAN — blocco-0: Build Prerequisites

## Contesto

Il progetto ZecchinoReact (React Native 0.82.1, backend Supabase) non compila
per due ragioni infrastrutturali bloccanti:

1. `babel.config.js` non registra i plugin necessari per path alias (`@/*`) e
   variabili d'ambiente (`process.env.SUPABASE_*`).
2. `.gitignore` non protegge i file `.env` / `.env.local` dal commit accidentale.

Questo piano risolve entrambe le criticità senza modificare alcun contratto
pubblico esistente (esportazione `supabase`, lettura `process.env.*`).

## File coinvolti

| File | Operazione | Note |
|------|-----------|------|
| `package.json` | MODIFY | Aggiungere `babel-plugin-module-resolver` a devDependencies |
| `babel.config.js` | MODIFY | Registrare `react-native-dotenv` e `module-resolver` |
| `.gitignore` | MODIFY | Appendere `.env` e `.env.local` nella sezione `# node.js` |
| `.env.example` | CREATE | File documentativo in root, senza valori reali |

## Fasi

---

### Fase 1 — Aggiungere babel-plugin-module-resolver a devDependencies

**File:** `package.json`  
**Operazione:** MODIFY  
**Dipendenze:** nessuna  

**Azione precisa:**  
Aggiungere alla sezione `devDependencies` la voce:

```json
"babel-plugin-module-resolver": "^5.0.2"
```

La voce va inserita in ordine alfabetico tra le dipendenze esistenti
(dopo `"@types/react-test-renderer"` e prima di `"eslint"`).

**Verifica inline:**
```bash
npm install
npm ls babel-plugin-module-resolver
# Output atteso: ZecchinoReact@0.0.1 → babel-plugin-module-resolver@5.x.x
```

**Rischio:** basso — aggiunta pura, nessuna dipendenza rimossa.

---

### Fase 2 — Registrare i plugin in babel.config.js

**File:** `babel.config.js`  
**Operazione:** MODIFY  
**Dipendenze:** Fase 1 (babel-plugin-module-resolver installato)  

**Stato attuale del file (intero):**
```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
```

**Stato target del file (intero):**
```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
      },
    ],
    [
      'module:react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
        allowUndefined: false,
      },
    ],
  ],
};
```

**Nota contrattuale:** `src/lib/supabase/client.ts` legge
`process.env.SUPABASE_URL` e `process.env.SUPABASE_ANON_KEY` — nessuna
modifica richiesta su quel file. La configurazione `react-native-dotenv`
inietta le variabili sia tramite `@env` sia tramite `process.env` (comportamento
predefinito del plugin con `allowUndefined: false`).

**Verifica inline:**
```bash
node -e "require('./babel.config.js')" && echo "OK"
# Output atteso: OK (nessun errore di parsing)
```

**Rischio:** medio — modifica core della pipeline di transpilazione. Richiede
reset della cache Metro dopo il cambio (`npm start -- --reset-cache`).

---

### Fase 3 — Proteggere .env in .gitignore

**File:** `.gitignore`  
**Operazione:** MODIFY (append)  
**Dipendenze:** nessuna (indipendente)  

**Sezione target da modificare (attuale):**
```
# node.js
#
node_modules/
npm-debug.log
yarn-error.log
```

**Sezione target dopo modifica:**
```
# node.js
#
node_modules/
npm-debug.log
yarn-error.log

# Variabili d'ambiente — mai committare segreti
.env
.env.local
.env.*.local
```

**Verifica inline:**
```bash
# Crea un .env vuoto di test, poi controlla che git lo ignori
echo "TEST=1" > .env
git status
# Output atteso: .env NON compare tra i file tracciati
# Cleanup:
del .env   # oppure: Remove-Item .env
```

**Rischio:** basso — append puro, nessuna regola rimossa.

---

### Fase 4 — Creare .env.example documentativo

**File:** `.env.example`  
**Operazione:** CREATE  
**Dipendenze:** nessuna  

**Contenuto del file:**
```
# .env.example — Copia in .env.local e compila con i valori reali.
# Questo file è versionato. NON inserire mai segreti qui.

SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<anon-key-pubblica>
```

**Verifica inline:**
```bash
git status
# Output atteso: .env.example compare come file nuovo non tracciato (o staged)
# — MA NON .env né .env.local
```

**Rischio:** nessuno — file puramente documentativo.

---

## Test plan di completamento

Eseguire nell'ordine dopo aver completato tutte le fasi:

```bash
# T1 — TypeScript: path alias risolti
npx tsc --noEmit
# Atteso: zero errori TS2307 "Cannot find module '@/*'"

# T2 — Metro bundler: avvio senza crash
npm start -- --reset-cache
# Atteso: nessun "Unable to resolve module '@/*'" negli errori iniziali

# T3 — Git: .env non tracciato
echo "SUPABASE_URL=test" > .env
git status
# Atteso: .env non compare in "Changes to be committed" né "Untracked files"
Remove-Item .env

# T4 — Sintassi babel.config.js
node -e "require('./babel.config.js')" && echo "babel OK"
# Atteso: "babel OK"

# T5 — Dipendenza installata
npm ls babel-plugin-module-resolver
# Atteso: package nella dependency tree
```

## Gate di completamento (status → DONE)

- [ ] T1 `npx tsc --noEmit` passa senza errori `@/*`
- [ ] T2 Metro bundler avvia senza crash su path alias
- [ ] T3 `.env` non appare in `git status`
- [ ] T4 `babel.config.js` valido sintatticamente
- [ ] T5 `babel-plugin-module-resolver` installato

## Note per Agent-Code

- Eseguire le fasi nell'ordine: 1 → 2 → 3 → 4 (Fase 3 e 4 sono indipendenti
  tra loro ma dipendono entrambe concettualmente da Fase 1+2).
- Dopo Fase 2, sempre lanciare Metro con `--reset-cache`.
- Non modificare `src/lib/supabase/client.ts` — il contratto `process.env.*`
  è preservato dalla configurazione del plugin.
- Non modificare `tsconfig.json` — i path sono già configurati correttamente.
