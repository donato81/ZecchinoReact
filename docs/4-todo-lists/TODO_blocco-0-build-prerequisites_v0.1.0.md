---
title: "TODO — blocco-0-build-prerequisites"
version: "v0.1.0"
plan: "docs/3-coding-plans/PLAN_blocco-0-build-prerequisites_v0.1.0.md"
status: READY
priority: critical
branch: fix/blocco-0-build-prerequisites
created: 2026-05-12
assignee: Agent-Code
---

# TODO — blocco-0: Build Prerequisites

> **Fonte di verità:** [PLAN_blocco-0-build-prerequisites_v0.1.0.md](../3-coding-plans/PLAN_blocco-0-build-prerequisites_v0.1.0.md)  
> Leggere il PLAN prima di iniziare. Ogni fase è atomica e va completata
> (con verifica inline superata) prima di passare alla successiva.

---

## Istruzioni operative per Agent-Code

1. Leggi l'intero PLAN prima di scrivere qualsiasi file.
2. Esegui le fasi nell'ordine indicato (1 → 2 → 3 → 4).
3. Dopo ogni fase, esegui la **verifica inline** del PLAN prima di spuntare.
4. Dopo Fase 2, avvia sempre Metro con `--reset-cache`.
5. NON modificare `src/lib/supabase/client.ts`, `tsconfig.json` o qualsiasi
   altro file non elencato nel PLAN.
6. Al termine di tutte le fasi, esegui il **Test plan completo** e aggiorna
   i gate di completamento nel PLAN.

---

## Checklist

### Fase 1 — package.json: aggiungere babel-plugin-module-resolver

- [ ] Aperto `package.json`
- [ ] Aggiunta entry `"babel-plugin-module-resolver": "^5.0.2"` in `devDependencies`
- [ ] Eseguito `npm install`
- [ ] Verifica: `npm ls babel-plugin-module-resolver` mostra il package

---

### Fase 2 — babel.config.js: registrare i plugin

- [ ] Aperto `babel.config.js`
- [ ] Aggiunto plugin `module-resolver` con alias `@` → `./src`
- [ ] Aggiunto plugin `module:react-native-dotenv` con path `.env`
- [ ] Verifica sintattica: `node -e "require('./babel.config.js')" && echo "OK"`

---

### Fase 3 — .gitignore: proteggere .env

- [ ] Aperto `.gitignore`
- [ ] Appese righe `.env`, `.env.local`, `.env.*.local` dopo `yarn-error.log`
- [ ] Verifica: `echo TEST=1 > .env` poi `git status` — `.env` non compare
- [ ] Rimosso `.env` di test (`Remove-Item .env`)

---

### Fase 4 — .env.example: creare file documentativo

- [ ] Creato `.env.example` in root con variabili `SUPABASE_URL` e `SUPABASE_ANON_KEY`
- [ ] Il file contiene placeholder, non valori reali
- [ ] Verifica: `git status` mostra `.env.example` come nuovo file (non `.env`)

---

## Test plan di completamento

Eseguire solo dopo aver spuntato **tutte** le fasi sopra:

- [ ] **T1** `npx tsc --noEmit` — zero errori TS2307 su `@/*`
- [ ] **T2** `npm start -- --reset-cache` — Metro avvia senza crash
- [ ] **T3** `.env` non tracciato da git (verifica via `git status`)
- [ ] **T4** `node -e "require('./babel.config.js')" && echo "babel OK"` — stampa `babel OK`
- [ ] **T5** `npm ls babel-plugin-module-resolver` — package presente

---

## Stato finale

- [ ] Tutte le fasi completate
- [ ] Tutti i test di completamento superati
- [ ] Gate nel PLAN aggiornati a `[x]`
- [ ] Branch `fix/blocco-0-build-prerequisites` pronto per commit
