---
tipo: todo-specifico
titolo: Export nativo — copertura dei debiti formati (PDF/XLSX) e guard concorrente
versione: 0.1.0
data: 2026-05-27
stato: APERTO
sorgente: docs/3-coding-plans/012-PLAN_export-nativo-debiti_v0.1.0.md
ramo: main
---

# TODO 012 — Export nativo — debiti e guard concorrente

## Sezione 1 — Metadata

- tipo: todo-specifico
- titolo: Export nativo — copertura dei debiti formati (PDF/XLSX) e guard concorrente
- versione: 0.1.0
- data: 2026-05-27
- stato: APERTO
- sorgente: docs/3-coding-plans/012-PLAN_export-nativo-debiti_v0.1.0.md

## Sezione 2 — Riepilogo operativo

Prima va aggiornato il contratto di ExportService con la guardia sincrona e il
nuovo reason ALREADY_IN_PROGRESS, poi va allineato il chiamante ai nuovi esiti
localizzati. La seconda priorita e la suite test completa dei tredici casi, che
deve restare interamente mock-based.

## Sezione 3 — Lista task operativi

1. Estendere ExportResult con il nuovo reason ALREADY_IN_PROGRESS.
   File o percorso coinvolto: src/lib/export-service.ts.
   Criterio di accettazione associato: CA-1, CA-2.
   Stato iniziale: APERTO.

2. Introdurre il flag sincrono inProgress per prevenire doppie invocazioni.
   File o percorso coinvolto: src/lib/export-service.ts.
   Criterio di accettazione associato: CA-1, CA-2.
   Stato iniziale: APERTO.

3. Implementare la struttura try/catch/finally obbligatoria con rilascio del
   flag in finally.
   File o percorso coinvolto: src/lib/export-service.ts.
   Criterio di accettazione associato: CA-4.
   Stato iniziale: APERTO.

4. Verificare il consumo singleton del servizio nel chiamante e aggiornare il
   branching del nuovo reason.
   File o percorso coinvolto: src/lib/export-service.ts,
   src/context/AppDataContext.tsx.
   Criterio di accettazione associato: CA-1, CA-2.
   Stato iniziale: APERTO.

5. Localizzare l'esito ALREADY_IN_PROGRESS e gli eventuali messaggi associati.
   File o percorso coinvolto: src/context/AppDataContext.tsx, src/locales/it.ts,
   eventuali announcement export.
   Criterio di accettazione associato: CA-2, CA-3.
   Stato iniziale: APERTO.

6. Aggiornare la documentazione dei debiti tecnici per PDF e XLSX come formati
   subordinati a design dedicato.
   File o percorso coinvolto: docs/todo-master.md e riferimenti export.
   Criterio di accettazione associato: CA-1.
   Stato iniziale: APERTO.

## Sezione 4 — Task di test

1. Test successo.
   File o percorso coinvolto: __tests__/ExportService.test.ts.
   Criterio di accettazione associato: CA-1.
   Stato iniziale: APERTO.

2. Test CANCELLED.
   File o percorso coinvolto: __tests__/ExportService.test.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

3. Test PERMISSION_DENIED.
   File o percorso coinvolto: __tests__/ExportService.test.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

4. Test FILESYSTEM_ERROR.
   File o percorso coinvolto: __tests__/ExportService.test.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

5. Test UNSUPPORTED_PLATFORM.
   File o percorso coinvolto: __tests__/ExportService.test.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

6. Test INVALID_PATH.
   File o percorso coinvolto: __tests__/ExportService.test.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

7. Test INSUFFICIENT_SPACE.
   File o percorso coinvolto: __tests__/ExportService.test.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

8. Test UNKNOWN.
   File o percorso coinvolto: __tests__/ExportService.test.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

9. Test ALREADY_IN_PROGRESS.
   File o percorso coinvolto: __tests__/ExportService.test.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

10. Test concorrente su chiamate sovrapposte.
    File o percorso coinvolto: __tests__/ExportService.test.ts.
    Criterio di accettazione associato: CA-1, CA-2.
    Stato iniziale: APERTO.

11. Test cleanup finally.
    File o percorso coinvolto: __tests__/ExportService.test.ts.
    Criterio di accettazione associato: CA-4.
    Stato iniziale: APERTO.

12. Test errore non Error.
    File o percorso coinvolto: __tests__/ExportService.test.ts.
    Criterio di accettazione associato: CA-4.
    Stato iniziale: APERTO.

13. Test reset flag completo: export A termina, flag rilasciato, export C parte
    normalmente senza ALREADY_IN_PROGRESS.
    File o percorso coinvolto: __tests__/ExportService.test.ts.
    Criterio di accettazione associato: CA-4.
    Stato iniziale: APERTO.

## Sezione 5 — Debiti tecnici

- DT-012-01: DESIGN dedicato per PDF.
  Stato: DA PIANIFICARE.
- DT-012-02: DESIGN dedicato per XLSX.
  Stato: DA PIANIFICARE.

## Sezione 6 — Note operative

- Il blocco finally e obbligatorio e non puo essere omesso nel servizio export.
- I tredici test vanno mantenuti nell'ordine definito dal design.
- Il Test 13 deve verificare il ciclo completo A termina, flag rilasciato,
  C parte normalmente senza ALREADY_IN_PROGRESS.
- Nessuna stringa hardcoded e ammessa nei messaggi utente dell'export.
