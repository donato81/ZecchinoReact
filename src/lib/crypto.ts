import bcrypt from 'bcryptjs';
import { gcm } from '@noble/ciphers/aes';
import { derivePbkdf2Sha256 } from './kdf-provider';

const PBKDF2_ITERATIONS = 600_000;
const KDF_VERSION = 0x01; // UInt8, 1 byte esatto
const WRAPPED_MASTER_KEY_VERSION = 1;
const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;
const MASTER_KEY_LEN = 32;

export type WrappedMasterKeyPayload = {
  version: number;
  iv: string;
  ciphertext: string;
  tag: string;
};

export class WrappedMasterKeyPayloadError extends Error {
  readonly code:
    | 'MASTER_KEY_NOT_CONFIGURED'
    | 'MASTER_KEY_PAYLOAD_INVALID'
    | 'MASTER_KEY_UNWRAP_FAILED';

  constructor(
    code:
      | 'MASTER_KEY_NOT_CONFIGURED'
      | 'MASTER_KEY_PAYLOAD_INVALID'
      | 'MASTER_KEY_UNWRAP_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'WrappedMasterKeyPayloadError';
    this.code = code;
  }
}

function bytesToBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}

function base64ToBytes(data: string): Uint8Array {
  return Uint8Array.from(atob(data), (c: string) => c.charCodeAt(0));
}

function isWrappedMasterKeyPayload(
  value: unknown,
): value is WrappedMasterKeyPayload {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === WRAPPED_MASTER_KEY_VERSION &&
    typeof candidate.iv === 'string' &&
    typeof candidate.ciphertext === 'string' &&
    typeof candidate.tag === 'string'
  );
}

function ensureWrappedMasterKeyPayload(
  payload: unknown,
): WrappedMasterKeyPayload {
  if (!isWrappedMasterKeyPayload(payload)) {
    throw new WrappedMasterKeyPayloadError(
      'MASTER_KEY_PAYLOAD_INVALID',
      'Wrapped master key payload is invalid',
    );
  }

  return payload;
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export function derivePinKey(pin: string, salt: Uint8Array): Uint8Array {
  return derivePbkdf2Sha256(pin, salt, PBKDF2_ITERATIONS, 32);
}

export function generatePinSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LEN));
}

export function generateMasterKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(MASTER_KEY_LEN));
}

export function encodeBase64(data: Uint8Array): string {
  return bytesToBase64(data);
}

export function decodeBase64(data: string): Uint8Array {
  return base64ToBytes(data);
}

export function serializeWrappedMasterKeyPayload(
  payload: WrappedMasterKeyPayload,
): string {
  return JSON.stringify(ensureWrappedMasterKeyPayload(payload));
}

export function deserializeWrappedMasterKeyPayload(
  serialized: string | null,
): WrappedMasterKeyPayload | null {
  if (serialized === null) {
    return null;
  }

  try {
    return ensureWrappedMasterKeyPayload(JSON.parse(serialized));
  } catch (error) {
    if (error instanceof WrappedMasterKeyPayloadError) {
      throw error;
    }

    throw new WrappedMasterKeyPayloadError(
      'MASTER_KEY_PAYLOAD_INVALID',
      'Wrapped master key payload is invalid',
    );
  }
}

export function wrapMasterKeyWithPin(
  masterKey: Uint8Array,
  pin: string,
  salt: Uint8Array,
): WrappedMasterKeyPayload {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const sealed = gcm(derivePinKey(pin, salt), iv).encrypt(masterKey);
  const ciphertext = sealed.slice(0, sealed.length - TAG_LEN);
  const tag = sealed.slice(sealed.length - TAG_LEN);

  return {
    version: WRAPPED_MASTER_KEY_VERSION,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
    tag: bytesToBase64(tag),
  };
}

export function unwrapMasterKeyWithPin(
  serializedPayload: string | null,
  pin: string,
  salt: Uint8Array,
): Uint8Array {
  if (serializedPayload === null) {
    throw new WrappedMasterKeyPayloadError(
      'MASTER_KEY_NOT_CONFIGURED',
      'Wrapped master key payload is not configured',
    );
  }

  const payload = deserializeWrappedMasterKeyPayload(serializedPayload);
  if (payload === null) {
    throw new WrappedMasterKeyPayloadError(
      'MASTER_KEY_NOT_CONFIGURED',
      'Wrapped master key payload is not configured',
    );
  }

  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);
  const tag = base64ToBytes(payload.tag);
  const sealed = new Uint8Array(ciphertext.length + tag.length);
  sealed.set(ciphertext, 0);
  sealed.set(tag, ciphertext.length);

  try {
    return gcm(derivePinKey(pin, salt), iv).decrypt(sealed);
  } catch {
    throw new WrappedMasterKeyPayloadError(
      'MASTER_KEY_UNWRAP_FAILED',
      'Wrapped master key could not be decrypted',
    );
  }
}

export function rewrapMasterKeyWithPin(
  serializedPayload: string,
  oldPin: string,
  oldSalt: Uint8Array,
  newPin: string,
  newSalt: Uint8Array,
): string {
  const masterKey = unwrapMasterKeyWithPin(serializedPayload, oldPin, oldSalt);
  return serializeWrappedMasterKeyPayload(
    wrapMasterKeyWithPin(masterKey, newPin, newSalt),
  );
}

// PLAN 005: AES-256-GCM via @noble/ciphers (pure-JS, Hermes-compatible).
// Payload format (INVARIANTE): Base64( IV[12] || ciphertext[N] || authTag[16] ).
// Derivazione chiave INVARIATA da V1: padEnd('0',32).slice(0,32) UTF-8.
// La debolezza nota della derivazione e' rinviata a PLAN 006 (KDF reale).
export async function encryptData(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
  const plaintext = encoder.encode(data);

  // IV random 96-bit. In RN: polyfill caricato in index.js (V5).
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // gcm(...).encrypt() restituisce ciphertext || authTag (16 byte finali).
  const sealed = gcm(keyData, iv).encrypt(plaintext);

  const combined = new Uint8Array(iv.length + sealed.length);
  combined.set(iv, 0);
  combined.set(sealed, iv.length);

  return bytesToBase64(combined);
}

export async function decryptData(
  encryptedData: string,
  key: string,
): Promise<string> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));

  const combined = base64ToBytes(encryptedData);

  // Payload minimo: IV(12) + TAG(16) = 28 byte. Sotto questa soglia
  // il buffer non puo' essere un payload valido.
  if (combined.length < 28) {
    throw new Error('Decryption failed: authentication tag mismatch');
  }

  const iv = combined.slice(0, 12);
  const sealed = combined.slice(12);

  try {
    const plaintext = gcm(keyData, iv).decrypt(sealed);
    return decoder.decode(plaintext);
  } catch {
    // Normalizzazione: chiave errata, tag manomesso, payload troncato
    // o byte alterati producono tutti lo stesso messaggio uniforme.
    throw new Error('Decryption failed: authentication tag mismatch');
  }
}

export async function encryptDataPin(
  data: string,
  pin: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(data);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = derivePinKey(pin, salt);
  const sealed = gcm(key, iv).encrypt(plaintext);

  const combined = new Uint8Array(1 + SALT_LEN + IV_LEN + sealed.length);
  combined[0] = KDF_VERSION;
  combined.set(salt, 1);
  combined.set(iv, 1 + SALT_LEN);
  combined.set(sealed, 1 + SALT_LEN + IV_LEN);

  return bytesToBase64(combined);
}

export async function decryptDataPin(
  encryptedData: string,
  pin: string,
): Promise<string> {
  const decoder = new TextDecoder();
  const combined = base64ToBytes(encryptedData);

  if (combined.length < 1 + SALT_LEN + IV_LEN + TAG_LEN) {
    throw new Error('Decryption failed: authentication tag mismatch');
  }

  if (combined[0] !== KDF_VERSION) {
    throw new Error(`Unsupported KDF version: ${combined[0]}`);
  }

  const saltStart = 1;
  const ivStart = saltStart + SALT_LEN;
  const sealedStart = ivStart + IV_LEN;

  const salt = combined.slice(saltStart, ivStart);
  const iv = combined.slice(ivStart, sealedStart);
  const sealed = combined.slice(sealedStart);
  const key = derivePinKey(pin, salt);

  try {
    const plaintext = gcm(key, iv).decrypt(sealed);
    return decoder.decode(plaintext);
  } catch {
    throw new Error('Decryption failed: authentication tag mismatch');
  }
}
