---
tipo: DESIGN
titolo: "DESIGN 018 — Confronto mese su mese per categoria"
versione: "0.1.0"
data: "2026-05-28"
stato: REVIEWED
sorgente:
  - docs/2-projects/015-DESIGN_repository-notifiche-notification-service_v0.1.0.md
  - "docs/2-projects/019-DESIGN_notifiche-budget-orchestrazione_v0.1.0.md (nota: i dati aggregati prodotti da questo motore di confronto possono essere consumati dal motore notifiche definito in DESIGN 019)"
  - src/lib/supabase/repositories/budget.ts
  - src/lib/supabase/repositories/transazioni.ts
  - src/lib/types.ts
  - src/lib/supabase/types.ts
  - src/context/AppDataContext.tsx
  - src/lib/helpers.ts
  - src/locales/it.ts
  - src/lib/budget-alerts.ts
  - src/lib/notification-service.ts
perimetro: "Modulo puro di confronto mese su mese per categoria costruito esclusivamente sui dati già caricati in memoria, senza accesso a Supabase e senza mutazioni di stato globale."
---

# DESIGN 018 — Confronto mese su mese per categoria

## Sezione 2 — Contesto e motivazione

Questo documento definisce il modulo che risponde alla domanda: quanto è cambiata la spesa o l'entrata per categoria tra due mesi arbitrari già presenti nei dati caricati in memoria. La motivazione architetturale è isolare un motore puro e deterministico, separato da AppDataContext e da qualsiasi repository Supabase, così da renderlo testabile in isolamento e riusabile da dashboard, analisi e notifiche future.

La lettura di src/lib/helpers.ts conferma che esistono già formatCurrency e getTransactionsInPeriod; inoltre roundCurrency ed extractDatePart appartengono a src/lib/helpers.ts e sono introdotte da DESIGN 017. DESIGN 018 consuma queste utility per i calcoli monetari centralizzati e per il filtraggio date timezone-safe senza ridefinirle.

## Sezione 3 — Perimetro

In scope:
- Confronto tra due mesi qualsiasi presenti nel dataset già in memoria.
- Supporto sia a uscite sia a entrate.
- Aggregazione per categoria con conservazione di categoriaId originale.
- Gestione sicura di categorie eliminate e assenza di categoria.
- Ordinamento per differenza assoluta in euro.
- Gestione esplicita dei casi percentuali base zero e confronto zero.

Fuori scope:
- Query a Supabase o modifiche database.
- Mutazioni di AppDataContext o scritture cache.
- Soglia minima di rilevanza nella versione 1.
- Confronti trimestrali o annuali nella versione 1.
- Presentazione UI, componenti e grafici.

## Sezione 4 — Decisioni architetturali

### Decisione 1 — Modulo totalmente puro
Testo: src/lib/monthly-comparison.ts è deterministico, senza effetti collaterali, idempotente e testabile in isolamento. Non comunica con il database e non modifica lo stato globale.

Motivazione: AppDataContext è già responsabile di bootstrap, cache e orchestration. Il confronto mese su mese deve restare calcolo puro per non contaminare il bootstrap e per consentire test veloci su dataset sintetici.

### Decisione 2 — Nomi temporali neutrali rispetto al calendario corrente
Testo: i campi temporali sono importoPeriodoBase e importoPeriodoConfronto. La differenza si calcola sempre come confronto meno base. Il motore non assume mai quale sia il mese corrente.

Motivazione: il confronto deve restare riusabile per qualunque coppia di mesi, inclusi confronti storici o cross-year. La semantica base/confronto evita ambiguità tra UI e motore.

### Decisione 3 — Importi trattati con valore assoluto dopo il filtraggio per tipo movimento
Testo: prima si selezionano le transazioni del tipo richiesto, uscita o entrata, poi gli importi vengono trattati con Math.abs(importo).

Motivazione: il repository transazioni non impone segno uniforme lato dominio. Applicare il valore assoluto solo dopo il filtro mantiene coerente la lettura economica del dato senza mescolare tipi diversi.

### Decisione 4 — Filtro mese timezone-safe
Testo: il filtraggio per mese è sicuro rispetto ai fusi orari. È vietato usare new Date(stringa).getMonth() senza normalizzazione. Il modulo lavora sempre sui primi dieci caratteri della stringa data nel formato YYYY-MM-DD tramite extractDatePart. Nota: extractDatePart appartiene a src/lib/helpers.ts, è introdotta da DESIGN 017 e DESIGN 018 la consuma senza ridefinirla.

Motivazione: src/lib/helpers.ts usa ancora new Date nei filtri periodali. Il confronto mensile deve evitare slittamenti UTC e classificazioni errate a cavallo di mezzanotte.

### Decisione 5 — Ordinamento per differenza assoluta in euro
Testo: l'ordinamento usa il valore assoluto di differenzaAssoluta, non la percentuale.

Motivazione: la percentuale amplifica artificialmente i micro-importi. Ordinare per euro rende il risultato più utile per l'utente e più stabile in dashboard e notifiche.

### Decisione 6 — Trasferimenti esclusi di default
Testo: i trasferimenti tra conti sono esclusi per impostazione predefinita. L'opzione includeTransfers, con default false, consente di includerli.

Motivazione: i trasferimenti non rappresentano spesa o entrata reale nella maggior parte dei casi. L'opzione esplicita evita rumore nel confronto standard.

### Decisione 7 — Conservazione del categoriaId originale
Testo: categoriaId viene sempre conservato, anche quando la categoria non esiste più nel catalogo. Il fallback di nome è Categoria eliminata, ma l'identificatore resta quello originale.

Motivazione: il codice di dominio usa id stabili come chiave applicativa. Separare id e label di fallback evita collisioni tra entità eliminate e righe senza categoria.

### Decisione 8 — Arrotondamento centralizzato in helpers.ts
Testo: roundCurrency è già introdotta in src/lib/helpers.ts da DESIGN 017 con formula parseFloat(value.toFixed(2)). Tutti i moduli che calcolano importi monetari la usano senza ridefinirla.

Motivazione: riusare una sola utility condivisa evita divergenze fra confronto mensile e altri moduli monetari e mantiene coerente l'ownership già dichiarata da DESIGN 017.

### Decisione 9 — Confronto tra qualunque coppia di mesi
Testo: il confronto è possibile tra qualsiasi coppia di mesi presenti nelle transazioni, non solo mese corrente contro precedente.

Motivazione: la struttura MonthlyComparisonOptions deve servire sia analytics storiche sia UI comparative future, senza dipendere dalla data di sistema.

### Decisione 10 — Soglia minima non implementata in versione 1
Testo: il campo minimumDifference esiste nell'interfaccia per compatibilità futura ma non viene usato nella versione 1.

Motivazione: il briefing richiede compatibilità in avanti senza aggiungere comportamento non ancora approvato. Il campo documenta l'estensione futura senza introdurre semantica implicita oggi.

### Decisione 11 — Righe zero-zero escluse di default
Testo: le categorie con valore zero in entrambi i mesi non compaiono nel risultato per impostazione predefinita. L'opzione excludeZeroRows, con default true, governa questo comportamento.

Motivazione: le righe prive di variazione e prive di importi utili aumentano rumore visivo e computazionale. L'opzione conserva comunque la possibilità di debugging o analisi completa.

### Decisione 12 — Delta percentuale nullo senza base storica comparabile
Testo: se importoPeriodoBase è zero o assente, differenzaPercentuale deve essere null. Il motore non deve mai restituire Infinity, -Infinity, NaN o altri valori non finiti. La localizzazione e i consumer UI gestiscono null con testo esplicativo, ad esempio Nessun dato storico comparabile.

Motivazione: senza una base storica diversa da zero non esiste una percentuale significativa. Rendere questo caso esplicito produce un contratto stabile per dashboard, analisi e motori downstream, evitando ambiguità o rendering numerici invalidi.

## Sezione 5 — Invariante: nessuna stringa hardcoded

Nessuna stringa utente, inclusi titoli di periodo, label di fallback, messaggi di stato, annunci per screen reader e testi informativi, può essere hardcoded nel modulo o nei componenti che lo useranno. Tutto deve passare da src/locales/it.ts.

Questo include esplicitamente:
- etichette per mese corrente e mese precedente;
- label nuova categoria, categoria assente, senza categoria e categoria eliminata;
- annunci NVDA, TalkBack e VoiceOver relativi a aumento, riduzione e stabile;
- messaggi come nessuna transazione in questo periodo o confronta con.

## Sezione 6 — Schema dei tipi TypeScript

Tipi da aggiungere in src/lib/types.ts:

- TendenzaComparazione: unione letterale con i valori aumento, riduzione e stabile.
- MonthlyComparisonOptions:
  - baseYear intero
  - baseMonth intero da 1 a 12
  - compareYear intero
  - compareMonth intero da 1 a 12
  - movementType con valori uscita o entrata
  - includeTransfers opzionale con default false
  - excludeZeroRows opzionale con default true
  - minimumDifference opzionale, presente ma inattivo in versione 1
- MonthlyComparisonRow:
  - categoriaId
  - categoriaNome
  - categoriaIcona opzionale
  - importoPeriodoBase
  - importoPeriodoConfronto
  - differenzaAssoluta
  - differenzaPercentuale oppure null
  - tendenza
  - isNuova
  - isScomparsa

Funzioni da creare in src/lib/monthly-comparison.ts:

- extractMonthTransactions
- aggregateByCategory
- computeMonthlyComparison

Estensioni a src/lib/helpers.ts:

- roundCurrency già presente in src/lib/helpers.ts, introdotta da DESIGN 017 e consumata da DESIGN 018 senza ridefinizione
- extractDatePart già presente in src/lib/helpers.ts, introdotta da DESIGN 017 e consumata da DESIGN 018 senza ridefinizione; restituisce i primi dieci caratteri della stringa data

## Sezione 7 — Schema database

Non applicabile. DESIGN 018 non introduce tabelle, indici, trigger, RPC o policy RLS perché il modulo lavora solo su dati già idratati in memoria.

## Sezione 8 — File da creare e file da modificare

File da creare:

- src/lib/monthly-comparison.ts — nuovo modulo puro per estrazione transazioni del mese, aggregazione per categoria e confronto finale.
- __tests__/monthly-comparison.test.ts — nuova suite di test dedicata al motore.

File da modificare:

- src/lib/helpers.ts — nota di dipendenza: questo file non viene modificato da DESIGN 018. DESIGN 018 consuma roundCurrency ed extractDatePart già introdotte da DESIGN 017. Nessuna ridefinizione è necessaria o ammessa.
- Nota esplicita: extractDatePart appartiene a src/lib/helpers.ts, è introdotta da DESIGN 017 e DESIGN 018 la consuma senza ridefinirla.
- src/lib/types.ts — aggiunta di MonthlyComparisonRow, MonthlyComparisonOptions e TendenzaComparazione.
- src/locales/it.ts — aggiunta di chiavi per mese corrente, mese precedente, variazione, nuova categoria, categoria assente, nessuna transazione in questo periodo, aumento, riduzione, stabile, confronta con, seleziona mese, senza categoria e categoria eliminata.

## Sezione 9 — Scenari di test obbligatori

1. Caso base positivo con due mesi con transazioni comuni: il confronto produce righe condivise con differenze corrette.
2. Mese base vuoto: tutte le righe del mese di confronto sono classificate come nuove.
3. Mese di confronto vuoto: tutte le righe del mese base sono classificate come scomparse.
4. Categoria solo nel mese base: isScomparsa true e differenzaPercentuale pari a -100.
5. Categoria solo nel mese di confronto: isNuova true e differenzaPercentuale pari a null.
6. Categoria identica nei due mesi: tendenza stabile e differenzaAssoluta pari a zero.
7. Caso zero verso zero con excludeZeroRows false: differenzaPercentuale pari a null, tendenza stabile e nessun valore non finito restituito.
8. Cambio anno: dicembre e gennaio di anni diversi non vengono mescolati.
9. Categoria eliminata: categoriaId conservato, fallback categoria eliminata applicato senza errori.
10. Ordinamento: righe ordinate per valore assoluto della differenza in ordine decrescente.
11. Ordinamento stabile a parità di differenza: ordine deterministico per valori equivalenti.
12. Arrotondamento: importi con molte cifre decimali producono output sempre a due decimali.
13. Esclusione trasferimenti: con includeTransfers false i trasferimenti sono esclusi, con true sono inclusi.
14. Importi negativi nel campo importo: il risultato resta corretto grazie a Math.abs dopo il filtraggio per movementType.
15. Transazione vicino al cambio UTC: la transazione viene assegnata al mese corretto tramite extractDatePart.
16. Dataset grande con 10.000 transazioni: nessun rallentamento percettibile e nessuna mutazione del dataset originale.
17. Collisione tra categoria eliminata e senza categoria: le due righe restano separate.

Tabella ufficiale dei casi percentuali:

- Caso 1: base zero o assente, confronto zero. differenzaPercentuale uguale a null, tendenza stabile, isNuova false, isScomparsa false.
- Caso 2: base zero o assente, confronto maggiore di zero. differenzaPercentuale uguale a null, tendenza aumento, isNuova true, isScomparsa false (corrisponde allo scenario di test 5, isNuova uguale a true).
- Caso 3: base maggiore di zero, confronto zero. differenzaPercentuale uguale a -100, tendenza riduzione, isNuova false, isScomparsa true.
- Caso 4: base maggiore di zero, confronto maggiore di zero. differenzaPercentuale calcolata con formula standard, tendenza derivata dal segno della differenza, isNuova false, isScomparsa false.
- Formula standard del Caso 4: confronto meno base diviso base, moltiplicato per 100.
- Regola invariabile: differenzaPercentuale non può mai essere Infinity, -Infinity, NaN o qualsiasi altro valore non finito.

## Sezione 10 — Dipendenze da altri design

Precondizioni obbligatorie:

- Disponibilità delle transazioni già caricate in memoria da AppDataContext.
- Disponibilità delle utility roundCurrency ed extractDatePart introdotte da DESIGN 017 in src/lib/helpers.ts. DESIGN 018 non può essere implementato senza che DESIGN 017 abbia già creato queste due funzioni.
- Presenza dei tipi dominio base in src/lib/types.ts.
- Disponibilità di src/locales/it.ts per tutte le stringhe utente.

Indipendenze confermate:

- Nessuna dipendenza da Supabase o dai repository.
- Nessuna dipendenza dal sistema notifiche o dai budget alert per la versione 1.

Confini con altri design:

- Riusa l'invariante nessuna stringa hardcoded già osservato nei design documentali esistenti.
- Non modifica i contratti del design notifiche già presente in docs/2-projects/015-DESIGN_repository-notifiche-notification-service_v0.1.0.md.
- Prepara dati riusabili per notifiche future senza introdurre side effect nel motore.

## Sezione 11 — Debiti tecnici aperti

- DT-018-01 — Soglia minima di rilevanza configurabile tramite minimumDifference. Priorità: bassa. Stato: aperto.
- DT-018-02 — Estensione al confronto trimestrale e annuale tramite aggregazioni aggiuntive. Priorità: bassa. Stato: aperto.
- DT-018-03 — Integrazione futura con il sistema notifiche usando MonthlyComparisonRow come base dati. Priorità: bassa. Stato: aperto.
- DT-018-04 — Refactoring di getTransactionsInPeriod in src/lib/helpers.ts per renderla timezone-safe con lo stesso approccio del nuovo modulo. Priorità: media. Stato: aperto.