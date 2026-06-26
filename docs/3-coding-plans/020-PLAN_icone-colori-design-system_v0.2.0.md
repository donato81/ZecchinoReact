---
titolo: PLAN 020 - Centralizzazione design tokens: colori e chiavi icone
id: 020
versione: 0.2.0
data: 2026-06-26
stato: DRAFT
design_riferimento: docs/2-projects/020-DESIGN_icone-colori-design-system_v0.2.0.md
autore: Agent-Orchestrator
dipendenze: nessuno
---

# PLAN 020 - Centralizzazione design tokens: colori e chiavi icone

## 1. Obiettivo del Piano

Convertire 16 valori `oklch()` in hex, centralizzare tutti i token colore in `src/lib/design-tokens/colors.ts`, rimuovere la dipendenza `@phosphor-icons/react` dal dominio applicativo per compatibilità React Native e sostituire le icone con chiavi semantiche.

## 2. Perimetro (Scope)

File sorgente da creare o modificare:
- src/lib/design-tokens/colors.ts (nuovo)
- src/lib/budget-templates.ts
- src/lib/constants.ts
- package.json

Fuori perimetro:
- componenti UI (`src/components/`, `src/screens/`)
- aggiunta di label accessibili in `src/locales/it.ts` (rinviate alla fase UI)
- scelta della nuova libreria icone

## 3. Prerequisiti Bloccanti

- **Conversione colori**: I 16 valori oklch presenti in DESIGN 020 Sezione 6 devono essere convertiti in esadecimale e validati (WCAG AA). (Task preparatorio P-020).

## 4. Architettura e Decisioni Chiave

- **Decisione A**: Conversione oklch → hex con centralizzazione contestuale. Nessun colore hardcoded nei file di dominio.
- **Decisione B**: Posizione file centrale definita come `src/lib/design-tokens/colors.ts`.
- **Decisione C**: Chiavi icone semantiche in inglese, descrittive del concetto del template (es. `groceries`, `housing`).
- **Decisione D**: La libreria icone nativa verrà decisa in futuro, incapsulata in un componente `AppIcon`. Nessun componente deve importare direttamente la libreria icone in questa fase.
- **Decisione E**: Le chiavi per i template sono 11, mantenendo separati `groceries` e `overall-budget` sebbene prima usassero la stessa icona Phosphor.

## 5. Task Atomici

### P-020
- Azione: Verificare e compilare i 16 colori hex convertiti nel DESIGN 020 (Sezione 6).

### T1
- Azione: Creare il file centrale dei design token `colors.ts` popolato con i valori hex convertiti, esportando `DESIGN_COLORS` e i tipi `BudgetColorToken`, `AccountCategoryColorToken`, `BudgetTemplateIconKey`.
- File target: src/lib/design-tokens/colors.ts
- Dipende da: P-020
- Metrica di successo: Il file esporta costanti TypeScript tipizzate e 11 chiavi icona semantiche.

### T2
- Azione: Aggiornare `BudgetTemplate` per usare `iconKey: BudgetTemplateIconKey` e `color: string`. Sostituire le definizioni dei template usando i valori in `DESIGN_COLORS.budget` e le nuove chiavi semantiche. Rimuovere gli import di `@phosphor-icons/react`.
- File target: src/lib/budget-templates.ts
- Dipende da: T1
- Metrica di successo: Nessun import da `@phosphor-icons/react`, nessun valore `oklch()`.

### T3
- Azione: Aggiornare `ACCOUNT_CATEGORIES` sostituendo i valori `oklch()` con i token corrispondenti da `DESIGN_COLORS.accountCategory`.
- File target: src/lib/constants.ts
- Dipende da: T1
- Metrica di successo: Nessun valore `oklch()` hardcoded nel file.

### T4
- Azione: Rimuovere la dipendenza `@phosphor-icons/react` dal package.json.
- File target: package.json
- Dipende da: T2
- Metrica di successo: `@phosphor-icons/react` rimossa dalle dipendenze.

## 6. Test Obbligatori

- Grep per assicurarsi dell'assenza di `@phosphor-icons/react` in `src/`.
- Grep per assicurarsi dell'assenza di `oklch(` in `src/`.
- Compilazione TypeScript tramite `npx tsc --noEmit`.
- Esecuzione delle suite di test unitari.

## 7. Gate di Chiusura

- G-020-1 | Verifica: nessun import residuo da `@phosphor-icons/react`. | Comando: grep -Rn "@phosphor-icons/react" src/ | Stato iniziale: OPEN
- G-020-2 | Verifica: nessun valore `oklch(` residuo nel codice sorgente. | Comando: grep -Rn "oklch(" src/ | Stato iniziale: OPEN
- G-020-3 | Verifica: compilazione Typescript passa senza errori. | Comando: npx tsc --noEmit | Stato iniziale: OPEN
- G-020-4 | Verifica: i test unitari passano. | Comando: npm test -- --runInBand | Stato iniziale: OPEN

## 8. Rollback

- package.json: ripristinare `@phosphor-icons/react`.
- budget-templates.ts e constants.ts: ripristinare la versione precedente al commit.
- src/lib/design-tokens/colors.ts: rimuovere il file.

## 9. Riferimenti

- docs/2-projects/020-DESIGN_icone-colori-design-system_v0.2.0.md
