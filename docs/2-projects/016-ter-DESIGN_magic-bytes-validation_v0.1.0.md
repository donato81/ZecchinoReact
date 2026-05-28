---
Titolo: DESIGN 016-ter — Magic Bytes Validation
Versione: 0.1.0
Data: 2026-05-28
Stato: APPROVATO E VALIDATO
DipendenzaDiretta: DESIGN 016
DebitoTecnicoOrigine: DT-016-01
IntegrazioneCon: DESIGN 016-bis
DebitiTecniciOriginati: DT-016-ter-01, DT-016-ter-02, DT-016-ter-03
---

# DESIGN 016-ter — Magic Bytes Validation

Sezione 1 — Intestazione e metadati
- Titolo: DESIGN 016-ter — Magic Bytes Validation
- Versione: 0.1.0
- Data: 2026-05-28
- Stato: APPROVATO E VALIDATO
- Dipendenza diretta: DESIGN 016
- Debito tecnico di origine: DT-016-01
- Integrazione con: DESIGN 016-bis
- Debiti tecnici originati: DT-016-ter-01, DT-016-ter-02, DT-016-ter-03

Sezione 2 — Premessa architetturale
La magic bytes validation legge i primi byte del contenuto fisico del file
indipendentemente da nome e tipo dichiarato, fornendo un livello di difesa
contro spoofing banale prima dell'upload.

Sezione 3 — Invarianti architetturali
- Nessuna stringa visibile all'utente o annunciata dallo
	screen reader può essere scritta direttamente nel codice.
	Ogni testo passa obbligatoriamente da src/locales/it.ts.
	Senza eccezioni.
- Hardening euristico: non è antivirus, ma blocca spoofing banale.
- Validazione locale pre-upload; se fallisce, upload non parte.
- Fail-closed su piattaforma non supportata (stub ritorna `Uint8Array(0)`).
- `readFileHeader` è throw-safe: non propaga eccezioni verso il chiamante.
- L'estensione determina quale firma aspettarsi; MIME è controllo secondario.
- Firma parziale non valida: se i byte letti dal file (header.length) sono inferiori
	alla lunghezza della firma attesa (signature.length), il file viene rifiutato senza
	eccezioni. Non esiste corrispondenza parziale valida. Questa regola è implementata
	nell'helper matchesSignature e non può essere derogata da nessun layer superiore.

Sezione 4 — Decisioni architetturali (11 decisioni)
Decisione 1 — Perimetro: leggere 8 byte, verificare firme JPEG/PNG/PDF, implementazione Android e Windows, stub fallback, 13 test.
Decisione 2 — Firme:
 - JPEG: `FF D8 FF` (3 byte)
 - PNG: `89 50 4E 47 0D 0A 1A 0A` (8 byte)
 - PDF: `25 50 44 46` (4 byte)
 - `MAGIC_BYTES_READ_LENGTH = 8`.
Decisione 3 — Posizione file: creare `src/lib/file-system/` per magic-bytes-reader.
Decisione 4 — File da creare: `magic-bytes-reader.android.ts`, `magic-bytes-reader.windows.ts`, `magic-bytes-reader.ts` (stub), aggiornare `src/lib/supabase/storage.ts` per integrare il controllo 3.
Decisione 5 — Ordine validazione: 1) MIME whitelist, 2) Estensione whitelist (fonte primaria), 3) Magic bytes.
Decisione 6 — Android: `expo-file-system` per leggere base64 dei primi 8 byte.
Decisione 7 — Windows: JS-first, bridge nativo solo se necessario.
Decisione 8 — Helper `matchesSignature(header: Uint8Array, signature: number[]): boolean` obbligatorio.
Decisione 9 — File troncati (header.length < signature.length) → rifiuto.
Decisione 10 — iOS fuori perimetro.
Decisione 11 — Debiti tecnici: HEIC/WEBP, iOS, bridge nativo Windows.

Sezione 5 — Test architetturali obbligatori (13 test)
- TEST 1 — JPEG valido: file con firma FF D8 FF passa la
	validazione su Android e Windows.
- TEST 2 — PNG valido: file con firma 89 50 4E 47 0D 0A
	1A 0A passa la validazione.
- TEST 3 — PDF valido: file con firma 25 50 44 46 passa
	la validazione.
- TEST 4 — Spoofing JPEG: file rinominato .jpg con firma
	PNG nei primi byte viene rifiutato.
- TEST 5 — Spoofing PDF: file rinominato .pdf con firma
	JPEG nei primi byte viene rifiutato.
- TEST 6 — Spoofing PNG: file rinominato .png con firma
	PDF nei primi byte viene rifiutato.
- TEST 7 — File troncato: file con meno di 8 byte viene
	rifiutato (firma parziale non valida).
- TEST 8 — File vuoto: file con 0 byte viene rifiutato.
- TEST 9 — Piattaforma non supportata (stub): readFileHeader
	ritorna Uint8Array(0) e il file viene rifiutato senza
	propagare eccezioni.
- TEST 10 — readFileHeader throw-safe: eccezione interna
	non si propaga al chiamante, ritorna Uint8Array(0).
- TEST 11 — Cortocircuito ordine: MIME whitelist verificata
	prima di magic bytes (fallimento MIME non arriva
	a leggere i byte).
- TEST 12 — matchesSignature con array vuoto: ritorna false
	senza errori.
- TEST 13 — Estensione come fonte primaria: .jpg con MIME
	image/png ma firma JPEG nei byte viene rifiutato
	(l'estensione determina la firma attesa, non il MIME).
