---
tipo: todo
titolo: "TODO — Test Sessione E4 — Blocco 3: Repository e Librerie"
riferimento-plan: docs/3-coding-plans/024-PLAN_test-sessione-E4-blocco3_v1.0.0.md
versione: 1.0.0
data-creazione: 2026-06-30
stato: COMPLETED
ramo: main
agente: Antigravity
---

# TODO 024 — Test Sessione E4 — Blocco 3: Repository e Librerie

## 1. Stato / Snapshot

| Campo | Valore |
|---|---|
| Ultimo Agente Attivo | Antigravity |
| Blocco in Carico | Sessione E4 test — Blocco 3 Repository e Librerie |
| Last Completed Task | Implementazione dei 116 test unitari ed integrativi per Blocco 3 |
| Next Action | Nessuna (Sessione E4 completata) |
| Open Threads | — |

---

## 2. Checklist Test per Modulo (in ordine di commit consigliato)

### COMMIT 1 — Unit test per cache, client e types Supabase

#### 1. cache.ts (`src/lib/supabase/cache.ts` → `__tests__/cache.test.ts`)
- [x] **Test 1:** `writeCache` - serializzazione e scrittura su AsyncStorage [Normale]
- [x] **Test 2:** `readCache` - lettura e deserializzazione di dati validi [Normale]
- [x] **Test 3:** `readCache` - restituzione null per chiave inesistente [Limite]
- [x] **Test 4:** `readCache` - cattura eccezione, rimozione chiave e restituzione null per JSON corrotto [Errore]
- [x] **Test 5:** `readCache` - rimozione chiave e restituzione null per versione cache non corrispondente [Limite]
- [x] **Test 6:** `isCacheStale` - calcolo corretto di cache non scaduta con TTL valido [Normale]
- [x] **Test 7:** `isCacheStale` - rilevamento di scadenza per timestamp vecchio rispetto a TTL [Limite]
- [x] **Test 8:** `isCacheStale` - gestione di TTL specifici diversi a seconda della risorsa [Normale]
- [x] **Test 9:** `invalidateCache` - eliminazione di tutte le 12 tabelle di dominio per l'utente loggato [Normale]
- [x] **Test 10:** `writeCache` - gestione robusta di parametri nulli o non validi [Limite]

#### 2. client.ts (`src/lib/supabase/client.ts` → `__tests__/client.test.ts`)
- [x] **Test 11:** `client.ts` - lancia eccezione bloccante se `SUPABASE_URL` è assente [Errore]
- [x] **Test 12:** `client.ts` - lancia eccezione bloccante se `SUPABASE_ANON_KEY` è assente [Errore]

#### 3. types.ts (`src/lib/supabase/types.ts` → `__tests__/types.test.ts`)
- [x] **Test 13:** `RepositoryError` - costruttore con messaggio imposta campi a null [Normale]
- [x] **Test 14:** `RepositoryError` - costruttore con `PostgrestError` (DbError) mappa tutte le proprietà [Normale]

---

### COMMIT 2 — Copertura per helpers, sound e haptic system

#### 4. helpers.ts (`src/lib/helpers.ts` → `src/lib/__tests__/helpers.test.ts`)
- [x] **Test 15:** `formatDateShort` - formattazione corretta di data valida in gg/mm/aa [Normale]
- [x] **Test 16:** `getTotalBalance` - calcolo corretto somma saldi conti con transazioni collegate [Normale]
- [x] **Test 17:** `getTransactionsInPeriod` - filtraggio preciso di transazioni nell'intervallo temporale [Normale/Limite]
- [x] **Test 18:** `getTotalByType` - somma isolata per sole entrate o sole uscite [Normale]
- [x] **Test 19:** `groupTransactionsByCategory` - gestione e raggruppamento sotto "Sconosciuta" per categoria mancante [Normale/Limite]
- [x] **Test 20:** `exportToCSV` - omissione dei campi senza crash per conti o categorie nulle [Limite]
- [x] **Test 21:** `getBudgetProgress` - calcolo progresso per budget solo su conto (senza categoria) [Normale]
- [x] **Test 22:** `getBudgetProgress` - calcolo progresso per budget globale (senza conto né categoria) [Normale]
- [x] **Test 23:** `getActiveBudgets` - esclusione dei budget scaduti o inattivi rispetto a oggi [Normale/Limite]
- [x] **Test 24:** `getBudgetPeriodDates` - calcolo date per periodizzazione trimestrale e annuale [Normale]
- [x] **Test 25:** `getSavingsGoalProgress` / `calculateSavingsProjection` - gestione scadenza assente, importoCorrente = 0 o elapsedDays <= 0 [Limite]

#### 5. haptic-system.ts (`src/lib/haptic-system.ts` → `__tests__/haptic-system.test.tsx`)
- [x] **Test 26:** `loadSettings` - errore AsyncStorage gestito impostando i default del sistema [Errore]
- [x] **Test 27:** `saveSettings` - errore AsyncStorage gestito senza sollevare crash [Errore]
- [x] **Test 28:** `HapticSystem` - fallimenti a runtime su expo-haptics catturati con console.warn [Errore]
- [x] **Test 29:** `transactionCreated` - stabilità del metodo shim deprecato [Normale]
- [x] **Test 30:** `goalCompleted` - stabilità del metodo shim deprecato [Normale]
- [x] **Test 31:** `dialogClose` - stabilità del metodo shim deprecato [Normale]
- [x] **Test 32:** Altri shim deprecati (es. `selectionChanged`, `impact`) stabili [Normale]

#### 6. sound-system.ts (`src/lib/sound-system.ts` → `__tests__/sound-system.spec.ts`)
- [x] **Test 33:** `ensureContext` - fallimento `audioContext.resume` intercettato con warning [Errore]
- [x] **Test 34:** `SoundSystem` - eccezione costruttore AudioContext disabilita il sound system [Errore]
- [x] **Test 35:** AppState - transizione in `background` sospende il contesto audio [Normale]
- [x] **Test 36:** AppState - transizione in `active` riprende il contesto audio [Normale]
- [x] **Test 37:** `playToneAt` - errore interno di riproduzione tono gestito senza crash [Errore]
- [x] **Test 38:** `playSequence` - errore interno di riproduzione sequenza gestito senza crash [Errore]
- [x] **Test 39:** `configure` - riconfigurazione volume e enabled gestita in sicurezza [Normale]

---

### COMMIT 3 — Test mancanti per repositories Supabase

#### 7. storage.ts (`src/lib/supabase/storage.ts` → `__tests__/allegati.storage.test.ts`)
- [x] **Test 40:** Fallback UUID - calcolo corretto in assenza di `crypto.randomUUID` e `crypto.getRandomValues` [Limite/Errore]
- [x] **Test 41:** `loadFsModule` - gestione del fallimento caricamento modulo `react-native-fs` [Errore]
- [x] **Test 42:** `base64ToArrayBuffer` - fallback su `atob` in assenza dell'oggetto `Buffer` [Limite]
- [x] **Test 43:** `deleteAttachment` - errore bucket Supabase intercettato e mappato su errore repository [Errore]
- [x] **Test 44:** `getAttachmentSignedUrl` - errore sollevato se `data.signedUrl` restituito è nullo [Errore]

#### 8. impostazioni-utente.ts (`src/lib/supabase/repositories/impostazioni-utente.ts` → `__tests__/impostazioni-utente.repository.test.ts`)
- [x] **Test 45:** `getOrCreate` - record esistente recuperato e mappato correttamente [Normale]
- [x] **Test 46:** `getOrCreate` - record assente inserito con default e ritornato [Normale]
- [x] **Test 47:** `getOrCreate` - retry select in presenza di errore violazione unicità concorrente `23505` [Limite/Errore]
- [x] **Test 48:** `updateField` - esecuzione corretta query di aggiornamento campo [Normale]
- [x] **Test 49:** `updatePreference` - invocazione RPC `update_impostazioni_preference` con merge chiavi [Normale]
- [x] **Test 50:** `updatePinHashAndSalt` - errore sollevato all'invocazione (indirizza su updatePinSecurityMaterial) [Errore]
- [x] **Test 51:** `getUid` - utente non loggato solleva errore di sessione assente [Errore]
- [x] **Test 52:** `getOrCreate` - fallimento query di select iniziale solleva errore del repository [Errore]
- [x] **Test 53:** `getOrCreate` - fallimento query di insert solleva errore del repository [Errore]
- [x] **Test 54:** `updateField` - fallimento query di update solleva errore del repository [Errore]

#### 9. prestiti-rimborsi.ts (`src/lib/supabase/repositories/prestiti-rimborsi.ts` → `__tests__/prestiti-rimborsi.repository.test.ts`)
- [x] **Test 55:** `getAll` - recupero completo rimborsi ordinati per data decrescente [Normale]
- [x] **Test 56:** `getAll` - errore sollevato se utente non è autenticato [Errore]
- [x] **Test 57:** `addRimborso` - errore RPC di database propagato correttamente [Errore]
- [x] **Test 58:** `addRimborso` - errore sollevato se risposta RPC ha ID nullo [Errore]
- [x] **Test 59:** `deleteRimborso` - errore RPC di cancellazione catturato e propagato [Errore]
- [x] **Test 60:** `addRimborso` - gestione corretta con note molto lunghe [Limite]
- [x] **Test 61:** `addRimborso` - gestione corretta con importo pari a zero [Limite]

#### 10. prestiti.ts (`src/lib/supabase/repositories/prestiti.ts` → `__tests__/prestiti.repository.test.ts`)
- [x] **Test 62:** `getAll` / `getAttivi` - caricamento e ordinamento contratti conformi a DB [Normale]
- [x] **Test 63:** `getById` - recupero prestito per ID riuscito [Normale]
- [x] **Test 64:** `getById` - errore sollevato se ID non existe a DB [Errore]
- [x] **Test 65:** `update` - aggiornamento dati e ricalcolo rata/interessi con vecchi dati se omessi [Normale]
- [x] **Test 66:** `close` - cambio stato in 'chiuso' ed esecuzione update a DB [Normale]
- [x] **Test 67:** `getUid` - utente non loggato solleva errore [Errore]
- [x] **Test 68:** `enrichWithDerivedFields` - durata > 0 ma tipo != mutuo calcola solo data fine [Normale]
- [x] **Test 69:** `update` - gestione valori limite tassi di interesse a zero [Limite]
- [x] **Test 70:** `update` - gestione valori limite durata prestiti a zero [Limite]
- [x] **Test 71:** `getAll` - fallimento select su tabella prestiti solleva errore repository [Errore]

#### 11. allegati.ts (`src/lib/supabase/repositories/allegati.ts` → `__tests__/allegati.repository.test.ts`)
- [x] **Test 72:** `getUid` - fallimento autenticazione in creazione lancia errore repository [Errore]
- [x] **Test 73:** `getAll` - errore immediato se `transazioneId` è vuoto o composto da spazi [Limite/Errore]
- [x] **Test 74:** `create` - errore di caricamento non standard (es. stringa) tradotto in errore repository [Errore]

#### 12. notifiche.ts (`src/lib/supabase/repositories/notifiche.ts` → `__tests__/notifiche.repository.test.ts`)
- [x] **Test 75:** `updateMetadata` - aggiornamento parziale del campo JSONB su DB riuscito [Normale]
- [x] **Test 76:** `updateMetadata` - errore DB propagato correttamente [Errore]
- [x] **Test 77:** `getUid` - utente non autenticato solleva errore [Errore]
- [x] **Test 78:** `getAll` - errore query Supabase catturato e propagato [Errore]
- [x] **Test 79:** `getUnreadCount` - errore query Supabase catturato e propagato [Errore]
- [x] **Test 80:** `markAsRead` - errore query Supabase catturato e propagato [Errore]
- [x] **Test 81:** `updateMetadata` - salvataggio metadata complessi preserva tutti i campi [Limite]

#### 13. transazioni-tag.ts (`src/lib/supabase/repositories/transazioni-tag.ts` → `__tests__/transazioni-tag.repository.test.ts`)
- [x] **Test 82:** `getTagMapForTransactions` - array transazioni vuoto ritorna `{}` senza query DB [Limite]
- [x] **Test 83:** `addTag` - errore RPC propagato correttamente [Errore]
- [x] **Test 84:** `removeTag` - errore RPC propagato correttamente [Errore]

---

### COMMIT 4 — Copertura per storage-cleanup, export e magic-bytes

#### 14. storage-cleanup-service.ts (`src/lib/storage-cleanup-service.ts` → `__tests__/storage-cleanup-service.test.ts`)
- [x] **Test 85:** `listStoragePrefix` - interrogazione Supabase storage ed elenco elementi riuscito [Normale]
- [x] **Test 86:** `listCandidateFilesDefault` - scansione cartelle e recupero file orfani fino al limite [Normale/Limite]
- [x] **Test 87:** `listKnownPathsDefault` - recupero percorsi noti da DB e filtro per transazione [Normale]
- [x] **Test 88:** `cleanupRecentOrphans` - errore sollevato da Supabase storage gestito [Errore]
- [x] **Test 89:** `cleanupTransactionOrphans` - errore sollevato da database gestito [Errore]
- [x] **Test 90:** `listCandidateFilesDefault` - gestione directory vuota ritorna array vuoto [Limite]

#### 15. notification-service.ts (`src/lib/notification-service.ts` → `__tests__/notification-service.test.ts`)
- [x] **Test 91:** `reset` - azzeramento dello stato in memoria delle percentuali di budget accumulate [Normale]
- [x] **Test 92:** `hydrateUnreadNotifications` - caricamento corretto delle notifiche non lette [Normale]
- [x] **Test 93:** `cleanupReadyNotifications` - eliminazione notifiche lette e scadute (> 30 giorni) [Normale]
- [x] **Test 94:** `processBudgetNotifications` - non crea notifica se `shouldShow` è false [Limite]
- [x] **Test 95:** `processBudgetNotifications` - non crea notifica se livello è `'info'` [Limite]
- [x] **Test 96:** `processBudgetNotifications` - non duplica notifica non letta per lo stesso livello [Limite]
- [x] **Test 97:** `processBudgetNotifications` - crea notifica `budget_superato` se spesa >= 100% [Normale]
- [x] **Test 98:** `processBudgetNotifications` - mapping corretto dei metadati e dei messaggi [Normale]

#### 16. export-service.ts (`src/lib/export-service.ts` → `__tests__/ExportService.test.ts`)
- [x] **Test 99:** `exportFile` - assenza runtime base64 (Buffer/btoa undefined) mappa errore a `UNKNOWN` [Errore]
- [x] **Test 100:** `exportFile` - fallimento caricamento fs Windows (`loadOptionalFsModule` fallito) mappa a `UNSUPPORTED_PLATFORM` [Errore]
- [x] **Test 101:** `exportFile` - picker Windows restituisce errore non legato a nome file mappato a `UNKNOWN` [Errore]
- [x] **Test 102:** `exportFile` - bridge rigetta promessa in `WinRTSavePicker.pickSavePath` mappato a `UNKNOWN` [Errore]

#### 17. crypto.ts (`src/lib/crypto.ts` → `__tests__/crypto/wrapped-master-key.test.ts` & `__tests__/crypto/encrypt-decrypt.test.ts`)
- [x] **Test 103:** `deserializeWrappedMasterKeyPayload` - input null ritorna null [Limite]
- [x] **Test 104:** `unwrapMasterKeyWithPin` - payload deserializzato null solleva errore `MASTER_KEY_NOT_CONFIGURED` [Errore]
- [x] **Test 105:** `decryptDataPin` - versione KDF non supportata (!= 1) solleva errore esplicito [Errore]

#### 18. magic-bytes-reader.android.ts (`src/lib/file-system/magic-bytes-reader.android.ts` → `__tests__/magic-bytes-validation.test.ts`)
- [x] **Test 106:** `loadFsModule` - errore importazione `react-native-fs` ritorna `Uint8Array(0)` [Errore]
- [x] **Test 107:** `decodeBase64` - fallback su `atob` in assenza dell'oggetto `Buffer` [Limite]
- [x] **Test 108:** `readFileHeader` - metodo `read` non definito esegue fallback su `readFile` [Limite]
- [x] **Test 109:** `readFileHeader` - errore generico di lettura catturato ritornando `Uint8Array(0)` [Errore]

#### 19. magic-bytes-reader.ts (`src/lib/file-system/magic-bytes-reader.ts` → `__tests__/magic-bytes-validation.test.ts`)
- [x] **Test 110:** `matchesSignature` - firma vuota o header corto rispetto a firma ritorna false [Limite]
- [x] **Test 111:** HEIC - header inferiore a 12 byte ritorna false [Limite]
- [x] **Test 112:** HEIC - tag `ftyp` assente nei byte 4-7 ritorna false [Limite/Errore]
- [x] **Test 113:** `matchesSignature` - firma non corrispondente ritorna false [Normale]

#### 20. magic-bytes-reader.windows.ts (`src/lib/file-system/magic-bytes-reader.windows.ts` → `__tests__/magic-bytes-validation.test.ts`)
- [x] **Test 114:** `loadFsModule` - errore importazione `react-native-fs` ritorna `Uint8Array(0)` [Errore]
- [x] **Test 115:** `decodeBase64` - fallback su `atob` in assenza dell'oggetto `Buffer` [Limite]
- [x] **Test 116:** `readFileHeader` - metodo `read` non definito esegue fallback su `readFile` [Limite]

---

## 3. Chiusura Sessione

- [x] **Verifica Compilazione:** Eseguire `npx tsc --noEmit` per garantire la stabilità di TypeScript.
- [x] **Verifica Test:** Eseguire la suite completa tramite `npx jest` e assicurarsi che tutti i test passino.
- [x] **Changelog:** Aggiornare `CHANGELOG.md` registrando la Sessione E4 (coding plan e todo list prodotti).
- [x] **Todo Master:** Aggiornare `docs/todo-master.md` aggiungendo i riferimenti a PLAN 024 e TODO 024.
- [x] **Push:** Eseguire commit e push su `main` con messaggio coerente.
