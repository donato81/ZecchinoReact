/**
 * Round-trip, errori e API contract — crypto.ts (PLAN 005)
 *
 * Casi (vedi PLAN 005 §3.6):
 *   R1: round-trip plaintext → cipher → plaintext.
 *   E1: chiave errata in decifratura → errore atteso.
 *   E2: byte manomesso (pos >= 12, area ciphertext/tag) → errore atteso.
 *   E3: payload troncato sotto la lunghezza minima (< 28) → errore atteso.
 *   A1: il valore restituito da encryptData e' una Promise.
 *   S1: due cifrature dello stesso input producono Base64 diversi (IV random).
 */

import { encryptData, decryptData } from '@/lib/crypto';

// V11: tsconfig non modificabile. atob/btoa esistono a runtime
// (Node 20+, Hermes 0.82+); le dichiariamo qui in ambito locale.
declare const atob: (s: string) => string;
declare const btoa: (s: string) => string;

describe('encrypt/decrypt — crypto.ts (PLAN 005)', () => {
  const KEY = 'mysecretkey2026!';

  test('R1 — round-trip plaintext → ciphertext → plaintext', async () => {
    const plain = 'dato sensibile — utente@dominio.it';
    const cipher = await encryptData(plain, KEY);
    expect(typeof cipher).toBe('string');
    const back = await decryptData(cipher, KEY);
    expect(back).toBe(plain);
  });

  test('E1 — chiave errata in decifratura genera errore', async () => {
    const cipher = await encryptData('payload riservato', KEY);
    await expect(decryptData(cipher, 'wrong-key-xyz')).rejects.toThrow(
      /Decryption failed: authentication tag mismatch/,
    );
  });

  test('E2 — byte manomesso nel ciphertext genera errore', async () => {
    const cipher = await encryptData('payload integro', KEY);
    const raw = Uint8Array.from(atob(cipher), (c: string) => c.charCodeAt(0));
    // Posizione 12 = primo byte ciphertext (subito dopo IV[0..11]).
    raw[12] = raw[12] ^ 0x01;
    const tampered = btoa(String.fromCharCode(...raw));

    await expect(decryptData(tampered, KEY)).rejects.toThrow(
      /Decryption failed: authentication tag mismatch/,
    );
  });

  test('E3 — payload troncato sotto la soglia minima genera errore', async () => {
    // 20 byte < 28 minimo (IV 12 + TAG 16).
    const tooShort = btoa(String.fromCharCode(...new Uint8Array(20)));

    await expect(decryptData(tooShort, KEY)).rejects.toThrow(
      /Decryption failed: authentication tag mismatch/,
    );
  });

  test('A1 — encryptData restituisce una Promise (API contract preservata)', () => {
    const result = encryptData('check api', KEY);
    expect(result).toBeInstanceOf(Promise);
    return expect(result).resolves.toEqual(expect.any(String));
  });

  test('S1 — due cifrature dello stesso input producono Base64 diversi', async () => {
    const plain = 'identico';
    const c1 = await encryptData(plain, KEY);
    const c2 = await encryptData(plain, KEY);
    expect(c1).not.toBe(c2);
    expect(await decryptData(c1, KEY)).toBe(plain);
    expect(await decryptData(c2, KEY)).toBe(plain);
  });
});
