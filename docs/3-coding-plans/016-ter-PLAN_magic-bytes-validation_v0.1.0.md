---
titolo: PLAN 016-ter - Magic Bytes Validation
versione: 0.1.0
data: 2026-05-28
stato: DRAFT
design_riferimento: docs/2-projects/016-ter-DESIGN_magic-bytes-validation_v0.1.0.md
autore: Agent-Orchestrator
dipendenze: PLAN 016
---

# PLAN 016-ter - Magic Bytes Validation

## 1. Obiettivo del Piano

Rafforzare la validazione allegati prima dell'upload leggendo i primi 8 byte del file e verificando le firme JPEG, PNG e PDF su Android e Windows, con fallback fail-closed e throw-safe sulle piattaforme non supportate.

## 2. Perimetro (Scope)

File sorgente da creare o modificare:
- src/lib/file-system/magic-bytes-reader.ts
- src/lib/file-system/magic-bytes-reader.android.ts
- src/lib/file-system/magic-bytes-reader.windows.ts
- src/lib/supabase/storage.ts
- __tests__/magic-bytes-validation.test.ts

Fuori perimetro:
- supporto iOS
- supporto firme HEIC e WEBP
- il bridge nativo Windows è escluso da questo piano
- antivirus o scansioni oltre l'hardening euristico contro spoofing banale

## 3. Prerequisiti Bloccanti

- PLAN 016 completato e convalidato.
- L'integrazione con il dominio allegati deve gia usare validateAttachmentFile come punto di ingresso pre-upload.

## 4. Architettura e Decisioni Chiave

- Invariante 1 - Hardening euristico. Conseguenza pratica: il controllo blocca spoofing banale ma non introduce promesse antivirus.
- Invariante 2 - Validazione locale pre-upload. Conseguenza pratica: se magic bytes fallisce, uploadAttachment non parte.
- Invariante 3 - Fail-closed su piattaforma non supportata. Conseguenza pratica: lo stub ritorna Uint8Array(0) e il file viene rifiutato.
- Invariante 4 - readFileHeader throw-safe. Conseguenza pratica: eccezioni interne non si propagano al chiamante.
- Invariante 5 - Estensione fonte primaria, MIME secondario. Conseguenza pratica: la firma attesa dipende dall'estensione, non dal MIME dichiarato.
- Invariante 6 - Firma parziale non valida. Conseguenza pratica: header piu corto della signature attesa viene sempre rifiutato da matchesSignature.
- Decisione 1 - Lettura di 8 byte e 13 test obbligatori. Conseguenza pratica: introdurre MAGIC_BYTES_READ_LENGTH = 8 e copertura completa JPEG/PNG/PDF.
- Decisione 3 - Cartella dedicata src/lib/file-system/. Conseguenza pratica: i reader magic bytes vivono separati dal modulo storage.
- Decisione 4 - Tre file reader piu integrazione storage. Conseguenza pratica: Android, Windows e stub condividono la stessa API di lettura header.
- Decisione 5 - Ordine validazione obbligatorio. Conseguenza pratica: validateAttachmentFile esegue MIME whitelist, poi whitelist estensione, poi magic bytes.
- Decisione 8 - Helper matchesSignature obbligatorio. Conseguenza pratica: confronto firme centralizzato, incluso caso array vuoto o header corto.

## 5. Task Atomici

### T1
- Azione: Creare il reader stub throw-safe per piattaforme non supportate con ritorno Uint8Array(0) e helper matchesSignature.
- File target: src/lib/file-system/magic-bytes-reader.ts
- Dipende da: nessuno
- Metrica di successo: i test dimostrano che readFileHeader non propaga eccezioni e matchesSignature ritorna false per array vuoti o header troncati.
- Note operative: il file stub deve implementare il fallback fail-closed.

### T2
- Azione: Creare il reader Android che legge i primi 8 byte via expo-file-system.
- File target: src/lib/file-system/magic-bytes-reader.android.ts
- Dipende da: T1
- Metrica di successo: i test dimostrano che un file con firme JPEG, PNG e PDF valide viene accettato sul reader Android.
- Note operative: leggere solo MAGIC_BYTES_READ_LENGTH = 8 byte dal contenuto.

### T3
- Azione: Creare il reader Windows con approccio JS-first e stesso contratto API del reader Android.
- File target: src/lib/file-system/magic-bytes-reader.windows.ts
- Dipende da: T1
- Metrica di successo: i test dimostrano che un file con firme JPEG, PNG e PDF valide viene accettato sul reader Windows.
- Note operative: il bridge nativo Windows è escluso da questo piano; l'implementazione Windows deve essere JS-first senza dipendenze native.

### T4
- Azione: Integrare la validazione magic bytes in validateAttachmentFile rispettando l'ordine MIME whitelist, estensione whitelist e controllo firme.
- File target: src/lib/supabase/storage.ts
- Dipende da: T1, T2, T3
- Metrica di successo: i test dimostrano rifiuto per spoofing, file troncati, file vuoti e piattaforme non supportate senza avviare l'upload.
- Note operative: l'estensione determina la firma attesa; il MIME e controllo secondario.

### T5
- Azione: Creare la suite di test architetturali per magic bytes validation.
- File target: __tests__/magic-bytes-validation.test.ts
- Dipende da: T1, T2, T3, T4
- Metrica di successo: npx jest __tests__/magic-bytes-validation.test.ts --runInBand termina con exit code 0 quando il controllo magic bytes e implementato.
- Note operative: coprire tutti i 13 scenari obbligatori del design 016-ter.

## 6. Test Obbligatori

- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: JPEG valido con firma FF D8 FF passa su Android e Windows. | Tipo: unit
- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: PNG valido con firma 89 50 4E 47 0D 0A 1A 0A passa la validazione. | Tipo: unit
- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: PDF valido con firma 25 50 44 46 passa la validazione. | Tipo: unit
- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: file rinominato .jpg con firma PNG viene rifiutato. | Tipo: unit
- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: file rinominato .pdf con firma JPEG viene rifiutato. | Tipo: unit
- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: file rinominato .png con firma PDF viene rifiutato. | Tipo: unit
- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: file con meno di 8 byte viene rifiutato come firma parziale non valida. | Tipo: unit
- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: file vuoto viene rifiutato. | Tipo: unit
- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: piattaforma non supportata ritorna Uint8Array(0) e rifiuta il file senza propagare eccezioni. | Tipo: unit
- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: readFileHeader throw-safe converte l'eccezione interna in Uint8Array(0). | Tipo: unit
- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: fallimento MIME whitelist cortocircuita prima della lettura magic bytes. | Tipo: unit
- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: matchesSignature con array vuoto ritorna false senza errori. | Tipo: unit
- File spec: __tests__/magic-bytes-validation.test.ts | Scenario: l'estensione resta fonte primaria e un file .jpg con MIME image/png ma firma JPEG viene rifiutato. | Tipo: unit

## 7. Gate di Chiusura

- G-016-ter-1 | Verifica: reader stub, Android, Windows e integrazione storage compilano senza errori. | Comando: npx tsc --noEmit | Stato iniziale: OPEN
- G-016-ter-2 | Verifica: la suite magic bytes copre tutti i 13 scenari obbligatori. | Comando: npx jest __tests__/magic-bytes-validation.test.ts --runInBand | Stato iniziale: OPEN
- G-016-ter-3 | Verifica: validateAttachmentFile rispetta l'ordine MIME whitelist, estensione whitelist, magic bytes. | Comando: verifica manuale su src/lib/supabase/storage.ts | Stato iniziale: OPEN
- G-016-ter-4 | Verifica: le piattaforme non supportate falliscono in modo chiuso e throw-safe. | Comando: verifica manuale su src/lib/file-system/magic-bytes-reader.ts | Stato iniziale: OPEN
G-016-ter-5 | Verifica: supporto iOS, HEIC/WEBP e bridge nativo Windows sono esclusi da questo piano. | Comando: verifica manuale su src/lib/file-system/ e src/lib/supabase/storage.ts | Stato iniziale: OPEN

## 8. Rollback

- src/lib/file-system/magic-bytes-reader.ts: eliminare il file se lo stub e l'helper non superano i gate.
- src/lib/file-system/magic-bytes-reader.android.ts: eliminare il file se l'implementazione Android non supera i gate.
- src/lib/file-system/magic-bytes-reader.windows.ts: eliminare il file se l'implementazione Windows non supera i gate.
- src/lib/supabase/storage.ts: ripristinare validateAttachmentFile allo stato pre-magic-bytes.
- __tests__/magic-bytes-validation.test.ts: eliminare la spec placeholder o implementata se il piano viene sospeso.

## 9. Riferimenti

- docs/2-projects/016-ter-DESIGN_magic-bytes-validation_v0.1.0.md
- docs/4-todo-lists/016-ter-TODO_magic-bytes-validation_v0.1.0.md
- docs/3-coding-plans/016-PLAN_allegati-transazioni_v0.1.0.md
- docs/3-coding-plans/016-bis-PLAN_cleanup-orfani-storage_v0.1.0.md
- src/lib/file-system/magic-bytes-reader.ts
- src/lib/file-system/magic-bytes-reader.android.ts
- src/lib/file-system/magic-bytes-reader.windows.ts
- src/lib/supabase/storage.ts
- __tests__/magic-bytes-validation.test.ts