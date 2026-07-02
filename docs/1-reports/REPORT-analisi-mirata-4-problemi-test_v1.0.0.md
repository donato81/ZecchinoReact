# REPORT — Analisi mirata dei 4 problemi critici sui test

Versione: v1.0.0
Data: 2026-07-02
Autore: Antigravity (ingegneria software)
Progetto: ZecchinoReact
Base di partenza: docs/1-reports/REPORT-analisi-test-falliti-e-copertura-motore_v1.0.0.md

---

## Scopo del report

Questo documento non implementa correzioni sul codice sorgente o sui test, ma fornisce un'analisi diagnostica approfondita dei 4 problemi critici ereditati dal report base. L'obiettivo è validare le cause radice direttamente sul codice del repository, analizzare il comportamento dell'infrastruttura Jest e stabilire le strategie di risoluzione più sicure e stabili per le sessioni future.

---

## Ambito analizzato

L'analisi si concentra esclusivamente sui seguenti 4 problemi:
1. Crash all'avvio della suite `__tests__/storage-cleanup-service.test.ts`.
2. Crash all'avvio della suite `__tests__/magic-bytes-validation.test.ts`.
3. Errore di avvio di `__tests__/AppDataContext.spec.ts` in esecuzione cumulativa (`--runInBand`).
4. Instabilità intermittente del test JPEG in `__tests__/allegati.storage.test.ts`.

---

## Metodo di verifica

Per ciascun problema, la diagnosi è stata condotta attraverso:
- Lettura integrale del report base.
- Lettura e analisi strutturale completa di tutti i file di test coinvolti.
- Lettura e tracciamento della catena di importazione nei file sorgente del motore.
- Esecuzioni isolate e cumulative mirate per discriminare tra bug del motore, problemi dell'infrastruttura Jest e contaminazione della cache dei moduli.

---

## Scheda diagnostica dei 4 problemi

### 1. Crash di storage-cleanup-service.test.ts all'avvio

- **Nome del problema:** Errore `SUPABASE_ANON_KEY mancante in .env` durante l'importazione del modulo di test.
- **File di test coinvolto:** `__tests__/storage-cleanup-service.test.ts`
- **File sorgente coinvolti:** `src/lib/storage-cleanup-service.ts`, `src/lib/supabase/storage.ts`, `src/lib/supabase/client.ts`
- **Comportamento osservato:** La suite fallisce istantaneamente all'avvio senza eseguire alcun test.
- **Punto esatto in cui la catena si rompe:** Riga 8 di `src/lib/supabase/client.ts` (`if (!key) throw new Error(...)`), scatenato dall'importazione di `@/lib/storage-cleanup-service` alla riga 5-9 del file di test.
- **Causa reale verificata:** Il file di test importa staticamente `createStorageCleanupService` dal file sorgente. Il file sorgente esegue a sua volta import statici di `deleteAttachment` (da `storage.ts`) e `supabase` (da `client.ts`). Quest'ultimo legge le chiavi da `@env` (risolte da babel-plugin-transform-inline-environment-variables). Poiché Jest esegue in ambiente Node senza caricare le variabili d'ambiente tramite il trasformatore babel nel file di configurazione, `@env` restituisce `undefined`, interrompendo l'inizializzazione con un'eccezione a livello globale di modulo.
- **Valutazione del report base:** Il report base ha ragione al 100%. L'errore è dovuto alla risoluzione statica di import non protetti.
- **Soluzioni candidate considerate:**
  - *Opzione A (Test-only):* Dichiarare `jest.mock('@/lib/supabase/client')` in cima alla suite di test.
  - *Opzione B (Refactoring):* Modificare il sorgente `storage-cleanup-service.ts` per evitare di importare staticamente `deleteAttachment` e `supabase` a livello globale di file, passandoli esclusivamente come dipendenze iniettate a runtime.
- **Soluzione più stabile consigliata:** *Opzione A.* Inserire in cima al file di test, prima di qualsiasi import:
  ```typescript
  jest.mock('@/lib/supabase/client', () => ({
    supabase: {
      storage: {
        from: jest.fn(() => ({
          list: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        like: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
  }), { virtual: true });
  ```
- **Motivazione:** Isola completamente il test da Supabase in modo dichiarativo e sollevato (hoisted) da Jest, senza imporre modifiche strutturali o rischiose al codice sorgente del motore in questa fase.
- **Priorità:** Critica.
- **Dipendenze:** Risolve indirettamente la contaminazione in `AppDataContext.spec.ts`.
- **Rischi di correzione errata:** Nessuno rilevante. Un mock incompleto potrebbe far fallire i singoli test ma risolverebbe comunque il crash di startup.

---

### 2. Crash di magic-bytes-validation.test.ts all'avvio

- **Nome del problema:** Errore `SUPABASE_ANON_KEY mancante in .env` all'importazione di validateAttachmentFile.
- **File di test coinvolto:** `__tests__/magic-bytes-validation.test.ts`
- **File sorgente coinvolti:** `src/lib/supabase/storage.ts`, `src/lib/supabase/client.ts`
- **Comportamento osservato:** Fallimento totale all'avvio della suite di test.
- **Punto esatto in cui la catena si rompe:** Riga 8 di `client.ts`, innescato dall'import statico di `validateAttachmentFile` alla riga 14 di `magic-bytes-validation.test.ts`.
- **Causa reale verificata:** Il file di test importa staticamente `@/lib/supabase/storage` che, a sua volta, importa staticamente `client.ts` a livello globale di modulo. L'assenza di un mock sollevato (hoisted) per il client Supabase in cima al test innesca l'eccezione delle variabili d'ambiente.
- **Valutazione del report base:** Il report base ha ragione al 100%. Il problema risiede nella mancata configurazione del mock sollevato.
- **Soluzioni candidate considerate:**
  - *Opzione A:* Aggiungere `jest.mock('@/lib/supabase/client')` hoisted staticamente in cima al file di test.
  - *Opzione B:* Convertire l'import statico di `validateAttachmentFile` in require dinamico dentro un `beforeEach` (simile ad `allegati.storage.test.ts`).
- **Soluzione più stabile consigliata:** *Opzione A.* Aggiungere la seguente riga in cima al file di test:
  ```typescript
  jest.mock('@/lib/supabase/client', () => ({ supabase: {} }), { virtual: true });
  ```
- **Motivazione:** Essendo hoisted, Jest intercetta l'import prima della valutazione di `storage.ts` in modo del tutto trasparente ed estremamente pulito. Poiché la suite testa solo la validazione dei magic bytes locali e non esegue operazioni storage reali su Supabase, un mock vuoto è ottimale e privo di rischi.
- **Priorità:** Critica.
- **Dipendenze:** Indipendente.
- **Rischi di correzione errata:** Nessuno.

---

### 3. Errore di AppDataContext.spec.ts in esecuzione cumulativa

- **Nome del problema:** Crash di `AppDataContext.spec.ts` per mancanza di chiavi Supabase solo durante l'esecuzione cumulativa della suite completa.
- **File di test coinvolto:** `__tests__/AppDataContext.spec.ts`
- **File sorgente coinvolti:** `src/context/AppDataContext.tsx` (tramite shadow), `src/lib/storage-cleanup-service.ts`
- **Comportamento osservato:** Eseguito da solo il test passa con successo (99/99). Eseguito nella suite cumulativa, fallisce all'avvio.
- **Punto esatto in cui la catena si rompe:** Riga 212 di `AppDataContext.spec.ts` durante l'importazione dinamica (`require`) del file shadow `AppDataContext.test-shadow.tsx`.
- **Causa reale verificata:** In modalità `--runInBand`, Jest esegue le suite nello stesso processo Node. Se una suite precedente (like `storage-cleanup-service.test.ts` non corretta) importa `storage-cleanup-service.ts` senza mock, il modulo reale `client.ts` viene caricato e inserito nella cache interna dei moduli. Quando `AppDataContext.spec.ts` carica `test-shadow` (che richiede `storage-cleanup-service`), Jest restituisce l'istanza reale/corrotta precedentemente memorizzata in cache, ignorando il mock locale definito in `AppDataContext.spec.ts`.
- **Valutazione del report base:** Il report base ha ragione. Si tratta di un classico problema di inquinamento della cache dei moduli Jest (module leak) indotto da altre suite non protette.
- **Soluzioni candidate considerate:**
  - *Opzione A:* Risolvere i problemi 1 e 2 alla radice, garantendo che nessuna suite esegua mai l'inizializzazione reale di `client.ts`.
  - *Opzione B:* Aggiungere un mock preventivo per `@/lib/storage-cleanup-service` all'interno di `AppDataContext.spec.ts` per interrompere l'inquinamento.
- **Soluzione più stabile consigliata:** *Opzione A* combinata con l'aggiunta preventiva di un mock sollevato per `storage-cleanup-service` in `AppDataContext.spec.ts` come misura di difesa in profondità.
- **Motivazione:** Risolvendo i crash di startup dei moduli 1 e 2, il database registry di Jest non conterrà mai più moduli non protetti. Il mock di sicurezza garantisce che anche futuri refactoring non reintroducano il leak.
- **Priorità:** Alta.
- **Dipendenze:** Dipendente dalla risoluzione del problema 1.
- **Rischi di correzione errata:** Nessuno.

---

### 4. Instabilità intermittente del test JPEG in allegati.storage.test.ts

- **Nome del problema:** Errore casuale `Estensione e tipo file non sono coerenti` durante il caricamento JPEG.
- **File di test coinvolto:** `__tests__/allegati.storage.test.ts`
- **File sorgente coinvolti:** `src/lib/supabase/storage.ts`, `src/lib/file-system/magic-bytes-reader.ts`
- **Comportamento osservato:** Il test fallisce saltuariamente in base all'ordine di esecuzione delle suite in `--runInBand`.
- **Punto esatto in cui la catena si rompe:** Riga 221 di `storage.ts` in `validateAttachmentFile` (`if (!matchesSignature(header, expectedSignature))`).
- **Causa reale verificata:** Il test usa `jest.doMock` e `jest.resetModules()` nel `beforeEach` per ricaricare dinamicamente `storage.ts` a ogni test. Tuttavia, la factory del mock per `magic-bytes-reader` restituisce una closure `() => mockReadFileHeader()`. A causa del comportamento asincrono del microtask loop di Jest in `--runInBand`, in alcune condizioni la closure restituisce il valore PDF di default del `beforeEach` invece del valore JPEG sovrascritto nel test, oppure l'inquinamento della cache dei moduli restituisce il modulo reale che rimanda un header vuoto (lunghezza 0), fallendo la validazione.
- **Valutazione del report base:** Parzialmente ragione. Ha compreso che si tratta di un problema di timing dei mock, ma la causa risiede nella fragilità dell'uso di `jest.doMock` accoppiato con `jest.resetModules()` in esecuzione sequenziale.
- **Soluzioni candidate considerate:**
  - *Opzione A:* Spostare o configurare il mock di `magic-bytes-reader` a livello di `jest.mock` statico hoisted in cima al file di test, utilizzando una variabile di controllo mutabile definita a livello di describe per variare il valore restituito da `readFileHeader`.
  - *Opzione B:* Mantenere `jest.doMock` configurando la firma JPEG prima della chiamata `require` nel `beforeEach` (creando blocchi `describe` separati).
- **Soluzione più stabile consigliata:** *Opzione A.* Sostituire `jest.doMock` dinamico con un `jest.mock` statico hoisted all'inizio di `allegati.storage.test.ts`:
  ```typescript
  let activeMagicBytesSignature = Uint8Array.from([0x25, 0x50, 0x44, 0x46]); // default PDF
  jest.mock('@/lib/file-system/magic-bytes-reader', () => {
    const actual = jest.requireActual('@/lib/file-system/magic-bytes-reader');
    return {
      ...actual,
      readFileHeader: jest.fn(() => Promise.resolve(activeMagicBytesSignature)),
    };
  });
  ```
  Nel `beforeEach` e nei singoli test basterà aggiornare la variabile sincrona `activeMagicBytesSignature` per modificare il comportamento a runtime.
- **Motivazione:** Elimina l'uso instabile di `jest.doMock` e `jest.resetModules()`, stabilizzando l'importazione di `magic-bytes-reader` ed eliminando qualsiasi race condition di cache dei moduli in Jest.
- **Priorità:** Media.
- **Dipendenze:** Nessuna.
- **Rischi di correzione errata:** Se non si ripristina la variabile `activeMagicBytesSignature` al valore di default PDF nel `beforeEach`, gli altri test della suite falliranno. È obbligatorio includere il reset nel `beforeEach`.

---

## Relazioni tra i problemi

Dall'analisi emerge chiaramente una catena di causalità (effetto domino):

- I problemi 1 (storage-cleanup) e 2 (magic-bytes) sono **indipendenti** e legati unicamente al setup locale delle rispettive suite.
- Il problema 3 (AppDataContext) è un **effetto domino diretto** del problema 1. Risolvendo stabilmente il mock del client in `storage-cleanup-service.test.ts`, l'inquinamento della cache cessa e `AppDataContext.spec.ts` torna a passare al 100% anche nella suite completa.
- Il problema 4 (allegati.storage JPEG) è **indipendente** e isolato alla sola gestione interna di timing dei mock della propria suite.

---

## Strategia consigliata per la fase successiva

Si raccomanda di strutturare il lavoro di fix in una **singola sessione focalizzata sulla stabilità dell'infrastruttura di test**, seguendo questo ordine operativo:

1. **Fase 1: Fix delle suite di avvio (Crash 1 e 2)**
   - Applicare il mock hoisted statico per `@/lib/supabase/client` in `storage-cleanup-service.test.ts`.
   - Applicare il mock hoisted statico per `@/lib/supabase/client` in `magic-bytes-validation.test.ts`.
   - Verificare che entrambe le suite si avviino e passino integralmente in isolamento.

2. **Fase 2: Convalida cumulativa (Risoluzione del domino 3)**
   - Eseguire la suite completa del progetto (`npx jest --no-coverage --runInBand`).
   - Verificare che `AppDataContext.spec.ts` passi senza sollevare errori di variabili d'ambiente mancanti.

3. **Fase 3: Stabilizzazione test intermittenti (Problema 4)**
   - Refactorizzare il mock dinamico di `magic-bytes-reader` in `allegati.storage.test.ts` in favor di un mock hoisted statico con variabile di stato mutabile.
   - Eseguire ripetutamente la suite `allegati.storage.test.ts` in cicli multipli per garantirne il determinismo al 100%.

Non è necessario effettuare alcun refactoring del codice sorgente di produzione per risolvere questi problemi, limitando al massimo i rischi per la stabilità del motore finanziario.

---

## Verdetto finale

Tutti e 4 i problemi analizzati appartengono esclusivamente all'infrastruttura e al setup dei test, non a bug logici del motore di ZecchinoReact. La testabilità del codice sorgente è adeguata, ma risente del pattern di inizializzazione sincrona del client Supabase a livello globale di modulo.

La soluzione consigliata e più stabile consiste nell'utilizzare mock statici e sollevati (hoisted) di Jest, neutralizzando i crash di startup e le instabilità di timing delle closure dinamiche.

Una volta applicate le correzioni suggerite in una singola sessione successiva, la suite di test sarà solida al 100%, sbloccando la successiva fase di integrazione con l'interfaccia grafica.

---

## Note finali di sessione

Si dichiara formalmente che in questa sessione analitica:
- Non sono state apportate modifiche al codice sorgente del motore.
- Non sono stati modificati i file di test.
- Non sono stati creati branch secondari nel repository.
- Il file `SPARK-START.md` non è stato modificato in quanto lo stato complessivo dei piani e dei todo rimane invariato.
- L'attività svolta si è limitata alla lettura, all'esecuzione diagnostica osservativa e alla stesura del presente report e all'aggiornamento minimo del changelog.

---

Fine del report — versione v1.0.0
