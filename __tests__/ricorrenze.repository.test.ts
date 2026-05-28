jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

import {
  getAll,
  getById,
  getDue,
  create,
  update,
  deactivate,
} from '@/lib/supabase/repositories/ricorrenze'
import { supabase } from '@/lib/supabase/client'

const mockGetUser = supabase.auth.getUser as jest.Mock
const mockFrom = supabase.from as jest.Mock

const RECURRENZA_ROW = {
  id: 'ric-1',
  user_id: 'user-013',
  conto_id: 'conto-1',
  categoria_id: null,
  tipo: 'uscita',
  importo: 125.5,
  descrizione: 'Affitto',
  frequenza: 'mensile',
  data_inizio: '2026-05-01',
  data_fine: null,
  ultima_generazione: '2026-05-01',
  prossima_generazione: '2026-06-01',
  attiva: true,
  created_at: '2026-05-01T10:00:00.000Z',
  updated_at: '2026-05-01T10:00:00.000Z',
}

function buildSelectChain(result: unknown) {
  const single = jest.fn().mockResolvedValue(result)
  type SelectChain = Record<string, unknown> & {
    eq: jest.Mock
    order: jest.Mock
    single: jest.Mock
    lte: jest.Mock
    or: jest.Mock
  }

  let chain!: SelectChain
  chain = {
    ...(result as Record<string, unknown>),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    single,
    lte: jest.fn(() => chain),
    or: jest.fn(() => chain),
  }
  const select = jest.fn(() => chain)

  mockFrom.mockReturnValue({ select })

  return { select, eq: chain.eq, order: chain.order, single, lte: chain.lte, or: chain.or }
}

function buildInsertChain(result: unknown) {
  const single = jest.fn().mockResolvedValue(result)
  const select = jest.fn(() => ({ single }))
  const insert = jest.fn(() => ({ select }))

  mockFrom.mockReturnValue({ insert })

  return { insert, select, single }
}

function buildUpdateChain(result: unknown) {
  const single = jest.fn().mockResolvedValue(result)
  const select = jest.fn(() => ({ single }))
  const eq = jest.fn(() => ({ select }))
  const updateFn = jest.fn(() => ({ eq }))

  mockFrom.mockReturnValue({ update: updateFn })

  return { updateFn, eq, select, single }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-013' } } })
})

describe('ricorrenze.repository', () => {
  it('getAll restituisce tutte le ricorrenze dell\'utente autenticato senza filtri', async () => {
    const chain = buildSelectChain({ data: [RECURRENZA_ROW], error: null })

    await expect(getAll()).resolves.toEqual([
      expect.objectContaining({
        id: 'ric-1',
        contoId: 'conto-1',
        categoriaId: undefined,
        prossimaGenerazione: '2026-06-01',
      }),
    ])

    expect(mockFrom).toHaveBeenCalledWith('ricorrenze')
    expect(chain.select).toHaveBeenCalledWith('*')
    expect(chain.order).toHaveBeenCalledWith('prossima_generazione', { ascending: true })
  })

  it('getAll applica i filtri attiva e contoId quando forniti', async () => {
    const chain = buildSelectChain({ data: [RECURRENZA_ROW], error: null })

    await getAll({ attiva: true, contoId: 'conto-1' })

    expect(chain.eq).toHaveBeenNthCalledWith(1, 'attiva', true)
    expect(chain.eq).toHaveBeenNthCalledWith(2, 'conto_id', 'conto-1')
  })

  it('getById restituisce la ricorrenza richiesta quando presente', async () => {
    const chain = buildSelectChain({ data: RECURRENZA_ROW, error: null })

    await expect(getById('ric-1')).resolves.toEqual(
      expect.objectContaining({ id: 'ric-1', tipo: 'uscita' }),
    )

    expect(chain.eq).toHaveBeenCalledWith('id', 'ric-1')
    expect(chain.single).toHaveBeenCalledTimes(1)
  })

  it('getById gestisce il caso not found con chiave errors.ricorrenze.notFound', async () => {
    buildSelectChain({ data: null, error: { code: 'PGRST116', message: 'not found' } })

    await expect(getById('missing')).rejects.toThrow('Ricorrenza non trovata.')
  })

  it('getDue usa la data locale YYYY-MM-DD e filtra in query per prossima_generazione, attiva e data_fine valida', async () => {
    const chain = buildSelectChain({ data: [RECURRENZA_ROW], error: null })
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-06-02T09:30:00.000Z'))

    await getDue()

    expect(chain.lte).toHaveBeenCalledWith('prossima_generazione', '2026-06-02')
    expect(chain.eq).toHaveBeenCalledWith('attiva', true)
    expect(chain.or).toHaveBeenCalledWith('data_fine.is.null,data_fine.gte.2026-06-02')

    jest.useRealTimers()
  })

  it('create inietta automaticamente user_id e salva categoriaId secondo il mapping approvato', async () => {
    const chain = buildInsertChain({ data: RECURRENZA_ROW, error: null })

    await create({
      contoId: 'conto-1',
      categoriaId: undefined,
      tipo: 'uscita',
      importo: 125.5,
      descrizione: 'Affitto',
      frequenza: 'mensile',
      dataInizio: '2026-05-01',
      dataFine: undefined,
      ultimaGenerazione: undefined,
      prossimaGenerazione: '2026-06-01',
      attiva: true,
    })

    expect(mockGetUser).toHaveBeenCalledTimes(1)
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-013',
      conto_id: 'conto-1',
      categoria_id: null,
      prossima_generazione: '2026-06-01',
    }))
  })

  it('update applica modifiche parziali senza calcolare prossima_generazione', async () => {
    const chain = buildUpdateChain({
      data: { ...RECURRENZA_ROW, descrizione: 'Affitto casa' },
      error: null,
    })

    await update('ric-1', { descrizione: 'Affitto casa', categoriaId: 'cat-1' })

    expect(chain.updateFn).toHaveBeenCalledWith({
      categoria_id: 'cat-1',
      descrizione: 'Affitto casa',
    })
    expect(chain.eq).toHaveBeenCalledWith('id', 'ric-1')
  })

  it('deactivate imposta attiva = false senza rimuovere fisicamente il record', async () => {
    const chain = buildUpdateChain({
      data: { ...RECURRENZA_ROW, attiva: false },
      error: null,
    })

    await deactivate('ric-1')

    expect(chain.updateFn).toHaveBeenCalledWith({ attiva: false })
    expect(chain.eq).toHaveBeenCalledWith('id', 'ric-1')
  })

  it('il repository propaga gli errori di lettura o scrittura con handling coerente', async () => {
    buildSelectChain({ data: null, error: { message: 'boom', code: '500', details: '', hint: '' } })
    await expect(getAll()).rejects.toThrow('Impossibile caricare le ricorrenze.')

    buildInsertChain({ data: null, error: { message: 'insert failed', code: '500', details: '', hint: '' } })
    await expect(create({
      contoId: 'conto-1',
      categoriaId: 'cat-1',
      tipo: 'uscita',
      importo: 1,
      descrizione: 'Test',
      frequenza: 'mensile',
      dataInizio: '2026-05-01',
      dataFine: undefined,
      ultimaGenerazione: undefined,
      prossimaGenerazione: '2026-06-01',
      attiva: true,
    })).rejects.toThrow('Impossibile creare la ricorrenza.')

    buildUpdateChain({ data: null, error: { message: 'update failed', code: '500', details: '', hint: '' } })
    await expect(update('ric-1', { descrizione: 'Nope' })).rejects.toThrow('Impossibile aggiornare la ricorrenza.')

    buildUpdateChain({ data: null, error: { message: 'deactivate failed', code: '500', details: '', hint: '' } })
    await expect(deactivate('ric-1')).rejects.toThrow('Impossibile disattivare la ricorrenza.')
  })
})