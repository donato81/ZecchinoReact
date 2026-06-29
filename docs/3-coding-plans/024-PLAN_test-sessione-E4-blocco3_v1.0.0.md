---
tipo: plan
titolo: Test Sessione E4 — Blocco 3: Repository e Librerie
versione: 1.0.0
data: 2026-06-30
stato: APPROVED
perimetro: src/lib/supabase/cache.ts, src/lib/supabase/client.ts, src/lib/supabase/storage.ts, src/lib/supabase/types.ts, src/lib/supabase/repositories/impostazioni-utente.ts, src/lib/supabase/repositories/prestiti-rimborsi.ts, src/lib/supabase/repositories/prestiti.ts, src/lib/supabase/repositories/allegati.ts, src/lib/supabase/repositories/notifiche.ts, src/lib/supabase/repositories/transazioni-tag.ts, src/lib/helpers.ts, src/lib/haptic-system.ts, src/lib/storage-cleanup-service.ts, src/lib/sound-system.ts, src/lib/notification-service.ts, src/lib/export-service.ts, src/lib/crypto.ts, src/lib/file-system/magic-bytes-reader.android.ts, src/lib/file-system/magic-bytes-reader.ts, src/lib/file-system/magic-bytes-reader.windows.ts
ramo: main
---

# PLAN 024 — Test Sessione E4 — Blocco 3: Repository e Librerie

## Riepilogo Esecutivo

Questo Coding Plan definisce la pianificazione strategica per la Sessione E4 dei test del progetto ZecchinoReact, relativa al **Blocco 3 — Repository e Librerie**. L'obiettivo è colmare i gap di copertura rilevati in `docs/1-reports/REPORT-analisi-copertura-test-completa_v1.0.0.md`, portando al 100% la copertura di 20 moduli chiave di persistenza, validazione, storage e utilità del codebase.

- **Obiettivo della sessione:** Implementare tutti i test mancanti identificati per garantire robustezza su rami insoliti, errori del database, fallback offline e comportamenti limite.
- **Numero test stimati:** 116 test unitari ed integrati nuovi.
- **Moduli coinvolti:** 20 moduli totali (suddivisi in cache, client, storage, types, 6 repository Supabase, 3 moduli di sistema/servizio, 3 file-system magic-bytes-readers, export, helper e crypto).
- **Nuove suite di test da creare (3):**
  - `__tests__/cache.test.ts` (10 test per `src/lib/supabase/cache.ts`)
  - `__tests__/client.test.ts` (2 test per `src/lib/supabase/client.ts`)
  - `__tests__/types.test.ts` (2 test per `src/lib/supabase/types.ts`)
- **Suite di test esistenti da integrare (15):**
  - `__tests__/allegati.storage.test.ts` (5 test per `src/lib/supabase/storage.ts`)
  - `__tests__/impostazioni-utente.repository.test.ts` (10 test per `src/lib/supabase/repositories/impostazioni-utente.ts`)
  - `__tests__/prestiti-rimborsi.repository.test.ts` (7 test per `src/lib/supabase/repositories/prestiti-rimborsi.ts`)
  - `__tests__/prestiti.repository.test.ts` (10 test per `src/lib/supabase/repositories/prestiti.ts`)
  - `__tests__/allegati.repository.test.ts` (3 test per `src/lib/supabase/repositories/allegati.ts`)
  - `__tests__/notifiche.repository.test.ts` (7 test per `src/lib/supabase/repositories/notifiche.ts`)
  - `__tests__/transazioni-tag.repository.test.ts` (3 test per `src/lib/supabase/repositories/transazioni-tag.ts`)
  - `src/lib/__tests__/helpers.test.ts` (10 test per `src/lib/helpers.ts`)
  - `__tests__/haptic-system.test.tsx` (7 test per `src/lib/haptic-system.ts`)
  - `__tests__/storage-cleanup-service.test.ts` (6 test per `src/lib/storage-cleanup-service.ts`)
  - `__tests__/sound-system.spec.ts` (7 test per `src/lib/sound-system.ts`)
  - `__tests__/notification-service.test.ts` (8 test per `src/lib/notification-service.ts`)
  - `__tests__/ExportService.test.ts` (4 test per `src/lib/export-service.ts`)
  - `__tests__/crypto/wrapped-master-key.test.ts` / `__tests__/crypto/encrypt-decrypt.test.ts` (3 test per `src/lib/crypto.ts`)
  - `__tests__/magic-bytes-validation.test.ts` (12 test totali per `magic-bytes-reader.ts`, `magic-bytes-reader.android.ts` e `magic-bytes-reader.windows.ts`)

---

## 1. Strategia e Dettaglio Modulo per Modulo

### 1. cache.ts
- **File target:** [cache.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/supabase/cache.ts)
- **Test target:** `__tests__/cache.test.ts` [NEW]
- **Obiettivo:** Coprire integralmente la logica di serializzazione, deserializzazione, versioning e scadenza del caching offline locale.
- **Stima test:** 10 test.
- **Dipendenze da mockare:** `@react-native-async-storage/async-storage`.
- **Test pianificati:**
  1. `writeCache` serializza correttamente i dati in formato JSON e li scrive su AsyncStorage.
  2. `readCache` recupera con successo i dati validi e li deserializza correttamente.
  3. `readCache` con chiave inesistente restituisce null.
  4. `readCache` con JSON non valido o corrotto intercetta l'eccezione, cancella la chiave da AsyncStorage e restituisce null.
  5. `readCache` con una versione cache non corrispondente cancella l'elemento e restituisce null.
  6. `isCacheStale` con TTL valido verifica che la cache non sia scaduta.
  7. `isCacheStale` con timestamp vecchio rispetto al TTL fornito rileva la scadenza.
  8. `isCacheStale` gestisce specificamente le risorse a TTL diverso (es. notifiche vs simulazioni).
  9. `invalidateCache` elimina correttamente tutte le 12 tabelle del dominio per l'utente loggato.
  10. `writeCache` gestisce parametri nulli o non validi sollevando warning o gestendoli in sicurezza.

### 2. client.ts
- **File target:** [client.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/supabase/client.ts)
- **Test target:** `__tests__/client.test.ts` [NEW]
- **Obiettivo:** Garantire il blocco all'avvio nel caso in cui le variabili d'ambiente Supabase siano assenti.
- **Stima test:** 2 test.
- **Dipendenze da mockare:** `@env` (sovraccaricato a runtime per ciascun test).
- **Test pianificati:**
  1. Lancio di eccezione bloccante se `SUPABASE_URL` non è impostata nell'ambiente.
  2. Lancio di eccezione bloccante se `SUPABASE_ANON_KEY` non è impostata nell'ambiente.

### 3. storage.ts
- **File target:** [storage.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/supabase/storage.ts)
- **Test target:** [allegati.storage.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/allegati.storage.test.ts) [MODIFY]
- **Obiettivo:** Aggiungere test per i rami di fallback dei magic bytes, fallback uuid e fallimenti nativi.
- **Stima test:** 5 test.
- **Dipendenze da mockare:** `@/lib/supabase/client` (Storage API), `react-native-fs`.
- **Test pianificati:**
  1. Generatore UUID di fallback interno quando `crypto.randomUUID` e `crypto.getRandomValues` non sono esposti a runtime.
  2. Rilevamento fallito del modulo fs Windows/Android (`loadFsModule` fallito) gestito restituendo un errore specifico di inizializzazione.
  3. `base64ToArrayBuffer` esegue la decodifica di fallback con `atob` se l'oggetto Node `Buffer` è assente.
  4. Fallimento del bucket Supabase in `deleteAttachment` catturato e mappato su errore localizzato del repository.
  5. Chiamata a `getAttachmentSignedUrl` lancia errore se la proprietà `data.signedUrl` ritornata è vuota o indefinita.

### 4. types.ts
- **File target:** [types.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/supabase/types.ts)
- **Test target:** `__tests__/types.test.ts` [NEW]
- **Obiettivo:** Testare il costruttore dell'errore centralizzato.
- **Stima test:** 2 test.
- **Dipendenze da mockare:** Nessuna.
- **Test pianificati:**
  1. Creazione con stringa pura: messaggio mappato e campi `code`, `details`, `hint` impostati a null.
  2. Creazione passandogli un `PostgrestError` (DbError): mappa correttamente tutte le proprietà (`code`, `details`, `hint`).

### 5. impostazioni-utente.ts
- **File target:** [impostazioni-utente.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/supabase/repositories/impostazioni-utente.ts)
- **Test target:** [impostazioni-utente.repository.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/impostazioni-utente.repository.test.ts) [MODIFY]
- **Obiettivo:** Aumentare la copertura testando la logica di fallback di getOrCreate in presenza di conflitti di inserimento concorrente.
- **Stima test:** 10 test.
- **Dipendenze da mockare:** `@/lib/supabase/client` (Database RPC/Tables).
- **Test pianificati:**
  1. `getOrCreate` con record esistente esegue la select e ritorna l'oggetto mappato.
  2. `getOrCreate` con record assente esegue l'insert con i valori di default e lo ritorna.
  3. `getOrCreate` rileva errore `23505` (violazione chiave unica per inserimento concorrente) ed esegue un retry di selezione ritornando il record concorrente.
  4. `updateField` esegue una chiamata update mirata sul database filtrando per uid.
  5. `updatePreference` invoca la RPC `update_impostazioni_preference` passando i dati validi.
  6. `updatePinHashAndSalt` lancia un errore esplicito di avviso se invocata (vietata, usare `updatePinSecurityMaterial`).
  7. `getUid` fallito (utente non autenticato) lancia eccezione di sessione assente.
  8. Gestione degli errori sulle query di select, insert e update in ciascun metodo.

### 6. prestiti-rimborsi.ts
- **File target:** [prestiti-rimborsi.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/supabase/repositories/prestiti-rimborsi.ts)
- **Test target:** [prestiti-rimborsi.repository.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/prestiti-rimborsi.repository.test.ts) [MODIFY]
- **Obiettivo:** Testare errori RPC e ordinamenti.
- **Stima test:** 7 test.
- **Dipendenze da mockare:** `@/lib/supabase/client` (RPC, Database).
- **Test pianificati:**
  1. `getAll` ritorna l'elenco completo dei rimborsi ordinati per data decrescente.
  2. `getAll` lancia eccezione se l'utente non è autenticato.
  3. `addRimborso` propaga l'eccezione in caso di errore della chiamata RPC.
  4. `addRimborso` solleva errore se la risposta RPC ha ID nullo o non conforme.
  5. `deleteRimborso` cattura ed espone l'errore del DB in caso di fallimento della RPC.
  6. Inserimento di rimborsi con note extra-lunghe o importo a zero.

### 7. prestiti.ts
- **File target:** [prestiti.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/supabase/repositories/prestiti.ts)
- **Test target:** [prestiti.repository.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/prestiti.repository.test.ts) [MODIFY]
- **Obiettivo:** Testare le relazioni, l'enrichment dei campi derivati e i ricalcoli di rata/interessi.
- **Stima test:** 10 test.
- **Dipendenze da mockare:** `@/lib/supabase/client` (Database), `@/lib/loan-calculator`.
- **Test pianificati:**
  1. `getAll` e `getAttivi` caricano e restituiscono i prestiti dell'utente corretti.
  2. `getById` recupera con successo un prestito specifico.
  3. `getById` per un elemento inesistente solleva un errore di not-found.
  4. `update` esegue l'aggiornamento e ricalcola i parametri finanziari integrando i vecchi valori se non passati esplicitamente.
  5. `close` modifica lo stato a 'chiuso' ed esegue l'update.
  6. `getUid` fallito lancia errore di utente non autenticato.
  7. `enrichWithDerivedFields` con durata superiore a zero ma tipo diverso da `mutuo_finanziamento` calcola solo la data fine stimata ed azzera rata e interessi.
  8. Test limite con tasso di interesse o durata pari a zero.

### 8. allegati.ts
- **File target:** [allegati.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/supabase/repositories/allegati.ts)
- **Test target:** [allegati.repository.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/allegati.repository.test.ts) [MODIFY]
- **Obiettivo:** Coprire eccezioni ed input non validi.
- **Stima test:** 3 test.
- **Dipendenze da mockare:** `@/lib/supabase/client` (Database), `@/lib/supabase/storage`.
- **Test pianificati:**
  1. `getUid` fallito in fase di creazione solleva errore localizzato.
  2. `getAll` con parametro `transazioneId` vuoto o composto da soli spazi bianchi solleva eccezione immediata.
  3. `create` intercetta e mappa in errore generico del repository un errore di caricamento non standard (es. stringa).

### 9. notifiche.ts
- **File target:** [notifiche.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/supabase/repositories/notifiche.ts)
- **Test target:** [notifiche.repository.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/notifiche.repository.test.ts) [MODIFY]
- **Obiettivo:** Testare l'aggiornamento parziale del payload e i meccanismi di scadenza e pulizia.
- **Stima test:** 7 test.
- **Dipendenze da mockare:** `@/lib/supabase/client` (Database).
- **Test pianificati:**
  1. `updateMetadata` aggiorna parzialmente il campo JSONB su DB.
  2. `updateMetadata` gestisce e propaga l'errore se la chiamata del database fallisce.
  3. `getUid` non valido lancia eccezione nel repository.
  4. Errori interni di query Supabase catturati e mappati in tutti i metodi di lettura.
  5. Notifiche con metadati ricchi o complessi gestite senza perdita di attributi.

### 10. transazioni-tag.ts
- **File target:** [transazioni-tag.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/supabase/repositories/transazioni-tag.ts)
- **Test target:** [transazioni-tag.repository.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/transazioni-tag.repository.test.ts) [MODIFY]
- **Obiettivo:** Coprire l'early return sui casi limite.
- **Stima test:** 3 test.
- **Dipendenze da mockare:** `@/lib/supabase/client` (Database/RPC).
- **Test pianificati:**
  1. `getTagMapForTransactions` con array vuoto esegue un early return restituendo `{}` senza effettuare chiamate di rete.
  2. Test di propagazione errori RPC per i restanti metodi (`addTag`, `removeTag`, `setTagsForTransaction`).

### 11. helpers.ts
- **File target:** [helpers.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/helpers.ts)
- **Test target:** [helpers.test.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/__tests__/helpers.test.ts) [MODIFY]
- **Obiettivo:** Coprire i rami di calcolo dei budget complessi e delle proiezioni dei risparmi non coperte.
- **Stima test:** 10 test.
- **Dipendenze da mockare:** Nessuna.
- **Test pianificati:**
  1. `formatDateShort` con data valida formatta gg/mm/aa correttamente.
  2. `getTotalBalance` calcola la somma aggregata dei saldi di più conti.
  3. `getTransactionsInPeriod` filtra le transazioni rientranti esattamente nell'intervallo temporale.
  4. `getTotalByType` somma in modo isolato entrate o uscite.
  5. `groupTransactionsByCategory` gestisce transazioni con categoria mancante raggruppandole sotto "Sconosciuta".
  6. `exportToCSV` gestisce conti o categorie nulle omettendo i campi corrispondenti senza crash.
  7. `getBudgetProgress` per budget specifici di conto (senza categoria) e budget globali.
  8. `getActiveBudgets` esclude budget scaduti o inattivi rispetto alla data corrente.
  9. `getBudgetPeriodDates` calcola le date di inizio/fine corrette per i periodi trimestrale e annuale.
  10. `getSavingsGoalProgress` e `calculateSavingsProjection` coprono i casi limite (scadenza assente, importoCorrente = 0, elapsedDays <= 0).

### 12. haptic-system.ts
- **File target:** [haptic-system.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/haptic-system.ts)
- **Test target:** [haptic-system.test.tsx](file:///c:/Sviluppo/ZecchinoReact/__tests__/haptic-system.test.tsx) [MODIFY]
- **Obiettivo:** Testare il recupero dello stato iniziale persistito ed eccezioni AsyncStorage.
- **Stima test:** 7 test.
- **Dipendenze da mockare:** `@react-native-async-storage/async-storage`, `expo-haptics`.
- **Test pianificati:**
  1. Gestione di eccezione in `loadSettings` (AsyncStorage fallisce): inizializza il sistema con i valori di default.
  2. Gestione di eccezione in `saveSettings` (AsyncStorage fallisce): garantisce che il sistema non crashi.
  3. Eccezioni scatenate a runtime in expo-haptics (es. modulo non registrato o non supportato su Windows) intercettate ed emesse come console.warn senza crash del chiamante.
  4. Esecuzione stabile di tutti i metodi shim deprecati (`transactionCreated`, `goalCompleted`, `dialogClose`, ecc.).

### 13. storage-cleanup-service.ts
- **File target:** [storage-cleanup-service.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/storage-cleanup-service.ts)
- **Test target:** [storage-cleanup-service.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/storage-cleanup-service.test.ts) [MODIFY]
- **Obiettivo:** Testare i metodi interni di default non coperti a causa di mock totali.
- **Stima test:** 6 test.
- **Dipendenze da mockare:** `@/lib/supabase/client` (Storage/Database).
- **Test pianificati:**
  1. `listStoragePrefix` elenca correttamente i file all'interno del prefisso Supabase.
  2. `listCandidateFilesDefault` esplora le directory recuperando i file orfani fino alla soglia limite.
  3. `listKnownPathsDefault` raccoglie e filtra i percorsi presenti a database.
  4. Cattura e gestione degli errori sollevati da Supabase storage e DB.

### 14. sound-system.ts
- **File target:** [sound-system.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/sound-system.ts)
- **Test target:** [sound-system.spec.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/sound-system.spec.ts) [MODIFY]
- **Obiettivo:** Testare la disabilitazione automatica in caso di fallimento AudioContext e i cambiamenti di stato dell'app (background/active).
- **Stima test:** 7 test.
- **Dipendenze da mockare:** `react-native` (AppState), `react-native-audio-api` (shimmed).
- **Test pianificati:**
  1. `audioContext.resume` fallito in `ensureContext` cattura l'errore emettendo un warning.
  2. Inizializzazione di AudioContext solleva eccezione bloccante: disabilita automaticamente il sound system (`enabled = false`).
  3. Evento AppState `change` con stato `background` sospende il contesto audio.
  4. Evento AppState `change` con stato `active` riprende il contesto audio.
  5. Errori scatenati in `playToneAt` o `playSequence` catturati localmente senza crash.

### 15. notification-service.ts
- **File target:** [notification-service.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/notification-service.ts)
- **Test target:** [notification-service.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/notification-service.test.ts) [MODIFY]
- **Obiettivo:** Coprire la logica di calcolo e deduplicazione degli alert di superamento budget.
- **Stima test:** 8 test.
- **Dipendenze da mockare:** `@/lib/supabase/repositories/notifiche`, `@/lib/helpers`, `@/lib/budget-alerts`.
- **Test pianificati:**
  1. `reset` azzera lo stato delle percentuali dei budget memorizzato in cache volatile.
  2. `hydrateUnreadNotifications` interroga il repository caricando correttamente le notifiche non lette.
  3. `cleanupReadyNotifications` cancella le notifiche scadute da più di 30 giorni.
  4. `processBudgetNotifications` con `shouldShow` falso o livello `info` ignora la creazione.
  5. `processBudgetNotifications` evita la duplicazione se è già presente una notifica non letta per lo stesso livello.
  6. `processBudgetNotifications` crea la notifica `budget_superato` al superamento del 100%.

### 16. export-service.ts
- **File target:** [export-service.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/export-service.ts)
- **Test target:** [ExportService.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/ExportService.test.ts) [MODIFY]
- **Obiettivo:** Coprire i rami di errore legati a filesystem non supportati ed errori del picker di Windows.
- **Stima test:** 4 test.
- **Dipendenze da mockare:** `@react-native-windows/fs`, `react-native-share`, `@/native`.
- **Test pianificati:**
  1. Mancanza runtime base64 (`Buffer` e `btoa` non definiti) cattura l'eccezione e ritorna `UNKNOWN`.
  2. Mancanza del modulo fs in ambiente Windows (`loadOptionalFsModule` fallito) ritorna `UNSUPPORTED_PLATFORM`.
  3. Picker Windows rigetta la promessa restituendo `UNKNOWN`.
  4. Fallimenti non legati al nome file nel picker Windows restituiscono `UNKNOWN`.

### 17. crypto.ts
- **File target:** [crypto.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/crypto.ts)
- **Test target:** `__tests__/crypto/wrapped-master-key.test.ts` e `__tests__/crypto/encrypt-decrypt.test.ts` [MODIFY]
- **Obiettivo:** Testare payload nulli e versioni KDF non supportate.
- **Stima test:** 3 test.
- **Dipendenze da mockare:** Nessuna (crittografia pura).
- **Test pianificati:**
  1. `deserializeWrappedMasterKeyPayload` con input null ritorna null.
  2. `unwrapMasterKeyWithPin` con payload deserializzato null solleva errore `MASTER_KEY_NOT_CONFIGURED`.
  3. `decryptDataPin` con versione KDF non supportata (!= 1) lancia un errore esplicito.

### 18. magic-bytes-reader.android.ts
- **File target:** [magic-bytes-reader.android.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/file-system/magic-bytes-reader.android.ts)
- **Test target:** [magic-bytes-validation.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/magic-bytes-validation.test.ts) [MODIFY]
- **Obiettivo:** Gestire fallback base64 e fallimenti del metodo `read` in ambiente Android.
- **Stima test:** 4 test.
- **Dipendenze da mockare:** `react-native-fs`.
- **Test pianificati:**
  1. Rilevamento fs non disponibile (`loadFsModule` fallito) gestisce l'errore ritornando `Uint8Array(0)`.
  2. `decodeBase64` in assenza di `Buffer` esegue la decodifica con `atob`.
  3. `readFileHeader` con fs importabile ma metodo `read` non supportato esegue fallback su `readFile`.
  4. Eccezione durante la lettura del file catturata ritornando `Uint8Array(0)`.

### 19. magic-bytes-reader.ts
- **File target:** [magic-bytes-reader.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/file-system/magic-bytes-reader.ts)
- **Test target:** [magic-bytes-validation.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/magic-bytes-validation.test.ts) [MODIFY]
- **Obiettivo:** Testare firme non conformi o corte e validità formati HEIC.
- **Stima test:** 4 test.
- **Dipendenze da mockare:** Nessuna.
- **Test pianificati:**
  1. `matchesSignature` con firma vuota o header di dimensione inferiore ritorna false.
  2. Immagine HEIC con header inferiore a 12 byte ritorna false.
  3. Immagine HEIC priva del tag `ftyp` nei byte 4-7 ritorna false.

### 20. magic-bytes-reader.windows.ts
- **File target:** [magic-bytes-reader.windows.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/file-system/magic-bytes-reader.windows.ts)
- **Test target:** [magic-bytes-validation.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/magic-bytes-validation.test.ts) [MODIFY]
- **Obiettivo:** Coprire i rami di errore del lettore in ambiente Windows.
- **Stima test:** 4 test.
- **Dipendenze da mockare:** `react-native-fs`.
- **Test pianificati:**
  1. Rilevamento fs non disponibile (`loadFsModule` fallito) gestisce l'errore ritornando `Uint8Array(0)`.
  2. `decodeBase64` in assenza di `Buffer` esegue la decodifica con `atob`.
  3. `readFileHeader` con fs importabile ma metodo `read` non supportato esegue fallback su `readFile`.
  4. Eccezione durante la lettura del file catturata ritornando `Uint8Array(0)`.

---

## 2. Ordine dei Commit e Flusso di Esecuzione Consigliato

Si raccomanda di implementare i test seguendo l'ordine dei 4 commit proposti per rispettare le dipendenze architetturali e isolare le modifiche:

### Commit 1: `test: implementa unit test per cache, client e types Supabase`
- **Moduli coperti:** `cache.ts`, `client.ts`, `types.ts`
- **File di test creati:** `__tests__/cache.test.ts`, `__tests__/client.test.ts`, `__tests__/types.test.ts`
- **Test stimati:** 14 test.

### Commit 2: `test: completa copertura per helpers, sound e haptic system`
- **Moduli coperti:** `helpers.ts`, `sound-system.ts`, `haptic-system.ts`
- **File di test modificati:** `src/lib/__tests__/helpers.test.ts`, `__tests__/sound-system.spec.ts`, `__tests__/haptic-system.test.tsx`
- **Test stimati:** 24 test.

### Commit 3: `test: aggiunge test mancanti per tutti i repositories Supabase`
- **Moduli coperti:** `storage.ts`, `impostazioni-utente.ts`, `prestiti-rimborsi.ts`, `prestiti.ts`, `allegati.ts`, `notifiche.ts`, `transazioni-tag.ts`
- **File di test modificati:** `__tests__/allegati.storage.test.ts`, `__tests__/impostazioni-utente.repository.test.ts`, `__tests__/prestiti-rimborsi.repository.test.ts`, `__tests__/prestiti.repository.test.ts`, `__tests__/allegati.repository.test.ts`, `__tests__/notifiche.repository.test.ts`, `__tests__/transazioni-tag.repository.test.ts`
- **Test stimati:** 45 test.

### Commit 4: `test: completa copertura per storage-cleanup, export e magic-bytes`
- **Moduli coperti:** `storage-cleanup-service.ts`, `export-service.ts`, `crypto.ts`, `magic-bytes-reader.android.ts`, `magic-bytes-reader.ts`, `magic-bytes-reader.windows.ts`, `notification-service.ts`
- **File di test modificati:** `__tests__/storage-cleanup-service.test.ts`, `__tests__/ExportService.test.ts`, `__tests__/crypto/wrapped-master-key.test.ts`, `__tests__/crypto/encrypt-decrypt.test.ts`, `__tests__/magic-bytes-validation.test.ts`, `__tests__/notification-service.test.ts`
- **Test stimati:** 33 test.

---

## 3. Criteri di Validazione

1. Ogni singolo test deve essere verificato tramite:
   `npx jest --testPathPattern=<nome_test>`
2. La compilazione del codice e dei test deve essere validata prima di ogni commit con:
   `npx tsc --noEmit`
3. Nel caso in cui una suite di test rimanga bloccata per più di 10 tentativi consecutivi, si dovrà accodare a questo documento un **Diagnostic Report** dettagliato contenente il log dell'errore, lo stack trace e l'analisi del fallimento per il Consiglio AI.

## Note tecniche post-validazione Consiglio AI

Documento: validazione sessione del 2026-06-30.
Organo: Consiglio AI (Perplexity, Gemini, DeepSeek, ChatGPT).
Stato: osservazioni non bloccanti — integrate prima del Commit 1.

### NT-1 — client.ts: isolamento modulo nei test Jest

Il modulo `src/lib/supabase/client.ts` importa `SUPABASE_URL` e
`SUPABASE_ANON_KEY` da `@env` e lancia un errore direttamente al
momento dell'importazione se una delle due variabili è assente.

Questo comportamento si chiama errore in import-time: il modulo
fallisce nel momento stesso in cui viene caricato, non quando viene
chiamata una funzione.

Problema tecnico: se il file di test importa `client.ts` una sola
volta all'inizio con `import`, Jest mette in cache il modulo.
I test successivi non ricaricano più il modulo e non possono
quindi testare correttamente gli scenari di errore all'importazione.

Strategia obbligatoria per i Test 11 e 12:
- Non importare `client.ts` staticamente all'inizio del file di test.
- Usare `jest.resetModules()` nel `beforeEach` per svuotare la cache
  dei moduli prima di ogni test.
- Usare `jest.isolateModules()` oppure `require()` dinamico all'interno
  di ogni singolo test, dopo aver configurato il mock di `@env`.

Esempio di struttura corretta:

```ts
  beforeEach(() => {
    jest.resetModules();
  });

  it('lancia errore se SUPABASE_URL manca', () => {
    jest.doMock('@env', () => ({
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: 'test-key',
    }));
    jest.isolateModules(() => {
      expect(() => {
        require('../src/lib/supabase/client');
      }).toThrow();
    });
  });
```

### NT-2 — storage-cleanup-service.ts: strategia di test per funzioni interne

Il modulo `src/lib/storage-cleanup-service.ts` espone pubblicamente
solo la factory `createStorageCleanupService(customDeps?)`.

Le funzioni `listStoragePrefix`, `listCandidateFilesDefault` e
`listKnownPathsDefault` sono funzioni interne non esportate.
Quando non vengono passate dipendenze custom alla factory, il servizio
usa queste funzioni interne come implementazione predefinita.

Strategia preferita per i Test 85-90:
Invocare `createStorageCleanupService()` senza passare `customDeps`,
e mockare invece le API esterne da cui dipendono le funzioni interne:
`supabase.storage`, `supabase.from` e `deleteAttachment`.
In questo modo i test coprono il flusso reale, incluse le funzioni
interne, senza doverle esportare.

Strategia alternativa (ammessa solo come fallback motivato):
Se la strategia preferita non consente una copertura stabile e
verificabile, è ammesso esportare le funzioni interne tramite un
namespace dedicato `_testing`. In tal caso la scelta deve essere
motivata esplicitamente nel messaggio del commit in cui viene
applicata.

### NT-3 — helpers.ts: chiarimento conteggio scenari e task

Il PLAN dichiara 10 test per `helpers.ts`.
Il TODO elenca i task dal Test 15 al Test 25, che sono 11 task numerati.

La discrepanza è intenzionale e non è un errore.
Il Test 25 copre due funzioni correlate in un unico task operativo:
`getSavingsGoalProgress` e `calculateSavingsProjection`.

Il conteggio totale di 116 test dichiarato nel PLAN è corretto.
Non è necessario rinumerare il TODO.
Il Test 25 doppio è documentato e accettato.
