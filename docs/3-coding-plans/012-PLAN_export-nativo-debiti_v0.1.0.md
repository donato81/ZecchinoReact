---
tipo: coding-plan
titolo: Export nativo — copertura dei debiti formati (PDF/XLSX) e guard concorrente
versione: 0.1.0
data: 2026-05-27
stato: DRAFT
sorgente: docs/2-projects/012-DESIGN_export-nativo-debiti_v0.1.0.md
perimetro: src/lib/export-service.ts, src/context/AppDataContext.tsx, __tests__/
ramo: main
---

# PLAN 012 — Export nativo — debiti e guard concorrente

## Sezione 1 — Metadata

- tipo: coding-plan
- titolo: Export nativo — copertura dei debiti formati (PDF/XLSX) e guard concorrente
- versione: 0.1.0
- data: 2026-05-27
- stato: DRAFT
- sorgente: docs/2-projects/012-DESIGN_export-nativo-debiti_v0.1.0.md
- perimetro: src/lib/export-service.ts, src/context/AppDataContext.tsx, __tests__/

## Sezione 2 — Obiettivo

Completare il contratto operativo dell'export nativo aggiungendo la guardia
sincrona contro doppie invocazioni, coprendo i tredici casi di test richiesti e
tracciando in modo esplicito i debiti tecnici per i futuri formati PDF e XLSX.
Il piano preserva l'architettura di DESIGN 009 e introduce il reason
ALREADY_IN_PROGRESS senza aprire la share sheet reale nei test.

## Sezione 3 — Precondizioni

- DESIGN 009 deve restare la base del contratto ExportResult e del delivery
  layer multi-piattaforma.
- DESIGN 004 deve restare la base per tutti i messaggi utente o screen reader
  che derivano dagli esiti dell'export.
- ExportService deve continuare a essere consumato come singleton logico
  nell'applicazione.
- Le suite Jest dell'export devono poter mockare react-native-share e le
  dipendenze native senza aprire la share sheet reale.

## Sezione 4 — Invariante stringhe hardcoded

Nessuna stringa hardcoded e consentita. Tutti i messaggi esposti a UI e screen
reader per esiti di export, errori utente e conferme devono usare src/locales/;
il servizio infrastrutturale non deve introdurre testo utente inline.

## Sezione 5 — Passi di implementazione

1. Estendere il contratto ExportResult con il nuovo reason
   ALREADY_IN_PROGRESS mantenendo coerente il tipo pubblico del servizio.
   File: src/lib/export-service.ts.
   Sezione o funzione coinvolta: tipo ExportResult e failure reasons.
   Criteri soddisfatti: CA-1, CA-2.

2. Introdurre il flag sincrono inProgress come guard dedicata nel servizio di
   export, restituendo immediatamente ALREADY_IN_PROGRESS alle invocazioni
   sovrapposte.
   File: src/lib/export-service.ts.
   Sezione o funzione coinvolta: exportFile e struttura interna del servizio.
   Criteri soddisfatti: CA-1, CA-2.

3. Implementare la struttura try/catch/finally obbligatoria del servizio con
   rilascio del flag in finally anche in caso di errori e di eccezioni non
   standard.
   File: src/lib/export-service.ts.
   Sezione o funzione coinvolta: percorso principale exportFile / doExport.
   Criteri soddisfatti: CA-4.

4. Verificare che l'app consumi sempre la stessa istanza logica del servizio di
   export e che il chiamante continui a usare il contratto aggiornato.
   File: src/lib/export-service.ts, src/context/AppDataContext.tsx.
   Sezione o funzione coinvolta: exportFile, handleExportCSV.
   Criteri soddisfatti: CA-1, CA-2.

5. Adeguare la gestione del nuovo reason nel chiamante mantenendo tutti i
   messaggi utente localizzati e demandando a AppDataContext solo gli effetti
   UX consentiti.
   File: src/context/AppDataContext.tsx, src/locales/it.ts,
   eventuali announcement export.
   Sezione o funzione coinvolta: handleExportCSV e branching su ExportResult.
   Criteri soddisfatti: CA-2, CA-3.

6. Espandere la suite Jest di ExportService per coprire integralmente i tredici
   casi richiesti dal design con mock di react-native-share e dei moduli
   nativi, senza invocare la share sheet reale.
   File: __tests__/ExportService.test.ts.
   Sezione o funzione coinvolta: mock loader e casi di test del servizio.
   Criteri soddisfatti: CA-1, CA-2, CA-3, CA-4.

7. Allineare la documentazione operativa dei futuri formati al vincolo che PDF
   e XLSX richiedono un design dedicato prima di qualsiasi implementazione.
   File: docs/todo-master.md, eventuali riferimenti documentali export.
   Sezione o funzione coinvolta: debiti tecnici collegati a DESIGN 012.
   Criteri soddisfatti: CA-1, CA-2.

## Sezione 6 — Criteri di accettazione

- CA-1: `ExportService` è singleton e `inProgress` previene doppie invocazioni documentate tramite unit test (incl. test concorrente descritto).
  Nota implementativa: la validazione deve dimostrare che le chiamate
  sovrapposte condividono lo stesso stato di guardia.

- CA-2: `ExportResult` contiene il nuovo reason `ALREADY_IN_PROGRESS` e i test associano il comportamento corretto alle chiamate sovrapposte.
  Nota implementativa: il caller deve poter distinguere il nuovo reason senza
  aprire percorsi UX extra fuori da src/locales/.

- CA-3: I test non aprono la share sheet reale; tutte le dipendenze native sono mockate in test.
  Nota implementativa: la suite deve restare completamente mock-based per iOS,
  Android e Windows.

- CA-4: Qualunque eccezione o fallimento durante
l'esecuzione dell'export, inclusi gli errori
interni al tentativo di share e gli errori
del layer di cleanup, deve sempre rilasciare
il flag interno inProgress tramite il blocco
finally, consentendo nuove esportazioni successive
senza necessità di riavvio. Questo criterio è
classificato come obbligatorio di sicurezza
dal Consiglio AI.
  Nota implementativa: il blocco finally è obbligatorio anche per errori non
  istanza di Error.

## Sezione 7 — Test da implementare

1. Successo: export completato con esito `{ success: true }`.
2. CANCELLED: cancellazione dell'utente con reason `CANCELLED`.
3. PERMISSION_DENIED: errore permessi mappato correttamente.
4. FILESYSTEM_ERROR: errore di scrittura generico mappato correttamente.
5. UNSUPPORTED_PLATFORM: piattaforma non supportata mappata correttamente.
6. INVALID_PATH: percorso non valido mappato correttamente.
7. INSUFFICIENT_SPACE: spazio insufficiente mappato correttamente.
8. UNKNOWN: errore sconosciuto mappato correttamente.
9. ALREADY_IN_PROGRESS: seconda invocazione immediata respinta con il nuovo
   reason.
10. Test concorrente: due chiamate sovrapposte condividono la stessa guardia e
    solo la prima procede.
11. Cleanup finally: il flag inProgress viene sempre rilasciato nel blocco
    finally dopo un fallimento.
12. Errore non Error: un throw di valore non istanza di Error non lascia il
    flag bloccato e produce comunque un esito gestito.
13. Reset flag: verifica del ciclo completo export A termina, flag rilasciato,
    export C parte normalmente senza ALREADY_IN_PROGRESS.
    Nota obbligatoria: questo test deve verificare esplicitamente il ciclo
    completo definito da DESIGN 012 e non puo essere sostituito da una verifica
    parziale del solo reset del flag.

## Sezione 8 — Debiti tecnici da tracciare

- DT-012-01: DESIGN dedicato per PDF (bassa priorità).
- DT-012-02: DESIGN dedicato per XLSX (bassa priorità).

## Sezione 9 — Dipendenze

- DESIGN 009 — Export File Nativo.
- DESIGN 004 — Announcements/localizzazione.
- react-native-share e dipendenze native gia usate dal servizio export.
