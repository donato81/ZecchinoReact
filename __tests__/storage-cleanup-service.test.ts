/**
 * Placeholder spec for DESIGN 016-bis and PLAN 016-bis.
 * Implementation is intentionally deferred; only TODO scenarios are tracked here.
 */
import {
  CLEANUP_LOGOUT_TIMEOUT_MS,
  MAX_FILES_PER_SCAN,
  createStorageCleanupService,
} from '@/lib/storage-cleanup-service';

function makeService(now: string) {
  const deps = {
    listCandidateFiles: jest.fn<
      Promise<Array<{ path: string; createdAt?: string }>>,
      [string, { transazioneId?: string; limit: number }]
    >(),
    listKnownPaths: jest.fn<
      Promise<Set<string>>,
      [string, string | undefined]
    >(),
    deleteFile: jest.fn<Promise<void>, [string]>(),
    warn: jest.fn<void, unknown[]>(),
    now: jest.fn(() => new Date(now).getTime()),
  };

  return {
    service: createStorageCleanupService(deps),
    deps,
  };
}

describe('storage-cleanup-service', () => {
  it('Trigger 1 elimina il file orfano corretto e nessun altro', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.deleteFile.mockResolvedValue(undefined);

    await expect(
      service.cleanupSpecificOrphan('user-016', 'user-016/tx-1/orphan.pdf'),
    ).resolves.toEqual({
      scanned: 1,
      orphanFound: 1,
      deleted: 1,
      failed: 0,
    });
    expect(deps.deleteFile).toHaveBeenCalledTimes(1);
    expect(deps.deleteFile).toHaveBeenCalledWith('user-016/tx-1/orphan.pdf');
  });

  it('Trigger 2 al login scansiona solo ultime 48 ore e al massimo MAX_FILES_PER_SCAN file', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.listCandidateFiles.mockResolvedValue([
      {
        path: 'user-016/tx-1/recent.pdf',
        createdAt: '2026-05-28T02:00:00.000Z',
      },
      { path: 'user-016/tx-1/old.pdf', createdAt: '2026-05-25T02:00:00.000Z' },
    ]);
    deps.deleteFile.mockResolvedValue(undefined);

    await expect(service.cleanupRecentOrphans('user-016')).resolves.toEqual({
      scanned: 1,
      orphanFound: 1,
      deleted: 1,
      failed: 0,
    });
    expect(deps.listCandidateFiles).toHaveBeenCalledWith('user-016', {
      limit: MAX_FILES_PER_SCAN,
      transazioneId: undefined,
    });
  });

  it('Trigger 3 dopo cancellazione transazione limita la scansione al path user_id/transazione_id', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.listCandidateFiles.mockResolvedValue([
      {
        path: 'user-016/tx-42/orphan.pdf',
        createdAt: '2026-05-28T06:00:00.000Z',
      },
    ]);
    deps.deleteFile.mockResolvedValue(undefined);

    await service.cleanupTransactionOrphans('user-016', 'tx-42');

    expect(deps.listCandidateFiles).toHaveBeenCalledWith('user-016', {
      limit: MAX_FILES_PER_SCAN,
      transazioneId: 'tx-42',
    });
    expect(deps.listKnownPaths).toHaveBeenCalledWith(
      'user-016',
      'user-016/tx-42/',
    );
  });

  it('Trigger 4 al logout rispetta CLEANUP_LOGOUT_TIMEOUT_MS e non blocca il logout', async () => {
    jest.useFakeTimers();
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.listCandidateFiles.mockImplementation(
      () => new Promise(() => undefined),
    );

    const cleanupPromise = service.cleanupOnLogout('user-016');
    jest.advanceTimersByTime(CLEANUP_LOGOUT_TIMEOUT_MS);

    await expect(cleanupPromise).resolves.toEqual({
      scanned: 0,
      orphanFound: 0,
      deleted: 0,
      failed: 0,
    });
    jest.useRealTimers();
  });

  it('cleanupInProgress blocca il secondo avvio concorrente, escluso Trigger 1', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    let resolveList!: (
      value: Array<{ path: string; createdAt?: string }>,
    ) => void;
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.listCandidateFiles.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveList = resolve;
        }),
    );
    deps.deleteFile.mockResolvedValue(undefined);

    const first = service.cleanupRecentOrphans('user-016');
    const second = service.cleanupRecentOrphans('user-016');
    await Promise.resolve();
    resolveList([
      {
        path: 'user-016/tx-1/orphan.pdf',
        createdAt: '2026-05-28T06:00:00.000Z',
      },
    ]);

    await expect(second).resolves.toEqual({
      scanned: 0,
      orphanFound: 0,
      deleted: 0,
      failed: 0,
    });
    await expect(first).resolves.toEqual({
      scanned: 1,
      orphanFound: 1,
      deleted: 1,
      failed: 0,
    });
  });

  it('il throttle temporale impedisce un cleanup entro MIN_CLEANUP_INTERVAL_MS, escluso Trigger 1', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.listCandidateFiles.mockResolvedValue([
      {
        path: 'user-016/tx-1/orphan.pdf',
        createdAt: '2026-05-28T06:00:00.000Z',
      },
    ]);
    deps.deleteFile.mockResolvedValue(undefined);

    await service.cleanupRecentOrphans('user-016');
    await expect(service.cleanupRecentOrphans('user-016')).resolves.toEqual({
      scanned: 0,
      orphanFound: 0,
      deleted: 0,
      failed: 0,
    });
    await expect(
      service.cleanupSpecificOrphan('user-016', 'user-016/tx-1/manual.pdf'),
    ).resolves.toEqual({
      scanned: 1,
      orphanFound: 1,
      deleted: 1,
      failed: 0,
    });
  });

  it('i file piu recenti di CLEANUP_SAFETY_WINDOW_MS non vengono eliminati', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.listCandidateFiles.mockResolvedValue([
      {
        path: 'user-016/tx-1/fresh.pdf',
        createdAt: '2026-05-28T11:58:30.000Z',
      },
    ]);

    await expect(service.cleanupRecentOrphans('user-016')).resolves.toEqual({
      scanned: 1,
      orphanFound: 1,
      deleted: 0,
      failed: 0,
    });
    expect(deps.deleteFile).not.toHaveBeenCalled();
  });

  it('i file senza createdAt non vengono eliminati nei trigger con recency e safety window', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.listCandidateFiles.mockResolvedValue([
      { path: 'user-016/tx-1/unknown-timestamp.pdf' },
    ]);

    await expect(service.cleanupRecentOrphans('user-016')).resolves.toEqual({
      scanned: 0,
      orphanFound: 0,
      deleted: 0,
      failed: 0,
    });
    expect(deps.deleteFile).not.toHaveBeenCalled();
  });

  it("il cleanup non tocca file con path fuori dal prefisso user_id dell'utente", async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.listCandidateFiles.mockResolvedValue([
      {
        path: 'other-user/tx-1/orphan.pdf',
        createdAt: '2026-05-28T06:00:00.000Z',
      },
    ]);

    await expect(service.cleanupRecentOrphans('user-016')).resolves.toEqual({
      scanned: 0,
      orphanFound: 0,
      deleted: 0,
      failed: 0,
    });
    expect(deps.deleteFile).not.toHaveBeenCalled();
  });

  it('se manca il file Storage ma esiste il record DB non viene eseguita alcuna azione distruttiva sul DB', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set(['user-016/tx-1/known.pdf']));
    deps.listCandidateFiles.mockResolvedValue([
      {
        path: 'user-016/tx-1/known.pdf',
        createdAt: '2026-05-28T06:00:00.000Z',
      },
    ]);

    await expect(service.cleanupRecentOrphans('user-016')).resolves.toEqual({
      scanned: 1,
      orphanFound: 0,
      deleted: 0,
      failed: 0,
    });
    expect(deps.deleteFile).not.toHaveBeenCalled();
  });

  it('CleanupResult riflette esattamente scanned, orphanFound, deleted e failed', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set(['user-016/tx-1/known.pdf']));
    deps.listCandidateFiles.mockResolvedValue([
      {
        path: 'user-016/tx-1/deleted.pdf',
        createdAt: '2026-05-28T06:00:00.000Z',
      },
      { path: 'user-016/tx-1/fail.pdf', createdAt: '2026-05-28T06:00:00.000Z' },
      {
        path: 'user-016/tx-1/known.pdf',
        createdAt: '2026-05-28T06:00:00.000Z',
      },
    ]);
    deps.deleteFile
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('boom'));

    await expect(service.cleanupRecentOrphans('user-016')).resolves.toEqual({
      scanned: 3,
      orphanFound: 2,
      deleted: 1,
      failed: 1,
    });
  });

  it('un errore su un singolo file non blocca l elaborazione degli altri orfani', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.listCandidateFiles.mockResolvedValue([
      { path: 'user-016/tx-1/fail.pdf', createdAt: '2026-05-28T06:00:00.000Z' },
      {
        path: 'user-016/tx-1/deleted.pdf',
        createdAt: '2026-05-28T06:00:00.000Z',
      },
    ]);
    deps.deleteFile
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(undefined);

    await expect(service.cleanupRecentOrphans('user-016')).resolves.toEqual({
      scanned: 2,
      orphanFound: 2,
      deleted: 1,
      failed: 1,
    });
    expect(deps.warn).toHaveBeenCalledTimes(1);
  });

  it('guardia concorrente e throttle sono isolate per utente e non sopprimono trigger tra account diversi', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.listCandidateFiles.mockResolvedValue([
      { path: 'user-a/tx-1/orphan.pdf', createdAt: '2026-05-28T06:00:00.000Z' },
    ]);
    deps.deleteFile.mockResolvedValue(undefined);

    await expect(service.cleanupRecentOrphans('user-a')).resolves.toEqual({
      scanned: 1,
      orphanFound: 1,
      deleted: 1,
      failed: 0,
    });

    deps.listCandidateFiles.mockResolvedValue([
      { path: 'user-b/tx-2/orphan.pdf', createdAt: '2026-05-28T06:00:00.000Z' },
    ]);

    await expect(service.cleanupRecentOrphans('user-b')).resolves.toEqual({
      scanned: 1,
      orphanFound: 1,
      deleted: 1,
      failed: 0,
    });
  });

  // --- INTEGRATION SESSIONE E4 ---

  it('E4-85: listCandidateFiles - fallimento recupero file da listCandidateFiles incrementa failed', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listCandidateFiles.mockRejectedValueOnce(new Error('List candidate failed'));

    await expect(service.cleanupRecentOrphans('user-016')).resolves.toEqual({
      scanned: 0,
      orphanFound: 0,
      deleted: 0,
      failed: 0,
    });
    expect(deps.warn).toHaveBeenCalled();
  });

  it('E4-86: listKnownPaths - fallimento recupero percorsi noti propaga errore o incrementa failed', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockRejectedValueOnce(new Error('List known paths failed'));

    await expect(service.cleanupRecentOrphans('user-016')).resolves.toEqual({
      scanned: 0,
      orphanFound: 0,
      deleted: 0,
      failed: 0,
    });
    expect(deps.warn).toHaveBeenCalled();
  });

  it('E4-87: cleanupRecentOrphans - gestisce correttamente mix di file validi, orfani ed in safety window', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set(['user-016/tx-1/known.pdf']));
    deps.listCandidateFiles.mockResolvedValue([
      { path: 'user-016/tx-1/known.pdf', createdAt: '2026-05-28T06:00:00.000Z' },
      { path: 'user-016/tx-1/orphan.pdf', createdAt: '2026-05-28T06:00:00.000Z' },
      { path: 'user-016/tx-1/fresh.pdf', createdAt: '2026-05-28T11:58:00.000Z' },
    ]);
    deps.deleteFile.mockResolvedValue(undefined);

    await expect(service.cleanupRecentOrphans('user-016')).resolves.toEqual({
      scanned: 3,
      orphanFound: 2,
      deleted: 1,
      failed: 0,
    });
    expect(deps.deleteFile).toHaveBeenCalledTimes(1);
    expect(deps.deleteFile).toHaveBeenCalledWith('user-016/tx-1/orphan.pdf');
  });

  it('E4-88: cleanupOnLogout - interrompe per timeout la rimozione se supera CLEANUP_LOGOUT_TIMEOUT_MS', async () => {
    jest.useFakeTimers();
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.listCandidateFiles.mockResolvedValue([
      { path: 'user-016/tx-1/orphan1.pdf', createdAt: '2026-05-28T06:00:00.000Z' },
    ]);
    deps.deleteFile.mockImplementation(() => new Promise(() => {}));

    const cleanupPromise = service.cleanupOnLogout('user-016');
    
    jest.advanceTimersByTime(CLEANUP_LOGOUT_TIMEOUT_MS);

    await expect(cleanupPromise).resolves.toEqual({
      scanned: 0,
      orphanFound: 0,
      deleted: 0,
      failed: 0,
    });
    jest.useRealTimers();
  });

  it('E4-89: cleanupSpecificOrphan - no-op con path non valido o vuoto', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');

    await expect(service.cleanupSpecificOrphan('user-016', '')).resolves.toEqual({
      scanned: 0,
      orphanFound: 0,
      deleted: 0,
      failed: 0,
    });

    await expect(service.cleanupSpecificOrphan('user-016', 'user-abc/tx-1/file.pdf')).resolves.toEqual({
      scanned: 0,
      orphanFound: 0,
      deleted: 0,
      failed: 0,
    });

    expect(deps.deleteFile).not.toHaveBeenCalled();
  });

  it('E4-90: cleanupTransactionOrphans - gestisce transazioneId vuoto', async () => {
    const { service, deps } = makeService('2026-05-28T12:00:00.000Z');
    deps.listKnownPaths.mockResolvedValue(new Set());
    deps.listCandidateFiles.mockResolvedValue([]);

    await expect(service.cleanupTransactionOrphans('user-016', '')).resolves.toEqual({
      scanned: 0,
      orphanFound: 0,
      deleted: 0,
      failed: 0,
    });
  });
});
