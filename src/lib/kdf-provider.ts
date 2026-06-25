type Pbkdf2Sync = (
  pin: string,
  salt: Uint8Array,
  iterations: number,
  keyLength: number,
  digest: string,
) => Uint8Array;

function getPbkdf2Sync(): Pbkdf2Sync {
  try {
    const quickCryptoModule = require('react-native-quick-crypto');
    const quickCrypto = quickCryptoModule.default ?? quickCryptoModule;
    return quickCrypto.pbkdf2Sync.bind(quickCrypto) as Pbkdf2Sync;
  } catch {
    const nodeCrypto = require('crypto') as { pbkdf2Sync: Pbkdf2Sync };
    return nodeCrypto.pbkdf2Sync;
  }
}

export function derivePbkdf2Sha256(
  pin: string,
  salt: Uint8Array,
  iterations: number,
  keyLength: number,
): Uint8Array {
  return new Uint8Array(
    getPbkdf2Sync()(pin, salt, iterations, keyLength, 'sha256'),
  );
}
