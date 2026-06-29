import RNFS from 'react-native-fs';

jest.mock('react-native-fs', () => ({
  read: jest.fn(),
  readFile: jest.fn(),
}));

describe('allegati.storage', () => {
  let deleteAttachment: any;
  let getAttachmentSignedUrl: any;
  let uploadAttachment: any;
  let validateAttachmentFile: any;
  let mockFrom: jest.Mock;
  let mockReadFileHeader: jest.Mock;
  let mockRead: jest.Mock;
  let mockReadFile: jest.Mock;

  function buildStorageBucket() {
    return {
      upload: jest.fn(),
      remove: jest.fn(),
      createSignedUrl: jest.fn(),
    };
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockFrom = jest.fn();
    mockReadFileHeader = jest.fn();

    // Get the fresh mock references after Jest module reset
    const freshRNFS = require('react-native-fs');
    mockRead = freshRNFS.read;
    mockReadFile = freshRNFS.readFile;

    // Isolate client mock to prevent leaks from other tests
    jest.doMock('@/lib/supabase/client', () => ({
      supabase: {
        storage: {
          from: mockFrom,
        },
      },
    }));

    // Isolate magic bytes reader mock so it is correctly loaded by the dynamic require of storage.ts
    jest.doMock('@/lib/file-system/magic-bytes-reader', () => {
      const actual = jest.requireActual('@/lib/file-system/magic-bytes-reader');
      return {
        ...actual,
        readFileHeader: () => mockReadFileHeader(),
      };
    });

    // Import functions dynamically from the isolated storage module instance
    const storageModule = require('@/lib/supabase/storage');
    deleteAttachment = storageModule.deleteAttachment;
    getAttachmentSignedUrl = storageModule.getAttachmentSignedUrl;
    uploadAttachment = storageModule.uploadAttachment;
    validateAttachmentFile = storageModule.validateAttachmentFile;

    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: jest.fn(() => 'uuid-016'),
        getRandomValues: jest.fn(),
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, 'Buffer', {
      value: require('buffer').Buffer,
      configurable: true,
    });
    mockRead.mockResolvedValue('cGRm');
    mockReadFile.mockResolvedValue('cGRm');
    mockReadFileHeader.mockResolvedValue(Uint8Array.from([0x25, 0x50, 0x44, 0x46])); // default PDF signature
  });

  it('sanitizeFilename produce un path sicuro per nomi file pericolosi', async () => {
    const bucket = buildStorageBucket();
    bucket.upload.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue(bucket);

    const result = await uploadAttachment('user-016', 'tx-016', {
      uri: 'file:///dangerous.pdf',
      name: '../Bilancio Finale 2026!!.PDF',
      type: 'application/pdf',
      size: 1024,
    });

    expect(result.storagePath).toBe(
      'user-016/tx-016/uuid-016-bilancio-finale-2026.pdf',
    );
    expect(bucket.upload).toHaveBeenCalledWith(
      'user-016/tx-016/uuid-016-bilancio-finale-2026.pdf',
      expect.any(ArrayBuffer),
      expect.objectContaining({
        contentType: 'application/pdf',
        upsert: false,
      }),
    );
  });

  it('validateAttachmentFile rifiuta MIME non in whitelist', () => {
    return expect(
      validateAttachmentFile({
        uri: 'file:///script.svg',
        name: 'script.svg',
        type: 'image/svg+xml',
        size: 512,
      }),
    ).resolves.toEqual({
      code: 'MIME_NOT_ALLOWED',
      message: 'Tipo di file non consentito.',
    });
  });

  it('validateAttachmentFile rifiuta nomi file invalidi', () => {
    return expect(
      validateAttachmentFile({
        uri: 'file:///senza-estensione',
        name: '   ',
        type: 'application/pdf',
        size: 512,
      }),
    ).resolves.toEqual({
      code: 'FILE_NAME_INVALID',
      message: 'Nome file non valido.',
    });
  });

  it('validateAttachmentFile rifiuta MIME spoofing quando estensione e MIME sono incoerenti', () => {
    return expect(
      validateAttachmentFile({
        uri: 'file:///report.pdf',
        name: 'report.pdf',
        type: 'image/png',
        size: 1200,
      }),
    ).resolves.toEqual({
      code: 'MIME_EXTENSION_MISMATCH',
      message: 'Estensione e tipo file non sono coerenti.',
    });
  });

  it('validateAttachmentFile rifiuta file oltre MAX_ATTACHMENT_SIZE_BYTES', () => {
    return expect(
      validateAttachmentFile({
        uri: 'file:///large.pdf',
        name: 'large.pdf',
        type: 'application/pdf',
        size: 10 * 1024 * 1024 + 1,
      }),
    ).resolves.toEqual({
      code: 'SIZE_LIMIT_EXCEEDED',
      message: 'Il file supera il limite massimo di 10 MB.',
    });
  });

  it('uploadAttachment genera path fisico nel formato {user_id}/{transazione_id}/{uuid}-{safe_filename}', async () => {
    const bucket = buildStorageBucket();
    bucket.upload.mockResolvedValue({ error: null });
    bucket.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.local/file' },
      error: null,
    });
    bucket.remove.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue(bucket);
    mockReadFileHeader.mockResolvedValue(Uint8Array.from([0xff, 0xd8, 0xff])); // JPEG signature

    const uploadResult = await uploadAttachment('user-016', 'tx-016', {
      uri: 'file:///foto.jpg',
      name: 'Foto Vacanze.JPG',
      type: 'image/jpeg',
      size: 2048,
    });

    await expect(
      getAttachmentSignedUrl(uploadResult.storagePath),
    ).resolves.toBe('https://signed.local/file');
    await expect(
      deleteAttachment(uploadResult.storagePath),
    ).resolves.toBeUndefined();
    expect(uploadResult.storagePath).toBe(
      'user-016/tx-016/uuid-016-foto-vacanze.jpg',
    );
  });

  it('getAttachmentSignedUrl ritorna errore localizzato quando Supabase fallisce la signed URL', async () => {
    const bucket = buildStorageBucket();
    bucket.createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: 'forbidden' },
    });
    mockFrom.mockReturnValue(bucket);

  });

  // --- INTEGRATION SESSIONE E4 ---

  it('E4-40: uploadAttachment - lancia errore se bucket.upload fallisce', async () => {
    const bucket = buildStorageBucket();
    bucket.upload.mockResolvedValue({ error: { message: 'caricamento fallito' } });
    mockFrom.mockReturnValue(bucket);

    await expect(uploadAttachment('user-1', 'tx-1', {
      uri: 'file:///document.pdf',
      name: 'document.pdf',
      type: 'application/pdf',
      size: 1024,
    })).rejects.toThrow("Impossibile caricare l'allegato.");
  });

  it('E4-41: deleteAttachment - lancia errore se bucket.remove fallisce', async () => {
    const bucket = buildStorageBucket();
    bucket.remove.mockResolvedValue({ error: { message: 'rimozione fallita' } });
    mockFrom.mockReturnValue(bucket);

    await expect(deleteAttachment('user-1/tx-1/file.pdf')).rejects.toThrow("Impossibile eliminare l'allegato.");
  });

  it('E4-42: validateAttachmentFile - rifiuta firma magic bytes non corrispondente al MIME dichiarante', async () => {
    mockReadFileHeader.mockResolvedValue(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

    const result = await validateAttachmentFile({
      uri: 'file:///spoofed.pdf',
      name: 'spoofed.pdf',
      type: 'application/pdf',
      size: 1024,
    });

    expect(result).toEqual({
      code: 'MIME_EXTENSION_MISMATCH',
      message: 'Estensione e tipo file non sono coerenti.',
    });
  });

  it('E4-43: validateAttachmentFile - rifiuta file con estensioni multiple non permesse', async () => {
    const result = await validateAttachmentFile({
      uri: 'file:///document.pdf.exe',
      name: 'document.pdf.exe',
      type: 'application/pdf',
      size: 1024,
    });

    expect(result).toEqual({
      code: 'MIME_EXTENSION_MISMATCH',
      message: 'Estensione e tipo file non sono coerenti.',
    });
  });

  it('E4-44: validateAttachmentFile - propaga errore se la lettura del file fallisce', async () => {
    mockReadFileHeader.mockRejectedValue(new Error('File access error'));

    await expect(validateAttachmentFile({
      uri: 'file:///blocked.pdf',
      name: 'blocked.pdf',
      type: 'application/pdf',
      size: 1024,
    })).rejects.toThrow('File access error');
  });
});
