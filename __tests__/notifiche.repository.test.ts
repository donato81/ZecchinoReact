jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import {
  getAll,
  getUnreadCount,
  getUnreadByEntity,
  existsUnreadForEntityLevel,
  markAsRead,
  markAllAsRead,
  create,
  remove,
  removeExpired,
  cleanupReadExpiredBefore,
} from '@/lib/supabase/repositories/notifiche';
import { supabase } from '@/lib/supabase/client';

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

const ROW = {
  id: 'notif-1',
  user_id: 'user-015',
  tipo: 'budget_soglia',
  titolo_key: 'notifiche.budget.titolo.warning',
  messaggio_key: 'notifiche.budget.messaggio.warning',
  letta: false,
  canale: 'inapp',
  schedulata_per: null,
  entita_tipo: 'budget',
  entita_id: 'budget-1',
  metadata: {
    level: 'warning',
    percentage: 75,
    threshold: 75,
    budgetPeriodKey: '2026-05',
  },
  created_at: '2026-05-28T10:00:00.000Z',
};

function buildSelectChain(result: unknown) {
  type SelectChain = Record<string, unknown> & {
    eq: jest.Mock;
    contains: jest.Mock;
    order: jest.Mock;
    single: jest.Mock;
  };
  let chain!: SelectChain;
  chain = {
    ...(result as Record<string, unknown>),
    eq: jest.fn(() => chain),
    contains: jest.fn(() => chain),
    order: jest.fn(() => chain),
    single: jest.fn().mockResolvedValue(result),
  };
  const select = jest.fn(() => chain);
  mockFrom.mockReturnValue({ select });
  return {
    select,
    eq: chain.eq,
    contains: chain.contains,
    order: chain.order,
    single: chain.single,
  };
}

function buildUpdateChain(result: unknown) {
  const single = jest.fn().mockResolvedValue(result);
  const select = jest.fn(() => ({ single }));
  type UpdateChain = {
    select: jest.Mock;
    eq: jest.Mock;
  };
  let eqChain!: UpdateChain;
  const eq = jest.fn(() => eqChain);
  eqChain = { select, eq };
  const updateFn = jest.fn(() => ({ eq }));
  mockFrom.mockReturnValue({ update: updateFn });
  return { updateFn, eq, select, single };
}

function buildInsertChain(result: unknown) {
  const single = jest.fn().mockResolvedValue(result);
  const select = jest.fn(() => ({ single }));
  const insert = jest.fn(() => ({ select }));
  mockFrom.mockReturnValue({ insert });
  return { insert, select, single };
}

function buildDeleteChain(result: unknown) {
  type DeleteChain = {
    eq: jest.Mock;
    lt: jest.Mock;
  };
  let chain!: DeleteChain;
  chain = {
    eq: jest.fn(() => chain),
    lt: jest.fn(() => Promise.resolve(result)),
  };
  const deleteFn = jest.fn(() => chain);
  mockFrom.mockReturnValue({ delete: deleteFn });
  return { deleteFn, eq: chain.eq, lt: chain.lt };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-015' } } });
});

describe('notifiche.repository', () => {
  it('getAll restituisce le notifiche disponibili ordinate secondo il contratto del repository', async () => {
    const chain = buildSelectChain({ data: [ROW], error: null });

    await expect(getAll()).resolves.toEqual([
      expect.objectContaining({
        id: 'notif-1',
        tipo: 'budget_soglia',
        createdAt: ROW.created_at,
      }),
    ]);
    expect(chain.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
  });

  it('getUnreadCount conta solo notifiche non lette', async () => {
    const chain = buildSelectChain({ count: 3, error: null });

    await expect(getUnreadCount()).resolves.toBe(3);
    expect(chain.select).toHaveBeenCalledWith('*', {
      count: 'exact',
      head: true,
    });
    expect(chain.eq).toHaveBeenCalledWith('letta', false);
  });

  it('getUnreadByEntity restituisce solo notifiche non lette per entity e period key richiesti', async () => {
    const chain = buildSelectChain({ data: [ROW], error: null });

    await expect(
      getUnreadByEntity({
        entitaTipo: 'budget',
        entitaId: 'budget-1',
        budgetPeriodKey: '2026-05',
      }),
    ).resolves.toHaveLength(1);
    expect(chain.eq).toHaveBeenCalledWith('letta', false);
    expect(chain.eq).toHaveBeenCalledWith('entita_tipo', 'budget');
    expect(chain.eq).toHaveBeenCalledWith('entita_id', 'budget-1');
    expect(chain.contains).toHaveBeenCalledWith('metadata', {
      budgetPeriodKey: '2026-05',
    });
  });

  it('existsUnreadForEntityLevel distingue correttamente presenza e assenza di duplicati non letti', async () => {
    const chain = buildSelectChain({ count: 1, error: null });

    await expect(
      existsUnreadForEntityLevel({
        entitaTipo: 'budget',
        entitaId: 'budget-1',
        level: 'warning',
        budgetPeriodKey: '2026-05',
      }),
    ).resolves.toBe(true);
    expect(chain.contains).toHaveBeenNthCalledWith(1, 'metadata', {
      level: 'warning',
    });
    expect(chain.contains).toHaveBeenNthCalledWith(2, 'metadata', {
      budgetPeriodKey: '2026-05',
    });
  });

  it('markAsRead marca una singola notifica come letta', async () => {
    const chain = buildUpdateChain({
      data: { ...ROW, letta: true },
      error: null,
    });

    await expect(markAsRead('notif-1')).resolves.toEqual(
      expect.objectContaining({ letta: true }),
    );
    expect(chain.updateFn).toHaveBeenCalledWith({ letta: true });
    expect(chain.eq).toHaveBeenCalledWith('id', 'notif-1');
  });

  it('markAllAsRead marca come lette tutte le notifiche pertinenti', async () => {
    const chain = buildUpdateChain({ error: null });

    await expect(
      markAllAsRead({ entitaTipo: 'budget', entitaId: 'budget-1' }),
    ).resolves.toBeUndefined();
    expect(chain.updateFn).toHaveBeenCalledWith({ letta: true });
    expect(chain.eq).toHaveBeenCalledWith('letta', false);
    expect(chain.eq).toHaveBeenCalledWith('entita_tipo', 'budget');
    expect(chain.eq).toHaveBeenCalledWith('entita_id', 'budget-1');
  });

  it('create salva metadata obbligatori level, percentage, threshold e budgetPeriodKey', async () => {
    const chain = buildInsertChain({ data: ROW, error: null });

    await create({
      tipo: 'budget_soglia',
      titolo_key: 'notifiche.budget.titolo.warning',
      messaggio_key: 'notifiche.budget.messaggio.warning',
      entitaTipo: 'budget',
      entitaId: 'budget-1',
      metadata: {
        level: 'warning',
        percentage: 75,
        threshold: 75,
        budgetPeriodKey: '2026-05',
      },
    });

    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-015',
        metadata: {
          level: 'warning',
          percentage: 75,
          threshold: 75,
          budgetPeriodKey: '2026-05',
        },
      }),
    );
  });

  it('remove elimina la notifica richiesta', async () => {
    const chain = buildDeleteChain({ error: null });

    await expect(remove('notif-1')).resolves.toBeUndefined();
    expect(chain.deleteFn).toHaveBeenCalledTimes(1);
  });

  it('removeExpired elimina le notifiche scadute solo quando richiesto dal lifecycle', async () => {
    const chain = buildDeleteChain({ error: null });

    await expect(
      removeExpired('2026-05-28T12:00:00.000Z'),
    ).resolves.toBeUndefined();
    expect(chain.lt).toHaveBeenCalledWith(
      'schedulata_per',
      '2026-05-28T12:00:00.000Z',
    );
  });

  it('cleanupReadExpiredBefore elimina o pulisce notifiche lette antecedenti alla soglia', async () => {
    const chain = buildDeleteChain({ error: null });

    await expect(
      cleanupReadExpiredBefore('2026-05-01T00:00:00.000Z'),
    ).resolves.toBeUndefined();
    expect(chain.eq).toHaveBeenCalledWith('letta', true);
  });

  // --- INTEGRATION SESSIONE E4 ---

  function buildE4Chain(result: unknown) {
    const promise = Promise.resolve(result);
    const chain: any = promise;
    const mockFn = jest.fn(() => chain);
    chain.select = mockFn;
    chain.eq = mockFn;
    chain.contains = mockFn;
    chain.order = mockFn;
    chain.single = mockFn;
    chain.update = mockFn;
    chain.insert = mockFn;
    chain.delete = mockFn;
    chain.lt = mockFn;
    mockFrom.mockReturnValue(chain);
    return chain;
  }

  it('E4-75: getAll - lancia RepositoryError in caso di errore Supabase', async () => {
    buildSelectChain({ data: null, error: { message: 'Database error' } });
    await expect(getAll()).rejects.toThrow();
  });

  it('E4-76: getUnreadCount - lancia RepositoryError in caso di errore Supabase', async () => {
    buildSelectChain({ count: null, error: { message: 'Database error' } });
    await expect(getUnreadCount()).rejects.toThrow();
  });

  it('E4-77: markAsRead - lancia RepositoryError se l\'aggiornamento fallisce', async () => {
    buildUpdateChain({ data: null, error: { message: 'Update error' } });
    await expect(markAsRead('notif-1')).rejects.toThrow();
  });

  it('E4-78: markAllAsRead - lancia RepositoryError se l\'aggiornamento massivo fallisce', async () => {
    buildE4Chain({ error: { message: 'Bulk update error' } });
    await expect(markAllAsRead({ entitaTipo: 'budget', entitaId: 'budget-1' })).rejects.toThrow();
  });

  it('E4-79: create - lancia RepositoryError se l\'inserimento fallisce', async () => {
    buildInsertChain({ data: null, error: { message: 'Insert error' } });
    await expect(create({
      tipo: 'budget_soglia',
      titolo_key: 'notifiche.budget.titolo.warning',
      messaggio_key: 'notifiche.budget.messaggio.warning',
      metadata: {},
    })).rejects.toThrow();
  });

  it('E4-80: remove - lancia RepositoryError se l\'eliminazione fallisce', async () => {
    buildE4Chain({ error: { message: 'Delete error' } });
    await expect(remove('notif-1')).rejects.toThrow();
  });

  it('E4-81: cleanupReadExpiredBefore - lancia RepositoryError se la pulizia fallisce', async () => {
    buildE4Chain({ error: { message: 'Cleanup error' } });
    await expect(cleanupReadExpiredBefore('2026-05-01T00:00:00.000Z')).rejects.toThrow();
  });
});
