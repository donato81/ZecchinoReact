jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

import {
  updatePinSecurityMaterial,
  getOrCreate,
  updateField,
  updatePreference,
  updatePinHashAndSalt
} from '@/lib/supabase/repositories/impostazioni-utente';
import { supabase } from '@/lib/supabase/client';
import { Budget } from '@/lib/types';

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

  // --- INTEGRATION SESSIONE E4 ---

  it('E4-45: getOrCreate - recupera le impostazioni esistenti', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: { user_id: 'user-010', valuta_default: 'EUR', preferences: {} },
      error: null
    });
    mockFrom.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockMaybeSingle
        }))
      }))
    });

    const result = await getOrCreate();
    expect(result.valutaDefault).toBe('EUR');
    expect(mockMaybeSingle).toHaveBeenCalled();
  });

  it('E4-46: getOrCreate - gestisce race condition 23505 su insert', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockSingleInsert = jest.fn().mockResolvedValue({ data: null, error: { code: '23505' } });
    const mockSingleRetry = jest.fn().mockResolvedValue({
      data: { user_id: 'user-010', valuta_default: 'USD', preferences: {} },
      error: null
    });

    mockFrom.mockImplementation((table) => {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: mockMaybeSingle,
            single: mockSingleRetry
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: mockSingleInsert
          }))
        }))
      };
    });

    const result = await getOrCreate();
    expect(result.valutaDefault).toBe('USD');
  });

  it('E4-47: getOrCreate - lancia eccezione se insert fallisce per errore generico', async () => {
    mockFrom.mockImplementation(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: { code: '42P01', message: 'Table not found' } })
        }))
      }))
    }));

    await expect(getOrCreate()).rejects.toThrow();
  });

  it('E4-48: updateField - aggiorna singola chiave correttamente', async () => {
    const chain = buildUpdateChain({
      data: { user_id: 'user-010', valuta_default: 'USD', preferences: {} },
      error: null
    });

    const result = await updateField('valutaDefault', 'USD');
    expect(result.valutaDefault).toBe('USD');
    expect(chain.update).toHaveBeenCalledWith({ valuta_default: 'USD' });
  });

  it('E4-49: updateFields - non invia parametri undefined', async () => {
    const chain = buildUpdateChain({
      data: { user_id: 'user-010', valuta_default: 'EUR', preferences: {} },
      error: null
    });

    await updateField('valutaDefault', 'EUR');
    expect(chain.update).toHaveBeenCalledWith({ valuta_default: 'EUR' });
    const payload = (chain.update as any).mock.calls[0][0];
    expect(Object.keys(payload)).toEqual(['valuta_default']);
  });

  it('E4-51: updatePreference - chiama RPC update_impostazioni_preference', async () => {
    const mockRpc = jest.fn().mockResolvedValue({
      data: [{ user_id: 'user-010', preferences: { audio_enabled: false } }],
      error: null
    });
    supabase.rpc = mockRpc;

    const result = await updatePreference('audio_enabled', false);
    expect(mockRpc).toHaveBeenCalledWith('update_impostazioni_preference', {
      p_chiave: 'audio_enabled',
      p_valore: false
    });
    expect(result.preferences).toEqual({ audio_enabled: false });
  });

  it('E4-52: updatePreference - fallisce se RPC fallisce o restituisce vuoto', async () => {
    const mockRpc = supabase.rpc as jest.Mock;
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC Failed' } });
    await expect(updatePreference('audio_enabled', false)).rejects.toThrow();

    mockRpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(updatePreference('audio_enabled', false)).rejects.toThrow('Impostazioni non trovate dopo il merge');
  });

  it('E4-53: updatePinHashAndSalt - lancia errore se invocata con parametri non null', async () => {
    await expect(updatePinHashAndSalt('hash', 'salt')).rejects.toThrow(/usare updatePinSecurityMaterial/);
  });

  it('E4-54: getUid - lancia errore se getUser restituisce utente non autenticato', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(updateField('valutaDefault', 'EUR')).rejects.toThrow('Utente non autenticato');
  });
});
