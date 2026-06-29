import { supabase } from '@/lib/supabase/client';
import {
  getByPrestitoId,
  addRimborso,
  deleteRimborso,
} from '@/lib/supabase/repositories/prestiti-rimborsi';

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

describe('Repository Prestiti Rimborsi', () => {
  const mockRimborsoDb = {
    id: 'rimborso-1',
    prestito_id: 'prestito-1',
    user_id: 'user-123',
    importo: 500,
    data_rimborso: '2023-02-01',
    quota_capitale: 400,
    quota_interessi: 100,
    note: null,
  };

  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);
  });

  describe('getByPrestitoId', () => {
    it('should retrieve rimborsi for a prestito', async () => {
      mockQuery.order.mockResolvedValueOnce({
        data: [mockRimborsoDb],
        error: null,
      });

      const result = await getByPrestitoId('prestito-1');

      expect(supabase.from).toHaveBeenCalledWith('prestiti_rimborsi');
      expect(mockQuery.eq).toHaveBeenCalledWith('prestito_id', 'prestito-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rimborso-1');
    });
  });

  describe('addRimborso', () => {
    it('should call rpc and fetch the created rimborso', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: 'rimborso-1',
        error: null,
      });
      mockQuery.single.mockResolvedValueOnce({
        data: mockRimborsoDb,
        error: null,
      });

      const result = await addRimborso({
        prestitoId: 'prestito-1',
        importo: 500,
        dataRimborso: '2023-02-01',
        quotaCapitale: 400,
        quotaInteressi: 100,
      });

      expect(supabase.rpc).toHaveBeenCalledWith('rpc_aggiungi_rimborso', {
        p_prestito_id: 'prestito-1',
        p_importo: 500,
        p_data_rimborso: '2023-02-01',
        p_quota_capitale: 400,
        p_quota_interessi: 100,
        p_note: null,
      });

      expect(supabase.from).toHaveBeenCalledWith('prestiti_rimborsi');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'rimborso-1');
      expect(result.id).toBe('rimborso-1');
    });
  });

  describe('deleteRimborso', () => {
    it('should call rpc to delete rimborso', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({ error: null });

      await expect(deleteRimborso('rimborso-1')).resolves.toBeUndefined();

      expect(supabase.rpc).toHaveBeenCalledWith('rpc_elimina_rimborso', {
        p_rimborso_id: 'rimborso-1',
      });
    });
  });

  // --- INTEGRATION SESSIONE E4 ---

  describe('E4 Integration Tests', () => {
    it('E4-55: getByPrestitoId - ritorna array vuoto se non ci sono rimborsi', async () => {
      mockQuery.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getByPrestitoId('prestito-1');
      expect(result).toHaveLength(0);
    });

    it('E4-56: getByPrestitoId - lancia RepositoryError in caso di errore Supabase', async () => {
      mockQuery.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(getByPrestitoId('prestito-1')).rejects.toThrow();
    });

    it('E4-57: addRimborso - lancia RepositoryError se RPC fallisce', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC error' },
      });

      await expect(addRimborso({
        prestitoId: 'prestito-1',
        importo: 500,
        dataRimborso: '2023-02-01',
        quotaCapitale: 400,
        quotaInteressi: 100,
      })).rejects.toThrow();
    });

    it('E4-58: addRimborso - lancia RepositoryError se il recupero del record creato fallisce', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: 'rimborso-1',
        error: null,
      });
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Fetch failed' },
      });

      await expect(addRimborso({
        prestitoId: 'prestito-1',
        importo: 500,
        dataRimborso: '2023-02-01',
        quotaCapitale: 400,
        quotaInteressi: 100,
      })).rejects.toThrow();
    });

    it('E4-59: addRimborso - passa correttamente il campo note opzionale', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: 'rimborso-1',
        error: null,
      });
      mockQuery.single.mockResolvedValueOnce({
        data: mockRimborsoDb,
        error: null,
      });

      await addRimborso({
        prestitoId: 'prestito-1',
        importo: 500,
        dataRimborso: '2023-02-01',
        quotaCapitale: 400,
        quotaInteressi: 100,
        note: 'Nota rimborso'
      });

      expect(supabase.rpc).toHaveBeenCalledWith('rpc_aggiungi_rimborso', expect.objectContaining({
        p_note: 'Nota rimborso'
      }));
    });

    it('E4-60: deleteRimborso - lancia RepositoryError se RPC di eliminazione fallisce', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        error: { message: 'Delete RPC failed' },
      });

      await expect(deleteRimborso('rimborso-1')).rejects.toThrow();
    });

    it('E4-61: Rimborso mapping - verifica conversione snake_case in camelCase', async () => {
      mockQuery.order.mockResolvedValueOnce({
        data: [{
          id: 'rim-1',
          prestito_id: 'pres-1',
          user_id: 'usr-1',
          importo: 100,
          data_rimborso: '2026-06-30',
          quota_capitale: 80,
          quota_interessi: 20,
          note: 'Ok'
        }],
        error: null,
      });

      const result = await getByPrestitoId('prestito-1');
      expect(result[0]).toEqual({
        id: 'rim-1',
        prestitoId: 'pres-1',
        importo: 100,
        dataRimborso: '2026-06-30',
        quotaCapitale: 80,
        quotaInteressi: 20,
        note: 'Ok'
      });
    });
  });
});
