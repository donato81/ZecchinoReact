jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

import { getAll, getById, create, update, remove } from '@/lib/supabase/repositories/tag'
import { supabase } from '@/lib/supabase/client'

const mockGetUser = supabase.auth.getUser as jest.Mock
const mockFrom = supabase.from as jest.Mock

const TAG_ROW = {
  id: 'tag-1',
  user_id: 'user-014',
  nome: 'Casa',
  colore: '#112233',
  icona: 'home',
  usato_n_volte: 3,
  created_at: '2026-05-28T10:00:00.000Z',
}

function buildSelectChain(result: unknown) {
  const single = jest.fn().mockResolvedValue(result)
  type SelectChain = Record<string, unknown> & {
    eq: jest.Mock
    order: jest.Mock
    single: jest.Mock
  }
  let chain!: SelectChain
  chain = {
    ...(result as Record<string, unknown>),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    single,
  }
  const select = jest.fn(() => chain)
  mockFrom.mockReturnValue({ select })
  return { select, eq: chain.eq, order: chain.order, single }
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

function buildDeleteChain(result: unknown) {
  const eq = jest.fn().mockResolvedValue(result)
  const deleteFn = jest.fn(() => ({ eq }))
  mockFrom.mockReturnValue({ delete: deleteFn })
  return { deleteFn, eq }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-014' } } })
})

describe('tag.repository', () => {
  it("getAll restituisce tutti i tag dell'utente autenticato", async () => {
    const chain = buildSelectChain({ data: [TAG_ROW], error: null })

    await expect(getAll()).resolves.toEqual([
      {
        id: 'tag-1',
        nome: 'Casa',
        colore: '#112233',
        icona: 'home',
        usatoNVolte: 3,
      },
    ])

    expect(chain.order).toHaveBeenCalledWith('nome', { ascending: true })
  })

  it('getById restituisce il tag richiesto quando presente', async () => {
    const chain = buildSelectChain({ data: TAG_ROW, error: null })

    await expect(getById('tag-1')).resolves.toEqual(expect.objectContaining({ id: 'tag-1', nome: 'Casa' }))
    expect(chain.eq).toHaveBeenCalledWith('id', 'tag-1')
    expect(chain.single).toHaveBeenCalledTimes(1)
  })

  it('create crea un tag con i campi opzionali colore e icona quando forniti', async () => {
    const chain = buildInsertChain({ data: TAG_ROW, error: null })

    await create({ nome: 'Casa', colore: '#112233', icona: 'home' })

    expect(mockGetUser).toHaveBeenCalledTimes(1)
    expect(chain.insert).toHaveBeenCalledWith({
      nome: 'Casa',
      colore: '#112233',
      icona: 'home',
      user_id: 'user-014',
      usato_n_volte: 0,
    })
  })

  it('update modifica parzialmente un tag esistente senza alterare i campi non presenti', async () => {
    const chain = buildUpdateChain({ data: { ...TAG_ROW, nome: 'Casa aggiornata' }, error: null })

    await update('tag-1', { nome: 'Casa aggiornata' })

    expect(chain.updateFn).toHaveBeenCalledWith({ nome: 'Casa aggiornata' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'tag-1')
  })

  it('remove elimina fisicamente il tag e delega la rimozione dei link a ON DELETE CASCADE', async () => {
    const chain = buildDeleteChain({ error: null })

    await expect(remove('tag-1')).resolves.toBeUndefined()

    expect(chain.deleteFn).toHaveBeenCalledTimes(1)
    expect(chain.eq).toHaveBeenCalledWith('id', 'tag-1')
  })

  it('il repository tag propaga gli errori di lettura o scrittura con handling coerente', async () => {
    buildSelectChain({ data: null, error: { message: 'boom', code: '500', details: '', hint: '' } })
    await expect(getAll()).rejects.toThrow('Impossibile caricare i tag.')

    buildInsertChain({ data: null, error: { message: 'insert', code: '500', details: '', hint: '' } })
    await expect(create({ nome: 'Casa' })).rejects.toThrow('Impossibile creare il tag.')

    buildUpdateChain({ data: null, error: { message: 'update', code: '500', details: '', hint: '' } })
    await expect(update('tag-1', { nome: 'Errore' })).rejects.toThrow('Impossibile aggiornare il tag.')

    buildDeleteChain({ error: { message: 'delete', code: '500', details: '', hint: '' } })
    await expect(remove('tag-1')).rejects.toThrow('Impossibile eliminare il tag.')
  })
})