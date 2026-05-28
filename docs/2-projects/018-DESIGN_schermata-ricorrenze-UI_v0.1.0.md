---
Titolo: DESIGN 018 — Schermata Ricorrenze — Interfaccia Utente
Versione: 0.1.0
Data: 2026-05-28
Stato: DRAFT
Prerequisiti: DESIGN 013, DESIGN 017
DebitiTecniciOriginati: nessuno
---

# DESIGN 018 — Schermata Ricorrenze — Interfaccia Utente

Sezione 1 — Intestazione e metadati
- Titolo: DESIGN 018 — Schermata Ricorrenze — Interfaccia Utente
- Versione: 0.1.0
- Data: 2026-05-28
- Stato: DRAFT
- Prerequisiti: DESIGN 013 (repository ricorrenze) e DESIGN 017 (motore ricorrenze) devono essere implementati e chiusi.
- Debiti tecnici originati: nessuno previsto

Sezione 2 — Obiettivo
Realizzare la schermata dedicata alla gestione delle ricorrenze nell'app. L'utente deve poter vedere l'elenco delle ricorrenze attive, creare nuove ricorrenze, modificare quelle esistenti e disattivarle. La schermata è accessibile al 100% con screen reader NVDA su Windows e con TalkBack su Android. Ogni elemento interattivo ha una label accessibile significativa, non generica.
La schermata esiste in tre versioni: Windows, Android, iOS. Le differenze tra piattaforme riguardano solo la navigazione e i controlli nativi, non la logica.

Sezione 3 — Invarianti architetturali specifiche
- Nessuna stringa visibile all'utente o annunciata dallo screen reader può essere scritta direttamente nel codice. Ogni testo passa obbligatoriamente da src/locales/it.ts. Senza eccezioni.
- Ogni elemento interattivo della schermata deve avere accessibilityLabel e accessibilityHint espliciti, entrambi passati da src/locales/it.ts. Mai label generate dinamicamente concatenando stringhe senza passare per il sistema di localizzazione.
- Gli annunci per screen reader su azioni completate (ricorrenza creata, modificata, disattivata) passano dal sistema di annunci già presente nel progetto, non da alert nativi.
- La schermata non effettua chiamate dirette al database. Usa esclusivamente il repository ricorrenze del DESIGN 013 tramite il contesto dati dell'app.

Sezione 4 — Struttura della schermata
Componente principale: src/screens/RicorrenzeScreen.tsx
La schermata è composta da:
- Header con titolo e pulsante Aggiungi nuova ricorrenza
- Lista scorrevole delle ricorrenze attive, ogni voce mostra: descrizione, importo, frequenza, data prossima generazione, tipo (entrata o uscita), conto associato
- Ogni voce ha un pulsante Modifica e un pulsante Disattiva accessibili separatamente
- Schermata vuota accessibile quando non ci sono ricorrenze

Componente form: src/screens/RicorrenzeFormScreen.tsx
Usato sia per creare che per modificare una ricorrenza.
Campi del form:
- Descrizione (testo obbligatorio)
- Importo (numero obbligatorio, maggiore di zero)
- Tipo (entrata o uscita, selettore)
- Frequenza (giornaliera, settimanale, mensile, annuale)
- Conto associato (selettore tra i conti esistenti)
- Categoria (selettore opzionale)
- Data inizio (selettore data)
- Data fine (selettore data opzionale)
Ogni campo ha label accessibile e messaggio di errore accessibile quando la validazione fallisce.

Sezione 5 — Accessibilità — requisiti specifici
Lo screen reader NVDA su Windows deve leggere ogni voce della lista come unità semantica completa, ad esempio: "Affitto mensile, uscita, 850 euro, prossima generazione primo giugno duemilaventisei".
Il pulsante Disattiva deve avere un hint che spiega cosa succederà: "Tocca due volte per disattivare questa ricorrenza. La ricorrenza non verrà eliminata."
Dopo una creazione riuscita, lo screen reader annuncia: "Ricorrenza creata con successo."
Dopo una disattivazione riuscita, lo screen reader annuncia: "Ricorrenza disattivata."

Sezione 6 — File da creare o modificare
src/screens/RicorrenzeScreen.tsx — nuovo file

src/screens/RicorrenzeFormScreen.tsx — nuovo file

src/navigation/ — aggiungere la nuova schermata al navigator principale

src/locales/it.ts — aggiungere le seguenti chiavi:
- screens.ricorrenze.title
- screens.ricorrenze.empty
- screens.ricorrenze.addButton
- screens.ricorrenze.editButton
- screens.ricorrenze.deactivateButton
- screens.ricorrenze.deactivateHint
- screens.ricorrenze.item.label
- screens.ricorrenzeForm.titleCreate
- screens.ricorrenzeForm.titleEdit
- screens.ricorrenzeForm.fields.descrizione
- screens.ricorrenzeForm.fields.importo
- screens.ricorrenzeForm.fields.tipo
- screens.ricorrenzeForm.fields.frequenza
- screens.ricorrenzeForm.fields.conto
- screens.ricorrenzeForm.fields.categoria
- screens.ricorrenzeForm.fields.dataInizio
- screens.ricorrenzeForm.fields.dataFine
- screens.ricorrenzeForm.saveButton
- screens.ricorrenzeForm.cancelButton
- announce.ricorrenze.created
- announce.ricorrenze.updated
- announce.ricorrenze.deactivated
- errors.ricorrenzeForm.importoRequired
- errors.ricorrenzeForm.importoInvalid
- errors.ricorrenzeForm.descrizioneRequired
- errors.ricorrenzeForm.contoRequired

Sezione 7 — Rischi e note operative
R1 — Selettore data su Windows: i selettori data nativi si comportano diversamente su Windows, Android e iOS. Il PLAN 018 deve scegliere un componente cross-platform già validato nel progetto o documentare quale usare.
R2 — Lista lunga: se l'utente ha molte ricorrenze, la lista deve essere virtualizzata per evitare problemi di performance.
R3 — Form modale o schermata: decidere se il form di creazione e modifica appare come schermata separata nel navigator o come foglio modale. Documentare la scelta nel PLAN.

Sezione 8 — Acceptance criteria
- npm test EXIT:0 con test nuovi per i componenti
- npx tsc --noEmit EXIT:0 senza errori nuovi
- NVDA legge correttamente ogni voce della lista su Windows
- Il form è completabile senza mouse, solo con tastiera
- Nessuna stringa hardcoded nel codice dei componenti
- Tutte le label accessibili passano da src/locales/it.ts