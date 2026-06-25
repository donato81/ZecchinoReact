import { supabase } from '@/lib/supabase/client';
import {
  getAll,
  getById,
  getAttivi,
  create,
  update,
  promote,
  close,
  deleteSimulation,
} from '@/lib/supabase/repositories/prestiti';
import { RepositoryError } from '@/lib/supabase/types';
import {
  calcolaSimulazione,
  calcolaDataFinePrevista,
} from '@/lib/loan-calculator';

// Mock dependencies
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('@/lib/loan-calculator', () => ({
  calcolaSimulazione: jest.fn(),
  calcolaDataFinePrevista: jest.fn(),
  calcolaRataMensile: jest.fn(),
}));

describe('Repository Prestiti', () => {
  const mockUserId = 'user-123';
  const mockPrestitoDb = {
    id: 'prestito-1',
    user_id: mockUserId,
    tipo: 'mutuo_finanziamento',
    stato: 'attivo',
    direzione: 'devo',
    controparte_nome: 'Banca',
    importo_iniziale: 100000,
    valuta: 'EUR',
    tasso_annuo: 3.5,
    durata_mesi: 120,
    rata_mensile: 988.86,
    totale_interessi: 18663.2,
    data_inizio: '2023-01-01',
    data_fine_prevista: '2033-01-01',
    saldo_residuo: 100000,
    note: null,
  };

  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: mockUserId } },
    });
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);
  });

  describe('create', () => {
    it('should derive fields and insert', async () => {
      mockQuery.single.mockResolvedValue({ data: mockPrestitoDb, error: null });
      (calcolaSimulazione as jest.Mock).mockReturnValue({
        rataMensile: 988.86,
        totaleInteressi: 18663.2,
        totaleDaPagare: 118663.2,
        pianoAmmortamento: [],
      });
      (calcolaDataFinePrevista as jest.Mock).mockReturnValue('2033-01-01');

      const result = await create({
        tipo: 'mutuo_finanziamento',
        stato: 'attivo',
        direzione: 'devo',
        controparteNome: 'Banca',
        importoIniziale: 100000,
        valuta: 'EUR',
        tassoAnnuo: 3.5,
        durataMesi: 120,
        dataInizio: '2023-01-01',
        saldoResiduo: 100000,
      });

      expect(supabase.from).toHaveBeenCalledWith('prestiti_mutui');
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          rata_mensile: 988.86,
          totale_interessi: 18663.2,
          data_fine_prevista: '2033-01-01',
          user_id: mockUserId,
        }),
      );
      expect(result.id).toBe('prestito-1');
    });
  });

  describe('promote', () => {
    it('should promote a simulation to active', async () => {
      const mockSimulazione = { ...mockPrestitoDb, stato: 'simulazione' };

      // First getById
      mockQuery.single.mockResolvedValueOnce({
        data: mockSimulazione,
        error: null,
      });
      // Then update
      mockQuery.single.mockResolvedValueOnce({
        data: mockPrestitoDb,
        error: null,
      });
      (calcolaSimulazione as jest.Mock).mockReturnValue({
        rataMensile: 988.86,
        totaleInteressi: 18663.2,
        totaleDaPagare: 118663.2,
        pianoAmmortamento: [],
      });
      (calcolaDataFinePrevista as jest.Mock).mockReturnValue('2033-01-01');

      const result = await promote('prestito-1');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          stato: 'attivo',
          saldo_residuo: 100000,
        }),
      );
      expect(result.stato).toBe('attivo');
    });

    it('should throw if not a simulation', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: mockPrestitoDb,
        error: null,
      });

      await expect(promote('prestito-1')).rejects.toThrow(
        'Solo le simulazioni possono essere promosse a contratto attivo.',
      );
    });
  });

  describe('deleteSimulation', () => {
    it('should delete if it is a simulation', async () => {
      const mockSimulazione = { ...mockPrestitoDb, stato: 'simulazione' };
      mockQuery.single.mockResolvedValueOnce({
        data: mockSimulazione,
        error: null,
      });

      // first call in getById returns mockQuery, second call in delete returns a promise
      mockQuery.eq
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce({ error: null });

      await expect(deleteSimulation('prestito-1')).resolves.toBeUndefined();
      expect(mockQuery.delete).toHaveBeenCalled();
    });

    it('should throw if not a simulation', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: mockPrestitoDb,
        error: null,
      });
      mockQuery.eq.mockReturnValueOnce(mockQuery);

      await expect(deleteSimulation('prestito-1')).rejects.toThrow(
        'Solo le simulazioni possono essere eliminate.',
      );
    });
  });
});
