'use strict';

// =============================================================================
// docs/scripts/generate-golden-vectors.js
//
// Script offline per il calcolo dei golden vectors K1, K2, K3 da
// hardcodare in __tests__/crypto/kdf.test.ts
// Riferimento: PLAN 006 v1.1.0 §9.2, DESIGN 006 §8
//
// PREREQUISITI:
//   - PLAN 005 implementato: @noble/ciphers installata
//     (npm install dopo Fase 1 di PLAN 005)
//   - @noble/hashes installata (npm install dopo Fase 1 di PLAN 006)
//   - PLAN 006 Fase 0 completata: PBKDF2_ITERATIONS calibrato e
//     sostituito al valore undefined qui sotto
//   - Node.js >= 20 (TextEncoder/TextDecoder globali disponibili)
//
// ESECUZIONE:
//   node docs/scripts/generate-golden-vectors.js
//
// OUTPUT: stampa in console i valori hex/Base64 dei vettori K1, K2, K3.
//         NON genera file automaticamente. I valori devono essere copiati
//         manualmente come costanti in __tests__/crypto/kdf.test.ts.
//
// ANALISI DI src/lib/crypto.ts (2026-05-22):
//   - encryptData e decryptData usano ancora crypto.subtle
//     (PLAN 005 non ancora implementato alla data di creazione di questo script)
//   - Il payload corrente è Base64(IV[12] | CT+Tag[N+16]) — DESIGN 005 non implementato
//   - derivePinKey NON è presente in crypto.ts; questo script la implementa
//     localmente in modo indipendente per evitare falsi positivi crittografici
//   - La KDF attuale in crypto.ts è un padding/troncatura naïf (padEnd+slice),
//     non una KDF crittografica
//   - hashPin / verifyPin usano bcryptjs (INVARIATE, fuori perimetro)
//   - @noble/ciphers e @noble/hashes NON ancora in package.json alla data
//     di creazione di questo script → il file passa node --check ma non è
//     eseguibile fino all'installazione delle dipendenze (post-PLAN 005 Fase 1
//     e post-PLAN 006 Fase 1)
// =============================================================================

// =============================================================================
// NOTA ANTI-DRIFT
//
// La funzione derivePinKey definita in questo file replica la logica che
// sarà presente in src/lib/crypto.ts dopo l'implementazione di PLAN 006.
// Se derivePinKey in crypto.ts cambia (algoritmo, dkLen, numero iterazioni,
// funzione pseudo-casuale), aggiornare contestualmente questo script.
// Il mancato aggiornamento produce vettori K1/K2/K3 silenziosamente
// disallineati dall'implementazione reale, rendendo la test suite
// kdf.test.ts un golden test auto-consistente ma semanticamente errato.
// =============================================================================

// =============================================================================
// FREEZE VETTORI
//
// Una volta eseguito questo script e copiati i valori hex/Base64 in
// kdf.test.ts, i valori K1, K2, K3 NON devono essere rigenerati senza
// una review crittografica esplicita.
// Qualsiasi modifica successiva ai vettori non è manutenzione ordinaria:
// richiede documentazione della motivazione (es. cambio algoritmo, cambio
// parametri PBKDF2, correzione di un errore verificato) e aggiornamento
// del CHANGELOG.
// =============================================================================

// =============================================================================
// PASSO 0 — PBKDF2_ITERATIONS (BLOCCANTE)
//
// Sostituire undefined con il valore calibrato dal benchmark di Fase 0
// di PLAN 006 §2. Il valore deve essere >= 100.000 (OWASP floor invalicabile).
// Riferimento: docs/3-coding-plans/006-PLAN_kdf-pin_v1.1.0.md §2.4.1
// =============================================================================

const PBKDF2_ITERATIONS = 600000;

if (!PBKDF2_ITERATIONS) {
  console.error(
    '[ERRORE] PBKDF2_ITERATIONS non è stato definito.\n' +
    'Completare prima il benchmark di Fase 0 (PLAN 006 §2) e sostituire\n' +
    '"undefined" con il valore calibrato (vincolo invalicabile: >= 100.000\n' +
    'iterazioni, OWASP floor per PBKDF2-SHA256 contro attacchi offline GPU).\n' +
    'Riferimento: docs/3-coding-plans/006-PLAN_kdf-pin_v1.1.0.md §2.4.1'
  );
  process.exit(1);
}

// =============================================================================
// COSTANTI
// =============================================================================

const SALT_LEN    = 16;  // byte — dimensione salt PBKDF2 (DESIGN 006 §5)
const IV_LEN      = 12;  // byte — nonce AES-GCM (DESIGN 005 §4)
const TAG_LEN     = 16;  // byte — auth tag AES-GCM (DESIGN 005 §4)
const KDF_VERSION = 0x01; // DESIGN 006 §6: PBKDF2-SHA256 con parametri correnti
const DK_LEN      = 32;  // byte — chiave AES-256 (DESIGN 006 §4)

// =============================================================================
// FUNZIONI DI UTILITÀ
// =============================================================================

const hexToBytes = (hex) => {
  if (hex.length % 2 !== 0) {
    throw new Error(
      'hexToBytes: stringa hex di lunghezza dispari — "' + hex + '"'
    );
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

const bytesToHex = (bytes) => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// =============================================================================
// derivePinKey — implementazione locale indipendente da src/lib/crypto.ts
// (vedi NOTA ANTI-DRIFT sopra)
// =============================================================================

function derivePinKey(pin, salt) {
  const { pbkdf2 } = require('@noble/hashes/pbkdf2');
  const { sha256 } = require('@noble/hashes/sha256');
  const pinBytes = new TextEncoder().encode(pin);
  return pbkdf2(sha256, pinBytes, salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: DK_LEN,
  });
}

// =============================================================================
// K1 — Idempotenza della derivazione
// PIN '1234', salt 00112233445566778899aabbccddeeff
// Invocare derivePinKey due volte con gli stessi input; i due output
// devono essere identici bit per bit (idempotenza PBKDF2).
// =============================================================================

const SALT_HEX_K1 = '00112233445566778899aabbccddeeff';
const k1Salt = hexToBytes(SALT_HEX_K1);
if (k1Salt.length !== SALT_LEN) {
  throw new Error('K1: lunghezza salt errata dopo conversione hex→bytes: ' +
    'attesi ' + SALT_LEN + ' byte, ottenuti ' + k1Salt.length);
}

const k1KeyA = derivePinKey('1234', k1Salt);
const k1KeyB = derivePinKey('1234', k1Salt);
const k1IdempotentOk = bytesToHex(k1KeyA) === bytesToHex(k1KeyB);

// =============================================================================
// K2 — Isolamento del salt
// PIN '1234', saltA = K1 salt, saltB = ffeeddccbbaa99887766554433221100
// Le due chiavi derivate devono essere diverse (isolamento del salt).
// =============================================================================

const SALT_A_HEX_K2 = '00112233445566778899aabbccddeeff';
const SALT_B_HEX_K2 = 'ffeeddccbbaa99887766554433221100';

const k2SaltA = hexToBytes(SALT_A_HEX_K2);
const k2SaltB = hexToBytes(SALT_B_HEX_K2);

if (k2SaltA.length !== SALT_LEN) {
  throw new Error('K2: lunghezza saltA errata dopo conversione hex→bytes: ' +
    'attesi ' + SALT_LEN + ' byte, ottenuti ' + k2SaltA.length);
}
if (k2SaltB.length !== SALT_LEN) {
  throw new Error('K2: lunghezza saltB errata dopo conversione hex→bytes: ' +
    'attesi ' + SALT_LEN + ' byte, ottenuti ' + k2SaltB.length);
}

const k2KeyA = derivePinKey('1234', k2SaltA);
const k2KeyB = derivePinKey('1234', k2SaltB);

// CONFRONTO K2 BYTE-PER-BYTE tramite bytesToHex.
// NON usare === su Uint8Array: confronta riferimenti di oggetto, non contenuto.
const k2IsolationOk = bytesToHex(k2KeyA) !== bytesToHex(k2KeyB);

// =============================================================================
// K3 — Pipeline completa PIN → AES-GCM → decifratura
// PIN '9876', salt fisso, IV fisso, plaintext 'segreto privato'
// Formato buffer: [KDF_VERSION(1)] [SALT(16)] [IV(12)] [CT(N)] [TAG(16)]
// (CT e TAG sono contigui: gcm.encrypt restituisce CT||TAG concatenati)
//
// IV FISSO: accettabile ESCLUSIVAMENTE per golden vectors deterministici
// di test. MAI riutilizzare un IV fisso in produzione. In produzione ogni
// IV deve essere generato con crypto.getRandomValues(new Uint8Array(12)).
// Riferimento: DESIGN 005 §5 "Nota critica sull'uso degli IV deterministici"
// =============================================================================

const SALT_HEX_K3 = '0102030405060708090a0b0c0d0e0f10';
const IV_HEX_K3   = 'aabbccddeeff112233445566';

const k3Salt = hexToBytes(SALT_HEX_K3);
const k3IV   = hexToBytes(IV_HEX_K3);

if (k3Salt.length !== SALT_LEN) {
  throw new Error('K3: lunghezza salt errata dopo conversione hex→bytes: ' +
    'attesi ' + SALT_LEN + ' byte, ottenuti ' + k3Salt.length);
}
if (k3IV.length !== IV_LEN) {
  throw new Error('K3: lunghezza IV errata dopo conversione hex→bytes: ' +
    'attesi ' + IV_LEN + ' byte, ottenuti ' + k3IV.length);
}

const k3PlaintextBytes = new TextEncoder().encode('segreto privato');

const { gcm } = require('@noble/ciphers/aes');

// Cifratura: gcm(key, iv).encrypt(plaintext) restituisce CT||TAG (N+16 byte)
const k3Key       = derivePinKey('9876', k3Salt);
const k3CtWithTag = gcm(k3Key, k3IV).encrypt(k3PlaintextBytes);

// Costruzione buffer: [KDF_VERSION(1)] [SALT(16)] [IV(12)] [CT+TAG(N+16)]
const k3TotalLen = 1 + SALT_LEN + IV_LEN + k3CtWithTag.length;
const k3Buffer   = new Uint8Array(k3TotalLen);

// SERIALIZZAZIONE KDF_VERSION: UInt8, 1 byte esatto — non Int8, non Uint16
k3Buffer[0] = KDF_VERSION;
k3Buffer.set(k3Salt, 1);
k3Buffer.set(k3IV, 1 + SALT_LEN);
k3Buffer.set(k3CtWithTag, 1 + SALT_LEN + IV_LEN);

const k3PayloadBase64 = Buffer.from(k3Buffer).toString('base64');

// Decifratura round-trip: verifica che il plaintext si recuperi dal buffer
const k3BufferDecoded  = Buffer.from(k3PayloadBase64, 'base64');
const k3Version        = k3BufferDecoded[0];
const k3SaltExtracted  = k3BufferDecoded.subarray(1, 1 + SALT_LEN);
const k3IVExtracted    = k3BufferDecoded.subarray(1 + SALT_LEN, 1 + SALT_LEN + IV_LEN);
const k3CtExtracted    = k3BufferDecoded.subarray(1 + SALT_LEN + IV_LEN);

const k3KeyDecrypt = derivePinKey('9876', k3SaltExtracted);
const k3Decrypted  = new TextDecoder().decode(
  gcm(k3KeyDecrypt, k3IVExtracted).decrypt(k3CtExtracted)
);

const k3RoundTripOk = k3Decrypted === 'segreto privato';

// =============================================================================
// OUTPUT
// =============================================================================

console.log('=== GOLDEN VECTORS K1/K2/K3 ===');
console.log('');
console.log('K1 — chiave derivata (hex):', bytesToHex(k1KeyA));
console.log('K1 — idempotenza (2 invocazioni identiche):', k1IdempotentOk);
console.log('');
console.log('K2 — keyA (hex):', bytesToHex(k2KeyA));
console.log('K2 — keyB (hex):', bytesToHex(k2KeyB));
console.log('K2 — keyA !== keyB (isolamento salt):', k2IsolationOk);
console.log('');
console.log('K3 — payload Base64:', k3PayloadBase64);
console.log('K3 — plaintext recuperato:', k3Decrypted);
console.log('K3 — round-trip OK:', k3RoundTripOk);
console.log('K3 — KDF_VERSION nel buffer: 0x' + k3Version.toString(16).padStart(2, '0').toUpperCase());
console.log('');
console.log('--- PROSSIMO PASSO ---');
console.log('Copiare i valori sopra come costanti in __tests__/crypto/kdf.test.ts.');
console.log('NON rieseguire questo script dopo il freeze dei vettori.');
console.log('Riferimento: PLAN 006 v1.1.0 §9.2 (sequenza freeze, passi 4-6).');
