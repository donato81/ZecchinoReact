---
Titolo: DESIGN 019 — Gestione Prestiti e Mutui
Versione: 0.1.0
Data: 2026-05-28
Stato: DRAFT
Prerequisiti: nessuno
DebitiTecniciOriginati: nessuno
---

# DESIGN 019 — Gestione Prestiti e Mutui

Sezione 1 — Intestazione e metadati
- Titolo: DESIGN 019 — Gestione Prestiti e Mutui
- Versione: 0.1.0
- Data: 2026-05-28
- Stato: DRAFT
- Prerequisiti: nessuno dai design precedenti. Questo design crea una funzionalità completamente autonoma.
- Debiti tecnici originati: nessuno previsto

Sezione 2 — Obiettivo
Permettere all'utente di registrare i propri prestiti e mutui nell'app e calcolare automaticamente la rata mensile, il totale degli interessi e l'ammontare totale da restituire. Un mutuo da 150.000 euro a tasso 2,5% su 20 anni produce una rata mensile precisa: l'app la calcola e la mostra all'utente senza che lui debba fare nessun conto.
La funzionalità richiede la creazione di una nuova tabella nel database Supabase chiamata prestiti, che non esiste ancora, e del relativo repository.

Sezione 3 — Invarianti architetturali specifiche
- Nessuna stringa visibile all'utente o annunciata dallo screen reader può essere scritta direttamente nel codice. Ogni testo passa obbligatoriamente da src/locales/it.ts. Senza eccezioni.
- La formula della rata mensile è il calcolo della rata annuity con tasso mensile. Il risultato deve essere arrotondato a due decimali. La logica di calcolo vive in src/lib/calculations/prestiti.ts e non nel repository né nel componente UI.
- La tabella prestiti nel database non ha relazioni dirette con la tabella transazioni. Un prestito è un'entità separata che descrive le condizioni del debito. Le rate effettivamente pagate restano come transazioni normali, collegate al prestito tramite un campo facoltativo.
- Il tasso di interesse viene salvato e gestito come numero decimale (es. 0.025 per il 2,5%), non come percentuale intera (es. 2.5). La conversione per la visualizzazione avviene solo nello strato UI.

Sezione 4 — Schema della nuova tabella da creare
Questa tabella non esiste ancora come tabella canonica di progetto. Lo schema corrente del repository documenta oggi il dominio legacy prestiti_mutui / prestiti_rimborsi, ma questo design introduce una nuova baseline semplificata.

Tabella: prestiti
Il PLAN 019 deve includere lo script SQL di creazione.
Campi previsti:
- id: UUID, PK, auto-generato
- user_id: UUID, FK auth.users, obbligatorio
- nome: TEXT, descrizione del prestito, es. "Mutuo prima casa"
- importo_totale: NUMERIC, importo preso in prestito, maggiore di zero
- tasso_annuale: NUMERIC, tasso annuo decimale (0.025)
- durata_mesi: INTEGER, durata totale in mesi
- data_inizio: DATE, data di inizio del prestito
- tipo: TEXT, mutuo | prestito_personale | auto | altro
- note: TEXT, nullable
- attivo: BOOLEAN, default TRUE
- created_at: TIMESTAMPTZ, obbligatorio
- updated_at: TIMESTAMPTZ, obbligatorio

RLS: policy auth.uid() = user_id come per tutte le altre tabelle del progetto.

Sezione 5 — Calcoli finanziari da implementare
Tutti i calcoli vivono in src/lib/calculations/prestiti.ts.
Il file espone queste funzioni pure (nessuna chiamata a DB, nessun effetto collaterale):
- calcolaRataMensile(importo, tassoAnnuale, durataMesi)
  Restituisce la rata mensile con la formula annuity. Se il tasso è zero, la rata è importo diviso durataMesi.
- calcolaTotaleInteressi(rata, durataMesi, importo)
  Restituisce rata moltiplicata per durataMesi meno importo.
- calcolaTotaleRestituire(rata, durataMesi)
  Restituisce rata moltiplicata per durataMesi.
- calcolaPianoAmmortamento(importo, tassoAnnuale, durataMesi)
  Restituisce un array con una voce per ogni rata: numero rata, capitale rimborsato, interessi pagati, debito residuo.

Sezione 6 — File da creare o modificare
docs/6-sql/019-prestiti.sql — nuovo file SQL
- Script di creazione della tabella prestiti con RLS.

src/lib/supabase/types.ts — modifica
- Aggiungere interfaccia DbLoan con tutti i campi in snake_case.

src/lib/types.ts — modifica
- Aggiungere tipo LoanType = 'mutuo' | 'prestito_personale' | 'auto' | 'altro'.
- Aggiungere interfaccia Loan con campi in camelCase.

src/lib/supabase/repositories/prestiti.ts — nuovo file
- Funzioni pubbliche: getAll, getById, create, update, deactivate. Pattern identico a budget.ts.
- Nessun remove() fisico esposto.

src/lib/calculations/prestiti.ts — nuovo file
- Le quattro funzioni di calcolo pure descritte in Sezione 5.

src/locales/it.ts — modifica
- Aggiungere le seguenti chiavi:
  - screens.prestiti.title
  - screens.prestiti.empty
  - screens.prestiti.addButton
  - screens.prestiti.rataMensile
  - screens.prestiti.totaleInteressi
  - screens.prestiti.totaleRestituire
  - screens.prestiti.pianoAmmortamento
  - screens.prestitiForm.titleCreate
  - screens.prestitiForm.titleEdit
  - screens.prestitiForm.fields.nome
  - screens.prestitiForm.fields.importoTotale
  - screens.prestitiForm.fields.tassoAnnuale
  - screens.prestitiForm.fields.durataMesi
  - screens.prestitiForm.fields.dataInizio
  - screens.prestitiForm.fields.tipo
  - screens.prestitiForm.fields.note
  - announce.prestiti.created
  - announce.prestiti.updated
  - announce.prestiti.deactivated
  - errors.prestitiForm.importoRequired
  - errors.prestitiForm.tassoInvalid
  - errors.prestitiForm.durataRequired
  - errors.prestiti.loadFailed
  - errors.prestiti.createFailed

__tests__/calculations/prestiti.test.ts — nuovo file
- Scenari obbligatori:
  - rata mensile di un mutuo standard (es. 100.000 euro, 2,5% annuo, 240 mesi) corrisponde al valore noto
  - rata mensile con tasso zero è importo diviso mesi
  - totale interessi è sempre maggiore o uguale a zero
  - piano di ammortamento ha esattamente durataMesi voci
  - debito residuo all'ultima rata è uguale a zero
  - somma di tutti i capitali rimborsati è uguale a importo_totale

__tests__/prestiti.repository.test.ts — nuovo file
- Scenari obbligatori:
  - getAll restituisce solo i prestiti dell'utente corrente
  - create inietta correttamente user_id
  - deactivate imposta attivo = false senza eliminare la riga
  - errori Supabase sono propagati come RepositoryError

Sezione 7 — Rischi e note operative
R1 — Precisione decimale: i calcoli finanziari con numeri decimali in JavaScript possono produrre risultati imprecisi per arrotondamento. Valutare l'uso di Math.round() su due decimali dopo ogni calcolo intermedio per evitare accumulo di errore.
R2 — Piano di ammortamento lungo: un mutuo da 30 anni produce 360 voci nel piano. La visualizzazione deve essere paginata o virtualizzata per non sovraccaricare il rendering.
R3 — Tasso zero: dividere per zero nella formula annuity è un caso limite che il codice deve gestire esplicitamente con una formula alternativa.

Sezione 8 — Acceptance criteria
- npm test EXIT:0 con le due nuove suite di test verdi
- npx tsc --noEmit EXIT:0 senza errori nuovi
- calcolaRataMensile(100000, 0.025, 240) produce il valore corretto con errore massimo di un centesimo
- deactivate non elimina fisicamente la riga
- Nessuna stringa hardcoded nei file di codice
- Lo script SQL 019-prestiti.sql include la policy RLS