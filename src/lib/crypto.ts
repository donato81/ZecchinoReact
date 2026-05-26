import bcrypt from 'bcryptjs'
import { gcm } from '@noble/ciphers/aes'
import { derivePbkdf2Sha256 } from './kdf-provider'

const PBKDF2_ITERATIONS = 600_000
const KDF_VERSION = 0x01 // UInt8, 1 byte esatto
const SALT_LEN = 16
const IV_LEN = 12
const TAG_LEN = 16

function bytesToBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
}

function base64ToBytes(data: string): Uint8Array {
  return Uint8Array.from(atob(data), (c: string) => c.charCodeAt(0))
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

export function derivePinKey(pin: string, salt: Uint8Array): Uint8Array {
  return derivePbkdf2Sha256(pin, salt, PBKDF2_ITERATIONS, 32)
}

// PLAN 005: AES-256-GCM via @noble/ciphers (pure-JS, Hermes-compatible).
// Payload format (INVARIANTE): Base64( IV[12] || ciphertext[N] || authTag[16] ).
// Derivazione chiave INVARIATA da V1: padEnd('0',32).slice(0,32) UTF-8.
// La debolezza nota della derivazione e' rinviata a PLAN 006 (KDF reale).
export async function encryptData(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32))
  const plaintext = encoder.encode(data)

  // IV random 96-bit. In RN: polyfill caricato in index.js (V5).
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // gcm(...).encrypt() restituisce ciphertext || authTag (16 byte finali).
  const sealed = gcm(keyData, iv).encrypt(plaintext)

  const combined = new Uint8Array(iv.length + sealed.length)
  combined.set(iv, 0)
  combined.set(sealed, iv.length)

  return bytesToBase64(combined)
}

export async function decryptData(encryptedData: string, key: string): Promise<string> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32))

  const combined = base64ToBytes(encryptedData)

  // Payload minimo: IV(12) + TAG(16) = 28 byte. Sotto questa soglia
  // il buffer non puo' essere un payload valido.
  if (combined.length < 28) {
    throw new Error('Decryption failed: authentication tag mismatch')
  }

  const iv = combined.slice(0, 12)
  const sealed = combined.slice(12)

  try {
    const plaintext = gcm(keyData, iv).decrypt(sealed)
    return decoder.decode(plaintext)
  } catch {
    // Normalizzazione: chiave errata, tag manomesso, payload troncato
    // o byte alterati producono tutti lo stesso messaggio uniforme.
    throw new Error('Decryption failed: authentication tag mismatch')
  }
}

export async function encryptDataPin(data: string, pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const plaintext = encoder.encode(data)
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN))
  const key = derivePinKey(pin, salt)
  const sealed = gcm(key, iv).encrypt(plaintext)

  const combined = new Uint8Array(1 + SALT_LEN + IV_LEN + sealed.length)
  combined[0] = KDF_VERSION
  combined.set(salt, 1)
  combined.set(iv, 1 + SALT_LEN)
  combined.set(sealed, 1 + SALT_LEN + IV_LEN)

  return bytesToBase64(combined)
}

export async function decryptDataPin(encryptedData: string, pin: string): Promise<string> {
  const decoder = new TextDecoder()
  const combined = base64ToBytes(encryptedData)

  if (combined.length < 1 + SALT_LEN + IV_LEN + TAG_LEN) {
    throw new Error('Decryption failed: authentication tag mismatch')
  }

  if (combined[0] !== KDF_VERSION) {
    throw new Error(`Unsupported KDF version: ${combined[0]}`)
  }

  const saltStart = 1
  const ivStart = saltStart + SALT_LEN
  const sealedStart = ivStart + IV_LEN

  const salt = combined.slice(saltStart, ivStart)
  const iv = combined.slice(ivStart, sealedStart)
  const sealed = combined.slice(sealedStart)
  const key = derivePinKey(pin, salt)

  try {
    const plaintext = gcm(key, iv).decrypt(sealed)
    return decoder.decode(plaintext)
  } catch {
    throw new Error('Decryption failed: authentication tag mismatch')
  }
}

