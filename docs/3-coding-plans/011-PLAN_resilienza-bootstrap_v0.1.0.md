---
tipo: coding-plan
titolo: Resilienza del bootstrap — gestione timer NetInfo e Fail-Safe
versione: 0.1.0
data: 2026-05-27
stato: DRAFT
sorgente: docs/2-projects/011-DESIGN_resilienza-bootstrap_v0.1.0.md
perimetro: src/context/NetworkStatusProvider.tsx, src/context/AppDataContext.tsx
ramo: main
---

# PLAN 011 — Resilienza del bootstrap

## Sezione 1 — Metadata

- tipo: coding-plan
- titolo: Resilienza del bootstrap — gestione timer NetInfo e Fail-Safe
- versione: 0.1.0
- data: 2026-05-27
- stato: DRAFT
- sorgente: docs/2-projects/011-DESIGN_resilienza-bootstrap_v0.1.0.md
- perimetro: src/context/NetworkStatusProvider.tsx, src/context/AppDataContext.tsx

## Sezione 2 — Obiettivo

Rendere deterministico il bootstrap dati dell'app quando il segnale rete di
NetInfo non e ancora disponibile, distinguendo i tre casi architetturali
offline, online e inizializzazione in corso. Il piano deve evitare deadlock,
hydration concorrenti e deviazioni dello stato pubblico ERROR rispetto alla
telemetria interna.

## Sezione 3 — Precondizioni

- DESIGN 007 deve essere disponibile per la logica di async cache hydration
  consumata da AppDataContext.
- DESIGN 008 deve essere disponibile per il contratto di NetworkStatusProvider
  e per il Fail-Safe Online-First.
- DESIGN 004 deve restare il vincolo per tutti i messaggi utente di timeout,
  errore o fallback.
- App.tsx deve poter montare NetworkStatusProvider come primo provider sopra il
  resto dell'albero applicativo.
- AppDataContext deve gia consumare useNetworkStatus e il proprio generation
  guard per impedire hydration parallele.

## Sezione 4 — Invariante stringhe hardcoded

Nessuna stringa hardcoded e consentita. Tutte le notifiche, i messaggi di
errore bootstrap e gli annunci accessibili generati dal percorso NetInfo /
AppDataContext devono passare da src/locales/ come richiesto da DESIGN 004.

## Sezione 5 — Passi di implementazione

1. Verificare e mantenere NetworkStatusProvider come primo provider
   dell'albero applicativo.
   File: App.tsx.
   Sezione o funzione coinvolta: composizione root dell'app.
   Criteri soddisfatti: CA-1, CA-2.

2. Introdurre in AppDataContext una costante nominata per il timeout del Caso 2
   pari a 10 secondi, evitando numeri letterali e documentando il vincolo
   architetturale approvato il 27 maggio 2026.
   File: src/context/AppDataContext.tsx.
   Sezione o funzione coinvolta: costanti bootstrap e timer del caricamento.
   Criteri soddisfatti: CA-2.

3. Implementare il Caso 1 come ramo separato: rete assente confermata da
   NetInfo, nessun timer bootstrap, transizione immediata a ERROR.
   File: src/context/AppDataContext.tsx.
   Sezione o funzione coinvolta: useEffect di bootstrap, transitionTo.
   Criteri soddisfatti: CA-2.

4. Implementare il Caso 2 come ramo separato: rete presente confermata da
   NetInfo, avvio del timer a 10 secondi e transizione a ERROR se il
   caricamento non termina entro il limite.
   File: src/context/AppDataContext.tsx.
   Sezione o funzione coinvolta: useEffect di bootstrap, loadBootstrapData,
   refreshAll se condivide il contratto di timeout.
   Criteri soddisfatti: CA-2, CA-3.

5. Implementare il Caso 3 come ramo separato: NetInfo ancora in
   inizializzazione, timer a 3 secondi e applicazione del Fail-Safe
   Online-First prima di procedere con il comportamento del Caso 2.
   File: src/context/NetworkStatusContext.tsx,
   src/context/AppDataContext.tsx.
   Sezione o funzione coinvolta: INIT timeout provider, guard
   isNetworkInitialized nel bootstrap.
   Criteri soddisfatti: CA-1, CA-2.

6. Tradurre la Decisione 7-bis in un passo dedicato: gestire la risposta tardiva
   di NetInfo senza interrompere la hydration in corso e senza avviarne una
   seconda.
   File: src/context/AppDataContext.tsx,
   src/context/NetworkStatusContext.tsx.
   Sezione o funzione coinvolta: generation guard, gestione dei timer e dei
   callback NetInfo tardivi.
   Criteri soddisfatti: CA-2.

7. Mantenere ERROR_NETWORK ed ERROR_DATA confinati all'interno del provider e
   dei log diagnostici, senza esporli a UI, navigazione o contratti pubblici.
   File: src/context/AppDataContext.tsx,
   src/context/NetworkStatusContext.tsx,
   src/hooks/use-network-status.ts.
   Sezione o funzione coinvolta: tipi interni, diagnostica, valore esposto dal
   provider/hook.
   Criteri soddisfatti: CA-2, CA-3.

8. Riallineare eventuali messaggi utente di timeout, offline e fallback al
   sistema di localizzazione del progetto.
   File: src/context/AppDataContext.tsx, src/locales/it.ts,
   eventuali generatori announcement interessati.
   Sezione o funzione coinvolta: rami di errore e fallback del bootstrap.
   Criteri soddisfatti: CA-2, CA-3.

## Sezione 6 — Criteri di accettazione

- CA-1: `NetworkStatusProvider.isInitialized` è impostato a `true` entro 3 secondi in ambiente di test simulato (mock NetInfo). (Criterion 1 richiesto)
  Nota implementativa: la verifica copre sia l'evento reale NetInfo sia il
  fail-safe al timeout di inizializzazione.

- CA-2: `AppDataProvider` attende il primo segnale di rete prima di avviare il caricamento (o applica il fail-safe dopo 3s). (Criterion 2 richiesto)
  Nota implementativa: il criterio comprende i tre casi separati, la gestione
  della risposta tardiva di NetInfo e il vincolo di non avviare hydration
  concorrenti.

- CA-3: I dati vengono mostrati solo se l'utente è autenticato. Se non autenticato, l'app attende il login indipendentemente da cache/ rete. (Criterion 3 richiesto)
  Nota implementativa: il timeout di bootstrap non puo bypassare la guardia di
  autenticazione del provider dati.

## Sezione 7 — Test da implementare

1. Test del provider rete con mock NetInfo che conferma isInitialized entro 3
   secondi.
2. Test del Caso 1: offline confermato, nessun timer bootstrap e transizione
   immediata a ERROR.
3. Test del Caso 2: online confermato, timer a 10 secondi e passaggio a ERROR
   se il caricamento non termina.
4. Test del Caso 3: NetInfo non inizializzato, timeout a 3 secondi e attivazione
   del Fail-Safe Online-First prima dell'hydration.
5. Test della Decisione 7-bis: risposta tardiva di NetInfo dopo l'avvio della
   hydration senza seconda hydration e senza interruzione della prima.
6. Test che ERROR_NETWORK ed ERROR_DATA restino interni e che il contratto
   pubblico esposto alla UI continui a mostrare solo ERROR.
7. Test di autenticazione: i dati non vengono mostrati senza login anche se la
   rete e disponibile o la cache e presente.
8. Test dei messaggi bootstrap per confermare l'uso esclusivo di chiavi
   src/locales/ nei rami di timeout, offline e fallback.

## Sezione 8 — Debiti tecnici da tracciare

- DT-011-01: telemetria centralizzata per errori di bootstrap (DT-008-02 nel backlog). Priorità: bassa.

## Sezione 9 — Dipendenze

- DESIGN 007 — Async cache hydration.
- DESIGN 008 — Network connectivity.
- DESIGN 004 — Announcements/localizzazione.
