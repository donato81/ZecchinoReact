---
titolo: TODO 016-ter - Magic Bytes Validation
versione: 0.1.0
data: 2026-05-28
stato: PENDING
piano_riferimento: docs/3-coding-plans/016-ter-PLAN_magic-bytes-validation_v0.1.0.md
design_riferimento: docs/2-projects/016-ter-DESIGN_magic-bytes-validation_v0.1.0.md
autore: Agent-Orchestrator
---

# TODO 016-ter - Magic Bytes Validation

## 1. Stato e Gate Bloccante

- Gate bloccante: PLAN 016 completato e convalidato.
- Stato corrente: PENDING

## 2. Stato Task (panoramica)

| ID task | Titolo | Stato | Note |
| --- | --- | --- | --- |
| T1 | Creare reader stub e helper | TODO | Fail-closed, throw-safe |
| T2 | Creare reader Android | TODO | expo-file-system, 8 byte |
| T3 | Creare reader Windows | TODO | JS-first |
| T4 | Integrare magic bytes in storage | TODO | Ordine validazione fisso |
| T5 | Creare test magic bytes | TODO | 13 scenari obbligatori |

## 3. Task Atomici

### T1
- Azione: Creare il reader stub throw-safe per piattaforme non supportate con ritorno Uint8Array(0) e helper matchesSignature.
- File target: src/lib/file-system/magic-bytes-reader.ts
- Dipende da: nessuno
- Metrica di successo: i test dimostrano che readFileHeader non propaga eccezioni e matchesSignature ritorna false per array vuoti o header troncati.
- Task Status: [ ] TODO

### T2
- Azione: Creare il reader Android che legge i primi 8 byte via expo-file-system.
- File target: src/lib/file-system/magic-bytes-reader.android.ts
- Dipende da: T1
- Metrica di successo: i test dimostrano che un file con firme JPEG, PNG e PDF valide viene accettato sul reader Android.
- Task Status: [ ] TODO

### T3
- Azione: Creare il reader Windows con approccio JS-first e stesso contratto API del reader Android.
- File target: src/lib/file-system/magic-bytes-reader.windows.ts
- Dipende da: T1
- Metrica di successo: i test dimostrano che un file con firme JPEG, PNG e PDF valide viene accettato sul reader Windows.
- Task Status: [ ] TODO

### T4
- Azione: Integrare la validazione magic bytes in validateAttachmentFile rispettando l'ordine MIME whitelist, estensione whitelist e controllo firme.
- File target: src/lib/supabase/storage.ts
- Dipende da: T1, T2, T3
- Metrica di successo: i test dimostrano rifiuto per spoofing, file troncati, file vuoti e piattaforme non supportate senza avviare l'upload.
- Task Status: [ ] TODO

### T5
- Azione: Creare la suite di test architetturali per magic bytes validation.
- File target: __tests__/magic-bytes-validation.test.ts
- Dipende da: T1, T2, T3, T4
- Metrica di successo: npx jest __tests__/magic-bytes-validation.test.ts --runInBand termina con exit code 0 quando il controllo magic bytes e implementato.
- Task Status: [ ] TODO

## 4. Note Operative

- L'ordine di validazione e fisso: MIME whitelist, estensione whitelist, magic bytes.
- L'estensione determina la firma attesa; il MIME e controllo secondario.
- Se readFileHeader non e disponibile o fallisce, il comportamento deve essere fail-closed e throw-safe.
- I file con firma parziale non sono mai validi.
- iOS, HEIC/WEBP e bridge nativo Windows restano fuori dal perimetro.

## 5. Log di Validazione

| Data | Task ID | Validato Da | Risultato | Note |
| --- | --- | --- | --- | --- |

## 6. Gate di Chiusura

- G-016-ter-1 | Verifica: reader stub, Android, Windows e integrazione storage compilano senza errori. | Comando: npx tsc --noEmit | Gate Status: [ ] OPEN
- G-016-ter-2 | Verifica: la suite magic bytes copre tutti i 13 scenari obbligatori. | Comando: npx jest __tests__/magic-bytes-validation.test.ts --runInBand | Gate Status: [ ] OPEN
- G-016-ter-3 | Verifica: validateAttachmentFile rispetta l'ordine MIME whitelist, estensione whitelist, magic bytes. | Comando: verifica manuale su src/lib/supabase/storage.ts | Gate Status: [ ] OPEN
- G-016-ter-4 | Verifica: le piattaforme non supportate falliscono in modo chiuso e throw-safe. | Comando: verifica manuale su src/lib/file-system/magic-bytes-reader.ts | Gate Status: [ ] OPEN
- G-016-ter-5 | Verifica: supporto iOS, HEIC/WEBP e bridge nativo Windows restano fuori perimetro. | Comando: verifica manuale su src/lib/file-system/ e src/lib/supabase/storage.ts | Gate Status: [ ] OPEN

## 7. Riferimenti

- docs/3-coding-plans/016-ter-PLAN_magic-bytes-validation_v0.1.0.md
- docs/2-projects/016-ter-DESIGN_magic-bytes-validation_v0.1.0.md
- docs/3-coding-plans/016-PLAN_allegati-transazioni_v0.1.0.md
- docs/3-coding-plans/016-bis-PLAN_cleanup-orfani-storage_v0.1.0.md
- src/lib/file-system/magic-bytes-reader.ts
- src/lib/file-system/magic-bytes-reader.android.ts
- src/lib/file-system/magic-bytes-reader.windows.ts
- src/lib/supabase/storage.ts
- __tests__/magic-bytes-validation.test.ts