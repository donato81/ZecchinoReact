import {
  WrappedMasterKeyPayloadError,
  decodeBase64,
  encodeBase64,
  generateMasterKey,
  generatePinSalt,
  rewrapMasterKeyWithPin,
  serializeWrappedMasterKeyPayload,
  unwrapMasterKeyWithPin,
  wrapMasterKeyWithPin,
  deserializeWrappedMasterKeyPayload,
} from '@/lib/crypto';

describe('wrapped master key payload', () => {
  test('serializzazione/deserializzazione payload versionato', () => {
    const salt = generatePinSalt();
    const payload = wrapMasterKeyWithPin(generateMasterKey(), '482917', salt);
    const serialized = serializeWrappedMasterKeyPayload(payload);

    expect(deserializeWrappedMasterKeyPayload(serialized)).toEqual(payload);
  });

  test('caso pre-PIN con payload null', () => {
    expect(() => unwrapMasterKeyWithPin(null, '482917', generatePinSalt())).toThrow(
      WrappedMasterKeyPayloadError,
    );

    try {
      unwrapMasterKeyWithPin(null, '482917', generatePinSalt());
    } catch (error) {
      expect(error).toBeInstanceOf(WrappedMasterKeyPayloadError);
      expect((error as WrappedMasterKeyPayloadError).code).toBe('MASTER_KEY_NOT_CONFIGURED');
    }
  });

  test('payload malformato produce errore di business gestito', () => {
    expect(() => deserializeWrappedMasterKeyPayload('{"version":1}')).toThrow(
      WrappedMasterKeyPayloadError,
    );

    try {
      deserializeWrappedMasterKeyPayload('{"version":1}');
    } catch (error) {
      expect(error).toBeInstanceOf(WrappedMasterKeyPayloadError);
      expect((error as WrappedMasterKeyPayloadError).code).toBe('MASTER_KEY_PAYLOAD_INVALID');
    }
  });

  test('round-trip wrap/unwrap conserva la master key', () => {
    const masterKey = generateMasterKey();
    const salt = generatePinSalt();
    const serialized = serializeWrappedMasterKeyPayload(
      wrapMasterKeyWithPin(masterKey, '482917', salt),
    );

    expect(encodeBase64(unwrapMasterKeyWithPin(serialized, '482917', salt))).toBe(
      encodeBase64(masterKey),
    );
  });

  test('rewrap cambia il materiale cifrato ma non la master key', () => {
    const masterKey = generateMasterKey();
    const oldSalt = generatePinSalt();
    const newSalt = generatePinSalt();
    const original = serializeWrappedMasterKeyPayload(
      wrapMasterKeyWithPin(masterKey, '111111', oldSalt),
    );

    const rewrapped = rewrapMasterKeyWithPin(original, '111111', oldSalt, '222222', newSalt);

    expect(rewrapped).not.toBe(original);
    expect(encodeBase64(unwrapMasterKeyWithPin(rewrapped, '222222', newSalt))).toBe(
      encodeBase64(masterKey),
    );
  });

  test('decodeBase64 mantiene compatibilita con encodeBase64', () => {
    const masterKey = generateMasterKey();

    expect(decodeBase64(encodeBase64(masterKey))).toEqual(masterKey);
  });
});