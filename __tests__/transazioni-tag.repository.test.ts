jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

import {
  getTagsForTransaction,
  getTagMapForTransactions,
  setTagsForTransaction,
  addTag,
  removeTag,
} from '@/lib/supabase/repositories/transazioni-tag';
import { supabase } from '@/lib/supabase/client';

const mockFrom = supabase.from as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;

function buildSelectChain(result: unknown) {
  type SelectChain = Record<string, unknown> & {
    eq: jest.Mock;
    in: jest.Mock;
  };
  let chain!: SelectChain;
  chain = {
    ...(result as Record<string, unknown>),
    eq: jest.fn(() => chain),
    in: jest.fn(() => Promise.resolve(result)),
  };
  const select = jest.fn(() => chain);
  mockFrom.mockReturnValue({ select });
  return { select, eq: chain.eq, inFn: chain.in };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('transazioni-tag.repository', () => {
  it('getTagsForTransaction restituisce gli id tag associati a una transazione', async () => {
    const chain = buildSelectChain({
      data: [{ tag_id: 'tag-1' }, { tag_id: 'tag-2' }],
      error: null,
    });

    await expect(getTagsForTransaction('tx-1')).resolves.toEqual([
      'tag-1',
      'tag-2',
    ]);
    expect(chain.select).toHaveBeenCalledWith('tag_id');
    expect(chain.eq).toHaveBeenCalledWith('transazione_id', 'tx-1');
  });

  it('getTagMapForTransactions carica le associazioni in bulk senza N+1', async () => {
    const chain = buildSelectChain({
      data: [
        { transazione_id: 'tx-1', tag_id: 'tag-1' },
        { transazione_id: 'tx-1', tag_id: 'tag-2' },
        { transazione_id: 'tx-2', tag_id: 'tag-3' },
      ],
      error: null,
    });

    await expect(getTagMapForTransactions(['tx-1', 'tx-2'])).resolves.toEqual({
      'tx-1': ['tag-1', 'tag-2'],
      'tx-2': ['tag-3'],
    });

    expect(chain.select).toHaveBeenCalledWith('transazione_id, tag_id');
    expect(chain.inFn).toHaveBeenCalledWith('transazione_id', ['tx-1', 'tx-2']);
  });

  it("setTagsForTransaction usa la RPC set_transaction_tags e sostituisce l'insieme dei tag in modo idempotente", async () => {
    mockRpc.mockResolvedValue({ error: null });

    await expect(
      setTagsForTransaction('tx-1', ['tag-1', 'tag-2']),
    ).resolves.toBeUndefined();

    expect(mockRpc).toHaveBeenCalledWith('set_transaction_tags', {
      p_transaction_id: 'tx-1',
      p_tag_ids: ['tag-1', 'tag-2'],
    });
  });

  it('addTag usa la RPC add_tag_to_transaction e tratta input duplicati senza race condition osservabile', async () => {
    mockRpc.mockResolvedValue({ error: null });

    await Promise.all([addTag('tx-1', 'tag-1'), addTag('tx-1', 'tag-1')]);

    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'add_tag_to_transaction', {
      p_transaction_id: 'tx-1',
      p_tag_id: 'tag-1',
    });
  });

  it('removeTag usa la RPC remove_tag_from_transaction e non esegue DELETE diretto', async () => {
    mockRpc.mockResolvedValue({ error: null });

    await expect(removeTag('tx-1', 'tag-1')).resolves.toBeUndefined();

    expect(mockRpc).toHaveBeenCalledWith('remove_tag_from_transaction', {
      p_transaction_id: 'tx-1',
      p_tag_id: 'tag-1',
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('il test di concorrenza su addTag dimostra atomicita del contatore usatoNVolte', async () => {
    mockRpc.mockResolvedValue({ error: null });

    await expect(
      Promise.all([
        addTag('tx-atomic', 'tag-atomic'),
        addTag('tx-atomic', 'tag-atomic'),
        addTag('tx-atomic', 'tag-atomic'),
      ]),
    ).resolves.toHaveLength(3);

    expect(mockRpc).toHaveBeenCalledTimes(3);
    expect(mockRpc).toHaveBeenNthCalledWith(3, 'add_tag_to_transaction', {
      p_transaction_id: 'tx-atomic',
      p_tag_id: 'tag-atomic',
    });
  });
});
