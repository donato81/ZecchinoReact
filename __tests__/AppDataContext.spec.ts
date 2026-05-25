/**
 * Test PLAN 007 — AppDataContext (bug N9 + state machine + invariants)
 *
 * Riferimento:
 *   docs/3-coding-plans/007-PLAN_async-cache-hydration_v0.1.0.md
 *   docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md
 *
 * Strategia: testiamo direttamente la funzione pura esportata
 * `readCachedDomainSnapshotPure` che racchiude tutta la logica critica
 * di lettura cache + validazione strutturale (il punto in cui il bug N9
 * si manifestava). Per gli scenari che richiedono il mount completo del
 * Provider (state machine, generation counter su React 18 Strict Mode,
 * concorrenza refreshAll) gli scenari restano dichiarati come `it.todo`:
 * la loro abilitazione richiede l'introduzione di `@testing-library/react`
 * o equivalente harness (fuori scope PLAN 007).
 *
 * PLAN 008 T7 — valutazione: nessuno degli it.todo esistenti dipende
 * specificamente dal contratto rete (useNetworkStatus). Gli scenari
 * "rete OK / rete KO" sono variazioni della state machine bootstrap e
 * restano bloccati dallo stesso vincolo harness. Quando verranno
 * abilitati (PLAN successivo), il mock di rete da usare e' quello
 * descritto in __tests__/use-network-status.spec.ts (jest.mock di
 * '@react-native-community/netinfo' + utility triggerNetInfo).
 * T7: nessuna conversione necessaria.
 */

jest.mock('@/lib/supabase/cache', () => ({
  CACHE_TTL_MS: 1000 * 60 * 60 * 24,
  readCache: jest.fn(),
  writeCache: jest.fn(),
  isCacheStale: jest.fn(),
}))

// Mock minimi per evitare side-effect di import a catena
jest.mock('@/lib/supabase/client', () => ({ supabase: {} }), { virtual: true })

import { readCachedDomainSnapshotPure } from '@/context/app-data-cache'
import { readCache, isCacheStale } from '@/lib/supabase/cache'

const mockReadCache = readCache as jest.MockedFunction<typeof readCache>
const mockIsCacheStale = isCacheStale as jest.MockedFunction<typeof isCacheStale>

const USER = 'user-test-007'

function entry<T>(data: T, cachedAt = new Date().toISOString()) {
  return { data, cachedAt, version: 1 }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockIsCacheStale.mockResolvedValue(false)
})

describe('AppDataContext — PLAN 007', () => {
  describe('Bug N9 — readCachedDomainSnapshotPure (INV1, INV2)', () => {
    it('await su tutte e 5 le readCache (Promise.all)', async () => {
      mockReadCache.mockResolvedValue(null)
      await readCachedDomainSnapshotPure(USER)
      expect(mockReadCache).toHaveBeenCalledTimes(5)
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'conti')
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'transazioni')
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'categorie')
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'budget')
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'obiettivi_risparmio')
    })

    it('Caso A — cache valida con 5 array vuoti → snapshot con array vuoti (INV5 vuoto legittimo)', async () => {
      mockReadCache.mockImplementation(async () => entry([] as never))
      const out = await readCachedDomainSnapshotPure(USER)
      expect(out).not.toBeNull()
      expect(out?.snapshot.accounts).toEqual([])
      expect(out?.snapshot.transactions).toEqual([])
      expect(out?.snapshot.categories).toEqual([])
      expect(out?.snapshot.budgets).toEqual([])
      expect(out?.snapshot.savingsGoals).toEqual([])
      expect(out?.isStale).toBe(false)
    })

    it('Caso B — cache miss su una sola tabella → null (no falso positivo)', async () => {
      mockReadCache.mockImplementation(async (_u, table) =>
        table === 'budget' ? null : entry([] as never),
      )
      const out = await readCachedDomainSnapshotPure(USER)
      expect(out).toBeNull()
    })

    it('Bug N9 originale — payload Promise non risolta → null (guard struttura)', async () => {
      // Simula il bug: readCache restituisce CacheEntry il cui .data è una Promise
      // (sintomo storico: assenza di await all'interno della lettura).
      const fakePromise = Promise.resolve([])
      mockReadCache.mockImplementation(
        async () => entry(fakePromise as unknown as never),
      )
      const out = await readCachedDomainSnapshotPure(USER)
      expect(out).toBeNull()
    })

    it('payload non-array (es. oggetto) → null', async () => {
      mockReadCache.mockImplementation(async () => entry({} as unknown as never))
      const out = await readCachedDomainSnapshotPure(USER)
      expect(out).toBeNull()
    })

    it('isStale propagato se ALMENO una tabella è scaduta', async () => {
      mockReadCache.mockImplementation(async () => entry([] as never))
      mockIsCacheStale.mockImplementation(async (_u, table) => table === 'transazioni')
      const out = await readCachedDomainSnapshotPure(USER)
      expect(out?.isStale).toBe(true)
    })

    it('isStale false se TUTTE le tabelle sono fresche', async () => {
      mockReadCache.mockImplementation(async () => entry([] as never))
      mockIsCacheStale.mockResolvedValue(false)
      const out = await readCachedDomainSnapshotPure(USER)
      expect(out?.isStale).toBe(false)
    })
  })

  describe('State machine bootstrap (richiede harness Provider)', () => {
    it.todo('IDLE → HYDRATING al primo render con utente autenticato')
    it.todo('HYDRATING → CACHE-READY con cache presente e validata')
    it.todo('HYDRATING → READY con cache assente e rete OK')
    it.todo('HYDRATING → ERROR con cache assente e rete KO')
    it.todo('CACHE-READY → REMOTE-SYNC al completamento refresh background')
    it.todo('REMOTE-SYNC → READY come stato di quiete')
    it.todo('IDLE → READY diretto vietato (deve attraversare HYDRATING)')
    it.todo('* → IDLE al logout da qualsiasi stato autenticato')
  })

  describe('Concorrenza refreshAll — INV3 (richiede harness Provider)', () => {
    it.todo('invocazioni concorrenti refreshAll: nessuna doppia applyDomainSnapshot')
    it.todo('hydration A pre-B ma termina dopo: B vince (generation counter)')
    it.todo('React 18 Strict Mode double invoke: nessuna doppia transizione READY')
    it.todo('hydration invalidata al logout (transizione * → IDLE)')
  })

  describe('writeCache fail-soft — INV4 (richiede harness Provider)', () => {
    it.todo('errore AsyncStorage.setItem su una tabella: no crash')
    it.todo('errore writeCache: no unhandled promise rejection')
    it.todo('errore writeCache: no alterazione stato React in memoria')
    it.todo('errore su una tabella: altre tabelle vengono comunque scritte')
  })
})

