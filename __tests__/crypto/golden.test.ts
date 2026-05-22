/**
 * Golden Vectors — crypto.ts (PLAN 005)
 *
 * Vettori di riferimento bit-perfect per la sostituzione di crypto.subtle
 * con @noble/ciphers. I valori hardcoded di seguito provengono dal DESIGN
 * 005 §5 e dal PLAN 005 §3.2.
 *
 *   G1: cifratura ASCII deterministica con IV fisso.
 *   G2: cifratura Unicode deterministica con IV fisso.
 *   G3: decifratura inversa del Base64 di G1.
 *
 * NOTA: gli IV fissi sono ammessi ESCLUSIVAMENTE in questo file di test.
 * In produzione ogni IV deve essere generato con crypto.getRandomValues.
 * Riferimento: DESIGN 005 §5 "Nota critica sull'uso degli IV deterministici"
 * e PLAN 005 §10 V7.
 *
 * NON modificare i valori Base64 hardcoded senza ricalcolo offline
 * documentato.
 */

import { encryptData, decryptData } from '@/lib/crypto';

// V11: tsconfig non modificabile. Dichiarazione ambient locale per crypto
// globale (Node WebCrypto + polyfill RN). Non altera il runtime.
declare const crypto: {
  getRandomValues<T extends ArrayBufferView | null>(array: T): T;
};

const hexToBytes = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0) {
    throw new Error(`hexToBytes: stringa hex di lunghezza dispari: "${hex}"`);
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};

describe('Golden Vectors — crypto.ts (PLAN 005)', () => {
  let spy: jest.SpyInstance | undefined;

  afterEach(() => {
    if (spy) {
      spy.mockRestore();
      spy = undefined;
    }
  });

  test('G1 — encryptData("ciao", "testkey") con IV fisso produce il Base64 atteso', async () => {
    const iv = hexToBytes('000000000000000000000001');

    spy = jest
      .spyOn(crypto, 'getRandomValues')
      .mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
        if (array && ArrayBuffer.isView(array)) {
          const u8 = new Uint8Array(
            array.buffer,
            array.byteOffset,
            array.byteLength,
          );
          u8.set(iv.subarray(0, u8.length));
        }
        return array;
      });

    const result = await encryptData('ciao', 'testkey');
    expect(result).toBe('AAAAAAAAAAAAAAABISANl2PDhDno5kCjLeQlUbd7CRo=');
  });

  test('G2 — encryptData con Unicode e IV fisso produce il Base64 atteso', async () => {
    const iv = hexToBytes('0f1e2d3c4b5a69788796a5b4');

    spy = jest
      .spyOn(crypto, 'getRandomValues')
      .mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
        if (array && ArrayBuffer.isView(array)) {
          const u8 = new Uint8Array(
            array.buffer,
            array.byteOffset,
            array.byteLength,
          );
          u8.set(iv.subarray(0, u8.length));
        }
        return array;
      });

    const result = await encryptData(
      'prezzo: 10,99€ — nota speciale',
      'mysecretkey2026!',
    );
    expect(result).toBe(
      'Dx4tPEtaaXiHlqW0qBWeSTgueeBK8EEb+LdvPBzW6Pkddholq67CoFJgFMs4wJOxtTblft7zrE1mvvsCpAw=',
    );
  });

  test('G3 — decryptData del Base64 di G1 con "testkey" restituisce "ciao"', async () => {
    const payload = 'AAAAAAAAAAAAAAABISANl2PDhDno5kCjLeQlUbd7CRo=';
    const result = await decryptData(payload, 'testkey');
    expect(result).toBe('ciao');
  });
});
