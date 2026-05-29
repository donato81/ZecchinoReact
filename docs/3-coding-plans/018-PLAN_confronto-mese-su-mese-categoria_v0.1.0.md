---
titolo: PLAN 018 - Confronto Mese su Mese per Categoria
versione: 0.1.0
data: 2026-05-29
stato: REVIEWED PENDING
design_riferimento: docs/2-projects/018-DESIGN_confronto-mese-su-mese-categoria_v0.1.0.md
autore: Agent-Orchestrator
dipendenze: PLAN 017
dipendenti: PLAN 019
---

# PLAN 018 - Confronto Mese su Mese per Categoria

## 1. Obiettivo del Piano

Introdurre un modulo puro di confronto mese su mese per categoria che lavori solo su dati gia in memoria, riusi roundCurrency ed extractDatePart introdotte da PLAN 017 e produca output deterministici, riusabili da analytics e notifiche future.

## 2. Perimetro (Scope)

File sorgente da creare o modificare:
- modello tipi client del confronto mensile
- src/lib/helpers.ts - questo file riceve l'aggiunta della funzione extractDatePart. La funzione e dichiarata in questo DESIGN e riutilizzata dai DESIGN successivi che lavorano su date.
- modulo puro di confronto mensile
- registro di localizzazione italiano
- __tests__/monthly-comparison.test.ts

Fuori perimetro:
- query Supabase o modifiche database
- mutazioni di AppDataContext, cache o stato globale
- implementazione della soglia minimumDifference nella versione 1
- UI, grafici o schermate di confronto

## 3. Prerequisiti Bloccanti

- PLAN 017 completato sul piano implementativo per garantire la presenza di roundCurrency ed extractDatePart nelle helper condivise del progetto.
- Le transazioni devono essere gia disponibili in memoria tramite AppDataContext; il modulo 018 non deve introdurre caricamenti remoti.
- Le chiavi di localizzazione richieste dal confronto devono essere pianificate nel registro di localizzazione italiano prima di collegare consumer UI o notifiche.

## 4. Architettura e Decisioni Chiave

- Decisione 1 - monthly-comparison.ts resta completamente puro. Conseguenza pratica: nessun import da repository Supabase, context React o servizi di persistenza.
- Decisione 2 - La differenza assoluta si calcola sempre come periodo di confronto meno periodo base. Conseguenza pratica: il contratto di output resta neutrale rispetto al calendario corrente.
- Decisione 3 - Gli importi vengono normalizzati con Math.abs dopo il filtro movementType. Conseguenza pratica: il modulo non assume il segno degli importi come vincolo a monte.
- Decisione 4 - Il filtro mese usa extractDatePart introdotta in PLAN 017. Conseguenza pratica: i task di implementazione 018 dipendono esplicitamente da 017 e non possono ridefinire la utility.
- Decisione 5 - Tutti i calcoli monetari usano roundCurrency introdotta in PLAN 017. Conseguenza pratica: il confronto resta coerente con il dominio prestiti e con il futuro motore notifiche 019.
- Decisione 6 - Le righe zero-zero sono escluse di default e differenzaPercentuale e null quando la base storica e zero o assente. Caso limite - mese di riferimento con valore zero: se il valore del mese di riferimento per una categoria e zero, il calcolo del delta percentuale non viene eseguito e la funzione restituisce null per quel campo. Il componente che mostra il dato deve trattare null come assenza di confronto disponibile e non come errore. Conseguenza pratica: il modulo non puo restituire Infinity, -Infinity, NaN o undefined.
- Decisione 7 - categoriaId resta sempre conservato. Conseguenza pratica: categoria eliminata e senza categoria restano casi distinti nel risultato finale.

## 5. Task Atomici

### T1
- Azione: Aggiungere TendenzaComparazione, MonthlyComparisonOptions e MonthlyComparisonRow ai tipi client.
- File target: src/lib/types.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit compila i nuovi tipi senza introdurre dipendenze da Supabase o dal layer notifiche.
- Note operative: minimumDifference deve esistere solo come campo opzionale inattivo in versione 1.

### T2
- Azione: Creare extractMonthTransactions e aggregateByCategory in monthly-comparison.ts riusando extractDatePart e roundCurrency di PLAN 017.
- File target: src/lib/monthly-comparison.ts
- Dipende da: T1, PLAN 017
- Metrica di successo: il modulo filtra in modo timezone-safe, aggrega per categoria e non ridefinisce helper gia introdotti in helpers.ts.
- Note operative: includeTransfers deve avere default false ed excludeZeroRows default true.

### T3
- Azione: Implementare computeMonthlyComparison con gestione dei quattro casi percentuali ufficiali, ordinamento per differenza assoluta e tie-break deterministico.
- File target: src/lib/monthly-comparison.ts
- Dipende da: T1, T2, PLAN 017
- Metrica di successo: __tests__/monthly-comparison.test.ts copre casi base zero, nuove categorie, scomparse, cambio anno e assenza di valori non finiti.
- Note operative: il risultato deve usare roundCurrency su importiPeriodoBase, importiPeriodoConfronto e differenzaAssoluta.

### T4
- Azione: Aggiungere le chiavi di localizzazione per fallback categoria, stato del confronto e testi informativi collegati al modulo.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per variazione, aumento, riduzione, stabile, nuova categoria, categoria assente, categoria eliminata e senza categoria.
- Note operative: nessuna stringa informativa puo rimanere hardcoded nel modulo o nei futuri consumer.

### T5
- Azione: Creare la suite di test monthly-comparison.test.ts coprendo tutti gli scenari obbligatori del design.
- File target: __tests__/monthly-comparison.test.ts
- Dipende da: T1, T2, T3, PLAN 017
- Metrica di successo: la suite copre almeno i 17 scenari obbligatori, inclusi cambio anno, collisione categoria eliminata/senza categoria, transfer exclusion e transazioni vicine al cambio UTC.
- Note operative: aggiungere una verifica esplicita che il modulo consuma roundCurrency ed extractDatePart senza ridefinizione locale.

## 6. Test Obbligatori

- File spec: __tests__/monthly-comparison.test.ts | Scenario: due mesi con categorie comuni producono differenze corrette. | Tipo: unit
- File spec: __tests__/monthly-comparison.test.ts | Scenario: mese base vuoto con righe tutte nuove. | Tipo: unit
- File spec: __tests__/monthly-comparison.test.ts | Scenario: mese confronto vuoto con righe tutte scomparse. | Tipo: unit
- File spec: __tests__/monthly-comparison.test.ts | Scenario: base maggiore di zero e confronto zero produce -100 e isScomparsa true. | Tipo: unit
- File spec: __tests__/monthly-comparison.test.ts | Scenario: base zero o assente e confronto positivo produce differenzaPercentuale null e isNuova true. | Tipo: unit
- File spec: __tests__/monthly-comparison.test.ts | Scenario: zero verso zero con excludeZeroRows false mantiene tendenza stabile e nessun valore non finito. | Tipo: unit
- File spec: __tests__/monthly-comparison.test.ts | Scenario: categoria eliminata conserva categoriaId e usa fallback corretto. | Tipo: unit
- File spec: __tests__/monthly-comparison.test.ts | Scenario: ordinamento per differenza assoluta e tie-break deterministico. | Tipo: unit
- File spec: __tests__/monthly-comparison.test.ts | Scenario: roundCurrency limita tutti gli importi a due decimali. | Tipo: unit
- File spec: __tests__/monthly-comparison.test.ts | Scenario: includeTransfers false esclude i trasferimenti, true li include. | Tipo: unit
- File spec: __tests__/monthly-comparison.test.ts | Scenario: transazione vicina al cambio UTC viene assegnata al mese corretto tramite extractDatePart. | Tipo: unit
- File spec: __tests__/monthly-comparison.test.ts | Scenario: dataset grande non muta l'array originale e resta percettibilmente stabile. | Tipo: unit

## 7. Gate di Chiusura

- G-018-1 | Verifica: i nuovi tipi client compilano senza introdurre dipendenze non previste. | Comando: npx tsc --noEmit | Stato iniziale: OPEN
- G-018-2 | Verifica: il modulo di confronto copre i casi percentuali ufficiali e non restituisce valori non finiti. | Comando: npx jest __tests__/monthly-comparison.test.ts --runInBand | Stato iniziale: OPEN
- G-018-3 | Verifica: il modulo di confronto resta puro e non accede a Supabase, context o cache. | Comando: verifica manuale sul modulo puro di confronto mensile | Stato iniziale: OPEN
- G-018-4 | Verifica: roundCurrency ed extractDatePart sono consumate dalle helper condivise senza ridefinizione locale. | Comando: verifica manuale sul modulo di confronto e sulle helper condivise | Stato iniziale: OPEN
- G-018-5 | Verifica: le chiavi locali richieste dal modulo sono tutte presenti nel registro di localizzazione italiano. | Comando: npx tsc --noEmit | Stato iniziale: OPEN

## 8. Rollback

- modello tipi client del confronto mensile: rimuovere TendenzaComparazione, MonthlyComparisonOptions e MonthlyComparisonRow.
- modulo puro di confronto mensile: eliminare il file se il modulo non supera i gate.
- registro di localizzazione italiano: rimuovere le chiavi del confronto mensile.
- __tests__/monthly-comparison.test.ts: eliminare la suite se il piano viene annullato.

## 9. Riferimenti

- docs/2-projects/018-DESIGN_confronto-mese-su-mese-categoria_v0.1.0.md
- docs/3-coding-plans/017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
- docs/3-coding-plans/019-PLAN_notifiche-budget-orchestrazione_v0.1.0.md
- helper condivise del progetto
- modulo puro di confronto mensile
- modello tipi client del confronto mensile
- registro di localizzazione italiano
- __tests__/monthly-comparison.test.ts