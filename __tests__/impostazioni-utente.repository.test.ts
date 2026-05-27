jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

import {
  updatePinSecurityMaterial,
} from '@/lib/supabase/repositories/impostazioni-utente';
import { supabase } from '@/lib/supabase/client';

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

function buildUpdateChain(result: unknown) {
  const single = jest.fn().mockResolvedValue(result);
  const select = jest.fn(() => ({ single }));
  const eq = jest.fn(() => ({ select }));
  const update = jest.fn(() => ({ eq }));

  mockFrom.mockReturnValue({ update });

  return { update, eq, select, single };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-010' } } });
});

describe('impostazioni-utente repository — PLAN 010', () => {
  it('scrive hash, salt e master key cifrata con una singola update', async () => {
    const chain = buildUpdateChain({
      data: {
        nome_visualizzato: null,
        valuta_default: 'EUR',
        pin_privato_hash: 'hash-1',
        pin_kdf_salt: 'salt-1',
        pin_master_key_encrypted: '{"version":1}',
        preferences: {},
      },
      error: null,
    });

    await expect(
      updatePinSecurityMaterial({
        hash: 'hash-1',
        salt: 'salt-1',
        encryptedMasterKey: '{"version":1}',
      }),
    ).resolves.toBeUndefined();

    expect(mockFrom).toHaveBeenCalledWith('impostazioni_utente');
    expect(chain.update).toHaveBeenCalledWith({
      pin_privato_hash: 'hash-1',
      pin_kdf_salt: 'salt-1',
      pin_master_key_encrypted: '{"version":1}',
    });
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-010');
    expect(chain.select).toHaveBeenCalledTimes(1);
    expect(chain.single).toHaveBeenCalledTimes(1);
  });

  it('tratta response.error come fallimento atomico', async () => {
    buildUpdateChain({
      data: null,
      error: { message: 'boom' },
    });

    await expect(
      updatePinSecurityMaterial({
        hash: 'hash-1',
        salt: 'salt-1',
        encryptedMasterKey: '{"version":1}',
      }),
    ).rejects.toThrow(/aggiornamento fallito/i);
  });

  it('rifiuta materiali crittografici parziali', async () => {
    await expect(
      updatePinSecurityMaterial({
        hash: 'hash-1',
        salt: 'salt-1',
        encryptedMasterKey: null,
      }),
    ).rejects.toThrow(/tutti null o tutti non-null/i);
  });
});