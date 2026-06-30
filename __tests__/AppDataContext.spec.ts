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

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockScreenReaderSuccess = jest.fn();
const mockScreenReaderError = jest.fn();
const mockHydrateUnreadNotifications = jest.fn();
const mockCleanupReadyNotifications = jest.fn();
const mockProcessBudgetNotifications = jest.fn();
const mockResetNotificationService = jest.fn();

jest.mock('@/lib/supabase/cache', () => ({
  CACHE_TTL_MS: 1000 * 60 * 60 * 24,
  readCache: jest.fn(),
  writeCache: jest.fn(),
  isCacheStale: jest.fn(),
}));

jest.mock('@/lib/loan-calculator', () => ({
  __esModule: true,
  calcolaSimulazione: jest.fn(() => ({ rataMensile: 100, totaleInteressi: 200 })),
  calcolaDataFinePrevista: jest.fn(() => '2027-07-01'),
}));

jest.mock('@/lib/supabase/client', () => ({ supabase: {} }), { virtual: true });
jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: jest.fn(),
}));
jest.mock('@/lib/export-service', () => ({ exportFile: jest.fn() }));
jest.mock('@/lib/helpers', () => ({
  formatCurrency: jest.fn((value: number) => String(value)),
  exportToCSV: jest.fn(() => 'csv-content'),
  getActiveBudgets: jest.fn(() => []),
  getBudgetProgress: jest.fn(() => ({ percentage: 0, spent: 0, remaining: 0 })),
}));
jest.mock('@/lib/budget-alerts', () => ({
  shouldShowBudgetNotification: jest.fn(() => ({
    shouldShow: false,
    level: null,
  })),
  getBudgetNotificationTitle: jest.fn(() => 'Budget'),
}));
jest.mock('@/lib/notification-service', () => ({
  createNotificationService: jest.fn(() => ({
    hydrateUnreadNotifications: mockHydrateUnreadNotifications,
    cleanupReadyNotifications: mockCleanupReadyNotifications,
    processBudgetNotifications: mockProcessBudgetNotifications,
    reset: mockResetNotificationService,
  })),
}));
jest.mock('@/lib/sound-system', () => ({
  soundSystem: {
    play: jest.fn(),
  },
}));
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
}));
jest.mock('@/announcements', () => ({
  announce: jest.fn(),
  accounts: {
    announceExportFile: jest.fn((count: number) => ({
      text: `export:${count}`,
      priority: 'polite',
    })),
    exportError: jest.fn((reason: string) => ({
      text: `error:${reason}`,
      priority: 'assertive',
    })),
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
}));
jest.mock('@/lib/supabase/repositories/conti', () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('@/lib/supabase/repositories/transazioni', () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('@/lib/supabase/repositories/categorie', () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('@/lib/supabase/repositories/budget', () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('@/lib/supabase/repositories/obiettivi-risparmio', () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  updateProgress: jest.fn(),
}));
jest.mock('@/lib/supabase/repositories/ricorrenze', () => ({
  getAll: jest.fn(),
}));
jest.mock('@/lib/supabase/repositories/tag', () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('@/lib/supabase/repositories/prestiti', () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  promote: jest.fn(),
  close: jest.fn(),
  deleteSimulation: jest.fn(),
}));
jest.mock('@/lib/supabase/repositories/prestiti-rimborsi', () => ({
  getAll: jest.fn(),
  addRimborso: jest.fn(),
  deleteRimborso: jest.fn(),
}));
jest.mock('@/lib/supabase/repositories/transazioni-tag', () => ({
  getTagsForTransaction: jest.fn(),
  getTagMapForTransactions: jest.fn(),
  setTagsForTransaction: jest.fn(),
  addTag: jest.fn(),
  removeTag: jest.fn(),
}));
jest.mock(
  '@/lib/screen-reader',
  () => ({
    screenReader: {
      announceSuccess: mockScreenReaderSuccess,
      announceError: mockScreenReaderError,
    },
  }),
  { virtual: true },
);

import * as fs from 'fs';
import * as path from 'path';

const originalPath = path.resolve(__dirname, '../src/context/AppDataContext.tsx');
const shadowPath = path.resolve(__dirname, '../src/context/AppDataContext.test-shadow.tsx');

try {
  let content = fs.readFileSync(originalPath, 'utf8');
  content = content.replace(
    /import\(\s*['"]@\/lib\/loan-calculator['"]\s*\)/g,
    "Promise.resolve(require('@/lib/loan-calculator'))"
  );
  fs.writeFileSync(shadowPath, content, 'utf8');
} catch (e) {
  console.error('Failed to create shadow AppDataContext file', e);
}

const { AppDataProvider, useAppData, mergePrestitiWithLocalSimulations } = require('../src/context/AppDataContext.test-shadow');
import { useAuth } from '@/context/AuthContext';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { readCachedDomainSnapshotPure } from '@/context/app-data-cache';
import { announce, accounts as accountsAnn } from '@/announcements';
import { exportFile } from '@/lib/export-service';
import { exportToCSV } from '@/lib/helpers';
import { soundSystem } from '@/lib/sound-system';
import { hapticSystem } from '@/lib/haptic-system';
import { readCache, isCacheStale, writeCache } from '@/lib/supabase/cache';
import { getAll as getAllConti, create as createConto, update as updateConto, remove as removeConto } from '@/lib/supabase/repositories/conti';
import { getAll as getAllTransazioni, create as createTransazione, update as updateTransazione, remove as removeTransazione } from '@/lib/supabase/repositories/transazioni';
import { getAll as getAllCategorie, create as createCategoria, update as updateCategoria, remove as removeCategoria } from '@/lib/supabase/repositories/categorie';
import { getAll as getAllBudget, create as createBudget, update as updateBudget, remove as removeBudget } from '@/lib/supabase/repositories/budget';
import { getAll as getAllObiettivi, create as createObiettivo, update as updateObiettivo, remove as removeObiettivo, updateProgress as updateObiettivoProgress } from '@/lib/supabase/repositories/obiettivi-risparmio';
import { getAll as getAllRicorrenze } from '@/lib/supabase/repositories/ricorrenze';
import { getAll as getAllTag, create as createTag, update as updateTag, remove as removeTag } from '@/lib/supabase/repositories/tag';
import { getAll as getAllPrestiti, create as createPrestitoDb, update as updatePrestitoDb, promote as promotePrestitoDb, close as closePrestitoDb, deleteSimulation as deleteSimulationDb } from '@/lib/supabase/repositories/prestiti';
import { getAll as getAllRimborsi, addRimborso as addRimborsoDb, deleteRimborso as deleteRimborsoDb } from '@/lib/supabase/repositories/prestiti-rimborsi';
import { getTagMapForTransactions } from '@/lib/supabase/repositories/transazioni-tag';
import { strings } from '@/locales';

const mockReadCache = readCache as jest.MockedFunction<typeof readCache>;
const mockIsCacheStale = isCacheStale as jest.MockedFunction<
  typeof isCacheStale
>;
const mockWriteCache = writeCache as jest.MockedFunction<typeof writeCache>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<
  typeof useNetworkStatus
>;
const mockExportFile = exportFile as jest.MockedFunction<typeof exportFile>;
const mockExportToCSV = exportToCSV as jest.MockedFunction<typeof exportToCSV>;
const mockAnnounce = announce as jest.MockedFunction<typeof announce>;
const mockAnnounceExportFile = accountsAnn.announceExportFile as jest.Mock;
const mockExportErrorAnnouncement = accountsAnn.exportError as jest.Mock;
const mockSoundPlay = soundSystem.play as jest.Mock;
const mockHapticExport = hapticSystem.export as jest.Mock;
const mockGetAllConti = getAllConti as jest.MockedFunction<typeof getAllConti>;
const mockGetAllTransazioni = getAllTransazioni as jest.MockedFunction<
  typeof getAllTransazioni
>;
const mockGetAllCategorie = getAllCategorie as jest.MockedFunction<
  typeof getAllCategorie
>;
const mockGetAllBudget = getAllBudget as jest.MockedFunction<
  typeof getAllBudget
>;
const mockGetAllObiettivi = getAllObiettivi as jest.MockedFunction<
  typeof getAllObiettivi
>;
const mockGetAllRicorrenze = getAllRicorrenze as jest.MockedFunction<
  typeof getAllRicorrenze
>;
const mockGetAllTag = getAllTag as jest.MockedFunction<typeof getAllTag>;
const mockGetAllPrestiti = getAllPrestiti as jest.MockedFunction<
  typeof getAllPrestiti
>;
const mockGetAllRimborsi = getAllRimborsi as jest.MockedFunction<
  typeof getAllRimborsi
>;
const mockGetTagMapForTransactions =
  getTagMapForTransactions as jest.MockedFunction<
    typeof getTagMapForTransactions
  >;

const mockCreateConto = createConto as jest.Mock;
const mockUpdateConto = updateConto as jest.Mock;
const mockRemoveConto = removeConto as jest.Mock;

const mockCreateTransazione = createTransazione as jest.Mock;
const mockUpdateTransazione = updateTransazione as jest.Mock;
const mockRemoveTransazione = removeTransazione as jest.Mock;

const mockCreateBudget = createBudget as jest.Mock;
const mockUpdateBudget = updateBudget as jest.Mock;
const mockRemoveBudget = removeBudget as jest.Mock;

const mockCreateCategoria = createCategoria as jest.Mock;
const mockUpdateCategoria = updateCategoria as jest.Mock;
const mockRemoveCategoria = removeCategoria as jest.Mock;

const mockCreateObiettivo = createObiettivo as jest.Mock;
const mockUpdateObiettivo = updateObiettivo as jest.Mock;
const mockRemoveObiettivo = removeObiettivo as jest.Mock;
const mockUpdateObiettivoProgress = updateObiettivoProgress as jest.Mock;

const mockCreateTag = createTag as jest.Mock;
const mockUpdateTag = updateTag as jest.Mock;
const mockRemoveTag = removeTag as jest.Mock;

const mockCreatePrestitoDb = createPrestitoDb as jest.Mock;
const mockUpdatePrestitoDb = updatePrestitoDb as jest.Mock;
const mockPromotePrestitoDb = promotePrestitoDb as jest.Mock;
const mockClosePrestitoDb = closePrestitoDb as jest.Mock;
const mockDeleteSimulationDb = deleteSimulationDb as jest.Mock;

const mockAddRimborsoDb = addRimborsoDb as jest.Mock;
const mockDeleteRimborsoDb = deleteRimborsoDb as jest.Mock;

const USER = 'user-test-007';

type AppDataValue = ReturnType<typeof useAppData>;

function entry<T>(data: T, cachedAt = new Date().toISOString()) {
  return { data, cachedAt, version: 1 };
}

function renderAppDataProvider(): {
  getValue: () => AppDataValue;
  unmount: () => void;
  rerender: () => void;
} {
  let captured: AppDataValue | null = null;
  let renderer: TestRenderer.ReactTestRenderer;

  function CaptureContext(): null {
    captured = useAppData();
    return null;
  }

  act(() => {
    renderer = TestRenderer.create(
      React.createElement(
        AppDataProvider,
        null,
        React.createElement(CaptureContext),
      ),
    );
  });

  return {
    getValue: () => {
      if (!captured) {
        throw new Error('AppDataContext non disponibile nel test');
      }
      return captured;
    },
    unmount: () => {
      act(() => {
        renderer.unmount();
      });
    },
    rerender: () => {
      act(() => {
        renderer.update(
          React.createElement(
            AppDataProvider,
            null,
            React.createElement(CaptureContext),
          ),
        );
      });
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockReadCache.mockResolvedValue(null);
  mockIsCacheStale.mockResolvedValue(false);
  mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null } as never);
  mockUseNetworkStatus.mockReturnValue({
    isOffline: false,
    isInitialized: true,
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'wifi',
  } as never);
  mockGetAllConti.mockResolvedValue([] as never);
  mockGetAllTransazioni.mockResolvedValue([] as never);
  mockGetAllCategorie.mockResolvedValue([] as never);
  mockGetAllBudget.mockResolvedValue([] as never);
  mockGetAllObiettivi.mockResolvedValue([] as never);
  mockGetAllRicorrenze.mockResolvedValue([] as never);
  mockGetAllTag.mockResolvedValue([]);
  mockGetAllPrestiti.mockResolvedValue([]);
  mockGetAllRimborsi.mockResolvedValue([]);
  mockGetTagMapForTransactions.mockResolvedValue({});
  mockHydrateUnreadNotifications.mockResolvedValue([]);
  mockCleanupReadyNotifications.mockResolvedValue(undefined);
  mockProcessBudgetNotifications.mockResolvedValue([]);
  mockResetNotificationService.mockImplementation(() => undefined);
  mockWriteCache.mockResolvedValue(undefined);
  mockExportFile.mockResolvedValue({ success: true });
  mockExportToCSV.mockReturnValue('csv-content');
});

describe('AppDataContext — PLAN 007', () => {
  describe('Bug N9 — readCachedDomainSnapshotPure (INV1, INV2)', () => {
    it('await su tutte le 8 readCache (Promise.all)', async () => {
      mockReadCache.mockResolvedValue(null);
      await readCachedDomainSnapshotPure(USER);
      expect(mockReadCache).toHaveBeenCalledTimes(8);
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'conti');
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'transazioni');
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'categorie');
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'budget');
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'obiettivi_risparmio');
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'ricorrenze');
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'tag');
      expect(mockReadCache).toHaveBeenCalledWith(USER, 'transazioni_tag');
    });

    it('Caso A — cache valida con array vuoti e mappa vuota → snapshot coerente (INV5 vuoto legittimo)', async () => {
      mockReadCache.mockImplementation(async (_u, table) =>
        table === 'transazioni_tag' ? entry({} as never) : entry([] as never),
      );
      const out = await readCachedDomainSnapshotPure(USER);
      expect(out).not.toBeNull();
      expect(out?.snapshot.accounts).toEqual([]);
      expect(out?.snapshot.transactions).toEqual([]);
      expect(out?.snapshot.categories).toEqual([]);
      expect(out?.snapshot.budgets).toEqual([]);
      expect(out?.snapshot.savingsGoals).toEqual([]);
      expect(out?.snapshot.ricorrenze).toEqual([]);
      expect(out?.snapshot.tags).toEqual([]);
      expect(out?.snapshot.transactionTagMap).toEqual({});
      expect(out?.isStale).toBe(false);
    });

    it('Caso B — cache miss su una sola tabella → null (no falso positivo)', async () => {
      mockReadCache.mockImplementation(async (_u, table) =>
        table === 'budget' ? null : entry([] as never),
      );
      const out = await readCachedDomainSnapshotPure(USER);
      expect(out).toBeNull();
    });

    it('Bug N9 originale — payload Promise non risolta → null (guard struttura)', async () => {
      const fakePromise = Promise.resolve([]);
      mockReadCache.mockImplementation(async () =>
        entry(fakePromise as unknown as never),
      );
      const out = await readCachedDomainSnapshotPure(USER);
      expect(out).toBeNull();
    });

    it('payload non-array (es. oggetto) → null', async () => {
      mockReadCache.mockImplementation(async () =>
        entry({} as unknown as never),
      );
      const out = await readCachedDomainSnapshotPure(USER);
      expect(out).toBeNull();
    });

    it('isStale propagato se ALMENO una tabella è scaduta', async () => {
      mockReadCache.mockImplementation(async () => entry([] as never));
      mockIsCacheStale.mockImplementation(
        async (_u, table) => table === 'transazioni',
      );
      const out = await readCachedDomainSnapshotPure(USER);
      expect(out?.isStale).toBe(true);
    });

    it('isStale false se TUTTE le tabelle sono fresche', async () => {
      mockReadCache.mockImplementation(async () => entry([] as never));
      mockIsCacheStale.mockResolvedValue(false);
      const out = await readCachedDomainSnapshotPure(USER);
      expect(out?.isStale).toBe(false);
    });
  });

  describe('State machine bootstrap (richiede harness Provider)', () => {
    // TODO residui PLAN 011: questi scenari richiedono un harness più ricco
    // che controlli transizioni intermedie, cache stale valida e mutazioni
    // auth/logout via onAuthStateChange. L'harness corrente osserva bene gli
    // esiti finali del bootstrap ma non espone ancora questi boundary.
    it('IDLE → HYDRATING al primo render con utente autenticato', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      let resolveConti!: (value: never) => void;
      mockGetAllConti.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveConti = resolve as never;
          }),
      );

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
      });

      expect(harness.getValue().isLoading).toBe(true);
      expect(harness.getValue().isDataReady).toBe(false);

      await act(async () => {
        resolveConti([] as never);
        await Promise.resolve();
      });

      harness.unmount();
    });
    it('HYDRATING → CACHE-READY con cache presente e validata', async () => {
      const cachedAccounts = [{ id: 'conto-1', nome: 'Conto Cash', saldoIniziale: 100 }];
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isInitialized: true,
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'wifi',
      } as never);
      mockReadCache.mockImplementation(async (_u, table) => {
        if (table === 'conti') return entry(cachedAccounts);
        if (table === 'transazioni_tag') return entry({});
        return entry([]);
      });

      const harness = renderAppDataProvider();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(harness.getValue().isDataReady).toBe(true);
      expect(harness.getValue().accounts).toEqual(cachedAccounts);
      harness.unmount();
    });
    it('HYDRATING → READY con rete OK e dati caricati', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().isLoading).toBe(false);
      expect(harness.getValue().isDataReady).toBe(true);
      expect(harness.getValue().error).toBeNull();
      harness.unmount();
    });
    it('READY → hydration secondaria notifiche con fail-soft e flag notificationsHydrated', async () => {
      const notifications = [
        {
          id: 'notif-1',
          tipo: 'budget_soglia',
          titolo: 'Budget',
          letta: false,
          canale: 'inapp',
          createdAt: '2026-05-28T10:00:00.000Z',
        },
      ];
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockHydrateUnreadNotifications.mockResolvedValueOnce(notifications);

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().isDataReady).toBe(true);
      expect(mockHydrateUnreadNotifications).toHaveBeenCalledTimes(1);
      expect(mockCleanupReadyNotifications).toHaveBeenCalledTimes(1);
      expect(harness.getValue().notificationsHydrated).toBe(true);
      expect(harness.getValue().notifications).toEqual(notifications);
      expect(harness.getValue().safeNotifications).toEqual(notifications);
      harness.unmount();
    });
    it('refreshAll riattiva la hydration secondaria notifiche dopo il primo READY', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockHydrateUnreadNotifications.mockResolvedValue([]);

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockHydrateUnreadNotifications).toHaveBeenCalledTimes(1);

      await act(async () => {
        harness.getValue().refreshAll();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockHydrateUnreadNotifications).toHaveBeenCalledTimes(2);
      expect(harness.getValue().notificationsHydrated).toBe(true);
      harness.unmount();
    });
    it('HYDRATING → READY include il fetch remoto delle ricorrenze', async () => {
      const ricorrenze = [
        {
          id: 'ric-1',
          contoId: 'conto-1',
          tipo: 'uscita',
          importo: 50,
          descrizione: 'Abbonamento',
          frequenza: 'mensile',
          dataInizio: '2026-05-01',
          prossimaGenerazione: '2026-06-01',
          attiva: true,
        },
      ];
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockGetAllRicorrenze.mockResolvedValueOnce(ricorrenze as never);

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockGetAllRicorrenze).toHaveBeenCalledTimes(1);
      expect(harness.getValue().ricorrenze).toEqual(ricorrenze);
      expect(harness.getValue().safeRicorrenze).toEqual(ricorrenze);
      expect(harness.getValue().isDataReady).toBe(true);
      harness.unmount();
    });
    it('HYDRATING → READY include il fetch remoto dei tag e della mappa transazioni-tag', async () => {
      const transactions = [{ id: 'tx-1' }];
      const tags = [
        {
          id: 'tag-1',
          nome: 'Casa',
          colore: '#112233',
          icona: 'home',
          usatoNVolte: 2,
        },
      ];
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockGetAllTransazioni.mockResolvedValueOnce(transactions as never);
      mockGetAllTag.mockResolvedValueOnce(tags as never);
      mockGetTagMapForTransactions.mockResolvedValueOnce({ 'tx-1': ['tag-1'] });

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockGetAllTag).toHaveBeenCalledTimes(1);
      expect(mockGetTagMapForTransactions).toHaveBeenCalledWith(['tx-1']);
      expect(harness.getValue().tags).toEqual(tags);
      expect(harness.getValue().safeTags).toEqual(tags);
      expect(harness.getValue().transactionTagMap).toEqual({
        'tx-1': ['tag-1'],
      });
      expect(harness.getValue().safeTransactionTagMap).toEqual({
        'tx-1': ['tag-1'],
      });
      harness.unmount();
    });
    it('HYDRATING → ERROR con rete offline confermata e senza timer bootstrap', async () => {
      jest.useFakeTimers();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isInitialized: true,
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'wifi',
      } as never);

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
      });

      expect(harness.getValue().isLoading).toBe(false);
      expect(harness.getValue().isDataReady).toBe(false);
      expect(harness.getValue().error).toBe(strings.bootstrap_offline_error);
      expect(mockGetAllConti).not.toHaveBeenCalled();

      harness.unmount();
      jest.useRealTimers();
    });
    it('HYDRATING → CACHE-READY con cache valida quando la rete e offline', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isInitialized: true,
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'wifi',
      } as never);
      mockReadCache.mockImplementation(async (_u, table) =>
        table === 'transazioni_tag' ? entry({} as never) : entry([] as never),
      );

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().isLoading).toBe(false);
      expect(harness.getValue().isDataReady).toBe(true);
      expect(harness.getValue().error).toBe(strings.bootstrap_offline_error);
      expect(mockGetAllConti).not.toHaveBeenCalled();
      expect(harness.getValue().transactionTagMap).toEqual({});
      harness.unmount();
    });
    it('ADC-46: payload di cache corrotto (non-array) durante bootstrap offline porta a stato ERROR (fail-soft)', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isInitialized: true,
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'wifi',
      } as never);
      mockReadCache.mockImplementation(async (_u, table) => {
        return entry({} as any);
      });

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().isDataReady).toBe(false);
      expect(harness.getValue().error).toBe(strings.bootstrap_offline_error);
      harness.unmount();
    });
    it('CACHE-READY → REMOTE-SYNC al completamento refresh background', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isInitialized: true,
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'wifi',
      } as never);
      mockReadCache.mockImplementation(async (_u, table) =>
        table === 'transazioni_tag' ? entry({} as never) : entry([] as never),
      );

      let resolveConti!: (value: never) => void;
      mockGetAllConti.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveConti = resolve as never;
          }),
      );

      const harness = renderAppDataProvider();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(harness.getValue().isDataReady).toBe(true);
      expect(harness.getValue().isLoading).toBe(false);

      mockUseNetworkStatus.mockReturnValue({
        isOffline: false,
        isInitialized: true,
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'wifi',
      } as never);
      harness.rerender();

      await act(async () => {
        harness.getValue().refreshAll();
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(harness.getValue().isLoading).toBe(true);
      expect(harness.getValue().isDataReady).toBe(true);

      await act(async () => {
        resolveConti([] as never);
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(harness.getValue().isLoading).toBe(false);
      expect(harness.getValue().isDataReady).toBe(true);
      harness.unmount();
    });

    it('REMOTE-SYNC → READY come stato di quiete', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);

      let resolveConti!: (value: never) => void;
      mockGetAllConti.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveConti = resolve as never;
          }),
      );

      const harness = renderAppDataProvider();

      await act(async () => {
        resolveConti([] as never);
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(harness.getValue().isDataReady).toBe(true);
      expect(harness.getValue().isLoading).toBe(false);

      mockGetAllConti.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveConti = resolve as never;
          }),
      );

      await act(async () => {
        harness.getValue().refreshAll();
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(harness.getValue().isLoading).toBe(true);

      await act(async () => {
        resolveConti([] as never);
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(harness.getValue().isLoading).toBe(false);
      expect(harness.getValue().isDataReady).toBe(true);
      expect(harness.getValue().error).toBeNull();
      harness.unmount();
    });

    it('IDLE → READY diretto vietato (deve attraversare HYDRATING)', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null } as never);
      const harness = renderAppDataProvider();

      const result = harness.getValue().transitionTo!('READY');

      expect(result).toBe(false);
      expect(harness.getValue().isDataReady).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Transizione vietata IDLE → READY'),
      );

      warnSpy.mockRestore();
      harness.unmount();
    });
    it('ADC-37: transizione ERROR → READY non ammessa bloccata', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockUseNetworkStatus.mockReturnValue({
        isOffline: true,
        isInitialized: true,
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'wifi',
      } as never);
      mockReadCache.mockResolvedValue(null);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
      });

      expect(harness.getValue().error).toBe(strings.bootstrap_offline_error);

      const result = harness.getValue().transitionTo!('READY');

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Transizione vietata ERROR → READY'),
      );
      expect(harness.getValue().error).toBe(strings.bootstrap_offline_error);

      warnSpy.mockRestore();
      harness.unmount();
    });
    it('* → IDLE al logout da qualsiasi stato autenticato', async () => {
      const ricorrenze = [
        {
          id: 'ric-1',
          contoId: 'conto-1',
          tipo: 'uscita',
          importo: 50,
          descrizione: 'Abbonamento',
          frequenza: 'mensile',
          dataInizio: '2026-05-01',
          prossimaGenerazione: '2026-06-01',
          attiva: true,
        },
      ];
      const tags = [
        {
          id: 'tag-1',
          nome: 'Casa',
          colore: '#112233',
          icona: 'home',
          usatoNVolte: 2,
        },
      ];
      mockGetAllTransazioni.mockResolvedValueOnce([{ id: 'tx-1' }] as never);
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockGetAllRicorrenze.mockResolvedValueOnce(ricorrenze as never);
      mockGetAllTag.mockResolvedValueOnce(tags as never);
      mockGetTagMapForTransactions.mockResolvedValueOnce({ 'tx-1': ['tag-1'] });

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().isDataReady).toBe(true);

      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      } as never);
      harness.rerender();

      await act(async () => {
        await Promise.resolve();
      });

      expect(harness.getValue().isDataReady).toBe(false);
      expect(harness.getValue().accounts).toEqual([]);
      expect(harness.getValue().transactions).toEqual([]);
      expect(harness.getValue().categories).toEqual([]);
      expect(harness.getValue().budgets).toEqual([]);
      expect(harness.getValue().savingsGoals).toEqual([]);
      expect(harness.getValue().ricorrenze).toEqual([]);
      expect(harness.getValue().tags).toEqual([]);
      expect(harness.getValue().transactionTagMap).toEqual({});
      expect(harness.getValue().safeRicorrenze).toEqual([]);
      expect(harness.getValue().safeTags).toEqual([]);
      expect(harness.getValue().safeTransactionTagMap).toEqual({});
      harness.unmount();
    });

    it('removeAccount ripulisce anche transactionTagMap delle transazioni eliminate', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockGetAllConti.mockResolvedValueOnce([
        { id: 'conto-1', nome: 'Conto' },
      ] as never);
      mockGetAllTransazioni.mockResolvedValueOnce([
        { id: 'tx-1', contoId: 'conto-1', contoDestinazioneId: undefined },
        { id: 'tx-2', contoId: 'altro-conto', contoDestinazioneId: undefined },
      ] as never);
      mockGetAllTag.mockResolvedValueOnce([
        { id: 'tag-1', nome: 'Casa', usatoNVolte: 1 },
      ] as never);
      mockGetTagMapForTransactions.mockResolvedValueOnce({
        'tx-1': ['tag-1'],
        'tx-2': ['tag-1'],
      });

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        await harness.getValue().removeAccount('conto-1');
      });

      expect(harness.getValue().transactions).toEqual([
        { id: 'tx-2', contoId: 'altro-conto', contoDestinazioneId: undefined },
      ]);
      expect(harness.getValue().transactionTagMap).toEqual({
        'tx-2': ['tag-1'],
      });
      expect(harness.getValue().tags).toEqual([
        { id: 'tag-1', nome: 'Casa', usatoNVolte: 0 },
      ]);
      harness.unmount();
    });

    it('removeTransaction decrementa usatoNVolte dei tag associati rimossi', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockGetAllTransazioni.mockResolvedValueOnce([{ id: 'tx-1' }] as never);
      mockGetAllTag.mockResolvedValueOnce([
        { id: 'tag-1', nome: 'Casa', usatoNVolte: 1 },
      ] as never);
      mockGetTagMapForTransactions.mockResolvedValueOnce({ 'tx-1': ['tag-1'] });

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        await harness.getValue().removeTransaction('tx-1');
      });

      expect(harness.getValue().transactionTagMap).toEqual({});
      expect(harness.getValue().tags).toEqual([
        { id: 'tag-1', nome: 'Casa', usatoNVolte: 0 },
      ]);
      harness.unmount();
    });
  });

  describe('PLAN 011 — bootstrap resiliente', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('Caso 2: online confermato usa timeout nominato di 10 secondi', async () => {
      jest.useFakeTimers();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockGetAllConti.mockImplementation(() => new Promise(() => undefined));

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
      });

      expect(harness.getValue().isLoading).toBe(true);

      await act(async () => {
        jest.advanceTimersByTime(10_000);
        await Promise.resolve();
      });

      expect(harness.getValue().isLoading).toBe(false);
      expect(harness.getValue().error).toBe(strings.bootstrap_timeout_error);
      harness.unmount();
    });

    it('Caso 3: NetInfo non inizializzato attiva il fail-safe dopo 3 secondi', async () => {
      jest.useFakeTimers();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockUseNetworkStatus.mockReturnValue({
        isOffline: false,
        isInitialized: false,
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'unknown',
      } as never);

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockGetAllConti).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(3000);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockGetAllConti).toHaveBeenCalledTimes(1);
      expect(harness.getValue().isDataReady).toBe(true);
      harness.unmount();
    });

    it('Decisione 7-bis: risposta tardiva di NetInfo non avvia una seconda hydration', async () => {
      jest.useFakeTimers();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);

      const networkState = {
        isOffline: false,
        isInitialized: false,
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'unknown',
      };

      mockUseNetworkStatus.mockImplementation(() => networkState as never);

      let resolveConti!: (value: never) => void;
      mockGetAllConti.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveConti = resolve as never;
          }),
      );

      const harness = renderAppDataProvider();

      await act(async () => {
        jest.advanceTimersByTime(3000);
        await Promise.resolve();
      });

      expect(mockGetAllConti).toHaveBeenCalledTimes(1);

      networkState.isInitialized = true;
      networkState.isOffline = true;
      networkState.isConnected = false;
      networkState.isInternetReachable = false;

      harness.rerender();

      expect(mockGetAllConti).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveConti([] as never);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().isDataReady).toBe(true);
      harness.unmount();
    });

    it('ERROR_NETWORK ed ERROR_DATA restano interni e la UI riceve solo messaggi localizzati', async () => {
      jest.useFakeTimers();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      const warnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      mockGetAllConti.mockRejectedValueOnce(new Error('boom'));

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().error).toBe(strings.bootstrap_data_error);
      expect(harness.getValue().error).not.toBe('ERROR_DATA');
      expect(harness.getValue().error).not.toBe('ERROR_NETWORK');
      expect(warnSpy).toHaveBeenCalledWith(
        '[AppDataContext] bootstrap failure',
        expect.objectContaining({ kind: 'ERROR_DATA' }),
      );

      warnSpy.mockRestore();
      harness.unmount();
    });

    it('senza autenticazione i dati non vengono caricati anche con rete disponibile', async () => {
      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockGetAllConti).not.toHaveBeenCalled();
      expect(harness.getValue().isDataReady).toBe(false);
      harness.unmount();
    });
  });

    it('invocazioni concorrenti refreshAll: nessuna doppia applyDomainSnapshot', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);

      let resolveConti!: (value: never) => void;
      mockGetAllConti.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveConti = resolve as never;
          }),
      );

      const harness = renderAppDataProvider();

      // Resolve initial bootstrap to READY
      await act(async () => {
        resolveConti([] as never);
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(harness.getValue().isDataReady).toBe(true);

      // Now prepare mock for refresh
      mockGetAllConti.mockClear();
      mockGetAllConti.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveConti = resolve as never;
          }),
      );

      // Trigger first refreshAll
      await act(async () => {
        harness.getValue().refreshAll();
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(mockGetAllConti).toHaveBeenCalledTimes(1);

      // Trigger second refreshAll concurrently while state is REMOTE-SYNC
      await act(async () => {
        harness.getValue().refreshAll();
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // It should NOT have triggered a second load
      expect(mockGetAllConti).toHaveBeenCalledTimes(1);

      // Complete the first load
      await act(async () => {
        resolveConti([] as never);
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // No double loading or errors
      expect(harness.getValue().isDataReady).toBe(true);
      expect(harness.getValue().isLoading).toBe(false);
      harness.unmount();
    });

    it('hydration A pre-B ma termina dopo: B vince (generation counter)', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'user-A' },
      } as never);

      let resolveA!: (value: any) => void;
      let resolveB!: (value: any) => void;

      mockGetAllConti
        .mockImplementationOnce(() => new Promise(resolve => { resolveA = resolve; }))
        .mockImplementationOnce(() => new Promise(resolve => { resolveB = resolve; }));

      const harness = renderAppDataProvider();

      // Hydration A is in flight. Now log out to transition state to IDLE
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      } as never);
      harness.rerender();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // Now log in as user B
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'user-B' },
      } as never);
      harness.rerender();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // Hydration B is in flight. Let's resolve B first
      await act(async () => {
        resolveB([{ id: 'conto-B', nome: 'B' }]);
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(harness.getValue().accounts).toEqual([{ id: 'conto-B', nome: 'B' }]);

      // Now resolve A (outdated)
      await act(async () => {
        resolveA([{ id: 'conto-A', nome: 'A' }]);
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // Accounts should STILL be B, not A!
      expect(harness.getValue().accounts).toEqual([{ id: 'conto-B', nome: 'B' }]);
      harness.unmount();
    });

    it('React 18 Strict Mode double invoke: nessuna doppia transizione READY', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);

      const harness = renderAppDataProvider();

      // First run has triggered bootstrap
      expect(mockGetAllConti).toHaveBeenCalledTimes(1);

      // Simulate a re-run of useEffect while HYDRATING by changing a dependency
      mockUseNetworkStatus.mockReturnValue({
        isOffline: false,
        isInitialized: true,
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'cellular',
      } as never);
      harness.rerender();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // It should NOT call getAllConti again
      expect(mockGetAllConti).toHaveBeenCalledTimes(1);
      harness.unmount();
    });

    it('hydration invalidata al logout (transizione * → IDLE)', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);

      let resolveConti!: (value: any) => void;
      mockGetAllConti.mockImplementation(
        () =>
          new Promise(resolve => {
            resolveConti = resolve as never;
          }),
      );

      const harness = renderAppDataProvider();

      // Hydration in progress
      expect(harness.getValue().isLoading).toBe(true);

      // Now log out
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      } as never);
      harness.rerender();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // State must be IDLE
      expect(harness.getValue().isLoading).toBe(false);
      expect(harness.getValue().isDataReady).toBe(false);

      // Resolve the old fetch
      await act(async () => {
        resolveConti([{ id: 'conto-1', nome: 'Conto' }]);
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // Data must remain empty
      expect(harness.getValue().accounts).toEqual([]);
      harness.unmount();
    });

  describe('writeCache fail-soft — INV4 (richiede harness Provider)', () => {
    // TODO residui PLAN 011: per coprire questi casi serve una fixture che
    // osservi il flush asincrono post-READY e differenzi gli errori per
    // tabella AsyncStorage. Il mock attuale di cache non espone ancora quel
    // livello di granularità né l'ordine dei side effect background.
    it('errore AsyncStorage.setItem su una tabella: no crash', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockWriteCache.mockRejectedValue(new Error('AsyncStorage error'));

      const harness = renderAppDataProvider();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // Verify we reached READY and didn't crash
      expect(harness.getValue().isDataReady).toBe(true);
      expect(mockWriteCache).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        '[AppDataContext] writeCache fallito',
        expect.any(Object),
      );

      warnSpy.mockRestore();
      harness.unmount();
    });

    it('errore writeCache: no unhandled promise rejection', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      
      const unhandledRejections: any[] = [];
      const handler = (reason: any) => { unhandledRejections.push(reason); };
      const unhandledProcess = (globalThis as any).process;
      if (unhandledProcess) {
        unhandledProcess.on('unhandledRejection', handler);
      }

      mockWriteCache.mockRejectedValue(new Error('writeCache failed'));

      const harness = renderAppDataProvider();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      if (unhandledProcess) {
        unhandledProcess.off('unhandledRejection', handler);
      }

      expect(harness.getValue().isDataReady).toBe(true);
      expect(unhandledRejections).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(
        '[AppDataContext] writeCache fallito',
        expect.any(Object),
      );

      warnSpy.mockRestore();
      harness.unmount();
    });

    it('errore writeCache: no alterazione stato React in memoria', async () => {
      const mockAccounts = [{ id: 'conto-1', nome: 'Conto principale' }];
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockGetAllConti.mockResolvedValueOnce(mockAccounts as never);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockWriteCache.mockRejectedValue(new Error('writeCache failed'));

      const harness = renderAppDataProvider();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(harness.getValue().accounts).toEqual(mockAccounts);

      warnSpy.mockRestore();
      harness.unmount();
    });

    it('errore su una tabella: altre tabelle vengono comunque scritte', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      
      mockWriteCache.mockImplementation(async (_u, table) => {
        if (table === 'conti') {
          throw new Error('conti write failed');
        }
      });

      const harness = renderAppDataProvider();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(mockWriteCache).toHaveBeenCalledWith(USER, 'conti', expect.any(Array));
      expect(mockWriteCache).toHaveBeenCalledWith(USER, 'transazioni', expect.any(Array));
      expect(mockWriteCache).toHaveBeenCalledWith(USER, 'categorie', expect.any(Array));
      
      expect(warnSpy).toHaveBeenCalledWith(
        '[AppDataContext] writeCache fallito',
        expect.objectContaining({ table: 'conti' }),
      );

      warnSpy.mockRestore();
      harness.unmount();
    });
    it('writeCache include i nuovi slice ricorrenze, tag e transazioni_tag quando il bootstrap e READY', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      const ricorrenze = [
        {
          id: 'ric-1',
          contoId: 'conto-1',
          tipo: 'uscita',
          importo: 50,
          descrizione: 'Abbonamento',
          frequenza: 'mensile',
          dataInizio: '2026-05-01',
          prossimaGenerazione: '2026-06-01',
          attiva: true,
        },
      ];
      const transactions = [{ id: 'tx-1' }];
      const tags = [
        {
          id: 'tag-1',
          nome: 'Casa',
          colore: '#112233',
          icona: 'home',
          usatoNVolte: 2,
        },
      ];
      const transactionTagMap = { 'tx-1': ['tag-1'] };
      mockGetAllTransazioni.mockResolvedValueOnce(transactions as never);
      mockGetAllRicorrenze.mockResolvedValueOnce(ricorrenze as never);
      mockGetAllTag.mockResolvedValueOnce(tags as never);
      mockGetTagMapForTransactions.mockResolvedValueOnce(transactionTagMap);

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockWriteCache).toHaveBeenCalledWith(
        USER,
        'ricorrenze',
        ricorrenze,
      );
      expect(mockWriteCache).toHaveBeenCalledWith(USER, 'tag', tags);
      expect(mockWriteCache).toHaveBeenCalledWith(
        USER,
        'transazioni_tag',
        transactionTagMap,
      );
      harness.unmount();
    });

    it('addTagToTransaction aggiorna transactionTagMap e usatoNVolte in memoria', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockGetAllTransazioni.mockResolvedValueOnce([{ id: 'tx-1' }] as never);
      mockGetAllTag.mockResolvedValueOnce([
        { id: 'tag-1', nome: 'Casa', usatoNVolte: 2 },
      ] as never);
      mockGetTagMapForTransactions.mockResolvedValueOnce({ 'tx-1': [] });

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        await harness.getValue().addTagToTransaction('tx-1', 'tag-1');
      });

      expect(harness.getValue().transactionTagMap).toEqual({
        'tx-1': ['tag-1'],
      });
      expect(harness.getValue().tags).toEqual([
        { id: 'tag-1', nome: 'Casa', usatoNVolte: 3 },
      ]);
      harness.unmount();
    });

    it('mutazioni concorrenti addTagToTransaction sulla stessa transazione non perdono aggiornamenti', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
      mockGetAllTransazioni.mockResolvedValueOnce([{ id: 'tx-1' }] as never);
      mockGetAllTag.mockResolvedValueOnce([
        { id: 'tag-1', nome: 'Casa', usatoNVolte: 0 },
        { id: 'tag-2', nome: 'Lavoro', usatoNVolte: 0 },
      ] as never);
      mockGetTagMapForTransactions.mockResolvedValueOnce({ 'tx-1': [] });

      const harness = renderAppDataProvider();

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        await Promise.all([
          harness.getValue().addTagToTransaction('tx-1', 'tag-1'),
          harness.getValue().addTagToTransaction('tx-1', 'tag-2'),
        ]);
      });

      expect(harness.getValue().transactionTagMap).toEqual({
        'tx-1': ['tag-1', 'tag-2'],
      });
      expect(harness.getValue().tags).toEqual([
        { id: 'tag-1', nome: 'Casa', usatoNVolte: 1 },
        { id: 'tag-2', nome: 'Lavoro', usatoNVolte: 1 },
      ]);
      harness.unmount();
    });
  });

  describe('PLAN 009 — handleExportCSV async branching', () => {
    let infoSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
      errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      infoSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('handleExportCSV ritorna Promise<void>', async () => {
      const harness = renderAppDataProvider();
      const transactions = [{ id: 't1' }] as never;
      const accounts = [{ id: 'a1' }] as never;

      const promise = harness
        .getValue()
        .handleExportCSV(transactions, accounts);

      expect(promise).toBeInstanceOf(Promise);
      await expect(promise).resolves.toBeUndefined();
      harness.unmount();
    });

    it('success branch: sound, haptic, toast success e exportFile invocati', async () => {
      const harness = renderAppDataProvider();
      const transactions = [{ id: 't1' }, { id: 't2' }] as never;
      const accounts = [{ id: 'a1' }] as never;

      await act(async () => {
        await harness.getValue().handleExportCSV(transactions, accounts);
      });

      expect(mockExportToCSV).toHaveBeenCalledWith(transactions, accounts, []);
      expect(mockExportFile).toHaveBeenCalledWith(
        'csv-content',
        expect.stringMatching(/^zecchino-export-\d+\.csv$/),
        'text/csv',
      );
      expect(mockSoundPlay).toHaveBeenCalledWith('export');
      expect(mockHapticExport).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalledWith(
        '[toast:success]',
        'Export completato',
        '',
      );
      harness.unmount();
    });

    it('cancelled branch: nessun toast di errore e nessun announce errore', async () => {
      const harness = renderAppDataProvider();
      mockExportFile.mockResolvedValueOnce({
        success: false,
        reason: 'CANCELLED',
      });

      await act(async () => {
        await harness
          .getValue()
          .handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never);
      });

      expect(errorSpy).not.toHaveBeenCalledWith(
        '[toast:error]',
        expect.any(String),
        '',
      );
      expect(mockExportErrorAnnouncement).not.toHaveBeenCalled();
      harness.unmount();
    });

    it('PERMISSION_DENIED -> toast error e announce exportError', async () => {
      const harness = renderAppDataProvider();
      mockExportFile.mockResolvedValueOnce({
        success: false,
        reason: 'PERMISSION_DENIED',
      });

      await act(async () => {
        await harness
          .getValue()
          .handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never);
      });

      expect(errorSpy).toHaveBeenCalledWith(
        '[toast:error]',
        'Permesso negato: concedi accesso allo storage',
        '',
      );
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith(
        'PERMISSION_DENIED',
      );
      harness.unmount();
    });

    it('ALREADY_IN_PROGRESS -> toast error localizzato e announce exportError', async () => {
      const harness = renderAppDataProvider();
      mockExportFile.mockResolvedValueOnce({
        success: false,
        reason: 'ALREADY_IN_PROGRESS',
      });

      await act(async () => {
        await harness
          .getValue()
          .handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never);
      });

      expect(errorSpy).toHaveBeenCalledWith(
        '[toast:error]',
        'Esportazione già in corso. Attendi il completamento.',
        '',
      );
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith(
        'ALREADY_IN_PROGRESS',
      );
      harness.unmount();
    });

    it('FILESYSTEM_ERROR -> toast error e announce exportError', async () => {
      const harness = renderAppDataProvider();
      mockExportFile.mockResolvedValueOnce({
        success: false,
        reason: 'FILESYSTEM_ERROR',
      });

      await act(async () => {
        await harness
          .getValue()
          .handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never);
      });

      expect(errorSpy).toHaveBeenCalledWith(
        '[toast:error]',
        'Errore di scrittura, riprova',
        '',
      );
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith(
        'FILESYSTEM_ERROR',
      );
      harness.unmount();
    });

    it('UNSUPPORTED_PLATFORM -> toast error e announce exportError', async () => {
      const harness = renderAppDataProvider();
      mockExportFile.mockResolvedValueOnce({
        success: false,
        reason: 'UNSUPPORTED_PLATFORM',
      });

      await act(async () => {
        await harness
          .getValue()
          .handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never);
      });

      expect(errorSpy).toHaveBeenCalledWith(
        '[toast:error]',
        'Funzionalità non disponibile su questa piattaforma',
        '',
      );
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith(
        'UNSUPPORTED_PLATFORM',
      );
      harness.unmount();
    });

    it('INVALID_PATH -> toast error e announce exportError', async () => {
      const harness = renderAppDataProvider();
      mockExportFile.mockResolvedValueOnce({
        success: false,
        reason: 'INVALID_PATH',
      });

      await act(async () => {
        await harness
          .getValue()
          .handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never);
      });

      expect(errorSpy).toHaveBeenCalledWith(
        '[toast:error]',
        'Percorso non valido, scegline un altro',
        '',
      );
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith('INVALID_PATH');
      harness.unmount();
    });

    it('INSUFFICIENT_SPACE -> toast error e announce exportError', async () => {
      const harness = renderAppDataProvider();
      mockExportFile.mockResolvedValueOnce({
        success: false,
        reason: 'INSUFFICIENT_SPACE',
      });

      await act(async () => {
        await harness
          .getValue()
          .handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never);
      });

      expect(errorSpy).toHaveBeenCalledWith(
        '[toast:error]',
        'Spazio insufficiente sul dispositivo',
        '',
      );
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith(
        'INSUFFICIENT_SPACE',
      );
      harness.unmount();
    });

    it('UNKNOWN -> toast error e announce exportError generico', async () => {
      const harness = renderAppDataProvider();
      mockExportFile.mockResolvedValueOnce({
        success: false,
        reason: 'UNKNOWN',
      });

      await act(async () => {
        await harness
          .getValue()
          .handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never);
      });

      expect(errorSpy).toHaveBeenCalledWith(
        '[toast:error]',
        "Errore durante l'esportazione",
        '',
      );
      expect(mockExportErrorAnnouncement).toHaveBeenCalledWith('UNKNOWN');
      harness.unmount();
    });

    it('success branch: announceExportFile riceve visibleTransactions.length', async () => {
      const harness = renderAppDataProvider();
      const transactions = [{ id: 't1' }, { id: 't2' }, { id: 't3' }] as never;

      await act(async () => {
        await harness
          .getValue()
          .handleExportCSV(transactions, [{ id: 'a1' }] as never);
      });

      expect(mockAnnounceExportFile).toHaveBeenCalledWith(3);
      expect(mockAnnounce).toHaveBeenCalledWith({
        text: 'export:3',
        priority: 'polite',
      });
      harness.unmount();
    });

    it('error branches: exportError viene invocato per tutti i 7 reason di errore', async () => {
      const harness = renderAppDataProvider();
      const reasons = [
        'ALREADY_IN_PROGRESS',
        'PERMISSION_DENIED',
        'FILESYSTEM_ERROR',
        'UNSUPPORTED_PLATFORM',
        'INVALID_PATH',
        'INSUFFICIENT_SPACE',
        'UNKNOWN',
      ] as const;

      for (const reason of reasons) {
        mockExportFile.mockResolvedValueOnce({ success: false, reason });
        await act(async () => {
          await harness
            .getValue()
            .handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never);
        });
      }

      expect(
        mockExportErrorAnnouncement.mock.calls.map(([reason]) => reason),
      ).toEqual(reasons);
      harness.unmount();
    });

    it('assenza chiamate dirette screenReader: announceSuccess e announceError non vengono invocati', async () => {
      const harness = renderAppDataProvider();
      mockExportFile.mockResolvedValueOnce({
        success: false,
        reason: 'PERMISSION_DENIED',
      });

      await act(async () => {
        await harness
          .getValue()
          .handleExportCSV([{ id: 't1' }] as never, [{ id: 'a1' }] as never);
      });

      expect(mockScreenReaderSuccess).not.toHaveBeenCalled();
      expect(mockScreenReaderError).not.toHaveBeenCalled();
      harness.unmount();
    });
  });

  describe('BUG-5 - hadTransactions in deleteAccount', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('eliminazione di un conto avente transazioni collegate (contoId)', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as any);
      mockGetAllConti.mockResolvedValueOnce([
        { id: 'conto-1', nome: 'Conto A' },
      ] as any);
      mockGetAllTransazioni.mockResolvedValueOnce([
        { id: 'tx-1', contoId: 'conto-1', contoDestinazioneId: undefined },
      ] as any);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        harness.getValue().setDeletingItem({ type: 'account', id: 'conto-1' });
      });

      await act(async () => {
        await harness.getValue().handleDeleteConfirm();
      });

      expect(accountsAnn.announceAccountDeleted).toHaveBeenCalledWith('Conto A', true);
      harness.unmount();
    });

    it('eliminazione di un conto avente transazioni collegate (contoDestinazioneId)', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as any);
      mockGetAllConti.mockResolvedValueOnce([
        { id: 'conto-1', nome: 'Conto A' },
      ] as any);
      mockGetAllTransazioni.mockResolvedValueOnce([
        { id: 'tx-1', contoId: 'conto-2', contoDestinazioneId: 'conto-1' },
      ] as any);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        harness.getValue().setDeletingItem({ type: 'account', id: 'conto-1' });
      });

      await act(async () => {
        await harness.getValue().handleDeleteConfirm();
      });

      expect(accountsAnn.announceAccountDeleted).toHaveBeenCalledWith('Conto A', true);
      harness.unmount();
    });

    it('eliminazione di un conto senza transazioni collegate', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as any);
      mockGetAllConti.mockResolvedValueOnce([
        { id: 'conto-1', nome: 'Conto A' },
      ] as any);
      mockGetAllTransazioni.mockResolvedValueOnce([
        { id: 'tx-1', contoId: 'conto-2', contoDestinazioneId: 'conto-3' },
      ] as any);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        harness.getValue().setDeletingItem({ type: 'account', id: 'conto-1' });
      });

      await act(async () => {
        await harness.getValue().handleDeleteConfirm();
      });

      expect(accountsAnn.announceAccountDeleted).toHaveBeenCalledWith('Conto A', false);
      harness.unmount();
    });
  });

  describe('BUG-1 - mergePrestitiWithLocalSimulations', () => {
    it('lista remota con prestiti validi + cache con simulazioni distinte: verifica che il risultato li contenga tutti', () => {
      const remote = [
        { id: 'p1', controparteNome: 'P1', stato: 'attivo' },
      ] as any;
      const cached = [
        { id: 'sim-1', controparteNome: 'Sim 1', stato: 'simulazione' },
      ] as any;
      const result = mergePrestitiWithLocalSimulations(remote, cached);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(remote[0]);
      expect(result).toContainEqual(cached[0]);
    });

    it('lista remota con un prestito e cache con un elemento con lo stesso ID: verifica che l\'elemento non compaia due volte', () => {
      const remote = [
        { id: 'sim-1', controparteNome: 'Sim 1 Remote', stato: 'simulazione' },
      ] as any;
      const cached = [
        { id: 'sim-1', controparteNome: 'Sim 1 Cache', stato: 'simulazione' },
      ] as any;
      const result = mergePrestitiWithLocalSimulations(remote, cached);
      expect(result).toHaveLength(1);
      expect(result[0].controparteNome).toBe('Sim 1 Remote');
    });

    it('cache null o undefined: verifica che la funzione restituisca la sola lista remota senza errori', () => {
      const remote = [
        { id: 'p1', controparteNome: 'P1', stato: 'attivo' },
      ] as any;
      expect(mergePrestitiWithLocalSimulations(remote, null)).toEqual(remote);
      expect(mergePrestitiWithLocalSimulations(remote, undefined)).toEqual(remote);
    });

    it('cache con un elemento non simulazione (privo di prefisso sim- e stato diverso da simulazione): verifica che venga escluso dal risultato', () => {
      const remote = [] as any;
      const cached = [
        { id: 'p2', controparteNome: 'P2', stato: 'attivo' },
        { id: 'sim-2', controparteNome: 'Sim 2', stato: 'simulazione' },
      ] as any;
      const result = mergePrestitiWithLocalSimulations(remote, cached);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sim-2');
    });

    it('eccezione durante la lettura della cache: verifica che il bootstrap continui con lo snapshot remoto puro', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as any);
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([{ id: 'p-remote', controparteNome: 'Prestito Remoto' }] as any);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      mockReadCache.mockImplementation(async (userId, table) => {
        if (table === 'prestiti_simulazioni') {
          throw new Error('Cache error');
        }
        return null;
      });

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().isDataReady).toBe(true);
      expect(harness.getValue().isLoading).toBe(false);
      expect(harness.getValue().prestiti).toEqual([{ id: 'p-remote', controparteNome: 'Prestito Remoto' }]);
      harness.unmount();
    });
  });

  describe('Commit 3C — AppDataContext CRUD base e test negativi P29', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
    });

    it('ADC-49: addAccount persiste a DB ed aggiorna lo stato React', async () => {
      const accounts = [{ id: 'conto-1', nome: 'Conto A', saldoIniziale: 100, colore: '#fff', icona: 'bank', tipo: 'corrente' }];
      mockGetAllConti.mockResolvedValueOnce(accounts as any);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().accounts).toHaveLength(1);

      const newConto = {
        nome: 'Conto B',
        saldoIniziale: 200,
        colore: '#000',
        icona: 'wallet',
        tipo: 'contanti',
      };
      const savedConto = { ...newConto, id: 'conto-2' };
      mockCreateConto.mockResolvedValueOnce(savedConto);

      await act(async () => {
        await harness.getValue().addAccount(newConto as any);
      });

      expect(mockCreateConto).toHaveBeenCalledWith(newConto);
      expect(harness.getValue().accounts).toHaveLength(2);
      expect(harness.getValue().accounts[1]).toEqual(savedConto);
      harness.unmount();
    });

    it('ADC-50: updateAccount persiste modifiche a DB ed aggiorna lo stato', async () => {
      const initialConto = { id: 'conto-1', nome: 'Conto A', saldoIniziale: 100, colore: '#fff', icona: 'bank', tipo: 'corrente' };
      mockGetAllConti.mockResolvedValueOnce([initialConto] as any);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const updateData = { nome: 'Conto A Modificato' };
      const updatedConto = { ...initialConto, ...updateData };
      mockUpdateConto.mockResolvedValueOnce(updatedConto);

      await act(async () => {
        await harness.getValue().updateAccount('conto-1', updateData);
      });

      expect(mockUpdateConto).toHaveBeenCalledWith('conto-1', updateData);
      expect(harness.getValue().accounts[0].nome).toBe('Conto A Modificato');
      harness.unmount();
    });

    it('ADC-51: removeAccount cancella record a DB ed aggiorna lo stato', async () => {
      const initialConto = { id: 'conto-1', nome: 'Conto A', saldoIniziale: 100, colore: '#fff', icona: 'bank', tipo: 'corrente' };
      mockGetAllConti.mockResolvedValueOnce([initialConto] as any);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockRemoveConto.mockResolvedValueOnce(undefined);

      await act(async () => {
        await harness.getValue().removeAccount('conto-1');
      });

      expect(mockRemoveConto).toHaveBeenCalledWith('conto-1');
      expect(harness.getValue().accounts).toHaveLength(0);
      harness.unmount();
    });

    it('ADC-52: addTransaction ricalcola saldo conto, persiste e aggiorna stato', async () => {
      const initialConto = { id: 'conto-1', nome: 'Conto A', saldoIniziale: 100, colore: '#fff', icona: 'bank', tipo: 'corrente' };
      mockGetAllConti.mockResolvedValueOnce([initialConto] as any);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const newTx = {
        contoId: 'conto-1',
        tipo: 'uscita',
        importo: 30,
        descrizione: 'Spesa',
        data: '2026-06-30',
        categoriaId: 'cat-1',
      };
      const savedTx = { ...newTx, id: 'tx-1' };
      mockCreateTransazione.mockResolvedValueOnce(savedTx);

      await act(async () => {
        await harness.getValue().addTransaction(newTx as any);
      });

      expect(mockCreateTransazione).toHaveBeenCalledWith(newTx);
      expect(harness.getValue().transactions).toHaveLength(1);
      harness.unmount();
    });

    it('ADC-53: updateTransaction ricalcola saldo conto modificato e persiste', async () => {
      const initialConto = { id: 'conto-1', nome: 'Conto A', saldoIniziale: 100, colore: '#fff', icona: 'bank', tipo: 'corrente' };
      const initialTx = { id: 'tx-1', contoId: 'conto-1', tipo: 'uscita', importo: 30, descrizione: 'Spesa', data: '2026-06-30', categoriaId: 'cat-1' };
      mockGetAllConti.mockResolvedValueOnce([initialConto] as any);
      mockGetAllTransazioni.mockResolvedValueOnce([initialTx] as any);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const updateData = { importo: 50 };
      const updatedTx = { ...initialTx, ...updateData };
      mockUpdateTransazione.mockResolvedValueOnce(updatedTx);

      await act(async () => {
        await harness.getValue().updateTransaction('tx-1', updateData);
      });

      expect(mockUpdateTransazione).toHaveBeenCalledWith('tx-1', updateData);
      expect(harness.getValue().transactions[0].importo).toBe(50);
      harness.unmount();
    });

    it('ADC-49b: addAccount fallito - stato invariato per vincolo P29', async () => {
      const accounts = [{ id: 'conto-1', nome: 'Conto A', saldoIniziale: 100, colore: '#fff', icona: 'bank', tipo: 'corrente' }];
      mockGetAllConti.mockResolvedValueOnce(accounts as any);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockCreateConto.mockRejectedValueOnce(new Error('DB offline'));

      const newConto = {
        nome: 'Conto B',
        saldoIniziale: 200,
        colore: '#000',
        icona: 'wallet',
        tipo: 'contanti',
      };

      await expect(
        act(async () => {
          await harness.getValue().addAccount(newConto as any);
        })
      ).rejects.toThrow('DB offline');

      // State remains unchanged
      expect(harness.getValue().accounts).toHaveLength(1);
      harness.unmount();
    });

    it('ADC-53b: updateTransaction fallito - stato e saldi invariati per vincolo P29', async () => {
      const initialConto = { id: 'conto-1', nome: 'Conto A', saldoIniziale: 100, colore: '#fff', icona: 'bank', tipo: 'corrente' };
      const initialTx = { id: 'tx-1', contoId: 'conto-1', tipo: 'uscita', importo: 30, descrizione: 'Spesa', data: '2026-06-30', categoriaId: 'cat-1' };
      mockGetAllConti.mockResolvedValueOnce([initialConto] as any);
      mockGetAllTransazioni.mockResolvedValueOnce([initialTx] as any);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockUpdateTransazione.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        act(async () => {
          await harness.getValue().updateTransaction('tx-1', { importo: 50 });
        })
      ).rejects.toThrow('DB error');

      // State remains unchanged
      expect(harness.getValue().transactions[0].importo).toBe(30);
      harness.unmount();
    });

    it('ADC-56b: CRUD budget fallito - stato invariato per vincolo P29', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);
      mockGetAllBudget.mockResolvedValueOnce([
        { id: 'b-1', categoriaId: 'cat-1', limiteMensile: 200 }
      ] as any);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockCreateBudget.mockRejectedValueOnce(new Error('DB offline'));

      const newBudget = {
        categoriaId: 'cat-2',
        limiteMensile: 300,
      };

      await expect(
        act(async () => {
          await harness.getValue().addBudget(newBudget as any);
        })
      ).rejects.toThrow('DB offline');

      // State remains unchanged
      expect(harness.getValue().budgets).toHaveLength(1);
      harness.unmount();
    });
  });

  describe('Commit 4 — AppDataContext CRUD e prestiti', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: USER },
      } as never);
    });

    it('ADC-54: CRUD Movimenti - removeTransaction ricalcola saldo ed elimina record a DB', async () => {
      const initialConto = { id: 'conto-1', nome: 'Conto A', saldoIniziale: 100, colore: '#fff', icona: 'bank', tipo: 'corrente' };
      const initialTx = { id: 'tx-1', contoId: 'conto-1', tipo: 'uscita', importo: 30, descrizione: 'Spesa', data: '2026-06-30', categoriaId: 'cat-1' };
      mockGetAllConti.mockResolvedValueOnce([initialConto] as any);
      mockGetAllTransazioni.mockResolvedValueOnce([initialTx] as any);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockRemoveTransazione.mockResolvedValueOnce(undefined);

      await act(async () => {
        await harness.getValue().removeTransaction('tx-1');
      });

      expect(mockRemoveTransazione).toHaveBeenCalledWith('tx-1');
      expect(harness.getValue().transactions).toHaveLength(0);
      harness.unmount();
    });

    it('ADC-55: CRUD Categorie - CRUD categorie aggiorna correttamente stato locale e DB', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);
      const initialCat = { id: 'cat-1', nome: 'Cibo', colore: '#f00', icona: 'food', tipo: 'uscita' };
      mockGetAllCategorie.mockResolvedValueOnce([initialCat] as any);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().categories).toHaveLength(1);

      // Add Category
      const newCat = { nome: 'Salute', colore: '#0f0', icona: 'heart', tipo: 'uscita' };
      const savedCat = { ...newCat, id: 'cat-2' };
      mockCreateCategoria.mockResolvedValueOnce(savedCat);

      await act(async () => {
        await harness.getValue().addCategory(newCat as any);
      });

      expect(mockCreateCategoria).toHaveBeenCalledWith(newCat);
      expect(harness.getValue().categories).toHaveLength(2);

      // Update Category
      const updatedCat = { ...savedCat, nome: 'Medicina' };
      mockUpdateCategoria.mockResolvedValueOnce(updatedCat);

      await act(async () => {
        await harness.getValue().updateCategory('cat-2', { nome: 'Medicina' });
      });

      expect(mockUpdateCategoria).toHaveBeenCalledWith('cat-2', { nome: 'Medicina' });
      expect(harness.getValue().categories[1].nome).toBe('Medicina');

      // Remove Category
      mockRemoveCategoria.mockResolvedValueOnce(undefined);

      await act(async () => {
        await harness.getValue().removeCategory('cat-2');
      });

      expect(mockRemoveCategoria).toHaveBeenCalledWith('cat-2');
      expect(harness.getValue().categories).toHaveLength(1);
      harness.unmount();
    });

    it('ADC-56: CRUD Budget - CRUD budget aggiorna correttamente stato locale e DB', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);
      const initialBudget = { id: 'b-1', categoriaId: 'cat-1', limiteMensile: 100 };
      mockGetAllBudget.mockResolvedValueOnce([initialBudget] as any);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().budgets).toHaveLength(1);

      // Add Budget
      const newBudget = { categoriaId: 'cat-2', limiteMensile: 200 };
      const savedBudget = { ...newBudget, id: 'b-2' };
      mockCreateBudget.mockResolvedValueOnce(savedBudget);

      await act(async () => {
        await harness.getValue().addBudget(newBudget as any);
      });

      expect(mockCreateBudget).toHaveBeenCalledWith(newBudget);
      expect(harness.getValue().budgets).toHaveLength(2);

      // Update Budget
      const updatedBudget = { ...savedBudget, limiteMensile: 250 };
      mockUpdateBudget.mockResolvedValueOnce(updatedBudget);

      await act(async () => {
        await harness.getValue().updateBudget('b-2', { limiteMensile: 250 });
      });

      expect(mockUpdateBudget).toHaveBeenCalledWith('b-2', { limiteMensile: 250 });
      expect(harness.getValue().budgets[1].limiteMensile).toBe(250);

      // Remove Budget
      mockRemoveBudget.mockResolvedValueOnce(undefined);

      await act(async () => {
        await harness.getValue().removeBudget('b-2');
      });

      expect(mockRemoveBudget).toHaveBeenCalledWith('b-2');
      expect(harness.getValue().budgets).toHaveLength(1);
      harness.unmount();
    });

    it('ADC-57: CRUD Obiettivi - CRUD obiettivi ed avanzamento progressi persistono a DB', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);
      const initialGoal = { id: 'g-1', nome: 'Auto', importoTarget: 5000, importoAccumulato: 100, scadenza: '2026-12-31' };
      mockGetAllObiettivi.mockResolvedValueOnce([initialGoal] as any);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().savingsGoals).toHaveLength(1);

      // Add Savings Goal
      const newGoal = { nome: 'Vacanza', importoTarget: 1000, importoAccumulato: 50, scadenza: '2026-08-31' };
      const savedGoal = { ...newGoal, id: 'g-2' };
      mockCreateObiettivo.mockResolvedValueOnce(savedGoal);

      await act(async () => {
        await harness.getValue().addSavingsGoal(newGoal as any);
      });

      expect(mockCreateObiettivo).toHaveBeenCalledWith(newGoal);
      expect(harness.getValue().savingsGoals).toHaveLength(2);

      // Update Savings Goal
      const updatedGoal = { ...savedGoal, importoTarget: 1200 };
      mockUpdateObiettivo.mockResolvedValueOnce(updatedGoal);

      await act(async () => {
        await harness.getValue().updateSavingsGoal('g-2', { importoTarget: 1200 });
      });

      expect(mockUpdateObiettivo).toHaveBeenCalledWith('g-2', { importoTarget: 1200 });
      expect(harness.getValue().savingsGoals[1].importoTarget).toBe(1200);

      // Update Progress
      const progressGoal = { ...updatedGoal, importoAccumulato: 200 };
      mockUpdateObiettivoProgress.mockResolvedValueOnce(progressGoal);

      await act(async () => {
        await harness.getValue().updateSavingsGoalProgress('g-2', 150);
      });

      expect(mockUpdateObiettivoProgress).toHaveBeenCalledWith('g-2', 150);
      expect(harness.getValue().savingsGoals[1].importoAccumulato).toBe(200);

      // Remove Goal
      mockRemoveObiettivo.mockResolvedValueOnce(undefined);

      await act(async () => {
        await harness.getValue().removeSavingsGoal('g-2');
      });

      expect(mockRemoveObiettivo).toHaveBeenCalledWith('g-2');
      expect(harness.getValue().savingsGoals).toHaveLength(1);
      harness.unmount();
    });

    it('ADC-58: CRUD Tag - creazione, modifica ed eliminazione fisica tag persistono a DB', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([{ id: 'tag-1', nome: 'Lavoro', usatoNVolte: 0 }] as any);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(harness.getValue().tags).toHaveLength(1);

      // Add Tag
      const newTag = { nome: 'Spese', colore: '#00f', icona: 'tag' };
      const savedTag = { ...newTag, id: 'tag-2', usatoNVolte: 0 };
      mockCreateTag.mockResolvedValueOnce(savedTag);

      await act(async () => {
        await harness.getValue().addTag(newTag as any);
      });

      expect(mockCreateTag).toHaveBeenCalledWith(newTag);
      expect(harness.getValue().tags).toHaveLength(2);

      // Update Tag
      const updatedTag = { ...savedTag, nome: 'Divertimento' };
      mockUpdateTag.mockResolvedValueOnce(updatedTag);

      await act(async () => {
        await harness.getValue().updateTag('tag-2', { nome: 'Divertimento' });
      });

      expect(mockUpdateTag).toHaveBeenCalledWith('tag-2', { nome: 'Divertimento' });
      expect(harness.getValue().tags[1].nome).toBe('Divertimento');

      // Remove Tag
      mockRemoveTag.mockResolvedValueOnce(undefined);

      await act(async () => {
        await harness.getValue().removeTag('tag-2');
      });

      expect(mockRemoveTag).toHaveBeenCalledWith('tag-2');
      expect(harness.getValue().tags).toHaveLength(1);
      harness.unmount();
    });

    it('ADC-59: Associazione Tag - addTagToTransaction crea record mapping e incrementa usatoNVolte', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([{ id: 'tx-1' }] as any);
      mockGetAllTag.mockResolvedValueOnce([{ id: 'tag-1', nome: 'Lavoro', usatoNVolte: 1 }] as any);
      mockGetTagMapForTransactions.mockResolvedValueOnce({ 'tx-1': [] });
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        await harness.getValue().addTagToTransaction('tx-1', 'tag-1');
      });

      expect(harness.getValue().transactionTagMap['tx-1']).toEqual(['tag-1']);
      expect(harness.getValue().tags[0].usatoNVolte).toBe(2);
      harness.unmount();
    });

    it('ADC-60: Associazione Tag - removeTagFromTransaction rimuove record mapping e decrementa usatoNVolte', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([{ id: 'tx-1' }] as any);
      mockGetAllTag.mockResolvedValueOnce([{ id: 'tag-1', nome: 'Lavoro', usatoNVolte: 3 }] as any);
      mockGetTagMapForTransactions.mockResolvedValueOnce({ 'tx-1': ['tag-1'] });
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        await harness.getValue().removeTagFromTransaction('tx-1', 'tag-1');
      });

      expect(harness.getValue().transactionTagMap['tx-1']).toEqual([]);
      expect(harness.getValue().tags[0].usatoNVolte).toBe(2);
      harness.unmount();
    });

    it('ADC-61: Associazione Tag - setTagsForTransaction calcola differenze, aggiorna mapping e contatori', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([{ id: 'tx-1' }] as any);
      mockGetAllTag.mockResolvedValueOnce([
        { id: 'tag-1', nome: 'Lavoro', usatoNVolte: 1 },
        { id: 'tag-2', nome: 'Casa', usatoNVolte: 1 },
      ] as any);
      mockGetTagMapForTransactions.mockResolvedValueOnce({ 'tx-1': ['tag-1'] });
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        await harness.getValue().setTagsForTransaction('tx-1', ['tag-2']);
      });

      expect(harness.getValue().transactionTagMap['tx-1']).toEqual(['tag-2']);
      expect(harness.getValue().tags.find(t => t.id === 'tag-1')?.usatoNVolte).toBe(0);
      expect(harness.getValue().tags.find(t => t.id === 'tag-2')?.usatoNVolte).toBe(2);
      harness.unmount();
    });

    it('ADC-62: Propagazione Tag - eliminazione transazione riduce usatoNVolte di tutti i tag associati', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([{ id: 'tx-1' }] as any);
      mockGetAllTag.mockResolvedValueOnce([{ id: 'tag-1', nome: 'Lavoro', usatoNVolte: 2 }] as any);
      mockGetTagMapForTransactions.mockResolvedValueOnce({ 'tx-1': ['tag-1'] });
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockRemoveTransazione.mockResolvedValueOnce(undefined);

      await act(async () => {
        await harness.getValue().removeTransaction('tx-1');
      });

      expect(harness.getValue().tags[0].usatoNVolte).toBe(1);
      harness.unmount();
    });

    it('ADC-63: Propagazione Tag - eliminazione conto riduce usatoNVolte dei tag delle sue transazioni', async () => {
      const initialConto = { id: 'conto-1', nome: 'Conto A', saldoIniziale: 100, colore: '#fff', icona: 'bank', tipo: 'corrente' };
      const tx1 = { id: 'tx-1', contoId: 'conto-1', tipo: 'uscita', importo: 30, descrizione: 'Spesa', data: '2026-06-30', categoriaId: 'cat-1' };
      mockGetAllConti.mockResolvedValueOnce([initialConto] as any);
      mockGetAllTransazioni.mockResolvedValueOnce([tx1] as any);
      mockGetAllTag.mockResolvedValueOnce([{ id: 'tag-1', nome: 'Lavoro', usatoNVolte: 2 }] as any);
      mockGetTagMapForTransactions.mockResolvedValueOnce({ 'tx-1': ['tag-1'] });
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockRemoveConto.mockResolvedValueOnce(undefined);

      await act(async () => {
        await harness.getValue().removeAccount('conto-1');
      });

      expect(harness.getValue().tags[0].usatoNVolte).toBe(1);
      harness.unmount();
    });

    it('ADC-64: Prestiti Simulati - creazione prestito simulato (ID sim-) scrive solo in cache locale', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const newSim = {
        controparteNome: 'Simulato',
        importoIniziale: 1000,
        tassoAnnuo: 3,
        durataMesi: 12,
        dataInizio: '2026-07-01',
        tipo: 'prestito',
        stato: 'simulazione',
      };

      let result: any;
      await act(async () => {
        result = await harness.getValue().addPrestito(newSim as any);
      });

      expect(result.id).toMatch(/^sim-/);
      expect(mockCreatePrestitoDb).not.toHaveBeenCalled();
      expect(harness.getValue().prestiti).toContainEqual(result);
      harness.unmount();
    });

    it('ADC-65: Prestiti Simulati - modifica simulazione aggiorna solo lo stato in cache locale', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      // Add a simulation first
      let sim: any;
      await act(async () => {
        sim = await harness.getValue().addPrestito({
          controparteNome: 'Simulato',
          importoIniziale: 1000,
          tassoAnnuo: 3,
          durataMesi: 12,
          dataInizio: '2026-07-01',
          tipo: 'prestito',
          stato: 'simulazione',
        } as any);
      });

      mockUpdatePrestitoDb.mockClear();

      // Modify simulation
      let updated: any;
      await act(async () => {
        updated = await harness.getValue().updatePrestito(sim.id, { controparteNome: 'Modificato' });
      });

      expect(mockUpdatePrestitoDb).not.toHaveBeenCalled();
      expect(harness.getValue().prestiti.find(p => p.id === sim.id)?.controparteNome).toBe('Modificato');
      harness.unmount();
    });

    it('ADC-66: Promozione Prestito - promozione a contratto genera UUID, scrive a DB ed elimina sim- da cache', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      // Add simulation
      let sim: any;
      await act(async () => {
        sim = await harness.getValue().addPrestito({
          controparteNome: 'Simulato',
          importoIniziale: 1000,
          tassoAnnuo: 3,
          durataMesi: 12,
          dataInizio: '2026-07-01',
          tipo: 'prestito',
          stato: 'simulazione',
        } as any);
      });

      const uuidReal = 'real-uuid-12345';
      const promoted = { ...sim, id: uuidReal, stato: 'attivo' };
      mockCreatePrestitoDb.mockResolvedValueOnce(promoted);

      await act(async () => {
        await harness.getValue().promotePrestito(sim.id);
      });

      expect(mockCreatePrestitoDb).toHaveBeenCalled();
      expect(harness.getValue().prestiti.some(p => p.id === sim.id)).toBe(false);
      expect(harness.getValue().prestiti.find(p => p.id === uuidReal)).toEqual(promoted);
      harness.unmount();
    });

    it('ADC-67: Prestiti Attivi - chiusura prestito attivo persiste i flag a DB Supabase', async () => {
      const activeLoan = { id: 'real-loan-1', controparteNome: 'Banca', importoIniziale: 10000, stato: 'attivo', tipo: 'mutuo', dataInizio: '2026-01-01' };
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([activeLoan] as any);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const closedLoan = { ...activeLoan, stato: 'chiuso' };
      mockClosePrestitoDb.mockResolvedValueOnce(closedLoan);

      await act(async () => {
        await harness.getValue().closePrestito('real-loan-1');
      });

      expect(mockClosePrestitoDb).toHaveBeenCalledWith('real-loan-1');
      expect(harness.getValue().prestiti[0].stato).toBe('chiuso');
      harness.unmount();
    });

    it('ADC-68: Prestiti Simulati - rimozione prestito simulato cancella record da cache locale', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      let sim: any;
      await act(async () => {
        sim = await harness.getValue().addPrestito({
          controparteNome: 'Simulato',
          importoIniziale: 1000,
          stato: 'simulazione',
          tipo: 'prestito',
          dataInizio: '2026-07-01',
        } as any);
      });

      await act(async () => {
        await harness.getValue().deletePrestitoSimulazione(sim.id);
      });

      expect(harness.getValue().prestiti.some(p => p.id === sim.id)).toBe(false);
      harness.unmount();
    });

    it('ADC-69: Rimborsi Prestiti - aggiunta rimborso su prestito attivo ricalcola residuo e aggiorna DB', async () => {
      const activeLoan = { id: 'real-loan-1', controparteNome: 'Banca', importoIniziale: 10000, saldoResiduo: 10000, stato: 'attivo', tipo: 'mutuo', dataInizio: '2026-01-01' };
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([activeLoan] as any);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const newRimborso = { prestitoId: 'real-loan-1', importo: 1000, dataRimborso: '2026-06-30' };
      const savedRimborso = { ...newRimborso, id: 'rimb-1' };
      mockAddRimborsoDb.mockResolvedValueOnce(savedRimborso);

      await act(async () => {
        await harness.getValue().addRimborso(newRimborso);
      });

      expect(mockAddRimborsoDb).toHaveBeenCalledWith(newRimborso);
      expect(harness.getValue().prestitiRimborsi).toContainEqual(savedRimborso);
      harness.unmount();
    });

    it('ADC-70: Rimborsi Prestiti - rimborso estintivo aggiorna automaticamente lo stato prestito in chiuso', async () => {
      const activeLoan = { id: 'real-loan-1', controparteNome: 'Banca', importoIniziale: 1000, saldoResiduo: 1000, stato: 'attivo', tipo: 'mutuo', dataInizio: '2026-01-01' };
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([activeLoan] as any);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const newRimborso = { prestitoId: 'real-loan-1', importo: 1000, dataRimborso: '2026-06-30' };
      const savedRimborso = { ...newRimborso, id: 'rimb-1' };
      mockAddRimborsoDb.mockResolvedValueOnce(savedRimborso);

      await act(async () => {
        await harness.getValue().addRimborso(newRimborso);
      });

      expect(harness.getValue().prestiti[0].stato).toBe('chiuso');
      harness.unmount();
    });

    it('ADC-71: Rimborsi Prestiti - eliminazione rimborso ricalcola residuo incrementandolo e aggiorna DB', async () => {
      const closedLoan = { id: 'real-loan-1', controparteNome: 'Banca', importoIniziale: 1000, saldoResiduo: 0, stato: 'chiuso', tipo: 'mutuo', dataInizio: '2026-01-01' };
      const initialRimborso = { id: 'rimb-1', prestitoId: 'real-loan-1', importo: 1000, dataRimborso: '2026-06-30' };
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([closedLoan] as any);
      mockGetAllRimborsi.mockResolvedValueOnce([initialRimborso] as any);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockDeleteRimborsoDb.mockResolvedValueOnce(undefined);

      await act(async () => {
        await harness.getValue().removeRimborso('rimb-1');
      });

      expect(mockDeleteRimborsoDb).toHaveBeenCalledWith('rimb-1');
      expect(harness.getValue().prestitiRimborsi).toHaveLength(0);
      expect(harness.getValue().prestiti[0].stato).toBe('attivo');
      harness.unmount();
    });

    it('ADC-72: Rimborsi Simulazioni - inserimento rimborso su simulazione bloccato con errore', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      let sim: any;
      await act(async () => {
        sim = await harness.getValue().addPrestito({
          controparteNome: 'Simulato',
          importoIniziale: 1000,
          stato: 'simulazione',
          tipo: 'prestito',
          dataInizio: '2026-07-01',
        } as any);
      });

      await expect(
        act(async () => {
          await harness.getValue().addRimborso({ prestitoId: sim.id, importo: 100, dataRimborso: '2026-07-05' });
        })
      ).rejects.toThrow('Impossibile rimborsare una simulazione.');
      harness.unmount();
    });

    it('ADC-73: Rimborsi Simulazioni - eliminazione rimborso su simulazione bloccato con errore', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockDeleteRimborsoDb.mockClear();
      await act(async () => {
        await harness.getValue().removeRimborso('sim-rimb-1');
      });

      expect(mockDeleteRimborsoDb).not.toHaveBeenCalled();
      harness.unmount();
    });
  });

  describe('Commit 5 — AppDataContext dialoghi, export e alert', () => {
    it('ADC-74: Dialogs - openNewTransactionDialog and openEditTransactionDialog update showTransactionDialog and editingTransaction', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        harness.getValue().openNewTransactionDialog();
      });
      expect(harness.getValue().showTransactionDialog).toBe(true);
      expect(harness.getValue().editingTransaction).toBeUndefined();

      const tx = { id: 'tx-1', importo: 100, tipo: 'uscita' } as any;
      await act(async () => {
        harness.getValue().openEditTransactionDialog(tx);
      });
      expect(harness.getValue().showTransactionDialog).toBe(true);
      expect(harness.getValue().editingTransaction).toEqual(tx);
      harness.unmount();
    });

    it('ADC-75: Dialogs - showBudgetDialog and editingBudget state setters work', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        harness.getValue().setShowBudgetDialog(true);
      });
      expect(harness.getValue().showBudgetDialog).toBe(true);

      const budget = { id: 'b-1', limiteMensile: 500 } as any;
      await act(async () => {
        harness.getValue().setEditingBudget(budget);
      });
      expect(harness.getValue().editingBudget).toEqual(budget);
      harness.unmount();
    });

    it('ADC-76: Dialogs - showAccountDialog and editingAccount state setters work', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        harness.getValue().setShowAccountDialog(true);
      });
      expect(harness.getValue().showAccountDialog).toBe(true);

      const account = { id: 'a-1', nome: 'Conto' } as any;
      await act(async () => {
        harness.getValue().setEditingAccount(account);
      });
      expect(harness.getValue().editingAccount).toEqual(account);
      harness.unmount();
    });

    it('ADC-77: Dialogs - showSavingsGoalDialog and editingSavingsGoal state setters work and handleAddFundsToGoal sets goal', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        harness.getValue().setShowSavingsGoalDialog(true);
      });
      expect(harness.getValue().showSavingsGoalDialog).toBe(true);

      const goal = { id: 'g-1', nome: 'Obiettivo' } as any;
      await act(async () => {
        harness.getValue().setEditingSavingsGoal(goal);
      });
      expect(harness.getValue().editingSavingsGoal).toEqual(goal);

      await act(async () => {
        harness.getValue().handleAddFundsToGoal(goal);
      });
      expect(harness.getValue().showSavingsGoalDialog).toBe(true);
      expect(harness.getValue().editingSavingsGoal).toEqual(goal);
      harness.unmount();
    });

    it('ADC-78: Dialogs - showKeyboardHelp state setter works and showDeleteDialog controls delete confirm flow', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        harness.getValue().setShowKeyboardHelp(true);
      });
      expect(harness.getValue().showKeyboardHelp).toBe(true);

      await act(async () => {
        harness.getValue().setDeletingItem({ type: 'budget', id: 'b-1' });
        harness.getValue().setShowDeleteDialog(true);
      });
      expect(harness.getValue().deletingItem).toEqual({ type: 'budget', id: 'b-1' });
      expect(harness.getValue().showDeleteDialog).toBe(true);

      mockRemoveBudget.mockResolvedValueOnce(undefined);
      await act(async () => {
        await harness.getValue().handleDeleteConfirm();
      });
      expect(mockRemoveBudget).toHaveBeenCalledWith('b-1');
      harness.unmount();
    });

    it('ADC-79: CSV Export - success plays sound, haptic, toast, and triggers exportFile', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockExportFile.mockResolvedValueOnce({ success: true });
      const spyInfo = jest.spyOn(console, 'info').mockImplementation(() => {});

      await act(async () => {
        await harness.getValue().handleExportCSV([], [], []);
      });

      expect(mockExportFile).toHaveBeenCalled();
      expect(soundSystem.play).toHaveBeenCalledWith('export');
      expect(hapticSystem.export).toHaveBeenCalled();
      expect(spyInfo).toHaveBeenCalledWith('[toast:success]', expect.any(String), expect.any(String));

      spyInfo.mockRestore();
      harness.unmount();
    });

    it('ADC-80: CSV Export - failure reasons (like PERMISSION_DENIED) trigger error toast and announce', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockExportFile.mockResolvedValueOnce({ success: false, reason: 'PERMISSION_DENIED' });
      const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        await harness.getValue().handleExportCSV([], [], []);
      });

      expect(spyError).toHaveBeenCalledWith('[toast:error]', expect.any(String), expect.any(String));
      expect(announce).toHaveBeenCalled();

      spyError.mockRestore();
      harness.unmount();
    });

    it('ADC-81: Budget Alerts - warning level plays warning sound, warning haptic, and info toast', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const mockNotification = {
        id: 'notif-warning',
        letta: false,
        titolo_key: 'notification_budget_warning_title',
        messaggio_key: 'notification_budget_warning_desc',
        livello: 'warning',
      };
      mockProcessBudgetNotifications.mockResolvedValueOnce([mockNotification]);
      mockCreateTransazione.mockResolvedValueOnce({ id: 'tx-new', importo: 50, tipo: 'uscita', contoId: 'c-1' });

      const spyInfo = jest.spyOn(console, 'info').mockImplementation(() => {});
      soundSystem.play.mockClear();
      hapticSystem.budgetWarning.mockClear();

      await act(async () => {
        await harness.getValue().handleSaveTransaction({ importo: 50, tipo: 'uscita', contoId: 'c-1' } as any);
      });

      expect(soundSystem.play).toHaveBeenCalledWith('budget-warning');
      expect(hapticSystem.budgetWarning).toHaveBeenCalled();
      expect(spyInfo).toHaveBeenCalledWith('[toast]', expect.any(String), expect.any(String));

      spyInfo.mockRestore();
      harness.unmount();
    });

    it('ADC-82: Budget Alerts - critical level plays critical sound, critical haptic, and warning toast', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const mockNotification = {
        id: 'notif-critical',
        letta: false,
        titolo_key: 'notification_budget_critical_title',
        messaggio_key: 'notification_budget_critical_desc',
        livello: 'critical',
      };
      mockProcessBudgetNotifications.mockResolvedValueOnce([mockNotification]);
      mockCreateTransazione.mockResolvedValueOnce({ id: 'tx-new', importo: 50, tipo: 'uscita', contoId: 'c-1' });

      const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      soundSystem.play.mockClear();
      hapticSystem.budgetCritical.mockClear();

      await act(async () => {
        await harness.getValue().handleSaveTransaction({ importo: 50, tipo: 'uscita', contoId: 'c-1' } as any);
      });

      expect(soundSystem.play).toHaveBeenCalledWith('budget-critical');
      expect(hapticSystem.budgetCritical).toHaveBeenCalled();
      expect(spyWarn).toHaveBeenCalledWith('[toast:warning]', expect.any(String), expect.any(String));

      spyWarn.mockRestore();
      harness.unmount();
    });

    it('ADC-83: Budget Alerts - exceeded level plays exceeded sound, exceeded haptic, and error toast', async () => {
      mockGetAllConti.mockResolvedValueOnce([]);
      mockGetAllTransazioni.mockResolvedValueOnce([]);
      mockGetAllTag.mockResolvedValueOnce([]);
      mockGetTagMapForTransactions.mockResolvedValueOnce({});
      mockGetAllPrestiti.mockResolvedValueOnce([]);
      mockGetAllRimborsi.mockResolvedValueOnce([]);

      const harness = renderAppDataProvider();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const mockNotification = {
        id: 'notif-exceeded',
        letta: false,
        titolo_key: 'notification_budget_exceeded_title',
        messaggio_key: 'notification_budget_exceeded_desc',
        livello: 'exceeded',
      };
      mockProcessBudgetNotifications.mockResolvedValueOnce([mockNotification]);
      mockCreateTransazione.mockResolvedValueOnce({ id: 'tx-new', importo: 50, tipo: 'uscita', contoId: 'c-1' });

      const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
      soundSystem.play.mockClear();
      hapticSystem.budgetExceeded.mockClear();

      await act(async () => {
        await harness.getValue().handleSaveTransaction({ importo: 50, tipo: 'uscita', contoId: 'c-1' } as any);
      });

      expect(soundSystem.play).toHaveBeenCalledWith('budget-exceeded');
      expect(hapticSystem.budgetExceeded).toHaveBeenCalled();
      expect(spyError).toHaveBeenCalledWith('[toast:error]', expect.any(String), expect.any(String));

      spyError.mockRestore();
      harness.unmount();
    });
  });

  afterAll(() => {
    try {
      const shadowPath = path.resolve(__dirname, '../src/context/AppDataContext.test-shadow.tsx');
      if (fs.existsSync(shadowPath)) {
        fs.unlinkSync(shadowPath);
      }
    } catch (e) {}
  });
});
