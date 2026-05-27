---
tipo: todo-specifico
titolo: Resilienza del bootstrap — gestione timer NetInfo e Fail-Safe
versione: 0.1.0
data: 2026-05-27
stato: APERTO
sorgente: docs/3-coding-plans/011-PLAN_resilienza-bootstrap_v0.1.0.md
ramo: main
---

# TODO 011 — Resilienza del bootstrap

## Sezione 1 — Metadata

- tipo: todo-specifico
- titolo: Resilienza del bootstrap — gestione timer NetInfo e Fail-Safe
- versione: 0.1.0
- data: 2026-05-27
- stato: APERTO
- sorgente: docs/3-coding-plans/011-PLAN_resilienza-bootstrap_v0.1.0.md

## Sezione 2 — Riepilogo operativo

Il lavoro parte dal wiring dei provider e dalle costanti di timeout, poi separa
in modo esplicito i tre casi del bootstrap adattivo. In parallelo va
formalizzata la gestione della risposta tardiva di NetInfo e va mantenuta la
regola che ERROR_NETWORK ed ERROR_DATA restano interni al provider.

## Sezione 3 — Lista task operativi

1. Confermare o ristabilire NetworkStatusProvider come primo provider montato
   nell'albero dell'app.
   File o percorso coinvolto: App.tsx.
   Criterio di accettazione associato: CA-1.
   Stato iniziale: APERTO.

2. Introdurre la costante nominata del timeout bootstrap a 10 secondi senza
   usare numeri letterali.
   File o percorso coinvolto: src/context/AppDataContext.tsx.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

3. Implementare il Caso 1 offline confermato con transizione immediata a ERROR
   e senza timer bootstrap.
   File o percorso coinvolto: src/context/AppDataContext.tsx.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

4. Implementare il Caso 2 online confermato con timer a 10 secondi e timeout
   esplicito verso ERROR.
   File o percorso coinvolto: src/context/AppDataContext.tsx.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

5. Implementare il Caso 3 con attesa inizializzazione NetInfo a 3 secondi e
   successivo Fail-Safe Online-First.
   File o percorso coinvolto: src/context/NetworkStatusContext.tsx,
   src/context/AppDataContext.tsx.
   Criterio di accettazione associato: CA-1, CA-2.
   Stato iniziale: APERTO.

6. Gestire la risposta tardiva di NetInfo senza interrompere l'hydration in
   corso e senza avviarne una seconda.
   File o percorso coinvolto: src/context/NetworkStatusContext.tsx,
   src/context/AppDataContext.tsx.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

7. Mantenere ERROR_NETWORK ed ERROR_DATA confinati a provider, telemetria e log
   diagnostici.
   File o percorso coinvolto: src/context/AppDataContext.tsx,
   src/context/NetworkStatusContext.tsx,
   src/hooks/use-network-status.ts.
   Criterio di accettazione associato: CA-2, CA-3.
   Stato iniziale: APERTO.

8. Localizzare eventuali messaggi utente derivati da timeout o fallback di
   bootstrap.
   File o percorso coinvolto: src/context/AppDataContext.tsx, src/locales/it.ts.
   Criterio di accettazione associato: CA-3.
   Stato iniziale: APERTO.

## Sezione 4 — Task di test

1. Verificare che NetworkStatusProvider imposti isInitialized entro 3 secondi
   con mock NetInfo.
   File o percorso coinvolto: __tests__/use-network-status.spec.ts.
   Criterio di accettazione associato: CA-1.
   Stato iniziale: APERTO.

2. Verificare il Caso 1 offline con transizione immediata a ERROR.
   File o percorso coinvolto: __tests__/AppDataContext.spec.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

3. Verificare il Caso 2 online con timeout bootstrap a 10 secondi.
   File o percorso coinvolto: __tests__/AppDataContext.spec.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

4. Verificare il Caso 3 con fail-safe dopo 3 secondi di inizializzazione NetInfo.
   File o percorso coinvolto: __tests__/use-network-status.spec.ts,
   __tests__/AppDataContext.spec.ts.
   Criterio di accettazione associato: CA-1, CA-2.
   Stato iniziale: APERTO.

5. Verificare la risposta tardiva di NetInfo senza hydration concorrente.
   File o percorso coinvolto: __tests__/AppDataContext.spec.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

6. Verificare che ERROR_NETWORK ed ERROR_DATA non escano dal provider e che la
   UI riceva solo ERROR.
   File o percorso coinvolto: __tests__/AppDataContext.spec.ts,
   __tests__/use-network-status.spec.ts.
   Criterio di accettazione associato: CA-2, CA-3.
   Stato iniziale: APERTO.

7. Verificare che i dati non vengano mostrati senza autenticazione anche con
   rete o cache presenti.
   File o percorso coinvolto: __tests__/AppDataContext.spec.ts.
   Criterio di accettazione associato: CA-3.
   Stato iniziale: APERTO.

## Sezione 5 — Debiti tecnici

- DT-011-01: telemetria centralizzata per errori di bootstrap.
  Stato: DA PIANIFICARE.

## Sezione 6 — Note operative

- Il timeout del Caso 2 deve essere una costante nominata e non un numero
  letterale.
- I tre casi del timer adattivo sono task distinti e vanno implementati come
  tali.
- Nessuna stringa hardcoded e ammessa nei messaggi utente del bootstrap.
- ERROR_NETWORK ed ERROR_DATA non devono mai uscire dal provider verso UI o
  navigazione.
