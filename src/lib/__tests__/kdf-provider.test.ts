describe('KDF Provider', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  // --- CASI NORMALI ---

  test('should use react-native-quick-crypto when available', () => {
    const mockPbkdf2Sync = jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
    jest.doMock('react-native-quick-crypto', () => ({
      default: {
        pbkdf2Sync: mockPbkdf2Sync,
      },
    }), { virtual: true });

    const { derivePbkdf2Sha256 } = require('../kdf-provider');

    const pin = '1234';
    const salt = new Uint8Array([9, 8, 7]);
    const iterations = 1000;
    const keyLength = 3;

    const result = derivePbkdf2Sha256(pin, salt, iterations, keyLength);

    expect(mockPbkdf2Sync).toHaveBeenCalledWith(pin, salt, iterations, keyLength, 'sha256');
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
  });

  test('should fall back to node crypto when react-native-quick-crypto is not available', () => {
    jest.doMock('react-native-quick-crypto', () => {
      throw new Error('Module not found');
    }, { virtual: true });

    const mockNodePbkdf2Sync = jest.fn().mockReturnValue(new Uint8Array([4, 5, 6]));
    jest.doMock('crypto', () => ({
      pbkdf2Sync: mockNodePbkdf2Sync,
    }));

    const { derivePbkdf2Sha256 } = require('../kdf-provider');

    const pin = '1234';
    const salt = new Uint8Array([9, 8, 7]);
    const iterations = 1000;
    const keyLength = 3;

    const result = derivePbkdf2Sha256(pin, salt, iterations, keyLength);

    expect(mockNodePbkdf2Sync).toHaveBeenCalledWith(pin, salt, iterations, keyLength, 'sha256');
    expect(result).toEqual(new Uint8Array([4, 5, 6]));
  });

  test('Caso 1: Derivazione corretta SHA-256 (derivePbkdf2Sha256) - standard output deterministico', () => {
    jest.doMock('react-native-quick-crypto', () => {
      throw new Error('Module not found');
    }, { virtual: true });
    jest.dontMock('crypto');

    const { derivePbkdf2Sha256 } = require('../kdf-provider');

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
    jest.doMock('react-native-quick-crypto', () => {
      throw new Error('Module not found');
    }, { virtual: true });
    jest.dontMock('crypto');

    const { derivePbkdf2Sha256 } = require('../kdf-provider');

    const pin = '1234';
    const salt = new Uint8Array([1, 2, 3, 4]);
    const result = derivePbkdf2Sha256(pin, salt, 1, 16);
    expect(result.length).toBe(16);
  });

  test('Lunghezza della chiave nulla (keyLength = 0)', () => {
    jest.doMock('react-native-quick-crypto', () => {
      throw new Error('Module not found');
    }, { virtual: true });
    jest.dontMock('crypto');

    const { derivePbkdf2Sha256 } = require('../kdf-provider');

    const pin = '1234';
    const salt = new Uint8Array([1, 2, 3, 4]);
    const result = derivePbkdf2Sha256(pin, salt, 10, 0);
    expect(result.length).toBe(0);
    expect(result).toEqual(new Uint8Array(0));
  });

  test('PIN o Salt vuoti', () => {
    jest.doMock('react-native-quick-crypto', () => {
      throw new Error('Module not found');
    }, { virtual: true });
    jest.dontMock('crypto');

    const { derivePbkdf2Sha256 } = require('../kdf-provider');

    const result = derivePbkdf2Sha256('', new Uint8Array(0), 10, 16);
    expect(result.length).toBe(16);
  });

  // --- CASI DI ERRORE ---

  test('Assenza di librerie crittografiche disponibili', () => {
    // Both react-native-quick-crypto and crypto throw error on require
    jest.doMock('react-native-quick-crypto', () => {
      throw new Error('react-native-quick-crypto not found');
    }, { virtual: true });
    jest.doMock('crypto', () => {
      throw new Error('crypto not found');
    });

    const { derivePbkdf2Sha256 } = require('../kdf-provider');

    expect(() => {
      derivePbkdf2Sha256('1234', new Uint8Array([1]), 10, 16);
    }).toThrow();
  });

  test('Valori numerici negativi (iterations o keyLength negativi)', () => {
    jest.doMock('react-native-quick-crypto', () => {
      throw new Error('Module not found');
    }, { virtual: true });
    jest.dontMock('crypto');

    const { derivePbkdf2Sha256 } = require('../kdf-provider');

    expect(() => {
      derivePbkdf2Sha256('1234', new Uint8Array([1]), -10, 16);
    }).toThrow();

    expect(() => {
      derivePbkdf2Sha256('1234', new Uint8Array([1]), 10, -16);
    }).toThrow();
  });
});
