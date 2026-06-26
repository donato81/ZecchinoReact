---
titolo: TODO 020 - Centralizzazione design tokens: colori e chiavi icone
versione: 0.2.0
data: 2026-06-26
stato: DONE
piano_riferimento: docs/3-coding-plans/020-PLAN_icone-colori-design-system_v0.2.0.md
design_riferimento: docs/2-projects/020-DESIGN_icone-colori-design-system_v0.2.0.md
autore: Agent-Orchestrator
---

# TODO 020 - Centralizzazione design tokens: colori e chiavi icone

## 1. Stato e Gate Bloccante

- Gate bloccante: I 16 valori oklch devono essere convertiti in hex validi (Precondizione P-020).
- Verifica architetturale obbligatoria: nessun colore definito direttamente fuori da `colors.ts`.
- Stato corrente: DONE

## 2. Stato Task (panoramica)

| ID task | Titolo | Stato | Note |
| --- | --- | --- | --- |
| P-020 | Conversione colori oklch → hex | DONE | Valori definitivi in esadecimale da confermare |
| T1 | Creare `design-tokens/colors.ts` | DONE | File centrale dei token |
| T2 | Modificare `budget-templates.ts` | DONE | Tipi, colori, chiavi, rimozione phosphor |
| T3 | Modificare `constants.ts` | DONE | Colori categorie account |
| T4 | Rimuovere phosphor da package.json | DONE | Rimozione dipendenza non nativa |

## 3. Task Atomici

### P-020
- Azione: Verificare e confermare i 16 colori hex convertiti nel DESIGN 020 (Sezione 6).
- Task Status: [x] DONE — 2026-06-26 — hex convertiti in sessione, valori definitivi in DESIGN 020 Sezione 6

### T1
- Azione: Creare il file centrale dei design token `colors.ts` popolato con i valori hex convertiti, esportando `DESIGN_COLORS` e i tipi `BudgetColorToken`, `AccountCategoryColorToken`, `BudgetTemplateIconKey`.
- File target: src/lib/design-tokens/colors.ts
- Dipende da: P-020
- Metrica di successo: Il file esporta costanti TypeScript tipizzate e 11 chiavi icona semantiche.
- Task Status: [x] DONE — 2026-06-26 — Antigravity

### T2
- Azione: Aggiornare `BudgetTemplate` per usare `iconKey: BudgetTemplateIconKey` e `color: string`. Sostituire le definizioni dei template usando i valori in `DESIGN_COLORS.budget` e le nuove chiavi semantiche. Rimuovere gli import di `@phosphor-icons/react`.
- File target: src/lib/budget-templates.ts
- Dipende da: T1
- Metrica di successo: Nessun import da `@phosphor-icons/react`, nessun valore `oklch()`.
- Task Status: [x] DONE — 2026-06-26 — Antigravity

### T3
- Azione: Aggiornare `ACCOUNT_CATEGORIES` sostituendo i valori `oklch()` con i token corrispondenti da `DESIGN_COLORS.accountCategory`.
- File target: src/lib/constants.ts
- Dipende da: T1
- Metrica di successo: Nessun valore `oklch()` hardcoded nel file.
- Task Status: [x] DONE — 2026-06-26 — Antigravity

### T4
- Azione: Rimuovere la dipendenza `@phosphor-icons/react` dal package.json.
- File target: package.json
- Dipende da: T2
- Metrica di successo: `@phosphor-icons/react` rimossa dalle dipendenze.
- Task Status: [x] DONE — 2026-06-26 — Antigravity

## 4. Note Operative

- I nomi delle chiavi icone devono essere scritti esattamente come definiti in DESIGN 020 (es: `overall-budget`, `groceries`).
- `DESIGN_COLORS.budget.overallBudget` e `DESIGN_COLORS.accountCategory.banking` hanno colore identico ma restano chiavi separate.

## 5. Log di Validazione

| 2026-06-26 | P-020 | Antigravity | PASS | Convertiti in design doc |
| 2026-06-26 | T1 | Antigravity | PASS | `colors.ts` creato |
| 2026-06-26 | T2 | Antigravity | PASS | refactoring template |
| 2026-06-26 | T3 | Antigravity | PASS | refactoring categorie |
| 2026-06-26 | T4 | Antigravity | PASS | `npm uninstall` eseguito |

## 6. Gate di Chiusura

- G-020-1 | Verifica: nessun import residuo da `@phosphor-icons/react`. | Comando: grep -Rn "@phosphor-icons/react" src/ | Gate Status: [x] PASSED
- G-020-2 | Verifica: nessun valore `oklch(` residuo nel codice sorgente. | Comando: grep -Rn "oklch(" src/ | Gate Status: [x] PASSED
- G-020-3 | Verifica: compilazione Typescript passa senza errori. | Comando: npx tsc --noEmit | Gate Status: [x] PASSED
- G-020-4 | Verifica: i test unitari passano. | Comando: npm test -- --runInBand | Gate Status: [x] PASSED

## 7. Riferimenti

- docs/2-projects/020-DESIGN_icone-colori-design-system_v0.2.0.md
- docs/3-coding-plans/020-PLAN_icone-colori-design-system_v0.2.0.md


## 8. Dichiarazione di Completamento

- Data completamento: 2026-06-26
- Completato da: Antigravity
- Stato finale: COMPLETATO
- Note: Tutte le dipendenze web DOM-only legate a Phosphor Icons e i colori OKLCH sono stati convertiti e migrati con successo al nuovo design system compatibile con React Native.