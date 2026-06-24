---
titolo: TODO 017 - Prestiti, Mutui e Simulazione Finanziaria
versione: 0.1.0
data: 2026-05-29
stato: PENDING
piano_riferimento: docs/3-coding-plans/017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
design_riferimento: docs/2-projects/017-DESIGN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
autore: Agent-Orchestrator
---

# TODO 017 - Prestiti, Mutui e Simulazione Finanziaria

## 1. Stato e Gate Bloccante

- Gate bloccante: nessuno sul piano architetturale; DESIGN 017 e il primo blocco della sequenza 017-019.
- Verifica infrastrutturale obbligatoria: prima dell'implementazione dei repository devono esistere i placeholder SQL P52, P53 e P54 in docs/6-sql.
- Verifica di dipendenza cross-design: roundCurrency ed extractDatePart devono essere introdotte nelle helper condivise del progetto in questo blocco, perche 018 e 019 le riuseranno.
- Stato corrente: PENDING

## 2. Stato Task (panoramica)

| ID task | Titolo | Stato | Note |
| --- | --- | --- | --- |
| T1 | Aggiungere tipi client prestiti | TODO | LoanType, LoanStatus, LoanDirection, PrestitoMutuo, PrestitoRimborso |
| T2 | Aggiungere tipi Db prestiti | TODO | DbPrestitoMutuo e DbPrestitoRimborso |
| T3 | Introdurre helper condivisi | TODO | roundCurrency ed extractDatePart nel layer helper condiviso |
| T4 | Creare loan-calculator | TODO | Motore puro con metodo francese |
| T5 | Creare repository prestiti | TODO | CRUD, promote, close, deleteSimulation |
| T6 | Creare repository prestiti-rimborsi | TODO | Solo RPC atomiche |
| T7 | Estendere cache e snapshot | TODO | Slice distinti per reali, simulazioni e rimborsi |
| T8 | Integrare AppDataContext | TODO | Hydration fail-soft e simulazioni locali |
| T9 | Aggiungere chiavi locali prestiti | TODO | Errori, conferme, annunci accessibilita |
| T10 | Creare placeholder SQL e schema docs | TODO | P52, P53, P54 e schema Supabase |
| T11 | Creare suite di test | TODO | Calculator, repository, simulazioni locali |

## 3. Task Atomici

### T1
- Azione: Aggiungere LoanType, LoanStatus, LoanDirection, PianoAmmortamentoVoce, LoanSimulationResult, PrestitoMutuo e PrestitoRimborso al modello client.
- File target: src/lib/types.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit compila i nuovi tipi senza errori e senza collisioni con i tipi dominio esistenti.
- Task Status: [ ] TODO

### T2
- Azione: Aggiungere DbPrestitoMutuo e DbPrestitoRimborso con naming snake_case coerente al layer Supabase.
- File target: src/lib/supabase/types.ts
- Dipende da: T1
- Metrica di successo: npx tsc --noEmit accetta i nuovi tipi Db* e il mapping futuro puo avvenire senza cast unsafe.
- Task Status: [ ] TODO

### T3
- Azione: Introdurre roundCurrency ed extractDatePart nelle helper condivise del progetto per calcoli monetari e parsing date timezone-safe.
- File target: src/lib/helpers.ts
- Dipende da: nessuno
- Metrica di successo: i nuovi helper sono esportati da helpers.ts e possono essere importati senza ridefinizione dai blocchi 018 e 019.
- Task Status: [ ] TODO

### T4
- Azione: Creare loan-calculator.ts con simulazione finanziaria, metodo francese, rata mensile, totale interessi, piano di ammortamento e saldo residuo a data.
- File target: src/lib/loan-calculator.ts
- Dipende da: T1, T3
- Metrica di successo: __tests__/loan-calculator.test.ts copre tasso zero, durata un mese, grandi valori, input negativi e arrotondamenti coerenti.
- Task Status: [ ] TODO

### T5
- Azione: Creare il repository prestiti con getAll, getById, getAttivi, create, update, promote, close e deleteSimulation.
- File target: src/lib/supabase/repositories/prestiti.ts
- Dipende da: T1, T2, T3, T4
- Metrica di successo: __tests__/prestiti.repository.test.ts dimostra mapping coerente, promozione con stesso id e ricalcolo dataFinePrevista.
- Vincolo Architetturale: il deposito dei prestiti deve invocare il motore di calcolo di T4 senza ridefinire alcuna formula di calcolo al suo interno.
- Task Status: [ ] TODO

### T6
- Azione: Creare il repository prestiti-rimborsi con addRimborso e deleteRimborso basati esclusivamente sulle RPC atomiche rpc_aggiungi_rimborso e rpc_elimina_rimborso.
- File target: src/lib/supabase/repositories/prestiti-rimborsi.ts
- Dipende da: T2, T5
- Metrica di successo: __tests__/prestiti-rimborsi.repository.test.ts dimostra atomicita, saldo mai negativo, rollback su errore e chiusura automatica del contratto.
- Nota di Responsabilita: i segnaposto P_017_01 e P_017_02 devono essere sostituiti con i riferimenti reali prodotti in T10 prima che il task possa essere considerato completato.
- Blocco esplicito: non marcare T6 come completato prima che P53 e P54 siano presenti in docs/6-sql e i segnaposto P_017_01 e P_017_02 siano stati sostituiti con i riferimenti reali.
- Task Status: [ ] TODO

### T7
- Azione: Estendere cache offline e snapshot applicativo per separare prestiti attivi, simulazioni persistite e rimborsi prestiti.
- File target: src/lib/supabase/cache.ts, src/context/app-data-cache.ts
- Dipende da: T1, T5, T6
- Metrica di successo: le nuove chiavi cache risultano registrate con TTL differenziato e DomainSnapshot serializza i nuovi slice.
- Task Status: [ ] TODO

### T8
- Azione: Integrare i nuovi slice in AppDataContext con hydration fail-soft, refresh, reset logout e gestione delle simulazioni locali non persistite.
- File target: src/context/AppDataContext.tsx
- Dipende da: T1, T5, T6, T7
- Metrica di successo: i test del context dimostrano bootstrap fail-soft e assenza di write Supabase per simulazioni solo locali.
- Task Status: [ ] TODO

### T9
- Azione: Aggiungere tutte le chiavi di localizzazione necessarie per errori, conferme, label e annunci accessibilita del dominio prestiti.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per il namespace prestiti.
- Task Status: [ ] TODO

### T10
- Azione: Creare i placeholder SQL P53 e P54 e aggiornare la documentazione dello schema Supabase per tabelle, indici, trigger, RPC e policy RLS del dominio. Il file P52 è già presente in docs/6-sql e non va ricreato.
- File target: docs/6-sql/P52-prestiti-mutui.sql, docs/6-sql/P53-rpc-rimborsi-prestiti.sql, docs/6-sql/P54-prestiti-rimborsi.sql, docs/6-sql/schema database supabase.md
- Dipende da: T2
- Metrica di successo: i tre file SQL esistono e la documentazione di schema riflette tutte le nuove entita.
- Task Status: [ ] IN PROGRESS

### T11
- Azione: Creare e completare le suite di test per loan-calculator, repository prestiti e repository prestiti-rimborsi.
- File target: __tests__/loan-calculator.test.ts, __tests__/prestiti.repository.test.ts, __tests__/prestiti-rimborsi.repository.test.ts
- Dipende da: T3, T4, T5, T6, T8
- Metrica di successo: le suite coprono tutti gli scenari obbligatori del design, inclusa la simulazione locale non persistita e i rimborsi concorrenti.
- Task Status: [ ] TODO

## 4. Note Operative

- roundCurrency ed extractDatePart nascono in 017 e non possono essere ridefinite nei blocchi 018 e 019.
- saldoResiduo non puo essere aggiornato lato client fuori dalle RPC atomiche.
- Le simulazioni locali non salvate restano nello stato React e non chiamano repository o Supabase.
- La cache deve distinguere prestiti reali da simulazioni persistite con TTL differenziati.
- Nessuna stringa utente puo essere hardcoded: tutto passa dal registro di localizzazione italiano.
- Ordine di esecuzione raccomandato: T9, T3, T1, T2, T4, T5, T6, T7, T8, T10, T11. Il T10 deve essere eseguito dopo T2 e prima che T6 sia marcato completato.

## 5. Log di Validazione

| Data | Task ID | Validato Da | Risultato | Note |
| --- | --- | --- | --- | --- |
| 2026-05-29 | CORREZIONE | Agent-Copilot | APPLICATA | aggiunti vincolo architetturale T5 e nota responsabilita T6 |

## 6. Gate di Chiusura

- G-017-1 | Verifica: tipi dominio e helper condivisi compilano correttamente. | Comando: npx tsc --noEmit | Gate Status: [ ] OPEN
- G-017-2 | Verifica: loan-calculator copre simulazione, arrotondamento e input invalidi. | Comando: npx jest __tests__/loan-calculator.test.ts --runInBand | Gate Status: [ ] OPEN
- G-017-3 | Verifica: i repository prestiti e prestiti-rimborsi rispettano mapping, RPC atomiche e promozione a id invariato. | Comando: npx jest __tests__/prestiti.repository.test.ts __tests__/prestiti-rimborsi.repository.test.ts --runInBand | Gate Status: [ ] OPEN
- G-017-4 | Verifica: AppDataContext integra il dominio in modalita fail-soft e non persiste simulazioni locali. | Comando: npx jest __tests__/AppDataContext.spec.ts --runInBand | Gate Status: [ ] OPEN
- G-017-5 | Verifica: saldoResiduo non viene mai aggiornato direttamente lato client fuori dalle RPC. | Comando: verifica manuale sul repository rimborsi prestiti e sul context dati applicativo | Gate Status: [ ] OPEN
- G-017-6 | Verifica: roundCurrency ed extractDatePart sono esportate dalle helper condivise e riutilizzabili dai blocchi 018 e 019 senza ridefinizione. | Comando: verifica manuale sulle helper condivise e ricerca import nei moduli consumer | Gate Status: [ ] OPEN
- G-017-7 | Verifica: i placeholder SQL P52, P53 e P54 e la documentazione schema risultano allineati al design. | Comando: verifica manuale su docs/6-sql e schema database supabase.md | Gate Status: [ ] OPEN

## 7. Riferimenti

- docs/3-coding-plans/017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
- docs/2-projects/017-DESIGN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
- docs/3-coding-plans/018-PLAN_confronto-mese-su-mese-categoria_v0.1.0.md
- docs/3-coding-plans/019-PLAN_notifiche-budget-orchestrazione_v0.1.0.md
- helper condivise del progetto
- motore di simulazione finanziaria
- repository prestiti
- repository rimborsi prestiti
- context dati applicativo