/**
 * Placeholder spec for DESIGN 016-ter and PLAN 016-ter.
 * Implementation is intentionally deferred; only TODO scenarios are tracked here.
 */
jest.mock('react-native-fs', () => ({
  read: jest.fn(),
  readFile: jest.fn(),
}));

import RNFS from 'react-native-fs';
import * as magicBytesReader from '@/lib/file-system/magic-bytes-reader';
import { readFileHeader as readAndroidHeader } from '@/lib/file-system/magic-bytes-reader.android';
import { readFileHeader as readWindowsHeader } from '@/lib/file-system/magic-bytes-reader.windows';
import { validateAttachmentFile } from '@/lib/supabase/storage';

const mockReadFile = RNFS.readFile as jest.Mock;
const mockRead = RNFS.read as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(globalThis, 'Buffer', {
    value: require('buffer').Buffer,
    configurable: true,
  });
  mockRead.mockReset();
});

describe('magic-bytes-validation', () => {
  it('JPEG valido con firma FF D8 FF passa su Android e Windows', async () => {
    mockRead.mockResolvedValue('/9j/AA==');

    await expect(readAndroidHeader('file:///foto.jpg')).resolves.toEqual(
      Uint8Array.from([0xff, 0xd8, 0xff, 0x00]),
    );
    await expect(readWindowsHeader('file:///foto.jpg')).resolves.toEqual(
      Uint8Array.from([0xff, 0xd8, 0xff, 0x00]),
    );
    expect(mockRead).toHaveBeenCalledWith('/foto.jpg', 12, 0, 'base64');
  });

  it('PNG valido con firma 89 50 4E 47 0D 0A 1A 0A passa la validazione', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(
        Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
    await expect(
      validateAttachmentFile({
        uri: 'file:///ok.png',
        name: 'ok.png',
        type: 'image/png',
        size: 100,
      }),
    ).resolves.toBeNull();
  });

  it('PDF valido con firma 25 50 44 46 passa la validazione', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(Uint8Array.from([0x25, 0x50, 0x44, 0x46]));
    await expect(
      validateAttachmentFile({
        uri: 'file:///ok.pdf',
        name: 'ok.pdf',
        type: 'application/pdf',
        size: 100,
      }),
    ).resolves.toBeNull();
  });

  it('file rinominato .jpg con firma PNG viene rifiutato', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(
        Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
    await expect(
      validateAttachmentFile({
        uri: 'file:///spoof.jpg',
        name: 'spoof.jpg',
        type: 'image/jpeg',
        size: 100,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ code: 'MIME_EXTENSION_MISMATCH' }),
    );
  });

  it('file rinominato .pdf con firma JPEG viene rifiutato', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(Uint8Array.from([0xff, 0xd8, 0xff]));
    await expect(
      validateAttachmentFile({
        uri: 'file:///spoof.pdf',
        name: 'spoof.pdf',
        type: 'application/pdf',
        size: 100,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ code: 'MIME_EXTENSION_MISMATCH' }),
    );
  });

  it('file rinominato .png con firma PDF viene rifiutato', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(Uint8Array.from([0x25, 0x50, 0x44, 0x46]));
    await expect(
      validateAttachmentFile({
        uri: 'file:///spoof.png',
        name: 'spoof.png',
        type: 'image/png',
        size: 100,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ code: 'MIME_EXTENSION_MISMATCH' }),
    );
  });

  it('file con meno di 8 byte viene rifiutato come firma parziale non valida', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(Uint8Array.from([0x89, 0x50]));
    await expect(
      validateAttachmentFile({
        uri: 'file:///short.png',
        name: 'short.png',
        type: 'image/png',
        size: 100,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ code: 'MIME_EXTENSION_MISMATCH' }),
    );
  });

  it('file vuoto viene rifiutato', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(new Uint8Array(0));
    await expect(
      validateAttachmentFile({
        uri: 'file:///empty.pdf',
        name: 'empty.pdf',
        type: 'application/pdf',
        size: 100,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ code: 'MIME_EXTENSION_MISMATCH' }),
    );
  });

  it('piattaforma non supportata ritorna Uint8Array(0) e rifiuta il file senza propagare eccezioni', async () => {
    await expect(
      magicBytesReader.readFileHeader('file:///unsupported.pdf'),
    ).resolves.toEqual(new Uint8Array(0));
    await expect(
      validateAttachmentFile({
        uri: 'file:///unsupported.pdf',
        name: 'unsupported.pdf',
        type: 'application/pdf',
        size: 100,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ code: 'MIME_EXTENSION_MISMATCH' }),
    );
  });

  it('readFileHeader throw-safe converte l eccezione interna in Uint8Array(0)', async () => {
    mockRead.mockRejectedValue(new Error('fs fail'));
    await expect(readAndroidHeader('file:///broken.pdf')).resolves.toEqual(
      new Uint8Array(0),
    );
    await expect(readWindowsHeader('file:///broken.pdf')).resolves.toEqual(
      new Uint8Array(0),
    );
  });

  it('fallimento MIME whitelist cortocircuita prima della lettura magic bytes', async () => {
    const headerSpy = jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(Uint8Array.from([0x25, 0x50, 0x44, 0x46]));
    await expect(
      validateAttachmentFile({
        uri: 'file:///bad.svg',
        name: 'bad.svg',
        type: 'image/svg+xml',
        size: 100,
      }),
    ).resolves.toEqual(expect.objectContaining({ code: 'MIME_NOT_ALLOWED' }));
    expect(headerSpy).not.toHaveBeenCalled();
  });

  it('matchesSignature con array vuoto ritorna false senza errori', () => {
    expect(magicBytesReader.matchesSignature(new Uint8Array(0), [])).toBe(
      false,
    );
    expect(magicBytesReader.matchesSignature(new Uint8Array(0), [0xff])).toBe(
      false,
    );
  });

  it('l estensione resta fonte primaria e un file .jpg con MIME image/png ma firma JPEG viene rifiutato', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(Uint8Array.from([0xff, 0xd8, 0xff]));
    await expect(
      validateAttachmentFile({
        uri: 'file:///mismatch.jpg',
        name: 'mismatch.jpg',
        type: 'image/png',
        size: 100,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ code: 'MIME_EXTENSION_MISMATCH' }),
    );
  });

  it('WEBP-01: file con firma RIFF+WEBP valida viene riconosciuto come image/webp', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(
        Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0x12, 0x34, 0x56, 0x78, 0x57, 0x45, 0x42, 0x50])
      );
    await expect(
      validateAttachmentFile({
        uri: 'file:///ok.webp',
        name: 'ok.webp',
        type: 'image/webp',
        size: 100,
      }),
    ).resolves.toBeNull();
  });

  it('WEBP-02: file con byte RIFF ma senza WEBP ai byte 8-11 viene rifiutato', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(
        Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0x12, 0x34, 0x56, 0x78, 0x00, 0x00, 0x00, 0x00])
      );
    await expect(
      validateAttachmentFile({
        uri: 'file:///spoof.webp',
        name: 'spoof.webp',
        type: 'image/webp',
        size: 100,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ code: 'MIME_EXTENSION_MISMATCH' }),
    );
  });

  it('HEIC-01: file con ftyp+heic valido viene riconosciuto come image/heic', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(
        Uint8Array.from([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63])
      );
    await expect(
      validateAttachmentFile({
        uri: 'file:///ok.heic',
        name: 'ok.heic',
        type: 'image/heic',
        size: 100,
      }),
    ).resolves.toBeNull();
  });

  it('HEIC-02: file con ftyp+heix valido viene riconosciuto come image/heic', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(
        Uint8Array.from([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x78])
      );
    await expect(
      validateAttachmentFile({
        uri: 'file:///ok2.heic',
        name: 'ok2.heic',
        type: 'image/heic',
        size: 100,
      }),
    ).resolves.toBeNull();
  });

  it('HEIC-03: file con ftyp ma brand sconosciuto viene rifiutato', async () => {
    jest
      .spyOn(magicBytesReader, 'readFileHeader')
      .mockResolvedValue(
        Uint8Array.from([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x62, 0x61, 0x64, 0x31])
      );
    await expect(
      validateAttachmentFile({
        uri: 'file:///spoof.heic',
        name: 'spoof.heic',
        type: 'image/heic',
        size: 100,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ code: 'MIME_EXTENSION_MISMATCH' }),
    );
  });
});
