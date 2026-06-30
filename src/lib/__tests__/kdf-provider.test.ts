let mockPbkdf2Sync = jest.fn();
let mockShouldThrowQuickCrypto = false;

// Hoisted mock for react-native-quick-crypto using getters to dynamically throw or return the mock function
jest.mock('react-native-quick-crypto', () => {
  return {
    get pbkdf2Sync() {
      if (mockShouldThrowQuickCrypto) {
        throw new Error('react-native-quick-crypto not available');
      }
      return mockPbkdf2Sync;
    },
    get default() {
      if (mockShouldThrowQuickCrypto) {
        throw new Error('react-native-quick-crypto not available');
      }
      return {
        pbkdf2Sync: mockPbkdf2Sync,
      };
    }
  };
}, { virtual: true });

const nodeCrypto: any = require('crypto');
let derivePbkdf2Sha256: any;

describe('KDF Provider', () => {
  beforeAll(() => {
    jest.doMock('react-native-quick-crypto', () => {
      return {
        get pbkdf2Sync() {
          if (mockShouldThrowQuickCrypto) {
            throw new Error('react-native-quick-crypto not available');
          }
          return mockPbkdf2Sync;
        },
        get default() {
          if (mockShouldThrowQuickCrypto) {
            throw new Error('react-native-quick-crypto not available');
          }
          return {
            pbkdf2Sync: mockPbkdf2Sync,
          };
        }
      };
    }, { virtual: true });
    derivePbkdf2Sha256 = require('../kdf-provider').derivePbkdf2Sha256;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldThrowQuickCrypto = false;
  });

  // --- CASI NORMALI ---

  test('should use react-native-quick-crypto when available', () => {
    mockShouldThrowQuickCrypto = false;
    mockPbkdf2Sync.mockReturnValue(new Uint8Array([1, 2, 3]));

    const pin = '1234';
    const salt = new Uint8Array([9, 8, 7]);
    const iterations = 1000;
    const keyLength = 3;

    const result = derivePbkdf2Sha256(pin, salt, iterations, keyLength);

    expect(mockPbkdf2Sync).toHaveBeenCalledWith(pin, salt, iterations, keyLength, 'sha256');
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
  });

  test('should fall back to node crypto when react-native-quick-crypto is not available', () => {
    mockShouldThrowQuickCrypto = true;
    const spyNodePbkdf2Sync = jest.spyOn(nodeCrypto, 'pbkdf2Sync').mockReturnValue(new Uint8Array([4, 5, 6]) as any);

    const pin = '1234';
    const salt = new Uint8Array([9, 8, 7]);
    const iterations = 1000;
    const keyLength = 3;

    const result = derivePbkdf2Sha256(pin, salt, iterations, keyLength);

    expect(spyNodePbkdf2Sync).toHaveBeenCalledWith(pin, salt, iterations, keyLength, 'sha256');
    expect(result).toEqual(new Uint8Array([4, 5, 6]));

    spyNodePbkdf2Sync.mockRestore();
  });

  test('Caso 1: Derivazione corretta SHA-256 (derivePbkdf2Sha256) - standard output deterministico', () => {
    mockShouldThrowQuickCrypto = true;

    const pin = '1234';
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const iterations = 10;
    const keyLength = 16;

    const result1 = derivePbkdf2Sha256(pin, salt, iterations, keyLength);
    const result2 = derivePbkdf2Sha256(pin, salt, iterations, keyLength);

    expect(result1).toBeInstanceOf(Uint8Array);
    expect(result1.length).toBe(16);
    expect(result1).toEqual(result2);
  });

  // --- CASI LIMITE ---

  test('Valore di iterazioni minimo (iterations = 1)', () => {
    mockShouldThrowQuickCrypto = true;

    const pin = '1234';
    const salt = new Uint8Array([1, 2, 3, 4]);
    const result = derivePbkdf2Sha256(pin, salt, 1, 16);
    expect(result.length).toBe(16);
  });

  test('Lunghezza della chiave nulla (keyLength = 0)', () => {
    mockShouldThrowQuickCrypto = true;

    const pin = '1234';
    const salt = new Uint8Array([1, 2, 3, 4]);
    const result = derivePbkdf2Sha256(pin, salt, 10, 0);
    expect(result.length).toBe(0);
    expect(result).toEqual(new Uint8Array(0));
  });

  test('PIN o Salt vuoti', () => {
    mockShouldThrowQuickCrypto = true;

    const result = derivePbkdf2Sha256('', new Uint8Array(0), 10, 16);
    expect(result.length).toBe(16);
  });

  // --- CASI DI ERRORE ---

  test('Assenza di librerie crittografiche disponibili', () => {
    mockShouldThrowQuickCrypto = true;
    const spyNodePbkdf2Sync = jest.spyOn(nodeCrypto, 'pbkdf2Sync').mockImplementation(() => {
      throw new Error('crypto not found');
    });

    expect(() => {
      derivePbkdf2Sha256('1234', new Uint8Array([1]), 10, 16);
    }).toThrow();

    spyNodePbkdf2Sync.mockRestore();
  });

  test('Valori numerici negativi (iterations o keyLength negativi)', () => {
    mockShouldThrowQuickCrypto = true;

    expect(() => {
      derivePbkdf2Sha256('1234', new Uint8Array([1]), -10, 16);
    }).toThrow();

    expect(() => {
      derivePbkdf2Sha256('1234', new Uint8Array([1]), 10, -16);
    }).toThrow();
  });
});
