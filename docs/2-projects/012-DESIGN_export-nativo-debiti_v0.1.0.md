---
tipo: design
titolo: Export nativo — copertura dei debiti formati (PDF/XLSX) e guard concorrente
versione: 0.1.0
data: 2026-05-27
stato: REVIEWED
sorgente: docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md
perimetro: src/lib/export-service.ts, src/context/AppDataContext.tsx, __tests__/
---

# DESIGN 012 — Export nativo — test coverage e guard contro doppie invocazioni

## Sezione 1 — Metadata

- **Design ID:** 012
- **Titolo:** Export nativo — debiti e guard concorrente
- **Versione:** v0.1.0
- **Data:** 2026-05-27
- **Stato:** REVIEWED
- **Fonte primaria:** DESIGN 009 (Export File Nativo)
- **Perimetro:** `ExportService`, test unitari, contratto `ExportResult` e gestione `ALREADY_IN_PROGRESS`

## Sezione 2 — Contesto e motivazione

DESIGN 009 ha definito il delivery layer multi-piattaforma. Questo design dettaglia aspetti operativi aggiuntivi richiesti dai test e la guardia contro doppie invocazioni del servizio di export, oltre a tracciare il debito tecnico relativo all'introduzione di nuovi formati (PDF, XLSX).

## Sezione 3 — Perimetro

In scope:
- Introduzione del flag interno sincrono `inProgress` in `ExportService` per prevenire doppie invocazioni.
- Estensione del tipo `ExportResult` con `ALREADY_IN_PROGRESS` come valore possibile.
- Test unitari (mock di `react-native-share`) per i tredici casi elencati.
- Garanzia che `ExportService` sia singleton nell'app.

Fuori scope:
- Implementazione reale di generazione PDF/XLSX (richiede DESIGN dedicato).

## Sezione 4 — Architettura e decisioni

Decisioni incorporate:

- Decisione 10: guard contro doppie invocazioni come flag interno sincrono. In Hermes il loop JS è single-thread, quindi il flag sincrono è sufficiente.

  - Quando export è già in corso, qualsiasi invocazione successiva riceve immediatamente `{ success: false, reason: 'ALREADY_IN_PROGRESS' }`.

  - Il flag deve essere rilasciato tramite `finally` sempre, anche in caso di errori.

  - `ExportService` deve essere dichiarato e usato come singleton in tutta l'app.

- Decisione 11: i test di `ExportService` devono coprire tredici casi via mock di `react-native-share` e non invocare la share sheet reale. I casi elencati (successo, CANCELLED, PERMISSION_DENIED, FILESYSTEM_ERROR, UNSUPPORTED_PLATFORM, INVALID_PATH, INSUFFICIENT_SPACE, UNKNOWN, ALREADY_IN_PROGRESS, test concorrente, cleanup finally, errore non Error, reset flag) sono obbligatori.

Nota obbligatoria sul Test 13:
Il Test 13 deve verificare esplicitamente il
seguente ciclo completo: export A parte ed esegue
fino al termine con successo; il flag inProgress
viene rilasciato correttamente tramite il blocco
finally; export C parte normalmente dopo
la conclusione di A senza ricevere
ALREADY_IN_PROGRESS.
Questa verifica del reset definitivo del flag
è obbligatoria e non può essere sostituita
da una verifica parziale.

- Decisione 12: aggiunta esplicita in Sezione 8 di DESIGN 009: ogni nuovo formato richiede DESIGN dedicato prima dell'implementazione. Debito: creare DESIGN per PDF/XLSX.

Implementazione proposta del flag sincrono:

```ts
class ExportService {
  private inProgress = false;

  async export(content: string, name: string, mime: string): Promise<ExportResult> {
    if (this.inProgress) return { success: false, reason: 'ALREADY_IN_PROGRESS' };
    this.inProgress = true;
    try {
      // strategia platform-specific
      return await this.doExport(...);
    } catch (e) {
      return { success: false, reason: 'UNKNOWN' };
    } finally {
      this.inProgress = false;
    }
  }
}
```

## Sezione 5 — Invariante: Nessuna stringa hardcoded

Tutti i messaggi esposti a UI e screen reader (esiti di export, errori utente, conferme) devono usare `src/locales/` (DESIGN 004). `AppDataContext` legge la chiave di messaggio locale da `locales` e annuncia a TalkBack; nessuna stringa hardcoded nel codice del servizio.

## Sezione 6 — Dipendenze da altri design

- DESIGN 009 — Export File Nativo (contratto base)
- DESIGN 004 — Announcements/localizzazione

## Sezione 7 — Debiti tecnici aperti

- DT-012-01: DESIGN dedicato per PDF (bassa priorità)
- DT-012-02: DESIGN dedicato per XLSX (bassa priorità)

## Sezione 8 — Criteri di accettazione

- CA-1: `ExportService` è singleton e `inProgress` previene doppie invocazioni documentate tramite unit test (incl. test concorrente descritto).
- CA-2: `ExportResult` contiene il nuovo reason `ALREADY_IN_PROGRESS` e i test associano il comportamento corretto alle chiamate sovrapposte.
- CA-3: I test non aprono la share sheet reale; tutte le dipendenze native sono mockate in test.
 - CA-4: Qualunque eccezione o fallimento durante
l'esecuzione dell'export, inclusi gli errori
interni al tentativo di share e gli errori
del layer di cleanup, deve sempre rilasciare
il flag interno inProgress tramite il blocco
finally, consentendo nuove esportazioni successive
senza necessità di riavvio. Questo criterio è
classificato come obbligatorio di sicurezza
dal Consiglio AI.
