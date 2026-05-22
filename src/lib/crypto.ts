import bcrypt from 'bcryptjs'
import { gcm } from '@noble/ciphers/aes'

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
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

  return btoa(String.fromCharCode(...combined))
}

export async function decryptData(encryptedData: string, key: string): Promise<string> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32))

  const combined = Uint8Array.from(atob(encryptedData), (c: string) => c.charCodeAt(0))

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

