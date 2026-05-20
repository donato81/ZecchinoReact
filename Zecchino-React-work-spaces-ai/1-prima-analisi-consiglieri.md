Ho il rapporto di perplexity, sulla valutazione della implementazione del nuovo file di design : docs/1-projects/006-DESIGN_kdf-pin_v0.2.0.md.
leggilo interamente per analizzarlo, verificarlo e convalidarlo.

Repository di riferimento da leggere:
https://github.com/donato81/ZecchinoReact

---

Report di perplexity:
Ho letto tutti e tre i documenti necessari. Procedo a redigere il report di analisi.

***

# REPORT DI ANALISI E CONVALIDA — DESIGN 006
## Key Derivation Function per PIN privato — v0.2.0

Data analisi: 20 maggio 2026
Documento analizzato: `docs/2-projects/006-DESIGN_kdf-pin_v0.2.0.md`
Stato dichiarato: DRAFT
Sorgente primaria: DESIGN 005 §4.5
Analizzato in relazione a: DESIGN 005 v0.4.0 (REVIEWED), ADR_001 v1.2.0 (APPROVATO)

***

## Esito complessivo

**Il documento è CONVALIDATO con una riserva critica e tre osservazioni minori.**

Non ci sono contraddizioni con ADR_001, non ci sono conflitti con il formato di payload stabilito in DESIGN 005, e la catena di dipendenze dichiarata è coerente. La riserva critica riguarda un punto di ambiguità sul numero di iterazioni PBKDF2 che deve essere risolto prima che il documento possa passare da DRAFT a REVIEWED.

***

## Analisi sezione per sezione

### Sezioni 1 e 2 — Contesto e precondizione

Coerenti e corretti. Il riferimento al §4.5 di DESIGN 005 è preciso: quel paragrafo documenta esplicitamente la debolezza del padding come debito di sicurezza critico rinviato. La dipendenza tecnica da DESIGN 005 è dichiarata in modo dettagliato e il perimetro della dipendenza è giustificato con precisione. Nessuna osservazione.

### Sezione 3 — Perimetro

Coerente con DESIGN 005. La separazione tra "in scope" e "fuori scope" è netta. Il fuori scope elenca correttamente `hashPin`/`verifyPin` come invariate, in linea con quanto stabilito da DESIGN 005 §2. Nessuna osservazione.

### Sezione 4 — Scelta architetturale della KDF

Scelta solida e giustificata. L'esclusione di scrypt (rischio freeze per memory-hardness su device con RAM limitata) e Argon2 (mancanza di implementazione pure-JS compatibile con Hermes su tutti e tre i target) è motivata in modo specifico e congruente con i vincoli tecnici del progetto.

La scelta di `@noble/hashes` come implementazione PBKDF2 è coerente con la famiglia `@noble/ciphers` già introdotta in DESIGN 005. La famiglia è la stessa, l'approccio è uniforme, il vendor di dipendenza è identico. Questo è un elemento di qualità.

**Riserva critica — iterazioni PBKDF2 non fissate**: il documento scrive esplicitamente che il numero di iterazioni non è fissato qui e sarà calibrato nel Coding Plan 006. Questo è tecnicamente giustificabile, ma lascia aperto un parametro che ha impatto diretto sia sulla sicurezza sia sull'usabilità. Il budget prestazionale (sezione 7) stabilisce l'intervallo 100-300 ms, ma senza un valore di partenza o un range orientativo di iterazioni, il Coding Plan potrebbe calibrare su un valore inadeguato. Per PBKDF2-SHA256, i riferimenti standard attuali indicano valori nell'ordine delle centinaia di migliaia di iterazioni per rientrare in quel budget su hardware mobile moderno. Questa informazione orientativa non deve necessariamente diventare un valore fissato, ma dovrebbe essere presente nel documento di design per vincolare il Coding Plan.

### Sezione 5 — Salt

Corretta e ben strutturata. L'esclusione del salt deterministico è motivata con precisione. La dimensione di 16 byte (128 bit) è adeguata per la protezione contro rainbow tables. Il riutilizzo del CSPRNG di DESIGN 005 (`react-native-get-random-values`) è coerente e non introduce nuove dipendenze.

L'invariante di coerenza tra `pin_privato_hash` e `pin_kdf_salt` è dichiarata chiaramente, sezione 5 e poi ripresa in sezione 10. La gestione dell'atomicità è correttamente delegata al Coding Plan 006, con la motivazione esplicita che è una scelta tecnica di implementazione, non un vincolo architetturale da fissare in questo documento. Questo approccio è corretto.

### Sezione 6 — Versionamento del payload

La struttura del payload esteso è coerente con il formato base di DESIGN 005. La formula `1 + 16 + 12 + N + 16 = 45 + N` è matematicamente corretta e verificabile.

La distinzione tra il payload di DESIGN 005 (chiave esplicita) e il payload di DESIGN 006 (chiave derivata da PIN) è dichiarata in modo netto. I due formati non condividono la stessa colonna, il che elimina il rischio di ambiguità a runtime.

La motivazione per introdurre il versionamento prima che esistano dati reali è solida: il costo è un byte, il beneficio è la possibilità di aggiornare parametri KDF in futuro senza migrazioni distruttive.

**Osservazione minore 1**: la sezione afferma che "I due formati non sono usati in modo intercambiabile sulla stessa colonna" ma non indica esplicitamente su quale colonna/e vengono scritti i payload PIN. Il Coding Plan dovrà inferirlo dal contesto. Sarebbe utile un riferimento esplicito alla colonna di destinazione.

### Sezione 7 — Budget prestazionale

L'intervallo 100-300 ms è ragionevole per un'operazione di derivazione su thread JavaScript sincrono. La scelta di calibrare su Windows come piattaforma primaria è coerente con la dichiarazione del progetto.

Il documento menziona correttamente che "il Coding Plan 006 dovrà valutare l'esecuzione su thread separato se necessario". Questa è una precauzione opportuna per prevenire il blocco del thread JS durante la derivazione.

**Osservazione minore 2**: il documento non indica come misurare il tempo di derivazione durante la calibrazione. Specificare che la misurazione deve avvenire su device fisico (non emulatore) e con profiling RN standard ridurrebbe il rischio di calibrazioni inaffidabili. Questa indicazione non è architetturale ma operativa, e può essere aggiunta al Coding Plan.

### Sezione 8 — Golden vectors K1, K2, K3

La semantica dei tre vettori è corretta e copre tutti i casi necessari. K1 verifica il determinismo, K2 l'isolamento del salt, K3 il round-trip end-to-end completo. La struttura segue il precedente di DESIGN 005 (vettori G1-G3).

La scelta di non fissare i valori numerici in questo documento, rinviandoli al Coding Plan, è coerente con il fatto che il numero di iterazioni non è ancora fissato: calcolare vettori con iterazioni non stabilite non avrebbe senso. La sequenza logica è corretta.

### Sezione 9 — Impatto su DbUserSettings e UserSettings

Corretto. Il campo `pin_kdf_salt` segue il pattern esistente di `pin_privato_hash`. Il contratto della funzione `updatePinSalt` è dichiarato con firma, implementazione e mapping della colonna DB. L'estensione di `fieldMap` è indicata esplicitamente. Nessuna ambiguità residua per il Coding Plan.

### Sezione 10 — Sequenza operativa

La sequenza di impostazione e verifica è logicamente corretta. La precisazione che il salt incorporato nel payload deve coincidere con quello persistito su Supabase, e che una divergenza indica payload corrotto, è un invariante di validazione importante e ben documentato.

Il passo 3 della verifica ("Estrarre salt dal payload — questo salt deve coincidere con quello persistito") introduce un controllo di coerenza che non ha un meccanismo tecnico specificato. Il Coding Plan dovrà decidere se questa verifica è un'asserzione, un errore silente o un errore esplicito verso l'utente.

**Osservazione minore 3**: il documento non specifica il comportamento atteso nel caso in cui i due salt divergano (payload corrotto). Questo comportamento è un requisito funzionale, non un dettaglio implementativo. Sarebbe utile che il design dichiarasse se in quel caso l'operazione deve fallire con errore esplicito o silenziosamente.

### Sezione 11 — Compatibilità versioni future

Corretta e completa. La tabella degli scenari futuri (0x01, 0x02, 0x03) è informativa senza essere vincolante. La garanzia di non-rottura è espressa chiaramente. Il limite di 255 versioni per il singolo byte unsigned è dichiarato esplicitamente come limite accettato.

***

## Verifica di coerenza con documenti upstream

**Rispetto a DESIGN 005**: nessun conflitto. DESIGN 006 estende il formato base senza modificarlo. La dipendenza da `@noble/ciphers` per K3 è corretta. La dipendenza da `react-native-get-random-values` è riutilizzata senza conflitti.

**Rispetto ad ADR_001**: nessun conflitto. DESIGN 006 opera nel layer `src/lib/crypto.ts` e `src/lib/supabase/`, che sono separati dalla struttura `accessibility/announcements/locales` definita dall'ADR. Non ci sono import incrociati problematici, non ci sono violazioni delle regole di dipendenza definite dall'ADR.

***

## Riepilogo dei punti aperti

Qui di seguito i punti che richiedono attenzione, in ordine di priorità decrescente.

**Punto critico — iterazioni PBKDF2 assenti (sezione 4)**: il documento rinvia la calibrazione al Coding Plan senza fornire un range orientativo di riferimento. Questo lascia il Coding Plan senza un vincolo inferiore/superiore sul numero di iterazioni, con rischio di scelte inadeguate. Si raccomanda di aggiungere una nota con i valori orientativi correnti per PBKDF2-SHA256 su mobile hardware (ad esempio: OWASP 2023 raccomanda 600.000 iterazioni per PBKDF2-SHA256; il budget 100-300 ms vincola il range pratico verso il basso su Hermes). Questa informazione non fissa un valore, ma vincola il Coding Plan entro un ordine di grandezza.

**Punto minore 1 — colonna di destinazione payload PIN non nominata (sezione 6)**: indicare esplicitamente su quale colonna Supabase vengono scritti i payload cifrati con PIN. Se questa informazione è coperta da un documento upstream non letto in questa analisi, può essere risolta con un riferimento.

**Punto minore 2 — modalità di misurazione per calibrazione iterazioni (sezione 7)**: aggiungere nel Coding Plan la prescrizione di misurare su device fisico Windows, non su emulatore.

**Punto minore 3 — comportamento in caso di divergenza dei salt (sezione 10)**: specificare se la divergenza tra salt nel payload e salt su Supabase deve produrre un errore esplicito verso l'utente o un fallimento silente.

***

## Raccomandazione finale

Il documento può essere portato da DRAFT a REVIEWED dopo la risoluzione del punto critico sulle iterazioni PBKDF2. I tre punti minori possono essere risolti nel Coding Plan 006 con note operative, senza richiedere una revisione del design. La struttura generale, la catena di dipendenze, la coerenza con DESIGN 005 e la conformità ad ADR_001 sono tutte verificate e approvate.