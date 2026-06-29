/**
 * Placeholder spec for DESIGN 016 and PLAN 016.
 * Implementation is intentionally deferred; only TODO scenarios are tracked here.
 */
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('@/lib/supabase/storage', () => ({
  uploadAttachment: jest.fn(),
  deleteAttachment: jest.fn(),
  getAttachmentSignedUrl: jest.fn(),
  validateAttachmentFile: jest.fn(),
}));

jest.mock('@/lib/storage-cleanup-service', () => ({
  storageCleanupService: {
    cleanupSpecificOrphan: jest.fn(),
  },
}));

import {
  create,
  getAll,
  getById,
  remove,
} from '@/lib/supabase/repositories/allegati';
import { supabase } from '@/lib/supabase/client';
import { deleteAttachment, uploadAttachment } from '@/lib/supabase/storage';
import { storageCleanupService } from '@/lib/storage-cleanup-service';

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFrom = supabase.from as jest.Mock;
const mockUploadAttachment = uploadAttachment as jest.Mock;
const mockDeleteAttachment = deleteAttachment as jest.Mock;
const mockCleanupSpecificOrphan =
  storageCleanupService.cleanupSpecificOrphan as jest.Mock;

const ROW = {
  id: 'all-1',
  user_id: 'user-016',
  transazione_id: 'tx-016',
  nome_file: 'documento.pdf',
  storage_path: 'user-016/tx-016/uuid-documento.pdf',
  mime_type: 'application/pdf',
  dimensione_bytes: 2048,
  descrizione: 'Ricevuta',
  miniatura_path: null,
  created_at: '2026-05-28T12:00:00.000Z',
};

function buildSelectChain(result: unknown) {
  type SelectChain = Record<string, unknown> & {
    eq: jest.Mock;
    order: jest.Mock;
    single: jest.Mock;
  };
  let chain!: SelectChain;
  chain = {
    ...(result as Record<string, unknown>),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    single: jest.fn().mockResolvedValue(result),
  };
  const select = jest.fn(() => chain);
  mockFrom.mockReturnValue({ select });
  return { select, eq: chain.eq, order: chain.order, single: chain.single };
}

function buildInsertChain(result: unknown) {
  const single = jest.fn().mockResolvedValue(result);
  const select = jest.fn(() => ({ single }));
  const insert = jest.fn(() => ({ select }));
  mockFrom.mockReturnValue({ insert });
  return { insert, select, single };
}

function buildDeleteChain(result: unknown) {
  const eq = jest.fn().mockResolvedValue(result);
  const deleteFn = jest.fn(() => ({ eq }));
  mockFrom.mockReturnValue({ delete: deleteFn });
  return { deleteFn, eq };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFrom.mockReset();
  mockGetUser.mockReset();
  mockUploadAttachment.mockReset();
  mockDeleteAttachment.mockReset();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-016' } } });
  mockUploadAttachment.mockResolvedValue({
    storagePath: ROW.storage_path,
    fileName: ROW.nome_file,
    mimeType: 'application/pdf',
    sizeBytes: ROW.dimensione_bytes,
  });
  mockDeleteAttachment.mockResolvedValue(undefined);
  mockCleanupSpecificOrphan.mockResolvedValue({
    scanned: 1,
    orphanFound: 1,
    deleted: 1,
    failed: 0,
  });
});

describe('allegati.repository', () => {
  it('rollback upload con Storage OK, DB FAIL e tentativo di delete su Storage', async () => {
    const chain = buildInsertChain({
      data: null,
      error: { message: 'insert fail', code: '500', details: '', hint: '' },
    });

    await expect(
      create({
        transazioneId: 'tx-016',
        file: {
          uri: 'file:///documento.pdf',
          name: 'documento.pdf',
          type: 'application/pdf',
          size: 2048,
        },
        descrizione: 'Ricevuta',
      }),
    ).rejects.toThrow("Impossibile caricare l'allegato.");

    expect(mockUploadAttachment).toHaveBeenCalledWith(
      'user-016',
      'tx-016',
      expect.objectContaining({ name: 'documento.pdf' }),
    );
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-016',
        storage_path: ROW.storage_path,
      }),
    );
    expect(mockCleanupSpecificOrphan).toHaveBeenCalledWith(
      'user-016',
      ROW.storage_path,
    );
  });

  it('rollback upload continua a restituire il fail DB originario anche se il cleanup storage fallisce', async () => {
    buildInsertChain({
      data: null,
      error: { message: 'insert fail', code: '500', details: '', hint: '' },
    });
    mockCleanupSpecificOrphan.mockRejectedValue(new Error('cleanup fail'));

    await expect(
      create({
        transazioneId: 'tx-016',
        file: {
          uri: 'file:///documento.pdf',
          name: 'documento.pdf',
          type: 'application/pdf',
          size: 2048,
        },
      }),
    ).rejects.toThrow("Impossibile caricare l'allegato.");
  });

  it('ordine cancellazione con Storage FAIL e DB non toccato', async () => {
    type LookupChain = {
      eq: jest.MockedFunction<(column: string, value: string) => LookupChain>;
      single: jest.Mock<Promise<{ data: typeof ROW; error: null }>, []>;
    };
    let selectChain!: LookupChain;
    const eq: LookupChain['eq'] = jest.fn(
      (_: string, __: string) => selectChain,
    );
    selectChain = {
      eq,
      single: jest.fn().mockResolvedValue({ data: ROW, error: null }),
    };
    const select = jest.fn(() => selectChain);
    const deleteChain = buildDeleteChain({ error: null });
    mockFrom
      .mockReturnValueOnce({ select })
      .mockReturnValueOnce({ delete: deleteChain.deleteFn });

    mockDeleteAttachment.mockRejectedValue(new Error('storage fail'));

    await expect(remove('all-1')).rejects.toThrow('storage fail');
    expect(mockDeleteAttachment).toHaveBeenCalledWith(ROW.storage_path);
    expect(deleteChain.deleteFn).not.toHaveBeenCalled();
  });

  it("isolamento utenti, utente A non puo accedere ai file dell'utente B", async () => {
    const chain = buildSelectChain({
      data: null,
      error: {
        message: 'row not found',
        code: 'PGRST116',
        details: '',
        hint: '',
      },
    });

    await expect(getById('foreign-attachment')).rejects.toThrow(
      'Impossibile caricare gli allegati.',
    );
    expect(chain.eq).toHaveBeenCalledWith('id', 'foreign-attachment');
  });

  it('remove propaga deleteFailed se la delete DB fallisce dopo la rimozione storage riuscita', async () => {
    const selectChain = buildSelectChain({ data: ROW, error: null });
    const deleteChain = buildDeleteChain({
      error: { message: 'db delete fail', code: '500', details: '', hint: '' },
    });
    mockFrom
      .mockReturnValueOnce({ select: selectChain.select })
      .mockReturnValueOnce({ delete: deleteChain.deleteFn });

    await expect(remove('all-1')).rejects.toThrow(
      "Impossibile eliminare l'allegato.",
    );
    expect(mockDeleteAttachment).toHaveBeenCalledWith(ROW.storage_path);
    expect(deleteChain.eq).toHaveBeenCalledWith('id', 'all-1');
  });

  it('getAll richiede il filtro obbligatorio per transazione e ordina gli allegati più recenti', async () => {
    const chain = buildSelectChain({ data: [ROW], error: null });

    await expect(getAll('tx-016')).resolves.toEqual([
      expect.objectContaining({
        id: 'all-1',
        transazioneId: 'tx-016',
        nomeFile: 'documento.pdf',
      }),
    ]);
    expect(chain.eq).toHaveBeenCalledWith('transazione_id', 'tx-016');
    expect(chain.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
  });

  // --- INTEGRATION SESSIONE E4 ---

  it('E4-72: create - inserimento record riuscito con conversione in camelCase', async () => {
    const chain = buildInsertChain({
      data: ROW,
      error: null,
    });

    const result = await create({
      transazioneId: 'tx-016',
      file: {
        uri: 'file:///documento.pdf',
        name: 'documento.pdf',
        type: 'application/pdf',
        size: 2048,
      },
      descrizione: 'Ricevuta',
    });

    expect(result).toEqual({
      id: 'all-1',
      transazioneId: 'tx-016',
      nomeFile: 'documento.pdf',
      storagePath: 'user-016/tx-016/uuid-documento.pdf',
      mimeType: 'application/pdf',
      dimensioneBytes: 2048,
      descrizione: 'Ricevuta',
      miniaturaPath: undefined,
      createdAt: '2026-05-28T12:00:00.000Z',
    });
    expect(chain.insert).toHaveBeenCalled();
  });

  it('E4-73: getById - recupero per ID riuscito con conversione camelCase', async () => {
    const chain = buildSelectChain({
      data: ROW,
      error: null,
    });

    const result = await getById('all-1');
    expect(result).toEqual({
      id: 'all-1',
      transazioneId: 'tx-016',
      nomeFile: 'documento.pdf',
      storagePath: 'user-016/tx-016/uuid-documento.pdf',
      mimeType: 'application/pdf',
      dimensioneBytes: 2048,
      descrizione: 'Ricevuta',
      miniaturaPath: undefined,
      createdAt: '2026-05-28T12:00:00.000Z',
    });
    expect(chain.eq).toHaveBeenCalledWith('id', 'all-1');
  });

  it('E4-74: create - fallimento upload su storage (DB non viene toccato)', async () => {
    mockUploadAttachment.mockRejectedValueOnce(new Error('Storage crash'));
    const chain = buildInsertChain({
      data: ROW,
      error: null,
    });

    await expect(create({
      transazioneId: 'tx-016',
      file: {
        uri: 'file:///documento.pdf',
        name: 'documento.pdf',
        type: 'application/pdf',
        size: 2048,
      },
    })).rejects.toThrow('Storage crash');

    expect(chain.insert).not.toHaveBeenCalled();
  });
});
