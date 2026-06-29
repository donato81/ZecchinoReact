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
    expect(() =>
      unwrapMasterKeyWithPin(null, '482917', generatePinSalt()),
    ).toThrow(WrappedMasterKeyPayloadError);

    try {
      unwrapMasterKeyWithPin(null, '482917', generatePinSalt());
    } catch (error) {
      expect(error).toBeInstanceOf(WrappedMasterKeyPayloadError);
      expect((error as WrappedMasterKeyPayloadError).code).toBe(
        'MASTER_KEY_NOT_CONFIGURED',
      );
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
      expect((error as WrappedMasterKeyPayloadError).code).toBe(
        'MASTER_KEY_PAYLOAD_INVALID',
      );
    }
  });

  test('round-trip wrap/unwrap conserva la master key', () => {
    const masterKey = generateMasterKey();
    const salt = generatePinSalt();
    const serialized = serializeWrappedMasterKeyPayload(
      wrapMasterKeyWithPin(masterKey, '482917', salt),
    );

    expect(
      encodeBase64(unwrapMasterKeyWithPin(serialized, '482917', salt)),
    ).toBe(encodeBase64(masterKey));
  });

  test('rewrap cambia il materiale cifrato ma non la master key', () => {
    const masterKey = generateMasterKey();
    const oldSalt = generatePinSalt();
    const newSalt = generatePinSalt();
    const original = serializeWrappedMasterKeyPayload(
      wrapMasterKeyWithPin(masterKey, '111111', oldSalt),
    );

    const rewrapped = rewrapMasterKeyWithPin(
      original,
      '111111',
      oldSalt,
      '222222',
      newSalt,
    );

    expect(rewrapped).not.toBe(original);
    expect(
      encodeBase64(unwrapMasterKeyWithPin(rewrapped, '222222', newSalt)),
    ).toBe(encodeBase64(masterKey));
  });

  test('decodeBase64 mantiene compatibilita con encodeBase64', () => {
    const masterKey = generateMasterKey();

    expect(decodeBase64(encodeBase64(masterKey))).toEqual(masterKey);
  });

  // --- INTEGRATION SESSIONE E4 ---

  test('E4-95: unwrapMasterKeyWithPin - fallimento con PIN errato lancia errore con codice MASTER_KEY_UNWRAP_FAILED', () => {
    const masterKey = generateMasterKey();
    const salt = generatePinSalt();
    const payload = serializeWrappedMasterKeyPayload(
      wrapMasterKeyWithPin(masterKey, '123456', salt),
    );

    expect(() => unwrapMasterKeyWithPin(payload, 'wrong_pin', salt)).toThrow(
      expect.objectContaining({ code: 'MASTER_KEY_UNWRAP_FAILED' })
    );
  });

  test('E4-96: rewrapMasterKeyWithPin - fallimento se vecchio PIN errato', () => {
    const masterKey = generateMasterKey();
    const oldSalt = generatePinSalt();
    const newSalt = generatePinSalt();
    const payload = serializeWrappedMasterKeyPayload(
      wrapMasterKeyWithPin(masterKey, '123456', oldSalt),
    );

    expect(() =>
      rewrapMasterKeyWithPin(payload, 'wrong_old_pin', oldSalt, '222222', newSalt)
    ).toThrow(expect.objectContaining({ code: 'MASTER_KEY_UNWRAP_FAILED' }));
  });

  test('E4-97: deserializeWrappedMasterKeyPayload - JSON non valido solleva errore', () => {
    expect(() => deserializeWrappedMasterKeyPayload('non-json-string')).toThrow(
      WrappedMasterKeyPayloadError
    );
    expect(() => deserializeWrappedMasterKeyPayload('{}')).toThrow(
      WrappedMasterKeyPayloadError
    );
  });
});
