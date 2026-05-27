---
tipo: design
titolo: Resilienza del bootstrap — gestione timer NetInfo e Fail-Safe
versione: 0.1.0
data: 2026-05-27
stato: DRAFT
sorgente: docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md, docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md
perimetro: src/context/NetworkStatusProvider.tsx, src/context/AppDataContext.tsx
---

# DESIGN 011 — Resilienza bootstrap

## Sezione 1 — Metadata

- **Design ID:** 011
- **Titolo:** Resilienza del bootstrap — timer NetInfo e fail-safe
- **Versione:** v0.1.0
- **Data:** 2026-05-27
- **Stato:** DRAFT
- **Fonte primaria:** DESIGN 007, DESIGN 008
- **Perimetro:** logica di bootstrap AppDataProvider e NetworkStatusProvider

## Sezione 2 — Contesto e motivazione

Il bootstrap dell'app (hydration/cached vs remote) è sensibile ai tempi di inizializzazione del produttore di segnale rete (NetInfo). Questo design specifica un sistema di timer adattivo che decide il percorso di bootstrap in tre casi: rete assente, rete presente, NetInfo in inizializzazione.

Motivazione: evitare deadlock o hydration concorrenti e fornire comportamento deterministico e ripetibile all'avvio.

## Sezione 3 — Perimetro

In scope:
- Definizione dei tre casi di timer adattivo e loro azioni.
- Posizionamento di `NetworkStatusProvider` come primo provider nell'albero (Decisione 9).
- Distinzione interna ERROR_NETWORK vs ERROR_DATA per telemetria.
- Validazione dei criteri di accettazione (isInitialized, attesa segnale rete, autenticazione).

Fuori scope:
- Implementazione dettagliata della UI per errori (tale logica rimane nel layer AppDataContext e usa `src/locales/`).

## Sezione 4 — Architettura e decisioni

Decisioni incorporate:

- Decisione 7: sistema di timer adattivo con tre casi.

  - Caso 1 — rete assente confermata da NetInfo: timer non parte, transizione immediata verso `ERROR` con tempo zero secondi.

  - Caso 2 — rete presente confermata da NetInfo: timer parte; se entro 10 secondi il caricamento non si conclude, transizione verso `ERROR`. Valore fisso: 10 secondi.

  - Caso 3 — NetInfo ancora in inizializzazione: timer parte con valore di 3 secondi. Allo scadere si applica il Fail-Safe Online-First già definito in DESIGN 008 e si procede come Caso 2.

- Decisione 7-bis: se NetInfo risponde dopo i 3 secondi mentre la hydration è già partita, non si interrompe la hydration in corso e non se ne avvia una seconda. Se NetInfo dice rete assente in quel momento, si gestisce tramite il timeout normale dei 10 secondi. Se dice rete presente, nessuna azione.

- Decisione 7-ter: il sistema distingue internamente `ERROR_NETWORK` da `ERROR_DATA`. Questa distinzione è usata per telemetria e debugging ma non cambia lo stato pubblico `ERROR` esposto alla UI.

- Decisione 8: timer di inizializzazione NetInfo è 3 secondi.

- Decisione 9: `NetworkStatusProvider` si posiziona come primo elemento nell'albero dell'app sopra tutto il resto.

Comportamento operativo sintetico:

1. All'avvio, `NetworkStatusProvider` comincia la subscription NetInfo; `isInitialized` resta `false` fino alla prima risposta.

2. `AppDataProvider` attende `isInitialized` o il timeout 3s: se `isInitialized` non arriva entro 3s, si applica Fail-Safe Online-First (vedi DESIGN 008) e si avvia la hydration come nel Caso 3.

3. Se NetInfo indica offline immediatamente, `AppDataProvider` va in `ERROR` senza attendere timer.

4. Se la hydration non termina entro 10s con NetInfo segnando online, `AppDataProvider` transita in `ERROR`.

Edge cases e garanzie:

- Non ci sono hydration concorrenti: una volta avviata una hydration, ulteriori segnali non causano avvii paralleli.
- Tutti i messaggi utente derivati dagli esiti di timer/passaggi d'errore passano via `src/locales/`.

## Sezione 5 — Invariante: Nessuna stringa hardcoded

Tutte le notifiche, messaggi di errore e annunci per screen reader generati nel percorso di bootstrap devono usare `src/locales/` (DESIGN 004) e non contenere stringhe hardcoded. Questo include i messaggi di timeout, gli avvisi di rete e i testi di fallback.

## Sezione 6 — Dipendenze da altri design

- DESIGN 007 — Async cache hydration (consumatore)
- DESIGN 008 — Network connectivity (produttore)
- DESIGN 004 — Announcements/localizzazione

## Sezione 7 — Debiti tecnici aperti

- DT-011-01: telemetria centralizzata per errori di bootstrap (DT-008-02 nel backlog). Priorità: bassa.

## Sezione 8 — Criteri di accettazione

- CA-1: `NetworkStatusProvider.isInitialized` è impostato a `true` entro 3 secondi in ambiente di test simulato (mock NetInfo). (Criterion 1 richiesto)
- CA-2: `AppDataProvider` attende il primo segnale di rete prima di avviare il caricamento (o applica il fail-safe dopo 3s). (Criterion 2 richiesto)
- CA-3: I dati vengono mostrati solo se l'utente è autenticato. Se non autenticato, l'app attende il login indipendentemente da cache/ rete. (Criterion 3 richiesto)
