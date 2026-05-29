---
titolo: TODO 018 - Confronto Mese su Mese per Categoria
versione: 0.1.0
data: 2026-05-29
stato: PENDING
piano_riferimento: docs/3-coding-plans/018-PLAN_confronto-mese-su-mese-categoria_v0.1.0.md
design_riferimento: docs/2-projects/018-DESIGN_confronto-mese-su-mese-categoria_v0.1.0.md
autore: Agent-Orchestrator
---

# TODO 018 - Confronto Mese su Mese per Categoria

## 1. Stato e Gate Bloccante

- Gate bloccante: PLAN 017 implementato per garantire la disponibilita di roundCurrency ed extractDatePart nelle helper condivise del progetto.
- Verifica architetturale obbligatoria: monthly-comparison.ts deve restare un modulo puro senza accesso a Supabase, cache o AppDataContext.
- Stato corrente: PENDING

## 2. Stato Task (panoramica)

| ID task | Titolo | Stato | Note |
| --- | --- | --- | --- |
| T1 | Aggiungere tipi confronto mensile | TODO | TendenzaComparazione, options e row |
| T2 | Creare estrazione e aggregazione mensile | TODO | Usa extractDatePart e roundCurrency di 017 |
| T3 | Implementare computeMonthlyComparison | TODO | Casi percentuali, ordinamento e zero handling |
| T4 | Aggiungere chiavi locali confronto | TODO | Fallback categoria e stati confronto |
| T5 | Creare suite monthly-comparison | TODO | Copertura dei 17 scenari obbligatori |

## 3. Task Atomici

### T1
- Azione: Aggiungere TendenzaComparazione, MonthlyComparisonOptions e MonthlyComparisonRow ai tipi client.
- File target: src/lib/types.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit compila i nuovi tipi senza introdurre dipendenze da Supabase o dal layer notifiche.
- Task Status: [ ] TODO

### T2
- Azione: Creare extractMonthTransactions e aggregateByCategory in monthly-comparison.ts riusando extractDatePart e roundCurrency di PLAN 017.
- File target: src/lib/monthly-comparison.ts
- Dipende da: T1, PLAN 017
- Metrica di successo: il modulo filtra in modo timezone-safe, aggrega per categoria e non ridefinisce helper gia introdotti in helpers.ts.
- Task Status: [ ] TODO

### T3
- Azione: Implementare computeMonthlyComparison con gestione dei quattro casi percentuali ufficiali, ordinamento per differenza assoluta e tie-break deterministico.
- File target: src/lib/monthly-comparison.ts
- Dipende da: T1, T2, PLAN 017
- Metrica di successo: __tests__/monthly-comparison.test.ts copre casi base zero, nuove categorie, scomparse, cambio anno e assenza di valori non finiti.
- Task Status: [ ] TODO

### T4
- Azione: Aggiungere le chiavi di localizzazione per fallback categoria, stato del confronto e testi informativi collegati al modulo.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per variazione, aumento, riduzione, stabile, nuova categoria, categoria assente, categoria eliminata e senza categoria.
- Task Status: [ ] TODO

### T5
- Azione: Creare la suite di test monthly-comparison.test.ts coprendo tutti gli scenari obbligatori del design.
- File target: __tests__/monthly-comparison.test.ts
- Dipende da: T1, T2, T3, PLAN 017
- Metrica di successo: la suite copre almeno i 12 scenari obbligatori, inclusi cambio anno, collisione categoria eliminata/senza categoria, transfer exclusion e transazioni vicine al cambio UTC.
- Task Status: [ ] TODO

## 4. Note Operative

- monthly-comparison.ts non puo importare repository, AppDataContext o cache.
- roundCurrency ed extractDatePart devono essere solo consumate da helpers.ts, mai ridefinite localmente.
- differenzaPercentuale deve restare null quando la base storica e zero o assente.
- I trasferimenti sono esclusi di default con includeTransfers false.
- Nessuna stringa utente puo essere hardcoded: tutto passa dal registro di localizzazione italiano.

## 5. Log di Validazione

| Data | Task ID | Validato Da | Risultato | Note |
| --- | --- | --- | --- | --- |
| 2026-05-29 | CORREZIONE | Agent-Copilot | APPLICATA | corretti scenari T5 da 17 a 12 e comando gate G-018-3 |

## 6. Gate di Chiusura

- G-018-1 | Verifica: i nuovi tipi client compilano senza introdurre dipendenze non previste. | Comando: npx tsc --noEmit | Gate Status: [ ] OPEN
- G-018-2 | Verifica: il modulo di confronto copre i casi percentuali ufficiali e non restituisce valori non finiti. | Comando: npx jest __tests__/monthly-comparison.test.ts --runInBand | Gate Status: [ ] OPEN
- G-018-3 | Verifica: il modulo di confronto resta puro e non accede a Supabase, context o cache. | Comando: grep -RIn "supabase|AppDataContext|cache|repositories" src/lib/monthly-comparison.ts | Gate Status: [ ] OPEN
- G-018-4 | Verifica: roundCurrency ed extractDatePart sono consumate dalle helper condivise senza ridefinizione locale. | Comando: verifica manuale sul modulo di confronto e sulle helper condivise | Gate Status: [ ] OPEN
- G-018-5 | Verifica: le chiavi locali richieste dal modulo sono tutte presenti nel registro di localizzazione italiano. | Comando: npx tsc --noEmit | Gate Status: [ ] OPEN

## 7. Riferimenti

- docs/3-coding-plans/018-PLAN_confronto-mese-su-mese-categoria_v0.1.0.md
- docs/2-projects/018-DESIGN_confronto-mese-su-mese-categoria_v0.1.0.md
- docs/3-coding-plans/017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
- docs/3-coding-plans/019-PLAN_notifiche-budget-orchestrazione_v0.1.0.md
- helper condivise del progetto
- modulo puro di confronto mensile
- __tests__/monthly-comparison.test.ts