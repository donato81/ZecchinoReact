Ho ora tutti gli elementi necessari. I file DESIGN 005 e DESIGN 006 sono entrambi in stato `REVIEWED` con versioni `v0.4.0` e `v0.2.0`. Dal CHANGELOG emerge che le correzioni documentali su entrambi i file sono già state applicate (il CHANGELOG registra micro-correzioni C1–C4 su DESIGN 005 e le correzioni pre-REVIEWED su DESIGN 006). Leggendo attentamente il contenuto attuale dei file, rilevo le anomalie residue da correggere — in particolare la \*\*chiave espansa nel Vettore 1\*\* di DESIGN 005 che risulta di 33 caratteri invece di 32, e alcune voci del frontmatter da allineare. Ecco il prompt completo:



\*\*\*



```

════════════════════════════════════════════════════════════

PROMPT CORRETTIVO — AGGIORNAMENTO CHIRURGICO

DESIGN 005 e DESIGN 006

Progetto: ZecchinoReact | Branch: main | Data: 2026-05-22

════════════════════════════════════════════════════════════



\## RUOLO E VINCOLI ASSOLUTI



Sei un agente chirurgico di aggiornamento documentale.

I tuoi soli file di lavoro in questa sessione sono:



&#x20; docs/2-projects/005-DESIGN\_sostituzione-crypto-N4\_v0.4.0.md

&#x20; docs/2-projects/006-DESIGN\_kdf-pin\_v0.2.0.md



Non modificare nessun altro file nella fase di correzione

chirurgica. Non creare branch dedicati.

Non eseguire nessuna azione prima di aver letto, analizzato

e verificato entrambi i file target come descritto in FASE 1.



Regola fondamentale: LEGGI → VERIFICA → AGISCI → RIVEDI → CONVALIDA.

Non saltare mai nessuno di questi passi, in nessun caso.



════════════════════════════════════════════════════════════

FASE 1 — LETTURA E ANALISI PRELIMINARE (OBBLIGATORIA)

════════════════════════════════════════════════════════════



Esegui questi passi prima di qualsiasi modifica.



PASSO 1A — Leggi integralmente:

&#x20; docs/2-projects/005-DESIGN\_sostituzione-crypto-N4\_v0.4.0.md



PASSO 1B — Identifica e trascrivi internamente:

&#x20; - Il valore attuale del campo "versione" nel frontmatter.

&#x20; - Il valore attuale del campo "stato" nel frontmatter.

&#x20; - Il testo attuale della riga "Chiave espansa a 32 byte"

&#x20;   nel Vettore 1 della sezione 5.

&#x20; - Il testo attuale della riga "Chiave espansa a 32 byte"

&#x20;   nel Vettore 2 della sezione 5.

&#x20; - Il numero di righe totali del file.



PASSO 1C — Leggi integralmente:

&#x20; docs/2-projects/006-DESIGN\_kdf-pin\_v0.2.0.md



PASSO 1D — Identifica e trascrivi internamente:

&#x20; - Il valore attuale del campo "versione" nel frontmatter.

&#x20; - Il valore attuale del campo "stato" nel frontmatter.

&#x20; - Il testo attuale del floor iterazioni PBKDF2 in sezione 4

&#x20;   (cerca "100.000" o "100000").

&#x20; - Il testo attuale del richiamo al floor in sezione 7.

&#x20; - Il numero di righe totali del file.



PASSO 1E — Verifica che entrambi i file siano leggibili

&#x20; e non corrotti. Se uno dei due non è leggibile o risulta

&#x20; mancante: STOP. Emetti report diagnostico DF-0 e attendi

&#x20; istruzione.



PASSO 1F — Conferma internamente che ogni modifica elencata

&#x20; in FASE 2 è coerente con il contenuto letto. Solo dopo

&#x20; questa conferma, procedi con FASE 2.



════════════════════════════════════════════════════════════

FASE 2 — MODIFICHE CHIRURGICHE

════════════════════════════════════════════════════════════



Le modifiche sono numerate e atomiche.

Applica una modifica alla volta, nell'ordine indicato.

Non riformulare testo non indicato. Non aggiungere righe

non specificate. Non rimuovere nulla oltre a quanto indicato.

Dopo ogni modifica: rileggi la riga modificata e verifica

che il risultato corrisponda esattamente al valore DOPO.



────────────────────────────────────────────────────────────

FILE TARGET: 005-DESIGN\_sostituzione-crypto-N4\_v0.4.0.md

────────────────────────────────────────────────────────────



MODIFICA D5-M1 — Frontmatter: campo "data"

&#x20; Sezione: frontmatter (righe 1–10)

&#x20; Campo: data

&#x20; PRIMA: 2026-05-20

&#x20; DOPO:  2026-05-22

&#x20; Motivazione: allineamento alla data di applicazione

&#x20; correzioni documentali.



MODIFICA D5-M2 — Sezione 5, Vettore 1, riga chiave espansa

&#x20; Sezione: ## 5. Golden Compatibility Tests

&#x20; Sottosezione: ### Vettore 1 — Testo breve ASCII

&#x20; Campo nella tabella: "Chiave espansa a 32 byte"

&#x20; PRIMA: `testkey0000000000000000000000000`

&#x20; DOPO:  `testkey000000000000000000000000`

&#x20; Motivazione: la chiave grezza è "testkey" (7 caratteri).

&#x20; La regola di espansione è: padding con caratteri "0"

&#x20; fino a raggiungere 32 caratteri totali. 7 + 25 zeri = 32.

&#x20; Il valore PRIMA contiene 26 zeri (totale 33 caratteri),

&#x20; che è errato. Il valore DOPO contiene 25 zeri (totale

&#x20; 32 caratteri), che è corretto.

&#x20; VERIFICA OBBLIGATORIA dopo la modifica: conta i caratteri

&#x20; del valore DOPO (esclusi i backtick). Il conteggio deve

&#x20; essere esattamente 32. Se il conteggio è diverso da 32,

&#x20; la modifica è errata: correggila prima di procedere.



MODIFICA D5-M3 — Sezione 5, Vettore 2, riga chiave espansa

&#x20; Sezione: ## 5. Golden Compatibility Tests

&#x20; Sottosezione: ### Vettore 2 — Testo con caratteri Unicode e simboli

&#x20; Campo nella tabella: "Chiave espansa a 32 byte"

&#x20; PRIMA: `mysecretkey2026!0000000000000000`

&#x20; DOPO:  `mysecretkey2026!0000000000000000`

&#x20; Motivazione: la chiave grezza è "mysecretkey2026!" (16

&#x20; caratteri). 16 + 16 zeri = 32. Questo valore è già

&#x20; corretto. Esegui la verifica del conteggio e, se il

&#x20; valore attuale nel file corrisponde già esattamente,

&#x20; non apportare alcuna modifica a questa riga.

&#x20; VERIFICA OBBLIGATORIA: conta i caratteri (esclusi i

&#x20; backtick). Il risultato deve essere 32. Se è già 32,

&#x20; salta questa modifica e registra "D5-M3: nessuna

&#x20; modifica necessaria".



MODIFICA D5-M4 — Appendice, caso A1: chiarimento plaintext

&#x20; Sezione: ## Appendice — Test suite da creare

&#x20; Sottosezione: ### Casi aggiuntivi

&#x20; Caso: A1 (contratto asincrono)

&#x20; Cerca il testo: "il valore restituito da `encryptData` e da

&#x20; `decryptData` deve essere un'istanza di Promise"

&#x20; Subito dopo quella frase, verifica se è presente la

&#x20; seguente precisazione:

&#x20;   "Verificare sia per il percorso di successo che per

&#x20;   il percorso di errore."

&#x20; Se la precisazione NON è presente, aggiungila come

&#x20; frase separata immediatamente dopo, nello stesso punto

&#x20; del testo.

&#x20; Se è già presente, non modificare nulla e registra

&#x20; "D5-M4: nessuna modifica necessaria".



────────────────────────────────────────────────────────────

FILE TARGET: 006-DESIGN\_kdf-pin\_v0.2.0.md

────────────────────────────────────────────────────────────



MODIFICA D6-M1 — Frontmatter: campo "data"

&#x20; Sezione: frontmatter (righe 1–9)

&#x20; Campo: data

&#x20; PRIMA: 2026-05-20

&#x20; DOPO:  2026-05-22

&#x20; Motivazione: allineamento alla data di applicazione

&#x20; correzioni documentali.



MODIFICA D6-M2 — Sezione 4: verifica floor iterazioni PBKDF2

&#x20; Sezione: ## 4. Scelta architetturale della KDF

&#x20; Sottosezione: ### Algoritmo scelto: PBKDF2-SHA256

&#x20; Cerca il passaggio che definisce il numero minimo di

&#x20; iterazioni PBKDF2-SHA256.

&#x20; Verifica che il testo contenga esplicitamente la frase

&#x20; (o equivalente): "floor minimo invalicabile di 100.000

&#x20; iterazioni" con riferimento alle raccomandazioni OWASP.

&#x20; Se il floor è espresso come numero diverso da 100.000

&#x20; (ad esempio 10.000 o senza floor esplicito), sostituisci

&#x20; il valore con 100.000 e aggiungi la seguente nota

&#x20; parentetica subito dopo: "(floor OWASP contemporaneo

&#x20; per PBKDF2-SHA256 con HMAC-SHA256)".

&#x20; Se il floor 100.000 e il riferimento OWASP sono già

&#x20; presenti, non modificare nulla e registra

&#x20; "D6-M2: nessuna modifica necessaria".



MODIFICA D6-M3 — Sezione 7: verifica richiamo floor

&#x20; Sezione: ## 7. Budget prestazionale

&#x20; Cerca il passaggio che descrive il budget di tempo

&#x20; 100–300 ms per la derivazione PBKDF2.

&#x20; Verifica che il testo contenga esplicitamente un

&#x20; richiamo al floor minimo di 100.000 iterazioni e

&#x20; alla procedura da seguire se il budget non è

&#x20; raggiungibile entro 100–300 ms.

&#x20; Se il richiamo non è presente, aggiungi la seguente

&#x20; frase alla fine del paragrafo pertinente:

&#x20;   "Se il budget 100–300 ms non è raggiungibile

&#x20;   con 100.000 iterazioni sul device target, il

&#x20;   Coding Plan deve documentare il tradeoff scelto

&#x20;   prima di procedere."

&#x20; Se il richiamo è già presente, non modificare nulla

&#x20; e registra "D6-M3: nessuna modifica necessaria".



MODIFICA D6-M4 — Sezione 10, Passo 3: verifica salt embedded

&#x20; Sezione: ## 10. Sequenza operativa PIN privato

&#x20; Sottosezione: ### Verifica e decifrazione con PIN

&#x20; Cerca il Passo 3 della sequenza.

&#x20; Verifica che il testo specifichi esplicitamente che:

&#x20;   (a) il salt embedded nel payload è la fonte di verità

&#x20;       per la decifratura;

&#x20;   (b) il salt su Supabase non è un criterio bloccante

&#x20;       per i payload esistenti;

&#x20;   (c) l'integrità crittografica è delegata all'AuthTag

&#x20;       AES-GCM.

&#x20; Se uno dei tre punti non è esplicitamente presente,

&#x20; aggiungi una nota chiarificatrice dopo il Passo 3,

&#x20; formulata in modo coerente con il tono del documento.

&#x20; Se tutti e tre i punti sono già presenti, non modificare

&#x20; nulla e registra "D6-M4: nessuna modifica necessaria".



MODIFICA D6-M5 — Sezione 11: verifica assenza payload legacy

&#x20; Sezione: ## 11. Compatibilità con versioni future

&#x20; Cerca la dichiarazione che afferma l'assenza di payload

&#x20; persistiti in formato PIN antecedenti a DESIGN 006.

&#x20; Verifica che il testo contenga esplicitamente:

&#x20;   "Non esistono payload persistiti in formato PIN

&#x20;   antecedenti a questa implementazione."

&#x20; e che sia dichiarata l'obbligatorietà di KDF\_VERSION

&#x20; per tutti i payload PIN senza eccezioni.

&#x20; Se la dichiarazione non è presente, aggiungila in fondo

&#x20; alla sezione, prima di qualsiasi elemento successivo.

&#x20; Se è già presente, non modificare nulla e registra

&#x20; "D6-M5: nessuna modifica necessaria".



════════════════════════════════════════════════════════════

FASE 3 — CICLO DI REVISIONE POST-MODIFICA

════════════════════════════════════════════════════════════



Dopo aver applicato tutte le modifiche D5-M1–D5-M4 e

D6-M1–D6-M5, esegui questo ciclo obbligatorio.

Ripeti fino a convalida superata.

Limite: 10 tentativi. Se raggiungi il limite, salta la fase

e accoda il report diagnostico DF-3 in fondo a entrambi

i file, poi procedi a FASE 4.



CICLO-R (da ripetere per ogni tentativo):



&#x20; PASSO R1 — Rileggere integralmente

&#x20;   docs/2-projects/005-DESIGN\_sostituzione-crypto-N4\_v0.4.0.md

&#x20;   nella versione modificata.



&#x20; PASSO R2 — Verificare che ogni modifica D5-M1–D5-M4 sia

&#x20;   presente, completa e non abbia alterato testo adiacente

&#x20;   non previsto. Verifica specifica per D5-M2: conta i

&#x20;   caratteri della chiave espansa nel Vettore 1. Deve

&#x20;   essere esattamente 32.



&#x20; PASSO R3 — Rileggere integralmente

&#x20;   docs/2-projects/006-DESIGN\_kdf-pin\_v0.2.0.md

&#x20;   nella versione modificata.



&#x20; PASSO R4 — Verificare che ogni modifica D6-M1–D6-M5 sia

&#x20;   presente, completa e non abbia alterato testo adiacente

&#x20;   non previsto.



&#x20; PASSO R5 — Verificare che nessuna sezione sia stata

&#x20;   rimossa o troncata accidentalmente in nessuno dei

&#x20;   due file.



&#x20; PASSO R6 — Verificare che tutte le tabelle markdown

&#x20;   in entrambi i file siano ancora valide (pipe presenti,

&#x20;   riga di separazione intestazione presente).



&#x20; PASSO R7 — Verificare coerenza interna dei due file:

&#x20;   le date del frontmatter devono corrispondere a

&#x20;   2026-05-22. I valori numerici (floor iterazioni,

&#x20;   lunghezze buffer, conteggio caratteri chiavi espanse)

&#x20;   devono essere internamente coerenti con il testo

&#x20;   descrittivo circostante.



&#x20; CONVALIDA-R: Se tutti i passi R1–R7 passano senza

&#x20;   anomalie, il ciclo è superato. Procedi a FASE 4.

&#x20;   Se anche solo un passo rileva un'anomalia,

&#x20;   correggi e ripeti il ciclo dall'inizio.

&#x20;   Registra il numero del tentativo corrente.



════════════════════════════════════════════════════════════

FASE 4 — COMMIT

════════════════════════════════════════════════════════════



Solo dopo che CICLO-R è superato, esegui il commit con

questo messaggio esatto:



&#x20; docs: correzioni chirurgiche DESIGN 005 v0.4.0 e DESIGN 006 v0.2.0



Il commit deve contenere esclusivamente:

&#x20; docs/2-projects/005-DESIGN\_sostituzione-crypto-N4\_v0.4.0.md

&#x20; docs/2-projects/006-DESIGN\_kdf-pin\_v0.2.0.md



Nessun altro file.



════════════════════════════════════════════════════════════

FASE 5 — AGGIORNAMENTO DOCUMENTAZIONE E CHANGELOG

════════════════════════════════════════════════════════════



Dopo il commit di FASE 4, esegui i seguenti aggiornamenti.

Anche qui: LEGGI prima di modificare.



────────────────────────────────────────────────────────────

F5.1 — CHANGELOG.md

────────────────────────────────────────────────────────────

Leggi il file CHANGELOG.md nella sua interezza.

Nella sezione \[Unreleased], aggiungi la seguente voce

sotto la categoria "Documentation" (creala se non esiste):



&#x20; - docs/2-projects/005-DESIGN\_sostituzione-crypto-N4\_v0.4.0.md:

&#x20;   correzioni chirurgiche post-REVIEWED. D5-M1: data frontmatter

&#x20;   aggiornata a 2026-05-22. D5-M2: chiave espansa Vettore 1

&#x20;   corretta a 32 caratteri (era 33). D5-M3: verifica Vettore 2

&#x20;   (nessuna modifica necessaria). D5-M4: caso A1 appendice

&#x20;   verificato e integrato se necessario.

&#x20; - docs/2-projects/006-DESIGN\_kdf-pin\_v0.2.0.md:

&#x20;   correzioni chirurgiche post-REVIEWED. D6-M1: data frontmatter

&#x20;   aggiornata a 2026-05-22. D6-M2–D6-M5: verifica e integrazione

&#x20;   dichiarazioni floor PBKDF2, richiamo budget, salt embedded

&#x20;   come fonte di verità, assenza payload legacy.



Non aggiornare il numero di versione del CHANGELOG.

Non creare una nuova sezione di release.

Queste modifiche sono esclusivamente documentali e non

soddisfano nessun criterio di rilascio.



────────────────────────────────────────────────────────────

F5.2 — SPARK-START.md

────────────────────────────────────────────────────────────

Leggi il file SPARK-START.md.

Verifica se contiene riferimenti espliciti allo stato

dei DESIGN 005 o DESIGN 006.

Se tali riferimenti esistono, aggiornali in coerenza con

lo stato REVIEWED e la data 2026-05-22.

Se non esistono riferimenti a questi DESIGN, non

modificare il file e registra "F5.2: nessuna modifica

necessaria a SPARK-START.md".



────────────────────────────────────────────────────────────

F5.3 — Aggiornamento release

────────────────────────────────────────────────────────────

Non incrementare la versione del progetto.

Le modifiche di questa sessione sono esclusivamente

documentali (correzioni di valori errati in sezioni

di test e chiarimenti architetturali). Non è soddisfatto

nessun criterio che giustifichi un bump di versione.



════════════════════════════════════════════════════════════

FASE 6 — CICLO DI REVISIONE DOCUMENTAZIONE

════════════════════════════════════════════════════════════



Dopo F5.1 e F5.2, esegui questo ciclo.

Limite: 10 tentativi. Se raggiungi il limite, accoda

report diagnostico DF-6 e fermati.



CICLO-D (da ripetere):



&#x20; PASSO D1 — Rileggere CHANGELOG.md e verificare che le

&#x20;   voci aggiunte siano corrette, nella sezione \[Unreleased],

&#x20;   sotto la categoria Documentation.



&#x20; PASSO D2 — Rileggere SPARK-START.md e verificare coerenza

&#x20;   con lo stato del progetto se il file è stato modificato.



&#x20; PASSO D3 — Verificare che nessun altro file sia stato

&#x20;   toccato fuori dall'elenco esplicito di FASE 5.



&#x20; CONVALIDA-D: Se tutti i passi D1–D3 passano, procedi

&#x20;   al commit finale.

&#x20;   Altrimenti correggi e ripeti.



Commit finale documentazione:



&#x20; docs: aggiornamento CHANGELOG post-correzioni DESIGN 005 e DESIGN 006



════════════════════════════════════════════════════════════

FORMATO REPORT DIAGNOSTICO

════════════════════════════════════════════════════════════



Usare se si supera il limite di tentativi in qualsiasi ciclo.

Accodare in fondo al file interessato o come commento

nel commit se il file non è modificabile.



DF-\[codice] — REPORT DIAGNOSTICO

&#x20; Fase in cui si è verificato il problema: \[FASE N]

&#x20; Tentativo numero: \[N su 10]

&#x20; Modifica o passo che non supera la convalida: \[id modifica]

&#x20; Descrizione del problema rilevato: \[una riga chiara]

&#x20; Stato del file al momento dello stop: \[integro /

&#x20;   parzialmente modificato / corrotto]

&#x20; Azioni già eseguite prima dello stop: \[elenco]

&#x20; Azione consigliata per sbloccare: \[raccomandazione concreta]



════════════════════════════════════════════════════════════

RIEPILOGO ORDINE DI ESECUZIONE

════════════════════════════════════════════════════════════



FASE 1 — Lettura e analisi preliminare obbligatoria

FASE 2 — Modifiche chirurgiche D5-M1/M4 e D6-M1/M5

FASE 3 — Ciclo di revisione post-modifica (max 10 tentativi)

FASE 4 — Commit esclusivo DESIGN 005 e DESIGN 006

FASE 5 — Aggiornamento CHANGELOG.md e SPARK-START.md

FASE 6 — Ciclo di revisione documentazione (max 10 tentativi)

&#x20;         Commit finale documentazione



════════════════════════════════════════════════════════════

FILE AUTORIZZATI IN QUESTA SESSIONE

════════════════════════════════════════════════════════════



Correzione chirurgica (FASE 2–4):

&#x20; docs/2-projects/005-DESIGN\_sostituzione-crypto-N4\_v0.4.0.md

&#x20; docs/2-projects/006-DESIGN\_kdf-pin\_v0.2.0.md



Documentazione (FASE 5–6):

&#x20; CHANGELOG.md

&#x20; SPARK-START.md (solo se contiene riferimenti a D005/D006)



Qualsiasi altro file è fuori perimetro.

Non toccare src/, docs/3-coding-plans/, docs/4-todo-lists/,

docs/0-architecture/, docs/1-reports/, né altri file

in docs/2-projects/.

Se emergono necessità fuori perimetro: STOP e segnala.



════════════════════════════════════════════════════════════

```



\*\*\*



Il prompt è pronto da copiare. La correzione più concreta è la \*\*D5-M2\*\*: la chiave espansa nel Vettore 1 di DESIGN 005 ha 33 caratteri invece di 32 — `testkey` ha 7 caratteri, quindi il padding con zeri deve portare a 32 totali (25 zeri), non 33. Le modifiche D6-M2 attraverso D6-M5 sono verifiche di presenza: se le clausole sono già nel testo (come risulta dalla lettura del file), l'agente le registra come "nessuna modifica necessaria" e non tocca nulla.

