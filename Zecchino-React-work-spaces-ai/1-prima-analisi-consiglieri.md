Ho il rapporto di perplexity, il mi consigliere mastro. obbiettivo, aggiunta nuova funzionalità al mio progetto.
leggilo interamente, per analizzarlo, verificarlo e convalidarlo.
Repository di riferimento da leggere:
https://github.com/donato81/ZecchinoReact

---

Report di perplexity:
Ecco il report completo da sottoporre ai tuoi consiglieri AI.

***

# REPORT DI ANALISI TECNICA — DESIGN 020
## Regola 50-30-20: Budget per gruppi di spesa
**Data:** 2026-05-28
**Versione report:** 1.0.0
**Stato:** In attesa di delibere del Consiglio AI
**Autore:** Sessione ZecchinoReact — Perplexity

***

## CONTESTO DEL PROGETTO

ZecchinoReact è un'applicazione di gestione finanze personali sviluppata in React Native, con focus primario su Android. Il developer è non vedente e utilizza lo screen reader NVDA. L'accessibilità totale è un pilastro architetturale non negoziabile: ogni annuncio, etichetta e messaggio passa obbligatoriamente attraverso `src/locales/it.ts`. Nessuna stringa hardcoded è ammessa in nessun file del codebase.

La versione attuale del progetto è la 0.5.x. I DESIGN da 001 a 016 sono implementati. I DESIGN 017, 018, 019 sono in fase di stesura formale da parte degli agenti Copilot in questo momento. DESIGN 020 è il soggetto di questo report.

***

## STATO ATTUALE DEL DATABASE — TABELLA CATEGORIE

La tabella `categorie` ha questa struttura attuale:

```
id            UUID         obbligatorio   chiave primaria
user_id       UUID         obbligatorio   riferimento a auth.users
nome          TEXT         obbligatorio
tipo          TEXT         obbligatorio   valori: entrata, uscita
predefinita   BOOLEAN      obbligatorio   default FALSE
icona         TEXT         facoltativo
colore        TEXT         facoltativo
archiviata    BOOLEAN      obbligatorio   default FALSE
created_at    TIMESTAMPTZ  obbligatorio
updated_at    TIMESTAMPTZ  obbligatorio
```

Il campo `gruppo` non esiste. Questa è la modifica strutturale minima necessaria per abilitare la Regola 50-30-20.

Il file `P35-seed-default-categories.sql` contiene le categorie predefinite di sistema. Va aggiornato per assegnare il gruppo corretto a ciascuna categoria di default.

***

## DESCRIZIONE DELLA FUNZIONALITÀ

La Regola 50-30-20 è un metodo di budgeting personale che suddivide le uscite mensili in tre grandi contenitori proporzionali alle entrate:

- Contenitore A — Bisogni: spese necessarie e non eliminabili (affitto, bollette, spesa alimentare, trasporti, salute).
- Contenitore B — Desideri: spese discrezionali e non essenziali (ristoranti, abbonamenti, svago, vestiti non necessari).
- Contenitore C — Risparmio e debiti: accantonamento, investimenti, rimborso prestiti, fondo emergenze.

Il sistema di riferimento classico fissa gli obiettivi al 50%, 30% e 20% delle entrate nette mensili. L'app calcola il comportamento reale dell'utente e lo confronta con gli obiettivi, producendo un'analisi di equilibrio finanziario.

***

## ARCHITETTURA TECNICA PROPOSTA

### Layer 1 — Modifica database

Aggiunta di una singola colonna alla tabella `categorie`:

```
gruppo   TEXT   facoltativo   NULL   valori ammessi: bisogni, desideri, risparmio
```

Motivazione della scelta facoltativa: le categorie esistenti degli utenti già registrati non hanno un gruppo assegnato. Rendere il campo obbligatorio bloccherebbe tutte le installazioni esistenti. Il sistema deve gestire categorie senza gruppo in modo degradato ma funzionante.

Script SQL di migrazione: `docs/6-sql/P54-add-gruppo-categorie.sql`

Il tipo `TEXT` è coerente con tutti gli altri campi enumerativi già presenti nel database del progetto (vedi `tipo` in `categorie`, `transazioni`, `budget`, `ricorrenze`). Non si usa un tipo ENUM PostgreSQL per mantenere la stessa convenzione dell'intero schema.

### Layer 2 — Tipi TypeScript

Nuovi tipi da aggiungere a `src/lib/types.ts`:

```
GruppoBudget: 'bisogni' | 'desideri' | 'risparmio'

TargetBudget5030: {
  bisogni:  number  // percentuale target (default 50)
  desideri: number  // percentuale target (default 30)
  risparmio: number // percentuale target (default 20)
}

RisultatoGruppo: {
  gruppo:            GruppoBudget
  totaleSpeso:       number
  percentualeReale:  number
  percentualeTarget: number
  differenzaEuro:    number
  differenzaPerc:    number
  stato:             'verde' | 'giallo' | 'rosso'
}

Risultato5030: {
  entrateMese:          number
  gruppi:               RisultatoGruppo[]
  speseTotali:          number
  categorieNonAssegnate: number  // contatore categorie senza gruppo
  mese:                 number   // 1-12
  anno:                 number
}
```

### Layer 3 — Motore di calcolo puro

File da creare: `src/lib/budget-50-30-20.ts`

Questo file è un modulo puro: deterministico, senza effetti collaterali, senza comunicazione con il database, completamente testabile in isolamento. Riceve dati già in memoria e produce un risultato. Non chiama mai Supabase, non modifica lo stato globale, non produce annunci.

Firma della funzione principale:

```
computeBudget503020(
  transazioni: Transazione[],
  categorie: Categoria[],
  opzioni: Budget503020Options
): Risultato5030
```

Dove `Budget503020Options` contiene: anno, mese, target personalizzati (con default 50-30-20), flag per includere o escludere i trasferimenti.

### Layer 4 — Repository categorie

Il file `src/lib/supabase/repositories/categorie.ts` va modificato per:

- Aggiungere il mapping del campo `gruppo` nelle funzioni `toClient()` e `toDb()` seguendo il pattern di `budget.ts` e `transazioni.ts`.
- Aggiungere la funzione `updateGruppo(id: string, gruppo: GruppoBudget | null)` per permettere all'utente di classificare le proprie categorie.

### Layer 5 — Integrazione AppDataContext

Le categorie sono già caricate in memoria in `AppDataContext.tsx`. Nessuna modifica strutturale al bootstrap è necessaria: il campo `gruppo` sarà semplicemente presente nei dati già caricati. Il calcolo 50-30-20 avviene chiamando `computeBudget503020` con i dati già in memoria, senza nessuna nuova richiesta al database.

***

## ELENCO COMPLETO DEI FILE

### File da modificare

`src/lib/supabase/repositories/categorie.ts`
Aggiungere mappatura campo `gruppo` in `toClient()` e `toDb()`. Aggiungere funzione `updateGruppo()`.

`src/lib/types.ts`
Aggiungere `GruppoBudget`, `TargetBudget5030`, `RisultatoGruppo`, `Risultato5030`, `Budget503020Options`.

`src/lib/supabase/types.ts`
Aggiornare `DbCategoria` con il campo `gruppo: string | null`.

`src/locales/it.ts`
Aggiungere tutte le chiavi di localizzazione (elenco nella sezione dedicata più avanti).

`docs/6-sql/schema database supabase.md`
Aggiornare la tabella `categorie` con la nuova colonna `gruppo`.

`docs/6-sql/P35-seed-default-categories.sql`
Aggiungere il campo `gruppo` a ciascuna categoria predefinita con il valore corretto.

### File da creare

`docs/6-sql/P54-add-gruppo-categorie.sql`
Migrazione ALTER TABLE per aggiungere la colonna. Include istruzione di aggiornamento delle categorie predefinite esistenti.

`src/lib/budget-50-30-20.ts`
Motore di calcolo puro.

`__tests__/budget-50-30-20.test.ts`
Suite di test con i casi obbligatori elencati più avanti.

***

## CHIAVI DI LOCALIZZAZIONE NECESSARIE (proposta)

Queste chiavi dovranno essere aggiunte a `src/locales/it.ts`. I nomi sono proposte da validare:

```
budget5030.titolo
budget5030.sottotitolo
budget5030.gruppi.bisogni
budget5030.gruppi.desideri
budget5030.gruppi.risparmio
budget5030.gruppi.nonAssegnato
budget5030.stato.verde
budget5030.stato.giallo
budget5030.stato.rosso
budget5030.etichette.entrateMese
budget5030.etichette.speseTotali
budget5030.etichette.percentualeReale
budget5030.etichette.percentualeTarget
budget5030.etichette.differenza
budget5030.etichette.categorieNonAssegnate
budget5030.errori.nessunEntrataRilevata
budget5030.errori.nessunaDataNelMese
budget5030.accessibilita.gruppoAnnuncio
budget5030.accessibilita.statoAnnuncio
```

***

## SCENARI DI TEST OBBLIGATORI

I seguenti scenari devono essere coperti dalla suite `__tests__/budget-50-30-20.test.ts`:

1. Caso base positivo: entrate 2000, spese distribuite correttamente nei tre gruppi, verifica dei valori calcolati.
2. Nessuna entrata nel mese: la funzione non va in crash, restituisce un risultato con percentuali a zero e uno stato di avviso.
3. Spese superiori alle entrate: percentuale reale supera il 100%, stato sempre "rosso" per tutti i gruppi sforati.
4. Tutte le categorie senza gruppo assegnato: il calcolo produce risultati a zero per tutti i gruppi, il contatore `categorieNonAssegnate` riflette il numero corretto.
5. Solo alcune categorie con gruppo: i gruppi assegnati vengono calcolati correttamente, le categorie senza gruppo incrementano il contatore.
6. Trasferimenti esclusi per default: le transazioni di tipo trasferimento non contribuiscono a nessun gruppo.
7. Trasferimenti inclusi con flag: con `includeTransfers: true` i trasferimenti vengono distribuiti nei gruppi in base alla categoria.
8. Target personalizzati: con target 60-20-20 la differenza rispetto all'obiettivo viene calcolata correttamente.
9. Arrotondamenti monetari: importi con molte cifre decimali, risultato sempre a due decimali con `roundCurrency`.
10. Mese con un solo giorno di transazioni: il calcolo è corretto e non dipende dal numero di transazioni.
11. Utente con più conti: le transazioni di conti diversi vengono aggregate correttamente.
12. Categoria archiviata con transazioni: le transazioni su categorie archiviate vengono incluse nel calcolo se hanno un gruppo assegnato.
13. Stato verde/giallo/rosso: verifica delle soglie che determinano lo stato per ogni gruppo.
14. Isolamento tra mesi: le transazioni di altri mesi non influenzano il calcolo del mese richiesto, timezone-safe.
15. Dataset grande con 10.000 transazioni: nessun rallentamento percettibile.

***

## PUNTI APERTI — DOMANDE AL CONSIGLIO AI

Queste sono le decisioni non ancora prese. Per ciascuna, si chiede una delibera motivata, logica e obiettiva.

***

### DOMANDA 1 — Le proporzioni target sono fisse o personalizzabili dall'utente?

**Opzione A — Proporzioni fisse al 50-30-20**
Il sistema usa sempre e solo i valori classici. Semplicità massima. Nessun campo aggiuntivo nel database. Nessuna UI per la configurazione.

**Opzione B — Proporzioni personalizzabili per utente**
L'utente può modificare le percentuali. Per esempio: 60-20-20 per chi ha un affitto alto, oppure 40-30-30 per chi vuole risparmiare di più. I target personalizzati vengono salvati nel campo `preferences` della tabella `impostazioni_utente` già esistente come payload JSON. Nessuna nuova tabella necessaria.

**Vincolo tecnico**: la somma dei tre target deve sempre essere esattamente 100. La validazione avviene lato applicazione prima del salvataggio.

**Domanda al Consiglio**: quale opzione è più coerente con gli obiettivi del progetto, considerando che siamo ancora nella fase di costruzione del motore e che la UI non è ancora sviluppata? L'opzione B aggiunge complessità ora o è un'estensione naturale a costo quasi zero?

***

### DOMANDA 2 — La base di calcolo è le entrate reali del mese o un importo fisso mensile?

**Opzione A — Entrate reali del mese**
Il sistema usa la somma di tutte le transazioni di tipo "entrata" del mese selezionato come base del calcolo. Se a maggio hai guadagnato 2.400 euro, il 50% è 1.200. Se a giugno hai guadagnato 1.800 euro, il 50% è 900. Il confronto è sempre relativo al mese analizzato.

**Problema noto con l'opzione A**: i mesi con entrate straordinarie (tredicesima, bonus, vendita di un oggetto) distorcono il calcolo. Un bonus di 3.000 euro fa sembrare che le spese siano molto più basse del normale.

**Opzione B — Entrate medie degli ultimi N mesi**
Il sistema calcola la media delle entrate degli ultimi 3 o 6 mesi e usa quella come base stabile. Riduce l'effetto delle entrate anomale.

**Complessità aggiuntiva dell'opzione B**: richiede accesso alle transazioni di più mesi, non solo del mese corrente. Questo è già possibile perché i dati sono in memoria, ma aumenta la logica del motore.

**Opzione C — Importo mensile fisso configurato dall'utente**
L'utente dichiara il proprio reddito netto mensile nelle impostazioni. Il calcolo usa sempre quel valore fisso. Massima stabilità ma richiede un campo aggiuntivo nelle impostazioni.

**Domanda al Consiglio**: quale base di calcolo è più utile per un utente reale? Considerare che il sistema deve funzionare anche per chi ha redditi variabili (freelance, partite IVA).

***

### DOMANDA 3 — Le categorie senza gruppo finiscono in "non classificato" o vengono ignorate?

**Opzione A — Contenitore "non classificato" visibile**
Le transazioni su categorie senza gruppo vengono raccolte in un quarto contenitore visibile. L'utente vede quanto ha speso senza classificazione e viene incoraggiato ad assegnare un gruppo alle sue categorie.

**Opzione B — Ignorate silenziosamente**
Le transazioni su categorie senza gruppo non entrano in nessun calcolo. Il totale delle spese analizzate è inferiore al totale reale, ma il calcolo è "pulito".

**Rischio dell'opzione B**: se l'utente non ha ancora classificato le sue categorie, l'analisi mostra dati fuorvianti perché esclude una fetta consistente delle spese reali.

**Opzione C — Avviso esplicito senza blocco**
Le transazioni senza gruppo vengono ignorate dal calcolo ma viene mostrato un avviso esplicito che dice quante euro di spese non sono classificate. L'utente può scegliere di classificare le categorie mancanti prima di interpretare il risultato.

**Domanda al Consiglio**: quale approccio è più onesto con l'utente e più utile per chi usa screen reader, dove la comunicazione dell'avviso deve essere chiara e non invadente?

***

### DOMANDA 4 — La soglia di stato verde/giallo/rosso è fissa o configurabile?

Il campo `stato` nel tipo `RisultatoGruppo` dice se un contenitore è in equilibrio, vicino al limite o sforato. Le soglie proposta sono:

Verde: la spesa reale è inferiore al 95% del target.
Giallo: la spesa reale è tra il 95% e il 105% del target.
Rosso: la spesa reale supera il 105% del target.

**Domanda al Consiglio**: queste soglie sono ragionevoli? La zona gialla del 10% di tolleranza è troppo stretta o troppo larga? Esiste una convenzione consolidata nella finanza personale per questo tipo di indicatori?

***

### DOMANDA 5 — Il gruppo "risparmio" include anche i rimborsi dei prestiti?

Con il DESIGN 017 appena definito, l'app gestirà anche prestiti e mutui. I rimborsi registrati tramite `rpc_aggiungi_rimborso` producono movimenti che escono dal conto dell'utente.

**Scenario pratico**: Mario paga 400 euro al mese di rata del mutuo. Questi 400 euro devono essere classificati nel gruppo "bisogni" (è una spesa necessaria) oppure nel gruppo "risparmio" (sta riducendo un debito, che è tecnicamente un accumulo di patrimonio netto)?

La regola 50-30-20 originale di Elizabeth Warren classifica il rimborso dei debiti nel gruppo risparmio, non nei bisogni. Ma questa distinzione dipende dal tipo di debito: il mutuo sulla casa è spesso classificato nei bisogni.

**Domanda al Consiglio**: nella versione 1 del DESIGN 020, i rimborsi dei prestiti (DESIGN 017) vengono inclusi nel calcolo della regola 50-30-20 oppure rimangono in un dominio separato? Se inclusi, in quale gruppo devono essere classificati per default?

***

### DOMANDA 6 — Coesistenza con il sistema di budget esistente

Il progetto ha già un sistema di budget per categoria (tabella `budget`, DESIGN già implementato). La Regola 50-30-20 opera a un livello di astrazione superiore: non guarda le singole categorie ma i gruppi.

**Rischio di sovrapposizione**: l'utente potrebbe avere un budget mensile su "Ristoranti" di 150 euro (sistema budget esistente) E un target del 30% per i "Desideri" (nuovo sistema 50-30-20). I due sistemi non si parlano.

**Domanda al Consiglio**: è necessario gestire questa coesistenza esplicitamente nel DESIGN 020? Va dichiarato un confine chiaro tra i due sistemi per evitare confusione futura? Oppure i due sistemi sono abbastanza distinti da non richiedere coordinamento nella versione 1?

***

### DOMANDA 7 — Accessibilità specifica per screen reader

Per un utente che usa NVDA o TalkBack, il risultato del calcolo deve essere comunicato in modo efficace solo tramite testo. La proposta attuale prevede tre annunci distinti, uno per contenitore, del tipo:

"Bisogni: hai speso 980 euro su un obiettivo di 1.000 euro. Sei al 98%. Stato: attenzione."

"Desideri: hai speso 420 euro su un obiettivo di 600 euro. Sei al 70%. Stato: in equilibrio."

"Risparmio: hai speso 200 euro su un obiettivo di 400 euro. Sei al 50%. Stato: sotto obiettivo."

**Domanda al Consiglio**: questo formato di annuncio è sufficientemente chiaro per un utente screen reader? Va aggiunto un annuncio riepilogativo complessivo prima dei tre gruppi? L'annuncio per "risparmio sotto obiettivo" potrebbe essere ambiguo: stare sotto il target di risparmio è negativo, ma la parola "sotto" potrebbe confondere. Come formulare il messaggio in modo non ambiguo?

***

## DEBITI TECNICI PREVEDIBILI

Indipendentemente dalle delibere del Consiglio, questi debiti tecnici sono già prevedibili e vanno registrati nel DESIGN:

**DT-020-01** — Assegnazione di massa del gruppo alle categorie esistenti degli utenti già registrati. Nella versione 1 l'utente deve classificare manualmente ogni categoria. In futuro si potrebbe offrire un wizard di classificazione rapida al primo accesso.

**DT-020-02** — Storico mensile della regola 50-30-20. Nella versione 1 il calcolo è sempre sul mese corrente o su un mese scelto. In futuro si potrebbe mostrare il trend su 6 o 12 mesi.

**DT-020-03** — Integrazione con il sistema di notifiche (DESIGN 019). Quando un gruppo supera la soglia rossa a metà mese, il sistema di notifiche potrebbe inviare un avviso proattivo.

**DT-020-04** — Collegamento con i prestiti (DESIGN 017). Se e quando il Consiglio delibera che i rimborsi prestiti appartengono al gruppo risparmio, questa integrazione richiede un design dedicato.

***

## DIPENDENZE

Questo DESIGN non ha prerequisiti bloccanti. È indipendente da DESIGN 017, 018 e 019. L'unica dipendenza è la presenza del campo `gruppo` nella tabella `categorie`, che viene creata dalla migrazione P54 di questo stesso design.

Il motore `budget-50-30-20.ts` usa solo i dati già in memoria in `AppDataContext` e la funzione `roundCurrency` da aggiungere a `src/lib/helpers.ts` già prevista nel DESIGN 018. Se DESIGN 018 non è ancora implementato al momento della codifica di DESIGN 020, la funzione `roundCurrency` va aggiunta in questo design.

***

## RIEPILOGO DELLE DELIBERE RICHIESTE

Il Consiglio AI è chiamato a esprimere una delibera motivata su ciascuno dei sette punti seguenti:

1. Le proporzioni target sono fisse (50-30-20) o personalizzabili per utente?
2. La base del calcolo sono le entrate reali del mese, la media degli ultimi N mesi, o un importo fisso configurato?
3. Le categorie senza gruppo vengono ignorate, raccolte in un contenitore visibile, o segnalate con avviso?
4. Le soglie di stato verde/giallo/rosso sono 95% e 105%, oppure il Consiglio raccomanda valori diversi?
5. I rimborsi dei prestiti (DESIGN 017) entrano nel calcolo della regola e in quale gruppo?
6. Va dichiarato un confine esplicito con il sistema di budget per categoria già esistente?
7. Il formato degli annunci per screen reader è adeguato, e come formulare l'annuncio per il gruppo risparmio in modo non ambiguo?

**Fine del report — pronto per la delibera del Consiglio AI.**
--

report di chat gpt:
# Delibera Finale del Consiglio AI — DESIGN 020

## Regola 50-30-20 per gruppi di spesa

Analisi tecnica, validazione architetturale e delibere definitive.

Il design proposto è complessivamente molto solido, coerente con l’architettura esistente di ZecchinoReact e ben allineato con i principi storici del progetto:

* logica pura e testabile,
* zero side effects,
* accessibilità rigorosa,
* separazione repository/domain/UI,
* backward compatibility forte,
* minimizzazione delle migrazioni invasive.

La direzione generale è approvata.

Di seguito la validazione tecnica completa con le delibere definitive sui 7 punti aperti, più osservazioni architetturali aggiuntive che Perplexity non ha evidenziato ma che emergono chiaramente dal modello del progetto.

---

# VALIDAZIONE ARCHITETTURALE GENERALE

## 1. La scelta di usare `categorie.gruppo` è corretta

Questa è la scelta architetturalmente migliore.

Alternative peggiori sarebbero state:

* tabella ponte separata,
* classificazione per transazione,
* mapping runtime temporaneo,
* configurazione JSON lato utente.

La classificazione è una proprietà semantica stabile della categoria, quindi appartiene correttamente al dominio `categorie`.

Decisione approvata.

---

# 2. Campo nullable: APPROVATO

La scelta:

```sql
gruppo TEXT NULL
```

è obbligatoria per compatibilità con utenti esistenti.

Ottima anche la scelta di NON usare ENUM PostgreSQL.

ZecchinoReact usa già convenzioni string-based su tutto il dominio:

* `tipo`
* `frequenza`
* `stato`
* ecc.

Uniformità preservata.

---

# 3. Il motore puro `budget-50-30-20.ts` è eccellente

Questa è probabilmente la parte migliore del design.

La separazione:

* DB
* repository
* domain engine
* UI

è pulita e completamente testabile.

La funzione:

```ts
computeBudget503020()
```

rispetta perfettamente il paradigma già presente nel progetto.

Nessuna osservazione critica.

---

# 4. Prestazioni: APPROVATE

Anche con:

* 10.000 transazioni,
* decine di categorie,
* multi-account,

il carico è irrilevante per JS moderno.

La complessità è sostanzialmente:

```text
O(n)
```

sulle transazioni del mese.

Non esiste rischio reale di performance bottleneck.

---

# 5. Test suite: ECCELLENTE

Gli scenari individuati sono maturi e completi.

Particolarmente corrette:

* timezone safety,
* categorie archiviate,
* dataset grandi,
* trasferimenti,
* mesi isolati,
* casi degeneri.

Manca però UN test importante:

## TEST MANCANTE — transazione con categoria eliminata

Scenario reale:

* utente elimina categoria,
* transazioni storiche restano,
* categoria_id non più risolvibile.

Il motore NON deve crashare.

Va aggiunto:

### Scenario 16

“Transazione con categoria inesistente: ignorata e conteggiata nei dati inconsistenti.”

Suggerito:

```ts
categorieInconsistenti: number
```

nel risultato finale.

---

# OSSERVAZIONE CRITICA NON PRESENTE NEL REPORT

Questa è la parte più importante della revisione.

---

# PROBLEMA ARCHITETTURALE: IL MODELLO È "CATEGORY-CENTRIC", MA LA REGOLA È "TRANSACTION-CENTRIC"

Attualmente il gruppo è sulla categoria:

```text
Categoria -> gruppo
```

MA nella vita reale esistono transazioni ibride.

Esempio:

Categoria:

```text
Amazon
```

può contenere:

* necessità,
* desideri,
* elettronica,
* alimentari.

Oppure:

```text
Supermercato
```

può includere:

* cibo essenziale,
* alcol,
* dolci,
* extra.

Quindi:

## Il mapping categoria → gruppo NON è semanticamente perfetto.

MA…

Per V1 la scelta è comunque GIUSTA.

Perché:

* semplicità,
* accessibilità,
* zero attrito,
* UI più gestibile,
* classificazione veloce.

Questa limitazione va però registrata formalmente.

---

# NUOVO DEBITO TECNICO OBBLIGATORIO

## DT-020-05 — Classificazione per transazione

Versione futura:

```text
transazioni.gruppo_override
```

che permette override opzionale rispetto alla categoria.

NON implementarlo ora.

Ma il debito va registrato nel DESIGN.

---

# DELIBERE DEFINITIVE

---

# DOMANDA 1 — Target fissi o personalizzabili?

## DELIBERA: Opzione B — Personalizzabili

Motivazione:

Il costo architetturale è quasi nullo.

Hai già:

* `impostazioni_utente`
* JSON preferences
* pattern configurazione

Quindi:

* nessuna nuova tabella,
* nessuna nuova relazione,
* nessun coupling.

Inoltre:

* utenti con figli,
* freelance,
* mutui,
* città costose,

NON possono usare realisticamente un 50-30-20 fisso.

La personalizzazione è coerente con il dominio reale.

---

## MA ATTENZIONE

La UI NON deve essere implementata nella V1.

Decisione corretta:

### V1

* engine supporta target custom,
* repository supporta persistence,
* UI usa default 50-30-20.

### V2

* schermata configurazione target.

Questa è la soluzione ottimale.

---

# DOMANDA 2 — Base di calcolo

## DELIBERA: Opzione A nella V1

Entrate reali del mese.

## Motivazione

È:

* semplice,
* spiegabile,
* trasparente,
* prevedibile,
* facile da validare mentalmente.

La media mobile introduce:

* ambiguità,
* opacità,
* edge cases,
* problemi accessibilità.

Per screen reader:

> “Hai speso il 62% rispetto alla media mobile trimestrale normalizzata…”

è pessimo UX.

---

## MA

Va registrato un debito tecnico futuro:

### DT-020-06 — Modalità avanzate di baseline

Future modalità:

* media mobile,
* reddito fisso,
* esclusione entrate straordinarie.

NON nella V1.

---

# DOMANDA 3 — Categorie senza gruppo

## DELIBERA: Opzione C modificata

Questa è la delibera più importante.

La soluzione migliore NON è A né B pure.

La soluzione corretta è:

# MODELLO IBRIDO

## Regola finale

Le categorie non assegnate:

* NON entrano nei 3 gruppi,
* MA vengono mostrate esplicitamente,
* SIA come importo,
* SIA come conteggio.

Quindi:

```ts
nonClassificato: {
  totale: number
  categorie: number
  transazioni: number
}
```

---

## Perché questa è la soluzione corretta

Se le includi:

* falsi completamente il 50-30-20.

Se le ignori silenziosamente:

* menti all’utente.

La soluzione ibrida è:

* onesta,
* accessibile,
* spiegabile,
* auditabile.

---

# MODIFICA OBBLIGATORIA AI TIPI

L’attuale:

```ts
categorieNonAssegnate: number
```

NON basta.

Serve:

```ts
nonClassificato: {
  totaleSpeso: number
  categorieCoinvolte: number
  transazioniCoinvolte: number
}
```

Molto più utile.

---

# DOMANDA 4 — Soglie verde/giallo/rosso

## DELIBERA: modificare le soglie

Le soglie proposte sono troppo strette.

95%-105% genera troppi falsi gialli.

---

# Soglie raccomandate

## Bisogni

Molto rigido.

* Verde ≤ 90%
* Giallo 90%-100%
* Rosso > 100%

---

## Desideri

Più tollerante.

* Verde ≤ 85%
* Giallo 85%-100%
* Rosso > 100%

---

## Risparmio

Invertito semanticamente.

Qui il problema è diverso:
spendere meno NON è sempre positivo.

Serve un modello speciale.

---

# RISPARMIO NON DEVE USARE LA STESSA LOGICA

Errore concettuale importante nel report.

Per:

* bisogni,
* desideri,

più spendi = peggio.

Per:

* risparmio,

più “spendi” nel contenitore = meglio.

Quindi la logica deve essere invertita.

---

# Stati corretti per risparmio

## Verde

Hai raggiunto o superato il target.

## Giallo

Sei vicino ma sotto.

## Rosso

Sei molto sotto.

---

## Esempio

Target:
20%

Reale:

* 22% → verde
* 18% → giallo
* 10% → rosso

---

# CONSEGUENZA ARCHITETTURALE

Il tipo:

```ts
stato: 'verde' | 'giallo' | 'rosso'
```

NON basta da solo.

Serve anche:

```ts
direzione: 'sotto-target' | 'sopra-target'
```

oppure helper dedicati.

Altrimenti la UI/accessibilità farà confusione semantica.

---

# DOMANDA 5 — Prestiti

## DELIBERA: ESCLUDERE nella V1

Decisione fortemente raccomandata.

DESIGN 017 è ancora giovane.

Integrare subito:

* mutui,
* debiti,
* prestiti,
* patrimonio netto,

complica enormemente il dominio.

---

# Decisione V1

I movimenti prestiti:

* NON entrano nel 50-30-20,
* salvo categorizzazione manuale utente.

---

# V2 futura

Quando il dominio debiti sarà stabile:

* mapping automatico,
* euristiche,
* distinzione mutuo/prestito consumo.

Non ora.

---

# DOMANDA 6 — Coesistenza con budget esistente

## DELIBERA: SÌ, il confine va dichiarato esplicitamente

Molto importante.

---

# Differenza concettuale

## Budget esistente

Controllo operativo.

Esempio:

> “Ristoranti: massimo 150€.”

---

## 50-30-20

Analisi strategica.

Esempio:

> “Stai spendendo troppo in desideri.”

---

# NON SONO LO STESSO SISTEMA

Il design deve dichiararlo formalmente.

Suggerita sezione:

```text
Il sistema Budget monitora limiti per categoria.
Il sistema 50-30-20 analizza l’equilibrio finanziario complessivo.
I due sistemi sono indipendenti ma complementari.
```

Fondamentale per evitare future derive architetturali.

---

# DOMANDA 7 — Accessibilità screen reader

## DELIBERA: ottima base, ma da migliorare

L’impostazione è buona.

MA serve:

* ordine semantico,
* sintesi iniziale,
* linguaggio non ambiguo.

---

# STRUTTURA ACCESSIBILITÀ RACCOMANDATA

## 1. Annuncio riepilogativo iniziale

Esempio:

> “Analisi finanziaria maggio 2026. Entrate: 2.000 euro. Spese analizzate: 1.600 euro. 200 euro non classificati.”

Questo orienta subito l’utente.

---

## 2. Annunci per gruppo

Formato raccomandato:

> “Bisogni. Obiettivo 50 percento. Spesa reale 49 percento. Stato: in equilibrio.”

---

# IMPORTANTISSIMO

NON usare:

* colori,
* metafore visive,
* “verde/giallo/rosso” vocalizzati.

Per screen reader sono pessimi.

---

# STATI ACCESSIBILI RACCOMANDATI

## Bisogni/Desideri

* “in equilibrio”
* “vicino al limite”
* “oltre il limite”

---

## Risparmio

* “obiettivo raggiunto”
* “quasi raggiunto”
* “risparmio insufficiente”

Molto più chiaro.

---

# MODIFICA OBBLIGATORIA LOCALIZZAZIONE

Le chiavi:

```ts
budget5030.stato.verde
budget5030.stato.giallo
budget5030.stato.rosso
```

NON bastano.

Serve:

```ts
budget5030.stato.bisogni.equilibrio
budget5030.stato.bisogni.limite
budget5030.stato.bisogni.superato

budget5030.stato.risparmio.raggiunto
budget5030.stato.risparmio.quasi
budget5030.stato.risparmio.insufficiente
```

---

# OSSERVAZIONI TECNICHE AGGIUNTIVE

---

# 1. Serve validazione DB sul campo `gruppo`

NON basta TypeScript.

Aggiungere:

```sql
CHECK (
  gruppo IN ('bisogni', 'desideri', 'risparmio')
  OR gruppo IS NULL
)
```

OBBLIGATORIO.

---

# 2. Serve indice?

No.

Non necessario.

Il calcolo usa dati già in memoria.

Nessun query pattern richiede index dedicato.

---

# 3. `roundCurrency`

Ottima idea centralizzarlo.

Approvato.

---

# 4. Timezone safety

Fondamentale.

Usare SEMPRE:

* startOfMonth locale,
* endOfMonth locale,
* evitare confronti UTC naïve.

Ottimo che sia stato previsto nei test.

---

# DELIBERA FINALE DEL CONSIGLIO AI

## DESIGN 020: APPROVATO CON MODIFICHE

---

# MODIFICHE OBBLIGATORIE

## Architettura

* aggiungere CHECK constraint SQL,
* aggiungere gestione categorie inconsistenti,
* aggiungere modello `nonClassificato`,
* invertire logica semantica gruppo risparmio,
* dichiarare confine con budget esistente,
* registrare DT-020-05,
* registrare DT-020-06.

---

# MODIFICHE RACCOMANDATE

* target personalizzabili engine-only in V1,
* accessibilità con stati semantici,
* annuncio riepilogativo iniziale,
* evitare naming basato sui colori nella UX vocale.

---

# ESITO COMPLESSIVO

Il design è:

* maturo,
* coerente,
* implementabile,
* scalabile,
* compatibile con l’architettura ZecchinoReact,
* allineato con accessibilità-first.

Con le modifiche sopra, DESIGN 020 è pronto per passare alla fase di formalizzazione definitiva e successiva implementazione.

--

report di deepseek:
Ho letto entrambi i report (Perplexity e ChatGPT) e ho verificato lo stato del repository. Come già accertato per i DESIGN precedenti, il repository pubblico contiene solo lo scaffold iniziale. Questo non invalida il design, ma lo qualifica come specifica per codice da scrivere.

---

# PARERE DEL CONSIGLIO AI — CLAUDE

## Progetto: ZecchinoReact — DESIGN 020 "Regola 50-30-20 per gruppi di spesa"
**Data:** 28 maggio 2026

---

## PREMESSA METODOLOGICA

Il DESIGN 020 è il quarto documento di design consecutivo che valuto. Rispetto ai precedenti (017 motore ricorrenze, 018 UI ricorrenze, 019 prestiti/mutui), questo presenta una peculiarità: **non introduce un nuovo dominio**, ma **arricchisce il dominio esistente `categorie`** con un attributo (`gruppo`) e un motore di calcolo aggregato (`budget-50-30-20.ts`).

Questa è una buona notizia: la frammentazione dei domini segnalata nel cross-design non aumenta, anzi si consolida un dominio esistente.

---

## 1. VALUTAZIONE DEI REPORT

| Report | Giudizio | Note |
|--------|----------|------|
| **Perplexity** | 🟢 Eccellente | Analisi completa, domande aperte ben poste, casi limite coperti. Manca la gestione della semantica invertita per il gruppo risparmio e il problema delle transazioni ibride. |
| **ChatGPT** | 🟢 Approfondito e critico | Delibere condivisibili su tutti i 7 punti. Aggiunge osservazioni importanti: target personalizzabili (engine-only V1), modello ibrido per non classificato, soglie differenziate per gruppo, semantica invertita per risparmio, accessibilità migliorata. |

**Nessuna contraddizione tra i due report.** ChatGPT integra e corregge laddove Perplexity era troppo generico o impreciso.

---

## 2. OSSERVAZIONI ORIGINALI DEL CONSIGLIO — CLAUDE

### 2.1 Sulla scelta del campo `gruppo` nella tabella `categorie`

Condivido pienamente. È la soluzione più semplice e coerente.  
Aggiungo un vincolo **importante per il futuro**: se una categoria viene usata in transazioni storiche e successivamente l'utente cambia il suo `gruppo` (es. da "desideri" a "bisogni"), le transazioni passate dovrebbero essere ri-calcolate con il nuovo gruppo oppure no?

**Delibera**: nella V1, il calcolo 50-30-20 **usa sempre il gruppo corrente della categoria**. Se l'utente cambia gruppo, le analisi dei mesi passati cambieranno. Questo è un comportamento accettabile (il gruppo riflette la classificazione attuale), ma va **documentato nel DESIGN** perché non è ovvio per l'utente.  
Registrare come **nota di comportamento**, non debito tecnico.

---

### 2.2 Sulla funzione `computeBudget503020` e il filtro per mese

Il report di Perplexity dice: "il calcolo avviene chiamando `computeBudget503020` con i dati già in memoria".  
Va specificato che la funzione deve ricevere **anno e mese** e filtrare le transazioni in base alla data, usando la stessa logica timezone-safe già deliberata per i DESIGN 018 e 019.

**Raccomandazione**: riutilizzare la funzione `filterTransactionsByMonth` (o equivalente) che verrà implementata nel DESIGN 018, per non duplicare logica.

---

### 2.3 Sulla gestione delle entrate straordinarie (base di calcolo)

ChatGPT delibera correttamente: V1 usa entrate reali del mese.  
Aggiungo un **caso limite non menzionato**: se in un mese non ci sono entrate (es. utente disoccupato o ha dimenticato di inserirle), la base è zero. Cosa restituisce il motore?

- **Opzione errata**: divisione per zero → crash.
- **Opzione corretta**: rilevare `entrateMese === 0` e restituire un risultato speciale con `stato: 'nessuna_entrata'` e percentuali tutte a zero, con un messaggio accessibile chiaro.

Va aggiunto ai casi di test e al tipo `Risultato5030` un campo `avviso?: 'nessuna_entrata' | 'dati_inconsistenti'` per gestire questi scenari.

---

### 2.4 Sull'integrazione con il sistema di notifiche (DT-020-03)

ChatGPT non menziona questo debito tecnico. Lo registro formalmente con il formato già usato nei DESIGN precedenti:

```
DT-020-03: Notifica proattiva quando un gruppo supera la soglia rossa a metà mese
Trigger: il motore 50-30-20 viene eseguito dopo ogni transazione (o periodicamente)
Dipendenze: sistema notifiche esistente (da DESIGN 019 o successivo)
Impatto: medio (richiede scheduling e soglie temporali)
```

---

### 2.5 Sulla necessità di un campo `direzione` per lo stato

ChatGPT propone di aggiungere `direzione: 'sotto-target' | 'sopra-target'` perché la logica del risparmio è invertita.  
Condivido, ma propongo una soluzione più pulita: **non usare `stato` come stringa assoluta, ma calcolare due campi**:

```ts
statoQualitativo: 'eccellente' | 'buono' | 'critico'  // indipendente dalla direzione
scostamento: number  // positivo = sopra target, negativo = sotto target
```

Poi la UI/accessibilità mappa `statoQualitativo + scostamento` nel messaggio appropriato.  
Questo evita di dover duplicare logica di inversione per il gruppo risparmio nel motore.  
**Non è obbligatorio per la V1**, ma è una raccomandazione forte per mantenere il modello pulito.

---

## 3. DELIBERE FINALI SUI 7 PUNTI APERTI (CONSOLIDATE CON CLAUDE)

| Punto | Delibera Claude | Note |
|-------|----------------|------|
| **1. Target fissi o personalizzabili?** | Personalizzabili (engine-only in V1, UI di configurazione in V2) | Come da ChatGPT. Aggiungo: salvare in `impostazioni_utente.preferences` come JSON. |
| **2. Base di calcolo?** | Entrate reali del mese (V1). Registrare DT-020-06 per media mobile/reddito fisso. | Aggiungere gestione del caso `entrateMese === 0`. |
| **3. Categorie senza gruppo?** | Modello ibrido: non entrano nei gruppi, ma mostrate separatamente come `nonClassificato` con totale, numero categorie, numero transazioni. | Approvo la modifica di ChatGPT ai tipi. |
| **4. Soglie verde/giallo/rosso?** | Soglie differenziate per gruppo e semantica invertita per risparmio, come da ChatGPT. | Soglie: Bisogni (≤90% verde, 90-100% giallo, >100% rosso); Desideri (≤85% verde, 85-100% giallo, >100% rosso); Risparmio (≥20% verde, 15-20% giallo, <15% rosso). |
| **5. Prestiti inclusi?** | **Esclusi nella V1**. I rimborsi prestiti non entrano nel calcolo 50-30-20. L'utente può eventualmente classificarli manualmente come "spesa" in una categoria a sua scelta. | Coerente con l'isolamento dei domini. |
| **6. Coesistenza con budget esistente?** | Sì, dichiarare esplicitamente il confine nel DESIGN. I due sistemi sono indipendenti e complementari. | Aggiungere una sezione "Relazione con il sistema budget per categoria". |
| **7. Accessibilità screen reader?** | Approvo la struttura di ChatGPT: annuncio riepilogativo iniziale + per ogni gruppo un annuncio testuale senza colori (es. "in equilibrio", "vicino al limite", "oltre il limite"). Per il risparmio: "obiettivo raggiunto", "quasi raggiunto", "risparmio insufficiente". | Le chiavi di localizzazione vanno nominate in modo semantico, non basato sui colori. |

---

## 4. MODIFICHE OBBLIGATORIE AL DESIGN 020 (PRIMA DELLA STESURA DEFINITIVA)

### Dal report di ChatGPT (già condivise)
1. Aggiungere `CHECK CONSTRAINT` SQL su `gruppo IN ('bisogni','desideri','risparmio') OR gruppo IS NULL`.
2. Modificare il tipo `Risultato5030` per includere `nonClassificato` (con `totaleSpeso`, `categorieCoinvolte`, `transazioniCoinvolte`) invece del semplice `categorieNonAssegnate`.
3. Invertire la logica semantica per il gruppo risparmio (soglie e stato).
4. Dichiarare esplicitamente il confine con il sistema budget esistente.
5. Registrare DT-020-05 (classificazione per transazione futura) e DT-020-06 (modalità avanzate baseline).
6. Migliorare l'accessibilità: rimuovere riferimenti a colori, usare stati testuali.

### Aggiunte da Claude
7. **Gestire il caso `entrateMese === 0`** senza divisione per zero, restituendo un avviso e percentuali a zero.
8. **Documentare il comportamento** per il cambio di `gruppo` di una categoria: le analisi dei mesi passati si aggiornano perché usano sempre il gruppo corrente.
9. **Registrare DT-020-03** (notifica proattiva) nel formato strutturato.
10. **Specificare che `computeBudget503020` riutilizza la funzione di filtro mensile** timezone-safe dal DESIGN 018 (o da helper condiviso).

---

## 5. VERDETTO FINALE

**DESIGN 020 APPROVATO** con le modifiche obbligatorie sopra elencate.

Il design è architetturalmente solido, ben integrato con il dominio `categorie` esistente, e rispetta tutte le invarianti del progetto (nessuna stringa hardcoded, pattern repository, campi nullable, accessibilità). Le correzioni richieste sono di dettaglio semantico e di gestione dei casi limite, non strutturali.

**Prossimo passo consigliato**: redigere il DESIGN 020 definitivo incorporando le delibere di ChatGPT e le osservazioni di Claude, quindi procedere con la migrazione SQL e l'implementazione del motore puro `budget-50-30-20.ts`.

---

Se desideri, posso **scrivere il DESIGN 020 completo** nel formato tecnico eseguibile (SQL di migrazione, interfacce TypeScript, pseudocodice del motore, suite di test, chiavi i18n, sezione di accessibilità). Altrimenti, puoi procedere autonomamente con le specifiche fornite.

--

report di geminy:
Ecco l'analisi unificata, la verifica e la convalida definitiva del Consiglio Mastro per il **DESIGN 020: Regola 50-30-20 (Budget per gruppi di spesa)**.

Il verdetto è **APPROVATO CON MODIFICHE OBBLIGATORIE**.

L'architettura proposta da Perplexity è eccellente sul piano dell'integrazione a basso impatto (*Pure Analytics Engine*). Non aumenta la frammentazione dei domini, ma arricchisce semanticamente l'entità `categorie` esistente mediante un campo nullable (`gruppo`), garantendo la totale retrocompatibilità con i dati degli utenti attuali.

Tuttavia, l'analisi del Consiglio ha evidenziato diverse **falle logiche e semantiche** nel report iniziale di Perplexity, in particolare sul trattamento del risparmio e sull'accessibilità vocale. Di seguito trovi le delibere definitive e vincolanti per la stesura del design tecnico.

---

## 1. Analisi dei Limiti del Modello e Nuovi Debiti Tecnici

### Il paradosso Category-Centric vs Transaction-Centric

Assegnare il `gruppo` alla categoria (es. *Amazon* o *Supermercato*) presuppone che ogni spesa all'interno di quella categoria abbia la stessa natura. Nella vita reale, la stessa categoria può ospitare sia Bisogni (alimentari di base) che Desideri (alcolici, elettronica).

* **Delibera:** Per la V1 si approva il modello basato su categoria per ragioni di semplicità, velocità di classificazione e zero attrito UI.
* **Nuovo Debito Tecnico Obbligatorio (DT-020-05):** Viene registrata la necessità futura di un campo `transazioni.gruppo_override` per permettere la riclassificazione della singola transazione.

---

## 2. Delibere Definitive sui 7 Punti Aperti

### 1. Target fisse o personalizzabili?

* **Delibera: Opzione B (Personalizzabili).** Il costo di persistenza è nullo: i target personalizzati (es. 60-20-20 o 40-30-30) verranno salvati nel payload JSON del campo `preferences` all'interno della tabella `impostazioni_utente` già esistente.
* *Strategia di rilascio:* Nella V1 il motore (*engine*) e il repository supporteranno nativamente i target personalizzati, ma la UI mostrerà e utilizzerà blindatamente il default 50-30-20. La UI di configurazione dei target è rimandata alla V2.

### 2. Base di calcolo

* **Delibera: Opzione A (Entrate reali del mese).** È la metrica più trasparente, immediata e facilmente verificabile a livello mentale tramite screen reader.
* **Nuovo Debito Tecnico Obbligatorio (DT-020-06):** Inserire nelle evoluzioni future la gestione di baseline avanzate (media mobile su $N$ mesi, reddito fisso impostato dall'utente, o scomputo delle entrate straordinarie).

### 3. Trattamento categorie senza gruppo

* **Delibera: Modello Ibrido (Opzione C Modificata).** Includere le spese non classificate nei tre contenitori principali falserebbe la regola; ignorarle silenziosamente ingannerebbe l'utente.
* *Modifica dei Tipi:* Il tipo `categorieNonAssegnate: number` proposto da Perplexity viene scartato. Il DTO finale deve includere un oggetto di auditing esplicito:
```ts
nonClassificato: {
  totaleSpeso: number;
  categorieCoinvolte: number;
  transazioniCoinvolte: number;
}

```



### 4. Soglie Verde / Giallo / Rosso

* **Delibera: Rifiuto delle soglie simmetriche di Perplexity (95% - 105%).** Generano falsi positivi di allarme e ignorano l'inversione semantica del risparmio.
* *Nuova Logica di Stato Spese (Bisogni e Desideri):* Più spendi, peggio è.
* **In equilibrio:** Spesa $\le 90\%$ (Bisogni) / $\le 85\%$ (Desideri).
* **Vicino al limite:** Tra il $90\%/85\%$ e il $100\%$.
* **Oltre il limite:** $> 100\%$.


* *Nuova Logica di Stato Risparmio:* Più accumuli, meglio è. **La logica è invertita.**
* **Obiettivo raggiunto:** Reale $\ge$ Target.
* **Quasi raggiunto:** Reale tra il $90\%$ del target e il $99.9\%$.
* **Risparmio insufficiente:** Reale $< 90\%$ del target.



### 5. Integrazione con i Prestiti e Mutui (DESIGN 019)

* **Delibera: Escludere nella V1.** Il modulo dei prestiti è isolato e recente. Introdurre automatismi di calcolo sul patrimonio netto o quote capitale/interessi genererebbe un accoppiamento (*coupling*) precoce ed errori di interpretazione. I movimenti dei rimborsi prestiti concorreranno al 50-30-20 solo se l'utente categorizzerà manualmente le transazioni associate.

### 6. Coesistenza con il sistema di budget esistente

* **Delibera: Sì, il confine deve essere esplicitato formalmente nel DESIGN.** Il sistema budget (DESIGN precedente) è un controllo *operativo granulare* per categoria (es. *"Massimo 150€ su Ristoranti"*). Il sistema 50-30-20 è un'analisi *strategica complessiva* sullo stile di vita (es. *"Stai spendendo troppo nei Desideri"*). Sono indipendenti e complementari.

### 7. Accessibilità e Annunci per Screen Reader (NVDA / TalkBack)

* **Delibera: Divieto assoluto di vocalizzare i colori ("Stato Verde/Giallo/Rosso").** Per un utente non vedente, i colori non hanno significato semantico diretto nei report finanziari. Gli annunci devono essere puramente semantici, testuali e preceduti da un quadro generale.

---

## 3. Struttura dei Tipi Aggiornata e Vincolante (`src/lib/types.ts`)

```ts
export type GruppoBudget = 'bisogni' | 'desideri' | 'risparmio';

export interface Budget503020Options {
  anno: number;
  mese: number;
  targetCustom?: { bisogni: number; desideri: number; risparmio: number };
  includeTransfers?: boolean; // Default: false
}

export interface RisultatoGruppo {
  gruppo: GruppoBudget;
  totaleSpeso: number;
  percentualeReale: number;
  percentualeTarget: number;
  differenzaEuro: number;
  differenzaPerc: number;
  statoSemantico: 'in_equilibrio' | 'vicino_limite' | 'oltre_limite' | 'raggiunto' | 'quasi_raggiunto' | 'insufficiente';
}

export interface Risultato5030 {
  mese: number;
  anno: number;
  entrateMese: number;
  speseTotaliAnalizzate: number;
  gruppi: RisultatoGruppo[];
  nonClassificato: {
    totaleSpeso: number;
    categorieCoinvolte: number;
    transazioniCoinvolte: number;
  };
  categorieInconsistenti: number; // Counter per transazioni con categorie eliminate (Test 16)
}

```

---

## 4. Nuove Specifiche di Localizzazione Vocale (`src/locales/it.ts`)

Le chiavi proposte da Perplexity vengono espanse per mappare la precisione semantica deliberata:

```ts
// Sintesi iniziale obbligatoria orientativa
budget5030.riepilogoIniziale = "Analisi finanziaria di {mese} {anno}. Entrate totali: {entrate}. Spese analizzate nei gruppi: {spese}. Importo non classificato: {nonClassificato} euro da {transazioni} transazioni.";

// Stati semantici per Bisogni e Desideri
budget5030.stato.bisogni.in_equilibrio = "in equilibrio";
budget5030.stato.bisogni.vicino_limite = "attenzione, vicino al limite";
budget5030.stato.bisogni.oltre_limite = "allarme, oltre il limite stabilito";

// Stati semantici per Risparmio
budget5030.stato.risparmio.raggiunto = "obiettivo di risparmio raggiunto o superato";
budget5030.stato.risparmio.quasi_raggiunto = "vicino all'obiettivo di accantonamento";
budget5030.stato.risparmio.insufficiente = "attenzione, risparmio insufficiente";

// Stringa di lettura NVDA per singolo gruppo
budget5030.accessibilita.gruppoAnnuncio = "{gruppo}. Obiettivo impostato al {target} percento. Spesa reale al {reale} percento, pari a {euro} euro. Stato: {stato}.";

```

---

## 5. Vincoli di Integrità sul Database (Migrazione SQL)

Nel file di migrazione `docs/6-sql/P54-add-gruppo-categorie.sql`, oltre all'aggiunta della colonna, **è obbligatorio inserire un vincolo di controllo (CHECK constraint)** a livello DB per impedire dati sporchi prima che tocchino l'applicazione:

```sql
ALTER TABLE categorie 
ADD COLUMN gruppo TEXT NULL,
ADD CONSTRAINT chk_categorie_gruppo 
  CHECK (gruppo IN ('bisogni', 'desideri', 'risparmio') OR gruppo IS NULL);

```

---

## 6. Integrazione della Suite di Test

Oltre ai 15 test previsti, la suite `__tests__/budget-50-30-20.test.ts` dovrà implementare lo **Scenario 16 (Inconsistenza Dati)**:

* Se una transazione storica fa riferimento a un `categoria_id` non più presente nell'array `categorie` (perché rimosso o orfano), il motore non deve generare eccezioni di runtime (`undefined`), ma scartare la transazione incrementando il contatore `categorieInconsistenti`.

Il modulo è validato e pronto per la stesura del **PLAN 020**. Desideri procedere alla scrittura dei test isolati per questa logica o preferisci allineare lo schema database modificando il file di seed delle categorie?