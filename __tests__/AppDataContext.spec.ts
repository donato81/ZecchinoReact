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
 * concorrenza refreshAll) gli scenari restano dichiarati come `it.todo`.
 *
 * PLAN 009 T7 aggiunge un harness minimo con react-test-renderer per
 * esercitare solo `handleExportCSV`, lasciando invariati i boundary di
 * bootstrap di PLAN 007/008.
 */

import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'

const mockScreenReaderSuccess = jest.fn()
const mockScreenReaderError = jest.fn()

jest.mock('@/lib/supabase/cache', () => ({
  CACHE_TTL_MS: 1000 * 60 * 60 * 24,
  readCache: jest.fn(),
  writeCache: jest.fn(),
  isCacheStale: jest.fn(),
}))

jest.mock('@/lib/supabase/client', () => ({ supabase: {} }), { virtual: true })
jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('@/hooks/use-network-status', () => ({ useNetworkStatus: jest.fn() }))
jest.mock('@/lib/export-service', () => ({ exportFile: jest.fn() }))
jest.mock('@/lib/helpers', () => ({
  formatCurrency: jest.fn((value: number) => String(value)),
  exportToCSV: jest.fn(() => 'csv-content'),
  getActiveBudgets: jest.fn(() => []),
  getBudgetProgress: jest.fn(() => ({ percentage: 0, spent: 0, remaining: 0 })),
}))
jest.mock('@/lib/budget-alerts', () => ({
  shouldShowBudgetNotification: jest.fn(() => ({ shouldShow: false, level: null })),
  getBudgetNotificationTitle: jest.fn(() => 'Budget'),
}))
jest.mock('@/lib/sound-system', () => ({
  soundSystem: {
    play: jest.fn(),
  },
}))
jest.mock('@/lib/haptic-system', () => ({
  hapticSystem: {
    export: jest.fn(),
    save: jest.fn(),
    income: jest.fn(),
    expense: jest.fn(),
    transfer: jest.fn(),
    delete: jest.fn(),
    accountCreated: jest.fn(),
    accountDeleted: jest.fn(),
    budgetCreated: jest.fn(),
    budgetDeleted: jest.fn(),
    goalCreated: jest.fn(),
    dialogOpen: jest.fn(),
    budgetExceeded: jest.fn(),
    budgetCritical: jest.fn(),
    budgetWarning: jest.fn(),
  },
}))
jest.mock('@/announcements', () => ({
  announce: jest.fn(),
  accounts: {
    announceExportFile: jest.fn((count: number) => ({ text: `export:${count}`, priority: 'polite' })),
    exportError: jest.fn((reason: string) => ({ text: `error:${reason}`, priority: 'assertive' })),
    announceAccountModified: jest.fn(),
    announceAccountCreated: jest.fn(),
    announceTransactionModified: jest.fn(),
    announceTransaction: jest.fn(),
    announceAccountDeleted: jest.fn(),
    announceAccountDeletedGeneric: jest.fn(),
    announceTransactionDeleted: jest.fn(),
  },
  budgets: {
    announceBudgetModified: jest.fn(),
    announceBudgetCreated: jest.fn(),
    announceSavingsGoalModified: jest.fn(),
    announceSavingsGoalCreated: jest.fn(),
    announceBudgetDeleted: jest.fn(),
    announceBudgetDeletedGeneric: jest.fn(),
    announceSavingsGoalDeleted: jest.fn(),
    announceSavingsGoalDeletedGeneric: jest.fn(),
  },
}))
jest.mock('@/lib/supabase/repositories/conti', () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}))
jest.mock('@/lib/supabase/repositories/transazioni', () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}))
jest.mock('@/lib/supabase/repositories/categorie', () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}))
jest.mock('@/lib/supabase/repositories/budget', () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}))
jest.mock('@/lib/supabase/repositories/obiettivi-risparmio', () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  updateProgress: jest.fn(),
}))
jest.mock(
  '@/lib/screen-reader',
  () => ({
    screenReader: {
      announceSuccess: mockScreenReaderSuccess,
      announceError: mockScreenReaderError,
    },
  }),
  { virtual: true },
)

import { AppDataProvider, useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/context/AuthContext'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { readCachedDomainSnapshotPure } from '@/context/app-data-cache'
import { announce, accounts as accountsAnn } from '@/announcements'
import { exportFile } from '@/lib/export-service'
import { exportToCSV } from '@/lib/helpers'
import { soundSystem } from '@/lib/sound-system'
import { hapticSystem } from '@/lib/haptic-system'
import { readCache, isCacheStale } from '@/lib/supabase/cache'
import { getAll as getAllConti } from '@/lib/supabase/repositories/conti'
import { getAll as getAllTransazioni } from '@/lib/supabase/repositories/transazioni'
import { getAll as getAllCategorie } from '@/lib/supabase/repositories/categorie'
import { getAll as getAllBudget } from '@/lib/supabase/repositories/budget'
import { getAll as getAllObiettivi } from '@/lib/supabase/repositories/obiettivi-risparmio'
import { strings } from '@/locales'

const mockReadCache = readCache as jest.MockedFunction<typeof readCache>
const mockIsCacheStale = isCacheStale as jest.MockedFunction<typeof isCacheStale>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>
const mockExportFile = exportFile as jest.MockedFunction<typeof exportFile>
const mockExportToCSV = exportToCSV as jest.MockedFunction<typeof exportToCSV>
const mockAnnounce = announce as jest.MockedFunction<typeof announce>
const mockAnnounceExportFile = accountsAnn.announceExportFile as jest.Mock
const mockExportErrorAnnouncement = accountsAnn.exportError as jest.Mock
const mockSoundPlay = soundSystem.play as jest.Mock
const mockHapticExport = hapticSystem.export as jest.Mock
const mockGetAllConti = getAllConti as jest.MockedFunction<typeof getAllConti>
const mockGetAllTransazioni = getAllTransazioni as jest.MockedFunction<typeof getAllTransazioni>
const mockGetAllCategorie = getAllCategorie as jest.MockedFunction<typeof getAllCategorie>
const mockGetAllBudget = getAllBudget as jest.MockedFunction<typeof getAllBudget>
const mockGetAllObiettivi = getAllObiettivi as jest.MockedFunction<typeof getAllObiettivi>

const USER = 'user-test-007'

type AppDataValue = ReturnType<typeof useAppData>

function entry<T>(data: T, cachedAt = new Date().toISOString()) {
  return { data, cachedAt, version: 1 }
}

function renderAppDataProvider(): {
  getValue: () => AppDataValue
  unmount: () => void
  rerender: () => void
} {
  let captured: AppDataValue | null = null
  let renderer: TestRenderer.ReactTestRenderer

  function CaptureContext(): null {
    captured = useAppData()
    return null
  }

  act(() => {
    renderer = TestRenderer.create(
      React.createElement(
        AppDataProvider,
        null,
        React.createElement(CaptureContext),
      ),
    )
  })

  return {
    getValue: () => {
      if (!captured) {
        throw new Error('AppDataContext non disponibile nel test')
      }
      return captured
    },
    unmount: () => {
      act(() => {
        renderer.unmount()
      })
    },
    rerender: () => {
      act(() => {
        renderer.update(
          React.createElement(
            AppDataProvider,
            null,
            React.createElement(CaptureContext),
          ),
        )
      })
    },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockIsCacheStale.mockResolvedValue(false)
  mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null } as never)
  mockUseNetworkStatus.mockReturnValue({
    isOffline: false,
    isInitialized: true,
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'wifi',
  } as never)
  mockGetAllConti.mockResolvedValue([] as never)
  mockGetAllTransazioni.mockResolvedValue([] as never)
  mockGetAllCategorie.mockResolvedValue([] as never)
  mockGetAllBudget.mockResolvedValue([] as never)
  mockGetAllObiettivi.mockResolvedValue([] as never)
  mockExportFile.mockResolvedValue({ success: true })
  mockExportToCSV.mockReturnValue('csv-content')
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
      const fakePromise = Promise.resolve([])
      mockReadCache.mockImplementation(async () => entry(fakePromise as unknown as never))
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
    // TODO residui PLAN 011: questi scenari richiedono un harness più ricco
    // che controlli transizioni intermedie, cache stale valida e mutazioni
    // auth/logout via onAuthStateChange. L'harness corrente osserva bene gli
    // esiti finali del bootstrap ma non espone ancora questi boundary.
    it('IDLE → HYDRATING al primo render con utente autenticato', async () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: USER } } as never)
      let resolveConti!: (value: never) => void
      mockGetAllConti.mockImplementation(
        () => new Promise((resolve) => { resolveConti = resolve as never }),
      )

      const harness = renderAppDataProvider()

      await act(async () => {
        await Promise.resolve()
      })

      expect(harness.getValue().isLoading).toBe(true)
      expect(harness.getValue().isDataReady).toBe(false)

      await act(async () => {
        resolveConti([] as never)
        await Promise.resolve()
      })

      harness.unmount()
    })
    it.todo('HYDRATING → CACHE-READY con cache presente e validata')
    it('HYDRATING → READY con rete OK e dati caricati', async () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: USER } } as never)

      const harness = renderAppDataProvider()

      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(harness.getValue().isLoading).toBe(false)
      expect(harness.getValue().isDataReady).toBe(true)
      expect(harness.getValue().error).toBeNull()
      harness.unmount()
    })
    it('HYDRATING → ERROR con rete offline confermata e senza timer bootstrap', async () => {
      jest.useFakeTimers()
      mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: USER } } as never)
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isInitialized: true,
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'wifi',
      } as never)

      const harness = renderAppDataProvider()

      await act(async () => {
        await Promise.resolve()
      })

      expect(harness.getValue().isLoading).toBe(false)
      expect(harness.getValue().isDataReady).toBe(false)
      expect(harness.getValue().error).toBe(strings.bootstrap_offline_error)
      expect(mockGetAllConti).not.toHaveBeenCalled()

      harness.unmount()
      jest.useRealTimers()
    })
    it.todo('CACHE-READY → REMOTE-SYNC al completamento refresh background')
    it.todo('REMOTE-SYNC → READY come stato di quiete')
    it.todo('IDLE → READY diretto vietato (deve attraversare HYDRATING)')
    it.todo('* → IDLE al logout da qualsiasi stato autenticato')
  })

  describe('PLAN 011 — bootstrap resiliente', () => {
    afterEach(() => {
      jest.useRealTimers()
    })

    it('Caso 2: online confermato usa timeout nominato di 10 secondi', async () => {
      jest.useFakeTimers()
      mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: USER } } as never)
      mockGetAllConti.mockImplementation(() => new Promise(() => undefined))

      const harness = renderAppDataProvider()

      await act(async () => {
        await Promise.resolve()
      })

      expect(harness.getValue().isLoading).toBe(true)

      await act(async () => {
        jest.advanceTimersByTime(10_000)
        await Promise.resolve()
      })

      expect(harness.getValue().isLoading).toBe(false)
      expect(harness.getValue().error).toBe(strings.bootstrap_timeout_error)
      harness.unmount()
    })

    it('Caso 3: NetInfo non inizializzato attiva il fail-safe dopo 3 secondi', async () => {
      jest.useFakeTimers()
      mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: USER } } as never)
      mockUseNetworkStatus.mockReturnValue({
        isOffline: false,
        isInitialized: false,
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'unknown',
      } as never)

      const harness = renderAppDataProvider()

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockGetAllConti).not.toHaveBeenCalled()

      await act(async () => {
        jest.advanceTimersByTime(3000)
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(mockGetAllConti).toHaveBeenCalledTimes(1)
      expect(harness.getValue().isDataReady).toBe(true)
      harness.unmount()
    })

    it('Decisione 7-bis: risposta tardiva di NetInfo non avvia una seconda hydration', async () => {
      jest.useFakeTimers()
      mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: USER } } as never)

      const networkState = {
        isOffline: false,
        isInitialized: false,
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'unknown',
      }

      mockUseNetworkStatus.mockImplementation(() => networkState as never)

      let resolveConti!: (value: never) => void
      mockGetAllConti.mockImplementation(
        () => new Promise((resolve) => { resolveConti = resolve as never }),
      )

      const harness = renderAppDataProvider()

      await act(async () => {
        jest.advanceTimersByTime(3000)
        await Promise.resolve()
      })

      expect(mockGetAllConti).toHaveBeenCalledTimes(1)

      networkState.isInitialized = true
      networkState.isOffline = true
      networkState.isConnected = false
      networkState.isInternetReachable = false

      harness.rerender()

      expect(mockGetAllConti).toHaveBeenCalledTimes(1)

      await act(async () => {
        resolveConti([] as never)
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(harness.getValue().isDataReady).toBe(true)
      harness.unmount()
    })

    it('ERROR_NETWORK ed ERROR_DATA restano interni e la UI riceve solo messaggi localizzati', async () => {
      jest.useFakeTimers()
      mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: USER } } as never)
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      mockGetAllConti.mockRejectedValueOnce(new Error('boom'))

      const harness = renderAppDataProvider()

      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(harness.getValue().error).toBe(strings.bootstrap_data_error)
      expect(harness.getValue().error).not.toBe('ERROR_DATA')
      expect(harness.getValue().error).not.toBe('ERROR_NETWORK')
      expect(warnSpy).toHaveBeenCalledWith(
        '[AppDataContext] bootstrap failure',
        expect.objectContaining({ kind: 'ERROR_DATA' }),
      )

      warnSpy.mockRestore()
      harness.unmount()
    })

    it('senza autenticazione i dati non vengono caricati anche con rete disponibile', async () => {
      const harness = renderAppDataProvider()

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockGetAllConti).not.toHaveBeenCalled()
      expect(harness.getValue().isDataReady).toBe(false)
      harness.unmount()
    })
  })

  describe('Concorrenza refreshAll — INV3 (richiede harness Provider)', () => {
    // TODO residui PLAN 011: servono promise indipendenti per tutte e 5 le
    // repository, wrapper React.StrictMode e controllo deterministico delle
    // race tra refreshAll e hydration iniziale. Il prerequisito manca nella
    // fixture attuale, pensata solo per bootstrap/export a un singolo consumer.
    it.todo('invocazioni concorrenti refreshAll: nessuna doppia applyDomainSnapshot')
    it.todo('hydration A pre-B ma termina dopo: B vince (generation counter)')
    it.todo('React 18 Strict Mode double invoke: nessuna doppia transizione READY')
    it.todo('hydration invalidata al logout (transizione * → IDLE)')
  })

  describe('writeCache fail-soft — INV4 (richiede harness Provider)', () => {
    // TODO residui PLAN 011: per coprire questi casi serve una fixture che
    // osservi il flush asincrono post-READY e differenzi gli errori per
    // tabella AsyncStorage. Il mock attuale di cache non espone ancora quel
    // livello di granularità né l'ordine dei side effect background.
    it.todo('errore AsyncStorage.setItem su una tabella: no crash')
    it.todo('errore writeCache: no unhandled promise rejection')
    it.todo('errore writeCache: no alterazione stato React in memoria')
    it.todo('errore su una tabella: altre tabelle vengono comunque scritte')
  })

  describe('PLAN 009 — handleExportCSV async branching', () => {
    let logSpy: jest.SpyInstance
    let errorSpy: jest.SpyInstance
    let warnSpy: jest.SpyInstance

    beforeEach(() => {
      logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    })

    afterEach(() => {
      logSpy.mockRestore()
      errorSpy.mockRestore()
      warnSpy.mockRestore()
    })

    it('handleExportCSV ritorna Promise<void>', async () => {
      const harness = renderAppDataProvider()
      const transactions = [{ id: 't1' }] as never
      const accounts = [{ id: 'a1' }] as never

      const promise = harness.getValue().handleExportCSV(transactions, accounts)

      expect(promise).toBeInstanceOf(Promise)
      await expect(promise).resolves.toBeUndefined()
      harness.unmount()
    })

    it('success branch: sound, haptic, toast success e exportFile invocati', async () => {
      const harness = renderAppDataProvider()
      const transactions = [{ id: 't1' }, { id: 't2' }] as never
      const accounts = [{ id: 'a1' }] as never

      await act(async () => {
        await harness.getValue().handleExportCSV(transactions, accounts)
      })

      expect(mockExportToCSV).toHaveBeenCalledWith(transactions, accounts, [])
      expect(mockExportFile).toHaveBeenCalledWith(
        'csv-content',
        expect.stringMatching(/^zecchino-export-\d+\.csv$/),
        'text/csv',
      )
      expect(mockSoundPlay).toHaveBeenCalledWith('export')
      expect(mockHapticExport).toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalledWith('[toast:success]', 'Export completato', '')
      harness.unmount()
    })

    it('cancelled branch: nessun toast di errore e nessun announce errore', async () => {
      const harness = renderAppDataProvider()
      mockExportFile.mockResolvedValueOnce({ success: false, reason: 'CANCELLED' })

      await act(async () => {
        await harness.getValue().handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never)
      })

      expect(errorSpy).not.toHaveBeenCalledWith('[toast:error]', expect.any(String), '')
      expect(mockExportErrorAnnouncement).not.toHaveBeenCalled()
      harness.unmount()
    })

    it('PERMISSION_DENIED -> toast error e announce exportError', async () => {
      const harness = renderAppDataProvider()
      mockExportFile.mockResolvedValueOnce({ success: false, reason: 'PERMISSION_DENIED' })

      await act(async () => {
        await harness.getValue().handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never)
      })

      expect(errorSpy).toHaveBeenCalledWith(
        '[toast:error]',
        'Permesso negato: concedi accesso allo storage',
        '',
      )
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith('PERMISSION_DENIED')
      harness.unmount()
    })

    it('ALREADY_IN_PROGRESS -> toast error localizzato e announce exportError', async () => {
      const harness = renderAppDataProvider()
      mockExportFile.mockResolvedValueOnce({ success: false, reason: 'ALREADY_IN_PROGRESS' })

      await act(async () => {
        await harness.getValue().handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never)
      })

      expect(errorSpy).toHaveBeenCalledWith(
        '[toast:error]',
        'Esportazione già in corso. Attendi il completamento.',
        '',
      )
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith('ALREADY_IN_PROGRESS')
      harness.unmount()
    })

    it('FILESYSTEM_ERROR -> toast error e announce exportError', async () => {
      const harness = renderAppDataProvider()
      mockExportFile.mockResolvedValueOnce({ success: false, reason: 'FILESYSTEM_ERROR' })

      await act(async () => {
        await harness.getValue().handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never)
      })

      expect(errorSpy).toHaveBeenCalledWith('[toast:error]', 'Errore di scrittura, riprova', '')
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith('FILESYSTEM_ERROR')
      harness.unmount()
    })

    it('UNSUPPORTED_PLATFORM -> toast error e announce exportError', async () => {
      const harness = renderAppDataProvider()
      mockExportFile.mockResolvedValueOnce({ success: false, reason: 'UNSUPPORTED_PLATFORM' })

      await act(async () => {
        await harness.getValue().handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never)
      })

      expect(errorSpy).toHaveBeenCalledWith(
        '[toast:error]',
        'Funzionalità non disponibile su questa piattaforma',
        '',
      )
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith('UNSUPPORTED_PLATFORM')
      harness.unmount()
    })

    it('INVALID_PATH -> toast error e announce exportError', async () => {
      const harness = renderAppDataProvider()
      mockExportFile.mockResolvedValueOnce({ success: false, reason: 'INVALID_PATH' })

      await act(async () => {
        await harness.getValue().handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never)
      })

      expect(errorSpy).toHaveBeenCalledWith(
        '[toast:error]',
        'Percorso non valido, scegline un altro',
        '',
      )
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith('INVALID_PATH')
      harness.unmount()
    })

    it('INSUFFICIENT_SPACE -> toast error e announce exportError', async () => {
      const harness = renderAppDataProvider()
      mockExportFile.mockResolvedValueOnce({ success: false, reason: 'INSUFFICIENT_SPACE' })

      await act(async () => {
        await harness.getValue().handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never)
      })

      expect(errorSpy).toHaveBeenCalledWith(
        '[toast:error]',
        'Spazio insufficiente sul dispositivo',
        '',
      )
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith('INSUFFICIENT_SPACE')
      harness.unmount()
    })

    it('UNKNOWN -> toast error e announce exportError generico', async () => {
      const harness = renderAppDataProvider()
      mockExportFile.mockResolvedValueOnce({ success: false, reason: 'UNKNOWN' })

      await act(async () => {
        await harness.getValue().handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never)
      })

      expect(errorSpy).toHaveBeenCalledWith('[toast:error]', "Errore durante l'esportazione", '')
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith('UNKNOWN')
      harness.unmount()
    })

    it('success branch: announceExportFile riceve visibleTransactions.length', async () => {
      const harness = renderAppDataProvider()
      const transactions = [{ id: 't1' }, { id: 't2' }, { id: 't3' }] as never

      await act(async () => {
        await harness.getValue().handleExportCSV(transactions, [{ id: 'a1' }] as never)
      })

      expect(mockAnnounceExportFile).toHaveBeenCalledWith(3)
      expect(mockAnnounce).toHaveBeenCalledWith({ text: 'export:3', priority: 'polite' })
      harness.unmount()
    })

    it('error branches: exportError viene invocato per tutti i 7 reason di errore', async () => {
      const harness = renderAppDataProvider()
      const reasons = [
        'ALREADY_IN_PROGRESS',
        'PERMISSION_DENIED',
        'FILESYSTEM_ERROR',
        'UNSUPPORTED_PLATFORM',
        'INVALID_PATH',
        'INSUFFICIENT_SPACE',
        'UNKNOWN',
      ] as const

      for (const reason of reasons) {
        mockExportFile.mockResolvedValueOnce({ success: false, reason })
        await act(async () => {
          await harness.getValue().handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never)
        })
      }

      expect(mockExportErrorAnnouncement.mock.calls.map(([reason]) => reason)).toEqual(reasons)
      harness.unmount()
    })

    it('assenza chiamate dirette screenReader: announceSuccess e announceError non vengono invocati', async () => {
      const harness = renderAppDataProvider()
      mockExportFile.mockResolvedValueOnce({ success: false, reason: 'PERMISSION_DENIED' })

      await act(async () => {
        await harness.getValue().handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never)
      })

      expect(mockScreenReaderSuccess).not.toHaveBeenCalled()
      expect(mockScreenReaderError).not.toHaveBeenCalled()
      harness.unmount()
    })
  })
})

