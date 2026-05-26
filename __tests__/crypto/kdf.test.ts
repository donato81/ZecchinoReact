import { decryptDataPin, derivePinKey, encryptDataPin } from '@/lib/crypto';

declare const crypto: {
  getRandomValues<T extends ArrayBufferView | null>(array: T): T;
};

const K1_EXPECTED_HEX =
  '91d8c5ee08baa388beb6a7a3dc28f7954545651efef819d00cfe5fea3e8c217c';
const K2_EXPECTED_HEX =
  '780a2ad7b301f8374f5feeaa1b8bf05670f0d65a7e06984051f2950c8a96e9b1';
const K3_EXPECTED_BASE64 =
  'AQECAwQFBgcICQoLDA0ODxCqu8zd7v8RIjNEVWZiI2RBi9CblXScUyUV3K3A3clD74l47pq18yGVu5GQ';

const hexToBytes = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0) {
    throw new Error(`hexToBytes: stringa hex di lunghezza dispari: "${hex}"`);
  }

  const out = new Uint8Array(hex.length / 2);
  for (let index = 0; index < out.length; index++) {
    out[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return out;
};

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');

const base64ToBytes = (data: string): Uint8Array =>
  Uint8Array.from(atob(data), (char: string) => char.charCodeAt(0));

describe('KDF vectors — crypto.ts (PLAN 006)', () => {
  let spy: jest.SpyInstance | undefined;

  afterEach(() => {
    if (spy) {
      spy.mockRestore();
      spy = undefined;
    }
  });

  test('K1 — stessa coppia PIN/salt produce sempre la stessa chiave hardcoded', () => {
    const salt = hexToBytes('00112233445566778899aabbccddeeff');

    const first = derivePinKey('1234', salt);
    const second = derivePinKey('1234', salt);

    expect(bytesToHex(first)).toBe(K1_EXPECTED_HEX);
    expect(bytesToHex(second)).toBe(K1_EXPECTED_HEX);
    expect(bytesToHex(second)).toBe(bytesToHex(first));
  });

  test('K2 — stesso PIN con salt diversi produce chiavi diverse e hardcoded', () => {
    const saltA = hexToBytes('00112233445566778899aabbccddeeff');
    const saltB = hexToBytes('ffeeddccbbaa99887766554433221100');

    const keyA = derivePinKey('1234', saltA);
    const keyB = derivePinKey('1234', saltB);

    expect(bytesToHex(keyA)).toBe(K1_EXPECTED_HEX);
    expect(bytesToHex(keyB)).toBe(K2_EXPECTED_HEX);
    expect(bytesToHex(keyA)).not.toBe(bytesToHex(keyB));
  });

  test('K3 — pipeline completa KDF + AES-GCM con layout payload versionato', async () => {
    const salt = hexToBytes('0102030405060708090a0b0c0d0e0f10');
    const iv = hexToBytes('aabbccddeeff112233445566');
    let callIndex = 0;

    spy = jest
      .spyOn(crypto, 'getRandomValues')
      .mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
        if (array && ArrayBuffer.isView(array)) {
          const target = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
          const source = callIndex === 0 ? salt : iv;
          target.set(source.subarray(0, target.length));
          callIndex += 1;
        }
        return array;
      });

    const payload = await encryptDataPin('segreto privato', '9876');
    expect(payload).toBe(K3_EXPECTED_BASE64);

    const raw = base64ToBytes(payload);
    expect(raw[0]).toBe(0x01);
    expect(bytesToHex(raw.slice(1, 17))).toBe('0102030405060708090a0b0c0d0e0f10');
    expect(bytesToHex(raw.slice(17, 29))).toBe('aabbccddeeff112233445566');
    expect(bytesToHex(raw.slice(29))).toBe('622364418bd09b95749c532515dcadc0ddc943ef8978ee9ab5f32195bb9190');
    await expect(decryptDataPin(payload, '9876')).resolves.toBe('segreto privato');
  });
});